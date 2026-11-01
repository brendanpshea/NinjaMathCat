// What every question type shares: the shape of a question, grade tables, and
// wrong answers built from the mistakes children actually make.

/** @import { Rng } from "../rng.js" */

/**
 * @typedef {number | string} Answer
 */

/**
 * A number line. Every position is a whole number of 1/den steps, so lines in
 * fourths or thirds stay exact: a line from 0 to 1 in fourths has den 4,
 * from 0, to 4, tick 1. Labels go at multiples of `label`; points are dots;
 * jumps are arcs from one position to another.
 * @typedef {object} NumberLine
 * @property {"number_line"} kind
 * @property {number} den
 * @property {number} from
 * @property {number} to
 * @property {number} tick
 * @property {number} label
 * @property {number[]} points
 * @property {[number, number][]} jumps
 */

/**
 * @typedef {object} PictureGraph
 * @property {"picture_graph"} kind
 * @property {string} title
 * @property {[string, string]} unit  what one data point is, singular and plural: ["child", "children"]
 * @property {number} each  how many each picture stands for
 * @property {{ label: string, icon: string, value: number }[]} rows
 */

/**
 * @typedef {object} BarGraph
 * @property {"bar_graph"} kind
 * @property {string} title
 * @property {string} axis  what the numbers count: "Number of children"
 * @property {number} scale  the step between gridlines
 * @property {number} max  the top of the scale
 * @property {{ label: string, value: number }[]} bars
 * @property {boolean} [histogram]  bars for intervals, touching (6.SP.4)
 */

/**
 * Data as X marks above a number line, one for each thing measured: a line
 * plot of lengths in fourths of an inch (3.MD.4), or a dot plot of whole
 * numbers (6.SP.4). As on a NumberLine, positions are whole numbers of 1/den
 * steps; `counts[i]` Xs stand at position from + i.
 * @typedef {object} LinePlot
 * @property {"line_plot"} kind
 * @property {string} title
 * @property {number} den
 * @property {number} from
 * @property {number[]} counts
 */

/**
 * A shape cut into equal parts, the first `shaded` of them shaded.
 * @typedef {object} FractionModel
 * @property {"fraction"} kind
 * @property {"circle" | "bar"} model
 * @property {number} parts
 * @property {number} shaded
 */

/**
 * A flat figure to measure: a rectangle, perhaps on a grid of unit squares,
 * or a triangle or parallelogram with its height dashed in. It is drawn to
 * scale, `width` (the base) by `height`; `labels` are what is written beside
 * the base and the height, such as "8 cm" or "?".
 * @typedef {object} AreaFigure
 * @property {"area"} kind
 * @property {"rectangle" | "triangle" | "parallelogram"} shape
 * @property {number} width
 * @property {number} height
 * @property {boolean} grid
 * @property {{ base: string, height: string }} [labels]
 */

/**
 * A box, drawn to scale: built of unit cubes, or with its edges labelled.
 * @typedef {object} CubeBox
 * @property {"cubes"} kind
 * @property {number} length
 * @property {number} width
 * @property {number} height
 * @property {boolean} cubes
 * @property {{ length: string, width: string, height: string }} [labels]
 */

/**
 * An angle `degrees` wide, between a base ray pointing left or right and a
 * ray turned up from it, perhaps laid on a protractor.
 * @typedef {object} AngleFigure
 * @property {"angle"} kind
 * @property {number} degrees
 * @property {"right" | "left"} base
 * @property {boolean} protractor
 */

/**
 * Labelled points on a coordinate grid running from min to max both ways,
 * joined in order into a shape if `shape` is set.
 * @typedef {object} CoordinateGrid
 * @property {"coordinates"} kind
 * @property {number} min
 * @property {number} max
 * @property {{ x: number, y: number, label: string }[]} points
 * @property {boolean} [shape]
 */

/**
 * Something to show beside the prompt. It is data, not markup: the
 * renderers in src/visuals/ decide how a clock or a graph looks.
 * @typedef {{ kind: "objects", emoji: string, count: number }
 *   | { kind: "pattern", items: (string | null)[] }
 *   | { kind: "money", items: string[] }
 *   | { kind: "clock", hours: number, minutes: number }
 *   | { kind: "shape", shape: string }
 *   | NumberLine | PictureGraph | BarGraph | LinePlot | FractionModel
 *   | AreaFigure | CubeBox | AngleFigure | CoordinateGrid} Visual
 */

/**
 * What a question type's generate() returns.
 * @typedef {object} Draft
 * @property {string} prompt
 * @property {Visual} [visual]  pattern items use null for the gap
 * @property {Answer} answer
 * @property {Answer[]} wrong  wrong answers, best first; the first three distinct ones are used
 * @property {string} hint  a nudge after a wrong try, which never gives the answer away
 * @property {number} difficulty  1 (easy) to 3 (hard), within the grade
 */

