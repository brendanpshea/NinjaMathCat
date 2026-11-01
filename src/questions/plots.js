// Line plots of measurements in fractions of a unit (3.MD.4, 4.MD.4, 5.MD.2),
// and in sixth grade dot plots and histograms (6.SP.4), their centre and
// spread (6.SP.2), and which questions call for data at all (6.SP.1).

import { atGrade, wrongNumbers } from "./common.js";
import { rulerText } from "./rational.js";

/** @import { Draft, QuestionType, LinePlot } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/** Things to measure, in inches. */
const MEASURED = [
  { title: "Lengths of ribbons (inches)", one: "ribbon", many: "ribbons", size: "long", more: "longer" },
  { title: "Lengths of pencils (inches)", one: "pencil", many: "pencils", size: "long", more: "longer" },
  { title: "Lengths of worms (inches)", one: "worm", many: "worms", size: "long", more: "longer" },
  { title: "Heights of seedlings (inches)", one: "seedling", many: "seedlings", size: "tall", more: "taller" },
  { title: "Lengths of leaves (inches)", one: "leaf", many: "leaves", size: "long", more: "longer" },
];

/**
 * What a grade's line plots measure to, and what they ask. Third grade
 * measures to halves and fourths (3.MD.4); fourth adds eighths and
 * subtracts lengths (4.MD.4); fifth adds and multiplies them (5.MD.2).
 * @type {readonly [number, { dens: number[], positions: [number, number], kinds: string[] }][]}
 */
const LINE_PLOTS = [
  [3.5, { dens: [2, 4, 4], positions: [5, 7], kinds: ["count", "count", "total", "most", "more"] }],
  [4.5, { dens: [2, 4, 8], positions: [6, 8], kinds: ["count", "most", "longer", "spread", "spread", "endToEnd"] }],
  [Infinity, { dens: [4, 8, 8], positions: [6, 9], kinds: ["longer", "spread", "endToEnd", "endToEnd", "allTogether"] }],
];

/**
 * Counts for a line plot: a few at each position, with exactly one most
 * common, and something at both ends.
 * @param {Rng} rng
 * @param {number} positions
 * @param {number} most  the biggest count
 */
function plotCounts(rng, positions, most) {
  const counts = Array.from({ length: positions }, () => rng.int(0, most - 1));
  counts[rng.int(0, positions - 1)] = most;
  for (const end of [0, positions - 1]) if (counts[end] === 0) counts[end] = 1;
  return counts;
}

/**
 * Wrong lengths near a right one, a step or two of 1/den either way, and
 * any others likely, never worth the same as it or nothing at all.
 * @param {Rng} rng
 * @param {number} units  the answer, in 1/den steps
 * @param {number} den
 * @param {number[]} likely  other wrong answers, in the same steps
 */
function wrongLengths(rng, units, den, likely) {
  const near = rng.shuffle([units - 1, units + 1, units - 2, units + 2]);
  return [...likely, ...near].filter(u => u > 0 && u !== units).map(u => rulerText(u, den));
}

