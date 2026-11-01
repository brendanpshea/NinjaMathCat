// tests/questions.test.js — what every question type promises, checked over
// hundreds of seeds at every grade that asks it. The per-type files check
// that the answers are right; this one checks that every question is fair.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";
import { makeQuestion, isCorrect } from "../src/questions/common.js";
import { gradesFor, questionsOf } from "./helpers.js";

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

    it("use only whole numbers from 0 up, before negatives and fractions are taught", () => {
      for (const { question: q, at } of questionsOf(type)) {
        for (const c of q.choices) {
          if (typeof c === "number") assert.ok(Number.isInteger(c) && c >= 0, `${at} → ${c}`);
          else assert.ok(!/(^|\s)-\d/.test(c), `${at} → ${c}`);
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
        // "Which number is the biggest?" is answered by an edge on purpose.
        if (typeof q.answer !== "number" || /biggest|smallest/.test(q.prompt)) continue;
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
