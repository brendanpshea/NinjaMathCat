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
 * One ten frame, or two side by side for numbers up to 20, with counters
 * filling the first frame's top row, then its bottom row, then the next.
 * @typedef {object} TenFrame
 * @property {"ten_frame"} kind
 * @property {number} filled
 * @property {1 | 2} frames
 */

/**
 * Base-ten blocks: flats for hundreds, rods for tens, cubes for ones.
 * @typedef {object} BaseTen
 * @property {"base_ten"} kind
 * @property {number} hundreds
 * @property {number} tens
 * @property {number} ones
 */

/**
 * Ribbons laid out to compare or measure, one above another, each starting at
 * a whole unit and a whole number of units long; perhaps above a ruler, or
 * with cubes laid end to end along the first. Each ribbon has its color's
 * name written beside it.
 * @typedef {object} Lengths
 * @property {"lengths"} kind
 * @property {{ color: "red" | "blue" | "green" | "orange", from: number, length: number }[]} ribbons
 * @property {"inches" | "centimeters" | null} ruler
 * @property {boolean} cubes
 * @property {number} span  how many units the picture is across
 */

/**
 * A solid shape, drawn with a little depth and its hidden edges dashed.
 * @typedef {object} Solid
 * @property {"solid"} kind
 * @property {"cube" | "box" | "sphere" | "cylinder" | "cone" | "pyramid"} solid
 */

/**
 * A thing placed somewhere around a landmark, to say where it is (K.G.1).
 * @typedef {object} Scene
 * @property {"scene"} kind
 * @property {"cat" | "dog" | "bunny" | "ball" | "bear"} thing
 * @property {"box" | "chair" | "basket"} landmark
 * @property {"above" | "below" | "next to" | "in front of" | "behind"} place
 */

/**
 * Groups of things in rows, lined up so they can be matched one to one (K.CC.6).
 * @typedef {object} Groups
 * @property {"groups"} kind
 * @property {{ name: string, emoji: string, count: number }[]} rows
 */

/**
 * Bars the same length, one above another, each cut into equal parts with
 * some shaded, from the left (3.NF.3).
 * @typedef {object} FractionBars
 * @property {"fraction_bars"} kind
 * @property {{ parts: number, shaded: number, label?: string }[]} bars
 */

/**
 * Grids of 100 squares, shaded a column of ten at a time, so a whole column
 * is a tenth and a square a hundredth (4.NF.5-7).
 * @typedef {object} Hundredths
 * @property {"hundredths"} kind
 * @property {number[]} grids  how many squares of each grid are shaded
 * @property {string[]} [labels]  written under the grids
 */

/**
 * A line, ray or line segment, or two lines that are parallel, perpendicular
 * or crossing at a slant, tilted by `turn` degrees (4.G.1).
 * @typedef {object} Lines
 * @property {"lines"} kind
 * @property {"line" | "ray" | "segment" | "parallel" | "perpendicular" | "intersecting"} figure
 * @property {number} turn
 * @property {number} [cross]  for intersecting lines, the angle between them
 */

/**
 * A net that folds into a solid (6.G.4). A box or cube is drawn to scale,
 * with its edges labelled if `labels` is given.
 * @typedef {{ kind: "net", solid: "box" | "cube", length: number, width: number, height: number, labels?: { length: string, width: string, height: string } }
 *   | { kind: "net", solid: "triangular prism" | "square pyramid" }} Net
 */

/**
 * A rectangle with a smaller one cut from its top right corner: an L-shape,
 * with four sides labelled. The two sides of the corner cut away are not
 * labelled, so they have to be worked out (3.MD.7d).
 * @typedef {object} Composite
 * @property {"composite"} kind
 * @property {number} width
 * @property {number} height
 * @property {[number, number]} notch  the width and height of the corner cut away
 * @property {{ top: string, left: string, bottom: string, right: string }} labels
 * @property {boolean} split  a dashed line cutting it into two rectangles
 */

/**
 * A measuring jug with water in it, or a kitchen scale's dial and needle, to
 * read (3.MD.2). Marks every `step`, numbered every `labelEvery`.
 * @typedef {object} Gauge
 * @property {"gauge"} kind
 * @property {"jug" | "scale"} tool
 * @property {"mL" | "g" | "kg"} unit
 * @property {number} max
 * @property {number} step
 * @property {number} labelEvery
 * @property {number} value
 */

