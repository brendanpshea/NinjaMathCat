// How an adventure went, and whether a different grade would suit better.

import { GRADES } from "./curriculum.js";

/** @import { Tally } from "./battle.js" */

/** Fewer questions than this say too little to suggest anything. */
const ENOUGH = 10;

/**
 * Questions answered right the first time, out of all asked.
 * @param {Tally} tally
 */
export function firstTryShare(tally) {
  const asked = tally.firstTry + tally.secondTry + tally.missed;
  return asked === 0 ? 0 : tally.firstTry / asked;
}

/**
 * A gentler grade when most questions needed help, or a harder one when
 * nearly all were right straight away; null when this grade suits.
 * @param {Tally} tally
 * @param {number} grade
 * @returns {{ grade: number, label: string, easier: boolean } | null}
 */
export function suggestGrade(tally, grade) {
  if (tally.firstTry + tally.secondTry + tally.missed < ENOUGH) return null;
  const share = firstTryShare(tally);
  const at = GRADES.findIndex(g => g.grade === grade);
  const step = share < 0.5 ? -1 : share >= 0.9 ? 1 : 0;
  const next = GRADES[at + step];
  if (step === 0 || at < 0 || !next) return null;
  return { grade: next.grade, label: next.label, easier: step < 0 };
}
