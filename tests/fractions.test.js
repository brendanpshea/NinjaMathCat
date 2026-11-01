// tests/fractions.test.js — fractions of a shape (src/questions/fractions.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fractions, fractionText } from "../src/questions/fractions.js";
import { questionsOf } from "./helpers.js";

const NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
const PARTS = { half: 2, halves: 2, third: 3, thirds: 3, fourth: 4, fourths: 4, sixth: 6, sixths: 6, eighth: 8, eighths: 8 };

/** [top, bottom] from "two thirds" or "2/3". */
function parse(text) {
  if (text.includes("/")) return text.split("/").map(Number);
  const [top, bottom] = text.split(" ");
  return [NUMBERS[top], PARTS[bottom]];
}

describe("fraction words and numbers", () => {
  it("are written the way children say and write them", () => {
    assert.equal(fractionText(1, 2, true), "one half");
    assert.equal(fractionText(2, 3, true), "two thirds");
    assert.equal(fractionText(3, 4, false), "3/4");
  });
});

describe("fractions of a shape", () => {
  it("name the shaded part, in words before third grade and as numbers from it", () => {
    for (const { grade, question: q, at } of questionsOf(fractions)) {
      const { parts, shaded } = q.visual;
      if (typeof q.answer === "number") continue;
      assert.equal(q.answer, fractionText(shaded, parts, grade < 3), at);
    }
  });

  it("offer no wrong answer worth the same as the right one, like 2/4 for 1/2", () => {
    for (const { question: q, at } of questionsOf(fractions)) {
      if (typeof q.answer === "number") continue;
      const [top, bottom] = parse(q.answer);
      for (const c of q.choices) {
        if (c === q.answer) continue;
        const [t, b] = parse(c);
        assert.ok(t >= 1 && b >= 2, `${at} → ${c}`);
        assert.notEqual(t * bottom, top * b, `${at} → ${c}`);
      }
    }
  });

  it("count the parts when that is the question", () => {
    for (const { grade, question: q, at } of questionsOf(fractions)) {
      if (typeof q.answer !== "number") continue;
      assert.equal(q.answer, q.visual.parts, at);
      assert.ok(grade < 2, `${at}: counting parts is for first grade`);
    }
  });

  it("use halves and fourths in first grade, thirds in second, sixths and eighths in third", () => {
    const allowed = grade => (grade < 2 ? [2, 4] : grade < 3 ? [2, 3, 4] : [2, 3, 4, 6, 8]);
    for (const { grade, question: q, at } of questionsOf(fractions)) {
      assert.ok(allowed(grade).includes(q.visual.parts), at);
      if (grade < 2) assert.equal(q.visual.shaded, 1, `${at}: first grade shades one part`);
      assert.ok(q.visual.shaded >= 1 && q.visual.shaded < q.visual.parts, at);
    }
  });
});