/**
 * A question ready to ask.
 * @typedef {object} Question
 * @property {string} type  the id of the QuestionType that made it
 * @property {string} prompt
 * @property {Visual} [visual]
 * @property {Answer} answer
 * @property {Answer[]} choices  four, shuffled, the answer among them
 * @property {string} hint
 * @property {number} difficulty
 */

/**
 * @typedef {object} QuestionType
 * @property {string} id
 * @property {string} name
 * @property {(rng: Rng, grade: number) => Draft} generate
 */

/**
 * A whole number as children read it: with commas from 10,000 up (4.NBT.2),
 * and a true minus sign for negatives (6.NS.5).
 * @param {number} n
 */
export function formatNumber(n) {
  const size = Math.abs(n);
  const digits = size >= 10000 ? size.toLocaleString("en-US") : String(size);
  return n < 0 ? `−${digits}` : digits;
}

/**
 * Look a grade up in a table of [up to this grade, value] rows, in rising
 * order. End the table with an Infinity row so that every grade finds one.
 * @template T
 * @param {number} grade
 * @param {readonly (readonly [number, T])[]} rows
 * @returns {T}
 */
export function atGrade(grade, rows) {
  const row = rows.find(([upTo]) => grade <= upTo);
  if (!row) throw new RangeError(`No row for grade ${grade}`);
  return row[1];
}

/**
 * Wrong answers for a numeric question: whole numbers, never below `min`,
 * never the answer.
 *
 * Mistakes like "one too many" fall on both sides of the answer, so if they
 * were used as they come the answer would nearly always be the middle number
 * and a child could pick it without doing the sum. Instead, how many wrong
 * answers fall below the right one is chosen first (none to three, equally
 * often, where there is room), and each side is filled from `likely` (the
 * mistakes this kind of question invites) before near misses.
 *
 * Near misses go in steps of `step`: where every sensible answer is a whole
 * number of hundreds, as in rounding to the nearest hundred, a near miss of
 * 707,181 would give itself away, and 707,100 does not.
 * @param {Rng} rng
 * @param {number} answer
 * @param {readonly number[]} likely
 * @param {{ spread?: number, min?: number, step?: number }} [options]  spread: how many steps a near miss may stray
 * @returns {number[]}  three of them
 */
export function wrongNumbers(rng, answer, likely, { spread = 3, min = 0, step = 1 } = {}) {
  const room = Math.max(0, Math.floor((answer - min) / step));
  const below = Math.min(rng.int(0, 3), room);
  const lower = pickSide(rng, answer, likely, below, -1, spread, min, step);
  const upper = pickSide(rng, answer, likely, 3 - lower.length, 1, spread, min, step);
  return [...lower, ...upper];
}

/**
 * Up to `count` wrong answers on one side of the answer.
 * @param {Rng} rng
 * @param {number} answer
 * @param {readonly number[]} likely
 * @param {number} count
 * @param {1 | -1} side  1 above the answer, -1 below
 * @param {number} spread
 * @param {number} min
 * @param {number} step
 * @returns {number[]}
 */
function pickSide(rng, answer, likely, count, side, spread, min, step) {
  /** @param {number} n */
  const fits = n => Number.isInteger(n) && n >= min && Math.sign(n - answer) === side;
  const nearMisses = rng.shuffle(Array.from({ length: spread }, (_, i) => answer + side * step * (i + 1)));
  /** @type {Set<number>} */
  const out = new Set();
  for (const n of [...rng.shuffle(likely), ...nearMisses]) {
    if (out.size === count) break;
    if (fits(n)) out.add(n);
  }
  for (let n = answer + side * step * (spread + 1); out.size < count && fits(n); n += side * step) out.add(n);
  return [...out];
}

/**
 * Make one question of a type for a grade: three distinct wrong answers,
 * shuffled in with the right one.
 * @param {Rng} rng
 * @param {QuestionType} type
 * @param {number} grade
 * @returns {Question}
 */
export function makeQuestion(rng, type, grade) {
  const { wrong, ...draft } = type.generate(rng, grade);
  const seen = new Set([String(draft.answer)]);
  /** @type {Answer[]} */
  const kept = [];
  for (const w of wrong) {
    if (kept.length === 3) break;
    if (seen.has(String(w))) continue;
    seen.add(String(w));
    kept.push(w);
  }
  if (kept.length < 3) {
    throw new Error(`${type.id} at grade ${grade} made only ${kept.length} wrong answers for "${draft.prompt}"`);
  }
  return { type: type.id, ...draft, choices: rng.shuffle([draft.answer, ...kept]) };
}

/**
 * Whether a choice answers the question.
 * @param {Question} question
 * @param {Answer} choice
 */
export function isCorrect(question, choice) {
  return choice === question.answer;
}
