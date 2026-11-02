// Picture graphs, bar graphs, histograms and line plots.

import { svg, el, text, hit, COLORS, FONT, escapeXml } from "./svg.js";
import { linear, niceStep } from "./scale.js";
import { describeVisual } from "./describe.js";
import { rulerText } from "../questions/rational.js";

/** @import { PictureGraph, BarGraph, LinePlot } from "../questions/common.js" */

const WIDTH = 560;

/**
 * A picture graph: one row per category, a picture for every `each` of it,
 * and a key saying what a picture stands for.
 * @param {PictureGraph} v
 */
export function pictureGraph(v) {
  const top = 50;
  const rowHeight = 50;
  const labelWidth = 124;
  const parts = [text({ x: WIDTH / 2, y: 30, "font-size": 21, "font-weight": 700, "text-anchor": "middle" }, v.title)];

  v.rows.forEach((row, i) => {
    const y = top + i * rowHeight;
    const pictures = row.value / v.each;
    parts.push(el("g", { class: "row", "data-label": row.label, "data-value": row.value, "data-pictures": pictures, "data-part": `row-${i}`, "aria-label": row.label },
      el("rect", { x: 4, y, width: WIDTH - 8, height: rowHeight, fill: i % 2 === 0 ? "#f3f4f6" : COLORS.paper }),
      text({ x: 14, y: y + rowHeight / 2, "font-size": 18, "font-weight": 600, "dominant-baseline": "central" }, row.label),
      ...Array.from({ length: pictures }, (_, j) => text({
        x: labelWidth + 12 + j * 42 + 21,
        y: y + rowHeight / 2,
        "font-size": 30,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        class: "picture",
      }, row.icon))));
  });

  const bottom = top + v.rows.length * rowHeight;
  const [one, many] = v.unit;
  parts.push(
    el("rect", { x: 4, y: top, width: WIDTH - 8, height: bottom - top, fill: "none", stroke: COLORS.line, "stroke-width": 1.5 }),
    el("line", { x1: labelWidth, y1: top, x2: labelWidth, y2: bottom, stroke: COLORS.line, "stroke-width": 1.5 }),
    text({ x: WIDTH / 2, y: bottom + 30, "font-size": 17, "font-weight": 600, fill: COLORS.muted, "text-anchor": "middle", class: "key" },
      `Each picture stands for ${v.each} ${v.each === 1 ? one : many}.`),
  );
  return svg("picture_graph", WIDTH, bottom + 46, describeVisual(v), parts);
}

/**
 * A bar graph with a gridline at every step of the scale.
 * @param {BarGraph} v
 */
export function barGraph(v) {
  const plot = { left: 82, right: WIDTH - 20, top: 58, bottom: 300 };
  const y = linear([0, v.max], [plot.bottom, plot.top]);
  const steps = v.max / v.scale;
  // Every gridline is labelled unless that would crowd them.
  const labelEvery = steps > 10 ? niceStep(steps, 10) : 1;
  const parts = [text({ x: WIDTH / 2, y: 30, "font-size": 21, "font-weight": 700, "text-anchor": "middle" }, v.title)];

  for (let step = 0; step <= steps; step++) {
    const value = step * v.scale;
    parts.push(el("line", { x1: plot.left, y1: y(value), x2: plot.right, y2: y(value), stroke: step === 0 ? COLORS.ink : COLORS.grid, "stroke-width": step === 0 ? 2.5 : 1.5, class: "gridline", "data-value": value }));
    if (step % labelEvery === 0) {
      parts.push(text({ x: plot.left - 10, y: y(value), "font-size": 16, "text-anchor": "end", "dominant-baseline": "central", class: "scale-label" }, value));
    }
  }
  parts.push(
    el("line", { x1: plot.left, y1: plot.top - 6, x2: plot.left, y2: plot.bottom, stroke: COLORS.ink, "stroke-width": 2.5 }),
    text({ x: 22, y: (plot.top + plot.bottom) / 2, "font-size": 16, "font-weight": 600, fill: COLORS.muted, "text-anchor": "middle", transform: `rotate(-90 22 ${(plot.top + plot.bottom) / 2})` }, v.axis),
  );

  const slot = (plot.right - plot.left) / v.bars.length;
  const barWidth = v.histogram ? slot : Math.min(72, slot * 0.6);
  v.bars.forEach((bar, i) => {
    const centre = plot.left + slot * (i + 0.5);
    parts.push(
      el("rect", { x: centre - barWidth / 2, y: y(bar.value), width: barWidth, height: plot.bottom - y(bar.value), fill: COLORS.accent, stroke: COLORS.ink, "stroke-width": 1.5, class: "bar", "data-label": bar.label, "data-value": bar.value, "data-part": `bar-${i}`, "aria-label": bar.label }),
      text({ x: centre, y: plot.bottom + 26, "font-size": 17, "font-weight": 600, "text-anchor": "middle" }, bar.label),
    );
  });
  return svg("bar_graph", WIDTH, plot.bottom + 44, describeVisual(v), parts);
}

