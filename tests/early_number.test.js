// tests/early_number.test.js — tens and ones, number pairs, the equal sign,
// and odd and even (src/questions/early_number.js): each answer worked out
// again from the prompt and the picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tensAndOnes, numberPairs, equalSign, oddEven, numberWords, expandedForm } from "../src/questions/early_number.js";
import { questionsOf, numbersIn } from "./helpers.js";

/** The value of "3 + 4 − 2", worked out left to right. */
function value(side) {
  return side.split(/ (?=[+−] )/).reduce((sum, term) => {
    const [, sign, n] = term.match(/^(?:([+−]) )?(\d+)$/);
    return sign === "−" ? sum - Number(n) : sum + Number(n);
  }, 0);
}

/** Whether "8 + 4 = 9 + 3" is true. */
function holds(equation) {
  const [left, right] = equation.split(" = ");
  return value(left) === value(right);
}

describe("numbers in words and in expanded form", () => {
  it("are written as children learn them", () => {
    assert.equal(numberWords(215), "two hundred fifteen");
    assert.equal(numberWords(340), "three hundred forty");
    assert.equal(numberWords(907), "nine hundred seven");
    assert.equal(numberWords(99), "ninety-nine");
    assert.equal(numberWords(100), "one hundred");
    assert.equal(expandedForm(462), "400 + 60 + 2");
    assert.equal(expandedForm(406), "400 + 6");
  });
});

describe("tens and ones", () => {
  it("are read from blocks, frames and words, and worked with correctly", () => {
    for (const { grade, question: q, at } of questionsOf(tensAndOnes)) {
      const p = q.prompt;
      const n = numbersIn(p);
      const v = q.visual;
      let expected;
      if (v?.kind === "base_ten") expected = 100 * v.hundreds + 10 * v.tens + v.ones;
      else if (v?.kind === "ten_frame") expected = v.filled;
      else if (/^What number is 10 and/.test(p)) expected = 10 + n[1];
      else if (/is 10 and how many more\?$/.test(p)) expected = n[0] - 10;
      else if (/^What number has/.test(p)) expected = p.includes("hundred") ? 100 * n[0] + 10 * n[1] + n[2] : 10 * n[0] + n[1];
      else if (/^How many (tens|ones) are in/.test(p)) expected = p.includes("tens") ? Math.floor(n[0] / 10) : n[0] % 10;
      else if (/more than|less than/.test(p)) expected = p.includes("more") ? n[1] + n[0] : n[1] - n[0];
      else if (/^What is \d+ [+−] \d+\?$/.test(p)) expected = p.includes("+") ? n[0] + n[1] : n[0] - n[1];
      else if (/what is the \d worth\?$/.test(p)) {
        const [number, digit] = n;
        const s = String(number);
        expected = digit * 10 ** (s.length - 1 - s.indexOf(String(digit)));
      } else if (/^What number is [\d +]+\?$/.test(p)) expected = value(p.slice(15, -1));
      else if (/in expanded form\?$/.test(p)) {
        expected = expandedForm(n[0]);
        for (const c of q.choices) if (c !== q.answer) assert.notEqual(value(c), n[0], `${at} → ${c}`);
      } else if (/^Which number is /.test(p)) {
        assert.equal(numberWords(q.answer), p.slice(16, -1), at);
        for (const c of q.choices) if (c !== q.answer) assert.notEqual(numberWords(c), p.slice(16, -1), at);
        continue;
      } else {
        assert.match(p, /^How do you say \d+ in words\?$/, at);
        expected = numberWords(n[0]);
      }
      assert.equal(q.answer, expected, at);
      if (grade < 1) assert.ok(typeof q.answer !== "number" || q.answer <= 20, `${at}: teen numbers in kindergarten`);
      if (grade < 2 && typeof q.answer === "number") assert.ok(q.answer < 120, `${at}: two-digit numbers in first grade`);
    }
  });
});

describe("number pairs", () => {
  it("make 10, and split numbers into two parts", () => {
    for (const { question: q, at } of questionsOf(numberPairs)) {
      const p = q.prompt;
      if (/fill the ten frame/.test(p)) assert.equal(q.answer, 10 - q.visual.filled, at);
      else if (/^Which two numbers make (\d+)\?$/.test(p)) {
        const total = numbersIn(p)[0];
        for (const c of q.choices) assert.equal(numbersIn(c).reduce((a, b) => a + b, 0) === total, c === q.answer, `${at} → ${c}`);
      } else {
        const [total, part] = numbersIn(p);
        assert.equal(q.answer, total - part, at);
        assert.equal(q.visual.filled, part, at);
      }
    }
  });
});

describe("the equal sign", () => {
  it("has one true equation among the choices, and balances both sides", () => {
    for (const { question: q, at } of questionsOf(equalSign)) {
      const p = q.prompt;
      if (p === "Which of these is true?" || p === "Which one is right?") {
        for (const c of q.choices) assert.equal(holds(c), c === q.answer, `${at} → ${c}`);
        continue;
      }
      const balance = p.match(/^What number goes in the box\? (.+)$/);
      if (balance) {
        assert.ok(holds(balance[1].replace("□", String(q.answer))), at);
        for (const c of q.choices) if (c !== q.answer) assert.ok(!holds(balance[1].replace("□", String(c))), `${at} → ${c}`);
        continue;
      }
      const n = numbersIn(p);
      assert.equal(q.answer, /So what is/.test(p) ? n[0] + n[1] : n.reduce((a, b) => a + b, 0), at);
    }
  });
});

