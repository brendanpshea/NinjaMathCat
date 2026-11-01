// Repeating patterns of pictures: find what comes next, or what is missing.

import { atGrade } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/**
 * Sets of pictures that are easy to tell apart at a glance. Every one is a
 * single emoji that has been around long enough to show up on school devices.
 */
export const PICTURE_SETS = [
  ["🔴", "🔵", "🟢", "🟡", "🟣"],
  ["🐶", "🐱", "🐸", "🐵", "🐷"],
  ["🍎", "🍌", "🍇", "🍓", "🍊"],
  ["⭐", "🌙", "🌞", "🌈", "⚡"],
  ["⚽", "🏀", "🎾", "🏈", "⚾"],
  ["🚗", "🚲", "🚀", "🚂", "⛵"],
  ["🌻", "🌵", "🍄", "🌲", "🍁"],
  ["🐟", "🐙", "🐢", "🦀", "🐳"],
];

/**
 * The cores a grade repeats, as letters; each letter is a different picture.
 * Kindergarten starts with AB and then tries AAB, ABB and ABC.
 * @type {readonly [number, string[]][]}
 */
const CORES = [
  [0, ["AB"]],
  [0.5, ["AB", "AAB", "ABB", "ABC"]],
  [Infinity, ["AAB", "ABB", "ABC", "AABB", "ABBC", "ABCD"]],
];

/** @type {QuestionType} */
export const patterns = {
  id: "patterns",
  name: "Patterns",
  generate(rng, grade) {
    const core = rng.pick(atGrade(grade, CORES));
    const letters = [...new Set(core)];
    const pictures = rng.shuffle(rng.pick(PICTURE_SETS));
    /** @param {string} letter */
    const pictureFor = letter => pictures[letters.indexOf(letter)];

    const repeats = core.length === 2 ? 4 : 3;
    /** @type {(string | null)[]} */
    const items = Array.from({ length: core.length * repeats }, (_, i) => pictureFor(core[i % core.length]));
    // The youngest only ever say what comes next; after that the gap can be anywhere.
    const gap = grade < 0.5 ? items.length - 1 : rng.int(0, items.length - 1);
    const answer = /** @type {string} */ (items[gap]);
    items[gap] = null;

    return {
      prompt: gap === items.length - 1 ? "What comes next?" : "What is missing from the pattern?",
      visual: { kind: "pattern", items },
      answer,
      // The pattern's other pictures first, since they are the tempting ones.
      wrong: [
        ...rng.shuffle(letters.map(pictureFor).filter(p => p !== answer)),
        ...rng.shuffle(pictures.slice(letters.length)),
      ],
      hint: "Find the part that repeats. Say it out loud.",
      difficulty: Math.min(3, core.length - 1),
    };
  },
};
