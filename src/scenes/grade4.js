// 4th grade's teaching scenes. docs/SCENES.md says how to write one.

import { formatDecimal } from "../questions/decimals.js";

/** @import { Scene, ScenePicture } from "../scenes.js" */

/** A math card, with the parts to ring if any.
 * @param {string[][]} lines @param {string | string[]} [focus] */
const card = (lines, focus) => /** @type {ScenePicture} */ ({ kind: "math", lines, ...(focus ? { focus } : {}) });

/** @param {number} n */
const commas = n => n.toLocaleString("en-US");

/** The place names of a six-digit number, from the ones. */
const PLACES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"];

/** "1 hundred", "8 hundreds". @param {number} d @param {number} k */
const placeCount = (d, k) => `${d} ${d === 1 ? PLACES[k].slice(0, -1) : PLACES[k]}`;

/** Six different digits, none zero, for a number that cannot be misread. @param {import("../rng.js").Rng} rng */
const sixDigits = rng => rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6);

/** A six-digit number as math card tokens, with its comma. @param {number[]} d */
const numberTokens = d => [...d.slice(0, 3).map(String), ",", ...d.slice(3).map(String)];

/** The token that holds the digit k places from the right. @param {number} k */
const tokenOf = k => (k < 3 ? 6 - k : 5 - k);

