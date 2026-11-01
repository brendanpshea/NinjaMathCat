// Working with fractions as numbers: equivalent fractions and comparing them
// (3.NF.3, 4.NF.1-2), then adding, subtracting, multiplying and dividing
// (4.NF.3-4, 5.NF.1, 5.NF.4, 5.NF.7, 6.NS.1). The arithmetic is exact
// (rational.js), and no wrong answer is ever worth the same as the right one.

import { atGrade } from "./common.js";
import { frac, simplify, add, subtract, multiply, divide, same, compare, formatFraction } from "./rational.js";

/** @import { QuestionType } from "./common.js" */
/** @import { Fraction } from "./rational.js" */
/** @import { Rng } from "../rng.js" */

/**
 * As written, "a/b", not simplified.
 * @param {Fraction} f
 */
const plain = f => `${f.n}/${f.d}`;

/**
 * Wrong fractions, written out: never worth the same as the answer or as
 * each other, never with a zero or negative part, and, if `dens` is given,
 * only with those denominators.
 * @param {Rng} rng
 * @param {Fraction} answer
 * @param {Fraction[]} likely
 * @param {(f: Fraction) => string} write
 * @param {number[]} [dens]
 */
export function wrongFractions(rng, answer, likely, write, dens) {
  /** @type {Fraction[]} */
  const kept = [];
  // Near misses go last, for when the likely mistakes run short.
  const step = frac(1, Math.max(2, answer.d));
  const fallbacks = rng.shuffle([add(answer, step), subtract(answer, step), add(answer, frac(1)), add(answer, add(step, step))]);
  for (const f of [...rng.shuffle(likely), ...fallbacks]) {
    if (f.d <= 0 || f.n <= 0 || same(f, answer) || kept.some(k => same(k, f)) || (dens && !dens.includes(f.d))) continue;
    kept.push(f);
  }
  return kept.map(write);
}

/** @typedef {"equivalent" | "sameBottom" | "sameTop" | "whole" | "different" | "extreme"} CompareKind */

/**
 * What a grade compares: equivalent fractions, the same denominator or
 * numerator, and whole numbers as fractions, with halves to eighths (3.NF.3);
 * then any denominators to twelfths (4.NF.1-2).
 * @type {readonly [number, { kinds: CompareKind[], dens: number[] }][]}
 */
const COMPARING = [
  [3.5, { kinds: ["equivalent", "sameBottom", "sameTop", "whole"], dens: [2, 3, 4, 6, 8] }],
  [Infinity, { kinds: ["equivalent", "different", "extreme"], dens: [2, 3, 4, 5, 6, 8, 10, 12] }],
];

/**
 * "Which is true?" with three false neighbours: the sign turned round, an
 * equals sign, and the fractions swapped.
 * @param {Rng} rng
 * @param {Fraction} a
 * @param {Fraction} b  not worth the same as a
 * @returns {{ answer: string, wrong: string[] }}
 */
function whichIsTrue(rng, a, b) {
  const op = compare(a, b) > 0 ? ">" : "<";
  const flip = op === ">" ? "<" : ">";
  return { answer: `${plain(a)} ${op} ${plain(b)}`, wrong: rng.shuffle([`${plain(a)} ${flip} ${plain(b)}`, `${plain(a)} = ${plain(b)}`, `${plain(b)} ${op} ${plain(a)}`]) };
}

