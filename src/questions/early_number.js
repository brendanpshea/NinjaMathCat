// Early number: tens and ones, from teen numbers to hundreds (K.NBT.1,
// 1.NBT.2, 1.NBT.4-6, 2.NBT.1, 2.NBT.3, 2.NBT.8); number pairs and making 10
// (K.OA.3-4); the equal sign and the order of adding (1.OA.3, 1.OA.7); and odd
// and even numbers (2.OA.3).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { Draft, QuestionType, Answer } from "./common.js" */
/** @import { Rng } from "../rng.js" */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * A number from 0 to 999 in words, as children learn to write it: "two hundred fifteen".
 * @param {number} n
 */
export function numberWords(n) {
  const [h, rest] = [Math.floor(n / 100), n % 100];
  const below = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`;
  if (h === 0) return below;
  return rest === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred ${below}`;
}

/**
 * A number in expanded form, leaving out places that are zero: 400 + 6.
 * @param {number} n
 */
export function expandedForm(n) {
  const digits = String(n).split("").map(Number);
  return digits.map((d, i) => d * 10 ** (digits.length - 1 - i)).filter(v => v > 0).join(" + ");
}

/**
 * The questions for a point in the year: teen numbers as ten and some more in
 * kindergarten; tens and ones in first grade, then ten more and ten less and
 * adding tens; hundreds, tens and ones in second, with expanded form, words,
 * and ten or a hundred more and less.
 * @type {readonly [number, string[]][]}
 */
const PLACES = [
  [0.5, ["teenBlocks", "teenFrames", "tenAnd", "teenSplit"]],
  [1, ["blocks", "tensOnes", "howManyTens"]],
  [1.5, ["blocks", "tenMore", "tenMore", "tensTakeAway", "addToTwoDigit"]],
  [2, ["blocks", "placeNames", "digitValue", "expanded", "words"]],
  [Infinity, ["blocks", "expanded", "words", "hundredMore", "hundredMore"]],
];

/** @type {QuestionType} */
export const tensAndOnes = {
  id: "tens_and_ones",
  name: "Tens and ones",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, PLACES))) {
      case "teenBlocks": return teenBlocks(rng);
      case "teenFrames": return teenFrames(rng);
      case "tenAnd": return tenAnd(rng);
      case "teenSplit": return teenSplit(rng);
      case "blocks": return blocks(rng, grade >= 2);
      case "tensOnes": return tensOnes(rng);
      case "howManyTens": return howManyTens(rng);
      case "tenMore": return moreOrLess(rng, 10, 11, 89);
      case "tensTakeAway": return tensTakeAway(rng);
      case "addToTwoDigit": return addToTwoDigit(rng);
      case "placeNames": return placeNames(rng);
      case "digitValue": return digitValue(rng);
      case "expanded": return expanded(rng);
      case "words": return words(rng);
      default: return moreOrLess(rng, rng.pick([10, 100]), 110, 889);
    }
  },
};

