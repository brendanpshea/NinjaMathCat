// Every file the game needs to play, relative to the site's root: the page,
// its manifest and icons, the styles, every module, and every backdrop,
// sprite and treasure picture the game can show. The service worker (sw.js) keeps a copy of each,
// so the game plays offline; tools/pwa.js writes this list into it, and
// tests/pwa.test.js checks that it's complete.

import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { BACKDROPS } from "../src/backdrops.js";
import { HEROES, heroSprite } from "../src/heroes.js";
import { MONSTERS, monsterSprite } from "../src/monsters.js";
import { DRAWN } from "../src/treasure_art.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

/**
 * The files in a folder and the folders in it, with one of these endings.
 * @param {string} folder  relative to the root
 * @param {string[]} endings
 */
function filesIn(folder, endings) {
  return readdirSync(join(ROOT, folder), { recursive: true, withFileTypes: true })
    .filter(f => f.isFile() && endings.some(e => f.name.endsWith(e)))
    .map(f => relative(ROOT, join(f.parentPath, f.name)).split(sep).join("/"));
}

/** @returns {string[]}  sorted, so the list only changes when the files do */
export function offlineFiles() {
  return [...new Set([
    "./",
    "index.html",
    "manifest.webmanifest",
    ...filesIn("assets/icons", [".png"]),
    ...filesIn("css", [".css"]),
    ...filesIn("src", [".js"]),
    ...BACKDROPS.map(b => b.file),
    ...HEROES.map(heroSprite),
    ...MONSTERS.map(monsterSprite),
    ...[...DRAWN].map(id => `assets/treasures/${id}.webp`),
  ])].sort();
}
