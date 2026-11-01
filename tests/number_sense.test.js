// tests/number_sense.test.js — counting, number order, skip counting and
// comparing (src/questions/number_sense.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { counting, sequence, skipCounting, comparison } from "../src/questions/number_sense.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("counting", () => {
  it("shows as many pictures as the answer", () => {
    for (const { grade, question: q, at } of questionsOf(counting)) {
      assert.equal(q.visual.kind, "objects", at);
      assert.equal(q.visual.count, q.answer, at);
      assert.ok(q.answer >= 1 && q.answer <= (grade === 0 ? 5 : 10), at);
    }
  });
});

describe("what comes next", () => {
  it("is one more or one less", () => {
    for (const { grade, question: q, at } of questionsOf(sequence)) {
      const [n] = numbersIn(q.prompt);
      const after = q.prompt.includes("after");
      assert.equal(q.answer, after ? n + 1 : n - 1, at);
      if (grade === 0) assert.ok(after, `${at}: "before" is too soon`);
    }
  });
});

describe("skip counting", () => {
  it("continues the sequence by the same step", () => {
    for (const { question: q, at } of questionsOf(skipCounting)) {
      const [a, b, c] = numbersIn(q.prompt);
      const step = b - a;
      assert.equal(c - b, step, at);
      assert.equal(q.answer, c + step, at);
      assert.ok(Math.min(a, q.answer) >= 0 && Math.max(a, q.answer) <= 1000, at);
    }
  });

  it("counts by tens to 100 in kindergarten, with small twos from the middle of the year", () => {
    for (const { grade, question: q, at } of questionsOf(skipCounting)) {
      if (grade >= 1) continue;
      const [a, b] = numbersIn(q.prompt);
      const step = b - a;
      assert.ok(step === 10 || (grade === 0.5 && step === 2), at);
      assert.ok(q.answer <= (step === 2 ? 20 : 100), at);
    }
  });
});

/**
 * Whether a comparison like "47 > 38" or "(66 + 6) < 74" is true.
 * @param {string} statement
 */
function holds(statement) {
  const [left, op, right] = statement.split(/ ([<=>]) /);
  /** @param {string} side */
  const value = side => numbersIn(side).reduce((sum, n) => sum + n, 0);
  const [l, r] = [value(left), value(right)];
  return op === "<" ? l < r : op === ">" ? l > r : l === r;
}

describe("comparing numbers", () => {
  it("has exactly one true statement among the choices", () => {
    for (const { question: q, at } of questionsOf(comparison)) {
      if (typeof q.answer === "number") continue;
      assert.ok(holds(q.answer), `${at} → ${q.answer} is false`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!holds(c), `${at} → ${c} is true too`);
    }
  });

  it("asks kindergarten for the biggest or smallest number, without symbols", () => {
    for (const { grade, question: q, at } of questionsOf(comparison)) {
      if (grade >= 1) continue;
      const numbers = q.choices.map(Number);
      assert.equal(q.answer, q.prompt.includes("biggest") ? Math.max(...numbers) : Math.min(...numbers), at);
    }
  });
});
