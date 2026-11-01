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
 * 20 in first grade (1.OA.1), 100 in second (2.OA.1), 1000 in third, and
 * 10,000 in fourth.
 * @type {readonly [number, number][]}
 */
const STORY_WITHIN = [[1, 10], [1.5, 20], [2.5, 100], [3, 1000], [Infinity, 10000]];

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
 * A hint for multiplying by a two-digit number: by its tens, then its ones.
 * @param {number} a
 * @param {number} b
 */
function splitHint(a, b) {
  return `Work out ${a} × ${b - (b % 10)} and ${a} × ${b % 10}, then add them.`;
}

/**
 * Equal groups: a × b.
 * @type {readonly Story[]}
 */
const GROUPING = [
  {
    text: (c, a, b) => `${c.name} has ${a} bags with ${b} ${c.thing} in each bag. How many ${c.thing} is that in all?`,
    hint: (_, a, b) => (b > 10 ? splitHint(a, b) : `Count by ${b}s, ${a} times.`),
  },
  {
    text: (c, a, b) => `${c.name} lines up ${c.thing} in ${a} rows, with ${b} in each row. How many ${c.thing} are there?`,
    hint: (_, a, b) => (b > 10 ? splitHint(a, b) : `Count by ${b}s, once for each of the ${a} rows.`),
  },
  {
    text: (c, a, b) => `${c.name} has ${b} ${c.thing}. ${c.friend} has ${a} times as many. How many ${c.thing} does ${c.friend} have?`,
    hint: (_, a, b) => `${a} times as many means ${a} groups of ${b}.`,
    from: 4,
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
    // From fourth grade, a two-digit number of things in each group (4.NBT.5).
    const top = atGrade(grade, FACTORS);
    const a = rng.int(2, grade >= 4 ? 9 : top);
    const b = grade >= 4 ? rng.int(12, 99) : rng.int(2, top);
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

/**
 * Stories where the sharing doesn't come out even, and the question decides
 * what to do with what is left (4.OA.3): bags filled, boxes needed, or how many
 * are left over. Each answer is a tempting wrong answer to the others.
 * @type {readonly { text: (c: Cast, a: number, b: number) => string, solve: (a: number, b: number) => number, hint: string }[]}
 */
const LEFTOVERS = [
  {
    text: (c, a, b) => `${c.name} packs ${a} ${c.thing} into bags of ${b}. How many bags can ${c.name} fill all the way?`,
    solve: (a, b) => Math.floor(a / b),
    hint: "Only full bags count. The ones left over can't fill another bag.",
  },
  {
    text: (c, a, b) => `${c.name} has ${a} ${c.thing} and puts ${b} in each box. How many boxes does ${c.name} need to fit them all?`,
    solve: (a, b) => Math.ceil(a / b),
    hint: "The ones left over still need a box of their own.",
  },
  {
    text: (c, a, b) => `${c.name} shares ${a} ${c.thing} equally among ${b} friends, giving out as many as possible. How many are left over?`,
    solve: (a, b) => a % b,
    hint: "Share them out, then count what is left.",
  },
];

/** @type {QuestionType} */
export const wordDivision = {
  id: "word_division",
  name: "Sharing stories",
  generate(rng, grade) {
    const c = cast(rng);
    if (grade >= 4 && rng.chance(0.6)) {
      const divisor = rng.int(3, 9);
      const quotient = rng.int(4, 30);
      const dividend = divisor * quotient + rng.int(1, divisor - 1);
      const story = rng.pick(LEFTOVERS);
      const answer = story.solve(dividend, divisor);
      const [down, up, left] = [Math.floor(dividend / divisor), Math.ceil(dividend / divisor), dividend % divisor];
      return {
        prompt: story.text(c, dividend, divisor),
        answer,
        wrong: wrongNumbers(rng, answer, [down, up, left, answer + 1, answer - 1, divisor - left], { min: 1 }),
        hint: story.hint,
        difficulty: 3,
      };
    }
    const top = atGrade(grade, FACTORS);
    const divisor = rng.int(2, top);
    const quotient = rng.int(2, grade >= 4 ? 25 : top);
    const dividend = divisor * quotient;
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

/**
 * A story in two steps, from the four operations (3.OA.8, 4.OA.3). Each picks
 * its own numbers, so the answer stays a whole number above zero.
 * @typedef {object} TwoStep
 * @property {(rng: Rng, big: boolean) => [number, number, number]} numbers
 * @property {(c: Cast, a: number, b: number, n: number) => string} text
 * @property {(a: number, b: number, n: number) => number} solve
 * @property {(a: number, b: number, n: number) => number[]} halfway  what stopping after one step, or one slip, gives
 * @property {string} hint
 */

/** @type {readonly TwoStep[]} */
const TWO_STEPS = [
  {
    numbers: (rng, big) => [rng.int(3, 9), rng.int(3, big ? 25 : 9), rng.int(2, big ? 60 : 9)],
    text: (c, a, b, n) => `${c.name} has ${a} bags with ${b} ${c.thing} in each bag, and ${n} more besides. How many ${c.thing} is that altogether?`,
    solve: (a, b, n) => a * b + n,
    halfway: (a, b, n) => [a * b, a + b + n, a * (b + n), a * b - n],
    hint: "First find how many are in the bags, then add the rest.",
  },
  {
    numbers: (rng, big) => {
      const [a, b] = [rng.int(3, 9), rng.int(4, big ? 25 : 9)];
      return [a, b, rng.int(1, a * b - 1)];
    },
    text: (c, a, b, n) => `${c.name} buys ${a} packs of ${b} ${c.thing} and gives ${n} of them to ${c.friend}. How many ${c.thing} does ${c.name} have left?`,
    solve: (a, b, n) => a * b - n,
    halfway: (a, b, n) => [a * b, a * b + n, a + b - n, a * (b - 1)],
    hint: "First find how many there were in all, then take away the ones given.",
  },
  {
    numbers: (rng, big) => {
      const [b, n] = [rng.int(2, 9), rng.int(2, big ? 12 : 6)];
      return [b * n + rng.int(1, big ? 200 : 30), b, n];
    },
    text: (c, a, b, n) => `${c.name} has ${a} ${c.thing} and gives ${b} to each of ${n} friends. How many ${c.thing} does ${c.name} have left?`,
    solve: (a, b, n) => a - b * n,
    halfway: (a, b, n) => [b * n, a - b, a - n, a - b - n],
    hint: "First find how many were given away in all, then take that away.",
  },
  {
    numbers: (rng, big) => {
      const [n, each] = [rng.int(2, 9), rng.int(2, big ? 30 : 9)];
      const a = rng.int(1, n * each - 1);
      return [a, n * each - a, n];
    },
    text: (c, a, b, n) => `${c.name} has ${a} ${c.thing} and ${c.friend} has ${b}. They put them together and share them equally among ${n} friends. How many does each friend get?`,
    solve: (a, b, n) => (a + b) / n,
    halfway: (a, b, n) => [a + b, Math.floor(a / n) || 1, (a + b) / n + 1, (a + b) / n - 1],
    hint: "First put them together, then share them out.",
  },
];

/** @type {QuestionType} */
export const wordTwoStep = {
  id: "word_two_step",
  name: "Two-step stories",
  generate(rng, grade) {
    const story = rng.pick(TWO_STEPS);
    const [a, b, n] = story.numbers(rng, grade >= 4);
    const answer = story.solve(a, b, n);
    return {
      prompt: story.text(cast(rng), a, b, n),
      answer,
      // Stopping after the first step, or slipping on one of them.
      wrong: wrongNumbers(rng, answer, story.halfway(a, b, n), { min: 1 }),
      hint: story.hint,
      difficulty: 3,
    };
  },
};
