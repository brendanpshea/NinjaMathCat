// Expressions and equations: the order of operations and writing expressions
// (5.OA.1-2); exponents, letters for numbers and equivalent expressions
// (6.EE.1-4); one-step equations and inequalities (6.EE.5-8).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

const SUPERSCRIPTS = { 2: "²", 3: "³", 4: "⁴", 5: "⁵" };

/** @typedef {"order" | "brackets" | "write" | "exponent" | "evaluate" | "equivalent"} ExpressionKind */

/**
 * What a grade does with expressions: work them out in the right order, with
 * parentheses and brackets, and write them from words (5.OA.1-2); exponents,
 * letters standing for numbers, and expressions that are the same
 * (6.EE.1-4).
 * @type {readonly [number, ExpressionKind[]][]}
 */
const EXPRESSIONS = [
  [5.5, ["order", "brackets", "write"]],
  [Infinity, ["exponent", "evaluate", "equivalent", "order"]],
];

/** @type {QuestionType} */
export const expressions = {
  id: "expressions",
  name: "Expressions",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, EXPRESSIONS))) {
      case "order": return order(rng);
      case "brackets": return brackets(rng);
      case "write": return writeExpression(rng);
      case "exponent": return exponent(rng);
      case "evaluate": return evaluate(rng);
      case "equivalent": return equivalent(rng);
    }
  },
};

/**
 * An expression where the order matters (5.OA.1), with what working left to
 * right, or ignoring the parentheses, gives.
 * @param {Rng} rng
 * @returns {Draft}
 */
function order(rng) {
  const [a, b, c] = [rng.int(2, 12), rng.int(2, 9), rng.int(2, 9)];
  const forms = [
    { text: `${a} + ${b} × ${c}`, value: a + b * c, slips: [(a + b) * c, a * b + c] },
    { text: `${a} × (${b} + ${c})`, value: a * (b + c), slips: [a * b + c, a + b + c] },
    { text: `(${a} + ${b}) × ${c}`, value: (a + b) * c, slips: [a + b * c, a * c + b] },
    { text: `${a * c} − ${b} × ${c}`, value: a * c - b * c, slips: [(a * c - b) * c, a * c - b] },
  ].filter(f => f.value >= 0);
  const form = rng.pick(forms);
  return {
    prompt: `What is ${form.text}?`,
    answer: form.value,
    wrong: wrongNumbers(rng, form.value, [...form.slips, form.value + c, form.value - c], { min: 0 }),
    hint: "Work out anything in parentheses first, then multiply, then add or subtract.",
    difficulty: 2 + Number(form.text.includes("(")),
  };
}

/**
 * Brackets around parentheses (5.OA.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function brackets(rng) {
  const [a, b, d] = [rng.int(2, 6), rng.int(2, 9), rng.int(1, 5)];
  const c = d + rng.int(1, 8);
  const value = a * (b + (c - d));
  return {
    prompt: `What is ${a} × [${b} + (${c} − ${d})]?`,
    answer: value,
    // Multiplying only the first number inside, or working left to right.
    wrong: wrongNumbers(rng, value, [a * b + (c - d), a * b + c - d, a * (b + c) - d, value + a], { min: 0 }),
    hint: "Start with the innermost parentheses, then the brackets, then multiply.",
    difficulty: 3,
  };
}

/**
 * An expression from words (5.OA.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function writeExpression(rng) {
  let [a, b, c] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  // "Subtract b from a × c" needs b smaller than a × c, and different from it.
  if (b >= a * c) b = a * c - 1;
  const forms = [
    { words: `add ${a} and ${b}, then multiply by ${c}`, answer: `(${a} + ${b}) × ${c}`, wrong: [`${a} + ${b} × ${c}`, `${a} × ${c} + ${b}`, `${a} + ${c} × ${b}`] },
    { words: `multiply ${a} by ${b}, then subtract ${c}`, answer: `${a} × ${b} − ${c}`, wrong: [`${a} × (${b} − ${c})`, `${c} − ${a} × ${b}`, `(${a} − ${c}) × ${b}`] },
    { words: `${c} times the sum of ${a} and ${b}`, answer: `${c} × (${a} + ${b})`, wrong: [`${c} × ${a} + ${b}`, `${c} + ${a} × ${b}`, `(${c} + ${a}) × ${b}`] },
    { words: `subtract ${b} from ${a * c}, then divide by ${c}`, answer: `(${a * c} − ${b}) ÷ ${c}`, wrong: [`${a * c} − ${b} ÷ ${c}`, `(${b} − ${a * c}) ÷ ${c}`, `${c} ÷ (${a * c} − ${b})`] },
  ];
  const form = rng.pick(forms);
  return {
    prompt: `Which expression means "${form.words}"?`,
    answer: form.answer,
    wrong: rng.shuffle(form.wrong),
    hint: "Whatever has to happen first goes in parentheses.",
    difficulty: 2,
  };
}

/**
 * A whole-number power (6.EE.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function exponent(rng) {
  const power = rng.pick(/** @type {const} */ ([2, 3, 4, 5]));
  const base = rng.int(2, power === 2 ? 12 : power === 3 ? 6 : 3);
  const value = base ** power;
  return {
    prompt: `What is ${base}${SUPERSCRIPTS[power]}?`,
    answer: value,
    // Multiplying the two numbers, adding them, or one power out.
    wrong: wrongNumbers(rng, value, [base * power, base + power, base ** (power - 1), base ** (power + 1), power ** base].filter(v => v <= 100000), { min: 1 }),
    hint: `${base}${SUPERSCRIPTS[power]} means ${Array(power).fill(base).join(" × ")}.`,
    difficulty: 1 + Number(power > 2) + Number(value > 100),
  };
}