/**
 * A position's label under a line plot. In a narrow plot a mixed number goes
 * on two lines, the whole number over its fraction, so neighbours don't run
 * into each other.
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {boolean} narrow
 */
function plotLabel(x, y, label, narrow) {
  const [whole, part] = label.split(" ");
  const look = { x, y, "font-size": 19, "font-weight": 700, "text-anchor": "middle", class: "tick-label" };
  if (!narrow || !part) return text(look, label);
  return el("text", { "font-family": FONT, fill: COLORS.ink, ...look, "aria-label": label },
    el("tspan", { x }, escapeXml(whole)),
    el("tspan", { x, dy: 19, "font-size": 16 }, escapeXml(part)));
}

/**
 * A line plot: a number line with a tick for every position, each labelled,
 * and a stack of Xs above it for every thing measured there. A narrow one,
 * for a phone, is 480 wide, so its numbers come out larger.
 * @param {LinePlot} v
 * @param {{ narrow?: boolean }} [options]
 */
export function linePlot(v, { narrow = false } = {}) {
  const width = narrow ? 480 : WIDTH;
  const stack = 26;
  const tallest = Math.max(...v.counts);
  const line = 66 + tallest * stack;
  const x = linear([0, v.counts.length - 1], [50, width - 50]);
  const parts = [
    text({ x: width / 2, y: 30, "font-size": 21, "font-weight": 700, "text-anchor": "middle" }, v.title),
    el("line", { x1: 24, y1: line, x2: width - 24, y2: line, stroke: COLORS.ink, "stroke-width": 3 }),
  ];
  const reach = v.counts.length > 1 ? x(1) - x(0) : 60;
  v.counts.forEach((count, i) => {
    const at = v.from + i;
    // The whole column over each position, to tap in a teaching scene.
    parts.push(hit(`position-${i}`, rulerText(at, v.den), { x: x(i) - reach / 2, y: 44, width: reach, height: line - 44 + 40 }));
    parts.push(
      el("line", { x1: x(i), y1: line - 9, x2: x(i), y2: line + 9, stroke: COLORS.ink, "stroke-width": 2.5, class: "tick", "data-at": at }),
      plotLabel(x(i), line + 32, rulerText(at, v.den), narrow),
    );
    for (let k = 0; k < count; k++) {
      const [cx, cy] = [x(i), line - 22 - k * stack];
      parts.push(el("path", { d: `M ${cx - 8} ${cy - 8} L ${cx + 8} ${cy + 8} M ${cx + 8} ${cy - 8} L ${cx - 8} ${cy + 8}`, stroke: COLORS.accent, "stroke-width": 3.5, "stroke-linecap": "round", class: "mark", "data-at": at }));
    }
  });
  return svg("line_plot", width, line + (narrow ? 66 : 46), describeVisual(v), parts);
}
