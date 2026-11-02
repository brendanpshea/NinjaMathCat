// Angles (4.MD.5-7, 4.G.1) and the coordinate plane (5.G.1-2, 6.NS.6, 6.NS.8,
// 6.G.3).

import { atGrade, formatNumber, wrongNumbers } from "./common.js";
import { gcd } from "./rational.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/** @type {readonly [number, string[]][]} */
const ANGLES = [
  [4, ["kind", "kind", "figure", "figure", "protractor", "turn"]],
  [Infinity, ["protractor", "protractor", "turn", "add", "kind", "figure"]],
];

/** @type {QuestionType} */
export const angles = {
  id: "angles",
  name: "Angles",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, ANGLES))) {
      case "kind": return angleKind(rng);
      case "protractor": return protractor(rng);
      case "figure": return figure(rng);
      case "turn": return turn(rng);
      default: return addAngles(rng);
    }
  },
};

/**
 * Wrong angle sizes in steps that suit the answer: tens near 120°, fives near
 * 135°. Near misses of a degree or two would give themselves away, since no
 * protractor mark is there.
 * @param {Rng} rng
 * @param {number} answer
 * @param {number[]} likely
 */
function wrongDegrees(rng, answer, likely) {
  const step = gcd(answer, 10);
  return wrongNumbers(rng, answer / step, likely.filter(n => n % step === 0).map(n => n / step), { min: 1 }).map(n => n * step);
}

/** @param {Rng} rng */
const base = rng => /** @type {"right" | "left"} */ (rng.pick(["right", "left"]));

/** What each figure of lines is called (4.G.1). */
export const FIGURES = {
  line: "a line", ray: "a ray", segment: "a line segment",
  parallel: "parallel lines", perpendicular: "perpendicular lines", intersecting: "intersecting lines",
};

/**
 * Naming a line, ray or segment, or a pair of lines (4.G.1). Perpendicular
 * lines intersect too, so "intersecting lines" is never a wrong answer for
 * them.
 * @param {Rng} rng
 * @returns {Draft}
 */
function figure(rng) {
  const shape = rng.pick(/** @type {const} */ (["line", "ray", "segment", "parallel", "perpendicular", "intersecting"]));
  const singles = /** @type {const} */ (["line", "ray", "segment"]);
  const pairs = /** @type {const} */ (["parallel", "perpendicular", "intersecting"]);
  const others = singles.includes(/** @type {any} */ (shape))
    ? [...singles.filter(s => s !== shape), rng.pick(pairs)]
    : [...pairs.filter(p => p !== shape && !(shape === "perpendicular" && p === "intersecting")), ...rng.shuffle([...singles]).slice(0, 2)];
  return {
    prompt: "What does this picture show?",
    visual: { kind: "lines", figure: shape, turn: 15 * rng.int(0, 11), ...(shape === "intersecting" ? { cross: rng.pick([45, 55, 65, 120, 130]) } : {}) },
    answer: FIGURES[shape],
    wrong: others.map(o => FIGURES[o]),
    hint: "An arrow means it goes on forever; a dot means it stops. Parallel lines never meet; perpendicular lines meet at a square corner.",
    difficulty: 1 + Number(!singles.includes(/** @type {any} */ (shape))),
  };
}

/**
 * Acute, right, obtuse or straight (4.G.1). Angles near a right angle are
 * left out, so the answer can be seen, not just guessed.
 * @param {Rng} rng
 * @returns {Draft}
 */
function angleKind(rng) {
  const [answer, degrees] = rng.pick([
    ["acute", rng.int(4, 14) * 5],
    ["acute", rng.int(4, 14) * 5],
    ["obtuse", rng.int(22, 32) * 5],
    ["obtuse", rng.int(22, 32) * 5],
    ["right", 90],
    ["straight", 180],
  ]);
  return {
    prompt: "What kind of angle is this?",
    visual: { kind: "angle", degrees: Number(degrees), base: base(rng), protractor: false },
    answer: String(answer),
    wrong: rng.shuffle(["acute", "right", "obtuse", "straight"].filter(k => k !== answer)),
    hint: "A right angle is a square corner. An acute angle is smaller than that, an obtuse one bigger, and a straight angle is a straight line.",
    difficulty: answer === "straight" ? 2 : 1,
  };
}

/**
 * Reading a protractor (4.MD.6). Reading the other scale is the mistake to
 * catch, so half the angles open from the left.
 * @param {Rng} rng
 * @returns {Draft}
 */
