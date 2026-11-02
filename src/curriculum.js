// What each grade practises. A grade is a single number: 0 is the start of
// kindergarten, 0.5 the middle of it, 1 the start of first grade, and so on,
// up to 6.5, the middle of sixth grade. Each question type says which grades
// draw on it and which Common Core standards it covers (src/standards.js).

import { makeQuestion } from "./questions/common.js";
import { addition, subtraction, missingNumber, multiplication, division } from "./questions/arithmetic.js";
import { counting, sequence, skipCounting, comparison } from "./questions/number_sense.js";
import { patterns } from "./questions/patterns.js";
import { money } from "./questions/money.js";
import { time } from "./questions/time.js";
import { shapes } from "./questions/shapes.js";
import { wordAddition, wordSubtraction, wordMultiplication, wordDivision, wordTwoStep } from "./questions/word_problems.js";
import { pictureGraph, barGraph } from "./questions/graphs.js";
import { numberLine, fractionLine } from "./questions/number_lines.js";
import { fractions } from "./questions/fractions.js";
import { rounding, placeValue } from "./questions/place_value.js";
import { decimals } from "./questions/decimals.js";
import { fractionCompare, fractionArithmetic } from "./questions/fraction_ops.js";
import { factors, commonFactors } from "./questions/factors.js";
import { expressions, equations } from "./questions/algebra.js";
import { ratios } from "./questions/ratios.js";
import { integers } from "./questions/integers.js";
import { statistics } from "./questions/statistics.js";
import { area, volume, conversions } from "./questions/measurement.js";
import { tensAndOnes, numberPairs, equalSign, oddEven } from "./questions/early_number.js";
import { measuring } from "./questions/measuring.js";
import { angles, coordinates } from "./questions/geometry.js";
import { linePlot, dataDisplays } from "./questions/plots.js";
import { fractionStories } from "./questions/fraction_stories.js";

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
  { grade: 3.5, label: "3rd grade (mid-year)" },
  { grade: 4, label: "4th grade" },
  { grade: 4.5, label: "4th grade (mid-year)" },
  { grade: 5, label: "5th grade" },
  { grade: 5.5, label: "5th grade (mid-year)" },
  { grade: 6, label: "6th grade" },
  { grade: 6.5, label: "6th grade (mid-year)" },
];

/**
 * The grades that draw on each question type, `from` and `to` both included,
 * and the Common Core standards it covers, which are where its placement
 * comes from. Within its span, a type scales itself to the grade.
 * @type {readonly { type: QuestionType, from: number, to: number, standards: string[] }[]}
 */
