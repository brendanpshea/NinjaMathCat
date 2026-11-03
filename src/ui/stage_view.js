// The battle stage on the page: the hero and the monster facing off over a
// backdrop, each with a nameplate and a health bar, acting out each round as
// src/stage.js plans it. Adapted from the stage in Loop of the Recursive Dragon.
//
// Each side is an actor, which is what moves (lunges, recoils, falls), holding
// a figure: the fighter's size, its shadow on the ground, and its sprite, which
// is what it looks like: one pose of a strip of three (stand, attack, recoil),
// picked by data-pose. Strips are drawn facing right, so the monster's is
// mirrored. The fighters stand on the backdrop's floor line. The animations
// are in css/stage.css.

import { planRound, narrate, BEAT } from "../stage.js";
import { heroStats, monsterStats } from "../combat.js";
import { heroSprite } from "../heroes.js";
import { monsterSprite } from "../monsters.js";
import { backdropFor } from "../backdrops.js";
import { setStrip } from "./sprites.js";

/** @import { Battle, Round } from "../battle.js" */
/** @import { Hero } from "../heroes.js" */
/** @import { Beat } from "../stage.js" */

/**
 * How big a monster stands, by tier: the first ones are small, the last loom.
 * @param {number} tier
 */
export function monsterSize(tier) {
  return 0.85 + 0.1 * (tier - 1);
}

/** @param {"hero" | "monster"} side */
const combatant = side => `
  <div class="combatant combatant--${side}" data-ref="${side}Side">
    <div class="plate"><span class="plate-name" data-ref="${side}Name"></span><span class="plate-level" data-ref="${side}Level"></span></div>
    <div class="hp" role="meter" aria-valuemin="0" aria-label="${side === "hero" ? "Your health" : "Monster's health"}" data-ref="${side}Hp">
      <div class="hp-lag"></div><div class="hp-fill"></div><span class="hp-text"></span>
    </div>
    <div class="sprite-slot"><div class="actor" data-ref="${side}Actor"><div class="figure">
      <span class="shadow"></span><div class="sprite" role="img" data-pose="stand" data-ref="${side}Sprite"></div>
    </div></div></div>
  </div>`;

/**
 * Build the stage inside an empty element.
 * @param {HTMLElement} root
 */
