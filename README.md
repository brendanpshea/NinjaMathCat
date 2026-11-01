# Ninja Math Cat

A math battle game for kindergarten through 6th grade. Each right answer powers
your hero's attack; each wrong one lets the monster strike back.

Pick a hero and a grade, then fight your way through eight monsters. Questions
follow the Common Core math standards from kindergarten to 6th grade, with
pictures to read where the standards call for them: clocks, graphs, number
lines, fraction models, areas, boxes of cubes, protractors and coordinate
grids. Your level and the treasures you find are saved in your browser, and
nothing leaves it.

**Play it:** open `index.html` through any web server (see below), or on the
project's GitHub Pages site. The original version of the game is kept in
[`legacy/`](legacy/).

## Working on it

You need Node 22 or newer.

```sh
npm install                   # installs TypeScript, used only to check types
npm run check                 # type-check src/, then run the tests
npm run sample -- 2.5         # print ten sample questions for mid-second grade
npm run sample -- 1 5 money   # five money questions for first grade
npm run coverage -- 5         # which 5th grade standards the questions cover, and which they don't yet
npm run simulate -- 2         # how adventures go for children of different accuracy
npm run gallery               # out/gallery.html: sample questions with their pictures
npm run stage                 # out/stage-preview/: try the battle stage with any hero and monster
npm run screens               # out/screens/: screenshots of every screen, desktop and phone
npm run backdrops             # out/screens/backdrops.png: every backdrop behind real fighters
```

The game loads its files as ES modules, so it needs a web server rather than
opening the file directly: from the repository root run
`python -m http.server 8080` and go to http://localhost:8080/. Add `?seed=7`
to get the same questions every time. The stage preview is at
http://localhost:8080/out/stage-preview/local.html.

`npm test` includes `tests/browser.test.js`, which plays a whole adventure in
headless Chrome or Edge. Without either browser it is skipped, with a warning.

There is no build step. The browser runs `src/` exactly as written. Types come
from JSDoc comments, and `tsc` checks them without compiling anything.

## How it's organized

| Path | What it holds |
| --- | --- |
| `index.html`, `src/main.js` | The page, and what starts the game on it. |
| `src/ui/app.js`, `src/ui/battle_screen.js`, `css/game.css` | The screens: title (hero and grade), battle (the stage and the question), victory, and the treasure collection. |
| `src/save.js`, `src/progress.js` | What the browser remembers, and a suggestion of an easier or harder grade after an adventure. |
| `src/sound.js`, `src/zzfx.js` | Sound effects, made by ZzFX as the game runs. |
| `src/rng.js` | Seeded random numbers. Pass the same seed and you get the same question, which is how the tests replay a failure. |
| `src/curriculum.js` | The grade ladder, and the table of which question types each grade asks and which Common Core standards each covers. |
| `src/questions/` | One file per family of question types. Each type turns `(rng, grade)` into a prompt, an answer, likely wrong answers and a hint. |
| `src/visuals/` | Draws a question's picture as SVG: counters, patterns, coins, clocks, shapes, number lines, picture and bar graphs, fraction models. Each renderer is a plain function from data to markup. |
| `src/battle.js` | A battle as a state machine. `answer(battle, choice, rng)` returns the next state and a `round` saying what happened, for the stage to act out. It has no timers and never touches the page. |
| `src/combat.js` | The numbers: health, attack, damage, streaks, experience and levels. |
| `src/monsters.js`, `src/heroes.js`, `src/treasures.js` | Who you fight (four tiers, each with a name and a line for young readers), who you can play as, and what monsters drop. |
| `src/backdrops.js` | The eight settings battles happen in. Each monster lives in one, and its backdrop goes behind the fight. |
| `src/stage.js` | A round as a sequence of timed beats (the hero lunges, the monster reels…) and as a sentence for screen readers. |
| `src/ui/stage_view.js`, `css/stage.css` | The battle stage on the page: plays a round's beats with CSS animations, and does nothing at all under reduced motion. |
| `assets/` | Sprite strips for the heroes and monsters, and the backdrops. |
| `tests/` | `node --test`, with no test framework to install. `balance.test.js` plays whole adventures to check the game still feels right, and `browser.test.js` plays one in a real browser. |
| `tools/` | `sample_questions.js` prints questions as a child would see them. `simulate_battle.js` shows how the balance plays out. `build_gallery.js` makes a page of sample questions with their pictures, `build_stage_preview.js` a page for trying the stage, and `screenshots.js` pictures of every screen. |

