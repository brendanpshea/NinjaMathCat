// tests/visuals.test.js — drawing visuals (src/visuals/): every visual any
// question makes renders cleanly, and what is drawn matches the data.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderVisual, describeVisual } from "../src/visuals/index.js";
import { SHAPE_CORNERS } from "../src/visuals/pictures.js";
import { LINE_LEFT, LINE_RIGHT } from "../src/visuals/number_line.js";
import { linear, niceStep } from "../src/visuals/scale.js";
import { escapeXml } from "../src/visuals/svg.js";
import { CURRICULUM } from "../src/curriculum.js";
import { SHAPES } from "../src/questions/shapes.js";
import { questionsOf, elementsIn, wellFormed } from "./helpers.js";

/** Every visual the questions make, with its question. */
function* visuals() {
  for (const { type } of CURRICULUM) {
    for (const item of questionsOf(type, 60)) if (item.question.visual) yield item;
  }
}

/** Visuals of one kind, rendered. */
function* rendered(kind) {
  for (const item of visuals()) {
    if (item.question.visual.kind === kind) yield { ...item, v: item.question.visual, svg: renderVisual(item.question.visual) };
  }
}

const close = (a, b, at) => assert.ok(Math.abs(a - b) < 0.6, `${at}: ${a} is not ${b}`);

describe("every visual", () => {
  it("renders as a well-formed, labelled SVG with no missing numbers", () => {
    for (const { question: q, at } of visuals()) {
      const svg = renderVisual(q.visual);
      assert.match(svg, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/, at);
      assert.match(svg, /role="img"/, at);
      assert.ok(svg.includes(`aria-label="${escapeXml(describeVisual(q.visual))}"`), at);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), at);
      assert.ok(wellFormed(svg), `${at}: badly formed`);
    }
  });

  it("is described without giving the answer away", () => {
    for (const { question: q, at } of visuals()) {
      const answer = String(q.answer);
      if (!/\d/.test(answer)) continue;
      const pattern = new RegExp(`(^|[^\\d/.:])${answer.replace(/[.$]/g, "\\$&")}($|[^\\d/.:])`);
      assert.ok(!pattern.test(describeVisual(q.visual)), `${at}: "${describeVisual(q.visual)}" gives away ${answer}`);
    }
  });

  it("escapes text it is given", () => {
    const svg = renderVisual({ kind: "bar_graph", title: "Fish & <Chips>", axis: "\"Votes\"", scale: 1, max: 2, bars: [{ label: "A&B", value: 2 }] });
    assert.ok(wellFormed(svg));
    assert.ok(svg.includes("Fish &amp; &lt;Chips&gt;") && svg.includes("A&amp;B"));
  });
});

describe("scales", () => {
  it("map numbers onto positions, either way round", () => {
    assert.equal(linear([0, 10], [0, 100])(5), 50);
    assert.equal(linear([0, 10], [300, 50])(10), 50);
  });

  it("pick steps a child can count by", () => {
    assert.deepEqual([10, 11, 40, 100, 101, 500].map(max => niceStep(max)), [1, 2, 5, 10, 20, 50]);
  });
});

