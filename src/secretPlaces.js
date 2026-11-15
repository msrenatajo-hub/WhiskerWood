// ------------------------------------------------------------
//  🗝️ EVEN MORE SECRET PLACES — nineteen hidden doors to nineteen hidden
//  rooms, tucked all over the land. Each one has a way in that you have to
//  NOTICE (hold F at something odd), or a time it only appears (night, noon,
//  dusk), or a little trick (knock three times, spin the globe, play the
//  doors in the right order). Inside: a room of its own, and a treasure.
//
//  This file is the data + the 3D bits. secrets.js places the entrances and
//  handles getting in and out; questZones.js builds the rooms.
// ------------------------------------------------------------
import * as THREE from "three";
import { glowTexture } from "./phase2.js";
import { MOUNT_BUILDERS } from "./mountModels.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const B = (c) => new THREE.MeshBasicMaterial({ color: c });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

// how you get in:
//   look   — hold F at the odd thing first (it reveals the way), then E
//   e      — just E (but only when `when` is right)
//   walk   — walk into it (only when `when` is right)
//   knock  — E three times, quickly
//   spin   — E three times (spin it round)
//   tune   — play `tune` on your flute nearby, then E
//   puzzle — three doors: E them in the order the clue stone shows
// when: night · noon · dusk · morning (or always)
// at: forest → { from: "den" | "school", dx, dz } · cities → { dx, dz } from where you arrive
//     (or { ring: [deg, r] } in Frostpine) · den / castlehall → fixed spots
export const PLACES = [
  { id: "p_painting", where: "forest", at: { from: "den", dx: 10, dz: 48 }, entrance: "easel", kind: "look", room: "pr_paint",
    name: "Into the Painting", icon: "🖼️", hint: "An easel stands alone in a sunny clearing. The paint never seems to dry…",
    rumour: "“There's a painting on an easel, out in the woods, all on its own. I swear the clouds in it MOVE.”",
    look: "🖼️ You look closely at the painting… the little painted river is FLOWING. You could step right in! (E)",
    label: "step INTO the painting 🖼️", arrive: "🖼️ You step into the painting — everything is brushstrokes and bright, wet colour!",
    key: ["paintbrush", "🖌️", "The Painter's Magic Brush", "luck", 0.08], coins: 70,
    theme: { r: 14, floor: 0x8ad86a, wall: 0x9ad8ff, light: 0xfff0c0, deco: "paint", bg: 0x9ad8ff } },
  { id: "p_well", where: "forest", at: { from: "school", dx: 45, dz: 12 }, entrance: "well", kind: "look", room: "pr_well",
    name: "The Whispering Well", icon: "🪣", hint: "An old stone well east of the school. Lean over and listen…",
    rumour: "“The old well past the school whispers. Lean in close and LISTEN, they say.”",
    look: "🪣 You lean over and listen… “come down… come down…” — and there are iron rungs going down the inside! (E)",
    label: "climb down inside the whispering well 🪣", arrive: "🪣 At the bottom of the well: a dry, echoing cave full of wishing-coins!",
    key: ["wishcoin", "🪙", "The First Wishing Coin", "luck", 0.1], coins: 90,
    theme: { r: 9, floor: 0x6a6a72, wall: 0x4a4a52, light: 0x9fd8ff, deco: "well", bg: 0x20242a } },
  { id: "p_treehouse", where: "forest", at: { from: "den", dx: 75, dz: 5 }, entrance: "bigtree", kind: "look", room: "pr_clouds",
    name: "The Treehouse Above the Clouds", icon: "☁️", hint: "Far east of your cottage, one tree is taller than all the rest. Is that a rope?",
    rumour: "“Somebody lives at the top of the tallest tree. I've seen a rope ladder — but only up close.”",
    look: "☁️ Behind the leaves… a ROPE LADDER, going up and up and up! (E to climb)",
    label: "climb the rope ladder up into the clouds ☁️", arrive: "☁️ Up, up, up — through the clouds — to a little treehouse floating on top of them!",
    key: ["cloudpillow", "☁️", "A Pillow Made of Cloud", "heal", 0.1], coins: 80,
    theme: { r: 12, floor: 0xffffff, wall: null, light: 0xfff4d8, deco: "clouds", bg: 0x9ad0ff } },
  { id: "p_owllib", where: "forest", at: { from: "den", dx: -55, dz: 50 }, entrance: "owltree", kind: "e", when: "night", room: "pr_owls",
    name: "The Owls' Night Library", icon: "🦉", hint: "Far south-west of your cottage, an old tree glows — but only at NIGHT.",
    rumour: "“The owls keep a library. Open all night, closed all day. Look for the glowing tree.”",
    label: "climb into the glowing owl-hollow 🦉", arrive: "🦉 A library, inside the tree! Owls in spectacles look up from their books. “Shhh!”",
    key: ["owlspecs", "👓", "Tiny Owl Spectacles", "luck", 0.08], coins: 80,
    theme: { r: 10, floor: 0x5a3a22, wall: 0x4a3018, light: 0xffc870, deco: "owls", bg: 0x1a1008 } },
  { id: "p_moongarden", where: "forest", at: { from: "den", dx: 25, dz: 70 }, entrance: "stones", kind: "walk", when: "night", room: "pr_moon",
    name: "The Moon Garden", icon: "🌙", hint: "A ring of white stones far south of your cottage. Stand in the middle at NIGHT.",
    rumour: "“At night, step into the middle of the white stones. Just try it.”",
    arrive: "🌙 The stones glow — and you're standing in a silver garden where the flowers only bloom by moonlight!",
    key: ["moonbloom", "🌸", "A Moonbloom That Never Fades", "air", 0.1], coins: 90,
    theme: { r: 14, floor: 0x2a3a5a, wall: null, light: 0xd8e4ff, deco: "moon", bg: 0x0a1028 } },
  { id: "p_fairymarket", where: "forest", at: { from: "den", dx: -65, dz: -35 }, entrance: "mushrooms", kind: "walk", when: "dusk", room: "pr_fairy",
    name: "The Fairy Market", icon: "🧚", hint: "A ring of mushrooms far west of your cottage. At DUSK, the ring lights up…",
    rumour: "“When the sun goes down, the mushroom ring out west lights up. Walk in. Go on.”",
    arrive: "🧚 You step into the glowing ring — and you're in a tiny bustling market lit by fireflies!",
    key: ["fairybell", "🔔", "A Fairy's Silver Bell", "jump", 0.06], coins: 100,
    theme: { r: 13, floor: 0x3a5a3a, wall: null, light: 0xffb8f0, deco: "fairy", bg: 0x1a1030 } },
  { id: "p_glowworm", where: "forest", at: { from: "den", dx: 70, dz: -65 }, entrance: "burrow", kind: "look", room: "pr_glow",
    name: "The Glow-Worm Tunnels", icon: "✨", hint: "Far north-east, a dark burrow under some roots. Is something glowing in there?",
    rumour: "“There's a burrow up north-east that glows green inside. Glow-worms, all the way down.”",
    look: "✨ Deep in the burrow… tiny green lights, thousands of them! It goes on and on. (E to crawl in)",
    label: "crawl into the glowing burrow ✨", arrive: "✨ The tunnel ceiling is covered in glow-worms, like a sky full of green stars.",
    key: ["glowjar", "🫙", "A Jar of Glow-Worm Light", "warm", 0.3], coins: 70,
    theme: { r: 11, floor: 0x3a2a1a, wall: 0x2a1a10, light: 0x9fffa0, deco: "glow", bg: 0x050a05 } },
  { id: "p_puzzle", where: "forest", at: { from: "school", dx: -55, dz: -35 }, entrance: "doors", kind: "puzzle", room: "pr_puzzle",
    name: "The Puzzle Doors", icon: "🧩", hint: "Three stone doors stand in old ruins north-west of the school. A carved stone tells you the order.",
    rumour: "“The three stone doors in the ruins? Read the stone first. Sun, then moon, then star, or was it…”",
    label: "", arrive: "🧩 The last door grinds open onto a hidden vault, untouched for a hundred years!",
    key: ["puzzlecube", "🧩", "The Ancient Puzzle Box", "luck", 0.1], coins: 120,
    theme: { r: 11, floor: 0x8a8070, wall: 0x6a6050, light: 0xffe0a0, deco: "puzzle", bg: 0x1a1810 } },
  { id: "p_cellar", where: "den", entrance: "littledoor", kind: "e", need: "candle", room: "pr_cellar",
    name: "The Locked Door in Your Cottage", icon: "🗝️", hint: "There's a tiny locked door in your own cottage wall. Its keyhole is shaped like a candle flame…",
    rumour: "“Have you ever looked properly at your OWN house? Every old cottage has one locked door.”",
    label: "open the tiny door with your Seeker's Candle 🗝️", arrive: "🗝️ The little door opens onto a cellar you never knew you had — the old owner's things are still here!",
    key: ["grannylocket", "📿", "The Old Owner's Locket", "heal", 0.1], coins: 80,
    theme: { r: 8, floor: 0x6a5a4a, wall: 0x5a4a3a, light: 0xffd8a0, deco: "cellar", bg: 0x1a120a } },
  { id: "p_castle", where: "castlehall", entrance: "torch", kind: "look", room: "pr_dungeon",
    name: "The Castle's Secret Passage", icon: "🏰", hint: "In your Great Hall, one torch bracket hangs a little crooked…",
    rumour: "“Every castle has a secret passage. Look at the torches. One of them's not like the others.”",
    look: "🏰 This torch bracket is crooked… and it MOVES. It's a lever! (E to pull it)",
    label: "pull the crooked torch 🏰", arrive: "🏰 The wall swings round! A spiral stair leads down to a forgotten dungeon vault.",
    key: ["castlekey", "🗝️", "The Castle's Iron Key", "jump", 0.06], coins: 150,
    theme: { r: 11, floor: 0x5a5a62, wall: 0x4a4a52, light: 0xffa850, deco: "dungeon", bg: 0x0a0a10 } },
  { id: "p_clocktower", where: "golden", at: { dx: -20, dz: -18 }, entrance: "clock", kind: "e", when: "noon", room: "pr_clock",
    name: "The Clocktower's Secret Room", icon: "🕰️", hint: "Golden Hollow's little clocktower. At exactly NOON, a door opens under the clock.",
    rumour: "“When both hands of the old clock point straight up, a little door opens. Only at noon!”",
    label: "slip through the noon door in the clocktower 🕰️", arrive: "🕰️ Inside the clocktower: gears as big as wagon wheels, turning, ticking…",
    key: ["pocketwatch", "⌚", "The Clockmaker's Pocket Watch", "sprint", 0.06], coins: 90,
    theme: { r: 9, floor: 0x8a6a42, wall: 0x6a4a2a, light: 0xffe0a0, deco: "clock", bg: 0x1a1008 } },
  { id: "p_undermarket", where: "golden", at: { dx: 22, dz: 14 }, entrance: "grate", kind: "knock", room: "pr_market",
    name: "The Underground Market", icon: "🛒", hint: "An iron grate in Golden Hollow's street. Knock on it three times, quickly.",
    rumour: "“Knock three times on the grate in the street. Quick! Knock-knock-knock.”",
    label: "knock on the iron grate 🛒", arrive: "🛒 The grate swings open and you climb down into a secret market, lit by lanterns!",
    key: ["undercoin", "🪙", "A Coin From the Under-Market", "luck", 0.08], coins: 100,
    theme: { r: 13, floor: 0x5a4a3a, wall: 0x3a2a1a, light: 0xffb860, deco: "market", bg: 0x120a05 } },
  { id: "p_grotto", where: "reedmere", at: { dx: -26, dz: 20 }, entrance: "planks", kind: "look", room: "pr_grotto",
    name: "The Grotto Under the Docks", icon: "⚓", hint: "Some old planks in Reedmere have a gap between them. Something is glittering underneath.",
    rumour: "“Under the old boardwalk there's a gap you can squeeze through. Mind the crabs.”",
    look: "⚓ Through the gap in the planks — water, glittering, and a little cave underneath! (E to squeeze down)",
    label: "squeeze down through the planks ⚓", arrive: "⚓ A sea-grotto under the docks: glittering water, shells, and an old smugglers' chest!",
    key: ["smugglerhook", "🪝", "The Smuggler's Brass Hook", "fish", 0.1], coins: 90,
    theme: { r: 11, floor: 0x3a5a6a, wall: 0x2a4a5a, light: 0x8ae8ff, deco: "grotto", bg: 0x05202a } },
  { id: "p_lighthouse", where: "reedmere", at: { dx: -44, dz: -6 }, entrance: "lighthouse", kind: "look", room: "pr_lighthouse",
    name: "The Lost Lighthouse", icon: "🗼", hint: "An old ruined lighthouse stands far out on Reedmere's west side. Its door is nailed shut… or is it?",
    rumour: "“The old lighthouse's been shut for fifty years. But the light came on last night. I saw it.”",
    look: "🗼 The nails in the door are fake — just painted on! It swings open at a touch. (E)",
    label: "push open the lighthouse door 🗼", arrive: "🗼 Inside the lost lighthouse: the old keeper's room, just as they left it — and the great lamp, still glowing.",
    key: ["lampglass", "🔆", "The Lighthouse Lens", "fish", 0.08], coins: 90,
    theme: { r: 8, floor: 0x7a6a5a, wall: 0xe8e0d0, light: 0xfff0a0, deco: "lighthouse", bg: 0x1a1a20 } },
  { id: "p_shell", where: "reedmere", at: { dx: 34, dz: 30 }, entrance: "shell", kind: "look", room: "pr_shell",
    name: "The Shell That Leads Somewhere", icon: "🐚", hint: "A HUGE spiral shell lies on Reedmere's shore. Put your ear to it…",
    rumour: "“Put your ear to the giant shell on the beach. You hear the sea… and something singing.”",
    look: "🐚 You put your ear to the shell — waves, and someone SINGING, deep inside. It's big enough to crawl into! (E)",
    label: "crawl into the giant shell 🐚", arrive: "🐚 You crawl round and round the spiral… and come out in a pearly room under the sea!",
    key: ["singingpearl", "🫧", "The Singing Pearl", "air", 0.15], coins: 80,
    theme: { r: 11, floor: 0xf0d8e0, wall: 0xe8c8d8, light: 0xffe8f8, deco: "shell", bg: 0x203a5a } },
  { id: "p_icepalace", where: "frostpine", at: { ring: [290, 38] }, entrance: "iceplate", kind: "look", room: "pr_icepalace",
    name: "The Palace Under the Ice", icon: "❄️", hint: "A patch of perfectly clear ice in Frostpine. Look DOWN through it…",
    rumour: "“There's clear ice north of the square. Look down through it. There are towers down there!”",
    look: "❄️ Through the clear ice… TOWERS! A whole palace, down below! There's a hole in the ice by your paw. (E)",
    label: "slide down through the hole in the ice ❄️", arrive: "❄️ You slide down, down, down — into a glittering palace of ice under the frozen lake!",
    key: ["icecrown", "👑", "The Little Ice Crown", "warm", 0.4], coins: 120,
    theme: { r: 14, floor: 0xd8f0ff, wall: 0xa8d8f8, light: 0xd8f4ff, deco: "icepalace", bg: 0x8ac8f0 } },
  { id: "p_hoard", where: "frostpine", at: { ring: [150, 103], hill: true }, entrance: "cave", kind: "look", room: "pr_hoard",
    name: "The Dragon's Hoard", icon: "🐉", hint: "On the hill at Frostpine's south-west edge: a cave with CLAW MARKS round the door.",
    rumour: "“Claw marks on the cave up the south-west hill. Big ones. Whatever made them… liked SHINY things.”",
    look: "🐉 Huge claw marks… and a glint of GOLD deep in the cave. Something big lived here — long ago, you hope. (E)",
    label: "creep into the dragon's cave 🐉", arrive: "🐉 GOLD! Heaps and heaps of it — an old dragon's hoard, and the dragon long gone…",
    key: ["dragonscale", "🐲", "An Old Dragon's Golden Scale", "jump", 0.08], coins: 200,
    theme: { r: 13, floor: 0x5a4a3a, wall: 0x4a3a2a, light: 0xffc040, deco: "hoard", bg: 0x1a0e05 } },
  { id: "p_maproom", where: "silverveil", at: { dx: 14, dz: -12 }, entrance: "globe", kind: "spin", room: "pr_maps",
    name: "The Map Room", icon: "🗺️", hint: "A big old globe on a stand in Silverveil. Give it a good spin… or three.",
    rumour: "“Spin the old globe three times. Then watch the floor.”",
    label: "spin the old globe 🌍", arrive: "🗺️ The floor slides back! Steps lead down to a round room covered in maps — of places that aren't on ANY map.",
    key: ["oldmap", "🗺️", "A Map of Places Not on Any Map", "luck", 0.1], coins: 100,
    theme: { r: 10, floor: 0x7a5a3a, wall: 0xd8c8a0, light: 0xffe8b0, deco: "maps", bg: 0x1a1208 } },
  { id: "p_mirrormaze", where: "silverveil", at: { dx: -16, dz: 10 }, entrance: "mirror", kind: "look", room: "pr_mirrors",
    name: "The Mirror Maze", icon: "🪞", hint: "A tall mirror stands alone in Silverveil. Look closely at your reflection…",
    rumour: "“The tall mirror in Silverveil. Your reflection waves at you. YOU didn't wave.”",
    look: "🪞 Your reflection… WAVES at you. And steps aside, to let you through! (E)",
    label: "step through the mirror 🪞", arrive: "🪞 Mirrors, mirrors everywhere — a hundred of you, all looking around!",
    key: ["handmirror", "🪞", "The Truth-Telling Hand Mirror", "luck", 0.08], coins: 90,
    theme: { r: 12, floor: 0xd8d8e8, wall: 0xb8b8d0, light: 0xf0f0ff, deco: "mirrors", bg: 0x2a2a3a } },
];
// 🦌 THE SECRET REALMS of the great riding animals — find the way in, then
//    earn the animal's trust (bring its favourite food, one visit at a time)
//    and it will let you ride it. (animals.js runs the trust part.)
PLACES.push(
  { id: "r_stag", when: "night", hidden: true, where: "silverveil", at: { c: true, dx: 30, dz: -24 }, entrance: "bircharch", kind: "look", room: "rr_glade", mount: "stag",
    name: "The Moonlit Glade", icon: "🦌", hint: "Two white birches in Silverveil lean together like an archway. Through it, it's always moonlight…",
    rumour: "“There's a glade in Silverveil where it's always night. The White Stag lives there — if you're patient.”",
    look: "🦌 Between the two white birches… moonlight, in the middle of the day. A path runs through. (E)",
    label: "step through the birch archway 🌙", arrive: "🌙 A silver glade under a sky full of stars. At the far side, the WHITE STAG lifts its head and watches you.",
    key: ["stagantler", "🦌", "A Shed Antler of the White Stag", "jump", 0.06], coins: 60,
    theme: { r: 20, floor: 0x2a3a4a, wall: null, light: 0xc8d8ff, deco: "glade", bg: 0x0a1020 } },
  { id: "r_eagle", when: "morning", hidden: true, where: "frostpine", at: { ring: [95, 104], hill: true }, entrance: "rope", kind: "look", room: "rr_eyrie", mount: "eagle",
    name: "The Eagle's Eyrie", icon: "🦅", hint: "On Frostpine's southern hill, an old knotted rope hangs down the rock. Where does it go?",
    rumour: "“There's a rope on the southern hill. Climb it, and you'll be higher than the clouds — where the Great Eagle nests.”",
    look: "🦅 An old knotted rope, worn smooth by many paws. It goes up… and up… into the clouds. (E to climb)",
    label: "climb the knotted rope into the clouds 🦅", arrive: "🦅 The top of the world: a windswept peak above the clouds — and a NEST as big as a house. The Great Eagle turns its golden eye on you.",
    key: ["eaglefeather", "🪶", "A Golden Eagle Feather", "air", 0.12], coins: 60,
    theme: { r: 18, floor: 0x8a8070, wall: null, light: 0xfff0d8, deco: "eyrie", bg: 0x8ac0f0 } },
  { id: "r_goat", when: "dusk", hidden: true, where: "frostpine", at: { ring: [185, 104], hill: true }, entrance: "crevice", kind: "look", room: "rr_crag", mount: "goat",
    name: "Goat Crag", icon: "🐐", hint: "A narrow crack in the western hill of Frostpine. Something with hooves has been going in and out…",
    rumour: "“Hoofprints going INTO the western rocks. Mountain goats, I reckon. Where they go, nobody else can follow.”",
    look: "🐐 Hoofprints lead into the crack in the rock — just wide enough for a mouse. (E to squeeze through)",
    label: "squeeze through the crack in the rock 🐐", arrive: "🐐 A hidden mountain valley of sheer crags and tiny ledges — and goats leaping up them as if they were stairs.",
    key: ["goatbell", "🔔", "An Old Goatherd's Bell", "jump", 0.06], coins: 60,
    theme: { r: 18, floor: 0x7a7a6a, wall: null, light: 0xf0f0ff, deco: "crag", bg: 0xb8c8d8 } },
  { id: "r_mustang", when: "morning", hidden: true, where: "golden", at: { c: true, dx: -50, dz: 40 }, entrance: "hedgegap", kind: "look", room: "rr_plains", mount: "mustang",
    name: "The Hidden Plains", icon: "🐎", hint: "Behind Golden Hollow's farthest hedgerow, the grass bends as if something big runs past…",
    rumour: "“Wild horses! I heard them — thundering, behind the last hedge. But there's nothing behind it but more hedge… is there?”",
    look: "🐎 There's a gap in the hedge, hidden by the brambles — and beyond it, endless grass. (E to push through)",
    label: "push through the gap in the hedge 🐎", arrive: "🐎 Golden plains roll away to the sky. A herd of WILD MUSTANGS thunders past — and one stops to look at you.",
    key: ["horseshoe", "🧲", "A Lucky Wild Horseshoe", "luck", 0.06], coins: 60,
    theme: { r: 22, floor: 0xc8b060, wall: null, light: 0xffe8b8, deco: "plains", bg: 0xa8d0f0 } },
  { id: "r_bison", when: "noon", hidden: true, where: "golden", at: { c: true, dx: 46, dz: -46 }, entrance: "camp", kind: "look", room: "rr_nomads", mount: "bison",
    name: "The Nomads' Camp", icon: "🦬", hint: "An old painted tent-flap stands alone in Golden Hollow's far field, flapping in no wind at all…",
    rumour: "“The bison nomads only stop in Golden Hollow when the harvest is in. Look for the painted tent-flap.”",
    look: "🦬 The painted tent-flap moves on its own — and through it you hear drums, and the snort of something HUGE. (E)",
    label: "lift the painted tent-flap 🦬", arrive: "🦬 A nomads' camp on the open steppe: smoke from the fires, painted tents — and great shaggy BISON grazing all around.",
    key: ["nomaddrum", "🥁", "A Nomad's Hand-Drum", "warm", 0.3], coins: 60,
    theme: { r: 20, floor: 0x9a8a5a, wall: null, light: 0xffd8a0, deco: "nomads", bg: 0xd8b880 } },
  { id: "r_turtle", when: "night", hidden: true, where: "reedmere", at: { c: true, dx: 40, dz: -34 }, entrance: "seacave", kind: "look", room: "rr_cove", mount: "turtle",
    name: "Turtle Cove", icon: "🐢", hint: "A dark hollow between the rocks on Reedmere's shore. At low tide, there's a passage…",
    rumour: "“There's a cove where the giant turtles come ashore. You get there through the rocks, if you're small enough.”",
    look: "🐢 Behind the rocks: a low tunnel, wet with sea spray, and the sound of waves on the other side. (E)",
    label: "crawl through the sea-cave 🐢", arrive: "🐢 A secret cove of white sand and clear blue water — and an ANCIENT SEA TURTLE resting on the beach, as big as a boat.",
    key: ["turtleshell", "🐚", "A Turtle-Shell Comb", "fish", 0.08], coins: 60,
    theme: { r: 20, floor: 0xf0e8d0, wall: null, light: 0xfff8e8, deco: "cove", bg: 0x7ac8e8 } },
);
// 🐀 the Secret Trader's lair — a RAT as big as a house who sells secrets (animals.js runs him)
PLACES.push({ id: "r_lair", where: "silverveil", at: { c: true, dx: -34, dz: -30 }, entrance: "rathole", kind: "look", room: "rr_lair",
  name: "The Secret Trader's Lair", icon: "🐀", hint: "Low in an old wall in Silverveil there's a rat-hole — far too big for any ordinary rat…",
  rumour: "“They say there's a RAT as big as a house who trades in secrets. Knows where every wild creature in the land is hiding. His door's a hole in an old wall in Silverveil — but his secrets don't come cheap.”",
  look: "🐀 A rat-hole… but HUGE, gnawed smooth, and it smells of incense and old coins. Something very large comes and goes through here. (E)",
  label: "crawl into the giant rat-hole 🐀", arrive: "🐀 Lanterns, velvet, heaps of curious treasures… and on a mountain of cushions lies a RAT as big as a house. His whiskers twitch. One gold-ringed eye opens. “A visitor. How… interesting.”",
  key: ["traderbell", "🔔", "The Secret Trader's Brass Bell", "luck", 0.08], coins: 40,
  theme: { r: 14, floor: 0x3a2030, wall: 0x2a1828, light: 0xffb860, deco: "lair", bg: 0x120810 } });
