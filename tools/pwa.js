// Writes into sw.js the list of every file the game needs
// (tools/offline_files.js), so the service worker keeps a copy of each and
// the game plays offline. Run it after adding or removing a file:
//
//   npm run pwa
//
// tests/pwa.test.js fails until it has been run.

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { offlineFiles } from "./offline_files.js";

const SW = new URL("../sw.js", import.meta.url);
const START = "// The files: written by tools/pwa.js.\n";
const END = "// End of the files.\n";

/**
 * The service worker's source with this list of files in it.
 * @param {string} source
 * @param {string[]} files
 */
export function withFiles(source, files) {
  const [before, rest] = source.split(START);
  const [, after] = rest.split(END);
  return `${before}${START}const FILES = [\n${files.map(f => `  ${JSON.stringify(f)},\n`).join("")}];\n${END}${after}`;
}

// Run, rather than imported by the tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = offlineFiles();
  writeFileSync(SW, withFiles(readFileSync(SW, "utf8"), files));
  console.log(`sw.js keeps ${files.length} files.`);
}
