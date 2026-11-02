// Visuals in words, for screen readers. A description says what the picture
// is and what it is labelled with, but never the quantity a question asks
// about: "a clock face", not "a clock showing 2:50".

import { moneyById } from "../questions/money.js";
import { rulerText } from "../questions/rational.js";
import { escapeXml as esc } from "./svg.js";

/** @import { Visual } from "../questions/common.js" */

/**
 * A position on a number line, written as a child would read it: 3, or 3/4.
 * @param {number} units  how many 1/den steps from zero
 * @param {number} den
 * @returns {string}
 */
export function positionLabel(units, den) {
  if (units < 0) return `−${positionLabel(-units, den)}`;
  if (den === 1) return String(units);
  return units % den === 0 ? String(units / den) : `${units}/${den}`;
}

/**
 * "a, b and c"
 * @param {string[]} items
 */
function list(items) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The numbers a graph or line plot shows, as a table for a screen reader to
 * read row by row: what a sighted child reads off the bars, the pictures or
 * the stacks of Xs. Empty for every other kind of picture.
 * @param {Visual} v
 * @returns {string}  a <table>, as markup, or ""
 */
export function dataTable(v) {
  /**
   * @param {string} title
   * @param {[string, string]} heads
   * @param {[string, string | number][]} rows
   */
  const table = (title, heads, rows) => `<table class="data-table"><caption>${esc(title)}</caption>
    <thead><tr><th scope="col">${esc(heads[0])}</th><th scope="col">${esc(heads[1])}</th></tr></thead>
    <tbody>${rows.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</tbody></table>`;
  switch (v.kind) {
    case "picture_graph":
      return table(v.title, ["", `Number of ${v.unit[1]}`], v.rows.map(r => [r.label, r.value]));
    case "bar_graph":
      return table(v.title, [v.histogram ? "Interval" : "", v.axis], v.bars.map(b => [b.label, b.value]));
    case "line_plot":
      return table(v.title, [v.den === 1 ? "Value" : "Length", "How many"], v.counts.map((c, i) => [rulerText(v.from + i, v.den), c]));
    default:
      return "";
  }
}

/**
 * @param {Visual} v
 * @returns {string}
 */
export function describeVisual(v) {
  switch (v.kind) {
    case "objects":
      return `Pictures of ${v.emoji} to count`;
    case "pattern":
      return v.items.includes(null) ? "A row of pictures with one missing" : "A row of pictures to sort and count";
    case "money":
      return `Money: ${list(v.items.map(id => moneyById(id).name))}`;
    case "clock":
      return "A clock face";
    case "shape":
      return "A flat shape";
    case "number_line": {
      const marks = [v.jumps.length > 0 ? "a jump" : "", v.points.length > 0 ? "a point marked" : ""].filter(Boolean);
      const range = `A number line from ${positionLabel(v.from, v.den)} to ${positionLabel(v.to, v.den)}`;
      return marks.length > 0 ? `${range}, with ${list(marks)}` : range;
    }
    case "picture_graph":
      return `A picture graph, "${v.title}", with rows for ${list(v.rows.map(r => r.label))}`;
    case "bar_graph":
      // A histogram's bars are numbers, which could match an answer by chance.
      return v.histogram
        ? `A histogram, "${v.title}", with a bar for each interval`
        : `A bar graph, "${v.title}", with bars for ${list(v.bars.map(b => b.label))}`;
    case "line_plot":
      return `A line plot, "${v.title}", with an X for each one measured`;
    case "fraction":
      return `A ${v.model} cut into equal parts, some of them shaded`;
    case "area":
      if (v.grid) return `A ${v.shape} on a grid of squares`;
      if (!v.labels) return `A ${v.shape}`;
      return v.shape === "rectangle"
        ? `A rectangle with sides labelled ${v.labels.base} and ${v.labels.height}`
        : `A ${v.shape} with its base labelled ${v.labels.base} and its height labelled ${v.labels.height}`;
    case "cubes":
      return v.labels ? `A box with edges labelled ${list([v.labels.length, v.labels.width, v.labels.height])}` : "A box built of small cubes";
    case "angle":
      return v.protractor ? "An angle on a protractor" : "An angle";
    case "ten_frame":
      return v.frames === 2 ? "Two ten frames with counters" : "A ten frame with counters";
    case "base_ten":
      return v.hundreds > 0 ? "Base-ten blocks: hundreds, tens and ones" : "Base-ten blocks: tens and ones";
    case "solid":
      return "A solid shape";
    case "fraction_bars": {
      const labels = v.bars.flatMap(b => (b.label ? [b.label] : []));
      const bars = `${v.bars.length === 2 ? "Two" : v.bars.length} bars the same length, cut into equal parts, some shaded`;
      return labels.length === 0 ? bars : labels.length === v.bars.length ? `${bars}, labelled ${list(labels)}` : `${bars}; the top one is labelled ${labels[0]}`;
    }
    case "hundredths": {
      const grids = v.grids.length === 1 ? "A grid of 100 squares, some shaded" : `${v.grids.length === 2 ? "Two" : v.grids.length} grids of 100 squares, some shaded`;
      return v.labels ? `${grids}, labelled ${list(v.labels)}` : grids;
    }
    case "groups":
      return `Rows of ${list(v.rows.map(r => r.name))}`;
    case "scene":
      return `A ${v.thing} and a ${v.landmark}`;
    case "lengths": {
      const names = list(v.ribbons.map(r => r.color));
      const ribbons = v.ribbons.length === 1 ? `A ${names} ribbon` : `Ribbons: ${names}`;
      return v.ruler ? `${ribbons}, above a ruler in ${v.ruler}` : v.cubes ? `${ribbons}, with cubes laid along it` : ribbons;
    }
    case "coordinates":
      return `A coordinate grid with ${v.shape ? "a shape with corners" : "points"} ${list(v.points.map(p => p.label))}`;
  }
}