function protractor(rng) {
  const degrees = rng.int(2, 34) * 5;
  const side = base(rng);
  return {
    prompt: "Use the protractor. How many degrees is this angle?",
    visual: { kind: "angle", degrees, base: side, protractor: true },
    answer: degrees,
    // The other scale, or one mark out.
    wrong: wrongDegrees(rng, degrees, [180 - degrees, degrees + 10, degrees - 10]),
    hint: `Find the 0 where the bottom ray points, on the ${side}, and read up from it on that scale.`,
    difficulty: 1 + Number(degrees % 10 !== 0) + Number(side === "left"),
  };
}

/** Fractions of a full turn that come to whole degrees. */
const TURNS = [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 6], [5, 6], [1, 8], [3, 8], [1, 12], [1, 10], [1, 5]];

/**
 * Angles as turns: a full turn is 360 one-degree angles (4.MD.5).
 * @param {Rng} rng
 * @returns {Draft}
 */
function turn(rng) {
  if (rng.chance(0.6)) {
    const [n, d] = rng.pick(TURNS);
    const answer = (360 * n) / d;
    return {
      prompt: `A full turn is 360 degrees. How many degrees is ${n}/${d} of a full turn?`,
      answer,
      // The rest of the turn, one part only, or a turn of 100.
      wrong: wrongDegrees(rng, answer, [360 - answer, 360 / d, answer / 2, answer * 2, (100 * n) / d]),
      hint: `Split 360 into ${d} equal parts${n > 1 ? `, then take ${n} of them` : ""}.`,
      difficulty: n === 1 ? 1 : 2,
    };
  }
  const size = rng.pick([10, 15, 20, 30, 40, 45, 60, 72, 90, 120]);
  const answer = 360 / size;
  return {
    prompt: `How many ${size}° angles fit together to make a full turn?`,
    answer,
    wrong: wrongNumbers(rng, answer, [180 / size, answer * 2, 100 / size], { min: 1 }),
    hint: "A full turn is 360°. How many groups of that size make 360?",
    difficulty: 2,
  };
}

/**
 * Angles that make up a bigger one (4.MD.7).
 * @param {Rng} rng
 * @returns {Draft}
 */
function addAngles(rng) {
  const forms = [
    () => {
      const a = rng.int(2, 16) * 5;
      return { text: `Two angles together make a right angle. One of them is ${a}°. How many degrees is the other?`, answer: 90 - a, likely: [180 - a, a, 90 + a] };
    },
    () => {
      const a = rng.int(4, 32) * 5;
      return { text: `Two angles together make a straight angle. One of them is ${a}°. How many degrees is the other?`, answer: 180 - a, likely: [90 - a, 360 - a, a] };
    },
    () => {
      const [a, b] = [rng.int(2, 12) * 5, rng.int(2, 12) * 5];
      return { text: `An angle of ${a}° and an angle of ${b}° sit side by side, sharing a ray. How many degrees is the angle they make together?`, answer: a + b, likely: [Math.abs(a - b), 180 - a - b, a + b + 10] };
    },
    () => {
      const [a, b] = [rng.int(8, 20) * 5, rng.int(8, 20) * 5];
      return { text: `Three angles make a full turn. Two of them are ${a}° and ${b}°. How many degrees is the third?`, answer: 360 - a - b, likely: [180 - a - b, a + b, 360 - a] };
    },
  ];
  const { text, answer, likely } = rng.pick(forms)();
  return {
    prompt: text,
    answer,
    wrong: wrongDegrees(rng, answer, likely.filter(n => n > 0)),
    hint: "A right angle is 90°, a straight angle 180°, and a full turn 360°. The parts add up to the whole.",
    difficulty: 2,
  };
}

/**
 * A point, written as children write it: (3, 5), or (−2, 4).
 * @param {number} x
 * @param {number} y
 */
export function coordinateText(x, y) {
  return `(${formatNumber(x)}, ${formatNumber(y)})`;
}

/**
 * The grid a grade works on: the first quadrant in fifth grade (5.G.1-2),
 * all four in sixth (6.NS.6c, 6.NS.8).
 * @type {readonly [number, { min: number, max: number, kinds: string[] }][]}
 */
const GRIDS = [
  [5, { min: 0, max: 8, kinds: ["read", "read", "find", "find"] }],
  [5.5, { min: 0, max: 10, kinds: ["read", "find", "distance"] }],
  [Infinity, { min: -6, max: 6, kinds: ["read", "find", "distance", "distance", "reflect", "rectangle", "rectangle"] }],
];

const LABELS = ["A", "B", "C", "D"];

/** @type {QuestionType} */
export const coordinates = {
  id: "coordinates",
  name: "The coordinate plane",
  generate(rng, grade) {
    const grid = atGrade(grade, GRIDS);
    switch (rng.pick(grid.kinds)) {
      case "read": return readPoint(rng, grid);
      case "find": return findPoint(rng, grid);
      case "distance": return distance(rng, grid);
      case "rectangle": return rectangle(rng);
      default: return reflect(rng);
    }
  },
};

