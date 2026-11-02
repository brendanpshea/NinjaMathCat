// tests/scenes_grade2.test.js — 2nd grade's teaching scenes
// (src/scenes/grade2.js): each example worked through again from its pictures.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

/** What base-ten blocks are worth. */
const worth = p => 100 * p.hundreds + 10 * p.tens + p.ones;
/** The numbers on the first line of a math card. */
const numbers = p => p.lines[0].filter(t => /^\d+$/.test(t)).map(Number);
const check = steps => steps.find(s => s.check).check;

describe("2nd grade's teaching scenes", () => {
  it("Adding and subtracting to 100: trade 10 ones for a ten", () => {
    const firsts = new Set();
    for (const { steps, at } of playedScenes("2-to-100")) {
      const [a, b] = numbers(steps[0].picture);
      firsts.add(`${a}+${b}`);
      const pile = steps[1].picture;
      assert.equal(worth(pile), a + b, at);
      assert.ok(pile.ones > 10 && pile.ones % 1 === 0, `${at}: the ones make more than 10`);
      assert.equal(pile.tens, Math.floor(a / 10) + Math.floor(b / 10), at);
      assert.equal(pile.ones, (a % 10) + (b % 10), at);
      assert.match(steps[1].say, new RegExp(`${pile.tens} tens`), at);
      assert.match(steps[2].say, new RegExp(`${pile.ones} ones`), at);
      // The ring is on 10 of the ones.
      assert.equal(steps[3].picture.focus.length, 10, at);
      assert.ok(steps[3].picture.focus.every(f => /^unit-\d$/.test(f) && Number(f.slice(5)) < pile.ones), at);
      // After the trade: the same amount, with fewer than 10 ones.
      const traded = steps[4].picture;
      assert.equal(worth(traded), a + b, at);
      assert.ok(traded.ones < 10 && traded.tens === pile.tens + 1, at);
      assert.ok(steps[4].say.includes(`That makes ${a + b}.`), at);
      assert.ok(steps[4].say.includes(`${traded.ones} ${traded.ones === 1 ? "one" : "ones"}`), at);
      // The check: a different sum, the right answer among the mistakes.
      const [c, d] = numbers(steps[5].picture);
      assert.notDeepEqual([c, d], [a, b], at);
      assert.equal(steps[5].check.answer, c + d, at);
      assert.ok((c % 10) + (d % 10) > 10 && c + d < 100, at);
      assert.ok(steps[5].check.choices.includes(c + d - 10), at);
    }
    assert.ok(firsts.size > 20);
  });

  it("Number stories: know, need, and getting more means add", () => {
    for (const { steps, at } of playedScenes("2-stories")) {
      const coins = worth(steps[0].picture);
      assert.match(steps[0].say, new RegExp(`I have ${coins} coins`), at);
      const [a, b] = numbers(steps[1].picture);
      assert.equal(a, coins, at);
      assert.ok(b > 0 && a % 10 + b % 10 < 10, `${at}: no trading in the story`);
      assert.match(steps[1].say, new RegExp(`grabbed ${b} more`), at);
      // The ring follows the line: the two numbers we know, then the sign and the question.
      assert.deepEqual(steps[2].picture.focus, ["t0-0", "t0-2"], at);
      assert.deepEqual(steps[3].picture.focus, ["t0-1", "t0-4"], at);
      const line = steps[4].picture.lines[0];
      assert.deepEqual(line.map(String), [String(a), "+", String(b), "=", String(a + b)], at);
      assert.ok(steps[4].say.startsWith(`${a} and ${b} more make ${a + b}.`), at);
      // The check: a new story, where the right answer is to add.
      const [c, d] = numbers(steps[5].picture);
      assert.equal(check(steps).answer, c + d, at);
      assert.ok(check(steps).choices.includes(c - d) && check(steps).choices.includes(c), at);
      assert.ok(steps[5].say.includes(`had ${c} gems`) && steps[5].say.includes(`grabbed ${d} more`), at);
      assert.ok(c + d < 100, at);
    }
  });

  it("Numbers to 1000: hundreds, tens and ones, and what a digit is worth", () => {
    for (const { steps, at } of playedScenes("2-to-1000")) {
      const blocks = steps[0].picture;
      const n = worth(blocks);
      const digits = [blocks.hundreds, blocks.tens, blocks.ones];
      assert.ok(digits.every(d => d >= 1 && d <= 9) && new Set(digits).size === 3, `${at}: three different digits`);
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus, steps[3].picture.focus], ["flats", "rods", "units"], at);
      assert.match(steps[1].say, new RegExp(`${blocks.hundreds} hundreds?\\.$`), at);
      assert.match(steps[2].say, new RegExp(`${blocks.tens} tens?\\.$`), at);
      assert.match(steps[3].say, new RegExp(`${blocks.ones} ones?\\.$`), at);
      assert.equal(blocks.hundreds === 1, steps[1].say.includes("There is"), at);
      // The card spells the number out, and the ring is on the tens digit.
      const card = steps[4].picture;
      assert.equal(card.lines[0].filter(t => /^\d+$/.test(t)).map(Number).reduce((x, y) => x + y), n, at);
      assert.equal(card.lines[1].join(""), String(n), at);
      assert.equal(card.focus, "t1-1", at);
      assert.equal(card.lines[1][1], String(blocks.tens), at);
      assert.ok(steps[4].say.includes(`make ${n}. The ${blocks.tens} is worth ${10 * blocks.tens}.`), at);
      // The check: the tens digit of another number.
      const [h, t, o] = steps[5].picture.lines[0].map(Number);
      assert.equal(check(steps).answer, 10 * t, at);
      assert.ok(steps[5].say.includes(`In ${100 * h + 10 * t + o}, what is the ${t} worth?`), at);
      assert.notEqual(100 * h + 10 * t + o, n, at);
    }
  });

  it("Rulers and number lines: start at 0, read the end, or count the steps", () => {
    for (const { steps, at } of playedScenes("2-lines")) {
      const [first] = steps[0].picture.ribbons;
      assert.equal(first.from, 0, at);
      assert.equal(steps[0].picture.ruler, "centimeters", at);
      assert.equal(steps[1].picture.focus, `ribbon-${first.color}`, at);
      assert.equal(steps[2].picture.focus, "ruler", at);
      assert.ok(steps[2].say.includes(`ends: ${first.length}. It is ${first.length} centimeters long.`), at);
      // The second ribbon starts away from 0.
      const [second] = steps[3].picture.ribbons;
      assert.ok(second.from > 0 && second.color !== first.color, at);
      assert.ok(second.from + second.length <= steps[3].picture.span, at);
      assert.ok(steps[3].say.includes(`starts at ${second.from}.`), at);
      assert.equal(steps[3].picture.focus, `ribbon-${second.color}`, at);
      const { choices, answer } = check(steps);
      assert.equal(answer, second.length, at);
      // The mistakes: the end number, the start number, one too many.
      for (const wrong of [second.from + second.length, second.from, second.length + 1]) assert.ok(choices.includes(wrong), at);
      assert.equal(steps[5].picture.ribbons[0].from, second.from, at);
    }
  });

  it("Bigger sums: one place at a time", () => {
    for (const { steps, at } of playedScenes("2-bigger")) {
      const pot = steps[0].picture;
      const [, a, b] = steps[0].say.match(/stirred (\d+) and (\d+) blocks/);
      const digit = (n, place) => Math.floor(Number(n) / place) % 10;
      assert.equal(pot.hundreds, digit(a, 100) + digit(b, 100), at);
      assert.equal(pot.tens, digit(a, 10) + digit(b, 10), at);
      assert.equal(pot.ones, digit(a, 1) + digit(b, 1), at);
      assert.ok(pot.hundreds < 10 && pot.tens < 10 && pot.ones < 10, `${at}: no trading`);
      assert.equal(worth(pot), Number(a) + Number(b), at);
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus, steps[3].picture.focus], ["flats", "rods", "units"], at);
      assert.ok(steps[1].say.endsWith(`Hundreds: ${digit(a, 100)} and ${digit(b, 100)} make ${pot.hundreds}.`), at);
      assert.equal(steps[2].say, `Tens: ${digit(a, 10)} and ${digit(b, 10)} make ${pot.tens}.`, at);
      assert.equal(steps[3].say, `Ones: ${digit(a, 1)} and ${digit(b, 1)} make ${pot.ones}.`, at);
      assert.equal(steps[4].say, `${pot.hundreds} hundreds, ${pot.tens} tens and ${pot.ones} ones make ${worth(pot)}.`, at);
      assert.equal(steps[4].picture.lines[1][0], String(worth(pot)), at);
      const [c, d] = numbers(steps[5].picture);
      assert.equal(check(steps).answer, c + d, at);
      assert.ok(check(steps).choices.includes(c + d + 100), at);
      assert.ok(`${c}${d}` !== `${a}${b}`, at);
    }
  });

  it("Equal groups: the same number added once for each row", () => {
    for (const { steps, at } of playedScenes("2-groups")) {
      const { rows } = steps[0].picture;
      const [g, k] = [rows.length, rows[0].count];
      assert.ok(rows.every(r => r.count === k) && g >= 2 && k >= 2 && g !== k, at);
      assert.match(steps[0].say, new RegExp(`in ${g} rows`), at);
      assert.equal(steps[1].say, `This row has ${k} stars.`, at);
      assert.equal(steps[1].picture.focus, "row-0", at);
      assert.deepEqual(steps[2].picture.focus, rows.map((_, i) => `row-${i}`), at);
      // Count by k, one jump for each row.
      const jumps = steps[3].say.match(/: ([\d, ]+)\.$/)[1].split(", ").map(Number);
      assert.deepEqual(jumps, rows.map((_, i) => k * (i + 1)), at);
      const line = steps[3].picture.lines[0];
      assert.equal(line.filter(t => t === "+").length, g - 1, at);
      assert.ok(line.filter(t => t !== "+").every(t => t === String(k)), at);
      const done = steps[4].picture;
      assert.equal(done.lines[0].at(-1), String(g * k), at);
      assert.equal(done.lines[0][done.focus.slice(3)], String(g * k), at);
      assert.equal(steps[4].say, `${g} rows of ${k} make ${g * k} in all.`, at);
      // The check: another set of rows.
      const [g2, k2] = [steps[5].picture.rows.length, steps[5].picture.rows[0].count];
      assert.ok(g2 !== k2 && (g2 !== g || k2 !== k), at);
      assert.equal(check(steps).answer, g2 * k2, at);
      assert.ok(check(steps).choices.includes(g2 + k2) && check(steps).choices.includes(k2), at);
    }
  });

  it("Money: count the biggest coins first, then count on", () => {
    const VALUE = { dime: 10, nickel: 5, penny: 1 };
    for (const { steps, at } of playedScenes("2-money")) {
      const items = steps[0].picture.items;
      const total = items.reduce((sum, coin) => sum + VALUE[coin], 0);
      // Biggest first, as the line counts them.
      assert.deepEqual(items, [...items].sort((x, y) => VALUE[y] - VALUE[x]), at);
      const kinds = ["dime", "nickel", "penny"];
      // Each step rings its own kind of coin, and only those.
      steps.slice(1, 4).forEach((step, i) => {
        const focus = [step.picture.focus].flat();
        assert.ok(focus.length > 0 && focus.every(f => items[Number(f.slice(5))] === kinds[i]), `${at}: step ${i + 2} rings the wrong coins`);
        assert.equal(focus.length, items.filter(c => c === kinds[i]).length, at);
      });
      // The counting runs on to the total.
      assert.ok(steps[3].say.includes(`Count on: `) && steps[3].say.match(/(\d+)\.$/)[1] === String(total), at);
      assert.equal(steps[4].say, `All the coins are worth ${total} cents.`, at);
      assert.equal(steps[1].say.match(/(\d+)\.$/)[1], String(10 * items.filter(c => c === "dime").length), at);
      assert.equal(steps[2].say.match(/(\d+)\.$/)[1], String(items.filter(c => c !== "penny").reduce((sum, c) => sum + VALUE[c], 0)), at);
      const other = steps[5].picture.items;
      const right = other.reduce((sum, coin) => sum + VALUE[coin], 0);
      assert.notDeepEqual(other, items, at);
      assert.equal(check(steps).answer, right, at);
      assert.ok(check(steps).choices.includes(other.length), at);
      // One coin is "A nickel", not "Nickels".
      assert.equal(items.filter(c => c === "nickel").length === 1, steps[2].say.startsWith("A nickel is"), at);
      assert.equal(items.filter(c => c === "penny").length === 1, steps[3].say.startsWith("A penny is"), at);
    }
  });

  it("Telling time: the short hand is the hour, the long hand counts by fives", () => {
    for (const { steps, at } of playedScenes("2-time")) {
      const { hours, minutes } = steps[0].picture;
      assert.ok(minutes % 5 === 0 && minutes >= 10 && minutes <= 25, at);
      const k = minutes / 5;
      assert.equal(steps[1].picture.focus, "hour-hand", at);
      assert.ok(steps[1].say.endsWith(`passed ${hours}.`), at);
      assert.equal(steps[2].picture.focus, "minute-hand", at);
      assert.ok(steps[2].say.endsWith(`points at the ${k}.`), at);
      assert.equal(steps[3].picture.focus, `number-${k}`, at);
      const counted = steps[3].say.match(/fives: ([\d, ]+)\./)[1].split(", ").map(Number);
      assert.equal(counted.length, k, at);
      assert.equal(counted.at(-1), minutes, at);
      assert.ok(counted.every((n, i) => n === 5 * (i + 1)), at);
      assert.ok(steps[3].say.endsWith(`That is ${minutes} minutes past ${hours}.`), at);
      assert.deepEqual(steps[4].check.answers, ["hour-hand"], at);
      const second = steps[5].picture;
      assert.equal(steps[5].check.answer, second.minutes, at);
      assert.ok(steps[5].check.choices.includes(second.minutes / 5) && steps[5].check.choices.includes(second.hours), at);
    }
  });
});
