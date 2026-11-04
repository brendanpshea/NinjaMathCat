# Icon prompts

> Built by `tools/icon_prompts.js` from `tools/icon_sheets.json`. Edit that
> and run `npm run icon-prompts`; changes made here are overwritten.

Each prompt makes one sheet: nine icons in a 3 x 3 grid on solid magenta,
which `tools/cut_icons.py` cuts into nine pictures with see-through
backgrounds.

1. Start a new chat for each prompt, so one sheet doesn't steer the next, and
   paste the prompt in. Ask for the largest size offered (2K or 4K if there's
   a choice): each icon is a ninth of the picture.
2. Once you have a sheet you like, attach it to later prompts and add "Match
   the style of the attached sheet exactly, but draw these nine new icons." It
   keeps the sets looking like one game.
3. Check the sheet: nine separate icons in three rows of three; a flat
   magenta background with nothing touching the edges; no writing or numbers;
   no pink, magenta or purple inside an icon (it would be cut away with the
   background); each icon what its line asks for. If one icon is wrong, ask
   for just that one again: "Keep everything else the same, but redraw the
   bottom-left icon as ..."
4. Save it under the name given above its prompt. Sheets are source material
   and stay out of git.
5. Run `python tools/cut_icons.py` (or name sheets: `python tools/cut_icons.py
   chapters-k`). It cuts each saved sheet into nine pictures in the sheet's
   folder and tells the game which treasures now have pictures. Look at
   `out/icons.html` to check them.

The chapter treasures come first, because each says what a chapter taught,
then the keepsakes, then the pictures questions show. Whatever isn't made
yet shows as its emoji, so the sheets can come in any order.

## Chapter treasures

One sheet per grade: the treasure for each of its eight chapters, and the grade's own treasure for finishing them all. Each grade's set is made of one material, and the materials grow grander from kindergarten to 6th grade.

### Chapter treasures 1: Kindergarten

Save as `assets/treasures/sheets/chapters-k.png`. It holds: Counting Crown, Pattern Beads, Shape Shield, Big and Little Bells, Jar of Joined Jewels, Take-Away Scoop, Make-Ten Board, Teen Tower, Kindergarten Star.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of painted wood and bright, glossy enamel, like precious toys.

The nine icons, left to right, top row first:
1. Top left: A small crown painted red, with five round gold dots in a row along its band and a yellow ball on each of its points.
2. Top middle: A necklace of big round beads in a repeating pattern: red, blue, red, blue, red, blue, tied with a bow.
3. Top right: A round shield painted blue, with a yellow triangle, a red square and a green circle on its front.
4. Middle left: Two golden bells hanging side by side from one wooden bar, one big and one small.
5. Center: A round glass jar with a cork, holding a heap of red gems and blue gems mixed together.
6. Middle right: A wooden scoop holding three seashells, with two more seashells tumbling out of it.
7. Bottom left: A little wooden board with two rows of five round holes, seven holes filled with red marbles and three left empty.
8. Bottom middle: A neat stack of ten gold coins, with four more gold coins in a little pile beside it.
9. Bottom right: A big plump golden star standing on a small round painted base, with a red ribbon tied around the base. The grandest of the nine.
```

### Chapter treasures 2: 1st grade

Save as `assets/treasures/sheets/chapters-1.png`. It holds: Plus and Minus Medal, Story Scroll, Even Scales, Bundle of Ten Wands, Tower of Tens, Hour Watch, Picture-Graph Banner, Fair-Share Shield, First Grade Trophy.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of polished bronze and warm copper, with teal and orange enamel.

The nine icons, left to right, top row first:
1. Top left: A round bronze medal hanging from a teal ribbon, with a raised plus sign on its left half and a raised minus sign on its right half.
2. Top middle: A half-unrolled scroll with copper handles, showing three little painted apples and a curved arrow, with no writing.
3. Top right: Small bronze balance scales, perfectly level, with three orange gems on each pan.
4. Middle left: Ten copper wands tied together in a bundle with a teal ribbon, with three loose wands lying beside the bundle.
5. Center: A little bronze tower made of ten stacked rings, with a small orange flag on top.
6. Middle right: A round bronze pocket watch on a short chain, its face marked with twelve little ticks instead of numbers, both hands pointing straight up.
7. Bottom left: A cloth banner hanging from a bronze pole, showing three rows of little fruit pictures, each row a different length.
8. Bottom middle: A round bronze shield divided into four equal slices, two slices enamelled orange and two teal.
9. Bottom right: A tall bronze trophy cup with two curly handles and a big teal gem on its front, on a copper base. The grandest of the nine.
```

