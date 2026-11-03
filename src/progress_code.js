// A player's progress as a code to copy to another device. There is no
// account and no server: the code is text, to send by email or a class's
// message board, or paste from one browser into another, or into a teacher's
// class view (src/classroom.js). It holds the name, hero, grade, experience
// and treasures, the stars won on every level, what the game has learned
// about each kind of question, and the best challenge scores.
//
// A code that has been cut short or changed is either turned away or put
// right, as a save from storage is (src/save.js).

import { TREASURES } from "./treasures.js";
import { levelsFor } from "./adventures.js";

/** @import { Player } from "./save.js" */

const PREFIX = "NMC1-";

/**
 * Text as base64 that is safe in a URL or a message: letters, digits, - and _.
 * @param {string} text
 */
function toBase64(text) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** @param {string} code */
function fromBase64(code) {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

/**
 * A player's progress as a code. Levels are kept as their stars, one digit
 * each in the order of the adventure; treasures by where they come in the
 * list of treasures, so new treasures go at its end.
 * @param {Player} player
 */
export function encodePlayer(player) {
  const compact = {
    n: player.name,
    h: player.heroId,
    g: player.grade,
    x: player.xp,
    p: player.played,
    r: player.readAloud ? 1 : 0,
    t: player.treasures.map(id => TREASURES.findIndex(t => t.id === id)).filter(i => i >= 0),
    a: Object.fromEntries(Object.entries(player.adventures).map(([grade, progress]) => [
      grade,
      [levelsFor(Number(grade)).map(l => progress.done[l.id]?.stars ?? 0).join(""), progress.opened],
    ])),
    m: Object.fromEntries(Object.entries(player.mastery).map(([type, m]) => [type, [Math.round(m.score * 100), m.seen, m.last, ...(m.day !== undefined ? [m.day] : [])]])),
    c: player.challenges,
  };
  return PREFIX + toBase64(JSON.stringify(compact));
}

/**
 * The player a code holds, as a save would store it, still to be put right
 * and given an id when it's added (importPlayer in src/save.js); null if it
 * isn't a code at all. A level's stars stand for how well it went.
 * @param {string} code
 * @returns {Record<string, unknown> | null}
 */
export function decodePlayer(code) {
  const text = code.replace(/\s+/g, "");
  if (!text.startsWith(PREFIX)) return null;
  /** @type {any} */
  let c;
  try {
    c = JSON.parse(fromBase64(text.slice(PREFIX.length)));
  } catch {
    return null;
  }
  if (!c || typeof c !== "object") return null;
  /** @type {Record<string, { done: Record<string, unknown>, opened: unknown }>} */
  const adventures = {};
  for (const [grade, entry] of Object.entries(c.a ?? {})) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") continue;
    const levels = levelsFor(Number(grade)).slice(0, entry[0].length);
    /** @type {Record<string, unknown>} */
    const done = {};
    levels.forEach((level, i) => {
      const stars = Number(entry[0][i]);
      if (stars >= 1 && stars <= 3) done[level.id] = { stars, firstTry: [0, 5, 7, 9][stars], asked: 10 };
    });
    adventures[grade] = { done, opened: entry[1] };
  }
  /** @type {Record<string, unknown>} */
  const mastery = {};
  for (const [type, m] of Object.entries(c.m ?? {})) {
    if (Array.isArray(m)) mastery[type] = { score: Number(m[0]) / 100, seen: m[1], last: m[2], ...(m[3] !== undefined ? { day: m[3] } : {}) };
  }
  return {
    name: c.n,
    heroId: c.h,
    grade: c.g,
    xp: c.x,
    played: c.p,
    readAloud: c.r === 1,
    treasures: Array.isArray(c.t) ? c.t.map((/** @type {unknown} */ i) => TREASURES[Number(i)]?.id) : [],
    adventures,
    mastery,
    challenges: c.c,
  };
}
