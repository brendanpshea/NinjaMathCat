// tests/android.test.js — the Android app's settings (android/twa-manifest.json,
// for Bubblewrap; see docs/ANDROID.md) agree with the website's own manifest,
// and keep to what a children's app on Google Play needs.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const twa = JSON.parse(readFileSync("android/twa-manifest.json", "utf8"));
const web = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
/** Where the game is: the host, and the folder it lives in. */
const scope = new URL(twa.fullScopeUrl);

/**
 * The file in this repository that a URL of the game's points to.
 * @param {string} url
 */
const fileFor = url => decodeURIComponent(new URL(url).pathname.slice(scope.pathname.length));

describe("the Android app", () => {
  it("is the website's own manifest, by name and colours", () => {
    assert.equal(twa.name, web.name);
    assert.equal(twa.launcherName, web.short_name);
    assert.ok(twa.launcherName.length <= 12, "a launcher name longer than 12 letters gets cut short under the icon");
    assert.equal(twa.themeColor.toLowerCase(), web.theme_color.toLowerCase());
    assert.equal(twa.backgroundColor.toLowerCase(), web.background_color.toLowerCase());
    assert.equal(twa.display, web.display);
  });

  it("opens the game where the website is, telling it that it's the app", () => {
    assert.equal(scope.host, twa.host);
    const start = new URL(twa.startUrl, `https://${twa.host}`);
    assert.ok(start.pathname.startsWith(scope.pathname), `${twa.startUrl} is outside ${scope.pathname}`);
    assert.equal(start.searchParams.get("app"), "android", "the game words things for the app, and links nowhere outside it");
    assert.equal(new URL(web.start_url, twa.fullScopeUrl).pathname, start.pathname);
    for (const url of [twa.iconUrl, twa.maskableIconUrl, twa.webManifestUrl]) {
      assert.equal(new URL(url).host, twa.host, url);
      assert.ok(existsSync(fileFor(url)), `${url} is not a file of the game`);
    }
    assert.ok(web.icons.some(i => i.purpose === "maskable" && i.src === fileFor(twa.maskableIconUrl)));
  });

  it("keeps to what a children's app needs: no notifications, no way into the browser's settings", () => {
    assert.equal(twa.enableNotifications, false);
    assert.equal(twa.enableSiteSettingsShortcut, false, "clearing the site's data there would lose every child's progress");
    assert.match(twa.packageId, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    assert.deepEqual(twa.shortcuts, []);
  });

  it("asks for an Android new enough for the library the app is built on", () => {
    // Bubblewrap 1.27's own default, 21, fails the build: androidbrowserhelper
    // 2.7, which runs the app, needs Android 7.0 (API level 24).
    assert.ok(twa.minSdkVersion >= 24, `minSdkVersion ${twa.minSdkVersion} is below 24`);
  });

  it("keeps its signing key out of git", () => {
    assert.match(twa.signingKey.path, /\.keystore$/);
    const ignored = readFileSync(".gitignore", "utf8").split(/\r?\n/);
    assert.ok(ignored.includes("*.keystore") && ignored.includes("android/*"));
  });
});
