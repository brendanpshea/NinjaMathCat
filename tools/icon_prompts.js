// Writes docs/prompts.md from tools/icon_sheets.json: one prompt per sheet of
// nine icons, ready to paste into Gemini or another image maker, and says
// which sheets are saved and cut.
//
//   npm run icon-prompts
//
// Each sheet is a 3 x 3 grid on solid magenta, so the nine share a style and
// tools/cut_icons.py can cut them apart and drop the background.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ADVENTURES } from "../src/adventures.js";
import { KEEPSAKES, chapterTreasure, gradeTreasure } from "../src/treasures.js";

const SHEETS = "tools/icon_sheets.json";
const OUT = "docs/prompts.md";

/**
 * @typedef {{ id: string, look: string }} Item
 * @typedef {{ id: string, title?: string, set?: string, items: Item[] }} Sheet
 * @typedef {{ id: string, title: string, folder: string, size: number, about: string, style: string, sheets: Sheet[] }} Group
 */

const CELLS = ["Top left", "Top middle", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom middle", "Bottom right"];

/** Every treasure's name, by id, to label what each sheet holds. */
export function treasureNames() {
  /** @type {Map<string, string>} */
  const names = new Map(KEEPSAKES.map(k => [k.id, k.name]));
  for (const grade of Object.keys(ADVENTURES).map(Number)) {
    ADVENTURES[grade].forEach((_, c) => {
      const t = chapterTreasure(grade, c);
      names.set(t.id, t.name);
    });
    const t = gradeTreasure(grade);
    names.set(t.id, t.name);
  }
  return names;
}

/**
 * The prompt for one sheet.
 * @param {Group} group
 * @param {Sheet} sheet
 */
export function promptFor(group, sheet) {
  if (sheet.items.length !== 9) throw new Error(`Sheet ${sheet.id} has ${sheet.items.length} items, not 9`);
  const list = sheet.items.map((item, i) => `${i + 1}. ${CELLS[i]}: ${item.look}`).join("\n");
  return `Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). ${group.style} Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.${sheet.set ? `

These nine are one matching set: all of them are made of ${sheet.set}.` : ""}

The nine icons, left to right, top row first:
${list}`;
}

/** @returns {Group[]} */
function loadGroups() {
  return JSON.parse(readFileSync(SHEETS, "utf8")).groups;
}

/**
 * Where a sheet's picture is saved, if it is.
 * @param {Group} group
 * @param {Sheet} sheet
 */
export function savedSheet(group, sheet) {
  return ["png", "jpg", "jpeg", "webp"].map(ext => `${group.folder}/sheets/${sheet.id}.${ext}`).find(path => existsSync(path)) ?? null;
}

/** The whole of prompts.md. */
export function buildPrompts() {
  const names = treasureNames();
  const sections = loadGroups().map(group => {
    const sheets = group.sheets.map((sheet, n) => `### ${group.title.replace(/ \(.*\)$/, "")} ${n + 1}${sheet.title ? `: ${sheet.title}` : ""}

Save as \`${group.folder}/sheets/${sheet.id}.png\`. It holds: ${sheet.items.map(item => names.get(item.id) ?? item.id.replace(/_/g, " ")).join(", ")}.

\`\`\`text
${promptFor(group, sheet)}
\`\`\``).join("\n\n");
    return `## ${group.title}\n\n${group.about}\n\n${sheets}`;
  }).join("\n\n");
  return `# Icon prompts

> Built by \`tools/icon_prompts.js\` from \`tools/icon_sheets.json\`. Edit that
> and run \`npm run icon-prompts\`; changes made here are overwritten.

Each prompt makes one sheet: nine icons in a 3 x 3 grid on solid magenta,
which \`tools/cut_icons.py\` cuts into nine pictures with see-through
backgrounds.

1. Start a new chat for each prompt, so one sheet doesn't steer the next, and
   paste the prompt in. Ask for the largest size offered (2K or 4K if there's
   a choice): each icon is a ninth of the picture.
2. Once you have a sheet you like, attach it to later prompts and add "Match
   the style of the attached sheet exactly, but draw these nine new icons." It
   keeps the sets looking like one game.
3. Check the sheet: nine separate icons in three rows of three; a flat
   magenta background with nothing touching the edges; no writing or numbers;
   no pink, magenta or purple inside an icon (it would be cut away with the
   background), nor a pink haze around a glowing thing or showing through
   glass (the magenta mixed in; it stays pink); each icon what its line asks
   for. If one icon is wrong, ask
   for just that one again: "Keep everything else the same, but redraw the
   bottom-left icon as ..."
4. Save it under the name given above its prompt. Sheets are source material
   and stay out of git.
5. Run \`python tools/cut_icons.py\` (or name sheets: \`python tools/cut_icons.py
   chapters-k\`). It cuts each saved sheet into nine pictures in the sheet's
   folder and tells the game which treasures now have pictures. Look at
   \`out/icons.html\` to check them.

The chapter treasures come first, because each says what a chapter taught,
then the keepsakes, then the pictures questions show. Whatever isn't made
yet shows as its emoji, so the sheets can come in any order.

${sections}
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, buildPrompts());
  console.log(`Wrote ${OUT}.`);
  for (const group of loadGroups()) {
    for (const sheet of group.sheets) {
      const cut = sheet.items.filter(item => existsSync(`${group.folder}/${item.id}.webp`)).length;
      console.log(`  ${sheet.id}: ${savedSheet(group, sheet) ? "saved" : "not made yet"}, ${cut} of 9 cut`);
    }
  }
}
