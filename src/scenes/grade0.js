// Kindergarten's teaching scenes. docs/SCENES.md says how to write one.

/** @import { Scene, ScenePicture } from "../scenes.js" */

/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** The items from `from` up to (not including) `to`, as names for a ring. @param {number} from @param {number} to */
const items = (from, to) => Array.from({ length: to - from }, (_, i) => `item-${from + i}`);

/**
 * Four different choices with the right one among them: the usual mistakes
 * first, then numbers next to the answer.
 * @param {import("../rng.js").Rng} rng @param {number} answer @param {number[]} mistakes
 */
const choicesFor = (rng, answer, mistakes) => {
  const all = [answer, ...mistakes, answer + 1, answer - 1, answer + 2, answer - 2, answer + 3].filter(c => c >= 0);
  return rng.shuffle([...new Set(all)].slice(0, 4));
};

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Count by touching each thing once; the last number says how many (K.CC.4-5).
    chapter: "0-counting",
    steps(rng, { monster }) {
      const n = rng.int(3, 8);
      let m = n;
      while (m === n) m = rng.int(3, 8);
      /** @param {number} k @param {string | string[]} [focus] */
      const apples = (k, focus) => /** @type {ScenePicture} */ ({ kind: "objects", emoji: "🍎", count: k, ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I hid my apples. Bet you can't count them!`, picture: apples(n) },
        { who: "hero", say: "Touch each apple just once. Say 1 for this one.", picture: apples(n, "item-0") },
        { who: "hero", say: "Say 2 for the next apple.", picture: apples(n, "item-1") },
        { who: "hero", say: `Keep going to the last apple. Say ${n}.`, picture: apples(n, `item-${n - 1}`) },
        { who: "hero", say: `${n} is the last number I said. So there are ${n} apples.`, picture: apples(n, items(0, n)) },
        {
          who: "monster",
          say: "Hmph. Count my new apples. How many are there?",
          picture: apples(m),
          check: { kind: "choose", choices: choicesFor(rng, m, []), answer: m, retry: "Touch each apple once, and say the next number each time.", right: `Yes! The last number is ${m}.` },
        },
        { who: "monster", say: "You counted them all! Now, let's battle!" },
      ];
    },
  },
  {
    // The next number is one hop to the right (K.CC.2).
    chapter: "0-next",
    steps(rng, { monster }) {
      const n = rng.int(1, 8);
      let m = n;
      while (Math.abs(m - n) < 2) m = rng.int(1, 8);
      /** @param {number} at @param {boolean} hop @param {string} [focus] */
      const line = (at, hop, focus) => /** @type {ScenePicture} */ ({ kind: "number_line", den: 1, from: 0, to: 10, tick: 1, label: 1, points: [at], jumps: hop ? [[at, at + 1]] : [], ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I sweep numbers away. What comes after ${n}?`, picture: line(n, false) },
        { who: "hero", say: `Here is ${n}. Let's hop one step to the right.`, picture: line(n, false, `point-${n}`) },
        { who: "hero", say: "One hop takes us to the next number.", picture: line(n, true, "jump-0") },
        { who: "hero", say: `We land on ${n + 1}. ${n + 1} comes right after ${n}.`, picture: line(n, true, `tick-${n + 1}`) },
        {
          who: "monster",
          say: `Hmph. Here is ${m}. What comes after ${m}? Tap it!`,
          picture: line(m, false),
          check: { kind: "tap", answers: [`tick-${m + 1}`], retry: "Hop one step to the right of the dot.", right: `Yes! ${m + 1} comes right after ${m}.` },
        },
        { who: "monster", say: "You know the order! Now, let's battle!" },
      ];
    },
  },
  {
    // A flat shape is named by its sides and corners (K.G.2).
    chapter: "0-shapes",
    steps(rng, { monster }) {
      const facts = /** @type {const} */ ([["circle", 0], ["triangle", 3], ["square", 4], ["rectangle", 4], ["hexagon", 6]]);
      const [[name, sides], second] = rng.shuffle([...facts]);
      const shapeOf = /** @param {string} shape */ shape => /** @type {ScenePicture} */ ({ kind: "shape", shape });
      return [
        { who: "monster", say: `I'm ${monster}! I stir shapes into my soup. Look at this one!`, picture: shapeOf(name) },
        { who: "hero", say: "A side is a straight edge. Let's count the sides." },
        { who: "hero", say: sides === 0 ? "This shape has no sides and no corners. It is round." : `This shape has ${sides} sides and ${sides} corners.` },
        // Counts alone don't tell a square from a rectangle: their sides do.
        {
          who: "hero",
          say: sides === 0 ? "A round shape with no corners is a circle."
            : name === "square" ? "A shape with 4 sides, all the same length, is a square."
            : name === "rectangle" ? "A shape with 4 sides, 2 long and 2 short, is a rectangle."
            : `A shape with ${sides} sides and ${sides} corners is a ${name}.`,
        },
        {
          who: "monster",
          say: "Grr! Here is another shape. How many sides does it have?",
          picture: shapeOf(second[0]),
          check: { kind: "choose", choices: choicesFor(rng, second[1], []), answer: second[1], retry: "Count the straight edges, one at a time.", right: second[1] === 0 ? "Yes! It has no sides." : `Yes! It has ${second[1]} sides.` },
        },
        { who: "monster", say: "You know your shapes! Now, let's battle!" },
      ];
    },
  },
  {
    // The group you count later is the bigger one (K.CC.6).
    chapter: "0-more",
    steps(rng, { monster }) {
      const [a, b] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
      const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
      const bigger = a > b ? 0 : 1;
      /** @param {string} [focus] */
      const hoard = focus => /** @type {ScenePicture} */ ({ kind: "groups", rows: [{ name: "gems", emoji: "💎", count: a }, { name: "coins", emoji: "🪙", count: b }], ...(focus ? { focus } : {}) });
      const [x, y, z] = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const rows = [{ name: "frogs", emoji: "🐸", count: x }, { name: "dogs", emoji: "🐶", count: y }, { name: "birds", emoji: "🐦", count: z }];
      const most = rows.findIndex(r => r.count === Math.max(x, y, z));
      return [
        { who: "monster", say: `I'm ${monster}! I grabbed these shiny things. They're all mine!`, picture: hoard() },
        { who: "hero", say: `Let's count. I see ${a} gems.`, picture: hoard("row-0") },
        { who: "hero", say: `And I see ${b} coins.`, picture: hoard("row-1") },
        { who: "hero", say: `We say ${hi} later than ${lo} when we count. So ${hi} is more.`, picture: hoard(`row-${bigger}`) },
        {
          who: "monster",
          say: "Hmph. Which group has the most? Tap it!",
          picture: { kind: "groups", rows },
          check: { kind: "tap", answers: [`row-${most}`], retry: "Count each row. The most is the number we say last.", right: "Yes! That row has the most." },
        },
        { who: "monster", say: "You beat my counting! Now, let's battle!" },
      ];
    },
  },
  {
    // Adding puts two groups together (K.OA.1-2).
    chapter: "0-adding",
    steps(rng, { monster }) {
      const a = rng.int(1, 5);
      const b = rng.int(1, 5);
      const sum = a + b;
      const [c, d] = [rng.int(1, 5), rng.int(1, 5)];
      /** @param {number} p @param {number} q @param {string | string[]} [focus] */
      const sweets = (p, q, focus) => /** @type {ScenePicture} */ ({ kind: "pattern", items: [...Array(p).fill("🍬"), ...Array(q).fill("🍭")], ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I float ${count(a, "candy", "candies")} and ${count(b, "lollipop", "lollipops")}. How many in all?`, picture: sweets(a, b) },
        { who: "hero", say: `Here ${a === 1 ? "is" : "are"} ${count(a, "candy", "candies")}.`, picture: sweets(a, b, items(0, a)) },
        { who: "hero", say: `Here ${b === 1 ? "is" : "are"} ${count(b, "lollipop", "lollipops")}.`, picture: sweets(a, b, items(a, sum)) },
        { who: "hero", say: `Adding puts them together. Count them all: ${sum}.`, picture: sweets(a, b, items(0, sum)) },
        { who: "hero", say: `${a} and ${b} more make ${sum}. That is adding!`, picture: { kind: "math", lines: [[`${a}`, "+", `${b}`, "=", `${sum}`]], focus: "line-0" } },
        {
          who: "monster",
          say: "Hmph. How many sweets are there in all?",
          picture: sweets(c, d),
          check: { kind: "choose", choices: choicesFor(rng, c + d, [Math.max(c, d)]), answer: c + d, retry: "Put both groups together. Then count them all.", right: `Yes! ${c} and ${d} make ${c + d}.` },
        },
        { who: "monster", say: "You add so well! Now, let's battle!" },
      ];
    },
  },
  {
    // Taking away makes a group smaller; count what is left (K.OA.1-2).
    chapter: "0-taking",
    steps(rng, { monster }) {
      const n = rng.int(4, 9);
      const k = rng.int(1, n - 1);
      const left = n - k;
      const [n2, k2] = (() => { const t = rng.int(4, 9); return [t, rng.int(1, t - 1)]; })();
      /** @param {number} total @param {number} gone @param {string | string[]} [focus] */
      const shells = (total, gone, focus) => /** @type {ScenePicture} */ ({ kind: "objects", emoji: "🐚", count: total, ...(gone ? { crossed: gone } : {}), ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I have ${n} shells. Pinch! Watch me.`, picture: shells(n, 0) },
        { who: "hero", say: `Look! ${k} ${k === 1 ? "shell is" : "shells are"} crossed out. ${k === 1 ? "It is" : "They are"} taken away.`, picture: shells(n, k, "crossed") },
        // No ring round the shells left: they can sit in two rows, and one box round them would take in the crossed-out ones.
        { who: "hero", say: "Taking away makes the group smaller. Count what is left.", picture: shells(n, k) },
        { who: "hero", say: `${count(left, "shell is", "shells are")} left.` },
        { who: "hero", say: `${n} take away ${k} leaves ${left}.`, picture: { kind: "math", lines: [[`${n}`, "−", `${k}`, "=", `${left}`]], focus: "line-0" } },
        {
          who: "monster",
          say: "Pinch! How many shells are left now?",
          picture: shells(n2, k2),
          check: { kind: "choose", choices: choicesFor(rng, n2 - k2, [k2]), answer: n2 - k2, retry: "Count only the shells that are not crossed out.", right: `Yes! ${count(n2 - k2, "shell is", "shells are")} left.` },
        },
        { who: "monster", say: "Sorry! You are too good. Now, let's battle!" },
      ];
    },
  },
  {
    // Two numbers that make 10, with a ten frame (K.OA.3-4).
    chapter: "0-pairs",
    steps(rng, { monster }) {
      const f = rng.int(2, 8);
      const e = 10 - f;
      const g = rng.int(2, 8);
      /** @param {number} filled @param {string} [focus] */
      const frame = (filled, focus) => /** @type {ScenePicture} */ ({ kind: "ten_frame", frames: 1, filled, ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I played a trick. My frame is not full!`, picture: frame(f) },
        { who: "hero", say: "A full ten frame holds 10 dots." },
        { who: "hero", say: `This frame has ${f} dots in it.` },
        { who: "hero", say: `${e === 1 ? "1 box is" : `${e} boxes are`} empty. Count the empty boxes.`, picture: frame(f, "frame-0") },
        { who: "hero", say: `${f} and ${e} more make 10.`, picture: frame(f) },
        {
          who: "monster",
          say: "Hmph. How many more dots fill this frame?",
          picture: frame(g),
          check: { kind: "choose", choices: choicesFor(rng, 10 - g, [g]), answer: 10 - g, retry: "Count the empty boxes. Those are the dots it needs.", right: `Yes! ${g} and ${10 - g} make 10.` },
        },
        { who: "monster", say: "Tricked by you! Now, let's battle!" },
      ];
    },
  },
  {
    // A teen number is a full ten frame and some more (K.NBT.1).
    chapter: "0-teens",
    steps(rng, { monster }) {
      const n = rng.int(11, 19);
      const more = n - 10;
      /** @param {string} [focus] */
      const frames = focus => /** @type {ScenePicture} */ ({ kind: "ten_frame", frames: 2, filled: n, ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I rain dots. Too many to count!`, picture: frames() },
        { who: "hero", say: "Not too many for me! This frame is full. A full frame is 10.", picture: frames("frame-0") },
        { who: "hero", say: `This frame has ${more} more.`, picture: frames("frame-1") },
        { who: "hero", say: `10 and ${more} more make ${n}.`, picture: frames() },
        {
          who: "monster",
          say: "Humph. Which frame holds 10? Tap it!",
          check: { kind: "tap", answers: ["frame-0"], retry: "Find the frame with no empty boxes.", right: "Yes! That one holds 10." },
        },
        { who: "monster", say: "You can count my dots! Now, let's battle!" },
      ];
    },
  },
];
