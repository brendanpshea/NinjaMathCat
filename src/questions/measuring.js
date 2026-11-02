// Measuring length, from kindergarten to 2nd grade: which ribbon is longest
// (K.MD.2); putting three in order, and comparing two by way of a third
// (1.MD.1); measuring with cubes laid end to end (1.MD.2); reading a ruler
// (2.MD.1); what measuring in two units shows (2.MD.2); good estimates
// (2.MD.3); how much longer one length is than another (2.MD.4); and length
// stories within 100 (2.MD.5).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { Draft, QuestionType, Lengths } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/** @typedef {Lengths["ribbons"][number]["color"]} Color */

/** @type {readonly Color[]} */
const COLORS = ["red", "blue", "green", "orange"];

/**
 * What a point in the year measures: comparing in kindergarten, ordering and
 * counting cubes in first grade, and rulers, estimates and stories in second.
 * @type {readonly [number, string[]][]}
 */
const MEASURING = [
  [0.5, ["longest"]],
  [1.5, ["order", "order", "through", "cubes", "cubes"]],
  [Infinity, ["ruler", "ruler", "longer", "twoUnits", "estimate", "story", "story"]],
];

/** @type {QuestionType} */
export const measuring = {
  id: "measuring",
  name: "Measuring length",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, MEASURING))) {
      case "longest": return longest(rng);
      case "order": return order(rng);
      case "through": return through(rng);
      case "cubes": return cubes(rng);
      case "ruler": return ruler(rng);
      case "longer": return longer(rng);
      case "twoUnits": return twoUnits(rng);
      case "estimate": return estimate(rng);
      default: return story(rng);
    }
  },
};

/**
 * Different lengths, one for each ribbon.
 * @param {Rng} rng
 * @param {number} count
 * @param {number} most
 */
function distinctLengths(rng, count, most) {
  return rng.shuffle(Array.from({ length: most - 1 }, (_, i) => i + 2)).slice(0, count);
}

/**
 * The longest or shortest of four ribbons (K.MD.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function longest(rng) {
  const lengths = distinctLengths(rng, 4, 11);
  const colors = rng.shuffle(COLORS);
  const most = rng.chance(0.5);
  const pick = lengths.indexOf(most ? Math.max(...lengths) : Math.min(...lengths));
  return {
    prompt: `Which ribbon is the ${most ? "longest" : "shortest"}?`,
    visual: { kind: "lengths", ribbons: colors.map((color, i) => ({ color, from: 0, length: lengths[i] })), ruler: null, cubes: false, span: 12 },
    answer: `the ${colors[pick]} ribbon`,
    wrong: colors.filter((_, i) => i !== pick).map(c => `the ${c} ribbon`),
    hint: `The ribbons all start at the same place. Look at where each one ends.`,
    difficulty: 1,
  };
}

/**
 * Three ribbons in order of length (1.MD.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function order(rng) {
  const lengths = distinctLengths(rng, 3, 11);
  const colors = rng.shuffle(COLORS).slice(0, 3);
  const upward = rng.chance(0.5);
  const sorted = colors.map((c, i) => ({ c, n: lengths[i] })).sort((a, b) => (upward ? a.n - b.n : b.n - a.n)).map(x => x.c);
  const answer = sorted.join(", ");
  // The order turned round, or two swapped.
  const wrong = [
    [...sorted].reverse(),
    [sorted[1], sorted[0], sorted[2]],
    [sorted[0], sorted[2], sorted[1]],
    [sorted[2], sorted[0], sorted[1]],
  ].map(o => o.join(", ")).filter(o => o !== answer);
  return {
    prompt: `Which puts the ribbons in order from ${upward ? "shortest to longest" : "longest to shortest"}?`,
    visual: { kind: "lengths", ribbons: colors.map((color, i) => ({ color, from: 0, length: lengths[i] })), ruler: null, cubes: false, span: 12 },
    answer,
    wrong: rng.shuffle(wrong),
    hint: `Find the ${upward ? "shortest" : "longest"} ribbon first. That one comes first in the list.`,
    difficulty: 2,
  };
}

/**
 * Two lengths compared by way of a third (1.MD.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function through(rng) {
  const [a, b, c] = rng.shuffle(COLORS);
  const most = rng.chance(0.5);
  return {
    prompt: `The ${a} ribbon is longer than the ${b} ribbon. The ${b} ribbon is longer than the ${c} ribbon. Which ribbon is the ${most ? "longest" : "shortest"}?`,
    answer: `the ${most ? a : c} ribbon`,
    wrong: rng.shuffle([`the ${most ? c : a} ribbon`, `the ${b} ribbon`, "You can't tell"]),
    hint: `If ${a} is longer than ${b}, and ${b} is longer than ${c}, then ${a} is longer than ${c} too.`,
    difficulty: 2,
  };
}

/**
 * How many cubes long a ribbon is, with cubes laid end to end along it (1.MD.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function cubes(rng) {
  const length = rng.int(3, 10);
  return {
    prompt: "How many cubes long is the ribbon?",
    visual: { kind: "lengths", ribbons: [{ color: rng.pick(COLORS), from: 0, length }], ruler: null, cubes: true, span: 12 },
    answer: length,
    wrong: wrongNumbers(rng, length, [length + 1, length - 1, length + 2, length - 2], { min: 1, spread: 2 }),
    hint: "Count the cubes from one end of the ribbon to the other.",
    difficulty: 1 + Number(length > 6),
  };
}

/**
 * A ribbon on a ruler, sometimes not starting at 0, where reading the mark
 * at its end is the mistake to catch (2.MD.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function ruler(rng) {
  const units = rng.pick(/** @type {const} */ (["inches", "centimeters"]));
  const span = units === "inches" ? 12 : 15;
  const length = rng.int(2, span - 4);
  const from = rng.chance(0.4) ? rng.int(1, span - length) : 0;
  return {
    prompt: `How long is the ribbon, in ${units}?`,
    visual: { kind: "lengths", ribbons: [{ color: rng.pick(COLORS), from, length }], ruler: units, cubes: false, span },
    answer: length,
    // The number at the end, or one out.
    wrong: wrongNumbers(rng, length, [from > 0 ? from + length : length + 2, length + 1, length - 1, from > 0 ? from : length - 2].filter(n => n !== length), { min: 1 }),
    hint: from > 0 ? `The ribbon starts at ${from}, not at 0. Count the spaces from where it starts to where it ends.` : "The ribbon starts at 0. Read the number where it ends.",
    difficulty: from > 0 ? 3 : 1,
  };
}

