// Equal shares and fractions of a shape: halves and fourths in first grade
// (1.G.3), thirds too in second (2.G.3), all said in words; then written
// fractions with sixths and eighths in third (3.NF.1).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

/** @type {Record<number, [string, string]>} */
const PART_WORDS = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"] };

/**
 * A fraction in words, "two thirds", or as a number, "2/3".
 * @param {number} top
 * @param {number} bottom
 * @param {boolean} words
 */
export function fractionText(top, bottom, words) {
  return words ? `${NUMBER_WORDS[top]} ${PART_WORDS[bottom][top === 1 ? 0 : 1]}` : `${top}/${bottom}`;
}

/**
 * @type {readonly [number, { parts: number[], words: boolean, unitOnly: boolean }][]}
 */
const PLANS = [
  [1.5, { parts: [2, 4], words: true, unitOnly: true }],
  [2.5, { parts: [2, 3, 4], words: true, unitOnly: false }],
  [Infinity, { parts: [2, 3, 4, 6, 8], words: false, unitOnly: false }],
];

/** @type {QuestionType} */
export const fractions = {
  id: "fractions",
  name: "Fractions of a shape",
  generate(rng, grade) {
    const plan = atGrade(grade, PLANS);
    const parts = rng.pick(plan.parts);
    const shaded = plan.unitOnly ? 1 : rng.int(1, parts - 1);
    const model = rng.pick(/** @type {const} */ (["circle", "bar"]));
    const visual = /** @type {const} */ ({ kind: "fraction", model, parts, shaded });

    // First grade also counts the shares themselves.
    if (plan.unitOnly && rng.chance(0.4)) {
      return {
        prompt: "How many equal parts is the shape cut into?",
        visual,
        answer: parts,
        wrong: wrongNumbers(rng, parts, [parts + 1, parts - 1, 2 * parts, shaded], { min: 1 }),
        hint: "Touch each part as you count it.",
        difficulty: 1,
      };
    }

    // Wrong fractions a child might give: the unshaded part, shaded over
    // unshaded, upside down, one part out, or the wrong number of parts.
    // Never one that equals the answer, like 2/4 for 1/2.
    /** @type {[number, number][]} */
    const tempting = [
      [parts - shaded, parts],
      [shaded, parts - shaded],
      [parts, shaded],
      [shaded + 1, parts],
      [shaded - 1, parts],
      ...plan.parts.map(other => /** @type {[number, number]} */ ([shaded, other])),
      ...plan.parts.map(other => /** @type {[number, number]} */ ([1, other])),
    ];
    // Then, if those run short, any other fraction the grade could meet. In
    // words, only the parts the grade has learned: no "one third" in first grade.
    const others = plan.parts.flatMap(bottom => Array.from({ length: bottom }, (_, i) => /** @type {[number, number]} */ ([i + 1, bottom])));
    const wrong = [...rng.shuffle(tempting), ...rng.shuffle(others)].filter(([top, bottom]) =>
      top >= 1 && bottom >= 2 && top * parts !== shaded * bottom && (!plan.words || (plan.parts.includes(bottom) && top <= bottom)));

    return {
      // Children still learning to read hear "blue", the colour they see, not "shaded".
      prompt: plan.words ? "How much of the shape is blue?" : "What fraction of the shape is shaded?",
      visual,
      answer: fractionText(shaded, parts, plan.words),
      wrong: wrong.map(([top, bottom]) => fractionText(top, bottom, plan.words)),
      hint: plan.words ? "Count all the equal parts, then count the blue ones."
        : "The bottom number is how many equal parts. The top number is how many are shaded.",
      difficulty: plan.words ? 1 + Number(shaded > 1) : 2 + Number(parts >= 6),
    };
  },
};
