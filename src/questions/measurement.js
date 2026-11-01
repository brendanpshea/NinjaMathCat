// Measuring: area and perimeter (3.MD.5-8, 4.MD.3, 6.G.1), volume (5.MD.3-5,
// 6.G.2) and surface area (6.G.4), and changing from one unit to another
// (3.MD.2, 4.MD.1, 5.MD.1).

import { atGrade, wrongNumbers } from "./common.js";
import { frac, formatFraction } from "./rational.js";
import { formatDecimal } from "./decimals.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/** @typedef {{ short: string, many: string }} Unit */

/** @type {readonly Unit[]} */
const LENGTHS = [
  { short: "cm", many: "centimeters" },
  { short: "m", many: "meters" },
  { short: "in", many: "inches" },
  { short: "ft", many: "feet" },
];

/**
 * Two different side lengths, the longer first.
 * @param {Rng} rng
 * @param {[number, number]} long
 * @param {[number, number]} short
 */
function sides(rng, long, short) {
  for (;;) {
    const [a, b] = [rng.int(...long), rng.int(...short)];
    if (a !== b) return [Math.max(a, b), Math.min(a, b)];
  }
}

/**
 * What a grade measures, and how big. Third grade counts squares before it
 * multiplies (3.MD.6-7); sixth grade finds the area of triangles and
 * parallelograms (6.G.1).
 * @type {readonly [number, { kinds: string[], long: [number, number], short: [number, number] }][]}
 */
const AREAS = [
  [3.5, { kinds: ["count", "count", "multiply", "perimeter", "missingSide"], long: [3, 9], short: [2, 8] }],
  [4.5, { kinds: ["multiply", "perimeter", "missingSide", "story"], long: [10, 25], short: [3, 12] }],
  [5.5, { kinds: ["multiply", "perimeter", "missingSide", "story"], long: [12, 40], short: [5, 20] }],
  [Infinity, { kinds: ["triangle", "triangle", "parallelogram", "missingHeight", "story"], long: [6, 20], short: [3, 14] }],
];

/** @type {QuestionType} */
export const area = {
  id: "area",
  name: "Area and perimeter",
  generate(rng, grade) {
    const level = atGrade(grade, AREAS);
    const unit = rng.pick(LENGTHS);
    const [w, h] = sides(rng, level.long, level.short);
    const big = (grade >= 4 ? 1 : 0) + Number(w * h > 50);
    switch (rng.pick(level.kinds)) {
      case "count": return countSquares(rng);
      case "multiply": return {
        prompt: `What is the area of this rectangle, in square ${unit.many}?`,
        visual: rectangle(w, h, `${w} ${unit.short}`, `${h} ${unit.short}`),
        answer: w * h,
        // The perimeter, the two sides added, or a row too many or too few.
        wrong: wrongNumbers(rng, w * h, [2 * (w + h), w + h, w * h + w, w * h - w, w * h + h, w * h - h], { min: 1 }),
        hint: "The area is how many unit squares cover it: the number of rows times the squares in each row.",
        difficulty: 1 + big,
      };
      case "perimeter": return {
        prompt: `What is the perimeter of this rectangle, in ${unit.many}?`,
        visual: rectangle(w, h, `${w} ${unit.short}`, `${h} ${unit.short}`),
        answer: 2 * (w + h),
        // The area, or only some of the sides.
        wrong: wrongNumbers(rng, 2 * (w + h), [w * h, w + h, 2 * w + h, w + 2 * h], { min: 1, spread: 4 }),
        hint: "The perimeter is the distance all the way around: add up all four sides.",
        difficulty: 1 + big,
      };
      case "missingSide": return missingSide(rng, w, h, unit, big);
      case "story": return areaStory(rng, w, h);
      case "missingHeight": return missingHeight(rng, w, h, unit);
      default: return slanted(rng, w, h, unit);
    }
  },
};

/**
 * @param {number} width
 * @param {number} height
 * @param {string} base
 * @param {string} side
 * @returns {Draft["visual"]}
 */
