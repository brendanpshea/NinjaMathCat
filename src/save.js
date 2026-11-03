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
import { CURRICULUM } from "./curriculum.js";

/** @import { AdventureProgress } from "./adventures.js" */
/** @import { Mastery } from "./mastery.js" */

const KEY = "ninja-math-cat";

/** How many players one browser keeps, and how long a name may be. */
export const MOST_PLAYERS = 12;
export const LONGEST_NAME = 20;

/** How many progress codes a teacher's class view keeps (src/classroom.js). */
export const MOST_CODES = 60;

/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} heroId
 * @property {number} grade  the adventure being played: a whole grade, 0 for kindergarten
 * @property {number} xp  all the experience ever earned
 * @property {string[]} treasures  ids, in the order found
 * @property {Record<string, AdventureProgress>} adventures  progress in each grade's adventure, by grade
 * @property {Mastery} mastery  how well they know each kind of question
 * @property {number} played  battles started, the clock that review is timed by
 * @property {boolean} readAloud  read each question aloud as it comes
 * @property {number} backedUp  battles played when a progress code was last offered, to keep a copy
 * @property {Record<string, number>} challenges  the best one-minute challenge score in each grade, by grade
 */

/** Up to this grade, questions are read aloud unless a grown-up turns it off. */
export const READ_ALOUD_UP_TO = 2;

/**
 * @typedef {object} Save
 * @property {Player[]} players
 * @property {string | null} current  the id of the player last chosen
 * @property {boolean} muted
 * @property {boolean} locked  the grown-up lock: a grown-up's sum before changing a player, opening chapters or the report
 * @property {string[]} classCodes  progress codes a teacher pasted into the class view, the newest last
 */

/** @returns {Save} */
export function newSave() {
  return { players: [], current: null, muted: false, locked: false, classCodes: [] };
}

/**
 * The save with a new player in it, who becomes the current one. A name left
 * blank becomes "Player 2", or whichever number is next.
 * @param {Save} save
 * @param {{ name: string, heroId: string, grade: number, readAloud?: boolean }} choices
 * @returns {{ save: Save, player: Player }}
 */
export function addPlayer(save, { name, heroId, grade, readAloud }) {
  if (save.players.length >= MOST_PLAYERS) throw new RangeError(`At most ${MOST_PLAYERS} players`);
  const number = nextNumber(save);
  const year = ADVENTURE_GRADES.includes(grade) ? grade : ADVENTURE_GRADES[0];
  /** @type {Player} */
  const player = {
    id: `p${number}`,
    name: cleanName(name) || `Player ${number}`,
    heroId: HEROES.some(h => h.id === heroId) ? heroId : DEFAULT_HERO.id,
    grade: year,
    readAloud: readAloud ?? year <= READ_ALOUD_UP_TO,
    xp: 0,
    treasures: [],
    adventures: {},
    mastery: {},
    played: 0,
    backedUp: 0,
    challenges: {},
  };
  return { save: { ...save, players: [...save.players, player], current: player.id }, player };
}

/**
 * The save with a player brought from another device (src/progress_code.js),
 * put right as a stored player is, given the next id, and made the current
 * one; null if there's no room, or nothing usable came.
 * @param {Save} save
 * @param {Record<string, unknown>} stored
 * @returns {{ save: Save, player: Player } | null}
 */
export function importPlayer(save, stored) {
  if (save.players.length >= MOST_PLAYERS) return null;
  // Brought by a progress code, so a copy has just been kept.
  const player = cleanPlayer({ ...stored, id: `p${nextNumber(save)}`, backedUp: stored.played }, new Set());
  if (!player) return null;
  return { save: { ...save, players: [...save.players, player], current: player.id }, player };
}

/**
 * The number for the next player's id.
 * @param {Save} save
 */
function nextNumber(save) {
  return 1 + Math.max(0, ...save.players.map(p => Number(p.id.slice(1)) || 0));
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
    return { players: player ? [player] : [], current: player?.id ?? null, muted: stored.muted === true, locked: false, classCodes: [] };
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
    locked: stored.locked === true,
    classCodes: Array.isArray(stored.classCodes)
      ? stored.classCodes.filter((/** @type {unknown} */ c) => typeof c === "string" && c.startsWith("NMC1-") && c.length < 20000).slice(-MOST_CODES)
      : [],
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
  const played = Number.isInteger(stored.played) && stored.played >= 0 ? stored.played : 0;
  /** @type {Mastery} */
  const mastery = {};
  for (const { type } of CURRICULUM) {
    const m = stored.mastery?.[type.id];
    if (m && typeof m.score === "number" && m.score >= 0 && m.score <= 1 && Number.isInteger(m.seen) && m.seen > 0 && Number.isInteger(m.last) && m.last >= 0) {
      mastery[type.id] = { score: m.score, seen: m.seen, last: Math.min(m.last, played), ...(Number.isInteger(m.day) && m.day > 0 ? { day: m.day } : {}) };
    }
  }
  const grade = ADVENTURE_GRADES.includes(stored.grade) ? stored.grade : ADVENTURE_GRADES[0];
  /** @type {Record<string, number>} */
  const challenges = {};
  for (const year of ADVENTURE_GRADES) {
    const best = stored.challenges?.[year];
    if (Number.isInteger(best) && best > 0 && best < 1000) challenges[year] = best;
  }
  return {
    id: stored.id,
    name: cleanName(stored.name) || `Player ${stored.id.slice(1)}`,
    heroId: HEROES.some(h => h.id === stored.heroId) ? stored.heroId : DEFAULT_HERO.id,
    grade,
    readAloud: typeof stored.readAloud === "boolean" ? stored.readAloud : grade <= READ_ALOUD_UP_TO,
    xp: Number.isInteger(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
    treasures: Array.isArray(stored.treasures) ? [...new Set(stored.treasures.filter((/** @type {unknown} */ id) => typeof id === "string" && known.has(id)))] : [],
    adventures,
    mastery,
    played,
    backedUp: Number.isInteger(stored.backedUp) && stored.backedUp >= 0 ? Math.min(stored.backedUp, played) : 0,
    challenges,
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
