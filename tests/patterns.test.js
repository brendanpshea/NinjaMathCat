// tests/patterns.test.js — repeating patterns (src/questions/patterns.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { patterns } from "../src/questions/patterns.js";
import { questionsOf } from "./helpers.js";

/**
 * Whether a row of pictures repeats a core of 2 to 4 pictures at least twice over.
 * @param {string[]} items
 */
function repeats(items) {
  for (let size = 2; size <= 4 && size * 2 <= items.length; size++) {
    if (items.every((item, i) => item === items[i % size])) return true;
  }
  return false;
}

describe("patterns", () => {
  it("repeat once the answer fills the gap, and not with any other choice", () => {
    for (const { question: q, at } of questionsOf(patterns)) {
      const { items } = q.visual;
      assert.equal(items.filter(x => x === null).length, 1, at);
      /** @param {string} choice */
      const filled = choice => items.map(x => x ?? choice);
      assert.ok(repeats(filled(q.answer)), `${at} → ${filled(q.answer).join(" ")}`);
      for (const c of q.choices) {
        if (c !== q.answer) assert.ok(!repeats(filled(c)), `${at} → ${c} also fits`);
      }
    }
  });

  it("use at least two different pictures", () => {
    for (const { question: q, at } of questionsOf(patterns)) {
      assert.ok(new Set(q.visual.items.filter(Boolean)).size >= 2, at);
    }
  });

  it("only ask the youngest what comes next", () => {
    for (const { grade, question: q, at } of questionsOf(patterns)) {
      if (grade === 0) assert.equal(q.visual.items.at(-1), null, at);
    }
  });
});