function rectangle(width, height, base, side) {
  return { kind: "area", shape: "rectangle", width, height, grid: false, labels: { base, height: side } };
}

/**
 * Area as a count of unit squares (3.MD.5-6).
 * @param {Rng} rng
 * @returns {Draft}
 */
function countSquares(rng) {
  const [w, h] = [rng.int(2, 8), rng.int(2, 6)];
  const answer = w * h;
  return {
    prompt: "Each square is 1 square unit. What is the area of the rectangle, in square units?",
    visual: { kind: "area", shape: "rectangle", width: w, height: h, grid: true },
    answer,
    // The squares round the edge, a row or column missed, or one too many.
    wrong: wrongNumbers(rng, answer, [2 * (w + h) - 4, 2 * (w + h), answer - w, answer + w, answer - h, answer + h], { min: 1 }),
    hint: `Count the squares in one row, then count the rows.`,
    difficulty: answer > 24 ? 2 : 1,
  };
}

/**
 * A side found from the area or perimeter and the other side (3.MD.7b, 3.MD.8, 4.MD.3).
 * @param {Rng} rng
 * @param {number} w
 * @param {number} h  the side to find
 * @param {Unit} unit
 * @param {number} big
 * @returns {Draft}
 */
function missingSide(rng, w, h, unit, big) {
  const visual = rectangle(w, h, `${w} ${unit.short}`, "?");
  if (rng.chance(0.5)) {
    const total = w * h;
    return {
      prompt: `This rectangle has an area of ${total} square ${unit.many}. How long is the side marked "?"`,
      visual,
      answer: h,
      // Taking away instead of dividing, or treating the area as a perimeter.
      wrong: wrongNumbers(rng, h, [total - w, total / 2 - w, w], { min: 1 }),
      hint: `${w} times what makes ${total}?`,
      difficulty: 2 + Number(big > 1),
    };
  }
  const total = 2 * (w + h);
  return {
    prompt: `This rectangle has a perimeter of ${total} ${unit.many}. How long is the side marked "?"`,
    visual,
    answer: h,
    // Forgetting the other pair of sides, or taking just one side away.
    wrong: wrongNumbers(rng, h, [total - 2 * w, total / 2, total - w, total / 4], { min: 1 }),
    hint: `Opposite sides are the same length, so the two sides of ${w} ${unit.many} make ${2 * w}. What is left is shared by the other two.`,
    difficulty: 2 + Number(big > 1),
  };
}

/**
 * The area or perimeter of something real (4.MD.3).
 * @type {readonly { measure: "area" | "perimeter" | "width", text: (l: number, w: number) => string }[]}
 */
const AREA_STORIES = [
  { measure: "area", text: (l, w) => `A rug is ${l} feet long and ${w} feet wide. How many square feet of floor does it cover?` },
  { measure: "area", text: (l, w) => `A vegetable patch is ${l} meters long and ${w} meters wide. What is its area, in square meters?` },
  { measure: "perimeter", text: (l, w) => `A garden is ${l} meters long and ${w} meters wide. How many meters of fence go all the way around it?` },
  { measure: "perimeter", text: (l, w) => `A poster is ${l} inches long and ${w} inches wide. How many inches of tape go around its edge?` },
  { measure: "width", text: (l, w) => `A playground has an area of ${l * w} square meters. It is ${l} meters long. How wide is it?` },
];

/**
 * @param {Rng} rng
 * @param {number} l
 * @param {number} w
 * @returns {Draft}
 */
function areaStory(rng, l, w) {
  const story = rng.pick(AREA_STORIES);
  const { answer, likely, hint } = storyAnswer(story.measure, l, w);
  return {
    prompt: story.text(l, w),
    answer,
    wrong: wrongNumbers(rng, answer, likely, { min: 1, spread: 4 }),
    hint,
    difficulty: story.measure === "width" ? 3 : 2,
  };
}