export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

// ---------------------------------------------------------------- the way in (built in the world)
// returns { g, focus: {x,y,z} (where you look closely), r (how solid it is), parts }
export function buildEntrance(type, x, y, z, faceY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = faceY;
  const parts = {};
  let fy = 1, r = 1;
  if (type === "easel") {
    for (const sx of [-0.5, 0.5]) {
      const leg = mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), M(0x8a6a42), sx, 1.1, 0);
      leg.rotation.z = -sx * 0.2;
      g.add(leg);
    }
    g.add(mesh(new THREE.BoxGeometry(1.5, 1.1, 0.06), M(0xf8f0e0), 0, 1.6, 0.08));
    const pic = mesh(new THREE.PlaneGeometry(1.35, 0.95), B(0x6ac8ff), 0, 1.6, 0.12);
    g.add(pic);
    const river = mesh(new THREE.PlaneGeometry(1.35, 0.25), B(0x3a8ad8), 0, 1.35, 0.125);
    const hill = mesh(new THREE.CircleGeometry(0.45, 12, 0, Math.PI), B(0x6ac85a), -0.3, 1.38, 0.124);
    g.add(river, hill);
    parts.river = river;
    fy = 1.6; r = 0.6;
  } else if (type === "well") {
    g.add(mesh(new THREE.CylinderGeometry(1, 1.1, 1, 12, 1, true), M(0x8a8a90, { side: THREE.DoubleSide }), 0, 0.5, 0));
    g.add(mesh(new THREE.CircleGeometry(0.95, 12), B(0x05070a), 0, 0.3, 0)).children;
    g.children[g.children.length - 1].rotation.x = -Math.PI / 2;
    for (const sx of [-0.9, 0.9]) g.add(mesh(new THREE.BoxGeometry(0.12, 2, 0.12), M(0x6a4a2a), sx, 1.4, 0));
    g.add(mesh(new THREE.ConeGeometry(1.5, 0.8, 4), M(0x7a4a2a), 0, 2.7, 0));
    g.children[g.children.length - 1].rotation.y = Math.PI / 4;
    fy = 0.9; r = 1.2;
  } else if (type === "bigtree") {
    g.add(mesh(new THREE.CylinderGeometry(1.4, 2, 22, 10), M(0x5a3a22), 0, 11, 0));
    for (let k = 0; k < 5; k++) {
      const c = mesh(new THREE.SphereGeometry(4 - k * 0.4, 9, 7), M(0x3a6a2a), Math.sin(k * 2) * 1.5, 14 + k * 3, Math.cos(k * 2) * 1.5);
      g.add(c);
    }
    // the rope ladder, half hidden behind the trunk
    for (const sx of [-0.25, 0.25]) g.add(mesh(new THREE.BoxGeometry(0.05, 6, 0.05), M(0xc8a870), sx + 1.2, 3, 1.75));
    for (let k = 0; k < 10; k++) g.add(mesh(new THREE.BoxGeometry(0.55, 0.05, 0.08), M(0x8a6a42), 1.2, 0.4 + k * 0.6, 1.75));
    fy = 1.4; r = 2.1;
  } else if (type === "owltree") {
    g.add(mesh(new THREE.CylinderGeometry(1.1, 1.5, 7, 9), M(0x4a3420), 0, 3.5, 0));
    g.add(mesh(new THREE.SphereGeometry(3, 9, 7), M(0x2a4a22), 0, 7.5, 0));
    const hole = mesh(new THREE.CircleGeometry(0.5, 12), B(0xffc870), 0, 1.6, 1.32);
    g.add(hole);
    const halo = glow(0xffb850, 3, 0.7);
    halo.position.set(0, 1.6, 1.6);
    g.add(halo);
    parts.night = [hole, halo];
    fy = 1.6; r = 1.5;
  } else if (type === "stones") {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const st = mesh(new THREE.BoxGeometry(0.6, 1.4 + (k % 3) * 0.3, 0.4), M(0xe8e8f0), Math.cos(a) * 3.2, 0.7, Math.sin(a) * 3.2);
      st.rotation.y = -a;
      g.add(st);
    }
    const shine = glow(0xd8e4ff, 7, 0);
    shine.position.y = 0.5;
    g.add(shine);
    parts.shine = shine;
    fy = 0.5; r = 0;
  } else if (type === "mushrooms") {
    const caps = [];
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2;
      const stalk = mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6), M(0xf0e8d8), Math.cos(a) * 2.6, 0.25, Math.sin(a) * 2.6);
      const cap = mesh(new THREE.SphereGeometry(0.35, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd85a8a, { emissive: 0xff70c0, emissiveIntensity: 0 }), Math.cos(a) * 2.6, 0.48, Math.sin(a) * 2.6);
      g.add(stalk, cap);
      caps.push(cap);
    }
    parts.caps = caps;
    fy = 0.4; r = 0;
  } else if (type === "burrow") {
    const mound = mesh(new THREE.SphereGeometry(2, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6a5a3a), 0, 0, 0);
    mound.scale.set(1.2, 0.8, 1);
    g.add(mound);
    g.add(mesh(new THREE.CircleGeometry(0.55, 12), B(0x0a1a08), 0, 0.5, 1.98));
    for (let k = 0; k < 6; k++) {
      const root = mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 5), M(0x4a3420), -0.8 + k * 0.32, 1.1, 1.75);
      root.rotation.z = (k % 2 ? 1 : -1) * 0.4;
      g.add(root);
    }
    const gl = glow(0x9fffa0, 0.6, 0.6);
    gl.position.set(0, 0.5, 1.9);
    g.add(gl);
    fy = 0.5; r = 1.9;
  } else if (type === "doors") {
    // three stone doors in a row, and the clue stone
    parts.doors = [];
    ["☀️", "🌙", "⭐"].forEach((sym, k) => {
      const dx = (k - 1) * 3;
      g.add(mesh(new THREE.BoxGeometry(2, 3.2, 0.5), M(0x8a8070), dx, 1.6, 0));
      const slab = mesh(new THREE.BoxGeometry(1.3, 2.4, 0.2), M(0x5a5048), dx, 1.2, 0.3);
      g.add(slab);
      const mark = mesh(new THREE.CircleGeometry(0.25, k === 0 ? 12 : k === 1 ? 5 : 4), B([0xffd040, 0xd8e4ff, 0xfff0a0][k]), dx, 2.1, 0.41);
      g.add(mark);
      parts.doors.push({ dx, slab, sym });
    });
    g.add(mesh(new THREE.BoxGeometry(1.2, 1, 0.5), M(0x9a9080), 0, 0.5, 3));
    fy = 1.2; r = 0;
  } else if (type === "littledoor") {
    g.add(mesh(new THREE.BoxGeometry(0.75, 1, 0.08), M(0x6a3a1a), 0, 0.5, 0));
    g.add(mesh(new THREE.TorusGeometry(0.38, 0.05, 6, 14, Math.PI), M(0x4a2a10), 0, 1, 0));
    g.add(mesh(new THREE.CircleGeometry(0.06, 8), B(0x101010), 0.22, 0.5, 0.05));
    const kh = mesh(new THREE.ConeGeometry(0.05, 0.14, 6), B(0xffb040), 0.22, 0.62, 0.05);
    g.add(kh);
    fy = 0.6; r = 0;
  } else if (type === "torch") {
    const arm = mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), M(0x3a3a3a), 0, 2.3, 0.25);
    arm.rotation.z = 0.35; // (crooked!)
    g.add(arm);
    const fire = glow(0xffa040, 1.4, 0.9);
    fire.position.set(-0.12, 2.8, 0.3);
    g.add(fire);
    fy = 2.4; r = 0;
  } else if (type === "clock") {
    g.add(mesh(new THREE.BoxGeometry(2.6, 7, 2.6), M(0xc8a878), 0, 3.5, 0));
    g.add(mesh(new THREE.ConeGeometry(2.2, 2, 4), M(0x8a4a2a), 0, 8, 0));
    g.children[g.children.length - 1].rotation.y = Math.PI / 4;
    g.add(mesh(new THREE.CircleGeometry(0.9, 18), B(0xfff8e8), 0, 5.6, 1.31));
    const hh = mesh(new THREE.BoxGeometry(0.08, 0.5, 0.02), B(0x202020), 0, 5.8, 1.33);
    const mh = mesh(new THREE.BoxGeometry(0.05, 0.75, 0.02), B(0x202020), 0, 5.9, 1.34);
    hh.geometry.translate(0, 0.2, 0);
    mh.geometry.translate(0, 0.3, 0);
    hh.position.y = mh.position.y = 5.6;
    g.add(hh, mh);
    const door = mesh(new THREE.PlaneGeometry(1, 1.8), B(0x1a1008), 0, 0.9, 1.31);
    g.add(door);
    const shut = mesh(new THREE.BoxGeometry(1.05, 1.85, 0.08), M(0x7a5a3a), 0, 0.92, 1.33);
    g.add(shut);
    parts.hands = [hh, mh];
    parts.shut = shut;
    fy = 0.9; r = 2;
  } else if (type === "grate") {
    const gr = mesh(new THREE.BoxGeometry(1.4, 0.06, 1), M(0x3a3a40, { metalness: 0.5 }), 0, 0.04, 0);
    g.add(gr);
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.BoxGeometry(0.05, 0.07, 0.9), B(0x05050a), -0.5 + k * 0.25, 0.05, 0));
    fy = 0.1; r = 0;
  } else if (type === "planks") {
    for (let k = 0; k < 6; k++) if (k !== 3) g.add(mesh(new THREE.BoxGeometry(0.45, 0.1, 3), M(0x8a6a4a), -1.3 + k * 0.5, 0.15, 0));
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.02, 3), B(0x05202a), 0.2, 0.06, 0));
    const gl = glow(0x8ae8ff, 0.5, 0.5);
    gl.position.set(0.2, 0.1, 0.3);
    g.add(gl);
    for (const sx of [-1.4, 1.4]) for (const sz of [-1.4, 1.4]) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6), M(0x5a4a3a), sx, 0, sz));
    fy = 0.15; r = 0;
  } else if (type === "lighthouse") {
    g.add(mesh(new THREE.CylinderGeometry(1.6, 2.4, 10, 10), M(0xe8e0d0), 0, 5, 0));
    for (let k = 0; k < 3; k++) g.add(mesh(new THREE.CylinderGeometry(1.65 + (2 - k) * 0.25, 1.7 + (2 - k) * 0.25, 0.9, 10), M(0xb83a3a), 0, 1.5 + k * 3, 0));
    g.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 8), M(0x8ac8d8, { transparent: true, opacity: 0.6 }), 0, 10.7, 0));
    g.add(mesh(new THREE.ConeGeometry(1.5, 1.2, 8), M(0x3a3a3a), 0, 12, 0));
    const lamp = glow(0xfff0a0, 4, 0.5);
    lamp.position.y = 10.7;
    g.add(lamp);
    g.add(mesh(new THREE.PlaneGeometry(1.1, 1.9), M(0x5a3a22), 0, 0.95, 2.36));
    for (const sy of [0.5, 1.4]) g.add(mesh(new THREE.BoxGeometry(1.3, 0.12, 0.05), M(0x8a6a42), 0, sy, 2.4));
    fy = 1; r = 2.5;
  } else if (type === "shell") {
    const sh = mesh(new THREE.ConeGeometry(1.6, 3.4, 12), M(0xf0c8b8), 0, 1.2, 0);
    sh.rotation.z = Math.PI / 2;
    g.add(sh);
    for (let k = 0; k < 4; k++) {
      const band = mesh(new THREE.TorusGeometry(1.5 - k * 0.35, 0.08, 6, 14), M(0xd89888), -1.2 + k * 0.7, 1.2, 0);
      band.rotation.y = Math.PI / 2;
      g.add(band);
    }
    const mouth = mesh(new THREE.CircleGeometry(1.2, 14), B(0x3a1a2a), -1.72, 1.2, 0);
    mouth.rotation.y = -Math.PI / 2;
    g.add(mouth);
    fy = 1.2; r = 1.7;
  } else if (type === "iceplate") {
    const plate = mesh(new THREE.CircleGeometry(3, 18), M(0x9ad8ff, { transparent: true, opacity: 0.55 }), 0, 0.04, 0);
    plate.rotation.x = -Math.PI / 2;
    g.add(plate);
    // the palace's towers, tiny and far down
    for (let k = 0; k < 5; k++) {
      const tw = mesh(new THREE.ConeGeometry(0.25, 0.8, 6), B(0x5a8ab8), Math.cos(k * 1.3) * 1.4, 0.02, Math.sin(k * 1.3) * 1.4);
      tw.rotation.x = -Math.PI / 2;
      tw.scale.set(1, 1, 0.02);
      g.add(tw);
    }
    g.add(mesh(new THREE.CircleGeometry(0.5, 12), B(0x0a2a4a), 2.2, 0.05, 0.5));
    g.children[g.children.length - 1].rotation.x = -Math.PI / 2;
    fy = 0.1; r = 0;
  } else if (type === "cave") {
    const rock = mesh(new THREE.SphereGeometry(4, 10, 8), M(0x6a6058), 0, 0, -2);
    rock.scale.set(1.4, 1.1, 1);
    g.add(rock);
    g.add(mesh(new THREE.CircleGeometry(1.5, 14, 0, Math.PI), B(0x0a0604), 0, 0.1, 1.98));
    for (let k = 0; k < 3; k++) {
      const claw = mesh(new THREE.BoxGeometry(0.08, 1.4, 0.05), B(0x2a2018), 2 + k * 0.3, 2, 1.7);
      claw.rotation.z = 0.3;
      g.add(claw);
    }
    const gold = glow(0xffc040, 1.2, 0.5);
    gold.position.set(0, 0.6, 1.6);
    g.add(gold);
    fy = 1; r = 0;
  } else if (type === "globe") {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.2, 8), M(0x6a4a2a), 0, 0.6, 0));
    const ball = mesh(new THREE.SphereGeometry(0.85, 14, 10), M(0x4a8ab8), 0, 2, 0);
    for (let k = 0; k < 4; k++) {
      const land = mesh(new THREE.SphereGeometry(0.3, 6, 5), M(0x8ab85a), Math.cos(k * 1.7) * 0.7, Math.sin(k) * 0.4, Math.sin(k * 1.7) * 0.7);
      land.scale.set(1, 0.7, 0.5);
      ball.add(land);
    }
    ball.rotation.z = 0.4;
    g.add(ball);
    g.add(mesh(new THREE.TorusGeometry(0.95, 0.05, 6, 20), M(0xc8a040, { metalness: 0.5 }), 0, 2, 0));
    const trap = mesh(new THREE.BoxGeometry(1.4, 0.04, 1.4), B(0x1a1008), 0, 0.03, 1.8);
    trap.visible = false;
    g.add(trap);
    parts.ball = ball;
    parts.trap = trap;
    fy = 2; r = 0.7;
  } else if (type === "mirror") {
    g.add(mesh(new THREE.BoxGeometry(1.5, 2.8, 0.12), M(0xc8a040, { metalness: 0.5 }), 0, 1.6, 0));
    const glass = mesh(new THREE.PlaneGeometry(1.25, 2.5), new THREE.MeshStandardMaterial({ color: 0xd8e8f8, metalness: 0.9, roughness: 0.05 }), 0, 1.6, 0.07);
    g.add(glass);
    // a little mouse-shaped shadow in the glass (your "reflection")
    const ref = mesh(new THREE.CircleGeometry(0.3, 10), B(0x8a9aaa), 0, 1, 0.08);
    g.add(ref);
    parts.ref = ref;
    fy = 1.4; r = 0.6;
  }
  if (type === "bircharch") {
    for (const sx of [-1, 1]) {
      const trunk = mesh(new THREE.CylinderGeometry(0.22, 0.3, 5, 7), M(0xf0ece4), sx * 1.2, 2.3, 0);
      trunk.rotation.z = -sx * 0.22;
      g.add(trunk);
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.24, 0.06, 0.32), M(0x2a2a2a), sx * (1.1 - k * 0.12), 0.8 + k * 1, 0.2));
      const top = mesh(new THREE.SphereGeometry(1.4, 8, 6), M(0xd8e8c0), sx * 0.5, 5, 0);
      top.scale.y = 0.6;
      g.add(top);
    }
    const moon = glow(0xc8d8ff, 2.6, 0.5);
    moon.position.y = 2;
    g.add(moon);
    fy = 2; r = 0;
  } else if (type === "rope") {
    const rope = mesh(new THREE.CylinderGeometry(0.06, 0.06, 14, 5), M(0xb8a070), 0, 7, 0);
    g.add(rope);
    for (let k = 0; k < 12; k++) g.add(mesh(new THREE.SphereGeometry(0.11, 6, 4), M(0x9a8058), 0, 0.6 + k * 1.1, 0));
    const rock = mesh(new THREE.DodecahedronGeometry(2.2), M(0x7a7470), 0, 1.4, -2.2);
    g.add(rock);
    fy = 1.2; r = 0;
  } else if (type === "crevice") {
    for (const sx of [-1, 1]) {
      const rock = mesh(new THREE.BoxGeometry(2.6, 5, 3), M(0x6a6660), sx * 1.6, 2.4, -0.6);
      rock.rotation.y = sx * 0.15;
      g.add(rock);
    }
    g.add(mesh(new THREE.PlaneGeometry(0.6, 3.4), B(0x0a0a0c), 0, 1.7, 0.9));
    for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CircleGeometry(0.1, 6), B(0x4a4038), -0.15 + (k % 2) * 0.3, 0.03, 2.2 - k * 0.4));
    g.children.slice(-4).forEach((h) => (h.rotation.x = -Math.PI / 2));
    fy = 1.2; r = 0;
  } else if (type === "hedgegap") {
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      const bush = mesh(new THREE.SphereGeometry(1.2, 8, 6), M(0x3a6a2a), k * 1.5, 1, 0);
      bush.scale.y = 1.2;
      g.add(bush);
    }
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.SphereGeometry(0.35, 6, 4), M(0x5a3a4a), -0.5 + (k % 3) * 0.5, 0.4 + (k > 2 ? 0.6 : 0), 0.3));
    fy = 1; r = 0;
  } else if (type === "camp") {
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), M(0x6a4a2a), -0.8, 1.5, 0), mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), M(0x6a4a2a), 0.8, 1.5, 0));
    const flap = mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshStandardMaterial({ color: 0xb84a2a, side: THREE.DoubleSide, flatShading: true }), 0, 1.4, 0);
    g.add(flap);
    for (let k = 0; k < 3; k++) g.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 0.02), M([0xe8c840, 0x2a2a2a, 0xe8e0d0][k]), 0, 0.6 + k * 0.7, 0.02));
    parts.flap = flap;
    fy = 1.4; r = 0;
  } else if (type === "seacave") {
    const rock = mesh(new THREE.DodecahedronGeometry(2.6), M(0x6a6a70), 0, 1.2, -1);
    rock.scale.set(1.4, 0.9, 1);
    g.add(rock);
    g.add(mesh(new THREE.CircleGeometry(0.8, 12, 0, Math.PI), B(0x05080c), 0, 0.15, 1.5));
    fy = 0.6; r = 0;
  }
  if (type === "rathole") {
    g.add(mesh(new THREE.BoxGeometry(5, 3, 0.8), M(0x8a8478), 0, 1.5, -0.3));
    const hole = mesh(new THREE.CircleGeometry(0.9, 16, 0, Math.PI), B(0x0a0806), 0, 0.05, 0.12);
    g.add(hole);
    for (let k = 0; k < 6; k++) g.add(mesh(new THREE.BoxGeometry(0.12, 0.2, 0.05), M(0x6a6058), Math.cos((k / 5) * Math.PI) * 0.95, 0.05 + Math.sin((k / 5) * Math.PI) * 0.95, 0.15)); // (gnaw marks)
    const scratch = mesh(new THREE.PlaneGeometry(0.06, 0.5), B(0x4a4038), 1.3, 1.2, 0.12);
    scratch.rotation.z = 0.3;
    g.add(scratch);
    fy = 0.6; r = 0;
  }
  const local = new THREE.Vector3(0, fy, type === "easel" ? 0.15 : type === "owltree" ? 1.4 : type === "burrow" ? 1.9 : type === "clock" ? 1.4 : type === "lighthouse" ? 2.4 : type === "cave" ? 2 : 0);
  if (type === "shell") local.set(-1.8, fy, 0);
  if (type === "iceplate") local.set(0, fy, 0);
  if (type === "torch") local.set(0, fy, 0.3);
  if (type === "planks") local.set(0.2, fy, 0);
  if (type === "mirror") local.set(0, fy, 0.2);
  if (type === "doors") local.set(0, fy, 3);
  local.applyAxisAngle(new THREE.Vector3(0, 1, 0), faceY);
  return { g, focus: { x: x + local.x, y: y + local.y, z: z + local.z }, r, parts };
}

