// Figures to measure: areas and perimeters, boxes of unit cubes, angles on
// protractors, and coordinate grids. Each is drawn to scale.

import { svg, el, text, COLORS, num, hit } from "./svg.js";
import { describeVisual } from "./describe.js";

/** @import { AreaFigure, CubeBox, AngleFigure, CoordinateGrid, Lengths } from "../questions/common.js" */

/** @param {number[][]} corners */
function points(corners) {
  return corners.map(([x, y]) => `${num(x)},${num(y)}`).join(" ");
}

/** @param {Record<string, string | number>} attrs  @param {string} content */
function label(attrs, content) {
  return text({ "font-size": 18, "font-weight": 700, class: "label", ...attrs }, content);
}

/**
 * A rectangle, triangle or parallelogram. A triangle's top corner sits over
 * a third of the way along its base, and a parallelogram's top is pushed
 * along by a third of its base, so neither has a side that is its height:
 * the height is dashed in, square to the base.
 * @param {AreaFigure} v
 */
export function area(v) {
  const room = { width: 420, height: 250 };
  const shift = v.shape === "parallelogram" ? 1 / 3 : 0;
  const cell = Math.min(40, (room.width - 120) / (v.width * (1 + shift)), (room.height - 60) / v.height);
  const [base, h] = [v.width * cell, v.height * cell];
  const left = (room.width - base * (1 + shift)) / 2 + (v.labels && v.shape === "rectangle" ? 20 : 0);
  const top = 16;
  const bottom = top + h;
  const look = { fill: COLORS.fill, stroke: COLORS.ink, "stroke-width": 3, "stroke-linejoin": "round", class: "figure", "data-width": v.width, "data-height": v.height };
  const parts = [];
  /** Where the height is dashed in, for a triangle or parallelogram. */
  const heightX = left + base / 3;

  if (v.shape === "rectangle") {
    parts.push(el("rect", { x: left, y: top, width: base, height: h, ...look }));
    if (v.grid) {
      for (let i = 0; i < v.width; i++) {
        for (let j = 0; j < v.height; j++) {
          parts.push(el("rect", { x: left + i * cell, y: top + j * cell, width: cell, height: cell, fill: "none", stroke: COLORS.accent, "stroke-width": 1.5, class: "cell", "data-marks": `row-${j} column-${i} cell-${i}-${j}` }));
        }
      }
      parts.push(el("rect", { x: left, y: top, width: base, height: h, fill: "none", stroke: COLORS.ink, "stroke-width": 3, "pointer-events": "none" }));
      // Each row, to tap in a teaching scene: an array's rows.
      for (let j = 0; j < v.height; j++) parts.push(hit(`row-${j}`, `row ${j + 1}`, { x: left, y: top + j * cell, width: base, height: cell }));
    } else {
      // Each side, to tap in a teaching scene: the one to find, or the ones to add.
      const strip = 18;
      parts.push(
        hit("side-top", "the top side", { x: left, y: top - strip / 2, width: base, height: strip }),
        hit("side-right", "the right side", { x: left + base - strip / 2, y: top, width: strip, height: h }),
        hit("side-bottom", "the bottom side", { x: left, y: bottom - strip / 2, width: base, height: strip }),
        hit("side-left", "the left side", { x: left - strip / 2, y: top, width: strip, height: h }),
      );
    }
  } else {
    const corners = v.shape === "triangle"
      ? [[left, bottom], [left + base, bottom], [heightX, top]]
      : [[left, bottom], [left + base, bottom], [left + base + base / 3, top], [heightX, top]];
    parts.push(
      el("polygon", { points: points(corners), ...look }),
      el("line", { x1: heightX, y1: top, x2: heightX, y2: bottom, stroke: COLORS.ink, "stroke-width": 2, "stroke-dasharray": "6 5", class: "height" }),
      el("path", { d: `M ${num(heightX)} ${num(bottom - 12)} h 12 v 12`, fill: "none", stroke: COLORS.ink, "stroke-width": 1.5 }),
    );
  }

  if (v.labels) {
    parts.push(
      label({ x: left + base / 2, y: bottom + 28, "text-anchor": "middle" }, v.labels.base),
      v.shape === "rectangle"
        ? label({ x: left - 12, y: top + h / 2, "text-anchor": "end", "dominant-baseline": "central" }, v.labels.height)
        : label({ x: heightX + 10, y: top + h / 2 + 6, "dominant-baseline": "central" }, v.labels.height),
    );
  }
  return svg("area", room.width, bottom + (v.labels ? 42 : 16), describeVisual(v), parts);
}

