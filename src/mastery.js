// How well a player knows each kind of question, worked out from how they
// answer: a score from 0 to 1 that follows their recent answers, how many
// times they have met the kind, and when they last did. It decides what a
// level reviews and how hard to pitch each kind.
//
// Time is counted two ways: in battles played, and in days. Review that is
// spaced out over days is what makes things stick, and the better a kind is
// known, the longer it can wait: about two days when it's shaky, two weeks
// when it's strong. Without a day given, only battles count, so the same
// answers always lead to the same choices.

/**
 * @typedef {object} TypeMastery
 * @property {number} score  0 to 1: 1 is right the first time, every time lately
 * @property {number} seen  questions of this kind answered
 * @property {number} last  how many battles the player had played when last asked one
 * @property {number} [day]  the day it was last asked (dayNumber), where known
 */

/** @typedef {Record<string, TypeMastery>} Mastery  by question type */
/** @typedef {"firstTry" | "secondTry" | "missed"} Outcome */

/** What each way of finishing a question says about knowing it. */
const OUTCOME_VALUE = { firstTry: 1, secondTry: 0.5, missed: 0 };

/** How far one answer moves the score toward what it says: recent answers count most. */
const STEP = 0.3;

/** A score for a kind never met: nothing known either way. */
export const UNKNOWN = 0.5;

/** After this many battles without a kind, it is fully due for review. */
export const SPACING = 6;

/**
 * How much a kind never met needs review: less than one being missed, more
 * than one going well.
 */
export const NEW_NEED = 0.8;

/**
 * Which day a moment falls on, in the player's own time zone, counted from
 * 1 January 1970: so "a day later" means after midnight, as a child lives it.
 * @param {number} ms  as Date.now() gives it
 */
export function dayNumber(ms) {
  return Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / 86400000);
}

/**
 * How many days a kind can wait before it is fully due for review: two when
 * it's shaky, growing to fourteen when it's strong.
 * @param {number} score
 */
export function waitDays(score) {
  return 2 + 12 * Math.max(0, Math.min(1, (score - 0.3) / 0.6));
}

/**
 * Mastery after one more answer.
 * @param {Mastery} mastery
 * @param {string} type
 * @param {Outcome} outcome
 * @param {number} now  battles played so far
 * @param {number} [today]  the day it is (dayNumber), to space review over days
 * @returns {Mastery}
 */
export function learn(mastery, type, outcome, now, today) {
  const before = mastery[type] ?? { score: UNKNOWN, seen: 0, last: now };
  const score = before.score + STEP * (OUTCOME_VALUE[outcome] - before.score);
  return { ...mastery, [type]: { score: Math.round(score * 1000) / 1000, seen: before.seen + 1, last: now, ...(today !== undefined ? { day: today } : {}) } };
}

/**
 * In words: not met yet, needs practice, getting there, or strong.
 * @param {TypeMastery | undefined} m
 * @returns {"new" | "practise" | "growing" | "strong"}
 */
export function strength(m) {
  if (!m || m.seen === 0) return "new";
  return m.score < 0.5 ? "practise" : m.score < 0.8 ? "growing" : "strong";
}

/**
 * How much a kind needs review, from 0 to 1.5: more the weaker it is, and
 * more the longer since it was practised, in battles or, given the day, in
 * days measured against how long it can wait.
 * @param {TypeMastery | undefined} m
 * @param {number} now  battles played so far
 * @param {number} [today]  the day it is (dayNumber)
 */
export function need(m, now, today) {
  if (!m || m.seen === 0) return NEW_NEED;
  const battles = Math.min(1, Math.max(0, now - m.last) / SPACING);
  const days = today !== undefined && m.day !== undefined ? Math.min(1, Math.max(0, today - m.day) / waitDays(m.score)) : 0;
  return 1 - m.score + 0.5 * Math.max(battles, days);
}

/**
 * Of some kinds, the ones most due for review today, the most due first:
 * met before, last practised on an earlier day, and ranked by how long it
 * has been against how long each can wait.
 * @param {Mastery} mastery
 * @param {readonly string[]} kinds
 * @param {number} today  the day it is (dayNumber)
 * @param {number} count  at most this many
 */
export function dueToday(mastery, kinds, today, count) {
  /** @type {{ type: string, due: number }[]} */
  const due = [];
  for (const type of kinds) {
    const m = mastery[type];
    if (m && m.seen > 0 && m.day !== undefined && m.day < today) due.push({ type, due: (today - m.day) / waitDays(m.score) });
  }
  return due.sort((a, b) => b.due - a.due).slice(0, count).map(k => k.type);
}

/**
 * How to pitch a kind for this player: easier questions while it's shaky
 * (and, once it has been shaky for a while, from earlier in the year), and
 * harder ones once it's strong. Too few answers say nothing.
 * @param {TypeMastery | undefined} m
 * @returns {{ most: number, least: number, earlier: boolean }}
 */
export function steer(m) {
  if (!m || m.seen < 3) return { most: 3, least: 1, earlier: false };
  if (m.score < 0.4) return { most: 1, least: 1, earlier: m.seen >= 4 && m.score < 0.3 };
  if (m.score >= 0.85) return { most: 3, least: 2, earlier: false };
  return { most: 3, least: 1, earlier: false };
}