// ---------------------------------------------------------------- inside: each room's own look
export function decorPlace(deco, G, R, Z, live) {
  const ring = (n, rad, fn) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.4;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.5) continue; // (keep the doorway clear)
      fn(Math.cos(a) * rad, Math.sin(a) * rad, a, k);
    }
  };
  const solid = (x, z, r) => Z.colliders.push({ x, z, r });
  const sparkles = (n, color, spread, y0, y1, size = 0.5) => {
    const list = [];
    for (let k = 0; k < n; k++) {
      const s = glow(color, size, 0.7);
      s.position.set((Math.random() - 0.5) * spread, y0 + Math.random() * (y1 - y0), (Math.random() - 0.5) * spread);
      G.add(s);
      list.push(s);
    }
    live.push((t) => list.forEach((s, i) => (s.material.opacity = 0.25 + 0.65 * Math.abs(Math.sin(t * 1.5 + i)))));
    return list;
  };
  if (deco === "paint") {
    // a painted world: bright blobby trees, a river of brushstrokes, a big painted sun
    ring(8, R * 0.7, (x, z, a, k) => {
      G.add(mesh(new THREE.CylinderGeometry(0.25, 0.3, 2, 6), B(0x8a5a2a), x, 1, z));
      G.add(mesh(new THREE.SphereGeometry(1.5, 8, 6), B([0x5ad85a, 0xff8ab8, 0xffd84a, 0x8a6aff][k % 4]), x, 2.8, z));
      solid(x, z, 0.6);
    });
    const river = mesh(new THREE.PlaneGeometry(R * 2, 2.2), B(0x3a8ad8), 0, 0.03, -2);
    river.rotation.x = -Math.PI / 2;
    G.add(river);
    G.add(mesh(new THREE.CircleGeometry(2.5, 16), B(0xffe040), -6, 9, -R + 1));
    live.push((t) => (river.material.color.setHSL(0.58, 0.65, 0.5 + Math.sin(t * 2) * 0.06)));
  } else if (deco === "well") {
    // a dry cave at the bottom of the well: wishing coins everywhere, a shaft of light from above
    for (let k = 0; k < 60; k++) {
      const c = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), M(0xe8c050, { metalness: 0.6, roughness: 0.3 }), (Math.random() - 0.5) * R * 1.4, 0.03, (Math.random() - 0.5) * R * 1.4);
      G.add(c);
    }
    const shaft = mesh(new THREE.CylinderGeometry(1, 1, 6, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide }), 0, 3, 0);
    G.add(shaft);
    ring(6, R - 1, (x, z) => G.add(mesh(new THREE.DodecahedronGeometry(0.9), M(0x5a5a62), x, 0.5, z)));
  } else if (deco === "clouds") {
    // a treehouse floor on top of the clouds, open sky all round
    ring(16, R + 1, (x, z, a, k) => G.add(mesh(new THREE.SphereGeometry(2 + (k % 3), 8, 6), M(0xffffff), x, -0.6, z)));
    // the treehouse itself — a real little house you can walk INTO (the doorway faces you)
    const cx = 0, cz = -3.6, half = 3, wallH = 3;
    const wood = M(0xc89a6a), dark = M(0x7a4a2a);
    G.add(mesh(new THREE.BoxGeometry(half * 2 + 1.6, 0.2, half * 2 + 1.6), M(0xb88a5a), cx, 0.06, cz)); // (the deck)
    const wall = (x, z, w, d) => G.add(mesh(new THREE.BoxGeometry(w, wallH, d), wood, x, wallH / 2, z));
    wall(cx, cz - half, half * 2, 0.2); // back
    wall(cx - half, cz, 0.2, half * 2); // left
    wall(cx + half, cz, 0.2, half * 2); // right
    wall(cx - (half + 1) / 2, cz + half, half - 1, 0.2); // front, left of the door
    wall(cx + (half + 1) / 2, cz + half, half - 1, 0.2); // front, right of the door
    G.add(mesh(new THREE.BoxGeometry(2, 0.6, 0.2), wood, cx, wallH - 0.3, cz + half)); // over the door
    // round windows of sky
    for (const [x, z, ry] of [[cx - half - 0.11, cz, Math.PI / 2], [cx + half + 0.11, cz, -Math.PI / 2], [cx, cz - half - 0.11, 0]]) {
      const w = mesh(new THREE.CircleGeometry(0.55, 14), B(0xbfe4ff), x, 1.8, z);
      w.rotation.y = ry;
      G.add(w);
    }
    const roof = mesh(new THREE.ConeGeometry(half * 1.6, 2.2, 4), dark, cx, wallH + 1.1, cz);
    roof.rotation.y = Math.PI / 4;
    G.add(roof);
    // inside: a bed, a table with a lantern, a little telescope at the window, a rug
    G.add(mesh(new THREE.BoxGeometry(1.4, 0.5, 2.2), M(0xe86a8a), cx - 1.9, 0.35, cz - 1.2));
    G.add(mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5), M(0xffffff), cx - 1.9, 0.7, cz - 2));
    G.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 12), M(0x8a5a3a), cx + 1.8, 0.8, cz - 1.6));
    G.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6), M(0x6a4a2a), cx + 1.8, 0.4, cz - 1.6));
    const lantern = glow(0xffd890, 1.8, 0.9);
    lantern.position.set(cx + 1.8, 1.1, cz - 1.6);
    G.add(lantern);
    const scope = mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.9, 8), M(0xc8a040, { metalness: 0.5 }), cx + 2.2, 1.5, cz + 0.6);
    scope.rotation.z = -1.1;
    G.add(scope);
    const rug = mesh(new THREE.CircleGeometry(1.3, 18), M(0x8a5ad8), cx, 0.18, cz + 0.6);
    rug.rotation.x = -Math.PI / 2;
    G.add(rug);
    // the walls are solid (the doorway isn't)
    for (let t = -half; t <= half; t += 0.6) {
      solid(cx + t, cz - half, 0.35);
      solid(cx - half, cz + t, 0.35);
      solid(cx + half, cz + t, 0.35);
      if (Math.abs(t) > 1.2) solid(cx + t, cz + half, 0.35);
    }
    solid(cx - 1.9, cz - 1.2, 0.8);
    const birds = [];
    for (let k = 0; k < 4; k++) {
      const b = mesh(new THREE.ConeGeometry(0.15, 0.5, 4), B(0x3a3a4a), 0, 4, 0);
      b.rotation.z = Math.PI / 2;
      G.add(b);
      birds.push(b);
    }
    live.push((t) => birds.forEach((b, i) => b.position.set(Math.cos(t * 0.4 + i * 1.6) * 9, 5 + i, Math.sin(t * 0.4 + i * 1.6) * 9)));
  } else if (deco === "owls") {
    // round bookshelves going up into the dark, and owls in spectacles
    ring(9, R - 0.7, (x, z, a, k) => {
      const shelf = mesh(new THREE.BoxGeometry(2, 5.4, 0.6), M(0x4a2a14), x, 2.7, z);
      shelf.rotation.y = -a + Math.PI / 2;
      G.add(shelf);
      for (let r2 = 0; r2 < 4; r2++) {
        const row = mesh(new THREE.BoxGeometry(1.7, 0.7, 0.5), M([0x7a3a3a, 0x3a5a8a, 0x5a7a3a, 0x8a6a3a][(k + r2) % 4]), x * 0.97, 0.8 + r2 * 1.25, z * 0.97);
        row.rotation.y = shelf.rotation.y;
        G.add(row);
      }
      if (k % 2 === 0) {
        const owl = new THREE.Group();
        owl.add(mesh(new THREE.SphereGeometry(0.35, 8, 6), M(0x8a6a4a)));
        for (const sx of [-0.12, 0.12]) owl.add(mesh(new THREE.TorusGeometry(0.09, 0.02, 4, 10), B(0x202020), sx, 0.1, 0.32));
        owl.position.set(x * 0.85, 5.6, z * 0.85);
        owl.rotation.y = Math.atan2(-x, -z);
        G.add(owl);
      }
    });
    G.add(mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.9, 10), M(0x6a4a2a), 2.5, 0.45, 0));
    solid(2.5, 0, 1.5);
    const cand = glow(0xffc870, 1.6, 0.9);
    cand.position.set(2.5, 1.2, 0);
    G.add(cand);
  } else if (deco === "moon") {
    // a silver garden under a huge moon
    G.add(mesh(new THREE.CircleGeometry(5, 24), B(0xf0f4ff), 0, 14, -R - 4));
    ring(14, R * 0.6, (x, z, a, k) => {
      G.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4), M(0x8aa8c8), x, 0.4, z));
      const f = mesh(new THREE.SphereGeometry(0.28, 8, 6), M(0xe8f0ff, { emissive: 0xb8d0ff, emissiveIntensity: 0.6 }), x, 0.85, z);
      G.add(f);
    });
    G.add(mesh(new THREE.CircleGeometry(2.2, 20), M(0x9ab8e8, { metalness: 0.6, roughness: 0.1 }), 0, 0.03, 2));
    G.children[G.children.length - 1].rotation.x = -Math.PI / 2;
    sparkles(30, 0xd8e4ff, R * 1.6, 0.5, 5, 0.4);
  } else if (deco === "fairy") {
    // little market stalls under mushroom roofs, fireflies everywhere
    ring(7, R * 0.6, (x, z, a, k) => {
      const g = new THREE.Group();
      g.add(mesh(new THREE.BoxGeometry(1.8, 0.8, 1), M(0x8a6a4a), 0, 0.4, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2, 6), M(0xf0e8d8), 0, 1.2, 0));
      g.add(mesh(new THREE.SphereGeometry(1.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M([0xd85a8a, 0x8a5ad8, 0x5ab8d8][k % 3], { emissive: 0x401030, emissiveIntensity: 0.3 }), 0, 2.1, 0));
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.SphereGeometry(0.12, 6, 5), M([0xffd040, 0xff8ab8, 0x8affd8][i], { emissive: [0xffd040, 0xff8ab8, 0x8affd8][i], emissiveIntensity: 0.6 }), -0.5 + i * 0.5, 0.9, 0));
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      G.add(g);
      solid(x, z, 1.1);
    });
    const flies = sparkles(50, 0xfff0a0, R * 1.6, 0.4, 4, 0.35);
    live.push((t) => flies.forEach((s, i) => (s.position.y = 1 + Math.sin(t + i) * 1.2 + (i % 3))));
  } else if (deco === "glow") {
    // a long tunnel-cave; the ceiling is all glow-worms
    sparkles(160, 0x9fffa0, R * 1.8, 4.5, 5.8, 0.3);
    ring(10, R - 1, (x, z) => G.add(mesh(new THREE.DodecahedronGeometry(1), M(0x3a2a1a), x, 0.5, z)));
    G.add(mesh(new THREE.CircleGeometry(2, 18), M(0x1a3a2a, { metalness: 0.5, roughness: 0.1 }), 3, 0.03, 1));
    G.children[G.children.length - 1].rotation.x = -Math.PI / 2;
  } else if (deco === "puzzle") {
    // an old vault: carved pillars, sun-moon-star mosaics
    ring(8, R - 1.4, (x, z, a, k) => {
      G.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 5.6, 8), M(0xb8a888), x, 2.8, z));
      solid(x, z, 0.7);
    });
    ["☀️", "🌙", "⭐"].forEach((_, k) => {
      const m = mesh(new THREE.CircleGeometry(1.1, k === 0 ? 16 : k === 1 ? 5 : 4), M([0xffd040, 0xd8e4ff, 0xfff0a0][k], { emissive: [0x806010, 0x405080, 0x807040][k], emissiveIntensity: 0.4 }), (k - 1) * 3, 0.03, 1.5);
      m.rotation.x = -Math.PI / 2;
      G.add(m);
    });
  } else if (deco === "cellar") {
    // barrels, jars of jam, an old rocking chair, cobwebs
    ring(7, R - 1.2, (x, z, a, k) => {
      if (k % 2) {
        G.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10), M(0x7a5a3a), x, 0.6, z));
        solid(x, z, 0.7);
      } else {
        G.add(mesh(new THREE.BoxGeometry(1.8, 2.4, 0.5), M(0x5a3a22), x, 1.2, z));
        G.children[G.children.length - 1].rotation.y = -a + Math.PI / 2;
        for (let i = 0; i < 4; i++) G.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 8), M([0xb83a5a, 0xd8a03a, 0x7a3a8a][i % 3], { transparent: true, opacity: 0.85 }), x * 0.93 + Math.cos(a + 1.57) * (-0.6 + i * 0.4), 1.4, z * 0.93 + Math.sin(a + 1.57) * (-0.6 + i * 0.4)));
        solid(x, z, 0.8);
      }
    });
    G.add(mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), M(0x8a5a2a), 2.5, 0.6, 0.5));
  } else if (deco === "dungeon") {
    // stone arches, iron bars, flickering torches
    ring(8, R - 0.6, (x, z, a, k) => {
      const t = glow(0xffa040, 1.5, 0.9);
      t.position.set(x * 0.95, 2.6, z * 0.95);
      G.add(t);
      live.push((tt) => (t.material.opacity = 0.65 + Math.sin(tt * 9 + k) * 0.2));
    });
    for (let k = 0; k < 7; k++) G.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 5), M(0x2a2a2a), -4 + k * 0.4, 1.7, -R + 2.2));
    G.add(mesh(new THREE.BoxGeometry(3.4, 0.2, 0.2), M(0x2a2a2a), -2.8, 3.3, -R + 2.2));
    for (let k = 0; k < 20; k++) G.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), M(0xe8c050, { metalness: 0.6 }), 3 + Math.random() * 3, 0.03, -2 + Math.random() * 3));
  } else if (deco === "clock") {
    // huge turning gears, a swinging pendulum
    const gears = [];
    for (let k = 0; k < 6; k++) {
      const gr = new THREE.Group();
      const rr = 1 + (k % 3) * 0.6;
      gr.add(mesh(new THREE.CylinderGeometry(rr, rr, 0.25, 14), M(0xc8a040, { metalness: 0.5, roughness: 0.4 })));
      for (let i = 0; i < 10; i++) {
        const tooth = mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), M(0xc8a040, { metalness: 0.5 }), Math.cos((i / 10) * Math.PI * 2) * rr, 0, Math.sin((i / 10) * Math.PI * 2) * rr);
        gr.add(tooth);
      }
      gr.rotation.x = Math.PI / 2;
      const a = (k / 6) * Math.PI * 2 + 0.4;
      gr.position.set(Math.cos(a) * (R - 1.2), 1.5 + (k % 2) * 2.2, Math.sin(a) * (R - 1.2));
      gr.lookAt(0, gr.position.y, 0);
      G.add(gr);
      gears.push(gr);
    }
    live.push((t) => gears.forEach((g, i) => (g.rotation.z = t * (i % 2 ? 0.5 : -0.5))));
    const pend = new THREE.Group();
    pend.add(mesh(new THREE.BoxGeometry(0.08, 3.6, 0.08), M(0x8a6a3a), 0, -1.8, 0));
    pend.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 14), M(0xe8c050, { metalness: 0.6 }), 0, -3.6, 0));
    pend.children[1].rotation.x = Math.PI / 2;
    pend.position.set(0, 5.6, -2);
    G.add(pend);
    live.push((t) => (pend.rotation.z = Math.sin(t * 2) * 0.4));
  } else if (deco === "market") {
    // the smugglers' counter in the middle, and the one-eyed rat who keeps it (paradise.js sells the wares)
    G.add(mesh(new THREE.BoxGeometry(3.4, 1, 1.2), M(0x4a2e1a), 0, 0.5, 1.4));
    const keeper = new THREE.Group();
    const coat = mesh(new THREE.ConeGeometry(0.7, 1.8, 8), M(0x2a2a34), 0, 0.9, 0);
    const head = mesh(new THREE.SphereGeometry(0.42, 10, 8), M(0x6a6058), 0, 2.05, 0.05);
    const snout = mesh(new THREE.ConeGeometry(0.2, 0.5, 8), M(0x6a6058), 0, 1.98, 0.45);
    snout.rotation.x = Math.PI / 2;
    const patch = mesh(new THREE.CircleGeometry(0.12, 10), B(0x111111), 0.16, 2.12, 0.4);
    const hood = mesh(new THREE.SphereGeometry(0.48, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1a1a22), 0, 2.15, -0.05);
    keeper.add(coat, head, snout, patch, hood);
    keeper.position.set(0, 0, 0);
    G.add(keeper);
    solid(0, 1.2, 1.6);
    const lamp = glow(0xffb860, 1.6, 0.9);
    lamp.position.set(1.3, 1.4, 1.4);
    G.add(lamp);
    // lantern-lit stalls round the walls, rugs, hanging lanterns
    ring(8, R - 1.6, (x, z, a, k) => {
      const g = new THREE.Group();
      g.add(mesh(new THREE.BoxGeometry(2, 0.9, 1), M(0x7a5a3a), 0, 0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(2.2, 0.08, 1.3), M([0xb83a3a, 0x3a7ab8, 0xd8a83a, 0x5a9a4a][k % 4]), 0, 2.4, 0));
      for (const sx of [-0.95, 0.95]) g.add(mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), M(0x5a3a22), sx, 1.2, 0.5));
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), M([0xe8c050, 0x8ad8ff, 0xd85a8a, 0x8ae86a][(i + k) % 4]), -0.6 + i * 0.4, 1.05, 0));
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      G.add(g);
      solid(x, z, 1.2);
    });
    for (let k = 0; k < 10; k++) {
      const l = glow(0xffb860, 1.4, 0.85);
      l.position.set(Math.cos(k) * 5, 4.2, Math.sin(k) * 5);
      G.add(l);
    }
  } else if (deco === "grotto") {
    // glittering water round the edges, shells, a smugglers' boat
    const pool = mesh(new THREE.RingGeometry(R - 3.5, R + 0.3, 30), M(0x2a8ab8, { transparent: true, opacity: 0.85, metalness: 0.3, roughness: 0.2 }), 0, 0.05, 0);
    pool.rotation.x = -Math.PI / 2;
    G.add(pool);
    sparkles(40, 0x8ae8ff, R * 1.7, 0.1, 0.4, 0.3);
    const boat = mesh(new THREE.BoxGeometry(1.4, 0.5, 3), M(0x6a4a2a), -R + 2, 0.25, -2);
    G.add(boat);
    for (let k = 0; k < 12; k++) G.add(mesh(new THREE.ConeGeometry(0.15, 0.3, 6), M([0xf0d0c0, 0xe8b8a8, 0xffffff][k % 3]), (Math.random() - 0.5) * 8, 0.1, (Math.random() - 0.5) * 8));
  } else if (deco === "lighthouse") {
    // the keeper's round room: a bed, a desk, a spiral stair up to the great lamp
    for (let k = 0; k < 16; k++) {
      const a = k * 0.5;
      G.add(mesh(new THREE.BoxGeometry(1.4, 0.15, 0.6), M(0x8a6a4a), Math.cos(a) * (R - 1.5), 0.3 + k * 0.35, Math.sin(a) * (R - 1.5)));
    }
    G.add(mesh(new THREE.BoxGeometry(1.4, 0.5, 2.4), M(0xb84a4a), 3.5, 0.25, 1));
    G.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), M(0x6a4a2a), -3, 0.45, 1.5));
    solid(3.5, 1, 1.3);
    solid(-3, 1.5, 1);
    const lamp = glow(0xfff0a0, 6, 0.8);
    lamp.position.set(0, 5.4, 0);
    G.add(lamp);
    live.push((t) => (lamp.material.opacity = 0.5 + Math.abs(Math.sin(t)) * 0.4));
  } else if (deco === "shell") {
    // a pearly room: curving walls, pearls, little fish swimming past the windows
    ring(10, R - 0.5, (x, z) => {
      const p = mesh(new THREE.SphereGeometry(0.35, 10, 8), M(0xfff8f0, { metalness: 0.3, roughness: 0.15 }), x * 0.9, 0.35, z * 0.9);
      G.add(p);
    });
    G.add(mesh(new THREE.SphereGeometry(1.2, 14, 10), M(0xfff0f8, { metalness: 0.4, roughness: 0.1, emissive: 0x806878, emissiveIntensity: 0.3 }), 3, 1.2, 0));
    solid(3, 0, 1.3);
    const fish = [];
    for (let k = 0; k < 8; k++) {
      const f = mesh(new THREE.ConeGeometry(0.15, 0.5, 5), M([0xffa040, 0x40c8ff, 0xff70a0][k % 3]), 0, 3, 0);
      f.rotation.z = Math.PI / 2;
      G.add(f);
      fish.push(f);
    }
    live.push((t) => fish.forEach((f, i) => {
      const a = t * 0.5 + i * 0.8;
      f.position.set(Math.cos(a) * (R - 1), 2.5 + Math.sin(t + i), Math.sin(a) * (R - 1));
      f.rotation.y = -a;
    }));
  } else if (deco === "icepalace") {
    // ice pillars and a glittering throne
    ring(10, R - 1.5, (x, z, a, k) => {
      G.add(mesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 6), M(0xc8e8ff, { transparent: true, opacity: 0.8, emissive: 0x4a7aaa, emissiveIntensity: 0.2 }), x, 3, z));
      solid(x, z, 0.8);
    });
    G.add(mesh(new THREE.BoxGeometry(2.4, 0.6, 2), M(0xd8f0ff), 0, 0.3, -R + 3));
    G.add(mesh(new THREE.BoxGeometry(2.4, 3.4, 0.4), M(0xbfe8ff, { emissive: 0x6aa8d8, emissiveIntensity: 0.3 }), 0, 1.7, -R + 2));
    solid(0, -R + 2.8, 1.5);
    sparkles(40, 0xffffff, R * 1.6, 0.5, 5.5, 0.3);
  } else if (deco === "hoard") {
    // heaps and heaps of gold, a giant old scale, a skeleton of a chair
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + 0.4;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.5) continue;
      const x = Math.cos(a) * (R - 3.5), z = Math.sin(a) * (R - 3.5);
      const heap = mesh(new THREE.SphereGeometry(2.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8b830, { metalness: 0.7, roughness: 0.3 }), x, 0, z);
      heap.scale.y = 0.6;
      G.add(heap);
      solid(x, z, 2.2);
    }
    for (let k = 0; k < 18; k++) G.add(mesh(new THREE.OctahedronGeometry(0.25), M([0xd83a5a, 0x3ad8a8, 0x5a7aff][k % 3], { metalness: 0.4, roughness: 0.2 }), (Math.random() - 0.5) * R * 1.4, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * R * 1.4));
    sparkles(30, 0xffe080, R * 1.5, 0.3, 2, 0.5);
  } else if (deco === "maps") {
    // maps pinned all over the walls, a big map table, a brass telescope
    ring(14, R - 0.2, (x, z, a, k) => {
      const m = mesh(new THREE.PlaneGeometry(1.4, 1), M([0xe8d8b0, 0xd8c898, 0xf0e0c0][k % 3], { side: THREE.DoubleSide }), x, 1.8 + (k % 2) * 1.4, z);
      m.rotation.y = -a - Math.PI / 2;
      G.add(m);
    });
    G.add(mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.15, 16), M(0x6a4a2a), 0, 1.1, -1));
    G.add(mesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 8), M(0x5a3a22), 0, 0.5, -1));
    G.add(mesh(new THREE.CircleGeometry(2, 16), M(0xe8d8b0), 0, 1.19, -1));
    G.children[G.children.length - 1].rotation.x = -Math.PI / 2;
    solid(0, -1, 2.3);
  } else if (["glade", "eyrie", "crag", "plains", "nomads", "cove"].includes(deco)) {
    realmDecor(deco, G, R, Z, live, ring, solid, sparkles);
  } else if (deco === "lair") {
    // velvet cushions, lanterns, heaps of treasure — and HIM: a rat as big as a house
    const cat = new THREE.Group();
    const fur = M(0x5a5048), pink = M(0xd8a0a0);
    const body = mesh(new THREE.SphereGeometry(3, 14, 10), fur, 0, 2.2, 0);
    body.scale.set(1.1, 0.8, 1.7);
    const head = new THREE.Group();
    head.position.set(0, 3, 4);
    const skull = mesh(new THREE.SphereGeometry(1.5, 14, 10), fur, 0, 0, 0);
    skull.scale.set(1, 0.9, 1.3);
    const snout = mesh(new THREE.ConeGeometry(0.9, 2.2, 10), fur, 0, -0.3, 2);
    snout.rotation.x = Math.PI / 2;
    const nose = mesh(new THREE.SphereGeometry(0.25, 8, 6), pink, 0, -0.3, 3.1);
    head.add(skull, snout, nose);
    for (const sx of [-1, 1]) {
      const ear = mesh(new THREE.CircleGeometry(0.9, 14), fur, sx * 1.1, 1.2, -0.2);
      const inner = mesh(new THREE.CircleGeometry(0.6, 14), pink, sx * 1.1, 1.2, -0.15);
      for (const m of [ear, inner]) m.rotation.y = sx * 0.3;
      const eye = mesh(new THREE.SphereGeometry(0.28, 10, 8), B(0x1a0a0a), sx * 0.75, 0.35, 1.15);
      const ring2 = mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 14), M(0xd8a030, { metalness: 0.7, roughness: 0.3 }), sx * 0.75, 0.35, 1.25);
      head.add(ear, inner, eye);
      if (sx < 0) head.add(ring2); // (a monocle — he's a gentleman)
      for (let w = 0; w < 3; w++) {
        const whisk = mesh(new THREE.BoxGeometry(2.4, 0.03, 0.03), B(0xd8d0c0), sx * 1.4, -0.4 + w * 0.15, 2.4);
        whisk.rotation.z = sx * (w - 1) * 0.15;
        head.add(whisk);
      }
    }
    const tail = mesh(new THREE.CylinderGeometry(0.12, 0.4, 9, 8), pink, 3.5, 0.6, -4.5);
    tail.rotation.set(1.2, 0, 0.9);
    const collar = mesh(new THREE.TorusGeometry(1.3, 0.15, 8, 20), M(0xd8a030, { metalness: 0.7, roughness: 0.3 }), 0, 2.7, 3.2);
    collar.rotation.x = 1.2;
    cat.add(body, head, tail, collar);
    cat.position.set(0, 0.5, -R * 0.45);
    G.add(cat);
    // the cushions he lies on
    for (let k = 0; k < 6; k++) G.add(mesh(new THREE.BoxGeometry(3, 0.6, 2.4), M([0x6a1a3a, 0x3a1a5a, 0x8a5a1a][k % 3]), -4 + (k % 3) * 4, 0.3 + Math.floor(k / 3) * 0.5, -R * 0.45 - 1 + Math.floor(k / 3) * 1.5));
    solid(0, -R * 0.45, 5.5);
    Z.trader = { x: 0, z: -R * 0.45 + 6.5 };
    live.push((t) => {
      head.rotation.y = Math.sin(t * 0.3) * 0.25;
      tail.rotation.x = Math.sin(t * 0.8) * 0.4;
    });
    // treasure heaps, hanging lanterns, rugs
    ring(8, R - 2, (x, z, a, k) => {
      const heap = mesh(new THREE.SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), M([0xd8a030, 0x8a6a4a, 0xb8b8c8][k % 3], { metalness: 0.5, roughness: 0.4 }), x, 0, z);
      heap.scale.y = 0.6;
      G.add(heap);
      const lamp = glow(0xffb050, 1.8, 0.85);
      lamp.position.set(x * 0.8, 3.6, z * 0.8);
      G.add(lamp);
      solid(x, z, 1.2);
    });
    const rug = mesh(new THREE.CircleGeometry(4, 20), M(0x6a1a2a), 0, 0.03, 3);
    rug.rotation.x = -Math.PI / 2;
    G.add(rug);
  } else if (deco === "mirrors") {
    // mirror panels in rings — a little maze
    const mirror = new THREE.MeshStandardMaterial({ color: 0xd8e8f8, metalness: 0.95, roughness: 0.05 });
    for (const rad of [R - 1.2, R * 0.55]) {
      const n = rad > 6 ? 14 : 8;
      for (let k = 0; k < n; k++) {
        if (k % 4 === 1) continue; // (gaps to walk through)
        const a = (k / n) * Math.PI * 2 + 0.2;
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.45) continue;
        const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        const p = mesh(new THREE.BoxGeometry(rad * 0.5, 3.2, 0.1), mirror, x, 1.6, z);
        p.rotation.y = -a + Math.PI / 2;
        G.add(p);
        solid(x, z, 0.6);
      }
    }
    sparkles(20, 0xffffff, R * 1.5, 0.5, 3.5, 0.3);
  }
}

