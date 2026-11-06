// The sound system's care for timing: a sound belongs to the moment it is for,
// so the audio is kept awake (and never quite silent) while the game is played,
// and let sleep when nobody could hear it.

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SoundSystem } from "../src/sound.js";

/** Just enough of an AudioContext to see what the sound system asks of one. */
class FakeContext {
  constructor() {
    this.state = "suspended";
    this.sampleRate = 48000;
    this.destination = { speakers: true };
    /** @type {any[]} */
    this.sources = [];
    FakeContext.made.push(this);
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  suspend() { this.state = "suspended"; return Promise.resolve(); }
  createBuffer(_channels, length) {
    const data = new Float32Array(length);
    return { length, getChannelData: () => data };
  }
  createGain() { return { gain: { value: 1 }, connect() {} }; }
  createBufferSource() {
    const src = { playbackRate: { value: 1 }, loop: false, started: false, to: null, connect(to) { src.to = to; }, start() { src.started = true; } };
    this.sources.push(src);
    return src;
  }
}
/** @type {FakeContext[]} */
FakeContext.made = [];

describe("sound timing", () => {
  /** @type {EventTarget & { hidden?: boolean }} */
  let page;
  /** @type {SoundSystem} */
  let sound;
  const saved = { document: globalThis.document, AudioContext: globalThis.AudioContext };
  const press = () => page.dispatchEvent(new Event("pointerdown"));

  beforeEach(() => {
    FakeContext.made = [];
    page = Object.assign(new EventTarget(), { hidden: false });
    globalThis.document = /** @type {any} */ (page);
    globalThis.AudioContext = /** @type {any} */ (FakeContext);
    sound = new SoundSystem();
  });

  afterEach(() => {
    sound.enabled = false; // stops the idle clock, so the test can end
    globalThis.document = saved.document;
    globalThis.AudioContext = saved.AudioContext;
  });

  it("keeps the output from ever going silent while it is awake, too quietly to hear", () => {
    press();
    const [ctx] = FakeContext.made;
    assert.ok(ctx, "a press wakes the audio");
    const keep = ctx.sources.find(src => src.loop);
    assert.ok(keep?.started, "something plays from the moment the audio wakes");
    assert.equal(keep.to, ctx.destination);
    const samples = keep.buffer.getChannelData(0);
    const level = samples[0];
    assert.ok(samples.every(s => s === level), "a steady level, with no pitch");
    assert.notEqual(Math.round(level * 32768), 0, "not silence, even to 16-bit output");
    assert.ok(20 * Math.log10(level) < -80, "far below hearing");
  });

  it("plays sounds alongside it, and keeps only the one context", async () => {
    press();
    sound.play("swing");
    press();
    sound.play("hit");
    assert.equal(FakeContext.made.length, 1);
    await Promise.resolve();
    const [ctx] = FakeContext.made;
    assert.equal(ctx.sources.filter(src => src.loop).length, 1);
    assert.equal(ctx.sources.filter(src => !src.loop && src.started).length, 2);
  });

  it("lets the audio sleep while the page is hidden, and wakes it with the next press", () => {
    press();
    const [ctx] = FakeContext.made;
    assert.equal(ctx.state, "running");
    page.hidden = true;
    page.dispatchEvent(new Event("visibilitychange"));
    assert.equal(ctx.state, "suspended");
    page.hidden = false;
    page.dispatchEvent(new Event("visibilitychange"));
    assert.equal(ctx.state, "suspended", "coming back is not a press");
    press();
    assert.equal(ctx.state, "running");
  });

  it("sleeps when the sound is turned off, and no press wakes it", () => {
    press();
    const [ctx] = FakeContext.made;
    sound.enabled = false;
    assert.equal(ctx.state, "suspended");
    press();
    assert.equal(ctx.state, "suspended");
  });
});
