// Fractions in stories: adding and subtracting them (4.NF.3d, 5.NF.2), a
// fraction as sharing (5.NF.3), multiplying as resizing (5.NF.5), and
// multiplying them (4.NF.4c, 5.NF.6).

import { atGrade } from "./common.js";
import { frac, simplify, add, subtract, multiply, compare, formatFraction } from "./rational.js";
import { wrongFractions } from "./fraction_ops.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Fraction } from "./rational.js" */
/** @import { Rng } from "../rng.js" */

/** @type {readonly [number, string[]][]} */
const STORIES = [
  [4.5, ["add", "subtract", "times"]],
  [Infinity, ["add", "subtract", "share", "share", "resize", "multiply", "times"]],
];

/** Stories that add two parts, each less than a whole, with a total no more than one. */
const ADDING = [
  (/** @type {string} */ a, /** @type {string} */ b) => `Maya walked ${a} mile to school, then ${b} mile to the park. How many miles did she walk?`,
  (/** @type {string} */ a, /** @type {string} */ b) => `A recipe uses ${a} cup of milk and ${b} cup of water. How many cups of liquid is that?`,
  (/** @type {string} */ a, /** @type {string} */ b) => `Leo painted ${a} of a fence on Monday and ${b} of it on Tuesday. How much of the fence has he painted?`,
];
const SUBTRACTING = [
  (/** @type {string} */ a, /** @type {string} */ b) => `A ribbon is ${a} yard long. Sam cuts off ${b} yard. How many yards of ribbon are left?`,
  (/** @type {string} */ a, /** @type {string} */ b) => `A jug holds ${a} liter of juice. Ava drinks ${b} liter. How many liters are left?`,
  (/** @type {string} */ a, /** @type {string} */ b) => `A trail is ${a} mile long. Jo has hiked ${b} mile of it. How many more miles are there to go?`,
];

/** @type {QuestionType} */
export const fractionStories = {
  id: "fraction_stories",
  name: "Fraction stories",
  generate(rng, grade) {
    const fifth = grade >= 5;
    // Fourth grade writes answers as they come; fifth in simplest form.
    const write = (/** @type {Fraction} */ f) => formatFraction(fifth ? simplify(f) : f, { mixed: true });
    switch (rng.pick(atGrade(grade, STORIES))) {
      case "add": {
        const [a, b] = twoParts(rng, fifth, (x, y) => compare(add(x, y), frac(1)) <= 0);
        const answer = add(a, b);
        return {
          prompt: rng.pick(ADDING)(show(a), show(b)),
          // Tops and bottoms both added, or the bottoms kept apart.
          ...answered(rng, fifth ? answer : frac(a.n + b.n, a.d), [frac(a.n + b.n, a.d + b.d), frac(a.n + b.n, Math.max(a.d, b.d))], write),
          hint: a.d === b.d ? "The parts are the same size, so add how many there are." : `Write both with the same denominator first, such as ${common(a, b)}.`,
          difficulty: 1 + Number(a.d !== b.d) + Number(fifth && compare(answer, frac(1, 2)) > 0),
        };
      }
      case "subtract": {
        const [a, b] = twoParts(rng, fifth, (x, y) => compare(x, y) > 0);
        const answer = subtract(a, b);
        return {
          prompt: rng.pick(SUBTRACTING)(show(a), show(b)),
          ...answered(rng, fifth ? answer : frac(a.n - b.n, a.d), [frac(a.n - b.n, Math.abs(a.d - b.d) || a.d), add(a, b), frac(Math.abs(a.n - b.n) || 1, Math.max(a.d, b.d))], write),
          hint: a.d === b.d ? "The parts are the same size, so take away how many there are." : "Change both to the same size of part before taking away.",
          difficulty: 1 + Number(a.d !== b.d),
        };
      }
      case "share": return share(rng, write);
      case "resize": return resize(rng);
      case "multiply": return multiplyStory(rng, write);
      default: return timesWhole(rng, write);
    }
  },
};

/**
 * Two proper fractions that pass a test: with the same denominator in fourth
 * grade (4.NF.3), different ones in fifth (5.NF.1-2).
 * @param {Rng} rng
 * @param {boolean} unlike
 * @param {(a: Fraction, b: Fraction) => boolean} fits
 * @returns {[Fraction, Fraction]}
 */
function twoParts(rng, unlike, fits) {
  const dens = [2, 3, 4, 5, 6, 8, 10, 12];
  for (;;) {
    const d = rng.pick(unlike ? dens : [4, 5, 6, 8, 10, 12]);
    const e = unlike ? rng.pick(dens) : d;
    if (unlike && (d === e || common(frac(1, d), frac(1, e)) > 24)) continue;
    const [a, b] = [frac(rng.int(1, d - 1), d), frac(rng.int(1, e - 1), e)];
    // In simplest form, so the prompt's fractions look as a child would write them.
    if (unlike && (simplify(a).d !== d || simplify(b).d !== e)) continue;
    if (fits(a, b)) return [a, b];
  }
}

/** @param {Fraction} f */
const show = f => `${f.n}/${f.d}`;

