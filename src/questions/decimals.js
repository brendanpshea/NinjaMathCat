// Decimals: tenths and hundredths as fractions and decimals (4.NF.5-7),
// comparing them, multiplying and dividing by powers of ten (5.NBT.2), and
// the four operations (5.NBT.7, 6.NS.3). Every decimal is held as a whole
// number of its smallest place, so 0.1 + 0.2 is exactly 0.3.

import { atGrade } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * A decimal from a whole number of tenths, hundredths or thousandths, written
 * the usual way: no extra zeros at the end, and a 0 before the point.
 * @param {number} units  how many of the smallest place
 * @param {number} places  1 for tenths, 2 for hundredths, 3 for thousandths
 */
export function formatDecimal(units, places) {
  const negative = units < 0;
  let digits = String(Math.abs(units)).padStart(places + 1, "0");
  let whole = places > 0 ? digits.slice(0, -places) : digits;
  let part = places > 0 ? digits.slice(-places) : "";
  part = part.replace(/0+$/, "");
  whole = whole.replace(/^0+(?=\d)/, "");
  digits = part ? `${whole}.${part}` : whole;
  return negative ? `−${digits}` : digits;
}

/**
 * The value of a decimal string, as a whole number of thousandths, so values
 * can be compared exactly.
 * @param {string} text
 */
export function thousandths(text) {
  const [whole, part = ""] = text.replace("−", "-").split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  return sign * (Math.abs(Number(whole)) * 1000 + Number(part.padEnd(3, "0").slice(0, 3)));
}

/**
 * Wrong decimal answers: the candidates, with repeats, negatives and any
 * worth the same as the answer left out. Every candidate is written by
 * formatDecimal, which writes each value exactly one way, so two are worth
 * the same just when they read the same.
 * @param {Rng} rng
 * @param {string} answer
 * @param {string[]} likely
 */
function wrongDecimals(rng, answer, likely) {
  /** @type {string[]} */
  const out = [];
  for (const text of rng.shuffle(likely)) {
    if (text !== answer && !text.startsWith("−") && text !== "0" && !out.includes(text)) out.push(text);
  }
  return out;
}

/** @typedef {"toDecimal" | "toFraction" | "compare" | "tenthsHundredths" | "powers" | "add" | "subtract" | "multiply" | "divide"} Kind */

/**
 * What a grade does with decimals: tenths and hundredths as fractions and
 * decimals, and comparing them (4.NF.5-7); comparing to thousandths, powers
 * of ten and the four operations (5.NBT.2-3, 5.NBT.7); then the operations
 * with bigger numbers (6.NS.3).
 * @type {readonly [number, Kind[]][]}
 */
const PLANS = [
  [4.5, ["toDecimal", "toFraction", "compare", "tenthsHundredths"]],
  [5.5, ["compare", "powers", "add", "subtract", "multiply", "divide"]],
  [Infinity, ["add", "subtract", "multiply", "divide"]],
];

/** @type {QuestionType} */
export const decimals = {
  id: "decimals",
  name: "Decimals",
  generate(rng, grade) {
    const kind = rng.pick(atGrade(grade, PLANS));
    const big = grade >= 6;
    switch (kind) {
      case "toDecimal": return toDecimal(rng);
      case "toFraction": return toFraction(rng);
      case "compare": return compare(rng, grade >= 5 ? 3 : 2);
      case "tenthsHundredths": return tenthsHundredths(rng);
      case "powers": return powers(rng);
      case "add": return addOrSubtract(rng, big, true);
      case "subtract": return addOrSubtract(rng, big, false);
      case "multiply": return multiply(rng, big);
      case "divide": return divide(rng, big);
    }
  },
};

/**
 * 7/10 or 37/100 as a decimal (4.NF.6).
 * @param {Rng} rng
 * @returns {Draft}
 */
function toDecimal(rng) {
  const den = rng.pick([10, 100]);
  const places = den === 10 ? 1 : 2;
  const n = den === 10 ? rng.int(1, 9) : rng.int(3, 99);
  const answer = formatDecimal(n, places);
  return {
    prompt: `What is ${n}/${den} as a decimal?`,
    answer,
    // One place too far or too short, or writing the fraction's numbers with a point between.
    wrong: wrongDecimals(rng, answer, [formatDecimal(n, places + 1), formatDecimal(n, places - 1), formatDecimal(10 * n + 1, 1), formatDecimal(n + den, places)]),
    hint: den === 10 ? "Tenths go in the first place after the point." : "Hundredths fill the first two places after the point.",
    difficulty: 1 + Number(den === 100) + Number(n < 10 && den === 100),
  };
}

