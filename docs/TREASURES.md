# Treasures: what they're for

Whiskerblade's treasures are recognition, not loot. This note says how they
work and why, so that later changes keep to it.

## How they work

- **Chapter treasures.** Beating a chapter's boss for the first time wins
  that chapter's treasure. Its line says what the chapter taught: "You can
  find area by counting rows of squares." Finishing every chapter of a grade
  wins the grade's own treasure. There are eight per grade plus one, 63 in
  all, each set in its own material (painted wood for kindergarten, through
  bronze, silver, gold, crystal and starlight, to jade for 6th grade). They
  follow from the adventure's progress, so they need no saving.
- **Keepsakes.** When a child gets something right the first time that they
  last met at least three days ago, and that was going well then, the stage
  says "It stuck!" and a keepsake comes with it: "You remembered telling time
  after 6 days." It happens once a battle at most, and a keepsake comes at
  most once a day, so playing more can't bring one sooner. There are 81, the
  first 75 being the old game's treasures. Once a child has every one, the
  news still comes, without a keepsake.
- **Nothing else.** Monsters drop nothing. Nothing is random but which
  keepsake comes. There are no daily rewards, streak prizes or countdowns to
  the next treasure.
- **Shown quietly.** The treasures screen shows pictures and names only;
  tapping one opens it with what it was won for. At a level's end the stars
  and the note on how each topic went come first, then any treasure as one
  big reveal. The map's tile shows a count, not "N of 81".

## Why

The game used to drop a random treasure from every monster beaten: about two
per five-minute level, so a child had all 75 within one grade. The research
on rewards and gamification says that design was close to the worst:

1. **Rewards promised for doing something can dampen interest in it; praise
   and surprises don't.** Across 128 experiments, rewards promised for taking
   part, finishing or doing well all lowered how much people chose the
   activity afterwards, and more for children than for students. Positive
   feedback raised it (Deci, Koestner and Ryan, 1999). Preschoolers who drew
   for a promised award drew less later; those given it as a surprise didn't
   (Lepper, Greene and Nisbett, 1973). So treasures say what the child did,
   and keepsakes are never announced.
2. **Reward features get people to do more, not to care more.** Points,
   levels and leaderboards raised how much people did but not their interest
   (Mekler and others, 2017). A course built around badges and a leaderboard
   left students less motivated, which cost them on the exam (Hanus and Fox,
   2015). Badges in a middle-school maths tutor worked differently by kind
   and by how much a student already knew (Abramovich, Schunn and Higashi,
   2013). So treasures mark skill, not attendance.
3. **What belongs to the game's world works better.** A story or world was
   one of the things that strengthened gamified learning (Sailer and Homner,
   2020), and children learned more when the maths was part of the game
   itself (Habgood and Ainsworth, 2011). So a chapter's treasure is drawn
   from what the chapter teaches, in its grade's material.
4. **Lures are manipulative design.** In 160 apps used by 3- to 5-year-olds,
   most used manipulative design, stickers and trophies that pull a child
   back among it (Radesky and others, 2022). Random rewards follow the
   schedule loot boxes use, which surveys link with problem gambling in
   teenagers (Zendle and colleagues). So there is nothing to grind and
   nothing random to chase.
5. **Spaced remembering is the learning.** Review is spaced over days
   (`src/mastery.js`), because that is what makes things stick. The keepsake
   rewards exactly that, and can't come from playing more today.

Most of this research used real prizes, classrooms or older students, not
treasures in a game for young children, and the effects are small and
debated. It is a direction, not proof.

## Changing them

- Keepsakes are kept in progress codes by their place in `KEEPSAKES`, so add
  new ones at the end and never remove one.
- A new chapter needs a treasure in `BY_CHAPTER` in `src/treasures.js`, a
  picture in `tools/icon_sheets.json`, and its sheet made again
  (`docs/prompts.md`).
- Keep each treasure's line short and in a young reader's words, starting
  "You": a test checks.

## Sources

- Deci, Koestner and Ryan (1999). A meta-analytic review of experiments
  examining the effects of extrinsic rewards on intrinsic motivation.
  *Psychological Bulletin* 125, 627–668.
- Lepper, Greene and Nisbett (1973). Undermining children's intrinsic
  interest with extrinsic reward. *Journal of Personality and Social
  Psychology* 28, 129–137.
- Mekler, Brühlmann, Tuch and Opwis (2017). Towards understanding the effects
  of individual gamification elements on intrinsic motivation and
  performance. *Computers in Human Behavior* 71, 525–534.
- Hanus and Fox (2015). Assessing the effects of gamification in the
  classroom. *Computers & Education* 80, 152–161.
- Abramovich, Schunn and Higashi (2013). Are badges useful in education? It
  depends upon the type of badge and expertise of learner. *Educational
  Technology Research and Development* 61, 217–232.
- Sailer and Homner (2020). The gamification of learning: a meta-analysis.
  *Educational Psychology Review* 32, 77–112.
- Habgood and Ainsworth (2011). Motivating children to learn effectively:
  exploring the value of intrinsic integration in educational games.
  *Journal of the Learning Sciences* 20, 169–206.
- Radesky and others (2022). Prevalence and characteristics of manipulative
  design in mobile applications used by children. *JAMA Network Open*.
- Zendle and Cairns (2018), and Zendle, Meyer and Over (2019), on loot box
  spending and problem gambling in adults and adolescents.
