# Ninja Math Cat

A math battle game for kindergarten through 6th grade. Each right answer powers
your hero's attack; each wrong one lets the monster strike back.

> **Being rebuilt.** The original game is in [`legacy/`](legacy/) and still
> runs from there. This version has its question engine and battle rules so
> far, with tests. Pictures and graphs, the battle stage and the screens come
> next. Grades K–3 are written, and 4–6 will follow.

## Working on it

You need Node 22 or newer.

```sh
npm install                   # installs TypeScript, used only to check types
npm run check                 # type-check src/, then run the tests
npm run sample -- 2.5         # print ten sample questions for mid-second grade
npm run sample -- 1 5 money   # five money questions for first grade
npm run simulate -- 2         # how adventures go for children of different accuracy
```

There is no build step. The browser runs `src/` exactly as written. Types come
from JSDoc comments, and `tsc` checks them without compiling anything.

## How it's organized

| Path | What it holds |
| --- | --- |
| `src/rng.js` | Seeded random numbers. Pass the same seed and you get the same question, which is how the tests replay a failure. |
| `src/curriculum.js` | The grade ladder, and the table of which question types each grade asks. The Common Core standard behind each placement is noted beside it. |
| `src/questions/` | One file per family of question types. Each type turns `(rng, grade)` into a prompt, an answer, likely wrong answers and a hint. |
| `src/battle.js` | A battle as a state machine. `answer(battle, choice, rng)` returns the next state and a `round` saying what happened, for the stage to act out. It has no timers and never touches the page. |
| `src/combat.js` | The numbers: health, attack, damage, streaks, experience and levels. |
| `src/monsters.js`, `src/treasures.js` | Who you fight (four tiers), and what they drop. |
| `tests/` | `node --test`, with no test framework to install. `balance.test.js` plays whole adventures to check the game still feels right. |
| `tools/` | `sample_questions.js` prints questions as a child would see them. `simulate_battle.js` shows how the balance plays out. |

### How a battle works

- Each question gets two tries. A wrong answer lets the monster hit back, rules out that choice, and shows a hint. A second miss shows the right answer and moves on.
- Right answers hit harder for harder questions and on a streak (1.25× at 3 in a row, 1.5× at 5, 2× at 8). A right answer on the second try hits half as hard.
- Getting knocked out is never game over. The hero gets straight back up and the monster keeps its damage, but that monster won't drop a treasure.
- The hero's level carries over between adventures, and each adventure is pitched at it: the first monsters match the hero's level, the last are three above. Heroes and monsters grow at the same rate, so the game feels the same at level 30 as at level 1.

A question's picture (counters, a clock, coins, a shape) is data, not markup.
The question says *a clock at 2:50* and the UI decides how to draw it, so
questions can be tested without a browser.

### Adding a question type

1. Write a `QuestionType` (an `id`, a `name` and `generate(rng, grade)`) in
   `src/questions/`. Use `atGrade` to scale it by grade, and `wrongNumbers`
   for numeric distractors.
2. Add a row to `CURRICULUM` in `src/curriculum.js` saying which grades ask it.
3. The fairness tests in `tests/questions.test.js` pick it up on their own.
   They check for four distinct choices, exactly one of them right, the answer
   in every position, and no tell in where it sits among the numbers. Then add
   a test that works the answers out independently.

## Art

The hero and monster sprites will come from
[Loop of the Recursive Dragon](https://github.com/brendanpshea/LotRD). Each
one is a three-pose strip (stand, attack, recoil). The backgrounds are this
project's own, in `legacy/assets/sprites/backgrounds/` for now.

## License

GPL-3.0. See [LICENSE](LICENSE).
