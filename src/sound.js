// Sound effects: ZzFX sounds (see zzfx.js), built once into buffers and played
// through one Web Audio context. Adapted from Loop of the Recursive Dragon.
//
// A sound is only worth playing at the moment it belongs to, so the audio is
// kept ready ahead of it: every press wakes it (so it is running by the time
// the answer that press leads to wants a sound), and a sound that cannot start
// at once is dropped rather than played late.

import { buildSamples, ZZFX_SAMPLE_RATE } from "./zzfx.js";

/**
 * Every sound, as ZzFX parameters: [volume, randomness, frequency, attack,
 * sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump,
 * pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume,
 * decay, tremolo, filter]. Paste one into https://killedbyapixel.github.io/ZzFX
 * to hear or reshape it.
 * @type {Record<string, (number | undefined)[]>}
 */
export const SFX = {
  // The fight: each plays on the stage beat that shows it (sfxFor in stage.js).
  swing: [.5, .05, 520, .01, .02, .11, 0, 1, -3, , , , , 1.6], // the hero lunges
  charged: [.6, .05, 640, .01, .04, .16, 0, 1, -2, , 380, .05, , 1.2], // ...on a streak
  hit: [1, .05, 300, 0, .03, .17, 2, 1.4, -1.5, , , , , .8, , .05], // the blow lands on the monster
  claw: [.7, .05, 170, .01, .05, .16, 2, 1, -.5, , , , , 2.2], // the monster strikes back
  hurt: [.8, .05, 420, 0, .04, .2, 2, 1, -2], // ...and lands on the hero
  defeat: [1, .05, 260, .01, .12, .5, 4, 1, -.3, , , , , .4, , .2], // a monster vanishes
  down: [.8, 0, 380, .02, .35, .55, 2, 1, -.6], // the hero is knocked out
  revive: [.7, 0, 330, .03, .3, .25, 1, 1, , , 82.5, .09, .09], // ...and gets back up
  heal: [.6, 0, 520, .05, .2, .3, 0, 1, 1], // health comes back
  stuck: [.6, 0, 660, .01, .12, .25, 1, 1, , , 330, .06, .08], // something from days ago was remembered
  levelUp: [.8, 0, 392, .01, .36, .2, 1, 1, , , 98, .09, .09],
  // Outside the fight.
  victory: [1, 0, 330, .02, .5, .2, 1, 1, , , 165, .15, .15, , , , .12],
  click: [.2, .05, 1500, .002, .004, .02, 0, 1], // a button, kept well under the fight
};

const MASTER = 0.3; // ZzFX's own master volume
const IDLE_MS = 120000; // no press for this long: let the audio sleep, so the device can too
const LATE_MS = 120; // a sound still waiting on the audio device after this long is dropped

export class SoundSystem {
  constructor() {
    /** @type {AudioContext | null} */
    this._ctx = null;
    this._enabled = true;
    /** @type {GainNode | null} */
    this._master = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this._idle = undefined;
    /** @type {Map<string, AudioBuffer>} */
    this._buffers = new Map();
    // Capture phase, so the audio starts waking before the press's own handler
    // runs. A click counts too: iOS only lets audio start from one.
    const wake = () => this._wake();
    for (const type of ["pointerdown", "keydown", "click"]) {
      globalThis.document?.addEventListener?.(type, wake, { capture: true, passive: true });
    }
  }

  get enabled() { return this._enabled; }
  set enabled(on) {
    this._enabled = on;
    if (on) this._wake();
    else this._sleep();
  }

  /**
   * Play a sound from SFX.
   * @param {string} name
   */
  play(name) {
    const params = SFX[name];
    if (params) this._start(ctx => this._source(ctx, this._buffer(ctx, name), nudge(params)));
  }

  /** Create or resume the audio, and restart the idle clock. Returns the context, or null. */
  _wake() {
    if (!this._enabled) return null;
    try {
      if (!this._ctx) {
        const Context = globalThis.AudioContext ?? /** @type {any} */ (globalThis).webkitAudioContext;
        if (!Context) return null;
        const ctx = new Context({ latencyHint: "interactive" });
        this._ctx = ctx;
        // Build every sound now, off the press that woke the audio, so none is built as it plays.
        setTimeout(() => { for (const name in SFX) this._buffer(ctx, name); }, 0);
      }
      const ctx = this._ctx;
      if (ctx.state !== "running") ctx.resume().catch(() => {});
      clearTimeout(this._idle);
      this._idle = setTimeout(() => this._sleep(), IDLE_MS);
      return ctx;
    } catch {
      return null;
    }
  }

  _sleep() {
    clearTimeout(this._idle);
    if (this._ctx?.state === "running") this._ctx.suspend().catch(() => {});
  }

  /**
   * Run `fn(ctx)` now if the audio is running, or as soon as it wakes, unless that is too late.
   * @param {(ctx: AudioContext) => void} fn
   */
  _start(fn) {
    const ctx = this._wake();
    if (!ctx) return;
    try {
      if (ctx.state === "running") return fn(ctx);
      const asked = performance.now();
      ctx.resume().then(() => { if (performance.now() - asked <= LATE_MS) fn(ctx); }).catch(() => {});
    } catch {
      // No sound is better than a broken game.
    }
  }

  /**
   * @param {AudioContext} ctx
   * @param {string} name
   */
  _buffer(ctx, name) {
    let buffer = this._buffers.get(name);
    if (!buffer) this._buffers.set(name, buffer = toBuffer(ctx, SFX[name]));
    return buffer;
  }

  /**
   * @param {AudioContext} ctx
   * @param {AudioBuffer} buffer
   * @param {number} rate
   */
  _source(ctx, buffer, rate) {
    if (!this._master) {
      this._master = ctx.createGain();
      this._master.gain.value = MASTER;
      this._master.connect(ctx.destination);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    src.connect(this._master);
    src.start();
  }
}

/**
 * The samples, built without ZzFX's pitch randomness: that comes from nudge() on each play.
 * @param {AudioContext} ctx
 * @param {(number | undefined)[]} params
 */
function toBuffer(ctx, params) {
  const p = [...params];
  p[1] = 0;
  const samples = buildSamples(...p);
  const buffer = ctx.createBuffer(1, Math.max(1, samples.length), ZZFX_SAMPLE_RATE);
  buffer.getChannelData(0).set(samples);
  return buffer;
}

/**
 * A playback rate a little off 1, by up to the sound's randomness, so a repeated sound isn't identical.
 * @param {(number | undefined)[]} params
 */
function nudge(params) {
  const randomness = params[1] ?? .05;
  return 1 + randomness * (Math.random() * 2 - 1);
}