describe("drawing", () => {
  it("counters: one per thing to count", () => {
    for (const { v, svg, at } of rendered("objects")) assert.equal(elementsIn(svg, "text", "counter").length, v.count, at);
  });

  it("patterns: every picture, and one gap", () => {
    for (const { v, svg, at } of rendered("pattern")) {
      assert.equal(elementsIn(svg, "g", "gap").length, 1, at);
      // A picture for each item, and a "?" in the gap, which is one of them.
      assert.equal(elementsIn(svg, "text").length, v.items.length, at);
    }
  });

  it("money: every coin and bill, in order", () => {
    for (const { v, svg, at } of rendered("money")) {
      assert.deepEqual(elementsIn(svg, "g", "money").map(g => g["data-id"]), v.items, at);
    }
  });

  it("clocks: the hands point to the time, the hour hand moving on through the hour", () => {
    for (const { v, svg, at } of rendered("clock")) {
      const [hour, minute] = elementsIn(svg, "line", "hand");
      close(Number(hour["data-angle"]), ((v.hours % 12) + v.minutes / 60) * 30, at);
      close(Number(minute["data-angle"]), v.minutes * 6, at);
    }
  });

  it("number lines: a tick at every step, labels where they should be, and points in place", () => {
    for (const { v, svg, at } of rendered("number_line")) {
      const ticks = elementsIn(svg, "line", "tick");
      assert.equal(ticks.length, (v.to - v.from) / v.tick + 1, at);
      assert.equal(elementsIn(svg, "text", "tick-label").length, ticks.filter(t => Number(t["data-at"]) % v.label === 0).length, at);
      for (const point of elementsIn(svg, "circle", "point")) {
        const where = (Number(point.cx) - LINE_LEFT) / (LINE_RIGHT - LINE_LEFT);
        close(where * 100, ((Number(point["data-at"]) - v.from) / (v.to - v.from)) * 100, at);
      }
      assert.equal(elementsIn(svg, "path", "jump").length, v.jumps.length, at);
    }
  });

  it("picture graphs: as many pictures in each row as its value calls for", () => {
    for (const { v, svg, at } of rendered("picture_graph")) {
      const rows = svg.split('<g class="row"').slice(1).map(chunk => chunk.slice(0, chunk.indexOf("</g>")));
      assert.equal(rows.length, v.rows.length, at);
      rows.forEach((chunk, i) => {
        assert.equal(elementsIn(chunk, "text", "picture").length, v.rows[i].value / v.each, at);
      });
    }
  });

  it("bar graphs: bars stand on the axis with heights in proportion to their values", () => {
    for (const { v, svg, at } of rendered("bar_graph")) {
      const bars = elementsIn(svg, "rect", "bar");
      const gridlines = elementsIn(svg, "line", "gridline");
      assert.equal(bars.length, v.bars.length, at);
      assert.equal(gridlines.length, v.max / v.scale + 1, at);
      const axis = Number(gridlines[0].y1);
      const top = Number(gridlines[gridlines.length - 1].y1);
      for (const bar of bars) {
        close(Number(bar.y) + Number(bar.height), axis, at);
        close(Number(bar.height), (Number(bar["data-value"]) / v.max) * (axis - top), at);
      }
    }
  });

  it("fraction models: the right number of equal parts, the right number shaded", () => {
    for (const { v, svg, at } of rendered("fraction")) {
      const parts = elementsIn(svg, v.model === "bar" ? "rect" : "(?:path|circle)", "part");
      assert.equal(parts.length, v.parts, at);
      assert.equal(parts.filter(p => p["data-shaded"] === "true").length, v.shaded, at);
    }
  });
});

describe("shapes as drawn", () => {
  /** Lengths of the sides and the corner angles of a drawn polygon. */
  function measure(corners) {
    const sides = corners.map((p, i) => {
      const q = corners[(i + 1) % corners.length];
      return [q[0] - p[0], q[1] - p[1]];
    });
    const lengths = sides.map(([x, y]) => Math.hypot(x, y));
    const rightAngles = sides.filter((s, i) => {
      const t = sides[(i + 1) % sides.length];
      return Math.abs(s[0] * t[0] + s[1] * t[1]) < 1e-6 * lengths[i] ** 2;
    }).length;
    let parallelPairs = 0;
    for (let i = 0; i < sides.length; i++) {
      for (let j = i + 1; j < sides.length; j++) {
        const cross = sides[i][0] * sides[j][1] - sides[i][1] * sides[j][0];
        if (Math.abs(cross) < 1e-6 * lengths[i] * lengths[j]) parallelPairs++;
      }
    }
    const equalSides = lengths.every(l => Math.abs(l - lengths[0]) < 0.5);
    return { sides: corners.length, rightAngles, parallelPairs, equalSides };
  }

  it("match the facts the shape questions are built on", () => {
    for (const shape of SHAPES) {
      if (shape.id === "circle") continue;
      const drawn = measure(SHAPE_CORNERS[shape.id]);
      assert.deepEqual(drawn, {
        sides: shape.sides, rightAngles: shape.rightAngles, parallelPairs: shape.parallelPairs, equalSides: shape.equalSides,
      }, shape.id);
    }
  });

  it("draw every shape a question can ask about", () => {
    for (const { v, svg, at } of rendered("shape")) {
      if (v.shape === "circle") assert.equal(elementsIn(svg, "circle", "shape").length, 1, at);
      else assert.equal(elementsIn(svg, "polygon", "shape")[0].points.split(" ").length, SHAPE_CORNERS[v.shape].length, at);
    }
  });
});
