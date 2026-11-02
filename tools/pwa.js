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

/**
 * The service worker's source with this list of files in it, between its two
 * marking lines, in the source's own line endings (a Windows checkout's are \r\n).
 * @param {string} source
 * @param {string[]} files
 */
export function withFiles(source, files) {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const list = `const FILES = [${newline}${files.map(f => `  ${JSON.stringify(f)},${newline}`).join("")}];${newline}`;
  const marked = /(\/\/ The files: written by tools\/pwa\.js\.\r?\n)[\s\S]*?(\/\/ End of the files\.)/;
  if (!marked.test(source)) throw new Error("sw.js has lost the lines that mark where its list of files goes");
  return source.replace(marked, (_, start, end) => `${start}${list}${end}`);
}

// Run, rather than imported by the tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = offlineFiles();
  writeFileSync(SW, withFiles(readFileSync(SW, "utf8"), files));
  console.log(`sw.js keeps ${files.length} files.`);
}
