// Treasures: what a beaten monster drops. They do nothing in a fight; children
// collect them. Brought over from the old game, minus its duplicates.

/** @import { Rng } from "./rng.js" */

/**
 * @typedef {object} Treasure
 * @property {string} id
 * @property {string} emoji
 * @property {string} name
 * @property {string} description
 */

/**
 * Progress codes (src/progress_code.js) keep treasures by where they come in
 * this list, so a new treasure goes at the end, and none is taken out.
 * @type {readonly Treasure[]}
 */
export const TREASURES = [
  {
    id: "sparkly_gemstone",
    emoji: "💎",
    name: "Sparkly Gemstone",
    description: "Ooooh shiny! This gem glows with all the colors of a rainbow having a dance party!",
  },
  {
    id: "crystal_ball_of_mild_predictions",
    emoji: "🔮",
    name: "Crystal Ball of Mild Predictions",
    description: "It mostly predicts what you're having for lunch tomorrow. Sometimes it's even right!",
  },
  {
    id: "wand_of_whimsy",
    emoji: "🪄",
    name: "Wand of Whimsy",
    description: "Waves of this wand turn everything temporarily pink. Even the bad guys. ESPECIALLY the bad guys.",
  },
  {
    id: "rainbow_power",
    emoji: "🌈",
    name: "Rainbow Power",
    description: "Harness the power of ALL THE COLORS! Warning: May cause spontaneous happiness.",
  },
  {
    id: "magical_butterfly",
    emoji: "🦋",
    name: "Magical Butterfly",
    description: "It's like a regular butterfly, but this one tells jokes. Mostly butterfly puns.",
  },
  {
    id: "mirror_of_many_faces",
    emoji: "🪞",
    name: "Mirror of Many Faces",
    description: "Look into it and see yourself with a silly mustache! Or maybe that's just your reflection...",
  },
  {
    id: "moon_charm",
    emoji: "🌙",
    name: "Moon Charm",
    description: "Guaranteed to make you howl at the moon! Side effects may include werewolf jokes.",
  },
  {
    id: "transformation_frog",
    emoji: "🐸",
    name: "Transformation Frog",
    description: "Kiss it to turn into a frog! ...Wait, that's not how it's supposed to work!",
  },
  {
    id: "mystic_hook",
    emoji: "🪝",
    name: "Mystic Hook",
    description: "Perfect for grabbing things just out of reach, like cookies on the top shelf or passing clouds.",
  },
  {
    id: "sun_medallion",
    emoji: "☀️",
    name: "Sun Medallion",
    description: "Warm to the touch and slightly toasty. Great for heating up sandwiches!",
  },
  {
    id: "time_yo_yo",
    emoji: "🪀",
    name: "Time Yo-Yo",
    description: "Every trick takes exactly 10 seconds. Even 'Walk the Dog' somehow takes 10 seconds. Spooky!",
  },
  {
    id: "cookie_of_speed",
    emoji: "🍪",
    name: "Cookie of Speed",
    description: "Tastes like chocolate chip and ZOOM! Now with 90% less sugar crash!",
  },
  {
    id: "rainbow_brush",
    emoji: "🎨",
    name: "Rainbow Brush",
    description: "Paint the town red! Or blue! Or plaid! (Warning: Plaid may cause dizziness)",
  },
  {
    id: "bard_s_guitar",
    emoji: "🎸",
    name: "Bard's Guitar",
    description: "Plays itself! Currently stuck on 'Wonderwall'. We're working on teaching it new songs.",
  },
  {
    id: "disco_crystal",
    emoji: "🪩",
    name: "Disco Crystal",
    description: "Instant dance party in your pocket! Comes with its own tiny DJ.",
  },
  {
    id: "bag_of_giggling_gold",
    emoji: "💰",
    name: "Bag of Giggling Gold",
    description: "These coins laugh when you spend them. Makes shopping way more fun!",
  },
  {
    id: "crown_of_mild_command",
    emoji: "👑",
    name: "Crown of Mild Command",
    description: "Makes you feel royal! Squirrels and pigeons might bow to you. Maybe.",
  },
  {
    id: "mask_of_many_voices",
    emoji: "🎭",
    name: "Mask of Many Voices",
    description: "Put it on and speak like a pirate! Take it off and speak like a cowboy! Shake it and speak like a robot!",
  },
  {
    id: "shield_of_selective_bouncing",
    emoji: "🛡️",
    name: "Shield of Selective Bouncing",
    description: "Bounces back mean words and vegetables. Sadly ineffective against homework.",
  },
  {
    id: "bow_of_boomerang_arrows",
    emoji: "🏹",
    name: "Bow of Boomerang Arrows",
    description: "Every arrow comes back! Sometimes with souvenirs from where they went.",
  },
  {
    id: "heart_of_helpfulness",
    emoji: "❤️",
    name: "Heart of Helpfulness",
    description: "Makes you want to do chores! ...Parents love this one for some reason.",
  },
  {
    id: "ever_changing_apple",
    emoji: "🍎",
    name: "Ever-Changing Apple",
    description: "Tastes like whatever fruit you're craving! Even pizza. (Is pizza a fruit? In this case, yes!)",
  },
  {
    id: "scroll_of_silly_spells",
    emoji: "📜",
    name: "Scroll of Silly Spells",
    description: "Contains such classics as 'Turn Socks Purple' and 'Make Plants Sing Opera'",
  },
  {
    id: "ring_of_random_ringing",
    emoji: "💍",
    name: "Ring of Random Ringing",
    description: "Occasionally makes doorbell sounds. Great for confusing neighbors!",
  },
  {
    id: "amulet_of_awesome_alibis",
    emoji: "🧿",
    name: "Amulet of Awesome Alibis",
    description: "\"The dragon ate my homework\" suddenly becomes a very believable excuse!",
  },
  {
    id: "compass_of_curiosity",
    emoji: "🧭",
    name: "Compass of Curiosity",
    description: "Always points to the most interesting thing nearby. Usually the kitchen.",
  },
  {
    id: "hourglass_of_holding_on",
    emoji: "⌛️",
    name: "Hourglass of Holding On",
    description: "Adds five minutes to any deadline. Parents and teachers are mysteriously immune.",
  },
  {
    id: "seed_of_sudden_songs",
    emoji: "🌱",
    name: "Seed of Sudden Songs",
    description: "Plant it and grow a tree that sings pop songs! Warning: Has a limited playlist.",
  },
  {
    id: "mushroom_of_many_moods",
    emoji: "🍄",
    name: "Mushroom of Many Moods",
    description: "Changes color based on your mood. Turns plaid when confused.",
  },
  {
    id: "dragon_scale_mail",
    emoji: "🐉",
    name: "Dragon Scale Mail",
    description: "Actually made from recycled dragon postcards. Still fireproof somehow!",
  },
  {
    id: "fox_tail_of_mischief",
    emoji: "🦊",
    name: "Fox Tail of Mischief",
    description: "Guaranteed to make you 47% more clever and 68% more likely to raid chicken coops!",
  },
  {
    id: "owl_specs_of_wisdom",
    emoji: "🦉",
    name: "Owl Specs of Wisdom",
    description: "Makes you look wise! Knowledge sold separately, but comes with free hooting lessons.",
  },
  {
    id: "horn_of_heroic_hints",
    emoji: "📯",
    name: "Horn of Heroic Hints",
    description: "Toot for a hint! May or may not just be your grandfather giving advice from inside.",
  },
  {
    id: "vessel_of_various_voices",
    emoji: "⚱️",
    name: "Vessel of Various Voices",
    description: "Contains the whispers of ancient heroes! Mostly them asking if you've cleaned your room.",
  },
  {
    id: "water_drop_of_wetness",
    emoji: "💧",
    name: "Water Drop of Wetness",
    description: "The wettest water you've ever seen. Makes other water jealous!",
  },
  {
    id: "fireball_of_friendship",
    emoji: "🔥",
    name: "Fireball of Friendship",
    description: "Throws fireballs that turn into hugs! Warning: Still quite warm hugs.",
  },
  {
    id: "pocket_tornado",
    emoji: "🌪️",
    name: "Pocket Tornado",
    description: "Perfect for cleaning your room! Less perfect for keeping it clean.",
  },
  {
    id: "ice_shard_of_infinite_brain_freeze",
    emoji: "❄️",
    name: "Ice Shard of Infinite Brain Freeze",
    description: "The coldest ice cream headache in a crystal! Great for cooling drinks too.",
  },
  {
    id: "rod_of_ridiculous_fishing",
    emoji: "🎣",
    name: "Rod of Ridiculous Fishing",
    description: "Catches fish that tell fish stories about the one that got away (you).",
  },
  {
    id: "shooting_star_fragment",
    emoji: "🌠",
    name: "Shooting Star Fragment",
    description: "Make a wish! Results may vary. Most common result: temporary sparkly hair.",
  },
  {
    id: "ancient_allowance_coin",
    emoji: "🪙",
    name: "Ancient Allowance Coin",
    description: "A coin from when parents gave out way more pocket money. Or so the legend says...",
  },
  {
    id: "pocket_fireworks",
    emoji: "🎆",
    name: "Pocket Fireworks",
    description: "Celebration in your pocket! No actual fire involved, just happy sparkly magic!",
  },
  {
    id: "thread_of_tangled_tales",
    emoji: "🧶",
    name: "Thread of Tangled Tales",
    description: "Unravel it to hear a story! Warning: May contain cat adventures.",
  },
  {
    id: "magnet_of_mystery",
    emoji: "🧲",
    name: "Magnet of Mystery",
    description: "Attracts lost socks and forgotten homework. Results not guaranteed.",
  },
  {
    id: "balloon_of_bouncy_bravery",
    emoji: "🎈",
    name: "Balloon of Bouncy Bravery",
    description: "Float like a butterfly, bounce like a... bouncy thing! Never runs out of air.",
  },
  {
    id: "honey_of_heroic_happiness",
    emoji: "🍯",
    name: "Honey of Heroic Happiness",
    description: "Makes everything taste like your favorite food! Even brussels sprouts.",
  },
  {
    id: "coconut_of_clever_comebacks",
    emoji: "🥥",
    name: "Coconut of Clever Comebacks",
    description: "Crack it open for the perfect witty response! May contain actual coconut.",
  },
  {
    id: "berries_of_better_bedtime",
    emoji: "🫐",
    name: "Berries of Better Bedtime",
    description: "Makes going to bed fun! Parents suspiciously love these...",
  },
  {
    id: "pretzel_of_protection",
    emoji: "🥨",
    name: "Pretzel of Protection",
    description: "Shields you from harm! Also makes a tasty snack in emergencies.",
  },
  {
    id: "wonder_wheel_of_why_not",
    emoji: "🎡",
    name: "Wonder Wheel of Why Not",
    description: "Spin for a random good idea! May occasionally suggest eating dessert first.",
  },
  {
    id: "pocket_circus",
    emoji: "🎪",
    name: "Pocket Circus",
    description: "An entire circus in your pocket! Clowns sold separately (thank goodness).",
  },
  {
    id: "stone_face_of_seriousness",
    emoji: "🗿",
    name: "Stone Face of Seriousness",
    description: "Makes any joke 10 times funnier by keeping a straight face.",
  },
  {
    id: "battery_of_boundless_bounciness",
    emoji: "🔋",
    name: "Battery of Boundless Bounciness",
    description: "Charges up your jump height! Side effects include spontaneous hopping.",
  },
  {
    id: "clover_of_convenient_coincidences",
    emoji: "☘️",
    name: "Clover of Convenient Coincidences",
    description: "Makes lucky things happen! Like finding more clovers. How convenient!",
  },
  {
    id: "piano_keys_of_possibility",
    emoji: "🎹",
    name: "Piano Keys of Possibility",
    description: "Play any tune! Even if you don't know how to play. Especially if you don't know how to play!",
  },
  {
    id: "drum_of_daily_dancing",
    emoji: "🪘",
    name: "Drum of Daily Dancing",
    description: "Everybody within earshot starts dancing. Even the furniture. ESPECIALLY the furniture.",
  },
  {
    id: "sparkler_of_spectacular_speeches",
    emoji: "🎇",
    name: "Sparkler of Spectacular Speeches",
    description: "Wave it while talking to add dramatic emphasis! Now every statement ends with '...OF DESTINY!'",
  },
  {
    id: "robe_of_rushing_ready",
    emoji: "👗",
    name: "Robe of Rushing Ready",
    description: "Put it on and you're instantly dressed for any occasion! Sometimes thinks pajamas are formal wear.",
  },
  {
    id: "hat_of_hundred_happenings",
    emoji: "🎩",
    name: "Hat of Hundred Happenings",
    description: "Pull anything out of it! Except what you're actually looking for. That's in your other hat.",
  },
  {
    id: "pebble_of_peak_performance",
    emoji: "🗻",
    name: "Pebble of Peak Performance",
    description: "A tiny mountain that grants the power of dramatic poses! Comes with its own wind effects.",
  },
  {
    id: "dolls_of_delightful_duplication",
    emoji: "🎎",
    name: "Dolls of Delightful Duplication",
    description: "Creates a copy of you to do your chores! Warning: Copy may decide to play instead.",
  },
  {
    id: "ladder_of_unlikely_locations",
    emoji: "🪜",
    name: "Ladder of Unlikely Locations",
    description: "Climb up to anywhere! Down is sometimes trickier. May lead to cloud castles.",
  },
  {
    id: "sparkles_of_spontaneous_style",
    emoji: "✨",
    name: "Sparkles of Spontaneous Style",
    description: "Makes anything look fabulous! Warning: May cause excessive glitter.",
  },
  {
    id: "trophy_of_trying_your_best",
    emoji: "🏆",
    name: "Trophy of Trying Your Best",
    description: "Celebrates your efforts! Cheers louder the more you practice.",
  },
  {
    id: "key_of_keeping_secrets",
    emoji: "🔑",
    name: "Key of Keeping Secrets",
    description: "Opens any lock! Sometimes creates locks that need opening. It's complicated.",
  },
  {
    id: "sword_of_silliness",
    emoji: "⚔️",
    name: "Sword of Silliness",
    description: "Makes 'swoosh' noises when swung! Also good for slicing sandwiches perfectly in half.",
  },
  {
    id: "star_of_starting_over",
    emoji: "⭐️",
    name: "Star of Starting Over",
    description: "Gives you another try when you need one! Like a video game checkpoint, but shinier.",
  },
  {
    id: "potion_of_peculiar_perspectives",
    emoji: "🥤",
    name: "Potion of Peculiar Perspectives",
    description: "See the world differently! Warning: May make everything look like it's upside down.",
  },
  {
    id: "lightning_in_a_bottle",
    emoji: "⚡️",
    name: "Lightning in a Bottle",
    description: "Contains one (1) captured lightning bolt. Uses include: dramatic entrances and toasting marshmallows.",
  },
  {
    id: "bell_of_brilliant_ideas",
    emoji: "🔔",
    name: "Bell of Brilliant Ideas",
    description: "Ring for inspiration! Side effect: Makes everyone say 'Ding!' when they have an idea.",
  },
  {
    id: "beads_of_better_bedtime",
    emoji: "📿",
    name: "Beads of Better Bedtime",
    description: "Count them to fall asleep! Each bead contains a different cozy dream.",
  },
  {
    id: "skeleton_key_of_sneaking",
    emoji: "🗝️",
    name: "Skeleton Key of Sneaking",
    description: "Opens secret passages! Sometimes creates secret passages that need opening.",
  },
  {
    id: "comet_crumbs_of_chaos",
    emoji: "☄️",
    name: "Comet Crumbs of Chaos",
    description: "Sprinkle for random magical effects! Results range from floating furniture to tap-dancing plants.",
  },
  {
    id: "moon_phase_phaser",
    emoji: "🌗",
    name: "Moon Phase Phaser",
    description: "Changes the time of day! Warning: May cause temporary confusion among roosters.",
  },
  {
    id: "forever_firework",
    emoji: "🎉",
    name: "Forever Firework",
    description: "Never stops exploding with joy! Don't worry, it's all magical sparkles, no noise complaints!",
  },
];

/**
 * A treasure to drop: one not collected yet while any are left, then any at all.
 * @param {Rng} rng
 * @param {readonly string[]} collected  ids already collected
 * @returns {Treasure}
 */
export function pickTreasure(rng, collected) {
  const have = new Set(collected);
  const fresh = TREASURES.filter(t => !have.has(t.id));
  return rng.pick(fresh.length > 0 ? fresh : TREASURES);
}
