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

  it("keeps to what a children's app needs: no notifications, no shortcuts into the game", () => {
    assert.equal(twa.enableNotifications, false);
    assert.match(twa.packageId, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    assert.deepEqual(twa.shortcuts, []);
  });

  it("keeps the site-settings shortcut, which the app can't start without", () => {
    // androidbrowserhelper 2.7 switches its "manage data" screen on or off at
    // every launch. With the shortcut off, Bubblewrap leaves that screen out of
    // the app, and the app crashes before the game opens.
    assert.equal(twa.enableSiteSettingsShortcut, true);
  });

  it("asks for an Android new enough for the library the app is built on", () => {
    // Bubblewrap 1.27's own default, 21, fails the build: androidbrowserhelper
    // 2.7, which runs the app, needs Android 7.0 (API level 24).
    assert.ok(twa.minSdkVersion >= 24, `minSdkVersion ${twa.minSdkVersion} is below 24`);
  });

  it("draws no line over the navigation bar", () => {
    // Bubblewrap drops a colour's alpha, so a see-through divider comes out black.
    assert.equal(twa.navigationDividerColor, twa.navigationColor);
    assert.equal(twa.navigationDividerColorDark, twa.navigationColorDark);
  });

  it("names the keys whose apps the site trusts: Google Play's signing key and the upload key", () => {
    // tools: `npx @bubblewrap/cli@1.27.0 fingerprint generateAssetLinks` makes the
    // site's /.well-known/assetlinks.json from these (docs/ANDROID.md).
    assert.equal(twa.fingerprints.length, 2);
    for (const { name, value } of twa.fingerprints) {
      assert.ok(name, "each fingerprint says whose key it is");
      assert.match(value, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/, `${name}: a SHA-256, 32 pairs`);
    }
  });

  it("keeps its signing key out of git", () => {
    assert.match(twa.signingKey.path, /\.keystore$/);
    const ignored = readFileSync(".gitignore", "utf8").split(/\r?\n/);
    assert.ok(ignored.includes("*.keystore") && ignored.includes("android/*"));
  });
});