/** @type {QuestionType} */
export const fractionCompare = {
  id: "fraction_compare",
  name: "Comparing fractions",
  generate(rng, grade) {
    const { kinds, dens } = atGrade(grade, COMPARING);
    const kind = rng.pick(kinds);
    // Third grade meets only halves, thirds, fourths, sixths and eighths (3.NF).
    const only = grade < 4 ? dens : undefined;

    if (kind === "equivalent") {
      // A simple fraction, and the same with top and bottom multiplied.
      const d = rng.pick(dens.filter(x => x <= (grade < 4 ? 4 : 6)));
      const n = rng.pick([1, 2, 3, 4, 5].filter(x => x < d && simplify(frac(x, d)).d === d));
      const k = rng.pick([2, 3, 4].filter(x => (grade < 4 ? x * d <= 8 : x * d <= 24)));
      const base = frac(n, d);
      const answer = frac(n * k, d * k);
      return {
        prompt: `Which fraction is worth the same as ${plain(base)}?`,
        answer: plain(answer),
        // Multiplying only the top or only the bottom, or adding instead of multiplying.
        wrong: wrongFractions(rng, base, [frac(n * k, d), frac(n, d * k), frac(n + k, d + k), frac(n * k + 1, d * k), frac(n * k - 1, d * k), frac(d, n * k)], plain, only),
        hint: "Multiply the top and the bottom by the same number.",
        difficulty: 1 + Number(grade >= 4) + Number(k > 2),
      };
    }

    if (kind === "whole") {
      const d = rng.pick(dens);
      const w = rng.int(1, 3);
      const answer = frac(w * d, d);
      return {
        prompt: `Which fraction is worth the same as ${w}?`,
        answer: plain(answer),
        wrong: wrongFractions(rng, answer, [frac(w, d), frac(d, w * d + 1), frac(w * d, w * d + d), frac(w * d - 1, d), frac(d + w, d)], plain, only),
        hint: `${w} whole ${w === 1 ? "is" : "are"} how many ${d === 2 ? "halves" : `parts of ${d}`}?`,
        difficulty: 1 + Number(w > 1),
      };
    }

    if (kind === "extreme") {
      /** @type {Fraction[]} */
      const picked = [];
      while (picked.length < 4) {
        const d = rng.pick(dens);
        const f = frac(rng.int(1, d - 1), d);
        if (!picked.some(p => same(p, f))) picked.push(f);
      }
      const greatest = rng.chance(0.5);
      const pick = picked.reduce((best, f) => (compare(f, best) * (greatest ? 1 : -1) > 0 ? f : best));
      return {
        prompt: `Which fraction is the ${greatest ? "greatest" : "least"}?`,
        answer: plain(pick),
        wrong: picked.filter(f => f !== pick).map(plain),
        hint: "Compare each one with 1/2, or give them the same denominator.",
        difficulty: 3,
      };
    }

    // Two fractions to compare: same bottom, same top, or neither.
    let a, b;
    do {
      if (kind === "sameBottom") {
        const d = rng.pick(dens);
        [a, b] = [frac(rng.int(1, d - 1), d), frac(rng.int(1, d - 1), d)];
      } else if (kind === "sameTop") {
        const n = rng.int(1, 3);
        const options = dens.filter(x => x > n);
        [a, b] = [frac(n, rng.pick(options)), frac(n, rng.pick(options))];
      } else {
        const [d1, d2] = rng.shuffle(dens).slice(0, 2);
        [a, b] = [frac(rng.int(1, d1 - 1), d1), frac(rng.int(1, d2 - 1), d2)];
      }
    } while (same(a, b));
    const { answer, wrong } = whichIsTrue(rng, a, b);
    return {
      prompt: "Which is true?",
      answer,
      wrong,
      hint: kind === "sameBottom" ? "Same size parts: more parts is more."
        : kind === "sameTop" ? "Same number of parts: the bigger the bottom number, the smaller each part."
        : "Give them the same denominator, or compare each with 1/2.",
      difficulty: kind === "different" ? 3 : 1 + Number(kind === "sameTop"),
    };
  },
};

/** @typedef {"likeAdd" | "likeSubtract" | "mixedAdd" | "timesWhole" | "unlikeAdd" | "unlikeSubtract" | "multiply" | "unitDivide" | "divide"} ArithmeticKind */

/**
 * What a grade does with fractions: adding and subtracting with the same
 * denominator and multiplying by a whole number (4.NF.3-4), with mixed
 * numbers later in the year (4.NF.3c); unlike denominators, multiplying, and
 * unit fractions divided (5.NF.1, 5.NF.4, 5.NF.7); dividing fractions (6.NS.1).
 * @type {readonly [number, ArithmeticKind[]][]}
 */
const WORKING = [
  [4, ["likeAdd", "likeSubtract", "timesWhole"]],
  [4.5, ["likeAdd", "likeSubtract", "mixedAdd", "timesWhole"]],
  [5.5, ["unlikeAdd", "unlikeSubtract", "multiply", "unitDivide"]],
  [Infinity, ["divide", "divide", "multiply", "unlikeAdd"]],
];

