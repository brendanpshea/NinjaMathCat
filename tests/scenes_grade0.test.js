// tests/scenes_grade0.test.js — kindergarten's teaching scenes
// (src/scenes/grade0.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

describe("kindergarten's teaching scenes", () => {
  it("Teen numbers: a full frame of 10 and some more", () => {
    for (const { steps, at } of playedScenes("0-teens")) {
      const { filled, frames } = steps[0].picture;
      assert.equal(frames, 2, at);
      assert.ok(filled >= 11 && filled <= 19, at);
      assert.equal(steps[2].say, `This frame has ${filled - 10} more.`, at);
      assert.equal(steps[3].say, `10 and ${filled - 10} more make ${filled}.`, at);
      // The ring follows the line: the full frame, then the one with the rest.
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus], ["frame-0", "frame-1"], at);
      assert.deepEqual(steps[4].check.answers, ["frame-0"], at);
    }
  });

  const numbersIn = (/** @type {string} */ s) => (s.match(/\d+/g) ?? []).map(Number);
  const varies = (/** @type {Iterable<{ steps: any[] }>} */ played) => new Set([...played].map(p => JSON.stringify(p.steps[0].picture))).size > 1;

  it("Counting: touch each once, the last number says how many", () => {
    for (const { steps, at } of playedScenes("0-counting")) {
      const n = steps[0].picture.count;
      assert.ok(n >= 3 && n <= 8, at);
      assert.deepEqual(numbersIn(steps[3].say), [n], at);
      assert.equal(steps[3].picture.focus, `item-${n - 1}`, at);
      assert.equal(steps[4].picture.focus.length, n, at);
      assert.deepEqual(numbersIn(steps[4].say), [n, n], at);
      const m = steps[5].picture.count;
      assert.notEqual(m, n, at);
      assert.equal(steps[5].check.answer, m, at);
      assert.ok(steps[5].check.choices.includes(m), at);
    }
    assert.ok(varies(playedScenes("0-counting")));
  });

  it("What comes next: one hop to the right", () => {
    for (const { steps, at } of playedScenes("0-next")) {
      const [n] = steps[0].picture.points;
      assert.ok(n >= 1 && n <= 8, at);
      assert.deepEqual(steps[2].picture.jumps, [[n, n + 1]], at);
      assert.equal(steps[3].picture.focus, `tick-${n + 1}`, at);
      assert.deepEqual(numbersIn(steps[3].say), [n + 1, n + 1, n], at);
      const [m] = steps[4].picture.points;
      assert.ok(Math.abs(m - n) >= 2, at);
      assert.deepEqual(steps[4].check.answers, [`tick-${m + 1}`], at);
      assert.deepEqual(numbersIn(steps[4].say), [m, m], at);
    }
    assert.ok(varies(playedScenes("0-next")));
  });

  it("Shapes: count the sides to name the shape", () => {
    const sides = { circle: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6 };
    for (const { steps, at } of playedScenes("0-shapes")) {
      const first = steps[0].picture.shape;
      const second = steps[4].picture.shape;
      assert.notEqual(first, second, at);
      assert.ok(steps[3].say.endsWith(`${first}.`), at);
      if (sides[first]) assert.deepEqual(numbersIn(steps[2].say), [sides[first], sides[first]], at);
      else assert.deepEqual(numbersIn(steps[2].say), [], at);
      assert.equal(steps[4].check.answer, sides[second], at);
      assert.equal(new Set(steps[4].check.choices).size, steps[4].check.choices.length, at);
    }
    assert.ok(varies(playedScenes("0-shapes")));
  });

  it("More and fewer: the number said later is more", () => {
    for (const { steps, at } of playedScenes("0-more")) {
      const [a, b] = steps[0].picture.rows.map((/** @type {{ count: number }} */ r) => r.count);
      assert.notEqual(a, b, at);
      assert.deepEqual(numbersIn(steps[1].say), [a], at);
      assert.deepEqual(numbersIn(steps[2].say), [b], at);
      assert.deepEqual(numbersIn(steps[3].say), [Math.max(a, b), Math.min(a, b), Math.max(a, b)], at);
      assert.equal(steps[3].picture.focus, a > b ? "row-0" : "row-1", at);
      const counts = steps[4].picture.rows.map((/** @type {{ count: number }} */ r) => r.count);
      assert.equal(new Set(counts).size, 3, at);
      assert.deepEqual(steps[4].check.answers, [`row-${counts.indexOf(Math.max(...counts))}`], at);
    }
    assert.ok(varies(playedScenes("0-more")));
  });

  it("Adding: two groups put together", () => {
    for (const { steps, at } of playedScenes("0-adding")) {
      const pic = steps[0].picture.items;
      const a = pic.filter((/** @type {string} */ i) => i === "🍬").length;
      const b = pic.filter((/** @type {string} */ i) => i === "🍭").length;
      assert.equal(a + b, pic.length, at);
      assert.deepEqual(numbersIn(steps[0].say), [a, b], at);
      assert.equal(steps[3].picture.focus.length, a + b, at);
      assert.deepEqual(numbersIn(steps[3].say), [a + b], at);
      assert.deepEqual(steps[4].picture.lines, [[`${a}`, "+", `${b}`, "=", `${a + b}`]], at);
      const next = steps[5].picture.items;
      const sum = next.length;
      assert.equal(steps[5].check.answer, sum, at);
      assert.ok(steps[5].check.choices.includes(sum), at);
    }
    assert.ok(varies(playedScenes("0-adding")));
  });

  it("Taking away: count what is left", () => {
    for (const { steps, at } of playedScenes("0-taking")) {
      const { count, crossed } = steps[1].picture;
      assert.equal(count, steps[0].picture.count, at);
      assert.ok(crossed >= 1 && crossed < count, at);
      assert.deepEqual(numbersIn(steps[1].say), [crossed], at);
      // No ring round the shells left, which could take in the crossed-out ones.
      assert.equal(steps[2].picture.focus, undefined, at);
      assert.deepEqual(numbersIn(steps[4].say), [count, crossed, count - crossed], at);
      assert.deepEqual(steps[4].picture.lines, [[`${count}`, "−", `${crossed}`, "=", `${count - crossed}`]], at);
      const next = steps[5].picture;
      assert.equal(steps[5].check.answer, next.count - next.crossed, at);
      assert.ok(steps[5].check.choices.includes(next.count - next.crossed), at);
    }
    assert.ok(varies(playedScenes("0-taking")));
  });

  it("Number pairs: how many more make 10", () => {
    for (const { steps, at } of playedScenes("0-pairs")) {
      const { filled, frames } = steps[0].picture;
      assert.equal(frames, 1, at);
      assert.deepEqual(numbersIn(steps[2].say), [filled], at);
      assert.deepEqual(numbersIn(steps[3].say), [10 - filled], at);
      assert.deepEqual(numbersIn(steps[4].say), [filled, 10 - filled, 10], at);
      const g = steps[5].picture.filled;
      assert.equal(steps[5].check.answer, 10 - g, at);
      assert.ok(steps[5].check.choices.includes(10 - g), at);
    }
    assert.ok(varies(playedScenes("0-pairs")));
  });
});
