# Backdrop prompts

> Built by `tools/backdrop_prompts.js` from `scenes.json`. Edit that and run
> `npm run backdrop-prompts`; changes made here are overwritten.

Each prompt makes one sheet: four painted backgrounds stacked in a tall
picture, one per setting, so the four share a style.

1. Paste a prompt into Gemini. Ask for the largest size it offers (2K or 4K):
   each backdrop is a quarter of the picture's height, and should come out at
   least 1600 pixels wide.
2. Save the picture under the name given above the prompt. The sheets are
   source material and stay out of git.
3. Run `python tools/cut_backdrops.py`, which cuts each sheet into four
   backdrops in `assets/backdrops/`, then `npm run backdrops` to see each one
   behind real fighters, on desktop and phone.
4. Regenerate if a panel has a creature or face in it, its middle is busy, its
   ground isn't flat along the bottom, or the four don't match in style.

## Sheet a: Sunny Meadow, Cottage Kitchen, Toy Attic, Windy Hilltop

Save Gemini's picture as `assets/backdrops/sheets/a.png` (or .jpg or .webp).

```text
Make one tall picture, portrait 9:16, at the highest resolution you can. It is a sheet of four separate backgrounds for a cute 2D fantasy battle game for children, stacked from top to bottom as four equal horizontal panels, each the full width of the picture. Separate the panels with a thin, straight, pure white line. Nothing crosses from one panel into the next.

All four panels share one style: a soft, painterly storybook illustration, like the background of a gentle animated film. Gentle shading, soft edges, thin light outlines, and a hazy, paler distance. Muted, harmonious colors, never neon. Soft daylight from the upper left.

Every panel follows the same layout, because two small characters will stand in front of it later, facing each other:
- A side view, with the camera at ground level looking straight across.
- The bottom fifth of the panel is flat, open, walkable ground running the whole width, seen from the side, with nothing standing on it.
- A low horizon, about two fifths of the way up.
- Tall things only at the far left and far right edges. The middle is open and calm.
- No people, animals, monsters, faces or creatures of any kind, and no statues or carvings of them. No text, signs or letters. No glowing or very bright objects. Not pixel art.

Panel 1 (top): a sunny meadow on a spring morning. The ground is short green grass with a worn dirt path. Behind it: rolling green hills, wildflowers, a small pond and a few round trees in the middle distance, soft clouds in a pale blue sky. At the far left edge, a flowering bush; at the far right edge, the trunk and low branches of a leafy tree. Don't draw ducks or birds on the pond.

Panel 2: a big, cozy cottage kitchen, seen from floor level. The ground is warm wooden floorboards. Behind it: a long wooden counter with jars and a bowl of tomatoes, copper pots hanging on the wall, a window with checked curtains looking onto a garden. At the far left edge, an old iron stove; at the far right edge, a tall painted cupboard. Don't draw teapots, spoons or ladles.

Panel 3: a tidy attic playroom under a sloping wooden roof. The ground is wide wooden boards with a round woven rug. Behind it: shelves of building blocks and picture books, baskets of folded blankets, a round window letting in soft sunlight. At the far left edge, a wooden toy chest; at the far right edge, a coat rack with a scarf. Don't draw brooms, balls of yarn, jigsaw puzzles or dolls.

Panel 4 (bottom): a grassy hilltop high above the clouds on a breezy day. The ground is the flat grassy top of the hill, with a few smooth stones. Behind it: a sea of fluffy white clouds below, distant blue mountain peaks, a few kites far away in a clear sky. At the far left edge, a lone windswept tree; at the far right edge, a wooden fence post with a fluttering ribbon. Don't draw swords, dragons or paper birds.
```

## Sheet b: Pumpkin Farm, Castle Hall, Swamp Bridge, Crystal Temple

Save Gemini's picture as `assets/backdrops/sheets/b.png` (or .jpg or .webp).

```text
Make one tall picture, portrait 9:16, at the highest resolution you can. It is a sheet of four separate backgrounds for a cute 2D fantasy battle game for children, stacked from top to bottom as four equal horizontal panels, each the full width of the picture. Separate the panels with a thin, straight, pure white line. Nothing crosses from one panel into the next.

All four panels share one style: a soft, painterly storybook illustration, like the background of a gentle animated film. Gentle shading, soft edges, thin light outlines, and a hazy, paler distance. Muted, harmonious colors, never neon. Soft daylight from the upper left.

Every panel follows the same layout, because two small characters will stand in front of it later, facing each other:
- A side view, with the camera at ground level looking straight across.
- The bottom fifth of the panel is flat, open, walkable ground running the whole width, seen from the side, with nothing standing on it.
- A low horizon, about two fifths of the way up.
- Tall things only at the far left and far right edges. The middle is open and calm.
- No people, animals, monsters, faces or creatures of any kind, and no statues or carvings of them. No text, signs or letters. No glowing or very bright objects. Not pixel art.

Panel 1 (top): a pumpkin farm in the golden light of late afternoon. The ground is soft brown earth between the rows. Behind it: rows of pumpkins and tall corn, a red barn and a windmill in the middle distance, a warm hazy sky. At the far left edge, a stack of hay bales; at the far right edge, a wooden fence with a gate. Don't draw scarecrows, goblins or wheels of cheese.

Panel 2: the great hall of a friendly castle. The ground is smooth gray flagstones with a long red carpet running across. Behind it: tall arched windows letting in soft daylight, colorful banners, a throne on steps far back. At the far left edge, a stone pillar with a hanging shield; at the far right edge, a tall potted plant beside a pillar. Don't draw suits of armor, knights, treasure chests or dragons.

Panel 3: an old stone bridge at the edge of a misty swamp. The ground is the flat, mossy stone deck of the bridge, seen from the side, with a low stone railing. Behind it: still green water with lily pads, reeds, drooping willow trees, soft mist. At the far left edge, a tall clump of reeds; at the far right edge, a gnarled willow trunk. Don't draw trolls, crocodiles, frogs or slime.

Panel 4 (bottom): inside an ancient temple built into a crystal cave. The ground is smooth, sandy stone tiles. Behind it: carved sandstone columns, a wide doorway up a few steps, purple and blue crystals growing from the cave walls, a glimpse of desert sky through an opening above. At the far left edge, a cluster of crystals; at the far right edge, a weathered sandstone pillar. Don't draw statues, sphinxes, dragons or bright glowing crystals.
```
