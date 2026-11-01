// Fraction models: a circle or a bar cut into equal parts, some shaded.

import { svg, el, num, COLORS } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { FractionModel } from "../questions/common.js" */

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
