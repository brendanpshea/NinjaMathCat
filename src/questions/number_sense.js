// Counting and the order of numbers: how many, what comes next, skip counting,
// and which is bigger.

import { atGrade, wrongNumbers, formatNumber as fmt } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/** Pictures to count. Each is a single, long-supported emoji. */
const OBJECTS = ["🍎", "⭐", "🐟", "🎈", "🐞", "🌼"];

/** @type {QuestionType} */
export const counting = {
  id: "counting",
  name: "Counting",
  generate(rng, grade) {
    if (rng.chance(0.3)) return sortAndCount(rng);
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

/**
 * A row of things of four kinds, mixed up: how many of one kind, or which
 * kind there is the most of (K.MD.3).
 * @param {import("../rng.js").Rng} rng
 * @returns {import("./common.js").Draft}
 */
function sortAndCount(rng) {
  const kinds = rng.shuffle(OBJECTS).slice(0, 4);
  // Different counts, so one kind is the most.
  const counts = rng.shuffle([1, 2, 3, 4]);
  const items = rng.shuffle(kinds.flatMap((k, i) => Array(counts[i]).fill(k)));
  if (rng.chance(0.5)) {
    const i = rng.int(0, 3);
    return {
      prompt: `How many ${kinds[i]} are there?`,
      visual: { kind: "pattern", items },
      answer: counts[i],
      // Everything counted, or one out.
      wrong: wrongNumbers(rng, counts[i], [items.length, counts[i] + 1, counts[i] - 1, counts[i] + 2].filter(n => n !== counts[i]), { min: 1 }),
      hint: `Touch each ${kinds[i]} as you count it, and skip the others.`,
      difficulty: 1,
    };
  }
  const most = counts.indexOf(Math.max(...counts));
  return {
    prompt: "Which is there the most of?",
    visual: { kind: "pattern", items },
    answer: kinds[most],
    wrong: kinds.filter((_, i) => i !== most),
    hint: "Count each kind. Which count is the biggest?",
    difficulty: 2,
  };
}

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
 * that build the times tables in third (3.OA.9); and in fourth, patterns that
 * follow a rule, starting anywhere (4.OA.5).
 * @type {readonly [number, [number, number][]][]}
 */
const SKIPS = [
  [0, [[10, 100]]],
  [0.5, [[10, 100], [2, 20]]],
  [1, [[2, 50], [5, 100], [10, 120]]],
  [1.5, [[2, 100], [5, 120], [10, 120], [-10, 120]]],
  [2, [[5, 1000], [10, 1000], [100, 1000], [-10, 1000]]],
  [2.5, [[5, 1000], [10, 1000], [25, 1000], [100, 1000], [-5, 1000], [-10, 1000], [-100, 1000]]],
  [3, [[3, 60], [4, 80], [6, 120], [25, 1000], [50, 1000], [100, 1000], [-10, 1000], [-100, 1000]]],
  [3.5, [[7, 140], [8, 160], [9, 180], [25, 1000], [50, 1000], [-25, 1000]]],
  [Infinity, [[11, 300], [12, 300], [15, 600], [75, 3000], [250, 10000], [-50, 5000], [-25, 1000]]],
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
    const anyStart = grade >= 4 || (grade >= 1.5 && (size === 10 || size === 100));
    const lowest = step > 0 ? 0 : 3 * size;
    const highest = step > 0 ? upTo - 3 * size : upTo;
    const start = anyStart
      ? rng.int(lowest, highest)
      : size * rng.int(Math.ceil(lowest / size), Math.floor(highest / size));
    const shown = [start, start + step, start + 2 * step];
    const answer = start + 3 * step;
    return {
      prompt: `What comes next? ${shown.map(fmt).join(", ")}, ?`,
      answer,
      // One step too far, the last number again, counting by ones, or a ten off.
      // Near misses go in steps of the count, so counting by tens never offers 28.
      wrong: wrongNumbers(rng, answer, [answer + step, answer - step, answer + Math.sign(step), answer + 10, answer - 10], { step: size }),
      hint: grade >= 4 ? "Find the rule: how much does each number go up or down by?" : `Count ${step > 0 ? "up" : "back"} by ${size}s.`,
      difficulty: 1 + Number(step < 0) + Number(![2, 5, 10, 100].includes(size)),
    };
  },
};

/**
 * The numbers a grade compares: within 10 in kindergarten (K.CC.7), two-digit
 * numbers with >, = and < in first grade (1.NBT.3), three-digit in second
 * (2.NBT.4), and up to a million in fourth (4.NBT.2).
 * @type {readonly [number, number][]}
 */
const COMPARE_UP_TO = [[0, 5], [0.5, 10], [1.5, 100], [3, 1000], [3.5, 10000], [Infinity, 1000000]];

/**
 * The number with two neighbouring digits swapped (452,318 → 425,318), or
 * null if every swap would leave it the same or start it with a zero.
 * @param {import("../rng.js").Rng} rng
 * @param {number} n
 */
function swapNeighbours(rng, n) {
  const digits = String(n).split("");
  const places = digits.slice(0, -1).map((_, i) => i).filter(i => digits[i] !== digits[i + 1] && !(i === 0 && digits[1] === "0"));
  if (places.length === 0) return null;
  const i = rng.pick(places);
  [digits[i], digits[i + 1]] = [digits[i + 1], digits[i]];
  return Number(digits.join(""));
}

/** Animals to put in groups, by name and picture. */
const ANIMALS = [["cats", "🐱"], ["dogs", "🐶"], ["bunnies", "🐰"], ["frogs", "🐸"], ["fish", "🐟"], ["birds", "🐦"]];

/**
 * Three groups in rows, lined up so they can be matched one to one: which
 * has the most or the fewest, or which two have the same number (K.CC.6).
 * @param {import("../rng.js").Rng} rng
 * @param {number} top  the most in a group
 * @returns {import("./common.js").Draft}
 */
function compareGroups(rng, top) {
  const animals = rng.shuffle(ANIMALS).slice(0, 3);
  const numbers = rng.shuffle(Array.from({ length: top }, (_, i) => i + 1));
  const same = rng.chance(1 / 3);
  const counts = same ? rng.shuffle([numbers[0], numbers[0], numbers[1]]) : numbers.slice(0, 3);
  const visual = /** @type {const} */ ({ kind: "groups", rows: animals.map(([name, emoji], i) => ({ name, emoji, count: counts[i] })) });
  const names = animals.map(([name]) => `the ${name}`);
  if (same) {
    const pairs = [[0, 1], [0, 2], [1, 2]];
    const match = pairs.find(([i, j]) => counts[i] === counts[j]);
    const say = (/** @type {number[]} */ [i, j]) => `${names[i]} and ${names[j]}`;
    return {
      prompt: "Which two groups have the same number?",
      visual,
      answer: say(/** @type {number[]} */ (match)),
      wrong: [...pairs.filter(p => p !== match).map(say), "none of them"],
      hint: "Match them up, one from each row. Two rows that match with none left over have the same number.",
      difficulty: 1,
    };
  }
  const most = rng.chance(0.5);
  const target = most ? Math.max(...counts) : Math.min(...counts);
  return {
    prompt: `Which group has the ${most ? "most" : "fewest"}?`,
    visual,
    answer: names[counts.indexOf(target)],
    wrong: [...names.filter((_, i) => counts[i] !== target), "They all have the same number."],
    hint: most ? "Match them up, one from each row. The row with some left over at the end has more." : "Match them up, one from each row. The row that runs out first has fewer.",
    difficulty: 1,
  };
}

/** @type {QuestionType} */
export const comparison = {
  id: "comparison",
  name: "Comparing numbers",
  generate(rng, grade) {
    const top = atGrade(grade, COMPARE_UP_TO);

    // Kindergarten: groups of things to compare by matching (K.CC.6).
    if (grade < 1 && rng.chance(0.5)) return compareGroups(rng, top);

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

    // Two numbers and a symbol. Half the time the digits are swapped (47 and
    // 74), so the tens have to be read, not just the ones; big numbers differ
    // by two neighbouring digits, so every place has to be read.
    const a = rng.int(10, top);
    const reversed = Number(String(a).split("").reverse().join(""));
    const lookalike = top > 1000 ? swapNeighbours(rng, a) : reversed;
    let b = (top > 1000 || rng.chance(0.5)) && lookalike !== null && lookalike !== a && lookalike <= top ? lookalike : rng.int(10, top);
    if (b === a) b = a === top ? a - 1 : a + 1;
    const op = a > b ? ">" : "<";
    const flipped = op === ">" ? "<" : ">";
    const [x, y] = [fmt(a), fmt(b)];
    return {
      prompt: "Which is true?",
      answer: `${x} ${op} ${y}`,
      wrong: [`${x} ${flipped} ${y}`, `${x} = ${y}`, `${y} ${op} ${x}`],
      hint: top > 1000 ? "Compare the digits place by place, starting from the biggest place." : "The open side of < or > faces the bigger number.",
      difficulty: Math.min(3, 1 + Number(Math.floor(a / 10) === Math.floor(b / 10)) + Number(top > 100) + Number(top > 10000)),
    };
  },
};
