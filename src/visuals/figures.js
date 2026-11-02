// Geometry figures: lines, rays and segments (4.G.1), nets that fold into
// solids (6.G.4), shapes put together from smaller ones (K.G.6, 1.G.2), and
// L-shapes made of two rectangles (3.MD.7d).

import { svg, el, text, COLORS, num } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { Lines, Net, Composite, Compose } from "../questions/common.js" */

/** @param {number[][]} corners */
const points = corners => corners.map(([x, y]) => `${num(x)},${num(y)}`).join(" ");

/**
 * A straight path from one point to another, ending in an arrowhead (it goes
 * on forever) or a dot (it stops there).
 * @param {number[]} from
 * @param {number[]} to
 * @param {"arrow" | "dot"} start
 * @param {"arrow" | "dot"} end
 */
function straight([x1, y1], [x2, y2], start, end) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const [dx, dy] = [(x2 - x1) / length, (y2 - y1) / length];
  /** @param {number[]} tip @param {number} sign  which way the end points @param {"arrow" | "dot"} kind */
  const cap = ([x, y], sign, kind) => kind === "dot"
    ? el("circle", { cx: num(x), cy: num(y), r: 6, fill: COLORS.ink, class: "end-dot" })
    : el("polygon", { points: points([[x, y], [x - sign * 16 * dx - 7 * dy, y - sign * 16 * dy + 7 * dx], [x - sign * 16 * dx + 7 * dy, y - sign * 16 * dy - 7 * dx]]), fill: COLORS.ink, class: "end-arrow" });
  return [
    el("line", { x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2), stroke: COLORS.ink, "stroke-width": 4, "stroke-linecap": "round", class: "straight", "data-start": start, "data-end": end }),
    cap([x1, y1], -1, start),
    cap([x2, y2], 1, end),
  ];
}

/**
 * A line, ray or segment, or two lines that are parallel, perpendicular or
 * just crossing, tilted by `turn` degrees.
 * @param {Lines} v
 */
export function lines(v) {
  const [cx, cy, half, apart] = [150, 130, 95, 36];
  /** @param {number} degrees */
  const way = degrees => [Math.cos((degrees * Math.PI) / 180), -Math.sin((degrees * Math.PI) / 180)];
  const [dx, dy] = way(v.turn);
  /** A path through a point, along a direction. @param {number[]} c @param {number[]} d */
  const through = ([x, y], [ux, uy], start = /** @type {"arrow" | "dot"} */ ("arrow"), end = /** @type {"arrow" | "dot"} */ ("arrow")) =>
    straight([x - half * ux, y - half * uy], [x + half * ux, y + half * uy], start, end);
  /** @type {string[]} */
  let body;
  switch (v.figure) {
    case "line": body = through([cx, cy], [dx, dy]); break;
    case "ray": body = through([cx, cy], [dx, dy], "dot", "arrow"); break;
    case "segment": body = through([cx, cy], [dx, dy], "dot", "dot"); break;
    case "parallel": body = [...through([cx - apart * dy, cy + apart * dx], [dx, dy]), ...through([cx + apart * dy, cy - apart * dx], [dx, dy])]; break;
    default: {
      // Perpendicular lines cross at a right angle, marked with a square; others cross at a slant.
      const other = way(v.turn + (v.figure === "perpendicular" ? 90 : v.cross ?? 55));
      body = [...through([cx, cy], [dx, dy]), ...through([cx, cy], other)];
      if (v.figure === "perpendicular") {
        const s = 16;
        body.push(el("polyline", { points: points([[cx + s * dx, cy + s * dy], [cx + s * (dx + other[0]), cy + s * (dy + other[1])], [cx + s * other[0], cy + s * other[1]]]), fill: "none", stroke: COLORS.ink, "stroke-width": 2, class: "right-angle" }));
      }
    }
  }
  return svg("lines", 300, 260, describeVisual(v), body);
}

/**
 * The net of a box or cube (drawn to scale, a cross of six rectangles), a
 * triangular prism, or a square pyramid.
 * @param {Net} v
 */
