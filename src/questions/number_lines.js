// Number lines: reading a point, following a jump (2.MD.6), fractions as
// points on a line (3.NF.2), and placing a number on one, by tapping it.

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
 * Counting on, or back, from a dot on a line from 0 to 20 (1.OA.5).
 * Counting the number you start on is the slip to catch.
 * @param {import("../rng.js").Rng} rng
 * @returns {import("./common.js").Draft}
 */
function countOnOrBack(rng) {
  const on = rng.chance(0.5);
  const steps = rng.int(2, 6);
  // Landing inside the line, with room for a near miss either side.
  const start = on ? rng.int(1, 17 - steps) : rng.int(steps + 1, 19);
  const answer = on ? start + steps : start - steps;
  return {
    prompt: `The dot is on ${start}. Count ${on ? "on" : "back"} ${steps}. Which number do you land on?`,
    visual: { kind: "number_line", den: 1, from: 0, to: 20, tick: 1, label: 5, points: [start], jumps: [] },
    answer,
    // Counting the start as one, going the wrong way, or one too far.
    wrong: wrongNumbers(rng, answer, [on ? answer - 1 : answer + 1, on ? start - steps : start + steps, on ? answer + 1 : answer - 1, steps].filter(v => v >= 0 && v !== answer && v <= 20)),
    hint: `Start on ${start}, and say the next number as you take each step ${on ? "forward" : "back"}.`,
    difficulty: 1 + Number(!on),
  };
}

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
    if (grade < 2) return countOnOrBack(rng);
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
        // Counting the steps, not their total, which is the answer when the jump starts at 0.
        hint: `The jump starts at ${start}. Each small step is ${tick}: count the steps it covers.`,
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
      hint: `The labels go up by ${label}, in ${label / tick} small steps. What is each step worth?`,
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

/**
 * A tick's number as it is read: 7, 3/4, 1, −3.
 * @param {number} units  in steps of 1/den
 * @param {number} den
 * @returns {string}
 */
function tickText(units, den) {
  if (units < 0) return `−${tickText(-units, den)}`;
  return den === 1 || units % den === 0 ? String(units / den) : `${units}/${den}`;
}

/**
 * Where a number goes on a line, tapped rather than chosen: whole numbers
 * from 0 to 20 in first grade and to 100 in second (2.MD.6), fractions from
 * third (3.NF.2), and negative numbers in sixth (6.NS.6). Placing numbers on
 * a line is among the best-supported ways to build a sense of how big
 * numbers are (Siegler and Ramani's number board games; Fazio, Kennedy and
 * Siegler's Catch the Monster for fractions). A wrong tap says which way to
 * go, as the bigger or smaller number it is.
 * @type {QuestionType}
 */
export const placing = {
  id: "placing",
  name: "Placing numbers on a line",
  input: "line",
  generate(rng, grade) {
    /** @type {{ den: number, from: number, to: number, tick: number, label: number }} */
    const line = grade >= 6 ? { den: 1, from: -10, to: 10, tick: 1, label: 5 }
      : grade >= 3 ? (() => {
        const den = rng.pick([2, 3, 4, 6, 8]);
        return { den, from: 0, to: den * (grade < 3.5 ? 1 : rng.pick([1, 2])), tick: 1, label: den };
      })()
      : grade >= 2.5 ? { den: 1, from: 0, to: 100, tick: 5, label: 25 }
      : grade >= 2 ? { den: 1, from: 0, to: 100, tick: 10, label: 50 }
      : { den: 1, from: 0, to: 20, tick: 1, label: 5 };
    const { den, from, to, tick, label } = line;
    const positions = stepsBetween(from, to, tick);
    // Never on a labelled tick, where it could be read off instead of worked out; in sixth grade, mostly below 0.
    const open = positions.filter(at => at % label !== 0);
    const target = rng.pick(from < 0 && rng.chance(0.7) ? open.filter(at => at < 0) : open);
    /** @param {number} at */
    const answerAt = at => (den === 1 ? at : tickText(at, den));
    const ticks = positions.map(answerAt);
    const shown = tickText(target, den);
    const negative = target < 0;
    return {
      prompt: `Tap where ${shown} goes on the number line.`,
      visual: { kind: "number_line", den, from, to, tick, label, points: [], jumps: [] },
      answer: answerAt(target),
      wrong: [],
      input: "line",
      ticks,
      hint: negative ? `Negative numbers are left of 0. ${shown} is ${-target} steps to the left of 0.`
        : den > 1 ? `From 0 to 1 is cut into ${den} equal parts. Count ${target} of them from 0.`
        : `Find the labelled numbers on either side of ${shown}, then count the small steps.`,
      slips: positions.filter(at => at !== target).map(at => [answerAt(at), at < target
        ? `That's ${tickText(at, den)}, which is less than ${shown}. ${shown} is further right.`
        : `That's ${tickText(at, den)}, which is more than ${shown}. ${shown} is further left.`]),
      difficulty: negative || den > 4 ? 3 : den > 1 || tick > 1 ? 2 : 1,
    };
  },
};