/**
 * How much longer one ribbon is than another, on a ruler (2.MD.4).
 * @param {Rng} rng
 * @returns {Draft}
 */
function longer(rng) {
  const units = rng.pick(/** @type {const} */ (["inches", "centimeters"]));
  const span = units === "inches" ? 12 : 15;
  const [a, b] = distinctLengths(rng, 2, span).sort((x, y) => y - x);
  const [long, short] = rng.shuffle(COLORS);
  const answer = a - b;
  return {
    prompt: `How much longer is the ${long} ribbon than the ${short} ribbon, in ${units}?`,
    visual: { kind: "lengths", ribbons: rng.shuffle([{ color: long, from: 0, length: a }, { color: short, from: 0, length: b }]), ruler: units, cubes: false, span },
    answer,
    // One length, both added, or one out.
    wrong: wrongNumbers(rng, answer, [a, b, a + b, answer + 1, answer - 1].filter(n => n !== answer), { min: 1 }),
    hint: `Read both lengths, then take the shorter from the longer.`,
    difficulty: 2,
  };
}

/**
 * What measuring one thing in two units shows: the longer unit takes fewer (2.MD.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function twoUnits(rng) {
  if (rng.chance(0.5)) {
    // Units, and things of a size to measure with them.
    const [big, small, things] = rng.pick([["paper clip", "cube", ["book", "notebook"]], ["pencil", "paper clip", ["desk", "table"]], ["shoe", "pencil", ["rug", "hallway"]]]);
    const few = rng.int(2, 5);
    const many = few * rng.int(2, 3) + rng.int(0, 1);
    const thing = rng.pick(things);
    return {
      prompt: `Lena measures a ${thing}. It is ${few} ${big}s long, and ${many} ${small}s long. Which is longer, a ${big} or a ${small}?`,
      answer: `a ${big}`,
      wrong: rng.shuffle([`a ${small}`, "They are the same length", "You can't tell"]),
      hint: "The longer the unit, the fewer it takes to cover the same length.",
      difficulty: 2,
    };
  }
  const [small, big, thing] = rng.pick([["inches", "feet", "her desk"], ["centimeters", "meters", "the classroom"], ["inches", "feet", "a rug"]]);
  return {
    prompt: `Lena measures ${thing} in ${small}, and then in ${big}. Which number will be bigger?`,
    answer: `the number of ${small}`,
    wrong: rng.shuffle([`the number of ${big}`, "They will be the same", "You can't tell"]),
    hint: `${small[0].toUpperCase()}${small.slice(1)} are smaller, so it takes more of them.`,
    difficulty: 2,
  };
}

/**
 * Things a child knows the size of, for estimating (2.MD.3).
 * @type {readonly { thing: string, way: string, n: number, unit: string, wrong: string[] }[]}
 */
