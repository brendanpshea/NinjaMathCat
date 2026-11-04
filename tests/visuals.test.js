// tests/visuals.test.js — drawing visuals (src/visuals/): every visual any
// question makes renders cleanly, and what is drawn matches the data.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderVisual, describeVisual, dataTable } from "../src/visuals/index.js";
import { SHAPE_CORNERS } from "../src/visuals/pictures.js";
import { LINE_LEFT, LINE_RIGHT, NARROW_RIGHT } from "../src/visuals/number_line.js";
import { linear, niceStep } from "../src/visuals/scale.js";
import { escapeXml } from "../src/visuals/svg.js";
import { rulerText } from "../src/questions/rational.js";
import { CURRICULUM } from "../src/curriculum.js";
import { SHAPES, SOLID_PARTS } from "../src/questions/shapes.js";
import { questionsOf, elementsIn, picturesIn, wellFormed } from "./helpers.js";

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
    for (const { v, svg, at } of rendered("objects")) assert.equal(picturesIn(svg, "counter").length, v.count, at);
  });

  it("rows of pictures: every picture, and a gap where one is missing", () => {
    for (const { v, svg, at } of rendered("pattern")) {
      assert.equal(elementsIn(svg, "g", "gap").length, v.items.filter(i => i === null).length, at);
      // A picture for each item, and a "?" in the gap, which is one of them.
      assert.equal(picturesIn(svg).length, v.items.length, at);
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
        assert.equal(picturesIn(chunk, "picture").length, v.rows[i].value / v.each, at);
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

  /** The corners of a polygon, as [x, y] pairs. */
  const corners = polygon => polygon.points.split(" ").map(p => p.split(",").map(Number));

  it("areas: drawn to scale, with a unit square for every square unit, and the height square to the base", () => {
    for (const { v, svg, at } of rendered("area")) {
      const [figure] = elementsIn(svg, v.shape === "rectangle" ? "rect" : "polygon", "figure");
      assert.equal(Number(figure["data-width"]), v.width, at);
      assert.equal(Number(figure["data-height"]), v.height, at);
      assert.equal(elementsIn(svg, "rect", "cell").length, v.grid ? v.width * v.height : 0, at);
      assert.equal(elementsIn(svg, "text", "label").length, v.labels ? 2 : 0, at);
      if (v.shape === "rectangle") {
        close(Number(figure.width) / v.width, Number(figure.height) / v.height, at);
        continue;
      }
      const points = corners(figure);
      const [left, right] = [points[0], points[1]];
      const top = points[points.length - 1];
      const [height] = elementsIn(svg, "line", "height");
      close(right[1], left[1], at);
      close((right[0] - left[0]) / v.width, (left[1] - top[1]) / v.height, at);
      close(Number(height.x1), Number(height.x2), at);
      close(Number(height.x1), top[0], at);
    }
  });

  it("boxes: drawn to scale, with every cube that shows", () => {
    for (const { v, svg, at } of rendered("cubes")) {
      const cubes = elementsIn(svg, "polygon", "cube");
      assert.equal(cubes.length, v.cubes ? v.length * v.height + v.length * v.width + v.width * v.height : 0, at);
      const [front] = elementsIn(svg, "polygon", "face--front");
      const xs = corners(front).map(p => p[0]);
      const ys = corners(front).map(p => p[1]);
      close((Math.max(...xs) - Math.min(...xs)) / v.length, (Math.max(...ys) - Math.min(...ys)) / v.height, at);
      assert.equal(elementsIn(svg, "text", "label").length, v.labels ? 3 : 0, at);
    }
  });

  it("angles: the rays are as far apart as the angle, and point where they say", () => {
    for (const { v, svg, at } of rendered("angle")) {
      const rays = elementsIn(svg, "line", "ray");
      assert.equal(rays.length, 2, at);
      for (const ray of rays) {
        const turn = (Math.atan2(Number(ray.y1) - Number(ray.y2), Number(ray.x2) - Number(ray.x1)) * 180) / Math.PI;
        close((turn + 360) % 360, Number(ray["data-angle"]) % 360, at);
      }
      assert.equal(Math.abs(rays[0]["data-angle"] - rays[1]["data-angle"]), v.degrees, at);
      assert.equal(Number(rays[0]["data-angle"]), v.base === "right" ? 0 : 180, at);
      // Both scales of a protractor, numbered every 10 degrees.
      assert.equal(elementsIn(svg, "text", "outer").length, v.protractor ? 19 : 0, at);
      assert.equal(elementsIn(svg, "text", "inner").length, v.protractor ? 19 : 0, at);
    }
  });

  it("coordinate grids: every point where its numbers say", () => {
    for (const { v, svg, at } of rendered("coordinates")) {
      const xLabels = elementsIn(svg, "text", "x-label");
      // The grid's left edge and the size of a square, from where 0 and 1 (or min and min + 1) are written.
      const first = Number(xLabels[0].x);
      const cell = Number(xLabels[1].x) - first;
      const points = elementsIn(svg, "circle", "point");
      assert.equal(points.length, v.points.length, at);
      const bottom = Math.max(...points.map(p => Number(p.cy) + (Number(p["data-y"]) - v.min) * cell));
      for (const p of points) {
        close(Number(p.cx), first + (Number(p["data-x"]) - v.min) * cell, at);
        close(Number(p.cy) + (Number(p["data-y"]) - v.min) * cell, bottom, at);
      }
    }
  });

  it("line plots: a labelled tick at every position, and an X for every thing measured there", () => {
    for (const { v, svg, at } of rendered("line_plot")) {
      const ticks = elementsIn(svg, "line", "tick");
      assert.deepEqual(ticks.map(t => Number(t["data-at"])), v.counts.map((_, i) => v.from + i), at);
      assert.deepEqual([...svg.matchAll(/class="tick-label"[^>]*>([^<]+)</g)].map(m => m[1]), v.counts.map((_, i) => rulerText(v.from + i, v.den)), at);
      const marks = elementsIn(svg, "path", "mark");
      v.counts.forEach((count, i) => assert.equal(marks.filter(m => Number(m["data-at"]) === v.from + i).length, count, at));
    }
  });

  it("narrow number lines and line plots, for phones, keep every tick, label and point", () => {
    for (const kind of ["number_line", "line_plot"]) {
      for (const { v, svg, at } of rendered(kind)) {
        const narrow = renderVisual(v, { narrow: true });
        assert.ok(wellFormed(narrow), at);
        const width = Number(narrow.match(/viewBox="0 0 ([\d.]+)/)[1]);
        assert.ok(width < Number(svg.match(/viewBox="0 0 ([\d.]+)/)[1]), `${at}: no narrower`);
        assert.equal(elementsIn(narrow, "line", "tick").length, elementsIn(svg, "line", "tick").length, at);
        assert.equal(elementsIn(narrow, "text", "tick-label").length, elementsIn(svg, "text", "tick-label").length, at);
        if (kind === "number_line") {
          for (const point of elementsIn(narrow, "circle", "point")) {
            const where = (Number(point.cx) - LINE_LEFT) / (NARROW_RIGHT - LINE_LEFT);
            close(where * 100, ((Number(point["data-at"]) - v.from) / (v.to - v.from)) * 100, at);
          }
        }
      }
    }
  });

  it("graphs and line plots come with their numbers, in a table for a screen reader", () => {
    for (const { question: q, at } of visuals()) {
      const v = q.visual;
      const table = dataTable(v);
      if (!["picture_graph", "bar_graph", "line_plot"].includes(v.kind)) {
        assert.equal(table, "", at);
        continue;
      }
      assert.ok(wellFormed(table), at);
      const rows = [...table.matchAll(/<tr><th scope="row">([^<]*)<\/th><td>([^<]*)<\/td><\/tr>/g)].map(m => [m[1], Number(m[2])]);
      const expected = v.kind === "picture_graph" ? v.rows.map(r => r.value) : v.kind === "bar_graph" ? v.bars.map(b => b.value) : v.counts;
      assert.deepEqual(rows.map(r => r[1]), expected, at);
      assert.ok(table.includes(`<caption>${escapeXml(v.title)}</caption>`), at);
    }
  });

  it("ribbons: drawn to scale, each named, with a cube for each unit and a tick for each mark", () => {
    for (const { v, svg, at } of rendered("lengths")) {
      const ribbons = elementsIn(svg, "rect", "ribbon");
      assert.equal(ribbons.length, v.ribbons.length, at);
      assert.equal(elementsIn(svg, "text", "ribbon-label").length, v.ribbons.length, at);
      const unit = Number(ribbons[0].width) / v.ribbons[0].length;
      ribbons.forEach((r, i) => close(Number(r.width), v.ribbons[i].length * unit, at));
      // Every ribbon starts where the scale says.
      const zero = Number(ribbons[0].x) - v.ribbons[0].from * unit;
      ribbons.forEach((r, i) => close(Number(r.x), zero + v.ribbons[i].from * unit, at));
      assert.equal(elementsIn(svg, "rect", "cube").length, v.cubes ? v.ribbons[0].length : 0, at);
      assert.equal(elementsIn(svg, "line", "tick").length, v.ruler ? v.span + 1 : 0, at);
      if (v.ruler) for (const tick of elementsIn(svg, "line", "tick")) close(Number(tick.x1), zero + Number(tick["data-at"]) * unit, at);
    }
  });

  it("groups: a row for each group, with a picture for each thing in it, and no counts said", () => {
    for (const { v, svg, at } of rendered("groups")) {
      const things = picturesIn(svg, "counter");
      v.rows.forEach((row, j) => assert.equal(things.filter(t => t["data-row"] === String(j)).length, row.count, at));
      assert.ok(!/\d/.test(describeVisual(v)), `${at}: "${describeVisual(v)}" gives the counts away`);
    }
  });

  it("fraction bars: the same length, each with its equal parts and as many shaded as it says", () => {
    for (const { v, svg, at } of rendered("fraction_bars")) {
      const parts = elementsIn(svg, "rect", "part");
      v.bars.forEach((bar, j) => {
        const mine = parts.filter(p => p["data-bar"] === String(j));
        assert.equal(mine.length, bar.parts, at);
        assert.equal(mine.filter(p => p["data-shaded"] === "true").length, bar.shaded, at);
        // Shaded from the left, and spanning the same width as every other bar.
        assert.ok(mine.every((p, i) => (p["data-shaded"] === "true") === (i < bar.shaded)), at);
        const span = mine.reduce((sum, p) => sum + Number(p.width), 0);
        close(span, 400, at);
      });
    }
  });

  it("hundredths grids: 100 squares each, shaded a column at a time", () => {
    for (const { v, svg, at } of rendered("hundredths")) {
      const squares = elementsIn(svg, "rect", "square");
      v.grids.forEach((shaded, g) => {
        const mine = squares.filter(s => s["data-grid"] === String(g));
        assert.equal(mine.length, 100, at);
        assert.equal(mine.filter(s => s["data-shaded"] === "true").length, shaded, at);
        // Every shaded square is left of, or above, every unshaded one in its column order.
        const order = s => Number(s.x) * 1000 + Number(s.y);
        const lastShaded = Math.max(...mine.filter(s => s["data-shaded"] === "true").map(order));
        assert.ok(mine.filter(s => s["data-shaded"] === "false").every(s => order(s) > lastShaded), at);
      });
    }
  });

  it("lines: arrows where they go on, dots where they stop, and pairs at the right angle", () => {
    const ENDS = { line: [["arrow", "arrow"]], ray: [["dot", "arrow"]], segment: [["dot", "dot"]], parallel: [["arrow", "arrow"], ["arrow", "arrow"]], perpendicular: [["arrow", "arrow"], ["arrow", "arrow"]], intersecting: [["arrow", "arrow"], ["arrow", "arrow"]] };
    for (const figure of Object.keys(ENDS)) {
      for (const turn of [0, 45, 90, 165]) {
        const v = { kind: "lines", figure, turn, cross: 55 };
        const svg = renderVisual(v);
        const at = `${figure} at ${turn}°`;
        assert.ok(wellFormed(svg), at);
        const straights = elementsIn(svg, "line", "straight");
        assert.deepEqual(straights.map(s => [s["data-start"], s["data-end"]]), ENDS[figure], at);
        const dots = ENDS[figure].flat().filter(e => e === "dot").length;
        assert.equal(elementsIn(svg, "circle", "end-dot").length, dots, at);
        assert.equal(elementsIn(svg, "polygon", "end-arrow").length, ENDS[figure].flat().length - dots, at);
        // Every end stays inside the picture.
        for (const s of straights) for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) assert.ok(x >= 10 && x <= 290 && y >= 10 && y <= 250, `${at}: off the picture`);
        if (straights.length === 2) {
          const [a, b] = straights.map(s => [s.x2 - s.x1, s.y2 - s.y1]);
          const cos = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
          if (figure === "parallel") close(Math.abs(cos), 1, at);
          if (figure === "perpendicular") close(cos * 100, 0, at);
          if (figure === "intersecting") assert.ok(Math.abs(cos) > 0.3 && Math.abs(cos) < 0.99, at);
          assert.equal(elementsIn(svg, "polyline", "right-angle").length, Number(figure === "perpendicular"), at);
        }
      }
    }
  });

  it("nets: six faces for a box or cube, five for a triangular prism or square pyramid, and labels where given", () => {
    const FACES = { box: 6, cube: 6, "triangular prism": 5, "square pyramid": 5 };
    for (const { v, svg, at } of rendered("net")) {
      assert.equal(elementsIn(svg, "polygon", "face").length, FACES[v.solid], at);
      const labels = svg.match(/class="edge-label"[^>]*>([^<]*)</g) ?? [];
      assert.equal(labels.length, v.labels ? 3 : 0, at);
    }
  });

  it("L-shapes: six corners, the corner cut away where it says, and four sides labelled", () => {
    for (const { v, svg, at } of rendered("composite")) {
      const [polygon] = elementsIn(svg, "polygon", "figure");
      const corners = polygon.points.split(" ").map(p => p.split(",").map(Number));
      assert.equal(corners.length, 6, at);
      // Side lengths in proportion to the numbers: the bottom is as long as width says, the top as long as width less the notch.
      const unit = (corners[4][0] - corners[5][0]) / v.width;
      close((corners[1][0] - corners[0][0]) / unit, v.width - v.notch[0], at);
      close((corners[5][1] - corners[0][1]) / unit, v.height, at);
      close((corners[3][1] - corners[2][1]) / unit, 0, at);
      close((corners[2][1] - corners[1][1]) / unit, v.notch[1], at);
      assert.equal(elementsIn(svg, "text", "side-label").length, 4, at);
      assert.equal(elementsIn(svg, "line", "split").length, Number(v.split), at);
    }
  });

  it("jugs and scales: the water as high as its value, the needle pointing at it, marks every step", () => {
    for (const { v, svg, at } of rendered("gauge")) {
      assert.equal(elementsIn(svg, "line", "mark").length, v.max / v.step + (v.tool === "scale" ? 1 : 0), at);
      if (v.tool === "jug") {
        const [water] = elementsIn(svg, "rect", "water");
        const share = (water["data-bottom"] - water["data-top"]) / (water["data-bottom"] - water["data-full"]);
        close(share * 100, (v.value / v.max) * 100, at);
      } else {
        const [needle] = elementsIn(svg, "line", "needle");
        // Clockwise from straight up, the dial running from -150° to 150°.
        const degrees = (Math.atan2(needle.x2 - needle.x1, needle.y1 - needle.y2) * 180) / Math.PI;
        close(degrees, -150 + (300 * v.value) / v.max, at);
      }
    }
  });

  it("box plots: the box from quartile to quartile, the median inside, the whiskers to the ends", () => {
    for (const { v, svg, at } of rendered("box_plot")) {
      const X = n => 36 + ((464 - 36) * (n - v.from)) / (v.to - v.from);
      const [low, q1, median, q3, high] = v.five.map(X);
      const [box] = elementsIn(svg, "rect", "box");
      close(Number(box.x), q1, at);
      close(Number(box.x) + Number(box.width), q3, at);
      close(Number(elementsIn(svg, "line", "median")[0].x1), median, at);
      assert.deepEqual(elementsIn(svg, "line", "end").map(e => Math.round(e.x1)), [Math.round(low), Math.round(high)], at);
      assert.equal(elementsIn(svg, "text", "tick-label").length, (v.to - v.from) / v.step + 1, at);
    }
  });

  it("double number lines: marks lined up, every number shown but one, and that one boxed", () => {
    for (const { v, svg, at } of rendered("double_line")) {
      const ticks = elementsIn(svg, "line", "tick");
      assert.equal(ticks.length, 2 * v.top.values.length, at);
      const [top, bottom] = [ticks.slice(0, v.top.values.length), ticks.slice(v.top.values.length)];
      top.forEach((t, i) => assert.equal(t.x1, bottom[i].x1, at));
      assert.equal(elementsIn(svg, "rect", "missing").length, 1, at);
      assert.equal(elementsIn(svg, "text", "value").length, 2 * v.top.values.length - 1, at);
    }
  });

  it("crossed-out counters: the last ones crossed, and every counter still there", () => {
    for (const { v, svg, at } of rendered("objects")) {
      assert.equal(picturesIn(svg, "counter").length, v.count, at);
      assert.equal((svg.match(/class="crossed"/g) ?? []).length, v.crossed ?? 0, at);
    }
  });

  it("shapes put together: a part for each piece, in alternating colors", () => {
    for (const { v, svg, at } of rendered("compose")) {
      const parts = elementsIn(svg, "(?:polygon|path)", "part");
      assert.ok(parts.length >= 2, at);
      assert.ok(parts.every((p, i) => i === 0 || p.fill !== parts[i - 1].fill), `${at}: two parts side by side in one color`);
    }
  });

  it("for teaching scenes: names every part to tap or ring, and says each one to tap", () => {
    /** A picture of each kind a scene can point at, with some of the names it should have. */
    const FIXTURES = [
      [{ kind: "objects", emoji: "🍎", count: 7, crossed: 2 }, ["item-0", "item-6"], ["crossed"]],
      [{ kind: "pattern", items: ["🍎", "🍌", null, "🍎"] }, ["item-0", "gap"], []],
      [{ kind: "groups", rows: [{ name: "cats", emoji: "🐱", count: 3 }, { name: "dogs", emoji: "🐶", count: 2 }] }, ["row-0", "row-1"], []],
      [{ kind: "ten_frame", frames: 2, filled: 14 }, ["frame-0", "frame-1"], []],
      [{ kind: "base_ten", hundreds: 1, tens: 2, ones: 3 }, ["flat-0", "rod-1", "unit-2"], ["flats", "rods", "units"]],
      [{ kind: "money", items: ["quarter", "dime", "dollar"] }, ["item-0", "item-2"], []],
      [{ kind: "clock", hours: 3, minutes: 30 }, ["hour-hand", "minute-hand"], ["number-12"]],
      [{ kind: "number_line", den: 1, from: 0, to: 10, tick: 1, label: 5, points: [3], jumps: [[3, 7]] }, ["tick-0", "tick-10"], ["point-3", "jump-0"]],
      [{ kind: "fraction", model: "circle", parts: 4, shaded: 3 }, ["part-0", "part-3"], ["shaded"]],
      [{ kind: "fraction_bars", bars: [{ parts: 2, shaded: 1 }, { parts: 4, shaded: 2 }] }, ["bar-0-part-0", "bar-1-part-3"], ["bar-0", "bar-1-shaded"]],
      [{ kind: "hundredths", grids: [37] }, ["column-0", "column-9"], ["square-36", "full", "extra"]],
      [{ kind: "area", shape: "rectangle", width: 4, height: 3, grid: true }, ["row-0", "row-2"], ["column-3", "cell-0-0"]],
      [{ kind: "area", shape: "rectangle", width: 5, height: 3, grid: false, labels: { base: "5 cm", height: "3 cm" } }, ["side-top", "side-left"], []],
      [{ kind: "bar_graph", title: "Pets", axis: "Children", scale: 2, max: 10, bars: [{ label: "Cats", value: 6 }, { label: "Dogs", value: 4 }] }, ["bar-0", "bar-1"], []],
      [{ kind: "picture_graph", title: "Pets", unit: ["child", "children"], each: 2, rows: [{ label: "Cats", icon: "🐱", value: 6 }] }, ["row-0"], []],
      [{ kind: "line_plot", title: "Lengths", den: 2, from: 2, counts: [1, 3, 2] }, ["position-0", "position-2"], []],
      [{ kind: "coordinates", min: 0, max: 10, points: [{ x: 2, y: 3, label: "A" }] }, ["point-A"], []],
      [{ kind: "lengths", ribbons: [{ color: "red", from: 0, length: 5 }], ruler: "inches", cubes: false, span: 8 }, ["ribbon-red"], ["ruler"]],
      [{ kind: "box_plot", title: "Minutes", from: 0, to: 60, step: 5, five: [10, 20, 30, 40, 55] }, ["box", "median", "whisker-low", "whisker-high"], []],
      [{ kind: "double_line", top: { label: "cups", values: [0, 2, null, 6] }, bottom: { label: "eggs", values: [0, 3, 6, 9] } }, ["pair-0", "pair-3"], ["top-1", "bottom-3"]],
      [{ kind: "math", lines: [["3", "×", "(", "4", "+", "2", ")"], ["3", "×", "6"]] }, ["t0-0", "t1-2"], ["line-0", "line-1"]],
    ];
    for (const [v, parts, marks] of FIXTURES) {
      const svg = renderVisual(v);
      assert.ok(wellFormed(svg), v.kind);
      const elements = elementsIn(svg, "[a-z]+");
      const tappable = elements.filter(e => e["data-part"]);
      const named = tappable.map(e => e["data-part"]);
      const marked = new Set(elements.flatMap(e => (e["data-marks"] ?? "").split(" ")).filter(Boolean));
      for (const p of parts) assert.ok(named.includes(p), `${v.kind}: no part ${p}`);
      for (const m of marks) assert.ok(marked.has(m), `${v.kind}: no mark ${m}`);
      assert.equal(new Set(named).size, named.length, `${v.kind}: two parts with one name`);
      for (const e of tappable) assert.ok(e["aria-label"]?.trim(), `${v.kind}: ${e["data-part"]} has nothing to say`);
    }
  });

  it("for teaching scenes: every part in every question's picture has a name to say, and one name each", () => {
    for (const { question: q, at } of visuals()) {
      const tappable = elementsIn(renderVisual(q.visual), "[a-z]+").filter(e => e["data-part"]);
      assert.equal(new Set(tappable.map(e => e["data-part"])).size, tappable.length, `${at}: two parts with one name`);
      for (const e of tappable) assert.ok(e["aria-label"]?.trim(), `${at}: ${e["data-part"]} has nothing to say`);
    }
  });

  it("ten frames: a counter for each one counted, filling the first frame first", () => {
    for (const { v, svg, at } of rendered("ten_frame")) {
      assert.equal(elementsIn(svg, "rect", "frame").length, v.frames, at);
      assert.equal(elementsIn(svg, "circle", "counter").length, v.filled, at);
    }
  });

  it("base-ten blocks: a flat for each hundred, a rod for each ten, a cube for each one", () => {
    for (const { v, svg, at } of rendered("base_ten")) {
      assert.equal(elementsIn(svg, "rect", "flat").length, v.hundreds, at);
      assert.equal(elementsIn(svg, "rect", "rod").length, v.tens, at);
      assert.equal(elementsIn(svg, "rect", "unit").length, v.ones, at);
    }
  });

  it("solids: the faces, corners and edges in sight, and a dashed line for each edge hidden at the back", () => {
    for (const solid of ["cube", "box", "sphere", "cylinder", "cone", "pyramid"]) {
      const v = { kind: "solid", solid };
      const svg = renderVisual(v);
      assert.ok(wellFormed(svg) && svg.includes(`data-solid="${solid}"`), solid);
      assert.ok(!describeVisual(v).includes(solid), `${solid}: the description names it`);
      const parts = SOLID_PARTS[solid];
      if (!parts) continue;
      const faces = elementsIn(svg, "polygon", "face").map(f => f.points.split(" "));
      const hidden = elementsIn(svg, "line", "hidden-edge").map(l => [`${l.x1},${l.y1}`, `${l.x2},${l.y2}`]);
      assert.equal(faces.length, parts.facesSeen, solid);
      assert.equal(new Set(faces.flat()).size, parts.cornersSeen, solid);
      // Every edge, once: the sides of the faces in sight, shared or not, and the dashed ones.
      const edges = new Set([...faces.flatMap(f => f.map((p, i) => [p, f[(i + 1) % f.length]])), ...hidden].map(pair => pair.sort().join(" ")));
      assert.equal(edges.size, parts.edges, solid);
      assert.equal(new Set([...faces.flat(), ...hidden.flat()]).size, parts.corners, solid);
    }
  });

  it("scenes: the thing where it is placed, drawn before the landmark only when it is behind it", () => {
    for (const place of ["above", "below", "next to", "in front of", "behind"]) {
      const v = { kind: "scene", thing: "cat", landmark: "box", place };
      const svg = renderVisual(v);
      assert.ok(wellFormed(svg), place);
      const [thing, landmark] = [svg.indexOf('class="thing"'), svg.indexOf('class="landmark"')];
      assert.ok(thing > 0 && landmark > 0, place);
      assert.equal(thing < landmark, place === "behind", place);
      assert.ok(svg.includes(`data-place="${place}"`), place);
      assert.equal(describeVisual(v), "A cat and a box", `${place}: the description must not say where`);
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