/**
 * @param {"area" | "perimeter" | "width"} measure
 * @param {number} l
 * @param {number} w
 * @returns {{ answer: number, likely: number[], hint: string }}
 */
function storyAnswer(measure, l, w) {
  switch (measure) {
    case "area": return { answer: l * w, likely: [2 * (l + w), l + w, l * w + l, l * w - w], hint: "Area covers the inside: length times width." };
    case "perimeter": return { answer: 2 * (l + w), likely: [l * w, l + w, 2 * l + w], hint: "Perimeter goes all the way around: two lengths and two widths." };
    default: return { answer: w, likely: [l * w - l, (l * w) / 2 - l, l], hint: `${l} times what makes ${l * w}?` };
  }
}

/**
 * The area of a triangle or parallelogram from its base and height (6.G.1).
 * @param {Rng} rng
 * @param {number} b
 * @param {number} h
 * @param {Unit} unit
 * @returns {Draft}
 */
function slanted(rng, b, h, unit) {
  if (b * h % 2 === 1) b += 1;
  const triangle = rng.chance(0.6);
  const answer = triangle ? (b * h) / 2 : b * h;
  return {
    prompt: `What is the area of this ${triangle ? "triangle" : "parallelogram"}, in square ${unit.many}?`,
    visual: { kind: "area", shape: triangle ? "triangle" : "parallelogram", width: b, height: h, grid: false, labels: { base: `${b} ${unit.short}`, height: `${h} ${unit.short}` } },
    answer,
    // Forgetting to halve, or halving when there is no need; adding instead.
    wrong: wrongNumbers(rng, answer, triangle ? [b * h, b + h, answer + b, answer - h] : [(b * h) / 2, b + h, 2 * (b + h), answer + h], { min: 1 }),
    hint: triangle
      ? "A triangle is half of a parallelogram with the same base and height."
      : "Cut the triangle off one end and move it to the other: it makes a rectangle.",
    difficulty: triangle ? 2 : 1,
  };
}

/**
 * A triangle's height from its area and base (6.G.1).
 * @param {Rng} rng
 * @param {number} b
 * @param {number} h  the height to find
 * @param {Unit} unit
 * @returns {Draft}
 */
function missingHeight(rng, b, h, unit) {
  if (b * h % 2 === 1) b += 1;
  const total = (b * h) / 2;
  return {
    prompt: `This triangle has an area of ${total} square ${unit.many}. How tall is it?`,
    visual: { kind: "area", shape: "triangle", width: b, height: h, grid: false, labels: { base: `${b} ${unit.short}`, height: "?" } },
    answer: h,
    // Dividing by the base without doubling first, or taking the base away.
    wrong: wrongNumbers(rng, h, [total / b, total - b, 2 * total, total].filter(n => n !== b), { min: 1 }),
    hint: `Half of base times height is ${total}, so base times height is ${2 * total}.`,
    difficulty: 3,
  };
}

/** @type {readonly [number, string[]][]} */
const VOLUMES = [
  [5.5, ["count", "count", "multiply", "layers", "missingEdge", "combine"]],
  [Infinity, ["half", "half", "surface", "surface", "multiply", "missingEdge", "combine"]],
];