/** @typedef {{ min: number, max: number }} Grid */

/**
 * Four points spread out on a grid, so their labels never crowd: the first
 * with different numbers across and up, and the second, if `swapped`, at the
 * first with its numbers swapped.
 * @param {Rng} rng
 * @param {Grid} grid
 * @param {boolean} swapped
 */
function spreadPoints(rng, grid, swapped) {
  for (;;) {
    const at = () => ({ x: rng.int(grid.min, grid.max - 1), y: rng.int(grid.min, grid.max - 1) });
    const first = at();
    if (Math.abs(first.x - first.y) < 2 || first.x === 0 && first.y === 0) continue;
    const found = [first];
    if (swapped) found.push({ x: first.y, y: first.x });
    for (let tries = 0; found.length < 4 && tries < 50; tries++) {
      const p = at();
      if (found.every(q => Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) >= 2)) found.push(p);
    }
    if (found.length === 4) return found;
  }
}

/**
 * Hints for reading points.
 * @param {Grid} grid
 */
function readingHint(grid) {
  return grid.min < 0
    ? "The first number goes across and the second goes up; left of 0 or below it, the number is negative."
    : "The first number says how far across, along the bottom; the second says how far up.";
}

/**
 * @param {Rng} rng
 * @param {Grid} grid
 * @returns {Draft}
 */
function readPoint(rng, grid) {
  const found = spreadPoints(rng, grid, false);
  const labels = rng.shuffle(LABELS);
  const { x, y } = found[0];
  const near = rng.shuffle([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]);
  const signs = grid.min < 0 ? rng.shuffle([[-x, y], [x, -y]]) : [];
  return {
    prompt: `What are the coordinates of point ${labels[0]}?`,
    visual: { kind: "coordinates", min: grid.min, max: grid.max, points: found.map((p, i) => ({ ...p, label: labels[i] })) },
    answer: coordinateText(x, y),
    // Across and up swapped, a sign lost, or one square out.
    wrong: [[y, x], ...signs, ...near]
      .filter(([a, b]) => a >= grid.min && b >= grid.min && (a !== x || b !== y))
      .map(([a, b]) => coordinateText(a, b)),
    hint: readingHint(grid),
    difficulty: 1 + Number(grid.min < 0) + Number(x === 0 || y === 0),
  };
}

/**
 * @param {Rng} rng
 * @param {Grid} grid
 * @returns {Draft}
 */
function findPoint(rng, grid) {
  const found = spreadPoints(rng, grid, true);
  const labels = rng.shuffle(LABELS);
  const { x, y } = found[0];
  return {
    prompt: `Which point is at ${coordinateText(x, y)}?`,
    visual: { kind: "coordinates", min: grid.min, max: grid.max, points: found.map((p, i) => ({ ...p, label: labels[i] })) },
    answer: labels[0],
    // The point with the numbers swapped first.
    wrong: labels.slice(1),
    hint: readingHint(grid),
    difficulty: 1 + Number(grid.min < 0),
  };
}

/**
 * The distance between two points level with each other (5.G.2, 6.NS.8).
 * In sixth grade they are given as numbers, often either side of an axis,
 * where the distance is the two sizes added.
 * @param {Rng} rng
 * @param {Grid} grid
 * @returns {Draft}
 */
function distance(rng, grid) {
  const fixed = rng.int(grid.min < 0 ? -5 : 1, 5);
  let [a, b] = [0, 0];
  while (Math.abs(a - b) < 2 || a === 0 || b === 0) {
    [a, b] = grid.min < 0 && rng.chance(0.6)
      ? [-rng.int(1, 6), rng.int(1, 6)]
      : [rng.int(Math.max(grid.min, 1), grid.max - 1), rng.int(Math.max(grid.min, 1), grid.max - 1)];
  }
  if (rng.chance(0.5)) [a, b] = [b, a];
  const across = rng.chance(0.5);
  const [p, q] = across ? [{ x: a, y: fixed }, { x: b, y: fixed }] : [{ x: fixed, y: a }, { x: fixed, y: b }];
  const answer = Math.abs(a - b);
  const sizes = Math.abs(Math.abs(a) - Math.abs(b));
  // Taking the sizes away across 0, or adding them on one side of it.
  const likely = [sizes, Math.abs(a) + Math.abs(b), Math.max(Math.abs(a), Math.abs(b))].filter(n => n !== answer);
  if (grid.min < 0) {
    return {
      prompt: `Point A is at ${coordinateText(p.x, p.y)} and point B is at ${coordinateText(q.x, q.y)}. How many units apart are they?`,
      answer,
      wrong: wrongNumbers(rng, answer, likely, { min: 1 }),
      hint: Math.sign(a) === Math.sign(b)
        ? "They are on the same side of 0, so take the smaller distance from 0 away from the bigger."
        : "They are on opposite sides of 0: add how far each is from 0.",
      difficulty: Math.sign(a) === Math.sign(b) ? 2 : 3,
    };
  }
  return {
    prompt: "How many units apart are points A and B?",
    visual: { kind: "coordinates", min: grid.min, max: grid.max, points: [{ ...p, label: "A" }, { ...q, label: "B" }] },
    answer,
    wrong: wrongNumbers(rng, answer, likely, { min: 1 }),
    hint: `They are level with each other, so count the squares ${across ? "across" : "up"} from one to the other.`,
    difficulty: 2,
  };
}

