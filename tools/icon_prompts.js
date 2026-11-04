// Writes docs/prompts.md from tools/icon_sheets.json: the prompts for the
// icons still to draw, ready to paste into Gemini or another image maker.
//
//   npm run icon-prompts            docs/prompts.md: only what is still to draw
//   npm run icon-prompts -- --all   out/all-prompts.md: every sheet's prompt
//
// icon_sheets.json keeps every icon, drawn or not. Still to draw are:
// - a sheet with none of its icons drawn: its own prompt, nine icons in a
//   3 x 3 grid;
// - an icon marked "redo" (it came out wrong): all of them together on a
//   fix-up sheet, fixes.png in their folder's sheets/, nine at most to a
//   sheet, which `python tools/cut_icons.py fixes` cuts into just those
//   icons, leaving the sheets they came from as they are.
// Everything is drawn on solid magenta, so tools/cut_icons.py can cut the
// icons apart and drop the background.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ADVENTURES } from "../src/adventures.js";
import { KEEPSAKES, chapterTreasure, gradeTreasure } from "../src/treasures.js";

const SHEETS = "tools/icon_sheets.json";
const OUT = "docs/prompts.md";
const ALL = "out/all-prompts.md";

/**
 * @typedef {{ id: string, look: string, redo?: string }} Item
 * @typedef {{ id: string, title?: string, set?: string, items: Item[] }} Sheet
 * @typedef {{ id: string, title: string, folder: string, size: number, about: string, style: string, sheets: Sheet[] }} Group
 * @typedef {{ group: Group, sheet: Sheet, item: Item }} Placed  an icon, with the group and sheet it belongs to
 * @typedef {{ folder: string, name: string, items: Placed[] }} Fixes  a fix-up sheet
 */

