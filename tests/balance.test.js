// tests/balance.test.js — whole adventures played by pretend children
// (tools/simulate.js), so that a change to the numbers in src/combat.js that
// changes how the game feels shows up here. The targets came from running
// `npm run simulate`; if a change moves them on purpose, move them here too.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { simulateAdventure, median } from "../tools/simulate.js";

const RUNS = 60;

/** Adventures for a child of some accuracy, at a mix of grades. */
function play(accuracy) {
  return Array.from({ length: RUNS }, (_, i) => simulateAdventure(i + 1, { grade: [0, 1, 2, 3][i % 4], accuracy }));
}

describe("an adventure", () => {
  const guessing = play(0.25);
  const struggling = play(0.5);
  const typical = play(0.7);
  const strong = play(0.95);

  it("always ends with every monster beaten, even for a child who is guessing", () => {
    for (const results of [guessing, struggling, typical, strong]) {
      for (const r of results) assert.ok(r.won);
    }
  });

  it("takes a typical child (70% right) 30 to 50 questions", () => {
    const questions = median(typical.map(r => r.questions));
    assert.ok(questions >= 30 && questions <= 50, `${questions}`);
  });

  it("is quicker for a strong child, but not over in a flash", () => {
    const questions = median(strong.map(r => r.questions));
    assert.ok(questions >= 18 && questions < median(typical.map(r => r.questions)), `${questions}`);
  });

  it("rarely knocks out a typical child, and never a strong one", () => {
    assert.ok(median(typical.map(r => r.knockouts)) <= 1);
    assert.equal(Math.max(...strong.map(r => r.knockouts)), 0);
  });

  it("knocks out a struggling child now and then, not constantly", () => {
    const knockouts = median(struggling.map(r => r.knockouts));
    assert.ok(knockouts >= 1 && knockouts <= 8, `${knockouts}`);
  });

  it("is worth two to four levels", () => {
    for (const results of [struggling, typical, strong]) {
      const gained = median(results.map(r => r.level - 1));
      assert.ok(gained >= 2 && gained <= 4, `${gained}`);
    }
  });
});
