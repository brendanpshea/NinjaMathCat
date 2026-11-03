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
import { icon } from "./icons.js";
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
    // A wrong answer the question knows the mistake behind says what it was, before the hint.
    case "again": return `Not quite. ${round.slip ? `${round.slip} ` : ""}Try again! Hint: ${round.hint}`;
    case "reveal": return `The answer is ${typeof round.answer === "number" ? formatNumber(round.answer) : round.answer}.${round.slip ? ` ${round.slip}` : ""}`;
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
 * @param {(type: string) => ((done: () => void) => void) | null} [options.showMeHow]  for a kind of question,
 *   a way to show how it's done, with a teaching scene, if there is one; it calls `done` once the scene is closed
 * @param {(type: string) => string | null} [options.reviewOf]  for a kind of question from an earlier chapter, the
 *   topic it reviews, so a question that isn't about the level's topic doesn't look like a mistake
 */
export function createBattleScreen(root, { battle: start, hero, rng, sound, title, speaker, readAloud = false, onProgress, onWin, onLeave, showMeHow, reviewOf }) {
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
          <p class="review-tag" data-ref="tag" hidden></p>
          <p class="prompt" data-ref="prompt"></p>
          <div class="picture" data-ref="picture"></div>
        </div>
        <div class="choices" role="group" aria-label="Answers" data-ref="choices"></div>
        <div class="numpad" data-ref="pad" hidden>
          <div class="numpad-top">
            <output class="numpad-field" data-ref="field" aria-label="Your answer" aria-live="polite"></output>
            <button type="button" class="numpad-key" data-key="back" aria-label="delete">${icon("back")}</button>
            <button type="button" class="primary numpad-enter" data-key="enter">Strike!</button>
          </div>
          <div class="numpad-keys" role="group" aria-label="Number keys" data-ref="keys"></div>
          <p class="numpad-note">A typed answer hits harder! Tap the numbers, or type them on a keyboard.</p>
          <p class="numpad-tried" data-ref="tried"></p>
        </div>
        <p class="feedback" aria-live="polite" data-ref="feedback"></p>
        <div class="actions after-reveal">
          <button type="button" class="primary next" data-ref="next" hidden>Next question</button>
          <button type="button" class="quiet show-how" data-ref="how" hidden>Show me how</button>
        </div>
      </div>
    </section>`;
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));
  const stage = createStage(ref("stage"));
  stage.show(battle, hero);

  /**
   * Whether an answer is being acted out, when no other can be given. The
   * battle says so as data-busy too, for the tests, since a number line's
   * ticks have no disabled state to show it.
   * @param {boolean} now
   */
  function setBusy(now) {
    busy = now;
    root.querySelector(".battle")?.toggleAttribute("data-busy", now);
  }

  /**
   * Read the question out, with its choices; for ratios, "5:13" is "5 to 13".
   * One answered on a number line is only its words: its choices are the ticks.
   */
  function readQuestion() {
    const q = battle.question;
    if (q) speaker?.say(q.input ? q.prompt : questionSpeech(q.prompt, q.choices.filter(c => !battle.ruledOut.includes(c))), { ratios: q.type === "ratios" });
  }

  /** What is typed so far, on a question answered by typing: digits, maybe after a minus sign. */
  let typing = "";
  /** The most digits an answer can have: a million has seven. */
  const MOST_DIGITS = 7;

  function showTyping() {
    ref("field").textContent = typing === "" ? " " : typing;
  }

  /**
   * A key of the number pad, pressed or typed: a digit, minus, back or enter.
   * @param {string} key
   */
  function press(key) {
    const q = battle.question;
    if (busy || q?.input !== "type" || !ref("next").hidden) return;
    const digits = typing.replace("−", "");
    if (/^\d$/.test(key) && digits.length < MOST_DIGITS) typing += key;
    else if (key === "minus") typing = typing.startsWith("−") ? typing.slice(1) : `−${typing}`;
    else if (key === "back") typing = typing.slice(0, -1);
    else if (key === "enter" && digits !== "") {
      const value = Number(typing.replace("−", "-"));
      if (battle.ruledOut.includes(value)) {
        // Trying it again costs nothing, and teaches nothing either; the field clears for another.
        ref("feedback").textContent = `You tried ${formatNumber(value)} already. Try another number!`;
        typing = "";
        showTyping();
        return;
      }
      give(value);
      return;
    }
    showTyping();
  }

  /**
   * For a question answered on a number line, the tick for each choice, in
   * order, as the line's picture draws them to tap.
   * @param {import("../questions/common.js").Question} q
   * @returns {Element[]}
   */
  function ticksOf(q) {
    const line = /** @type {import("../questions/common.js").NumberLine} */ (q.visual);
    return q.choices.map((_, i) => /** @type {Element} */ (ref("picture").querySelector(`[data-part="tick-${line.from + i * line.tick}"]`)));
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
    const review = reviewOf?.(q.type) ?? null;
    ref("tag").hidden = !review;
    ref("tag").textContent = review ? `Review: ${review}` : "";
    ref("prompt").textContent = q.prompt;
    ref("picture").innerHTML = q.visual ? pictureHtml(q.visual) : "";
    const onLine = q.input === "line";
    const typed = q.input === "type";
    ref("choices").hidden = onLine || typed;
    // Typed: a number pad, with a minus sign from sixth grade, when negative numbers come in.
    ref("pad").hidden = !typed;
    // Cleared every time, so nothing of a typed answer is left on the hidden pad.
    typing = "";
    showTyping();
    ref("field").classList.remove("right", "wrong");
    ref("tried").textContent = "";
    if (typed) {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ...(battle.grade >= 6 ? ["minus"] : [])];
      ref("keys").innerHTML = keys.map(k => k === "minus"
        ? `<button type="button" class="numpad-key" data-key="minus" aria-label="minus">−</button>`
        : `<button type="button" class="numpad-key" data-key="${k}">${k}</button>`).join("");
    }
    // Long choices, such as the steps of a way to work something out, get a row each.
    ref("choices").classList.toggle("long", q.choices.some(c => String(c).length > 32));
    ref("choices").innerHTML = onLine || typed ? "" : q.choices.map((c, i) => {
      const out = battle.ruledOut.includes(c);
      return `<button type="button" class="choice${out ? " wrong" : ""}" data-index="${i}"${out ? " disabled" : ""}>
        <span class="key" aria-hidden="true">${i + 1}</span><span class="choice-text">${choiceHtml(c)}</span></button>`;
    }).join("");
    // On a number line, the ticks are what to tap, by keyboard too.
    if (onLine) {
      ticksOf(q).forEach((tick, i) => {
        tick.setAttribute("tabindex", "0");
        tick.setAttribute("role", "button");
        tick.classList.add("tappable");
        if (battle.ruledOut.includes(q.choices[i])) tick.classList.add("is-wrong");
      });
    }
    ref("next").hidden = true;
    ref("how").hidden = true;
    teach = null;
    setBusy(false);
    if (readAloud) readQuestion();
  }

  /** After an answer is shown, the way to see how it's done, if there is one. */
  let teach = /** @type {((done: () => void) => void) | null} */ (null);

  /**
   * Pick a choice, or a tick of a number line, by its place.
   * @param {number} index
   */
  function choose(index) {
    const q = battle.question;
    if (q && q.input !== "type") give(q.choices[index]);
  }

  /**
   * Give an answer: a choice, a tick, or a number typed in.
   * @param {Answer | undefined} choice
   */
  async function give(choice) {
    const q = battle.question;
    if (busy || !q || choice === undefined || battle.ruledOut.includes(choice)) return;
    setBusy(true);
    const onLine = q.input === "line";
    const typed = q.input === "type";
    // The choice buttons, a number line's ticks, or the typed answer's field; `disabled` only means anything on a button.
    const buttons = /** @type {HTMLButtonElement[]} */ (typed ? [] : onLine ? ticksOf(q) : [...ref("choices").querySelectorAll(".choice")]);
    /** @param {Element} el @param {boolean} right */
    const mark = (el, right) => el.classList.add(onLine ? (right ? "is-right" : "is-wrong") : (right ? "right" : "wrong"));
    buttons.forEach(b => { b.disabled = true; });
    mark(typed ? ref("field") : buttons[q.choices.indexOf(choice)], isCorrect(q, choice));

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
        if (typed) {
          // What was tried stays in sight, and the field is clear for another go.
          ref("tried").textContent = `Tried: ${battle.ruledOut.map(c => formatNumber(Number(c))).join(", ")}`;
          typing = "";
          showTyping();
          ref("field").classList.remove("wrong");
        }
        setBusy(false);
        return;
      case "reveal": {
        if (typed) {
          ref("field").textContent = formatNumber(Number(q.answer));
          ref("field").classList.remove("wrong");
        }
        mark(typed ? ref("field") : buttons[q.choices.indexOf(q.answer)], true);
        const next = ref("next");
        next.hidden = false;
        // Missed twice: a teaching scene for this kind of question can show how.
        teach = showMeHow?.(q.type) ?? null;
        ref("how").hidden = !teach;
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
  ref("pad").addEventListener("click", event => {
    const key = /** @type {HTMLElement} */ (event.target).closest("[data-key]");
    if (key instanceof HTMLElement) {
      sound.play("click");
      press(key.dataset.key ?? "");
    }
  });
  // A tick tapped, on a question answered on the number line.
  ref("picture").addEventListener("click", event => {
    const tick = /** @type {Element} */ (event.target).closest(".tappable");
    const q = battle.question;
    if (!tick || q?.input !== "line") return;
    const line = /** @type {import("../questions/common.js").NumberLine} */ (q.visual);
    choose(Math.round((Number(tick.getAttribute("data-part")?.slice("tick-".length)) - line.from) / line.tick));
  });
  ref("picture").addEventListener("keydown", event => {
    const tick = /** @type {Element} */ (event.target).closest(".tappable");
    if (!tick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    tick.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  ref("read")?.addEventListener("click", () => readQuestion());
  ref("how").addEventListener("click", () => {
    if (!teach) return;
    sound.play("click");
    speaker?.stop();
    teach(() => ref("next").focus());
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
    // A typed answer takes the digit keys, minus, Backspace and Enter, unless a button other than
    // the number pad's has the focus, where Enter is that button's.
    if (battle.question?.input === "type") {
      const onButton = event.target instanceof HTMLButtonElement && !event.target.closest("[data-ref=pad]");
      const key = /^\d$/.test(event.key) ? event.key : event.key === "-" ? "minus" : event.key === "Backspace" ? "back" : event.key === "Enter" && !onButton ? "enter" : "";
      if (key && !(key === "minus" && battle.grade < 6)) {
        event.preventDefault();
        press(key);
      }
      return;
    }
    // The number keys pick a choice; on a number line, Tab and Enter pick a tick instead.
    if (/^[1-4]$/.test(event.key) && battle.question?.input !== "line") choose(Number(event.key) - 1);
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
