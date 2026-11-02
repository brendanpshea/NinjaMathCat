// Teaching scenes: before a chapter's first battle, its first monster shows
// off its trick, and the hero works out, step by step over a picture, how to
// beat it. Each step is one idea: one line, said aloud and shown in a speech
// bubble, and one change to the picture. Checks along the way are tried with
// nothing at stake. The numbers are new each time, so a scene watched again
// is a new example. docs/SCENES.md says how to write one.

import { formatDecimal } from "./questions/decimals.js";

/** @import { Visual } from "./questions/common.js" */
/** @import { Rng } from "./rng.js" */

/**
 * A question to try before going on, with no damage at stake: tap a part of
 * the picture (by its data-part), or pick one of a few answers. `retry` is
 * said after a wrong try, by the hero; `right` after the right one.
 * @typedef {{ kind: "tap", answers: string[], retry: string, right: string }
 *   | { kind: "choose", choices: (string | number)[], answer: string | number, retry: string, right: string }} SceneCheck
 */

/**
 * @typedef {object} SceneStep
 * @property {"monster" | "hero"} who  who says the line
 * @property {string} say  the line: said aloud, and shown in the speaker's bubble
 * @property {Visual} [picture]  the picture from this step on; the step before's stays if there is none
 * @property {SceneCheck} [check]  to try before the next step
 */

/**
 * @typedef {object} Scene
 * @property {string} chapter  the id of the chapter it opens
 * @property {(rng: Rng, cast: { monster: string, hero: string }) => SceneStep[]} steps
 */

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Kindergarten: a teen number is a full ten frame and some more (K.NBT.1).
    chapter: "0-teens",
    steps(rng, { monster }) {
      const n = rng.int(11, 19);
      const more = n - 10;
      /** @param {number} [focus] */
      const frames = focus => /** @type {Visual} */ ({ kind: "ten_frame", frames: 2, filled: n, ...(focus === undefined ? {} : { focus }) });
      return [
        { who: "monster", say: `I'm ${monster}! I rain dots. Too many to count!`, picture: frames() },
        { who: "hero", say: "Not too many for me! This frame is full. A full frame is 10.", picture: frames(0) },
        { who: "hero", say: `This frame has ${more} more.`, picture: frames(1) },
        { who: "hero", say: `10 and ${more} more make ${n}.`, picture: frames() },
        {
          who: "monster",
          say: "Humph. Which frame holds 10? Tap it!",
          check: { kind: "tap", answers: ["frame-0"], retry: "Find the frame with no empty boxes.", right: "Yes! That one holds 10." },
        },
        { who: "monster", say: "You can count my dots! Now, let's battle!" },
      ];
    },
  },
  {
    // Fourth grade: tenths and hundredths on a grid of 100, as decimals (4.NF.5-6).
    chapter: "4-decimals",
    steps(rng, { monster }) {
      const frozen = 10 * rng.int(2, 7) + rng.int(1, 9);
      const [tenths, ones] = [Math.floor(frozen / 10), frozen % 10];
      /** @param {number} shaded @param {{ column?: number, square?: number }} [focus] */
      const wall = (shaded, focus) => /** @type {Visual} */ ({ kind: "hundredths", grids: [shaded], ...(focus ? { focus } : {}) });
      // A second wall for the check, with digits that turn round into a different number.
      let other = frozen;
      while (other === frozen || other % 10 === Math.floor(other / 10)) other = 10 * rng.int(1, 8) + rng.int(1, 9);
      const turned = 10 * (other % 10) + Math.floor(other / 10);
      return [
        { who: "monster", say: `I am ${monster}! This is my wall of 100 ice blocks. I froze some of them. How much of my wall is frozen?`, picture: wall(frozen) },
        { who: "hero", say: "The whole wall is 1. Each column is one tenth of the wall, written 0.1.", picture: wall(frozen, { column: 0 }) },
        { who: "hero", say: "Each little block is one hundredth of the wall, written 0.01.", picture: wall(frozen, { square: frozen - 1 }) },
        { who: "hero", say: `${tenths} full columns and ${ones} more blocks make ${frozen} hundredths. So ${formatDecimal(frozen, 2)} of the wall is frozen.`, picture: wall(frozen) },
        {
          who: "monster",
          say: `Then which column has just ${ones} frozen ${ones === 1 ? "block" : "blocks"}? Tap it!`,
          check: { kind: "tap", answers: [`column-${tenths}`], retry: "Look for the column that is only part frozen.", right: `Yes! Those are the ${ones} hundredths.` },
        },
        {
          who: "monster",
          say: "Grr! Here is another wall. How much of it is frozen?",
          picture: wall(other),
          check: {
            kind: "choose",
            choices: rng.shuffle([formatDecimal(other, 2), formatDecimal(other, 1), formatDecimal(turned, 2), formatDecimal(100 - other, 2)]),
            answer: formatDecimal(other, 2),
            retry: "Count the full columns first: those are tenths. Then the blocks left over are hundredths.",
            right: "Yes! Tenths first, then hundredths.",
          },
        },
        { who: "monster", say: "You see right through my ice! Now, let's battle!" },
      ];
    },
  },
];

/**
 * The scene that opens a chapter, if it has one.
 * @param {string} chapter  the chapter's id
 */
export function sceneFor(chapter) {
  return SCENES.find(s => s.chapter === chapter) ?? null;
}
