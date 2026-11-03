// Place value and rounding: what a digit is worth, numbers in expanded form,
// each place ten times the next, and rounding whole numbers and decimals.

import { atGrade, wrongNumbers, formatNumber as fmt } from "./common.js";
import { formatDecimal, thousandths } from "./decimals.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

const PLACE_NAMES = new Map([[10, "ten"], [100, "hundred"], [1000, "thousand"], [10000, "ten thousand"], [100000, "hundred thousand"]]);
const DECIMAL_PLACES = ["whole number", "tenth", "hundredth"];

/** @type {QuestionType} */
export const rounding = {
  id: "rounding",
  name: "Rounding",
  generate(rng, grade) {
    return grade >= 5 ? roundDecimal(rng) : roundWhole(rng, grade);
  },
};

/**
 * Rounding to the nearest 10 or 100 (3.NBT.1), or any place to a hundred
 * thousand (4.NBT.3). In third grade a number line shows the two choices.
 * @param {Rng} rng
 * @param {number} grade
 * @returns {Draft}
 */
function roundWhole(rng, grade) {
  const place = rng.pick(grade < 4 ? [10, 100] : [10, 100, 1000, 10000, 100000]);
  const top = grade < 4 ? 999 : 999999;
  let n = rng.int(place + 1, top);
  if (n % place === 0) n += rng.int(1, place - 1);
  const down = Math.floor(n / place) * place;
  const up = down + place;
  const answer = n - down >= place / 2 ? up : down;
  const other = answer === up ? down : up;
  const name = /** @type {string} */ (PLACE_NAMES.get(place));
  const roundedTo = (/** @type {number} */ p) => Math.round(n / p) * p;
  return {
    prompt: `Round ${fmt(n)} to the nearest ${name}.`,
    // The line runs half a step beyond the two choices, so its ends give nothing away.
    ...(grade < 4 ? {
      visual: { kind: /** @type {const} */ ("number_line"), den: 1, from: down - place / 2, to: up + place / 2, tick: place / 10, label: place / 2, points: [n], jumps: [] },
    } : {}),
    answer,
    // Rounding the wrong way, to the wrong place, or a whole step or two off:
    // all rounded numbers, so none can be ruled out without rounding.
    wrong: wrongNumbers(rng, answer, [
      other, roundedTo(place * 10), ...(place > 10 ? [roundedTo(place / 10)] : []),
      answer + place, answer - place, answer + 2 * place, answer - 2 * place, answer + 3 * place, answer - 3 * place,
    ], { step: place, min: 1 }),
    hint: grade < 4 ? `Is ${fmt(n)} closer to ${fmt(down)} or to ${fmt(up)}?`
      : `Look at the digit just right of the ${name}s place, the ${Math.floor(n / (place / 10)) % 10}: 5 or more rounds up.`,
    slips: [
      [other, `That rounds the wrong way. ${grade < 4 ? "Which one is it closer to?" : "Look at the digit just right of the place you round to."}`],
      ...(PLACE_NAMES.has(place * 10) ? [/** @type {[number, string]} */ ([roundedTo(place * 10), `That rounds to the nearest ${PLACE_NAMES.get(place * 10)}, not the nearest ${name}.`])] : []),
      ...(place > 10 ? [/** @type {[number, string]} */ ([roundedTo(place / 10), `That rounds to the nearest ${PLACE_NAMES.get(place / 10)}, not the nearest ${name}.`])] : []),
    ],
    difficulty: 1 + Number(n - down === place / 2) + Number(place >= 1000),
  };
}

/**
 * Rounding a decimal to the nearest whole number, tenth or hundredth (5.NBT.4).
 * @param {Rng} rng
 * @returns {Draft}
 */
function roundDecimal(rng) {
  const places = rng.int(2, 3);
  const to = rng.int(0, places - 1);
  let units = rng.int(10 ** places + 1, 50 * 10 ** places);
  const step = 10 ** (places - to);
  if (units % step === 0) units += 1;
  const down = Math.floor(units / step);
  const rounded = units - down * step >= step / 2 ? down + 1 : down;
  const answer = formatDecimal(rounded, to);
  /** @param {number} p  the place to round to */
  const roundedTo = p => formatDecimal(Math.round(units / 10 ** (places - p)), p);
  const candidates = [formatDecimal(rounded === down ? down + 1 : down, to), formatDecimal(down, to)];
  if (to + 1 < places) candidates.push(roundedTo(to + 1));
  if (to > 0) candidates.push(roundedTo(to - 1));
  candidates.push(formatDecimal(rounded + 1, to), formatDecimal(rounded - 1, to), formatDecimal(rounded + 2, to), formatDecimal(rounded - 2, to));
  // Not rounding at all, and one more step away, for when the others run short.
  candidates.push(formatDecimal(units, places), formatDecimal(rounded + 3, to));
  /** @type {string[]} */
  const wrong = [];
  for (const c of rng.shuffle(candidates)) {
    if (thousandths(c) !== thousandths(answer) && thousandths(c) > 0 && !wrong.includes(c)) wrong.push(c);
  }
  return {
    prompt: `Round ${formatDecimal(units, places)} to the nearest ${DECIMAL_PLACES[to]}.`,
    answer,
    wrong,
    hint: `Look at the digit just right of the ${to === 0 ? "ones" : `${DECIMAL_PLACES[to]}s`} place, the ${Math.floor(units / 10 ** (places - to - 1)) % 10}: 5 or more rounds up.`,
    difficulty: 2 + Number(to > 0),
  };
}

/** @typedef {"digit" | "expanded" | "tenTimes" | "decimalDigit" | "tenth"} Kind */

