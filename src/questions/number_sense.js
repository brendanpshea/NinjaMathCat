// Counting and the order of numbers: how many, what comes next, skip counting,
// and which is bigger.

import { atGrade, wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/** Pictures to count. Each is a single, long-supported emoji. */
const OBJECTS = ["🍎", "⭐", "🐟", "🎈", "🐞", "🌼"];

/** @type {QuestionType} */
export const counting = {
  id: "counting",
  name: "Counting",
  generate(rng, grade) {
    const top = atGrade(grade, [[0, 5], [Infinity, 10]]); // K.CC.5
    const count = rng.int(1, top);
    return {
      prompt: "How many are there?",
      visual: { kind: "objects", emoji: rng.pick(OBJECTS), count },
      answer: count,
      wrong: wrongNumbers(rng, count, [count + 1, count - 1, count + 2, count - 2], { spread: 2, min: 1 }),
      hint: "Touch each one as you count it.",
      difficulty: 1 + Number(count > top / 2),
    };
  },
};

/** @type {QuestionType} */
export const sequence = {
  id: "sequence",
  name: "What comes next",
  generate(rng, grade) {
    const top = atGrade(grade, [[0, 10], [0.5, 20], [1, 100], [Infinity, 120]]); // K.CC.2, 1.NBT.1
    const after = grade < 0.5 || rng.chance(0.5);
    const n = after ? rng.int(0, top - 1) : rng.int(1, top);
    const answer = after ? n + 1 : n - 1;
    const step = after ? 1 : -1;
    return {
      prompt: `What number comes ${after ? "after" : "before"} ${n}?`,
      answer,
      // Going the wrong way, staying put, or going two.
      wrong: wrongNumbers(rng, answer, [n - step, n, n + 2 * step]),
      hint: after ? "Count up one." : "Count back one.",
      // Crossing into a new ten (29 → 30) is the hard part.
      difficulty: 1 + Number(Math.max(n, answer) % 10 === 0) + Number(n >= 20),
    };
  },
};

/**
 * How a grade skip-counts, as [step, highest number reached] pairs. A negative
 * step counts back. Tens to 100 in kindergarten (K.CC.1); 2s, 5s and 10s in
 * first grade; 5s, 10s and 100s within 1000 in second (2.NBT.2); multiples
 * that build the times tables in third (3.OA.9).
 * @type {readonly [number, [number, number][]][]}
 */
const SKIPS = [
  [0, [[10, 100]]],
  [0.5, [[10, 100], [2, 20]]],
  [1, [[2, 50], [5, 100], [10, 120]]],
  [1.5, [[2, 100], [5, 120], [10, 120], [-10, 120]]],
  [2, [[5, 1000], [10, 1000], [100, 1000], [-10, 1000]]],
  [2.5, [[5, 1000], [10, 1000], [25, 1000], [100, 1000], [-5, 1000], [-10, 1000], [-100, 1000]]],
  [Infinity, [[3, 60], [4, 80], [6, 120], [25, 1000], [50, 1000], [100, 1000], [-10, 1000], [-100, 1000]]],
];

/** @type {QuestionType} */
export const skipCounting = {
  id: "skip_counting",
  name: "Skip counting",
  generate(rng, grade) {
    const [step, upTo] = rng.pick(atGrade(grade, SKIPS));
    const size = Math.abs(step);
    // Starting anywhere ("43, 53, 63") is for tens and hundreds once children
    // can find ten more or less mentally (1.NBT.5); otherwise start on a multiple.
    const anyStart = grade >= 1.5 && (size === 10 || size === 100);
    const lowest = step > 0 ? 0 : 3 * size;
    const highest = step > 0 ? upTo - 3 * size : upTo;
    const start = anyStart
      ? rng.int(lowest, highest)
      : size * rng.int(Math.ceil(lowest / size), Math.floor(highest / size));
    const shown = [start, start + step, start + 2 * step];
    const answer = start + 3 * step;
    return {
      prompt: `What comes next? ${shown.join(", ")}, ?`,
      answer,
      // One step too far, the last number again, counting by ones, or a ten off.
      wrong: wrongNumbers(rng, answer, [answer + step, answer - step, answer + Math.sign(step), answer + 10, answer - 10]),
      hint: `Count ${step > 0 ? "up" : "back"} by ${size}s.`,
      difficulty: 1 + Number(step < 0) + Number(![2, 5, 10, 100].includes(size)),
    };
  },
};

/**
 * The numbers a grade compares: within 10 in kindergarten (K.CC.7), two-digit
 * numbers with >, = and < in first grade (1.NBT.3), three-digit in second (2.NBT.4).
 * @type {readonly [number, number][]}
 */
const COMPARE_UP_TO = [[0, 5], [0.5, 10], [1.5, 100], [Infinity, 1000]];

/** @type {QuestionType} */
export const comparison = {
  id: "comparison",
  name: "Comparing numbers",
  generate(rng, grade) {
    const top = atGrade(grade, COMPARE_UP_TO);

    // Kindergarten: no symbols yet, just "which is biggest?"
    if (grade < 1) {
      const numbers = rng.shuffle(Array.from({ length: top }, (_, i) => i + 1)).slice(0, 4);
      const biggest = rng.chance(0.5);
      const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
      return {
        prompt: `Which number is the ${biggest ? "biggest" : "smallest"}?`,
        answer,
        wrong: numbers.filter(n => n !== answer),
        hint: biggest ? "Which one do you say last when you count?" : "Which one do you say first when you count?",
        difficulty: 1,
      };
    }

    // From the middle of second grade, one side may be a sum to work out first.
    if (grade >= 2.5 && rng.chance(0.5)) {
      const a = rng.int(10, 99);
      const b = rng.int(2, 9);
      const sum = `(${a} + ${b})`;
      const op = rng.pick(["<", "=", ">"]);
      const other = op === "=" ? a + b : op === "<" ? a + b + rng.int(1, 5) : a + b - rng.int(1, 5);
      const wrongOps = ["<", "=", ">"].filter(o => o !== op);
      return {
        prompt: "Which is true?",
        answer: `${sum} ${op} ${other}`,
        wrong: [
          ...wrongOps.map(o => `${sum} ${o} ${other}`),
          op === "=" ? `${sum} = ${other + rng.int(1, 3)}` : `${other} ${op} ${sum}`,
        ],
        hint: "Work out the part in brackets first.",
        difficulty: 3,
      };
    }

    // Two numbers and a symbol. Half the time the digits are swapped (47 and 74),
    // so the tens have to be read, not just the ones.
    const a = rng.int(10, top);
    const reversed = Number(String(a).split("").reverse().join(""));
    let b = rng.chance(0.5) && reversed !== a && reversed <= top ? reversed : rng.int(10, top);
    if (b === a) b = a === top ? a - 1 : a + 1;
    const op = a > b ? ">" : "<";
    const flipped = op === ">" ? "<" : ">";
    return {
      prompt: "Which is true?",
      answer: `${a} ${op} ${b}`,
      wrong: [`${a} ${flipped} ${b}`, `${a} = ${b}`, `${b} ${op} ${a}`],
      hint: "The open side of < or > faces the bigger number.",
      difficulty: 1 + Number(Math.floor(a / 10) === Math.floor(b / 10)) + Number(top > 100),
    };
  },
};
