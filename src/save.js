// What the game remembers in this browser: the hero and grade last picked,
// all the experience earned (the hero's level comes from it), the treasures
// found, and whether the sound is off. Nothing leaves the browser.
//
// Storage can be missing, full or blocked (a private window, a locked-down
// school device), so every read and write is allowed to fail: the game then
// plays on and simply forgets.

import { HEROES, DEFAULT_HERO } from "./heroes.js";
import { GRADES } from "./curriculum.js";
import { TREASURES } from "./treasures.js";

const KEY = "ninja-math-cat";

/**
 * @typedef {object} Save
 * @property {string} heroId
 * @property {number} grade
 * @property {number} xp
 * @property {string[]} treasures  ids, in the order found
 * @property {boolean} muted
 */

/** @returns {Save} */
export function newSave() {
  return { heroId: DEFAULT_HERO.id, grade: GRADES[0].grade, xp: 0, treasures: [], muted: false };
}

/**
 * The save in storage, or a new one. Anything in it that doesn't make sense
 * any more (a hero or treasure since removed, a grade not on the ladder) is
 * put right rather than trusted.
 * @param {Pick<Storage, "getItem"> | null | undefined} storage
 * @returns {Save}
 */
export function loadSave(storage) {
  const fresh = newSave();
  /** @type {any} */
  let stored;
  try {
    stored = JSON.parse(storage?.getItem(KEY) ?? "null");
  } catch {
    return fresh;
  }
  if (!stored || typeof stored !== "object") return fresh;
  const known = new Set(TREASURES.map(t => t.id));
  return {
    heroId: HEROES.some(h => h.id === stored.heroId) ? stored.heroId : fresh.heroId,
    grade: GRADES.some(g => g.grade === stored.grade) ? stored.grade : fresh.grade,
    xp: Number.isInteger(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
    treasures: Array.isArray(stored.treasures) ? [...new Set(stored.treasures.filter((/** @type {unknown} */ id) => typeof id === "string" && known.has(id)))] : [],
    muted: stored.muted === true,
  };
}

/**
 * Keep the save. Returns whether it was kept.
 * @param {Pick<Storage, "setItem"> | null | undefined} storage
 * @param {Save} save
 */
export function writeSave(storage, save) {
  try {
    storage?.setItem(KEY, JSON.stringify(save));
    return Boolean(storage);
  } catch {
    return false;
  }
}

/**
 * The browser's storage, if it will hand it over: touching localStorage can
 * itself throw where site data is blocked.
 * @returns {Storage | null}
 */
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