/** @type {QuestionType} */
export const linePlot = {
  id: "line_plot",
  name: "Line plots",
  generate(rng, grade) {
    const plan = atGrade(grade, LINE_PLOTS);
    const thing = rng.pick(MEASURED);
    const den = rng.pick(plan.dens);
    const positions = rng.int(...plan.positions);
    // Lengths from half an inch to 5 inches.
    const from = rng.int(Math.max(1, den / 2), 5 * den - positions + 1);
    const counts = plotCounts(rng, positions, rng.int(3, 5));
    /** @type {LinePlot} */
    const visual = { kind: "line_plot", title: thing.title, den, from, counts };
    const at = (/** @type {number} */ i) => rulerText(from + i, den);
    /** A length with its unit: 3/4 inch, 1 inch, 2 1/2 inches. */
    const inches = (/** @type {number} */ i) => `${at(i)} ${from + i > den ? "inches" : "inch"}`;
    const total = counts.reduce((a, b) => a + b, 0);
    const pick = () => rng.int(0, positions - 1);

    switch (rng.pick(plan.kinds)) {
      case "count": {
        const i = pick();
        return {
          prompt: `How many ${thing.many} are ${inches(i)} ${thing.size}?`,
          visual,
          answer: counts[i],
          // The count next door, or every X on the plot.
          wrong: wrongNumbers(rng, counts[i], [counts[i - 1] ?? -1, counts[i + 1] ?? -1, total].filter(n => n >= 0)),
          hint: `Find ${at(i)} under the line, then count the Xs above it.`,
          difficulty: 1,
        };
      }
      case "total": return {
        prompt: `How many ${thing.many} were measured?`,
        visual,
        answer: total,
        // One for each length, or only the tallest stack.
        wrong: wrongNumbers(rng, total, [positions, Math.max(...counts), total - counts[0]], { min: 1 }),
        hint: `Each X is one ${thing.one}. Count all the Xs.`,
        difficulty: 1,
      };
      case "most": {
        const best = counts.indexOf(Math.max(...counts));
        const others = counts.map((c, i) => [c, i]).filter(([, i]) => i !== best).sort((a, b) => b[0] - a[0]).map(([, i]) => at(i));
        return {
          prompt: `Which length do the most ${thing.many} have?`,
          visual,
          answer: at(best),
          // The next most common lengths.
          wrong: others,
          hint: "Look for the tallest stack of Xs.",
          difficulty: 1,
        };
      }
      case "more": {
        let [i, j] = [pick(), pick()];
        while (counts[i] === counts[j]) [i, j] = [pick(), pick()];
        if (counts[i] < counts[j]) [i, j] = [j, i];
        const answer = counts[i] - counts[j];
        return {
          prompt: `How many more ${thing.many} are ${inches(i)} ${thing.size} than ${inches(j)}?`,
          visual,
          answer,
          wrong: wrongNumbers(rng, answer, [counts[i], counts[j], counts[i] + counts[j]], { min: 1 }),
          hint: `Count the Xs above ${at(i)} and above ${at(j)}, then find the difference.`,
          difficulty: 2,
        };
      }
      case "longer": {
        const i = rng.int(1, positions - 2);
        const answer = counts.slice(i + 1).reduce((a, b) => a + b, 0);
        return {
          prompt: `How many ${thing.many} are ${thing.more} than ${inches(i)}?`,
          visual,
          answer,
          // Counting the ones at that length too, or the shorter ones.
          wrong: wrongNumbers(rng, answer, [answer + counts[i], total - answer, total - answer - counts[i]].filter(n => n !== answer)),
          hint: `Add up the Xs to the right of ${at(i)}, but not the ones above it.`,
          difficulty: 2,
        };
      }
      case "spread": {
        const ends = counts.map((c, i) => (c > 0 ? i : -1)).filter(i => i >= 0);
        const [low, high] = [ends[0], ends[ends.length - 1]];
        const units = high - low;
        return {
          prompt: `How much ${thing.more} is the ${thing.size === "tall" ? "tallest" : "longest"} ${thing.one} than the shortest?`,
          visual,
          answer: rulerText(units, den),
          // The longest length itself, or the two added.
          wrong: wrongLengths(rng, units, den, [from + high, 2 * from + low + high]),
          hint: `Take the shortest length, ${at(low)}, away from the longest, ${at(high)}.`,
          difficulty: 2 + Number(den === 8),
        };
      }
      case "endToEnd": {
        const choices = counts.map((c, i) => (c > 1 ? i : -1)).filter(i => i >= 0);
        const i = choices.length > 0 ? rng.pick(choices) : counts.indexOf(Math.max(...counts));
        const units = counts[i] * (from + i);
        return {
          prompt: `All the ${thing.many} that are ${inches(i)} ${thing.size} are laid end to end. How long is the line they make, in inches?`,
          visual,
          answer: rulerText(units, den),
          // One too many or too few, or the count added to the length.
          wrong: wrongLengths(rng, units, den, [(counts[i] + 1) * (from + i), (counts[i] - 1) * (from + i), counts[i] * den + from + i]),
          hint: `There are ${counts[i]} of them, each ${inches(i)}: ${counts[i]} × ${at(i)}.`,
          difficulty: 2,
        };
      }
      default: {
        const units = counts.reduce((sum, c, i) => sum + c * (from + i), 0);
        return {
          prompt: `All the ${thing.many} are laid end to end. How long is the line they make, in inches?`,
          visual,
          answer: rulerText(units, den),
          // Each length counted once, or a stack missed.
          wrong: wrongLengths(rng, units, den, [counts.reduce((sum, c, i) => sum + (c > 0 ? from + i : 0), 0), units - (from + positions - 1)]),
          hint: "Multiply each length by how many have it, then add them all up.",
          difficulty: 3,
        };
      }
    }
  },
};

