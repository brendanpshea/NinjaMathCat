// tests/battle.test.js — the battle state machine (src/battle.js): what each
// answer does to the state, and what it reports for the stage.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startBattle, answer, TRIES } from "../src/battle.js";
import { heroStats, monsterStats, hitDamage, XP, xpToReach } from "../src/combat.js";
import { MONSTERS } from "../src/monsters.js";
import { TREASURES } from "../src/treasures.js";
import { typesForGrade } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";

const duck = MONSTERS.find(m => m.id === "evil_duck"); // tier 1
const goblin = MONSTERS.find(m => m.id === "goblin"); // tier 2

/** A new battle at grade 2 against a duck and then a goblin, unless told otherwise. */
function begin(setup = {}, seed = 1) {
  const rng = createRng(seed);
  return { rng, battle: startBattle(rng, { grade: 2, adventure: [duck, goblin], ...setup }) };
}

const right = battle => battle.question.answer;
const wrong = battle => battle.question.choices.find(c => c !== battle.question.answer && !battle.ruledOut.includes(c));

/** Freeze a value all the way down, so any change to it throws. */
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe("starting a battle", () => {
  it("puts a new hero at full health against the first monster, with a question for the grade", () => {
    const { battle } = begin();
    assert.deepEqual(battle.hero, { level: 1, xp: 0, hp: heroStats(1).maxHp });
    assert.equal(battle.foe.monster, duck);
    assert.equal(battle.foe.hp, monsterStats(1).maxHp);
    assert.ok(typesForGrade(2).some(t => t.id === battle.question.type));
    assert.equal(battle.streak, 0);
  });

  it("carries over a returning hero's level, and pitches the monsters at it", () => {
    const { battle } = begin({ hero: { level: 5, xp: xpToReach(5) } });
    assert.equal(battle.hero.hp, heroStats(5).maxHp);
    assert.equal(battle.foe.level, 5);
  });

  it("asks only the questions it is given, and pitches each monster as told", () => {
    const mix = [{ type: "shapes", grade: 2, weight: 1, most: 3 }];
    let { rng, battle } = begin({ mix, pitch: [0, 3], toughness: [0.5, 2], hero: { level: 2, xp: xpToReach(2) } });
    assert.equal(battle.question.type, "shapes");
    assert.equal(battle.foe.level, 2);
    assert.equal(battle.foe.hp, monsterStats(2, 0.5).maxHp);
    while (battle.foe.monster === duck) battle = answer(battle, right(battle), rng).battle;
    assert.equal(battle.question.type, "shapes", "the one type, even straight after itself");
    assert.equal(battle.foe.level, battle.startLevel + 3);
    assert.equal(battle.foe.hp, monsterStats(battle.startLevel + 3, 2).maxHp);
  });

  it("needs at least one monster", () => {
    assert.throws(() => begin({ adventure: [] }), RangeError);
  });
});

describe("a right answer", () => {
  it("strikes the monster, builds the streak and earns experience", () => {
    const { rng, battle } = begin();
    const { battle: after, round } = answer(battle, right(battle), rng);
    const damage = hitDamage({ attack: heroStats(1).attack, difficulty: battle.question.difficulty, streak: 1, secondTry: false });
    assert.equal(round.correct, true);
    assert.equal(round.heroDamage, damage);
    assert.equal(after.foe.hp, battle.foe.hp - damage);
    assert.equal(after.streak, 1);
    assert.equal(after.hero.xp, XP.firstTry);
    assert.equal(round.then, "next");
    assert.equal(after.tally.firstTry, 1);
  });

  it("moves on to a different kind of question", () => {
    let { rng, battle } = begin();
    for (let i = 0; i < 60; i++) {
      const before = battle.question.type;
      // A monster that can't fall, so the questions keep coming.
      battle = answer({ ...battle, foe: { ...battle.foe, hp: 9999 } }, right(battle), rng).battle;
      assert.notEqual(battle.question.type, before);
    }
  });

  it("hits harder on a streak", () => {
    let { rng, battle } = begin();
    let round;
    for (let i = 0; i < 3; i++) ({ battle, round } = answer({ ...battle, foe: { ...battle.foe, hp: 999 } }, right(battle), rng));
    assert.equal(battle.streak, 3);
    assert.equal(round.streakMultiplier, 1.25);
  });
});

