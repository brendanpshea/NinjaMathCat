// Positive and negative numbers (6.NS.5-7): where they are on a number line,
// which is bigger, absolute value, opposites, and what they mean in the world.

import { wrongNumbers, formatNumber as fmt } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * Three wrong numbers from the likely ones, on either side of the answer and
 * either side of zero, so where the answer sits among them gives nothing away.
 * @param {Rng} rng
 * @param {number[]} likely
 * @param {number} answer
 * @param {number} [spread]
 */
function three(rng, likely, answer, spread = 3) {
  return wrongNumbers(rng, answer, likely, { min: -Infinity, spread });
}

/** @type {QuestionType} */
export const integers = {
  id: "integers",
  name: "Negative numbers",
  generate(rng) {
    switch (rng.pick(["line", "compare", "order", "absolute", "opposite", "world"])) {
      case "line": return onTheLine(rng);
      case "compare": return compareTwo(rng);
      case "order": return extreme(rng);
      case "absolute": return absolute(rng);
      case "opposite": return opposite(rng);
      default: return inTheWorld(rng);
    }
  },
};

/**
 * A point left of zero on a number line (6.NS.6a).
 * @param {Rng} rng
 * @returns {Draft}
 */
function onTheLine(rng) {
  const tick = rng.pick([1, 2]);
  const span = 10 * tick;
  const unlabelled = Array.from({ length: 2 * span / tick + 1 }, (_, i) => -span + i * tick).filter(v => v % (5 * tick) !== 0);
  const point = rng.pick(unlabelled.filter(v => v < 0));
  return {
    prompt: "What number is the dot on?",
    visual: { kind: "number_line", den: 1, from: -span, to: span, tick, label: 5 * tick, points: [point], jumps: [] },
    answer: point,
    // Its opposite, or a tick out either way.
    wrong: three(rng, [-point, point + tick, point - tick, point + 2 * tick, point - 2 * tick], point, tick),
    hint: "Numbers left of 0 are negative, and they get smaller the further left they go.",
    difficulty: 2 + Number(tick > 1),
  };
}

/**
 * Two numbers, at least one negative, compared (6.NS.7a).
 * @param {Rng} rng
 * @returns {Draft}
 */
function compareTwo(rng) {
  let [a, b] = [-rng.int(1, 20), rng.int(-20, 20)];
  while (a === b) b = rng.int(-20, 20);
  if (rng.chance(0.5)) [a, b] = [b, a];
  const op = a > b ? ">" : "<";
  const flip = op === ">" ? "<" : ">";
  const [x, y] = [fmt(a), fmt(b)];
  return {
    prompt: "Which is true?",
    answer: `${x} ${op} ${y}`,
    wrong: rng.shuffle([`${x} ${flip} ${y}`, `${x} = ${y}`, `${y} ${op} ${x}`]),
    hint: "On a number line, the number further right is greater. −2 is greater than −5.",
    difficulty: 2 + Number(a < 0 && b < 0),
  };
}

/**
 * The greatest or least of four numbers either side of zero (6.NS.7).
 * @param {Rng} rng
 * @returns {Draft}
 */
function extreme(rng) {
  /** @type {Set<number>} */
  const values = new Set([-rng.int(1, 9), -rng.int(10, 30)]);
  while (values.size < 4) values.add(rng.int(-30, 30));
  const list = rng.shuffle([...values]);
  const greatest = rng.chance(0.5);
  const answer = greatest ? Math.max(...list) : Math.min(...list);
  return {
    prompt: `Which number is the ${greatest ? "greatest" : "least"}?`,
    answer,
    wrong: list.filter(v => v !== answer),
    hint: "Picture them on a number line: the least is furthest left.",
    difficulty: 2,
  };
}

/**
 * The absolute value of a number (6.NS.7c).
 * @param {Rng} rng
 * @returns {Draft}
 */
function absolute(rng) {
  const n = rng.int(2, 40);
  const shown = rng.chance(0.75) ? -n : n;
  return {
    prompt: `What is the absolute value of ${fmt(shown)}?`,
    answer: n,
    // Keeping the sign, doubling, or a step out.
    wrong: three(rng, [-n, 0, 2 * n, n + 1, n - 1, n + 10], n),
    hint: "Absolute value is how far a number is from 0, so it is never negative.",
    difficulty: 1 + Number(shown < 0),
  };
}

/**
 * The opposite of a number (6.NS.6a).
 * @param {Rng} rng
 * @returns {Draft}
 */
function opposite(rng) {
  const n = rng.int(2, 40) * (rng.chance(0.5) ? -1 : 1);
  return {
    prompt: `What is the opposite of ${fmt(n)}?`,
    answer: -n,
    wrong: three(rng, [n, 0, -n + 1, -n - 1, 2 * n, -2 * n], -n),
    hint: "The opposite is the same distance from 0, on the other side.",
    difficulty: 1 + Number(n < 0),
  };
}

/**
 * A negative number in the world: below sea level, below zero, owing (6.NS.5).
 * @param {Rng} rng
 * @returns {Draft}
 */
function inTheWorld(rng) {
  const n = rng.int(3, 60);
  const forms = [
    { text: `A diver is ${n} feet below sea level. Which number shows where the diver is, in feet?`, value: -n },
    { text: `It is ${n} degrees below zero. Which number is the temperature?`, value: -n },
    { text: `A hiker is ${n} feet above sea level. Which number shows where the hiker is, in feet?`, value: n },
    { text: `Sam owes $${n}. Which number shows Sam's money, in dollars?`, value: -n },
  ];
  const form = rng.pick(forms);
  return {
    prompt: form.text,
    answer: form.value,
    wrong: three(rng, [-form.value, 0, form.value * 10, form.value + (form.value > 0 ? 1 : -1), form.value - (form.value > 0 ? 1 : -1)], form.value),
    hint: "Below zero, below sea level and owing are negative; above is positive.",
    difficulty: 1,
  };
}
