# Ninja Math Cat

A math battle game for kindergarten through 6th grade. Each right answer powers
your hero's attack; each wrong one lets the monster strike back.

Each grade, from kindergarten to 6th, is an adventure of eight chapters in
the order a school year usually takes them, with forty short levels in all:
a few hours of play, meant to be spread over many class sessions. A chapter
opens with a note on its topic and a worked example, brings the topic in with
its easiest questions, practises it, reviews it with what came before, and
ends with a boss. Every Common Core math standard from kindergarten to 6th
grade has questions, with pictures to read where the standards call for them:
ten frames, clocks, coins, rulers, jugs and scales, graphs and box plots,
number lines, fraction bars and hundredths grids, areas, nets, boxes of cubes,
protractors and coordinate grids. The few standards that are really about
doing things with hands, like writing numerals or building shapes, get an
on-screen stand-in; the real thing is still best done with paper and blocks.

Several children can share a device, each with their own name, hero, grade
and progress, all saved in the browser after every level; nothing leaves it.
A grown-up can open a later chapter to match what a class is studying, and a
quick battle of eight monsters is always there for a few spare minutes.

The game learns, from every answer, how well each child knows each kind of
question. Each level's review goes mostly to what they find hard or haven't
practised lately; shaky topics come easier, and strong ones harder; a kind
they miss comes back a couple of questions later. The training ground builds
a short battle from the topics that need it most, and a progress report shows
grown-ups how each topic is going.

For children still learning to read, questions can be read aloud (on to begin
with up to 2nd grade), and every question and chapter note has a "Read to me"
button. Graphs come with their numbers for screen readers, everything can be
played with the keyboard, nothing is timed, and the stage keeps still for
anyone who asks their device for reduced motion. A progress code moves a
child's hero, levels and treasures to another device, with no account.

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
| `src/save.js` | What the browser remembers: each player, with their hero, grade, experience, treasures and progress in every grade's adventure. A save from before there were players becomes the first player. |
| `src/adventures.js` | Each grade's adventure: its chapters, with their notes and the question types each brings in; the levels in each chapter, what each asks (pitched by the player's mastery) and which monsters it fights; training levels; and progress, stars and which levels are open. |
| `src/speech.js` | Reading aloud: math as a child hears it ("3/4" is "3 fourths"), and the browser's speech, where it has any. |
| `src/progress_code.js` | A player's progress as a code to paste into another browser, and back. |
| `src/mastery.js` | How well a player knows each kind of question, from their answers: a score that follows recent answers, how much a kind needs review, and how hard to pitch it. |
| `src/sound.js`, `src/zzfx.js` | Sound effects, made by ZzFX as the game runs. |
| `src/rng.js` | Seeded random numbers. Pass the same seed and you get the same question, which is how the tests replay a failure. |
| `src/curriculum.js` | The grade ladder, and the table of which question types each grade asks and which Common Core standards each covers. |
| `src/questions/` | One file per family of question types. Each type turns `(rng, grade)` into a prompt, an answer, likely wrong answers and a hint. |
| `src/visuals/` | Draws a question's picture as SVG: counters, patterns, coins, clocks, shapes, number lines, picture and bar graphs, fraction models. Each renderer is a plain function from data to markup. |
| `src/battle.js` | A battle as a state machine. `answer(battle, choice, rng)` returns the next state and a `round` saying what happened, for the stage to act out. It has no timers and never touches the page. |
| `src/combat.js` | The numbers: health, attack, damage, streaks, experience and levels. |
| `src/monsters.js`, `src/heroes.js`, `src/treasures.js` | Who you fight (four tiers, each with a name and a line for young readers), who you can play as, and what monsters drop. |
| `src/backdrops.js` | The sixteen settings battles happen in. Each is home to three monsters, and a chapter of an adventure happens in one; its backdrop goes behind the fight. |
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
   and which Common Core standards it covers. Then put it in a chapter of
   each of those grades' adventures in `src/adventures.js`, in `learn` where
   the chapter is about it or `warmup` where it is review; a test checks that
   every type a grade asks comes up in its adventure. A type can also offer
   `focuses`, narrower things a chapter can ask for (multiplication offers
   the facts with 2, 5 and 10, then the rest), named in the chapter's
   `focus`.
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
The painted backdrops were made for this game with Gemini (see below). Sound effects
are made with [ZzFX](https://github.com/KilledByAPixel/ZzFX) by Frank Force
(MIT license).

### Backdrops

Each monster lives in one of sixteen settings, and the stage puts that setting's
backdrop behind the fight, with the fighters standing on its floor line. The
painted backdrops are made with Gemini, four to a picture:

1. `assets/backdrops/scenes.json` describes the settings, four to a sheet.
   `npm run backdrop-prompts` turns it into the prompts in
   `assets/backdrops/prompts.md`.
2. Save each picture Gemini makes as `assets/backdrops/sheets/<sheet>.png`
   (or `.jpg` or `.webp`).
   The sheets are source material and stay out of git.
3. `python tools/cut_backdrops.py` (it needs Pillow) cuts each sheet into four
   1920 x 800 backdrops in `assets/backdrops/`.
4. Point the setting's `file` in `src/backdrops.js` at its new backdrop, and
   look at it with `npm run backdrops`. Adjust its `floor` until the fighters
   stand on the ground.

## License

GPL-3.0. See [LICENSE](LICENSE).