export function net(v) {
  const look = { fill: COLORS.fill, stroke: COLORS.ink, "stroke-width": 2.5, "stroke-linejoin": "round", class: "face" };
  /** @param {number[][]} corners */
  const face = corners => el("polygon", { points: points(corners), ...look });
  /** @param {number} x @param {number} y @param {number} w @param {number} h */
  const box = (x, y, w, h) => face([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  /** @param {number} x @param {number} y @param {string} words @param {string} [anchor] */
  const label = (x, y, words, anchor = "middle") => text({ x: num(x), y: num(y), "font-size": 18, "font-weight": 700, "text-anchor": anchor, "dominant-baseline": "central", fill: COLORS.ink, class: "edge-label" }, words);

  if (v.solid === "box" || v.solid === "cube") {
    const [l, w, h] = [v.length, v.width, v.height];
    const s = Math.min(380 / (2 * (l + w)), 230 / (h + 2 * w));
    const [x0, y0] = [70, 14];
    // A row of four sides, with the top above the front and the bottom below it.
    const row = y0 + w * s;
    const xs = [0, w, w + l, 2 * w + l].map(u => x0 + u * s);
    const body = [
      ...[w, l, w, l].map((across, i) => box(xs[i], row, across * s, h * s)),
      box(xs[1], y0, l * s, w * s),
      box(xs[1], row + h * s, l * s, w * s),
    ];
    if (v.labels) {
      body.push(
        label(xs[1] + (l * s) / 2, row + (h + w) * s + 18, v.labels.length),
        label(xs[0] + (w * s) / 2, row + h * s + 18, v.labels.width),
        label(xs[0] - 10, row + (h * s) / 2, v.labels.height, "end"),
      );
    }
    return svg("net", x0 + 2 * (l + w) * s + 12, y0 + (h + 2 * w) * s + 36, describeVisual(v), body);
  }

  if (v.solid === "triangular prism") {
    const [a, tall, x0] = [80, 120, 30];
    const rise = (a * Math.sqrt(3)) / 2;
    const top = 12 + rise;
    const body = [
      ...[0, 1, 2].map(i => box(x0 + i * a, top, a, tall)),
      face([[x0 + a, top], [x0 + 2 * a, top], [x0 + 1.5 * a, top - rise]]),
      face([[x0 + a, top + tall], [x0 + 2 * a, top + tall], [x0 + 1.5 * a, top + tall + rise]]),
    ];
    return svg("net", 2 * x0 + 3 * a, top + tall + rise + 12, describeVisual(v), body);
  }

  // A square pyramid: the square base, with a triangle on each side.
  const [side, rise] = [90, 70];
  const [x, y] = [12 + rise, 12 + rise];
  const [r, b] = [x + side, y + side];
  const body = [
    box(x, y, side, side),
    face([[x, y], [r, y], [x + side / 2, y - rise]]),
    face([[r, y], [r, b], [r + rise, y + side / 2]]),
    face([[x, b], [r, b], [x + side / 2, b + rise]]),
    face([[x, y], [x, b], [x - rise, y + side / 2]]),
  ];
  return svg("net", 2 * (12 + rise) + side, 2 * (12 + rise) + side, describeVisual(v), body);
}

/**
 * Shapes put together to make a bigger one (K.G.6, 1.G.2), each part a
 * polygon or a half circle, in [x, y] points or a path.
 * @type {Record<Compose["figure"], (number[][] | string)[]>}
 */
export const COMPOSED = {
  triangles: [[[50, 20], [210, 20], [50, 180]], [[210, 20], [210, 180], [50, 180]]],
  squares: [[[20, 40], [140, 40], [140, 160], [20, 160]], [[140, 40], [260, 40], [260, 160], [140, 160]]],
  rectangles: [[[60, 20], [140, 20], [140, 180], [60, 180]], [[140, 20], [220, 20], [220, 180], [140, 180]]],
  "four squares": [[[60, 20], [140, 20], [140, 100], [60, 100]], [[140, 20], [220, 20], [220, 100], [140, 100]], [[60, 100], [140, 100], [140, 180], [60, 180]], [[140, 100], [220, 100], [220, 180], [140, 180]]],
  "half-circles": ["M 60 100 A 80 80 0 0 1 220 100 Z", "M 60 100 A 80 80 0 0 0 220 100 Z"],
  house: [[[90, 85], [190, 85], [190, 185], [90, 185]], [[90, 85], [190, 85], [140, 15]]],
  trapezoids: [[[50, 100], [95, 22], [185, 22], [230, 100]], [[50, 100], [230, 100], [185, 178], [95, 178]]],
  "three triangles": [[[25, 175], [135, 175], [80, 80]], [[80, 80], [190, 80], [135, 175]], [[135, 175], [245, 175], [190, 80]]],
};

/**
 * A shape made of smaller ones, each part in its own color, so the joins
 * show.
 * @param {Compose} v
 */
export function compose(v) {
  const fills = [COLORS.fill, "#fde68a"];
  const body = COMPOSED[v.figure].map((part, i) => {
    const look = { fill: fills[i % 2], stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round", class: "part" };
    return typeof part === "string" ? el("path", { d: part, ...look }) : el("polygon", { points: points(part), ...look });
  });
  return svg("compose", 280, 200, describeVisual(v), body);
}

/**
 * An L-shape: a rectangle with a corner cut from its top right, four of its
 * sides labelled, and perhaps a dashed line cutting it into two rectangles.
 * @param {Composite} v
 */
export function composite(v) {
  const [W, H] = [v.width, v.height];
  const [nw, nh] = v.notch;
  const s = Math.min(36, 300 / W, 190 / H);
  const [x0, y0] = [76, 34];
  /** @param {number} x @param {number} y */
  const at = (x, y) => [x0 + x * s, y0 + y * s];
  const corners = [at(0, 0), at(W - nw, 0), at(W - nw, nh), at(W, nh), at(W, H), at(0, H)];
  /** @param {number[]} p @param {string} words @param {string} anchor */
  const label = ([x, y], words, anchor) => text({ x: num(x), y: num(y), "font-size": 18, "font-weight": 700, "text-anchor": anchor, "dominant-baseline": "central", fill: COLORS.ink, class: "side-label" }, words);
  const body = [el("polygon", { points: points(corners), fill: COLORS.fill, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round", class: "figure" })];
  if (v.split) {
    const [[x1, y1], [x2, y2]] = [at(W - nw, nh), at(W - nw, H)];
    body.push(el("line", { x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2), stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", class: "split" }));
  }
  const [topMid, leftMid, bottomMid, rightMid] = [at((W - nw) / 2, 0), at(0, H / 2), at(W / 2, H), at(W, (nh + H) / 2)];
  body.push(
    label([topMid[0], topMid[1] - 16], v.labels.top, "middle"),
    label([leftMid[0] - 10, leftMid[1]], v.labels.left, "end"),
    label([bottomMid[0], bottomMid[1] + 18], v.labels.bottom, "middle"),
    label([rightMid[0] + 10, rightMid[1]], v.labels.right, "start"),
  );
  return svg("composite", x0 + W * s + 86, y0 + H * s + 40, describeVisual(v), body);
}
