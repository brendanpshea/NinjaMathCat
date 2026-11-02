// Fraction models: a circle or a bar cut into equal parts, some shaded.

import { svg, el, text, num, COLORS } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { FractionModel, Visual } from "../questions/common.js" */

const SHADE = "#60a5fa";

/**
 * @param {FractionModel} v
 */
export function fraction(v) {
  /** @param {number} i */
  const look = i => ({ fill: i < v.shaded ? SHADE : COLORS.paper, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round", class: "part", "data-shaded": String(i < v.shaded) });
  const parts = [];

  if (v.model === "bar") {
    const [x0, y0, width, height] = [10, 10, 400, 84];
    for (let i = 0; i < v.parts; i++) {
      parts.push(el("rect", { x: x0 + (i * width) / v.parts, y: y0, width: width / v.parts, height, ...look(i) }));
    }
    return svg("fraction", width + 2 * x0, height + 2 * y0, describeVisual(v), parts);
  }

  const [c, r] = [110, 100];
  /** @param {number} turn  a fraction of the way round, clockwise from the top */
  const at = turn => [c + r * Math.sin(2 * Math.PI * turn), c - r * Math.cos(2 * Math.PI * turn)];
  for (let i = 0; i < v.parts; i++) {
    if (v.parts === 1) {
      parts.push(el("circle", { cx: c, cy: c, r, ...look(i) }));
      continue;
    }
    // Each part is half the circle or less, so the arc is never the long way round.
    const [x1, y1] = at(i / v.parts).map(num);
    const [x2, y2] = at((i + 1) / v.parts).map(num);
    parts.push(el("path", { d: `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`, ...look(i) }));
  }
  return svg("fraction", 2 * c, 2 * c, describeVisual(v), parts);
}

/**
 * Fraction bars, one above another and all the same length, so equal
 * amounts line up. A bar's label, if it has one, goes to its left.
 * @param {Extract<Visual, { kind: "fraction_bars" }>} v
 */
export function fractionBars(v) {
  const [width, height, gap] = [400, 56, 14];
  const x0 = v.bars.some(b => b.label) ? 74 : 10;
  const body = v.bars.flatMap((bar, j) => {
    const y = 10 + j * (height + gap);
    const cells = Array.from({ length: bar.parts }, (_, i) => el("rect", {
      x: x0 + (i * width) / bar.parts, y, width: width / bar.parts, height,
      fill: i < bar.shaded ? SHADE : COLORS.paper, stroke: COLORS.ink, "stroke-width": 2.5,
      class: "part", "data-bar": j, "data-shaded": String(i < bar.shaded),
    }));
    const label = bar.label ? [text({ x: x0 - 14, y: y + height / 2, "font-size": 24, "font-weight": 700, "text-anchor": "end", "dominant-baseline": "central", fill: COLORS.ink }, bar.label)] : [];
    return [...cells, ...label];
  });
  return svg("fraction_bars", x0 + width + 10, 20 + v.bars.length * (height + gap) - gap, describeVisual(v), body);
}

/**
 * Hundredths grids side by side, each filled a column at a time from the
 * left, top to bottom, with an optional label underneath.
 * @param {Extract<Visual, { kind: "hundredths" }>} v
 */
export function hundredths(v) {
  const [cell, gap] = [18, 48];
  const size = 10 * cell;
  const below = v.labels ? 36 : 0;
  const body = v.grids.flatMap((shaded, g) => {
    const x0 = 10 + g * (size + gap);
    const squares = Array.from({ length: 100 }, (_, i) => el("rect", {
      x: x0 + Math.floor(i / 10) * cell, y: 10 + (i % 10) * cell, width: cell, height: cell,
      fill: i < shaded ? SHADE : COLORS.paper, stroke: COLORS.line, "stroke-width": 1,
      class: "square", "data-grid": g, "data-shaded": String(i < shaded),
    }));
    const frame = el("rect", { x: x0, y: 10, width: size, height: size, fill: "none", stroke: COLORS.ink, "stroke-width": 2.5 });
    const label = v.labels ? [text({ x: x0 + size / 2, y: 10 + size + 26, "font-size": 22, "font-weight": 700, "text-anchor": "middle", fill: COLORS.ink }, v.labels[g])] : [];
    return [...squares, frame, ...label];
  });
  return svg("hundredths", 20 + v.grids.length * size + (v.grids.length - 1) * gap, size + 20 + below, describeVisual(v), body);
}
