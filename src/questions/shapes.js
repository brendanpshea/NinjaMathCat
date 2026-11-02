// Shapes: naming flat and solid ones, saying where things are, counting
// sides, corners and faces, rows and columns of squares, what is true of a
// shape, its lines of symmetry, and how quadrilaterals fit inside one another.

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

/** The solid shapes kindergarten names (K.G.2), and the flat ones they are told apart from (K.G.3). */
export const SOLIDS = /** @type {const} */ (["cube", "sphere", "cone", "cylinder"]);
export const FLAT = ["circle", "triangle", "square", "rectangle"];

/** Things in the world, and the solid shape each is shaped like (K.G.1). None has the answer in its name. */
export const SHAPED_LIKE = [
  ["a ball", "sphere"], ["an orange", "sphere"], ["a globe", "sphere"],
  ["a can of soup", "cylinder"], ["a drum", "cylinder"], ["a candle", "cylinder"],
  ["a party hat", "cone"], ["a wizard's hat", "cone"],
  ["a toy block", "cube"],
];

/** Clues that fit exactly one of the shapes kindergarten knows (K.G.4). */
export const CLUES = [
  ["Which solid shape is round all over, with no flat faces?", "sphere"],
  ["Which solid shape has 6 flat faces, and every one is a square?", "cube"],
  ["Which solid shape has a point at the top and a flat circle at the bottom?", "cone"],
  ["Which solid shape has a flat circle at each end?", "cylinder"],
  ["Which flat shape has no corners?", "circle"],
  ["Which flat shape has 3 sides and 3 corners?", "triangle"],
  ["Which flat shape has 4 sides, all the same length?", "square"],
  ["Which flat shape has 4 sides, two long and two short?", "rectangle"],
];

/** Shapes built from straws (K.G.5): the clue, and the shape it makes. */
export const STRAWS = [
  ["You join 3 straws end to end to make a closed shape. What shape did you make?", "triangle"],
  ["You make a shape from 4 straws, all the same length, with square corners. What shape is it?", "square"],
  ["You make a shape from 2 long straws and 2 short straws, with square corners. What shape is it?", "rectangle"],
];

/** What each picture of shapes put together is made of (K.G.6, 1.G.2). */
export const MADE_OF = {
  triangles: "two triangles", squares: "two squares", rectangles: "two rectangles", "four squares": "four squares",
  "half-circles": "two half-circles", house: "a square and a triangle", trapezoids: "two trapezoids", "three triangles": "three triangles",
};

/** Shapes put together in words, and the shape they make (1.G.2). */
export const PUT_TOGETHER = [
  ["You put two squares side by side. What shape do they make?", "rectangle"],
  ["You put two half-circles together along their flat sides. What shape do they make?", "circle"],
  ["You put two matching trapezoids together along their long sides. What shape do they make?", "hexagon"],
];

/** Words for where something is (K.G.1), and what is placed in the pictures. */
export const PLACES = /** @type {const} */ (["above", "below", "next to", "in front of", "behind"]);
const THINGS = /** @type {const} */ (["cat", "dog", "bunny", "ball", "bear"]);
const LANDMARKS = /** @type {const} */ (["box", "chair", "basket"]);

/**
 * Solids in second grade, with their faces and corners, and how many of each
 * the picture shows; the rest are hidden at the back (2.G.1).
 */