/** @type {readonly Scene[]} */
export const SCENES = [
  {
    // What a digit is worth in its place (4.NBT.1-2).
    chapter: "4-place",
    steps(rng, { monster }) {
      const digits = sixDigits(rng);
      const at = (/** @type {number} */ k) => digits[5 - k];
      const k = rng.int(1, 5);
      const d = at(k);
      const value = d * 10 ** k;
      const tapK = k === 3 ? 4 : 3;
      const number = numberTokens(digits);
      const lines = [number];
      // Another number to read for the check.
      const digits2 = sixDigits(rng);
      const k2 = rng.int(2, 5);
      const d2 = digits2[5 - k2];
      const value2 = d2 * 10 ** k2;
      return [
        { who: "monster", say: `I am ${monster}! I spilled ink on this number. What is my inky ${d} worth?`, picture: card(lines, `t0-${tokenOf(k)}`) },
        { who: "hero", say: "Each place is worth ten times the place to its right. The last digit is in the ones place.", picture: card(lines, "t0-6") },
        { who: "hero", say: `Count the places from the right. The ${d} is in the ${PLACES[k]} place.`, picture: card(lines, `t0-${tokenOf(k)}`) },
        {
          who: "hero",
          say: `So the ${d} is worth ${placeCount(d, k)}. That is ${d} times ${commas(10 ** k)}, which is ${commas(value)}.`,
          picture: card([number, [String(d), "×", commas(10 ** k), "=", commas(value)]], "line-1"),
        },
        {
          who: "monster",
          say: `Hmm. Then tap the digit in the ${PLACES[tapK]} place!`,
          check: { kind: "tap", answers: [`t0-${tokenOf(tapK)}`], retry: "Count the places again from the right. Start with the ones.", right: `Yes! The ${at(tapK)} is in the ${PLACES[tapK]} place.` },
        },
        {
          who: "monster",
          say: `Grr! Here is another number. What is the value of the ${d2} in it?`,
          picture: card([numberTokens(digits2)], `t0-${tokenOf(k2)}`),
          check: {
            kind: "choose",
            choices: rng.shuffle([commas(value2), String(d2), commas(value2 * 10), commas(value2 / 10)]),
            answer: commas(value2),
            retry: "Name its place first, counting from the ones. Then think how many of that place there are.",
            right: "Yes! Its place tells how much it is worth.",
          },
        },
        { who: "monster", say: "You read my ink! Now, let's battle!" },
      ];
    },
  },
  {
    // A bigger unit holds many smaller ones: change by multiplying (4.MD.1).
    chapter: "4-measures",
    steps(rng, { monster }) {
      const hours = rng.int(2, 9);
      const other = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter(h => h !== hours));
      const ask = [String(hours), "hours", "=", "?", "minutes"];
      const fact = ["1", "hour", "=", "60", "minutes"];
      return [
        { who: "monster", say: `I am ${monster}! My flame burns for ${hours} hours. How many minutes is that?`, picture: card([ask]) },
        { who: "hero", say: "A bigger unit holds many smaller ones. 1 hour holds 60 minutes.", picture: card([ask, fact], "line-1") },
        { who: "hero", say: `To change to the smaller unit, multiply. ${hours} hours is ${hours} times 60 minutes.`, picture: card([ask, fact, [String(hours), "×", "60"]], "line-2") },
        { who: "hero", say: `${hours} times 6 tens is ${hours * 6} tens. That is ${hours * 60} minutes.`, picture: card([ask, fact, [String(hours), "×", "60"], [String(hours * 60), "minutes"]], "line-3") },
        {
          who: "monster",
          say: "Fizz! How many minutes are in 1 hour? Tap it!",
          // 60 is in the fact line, and in the times line under it.
          check: { kind: "tap", answers: ["t1-3", "t2-2"], retry: "Look at the line that starts with 1 hour.", right: "Yes! 1 hour is 60 minutes." },
        },
        {
          who: "monster",
          say: `Hot! Now my flame burns for ${other} hours. How many minutes is that?`,
          picture: card([[String(other), "hours", "=", "?", "minutes"]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([String(other * 60), String(other * 6), String(other + 60), String(other * 100)]),
            answer: String(other * 60),
            retry: "Minutes are the smaller unit, so multiply the hours by the number of minutes in 1 hour.",
            right: "Yes! Hours times 60 gives minutes.",
          },
        },
        { who: "monster", say: "You put out my flame! Now, let's battle!" },
      ];
    },
  },
  {
    // Multiply by splitting into tens and ones, then adding (4.NBT.5).
    chapter: "4-multiply",
    steps(rng, { monster }) {
      const [n, t, o] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
      const [tens, parts, whole] = [t * 10, n * t * 10, n * (t * 10 + o)];
      const lines = [[String(n), "×", `${tens + o}`]];
      const split = [...lines, [String(n), "×", String(tens), "+", String(n), "×", String(o)]];
      const first = [...split, [String(n), "×", String(tens), "=", String(parts)]];
      const second = [...first, [String(n), "×", String(o), "=", String(n * o)]];
      const [n2, t2] = [rng.int(2, 9), rng.int(2, 9)];
      // Keep the carry real: the ones make more than a ten, and not a whole number of tens.
      let ones2 = 0;
      while (n2 * ones2 < 10 || (n2 * ones2) % 10 === 0) ones2 = rng.int(2, 9);
      const whole2 = n2 * (t2 * 10 + ones2);
      return [
        { who: "monster", say: `I am ${monster}! I grabbed ${n} bags of ${tens + o} coins each. How many coins is that?`, picture: card(lines) },
        { who: "hero", say: `Split ${tens + o} into tens and ones: ${tens} and ${o}.`, picture: card(split, ["t1-2", "t1-6"]) },
        { who: "hero", say: `First the tens. ${n} times ${tens} is ${parts}.`, picture: card(first, "line-2") },
        { who: "hero", say: `Then the ones. ${n} times ${o} is ${n * o}.`, picture: card(second, "line-3") },
        { who: "hero", say: `Add the two parts. ${parts} and ${n * o} make ${whole}.`, picture: card([...second, [String(parts), "+", String(n * o), "=", String(whole)]], "line-4") },
        {
          who: "monster",
          say: `Grr! Where is the answer to ${n} times ${tens}? Tap it!`,
          // The tens' part is where the tens are multiplied, and again where the parts are added.
          check: { kind: "tap", answers: ["t2-4", "t4-0"], retry: "Find the line where the tens are multiplied.", right: `Yes! ${n} times ${tens} is ${parts}.` },
        },
        {
          who: "monster",
          say: `Gimme more! What is ${n2} times ${t2 * 10 + ones2}?`,
          picture: card([[String(n2), "×", String(t2 * 10 + ones2)]]),
          check: {
            kind: "choose",
            choices: rng.shuffle([whole2, n2 * t2 + n2 * ones2, n2 * t2 * 10, n2 * t2 * 10 + ((n2 * ones2) % 10)].map(String)),
            answer: String(whole2),
            retry: "Multiply the tens and the ones separately. Then add both parts, with the carried ten.",
            right: "Yes! Tens, then ones, then add.",
          },
        },
        { who: "monster", say: "You took back my gold! Now, let's battle!" },
      ];
    },
  },
  {
    // Share out, and what is left over is the remainder (4.NBT.6).
    chapter: "4-divide",
    steps(rng, { monster }) {
      const d = rng.int(3, 9);
      const q = rng.int(12, 49);
      const rem = rng.int(1, d - 1);
      const total = d * q + rem;
      const ask = [[String(total), "÷", String(d)]];
      const fits = [...ask, [String(d), "×", String(q), "=", String(d * q)]];
      const left = [...fits, [String(total), "−", String(d * q), "=", String(rem)]];
      const answer = [...left, [String(q), "R", String(rem)]];
      // Another sharing for the check.
      const d2 = rng.int(3, 9);
      const q2 = rng.int(12, 49);
      const rem2 = rng.int(1, d2 - 1);
      const total2 = d2 * q2 + rem2;
      return [
        { who: "monster", say: `I am ${monster}! I pinched ${total} shells. Share them evenly among ${d} crabs. How many does each get?`, picture: card(ask) },
        { who: "hero", say: `Find how many ${d}s fit in ${total}. ${d} times ${q} is ${d * q}. ${d} times ${q + 1} is ${d * (q + 1)}, too big.`, picture: card(fits, "line-1") },
        { who: "hero", say: `Take ${d * q} away from ${total}. ${rem} is left over.`, picture: card(left, "t2-4") },
        { who: "hero", say: `Each crab gets ${q}, and ${rem} ${rem === 1 ? "shell is" : "shells are"} left over. That is ${q} remainder ${rem}.`, picture: card(answer, "line-3") },
        {
          who: "monster",
          say: "Sorry, not sorry! Which number is the remainder? Tap it!",
          check: { kind: "tap", answers: ["t2-4", "t3-2"], retry: "The remainder is the part left over after sharing.", right: "Yes! It is always less than the number you divide by." },
        },
        {
          who: "monster",
          say: `Pinch! Now I have ${total2} shells for ${d2} crabs. What is ${total2} divided by ${d2}?`,
          picture: card([[String(total2), "÷", String(d2)]]),
          check: {
            kind: "choose",
            // One share too many, the remainder dropped, or the two turned round; none worth the same as the answer.
            choices: rng.shuffle([`${q2} R ${rem2}`, String(q2), `${q2 + 1} R ${rem2}`, `${rem2} R ${q2}`]),
            answer: `${q2} R ${rem2}`,
            retry: `Find the most ${d2}s that fit. What is left must be less than ${d2}.`,
            right: "Yes! Share out what you can, then write what is left.",
          },
        },
        { who: "monster", say: "Oh, sorry! You beat my pinching. Now, let's battle!" },
      ];
    },
  },
  {
    // Angles in degrees, named against a right angle of 90: acute, right, obtuse, straight (4.MD.5, 4.G.1).
    chapter: "4-angles",
    steps(rng, { monster }) {
      /** @param {number} d */
      const kindOf = d => (d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : "straight");
      /** @param {number} degrees @param {boolean} [protractor] */
      const angle = (degrees, protractor = false) => /** @type {ScenePicture} */ ({ kind: "angle", degrees, base: "left", protractor });
      // The angle to name: plainly smaller or bigger than a right angle, or one. The examples are other angles.
      const target = rng.pick([5 * rng.int(5, 13), 5 * rng.int(23, 31), 90]);
      let [acute, obtuse] = [target, target];
      while (acute === target) acute = 5 * rng.int(5, 13);
      while (obtuse === target) obtuse = 5 * rng.int(23, 31);
      return [
        { who: "monster", say: `I am ${monster}! I see angles everywhere with all my eyes. What kind of angle is this one?`, picture: angle(target) },
        { who: "hero", say: "Angles are measured in degrees. A square corner, a right angle, is exactly 90 degrees.", picture: angle(90, true) },
        { who: "hero", say: `An angle smaller than a right angle is acute, like this one: ${acute} degrees.`, picture: angle(acute, true) },
        { who: "hero", say: `An angle bigger than a right angle, but not yet a straight line, is obtuse: ${obtuse} degrees.`, picture: angle(obtuse, true) },
        { who: "hero", say: "A straight line is 180 degrees, half a turn. A whole turn, all the way round, is 360 degrees.", picture: angle(180, true) },
        {
          who: "monster",
          say: `Hmph! So, what kind is my angle? Here it is again: ${target} degrees.`,
          picture: angle(target, true),
          check: {
            kind: "choose",
            choices: rng.shuffle(["acute", "right", "obtuse", "straight"]),
            answer: kindOf(target),
            retry: "Compare it with a square corner, 90 degrees. Is it smaller, just the same, or bigger?",
            right: target === 90 ? "Yes! 90 degrees is a right angle." : `Yes! ${target} degrees is ${kindOf(target)}.`,
          },
        },
        { who: "monster", say: "You saw it all! Now, let's battle!" },
      ];
    },
  },
  {
    // The same amount with more, smaller parts: multiply top and bottom (4.NF.1).
    chapter: "4-fractions",
    steps(rng, { monster }) {
      const d = rng.int(3, 6);
      const n = rng.int(1, d - 1);
      const k = rng.int(2, 3);
      /** @param {string | string[]} [focus] @param {boolean} [both] */
      const bars = (both, focus) => /** @type {ScenePicture} */ ({
        kind: "fraction_bars",
        bars: [{ parts: d, shaded: n, label: `${n}/${d}` }, ...(both ? [{ parts: d * k, shaded: n * k }] : [])],
        ...(focus ? { focus } : {}),
      });
      // Another fraction for the check.
      const d2 = rng.int(3, 6);
      const n2 = rng.pick([1, 2, 3, 4, 5].filter(x => x < d2 && !(x === n && d2 === d)));
      const k2 = rng.int(2, 4);
      return [
        { who: "monster", say: `I am ${monster}! This bar is my tomato. ${n}/${d} of it is ripe. Can you cut it up and still keep the same amount?`, picture: bars(false) },
        { who: "hero", say: `Cut every part into ${k} equal pieces. Now the bar has ${d * k} parts, and ${n * k} are shaded.`, picture: bars(true, "bar-1") },
        { who: "hero", say: "Look! The shaded part is just as long. It is the same amount.", picture: bars(true, ["bar-0-shaded", "bar-1-shaded"]) },
        {
          who: "hero",
          say: `Multiply the top and the bottom by ${k}. ${n}/${d} is worth the same as ${n * k}/${d * k}.`,
          picture: { kind: "math", lines: [[String(n), "×", String(k), "=", String(n * k)], [String(d), "×", String(k), "=", String(d * k)]], focus: ["line-0", "line-1"] },
        },
        {
          who: "monster",
          say: `Splat! Which fraction is worth the same as ${n2}/${d2}?`,
          picture: { kind: "fraction_bars", bars: [{ parts: d2, shaded: n2, label: `${n2}/${d2}` }] },
          check: {
            kind: "choose",
            choices: rng.shuffle([`${n2 * k2}/${d2 * k2}`, `${n2 + k2}/${d2 + k2}`, `${n2 * k2}/${d2}`, `${n2}/${d2 * k2}`]),
            answer: `${n2 * k2}/${d2 * k2}`,
            retry: "To keep the same amount, do the same to the top and the bottom. Multiply both by the same number.",
            right: "Yes! The same number on top and bottom.",
          },
        },
        { who: "monster", say: "You saved my soup! Now, let's battle!" },
      ];
    },
  },
  {
    // Tenths and hundredths on a grid of 100, as decimals (4.NF.5-6).
    chapter: "4-decimals",
    steps(rng, { monster }) {
      const frozen = 10 * rng.int(2, 7) + rng.int(1, 9);
      const [tenths, ones] = [Math.floor(frozen / 10), frozen % 10];
      /** @param {number} shaded @param {string | string[]} [focus] */
      const wall = (shaded, focus) => /** @type {ScenePicture} */ ({ kind: "hundredths", grids: [shaded], ...(focus ? { focus } : {}) });
      // A second wall for the check, with digits that turn round into a different number.
      let other = frozen;
      while (other === frozen || other % 10 === Math.floor(other / 10)) other = 10 * rng.int(1, 8) + rng.int(1, 9);
      const turned = 10 * (other % 10) + Math.floor(other / 10);
      return [
        { who: "monster", say: `I am ${monster}! This is my wall of 100 ice blocks. I froze some of them. How much of my wall is frozen?`, picture: wall(frozen) },
        { who: "hero", say: "The whole wall is 1. Each column is one tenth of the wall, written 0.1.", picture: wall(frozen, "column-0") },
        { who: "hero", say: "Each little block is one hundredth of the wall, written 0.01.", picture: wall(frozen, `square-${frozen - 1}`) },
        { who: "hero", say: `${tenths} full columns and ${ones} more ${ones === 1 ? "block" : "blocks"} make ${frozen} hundredths. So ${formatDecimal(frozen, 2)} of the wall is frozen.`, picture: wall(frozen, ["full", "extra"]) },
        {
          who: "monster",
          say: `Then which column has just ${ones} frozen ${ones === 1 ? "block" : "blocks"}? Tap it!`,
          check: { kind: "tap", answers: [`column-${tenths}`], retry: "Look for the column that is only part frozen.", right: ones === 1 ? "Yes! That is the 1 hundredth." : `Yes! Those are the ${ones} hundredths.` },
        },
        {
          who: "monster",
          say: "Grr! Here is another wall. How much of it is frozen?",
          picture: wall(other),
          check: {
            kind: "choose",
            choices: rng.shuffle([formatDecimal(other, 2), formatDecimal(other, 1), formatDecimal(turned, 2), formatDecimal(100 - other, 2)]),
            answer: formatDecimal(other, 2),
            retry: "Count the full columns first: those are tenths. Then the blocks left over are hundredths.",
            right: "Yes! Tenths first, then hundredths.",
          },
        },
        { who: "monster", say: "You see right through my ice! Now, let's battle!" },
      ];
    },
  },
  {
    // Area is the rows times the squares in a row (4.MD.3).
    chapter: "4-area",
    steps(rng, { monster }) {
      const w = rng.int(4, 9);
      let h = w;
      while (h === w) h = rng.int(3, 6);
      const rows = Array.from({ length: h }, (_, i) => `row-${i}`);
      /** @param {string | string[]} [focus] */
      const lid = focus => /** @type {ScenePicture} */ ({ kind: "area", shape: "rectangle", width: w, height: h, grid: true, ...(focus ? { focus } : {}) });
      // A lid with no squares, for the check: long and thin, so area and perimeter differ.
      const w2 = rng.int(10, 20);
      const h2 = rng.int(3, 9);
      return [
        { who: "monster", say: `I am ${monster}! My lid is covered with square tiles. Each tile is 1 square unit. How many tiles cover my lid?`, picture: lid() },
        { who: "hero", say: `Look at one row. It has ${w} tiles.`, picture: lid("row-0") },
        { who: "hero", say: `Your lid has ${h} rows, and every row is the same.`, picture: lid(rows) },
        { who: "hero", say: `${h} rows of ${w} tiles. ${h} times ${w} is ${h * w}. The area is ${h * w} square units.` },
        {
          who: "monster",
          say: `Chomp! Now my lid has no tiles. It is ${w2} centimeters long and ${h2} centimeters wide. What is its area, in square centimeters?`,
          picture: { kind: "area", shape: "rectangle", width: w2, height: h2, grid: false, labels: { base: `${w2} cm`, height: `${h2} cm` } },
          check: {
            kind: "choose",
            choices: rng.shuffle([w2 * h2, w2 + h2, 2 * (w2 + h2)]),
            answer: w2 * h2,
            retry: "Area counts squares that cover the lid. Multiply the two sides. Do not add them.",
            right: "Yes! Length times width.",
          },
        },
        { who: "monster", say: "You opened my treasure! Now, let's battle!" },
      ];
    },
  },
];