### Chapter treasures 3: 2nd grade

Save as `assets/treasures/sheets/chapters-2.png`. It holds: Trading Purse, Clue-Finder Glass, Hundreds Blocks, Ruler Sword, Three-Lock Chest, Twin Pouches, Silver Piggy Bank, Quarter-Past Clock, Silver Crown.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of shining silver, set with blue and green gems.

The nine icons, left to right, top row first:
1. Top left: An open silver coin purse, with ten small silver coins spilling out next to one big shiny coin.
2. Top middle: A silver magnifying glass with a blue gem set in its handle.
3. Top right: A flat silver square made of a hundred tiny cubes, a rod of ten cubes, and three single cubes, all with blue edges.
4. Middle left: A short silver sword whose straight blade is marked along one edge with evenly spaced tick marks, like a ruler, with a green gem in the hilt.
5. Center: A small silver treasure chest with three round gem locks in a row on its front: blue, green, blue.
6. Middle right: Two matching silver-trimmed pouches side by side, each holding the same number of green gems.
7. Bottom left: A shiny silver piggy bank with a coin dropping into the slot on its back.
8. Bottom middle: A small silver mantel clock with twelve little ticks instead of numbers, its long hand pointing to the right and its short hand pointing straight up.
9. Bottom right: A tall silver crown set with blue and green gems. The grandest of the nine.
```

### Chapter treasures 4: 3rd grade

Save as `assets/treasures/sheets/chapters-3.png`. It holds: Golden Egg Box, Sharing Platter, Golden Stopwatch, Two-Key Lock, Square-Tile Shield, Fraction Pendant, Bar-Graph Trophy, Fence-Around Frame, Golden Goblet.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of gleaming gold, set with red and green gems.

The nine icons, left to right, top row first:
1. Top left: An open box holding golden eggs in three neat rows of four.
2. Top middle: A round golden platter with four small, equal piles of red gems on it.
3. Top right: A round gold stopwatch with a red button on top and little ticks around its face.
4. Middle left: A golden padlock with two keyholes, and two little golden keys beside it, one with a red gem and one with a green gem.
5. Center: A rectangular golden shield covered in a grid of small red and green squares, like a checkerboard.
6. Middle right: A golden pendant on a chain, its round face cut into eight equal slices, three of them set with red gems.
7. Bottom left: A small golden trophy whose top is a row of four golden bars of different heights.
8. Bottom middle: A square of little golden fence posts and rails running all the way around a patch of green grass.
9. Bottom right: A tall golden goblet set with a ring of red and green gems. The grandest of the nine.
```

### Chapter treasures 5: 4th grade

Save as `assets/treasures/sheets/chapters-4.png`. It holds: Crystal Abacus, Measuring Jug, Many-Gem Mirror, Leftover Jars, Right-Angle Compass, Fraction Bottles, Tenths Bracelet, Crystal Window, Crystal Crown.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of clear crystal and ice-blue glass, trimmed with gold.

The nine icons, left to right, top row first:
1. Top left: A small gold-framed abacus with clear crystal beads on four rods.
2. Top middle: A crystal jug with gold tick marks up its side, half full of glowing blue water.
3. Top right: A gold hand mirror whose glass shows many copies of one blue gem in neat rows.
4. Middle left: Three equal crystal jars of blue sweets in a row, with two sweets left over in front of them.
5. Center: A gold drawing compass, the two-legged kind for drawing circles, opened to a square corner, with a crystal at its hinge.
6. Middle right: Three little crystal bottles with gold stoppers, filled with glowing blue liquid to three different heights.
7. Bottom left: A gold bracelet set with ten crystals in a row, three of them glowing bright blue.
8. Bottom middle: A rectangular gold window frame filled with a grid of ice-blue glass panes.
9. Bottom right: A crown of tall, clear crystal spikes on a gold band. The grandest of the nine.
```

### Chapter treasures 6: 5th grade

Save as `assets/treasures/sheets/chapters-5.png`. It holds: Decimal Spoons, Starry Hat, Parentheses Bangle, Sixths Star Box, Shared Moon Cakes, Star Tape Measure, Cube-Filled Box, Star Map, Star Scepter.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of deep midnight-blue enamel and gold, scattered with tiny glowing stars.

The nine icons, left to right, top row first:
1. Top left: Three gold measuring spoons hanging on a ring, one big, one smaller and one tiny, each with a little star.
2. Top middle: A tall midnight-blue wizard hat covered in rows of little gold stars.
3. Top right: A glowing blue gem held between two curved gold bands, like a pair of round brackets.
4. Middle left: A round midnight-blue box whose lid is cut into six equal slices, five of them gold, with a star in the middle.
5. Center: Three round golden moon cakes on a midnight-blue plate, each cut into four equal pieces.
6. Middle right: A round gold tape measure with its midnight-blue tape pulled out, marked with gold ticks.
7. Bottom left: A clear glass box filled with little gold cubes stacked in neat layers.
8. Bottom middle: A square midnight-blue map with a gold grid of lines, and one bright star sitting where two lines cross.
9. Bottom right: A tall gold scepter topped with a big glowing star. The grandest of the nine.
```