/**
 * A teen number in blocks: a ten and some ones (K.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function teenBlocks(rng) {
  const n = rng.int(11, 19);
  return {
    prompt: "What number do the blocks show?",
    visual: { kind: "base_ten", hundreds: 0, tens: 1, ones: n - 10 },
    answer: n,
    // Just the ones, the ten, or the digits turned round.
    wrong: wrongNumbers(rng, n, [n - 10, 10, (n - 10) * 10 + 1, n + 1, n - 1], { min: 1 }),
    hint: "The long block is 10. Count on from 10 with the little ones.",
    difficulty: 1,
  };
}

/**
 * A teen number in two ten frames: one full, and some more (K.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function teenFrames(rng) {
  const n = rng.int(11, 19);
  return {
    prompt: "How many counters are there?",
    visual: { kind: "ten_frame", filled: n, frames: 2 },
    answer: n,
    wrong: wrongNumbers(rng, n, [n - 10, 10, n + 1, n - 1], { min: 1 }),
    hint: "The first frame is full: that's 10. Count on with the second.",
    difficulty: 1,
  };
}

/**
 * Ten and some more (K.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function tenAnd(rng) {
  const ones = rng.int(1, 9);
  return {
    prompt: `What number is 10 and ${ones} more?`,
    answer: 10 + ones,
    // Writing 10 and then the ones, or a ten too many.
    wrong: wrongNumbers(rng, 10 + ones, [100 + ones, ones, ones * 10, 20 + ones, 10 + ones + 1, 10 + ones - 1], { min: 1 }),
    hint: `Start at 10 and count on ${ones}.`,
    difficulty: 1,
  };
}

/**
 * A teen number split into ten and the rest (K.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function teenSplit(rng) {
  const n = rng.int(11, 19);
  return {
    prompt: `${n} is 10 and how many more?`,
    answer: n - 10,
    wrong: wrongNumbers(rng, n - 10, [n, 10, n - 10 + 1, n - 10 - 1], { min: 1 }),
    hint: `Count on from 10 to ${n}.`,
    difficulty: 1,
  };
}

/**
 * A number in blocks: tens and ones, or hundreds, tens and ones (1.NBT.2, 2.NBT.1).
 * @param {Rng} rng
 * @param {boolean} hundreds
 * @returns {Draft}
 */
function blocks(rng, hundreds) {
  const [h, t, o] = [hundreds ? rng.int(1, 9) : 0, rng.int(hundreds ? 0 : 1, 9), rng.int(0, 9)];
  const n = 100 * h + 10 * t + o;
  const likely = hundreds
    // A place left out, or two places swapped.
    ? [100 * h + o, 100 * h + 10 * o + t, 10 * h + t + o, n + 10, n - 10, n + 100]
    // The digits turned round, the blocks counted as ones, or a ten out.
    : [10 * o + t, t + o, n + 10, n - 10, n + 1];
  return {
    prompt: "What number do the blocks show?",
    visual: { kind: "base_ten", hundreds: h, tens: t, ones: o },
    answer: n,
    wrong: wrongNumbers(rng, n, likely.filter(v => v !== n), { min: 1 }),
    hint: hundreds ? "Each big square is a hundred, each long block a ten, and each little cube a one." : "Each long block is a ten, and each little cube is a one. Count the tens first.",
    slips: hundreds
      ? [[100 * h + o, "That leaves out the long blocks, the tens."], [100 * h + 10 * o + t, "That swaps the tens and the ones."]]
      : [[10 * o + t, "That swaps the tens and the ones."], [t + o, "That counts each long block as 1, but a long block is a ten."]],
    difficulty: 1 + Number(o === 0 || t === 0) + Number(hundreds),
  };
}

/**
 * A two-digit number from its tens and ones (1.NBT.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function tensOnes(rng) {
  const [t, o] = [rng.int(1, 9), rng.int(0, 9)];
  const n = 10 * t + o;
  return {
    prompt: `What number has ${t} ${t === 1 ? "ten" : "tens"} and ${o} ${o === 1 ? "one" : "ones"}?`,
    answer: n,
    // Turned round, added up, or written as the two numbers side by side.
    wrong: wrongNumbers(rng, n, [10 * o + t, t + o, 100 * t + o, n + 10, n - 10, n + 1].filter(v => v !== n), { min: 1 }),
    hint: o === 0 ? "Count by tens, once for each ten. There are no ones to add." : `${t} ${t === 1 ? "ten is" : "tens are"} ${10 * t}. Then add the ones.`,
    slips: [
      [10 * o + t, "That swaps the tens and the ones."],
      [t + o, "That counts the tens as ones. Each ten is worth 10."],
      [100 * t + o, "That writes the tens and the ones side by side. The tens go in the tens place."],
    ],
    difficulty: 1 + Number(o === 0),
  };
}

/**
 * How many tens, or ones, a two-digit number has (1.NBT.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function howManyTens(rng) {
  const [t, o] = [rng.int(1, 9), rng.int(1, 9)];
  const n = 10 * t + o;
  const tens = rng.chance(0.6);
  const answer = tens ? t : o;
  return {
    prompt: `How many ${tens ? "tens" : "ones"} are in ${n}?`,
    answer,
    // The other digit, or the tens as their value.
    wrong: wrongNumbers(rng, answer, [tens ? o : t, tens ? 10 * t : n, answer + 1, answer - 1].filter(v => v !== answer), { min: 0 }),
    // Where to look, not what is there.
    hint: tens ? `In ${n}, the tens come first, on the left.` : `In ${n}, the ones come last, on the right.`,
    slips: tens
      ? [[o, "That's the ones. The question asks about the tens."], [10 * t, "That's what the tens are worth. The question asks how many tens there are."]]
      : [[t, "That's the tens. The question asks about the ones."], [n, "That's the whole number."]],
    difficulty: 1,
  };
}

/**
 * Ten (or a hundred) more or less than a number, in your head (1.NBT.5, 2.NBT.8).
 * @param {Rng} rng
 * @param {number} step
 * @param {number} low
 * @param {number} high
 * @returns {Draft}
 */
