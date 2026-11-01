// Summing up data (6.SP.3, 6.SP.5c): the mean, median, mode and range of a
// small set of numbers.

import { wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

const SETS = [
  { what: "books each student read this month", unit: "books" },
  { what: "goals each player scored this season", unit: "goals" },
  { what: "minutes each friend spent reading", unit: "minutes" },
  { what: "points each team scored", unit: "points" },
];

/**
 * A set of numbers with one mode and a whole-number mean.
 * @param {Rng} rng
 */
export function dataSet(rng) {
  for (;;) {
    const size = rng.pick([5, 7, 9]);
    const values = Array.from({ length: size - 1 }, () => rng.int(1, 20));
    values.push(values[0]);
    const sum = values.reduce((a, b) => a + b, 0);
    const counts = new Map();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const modes = [...counts].filter(([, c]) => c === top).map(([v]) => v);
    if (sum % size === 0 && modes.length === 1) return rng.shuffle(values);
  }
}

/**
 * The four summaries of a set of numbers.
 * @param {number[]} values
 */
export function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(...counts.values());
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    median: sorted[(sorted.length - 1) / 2],
    mode: [...counts].find(([, c]) => c === top)?.[0] ?? sorted[0],
    range: sorted[sorted.length - 1] - sorted[0],
  };
}

/** @type {QuestionType} */
export const statistics = {
  id: "statistics",
  name: "Mean, median, mode and range",
  generate(rng) {
    const values = dataSet(rng);
    const set = rng.pick(SETS);
    const stats = summarize(values);
    const measure = rng.pick(/** @type {const} */ (["mean", "median", "mode", "range"]));
    const answer = stats[measure];
    // The other summaries, and the middle of the list before it is put in order.
    const unsorted = values[(values.length - 1) / 2];
    return {
      prompt: `Here are the ${set.what}: ${values.join(", ")}. What is the ${measure}?`,
      answer,
      wrong: wrongNumbers(rng, answer, [stats.mean, stats.median, stats.mode, stats.range, unsorted].filter(v => v !== answer), { min: 0 }),
      hint: {
        mean: "Add them all up, then share the total equally among them.",
        median: "Put them in order first, then find the one in the middle.",
        mode: "Which number comes up most often?",
        range: "Take the smallest from the biggest.",
      }[measure],
      difficulty: measure === "mean" ? 3 : measure === "median" ? 2 : 1,
    };
  },
};
