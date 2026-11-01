// The battle screen: how far along the adventure is, the stage, and the
// question. Each answer goes to the battle (src/battle.js); the stage acts out
// what happened; then the question moves on, gives a hint, or shows the answer.

import { answer } from "../battle.js";
import { isCorrect } from "../questions/common.js";
import { sfxFor } from "../stage.js";
import { renderVisual, dataTable } from "../visuals/index.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { formatNumber } from "../questions/common.js";
import { createStage } from "./stage_view.js";
import { questionSpeech } from "../speech.js";

/** @import { Battle, Round } from "../battle.js" */
/** @import { Answer } from "../questions/common.js" */
/** @import { Hero } from "../heroes.js" */
/** @import { Rng } from "../rng.js" */
/** @import { SoundSystem } from "../sound.js" */
/** @import { Speaker } from "../speech.js" */

/**
 * A choice as markup, the way children write it: big numbers with commas,
 * negatives with a true minus, fractions stacked, and mixed numbers as a
 * whole number beside a stacked fraction. A picture on its own, like the 🔴
 * that comes next in a pattern, is shown as big as the pictures in the question.
 * @param {Answer} choice
 */
export function choiceHtml(choice) {
  if (typeof choice === "number") return esc(formatNumber(choice));
  if (!/[\p{L}\p{N}]/u.test(choice)) return `<span class="choice-picture">${esc(choice)}</span>`;
  const fraction = choice.match(/^(-?)(?:(\d+) )?(\d+)\/(\d+)$/);
  if (!fraction) return esc(choice);
  const [, minus, whole, top, bottom] = fraction;
  const stacked = `<mfrac><mn>${top}</mn><mn>${bottom}</mn></mfrac>`;
  return `<math aria-label="${esc(choice)}">${minus ? "<mo>−</mo>" : ""}${whole ? `<mn>${whole}</mn>` : ""}${stacked}</math>`;
}

/**
 * A question's picture as markup: drawn narrow on a phone, where that makes
 * its numbers bigger, and followed, for a screen reader, by the numbers a
 * graph shows.
 * @param {import("../questions/common.js").Visual} visual
 */
export function pictureHtml(visual) {
  const narrow = globalThis.matchMedia?.("(max-width: 520px)").matches ?? false;
  const data = dataTable(visual);
  return `${renderVisual(visual, { narrow })}${data ? `<div class="visually-hidden">${data}</div>` : ""}`;
}

/**
 * What to say after a round, under the question.
 * @param {Round} round
 */
export function feedbackFor(round) {
  switch (round.then) {
    case "again": return `Not quite. Try again! Hint: ${round.hint}`;
    case "reveal": return `The answer is ${typeof round.answer === "number" ? formatNumber(round.answer) : round.answer}.`;
    case "won": return "You beat every monster!";
    default: return round.defeatedFoe ? "Right! The monster is beaten!" : "Right!";
  }
}

/**
 * Build the battle screen inside `root`. Call destroy() before replacing it.
 * @param {HTMLElement} root
 * @param {object} options
 * @param {Battle} options.battle
 * @param {Hero} options.hero
 * @param {Rng} options.rng
 * @param {SoundSystem} options.sound
 * @param {string} [options.title]  what the battle is, such as "Level 7: Practice"; by default, which monster of how many
 * @param {Speaker} [options.speaker]  to read questions aloud: on the "Read to me" button, and by itself if `readAloud`
 * @param {boolean} [options.readAloud]  read each question, and each hint, as it comes
 * @param {(battle: Battle) => void} options.onProgress  after every answer, to save what was earned
 * @param {(battle: Battle) => void} options.onWin
 * @param {() => void} options.onLeave
 */