function moreOrLess(rng, step, low, high) {
  const n = rng.int(low, high);
  const more = rng.chance(0.5);
  const answer = more ? n + step : n - step;
  const other = step === 10 ? 100 : 10;
  return {
    prompt: `What is ${step} ${more ? "more" : "less"} than ${n}?`,
    answer,
    // A one instead of a ten, the wrong way, or the other place.
    wrong: wrongNumbers(rng, answer, [more ? n + 1 : n - 1, more ? n - step : n + step, more ? n + other : n - other].filter(v => v > 0), { min: 1 }),
    hint: `${step} ${more ? "more" : "less"} is one ${step === 10 ? "ten" : "hundred"} ${more ? "more" : "fewer"}, so only the ${step === 10 ? "tens" : "hundreds"} change.`,
    difficulty: 1 + Number(step === 100),
  };
}

/**
 * Taking a multiple of 10 from a multiple of 10 (1.NBT.6).
 * @param {Rng} rng
 * @returns {Draft}
 */
function tensTakeAway(rng) {
  const a = 10 * rng.int(2, 9);
  const b = 10 * rng.int(1, a / 10 - 1);
  const answer = a - b;
  return {
    prompt: `What is ${a} − ${b}?`,
    answer,
    // Leaving off the zero, adding instead, or a ten out.
    wrong: wrongNumbers(rng, answer, [answer / 10, a + b, answer + 10, answer - 10].filter(v => v > 0 && v !== answer), { min: 1, spread: 10 }),
    hint: `Think in tens: ${a / 10} tens take away ${b / 10} ${b === 10 ? "ten" : "tens"}.`,
    difficulty: 1,
  };
}

/**
 * A two-digit number and some ones, or some tens (1.NBT.4).
 * @param {Rng} rng
 * @returns {Draft}
 */
function addToTwoDigit(rng) {
  const a = rng.int(12, 79);
  const tens = rng.chance(0.5);
  const b = tens ? 10 * rng.int(1, Math.floor((99 - a) / 10)) : rng.int(2, 9);
  const answer = a + b;
  const ones = a % 10;
  return {
    prompt: `What is ${a} + ${b}?`,
    answer,
    // Tens added to the ones, a ten not made, or one out.
    wrong: wrongNumbers(rng, answer, (tens ? [a + b / 10, answer + 10, answer - 10, answer + 1] : [ones + b >= 10 ? answer - 10 : answer + 10, answer + 1, answer - 1, a + 10 * b]).filter(v => v !== answer && v > 0), { min: 1 }),
    hint: tens ? `Add the tens: ${Math.floor(a / 10)} tens and ${b / 10} more ${b === 10 ? "ten" : "tens"}.`
      : ones + b >= 10 ? `The ones make a new ten: ${ones} + ${b} = ${ones + b}.` : `Add the ones: ${ones} + ${b}. The tens stay the same.`,
    difficulty: 1 + Number(!tens && ones + b >= 10),
  };
}