/** @type {QuestionType} */
export const volume = {
  id: "volume",
  name: "Volume and surface area",
  generate(rng, grade) {
    const unit = rng.pick(LENGTHS);
    const sixth = grade >= 6;
    const [l, w, h] = [rng.int(2, sixth ? 15 : 10), rng.int(2, sixth ? 10 : 6), rng.int(2, sixth ? 10 : 6)];
    const answer = l * w * h;
    switch (rng.pick(atGrade(grade, VOLUMES))) {
      case "count": return countCubes(rng);
      case "multiply": return {
        prompt: `What is the volume of this box, in cubic ${unit.many}?`,
        visual: { kind: "cubes", length: l, width: w, height: h, cubes: false, labels: { length: `${l} ${unit.short}`, width: `${w} ${unit.short}`, height: `${h} ${unit.short}` } },
        answer,
        // Adding the edges, one layer, or the area of the outside.
        wrong: wrongNumbers(rng, answer, [l + w + h, l * w, 2 * (l * w + l * h + w * h), answer + l * w, answer - l * w], { min: 1 }),
        hint: "Volume is length times width times height.",
        difficulty: 1 + Number(answer > 100) + Number(sixth),
      };
      case "layers": return layers(rng, l, w, h);
      case "missingEdge": return {
        prompt: `A box has a volume of ${answer} cubic ${unit.many}. Its bottom is ${l} ${unit.many} by ${w} ${unit.many}. How tall is it?`,
        answer: h,
        wrong: wrongNumbers(rng, h, [answer - l * w, answer / l, answer / w, answer - l - w], { min: 1 }),
        hint: `The bottom layer is ${l} × ${w} cubes. How many layers make ${answer}?`,
        difficulty: 3,
      };
      case "combine": return combine(rng, unit);
      case "surface": {
        const faces = [l * w, l * h, w * h];
        const total = 2 * (faces[0] + faces[1] + faces[2]);
        return {
          prompt: `What is the surface area of this box, in square ${unit.many}?`,
          visual: { kind: "cubes", length: l, width: w, height: h, cubes: false, labels: { length: `${l} ${unit.short}`, width: `${w} ${unit.short}`, height: `${h} ${unit.short}` } },
          answer: total,
          // The volume, one of each face, or a pair of faces missed.
          wrong: wrongNumbers(rng, total, [answer, total / 2, total - 2 * faces[2], total - faces[0]], { min: 1 }),
          hint: "A box has 6 faces, in 3 pairs that match. Find the area of one of each pair, then double the total.",
          difficulty: 3,
        };
      }
      default: return halfEdge(rng, unit);
    }
  },
};

/**
 * Volume as a count of unit cubes (5.MD.3-4). The box is drawn whole, so
 * counting the cubes that show is a mistake to make.
 * @param {Rng} rng
 * @returns {Draft}
 */
function countCubes(rng) {
  const [l, w, h] = [rng.int(2, 5), rng.int(2, 4), rng.int(2, 4)];
  const answer = l * w * h;
  const showing = answer - (l - 1) * (w - 1) * (h - 1);
  return {
    prompt: "Each small cube is 1 cubic unit. What is the volume of the box, in cubic units?",
    visual: { kind: "cubes", length: l, width: w, height: h, cubes: true },
    answer,
    // Only the cubes that show, the squares on the faces, or one layer off.
    wrong: wrongNumbers(rng, answer, [showing, l * w + l * h + w * h, answer - l * w, answer + l * w, l * w], { min: 1 }),
    hint: "Count the cubes in the top layer, then count how many layers there are.",
    difficulty: answer > 30 ? 2 : 1,
  };
}

/**
 * Volume as layers, or as the area of the base times the height (5.MD.5a-b).
 * @param {Rng} rng
 * @param {number} l
 * @param {number} w
 * @param {number} h
 * @returns {Draft}
 */
function layers(rng, l, w, h) {
  const base = l * w;
  const answer = base * h;
  const asLayers = rng.chance(0.5);
  return {
    prompt: asLayers
      ? `A box is filled with cubes: ${base} in each layer, and ${h} layers. How many cubes are in the box?`
      : `The bottom of a box has an area of ${base} square inches, and the box is ${h} inches tall. What is its volume, in cubic inches?`,
    answer,
    wrong: wrongNumbers(rng, answer, [base + h, base * (h - 1), base * (h + 1), base * 2], { min: 1 }),
    hint: asLayers ? `${h} layers of ${base}.` : "Each inch of height is another layer the size of the bottom.",
    difficulty: 2,
  };
}

/**
 * Two boxes together (5.MD.5c).
 * @param {Rng} rng
 * @param {Unit} unit
 * @returns {Draft}
 */
