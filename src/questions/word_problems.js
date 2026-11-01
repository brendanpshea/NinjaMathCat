// Story problems: the same facts, told as something that happened to someone.

import { atGrade, wrongNumbers } from "./common.js";
import { FACTORS } from "./arithmetic.js";

/** @import { QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/** First names from many places, and nobody famous. */
const NAMES = [
  "Maya", "Leo", "Ava", "Sam", "Zara", "Omar", "Mei", "Ravi", "Nora", "Eli",
  "Priya", "Jonah", "Lucia", "Kai", "Amara", "Theo", "Ines", "Malik", "Hana", "Felix",
];

/** Things to count, already plural. */
const THINGS = [
  "apples", "stickers", "crayons", "marbles", "shells", "cookies",
  "pencils", "blocks", "balloons", "acorns", "toy cars", "books",
];

/**
 * The numbers a grade's adding and subtracting stories use: within 10 and then
 * 20 in first grade (1.OA.1), 100 in second (2.OA.1), 1000 in third.
 * @type {readonly [number, number][]}
 */
const STORY_WITHIN = [[1, 10], [1.5, 20], [2.5, 100], [Infinity, 1000]];

/**
 * @typedef {{ name: string, friend: string, thing: string }} Cast
 * @typedef {{ text: (c: Cast, a: number, b: number) => string, hint: (c: Cast, a: number, b: number) => string, from?: number }} Story
 */

/**
 * @param {Rng} rng
 * @returns {Cast}
 */
function cast(rng) {
  const [name, friend] = rng.shuffle(NAMES);
  return { name, friend, thing: rng.pick(THINGS) };
}

/**
 * One story a grade is ready for.
 * @param {Rng} rng
 * @param {number} grade
 * @param {readonly Story[]} stories
 */
function storyFor(rng, grade, stories) {
  return rng.pick(stories.filter(s => grade >= (s.from ?? 0)));
}

/**
 * Putting together: a + b.
 * @type {readonly Story[]}
 */
const JOINING = [
  {
    text: (c, a, b) => `${c.name} has ${a} ${c.thing}. ${c.friend} gives ${c.name} ${b} more. How many ${c.thing} does ${c.name} have now?`,
    hint: () => "Put the two groups together.",
  },
  {
    text: (c, a, b) => `${c.name} found ${a} ${c.thing} in the morning and ${b} more after lunch. How many ${c.thing} did ${c.name} find in all?`,
    hint: () => "Put the two groups together.",
  },
  {
    text: (c, a, b) => `There are ${a} ${c.thing} on one shelf and ${b} on another. How many ${c.thing} are on the shelves altogether?`,
    hint: () => "Add what is on both shelves.",
  },
];

/**
 * Taking apart and comparing: a − b.
 * @type {readonly Story[]}
 */
const SEPARATING = [
  {
    text: (c, a, b) => `${c.name} had ${a} ${c.thing} and gave ${b} to ${c.friend}. How many ${c.thing} does ${c.name} have left?`,
    hint: () => "Take away the ones given away.",
  },
  {
    text: (c, a, b) => `There were ${a} ${c.thing} in a bag. ${c.name} took ${b} out. How many ${c.thing} are still in the bag?`,
    hint: () => "Take away the ones taken out.",
  },
  {
    text: (c, a, b) => `${c.name} has ${a} ${c.thing}. ${c.friend} has ${b}. How many more ${c.thing} does ${c.name} have than ${c.friend}?`,
    hint: () => "Match them up one to one. How many are left over?",
    from: 1.5,
  },
  {
    text: (c, a, b) => `${c.name} has ${b} ${c.thing} but wants ${a}. How many more ${c.thing} does ${c.name} need?`,
    hint: (c, _, b) => `Count on from ${b}, the number ${c.name} has.`,
    from: 1.5,
  },
];

/**
 * Equal groups: a × b.
 * @type {readonly Story[]}
 */
