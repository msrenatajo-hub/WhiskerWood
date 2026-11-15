// Builds data/codex.json — the Grand Library's canon — from the WhiskerWood
// design bible. Run with: node scripts/build-codex.mjs
// Pages carry the same shape as src/types/page.ts. Content is the Library's
// markdown dialect; [[page-id]] makes internal links.
import { writeFileSync, mkdirSync } from "node:fs";

const OLD = "2026-01-12T09:00:00.000Z"; // original seed stamp (unchanged pages)
const NEW = "2026-07-01T08:00:00.000Z"; // this import (wins over stored seed)
const V2 = "2026-07-01T18:00:00.000Z"; // canon v2: Great Cities, no Human House

const pages = [];
function page(p) {
  pages.push({
    status: "canon",
    summary: "",
    content: "",
    tags: [],
    related: [],
    attachments: [],
    created: NEW,
    modified: NEW,
    version: 1,
    author: "The Keeper",
    ...p,
  });
}

// ============================================================
// 🗺️ THE ATLAS OF THE GREAT FOREST — world & regions
// ============================================================

page({
  id: "whisker-wood",
  title: "Whisker Wood",
  category: "world",
  version: 2,
  created: NEW,
  modified: V2,
  summary: "The whole known world: one enormous protected wilderness — forests, meadow, creek, hidden cities below and above — seen from a mouse's height.",
  tags: ["world", "map", "overview", "scale", "canon-v2"],
  content: `The world of **Whisker Wood** is ordinary to a human and enormous to a mouse. A blade of grass is a tree; a porch step is a cliff; a puddle can kill. That change of scale is the heart of the game.

## The regions
- [[meadow]] — the open heart and crossroads of the map
- [[pine-forest]] — dense, dark, resource-rich survival forest
- [[aspen-forest]] — pale, golden, quiet and mysterious
- [[wildflower-patch]] — bright, buzzing, high-reward and exposed
- [[tall-grass]] — the stealth maze
- [[berry-bushes]] — the great food larder, watched by predators
- [[crossable-creek]] — the moving-water barrier
- [[fallen-log]] — a hidden wayside shelter, hollow all the way through
- [[old-well]] — the strange human relic
- [[humans-at-the-edges]] — trails, campsites and ranger posts where the giants brush the world
- [[home]] — the burrow everything returns to
- Hidden from every map: [[moonstone-hollow]], the other [[hidden-places]] — and, if the old stories are true, the Great Cities of the [[great-canopy-alliance]]

## How the map feels
Each region owns one emotion, and the contrast between them is deliberate:
- Meadow — openness
- Pine Forest — enclosed survival
- Aspen Forest — calm mystery
- Wildflower Patch — vibrant risk
- Tall Grass — a towering maze of uncertainty
- The human edges — tension and awe
- Home — safety

> The best worlds leave empty space, quiet areas, and mystery. That is what makes discoveries meaningful.`,
  related: [
    { to: "everbough", kind: "centered-on" },
    { to: "meadow", kind: "contains" },
    { to: "home", kind: "contains" },
    { to: "vision-and-direction", kind: "designed-by" },
  ],
});

page({
  id: "everbough",
  title: "Everbough",
  category: "world",
  created: OLD,
  summary: "The colossal ancient tree at the heart of the world, and the forest that grew in its shadow.",
  tags: ["world", "great-tree", "origin"],
  content: `**Everbough** is the great tree older than memory, so vast that whole mouse nations live among its roots, trunk hollows, and lower boughs. The forest that surrounds it — and, to the mice, the *entire known world* of [[whisker-wood]] — takes its name.

## The three reaches
- **The Rootways** — the tunnels and hollows below, home of the [[moonstone-hollow]].
- **The Understory** — the forest floor: the [[pine-forest]], the [[aspen-forest]], meadows and creeks.
- **The Canopy** — the high boughs, rarely travelled, watched by the [[barn-owl]].

The [[moonkeepers]] teach that the tree remembers every mouse who has lived beneath it, and that its deepest roots drink from the same water as the moon.`,
  related: [
    { to: "whisker-wood", kind: "heart-of" },
    { to: "pine-forest", kind: "contains" },
    { to: "aspen-forest", kind: "contains" },
    { to: "moonstone-hollow", kind: "contains" },
    { to: "moonkeepers", kind: "revered-by" },
  ],
  version: 2,
  timeline: { era: "The First Age", year: 0, order: 0 },
});