function combine(rng, unit) {
  const box = () => [rng.int(2, 6), rng.int(2, 5), rng.int(1, 4)];
  const [a, b] = [box(), box()];
  const [va, vb] = [a[0] * a[1] * a[2], b[0] * b[1] * b[2]];
  const answer = va + vb;
  const write = (/** @type {number[]} */ edges) => edges.map(e => `${e} ${unit.short}`).join(" by ");
  return {
    prompt: `A shelf is made of two boxes, one ${write(a)} and the other ${write(b)}. What is their total volume, in cubic ${unit.many}?`,
    answer,
    // Only one box, or the edges added.
    wrong: wrongNumbers(rng, answer, [va, vb, [...a, ...b].reduce((s, e) => s + e, 0), Math.abs(va - vb), answer + a[0] * a[1]].filter(n => n !== answer), { min: 1, spread: 4 }),
    hint: "Find the volume of each box, then add them.",
    difficulty: 3,
  };
}

/**
 * A box with an edge of a half (6.G.2), answered as a mixed number when it
 * does not come out whole.
 * @param {Rng} rng
 * @param {Unit} unit
 * @returns {Draft}
 */
function halfEdge(rng, unit) {
  const [l, w, h] = [rng.int(2, 8), rng.int(2, 6), rng.int(1, 5)];
  /** @param {number} halves */
  const show = halves => formatFraction(frac(halves, 2), { mixed: true });
  const halves = l * w * (2 * h + 1);
  const answer = halves % 2 === 0 ? halves / 2 : show(halves);
  const others = [
    2 * l * w * h,                // dropping the half
    2 * l * w * (h + 1),          // rounding it up
    2 * l * w * h + 1,            // adding the half at the end
    2 * (l + w + h) + 1,          // adding the edges
    halves + 2 * l * w,           // one layer too many
    halves - 2 * l * w,           // one too few
  ];
  return {
    prompt: `What is the volume of this box, in cubic ${unit.many}?`,
    visual: { kind: "cubes", length: l, width: w, height: h + 0.5, cubes: false, labels: { length: `${l} ${unit.short}`, width: `${w} ${unit.short}`, height: `${h} 1/2 ${unit.short}` } },
    answer,
    wrong: typeof answer === "number"
      ? wrongNumbers(rng, answer, others.filter(n => n % 2 === 0).map(n => n / 2), { min: 1 })
      : rng.shuffle(others.filter(n => n > 0 && n !== halves).map(show)),
    hint: `Multiply the edges as usual; ${l} × ${w} × ${h} 1/2 is ${l} × ${w} × ${h}, and half of ${l} × ${w} more.`,
    difficulty: 3,
  };
}

/**
 * Units and how many of the smaller make one of the bigger, within a system
 * (4.MD.1, 5.MD.1).
 * @typedef {{ big: string, small: string, one: string, times: number, metric: boolean }} Conversion
 * @type {readonly Conversion[]}
 */
const CONVERSIONS = [
  { big: "kilometers", one: "kilometer", small: "meters", times: 1000, metric: true },
  { big: "meters", one: "meter", small: "centimeters", times: 100, metric: true },
  { big: "centimeters", one: "centimeter", small: "millimeters", times: 10, metric: true },
  { big: "kilograms", one: "kilogram", small: "grams", times: 1000, metric: true },
  { big: "liters", one: "liter", small: "milliliters", times: 1000, metric: true },
  { big: "feet", one: "foot", small: "inches", times: 12, metric: false },
  { big: "yards", one: "yard", small: "feet", times: 3, metric: false },
  { big: "pounds", one: "pound", small: "ounces", times: 16, metric: false },
  { big: "gallons", one: "gallon", small: "quarts", times: 4, metric: false },
  { big: "hours", one: "hour", small: "minutes", times: 60, metric: false },
  { big: "minutes", one: "minute", small: "seconds", times: 60, metric: false },
  { big: "days", one: "day", small: "hours", times: 24, metric: false },
  { big: "weeks", one: "week", small: "days", times: 7, metric: false },
];

