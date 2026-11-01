// tests/mastery.test.js — how the game learns what a player knows
// (src/mastery.js), and what it does about it: review where it's needed, each
// kind pitched to suit (src/adventures.js), and a missed kind asked again soon
// (src/battle.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { learn, strength, need, steer, UNKNOWN, SPACING, NEW_NEED } from "../src/mastery.js";
import { levelsFor, planLevel, planTraining, chaptersFor, newProgress, recordLevel, TRAINING_KINDS } from "../src/adventures.js";
import { startBattle, answer, ASK_AGAIN } from "../src/battle.js";
import { MONSTERS } from "../src/monsters.js";
import { createRng } from "../src/rng.js";

/** Mastery from a run of answers, all of one kind. */
function after(outcomes, type = "addition", now = 0) {
  return outcomes.reduce((m, outcome) => learn(m, type, outcome, now), {});
}

describe("mastery", () => {
  it("follows recent answers: up when right the first time, down when missed", () => {
    const right = after(["firstTry", "firstTry", "firstTry"]);
    const wrong = after(["missed", "missed", "missed"]);
    assert.ok(right.addition.score > 0.8);
    assert.ok(wrong.addition.score < 0.2);
    assert.equal(right.addition.seen, 3);
    // A second try counts for half, and the latest answers weigh most.
    assert.equal(after(["secondTry"]).addition.score, UNKNOWN);
    assert.ok(after(["missed", "missed", "firstTry"]).addition.score > after(["firstTry", "missed", "missed"]).addition.score);
  });

  it("says how well a kind is known, in four steps", () => {
    assert.equal(strength(undefined), "new");
    assert.equal(strength(after(["missed", "missed"]).addition), "practise");
    assert.equal(strength(after(["firstTry"]).addition), "growing");
    assert.equal(strength(after(Array(6).fill("firstTry")).addition), "strong");
  });

  it("needs review more the weaker a kind is, and the longer since it was practised", () => {
    const strong = after(Array(6).fill("firstTry"), "addition", 10).addition;
    const weak = after(["missed", "missed", "missed"], "addition", 10).addition;
    assert.ok(need(weak, 10) > need(strong, 10));
    assert.ok(need(strong, 10 + SPACING) > need(strong, 10));
    assert.equal(need(strong, 10 + SPACING), need(strong, 10 + 5 * SPACING), "fully due, and no more");
    assert.equal(need(undefined, 3), NEW_NEED);
    assert.ok(need(weak, 10) > NEW_NEED && NEW_NEED > need(strong, 10), "one never met comes between");
  });

  it("pitches a shaky kind easier, and a strong one harder, once there is enough to go on", () => {
    assert.deepEqual(steer(after(["missed", "missed"]).addition), { most: 3, least: 1, earlier: false }, "two answers say too little");
    assert.deepEqual(steer(after(["missed", "missed", "missed"]).addition), { most: 1, least: 1, earlier: false });
    assert.deepEqual(steer(after(["missed", "missed", "missed", "missed"]).addition), { most: 1, least: 1, earlier: true });
    assert.deepEqual(steer(after(Array(6).fill("firstTry")).addition), { most: 3, least: 2, earlier: false });
  });
});