export function createStage(root) {
  root.classList.add("stage-frame");
  root.innerHTML = `<div class="stage"><div class="stage-backdrop" data-ref="backdrop"></div>${combatant("hero")}${combatant("monster")}
    <p class="stage-news" aria-live="polite" data-ref="news"></p></div>`;
  const stageEl = /** @type {HTMLElement} */ (root.firstElementChild);
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));

  /** @type {ReturnType<typeof setTimeout>[]} */
  let timers = [];
  /** Which monster is on stage, so a new one can step in. */
  let shownFoe = "";

  /**
   * @param {"hero" | "monster"} side
   * @param {number} hp
   * @param {number} max
   */
  function setHp(side, hp, max) {
    const bar = ref(`${side}Hp`);
    const share = max > 0 ? hp / max : 0;
    bar.style.setProperty("--hp", share.toFixed(3));
    bar.dataset.level = share > 0.5 ? "high" : share > 0.25 ? "mid" : "low";
    bar.setAttribute("aria-valuenow", String(hp));
    bar.setAttribute("aria-valuemax", String(max));
    /** @type {HTMLElement} */ (bar.querySelector(".hp-text")).textContent = `${hp} / ${max}`;
  }

  /**
   * Restart a CSS animation by class, and take the classes off when it is done.
   * @param {HTMLElement} el
   * @param {string[]} classes
   * @param {number} ms
   */
  function animate(el, classes, ms) {
    el.classList.remove(...classes);
    void el.offsetWidth; // so adding the class again starts it over
    el.classList.add(...classes);
    timers.push(setTimeout(() => el.classList.remove(...classes), ms));
  }

  /**
   * Hold a sprite in a pose for a while, then back to standing.
   * @param {HTMLElement} sprite
   * @param {string} pose
   * @param {number} ms
   */
  function pose(sprite, pose, ms) {
    sprite.dataset.pose = pose;
    timers.push(setTimeout(() => { if (sprite.dataset.pose === pose) sprite.dataset.pose = "stand"; }, ms));
  }

  /**
   * Something that shows for a moment over a fighter, hung on its slot rather
   * than the actor, so it stays put while the actor moves and stays visible
   * when a beaten monster fades. Gone when its animation ends.
   * @param {HTMLElement} sprite
   * @param {string} className
   * @param {{ text?: string, middle?: boolean, style?: Record<string, string> }} [options]
   *   middle: centred on the fighter, rather than near its top
   */
  function overlay(sprite, className, { text = "", middle = false, style = {} } = {}) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    span.setAttribute("aria-hidden", "true");
    const slot = /** @type {HTMLElement} */ (sprite.closest(".sprite-slot"));
    const [box, frame] = [sprite.getBoundingClientRect(), slot.getBoundingClientRect()];
    span.style.left = `${box.left - frame.left + box.width / 2}px`;
    if (middle) span.style.top = `${box.top - frame.top + box.height / 2}px`;
    for (const [name, value] of Object.entries(style)) span.style.setProperty(name, value);
    slot.append(span);
    // animationend never comes when animations are off, so a timer backs it up.
    const remove = () => span.remove();
    span.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, 1200);
  }

  /**
   * Text that floats up from a fighter: damage, health, a treasure, a strike's name.
   * @param {HTMLElement} sprite
   * @param {string} text
   * @param {string} tone
   * @param {boolean} [big]  a blow on a streak
   */
  function floatText(sprite, text, tone, big = false) {
    overlay(sprite, `float-text float-text--${tone}${big ? " float-text--big" : ""}`, { text });
  }

  /**
   * Where a blow lands: a burst of light on the one it hits, bigger on a streak.
   * @param {HTMLElement} sprite
   * @param {boolean} big
   */
  function impact(sprite, big) {
    overlay(sprite, `impact${big ? " impact--big" : ""}`, { middle: true });
  }

  /**
   * Sparks flying out from a fighter, for a monster beaten or a new level.
   * @param {HTMLElement} sprite
   * @param {string} color
   */
  function sparks(sprite, color) {
    for (let i = 0; i < 12; i++) {
      overlay(sprite, "spark", { middle: true, style: { "--angle": `${i * 30 + (i % 2) * 12}deg`, "--reach": (0.4 + (i % 3) * 0.12).toFixed(2), "--spark": color } });
    }
  }

  /**
   * Words across the middle of the stage, for a moment: a streak's strike.
   * @param {string} text
   */
  function callout(text) {
    const span = document.createElement("span");
    span.className = "stage-callout";
    span.textContent = text;
    span.setAttribute("aria-hidden", "true");
    stageEl.append(span);
    const remove = () => span.remove();
    span.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, 1200);
  }

  /**
   * The whole stage shakes with a blow: a little, or a lot.
   * @param {"shake" | "quake"} how
   */
  function shake(how) {
    animate(stageEl, [how === "quake" ? "is-quaking" : "is-shaking"], how === "quake" ? 420 : 260);
  }

  function reducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }

  /**
   * Show a battle as it stands, with no animation except a new monster stepping in.
   * @param {Battle} battle
   * @param {Hero} hero
   */
  function show(battle, hero) {
    const heroActor = ref("heroActor");
    heroActor.classList.remove("is-down");
    ref("heroSprite").dataset.pose = "stand";
    ref("heroName").textContent = hero.name;
    ref("heroLevel").textContent = `Level ${battle.hero.level}`;
    setStrip(ref("heroSprite"), heroSprite(hero), `You, ${hero.name}`);
    setHp("hero", battle.hero.hp, heroStats(battle.hero.level).maxHp);

    const { foe } = battle;
    ref("monsterSide").hidden = !foe;
    if (!foe) return;
    const actor = ref("monsterActor");
    const sprite = ref("monsterSprite");
    ref("monsterName").textContent = foe.monster.name;
    ref("monsterLevel").textContent = `Level ${foe.level}`;
    setStrip(sprite, monsterSprite(foe.monster), foe.monster.name);
    setHp("monster", foe.hp, monsterStats(foe.level, foe.toughness).maxHp);
    actor.style.setProperty("--size", monsterSize(foe.monster.tier).toFixed(2));

    const key = `${battle.beaten}:${foe.monster.id}`;
    if (key !== shownFoe) {
      shownFoe = key;
      actor.classList.remove("is-vanquished");
      sprite.dataset.pose = "stand";
      const backdrop = backdropFor(foe.monster.setting);
      ref("backdrop").style.backgroundImage = `url("${backdrop.file}")`;
      // On the stage itself, which sets its own --floor that would hide one on the frame.
      stageEl.style.setProperty("--floor", String(backdrop.floor));
      stageEl.dataset.setting = backdrop.id;
      if (!reducedMotion()) animate(actor, ["is-entering"], 400);
    }
  }

  /**
   * One beat of a round.
   * @param {Beat} beat
   * @param {Round} round
   * @param {Battle} before
   * @param {Battle} after
   */
  function playBeat(beat, round, before, after) {
    const isHero = beat.who === "hero";
    const actor = ref(isHero ? "heroActor" : "monsterActor");
    const sprite = ref(isHero ? "heroSprite" : "monsterSprite");
    const heroMax = heroStats(before.hero.level).maxHp;
    const foeMax = before.foe ? monsterStats(before.foe.level, before.foe.toughness).maxHp : 0;
    // A streak's strike is named across the middle of the stage, where it has room on a phone.
    if (beat.text && beat.act === "attack") callout(beat.text);
    else if (beat.text) floatText(sprite, beat.text, beat.tone ?? "hit", beat.charged && beat.who === "monster");
    switch (beat.act) {
      case "attack":
        animate(actor, beat.charged ? ["is-lunging", "is-charged"] : ["is-lunging"], BEAT.attack);
        pose(sprite, "attack", BEAT.attack - 60);
        break;
      case "hit":
        animate(actor, ["is-hit"], BEAT.hit);
        pose(sprite, "recoil", BEAT.hit);
        impact(sprite, Boolean(beat.charged));
        if (isHero) {
          // The hero's blow lands on the monster; the monster's makes the whole stage flinch.
          animate(stageEl, ["is-hurt"], 450);
          shake("shake");
          setHp("hero", Math.max(0, before.hero.hp - round.foeDamage), heroMax);
        } else {
          shake(beat.charged ? "quake" : "shake");
          setHp("monster", Math.max(0, (before.foe?.hp ?? 0) - round.heroDamage), foeMax);
        }
        break;
      case "vanish":
        sprite.dataset.pose = "recoil";
        actor.classList.add("is-vanquished"); // and it stays gone until the next one steps in
        impact(sprite, true);
        sparks(sprite, "#fde047");
        shake("quake");
        setHp("monster", 0, foeMax);
        break;
      case "down":
        sprite.dataset.pose = "recoil";
        actor.classList.add("is-down"); // and stays down until it gets back up
        setHp("hero", 0, heroMax);
        break;
      case "revive":
        actor.classList.remove("is-down");
        sprite.dataset.pose = "stand";
        animate(actor, ["is-reviving"], BEAT.revive);
        setHp("hero", after.hero.hp, heroStats(after.hero.level).maxHp);
        break;
      case "glow":
        actor.dataset.tone = beat.tone ?? "heal";
        animate(actor, ["is-glowing"], BEAT.glow);
        if (beat.tone === "gold") sparks(sprite, "#fcd34d"); // a new level
        setHp("hero", after.hero.hp, heroStats(after.hero.level).maxHp);
        ref("heroLevel").textContent = `Level ${after.hero.level}`;
        break;
      case "stuck":
        actor.dataset.tone = "gold";
        animate(actor, ["is-glowing"], BEAT.glow);
        sparks(sprite, "#7dd3fc"); // brighter than a level's gold, and not to be mistaken for it
        break;
    }
  }

  /**
   * Act out a round, from the battle before it to the battle after. Resolves
   * when it is over; at once if there is nothing to show, or the reader has
   * asked for less motion. `onBeat` hears each beat as it plays, for sound;
   * with less motion it still hears them, at their times, since sound is not
   * motion.
   * @param {Round} round
   * @param {Battle} before
   * @param {Battle} after
   * @param {Hero} hero
   * @param {{ onBeat?: (beat: Beat) => void }} [options]
   * @returns {Promise<void>}
   */
  function play(round, before, after, hero, { onBeat } = {}) {
    timers.forEach(clearTimeout);
    timers = [];
    if (before.foe) ref("news").textContent = narrate(round, { hero: hero.name, monster: before.foe.monster.name });
    const plan = planRound(round);
    if (plan.end === 0 || reducedMotion()) {
      if (onBeat) for (const beat of plan.beats) timers.push(setTimeout(() => onBeat(beat), beat.at));
      show(after, hero);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      for (const beat of plan.beats) {
        timers.push(setTimeout(() => {
          playBeat(beat, round, before, after);
          onBeat?.(beat);
        }, beat.at));
      }
      timers.push(setTimeout(() => {
        show(after, hero);
        resolve();
      }, plan.end));
    });
  }

  return { show, play };
}
