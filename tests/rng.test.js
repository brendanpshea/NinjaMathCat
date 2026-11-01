// tests/rng.test.js — seeded random numbers (src/rng.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/rng.js";

describe("createRng", () => {
  it("gives the same numbers from the same seed", () => {
    const a = createRng(123);
    const b = createRng(123);
    for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
  });

  it("gives different numbers from different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    const same = Array.from({ length: 20 }, () => a.next() === b.next()).filter(Boolean).length;
    assert.ok(same < 2);
  });

  it("next() stays in [0, 1)", () => {
    const rng = createRng(9);
    for (let i = 0; i < 10000; i++) {
      const x = rng.next();
      assert.ok(x >= 0 && x < 1, `${x}`);
    }
  });

  it("int() stays within its bounds and reaches both ends", () => {
    const rng = createRng(5);
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      const n = rng.int(3, 7);
      assert.ok(Number.isInteger(n) && n >= 3 && n <= 7, `${n}`);
      seen.add(n);
    }
    assert.deepEqual([...seen].sort(), [3, 4, 5, 6, 7]);
  });

  it("shuffle() returns a rearranged copy and leaves the list alone", () => {
    const list = [1, 2, 3, 4, 5];
    const shuffled = createRng(3).shuffle(list);
    assert.deepEqual(list, [1, 2, 3, 4, 5]);
    assert.deepEqual([...shuffled].sort(), list);
  });

  it("shuffle() makes every order equally likely", () => {
    // The old game shuffled with sort(() => Math.random() - 0.5), which is
    // biased; here each of the 6 orders of 3 items should turn up about 1/6 of the time.
    const rng = createRng(77);
    const counts = new Map();
    const trials = 60000;
    for (let i = 0; i < trials; i++) {
      const key = rng.shuffle(["a", "b", "c"]).join("");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    assert.equal(counts.size, 6);
    for (const [order, count] of counts) {
      assert.ok(Math.abs(count - trials / 6) < trials / 6 * 0.05, `${order} came up ${count} times`);
    }
  });

  it("pick() and chance() draw from the seed too", () => {
    const a = createRng(8);
    const b = createRng(8);
    assert.equal(a.pick(["x", "y", "z"]), b.pick(["x", "y", "z"]));
    assert.equal(a.chance(0.5), b.chance(0.5));
  });
});
