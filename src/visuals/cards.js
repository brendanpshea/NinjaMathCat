// A math card: math written out large, a line at a time, for a teaching
// scene to point at. It might be 3 × (4 + 2) with the brackets ringed, the
// digits of 4,382 one by one, or the lines of working out a sum. Each token
// is a part to ring or tap, named t<line>-<index>.

import { svg, el, text, num } from "./svg.js";
import { describeVisual } from "./describe.js";
import { speakable } from "../speech.js";

/** @import { MathCard } from "../questions/common.js" */

/**
 * @param {MathCard} v
 */
export function mathCard(v) {
  const size = 34;
  const lineHeight = 60;
  const pad = 20;
  /**
   * How wide a token is drawn: about 0.62 of the size for each character, with
   * room either side of a sign, and little round digits, commas and brackets,
   * so that 4 , 3 8 2 reads as one number, 4,382.
   */
  const widthOf = (/** @type {string} */ token) => Math.max(1, [...token].length) * size * 0.62 + (/^[+−×÷=<>≤≥]$/.test(token) ? 24 : 4);
  const lineWidths = v.lines.map(tokens => tokens.reduce((sum, t) => sum + widthOf(t), 0));
  const width = Math.max(240, ...lineWidths) + 2 * pad;
  /** @type {string[]} */
  const body = [];
  v.lines.forEach((tokens, l) => {
    let x = (width - lineWidths[l]) / 2;
    const y = pad + l * lineHeight;
    tokens.forEach((token, i) => {
      const w = widthOf(token);
      body.push(
        el("rect", { x: num(x), y, width: num(w), height: lineHeight - 8, rx: 8, fill: "transparent", class: "token", "data-part": `t${l}-${i}`, "data-marks": `line-${l}`, "aria-label": speakable(token) || token }),
        text({ x: num(x + w / 2), y: y + (lineHeight - 8) / 2, "font-size": size, "font-weight": 700, "text-anchor": "middle", "dominant-baseline": "central", "pointer-events": "none" }, token),
      );
      x += w;
    });
  });
  return svg("math", Math.ceil(width), 2 * pad + v.lines.length * lineHeight - 8, describeVisual(v), body);
}