const CELLS = ["Top left", "Top middle", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom middle", "Bottom right"];
const COUNT = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

const BACKGROUND = "The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.";
const STICKERS = "matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight).";
const PLAIN = "No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.";

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
 * The prompt for one whole sheet of nine.
 * @param {Group} group
 * @param {Sheet} sheet
 */
export function promptFor(group, sheet) {
  if (sheet.items.length !== 9) throw new Error(`Sheet ${sheet.id} has ${sheet.items.length} items, not 9`);
  const list = sheet.items.map((item, i) => `${i + 1}. ${CELLS[i]}: ${item.look}`).join("\n");
  return `Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

${BACKGROUND}

All nine share one style, ${STICKERS} ${group.style} Each icon fills about two thirds of its cell. ${PLAIN}${sheet.set ? `

These nine are one matching set: all of them are made of ${sheet.set}.` : ""}

The nine icons, left to right, top row first:
${list}`;
}

/**
 * How a fix-up sheet of n icons is laid out: rows of three, the last one
 * shorter. tools/cut_icons.py (rows_of) cuts it the same way.
 * @param {number} n  from 1 to 9
 */
export function rowsOf(n) {
  return [...Array(Math.floor(n / 3)).fill(3), ...(n % 3 ? [n % 3] : [])];
}

/** "1 and 2", "1, 2 and 3". @param {(string | number)[]} things */
const andList = things => things.length === 1 ? `${things[0]}` : `${things.slice(0, -1).join(", ")} and ${things.at(-1)}`;

/**
 * The prompt for a fix-up sheet: the icons to draw again, each in its own
 * group's style and its sheet's material.
 * @param {Fixes} fixes
 */
export function fixPrompt(fixes) {
  const n = fixes.items.length;
  const rows = rowsOf(n);
  const shape = n === 1 ? "one square picture, 1:1" : rows.length === 1 ? "one wide picture, 16:9" : rows.length === 2 ? "one picture, 3:2" : "one square picture, 1:1";
  const layout = n === 1 ? "on its own in the middle"
    : rows.length === 1 ? `side by side in one row, evenly spaced`
    : `in rows of three, evenly spaced, with ${COUNT[rows.at(-1) ?? 3]} in the last row`;
  const rowNames = [["Row"], ["Top row", "Bottom row"], ["Top row", "Middle row", "Bottom row"]][rows.length - 1];
  const colNames = [["middle"], ["left", "right"], ["left", "middle", "right"]];
  const places = rows.flatMap((count, r) => colNames[count - 1].map(c => n === 1 ? "Middle" : rows.length === 1 ? c[0].toUpperCase() + c.slice(1) : `${rowNames[r]}, ${c}`));
  const groups = [...new Set(fixes.items.map(p => p.group))];
  const styles = groups.length === 1 ? groups[0].style
    : groups.map(g => `About icon${fixes.items.filter(p => p.group === g).length > 1 ? "s" : ""} ${andList(fixes.items.flatMap((p, i) => p.group === g ? [i + 1] : []))}: ${g.style}`).join(" ");
  const list = fixes.items.map(({ sheet, item }, i) => `${i + 1}. ${places[i]}: ${item.look}${sheet.set ? ` Made of ${sheet.set}.` : ""}`).join("\n");
  const many = n === 1 ? "one icon" : `${COUNT[n]} separate icons`;
  return `Make ${shape}, at the highest resolution you can. It holds ${many} for a cute 2D fantasy math game for children, ${layout}. Each icon sits alone in the middle of its own part of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

${BACKGROUND}

${n === 1 ? "It is drawn in the style" : "All of them share one style,"} ${STICKERS} ${styles} Each icon fills about two thirds of its space. ${PLAIN}

The ${n === 1 ? "icon" : `${COUNT[n]} icons, left to right${rows.length > 1 ? ", top row first" : ""}`}:
${list}`;
}

/** @returns {Group[]} */
function loadGroups() {
  return JSON.parse(readFileSync(SHEETS, "utf8")).groups;
}

/**
 * Whether an icon's picture has been cut.
 * @param {Group} group
 * @param {Item} item
 */
const drawn = (group, item) => existsSync(`${group.folder}/${item.id}.webp`);

/**
 * Where a sheet's picture is saved, if it is.
 * @param {Group} group
 * @param {Sheet} sheet
 */
export function savedSheet(group, sheet) {
  return ["png", "jpg", "jpeg", "webp"].map(ext => `${group.folder}/sheets/${sheet.id}.${ext}`).find(path => existsSync(path)) ?? null;
}

/**
 * The fix-up sheets: every icon marked "redo", in the order of
 * icon_sheets.json, by folder, nine to a sheet: fixes, fixes-2 and on.
 * tools/cut_icons.py (fix_sheets) finds the same ones.
 * @param {Group[]} groups
 * @returns {Fixes[]}
 */
export function fixSheets(groups) {
  /** @type {Map<string, Placed[]>} */
  const byFolder = new Map();
  for (const group of groups) {
    for (const sheet of group.sheets) {
      for (const item of sheet.items) {
        if (item.redo) byFolder.set(group.folder, [...(byFolder.get(group.folder) ?? []), { group, sheet, item }]);
      }
    }
  }
  return [...byFolder].flatMap(([folder, items]) => Array.from({ length: Math.ceil(items.length / 9) }, (_, k) => ({
    folder, name: k === 0 ? "fixes" : `fixes-${k + 1}`, items: items.slice(k * 9, k * 9 + 9),
  })));
}

/** How to use a prompt, for the top of either page. */
const HOW = `1. Start a new chat for each prompt, so one picture doesn't steer the next,
   and paste the prompt in. Ask for the largest size offered (2K or 4K if
   there's a choice): each icon is a small part of the picture.
2. Attach a finished sheet and add "Match the style of the attached sheet
   exactly." It keeps the icons looking like one game.
3. Check the picture: separate icons, laid out as the prompt asks; a flat
   magenta background with nothing touching the edges; no writing or
   numbers; no pink, magenta or purple inside an icon (it would be cut away
   with the background), nor a pink haze around a glowing thing or showing
   through glass (the magenta mixed in; it stays pink); each icon what its
   line asks for. If one icon is wrong, ask for just that one again: "Keep
   everything else the same, but redraw the bottom-left icon as ..."
4. Save it under the name given above its prompt. Sheets are source
   material and stay out of git.
5. Cut it: \`python tools/cut_icons.py <its name>\`, such as
   \`python tools/cut_icons.py chapters-k\` or \`python tools/cut_icons.py
   fixes\`. Look at \`out/icons.html\` to check the icons, then run
   \`npm run pwa\` so the game keeps them for playing offline.`;

/**
 * One whole sheet's section.
 * @param {Group} group
 * @param {Sheet} sheet
 * @param {(item: Item) => string} label
 */
function sheetSection(group, sheet, label) {
  const n = group.sheets.indexOf(sheet) + 1;
  return `### ${group.title.replace(/ \(.*\)$/, "")} ${n}${sheet.title ? `: ${sheet.title}` : ""}

Save as \`${group.folder}/sheets/${sheet.id}.png\`. It holds: ${sheet.items.map(label).join(", ")}.

\`\`\`text
${promptFor(group, sheet)}
\`\`\``;
}

/** docs/prompts.md: the prompts for what is still to draw. */
export function buildPrompts() {
  const groups = loadGroups();
  const names = treasureNames();
  /** @param {Item} item */
  const label = item => names.get(item.id) ?? item.id.replace(/_/g, " ");
  const fixes = fixSheets(groups);
  const fresh = groups.flatMap(group => group.sheets.filter(sheet => !sheet.items.some(item => drawn(group, item))).map(sheet => ({ group, sheet })));

  const fixSections = fixes.map(f => {
    const from = [...new Set(f.items.map(p => p.sheet.id))];
    const many = f.items.length > 1;
    return `### Fix-up sheet: \`${f.folder}/sheets/${f.name}.png\`

${many ? `${COUNT[f.items.length][0].toUpperCase()}${COUNT[f.items.length].slice(1)} icons that came out wrong` : "An icon that came out wrong"}, drawn together so the sheets they came from stay as they are:

${f.items.map(({ sheet, item }) => `- ${label(item)} (from ${sheet.id}): ${item.redo}`).join("\n")}

Attach ${from.length > 1 ? `the sheets ${andList(from)}` : `the sheet ${from[0]}`}, from \`${f.folder}/sheets/\`, so ${many ? "they match" : "it matches"}. Then \`python tools/cut_icons.py ${f.name}\` replaces just ${many ? "these" : "this one"}. Once ${many ? "they're" : "it's"} right, take the \`"redo"\` off ${many ? "them" : "it"} in \`tools/icon_sheets.json\`, delete \`${f.name}.png\`, and run \`npm run icon-prompts\`.

\`\`\`text
${fixPrompt(f)}
\`\`\``;
  });
  const freshSections = fresh.map(({ group, sheet }) => sheetSection(group, sheet, label));
  const nothing = fixes.length === 0 && fresh.length === 0;

  return `# Icon prompts

> Built by \`tools/icon_prompts.js\` from \`tools/icon_sheets.json\`, which keeps
> every icon, drawn or not. This page has only what is still to draw;
> \`npm run icon-prompts -- --all\` writes every sheet's prompt to
> \`${ALL}\`. Edit the JSON and run \`npm run icon-prompts\`; changes made
> here are overwritten.

${nothing ? `Every icon is drawn. To have one drawn again, give it a \`"redo"\` in
\`tools/icon_sheets.json\` saying what's wrong with it; to add icons, add a
sheet of nine. Then run \`npm run icon-prompts\`.` : `${HOW}

${[
    fixSections.length ? `## To draw again\n\n${fixSections.join("\n\n")}` : "",
    freshSections.length ? `## New sheets\n\n${freshSections.join("\n\n")}` : "",
  ].filter(Boolean).join("\n\n")}`}
`;
}