/**
 * What a grade converts. Third grade picks units and works in one unit
 * (3.MD.2); fourth goes from bigger units to smaller (4.MD.1); fifth goes
 * both ways, with decimals in metric units (5.MD.1).
 * @type {readonly [number, string[]][]}
 */
const CONVERTING = [
  [3.5, ["which", "which", "sameUnit"]],
  [4, ["toSmall"]],
  [4.5, ["toSmall", "toSmall", "mixed"]],
  [Infinity, ["toSmall", "toBig", "toBig", "toBigDecimal", "mixed"]],
];

/** @type {QuestionType} */
export const conversions = {
  id: "conversions",
  name: "Units of measure",
  generate(rng, grade) {
    switch (rng.pick(atGrade(grade, CONVERTING))) {
      case "which": return whichUnit(rng);
      case "sameUnit": return sameUnit(rng);
      case "toSmall": return toSmall(rng, grade);
      case "toBig": return toBig(rng);
      case "toBigDecimal": return toBigDecimal(rng);
      default: return mixedUnits(rng);
    }
  },
};

/**
 * Things to weigh or fill, and the unit that suits them (3.MD.2).
 * @type {readonly { thing: string, unit: string }[]}
 */
const UNIT_FOR = [
  { thing: "how much water fills a bathtub", unit: "liters" },
  { thing: "how much water fills a fish tank", unit: "liters" },
  { thing: "how much medicine is in a spoon", unit: "milliliters" },
  { thing: "how much juice is in a small cup", unit: "milliliters" },
  { thing: "how heavy a dog is", unit: "kilograms" },
  { thing: "how heavy a bag of potatoes is", unit: "kilograms" },
  { thing: "how heavy a paper clip is", unit: "grams" },
  { thing: "how heavy a strawberry is", unit: "grams" },
];

/**
 * @param {Rng} rng
 * @returns {Draft}
 */
function whichUnit(rng) {
  const { thing, unit } = rng.pick(UNIT_FOR);
  const liquid = unit.endsWith("liters");
  return {
    prompt: `Which unit would you use to measure ${thing}?`,
    answer: unit,
    wrong: rng.shuffle(["liters", "milliliters", "kilograms", "grams"].filter(u => u !== unit)),
    hint: liquid
      ? "Liters and milliliters measure how much a container holds; a liter is much more than a milliliter."
      : "Kilograms and grams measure how heavy something is; a kilogram is much more than a gram.",
    difficulty: 1,
  };
}

/**
 * A one-step story in a single unit (3.MD.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function sameUnit(rng) {
  const [a, b] = [rng.int(3, 9), rng.int(2, 9)];
  const stories = [
    { text: `A bucket holds ${a} liters of water. How many liters do ${b} buckets hold?`, answer: a * b, likely: [a + b, a * b + a, a * b - a] },
    { text: `A bag of flour weighs ${a * b} kilograms. It is shared equally into ${b} bowls. How many kilograms go in each bowl?`, answer: a, likely: [a * b - b, b, a + 1] },
    { text: `A jug has ${a * 10} liters of juice. ${b * 3} liters are poured out. How many liters are left?`, answer: a * 10 - b * 3, likely: [a * 10 + b * 3, a * 10 - b] },
    { text: `A box weighs ${a * 10} kilograms. A second box weighs ${b * 4} kilograms. How many kilograms do they weigh together?`, answer: a * 10 + b * 4, likely: [a * 10 - b * 4, a * 10 + b] },
  ];
  const story = rng.pick(stories);
  return {
    prompt: story.text,
    answer: story.answer,
    wrong: wrongNumbers(rng, story.answer, story.likely.filter(n => n > 0), { min: 1 }),
    hint: "Everything is in the same unit, so just work with the numbers.",
    difficulty: 2,
  };
}

/**
 * From a bigger unit to a smaller one (4.MD.1): multiply.
 * @param {Rng} rng
 * @param {number} grade
 * @returns {Draft}
 */
