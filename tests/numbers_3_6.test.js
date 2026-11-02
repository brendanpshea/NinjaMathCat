// tests/numbers_3_6.test.js — rounding, place value, decimals, and factors
// (src/questions/place_value.js, decimals.js, factors.js): each answer
// worked out again from the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rounding, placeValue } from "../src/questions/place_value.js";
import { decimals, formatDecimal, thousandths } from "../src/questions/decimals.js";
import { factors, commonFactors, isPrime } from "../src/questions/factors.js";
import { gcd, lcm } from "../src/questions/rational.js";
import { questionsOf, numbersIn } from "./helpers.js";

/** An exact value for a decimal string, as [whole number, places]. */
function exact(text) {
  const [whole, part = ""] = text.replace("−", "-").replace(/,/g, "").split(".");
  return { units: BigInt(whole + part), places: part.length };
}
/** Two decimals, as BigInts over the same power of ten. */
function common(a, b) {
  const [x, y] = [exact(a), exact(b)];
  const places = Math.max(x.places, y.places);
  return [x.units * 10n ** BigInt(places - x.places), y.units * 10n ** BigInt(places - y.places), places];
}
const sameValue = (a, b) => {
  const [x, y] = common(a, b);
  return x === y;
};
/** The decimals in a prompt, as strings. */
const decimalsIn = text => text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];

describe("writing decimals", () => {
  it("writes each value one way: no extra zeros, a 0 before the point", () => {
    assert.equal(formatDecimal(1234, 2), "12.34");
    assert.equal(formatDecimal(5, 2), "0.05");
    assert.equal(formatDecimal(1230, 2), "12.3");
    assert.equal(formatDecimal(1200, 2), "12");
    assert.equal(formatDecimal(-75, 2), "−0.75");
    assert.equal(thousandths("2.5"), 2500);
    assert.equal(thousandths("0.045"), 45);
  });
});

describe("rounding", () => {
  it("rounds whole numbers half up, to the place asked", () => {
    const places = { ten: 10, hundred: 100, thousand: 1000, "ten thousand": 10000, "hundred thousand": 100000 };
    for (const { grade, question: q, at } of questionsOf(rounding)) {
      if (grade >= 5) continue;
      const [, n, place] = q.prompt.match(/^Round ([\d,]+) to the nearest (.+)\.$/);
      const value = Number(n.replace(/,/g, ""));
      const step = places[place];
      assert.equal(q.answer, Math.floor((value + step / 2) / step) * step, at);
      if (grade < 4) {
        assert.ok([10, 100].includes(step), at);
        assert.deepEqual(q.visual.points, [value], at);
      }
      // Every choice is a rounded number, so none can be ruled out without rounding.
      for (const c of q.choices) assert.equal(c % 10, 0, `${at} → ${c}`);
    }
  });

  it("rounds decimals half up, to the place asked", () => {
    const places = { "whole number": 0, tenth: 1, hundredth: 2 };
    for (const { grade, question: q, at } of questionsOf(rounding)) {
      if (grade < 5) continue;
      const [, n, place] = q.prompt.match(/^Round ([\d.]+) to the nearest (.+)\.$/);
      const { units, places: have } = exact(n);
      const step = 10n ** BigInt(have - places[place]);
      const rounded = (units + step / 2n) / step;
      assert.ok(sameValue(q.answer, formatDecimal(Number(rounded), places[place])), `${at} → ${q.answer}`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!sameValue(c, q.answer), `${at} → ${c}`);
    }
  });
});

describe("place value", () => {
  it("knows what each digit is worth, whole and decimal", () => {
    for (const { question: q, at } of questionsOf(placeValue)) {
      const digitMatch = q.prompt.match(/^What is the value of the (\d) in ([\d,.]+)\?$/);
      if (digitMatch) {
        const [, digit, number] = digitMatch;
        const [whole, part = ""] = number.replace(/,/g, "").split(".");
        const at1 = whole.indexOf(digit);
        const expected = at1 >= 0 ? String(Number(digit) * 10 ** (whole.length - 1 - at1))
          : formatDecimal(Number(digit), part.indexOf(digit) + 1);
        assert.ok(sameValue(String(q.answer), expected), `${at} → ${q.answer}`);
        // Wrong whole-number values are the digit or round numbers, never a near miss like 59.
        if (typeof q.answer === "number") for (const c of q.choices) assert.ok(c < 10 || c % 10 === 0, `${at} → ${c}`);
        continue;
      }
      const sum = q.prompt.match(/^Which number is (.+)\?$/);
      if (sum) {
        assert.equal(q.answer, numbersIn(sum[1]).reduce((a, b) => a + b, 0), at);
        continue;
      }
      const times = q.prompt.match(/^In ([\d,]+), the first (\d) is worth/);
      if (times) {
        const digits = times[1].replace(/,/g, "");
        const gap = digits.lastIndexOf(times[2]) - digits.indexOf(times[2]);
        assert.equal(q.answer, 10 ** gap, at);
        continue;
      }
      const tenth = q.prompt.match(/^What is (10 times|one tenth of) ([\d.]+)\?$/);
      assert.ok(tenth, at);
      const { units, places } = exact(tenth[2]);
      const expected = tenth[1] === "10 times" ? formatDecimal(Number(units), places - 1) : formatDecimal(Number(units), places + 1);
      assert.ok(sameValue(String(q.answer), expected), `${at} → ${q.answer}`);
    }
  });
});

