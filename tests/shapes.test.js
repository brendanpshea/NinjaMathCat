// tests/shapes.test.js — flat shapes (src/questions/shapes.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shapes, SHAPES, TRAITS, NAMES_BY_SIDES, shapeById } from "../src/questions/shapes.js";
import { SHAPE_CORNERS } from "../src/visuals/pictures.js";
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

describe("symmetry and sorting shapes", () => {
  /**
   * Lines of symmetry of a drawn polygon, found by trying each line through
   * its centre and a corner or the middle of a side, and keeping those that
   * fold every corner onto a corner.
   */
  function linesOfSymmetry(corners) {
    const [cx, cy] = [0, 1].map(k => corners.reduce((sum, p) => sum + p[k], 0) / corners.length);
    const through = [...corners, ...corners.map((p, i) => corners[(i + 1) % corners.length]).map((q, i) => [(q[0] + corners[i][0]) / 2, (q[1] + corners[i][1]) / 2])];
    const angles = new Set();
    for (const [x, y] of through) {
      const a = Math.atan2(y - cy, x - cx);
      const [ux, uy] = [Math.cos(a), Math.sin(a)];
      const folds = corners.every(([px, py]) => {
        const along = (px - cx) * ux + (py - cy) * uy;
        const [rx, ry] = [2 * (cx + along * ux) - px, 2 * (cy + along * uy) - py];
        return corners.some(([qx, qy]) => Math.hypot(qx - rx, qy - ry) < 0.5);
      });
      // A line and its opposite direction are the same line.
      if (folds) angles.add(Math.round((((a % Math.PI) + Math.PI) % Math.PI) * 1000));
    }
    return angles.size;
  }

  it("count the lines of symmetry each shape has as drawn", () => {
    for (const shape of SHAPES) {
      if (shape.id === "circle") continue;
      assert.equal(linesOfSymmetry(SHAPE_CORNERS[shape.id]), shape.symmetry, shape.id);
    }
  });

  it("ask about symmetry, sides and angles with one right answer", () => {
    /** What each "Which shape has ...?" asks, written out again. */
    const HAS = {
      "exactly 1 pair of parallel sides": s => s.parallelPairs === 1,
      "no parallel sides at all": s => s.parallelPairs === 0,
      "right angles": s => s.rightAngles > 0,
      "2 pairs of parallel sides but no right angles": s => s.parallelPairs === 2 && s.rightAngles === 0,
      "right angles but sides of different lengths": s => s.rightAngles > 0 && !s.equalSides,
    };
    for (const { question: q, at } of questionsOf(shapes)) {
      if (q.prompt.startsWith("How many lines of symmetry")) {
        assert.equal(q.answer, shapeById(q.visual.shape).symmetry, at);
      }
      const has = q.prompt.match(/^Which shape has (.+)\?$/)?.[1];
      if (has) {
        for (const c of q.choices) {
          assert.ok(c !== "circle", `${at}: a circle has no sides to ask about`);
          assert.equal(HAS[has](shapeById(c)), c === q.answer, `${at} → ${c}`);
        }
      }
    }
  });

  it("know which quadrilaterals are kinds of which", () => {
    // Each kind, and every kind it always is.
    const IS = {
      square: ["square", "rectangle", "rhombus", "parallelogram", "quadrilateral"],
      rectangle: ["rectangle", "parallelogram", "quadrilateral"],
      rhombus: ["rhombus", "parallelogram", "quadrilateral"],
      parallelogram: ["parallelogram", "quadrilateral"],
      quadrilateral: ["quadrilateral"],
    };
    let asked = 0;
    for (const { question: q, at } of questionsOf(shapes)) {
      if (q.prompt !== "Which of these is always true?") continue;
      asked++;
      for (const c of q.choices) {
        const [, kind, family] = c.match(/^Every (\w+) is an? (\w+)\.$/);
        assert.equal(IS[kind].includes(family), c === q.answer, `${at} → ${c}`);
      }
    }
    assert.ok(asked > 0);
  });
});