describe("levels for a player", () => {
  const grade = 3;
  const levels = levelsFor(grade);
  const chapters = chaptersFor(grade);
  const reviewLevel = levels.find(l => l.chapter === 2 && l.kind === "practice");
  const weight = (mix, type) => mix.filter(p => p.type === type).reduce((s, p) => s + p.weight, 0);

  it("spend more of their review on what is weak or hasn't been practised lately", () => {
    const plain = planLevel(reviewLevel);
    const [weakKind, strongKind] = ["division", "multiplication"];
    let mastery = after(["missed", "missed", "missed", "missed"], weakKind, 20);
    mastery = { ...mastery, ...after(Array(6).fill("firstTry"), strongKind, 20) };
    const mine = planLevel(reviewLevel, mastery, 20);
    assert.ok(weight(mine.mix, weakKind) > weight(plain.mix, weakKind));
    assert.ok(weight(mine.mix, strongKind) < weight(plain.mix, strongKind));
    assert.ok(weight(mine.mix, strongKind) > 0, "a strong kind still comes up now and then");
    const total = mine.mix.reduce((s, p) => s + p.weight, 0);
    assert.ok(Math.abs(total - 1) < 1e-9);
    // The chapter's own topic keeps its share.
    const fresh = chapters[2].learn;
    assert.ok(Math.abs(fresh.reduce((s, t) => s + weight(mine.mix, t), 0) - fresh.reduce((s, t) => s + weight(plain.mix, t), 0)) < 1e-9);
  });

  it("pitch a shaky kind easier and from earlier in the year, and a strong one harder", () => {
    let mastery = after(["missed", "missed", "missed", "missed"], "division", 20);
    mastery = { ...mastery, ...after(Array(6).fill("firstTry"), "multiplication", 20) };
    const level = levels.find(l => l.chapter === 3 && l.kind === "review");
    const { mix } = planLevel(level, mastery, 20);
    const division = mix.find(p => p.type === "division");
    const multiplication = mix.find(p => p.type === "multiplication");
    assert.deepEqual([division.most, division.grade], [1, 3], "chapter 4 is pitched at 3.5; division drops to 3");
    assert.equal(multiplication.least, 2);
  });

  it("train on the kinds that need it most, of those met so far", () => {
    let progress = newProgress();
    for (const level of levels.slice(0, 12)) progress = recordLevel(progress, level, { firstTry: 8, secondTry: 0, missed: 0, knockouts: 0, byType: {}, answers: [] });
    let mastery = {};
    for (const type of ["multiplication", "word_multiplication", "division", "word_division", "missing_number", "time"]) mastery = { ...mastery, ...after(Array(5).fill("firstTry"), type, 30) };
    mastery = { ...mastery, ...after(["missed", "missed", "missed"], "rounding", 30) };
    const plan = planTraining(grade, progress, mastery, 30);
    assert.equal(plan.kinds.length, TRAINING_KINDS);
    assert.equal(plan.kinds[0], "rounding");
    for (const kind of plan.kinds) assert.ok(mastery[kind], `${kind} hasn't been met`);
    assert.equal(plan.adventure.length, 2);
  });

  it("train on the chapter being played before anything has been met", () => {
    const plan = planTraining(grade, newProgress(), {}, 0);
    assert.deepEqual(plan.kinds, [...new Set(chapters[0].learn)]);
  });
});

describe("asking a missed kind again", () => {
  const duck = MONSTERS.find(m => m.id === "evil_duck");
  const mix = ["addition", "subtraction", "shapes", "comparison"].map(type => ({ type, grade: 2, weight: 1, most: 3 }));

  it("brings it back a couple of questions later, and logs every answer", () => {
    const rng = createRng(3);
    let battle = startBattle(rng, { grade: 2, adventure: [duck], mix, toughness: [20] });
    const missedKind = battle.question.type;
    for (let i = 0; i < 2; i++) {
      battle = answer(battle, battle.question.choices.find(c => c !== battle.question.answer && !battle.ruledOut.includes(c)), rng).battle;
    }
    // Counted down once already, for the question now showing.
    assert.deepEqual(battle.again, [{ type: missedKind, in: ASK_AGAIN.missed - 1 }]);
    assert.notEqual(battle.question.type, missedKind, "not straight away");
    const kinds = [];
    for (let i = 0; i < ASK_AGAIN.missed; i++) {
      kinds.push(battle.question.type);
      battle = answer(battle, battle.question.answer, rng).battle;
    }
    assert.equal(kinds[ASK_AGAIN.missed - 1], missedKind, `asked ${kinds.join(", ")}`);
    assert.deepEqual(battle.tally.answers.map(a => a.outcome), ["missed", "firstTry", "firstTry"]);
    assert.equal(battle.tally.answers[0].type, missedKind);
  });

  it("needs nothing asked again after an answer right the first time", () => {
    const rng = createRng(4);
    let battle = startBattle(rng, { grade: 2, adventure: [duck], mix, toughness: [20] });
    battle = answer(battle, battle.question.answer, rng).battle;
    assert.deepEqual(battle.again, []);
  });
});
