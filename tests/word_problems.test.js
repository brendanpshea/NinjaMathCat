// tests/word_problems.test.js — story problems (src/questions/word_problems.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wordAddition, wordSubtraction, wordMultiplication, wordDivision, wordTwoStep } from "../src/questions/word_problems.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("story problems", () => {
  it("adding stories: the answer is the total, of two numbers or three", () => {
    let three = 0;
    for (const { grade, question: q, at } of questionsOf(wordAddition)) {
      const numbers = numbersIn(q.prompt);
      assert.equal(q.answer, numbers.reduce((a, b) => a + b, 0), at);
      if (numbers.length === 3) {
        three++;
        assert.ok(grade >= 1 && q.answer <= 20, `${at}: three numbers come in first grade, with a sum within 20 (1.OA.2)`);
      }
    }
    assert.ok(three > 0);
  });

  it("taking-away stories: the answer is the difference", () => {
    for (const { question: q, at } of questionsOf(wordSubtraction)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, Math.abs(a - b), at);
      assert.ok(q.answer > 0, at);
    }
  });

  it("save comparing and missing-part stories for the middle of first grade", () => {
    for (const { grade, question: q, at } of questionsOf(wordSubtraction)) {
      if (/more .* than|wants/.test(q.prompt)) assert.ok(grade >= 1.5, at);
    }
  });

  it("equal-groups stories: the answer is the product", () => {
    for (const { question: q, at } of questionsOf(wordMultiplication)) {
      if (/^Which (sentence|equation)/.test(q.prompt)) continue;
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a * b, at);
    }
  });

  it("read a multiplication as 'times as many', and back (4.OA.1)", () => {
    /** Whether "35 is 5 times as many as 7." or "35 is 5 more than 7." is true. */
    const sentenceHolds = c => {
      const [, x, y, how, z] = c.match(/^(\d+) is (\d+) (times as many as|more than) (\d+)\.$/);
      return how === "more than" ? Number(x) === Number(y) + Number(z) : Number(x) === Number(y) * Number(z);
    };
    /** Whether an equation such as "63 = 7 × 9" or "63 + 7 = 9" is true. */
    const side = s => {
      const [x, op, y] = s.split(" ");
      return op === undefined ? Number(x) : op === "×" ? Number(x) * Number(y) : Number(x) + Number(y);
    };
    const equationHolds = c => side(c.split(" = ")[0]) === side(c.split(" = ")[1]);
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(wordMultiplication)) {
      const kind = q.prompt.match(/^Which (sentence|equation)/)?.[1];
      if (!kind) continue;
      seen.add(kind);
      assert.ok(grade >= 4, at);
      for (const c of q.choices) assert.equal((kind === "sentence" ? sentenceHolds : equationHolds)(c), c === q.answer, `${at} → ${c}`);
    }
    assert.equal(seen.size, 2);
  });

  it("'times as many' sharing stories find the smaller number or how many times as many, from fourth grade (4.OA.2)", () => {
    let asked = 0;
    for (const { grade, question: q, at } of questionsOf(wordDivision)) {
      if (!/times as many/.test(q.prompt)) continue;
      asked++;
      assert.ok(grade >= 4, at);
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a / b, at);
    }
    assert.ok(asked > 0);
  });

  it("equal-groups stories compare by 'times as many' only from fourth grade", () => {
    for (const { grade, question: q, at } of questionsOf(wordMultiplication)) {
      if (/times as many/.test(q.prompt)) assert.ok(grade >= 4, at);
    }
  });

  it("sharing stories: the answer is the quotient, or what the question makes of the remainder", () => {
    for (const { grade, question: q, at } of questionsOf(wordDivision)) {
      const [total, size] = numbersIn(q.prompt);
      if (/fill all the way/.test(q.prompt)) assert.equal(q.answer, Math.floor(total / size), at);
      else if (/fit them all/.test(q.prompt)) assert.equal(q.answer, Math.ceil(total / size), at);
      else if (/left over/.test(q.prompt)) assert.equal(q.answer, total % size, at);
      else assert.equal(q.answer, total / size, at);
      if (total % size !== 0) assert.ok(grade >= 4, `${at}: remainders wait for fourth grade`);
    }
  });

  it("two-step stories: the answer takes both steps", () => {
    for (const { question: q, at } of questionsOf(wordTwoStep)) {
      const [a, b, n] = numbersIn(q.prompt);
      const expected = /more besides/.test(q.prompt) ? a * b + n
        : /packs of/.test(q.prompt) ? a * b - n
        : /to each of/.test(q.prompt) ? a - b * n
        : (a + b) / n;
      assert.equal(q.answer, expected, at);
      assert.ok(Number.isInteger(q.answer) && q.answer > 0, at);
    }
  });

  it("never say one of a plural thing, and tell big numbers as big things", () => {
    for (const type of [wordAddition, wordSubtraction, wordTwoStep]) {
      for (const { question: q, at } of questionsOf(type)) {
        assert.ok(!/(?<![\d,])1 [a-z]+s\b/.test(q.prompt), at);
        if (Math.max(...numbersIn(q.prompt)) > 100) assert.ok(!/ in a bag| on one shelf| in the morning and \d+ more/.test(q.prompt), at);
      }
    }
  });

  it("are about two different people", () => {
    for (const { question: q, at } of questionsOf(wordSubtraction)) {
      const names = q.prompt.match(/\b[A-Z][a-z]+\b/g).filter(w => !["There", "How"].includes(w));
      if (names.length >= 2 && /gave|than/.test(q.prompt)) assert.ok(new Set(names).size >= 2, at);
    }
  });
});