### Chapter treasures 7: 6th grade

Save as `assets/treasures/sheets/chapters-6.png`. It holds: Ratio Bowls, Quarter Cups, Turning Gears, Frost Thermometer, Mystery Box, Jade Balance, Unfolded Box, Row of Pillars, Jade Crown.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are rare, precious treasures from a storybook adventure, each a single object standing upright on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

These nine are one matching set: all of them are made of carved green jade and gold, set with orange gems.

The nine icons, left to right, top row first:
1. Top left: Two jade bowls side by side, one holding two orange gems and the other holding three green gems.
2. Top middle: One big jade cup with four small gold quarter-cups lined up in front of it.
3. Top right: Two gold gears with jade centres, one big and one small, their teeth fitted together.
4. Middle left: A gold thermometer with a jade bulb and a white snowflake beside it, its red line low, below the middle mark.
5. Center: A closed jade box with a gold lid and a star-shaped gold keyhole, glowing softly.
6. Middle right: Gold balance scales, perfectly level, with a small closed jade box on one pan and a pile of orange gems on the other.
7. Bottom left: A jade box opened out flat into its six square faces, laid out in a cross shape and edged in gold.
8. Bottom middle: Five small jade pillars in a row from shortest to tallest, the middle one topped with a gold cap.
9. Bottom right: A grand crown of carved jade and gold, set with orange gems. The grandest of the nine.
```

## Keepsakes

The surprises a child finds when something learned days ago has stuck. Playful and a little silly, in no particular order.

### Keepsakes 1

Save as `assets/treasures/sheets/keepsakes-1.png`. It holds: Sparkly Gemstone, Crystal Ball of Mild Predictions, Wand of Whimsy, Rainbow Power, Magical Butterfly, Mirror of Many Faces, Moon Charm, Transformation Frog, Mystic Hook.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A large faceted gemstone that shines with stripes of red, orange, yellow, green and blue, sparkling.
2. Top middle: A clear pale-blue crystal ball on a little gold stand, with a swirl of white mist inside.
3. Top right: A short golden magic wand with a white star on its tip and two little sparkles.
4. Middle left: A small rainbow arc of red, orange, yellow, green and blue stripes, with a fluffy white cloud at each end.
5. Center: A butterfly with bright blue and orange wings and a few sparkles around it.
6. Middle right: An oval hand mirror with a fancy gold frame and shiny pale-blue glass.
7. Bottom left: A golden crescent moon charm hanging from a little loop.
8. Bottom middle: A cheerful green frog wearing a tiny golden crown, sitting up.
9. Bottom right: A big curved silver hook on a short chain, with a blue gem at its top.
```

### Keepsakes 2

