// tests/scenes_grade6.test.js — 6th grade's teaching scenes
// (src/scenes/grade6.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const checkOf = (steps, kind) => steps.find(s => s.check?.kind === kind);

describe("6th grade's teaching scenes", () => {
  it("Ratios and rates: jumps along a double number line", () => {
    for (const { steps, at } of playedScenes("6-ratios")) {
      const { top, bottom } = steps[0].picture;
      const [a, b] = [top.values[1], bottom.values[1]];
      assert.ok(a !== b && gcd(a, b) === 1, at);
      top.values.forEach((v, i) => assert.equal(v, i * a, at));
      bottom.values.forEach((v, i) => assert.equal(v, i * b, at));
      assert.match(steps[1].say, new RegExp(`^One jump along the lines is ${a} tomatoes and ${b} cups of soup`), at);
      assert.match(steps[2].say, new RegExp(`^Two jumps make ${2 * a} tomatoes and ${2 * b} cups\\. Each jump adds ${a} on top and ${b} below`), at);
      // The check: the bottom line is missing its third mark.
      const gap = steps[3].picture;
      assert.equal(gap.bottom.values.indexOf(null), 3, at);
      assert.equal(gap.top.values[3], 3 * a, at);
      assert.match(steps[3].say, new RegExp(`${3 * a} tomatoes`), at);
      assert.equal(steps[4].check.answer, gap.bottom.values[2] * 3 / 2, at);
      assert.equal(steps[4].check.answer, (gap.top.values[3] / gap.top.values[1]) * gap.bottom.values[1], at);
      assert.equal(steps[4].check.choices.length, 4, at);
    }
    assertVaries("6-ratios");
  });

  it("Dividing fractions and decimals: multiply by the flip", () => {
    const value = text => text.split("/").map(Number);
    for (const { steps, at } of playedScenes("6-dividing")) {
      const [[A, sign, B]] = steps[0].picture.lines;
      const [[p, q], [r, s]] = [value(A), value(B)];
      assert.equal(sign, "÷", at);
      assert.deepEqual(steps[3].picture.lines[1], [A, "×", `${s}/${r}`], at);
      assert.deepEqual(steps[4].picture.lines[2], [`${p * s}/${q * r}`], at);
      assert.ok(gcd(p * s, q * r) === 1, `${at}: the answer isn't in lowest terms`);
      assert.match(steps[4].say, new RegExp(`${p} times ${s} is ${p * s}, and ${q} times ${r} is ${q * r}`), at);
      // The check, worked out from the sum on its card.
      const { check, picture } = checkOf(steps, "choose");
      const [[C, , D]] = picture.lines;
      const [[c, d], [e, f]] = [value(C), value(D)];
      const [n, m] = [c * f, d * e];
      const g = gcd(n, m);
      const answer = m / g === 1 ? String(n / g) : `${n / g}/${m / g}`;
      assert.equal(check.answer, answer, at);
      assert.ok(check.choices.includes(answer), at);
      // None of the others is the same number.
      for (const choice of check.choices.filter(x => x !== answer)) {
        const [x, y = "1"] = choice.split("/").map(Number).concat([]);
        assert.notEqual(x * m, n * y, `${at}: ${choice} is also right`);
      }
    }
    assertVaries("6-dividing");
  });

  it("Factors and multiples: the greatest common factor from two lists", () => {
    const listed = line => line.slice(1).map(t => Number(t.replace(",", "")));
    for (const { steps, at } of playedScenes("6-factors")) {
      const [a, , b] = steps[0].picture.lines[0].map(Number);
      const lines = steps[3].picture.lines;
      const [fa, fb] = [listed(lines[1]), listed(lines[2])];
      for (const [n, list] of [[a, fa], [b, fb]]) {
        const real = Array.from({ length: n }, (_, i) => i + 1).filter(f => n % f === 0);
        assert.deepEqual(list, real, `${at}: factors of ${n}`);
      }
      const common = fa.filter(f => fb.includes(f));
      const greatest = Math.max(...common);
      assert.equal(greatest, gcd(a, b), at);
      assert.ok(greatest !== a && greatest !== b && greatest > 1, `${at}: a degenerate example`);
      // The rings point at those very numbers.
      const named = focus => focus.map(name => { const [l, i] = name.slice(1).split("-").map(Number); return Number(lines[l][i].replace(",", "")); });
      assert.deepEqual(named(steps[3].picture.focus).sort((x, y) => x - y), [...common, ...common].sort((x, y) => x - y), at);
      assert.deepEqual(named(steps[4].picture.focus), [greatest, greatest], at);
      assert.match(steps[4].say, new RegExp(`^The greatest of them is ${greatest}\\.`), at);
      // The check on its own pair.
      const { check, picture } = checkOf(steps, "choose");
      const [c, , d] = picture.lines[0].map(Number);
      assert.equal(check.answer, gcd(c, d), at);
      assert.ok(check.choices.every(x => x === check.answer || (c % x !== 0 || d % x !== 0) || x < check.answer), `${at}: a bigger common factor among the choices`);
      assert.notEqual(c, d, at);
    }
    assertVaries("6-factors");
  });

  it("Negative numbers: the dot left of zero, and its absolute value", () => {
    for (const { steps, at } of playedScenes("6-negatives")) {
      const [dot] = steps[0].picture.points;
      assert.ok(dot < 0 && dot >= -9, at);
      const n = -dot;
      assert.deepEqual(steps[2].picture.jumps, [[0, dot]], at);
      assert.match(steps[2].say, new RegExp(`negative ${n}\\.$`), at);
      assert.match(steps[3].say, new RegExp(`absolute value of negative ${n} is ${n}\\.$`), at);
      // The tap check: the tick for the negative number asked for.
      const tap = checkOf(steps, "tap");
      const m = Number(tap.say.match(/negative (\d+)/)[1]);
      assert.deepEqual(tap.check.answers, [`tick--${m}`], at);
      assert.notEqual(m, n, at);
      // The choice check: how far the other dot is from zero.
      const { check, picture } = checkOf(steps, "choose");
      const k = Math.abs(picture.points[0]);
      assert.equal(check.answer, String(k), at);
      assert.ok(picture.points[0] < 0 && check.choices.includes(`−${k}`) && check.choices.includes(String(k)), at);
      assert.notEqual(k, n, at);
    }
    assertVaries("6-negatives");
  });

  it("Expressions with letters: a number times a bracket", () => {
    for (const { steps, at } of playedScenes("6-expressions")) {
      const [[a, , v, , b]] = steps[0].picture.lines;
      assert.deepEqual(steps[2].picture.lines[1], [`${a}${v}`], at);
      assert.deepEqual(steps[3].picture.lines[1], [`${a}${v}`, "+", String(a * b)], at);
      assert.notEqual(a, b, at);
      const { check, picture } = checkOf(steps, "choose");
      const [c, , w, , d] = picture.lines[0];
      assert.equal(check.answer, `${c}${w} + ${c * d}`, at);
      assert.equal(check.choices.length, 4, at);
      assert.equal(check.choices.filter(x => x === check.answer).length, 1, at);
      // Only the answer has both c times w and c times d in it.
      assert.deepEqual(check.choices.filter(x => x === `${c}${w} + ${Number(c) * Number(d)}`), [check.answer], at);
    }
    assertVaries("6-expressions");
  });

  it("Equations: undo the plus on both sides", () => {
    for (const { steps, at } of playedScenes("6-equations")) {
      const [v, , a, , b] = steps[0].picture.lines[0];
      const c = Number(b) - Number(a);
      assert.ok(c > 0 && c !== Number(a), at);
      assert.deepEqual(steps[3].picture.lines[1], [v, "+", a, "−", a, "=", b, "−", a], at);
      assert.deepEqual(steps[4].picture.lines[2], [v, "=", String(c)], at);
      assert.match(steps[4].say, new RegExp(`${b} take away ${a} leaves ${c}, so ${v} is ${c}\\.`), at);
      const { check, picture } = checkOf(steps, "choose");
      const [w, , d, , e] = picture.lines[0];
      assert.equal(check.answer, Number(e) - Number(d), at);
      assert.ok(check.answer !== Number(d), at);
      assert.equal(check.choices.length, 4, at);
      // Plugging each choice back in: only the answer balances.
      assert.deepEqual(check.choices.filter(x => x + Number(d) === Number(e)), [check.answer], at);
      assert.ok(w.length === 1, at);
    }
    assertVaries("6-equations");
  });

  it("Area and volume: a triangle is half its rectangle", () => {
    const inches = text => Number(text.split(" ")[0]);
    for (const { steps, at } of playedScenes("6-area")) {
      const tri = steps[0].picture;
      const [b, h] = [inches(tri.labels.base), inches(tri.labels.height)];
      assert.equal(tri.shape, "triangle", at);
      assert.deepEqual([tri.width, tri.height], [b, h], at);
      assert.equal(b % 2, 0, at);
      assert.deepEqual([steps[1].picture.shape, steps[1].picture.width, steps[1].picture.height], ["rectangle", b, h], at);
      assert.match(steps[2].say, new RegExp(`${b} times ${h} is ${b * h} square inches`), at);
      assert.match(steps[3].say, new RegExp(`Half of ${b * h} is ${(b * h) / 2} square`), at);
      const { check, picture } = checkOf(steps, "choose");
      assert.equal(picture.shape, "triangle", at);
      const [b2, h2] = [inches(picture.labels.base), inches(picture.labels.height)];
      assert.equal(check.answer, (b2 * h2) / 2, at);
      assert.ok(Number.isInteger(check.answer) && check.choices.includes(b2 * h2), at);
      assert.ok(b2 !== b || h2 !== h, `${at}: the check repeats the example`);
    }
    assertVaries("6-area");
  });

  it("Statistics: the mean shares everything out evenly", () => {
    const dataOf = plot => plot.counts.flatMap((count, i) => Array(count).fill(plot.from + i));
    for (const { steps, at } of playedScenes("6-statistics")) {
      const data = dataOf(steps[0].picture);
      const sum = data.reduce((x, y) => x + y, 0);
      assert.equal(sum % data.length, 0, at);
      const mean = sum / data.length;
      assert.ok(Math.min(...data) < Math.max(...data), at);
      assert.equal(steps[2].say, `First, add up all the tiles: ${data.join(" plus ")} makes ${sum}.`, at);
      assert.match(steps[3].say, new RegExp(`between the ${data.length} stacks: ${sum} divided by ${data.length} is ${mean}\\. The mean is ${mean}\\.`), at);
      // The rings are on the positions that have Xs.
      const spots = steps[2].picture.focus.map(f => Number(f.split("-")[1]));
      assert.deepEqual(spots, steps[0].picture.counts.flatMap((c, i) => (c ? [i] : [])), at);
      // The check, from its own plot.
      const { check, picture } = checkOf(steps, "choose");
      const other = dataOf(picture);
      const total = other.reduce((x, y) => x + y, 0);
      assert.equal(check.answer, total / other.length, at);
      assert.ok(Number.isInteger(check.answer), at);
      assert.equal(check.choices.length, 4, at);
      assert.notEqual(JSON.stringify(picture.counts) + picture.from, JSON.stringify(steps[0].picture.counts) + steps[0].picture.from, `${at}: the check repeats the example`);
    }
    assertVaries("6-statistics");
  });
});

/** The first step's picture is different from seed to seed. */
function assertVaries(chapter) {
  const seen = new Set();
  for (const { steps } of playedScenes(chapter, 30)) seen.add(JSON.stringify(steps[0].picture));
  assert.ok(seen.size >= 8, `${chapter}: only ${seen.size} different examples`);
}
