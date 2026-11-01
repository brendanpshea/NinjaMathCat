// Builds a gallery of sample questions with their pictures, as one HTML page,
// for reviewing the visuals by eye: out/gallery.html.
//
//   npm run gallery            the same samples every time
//   SEED=7 npm run gallery     a different set
//
// Each question type with pictures gets a section, with samples from every
// grade that asks it. The page can filter by grade and hide the answers.

import { mkdirSync, writeFileSync } from "node:fs";
import { createRng } from "../src/rng.js";
import { CURRICULUM, GRADES } from "../src/curriculum.js";
import { makeQuestion } from "../src/questions/common.js";
import { renderVisual } from "../src/visuals/index.js";
import { escapeXml as esc } from "../src/visuals/svg.js";

const SEED = Number(process.env.SEED ?? 1);
const PER_GRADE = 2;
/** The question types this step added, shown first. */
const NEW = ["area", "volume", "angles", "coordinates"];

const rng = createRng(SEED);
const labelFor = grade => GRADES.find(g => g.grade === grade)?.label ?? `Grade ${grade}`;
const gradeGroup = grade => (grade < 1 ? "K" : String(Math.floor(grade)));

/** A choice as the page shows it: fractions stacked, in MathML, as the game will show them. */
function choiceHtml(choice) {
  const fraction = String(choice).match(/^(\d+)\/(\d+)$/);
  if (!fraction) return esc(choice);
  return `<math aria-label="${esc(choice)}"><mfrac><mn>${fraction[1]}</mn><mn>${fraction[2]}</mn></mfrac></math>`;
}

function card(question, grade) {
  const dots = [1, 2, 3].map(d => `<span class="dot${d <= question.difficulty ? " on" : ""}"></span>`).join("");
  const choices = question.choices.map((c, i) =>
    `<li class="choice${c === question.answer ? " right" : ""}"><span class="key">${i + 1}</span><span>${choiceHtml(c)}</span></li>`).join("");
  return `
      <article class="card" data-group="${gradeGroup(grade)}">
        <header class="card-head">
          <span class="grade">${esc(labelFor(grade))}</span>
          <span class="difficulty" title="Difficulty ${question.difficulty} of 3" aria-label="Difficulty ${question.difficulty} of 3">${dots}</span>
        </header>
        <div class="paper">${renderVisual(question.visual)}</div>
        <p class="prompt">${esc(question.prompt)}</p>
        <ol class="choices">${choices}</ol>
        <p class="hint"><span>Hint</span> ${esc(question.hint)}</p>
      </article>`;
}

const entries = [...CURRICULUM].sort((a, b) => Number(NEW.includes(b.type.id)) - Number(NEW.includes(a.type.id)));
const sections = [];
let total = 0;
for (const { type, from, to, standards } of entries) {
  const cards = [];
  for (const { grade } of GRADES.filter(g => g.grade >= from && g.grade <= to)) {
    let found = 0;
    for (let tries = 0; found < PER_GRADE && tries < 40; tries++) {
      const question = makeQuestion(rng, type, grade);
      if (!question.visual) continue;
      cards.push(card(question, grade));
      found++;
    }
  }
  if (cards.length === 0) continue;
  total += cards.length;
  const isNew = NEW.includes(type.id);
  sections.push(`
    <section class="type" id="${type.id.replace(/_/g, "-")}">
      <div class="type-head">
        <h2>${esc(type.name)}${isNew ? ' <span class="new">New</span>' : ""}</h2>
        ${standards.length ? `<p class="standards">${standards.map(s => `<span>${esc(s)}</span>`).join("")}</p>` : ""}
      </div>
      <div class="grid">${cards.join("")}
      </div>
    </section>`);
}

const contents = entries
  .filter(({ type }) => sections.some(s => s.includes(`id="${type.id.replace(/_/g, "-")}"`)))
  .map(({ type }) => `<a href="#${type.id.replace(/_/g, "-")}">${esc(type.name)}</a>`).join("");

