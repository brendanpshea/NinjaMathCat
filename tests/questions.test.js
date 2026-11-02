// tests/questions.test.js — what every question type promises, checked over
// hundreds of seeds at every grade that asks it. The per-type files check
// that the answers are right; this one checks that every question is fair.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";
import { makeQuestion, isCorrect } from "../src/questions/common.js";
import { gradesFor, questionsOf, numbersIn } from "./helpers.js";

/**
 * Kinds of question whose hints take the first step with the question's own
 * numbers, and so could say the answer by mistake. Elsewhere a hint names a
 * fact, such as a graph's scale or a full turn of 360°, that is sometimes the
 * answer by chance.
 */
const WORKED_HINTS = new Set([
  "addition", "subtraction", "multiplication", "division", "missing_number", "equal_sign", "tens_and_ones",
  "number_line", "time", "fraction_arithmetic", "fraction_stories", "decimals", "word_addition", "word_subtraction",
]);

/**
 * Whether some text says this answer, as a whole: "2/7" is not in "12/7".
 * @param {string} text
 * @param {string | number} answer
 */
function says(text, answer) {
  const escaped = String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[\\s(])${escaped}(?=$|[\\s.,;:?)])`).test(text);
}

for (const { type } of CURRICULUM) {
  describe(`${type.name} questions`, () => {
    it("have four different choices, exactly one of them right", () => {
      for (const { question: q, at } of questionsOf(type)) {
        assert.equal(q.choices.length, 4, at);
        assert.equal(new Set(q.choices.map(String)).size, 4, `${at} → ${q.choices.join(" | ")}`);
        assert.equal(q.choices.filter(c => isCorrect(q, c)).length, 1, at);
      }
    });

    it("have a prompt, a hint and a difficulty from 1 to 3", () => {
      for (const { question: q, at } of questionsOf(type)) {
        assert.equal(q.type, type.id, at);
        assert.ok(q.prompt.length > 0 && q.hint.length > 0, at);
        assert.ok([1, 2, 3].includes(q.difficulty), `${at} → difficulty ${q.difficulty}`);
      }
    });

    it("have a hint that takes a step without saying the answer", () => {
      if (!WORKED_HINTS.has(type.id)) return;
      for (const { question: q, at } of questionsOf(type)) {
        // Small numbers turn up in hints by chance ("6 take away 8" when the answer is 8), so only 10 and up.
        const whole = typeof q.answer === "number" ? q.answer : /^\d+$/.test(q.answer) ? Number(q.answer) : null;
        const said = whole !== null
          ? whole >= 10 && numbersIn(q.hint).includes(whole) && !numbersIn(q.prompt).includes(whole)
          : /\d/.test(String(q.answer)) && says(q.hint, q.answer) && !says(q.prompt, q.answer);
        assert.ok(!said, `${at} → hint: ${q.hint}`);
      }
    });

    it("speak to children below second grade in words they know", () => {
      for (const { grade, question: q, at } of questionsOf(type)) {
        if (grade >= 2) continue;
        const words = `${q.prompt} ${q.hint}`.match(/\b(true|shaded|difference|digits?|regroup\w*|carry\w*|denominator|numerator|brackets|expression|equation)\b/i);
        assert.equal(words, null, `${at} → hint: ${q.hint}`);
      }
    });

    it("use whole numbers for numeric answers, and negatives only from sixth grade (6.NS.5)", () => {
      for (const { grade, question: q, at } of questionsOf(type)) {
        for (const c of q.choices) {
          if (typeof c === "number") assert.ok(Number.isInteger(c) && (c >= 0 || grade >= 6), `${at} → ${c}`);
          else if (grade < 6) assert.ok(!/(^|\s)[-−]\d/.test(c), `${at} → ${c}`);
        }
      }
    });

    it("put the answer in every position", () => {
      for (const grade of gradesFor(type)) {
        const positions = new Set();
        for (let seed = 1; seed <= 100; seed++) {
          const q = makeQuestion(createRng(seed), type, grade);
          positions.add(q.choices.indexOf(q.answer));
        }
        assert.equal(positions.size, 4, `${type.id} at grade ${grade}`);
      }
    });

    it("do not give the answer away by where it sits among the numbers", () => {
      // If the wrong answers were always one either side, a child could pick
      // the middle number without doing the sum. The answer should be the
      // biggest or smallest choice about half the time, like the rest.
      let numeric = 0;
      let atEdge = 0;
      for (const { question: q } of questionsOf(type)) {
        // "Which number is the biggest?" is answered by an edge on purpose, and
        // so is "which number makes x > 7 true?".
        if (typeof q.answer !== "number" || /\b(biggest|smallest)\b|is the (greatest|least)\?|[<>≤≥]/.test(q.prompt)) continue;
        numeric++;
        const sorted = [...q.choices].sort((a, b) => Number(a) - Number(b));
        if (q.answer === sorted[0] || q.answer === sorted[3]) atEdge++;
      }
      if (numeric === 0) return;
      const share = atEdge / numeric;
      assert.ok(share > 0.3 && share < 0.7, `${type.id}: the answer was at the edge ${atEdge} of ${numeric} times`);
    });

    it("come out the same from the same seed", () => {
      for (const grade of gradesFor(type)) {
        assert.deepEqual(makeQuestion(createRng(42), type, grade), makeQuestion(createRng(42), type, grade));
      }
    });

    it("vary from seed to seed", () => {
      for (const grade of gradesFor(type)) {
        const distinct = new Set();
        for (let seed = 1; seed <= 50; seed++) {
          const q = makeQuestion(createRng(seed), type, grade);
          distinct.add(JSON.stringify([q.prompt, q.visual, q.answer]));
        }
        assert.ok(distinct.size >= 4, `${type.id} at grade ${grade}: only ${distinct.size} different questions`);
      }
    });
  });
}
