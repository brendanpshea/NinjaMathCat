// tests/scenes_grade4.test.js — 4th grade's teaching scenes
// (src/scenes/grade4.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

const num = (/** @type {string} */ s) => Number(s.replace(/,/g, ""));
const place = (/** @type {string[]} */ tokens, /** @type {number} */ i) => tokens.slice(i + 1).filter(t => /^\d$/.test(t)).length;
const wordsOf = (/** @type {number} */ k) => ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"][k];

describe("4th grade's teaching scenes", () => {
  it("Place value: what a digit is worth in its place", () => {
    const seen = new Set();
    for (const { steps, at } of playedScenes("4-place")) {
      const [line] = steps[0].picture.lines;
      seen.add(line.join(""));
      assert.equal(new Set(line.filter(t => t !== ",")).size, 6, at);
      const i = Number(steps[0].picture.focus.slice(3));
      const k = place(line, i);
      const value = num(line[i]) * 10 ** k;
      assert.ok(k >= 1, at);
      assert.match(steps[2].say, new RegExp(`The ${line[i]} is in the ${wordsOf(k)} place`), at);
      assert.ok(steps[3].say.endsWith(`which is ${value.toLocaleString("en-US")}.`), at);
      assert.deepEqual(steps[3].picture.lines[1], [line[i], "×", (10 ** k).toLocaleString("en-US"), "=", value.toLocaleString("en-US")], at);
      // The tap: the digit in the place the line names.
      const [tap] = steps[4].check.answers;
      const j = Number(tap.slice(3));
      const kt = place(line, j);
      assert.ok(steps[4].say.includes(`${wordsOf(kt)} place`), at);
      assert.notEqual(kt, k, at);
      // The choice.
      const c = steps[5];
      const [line2] = c.picture.lines;
      const i2 = Number(c.picture.focus.slice(3));
      assert.equal(c.check.answer, (num(line2[i2]) * 10 ** place(line2, i2)).toLocaleString("en-US"), at);
      assert.equal(c.check.choices.length, 4, at);
    }
    assert.ok(seen.size > 100);
  });

  it("Units of measure: hours to minutes, by multiplying", () => {
    const seen = new Set();
    for (const { steps, at } of playedScenes("4-measures")) {
      const hours = Number(steps[0].picture.lines[0][0]);
      seen.add(hours);
      assert.ok(hours >= 2, at);
      assert.equal(steps[3].picture.lines[3][0], String(hours * 60), at);
      assert.match(steps[3].say, new RegExp(`^${hours} times 6 tens is ${hours * 6} tens\\. That is ${hours * 60} minutes`), at);
      // Every 60 on the card counts, and only those.
      const card4 = steps[3].picture.lines;
      assert.deepEqual(steps[4].check.answers.map(a => card4[Number(a[1])][Number(a.slice(3))]), steps[4].check.answers.map(() => "60"), at);
      assert.equal(steps[4].check.answers.length, card4.flat().filter(t => t === "60").length, at);
      assert.equal(steps[3].picture.lines[1][3], "60", at);
      const other = Number(steps[5].picture.lines[0][0]);
      assert.notEqual(other, hours, at);
      assert.equal(steps[5].check.answer, String(other * 60), at);
    }
    assert.ok(seen.size > 4);
  });

  it("Multiplying: split into tens and ones, multiply each, add", () => {
    const seen = new Set();
    for (const { steps, at } of playedScenes("4-multiply")) {
      const [n, , big] = steps[0].picture.lines[0].map(Number);
      seen.add(`${n}x${big}`);
      const tens = Math.floor(big / 10) * 10;
      const ones = big % 10;
      // The split and its two products, rung together, then the sum.
      const parts = steps[1].picture.lines;
      assert.deepEqual(parts[1], [String(n), "×", String(tens), "+", String(n), "×", String(ones)], at);
      assert.deepEqual(parts[2], [String(n), "×", String(tens), "=", String(n * tens)], at);
      assert.deepEqual(parts[3], [String(n), "×", String(ones), "=", String(n * ones)], at);
      assert.deepEqual(steps[1].picture.focus, ["line-2", "line-3"], at);
      assert.match(steps[1].say, new RegExp(`^Split ${big} into ${tens} and ${ones}\\. ${n} times ${tens} is ${n * tens}\\. ${n} times ${ones} is ${n * ones}\\.$`), at);
      const lines = steps[2].picture.lines;
      assert.deepEqual(lines[4], [String(n * tens), "+", String(n * ones), "=", String(n * big)], at);
      assert.match(steps[2].say, new RegExp(`make ${n * big}\\.$`), at);
      assert.ok(steps.findIndex(s => s.check) <= 3, `${at}: the first check comes late`);
      const [n2, , big2] = steps[3].picture.lines[0].map(Number);
      assert.equal(steps[3].check.answer, String(n2 * big2), at);
      assert.ok(n2 * (big2 % 10) >= 10, at);
    }
    assert.ok(seen.size > 50);
  });

  it("Dividing: how many fit, what is left is the remainder", () => {
    const seen = new Set();
    for (const { steps, at } of playedScenes("4-divide")) {
      const [total, , d] = steps[0].picture.lines[0].map(Number);
      seen.add(`${total}/${d}`);
      const q = Math.floor(total / d);
      const r = total % d;
      assert.ok(r > 0 && r < d, at);
      assert.deepEqual(steps[3].picture.lines[1], [String(d), "×", String(q), "=", String(d * q)], at);
      assert.deepEqual(steps[3].picture.lines[2], [String(total), "−", String(d * q), "=", String(r)], at);
      assert.deepEqual(steps[3].picture.lines[3], [String(q), "R", String(r)], at);
      assert.match(steps[1].say, new RegExp(`${d} times ${q + 1} is ${d * (q + 1)}, too big`), at);
      assert.ok(d * (q + 1) > total, at);
      for (const a of steps[4].check.answers) assert.equal(steps[3].picture.lines[Number(a[1])][Number(a.slice(3))], String(r), at);
      const [total2, , d2] = steps[5].picture.lines[0].map(Number);
      assert.equal(steps[5].check.answer, `${Math.floor(total2 / d2)} R ${total2 % d2}`, at);
      assert.equal(new Set(steps[5].check.choices).size, 4, at);
    }
    assert.ok(seen.size > 100);
  });

  it("Angles: measured in degrees, and named against a right angle", () => {
    const kindOf = (/** @type {number} */ d) => (d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : "straight");
    const seen = new Set();
    for (const { steps, at } of playedScenes("4-angles")) {
      const target = steps[0].picture.degrees;
      seen.add(target);
      assert.ok(target % 5 === 0 && target > 0 && target < 180, at);
      assert.ok(target === 90 || Math.abs(target - 90) >= 25, `${at}: ${target} degrees is too near a right angle to tell by eye`);
      assert.equal(steps[1].picture.degrees, 90, at);
      const [acute, obtuse] = [steps[2].picture.degrees, steps[3].picture.degrees];
      assert.ok(acute < 90 && obtuse > 90 && obtuse < 180, at);
      assert.ok(steps[2].say.includes(`${acute} degrees`) && steps[3].say.includes(`${obtuse} degrees`), at);
      assert.ok(acute !== target && obtuse !== target, `${at}: an example is the angle to name`);
      assert.equal(steps[4].picture.degrees, 180, at);
      const c = steps.find(s => s.check);
      assert.equal(c.picture.degrees, target, at);
      assert.equal(c.check.answer, kindOf(target), at);
    }
    assert.ok(seen.size >= 10);
  });

  it("Fractions: the same amount in more, smaller parts", () => {
    for (const { steps, at } of playedScenes("4-fractions")) {
      const [{ parts: d, shaded: n }] = steps[0].picture.bars;
      const [, { parts, shaded }] = steps[1].picture.bars;
      const k = parts / d;
      assert.ok(Number.isInteger(k) && k >= 2, at);
      assert.equal(shaded, n * k, at);
      assert.equal(shaded / parts, n / d, at);
      assert.match(steps[3].say, new RegExp(`${n}/${d} is worth the same as ${n * k}/${d * k}\\.$`), at);
      assert.deepEqual(steps[3].picture.lines.map(l => l[4]), [String(n * k), String(d * k)], at);
      const [{ parts: d2, shaded: n2 }] = steps[4].picture.bars;
      const [a, b] = steps[4].check.answer.split("/").map(Number);
      assert.equal(a * d2, b * n2, at);
      assert.ok(a !== n2 && b !== d2, at);
      // Only the right answer is worth the same.
      const same = steps[4].check.choices.filter(/** @param {string} c */ c => { const [x, y] = c.split("/").map(Number); return x * d2 === y * n2; });
      assert.deepEqual(same, [steps[4].check.answer], at);
    }
  });

  it("Area: rows times tiles in a row", () => {
    for (const { steps, at } of playedScenes("4-area")) {
      const { width: w, height: h, grid } = steps[0].picture;
      assert.equal(grid, true, at);
      assert.notEqual(w, h, at);
      assert.deepEqual(steps[2].picture.focus, Array.from({ length: h }, (_, i) => `row-${i}`), at);
      assert.match(steps[1].say, new RegExp(`has ${w} tiles`), at);
      assert.equal(steps[3].say, `${h} rows of ${w} tiles. ${h} times ${w} is ${h * w}. The area is ${h * w} square units.`, at);
      const { width: w2, height: h2 } = steps[4].picture;
      assert.equal(steps[4].check.answer, w2 * h2, at);
      assert.equal(steps[4].picture.labels.base, `${w2} cm`, at);
      assert.deepEqual([...steps[4].check.choices].sort((x, y) => x - y), [w2 + h2, w2 * h2, 2 * (w2 + h2)].sort((x, y) => x - y), at);
    }
  });

  it("Fraction stories and decimals: tenths and hundredths on a grid of 100", () => {
    for (const { steps, at } of playedScenes("4-decimals")) {
      const [frozen] = steps[0].picture.grids;
      const [tenths, ones] = [Math.floor(frozen / 10), frozen % 10];
      assert.ok(ones > 0, `${at}: a number of hundredths, not a whole number of tenths`);
      assert.match(steps[3].say, new RegExp(`^${tenths} full columns and ${ones} more ${ones === 1 ? "block" : "blocks"} make ${frozen} hundredths\\. So 0\\.${frozen} of`), at);
      // The tap check: the column only part frozen.
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, [`column-${tenths}`], at);
      // The choice check, read the same way from its own wall.
      const choose = steps.find(s => s.check?.kind === "choose");
      const [other] = choose.picture.grids;
      assert.equal(choose.check.answer, `0.${other}`, at);
      assert.notEqual(other, frozen, `${at}: the check repeats the example`);
    }
  });
});
