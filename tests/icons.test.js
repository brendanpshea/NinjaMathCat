// tests/icons.test.js — the game's own icons (src/ui/icons.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { icon, ICONS } from "../src/ui/icons.js";

describe("the icons", () => {
  it("are SVG in the button's own colour, hidden from screen readers, whose buttons say what they do", () => {
    for (const name of ICONS) {
      const svg = icon(name);
      assert.match(svg, /^<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"[^>]*>.+<\/svg>$/, name);
      assert.match(svg, /stroke="currentColor"/, name);
      assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(svg), `${name} is drawn, not an emoji`);
    }
    assert.match(icon("play", "tile-icon"), /^<svg class="tile-icon"/);
  });

  it("include one for each thing the map and the number pad show", () => {
    for (const name of ["play", "training", "battle", "challenge", "treasures", "lock", "star", "players", "back"]) assert.ok(ICONS.includes(name), name);
  });
});