/**
 * A three-digit number from its hundreds, tens and ones, zeros included (2.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function placeNames(rng) {
  const [h, t, o] = [rng.int(1, 9), rng.chance(0.3) ? 0 : rng.int(1, 9), rng.int(0, 9)];
  const n = 100 * h + 10 * t + o;
  return {
    prompt: `What number has ${h} ${h === 1 ? "hundred" : "hundreds"}, ${t} ${t === 1 ? "ten" : "tens"} and ${o} ${o === 1 ? "one" : "ones"}?`,
    answer: n,
    // A zero left out, two places swapped, or a place out.
    wrong: wrongNumbers(rng, n, [10 * h + o, 100 * h + 10 * o + t, 100 * t + 10 * h + o, n + 10, n - 10, n + 100].filter(v => v !== n && v > 0), { min: 1 }),
    hint: t === 0 && o === 0 ? "Count by hundreds, once for each hundred. There are no tens or ones to add."
      : `${h} ${h === 1 ? "hundred is" : "hundreds are"} ${100 * h}. Then add the tens and the ones.`,
    difficulty: 1 + Number(t === 0 || o === 0),
  };
}

/**
 * What a digit of a three-digit number is worth (2.NBT.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function digitValue(rng) {
  const digits = [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)];
  while (new Set(digits).size < 3) digits[rng.int(1, 2)] = rng.int(1, 9);
  const place = rng.int(0, 1);
  const value = digits[place] * 10 ** (2 - place);
  const n = Number(digits.join(""));
  return {
    prompt: `In ${n}, what is the ${digits[place]} worth?`,
    answer: value,
    wrong: wrongNumbers(rng, value, [digits[place], digits[place] * 10 ** (2 - place === 2 ? 1 : 2), n, digits[place] * 1000].filter(v => v !== value), { min: 1 }),
    hint: `The ${digits[place]} is in the ${place === 0 ? "hundreds" : "tens"} place.`,
    difficulty: 1 + Number(place === 1),
  };
}

/**
 * A number from its expanded form, or the other way round (2.NBT.3).
 * @param {Rng} rng
 * @returns {Draft}
 */
function expanded(rng) {
  const [h, t, o] = [rng.int(1, 9), rng.chance(0.25) ? 0 : rng.int(1, 9), rng.int(1, 9)];
  const n = 100 * h + 10 * t + o;
  if (rng.chance(0.5)) {
    return {
      prompt: `What number is ${expandedForm(n)}?`,
      answer: n,
      wrong: wrongNumbers(rng, n, [100 * h + 10 * o + t, 1000 * h + 10 * t + o, h + t + o, n + 100].filter(v => v !== n && v > 0), { min: 1 }),
      hint: "Each part fills its own place: hundreds, tens and ones.",
      difficulty: 1 + Number(t === 0),
    };
  }
  /** @type {Answer[]} */
  const wrong = rng.shuffle([
    [h, t, o].filter(Boolean).join(" + "),
    [10 * h, 10 * t, o].filter(Boolean).join(" + "),
    [100 * h, t, o].filter(Boolean).join(" + "),
    [100 * h, 10 * t, 10 * o].filter(Boolean).join(" + "),
  ]).filter(w => w !== expandedForm(n));
  return {
    prompt: `Which is ${n} in expanded form?`,
    answer: expandedForm(n),
    wrong,
    hint: `The ${h} is worth ${100 * h}.`,
    difficulty: 2,
  };
}

/**
 * A number from its name in words, or the other way round (2.NBT.3).
 * @param {Rng} rng
 * @returns {Draft}
 */
