// Number facts: adding, taking away, missing numbers, times tables, sharing.

import { atGrade, wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/**
 * The largest number a grade adds and subtracts within: 5 and then 10 in
 * kindergarten (K.OA.5), 20 in first grade (1.OA.6), 100 and then 1000 in
 * second (2.NBT.5, 2.NBT.7), 1000 in third (3.NBT.2).
 * @type {readonly [number, number][]}
 */
export const WITHIN = [[0, 5], [0.5, 10], [1, 20], [1.5, 50], [2, 100], [2.5, 500], [Infinity, 1000]];

/**
 * The largest factor in a grade's times tables: equal groups up to 5 × 5 in
 * second grade (2.OA.4), the full table in third (3.OA.7).
 * @type {readonly [number, number][]}
 */
export const FACTORS = [[2.5, 5], [Infinity, 10]];

/**
 * What a child gets by taking the smaller digit from the larger in every
 * column, a classic slip when a subtraction needs regrouping (52 − 17 → 45).
 * @param {number} a
 * @param {number} b
 */
export function smallerFromLarger(a, b) {
  let out = 0;
  for (let place = 1; a > 0 || b > 0; place *= 10) {
    out += Math.abs((a % 10) - (b % 10)) * place;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return out;
}

/** @type {QuestionType} */
export const addition = {
  id: "addition",
  name: "Addition",
  generate(rng, grade) {
    const max = atGrade(grade, WITHIN);
    const a = rng.int(1, max - 1);
    const b = rng.int(1, max - a);
    const sum = a + b;
    const regroups = (a % 10) + (b % 10) >= 10;
    return {
      prompt: `What is ${a} + ${b}?`,
      answer: sum,
      // Off by one, a lost or extra ten, or taking away instead of adding.
      wrong: wrongNumbers(rng, sum, [sum + 1, sum - 1, regroups ? sum - 10 : sum + 10, Math.abs(a - b)]),
      hint: max <= 10 ? "Start at the bigger number and count on."
        : regroups ? "Add the ones first. Ten ones make a ten."
        : "Add the ones, then add the tens.",
      difficulty: 1 + Number(regroups) + Number(sum > max / 2),
    };
  },
};

/** @type {QuestionType} */
export const subtraction = {
  id: "subtraction",
  name: "Subtraction",
  generate(rng, grade) {
    const max = atGrade(grade, WITHIN);
    const a = rng.int(2, max);
    const b = rng.int(1, a);
    const difference = a - b;
    const regroups = a % 10 < b % 10;
    return {
      prompt: `What is ${a} − ${b}?`,
      answer: difference,
      wrong: wrongNumbers(rng, difference, [
        difference + 1, difference - 1, smallerFromLarger(a, b), a + b, regroups ? difference + 10 : difference - 10,
      ]),
      hint: max <= 10 ? "Start at the bigger number and count back."
        : regroups ? "Not enough ones? Trade a ten for ten ones."
        : "Take away the ones, then the tens.",
      difficulty: 1 + Number(regroups) + Number(a > max / 2),
    };
  },
};

/**
 * An addition or subtraction with a box to fill (1.OA.8).
 * @type {QuestionType}
 */
export const missingNumber = {
  id: "missing_number",
  name: "Missing number",
  generate(rng, grade) {
    const max = atGrade(grade, WITHIN);
    const total = rng.int(2, max);
    const part = rng.int(1, total - 1);
    const missing = total - part;
    const form = rng.int(0, 2);
    const equation = [`${part} + □ = ${total}`, `□ + ${part} = ${total}`, `${total} − □ = ${part}`][form];
    return {
      prompt: `What number goes in the box? ${equation}`,
      answer: missing,
      // Adding the two numbers shown, or copying one of them.
      wrong: wrongNumbers(rng, missing, [total + part, total, part, missing + 1, missing - 1]),
      hint: form === 2 ? `What do you take from ${total} to leave ${part}?`
        : total <= 20 ? `Count on from ${part} to ${total}.`
        : `Think: ${total} − ${part} = □.`,
      difficulty: 1 + Number(total > max / 2) + Number(form === 2),
    };
  },
};

/** @type {QuestionType} */
export const multiplication = {
  id: "multiplication",
  name: "Multiplication",
  generate(rng, grade) {
    const top = atGrade(grade, FACTORS);
    const a = rng.int(2, top);
    const b = rng.int(2, top);
    const product = a * b;
    return {
      prompt: `What is ${a} × ${b}?`,
      answer: product,
      // A neighbouring fact, or adding instead of multiplying.
      wrong: wrongNumbers(rng, product, [product + a, product - a, product + b, product - b, a + b], { spread: 4 }),
      hint: `Think of ${a} groups of ${b}.`,
      difficulty: 1 + Number(product > 25) + Number(Math.max(a, b) >= 7),
    };
  },
};

/** @type {QuestionType} */
export const division = {
  id: "division",
  name: "Division",
  generate(rng, grade) {
    const top = atGrade(grade, FACTORS);
    const divisor = rng.int(2, top);
    const quotient = rng.int(2, top);
    const dividend = divisor * quotient;
    return {
      prompt: `What is ${dividend} ÷ ${divisor}?`,
      answer: quotient,
      wrong: wrongNumbers(rng, quotient, [quotient + 1, quotient - 1, quotient + 2, quotient - 2, divisor], { min: 1 }),
      hint: `Think: ${divisor} × □ = ${dividend}.`,
      difficulty: 1 + Number(dividend > 25) + Number(divisor >= 7),
    };
  },
};
