// 1st grade's teaching scenes. docs/SCENES.md says how to write one.

/** @import { Scene, ScenePicture } from "../scenes.js" */
/** @import { Rng } from "../rng.js" */

/**
 * A number other than those given.
 * @param {Rng} rng
 * @param {number} lo
 * @param {number} hi
 * @param {number[]} not
 */
const intNot = (rng, lo, hi, not) => {
  let n = rng.int(lo, hi);
  while (not.includes(n)) n = rng.int(lo, hi);
  return n;
};

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Add by counting on from the bigger number, on a number line (1.OA.6).
    chapter: "1-facts",
    steps(rng, { monster }) {
      const [a, b] = [rng.int(6, 12), rng.int(2, 5)];
      const sum = a + b;
      /** @param {number} at @param {number} hops @param {string | string[]} [focus] @param {boolean} [landed] */
      const line = (at, hops, focus, landed = false) => /** @type {ScenePicture} */ ({
        kind: "number_line", den: 1, from: 0, to: 20, tick: 1, label: 5,
        points: landed ? [at, at + hops] : [at],
        jumps: Array.from({ length: hops }, (_, i) => /** @type {[number, number]} */ ([at + i, at + i + 1])),
        ...(focus ? { focus } : {}),
      });
      // Two more sums for the checks, each with a new start and a new number of hops.
      const a2 = intNot(rng, 6, 12, [a]);
      const b2 = intNot(rng, 2, 5, [b]);
      const a3 = intNot(rng, 6, 12, [a, a2]);
      const b3 = intNot(rng, 2, 5, [b, b2]);
      // The dot stands for the ducks, so the first line says so. The first check shows
      // the hops to count; the second leaves the child to hop on alone.
      return [
        { who: "monster", say: `I'm ${monster}! My ${a} ducks wait at the dot. ${b} more sneak in!`, picture: line(a, 0) },
        { who: "hero", say: `Start at ${a}, where the ducks are. We count on from here.`, picture: line(a, 0, [`point-${a}`, `tick-${a}`]) },
        { who: "hero", say: `Hop ${b} times, one hop for each duck that sneaks in.`, picture: line(a, b, Array.from({ length: b }, (_, i) => `jump-${i}`)) },
        { who: "hero", say: `We land on ${sum}. So ${a} and ${b} more make ${sum}.`, picture: line(a, b, `tick-${sum}`, true) },
        {
          who: "monster",
          say: `Sneaky again! ${a3} ducks, and ${b3} more. Count the hops. How many now?`,
          picture: line(a3, b3),
          check: {
            kind: "choose",
            choices: rng.shuffle([a3 + b3, a3 + b3 + 1, a3 + b3 - 1, a3]),
            answer: a3 + b3,
            retry: "Start at the dot and hop on. Count each hop.",
            right: `Yes! ${a3 + b3} ducks in all.`,
          },
        },
        {
          who: "monster",
          say: `Last sneak! ${a2} ducks, and ${b2} more come. Tap where you land!`,
          picture: line(a2, 0),
          check: { kind: "tap", answers: [`tick-${a2 + b2}`], retry: "Start at the dot. Hop one number at a time.", right: `Yes! ${a2} and ${b2} more make ${a2 + b2}.` },
        },
        { who: "monster", say: "You counted every sneaky duck! Now, let's battle!" },
      ];
    },
  },
  {
    // A story that puts piles together is added (1.OA.1).
    chapter: "1-stories",
    steps(rng, { monster }) {
      const [a, b] = [rng.int(3, 8), rng.int(2, 6)];
      /** @param {string} emoji @param {string} thing @param {number} had @param {number} [grabbed] @param {string | string[]} [focus] */
      const piles = (emoji, thing, had, grabbed, focus) => /** @type {ScenePicture} */ ({
        kind: "groups",
        rows: [{ name: `${thing} I had`, emoji, count: had }, ...(grabbed ? [{ name: `${thing} I grabbed`, emoji, count: grabbed }] : [])],
        ...(focus ? { focus } : {}),
      });
      const a2 = intNot(rng, 3, 8, [a]);
      const b2 = intNot(rng, 2, 6, [b]);
      return [
        { who: "monster", say: `I'm ${monster}! I have ${a} shiny gems.`, picture: piles("💎", "gems", a) },
        { who: "monster", say: `Then I grab ${b} more!`, picture: piles("💎", "gems", a, b, "row-1") },
        { who: "hero", say: "More came in. When we put piles together, we add." },
        { who: "hero", say: `${a} and ${b} more make ${a + b}. Count them all.`, picture: piles("💎", "gems", a, b, ["row-0", "row-1"]) },
        {
          who: "monster",
          say: "Which pile did I grab just now? Tap it!",
          picture: piles("💎", "gems", a, b),
          check: { kind: "tap", answers: ["row-1"], retry: "Look for the pile that came second.", right: "Yes! Those are the gems I grabbed." },
        },
        {
          who: "monster",
          say: `Grr! I had ${a2} stars. I grab ${b2} more. How many now?`,
          picture: piles("⭐", "stars", a2, b2),
          check: {
            kind: "choose",
            choices: rng.shuffle([a2 + b2, a2 + b2 + 1, a2 + b2 - 1, a2]),
            answer: a2 + b2,
            retry: "Put both piles together and count them all.",
            right: "Yes! Put together, so we add.",
          },
        },
        { who: "monster", say: "You counted all my loot! Now, let's battle!" },
      ];
    },
  },
  {
    // Find the missing number by counting up on a number line (1.OA.8).
    chapter: "1-missing",
    steps(rng, { monster }) {
      const [a, k] = [rng.int(2, 9), rng.int(2, 9)];
      const n = a + k;
      /** @param {(string | number)[]} line @param {string} [focus] */
      const card = (line, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines: [line.map(String)], ...(focus ? { focus } : {}) });
      /** @param {number} hops @param {string | string[]} focus */
      const line = (hops, focus) => /** @type {ScenePicture} */ ({
        kind: "number_line", den: 1, from: 0, to: 20, tick: 1, label: 5,
        points: [a, n],
        jumps: Array.from({ length: hops }, (_, i) => /** @type {[number, number]} */ ([a + i, a + i + 1])),
        focus,
      });
      let b = a;
      let k2 = k;
      while (b === a && k2 === k) [b, k2] = [rng.int(2, 9), rng.int(2, 9)];
      const m = b + k2;
      return [
        { who: "monster", say: `I'm ${monster}! I swept a number into this box.`, picture: card([a, "+", "□", "=", n]) },
        { who: "hero", say: `The box hides a number. ${a} and that number make ${n}.`, picture: card([a, "+", "□", "=", n], "t0-2") },
        { who: "hero", say: `Start at ${a}. We want to count up to ${n}.`, picture: line(0, [`point-${a}`, `point-${n}`]) },
        { who: "hero", say: `It takes ${k} hops to get from ${a} to ${n}.`, picture: line(k, Array.from({ length: k }, (_, i) => `jump-${i}`)) },
        { who: "hero", say: `So ${a} and ${k} make ${n}. The box holds ${k}.`, picture: card([a, "+", k, "=", n], "t0-2") },
        {
          who: "monster",
          say: "Swish! Here is another box. What number goes in it?",
          picture: card([b, "+", "□", "=", m]),
          check: {
            kind: "choose",
            choices: rng.shuffle([k2, k2 + 1, k2 - 1, m]),
            answer: k2,
            retry: `Start at ${b}. Count up until you reach ${m}.`,
            right: "Yes! You counted up to find it.",
          },
        },
        { who: "monster", say: "Nothing hides from you! Now, let's battle!" },
      ];
    },
  },
  {
    // A number is tens and ones, shown with blocks (1.NBT.2).
    chapter: "1-tens",
    steps(rng, { monster }) {
      // Several cubes in the example, so it shows how they are counted before the check asks.
      const [t, o] = [rng.int(2, 9), rng.int(3, 9)];
      const ones = (/** @type {number} */ n) => (n === 1 ? "one" : "ones");
      const byTens = Array.from({ length: Math.min(t, 3) }, (_, i) => 10 * (i + 1)).join(", ") + (t > 3 ? `, and on to ${10 * t}` : "");
      /** @param {number} tens @param {number} ones @param {string} [focus] */
      const blocks = (tens, ones, focus) => /** @type {ScenePicture} */ ({ kind: "base_ten", hundreds: 0, tens, ones, ...(focus ? { focus } : {}) });
      let t2 = t;
      let o2 = t;
      while (t2 === t || o2 === t2) [t2, o2] = [rng.int(2, 9), rng.int(1, 9)];
      const n2 = 10 * t2 + o2;
      return [
        { who: "monster", say: `I'm ${monster}! I pinched up a pile of blocks!`, picture: blocks(t, o) },
        { who: "hero", say: "A long stick is 1 ten. It holds 10 ones.", picture: blocks(t, o, "rod-0") },
        { who: "hero", say: `${t} sticks. Count them by tens: ${byTens}.`, picture: blocks(t, o, "rods") },
        { who: "hero", say: `These little cubes are ${o} ones.`, picture: blocks(t, o, "units") },
        { who: "hero", say: `${t} tens and ${o} ones make ${10 * t + o}. The tens come first.`, picture: blocks(t, o) },
        {
          who: "monster",
          say: "Grr! How many do these blocks show?",
          picture: blocks(t2, o2),
          check: {
            kind: "choose",
            choices: rng.shuffle([n2, 10 * o2 + t2, t2 + o2, 10 * t2]),
            answer: n2,
            retry: "Count the sticks by tens first. Then count on the little cubes.",
            right: `Yes! ${t2} tens and ${o2} ${ones(o2)} make ${n2}.`,
          },
        },
        { who: "monster", say: "You're too quick for my pinch! Now, let's battle!" },
      ];
    },
  },
  {
    // The number just after and just before, on a number line (1.NBT.1).
    chapter: "1-to-120",
    steps(rng, { monster }) {
      const c = rng.int(12, 108);
      /** @param {number} at @param {string} [focus] */
      const line = (at, focus) => /** @type {ScenePicture} */ ({ kind: "number_line", den: 1, from: at - 5, to: at + 5, tick: 1, label: 1, points: [at], jumps: [], ...(focus ? { focus } : {}) });
      const c2 = intNot(rng, 12, 108, [c]);
      const c3 = intNot(rng, 12, 108, [c, c2]);
      return [
        { who: "monster", say: `I'm ${monster}! I rained on this number line. Here is ${c}.`, picture: line(c) },
        { who: "hero", say: `After ${c} comes ${c + 1}. That is one more.`, picture: line(c, `tick-${c + 1}`) },
        { who: "hero", say: `Before ${c} comes ${c - 1}. That is one less.`, picture: line(c, `tick-${c - 1}`) },
        {
          who: "monster",
          say: `Which number comes just before ${c2}? Tap it!`,
          picture: line(c2),
          check: { kind: "tap", answers: [`tick-${c2 - 1}`], retry: "Before means one step to the left.", right: `Yes! ${c2 - 1} comes just before ${c2}.` },
        },
        {
          who: "monster",
          say: `Hmph. What number comes just after ${c3}?`,
          picture: line(c3),
          check: {
            kind: "choose",
            choices: rng.shuffle([c3 + 1, c3 - 1, c3 + 10, c3 + 2]),
            answer: c3 + 1,
            retry: "After means one step to the right.",
            right: `Yes! ${c3 + 1} comes just after ${c3}.`,
          },
        },
        { who: "monster", say: "You can count through my rain! Now, let's battle!" },
      ];
    },
  },
  {
    // Compare lengths by lining up one end: the longest and the shortest (1.MD.1).
    chapter: "1-time",
    steps(rng, { monster }) {
      /** Three ribbons of different colors, each at least 2 longer than the next shortest. */
      const three = () => {
        const colors = rng.shuffle(["red", "blue", "green", "orange"]).slice(0, 3);
        let lengths = [0, 0, 0];
        while ([...lengths].sort((x, y) => x - y).some((v, i, all) => i > 0 && v - all[i - 1] < 2)) lengths = [rng.int(3, 11), rng.int(3, 11), rng.int(3, 11)];
        return colors.map((color, i) => ({ color: /** @type {"red" | "blue" | "green" | "orange"} */ (color), from: 0, length: lengths[i] }));
      };
      /** @param {{ color: "red" | "blue" | "green" | "orange", from: number, length: number }[]} ribbons @param {string} [focus] */
      const ribbonsOf = (ribbons, focus) => /** @type {ScenePicture} */ ({ kind: "lengths", ribbons, ruler: null, cubes: false, span: 12, ...(focus ? { focus } : {}) });
      const first = three();
      const second = three();
      const by = (/** @type {typeof first} */ list, /** @type {1 | -1} */ way) => list.reduce((best, r) => (way * (r.length - best.length) > 0 ? r : best));
      return [
        { who: "monster", say: `I'm ${monster}! I lit up three ribbons.`, picture: ribbonsOf(first) },
        { who: "hero", say: "They all start at the same line. Look where each one stops." },
        { who: "hero", say: "This one reaches the farthest. It is the longest.", picture: ribbonsOf(first, `ribbon-${by(first, 1).color}`) },
        { who: "hero", say: "This one stops first. It is the shortest.", picture: ribbonsOf(first, `ribbon-${by(first, -1).color}`) },
        {
          who: "monster",
          say: "Now these ribbons. Which one is the longest? Tap it!",
          picture: ribbonsOf(second),
          check: { kind: "tap", answers: [`ribbon-${by(second, 1).color}`], retry: "Look for the ribbon that reaches the farthest.", right: "Yes! It reaches the farthest." },
        },
        {
          who: "monster",
          say: "Hmm. Which one is the shortest? Tap it!",
          check: { kind: "tap", answers: [`ribbon-${by(second, -1).color}`], retry: "Look for the ribbon that stops first.", right: "Yes! It stops first." },
        },
        { who: "monster", say: "You see how long they are! Now, let's battle!" },
      ];
    },
  },
  {
    // Read a picture graph: count a row, and the longest row has the most (1.MD.4).
    chapter: "1-graphs",
    steps(rng, { monster }) {
      const foods = [{ label: "Tomatoes", icon: "🍅" }, { label: "Carrots", icon: "🥕" }, { label: "Corn", icon: "🌽" }];
      /** @param {number[]} values @param {string} [focus] */
      const graph = (values, focus) => /** @type {ScenePicture} */ ({
        kind: "picture_graph", title: "Our favorite soup food", unit: ["child", "children"], each: 1,
        rows: foods.map((f, i) => ({ ...f, value: values[i] })),
        ...(focus ? { focus } : {}),
      });
      const values = () => rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const mostOf = (/** @type {number[]} */ v) => v.indexOf(Math.max(...v));
      const v1 = values();
      const v2 = values();
      const most2 = mostOf(v2);
      const row2 = rng.pick([0, 1, 2].filter(i => i !== most2));
      return [
        { who: "monster", say: `I'm ${monster}! I stirred up a graph of soup food.`, picture: graph(v1) },
        { who: "hero", say: "Each picture is 1 child. This row is one kind of food.", picture: graph(v1, "row-0") },
        { who: "hero", say: `Count the pictures in this row. There are ${v1[1]}.`, picture: graph(v1, "row-1") },
        { who: "hero", say: "The longest row has the most pictures. Most children chose it.", picture: graph(v1, `row-${mostOf(v1)}`) },
        {
          who: "monster",
          say: "Try my other graph. Which row has the most? Tap it!",
          picture: graph(v2),
          check: { kind: "tap", answers: [`row-${most2}`], retry: "Look for the row with the most pictures.", right: "Yes! The longest row has the most." },
        },
        {
          who: "monster",
          say: "Count the pictures in this row. How many?",
          picture: graph(v2, `row-${row2}`),
          check: {
            kind: "choose",
            choices: rng.shuffle([v2[row2], v2[row2] - 1, v2[row2] + 1, v2[0] + v2[1] + v2[2]]),
            answer: v2[row2],
            retry: "Touch each picture in the ringed row as you count.",
            right: `Yes! ${v2[row2]} children chose it.`,
          },
        },
        { who: "monster", say: "You read my soup graph! Now, let's battle!" },
      ];
    },
  },
  {
    // Equal shares: halves and fourths of a circle or a rectangle (1.G.3).
    chapter: "1-shares",
    steps(rng, { monster }) {
      const parts = rng.pick([2, 4]);
      const other = parts === 2 ? 4 : 2;
      const ate = rng.int(1, parts - 1);
      /** @param {number} p */
      const share = p => (p === 2 ? "half" : "fourth");
      /** @param {number} p */
      const shares = p => (p === 2 ? "halves" : "fourths");
      /** @param {"circle" | "bar"} model @param {number} p @param {number} shaded @param {string | string[]} [focus] */
      const jelly = (model, p, shaded, focus) => /** @type {ScenePicture} */ ({ kind: "fraction", model, parts: p, shaded, ...(focus ? { focus } : {}) });
      const model = /** @type {"circle" | "bar"} */ (rng.pick(["circle", "bar"]));
      const all = (/** @type {number} */ p) => Array.from({ length: p }, (_, i) => `part-${i}`);
      const check = rng.pick([2, 4]);
      const checkModel = /** @type {"circle" | "bar"} */ (rng.pick(["circle", "bar"]));
      // One idea a step: equal parts, the name of one part, the whole, then the other cut
      // with one part shaded, and a check that ties the name to the number of parts.
      return [
        { who: "monster", say: `I'm ${monster}! My jelly has ${parts} equal parts. I ate the blue ${ate === 1 ? "one" : "ones"}!`, picture: jelly(model, parts, ate) },
        { who: "hero", say: "Equal parts are all the same size. Each one is a fair share.", picture: jelly(model, parts, ate, all(parts)) },
        {
          who: "hero",
          say: `Each part is one ${share(parts)}. You ate ${ate === 1 ? `one ${share(parts)}` : `${ate} ${shares(parts)}`}.`,
          picture: jelly(model, parts, ate, "shaded"),
        },
        { who: "hero", say: `${parts} ${shares(parts)} make the whole jelly.`, picture: jelly(model, parts, ate, all(parts)) },
        { who: "hero", say: `Cut into ${other} equal parts, each part is one ${share(other)}.`, picture: jelly(model, other, 1, "shaded") },
        {
          who: "monster",
          say: `Wobble! How many ${shares(check)} make my whole jelly?`,
          picture: jelly(checkModel, check, 0),
          check: {
            kind: "choose",
            choices: rng.shuffle([1, 2, 3, 4]),
            answer: check,
            retry: "Touch each part as you count. Each one is a fair share.",
            right: `Yes! ${check} ${shares(check)} make the whole jelly.`,
          },
        },
        { who: "monster", say: "You shared my jelly fairly! Now, let's battle!" },
      ];
    },
  },
];