/**
 * A box drawn with a little depth: its front, top and right side, split into
 * unit cubes or labelled along three edges. Going back one unit moves 0.6 of
 * a unit right and 0.5 up.
 * @param {CubeBox} v
 */
export function cubes(v) {
  const cell = Math.min(36, 250 / (v.length + v.width * 0.6), 190 / (v.height + v.width * 0.5));
  const back = { x: cell * 0.6, y: cell * 0.5 };
  const [L, H] = [v.length * cell, v.height * cell];
  const [W, D] = [v.width * back.x, v.width * back.y];
  // Room on the left for the height's label, about 10 pixels a letter.
  const left = 24 + (v.labels ? 10 * v.labels.height.length : 0);
  const top = 16 + D;
  const parts = [];
  /**
   * One face, from a corner along two edges, `across` units along the first
   * and `up` along the second, with its unit squares if it is made of cubes.
   * @param {number[]} corner
   * @param {number[]} a  one unit along the first edge
   * @param {number[]} b  one unit along the second
   * @param {number} across
   * @param {number} up
   * @param {string} fill
   * @param {string} name
   */
  const face = (corner, a, b, across, up, fill, name) => {
    /** @param {number} i  @param {number} j */
    const at = (i, j) => [corner[0] + a[0] * i + b[0] * j, corner[1] + a[1] * i + b[1] * j];
    parts.push(el("polygon", { points: points([at(0, 0), at(across, 0), at(across, up), at(0, up)]), fill, stroke: COLORS.ink, "stroke-width": 2.5, "stroke-linejoin": "round", class: `face face--${name}` }));
    if (!v.cubes) return;
    for (let i = 0; i < across; i++) {
      for (let j = 0; j < up; j++) {
        parts.push(el("polygon", { points: points([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]), fill: "none", stroke: COLORS.ink, "stroke-width": 1, opacity: 0.55, class: `cube cube--${name}` }));
      }
    }
  };
  face([left, top], [cell, 0], [0, cell], v.length, v.height, "#bfdbfe", "front");
  face([left, top], [cell, 0], [back.x, -back.y], v.length, v.width, "#dbeafe", "top");
  face([left + L, top], [back.x, -back.y], [0, cell], v.width, v.height, "#93c5fd", "side");

  if (v.labels) {
    parts.push(
      label({ x: left + L / 2, y: top + H + 26, "text-anchor": "middle" }, v.labels.length),
      label({ x: left - 10, y: top + H / 2, "text-anchor": "end", "dominant-baseline": "central" }, v.labels.height),
      label({ x: left + L + W / 2 + 10, y: top + H - D / 2 + 16 }, v.labels.width),
    );
  }
  return svg("cubes", left + L + W + 80, top + H + (v.labels ? 40 : 16), describeVisual(v), parts);
}

/**
 * An angle: a base ray, a ray turned up from it, and an arc between, or a
 * square corner for a right angle. A protractor has two scales, as a real one
 * does: the outer counts up from the right, the inner from the left, so a
 * child must read the one that starts at 0 on the base ray.
 * @param {AngleFigure} v
 */