/**
 * What a grade asks about place value: what a digit is worth, expanded form,
 * and each place worth ten of the next (4.NBT.1-2); then the same with
 * decimals (5.NBT.1, 5.NBT.3a).
 * @type {readonly [number, Kind[]][]}
 */
const PLANS = [
  [4.5, ["digit", "expanded", "tenTimes"]],
  [Infinity, ["digit", "decimalDigit", "tenth", "tenTimes"]],
];

/** @type {QuestionType} */
export const placeValue = {
  id: "place_value",
  name: "Place value",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, PLANS))) {
      case "digit": return digitValue(rng);
      case "expanded": return expanded(rng);
      case "tenTimes": return tenTimes(rng);
      case "decimalDigit": return decimalDigit(rng);
      case "tenth": return tenth(rng);
    }
  },
};

/**
 * A number whose digits are all different, so "the 7" means one place.
 * @param {Rng} rng
 * @param {number} length
 */
function distinctDigits(rng, length) {
  const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, length);
  return Number(digits.join(""));
}

/**
 * What the 7 in 47,382 is worth (4.NBT.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function digitValue(rng) {
  const n = distinctDigits(rng, rng.int(5, 6));
  const text = String(n);
  const i = rng.int(0, text.length - 2);
  const digit = Number(text[i]);
  const power = text.length - 1 - i;
  const answer = digit * 10 ** power;
  return {
    prompt: `What is the value of the ${digit} in ${fmt(n)}?`,
    answer,
    // The digit itself, the value of its place, or the right digit in the
    // wrong place; near misses are whole numbers of that place, never 59 for 60.
    wrong: wrongNumbers(rng, answer, [digit, 10 ** power, digit * 10 ** (power - 1), digit * 10 ** (power + 1), digit * 10 ** (power + 2), digit * 10 ** (power - 2)].filter(Number.isInteger), { min: 1, step: 10 ** power }),
    hint: "Name the place the digit is in: ones, tens, hundreds, thousands…",
    difficulty: 1 + Number(power >= 3) + Number(power >= 5),
  };
}

/**
 * A number in expanded form, back to digits (4.NBT.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function expanded(rng) {
  const length = rng.int(4, 5);
  const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, length);
  // A zero in a middle place, so the place holder matters.
  digits[rng.int(1, length - 2)] = 0;
  const n = Number(digits.join(""));
  const parts = digits.map((d, i) => d * 10 ** (length - 1 - i)).filter(v => v > 0);
  const squeezed = Number(digits.filter(d => d > 0).join(""));
  return {
    prompt: `Which number is ${parts.map(fmt).join(" + ")}?`,
    answer: n,
    // Leaving out the zero, or digits out of place.
    wrong: wrongNumbers(rng, n, [squeezed, n * 10, Math.floor(n / 10), n + 10 ** (length - 2)], { min: 1 }),
    hint: "Write each part in its place. A place with nothing in it still needs a 0.",
    difficulty: 2,
  };
}

/**
 * How many times one digit is worth another of the same kind (4.NBT.1, 5.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function tenTimes(rng) {
  const digit = rng.int(1, 9);
  const gap = rng.int(1, 2);
  const length = rng.int(gap + 2, 5);
  // The digit twice, gap places apart, among other digits.
  const others = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => d !== digit));
  const digits = Array.from({ length }, (_, i) => others[i]);
  const first = rng.int(0, length - 1 - gap);
  digits[first] = digit;
  digits[first + gap] = digit;
  const n = Number(digits.join(""));
  const answer = 10 ** gap;
  return {
    prompt: `In ${fmt(n)}, the first ${digit} is worth how many times as much as the second ${digit}?`,
    answer,
    wrong: rng.shuffle([10 ** (3 - gap), 2, gap, digit, 1].filter(v => v !== answer)),
    hint: "Each place is worth ten times the place to its right.",
    difficulty: 2 + Number(gap > 1),
  };
}

/**
 * What a digit after the decimal point is worth (5.NBT.3a).
 * @param {Rng} rng
 * @returns {Draft}
 */
function decimalDigit(rng) {
  const units = distinctDigits(rng, 4);
  const shown = formatDecimal(units, 3);
  const text = String(units);
  const i = rng.int(1, 3);
  const digit = Number(text[i]);
  const answer = formatDecimal(digit * 10 ** (3 - i), 3);
  // The digit itself, or the digit a place or two to either side (as far as thousandths go).
  const shifted = [4 - i, 2 - i, 5 - i].filter(p => p >= 0).map(p => formatDecimal(digit * 10 ** p, 3));
  return {
    prompt: `What is the value of the ${digit} in ${shown}?`,
    answer,
    wrong: rng.shuffle([String(digit), ...shifted, String(digit * 10)].filter(t => t !== answer)),
    hint: "After the point come tenths, then hundredths, then thousandths.",
    difficulty: 2 + Number(i === 3),
  };
}

/**
 * A tenth, or ten times, of a decimal (5.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function tenth(rng) {
  const units = rng.int(11, 999);
  const places = rng.int(1, 2);
  const times = rng.chance(0.5);
  const answer = times ? formatDecimal(units, places - 1) : formatDecimal(units, places + 1);
  return {
    prompt: `What is ${times ? "10 times" : "one tenth of"} ${formatDecimal(units, places)}?`,
    answer,
    wrong: rng.shuffle([
      times ? formatDecimal(units, places + 1) : formatDecimal(units, places - 1),
      times ? formatDecimal(units, places - 2 < 0 ? 0 : places - 2) + (places - 2 < 0 ? "0" : "") : formatDecimal(units, places + 2),
      formatDecimal(units + 10 ** places, places),
    ].filter(t => thousandths(t) !== thousandths(answer))),
    hint: `${times ? "Ten times as much" : "A tenth as much"} moves each digit one place ${times ? "left" : "right"}.`,
    difficulty: 2,
  };
}
