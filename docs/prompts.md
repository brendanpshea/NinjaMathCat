# Icon prompts

> Built by `tools/icon_prompts.js` from `tools/icon_sheets.json`, which keeps
> every icon, drawn or not. This page has only what is still to draw;
> `npm run icon-prompts -- --all` writes every sheet's prompt to
> `out/all-prompts.md`. Edit the JSON and run `npm run icon-prompts`; changes made
> here are overwritten.

1. Start a new chat for each prompt, so one picture doesn't steer the next,
   and paste the prompt in. Ask for the largest size offered (2K or 4K if
   there's a choice): each icon is a small part of the picture.
2. Attach a finished sheet and add "Match the style of the attached sheet
   exactly." It keeps the icons looking like one game.
3. Check the picture: separate icons, laid out as the prompt asks; a flat
   magenta background with nothing touching the edges; no writing or
   numbers; no pink, magenta or purple inside an icon (it would be cut away
   with the background), nor a pink haze around a glowing thing or showing
   through glass (the magenta mixed in; it stays pink); each icon what its
   line asks for. If one icon is wrong, ask for just that one again: "Keep
   everything else the same, but redraw the bottom-left icon as ..."
4. Save it under the name given above its prompt. Sheets are source
   material and stay out of git.
5. Cut it: `python tools/cut_icons.py <its name>`, such as
   `python tools/cut_icons.py chapters-k` or `python tools/cut_icons.py
   fixes`. Look at `out/icons.html` to check the icons, then run
   `npm run pwa` so the game keeps them for playing offline.

## To draw again

### Fix-up sheet: `assets/treasures/sheets/fixes.png`

Three icons that came out wrong, drawn together so the sheets they came from stay as they are:

- Make-Ten Board (from chapters-k): The board came out with three rows of six holes, not two rows of five.
- Star Scepter (from chapters-5): A pink haze around the star: its glow was painted over the magenta.
- Lantern of Lost Things (from keepsakes-9): Pink glass and a pink haze: its glow was painted over the magenta.

Attach the sheets chapters-k, chapters-5 and keepsakes-9, from `assets/treasures/sheets/`, so they match. Then `python tools/cut_icons.py fixes` replaces just these. Once they're right, take the `"redo"` off them in `tools/icon_sheets.json`, delete `fixes.png`, and run `npm run icon-prompts`.

```text
Make one wide picture, 16:9, at the highest resolution you can. It holds three separate icons for a cute 2D fantasy math game for children, side by side in one row, evenly spaced. Each icon sits alone in the middle of its own part of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All of them share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). About icons 1 and 2: They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. About icon 3: They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its space. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The three icons, left to right:
1. Left: A little wooden board with exactly ten round holes, in two rows of five, like a ten frame: seven holes hold red marbles and three are empty. Made of painted wood and bright, glossy enamel, like precious toys.
2. Middle: A tall, grand gold scepter topped with a big bright gold star, crisp-edged, with no glow around it. Made of deep midnight-blue enamel and gold, scattered with tiny gold stars.
3. Right: An old brass lantern with a yellow flame behind solid amber glass that you can't see through, and no glow around it.
```
