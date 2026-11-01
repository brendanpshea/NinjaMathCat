// The battle stage on the page: the hero and the monster facing off over a
// backdrop, each with a nameplate and a health bar, acting out each round as
// src/stage.js plans it. Adapted from the stage in Loop of the Recursive Dragon.
//
// Each side is an actor, which is what moves (lunges, recoils, falls), holding
// a sprite, which is what it looks like: one pose of a strip of three (stand,
// attack, recoil), picked by data-pose. Strips are drawn facing right, so the
// monster's is mirrored. The animations are in css/stage.css.

import { planRound, narrate, BEAT } from "../stage.js";
import { heroStats, monsterStats } from "../combat.js";
import { heroSprite } from "../heroes.js";
import { monsterSprite } from "../monsters.js";

/** @import { Battle, Round } from "../battle.js" */
/** @import { Hero } from "../heroes.js" */
/** @import { Beat } from "../stage.js" */

/** The backdrops in assets/backgrounds/, background_01.png onward; each monster gets the next. */
const BACKDROPS = 10;

/**
 * How big a monster stands, by tier: the first ones are small, the last loom.
 * @param {number} tier
 */
export function monsterSize(tier) {
  return 0.85 + 0.1 * (tier - 1);
}

/** @type {Map<string, Promise<number>>} */
const aspects = new Map();

/**
 * The width-to-height shape of one frame of a strip of three, once the strip has loaded.
 * @param {string} url
 * @returns {Promise<number>}
 */
function frameAspect(url) {
  let loading = aspects.get(url);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / 3 / img.naturalHeight);
      img.onerror = reject;
      img.src = url;
    });
    // A failed load must not be remembered as the answer.
    loading.catch(() => aspects.delete(url));
    aspects.set(url, loading);
  }
  return loading;
}

/** @param {"hero" | "monster"} side */
const combatant = side => `
  <div class="combatant combatant--${side}" data-ref="${side}Side">
    <div class="plate"><span class="plate-name" data-ref="${side}Name"></span><span class="plate-level" data-ref="${side}Level"></span></div>
    <div class="hp" role="meter" aria-valuemin="0" aria-label="${side === "hero" ? "Your health" : "Monster's health"}" data-ref="${side}Hp">
      <div class="hp-fill"></div><span class="hp-text"></span>
    </div>
    <div class="sprite-slot"><div class="actor" data-ref="${side}Actor"><div class="sprite" role="img" data-pose="stand" data-ref="${side}Sprite"></div></div></div>
  </div>`;

/**
 * Build the stage inside an empty element.
 * @param {HTMLElement} root
 */
export function createStage(root) {
  root.classList.add("stage");
  root.innerHTML = `<div class="stage-backdrop" data-ref="backdrop"></div>${combatant("hero")}${combatant("monster")}
    <p class="stage-news" aria-live="polite" data-ref="news"></p>`;
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));

  /** @type {ReturnType<typeof setTimeout>[]} */
  let timers = [];
  /** Which monster is on stage, so a new one can step in. */
  let shownFoe = "";

  /**
   * @param {HTMLElement} el
   * @param {string} url
   * @param {string} label
   */
  function setSprite(el, url, label) {
    el.setAttribute("aria-label", label);
    if (el.dataset.src === url) return;
    el.dataset.src = url;
    el.style.backgroundImage = `url("${url}")`;
    el.classList.remove("is-ready");
    frameAspect(url).then(aspect => {
      if (el.dataset.src !== url) return;
      el.style.setProperty("--frame-aspect", aspect.toFixed(4));
      el.classList.add("is-ready");
    }).catch(() => {}); // a missing file leaves an empty spot; the name and health still say who is there
  }

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
   * Text that floats up from a fighter: damage, health, a treasure. It hangs
   * on the slot rather than the actor, so it stays put while the actor moves
   * and stays visible when a beaten monster fades.
   * @param {HTMLElement} sprite
   * @param {string} text
   * @param {string} tone
   */
  function floatText(sprite, text, tone) {
    const span = document.createElement("span");
    span.className = `float-text float-text--${tone}`;
    span.textContent = text;
    span.setAttribute("aria-hidden", "true");
    span.style.left = `${sprite.offsetLeft + sprite.offsetWidth / 2}px`;
    /** @type {HTMLElement} */ (sprite.closest(".sprite-slot")).append(span);
    // animationend never comes when animations are off, so a timer backs it up.
    const remove = () => span.remove();
    span.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, 1200);
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
    setSprite(ref("heroSprite"), heroSprite(hero), `You, ${hero.name}`);
    setHp("hero", battle.hero.hp, heroStats(battle.hero.level).maxHp);

    const { foe } = battle;
    ref("monsterSide").hidden = !foe;
    if (!foe) return;
    const actor = ref("monsterActor");
    const sprite = ref("monsterSprite");
    ref("monsterName").textContent = foe.monster.name;
    ref("monsterLevel").textContent = `Level ${foe.level}`;
    setSprite(sprite, monsterSprite(foe.monster), foe.monster.name);
    setHp("monster", foe.hp, monsterStats(foe.level).maxHp);
    actor.style.setProperty("--size", monsterSize(foe.monster.tier).toFixed(2));

    const key = `${battle.beaten}:${foe.monster.id}`;
    if (key !== shownFoe) {
      shownFoe = key;
      actor.classList.remove("is-vanquished");
      sprite.dataset.pose = "stand";
      const backdrop = String((battle.beaten % BACKDROPS) + 1).padStart(2, "0");
      ref("backdrop").style.backgroundImage = `url("assets/backgrounds/background_${backdrop}.png")`;
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
    const foeMax = before.foe ? monsterStats(before.foe.level).maxHp : 0;
    if (beat.text) floatText(sprite, beat.text, beat.tone ?? "hit");
    switch (beat.act) {
      case "attack":
        animate(actor, beat.charged ? ["is-lunging", "is-charged"] : ["is-lunging"], BEAT.attack);
        pose(sprite, "attack", BEAT.attack - 60);
        break;
      case "hit":
        animate(actor, ["is-hit"], BEAT.hit);
        pose(sprite, "recoil", BEAT.hit);
        if (isHero) setHp("hero", Math.max(0, before.hero.hp - round.foeDamage), heroMax);
        else setHp("monster", Math.max(0, (before.foe?.hp ?? 0) - round.heroDamage), foeMax);
        break;
      case "vanish":
        sprite.dataset.pose = "recoil";
        actor.classList.add("is-vanquished"); // and it stays gone until the next one steps in
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
        setHp("hero", after.hero.hp, heroStats(after.hero.level).maxHp);
        ref("heroLevel").textContent = `Level ${after.hero.level}`;
        break;
      case "drop":
        break; // the treasure floats up as the beat's text
    }
  }

  /**
   * Act out a round, from the battle before it to the battle after. Resolves
   * when it is over; at once if there is nothing to show, or the reader has
   * asked for less motion.
   * @param {Round} round
   * @param {Battle} before
   * @param {Battle} after
   * @param {Hero} hero
   * @returns {Promise<void>}
   */
  function play(round, before, after, hero) {
    timers.forEach(clearTimeout);
    timers = [];
    if (before.foe) ref("news").textContent = narrate(round, { hero: hero.name, monster: before.foe.monster.name });
    const plan = planRound(round);
    if (plan.end === 0 || reducedMotion()) {
      show(after, hero);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      for (const beat of plan.beats) timers.push(setTimeout(() => playBeat(beat, round, before, after), beat.at));
      timers.push(setTimeout(() => {
        show(after, hero);
        resolve();
      }, plan.end));
    });
  }

  return { show, play };
}
