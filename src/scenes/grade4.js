// 4th grade's teaching scenes. docs/SCENES.md says how to write one.

import { formatDecimal } from "../questions/decimals.js";

/** @import { Scene, ScenePicture } from "../scenes.js" */

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Tenths and hundredths on a grid of 100, as decimals (4.NF.5-6).
    chapter: "4-decimals",
    steps(rng, { monster }) {
      const frozen = 10 * rng.int(2, 7) + rng.int(1, 9);
      const [tenths, ones] = [Math.floor(frozen / 10), frozen % 10];
      /** @param {number} shaded @param {string | string[]} [focus] */
      const wall = (shaded, focus) => /** @type {ScenePicture} */ ({ kind: "hundredths", grids: [shaded], ...(focus ? { focus } : {}) });
      // A second wall for the check, with digits that turn round into a different number.
      let other = frozen;
      while (other === frozen || other % 10 === Math.floor(other / 10)) other = 10 * rng.int(1, 8) + rng.int(1, 9);
      const turned = 10 * (other % 10) + Math.floor(other / 10);
      return [
        { who: "monster", say: `I am ${monster}! This is my wall of 100 ice blocks. I froze some of them. How much of my wall is frozen?`, picture: wall(frozen) },
        { who: "hero", say: "The whole wall is 1. Each column is one tenth of the wall, written 0.1.", picture: wall(frozen, "column-0") },
        { who: "hero", say: "Each little block is one hundredth of the wall, written 0.01.", picture: wall(frozen, `square-${frozen - 1}`) },
        { who: "hero", say: `${tenths} full columns and ${ones} more ${ones === 1 ? "block" : "blocks"} make ${frozen} hundredths. So ${formatDecimal(frozen, 2)} of the wall is frozen.`, picture: wall(frozen, ["full", "extra"]) },
        {
          who: "monster",
          say: `Then which column has just ${ones} frozen ${ones === 1 ? "block" : "blocks"}? Tap it!`,
          check: { kind: "tap", answers: [`column-${tenths}`], retry: "Look for the column that is only part frozen.", right: ones === 1 ? "Yes! That is the 1 hundredth." : `Yes! Those are the ${ones} hundredths.` },
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