/** The smallest denominator two fractions share. @param {Fraction} a @param {Fraction} b */
function common(a, b) {
  let d = Math.max(a.d, b.d);
  while (d % a.d !== 0 || d % b.d !== 0) d++;
  return d;
}

/**
 * An answer and its wrong answers, written out.
 * @param {Rng} rng
 * @param {Fraction} answer
 * @param {Fraction[]} likely
 * @param {(f: Fraction) => string} write
 */
function answered(rng, answer, likely, write) {
  return { answer: write(answer), wrong: wrongFractions(rng, answer, likely, write) };
}

/**
 * Sharing wholes equally: 3 pizzas among 4 friends is 3/4 each (5.NF.3).
 * @param {Rng} rng
 * @param {(f: Fraction) => string} write
 * @returns {Draft}
 */
function share(rng, write) {
  const [people, wholes] = (() => {
    for (;;) {
      const [k, p] = [rng.int(2, 8), rng.int(1, 12)];
      if (p % k !== 0) return [k, p];
    }
  })();
  const [thing, each] = rng.pick([["pizzas", "pizza"], ["pies", "pie"], ["sandwiches", "sandwich"], ["pounds of clay", "pound of clay"]]);
  return {
    prompt: `${people} friends share ${wholes === 1 ? `1 ${each}` : `${wholes} ${thing}`} equally. How much ${each.startsWith("pound") ? "clay, in pounds," : each} does each friend get?`,
    // Turned upside down, or one share of one whole.
    ...answered(rng, frac(wholes, people), [frac(people, wholes), frac(1, people), frac(wholes, people + wholes)], write),
    hint: `Sharing ${wholes} among ${people} is ${wholes} ÷ ${people}, which is the fraction ${wholes}/${people}.`,
    difficulty: wholes > people ? 3 : 2,
  };
}

/**
 * Whether a product is more or less than the number multiplied, without
 * working it out (5.NF.5).
 * @param {Rng} rng
 * @returns {Draft}
 */
function resize(rng) {
  const n = rng.int(6, 30);
  const d = rng.int(3, 8);
  const less = () => frac(rng.int(1, d - 1), d);
  const more = () => frac(d + rng.int(1, d - 1), d);
  const one = frac(d, d);
  const asksMore = rng.chance(0.5);
  const answer = asksMore ? more() : less();
  /** @type {Fraction[]} */
  const others = asksMore ? [less(), less(), one] : [more(), more(), one];
  // Two different wrong fractions from the same side.
  while (others[0].n === others[1].n) others[1] = asksMore ? less() : more();
  const times = (/** @type {Fraction} */ f) => `${show(f)} × ${n}`;
  return {
    prompt: `Without working it out, which is ${asksMore ? "more" : "less"} than ${n}?`,
    answer: times(answer),
    wrong: rng.shuffle(others).map(times),
    hint: `Multiplying by a fraction less than 1 makes ${n} smaller; by more than 1, bigger; by exactly 1, it stays the same.`,
    difficulty: 2,
  };
}

/**
 * A fraction of a fraction, in a story (5.NF.6).
 * @param {Rng} rng
 * @param {(f: Fraction) => string} write
 * @returns {Draft}
 */
function multiplyStory(rng, write) {
  const [a, b] = twoParts(rng, true, () => true);
  const stories = [
    `A recipe uses ${show(a)} cup of sugar. How many cups of sugar are in ${show(b)} of the recipe?`,
    `A garden covers ${show(a)} of an acre. Carrots grow on ${show(b)} of it. What part of an acre grows carrots?`,
    `Kim had ${show(a)} of a cake. She ate ${show(b)} of what she had. What part of the whole cake did she eat?`,
  ];
  return {
    prompt: rng.pick(stories),
    // Adding instead, or multiplying only the tops.
    ...answered(rng, multiply(a, b), [add(a, b), frac(a.n * b.n, Math.max(a.d, b.d)), frac(a.n * b.n, a.d + b.d)], write),
    hint: `${show(b)} of ${show(a)} means ${show(b)} × ${show(a)}: multiply the tops, and multiply the bottoms.`,
    difficulty: 3,
  };
}

/**
 * A fraction times a whole number, in a story (4.NF.4c, 5.NF.6).
 * @param {Rng} rng
 * @param {(f: Fraction) => string} write
 * @returns {Draft}
 */
function timesWhole(rng, write) {
  const d = rng.pick([3, 4, 5, 6, 8, 10]);
  const part = frac(rng.int(1, d - 1), d);
  const count = rng.int(2, 9);
  const answer = frac(part.n * count, d);
  const stories = [
    `Each of ${count} friends eats ${show(part)} pound of pasta. How many pounds of pasta do they eat in all?`,
    `A snail crawls ${show(part)} meter every minute. How many meters does it crawl in ${count} minutes?`,
    `Each glass holds ${show(part)} liter of water. How many liters do ${count} glasses hold?`,
  ];
  return {
    prompt: rng.pick(stories),
    // The bottom multiplied too, or the count added on.
    ...answered(rng, answer, [frac(part.n * count, d * count), frac(part.n + count, d), frac(part.n * (count + 1), d)], write),
    hint: `${count} groups of ${show(part)} make ${count} × ${part.n} = ${count * part.n} pieces, each 1/${d}.`,
    difficulty: 2,
  };
}
