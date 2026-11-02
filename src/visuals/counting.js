// Pictures for early number work: ten frames, with counters filling the top
// row first, as children fill them; and base-ten blocks, hundreds as flats,
// tens as rods and ones as cubes.

import { svg, el, COLORS } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { TenFrame, BaseTen } from "../questions/common.js" */

/**
 * One or two ten frames side by side, counters filling the first before the second.
 * @param {TenFrame} v
 */
export function tenFrame(v) {
  const cell = 52;
  const pad = 10;
  const gap = 24;
  const parts = [];
  for (let f = 0; f < v.frames; f++) {
    const left = pad + f * (5 * cell + gap);
    parts.push(el("rect", { x: left, y: pad, width: 5 * cell, height: 2 * cell, fill: COLORS.paper, stroke: COLORS.ink, "stroke-width": 3, rx: 4, class: "frame", "data-part": `frame-${f}`, "aria-label": f === 0 ? "the first frame" : "the second frame" }));
    for (let i = 1; i < 5; i++) parts.push(el("line", { x1: left + i * cell, y1: pad, x2: left + i * cell, y2: pad + 2 * cell, stroke: COLORS.ink, "stroke-width": 2 }));
    parts.push(el("line", { x1: left, y1: pad + cell, x2: left + 5 * cell, y2: pad + cell, stroke: COLORS.ink, "stroke-width": 2 }));
    const here = Math.max(0, Math.min(10, v.filled - 10 * f));
    for (let i = 0; i < here; i++) {
      const [col, row] = [i % 5, Math.floor(i / 5)];
      parts.push(el("circle", { cx: left + (col + 0.5) * cell, cy: pad + (row + 0.5) * cell, r: 18, fill: COLORS.point, stroke: COLORS.ink, "stroke-width": 2, class: "counter", "pointer-events": "none" }));
    }
  }
  if (v.focus !== undefined) {
    const left = pad + v.focus * (5 * cell + gap);
    parts.push(el("rect", { x: left - 6, y: pad - 6, width: 5 * cell + 12, height: 2 * cell + 12, rx: 8, fill: "none", stroke: COLORS.accent, "stroke-width": 6, class: "focus", "pointer-events": "none" }));
  }
  return svg("ten_frame", 2 * pad + v.frames * 5 * cell + (v.frames - 1) * gap, 2 * pad + 2 * cell, describeVisual(v), parts);
}

/**
 * Base-ten blocks, left to right: flats for hundreds (five to a row), rods for
 * tens, and cubes for ones in columns of five. Every block is drawn with its
 * unit squares, so it can be counted.
 * @param {BaseTen} v
 */
export function baseTen(v) {
  const pad = 10;
  const flatsAcross = Math.min(v.hundreds, 5);
  const flatRows = Math.ceil(v.hundreds / 5);
  const onesCols = Math.ceil(v.ones / 5);
  // A unit's size, so the blocks fit 560 across.
  const units = flatsAcross * 10.6 + v.tens * 1.5 + onesCols * 1.5 + (v.hundreds && v.tens ? 1 : 0) + ((v.hundreds || v.tens) && v.ones ? 1 : 0);
  const u = Math.min(14, (560 - 2 * pad) / Math.max(units, 1));
  /** @type {string[]} */
  const parts = [];
  /** A block of unit squares: w by h units, at x, y. */
  const block = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, /** @type {string} */ name, /** @type {string} */ fill) => {
    parts.push(el("rect", { x, y, width: w * u, height: h * u, fill, stroke: COLORS.ink, "stroke-width": 2, class: name }));
    for (let i = 1; i < w; i++) parts.push(el("line", { x1: x + i * u, y1: y, x2: x + i * u, y2: y + h * u, stroke: COLORS.ink, "stroke-width": 0.75, opacity: 0.6 }));
    for (let j = 1; j < h; j++) parts.push(el("line", { x1: x, y1: y + j * u, x2: x + w * u, y2: y + j * u, stroke: COLORS.ink, "stroke-width": 0.75, opacity: 0.6 }));
  };
  let x = pad;
  for (let i = 0; i < v.hundreds; i++) block(pad + (i % 5) * 10.6 * u, pad + Math.floor(i / 5) * 10.6 * u, 10, 10, "flat", "#bfdbfe");
  if (v.hundreds) x += flatsAcross * 10.6 * u + u;
  for (let i = 0; i < v.tens; i++) block(x + i * 1.5 * u, pad, 1, 10, "rod", "#bbf7d0");
  if (v.tens) x += v.tens * 1.5 * u + u;
  for (let i = 0; i < v.ones; i++) block(x + Math.floor(i / 5) * 1.5 * u, pad + (9 - (i % 5) * 1.5) * u, 1, 1, "unit", "#fde68a");
  if (v.ones) x += onesCols * 1.5 * u;
  const height = Math.max(1, flatRows) * 10.6 * u;
  return svg("base_ten", Math.max(x + pad, 120), 2 * pad + height, describeVisual(v), parts);
}