/**
 * A box plot over a number line marked every `step` (6.SP.4).
 * @typedef {object} BoxPlot
 * @property {"box_plot"} kind
 * @property {string} title
 * @property {number} from
 * @property {number} to
 * @property {number} step
 * @property {[number, number, number, number, number]} five  least, lower quartile, median, upper quartile, greatest
 */

/**
 * Two number lines, one above the other, their marks lined up in the same
 * ratio, with one number missing (6.RP.3a).
 * @typedef {object} DoubleLine
 * @property {"double_line"} kind
 * @property {{ label: string, values: (number | null)[] }} top
 * @property {{ label: string, values: (number | null)[] }} bottom
 */

/**
 * A shape made of smaller shapes, each part in its own color (K.G.6, 1.G.2).
 * @typedef {object} Compose
 * @property {"compose"} kind
 * @property {"triangles" | "squares" | "rectangles" | "four squares" | "half-circles" | "house" | "trapezoids" | "three triangles"} figure
 */

/**
 * Math written out large, a line at a time, for a teaching scene: each line
 * a list of tokens, such as ["3", "×", "(", "4", "+", "2", ")"], each one a
 * part to ring or tap, named t<line>-<index>.
 * @typedef {object} MathCard
 * @property {"math"} kind
 * @property {string[][]} lines
 */

/**
 * Something to show beside the prompt. It is data, not markup: the
 * renderers in src/visuals/ decide how a clock or a graph looks.
 * @typedef {{ kind: "objects", emoji: string, count: number, crossed?: number }
 *   | { kind: "pattern", items: (string | null)[] }
 *   | { kind: "money", items: string[] }
 *   | { kind: "clock", hours: number, minutes: number }
 *   | { kind: "shape", shape: string }
 *   | NumberLine | PictureGraph | BarGraph | LinePlot | FractionModel
 *   | AreaFigure | CubeBox | AngleFigure | CoordinateGrid | TenFrame | BaseTen | Lengths | Solid | Scene | Groups | FractionBars | Hundredths | Lines | Net | Composite | Gauge | BoxPlot | DoubleLine | Compose | MathCard} Visual
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
 * @property {[Answer, string][]} [slips]  the mistakes some wrong answers come from, each said
 *   to a child who picks it: "That adds the bottom numbers too." Only those for wrong answers
 *   that are among the choices are kept, and none may give the answer away.
 * @property {"line"} [input]  answered by tapping the number line in `visual`, not by a choice
 * @property {Answer[]} [ticks]  with input "line": what each tick of the line stands for, in order
 *   along it, which are the choices; `wrong` is then not used
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
 * @property {Record<string, string>} [slips]  for a wrong choice, by its text, the mistake it comes from
 * @property {"line"} [input]  answered by tapping a tick of the number line in `visual`; the
 *   choices are then what each tick stands for, in order along the line, from its first tick
 */

/**
 * @typedef {object} QuestionType
 * @property {string} id
 * @property {string} name
 * @property {(rng: Rng, grade: number, focus?: string) => Draft} generate
 * @property {Record<string, string>} [focuses]  narrower things a chapter of an
 *   adventure can ask for, by name, each with what it means: "easy" for
 *   multiplication is the facts with 2, 5 or 10. A type without them ignores
 *   a focus.
 * @property {"line"} [input]  its questions are answered on a number line, not by a choice
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
 * @param {string} [focus]  one of the type's focuses, to ask something narrower
 * @returns {Question}
 */
export function makeQuestion(rng, type, grade, focus) {
  const { wrong, slips = [], ticks, ...draft } = type.generate(rng, grade, focus);
  // On a number line, every tick is a choice, in order, and every wrong one can say how it's off.
  if (draft.input === "line" && ticks) {
    return { type: type.id, ...draft, choices: ticks, slips: Object.fromEntries(slips.map(([w, why]) => [String(w), why])) };
  }
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
  // The mistakes behind the wrong choices made, the first for each where two would say it.
  /** @type {Record<string, string>} */
  const said = {};
  for (const [w, why] of slips) {
    if (kept.some(k => String(k) === String(w)) && !(String(w) in said)) said[String(w)] = why;
  }
  return { type: type.id, ...draft, choices: rng.shuffle([draft.answer, ...kept]), ...(Object.keys(said).length > 0 ? { slips: said } : {}) };
}

/**
 * Whether a choice answers the question.
 * @param {Question} question
 * @param {Answer} choice
 */
export function isCorrect(question, choice) {
  return choice === question.answer;
}