describe("odd and even", () => {
  it("knows which numbers are odd and even, and halves an even number", () => {
    for (const { grade, question: q, at } of questionsOf(oddEven)) {
      if (grade >= 3) continue;
      const p = q.prompt;
      const which = p.match(/^Which number is (even|odd)\?$/);
      if (which) {
        for (const c of q.choices) assert.equal((c % 2 === 0) === (which[1] === "even"), c === q.answer, `${at} → ${c}`);
      } else if (/two equal numbers added together/.test(p)) {
        const n = numbersIn(p)[0];
        for (const c of q.choices) {
          const [a, b] = numbersIn(c);
          assert.equal(a === b && a + b === n, c === q.answer, `${at} → ${c}`);
        }
      } else if (/□ \+ □/.test(p)) {
        assert.equal(2 * q.answer, numbersIn(p)[0], at);
      } else {
        const [, kind] = p.match(/next (even|odd) number/);
        const n = numbersIn(p)[0];
        assert.ok(q.answer > n && q.answer <= n + 2 && (q.answer % 2 === 0) === (kind === "even"), at);
      }
    }
  });

  it("finds patterns in adding and multiplying, tried on every number up to 40 (3.OA.9)", () => {
    const odd = n => n % 2 === 1;
    const even = n => n % 2 === 0;
    const numbers = Array.from({ length: 41 }, (_, i) => i);
    const every = test => numbers.every(test);
    const everyPair = test => numbers.every(a => numbers.every(b => test(a, b)));
    /** Whether each sentence holds, tried again independently. */
    const HOLDS = {
      "2 times any number is always even.": () => every(n => even(2 * n)),
      "4 times any number is always even.": () => every(n => even(4 * n)),
      "3 times any number is always odd.": () => every(n => odd(3 * n)),
      "5 times any number is always odd.": () => every(n => odd(5 * n)),
      "Any number times 10 ends in 0.": () => every(n => (10 * n) % 10 === 0),
      "Any number times 5 ends in 0 or 5.": () => every(n => [0, 5].includes((5 * n) % 10)),
      "Any number times 5 ends in 5.": () => every(n => (5 * n) % 10 === 5),
      "Any number times 4 ends in 4.": () => every(n => (4 * n) % 10 === 4),
      "Adding two odd numbers always gives an even number.": () => everyPair((a, b) => !(odd(a) && odd(b)) || even(a + b)),
      "Adding two odd numbers always gives an odd number.": () => everyPair((a, b) => !(odd(a) && odd(b)) || odd(a + b)),
      "Adding two even numbers always gives an even number.": () => everyPair((a, b) => !(even(a) && even(b)) || even(a + b)),
      "Adding two even numbers always gives an odd number.": () => everyPair((a, b) => !(even(a) && even(b)) || odd(a + b)),
      "Adding an odd number and an even number always gives an odd number.": () => everyPair((a, b) => !(odd(a) && even(b)) || odd(a + b)),
      "Adding an odd number and an even number always gives an even number.": () => everyPair((a, b) => !(odd(a) && even(b)) || even(a + b)),
      "Multiplying two odd numbers always gives an odd number.": () => everyPair((a, b) => !(odd(a) && odd(b)) || odd(a * b)),
      "Multiplying two odd numbers always gives an even number.": () => everyPair((a, b) => !(odd(a) && odd(b)) || even(a * b)),
    };
    const digitSum = n => String(n).split("").reduce((sum, d) => sum + Number(d), 0);
    const OF_TABLE = {
      "Every number in it is even.": t => t.every(even),
      "Every number in it is odd.": t => t.every(odd),
      "The numbers go odd, even, odd, even.": t => t.every((n, i) => (i % 2 === 0 ? odd(n) : even(n))),
      "Every number in it ends in 0 or 5.": t => t.every(n => [0, 5].includes(n % 10)),
      "Every number in it ends in 0.": t => t.every(n => n % 10 === 0),
      "The digits of every number in it add up to 9.": t => t.every(n => digitSum(n) === 9),
    };
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(oddEven)) {
      if (grade < 3) continue;
      if (q.prompt === "Which of these is always true?") {
        seen.add("always");
        for (const c of q.choices) assert.equal(HOLDS[c](), c === q.answer, `${at} → ${c}`);
        continue;
      }
      seen.add("table");
      const [, n, list] = q.prompt.match(/^Here is the (\d+) times table: ([\d, ]+)\. Which is true of it\?$/);
      const table = list.split(", ").map(Number);
      assert.deepEqual(table, Array.from({ length: 10 }, (_, i) => Number(n) * (i + 1)), at);
      for (const c of q.choices) assert.equal(OF_TABLE[c](table), c === q.answer, `${at} → ${c}`);
    }
    assert.equal(seen.size, 2);
  });
});