/**
 * An expression with a letter, worked out for a value of the letter (6.EE.2c).
 * @param {Rng} rng
 * @returns {Draft}
 */
function evaluate(rng) {
  const [a, b, n] = [rng.int(2, 9), rng.int(1, 12), rng.int(2, 9)];
  const forms = [
    { text: `${a}n + ${b}`, value: a * n + b, slips: [Number(`${a}${n}`) + b, a + n + b, a * (n + b)] },
    { text: `${a}(n + ${b})`, value: a * (n + b), slips: [a * n + b, a + n + b, Number(`${a}${n}`) + b] },
    { text: `n² + ${b}`, value: n * n + b, slips: [2 * n + b, n + 2 + b, (n + b) ** 2] },
    { text: `${a}n − ${b}`, value: a * n - b, slips: [Number(`${a}${n}`) - b, a + n - b, a * (n - b)] },
  ].filter(f => f.value > 0);
  const form = rng.pick(forms);
  return {
    prompt: `What is ${form.text} when n = ${n}?`,
    answer: form.value,
    // Reading "${a}n" as a two-digit number, adding instead of multiplying, or the wrong order.
    wrong: wrongNumbers(rng, form.value, form.slips.filter(v => v > 0), { min: 1 }),
    hint: `Put ${n} in place of n. A number right next to n means multiply.`,
    difficulty: 2 + Number(form.text.includes("(") || form.text.includes("²")),
  };
}

/**
 * An expression the same as another (6.EE.3).
 * @param {Rng} rng
 * @returns {Draft}
 */
function equivalent(rng) {
  const [a, b, c] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
  const forms = [
    { given: `${a}(x + ${b})`, answer: `${a}x + ${a * b}`, wrong: [`${a}x + ${b}`, `x + ${a * b}`, `${a}x + ${a + b}`] },
    { given: `${a}x + ${b}x`, answer: `${a + b}x`, wrong: [`${a + b}x²`, `${a * b}x`, `${a + b}`] },
    { given: `${a}(${b}x + ${c})`, answer: `${a * b}x + ${a * c}`, wrong: [`${a * b}x + ${c}`, `${a + b}x + ${a * c}`, `${b}x + ${a * c}`] },
    { given: `${a}x + ${a * b}`, answer: `${a}(x + ${b})`, wrong: [`${a}(x + ${a * b})`, `x + ${b}`, `${a}x(${b})`] },
  ];
  const form = rng.pick(forms);
  return {
    prompt: `Which expression is equal to ${form.given}?`,
    answer: form.answer,
    wrong: rng.shuffle(form.wrong),
    hint: "Try a number for x in both. Equal expressions give the same answer for every x.",
    difficulty: 2 + Number(form.given.includes("(")),
  };
}

/** @type {QuestionType} */
export const equations = {
  id: "equations",
  name: "Equations and inequalities",
  generate(rng) {
    const kind = rng.pick(["solve", "solve", "substitute", "inequality"]);
    if (kind === "inequality") return inequality(rng);
    if (kind === "substitute") {
      const [a, x, b] = [rng.int(2, 9), rng.int(2, 12), rng.int(1, 20)];
      const total = a * x + b;
      return {
        prompt: `Which value of x makes ${a}x + ${b} = ${total} true?`,
        answer: x,
        wrong: wrongNumbers(rng, x, [x + 1, x - 1, total - b, Math.floor(total / a)], { min: 1 }),
        hint: "Try each choice in place of x and see which one works.",
        difficulty: 2,
      };
    }
    const [a, x] = [rng.int(2, 12), rng.int(2, 15)];
    const forms = [
      { text: `x + ${a} = ${x + a}`, slips: [x + 2 * a, x + a] },
      { text: `x − ${a} = ${x}`, answer: x + a, slips: [x - a, x] },
      { text: `${a}x = ${a * x}`, slips: [a * x - a, a * a * x, a * x] },
      { text: `x ÷ ${a} = ${x}`, answer: a * x, slips: [x, a + x, a * x - a] },
    ];
    const form = rng.pick(forms);
    const answer = form.answer ?? x;
    return {
      prompt: `Solve for x: ${form.text}`,
      answer,
      // Doing the same thing again instead of undoing it, or copying a number.
      wrong: wrongNumbers(rng, answer, form.slips.filter(v => v > 0), { min: 1 }),
      hint: "Undo what is being done to x: subtraction undoes addition, division undoes multiplication.",
      difficulty: 2 + Number(form.text.includes("÷") || form.text.includes("−")),
    };
  },
};

/**
 * A number that makes an inequality true (6.EE.8). The others don't, and one
 * is the boundary itself, which only counts when the sign includes it.
 * @param {Rng} rng
 * @returns {Draft}
 */
function inequality(rng) {
  const c = rng.int(3, 20);
  const sign = rng.pick(["<", ">", "≤", "≥"]);
  /** @param {number} v */
  const holds = v => (sign === "<" ? v < c : sign === ">" ? v > c : sign === "≤" ? v <= c : v >= c);
  const pool = Array.from({ length: 13 }, (_, i) => c - 6 + i).filter(v => v >= 0);
  const yes = pool.filter(holds);
  const no = pool.filter(v => !holds(v));
  const boundaryWrong = !holds(c);
  return {
    prompt: `Which number makes x ${sign} ${c} true?`,
    answer: rng.pick(yes),
    wrong: rng.shuffle([...(boundaryWrong ? [c] : []), ...rng.shuffle(no.filter(v => v !== c))]),
    hint: sign === "<" || sign === ">" ? `${c} itself doesn't count: ${c} is not ${sign === "<" ? "less" : "greater"} than ${c}.` : `The line under the sign means ${c} itself counts too.`,
    difficulty: 2 + Number(sign === "≤" || sign === "≥"),
  };
}
