// tests/stage.test.js — the battle stage's choreography (src/stage.js): what a
// round looks like as a sequence of beats, and what it says in words.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planRound, narrate, sfxFor, BEAT } from "../src/stage.js";
import { startBattle, answer } from "../src/battle.js";
import { MONSTERS } from "../src/monsters.js";
import { TREASURES } from "../src/treasures.js";
import { createRng } from "../src/rng.js";

/** A round where nothing happened; override what did. */
const round = (over = {}) => ({
  correct: true, heroDamage: 0, foeDamage: 0, streakMultiplier: 1, defeatedFoe: false, knockedOut: false,
  healed: 0, xpGained: 0, leveledUp: false, drop: null, then: "next", hint: null, answer: null, ...over,
});

/** The beats as "who act", in time order, so a sequence reads at a glance. */
const story = plan => [...plan.beats].sort((a, b) => a.at - b.at).map(b => `${b.who} ${b.act}`);

describe("a right answer", () => {
  it("has the hero strike and the monster reel, partway into the lunge", () => {
    const plan = planRound(round({ heroDamage: 25 }));
    assert.deepEqual(story(plan), ["hero attack", "monster hit"]);
    assert.equal(plan.beats[1].at, BEAT.strike);
    assert.equal(plan.beats[1].text, "-25");
    assert.ok(plan.end >= BEAT.attack);
  });

  it("glows on a streak", () => {
    assert.equal(planRound(round({ heroDamage: 30, streakMultiplier: 1.5 })).beats[0].charged, true);
    assert.equal(planRound(round({ heroDamage: 20 })).beats[0].charged, false);
  });

  it("beats a monster: it vanishes, drops its treasure, and the hero heals while it goes", () => {
    const plan = planRound(round({ heroDamage: 25, defeatedFoe: true, drop: TREASURES[0], healed: 25 }));
    assert.deepEqual(story(plan), ["hero attack", "monster vanish", "monster drop", "hero glow"]);
    const [, vanish, drop, glow] = [...plan.beats].sort((a, b) => a.at - b.at);
    assert.equal(drop.text, TREASURES[0].emoji);
    assert.equal(glow.text, "+25");
    assert.ok(drop.at > vanish.at && glow.at > drop.at);
    assert.ok(plan.end >= glow.at + BEAT.glow);
  });

  it("celebrates a new level instead of the heal it brings", () => {
    const plan = planRound(round({ heroDamage: 25, leveledUp: true, healed: 60 }));
    assert.deepEqual(story(plan), ["hero attack", "monster hit", "hero glow"]);
    assert.equal(plan.beats[2].text, "Level up!");
  });
});

describe("a wrong answer", () => {
  it("has the monster strike and the hero reel", () => {
    const plan = planRound(round({ correct: false, foeDamage: 15 }));
    assert.deepEqual(story(plan), ["monster attack", "hero hit"]);
    assert.equal(plan.beats[1].text, "-15");
    assert.equal(plan.beats[1].tone, "hurt");
  });

  it("knocks the hero down and back up, in that order, after the blow", () => {
    const plan = planRound(round({ correct: false, foeDamage: 15, knockedOut: true }));
    assert.deepEqual(story(plan), ["monster attack", "hero hit", "hero down", "hero revive"]);
    const [, hit, down, revive] = plan.beats;
    assert.ok(down.at >= hit.at + BEAT.hit - BEAT.strike && revive.at >= down.at + BEAT.down);
  });
});

describe("every round of a real battle", () => {
  it("plans beats in time, each within the round", () => {
    const rng = createRng(3);
    let battle = startBattle(rng, { grade: 2, adventure: MONSTERS.slice(0, 4) });
    for (let i = 0; i < 200 && battle.question; i++) {
      const q = battle.question;
      const choice = i % 3 === 0 ? q.choices.find(c => c !== q.answer && !battle.ruledOut.includes(c)) : q.answer;
      const result = answer(battle, choice, rng);
      const plan = planRound(result.round);
      assert.ok(plan.beats.length >= 2);
      for (const beat of plan.beats) assert.ok(beat.at >= 0 && beat.at < plan.end, JSON.stringify(beat));
      battle = result.battle;
    }
  });
});

describe("narrating", () => {
  const names = { hero: "Ninja Cat", monster: "Sneaky Duck" };

  it("says who hit whom, and for how much", () => {
    assert.equal(narrate(round({ heroDamage: 25 }), names), "Ninja Cat hits Sneaky Duck for 25.");
    assert.equal(narrate(round({ correct: false, foeDamage: 15 }), names), "Sneaky Duck hits Ninja Cat for 15.");
  });

  it("tells the rest of the story: a streak, a win, a treasure, a heal or a level", () => {
    const won = narrate(round({ heroDamage: 30, streakMultiplier: 1.25, defeatedFoe: true, drop: TREASURES[0], healed: 25 }), names);
    assert.equal(won, `Ninja Cat hits Sneaky Duck for 30. A streak makes it extra strong! Sneaky Duck is beaten! It leaves behind a treasure: ${TREASURES[0].name}. Ninja Cat gets 25 health back.`);
    assert.match(narrate(round({ heroDamage: 25, leveledUp: true, healed: 60 }), names), /levels up!$/);
    assert.match(narrate(round({ correct: false, foeDamage: 15, knockedOut: true }), names), /knocked out, but gets right back up!$/);
  });
});

describe("sound", () => {
  it("gives every beat of every kind of round a sound that exists", async () => {
    const { SFX } = await import("../src/sound.js");
    const rounds = [
      round({ heroDamage: 30, streakMultiplier: 1.5, defeatedFoe: true, drop: TREASURES[0], healed: 25 }),
      round({ heroDamage: 25, leveledUp: true, healed: 60 }),
      round({ correct: false, foeDamage: 15, knockedOut: true }),
    ];
    const heard = rounds.flatMap(r => planRound(r).beats.map(sfxFor));
    for (const name of heard) assert.ok(SFX[name], `no sound called ${name}`);
    assert.deepEqual(new Set(heard), new Set(["charged", "defeat", "drop", "heal", "swing", "hit", "levelUp", "claw", "hurt", "down", "revive"]));
  });

  it("builds ZzFX samples for every sound", async () => {
    const { SFX } = await import("../src/sound.js");
    const { buildSamples, ZZFX_SAMPLE_RATE } = await import("../src/zzfx.js");
    for (const [name, params] of Object.entries(SFX)) {
      const samples = buildSamples(...params);
      assert.ok(samples.length > 0 && samples.length < 3 * ZZFX_SAMPLE_RATE, name);
      assert.ok(samples.every(Number.isFinite), name);
    }
  });
});