Save as `assets/treasures/sheets/keepsakes-2.png`. It holds: Sun Medallion, Time Yo-Yo, Cookie of Speed, Rainbow Brush, Bard's Guitar, Disco Crystal, Bag of Giggling Gold, Crown of Mild Command, Mask of Many Voices.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A round golden medallion shaped like the sun, with pointed rays all around and an orange gem in the middle.
2. Top middle: A red and yellow yo-yo with its string looping up.
3. Top right: A round chocolate-chip cookie with a yellow lightning-bolt sprinkle on top and little white speed lines behind it.
4. Middle left: A paintbrush with a wooden handle, its bristles striped red, yellow, green and blue.
5. Center: A small wooden guitar with a red body and a golden star on it.
6. Middle right: A silver mirror ball made of tiny square mirrors, sparkling.
7. Bottom left: A brown cloth sack tied at the top, bulging with gold coins, a few coins peeking out.
8. Bottom middle: A slightly lopsided golden crown with three red gems.
9. Bottom right: A theatre mask with empty eye holes, half gold and half blue, with two ribbons.
```

### Keepsakes 3

Save as `assets/treasures/sheets/keepsakes-3.png`. It holds: Shield of Selective Bouncing, Bow of Boomerang Arrows, Heart of Helpfulness, Ever-Changing Apple, Scroll of Silly Spells, Ring of Random Ringing, Amulet of Awesome Alibis, Compass of Curiosity, Hourglass of Holding On.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A round blue shield with a big springy coil fixed to its front.
2. Top middle: A wooden bow with an arrow whose tip is a curved wooden boomerang.
3. Top right: A shiny red heart-shaped gem.
4. Middle left: An apple that is half red and half green, with a leaf on its stalk.
5. Center: A rolled parchment scroll tied with a red ribbon, with little stars drawn on it and no writing.
6. Middle right: A gold ring with a tiny golden bell where its gem would be.
7. Bottom left: A round blue glass amulet with rings of white and dark blue, hanging on a cord.
8. Bottom middle: An open brass compass with a red and white needle.
9. Bottom right: A wooden hourglass with golden sand, more sand in its top half than its bottom.
```

### Keepsakes 4

Save as `assets/treasures/sheets/keepsakes-4.png`. It holds: Seed of Sudden Songs, Mushroom of Many Moods, Dragon Scale Mail, Fox Tail of Mischief, Owl Specs of Wisdom, Horn of Heroic Hints, Vessel of Various Voices, Water Drop of Wetness, Fireball of Friendship.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A brown seed with a green sprout, and two little musical notes floating above it.
2. Top middle: A red mushroom with white spots, and a few spots in yellow, green and blue.
3. Top right: A small shirt of armour made of overlapping green dragon scales.
4. Middle left: A fluffy orange fox tail with a white tip, tied with a blue ribbon.
5. Center: A pair of round golden spectacles with little brown owl feathers on the frame.
6. Middle right: A curly golden horn with a red tassel.
7. Bottom left: An old clay urn with a lid, painted with blue swirls.
8. Bottom middle: A big shiny blue water drop.
9. Bottom right: A round fireball of orange and yellow flames with a small heart shape in the middle.
```

### Keepsakes 5

Save as `assets/treasures/sheets/keepsakes-5.png`. It holds: Pocket Tornado, Ice Shard of Infinite Brain Freeze, Rod of Ridiculous Fishing, Shooting Star Fragment, Ancient Allowance Coin, Pocket Fireworks, Thread of Tangled Tales, Magnet of Mystery, Balloon of Bouncy Bravery.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A small grey-blue swirling tornado.
2. Top middle: A pointy pale-blue ice crystal.
3. Top right: A fishing rod with a little fish dangling from its line.
4. Middle left: A golden shooting star with a sparkly tail.
5. Center: A big old gold coin with a star stamped on it.
6. Middle right: A small round firework burst of red, blue and gold sparks.
7. Bottom left: A ball of blue yarn with one loose end.
8. Bottom middle: A red horseshoe magnet with silver tips.
9. Bottom right: A round red balloon on a curly string.
```

### Keepsakes 6

Save as `assets/treasures/sheets/keepsakes-6.png`. It holds: Honey of Heroic Happiness, Coconut of Clever Comebacks, Berries of Better Bedtime, Pretzel of Protection, Wonder Wheel of Why Not, Pocket Circus, Stone Face of Seriousness, Battery of Boundless Bounciness, Clover of Convenient Coincidences.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A round honey pot with honey dripping over its edge and a wooden dipper in it.
2. Top middle: A coconut cracked open, showing the white inside.
3. Top right: A small bunch of dark blue berries with a green leaf.
4. Middle left: A golden-brown pretzel with white salt crystals.
5. Center: A small Ferris wheel with colourful cabins.
6. Middle right: A little circus tent striped red and yellow, with a flag on top.
7. Bottom left: A grey stone head statue with a long, very serious face.
8. Bottom middle: A green battery standing on a silver spring.
9. Bottom right: A bright green four-leaf clover.
```

### Keepsakes 7

Save as `assets/treasures/sheets/keepsakes-7.png`. It holds: Piano Keys of Possibility, Drum of Daily Dancing, Sparkler of Spectacular Speeches, Robe of Rushing Ready, Hat of Hundred Happenings, Pebble of Peak Performance, Dolls of Delightful Duplication, Ladder of Unlikely Locations, Sparkles of Spontaneous Style.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A short row of black and white piano keys.
2. Top middle: A small wooden hand drum with a red rim.
3. Top right: A sparkler stick fizzing with golden sparks.
4. Middle left: A flowing blue robe with a hood, covered in gold stars.
5. Center: A black top hat with a red band.
6. Middle right: A smooth grey pebble shaped like a tiny mountain with a snowy top.
7. Bottom left: Two matching wooden nesting dolls, one big and one small, painted red and gold.
8. Bottom middle: A wooden ladder with a little white cloud at its top.
9. Bottom right: A cluster of three golden sparkle stars, one big and two small.
```

