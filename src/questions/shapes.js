// Flat shapes: naming them, counting sides and corners, and what is true of them.

import { atGrade, wrongNumbers } from "./common.js";

/** @import { QuestionType } from "./common.js" */

/**
 * The facts describe each shape as the UI draws it: the triangle equilateral,
 * the hexagon and pentagon and octagon regular, the trapezoid isosceles, the
 * rectangle and rhombus not squares.
 * @typedef {object} Shape
 * @property {string} id  also its name
 * @property {number} sides  straight sides
 * @property {number} corners
 * @property {number} rightAngles
 * @property {number} parallelPairs
 * @property {boolean} equalSides  every straight side the same length
 */

/** @type {readonly Shape[]} */
export const SHAPES = [
  { id: "circle", sides: 0, corners: 0, rightAngles: 0, parallelPairs: 0, equalSides: false },
  { id: "triangle", sides: 3, corners: 3, rightAngles: 0, parallelPairs: 0, equalSides: true },
  { id: "square", sides: 4, corners: 4, rightAngles: 4, parallelPairs: 2, equalSides: true },
  { id: "rectangle", sides: 4, corners: 4, rightAngles: 4, parallelPairs: 2, equalSides: false },
  { id: "hexagon", sides: 6, corners: 6, rightAngles: 0, parallelPairs: 3, equalSides: true },
  { id: "trapezoid", sides: 4, corners: 4, rightAngles: 0, parallelPairs: 1, equalSides: false },
  { id: "pentagon", sides: 5, corners: 5, rightAngles: 0, parallelPairs: 0, equalSides: true },
  { id: "octagon", sides: 8, corners: 8, rightAngles: 0, parallelPairs: 4, equalSides: true },
  { id: "rhombus", sides: 4, corners: 4, rightAngles: 0, parallelPairs: 2, equalSides: true },
];

/** @param {string} id */
export function shapeById(id) {
  const shape = SHAPES.find(s => s.id === id);
  if (!shape) throw new RangeError(`No shape called ${id}`);
  return shape;
}

/**
 * The shapes a grade knows: circles, triangles, squares, rectangles and
 * hexagons in kindergarten (K.G.2); trapezoids in first grade (1.G.2);
 * pentagons and octagons in second (2.G.1); rhombuses in third (3.G.1).
 * @type {readonly [number, string[]][]}
 */
const SHAPES_AT = [
  [0, ["circle", "triangle", "square", "rectangle"]],
  [1, ["circle", "triangle", "square", "rectangle", "hexagon"]],
  [1.5, ["circle", "triangle", "square", "rectangle", "hexagon", "trapezoid"]],
  [2, ["circle", "triangle", "square", "rectangle", "hexagon", "trapezoid", "pentagon"]],
  [2.5, ["circle", "triangle", "square", "rectangle", "hexagon", "trapezoid", "pentagon", "octagon"]],
  [Infinity, SHAPES.map(s => s.id)],
];

/** What any shape with this many sides is called (2.G.1). */
export const NAMES_BY_SIDES = new Map([[3, "triangle"], [4, "quadrilateral"], [5, "pentagon"], [6, "hexagon"], [8, "octagon"]]);

/** @typedef {{ text: string, test: (s: Shape) => boolean, about?: (s: Shape) => boolean }} Trait */

/**
 * Things that can be said about a shape, each with a test of whether it is
 * true. `about` limits a trait to shapes where saying it makes sense; asking
 * whether a hexagon has "2 pairs" of parallel sides, when it has 3, would
 * only confuse.
 * @type {readonly Trait[]}
 */
export const TRAITS = [
  { text: "It has no corners.", test: s => s.corners === 0 },
  ...[3, 4, 5, 6, 8].map(n => ({ text: `It has ${n} sides.`, test: (/** @type {Shape} */ s) => s.sides === n })),
  { text: "It has 4 square corners (right angles).", test: s => s.rightAngles === 4 },
  { text: "All its sides are the same length.", test: s => s.equalSides, about: s => s.sides > 0 },
  { text: "It has exactly 1 pair of parallel sides.", test: s => s.parallelPairs === 1, about: s => s.sides === 4 },
  { text: "It has 2 pairs of parallel sides.", test: s => s.parallelPairs === 2, about: s => s.sides === 4 },
];

/** @type {QuestionType} */
export const shapes = {
  id: "shapes",
  name: "Shapes",
  generate(rng, grade) {
    const known = atGrade(grade, SHAPES_AT).map(shapeById);
    const shape = rng.pick(known);
    const visual = /** @type {const} */ ({ kind: "shape", shape: shape.id });

    // Kindergarten: name it.
    if (grade < 1) {
      return {
        prompt: "What shape is this?",
        visual,
        answer: shape.id,
        wrong: rng.shuffle(known.filter(s => s !== shape).map(s => s.id)),
        hint: "Count its sides and corners.",
        difficulty: 1,
      };
    }

    // First grade: count its sides or corners (1.G.1).
    if (grade < 2) {
      const sides = rng.chance(0.5);
      const answer = sides ? shape.sides : shape.corners;
      return {
        prompt: `How many ${sides ? "sides" : "corners"} does this shape have?`,
        visual,
        answer,
        wrong: wrongNumbers(rng, answer, [answer + 1, answer - 1, answer + 2], { spread: 2 }),
        hint: `Touch each ${sides ? "side" : "corner"} as you count it.`,
        difficulty: 1 + Number(answer > 4),
      };
    }

    // Second grade: shapes are named for their sides, whatever they look like (2.G.1).
    if (grade < 3) {
      const counts = [...new Set(known.map(s => s.sides))].filter(n => NAMES_BY_SIDES.has(n));
      const n = rng.pick(counts);
      const answer = /** @type {string} */ (NAMES_BY_SIDES.get(n));
      return {
        prompt: `What do we call any flat shape with ${n} straight sides?`,
        answer,
        wrong: rng.shuffle([...NAMES_BY_SIDES.values(), "circle"].filter(name => name !== answer)),
        hint: "The first part of a shape's name tells you how many sides it has.",
        difficulty: 1 + Number(n > 4),
      };
    }

    // Third grade: what is true of it (3.G.1).
    const traits = TRAITS.filter(t => !t.about || t.about(shape));
    return {
      prompt: "Which is true about this shape?",
      visual,
      answer: rng.pick(traits.filter(t => t.test(shape))).text,
      wrong: rng.shuffle(traits.filter(t => !t.test(shape))).map(t => t.text),
      hint: "Count the sides, then look at the corners.",
      difficulty: 2 + Number(shape.sides === 4),
    };
  },
};
