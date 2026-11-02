// tests/arithmetic.test.js — number facts (src/questions/arithmetic.js): each
// answer worked out again from the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addition, subtraction, missingNumber, multiplication, division, smallerFromLarger, addingWithoutCarrying,
  multiplyingWithoutCarrying, withRemainder, WITHIN, FACTORS,
} from "../src/questions/arithmetic.js";
import { atGrade, makeQuestion } from "../src/questions/common.js";
import { createRng } from "../src/rng.js";
import { questionsOf, numbersIn } from "./helpers.js";

describe("addition", () => {
  it("asks for a sum within the grade's limit", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      if (!q.prompt.startsWith("What is")) continue;
      const [a, b] = numbersIn(q.prompt);
      assert.match(q.prompt, /^What is [\d,]+ \+ [\d,]+\?$/, at);
      assert.equal(q.answer, a + b, at);
      assert.ok(q.answer <= atGrade(grade, WITHIN), at);
    }
  });

  it("stays within 5 at the start of kindergarten", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      if (grade === 0 && typeof q.answer === "number") assert.ok(q.answer <= 5, at);
    }
  });
});

describe("first grade", () => {
  it("adds, takes away and finds missing numbers within 20, all year (1.OA.6, 1.OA.8)", () => {
    for (const type of [addition, subtraction, missingNumber]) {
      for (const { grade, question: q, at } of questionsOf(type)) {
        if (grade >= 1 && grade < 2) assert.ok(Math.max(...numbersIn(q.prompt)) <= 20, at);
      }
    }
  });
});

describe("subtraction", () => {
  it("asks for a difference that is never below zero", () => {
    for (const { grade, question: q, at } of questionsOf(subtraction)) {
      if (!q.prompt.startsWith("What is")) continue;
      const [a, b] = numbersIn(q.prompt);
      assert.match(q.prompt, /^What is [\d,]+ − [\d,]+\?$/, at);
      assert.equal(q.answer, a - b, at);
      assert.ok(a <= atGrade(grade, WITHIN), at);
    }
  });

  it("only now and then takes a number from itself", () => {
    const asked = [...questionsOf(subtraction)].filter(({ grade, question: q }) => grade < 1 && typeof q.answer === "number");
    const zero = asked.filter(({ question: q }) => q.answer === 0).length;
    assert.ok(zero > 0 && zero < asked.length * 0.12, `${zero} of ${asked.length} kindergarten differences are 0`);
  });
});

/** The value of "3 + 2" or "5 − 1". */
const sentenceValue = s => {
  const [, x, op, y] = s.match(/^(\d+) ([+−]) (\d+)$/);
  return op === "+" ? Number(x) + Number(y) : Number(x) - Number(y);
};

describe("showing adding and taking away (K.OA.1)", () => {
  it("picks the number sentence for two groups put together, or some crossed out", () => {
    const seen = new Set();
    for (const type of [addition, subtraction]) {
      for (const { grade, question: q, at } of questionsOf(type)) {
        if (!/^Which number sentence|crossed out/.test(q.prompt)) continue;
        assert.ok(grade < 1, at);
        const v = q.visual;
        let sentence;
        if (v.kind === "pattern") {
          seen.add("together");
          // Two runs of pictures, one kind after the other.
          const first = v.items.filter(i => i === v.items[0]).length;
          assert.ok(v.items.slice(0, first).every(i => i === v.items[0]) && v.items.slice(first).every(i => i === v.items[first]), at);
          sentence = `${first} + ${v.items.length - first}`;
        } else {
          seen.add("crossed");
          assert.ok(v.crossed > 0 && v.crossed < v.count, at);
          sentence = `${v.count} − ${v.crossed}`;
        }
        assert.equal(q.answer, sentence, at);
        for (const c of q.choices) if (c !== q.answer) assert.notEqual(sentenceValue(c), sentenceValue(sentence), `${at} → ${c} comes to the same`);
      }
    }
    assert.equal(seen.size, 2);
  });
});

describe("ways to work things out (2.NBT.9)", () => {
  it("offer one sound way, and slips whose every step is right but whose total is not", () => {
    let asked = 0;
    for (const type of [addition, subtraction]) {
      for (const { grade, question: q, at } of questionsOf(type)) {
        const problem = q.prompt.match(/^Which is a correct way to work out (\d+) ([+−]) (\d+)\?$/);
        if (!problem) continue;
        asked++;
        assert.ok(grade >= 2 && grade < 3, at);
        const result = sentenceValue(`${problem[1]} ${problem[2]} ${problem[3]}`);
        for (const c of q.choices) {
          const steps = c.split(", then ").map(step => step.match(/^(\d+) ([+−]) (\d+) = (\d+)$/));
          assert.ok(steps.every(Boolean), `${at} → ${c}: a step that doesn't read`);
          for (const [, x, op, y, z] of steps) assert.equal(sentenceValue(`${x} ${op} ${y}`), Number(z), `${at} → ${c}: a step adds up wrong`);
          const last = Number(steps[steps.length - 1][4]);
          assert.equal(last === result, c === q.answer, `${at} → ${c}`);
        }
      }
    }
    assert.ok(asked > 0);
  });
});

