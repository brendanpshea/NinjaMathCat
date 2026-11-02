// Coins and bills: what a coin is worth, counting a handful, and making change.

import { atGrade, wrongNumbers } from "./common.js";
import { NAMES } from "./word_problems.js";

/** @import { Answer, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * @typedef {object} Money
 * @property {string} id  what the UI draws
 * @property {number} cents
 * @property {string} name
 */

/** @type {readonly Money[]} */
export const MONEY = [
  { id: "penny", cents: 1, name: "penny" },
  { id: "nickel", cents: 5, name: "nickel" },
  { id: "dime", cents: 10, name: "dime" },
  { id: "quarter", cents: 25, name: "quarter" },
  { id: "dollar", cents: 100, name: "one-dollar bill" },
  { id: "five", cents: 500, name: "five-dollar bill" },
  { id: "ten", cents: 1000, name: "ten-dollar bill" },
];

/** @param {string} id */
export function moneyById(id) {
  const money = MONEY.find(m => m.id === id);
  if (!money) throw new RangeError(`No money called ${id}`);
  return money;
}

/**
 * Cents as a child writes them: 35¢ below a dollar, $1.35 from there up.
 * @param {number} cents
 */
export function formatCents(cents) {
  return cents < 100 ? `${cents}¢` : `$${(cents / 100).toFixed(2)}`;
}

/** @typedef {"value" | "same" | "mixed" | "change" | "story"} Kind */

/**
 * What a grade does with money. Coin values and counting coins of one kind in
 * first grade, mixed coins to a dollar and then bills in second, with stories
 * (2.MD.8), and making change in third.
 * @type {readonly [number, { kinds: Kind[], money: string[], max: number }][]}
 */
const PLANS = [
  [1, { kinds: ["value", "same"], money: ["penny", "nickel", "dime"], max: 50 }],
  [1.5, { kinds: ["value", "same", "mixed"], money: ["penny", "nickel", "dime", "quarter"], max: 100 }],
  [2, { kinds: ["same", "mixed", "story"], money: ["penny", "nickel", "dime", "quarter"], max: 100 }],
  [2.5, { kinds: ["same", "mixed", "story"], money: ["penny", "nickel", "dime", "quarter", "dollar", "five"], max: 1000 }],
  [Infinity, { kinds: ["mixed", "change", "story"], money: ["penny", "nickel", "dime", "quarter", "dollar", "five"], max: 1000 }],
];

/**
 * Wrong amounts, as text.
 * @param {Rng} rng
 * @param {number} cents
 * @param {number[]} likely
 * @returns {Answer[]}
 */
function wrongAmounts(rng, cents, likely) {
  return wrongNumbers(rng, cents, likely, { spread: 5, min: 1 }).map(formatCents);
}

/** @type {QuestionType} */
export const money = {
  id: "money",
  name: "Money",
  generate(rng, grade) {
    const plan = atGrade(grade, PLANS);
    const kind = rng.pick(plan.kinds);
    const available = plan.money.map(moneyById);

    if (kind === "value") {
      const coin = rng.pick(available);
      return {
        prompt: `How much is a ${coin.name} worth?`,
        visual: { kind: "money", items: [coin.id] },
        answer: formatCents(coin.cents),
        wrong: rng.shuffle([1, 5, 10, 25, 50, 100].filter(c => c !== coin.cents)).map(formatCents),
        hint: "A dime is the smallest coin, but it is worth more than a penny or a nickel.",
        difficulty: 1,
      };
    }

    if (kind === "same") {
      const coin = rng.pick(available.filter(m => 2 * m.cents <= plan.max));
      const count = rng.int(2, Math.min(10, Math.floor(plan.max / coin.cents)));
      const total = count * coin.cents;
      return {
        prompt: "How much money is this?",
        visual: { kind: "money", items: Array(count).fill(coin.id) },
        answer: formatCents(total),
        // Counting every coin as a penny, or one coin too many or too few.
        wrong: wrongAmounts(rng, total, [count, total + coin.cents, total - coin.cents]),
        hint: coin.cents === 1 ? "Count them one at a time."
          : coin.cents < 100 ? `Count by ${coin.cents}s.`
          : `Each ${coin.name} is ${formatCents(coin.cents)}.`,
        difficulty: 1 + Number(coin.cents === 25) + Number(count > 5),
      };
    }

    if (kind === "story") return moneyStory(rng, available, plan.max);

    if (kind === "mixed") {
      const items = mixedHandful(rng, available, plan.max);
      const total = items.reduce((sum, m) => sum + m.cents, 0);
      const smallest = items[items.length - 1].cents;
      // Up to second grade the handful is laid out biggest first, the way to count it.
      const shown = grade <= 2 ? items : rng.shuffle(items);
      return {
        prompt: "How much money is this?",
        visual: { kind: "money", items: shown.map(m => m.id) },
        answer: formatCents(total),
        wrong: wrongAmounts(rng, total, [items.length, total + smallest, total - smallest, total + 5, total - 5, total + 10, total - 10]),
        hint: "Start with the one worth the most, then count on.",
        difficulty: 1 + Number(items.length > 3) + Number(total >= 100),
      };
    }

    // Making change for a price in 5¢ steps, paid with the next bill up, so
    // there is always change: $1.00 is paid with a five, $5.00 with a ten.
    const price = 5 * rng.int(3, 199);
    const paid = price < 100 ? 100 : price < 500 ? 500 : 1000;
    const change = paid - price;
    return {
      prompt: `Something costs ${formatCents(price)}. You pay with a ${moneyById(paid === 100 ? "dollar" : paid === 500 ? "five" : "ten").name}. How much change do you get?`,
      answer: formatCents(change),
      wrong: wrongAmounts(rng, change, [change + 10, change - 10, change + 5, change - 5, change + 100, change - 100]),
      hint: `Count up from ${formatCents(price)} to ${formatCents(paid)}.`,
      difficulty: 3,
    };
  },
};

