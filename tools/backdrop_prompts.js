// Writes assets/backdrops/prompts.md from assets/backdrops/scenes.json: one
// prompt per sheet, ready to paste into Gemini, and says which sheets and
// backdrops are done.
//
//   npm run backdrop-prompts
//
// Each prompt asks for four backgrounds stacked in one tall picture, so the
// four share a style; tools/cut_backdrops.py cuts them apart.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SCENES = "assets/backdrops/scenes.json";
const OUT = "assets/backdrops/prompts.md";

/**
 * @typedef {{ id: string, name: string, scene: string, ground: string, behind: string, left: string, right: string, avoid: string }} Scene
 * @typedef {{ id: string, scenes: Scene[] }} Sheet
 */

/**
 * The prompt for one sheet.
 * @param {Sheet} sheet
 */
export function promptFor(sheet) {
  const panels = sheet.scenes.map((s, i) => [
    `Panel ${i + 1}${i === 0 ? " (top)" : i === sheet.scenes.length - 1 ? " (bottom)" : ""}: ${s.scene}.`,
    `The ground is ${s.ground}. Behind it: ${s.behind}. At the far left edge, ${s.left}; at the far right edge, ${s.right}.`,
    `Don't draw ${s.avoid}.`,
  ].join(" ")).join("\n\n");
  return `Make one tall picture, portrait 9:16, at the highest resolution you can. It is a sheet of four separate backgrounds for a cute 2D fantasy battle game for children, stacked from top to bottom as four equal horizontal panels, each the full width of the picture. Separate the panels with a thin, straight, pure white line. Nothing crosses from one panel into the next.

All four panels share one style: a soft, painterly storybook illustration, like the background of a gentle animated film. Gentle shading, soft edges, thin light outlines, and a hazy, paler distance. Muted, harmonious colors, never neon. Soft daylight from the upper left.

Every panel follows the same layout, because two small characters will stand in front of it later, facing each other:
- A side view, with the camera at ground level looking straight across.
- The bottom fifth of the panel is flat, open, walkable ground running the whole width, seen from the side, with nothing standing on it.
- A low horizon, about two fifths of the way up.
- Tall things only at the far left and far right edges. The middle is open and calm.
- No people, animals, monsters, faces or creatures of any kind, and no statues or carvings of them. No text, signs or letters. No glowing or very bright objects. Not pixel art.

${panels}`;
}

/** The whole of prompts.md. */
export function buildPrompts() {
  /** @type {{ sheets: Sheet[] }} */
  const { sheets } = JSON.parse(readFileSync(SCENES, "utf8"));
  const sections = sheets.map(sheet => `## Sheet ${sheet.id}: ${sheet.scenes.map(s => s.name).join(", ")}

Save Gemini's picture as \`assets/backdrops/sheets/${sheet.id}.png\` (or .jpg or .webp).

\`\`\`text
${promptFor(sheet)}
\`\`\``).join("\n\n");
  return `# Backdrop prompts

> Built by \`tools/backdrop_prompts.js\` from \`scenes.json\`. Edit that and run
> \`npm run backdrop-prompts\`; changes made here are overwritten.

Each prompt makes one sheet: four painted backgrounds stacked in a tall
picture, one per setting, so the four share a style.

1. Paste a prompt into Gemini. Ask for the largest size it offers (2K or 4K):
   each backdrop is a quarter of the picture's height, and should come out at
   least 1600 pixels wide.
2. Save the picture under the name given above the prompt. The sheets are
   source material and stay out of git.
3. Run \`python tools/cut_backdrops.py\`, which cuts each sheet into four
   backdrops in \`assets/backdrops/\`, then \`npm run backdrops\` to see each one
   behind real fighters, on desktop and phone.
4. Regenerate if a panel has a creature or face in it, its middle is busy, its
   ground isn't flat along the bottom, or the four don't match in style.

${sections}
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, buildPrompts());
  /** @type {{ sheets: Sheet[] }} */
  const { sheets } = JSON.parse(readFileSync(SCENES, "utf8"));
  console.log(`Wrote ${OUT}.`);
  for (const sheet of sheets) {
    const saved = ["png", "jpg", "jpeg", "webp"].some(ext => existsSync(`assets/backdrops/sheets/${sheet.id}.${ext}`));
    const cut = sheet.scenes.filter(s => existsSync(`assets/backdrops/${s.id}.webp`)).length;
    console.log(`  sheet ${sheet.id}: ${saved ? "saved" : "not made yet"}, ${cut} of ${sheet.scenes.length} backdrops cut`);
  }
}
