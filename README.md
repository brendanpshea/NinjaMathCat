# Ninja Math Cat

A math battle game for kindergarten through 6th grade. Each right answer powers
your hero's attack; each wrong one lets the monster strike back.

> **Being rebuilt.** The original game is in [`legacy/`](legacy/) and still
> runs from there. This version has its question engine, battle rules and
> question pictures so far, with tests. The battle stage and the screens come
> next. Grades K–3 are written, and 4–6 will follow.

## Working on it

You need Node 22 or newer.

```sh
npm install                   # installs TypeScript, used only to check types
npm run check                 # type-check src/, then run the tests
npm run sample -- 2.5         # print ten sample questions for mid-second grade
npm run sample -- 1 5 money   # five money questions for first grade
npm run simulate -- 2         # how adventures go for children of different accuracy
npm run gallery               # out/gallery.html: sample questions with their pictures
```

There is no build step. The browser runs `src/` exactly as written. Types come
from JSDoc comments, and `tsc` checks them without compiling anything.

## How it's organized

| Path | What it holds |
| --- | --- |
| `src/rng.js` | Seeded random numbers. Pass the same seed and you get the same question, which is how the tests replay a failure. |
| `src/curriculum.js` | The grade ladder, and the table of which question types each grade asks and which Common Core standards each covers. |
| `src/questions/` | One file per family of question types. Each type turns `(rng, grade)` into a prompt, an answer, likely wrong answers and a hint. |
| `src/visuals/` | Draws a question's picture as SVG: counters, patterns, coins, clocks, shapes, number lines, picture and bar graphs, fraction models. Each renderer is a plain function from data to markup. |
| `src/battle.js` | A battle as a state machine. `answer(battle, choice, rng)` returns the next state and a `round` saying what happened, for the stage to act out. It has no timers and never touches the page. |
| `src/combat.js` | The numbers: health, attack, damage, streaks, experience and levels. |
| `src/monsters.js`, `src/treasures.js` | Who you fight (four tiers), and what they drop. |
| `tests/` | `node --test`, with no test framework to install. `balance.test.js` plays whole adventures to check the game still feels right. |
| `tools/` | `sample_questions.js` prints questions as a child would see them. `simulate_battle.js` shows how the balance plays out. `build_gallery.js` makes a page of sample questions with their pictures. |

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

The hero and monster sprites will come from
[Loop of the Recursive Dragon](https://github.com/brendanpshea/LotRD). Each
one is a three-pose strip (stand, attack, recoil). The backgrounds are this
project's own, in `legacy/assets/sprites/backgrounds/` for now.

## License

GPL-3.0. See [LICENSE](LICENSE).