/**
 * Two to five pieces of money, of at least two kinds, adding up to no more
 * than max. Sorted biggest first.
 * @param {Rng} rng
 * @param {readonly Money[]} available  must include the penny
 * @param {number} max
 * @returns {Money[]}
 */
export function mixedHandful(rng, available, max) {
  for (;;) {
    const size = rng.int(2, 5);
    /** @type {Money[]} */
    const items = [];
    let total = 0;
    while (items.length < size) {
      const fits = available.filter(a => total + a.cents <= max);
      if (fits.length === 0) break;
      const m = rng.pick(fits);
      items.push(m);
      total += m.cents;
    }
    if (new Set(items.map(m => m.id)).size >= 2) return items.sort((x, y) => y.cents - x.cents);
  }
}

/** Things to buy, and the most each can cost, in cents. */
const SHOP = [
  { thing: "a pencil", most: 95 }, { thing: "a sticker", most: 95 }, { thing: "a banana", most: 95 },
  { thing: "a bouncy ball", most: 95 }, { thing: "a toy car", most: 995 }, { thing: "a book", most: 995 },
];

/**
 * How many of a coin or bill, in words: a quarter, 3 dimes, 2 pennies.
 * @param {number} count
 * @param {Money} m
 */
function some(count, m) {
  return count === 1 ? `a ${m.name}` : `${count} ${m.name === "penny" ? "pennies" : `${m.name}s`}`;
}

/**
 * A money story (2.MD.8): what some coins and bills come to, what is left
 * after buying something, or how much more is needed.
 * @param {Rng} rng
 * @param {readonly Money[]} available
 * @param {number} max
 * @returns {import("./common.js").Draft}
 */
function moneyStory(rng, available, max) {
  const name = rng.pick(NAMES);
  const kind = rng.pick(["handful", "spend", "short"]);
  if (kind === "handful") {
    for (;;) {
      const [big, small] = rng.shuffle([...available]).slice(0, 2).sort((x, y) => y.cents - x.cents);
      const [m, n] = [rng.int(1, 4), rng.int(2, 5)];
      const total = m * big.cents + n * small.cents;
      if (total > max) continue;
      return {
        prompt: `${name} has ${some(m, big)} and ${some(n, small)}. How much money does ${name} have?`,
        answer: formatCents(total),
        // Counting the pieces, the smaller ones as pennies, or one piece too many or too few.
        wrong: wrongAmounts(rng, total, [m + n, m * big.cents + n, total + small.cents, total - small.cents, total + big.cents, total - big.cents]),
        hint: `Count the ${big.name === "penny" ? "pennies" : `${big.name}s`} first, then count on.`,
        difficulty: 2 + Number(total >= 100),
      };
    }
  }
  // Prices in 5¢ steps, and never more money in a story than the grade counts to.
  const shop = rng.pick(SHOP.filter(s => s.most <= max));
  const price = 5 * rng.int(2, Math.min(shop.most, max - 5) / 5);
  /** @param {number} answer @param {number[]} likely */
  const wrong = (answer, likely) => wrongNumbers(rng, answer, likely, { min: 5, step: 5 }).map(formatCents);
  if (kind === "spend") {
    const other = 5 * rng.int(1, (max - price) / 5);
    const has = price + other;
    return {
      prompt: `${name} has ${formatCents(has)} and buys ${shop.thing} for ${formatCents(price)}. How much money is left?`,
      answer: formatCents(other),
      wrong: wrong(other, [has + price, other + 10, other - 10, price]),
      hint: `Take ${formatCents(price)} away from ${formatCents(has)}, or count up from ${formatCents(price)}.`,
      difficulty: 2 + Number(has >= 100),
    };
  }
  const has = 5 * rng.int(1, price / 5 - 1);
  const need = price - has;
  return {
    prompt: `${shop.thing[0].toUpperCase()}${shop.thing.slice(1)} costs ${formatCents(price)}. ${name} has ${formatCents(has)}. How much more money does ${name} need?`,
    answer: formatCents(need),
    wrong: wrong(need, [price + has, need + 10, need - 10, has]),
    hint: `Count up from ${formatCents(has)} to ${formatCents(price)}.`,
    difficulty: 2 + Number(price >= 100),
  };
}
