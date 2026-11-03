# Whiskerblade on Google Play

A draft of the store listing, ready to paste, and the steps to get there.
Google Play's limits are in brackets; the counts are what each line uses.

## The listing

**Title** (29 of 30)

> Whiskerblade: Math Battle K-6

**Short description** (67 of 80)

> Math games for kids, K to 6th grade: beat monsters and win treasure

**Full description** (up to 4,000)

> Whiskerblade is a math adventure for kindergarten through 6th grade. Pick a
> hero, choose a grade, and battle through eight chapters of monsters. Every
> right answer powers up your attack.
>
> LEARN IT, THEN BATTLE
> Each chapter opens with a short teaching scene. The chapter's monster shows
> off its trick, and your hero works out how to beat it, step by step, over a
> picture. Then the battles begin. Miss a question twice, and "Show me how"
> plays the scene again.
>
> EVERY GRADE, EVERY TOPIC
> • Kindergarten: counting, comparing, shapes, adding and taking away, making 10, teen numbers
> • 1st grade: facts within 20, tens and ones, counting to 120, measuring, telling time, picture graphs
> • 2nd grade: adding and subtracting to 1000, rulers and number lines, money, odd and even, time
> • 3rd grade: multiplication and division, rounding, fractions, area and perimeter, line plots
> • 4th grade: place value, multi-digit multiplication and division, angles, fractions and decimals
> • 5th grade: decimals, fraction operations, expressions, volume, the coordinate plane
> • 6th grade: ratios and rates, dividing fractions, negative numbers, equations, statistics
>
> The questions follow the Common Core math standards, kindergarten to 6th
> grade, with pictures where the standards call for them: ten frames, clocks,
> coins, rulers, number lines, fraction bars, graphs and more.
>
> MADE FOR KIDS, AND THE GROWN-UPS HELPING THEM
> • Questions can be read aloud, for children still learning to read
> • Hints show the next step, with the child's own numbers
> • The game learns what each child finds hard, and brings it back to practise
> • A progress report shows what needs practice, and prints
> • A class view for teachers, with codes to bring in students from other devices
> • A one-minute challenge, from 3rd grade, for a best score to beat
> • Several children can share one device, each with their own hero and progress
>
> No ads. No in-app purchases. No accounts. Nothing is collected or sent:
> progress stays on the device, with a progress code to move it to another.
> It plays offline.
>
> Whiskerblade is free software (GPL-3.0). The code is on GitHub at
> github.com/brendanpshea/NinjaMathCat.

**Category**: Games › Educational. **Tags**: math, kids, education.

## The pictures

- **Icon**: `out/store/play-icon-512.png`, square and full-bleed; Play rounds
  the corners. Made by `python tools/make_icons.py`.
- **Feature graphic**: `out/store/feature-graphic.png`, 1024 × 500. Made by
  `npm run card`, which also makes `assets/social-card.png`, the picture a
  shared link shows. The feature graphic leaves off "Free" and "No ads":
  Google keeps promotional words off a listing's pictures.
- **Screenshots**: from `npm run screens`, the phone ones first, in an order
  that tells the story: a battle (`phone-battle.png`), a teaching scene
  (`phone-scene-k.png`), the map (`phone-map.png`), a level's end with its
  treasures (`phone-level-done.png`), the challenge (`phone-challenge.png`),
  and for grown-ups, the report (`phone-report.png`) and the class view
  (`phone-class.png`). The first two or three are the ones most people see.

## The answers Google asks for

- **Target audience**: ages 5 to 8 and 9 to 12, so the Families policy
  applies. With no ads, no purchases and no data collected, there is little
  to declare; that is also what makes an app eligible for Google's "Teacher
  Approved" reviews, which can't be applied for.
- **Data safety**: no data collected, none shared. Progress is kept in the
  browser's storage on the device, and the game sends nothing anywhere.
- **Ads**: none.
- **Content rating** (the IARC questionnaire): cartoon fantasy battles, no
  blood, no harm shown beyond a monster fading away. Expect the youngest
  rating, or close to it.

## Getting it onto Google Play

Play takes an Android app, and Whiskerblade is a web app that installs
itself (a PWA). A Trusted Web Activity wraps it as one, with no second copy
of the game to keep up: the Android app opens the website, full-screen.

1. **Make the Android package**: PWABuilder (pwabuilder.com) takes the
   game's address and makes the package, with a signing key. Keep the key
   safe: every update must be signed with it.
2. **Prove the site and the app belong together**: the package comes with an
   `assetlinks.json` that must be served at
   `https://<domain>/.well-known/assetlinks.json`, at the root of the domain.
   The game is now at `brendanpshea.github.io/NinjaMathCat/`, a folder, so
   either give it a domain of its own (such as whiskerblade.app, set up in
   the repository's Pages settings), or put the file in a
   `brendanpshea.github.io` repository. Without it, the app shows a browser
   bar along its top.
3. **A Play developer account**: a one-time fee. New personal accounts must
   run a closed test with a dozen or so testers for two weeks before the
   first release; check the current numbers in the Play Console.
4. **The listing**: paste the text above, add the pictures, answer the
   questions, and send it for review.
