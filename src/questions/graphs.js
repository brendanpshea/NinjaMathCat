// Reading picture graphs and bar graphs: how many, which is most or fewest,
// how many more, and how many in all (1.MD.4, 2.MD.10, 3.MD.3).

import { atGrade, wrongNumbers } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * Something a class might count, and how to ask about it. Categories are
 * [label, picture] pairs; the questions name them by label.
 * @typedef {object} Survey
 * @property {string} title
 * @property {[string, string]} unit
 * @property {string} axis
 * @property {[string, string][]} categories
 * @property {(label: string) => string} howMany
 * @property {(more: string, fewer: string) => string} howManyMore
 * @property {string} most
 * @property {string} fewest
 * @property {string} total
 */

/** @param {string} label */
const lower = label => label.toLowerCase();

/** How each way of getting to school is said in a question. */
const GETTING_THERE = /** @type {Record<string, string>} */ ({
  Walk: "walk", Bus: "ride the bus", Car: "come by car", Bike: "ride a bike", Scooter: "ride a scooter",
});

/** @type {readonly Survey[]} */
const SURVEYS = [
  {
    title: "Our favorite fruit",
    unit: ["child", "children"],
    axis: "Number of children",
    categories: [["Apples", "🍎"], ["Bananas", "🍌"], ["Grapes", "🍇"], ["Oranges", "🍊"], ["Pears", "🍐"]],
    howMany: label => `How many children chose ${lower(label)}?`,
    howManyMore: (more, fewer) => `How many more children chose ${lower(more)} than ${lower(fewer)}?`,
    most: "Which fruit did the most children choose?",
    fewest: "Which fruit did the fewest children choose?",
    total: "How many children chose a fruit in all?",
  },
  {
    title: "Pets in our class",
    unit: ["pet", "pets"],
    axis: "Number of pets",
    categories: [["Dogs", "🐶"], ["Cats", "🐱"], ["Fish", "🐟"], ["Birds", "🐦"], ["Rabbits", "🐰"]],
    howMany: label => `How many ${lower(label)} are there?`,
    howManyMore: (more, fewer) => `How many more ${lower(more)} are there than ${lower(fewer)}?`,
    most: "Which pet is there the most of?",
    fewest: "Which pet is there the fewest of?",
    total: "How many pets are there in all?",
  },
  {
    title: "Weather this month",
    unit: ["day", "days"],
    axis: "Number of days",
    categories: [["Sunny", "🌞"], ["Rainy", "☔"], ["Cloudy", "⛅"], ["Snowy", "⛄"], ["Stormy", "⚡"]],
    howMany: label => `How many days were ${lower(label)}?`,
    howManyMore: (more, fewer) => `How many more days were ${lower(more)} than ${lower(fewer)}?`,
    most: "Which kind of weather came most often?",
    fewest: "Which kind of weather came least often?",
    total: "How many days does the graph show in all?",
  },
  {
    title: "How we get to school",
    unit: ["child", "children"],
    axis: "Number of children",
    categories: [["Walk", "🚶"], ["Bus", "🚌"], ["Car", "🚗"], ["Bike", "🚲"], ["Scooter", "🛴"]],
    howMany: label => `How many children ${GETTING_THERE[label]} to school?`,
    howManyMore: (more, fewer) => `How many more children ${GETTING_THERE[more]} than ${GETTING_THERE[fewer]}?`,
    most: "Which way do the most children get to school?",
    fewest: "Which way do the fewest children get to school?",
    total: "How many children does the graph show in all?",
  },
];

/**
 * What a grade's graphs hold: three categories in first grade (1.MD.4); four,
 * each picture or gridline worth one, in second (2.MD.10); scaled, each worth
 * 2, 5 or 10, in third (3.MD.3). `most` is the most pictures in a row, or
 * gridlines up a bar.
 * @type {readonly [number, { rows: number, scales: number[], most: number }][]}
 */
const PLANS = [
  [1.5, { rows: 3, scales: [1], most: 8 }],
  [2.5, { rows: 4, scales: [1], most: 10 }],
  [Infinity, { rows: 4, scales: [2, 5, 10], most: 8 }],
];

/**
 * A graph question about made-up survey data.
 * @param {Rng} rng
 * @param {number} grade
 * @param {"picture" | "bar"} style
 * @returns {Draft}
 */