describe("subtraction slips", () => {
  it("offers the smaller-from-larger slip as a wrong answer", () => {
    assert.equal(smallerFromLarger(52, 17), 45);
    assert.equal(smallerFromLarger(300, 158), 258);
    assert.equal(smallerFromLarger(47, 23), 24, "no regrouping, no slip");
  });
});

describe("adding and subtracting", () => {
  it("offers the slips children make with big numbers as wrong answers", () => {
    assert.equal(addingWithoutCarrying(58, 67), 15);
    assert.equal(addingWithoutCarrying(4321, 1234), 5555, "nothing to carry, no slip");
    assert.equal(multiplyingWithoutCarrying(47, 6), 242);
    assert.equal(multiplyingWithoutCarrying(23, 3), 69, "nothing to carry, no slip");
  });

  it("reach a million in fourth grade, written with commas", () => {
    for (const { grade, question: q, at } of questionsOf(addition)) {
      if (grade < 4) continue;
      assert.ok(q.answer <= 1000000, at);
      const [a] = numbersIn(q.prompt);
      if (a >= 10000) assert.match(q.prompt, /\d,\d{3}/, at);
    }
  });
});

describe("missing numbers", () => {
  it("have an answer that makes the equation true, and only one", () => {
    /** Both sides of the equation with a number in the box, worked out. */
    const equation = q => q.prompt.match(/think: (.+)\. What number goes in the box\?$/)?.[1] ?? q.prompt.replace("What number goes in the box? ", "");
    const sides = (q, n) => equation(q).replace("□", String(n)).split(" = ")
      .map(side => Function(`return ${side.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")};`)());
    for (const { grade, question: q, at } of questionsOf(missingNumber)) {
      const [left, right] = sides(q, q.answer);
      assert.equal(left, right, at);
      for (const c of q.choices) if (c !== q.answer) assert.notEqual(...sides(q, c), `${at} → ${c} works too`);
      if (/[×÷]/.test(q.prompt)) assert.ok(grade >= 3, `${at}: multiplying and dividing come in third grade`);
    }
  });
});

describe("multiplication", () => {
  it("multiplies correctly at every size", () => {
    for (const { question: q, at } of questionsOf(multiplication)) {
      const [a, b] = numbersIn(q.prompt);
      assert.equal(q.answer, a * b, at);
    }
  });

  it("asks the times tables up to third grade, then multiples of ten, then bigger numbers", () => {
    for (const { grade, question: q, at } of questionsOf(multiplication)) {
      const [a, b] = numbersIn(q.prompt);
      if (grade <= 3) assert.ok(Math.max(a, b) <= atGrade(grade, FACTORS), at);
      else if (grade === 3.5) assert.ok(b <= 10 || (b % 10 === 0 && b <= 90 && a <= 10), at);
      else assert.ok(Math.max(a, b) >= 11, `${at}: no bigger than the times tables`);
    }
  });
});

describe("division", () => {
  it("is right, with any remainder smaller than the divisor", () => {
    for (const { question: q, at } of questionsOf(division)) {
      const [dividend, divisor] = numbersIn(q.prompt);
      if (typeof q.answer === "number") {
        assert.equal(q.answer, dividend / divisor, at);
        continue;
      }
      const [, quotient, remainder] = q.answer.match(/^(\d+) R (\d+)$/).map(Number);
      assert.equal(quotient * divisor + remainder, dividend, at);
      assert.ok(remainder > 0 && remainder < divisor, at);
    }
  });

  it("has remainders only in fourth grade, and two-digit divisors from fifth", () => {
    for (const { grade, question: q, at } of questionsOf(division)) {
      const [, divisor] = numbersIn(q.prompt);
      if (typeof q.answer === "string") assert.ok(grade >= 4 && grade < 5, at);
      if (grade >= 5) assert.ok(divisor >= 11, at);
    }
  });

  it("writes remainders with R", () => {
    assert.equal(withRemainder(23, 2), "23 R 2");
    assert.equal(withRemainder(23, 0), "23");
  });
});

describe("fact families, for chapters that focus on them", () => {
  const families = { easy: [2, 5, 10], harder: [3, 4, 6, 7, 8, 9] };

  it("multiply with 2, 5 or 10 first, then with the rest", () => {
    for (const [focus, family] of Object.entries(families)) {
      const rng = createRng(17);
      const positions = new Set();
      for (let i = 0; i < 300; i++) {
        const q = makeQuestion(rng, multiplication, 3, focus);
        const [a, b] = numbersIn(q.prompt);
        assert.equal(q.answer, a * b, q.prompt);
        assert.ok(focus === "easy" ? family.includes(a) || family.includes(b) : family.includes(a) && family.includes(b), `${focus}: ${q.prompt}`);
        positions.add(q.choices.indexOf(q.answer));
      }
      assert.equal(positions.size, 4, `${focus}: the answer in every position`);
    }
  });

  it("divide by 2, 5 or 10 first, then by the rest", () => {
    for (const [focus, family] of Object.entries(families)) {
      const rng = createRng(18);
      for (let i = 0; i < 300; i++) {
        const q = makeQuestion(rng, division, 3, focus);
        const [dividend, divisor] = numbersIn(q.prompt);
        assert.equal(q.answer * divisor, dividend, q.prompt);
        assert.ok(family.includes(divisor), `${focus}: ${q.prompt}`);
      }
    }
  });
});
