# Writing a teaching scene

A teaching scene opens a chapter, before its first battle. The chapter's
first monster shows off its trick, and the hero works out, step by step over
a picture, how to beat it. Then they fight. Scenes live in `src/scenes.js`;
`src/ui/scene_view.js` plays them. A chapter without a scene opens with its
note instead, and every scene can still lead to that note.

The two scenes so far are the models to copy:

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
    return [
      { who: "monster", say: `I'm ${monster}! I rain dots. Too many to count!`, picture: { kind: "ten_frame", frames: 2, filled: n } },
      { who: "hero", say: "This frame is full. A full frame is 10.", picture: { kind: "ten_frame", frames: 2, filled: n, focus: 0 } },
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
  `src/questions/common.js`). It stays until a later step changes it.
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
   unspoken, so no `+ − × ÷ = < >`, and no `$` or `¢`.
5. **The monster shows its trick; the hero beats it.** The monster opens,
   asks the checks, and ends with a line into the battle, such as "Now,
   let's battle!" The hero explains. Keep the lines in the first and second
   person, so neither ever needs a pronoun. *(by eye)*
6. **A worked example, with new numbers each time.** Draw every number from
   `rng`, so a scene watched again is a new example. Add a check to "work the
   example through rightly" in `tests/scenes.test.js` that works it out again
   from the picture.
7. **Teach what the chapter asks.** The example should be the kind of
   question the chapter's first level asks, on the same picture. *(by eye)*
8. **A check has one right answer among others.** A tap check's answers must
   be parts the picture really has, and at least one part must be wrong. A
   choice check has 3 or 4 different choices, one of them right. Wrong
   choices should be the mistakes children really make, as in the questions:
   0.6 for 0.06, the digits turned round, or the part left over.
9. **A `retry` points at where to look, without giving the answer.** "Find
   the frame with no empty boxes", not "It's the first one." *(by eye)*
10. **Explain any picture you dress up.** If the hundredths grid is an ice
    wall, the line that brings it in says so ("my wall of 100 ice blocks").
    Never leave a child to work out what a picture stands for. *(by eye)*

## Pointing at the picture

- **A ring.** To point at a part of the picture, give the picture a `focus`.
  So far, `ten_frame` takes a frame's number, and `hundredths` takes
  `{ column }` or `{ square }`. To give another kind of picture a focus, add
  it to its typedef and renderer, draw it with class `focus` and
  `pointer-events="none"`, and add a test in `tests/visuals.test.js`.
- **Something to tap.** A part a child can tap carries `data-part` and an
  `aria-label` in its renderer, such as `frame-0` "the first frame", or
  `column-3` "column 4". The scene makes these parts into buttons only
  during a tap check, so they do nothing in a battle.

## Seeing it

- `npm test` checks every rule above that can be checked.
- `npm run screens -- scene` takes screenshots of both scenes at desktop and
  phone sizes, on a step that points at the picture and on a check after a
  wrong try. To add a new scene's shots, add it to the `scene-` shots in
  `tools/screenshots.js` and to the `pose` scenario in
  `tests/helpers/harness.html`.
- `npm run playthrough -- <grade>` plays the grade's whole adventure, its
  scenes included, and reports anything amiss.