const SIZES = [
  { thing: "a pencil", way: "long", n: 7, unit: "inches", wrong: ["7 feet", "7 yards", "70 inches"] },
  { thing: "a crayon", way: "long", n: 4, unit: "inches", wrong: ["4 feet", "4 yards", "40 inches"] },
  { thing: "a door", way: "tall", n: 7, unit: "feet", wrong: ["7 inches", "7 centimeters", "70 feet"] },
  { thing: "a bed", way: "long", n: 6, unit: "feet", wrong: ["6 inches", "60 feet", "6 centimeters"] },
  { thing: "a paper clip", way: "long", n: 3, unit: "centimeters", wrong: ["3 meters", "30 centimeters", "3 feet"] },
  { thing: "an eraser", way: "long", n: 5, unit: "centimeters", wrong: ["5 meters", "50 centimeters", "5 feet"] },
  { thing: "a car", way: "long", n: 4, unit: "meters", wrong: ["4 centimeters", "40 meters", "4 inches"] },
  { thing: "a basketball hoop", way: "high", n: 3, unit: "meters", wrong: ["3 centimeters", "30 meters", "3 inches"] },
];

/**
 * @param {Rng} rng
 * @returns {Draft}
 */
function estimate(rng) {
  const s = rng.pick(SIZES);
  return {
    prompt: `About how ${s.way} is ${s.thing}?`,
    answer: `${s.n} ${s.unit}`,
    wrong: rng.shuffle(s.wrong),
    hint: "Think of a ruler: about 12 inches, or 30 centimeters. Is it shorter or longer than that?",
    difficulty: 1,
  };
}

const NAMES = ["Ana", "Ben", "Kai", "Mia", "Leo", "Zoe", "Sam", "Ivy"];

/**
 * Adding and taking away lengths in a story, within 100 (2.MD.5).
 * @param {Rng} rng
 * @returns {Draft}
 */
function story(rng) {
  const [name, friend] = rng.shuffle(NAMES);
  const units = rng.pick(["centimeters", "inches", "feet", "meters"]);
  const small = units === "centimeters" || units === "inches";
  if (rng.chance(0.4)) {
    const [a, b] = [rng.int(12, 60), rng.int(11, 39)];
    return {
      prompt: small
        ? `${name} lays two ribbons end to end. One is ${a} ${units} long and the other is ${b} ${units}. How long are they together, in ${units}?`
        : `A fence is made of two parts laid end to end. One is ${a} ${units} long and the other is ${b} ${units}. How long is the fence, in ${units}?`,
      answer: a + b,
      wrong: wrongNumbers(rng, a + b, [a - b, a + b + 10, a + b - 10, a + b + 1].filter(n => n > 0 && n !== a + b), { min: 1 }),
      hint: "End to end, the lengths add up.",
      difficulty: 2,
    };
  }
  const a = rng.int(30, 95);
  const b = rng.int(11, a - 6);
  const stories = [
    `A rope is ${a} ${units} long. ${name} cuts off ${b} ${units}. How long is the rope now, in ${units}?`,
    `${name}'s sunflower is ${a} centimeters tall. ${friend}'s sunflower is ${b} centimeters tall. How much taller is ${name}'s sunflower, in centimeters?`,
    `A path is ${a} ${units} long. ${name} has walked ${b} ${units} of it. How many more ${units} are there to the end?`,
  ];
  return {
    prompt: rng.pick(stories),
    answer: a - b,
    // Adding instead, or a ten out.
    wrong: wrongNumbers(rng, a - b, [a + b, a - b + 10, a - b - 10, a - b + 1].filter(n => n > 0 && n !== a - b), { min: 1 }),
    hint: "Take the shorter length from the longer one.",
    difficulty: 2,
  };
}
