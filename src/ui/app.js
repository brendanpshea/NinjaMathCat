// The game's screens and the way between them. The title asks who is playing;
// a player's map shows their grade's adventure, chapter by chapter; a chapter
// starts with a note on its topic; each level is a short battle; and after it
// comes how it went, topic by topic. The training ground, a quick battle, the
// treasures, a progress report for grown-ups and the player's choices are a
// tap away from the map. Every answer teaches the game what the player knows
// (src/mastery.js), and progress is saved after every answer and every level,
// so leaving loses nothing but the level being played.

import { GRADES, typeById } from "../curriculum.js";
import { HEROES, heroSprite } from "../heroes.js";
import { MONSTERS, buildAdventure, monsterSprite } from "../monsters.js";
import { backdropFor } from "../backdrops.js";
import { startBattle } from "../battle.js";
import { levelForXp } from "../combat.js";
import { KEEPSAKES, chapterTreasure, gradeTreasure, treasuresWon, newlyWon } from "../treasures.js";
import { DRAWN } from "../treasure_art.js";
import { monstersMet, bookPages } from "../monster_book.js";
import {
  ADVENTURE_GRADES, chaptersFor, levelsFor, levelName, planLevel, planTraining, settingFor, exampleFor,
  recordLevel, levelStates, nextLevel, openChapter, starsFor, residents,
} from "../adventures.js";
import { learn, strength, dayNumber } from "../mastery.js";
import { loadSave, writeSave, addPlayer, importPlayer, updatePlayer, removePlayer, currentPlayer, progressIn, MOST_PLAYERS, LONGEST_NAME, READ_ALOUD_UP_TO } from "../save.js";
import { encodePlayer, decodePlayer } from "../progress_code.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { createBattleScreen, choiceHtml, pictureHtml } from "./battle_screen.js";
import { still } from "./sprites.js";
import { runScene } from "./scene_view.js";
import { sceneFor } from "../scenes.js";
import { startChallenge, recordChallenge, CHALLENGE_FROM, CHALLENGE_SECONDS } from "../challenge.js";
import { classView, codesIn, addCodes, playerFromCode } from "../classroom.js";
import { talkAbout } from "../talk.js";
import { readButton } from "../speech.js";
import { icon } from "./icons.js";
import { createChallengeScreen } from "./challenge_screen.js";

/** @import { Battle } from "../battle.js" */
/** @import { Level } from "../adventures.js" */
/** @import { Rng } from "../rng.js" */
/** @import { Save, Player } from "../save.js" */
/** @import { SoundSystem } from "../sound.js" */
/** @import { Speaker } from "../speech.js" */

/** @typedef {"title" | "player" | "map" | "note" | "scene" | "battle" | "level-done" | "training-done" | "victory" | "treasures" | "report" | "challenge" | "challenge-done" | "class"} ScreenName */
/** @import { Outcome } from "../mastery.js" */

/** What each kind of level is called on the map. */
const KIND_NAMES = { learn: "New topic", practice: "Practice", review: "Review", boss: "Boss" };

/** How well a kind of question is known, in words for grown-ups. */
const STRENGTH_WORDS = { new: "Not met yet", practise: "Needs practice", growing: "Getting there", strong: "Strong" };

/**
 * "a", "a and b", "a, b and c"
 * @param {string[]} items
 */
function list(items) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * How each kind of question went in a battle, in the order first asked.
 * @param {{ type: string, outcome: Outcome }[]} answers
 */
function byKind(answers) {
  /** @type {Map<string, { asked: number, firstTry: number }>} */
  const kinds = new Map();
  for (const { type, outcome } of answers) {
    const k = kinds.get(type) ?? { asked: 0, firstTry: 0 };
    kinds.set(type, { asked: k.asked + 1, firstTry: k.firstTry + Number(outcome === "firstTry") });
  }
  return [...kinds].map(([type, k]) => ({ type, name: typeById(type).name, ...k }));
}

/**
 * What a battle says topic by topic: what went well, and what to keep at.
 * @param {{ type: string, outcome: Outcome }[]} answers
 */
function topicNote(answers) {
  const kinds = byKind(answers);
  const great = kinds.filter(k => k.asked >= 2 && k.firstTry === k.asked).map(k => k.name);
  const keep = kinds.filter(k => k.firstTry < k.asked).map(k => k.name);
  return [great.length > 0 ? `Great at ${list(great)}!` : "", keep.length > 0 ? `Keep practising ${list(keep)}.` : ""].filter(Boolean).join(" ");
}

/**
 * A grade as it reads in a sentence: "kindergarten", "3rd grade".
 * @param {number} grade
 */
export function gradeWords(grade) {
  return grade === 0 ? "kindergarten" : (GRADES.find(g => g.grade === grade)?.label ?? `grade ${grade}`);
}

/**
 * Stars as a picture, with words for a screen reader.
 * @param {number} stars
 */
function starsHtml(stars) {
  return `<span class="stars" role="img" aria-label="${stars} of 3 stars">${"★".repeat(stars)}<span class="stars-off">${"★".repeat(3 - stars)}</span></span>`;
}

/**
 * A treasure's picture: its drawing once it has one, its emoji until then.
 * The name beside it says what it is, so the picture is left unread.
 * @param {{ id: string, emoji: string }} t
 * @param {string} [size]  "big" for a treasure just won
 */
function treasureArt(t, size = "") {
  const className = `treasure-art${size ? ` treasure-art--${size}` : ""}`;
  return DRAWN.has(t.id)
    ? `<img class="${className}" src="assets/treasures/${t.id}.webp" alt="" width="256" height="256" decoding="async">`
    : `<span class="${className} is-emoji" aria-hidden="true">${t.emoji}</span>`;
}

/**
 * What a keepsake found by remembering was for: "You remembered telling time after 5 days."
 * @param {import("../save.js").Remembered | import("../battle.js").Stuck} r
 */
function rememberedLine(r) {
  return `You remembered ${typeById(r.type).name.toLowerCase()} after ${r.after} days.`;
}

/**
 * A treasure just won, shown big, with what it was won for.
 * @param {{ id: string, emoji: string, name: string }} t
 * @param {string} kicker  what kind of treasure: "Chapter treasure", "It stuck!"
 * @param {string} line
 */
function revealCard(t, kicker, line) {
  return `<div class="card treasure-reveal">
    ${treasureArt(t, "big")}
    <div class="reveal-words">
      <p class="reveal-kicker">${esc(kicker)}</p>
      <h2 class="reveal-name">${esc(t.name)}</h2>
      <p class="reveal-line">${esc(line)}</p>
    </div>
  </div>`;
}

/**
 * The treasures a battle brought: chapter treasures won with it, and a
 * keepsake if something stuck (or, once every keepsake is had, just the news).
 * @param {import("../treasures.js").ChapterTreasure[]} won
 * @param {import("../battle.js").Stuck | null} stuck
 */
function revealsHtml(won, stuck) {
  const chapters = won.map(t => revealCard(t, t.chapter === null ? "Grade treasure" : "Chapter treasure", t.line));
  const kept = stuck?.keepsake ? [revealCard(stuck.keepsake, "It stuck!", rememberedLine(stuck))]
    : stuck ? [`<div class="card treasure-reveal is-plain"><div class="reveal-words"><p class="reveal-kicker">It stuck!</p><p class="reveal-line">${esc(rememberedLine(stuck))}</p></div></div>`]
    : [];
  return [...chapters, ...kept].join("");
}

/**
 * How many treasures a player has: keepsakes, and chapter and grade treasures in every grade.
 * @param {Player} player
 */
function treasureCount(player) {
  return player.treasures.length + ADVENTURE_GRADES.reduce((sum, g) => sum + treasuresWon(g, player.adventures[g]).length, 0);
}

/**
 * @param {HTMLElement} root
 * @param {object} options
 * @param {Storage | null} options.storage
 * @param {SoundSystem} options.sound
 * @param {Speaker} [options.speech]  to read aloud, where the browser can
 * @param {Rng} options.rng
 * @param {number} [options.challengeSeconds]  how long the one-minute challenge lasts; shorter in the tests
 * @param {boolean} [options.inApp]  in the Android app: progress is "on this device", not "in this
 *   browser", and nothing links out to the web, as Google Play's rules for children's apps ask
 */
