// tests/scenes_grade1.test.js — 1st grade's teaching scenes
// (src/scenes/grade1.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes, picturesOf } from "./helpers/scenes.js";

/** The numbers in a line, in order. */
const numbersIn = (/** @type {string} */ text) => (text.match(/\d+/g) ?? []).map(Number);
const checkOf = (/** @type {any[]} */ steps, /** @type {string} */ kind) => steps.filter(s => s.check?.kind === kind);

describe("1st grade's teaching scenes", () => {
  it("Adding and taking away: count on from the bigger number, hop by hop", () => {
    const starts = new Set();
    for (const { steps, at } of playedScenes("1-facts")) {
      const [a] = steps[0].picture.points;
      const hops = steps[2].picture.jumps;
      const b = hops.length;
      starts.add(`${a}+${b}`);
      assert.ok(a >= 6 && a > b && b >= 2, `${at}: count on from the bigger number`);
      // The hops are one each, end to end, from the start.
      hops.forEach(([from, to], i) => assert.deepEqual([from, to], [a + i, a + i + 1], at));
      assert.deepEqual(steps[2].picture.focus, hops.map((_, i) => `jump-${i}`), at);
      assert.equal(steps[1].picture.focus, `point-${a}`, at);
      assert.deepEqual(numbersIn(steps[0].say), [a, b], at);
      assert.equal(steps[3].say, `We land on ${a + b}. So ${a} and ${b} more make ${a + b}.`, at);
      assert.equal(steps[3].picture.focus, `tick-${hops[hops.length - 1][1]}`, at);
      // The tap check: start and number of hops are in the line, the landing is the answer.
      const [tap] = checkOf(steps, "tap");
      const [a2, b2] = numbersIn(tap.say);
      assert.deepEqual(tap.picture.points, [a2], at);
      assert.deepEqual(tap.check.answers, [`tick-${a2 + b2}`], at);
      assert.ok(a2 + b2 <= 20 && (a2 !== a || b2 !== b), at);
      // The choice check.
      const [choose] = checkOf(steps, "choose");
      const [a3, b3] = numbersIn(choose.say);
      assert.deepEqual(choose.picture.points, [a3], at);
      assert.equal(choose.check.answer, a3 + b3, at);
      assert.ok(a3 + b3 <= 20, at);
    }
    assert.ok(starts.size >= 15, `only ${starts.size} different sums`);
  });

  it("Number stories: a pile grabbed is put together with the pile there was", () => {
    for (const { steps, at } of playedScenes("1-stories")) {
      const [had] = steps[0].picture.rows;
      const [, grabbed] = steps[1].picture.rows;
      assert.equal(steps[0].say.includes(`I have ${had.count} shiny gems`), true, at);
      assert.equal(steps[1].say, `Then I grab ${grabbed.count} more!`, at);
      assert.equal(steps[1].picture.focus, "row-1", at);
      assert.equal(steps[3].say, `${had.count} and ${grabbed.count} more make ${had.count + grabbed.count}. Count them all.`, at);
      assert.deepEqual(steps[3].picture.focus, ["row-0", "row-1"], at);
      // The tap check: the pile grabbed is the second row.
      const [tap] = checkOf(steps, "tap");
      assert.equal(tap.picture.rows.length, 2, at);
      assert.deepEqual(tap.check.answers, ["row-1"], at);
      // The choice check, read from its own two piles.
      const [choose] = checkOf(steps, "choose");
      const [x, y] = choose.picture.rows.map((/** @type {any} */ r) => r.count);
      assert.deepEqual(numbersIn(choose.say), [x, y], at);
      assert.equal(choose.check.answer, x + y, at);
      assert.ok(x !== had.count && y !== grabbed.count, `${at}: the check repeats the example`);
    }
  });

  it("Missing numbers: a hidden number found by counting up", () => {
    for (const { steps, at } of playedScenes("1-missing")) {
      const [[a, plus, box, eq, total]] = steps[0].picture.lines;
      assert.deepEqual([plus, box, eq], ["+", "□", "="], at);
      const hops = steps[3].picture.jumps.length;
      assert.equal(Number(total) - Number(a), hops, `${at}: the hops reach from the start to the total`);
      assert.deepEqual(steps[2].picture.points, [Number(a), Number(total)], at);
      assert.deepEqual(steps[3].picture.focus, Array.from({ length: hops }, (_, i) => `jump-${i}`), at);
      assert.equal(steps[1].picture.focus, "t0-2", at);
      assert.equal(steps[3].say, `It takes ${hops} hops to get from ${a} to ${total}.`, at);
      assert.deepEqual(steps[4].picture.lines, [[a, "+", String(hops), "=", total]], at);
      assert.equal(steps[4].picture.focus, "t0-2", at);
      const [choose] = checkOf(steps, "choose");
      const [b, , , , m] = choose.picture.lines[0];
      assert.equal(choose.check.answer, Number(m) - Number(b), at);
      assert.ok(Number(m) - Number(b) >= 2, at);
      assert.ok(b !== a || m !== total, `${at}: the check repeats the example`);
    }
  });

  it("Tens and ones: sticks are tens, little cubes are ones", () => {
    for (const { steps, at } of playedScenes("1-tens")) {
      const { tens, ones, hundreds } = steps[0].picture;
      assert.equal(hundreds, 0, at);
      assert.ok(tens >= 2 && ones >= 1, at);
      assert.equal(steps[2].say, `Here are ${tens} tens, ${tens} sticks.`, at);
      assert.equal(steps[3].say, `${ones === 1 ? "This little cube is 1 one" : `These little cubes are ${ones} ones`}.`, at);
      assert.equal(steps[4].say, `${tens} tens and ${ones} ${ones === 1 ? "one" : "ones"} make ${tens * 10 + ones}.`, at);
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus, steps[3].picture.focus], ["rod-0", "rods", "units"], at);
      const [choose] = checkOf(steps, "choose");
      const { tens: t2, ones: o2 } = choose.picture;
      assert.equal(choose.check.answer, t2 * 10 + o2, at);
      assert.ok(t2 !== o2 && t2 !== tens, `${at}: turned digits must differ, and the check must not repeat the example`);
      assert.ok(choose.check.choices.includes(o2 * 10 + t2), `${at}: the turned-round digits are a choice`);
    }
  });

  it("Counting to 120: the number after is one more, before is one less", () => {
    for (const { steps, at } of playedScenes("1-to-120")) {
      const [c] = steps[0].picture.points;
      assert.deepEqual([steps[0].picture.from, steps[0].picture.to], [c - 5, c + 5], at);
      assert.ok(c >= 12 && c + 10 <= 120, at);
      assert.deepEqual(numbersIn(steps[1].say), [c, c + 1], at);
      assert.equal(steps[1].picture.focus, `tick-${c + 1}`, at);
      assert.deepEqual(numbersIn(steps[2].say), [c, c - 1], at);
      assert.equal(steps[2].picture.focus, `tick-${c - 1}`, at);
      const [tap] = checkOf(steps, "tap");
      const [c2] = tap.picture.points;
      assert.deepEqual(numbersIn(tap.say), [c2], at);
      assert.deepEqual(tap.check.answers, [`tick-${c2 - 1}`], at);
      const [choose] = checkOf(steps, "choose");
      const [c3] = choose.picture.points;
      assert.deepEqual(numbersIn(choose.say), [c3], at);
      assert.equal(choose.check.answer, c3 + 1, at);
      assert.ok(choose.check.choices.includes(c3 + 10) && choose.check.choices.includes(c3 - 1), at);
      assert.equal(new Set([c, c2, c3]).size, 3, at);
    }
  });

  it("Measuring and time: line up one end, the farthest is longest", () => {
    for (const { steps, at } of playedScenes("1-time")) {
      const pictures = picturesOf(steps);
      /** Colors from longest to shortest. */
      const order = (/** @type {any} */ p) => [...p.ribbons].sort((x, y) => y.length - x.length);
      const first = order(pictures[0]);
      assert.equal(first.length, 3, at);
      assert.ok(pictures[0].ribbons.every((/** @type {any} */ r) => r.from === 0), `${at}: ribbons start in one place`);
      assert.ok(first[0].length - first[1].length >= 2 && first[1].length - first[2].length >= 2, `${at}: lengths easy to tell apart`);
      assert.equal(steps[2].picture.focus, `ribbon-${first[0].color}`, at);
      assert.equal(steps[3].picture.focus, `ribbon-${first[2].color}`, at);
      const [longest, shortest] = steps.filter(s => s.check);
      const second = order(pictures[steps.indexOf(longest)]);
      assert.ok(second[0].length - second[1].length >= 2 && second[1].length - second[2].length >= 2, at);
      assert.deepEqual(longest.check.answers, [`ribbon-${second[0].color}`], at);
      assert.deepEqual(shortest.check.answers, [`ribbon-${second[2].color}`], at);
      assert.equal(pictures[steps.indexOf(shortest)], pictures[steps.indexOf(longest)], `${at}: the same ribbons`);
    }
  });

  it("Picture graphs: count a row, and the longest row has the most", () => {
    for (const { steps, at } of playedScenes("1-graphs")) {
      const rows = steps[0].picture.rows;
      assert.equal(steps[0].picture.each, 1, at);
      assert.equal(new Set(rows.map((/** @type {any} */ r) => r.value)).size, rows.length, `${at}: no tie for the most`);
      assert.equal(steps[2].say, `Count the pictures in this row. There are ${rows[1].value}.`, at);
      assert.equal(steps[2].picture.focus, "row-1", at);
      const longest = rows.findIndex((/** @type {any} */ r) => r.value === Math.max(...rows.map((/** @type {any} */ q) => q.value)));
      assert.equal(steps[3].picture.focus, `row-${longest}`, at);
      const [tap] = checkOf(steps, "tap");
      const rows2 = tap.picture.rows;
      assert.deepEqual(tap.check.answers, [`row-${rows2.findIndex((/** @type {any} */ r) => r.value === Math.max(...rows2.map((/** @type {any} */ q) => q.value)))}`], at);
      const [choose] = checkOf(steps, "choose");
      const ringed = Number(choose.picture.focus.replace("row-", ""));
      const value = choose.picture.rows[ringed].value;
      assert.equal(choose.check.answer, value, at);
      assert.ok(value >= 2, at);
      assert.ok(choose.check.choices.includes(choose.picture.rows.reduce((/** @type {number} */ s, /** @type {any} */ r) => s + r.value, 0)), `${at}: counting every row is a choice`);
    }
  });

  it("Equal shares: halves and fourths, and how many equal parts", () => {
    const seen = new Set();
    for (const { steps, at } of playedScenes("1-shares")) {
      const { parts, shaded, model } = steps[0].picture;
      seen.add(`${model}${parts}${shaded}`);
      assert.ok([2, 4].includes(parts) && shaded >= 1 && shaded < parts, at);
      const name = parts === 2 ? "half" : "fourth";
      assert.equal(steps[3].say, `${parts} equal parts. Each part is one ${name}.`, at);
      assert.equal(steps[4].say, `${parts} ${parts === 2 ? "halves" : "fourths"} make the whole jelly.`, at);
      // Then the other cut: halves after fourths, fourths after halves.
      assert.equal(steps[5].picture.parts, parts === 2 ? 4 : 2, at);
      const [choose] = checkOf(steps, "choose");
      assert.equal(choose.check.answer, choose.picture.parts, at);
      assert.ok(choose.check.right.endsWith(`one ${choose.picture.parts === 2 ? "half" : "fourth"}.`), at);
    }
    assert.ok(seen.size >= 6);
  });
});
