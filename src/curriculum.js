// What each grade practises. A grade is a single number: 0 is the start of
// kindergarten, 0.5 the middle of it, 1 the start of first grade, and so on.
// Grades 4 to 6 join the ladder as their question types are written; adding
// one is a row in GRADES and rows in CURRICULUM.

import { makeQuestion } from "./questions/common.js";
import { addition, subtraction, missingNumber, multiplication, division } from "./questions/arithmetic.js";
import { counting, sequence, skipCounting, comparison } from "./questions/number_sense.js";
import { patterns } from "./questions/patterns.js";
import { money } from "./questions/money.js";
import { time } from "./questions/time.js";
import { shapes } from "./questions/shapes.js";
import { wordAddition, wordSubtraction, wordMultiplication, wordDivision } from "./questions/word_problems.js";
import { pictureGraph, barGraph } from "./questions/graphs.js";
import { numberLine, fractionLine } from "./questions/number_lines.js";
import { fractions } from "./questions/fractions.js";

/** @import { Rng } from "./rng.js" */
/** @import { Question, QuestionType } from "./questions/common.js" */

/** The grades a player can choose, in order. */
export const GRADES = [
  { grade: 0, label: "Kindergarten" },
  { grade: 0.5, label: "Kindergarten (mid-year)" },
  { grade: 1, label: "1st grade" },
  { grade: 1.5, label: "1st grade (mid-year)" },
  { grade: 2, label: "2nd grade" },
  { grade: 2.5, label: "2nd grade (mid-year)" },
  { grade: 3, label: "3rd grade" },
];

/**
 * The grades that draw on each question type, `from` and `to` both included,
 * and the Common Core standards it covers, which are where its placement
 * comes from. Within its span, a type scales itself to the grade.
 * @type {readonly { type: QuestionType, from: number, to: number, standards: string[] }[]}
 */
export const CURRICULUM = [
  { type: counting, from: 0, to: 0.5, standards: ["K.CC.4", "K.CC.5"] },
  { type: sequence, from: 0, to: 1.5, standards: ["K.CC.2", "1.NBT.1"] },
  { type: skipCounting, from: 0, to: 3, standards: ["K.CC.1", "2.NBT.2", "3.OA.9"] },
  { type: comparison, from: 0, to: 3, standards: ["K.CC.6", "K.CC.7", "1.NBT.3", "2.NBT.4"] },
  { type: patterns, from: 0, to: 1.5, standards: [] },
  { type: shapes, from: 0, to: 3, standards: ["K.G.2", "1.G.1", "2.G.1", "3.G.1"] },
  { type: addition, from: 0, to: 3, standards: ["K.OA.5", "1.OA.6", "2.NBT.5", "2.NBT.6", "2.NBT.7", "3.NBT.2"] },
  { type: subtraction, from: 0, to: 3, standards: ["K.OA.5", "1.OA.6", "2.NBT.5", "2.NBT.6", "2.NBT.7", "3.NBT.2"] },
  { type: missingNumber, from: 1, to: 3, standards: ["1.OA.8"] },
  { type: wordAddition, from: 1, to: 3, standards: ["1.OA.1", "2.OA.1"] },
  { type: wordSubtraction, from: 1, to: 3, standards: ["1.OA.1", "2.OA.1"] },
  { type: time, from: 1, to: 3, standards: ["1.MD.3", "2.MD.7", "3.MD.1"] },
  { type: money, from: 1, to: 3, standards: ["2.MD.8"] },
  { type: pictureGraph, from: 1, to: 3, standards: ["1.MD.4", "2.MD.10", "3.MD.3"] },
  { type: fractions, from: 1, to: 3, standards: ["1.G.3", "2.G.3", "3.NF.1"] },
  { type: barGraph, from: 2, to: 3, standards: ["2.MD.10", "3.MD.3"] },
  { type: numberLine, from: 2, to: 3, standards: ["2.MD.6"] },
  { type: wordMultiplication, from: 2, to: 3, standards: ["2.OA.4", "3.OA.3"] },
  { type: multiplication, from: 2.5, to: 3, standards: ["2.OA.4", "3.OA.7"] },
  { type: division, from: 3, to: 3, standards: ["3.OA.7"] },
  { type: wordDivision, from: 3, to: 3, standards: ["3.OA.3"] },
  { type: fractionLine, from: 3, to: 3, standards: ["3.NF.2"] },
];

/**
 * The question types a grade draws on.
 * @param {number} grade
 * @returns {QuestionType[]}
 */
export function typesForGrade(grade) {
  return CURRICULUM.filter(({ from, to }) => grade >= from && grade <= to).map(({ type }) => type);
}

/**
 * A question for a grade, of one of its types chosen at random.
 * @param {Rng} rng
 * @param {number} grade
 * @param {string} [avoid]  a type not to ask, usually the last one, so the same kind of question doesn't come twice running
 * @returns {Question}
 */
export function generateQuestion(rng, grade, avoid) {
  const types = typesForGrade(grade);
  if (types.length === 0) throw new RangeError(`No question types for grade ${grade}`);
  const others = types.filter(t => t.id !== avoid);
  return makeQuestion(rng, rng.pick(others.length > 0 ? others : types), grade);
}
