// Number lines: reading a point, following a jump (2.MD.6), and fractions as
// points on a line (3.NF.2).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/**
 * The whole-number lines a grade reads: ticks every `tick`, labels every
 * `label`, `span` from one end to the other. The point is always on an
 * unlabelled tick, so it has to be worked out from the labelled ones.
 * @type {readonly [number, { tick: number, label: number, span: number, upTo: number }[]][]}
 */
const LINES = [
  [2, [{ tick: 1, label: 5, span: 20, upTo: 100 }, { tick: 2, label: 10, span: 40, upTo: 100 }, { tick: 5, label: 25, span: 100, upTo: 100 }]],
  [2.5, [{ tick: 2, label: 10, span: 40, upTo: 1000 }, { tick: 5, label: 25, span: 100, upTo: 1000 }, { tick: 10, label: 50, span: 200, upTo: 1000 }]],
  [Infinity, [{ tick: 5, label: 25, span: 100, upTo: 1000 }, { tick: 10, label: 50, span: 200, upTo: 1000 }, { tick: 25, label: 100, span: 500, upTo: 1000 }]],
];

/**
 * @param {number} from
 * @param {number} to
 * @param {number} step
 */
function stepsBetween(from, to, step) {
  return Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
}

/** @type {QuestionType} */
export const numberLine = {
  id: "number_line",
  name: "Number lines",
  generate(rng, grade) {
    const { tick, label, span, upTo } = rng.pick(atGrade(grade, LINES));
    const from = label * rng.int(0, Math.floor((upTo - span) / label));
    const to = from + span;
    const unlabelled = stepsBetween(from, to, tick).filter(n => n % label !== 0);
    const line = { kind: /** @type {const} */ ("number_line"), den: 1, from, to, tick, label };

    if (rng.chance(0.4)) {
      // A jump from a labelled tick to an unlabelled one, at least two ticks long.
      const jumps = stepsBetween(from, to - label, label).flatMap(start =>
        unlabelled.filter(end => end - start >= 2 * tick).map(end => [start, end]));
      const [start, end] = rng.pick(jumps);
      const length = end - start;
      return {
        prompt: "Where does the jump land?",
        visual: { ...line, points: [], jumps: [[start, end]] },
        answer: end,
        // A tick too far or too short, the jump alone, or not moving at all.
        wrong: wrongNumbers(rng, end, [end + tick, end - tick, length, start, end + label], { spread: tick }),
        hint: `Start at ${start} and count on ${length}.`,
        difficulty: Math.min(3, 2 + Number(tick > 1)),
      };
    }

    const point = rng.pick(unlabelled);
    const nearestLabel = Math.round(point / label) * label;
    return {
      prompt: "What number is the dot on?",
      visual: { ...line, points: [point], jumps: [] },
      answer: point,
      // Miscounting the ticks, or rounding to the nearest label.
      wrong: wrongNumbers(rng, point, [point + tick, point - tick, point + 2 * tick, point - 2 * tick, nearestLabel], { spread: tick }),
      hint: `The labels go up by ${label}. Each small step is ${tick}.`,
      difficulty: 1 + Number(tick > 1) + Number(span >= 200),
    };
  },
};

/** The denominators third grade uses (3.NF). */
const DENOMINATORS = [2, 3, 4, 6, 8];

/** @type {QuestionType} */
export const fractionLine = {
  id: "fraction_line",
  name: "Fractions on a number line",
  generate(rng) {
    const den = rng.pick(DENOMINATORS);
    const wholes = rng.pick([1, 2]);
    const to = den * wholes;
    const k = rng.pick(stepsBetween(1, to - 1, 1).filter(n => n % den !== 0));
    /** @param {number} top @param {number} bottom */
    const fraction = (top, bottom) => `${top}/${bottom}`;
    return {
      prompt: "What fraction is the dot on?",
      visual: { kind: "number_line", den, from: 0, to, tick: 1, label: den, points: [k], jumps: [] },
      answer: fraction(k, den),
      // Counting tick marks instead of the spaces between them, a step out,
      // or the fraction upside down.
      wrong: rng.shuffle([
        fraction(k, den + 1),
        fraction(k + 1, den),
        ...(k > 1 ? [fraction(k - 1, den)] : []),
        fraction(den, k),
        fraction(k, 2 * den),
      ]),
      hint: "Count the equal spaces from 0 to 1. That is the bottom number.",
      difficulty: 2 + Number(wholes > 1),
    };
  },
};
