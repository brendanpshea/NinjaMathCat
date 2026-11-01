// tests/arithmetic.test.js — number facts (src/questions/arithmetic.js): each
// answer worked out again from the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addition, subtraction, missingNumber, multiplication, division, smallerFromLarger, WITHIN, FACTORS,
} from "../src/questions/arithmetic.js";
import { atGrade } from "../src/questions/common.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("addition", () => {
  it("asks for a sum within the grade's limit", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      const [a, b] = numbersIn(q.prompt);
      assert.match(q.prompt, /^What is \d+ \+ \d+\?$/, at);
      assert.equal(q.answer, a + b, at);
      assert.ok(q.answer <= atGrade(grade, WITHIN), at);
    }
  });

  it("stays within 5 at the start of kindergarten", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      if (grade === 0) assert.ok(q.answer <= 5, at);
    }
  });
});

describe("subtraction", () => {
  it("asks for a difference that is never below zero", () => {
    for (const { grade, question: q, at } of questionsOf(subtraction)) {
      const [a, b] = numbersIn(q.prompt);
      assert.match(q.prompt, /^What is \d+ − \d+\?$/, at);
      assert.equal(q.answer, a - b, at);
      assert.ok(a <= atGrade(grade, WITHIN), at);
    }
  });

  it("offers the smaller-from-larger slip as a wrong answer", () => {
    assert.equal(smallerFromLarger(52, 17), 45);
    assert.equal(smallerFromLarger(300, 158), 258);
    assert.equal(smallerFromLarger(47, 23), 24, "no regrouping, no slip");
  });
});

describe("missing numbers", () => {
  it("have an answer that makes the equation true", () => {
    for (const { question: q, at } of questionsOf(missingNumber)) {
      const equation = q.prompt.replace("What number goes in the box? ", "").replace("□", String(q.answer));
      const [, left, op, right, total] = equation.match(/^(\d+) ([+−]) (\d+) = (\d+)$/) ?? [];
      assert.ok(left, at);
      const value = op === "+" ? Number(left) + Number(right) : Number(left) - Number(right);
      assert.equal(value, Number(total), at);
    }
  });
});

describe("multiplication", () => {
  it("asks a times-table fact from the grade's table", () => {
    for (const { grade, question: q, at } of questionsOf(multiplication)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a * b, at);
      assert.ok(Math.max(a, b) <= atGrade(grade, FACTORS), at);
    }
  });
});

describe("division", () => {
  it("always comes out even", () => {
    for (const { question: q, at } of questionsOf(division)) {
      const [dividend, divisor] = numbersIn(q.prompt);
      assert.equal(q.answer, dividend / divisor, at);
      assert.ok(Number.isInteger(q.answer), at);
    }
  });
});
