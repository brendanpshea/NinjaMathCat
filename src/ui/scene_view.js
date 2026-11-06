// A teaching scene on the page: the hero and the chapter's first monster,
// the speaker's line in a bubble, and the picture under them, a step at a
// time. Each line is said aloud as it comes, where the player has read-aloud
// on, the monster in a lower voice. A check waits for its answer, with no
// damage at stake: a wrong try gets a pointer, a right one lets the scene go
// on. Nothing on the screen has to be read: the voice says every line, and the
// picture carries the idea.

import { heroSprite } from "../heroes.js";
import { monsterSprite } from "../monsters.js";
import { readButton } from "../speech.js";
import { escapeXml as esc } from "../visuals/svg.js";
import { choiceHtml, pictureHtml } from "./battle_screen.js";
import { still } from "./sprites.js";

/** @import { SceneStep } from "../scenes.js" */
/** @import { Hero } from "../heroes.js" */
/** @import { Monster } from "../monsters.js" */
/** @import { Speaker } from "../speech.js" */

/** How each one sounds. */
const PITCH = { hero: 1.15, monster: 0.75 };

/**
 * Ring the parts of a picture a scene points at: every element whose
 * data-part, or one of whose data-marks, is named, in one box round them
 * all. It is measured in the page, so it fits whatever the renderer drew,
 * wherever it was moved or turned.
 * @param {Element} svg
 * @param {string | string[] | undefined} focus
 */
export function ringFocus(svg, focus) {
  svg.querySelectorAll(".focus").forEach(ring => ring.remove());
  if (!focus || !(svg instanceof SVGSVGElement)) return;
  const names = [focus].flat();
  const named = [...svg.querySelectorAll("[data-part], [data-marks]")].filter(e =>
    names.includes(e.getAttribute("data-part") ?? "") || (e.getAttribute("data-marks") ?? "").split(" ").some(m => names.includes(m)));
  if (named.length === 0) return;
  const toPicture = svg.getScreenCTM()?.inverse();
  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const e of /** @type {SVGGraphicsElement[]} */ (named)) {
    const box = e.getBBox();
    const ctm = e.getScreenCTM();
    const matrix = toPicture && ctm ? toPicture.multiply(ctm) : null;
    for (const [x, y] of [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]) {
      const p = matrix ? new DOMPoint(x, y).matrixTransform(matrix) : { x, y };
      [left, top, right, bottom] = [Math.min(left, p.x), Math.min(top, p.y), Math.max(right, p.x), Math.max(bottom, p.y)];
    }
  }
  const pad = 6;
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  for (const [name, value] of Object.entries({ x: left - pad, y: top - pad, width: right - left + 2 * pad, height: bottom - top + 2 * pad, rx: 10, fill: "none", stroke: "#2563eb", "stroke-width": 5, "pointer-events": "none", class: "focus" })) {
    ring.setAttribute(name, String(value));
  }
  svg.append(ring);
}

/**
 * Play a scene inside an element, which it fills.
 * @param {HTMLElement} root
 * @param {object} setup
 * @param {string} setup.kicker  over the heading, such as "Chapter 8"
 * @param {string} setup.title
 * @param {SceneStep[]} setup.steps
 * @param {Hero} setup.hero
 * @param {Monster} setup.monster
 * @param {Speaker} [setup.speech]
 * @param {{ play: (name: string) => void }} setup.sound
 * @param {boolean} setup.readAloud  say each line as it comes
 * @param {string} setup.startLabel  the last button, into the battle, or back to it
 * @param {() => void} setup.onStart
 * @param {() => void} [setup.onNote]  the chapter's note instead, for a grown-up
 * @param {() => void} [setup.onMap]
 * @param {boolean} [setup.replay]  shown over a battle, after a miss: no skipping, note or map, only back to the battle
 */
