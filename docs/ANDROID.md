# Whiskerblade for Android

How the Android app for Google Play is made, what is set up already, what
to decide before the first release, and each step from this computer to
the store. The store listing itself is in [STORE.md](STORE.md).

## How it works

The Android app is a Trusted Web Activity: a small Android app that opens
the website full-screen in the phone's browser (usually Chrome), with no
address bar. There is no second copy of the game. A change to the website
is a change to the app, and it plays offline through the website's own
service worker.

- `android/twa-manifest.json` is the app's settings: its package name,
  where the game is, its name, colours and icons. It is the only file in
  `android/` kept in git. [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap),
  Google's tool for these apps, makes the Android project from it each time.
- The app opens the game at `/NinjaMathCat/?app=android`. The game then says
  progress is kept "on this device" rather than "in this browser", and the
  title screen leaves out its links to GitHub and the original game, so
  nothing in the app leads out to the web. `tests/android.test.js` keeps the
  settings in step with `manifest.webmanifest`.
- Notifications are off, and so is the shortcut into the browser's site
  settings: clearing the site's data there would lose every child's
  progress.
- A child's progress lives in the browser's storage for the game's address,
  the same storage as the website's in Chrome on that phone. Uninstalling
  the app doesn't remove it; clearing Chrome's data for the site does.

## Decide before the first release

1. **The package name**: `io.github.brendanpshea.whiskerblade`. It can't be
   changed once an app is uploaded to Play.
2. **Where the game lives.** The app trusts one address, and that address
   must serve a file proving it, at `/.well-known/assetlinks.json` from the
   very top of the domain. Without it the app shows a browser bar. Two ways:
   - **Keep `brendanpshea.github.io`.** No cost. The file goes in the
     `brendanpshea/brendanpshea.github.io` repository (the CV site), as
     `.well-known/assetlinks.json`, with an empty `.nojekyll` file at its top,
     because GitHub Pages otherwise skips folders whose names start with a
     dot.
   - **A domain of its own**, such as whiskerblade.app, set in this
     repository's Pages settings; the file then lives in this repository.
     A domain costs a yearly fee.

   Choose before children use the app. Browser storage belongs to an
   address, so moving the game later leaves saved progress behind at the old
   one (a progress code still carries it across).
3. **The signing key.** Use Play App Signing, which Play offers when the
   first bundle is uploaded: Google keeps the key that signs what people
   install, and you keep an upload key. A lost upload key can be replaced by
   asking Play support; a lost signing key, if you kept it yourself, can't.

## Set up this computer (once)

Bubblewrap runs with `npx`, pinned to a version in the commands below, so
nothing is installed into the project.

1. Run `npx @bubblewrap/cli@1.27.0 doctor`. The first time, it asks whether
   to download a JDK and the Android SDK into your home folder
   (`~/.bubblewrap`). Say yes to both, and accept the Android SDK licence.
   It needs JDK 17 exactly, so the JDK 25 already installed won't do, and
   Android Studio's SDK folder isn't laid out the way it expects.
2. To install the app on a phone you'll want `adb`, which Android Studio
   already has: `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`.

## Make the upload key (once)

```sh
cd android
keytool -genkeypair -v -keystore android.keystore -alias whiskerblade -keyalg RSA -keysize 2048 -validity 10000
```

It asks for two passwords and a name. Keep the `android.keystore` file and
both passwords in a password manager, with a copy somewhere other than this
computer. Git ignores it; never commit it.

## Build

```sh
cd android
npx @bubblewrap/cli@1.27.0 update
npx @bubblewrap/cli@1.27.0 build
```

- `update` makes the Android project from `twa-manifest.json`, fetching the
  icons from the live site, and raises `appVersionCode`, which Play needs
  higher for every upload. Add `--skipVersionUpgrade` to remake the same
  version.
- `build` asks for the key's passwords (or set `BUBBLEWRAP_KEYSTORE_PASSWORD`
  and `BUBBLEWRAP_KEY_PASSWORD`), checks the live site with PageSpeed
  Insights (`--skipPwaValidation` skips that), and makes
  `app-release-bundle.aab` to upload to Play and `app-release-signed.apk`
  to try on a phone.
- Bubblewrap 1.27 builds for Android 16 (API level 36), which Play requires
  of new apps and updates from 31 August 2026. Play raises the level every
  August, so once a year move to the newest Bubblewrap, then update, build
  and upload.

## Prove the app and the site belong together

1. Get the SHA-256 fingerprint of each key. The upload key's:
   `keytool -list -v -keystore android.keystore -alias whiskerblade`. The
   signing key's, once the app is in Play: Play Console, the app, Test and
   release, App integrity, App signing.
2. Add each: `npx @bubblewrap/cli@1.27.0 fingerprint add <SHA-256>` (they are
   kept in `twa-manifest.json`; fingerprints aren't secret), then
   `npx @bubblewrap/cli@1.27.0 fingerprint generateAssetLinks`, which writes
   `assetlinks.json`.
3. Publish it at `https://<the game's domain>/.well-known/assetlinks.json`,
   as decided above.

## Try it on a phone

Turn on developer options and USB debugging on an Android phone, plug it
in, and `adb install app-release-signed.apk`. Then check that:

- it opens full-screen, with no address bar (if there is one, the
  `assetlinks.json` isn't right yet);
- the title screen has no Source code link, and says progress is saved on
  this device;
- it plays with the phone in airplane mode, once it has been opened online;
- progress is still there after closing the app and opening it again;
- the back button and the status bar look right.

## Put it on Google Play

1. **A developer account**, with a one-time fee. A personal account made
   since November 2023 must run a closed test, with at least 12 testers
   opted in for 14 days in a row, before it can publish. Line up testers
   early (family, friends, a class's grown-ups): each needs a Google account
   and an Android phone, and should really play.
2. **Create the app** in Play Console, and fill in App content: the privacy
   policy (`https://brendanpshea.github.io/NinjaMathCat/privacy.html`),
   target audience (ages 5 to 8 and 9 to 12, so the Families policy
   applies), ads (none), data safety (nothing collected or shared), and the
   content rating questionnaire. [STORE.md](STORE.md) has the answers and the
   listing.
3. **Upload** `app-release-bundle.aab` to the closed testing track, accept
   Play App Signing, add the signing key's fingerprint to `assetlinks.json`
   (above), and invite the testers.
4. After the 14 days, apply for production access, then release.

## After that

The game updates with the website, with no new Android build. A new build
is needed only when `twa-manifest.json` changes, and once a year for Play's
new API level.
