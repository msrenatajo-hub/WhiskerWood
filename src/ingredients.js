// ============================================================
//  📍 WHERE TO FIND IT — every recipe ingredient, and where in the
//  world a mouse can gather it. (Drawn from the Grand Library's
//  Forager's Guide and region pages: every biome gives different
//  materials, and the rarest things hide in the riskiest places.)
//
//  Click an ingredient in the recipe book to see its entry.
// ============================================================

// [where, tip] — written for a young forager
const W = {
  // --- the forest floor ---
  twig: ["🌲 Pine Forest & 🍃 Aspen Forest floor", "Twigs lie everywhere under the trees — walk over one and press E."],
  stick: ["🌲 Pine Forest & 🍃 Aspen Forest floor", "Sticks are just big twigs. The pines drop the most."],
  "pine needle": ["🌲 Pine Forest floor", "Dry needles carpet the ground under every pine — springy, perfect for bedding."],
  "large leave": ["🍃 Aspen Forest floor · 🫐 under the Berry Bushes", "Golden aspen leaves fall all the time; berry bushes drop big dark ones."],
  "bark strip": ["🍃 Aspen Forest floor", "Pale curls of aspen bark lie at the foot of the trunks."],
  "bark sheet": ["🍃 Aspen Forest", "Big flakes of pale bark peel off the old aspens."],
  "bark fiber": ["🍃 Aspen Forest", "Pull soft fibers from curls of aspen bark."],
  moss: ["🌲 Pine Forest · 💧 the creek banks", "Thick green moss grows on shady pine roots and wet stones."],
  "root fiber": ["🌲 Pine Forest · 🪵 the Fallen Log", "Fine roots poke out of the soil where the ground is soft and shaded."],
  "sharp thorn": ["🫐 Berry Bushes", "The berry bushes are covered in thorns — mind your paws."],
  "sap droplet": ["🌲 Pine Forest (rare)", "Amber sap beads on old pine bark. Sticky, and very useful."],

  // --- grasses & meadow ---
  "grass fiber": ["🌾 Meadow · 🌾 Tall Grass", "Strip long fibers from grass stems — the Tall Grass has the best."],
  "dry grass": ["🌾 Meadow floor", "Dry stems lie all over the open Meadow. Great tinder, too."],
  "tall grass": ["🌾 the Tall Grass", "Stand among the towering stalks — but listen for foxes."],
  "clover seed": ["🌾 Meadow", "Three-leaf clover grows low all over the Meadow — press E to gather seeds."],
  "oat grain": ["🌾 Meadow edges · 🏕️ the summer campsite", "Wild oats sway at the Meadow's edge; people spill some at the campsite."],

  // --- flowers ---
  "flower petal": ["🌸 Wildflower Patch", "Petals drift down all over the Wildflower Patch floor."],
  wildflower: ["🌸 Wildflower Patch", "The brightest, busiest place in the forest. Watch out for bees!"],
  "lavender flower": ["🌸 Wildflower Patch", "Look for the tall lavender spires — they smell like sleep."],
  "thistle flower": ["🌾 Meadow · 🌸 Wildflower Patch", "Spiky purple thistles grow where the sun is strong."],
  nectar: ["🌸 Wildflower Patch", "Sip it from the flower cups — but don't startle the bees."],
  "honey drop": ["🌸 Wildflower Patch (rare)", "Bees sometimes drip honey near their flowers. Very brave mice only."],
  "bee wax": ["🌸 Wildflower Patch (rare)", "Found near the bees' busiest flowers. They remember faces…"],
  "moon petal": ["🌙 Moonstone Hollow", "Silvery petals that glow at night — only in the Hollow behind the falls."],
  herb: ["💧 the creek banks · 🌾 Meadow", "Water mint grows at the creek's edge; other herbs hide in the grass."],
  "bitter herb": ["💧 the creek banks", "Bitter, but it fixes a tummy. Look where the ground is muddy."],

  // --- food ---
  berry: ["🫐 Berry Bushes", "Stand by a berry bush and press E — or pick up fallen berries underneath."],
  "berry seed": ["🫐 Berry Bushes", "Every berry has seeds inside. Gather berries, keep the seeds."],
  "berry juice": ["🫐 Berry Bushes", "Squash ripe berries into an acorn cup."],
  mushroom: ["🌲 Pine Forest · 🪵 the Fallen Log", "Mushrooms love damp shade — check around the Fallen Log."],
  "mushroom cap": ["🌲 Pine Forest · 🪵 the Fallen Log", "Pick the caps of the ordinary brown mushrooms."],
  "mushroom dust": ["🌲 Pine Forest", "Tap a ripe mushroom and catch the dusty spores."],
  "medicinal mushroom": ["🍃 Aspen Forest · 🌲 Pine Forest (rare)", "Pale little healing mushrooms hide in the quiet aspens."],
  "glowing mushroom": ["💎 the Old Well cave · 🌙 Moonstone Hollow", "They glow blue in the dark places under the world."],
  beetle: ["🌲 Pine Forest · 🫐 Berry Bushes", "Beetles amble around logs and bushes. Quick paws!"],
  "beetle shell": ["🌲 Pine Forest · 🪵 the Fallen Log", "Shiny old shells lie where beetles once lived."],
  firefly: ["🌾 Meadow & 🌸 Wildflower Patch, at night", "Wait for dark (T skips time) — the meadow fills with green lights. Press E to catch one, gently."],
  "creek water": ["💧 Crossable Creek", "Stand at the water's edge and press E. Fast water steals careless paws!"],
  "acorn cap": ["🍃 Aspen Forest edges · 🏫 the school garden", "Little caps roll off acorns all over the forest edge."],
  "large acorn cap": ["🍃 Aspen Forest edges (rare)", "A really big one makes a fine bowl."],

  // --- stones, mud & glimmer ---
  stone: ["💧 Crossable Creek banks", "Smooth stones line the creek — pick the flat ones."],
  "smooth stone": ["💧 Crossable Creek banks", "The water polishes them. Look along the edges."],
  "tiny pebble": ["💧 creek banks · 🌾 Meadow", "Little pebbles lie by the water and dot the Meadow."],
  "clay mud": ["💧 Crossable Creek banks", "Squishy grey mud at the water's edge — perfect for building."],
  "packed dirt": ["🏠 around your den · 🌾 Meadow", "Scrape it up anywhere the ground is bare and dry."],
  "crystal fragment": ["💎 the Old Well cave · 🌙 Moonstone Hollow", "Glittering shards break off the big crystals underground."],
  "glowing moss": ["🌙 Moonstone Hollow", "Soft teal moss that glows — it grows nowhere else in the world. You'll need a Glow Lantern to get in."],
  "ancient seed": ["🕳️ the secret Moonkeeper tunnels", "Nobody knows how old they are. Look in the Archive."],

  // --- feathers ---
  feather: ["🌲 Pine Forest · 🌳 near Everbough", "Birds drop them under the trees where they roost."],
  "owl feather": ["🌳 under Everbough (dangerous!)", "The Great Horned Owl lives up there. Only go by day."],

  // --- people things, found at the edges of the wild ---
  "cloth scrap": ["🏕️ the summer campsite · 🧺 the picnic area", "People leave scraps behind. Go only when they've gone home."],
  "cloth fiber": ["🏕️ the summer campsite · 🧺 the picnic area", "Pull threads from lost cloth scraps."],
  "soft cloth fiber": ["🏕️ the summer campsite", "The softest threads come from old blankets."],
  string: ["🏕️ the summer campsite · 🥾 the hiking trail", "People drop bits of string everywhere. Lucky mice!"],
  "human button": ["🥾 the hiking trail · 🧺 the picnic area", "A button makes a fine shield. Look along the trail."],
  "tiny button": ["🧺 the picnic area", "Tiny buttons fall off coats at the picnic tables."],
  "tiny bead": ["🧺 the picnic area", "Shiny beads glint in the grass after people leave."],
  "tiny trinket": ["🏕️ campsite · 🧺 picnic area · 🥾 trail", "Little lost treasures turn up wherever people go."],
  "glass fragment": ["🏕️ the summer campsite (careful!)", "Sharp! Only pick up the smooth, sea-worn kind."],
  "human paper scrap": ["🧺 the picnic area · 🥾 the hiking trail", "Paper blows into the grass near the trail."],
  "cheese chunk": ["🧺 the picnic area (rare!)", "The greatest treasure of all. Check under the tables."],
  "butter bit": ["🧺 the picnic area (rare)", "Sometimes a dab is left on a dropped crust."],
};

