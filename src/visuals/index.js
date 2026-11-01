// Drawing a question's visual. Every kind of Visual has a renderer here that
// turns it into SVG markup, ready to put in the page.

import { objects, pattern, money, clock, shape } from "./pictures.js";
import { numberLine } from "./number_line.js";
import { pictureGraph, barGraph } from "./graphs.js";
import { fraction } from "./fractions.js";
import { area, cubes, angle, coordinates } from "./measures.js";

/** @import { Visual } from "../questions/common.js" */

export { describeVisual } from "./describe.js";

/**
 * @param {Visual} v
 * @returns {string}  an <svg> element, as markup
 */
export function renderVisual(v) {
  switch (v.kind) {
    case "objects": return objects(v);
    case "pattern": return pattern(v);
    case "money": return money(v);
    case "clock": return clock(v);
    case "shape": return shape(v);
    case "number_line": return numberLine(v);
    case "picture_graph": return pictureGraph(v);
    case "bar_graph": return barGraph(v);
    case "fraction": return fraction(v);
    case "area": return area(v);
    case "cubes": return cubes(v);
    case "angle": return angle(v);
    case "coordinates": return coordinates(v);
  }
}
