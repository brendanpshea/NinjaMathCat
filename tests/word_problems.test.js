// tests/word_problems.test.js — story problems (src/questions/word_problems.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wordAddition, wordSubtraction, wordMultiplication, wordDivision, wordTwoStep } from "../src/questions/word_problems.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("story problems", () => {
  it("adding stories: the answer is the total", () => {
    for (const { question: q, at } of questionsOf(wordAddition)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a + b, at);
    }
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
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a * b, at);
    }
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