### How a battle works

- Each question gets two tries. A wrong answer lets the monster hit back, rules out that choice, and shows a hint. A second miss shows the right answer and moves on.
- Right answers hit harder for harder questions and on a streak (1.25× at 3 in a row, 1.5× at 5, 2× at 8). A right answer on the second try hits half as hard.
- Getting knocked out is never game over. The hero gets straight back up and the monster keeps its damage, but that monster won't drop a treasure.
- The hero's level carries over between adventures, and each adventure is pitched at it: the first monsters match the hero's level, the last are three above. Heroes and monsters grow at the same rate, so the game feels the same at level 30 as at level 1.

A question's picture (counters, a clock, a bar graph) is data, not markup.
The question says *a clock at 2:50*, and `renderVisual` in `src/visuals/`
turns that into SVG. Both halves are tested without a browser: questions are
answered again from their data, and `tests/visuals.test.js` checks that what is
drawn matches it (bar heights, pictures per row, where a dot sits on a line,
how many parts are shaded, and every shape's sides and angles).

### Adding a question type

1. Write a `QuestionType` (an `id`, a `name` and `generate(rng, grade)`) in
   `src/questions/`. Use `atGrade` to scale it by grade, and `wrongNumbers`
   for numeric distractors.
2. Add a row to `CURRICULUM` in `src/curriculum.js` saying which grades ask it
   and which Common Core standards it covers.
3. If it needs a new kind of picture, add the kind to `Visual` in
   `src/questions/common.js`, a renderer in `src/visuals/`, and a description
   in `src/visuals/describe.js` that doesn't give the answer away.
4. The fairness tests in `tests/questions.test.js` pick it up on their own.
   They check for four distinct choices, exactly one of them right, the answer
   in every position, and no tell in where it sits among the numbers.
   `tests/visuals.test.js` renders its pictures. Then add a test that works the
   answers out independently, and look at it with `npm run gallery`.

## Art

The hero and monster sprites come from
[Loop of the Recursive Dragon](https://github.com/brendanpshea/LotRD), the
same author's quiz game, along with the stage's choreography and animations.
Each sprite is a strip of three poses (stand, attack, recoil), all facing
right; the stage mirrors the monster. LotRD's `images/sprites/roster.json`
and `tools/sprite_prompts.py` and `tools/sprite_sheets.py` make new ones.
The backdrops are this game's own, from the original version. Sound effects
are made with [ZzFX](https://github.com/KilledByAPixel/ZzFX) by Frank Force
(MIT license).

### Backdrops

Each monster lives in one of eight settings, and the stage puts that setting's
backdrop behind the fight, with the fighters standing on its floor line. The
painted backdrops are made with Gemini, four to a picture:

1. `assets/backdrops/scenes.json` describes the settings, four to a sheet.
   `npm run backdrop-prompts` turns it into the prompts in
   `assets/backdrops/prompts.md`.
2. Save each picture Gemini makes as `assets/backdrops/sheets/<sheet>.png`.
   The sheets are source material and stay out of git.
3. `python tools/cut_backdrops.py` (it needs Pillow) cuts each sheet into four
   1920 x 800 backdrops in `assets/backdrops/`.
4. Point the setting's `file` in `src/backdrops.js` at its new backdrop, and
   look at it with `npm run backdrops`. Adjust its `floor` until the fighters
   stand on the ground.


## License

GPL-3.0. See [LICENSE](LICENSE).