/**
 * 0.45 as a fraction (4.NF.6).
 * @param {Rng} rng
 * @returns {Draft}
 */
function toFraction(rng) {
  const den = rng.pick([10, 100]);
  const n = den === 10 ? rng.int(1, 9) : rng.int(11, 99);
  const shown = formatDecimal(n, den === 10 ? 1 : 2);
  // A decimal that ends in 0 hundredths reads as tenths, so keep hundredths that don't.
  const top = den === 100 && n % 10 === 0 ? n + 1 : n;
  const decimal = den === 100 ? formatDecimal(top, 2) : shown;
  return {
    prompt: `Which fraction is the same as ${decimal}?`,
    answer: `${top}/${den}`,
    wrong: rng.shuffle([`${top}/${den === 10 ? 100 : 10}`, `${top}/${den * 10}`, `1/${top}`, `${top + 1}/${den}`]),
    hint: "Say the decimal out loud: tenths or hundredths?",
    difficulty: 1 + Number(den === 100),
  };
}

/**
 * The greatest or least of four decimals with different numbers of places,
 * so that "longer is bigger" leads astray (4.NF.7, 5.NBT.3b).
 * @param {Rng} rng
 * @param {number} places
 * @returns {Draft}
 */
function compare(rng, places) {
  const scale = 10 ** places;
  /** @type {Set<number>} */
  const values = new Set();
  // One with a single place that is bigger than its longer neighbours.
  const tenths = rng.int(2, 9);
  values.add(tenths * (scale / 10));
  values.add((tenths - 1) * (scale / 10) + rng.int(1, scale / 10 - 1));
  while (values.size < 4) values.add(rng.int(1, scale - 1));
  const list = rng.shuffle([...values]);
  const greatest = rng.chance(0.5);
  const pick = greatest ? Math.max(...list) : Math.min(...list);
  const written = (/** @type {number} */ v) => formatDecimal(v, places);
  return {
    prompt: `Which number is the ${greatest ? "greatest" : "least"}?`,
    answer: written(pick),
    wrong: list.filter(v => v !== pick).map(written),
    hint: "Compare the tenths first, then the hundredths. More digits doesn't mean bigger.",
    difficulty: 1 + Number(places > 2) + Number(!greatest),
  };
}

/**
 * Tenths and hundredths added as fractions (4.NF.5): 3/10 + 45/100.
 * @param {Rng} rng
 * @returns {Draft}
 */
function tenthsHundredths(rng) {
  const t = rng.int(1, 9);
  const h = rng.int(1, 99 - 10 * t);
  const total = 10 * t + h;
  return {
    prompt: `What is ${t}/10 + ${h}/100?`,
    answer: `${total}/100`,
    // Adding the tops and bottoms, or adding the tops without making tenths into hundredths.
    wrong: rng.shuffle([`${t + h}/110`, `${t + h}/100`, `${total}/10`, `${t + h}/10`]),
    hint: `First write ${t}/10 as hundredths.`,
    difficulty: 2,
  };
}

/**
 * Multiplying or dividing by 10, 100 or 1000 (5.NBT.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function powers(rng) {
  const k = rng.int(1, 3);
  const units = rng.int(11, 999);
  const times = rng.chance(0.5);
  // Answers stay within thousandths (5.NBT.2).
  const places = times ? rng.int(0, 2) : rng.int(0, 3 - k);
  const shown = formatDecimal(units, places);
  /** @param {number} power  10 to the power moved, + for multiplying */
  const moved = power => (power >= 0 ? formatDecimal(units * 10 ** power, places) : formatDecimal(units, places - power));
  const answer = moved(times ? k : -k);
  return {
    prompt: `What is ${shown} ${times ? "×" : "÷"} ${10 ** k}?`,
    answer,
    // The point moved the wrong way, or one place too few or too many.
    wrong: wrongDecimals(rng, answer, [moved(times ? -k : k), moved(times ? k - 1 : -k + 1), moved(times ? k + 1 : -k - 1)]),
    hint: `${times ? "Multiplying" : "Dividing"} by ${10 ** k} moves every digit ${k} ${k === 1 ? "place" : "places"} ${times ? "to the left" : "to the right"}.`,
    difficulty: 1 + Number(!times) + Number(k > 1),
  };
}