### Keepsakes 8

Save as `assets/treasures/sheets/keepsakes-8.png`. It holds: Trophy of Trying Your Best, Key of Keeping Secrets, Sword of Silliness, Star of Starting Over, Potion of Peculiar Perspectives, Lightning in a Bottle, Bell of Brilliant Ideas, Beads of Better Bedtime, Skeleton Key of Sneaking.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A small gold trophy cup with two handles, on a wooden base.
2. Top middle: A golden key with a heart-shaped top.
3. Top right: A short silver sword with a wiggly, wavy blade and a gold hilt.
4. Middle left: A plump golden star with a curved arrow circling around it.
5. Center: A round glass potion bottle with a cork, full of swirling green liquid.
6. Middle right: A glass bottle with a cork, with a bright yellow lightning bolt inside.
7. Bottom left: A golden hand bell with a wooden handle.
8. Bottom middle: A loop of round beads in soft blue and gold.
9. Bottom right: An old dark iron key with a long shaft and a fancy, curly top.
```

### Keepsakes 9

Save as `assets/treasures/sheets/keepsakes-9.png`. It holds: Comet Crumbs of Chaos, Moon Phase Phaser, Forever Firework, Teapot of Tiny Tempests, Snail Shell of Steady Speed, Lantern of Lost Things, Acorn of Ambitious Oaks, Kite of Kind Winds, Umbrella of Upside-Down Weather.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are playful magical keepsakes, a little silly, each a single object on its own, seen from the front or a slight three-quarter view, with a small sparkle of shine on metal and gems. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A small blue-white comet with a fiery orange tail.
2. Top middle: A round silver disc, half dark and half glowing, like a half moon.
3. Top right: A party popper bursting with gold and blue confetti and streamers.
4. Middle left: A round blue teapot with a tiny grey rain cloud puffing out of its spout.
5. Center: An orange and cream spiral snail shell with two little silver wings.
6. Middle right: An old brass lantern glowing warm yellow.
7. Bottom left: A shiny golden-brown acorn with a tiny green sprout.
8. Bottom middle: A diamond-shaped kite in blue and yellow with a ribbon tail.
9. Bottom right: An open green and yellow striped umbrella, upside down, holding a little puddle of water.
```

## Question pictures

The things questions ask children to count, compare and spot patterns in. Each shows as its emoji, which looks different on every device, until its picture is made; then the game uses the picture. (Coloured counters need none: the game draws them as circles.)

### Question pictures 1

Save as `assets/pictures/sheets/pictures-1.png`. It holds: apple red, apple green, banana, grapes, orange, pear, strawberry, cookie, tomato.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A red apple with a green leaf.
2. Top middle: A green apple with a brown stalk.
3. Top right: A yellow banana.
4. Middle left: A bunch of green grapes.
5. Center: A round orange with a green leaf.
6. Middle right: A yellow-green pear.
7. Bottom left: A red strawberry with green leaves on top.
8. Bottom middle: A round chocolate-chip cookie.
9. Bottom right: A round red tomato with a green top.
```

### Question pictures 2

Save as `assets/pictures/sheets/pictures-2.png`. It holds: carrot, corn, sweet, lollipop, cat, dog, bird, fish, bunny.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: An orange carrot with green leaves.
2. Top middle: A yellow ear of corn with green husks.
3. Top right: A wrapped sweet in a yellow wrapper, twisted at both ends.
4. Middle left: A round swirly lollipop in red, yellow and white on a stick.
5. Center: A sitting orange cat, seen from the front.
6. Middle right: A sitting brown dog with floppy ears, seen from the front.
7. Bottom left: A small blue bird, seen from the side.
8. Bottom middle: A small orange fish, seen from the side.
9. Bottom right: A sitting white bunny with long ears, seen from the front.
```

### Question pictures 3