export function createApp(root, { storage, sound, speech, rng, challengeSeconds = CHALLENGE_SECONDS, inApp = false }) {
  /** @type {Save} */
  let save = loadSave(storage);
  sound.enabled = !save.muted;
  /** @type {ScreenName} */
  let screen = "title";
  /** @type {{ destroy(): void, battle: Battle } | null} */
  let battleScreen = null;
  /** @type {{ destroy(): void, readonly challenge: import("../challenge.js").Challenge } | null} */
  let challengeScreen = null;
  /** What has been played since the page was opened, for the progress report. */
  const session = { battles: 0, asked: 0, firstTry: 0, started: Date.now(), restSuggested: false, warmedUp: new Set() };
  /** How long play has gone on since the game was opened, before a break is suggested, in minutes. */
  const REST_AFTER = 15;
  /** How many battles go by before a level's end suggests keeping a copy of the progress again. */
  const BACKUP_EVERY = 8;
  /** Where progress is kept, as the screens say it: an app keeps it on the device, a website in the browser. */
  const kept = inApp ? { where: "on this device", whose: "this device's" } : { where: "in this browser", whose: "this browser's" };

  root.innerHTML = `
    <header class="top">
      <span class="brand" aria-hidden="true">Whiskerblade</span>
      <button type="button" class="quiet sound" data-ref="sound"></button>
    </header>
    <div class="screen" data-ref="screen"></div>`;
  const screenEl = /** @type {HTMLElement} */ (root.querySelector("[data-ref=screen]"));
  const soundButton = /** @type {HTMLButtonElement} */ (root.querySelector("[data-ref=sound]"));

  /** @param {Save} next */
  const commit = next => {
    save = next;
    writeSave(storage, save);
  };
  /** The player chosen; every screen but the title and a new player's has one. */
  const me = () => /** @type {Player} */ (currentPlayer(save));
  /** @param {Partial<Omit<Player, "id">>} changes */
  const change = changes => commit(updatePlayer(save, me().id, changes));
  /** @param {Player | null} player */
  const heroOf = player => HEROES.find(h => h.id === player?.heroId) ?? HEROES[0];

  function showSound() {
    soundButton.innerHTML = `<span aria-hidden="true">${save.muted ? "🔇" : "🔊"}</span><span class="sound-word"> Sound ${save.muted ? "off" : "on"}</span>`;
    soundButton.setAttribute("aria-pressed", String(!save.muted));
  }
  soundButton.addEventListener("click", () => {
    commit({ ...save, muted: !save.muted });
    sound.enabled = !save.muted;
    sound.play("click");
    showSound();
  });
  showSound();

  /**
   * Swap in a screen, and put focus on its heading so it is announced.
   * @param {ScreenName} name
   * @param {string} markup
   */
  function show(name, markup) {
    // Whatever was being read out belongs to the screen being left.
    speech?.stop();
    battleScreen?.destroy();
    battleScreen = null;
    challengeScreen?.destroy();
    challengeScreen = null;
    screen = name;
    root.dataset.screen = name;
    screenEl.innerHTML = markup;
    screenEl.querySelector("h1")?.focus();
    window.scrollTo?.(0, 0);
  }

  /** @param {string} name */
  const part = name => /** @type {HTMLElement} */ (screenEl.querySelector(`[data-ref="${name}"]`));
  /**
   * Run `act` on a click, with the click sound.
   * @param {HTMLElement | null} el
   * @param {() => void} act
   */
  const onTap = (el, act) => el?.addEventListener("click", () => { sound.play("click"); act(); });

  // ---------------------------------------------------------------- the title

  /**
   * The browser's offer to install the game as an app, once it makes one
   * (Chrome and Edge do, as beforeinstallprompt), kept to make on the title.
   * @type {{ prompt(): Promise<unknown> } | null}
   */
  let installOffer = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installOffer = /** @type {any} */ (event);
    if (screen === "title") showInstall();
  });
  window.addEventListener("appinstalled", () => {
    installOffer = null;
    if (screen === "title") showInstall();
  });

  /**
   * On the title, how to install the game, where it isn't already: the
   * browser's own offer, or on an iPhone or iPad, where to find it.
   */
  function showInstall() {
    const box = part("install");
    if (!box) return;
    const installed = globalThis.matchMedia?.("(display-mode: standalone)").matches || /** @type {any} */ (navigator).standalone === true;
    const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    box.innerHTML = installed ? ""
      : installOffer ? `<button type="button" class="link" data-act="install">Install the game on this device</button>. It opens like an app, and plays with no internet.`
      : apple ? "To keep the game on your home screen, tap Share, then Add to Home Screen. It plays with no internet." : "";
    box.hidden = box.innerHTML === "";
  }

  function title() {
    // A monster from somewhere in the game, at home in front of its own backdrop.
    const foe = rng.pick(MONSTERS);
    const scene = backdropFor(foe.setting);
    const hero = heroOf(currentPlayer(save) ?? save.players[0] ?? null);
    show("title", `
      <section class="title-screen">
        <div class="title-stage" style="background-image: url('${scene.file}'); --floor: ${scene.floor}">
          <div class="title-words">
            <h1 tabindex="-1">Whiskerblade</h1>
            <p class="tagline">Answer math questions to power up your hero and beat the monsters!</p>
          </div>
          <div class="title-fighter title-fighter--hero">
            <span class="title-plate">${esc(hero.name)}</span>
            <span data-ref="banner-hero"></span>
          </div>
          <div class="title-fighter title-fighter--monster">
            <span class="title-plate">${esc(foe.name)}</span>
            <span data-ref="banner-monster"></span>
          </div>
        </div>
        <section class="card">
          <h2 class="card-title">Who's playing?</h2>
          ${save.players.length === 0 ? `<p class="lead">New here? Make a player, and your adventure starts.</p>` : ""}
          <ul class="player-list">${save.players.map(p => {
            const levels = levelsFor(p.grade);
            const done = levels.filter(l => progressIn(p, p.grade).done[l.id]).length;
            const gradeName = gradeWords(p.grade);
            return `<li><button type="button" class="player-card" data-player="${p.id}">
              <span class="player-hero" data-hero="${p.heroId}"></span>
              <span class="player-name">${esc(p.name)}</span>
              <span class="player-note">${esc(gradeName[0].toUpperCase() + gradeName.slice(1))} · ${done} of ${levels.length} levels</span>
            </button></li>`;
          }).join("")}
            ${save.players.length < MOST_PLAYERS ? `<li><button type="button" class="player-card player-card--new" data-ref="new-player">
              <span class="player-plus" aria-hidden="true">+</span><span class="player-name">New player</span></button></li>` : ""}
          </ul>
          ${save.players.length < MOST_PLAYERS ? `<div class="code-in" data-ref="code-in">
            <button type="button" class="link" data-act="ask">Have a progress code from another device?</button>
          </div>` : ""}
        </section>
        <footer class="title-footer">
          <p>Each grade's adventure follows the Common Core math standards, from kindergarten to 6th grade, in forty short levels. It is free, with nothing to sign up for: everyone's progress is saved ${kept.where} only.</p>
          <p class="install" data-ref="install" hidden></p>
          <p><button type="button" class="link" data-ref="class">For teachers: the class view</button></p>
          <p><a href="privacy.html">Privacy</a> · ${inApp ? "" : `<a href="https://github.com/brendanpshea/NinjaMathCat">Source code</a> · <a href="legacy/">The original Ninja Math Cat</a> · `}Free software (GPL-3.0)</p>
        </footer>
      </section>`);
    part("banner-hero").replaceChildren(still(heroSprite(hero), hero.name));
    part("banner-monster").replaceChildren(still(monsterSprite(foe), foe.name));
    for (const spot of screenEl.querySelectorAll(".player-hero")) {
      const h = HEROES.find(x => x.id === /** @type {HTMLElement} */ (spot).dataset.hero) ?? HEROES[0];
      spot.replaceChildren(still(heroSprite(h)));
    }
    screenEl.querySelector(".player-list")?.addEventListener("click", event => {
      const card = /** @type {HTMLElement} */ (event.target).closest("[data-player]");
      if (!(card instanceof HTMLElement)) return;
      sound.play("click");
      commit({ ...save, current: card.dataset.player ?? null });
      map();
    });
    onTap(part("new-player"), () => playerForm(null));
    onTap(part("class"), () => grownUp(() => classPage()));
    showInstall();
    part("install").addEventListener("click", async event => {
      if (!(/** @type {HTMLElement} */ (event.target).closest("[data-act=install]")) || !installOffer) return;
      sound.play("click");
      const offer = installOffer;
      installOffer = null;
      await offer.prompt();
      showInstall();
    });
    part("code-in")?.addEventListener("click", event => {
      const act = /** @type {HTMLElement} */ (event.target).closest("button")?.dataset.act;
      if (!act) return;
      sound.play("click");
      const box = part("code-in");
      if (act === "ask") {
        box.innerHTML = `<label class="card-title" for="code-in">Paste the progress code</label>
          <textarea id="code-in" class="code-box" data-ref="code-text" rows="4" spellcheck="false" autocomplete="off"></textarea>
          <p class="code-error" data-ref="code-error" aria-live="polite"></p>
          <div class="actions"><button type="button" class="primary" data-act="add">Add this player</button>
          <button type="button" class="quiet" data-act="cancel">Cancel</button></div>`;
        /** @type {HTMLElement} */ (box.querySelector("textarea")).focus();
      } else if (act === "cancel") {
        title();
      } else {
        const stored = decodePlayer(/** @type {HTMLTextAreaElement} */ (part("code-text")).value);
        const added = stored && importPlayer(save, stored);
        if (!added) {
          part("code-error").textContent = "That code didn't work. Check that all of it was copied, from NMC1- to the end.";
          return;
        }
        commit(added.save);
        map();
      }
    });
  }

  // ------------------------------------------- keeping a copy, and grown-ups

  /**
   * Wire up a box that shows the player's progress code and copies it: a
   * "show" button, then the code and a "copy" button. Showing it counts as
   * keeping a copy, so the reminder to keep one waits a while.
   * @param {HTMLElement | null} box
   */
  function offerCode(box) {
    box?.addEventListener("click", async event => {
      const button = /** @type {HTMLElement} */ (event.target).closest("button");
      const act = button?.dataset.act;
      if (act !== "show" && act !== "copy") return;
      sound.play("click");
      const player = me();
      if (act === "show") {
        button?.insertAdjacentHTML("afterend", `<label class="visually-hidden" for="code-out">${esc(player.name)}'s progress code</label>
          <textarea id="code-out" class="code-box" data-ref="code-text" rows="4" readonly>${esc(encodePlayer(player))}</textarea>
          <div class="actions"><button type="button" class="quiet" data-act="copy">Copy the code</button><span class="code-copied" data-ref="code-copied" aria-live="polite"></span></div>`);
        button?.remove();
        /** @type {HTMLTextAreaElement} */ (box.querySelector("[data-ref=code-text]")).select();
        change({ backedUp: player.played });
      } else {
        const code = /** @type {HTMLTextAreaElement} */ (box.querySelector("[data-ref=code-text]"));
        const said = /** @type {HTMLElement} */ (box.querySelector("[data-ref=code-copied]"));
        code.select();
        try {
          await navigator.clipboard.writeText(code.value);
          said.textContent = "Copied!";
        } catch {
          said.textContent = "Select the code and copy it.";
        }
      }
    });
  }

  /**
   * Go on to something for grown-ups: at once, or, with the grown-up lock on,
   * once a multiplication a young child can't do has been answered. The lock
   * keeps children from changing things by accident; it is no password.
   * @param {() => void} then
   */
  function grownUp(then) {
    if (!save.locked) {
      then();
      return;
    }
    const [a, b] = [rng.int(12, 19), rng.int(3, 9)];
    const dialog = document.createElement("dialog");
    dialog.className = "lock-dialog";
    dialog.innerHTML = `<form class="lock-form" data-ref="lock-form">
        <h2 class="card-title">For grown-ups</h2>
        <label for="lock-answer">What is ${a} × ${b}?</label>
        <input id="lock-answer" class="name-input" data-ref="lock-answer" type="text" inputmode="numeric" autocomplete="off">
        <p class="code-error" data-ref="lock-error" aria-live="polite"></p>
        <div class="actions"><button type="submit" class="primary">Go on</button>
        <button type="button" class="quiet" data-ref="lock-cancel">Cancel</button></div>
      </form>`;
    root.append(dialog);
    const input = /** @type {HTMLInputElement} */ (dialog.querySelector("[data-ref=lock-answer]"));
    const close = () => {
      dialog.close();
      dialog.remove();
    };
    dialog.querySelector("form")?.addEventListener("submit", event => {
      event.preventDefault();
      if (Number(input.value.trim()) === a * b) {
        sound.play("click");
        close();
        then();
      } else {
        /** @type {HTMLElement} */ (dialog.querySelector("[data-ref=lock-error]")).textContent = "That isn't it. This part is for grown-ups.";
        input.select();
      }
    });
    onTap(dialog.querySelector("[data-ref=lock-cancel]"), close);
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.showModal();
    input.focus();
  }

  // ------------------------------------------------- a new player, or a change

  /**
   * Choose a name, a hero and a grade: for a new player, or to change one.
   * @param {Player | null} player  null for a new player
   */
  function playerForm(player) {
    const heroId = player?.heroId ?? HEROES[0].id;
    const grade = player?.grade ?? ADVENTURE_GRADES[0];
    show("player", `
      <section class="player-screen">
        <h1 tabindex="-1">${player ? `${esc(player.name)}'s choices` : "New player"}</h1>
        <div class="card">
          <label class="card-title" for="player-name">Your name</label>
          <input id="player-name" class="name-input" data-ref="name" type="text" maxlength="${LONGEST_NAME}" autocomplete="off" spellcheck="false"
            value="${esc(player?.name ?? "")}" placeholder="Player ${save.players.length + 1}">
          <p class="field-hint">A first name or a nickname is plenty. It stays on this device.</p>
        </div>
        <fieldset class="card">
          <legend>Choose your hero</legend>
          <div class="heroes">${HEROES.map(h => `
            <label class="hero-choice" data-hero="${h.id}">
              <input type="radio" name="hero" value="${h.id}"${h.id === heroId ? " checked" : ""}>
              <span class="hero-name">${esc(h.name)}</span>
            </label>`).join("")}
          </div>
        </fieldset>
        <fieldset class="card" data-ref="grade">
          <legend>Choose your grade</legend>
          <div class="grade-years">${ADVENTURE_GRADES.map(y => `
            <label class="grade-choice">
              <input type="radio" name="grade" value="${y}"${y === grade ? " checked" : ""}>
              <span class="grade-number" aria-hidden="true">${y === 0 ? "K" : y}</span>
              <span class="grade-word">${y === 0 ? "Kinder&shy;garten" : `${esc(gradeWords(y).replace(" grade", ""))}<span class="visually-hidden"> grade</span>`}</span>
            </label>`).join("")}
          </div>
          <div class="practice" data-ref="practice" aria-live="polite"></div>
        </fieldset>
        ${speech?.available ? `<div class="card">
          <label class="check"><input type="checkbox" data-ref="read-aloud"${(player ? player.readAloud : grade <= READ_ALOUD_UP_TO) ? " checked" : ""}>
            Read questions aloud</label>
          <p class="field-hint">Good for children still learning to read. There is also a "Read to me" button on every question.</p>
        </div>` : ""}
        <div class="start-bar">
          <button type="button" class="primary big" data-ref="save">${player ? "Save" : "Start my adventure!"}</button>
          <button type="button" class="quiet" data-ref="back">Back</button>
        </div>
        ${player ? `<div class="card" data-ref="code-out">
          <h2 class="card-title">Keep a copy, or move to another device</h2>
          <p class="field-hint">A progress code carries ${esc(player.name)}'s hero, levels and treasures. Keep it in a note, or email it to yourself, in case ${kept.whose} data is ever cleared. To move to another ${inApp ? "device" : "browser"}, choose "Have a progress code from another device?" there, and paste it in.</p>
          <button type="button" class="quiet" data-act="show">Show the progress code</button>
        </div>` : ""}
        ${player ? `<div class="card remove" data-ref="remove">
          <button type="button" class="quiet danger" data-act="ask">Remove ${esc(player.name)}</button>
        </div>` : ""}
      </section>`);

    for (const label of screenEl.querySelectorAll(".hero-choice")) {
      const h = HEROES.find(x => x.id === /** @type {HTMLElement} */ (label).dataset.hero);
      if (h) label.prepend(still(heroSprite(h)));
    }
    const chosen = (/** @type {string} */ name) => /** @type {HTMLInputElement | null} */ (screenEl.querySelector(`input[name=${name}]:checked`))?.value;
    const showChapters = () => {
      const year = Number(chosen("grade") ?? 0);
      part("practice").innerHTML = `
        <p class="practice-head">The ${esc(gradeWords(year))} adventure</p>
        <ol class="topics">${chaptersFor(year).map(c => `<li>${esc(c.title)}</li>`).join("")}</ol>`;
    };
    showChapters();
    // Reading aloud starts on for the youngest, until a grown-up chooses.
    let readChosen = Boolean(player);
    part("read-aloud")?.addEventListener("change", () => { readChosen = true; });
    part("grade").addEventListener("change", () => {
      showChapters();
      const box = /** @type {HTMLInputElement | null} */ (part("read-aloud"));
      if (box && !readChosen) box.checked = Number(chosen("grade") ?? 0) <= READ_ALOUD_UP_TO;
    });

    onTap(part("save"), () => {
      const box = /** @type {HTMLInputElement | null} */ (part("read-aloud"));
      const choices = {
        name: /** @type {HTMLInputElement} */ (part("name")).value,
        heroId: chosen("hero") ?? HEROES[0].id,
        grade: Number(chosen("grade") ?? 0),
        ...(box ? { readAloud: box.checked } : {}),
      };
      if (player) {
        const name = choices.name.replace(/\s+/g, " ").trim().slice(0, LONGEST_NAME);
        change({ heroId: choices.heroId, grade: choices.grade, ...(box ? { readAloud: box.checked } : {}), ...(name ? { name } : {}) });
      } else {
        commit(addPlayer(save, choices).save);
      }
      map();
    });
    onTap(part("back"), () => (player ? map() : title()));
    offerCode(part("code-out"));
    // Removing asks first, in place, as leaving a battle does.
    part("remove")?.addEventListener("click", event => {
      const act = /** @type {HTMLElement} */ (event.target).closest("button")?.dataset.act;
      if (!act || !player) return;
      sound.play("click");
      const box = part("remove");
      if (act === "ask") {
        box.innerHTML = `<p class="remove-ask">Remove ${esc(player.name)} and all of their progress? This can't be undone.</p>
          <div class="actions"><button type="button" class="quiet" data-act="keep">Keep ${esc(player.name)}</button>
          <button type="button" class="quiet danger" data-act="go">Remove</button></div>`;
        /** @type {HTMLElement} */ (box.querySelector("[data-act=keep]")).focus();
      } else if (act === "keep") {
        playerForm(player);
      } else {
        commit(removePlayer(save, player.id));
        title();
      }
    });
  }

  // ------------------------------------------------------------------ the map

  function map() {
    const player = me();
    const grade = player.grade;
    const chapters = chaptersFor(grade);
    const levels = levelsFor(grade);
    const progress = progressIn(player, grade);
    const states = levelStates(levels, progress);
    const next = nextLevel(levels, progress);
    const done = states.filter(s => s === "done").length;
    const stars = levels.reduce((sum, l) => sum + (progress.done[l.id]?.stars ?? 0), 0);
    const hero = heroOf(player);
    const gradeName = gradeWords(grade);
    // The chapter to show open: the one being played, or the last, once all are done.
    const shown = next?.chapter ?? chapters.length - 1;
    show("map", `
      <section class="map-screen">
        <div class="map-head">
          <span class="map-hero" data-ref="hero"></span>
          <div class="map-who">
            <h1 tabindex="-1">${esc(player.name)}<span class="visually-hidden">'s ${esc(gradeName)} adventure</span></h1>
            <p class="map-badges"><span class="grade-chip">${esc(gradeName[0].toUpperCase() + gradeName.slice(1))}</span><span class="hero-level">${esc(hero.name)} · Level ${levelForXp(player.xp)}</span></p>
          </div>
          <button type="button" class="quiet switch-player" data-ref="switch" aria-label="Switch player">${icon("players")}<span class="switch-word"> Switch player</span></button>
        </div>
        <div class="card play-card">
          ${next ? `<button type="button" class="primary big continue" data-ref="continue"><span class="continue-play">${icon("play")} Play</span><span class="continue-topic"><span class="visually-hidden">, </span>${next.kind === "boss" ? "Boss battle" : `Level ${next.number}`} · ${esc(chapters[next.chapter].title)}</span></button>`
            : `<p class="map-finished">You finished the whole ${esc(gradeName)} adventure! Play any level again for more stars, or try the next grade.</p>`}
          <div class="map-progress">
            <div class="progress-bar" role="progressbar" aria-label="Levels done" aria-valuemin="0" aria-valuemax="${levels.length}" aria-valuenow="${done}">
              <span style="width: ${(100 * done) / levels.length}%"></span>
            </div>
            <span class="map-stars">${icon("star")} ${stars}<span class="visually-hidden"> of ${levels.length * 3} stars</span></span>
          </div>
        </div>
        <nav class="map-tiles" aria-label="More to play">
          <button type="button" class="tile tile--training" data-ref="training">${icon("training", "tile-icon")}<span class="tile-word">Training</span></button>
          <button type="button" class="tile tile--quick" data-ref="quick">${icon("battle", "tile-icon")}<span class="tile-word">Quick battle</span></button>
          ${grade >= CHALLENGE_FROM ? `<button type="button" class="tile tile--challenge" data-ref="challenge">${icon("challenge", "tile-icon")}<span class="tile-word">Challenge</span></button>` : ""}
          <button type="button" class="tile tile--treasures" data-ref="treasures">${icon("treasures", "tile-icon")}<span class="tile-word">Treasures</span><span class="tile-count">${treasureCount(player) || "None yet"}</span></button>
        </nav>
        <ol class="chapters">${chapters.map((chapter, c) => {
          const mine = levels.filter(l => l.chapter === c);
          const locked = states[levels.indexOf(mine[0])] === "locked";
          const finished = mine.every(l => progress.done[l.id]);
          const chapterStars = mine.reduce((sum, l) => sum + (progress.done[l.id]?.stars ?? 0), 0);
          const state = finished ? `${icon("star")} ${chapterStars}<span class="visually-hidden"> stars</span>`
            : locked ? `${icon("lock")}<span class="visually-hidden">Locked</span>`
            : next?.chapter === c ? `<span class="visually-hidden">Playing now</span>` : "";
          // Each chapter is one line, but the one being played is open, with its levels.
          return `<li class="chapter${locked ? " is-locked" : ""}${next?.chapter === c ? " is-current" : ""}${finished ? " is-finished" : ""}" data-chapter="${c}">
            <details${c === shown ? " open" : ""}>
              <summary class="chapter-line"><span class="chapter-badge">${c + 1}</span><span class="chapter-title">${esc(chapter.title)}</span><span class="chapter-state">${state}</span></summary>
              <div class="chapter-open">
                <div class="chapter-art" style="background-image: url('${backdropFor(settingFor(grade, c)).file}')">
                  ${locked ? "" : `<button type="button" class="chapter-watch" data-act="note" data-chapter="${c}" aria-label="${sceneFor(chapters[c].id) ? "Watch the chapter's opening scene" : "Read the chapter note"}">${icon("play")}</button>`}
                </div>
                <div class="chapter-body">
                  <ol class="levels">${mine.map(level => {
                    const state = states[levels.indexOf(level)];
                    const result = progress.done[level.id];
                    const isNext = level === next;
                    const said = `Level ${level.number}, ${KIND_NAMES[level.kind]}, ${state === "done" ? `${result?.stars} of 3 stars` : isNext ? "play this next" : state === "open" ? "ready to play" : "locked"}`;
                    return `<li><button type="button" class="level-button is-${state}${isNext ? " is-next" : ""} level-button--${level.kind}" data-level="${level.id}" aria-label="${said}"${state === "locked" ? " disabled" : ""}>
                      <span class="level-number" aria-hidden="true">${level.kind === "boss" ? "👑" : level.number}</span>
                      <span class="level-stars" aria-hidden="true">${result ? "★".repeat(result.stars) + "☆".repeat(3 - result.stars) : isNext ? icon("play") : state === "locked" ? icon("lock") : ""}</span>
                    </button></li>`;
                  }).join("")}</ol>
                  ${locked ? `<div class="chapter-more" data-ref="more-${c}"><button type="button" class="link" data-act="open-ask" data-chapter="${c}">Open this chapter early (for grown-ups)</button></div>` : ""}
                </div>
              </div>
            </details>
          </li>`;
        }).join("")}</ol>
        <details class="grown-ups">
          <summary>For grown-ups</summary>
          <p class="map-count"><strong>${done} of ${levels.length} levels done</strong> · ${stars} of ${levels.length * 3} stars. A level takes about 5 minutes, and a chapter is 5 levels.</p>
          <div class="actions">
            <button type="button" class="quiet" data-ref="report">Progress report</button>
            <button type="button" class="quiet" data-ref="edit">Change hero or grade</button>
            <button type="button" class="quiet" data-ref="class">Class view</button>
          </div>
        </details>
      </section>`);

    part("hero").replaceChildren(still(heroSprite(hero), hero.name));
    if (next) onTap(part("continue"), () => begin(next));
    onTap(part("training"), () => training());
    onTap(part("quick"), () => quickBattle());
    onTap(part("challenge"), () => challengeIntro());
    onTap(part("treasures"), () => treasures());
    onTap(part("report"), () => grownUp(report));
    onTap(part("edit"), () => grownUp(() => playerForm(player)));
    onTap(part("class"), () => grownUp(() => classPage()));
    onTap(part("switch"), () => title());
    screenEl.querySelector(".chapters")?.addEventListener("click", event => {
      const target = /** @type {HTMLElement} */ (event.target);
      const levelButton = target.closest("[data-level]");
      if (levelButton instanceof HTMLButtonElement) {
        const level = levels.find(l => l.id === levelButton.dataset.level);
        if (!level || levelButton.disabled) return;
        sound.play("click");
        begin(level);
        return;
      }
      const button = target.closest("[data-act]");
      if (!(button instanceof HTMLElement)) return;
      sound.play("click");
      const c = Number(button.dataset.chapter);
      const box = part(`more-${c}`);
      switch (button.dataset.act) {
        case "note": {
          const mine = levels.filter(l => l.chapter === c);
          opening(mine.find(l => states[levels.indexOf(l)] === "open") ?? mine[0]);
          break;
        }
        case "open-ask":
          grownUp(() => {
            box.innerHTML = `<p class="open-ask">Open Chapter ${c + 1}, ${esc(chapters[c].title)}, early? The chapters before it open too.</p>
              <div class="actions"><button type="button" class="quiet" data-act="open" data-chapter="${c}">Open it</button>
              <button type="button" class="quiet" data-act="open-no" data-chapter="${c}">Not now</button></div>`;
            /** @type {HTMLElement} */ (box.querySelector("[data-act=open]")).focus();
          });
          break;
        case "open":
          change({ adventures: { ...player.adventures, [grade]: openChapter(progress, c) } });
          map();
          break;
        default:
          box.innerHTML = `<button type="button" class="link" data-act="open-ask" data-chapter="${c}">Open this chapter early (for grown-ups)</button>`;
          /** @type {HTMLElement} */ (box.querySelector("button")).focus();
      }
    });
  }

  // ------------------------------------------------------- a chapter's note

  /**
   * Start a level: a chapter's first level comes after its opening.
   * @param {Level} level
   */
  function begin(level) {
    if (level.step === 1) opening(level);
    else play(level);
  }

  /**
   * A chapter's opening: its teaching scene, where it has one, or else its note.
   * @param {Level} level  the level to start from here
   */
  function opening(level) {
    if (sceneFor(chaptersFor(level.grade)[level.chapter].id)) scene(level);
    else note(level);
  }

  /**
   * The chapter's first monster shows off its trick, and the hero works out
   * how to beat it, before the level.
   * @param {Level} level  the level to start from here
   */
  function scene(level) {
    const chapter = chaptersFor(level.grade)[level.chapter];
    const setup = /** @type {import("../scenes.js").Scene} */ (sceneFor(chapter.id));
    const monster = residents(settingFor(level.grade, level.chapter))[0];
    const hero = heroOf(me());
    show("scene", "");
    runScene(screenEl, {
      kicker: `Chapter ${level.chapter + 1}`,
      title: chapter.title,
      steps: setup.steps(rng, { monster: monster.name, hero: hero.name }),
      hero,
      monster,
      speech,
      sound,
      readAloud: me().readAloud && !save.muted,
      startLabel: `Start ${levelName(level)}`,
      onStart: () => play(level),
      onNote: () => note(level),
      onMap: () => map(),
    });
    screenEl.querySelector("h1")?.focus();
  }

  /**
   * What a chapter is about, with a worked example, before its level.
   * @param {Level} level  the level to start from here
   */
  function note(level) {
    const chapter = chaptersFor(level.grade)[level.chapter];
    const example = exampleFor(chapter);
    show("note", `
      <section class="note-screen">
        <div class="note-art" aria-hidden="true" style="background-image: url('${backdropFor(settingFor(level.grade, level.chapter)).file}')"></div>
        <p class="note-kicker">Chapter ${level.chapter + 1}</p>
        <h1 tabindex="-1">${esc(chapter.title)}</h1>
        ${speech?.available ? `<button type="button" class="quiet read-aloud" data-ref="read"><span aria-hidden="true">🔈</span> Read to me</button>` : ""}
        <p class="note-text">${esc(chapter.note)}</p>
        <div class="card example">
          <h2 class="card-title">For example</h2>
          <p class="example-prompt">${esc(example.prompt)}</p>
          ${example.visual ? `<div class="picture">${pictureHtml(example.visual)}</div>` : ""}
          <p class="example-answer">The answer: <strong class="choice-text">${choiceHtml(example.answer)}</strong></p>
          <p class="example-tip"><strong>Tip:</strong> ${esc(example.hint)}</p>
        </div>
        <div class="actions">
          <button type="button" class="primary big" data-ref="start">Start ${esc(levelName(level))}</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    const answerText = typeof example.answer === "number" ? String(example.answer) : example.answer;
    readButton(part("read"), speech, () => speech?.say(`${chapter.title}. ${chapter.note} For example: ${example.prompt} The answer: ${answerText}. Tip: ${example.hint}`));
    onTap(part("start"), () => { speech?.stop(); play(level); });
    onTap(part("map"), () => { speech?.stop(); map(); });
  }

  // ------------------------------------------------------------ the battles

  /**
   * Play a level of the adventure.
   * @param {Level} level
   */
  function play(level) {
    const player = me();
    const chapter = chaptersFor(level.grade)[level.chapter];
    const startLevel = levelForXp(player.xp);
    const before = player.adventures[level.grade];
    // A sitting's first level warms up with what is most due from earlier chapters.
    const warmUp = !session.warmedUp.has(player.id);
    session.warmedUp.add(player.id);
    const battle = startBattle(rng, {
      grade: chapter.at,
      ...planLevel(level, player.mastery, player.played, { today: dayNumber(Date.now()), warmUp }),
      hero: { level: startLevel, xp: player.xp },
      treasures: player.treasures,
      memory: memoryFor(player),
    });
    fight(battle, {
      title: `${levelName(level)} · ${chapter.title}`,
      onWin: b => levelDone(level, b, startLevel, before),
      grade: level.grade,
      upTo: level.chapter,
      fresh: chapter.learn,
    });
  }

  /** Eight monsters, and any question the player's grade asks at the point in the year they have reached. */
  function quickBattle() {
    const player = me();
    const levels = levelsFor(player.grade);
    const reached = nextLevel(levels, progressIn(player, player.grade)) ?? levels[levels.length - 1];
    const startLevel = levelForXp(player.xp);
    const battle = startBattle(rng, {
      grade: chaptersFor(player.grade)[reached.chapter].at,
      adventure: buildAdventure(rng),
      hero: { level: startLevel, xp: player.xp },
      treasures: player.treasures,
      memory: memoryFor(player),
    });
    fight(battle, { onWin: b => victory(b, startLevel), grade: player.grade, upTo: reached.chapter });
  }

  /**
   * What a battle needs to tell when something stuck: what the player knows,
   * and the day. Nothing, once a keepsake has been found today.
   * @param {Player} player
   */
  function memoryFor(player) {
    const today = dayNumber(Date.now());
    return Object.values(player.remembered).some(r => r.day === today) ? undefined : { mastery: player.mastery, today };
  }

  /**
   * Training: a short battle on the kinds of question that need it most.
   */
  function training() {
    const player = me();
    const plan = planTraining(player.grade, progressIn(player, player.grade), player.mastery, player.played, dayNumber(Date.now()));
    const startLevel = levelForXp(player.xp);
    const battle = startBattle(rng, {
      grade: plan.mix[0].grade,
      ...plan,
      hero: { level: startLevel, xp: player.xp },
      treasures: player.treasures,
      memory: memoryFor(player),
    });
    fight(battle, {
      title: `Training ground · ${list(plan.kinds.map(k => typeById(k).name))}`,
      onWin: b => trainingDone(b, startLevel),
      grade: player.grade,
      upTo: (nextLevel(levelsFor(player.grade), progressIn(player, player.grade)) ?? levelsFor(player.grade).at(-1))?.chapter ?? 0,
    });
  }

  // ---------------------------------------------------- the one-minute challenge

  /** What the challenge is, and the score to beat. */
  function challengeIntro() {
    const player = me();
    const best = player.challenges[player.grade];
    show("challenge", `
      <section class="note-screen challenge-intro">
        <p class="note-kicker">Against the clock</p>
        <h1 tabindex="-1">One-minute challenge</h1>
        <div class="card">
          <p>Answer as many questions as you can in ${challengeSeconds} seconds. They come from every chapter you've reached.</p>
          <p>No hints this time. A wrong answer shows the right one, and the next question comes straight away.</p>
          <p class="challenge-best">${best ? `Your best: <strong>${best} right</strong>` : "No score yet. Set one!"}</p>
        </div>
        <div class="actions">
          <button type="button" class="primary big" data-ref="go">Start the clock</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    onTap(part("go"), () => challenge());
    onTap(part("map"), () => map());
  }

  /** The challenge itself, with the clock running. */
  function challenge() {
    const player = me();
    show("challenge", "");
    challengeScreen = createChallengeScreen(screenEl, {
      challenge: startChallenge(rng, player.grade, progressIn(player, player.grade)),
      rng,
      sound,
      seconds: challengeSeconds,
      onDone: challengeDone,
      onStop: challengeIntro,
    });
    screenEl.querySelector("h1")?.focus();
  }

  /**
   * Time's up: the score, against the best, and what to look at again. Every
   * answer teaches the game what the player knows, as in a battle.
   * @param {import("../challenge.js").Challenge} done
   */
  function challengeDone(done) {
    const player = me();
    const now = player.played + 1;
    let mastery = player.mastery;
    for (const { type, outcome } of done.answers) {
      mastery = learn(mastery, type, outcome, now, dayNumber(Date.now()));
      session.asked++;
      session.firstTry += Number(outcome === "firstTry");
    }
    const { best, before, newBest } = recordChallenge(player.challenges, player.grade, done.score);
    change({ mastery, played: now, challenges: best });
    sound.play("victory");
    const missed = done.answers.filter(a => a.outcome !== "firstTry");
    const topics = [...new Set(missed.map(a => typeById(a.type).name))];
    show("challenge-done", `
      <section class="victory-screen challenge-done">
        <h1 tabindex="-1">Time's up!</h1>
        <p class="challenge-final"><strong>${done.score}</strong> right</p>
        <p class="tagline">${newBest ? (before === null ? "Your first score. Now try to beat it!" : `A new best! Your best was ${before}.`) : `Your best is ${best[player.grade]}. Keep going!`}</p>
        <ul class="facts">
          <li><strong>${done.score} of ${done.answers.length}</strong> right</li>
          <li><strong>${done.answers.length}</strong> ${done.answers.length === 1 ? "question" : "questions"} in ${challengeSeconds} seconds</li>
        </ul>
        ${missed.length > 0 ? `<div class="card challenge-missed">
          <h2 class="card-title">To look at again: ${esc(list(topics))}</h2>
          <ul>${missed.slice(0, 5).map(a => `<li>${esc(a.prompt)}${a.pictured ? ` <span class="challenge-note">(with a picture)</span>` : ""} <strong>${choiceHtml(a.answer)}</strong></li>`).join("")}</ul>
        </div>` : ""}
        <div class="actions">
          <button type="button" class="primary big" data-ref="again">Go again</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    onTap(part("again"), () => challenge());
    onTap(part("map"), () => map());
  }

  /**
   * Show a battle, saving what is earned as it goes, and learning from every
   * answer what the player knows. Each battle moves the clock that review is
   * timed by.
   * @param {Battle} battle
   * @param {{ title?: string, onWin: (battle: Battle) => void }} options
   */
  /**
   * A way to show how a kind of question is done, if a teaching scene in the
   * player's grade teaches it: the nearest chapter, up to the one being
   * played, that brings that kind in and opens with a scene.
   * @param {number} grade
   * @param {number} upTo  the chapter being played
   * @returns {(type: string) => ((done: () => void) => void) | null}
   */
  function teachings(grade, upTo) {
    const chapters = chaptersFor(grade);
    return type => {
      const fits = chapters.map((chapter, place) => ({ chapter, place })).filter(({ chapter }) => chapter.learn.includes(type) && sceneFor(chapter.id));
      const pick = [...fits].reverse().find(f => f.place <= upTo) ?? fits[0];
      return pick ? done => replay(grade, pick.place, done) : null;
    };
  }

  /**
   * A chapter's teaching scene again, in a dialog over the battle, after a
   * question was missed twice.
   * @param {number} grade
   * @param {number} place  the chapter
   * @param {() => void} done  once it is closed
   */
  function replay(grade, place, done) {
    const chapter = chaptersFor(grade)[place];
    const setup = /** @type {import("../scenes.js").Scene} */ (sceneFor(chapter.id));
    const monster = residents(settingFor(grade, place))[0];
    const hero = heroOf(me());
    const dialog = document.createElement("dialog");
    dialog.className = "scene-dialog";
    root.append(dialog);
    const close = () => {
      speech?.stop();
      dialog.close();
      dialog.remove();
      done();
    };
    runScene(dialog, {
      kicker: "Show me how",
      title: chapter.title,
      steps: setup.steps(rng, { monster: monster.name, hero: hero.name }),
      hero,
      monster,
      speech,
      sound,
      readAloud: me().readAloud && !save.muted,
      startLabel: "Back to the battle",
      onStart: close,
      replay: true,
    });
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.showModal();
    dialog.querySelector("h1")?.focus();
  }

  /**
   * @param {Battle} battle
   * @param {{ title?: string, onWin: (battle: Battle) => void, grade: number, upTo: number, fresh?: string[] }} options
   *   grade and upTo: the chapter being played, for the teaching scenes that can show how;
   *   fresh: the kinds of question the level is about, so any other is marked as review
   */
  function fight(battle, { title: name, onWin, grade, upTo, fresh }) {
    const now = me().played + 1;
    change({ played: now });
    session.battles++;
    let learned = 0;
    show("battle", "");
    battleScreen = createBattleScreen(screenEl, {
      battle,
      hero: heroOf(me()),
      rng,
      sound,
      title: name,
      speaker: speech,
      readAloud: me().readAloud && !save.muted,
      onProgress: b => {
        let mastery = me().mastery;
        for (const { type, outcome } of b.tally.answers.slice(learned)) {
          mastery = learn(mastery, type, outcome, now, dayNumber(Date.now()));
          session.asked++;
          session.firstTry += Number(outcome === "firstTry");
        }
        learned = b.tally.answers.length;
        // A keepsake found by remembering is kept with what it was for, and the day, as one comes a day.
        const found = b.stuck?.keepsake && !me().remembered[b.stuck.keepsake.id] ? b.stuck : null;
        // Every monster beaten goes in the monster book.
        const met = b.adventure.slice(0, b.beaten).map(m => m.id).filter(id => !me().met.includes(id));
        change({
          xp: b.hero.xp,
          treasures: b.treasures,
          mastery,
          ...(found?.keepsake ? { remembered: { ...me().remembered, [found.keepsake.id]: { type: found.type, after: found.after, day: b.memory?.today ?? dayNumber(Date.now()) } } } : {}),
          ...(met.length > 0 ? { met: [...me().met, ...met] } : {}),
        });
      },
      onWin,
      onLeave: map,
      showMeHow: teachings(grade, upTo),
      reviewOf: fresh ? type => (fresh.includes(type) ? null : typeById(type).name) : undefined,
    });
    screenEl.querySelector("h1")?.focus();
  }

  /**
   * How a level went, and what comes next.
   * @param {Level} level
   * @param {Battle} battle
   * @param {number} startLevel
   * @param {import("../adventures.js").AdventureProgress | undefined} before  the grade's progress before the level
   */
  function levelDone(level, battle, startLevel, before) {
    sound.play("victory");
    const player = me();
    const chapters = chaptersFor(level.grade);
    const chapter = chapters[level.chapter];
    const levels = levelsFor(level.grade);
    const progress = recordLevel(progressIn(player, level.grade), level, battle.tally);
    change({ adventures: { ...player.adventures, [level.grade]: progress } });
    const { tally } = battle;
    const asked = tally.firstTry + tally.secondTry + tally.missed;
    const won = newlyWon(level.grade, before, progress);
    const gained = battle.hero.level - startLevel;
    const next = nextLevel(levels, progress);
    const chapterLevels = levels.filter(l => l.chapter === level.chapter);
    const chapterStars = chapterLevels.reduce((sum, l) => sum + (progress.done[l.id]?.stars ?? 0), 0);
    const finishedChapter = level.kind === "boss" && chapterLevels.every(l => progress.done[l.id]);
    const following = chapters[level.chapter + 1];
    const hero = heroOf(player);
    const stars = starsFor(tally.firstTry, asked);
    const note = topicNote(tally.answers);
    const minutes = Math.round((Date.now() - session.started) / 60000);
    const rest = minutes >= REST_AFTER && !session.restSuggested;
    if (rest) session.restSuggested = true;
    // Progress lives in this browser only, so now and then a level's end offers a copy to keep.
    const backup = player.played - player.backedUp >= BACKUP_EVERY;
    show("level-done", `
      <section class="victory-screen level-done">
        <div class="banner">
          <span data-ref="banner-hero"></span>
          <div>
            <h1 tabindex="-1">${finishedChapter ? `Chapter ${level.chapter + 1} done!` : `Level ${level.number} done!`}</h1>
            <p class="tagline">${esc(hero.name)} beat ${esc(battle.adventure.map(m => m.name).join(" and "))}.</p>
          </div>
        </div>
        <p class="stars-big">${starsHtml(stars)}</p>
        ${note ? `<p class="topic-note">${esc(note)}</p>` : ""}
        ${revealsHtml(won, battle.stuck)}
        <ul class="facts">
          <li><strong>${tally.firstTry} of ${asked}</strong> right the first time</li>
          <li><strong>Level ${battle.hero.level}</strong> ${gained > 0 ? `up ${gained} ${gained === 1 ? "level" : "levels"}!` : "and climbing"}</li>
        </ul>
        ${rest ? `<div class="card rest-offer">
          <p><strong>That's ${minutes} minutes of play.</strong> A good time for a stretch, a drink of water, or a break. Everything is saved.</p>
        </div>` : ""}
        ${backup ? `<div class="card backup-offer" data-ref="backup">
          <p><strong>For grown-ups: keep a copy of ${esc(player.name)}'s progress.</strong> It is saved ${kept.where} only, so clearing ${kept.whose} data would lose it. A progress code is a copy: keep it in a note, or email it to yourself.</p>
          <button type="button" class="quiet" data-act="show">Show the progress code</button>
        </div>` : ""}
        ${stars === 1 ? `<div class="card training-offer">
          <p>That was a tough one. The training ground practises what's been tricky, a little at a time.</p>
          <button type="button" class="quiet" data-ref="training">Go to the training ground</button>
        </div>` : ""}
        <div class="card talk-card">
          <p><strong>For a grown-up, to talk about together:</strong> ${esc(talkAbout(rng, tally.answers))}</p>
        </div>
        ${finishedChapter ? `<div class="card chapter-note">
          <h2 class="card-title">You finished ${esc(chapter.title)}!</h2>
          <p>${chapterStars} of ${chapterLevels.length * 3} stars in this chapter. ${following ? `Next up: <strong>${esc(following.title)}</strong>.` : `That was the last chapter of the ${esc(gradeWords(level.grade))} adventure. Well done!`}</p>
        </div>` : ""}
        <div class="actions">
          ${next ? `<button type="button" class="primary big" data-ref="next">Next: ${esc(levelName(next))}</button>` : ""}
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    part("banner-hero").replaceChildren(still(heroSprite(hero), hero.name));
    if (next) onTap(part("next"), () => begin(next));
    onTap(part("training"), () => training());
    onTap(part("map"), () => map());
    if (backup) {
      // Offered once, whether or not the code is shown, so it never nags.
      change({ backedUp: player.played });
      offerCode(part("backup"));
    }
  }

  /**
   * How training went: each kind of question it worked on, and how well it is known now.
   * @param {Battle} battle
   * @param {number} startLevel
   */
  function trainingDone(battle, startLevel) {
    sound.play("victory");
    const player = me();
    const gained = battle.hero.level - startLevel;
    const hero = heroOf(player);
    show("training-done", `
      <section class="victory-screen">
        <div class="banner">
          <span data-ref="banner-hero"></span>
          <div>
            <h1 tabindex="-1">Training done!</h1>
            <p class="tagline">${esc(hero.name)} beat ${esc(battle.adventure.map(m => m.name).join(" and "))}.</p>
          </div>
        </div>
        <ul class="facts">${byKind(battle.tally.answers).map(k => `
          <li><strong>${k.firstTry} of ${k.asked}</strong> ${esc(k.name)}, right the first time
            <span class="fact-note">${esc(STRENGTH_WORDS[strength(player.mastery[k.type])])}</span></li>`).join("")}
        </ul>
        <p class="tagline">Level ${battle.hero.level}${gained > 0 ? `, up ${gained}!` : ""}</p>
        ${revealsHtml([], battle.stuck)}
        <div class="card talk-card">
          <p><strong>For a grown-up, to talk about together:</strong> ${esc(talkAbout(rng, battle.tally.answers))}</p>
        </div>
        <div class="actions">
          <button type="button" class="primary big" data-ref="again">Train again</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    part("banner-hero").replaceChildren(still(heroSprite(hero), hero.name));
    onTap(part("again"), () => training());
    onTap(part("map"), () => map());
  }

  /**
   * For grown-ups: every kind of question in the player's grade, in the order
   * the adventure brings them in, and how well each is known.
   */
  function report() {
    const player = me();
    const grade = player.grade;
    const levels = levelsFor(grade);
    const progress = progressIn(player, grade);
    const done = levels.filter(l => progress.done[l.id]).length;
    // Topics met so far, the ones needing most practice first; then the ones not met yet, in the adventure's order.
    const inOrder = [...new Set(chaptersFor(grade).flatMap(c => [...c.learn, ...(c.warmup ?? [])]))];
    const met = inOrder.filter(type => (player.mastery[type]?.seen ?? 0) > 0).sort((a, b) => player.mastery[a].score - player.mastery[b].score);
    const kinds = [...met, ...inOrder.filter(type => !met.includes(type))];
    const needHelp = met.filter(type => strength(player.mastery[type]) === "practise").slice(0, 3);
    /** @param {number} last */
    const when = last => {
      const ago = player.played - last;
      return ago <= 0 ? "In the last battle" : `${ago} ${ago === 1 ? "battle" : "battles"} ago`;
    };
    show("report", `
      <section class="report-screen">
        <h1 tabindex="-1">${esc(player.name)}'s progress</h1>
        <p class="tagline">For grown-ups: how the ${esc(gradeWords(grade))} adventure is going, topic by topic.</p>
        <ul class="facts">
          <li><strong>${done} of ${levels.length}</strong> levels done</li>
          <li><strong>${player.played}</strong> ${player.played === 1 ? "battle" : "battles"} played in all</li>
          <li>${session.asked > 0
            ? `<strong>${Math.round((100 * session.firstTry) / session.asked)}%</strong> right the first time this sitting, of ${session.asked} ${session.asked === 1 ? "question" : "questions"}`
            : `<strong>No questions</strong> answered yet this sitting`}</li>
        </ul>
        <p class="report-summary">${needHelp.length > 0
          ? `<strong>Needs practice with:</strong> ${esc(list(needHelp.map(type => typeById(type).name)))}.`
          : met.length > 0 ? "<strong>Nothing needs extra practice right now.</strong>" : "<strong>No topics met yet.</strong> They appear here once the adventure brings them in."}</p>
        <div class="card report-table">
          <!-- The roles keep it a table to a screen reader when a phone lays its rows out as cards. -->
          <table role="table">
            <caption>Topics, the ones that need practice first</caption>
            <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Topic</th><th role="columnheader" scope="col">Answered</th><th role="columnheader" scope="col">How it's going</th><th role="columnheader" scope="col">Last practised</th></tr></thead>
            <tbody role="rowgroup">${kinds.map(type => {
              const m = player.mastery[type];
              const s = strength(m);
              return `<tr role="row" class="is-${s}"><th role="rowheader" scope="row">${esc(typeById(type).name)}</th>
                <td role="cell" data-label="Answered">${m?.seen ?? 0}</td>
                <td role="cell" data-label="How it's going"><span class="strength strength--${s}">${STRENGTH_WORDS[s]}</span></td>
                <td role="cell" data-label="Last practised">${m ? when(m.last) : "Not yet"}</td></tr>`;
            }).join("")}</tbody>
          </table>
        </div>
        <p class="field-hint">"How it's going" follows the most recent answers, so it changes as a child practises. The training ground works on the topics that need it most.</p>
        <div class="actions">
          <button type="button" class="primary" data-ref="training">Go to the training ground</button>
          <button type="button" class="quiet" data-ref="print">Print this page</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
        <div class="card lock-card">
          <h2 class="card-title">Grown-up lock</h2>
          <label class="check"><input type="checkbox" data-ref="lock"${save.locked ? " checked" : ""}> Ask a grown-up question first</label>
          <p class="field-hint">With the lock on, changing a player's choices, opening chapters early, this report and the class view first ask a multiplication question. It keeps young children from changing things by accident, on this device. It isn't a password.</p>
        </div>
      </section>`);
    onTap(part("training"), () => training());
    onTap(part("print"), () => window.print?.());
    onTap(part("map"), () => map());
    part("lock").addEventListener("change", () => commit({ ...save, locked: /** @type {HTMLInputElement} */ (part("lock")).checked }));
  }

  // ------------------------------------------------------------ the class view

  /**
   * For teachers: everyone on this device, and everyone whose progress code
   * was pasted in, grade by grade, with what each needs to practise and the
   * topics the most children need.
   * @param {string} [said]  what the last paste did
   */
  function classPage(said = "") {
    const pasted = save.classCodes.map(code => playerFromCode(code)).filter(p => p !== null);
    const groups = classView([...save.players.map(player => ({ player, fromCode: false })), ...pasted.map(player => ({ player, fromCode: true }))]);
    show("class", `
      <section class="report-screen class-screen">
        <h1 tabindex="-1">Class view</h1>
        <p class="tagline">For teachers: everyone who plays on this device, and anyone whose progress code you paste in below. Nothing is sent anywhere.</p>
        ${groups.length === 0 ? `<p class="report-summary"><strong>No one yet.</strong> Players on this device show here, and students on other devices once their codes are pasted in.</p>` : ""}
        ${groups.map(({ grade, rows, topics }) => `
          <div class="card report-table">
            <table role="table">
              <caption>${esc(gradeWords(grade)[0].toUpperCase() + gradeWords(grade).slice(1))} · ${rows.length} ${rows.length === 1 ? "student" : "students"}</caption>
              <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Name</th><th role="columnheader" scope="col">Levels done</th><th role="columnheader" scope="col">Battles</th><th role="columnheader" scope="col">Needs practice with</th><th role="columnheader" scope="col">Challenge best</th></tr></thead>
              <tbody role="rowgroup">${rows.map(r => `<tr role="row"><th role="rowheader" scope="row">${esc(r.name)}${r.fromCode ? ` <span class="class-from">from a code</span>` : ""}</th>
                <td role="cell" data-label="Levels done">${r.done} of ${r.levels}</td>
                <td role="cell" data-label="Battles">${r.played}</td>
                <td role="cell" data-label="Needs practice with">${r.practise.length > 0 ? esc(list(r.practise.slice(0, 3).map(type => typeById(type).name))) : "Nothing right now"}</td>
                <td role="cell" data-label="Challenge best">${r.best ?? "–"}</td></tr>`).join("")}</tbody>
            </table>
          </div>
          ${topics.length > 0 ? `<div class="card">
            <h2 class="card-title">Topics to work on, ${esc(gradeWords(grade))}</h2>
            <ul class="class-topics">${topics.map(t => `<li><strong>${esc(typeById(t.type).name)}</strong>: ${t.names.length} of ${rows.length} (${esc(list(t.names))})</li>`).join("")}</ul>
          </div>` : ""}`).join("")}
        <div class="card class-codes" data-ref="codes">
          <h2 class="card-title">Add students from other devices</h2>
          <p class="field-hint">On their own device, each student chooses "Change hero or grade", shows their progress code, and sends it to you, by your class's message board or by email. Paste in as many codes as you like, all at once. A newer code for the same name replaces the older one. Pasted codes stay on this device.</p>
          <label class="visually-hidden" for="class-codes">Progress codes</label>
          <textarea id="class-codes" class="code-box" data-ref="class-text" rows="5" spellcheck="false" autocomplete="off"></textarea>
          <p class="class-said" data-ref="class-said" aria-live="polite">${esc(said)}</p>
          <div class="actions">
            <button type="button" class="primary" data-act="add">Add these students</button>
            ${save.classCodes.length > 0 ? `<button type="button" class="quiet danger" data-act="ask">Clear the pasted students</button>` : ""}
          </div>
        </div>
        <div class="actions">
          <button type="button" class="quiet" data-ref="print">Print this page</button>
          <button type="button" class="quiet" data-ref="back">Back</button>
        </div>
      </section>`);
    onTap(part("print"), () => window.print?.());
    onTap(part("back"), () => title());
    part("codes").addEventListener("click", event => {
      const act = /** @type {HTMLElement} */ (event.target).closest("button")?.dataset.act;
      if (!act) return;
      sound.play("click");
      if (act === "add") {
        const found = codesIn(/** @type {HTMLTextAreaElement} */ (part("class-text")).value);
        if (found.length === 0) {
          part("class-said").textContent = "No progress codes there. Each one starts NMC1-.";
          return;
        }
        const { codes, added, replaced, bad } = addCodes(save.classCodes, found);
        commit({ ...save, classCodes: codes });
        classPage([
          added > 0 ? `Added ${added} ${added === 1 ? "student" : "students"}.` : "",
          replaced > 0 ? `Updated ${replaced}.` : "",
          bad > 0 ? `${bad} ${bad === 1 ? "code" : "codes"} didn't work: check that all of each was copied.` : "",
        ].filter(Boolean).join(" "));
      } else if (act === "ask") {
        const actions = /** @type {HTMLElement} */ (part("codes").querySelector(".actions"));
        actions.innerHTML = `<p class="remove-ask">Clear all ${save.classCodes.length} pasted students from this view? Their own devices keep their progress.</p>
          <button type="button" class="quiet" data-act="keep">Keep them</button>
          <button type="button" class="quiet danger" data-act="clear">Clear</button>`;
        /** @type {HTMLElement} */ (actions.querySelector("[data-act=keep]")).focus();
      } else if (act === "keep") {
        classPage();
      } else if (act === "clear") {
        commit({ ...save, classCodes: [] });
        classPage("Cleared.");
      }
    });
  }

  /**
   * How a quick battle went.
   * @param {Battle} battle
   * @param {number} startLevel
   */
  function victory(battle, startLevel) {
    sound.play("victory");
    const { tally } = battle;
    const asked = tally.firstTry + tally.secondTry + tally.missed;
    const gained = battle.hero.level - startLevel;
    const hero = heroOf(me());
    show("victory", `
      <section class="victory-screen">
        <div class="banner">
          <span data-ref="banner-hero"></span>
          <div>
            <h1 tabindex="-1">You won!</h1>
            <p class="tagline">${esc(hero.name)} beat all ${battle.adventure.length} monsters.</p>
          </div>
        </div>
        <ul class="facts">
          <li><strong>${tally.firstTry} of ${asked}</strong> right the first time</li>
          <li><strong>Level ${battle.hero.level}</strong> ${gained > 0 ? `up ${gained} ${gained === 1 ? "level" : "levels"}!` : "and climbing"}</li>
        </ul>
        ${revealsHtml([], battle.stuck)}
        <div class="actions">
          <button type="button" class="primary big" data-ref="again">Play again</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    part("banner-hero").replaceChildren(still(heroSprite(hero), hero.name));
    onTap(part("again"), () => quickBattle());
    onTap(part("map"), () => map());
  }

  // ------------------------------------------------------------ the treasures

  /**
   * The treasures: for each grade played, a shelf of its chapters' treasures,
   * with a locked place for each chapter not finished yet; then the
   * keepsakes, newest first. A shelf shows only pictures and names: tapping
   * one opens it, with what it was won for. A second tab is the monster book.
   */
  function treasures() {
    const player = me();
    const met = monstersMet(player);
    const pages = bookPages().filter(page => page.monsters.some(m => met.has(m.id)));
    /** @type {Map<string, { t: { id: string, emoji: string, name: string }, kicker: string, line: string }>} */
    const opened = new Map();
    /**
     * @param {{ id: string, emoji: string, name: string }} t
     * @param {string} kicker
     * @param {string} line
     */
    const item = (t, kicker, line) => {
      opened.set(t.id, { t, kicker, line });
      return `<li><button type="button" class="treasure" data-treasure="${t.id}">${treasureArt(t)}<span class="treasure-name">${esc(t.name)}</span></button></li>`;
    };
    /** @param {string} label */
    const locked = label => `<li class="treasure is-locked"><span class="treasure-art is-locked" aria-hidden="true">${icon("lock")}</span><span class="treasure-name">${esc(label)}<span class="visually-hidden">, not won yet</span></span></li>`;
    const grades = ADVENTURE_GRADES.filter(g => g === player.grade || treasuresWon(g, player.adventures[g]).length > 0);
    const shelves = grades.map(g => {
      const won = new Set(treasuresWon(g, player.adventures[g]).map(t => t.id));
      const words = gradeWords(g);
      const places = chaptersFor(g).map((chapter, c) => {
        const t = chapterTreasure(g, c);
        return won.has(t.id) ? item(t, `Chapter ${c + 1}: ${chapter.title}`, t.line) : locked(`Chapter ${c + 1}`);
      });
      const crown = gradeTreasure(g);
      places.push(won.has(crown.id) ? item(crown, "Grade treasure", crown.line) : locked("Every chapter"));
      return `<section class="treasure-set">
        <h2 class="card-title">${esc(words[0].toUpperCase() + words.slice(1))}</h2>
        <ul class="treasure-shelf">${places.join("")}</ul>
      </section>`;
    });
    const keepsakes = [...player.treasures].reverse().map(id => KEEPSAKES.find(k => k.id === id)).filter(k => k !== undefined);
    show("treasures", `
      <section class="treasures-screen">
        <h1 tabindex="-1">${esc(player.name)}'s treasures</h1>
        <div class="tabs" role="tablist" aria-label="Treasures or monsters">
          <button type="button" class="tab" role="tab" id="tab-treasures" aria-controls="panel-treasures" aria-selected="true" data-tab="treasures">Treasures</button>
          <button type="button" class="tab" role="tab" id="tab-monsters" aria-controls="panel-monsters" aria-selected="false" tabindex="-1" data-tab="monsters">Monster book</button>
        </div>
        <div class="tab-panel" role="tabpanel" id="panel-treasures" aria-labelledby="tab-treasures">
          ${shelves.join("")}
          <section class="treasure-set">
            <h2 class="card-title">Keepsakes</h2>
            ${keepsakes.length > 0
              ? `<ul class="treasure-shelf">${keepsakes.map(k => item(k, player.remembered[k.id] ? "It stuck!" : "Keepsake", player.remembered[k.id] ? rememberedLine(player.remembered[k.id]) : "Found on an earlier adventure.")).join("")}</ul>`
              : `<p class="field-hint">None yet. They're surprises, for remembering something you learned on another day.</p>`}
          </section>
        </div>
        <div class="tab-panel" role="tabpanel" id="panel-monsters" aria-labelledby="tab-monsters" hidden>
          ${pages.length > 0 ? pages.map(page => `<section class="book-page">
            <h2 class="card-title">${esc(page.place)}</h2>
            <ul class="monster-shelf">${page.monsters.map(m => met.has(m.id)
              ? `<li class="monster-card"><span class="monster-still" data-monster="${m.id}"></span><span class="monster-name">${esc(m.name)}</span><span class="monster-line">${esc(m.description)}</span></li>`
              : `<li class="monster-card is-unmet"><span class="monster-unknown" aria-hidden="true">?</span><span class="monster-name">Not met yet</span></li>`).join("")}</ul>
          </section>`).join("") : `<p class="field-hint">Every monster you beat goes in your monster book.</p>`}
        </div>
        <button type="button" class="primary" data-ref="back">Back to the map</button>
      </section>`);
    onTap(part("back"), () => map());
    const screen = /** @type {HTMLElement} */ (screenEl.querySelector(".treasures-screen"));
    screen.addEventListener("click", event => {
      const button = /** @type {HTMLElement} */ (event.target).closest("[data-treasure]");
      const shown = button && opened.get(/** @type {HTMLElement} */ (button).dataset.treasure ?? "");
      if (!shown) return;
      sound.play("click");
      openTreasure(shown.t, shown.kicker, shown.line, /** @type {HTMLElement} */ (button));
    });
    // The tabs, as tabs work: a tap or the arrow keys pick one, and only the chosen one is in the tab order.
    const tabs = /** @type {HTMLElement[]} */ ([...screen.querySelectorAll("[role=tab]")]);
    let drawn = false;
    /** @param {HTMLElement} tab */
    const choose = tab => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        /** @type {HTMLElement} */ (screen.querySelector(`#${t.getAttribute("aria-controls")}`)).hidden = !on;
      }
      // The monsters' pictures are drawn the first time the book is opened.
      if (tab.dataset.tab === "monsters" && !drawn) {
        drawn = true;
        for (const spot of screen.querySelectorAll("[data-monster]")) {
          const monster = MONSTERS.find(m => m.id === /** @type {HTMLElement} */ (spot).dataset.monster);
          if (monster) spot.replaceChildren(still(monsterSprite(monster)));
        }
      }
    };
    for (const tab of tabs) {
      tab.addEventListener("click", () => { sound.play("click"); choose(tab); });
      tab.addEventListener("keydown", event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const next = tabs[(tabs.indexOf(tab) + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        choose(next);
        next.focus();
      });
    }
  }

  /**
   * One treasure, big, with what it was won for, in a dialog over the shelf.
   * @param {{ id: string, emoji: string, name: string }} t
   * @param {string} kicker
   * @param {string} line
   * @param {HTMLElement} from  the button that opened it, to go back to
   */
  function openTreasure(t, kicker, line, from) {
    const dialog = document.createElement("dialog");
    dialog.className = "treasure-dialog";
    dialog.setAttribute("aria-label", t.name);
    dialog.innerHTML = `${revealCard(t, kicker, line)}<button type="button" class="primary" data-act="close">Close</button>`;
    root.append(dialog);
    const close = () => {
      dialog.close();
      dialog.remove();
      from.focus();
    };
    dialog.addEventListener("click", event => {
      // The close button, or a tap outside the card.
      if (/** @type {HTMLElement} */ (event.target).closest("[data-act=close]") || event.target === dialog) close();
    });
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.showModal();
    /** @type {HTMLElement} */ (dialog.querySelector("[data-act=close]")).focus();
  }

  // A returning player goes straight back to their map; anyone else to the title.
  if (currentPlayer(save)) map();
  else title();

  return {
    /** For the browser tests: where the game is. */
    state: () => ({ screen, save, player: currentPlayer(save), battle: battleScreen?.battle ?? null, challenge: challengeScreen?.challenge ?? null }),
  };
}