/**
 * A rectangle drawn across the quadrants: its perimeter or area from the
 * coordinates of its corners, or its missing corner (6.G.3).
 * @param {Rng} rng
 * @returns {Draft}
 */
function rectangle(rng) {
  /** Two numbers from -5 to 5, at least 2 apart, usually either side of 0. */
  const span = () => {
    for (;;) {
      const [a, b] = [rng.int(-5, 5), rng.int(-5, 5)];
      if (Math.abs(a - b) >= 2 && (a * b < 0 || rng.chance(0.25))) return [Math.min(a, b), Math.max(a, b)];
    }
  };
  const [[left, right], [bottom, top]] = [span(), span()];
  const [w, h] = [right - left, top - bottom];
  const corners = [{ x: left, y: top, label: "A" }, { x: right, y: top, label: "B" }, { x: right, y: bottom, label: "C" }, { x: left, y: bottom, label: "D" }];
  const kind = rng.pick(["perimeter", "area", "corner"]);
  if (kind === "corner") {
    const [a, b, c] = corners;
    const answer = coordinateText(left, bottom);
    return {
      prompt: `Three corners of a rectangle are at ${coordinateText(a.x, a.y)}, ${coordinateText(b.x, b.y)} and ${coordinateText(c.x, c.y)}. Where is the fourth corner?`,
      answer,
      // The numbers swapped, a sign lost, or a corner already given.
      wrong: [coordinateText(bottom, left), coordinateText(-left, bottom), coordinateText(left, -bottom), coordinateText(right, top)].filter(t => t !== answer),
      hint: "The fourth corner lines up with one corner across and with another up and down. Sketch it on a grid.",
      difficulty: 3,
    };
  }
  // Lengths found by taking the sizes away, the mistake when a side crosses an axis.
  const slip = Math.abs(Math.abs(right) - Math.abs(left)) || w + 1;
  const slipUp = Math.abs(Math.abs(top) - Math.abs(bottom)) || h + 1;
  const perimeter = kind === "perimeter";
  const answer = perimeter ? 2 * (w + h) : w * h;
  return {
    prompt: `What is the ${perimeter ? "perimeter" : "area"} of rectangle ABCD, in ${perimeter ? "units" : "square units"}?`,
    visual: { kind: "coordinates", min: -6, max: 6, points: corners, shape: true },
    answer,
    wrong: wrongNumbers(rng, answer, perimeter ? [w * h, w + h, 2 * (slip + slipUp)] : [2 * (w + h), slip * slipUp, w * h + w], { min: 1 }),
    hint: `Find each side from the coordinates: from ${formatNumber(left)} to ${formatNumber(right)} across, and from ${formatNumber(bottom)} to ${formatNumber(top)} up.`,
    difficulty: 3,
  };
}

/**
 * A point reflected across an axis (6.NS.6b).
 * @param {Rng} rng
 * @returns {Draft}
 */
function reflect(rng) {
  let [x, y] = [0, 0];
  while (x === 0 || y === 0 || Math.abs(x) === Math.abs(y)) [x, y] = [rng.int(-6, 6), rng.int(-6, 6)];
  const overX = rng.chance(0.5);
  const answer = overX ? coordinateText(x, -y) : coordinateText(-x, y);
  return {
    prompt: `Point P is at ${coordinateText(x, y)}. Where is it after a reflection across the ${overX ? "x" : "y"}-axis?`,
    answer,
    // Across the other axis, both, or the numbers swapped.
    wrong: [overX ? coordinateText(-x, y) : coordinateText(x, -y), coordinateText(-x, -y), coordinateText(y, x)],
    hint: overX
      ? "Reflecting across the x-axis flips the point up or down: the second number changes sign."
      : "Reflecting across the y-axis flips the point left or right: the first number changes sign.",
    difficulty: 2,
  };
}