describe("decimals", () => {
  it("are answered correctly, whatever the operation", () => {
    for (const { question: q, at } of questionsOf(decimals)) {
      const p = q.prompt;
      let expected;
      if (/as a decimal\?$/.test(p)) {
        const [n, d] = numbersIn(p);
        expected = formatDecimal(n, d === 10 ? 1 : 2);
      } else if (/^Which fraction is the same as/.test(p)) {
        const [n, d] = q.answer.split("/").map(Number);
        assert.ok(sameValue(decimalsIn(p)[0], formatDecimal(n, d === 10 ? 1 : 2)), at);
        continue;
      } else if (/greatest|least/.test(p)) {
        const values = q.choices.map(String);
        const sorted = [...values].sort((a, b) => { const [x, y] = common(a, b); return x < y ? -1 : x > y ? 1 : 0; });
        expected = /greatest/.test(p) ? sorted[3] : sorted[0];
      } else if (/grid/.test(p)) {
        // Hundredths grids: the answer is read off the squares shaded.
        const v = q.visual;
        assert.ok(v.grids.every(n => n > 0 && n < 100), at);
        if (v.grids.length === 2) {
          const [x, y] = v.labels;
          assert.deepEqual([x, y], v.grids.map(n => formatDecimal(n, 2)), at);
          assert.equal(q.answer, `${x} ${v.grids[0] > v.grids[1] ? ">" : "<"} ${y}`, at);
        } else {
          assert.equal(q.answer, /fraction/.test(p) ? `${v.grids[0]}/100` : formatDecimal(v.grids[0], 2), at);
          for (const c of q.choices) if (c !== q.answer) assert.ok(/\//.test(c) ? c !== q.answer : !sameValue(String(c), String(q.answer)), `${at} → ${c}`);
        }
        continue;
      } else if (/\/10 \+ /.test(p)) {
        const [t, , h] = numbersIn(p);
        assert.equal(q.answer, `${10 * t + h}/100`, at);
        continue;
      } else {
        const [, a, op, b] = p.match(/^What is ([\d.,]+) ([+−×÷]) ([\d.,]+)\?$/);
        const [x, y, places] = common(a, b);
        const value = op === "+" ? [x + y, places] : op === "−" ? [x - y, places]
          : op === "×" ? [exact(a).units * exact(b).units, exact(a).places + exact(b).places]
          : null;
        if (value) expected = formatDecimal(Number(value[0]), value[1]);
        else {
          // a ÷ b = answer exactly when answer × b = a.
          const product = exact(String(q.answer)).units * exact(b).units;
          assert.ok(sameValue(formatDecimal(Number(product), exact(String(q.answer)).places + exact(b).places), a), `${at} → ${q.answer}`);
          continue;
        }
      }
      assert.ok(sameValue(String(q.answer), expected), `${at} → ${q.answer}, not ${expected}`);
    }
  });

  it("never offer a wrong answer worth the same as the right one", () => {
    for (const { question: q, at } of questionsOf(decimals)) {
      if (String(q.answer).includes("/") || q.visual?.grids?.length === 2) continue;
      for (const c of q.choices) if (c !== q.answer) assert.ok(!sameValue(String(c), String(q.answer)), `${at} → ${c}`);
    }
  });
});

describe("factors and multiples", () => {
  it("find factors, multiples, primes and composites", () => {
    for (const { question: q, at } of questionsOf(factors)) {
      const [n] = numbersIn(q.prompt);
      /** Whether a choice fits what the prompt asks. */
      const fits = q.prompt.includes("factor of") ? c => n % c === 0
        : q.prompt.includes("multiple of") ? c => c % n === 0
        : q.prompt.includes("prime?") ? c => isPrime(c)
        : c => !isPrime(c);
      assert.ok(fits(q.answer), at);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!fits(c), `${at} → ${c} fits too`);
    }
  });

  it("find greatest common factors and least common multiples", () => {
    for (const { question: q, at } of questionsOf(commonFactors)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, q.prompt.includes("greatest common factor") ? gcd(a, b) : lcm(a, b), at);
    }
  });
});
