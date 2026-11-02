// Solid shapes, drawn with a little depth and their hidden edges dashed; and
// a scene of one thing placed somewhere around another, to say where it is.

import { svg, el, text, COLORS, num } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { Solid, Scene } from "../questions/common.js" */

/** Three shades of the same blue, for faces lit from above and the left. */
const FACE = { top: "#dbeafe", front: "#bfdbfe", side: "#93c5fd" };

/** @param {number[][]} corners */
const points = corners => corners.map(([x, y]) => `${num(x)},${num(y)}`).join(" ");

/**
 * @param {number[][]} corners
 * @param {string} fill
 */
const face = (corners, fill) => el("polygon", { points: points(corners), fill, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round", class: "face" });

/**
 * An edge behind the shape, dashed.
 * @param {number[]} from
 * @param {number[]} to
 */
const hidden = ([x1, y1], [x2, y2]) => el("line", { x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2), stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", opacity: 0.7, class: "hidden-edge" });

/**
 * A box: a front, a top and a right side, with its hidden edges dashed.
 * @param {number} left
 * @param {number} top
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
function box(left, top, width, height, depth) {
  const [dx, dy] = [depth, -depth * 0.85];
  const [a, b, c, d] = [[left, top], [left + width, top], [left + width, top + height], [left, top + height]];
  const back = (/** @type {number[]} */ [x, y]) => [x + dx, y + dy];
  // Hidden edges go last, dashed over the faces, as if seen through them.
  return [
    face([a, b, back(b), back(a)], FACE.top),
    face([b, c, back(c), back(b)], FACE.side),
    face([a, b, c, d], FACE.front),
    hidden(back(d), back(a)), hidden(back(d), back(c)), hidden(back(d), d),
  ];
}

/**
 * A solid shape.
 * @param {Solid} v
 */
export function solid(v) {
  /** @type {string[]} */
  let parts;
  switch (v.solid) {
    case "cube":
      parts = box(45, 80, 100, 100, 40);
      break;
    case "box":
      parts = box(25, 95, 140, 80, 38);
      break;
    case "sphere":
      parts = [
        el("circle", { cx: 110, cy: 110, r: 82, fill: FACE.front, stroke: COLORS.ink, "stroke-width": 3 }),
        el("path", { d: "M 28 110 A 82 24 0 0 1 192 110", fill: "none", stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", opacity: 0.6 }),
        el("path", { d: "M 28 110 A 82 24 0 0 0 192 110", fill: "none", stroke: COLORS.ink, "stroke-width": 2, opacity: 0.6 }),
        el("ellipse", { cx: 82, cy: 78, rx: 22, ry: 14, fill: COLORS.paper, opacity: 0.6 }),
      ];
      break;
    case "cylinder":
      parts = [
        el("path", { d: "M 50 55 L 50 170 A 60 18 0 0 0 170 170 L 170 55 Z", fill: FACE.front, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round" }),
        el("path", { d: "M 50 170 A 60 18 0 0 1 170 170", fill: "none", stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", opacity: 0.7 }),
        el("ellipse", { cx: 110, cy: 55, rx: 60, ry: 18, fill: FACE.top, stroke: COLORS.ink, "stroke-width": 3 }),
      ];
      break;
    case "cone":
      parts = [
        el("path", { d: "M 110 25 L 45 172 A 65 20 0 0 0 175 172 Z", fill: FACE.front, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round" }),
        el("path", { d: "M 45 172 A 65 20 0 0 1 175 172", fill: "none", stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", opacity: 0.7 }),
      ];
      break;
    default: {
      // A pyramid on a square base: two faces at the front, the rest hidden.
      const [a, b, c, d, apex] = [[40, 175], [150, 175], [185, 140], [75, 140], [110, 30]];
      parts = [face([apex, a, b], FACE.front), face([apex, b, c], FACE.side), hidden(d, apex), hidden(a, d), hidden(d, c)];
    }
  }
  return svg("solid", 220, 210, describeVisual(v), [el("g", { class: "solid", "data-solid": v.solid }, ...parts)]);
}

/** What the things in a scene look like. */
export const SCENE_THINGS = { cat: "🐱", dog: "🐶", bunny: "🐰", ball: "⚽", bear: "🧸" };
export const SCENE_LANDMARKS = { box: "📦", chair: "🪑", basket: "🧺" };

/**
 * Where a thing goes around the landmark in the middle: above, below, next
 * to it, in front (drawn after, lower down and overlapping it) or behind
 * (drawn before, its top half peeking out over the landmark).
 */
const PLACES = {
  above: { x: 160, y: 42 },
  below: { x: 160, y: 238 },
  "next to": { x: 268, y: 150 },
  "in front of": { x: 186, y: 176 },
  behind: { x: 176, y: 86 },
};

/**
 * One thing placed around another.
 * @param {Scene} v
 */
export function scene(v) {
  const landmark = text({ x: 160, y: 140, "font-size": 104, "text-anchor": "middle", "dominant-baseline": "central", class: "landmark" }, SCENE_LANDMARKS[v.landmark]);
  const { x, y } = PLACES[v.place];
  const thing = text({ x, y, "font-size": v.place === "behind" ? 58 : 62, "text-anchor": "middle", "dominant-baseline": "central", class: "thing", "data-place": v.place }, SCENE_THINGS[v.thing]);
  // Behind goes first, so the landmark covers part of it.
  return svg("scene", 330, 280, describeVisual(v), v.place === "behind" ? [thing, landmark] : [landmark, thing]);
}
