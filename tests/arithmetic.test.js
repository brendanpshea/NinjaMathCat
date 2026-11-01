// tests/arithmetic.test.js — number facts (src/questions/arithmetic.js): each
// answer worked out again from the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addition, subtraction, missingNumber, multiplication, division, smallerFromLarger, addingWithoutCarrying,
  multiplyingWithoutCarrying, withRemainder, WITHIN, FACTORS,
} from "../src/questions/arithmetic.js";
import { atGrade } from "../src/questions/common.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("addition", () => {
  it("asks for a sum within the grade's limit", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      const [a, b] = numbersIn(q.prompt);
      assert.match(q.prompt, /^What is [\d,]+ \+ [\d,]+\?$/, at);
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
      assert.match(q.prompt, /^What is [\d,]+ − [\d,]+\?$/, at);
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

describe("adding and subtracting", () => {
  it("offers the slips children make with big numbers as wrong answers", () => {
    assert.equal(addingWithoutCarrying(58, 67), 15);
    assert.equal(addingWithoutCarrying(4321, 1234), 5555, "nothing to carry, no slip");
    assert.equal(multiplyingWithoutCarrying(47, 6), 242);
    assert.equal(multiplyingWithoutCarrying(23, 3), 69, "nothing to carry, no slip");
  });

  it("reach a million in fourth grade, written with commas", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      if (grade < 4) continue;
      assert.ok(q.answer <= 1000000, at);
      const [a] = numbersIn(q.prompt);
      if (a >= 10000) assert.match(q.prompt, /\d,\d{3}/, at);
    }
  });
});

describe("missing numbers", () => {
  it("have an answer that makes the equation true", () => {
    const apply = { "+": (x, y) => x + y, "−": (x, y) => x - y, "×": (x, y) => x * y, "÷": (x, y) => x / y };
    for (const { grade, question: q, at } of questionsOf(missingNumber)) {
      const equation = q.prompt.replace("What number goes in the box? ", "").replace("□", String(q.answer));
      const [, left, op, right, total] = equation.match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/) ?? [];
      assert.ok(left, at);
      assert.equal(apply[op](Number(left), Number(right)), Number(total), at);
      if (op === "×" || op === "÷") assert.ok(grade >= 3, `${at}: multiplying and dividing come in third grade`);
    }
  });
});

describe("multiplication", () => {
  it("multiplies correctly at every size", () => {
    for (const { question: q, at } of questionsOf(multiplication)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a * b, at);
    }
  });

  it("asks the times tables up to third grade, then multiples of ten, then bigger numbers", () => {
    for (const { grade, question: q, at } of questionsOf(multiplication)) {
      const [a, b] = numbersIn(q.prompt);
      if (grade <= 3) assert.ok(Math.max(a, b) <= atGrade(grade, FACTORS), at);
      else if (grade === 3.5) assert.ok(b <= 10 || (b % 10 === 0 && b <= 90 && a <= 10), at);
      else assert.ok(Math.max(a, b) >= 11, `${at}: no bigger than the times tables`);
    }
  });
});

describe("division", () => {
  it("is right, with any remainder smaller than the divisor", () => {
    for (const { question: q, at } of questionsOf(division)) {
      const [dividend, divisor] = numbersIn(q.prompt);
      if (typeof q.answer === "number") {
        assert.equal(q.answer, dividend / divisor, at);
        continue;
      }
      const [, quotient, remainder] = q.answer.match(/^(\d+) R (\d+)$/).map(Number);
      assert.equal(quotient * divisor + remainder, dividend, at);
      assert.ok(remainder > 0 && remainder < divisor, at);
    }
  });

  it("has remainders only in fourth grade, and two-digit divisors from fifth", () => {
    for (const { grade, question: q, at } of questionsOf(division)) {
      const [, divisor] = numbersIn(q.prompt);
      if (typeof q.answer === "string") assert.ok(grade >= 4 && grade < 5, at);
      if (grade >= 5) assert.ok(divisor >= 11, at);
    }
  });

  it("writes remainders with R", () => {
    assert.equal(withRemainder(23, 2), "23 R 2");
    assert.equal(withRemainder(23, 0), "23");
  });
});
