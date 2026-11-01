// Builds a page for trying the battle stage: the real battle rules, stage and
// questions, with every monster and hero to pick from, and the roster with
// their names. It is a workbench for the stage, not the game's own screens.
//
//   npm run stage
//
// Writes out/stage-preview/index.html, which loads the game's files from
// beside it (as it does when published), and out/stage-preview/local.html,
// which loads them from the repository. To open the local one, serve the
// repository root, e.g. `python -m http.server 8080`, and go to
// http://localhost:8080/out/stage-preview/local.html

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { MONSTERS, monsterSprite } from "../src/monsters.js";
import { HEROES, heroSprite } from "../src/heroes.js";
import { escapeXml as esc } from "../src/visuals/svg.js";
import { webpSize } from "./webp_size.js";

const TIERS = ["First battles", "Getting tougher", "Halfway there", "The toughest"];

/** A still of a sprite's standing pose, the right shape for its strip. */
function still(file) {
  const { width, height } = webpSize(readFileSync(file));
  return `<div class="still" style="background-image: url('${file}'); aspect-ratio: ${width / 3} / ${height}"></div>`;
}

const heroes = HEROES.map(h => `
        <li class="who">${still(heroSprite(h))}<p class="who-name">${esc(h.name)}</p></li>`).join("");

const monsters = TIERS.map((title, i) => `
      <div class="tier">
        <h3>Tier ${i + 1} <span>${esc(title)}</span></h3>
        <ul class="roster">${MONSTERS.filter(m => m.tier === i + 1).map(m => `
          <li class="who">${still(monsterSprite(m))}<p class="who-name">${esc(m.name)}</p><p class="who-line">${esc(m.description)}</p></li>`).join("")}
        </ul>
      </div>`).join("");

