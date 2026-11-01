// The battle stage's choreography: what a round looks like as a sequence of
// beats, and what it says in words. Kept apart from the page so the order can
// be tested; src/ui/stage_view.js plays the beats. Adapted from the stage in
// Loop of the Recursive Dragon.
//
// A beat is { at, who, act, text?, tone? }: `at` ms after the round starts,
// the hero or the monster does `act`, and `text` floats up from it, coloured
// by `tone`. The acts:
//   attack  lunge forward in the attack pose
//   hit     recoil from a blow
//   vanish  a monster's defeat: a flash, and it is gone
//   down    the hero is knocked out
//   revive  the hero gets back up
//   glow    health comes back, or the hero levels up
//   drop    the treasure a beaten monster leaves pops out of it

/** @import { Round } from "./battle.js" */

/**
 * @typedef {object} Beat
 * @property {number} at
 * @property {"hero" | "monster"} who
 * @property {"attack" | "hit" | "vanish" | "down" | "revive" | "glow" | "drop"} act
 * @property {string} [text]
 * @property {"hit" | "hurt" | "heal" | "gold" | "item"} [tone]
 * @property {boolean} [charged]  an attack on a streak, which glows
 */

/** How long each act takes, in ms. */
export const BEAT = {
  strike: 180, // from the start of an attack to the moment it lands
  attack: 420, // a whole lunge, out and back
  hit: 380,
  vanish: 650,
  down: 550,
  revive: 700,
  glow: 700,
  gap: 80, // between one move and the next
  settle: 150, // a breath before the next question
};

/**
 * What one round looks like on the stage.
 * @param {Round} round
 * @returns {{ beats: Beat[], end: number }}  end: when it is all over
 */
export function planRound(round) {
  /** @type {Beat[]} */
  const beats = [];
  let end = 0;

  if (round.correct) {
    beats.push({ at: 0, who: "hero", act: "attack", charged: round.streakMultiplier > 1 });
    const lands = BEAT.strike;
    const blow = `-${round.heroDamage}`;
    if (round.defeatedFoe) {
      beats.push({ at: lands, who: "monster", act: "vanish", text: blow, tone: "hit" });
      end = lands + BEAT.vanish;
      if (round.drop) beats.push({ at: lands + BEAT.vanish / 2, who: "monster", act: "drop", text: round.drop.emoji, tone: "item" });
    } else {
      beats.push({ at: lands, who: "monster", act: "hit", text: blow, tone: "hit" });
      end = Math.max(lands + BEAT.hit, BEAT.attack);
    }
    // Health coming back shows once the monster is going: a win heals a
    // little, a new level heals everything.
    if (round.leveledUp || round.healed > 0) {
      const at = round.defeatedFoe ? lands + BEAT.vanish / 2 + BEAT.gap : end + BEAT.gap;
      beats.push(round.leveledUp
        ? { at, who: "hero", act: "glow", text: "Level up!", tone: "gold" }
        : { at, who: "hero", act: "glow", text: `+${round.healed}`, tone: "heal" });
      end = Math.max(end, at + BEAT.glow);
    }
  } else {
    beats.push({ at: 0, who: "monster", act: "attack" });
    beats.push({ at: BEAT.strike, who: "hero", act: "hit", text: `-${round.foeDamage}`, tone: "hurt" });
    end = Math.max(BEAT.strike + BEAT.hit, BEAT.attack);
    if (round.knockedOut) {
      beats.push({ at: end, who: "hero", act: "down" });
      end += BEAT.down + 2 * BEAT.gap;
      beats.push({ at: end, who: "hero", act: "revive", text: "Back up!", tone: "gold" });
      end += BEAT.revive;
    }
  }
  return { beats, end: end + BEAT.settle };
}

/**
 * The sound a beat makes: a name in SFX (src/sound.js).
 * @param {Beat} beat
 * @returns {string}
 */
export function sfxFor(beat) {
  const hero = beat.who === "hero";
  switch (beat.act) {
    case "attack": return hero ? (beat.charged ? "charged" : "swing") : "claw";
    case "hit": return hero ? "hurt" : "hit";
    case "vanish": return "defeat";
    case "glow": return beat.tone === "gold" ? "levelUp" : "heal";
    case "down": case "revive": case "drop": return beat.act;
  }
}

/**
 * The round in a sentence or two, for screen readers and for anyone who
 * looked away: "Ninja Cat hits Sneaky Duck for 25. Sneaky Duck is beaten!"
 * @param {Round} round
 * @param {{ hero: string, monster: string }} names  the monster is the one that was fought
 */
export function narrate(round, { hero, monster }) {
  if (!round.correct) {
    const hit = `${monster} hits ${hero} for ${round.foeDamage}.`;
    return round.knockedOut ? `${hit} ${hero} is knocked out, but gets right back up!` : hit;
  }
  const streak = round.streakMultiplier > 1 ? " A streak makes it extra strong!" : "";
  const parts = [`${hero} hits ${monster} for ${round.heroDamage}.${streak}`];
  if (round.defeatedFoe) parts.push(`${monster} is beaten!`);
  if (round.drop) parts.push(`It leaves behind a treasure: ${round.drop.name}.`);
  if (round.leveledUp) parts.push(`${hero} levels up!`);
  else if (round.healed > 0) parts.push(`${hero} gets ${round.healed} health back.`);
  return parts.join(" ");
}
