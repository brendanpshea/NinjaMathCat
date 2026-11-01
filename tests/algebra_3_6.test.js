// tests/algebra_3_6.test.js — expressions, equations, ratios, negative numbers
// and statistics (src/questions/algebra.js, ratios.js, integers.js,
// statistics.js): each answer worked out again from the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expressions, equations } from "../src/questions/algebra.js";
import { ratios } from "../src/questions/ratios.js";
import { integers } from "../src/questions/integers.js";
import { statistics, summarize } from "../src/questions/statistics.js";
import { questionsOf, numbersIn } from "./helpers.js";

/**
 * The value of an expression the game writes, like "3 × [4 + (7 − 2)]" or
 * "4n + 3", for a value of the letter. Only ever given the game's own text.
 */
function value(text, letter = 0) {
  const js = text
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/\[/g, "(").replace(/\]/g, ")")
    .replace(/²/g, "**2").replace(/³/g, "**3").replace(/⁴/g, "**4").replace(/⁵/g, "**5")
    .replace(/(\d)([nx(])/g, "$1*$2").replace(/([nx])\(/g, "$1*(");
  return Function("n", "x", `return (${js});`)(letter, letter);
}

describe("expressions", () => {
  it("are worked out in the right order", () => {
    for (const { question: q, at } of questionsOf(expressions)) {
      const plain = q.prompt.match(/^What is ([^n]+)\?$/);
      if (plain) assert.equal(q.answer, value(plain[1]), at);
      const withLetter = q.prompt.match(/^What is (.+) when n = (\d+)\?$/);
      if (withLetter) assert.equal(q.answer, value(withLetter[1], Number(withLetter[2])), at);
    }
  });

  it("match their words, and equal expressions are equal for every x", () => {
    for (const { question: q, at } of questionsOf(expressions)) {
      const words = q.prompt.match(/^Which expression means "(.+)"\?$/);
      if (words) {
        const n = numbersIn(words[1]);
        const meant = /^add/.test(words[1]) ? (n[0] + n[1]) * n[2]
          : /^multiply/.test(words[1]) ? n[0] * n[1] - n[2]
          : /times the sum/.test(words[1]) ? n[0] * (n[1] + n[2])
          : (n[1] - n[0]) / n[2];
        assert.equal(value(q.answer), meant, at);
      }
      const equal = q.prompt.match(/^Which expression is equal to (.+)\?$/);
      if (equal) {
        for (const x of [2, 3, 7]) assert.equal(value(q.answer, x), value(equal[1], x), at);
        for (const c of q.choices) {
          if (c !== q.answer) assert.ok([2, 3, 7].some(x => value(c, x) !== value(equal[1], x)), `${at} → ${c} is equal too`);
        }
      }
    }
  });
});

describe("equations and inequalities", () => {
  it("have answers that make them true, and wrong choices that don't", () => {
    for (const { question: q, at } of questionsOf(equations)) {
      const eq = q.prompt.match(/(?:Solve for x: |makes )(.+?) = (\d+)/);
      const ineq = q.prompt.match(/makes x ([<>≤≥]) (\d+) true/);
      /** Whether a value of x satisfies the question. */
      const works = ineq
        ? x => ({ "<": x < +ineq[2], ">": x > +ineq[2], "≤": x <= +ineq[2], "≥": x >= +ineq[2] })[ineq[1]]
        : x => value(eq[1], x) === Number(eq[2]);
      assert.ok(works(q.answer), `${at} → ${q.answer}`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!works(c), `${at} → ${c} works too`);
    }
  });
});

describe("ratios and percents", () => {
  it("are answered correctly", () => {
    for (const { question: q, at } of questionsOf(ratios)) {
      const n = numbersIn(q.prompt);
      if (/ratio of/.test(q.prompt)) {
        const [a, b] = n;
        assert.equal(q.answer, /all the|things in/.test(q.prompt) ? `${a}:${a + b}` : `${a}:${b}`, at);
      } else if (/for every/.test(q.prompt)) {
        const [a, b, more] = n;
        assert.equal(q.answer, (a * more) / b, at);
      } else if (/% of/.test(q.prompt)) {
        assert.equal(q.answer, (n[0] * n[1]) / 100, at);
      } else if (/what percent/.test(q.prompt)) {
        assert.equal(q.answer, `${(n[0] / n[1]) * 100}%`, at);
      } else {
        const [total, count] = /bags hold/.test(q.prompt) ? [n[1], n[0]] : n;
        assert.equal(q.answer, total / count, at);
      }
    }
  });
});

describe("negative numbers", () => {
  it("are read, compared and measured correctly", () => {
    for (const { question: q, at } of questionsOf(integers)) {
      const n = numbersIn(q.prompt);
      if (q.visual) assert.equal(q.answer, q.visual.points[0], at);
      else if (/absolute value/.test(q.prompt)) assert.equal(q.answer, Math.abs(n[0]), at);
      else if (/opposite/.test(q.prompt)) assert.equal(q.answer, -n[0], at);
      else if (/greatest|least/.test(q.prompt)) assert.equal(q.answer, (/greatest/.test(q.prompt) ? Math.max : Math.min)(...q.choices), at);
      else if (q.prompt === "Which is true?") {
        const [a, op, b] = q.answer.split(" ");
        const [x, y] = numbersIn(`${a} ${b}`);
        assert.ok(op === "<" ? x < y : x > y, at);
      } else {
        const below = /below|owes/.test(q.prompt);
        assert.equal(q.answer, below ? -n[0] : n[0], at);
      }
    }
  });
});

describe("statistics", () => {
  it("summarize data correctly", () => {
    assert.deepEqual(summarize([3, 5, 5, 6, 8, 2, 6, 5, 4]), { mean: 44 / 9, median: 5, mode: 5, range: 6 });
  });

  it("ask about data with one mode and a whole-number mean", () => {
    for (const { question: q, at } of questionsOf(statistics)) {
      const [, list, measure] = q.prompt.match(/: ([\d, ]+)\. What is the (mean|median|mode|range)\?$/);
      const values = numbersIn(list);
      const stats = summarize(values);
      assert.ok(Number.isInteger(stats.mean), at);
      assert.equal(q.answer, stats[measure], at);
    }
  });
});
