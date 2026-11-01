// Ratios, rates and percents (6.RP.1-3): ratio language, equivalent ratios,
// unit rates, and a percent of a number.

import { wrongNumbers } from "./common.js";
import { gcd } from "./rational.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

const PAIRS = [["roses", "tulips"], ["red marbles", "blue marbles"], ["cats", "dogs"], ["apples", "oranges"], ["blue tiles", "white tiles"]];

/** @type {QuestionType} */
export const ratios = {
  id: "ratios",
  name: "Ratios and percents",
  generate(rng) {
    switch (rng.pick(["language", "equivalent", "rate", "percentOf", "whatPercent"])) {
      case "language": return language(rng);
      case "equivalent": return equivalentRatio(rng);
      case "rate": return unitRate(rng);
      case "percentOf": return percentOf(rng);
      default: return whatPercent(rng);
    }
  },
};

/**
 * A ratio of two parts, or of a part to the whole (6.RP.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function language(rng) {
  const [first, second] = rng.pick(PAIRS);
  let [a, b] = [rng.int(2, 9), rng.int(2, 9)];
  while (a === b || gcd(a, b) !== 1) [a, b] = [rng.int(2, 9), rng.int(2, 9)];
  const whole = rng.chance(0.3);
  const answer = whole ? `${a}:${a + b}` : `${a}:${b}`;
  return {
    prompt: `A box has ${a} ${first} and ${b} ${second}. What is the ratio of ${first} to ${whole ? `all the ${first.split(" ").pop() === "marbles" ? "marbles" : "things in the box"}` : second}?`,
    answer,
    // Turned round, or part to whole mixed up with part to part.
    wrong: rng.shuffle([`${b}:${a}`, whole ? `${a}:${b}` : `${a}:${a + b}`, `${a + b}:${a}`, `${b}:${a + b}`].filter(t => t !== answer)),
    hint: `The ratio of ${first} to ${whole ? "everything" : second} puts the number of ${first} first.`,
    difficulty: 1 + Number(whole),
  };
}

/**
 * Scaling a ratio up (6.RP.3a), where adding the same amount to both is the
 * classic mistake.
 * @param {Rng} rng
 * @returns {Draft}
 */
function equivalentRatio(rng) {
  let [a, b] = [rng.int(2, 9), rng.int(2, 9)];
  while (a === b) b = rng.int(2, 9);
  const k = rng.int(2, 6);
  const answer = a * k;
  return {
    prompt: `A recipe uses ${a} cups of flour for every ${b} cups of milk. How many cups of flour go with ${b * k} cups of milk?`,
    answer,
    // Adding the difference instead of scaling, or scaling the wrong number.
    wrong: wrongNumbers(rng, answer, [a + (b * k - b), b * k * a, b * k, answer + a, answer - a], { min: 1 }),
    hint: `${b * k} cups of milk is ${k} times ${b}, so the flour is ${k} times too.`,
    difficulty: 2,
  };
}

/**
 * A rate for one (6.RP.2, 6.RP.3b).
 * @param {Rng} rng
 * @returns {Draft}
 */
function unitRate(rng) {
  const [rate, count] = [rng.int(3, 25), rng.int(2, 8)];
  const forms = [
    { text: `Maya reads ${rate * count} pages in ${count} hours. How many pages is that each hour?` },
    { text: `${count} bags hold ${rate * count} apples, the same number in each. How many apples are in one bag?` },
    { text: `A car goes ${rate * count} miles in ${count} hours at a steady speed. How many miles does it go each hour?` },
  ];
  return {
    prompt: rng.pick(forms).text,
    answer: rate,
    wrong: wrongNumbers(rng, rate, [rate * count - count, rate * count + count, rate * count, rate + 1, rate - 1], { min: 1 }),
    hint: "Divide to find how much goes with just one.",
    difficulty: 2,
  };
}

/**
 * A percent of a number (6.RP.3c).
 * @param {Rng} rng
 * @returns {Draft}
 */
function percentOf(rng) {
  const percent = rng.pick([10, 20, 25, 50, 75, 30, 40]);
  const step = 100 / gcd(percent, 100);
  const n = step * rng.int(2, Math.floor(400 / step));
  const answer = (percent * n) / 100;
  return {
    prompt: `What is ${percent}% of ${n}?`,
    answer,
    // Taking the percent away as a number, or a place out.
    wrong: wrongNumbers(rng, answer, [n - percent, n - answer, answer * 10, percent, answer + percent].filter(v => v > 0 && Number.isInteger(v)), { min: 1 }),
    hint: `${percent}% means ${percent} out of every 100.`,
    difficulty: 1 + Number(![10, 50].includes(percent)) + Number(n > 100),
  };
}

/**
 * What percent one number is of another (6.RP.3c).
 * @param {Rng} rng
 * @returns {Draft}
 */
function whatPercent(rng) {
  const percent = rng.pick([10, 20, 25, 40, 50, 60, 75, 80]);
  const step = 100 / gcd(percent, 100);
  const whole = step * rng.int(1, Math.floor(80 / step) || 1);
  const part = (percent * whole) / 100;
  return {
    prompt: `${part} out of ${whole} is what percent?`,
    answer: `${percent}%`,
    wrong: rng.shuffle([`${part}%`, `${100 - percent}%`, `${whole}%`, `${Math.max(1, percent / 10)}%`, `${percent + 10}%`].filter(t => t !== `${percent}%`)).filter((t, i, all) => all.indexOf(t) === i),
    hint: `How many would it be out of 100? Scale ${whole} up or down to 100.`,
    difficulty: 2,
  };
}
