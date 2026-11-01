// tests/word_problems.test.js — story problems (src/questions/word_problems.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wordAddition, wordSubtraction, wordMultiplication, wordDivision } from "../src/questions/word_problems.js";
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

  it("sharing stories: the answer is the quotient, and it comes out even", () => {
    for (const { question: q, at } of questionsOf(wordDivision)) {
      const [total, size] = numbersIn(q.prompt);
      assert.equal(q.answer, total / size, at);
    }
  });

  it("are about two different people", () => {
    for (const { question: q, at } of questionsOf(wordSubtraction)) {
      const names = q.prompt.match(/\b[A-Z][a-z]+\b/g).filter(w => !["There", "How"].includes(w));
      if (names.length >= 2 && /gave|than/.test(q.prompt)) assert.ok(new Set(names).size >= 2, at);
    }
  });
});
