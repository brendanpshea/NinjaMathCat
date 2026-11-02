// The service worker: it keeps a copy of every file the game needs, so that
// once the game has been opened it plays with no connection at all, and so
// that it can be installed as an app. Online, files still come fresh from the
// network, and each copy is brought up to date as it comes, so a change to
// the game shows at once. Offline, or when the network is too slow to
// answer, the copies are used. Nothing else is cached, and nothing is sent.
//
// tools/pwa.js writes the list of files below (npm run pwa), and
// tests/pwa.test.js checks it lists everything the game needs.

const CACHE = "ninja-math-cat";

/** How long to wait for the network before using the copy, in ms. */
const PATIENCE = 4000;

// The files: written by tools/pwa.js.
const FILES = [
  "./",
  "assets/backdrops/attic.webp",
  "assets/backdrops/candy.webp",
  "assets/backdrops/castle.webp",
  "assets/backdrops/clocktower.webp",
  "assets/backdrops/farm.webp",
  "assets/backdrops/frozen.webp",
  "assets/backdrops/hilltop.webp",
  "assets/backdrops/kitchen.webp",
  "assets/backdrops/library.webp",
  "assets/backdrops/meadow.webp",
  "assets/backdrops/mushrooms.webp",
  "assets/backdrops/observatory.webp",
  "assets/backdrops/peak.webp",
  "assets/backdrops/seaside.webp",
  "assets/backdrops/swamp.webp",
  "assets/backdrops/temple.webp",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/maskable-512.png",
  "assets/sprites/heroes/cat_ninja.webp",
  "assets/sprites/heroes/lion_barbarian.webp",
  "assets/sprites/heroes/owl_wizard.webp",
  "assets/sprites/heroes/rabbit_samurai.webp",
  "assets/sprites/heroes/raven_thief.webp",
  "assets/sprites/heroes/tiger_assassin.webp",
  "assets/sprites/monsters/beholder.webp",
  "assets/sprites/monsters/bookwyrm.webp",
  "assets/sprites/monsters/broom.webp",
  "assets/sprites/monsters/candy_witch.webp",
  "assets/sprites/monsters/cheese_golem.webp",
  "assets/sprites/monsters/claw.webp",
  "assets/sprites/monsters/clockwork_knight.webp",
  "assets/sprites/monsters/clockwork_phoenix.webp",
  "assets/sprites/monsters/constellation.webp",
  "assets/sprites/monsters/coral_colussus.webp",
  "assets/sprites/monsters/crystal_warrior.webp",
  "assets/sprites/monsters/dozing_drake.webp",
  "assets/sprites/monsters/echo_knight.webp",
  "assets/sprites/monsters/evil_duck.webp",
  "assets/sprites/monsters/flumph.webp",
  "assets/sprites/monsters/flying_sword.webp",
  "assets/sprites/monsters/fungal_knight.webp",
  "assets/sprites/monsters/goblin.webp",
  "assets/sprites/monsters/grumpy_cloud.webp",
  "assets/sprites/monsters/haunted_lantern.webp",
  "assets/sprites/monsters/ink_elemental.webp",
  "assets/sprites/monsters/jelly.webp",
  "assets/sprites/monsters/kobold.webp",
  "assets/sprites/monsters/library_leviathan.webp",
  "assets/sprites/monsters/mimic.webp",
  "assets/sprites/monsters/mosaic.webp",
  "assets/sprites/monsters/orchestra_elemental.webp",
  "assets/sprites/monsters/origami.webp",
  "assets/sprites/monsters/otter_corsair.webp",
  "assets/sprites/monsters/pixie.webp",
  "assets/sprites/monsters/prism_beast.webp",
  "assets/sprites/monsters/pseudo_dragon.webp",
  "assets/sprites/monsters/puzzle_golem.webp",
  "assets/sprites/monsters/quantum_dragon.webp",
  "assets/sprites/monsters/recursion_wyrm.webp",
  "assets/sprites/monsters/rusty.webp",
  "assets/sprites/monsters/scarecrow.webp",
  "assets/sprites/monsters/shrub.webp",
  "assets/sprites/monsters/soap_golem.webp",
  "assets/sprites/monsters/soup_spirit.webp",
  "assets/sprites/monsters/sphinx.webp",
  "assets/sprites/monsters/stirge.webp",
  "assets/sprites/monsters/storm_sovereign.webp",
  "assets/sprites/monsters/swamp_dragon.webp",
  "assets/sprites/monsters/teapot_dragon.webp",
  "assets/sprites/monsters/topiary.webp",
  "assets/sprites/monsters/troll.webp",
  "assets/sprites/monsters/yarn.webp",
  "css/game.css",
  "css/stage.css",
  "index.html",
  "manifest.webmanifest",
  "src/adventures.js",
  "src/backdrops.js",
  "src/battle.js",
  "src/challenge.js",
  "src/classroom.js",
  "src/combat.js",
  "src/curriculum.js",
  "src/heroes.js",
  "src/main.js",
  "src/mastery.js",
  "src/monsters.js",
  "src/progress_code.js",
  "src/questions/algebra.js",
  "src/questions/arithmetic.js",
  "src/questions/common.js",
  "src/questions/decimals.js",
  "src/questions/early_number.js",
  "src/questions/factors.js",
  "src/questions/fraction_ops.js",
  "src/questions/fraction_stories.js",
  "src/questions/fractions.js",
  "src/questions/geometry.js",
  "src/questions/graphs.js",
  "src/questions/integers.js",
  "src/questions/measurement.js",
  "src/questions/measuring.js",
  "src/questions/money.js",
  "src/questions/number_lines.js",
  "src/questions/number_sense.js",
  "src/questions/patterns.js",
  "src/questions/place_value.js",
  "src/questions/plots.js",
  "src/questions/rational.js",
  "src/questions/ratios.js",
  "src/questions/shapes.js",
  "src/questions/statistics.js",
  "src/questions/time.js",
  "src/questions/word_problems.js",
  "src/rng.js",
  "src/save.js",
  "src/scenes.js",
  "src/scenes/grade0.js",
  "src/scenes/grade1.js",
  "src/scenes/grade2.js",
  "src/scenes/grade3.js",
  "src/scenes/grade4.js",
  "src/scenes/grade5.js",
  "src/scenes/grade6.js",
  "src/sound.js",
  "src/speech.js",
  "src/stage.js",
  "src/standards.js",
  "src/treasures.js",
  "src/ui/app.js",
  "src/ui/battle_screen.js",
  "src/ui/challenge_screen.js",
  "src/ui/scene_view.js",
  "src/ui/sprites.js",
  "src/ui/stage_view.js",
  "src/visuals/cards.js",
  "src/visuals/counting.js",
  "src/visuals/describe.js",
  "src/visuals/figures.js",
  "src/visuals/fractions.js",
  "src/visuals/graphs.js",
  "src/visuals/index.js",
  "src/visuals/measures.js",
  "src/visuals/number_line.js",
  "src/visuals/pictures.js",
  "src/visuals/readings.js",
  "src/visuals/scale.js",
  "src/visuals/solids.js",
  "src/visuals/svg.js",
  "src/zzfx.js",
];
// End of the files.

/** Where each file is, in full, to know a request for one. */
const KEPT = new Set(FILES.map(file => new URL(file, self.location.href).href));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Only the game's own files; anything else, such as the original game in
  // legacy/, goes to the network as usual. ?seed=7 and the like don't matter.
  if (request.method !== "GET" || !KEPT.has(url.origin + url.pathname)) return;
  event.respondWith(fresh(request, url.origin + url.pathname));
});

/**
 * A file from the network, keeping a copy; or the copy, if the network fails,
 * answers with an error, or takes too long.
 * @param {Request} request
 * @param {string} key  the file's address, without any query
 */
async function fresh(request, key) {
  const cache = await caches.open(CACHE);
  const network = fetch(request).then(response => {
    if (response.ok) cache.put(key, response.clone());
    return response;
  });
  try {
    const response = await Promise.race([network, new Promise((_, reject) => setTimeout(reject, PATIENCE))]);
    return response.ok ? response : (await cache.match(key)) ?? response;
  } catch {
    // The network failed, or is slow: the copy, if there is one; otherwise keep waiting.
    return (await cache.match(key)) ?? network;
  }
}
