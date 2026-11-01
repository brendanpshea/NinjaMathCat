// The game's screens and the way between them. The title asks who is playing;
// a player's map shows their grade's adventure, chapter by chapter; a chapter
// starts with a note on its topic; each level is a short battle; and after it
// comes how it went. A quick battle, the treasure collection and the player's
// choices are a tap away from the map. Progress is saved after every answer
// and every level, so leaving loses nothing but the level being played.

import { GRADES, pickQuestion } from "../curriculum.js";
import { HEROES, heroSprite } from "../heroes.js";
import { MONSTERS, buildAdventure, monsterSprite } from "../monsters.js";
import { backdropFor } from "../backdrops.js";
import { startBattle } from "../battle.js";
import { levelForXp } from "../combat.js";
import { TREASURES } from "../treasures.js";
import {
  ADVENTURE_GRADES, chaptersFor, levelsFor, levelName, planLevel, settingFor, pitchFor,
  recordLevel, levelStates, nextLevel, openChapter, starsFor,
} from "../adventures.js";
import { loadSave, writeSave, addPlayer, updatePlayer, removePlayer, currentPlayer, progressIn, MOST_PLAYERS, LONGEST_NAME } from "../save.js";
import { createRng } from "../rng.js";
import { renderVisual } from "../visuals/index.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { createBattleScreen, choiceHtml } from "./battle_screen.js";
import { still } from "./sprites.js";

/** @import { Battle } from "../battle.js" */
/** @import { Level } from "../adventures.js" */
/** @import { Rng } from "../rng.js" */
/** @import { Save, Player } from "../save.js" */
/** @import { SoundSystem } from "../sound.js" */

/** @typedef {"title" | "player" | "map" | "note" | "battle" | "level-done" | "victory" | "treasures"} ScreenName */

/** What each kind of level is called on the map. */
const KIND_NAMES = { learn: "New topic", practice: "Practice", review: "Review", boss: "Boss" };

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
 * A number from a string, so a chapter's worked example is the same every time.
 * @param {string} text
 */
function seedFrom(text) {
  let n = 7;
  for (const c of text) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}

/**
 * @param {HTMLElement} root
 * @param {object} options
 * @param {Storage | null} options.storage
 * @param {SoundSystem} options.sound
 * @param {Rng} options.rng
 */
