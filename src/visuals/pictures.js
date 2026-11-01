// The visuals the questions started with: counters, patterns, money, clocks
// and shapes.

import { svg, el, text, COLORS, num } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { Visual } from "../questions/common.js" */

const CELL = 50;

/**
 * Counters in rows of five, the way ten frames group them.
 * @param {Extract<Visual, { kind: "objects" }>} v
 */
export function objects(v) {
  const perRow = 5;
  const rows = Math.ceil(v.count / perRow);
  const counters = Array.from({ length: v.count }, (_, i) => text({
    x: 8 + (i % perRow) * CELL + CELL / 2,
    y: 8 + Math.floor(i / perRow) * CELL + CELL / 2,
    "font-size": 34,
    "text-anchor": "middle",
    "dominant-baseline": "central",
    class: "counter",
  }, v.emoji));
  return svg("objects", perRow * CELL + 16, rows * CELL + 16, describeVisual(v), counters);
}

/**
 * A row of pictures, with a dashed box where one is missing.
 * @param {Extract<Visual, { kind: "pattern" }>} v
 */
export function pattern(v) {
  const cells = v.items.map((item, i) => {
    const x = 8 + i * CELL;
    if (item !== null) {
      return text({ x: x + CELL / 2, y: 8 + CELL / 2, "font-size": 32, "text-anchor": "middle", "dominant-baseline": "central" }, item);
    }
    return el("g", { class: "gap" },
      el("rect", { x: x + 4, y: 12, width: CELL - 8, height: CELL - 8, rx: 8, fill: COLORS.paper, stroke: COLORS.accent, "stroke-width": 3, "stroke-dasharray": "6 4" }),
      text({ x: x + CELL / 2, y: 8 + CELL / 2, "font-size": 26, "font-weight": 700, fill: COLORS.accent, "text-anchor": "middle", "dominant-baseline": "central" }, "?"));
  });
  return svg("pattern", v.items.length * CELL + 16, CELL + 16, describeVisual(v), cells);
}

/** How coins look: sizes in proportion to the real ones, and their name stamped on. */
const COINS = {
  penny: { r: 21, fill: "#d9935f", stroke: "#8a4b22" },
  nickel: { r: 23.5, fill: "#d1d5db", stroke: "#4b5563" },
  dime: { r: 19.5, fill: "#e5e7eb", stroke: "#4b5563" },
  quarter: { r: 27, fill: "#cbd5e1", stroke: "#475569" },
};
const BILLS = { dollar: "$1", five: "$5", ten: "$10" };
const BILL = { width: 112, height: 54 };

/**
 * Coins and bills in a row, wrapping onto more rows if they need to. The
 * picture is only as wide as the money in it (but at least 300), so a bill
 * and a coin fill the space a child sees instead of sitting in one corner of it.
 * @param {Extract<Visual, { kind: "money" }>} v
 */
export function money(v) {
  const most = 560;
  const rowHeight = 66;
  const gap = 12;
  /** Where each piece goes, row by row. */
  const placed = [];
  let x = 0;
  let row = 0;
  for (const id of v.items) {
    const coin = COINS[/** @type {keyof typeof COINS} */ (id)];
    const w = coin ? 2 * coin.r : BILL.width;
    if (x > 0 && x + w > most - 16) {
      x = 0;
      row++;
    }
    placed.push({ id, coin, x, row });
    x += w + gap;
  }
  const used = Math.max(...placed.map(p => p.x + (p.coin ? 2 * p.coin.r : BILL.width)));
  const width = Math.max(300, used + 16);
  const left = (width - used) / 2;
  const pieces = [];
  for (const { id, coin, x: at, row: r } of placed) {
    const x = left + at;
    const cy = 8 + r * rowHeight + rowHeight / 2;
    if (coin) {
      pieces.push(el("g", { class: "money", "data-id": id },
        el("circle", { cx: x + coin.r, cy, r: coin.r, fill: coin.fill, stroke: coin.stroke, "stroke-width": 2.5 }),
        el("circle", { cx: x + coin.r, cy, r: coin.r - 4, fill: "none", stroke: coin.stroke, "stroke-width": 1, opacity: 0.6 }),
        text({ x: x + coin.r, y: cy, "font-size": id === "quarter" ? 10.5 : id === "dime" ? 10 : 10.5, "font-weight": 800, fill: coin.stroke, "text-anchor": "middle", "dominant-baseline": "central", "textLength": id === "dime" ? undefined : 2 * coin.r - 10, lengthAdjust: "spacingAndGlyphs" }, id.toUpperCase())));
    } else {
      const top = cy - BILL.height / 2;
      pieces.push(el("g", { class: "money", "data-id": id },
        el("rect", { x, y: top, width: BILL.width, height: BILL.height, rx: 4, fill: "#bbf7d0", stroke: "#15803d", "stroke-width": 2.5 }),
        el("rect", { x: x + 6, y: top + 6, width: BILL.width - 12, height: BILL.height - 12, rx: 3, fill: "none", stroke: "#15803d", "stroke-width": 1, opacity: 0.6 }),
        text({ x: x + BILL.width / 2, y: cy, "font-size": 24, "font-weight": 700, fill: "#14532d", "text-anchor": "middle", "dominant-baseline": "central" }, BILLS[/** @type {keyof typeof BILLS} */ (id)])));
    }
  }
  return svg("money", width, 16 + (row + 1) * rowHeight, describeVisual(v), pieces);
}