/** out/all-prompts.md: every sheet's prompt, drawn or not. */
export function buildAllPrompts() {
  const names = treasureNames();
  /** @param {Item} item */
  const label = item => names.get(item.id) ?? item.id.replace(/_/g, " ");
  const sections = loadGroups().map(group => `## ${group.title}\n\n${group.about}\n\n${group.sheets.map(sheet => sheetSection(group, sheet, label)).join("\n\n")}`);
  return `# Every icon prompt

> Built by \`npm run icon-prompts -- --all\` from \`tools/icon_sheets.json\`:
> every sheet, drawn or not. \`${OUT}\` has only what is still to draw.

${HOW}

${sections.join("\n\n")}
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--all")) {
    mkdirSync("out", { recursive: true });
    writeFileSync(ALL, buildAllPrompts());
    console.log(`Wrote ${ALL}.`);
  } else {
    writeFileSync(OUT, buildPrompts());
    console.log(`Wrote ${OUT}.`);
  }
  const groups = loadGroups();
  for (const group of groups) {
    for (const sheet of group.sheets) {
      const cut = sheet.items.filter(item => drawn(group, item)).length;
      const redo = sheet.items.filter(item => item.redo).length;
      console.log(`  ${sheet.id}: ${savedSheet(group, sheet) ? "saved" : "not made yet"}, ${cut} of 9 cut${redo ? `, ${redo} to draw again` : ""}`);
    }
  }
  for (const f of fixSheets(groups)) console.log(`  ${f.name} (${f.folder}): ${f.items.length} to draw again`);
}
