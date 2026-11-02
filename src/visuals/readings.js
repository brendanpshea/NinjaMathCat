// Things to read numbers off: a measuring jug or a kitchen scale's dial
// (3.MD.2), a box plot (6.SP.4), and a double number line (6.RP.3).

import { svg, el, text, COLORS, num } from "./svg.js";
import { linear } from "./scale.js";
import { describeVisual } from "./describe.js";

/** @import { Gauge, BoxPlot, DoubleLine } from "../questions/common.js" */

const WATER = "#93c5fd";

/**
 * A measuring jug filled to its value, or a scale's dial with the needle on
 * it. Marks every step, numbered every `labelEvery`.
 * @param {Gauge} v
 */
export function gauge(v) {
  const marks = Array.from({ length: v.max / v.step + 1 }, (_, i) => i * v.step);
  /** @param {number} m */
  const numbered = m => m % v.labelEvery === 0;
  const label = { "font-size": 17, "font-weight": 700, fill: COLORS.ink };

  if (v.tool === "jug") {
    const [left, right, top, bottom] = [100, 220, 30, 260];
    const y = linear([0, v.max], [bottom, top + 14]);
    const body = [
      el("rect", { x: left, y: num(y(v.value)), width: right - left, height: num(bottom - y(v.value)), fill: WATER, class: "water", "data-top": num(y(v.value)), "data-bottom": bottom, "data-full": num(y(v.max)) }),
      el("path", { d: `M ${left} ${top} L ${left} ${bottom} L ${right} ${bottom} L ${right} ${top}`, fill: "none", stroke: COLORS.ink, "stroke-width": 4, "stroke-linejoin": "round" }),
      el("path", { d: `M ${right} ${top + 40} C ${right + 50} ${top + 40}, ${right + 50} ${top + 130}, ${right} ${top + 130}`, fill: "none", stroke: COLORS.ink, "stroke-width": 4 }),
      text({ x: left - 10, y: top - 8, "text-anchor": "end", ...label }, v.unit),
    ];
    for (const m of marks.slice(1)) {
      body.push(el("line", { x1: left, y1: num(y(m)), x2: left + (numbered(m) ? 24 : 13), y2: num(y(m)), stroke: COLORS.ink, "stroke-width": numbered(m) ? 2.5 : 1.5, class: "mark" }));
      if (numbered(m)) body.push(text({ x: left - 8, y: num(y(m)), "text-anchor": "end", "dominant-baseline": "central", ...label }, String(m)));
    }
    return svg("gauge", 300, 280, describeVisual(v), body);
  }

  // A dial from 0 at the lower left, round the top, to max at the lower right.
  const [cx, cy, r] = [150, 165, 108];
  /** @param {number} m */
  const angle = m => ((-150 + (300 * m) / v.max) * Math.PI) / 180;
  /** @param {number} m @param {number} radius */
  const at = (m, radius) => [cx + radius * Math.sin(angle(m)), cy - radius * Math.cos(angle(m))];
  const body = [
    el("rect", { x: cx - 95, y: cy - r - 38, width: 190, height: 14, rx: 7, fill: COLORS.grid, stroke: COLORS.ink, "stroke-width": 2.5 }),
    el("rect", { x: cx - 8, y: cy - r - 24, width: 16, height: 16, fill: COLORS.grid, stroke: COLORS.ink, "stroke-width": 2 }),
    el("circle", { cx, cy, r, fill: COLORS.paper, stroke: COLORS.ink, "stroke-width": 4 }),
    text({ x: cx, y: cy + 46, "text-anchor": "middle", ...label }, v.unit),
  ];
  for (const m of marks) {
    const [[x1, y1], [x2, y2]] = [at(m, r - 4), at(m, r - (numbered(m) ? 20 : 12))];
    body.push(el("line", { x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2), stroke: COLORS.ink, "stroke-width": numbered(m) ? 2.5 : 1.5, class: "mark" }));
    if (numbered(m)) {
      const [lx, ly] = at(m, r - 44);
      body.push(text({ x: num(lx), y: num(ly), "text-anchor": "middle", "dominant-baseline": "central", ...label, "font-size": 16 }, String(m)));
    }
  }
  const [nx, ny] = at(v.value, r - 22);
  body.push(
    el("line", { x1: cx, y1: cy, x2: num(nx), y2: num(ny), stroke: COLORS.point, "stroke-width": 4, "stroke-linecap": "round", class: "needle" }),
    el("circle", { cx, cy, r: 7, fill: COLORS.point }),
  );
  return svg("gauge", 300, cy + r + 14, describeVisual(v), body);
}

