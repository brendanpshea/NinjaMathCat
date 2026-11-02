// 3rd grade's teaching scenes. docs/SCENES.md says how to write one.

import { formatClock } from "../questions/time.js";

/** @import { Scene, ScenePicture } from "../scenes.js" */

/**
 * @param {number} n
 * @param {string} one
 * @param {string} many
 */
const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * The multiples of `step` up to `times` of them, as a spoken list: "5, 10, 15".
 * @param {number} step
 * @param {number} times
 */
const countBy = (step, times) => Array.from({ length: times }, (_, i) => step * (i + 1)).join(", ");

/**
 * Whether every choice is a different number (or text).
 * @param {(string | number)[]} choices
 */
const allDifferent = choices => new Set(choices).size === choices.length;

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Equal groups, written as multiplying, counted by the group size (3.OA.1, 3.OA.3).
    chapter: "3-groups",
    steps(rng, { monster }) {
      const groups = rng.int(2, 6);
      const each = rng.pick([2, 3, 4, 5].filter(n => n !== groups));
      const total = groups * each;
      /** @param {number} n @param {number} per @param {string} [focus] */
      const bunches = (n, per, focus) => /** @type {ScenePicture} */ ({
        kind: "groups",
        rows: Array.from({ length: n }, (_, i) => ({ name: `bunch ${i + 1}`, emoji: "🎈", count: per })),
        ...(focus ? { focus } : {}),
      });
      /** @param {string} [focus] */
      const card = focus => /** @type {ScenePicture} */ ({
        kind: "math",
        lines: [[String(groups), "×", String(each)], Array.from({ length: groups }, (_, i) => String(each * (i + 1))).flatMap((n, i) => (i ? [",", n] : [n]))],
        ...(focus ? { focus } : {}),
      });
      // The check: other bunches, not the same as the first.
      let [more, per] = [groups, each];
      const wrongSums = () => [more + per, more * per + per, more * per - per];
      while ((more === groups && per === each) || more === per || !allDifferent([more * per, ...wrongSums()])) [more, per] = [rng.int(2, 6), rng.pick([2, 3, 4, 5])];
      const sum = more * per;
      return [
        { who: "monster", say: `I'm ${monster}! I float on the breeze with ${groups} bunches of balloons. How many balloons is that in all?`, picture: bunches(groups, each) },
        { who: "hero", say: `Look! This bunch has ${each} balloons, and so does every bunch. These are equal groups.`, picture: bunches(groups, each, "row-0") },
        {
          who: "hero",
          say: `${groups} groups of ${each} is written ${groups} times ${each}. The number of groups comes first.`,
          picture: { kind: "math", lines: [[String(groups), "×", String(each)]], focus: "line-0" },
        },
        {
          who: "monster",
          say: "Which number says how many groups? Tap it!",
          check: { kind: "tap", answers: ["t0-0"], retry: "Think about how many bunches I'm holding. Which number is that?", right: `Yes! ${groups} groups, so ${groups} comes first.` },
        },
        { who: "hero", say: `To find how many in all, count by ${each}s, once for each group: ${countBy(each, groups)}.`, picture: card("line-1") },
        { who: "hero", say: `The last number tells how many in all. ${groups} times ${each} is ${total}.`, picture: card(`t1-${2 * (groups - 1)}`) },
        {
          who: "monster",
          say: "Grr! Here are more bunches. How many balloons in all?",
          picture: bunches(more, per),
          check: {
            kind: "choose",
            choices: rng.shuffle([sum, ...wrongSums()]),
            answer: sum,
            retry: `Count by ${per}s, once for each bunch.`,
            right: `Yes! ${more} times ${per} is ${sum}.`,
          },
        },
        { who: "monster", say: "You count faster than I float! Now, let's battle!" },
      ];
    },
  },
  {
    // Sharing equally is multiplying backwards (3.OA.2, 3.OA.6).
    chapter: "3-sharing",
    steps(rng, { monster }) {
      const plates = rng.int(2, 5);
      const each = rng.pick([2, 3, 4, 5, 6].filter(n => n !== plates));
      const total = plates * each;
      /** @param {number} n */
      const pile = n => /** @type {ScenePicture} */ ({ kind: "objects", emoji: "🍅", count: n });
      const card = (/** @type {number} */ lines, /** @type {string} */ focus) => /** @type {ScenePicture} */ ({
        kind: "math",
        lines: [
          [String(total), "÷", String(plates)],
          [String(plates), "×", "?", "=", String(total)],
          Array.from({ length: each }, (_, i) => String(plates * (i + 1))).flatMap((n, i) => (i ? [",", n] : [n])),
        ].slice(0, lines),
        focus,
      });
      // The check: another pile, with a different answer, where taking the plates away can't also be right.
      let [p2, e2] = [plates, each];
      const wrongShares = () => [p2, p2 * e2 - p2, e2 + 1];
      while ((p2 === plates && e2 === each) || p2 === e2 || !allDifferent([e2, ...wrongShares()])) [p2, e2] = [rng.int(2, 5), rng.int(3, 6)];
      const total2 = p2 * e2;
      return [
        { who: "monster", say: `I'm ${monster}! My giant spoon scooped ${total} tomatoes. Share them equally onto ${plates} plates. How many on each plate?`, picture: pile(total) },
        { who: "hero", say: `Sharing ${total} into ${plates} equal groups is written ${total} divided by ${plates}.`, picture: card(1, "line-0") },
        { who: "hero", say: `Turn it around. ${plates} times what number makes ${total}?`, picture: card(2, "line-1") },
        { who: "hero", say: `Count by ${plates}s until you reach ${total}: ${countBy(plates, each)}. That took ${each} counts.`, picture: card(3, "line-2") },
        {
          who: "monster",
          say: "Which number is how many plates? Tap it!",
          // The plates are in the sum, the times fact, and the first count by them.
          check: { kind: "tap", answers: ["t0-2", "t1-0", "t2-0"], retry: "Think of the plates I am sharing onto. Which number counts them?", right: `Yes! ${plates} plates, so ${plates} groups.` },
        },
        {
          who: "hero",
          say: `So each plate gets ${each} tomatoes. ${total} divided by ${plates} is ${each}.`,
          picture: {
            kind: "groups",
            rows: Array.from({ length: plates }, (_, i) => ({ name: `plate ${i + 1}`, emoji: "🍅", count: each })),
            focus: "row-0",
          },
        },
        {
          who: "monster",
          say: `Mmm, more tomatoes! I have ${total2} for ${p2} plates. How many on each plate?`,
          picture: pile(total2),
          check: {
            kind: "choose",
            choices: rng.shuffle([e2, ...wrongShares()]),
            answer: e2,
            retry: `Count by ${p2}s until you reach ${total2}. How many counts did it take?`,
            right: `Yes! ${total2} divided by ${p2} is ${e2}.`,
          },
        },
        { who: "monster", say: "You share like a champ! Now, let's battle!" },
      ];
    },
  },
  {
    // Telling time to the minute on a clock (3.MD.1).
    chapter: "3-measures",
    steps(rng, { monster }) {
      const hour = rng.int(1, 12);
      const fives = rng.int(2, 8);
      const extra = rng.int(1, 4);
      const minutes = 5 * fives + extra;
      /** @param {string | string[]} [focus] */
      const clock = focus => /** @type {ScenePicture} */ ({ kind: "clock", hours: hour, minutes, ...(focus ? { focus } : {}) });
      // The check: another clock, whose hour is not its minute number (so swapped hands are a different time).
      let [h2, f2, e2] = [hour, fives, extra];
      while ((h2 === hour && f2 === fives && e2 === extra) || h2 === f2) [h2, f2, e2] = [rng.int(1, 12), rng.int(2, 8), rng.int(1, 4)];
      const m2 = 5 * f2 + e2;
      return [
        { who: "monster", say: `I'm ${monster}! My lamp has a clock, and I flicker on the dot. What time does it show?`, picture: clock() },
        { who: "hero", say: `The short hand is the hour hand. It has passed the ${hour} but not reached the ${(hour % 12) + 1}, so the hour is ${hour}.`, picture: clock("hour-hand") },
        { who: "hero", say: "The long hand is the minute hand. It tells how many minutes past the hour.", picture: clock("minute-hand") },
        {
          who: "monster",
          say: "Which hand tells the minutes? Tap it!",
          check: { kind: "tap", answers: ["minute-hand"], retry: "The hour hand is the short one. Look at the other hand.", right: "Yes! The long hand counts the minutes." },
        },
        { who: "hero", say: `The long hand is just past the ${fives}. Count by 5s to the ${fives}: ${countBy(5, fives)}. That is ${5 * fives} minutes.`, picture: clock(`number-${fives}`) },
        {
          who: "hero",
          say: `Then count ${extra} more little ${plural(extra, "mark", "marks")} past the ${fives}. That makes ${minutes} minutes, so the time is ${formatClock(hour, minutes)}.`,
          picture: clock("minute-hand"),
        },
        {
          who: "monster",
          say: "Grr! What time does this clock show?",
          picture: { kind: "clock", hours: h2, minutes: m2 },
          check: {
            kind: "choose",
            // The next hour; only the fives counted; hour and minute hands swapped.
            choices: rng.shuffle([formatClock(h2, m2), formatClock((h2 % 12) + 1, m2), formatClock(h2, 5 * f2), formatClock(f2, (5 * h2) % 60)]),
            answer: formatClock(h2, m2),
            retry: "The short hand gives the hour. Count the minutes by 5s, then by 1s.",
            right: `Yes! Hour ${h2}, and ${m2} minutes.`,
          },
        },
        { who: "monster", say: "You read my lamp clock! Now, let's battle!" },
      ];
    },
  },
  {
    // A harder fact is two easier facts added: 5 rows and the rest (3.OA.5, 3.OA.7).
    chapter: "3-two-step",
    steps(rng, { monster }) {
      const rows = rng.int(6, 9);
      const across = rng.pick([6, 7, 8, 9].filter(n => n !== rows));
      const rest = rows - 5;
      const total = rows * across;
      /** @param {number} r @param {number} c @param {string | string[]} [focus] */
      const tiles = (r, c, focus) => /** @type {ScenePicture} */ ({ kind: "area", shape: "rectangle", width: c, height: r, grid: true, ...(focus ? { focus } : {}) });
      const named = (/** @type {number} */ from, /** @type {number} */ to) => Array.from({ length: to - from }, (_, i) => `row-${from + i}`);
      // The check: another pile that isn't the same, nor 5 rows.
      let [r2, c2] = [rows, across];
      while ((r2 === rows && c2 === across) || r2 === c2) [r2, c2] = [rng.int(6, 9), rng.int(6, 9)];
      const total2 = r2 * c2;
      return [
        { who: "monster", say: `I'm ${monster}! I grabbed ${rows} rows of shiny gold tiles, ${across} in every row. How many tiles is that?`, picture: tiles(rows, across) },
        { who: "hero", say: `Big facts are easier in two pieces. First, the top 5 rows: 5 times ${across} is ${5 * across}.`, picture: tiles(rows, across, named(0, 5)) },
        {
          who: "monster",
          say: "Where do those 5 rows stop? Tap the 5th row!",
          check: { kind: "tap", answers: ["row-4"], retry: "Count the rows down from the top: 1, 2, 3, and on.", right: "Yes! The 5th row ends the first piece." },
        },
        { who: "hero", say: `The other ${rest} ${plural(rest, "row makes", "rows make")} the second piece: ${rest} times ${across} is ${rest * across}.`, picture: tiles(rows, across, named(5, rows)) },
        {
          who: "hero",
          say: `Add the two pieces: ${5 * across} plus ${rest * across} makes ${total}. So ${rows} times ${across} is ${total}.`,
          picture: { kind: "math", lines: [[String(5 * across), "+", String(rest * across)], [String(total)]], focus: "line-1" },
        },
        {
          who: "monster",
          say: "Grr! Here is another pile of gold. How many tiles?",
          picture: tiles(r2, c2),
          check: {
            kind: "choose",
            choices: rng.shuffle([total2, 5 * c2, r2 + c2, total2 + c2]),
            answer: total2,
            retry: "Split the rows into 5 and the rest. Multiply each piece, then add them.",
            right: `Yes! ${5 * c2} plus ${(r2 - 5) * c2} makes ${total2}.`,
          },
        },
        { who: "monster", say: "You took my gold in two easy pieces! Now, let's battle!" },
      ];
    },
  },
  {
    // The area of a rectangle: squares in a row times the rows (3.MD.5, 3.MD.7).
    chapter: "3-area",
    steps(rng, { monster }) {
      /** Sides that have the same area and perimeter (3 by 6, 4 by 4) make a muddle, so they are left out. */
      const pick = () => {
        for (;;) {
          const [w, h] = [rng.int(3, 7), rng.int(2, 6)];
          if (w !== h && (w - 2) * (h - 2) !== 4) return [w, h];
        }
      };
      const [width, height] = pick();
      const total = width * height;
      /** @param {number} w @param {number} h @param {string} [focus] */
      const floor = (w, h, focus) => /** @type {ScenePicture} */ ({ kind: "area", shape: "rectangle", width: w, height: h, grid: true, ...(focus ? { focus } : {}) });
      let [w2, h2] = [width, height];
      const wrongAreas = () => [w2 + h2, 2 * (w2 + h2), w2 * h2 - w2];
      while ((w2 === width && h2 === height) || !allDifferent([w2 * h2, ...wrongAreas()])) [w2, h2] = pick();
      return [
        { who: "monster", say: `I'm ${monster}! I sweep this floor. It's covered in square tiles. How many tiles cover it?`, picture: floor(width, height) },
        { who: "hero", say: "Each square tile is 1 square unit. The area is how many square units cover the floor.", picture: floor(width, height, "cell-0-0") },
        { who: "hero", say: `Count the squares in one row: ${width}.`, picture: floor(width, height, "row-0") },
        { who: "hero", say: `Now count the rows, down the side: ${height}.`, picture: floor(width, height, "column-0") },
        {
          who: "hero",
          say: `${height} rows of ${width} squares: ${height} times ${width} makes ${total}. The area is ${total} square units.`,
          picture: { kind: "math", lines: [[String(height), "×", String(width), "=", String(total)]], focus: "t0-4" },
        },
        {
          who: "monster",
          say: "Grr! Here is another floor. What is its area, in square units?",
          picture: floor(w2, h2),
          check: {
            kind: "choose",
            // Added instead of multiplied, or went all the way around.
            choices: rng.shuffle([w2 * h2, ...wrongAreas()]),
            answer: w2 * h2,
            retry: "Count the squares in one row, then count the rows. Rows of squares, so multiply.",
            right: `Yes! ${h2} rows of ${w2} is ${w2 * h2} square units.`,
          },
        },
        { who: "monster", say: "You cleaned up my floor! Now, let's battle!" },
      ];
    },
  },
  {
    // A fraction is equal parts of a whole: the bottom number counts all the parts, the top the ones we have (3.NF.1).
    chapter: "3-fractions",
    steps(rng, { monster }) {
      const parts = rng.pick([3, 4, 6, 8]);
      const shaded = rng.int(1, parts - 1);
      /** @param {"bar" | "circle"} model @param {number} d @param {number} n @param {string | string[]} [focus] */
      const jelly = (model, d, n, focus) => /** @type {ScenePicture} */ ({ kind: "fraction", model, parts: d, shaded: n, ...(focus ? { focus } : {}) });
      // The check: a round jelly, cut differently, where the shaded part is not half (2/4 would equal 1/2).
      let [d2, n2] = [parts, shaded];
      while ((d2 === parts && n2 === shaded) || 2 * n2 === d2) {
        d2 = rng.pick([3, 4, 6, 8]);
        n2 = rng.int(1, d2 - 1);
      }
      return [
        { who: "monster", say: `I'm ${monster}, a jiggly lime jelly! I'm cut into equal parts, and I gobbled the blue ones. What fraction did I gobble?`, picture: jelly("bar", parts, shaded) },
        { who: "hero", say: `You are cut into ${parts} equal parts. The bottom number says how many equal parts: ${parts}.`, picture: jelly("bar", parts, shaded, Array.from({ length: parts }, (_, i) => `part-${i}`)) },
        { who: "hero", say: `${shaded} of the ${parts} parts ${plural(shaded, "is", "are")} blue. The top number counts the blue parts: ${shaded}.`, picture: jelly("bar", parts, shaded, "shaded") },
        { who: "hero", say: `So ${shaded}/${parts} of you is gobbled.`, picture: { kind: "math", lines: [[String(shaded), "/", String(parts)]], focus: "line-0" } },
        {
          who: "monster",
          say: "Which number says how many equal parts there are in all? Tap it!",
          check: { kind: "tap", answers: ["t0-2"], retry: "Picture the whole jelly cut up. Which number counts all of its parts?", right: `Yes! ${parts} equal parts in all.` },
        },
        {
          who: "monster",
          say: "Grr! Here is a round jelly. What fraction is blue?",
          picture: jelly("circle", d2, n2),
          check: {
            kind: "choose",
            // Turned upside down, the part that is left, and blue over not blue.
            choices: rng.shuffle([`${n2}/${d2}`, `${d2}/${n2}`, `${d2 - n2}/${d2}`, `${n2}/${d2 - n2}`]),
            answer: `${n2}/${d2}`,
            retry: "Count all the equal parts for the bottom number. Count the blue parts for the top.",
            right: `Yes! ${n2} blue ${plural(n2, "part", "parts")} out of ${d2}.`,
          },
        },
        { who: "monster", say: "You cut me down to size! Now, let's battle!" },
      ];
    },
  },
  {
    // Reading a picture graph: read the key, count the pictures, multiply (3.MD.3).
    chapter: "3-graphs",
    steps(rng, { monster }) {
      /** @param {number} each @param {number[]} counts */
      const graph = (each, counts) => /** @type {ScenePicture} */ ({
        kind: "picture_graph",
        title: "Ink blots on each page",
        unit: ["blot", "blots"],
        each,
        rows: counts.map((c, i) => ({ label: `Page ${i + 1}`, icon: "⚫", value: c * each })),
      });
      /** Four different counts, and the row to ask about, which has 3 or more. */
      const make = () => {
        const counts = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);
        const rows = counts.map((c, i) => [c, i]).filter(([c]) => c >= 3);
        const [count, row] = rng.pick(rows);
        return { counts, count, row };
      };
      const each = rng.pick([2, 5, 10]);
      const { counts, count, row } = make();
      const value = count * each;
      const most = counts.indexOf(Math.max(...counts));
      let other = make();
      let each2 = rng.pick([2, 5, 10]);
      while (each2 === each && other.counts.join() === counts.join()) other = make();
      const value2 = other.count * each2;
      return [
        { who: "monster", say: `I'm ${monster}! I splashed ink blots on 4 pages. This graph counts them. How many blots are on page ${row + 1}?`, picture: graph(each, counts) },
        { who: "hero", say: `First, read the key. Each picture stands for ${each} blots, not 1.` },
        { who: "hero", say: `This is the row for page ${row + 1}. Count its pictures: ${count}.`, picture: { ...graph(each, counts), focus: `row-${row}` } },
        {
          who: "monster",
          say: "Which page has the most blots? Tap its row!",
          check: { kind: "tap", answers: [`row-${most}`], retry: "Look for the row with the most pictures.", right: "Yes! The most pictures mean the most blots." },
        },
        {
          who: "hero",
          say: `${count} pictures, ${each} blots each: ${count} times ${each} is ${value}. So page ${row + 1} has ${value} blots.`,
          picture: { kind: "math", lines: [[String(count), "×", String(each), "=", String(value)]], focus: "t0-4" },
        },
        {
          who: "monster",
          say: `Grr! Here is another graph. How many blots are on page ${other.row + 1}?`,
          picture: graph(each2, other.counts),
          check: {
            kind: "choose",
            // The pictures counted as ones, the key added, and one picture too many.
            choices: rng.shuffle([value2, other.count, other.count + each2, value2 + each2]),
            answer: value2,
            retry: "Read the key first. Count the pictures in the row, then count by the number in the key.",
            right: `Yes! ${other.count} pictures of ${each2} make ${value2}.`,
          },
        },
        { who: "monster", say: "You read me like a book! Now, let's battle!" },
      ];
    },
  },
  {
    // Perimeter: the distance all the way round, every side added (3.MD.8).
    chapter: "3-perimeter",
    steps(rng, { monster }) {
      const width = rng.int(4, 9);
      const height = rng.int(2, width - 1);
      const around = 2 * (width + height);
      /** @param {number} w @param {number} h @param {string | string[]} [focus] */
      const lid = (w, h, focus) => /** @type {ScenePicture} */ ({ kind: "area", shape: "rectangle", width: w, height: h, grid: false, labels: { base: `${w} cm`, height: `${h} cm` }, ...(focus ? { focus } : {}) });
      // The check's lid, where the perimeter, the area, half way round and three sides are all different.
      let [w2, h2] = [width, height];
      const wrongs = () => [w2 * h2, w2 + h2, 2 * w2 + h2];
      while ((w2 === width && h2 === height) || new Set([2 * (w2 + h2), ...wrongs()]).size < 4) [w2, h2] = [rng.int(4, 9), rng.int(2, 3)];
      return [
        { who: "monster", say: `I'm ${monster}! I want a gold ribbon all the way around my lid. How long must my ribbon be?`, picture: lid(width, height) },
        { who: "hero", say: "The distance all the way around a shape is its perimeter. We add up every side.", picture: lid(width, height, ["side-top", "side-right", "side-bottom", "side-left"]) },
        { who: "hero", say: `The bottom is ${width} centimeters. The top is just as long: ${width} centimeters too.`, picture: lid(width, height, ["side-top", "side-bottom"]) },
        { who: "hero", say: `The left side is ${height} centimeters, and so is the right side.`, picture: lid(width, height, ["side-left", "side-right"]) },
        {
          who: "hero",
          say: `${width} plus ${width} plus ${height} plus ${height} is ${around}. The ribbon must be ${around} centimeters long.`,
          picture: { kind: "math", lines: [[String(width), "+", String(width), "+", String(height), "+", String(height), "=", String(around)]], focus: "t0-8" },
        },
        {
          who: "monster",
          say: "Which side is just as long as my left side, with no number on it? Tap it!",
          picture: lid(width, height),
          check: { kind: "tap", answers: ["side-right"], retry: "A rectangle's sides come in pairs, across from each other.", right: `Yes! The right side is ${height} centimeters too.` },
        },
        {
          who: "monster",
          say: `Grr! My other lid is ${w2} centimeters long and ${h2} centimeters wide. What is its perimeter, in centimeters?`,
          picture: lid(w2, h2),
          check: {
            kind: "choose",
            choices: rng.shuffle([2 * (w2 + h2), ...wrongs()]),
            answer: 2 * (w2 + h2),
            retry: "Go all the way around: two lengths and two widths. Add all four sides.",
            right: `Yes! ${w2} plus ${w2} plus ${h2} plus ${h2} is ${2 * (w2 + h2)}.`,
          },
        },
        { who: "monster", say: "You wrapped my lid in gold! Now, let's battle!" },
      ];
    },
  },
];
