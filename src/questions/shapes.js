// Flat shapes: naming them, counting sides and corners, what is true of them,
// their lines of symmetry, and how quadrilaterals fit inside one another.

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
 * @property {number} symmetry  lines of symmetry; a circle's, without end, are left out as 0
 */

/** @type {readonly Shape[]} */
export const SHAPES = [
  { id: "circle", sides: 0, corners: 0, rightAngles: 0, parallelPairs: 0, equalSides: false, symmetry: 0 },
  { id: "triangle", sides: 3, corners: 3, rightAngles: 0, parallelPairs: 0, equalSides: true, symmetry: 3 },
  { id: "square", sides: 4, corners: 4, rightAngles: 4, parallelPairs: 2, equalSides: true, symmetry: 4 },
  { id: "rectangle", sides: 4, corners: 4, rightAngles: 4, parallelPairs: 2, equalSides: false, symmetry: 2 },
  { id: "hexagon", sides: 6, corners: 6, rightAngles: 0, parallelPairs: 3, equalSides: true, symmetry: 6 },
  { id: "trapezoid", sides: 4, corners: 4, rightAngles: 0, parallelPairs: 1, equalSides: false, symmetry: 1 },
  { id: "pentagon", sides: 5, corners: 5, rightAngles: 0, parallelPairs: 0, equalSides: true, symmetry: 5 },
  { id: "octagon", sides: 8, corners: 8, rightAngles: 0, parallelPairs: 4, equalSides: true, symmetry: 8 },
  { id: "rhombus", sides: 4, corners: 4, rightAngles: 0, parallelPairs: 2, equalSides: true, symmetry: 2 },
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

/**
 * What a shape can have, for "which shape has...?" (4.G.2). `about` keeps
 * out shapes where the answer would be arguable, as for TRAITS.
 * @type {readonly { text: string, test: (s: Shape) => boolean, about?: (s: Shape) => boolean }[]}
 */
const HAS = [
  { text: "exactly 1 pair of parallel sides", test: s => s.parallelPairs === 1, about: s => s.sides > 0 },
  { text: "no parallel sides at all", test: s => s.parallelPairs === 0, about: s => s.sides > 0 },
  { text: "right angles", test: s => s.rightAngles > 0, about: s => s.sides > 0 },
  { text: "2 pairs of parallel sides but no right angles", test: s => s.parallelPairs === 2 && s.rightAngles === 0, about: s => s.sides === 4 },
  { text: "right angles but sides of different lengths", test: s => s.rightAngles > 0 && !s.equalSides, about: s => s.sides > 0 },
];

/**
 * True and false sentences about how quadrilaterals fit inside one another
 * (5.G.3-4). Trapezoids are left out, since books define them two ways.
 */
const ALWAYS_TRUE = [
  "Every square is a rectangle.",
  "Every square is a rhombus.",
  "Every rectangle is a parallelogram.",
  "Every rhombus is a parallelogram.",
  "Every parallelogram is a quadrilateral.",
  "Every square is a parallelogram.",
];
const NOT_ALWAYS_TRUE = [
  "Every rectangle is a square.",
  "Every rhombus is a square.",
  "Every parallelogram is a rectangle.",
  "Every quadrilateral is a parallelogram.",
  "Every parallelogram is a rhombus.",
  "Every rectangle is a rhombus.",
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

    // Fourth and fifth grade: symmetry (4.G.3), sorting by sides and angles
    // (4.G.2), and the family of quadrilaterals (5.G.3-4).
    if (grade >= 4) {
      const kind = rng.pick(grade < 5 ? ["symmetry", "symmetry", "has", "has"] : ["family", "family", "symmetry", "has"]);
      if (kind === "symmetry") {
        const symmetric = rng.pick(known.filter(s => s.symmetry > 0));
        return {
          prompt: "How many lines of symmetry does this shape have?",
          visual: { kind: "shape", shape: symmetric.id },
          answer: symmetric.symmetry,
          // Lines through the corners only, or the sides counted instead.
          wrong: wrongNumbers(rng, symmetric.symmetry, [symmetric.symmetry / 2, symmetric.sides, symmetric.symmetry * 2, symmetric.symmetry + 1].filter(n => n !== symmetric.symmetry), { min: 1 }),
          hint: "A line of symmetry folds the shape so both halves match exactly. Try lines through corners and through the middles of sides.",
          difficulty: 2 + Number(symmetric.id === "rectangle" || symmetric.id === "rhombus"),
        };
      }
      if (kind === "has") {
        for (;;) {
          const trait = rng.pick(HAS);
          const fair = known.filter(s => !trait.about || trait.about(s));
          const yes = fair.filter(trait.test);
          const no = fair.filter(s => !trait.test(s));
          if (yes.length === 0 || no.length < 3) continue;
          return {
            prompt: `Which shape has ${trait.text}?`,
            answer: rng.pick(yes).id,
            wrong: rng.shuffle(no).map(s => s.id),
            hint: "Picture each shape. Parallel sides run side by side and never meet; a right angle is a square corner.",
            difficulty: 2,
          };
        }
      }
      return {
        prompt: "Which of these is always true?",
        answer: rng.pick(ALWAYS_TRUE),
        wrong: rng.shuffle(NOT_ALWAYS_TRUE),
        hint: "A square has everything a rectangle needs: 4 sides and 4 right angles. Does every rectangle have what a square needs?",
        difficulty: 3,
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