/**
 * A box plot above a number line marked every step.
 * @param {BoxPlot} v
 */
export function boxPlot(v) {
  const [left, right, mid, half, axis] = [36, 464, 82, 26, 140];
  const X = linear([v.from, v.to], [left, right]);
  const [low, q1, median, q3, high] = v.five.map(X);
  const ink = { stroke: COLORS.ink, "stroke-width": 3 };
  const body = [
    text({ x: 250, y: 22, "font-size": 17, "font-weight": 700, "text-anchor": "middle", fill: COLORS.ink }, v.title),
    el("line", { x1: left, y1: axis, x2: right, y2: axis, stroke: COLORS.ink, "stroke-width": 2 }),
  ];
  for (let k = v.from; k <= v.to; k += v.step) {
    body.push(
      el("line", { x1: num(X(k)), y1: axis, x2: num(X(k)), y2: axis + 8, stroke: COLORS.ink, "stroke-width": 2 }),
      text({ x: num(X(k)), y: axis + 27, "font-size": 16, "font-weight": 600, "text-anchor": "middle", fill: COLORS.muted, class: "tick-label" }, String(k)),
    );
  }
  body.push(
    el("line", { x1: num(low), y1: mid, x2: num(q1), y2: mid, ...ink, class: "whisker" }),
    el("line", { x1: num(q3), y1: mid, x2: num(high), y2: mid, ...ink, class: "whisker" }),
    el("line", { x1: num(low), y1: mid - 14, x2: num(low), y2: mid + 14, ...ink, class: "end" }),
    el("line", { x1: num(high), y1: mid - 14, x2: num(high), y2: mid + 14, ...ink, class: "end" }),
    el("rect", { x: num(q1), y: mid - half, width: num(q3 - q1), height: 2 * half, fill: COLORS.fill, ...ink, class: "box" }),
    el("line", { x1: num(median), y1: mid - half, x2: num(median), y2: mid + half, stroke: COLORS.ink, "stroke-width": 4, class: "median" }),
  );
  return svg("box_plot", 500, 178, describeVisual(v), body);
}

/**
 * Two number lines, one above the other, with their marks lined up and one
 * number missing, in a dashed box.
 * @param {DoubleLine} v
 */
export function doubleLine(v) {
  const [left, right, upper, lower] = [150, 470, 70, 140];
  const n = v.top.values.length;
  /** @param {number} i */
  const X = i => left + ((right - left) * i) / (n - 1);
  const name = { "font-size": 15, "font-weight": 700, fill: COLORS.ink, "text-anchor": "end", "dominant-baseline": "central" };
  const body = [
    text({ x: left - 22, y: upper, ...name }, v.top.label),
    text({ x: left - 22, y: lower, ...name }, v.bottom.label),
  ];
  for (const [line, y, dy] of /** @type {const} */ ([[v.top, upper, -22], [v.bottom, lower, 26]])) {
    body.push(el("line", { x1: left - 8, y1: y, x2: right + 8, y2: y, stroke: COLORS.ink, "stroke-width": 2.5 }));
    line.values.forEach((value, i) => {
      body.push(el("line", { x1: num(X(i)), y1: y - 9, x2: num(X(i)), y2: y + 9, stroke: COLORS.ink, "stroke-width": 2.5, class: "tick", "data-at": i }));
      if (value === null) {
        body.push(
          el("rect", { x: num(X(i) - 18), y: y + dy - 15, width: 36, height: 30, rx: 6, fill: COLORS.paper, stroke: COLORS.accent, "stroke-width": 2.5, "stroke-dasharray": "5 4", class: "missing" }),
          text({ x: num(X(i)), y: y + dy, "font-size": 18, "font-weight": 800, fill: COLORS.accent, "text-anchor": "middle", "dominant-baseline": "central" }, "?"),
        );
      } else {
        body.push(text({ x: num(X(i)), y: y + dy, "font-size": 17, "font-weight": 700, fill: COLORS.ink, "text-anchor": "middle", "dominant-baseline": "central", class: "value" }, String(value)));
      }
    });
  }
  return svg("double_line", 490, 190, describeVisual(v), body);
}
