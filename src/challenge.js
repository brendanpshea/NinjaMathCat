// The one-minute challenge: as many questions as can be answered in a minute,
// from every topic the adventure has brought in so far. No hints and no
// teaching scenes: right or wrong, the next question comes. Kept apart from
// the page, as a battle is (src/battle.js), so its rules can be tested;
// src/ui/challenge_screen.js runs the clock.

import { chaptersFor, levelsFor, nextLevel } from "./adventures.js";
import { pickQuestion, questionKey } from "./curriculum.js";
import { isCorrect } from "./questions/common.js";

/** @import { AdventureProgress } from "./adventures.js" */
/** @import { Mix } from "./curriculum.js" */
/** @import { Answer, Question } from "./questions/common.js" */
/** @import { Outcome } from "./mastery.js" */
/** @import { Rng } from "./rng.js" */

/** How long a challenge lasts, in seconds. */
export const CHALLENGE_SECONDS = 60;

/** The first grade that offers one: younger children play untimed. */
export const CHALLENGE_FROM = 3;

/**
 * @typedef {object} Challenge
 * @property {number} grade
 * @property {Mix} mix  which questions it asks
 * @property {Question} question  the one to answer now
 * @property {string[]} asked  every question asked so far, by questionKey, so none comes up twice
 * @property {number} score  questions answered right
 * @property {{ type: string, outcome: Outcome, prompt: string, answer: Answer, pictured: boolean }[]} answers  in order;
 *   pictured: the question had a picture, so its words alone don't say it all
 */

/**
 * Which questions a challenge asks: every kind brought in by the chapters
 * reached so far, equally often, pitched at the point in the year reached,
 * and on the quick side, since the clock is running.
 * @param {number} grade
 * @param {AdventureProgress} progress
 * @returns {Mix}
 */
export function challengeMix(grade, progress) {
  const chapters = chaptersFor(grade);
  const levels = levelsFor(grade);
  const reached = (nextLevel(levels, progress) ?? levels[levels.length - 1]).chapter;
  const kinds = [...new Set(chapters.slice(0, reached + 1).flatMap(c => [...c.learn, ...(c.warmup ?? [])]))];
  return kinds.map(type => ({ type, grade: chapters[reached].at, weight: 1, most: 2 }));
}

/**
 * @param {Rng} rng
 * @param {number} grade
 * @param {AdventureProgress} progress
 * @returns {Challenge}
 */
export function startChallenge(rng, grade, progress) {
  const mix = challengeMix(grade, progress);
  const question = pickQuestion(rng, mix);
  return { grade, mix, question, asked: [questionKey(question)], score: 0, answers: [] };
}

/**
 * Answer the question. Right or wrong, a new one comes, of another kind where
 * the mix has one.
 * @param {Challenge} challenge
 * @param {Answer} choice  one of the question's choices
 * @param {Rng} rng
 * @returns {{ challenge: Challenge, correct: boolean }}
 */
export function answerChallenge(challenge, choice, rng) {
  const q = challenge.question;
  const correct = isCorrect(q, choice);
  const question = pickQuestion(rng, challenge.mix, q.type, challenge.asked);
  return {
    correct,
    challenge: {
      ...challenge,
      question,
      asked: [...challenge.asked, questionKey(question)],
      score: challenge.score + Number(correct),
      answers: [...challenge.answers, { type: q.type, outcome: correct ? "firstTry" : "missed", prompt: q.prompt, answer: q.answer, pictured: Boolean(q.visual) }],
    },
  };
}

/**
 * The best scores, by grade, with a new score counted.
 * @param {Record<string, number>} best
 * @param {number} grade
 * @param {number} score
 * @returns {{ best: Record<string, number>, before: number | null, newBest: boolean }}
 *   before: the best until now, null if this is the first; newBest: whether this beat it
 */
export function recordChallenge(best, grade, score) {
  const before = best[grade] ?? null;
  const newBest = score > (before ?? 0);
  return { best: newBest ? { ...best, [grade]: score } : best, before, newBest };
}
