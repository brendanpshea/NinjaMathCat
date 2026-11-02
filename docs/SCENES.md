# Writing a teaching scene

A teaching scene opens a chapter, before its first battle. The chapter's
first monster shows off its trick, and the hero works out, step by step over
a picture, how to beat it. Then they fight. A chapter without a scene opens
with its note instead, and every scene can still lead to that note.

A scene is also shown again in the middle of a battle. When a child misses a
question twice and the answer is shown, a "Show me how" button plays the
scene of the nearest chapter that brings in that kind of question. So a
scene must make sense on its own, at any point in the chapter, and must
teach the kind of question the chapter brings in first.

Each grade's scenes are in `src/scenes/grade<N>.js` (0 for kindergarten),
gathered by `src/scenes.js`. `src/ui/scene_view.js` plays them. The two scenes
so far are the models to copy:

| Chapter | Grade | Picture | What it teaches |
|---|---|---|---|
| `0-teens`, Teen numbers | K | two ten frames | a teen number is a full ten and some more |
| `4-decimals`, Fraction stories and decimals | 4 | a hundredths grid, as an ice wall | tenths and hundredths, written as decimals |

## The shape of a scene

```js
{
  chapter: "0-teens",           // the chapter's id in src/adventures.js
  steps(rng, { monster, hero }) {
    const n = rng.int(11, 19);  // numbers new each time, from rng
    const frames = focus => ({ kind: "ten_frame", frames: 2, filled: n, ...(focus ? { focus } : {}) });
    return [
      { who: "monster", say: `I'm ${monster}! I rain dots. Too many to count!`, picture: frames() },
      { who: "hero", say: "This frame is full. A full frame is 10.", picture: frames("frame-0") },
      // ...
      { who: "monster", say: "Which frame holds 10? Tap it!",
        check: { kind: "tap", answers: ["frame-0"], retry: "Find the frame with no empty boxes.", right: "Yes! That one holds 10." } },
      { who: "monster", say: "You can count my dots! Now, let's battle!" },
    ];
  },
}
```

- `who` is `"monster"` or `"hero"`. The monster speaks in a lower voice.
- `say` is said aloud and shown in the speaker's bubble.
- `picture` is any picture the questions use (see `Visual` in
  `src/questions/common.js`), or a math card (below). It stays on screen
  until a later step brings a new one.
- `picture.focus` names a part of the picture to ring, or a list of them.
  The ring lasts only for the step that sets it. A step without its own
  picture keeps the picture but loses the ring.
- `check` is optional. It's tried before the scene goes on, with nothing at
  stake. `retry` is said after a wrong try and `right` after the right one,
  both by the hero.

## The rules

These are checked by `tests/scenes.test.js` over 150 examples of every scene,
unless marked *(by eye)*.

1. **One idea per step.** One line and one change to the picture. A scene
   has 3 to 8 steps. The picture comes in the first step.
2. **Short lines.** At most 14 words in kindergarten to 2nd grade, and 28 from
   3rd grade on, for every line, `retry` and `right` included.
3. **Nothing to read below 3rd grade.** The voice says every line and the
   picture carries the idea. A check there is a tap on the picture, or a
   choice of numbers, never of words.
4. **Written to be said.** Read-aloud speaks the line just as it is written,
   through `speakable` in `src/speech.js`. Use digits for numbers and words
   for signs: "10 and 4 more make 14", not "10 + 4 = 14". No sign may be left
   unspoken, so no `+ − × ÷ = < >`, and no `$` or `¢`, in a line. Signs are
   fine in a math card.
5. **The monster shows its trick; the hero beats it.** The monster opens,
   asks the checks, and ends with a line into the battle, such as "Now,
   let's battle!" The hero explains. Keep the lines in the first and second
   person, so neither ever needs a pronoun. *(by eye)*
6. **A worked example, with new numbers each time.** Draw every number from
   `rng`, so a scene watched again is a new example. Each grade's
   `tests/scenes_grade<N>.test.js` works every example through again from its
   picture, independently of how the scene worked it out.
7. **Teach the chapter's first kind of question.** The example is that kind
   of question, as its first level asks it, on the same picture where it has
   one. A chapter's kinds are its `learn` list in `src/adventures.js`.
   *(by eye)*
8. **A check has one right answer among others.** A tap check's answers must
   be parts the picture really has, and at least one part must be wrong. A
   choice check has 3 or 4 different choices, one of them right. Wrong
   choices should be the mistakes children really make, as in the questions:
   0.6 for 0.06, the digits turned round, or the part left over.
9. **Never point at the answer while asking for it.** A tap check's step has
   no ring. *(Checked.)* A `retry` points at where to look without giving
   the answer: "Find the frame with no empty boxes", not "It's the first
   one." *(by eye)*
10. **Explain any picture you dress up.** If the hundredths grid is an ice
    wall, the line that brings it in says so ("my wall of 100 ice blocks").
    Never leave a child to work out what a picture stands for. *(by eye)*
11. **Right for one and for many.** Numbers come out new each time, so check
    the words for 1 as well as for 2 or more: "1 block", "1 hundredth".
    The scene sheet's printed scripts show this quickly.

## Pointing and tapping: the parts of each picture

Every picture names its parts. A **part** (`data-part`) can be tapped in a
tap check and ringed. A **mark** (`data-marks`) can only be ringed. Parts
and marks are both names for `focus`; only parts are names for a tap check's
`answers`.

| Picture | Parts, to tap or ring | Marks, to ring only |
|---|---|---|
| `objects` | `item-0`, `item-1`, ... | `crossed` |
| `pattern` | `item-0`, ..., and `gap` for the missing one | |
| `groups` | `row-0`, `row-1`, ... | |
| `ten_frame` | `frame-0`, `frame-1` | |
| `base_ten` | `flat-0`..., `rod-0`..., `unit-0`... | `flats`, `rods`, `units` |
| `money` | `item-0`, `item-1`, ..., left to right | |
| `clock` | `hour-hand`, `minute-hand` | `number-1` to `number-12` |
| `number_line` | `tick-<n>` at each tick, in the line's units (so `tick-3` is 3/den) | `point-<n>`, `jump-0`, `jump-1`... |
| `fraction` | `part-0`, `part-1`, ... | `shaded` |
| `fraction_bars` | `bar-0-part-0`, ..., `bar-1-part-0`, ... | `bar-0`, `bar-0-shaded`, ... |
| `hundredths` | `column-0` to `column-9` | `square-0` to `square-99`, `full` (shaded full columns), `extra` (the shaded squares left over) |
| `area`, grid | `row-0`, `row-1`, ... | `column-0`..., `cell-<col>-<row>` |
| `area`, no grid | `side-top`, `side-right`, `side-bottom`, `side-left` | |
| `bar_graph` | `bar-0`, `bar-1`, ... | |
| `picture_graph` | `row-0`, `row-1`, ... | |
| `line_plot` | `position-0`, `position-1`, ..., left to right | |
| `coordinates` | `point-<label>`, such as `point-A` | |
| `lengths` | `ribbon-<color>`, such as `ribbon-red` | `ruler` |
| `box_plot` | `box`, `median`, `whisker-low`, `whisker-high` | |
| `double_line` | `pair-0`, `pair-1`, ..., a mark on both lines | `top-0`..., `bottom-0`... |
| `math` | `t<line>-<index>`, such as `t0-2`, each token | `line-0`, `line-1`, ... |

Other pictures (shapes, solids, scenes, angles, nets and the rest) have no
parts yet. They can still be shown, just not ringed or tapped. To give a
picture parts, mark them in its renderer with `data-part` and an
`aria-label`, or `data-marks`. For anything too thin to tap, lay an invisible
`hit()` from `src/visuals/svg.js` over it. Then add the picture to the
fixtures in `tests/visuals.test.js`.

## The math card

For topics with no picture of their own, such as place value, multiplying,
expressions, equations or factors, a math card writes math out large, a line
at a time, so a scene can point at its numbers and signs:

```js
{ kind: "math", lines: [["3", "×", "(", "4", "+", "2", ")"], ["3", "×", "6"], ["18"]], focus: ["t0-2", "t0-6"] }
```

Each token is a part, named `t<line>-<index>`. A digit can be a token of its
own, so `["4", ",", "3", "8", "2"]` lets a scene ring the hundreds digit.

## Writing and checking a grade's scenes

1. Add the scenes to `src/scenes/grade<N>.js`, one per chapter, in the
   chapter order of `src/adventures.js`.
2. In `tests/scenes_grade<N>.test.js`, work each scene's examples through
   again from its pictures, as `tests/scenes_grade0.test.js` and
   `tests/scenes_grade4.test.js` do. Use `playedScenes(chapter)` from
   `tests/helpers/scenes.js`.
3. Run `npm test`. It checks every rule above that can be checked.
4. Run `npm run scene-sheet -- <N>`. It prints every scene's script and draws
   every step in `out/screens/scenes-<N>.png`, rings included. Read the
   scripts aloud in your head, and look at every picture. Try another seed
   (`npm run scene-sheet -- <N> 7`) to see other numbers.
5. Run `npm run screens -- scene <chapter>` for a scene as it plays in the
   game, a step at a time, on a laptop and a phone.
6. Run `npm run playthrough -- <N>`. It plays the grade's whole adventure,
   scenes included, and reports anything amiss.