export const CURRICULUM = [
  { type: counting, from: 0, to: 0.5, standards: ["K.CC.4", "K.CC.5", "K.MD.3"] },
  { type: measuring, from: 0, to: 2.5, standards: ["K.MD.2", "1.MD.1", "1.MD.2", "2.MD.1", "2.MD.2", "2.MD.3", "2.MD.4", "2.MD.5"] },
  { type: sequence, from: 0, to: 1.5, standards: ["K.CC.2", "1.NBT.1"] },
  { type: skipCounting, from: 0, to: 4.5, standards: ["K.CC.1", "2.NBT.2", "3.OA.9", "4.OA.5"] },
  { type: comparison, from: 0, to: 4.5, standards: ["K.CC.6", "K.CC.7", "1.NBT.3", "2.NBT.4", "4.NBT.2"] },
  { type: patterns, from: 0, to: 1.5, standards: [] },
  { type: numberPairs, from: 0, to: 1, standards: ["K.OA.3", "K.OA.4"] },
  { type: tensAndOnes, from: 0.5, to: 2.5, standards: ["K.NBT.1", "1.NBT.2", "1.NBT.4", "1.NBT.5", "1.NBT.6", "2.NBT.1", "2.NBT.3", "2.NBT.8"] },
  { type: equalSign, from: 1, to: 2.5, standards: ["1.OA.3", "1.OA.7"] },
  { type: oddEven, from: 2, to: 2.5, standards: ["2.OA.3"] },
  { type: shapes, from: 0, to: 5.5, standards: ["K.G.1", "K.G.2", "K.G.3", "K.G.4", "1.G.1", "2.G.1", "2.G.2", "3.G.1", "4.G.2", "4.G.3", "5.G.3", "5.G.4"] },
  { type: addition, from: 0, to: 4.5, standards: ["K.OA.5", "1.OA.6", "2.OA.2", "2.NBT.5", "2.NBT.6", "2.NBT.7", "3.NBT.2", "4.NBT.4"] },
  { type: subtraction, from: 0, to: 4.5, standards: ["K.OA.5", "1.OA.6", "2.OA.2", "2.NBT.5", "2.NBT.6", "2.NBT.7", "3.NBT.2", "4.NBT.4"] },
  { type: missingNumber, from: 1, to: 4.5, standards: ["1.OA.4", "1.OA.8", "3.OA.4", "3.OA.5", "3.OA.6"] },
  { type: wordAddition, from: 0, to: 4.5, standards: ["K.OA.2", "1.OA.1", "1.OA.2", "2.OA.1"] },
  { type: wordSubtraction, from: 0, to: 4.5, standards: ["K.OA.2", "1.OA.1", "2.OA.1"] },
  { type: time, from: 1, to: 4, standards: ["1.MD.3", "2.MD.7", "3.MD.1", "4.MD.2"] },
  { type: money, from: 2, to: 4, standards: ["2.MD.8", "4.MD.2"] },
  { type: pictureGraph, from: 1, to: 3.5, standards: ["1.MD.4", "2.MD.10", "3.MD.3"] },
  { type: fractions, from: 1, to: 3.5, standards: ["1.G.3", "2.G.3", "3.NF.1", "3.G.2"] },
  { type: barGraph, from: 2, to: 3.5, standards: ["2.MD.10", "3.MD.3"] },
  { type: numberLine, from: 1, to: 3.5, standards: ["1.OA.5", "2.MD.6"] },
  { type: wordMultiplication, from: 2, to: 4.5, standards: ["2.OA.4", "3.OA.1", "3.OA.3", "4.OA.1", "4.OA.2"] },
  { type: multiplication, from: 2.5, to: 5.5, standards: ["2.OA.4", "3.OA.7", "3.NBT.3", "4.NBT.5", "5.NBT.5"] },
  { type: division, from: 3, to: 6.5, standards: ["3.OA.7", "4.NBT.6", "5.NBT.6", "6.NS.2"] },
  { type: wordDivision, from: 3, to: 4.5, standards: ["3.OA.2", "3.OA.3", "4.OA.3"] },
  { type: wordTwoStep, from: 3, to: 4.5, standards: ["3.OA.8", "4.OA.3"] },
  { type: fractionLine, from: 3, to: 3.5, standards: ["3.NF.2"] },
  { type: rounding, from: 3, to: 5.5, standards: ["3.NBT.1", "4.NBT.3", "5.NBT.4"] },
  { type: fractionCompare, from: 3, to: 4.5, standards: ["3.NF.3", "4.NF.1", "4.NF.2"] },
  { type: area, from: 3, to: 6.5, standards: ["3.MD.5", "3.MD.6", "3.MD.7", "3.MD.8", "4.MD.3", "6.G.1"] },
  { type: linePlot, from: 2, to: 5.5, standards: ["2.MD.9", "3.MD.4", "4.MD.4", "5.MD.2"] },
  { type: conversions, from: 3, to: 5.5, standards: ["3.MD.2", "4.MD.1", "5.MD.1"] },
  { type: placeValue, from: 4, to: 5.5, standards: ["4.NBT.1", "4.NBT.2", "5.NBT.1", "5.NBT.3"] },
  { type: decimals, from: 4, to: 6.5, standards: ["4.NF.5", "4.NF.6", "4.NF.7", "5.NBT.2", "5.NBT.3", "5.NBT.7", "6.NS.3"] },
  { type: fractionArithmetic, from: 4, to: 6.5, standards: ["4.NF.3", "4.NF.4", "5.NF.1", "5.NF.4", "5.NF.7", "6.NS.1"] },
  { type: factors, from: 4, to: 4.5, standards: ["4.OA.4"] },
  { type: fractionStories, from: 4.5, to: 5.5, standards: ["4.NF.3", "4.NF.4", "5.NF.2", "5.NF.3", "5.NF.5", "5.NF.6"] },
  { type: angles, from: 4, to: 4.5, standards: ["4.MD.5", "4.MD.6", "4.MD.7", "4.G.1"] },
  { type: volume, from: 5, to: 6.5, standards: ["5.MD.3", "5.MD.4", "5.MD.5", "6.G.2", "6.G.4"] },
  { type: coordinates, from: 5, to: 6.5, standards: ["5.G.1", "5.G.2", "6.NS.6", "6.NS.8", "6.G.3"] },
  { type: expressions, from: 5, to: 6.5, standards: ["5.OA.1", "5.OA.2", "5.OA.3", "6.EE.1", "6.EE.2", "6.EE.3", "6.EE.4", "6.EE.6"] },
  { type: commonFactors, from: 6, to: 6.5, standards: ["6.NS.4"] },
  { type: equations, from: 6, to: 6.5, standards: ["6.EE.5", "6.EE.7", "6.EE.8", "6.EE.9"] },
  { type: ratios, from: 6, to: 6.5, standards: ["6.RP.1", "6.RP.2", "6.RP.3"] },
  { type: integers, from: 6, to: 6.5, standards: ["6.NS.5", "6.NS.6", "6.NS.7"] },
  { type: statistics, from: 6, to: 6.5, standards: ["6.SP.3", "6.SP.5"] },
  { type: dataDisplays, from: 6, to: 6.5, standards: ["6.SP.1", "6.SP.2", "6.SP.4"] },
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
  return pickQuestion(rng, mixForGrade(grade), avoid);
}