const GROUPING = [
  {
    text: (c, a, b) => `${c.name} has ${a} bags with ${b} ${c.thing} in each bag. How many ${c.thing} is that in all?`,
    hint: (_, a, b) => `Count by ${b}s, ${a} times.`,
  },
  {
    text: (c, a, b) => `${c.name} lines up ${c.thing} in ${a} rows, with ${b} in each row. How many ${c.thing} are there?`,
    hint: (_, a, b) => `Count by ${b}s, once for each of the ${a} rows.`,
  },
];

/**
 * Sharing out and making groups: a ÷ b.
 * @type {readonly Story[]}
 */
const SHARING = [
  {
    text: (c, a, b) => `${c.name} shares ${a} ${c.thing} equally among ${b} friends. How many ${c.thing} does each friend get?`,
    hint: (_, a, b) => `Think: ${b} × □ = ${a}.`,
  },
  {
    text: (c, a, b) => `${c.name} packs ${a} ${c.thing} into bags of ${b}. How many bags does ${c.name} fill?`,
    hint: (_, a, b) => `How many groups of ${b} make ${a}?`,
  },
];

/** @type {QuestionType} */
export const wordAddition = {
  id: "word_addition",
  name: "Adding stories",
  generate(rng, grade) {
    const max = atGrade(grade, STORY_WITHIN);
    const a = rng.int(2, max - 2);
    const b = rng.int(2, max - a);
    const sum = a + b;
    const c = cast(rng);
    const story = storyFor(rng, grade, JOINING);
    return {
      prompt: story.text(c, a, b),
      answer: sum,
      wrong: wrongNumbers(rng, sum, [sum + 1, sum - 1, Math.abs(a - b), sum + 10, sum - 10]),
      hint: story.hint(c, a, b),
      difficulty: 1 + Number(sum > max / 2) + Number(max > 20 && (a % 10) + (b % 10) >= 10),
    };
  },
};

/** @type {QuestionType} */
export const wordSubtraction = {
  id: "word_subtraction",
  name: "Taking-away stories",
  generate(rng, grade) {
    const max = atGrade(grade, STORY_WITHIN);
    const a = rng.int(3, max);
    const b = rng.int(1, a - 1);
    const difference = a - b;
    const c = cast(rng);
    const story = storyFor(rng, grade, SEPARATING);
    return {
      prompt: story.text(c, a, b),
      answer: difference,
      wrong: wrongNumbers(rng, difference, [difference + 1, difference - 1, a + b, difference + 10], { min: 1 }),
      hint: story.hint(c, a, b),
      difficulty: 1 + Number(a > max / 2) + Number((story.from ?? 0) > 0),
    };
  },
};

/** @type {QuestionType} */
export const wordMultiplication = {
  id: "word_multiplication",
  name: "Equal-groups stories",
  generate(rng, grade) {
    const top = atGrade(grade, FACTORS);
    const a = rng.int(2, top);
    const b = rng.int(2, top);
    const product = a * b;
    const c = cast(rng);
    const story = storyFor(rng, grade, GROUPING);
    return {
      prompt: story.text(c, a, b),
      answer: product,
      wrong: wrongNumbers(rng, product, [a + b, product + a, product - a, product + b, product - b], { spread: 4 }),
      hint: story.hint(c, a, b),
      difficulty: 2 + Number(product > 25),
    };
  },
};

/** @type {QuestionType} */
export const wordDivision = {
  id: "word_division",
  name: "Sharing stories",
  generate(rng, grade) {
    const top = atGrade(grade, FACTORS);
    const divisor = rng.int(2, top);
    const quotient = rng.int(2, top);
    const dividend = divisor * quotient;
    const c = cast(rng);
    const story = storyFor(rng, grade, SHARING);
    return {
      prompt: story.text(c, dividend, divisor),
      answer: quotient,
      wrong: wrongNumbers(rng, quotient, [quotient + 1, quotient - 1, quotient + 2, divisor], { min: 1 }),
      hint: story.hint(c, dividend, divisor),
      difficulty: 2 + Number(dividend > 25),
    };
  },
};
