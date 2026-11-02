// Drawing a question's visual. Every kind of Visual has a renderer here that
// turns it into SVG markup, ready to put in the page.

import { objects, pattern, groups, money, clock, shape } from "./pictures.js";
import { numberLine } from "./number_line.js";
import { pictureGraph, barGraph, linePlot } from "./graphs.js";
import { fraction, fractionBars, hundredths } from "./fractions.js";
import { area, cubes, angle, coordinates, lengths } from "./measures.js";
import { tenFrame, baseTen } from "./counting.js";
import { solid, scene } from "./solids.js";
import { lines, net, composite } from "./figures.js";

/** @import { Visual } from "../questions/common.js" */

export { describeVisual, dataTable } from "./describe.js";

/**
 * @param {Visual} v
 * @param {{ narrow?: boolean }} [options]  narrow: drawn for a phone's width, where that helps the numbers be read
 * @returns {string}  an <svg> element, as markup
 */
export function renderVisual(v, options = {}) {
  switch (v.kind) {
    case "objects": return objects(v);
    case "pattern": return pattern(v);
    case "groups": return groups(v);
    case "lines": return lines(v);
    case "net": return net(v);
    case "composite": return composite(v);
    case "fraction_bars": return fractionBars(v);
    case "hundredths": return hundredths(v);
    case "money": return money(v);
    case "clock": return clock(v);
    case "shape": return shape(v);
    case "number_line": return numberLine(v, options);
    case "picture_graph": return pictureGraph(v);
    case "bar_graph": return barGraph(v);
    case "line_plot": return linePlot(v, options);
    case "fraction": return fraction(v);
    case "area": return area(v);
    case "cubes": return cubes(v);
    case "angle": return angle(v);
    case "coordinates": return coordinates(v);
    case "lengths": return lengths(v);
    case "solid": return solid(v);
    case "scene": return scene(v);
    case "ten_frame": return tenFrame(v);
    case "base_ten": return baseTen(v);
  }
}