const page = `<title>Ninja Math Cat Visuals</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;600&display=swap">
<style>
  /* Layout: a contact sheet of worksheet cards, one section per question type, filtered by grade. */
  :root {
    --bg: #eef2f8;
    --surface: #ffffff;
    --paper: #ffffff;
    --fg: #1b2333;
    --muted: #586377;
    --line: #d5dce8;
    --accent: #2457d6;
    --accent-soft: #e2eafc;
    --right: #157f3b;
    --right-soft: #dcf5e4;
    --display: "Fredoka", "Trebuchet MS", system-ui, sans-serif;
    --body: "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #10151f; --surface: #182031; --paper: #eef1f6; --fg: #e5e9f1; --muted: #a3adc0; --line: #2b3549;
      --accent: #8aaeff; --accent-soft: #1d2b4b; --right: #5fd68b; --right-soft: #15301f; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #10151f; --surface: #182031; --paper: #eef1f6; --fg: #e5e9f1; --muted: #a3adc0; --line: #2b3549;
    --accent: #8aaeff; --accent-soft: #1d2b4b; --right: #5fd68b; --right-soft: #15301f; color-scheme: dark;
  }
  body {
    background: var(--bg); color: var(--fg); font: 16px/1.5 var(--body);
    padding-block: 28px 56px;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
  }
  .wrap { max-width: 1180px; margin: 0 auto; display: grid; gap: 36px; }
  .intro { display: grid; gap: 10px; max-width: 68ch; }
  h1 { font: 600 clamp(28px, 4vw, 38px)/1.1 var(--display); margin: 0; text-wrap: balance; letter-spacing: 0.005em; }
  .intro p { margin: 0; color: var(--muted); }
  code { font-size: 0.92em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
  .controls {
    display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center;
    padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
    position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5;
  }
  body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
  .controls .label { font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    font: 700 15px/1 var(--body); color: var(--fg); background: transparent; cursor: pointer;
    border: 1.5px solid var(--line); border-radius: 999px; padding: 8px 14px;
  }
  .chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--surface); }
  .toggle { display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; margin-left: auto; }
  .toggle input { width: 18px; height: 18px; accent-color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  nav.contents { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 15px; }
  nav.contents a { color: var(--accent); text-decoration: none; font-weight: 700; }
  nav.contents a:hover { text-decoration: underline; }
  .type { display: grid; gap: 14px; scroll-margin-top: 90px; }
  .type-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; border-bottom: 2px solid var(--line); padding-bottom: 8px; }
  h2 { font: 600 24px/1.2 var(--display); margin: 0; }
  .new { font: 700 12px/1 var(--body); letter-spacing: 0.08em; text-transform: uppercase; vertical-align: middle;
    color: var(--accent); background: var(--accent-soft); border-radius: 999px; padding: 4px 8px; }
  .standards { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
  .standards span { font-size: 13px; font-weight: 700; color: var(--muted); border: 1px solid var(--line); border-radius: 6px; padding: 2px 7px; font-variant-numeric: tabular-nums; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); align-items: start; }
  .card { display: grid; gap: 10px; min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
  .card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .grade { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; color: var(--muted); }
  .difficulty { display: inline-flex; gap: 4px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--muted); }
  .dot.on { background: var(--muted); }
  .paper { background: var(--paper); border-radius: 10px; padding: 10px; display: grid; place-items: center; }
  .paper svg { width: 100%; height: auto; max-height: 260px; display: block; }
  .prompt { margin: 0; font-weight: 700; font-size: 17px; }
  .choices { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .choice { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px 10px; border: 1.5px solid var(--line); border-radius: 9px; overflow-wrap: anywhere; }
  .key { flex: none; font-size: 12px; font-weight: 700; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; width: 20px; text-align: center; }
  .show-answers .choice.right { border-color: var(--right); background: var(--right-soft); }
  .show-answers .choice.right::after { content: "✓"; margin-left: auto; color: var(--right); font-weight: 700; }
  .hint { margin: 0; font-size: 14px; color: var(--muted); display: none; }
  .hint span { font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 12px; margin-right: 4px; }
  .show-answers .hint { display: block; }
  math { font-size: 1.1em; }
  footer { color: var(--muted); font-size: 14px; }
  @media (max-width: 520px) { .toggle { margin-left: 0; } }
</style>

<main class="wrap show-answers" id="gallery">
  <header class="intro">
    <h1>Ninja Math Cat visuals</h1>
    <p>${total} sample questions, each drawn by the game's own code from data it made up for that question. Sections marked New are the graphs, number lines and fraction models added in this step; the rest are the pictures the questions already had, now drawn.</p>
  </header>

  <div class="controls" role="group" aria-label="Filter the samples">
    <span class="label">Grade</span>
    <div class="chips" id="grades">
      <button class="chip" type="button" data-group="all" aria-pressed="true">All</button>
      <button class="chip" type="button" data-group="K" aria-pressed="false">K</button>
      <button class="chip" type="button" data-group="1" aria-pressed="false">1st</button>
      <button class="chip" type="button" data-group="2" aria-pressed="false">2nd</button>
      <button class="chip" type="button" data-group="3" aria-pressed="false">3rd</button>
    </div>
    <label class="toggle"><input type="checkbox" id="answers" checked> Show answers and hints</label>
  </div>

  <nav class="contents" aria-label="Question types">${contents}</nav>
${sections.join("\n")}

  <footer>Made by <code>npm run gallery</code> with seed ${SEED}. Run it with another <code>SEED</code> for a fresh set.</footer>
</main>

<script>
  const gallery = document.getElementById("gallery");
  const chips = [...document.querySelectorAll("#grades .chip")];
  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const group = chip.dataset.group;
      for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
      for (const card of gallery.querySelectorAll(".card")) card.hidden = group !== "all" && card.dataset.group !== group;
      for (const section of gallery.querySelectorAll(".type")) section.hidden = !section.querySelector(".card:not([hidden])");
    });
  }
  document.getElementById("answers").addEventListener("change", event => {
    gallery.classList.toggle("show-answers", event.target.checked);
  });
</script>
`;

mkdirSync("out", { recursive: true });
writeFileSync("out/gallery.html", page);
console.log(`Wrote out/gallery.html: ${total} questions in ${sections.length} sections (seed ${SEED}).`);