function graphQuestion(rng, grade, style) {
  const plan = atGrade(grade, PLANS);
  const survey = rng.pick(SURVEYS);
  const scale = rng.pick(plan.scales);
  // A bar can end halfway between gridlines once the scale goes up in twos or tens.
  const unit = style === "bar" && grade >= 3 && scale % 2 === 0 ? scale / 2 : scale;
  const steps = Array.from({ length: (plan.most * scale) / unit }, (_, i) => (i + 1) * unit);
  // Different values, so "most" and "fewest" always have one answer.
  const values = rng.shuffle(steps).slice(0, plan.rows);
  const rows = rng.shuffle(survey.categories).slice(0, plan.rows).map(([label, icon], i) => ({ label, icon, value: values[i] }));

  const visual = style === "picture"
    ? /** @type {const} */ ({ kind: "picture_graph", title: survey.title, unit: survey.unit, each: scale, rows })
    : /** @type {const} */ ({
      kind: "bar_graph",
      title: survey.title,
      axis: survey.axis,
      scale,
      max: Math.ceil(Math.max(...values) / scale) * scale,
      bars: rows.map(({ label, value }) => ({ label, value })),
    });
  const where = style === "picture" ? "row" : "bar";
  const scaled = Number(scale > 1);

  const kinds = ["read", "compare", "total", ...(rows.length >= 4 ? ["most", "fewest"] : [])];
  const kind = rng.pick(kinds);

  if (kind === "most" || kind === "fewest") {
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    const answer = (kind === "most" ? sorted[0] : sorted[sorted.length - 1]).label;
    return {
      prompt: kind === "most" ? survey.most : survey.fewest,
      visual,
      answer,
      wrong: rng.shuffle(rows.map(r => r.label).filter(label => label !== answer)),
      hint: style === "picture" ? `Look for the ${kind === "most" ? "longest" : "shortest"} row.` : `Look for the ${kind === "most" ? "tallest" : "shortest"} bar.`,
      difficulty: 1 + scaled,
    };
  }

  if (kind === "compare") {
    const [a, b] = rng.shuffle(rows).slice(0, 2).sort((x, y) => y.value - x.value);
    const difference = a.value - b.value;
    return {
      prompt: survey.howManyMore(a.label, b.label),
      visual,
      answer: difference,
      // Adding instead, giving one of the two numbers, or a gridline out.
      wrong: wrongNumbers(rng, difference, [a.value + b.value, a.value, b.value, difference + scale, difference - scale], { spread: scale, min: 1 }),
      // With a picture for each one, the rows can be matched up, as children compare groups.
      hint: style === "picture" && scale === 1
        ? `Match up the ${a.label} row with the ${b.label} row. How many pictures are left over?`
        : `Find the ${a.label} number and the ${b.label} number, then take the smaller from the bigger.`,
      difficulty: Math.min(3, 2 + scaled),
    };
  }

  if (kind === "total") {
    const total = values.reduce((sum, v) => sum + v, 0);
    const smallest = Math.min(...values);
    return {
      prompt: survey.total,
      visual,
      answer: total,
      // Missing a row out, a step out, or counting pictures without the key.
      wrong: wrongNumbers(rng, total, [total - smallest, total + scale, total - scale, ...(scale > 1 ? [total / scale] : [total + smallest])], { spread: scale }),
      hint: `Find the number for every ${where}, then add them all up.`,
      difficulty: Math.min(3, 2 + scaled),
    };
  }

  const row = rng.pick(rows);
  return {
    prompt: survey.howMany(row.label),
    visual,
    answer: row.value,
    // Reading another row, a step out, or counting pictures without the key.
    wrong: wrongNumbers(rng, row.value, [
      ...rows.filter(r => r !== row).map(r => r.value), row.value + scale, row.value - scale, ...(scale > 1 ? [row.value / scale] : []),
    ], { spread: scale }),
    hint: style === "bar" ? `Find the top of the ${row.label} bar, then look across to the numbers.`
      : scale === 1 ? `Count the pictures in the ${row.label} row.`
      : `Count the pictures in the ${row.label} row. Each one stands for ${scale}.`,
    difficulty: 1 + scaled,
  };
}

/** @type {QuestionType} */
export const pictureGraph = {
  id: "picture_graph",
  name: "Picture graphs",
  generate: (rng, grade) => graphQuestion(rng, grade, "picture"),
};

/** @type {QuestionType} */
export const barGraph = {
  id: "bar_graph",
  name: "Bar graphs",
  generate: (rng, grade) => graphQuestion(rng, grade, "bar"),
};