// ---------------------------------------------------------------- 🦌 the riding animals' secret realms
const REALM_MOUNT = { glade: "stag", eyrie: "eagle", crag: "goat", plains: "mustang", nomads: "bison", cove: "turtle" };
function realmDecor(deco, G, R, Z, live, ring, solid, sparkles) {
  // the animal itself waits at the far side of its realm (animals.js handles earning its trust)
  const mount = MOUNT_BUILDERS[REALM_MOUNT[deco]]();
  const at = { x: 0, z: -R * 0.45 };
  mount.position.set(at.x, 0, at.z);
  mount.scale.setScalar(1.6);
  G.add(mount);
  solid(at.x, at.z, 1.6);
  Z.realmMount = { g: mount, ...at, key: REALM_MOUNT[deco] };
  live.push((t) => {
    mount.userData.tail.rotation.z = Math.sin(t * 2) * 0.3;
    if (mount.userData.wings) mount.userData.wings.forEach(({ w, sx }) => (w.rotation.z = sx * (0.2 + Math.sin(t * 1.5) * 0.15)));
    mount.rotation.y = Math.sin(t * 0.3) * 0.4;
  });
  if (deco === "glade") {
    // white birches in a ring, a still pool reflecting the stars, fireflies
    ring(14, R - 2, (x, z) => {
      G.add(mesh(new THREE.CylinderGeometry(0.25, 0.35, 7, 7), M(0xf0ece4), x, 3.5, z));
      const top = mesh(new THREE.SphereGeometry(2, 8, 6), M(0x9ab8a0), x, 7.5, z);
      top.scale.y = 0.7;
      G.add(top);
      solid(x, z, 0.5);
    });
    const pool = mesh(new THREE.CircleGeometry(3.5, 24), M(0x1a2a4a, { metalness: 0.7, roughness: 0.05 }), 4, 0.03, 3);
    pool.rotation.x = -Math.PI / 2;
    G.add(pool);
    G.add(mesh(new THREE.CircleGeometry(6, 24), B(0xf0f4ff), 0, 26, -R - 6));
    sparkles(60, 0xffffff, R * 3, 12, 30, 0.6);
    sparkles(30, 0xd8ffa0, R * 1.6, 0.5, 3, 0.35);
  } else if (deco === "eyrie") {
    // a rocky summit above a sea of clouds, and the giant nest
    ring(18, R + 3, (x, z, a, k) => G.add(mesh(new THREE.SphereGeometry(4 + (k % 3), 8, 6), M(0xffffff), x * 1.2, -3, z * 1.2)));
    const nest = mesh(new THREE.TorusGeometry(3.4, 1.1, 8, 18), M(0x7a5a3a), 0, 0.6, -R * 0.45);
    nest.rotation.x = -Math.PI / 2;
    G.add(nest);
    for (let k = 0; k < 8; k++) G.add(mesh(new THREE.DodecahedronGeometry(1.2 + (k % 3) * 0.5), M(0x8a8478), Math.cos(k * 0.8) * (R - 3), 0.4, Math.sin(k * 0.8) * (R - 3) * 0.6 + 2));
  } else if (deco === "crag") {
    // sheer pillars of rock with little ledges, goats perched on them
    ring(9, R - 3, (x, z, a, k) => {
      const h = 6 + (k % 4) * 3;
      G.add(mesh(new THREE.CylinderGeometry(1.4, 2.4, h, 6), M(0x7a7670), x, h / 2, z));
      solid(x, z, 2.2);
      if (k % 2 === 0) {
        const goat = MOUNT_BUILDERS.goat();
        goat.scale.setScalar(0.9);
        goat.position.set(x, h, z);
        goat.rotation.y = a;
        G.add(goat);
      }
    });
    sparkles(20, 0xffffff, R * 1.6, 0.4, 2, 0.3);
  } else if (deco === "plains") {
    // tall golden grass, a few lone trees, a herd galloping round and round
    for (let k = 0; k < 120; k++) {
      const a = k * 2.39, d = 4 + ((k * 3.7) % (R - 4));
      const blade = mesh(new THREE.ConeGeometry(0.12, 1 + (k % 3) * 0.3, 4), M(0xd8b858), Math.cos(a) * d, 0.5, Math.sin(a) * d);
      G.add(blade);
    }
    for (const [x, z] of [[-12, 6], [13, -4]]) {
      G.add(mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 7), M(0x6a4a2a), x, 2, z));
      const crown = mesh(new THREE.SphereGeometry(3, 8, 6), M(0x5a8a3a), x, 5, z);
      crown.scale.y = 0.5;
      G.add(crown);
      solid(x, z, 0.8);
    }
    const herd = [0x2a1a10, 0xe8e0d0, 0x8a6a4a, 0x3a3a3a, 0xc8a070].map((c) => {
      const h = MOUNT_BUILDERS.mustang();
      h.traverse((o) => o.isMesh && o.material.color.getHex() === 0x9a5a2a && (o.material = o.material.clone(), o.material.color.setHex(c)));
      h.scale.setScalar(1.4);
      G.add(h);
      return h;
    });
    live.push((t) => herd.forEach((h, i) => {
      const a = t * 0.35 + i * 0.5;
      h.position.set(Math.cos(a) * (R * 0.75), 0, Math.sin(a) * (R * 0.75));
      h.rotation.y = -a;
      h.userData.legs.forEach((l, j) => (l.rotation.x = (j % 3 === 0 ? 1 : -1) * Math.sin(t * 12 + i) * 0.7));
    }));
  } else if (deco === "nomads") {
    // painted tents, a fire with smoke, more bison grazing
    ring(6, R * 0.65, (x, z, a, k) => {
      const tent = mesh(new THREE.ConeGeometry(2.4, 4, 8), M([0xb84a2a, 0xe8c840, 0x3a6a8a][k % 3]), x, 2, z);
      G.add(tent);
      solid(x, z, 2.3);
    });
    const fire = glow(0xffa040, 3, 0.9);
    fire.position.set(3, 0.8, 2);
    G.add(fire);
    live.push((t) => fire.scale.setScalar(3 + Math.sin(t * 9) * 0.4));
    for (const [x, z] of [[-9, 8], [10, 7], [-13, -6]]) {
      const b = MOUNT_BUILDERS.bison();
      b.scale.setScalar(1.5);
      b.position.set(x, 0, z);
      b.rotation.y = x * 0.3;
      G.add(b);
      solid(x, z, 1.6);
    }
  } else if (deco === "cove") {
    // white sand, clear water, palms, turtles basking
    const sea = mesh(new THREE.CircleGeometry(R * 0.5, 30), M(0x3ab8d8, { transparent: true, opacity: 0.85, roughness: 0.1 }), 0, 0.05, -R * 1.05);
    sea.rotation.x = -Math.PI / 2;
    G.add(sea);
    for (const [x, z] of [[-10, 6], [11, 8], [-14, -4], [14, -2]]) {
      G.add(mesh(new THREE.CylinderGeometry(0.25, 0.4, 6, 7), M(0x8a6a42), x, 3, z));
      for (let f = 0; f < 6; f++) {
        const leaf = mesh(new THREE.BoxGeometry(0.6, 0.06, 3), M(0x3a8a3a), x, 6, z);
        leaf.geometry.translate(0, 0, 1.5);
        leaf.rotation.set(0.5, (f / 6) * Math.PI * 2, 0);
        G.add(leaf);
      }
      solid(x, z, 0.5);
    }
    for (const [x, z] of [[-6, -10], [7, -12]]) {
      const tt = MOUNT_BUILDERS.turtle();
      tt.position.set(x, 0, z);
      tt.rotation.y = x * 0.2;
      G.add(tt);
    }
  }
}
