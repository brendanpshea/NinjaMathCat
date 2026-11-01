// What the game remembers in this browser: everyone who plays on it, each
// with a name, a hero, the grade of their adventure, their experience and
// treasures, and how far they have got in each grade's adventure; and whether
// the sound is off. Nothing leaves the browser.
//
// Storage can be missing, full or blocked (a private window, a locked-down
// school device), so every read and write is allowed to fail: the game then
// plays on and simply forgets.

import { HEROES, DEFAULT_HERO } from "./heroes.js";
import { TREASURES } from "./treasures.js";
import { ADVENTURE_GRADES, levelsFor, newProgress } from "./adventures.js";

/** @import { AdventureProgress } from "./adventures.js" */

const KEY = "ninja-math-cat";

/** How many players one browser keeps, and how long a name may be. */
export const MOST_PLAYERS = 12;
export const LONGEST_NAME = 20;

/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} heroId
 * @property {number} grade  the adventure being played: a whole grade, 0 for kindergarten
 * @property {number} xp  all the experience ever earned
 * @property {string[]} treasures  ids, in the order found
 * @property {Record<string, AdventureProgress>} adventures  progress in each grade's adventure, by grade
 */

/**
 * @typedef {object} Save
 * @property {Player[]} players
 * @property {string | null} current  the id of the player last chosen
 * @property {boolean} muted
 */

/** @returns {Save} */
export function newSave() {
  return { players: [], current: null, muted: false };
}

/**
 * The save with a new player in it, who becomes the current one. A name left
 * blank becomes "Player 2", or whichever number is next.
 * @param {Save} save
 * @param {{ name: string, heroId: string, grade: number }} choices
 * @returns {{ save: Save, player: Player }}
 */
export function addPlayer(save, { name, heroId, grade }) {
  if (save.players.length >= MOST_PLAYERS) throw new RangeError(`At most ${MOST_PLAYERS} players`);
  const number = 1 + Math.max(0, ...save.players.map(p => Number(p.id.slice(1)) || 0));
  /** @type {Player} */
  const player = {
    id: `p${number}`,
    name: cleanName(name) || `Player ${number}`,
    heroId: HEROES.some(h => h.id === heroId) ? heroId : DEFAULT_HERO.id,
    grade: ADVENTURE_GRADES.includes(grade) ? grade : ADVENTURE_GRADES[0],
    xp: 0,
    treasures: [],
    adventures: {},
  };
  return { save: { ...save, players: [...save.players, player], current: player.id }, player };
}

/**
 * The save with a player changed.
 * @param {Save} save
 * @param {string} id
 * @param {Partial<Omit<Player, "id">>} changes
 * @returns {Save}
 */
export function updatePlayer(save, id, changes) {
  return { ...save, players: save.players.map(p => (p.id === id ? { ...p, ...changes } : p)) };
}

/**
 * The save without a player.
 * @param {Save} save
 * @param {string} id
 * @returns {Save}
 */
export function removePlayer(save, id) {
  return { ...save, players: save.players.filter(p => p.id !== id), current: save.current === id ? null : save.current };
}

/**
 * The player last chosen, if they are still here.
 * @param {Save} save
 */
export function currentPlayer(save) {
  return save.players.find(p => p.id === save.current) ?? null;
}

/**
 * A player's progress in a grade's adventure.
 * @param {Player} player
 * @param {number} grade
 * @returns {AdventureProgress}
 */
export function progressIn(player, grade) {
  return player.adventures[grade] ?? newProgress();
}

/**
 * A name as typed, trimmed and cut to length.
 * @param {unknown} name
 */
function cleanName(name) {
  return typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, LONGEST_NAME) : "";
}

/**
 * The save in storage, or a new one. Anything in it that doesn't make sense
 * any more (a hero, treasure or level since removed, a grade without an
 * adventure) is put right rather than trusted. A save from before there were
 * players becomes the first player.
 * @param {Pick<Storage, "getItem"> | null | undefined} storage
 * @returns {Save}
 */
export function loadSave(storage) {
  /** @type {any} */
  let stored;
  try {
    stored = JSON.parse(storage?.getItem(KEY) ?? "null");
  } catch {
    return newSave();
  }
  if (!stored || typeof stored !== "object") return newSave();
  if (!Array.isArray(stored.players)) {
    // The first save kept one hero, a grade on the half-year ladder, experience and treasures.
    const player = cleanPlayer({ ...stored, id: "p1", name: "Player 1", grade: Math.floor(Number(stored.grade)) }, new Set());
    return { players: player ? [player] : [], current: player?.id ?? null, muted: stored.muted === true };
  }
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {Player[]} */
  const players = [];
  for (const p of stored.players.slice(0, MOST_PLAYERS)) {
    const player = cleanPlayer(p, seen);
    if (player) players.push(player);
  }
  return {
    players,
    current: players.some(p => p.id === stored.current) ? stored.current : null,
    muted: stored.muted === true,
  };
}

/**
 * A stored player put right, or null if it can't be.
 * @param {any} stored
 * @param {Set<string>} seen  ids already used
 * @returns {Player | null}
 */
function cleanPlayer(stored, seen) {
  if (!stored || typeof stored !== "object" || typeof stored.id !== "string" || !/^p\d+$/.test(stored.id) || seen.has(stored.id)) return null;
  seen.add(stored.id);
  const known = new Set(TREASURES.map(t => t.id));
  /** @type {Record<string, AdventureProgress>} */
  const adventures = {};
  for (const grade of ADVENTURE_GRADES) {
    const progress = cleanProgress(stored.adventures?.[grade], grade);
    if (progress) adventures[grade] = progress;
  }
  return {
    id: stored.id,
    name: cleanName(stored.name) || `Player ${stored.id.slice(1)}`,
    heroId: HEROES.some(h => h.id === stored.heroId) ? stored.heroId : DEFAULT_HERO.id,
    grade: ADVENTURE_GRADES.includes(stored.grade) ? stored.grade : ADVENTURE_GRADES[0],
    xp: Number.isInteger(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
    treasures: Array.isArray(stored.treasures) ? [...new Set(stored.treasures.filter((/** @type {unknown} */ id) => typeof id === "string" && known.has(id)))] : [],
    adventures,
  };
}

/**
 * Stored progress in a grade's adventure, keeping only levels that still exist
 * and results that make sense; null if there is nothing to keep.
 * @param {any} stored
 * @param {number} grade
 * @returns {AdventureProgress | null}
 */
function cleanProgress(stored, grade) {
  if (!stored || typeof stored !== "object") return null;
  const levels = levelsFor(grade);
  const chapters = new Set(levels.map(l => l.chapter)).size;
  const progress = newProgress();
  for (const level of levels) {
    const r = stored.done?.[level.id];
    if (r && [1, 2, 3].includes(r.stars) && Number.isInteger(r.asked) && Number.isInteger(r.firstTry) && r.firstTry >= 0 && r.firstTry <= r.asked) {
      progress.done[level.id] = { stars: r.stars, firstTry: r.firstTry, asked: r.asked };
    }
  }
  if (Number.isInteger(stored.opened) && stored.opened > 0) progress.opened = Math.min(stored.opened, chapters - 1);
  return progress;
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
