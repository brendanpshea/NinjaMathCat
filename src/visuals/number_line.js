// Number lines: ticks, some of them labelled, with points and jumps.

import { svg, el, text, hit, COLORS } from "./svg.js";
import { linear } from "./scale.js";
import { describeVisual, positionLabel } from "./describe.js";

/** @import { NumberLine } from "../questions/common.js" */

/** Where the line runs across the picture, which is 600 wide. */
export const LINE_LEFT = 40;
export const LINE_RIGHT = 560;

/** Where it runs in a narrow picture, for a phone: 440 wide, so its numbers come out larger. */
export const NARROW_RIGHT = 400;

/**
 * An arrowhead at the end of a line.
 * @param {number} x  its tip
 * @param {number} y
 * @param {1 | -1} way  1 to point right, -1 left
 */
function arrowhead(x, y, way) {
  return el("path", { d: `M ${x} ${y} l ${-14 * way} -8 l 0 16 z`, fill: COLORS.ink });
}

/**
 * @param {NumberLine} v
 * @param {{ narrow?: boolean }} [options]
 */
export function numberLine(v, { narrow = false } = {}) {
  const right = narrow ? NARROW_RIGHT : LINE_RIGHT;
  const y = v.jumps.length > 0 ? 110 : 40;
  const x = linear([v.from, v.to], [LINE_LEFT, right]);
  const parts = [
    el("line", { x1: LINE_LEFT - 20, y1: y, x2: right + 20, y2: y, stroke: COLORS.ink, "stroke-width": 3 }),
    arrowhead(LINE_LEFT - 28, y, -1),
    arrowhead(right + 28, y, 1),
  ];

  const reach = Math.min(30, x(v.from + v.tick) - x(v.from));
  /** Taps for every tick, laid over the line at the end, so nothing covers them. */
  const taps = [];
  for (let at = v.from; at <= v.to; at += v.tick) {
    taps.push(hit(`tick-${at}`, positionLabel(at, v.den), { x: x(at) - reach / 2, y: y - 22, width: reach, height: 44 }));
    const labelled = at % v.label === 0;
    const half = labelled ? 13 : 8;
    parts.push(el("line", { x1: x(at), y1: y - half, x2: x(at), y2: y + half, stroke: COLORS.ink, "stroke-width": labelled ? 3 : 2, class: "tick", "data-at": at }));
    if (labelled) {
      parts.push(text({ x: x(at), y: y + 36, "font-size": 20, "font-weight": 600, "text-anchor": "middle", class: "tick-label" }, positionLabel(at, v.den)));
    }
  }

  for (const [j, [from, to]] of v.jumps.entries()) {
    const [x1, x2] = [x(from), x(to)];
    const rise = Math.min(70, Math.abs(x2 - x1) / 2 + 12);
    const top = y - 6 - rise;
    const way = to > from ? 1 : -1;
    parts.push(
      el("path", { d: `M ${x1} ${y - 6} Q ${(x1 + x2) / 2} ${y - 6 - 2 * rise} ${x2} ${y - 6}`, fill: "none", stroke: COLORS.accent, "stroke-width": 3.5, class: "jump", "data-from": from, "data-to": to, "data-marks": `jump-${j}` }),
      el("path", { d: `M ${x2} ${y - 4} l ${-way * 3} -13 l ${way * 11} 5 z`, fill: COLORS.accent }),
      text({ x: (x1 + x2) / 2, y: top - 10, "font-size": 20, "font-weight": 700, fill: COLORS.accent, "text-anchor": "middle" },
        `${way > 0 ? "+" : "−"}${positionLabel(Math.abs(to - from), v.den)}`),
    );
  }

  for (const at of v.points) {
    parts.push(el("circle", { cx: x(at), cy: y, r: 8, fill: COLORS.point, stroke: COLORS.paper, "stroke-width": 2, class: "point", "data-at": at, "data-marks": `point-${at}` }));
  }
  parts.push(...taps);

  return svg("number_line", right + LINE_LEFT, y + 52, describeVisual(v), parts);
}
