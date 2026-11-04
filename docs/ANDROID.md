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
- Notifications are off. The shortcut into the browser's site settings
  (holding the app's icon shows it) has to stay on: androidbrowserhelper
  2.7, the library the app is built on, switches that screen on or off at
  every launch, and with the setting off Bubblewrap leaves the screen out,
  so the app crashes before the game opens. Clearing the site's data from
  there would lose the progress on that phone, as it would from Chrome's own
  settings; a progress code brings it back.
- A child's progress lives in the browser's storage for the game's address,
  the same storage as the website's in Chrome on that phone. Uninstalling
  the app doesn't remove it; clearing Chrome's data for the site does.

## What was decided (4 November 2026)

1. **The package name**: `io.github.brendanpshea.whiskerblade`, in Play since
   the first upload. It can never change.
2. **Where the game lives: `brendanpshea.github.io`.** The app trusts one
   address, and that address must serve a file proving it, at
   `/.well-known/assetlinks.json` from the very top of the domain; without
   it the app shows a browser bar. So the file is in the
   `brendanpshea/brendanpshea.github.io` repository (the CV site), with an
   empty `.nojekyll` file at its top, because GitHub Pages otherwise skips
   folders whose names start with a dot. Browser storage belongs to an
   address, so moving the game to a domain of its own later would leave
   saved progress behind at this one (a progress code still carries it
   across).
3. **Play App Signing.** Google keeps the key that signs what people
   install; `android/android.keystore` is the upload key, kept out of git
   and backed up in a password manager. A lost upload key can be replaced
   by asking Play support.

## Set up a computer (once)

Bubblewrap runs with `npx`, pinned to a version in the commands below, so
nothing is installed into the project. It needs a JDK and an Android SDK,
named in `~/.bubblewrap/config.json`:

```json
{
  "jdkPath": "C:\\Users\\brend\\.bubblewrap\\jdk\\jdk-17.0.21+9",
  "androidSdkPath": "C:\\Users\\brend\\.bubblewrap\\android_sdk"
}
```

Brendan's computer has both (set up 4 November 2026), and
`npx @bubblewrap/cli@1.27.0 doctor` says they are valid. For another
computer: `doctor` offers to download them, but on Windows it fetches a
32-bit JDK and 2020's SDK tools, so set them up by hand instead.

1. **JDK 17**, exactly: Bubblewrap refuses any other version, so the JDK 25
   on the PATH won't do. Unzip Temurin 17 for Windows x64, from
   [adoptium.net](https://adoptium.net/temurin/releases/?version=17), into
   `~/.bubblewrap/jdk`.
2. **The Android command-line tools, version 22**
   (`commandlinetools-win-15859902_latest.zip`, from
   `https://dl.google.com/android/repository/`). Move what is inside its
   `cmdline-tools` folder into `~/.bubblewrap/android_sdk`, so that
   `bin\sdkmanager.bat` is directly inside it, where Bubblewrap looks.
   Version 23 replaced sdkmanager with a stand-in for Google's new `android`
   tool, which reads `build-tools;36.1.0` as two packages, so Bubblewrap
   can't install with it. Android Studio's SDK has no command-line tools,
   which is why Bubblewrap gets an SDK of its own.
3. In PowerShell, with `JAVA_HOME` set to the JDK, in that folder:
   `bin\sdkmanager.bat --sdk_root=$PWD --licenses` (this accepts the Android
   SDK licence), then
   `bin\sdkmanager.bat --sdk_root=$PWD --install "build-tools;36.1.0" "platforms;android-36" "platform-tools"`.
4. Write `config.json` as above, and run `doctor`.

`adb`, for putting the app on a phone, is then
`~/.bubblewrap/android_sdk/platform-tools/adb.exe`.

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
- The app runs on Android 7.0 (API level 24) and newer, the oldest that
  androidbrowserhelper 2.7, the library the app is built on, allows.
  Bubblewrap's own default, 21, fails the build.

If the build stops:

- **`'gradlew.bat' is not recognized`**: the terminal has
  `NoDefaultCurrentDirectoryInExePath` set, so Windows won't run a program
  from the folder it's in. Claude Code's shell sets it. Clear it for the
  build (`env -u NoDefaultCurrentDirectoryInExePath npx ...` in bash).
- **`Failed to find target with hash string 'android-36'`**: look in
  `~/.bubblewrap/android_sdk/platforms` for a second copy, such as
  `android-36-2`, delete it, and build again. This happened once, on the
  first build.
- **`EBUSY: resource busy or locked`** during `update`: the Gradle daemon
  from the last build still holds a file. Run `gradlew.bat --stop` in
  `android/` first. If the failed `update` has already deleted `gradlew.bat`,
  restart the computer, or end the `java.exe` that is the Gradle daemon.

## Prove the app and the site belong together

Done: both keys' fingerprints are in `twa-manifest.json` (they aren't
secret), and `https://brendanpshea.github.io/.well-known/assetlinks.json`
lists them. To do it again, for a new key:

1. Get the SHA-256 fingerprint of each key. The upload key's:
   `keytool -list -v -keystore android.keystore -alias whiskerblade`. Google
   Play's signing key's: Play Console, the app, Test and release, Setup, App
   signing (also reached from "Protected with Play"), the SHA-256 under "App
   signing key certificate" (not the SHA-1 above it).
2. Add each, with a name saying whose it is:
   `npx @bubblewrap/cli@1.27.0 fingerprint add <SHA-256> --name="..."`, then
   `npx @bubblewrap/cli@1.27.0 fingerprint generateAssetLinks`, which writes
   `assetlinks.json`. Bubblewrap rewrites all of `twa-manifest.json` as it
   saves; that's fine.
3. Put it in the `brendanpshea.github.io` repository as
   `.well-known/assetlinks.json`.

The navigation bar's divider is set to the bar's own colour:
Bubblewrap drops a colour's alpha, so its see-through default comes out as
a black line above the navigation bar.

## Try it on a phone

Turn on developer options and USB debugging on an Android phone, plug it
in, and `adb install app-release-signed.apk`. Or use Android Studio's
emulator, which has a phone with Play and Chrome:
`emulator -avd Medium_Phone_API_36.1 -read-only` (from
`%LOCALAPPDATA%\Android\Sdk\emulator`; `-read-only` forgets what was
installed). If Chrome has never been opened on the phone, its welcome
screen comes first. Then check that:

- it opens full-screen, with no address bar (if there is one, the
  `assetlinks.json` isn't right yet, or doesn't have this key's
  fingerprint);
- holding the icon shows Site Settings, and nothing else;
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