function words(rng) {
  const [h, t, o] = [rng.int(1, 9), rng.int(0, 9), rng.int(0, 9)];
  const n = 100 * h + 10 * t + o;
  // A hundred and then the rest side by side, the tens and ones turned round, or a place dropped.
  const slips = [Number(`${h}00${10 * t + o}`), 100 * h + 10 * o + t, 100 * h + o, 100 * h + 10 * t, n + 10, n + 1, n - 10, n + 100, n - 100]
    .filter((v, i, all) => v !== n && v >= 100 && v < 10000 && all.indexOf(v) === i);
  if (rng.chance(0.6)) {
    return {
      prompt: `Which number is ${numberWords(n)}?`,
      answer: n,
      wrong: wrongNumbers(rng, n, slips, { min: 1 }),
      hint: "Say it in parts: the hundreds first, then the rest.",
      difficulty: 1 + Number(t === 0 || o === 0),
    };
  }
  return {
    prompt: `How do you say ${n} in words?`,
    answer: numberWords(n),
    wrong: rng.shuffle([...new Set(slips.filter(v => v < 1000).map(numberWords))]).filter(w => w !== numberWords(n)),
    hint: `${n} has ${h} hundreds, then ${10 * t + o}.`,
    difficulty: 2,
  };
}

/** @type {QuestionType} */
export const numberPairs = {
  id: "number_pairs",
  name: "Number pairs",
  generate(rng, grade) {
    switch (rng.pick(grade < 0.5 ? ["makeTen", "pair", "partner"] : ["makeTen", "pair", "partner", "partner"])) {
      case "makeTen": {
        const n = rng.int(1, 9);
        return {
          prompt: "How many more counters would fill the ten frame?",
          visual: { kind: "ten_frame", filled: n, frames: 1 },
          answer: 10 - n,
          // The counters there are, or one out.
          wrong: wrongNumbers(rng, 10 - n, [n, 10, 10 - n + 1, 10 - n - 1].filter(v => v !== 10 - n), { min: 1 }),
          hint: "Count the empty boxes.",
          difficulty: 1,
        };
      }
      case "pair": {
        const total = rng.int(4, 10);
        const a = rng.int(1, total - 1);
        const pairs = [];
        // Pairs that make a number close by, but not this one.
        for (const other of rng.shuffle([total - 2, total - 1, total + 1, total + 2]).filter(v => v >= 2)) {
          const x = rng.int(1, other - 1);
          pairs.push(`${x} and ${other - x}`);
        }
        return {
          prompt: `Which two numbers make ${total}?`,
          answer: `${a} and ${total - a}`,
          wrong: pairs,
          hint: `Count on from the first number. Do you reach ${total}?`,
          difficulty: 1 + Number(total > 6),
        };
      }
      default: {
        const total = rng.int(grade < 0.5 ? 4 : 6, 10);
        const part = rng.int(1, total - 1);
        return {
          prompt: `${total} is ${part} and how many more?`,
          visual: { kind: "ten_frame", filled: part, frames: 1 },
          answer: total - part,
          // The number already there, the whole, or one out.
          wrong: wrongNumbers(rng, total - part, [part, total, total - part + 1, total - part - 1].filter(v => v !== total - part), { min: 1 }),
          hint: `There are ${part} counters. Count on to ${total}.`,
          difficulty: 1 + Number(total > 7),
        };
      }
    }
  },
};

/**
 * Equations a grade can check: within 20 in first grade (1.OA.7), within 100 in second.
 * @type {readonly [number, number][]}
 */
const EQUAL_WITHIN = [[1.5, 9], [Infinity, 20]];

