// Small helpers for writing SVG as text. Visuals are built as strings so they
// can be made, and tested, without a browser; the UI puts them into the page.

import { pictureOf, counterOf } from "../pictures.js";

/**
 * The colours every visual shares. Shading never carries meaning by colour
 * alone (it is also outlined and patterned by position), so children who
 * see colour differently read the same picture.
 */
export const COLORS = {
  ink: "#1f2937",
  muted: "#4b5563",
  line: "#6b7280",
  grid: "#d1d5db",
  paper: "#ffffff",
  fill: "#bfdbfe",
  accent: "#2563eb",
  point: "#dc2626",
};

export const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** @param {string | number} value */
export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, c => ESCAPES[/** @type {keyof typeof ESCAPES} */ (c)]);
}
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * A coordinate, to at most two decimal places.
 * @param {number} x
 */
export function num(x) {
  return String(Math.round(x * 100) / 100);
}

/**
 * An element. Attribute values are escaped and numbers rounded; attributes
 * that are undefined are left out. Children are markup already.
 * @param {string} name
 * @param {Record<string, string | number | undefined>} [attrs]
 * @param {...string} children
 */
export function el(name, attrs = {}, ...children) {
  const attributes = Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${k}="${escapeXml(typeof v === "number" ? num(v) : /** @type {string} */ (v))}"`)
    .join("");
  return children.length > 0 ? `<${name}${attributes}>${children.join("")}</${name}>` : `<${name}${attributes}/>`;
}

/**
 * A piece of text, escaped.
 * @param {Record<string, string | number | undefined>} attrs
 * @param {string | number} content
 */
export function text(attrs, content) {
  return el("text", { "font-family": FONT, fill: COLORS.ink, ...attrs }, escapeXml(content));
}

/**
 * A thing to count or match, centred on (x, y): its picture where one is
 * drawn (src/pictures.js), its emoji until then, and a coloured counter as a
 * circle. Any way it is drawn, it carries the same attributes, so it is
 * counted, tapped and read the same.
 * @param {{ x: number, y: number, size: number } & Record<string, string | number | undefined>} at
 *   size: the emoji's font size; a picture is drawn a little bigger, as an emoji's glyph is
 * @param {string} emoji
 * @param {ReadonlySet<string>} [drawn]  the pictures made so far, if not the game's own list
 */
export function glyph({ x, y, size, ...attrs }, emoji, drawn) {
  const counter = counterOf(emoji);
  if (counter) return el("circle", { cx: x, cy: y, r: size * 0.46, fill: counter.fill, stroke: counter.edge, "stroke-width": 2.5, "data-emoji": emoji, ...attrs });
  const picture = pictureOf(emoji, drawn);
  if (!picture) return text({ x, y, "font-size": size, "text-anchor": "middle", "dominant-baseline": "central", ...attrs }, emoji);
  const side = size * 1.2;
  return el("image", { href: picture.file, x: x - side / 2, y: y - side / 2, width: side, height: side, "data-emoji": emoji, ...attrs });
}

/**
 * Something to tap in a teaching scene, laid invisibly over a part of a
 * picture too thin or too scattered to tap by itself: a tick, a row, a hand.
 * @param {string} part  its name, as a scene's check and focus call it
 * @param {string} label  what a screen reader says for it
 * @param {{ x: number, y: number, width: number, height: number }} box
 */
export function hit(part, label, { x, y, width, height }) {
  return el("rect", { x: num(x), y: num(y), width: num(width), height: num(height), fill: "transparent", class: "hit", "data-part": part, "aria-label": label });
}

/**
 * A whole visual: an SVG that scales to fit its container, labelled for screen
 * readers. `kind` goes in data-visual, where tests and styles can find it.
 * @param {string} kind
 * @param {number} width
 * @param {number} height
 * @param {string} label
 * @param {string[]} body
 */
export function svg(kind, width, height, label, body) {
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${num(width)} ${num(height)}`,
      role: "img",
      "aria-label": label,
      "data-visual": kind,
      class: "visual",
    },
    el("title", {}, escapeXml(label)),
    ...body,
  );
}
