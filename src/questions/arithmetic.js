// Number facts and written methods: adding, taking away, missing numbers,
// multiplying and dividing, from counting on in kindergarten to long division.

import { atGrade, wrongNumbers, formatNumber as fmt } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * The largest number a grade adds and subtracts within: 5 and then 10 in
 * kindergarten (K.OA.5), 20 in first grade (1.OA.6), 100 and then 1000 in
 * second (2.NBT.5, 2.NBT.7), 1000 all through third (3.NBT.2), and 10,000 and
 * then a million in fourth (4.NBT.4).
 * @type {readonly [number, number][]}
 */
export const WITHIN = [[0, 5], [0.5, 10], [1, 20], [1.5, 50], [2, 100], [2.5, 500], [3.5, 1000], [4, 10000], [Infinity, 1000000]];

/**
 * The largest factor in a grade's times tables: equal groups up to 5 × 5 in
 * second grade (2.OA.4), the full table from third (3.OA.7).
 * @type {readonly [number, number][]}
 */
export const FACTORS = [[2.5, 5], [Infinity, 10]];

/**
 * What a child gets by taking the smaller digit from the larger in every
 * column, a classic slip when a subtraction needs regrouping (52 − 17 → 45).
 * @param {number} a
 * @param {number} b
 */
export function smallerFromLarger(a, b) {
  let out = 0;
  for (let place = 1; a > 0 || b > 0; place *= 10) {
    out += Math.abs((a % 10) - (b % 10)) * place;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return out;
}

/**
 * What a child gets by adding each column and never carrying (58 + 67 → 15).
 * @param {number} a
 * @param {number} b
 */
export function addingWithoutCarrying(a, b) {
  let out = 0;
  for (let place = 1; a > 0 || b > 0; place *= 10) {
    out += (((a % 10) + (b % 10)) % 10) * place;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return out;
}

/**
 * What a child gets by multiplying each digit by a one-digit number and
 * dropping what should be carried (47 × 6 → 242).
 * @param {number} a
 * @param {number} digit
 */
export function multiplyingWithoutCarrying(a, digit) {
  let out = 0;
  for (let place = 1; a > 0; place *= 10) {
    const product = (a % 10) * digit;
    out += (a >= 10 ? product % 10 : product) * place;
    a = Math.floor(a / 10);
  }
  return out;
}

/**
 * @param {number} a
 * @param {number} b
 */
function carries(a, b) {
  let count = 0;
  let carry = 0;
  while (a > 0 || b > 0) {
    carry = (a % 10) + (b % 10) + carry >= 10 ? 1 : 0;
    count += carry;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

/**
 * A number with this many digits.
 * @param {Rng} rng
 * @param {number} digits
 */
function withDigits(rng, digits) {
  return rng.int(10 ** (digits - 1) + 1, 10 ** digits - 1);
}

/**
 * A hint for adding, with the child's own numbers: count on from the bigger
 * number when the other is small, make a ten within 20, and past that, the
 * first column of the written method.
 * @param {number} a
 * @param {number} b
 */
function addingHint(a, b) {
  const [big, small] = a >= b ? [a, b] : [b, a];
  if (big + small <= 10 || small <= 3 || (big + small <= 20 && big >= 10)) return `Start at ${fmt(big)} and count on ${small}.`;
  if (big + small <= 20) return `Make a ten first: ${big} and ${10 - big} more make 10. Then add the rest of the ${small}.`;
  const start = `${big >= 1000 ? "Line the numbers up by place. " : ""}Start with the ones: ${a % 10} + ${b % 10}.`;
  return (a % 10) + (b % 10) >= 10 ? `${start} Ten ones make a new ten, to add with the tens.`
    : carries(a, b) > 0 ? `${start} When a place makes 10 or more, carry 1 to the next place.`
    : `${start} Then add the tens${big >= 1000 ? ", the hundreds and the thousands" : big >= 100 ? ", then the hundreds" : ""}.`;
}

/**
 * A hint for taking away, with the child's own numbers: count back a few,
 * count up when the two are close, and past 20, the first column of the
 * written method.
 * @param {number} a
 * @param {number} b
 */
function takingHint(a, b) {
  if (a === b) return `Start with ${fmt(a)} and take all of it away.`;
  if (a <= 10 || b <= 3) return `Start at ${fmt(a)} and count back ${b}.`;
  if (a - b <= 3 || (a <= 20 && a - b <= b)) return `Count up from ${fmt(b)} to ${fmt(a)}.`;
  if (a <= 20) return `Start at ${a} and count back ${b}.`;
  const start = `${a >= 1000 ? "Line the numbers up by place. " : ""}Start with the ones: ${a % 10} take away ${b % 10}`;
  return a % 10 < b % 10 ? `${start}? Not enough ones, so trade a ten for ten ones first.`
    : smallerFromLarger(a, b) !== a - b ? `${start}. When a place runs short, trade from the next place.`
    : `${start}. Then the tens${a >= 1000 ? ", the hundreds and the thousands" : a >= 100 ? ", then the hundreds" : ""}.`;
}

/** @type {QuestionType} */
export const addition = {
  id: "addition",
  name: "Addition",
  generate(rng, grade) {
    if (grade < 1 && rng.chance(0.3)) return showWithObjects(rng, true, atGrade(grade, WITHIN));
    if (grade >= 2 && grade < 3 && rng.chance(0.2)) return strategy(rng, true);
    // In second grade, some facts within 20, to know by heart (2.OA.2).
    const max = grade >= 2 && grade < 3 && rng.chance(0.3) ? 20 : atGrade(grade, WITHIN);
    const a = rng.int(1, max - 1);
    const b = rng.int(1, max - a);
    const sum = a + b;
    const carried = carries(a, b);
    return {
      prompt: `What is ${fmt(a)} + ${fmt(b)}?`,
      answer: sum,
      // Off by one, forgetting to carry, a place out, or taking away instead.
      wrong: wrongNumbers(rng, sum, [
        sum + 1, sum - 1, carried > 0 ? addingWithoutCarrying(a, b) : sum + 10, sum - 10, ...(max >= 1000 ? [sum + 100, sum - 100] : []), Math.abs(a - b),
      ]),
      hint: addingHint(a, b),
      difficulty: 1 + Number(carried > 0) + Number(sum > max / 2),
    };
  },
};

/** @type {QuestionType} */
export const subtraction = {
  id: "subtraction",
  name: "Subtraction",
  generate(rng, grade) {
    if (grade < 1 && rng.chance(0.3)) return showWithObjects(rng, false, atGrade(grade, WITHIN));
    if (grade >= 2 && grade < 3 && rng.chance(0.2)) return strategy(rng, false);
    // In second grade, some facts within 20, to know by heart (2.OA.2).
    const max = grade >= 2 && grade < 3 && rng.chance(0.3) ? 20 : atGrade(grade, WITHIN);
    const a = rng.int(2, max);
    // Now and then all of it, so 4 − 4 = 0 comes up, but not a third of the
    // time, as drawing b from 1 to a would make it in kindergarten.
    const b = rng.chance(0.06) ? a : rng.int(1, a - 1);
    const difference = a - b;
    const regroups = smallerFromLarger(a, b) !== difference;
    return {
      prompt: `What is ${fmt(a)} − ${fmt(b)}?`,
      answer: difference,
      wrong: wrongNumbers(rng, difference, [
        difference + 1, difference - 1, smallerFromLarger(a, b), a + b, regroups ? difference + 10 : difference - 10,
        ...(max >= 1000 ? [difference + 100, difference - 100] : []),
      ]),
      hint: takingHint(a, b),
      difficulty: 1 + Number(regroups) + Number(a > max / 2),
    };
  },
};

/** Two kinds of thing, to put together as two groups (K.OA.1). */
const TWO_KINDS = [["red apples", "🍎", "green apples", "🍏"], ["red counters", "🔴", "blue counters", "🔵"], ["cats", "🐱", "dogs", "🐶"]];
const TAKEN = ["🐦", "🐟", "🎈", "⭐", "🍪"];

/** @param {string} sentence  "3 + 2" or "5 − 1" */
function valueOf(sentence) {
  const [x, op, y] = sentence.split(" ");
  return op === "+" ? Number(x) + Number(y) : Number(x) - Number(y);
}

/**
 * A picture of two groups put together, or of some crossed out, and the
 * number sentence that shows it (K.OA.1).
 * @param {Rng} rng
 * @param {boolean} adding
 * @param {number} max
 * @returns {Draft}
 */
function showWithObjects(rng, adding, max) {
  if (adding) {
    const [first, one, second, other] = rng.pick(TWO_KINDS);
    const a = rng.int(1, max - 1);
    const b = rng.int(1, max - a);
    const answer = `${a} + ${b}`;
    // Taking away instead, a group counted twice, or one counted wrong.
    const wrong = [`${Math.max(a, b)} − ${Math.min(a, b)}`, `${a} + ${a}`, `${b} + ${b}`, `${a} + ${b + 1}`, `${a + 1} + ${b}`].filter(s => valueOf(s) !== a + b);
    return {
      prompt: `Which number sentence shows the ${first} and the ${second} put together?`,
      visual: { kind: "pattern", items: [...Array(a).fill(one), ...Array(b).fill(other)] },
      answer,
      wrong: [...new Set(rng.shuffle(wrong))],
      hint: "Count each group. Putting groups together is adding.",
      difficulty: 1,
    };
  }
  const total = rng.int(2, max);
  const gone = rng.int(1, total - 1);
  const answer = `${total} − ${gone}`;
  // Adding instead, the ones left taken away, or one counted wrong.
  const wrong = [`${total} + ${gone}`, `${total} − ${total - gone}`, `${total} − ${gone + 1}`, `${total - 1} − ${gone}`, `${total - gone} + ${gone}`].filter(s => valueOf(s) !== total - gone && valueOf(s) >= 0);
  return {
    prompt: "The ones crossed out are taken away. Which number sentence shows the picture?",
    visual: { kind: "objects", emoji: rng.pick(TAKEN), count: total, crossed: gone },
    answer,
    wrong: [...new Set(rng.shuffle(wrong))],
    hint: "Count them all first. Then take away the ones crossed out.",
    difficulty: 1,
  };
}

/**
 * Ways to work out a two-digit sum or difference (2.NBT.9). One is sound;
 * the others each have a slip in their thinking, though every step's
 * arithmetic is right, so the steps have to be followed, not just checked.
 * @param {Rng} rng
 * @param {boolean} adding
 * @returns {Draft}
 */
function strategy(rng, adding) {
  /** @typedef {[number, "+" | "−", number]} Step */
  /** @param {Step[]} steps */
  const write = steps => steps.map(([x, op, y]) => `${x} ${op} ${y} = ${op === "+" ? x + y : x - y}`).join(", then ");
  /** @param {Step[]} steps */
  const allPositive = steps => steps.every(([x, op, y]) => (op === "+" ? x + y : x - y) >= 0);
  if (adding) {
    let a, b;
    do [a, b] = [rng.int(21, 68), rng.int(13, 39)];
    while ((a % 10) + (b % 10) < 10 || a + b > 99 || a % 10 === b % 10);
    const [A, a1, B, b1] = [a - (a % 10), a % 10, b - (b % 10), b % 10];
    /** @type {Step[][]} */
    const sound = [
      [[A, "+", B], [a1, "+", b1], [A + B, "+", a1 + b1]],
      [[a, "+", B], [a + B, "+", b1]],
      [[a, "+", B + 10], [a + B + 10, "−", 10 - b1]],
      [[a, "+", 10 - a1], [a + 10 - a1, "+", b - (10 - a1)]],
    ];
    /** @type {Step[][]} */
    const slips = [
      // Adding too much, then adding the extra on again instead of taking it off.
      [[a, "+", B + 10], [a + B + 10, "+", 10 - b1]],
      // The first number's ones added again, in place of the second's.
      [[a, "+", B], [a + B, "+", a1]],
      // The ten made by the ones dropped.
      [[A, "+", B], [a1, "+", b1], [A + B, "+", (a1 + b1) % 10]],
      // The part used to make a ten not taken off the second number.
      [[a, "+", 10 - a1], [a + 10 - a1, "+", b]],
    ];
    return {
      prompt: `Which is a correct way to work out ${a} + ${b}?`,
      answer: write(rng.pick(sound)),
      wrong: rng.shuffle(slips).map(write),
      hint: "Follow each step. Every ten and every one of both numbers has to be added once, and anything extra taken off again.",
      difficulty: 3,
    };
  }
  let a, b;
  do [a, b] = [rng.int(41, 98), rng.int(12, 39)];
  while (a % 10 >= b % 10 || a - b < 10);
  const [A, a1, B, b1] = [a - (a % 10), a % 10, b - (b % 10), b % 10];
  /** @type {Step[][]} */
  const sound = [
    [[a, "−", B], [a - B, "−", b1]],
    [[a, "−", B + 10], [a - B - 10, "+", 10 - b1]],
  ];
  const slips = /** @type {Step[][]} */ ([
    // Taking away the smaller ones digit from the bigger, whichever number it is in.
    [[A, "−", B], [b1, "−", a1], [A - B, "+", b1 - a1]],
    // Taking away too much, then taking the extra away again instead of giving it back.
    [[a, "−", B + 10], [a - B - 10, "−", 10 - b1]],
    // The ones added on instead of taken away.
    [[a, "−", B], [a - B, "+", b1]],
    // A ten too many taken away.
    [[a, "−", b1], [a - b1, "−", B + 10]],
  ]).filter(allPositive);
  return {
    prompt: `Which is a correct way to work out ${a} − ${b}?`,
    answer: write(rng.pick(sound)),
    wrong: rng.shuffle(slips).map(write),
    hint: "Follow each step. Taking away too much means giving some back, and the ones digits can't swap places.",
    difficulty: 3,
  };
}

/**
 * The properties of multiplication, as missing numbers: the order can
 * change, the grouping can change, and a factor can be split (3.OA.5).
 * @param {Rng} rng
 * @returns {Draft}
 */
function properties(rng) {
  const [a, b, c] = [rng.int(2, 9), rng.int(4, 9), rng.int(2, 9)];
  const part = rng.int(2, b - 2);
  /** @type {{ equation: string, answer: number, likely: number[], hint: string }[]} */
  const forms = [
    { equation: `${a} × ${b} = ${b} × □`, answer: a, likely: [b, a * b, a + b], hint: "Multiplying in either order gives the same answer." },
    { equation: `(${a} × ${b}) × ${c} = ${a} × (${b} × □)`, answer: c, likely: [b * c, a * b, a], hint: "Grouping the numbers another way gives the same answer." },
    { equation: `${a} × ${b} = ${a} × ${part} + ${a} × □`, answer: b - part, likely: [b, part, a * (b - part), b + part], hint: `${b} is ${part} and some more. ${a} groups of ${b} are ${a} groups of ${part} and ${a} groups of the rest.` },
  ];
  const form = rng.pick(forms);
  return {
    prompt: `What number goes in the box? ${form.equation}`,
    answer: form.answer,
    wrong: wrongNumbers(rng, form.answer, form.likely.filter(n => n !== form.answer), { min: 1 }),
    hint: form.hint,
    difficulty: form.equation.includes("+") ? 3 : 2,
  };
}

/**
 * An equation with a box to fill: adding or subtracting (1.OA.8), and from
 * third grade multiplying or dividing too (3.OA.4), and the properties of
 * multiplying (3.OA.5).
 * @type {QuestionType}
 */
export const missingNumber = {
  id: "missing_number",
  name: "Missing number",
  generate(rng, grade) {
    if (grade >= 3 && rng.chance(0.2)) return properties(rng);
    if (grade >= 3 && rng.chance(0.5)) {
      const a = rng.int(2, 10);
      const b = rng.int(2, 10);
      const product = a * b;
      const form = rng.int(0, 3);
      /** @type {[string, number, string][]} */
      const forms = [
        [`${a} × □ = ${product}`, b, `Count by ${a}s until you reach ${product}.`],
        [`□ × ${b} = ${product}`, a, `How many ${b}s make ${product}?`],
        [`${product} ÷ □ = ${b}`, a, `Think: ${b} × □ = ${product}.`],
        [`□ ÷ ${a} = ${b}`, product, `Think: ${a} × ${b} = □.`],
      ];
      const [equation, missing, hint] = forms[form];
      return {
        prompt: `What number goes in the box? ${equation}`,
        answer: missing,
        // Copying a number that is there, a neighbouring fact, or adding them.
        wrong: wrongNumbers(rng, missing, form === 3
          ? [product + a, product - a, product + b, a + b]
          : [missing + 1, missing - 1, product, product - (form === 0 ? a : b), a + b], { min: 1 }),
        hint,
        difficulty: 2 + Number(form >= 2),
      };
    }
    const max = Math.min(atGrade(grade, WITHIN), 1000);
    if (grade >= 1 && grade < 3 && rng.chance(0.25)) {
      // Taking away, thought of as adding on (1.OA.4).
      const whole = rng.int(11, Math.min(max, 20));
      const part = rng.int(2, 9);
      return {
        prompt: `To work out ${whole} − ${part}, think: ${part} + □ = ${whole}. What number goes in the box?`,
        answer: whole - part,
        wrong: wrongNumbers(rng, whole - part, [whole + part, whole - part + 1, whole - part - 1, whole, part]),
        hint: `Count on from ${part} until you reach ${whole}.`,
        difficulty: 2,
      };
    }
    const total = rng.int(2, max);
    const part = rng.int(1, total - 1);
    const missing = total - part;
    const form = rng.int(0, 2);
    const equation = [`${part} + □ = ${total}`, `□ + ${part} = ${total}`, `${total} − □ = ${part}`][form];
    return {
      prompt: `What number goes in the box? ${equation}`,
      answer: missing,
      // Adding the two numbers shown, or copying one of them.
      wrong: wrongNumbers(rng, missing, [total + part, total, part, missing + 1, missing - 1]),
      hint: form === 2 ? `What do you take from ${total} to leave ${part}?`
        : total <= 20 ? `Count on from ${part} to ${total}.`
        : `Think: ${total} − ${part} = □.`,
      difficulty: 1 + Number(total > max / 2) + Number(form === 2),
    };
  },
};

/**
 * What a grade multiplies: its times tables (2.OA.4, 3.OA.7), a one-digit
 * number by a multiple of ten (3.NBT.3), then bigger numbers by one digit and
 * two digits by two (4.NBT.5), and three digits by two (5.NBT.5). A pair is
 * [digits in the first number, digits in the second].
 * @type {readonly [number, ("facts" | "tens" | [number, number])[]][]}
 */
const PRODUCTS = [
  [3, ["facts"]],
  [3.5, ["facts", "tens"]],
  [4, ["tens", [2, 1], [3, 1]]],
  [4.5, [[3, 1], [4, 1], [2, 2]]],
  [Infinity, [[2, 2], [3, 2], [4, 1]]],
];

/**
 * The times-table families in the order children usually learn them: 2, 5
 * and 10 first, then the rest (3.OA.7).
 */
export const FACT_FAMILIES = { easy: [2, 5, 10], harder: [3, 4, 6, 7, 8, 9] };

/** What each kind of fact a chapter can focus on means. */
const FACT_FOCUSES = { easy: "Facts with 2, 5 or 10", harder: "Facts with 3, 4, 6, 7, 8 and 9" };

/**
 * Two factors for a multiplication fact: any up to `top`; or one from the
 * easy families, either way round; or both from the harder ones.
 * @param {Rng} rng
 * @param {number} top
 * @param {string} [focus]  "easy" or "harder"
 * @returns {[number, number]}
 */
function factPair(rng, top, focus) {
  if (focus === "easy") {
    const [a, b] = [rng.pick(FACT_FAMILIES.easy), rng.int(2, 10)];
    return rng.chance(0.5) ? [a, b] : [b, a];
  }
  if (focus === "harder") return [rng.pick(FACT_FAMILIES.harder), rng.pick(FACT_FAMILIES.harder)];
  return [rng.int(2, top), rng.int(2, top)];
}

/** @type {QuestionType} */
export const multiplication = {
  id: "multiplication",
  name: "Multiplication",
  focuses: FACT_FOCUSES,
  generate(rng, grade, focus) {
    const kind = focus === "easy" || focus === "harder" ? "facts" : rng.pick(atGrade(grade, PRODUCTS));
    if (kind === "facts" || kind === "tens") {
      const top = atGrade(grade, FACTORS);
      const [a, b] = kind === "tens" ? [rng.int(2, top), 10 * rng.int(2, 9)] : factPair(rng, top, focus);
      const product = a * b;
      return {
        prompt: `What is ${a} × ${b}?`,
        answer: product,
        // A neighbouring fact, adding instead, or a zero lost or gained.
        wrong: wrongNumbers(rng, product, kind === "tens"
          ? [product / 10, product * 10, product + b, product - b, product + 10 * a]
          : [product + a, product - a, product + b, product - b, a + b], { spread: 4 }),
        hint: kind === "tens" ? `Work out ${a} × ${b / 10}, then make it ten times as big.` : `Think of ${a} groups of ${b}.`,
        difficulty: kind === "tens" ? 2 : 1 + Number(product > 25) + Number(Math.max(a, b) >= 7),
      };
    }
    const a = withDigits(rng, kind[0]);
    const b = kind[1] === 1 ? rng.int(3, 9) : withDigits(rng, kind[1]);
    const product = a * b;
    const ones = b % 10;
    return {
      prompt: `What is ${fmt(a)} × ${b}?`,
      answer: product,
      // Dropping a carry, forgetting the tens of the second number are tens,
      // or being one group out.
      wrong: wrongNumbers(rng, product, kind[1] === 1
        ? [multiplyingWithoutCarrying(a, b), product + a, product - a, product + 10, product - 10]
        : [a * ones + a * Math.floor(b / 10), a * ones, product + a, product - a, product + 100], { spread: 9 }),
      hint: kind[1] === 1 ? `Start with the ones: ${a % 10} × ${b}. Then multiply each place by ${b}, adding on anything carried.`
        : `Multiply ${fmt(a)} by ${ones}, then by ${b - ones}, and add the two parts.`,
      difficulty: 2 + Number(product >= 10000),
    };
  },
};

/**
 * What a grade divides: its times tables backwards (3.OA.7); two to four
 * digits by one, often with a remainder (4.NBT.6); then up to four digits by
 * two, coming out even (5.NBT.6, 6.NS.2).
 * @type {readonly [number, "facts" | "remainders" | "long"][]}
 */
const QUOTIENTS = [[3.5, "facts"], [4.5, "remainders"], [Infinity, "long"]];

/**
 * A quotient with its remainder, as children write it: 23 R 2.
 * @param {number} quotient
 * @param {number} remainder
 */
export function withRemainder(quotient, remainder) {
  return remainder === 0 ? String(quotient) : `${quotient} R ${remainder}`;
}

/**
 * The first step of dividing by one digit, as it is written out: the place to
 * start in, and the leading digits the divisor first fits into.
 * @param {number} dividend
 * @param {number} divisor
 */
function firstDivision(dividend, divisor) {
  const digits = String(dividend);
  let [lead, used] = [0, 0];
  while (used < digits.length && lead < divisor) lead = 10 * lead + Number(digits[used++]);
  return `Start with the ${["ones", "tens", "hundreds", "thousands"][digits.length - used]}: how many ${divisor}s fit into ${lead}?`;
}

/** @type {QuestionType} */
export const division = {
  id: "division",
  name: "Division",
  focuses: FACT_FOCUSES,
  generate(rng, grade, focus) {
    const kind = focus === "easy" || focus === "harder" ? "facts" : atGrade(grade, QUOTIENTS);
    if (kind === "facts") {
      const top = atGrade(grade, FACTORS);
      // Dividing by 2, 5 or 10 first, then by the rest.
      const divisor = focus === "easy" ? rng.pick(FACT_FAMILIES.easy) : focus === "harder" ? rng.pick(FACT_FAMILIES.harder) : rng.int(2, top);
      const quotient = rng.int(2, focus ? 10 : top);
      const dividend = divisor * quotient;
      return {
        prompt: `What is ${dividend} ÷ ${divisor}?`,
        answer: quotient,
        wrong: wrongNumbers(rng, quotient, [quotient + 1, quotient - 1, quotient + 2, quotient - 2, divisor], { min: 1 }),
        hint: `Think: ${divisor} × □ = ${dividend}.`,
        difficulty: 1 + Number(dividend > 25) + Number(divisor >= 7),
      };
    }

    if (kind === "long") {
      const divisor = rng.int(11, 99);
      const quotient = rng.int(12, Math.floor(9999 / divisor));
      const dividend = divisor * quotient;
      return {
        prompt: `What is ${dividend} ÷ ${divisor}?`,
        answer: quotient,
        // One out, a place out, or a zero too many.
        wrong: wrongNumbers(rng, quotient, [quotient + 1, quotient - 1, quotient + 10, quotient - 10, quotient * 10], { min: 1 }),
        hint: `Estimate first: about how many ${divisor}s make ${dividend}?`,
        difficulty: 3,
      };
    }

    const divisor = rng.int(3, 9);
    const quotient = rng.int(grade >= 4.5 ? 100 : 12, grade >= 4.5 ? 999 : 99);
    const remainder = rng.chance(0.6) ? rng.int(1, divisor - 1) : 0;
    const dividend = divisor * quotient + remainder;
    if (remainder === 0) {
      return {
        prompt: `What is ${dividend} ÷ ${divisor}?`,
        answer: quotient,
        wrong: wrongNumbers(rng, quotient, [quotient + 1, quotient - 1, quotient + 10, quotient - 10], { min: 1 }),
        hint: `${firstDivision(dividend, divisor)} Then bring down the next digit and go on.`,
        difficulty: 2,
      };
    }
    return {
      prompt: `What is ${dividend} ÷ ${divisor}? Write any remainder with R.`,
      answer: withRemainder(quotient, remainder),
      // A quotient one out, a remainder too big to be one, the remainder
      // counted the wrong way, or leaving it out.
      wrong: rng.shuffle([
        withRemainder(quotient + 1, remainder),
        withRemainder(quotient - 1, remainder + divisor),
        withRemainder(quotient, divisor - remainder),
        withRemainder(quotient, remainder + 1 < divisor ? remainder + 1 : remainder - 1),
        String(quotient),
      ]),
      hint: `${firstDivision(dividend, divisor)} What is left over at the end is the remainder.`,
      difficulty: 3,
    };
  },
};
