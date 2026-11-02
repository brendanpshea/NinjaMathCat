// Teaching scenes: before a chapter's first battle, its first monster shows
// off its trick, and the hero works out, step by step over a picture, how to
// beat it. Each step is one idea: one line, said aloud and shown in a speech
// bubble, and one change to the picture. Checks along the way are tried with
// nothing at stake. The numbers are new each time, so a scene watched again
// is a new example. Each grade's scenes are in src/scenes/, and
// docs/SCENES.md says how to write one.

import { SCENES as K } from "./scenes/grade0.js";
import { SCENES as FIRST } from "./scenes/grade1.js";
import { SCENES as SECOND } from "./scenes/grade2.js";
import { SCENES as THIRD } from "./scenes/grade3.js";
import { SCENES as FOURTH } from "./scenes/grade4.js";
import { SCENES as FIFTH } from "./scenes/grade5.js";
import { SCENES as SIXTH } from "./scenes/grade6.js";

/** @import { Visual } from "./questions/common.js" */
/** @import { Rng } from "./rng.js" */

/**
 * A picture in a scene: any picture the questions use, with the parts the
 * step is about ringed. `focus` names parts or marks of the picture (its
 * data-part or data-marks), and one ring goes round them all.
 * @typedef {Visual & { focus?: string | string[] }} ScenePicture
 */

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
 * @property {ScenePicture} [picture]  the picture from this step on; the step before's stays if there is none
 * @property {SceneCheck} [check]  to try before the next step
 */

/**
 * @typedef {object} Scene
 * @property {string} chapter  the id of the chapter it opens
 * @property {(rng: Rng, cast: { monster: string, hero: string }) => SceneStep[]} steps
 */

/** Every scene, kindergarten's first. */
export const SCENES = [...K, ...FIRST, ...SECOND, ...THIRD, ...FOURTH, ...FIFTH, ...SIXTH];

/**
 * The scene that opens a chapter, if it has one.
 * @param {string} chapter  the chapter's id
 */
export function sceneFor(chapter) {
  return SCENES.find(s => s.chapter === chapter) ?? null;
}
