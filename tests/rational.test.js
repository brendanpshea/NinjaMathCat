// tests/rational.test.js — exact fractions (src/questions/rational.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  gcd, lcm, frac, simplify, add, subtract, multiply, divide, same, compare, formatFraction, parseFraction,
} from "../src/questions/rational.js";

describe("exact fractions", () => {
  it("find common factors and multiples", () => {
    assert.equal(gcd(24, 36), 12);
    assert.equal(gcd(7, 13), 1);
    assert.equal(lcm(4, 6), 12);
    assert.equal(lcm(5, 7), 35);
  });

  it("keep the bottom positive and simplify", () => {
    assert.deepEqual(frac(3, -4), { n: -3, d: 4 });
    assert.deepEqual(simplify(frac(6, 8)), { n: 3, d: 4 });
    assert.deepEqual(simplify(frac(0, 5)), { n: 0, d: 1 });
    assert.throws(() => frac(1, 0), RangeError);
  });

  it("add, subtract, multiply and divide exactly", () => {
    assert.deepEqual(add(frac(1, 3), frac(1, 6)), frac(1, 2));
    assert.deepEqual(subtract(frac(3, 4), frac(1, 4)), frac(1, 2));
    assert.deepEqual(multiply(frac(2, 3), frac(3, 4)), frac(1, 2));
    assert.deepEqual(divide(frac(3, 4), frac(1, 8)), frac(6));
    assert.deepEqual(divide(frac(1, 2), frac(-1, 4)), frac(-2));
  });

  it("compare by worth, not by how they are written", () => {
    assert.equal(same(frac(2, 4), frac(1, 2)), true);
    assert.equal(same(frac(2, 3), frac(3, 4)), false);
    assert.equal(compare(frac(3, 8), frac(1, 2)), -1);
    assert.equal(compare(frac(5, 4), frac(1)), 1);
    assert.equal(compare(frac(4, 8), frac(1, 2)), 0);
  });

  it("write and read fractions the way children do", () => {
    assert.equal(formatFraction(frac(3, 4)), "3/4");
    assert.equal(formatFraction(frac(6, 4)), "6/4");
    assert.equal(formatFraction(frac(6, 4), { mixed: true }), "1 2/4");
    assert.equal(formatFraction(frac(8, 4), { mixed: true }), "2");
    assert.equal(formatFraction(frac(5)), "5");
    for (const text of ["3/4", "1 1/4", "7", "-2/3", "-1 1/2"]) {
      const f = parseFraction(text);
      assert.equal(formatFraction(f, { mixed: text.includes(" ") }), text);
    }
    assert.deepEqual(parseFraction("1 1/4"), frac(5, 4));
    assert.deepEqual(parseFraction("-1 1/2"), frac(-3, 2));
    assert.throws(() => parseFraction("three"), RangeError);
  });
});
