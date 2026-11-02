// tests/money.test.js — coins, bills and change (src/questions/money.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { money, formatCents, moneyById, mixedHandful } from "../src/questions/money.js";
import { createRng } from "../src/rng.js";
import { questionsOf } from "./helpers.js";

/** Cents from text like "35¢" or "$12.40". */
function cents(text) {
  return text.endsWith("¢") ? Number(text.slice(0, -1)) : Math.round(Number(text.replace(/[$,]/g, "")) * 100);
}

describe("formatCents", () => {
  it("writes cents below a dollar and dollars from there up", () => {
    assert.equal(formatCents(5), "5¢");
    assert.equal(formatCents(99), "99¢");
    assert.equal(formatCents(100), "$1.00");
    assert.equal(formatCents(1234), "$12.34");
  });
});

describe("money questions", () => {
  it("add up the money shown", () => {
    for (const { question: q, at } of questionsOf(money)) {
      if (q.prompt !== "How much money is this?") continue;
      const total = q.visual.items.reduce((sum, id) => sum + moneyById(id).cents, 0);
      assert.equal(q.answer, formatCents(total), at);
    }
  });

  it("know what each coin is worth", () => {
    for (const { question: q, at } of questionsOf(money)) {
      if (!q.prompt.endsWith("worth?")) continue;
      assert.equal(q.answer, formatCents(moneyById(q.visual.items[0]).cents), at);
    }
  });

  it("give the right change, and always some", () => {
    for (const { question: q, at } of questionsOf(money)) {
      if (!q.prompt.includes("change")) continue;
      const price = cents(q.prompt.match(/costs (\S+)\./)[1]);
      const paid = { "one-dollar bill": 100, "five-dollar bill": 500, "ten-dollar bill": 1000 }[q.prompt.match(/a ([a-z-]+ bill)/)[1]];
      assert.equal(q.answer, formatCents(paid - price), at);
      assert.ok(paid > price, at);
    }
  });

  it("never offer nothing at all as an amount", () => {
    for (const { question: q, at } of questionsOf(money)) {
      for (const c of q.choices) assert.ok(cents(String(c)) > 0, `${at} → ${c}`);
    }
  });

  it("work out money stories with coins and bills (2.MD.8)", () => {
    const VALUE = { penny: 1, nickel: 5, dime: 10, quarter: 25, "one-dollar bill": 100, "five-dollar bill": 500 };
    const piece = (count, name) => (count === "a" ? 1 : Number(count)) * VALUE[name.replace(/pennies$/, "penny").replace(/s$/, "")];
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(money)) {
      const p = q.prompt;
      const handful = p.match(/^(\w+) has (a|\d+) (.+?) and (a|\d+) (.+?)\. How much money does \1 have\?$/);
      const spend = p.match(/ has (\S+) and buys .+ for (\S+)\. How much money is left\?$/);
      const short = p.match(/ costs (\S+)\. \w+ has (\S+)\. How much more money does \w+ need\?$/);
      let expected;
      if (handful) {
        seen.add("handful");
        expected = piece(handful[2], handful[3]) + piece(handful[4], handful[5]);
      } else if (spend) {
        seen.add("spend");
        expected = cents(spend[1]) - cents(spend[2]);
      } else if (short) {
        seen.add("short");
        expected = cents(short[1]) - cents(short[2]);
      } else continue;
      assert.equal(q.answer, formatCents(expected), at);
      assert.ok(expected > 0, at);
      // No more than a dollar until the middle of second grade, and no bills.
      if (grade < 2.5) {
        const amounts = [...p.matchAll(/\$[\d.]+|\d+¢/g)].map(m => cents(m[0]));
        assert.ok(!/bill/.test(p) && expected <= 100 && amounts.every(n => n <= 100), `${at}: more than a dollar`);
      }
    }
    assert.equal(seen.size, 3);
  });

  it("keep making change for third grade and up", () => {
    for (const { grade, question: q, at } of questionsOf(money)) {
      if (q.prompt.includes("change")) assert.ok(grade >= 3, at);
    }
  });
});

describe("mixedHandful", () => {
  it("holds two to five pieces of at least two kinds, within the limit", () => {
    const coins = ["penny", "nickel", "dime", "quarter"].map(moneyById);
    for (let seed = 1; seed <= 500; seed++) {
      const items = mixedHandful(createRng(seed), coins, 50);
      assert.ok(items.length >= 2 && items.length <= 5, `seed ${seed}`);
      assert.ok(new Set(items.map(m => m.id)).size >= 2, `seed ${seed}`);
      assert.ok(items.reduce((sum, m) => sum + m.cents, 0) <= 50, `seed ${seed}`);
    }
  });

  it("copes when the limit leaves room for only pennies", () => {
    const coins = ["penny", "quarter"].map(moneyById);
    for (let seed = 1; seed <= 200; seed++) {
      const items = mixedHandful(createRng(seed), coins, 27);
      assert.ok(items.reduce((sum, m) => sum + m.cents, 0) <= 27, `seed ${seed}`);
    }
  });
});
