// 5th grade's teaching scenes. docs/SCENES.md says how to write one.

import { formatDecimal } from "../questions/decimals.js";

/** @import { Scene, ScenePicture } from "../scenes.js" */

/**
 * A math card, with the tokens to ring.
 * @param {string[][]} lines
 * @param {string | string[]} [focus]
 */
const card = (lines, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines, ...(focus ? { focus } : {}) });

/**
 * Fraction bars, with the parts to ring.
 * @param {{ parts: number, shaded: number, label?: string }[]} bars
 * @param {string | string[]} [focus]
 */
const bars = (bars, focus) => /** @type {ScenePicture} */ ({ kind: "fraction_bars", bars, ...(focus ? { focus } : {}) });

/** @param {number} a @param {number} b @returns {number} */
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/** Three different digits, none of them 0. @param {import("../rng.js").Rng} rng @param {number} count */
const digits = (rng, count) => rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count);

/** The plural of a fraction's parts: "halves", "thirds", "sixths". @param {number} d */
const parts = d => ({ 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 10: "tenths", 12: "twelfths", 15: "fifteenths", 20: "twentieths" })[/** @type {2} */ (d)] ?? `${d}ths`;

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Times 10 moves every digit one place left (5.NBT.1-2).
    chapter: "5-decimals",
    steps(rng, { monster }) {
      const [t, o, d] = digits(rng, 3);
      const n = `${t}${o}.${d}`;
      const answer = 100 * t + 10 * o + d;
      let [p, q, r] = digits(rng, 3);
      while (100 * p + 10 * q + r === answer) [p, q, r] = digits(rng, 3);
      const next = 100 * p + 10 * q + r;
      const first = [String(t), String(o), ".", String(d)];
      return [
        { who: "monster", say: `I'm ${monster}! I splash ink on numbers. What is 10 times ${n}?`, picture: card([first]) },
        { who: "hero", say: "Right after the decimal point is the tenths place. Left of the point is ones, then tens.", picture: card([first], "t0-3") },
        {
          who: "monster",
          say: "Hmph. Which digit is in the ones place? Tap it!",
          check: { kind: "tap", answers: ["t0-1"], retry: "The ones place is just left of the decimal point.", right: `Yes! The ${o} is in the ones place.` },
        },
        { who: "hero", say: "Times 10 makes every digit worth 10 times more. So every digit hops one place left.", picture: card([first], ["t0-0", "t0-1", "t0-3"]) },
        {
          who: "hero",
          say: `The ${d} lands in the ones place. No tenths are left, so 10 times ${n} is ${answer}.`,
          picture: card([first, [String(t), String(o), String(d)]], "line-1"),
        },
        {
          who: "monster",
          say: "Splat! Another one. What is 10 times this number?",
          picture: card([[String(p), ".", String(q), String(r)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([formatDecimal(next, 1), `${p}.${q}${r}0`, String(next), formatDecimal(next, 3)]),
            answer: formatDecimal(next, 1),
            retry: "Times 10, each digit hops one place left. Which digit lands in the ones place?",
            right: "Yes! Every digit hopped one place left.",
          },
        },
        { who: "monster", say: "You wiped out my ink! Now, let's battle!" },
      ];
    },
  },
  {
    // Multiplying by a 2-digit number, one place at a time (5.NBT.5).
    chapter: "5-multiply",
    steps(rng, { monster }) {
      const make = () => {
        for (;;) {
          const [a1, a2, t, o] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 6), rng.int(2, 9)];
          // No digit of the first number is the tens digit of the second, which the check asks a child to tap.
          if (t !== o && a1 !== a2 && a1 !== t && a2 !== t) return { a: 10 * a1 + a2, a1, a2, t, o };
        }
      };
      const { a, a1, a2, t, o } = make();
      const b = 10 * t + o;
      const [ones, tens] = [a * o, a * t * 10];
      let other = make();
      while (other.a === a || 10 * other.t + other.o === b) other = make();
      const c = 10 * other.t + other.o;
      const total = other.a * c;
      const line0 = [String(a1), String(a2), "×", String(t), String(o)];
      return [
        { who: "monster", say: `I'm ${monster}! I swap the digits around. What is ${a} times ${b}?`, picture: card([line0]) },
        { who: "hero", say: `Split ${b} into ${t * 10} and ${o}. We multiply ${a} by each part, then add.`, picture: card([line0], ["t0-3", "t0-4"]) },
        {
          who: "monster",
          say: `Hmph. Which digit of ${b} means ${t} tens? Tap it!`,
          check: { kind: "tap", answers: ["t0-3"], retry: "Tens are in the place on the left.", right: `Yes! The ${t} stands for ${t * 10}.` },
        },
        { who: "hero", say: `First the ones: ${a} times ${o} is ${ones}.`, picture: card([line0, [String(a), "×", String(o), "=", String(ones)]], "line-1") },
        {
          who: "hero",
          say: `Now the tens: ${a} times ${t * 10} is ${tens}. Do ${a} times ${t}, then put a zero on the end.`,
          picture: card([line0, [String(a), "×", String(o), "=", String(ones)], [String(a), "×", String(t * 10), "=", String(tens)]], "line-2"),
        },
        {
          who: "hero",
          say: `Add the two parts: ${ones} and ${tens} make ${a * b}.`,
          picture: card([line0, [String(a), "×", String(o), "=", String(ones)], [String(a), "×", String(t * 10), "=", String(tens)], [String(ones), "+", String(tens), "=", String(a * b)]], "t3-4"),
        },
        {
          who: "monster",
          say: `Tricks! What is ${other.a} times ${c}?`,
          picture: card([[String(other.a), "×", String(c)]]),
          check: {
            kind: "choose",
            // Forgetting the zero on the tens, leaving out the ones, or leaving out the tens.
            choices: rng.shuffle([total, other.a * (other.t + other.o), other.a * other.t * 10, other.a * other.o]),
            answer: total,
            retry: `Split ${c} into ${other.t * 10} and ${other.o}. Multiply by each part, then add both.`,
            right: "Yes! Both parts, then add.",
          },
        },
        { who: "monster", say: "No trick fools you! Now, let's battle!" },
      ];
    },
  },
  {
    // The order of operations: parentheses first, then multiplying (5.OA.1).
    chapter: "5-expressions",
    steps(rng, { monster }) {
      const pick = () => {
        for (;;) {
          const [x, y, z] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
          if (x !== y && y !== z && x !== z) return { x, y, z };
        }
      };
      const a = rng.int(2, 6);
      const [b, c] = digits(rng, 2).map(n => n + 1);
      const sum = b + c;
      const { x, y, z } = pick();
      const first = [String(a), "×", "(", String(b), "+", String(c), ")"];
      const second = [String(x), "+", String(y), "×", String(z)];
      let next = pick();
      // Four different answers: a + b × c, (a + b) × c, a + b + c, a × b + c.
      while (new Set([next.x + next.y * next.z, (next.x + next.y) * next.z, next.x + next.y + next.z, next.x * next.y + next.z]).size < 4) next = pick();
      const value = next.x + next.y * next.z;
      return [
        { who: "monster", say: `I'm ${monster}! My lamp hides a sum inside parentheses. What is the answer?`, picture: card([first]) },
        { who: "hero", say: `Parentheses go first. Work out ${b} plus ${c} inside them.`, picture: card([first], ["t0-2", "t0-3", "t0-4", "t0-5", "t0-6"]) },
        { who: "hero", say: `${b} plus ${c} is ${sum}. The parentheses are done.`, picture: card([first, [String(a), "×", String(sum)]], "t1-2") },
        { who: "hero", say: `Now multiply: ${a} times ${sum} is ${a * sum}.`, picture: card([first, [String(a), "×", String(sum)], [String(a * sum)]], "line-2") },
        { who: "hero", say: `No parentheses here. Multiplying goes before adding, so ${y} times ${z} comes first.`, picture: card([second], ["t0-2", "t0-3", "t0-4"]) },
        {
          who: "hero",
          say: `${y} times ${z} is ${y * z}. Then add ${x}. The answer is ${x + y * z}.`,
          picture: card([second, [String(x), "+", String(y * z)], [String(x + y * z)]], "line-2"),
        },
        {
          who: "monster",
          say: "Flicker! What is this one?",
          picture: card([[String(next.x), "+", String(next.y), "×", String(next.z)]]),
          check: {
            kind: "choose",
            // Adding first, adding everything, or multiplying the first two.
            choices: rng.shuffle([value, (next.x + next.y) * next.z, next.x + next.y + next.z, next.x * next.y + next.z]),
            answer: value,
            retry: "There are no parentheses. Which sign goes first, plus or times?",
            right: "Yes! Multiply first, then add.",
          },
        },
        { who: "monster", say: "My flame is out! Now, let's battle!" },
      ];
    },
  },
  {
    // Adding fractions with different bottoms, by making the bottoms the same (5.NF.1).
    chapter: "5-fractions",
    steps(rng, { monster }) {
      const make = () => {
        for (;;) {
          const [d, e] = rng.pick(/** @type {[number, number][]} */ ([[2, 3], [2, 5], [3, 4], [3, 5], [4, 5]]));
          const [a, b] = [rng.int(1, d - 1), rng.int(1, e - 1)];
          const D = d * e;
          const n = a * e + b * d;
          if (gcd(a, d) !== 1 || gcd(b, e) !== 1 || n >= D || gcd(n, D) !== 1) continue;
          // Wrong answers: the tops and bottoms each added, or the bottoms left alone.
          const wrong = [`${a + b}/${d + e}`, `${a + b}/${D}`, `${a + b}/${Math.max(d, e)}`, `${n}/${d + e}`];
          const right = `${n}/${D}`;
          const worth = (/** @type {string} */ s) => Number(s.split("/")[0]) / Number(s.split("/")[1]);
          const kept = wrong.filter((s, i) => wrong.indexOf(s) === i && s !== right && Math.abs(worth(s) - n / D) > 1e-9);
          if (kept.length < 3) continue;
          return { a, b, d, e, D, n, right, wrong: kept.slice(0, 3) };
        }
      };
      const { a, b, d, e, D, n } = make();
      let other = make();
      while (other.D === D && other.a === a && other.b === b) other = make();
      const ca = a * e;
      const cb = b * d;
      return [
        {
          who: "monster",
          say: `I'm ${monster}! I float in jelly pieces. Here are ${a}/${d} and ${b}/${e} of two jellies. How much jelly is that in all?`,
          picture: bars([{ parts: d, shaded: a, label: `${a}/${d}` }, { parts: e, shaded: b, label: `${b}/${e}` }]),
        },
        {
          who: "hero",
          say: `The pieces are different sizes. We can't add ${parts(d)} to ${parts(e)} yet.`,
          picture: bars([{ parts: d, shaded: a, label: `${a}/${d}` }, { parts: e, shaded: b, label: `${b}/${e}` }], ["bar-0", "bar-1"]),
        },
        { who: "hero", say: `Cut both jellies into ${parts(D)}. Now every piece is the same size.`, picture: bars([{ parts: D, shaded: ca }, { parts: D, shaded: cb }]) },
        {
          who: "hero",
          say: `${a}/${d} is the same as ${ca}/${D}. And ${b}/${e} is the same as ${cb}/${D}.`,
          picture: bars([{ parts: D, shaded: ca, label: `${ca}/${D}` }, { parts: D, shaded: cb, label: `${cb}/${D}` }], ["bar-0-shaded", "bar-1-shaded"]),
        },
        {
          who: "hero",
          say: `Same size pieces, so just add the pieces. ${ca}/${D} and ${cb}/${D} make ${n}/${D}.`,
          picture: bars([{ parts: D, shaded: n, label: `${n}/${D}` }], "bar-0-shaded"),
        },
        {
          who: "monster",
          say: `Splat! What is ${other.a}/${other.d} plus ${other.b}/${other.e}?`,
          picture: bars([{ parts: other.d, shaded: other.a, label: `${other.a}/${other.d}` }, { parts: other.e, shaded: other.b, label: `${other.b}/${other.e}` }]),
          check: {
            kind: "choose",
            choices: rng.shuffle([other.right, ...other.wrong]),
            answer: other.right,
            retry: "Make the bottoms the same first. Then add only the tops.",
            right: "Yes! Same size pieces first, then add.",
          },
        },
        { who: "monster", say: "You pop my plan! Now, let's battle!" },
      ];
    },
  },
  {
    // A fraction is a division: wholes shared equally (5.NF.3).
    chapter: "5-stories",
    steps(rng, { monster }) {
      const make = () => {
        for (;;) {
          const [p, k] = [rng.int(2, 4), rng.int(3, 8)];
          if (p < k && gcd(p, k) === 1) return { p, k };
        }
      };
      const { p, k } = make();
      let other = make();
      while (other.p === p && other.k === k) other = make();
      /** @param {number} count @param {number} cut @param {number} shaded */
      const pizzas = (count, cut, shaded) => Array.from({ length: count }, () => ({ parts: cut, shaded }));
      const all = Array.from({ length: p }, (_, i) => `bar-${i}-shaded`);
      return [
        {
          who: "monster",
          say: `Sorry, sorry! I'm ${monster}, and I pinched ${p} pizzas. Share them equally among ${k} friends. How much pizza does each friend get?`,
          picture: bars(pizzas(p, 1, 1).map(b => ({ ...b, label: `for ${k} friends` }))),
        },
        { who: "hero", say: `Cut every pizza into ${k} equal slices. That makes one slice for each friend.`, picture: bars(pizzas(p, k, 0)) },
        { who: "hero", say: `Each friend takes 1 slice from every pizza. One slice is 1/${k} of a pizza.`, picture: bars(pizzas(p, k, 1), "bar-0-part-0") },
        { who: "hero", say: `That is ${p} slices of 1/${k}, so each friend gets ${p}/${k} of a pizza.`, picture: bars(pizzas(p, k, 1), all) },
        {
          who: "hero",
          say: `Sharing is dividing. ${p} divided by ${k} is the fraction ${p}/${k}.`,
          picture: card([[String(p), "÷", String(k), "=", `${p}/${k}`]], "t0-4"),
        },
        {
          who: "monster",
          say: `Pinch! ${other.p} pizzas are shared equally among ${other.k} friends. How much pizza does each friend get?`,
          picture: bars(pizzas(other.p, 1, 1)),
          check: {
            kind: "choose",
            // Turned upside down, one slice only, or the pizzas and friends added.
            choices: rng.shuffle([`${other.p}/${other.k}`, `${other.k}/${other.p}`, `1/${other.k}`, `${other.p}/${other.p + other.k}`]),
            answer: `${other.p}/${other.k}`,
            retry: "Each pizza is cut into one slice for every friend. Each friend takes a slice from every pizza.",
            right: "Yes! The pizzas on top, the friends on the bottom.",
          },
        },
        { who: "monster", say: "Fair shares! I'm sorry I pinched. Now, let's battle!" },
      ];
    },
  },
  {
    // Changing to a bigger unit by dividing (5.MD.1).
    chapter: "5-units",
    steps(rng, { monster }) {
      const units = [
        { small: "centimeters", sm: "cm", big: "meters", bg: "m", one: "meter", places: 2, says: (/** @type {number} */ n) => `My ice sword is ${n} centimeters long.` },
        { small: "grams", sm: "g", big: "kilograms", bg: "kg", one: "kilogram", places: 3, says: (/** @type {number} */ n) => `My ice shield weighs ${n} grams.` },
        { small: "milliliters", sm: "mL", big: "liters", bg: "L", one: "liter", places: 3, says: (/** @type {number} */ n) => `My icy jug holds ${n} milliliters.` },
      ];
      const u = rng.pick(units);
      let v = rng.pick(units);
      while (v === u) v = rng.pick(units);
      const make = (/** @type {number} */ places) => Number(digits(rng, places + 1).join(""));
      const f = 10 ** u.places;
      const n = make(u.places);
      const m = make(v.places);
      const line0 = [String(n), u.sm, "=", "?", u.bg];
      const fact = ["1", u.bg, "=", String(f), u.sm];
      const answer = formatDecimal(n, u.places);
      const full = [String(n), "÷", String(f), "=", answer];
      return [
        { who: "monster", say: `I'm ${monster}! Brrr! ${u.says(n)} How many ${u.big} is that?`, picture: card([line0]) },
        { who: "hero", say: `${u.big[0].toUpperCase()}${u.big.slice(1)} are bigger. 1 ${u.one} is ${f} ${u.small}.`, picture: card([line0, fact], "line-1") },
        {
          who: "monster",
          say: "So which unit is the bigger one? Tap it!",
          // The bigger unit is in the question, and in the fact under it.
          check: { kind: "tap", answers: ["t0-4", "t1-1"], retry: "Look for the unit that holds many of the other.", right: `Yes! ${u.big[0].toUpperCase()}${u.big.slice(1)} are bigger.` },
        },
        { who: "hero", say: `A bigger unit means fewer of them. So we divide: ${n} divided by ${f}.`, picture: card([line0, fact, full.slice(0, 3)], "line-2") },
        {
          who: "hero",
          say: `Dividing by ${f} slides the decimal point ${u.places} places left. So ${n} ${u.small} is ${answer} ${u.big}.`,
          picture: card([line0, fact, full], "t2-4"),
        },
        {
          who: "monster",
          say: `Chill! ${v.says(m)} How many ${v.big} is that?`,
          picture: card([[String(m), v.sm, "=", "?", v.bg]]),
          check: {
            kind: "choose",
            // Multiplied, or the decimal point one place too near or too far.
            choices: rng.shuffle([formatDecimal(m, v.places), String(m * 10 ** v.places), formatDecimal(m, v.places - 1), formatDecimal(m, v.places + 1)]),
            answer: formatDecimal(m, v.places),
            retry: `${v.big[0].toUpperCase()}${v.big.slice(1)} are bigger, so divide. Count the places the point slides.`,
            right: "Yes! Divide, and slide the point left.",
          },
        },
        { who: "monster", say: "You melt my armor! Now, let's battle!" },
      ];
    },
  },
  {
    // Volume: layers of cubes, length times width times height (5.MD.3-5).
    chapter: "5-volume",
    steps(rng, { monster }) {
      const make = () => {
        for (;;) {
          const [l, w, h] = rng.shuffle([2, 3, 4, 5]);
          return { l, w, h };
        }
      };
      const { l, w, h } = make();
      let other = make();
      for (;;) {
        const [x, y, z] = [other.l, other.w, other.h];
        const choices = [x * y * z, x + y + z, x * y, y * z];
        if (new Set(choices).size === 4 && !(x === l && y === w && z === h)) break;
        other = make();
      }
      const V = l * w * h;
      const box = (/** @type {{ l: number, w: number, h: number }} */ b) => /** @type {ScenePicture} */ ({ kind: "cubes", length: b.l, width: b.w, height: b.h, cubes: true });
      /** @param {string | string[]} [focus] */
      const layer = focus => /** @type {ScenePicture} */ ({ kind: "area", shape: "rectangle", width: l, height: w, grid: true, ...(focus ? { focus } : {}) });
      const line = [String(l), "×", String(w), "×", String(h), "=", String(V)];
      return [
        { who: "monster", say: `Shh! I'm ${monster}, and I sleep in this box of cubes. How many cubes fill my box?`, picture: box({ l, w, h }) },
        { who: "hero", say: `Look at the bottom layer from above. One row has ${l} cubes.`, picture: layer("row-0") },
        {
          who: "hero",
          say: `There are ${w} rows, so one layer has ${l} times ${w}, which is ${l * w} cubes.`,
          picture: layer(Array.from({ length: w }, (_, i) => `row-${i}`)),
        },
        { who: "hero", say: `The box is ${h} layers tall. Each layer has ${l * w} cubes.`, picture: box({ l, w, h }) },
        {
          who: "hero",
          say: `Length times width times height: ${l} times ${w} times ${h} is ${V}. The box holds ${V} cubes.`,
          picture: card([line], ["t0-0", "t0-2", "t0-4"]),
        },
        {
          who: "monster",
          say: "Grr! How many cubes fill this box?",
          picture: box(other),
          check: {
            kind: "choose",
            // Adding the edges, or only one layer, or two of the edges.
            choices: rng.shuffle([other.l * other.w * other.h, other.l + other.w + other.h, other.l * other.w, other.w * other.h]),
            answer: other.l * other.w * other.h,
            retry: "Find the cubes in one layer first. Then count how many layers there are.",
            right: "Yes! Length times width times height.",
          },
        },
        { who: "monster", say: "Grr, you woke me! Now, let's battle!" },
      ];
    },
  },
  {
    // Points on the coordinate plane: across first, then up (5.G.1-2).
    chapter: "5-coordinates",
    steps(rng, { monster }) {
      const pair = () => {
        for (;;) {
          const [x, y] = [rng.int(2, 9), rng.int(2, 9)];
          if (x !== y) return { x, y };
        }
      };
      const { x, y } = pair();
      let other = pair();
      while (other.x === x && other.y === y) other = pair();
      /** @param {string | string[]} [focus] */
      const grid = focus => /** @type {ScenePicture} */ ({
        kind: "coordinates",
        min: 0,
        max: 10,
        points: [{ x: 0, y: 0, label: "O" }, { x, y, label: "A" }, { x, y: 0, label: "B" }, { x: 0, y, label: "C" }],
        ...(focus ? { focus } : {}),
      });
      const found = { x: other.x, y: other.y };
      const all = (/** @type {number} */ p, /** @type {number} */ q) => [`(${p}, ${q})`, `(${q}, ${p})`, `(${p}, 0)`, `(0, ${q})`];
      return [
        { who: "monster", say: `I'm ${monster}! I have seven eyes, but I lost my keys. They are at point A. What are the coordinates of A?`, picture: grid() },
        { who: "hero", say: "We start at O, the corner. Both numbers are 0 there.", picture: grid("point-O") },
        { who: "hero", say: `First go across. B is ${x} steps across from O, so the first number is ${x}.`, picture: grid("point-B") },
        { who: "hero", say: `Then go up. A is ${y} steps up from B, so the second number is ${y}.`, picture: grid("point-A") },
        { who: "hero", say: `So A is at (${x}, ${y}). Across first, then up.`, picture: grid() },
        {
          who: "monster",
          say: `Which point is at (0, ${y})? Tap it!`,
          check: { kind: "tap", answers: ["point-C"], retry: "Zero across means the point sits on the left edge.", right: `Yes! C is 0 across and ${y} up.` },
        },
        {
          who: "monster",
          say: "Where did I lose my other key? What are the coordinates of point D?",
          picture: /** @type {ScenePicture} */ ({
            kind: "coordinates",
            min: 0,
            max: 10,
            points: [{ x: found.x, y: found.y, label: "D" }, { x: found.y, y: found.x, label: "E" }, { x: found.x, y: 0, label: "F" }],
          }),
          check: {
            kind: "choose",
            // Up before across, or only one of the two numbers.
            choices: rng.shuffle(all(found.x, found.y)),
            answer: `(${found.x}, ${found.y})`,
            retry: "Go across first, then up. The across number comes first.",
            right: "Yes! Across, then up.",
          },
        },
        { who: "monster", say: "You found my keys! Now, let's battle!" },
      ];
    },
  },
];