// one plain key for "Twigs" / "Twig", "Beetle Shells" / "Beetle Shell", "Fireflies"…
export function keyOf(item) {
  let k = item.toLowerCase().trim();
  if (k.endsWith("ies")) k = k.slice(0, -3) + "y";
  else if (k.endsWith("s") && !k.endsWith("ss")) k = k.slice(0, -1);
  return k;
}

/** every ingredient the recipe book knows (plain keys) */
export const allIngredientKeys = () => Object.keys(W);

/** → { where, tip } for an ingredient name (always returns something). */
export function whereToFind(item) {
  const hit = W[keyOf(item)];
  if (hit) return { where: hit[0], tip: hit[1] };
  return { where: "Somewhere out in the wild…", tip: "Explore! Every biome hides different things." };
}

// Which real places does a "where" line mean? Each part between the dots
// becomes a place the golden trail can lead to:
//   biome:pine / aspen / meadow / wildflower / tallgrass / berry,
//   creek, log, well (the Old Well cave), hollow (behind the falls),
//   tunnels (the hole under Everbough), everbough, home, school,
//   edges (campsite / picnic / trail — out past the map)
const PLACE_WORDS = [
  ["Tall Grass", "biome:tallgrass"],
  ["Pine Forest", "biome:pine"],
  ["Aspen Forest", "biome:aspen"],
  ["Wildflower", "biome:wildflower"],
  ["Berry Bush", "biome:berry"],
  ["Meadow", "biome:meadow"],
  ["creek", "creek"],
  ["Creek", "creek"],
  ["Fallen Log", "log"],
  ["Old Well", "well"],
  ["Moonstone Hollow", "hollow"],
  ["tunnels", "tunnels"],
  ["Everbough", "everbough"],
  ["den", "home"],
  ["school garden", "school"],
  ["campsite", "edges"],
  ["picnic", "edges"],
  ["trail", "edges"],
];
/** → ["biome:pine", "creek", …] for an ingredient, in the order listed. */
export function placesFor(item) {
  const { where } = whereToFind(item);
  const out = [];
  for (const part of where.split("·")) {
    for (const [word, place] of PLACE_WORDS) {
      if (part.includes(word)) {
        if (!out.includes(place)) out.push(place);
        break;
      }
    }
  }
  return out;
}