function toSmall(rng, grade) {
  const c = rng.pick(CONVERSIONS);
  const n = rng.int(2, grade >= 5 ? 15 : 9);
  const answer = n * c.times;
  return {
    prompt: `How many ${c.small} are in ${n} ${c.big}?`,
    answer,
    // Adding, dividing, or a factor of ten out.
    wrong: wrongNumbers(rng, answer, [n + c.times, answer * 10, c.metric ? answer / 10 : n * 10, c.times, answer + c.times, answer - c.times], { min: 1 }),
    hint: `1 ${c.one} is ${c.times} ${c.small}.`,
    difficulty: c.metric ? 1 : 2,
  };
}

/**
 * From a smaller unit to a bigger one (5.MD.1): divide.
 * @param {Rng} rng
 * @returns {Draft}
 */
function toBig(rng) {
  const c = rng.pick(CONVERSIONS);
  const answer = rng.int(2, 12);
  const n = answer * c.times;
  return {
    prompt: `How many ${c.big} is ${n} ${c.small}?`,
    answer,
    // Multiplying instead, or taking away.
    wrong: wrongNumbers(rng, answer, [n - c.times, answer * 10, c.metric ? answer * 100 : answer + c.times].filter(v => v < n * 10), { min: 1 }),
    hint: `${c.times} ${c.small} make 1 ${c.one}. How many groups of ${c.times} are in ${n}?`,
    difficulty: 2,
  };
}

/**
 * A metric measure in a bigger unit, which needs a decimal (5.MD.1).
 * @param {Rng} rng
 * @returns {Draft}
 */
function toBigDecimal(rng) {
  const c = rng.pick(CONVERSIONS.filter(k => k.metric));
  const places = Math.log10(c.times);
  // 350 cm as meters: 3.5, or 4500 m as kilometers: 4.5. Never a whole
  // number of the bigger unit.
  const whole = rng.chance(0.3) ? 0 : rng.int(1, 9);
  const rest = rng.chance(0.5) ? rng.int(1, 9) * (c.times / 10) : rng.int(1, c.times - 1);
  // Never 1 of the smaller unit, which would read "1 millimeters".
  const n = Math.max(2, whole * c.times + rest);
  const answer = formatDecimal(n, places);
  // Writing 305 cm as 3.5 m, dropping the zero that holds the tenths place.
  const dropped = rest < c.times / 10 && whole > 0 ? [`${whole}.${rest}`] : [];
  // The point moved a place or two too far either way, but no further than
  // ten-thousandths, and never left where it was.
  const shifted = [-3, -2, -1, 1, 2].filter(k => places + k >= 0 && places + k <= 4).map(k => formatDecimal(n, places + k));
  return {
    prompt: `How many ${c.big} is ${n} ${c.small}?`,
    answer,
    // The decimal point in the wrong place.
    wrong: [...dropped, ...rng.shuffle(shifted)],
    hint: `Divide by ${c.times}: move each digit ${places} place${places > 1 ? "s" : ""} to the right of where it was.`,
    difficulty: 3,
  };
}

/**
 * A measure in two units, into the smaller (4.MD.1, 4.MD.2).
 * @param {Rng} rng
 * @returns {Draft}
 */
function mixedUnits(rng) {
  const c = rng.pick(CONVERSIONS.filter(k => !k.metric));
  const [n, extra] = [rng.int(2, 6), rng.int(2, c.times - 1)];
  const answer = n * c.times + extra;
  return {
    prompt: `How many ${c.small} is ${n} ${c.big} and ${extra} ${c.small}?`,
    answer,
    // Just the parts put side by side, or tens as if there were 10 in each.
    wrong: wrongNumbers(rng, answer, [n + extra, n * 10 + extra, n * c.times, answer + c.times, answer - c.times], { min: 1 }),
    hint: `1 ${c.one} is ${c.times} ${c.small}. Change the ${c.big}, then add the rest.`,
    difficulty: 2,
  };
}
