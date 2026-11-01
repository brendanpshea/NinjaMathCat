// The battle screen: how far along the adventure is, the stage, and the
// question. Each answer goes to the battle (src/battle.js); the stage acts out
// what happened; then the question moves on, gives a hint, or shows the answer.

import { answer } from "../battle.js";
import { isCorrect } from "../questions/common.js";
import { sfxFor } from "../stage.js";
import { renderVisual } from "../visuals/index.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { createStage } from "./stage_view.js";

/** @import { Battle, Round } from "../battle.js" */
/** @import { Answer } from "../questions/common.js" */
/** @import { Hero } from "../heroes.js" */
/** @import { Rng } from "../rng.js" */
/** @import { SoundSystem } from "../sound.js" */

/**
 * A choice as markup: fractions stacked, the way children write them.
 * @param {Answer} choice
 */
export function choiceHtml(choice) {
  const fraction = String(choice).match(/^(\d+)\/(\d+)$/);
  if (!fraction) return esc(choice);
  return `<math aria-label="${esc(choice)}"><mfrac><mn>${fraction[1]}</mn><mn>${fraction[2]}</mn></mfrac></math>`;
}

/**
 * What to say after a round, under the question.
 * @param {Round} round
 */
export function feedbackFor(round) {
  switch (round.then) {
    case "again": return `Not quite. Try again! Hint: ${round.hint}`;
    case "reveal": return `The answer is ${round.answer}.`;
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
 * @param {(battle: Battle) => void} options.onProgress  after every answer, to save what was earned
 * @param {(battle: Battle) => void} options.onWin
 * @param {() => void} options.onLeave
 */
export function createBattleScreen(root, { battle: start, hero, rng, sound, onProgress, onWin, onLeave }) {
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
        <p class="arrival" data-ref="arrival"></p>
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

  function showJourney() {
    const { adventure, beaten } = battle;
    ref("title").textContent = `Monster ${Math.min(beaten + 1, adventure.length)} of ${adventure.length}`;
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
    ref("picture").innerHTML = q.visual ? renderVisual(q.visual) : "";
    ref("choices").innerHTML = q.choices.map((c, i) => {
      const out = battle.ruledOut.includes(c);
      return `<button type="button" class="choice${out ? " wrong" : ""}" data-index="${i}"${out ? " disabled" : ""}>
        <span class="key" aria-hidden="true">${i + 1}</span><span class="choice-text">${choiceHtml(c)}</span></button>`;
    }).join("");
    ref("next").hidden = true;
    busy = false;
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
      ref("leave").innerHTML = `<span class="leave-ask">Leave this adventure? Your level and treasures are saved.</span>
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
    if (/^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
  }, { signal: listening.signal });

  showJourney();
  showRest();
  showQuestion();

  return {
    destroy() { listening.abort(); },
    get battle() { return battle; },
  };
}
