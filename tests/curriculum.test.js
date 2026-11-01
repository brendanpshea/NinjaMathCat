// tests/curriculum.test.js — the grade ladder and which types each grade asks (src/curriculum.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM, GRADES, typesForGrade, generateQuestion } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";

describe("the grade ladder", () => {
  it("climbs in order, with a label for each grade", () => {
    const grades = GRADES.map(g => g.grade);
    assert.deepEqual(grades, [...grades].sort((a, b) => a - b));
    assert.equal(new Set(grades).size, grades.length);
    assert.equal(new Set(GRADES.map(g => g.label)).size, GRADES.length);
  });

  it("gives every grade at least five kinds of question", () => {
    for (const { grade, label } of GRADES) {
      assert.ok(typesForGrade(grade).length >= 5, `${label} has ${typesForGrade(grade).length}`);
    }
  });
});

describe("the curriculum", () => {
  it("asks every question type at some grade on the ladder", () => {
    for (const { type, from, to } of CURRICULUM) {
      assert.ok(from <= to, type.id);
      assert.ok(GRADES.some(g => g.grade >= from && g.grade <= to), `${type.id} is never asked`);
    }
  });

  it("names each question type once", () => {
    const ids = CURRICULUM.map(e => e.type.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("draws a grade's questions from that grade's types, and all of them", () => {
    for (const { grade, label } of GRADES) {
      const allowed = new Set(typesForGrade(grade).map(t => t.id));
      const seen = new Set();
      const rng = createRng(grade * 1000 + 1);
      for (let i = 0; i < 1000; i++) {
        const q = generateQuestion(rng, grade);
        assert.ok(allowed.has(q.type), `${label} asked ${q.type}`);
        seen.add(q.type);
      }
      assert.deepEqual([...seen].sort(), [...allowed].sort(), label);
    }
  });

  it("can be told not to repeat the last kind of question", () => {
    for (const { grade, label } of GRADES) {
      const rng = createRng(grade * 1000 + 2);
      for (const type of typesForGrade(grade)) {
        for (let i = 0; i < 50; i++) assert.notEqual(generateQuestion(rng, grade, type.id).type, type.id, label);
      }
    }
  });

  it("places kindergarten in counting and shapes, not money or times tables", () => {
    const k = typesForGrade(0).map(t => t.id);
    assert.ok(k.includes("counting") && k.includes("shapes"));
    for (const later of ["money", "time", "multiplication", "division", "word_addition"]) {
      assert.ok(!k.includes(later), `kindergarten asks ${later}`);
    }
  });

  it("refuses a grade with nothing to ask", () => {
    assert.throws(() => generateQuestion(createRng(1), 9), RangeError);
  });
});
