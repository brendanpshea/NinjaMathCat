// For the teaching scene tests: each scene's steps for many seeds, with its
// grade, chapter and monster as the game would give them.
import { SCENES } from "../../src/scenes.js";
import { ADVENTURE_GRADES, chaptersFor, residents, settingFor } from "../../src/adventures.js";
import { createRng } from "../../src/rng.js";

/** Every chapter, with its grade and its place in the grade. */
export const CHAPTERS = ADVENTURE_GRADES.flatMap(grade => chaptersFor(grade).map((chapter, place) => ({ grade, place, chapter })));

/**
 * Each scene's steps for seeds 1 to `seeds`; only the named chapter's, if one is named.
 * @param {string} [only]  a chapter id
 * @param {number} [seeds]
 */
export function* playedScenes(only, seeds = 150) {
  for (const scene of SCENES) {
    if (only && scene.chapter !== only) continue;
    const found = CHAPTERS.find(c => c.chapter.id === scene.chapter);
    if (!found) throw new Error(`No chapter ${scene.chapter}`);
    const { grade, place, chapter } = found;
    const monster = residents(settingFor(grade, place))[0].name;
    for (let seed = 1; seed <= seeds; seed++) {
      yield { scene, grade, chapter, steps: scene.steps(createRng(seed), { monster, hero: "Ninja Cat" }), at: `${scene.chapter}, seed ${seed}` };
    }
  }
}

/**
 * The picture showing at each step: the step's own, or the last one before it.
 * @param {import("../../src/scenes.js").SceneStep[]} steps
 */
export function picturesOf(steps) {
  let picture;
  return steps.map(step => (picture = step.picture ?? picture));
}