export const SOLID_PARTS = {
  cube: { faces: 6, corners: 8, edges: 12, facesSeen: 3, cornersSeen: 7 },
  box: { faces: 6, corners: 8, edges: 12, facesSeen: 3, cornersSeen: 7 },
  pyramid: { faces: 5, corners: 5, edges: 8, facesSeen: 2, cornersSeen: 4 },
};

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

    // Kindergarten: name flat and solid shapes (K.G.2), tell them apart
    // (K.G.3), match them to clues (K.G.4) and things in the world, and say
    // where something is (K.G.1).
    if (grade < 1) {
      const kind = rng.pick(["flat", "flat", "solid", "flatOrSolid", "shapedLike", "clue", "where", "where", "build", "compose"]);
      if (kind === "build") return build(rng);
      if (kind === "compose") return compose(rng, grade);
      const otherSolids = (/** @type {string} */ answer) => rng.shuffle(SOLIDS.filter(s => s !== answer));
      if (kind === "solid") {
        const solid = rng.pick(SOLIDS);
        return {
          prompt: "What is this solid shape called?",
          visual: { kind: "solid", solid },
          answer: solid,
          wrong: otherSolids(solid),
          hint: "Could it roll? Does it have flat faces, or a point?",
          difficulty: 1,
        };
      }
      if (kind === "flatOrSolid") {
        const solid = rng.chance(0.5);
        const [answer, others] = solid ? [rng.pick(SOLIDS), FLAT] : [rng.pick(FLAT), SOLIDS];
        return {
          prompt: `Which of these is a ${solid ? "solid" : "flat"} shape?`,
          answer,
          wrong: rng.shuffle([...others]),
          hint: "A flat shape lies flat on paper. A solid shape is one you could pick up and hold.",
          difficulty: 1,
        };
      }
      if (kind === "shapedLike") {
        const [thing, answer] = rng.pick(SHAPED_LIKE);
        return {
          prompt: `What solid shape is ${thing} shaped like?`,
          answer,
          wrong: otherSolids(answer),
          hint: "Picture holding it. Could it roll? Does it have flat faces, or a point?",
          difficulty: 1,
        };
      }
      if (kind === "clue") {
        const [prompt, answer] = rng.pick(CLUES);
        return {
          prompt,
          answer,
          wrong: FLAT.includes(answer) ? rng.shuffle(FLAT.filter(s => s !== answer)) : otherSolids(answer),
          hint: "Picture each shape, and check it against every part of the clue.",
          difficulty: 1,
        };
      }
      if (kind === "where") {
        const [thing, landmark, place] = [rng.pick(THINGS), rng.pick(LANDMARKS), rng.pick(PLACES)];
        return {
          prompt: `Where is the ${thing}?`,
          visual: { kind: "scene", thing, landmark, place },
          answer: `${place} the ${landmark}`,
          wrong: rng.shuffle(PLACES.filter(p => p !== place)).map(p => `${p} the ${landmark}`),
          hint: `Is the ${thing} higher, lower, beside the ${landmark}, or partly hidden by it? In front means it covers part of the ${landmark}.`,
          difficulty: 1,
        };
      }
      return {
        prompt: "What shape is this?",
        visual,
        answer: shape.id,
        wrong: rng.shuffle(known.filter(s => s !== shape).map(s => s.id)),
        hint: "Count its sides and corners.",
        difficulty: 1,
      };
    }

    // First grade: put shapes together (1.G.2), or count sides or corners (1.G.1).
    if (grade < 2 && rng.chance(0.35)) return compose(rng, grade);
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

    // Second grade: rows and columns of same-size squares (2.G.2), and the
    // faces and corners of solids, hidden ones too (2.G.1).
    if (grade < 3 && rng.chance(0.5)) {
      if (rng.chance(0.5)) {
        // Arrays of up to 5 rows and 5 columns, as in 2.OA.4, never square, so rows and columns differ.
        const [width, height] = rng.shuffle([2, 3, 4, 5]);
        const ask = rng.pick(["total", "total", "rows", "columns", "inRow"]);
        const visual = /** @type {const} */ ({ kind: "area", shape: "rectangle", width, height, grid: true });
        if (ask === "total") {
          const total = width * height;
          return {
            prompt: "The rectangle is split into rows of same-size squares. How many squares are there in all?",
            visual,
            answer: total,
            wrong: wrongNumbers(rng, total, [width + height, total + width, total - height, total + height], { min: 1 }),
            hint: "Count the squares in one row. Then add that many again for each row.",
            difficulty: 1 + Number(total > 12),
          };
        }
        const answer = ask === "rows" ? height : width;
        return {
          prompt: ask === "rows" ? "How many rows of squares are there?" : ask === "columns" ? "How many columns of squares are there?" : "How many squares are in each row?",
          visual,
          answer,
          // Rows and columns mixed up, or every square counted.
          wrong: wrongNumbers(rng, answer, [ask === "rows" ? width : height, answer + 1, answer - 1, width * height], { min: 1 }),
          hint: "Rows go across, from side to side. Columns go up and down.",
          difficulty: 1,
        };
      }
      const solid = rng.pick(/** @type {const} */ (["cube", "box", "pyramid"]));
      const parts = SOLID_PARTS[solid];
      const faces = rng.chance(0.65);
      const answer = faces ? parts.faces : parts.corners;
      return {
        prompt: `How many ${faces ? "faces" : "corners"} does this solid shape have? Count the hidden ones too.`,
        visual: { kind: "solid", solid },
        answer,
        // Only the ones in sight, or the other part counted.
        wrong: wrongNumbers(rng, answer, faces ? [parts.facesSeen, parts.corners, answer + 1] : [parts.cornersSeen, parts.faces, parts.edges], { min: 1 }),
        hint: `The dashed lines are edges hidden at the back. Count the ${faces ? "faces" : "corners"} you can see, then the ones you can't.`,
        difficulty: 2,
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

/**
 * Building a flat shape from straws (K.G.5): which shape a set of straws
 * makes, or how many straws a shape takes.
 * @param {import("../rng.js").Rng} rng
 * @returns {import("./common.js").Draft}
 */
function build(rng) {
  if (rng.chance(0.5)) {
    const [prompt, answer] = rng.pick(STRAWS);
    return {
      prompt,
      answer,
      wrong: rng.shuffle(FLAT.filter(s => s !== answer)),
      hint: "Each straw is one side. Count the sides, and look at the corners.",
      difficulty: 1,
    };
  }
  const shape = rng.pick(["triangle", "square", "rectangle", "hexagon"]);
  const answer = shapeById(shape).sides;
  return {
    prompt: `How many straws do you need to make a ${shape}?`,
    answer,
    wrong: wrongNumbers(rng, answer, [answer + 1, answer - 1, answer + 2], { min: 2, spread: 2 }),
    hint: `Each straw makes one side of the ${shape}.`,
    difficulty: 1,
  };
}

/**
 * Shapes put together to make a bigger one (K.G.6, 1.G.2): which shapes a
 * picture is made of, or in first grade sometimes the shape two make.
 * @param {import("../rng.js").Rng} rng
 * @param {number} grade
 * @returns {import("./common.js").Draft}
 */
function compose(rng, grade) {
  if (grade >= 1 && rng.chance(0.35)) {
    const [prompt, answer] = rng.pick(PUT_TOGETHER);
    return {
      prompt,
      answer,
      wrong: rng.shuffle(["rectangle", "circle", "hexagon", "triangle", "square"].filter(s => s !== answer)),
      hint: "Picture the two shapes, or draw them, and see what shape their outside makes.",
      difficulty: 2,
    };
  }
  const figures = /** @type {(keyof typeof MADE_OF)[]} */ (Object.keys(MADE_OF)).filter(f => grade >= 1 || (f !== "trapezoids" && f !== "three triangles"));
  const figure = rng.pick(figures);
  return {
    prompt: "Which shapes were put together to make this shape?",
    visual: { kind: "compose", figure },
    answer: MADE_OF[figure],
    wrong: rng.shuffle(figures.filter(f => f !== figure)).map(f => MADE_OF[f]),
    hint: "Each color is one shape. Look at each part and name it, and count how many there are.",
    difficulty: 1 + Number(grade >= 1),
  };
}