const page = `<title>Ninja Math Cat Stage</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;600&display=swap">
<link rel="stylesheet" href="css/stage.css">
<style>
  /* Layout: the stage across the top, the question under it and the settings beside, the roster below. */
  :root {
    --bg: #eef2f8;
    --surface: #ffffff;
    --paper: #ffffff;
    --fg: #1b2333;
    --muted: #586377;
    --line: #d5dce8;
    --accent: #2457d6;
    --accent-soft: #e2eafc;
    --on-accent: #ffffff;
    --display: "Fredoka", "Trebuchet MS", system-ui, sans-serif;
    --body: "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #10151f; --surface: #182031; --paper: #eef1f6; --fg: #e5e9f1; --muted: #a3adc0; --line: #2b3549;
      --accent: #8aaeff; --accent-soft: #1d2b4b; --on-accent: #10151f; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #10151f; --surface: #182031; --paper: #eef1f6; --fg: #e5e9f1; --muted: #a3adc0; --line: #2b3549;
    --accent: #8aaeff; --accent-soft: #1d2b4b; --on-accent: #10151f; color-scheme: dark;
  }
  body {
    background: var(--bg); color: var(--fg); font: 16px/1.5 var(--body);
    padding-block: 28px 56px;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
  }
  .wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 28px; }
  .intro { display: grid; gap: 8px; max-width: 70ch; }
  h1 { font: 600 clamp(28px, 4vw, 38px)/1.1 var(--display); margin: 0; text-wrap: balance; }
  h2 { font: 600 24px/1.2 var(--display); margin: 0; }
  h3 { font: 600 18px/1.2 var(--display); margin: 0; }
  h3 span { font: 700 13px/1 var(--body); color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-left: 6px; }
  .intro p { margin: 0; color: var(--muted); }
  kbd { font: 700 0.85em var(--body); border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 4px; padding: 0 5px; }

  .bench { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr) 260px; align-items: start; }
  .play { display: grid; gap: 14px; min-width: 0; }
  .question { display: grid; gap: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
  .prompt { margin: 0; font-weight: 700; font-size: 19px; }
  .picture:empty { display: none; }
  .picture { background: var(--paper); border-radius: 10px; padding: 10px; display: grid; place-items: center; }
  .picture svg { width: 100%; height: auto; max-height: 240px; display: block; }
  .choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: 8px; }
  button { font: inherit; cursor: pointer; }
  .choice {
    font-weight: 700; font-size: 18px; color: var(--fg); background: var(--surface);
    border: 2px solid var(--line); border-radius: 10px; padding: 10px 12px; text-align: left;
    display: flex; gap: 10px; align-items: center;
  }
  .choice:hover:not(:disabled) { border-color: var(--accent); }
  .choice:disabled { opacity: 0.4; cursor: default; text-decoration: line-through; }
  .choice .key { font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 6px; }
  .note { margin: 0; min-height: 1.5em; color: var(--muted); font-weight: 700; }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

  .side { display: grid; gap: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
  .field { display: grid; gap: 4px; }
  .field label { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
  select { font: inherit; color: var(--fg); background: var(--bg); border: 1.5px solid var(--line); border-radius: 8px; padding: 7px 8px; width: 100%; }
  .quick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .quick button { font-weight: 700; border-radius: 9px; padding: 9px 8px; border: 1.5px solid var(--accent); }
  .quick .yes { background: var(--accent); color: var(--on-accent); }
  .quick .no { background: transparent; color: var(--accent); }
  button:disabled { cursor: default; }
  .log { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 14px; color: var(--muted); }
  .log li:first-child { color: var(--fg); font-weight: 700; }

  .cast { display: grid; gap: 18px; }
  .tier { display: grid; gap: 10px; }
  .roster { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); }
  .who { display: grid; gap: 4px; align-content: start; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
  .still { height: 96px; max-width: 100%; justify-self: center; background-repeat: no-repeat; background-size: 300% 100%; background-position: 0 0; }
  .who-name { margin: 6px 0 0; font-weight: 700; }
  .who-line { margin: 0; font-size: 14px; color: var(--muted); }
  .load-error { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin: 0; }

  @media (max-width: 820px) { .bench { grid-template-columns: minmax(0, 1fr); } }
</style>

<main class="wrap">
  <header class="intro">
    <h1>Ninja Math Cat stage</h1>
    <p>The battle stage running on the game's own rules and questions. Answer by clicking a choice or pressing <kbd>1</kbd>–<kbd>4</kbd>, or skip the maths with <kbd>R</kbd> for a right answer and <kbd>W</kbd> for a wrong one. Pick any monster to fight it next.</p>
  </header>

  <p class="load-error" id="load-error" hidden>The stage couldn't load its code. Reload the page to try again.</p>

  <section class="bench" aria-label="Battle">
    <div class="play">
      <div id="stage"></div>
      <div class="question">
        <p class="prompt" id="prompt">Loading…</p>
        <div class="picture" id="picture"></div>
        <div class="choices" id="choices"></div>
        <p class="note" id="note" aria-live="polite"></p>
      </div>
    </div>
    <aside class="side" aria-label="Settings">
      <div class="field"><label for="hero">Hero</label><select id="hero"></select></div>
      <div class="field"><label for="monster">Fight</label><select id="monster"></select></div>
      <div class="field"><label for="grade">Questions for</label><select id="grade"></select></div>
      <div class="quick">
        <button type="button" class="yes" id="right">Right answer</button>
        <button type="button" class="no" id="wrong">Wrong answer</button>
      </div>
      <ol class="log" id="log" aria-label="What happened, newest first"></ol>
    </aside>
  </section>

  <section class="cast" aria-labelledby="cast-title">
    <h2 id="cast-title">The heroes</h2>
    <ul class="roster">${heroes}
    </ul>
    <h2>The monsters</h2>${monsters}
  </section>
</main>

<script>
  setTimeout(() => { if (!window.stageReady) document.getElementById("load-error").hidden = false; }, 5000);
</script>
<script type="module">
  import { createRng } from "./src/rng.js";
  import { startBattle, answer } from "./src/battle.js";
  import { MONSTERS } from "./src/monsters.js";
  import { HEROES, DEFAULT_HERO } from "./src/heroes.js";
  import { GRADES } from "./src/curriculum.js";
  import { narrate } from "./src/stage.js";
  import { createStage } from "./src/ui/stage_view.js";
  import { renderVisual } from "./src/visuals/index.js";

  window.stageReady = true;
  const $ = id => document.getElementById(id);
  const rng = createRng();
  const stage = createStage($("stage"));
  let hero = DEFAULT_HERO;
  let battle;
  let busy = false;

  $("hero").append(...HEROES.map((h, i) => new Option(h.name, String(i))));
  const tiers = [1, 2, 3, 4].map(tier => {
    const group = document.createElement("optgroup");
    group.label = "Tier " + tier;
    MONSTERS.forEach((m, i) => { if (m.tier === tier) group.append(new Option(m.name, String(i))); });
    return group;
  });
  $("monster").append(...tiers);
  $("grade").append(...GRADES.map(g => new Option(g.label, String(g.grade))));
  $("grade").value = "2";

  function begin() {
    battle = startBattle(rng, { grade: Number($("grade").value), adventure: MONSTERS.slice(Number($("monster").value)) });
    stage.show(battle, hero);
    $("log").replaceChildren();
    showQuestion("");
  }

  function showQuestion(note) {
    $("note").textContent = note;
    const q = battle.question;
    if (!q) {
      $("prompt").textContent = "Every monster is beaten! Pick one to fight again.";
      $("picture").replaceChildren();
      $("choices").replaceChildren();
      return;
    }
    $("prompt").textContent = q.prompt;
    $("picture").innerHTML = q.visual ? renderVisual(q.visual) : "";
    $("choices").replaceChildren(...q.choices.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.disabled = battle.ruledOut.includes(c);
      b.innerHTML = '<span class="key">' + (i + 1) + "</span>";
      b.append(String(c));
      b.addEventListener("click", () => respond(c));
      return b;
    }));
  }

  async function respond(choice) {
    if (busy || !battle.question) return;
    busy = true;
    for (const b of document.querySelectorAll(".choice, .quick button")) b.disabled = true;
    const before = battle;
    const { battle: after, round } = answer(battle, choice, rng);
    battle = after;
    const line = document.createElement("li");
    line.textContent = narrate(round, { hero: hero.name, monster: before.foe.monster.name });
    $("log").prepend(line);
    while ($("log").children.length > 6) $("log").lastElementChild.remove();
    await stage.play(round, before, after, hero);
    busy = false;
    for (const b of document.querySelectorAll(".quick button")) b.disabled = false;
    showQuestion(round.then === "again" ? "Not quite. Hint: " + round.hint
      : round.then === "reveal" ? "The answer was " + round.answer + "."
      : round.then === "won" ? "You won the battle!" : "");
  }

  const rightChoice = () => battle.question?.answer;
  const wrongChoice = () => battle.question?.choices.find(c => c !== battle.question.answer && !battle.ruledOut.includes(c));
  $("right").addEventListener("click", () => battle.question && respond(rightChoice()));
  $("wrong").addEventListener("click", () => battle.question && respond(wrongChoice()));
  $("hero").addEventListener("change", () => { hero = HEROES[Number($("hero").value)]; stage.show(battle, hero); });
  $("monster").addEventListener("change", begin);
  $("grade").addEventListener("change", begin);
  document.addEventListener("keydown", event => {
    if (event.target instanceof HTMLSelectElement || event.altKey || event.ctrlKey || event.metaKey || !battle.question) return;
    const key = event.key.toLowerCase();
    if (key === "r") respond(rightChoice());
    else if (key === "w") respond(wrongChoice());
    else if (["1", "2", "3", "4"].includes(key)) {
      const choice = battle.question.choices[Number(key) - 1];
      if (!battle.ruledOut.includes(choice)) respond(choice);
    }
  });

  begin();
</script>
`;

mkdirSync("out/stage-preview", { recursive: true });
writeFileSync("out/stage-preview/index.html", page);
writeFileSync("out/stage-preview/local.html",
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<base href="../../">\n</head>\n<body>\n${page}</body>\n</html>\n`);
console.log("Wrote out/stage-preview/index.html and local.html. Serve the repository root to open local.html.");
