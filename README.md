# Ninja Math Cat

A math battle game for kindergarten through 6th grade. Each right answer powers
your hero's attack; each wrong one lets the monster strike back.

> **Being rebuilt.** The original game is in [`legacy/`](legacy/) and still
> runs from there. This version has its question engine and tests so far; the
> battle stage and screens come next. Grades K–3 are written, and 4–6 will follow.

## Working on it

You need Node 22 or newer.

```sh
npm install                   # installs TypeScript, used only to check types
npm run check                 # type-check src/, then run the tests
npm run sample -- 2.5         # print ten sample questions for mid-second grade
npm run sample -- 1 5 money   # five money questions for first grade
```

There is no build step. The browser runs `src/` exactly as written. Types come
from JSDoc comments, and `tsc` checks them without compiling anything.

## How it's organized

| Path | What it holds |
| --- | --- |
| `src/rng.js` | Seeded random numbers. Pass the same seed and you get the same question, which is how the tests replay a failure. |
| `src/curriculum.js` | The grade ladder, and the table of which question types each grade asks. The Common Core standard behind each placement is noted beside it. |
| `src/questions/` | One file per family of question types. Each type turns `(rng, grade)` into a prompt, an answer, likely wrong answers and a hint. |
| `tests/` | `node --test`, with no test framework to install. |
| `tools/sample_questions.js` | Prints questions as a child would see them, for checking new content by eye. |

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
