// tests/shapes.test.js — flat shapes (src/questions/shapes.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shapes, SHAPES, TRAITS, NAMES_BY_SIDES, shapeById } from "../src/questions/shapes.js";
import { questionsOf } from "./helpers.js";

describe("shape facts", () => {
  it("agree with each other", () => {
    for (const s of SHAPES) {
      assert.equal(s.corners, s.sides, s.id);
      assert.ok(s.rightAngles <= s.corners, s.id);
      assert.ok(2 * s.parallelPairs <= s.sides, s.id);
    }
  });

  it("match the geometry, written out again independently", () => {
    // Which shapes, as drawn, have each property. A wrong fact in SHAPES
    // would make wrong questions that still agree with themselves, so the
    // facts are checked against a second copy here.
    const have = property => SHAPES.filter(property).map(s => s.id).sort();
    assert.deepEqual(have(s => s.rightAngles === 4), ["rectangle", "square"]);
    assert.deepEqual(have(s => s.equalSides), ["hexagon", "octagon", "pentagon", "rhombus", "square", "triangle"]);
    assert.deepEqual(have(s => s.parallelPairs === 1), ["trapezoid"]);
    assert.deepEqual(have(s => s.parallelPairs === 2), ["rectangle", "rhombus", "square"]);
    assert.deepEqual(have(s => s.sides === 0), ["circle"]);
    assert.deepEqual(
      Object.fromEntries(SHAPES.filter(s => s.sides !== 4 && s.sides > 0).map(s => [s.id, s.sides])),
      { triangle: 3, hexagon: 6, pentagon: 5, octagon: 8 },
    );
  });
});

describe("shape questions", () => {
  it("name the shape shown, from the shapes the grade knows", () => {
    for (const { grade, question: q, at } of questionsOf(shapes)) {
      if (q.prompt !== "What shape is this?") continue;
      assert.equal(q.answer, q.visual.shape, at);
      if (grade === 0) {
        for (const c of q.choices) assert.ok(["circle", "triangle", "square", "rectangle"].includes(c), at);
      }
    }
  });

  it("count sides and corners correctly", () => {
    for (const { question: q, at } of questionsOf(shapes)) {
      const asked = q.prompt.match(/^How many (sides|corners)/)?.[1];
      if (!asked) continue;
      assert.equal(q.answer, shapeById(q.visual.shape)[asked], at);
    }
  });

  it("name shapes by how many sides they have", () => {
    for (const { question: q, at } of questionsOf(shapes)) {
      const n = q.prompt.match(/with (\d+) straight sides/)?.[1];
      if (!n) continue;
      assert.equal(q.answer, NAMES_BY_SIDES.get(Number(n)), at);
    }
  });

  it("offer one true statement about the shape and only false ones besides", () => {
    let asked = 0;
    for (const { question: q, at } of questionsOf(shapes)) {
      if (q.prompt !== "Which is true about this shape?") continue;
      asked++;
      const shape = shapeById(q.visual.shape);
      const trait = text => TRAITS.find(t => t.text === text);
      assert.ok(trait(q.answer).test(shape), `${at} → "${q.answer}" is false of a ${shape.id}`);
      for (const c of q.choices) {
        if (c !== q.answer) assert.ok(!trait(c).test(shape), `${at} → "${c}" is true of a ${shape.id} too`);
      }
    }
    assert.ok(asked > 0);
  });
});