/**
 * Whole-number data for a dot plot.
 * `did` says what was done that many times: "read 3 books".
 * @type {readonly { title: string, who: string, what: string, did: (amount: string) => string, from: number, positions: number }[]}
 */
const DOT_PLOTS = [
  { title: "Pets each student has", who: "students", what: "pets", did: n => `have ${n} pets`, from: 0, positions: 7 },
  { title: "Goals scored in each game", who: "games", what: "goals", did: n => `had ${n} goals`, from: 0, positions: 8 },
  { title: "Books each student read this month", who: "students", what: "books", did: n => `read ${n} books`, from: 1, positions: 9 },
  { title: "Hours of sleep last night", who: "students", what: "hours", did: n => `slept ${n} hours`, from: 6, positions: 6 },
];

/**
 * Histograms of counts in intervals.
 * @type {readonly { title: string, who: string, did: (amount: string) => string }[]}
 */
const HISTOGRAMS = [
  { title: "Books students read this year", who: "students", did: n => `read ${n} books` },
  { title: "Minutes students spent on homework", who: "students", did: n => `spent ${n} minutes on homework` },
  { title: "Points scored by players", who: "players", did: n => `scored ${n} points` },
];

/**
 * Questions that call for data that varies, beside ones with a single answer
 * (6.SP.1).
 */
export const STATISTICAL = [
  "How many hours do the students in my class sleep each night?",
  "How tall are the players on the basketball team?",
  "How many pets do the families on my street have?",
  "How long does it take the students in my school to get to school?",
  "How many books did each student in our grade read this summer?",
];
export const NOT_STATISTICAL = [
  "How many hours did I sleep last night?",
  "How tall is the school's flagpole?",
  "How many pets does my family have?",
  "How many days are in a week?",
  "How long is the school day today?",
  "What is my teacher's favorite color?",
  "How many students are in my class right now?",
];

/** @type {QuestionType} */
export const dataDisplays = {
  id: "data_displays",
  name: "Dot plots and histograms",
  generate(rng) {
    switch (rng.pick(["dot", "dot", "histogram", "statistical"])) {
      case "dot": return dotPlot(rng);
      case "histogram": return histogram(rng);
      default: return {
        prompt: "Which is a statistical question, one whose answers would vary?",
        answer: rng.pick(STATISTICAL),
        wrong: rng.shuffle(NOT_STATISTICAL),
        hint: "A statistical question has many answers to collect, from many people or things, not just one.",
        difficulty: 1,
      };
    }
  },
};

/**
 * The median, mode or range of a dot plot, or how many lie past a value.
 * @param {Rng} rng
 * @returns {Draft}
 */
