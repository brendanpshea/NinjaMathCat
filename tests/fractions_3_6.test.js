// tests/fractions_3_6.test.js — comparing and working with fractions
// (src/questions/fraction_ops.js), checked with exact fractions.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fractionCompare, fractionArithmetic } from "../src/questions/fraction_ops.js";
import { add, subtract, multiply, divide, same, compare, parseFraction, simplify, frac, formatFraction } from "../src/questions/rational.js";
import { fractionStories } from "../src/questions/fraction_stories.js";
import { questionsOf, numbersIn } from "./helpers.js";
import { makeQuestion } from "../src/questions/common.js";
import { createRng } from "../src/rng.js";

/** Whether "3/4 < 5/6" is true. */
function holds(statement) {
  const [left, op, right] = statement.split(/ ([<=>]) /);
  const order = compare(parseFraction(left), parseFraction(right));
  return op === "<" ? order < 0 : op === ">" ? order > 0 : order === 0;
}

describe("comparing fractions", () => {
  it("has exactly one true statement among the choices", () => {
    for (const { question: q, at } of questionsOf(fractionCompare)) {
      if (q.prompt !== "Which is true?") continue;
      assert.ok(holds(q.answer), `${at} → ${q.answer}`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!holds(c), `${at} → ${c} is true too`);
    }
  });

  it("finds the one fraction worth the same, or the greatest or least", () => {
    for (const { question: q, at } of questionsOf(fractionCompare)) {
      const worth = q.prompt.match(/^Which fraction is worth the same as (\S+)\?$/);
      if (worth) {
        const target = parseFraction(worth[1]);
        assert.ok(same(parseFraction(q.answer), target), at);
        for (const c of q.choices) if (c !== q.answer) assert.ok(!same(parseFraction(c), target), `${at} → ${c}`);
      }
      const extreme = q.prompt.match(/is the (greatest|least)\?$/);
      if (extreme) {
        const values = q.choices.map(parseFraction);
        const best = values.reduce((m, f) => (compare(f, m) * (extreme[1] === "greatest" ? 1 : -1) > 0 ? f : m));
        assert.ok(same(parseFraction(q.answer), best), at);
      }
    }
  });

  it("reads equal amounts off fraction bars, and draws the fractions compared in third grade (3.NF.3)", () => {
    let read = 0;
    for (const { grade, question: q, at } of questionsOf(fractionCompare)) {
      const v = q.visual;
      if (q.prompt === "Which is true?" && grade < 4) {
        // The bars show the two fractions compared, each labelled.
        const [left, , right] = q.answer.split(" ");
        const shown = v.bars.map(b => `${b.shaded}/${b.parts}`);
        assert.deepEqual([...shown].sort(), [left, right].sort(), at);
        assert.deepEqual(v.bars.map(b => b.label), shown, at);
      }
      if (!/^Both bars are shaded the same amount/.test(q.prompt)) continue;
      read++;
      assert.ok(grade < 4, at);
      const [top, bottom] = v.bars;
      assert.equal(q.answer, `${bottom.shaded}/${bottom.parts}`, at);
      assert.ok(same(parseFraction(q.answer), frac(top.shaded, top.parts)), `${at}: the bars are not shaded the same amount`);
      assert.equal(bottom.label, undefined, `${at}: the answer is written on the bar`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!same(parseFraction(c), parseFraction(q.answer)), `${at} → ${c}`);
    }
    assert.ok(read > 0);
  });

  it("keeps to halves through eighths in third grade (3.NF)", () => {
    for (const { grade, question: q, at } of questionsOf(fractionCompare)) {
      if (grade >= 4) continue;
      for (const c of q.choices) {
        for (const part of String(c).split(/ [<=>] /)) assert.ok([1, 2, 3, 4, 6, 8].includes(parseFraction(part).d), `${at} → ${c}`);
      }
    }
  });
});

describe("fraction arithmetic", () => {
  it("adds, subtracts, multiplies and divides exactly", () => {
    const ops = { "+": add, "−": subtract, "×": multiply, "÷": divide };
    for (const { question: q, at } of questionsOf(fractionArithmetic)) {
      const [, a, op, b] = q.prompt.match(/^What is (.+) ([+−×÷]) (.+)\?$/);
      const expected = ops[op](parseFraction(a), parseFraction(b));
      assert.ok(same(parseFraction(q.answer), expected), `${at} → ${q.answer}`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!same(parseFraction(c), expected), `${at} → ${c} is right too`);
    }
  });

  it("writes answers simplest from fifth grade, as mixed numbers when over 1", () => {
    for (const { grade, question: q, at } of questionsOf(fractionArithmetic)) {
      if (grade < 5) continue;
      const f = parseFraction(q.answer);
      assert.deepEqual(simplify(f), f, at);
      if (f.n > f.d && f.d > 1) assert.match(q.answer, /^\d+ \d+\/\d+$/, at);
      assert.notDeepEqual(f, frac(0), at);
    }
  });
});

describe("fraction stories", () => {
  /** The fractions written in a prompt, in order. */
  const fractionsIn = text => [...text.matchAll(/(\d+)\/(\d+)/g)].map(m => frac(Number(m[1]), Number(m[2])));

  it("are answered correctly, whatever the story", () => {
    for (const { grade, question: q, at } of questionsOf(fractionStories)) {
      const p = q.prompt;
      if (/^Without working it out/.test(p)) {
        const [, side, n] = p.match(/which is (more|less) than (\d+)\?$/);
        for (const c of q.choices) {
          const [f, times] = c.split(" × ");
          assert.equal(times, n, at);
          const scale = compare(parseFraction(f), frac(1));
          assert.equal(scale === (side === "more" ? 1 : -1), c === q.answer, `${at} → ${c}`);
        }
        continue;
      }
      const [a, b] = fractionsIn(p);
      const [whole] = numbersIn(p.replace(/\d+\/\d+/g, ""));
      const expected = /share/.test(p) ? frac(numbersIn(p)[1], numbersIn(p)[0])
        : /walked|uses .* and|painted/.test(p) ? add(a, b)
        : /cuts off|drinks|hiked/.test(p) ? subtract(a, b)
        : b ? multiply(a, b)
        : multiply(a, frac(whole));
      assert.ok(same(parseFraction(q.answer), expected), `${at} → ${q.answer}, not ${formatFraction(expected)}`);
      // Fifth grade writes answers in simplest form.
      if (grade >= 5) assert.equal(q.answer, formatFraction(simplify(expected), { mixed: true }), at);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!same(parseFraction(c), expected), `${at} → ${c} is right too`);
    }
  });
});

describe("fraction arithmetic, for chapters that focus on one operation", () => {
  it("asks only that operation", () => {
    const signs = { adding: /^What is .+ [+−] .+\?$/, multiplying: /×/, dividing: /÷/ };
    for (const [focus, sign] of Object.entries(signs)) {
      for (const grade of [4.5, 5, 6]) {
        const rng = createRng(21);
        for (let i = 0; i < 150; i++) {
          const q = makeQuestion(rng, fractionArithmetic, grade, focus);
          assert.match(q.prompt, sign, `${focus} at ${grade}: ${q.prompt}`);
        }
      }
    }
  });
});