export function angle(v) {
  const [cx, cy] = [210, 196];
  const r = v.protractor ? 170 : 150;
  /** A point `radius` from the vertex, `d` degrees anticlockwise from pointing right. */
  const at = (/** @type {number} */ d, /** @type {number} */ radius) => [cx + radius * Math.cos((d * Math.PI) / 180), cy - radius * Math.sin((d * Math.PI) / 180)];
  const parts = [];
  /** The scales' numbers go on top of the rays, ringed in the protractor's colour so they stay readable. */
  const numbers = [];

  if (v.protractor) {
    const paper = "#fef9c3";
    parts.push(el("path", { d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`, fill: paper, stroke: COLORS.line, "stroke-width": 2, class: "protractor" }));
    for (let d = 0; d <= 180; d += 5) {
      const [x1, y1] = at(d, r - (d % 10 === 0 ? 14 : 8));
      const [x2, y2] = at(d, r);
      parts.push(el("line", { x1, y1, x2, y2, stroke: COLORS.ink, "stroke-width": d % 10 === 0 ? 1.5 : 1 }));
      if (d % 10 === 0) {
        // The 0s and 180s are lifted a little, off the base line.
        const place = d === 0 ? 5 : d === 180 ? 175 : d;
        const [ox, oy] = at(place, r - 26);
        const [ix, iy] = at(place, r - 44);
        const halo = { stroke: paper, "stroke-width": 3, "paint-order": "stroke", "text-anchor": "middle", "dominant-baseline": "central" };
        numbers.push(
          text({ x: ox, y: oy, "font-size": 13, "font-weight": 700, ...halo, class: "outer" }, d),
          text({ x: ix, y: iy, "font-size": 11, fill: COLORS.muted, ...halo, class: "inner" }, 180 - d),
        );
      }
    }
  }

  const [from, to] = v.base === "right" ? [0, v.degrees] : [180, 180 - v.degrees];
  // On a protractor the rays run past the edge, as they would on paper.
  const reach = v.protractor ? r + 16 : r * 0.92;
  const ray = (/** @type {number} */ d) => {
    const [x2, y2] = at(d, reach);
    return el("line", { x1: cx, y1: cy, x2, y2, stroke: COLORS.accent, "stroke-width": 4, "stroke-linecap": "round", class: "ray", "data-angle": d });
  };
  let mark;
  if (v.degrees === 90) {
    const side = v.base === "right" ? 22 : -22;
    mark = el("path", { d: `M ${cx + side} ${cy} v -22 h ${-side}`, fill: "none", stroke: COLORS.point, "stroke-width": 2.5, class: "arc" });
  } else {
    // Anticlockwise from a base pointing right, clockwise from one pointing left.
    const [[x1, y1], [x2, y2]] = [at(from, 36), at(to, 36)];
    mark = el("path", { d: `M ${num(x1)} ${num(y1)} A 36 36 0 0 ${v.base === "right" ? 0 : 1} ${num(x2)} ${num(y2)}`, fill: "none", stroke: COLORS.point, "stroke-width": 2.5, class: "arc" });
  }
  parts.push(ray(from), ray(to), mark, ...numbers, el("circle", { cx, cy, r: 5, fill: COLORS.ink }));
  return svg("angle", 2 * cx, cy + 20, describeVisual(v), parts);
}

/** Ribbon colors, each named beside its ribbon too, so color isn't the only way to tell them apart. */
const RIBBONS = { red: "#ef4444", blue: "#3b82f6", green: "#16a34a", orange: "#f97316" };

/**
 * Ribbons to compare or measure, one above another, drawn to scale. Under
 * them, perhaps, a ruler, with dashed lines down from each ribbon's ends to
 * help read it; or cubes laid end to end along the first ribbon.
 * @param {Lengths} v
 */
export function lengths(v) {
  const left = 30;
  const unit = Math.min(44, 480 / v.span);
  const row = 46;
  const parts = [];
  v.ribbons.forEach((ribbon, i) => {
    const y = 16 + i * row;
    const [x, width] = [left + ribbon.from * unit, ribbon.length * unit];
    parts.push(
      el("rect", { x, y, width, height: 26, rx: 13, fill: RIBBONS[ribbon.color], stroke: COLORS.ink, "stroke-width": 2, class: "ribbon", "data-from": ribbon.from, "data-length": ribbon.length, "data-part": `ribbon-${ribbon.color}`, "aria-label": `the ${ribbon.color} ribbon` }),
      text({ x: x + width + 8, y: y + 13, "font-size": 16, "font-weight": 700, "dominant-baseline": "central", class: "ribbon-label" }, ribbon.color),
    );
  });
  let bottom = 16 + v.ribbons.length * row;
  if (v.cubes) {
    const ribbon = v.ribbons[0];
    const size = Math.min(unit, 34);
    for (let k = 0; k < ribbon.length; k++) {
      parts.push(el("rect", { x: left + (ribbon.from + k) * unit, y: bottom - 10 + (unit - size) / 2, width: unit, height: size, fill: "#fde68a", stroke: COLORS.ink, "stroke-width": 1.5, class: "cube" }));
    }
    bottom += size;
  }
  if (v.ruler) {
    const top = bottom + 8;
    for (const ribbon of v.ribbons) {
      for (const end of [ribbon.from, ribbon.from + ribbon.length]) {
        parts.push(el("line", { x1: left + end * unit, y1: 16 + v.ribbons.indexOf(ribbon) * row + 26, x2: left + end * unit, y2: top, stroke: COLORS.muted, "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
      }
    }
    parts.push(el("rect", { x: left - 14, y: top, width: v.span * unit + 28, height: 50, rx: 4, fill: "#fef3c7", stroke: COLORS.ink, "stroke-width": 2, class: "ruler", "data-marks": "ruler" }));
    for (let k = 0; k <= v.span; k++) {
      const x = left + k * unit;
      parts.push(
        el("line", { x1: x, y1: top, x2: x, y2: top + 16, stroke: COLORS.ink, "stroke-width": 2, class: "tick", "data-at": k }),
        text({ x, y: top + 32, "font-size": 15, "font-weight": 600, "text-anchor": "middle", class: "tick-label" }, k),
      );
      if (k < v.span && v.ruler === "inches") parts.push(el("line", { x1: x + unit / 2, y1: top, x2: x + unit / 2, y2: top + 9, stroke: COLORS.ink, "stroke-width": 1.5 }));
    }
    parts.push(text({ x: left + v.span * unit + 10, y: top + 46, "font-size": 11, fill: COLORS.muted, "text-anchor": "end" }, v.ruler));
    bottom = top + 50;
  }
  return svg("lengths", left + v.span * unit + 80, bottom + 12, describeVisual(v), parts);
}

/**
 * A coordinate grid, numbered along its axes, with labelled points.
 * @param {CoordinateGrid} v
 */
export function coordinates(v) {
  const span = v.max - v.min;
  const cell = Math.min(34, 340 / span);
  const pad = 34;
  /** @param {number} x */
  const X = x => pad + (x - v.min) * cell;
  /** @param {number} y */
  const Y = y => pad + (v.max - y) * cell;
  /** @param {number} n */
  const write = n => (n < 0 ? `−${-n}` : String(n));
  const parts = [];
  // The numbers run along the axes, which are the grid's edges when it starts at 0.
  const [numbersY, numbersX] = [Y(Math.max(0, v.min)) + 16, X(Math.max(0, v.min)) - 8];
  for (let k = v.min; k <= v.max; k++) {
    const axis = k === 0;
    const look = { stroke: axis ? COLORS.ink : COLORS.grid, "stroke-width": axis ? 2.5 : 1 };
    parts.push(
      el("line", { x1: X(k), y1: Y(v.min), x2: X(k), y2: Y(v.max), ...look }),
      el("line", { x1: X(v.min), y1: Y(k), x2: X(v.max), y2: Y(k), ...look }),
    );
    if (k !== 0 || v.min === 0) parts.push(text({ x: X(k), y: numbersY, "font-size": 14, "font-weight": 600, fill: COLORS.muted, "text-anchor": "middle", class: "x-label" }, write(k)));
    if (k !== 0) parts.push(text({ x: numbersX, y: Y(k), "font-size": 14, "font-weight": 600, fill: COLORS.muted, "text-anchor": "end", "dominant-baseline": "central", class: "y-label" }, write(k)));
  }
  if (v.shape) {
    // Filled under the grid, so the numbers on the axes still show; outlined over it.
    const corners = points(v.points.map(p => [X(p.x), Y(p.y)]));
    parts.unshift(el("polygon", { points: corners, fill: COLORS.fill, "fill-opacity": 0.7 }));
    parts.push(el("polygon", { points: corners, fill: "none", stroke: COLORS.accent, "stroke-width": 3, "stroke-linejoin": "round", class: "shape" }));
  }
  for (const p of v.points) {
    parts.push(
      el("circle", { cx: X(p.x), cy: Y(p.y), r: 7, fill: COLORS.point, stroke: COLORS.paper, "stroke-width": 2, class: "point", "data-x": p.x, "data-y": p.y }),
      text({ x: X(p.x) + 8, y: Y(p.y) - 10, "font-size": 20, "font-weight": 800, stroke: COLORS.paper, "stroke-width": 4, "paint-order": "stroke", class: "point-label" }, p.label),
      el("circle", { cx: X(p.x), cy: Y(p.y), r: 16, fill: "transparent", class: "hit", "data-part": `point-${p.label}`, "aria-label": `point ${p.label}` }),
    );
  }
  const size = span * cell + 2 * pad;
  return svg("coordinates", size, size, describeVisual(v), parts);
}