/** @type {QuestionType} */
export const equalSign = {
  id: "equal_sign",
  name: "The equal sign",
  generate(rng, grade) {
    const top = atGrade(grade, EQUAL_WITHIN);
    const [a, b] = [rng.int(2, top), rng.int(2, top)];
    const sum = a + b;
    switch (rng.pick(["true", "true", "balance", "order", "grouping"])) {
      case "true": {
        // True ways to write it, the equal sign anywhere; and false ones, each a slip.
        const truths = [`${a} + ${b} = ${sum}`, `${sum} = ${a} + ${b}`, `${a} + ${b} = ${b} + ${a}`, `${sum} − ${b} = ${a}`, `${a} + ${b} = ${a + 1} + ${b - 1}`];
        const falsehoods = [`${a} + ${b} = ${sum + 1}`, `${sum} = ${a} + ${b + 1}`, `${a} + ${b} = ${a} + ${b + 2}`, `${sum} − ${b} = ${a + 1}`, `${a} = ${a} + ${b}`];
        return {
          prompt: grade < 2 ? "Which one is right?" : "Which of these is true?",
          answer: rng.pick(truths),
          wrong: rng.shuffle(falsehoods),
          hint: "Work out each side of the equal sign. Both sides must make the same number.",
          difficulty: 2,
        };
      }
      case "balance": {
        const c = rng.int(2, top);
        const d = rng.int(Math.max(2, a - c + 1), top);
        const answer = c + d - a;
        return {
          prompt: `What number goes in the box? ${a} + □ = ${c} + ${d}`,
          answer,
          // The sum of the other side, everything added, or one out.
          wrong: wrongNumbers(rng, answer, [c + d, a + c + d, answer + 1, answer - 1].filter(v => v !== answer), { min: 1 }),
          hint: `First find ${c} + ${d}. The left side must come to the same.`,
          difficulty: 3,
        };
      }
      case "order":
        return {
          prompt: `${a} + ${b} = ${sum}. So what is ${b} + ${a}?`,
          answer: sum,
          wrong: wrongNumbers(rng, sum, [sum + 1, sum - 1, Math.abs(a - b), b].filter(v => v !== sum), { min: 1 }),
          hint: "Adding in the other order gives the same answer.",
          difficulty: 1,
        };
      default: {
        // Two of the numbers make 10.
        const x = rng.int(1, 9);
        const first = rng.int(2, top);
        const answer = first + 10;
        return {
          prompt: `What is ${first} + ${x} + ${10 - x}?`,
          answer,
          wrong: wrongNumbers(rng, answer, [answer + 1, answer - 1, first + x, 10, answer + 10].filter(v => v !== answer), { min: 1 }),
          hint: `Look for two numbers that make 10, and add them first.`,
          difficulty: 2,
        };
      }
    }
  },
};

/** @type {QuestionType} */
export const oddEven = {
  id: "odd_even",
  name: "Odd and even",
  generate(rng, grade) {
    // Third grade: patterns in adding and multiplying (3.OA.9).
    if (grade >= 3) return arithmeticPattern(rng);
    const top = grade >= 2.5 ? 50 : 20;
    switch (rng.pick(["which", "which", "doubles", "halve", "next"])) {
      case "which": {
        const even = rng.chance(0.5);
        const fits = (/** @type {number} */ n) => (n % 2 === 0) === even;
        const pool = Array.from({ length: top - 1 }, (_, i) => i + 2);
        const answer = rng.pick(pool.filter(fits));
        const others = rng.shuffle(pool.filter(n => !fits(n))).slice(0, 3);
        return {
          prompt: `Which number is ${even ? "even" : "odd"}?`,
          answer,
          wrong: others,
          hint: "Even numbers end in 0, 2, 4, 6 or 8: they can be put into pairs with none left over.",
          difficulty: 1 + Number(answer > 20),
        };
      }
      case "doubles": {
        const half = rng.int(3, top / 2);
        const n = 2 * half;
        return {
          prompt: `Which shows ${n} as two equal numbers added together?`,
          answer: `${half} + ${half}`,
          // Two numbers that make it but aren't equal, or two equal numbers that don't.
          wrong: rng.shuffle([`${half - 1} + ${half + 1}`, `${half + 1} + ${half + 1}`, `${half - 1} + ${half - 1}`, `${half - 2} + ${half + 2}`]),
          hint: `Split ${n} into two equal groups.`,
          difficulty: 2,
        };
      }
      case "halve": {
        const half = rng.int(2, top / 2);
        return {
          prompt: `The same number goes in both boxes: □ + □ = ${2 * half}. What is it?`,
          answer: half,
          // The whole, or half again, or one out.
          wrong: wrongNumbers(rng, half, [2 * half, Math.floor(half / 2), half + 1, half - 1].filter(v => v !== half && v > 0), { min: 1 }),
          hint: `Two equal numbers make ${2 * half}. What is half of ${2 * half}?`,
          difficulty: 2,
        };
      }
      default: {
        const n = rng.int(3, top - 3);
        const even = rng.chance(0.5);
        const answer = (n + 1) % 2 === (even ? 0 : 1) ? n + 1 : n + 2;
        return {
          prompt: `What is the next ${even ? "even" : "odd"} number after ${n}?`,
          answer,
          wrong: wrongNumbers(rng, answer, [answer + 1, answer - 1, answer + 2, n].filter(v => v !== answer && v > n - 1), { min: 1 }),
          hint: `${even ? "Even" : "Odd"} numbers go up by 2. Count on from ${n}.`,
          difficulty: 1,
        };
      }
    }
  },
};