/**
 * A clock face with both hands. The hour hand moves on between the hours, as
 * a real one does: at 2:50 it is nearly at 3.
 * @param {Extract<Visual, { kind: "clock" }>} v
 */
export function clock(v) {
  const c = 110;
  const r = 100;
  /** @param {number} radius @param {number} degrees */
  const at = (radius, degrees) => {
    const rad = (degrees * Math.PI) / 180;
    return [c + radius * Math.sin(rad), c - radius * Math.cos(rad)];
  };
  const parts = [el("circle", { cx: c, cy: c, r, fill: COLORS.paper, stroke: COLORS.ink, "stroke-width": 5 })];
  for (let m = 0; m < 60; m++) {
    const [x1, y1] = at(m % 5 === 0 ? r - 13 : r - 7, m * 6);
    const [x2, y2] = at(r - 3, m * 6);
    parts.push(el("line", { x1, y1, x2, y2, stroke: COLORS.ink, "stroke-width": m % 5 === 0 ? 3 : 1.5 }));
  }
  for (let h = 1; h <= 12; h++) {
    const [x, y] = at(r - 28, h * 30);
    parts.push(text({ x, y, "font-size": 20, "font-weight": 600, "text-anchor": "middle", "dominant-baseline": "central" }, h));
  }
  const hand = (/** @type {string} */ name, /** @type {number} */ degrees, /** @type {number} */ length, /** @type {number} */ width) => {
    const [x2, y2] = at(length, degrees);
    return el("line", { x1: c, y1: c, x2, y2, stroke: COLORS.ink, "stroke-width": width, "stroke-linecap": "round", class: "hand", "data-hand": name, "data-angle": num(degrees) });
  };
  parts.push(
    hand("hour", ((v.hours % 12) + v.minutes / 60) * 30, 52, 8),
    hand("minute", v.minutes * 6, 80, 5),
    el("circle", { cx: c, cy: c, r: 6, fill: COLORS.ink }),
  );
  return svg("clock", 2 * c, 2 * c, describeVisual(v), parts);
}

/**
 * The corners of a regular polygon, centred on (100, cy), flat along the bottom.
 * @param {number} sides
 * @param {number} [cy]
 */
function regular(sides, cy = 100) {
  const turn = sides % 2 === 0 ? 180 / sides : 0;
  return Array.from({ length: sides }, (_, i) => {
    const rad = ((-90 + turn + (i * 360) / sides) * Math.PI) / 180;
    return [100 + 84 * Math.cos(rad), cy + 84 * Math.sin(rad)];
  });
}

/**
 * Each shape's corners, drawn as src/questions/shapes.js describes it: the
 * triangle equilateral, the trapezoid isosceles, the rhombus not a square.
 * @type {Record<string, number[][]>}
 */
export const SHAPE_CORNERS = {
  triangle: regular(3, 112),
  square: [[35, 35], [165, 35], [165, 165], [35, 165]],
  rectangle: [[15, 50], [185, 50], [185, 150], [15, 150]],
  rhombus: [[100, 20], [160, 100], [100, 180], [40, 100]],
  trapezoid: [[55, 55], [145, 55], [185, 150], [15, 150]],
  pentagon: regular(5, 106),
  hexagon: regular(6),
  octagon: regular(8),
};

/**
 * @param {Extract<Visual, { kind: "shape" }>} v
 */
export function shape(v) {
  const look = { fill: COLORS.fill, stroke: COLORS.ink, "stroke-width": 4, "stroke-linejoin": "round", class: "shape", "data-shape": v.shape };
  const body = v.shape === "circle"
    ? el("circle", { cx: 100, cy: 100, r: 82, ...look })
    : el("polygon", { points: SHAPE_CORNERS[v.shape].map(([x, y]) => `${num(x)},${num(y)}`).join(" "), ...look });
  return svg("shape", 200, 200, describeVisual(v), [body]);
}