page({
  id: "meadow",
  title: "Meadow",
  category: "region",
  summary: "The bright open heart of the map — the crossroads every route passes through, beautiful and dangerously exposed.",
  tags: ["region", "open", "travel", "hub", "wind"],
  coordinates: { x: 48, y: 0, z: -157, map: "overworld" },
  content: `The **Meadow** is where the world opens up: sunlit, wide, gently rolling, full of flowing grass, clover, and swaying seed heads. After the dark forests it feels like breathing out — but there is nowhere to hide.

## Role: travel, orientation, transition
The Meadow connects the [[pine-forest]], [[aspen-forest]], [[human-house]], [[wildflower-patch]], and [[crossable-creek]]. It is the hub biome: players reorient here, spot landmarks, and choose routes. Movement is fast — fewer obstacles, open ground.

## What mice do here
- Navigate and scout (visibility is the best on the map)
- Gather dependable basics: seeds, clover, grass fibers, insects, dry stems
- Sprint between safe zones

## The danger: exposure
You can see far — and everything can see YOU. Hawks and crows hunt from above; owls at dusk; foxes cross through. Sprinting from cover to cover is a survival skill learned here.

## Wind
The grass waves constantly, showing wind direction and casting moving shadows. Strong wind can hide the sound of movement — the beginning of stealth play.

## At night
Silver-blue and dew-bright under the moon; visibility stays high, and so does the feeling of being watched.

> "Never cross the Meadow at noon."
> "The sky hunters watch there. Travel fast and stay low."`,
  related: [
    { to: "whisker-wood", kind: "part-of" },
    { to: "tall-grass", kind: "borders" },
    { to: "red-fox", kind: "crossed-by" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "pine-forest",
  title: "Pine Forest",
  category: "region",
  created: OLD,
  version: 2,
  summary: "The survival heart of the map: dense, shadowy, protective and resource-rich — the player's working forest.",
  tags: ["region", "forest", "pine", "survival", "stealth", "resources"],
  coordinates: { x: -202, y: 0, z: -196, map: "overworld" },
  content: `Where the [[aspen-forest]] is airy and mysterious, the **Pine Forest** is dense, shadowy, protective, and slightly dangerous. Towering pines, deep shadows, mossy roots, and a carpet of needles. This is where the player first truly feels: *I am a tiny animal surviving in a huge wilderness.*

## Role: primary gathering & shelter zone
The core loop lives here — gather resources, avoid predators, learn stealth, discover hidden routes, prepare for expeditions.

## Resources
- Common: pine nuts, mushrooms, twigs, bark, moss, beetles, dry needles
- Rare: owl feathers, shiny human trash, medicinal fungus, abandoned nests, sap droplets

## How it plays differently
- **Low visibility** — the canopy blocks light; predators hide well
- **Sound dampening** — needles soften footsteps; stealth works better both ways
- **Rain shelter** — branches block storms; warmth drains slower

## Predators
Foxes, snakes, owls, raccoons, feral cats near the edges. You often will not see danger until it is close.

## Secrets
The forest floor hides hollow stumps, abandoned dens, buried caches — and beneath the roots, the [[tunnel-network]]. A hidden entrance below the [[fallen-log]] leads down.

## At night
Visibility collapses; trees become silhouettes; eyes glow in the dark. Genuine survival tension — never horror.

> "Do not sleep inside the mushroom ring."
> Old mice speak of giant owls overhead, ancient safe trees, and a legendary pinecone cache.`,
  related: [
    { to: "everbough", kind: "part-of" },
    { to: "tunnel-network", kind: "connects-to" },
    { to: "fallen-log", kind: "borders" },
    { to: "pine-needles", kind: "yields" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "aspen-forest",
  title: "Aspen Forest",
  category: "region",
  created: OLD,
  version: 2,
  summary: "Pale trunks, golden trembling leaves, soft light — the quietest, oldest-feeling place on the map.",
  tags: ["region", "forest", "aspen", "stealth", "calm", "mystery"],
  coordinates: { x: -154, y: 0, z: -348, map: "overworld" },
  content: `The **Aspen Forest** should feel emotionally different the second you enter: airy, ancient, slightly magical — peaceful but eerie. Pale white bark, golden leaves trembling in the wind, soft light beams, thin undergrowth.

## Role: stealth, foraging, exploration
Less food than the [[meadow]], but better visibility and quiet movement. Safe — if you are careful. Ground danger is low; the sky is the threat: owls, hawks, foxes at dusk, snakes in leaf piles.

## Resources
- Common: fallen leaves, bark fibers, small seeds, dry twigs, insects under bark
- Rare: medicinal mushrooms, owl feathers, shiny objects carried from the [[human-house]], abandoned bird nests
- **Aspen bark** is a special crafting resource: bedding, insulation, nest lining, lightweight wraps

## The quaking
Aspens tremble in wind. Rustling leaves, moving shadows, drifting gold — and strong wind hides the sound of your movement. Advanced stealth lives here.

## At night
The pale trunks glow faintly in moonlight and the forest turns silver-blue — one of the prettiest places in the world after dark. Somewhere between here and the [[crossable-creek]], a faint blue glow is sometimes seen through the trees…

## Emotion
Solitude, curiosity, calm exploration, hidden secrets. Not fear.

> Old mice say spirits live there, that the trees whisper, that lost mice disappear beneath the roots. None of it is confirmed.`,
  related: [
    { to: "everbough", kind: "part-of" },
    { to: "moonstone-hollow", kind: "conceals" },
    { to: "moonpetal", kind: "yields" },
    { to: "barn-owl", kind: "hunted-by" },
    { to: "crossable-creek", kind: "borders" },
  ],
});

page({
  id: "wildflower-patch",
  title: "Wildflower Patch",
  category: "region",
  summary: "The brightest, most alive place on the map — a miniature jungle of towering flowers, nectar and bees. Beautiful, and risky.",
  tags: ["region", "flowers", "foraging", "bees", "exposed"],
  coordinates: { x: 202, y: 0, z: 73, map: "overworld" },
  content: `To a mouse the **Wildflower Patch** is not a garden — it is a jungle. Lavender spires and golden wildflowers taller than you, clover mazes, drifting petals, butterflies, and the constant hum of bees. Sunny, fragrant, overgrown… and exposed.

## Role: high-reward foraging
- **Nectar** — energy boosts, healing recipes, special foods
- Petals, soft stems, pollen, seeds, plant fibers — decoration, medicine, insulation, cosmetics
- Insects everywhere: beetles, caterpillars, bees, butterflies — food, ingredients, hazards

## The danger under the beauty
- **Low cover from above** — disturbed flowers betray your movement to birds
- **Bees** — usually indifferent, furious if startled
- **Pollen clouds** — may slow visibility and make your scent easier to track

## Living flowers
Wind shifts the pathways and visibility constantly. This biome should always be moving.

## At dusk and night
Flowers half-close, fireflies rise, colors mute to purple and blue — magical-looking, but louder with insects, and owl danger grows.

> "Never sleep in the flowers."
> "The bees remember faces."
> "Foxes hunt there at sunset."`,
  related: [
    { to: "berry-bushes", kind: "borders" },
    { to: "meadow", kind: "borders" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "tall-grass",
  title: "Tall Grass",
  category: "region",
  summary: "The stealth biome: a living wall of towering grass where you hear more than you see — and so does everything else.",
  tags: ["region", "stealth", "grass", "concealment", "tension"],
  coordinates: { x: 284, y: 0, z: -196, map: "overworld" },
  content: `Inside the **Tall Grass** the world closes in: towering blades, bent pathways, seed heads overhead, moving shadows. The player is swallowed by vegetation. It is all about concealment versus uncertainty.

## Role: stealth, escape, ambush
Hide, travel unseen, evade predators, slip between dangerous areas. Sightlines collapse — you can vanish here. So can foxes, snakes, spiders, and cats straying from the [[human-house]].

## Sound is everything
Rustling stems, wind, insects, snapping stalks. Your movement makes noise and shakes the grass visibly — move carefully. In strong wind, walls of grass move together and hide your sound entirely.

## What mice do here
- Hide and wait out danger
- Hunt crickets, grasshoppers, beetles, moths
- Build brief, concealed rest spots and stashes

## Weather
Rain bends the grass heavy and slow; wind turns the whole biome into a shifting maze.

## At night
Visibility nearly vanishes; sound becomes survival; eyes may glow between the stems. Tense, disorienting — and safe, if used well.

> "Stay still when the grass stops moving."
> "The silent grass is the dangerous grass."
> "Foxes listen more than they look."`,
  related: [
    { to: "meadow", kind: "borders" },
    { to: "garter-snake", kind: "haunted-by" },
    { to: "red-fox", kind: "haunted-by" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "berry-bushes",
  title: "Berry Bushes",
  category: "region",
  summary: "The great food larder: dark tangled bushes heavy with purple fruit — and everyone in the forest wants a share.",
  tags: ["region", "food", "berries", "risk", "gathering"],
  coordinates: { x: 269, y: 0, z: -41, map: "overworld" },
  content: `To a mouse a **Berry Bush** is almost a miniature forest: twisting thorny branches, thick leaves, deep shadow beneath, and clusters of dark brownish-purple fruit. Rich, overgrown, tempting.

## Role: primary early-game food zone
Berries restore hunger, store for winter, and feed recipes. The bushes respawn. Players return here constantly — and that is exactly why it is dangerous.

## What mice do here
- Gather berries (and fallen ones beneath)
- Hide in the deep shadow under the leaves — instant cover, escape routes
- Hunt the beetles, ants, flies and caterpillars the fruit attracts

## The danger: everyone wants the berries
Foxes, birds, raccoons, snakes — and cats when near the [[human-house]] side. Some predators simply wait, silent, beside the heaviest branches.

## Weather & seasons
After rain the berries shine, scent carries farther, mud forms below — more visitors, easier tracking. Fruit ripens and thins with the seasons; the world should feel alive.

## Why the berries are that gothic purple
The darker fruit reads richer, moodier, less cartoonish — it gives the world personality.

> "The sweetest berries grow where danger hunts."
> "Never eat the pale ones."
> "Foxes wait near the heavy bushes."`,
  related: [
    { to: "wildflower-patch", kind: "complements" },
    { to: "red-fox", kind: "stalked-by" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "crossable-creek",
  title: "Crossable Creek",
  category: "region",
  created: OLD,
  version: 2,
  summary: "Moving water that divides the map — a shallow, survivable barrier that teaches respect for nature itself.",
  tags: ["region", "water", "traversal", "danger", "landmark"],
  coordinates: { x: 37, y: 0, z: -412, map: "overworld" },
  content: `The **Crossable Creek** is not just water. It is a boundary, a navigation puzzle, a source of life, and a danger with no teeth. Cold, moving, reflective — to a mouse, even a shallow creek is massive and powerful.

## "Crossable" is the point
Dangerous, but survivable: shallow fords, stepping stones, sticks and fallen branches. Choosing WHERE to cross is the gameplay.

## Crossing costs
- Water drains stamina and slows movement
- A wet mouse loses warmth faster and leaves a stronger scent trail
- Slip, and the current can take you

## Life at the water
Frogs, fish, dragonflies, water beetles, snakes, herons. Reeds and cattails for rope-craft; smooth stones; mud for building; water mint at the margins.

## Weather changes everything
After storms the creek rises and fords vanish — sometimes impassable for a day. In drought, stones stand exposed and crossings multiply.

## At night
Reflections shimmer; depth becomes hard to judge; the sound grows. Eerie, cold, hypnotic — moonlight on water is one of the most beautiful sights in the game.

Behind roots on the far bank, they say, there is a tiny cave that only shows itself when the water is low… (see [[hidden-places]]).

> "Fast water steals careless paws."
> "Cross upstream after rain."
> "Never trust still water."`,
  related: [
    { to: "aspen-forest", kind: "borders" },
    { to: "old-well", kind: "near" },
    { to: "garter-snake", kind: "haunted-by" },
    { to: "resource-guide", kind: "yields" },
  ],
});

page({
  id: "fallen-log",
  title: "Fallen Log",
  category: "region",
  summary: "A moss-hidden wayside shelter below the Pine Forest — not as good as Home, but far safer than open ground.",
  tags: ["region", "shelter", "hideout", "waypoint"],
  coordinates: { x: -193, y: 0, z: -44, map: "overworld" },
  content: `The **Fallen Log** lies in shadow and moss below the [[pine-forest]], near the lower path crossing — close to forest resources, partly concealed, easy for predators to pass without a glance. Mice have always used logs like this; that is why it feels real.

## Role: hideout & temporary shelter
- **Rest** — short naps restore a little sleep (slower than [[home]])
- **Scavenge** — mushrooms, beetles, pine nuts, moss seeds, hidden crumbs
- **Hide** — crawl inside and visibility drops to almost nothing (so does your own)
- **Emergency storage** — a paw-full of items, three to five early on

## Weather
A blessing in rain, storms and cold nights; a hazard in floods, rot, and snake nesting season.

## Never perfectly safe
Spiders, snakes, centipedes, raccoons digging through — and mold sickness if you sleep too long. The log keeps its tension.

## Its story
An old mouse hideout, abandoned after a predator attack — the legendary safe spot older mice still mention. Inside: scratched warnings, old stored seeds, lost things. Beneath it, a hidden mouth of the [[tunnel-network]].

## One day
Line it with grass, reinforce it with bark, dig side tunnels, hide food, add escape holes.`,
  related: [
    { to: "pine-forest", kind: "below" },
    { to: "tunnel-network", kind: "conceals-entrance" },
    { to: "home", kind: "waypoint-toward" },
  ],
});

page({
  id: "old-well",
  title: "Old Well",
  category: "region",
  summary: "A cracked, moss-grown human relic — cool, damp, echoing, and very deep. The first proof that giants were here long before you.",
  tags: ["region", "human-relic", "mystery", "vertical", "landmark"],
  coordinates: { x: 155, y: 0, z: -223, map: "overworld" },
  content: `The **Old Well** is the strangest place on the map: weathered stone, moss between cracked blocks, vines trailing into a dark opening, broken beams. It is the first place that whispers: *humans were here long before me.*

## Role: mystery & vertical exploration
- **Water** — clean and cold, a hydration refill, a cool rest
- **Climb & descend** — rope fibers, roots, cracks in the stones
- **Secrets** — hidden tunnels, abandoned nests, shiny lost objects, old human things

## The danger is DEPTH
No predator needed. One thought should always hang overhead: *if I fall, I may not get back out.*

## Its own small ecosystem
Frogs, spiders, beetles, snakes — bats, later, and glowing insects far below. The air is colder; morning mist gathers; every sound echoes: dripping water, falling pebbles, distant movement.

## At night
The dark inside feels endless. Strange sounds rise. Moonlight touches the water far below; sometimes something glints back.

## Late-game promise
An underground biome entrance; a water network; passages that some say run all the way to the [[human-house]].

> "Never go near the deep water."
> "Something lives below."
> "The rope moves at night."`,
  related: [
    { to: "crossable-creek", kind: "near" },
    { to: "tunnel-network", kind: "may-connect" },
    { to: "human-house", kind: "rumored-passage" },
  ],
});

page({
  id: "moonstone-hollow",
  title: "Moonstone Hollow",
  category: "region",
  created: OLD,
  version: 2,
  summary: "A hidden glowing clearing between the Aspen Forest and the creek — the world's one place of pure wonder. Never marked on any map.",
  tags: ["hidden", "sacred", "moonstone", "easter-egg", "wonder"],
  coordinates: { x: -260, y: -40, z: -260, map: "underground" },
  content: `The **Moonstone Hollow** is deliberately NOT a labeled biome. No path leads to it. It hides between the [[aspen-forest]] and the [[crossable-creek]], off every trail, behind dense trees — and players simply stumble into it. That is the whole point.

## By day
A quiet clearing. Strange pale stones. Nothing obvious.

## By night
It transforms: glowing moss, pale flowers, silver stones, drifting spores, soft blue-white light, fireflies. Through distant trees a faint blue glow — *what is that?* — and the discovery becomes real.

## What it holds
- Glowing moss, [[moonpetal|moon petals]], crystal fragments, luminous mushrooms
- Items from the Hollow glow in darkness, improve night sight, calm fear
- The seat of the [[moonkeepers]] lies deeper still, reached through the [[tunnel-network]]; at its heart stands the Reading Stone

## Design law
Keep it small, subtle, emotionally powerful. No combat. No quest hub. No flashy fantasy magic — the grounded world is what makes the Hollow feel sacred. Its rewards are wonder, rare glowing materials, and perhaps a flower crown.

> An old mouse, if asked, will only say: "Some places shine after moonrise."`,
  related: [
    { to: "everbough", kind: "part-of" },
    { to: "moonkeepers", kind: "home-of" },
    { to: "moonstone", kind: "lit-by" },
    { to: "hidden-places", kind: "greatest-of" },
    { to: "aspen-forest", kind: "hidden-near" },
  ],
});

page({
  id: "hidden-places",
  title: "The Hidden Places",
  category: "region",
  status: "review",
  summary: "The secret world inside the world: wall spaces, hollow stumps, root tunnels, caves behind the creek — found only by the curious.",
  tags: ["hidden", "secrets", "exploration", "easter-eggs"],
  content: `Whisker Wood's scale creates secret spaces everywhere. The best hidden areas never feel like video-game caves — they feel like places a tiny mouse could really find. They are believable, optional, atmospheric, and they never scream "secret area."

## The known secrets
- **[[moonstone-hollow]]** — the glowing clearing; the greatest of them all
- **The [[tunnel-network]]** — root-roads beneath the Pine Forest
- **Hollow Stump Interior** — a rotting stump hiding a whole vertical ecosystem: glowing fungus, beetles, dripping water — perhaps another survivor, and journal scratches on the walls
- **The Wall Space** — inside the [[human-house]] walls: insulation tunnels, stolen treasures, warm mouse highways. It turns the House into a layered world
- **Pantry Crawlspace** — under the giant kitchen: the ultimate loot zone, guarded by traps, the cat, and the giants themselves
- **Creekside Cavern** — behind roots beside the [[crossable-creek]], visible only at low water: crystal minerals, a hidden spring, glowing moss
- **Owl Watch Tree** — a dead tree with a perch that shows the whole map. Bones and feathers warn you whose perch it is
- **Abandoned Bird Nest** — high, dangerous climbing; feathers, string, shiny things. The owner may return
- **Buried Garden Tunnel** — soft-soiled passages under the [[wildflower-patch]], roots overhead, insect colonies below
- **The Flooded Pipe** — a broken drain near the House; slippery, industrial, strange

## Design law
Reveal nothing. The moment that matters is: *"Wait… I can go IN here?"*`,
  related: [
    { to: "moonstone-hollow", kind: "includes" },
    { to: "tunnel-network", kind: "includes" },
    { to: "human-house", kind: "riddles" },
    { to: "small-details", kind: "companion-note" },
  ],
});

// ============================================================
// 🏛️ THE BUILDER'S COMPENDIUM — buildings & structures
// ============================================================

page({
  id: "home",
  title: "Home",
  category: "building",
  summary: "The burrow. Warm, hidden, personal — the emotional and mechanical anchor of the entire game.",
  tags: ["home", "burrow", "safe-zone", "progression", "cozy"],
  coordinates: { x: 0, y: 0, z: 0, map: "overworld" },
  content: `Every other place is risky, uncertain, temporary. **Home** is the opposite: warm, hidden, personal, safe, alive. It is *the place I return to after surviving the world* — and it is simply called Home, because that word makes players project their own feeling onto it.

## Outside
Easy to miss: tucked beneath roots and grass, a small entrance hole, moss, faint worn trails. Predators shouldn't notice it.

## Inside
Dim, warm, comforting: grass nest, leaf bedding, twig supports, food piles, tiny tunnels, earthy walls.

## Role: safe zone & progression hub
Rest (fastest recovery, warmth, sickness healing), storage that physically appears in the burrow, [[crafting]] at the crafting corner, upgrades, decoration.

## Home evolves
- **Early** — one cramped nest chamber and a food pile
- **Mid** — storage chamber, reinforced walls, extra exits, first decorations
- **Late** — many rooms, an underground network, escape tunnels, furniture, glowing lantern-mushroom light — and a nursery (see [[family-and-legacy]])

## Safe — never invincible
Storm flooding, a discovered entrance, collapse after heavy rain, parasites if neglected. The tension never fully leaves.

## The feeling
Storm outside; family sleeping in a pile; warm den glow; food stocked for winter. Rain drips beyond the doorway and you are safe.

> "A strong burrow means another spring."
> "The roots remember every family."`,
  related: [
    { to: "crafting", kind: "hosts" },
    { to: "family-and-legacy", kind: "shelters" },
    { to: "fallen-log", kind: "backup-shelter" },
    { to: "whisker-wood", kind: "anchored-in" },
  ],
});

page({
  id: "human-house",
  title: "Human House",
  category: "building",
  status: "removed",
  version: 3,
  created: NEW,
  modified: V2,
  summary: "STRUCK FROM CANON (v2): the world outgrew a single house. Humans now shape Whisker Wood only from its edges.",
  tags: ["human", "removed", "canon-v2", "history"],
  content: `> **Keeper's note (canon v2):** This page is preserved for the record, but the Human House is no longer part of Whisker Wood. Once the world grew into one enormous protected wilderness with the Five Great Cities beneath and above it, a single abandoned house stopped making sense.

## What replaced it
Humans still exist — experienced from the **edges** of the world (see [[humans-at-the-edges]]): a hiking trail, a summer campsite, a picnic ground, a ranger station, old logging roads. Human objects survive as **discovered treasures**, never destinations — a lost button becomes a shield, a marble a prized decoration, a thimble a bucket, a spool a table.

## What this page used to describe
A giant's fortress of food and terror: stair-cliffs, carpet-grasslands, kitchen raids at night, the [[house-cat]] hunting silently. The best of those ideas — scale contrast, tension, scavenged riches — now live spread across the whole wilderness instead of packed into one building.`,
  related: [
    { to: "humans-at-the-edges", kind: "superseded-by" },
    { to: "house-cat", kind: "was-guarded-by" },
  ],
});

page({
  id: "tunnel-network",
  title: "The Tunnel Network",
  category: "building",
  created: OLD,
  version: 2,
  summary: "The Moonkeepers' underground roads: a root-woven maze of passages joining the forests to the deep Rootways.",
  tags: ["underground", "infrastructure", "tunnels", "moonkeepers"],
  content: `Beneath the [[pine-forest]] lies a maze of tunnels formed under giant roots — tiny chambers, old nests, hidden caches, underground shortcuts. Cramped, ancient, safe but eerie. This is mouse infrastructure.

## The Great Tunnel Network
It is also far more: one of the [[moonkeepers]]' greatest works. Not mines — **roads**. Underground highways once connected the [[aspen-forest]], the Pine Forest, the [[meadow]], the [[crossable-creek]], [[everbough]] itself, and sanctuaries no map remembers. Many entrances have collapsed; others hide behind roots, rocks, and the [[fallen-log]].

## Restoring the roads
Reopening the network is one of the longest projects a mouse can undertake — clearing falls, re-marking junction runes, relearning which turns were meant to mislead. Every junction bears a carved rune; every dead end once had a reason.

The longest, safest road leads to the [[moonstone-hollow]].`,
  related: [
    { to: "pine-forest", kind: "beneath" },
    { to: "moonstone-hollow", kind: "leads-to" },
    { to: "moonkeepers", kind: "built-by" },
    { to: "fallen-log", kind: "entrance-under" },
  ],
});

// ============================================================
// 🐭 WHO'S WHO OF THE HOLLOW — characters
// ============================================================

page({
  id: "the-mouse",
  title: "The Mouse",
  category: "character",
  summary: "The player: a quietly curious little survivor trying to build a life in a gigantic world.",
  tags: ["player", "protagonist", "personality"],
  content: `The mouse is **quietly curious** — observant, emotional, cautious, kind. Not superhero-brave, not comic relief. The player should feel: *this tiny creature is trying to build a life.*

## Habits that make a character
- adjusts the [[the-bracelet|bracelet]] when nervous
- touches the [[the-backpack|backpack]] strap while thinking
- curls the tail while sleeping
- pauses to watch fireflies
- flattens ears during storms
- shakes water off after rain; curls close to family in thunder

## The inner voice
Rare, soft, memory-like thoughts at meaningful moments — never constant narration.

> "I remember when Mother gave this to me…"
> "They sleep just like we used to…"

Bad: "I should gather berries now!" Good: memories, fears, hopes, attachment — then silence, and the rain going on outside.

## Where the voice belongs
Inside [[home]] during storms and family moments; in real danger; at quiet firsts — the first sunrise in the [[meadow]], the discovery of [[moonstone-hollow]].`,
  related: [
    { to: "the-backpack", kind: "carries" },
    { to: "the-bracelet", kind: "wears" },
    { to: "the-companion", kind: "bonds-with" },
    { to: "life-of-a-mouse", kind: "lives" },
  ],
});

page({
  id: "pip",
  title: "Pip Thornwhisker",
  category: "character",
  created: OLD,
  summary: "A curious young Moonkeeper apprentice and the compiler of the Grand Library.",
  tags: ["mouse", "apprentice", "keeper"],
  content: `**Pip** is a small brown field mouse with an oversized satchel and an even larger curiosity. Apprenticed to the [[moonkeepers]], Pip roams from the [[pine-forest]] to the [[aspen-forest]] gathering leaves, stories, and the odd shiny button.

Pip's proudest craft is a well-made [[moss-bedding]], and their dream is to map every tunnel in the [[tunnel-network]].`,
  related: [
    { to: "moonkeepers", kind: "member-of" },
    { to: "moonstone-hollow", kind: "lives-in" },
    { to: "moss-bedding", kind: "crafts" },
  ],
});

page({
  id: "the-elder",
  title: "The Elder",
  category: "character",
  status: "draft",
  summary: "An old mouse mentor — parent, elder sibling, or wandering survivor — who appears rarely and says just enough.",
  tags: ["mentor", "npc", "tutorial", "sayings"],
  content: `The **Elder** is not a constant companion — just occasional guidance in the first days, and a voice for the old survival culture afterward. They never explain the world outright; they leave hints that only make sense later.

## In the first day
> "Morning already…"
> "Never cross the creek after heavy rain."

## Afterward
The Elder is the keeper of the sayings collected in [[whisker-wisdom]] — and, if asked about strange lights near the aspens, will only say:

> "Some places shine after moonrise."`,
  related: [
    { to: "the-first-day", kind: "guides" },
    { to: "whisker-wisdom", kind: "voice-of" },
  ],
});

page({
  id: "the-companion",
  title: "The Companion",
  category: "character",
  status: "review",
  summary: "Another survivor, met naturally in the world — who may, slowly, come to share the burrow and the life inside it.",
  tags: ["mate", "family", "companion", "emotional"],
  content: `The Companion is **not a collectible, a stat bonus, or an unlock**. They are another survivor in the world.

## Meeting them
Never scripted at a set moment. Perhaps: an injured mouse near the [[crossable-creek]]; a scavenger near the [[human-house]]; a stranger hiding in the [[tall-grass]] during a storm. The player helps — food, shelter, protection — and trust builds across repeated encounters. Never "press button, get mate."

## When they move into Home
[[home]] changes: someone sleeps beside you, organizes the food piles, repairs the nest, startles at thunder, warns of predators. The burrow starts feeling alive instead of empty.

From here, the family grows — see [[family-and-legacy]].`,
  related: [
    { to: "home", kind: "lives-in" },
    { to: "family-and-legacy", kind: "begins" },
    { to: "the-mouse", kind: "bonds-with" },
  ],
});

// ============================================================
// 🦉 THE NATURALIST'S JOURNAL — animals
// ============================================================

page({
  id: "barn-owl",
  title: "Barn Owl",
  category: "animal",
  created: OLD,
  version: 2,
  summary: "The great pale hunter of the night sky — the mice's oldest fear.",
  tags: ["predator", "bird", "night", "danger"],
  content: `Silent-winged and moon-faced, the **Barn Owl** hunts the [[aspen-forest]] edges and the open [[meadow]] at dusk. Mice navigate by owl-shadow and owl-silence; a too-quiet grove means one is near.

## Surviving the owl
- Stay under cover after dusk; the open Meadow at night belongs to the sky
- Hide in bushes or the [[tall-grass]]; freeze when spotted
- The [[pine-forest]] canopy is your roof — but owls nest overhead there too

The [[moonkeepers]] chart owl territories in the Endless Scroll. Its fallen feathers are prized for stealth crafting.`,
  related: [
    { to: "aspen-forest", kind: "hunts-in" },
    { to: "meadow", kind: "hunts-over" },
    { to: "resource-guide", kind: "yields-feathers" },
  ],
});

page({
  id: "red-fox",
  title: "Red Fox",
  category: "animal",
  summary: "The patient patroller of meadow edges and berry bushes — it listens more than it looks.",
  tags: ["predator", "dusk", "meadow", "danger"],
  content: `The **Red Fox** patrols the [[meadow]] edges and waits, silent, near the heaviest [[berry-bushes]]. It crosses the open ground at dusk and hunts the [[tall-grass]] by ear.

## Surviving the fox
- Use tunnels and the [[fallen-log]]; a fox will not dig long for a maybe
- In grass, stillness beats speed — it strikes at sound and motion
- Watch for pawprints near the Meadow: danger moves through the world and leaves signs

> "Foxes listen more than they look."
> "Foxes hunt there at sunset."`,
  related: [
    { to: "meadow", kind: "patrols" },
    { to: "berry-bushes", kind: "stalks" },
    { to: "tall-grass", kind: "hunts-in" },
  ],
});

page({
  id: "garter-snake",
  title: "Garter Snake",
  category: "animal",
  summary: "A ribbon of danger in the leaf piles and creek reeds — quick, quiet, and closer than you think.",
  tags: ["predator", "creek", "grass", "danger"],
  content: `The **Garter Snake** haunts the margins of the [[crossable-creek]] and the deep [[tall-grass]], and in nesting season it favors dark hollows — even the [[fallen-log]].

## Surviving the snake
- Climb rocks; take the higher path along the creek
- In grass, watch the stems: a snake parts them differently than wind
- Never sleep in an unchecked hollow in nesting season

Its shed skin is a rare crafting material for those brave enough to collect it.`,
  related: [
    { to: "crossable-creek", kind: "haunts" },
    { to: "tall-grass", kind: "haunts" },
    { to: "fallen-log", kind: "nests-in" },
  ],
});

page({
  id: "house-cat",
  title: "The Striped Cat",
  category: "animal",
  status: "review",
  version: 2,
  created: NEW,
  modified: V2,
  summary: "A ranger's cat that roams in from the edges of the wilderness — patient, silent, and the deadliest hunter a mouse will ever meet.",
  tags: ["predator", "cat", "danger", "humans-edge"],
  content: `The **Striped Cat** arrives with the humans — it lives at the ranger station and prowls in from [[humans-at-the-edges]] when the campsite is occupied. Unlike the forest hunters it does not need to eat you; it hunts because it enjoys the game.

## Surviving the cat
- If human scent is fresh, assume the cat came with it
- Learn its sunbeam hours; it sleeps long and hunts silently
- Thick cover beats speed — it strikes at movement in the open
- When a busy clearing goes quiet, ask WHY it is quiet

> "The striped cat hunts silently."

*Status note: its territory and how often it visits the deep forest are still under review after the Human House was struck from canon.*`,
  related: [
    { to: "humans-at-the-edges", kind: "comes-with" },
    { to: "berry-bushes", kind: "prowls-near" },
  ],
});

// ============================================================
// 🌿 THE EVERBOUGH HERBARIUM — plants
// ============================================================

page({
  id: "moonpetal",
  title: "Moonpetal",
  category: "plant",
  created: OLD,
  summary: "A pale night-blooming flower whose petals hold a faint glow; sacred to the Moonkeepers.",
  tags: ["flower", "night-blooming", "reagent", "glow"],
  content: `The **Moonpetal** opens only under moonlight, its five petals faintly luminous. Found at the bright edges of the [[aspen-forest]] and in abundance within the [[moonstone-hollow]], it is gathered for lanterns and medicine — including the rare calming Moon Petal Tea (see [[recipes-food-survival]]).

The [[moonkeepers]] consider a moonpetal left as an offering the politest of prayers.`,
  related: [
    { to: "aspen-forest", kind: "grows-in" },
    { to: "moonstone-hollow", kind: "abounds-in" },
    { to: "moonkeepers", kind: "sacred-to" },
  ],
});

// ============================================================
// 🎒 THE FORAGER'S INDEX — items & resources
// ============================================================

page({
  id: "the-backpack",
  title: "The Backpack",
  category: "item",
  summary: "Handmade mouse survival gear — stitched leaves, twine straps, acorn-cap buttons — that grows with its owner's story.",
  tags: ["gear", "inventory", "identity", "cosmetic"],
  content: `Because the camera rides behind the mouse, the **backpack** is part of the character's identity. It is never a scaled-down human bag — it is survival gear a mouse actually built: stitched leaves, cloth scraps, string straps, acorn-cap buttons, a bark frame, a tiny rolled blanket.

## It tells your story
- Empty: slim and light. Full: stuffed, mushrooms poking out, cloth dangling
- **Early**: a tiny leaf pouch → **Mid**: a stitched cloth pack → **Late**: an organized survival kit with a lantern mushroom and feather charms
- Rain beads on it; it rests beside the nest while you sleep; one day, little paws tug at its dangling straps

## Charms & pins
Tiny collected keepsakes hang from it — a feather charm, a glowing pebble, a berry bead, a button from the [[human-house]].

Design rule: keep it SMALL. The mouse silhouette comes first.`,
  related: [
    { to: "the-mouse", kind: "carried-by" },
    { to: "recipes-exploration-gear", kind: "crafted-via" },
  ],
});

page({
  id: "the-bracelet",
  title: "The Braided Bracelet",
  category: "item",
  summary: "A woven grass band with one scavenged bead — small, handmade, and worth more than anything in the Human House.",
  tags: ["keepsake", "cosmetic", "emotional", "family"],
  content: `A **braided grass bracelet with one tiny scavenged bead** — natural, cozy, believable. Not human jewelry shrunk down; a treasure a mouse repurposed and kept.

## Why it matters
It was given — by family, in childhood — and the mouse adjusts it when nervous. In a storm cutscene it taps softly against the backpack buckle, wet with rain, visible in the lantern glow of [[home]].

> "I remember when Mother gave this to me…"

Design rule: tiny, subtle, asymmetrical. Too much decoration would break the grounded survival tone.`,
  related: [
    { to: "the-mouse", kind: "worn-by" },
    { to: "recipes-charms-cosmetics", kind: "crafted-via" },
  ],
});

page({
  id: "resource-guide",
  title: "The Forager's Guide to Everything",
  category: "resource",
  summary: "The complete survival ecosystem: every food, material, medicine and secret resource, and where the world hides it.",
  tags: ["resources", "guide", "foraging", "reference"],
  content: `Every biome gives different materials, food and dangers — resources are tied to the environment naturally, and value rises with risk. That is what makes travel worth it.

## Food
- Berries — [[berry-bushes]] — main hunger restoration
- Pine nuts — [[pine-forest]] — long-lasting food
- Nectar — [[wildflower-patch]] — energy boost
- Clover seeds — [[meadow]] — small dependable food
- Mushrooms — Pine Forest, [[fallen-log]] — food and medicine
- Beetles, grasshoppers, ants — forests, grass, bushes — protein
- Bread crumbs, cheese, pet food, apple scraps, sugar — [[human-house]] — the richest meals in the world
- Water — [[crossable-creek]], dew drops, flower cups

## Natural materials
- Twigs and sticks — forests and meadow — building
- Bark fibers and bark sheets — [[aspen-forest]] — lining and walls
- Moss — Pine Forest and creek — bedding and insulation
- Grass fibers — Meadow, [[tall-grass]] — weaving
- Pine needles, leaves, petals, lavender — bedding, decoration, scent
- Reeds and mud — creek — rope-craft and reinforcement

## Rare & special
- Glowing moss, crystal fragments, moon petals — [[moonstone-hollow]]
- Owl and crow feathers — stealth crafting and charms
- Snake skin, beetle shells, spider silk, bee wax — creature craft
- String, cloth, buttons, shiny objects — Human House salvage

## Medicine
Medicinal mushrooms (healing), moon petals (night sight), pollen (buffs), bitter herbs (antidote), sap droplets (sealant).

## Secret finds
Ancient seeds in the [[tunnel-network]]; forgotten trinkets in the wall spaces; lost human coins; strange bones at the Owl Watch Tree.

## Progression
Early: berries, grass, twigs, mushrooms. Mid: nectar, feathers, bark, reeds. Late: human materials, glowing resources, secret collectibles.`,
  related: [
    { to: "crafting", kind: "feeds" },
    { to: "whisker-wood", kind: "maps" },
    { to: "moonstone", kind: "includes" },
    { to: "pine-needles", kind: "includes" },
  ],
});

page({
  id: "moonstone",
  title: "Moonstone",
  category: "resource",
  created: OLD,
  summary: "A softly glowing silver-blue mineral found in the deep roots; the light of the Hollow.",
  tags: ["mineral", "glow", "rare"],
  content: `**Moonstone** grows in slow veins through the deep root-rock, giving off a cool silver-blue light. It lights the [[moonstone-hollow]] and is prized for crafting lanterns and charms. Removing large amounts is forbidden by the [[moonkeepers]].`,
  related: [
    { to: "moonstone-hollow", kind: "found-in" },
    { to: "moonkeepers", kind: "protected-by" },
  ],
});

page({
  id: "pine-needles",
  title: "Pine Needles",
  category: "resource",
  created: OLD,
  summary: "Fallen evergreen needles — humble but essential bedding and thatch material.",
  tags: ["material", "common", "bedding"],
  content: `Gathered by the pawful from the [[pine-forest]] floor, **pine needles** are springy, water-shedding, and everywhere. A core ingredient of [[moss-bedding]] and many a roof.`,
  related: [
    { to: "pine-forest", kind: "gathered-from" },
    { to: "moss-bedding", kind: "ingredient-of" },
  ],
});

// ============================================================
// 🔨 THE GUILDMASTER'S LEDGER — crafting & the 55 recipes
// ============================================================

page({
  id: "moss-bedding",
  title: "Moss Bedding",
  category: "recipe",
  created: OLD,
  summary: "A soft woven nest of moss, grass, and pine needles — the first thing every mouse learns to craft.",
  tags: ["recipe", "comfort", "starter"],
  content: `The **Moss Bedding** is a warm, springy nest and the classic first craft.

## Ingredients
- 5 Moss
- 3 Grass Fibers
- 2 [[pine-needles|Pine Needles]]

Woven correctly it is snug enough to sleep a whole family. [[pip|Pip]] insists the secret is to line the rim with [[moonpetal]] for sweet dreams.`,
  related: [
    { to: "pine-needles", kind: "requires" },
    { to: "crafting", kind: "made-with" },
    { to: "recipes-home-comfort", kind: "first-of" },
  ],
});

page({
  id: "recipes-home-comfort",
  title: "Recipes — Home & Comfort",
  category: "recipe",
  summary: "Ten crafts that turn a hole in the ground into a home: bedding, blankets, lamps, warmth and keepsakes.",
  tags: ["recipes", "home", "comfort"],
  content: `The first chapter of the Guildmaster's Ledger. Everything here makes [[home]] warmer, safer, and more yours.

## The recipes
- **1. [[moss-bedding|Moss Bedding]]** — 5 Moss, 3 Grass Fibers, 2 Pine Needles. Soft, warm nest
- **2. Leaf Blanket** — 4 Large Leaves, 2 Grass Fibers, 1 Cloth Scrap. Survives cold nights and storms
- **3. Den Wall Reinforcement** — 6 Bark Sheets, 4 Root Fibers, 3 Stones. Safer HOME in storms
- **4. Nursery Nest** — 5 Moss, 4 Flower Petals, 2 Soft Cloth Fibers. Safe sleep for babies
- **5. Lantern Mushroom Lamp** — 2 Glowing Mushrooms, 1 Mushroom Cap, 2 String. Soft glowing light
- **6. Warmth Stones** — 5 Smooth Stones, 2 Moss, 1 Clay Mud. Keeps the nest warm at night
- **7. Acorn Bowl** — 1 Large Acorn Cap, 1 Sap Droplet, 1 Grass Fiber. Stores berries or water
- **8. Storage Cache** — 4 Bark Sheets, 5 Stones, 3 Dry Grass. Hidden storage; slows spoilage
- **9. Family Keepsake Shelf** — 3 Bark Sheets, 2 Tiny Trinkets, 1 Feather. Decoration with memory
- **10. Thistle Bed** — 5 Thistle Flowers, 4 Moss, 2 Pine Needles. Better sleep, better mornings`,
  related: [
    { to: "home", kind: "improves" },
    { to: "crafting", kind: "chapter-of" },
  ],
});

page({
  id: "recipes-exploration-gear",
  title: "Recipes — Exploration Gear",
  category: "recipe",
  summary: "Ten crafts for the road: the pack, the cloak, ropes, lanterns and the scent mask that keep a traveler alive.",
  tags: ["recipes", "gear", "exploration"],
  content: `Gear for leaving [[home]] and coming back again.

## The recipes
- **11. Travel Backpack** — 3 Cloth Fibers, 4 String, 2 Bark Fibers. More carrying room (see [[the-backpack]])
- **12. Leaf Rain Cloak** — 5 Large Leaves, 2 Sap Droplets, 3 String. Shrugs off rain and cold
- **13. Root Rope** — 6 Root Fibers, 3 Grass Fibers. Climbing and gap-crossing
- **14. Dew Water Pouch** — 2 Soft Cloth Fibers, 1 Sap Droplet, 1 String. Carry water
- **15. Scent Mask Pouch** — 2 Lavender Flowers, 3 Moss, 1 Flower Petal. Hides your smell from hunters
- **16. Waterproof Leaf Pack** — 4 Large Leaves, 2 Sap Droplets, 2 String, 1 Cloth Scrap. Dry inventory in rain
- **17. Climbing Spikes** — 2 Sharp Thorns, 2 Beetle Shells, 2 Root Fibers. Steeper, faster climbs
- **18. Glow Lantern** — 2 Glowing Moss, 1 Mushroom Cap, 2 String. Light for dark places
- **19. Firefly Lantern** — 1 Glass Fragment, 3 Fireflies, 2 String, 1 Moss. A moving light that draws insects
- **20. Moonstone Necklace** — 1 Crystal Fragment, 2 Root Fibers, 1 Tiny Bead, 1 Glowing Moss. Faint glow; night sight`,
  related: [
    { to: "the-backpack", kind: "includes" },
    { to: "crafting", kind: "chapter-of" },
    { to: "moonstone-hollow", kind: "rare-materials-from" },
  ],
});

page({
  id: "recipes-food-survival",
  title: "Recipes — Food & Survival",
  category: "recipe",
  summary: "Ten recipes between a mouse and hunger: bundles, stews, poultices, balms — and the legendary Cheese Feast.",
  tags: ["recipes", "food", "medicine", "survival"],
  content: `What the forest gives, the crafting corner turns into meals and medicine.

## The recipes
- **21. Berry Bundle** — 6 Berries, 1 Twig. Portable snack
- **22. Mushroom Stew** — 3 Mushrooms, 1 Creek Water, 2 Herbs. Warm healing meal
- **23. Nectar Energy Mix** — 2 Nectar, 3 Clover Seeds. Stamina burst
- **24. Roasted Beetle Snack** — 2 Beetles, 1 Twig. Protein of the pines
- **25. Healing Poultice** — 2 Medicinal Mushrooms, 3 Moss, 1 Bitter Herb. Restores health
- **26. Bee Wax Balm** — 2 Bee Wax, 1 Flower Petal, 1 Moss. Wards off cold and rain
- **27. Glow Dust Satchel** — 2 Glowing Moss, 1 Mushroom Dust, 1 Cloth Scrap, 1 String. Faint tunnel light
- **28. Cheese Feast** — 1 Cheese Chunk, 4 Berries, 2 Clover Seeds. Massive morale and hunger boost
- **29. Moon Petal Tea** — 3 [[moonpetal|Moon Petals]], 1 Creek Water, 1 Nectar. Rare calming drink of the Hollow
- **30. Snack Pouch** — 2 Cloth Fibers, 2 String, 3 Dry Grass. Extra food on long journeys`,
  related: [
    { to: "berry-bushes", kind: "supplied-by" },
    { to: "crafting", kind: "chapter-of" },
    { to: "moonpetal", kind: "uses" },
  ],
});

page({
  id: "recipes-charms-cosmetics",
  title: "Recipes — Charms & Cosmetics",
  category: "recipe",
  summary: "Ten tiny treasures to wear and hang: bracelets, crowns, charms and jars of fireflies.",
  tags: ["recipes", "cosmetics", "charms"],
  content: `Small things with big meaning — every charm is a memory you can wear.

## The recipes
- **31. Braided Grass Bracelet** — 4 Grass Fibers, 1 Tiny Bead. The keepsake (see [[the-bracelet]])
- **32. Feather Charm** — 1 Owl Feather, 2 String. For the backpack strap
- **33. Button Backpack Pin** — 1 Human Button, 1 String. A trophy from the giants' house
- **34. Berry Seed Charm** — 3 Berry Seeds, 1 String
- **35. Flower Crown** — 5 Wildflowers, 2 Grass Fibers
- **36. Acorn Pendant** — 1 Acorn Cap, 1 String, 1 Tiny Pebble
- **37. Lavender Anklet** — 3 Lavender Flowers, 2 Grass Fibers
- **38. Crystal Ear Charm** — 1 Crystal Fragment, 1 String
- **39. Firefly Jar Decoration** — 1 Glass Fragment, 2 Fireflies, 1 String
- **40. Moonstone Crown** — 3 Crystal Fragments, 4 Moon Petals, 2 Root Fibers. The rarest thing a mouse can wear`,
  related: [
    { to: "the-bracelet", kind: "includes" },
    { to: "crafting", kind: "chapter-of" },
  ],
});

page({
  id: "recipes-building-structures",
  title: "Recipes — Building & Structures",
  category: "recipe",
  summary: "Ten works of mouse engineering: hideouts, bridges, storm doors, escape tunnels and the map table.",
  tags: ["recipes", "building", "structures"],
  content: `The chapter that changes the world instead of the mouse.

## The recipes
- **41. Grass Hideout** — 8 Tall Grass, 3 Moss, 2 Twigs. Emergency shelter
- **42. Twig Bridge** — 5 Sticks, 4 Root Fibers. Cross puddles and gaps
- **43. Lookout Perch** — 4 Bark Sheets, 3 Twigs. Scout danger safely
- **44. Escape Tunnel** — 6 Root Fibers, 5 Stones, 4 Packed Dirt. A hidden second way out of [[home]]
- **45. Storm Door** — 4 Bark Sheets, 2 Sap Droplets, 3 Stones. Weathers the worst nights
- **46. Herb Drying Rack** — 4 Twigs, 2 Root Fibers, 3 Bark Strips. Preserves medicine
- **47. Map Table** — 5 Bark Sheets, 3 Twigs, 2 String, 1 Feather. Unlocks map tracking and notes
- **48. Scent Trail Marker** — 2 Lavender Flowers, 1 Berry Juice, 1 Moss. Find your way home in storms and dark
- **49. Baby Toy** — 1 Cloth Scrap, 2 Grass Fibers, 1 Tiny Button. Happier family; babies sleep better
- **50. Sticky Sap Trap** — 3 Sap Droplets, 2 Mushroom Dust, 1 Beetle Shell, 1 Berry Juice. Slows a pursuing predator`,
  related: [
    { to: "home", kind: "protects" },
    { to: "crafting", kind: "chapter-of" },
    { to: "family-and-legacy", kind: "supports" },
  ],
});

page({
  id: "recipes-secret",
  title: "Recipes — The Secret Pages",
  category: "recipe",
  status: "review",
  summary: "Five recipes written in silverpoint at the back of the Ledger — found, not taught.",
  tags: ["recipes", "secret", "moonstone", "late-game"],
  content: `These pages are never taught. They are found — in journals, in ruins, in the glow of the Hollow.

## The recipes
- **51. Moonstone Lantern** — 2 Crystal Fragments, 3 Glowing Moss, 2 String
- **52. Secret Root Door** — 5 Root Fibers, 2 Bark Sheets, 3 Moss
- **53. Ancient Seed Planter** — 3 Ancient Seeds, 2 Acorn Caps, 1 Moss. The old crops live again
- **54. Family Portrait Wall** — 3 Bark Sheets, 2 Feathers, 1 Human Paper Scrap
- **55. Moonstone Hollow Shrine** — 5 Crystal Fragments, 10 Moon Petals, 5 Glowing Moss. The last page of the Ledger

With all fifty-five, a mouse can build a life: survival, exploration, home, family, beauty, and one small shrine under the moon.`,
  related: [
    { to: "moonstone-hollow", kind: "materials-from" },
    { to: "moonkeeper-journals", kind: "found-in" },
    { to: "crafting", kind: "chapter-of" },
  ],
});

// ============================================================
// ⚙️ THE RULES OF THE REALM — mechanics
// ============================================================

page({
  id: "crafting",
  title: "Crafting & the Crafting Corner",
  category: "mechanic",
  created: OLD,
  version: 2,
  summary: "Not a crafting table — a crafting corner: a bark workspace inside Home where a mouse carefully assembles a life.",
  tags: ["system", "gameplay", "crafting", "cozy"],
  content: `Crafting in Whisker Wood is **handmade, natural, cozy, improvised** — a tiny mouse assembling survival tools from scavenged materials. Never an industrial recipe grid.

## The Crafting Corner
Inside [[home]]: a flat bark surface, a woven grass mat, pebble tools, acorn bowls, hanging string, berry-dye stains, a lantern mushroom glowing nearby. Lived-in. Personal.

## How it opens
- Walk to the corner → *Press E to Craft* — the mouse physically sits, sorts materials, ties string, weaves fibers, and then the menu appears
- Small recipes (a Berry Bundle) can be crafted anywhere from [[the-backpack]]
- Major recipes (the Travel Backpack, the Nursery Nest) require HOME — coming home stays meaningful
- As HOME upgrades, deeper chapters unlock: survival → family → the secret Moonstone pages

## The philosophy
Crafting is *improving your life*, not grinding. The strongest crafting moments are storms: family asleep nearby, lantern glow flickering, rain on the roof — crafting as emotional downtime.

## The Ledger
All 55 recipes, chapter by chapter: [[recipes-home-comfort]], [[recipes-exploration-gear]], [[recipes-food-survival]], [[recipes-charms-cosmetics]], [[recipes-building-structures]], and [[recipes-secret]].

## The UI
Hand-drawn, organic, tactile — recipes laid out on bark, icons sketched like field notes. Never a futuristic inventory screen.`,
  related: [
    { to: "home", kind: "lives-in" },
    { to: "resource-guide", kind: "consumes" },
    { to: "recipes-home-comfort", kind: "chapter" },
    { to: "recipes-secret", kind: "chapter" },
  ],
});

page({
  id: "survival",
  title: "Survival — Stats, Weather & Stealth",
  category: "mechanic",
  summary: "The systems under the fur: hunger, water, sleep, warmth, wetness, visibility and sound — and how every biome bends them.",
  tags: ["system", "survival", "stats", "stealth", "weather"],
  content: `## The four needs
Health, food, water, sleep. Food and water drain as you live; run either dry and health follows. Sleep restores fastest at [[home]], slower at the [[fallen-log]].

## Wetness & warmth
Crossing the [[crossable-creek]] soaks you: warmth drains faster and your scent trail grows. Rain does the same in the open. Pine boughs, cloaks and balms push back.

## Stealth is three senses
- **Sight** — the [[tall-grass]] and bush-shadow hide you; the open [[meadow]] does not. Disturbed flowers and shaking grass betray movement
- **Sound** — pine needles soften steps; snapping stalks carry; strong wind masks everything (yours and theirs)
- **Scent** — pollen, wetness and crushed berries make you easier to track; lavender scent-masks make you harder

## Weather is a system, not a backdrop
Rain bends grass, raises the creek and shines the berries. Storms flood fords, test the burrow, and make the [[human-house]] gutters roar. Heat exposes crossing stones. Every forecast changes the right route.

## Night
Every biome has a night self: the forests close down, the Meadow silvers, the flowers close, the House lights up — and somewhere past the aspens, something faintly glows.`,
  related: [
    { to: "whisker-wood", kind: "governs" },
    { to: "crafting", kind: "countered-by" },
    { to: "the-first-day", kind: "taught-in" },
  ],
});

page({
  id: "family-and-legacy",
  title: "Family & Legacy",
  category: "mechanic",
  status: "review",
  summary: "Not a breeding mechanic — a life: a companion, a nursery of squeaking babies, and generations that carry the burrow forward.",
  tags: ["system", "family", "emotional", "legacy"],
  content: `The heart-change of the whole game: from *survive for yourself* to *protect the family*.

## The Companion
Met naturally, trusted slowly (see [[the-companion]]). When they move into [[home]], the burrow comes alive.

## The babies
They stay in the nest at first; squeak during storms; sleep piled together; grow slowly — newborn, wandering, curious juvenile, independent young mouse. Never workers or units.

## What changes
More food storage. Safer den upgrades. Escape tunnels. Warmer bedding. A fox near the nest is no longer a threat — it is THE threat. Weather, reserves and security suddenly matter emotionally.

## The killer feature
**The babies learn from the player**: they follow the paths you use, prefer the foods you bring, mimic your habits, inherit little traits. They feel alive because they carry you in them.

## Keep it small
One companion, a few babies. Intimacy, not colony management. Never RTS.

## Legacy
Older children leave to explore; some return with gifts, some with maps to places you have never seen. The world continues (see [[life-of-a-mouse]]).`,
  related: [
    { to: "the-companion", kind: "begins-with" },
    { to: "home", kind: "transforms" },
    { to: "life-of-a-mouse", kind: "fulfills" },
  ],
});

// ============================================================
// 📖 THE GRAND SAGA — story & quests
// ============================================================

page({
  id: "life-of-a-mouse",
  title: "The Story of Whiskerwood",
  category: "story",
  version: 2,
  created: NEW,
  modified: V2,
  summary: "Twelve phases: from a little school in the south, through loss and wilderness, to reuniting the five Great Cities — and a life after.",
  tags: ["story", "arc", "phases", "canon-v2", "ending"],
  content: `Knowledge and abilities unlock the world — never level gates (think Breath of the Wild, Outer Wilds, Subnautica).

## The twelve phases
1. **A Quiet Beginning** — life at the [[fallen-log-school]]: classmates, teachers, the garden, the workshop. You fall in love with it. Then the expedition leaves
2. **Alone** — the predator attack. You wake with a small backpack, a journal, a knife, a lantern, and a wooden compass from graduation. Survive
3. **The Search Begins** — torn maps, cold campfires, teacher journals: *they were here*. And [[home]] starts to matter: expand it, decorate it, stock it
4. **Exploring the Great Forest** — the biomes open; progression is gear, not XP: better rope, stronger lantern, bigger backpack, climbing claws, a raft, a grappling vine
5. **[[moonstone-hollow]]** — huge, ancient, silent. You descend
6. **[[roothaven]]** — the reveal. The teachers are ALIVE. Engineering, machines, water systems — and four words that change everything: *"Everbough is real."*
7. **Reconnecting the World** — the mission transforms: restore trade, mail, maps, old roads, Moonkeeper stations
8. **[[everbough]]** — the legendary city: the Grand Library, the Academy, guilds, festivals, dozens of lives entangled with yours
9. **The Other Great Cities** — each opens a whole system: Reedmere boats, Golden Hollow farming and cooking, Frostpine cold survival and carving
10. **Becoming a Moonkeeper** — never inherited, always EARNED: the cities recognize the first Moonkeeper in generations
11. **Restoring the [[great-canopy-alliance]]** — bridges reopen, caravans roll, academies trade students; the world visibly heals
12. **Your Life After the Story** — the dream burrow, apprentices or a family (see [[family-and-legacy]]), museum halls filled, every book found for the Grand Library

## Progression: reputation, not levels
Each Great City learns to trust you separately — trust opens buildings, archives, guild doors, festival invitations and homes. By the end you are not the most powerful mouse in the world. You are **the mouse who reunited it**.

> The theme under it all: rebuilding connections across a world that forgot it was ever one civilization.`,
  related: [
    { to: "fallen-log-school", kind: "begins-at" },
    { to: "roothaven", kind: "turns-at" },
    { to: "great-canopy-alliance", kind: "restores" },
    { to: "family-and-legacy", kind: "epilogue" },
    { to: "the-first-day", kind: "opens-with" },
  ],
});

page({
  id: "the-first-day",
  title: "The First Day",
  category: "quest",
  summary: "The tutorial that never says 'tutorial': wake in the den, taste the world, meet its dangers, and come home at dusk.",
  tags: ["tutorial", "quest", "opening", "design"],
  content: `The opening should feel like *a tiny mouse waking up and learning to survive* — never menus, popups, or PRESS W TO MOVE.

## The shape of the day
1. **Black screen** — wind in grass, distant birds, soft squeaking. Fade in: curled asleep inside [[home]], warm light, tiny den
2. **"Morning already…"** — leave the den. One quiet objective, no giant UI
3. **The reveal** — giant grass in the wind, sunrise, birds overhead. The fantasy lands here
4. **Hunger stirs** → the [[berry-bushes]]. *Press E to gather.* Exploration = survival
5. **Thirst** → the sound of water guides you to the [[crossable-creek]]. Drink
6. **The first fear** — an owl call, a fox bark, a shadow overhead. No combat. Just vulnerability
7. **Hide** → the [[tall-grass]] teaches sneaking; stillness saves
8. **Discovery** → the [[fallen-log]]: mushrooms, shelter, proof the world hides safe places
9. **Dusk** — the light dies, the sounds sharpen, and going home feels like an instinct
10. **First night** — rain on the roof, warm nest, sleep. Fade out

## The morning after
Step out of HOME; the camera lifts; the whole world spreads — Meadow, forests, creek, the [[human-house]] far off. Music swells softly. *This world is mine to survive in.*

Movement hints appear once, small, then never again. An [[the-elder|Elder]] may offer one line and vanish. Discovery is the teacher.`,
  related: [
    { to: "home", kind: "starts-at" },
    { to: "the-elder", kind: "guided-by" },
    { to: "survival", kind: "teaches" },
    { to: "life-of-a-mouse", kind: "phase-one" },
  ],
});

// ============================================================
// 🌙 THE CHRONICLES OF THE MOONKEEPERS — lore
// ============================================================

page({
  id: "moonkeepers",
  title: "The Moonkeepers",
  category: "lore",
  created: OLD,
  version: 2,
  summary: "The ancient civilization of builders, healers and explorers whose silver-lit works became legend — and whose disappearance is the world's great mystery.",
  tags: ["order", "lore", "civilization", "moon", "mystery"],
  content: `Hundreds of mouse generations ago, before the villages of today, there was one great civilization: the **Moonkeepers**. Every mouse has heard the stories. Most believe they are only fairy tales.

## Why "Moonkeepers"
They believed the moon watched over every creature. They worked at night; their villages glowed with tiny lanterns, polished moonstone, and bioluminescent fungi. Travelers could always find shelter by following the silver lights through the trees.

## What made them great
Not rulers — **builders, inventors, healers, explorers**. Homes grown inside living trees without harming them. Rope bridges that lasted generations. Winter stores, medicine gardens, illustrated journals, and tunnel roads connecting whole forests.

> "Leave the forest stronger than you found it." — their greatest belief

## The symbol
A silver crescent moon around an oak leaf — carved into ancient doors, old bridges, hidden tunnels, forgotten tools and stone markers. Find the mark, and you have found their work.

## Their architecture
Everything feels grown, not built: bridges woven from living roots, mossy stone stairs, acorn-cap lantern posts, water channels carved along roots, spiral stairs inside hollow trunks, underground halls held up by the roots of [[everbough]] itself.

## The Great Tunnel Network
Their masterwork — see [[tunnel-network]]. Underground highways whose entrances have mostly collapsed or hidden themselves behind roots and rocks.

## The mystery
No one knows why they vanished (see [[the-vanishing]]). They faded; a terrible winter scattered them; a predator broke the capital; they went deeper, to guard something beneath the forest. Different mice tell different stories. None are confirmed — the truth is pieced together from [[moonkeeper-journals|journals]], ruins, and conversation.

## The player's role
Not the chosen one. Just the first mouse in generations curious enough to seek the legacy — restoring bridges, reopening tunnels, preserving journals — until the other mice begin to use the old word again: *Moonkeeper*. Not for bloodline. For how you choose to live.`,
  related: [
    { to: "moonstone-hollow", kind: "dwells-in" },
    { to: "tunnel-network", kind: "built" },
    { to: "moonkeeper-journals", kind: "left-behind" },
    { to: "the-vanishing", kind: "ended-by" },
    { to: "everbough", kind: "reveres" },
    { to: "pip", kind: "member" },
  ],
});

page({
  id: "moonkeeper-journals",
  title: "The Moonkeeper Journals",
  category: "lore",
  summary: "Beautifully illustrated field books — each one a recipe, a bridge, a hidden door, a song — that together reconstruct a lost civilization.",
  tags: ["lore", "journals", "collectibles", "knowledge"],
  content: `The [[moonkeepers]] left no history books. They left **journals** — beautifully illustrated, each one teaching something:

- a forgotten crafting recipe (the Ledger's [[recipes-secret|secret pages]] came from these)
- how to raise a root bridge
- where a hidden tunnel begins
- which flowers bloom only under certain moons
- old traditions, and older songs

Collecting them slowly reconstructs what happened — and quietly turns the collector into what the journals describe. This very Library is a Moonkeeper endeavour; their apprentice [[pip]] compiled much of what you read here.

> "What is written twice can be forgotten once and still endure." — First Keeper's Maxim`,
  related: [
    { to: "moonkeepers", kind: "written-by" },
    { to: "recipes-secret", kind: "source-of" },
    { to: "pip", kind: "collected-by" },
  ],
});

page({
  id: "whisker-wisdom",
  title: "Whisker Wisdom",
  category: "lore",
  summary: "The sayings of the old mice — the whole survival culture of Whisker Wood in two dozen short warnings.",
  tags: ["lore", "sayings", "culture", "survival"],
  content: `Nothing teaches the world faster than what the old mice say. Collected by the Keepers, biome by biome.

## Of the open sky
> "Never cross the Meadow at noon."
> "The sky hunters watch there. Travel fast and stay low."

## Of the grass
> "Stay still when the grass stops moving."
> "The silent grass is the dangerous grass."
> "Foxes listen more than they look."

## Of food
> "The sweetest berries grow where danger hunts."
> "Never eat the pale ones."
> "Foxes wait near the heavy bushes."
> "Never sleep in the flowers." — "The bees remember faces."

## Of water
> "Fast water steals careless paws."
> "Cross upstream after rain."
> "Never trust still water."

## Of the deep places
> "Never go near the deep water." — "Something lives below." — "The rope moves at night."
> "Do not sleep inside the mushroom ring."

## Of the giants
> "The giants leave food after dark."
> "Never run across open kitchen tile."
> "The striped cat hunts silently."

## Of home and hope
> "A strong burrow means another spring."
> "The roots remember every family."
> And of a certain glow beyond the aspens: "Some places shine after moonrise."`,
  related: [
    { to: "the-elder", kind: "spoken-by" },
    { to: "whisker-wood", kind: "describes" },
  ],
});

// ============================================================
// ⏳ THE ENDLESS SCROLL — timeline
// ============================================================

page({
  id: "first-sprout",
  title: "The First Sprout",
  category: "timeline",
  created: OLD,
  summary: "The mythic day Everbough broke the soil, from which the mice reckon all time.",
  tags: ["origin", "myth", "era"],
  content: `By Moonkeeper reckoning, the world begins with **The First Sprout** — the day [[everbough]] broke the soil. All years are counted from it.`,
  related: [{ to: "everbough", kind: "concerns" }],
  timeline: { era: "The First Age", year: 0, order: 0 },
});

page({
  id: "founding-hollow",
  title: "The Founding of the Hollow",
  category: "timeline",
  created: OLD,
  summary: "The Moonkeepers descend into the roots and settle the Moonstone Hollow.",
  tags: ["moonkeepers", "era", "founding"],
  content: `In the twelfth year, the [[moonkeepers]] followed a moonstone glow down the [[tunnel-network]] and founded the [[moonstone-hollow]] as their eternal home.`,
  related: [
    { to: "moonkeepers", kind: "concerns" },
    { to: "moonstone-hollow", kind: "concerns" },
  ],
  timeline: { era: "The First Age", year: 12, order: 2 },
});

page({
  id: "the-vanishing",
  title: "The Vanishing",
  category: "timeline",
  status: "review",
  summary: "The year the silver lights went out — and nobody knows why.",
  tags: ["moonkeepers", "mystery", "era"],
  content: `In the year 412, travelers stopped finding the silver lights. The bridges stood; the tunnels breathed; the journals waited on their shelves — but the [[moonkeepers]] were gone.

The stories disagree: they faded away; a terrible winter scattered them; a predator destroyed the capital; they went deeper, to guard something beneath the forest. The [[moonkeeper-journals]] end mid-sentence, in a dozen different pawwritings, all in the same season.

No confirmed account exists. The Scroll keeps the year and keeps its silence.`,
  related: [
    { to: "moonkeepers", kind: "concerns" },
    { to: "moonkeeper-journals", kind: "evidence" },
  ],
  timeline: { era: "The Silent Age", year: 412, order: 0 },
});

// ============================================================
// 🎨 THE ILLUMINATED PORTFOLIO — art
// ============================================================

page({
  id: "art-canopy",
  title: "Canopy — Colour Study",
  category: "concept-art",
  created: OLD,
  status: "draft",
  summary: "Early palette exploration for the high boughs at golden hour.",
  tags: ["art", "palette", "canopy"],
  content: `A draft palette for the **Canopy** reach of [[everbough]]: warm amber light filtered through green, deep shadow pockets, dust motes in every sunbeam.

*Placeholder — art to be attached.*`,
  related: [{ to: "everbough", kind: "depicts" }],
});

// ============================================================
// 🗒️ THE KEEPER'S LEDGER OF TRUTH — developer notes
// ============================================================

page({
  id: "vision-and-direction",
  title: "Vision & Direction",
  category: "dev-note",
  summary: "What Whiskerwood IS: a cozy survival adventure about being tiny — camera, art style, engine, first slice, and the one image that sells it all.",
  tags: ["vision", "design", "camera", "engine", "scope"],
  content: `## The genre
A **cozy survival adventure** — Breath of the Wild / Stray / Little Kitty Big City energy. NOT a map simulator, city builder, or management game. Fully immersive, over-the-shoulder, cinematic exploration.

## The camera
Behind the mouse, low to the ground, slightly cinematic. The mouse scampers, squeezes through gaps, flattens under objects, climbs roots, jumps stones — fast, agile, lightweight. Never a human reskinned.

## The superpower: PERSPECTIVE
A blade of grass is a tree. A porch is a castle. A creek is a river. Most animal survival games fail because environments feel normal-sized; Whiskerwood works because the WORLD changes scale.

## Art style
**Stylized realism** — painterly textures, soft lighting, realistic proportions, slightly storybook. Not hyper-real, not voxel, not mobile-cartoon. Chunky low-poly woodland with flat colors and rounded edges for props.

## Engine
Unity: third-person controller, Cinemachine, URP lighting. (A Three.js sketch exists as the current prototype.)

## The first playable slice
Not the whole game: one meadow, tall grass, a berry bush, the creek, one wall of the Human House, mouse movement, camera behind. If THAT feels magical, the whole game works.

## Why people will play
Coziness + danger + tiny-scale wonder, together. The fantasy reads in one image. HOME builds attachment; atmosphere makes memories; stakes are personal (protect the family, survive winter — not save the world). Relaxing without being boring; the emotional niche of *building a quiet life* is underserved.

## The one image
A tiny mouse running through giant grass toward warm glowing house windows at sunset. Every decision serves that image.

## The core theme
> Building a life in a dangerous world — coziness in the middle of danger. That contrast is the soul of Whiskerwood.`,
  related: [
    { to: "whisker-wood", kind: "defines" },
    { to: "life-of-a-mouse", kind: "shapes" },
    { to: "asset-plan", kind: "informs" },
  ],
});

page({
  id: "small-details",
  title: "Small Details & Environmental Storytelling",
  category: "dev-note",
  summary: "The tiny touches that make the world real: a crow feather, predator tracks, flattened trails — and why less beats more.",
  tags: ["design", "details", "atmosphere", "worldbuilding"],
  content: `The map has enough big places. What makes it REAL are tiny environmental details.

## Add first (highest value, least clutter)
- **Crow Feather** — huge to a mouse, instantly says *a giant bird was here*. Near the [[tall-grass]] or [[meadow]] edge; a crafting item and an omen
- **Predator Tracks** — fox prints by the Meadow, cat prints by the [[human-house]], snake trails by the creek. Danger moves through the world and leaves signs
- **Flattened Grass Trails** — worn mouse paths; the world is inhabited

## Add later
- Fairy-ring mushrooms in the [[pine-forest]] ("Don't sleep inside the ring")
- A tiny stone arch near the aspens that frames the moon
- A half-eaten apple core by the House — food jackpot, insect magnet
- A bee nest near the [[wildflower-patch]] — high-risk nectar
- A hidden cheese stash, absurdly hard to find — community legend material
- A wind chime near the House: faint, lonely notes drifting across the map at night

## The rule
The best worlds keep empty space, quiet areas, and mystery. Too many "cool things" become clutter; discoveries need silence around them to matter.`,
  related: [
    { to: "hidden-places", kind: "companion-note" },
    { to: "whisker-wood", kind: "dresses" },
  ],
});

page({
  id: "asset-plan",
  title: "The Asset Plan",
  category: "dev-note",
  status: "review",
  summary: "All 55 craftables in five low-poly packs, with budgets, mouse-scale sizing, and how to prompt Meshy for each one.",
  tags: ["assets", "3d", "pipeline", "low-poly", "meshy"],
  content: `## Five packs for the 55 recipes
1. **Home & Comfort** (10) — 100–500 tris each: bedding, blankets, lamps, bowls, caches
2. **Exploration Gear** (10) — stitched leaves, bark buckles, twine: mouse equipment, never human gear
3. **Food & Survival** (10) — chunky low-poly: oversized berries, stylized stew, simple sacks
4. **Charms & Cosmetics** (10) — 50–200 tris, easy to swap onto the mouse model
5. **Structures & Rare** (15) — the hero assets, 500–2000 tris: bridges, storm doors, the Shrine

## Shared palette
Moss green, forest green, bark brown, mushroom cream, lavender purple. Flat colors, no photo textures, chunky rounded geometry — cozy stylized low-poly woodland.

## Mouse-scale guide (mouse = 0.25m)
- Acorn bowl 0.08m · Backpack 0.12m · Nest 0.30m · Twig bridge 1.0m · Moonstone shrine 1.5m

## Prompting Meshy
The physical description IS the prompt — 100–200 words on shape, materials, construction and scale; style words ("stylized", "low poly") are seasoning, not the meal. Example: *"Round mouse sleeping nest, twelve inches across, thick moss packed into a shallow bowl, woven grass rim, compressed sleeping depression, uneven organic silhouette, handmade by a woodland mouse. Single object."* Generate one item at a time.

## Environment kit
The Polytope "Dreamscape Nature Mountains" Unity pack fits the woodland look: import to Unity, pull the FBX sources, export GLB via Blender for Three.js. Scale everything UP dramatically and keep the mouse tiny. License allows conversion for the project, never redistribution of converted files.`,
  related: [
    { to: "vision-and-direction", kind: "implements" },
    { to: "crafting", kind: "visualizes" },
  ],
});

// ============================================================
// 🌍 CANON V2 — the Great Cities, humans at the edges, the school
// (full source text: library/data/lore-inbox/world-v2-cities-and-progression.md)
// ============================================================

page({
  id: "humans-at-the-edges",
  title: "Humans at the Edges",
  category: "region",
  created: V2,
  modified: V2,
  summary: "One enormous protected wilderness is the whole world — humans only brush its edges, and what they drop becomes treasure.",
  tags: ["humans", "canon-v2", "wilderness", "scavenging"],
  content: `All of Whisker Wood lies inside **one enormous protected forest** — a real wilderness, national-forest vast. To a mouse that forest is an entire world, and the mouse civilizations within it are ancient and self-contained. Humans pass through; they are not part of everyday life.

## Where the giants touch the world
- A **hiking trail** crossing the forest
- A **campsite** that appears in summer
- A **picnic area** where mice scavenge after the people leave
- A **ranger station** — far too dangerous to enter while occupied (home of the [[house-cat]])
- **Logging roads** that changed parts of the forest long ago
- Fences, bridges, culverts and old farm equipment — colossal landmarks from a mouse's height

## Treasures, not destinations
Human objects are discoveries that reinforce the scale fantasy: a lost button becomes a shield; a marble a prized decoration; a thimble a bucket; a spool a table.

This replaces the old [[human-house]], which was struck from canon.`,
  related: [
    { to: "whisker-wood", kind: "frames" },
    { to: "human-house", kind: "supersedes" },
    { to: "house-cat", kind: "brings" },
  ],
});

page({
  id: "great-canopy-alliance",
  title: "The Great Canopy Alliance",
  category: "lore",
  created: V2,
  modified: V2,
  summary: "The five Great Cities that once traded, taught and celebrated together — until the world forgot it was ever one civilization.",
  tags: ["cities", "alliance", "canon-v2", "lore"],
  content: `Long ago five great mouse cities were bound together as the **Great Canopy Alliance** — trade, mail, festivals, and students exchanged between their Royal Academies. Then the roads failed, the Moonkeepers vanished, and each city came to believe the others were legends.

## The Five Great Cities
- **[[everbough]] — the City of Knowledge**, grown upward into the branches. Its iconic heart: the Grand Library. Royal Academy classes you attend because they are FUN (botany field trips, cartography, architecture, craftsmanship); neighborhoods of craftsmen and scholars; a town square that changes daily; festivals you play in — Spring Blossom, Lantern Night, Harvest Feast, Winter Lights
- **[[roothaven]] — the City of Builders**, grown downward into the roots
- **Reedmere, the Marsh City** — floating homes, boats everywhere, fishing and boat races. Iconic: the Lighthouse of Reeds
- **Golden Hollow, the Plains City** — the food capital: farms, gardens, cooking contests. Iconic: the Great Harvest Hall
- **Frostpine, the Northern City** — snow, ice caves, hot springs, carving. Iconic: the Hall of Everfrost

## Across every city
Friendships and letters; a small home of your own to earn; guilds (Explorers, Builders, Botanists, Historians, Engineers, Naturalists); a museum that fills with your donations; an art gallery where, one day, someone paints YOU; cafés where overheard rumors become quests.

## The map of the world
Frostpine in the north; Golden Hollow, Everbough and Reedmere across the middle; [[moonstone-hollow]] below; [[roothaven]] beneath it; and the [[fallen-log-school]] in the south, where the story begins.

Restoring this Alliance is the long arc of the game (see [[life-of-a-mouse]]).`,
  related: [
    { to: "roothaven", kind: "member" },
    { to: "everbough", kind: "member" },
    { to: "moonkeepers", kind: "bound-by" },
    { to: "the-great-alliance", kind: "founded-at" },
  ],
});

page({
  id: "roothaven",
  title: "Roothaven",
  category: "city",
  created: V2,
  modified: V2,
  summary: "The hidden city beneath the roots: an underground metropolis of stone, water and warm lantern light around the World Pine.",
  tags: ["city", "underground", "builders", "canon-v2"],
  coordinates: { x: -260, y: -80, z: -260, map: "underground" },
  content: `> "The earth remembers what the sky forgets." — Ancient Roothaven Proverb

One of the Five Great Cities of the [[great-canopy-alliance]]. Where [[everbough]] grew upward into the branches, **Roothaven** grew downward into the roots of the oldest forests. Surface mice believe it is a myth; Roothaven believes the surface cities vanished generations ago. Both are wrong.

## Reaching it
Beneath the [[pine-forest]]; the only known way in leads through [[moonstone-hollow]], the old Moonkeeper tunnels, the Root Caverns, and the Great Descent — until the tunnel widens, warm golden light appears, water murmurs, voices echo… and an underground metropolis opens around the roots of an impossibly ancient pine: the **World Pine**. *This isn't a ruin. People still live here.*

## The city
Sacred roots weave through it like streets — children play on them, lanterns hang from them, and no one may cut them. Stone, slate, clay brick, polished crystal and bronze; rounded arches, massive pillars, water channels everywhere. No sunlight — lanterns, crystal lamps, glowing fungi, a cozy amber glow. You hear water wheels, hammers, echoes, children.

## Districts
Root Hall (the Council), the Foundry District (water-powered machines, elevators), the Crystal Quarter, the River District (canals, boats, markets), Archive Hall (stone libraries, Moonkeeper journals), and the Hearth District (families, schools, glowing-moss gardens).

## Its people
Governed by the **Council of Roots** — one Elder per district, guided (never ruled) by the eldest, the **Root Speaker**. They value engineering, craftsmanship, reliability and quiet confidence: *"Good work speaks for itself."* Their crest: a massive pine root wrapped around a crystal — strength below, light within. Their motto: *"Beneath every great forest lies an even older story."*

## The Root Cathedral
The city's oldest public hall: the World Pine's colossal roots descend through a cavern the size of a castle, twisting into natural arches and bridges, built around for centuries without a single cut. Lanterns hang from the roots like stars. The first step into that space is the moment a traveler understands this is one of the greatest civilizations in the world.

## The teachers
The lost expedition from the [[fallen-log-school]] found Roothaven by accident — and were welcomed as the first surface mice in generations. When the player finally arrives, the reunion carries a second shock: *"Everbough is real."*`,
  related: [
    { to: "great-canopy-alliance", kind: "member-of" },
    { to: "moonstone-hollow", kind: "entered-through" },
    { to: "fallen-log-school", kind: "found-by-teachers-of" },
    { to: "moonkeepers", kind: "keeps-archives-of" },
    { to: "the-teacher-expedition", kind: "discovered-during" },
  ],
});

page({
  id: "fallen-log-school",
  title: "Fallen Log School",
  category: "building",
  created: V2,
  modified: V2,
  summary: "The little school in the south of the wilderness where the story begins — classmates, teachers, a garden, and one fateful expedition.",
  tags: ["school", "story-start", "canon-v2", "home-region"],
  content: `The **Fallen Log School** sits in the south of the great wilderness — a small, warm world of its own: classmates, teachers, a headmaster, a little library, a garden and a workshop. Here the player learns everything naturally — walking, climbing, gathering, simple crafting, map reading — and, more importantly, comes to love the place.

## Then the expedition leaves
The teachers set out — and a predator attack scatters everything. The player wakes alone with a small backpack, a journal, a simple knife, a lantern, and a wooden compass from graduation. The first objective is one word: **survive**.

## What the school leaves behind
Torn maps. Cold campfires. Teacher journals. Footprints and broken wagons. Every clue whispers *they were here* — a trail that leads, eventually, down through [[moonstone-hollow]] to [[roothaven]], where the truth waits (see [[the-teacher-expedition]]).

*The school also anchors the map: Frostpine far north, the three cities across the middle, the Hollow and Roothaven below, and this little log at the bottom of the world — where everything starts small.*`,
  related: [
    { to: "great-canopy-alliance", kind: "southernmost-of" },
    { to: "the-teacher-expedition", kind: "launched" },
    { to: "life-of-a-mouse", kind: "phase-one-of" },
    { to: "fallen-log", kind: "kin-to" },
  ],
});

page({
  id: "the-great-alliance",
  title: "The Founding of the Great Alliance",
  category: "timeline",
  created: V2,
  modified: V2,
  summary: "The five Great Cities bind themselves together in trade, learning and festival.",
  tags: ["alliance", "era", "cities"],
  content: `In the 180th year the five Great Cities — [[everbough]], [[roothaven]], Reedmere, Golden Hollow and Frostpine — bound themselves into the [[great-canopy-alliance]]: shared roads, shared mail, shared festivals, and students traded between the Royal Academies.`,
  related: [{ to: "great-canopy-alliance", kind: "concerns" }],
  timeline: { era: "The First Age", year: 180, order: 0 },
});

page({
  id: "cities-lost",
  title: "The Cities Lost to Each Other",
  category: "timeline",
  created: V2,
  modified: V2,
  summary: "With the Moonkeepers gone and the roads failing, each Great City comes to believe the others are only stories.",
  tags: ["alliance", "era", "decline"],
  content: `After [[the-vanishing]], the tunnel roads collapsed one by one and the messengers stopped coming. Within a generation, each of the Great Cities believed the others were legends. The [[great-canopy-alliance]] survived only in carvings, journals — and the old word *Moonkeeper*.`,
  related: [
    { to: "great-canopy-alliance", kind: "concerns" },
    { to: "the-vanishing", kind: "follows" },
  ],
  timeline: { era: "The Silent Age", year: 430, order: 0 },
});

page({
  id: "the-teacher-expedition",
  title: "The Teacher Expedition",
  category: "timeline",
  created: V2,
  modified: V2,
  summary: "The Fallen Log School's teachers set out, are scattered by a predator — and stumble into a city out of legend.",
  tags: ["school", "era", "story", "roothaven"],
  content: `In the present age the teachers of the [[fallen-log-school]] mounted an expedition into the deep forest. A predator attack scattered it; the school believed them lost. In truth they descended through [[moonstone-hollow]] and became the first surface mice in generations to walk into [[roothaven]] — where they learned that [[everbough]] is real. The search for them is where the player's story begins.`,
  related: [
    { to: "fallen-log-school", kind: "concerns" },
    { to: "roothaven", kind: "discovered" },
    { to: "life-of-a-mouse", kind: "ignites" },
  ],
  timeline: { era: "The Age of Whiskers", year: 1041, order: 0 },
});

// ============================================================
// Validate & write
// ============================================================
const ids = new Set(pages.map((p) => p.id));
if (ids.size !== pages.length) {
  const seen = new Set();
  for (const p of pages) {
    if (seen.has(p.id)) console.error("DUPLICATE id:", p.id);
    seen.add(p.id);
  }
  process.exit(1);
}
let bad = 0;
for (const p of pages) {
  for (const r of p.related) {
    if (!ids.has(r.to)) {
      console.error(`MISSING relation target: ${p.id} -> ${r.to}`);
      bad++;
    }
  }
  for (const m of p.content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
    if (!ids.has(m[1].trim())) {
      console.error(`MISSING link target: ${p.id} -> [[${m[1]}]]`);
      bad++;
    }
  }
}
if (bad) process.exit(1);

const CATEGORIES = new Set(["world","region","building","city","village","character","animal","plant","item","resource","recipe","quest","story","lore","mechanic","timeline","music","concept-art","dev-note"]);
for (const p of pages) {
  if (!CATEGORIES.has(p.category)) {
    console.error(`BAD category: ${p.id} -> ${p.category}`);
    process.exit(1);
  }
}

mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../data/codex.json", import.meta.url), JSON.stringify(pages, null, 2));
console.log(`wrote ${pages.length} pages to data/codex.json`);
