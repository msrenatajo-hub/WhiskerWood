import type { Page, NewPage } from "@/types";
import { slugify } from "@/utils/id";

/** Fill a partial page with sensible defaults so the seed stays terse. */
function page(p: NewPage): Page {
  const stamp = "2026-01-12T09:00:00.000Z";
  return {
    id: p.id ?? slugify(p.title),
    title: p.title,
    category: p.category,
    status: p.status ?? "canon",
    summary: p.summary ?? "",
    content: p.content ?? "",
    tags: p.tags ?? [],
    related: p.related ?? [],
    attachments: p.attachments ?? [],
    coordinates: p.coordinates,
    timeline: p.timeline,
    created: p.created ?? stamp,
    modified: p.modified ?? stamp,
    version: p.version ?? 1,
    author: p.author ?? "The Keeper",
    notes: p.notes,
  };
}

/**
 * Sample WhiskerWood lore, deliberately interlinked so the relationship graph,
 * search, and shelves all have something to show on first run. The chain the
 * designer sketched — Pine Forest → Tunnel Network → Moonstone Hollow →
 * Moonkeepers → Everbough → a Character → a Recipe — is all present.
 */
export function seedPages(): Page[] {
  return [
    page({
      title: "Everbough",
      id: "everbough",
      category: "world",
      status: "canon",
      summary: "The colossal ancient tree at the heart of the world, and the forest that grew in its shadow.",
      tags: ["world", "great-tree", "origin"],
      content: `# Everbough

**Everbough** is the great tree older than memory, so vast that whole mouse
nations live among its roots, trunk hollows, and lower boughs. The forest that
surrounds it — and, to the mice, the *entire known world* — takes its name.

## The three reaches
- **The Rootways** — the tunnels and hollows below, home of the [[moonstone-hollow]].
- **The Understory** — the forest floor: the [[pine-forest]], the [[aspen-forest]], meadows and creeks.
- **The Canopy** — the high boughs, rarely travelled, watched by the [[barn-owl]].

The [[moonkeepers]] teach that the tree remembers every mouse who has lived
beneath it, and that its deepest roots drink from the same water as the moon.`,
      related: [
        { to: "pine-forest", kind: "contains" },
        { to: "aspen-forest", kind: "contains" },
        { to: "moonstone-hollow", kind: "contains" },
        { to: "moonkeepers", kind: "revered-by" },
      ],
      timeline: { era: "The First Age", year: 0, order: 0 },
    }),

    page({
      title: "Pine Forest",
      id: "pine-forest",
      category: "region",
      status: "canon",
      summary: "A shadowed evergreen expanse of needle-carpet and towering pines, gateway to the Rootways.",
      tags: ["region", "forest", "pine", "resource-rich"],
      coordinates: { x: -202, y: 0, z: -196, map: "overworld" },
      content: `# Pine Forest

Cool, dim, and endless-seeming, the **Pine Forest** is a carpet of fallen
needles beneath giants of bark and resin. Mice come here for [[pine-needles]]
and sticky sap, but linger at their peril — the light fails early here.

A hidden entrance beneath a fallen log opens into the [[tunnel-network]], and
from there, down to the [[moonstone-hollow]].

## Notable features
| Feature | Note |
|---|---|
| The Fallen Log | Marks the tunnel mouth. |
| Resin Seeps | Source of crafting sap. |
| The Quiet Glade | Where the [[moonkeepers]] first met. |`,
      related: [
        { to: "everbough", kind: "part-of" },
        { to: "tunnel-network", kind: "connects-to" },
        { to: "pine-needles", kind: "yields" },
      ],
    }),

    page({
      title: "Aspen Forest",
      id: "aspen-forest",
      category: "region",
      status: "canon",
      summary: "Golden groves of trembling aspen, bright and wind-loud, rich with berries and flowers.",
      tags: ["region", "forest", "aspen", "meadow"],
      coordinates: { x: -154, y: 0, z: -348, map: "overworld" },
      content: `# Aspen Forest

Where the pines are hushed, the **Aspen Forest** is all light and motion — leaves
like gold coins clattering in the wind. Wildflowers and berry bushes thrive at
its edges, making it prime foraging for [[moonpetal]] and sweet fruit.

Young mice are told the aspens whisper warnings when [[barn-owl|owls]] are near.`,
      related: [
        { to: "everbough", kind: "part-of" },
        { to: "moonpetal", kind: "yields" },
        { to: "barn-owl", kind: "hunted-by" },
      ],
    }),

    page({
      title: "The Tunnel Network",
      id: "tunnel-network",
      category: "building",
      status: "canon",
      summary: "A vast dug lattice of passages linking the surface forests to the deep Rootways.",
      tags: ["underground", "infrastructure", "tunnels"],
      content: `# The Tunnel Network

Generations of paws carved the **Tunnel Network** — a branching maze of scent-marked
passages joining the [[pine-forest]] surface to the underground halls. Every
junction bears a carved rune; every dead end once had a reason.

The longest, safest road leads to the [[moonstone-hollow]].`,
      related: [
        { to: "pine-forest", kind: "connects-to" },
        { to: "moonstone-hollow", kind: "leads-to" },
      ],
    }),

    page({
      title: "Moonstone Hollow",
      id: "moonstone-hollow",
      category: "region",
      status: "canon",
      summary: "The luminous underground sanctuary of the Moonkeepers, lit by veins of glowing moonstone.",
      tags: ["underground", "sacred", "moonstone", "sanctuary"],
      coordinates: { x: -260, y: -40, z: -260, map: "underground" },
      content: `# Moonstone Hollow

Deep below the roots lies the **Moonstone Hollow**, a cavern hall where veins of
[[moonstone]] glow a soft silver-blue, bright enough to read by. It is the seat
of the [[moonkeepers]] and the safest place in all of [[everbough]].

Pilgrims reach it through the [[tunnel-network]]. At the hollow's heart stands
the Reading Stone, where the order's chronicles are kept.`,
      related: [
        { to: "everbough", kind: "part-of" },
        { to: "tunnel-network", kind: "reached-by" },
        { to: "moonkeepers", kind: "home-of" },
        { to: "moonstone", kind: "lit-by" },
        { to: "pip", kind: "resident" },
      ],
    }),

    page({
      title: "The Moonkeepers",
      id: "moonkeepers",
      category: "lore",
      status: "canon",
      summary: "An ancient order of mice who preserve knowledge, tend the moonstone, and keep the old calendar.",
      tags: ["order", "lore", "keepers", "moon"],
      content: `# The Moonkeepers

The **Moonkeepers** are the memory of the mice: an order of scholars, cartographers,
and star-watchers dwelling in the [[moonstone-hollow]]. They believe [[everbough]]
and the moon share a hidden root, and that recording the world truly keeps it safe.

This very Library is a Moonkeeper endeavour. Their apprentice [[pip]] compiled
much of what you read here.

> "What is written twice can be forgotten once and still endure." — First Keeper's Maxim`,
      related: [
        { to: "moonstone-hollow", kind: "dwells-in" },
        { to: "everbough", kind: "reveres" },
        { to: "pip", kind: "member" },
      ],
      timeline: { era: "The First Age", year: 12, order: 1 },
    }),

    page({
      title: "Pip Thornwhisker",
      id: "pip",
      category: "character",
      status: "canon",
      summary: "A curious young Moonkeeper apprentice and the compiler of the Grand Library.",
      tags: ["mouse", "apprentice", "protagonist"],
      content: `# Pip Thornwhisker

**Pip** is a small brown field mouse with an oversized satchel and an even larger
curiosity. Apprenticed to the [[moonkeepers]], Pip roams from the [[pine-forest]]
to the [[aspen-forest]] gathering leaves, stories, and the odd shiny button.

Pip's proudest craft is a well-made [[moss-bedding]], and their dream is to map
every tunnel in the [[tunnel-network]].`,
      related: [
        { to: "moonkeepers", kind: "member-of" },
        { to: "moonstone-hollow", kind: "lives-in" },
        { to: "moss-bedding", kind: "crafts" },
      ],
    }),

    page({
      title: "Barn Owl",
      id: "barn-owl",
      category: "animal",
      status: "review",
      summary: "The great pale hunter of the night sky — the mice's oldest fear.",
      tags: ["predator", "bird", "night", "danger"],
      content: `# Barn Owl

Silent-winged and moon-faced, the **Barn Owl** hunts the [[aspen-forest]] edges at
dusk. Mice navigate by owl-shadow and owl-silence; a too-quiet grove means one is
near. The [[moonkeepers]] chart owl territories in the Endless Scroll.

*Status note: hunting range in the Understory still under review.*`,
      related: [
        { to: "aspen-forest", kind: "hunts-in" },
      ],
    }),

    page({
      title: "Moonpetal",
      id: "moonpetal",
      category: "plant",
      status: "canon",
      summary: "A pale night-blooming flower whose petals hold a faint glow; sacred to the Moonkeepers.",
      tags: ["flower", "night-blooming", "reagent", "glow"],
      content: `# Moonpetal

The **Moonpetal** opens only under moonlight, its five petals faintly luminous.
Found at the bright edges of the [[aspen-forest]], it is gathered for lanterns
and medicine. The [[moonkeepers]] consider a moonpetal left as an offering the
politest of prayers.`,
      related: [
        { to: "aspen-forest", kind: "grows-in" },
        { to: "moonkeepers", kind: "sacred-to" },
      ],
    }),

    page({
      title: "Moonstone",
      id: "moonstone",
      category: "resource",
      status: "canon",
      summary: "A softly glowing silver-blue mineral found in the deep roots; the light of the Hollow.",
      tags: ["mineral", "glow", "rare"],
      content: `# Moonstone

**Moonstone** grows in slow veins through the deep root-rock, giving off a cool
silver-blue light. It lights the [[moonstone-hollow]] and is prized for crafting
lanterns and charms. Removing large amounts is forbidden by the [[moonkeepers]].`,
      related: [
        { to: "moonstone-hollow", kind: "found-in" },
        { to: "moonkeepers", kind: "protected-by" },
      ],
    }),

    page({
      title: "Pine Needles",
      id: "pine-needles",
      category: "resource",
      status: "canon",
      summary: "Fallen evergreen needles — humble but essential bedding and thatch material.",
      tags: ["material", "common", "bedding"],
      content: `# Pine Needles

Gathered by the pawful from the [[pine-forest]] floor, **pine needles** are springy,
water-shedding, and everywhere. A core ingredient of [[moss-bedding]] and many a
roof.`,
      related: [
        { to: "pine-forest", kind: "gathered-from" },
        { to: "moss-bedding", kind: "ingredient-of" },
      ],
    }),

    page({
      title: "Moss Bedding",
      id: "moss-bedding",
      category: "recipe",
      status: "canon",
      summary: "A soft woven nest of moss, grass, and pine needles — the first thing every mouse learns to craft.",
      tags: ["recipe", "comfort", "starter"],
      content: `# Moss Bedding

The **Moss Bedding** is a warm, springy nest and the classic first craft.

## Ingredients
| Qty | Material |
|---|---|
| 5 | Moss |
| 3 | Grass Fibers |
| 2 | [[pine-needles|Pine Needles]] |

Woven correctly it is snug enough to sleep a whole family. [[pip|Pip]] insists the
secret is to line the rim with [[moonpetal]] for sweet dreams.`,
      related: [
        { to: "pine-needles", kind: "requires" },
        { to: "moonpetal", kind: "optional-ingredient" },
        { to: "crafting", kind: "made-with" },
      ],
    }),

    page({
      title: "Crafting",
      id: "crafting",
      category: "mechanic",
      status: "canon",
      summary: "Gather materials in the world, then weave them into gear, comfort, and charms at a workbench.",
      tags: ["system", "gameplay", "crafting"],
      content: `# Crafting

The **crafting** loop: forage materials across [[everbough]], return to a stump or
workbench, and combine them by recipe. Recipes live in the Guildmaster's Ledger;
[[moss-bedding]] is the canonical starter.

## Loop
1. Explore a region ([[pine-forest]], [[aspen-forest]], …).
2. Gather resources ([[pine-needles]], [[moonstone]], moss).
3. Craft at a workbench.
4. Place or store the result.`,
      related: [
        { to: "moss-bedding", kind: "example-recipe" },
        { to: "everbough", kind: "set-in" },
      ],
    }),

    page({
      title: "The First Sprout",
      id: "first-sprout",
      category: "timeline",
      status: "canon",
      summary: "The mythic day Everbough broke the soil, from which the mice reckon all time.",
      tags: ["origin", "myth", "era"],
      content: `# The First Sprout

By Moonkeeper reckoning, the world begins with **The First Sprout** — the day
[[everbough]] broke the soil. All years are counted from it.`,
      related: [{ to: "everbough", kind: "concerns" }],
      timeline: { era: "The First Age", year: 0, order: 0 },
    }),

    page({
      title: "The Founding of the Hollow",
      id: "founding-hollow",
      category: "timeline",
      status: "canon",
      summary: "The Moonkeepers descend into the roots and settle the Moonstone Hollow.",
      tags: ["moonkeepers", "era", "founding"],
      content: `# The Founding of the Hollow

In the twelfth year, the [[moonkeepers]] followed a moonstone glow down the
[[tunnel-network]] and founded the [[moonstone-hollow]] as their eternal home.`,
      related: [
        { to: "moonkeepers", kind: "concerns" },
        { to: "moonstone-hollow", kind: "concerns" },
      ],
      timeline: { era: "The First Age", year: 12, order: 2 },
    }),

    page({
      title: "Canopy — Colour Study",
      id: "art-canopy",
      category: "concept-art",
      status: "draft",
      summary: "Early palette exploration for the high boughs at golden hour.",
      tags: ["art", "palette", "canopy"],
      content: `# Canopy — Colour Study

A draft palette for the **Canopy** reach of [[everbough]]: warm amber light
filtered through green, deep shadow pockets, dust motes in every sunbeam.

*Placeholder — art to be attached.*`,
      related: [{ to: "everbough", kind: "depicts" }],
    }),
  ];
}
