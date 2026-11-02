// Kindergarten's teaching scenes. docs/SCENES.md says how to write one.

/** @import { Scene, ScenePicture } from "../scenes.js" */

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // A teen number is a full ten frame and some more (K.NBT.1).
    chapter: "0-teens",
    steps(rng, { monster }) {
      const n = rng.int(11, 19);
      const more = n - 10;
      /** @param {string} [focus] */
      const frames = focus => /** @type {ScenePicture} */ ({ kind: "ten_frame", frames: 2, filled: n, ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I rain dots. Too many to count!`, picture: frames() },
        { who: "hero", say: "Not too many for me! This frame is full. A full frame is 10.", picture: frames("frame-0") },
        { who: "hero", say: `This frame has ${more} more.`, picture: frames("frame-1") },
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
];
