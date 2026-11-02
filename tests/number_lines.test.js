// tests/number_lines.test.js — number lines (src/questions/number_lines.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { numberLine, fractionLine } from "../src/questions/number_lines.js";
import { questionsOf } from "./helpers.js";

/** The value of "a/b". */
const valueOf = text => {
  const [top, bottom] = text.split("/").map(Number);
  return top / bottom;
};

describe("whole-number lines", () => {
  it("count on and back from the dot in first grade (1.OA.5)", () => {
    let asked = 0;
    for (const { grade, question: q, at } of questionsOf(numberLine)) {
      const counting = q.prompt.match(/^The dot is on (\d+)\. Count (on|back) (\d+)\. Which number do you land on\?$/);
      assert.equal(Boolean(counting), grade < 2, at);
      if (!counting) continue;
      asked++;
      const [, start, way, steps] = counting;
      assert.deepEqual(q.visual.points, [Number(start)], at);
      assert.equal(q.answer, way === "on" ? Number(start) + Number(steps) : Number(start) - Number(steps), at);
      assert.ok(q.answer > 0 && q.answer < 20, `${at}: lands inside the line`);
    }
    assert.ok(asked > 0);
  });

  it("put the dot on an unlabelled tick, and ask for it", () => {
    for (const { question: q, at } of questionsOf(numberLine)) {
      const v = q.visual;
      assert.equal(v.from % v.label, 0, at);
      assert.equal(v.to % v.label, 0, at);
      if (v.jumps.length > 0 || q.prompt.startsWith("The dot is on")) continue;
      const [point] = v.points;
      assert.equal(q.answer, point, at);
      assert.equal((point - v.from) % v.tick, 0, `${at}: off the ticks`);
      assert.notEqual(point % v.label, 0, `${at}: labelled already`);
    }
  });

  it("jump from a labelled tick to an unlabelled one, and ask where it lands", () => {
    let jumps = 0;
    for (const { question: q, at } of questionsOf(numberLine)) {
      const v = q.visual;
      if (v.jumps.length === 0) continue;
      jumps++;
      const [[start, end]] = v.jumps;
      assert.equal(q.answer, end, at);
      assert.equal(start % v.label, 0, at);
      assert.notEqual(end % v.label, 0, at);
      assert.ok(start >= v.from && end <= v.to && end > start, at);
    }
    assert.ok(jumps > 0);
  });
});

describe("fractions on a number line", () => {
  it("ask for the fraction the dot is on, in the line's own parts", () => {
    for (const { question: q, at } of questionsOf(fractionLine)) {
      const v = q.visual;
      const [point] = v.points;
      assert.ok([2, 3, 4, 6, 8].includes(v.den), at);
      assert.equal(v.label, v.den, `${at}: only whole numbers are labelled`);
      assert.notEqual(point % v.den, 0, `${at}: a whole number`);
      assert.equal(q.answer, `${point}/${v.den}`, at);
    }
  });

  it("offer no wrong answer that is worth the same as the right one", () => {
    for (const { question: q, at } of questionsOf(fractionLine)) {
      for (const c of q.choices) if (c !== q.answer) assert.notEqual(valueOf(c), valueOf(q.answer), `${at} → ${c}`);
    }
  });
});
