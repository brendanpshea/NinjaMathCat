// 2nd grade's teaching scenes. docs/SCENES.md says how to write one.

/** @import { Scene, ScenePicture } from "../scenes.js" */

/**
 * A count with its word, right for 1 and for many: "1 ten", "3 tens".
 * @param {number} n @param {string} one @param {string} many
 */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Blocks for tens and ones (or hundreds as well), with the parts to ring.
 * @param {number} hundreds @param {number} tens @param {number} ones @param {string | string[]} [focus]
 */
const blocks = (hundreds, tens, ones, focus) => /** @type {ScenePicture} */ ({ kind: "base_ten", hundreds, tens, ones, ...(focus ? { focus } : {}) });

/**
 * Math written large, with the tokens to ring.
 * @param {string[][]} lines @param {string | string[]} [focus]
 */
const card = (lines, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines, ...(focus ? { focus } : {}) });

/** @param {number} n */
const range = n => Array.from({ length: n }, (_, i) => i);

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // Add two 2-digit numbers, trading 10 ones for a ten (2.NBT.5, 2.NBT.6).
    chapter: "2-to-100",
    steps(rng, { monster }) {
      /** A sum whose ones make more than 10: its two tens digits and two ones digits. */
      const sum = () => {
        const [a1, b1] = [rng.int(1, 4), rng.int(1, 4)];
        const a0 = rng.int(4, 9);
        const b0 = rng.int(11 - a0, 9);
        return { a: 10 * a1 + a0, b: 10 * b1 + b0, tens: a1 + b1, ones: a0 + b0 };
      };
      const { a, b, tens, ones } = sum();
      const left = ones - 10;
      const total = a + b;
      let other = sum();
      while (other.a === a && other.b === b) other = sum();
      const right = other.a + other.b;
      return [
        { who: "monster", say: `I'm ${monster}! I sneaked ${a} and ${b} into one pile. How many?`, picture: card([[String(a), "+", String(b)]]) },
        { who: "hero", say: `Let's pile up all the blocks. First, count the tens: ${tens} tens.`, picture: blocks(0, tens, ones, "rods") },
        { who: "hero", say: `Now the ones: ${ones} ones. That is more than 10!`, picture: blocks(0, tens, ones, "units") },
        { who: "hero", say: "Trade 10 ones for 1 ten.", picture: blocks(0, tens, ones, range(10).map(i => `unit-${i}`)) },
        { who: "hero", say: `Now there are ${tens + 1} tens and ${count(left, "one", "ones")}. That makes ${total}.`, picture: blocks(0, tens + 1, left) },
        {
          who: "monster",
          say: `Hmph! Then what is ${other.a} plus ${other.b}?`,
          picture: card([[String(other.a), "+", String(other.b)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([right, right - 10, right + 10, Number(`${other.tens}${other.ones}`)]),
            answer: right,
            retry: "Add the tens, then the ones. Do the ones make 10 or more?",
            right: "Yes! Tens first, then the ones, and trade.",
          },
        },
        { who: "monster", say: "Quack! You caught my sneaky plan. Now, let's battle!" },
      ];
    },
  },
  {
    // A number story: what you know, what you need, and getting more means add (2.OA.1).
    chapter: "2-stories",
    steps(rng, { monster }) {
      /** A story with no trading: coins, and some more. */
      const story = () => {
        const [a1, a0] = [rng.int(2, 7), rng.int(1, 8)];
        // Fewer than the first amount, so taking away would still make a number.
        const [b1, b0] = [rng.int(0, Math.min(2, a1 - 1)), rng.int(1, 9 - a0)];
        return { a: 10 * a1 + a0, b: 10 * b1 + b0 };
      };
      const { a, b } = story();
      const total = a + b;
      let other = story();
      while (other.a === a && other.b === b) other = story();
      const right = other.a + other.b;
      return [
        { who: "monster", say: `I'm ${monster}! I have ${a} coins. Rods are 10, cubes are 1.`, picture: blocks(0, Math.floor(a / 10), a % 10) },
        { who: "monster", say: `Then I grabbed ${b} more! How many coins do I have now?`, picture: card([[String(a), "+", String(b), "=", "?"]]) },
        { who: "hero", say: `First, what do we know? ${a} coins, and ${b} more.`, picture: card([[String(a), "+", String(b), "=", "?"]], ["t0-0", "t0-2"]) },
        { who: "hero", say: "We need to find how many in all. Getting more means add.", picture: card([[String(a), "+", String(b), "=", "?"]], ["t0-1", "t0-4"]) },
        { who: "hero", say: `${a} and ${b} more make ${total}. Add the tens, then the ones.`, picture: card([[String(a), "+", String(b), "=", String(total)]], "t0-4") },
        {
          who: "monster",
          say: `Next I had ${other.a} gems. I grabbed ${other.b} more. How many now?`,
          picture: card([[String(other.a), "?", String(other.b)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([right, other.a - other.b, other.a, right + 10]),
            answer: right,
            retry: "Getting more means adding. Put both amounts together.",
            right: "Yes! More means add.",
          },
        },
        { who: "monster", say: "Hmph! You found every coin. Now, let's battle!" },
      ];
    },
  },
  {
    // Hundreds, tens and ones in blocks, and what a digit is worth (2.NBT.1).
    chapter: "2-to-1000",
    steps(rng, { monster }) {
      /** Three different digits, none of them 0, with at most 6 hundreds so the blocks fit. */
      const digits = () => {
        const h = rng.int(1, 6);
        const [t, o] = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => d !== h));
        return { h, t, o };
      };
      const { h, t, o } = digits();
      const n = 100 * h + 10 * t + o;
      let other = digits();
      while (100 * other.h + 10 * other.t + other.o === n) other = digits();
      return [
        { who: "monster", say: `I'm ${monster}! Splat! My ink hides a number. These blocks show it.`, picture: blocks(h, t, o) },
        { who: "hero", say: `Big flats are hundreds. There ${h === 1 ? "is" : "are"} ${count(h, "hundred", "hundreds")}.`, picture: blocks(h, t, o, "flats") },
        { who: "hero", say: `Rods are tens. There ${t === 1 ? "is" : "are"} ${count(t, "ten", "tens")}.`, picture: blocks(h, t, o, "rods") },
        { who: "hero", say: `Cubes are ones. There ${o === 1 ? "is" : "are"} ${count(o, "one", "ones")}.`, picture: blocks(h, t, o, "units") },
        {
          who: "hero",
          say: `${100 * h}, ${10 * t} and ${o} make ${n}. The ${t} is worth ${10 * t}.`,
          picture: card([[String(100 * h), "+", String(10 * t), "+", String(o)], [String(h), String(t), String(o)]], "t1-1"),
        },
        {
          who: "monster",
          say: `Splat again! In ${100 * other.h + 10 * other.t + other.o}, what is the ${other.t} worth?`,
          picture: card([[String(other.h), String(other.t), String(other.o)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([10 * other.t, other.t, 100 * other.t, 10 * other.o]),
            answer: 10 * other.t,
            retry: "Which place is the digit in: hundreds, tens or ones?",
            right: "Yes! It is in the tens place, so it is worth tens.",
          },
        },
        { who: "monster", say: "You can read through my ink! Now, let's battle!" },
      ];
    },
  },
  {
    // Measuring a ribbon with a ruler: start at 0, read the end; or count the steps (2.MD.1, 2.MD.2).
    chapter: "2-lines",
    steps(rng, { monster }) {
      const colors = rng.shuffle(/** @type {const} */ (["red", "blue", "green", "orange"]));
      const [first, second] = colors;
      const length = rng.int(3, 8);
      // A second ribbon that starts away from 0. Its choices stay different from each other.
      let start = 0;
      let long = 0;
      do {
        start = rng.int(2, 6);
        long = rng.int(3, 7);
      } while (start === long || start === long + 1);
      const end = start + long;
      /** @param {"red" | "blue" | "green" | "orange"} color @param {number} from @param {number} len @param {string | string[]} [focus] */
      const ribbon = (color, from, len, focus) => /** @type {ScenePicture} */ ({ kind: "lengths", ribbons: [{ color, from, length: len }], ruler: "centimeters", cubes: false, span: 15, ...(focus ? { focus } : {}) });
      return [
        { who: "monster", say: `I'm ${monster}! I rained on this ribbon. How long is it?`, picture: ribbon(first, 0, length) },
        { who: "hero", say: "Line up the start of the ribbon with 0.", picture: ribbon(first, 0, length, `ribbon-${first}`) },
        { who: "hero", say: `Read the ruler where the ribbon ends: ${length}. It is ${length} centimeters long.`, picture: ribbon(first, 0, length, "ruler") },
        { who: "monster", say: `Ha! This ribbon does not start at 0. It starts at ${start}.`, picture: ribbon(second, start, long, `ribbon-${second}`) },
        { who: "hero", say: "Count the steps from its start to its end.", picture: ribbon(second, start, long, "ruler") },
        {
          who: "monster",
          say: "Then how long is this ribbon, in centimeters?",
          picture: ribbon(second, start, long),
          check: {
            kind: "choose",
            choices: rng.shuffle([long, end, start, long + 1]),
            answer: long,
            retry: "Do not read just the end. Count the steps from the start.",
            right: "Yes! Count the steps, not the end number.",
          },
        },
        { who: "monster", say: "Grr! You measured my ribbon. Now, let's battle!" },
      ];
    },
  },
  {
    // Add bigger numbers one place at a time (2.NBT.7).
    chapter: "2-bigger",
    steps(rng, { monster }) {
      /** Two numbers whose digits add to at most 9 in every place. */
      const sum = () => {
        const [h1, t1, o1] = [rng.int(1, 4), rng.int(1, 8), rng.int(1, 8)];
        const [h2, t2, o2] = [rng.int(1, 4), rng.int(1, 9 - t1), rng.int(1, 9 - o1)];
        return { h1, t1, o1, h2, t2, o2, a: 100 * h1 + 10 * t1 + o1, b: 100 * h2 + 10 * t2 + o2 };
      };
      const s = sum();
      const [hundreds, tens, ones] = [s.h1 + s.h2, s.t1 + s.t2, s.o1 + s.o2];
      const total = s.a + s.b;
      let other = sum();
      while (other.a === s.a && other.b === s.b) other = sum();
      const right = other.a + other.b;
      return [
        { who: "monster", say: `I'm ${monster}! I stirred ${s.a} and ${s.b} blocks together in my pot.`, picture: blocks(hundreds, tens, ones) },
        { who: "hero", say: `Count one place at a time. Hundreds: ${s.h1} and ${s.h2} make ${hundreds}.`, picture: blocks(hundreds, tens, ones, "flats") },
        { who: "hero", say: `Tens: ${s.t1} and ${s.t2} make ${tens}.`, picture: blocks(hundreds, tens, ones, "rods") },
        { who: "hero", say: `Ones: ${s.o1} and ${s.o2} make ${ones}.`, picture: blocks(hundreds, tens, ones, "units") },
        {
          who: "hero",
          say: `${hundreds} hundreds, ${tens} tens and ${ones} ones make ${total}.`,
          picture: card([[String(100 * hundreds), "+", String(10 * tens), "+", String(ones)], [String(total)]], "line-1"),
        },
        {
          who: "monster",
          say: `Hmph! Then what is ${other.a} plus ${other.b}?`,
          picture: card([[String(other.a), "+", String(other.b)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([right, right + 10, right - 10, right + 100]),
            answer: right,
            retry: "Add the ones, then the tens, then the hundreds. One place at a time.",
            right: "Yes! One place at a time.",
          },
        },
        { who: "monster", say: "Splash! My soup is no trouble for you. Now, let's battle!" },
      ];
    },
  },
  {
    // Equal groups: add the same number once for each group (2.OA.4).
    chapter: "2-groups",
    steps(rng, { monster }) {
      /** Rows of stars: a number of rows and the stars in each, never equal. */
      const rows = () => {
        const g = rng.int(2, 5);
        let k = rng.int(2, 5);
        while (k === g) k = rng.int(2, 5);
        return { g, k };
      };
      /** @param {number} g @param {number} k @param {string | string[]} [focus] */
      const stars = (g, k, focus) => /** @type {ScenePicture} */ ({ kind: "groups", rows: range(g).map(() => ({ name: "stars", emoji: "⭐", count: k })), ...(focus ? { focus } : {}) });
      const { g, k } = rows();
      const total = g * k;
      let other = rows();
      while (other.g === g && other.k === k) other = rows();
      const right = other.g * other.k;
      const sums = range(g).map(i => String(k * (i + 1)));
      const adding = range(g).flatMap(i => (i === 0 ? [String(k)] : ["+", String(k)]));
      return [
        { who: "monster", say: `I'm ${monster}! I lined up my stars in ${g} rows.`, picture: stars(g, k) },
        { who: "hero", say: `This row has ${k} stars.`, picture: stars(g, k, "row-0") },
        { who: "hero", say: `Every row has ${k} stars. These are equal groups.`, picture: stars(g, k, range(g).map(i => `row-${i}`)) },
        { who: "hero", say: `Add ${k} for each row: ${sums.join(", ")}.`, picture: card([adding]) },
        { who: "hero", say: `${g} rows of ${k} make ${total} in all.`, picture: card([[...adding, "=", String(total)]], `t0-${adding.length + 1}`) },
        {
          who: "monster",
          say: "Poof! More stars! How many are there in all?",
          picture: stars(other.g, other.k),
          check: {
            kind: "choose",
            choices: rng.shuffle([right, other.g + other.k, other.k, right + other.k]),
            answer: right,
            retry: "Every row has the same number. Add that number once for each row.",
            right: "Yes! Add the same number for each row.",
          },
        },
        { who: "monster", say: "Tee hee! You saw through my trick. Now, let's battle!" },
      ];
    },
  },
  {
    // Counting coins, biggest first (2.MD.8).
    chapter: "2-money",
    steps(rng, { monster }) {
      /** Dimes, then nickels, then pennies. */
      const coins = () => ({ d: rng.int(2, 3), n: rng.int(1, 2), p: rng.int(1, 4) });
      /** @param {{ d: number, n: number, p: number }} c @param {string | string[]} [focus] */
      const purse = (c, focus) => /** @type {ScenePicture} */ ({ kind: "money", items: [...Array(c.d).fill("dime"), ...Array(c.n).fill("nickel"), ...Array(c.p).fill("penny")], ...(focus ? { focus } : {}) });
      /** @param {number} from @param {number} each @param {number} times */
      const onFrom = (from, each, times) => range(times).map(i => from + each * (i + 1)).join(", ");
      const c = coins();
      const dimes = 10 * c.d;
      const nickels = dimes + 5 * c.n;
      const total = nickels + c.p;
      let other = coins();
      while (other.d === c.d && other.n === c.n && other.p === c.p) other = coins();
      const right = 10 * other.d + 5 * other.n + other.p;
      /** @param {number} from @param {number} n */
      const items = (from, n) => range(n).map(i => `item-${from + i}`);
      return [
        { who: "monster", say: `I'm ${monster}! Pinch! I grabbed these coins. How much money?`, picture: purse(c) },
        { who: "hero", say: `Dimes are 10 cents each. Count by tens: ${onFrom(0, 10, c.d)}.`, picture: purse(c, items(0, c.d)) },
        {
          who: "hero",
          say: c.n === 1 ? `A nickel is 5 cents. Count on: ${nickels}.` : `Nickels are 5 cents each. Count on: ${onFrom(dimes, 5, c.n)}.`,
          picture: purse(c, items(c.d, c.n)),
        },
        {
          who: "hero",
          say: c.p === 1 ? `A penny is 1 cent. Count on: ${total}.` : `Pennies are 1 cent each. Count on: ${onFrom(nickels, 1, c.p)}.`,
          picture: purse(c, items(c.d + c.n, c.p)),
        },
        { who: "hero", say: `All the coins are worth ${total} cents.`, picture: purse(c) },
        {
          who: "monster",
          say: "Pinch again! How much money is this, in cents?",
          picture: purse(other),
          check: {
            kind: "choose",
            choices: rng.shuffle([right, other.d + other.n + other.p, right + 5 * other.n, right - other.p]),
            answer: right,
            retry: "Count the biggest coins first. Then count on with the smaller ones.",
            right: "Yes! Biggest coins first, then count on.",
          },
        },
        { who: "monster", say: "Sorry for the pinch! Now, let's battle!" },
      ];
    },
  },
  {
    // Reading a clock to five minutes: the short hand is the hour, the long hand counts by fives (2.MD.7).
    chapter: "2-time",
    steps(rng, { monster }) {
      /** @param {number} hours @param {number} minutes @param {string | string[]} [focus] */
      const clock = (hours, minutes, focus) => /** @type {ScenePicture} */ ({ kind: "clock", hours, minutes, ...(focus ? { focus } : {}) });
      const hours = rng.int(1, 12);
      const minutes = 5 * rng.int(2, 5);
      const k = minutes / 5;
      // A second clock, whose answers (the minutes, the number, the hour, the minutes left) are all different.
      let h2 = 0;
      let m2 = 0;
      do {
        h2 = rng.int(1, 12);
        m2 = 5 * rng.int(2, 5);
      } while (new Set([m2, m2 / 5, h2, 60 - m2]).size < 4 || (h2 === hours && m2 === minutes));
      const counting = range(k).map(i => 5 * (i + 1)).join(", ");
      return [
        { who: "monster", say: `I'm ${monster}! My lamp clock glows. What time is it?`, picture: clock(hours, minutes) },
        { who: "hero", say: `The short hand is the hour hand. It just passed ${hours}.`, picture: clock(hours, minutes, "hour-hand") },
        { who: "hero", say: `The long hand counts minutes. It points at the ${k}.`, picture: clock(hours, minutes, "minute-hand") },
        { who: "hero", say: `Count by fives: ${counting}. That is ${minutes} minutes past ${hours}.`, picture: clock(hours, minutes, `number-${k}`) },
        {
          who: "monster",
          say: "Which hand tells the hour? Tap it!",
          picture: clock(hours, minutes),
          check: { kind: "tap", answers: ["hour-hand"], retry: "The hour hand is the short one.", right: "Yes! The short hand tells the hour." },
        },
        {
          who: "monster",
          say: "Flicker! Here is my other clock. How many minutes past the hour?",
          picture: clock(h2, m2),
          check: {
            kind: "choose",
            choices: rng.shuffle([m2, m2 / 5, h2, 60 - m2]),
            answer: m2,
            retry: "Count by fives from the 12 to where the long hand points.",
            right: "Yes! Count by fives.",
          },
        },
        { who: "monster", say: "You read my clock well! Now, let's battle!" },
      ];
    },
  },
];
