// The game's screens and the way between them: the title (pick a hero and a
// grade), the battle, the victory, and the treasure collection. What is earned
// is saved after every answer, so leaving early loses nothing but the fight.

import { GRADES, gradeOutline } from "../curriculum.js";
import { HEROES, heroSprite } from "../heroes.js";
import { MONSTERS, buildAdventure, monsterSprite } from "../monsters.js";
import { backdropFor } from "../backdrops.js";
import { startBattle } from "../battle.js";
import { levelForXp } from "../combat.js";
import { TREASURES } from "../treasures.js";
import { loadSave, writeSave } from "../save.js";
import { suggestGrade } from "../progress.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { createBattleScreen } from "./battle_screen.js";
import { still } from "./sprites.js";

/** @import { Battle } from "../battle.js" */
/** @import { Rng } from "../rng.js" */
/** @import { Save } from "../save.js" */
/** @import { SoundSystem } from "../sound.js" */

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
  /** @type {"title" | "battle" | "victory" | "treasures"} */
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

  const hero = () => HEROES.find(h => h.id === save.heroId) ?? HEROES[0];
  /** @param {Partial<Save>} changes */
  const update = changes => {
    save = { ...save, ...changes };
    writeSave(storage, save);
  };

  function showSound() {
    soundButton.textContent = save.muted ? "🔇 Sound off" : "🔊 Sound on";
    soundButton.setAttribute("aria-pressed", String(!save.muted));
  }
  soundButton.addEventListener("click", () => {
    update({ muted: !save.muted });
    sound.enabled = !save.muted;
    sound.play("click");
    showSound();
  });
  showSound();

  /**
   * Swap in a screen, and put focus on its heading so it is announced.
   * @param {typeof screen} name
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

  function title() {
    const level = levelForXp(save.xp);
    const returning = save.xp > 0 || save.treasures.length > 0;
    // A monster from somewhere in the game, at home in front of its own backdrop.
    const foe = rng.pick(MONSTERS);
    const scene = backdropFor(foe.setting);
    const [year, term] = [Math.floor(save.grade), save.grade % 1];
    const years = [...new Set(GRADES.map(g => Math.floor(g.grade)))];
    show("title", `
      <section class="title-screen">
        <div class="title-stage" style="background-image: url('${scene.file}'); --floor: ${scene.floor}">
          <div class="title-words">
            <h1 tabindex="-1">Ninja Math Cat</h1>
            <p class="tagline">Answer math questions to power up your hero and beat eight monsters!</p>
          </div>
          <div class="title-fighter title-fighter--hero">
            <span class="title-plate" data-ref="hero-name">${esc(hero().name)}</span>
            <span data-ref="banner-hero"></span>
          </div>
          <div class="title-fighter title-fighter--monster">
            <span class="title-plate">${esc(foe.name)}</span>
            <span data-ref="banner-monster"></span>
          </div>
        </div>
        ${returning ? `<p class="record"><span><strong>Level ${level}</strong> · ${save.treasures.length} of ${TREASURES.length} treasures found</span>
          <button type="button" class="link" data-ref="treasures">See your treasures</button></p>` : ""}
        <fieldset class="card">
          <legend>Choose your hero</legend>
          <div class="heroes">${HEROES.map(h => `
            <label class="hero-choice" data-hero="${h.id}">
              <input type="radio" name="hero" value="${h.id}"${h.id === save.heroId ? " checked" : ""}>
              <span class="hero-name">${esc(h.name)}</span>
            </label>`).join("")}
          </div>
        </fieldset>
        <fieldset class="card" data-ref="grade">
          <legend>Choose your grade</legend>
          <div class="grade-years">${years.map(y => `
            <label class="grade-choice">
              <input type="radio" name="grade" value="${y}"${y === year ? " checked" : ""}>
              <span class="grade-number" aria-hidden="true">${y === 0 ? "K" : y}</span>
              <span class="grade-word">${y === 0 ? "Kinder&shy;garten" : `${esc(gradeLabel(y).replace(" grade", ""))}<span class="visually-hidden"> grade</span>`}</span>
            </label>`).join("")}
          </div>
          <fieldset class="grade-terms">
            <legend class="visually-hidden">When in the school year?</legend>
            <label><input type="radio" name="term" value="0"${term === 0 ? " checked" : ""}> Start of the year</label>
            <label><input type="radio" name="term" value="0.5"${term !== 0 ? " checked" : ""}> Middle of the year</label>
          </fieldset>
          <div class="practice" data-ref="practice" aria-live="polite"></div>
        </fieldset>
        <div class="start-bar"><button type="button" class="primary big" data-ref="start">Start adventure!</button></div>
        <footer class="title-footer">
          <p>Questions follow the Common Core math standards, from kindergarten to 6th grade. It is free, with nothing to sign up for: your hero's progress is saved in this browser only.</p>
          <p><a href="https://github.com/brendanpshea/NinjaMathCat">Source code</a> · <a href="legacy/">The original game</a> · Free software (GPL-3.0)</p>
        </footer>
      </section>`);

    const banner = part("banner-hero");
    const showBanner = () => {
      banner.replaceChildren(still(heroSprite(hero()), hero().name));
      part("hero-name").textContent = hero().name;
    };
    showBanner();
    part("banner-monster").replaceChildren(still(monsterSprite(foe), foe.name));
    for (const label of screenEl.querySelectorAll(".hero-choice")) {
      const h = HEROES.find(x => x.id === /** @type {HTMLElement} */ (label).dataset.hero);
      if (h) label.prepend(still(heroSprite(h)));
    }
    screenEl.querySelector(".heroes")?.addEventListener("change", event => {
      update({ heroId: /** @type {HTMLInputElement} */ (event.target).value });
      showBanner();
    });

    // What the chosen grade practices: what is new this year, then how much is review.
    const showPractice = () => {
      const { fresh, review } = gradeOutline(save.grade);
      const year = gradeLabel(Math.floor(save.grade));
      part("practice").innerHTML = `
        <p class="practice-head">${review > 0 ? `New in ${esc(year)}` : `${esc(year)} practices`}</p>
        <ul class="topics">${fresh.map(name => `<li>${esc(name)}</li>`).join("")}</ul>
        ${review > 0 ? `<p class="practice-more">Plus ${review} ${review === 1 ? "kind" : "kinds"} of question from earlier grades.</p>` : ""}`;
    };
    showPractice();
    const chosen = (/** @type {string} */ name) => Number(/** @type {HTMLInputElement | null} */ (screenEl.querySelector(`input[name=${name}]:checked`))?.value ?? 0);
    part("grade").addEventListener("change", () => {
      const grade = chosen("grade") + chosen("term");
      // Every grade has a start and a middle; this keeps to the ladder if that ever changes.
      update({ grade: GRADES.some(g => g.grade === grade) ? grade : Math.floor(grade) });
      showPractice();
    });
    part("treasures")?.addEventListener("click", () => { sound.play("click"); treasures(); });
    part("start").addEventListener("click", () => { sound.play("click"); play(); });
  }

  /** @param {number} grade */
  const gradeLabel = grade => GRADES.find(g => g.grade === grade)?.label ?? `Grade ${grade}`;

  function play() {
    const startLevel = levelForXp(save.xp);
    const foundBefore = new Set(save.treasures);
    const battle = startBattle(rng, {
      grade: save.grade,
      adventure: buildAdventure(rng),
      hero: { level: startLevel, xp: save.xp },
      treasures: save.treasures,
    });
    show("battle", "");
    battleScreen = createBattleScreen(screenEl, {
      battle,
      hero: hero(),
      rng,
      sound,
      onProgress: b => update({ xp: b.hero.xp, treasures: b.treasures }),
      onWin: b => victory(b, startLevel, foundBefore),
      onLeave: title,
    });
    screenEl.querySelector("h1")?.focus();
  }

  /**
   * @param {Battle} battle
   * @param {number} startLevel
   * @param {Set<string>} foundBefore
   */
  function victory(battle, startLevel, foundBefore) {
    sound.play("victory");
    const { tally } = battle;
    const asked = tally.firstTry + tally.secondTry + tally.missed;
    const found = TREASURES.filter(t => battle.treasures.includes(t.id) && !foundBefore.has(t.id));
    const gained = battle.hero.level - startLevel;
    const next = suggestGrade(tally, save.grade);
    show("victory", `
      <section class="victory-screen">
        <div class="banner">
          <span data-ref="banner-hero"></span>
          <div>
            <h1 tabindex="-1">You won!</h1>
            <p class="tagline">${esc(hero().name)} beat all ${battle.adventure.length} monsters.</p>
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
        ${next ? `<div class="card suggestion">
          <p>${next.easier ? "Those were tricky ones." : "That was easy for you!"} Want to try <strong>${esc(next.label)}</strong>?</p>
          <button type="button" class="quiet" data-ref="switch">Try ${esc(next.label)}</button>
        </div>` : ""}
        <div class="actions">
          <button type="button" class="primary big" data-ref="again">Play again</button>
          <button type="button" class="quiet" data-ref="home">Back to the start</button>
        </div>
      </section>`);
    part("banner-hero").replaceChildren(still(heroSprite(hero()), hero().name));
    part("again").addEventListener("click", () => { sound.play("click"); play(); });
    part("home").addEventListener("click", () => { sound.play("click"); title(); });
    part("switch")?.addEventListener("click", () => {
      sound.play("click");
      if (next) update({ grade: next.grade });
      play();
    });
  }

  /** @param {typeof TREASURES[number]} t */
  function treasureCard(t) {
    return `<li class="treasure"><span class="treasure-emoji" aria-hidden="true">${t.emoji}</span>
      <span class="treasure-name">${esc(t.name)}</span><span class="treasure-line">${esc(t.description)}</span></li>`;
  }

  function treasures() {
    // Newest first, then a tile for each one still out there.
    const found = [...save.treasures].reverse().map(id => TREASURES.find(t => t.id === id)).filter(t => t !== undefined);
    const hidden = TREASURES.length - found.length;
    show("treasures", `
      <section class="treasures-screen">
        <h1 tabindex="-1">Your treasures</h1>
        <p class="tagline">${found.length} of ${TREASURES.length} found. Beat monsters to find more.</p>
        ${found.length > 0 ? `<ul class="treasure-grid">${found.map(treasureCard).join("")}</ul>` : ""}
        ${hidden > 0 ? `<div class="card">
          <h2 class="card-title">Still hidden: ${hidden}</h2>
          <ul class="hidden-grid" aria-hidden="true">${"<li>?</li>".repeat(hidden)}</ul>
        </div>` : `<p class="tagline">You have found every treasure there is!</p>`}
        <button type="button" class="primary" data-ref="back">Back</button>
      </section>`);
    part("back").addEventListener("click", () => { sound.play("click"); title(); });
  }

  title();

  return {
    /** For the browser tests: where the game is. */
    state: () => ({ screen, save, battle: battleScreen?.battle ?? null }),
  };
}