function dotPlot(rng) {
  const data = rng.pick(DOT_PLOTS);
  const counts = plotCounts(rng, data.positions, rng.int(3, 5));
  // An odd count, so the median is one of the values; one more on the
  // tallest stack keeps the mode the only one.
  if (counts.reduce((a, b) => a + b, 0) % 2 === 0) counts[counts.indexOf(Math.max(...counts))] += 1;
  /** @type {LinePlot} */
  const visual = { kind: "line_plot", title: data.title, den: 1, from: data.from, counts };
  const values = counts.flatMap((c, i) => Array(c).fill(data.from + i));
  const median = values[(values.length - 1) / 2];
  const mode = data.from + counts.indexOf(Math.max(...counts));
  const [low, high] = [values[0], values[values.length - 1]];
  const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  switch (rng.pick(["median", "median", "mode", "range", "more"])) {
    case "median": return {
      prompt: `What is the median number of ${data.what}?`,
      visual,
      answer: median,
      // The most common value, the middle of the scale, or the middle of the range.
      wrong: wrongNumbers(rng, median, [mode, mean, Math.round((low + high) / 2), data.from + Math.floor(data.positions / 2)].filter(n => n !== median)),
      hint: `There are ${values.length} dots. Count in from both ends to the one in the middle.`,
      difficulty: 2,
    };
    case "mode": return {
      prompt: `What is the mode, the most common number of ${data.what}?`,
      visual,
      answer: mode,
      // How many have it, or the median.
      wrong: wrongNumbers(rng, mode, [Math.max(...counts), median].filter(n => n !== mode)),
      hint: "The mode is the value with the tallest stack.",
      difficulty: 1,
    };
    case "range": return {
      prompt: `What is the range of the numbers of ${data.what}?`,
      visual,
      answer: high - low,
      // The highest value, or the tallest stack.
      wrong: wrongNumbers(rng, high - low, [high, high - low + 1, Math.max(...counts)].filter(n => n !== high - low), { min: 1 }),
      hint: `The range is the highest value take away the lowest.`,
      difficulty: 1,
    };
    default: {
      const cut = data.from + rng.int(1, data.positions - 3);
      const answer = values.filter(v => v > cut).length;
      return {
        prompt: `How many ${data.who} ${data.did(`more than ${cut}`)}?`,
        visual,
        answer,
        wrong: wrongNumbers(rng, answer, [values.filter(v => v >= cut).length, values.length - answer].filter(n => n !== answer)),
        hint: `Count the dots to the right of ${cut}, not the ones above it.`,
        difficulty: 2,
      };
    }
  }
}

/**
 * Reading a histogram (6.SP.4).
 * @param {Rng} rng
 * @returns {Draft}
 */
function histogram(rng) {
  const data = rng.pick(HISTOGRAMS);
  const bins = rng.int(4, 5);
  const width = rng.pick([5, 10]);
  const values = Array.from({ length: bins }, () => rng.int(1, 12));
  const scale = 2;
  const labels = values.map((_, i) => `${i * width}–${(i + 1) * width - 1}`);
  const visual = {
    kind: /** @type {const} */ ("bar_graph"),
    title: data.title,
    axis: `Number of ${data.who}`,
    scale,
    max: Math.ceil(Math.max(...values) / scale) * scale,
    bars: values.map((value, i) => ({ label: labels[i], value })),
    histogram: true,
  };
  const total = values.reduce((a, b) => a + b, 0);
  if (rng.chance(0.5)) {
    const i = rng.int(0, bins - 1);
    return {
      prompt: `How many ${data.who} ${data.did(`${i * width} to ${(i + 1) * width - 1}`)}?`,
      visual,
      answer: values[i],
      wrong: wrongNumbers(rng, values[i], [values[i - 1] ?? -1, values[i + 1] ?? -1].filter(n => n >= 0 && n !== values[i])),
      hint: "Find that interval's bar and read across to the scale.",
      difficulty: 1,
    };
  }
  const cut = rng.int(1, bins - 1);
  const answer = values.slice(0, cut).reduce((a, b) => a + b, 0);
  return {
    prompt: `How many ${data.who} ${data.did(`fewer than ${cut * width}`)}?`,
    visual,
    answer,
    // Only the last bar before it, or everyone else.
    wrong: wrongNumbers(rng, answer, [values[cut - 1], total - answer, answer + values[cut]].filter(n => n !== answer), { min: 1 }),
    hint: `Add up the bars for the intervals below ${cut * width}.`,
    difficulty: 2,
  };
}