export function createBattleScreen(root, { battle: start, hero, rng, sound, title, speaker, readAloud = false, onProgress, onWin, onLeave }) {
  let battle = start;
  let busy = false;
  let arrivedAt = -1; // which monster the arrival line is about
  const listening = new AbortController();

  root.innerHTML = `
    <section class="battle">
      <div class="battle-bar">
        <h1 class="journey-title" tabindex="-1" data-ref="title"></h1>
        <ol class="journey" aria-hidden="true" data-ref="journey"></ol>
        <p class="streak" data-ref="streak"></p>
        <div class="leave" data-ref="leave"></div>
      </div>
      <div data-ref="stage"></div>
      <div class="panel">
        <div class="panel-head">
          <p class="arrival" data-ref="arrival"></p>
          ${speaker?.available ? `<button type="button" class="quiet read-aloud" data-ref="read"><span aria-hidden="true">🔈</span> Read to me</button>` : ""}
        </div>
        <div class="ask" aria-live="polite" data-ref="ask">
          <p class="prompt" data-ref="prompt"></p>
          <div class="picture" data-ref="picture"></div>
        </div>
        <div class="choices" role="group" aria-label="Answers" data-ref="choices"></div>
        <p class="feedback" aria-live="polite" data-ref="feedback"></p>
        <button type="button" class="primary next" data-ref="next" hidden>Next question</button>
      </div>
    </section>`;
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));
  const stage = createStage(ref("stage"));
  stage.show(battle, hero);

  /** Read the question out, with its choices; for ratios, "5:13" is "5 to 13". */
  function readQuestion() {
    const q = battle.question;
    if (q) speaker?.say(questionSpeech(q.prompt, q.choices.filter(c => !battle.ruledOut.includes(c))), { ratios: q.type === "ratios" });
  }

  function showJourney() {
    const { adventure, beaten } = battle;
    ref("title").textContent = title ?? `Monster ${Math.min(beaten + 1, adventure.length)} of ${adventure.length}`;
    ref("journey").innerHTML = adventure.map((_, i) =>
      `<li class="${i < beaten ? "beaten" : i === beaten ? "current" : "later"}"></li>`).join("");
    ref("streak").textContent = battle.streak >= 2 ? `🔥 ${battle.streak} in a row` : "";
  }

  function showRest() {
    ref("leave").innerHTML = `<button type="button" class="quiet" data-act="ask">Rest</button>`;
  }

  function showQuestion() {
    const q = battle.question;
    if (!q || !battle.foe) return;
    if (arrivedAt !== battle.beaten) {
      arrivedAt = battle.beaten;
      ref("arrival").textContent = `Here comes ${battle.foe.monster.name}! ${battle.foe.monster.description}`;
    }
    ref("prompt").textContent = q.prompt;
    ref("picture").innerHTML = q.visual ? pictureHtml(q.visual) : "";
    ref("choices").innerHTML = q.choices.map((c, i) => {
      const out = battle.ruledOut.includes(c);
      return `<button type="button" class="choice${out ? " wrong" : ""}" data-index="${i}"${out ? " disabled" : ""}>
        <span class="key" aria-hidden="true">${i + 1}</span><span class="choice-text">${choiceHtml(c)}</span></button>`;
    }).join("");
    ref("next").hidden = true;
    busy = false;
    if (readAloud) readQuestion();
  }

  /** @param {number} index */
  async function choose(index) {
    const q = battle.question;
    if (busy || !q) return;
    const choice = q.choices[index];
    if (choice === undefined || battle.ruledOut.includes(choice)) return;
    busy = true;
    const buttons = /** @type {HTMLButtonElement[]} */ ([...ref("choices").querySelectorAll(".choice")]);
    buttons.forEach(b => { b.disabled = true; });
    buttons[index].classList.add(isCorrect(q, choice) ? "right" : "wrong");

    const before = battle;
    const result = answer(battle, choice, rng);
    battle = result.battle;
    onProgress(battle);
    // Said at once, while the stage acts it out: children should know straight away.
    ref("feedback").textContent = feedbackFor(result.round);
    if (readAloud && result.round.then !== "next") speaker?.say(feedbackFor(result.round));
    await stage.play(result.round, before, battle, hero, { onBeat: beat => sound.play(sfxFor(beat)) });
    showJourney();

    switch (result.round.then) {
      case "won":
        onWin(battle);
        return;
      case "again":
        buttons.forEach((b, i) => { b.disabled = battle.ruledOut.includes(q.choices[i]); });
        busy = false;
        return;
      case "reveal": {
        buttons[q.choices.indexOf(q.answer)].classList.add("right");
        const next = ref("next");
        next.hidden = false;
        next.focus();
        return;
      }
      default:
        ref("feedback").textContent = "";
        showQuestion();
    }
  }

  ref("choices").addEventListener("click", event => {
    const button = /** @type {HTMLElement} */ (event.target).closest(".choice");
    if (button instanceof HTMLButtonElement) choose(Number(button.dataset.index));
  });
  ref("read")?.addEventListener("click", () => readQuestion());
  ref("next").addEventListener("click", () => {
    sound.play("click");
    ref("feedback").textContent = "";
    showQuestion();
  });
  // Resting asks first, in place, since a stray tap shouldn't end an adventure.
  ref("leave").addEventListener("click", event => {
    const act = /** @type {HTMLElement} */ (event.target).closest("button")?.dataset.act;
    if (!act) return;
    sound.play("click");
    if (act === "ask") {
      ref("leave").innerHTML = `<span class="leave-ask">${title ? "Leave this level? You keep your treasures and experience, and can play it again." : "Leave this battle? Your level and treasures are saved."}</span>
        <button type="button" class="quiet" data-act="stay">Keep playing</button>
        <button type="button" class="quiet danger" data-act="go">Leave</button>`;
      /** @type {HTMLElement} */ (ref("leave").querySelector("[data-act=stay]")).focus();
    } else if (act === "stay") {
      showRest();
    } else {
      onLeave();
    }
  });
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLSelectElement) return;
    // While "Leave this adventure?" is asked, the number keys wait, and Escape means keep playing.
    if (ref("leave").querySelector("[data-act=go]")) {
      if (event.key === "Escape") showRest();
      return;
    }
    if (/^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
  }, { signal: listening.signal });

  showJourney();
  showRest();
  showQuestion();

  return {
    destroy() {
      listening.abort();
      speaker?.stop();
    },
    get battle() { return battle; },
  };
}
