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