/** Sentences about adding and multiplying that are always true (3.OA.9). */
export const ALWAYS = [
  "2 times any number is always even.",
  "4 times any number is always even.",
  "Any number times 10 ends in 0.",
  "Any number times 5 ends in 0 or 5.",
  "Adding two odd numbers always gives an even number.",
  "Adding two even numbers always gives an even number.",
  "Adding an odd number and an even number always gives an odd number.",
  "Multiplying two odd numbers always gives an odd number.",
];

/** And sentences that sound as if they might be, but aren't. */
export const NOT_ALWAYS = [
  "3 times any number is always odd.",
  "5 times any number is always odd.",
  "Any number times 5 ends in 5.",
  "Any number times 4 ends in 4.",
  "Adding two odd numbers always gives an odd number.",
  "Adding an odd number and an even number always gives an even number.",
  "Multiplying two odd numbers always gives an even number.",
  "Adding two even numbers always gives an odd number.",
];

/**
 * What can be said of a times table, with a test of whether it is true.
 * @type {readonly { text: string, test: (table: number[]) => boolean }[]}
 */
export const TABLE_FACTS = [
  { text: "Every number in it is even.", test: t => t.every(n => n % 2 === 0) },
  { text: "Every number in it is odd.", test: t => t.every(n => n % 2 === 1) },
  { text: "The numbers go odd, even, odd, even.", test: t => t.every((n, i) => n % 2 === (i % 2 === 0 ? 1 : 0)) },
  { text: "Every number in it ends in 0 or 5.", test: t => t.every(n => n % 5 === 0) },
  { text: "Every number in it ends in 0.", test: t => t.every(n => n % 10 === 0) },
  { text: "The digits of every number in it add up to 9.", test: t => t.every(n => String(n).split("").reduce((sum, d) => sum + Number(d), 0) === 9) },
];

/**
 * A pattern in adding or multiplying (3.OA.9): which sentence is always true,
 * or what is true of a whole times table.
 * @param {Rng} rng
 * @returns {import("./common.js").Draft}
 */
function arithmeticPattern(rng) {
  if (rng.chance(0.5)) {
    return {
      prompt: "Which of these is always true?",
      answer: rng.pick(ALWAYS),
      wrong: rng.shuffle(NOT_ALWAYS),
      hint: "Try each one with a few numbers, small and big, odd and even. One example that doesn't work shows it isn't always true.",
      difficulty: 2,
    };
  }
  const n = rng.int(2, 10);
  const table = Array.from({ length: 10 }, (_, i) => n * (i + 1));
  return {
    prompt: `Here is the ${n} times table: ${table.join(", ")}. Which is true of it?`,
    answer: rng.pick(TABLE_FACTS.filter(f => f.test(table))).text,
    wrong: rng.shuffle(TABLE_FACTS.filter(f => !f.test(table))).map(f => f.text),
    hint: "Look at the last digit of each number, and whether it is odd or even.",
    difficulty: 2,
  };
}