describe("a wrong answer", () => {
  it("lets the monster strike, rules the choice out and gives the same question again with a hint", () => {
    const { rng, battle } = begin();
    const choice = wrong(battle);
    const { battle: after, round } = answer(battle, choice, rng);
    assert.equal(round.correct, false);
    assert.equal(round.foeDamage, monsterStats(1).attack);
    assert.equal(after.hero.hp, battle.hero.hp - monsterStats(1).attack);
    assert.equal(round.then, "again");
    assert.equal(round.hint, battle.question.hint);
    assert.equal(after.question, battle.question);
    assert.deepEqual(after.ruledOut, [choice]);
    assert.equal(after.streak, 0);
  });

  it(`shows the answer and moves on after ${TRIES} wrong tries`, () => {
    let { rng, battle } = begin();
    const question = battle.question;
    battle = answer(battle, wrong(battle), rng).battle;
    const { battle: after, round } = answer(battle, wrong(battle), rng);
    assert.equal(round.then, "reveal");
    assert.equal(round.answer, question.answer);
    assert.notEqual(after.question, question);
    assert.deepEqual(after.ruledOut, []);
    assert.equal(after.tally.missed, 1);
  });

  it("then right: half the damage, a little experience and no streak", () => {
    let { rng, battle } = begin();
    battle = answer({ ...battle, streak: 4 }, wrong(battle), rng).battle;
    const { battle: after, round } = answer(battle, right(battle), rng);
    const half = hitDamage({ attack: heroStats(1).attack, difficulty: battle.question.difficulty, streak: 0, secondTry: true });
    assert.equal(round.heroDamage, half);
    assert.equal(after.hero.xp, XP.secondTry);
    assert.equal(after.streak, 0);
    assert.equal(after.tally.secondTry, 1);
  });

  it("cannot pick a choice already ruled out, or one that isn't there", () => {
    let { rng, battle } = begin();
    const choice = wrong(battle);
    battle = answer(battle, choice, rng).battle;
    assert.throws(() => answer(battle, choice, rng), RangeError);
    assert.throws(() => answer(battle, "not a choice", rng), RangeError);
  });
});

describe("beating a monster", () => {
  it("heals the hero, drops a new treasure, and brings on the next monster", () => {
    const { rng, battle } = begin();
    const nearlyBeaten = { ...battle, hero: { ...battle.hero, hp: 50 }, foe: { ...battle.foe, hp: 1 }, treasures: [TREASURES[0].id] };
    const { battle: after, round } = answer(nearlyBeaten, right(battle), rng);
    assert.equal(round.defeatedFoe, true);
    assert.equal(round.healed, 25);
    assert.equal(after.hero.hp, 75);
    assert.equal(after.hero.xp, XP.firstTry + XP.perTier * duck.tier);
    assert.ok(round.drop && round.drop.id !== TREASURES[0].id);
    assert.deepEqual(after.treasures, [TREASURES[0].id, round.drop.id]);
    assert.equal(after.foe.monster, goblin);
    assert.equal(after.foe.level, 2);
    assert.equal(after.foe.hp, monsterStats(2).maxHp);
    assert.equal(after.beaten, 1);
  });

  it("levels the hero up when the experience is there, back to full health", () => {
    const { rng, battle } = begin();
    const ready = { ...battle, hero: { level: 1, xp: xpToReach(2) - 1, hp: 30 } };
    const { battle: after, round } = answer(ready, right(battle), rng);
    assert.equal(round.leveledUp, true);
    assert.equal(after.hero.level, 2);
    assert.equal(after.hero.hp, heroStats(2).maxHp);
    assert.equal(round.healed, heroStats(2).maxHp - 30);
  });

  it("wins the battle when the last monster falls", () => {
    const { rng, battle } = begin({ adventure: [duck] });
    const { battle: after, round } = answer({ ...battle, foe: { ...battle.foe, hp: 1 } }, right(battle), rng);
    assert.equal(round.then, "won");
    assert.equal(after.foe, null);
    assert.equal(after.question, null);
    assert.throws(() => answer(after, right(battle), rng), /over/);
  });
});

describe("being knocked out", () => {
  it("is never game over: the hero gets back up, but that monster won't drop a treasure", () => {
    const { rng, battle } = begin();
    const weak = { ...battle, hero: { ...battle.hero, hp: 5 }, foe: { ...battle.foe, hp: 30 } };
    const { battle: after, round } = answer(weak, wrong(battle), rng);
    assert.equal(round.knockedOut, true);
    assert.equal(after.hero.hp, heroStats(1).maxHp);
    assert.equal(after.foe.hp, 30, "the monster keeps the damage it has taken");
    assert.equal(after.foe.dropsTreasure, false);
    assert.equal(after.tally.knockouts, 1);

    const { round: win } = answer({ ...after, foe: { ...after.foe, hp: 1 } }, after.question.answer, rng);
    assert.equal(win.defeatedFoe, true);
    assert.equal(win.drop, null);
  });
});

describe("the state", () => {
  it("is never changed in place: each answer makes a new one", () => {
    let { rng, battle } = begin();
    for (let i = 0; i < 40 && battle.question; i++) {
      deepFreeze(battle);
      const choice = i % 3 === 0 ? wrong(battle) : right(battle);
      battle = answer(battle, choice, rng).battle;
    }
  });

  it("plays out the same from the same seed", () => {
    const play = () => {
      let { rng, battle } = begin({}, 7);
      const rounds = [];
      for (let i = 0; i < 20 && battle.question; i++) {
        const result = answer(battle, i % 4 === 0 ? wrong(battle) : right(battle), rng);
        battle = result.battle;
        rounds.push(result.round);
      }
      return rounds;
    };
    assert.deepEqual(play(), play());
  });
});
