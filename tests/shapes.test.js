// tests/shapes.test.js — flat shapes (src/questions/shapes.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shapes, SHAPES, TRAITS, NAMES_BY_SIDES, SOLID_PARTS, shapeById } from "../src/questions/shapes.js";
import { COMPOSED } from "../src/visuals/figures.js";
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

  it("give solids faces, corners and edges that fit together", () => {
    for (const [id, p] of Object.entries(SOLID_PARTS)) {
      // Euler: faces + corners - edges = 2 for any solid like these.
      assert.equal(p.faces + p.corners - p.edges, 2, id);
      assert.ok(p.facesSeen < p.faces && p.cornersSeen < p.corners, `${id}: some are hidden`);
    }
    assert.deepEqual(Object.fromEntries(Object.entries(SOLID_PARTS).map(([id, p]) => [id, [p.faces, p.corners]])), { cube: [6, 8], box: [6, 8], pyramid: [5, 5] });
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
      if (!asked || q.visual.kind !== "shape") continue;
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

describe("solid shapes and where things are", () => {
  /** The shapes kindergarten knows, described again independently. */
  const SOLID = {
    sphere: { flatFaces: 0, squareFaces: 0, circles: 0, point: false },
    cube: { flatFaces: 6, squareFaces: 6, circles: 0, point: false },
    cone: { flatFaces: 1, squareFaces: 0, circles: 1, point: true },
    cylinder: { flatFaces: 2, squareFaces: 0, circles: 2, point: false },
  };
  const FLAT = {
    circle: { sides: 0, corners: 0, equal: false },
    triangle: { sides: 3, corners: 3, equal: true },
    square: { sides: 4, corners: 4, equal: true },
    rectangle: { sides: 4, corners: 4, equal: false },
  };
  /** What each clue asks for, worked out from the descriptions above. */
  const CLUE_FITS = [
    [/round all over, with no flat faces/, s => SOLID[s]?.flatFaces === 0],
    [/6 flat faces, and every one is a square/, s => SOLID[s]?.squareFaces === 6],
    [/a point at the top and a flat circle at the bottom/, s => SOLID[s]?.point === true && SOLID[s].circles === 1],
    [/a flat circle at each end/, s => SOLID[s]?.circles === 2],
    [/flat shape has no corners/, s => FLAT[s]?.corners === 0],
    [/flat shape has 3 sides and 3 corners/, s => FLAT[s]?.sides === 3 && FLAT[s].corners === 3],
    [/flat shape has 4 sides, all the same length/, s => FLAT[s]?.sides === 4 && FLAT[s].equal],
    [/flat shape has 4 sides, two long and two short/, s => FLAT[s]?.sides === 4 && !FLAT[s].equal],
  ];
  const SHAPED_LIKE = {
    "a ball": "sphere", "an orange": "sphere", "a globe": "sphere",
    "a can of soup": "cylinder", "a drum": "cylinder", "a candle": "cylinder",
    "a party hat": "cone", "a wizard's hat": "cone", "a toy block": "cube",
  };
  const PLACES = ["above", "below", "next to", "in front of", "behind"];

  it("name solids, tell them from flat shapes, match them to clues and things, and say where things are", () => {
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(shapes)) {
      const p = q.prompt;
      let kind;
      if (p === "What is this solid shape called?") {
        kind = "solid";
        assert.equal(q.answer, q.visual.solid, at);
        for (const c of q.choices) assert.ok(c in SOLID, `${at} → ${c}`);
      } else if (/^Which of these is a (solid|flat) shape\?$/.test(p)) {
        kind = "flatOrSolid";
        const asked = p.includes("solid") ? SOLID : FLAT;
        for (const c of q.choices) assert.equal(c in asked, c === q.answer, `${at} → ${c}`);
      } else if (/^What solid shape is .+ shaped like\?$/.test(p)) {
        kind = "shapedLike";
        const thing = p.match(/^What solid shape is (.+) shaped like\?$/)[1];
        assert.equal(q.answer, SHAPED_LIKE[thing], at);
        assert.ok(!thing.includes(q.answer), `${at}: the thing's name gives the answer away`);
      } else if (/^Which (solid|flat) shape /.test(p)) {
        kind = "clue";
        const fits = CLUE_FITS.find(([pattern]) => pattern.test(p));
        assert.ok(fits, `${at}: no check for this clue`);
        for (const c of q.choices) assert.equal(fits[1](c), c === q.answer, `${at} → ${c}`);
      } else if (/^Where is the \w+\?$/.test(p)) {
        kind = "where";
        const v = q.visual;
        assert.equal(p, `Where is the ${v.thing}?`, at);
        assert.equal(q.answer, `${v.place} the ${v.landmark}`, at);
        const places = q.choices.map(c => c.replace(` the ${v.landmark}`, ""));
        assert.ok(places.every(place => PLACES.includes(place)), at);
        assert.equal(new Set(places).size, 4, at);
      } else continue;
      seen.add(kind);
      assert.ok(grade < 1, `${at}: ${kind} is for kindergarten`);
    }
    assert.equal(seen.size, 5);
  });

  it("count squares in rows and columns, and the faces and corners of solids, hidden ones too", () => {
    /** Each solid's faces and corners, written out again. */
    const PARTS = { cube: { faces: 6, corners: 8 }, box: { faces: 6, corners: 8 }, pyramid: { faces: 5, corners: 5 } };
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(shapes)) {
      const p = q.prompt;
      const v = q.visual;
      let kind;
      if (p.endsWith("How many squares are there in all?")) {
        kind = "total";
        assert.equal(q.answer, v.width * v.height, at);
      } else if (p === "How many rows of squares are there?") {
        kind = "rows";
        assert.equal(q.answer, v.height, at);
      } else if (p === "How many columns of squares are there?" || p === "How many squares are in each row?") {
        kind = "columns";
        assert.equal(q.answer, v.width, at);
      } else if (/^How many (faces|corners) does this solid shape have\?/.test(p)) {
        kind = "parts";
        assert.equal(q.answer, PARTS[v.solid][p.match(/faces|corners/)[0]], at);
      } else continue;
      seen.add(kind);
      assert.ok(grade >= 2 && grade < 3, `${at}: ${kind} is for second grade`);
      if (kind !== "parts") {
        assert.ok(v.kind === "area" && v.shape === "rectangle" && v.grid, at);
        assert.ok(v.width !== v.height && Math.max(v.width, v.height) <= 5, `${at}: up to 5 rows and 5 columns, never a square`);
      }
    }
    assert.equal(seen.size, 4);
  });
});