Save as `assets/pictures/sheets/pictures-3.png`. It holds: frog, monkey, pig, ladybug, octopus, turtle, crab, whale, shell.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A sitting green frog, seen from the front.
2. Top middle: A sitting brown monkey, seen from the front.
3. Top right: A light peach-coloured pig, seen from the side.
4. Middle left: A red ladybug with black spots, seen from above.
5. Center: An orange octopus.
6. Middle right: A green turtle, seen from the side.
7. Bottom left: A red crab, seen from the front.
8. Bottom middle: A blue whale, seen from the side.
9. Bottom right: A cream and orange seashell.
```

### Question pictures 4

Save as `assets/pictures/sheets/pictures-4.png`. It holds: daisy, sunflower, cactus, mushroom, pine tree, maple leaf, star, moon, sun.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A white daisy with a yellow middle.
2. Top middle: A yellow sunflower with a brown middle and a green stalk.
3. Top right: A green cactus in a small clay pot.
4. Middle left: A red mushroom with white spots.
5. Center: A green pine tree with a brown trunk.
6. Middle right: An orange maple leaf.
7. Bottom left: A yellow five-pointed star.
8. Bottom middle: A yellow crescent moon.
9. Bottom right: A round yellow sun with short rays.
```

### Question pictures 5

Save as `assets/pictures/sheets/pictures-5.png`. It holds: rainbow, lightning, umbrella, cloud, snowman, soccer ball, basketball, tennis ball, football.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A rainbow arc of red, orange, yellow, green and blue.
2. Top middle: A yellow lightning bolt.
3. Top right: An open blue umbrella with raindrops falling on it.
4. Middle left: A white cloud with the sun peeking out from behind it.
5. Center: A snowman with a carrot nose and a red scarf.
6. Middle right: A black and white soccer ball.
7. Bottom left: An orange basketball.
8. Bottom middle: A yellow-green tennis ball.
9. Bottom right: A brown American football.
```

### Question pictures 6

Save as `assets/pictures/sheets/pictures-6.png`. It holds: baseball, balloon, teddy bear, car, bike, rocket, train, sailboat, bus.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A white baseball with red stitching.
2. Top middle: A red balloon on a curly string.
3. Top right: A sitting brown teddy bear.
4. Middle left: A red car, seen from the side.
5. Center: A green bicycle, seen from the side.
6. Middle right: A white and red rocket pointing up.
7. Bottom left: A green steam train engine, seen from the side.
8. Bottom middle: A small sailboat with a white sail.
9. Bottom right: A yellow school bus, seen from the side.
```

### Question pictures 7

Save as `assets/pictures/sheets/pictures-7.png`. It holds: scooter, walker, gem, coin, box, chair, basket, duck, crayon.

```text
Make one square picture, 1:1, at the highest resolution you can. It is a sheet of nine separate icons for a cute 2D fantasy math game for children, laid out in a 3 x 3 grid: three rows of three, evenly spaced. Each icon sits alone in the middle of its own ninth of the picture, with a wide margin of empty background all around it. No icon touches another icon or the edge of the picture, and nothing overlaps.

The background is one flat, solid, pure magenta (#FF00FF), edge to edge. No gradient, texture, floor, cast shadow, glow, grid lines, borders, frames, panels or labels. The magenta will be cut away, so don't use magenta, hot pink or bright purple anywhere in the icons, and keep every icon's edge crisp, with no glow or haze spilling around it.

All nine share one style, matching a game whose characters are chunky, cute chibi cartoon stickers: bold, clean, near-black outlines of even thickness around every shape, and bright, warm colors with simple cel shading (one shadow tone and one crisp white highlight). They are counting pictures for young children, so each must be recognisable at a glance even when small: one simple object, a clear silhouette, little detail, no scenery, no ground or shadow beneath it, and no sparkles. Each icon fills about two thirds of its cell. No text, letters or numbers anywhere: where a design has marks, they are dots, ticks or shapes. Objects don't have faces, and animals and people appear only where they are described.

The nine icons, left to right, top row first:
1. Top left: A blue kick scooter, seen from the side.
2. Top middle: A child walking, seen from the side, in a blue shirt.
3. Top right: A blue faceted gem.
4. Middle left: A round gold coin.
5. Center: A closed brown cardboard box.
6. Middle right: A wooden chair, seen from the side.
7. Bottom left: A woven brown basket with a handle.
8. Bottom middle: A yellow rubber duck, seen from the side.
9. Bottom right: A blue crayon.
```
