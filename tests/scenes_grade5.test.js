// tests/scenes_grade5.test.js — 5th grade's teaching scenes
// (src/scenes/grade5.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes, picturesOf } from "./helpers/scenes.js";

/** The text of a math card's line. @param {any} picture @param {number} line */
const tokens = (picture, line) => picture.lines[line];
const checkOf = (/** @type {any[]} */ steps, /** @type {string} */ kind) => steps.find(s => s.check?.kind === kind);
const gcd = (/** @type {number} */ a, /** @type {number} */ b) => (b === 0 ? a : gcd(b, a % b));

describe("5th grade's teaching scenes", () => {
  it("Decimals and place value: times 10 moves every digit one place left", () => {
    for (const { steps, at } of playedScenes("5-decimals")) {
      const [t, o, dot, d] = tokens(steps[0].picture, 0);
      assert.equal(dot, ".", at);
      assert.equal(new Set([t, o, d]).size, 3, `${at}: repeated digits`);
      const n = `${t}${o}.${d}`;
      const answer = Math.round(Number(n) * 10);
      assert.equal(answer, Number(`${t}${o}${d}`), at);
      assert.match(steps[0].say, new RegExp(`10 times ${t}${o}\\.${d}\\?`), at);
      assert.match(steps[4].say, new RegExp(`10 times ${t}${o}\\.${d} is ${Math.round(answer)}\\.$`), at);
      assert.deepEqual(tokens(steps[4].picture, 1), [t, o, d], at);
      // The tap check: the ones digit is the second token.
      assert.equal(tokens(steps[0].picture, 0)[1], String(o), at);
      assert.deepEqual(steps[2].check.answers, ["t0-1"], at);
      // The choice check, from its own card.
      const choose = checkOf(steps, "choose");
      const [p, dot2, q, r] = tokens(choose.picture, 0);
      assert.equal(dot2, ".", at);
      assert.equal(choose.check.answer, `${p}${q}.${r}`, at);
      assert.equal(Math.round(Number(choose.check.answer) * 10), Math.round(Number(`${p}.${q}${r}`) * 100), at);
      assert.notEqual(`${p}${q}${r}`, `${t}${o}${d}`, at);
    }
  });

  it("Multiplying and dividing: multiply by each part of a 2-digit number, then add", () => {
    for (const { steps, at } of playedScenes("5-multiply")) {
      const [a1, a2, times, t, o] = tokens(steps[0].picture, 0);
      assert.equal(times, "×", at);
      const a = Number(a1 + a2);
      const b = Number(t + o);
      assert.match(steps[0].say, new RegExp(`What is ${a} times ${b}\\?`), at);
      assert.deepEqual(steps[2].check.answers, ["t0-3"], at);
      // The parts, as the last card shows them.
      const last = picturesOf(steps)[5];
      assert.deepEqual(tokens(last, 1), [String(a), "×", o, "=", String(a * Number(o))], at);
      assert.deepEqual(tokens(last, 2), [String(a), "×", `${t}0`, "=", String(a * Number(t) * 10)], at);
      assert.deepEqual(tokens(last, 3), [String(a * Number(o)), "+", String(a * Number(t) * 10), "=", String(a * b)], at);
      assert.match(steps[5].say, new RegExp(`make ${a * b}\\.$`), at);
      const choose = checkOf(steps, "choose");
      const [x, , y] = tokens(choose.picture, 0);
      assert.equal(choose.check.answer, Number(x) * Number(y), at);
      assert.ok(choose.check.choices.every(/** @param {number} c */ c => c > 0), at);
      assert.notEqual(Number(x), a, at);
    }
  });

  it("Expressions: parentheses first, then multiplying before adding", () => {
    for (const { steps, at } of playedScenes("5-expressions")) {
      const [a, times, open, b, plus, c, close] = tokens(steps[0].picture, 0);
      assert.deepEqual([times, open, plus, close], ["×", "(", "+", ")"], at);
      assert.match(steps[1].say, new RegExp(`${b} plus ${c} inside`), at);
      assert.match(steps[3].say, new RegExp(`${a} times ${Number(b) + Number(c)} is ${Number(a) * (Number(b) + Number(c))}\\.$`), at);
      assert.deepEqual(tokens(steps[3].picture, 2), [String(Number(a) * (Number(b) + Number(c)))], at);
      // Multiplying first, in the card for the second example.
      const [x, p, y, m, z] = tokens(steps[4].picture, 0);
      assert.deepEqual([p, m], ["+", "×"], at);
      assert.match(steps[5].say, new RegExp(`${y} times ${z} is ${Number(y) * Number(z)}\\. Then add ${x}\\. The answer is ${Number(x) + Number(y) * Number(z)}\\.$`), at);
      const choose = checkOf(steps, "choose");
      const [x2, , y2, , z2] = tokens(choose.picture, 0).map(Number);
      assert.equal(choose.check.answer, x2 + y2 * z2, at);
      assert.equal(new Set(choose.check.choices).size, 4, at);
    }
  });

  it("Adding fractions: the same size pieces first, then add", () => {
    for (const { steps, at } of playedScenes("5-fractions")) {
      const [one, two] = steps[0].picture.bars;
      const D = one.parts * two.parts;
      const n = one.shaded * two.parts + two.shaded * one.parts;
      assert.equal(gcd(one.parts, two.parts), 1, at);
      assert.ok(n < D, at);
      const cut = steps[2].picture.bars;
      assert.deepEqual(cut.map((/** @type {any} */ b) => [b.parts, b.shaded]), [[D, one.shaded * two.parts], [D, two.shaded * one.parts]], at);
      assert.equal(cut[0].shaded + cut[1].shaded, n, at);
      assert.match(steps[4].say, new RegExp(` make ${n}/${D}\\.$`), at);
      assert.deepEqual(steps[4].picture.bars, [{ parts: D, shaded: n, label: `${n}/${D}` }], at);
      // The choice check, from its own bars.
      const choose = checkOf(steps, "choose");
      const [p, q] = choose.picture.bars;
      const D2 = p.parts * q.parts;
      const n2 = p.shaded * q.parts + q.shaded * p.parts;
      assert.equal(choose.check.answer, `${n2}/${D2}`, at);
      for (const c of choose.check.choices) {
        const [top, bottom] = c.split("/").map(Number);
        assert.equal(top * D2 === n2 * bottom, c === choose.check.answer, `${at}: ${c} is worth the same as the answer`);
      }
    }
  });

  it("Fraction stories: wholes shared equally are a fraction", () => {
    for (const { steps, at } of playedScenes("5-stories")) {
      const pizzas = steps[0].picture.bars.length;
      const k = Number(steps[0].picture.bars[0].label.match(/\d+/)[0]);
      assert.ok(pizzas >= 2 && pizzas < k && gcd(pizzas, k) === 1, at);
      assert.match(steps[0].say, new RegExp(`pinched ${pizzas} pizzas\\. Share them equally among ${k} friends`), at);
      assert.equal(steps[1].picture.bars.length, pizzas, at);
      assert.ok(steps[1].picture.bars.every((/** @type {any} */ b) => b.parts === k), at);
      assert.equal(steps[2].picture.bars.reduce((/** @type {number} */ sum, /** @type {any} */ b) => sum + b.shaded, 0), pizzas, at);
      assert.match(steps[3].say, new RegExp(`${pizzas} slices of 1/${k}, so each friend gets ${pizzas}/${k} of a pizza\\.$`), at);
      assert.deepEqual(tokens(steps[4].picture, 0), [String(pizzas), "÷", String(k), "=", `${pizzas}/${k}`], at);
      const choose = checkOf(steps, "choose");
      const p = choose.picture.bars.length;
      const [top] = choose.check.answer.split("/").map(Number);
      assert.equal(top, p, at);
      assert.match(choose.say, new RegExp(`${p} pizzas are shared equally among ${choose.check.answer.split("/")[1]} friends`), at);
      assert.ok(choose.check.choices.includes(`${choose.check.answer.split("/")[1]}/${p}`), `${at}: no upside-down choice`);
    }
  });

  it("Units and line plots: change to a bigger unit by dividing", () => {
    const places = /** @type {Record<string, number>} */ ({ cm: 2, g: 3, mL: 3 });
    for (const { steps, at } of playedScenes("5-units")) {
      const [n, small, , , big] = tokens(steps[0].picture, 0);
      const p = places[small];
      assert.equal(n.length, p + 1, `${at}: ${n}`);
      assert.equal(new Set(n).size, n.length, `${at}: repeated digits`);
      const answer = String(Number(n) / 10 ** p);
      assert.deepEqual(tokens(steps[1].picture, 1), ["1", big, "=", String(10 ** p), small], at);
      // The bigger unit, in the question and in the fact under it.
      assert.deepEqual(steps[2].check.answers, ["t0-4", "t1-1"], at);
      assert.equal(steps[1].picture.lines[0][4], steps[1].picture.lines[1][1], at);
      assert.deepEqual(tokens(steps[4].picture, 2), [n, "÷", String(10 ** p), "=", answer], at);
      assert.match(steps[4].say, new RegExp(`${n} \\w+ is ${answer.replace(".", "\\.")} \\w+\\.$`), at);
      const choose = checkOf(steps, "choose");
      const [m, small2, , , big2] = tokens(choose.picture, 0);
      const p2 = places[small2];
      assert.notEqual(small2, small, at);
      assert.equal(m.length, p2 + 1, at);
      assert.equal(choose.check.answer, String(Number(m) / 10 ** p2), at);
      assert.ok(big2 && choose.check.choices.includes(String(Number(m) * 10 ** p2)), at);
    }
  });

  it("Volume: a layer of cubes, then the layers", () => {
    for (const { steps, at } of playedScenes("5-volume")) {
      const { length: l, width: w, height: h } = steps[0].picture;
      assert.equal(new Set([l, w, h]).size, 3, at);
      const layer = steps[1].picture;
      assert.deepEqual([layer.width, layer.height], [l, w], at);
      assert.deepEqual(steps[2].picture.focus, Array.from({ length: w }, (_, i) => `row-${i}`), at);
      assert.match(steps[2].say, new RegExp(`${l} times ${w}, which is ${l * w} cubes`), at);
      assert.match(steps[3].say, new RegExp(`${h} layers tall\\. Each layer has ${l * w} cubes`), at);
      assert.deepEqual(tokens(steps[4].picture, 0), [String(l), "×", String(w), "×", String(h), "=", String(l * w * h)], at);
      assert.match(steps[4].say, new RegExp(`holds ${l * w * h} cubes`), at);
      const choose = checkOf(steps, "choose");
      const b = choose.picture;
      assert.equal(choose.check.answer, b.length * b.width * b.height, at);
      assert.equal(choose.check.choices.length, 4, at);
      assert.ok(b.length !== l || b.width !== w || b.height !== h, at);
    }
  });

  it("The coordinate plane: across first, then up", () => {
    for (const { steps, at } of playedScenes("5-coordinates")) {
      const points = steps[0].picture.points;
      const at_ = (/** @type {string} */ label) => points.find((/** @type {any} */ p) => p.label === label);
      const { x, y } = at_("A");
      assert.notEqual(x, y, at);
      assert.deepEqual([at_("O").x, at_("O").y, at_("B").x, at_("B").y, at_("C").x, at_("C").y], [0, 0, x, 0, 0, y], at);
      assert.match(steps[2].say, new RegExp(`B is ${x} steps across from O, so the first number is ${x}\\.`), at);
      assert.match(steps[3].say, new RegExp(`A is ${y} steps up from B, so the second number is ${y}\\.`), at);
      assert.match(steps[4].say, new RegExp(`A is at \\(${x}, ${y}\\)`), at);
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus, steps[3].picture.focus], ["point-O", "point-B", "point-A"], at);
      // The tap check names the point at (0, y).
      assert.match(steps[5].say, new RegExp(`\\(0, ${y}\\)`), at);
      assert.deepEqual(steps[5].check.answers, ["point-C"], at);
      const choose = checkOf(steps, "choose");
      const d = choose.picture.points.find((/** @type {any} */ p) => p.label === "D");
      assert.equal(choose.check.answer, `(${d.x}, ${d.y})`, at);
      assert.notEqual(d.x, d.y, at);
      assert.ok(choose.check.choices.includes(`(${d.y}, ${d.x})`), at);
      assert.ok(d.x !== x || d.y !== y, at);
    }
  });
});
