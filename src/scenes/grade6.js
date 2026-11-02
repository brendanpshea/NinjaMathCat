// 6th grade's teaching scenes. docs/SCENES.md says how to write one.

import { formatNumber } from "../questions/common.js";
import { formatFraction, gcd, simplify } from "../questions/rational.js";

/** @import { Scene, ScenePicture } from "../scenes.js" */
/** @import { Rng } from "../rng.js" */

/**
 * Some of a list of numbers, without any that are the answer or repeated.
 * @param {number[]} likely
 * @param {number} answer
 * @param {number} count
 */
function wrongOnes(likely, answer, count = 3) {
  return [...new Set(likely)].filter(v => Number.isInteger(v) && v > 0 && v !== answer).slice(0, count);
}

/**
 * A fraction pair for dividing: both proper and in lowest terms, the flip
 * of the second given, and an answer already in lowest terms.
 * @param {Rng} rng
 */
function dividingSum(rng) {
  for (;;) {
    const [q, s] = [rng.int(2, 6), rng.int(3, 6)];
    const [p, r] = [rng.int(1, q - 1), rng.int(2, s - 1)];
    if (gcd(p, q) === 1 && gcd(r, s) === 1 && gcd(p * s, q * r) === 1 && p * s !== q * r) return { p, q, r, s };
  }
}

/** The factors of a number, smallest first. @param {number} n */
const factorsOf = n => Array.from({ length: n }, (_, i) => i + 1).filter(f => n % f === 0);

/**
 * Two numbers whose greatest common factor is g, neither of them g.
 * @param {Rng} rng
 * @param {number[]} gs  the greatest common factors to pick from
 * @param {[number, number]} mns  the range the numbers are g times
 */
function factorPair(rng, gs, mns) {
  for (;;) {
    const g = rng.pick(gs);
    const [m, n] = [rng.int(...mns), rng.int(...mns)];
    if (m < n && gcd(m, n) === 1) return { g, a: g * m, b: g * n };
  }
}

