// The one-minute challenge on the page (src/challenge.js): a clock running
// down, the score, and one question after another. A right answer flashes and
// the next comes at once; a wrong one shows the right answer for a moment.
// The number keys answer, as in a battle.

import { answerChallenge, CHALLENGE_SECONDS } from "../challenge.js";
import { choiceHtml, pictureHtml } from "./battle_screen.js";

/** @import { Challenge } from "../challenge.js" */
/** @import { Rng } from "../rng.js" */
/** @import { SoundSystem } from "../sound.js" */

/** How long a right answer shows before the next question, and a wrong one with its answer, in ms. */
const PAUSE = { right: 250, wrong: 1100 };

/**
 * @param {HTMLElement} root
 * @param {object} options
 * @param {Challenge} options.challenge
 * @param {Rng} options.rng
 * @param {SoundSystem} options.sound
 * @param {number} [options.seconds]
 * @param {(challenge: Challenge) => void} options.onDone  when the time is up
 * @param {() => void} options.onStop  when the player stops early
 * @returns {{ destroy(): void, readonly challenge: Challenge }}
 */
export function createChallengeScreen(root, { challenge: start, rng, sound, seconds = CHALLENGE_SECONDS, onDone, onStop }) {
  let challenge = start;
  let busy = false;
  let over = false;
  const listening = new AbortController();
  /** @type {ReturnType<typeof setTimeout>[]} */
  const timers = [];

  root.innerHTML = `
    <section class="challenge">
      <div class="challenge-bar">
        <h1 class="journey-title" tabindex="-1">One-minute challenge</h1>
        <p class="challenge-clock" data-ref="clock" role="timer" aria-label="Seconds left"></p>
        <p class="challenge-score" data-ref="score"></p>
        <button type="button" class="quiet" data-ref="stop">Stop</button>
      </div>
      <div class="challenge-time" aria-hidden="true"><span data-ref="bar"></span></div>
      <p class="visually-hidden" aria-live="polite" data-ref="news"></p>
      <div class="panel">
        <div class="ask" data-ref="ask">
          <p class="prompt" data-ref="prompt"></p>
          <div class="picture" data-ref="picture"></div>
        </div>
        <div class="choices" role="group" aria-label="Answers" data-ref="choices"></div>
        <p class="feedback" aria-live="polite" data-ref="feedback"></p>
      </div>
    </section>`;
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));
  /** @param {number} ms */
  const wait = ms => new Promise(resolve => { timers.push(setTimeout(resolve, ms)); });

  const ends = performance.now() + seconds * 1000;
  /** The times still to be said aloud, in seconds left. */
  const toSay = [30, 10].filter(s => s < seconds);
  function tick() {
    const left = Math.max(0, ends - performance.now());
    const whole = Math.ceil(left / 1000);
    ref("clock").textContent = String(whole);
    ref("clock").classList.toggle("is-low", left <= 10000);
    ref("bar").style.width = `${(100 * left) / (seconds * 1000)}%`;
    if (toSay.length > 0 && whole <= toSay[0]) ref("news").textContent = `${toSay.shift()} seconds left.`;
    if (left <= 0) finish();
  }
  const clock = setInterval(tick, 100);

  function finish() {
    if (over) return;
    over = true;
    stopAll();
    onDone(challenge);
  }

  function stopAll() {
    clearInterval(clock);
    timers.forEach(clearTimeout);
    listening.abort();
  }

  function showScore() {
    ref("score").textContent = `${challenge.score} right`;
  }

  function showQuestion() {
    const q = challenge.question;
    ref("prompt").textContent = q.prompt;
    ref("picture").innerHTML = q.visual ? pictureHtml(q.visual) : "";
    ref("choices").classList.toggle("long", q.choices.some(c => String(c).length > 32));
    ref("choices").innerHTML = q.choices.map((c, i) => `<button type="button" class="choice" data-index="${i}">
      <span class="key" aria-hidden="true">${i + 1}</span><span class="choice-text">${choiceHtml(c)}</span></button>`).join("");
    ref("feedback").textContent = "";
    busy = false;
  }

  /** @param {number} index */
  async function choose(index) {
    const q = challenge.question;
    const choice = q.choices[index];
    if (busy || over || choice === undefined) return;
    busy = true;
    const buttons = /** @type {HTMLButtonElement[]} */ ([...ref("choices").querySelectorAll(".choice")]);
    buttons.forEach(b => { b.disabled = true; });
    const result = answerChallenge(challenge, choice, rng);
    challenge = result.challenge;
    showScore();
    if (result.correct) {
      buttons[index].classList.add("right");
      ref("score").classList.remove("is-up");
      void ref("score").offsetWidth; // so the pop starts over
      ref("score").classList.add("is-up");
      sound.play("hit");
      await wait(PAUSE.right);
    } else {
      buttons[index].classList.add("wrong");
      buttons[q.choices.indexOf(q.answer)]?.classList.add("right");
      ref("feedback").innerHTML = `The answer is ${choiceHtml(q.answer)}.`;
      sound.play("hurt");
      await wait(PAUSE.wrong);
    }
    if (!over) showQuestion();
  }

  ref("choices").addEventListener("click", event => {
    const button = /** @type {HTMLElement} */ (event.target).closest(".choice");
    if (button instanceof HTMLButtonElement) choose(Number(button.dataset.index));
  });
  ref("stop").addEventListener("click", () => {
    sound.play("click");
    over = true;
    stopAll();
    onStop();
  });
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (/^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
  }, { signal: listening.signal });

  tick();
  showScore();
  showQuestion();

  return {
    destroy() {
      over = true;
      stopAll();
    },
    get challenge() {
      return challenge;
    },
  };
}