/**
 * Which questions to ask, and how often: each part is a question type, the
 * grade to pitch it at, how much of the time to ask it, and the range of
 * difficulty (1 to 3) to try for: no harder than `most`, and no easier than
 * `least` if given; and, if given, one of the type's focuses, to ask
 * something narrower.
 * @typedef {{ type: string, grade: number, weight: number, most: number, least?: number, focus?: string }[]} Mix
 */

/**
 * Every type a grade asks, equally often, at any difficulty.
 * @param {number} grade
 * @returns {Mix}
 */
export function mixForGrade(grade) {
  const types = typesForGrade(grade);
  if (types.length === 0) throw new RangeError(`No question types for grade ${grade}`);
  return types.map(type => ({ type: type.id, grade, weight: 1, most: 3 }));
}

/**
 * The question type with this id.
 * @param {string} id
 */
export function typeById(id) {
  const row = CURRICULUM.find(r => r.type.id === id);
  if (!row) throw new RangeError(`No question type "${id}"`);
  return row.type;
}

/**
 * How many tries at a question no harder than a part allows, before taking
 * the easiest one made. Easy questions of some types are rare at some grades,
 * and some types have none, so a part's limit is how easy to try for.
 */
const TRIES_FOR_DIFFICULTY = 24;

/**
 * A question from a mix: a part picked by weight, then a question of its type
 * in the part's range of difficulty, where one comes up in a few tries, or
 * else the nearest to it.
 * @param {Rng} rng
 * @param {Mix} mix
 * @param {string} [avoid]  a type not to ask, usually the last one
 * @returns {Question}
 */
export function pickQuestion(rng, mix, avoid) {
  const others = mix.filter(p => p.type !== avoid && p.weight > 0);
  const parts = others.length > 0 ? others : mix;
  if (parts.length === 0) throw new RangeError("A mix needs at least one part");
  let roll = rng.next() * parts.reduce((sum, p) => sum + p.weight, 0);
  const part = parts.find(p => (roll -= p.weight) < 0) ?? parts[parts.length - 1];
  const type = typeById(part.type);
  const least = part.least ?? 1;
  /** How far a question's difficulty is outside the part's range. */
  const off = (/** @type {Question} */ q) => Math.max(0, least - q.difficulty, q.difficulty - part.most);
  let nearest = makeQuestion(rng, type, part.grade, part.focus);
  for (let i = 1; i < TRIES_FOR_DIFFICULTY && off(nearest) > 0; i++) {
    const another = makeQuestion(rng, type, part.grade, part.focus);
    if (off(another) < off(nearest)) nearest = another;
  }
  return nearest;
}