describe("building and putting shapes together", () => {
  it("builds shapes from straws, and names the shapes a shape is made of (K.G.5, K.G.6, 1.G.2)", () => {
    /** How each picture is cut, written out again: how many parts, of what. */
    const PARTS = {
      triangles: [2, "two triangles"], squares: [2, "two squares"], rectangles: [2, "two rectangles"], "four squares": [4, "four squares"],
      "half-circles": [2, "two half-circles"], house: [2, "a square and a triangle"], trapezoids: [2, "two trapezoids"], "three triangles": [3, "three triangles"],
    };
    const STRAWS = { "3 straws end to end": "triangle", "4 straws, all the same length": "square", "2 long straws and 2 short straws": "rectangle" };
    const TOGETHER = { "two squares side by side": "rectangle", "two half-circles together": "circle", "two matching trapezoids": "hexagon" };
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(shapes)) {
      const p = q.prompt;
      if (q.visual?.kind === "compose") {
        seen.add("compose");
        assert.ok(grade < 2, at);
        const [count, made] = PARTS[q.visual.figure];
        assert.equal(COMPOSED[q.visual.figure].length, count, at);
        assert.equal(q.answer, made, at);
        if (grade < 1) assert.ok(!["trapezoids", "three triangles"].includes(q.visual.figure), `${at}: trapezoids come in first grade`);
      } else if (/straws/.test(p)) {
        seen.add("straws");
        assert.ok(grade < 1, at);
        const many = p.match(/^How many straws do you need to make an? (\w+)\?$/);
        if (many) assert.equal(q.answer, { triangle: 3, square: 4, rectangle: 4, hexagon: 6 }[many[1]], at);
        else assert.equal(q.answer, STRAWS[Object.keys(STRAWS).find(k => p.includes(k))], at);
      } else if (/^You put two/.test(p)) {
        seen.add("together");
        assert.ok(grade >= 1 && grade < 2, at);
        assert.equal(q.answer, TOGETHER[Object.keys(TOGETHER).find(k => p.includes(k))], at);
      }
    }
    assert.equal(seen.size, 3);
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