export function runScene(root, { kicker, title, steps, hero, monster, speech, sound, readAloud, startLabel, onStart, onNote, onMap, replay = false }) {
  root.innerHTML = `
    <section class="scene-screen">
      <div class="scene-top">
        <p class="note-kicker">${esc(kicker)}</p>
        ${replay ? "" : `<button type="button" class="quiet scene-skip" data-ref="skip">Skip to the battle</button>`}
      </div>
      <h1 tabindex="-1">${esc(title)}</h1>
      <div class="scene-cast">
        <div class="scene-actor scene-actor--hero" data-ref="hero"></div>
        <div class="scene-bubble" data-ref="bubble">
          <p class="scene-speaker" data-ref="speaker"></p>
          <p class="scene-line" data-ref="line" aria-live="polite" tabindex="-1"></p>
        </div>
        <div class="scene-actor scene-actor--monster" data-ref="monster"></div>
      </div>
      <div class="picture scene-picture" data-ref="picture"></div>
      <div class="choices scene-choices" role="group" aria-label="Answers" data-ref="choices" hidden></div>
      <div class="actions">
        <button type="button" class="primary big" data-ref="next">Next</button>
        ${speech?.available ? `<button type="button" class="quiet read-aloud" data-ref="again"><span aria-hidden="true">🔈</span> ${readAloud ? "Say it again" : "Read to me"}</button>` : ""}
      </div>
      <ol class="scene-steps" aria-label="Steps">${steps.map((_, i) => `<li data-step="${i}"><span class="visually-hidden">Step ${i + 1}</span></li>`).join("")}</ol>
      ${replay ? "" : `<div class="actions scene-more">
        <button type="button" class="link" data-ref="note">Read the chapter note</button>
        <button type="button" class="link" data-ref="map">Back to the map</button>
      </div>`}
    </section>`;
  /** @param {string} name */
  const ref = name => /** @type {HTMLElement} */ (root.querySelector(`[data-ref="${name}"]`));
  ref("hero").append(still(heroSprite(hero), hero.name));
  ref("monster").append(still(monsterSprite(monster), monster.name));
  const next = /** @type {HTMLButtonElement} */ (ref("next"));

  // Shown again after a miss, the scene starts where the hero starts explaining, with the picture of that moment.
  let index = replay ? Math.max(0, steps.findIndex(s => s.who === "hero")) : 0;
  /** Whether the step's check has been answered rightly, or it has none. */
  let cleared = true;
  /** The picture showing, which stays from step to step until one brings a new one. */
  let picture = /** @type {import("../scenes.js").ScenePicture | undefined} */ ([...steps.slice(0, index + 1)].reverse().find(s => s.picture)?.picture);
  /** The picture last drawn. */
  let drawn = /** @type {typeof picture} */ (undefined);
  /** What was last said, to say again. */
  let said = { text: "", who: /** @type {"hero" | "monster"} */ ("hero") };

  /** @param {"hero" | "monster"} who @param {string} text */
  function speak(who, text) {
    said = { text, who };
    ref("speaker").textContent = who === "hero" ? hero.name : monster.name;
    ref("line").textContent = text;
    ref("bubble").dataset.from = who;
    ref("hero").classList.toggle("is-speaking", who === "hero");
    ref("monster").classList.toggle("is-speaking", who === "monster");
    // A new line: anything still being read was the last one.
    if (readAloud) speech?.say(text, { pitch: PITCH[who] });
    else speech?.stop();
  }

  function show() {
    const step = steps[index];
    if (step.picture) picture = step.picture;
    if (picture && picture !== drawn) {
      ref("picture").innerHTML = pictureHtml(picture);
      drawn = picture;
    }
    ref("picture").hidden = !root.querySelector(".scene-picture svg");
    const svg = root.querySelector(".scene-picture svg");
    if (svg) ringFocus(svg, step.picture?.focus); // a ring lasts only for the step that sets it
    // For tests and tools: what the step points at.
    ref("picture").dataset.focus = [step.picture?.focus ?? []].flat().join(" ");
    root.querySelectorAll(".scene-steps li").forEach((li, i) => li.classList.toggle("is-done", i <= index));
    speak(step.who, step.say);
    const check = step.check;
    cleared = !check;
    next.disabled = Boolean(check);
    next.textContent = index === steps.length - 1 ? startLabel : "Next";
    const choices = ref("choices");
    choices.hidden = check?.kind !== "choose";
    choices.innerHTML = check?.kind === "choose"
      ? check.choices.map((c, i) => `<button type="button" class="choice" data-index="${i}"><span class="key" aria-hidden="true">${i + 1}</span><span class="choice-text">${choiceHtml(c)}</span></button>`).join("")
      : "";
    // Parts of the picture to tap, as buttons a keyboard can reach too.
    for (const part of root.querySelectorAll(".scene-picture [data-part]")) {
      if (check?.kind === "tap") {
        part.setAttribute("tabindex", "0");
        part.setAttribute("role", "button");
        part.classList.add("tappable");
      } else {
        part.removeAttribute("tabindex");
        part.removeAttribute("role");
        part.classList.remove("tappable", "is-right", "is-wrong");
      }
    }
    // On a check, the question takes the focus, so it is read out and Tab goes on to the parts or choices
    // after it; focusing a part itself would ring it, as if pointing out the answer.
    if (check) ref("line").focus();
  }

  /**
   * A try at the step's check.
   * @param {boolean} right
   * @param {Element} target
   */
  function attempt(right, target) {
    const check = steps[index].check;
    if (!check || cleared) return;
    target.classList.add(right ? "is-right" : "is-wrong");
    // A try is an answer, so whatever was being read stops.
    speech?.stop();
    // A sparkle for the right one; a wrong try is only a click, with nothing lost.
    sound.play(right ? "drop" : "click");
    if (right) {
      cleared = true;
      next.disabled = false;
      for (const part of root.querySelectorAll(".scene-picture .tappable")) part.removeAttribute("tabindex");
      root.querySelectorAll(".scene-choices .choice").forEach(b => { /** @type {HTMLButtonElement} */ (b).disabled = b !== target; });
      speak("hero", check.right);
      next.focus();
    } else {
      if (target instanceof HTMLButtonElement) target.disabled = true;
      speak("hero", check.retry);
    }
  }

  ref("picture").addEventListener("click", event => {
    const check = steps[index].check;
    const part = /** @type {Element} */ (event.target).closest(".tappable");
    if (check?.kind === "tap" && part) attempt(check.answers.includes(part.getAttribute("data-part") ?? ""), part);
  });
  ref("picture").addEventListener("keydown", event => {
    const part = /** @type {Element} */ (event.target).closest(".tappable");
    if (!part || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    part.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  ref("choices").addEventListener("click", event => {
    const check = steps[index].check;
    const button = /** @type {Element} */ (event.target).closest(".choice");
    if (check?.kind !== "choose" || !(button instanceof HTMLButtonElement) || button.disabled) return;
    attempt(String(check.choices[Number(button.dataset.index)]) === String(check.answer), button);
  });
  next.addEventListener("click", () => {
    if (!cleared) return;
    sound.play("click");
    if (index === steps.length - 1) {
      speech?.stop();
      onStart();
      return;
    }
    index++;
    show();
  });
  readButton(ref("again"), speech, () => speech?.say(said.text, { pitch: PITCH[said.who] }));
  ref("skip")?.addEventListener("click", () => { sound.play("click"); speech?.stop(); onStart(); });
  ref("note")?.addEventListener("click", () => { sound.play("click"); speech?.stop(); onNote?.(); });
  ref("map")?.addEventListener("click", () => { sound.play("click"); speech?.stop(); onMap?.(); });
  show();
}