const DENS = [2, 3, 4, 5, 6, 8, 10, 12];

/**
 * The kinds a chapter can focus on, at a grade: adding and subtracting, with
 * like denominators in fourth grade and unlike ones from fifth; multiplying;
 * or dividing.
 * @type {Record<string, (grade: number) => ArithmeticKind[]>}
 */
const FOCUSED = {
  adding: grade => (grade < 5 ? ["likeAdd", "likeSubtract", ...(grade >= 4.5 ? /** @type {ArithmeticKind[]} */ (["mixedAdd"]) : [])] : ["unlikeAdd", "unlikeSubtract"]),
  multiplying: grade => (grade < 5 ? ["timesWhole"] : ["multiply"]),
  dividing: grade => (grade < 6 ? ["unitDivide"] : ["divide", "unitDivide"]),
};

/** @type {QuestionType} */
export const fractionArithmetic = {
  id: "fraction_arithmetic",
  name: "Fraction arithmetic",
  focuses: { adding: "Adding and subtracting", multiplying: "Multiplying", dividing: "Dividing" },
  generate(rng, grade, focus) {
    const kind = rng.pick(focus && FOCUSED[focus] ? FOCUSED[focus](grade) : atGrade(grade, WORKING));
    // Fourth grade keeps the denominator as it is (4/8, 6/5); from the middle
    // of the year, mixed numbers; from fifth, simplest form.
    /** @param {Fraction} f */
    const write = f => (grade < 4.5 ? plain(f) : formatFraction(grade >= 5 ? simplify(f) : f, { mixed: true }));

    switch (kind) {
      case "likeAdd":
      case "likeSubtract": {
        const d = rng.pick(DENS.filter(x => x >= 3));
        let [a, b] = [rng.int(1, d - 1), rng.int(1, d - 1)];
        const adding = kind === "likeAdd";
        if (adding && grade < 4.5) b = rng.int(1, d - a > 0 ? d - a : 1);
        if (!adding && b >= a) [a, b] = b === a ? [a + 1, b] : [b, a];
        const answer = frac(adding ? a + b : a - b, d);
        return {
          prompt: `What is ${a}/${d} ${adding ? "+" : "−"} ${b}/${d}?`,
          answer: write(answer),
          // Adding or subtracting the bottoms too, or one part out.
          wrong: wrongFractions(rng, answer, [frac(answer.n, adding ? 2 * d : d + d), frac(adding ? a - b : a + b, d), frac(answer.n + 1, d), frac(answer.n - 1, d), frac(answer.n, d + 1)], write),
          hint: "The parts are the same size, so only the number of parts changes.",
          difficulty: 1 + Number(answer.n >= d),
        };
      }
      case "mixedAdd": {
        const d = rng.pick([3, 4, 5, 6, 8]);
        const [w1, w2] = [rng.int(1, 4), rng.int(1, 4)];
        const [n1, n2] = [rng.int(1, d - 1), rng.int(1, d - 1)];
        const answer = frac((w1 + w2) * d + n1 + n2, d);
        return {
          prompt: `What is ${w1} ${n1}/${d} + ${w2} ${n2}/${d}?`,
          answer: write(answer),
          wrong: wrongFractions(rng, answer, [frac(answer.n - d, d), frac(answer.n + d, d), frac((w1 + w2) * 2 * d + n1 + n2, 2 * d), frac(answer.n + 1, d), frac(answer.n - 1, d)], write),
          hint: "Add the whole numbers, add the fractions, and turn any whole made of parts into a 1.",
          difficulty: 2 + Number(n1 + n2 >= d),
        };
      }
      case "timesWhole": {
        const d = rng.pick(DENS.filter(x => x >= 3));
        const a = rng.int(1, d - 1);
        const k = rng.int(2, 6);
        const answer = frac(k * a, d);
        return {
          prompt: `What is ${k} × ${a}/${d}?`,
          answer: write(answer),
          // Multiplying the bottom too, or the bottom instead of the top.
          wrong: wrongFractions(rng, answer, [frac(k * a, k * d), frac(a, k * d), frac(k + a, d), frac(k * a + 1, d), frac(k * a, d + k)], write),
          hint: `${k} groups of ${a}/${d}: multiply the top by ${k}.`,
          difficulty: 2,
        };
      }
      case "unlikeAdd":
      case "unlikeSubtract": {
        const [d1, d2] = rng.shuffle(DENS).slice(0, 2);
        let [x, y] = [frac(rng.int(1, d1 - 1), d1), frac(rng.int(1, d2 - 1), d2)];
        const adding = kind === "unlikeAdd";
        if (!adding && compare(x, y) < 0) [x, y] = [y, x];
        if (!adding && same(x, y)) x = frac(x.n * y.d + 1, x.d * y.d);
        const answer = adding ? add(x, y) : subtract(x, y);
        return {
          prompt: `What is ${plain(x)} ${adding ? "+" : "−"} ${plain(y)}?`,
          answer: write(answer),
          // Adding or subtracting tops and bottoms, the tops over a common bottom without scaling, or one part out.
          wrong: wrongFractions(rng, answer, [
            frac(adding ? x.n + y.n : Math.abs(x.n - y.n), adding ? x.d + y.d : Math.abs(x.d - y.d)),
            frac(adding ? x.n + y.n : Math.abs(x.n - y.n), x.d * y.d),
            add(answer, frac(1, x.d * y.d)),
            subtract(answer, frac(1, x.d * y.d)),
            adding ? subtract(x, y) : add(x, y),
          ], write),
          hint: "Give both fractions the same denominator first.",
          difficulty: 3,
        };
      }
      case "multiply": {
        const [b, d] = [rng.pick(DENS), rng.pick(DENS)];
        const [x, y] = [frac(rng.int(1, b - 1), b), frac(rng.int(1, d - 1), d)];
        const answer = multiply(x, y);
        return {
          prompt: `What is ${plain(x)} × ${plain(y)}?`,
          answer: write(answer),
          // Dividing instead, adding, or keeping one bottom.
          wrong: wrongFractions(rng, answer, [divide(x, y), frac(x.n + y.n, x.d + y.d), frac(x.n * y.n, x.d), frac(x.n * y.d, x.d * y.n), add(x, y)], write),
          hint: "Multiply the tops, then multiply the bottoms.",
          difficulty: 2,
        };
      }
      case "unitDivide": {
        const b = rng.pick([2, 3, 4, 5, 6, 8]);
        const k = rng.int(2, 6);
        const fractionFirst = rng.chance(0.5);
        const answer = fractionFirst ? frac(1, b * k) : frac(k * b);
        return {
          prompt: fractionFirst ? `What is 1/${b} ÷ ${k}?` : `What is ${k} ÷ 1/${b}?`,
          answer: write(answer),
          // Multiplying the wrong way, or dividing the wrong way round.
          wrong: wrongFractions(rng, answer, [frac(k, b), frac(b, k), frac(1, b + k), frac(k * b), frac(1, b * k), frac(k + b)], write),
          hint: fractionFirst ? `Share 1/${b} into ${k} equal parts.` : `How many ${b === 2 ? "halves" : `pieces of 1/${b}`} are in ${k} wholes?`,
          difficulty: 2 + Number(fractionFirst),
        };
      }
      case "divide": {
        const [b, d] = [rng.pick(DENS), rng.pick(DENS)];
        const [x, y] = [frac(rng.int(1, b - 1), b), frac(rng.int(1, d - 1), d)];
        const answer = divide(x, y);
        return {
          prompt: `What is ${plain(x)} ÷ ${plain(y)}?`,
          answer: write(answer),
          // Multiplying without flipping, or flipping the first one instead.
          wrong: wrongFractions(rng, answer, [multiply(x, y), divide(y, x), frac(x.n * y.n, x.d * y.d), frac(x.d * y.n, x.n * y.d), add(answer, frac(1))], write),
          hint: `Dividing by ${plain(y)} is the same as multiplying by ${y.d}/${y.n}.`,
          difficulty: 3,
        };
      }
    }
    throw new Error(`No fraction question of kind ${kind}`);
  },
};
