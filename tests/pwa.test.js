// tests/pwa.test.js — installing the game as an app, and playing it offline:
// the manifest and its icons, and the files the service worker (sw.js) keeps.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { offlineFiles } from "../tools/offline_files.js";
import { withFiles } from "../tools/pwa.js";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));

/** A PNG's width and height, from its header. */
function pngSize(path) {
  const png = read(path);
  assert.equal(png.toString("latin1", 1, 4), "PNG", `${path} is a PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe("installing the game", () => {
  const manifest = JSON.parse(read("manifest.webmanifest").toString("utf8"));
  const page = read("index.html").toString("utf8");

  it("has a manifest that installs it from wherever the site is, such as GitHub Pages under a folder", () => {
    assert.equal(manifest.name, "Ninja Math Cat");
    assert.ok(manifest.short_name.length <= 12, "a short name that fits under an icon");
    assert.deepEqual([manifest.start_url, manifest.scope, manifest.id], ["./", "./", "./"]);
    assert.equal(manifest.display, "standalone");
    const theme = page.match(/<meta name="theme-color" content="([^"]+)">/)?.[1];
    assert.deepEqual([manifest.theme_color, manifest.background_color], [theme, theme]);
  });

  it("has icons of the sizes it says, one of them for any shape a phone cuts", () => {
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split("x").map(Number);
      assert.deepEqual(pngSize(icon.src), [w, h], icon.src);
    }
    const sizes = manifest.icons.map(i => i.sizes);
    assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
    assert.ok(manifest.icons.some(i => i.purpose === "maskable"));
  });

  it("links the manifest and the icons from the page", () => {
    for (const [rel, href] of [["manifest", "manifest.webmanifest"], ["apple-touch-icon", "assets/icons/apple-touch-icon.png"], ["icon", "assets/icons/icon-192.png"]]) {
      assert.match(page, new RegExp(`<link rel="${rel}" href="${href}"`), rel);
      assert.ok(existsSync(new URL(`../${href}`, import.meta.url)), href);
    }
    assert.deepEqual(pngSize("assets/icons/apple-touch-icon.png"), [180, 180]);
  });
});

describe("playing offline", () => {
  it("keeps a copy of every file the game needs: run `npm run pwa` after adding or removing one", () => {
    const source = read("sw.js").toString("utf8");
    assert.equal(source, withFiles(source, offlineFiles()), "sw.js's list of files is out of date: run npm run pwa");
  });

  it("lists only files that are there, every module, and every picture the game can show", () => {
    const files = offlineFiles();
    for (const file of files) assert.ok(file === "./" || existsSync(new URL(`../${file}`, import.meta.url)), file);
    for (const needed of ["./", "index.html", "manifest.webmanifest", "src/main.js", "src/ui/app.js", "css/game.css", "assets/sprites/heroes/cat_ninja.webp", "assets/backdrops/meadow.webp"]) {
      assert.ok(files.includes(needed), needed);
    }
    // The pictures made for the backdrops are far too big to keep, and the game never shows them.
    assert.ok(!files.some(f => f.includes("sheets/") || f.startsWith("legacy/") || f.startsWith("tests/")));
  });
});