/** The data for a mean: whole numbers whose mean is a whole number. @param {Rng} rng @param {boolean} [apart]  with a median that isn't the mean */
function dataWithMean(rng, apart = false) {
  for (;;) {
    const n = rng.int(4, 6);
    const values = Array.from({ length: n }, () => rng.int(2, 10)).sort((x, y) => x - y);
    const sum = values.reduce((x, y) => x + y, 0);
    if (sum % n !== 0 || values[0] === values[n - 1] || sum / n < 3) continue;
    const median = n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2;
    if (apart && (median === sum / n || new Set(values).size < 3)) continue;
    return { values, sum, n, mean: sum / n, median };
  }
}

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Ratios on a double number line (6.RP.1, 6.RP.3a).
    chapter: "6-ratios",
    steps(rng, { monster }) {
      let [a, b] = [rng.int(2, 9), rng.int(2, 9)];
      while (a === b || gcd(a, b) !== 1) [a, b] = [rng.int(2, 9), rng.int(2, 9)];
      /** @param {boolean} hidden @param {string | string[]} [focus] */
      const line = (hidden, focus) => /** @type {ScenePicture} */ ({
        kind: "double_line",
        top: { label: "tomatoes", values: [0, 1, 2, 3, 4].map(i => i * a) },
        bottom: { label: "cups of soup", values: [0, 1, 2, 3, 4].map(i => (hidden && i === 3 ? null : i * b)) },
        ...(focus ? { focus } : {}),
      });
      return [
        { who: "monster", say: `I'm ${monster}! My giant spoon stirs ${a} tomatoes into every ${b} cups of soup. This double line shows my soup.`, picture: line(false) },
        { who: "hero", say: `One jump along the lines is ${a} tomatoes and ${b} cups of soup. The marks line up.`, picture: line(false, "pair-1") },
        { who: "hero", say: `Two jumps make ${2 * a} tomatoes and ${2 * b} cups. Each jump adds ${a} on top and ${b} below.`, picture: line(false, "pair-2") },
        { who: "hero", say: `Say you stir in ${3 * a} tomatoes. That is 3 jumps along the top, so it is 3 jumps along the bottom too.`, picture: line(true, "pair-3") },
        {
          who: "monster",
          say: "Grr! How many cups of soup go in the box?",
          check: {
            kind: "choose",
            choices: rng.shuffle([3 * b, ...wrongOnes([3 * a, 2 * b + a, 4 * b, 2 * b, 3 * b + a], 3 * b)]),
            answer: 3 * b,
            retry: "Each jump along the bottom is the same size as the first one. How many jumps do you make?",
            right: `Yes! 3 jumps of ${b} cups make ${3 * b} cups.`,
          },
        },
        { who: "monster", say: "Your spoon is quicker than mine! Now, let's battle!" },
      ];
    },
  },
  {
    // Dividing by a fraction is multiplying by its flip (6.NS.1).
    chapter: "6-dividing",
    steps(rng, { monster }) {
      const { p, q, r, s } = dividingSum(rng);
      const [A, B, F, R] = [`${p}/${q}`, `${r}/${s}`, `${s}/${r}`, `${p * s}/${q * r}`];
      /** @param {number} lines @param {string | string[]} [focus] */
      const card = (lines, focus) => /** @type {ScenePicture} */ ({
        kind: "math",
        lines: [[A, "÷", B], [A, "×", F], [R]].slice(0, lines),
        ...(focus ? { focus } : {}),
      });
      // A second sum for the check: the mistakes are not flipping, flipping the wrong one, and flipping both.
      let other = dividingSum(rng);
      /** @param {{ p: number, q: number, r: number, s: number }} x */
      const answers = ({ p, q, r, s }) => /** @type {[string, string[]]} */ ([
        formatFraction(simplify({ n: p * s, d: q * r })),
        [simplify({ n: p * r, d: q * s }), simplify({ n: q * r, d: p * s }), simplify({ n: q * s, d: p * r })].map(f => formatFraction(f)),
      ]);
      while ((other.p === p && other.q === q && other.r === r && other.s === s) || new Set(answers(other).flat()).size < 4) other = dividingSum(rng);
      const [right, wrong] = answers(other);
      return [
        { who: "monster", say: `I'm ${monster}! I splash ink on fractions. Can you divide ${A} by ${B}?`, picture: card(1) },
        { who: "hero", say: "Dividing asks how many fit. Dividing 1 by 1/4 is 4, because 4 quarters fit in 1.", picture: card(1, "t0-1") },
        { who: "hero", say: `So dividing by 1/4 is the same as multiplying by 4, its flip. The flip of ${B} is ${F}.`, picture: card(1, "t0-2") },
        { who: "hero", say: `So change divided by to times, and flip ${B} to ${F}.`, picture: card(2, ["t1-1", "t1-2"]) },
        { who: "hero", say: `Now multiply the tops, then the bottoms: ${p} times ${s} is ${p * s}, and ${q} times ${r} is ${q * r}. The answer is ${R}.`, picture: card(3, "t2-0") },
        {
          who: "monster",
          say: `Grr! Here is more ink. What is ${other.p}/${other.q} divided by ${other.r}/${other.s}?`,
          picture: { kind: "math", lines: [[`${other.p}/${other.q}`, "÷", `${other.r}/${other.s}`]] },
          check: {
            kind: "choose",
            choices: rng.shuffle([right, ...wrong]),
            answer: right,
            retry: "Change divided by to times, then flip the fraction after it. Multiply the tops and the bottoms.",
            right: "Yes! Flip the second fraction and multiply.",
          },
        },
        { who: "monster", say: "You wiped away my ink! Now, let's battle!" },
      ];
    },
  },
  {
    // The greatest common factor, from lists of factors (6.NS.4).
    chapter: "6-factors",
    steps(rng, { monster }) {
      const { g, a, b } = factorPair(rng, [2, 3, 4, 5, 6], [2, 5]);
      const [fa, fb] = [factorsOf(a), factorsOf(b)];
      const common = fa.filter(f => fb.includes(f));
      /** @param {number[]} list */
      const row = list => list.map((f, i) => (i < list.length - 1 ? `${f},` : String(f)));
      /** @param {number} lines @param {string | string[]} [focus] */
      const card = (lines, focus) => /** @type {ScenePicture} */ ({
        kind: "math",
        lines: [[String(a), "and", String(b)], [`${a}:`, ...row(fa)], [`${b}:`, ...row(fb)]].slice(0, lines),
        ...(focus ? { focus } : {}),
      });
      /** Where a factor is in its line of the card: after the label. @param {number[]} list @param {number} f */
      const at = (list, f) => list.indexOf(f) + 1;
      const second = factorPair(rng, [4, 6, 8, 9, 10], [2, 7]);
      const lesser = second.g % 2 === 0 ? 2 : 3;
      return [
        { who: "monster", say: `I'm ${monster}! My lock opens only with the greatest common factor of ${a} and ${b}. Can you find it?`, picture: card(1) },
        { who: "hero", say: `A factor divides a number with nothing left over. Here are all the factors of ${a}.`, picture: card(2, "line-1") },
        { who: "hero", say: `Now here are all the factors of ${b}.`, picture: card(3, "line-2") },
        {
          who: "hero",
          say: `Some factors are in both lists. The common factors are ${common.slice(0, -1).join(", ")} and ${common[common.length - 1]}.`,
          picture: card(3, [...common.map(f => `t1-${at(fa, f)}`), ...common.map(f => `t2-${at(fb, f)}`)]),
        },
        { who: "hero", say: `The greatest of them is ${g}. That is the greatest common factor.`, picture: card(3, [`t1-${at(fa, g)}`, `t2-${at(fb, g)}`]) },
        {
          who: "monster",
          say: `Grr! Now my second lock. What is the greatest common factor of ${second.a} and ${second.b}?`,
          picture: { kind: "math", lines: [[String(second.a), "and", String(second.b)]] },
          check: {
            kind: "choose",
            // The least common multiple, the smaller number, and a common factor that is not the greatest.
            choices: rng.shuffle([second.g, ...wrongOnes([(second.a * second.b) / second.g, second.a, lesser], second.g)]),
            answer: second.g,
            retry: "List the factors of both numbers. Then find the biggest number that is in both lists.",
            right: `Yes! ${second.g} is the biggest factor of both.`,
          },
        },
        { who: "monster", say: "My lock springs open! Now, let's battle!" },
      ];
    },
  },
  {
    // Negative numbers on a number line, and absolute value (6.NS.5-7).
    chapter: "6-negatives",
    steps(rng, { monster }) {
      const spots = [1, 2, 3, 4, 6, 7, 8, 9];
      const n = rng.pick(spots);
      const m = rng.pick(spots.filter(v => v !== n));
      const k = rng.pick(spots.filter(v => v > 1 && v !== n));
      /** @param {number} at @param {boolean} jump @param {string | string[]} [focus] */
      const line = (at, jump, focus) => /** @type {ScenePicture} */ ({
        kind: "number_line", den: 1, from: -10, to: 10, tick: 1, label: 5, points: [-at], jumps: jump ? [[0, -at]] : [],
        ...(focus ? { focus } : {}),
      });
      const steps = (/** @type {number} */ x) => `${x} ${x === 1 ? "step" : "steps"}`;
      return [
        { who: "monster", say: `I'm ${monster}! My armor is ice. The dot shows where I stand on this line. Brrr!`, picture: line(n, false) },
        { who: "hero", say: "Zero is in the middle. Numbers to the right of zero are positive.", picture: line(n, false, "tick-0") },
        { who: "hero", say: `Numbers to the left of zero are negative. The dot is ${steps(n)} left of zero, so it is negative ${n}.`, picture: line(n, true, "jump-0") },
        { who: "hero", say: `The dot is ${steps(n)} from zero. That distance is the absolute value: the absolute value of negative ${n} is ${n}.`, picture: line(n, true, "jump-0") },
        {
          who: "monster",
          say: `Humph. Where is negative ${m}? Tap it on the line!`,
          check: { kind: "tap", answers: [`tick--${m}`], retry: "Negative numbers are left of zero. Count the steps left from zero.", right: `Yes! Negative ${m} is ${steps(m)} left of zero.` },
        },
        {
          who: "monster",
          say: "Brrr! Here is another knight. How far is its dot from zero?",
          picture: line(k, false),
          check: {
            kind: "choose",
            choices: rng.shuffle([String(k), formatNumber(-k), String(k + 1), String(k - 1)]),
            answer: String(k),
            retry: "Count the steps from zero to the dot. A distance is never negative.",
            right: `Yes! The absolute value of negative ${k} is ${k}.`,
          },
        },
        { who: "monster", say: "You see through my ice! Now, let's battle!" },
      ];
    },
  },
  {
    // A number times a bracket: 4(x + 2) is 4x + 8 (6.EE.3).
    chapter: "6-expressions",
    steps(rng, { monster }) {
      const letters = ["x", "n", "y", "m"];
      const v = rng.pick(letters);
      let [a, b] = [rng.int(2, 9), rng.int(2, 9)];
      while (a === b) b = rng.int(2, 9);
      /** @param {string[][]} lines @param {string | string[]} [focus] */
      const card = (lines, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines, ...(focus ? { focus } : {}) });
      const start = [String(a), "(", v, "+", String(b), ")"];
      const w = rng.pick(letters);
      let [c, d] = [rng.int(2, 9), rng.int(2, 9)];
      while (c === d) d = rng.int(2, 9);
      const right = `${c}${w} + ${c * d}`;
      return [
        { who: "monster", say: `I'm ${monster}! My lamp makes ${a} bundles of light. Each bundle holds ${v} flames and ${b} sparks.`, picture: card([start]) },
        { who: "hero", say: `The ${a} outside the bracket means ${a} bundles, each with everything inside the bracket.`, picture: card([start], "t0-0") },
        { who: "hero", say: `${a} bundles of ${v} flames make ${a}${v}.`, picture: card([start, [`${a}${v}`]], "t1-0") },
        { who: "hero", say: `And ${a} bundles of ${b} sparks make ${a * b}. So your lamp shines ${a}${v} plus ${a * b}.`, picture: card([start, [`${a}${v}`, "+", String(a * b)]], "t1-2") },
        {
          who: "monster",
          say: "Grr! Which one is equal to my other lamp?",
          picture: card([[String(c), "(", w, "+", String(d), ")"]]),
          check: {
            kind: "choose",
            // Only the first part times the number, the number added to the letters, or the bracket added up first.
            choices: rng.shuffle([right, `${c}${w} + ${d}`, `${w} + ${c * d}`, `${c + d}${w}`]),
            answer: right,
            retry: "The number outside the bracket multiplies everything inside the bracket, not just the first part.",
            right: `Yes! The ${c} multiplies both parts: ${c}${w} and ${c * d}.`,
          },
        },
        { who: "monster", say: "Your lamp shines brighter than mine! Now, let's battle!" },
      ];
    },
  },
  {
    // Solving an equation by undoing (6.EE.7).
    chapter: "6-equations",
    steps(rng, { monster }) {
      const letters = ["x", "n", "y", "m"];
      const v = rng.pick(letters);
      let [a, c] = [rng.int(2, 12), rng.int(2, 15)];
      while (a === c) c = rng.int(2, 15);
      const b = a + c;
      const lines = [
        [v, "+", String(a), "=", String(b)],
        [v, "+", String(a), "−", String(a), "=", String(b), "−", String(a)],
        [v, "=", String(c)],
      ];
      /** @param {number} count @param {string | string[]} [focus] */
      const card = (count, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines: lines.slice(0, count), ...(focus ? { focus } : {}) });
      const w = rng.pick(letters);
      let [d, c2] = [rng.int(2, 12), rng.int(2, 15)];
      while (d === c2) c2 = rng.int(2, 15);
      const e = d + c2;
      return [
        { who: "monster", say: `I'm ${monster}! I hide a number, ${v}. I wobble until both sides of my sign balance.`, picture: card(1) },
        { who: "hero", say: `The equals sign says both sides are the same, like a balance. ${v} plus ${a} balances ${b}.`, picture: card(1, "t0-3") },
        { who: "hero", say: `To find ${v}, undo the plus ${a}. The opposite of adding ${a} is taking away ${a}.`, picture: card(1, ["t0-1", "t0-2"]) },
        { who: "hero", say: `Take away ${a} from both sides, so the balance stays level.`, picture: card(2, ["t1-3", "t1-4", "t1-7", "t1-8"]) },
        { who: "hero", say: `Now ${v} is alone. ${b} take away ${a} leaves ${c}, so ${v} is ${c}.`, picture: card(3, "t2-2") },
        {
          who: "monster",
          say: `Wobble, wobble! Now you solve one. What number is ${w}?`,
          picture: { kind: "math", lines: [[w, "+", String(d), "=", String(e)]] },
          check: {
            kind: "choose",
            // Adding instead of taking away, the number left alone, or the number taken away.
            choices: rng.shuffle([c2, ...wrongOnes([e + d, e, d, c2 + 1, c2 - 1], c2)]),
            answer: c2,
            retry: `To undo the plus ${d}, take away ${d} from the other side too.`,
            right: `Yes! ${e} take away ${d} is ${c2}.`,
          },
        },
        { who: "monster", say: "You stopped my wobbling! Now, let's battle!" },
      ];
    },
  },
  {
    // The area of a triangle is half of a rectangle's (6.G.1).
    chapter: "6-area",
    steps(rng, { monster }) {
      const evens = [4, 6, 8, 10, 12, 14, 16];
      const [b, h] = [rng.pick(evens), rng.int(3, 9)];
      /** @param {number} base @param {number} height @param {"triangle" | "rectangle"} shape @param {string | string[]} [focus] */
      const figure = (base, height, shape, focus) => /** @type {ScenePicture} */ ({
        kind: "area", shape, width: base, height, grid: false, labels: { base: `${base} in`, height: `${height} in` },
        ...(focus ? { focus } : {}),
      });
      let [b2, h2] = [rng.pick(evens), rng.int(3, 9)];
      while (b2 === b && h2 === h) [b2, h2] = [rng.pick(evens), rng.int(3, 9)];
      const area = (b2 * h2) / 2;
      return [
        { who: "monster", say: `I'm ${monster}! Shh! This triangle is my blanket. Its base is ${b} inches, and its height is ${h} inches.`, picture: figure(b, h, "triangle") },
        { who: "hero", say: "Let's fit a rectangle round it, with the same base and the same height.", picture: figure(b, h, "rectangle", ["side-bottom", "side-left"]) },
        { who: "hero", say: `The rectangle's area is base times height: ${b} times ${h} is ${b * h} square inches.`, picture: figure(b, h, "rectangle") },
        { who: "hero", say: `Your triangle is exactly half of that rectangle. Half of ${b * h} is ${(b * h) / 2} square inches.`, picture: figure(b, h, "triangle") },
        {
          who: "monster",
          say: "Yawn... What is the area of my other blanket, in square inches?",
          picture: figure(b2, h2, "triangle"),
          check: {
            kind: "choose",
            // The whole rectangle, the sides added, or half of it plus a side.
            choices: rng.shuffle([area, ...wrongOnes([b2 * h2, b2 + h2, area + h2, area - h2], area)]),
            answer: area,
            retry: "Think of the rectangle round the triangle: base times height. Then the triangle is only a part of it.",
            right: `Yes! Half of ${b2 * h2} is ${area}.`,
          },
        },
        { who: "monster", say: "You did not wake me. Almost! Now, let's battle!" },
      ];
    },
  },
  {
    // The mean shares everything out evenly (6.SP.5c).
    chapter: "6-statistics",
    steps(rng, { monster }) {
      const { values, sum, n, mean } = dataWithMean(rng);
      /** @param {number[]} data @param {string | string[]} [focus] */
      const plot = (data, focus) => {
        const from = Math.min(...data);
        const counts = Array.from({ length: Math.max(...data) - from + 1 }, (_, i) => data.filter(v => v === from + i).length);
        return /** @type {ScenePicture} */ ({ kind: "line_plot", title: "Tiles in each stack", den: 1, from, counts, ...(focus ? { focus } : {}) });
      };
      const spots = [...new Set(values)].map(v => `position-${v - values[0]}`);
      const other = dataWithMean(rng, true);
      return [
        { who: "monster", say: `I'm ${monster}! I'm built from stacks of tiles. Each X is one stack, and shows how many tiles it has.`, picture: plot(values) },
        { who: "hero", say: "The mean shares all the tiles out evenly, so every stack ends up with the same number.", picture: plot(values) },
        { who: "hero", say: `First, add up all the tiles: ${values.join(" plus ")} makes ${sum}.`, picture: plot(values, spots) },
        { who: "hero", say: `Then share them out between the ${n} stacks: ${sum} divided by ${n} is ${mean}. The mean is ${mean}.`, picture: plot(values) },
        {
          who: "monster",
          say: "Grr! Here are my other stacks. What is the mean number of tiles?",
          picture: plot(other.values),
          check: {
            kind: "choose",
            // The total not shared out, the middle value, or a number next to the mean.
            choices: rng.shuffle([other.mean, ...wrongOnes([other.sum, other.median, other.mean + 1, other.mean - 1], other.mean)]),
            answer: other.mean,
            retry: "Add up all the tiles first. Then share them out evenly between the stacks.",
            right: `Yes! ${other.sum} tiles shared between ${other.n} stacks is ${other.mean} each.`,
          },
        },
        { who: "monster", say: "You shared my tiles fairly! Now, let's battle!" },
      ];
    },
  },
];