export function createApp(root, { storage, sound, rng }) {
  /** @type {Save} */
  let save = loadSave(storage);
  sound.enabled = !save.muted;
  /** @type {ScreenName} */
  let screen = "title";
  /** @type {{ destroy(): void, battle: Battle } | null} */
  let battleScreen = null;

  root.innerHTML = `
    <header class="top">
      <span class="brand" aria-hidden="true">Ninja Math Cat</span>
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
    soundButton.textContent = save.muted ? "🔇 Sound off" : "🔊 Sound on";
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
    battleScreen?.destroy();
    battleScreen = null;
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

  function title() {
    // A monster from somewhere in the game, at home in front of its own backdrop.
    const foe = rng.pick(MONSTERS);
    const scene = backdropFor(foe.setting);
    const hero = heroOf(currentPlayer(save) ?? save.players[0] ?? null);
    show("title", `
      <section class="title-screen">
        <div class="title-stage" style="background-image: url('${scene.file}'); --floor: ${scene.floor}">
          <div class="title-words">
            <h1 tabindex="-1">Ninja Math Cat</h1>
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
        </section>
        <footer class="title-footer">
          <p>Each grade's adventure follows the Common Core math standards, from kindergarten to 6th grade, in forty short levels. It is free, with nothing to sign up for: everyone's progress is saved in this browser only.</p>
          <p><a href="https://github.com/brendanpshea/NinjaMathCat">Source code</a> · <a href="legacy/">The original game</a> · Free software (GPL-3.0)</p>
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
        <div class="start-bar">
          <button type="button" class="primary big" data-ref="save">${player ? "Save" : "Start my adventure!"}</button>
          <button type="button" class="quiet" data-ref="back">Back</button>
        </div>
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
    part("grade").addEventListener("change", showChapters);

    onTap(part("save"), () => {
      const choices = { name: /** @type {HTMLInputElement} */ (part("name")).value, heroId: chosen("hero") ?? HEROES[0].id, grade: Number(chosen("grade") ?? 0) };
      if (player) {
        const name = choices.name.replace(/\s+/g, " ").trim().slice(0, LONGEST_NAME);
        change({ heroId: choices.heroId, grade: choices.grade, ...(name ? { name } : {}) });
      } else {
        commit(addPlayer(save, choices).save);
      }
      map();
    });
    onTap(part("back"), () => (player ? map() : title()));
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
    show("map", `
      <section class="map-screen">
        <div class="banner">
          <span data-ref="hero"></span>
          <div>
            <h1 tabindex="-1">${esc(player.name)}'s ${esc(gradeWords(grade))} adventure</h1>
            <p class="tagline">${esc(hero.name)} · Level ${levelForXp(player.xp)} · ${player.treasures.length} of ${TREASURES.length} treasures</p>
          </div>
        </div>
        <div class="card map-progress">
          <p class="map-count"><strong>${done} of ${levels.length} levels done</strong> · ${stars} of ${levels.length * 3} stars</p>
          <div class="progress-bar" role="progressbar" aria-label="Levels done" aria-valuemin="0" aria-valuemax="${levels.length}" aria-valuenow="${done}">
            <span style="width: ${(100 * done) / levels.length}%"></span>
          </div>
          ${next ? `<button type="button" class="primary big continue" data-ref="continue">${done === 0 ? "Start" : "Play"} ${esc(levelName(next))}<span class="continue-topic"><span class="visually-hidden">, </span>${esc(chapters[next.chapter].title)}</span></button>`
            : `<p class="map-finished">You finished the whole ${esc(gradeWords(grade))} adventure! Play any level again for more stars, or try the next grade.</p>`}
        </div>
        <div class="actions map-actions">
          <button type="button" class="quiet" data-ref="quick">Quick battle</button>
          <button type="button" class="quiet" data-ref="treasures">Treasures</button>
          <button type="button" class="quiet" data-ref="edit">Change hero or grade</button>
          <button type="button" class="quiet" data-ref="switch">Switch player</button>
        </div>
        <ol class="chapters">${chapters.map((chapter, c) => {
          const mine = levels.filter(l => l.chapter === c);
          const locked = states[levels.indexOf(mine[0])] === "locked";
          return `<li class="chapter${locked ? " is-locked" : ""}${next?.chapter === c ? " is-current" : ""}" data-chapter="${c}">
            <div class="chapter-art" aria-hidden="true" style="background-image: url('${backdropFor(settingFor(grade, c)).file}')"></div>
            <div class="chapter-body">
              <h2 class="chapter-title"><span class="chapter-number">Chapter ${c + 1}</span> ${esc(chapter.title)}</h2>
              <ol class="levels">${mine.map(level => {
                const state = states[levels.indexOf(level)];
                const result = progress.done[level.id];
                const said = `Level ${level.number}, ${KIND_NAMES[level.kind]}, ${state === "done" ? `${result?.stars} of 3 stars` : state === "open" ? "ready to play" : "locked"}`;
                return `<li><button type="button" class="level-button is-${state} level-button--${level.kind}" data-level="${level.id}" aria-label="${said}"${state === "locked" ? " disabled" : ""}>
                  <span class="level-number" aria-hidden="true">${level.kind === "boss" ? "👑" : level.number}</span>
                  <span class="level-stars" aria-hidden="true">${result ? "★".repeat(result.stars) + "☆".repeat(3 - result.stars) : state === "open" ? "Play" : "🔒"}</span>
                </button></li>`;
              }).join("")}</ol>
              <div class="chapter-more" data-ref="more-${c}">${locked
                ? `<button type="button" class="link" data-act="open-ask" data-chapter="${c}">Open this chapter early (for grown-ups)</button>`
                : `<button type="button" class="link" data-act="note" data-chapter="${c}">Read the chapter note</button>`}</div>
            </div>
          </li>`;
        }).join("")}</ol>
      </section>`);

    part("hero").replaceChildren(still(heroSprite(hero), hero.name));
    if (next) onTap(part("continue"), () => begin(next));
    onTap(part("quick"), () => quickBattle());
    onTap(part("treasures"), () => treasures());
    onTap(part("edit"), () => playerForm(player));
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
          note(mine.find(l => states[levels.indexOf(l)] === "open") ?? mine[0]);
          break;
        }
        case "open-ask":
          box.innerHTML = `<p class="open-ask">Open Chapter ${c + 1}, ${esc(chapters[c].title)}, early? The chapters before it open too.</p>
            <div class="actions"><button type="button" class="quiet" data-act="open" data-chapter="${c}">Open it</button>
            <button type="button" class="quiet" data-act="open-no" data-chapter="${c}">Not now</button></div>`;
          /** @type {HTMLElement} */ (box.querySelector("[data-act=open]")).focus();
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
   * Start a level: a chapter's first level comes after its note.
   * @param {Level} level
   */
  function begin(level) {
    if (level.step === 1) note(level);
    else play(level);
  }

  /**
   * What a chapter is about, with a worked example, before its level.
   * @param {Level} level  the level to start from here
   */
  function note(level) {
    const chapter = chaptersFor(level.grade)[level.chapter];
    const type = chapter.learn[0];
    const example = pickQuestion(createRng(seedFrom(chapter.id)), [{ type, grade: pitchFor(type, chapter.at), weight: 1, most: 1 }]);
    show("note", `
      <section class="note-screen">
        <div class="note-art" aria-hidden="true" style="background-image: url('${backdropFor(settingFor(level.grade, level.chapter)).file}')"></div>
        <p class="note-kicker">Chapter ${level.chapter + 1}</p>
        <h1 tabindex="-1">${esc(chapter.title)}</h1>
        <p class="note-text">${esc(chapter.note)}</p>
        <div class="card example">
          <h2 class="card-title">For example</h2>
          <p class="example-prompt">${esc(example.prompt)}</p>
          ${example.visual ? `<div class="picture">${renderVisual(example.visual)}</div>` : ""}
          <p class="example-answer">The answer: <strong class="choice-text">${choiceHtml(example.answer)}</strong></p>
          <p class="example-tip"><strong>Tip:</strong> ${esc(example.hint)}</p>
        </div>
        <div class="actions">
          <button type="button" class="primary big" data-ref="start">Start ${esc(levelName(level))}</button>
          <button type="button" class="quiet" data-ref="map">Back to the map</button>
        </div>
      </section>`);
    onTap(part("start"), () => play(level));
    onTap(part("map"), () => map());
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
    const foundBefore = new Set(player.treasures);
    const battle = startBattle(rng, {
      grade: chapter.at,
      ...planLevel(level),
      hero: { level: startLevel, xp: player.xp },
      treasures: player.treasures,
    });
    fight(battle, {
      title: `${levelName(level)} · ${chapter.title}`,
      onWin: b => levelDone(level, b, startLevel, foundBefore),
    });
  }

  /** Eight monsters, and any question the player's grade asks at the point in the year they have reached. */
  function quickBattle() {
    const player = me();
    const levels = levelsFor(player.grade);
    const reached = nextLevel(levels, progressIn(player, player.grade)) ?? levels[levels.length - 1];
    const startLevel = levelForXp(player.xp);
    const foundBefore = new Set(player.treasures);
    const battle = startBattle(rng, {
      grade: chaptersFor(player.grade)[reached.chapter].at,
      adventure: buildAdventure(rng),
      hero: { level: startLevel, xp: player.xp },
      treasures: player.treasures,
    });
    fight(battle, { onWin: b => victory(b, startLevel, foundBefore) });
  }

  /**
   * Show a battle, saving what is earned as it goes.
   * @param {Battle} battle
   * @param {{ title?: string, onWin: (battle: Battle) => void }} options
   */
  function fight(battle, { title: name, onWin }) {
    show("battle", "");
    battleScreen = createBattleScreen(screenEl, {
      battle,
      hero: heroOf(me()),
      rng,
      sound,
      title: name,
      onProgress: b => change({ xp: b.hero.xp, treasures: b.treasures }),
      onWin,
      onLeave: map,
    });
    screenEl.querySelector("h1")?.focus();
  }

  /**
   * The treasures a battle found that weren't found before.
   * @param {Battle} battle
   * @param {Set<string>} foundBefore
   */
  const newTreasures = (battle, foundBefore) => TREASURES.filter(t => battle.treasures.includes(t.id) && !foundBefore.has(t.id));

  /**
   * How a level went, and what comes next.
   * @param {Level} level
   * @param {Battle} battle
   * @param {number} startLevel
   * @param {Set<string>} foundBefore
   */
  function levelDone(level, battle, startLevel, foundBefore) {
    sound.play("victory");
    const player = me();
    const chapters = chaptersFor(level.grade);
    const chapter = chapters[level.chapter];
    const levels = levelsFor(level.grade);
    const progress = recordLevel(progressIn(player, level.grade), level, battle.tally);
    change({ adventures: { ...player.adventures, [level.grade]: progress } });
    const { tally } = battle;
    const asked = tally.firstTry + tally.secondTry + tally.missed;
    const found = newTreasures(battle, foundBefore);
    const gained = battle.hero.level - startLevel;
    const next = nextLevel(levels, progress);
    const chapterLevels = levels.filter(l => l.chapter === level.chapter);
    const chapterStars = chapterLevels.reduce((sum, l) => sum + (progress.done[l.id]?.stars ?? 0), 0);
    const finishedChapter = level.kind === "boss" && chapterLevels.every(l => progress.done[l.id]);
    const following = chapters[level.chapter + 1];
    const hero = heroOf(player);
    show("level-done", `
      <section class="victory-screen level-done">
        <div class="banner">
          <span data-ref="banner-hero"></span>
          <div>
            <h1 tabindex="-1">${finishedChapter ? `Chapter ${level.chapter + 1} done!` : `Level ${level.number} done!`}</h1>
            <p class="tagline">${esc(hero.name)} beat ${esc(battle.adventure.map(m => m.name).join(" and "))}.</p>
          </div>
        </div>
        <p class="stars-big">${starsHtml(starsFor(tally.firstTry, asked))}</p>
        <ul class="facts">
          <li><strong>${tally.firstTry} of ${asked}</strong> right the first time</li>
          <li><strong>Level ${battle.hero.level}</strong> ${gained > 0 ? `up ${gained} ${gained === 1 ? "level" : "levels"}!` : "and climbing"}</li>
          <li><strong>${found.length}</strong> new ${found.length === 1 ? "treasure" : "treasures"}</li>
        </ul>
        ${found.length > 0 ? `<ul class="treasure-grid">${found.map(treasureCard).join("")}</ul>` : ""}
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
    onTap(part("map"), () => map());
  }

  /**
   * How a quick battle went.
   * @param {Battle} battle
   * @param {number} startLevel
   * @param {Set<string>} foundBefore
   */
  function victory(battle, startLevel, foundBefore) {
    sound.play("victory");
    const { tally } = battle;
    const asked = tally.firstTry + tally.secondTry + tally.missed;
    const found = newTreasures(battle, foundBefore);
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
          <li><strong>${found.length}</strong> new ${found.length === 1 ? "treasure" : "treasures"}</li>
        </ul>
        <div class="card">
          <h2 class="card-title">${found.length > 0 ? "Treasures you found" : "No new treasures this time"}</h2>
          ${found.length > 0 ? `<ul class="treasure-grid">${found.map(treasureCard).join("")}</ul>`
            : `<p>${foundBefore.size >= TREASURES.length ? "You have found every treasure there is!" : "Monsters keep their treasure if they knock you out. Try again!"}</p>`}
        </div>
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

  /** @param {typeof TREASURES[number]} t */
  function treasureCard(t) {
    return `<li class="treasure"><span class="treasure-emoji" aria-hidden="true">${t.emoji}</span>
      <span class="treasure-name">${esc(t.name)}</span><span class="treasure-line">${esc(t.description)}</span></li>`;
  }

  function treasures() {
    // Newest first, then a tile for each one still out there.
    const found = [...me().treasures].reverse().map(id => TREASURES.find(t => t.id === id)).filter(t => t !== undefined);
    const hidden = TREASURES.length - found.length;
    show("treasures", `
      <section class="treasures-screen">
        <h1 tabindex="-1">${esc(me().name)}'s treasures</h1>
        <p class="tagline">${found.length} of ${TREASURES.length} found. Beat monsters to find more.</p>
        ${found.length > 0 ? `<ul class="treasure-grid">${found.map(treasureCard).join("")}</ul>` : ""}
        ${hidden > 0 ? `<div class="card">
          <h2 class="card-title">Still hidden: ${hidden}</h2>
          <ul class="hidden-grid" aria-hidden="true">${"<li>?</li>".repeat(hidden)}</ul>
        </div>` : `<p class="tagline">You have found every treasure there is!</p>`}
        <button type="button" class="primary" data-ref="back">Back to the map</button>
      </section>`);
    onTap(part("back"), () => map());
  }

  // A returning player goes straight back to their map; anyone else to the title.
  if (currentPlayer(save)) map();
  else title();

  return {
    /** For the browser tests: where the game is. */
    state: () => ({ screen, save, player: currentPlayer(save), battle: battleScreen?.battle ?? null }),
  };
}