/**
 * Adding or subtracting decimals with different numbers of places (5.NBT.7).
 * @param {Rng} rng
 * @param {boolean} big
 * @param {boolean} adding
 * @returns {Draft}
 */
function addOrSubtract(rng, big, adding) {
  const [pa, pb] = rng.shuffle([1, 2]);
  let a = rng.int(big ? 1000 : 11, big ? 9999 : 999) * 10 ** (2 - pa);
  let b = rng.int(big ? 100 : 11, big ? 999 : 99) * 10 ** (2 - pb);
  if (!adding && b > a) [a, b] = [b, a];
  const answerUnits = adding ? a + b : a - b;
  const answer = formatDecimal(answerUnits, 2);
  const [x, y] = [formatDecimal(a, 2), formatDecimal(b, 2)];
  // Lining the numbers up on the right instead of at the point.
  const [ra, rb] = [rightAligned(x), rightAligned(y)];
  const misaligned = adding ? ra + rb : Math.abs(ra - rb);
  return {
    prompt: `What is ${x} ${adding ? "+" : "−"} ${y}?`,
    answer,
    wrong: wrongDecimals(rng, answer, [
      formatDecimal(misaligned, 2), formatDecimal(answerUnits + 10, 2), formatDecimal(answerUnits - 10, 2), formatDecimal(answerUnits + 100, 2), formatDecimal(answerUnits - 1, 2),
    ]),
    hint: "Line up the decimal points first. Write in zeros to fill the empty places if it helps.",
    difficulty: 2 + Number(big),
  };
}

/**
 * The value, in hundredths, a decimal would have if its last digit sat in the
 * hundredths place: what lining numbers up on the right does (4.5 → 0.45).
 * @param {string} text
 */
function rightAligned(text) {
  return Number(text.replace(".", ""));
}

/**
 * Multiplying a decimal by a whole number or by another decimal (5.NBT.7).
 * @param {Rng} rng
 * @param {boolean} big
 * @returns {Draft}
 */
function multiply(rng, big) {
  const byDecimal = big || rng.chance(0.4);
  const a = byDecimal ? rng.int(big ? 12 : 2, big ? 99 : 9) : rng.int(11, 999);
  const pa = byDecimal ? 1 : rng.int(1, 2);
  const b = big ? rng.int(12, 49) : rng.int(2, 9);
  const pb = byDecimal ? 1 : 0;
  const product = a * b;
  const places = pa + pb;
  const answer = formatDecimal(product, places);
  return {
    prompt: `What is ${formatDecimal(a, pa)} × ${formatDecimal(b, pb)}?`,
    answer,
    // The point in the wrong place.
    wrong: wrongDecimals(rng, answer, [formatDecimal(product, places - 1), formatDecimal(product, places + 1), formatDecimal(product, 0), formatDecimal(product + b, places)]),
    hint: `Multiply as if there were no points, then count ${places} ${places === 1 ? "place" : "places"} back from the right.`,
    difficulty: 2 + Number(byDecimal),
  };
}

/**
 * Dividing a decimal by a whole number, or (from sixth grade) by a decimal
 * (5.NBT.7, 6.NS.3). The quotient is chosen first, so it comes out exactly.
 * @param {Rng} rng
 * @param {boolean} big
 * @returns {Draft}
 */
function divide(rng, big) {
  const quotient = rng.int(11, big ? 99 : 49);
  const qPlaces = big ? rng.int(0, 1) : 1;
  const divisor = rng.int(2, 9);
  const dPlaces = big ? 1 : 0;
  // dividend = quotient × divisor, with their places added.
  const answer = formatDecimal(quotient, qPlaces);
  const dividend = formatDecimal(quotient * divisor, qPlaces + dPlaces);
  return {
    prompt: `What is ${dividend} ÷ ${formatDecimal(divisor, dPlaces)}?`,
    answer,
    wrong: wrongDecimals(rng, answer, [formatDecimal(quotient, qPlaces + 1), formatDecimal(quotient, qPlaces - 1 < 0 ? 2 : qPlaces - 1), formatDecimal(quotient + 1, qPlaces), formatDecimal(quotient * 10, qPlaces)]),
    hint: dPlaces > 0 ? "Multiply both numbers by 10 so you are dividing by a whole number." : "Divide as usual, and put the point in the answer right above the point in the number.",
    difficulty: 2 + Number(dPlaces > 0),
  };
}
