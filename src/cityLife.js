// ------------------------------------------------------------
//  🎪  CITY LIFE — what makes a Great City feel ALIVE.
//
//  Added on top of each city from cities.js:
//    🏘️ a new outer district of homes (the cities are Roothaven-sized now)
//    🐭 crowds of townsfolk out walking — say hello (E)
//    🛍️ a MARKET with goods sold nowhere else, paid for in 🪙 coins
//    🏆 an EVENT with prizes:
//         🌊 Reedmere      — the Raft Race (checkpoints, floating logs)
//         🌾 Golden Hollow — the Chicken Feeding Contest
//         ❄️ Frostpine     — the Sled Race (gates, snowmen)
//    🗺️ three side ADVENTURES per city
//    🐄 Golden Hollow's cows (milk them!)
//
//  Coins, things you've bought, medals and adventures are remembered in
//  this browser (ww.citylife.v1).
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene } from "./cutscene.js";
import { buildThistle } from "./outside.js";
import { registerRoom } from "./homes.js";
import { openPetShop, openPetBoutique } from "./pets.js";
import { glowTexture } from "./phase2.js";
import { bagFood, registerFood } from "./food.js";
import { power, powerText, setPowerSave, powersChanged, ITEM_POWERS } from "./powers.js";
import { inflate, bought, cost, sellMult, setEconomySource, priceMult } from "./economy.js";
export { setEconomySource };
import { genBatch, genItem, isGen, splitTint, tintKey, nthTint, tintName, tintMeshes, TINTS } from "./restock.js";
import { signBoard, signTexture, setSignText } from "./signs.js";
// 🪧 the red FOR SALE board (crisp + readable, see signs.js)
const FOR_SALE_STYLE = { bg: "#4a1010", frame: "#ff9a80", ink: "#fff4d8" };

// ---------- what you own (shared by every city) ----------
const SAVE = "ww.citylife.v1";
let S = { coins: 10, owned: {}, medals: {}, adv: {} };
try {
  const raw = JSON.parse(localStorage.getItem(SAVE));
  if (raw) S = { ...S, ...raw };
} catch {}
// (the Brass Spyglass is gone from the game — if you had one, you get your coins back)
if (S.owned && S.owned.spyglass) {
  delete S.owned.spyglass;
  S.coins = (S.coins || 0) + 22;
}
const save = () => {
  powersChanged(); // (✨ recount your powers)
  try {
    localStorage.setItem(SAVE, JSON.stringify(S));
  } catch {}
};
export const getCoins = () => S.coins;
setPowerSave(() => S);
export const hasItem = (k) => !!S.owned[k];
// keepsakes from elsewhere (quest rewards…) — key → [icon, name]
const EXTRA_KEEPS = {};
export const registerKeepsake = (key, icon, name) => (EXTRA_KEEPS[key] = [icon, name]);
/** keepsakes + gear, for the backpack */
export function ownedList() {
  const out = [];
  for (const id of Object.keys(S.owned)) {
    const n0 = out.length;
    if (EXTRA_KEEPS[id]) out.push(EXTRA_KEEPS[id].join(" "));
    else if (isGen(id)) out.push(`${genItem(id).icon} ${genItem(id).name}`);
    else if (id.includes("~") && WEAR[id]) out.push(`${WEAR[id].icon} ${WEAR[id].name}`);
    else for (const m of Object.values(MARKETS)) for (const st of m.stalls) for (const it of [...st.items, ...(RESTOCK[st.vendor] || []).flat()]) if (it.key === id) out.push(`${it.icon} ${it.name}`);
    if (out.length > n0 && powerText(id)) out[out.length - 1] += ` (${powerText(id)})`; // (✨ what it does)
  }
  for (const [ev, medal] of Object.entries(S.medals)) out.push(`${medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉"} ${EVENT_NAMES[ev]}`);
  return out;
}
const EVENT_NAMES = { reedmere: "Raft Race", golden: "Chicken Feeding Contest", frostpine: "Sled Race" };

// ---------- the markets: goods sold ONLY in their own city ----------
// effect: heal = eat it now; warm = Hot Cocoa; key = keep it (gear/keepsake)
const MARKETS = {
  reedmere: {
    center: { x: -46, z: 82 },
    awning: [0x3a8a9a, 0xf0ece0],
    stalls: [
      { vendor: "Fishmonger Brill", tunic: 0x4a7a8a, items: [
        { key: "smokedfish", icon: "🐟", name: "Smoked Fish", price: 6, heal: 30, desc: "Smoky and filling (+30 ❤️)" },
        { key: "lilytea", icon: "🍵", name: "Lily Tea", price: 4, heal: 15, desc: "Brewed from lagoon lilies (+15 ❤️)" },
      ] },
      { vendor: "Pearl Diver Coral", tunic: 0xd88a8a, items: [
        { key: "pearl", icon: "⚪", name: "Lagoon Pearl", price: 15, keep: true, desc: "A keepsake — only Reedmere's divers find these" },
        { key: "shellnecklace", icon: "🐚", name: "Shell Necklace", price: 12, keep: true, desc: "WEAR IT: tiny spiral shells" },
      ] },
      { vendor: "Sailmaker Rigg", tunic: 0x8a7a4a, items: [
        { key: "sail", icon: "⛵", name: "Lagoon Sail", price: 25, keep: true, desc: "GEAR: your raft goes 30% faster" },
        { key: "reedhat", icon: "👒", name: "Reed Hat", price: 10, keep: true, desc: "WEAR IT: woven from lagoon reeds" },
      ] },
      { vendor: "Jeweler Nacre", tunic: 0x8ac8c8, items: [
        { key: "pearlpendant", icon: "⚪", name: "Pearl Pendant", price: 20, keep: true, desc: "WEAR IT: a lagoon pearl on a cord" },
        { key: "seaglassearring", icon: "💎", name: "Sea-Glass Earring", price: 12, keep: true, desc: "WEAR IT: green as the lagoon" },
        { key: "shellbracelet", icon: "🐚", name: "Shell Bracelet", price: 9, keep: true, desc: "WEAR IT: tiny shells that clink" },
      ] },
      { vendor: "Tackle-Mouse Finn", tunic: 0x5a6a3a, items: [
        { key: "lure", icon: "🪝", name: "Golden Lure", price: 18, keep: true, desc: "GEAR: fish bite twice as fast" },
      ] },
    ],
  },
  golden: {
    center: { x: -56, z: 80 },
    awning: [0xd8a83a, 0xf4ecd8],
    stalls: [
      { vendor: "Baker Crumb", tunic: 0xc89a6a, items: [
        { key: "honeycake", icon: "🍯", name: "Honey Cake", price: 5, heal: 30, desc: "Sticky, golden, warm (+30 ❤️)" },
        { key: "butterbun", icon: "🥐", name: "Butter Bun", price: 3, heal: 15, desc: "Fresh from the hearth (+15 ❤️)" },
      ] },
      { vendor: "Cheesemaker Curd", tunic: 0xe8c858, items: [
        { key: "cheesewheel", icon: "🧀", name: "Cheese Wheel", price: 12, heal: 100, desc: "A WHOLE wheel (full ❤️)" },
      ] },
      { vendor: "Hatter Thatch", tunic: 0xa8783a, items: [
        { key: "strawhat", icon: "👒", name: "Straw Hat", price: 10, keep: true, desc: "WEAR IT: keeps the plains sun off" },
        { key: "pumpkinlantern", icon: "🎃", name: "Pumpkin Lantern", price: 14, keep: true, desc: "Carved for the Harvest Feast" },
      ] },
      { vendor: "Seedsman Barleycorn", tunic: 0x6a8a3a, items: [
        { key: "goldenseeds", icon: "🌻", name: "Golden Seeds", price: 8, keep: true, desc: "Sunflower seeds from the Plains — a keepsake" },
      ] },
    ],
  },
  frostpine: {
    center: { x: 40, z: 55 },
    awning: [0x4a6a9a, 0xf4f8ff],
    stalls: [
      { vendor: "Toffee-Mouse Treacle", tunic: 0x8a5a3a, items: [
        { key: "pinetoffee", icon: "🍬", name: "Pine Toffee", price: 4, heal: 20, desc: "Chewy and sweet (+20 ❤️)" },
        { key: "cocoa", icon: "☕", name: "Hot Cocoa", price: 5, heal: 25, warm: true, desc: "Warms you right through (+25 ❤️, full warmth)" },
      ] },
      { vendor: "Knitter Purl", tunic: 0xc85a5a, items: [
        { key: "scarf", icon: "🧣", name: "Wool Scarf", price: 14, keep: true, desc: "WEAR IT: the cold creeps in much slower" },
      ] },
      { vendor: "Cobbler Welt", tunic: 0x5a4a3a, items: [
        { key: "boots", icon: "🥾", name: "Snow Boots", price: 18, keep: true, desc: "WEAR IT: the cold creeps in much slower" },
      ] },
      { vendor: "Carver Spruce", tunic: 0x6a4a2a, items: [
        { key: "racingsled", icon: "🛷", name: "Racing Sled", price: 25, keep: true, desc: "GEAR: 15% faster in the Sled Race" },
        { key: "icecrystal", icon: "💠", name: "Ice Crystal", price: 20, keep: true, desc: "Never melts — a Frostpine keepsake" },
      ] },
    ],
  },
};

// ---------- RESTOCK: when you've bought everything a stall has, the
// vendor brings out something new (keepsakes; one new batch at a time) ----------
const RESTOCK = {
  "Fishmonger Brill": [
    [{ key: "eelpie", icon: "🥧", name: "Eel Pie", price: 7, heal: 35, desc: "A Reedmere specialty (+35 ❤️)" }, { key: "anchorcharm", icon: "⚓", name: "Little Anchor Charm", price: 14, keep: true, desc: "Brings sailors home safe" }],
    [{ key: "seaglassbowl", icon: "🥣", name: "Sea-Glass Bowl", price: 18, keep: true, desc: "Green as the lagoon" }],
  ],
  "Pearl Diver Coral": [
    [{ key: "blackpearl", icon: "⚫", name: "Black Pearl", price: 30, keep: true, desc: "Rarest of all — only one a season" }, { key: "coralcomb", icon: "🪸", name: "Coral Comb", price: 16, keep: true, desc: "For very fancy whiskers" }],
  ],
  "Sailmaker Rigg": [
    [{ key: "pennant", icon: "🚩", name: "Raft Pennant", price: 12, keep: true, desc: "Flies from your raft's stern" }],
  ],
  "Tackle-Mouse Finn": [
    [{ key: "featherfly", icon: "🪶", name: "Feather Fly", price: 10, keep: true, desc: "A hand-tied lure — a keepsake" }, { key: "tacklebox", icon: "🧰", name: "Little Tackle Box", price: 20, keep: true, desc: "Everything in its place" }],
  ],
  "Baker Crumb": [
    [{ key: "berrytart", icon: "🥧", name: "Berry Tart", price: 6, heal: 30, desc: "Still warm (+30 ❤️)" }, { key: "rollingpin", icon: "🪵", name: "Tiny Rolling Pin", price: 12, keep: true, desc: "Crumb's own spare" }],
  ],
  "Cheesemaker Curd": [
    [{ key: "bluecheese", icon: "🧀", name: "Blue Cheese", price: 15, heal: 100, desc: "Smelly and magnificent (full ❤️)" }, { key: "cheeseknife", icon: "🔪", name: "Cheese Harp", price: 18, keep: true, desc: "Slices a wheel in one go" }],
  ],
  "Hatter Thatch": [
    [{ key: "sunbonnet", icon: "👒", name: "Sunflower Bonnet", price: 14, keep: true, desc: "A real sunflower on top!" }, { key: "harvestcrown", icon: "👑", name: "Harvest Crown", price: 26, keep: true, desc: "Woven wheat, for Feast days" }],
  ],
  "Seedsman Barleycorn": [
    [{ key: "pumpkinseeds", icon: "🎃", name: "Giant Pumpkin Seeds", price: 12, keep: true, desc: "Grow one bigger than a house!" }, { key: "seedpouch", icon: "👝", name: "Embroidered Seed Pouch", price: 15, keep: true, desc: "Stitched with wheat-ears" }],
  ],
  "Toffee-Mouse Treacle": [
    [{ key: "maplecandy", icon: "🍁", name: "Maple Snow Candy", price: 5, heal: 25, desc: "Poured on fresh snow (+25 ❤️)" }, { key: "toffeetin", icon: "🥫", name: "Painted Toffee Tin", price: 12, keep: true, desc: "Empty — sadly" }],
  ],
  "Knitter Purl": [
    [{ key: "earmuffs", icon: "🎧", name: "Woolly Earmuffs", price: 14, keep: true, desc: "Big ears need big muffs" }, { key: "snowsweater", icon: "🧶", name: "Snowflake Sweater", price: 20, keep: true, desc: "Knitted with silver thread" }],
  ],
  "Cobbler Welt": [
    [{ key: "skates", icon: "⛸️", name: "Ice Skates", price: 22, keep: true, desc: "Glide on ANY ice — faster, and you can steer and stop" }, { key: "fursocks", icon: "🧦", name: "Fur-Lined Socks", price: 10, keep: true, desc: "Toasty toes" }],
  ],
  "Carver Spruce": [
    [{ key: "carvedowl", icon: "🦉", name: "Carved Owl", price: 18, keep: true, desc: "Pine, with amber eyes" }, { key: "snowglobe", icon: "🔮", name: "Snow Globe of Frostpine", price: 24, keep: true, desc: "Shake it — it snows!" }],
  ],
};
/** what a stall has on its counter right now (it restocks as you buy —
 *  FOREVER: after the hand-made batches come new colors of its clothes,
 *  then brand-new keepsakes and treats, batch after batch) */
function stockOf(stall) {
  const fixed = [stall.items, ...(RESTOCK[stall.vendor] || [])];
  const wear = fixed.flat().filter((it) => it.keep && WEAR[it.key]);
  const theme = stall.theme || Object.keys(MARKETS).find((c) => MARKETS[c].stalls.includes(stall)) || "everbough";
  const cache = {};
  const batch = (i) => (cache[i] ||= i < fixed.length ? fixed[i] : moreStock(stall.vendor, i - fixed.length + 1, theme, wear));
  let i = 0;
  while (i < 400 && batchDone(batch(i))) i++;
  // 🔄 each paid refresh skips ahead to a whole NEW batch you haven't seen yet
  for (let b = (S.stallBump && S.stallBump[stall.vendor]) || 0; b > 0 && i < 400; b--) {
    i++;
    while (i < 400 && batchDone(batch(i))) i++;
  }
  // food from the hand-made batches stays on sale
  const cur = batch(i);
  const food = fixed.slice(0, Math.min(i, fixed.length)).flat().filter((it) => !it.keep && !cur.includes(it));
  return { items: inflate([...cur, ...food]), restocked: i > 0, soldOut: false }; // (🪙 prices grow with your adventure)
}
/** you've bought everything in a batch: every keepsake owned (or, for a
 *  food-only counter, every dish tried once) */
function batchDone(b) {
  const keeps = b.filter((it) => it.keep);
  return keeps.length ? keeps.every((it) => S.owned[it.key]) : b.every((it) => (S.tried || {})[it.key]);
}
/** batch n of NEW stock: new colors of its clothes first, then keepsakes + treats */
function moreStock(vendor, n, theme, wear) {
  if (wear.length && n < TINTS.length - 4) {
    return wear.map((it) => {
      const [nm, hex] = nthTint(it.key, n);
      const k = tintKey(it.key, hex);
      registerTint(k);
      return { key: k, icon: it.icon, name: `${nm} ${WEAR[it.key].name}`, price: (it.basePrice ?? it.price) + 4, keep: true, desc: `WEAR IT: brand-new in ${nm.toLowerCase()}!` };
    });
  }
  return genBatch(theme, vendor, n);
}

// ---------- selling: what your gathered things are worth ----------
const SELL_PRICE = {
  fish: 4, "ice crystal shard": 5, "crystal fragment": 5, "glowing moss": 4, "moon petal": 5, "cheese chunk": 8, "owl feather": 6,
  "ancient seed": 8, "sap droplet": 3, feather: 2, "beetle shell": 2, "glowing mushroom": 3, "medicinal mushroom": 3,
  "honey drop": 4, "bee wax": 4, nectar: 2, "lavender flower": 2, egg: 2, carrot: 2, beet: 2, squash: 2,
  pumpkin: 6, sunflower: 4, strawberry: 3, milk: 3, butter: 7, "cheese wheel": 14, "frost quartz": 9, amethyst: 12, "rose ice": 10, moonstone: 22, "water lily": 4, "iris bouquet": 5, "marsh marigold": 3, "moon lotus bloom": 10, "tiny bead": 3, "human button": 3, "tiny button": 2, "glass fragment": 3, "tiny trinket": 4, "butter bit": 3, string: 2,
};
// 🌕 the Moon-Pressed Coin (+25%) and every Quest Book treasure (+5% each, to +50%) raise what things sell for
const sellBonus = () => sellMult() * (1 + (S.owned && S.owned.moonpressedcoin ? 0.25 : 0) + Math.min(0.5, 0.05 * (S.questPerks || 0)) + power("luck")) * (window.__wwGoldenRain && window.__wwGoldenRain() ? 2 : 1); // (✨ golden rain: double!)
const sellPrice = (k) => Math.max(1, Math.round((SELL_PRICE[k] ?? 1) * sellBonus()));
export const sellableKeys = () => Object.keys(SELL_PRICE);
export const setSellPrice = (k, v) => (SELL_PRICE[k] = v);
// (the same plain key the pack uses: "Carrots" → "carrot", "Water Lilies" → "water lily")
const itemKey = (n) => {
  let k = n.toLowerCase().trim();
  if (k.endsWith("ies")) k = k.slice(0, -3) + "y";
  else if (k.endsWith("s") && !k.endsWith("ss")) k = k.slice(0, -1);
  return k;
};
// each city pays DOUBLE for the things it needs most
const WANTED = {
  reedmere: ["fish", "string", "cloth scrap", "root fiber"],
  golden: ["berry", "clover seed", "oat grain", "flower petal"],
  frostpine: ["pine needle", "moss", "twig", "dry grass"],
};

// ---------- 🍲 HANGOUTS: cozy places to eat, rest and overhear the gossip ----------
const HANGOUTS = {
  reedmere: [
    { name: "The Salty Barnacle", at: { x: -62, z: -40 }, color: 0x5a7a8a, roof: 0x3a4a5a, host: "Cook Pickerel", hostTunic: 0x3a5a6a,
      menu: [{ icon: "🍲", name: "Clam Chowder", price: 5, heal: 30 }, { icon: "🦐", name: "Crunchy Shrimp", price: 3, heal: 12 }],
      gossip: [["A sailor, rocking on his stool", "I've sailed this lagoon forty years and I swear the lighthouse winked at me last night."], ["His friend, laughing", "That's the chowder talking, Barnacle-Bill. It's always the chowder."]] },
    { name: "The Heron's Rest", at: { x: 70, z: 30 }, color: 0xc8b88a, roof: 0x7a6a3a, host: "Innkeeper Tansy-Reed", hostTunic: 0x8a7a4a,
      menu: [{ icon: "🫖", name: "Marsh-Mint Tea", price: 3, heal: 15 }, { icon: "🥞", name: "Reed-Flour Pancakes", price: 5, heal: 25 }],
      gossip: [["A traveler with a map", "They say Golden Hollow's cooks will trade a whole pie for one good fish. Imagine!"], ["A raft-builder", "Seen the new raft races? Captain Skiff's record won't last long now."]] },
  ],
  golden: [
    { name: "The Sunflower Bakery", at: { x: -70, z: 30 }, color: 0xf0d870, roof: 0xb8783a, host: "Baker Poppy", hostTunic: 0xe8b85a,
      menu: [{ icon: "🌻", name: "Sunflower Loaf", price: 4, heal: 20 }, { icon: "🥧", name: "Apple Turnover", price: 5, heal: 28 }],
      gossip: [["A farmer with flour on his nose", "Dottie's hens laid DOUBLE this morning. Double! I blame the new Moonkeeper."], ["The farmer's daughter", "Pa, that's not how hens work."]] },
    { name: "The Hay Bale Inn", at: { x: 72, z: 8 }, color: 0xb8884a, roof: 0x8a5a2a, host: "Innkeeper Bramble-Ann", hostTunic: 0xa86a3a,
      menu: [{ icon: "🥣", name: "Barley Porridge", price: 3, heal: 18 }, { icon: "🧈", name: "Butter Toast", price: 2, heal: 10 }],
      gossip: [["A cowherd", "The Cooking Competition judges are fussy, I tell you. Sweet, savory AND green, or you get bronze."], ["A miller", "Aye, and don't you dare bring them a three-cheese pie. They SULK."]] },
  ],
  frostpine: [
    { name: "The Woodsmoke Tavern", at: { x: 82, z: 22 }, color: 0x6a4a30, roof: 0xf4f8ff, host: "Tavern-Mouse Ember", hostTunic: 0xa85a2a,
      menu: [{ icon: "🍖", name: "Hunter's Stew", price: 6, heal: 35, warm: true }, { icon: "🍵", name: "Spiced Pine Tea", price: 3, heal: 12, warm: true }],
      gossip: [["A woodcutter by the fire", "Snow Boots AND a scarf, that's the trick. Welt and Purl'll sort you out."], ["A trapper", "The sled race? Hug the inside of the gates and you'll fly round."]] },
    { name: "The Snowberry Bakehouse", at: { x: -80, z: 40 }, color: 0xe8d0d8, roof: 0xf4f8ff, host: "Baker Frost-Fern", hostTunic: 0xc87aa0,
      menu: [{ icon: "🫐", name: "Snowberry Muffin", price: 4, heal: 22 }, { icon: "🥨", name: "Honey Pretzel", price: 3, heal: 15 }],
      gossip: [["A mother with a basket", "My little Bryn hasn't stopped talking about the mouse who found her mittens."], ["An old ranger", "The hot springs out west fix any cold. Just don't fall asleep in them."]] },
  ],
};

// ---------- 🏁 the extra races & challenges ----------
const CHALLENGES = {
  reedmere: [{
    key: "swim", name: "Lagoon Swim", mode: "swim",
    official: { name: "Coach Minnow", at: { x: -54, z: 22 }, tunic: 0x3a8ac8 },
    intro: "The Lagoon Swim! No rafts allowed — just you and your paddling paws, through every golden arch.",
    go: "Swim through every golden arch!",
    start: { x: -48, z: 16, face: Math.PI * 1.2 },
    rings: [{ x: -38, z: 14 }, { x: -28, z: 4 }, { x: -20, z: -10 }, { x: -30, z: -22 }, { x: -42, z: -8 }, { x: -44, z: 10 }],
    medals: { gold: 14, silver: 19, bronze: 28 },
  }],
  golden: [{
    key: "dash", name: "Hay Bale Dash", mode: "run",
    official: { name: "Starter Haywood", at: { x: 26, z: 64 }, tunic: 0xd8a83a },
    intro: "The Hay Bale Dash! Once round the Harvest Hall through every golden arch — sprint (Shift) when you can!",
    go: "Run (and sprint!) through every golden arch!",
    start: { x: 20, z: 60, face: Math.PI * 0.6 },
    rings: Array.from({ length: 9 }, (_, k) => {
      const a = Math.PI * 0.4 + ((k + 1) / 9) * Math.PI * 2;
      return { x: Math.cos(a) * 62, z: Math.sin(a) * 62, face: -a };
    }),
    medals: { gold: 18, silver: 25, bronze: 35 },
  }],
  frostpine: [{
    key: "climb", name: "Summit Climb", mode: "climb",
    official: { name: "Climb Judge Crag", at: { x: 5, z: -48 }, tunic: 0x6a6a7a },
    intro: "The Summit Climb! Up the ice ledges to the Beacon — jump, and double-jump, as fast as you dare.",
    go: "Climb to every golden arch — all the way to the top!",
    start: { x: 0, z: -50, face: Math.PI },
    rings: (city) => [...[4, 9, 14, 19].map((i) => city.props.ledges[i]), city.spots.summit].map((l) => ({ x: l.x, z: l.z, y: l.y })),
    medals: { gold: 30, silver: 45, bronze: 70 },
  }, {
    key: "reindeer", name: "Reindeer Race", mode: "run", ride: { speed: 30, reindeer: true },
    official: { name: "Reindeer-Herder Bells", at: { x: -8, z: 64 }, tunic: 0xa83a3a },
    intro: "The Reindeer Race! Up you get on Dasher — he runs on his own, you steer with A and D. Through every golden arch!",
    go: "Steer Dasher (A/D) through every golden arch!",
    start: { x: -4, z: 62, face: Math.PI / 2 },
    rings: Array.from({ length: 10 }, (_, k) => {
      const a = Math.PI / 2 + ((k + 1) / 10) * Math.PI * 2;
      return { x: Math.cos(a) * 52, z: 10 + Math.sin(a) * 52, face: -a }; // (round the town, clear of the Summit)
    }),
    medals: { gold: 20, silver: 27, bronze: 38 },
  }],
};
/** a little mouse-sized pony */
export function buildPony(coat = 0xb8844a) {
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 1.2), M(coat));
  body.position.y = 0.85;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), M(coat));
  neck.position.set(0, 1.2, 0.55);
  neck.rotation.x = 0.4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.5), M(coat));
  head.position.set(0, 1.45, 0.78);
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.28), M(0x4a2e1a));
  mane.position.set(0, 1.28, 0.48);
  mane.rotation.x = 0.4;
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.45), M(0x7a2a2a));
  saddle.position.set(0, 1.12, -0.05);
  g.add(body, neck, head, mane, saddle);
  for (const sx of [-0.1, 0.1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), M(coat));
    ear.position.set(sx, 1.64, 0.7);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), M(0x1a1a1a));
    eye.position.set(sx * 1.45, 1.5, 0.9);
    g.add(ear, eye);
  }
  const legs = [];
  for (const [lx, lz] of [[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.13), M(coat));
    leg.geometry.translate(0, -0.31, 0);
    leg.position.set(lx, 0.65, lz);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.15), M(0x2a2018));
    hoof.position.y = -0.6;
    leg.add(hoof);
    g.add(leg);
    legs.push(leg);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), M(0x4a2e1a));
  tail.geometry.translate(0, -0.25, 0);
  tail.position.set(0, 1.0, -0.62);
  tail.rotation.x = 0.4;
  g.add(tail);
  g.userData = { legs, tail };
  return g;
}

// ---------- 🌱 the farms you can buy ----------
const VEG_FARM = {
  key: "farm", at: { x: -82, z: 2 }, price: 30, icon: "🌱", water: true, agent: "Land-Agent Furrow",
  title: "Thistle's Farm", forSale: "LAND FOR SALE", buyLabel: "buy this plot of land", plantLabel: "plant seeds in this bed", pickTitle: "🌱 What will you plant?",
  boughtMsg: "🌱 The land is YOURS! Buy seeds at a bed (E), water them from the pump, then harvest and sell.",
  crops: {
    carrot: { icon: "🥕", name: "Carrots", seed: 2, grow: 40, yield: 3, color: 0xe86a2a },
    pumpkin: { icon: "🎃", name: "Pumpkins", seed: 5, grow: 75, yield: 2, color: 0xe08a2a },
    sunflower: { icon: "🌻", name: "Sunflowers", seed: 3, grow: 55, yield: 3, color: 0xffd84a },
    strawberry: { icon: "🍓", name: "Strawberries", seed: 4, grow: 50, yield: 4, color: 0xd83a4a },
  },
};
const CRYSTAL_FARM = {
  key: "crystalFarm", at: { x: 56, z: -8 }, price: 80, icon: "💎", water: false, agent: "Gem-Warden Glint", soil: 0x5a5e6a,
  title: "Thistle's Crystal Farm", forSale: "CRYSTAL FARM FOR SALE", buyLabel: "buy the crystal farm", plantLabel: "plant a crystal seed", pickTitle: "💎 Which crystal will you grow?",
  growNote: "Crystals grow on their own in the cold — come back when they glow.",
  boughtMsg: "💎 The crystal farm is YOURS! Plant crystal seeds (E at a stone bed) — they grow glowing in the frost.",
  crops: {
    frostquartz: { icon: "💠", name: "Frost Quartz", seed: 6, grow: 60, yield: 2, color: 0x9fd8ff },
    amethyst: { icon: "🔮", name: "Amethyst", seed: 8, grow: 80, yield: 2, color: 0xb88aff },
    roseice: { icon: "💗", name: "Rose Ice", seed: 7, grow: 70, yield: 2, color: 0xff9ad0 },
    moonstone: { icon: "🌙", name: "Moonstone", seed: 12, grow: 110, yield: 1, color: 0xe8f0ff },
  },
};
const FLOWER_FARM = {
  key: "flowerFarm", at: { x: 34, z: -66 }, price: 50, icon: "🌸", water: false, agent: "Gardener Lilith", soil: 0x3a4a2a, leaf: 0x3a8a5a,
  title: "Thistle's Flower Garden", forSale: "GARDEN FOR SALE", buyLabel: "buy the flower garden", plantLabel: "plant flower bulbs", pickTitle: "🌸 What will you grow?",
  growNote: "Lagoon water feeds the beds — no watering needed!",
  boughtMsg: "🌸 The flower garden is YOURS! The lagoon keeps the beds watered — plant bulbs and pick bouquets to sell.",
  crops: {
    waterlily: { icon: "🪷", name: "Water Lilies", seed: 3, grow: 45, yield: 3, color: 0xffb8d8 },
    iris: { icon: "💜", name: "Iris Bouquets", seed: 3, grow: 40, yield: 3, color: 0x6a6ae8 },
    marigold: { icon: "🌼", name: "Marsh Marigolds", seed: 2, grow: 35, yield: 4, color: 0xffd23a },
    lotus: { icon: "🌸", name: "Moon Lotus Blooms", seed: 8, grow: 90, yield: 2, color: 0xf8f4ff },
  },
};

// ---------- what townsfolk say ----------
const CHATTER = {
  reedmere: [
    "The lighthouse! You can see it from the far reeds now.",
    "Mind the herons. They look at mice like snacks.",
    "Best fishing's off the end of the jetty, everyone knows that.",
    "Have you raced the lagoon yet? Captain Skiff's record is fierce.",
    "My nan says the Moonkeepers used to sail right up to our docks.",
    "Smoked fish from Brill's stall — trust me.",
  ],
  golden: [
    "Three hundred Harvest Feasts! And this one was the best.",
    "The cows like a scratch behind the ears.",
    "Dottie's hens are eating like piglets again, thanks to you.",
    "Try the Chicken Feeding Contest — it's harder than it sounds!",
    "Golden Hollow grain feeds half the Alliance, you know.",
    "Mind the windmill blades, little one.",
  ],
  frostpine: [
    "Stay near a fire, stranger. The cold's no joke.",
    "The Beacon's lit! First time in a month I've slept well.",
    "Sled Race today? The course goes right round the town.",
    "Treacle's toffee will fix your teeth together for a week.",
    "The Hall of Everfrost remembers every name. Even yours now!",
    "Snow Boots from Welt. Best purchase I ever made.",
  ],
};
const CROWD_NAMES = {
  reedmere: ["Reedmere fisher", "Raft-builder", "Lagoon mouse", "Net-weaver"],
  golden: ["Golden Hollow farmer", "Field hand", "Plains mouse", "Miller"],
  frostpine: ["Frostpine trapper", "Woodcutter", "Snow-ranger", "Frostpine mouse"],
};

// ---------- side adventures ----------
const ADVENTURES = {
  reedmere: [
    { key: "pearl", giver: { name: "Old Nan", at: { x: -22, z: 64 }, tunic: 0x8a7a9a },
      ask: ["My grandmother's pearl! I dropped it on the muddy shore, out east where the reeds grow thick. These old eyes can't find it."],
      finds: [{ at: { x: 38, z: -36 }, label: "pick up the pearl", icon: "⚪" }],
      thanks: "My pearl! Oh, you dear. Here — for your trouble.", coins: 12 },
    { key: "nets", giver: { name: "Netmender Juno", at: { x: 30, z: 62 }, tunic: 0x6a5a3a },
      ask: ["The storm tore every net in Reedmere. I need STRING to mend them — 2 lengths. The giants' campsite has plenty, they say."],
      deliver: [["String", 2]],
      thanks: "Perfect! Every fisher in Reedmere will thank you.", coins: 14 },
    { key: "bottle", giver: { name: "Postmistress Dabble", at: { x: -32, z: 70 }, tunic: 0x4a6a8a },
      ask: ["There's a message in a bottle bobbing out in the lagoon — north-west. Fetch it? You'll need to swim or take your raft!"],
      finds: [{ at: { x: -30, z: -20 }, label: "grab the floating bottle", icon: "🍾", water: true }],
      thanks: "\"To whoever finds this: the Moonkeepers' road to Reedmere is open again.\" …Why, that's YOUR doing!", coins: 12 },
  ],
  golden: [
    { key: "milk", giver: { name: "Dairymaid Posy", at: { x: -46, z: -52 }, tunic: 0xd8a8c8 },
      ask: ["Milking time and my paws are full! Milk three of the cows in the pasture for me — walk up to one and press E."],
      cows: 3,
      thanks: "Three full pails! Here's your share, love.", coins: 14 },
    { key: "calf", giver: { name: "Farmer Hob", at: { x: -48, z: -38 }, tunic: 0x7a5a3a },
      ask: ["Little Clover-Bell, my calf, has wandered off into the wheat again. East, I think — can you find her?"],
      finds: [{ at: { x: 54, z: 42 }, label: "lead the calf home", icon: "🐮", calf: true }],
      thanks: "There's my girl! Thank you, thank you.", coins: 12 },
    { key: "scarecrow", giver: { name: "Old Wattle", at: { x: 46, z: 4 }, tunic: 0x9a8a5a },
      ask: ["The crows knocked my scarecrow flat! Bring me three bundles of straw from the fields and we'll build him again."],
      finds: [
        { at: { x: -50, z: 16 }, label: "gather the straw bundle", icon: "🌾" },
        { at: { x: 30, z: 58 }, label: "gather the straw bundle", icon: "🌾" },
        { at: { x: -24, z: 46 }, label: "gather the straw bundle", icon: "🌾" },
      ],
      thanks: "Up he goes! The crows won't dare. Here — you've earned this.", coins: 14, scarecrow: { x: 50, z: 8 } },
  ],
  frostpine: [
    { key: "mittens", giver: { name: "Little Bryn", at: { x: -24, z: 72 }, tunic: 0xc85a5a },
      ask: ["I lost my mittens playing in the snow! One's out west by the big rocks, and one's way round to the east…"],
      finds: [
        { at: { x: -72, z: -38 }, label: "pick up the mitten", icon: "🧤" },
        { at: { x: 64, z: -56 }, label: "pick up the mitten", icon: "🧤" },
      ],
      thanks: "My mittens! My paws were SO cold. You're the best!", coins: 12 },
    { key: "icefish", giver: { name: "Cook Maple", at: { x: -34, z: 22 }, tunic: 0x9a6a3a },
      ask: ["Fish stew tonight — if someone catches the fish. There's an ice-fishing hole on the frozen lake. Be a dear?"],
      finds: [{ at: { x: 36, z: -24 }, label: "fish through the ice hole", icon: "🎣", ice: true }],
      thanks: "A beauty! Stew for the whole town. Take this.", coins: 14 },
    { key: "sculpture", giver: { name: "Sculptor Rime", at: { x: 64, z: 34 }, tunic: 0xb8c8e8 },
      ask: ["I'm carving a snow-mouse for the square — in YOUR honor! I need three perfect snowballs. Look for the sparkly drifts."],
      finds: [
        { at: { x: 74, z: 4 }, label: "roll a perfect snowball", icon: "⚪" },
        { at: { x: 82, z: -28 }, label: "roll a perfect snowball", icon: "⚪" },
        { at: { x: -84, z: 18 }, label: "roll a perfect snowball", icon: "⚪" },
      ],
      thanks: "Look at her! A snow-Thistle, for the whole town to see.", coins: 16, sculpture: { x: 60, z: 30 } },
  ],
};

// 🍴 every food in the shops + cafés is known to the bag (so you can eat it later)
{
  const all = [...Object.values(MARKETS).flatMap((m) => m.stalls.flatMap((st) => st.items)), ...Object.values(RESTOCK).flat(2), ...Object.values(HANGOUTS).flat().flatMap((h) => h.menu || [])];
  for (const it of all) if (it && it.heal) registerFood(it);
}

// ======================================================================
export function initCityLife(city, api) {
  const id = city.id;
  const G = city.group;
  const H = city.height;
  const me = () => api.mouse.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, ...extra });
  const glow = (color, size = 2.4) => {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(size);
    return h;
  };
  const live = [];
  const addCol = (x, z, r) => city.colliders.push({ x, z, r });

  // ---------- the zones the new district keeps clear of ----------
  const market = MARKETS[id];
  const keepClear = [
    { x: market.center.x, z: market.center.z, r: 17 },
    { x: 0, z: 70, r: 14 }, // the arrival
  ];
  if (id === "golden") keepClear.push({ x: -82, z: 2, r: 11 }, { x: 62, z: -40, r: 17 }, { x: -64, z: -56, r: 21 }, { x: 60, z: 66, r: 12 }, { x: -72, z: 62, r: 10 }, { x: -30, z: 72, r: 10 }, { x: 44, z: 74, r: 12 });
  if (id === "reedmere") keepClear.push({ x: 70, z: -20, r: 10 }, { x: -64, z: 26, r: 9 }, { x: 34, z: -66, r: 11 });
  if (id === "frostpine") keepClear.push({ x: 22, z: 80, r: 10 }, { x: -30, z: -40, r: 9 }, { x: 56, z: -8, r: 11 });
  if (id === "golden") keepClear.push({ x: -40, z: 48, r: 12 });
  if (id === "frostpine") keepClear.push({ x: 0, z: 92, r: 10 }, { x: -72, z: -30, r: 12 }, { x: 78, z: -42, r: 14 }, { x: -50, z: 70, r: 11 });
  if (id === "reedmere") keepClear.push({ x: 44, z: 56, r: 12 }, { x: 58, z: -62, r: 12 });
  for (const h of HANGOUTS[id]) keepClear.push({ x: h.at.x, z: h.at.z, r: 12 });
  const clear = (x, z, pad = 0) => keepClear.every((k) => Math.hypot(x - k.x, z - k.z) > k.r + pad);

  // ---------- 🏘️ the new outer district ----------
  const HOME = {
    reedmere: { wall: 0xb8a86a, roof: 0x8a7a3a, r: [86, 100] },
    golden: { wall: 0xe8d8b0, roof: 0xb8783a, r: [82, 98] },
    frostpine: { wall: 0x6a4a30, roof: 0xf4f8ff, r: [78, 102] },
  }[id];
  const wallMat = M(HOME.wall);
  const roofMat = M(HOME.roof);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffc870 });
  const doorMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // (doors: fully black)
  let homes = 0;
  for (let ring = 0; ring < 2; ring++) {
    const n = 16 + ring * 4;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + ring * 0.21;
      const r = HOME.r[ring];
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!clear(x, z, 4)) continue;
      if (id === "frostpine" && Math.abs(r - 92) < 6) continue; // (the sled course)
      const y = H(x, z);
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = Math.atan2(-x, -z); // door facing the middle of town
      const big = 2.6 + ((k * 7) % 3) * 0.4;
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(big, big * 1.05, 3.6, 10), wallMat);
      wall.position.y = 1.8;
      const roof = new THREE.Mesh(id === "golden" ? new THREE.ConeGeometry(big * 1.3, 2.8, 4) : new THREE.ConeGeometry(big * 1.25, 3, 10), roofMat);
      roof.position.y = 5;
      if (id === "golden") roof.rotation.y = Math.PI / 4;
      const door = new THREE.Mesh(new THREE.CircleGeometry(big * 0.4, 12), doorMat);
      // (in FRONT of the wall's flared, faceted edge — or a stripe of wall shows through)
      door.position.set(0, big * 0.42, big * 1.07 + 0.05);
      const win = new THREE.Mesh(new THREE.CircleGeometry(big * 0.22, 8), winMat);
      win.position.set(Math.sin(0.63) * big * 1.08, 2.2, Math.cos(0.63) * big * 1.08); // (clear of the wall's edge too)
      win.rotation.y = 0.63;
      g.add(wall, roof, door, win);
      if (id === "frostpine") {
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), M(0x5a5450));
        chimney.position.set(-big * 0.5, 5.8, 0);
        g.add(chimney);
      }
      G.add(g);
      addCol(x, z, big + 0.4);
      homes++;
    }
  }
  // lanterns along the new streets
  const lampPost = (x, z) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.8, 5), M(0x3a2a1a));
    pole.position.set(x, H(x, z) + 1.4, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), winMat);
    lamp.position.set(x, H(x, z) + 3, z);
    G.add(pole, lamp);
  };
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const x = Math.cos(a) * 92;
    const z = Math.sin(a) * 92;
    if (clear(x, z) && !(id === "frostpine")) lampPost(x, z);
  }

  // ---------- 🐭 townsfolk out walking ----------
  const walkRings = { reedmere: [66, 76, 108], golden: [70, 76, 106], frostpine: [84, 100, 108] }[id];
  const crowd = [];
  for (let i = 0; i < 20; i++) {
    const tunic = new THREE.Color().setHSL((i * 0.137) % 1, 0.35, 0.45).getHex();
    const m = buildThistle({ tunicColor: tunic, hoodColor: tunic, pack: i % 4 === 0 });
    m.scale.setScalar(0.85 + (i % 3) * 0.1);
    G.add(m);
    const p = {
      key: "crowd" + i, name: CROWD_NAMES[id][i % 4], mesh: m, walking: true,
      ring: walkRings[i % 3], ang: (i / 20) * Math.PI * 2 * 3.1, dir: i % 2 ? 1 : -1, speed: 2.2 + (i % 5) * 0.35,
      pause: 0, line: CHATTER[id][i % CHATTER[id].length], x: 0, z: 0,
    };
    crowd.push(p);
    city.people[p.key] = p;
  }
  live.push((t, dt) => {
    for (const p of crowd) {
      const u = p.mesh.userData;
      if (u.lookAt) {
        p.mesh.rotation.y = Math.atan2(u.lookAt.x - p.x, u.lookAt.z - p.z);
        continue;
      }
      if (p.pause > 0) {
        p.pause -= dt;
        if (u.legL) u.legL.rotation.x = u.legR.rotation.x = 0;
      } else {
        p.ang += (p.dir * p.speed * dt) / p.ring;
        if (Math.random() < dt * 0.06) p.pause = 2 + Math.random() * 4; // stop for a chat / a look round
        if (Math.random() < dt * 0.02) p.dir *= -1;
        const sw = Math.sin(t * 9 + p.ring);
        if (u.legL) {
          u.legL.rotation.x = sw * 0.6;
          u.legR.rotation.x = -sw * 0.6;
        }
        if (u.armL) {
          u.armL.rotation.x = -sw * 0.4;
          u.armR.rotation.x = sw * 0.4;
        }
      }
      p.x = Math.cos(p.ang) * p.ring;
      p.z = Math.sin(p.ang) * p.ring;
      p.mesh.position.set(p.x, H(p.x, p.z), p.z);
      // face along the street
      p.mesh.rotation.y = Math.atan2(-Math.sin(p.ang) * p.dir, Math.cos(p.ang) * p.dir);
    }
  });

  // ---------- talking ----------
  function talk(p, lines, after) {
    const m = me();
    p.mesh.userData.lookAt = m;
    api.mouse.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
    const dx = m.x - p.x;
    const dz = m.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = [p.x, H(p.x, p.z) + 0.65 * p.mesh.scale.x, p.z];
    const shots = lines.map((text) => ({
      dur: 2.4,
      from: () => [m.x + ux * 1.6 - uz * 0.8, m.y + 1.1, m.z + uz * 1.6 + ux * 0.8],
      look: head,
      who: p.name,
      text,
    }));
    shots[shots.length - 1].end = () => {
      p.mesh.userData.lookAt = null;
      if (after) after();
    };
    return playCutscene(shots);
  }
  const fixedPerson = (name, at, tunic, face = null, scale = 1) => {
    const m = buildThistle({ tunicColor: tunic, hoodColor: tunic, pack: false });
    m.scale.setScalar(scale);
    m.position.set(at.x, H(at.x, at.z), at.z);
    m.rotation.y = face ?? Math.atan2(-at.x, -at.z);
    m.userData.face = m.rotation.y;
    G.add(m);
    const p = { key: name, name, mesh: m, x: at.x, z: at.z };
    city.people["x-" + name] = p;
    return p;
  };

  // ---------- 🛍️ the market ----------
  const C = market.center;
  const stallNpcs = market.stalls.map((stall, i) => {
    const a = (i / market.stalls.length) * Math.PI * 2 + Math.PI / 4;
    const x = C.x + Math.cos(a) * 8;
    const z = C.z + Math.sin(a) * 8;
    const g = new THREE.Group();
    g.position.set(x, H(x, z), z);
    g.rotation.y = Math.atan2(C.x - x, C.z - z);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 1.4), M(0x8a5e36));
    counter.position.set(0, 0.55, 0);
    g.add(counter);
    for (const sx of [-1.9, 1.9]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 5), M(0x5a3e24));
      post.position.set(sx, 1.7, -0.6);
      g.add(post);
    }
    // striped awning
    for (let k = 0; k < 6; k++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.4 / 6, 0.1, 2.2), M(market.awning[k % 2]));
      stripe.position.set(-2.2 + 4.4 / 12 + (k * 4.4) / 6, 3.3, 0.1);
      stripe.rotation.x = -0.25;
      g.add(stripe);
    }
    // goods on the counter
    for (let k = 0; k < 5; k++) {
      const good = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), M(new THREE.Color().setHSL((i * 0.23 + k * 0.11) % 1, 0.6, 0.55).getHex()));
      good.position.set(-1.4 + k * 0.7, 1.3, 0.2);
      g.add(good);
    }
    G.add(g);
    addCol(x, z, 2.2);
    // the vendor stands behind the counter
    const vx = x + (x - C.x) / 8 * 1.6;
    const vz = z + (z - C.z) / 8 * 1.6;
    const v = fixedPerson(stall.vendor, { x: vx, z: vz }, stall.tunic, Math.atan2(C.x - vx, C.z - vz));
    return { stall, v, x, z };
  });
  // a sign + a fountain/brazier in the middle of the square
  {
    const centre = new THREE.Mesh(
      id === "frostpine" ? new THREE.CylinderGeometry(1.2, 1.4, 1, 10) : new THREE.CylinderGeometry(2.2, 2.6, 0.8, 16),
      M(id === "frostpine" ? 0x4a4440 : 0x9a978c)
    );
    centre.position.set(C.x, H(C.x, C.z) + 0.4, C.z);
    G.add(centre);
    addCol(C.x, C.z, id === "frostpine" ? 1.6 : 2.8);
    if (id === "frostpine") {
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 }));
      fire.position.set(C.x, H(C.x, C.z) + 1.7, C.z);
      G.add(fire);
      city.heat.push({ x: C.x, z: C.z, y: H(C.x, C.z), on: true, big: true });
      live.push((t) => fire.scale.set(1, 1 + Math.sin(t * 9) * 0.15, 1));
    } else {
      const water = new THREE.Mesh(new THREE.CircleGeometry(2, 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4aa8c8, roughness: 0.2 }));
      water.position.set(C.x, H(C.x, C.z) + 0.82, C.z);
      G.add(water);
    }
    // 🪧 big, crisp, readable from both sides (see signs.js)
    const sign = signBoard({ reedmere: "LAGOON MARKET", golden: "HARVEST MARKET", frostpine: "FROST MARKET" }[id], { w: 4.6, h: 1.15, style: "wood" });
    const sx = C.x - (C.x / Math.hypot(C.x, C.z)) * 13;
    const sz = C.z - (C.z / Math.hypot(C.x, C.z)) * 13;
    sign.position.set(sx, H(sx, sz) + 3.2, sz);
    sign.rotation.y = Math.atan2(-C.x, -C.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 5), M(0x5a3e24));
    post.position.set(sx, H(sx, sz) + 1.5, sz);
    G.add(sign, post);
  }

  // the shop card
  function openShop(stall, vendor) {
    const el = shopEl();
    const wantedNote = `<small>(${{ reedmere: "Reedmere", golden: "Golden Hollow", frostpine: "Frostpine" }[id]} pays double for ${WANTED[id].join(", ")})</small>`;
    const sellRows = () => {
      const items = api.packList().filter(([, n]) => n > 0);
      if (!items.length) return `<div class="empty">Your pack is empty — gather things in the forest, or go fishing!</div>`;
      return items
        .map(([k, n]) => {
          const pr = sellPrice(k) * (WANTED[id].includes(k) ? 2 : 1);
          const nm = k.replace(/\b\w/g, (c) => c.toUpperCase());
          return `<button class="cell" data-sell="${k}" title="Sell one ${nm}"><span class="ic">${api.iconFor(k)}</span><b>${n}</b><span class="nm">${nm}</span><span class="pr">${WANTED[id].includes(k) ? "⭐ " : ""}🪙 ${pr}</span></button>`;
        })
        .join("");
    };
    const draw = (msg = "") => {
      const oldSell = el.querySelector(".sell");
      const oldCard = el.querySelector(".card");
      const keep = { sell: oldSell ? oldSell.scrollTop : 0, card: oldCard ? oldCard.scrollTop : 0 };
      const stock = stockOf(stall);
      el.innerHTML = `<div class="card"><h3>${stall.vendor}</h3><div class="coins">🪙 ${S.coins} coins${stock.restocked ? " · ✨ fresh stock!" : ""}</div>${refreshRow(stall, draw)}${chatRow(stall, id)}
        ${stock.items.map((it) => {
          const owned = it.keep && S.owned[it.key];
          return `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>${it.desc}${powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}</small></span>
            <button data-k="${it.key}" ${owned || S.coins < it.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + it.price}</button></div>`;
        }).join("")}
        <h4>Sell from your pack ${wantedNote}</h4>
        <div class="sell">${sellRows()}</div>
        ${sellsClothes(stall) ? sellClothesHTML() : ""}
        <div class="msg">${msg}</div><div class="close">Esc — leave the stall</div></div>`;
      bindSellClothes(el, draw, api);
      el.querySelectorAll("button[data-sell]").forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.sell;
          if ((api.packCount(k) || 0) < 1) return;
          const price = sellPrice(k) * (WANTED[id].includes(k) ? 2 : 1);
          api.packTake(k, 1);
          S.coins += price;
          save();
          api.chime();
          draw(`Sold for 🪙 ${price}!`);
        };
      });
      // (stay right where you were in the lists)
      const sl = el.querySelector(".sell");
      if (sl) sl.scrollTop = keep.sell;
      const cd = el.querySelector(".card");
      if (cd) cd.scrollTop = keep.card;
      el.querySelectorAll("button[data-k]").forEach((b) => {
        b.onclick = () => {
          const before = stockOf(stall);
          const it = before.items.find((x) => x.key === b.dataset.k);
          if (!it || S.coins < it.price) return;
          S.coins -= it.price;
          bought(it.key || it.name);
          let msg = `You bought ${it.icon} ${it.name}!`;
          if (it.keep) S.owned[it.key] = true;
          if (it.keep && powerText(it.key)) msg += ` ${powerText(it.key)}!`;
          (S.tried ||= {})[it.key] = true;
          if (it.keep && WEAR[it.key]) {
            ((S.wornBy[WEAR_CITY[it.key]] ||= {})[WEAR[it.key].slot] = it.key); // put it straight on
            msg += " You put it on! (Swap outfits in your backpack — B)";
            lookChanged();
          }
          if (it.heal) msg += bagFood(it); // (into the bag — eat it when you like)
          save();
          api.chime();
          const after = stockOf(stall);
          if (after.items[0] && before.items[0] && after.items[0].key !== before.items[0].key) msg += ` — and ${stall.vendor.split(" ").pop()} brings out something NEW!`;
          draw(msg);
        };
      });
    };
    draw();
    el.classList.add("open");
    shopOpenNow = true;
    vendor.mesh.userData.lookAt = me();
    shopVendor = vendor;
  }

  // ---------- 🐄 cows (Golden Hollow) ----------
  const cows = [];
  if (id === "golden") {
    const P = { x: -64, z: -56, r: 17 };
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 5), M(0x6a4a2c));
      post.position.set(P.x + Math.cos(a) * P.r, H(P.x + Math.cos(a) * P.r, P.z + Math.sin(a) * P.r) + 0.8, P.z + Math.sin(a) * P.r);
      G.add(post);
      if (k % 7 !== 3) addCol(post.position.x, post.position.z, 0.5); // (gaps to walk in through)
    }
    const white = M(0xf4f0e8);
    const black = M(0x2a2420);
    const brown = M(0x8a5a3a);
    const pink = M(0xe8a8a0);
    const buildCow = (calf) => {
      const g = new THREE.Group();
      const s = calf ? 0.6 : 1;
      const coat = calf ? brown : white;
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.3 * s, 2.8 * s), coat);
      body.position.y = 1.7 * s;
      g.add(body);
      if (!calf) {
        for (const [px, py, pz, sz] of [[0.81, 1.9, 0.4, 0.7], [-0.81, 1.6, -0.6, 0.6], [0.2, 2.36, -0.3, 0.8]]) {
          const spot = new THREE.Mesh(new THREE.BoxGeometry(0.04 + (py > 2 ? 0.9 : 0), py > 2 ? 0.04 : 0.6, sz), black);
          spot.position.set(px * (py > 2 ? 0 : 1), py, pz);
          g.add(spot);
        }
      }
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 0.9 * s, 1 * s), coat);
      head.position.set(0, 2.3 * s, 1.75 * s);
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.5 * s, 0.4 * s), pink);
      muzzle.position.set(0, 2.05 * s, 2.3 * s);
      g.add(head, muzzle);
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.4 * s, 5), M(0xe8e0c8));
        horn.position.set(sx * 0.35 * s, 2.85 * s, 1.6 * s);
        horn.rotation.z = -sx * 0.4;
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.15 * s, 0.25 * s), coat);
        ear.position.set(sx * 0.6 * s, 2.55 * s, 1.55 * s);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 5, 4), black);
        eye.position.set(sx * 0.3 * s, 2.45 * s, 2.26 * s);
        g.add(horn, ear, eye);
      }
      const legs = [];
      for (const [lx, lz] of [[-0.55, 0.95], [0.55, 0.95], [-0.55, -0.95], [0.55, -0.95]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 1.1 * s, 0.35 * s), coat);
        leg.geometry.translate(0, -0.55 * s, 0);
        leg.position.set(lx * s, 1.1 * s, lz * s);
        g.add(leg);
        legs.push(leg);
      }
      if (!calf) {
        const udder = new THREE.Mesh(new THREE.SphereGeometry(0.35, 7, 5), pink);
        udder.position.set(0, 0.95, -0.6);
        g.add(udder);
      }
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 1.1 * s, 4), coat);
      tail.position.set(0, 1.7 * s, -1.5 * s);
      tail.rotation.x = 0.4;
      g.add(tail);
      // a bell
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.26 * s, 6), M(0xd8a83a, { metalness: 0.5 }));
      bell.position.set(0, 1.8 * s, 2.05 * s);
      g.add(bell);
      g.userData = { legs, tail };
      return g;
    };
    for (let k = 0; k < 10; k++) {
      const g = buildCow(false);
      G.add(g);
      const c = { mesh: g, x: P.x + Math.cos(k) * 8, z: P.z + Math.sin(k * 1.3) * 8, heading: k, walkT: 0, r: 1.8, walking: true, key: "cow" + k, name: "Cow", milked: false };
      cows.push(c);
      city.people[c.key] = c;
    }
    live.push((t, dt) => {
      for (const c of cows) {
        // amble, graze, turn back toward the middle at the fence
        c.walkT -= dt;
        if (c.walkT < -4) c.walkT = 3 + Math.random() * 4;
        const moving = c.walkT > 0;
        const dx = P.x - c.x;
        const dz = P.z - c.z;
        if (Math.hypot(dx, dz) > P.r - 3) c.heading = Math.atan2(dx, dz);
        else if (moving) c.heading += (Math.random() - 0.5) * dt;
        if (moving) {
          c.x += Math.sin(c.heading) * 1.1 * dt;
          c.z += Math.cos(c.heading) * 1.1 * dt;
        }
        c.mesh.position.set(c.x, H(c.x, c.z), c.z);
        c.mesh.rotation.y = c.heading;
        const sw = moving ? Math.sin(t * 5 + c.heading) * 0.35 : 0;
        c.mesh.userData.legs.forEach((l, i) => (l.rotation.x = i % 3 === 0 ? sw : -sw));
        c.mesh.userData.tail.rotation.z = Math.sin(t * 2 + c.x) * 0.3;
        c.mesh.children[2].rotation.x = moving ? 0 : 0.35 + Math.sin(t * 3 + c.z) * 0.05; // head down to graze
      }
    });
    api.cowBuilder = buildCow;
  }

  // ---------- 🗺️ adventures ----------
  S.adv[id] ||= {};
  const adv = S.adv[id];
  const advs = ADVENTURES[id].map((A) => {
    const giver = fixedPerson(A.giver.name, A.giver.at, A.giver.tunic);
    const st = (adv[A.key] ||= { state: "new", found: {}, cows: 0 });
    // the things to find
    const finds = (A.finds || []).map((f, i) => {
      const g = new THREE.Group();
      g.position.set(f.at.x, f.water ? 0.25 : H(f.at.x, f.at.z), f.at.z);
      let body;
      if (f.calf) {
        body = api.cowBuilder ? api.cowBuilder(true) : new THREE.Group();
      } else if (f.ice) {
        body = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a2a3a }));
        body.position.y = 0.12;
      } else {
        body = new THREE.Mesh(
          f.icon === "🍾" ? new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8).rotateZ(1.3) : new THREE.IcosahedronGeometry(f.icon === "⚪" ? 0.4 : 0.32, 1),
          M(f.icon === "🌾" ? 0xe8c858 : f.icon === "🧤" ? 0xc83a3a : f.icon === "🍾" ? 0x6ab89a : 0xf4f0ff, { emissive: 0x444444 })
        );
        body.position.y = 0.4;
      }
      const h = glow(0xfff2b0, 3);
      h.position.y = 1.2;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.5, 14, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      beam.position.y = 7;
      g.add(body, h, beam);
      g.visible = st.state === "active" && !st.found[i];
      G.add(g);
      return { f, g, i };
    });
    // the scarecrow / snow-sculpture once done
    let reward = null;
    if (A.scarecrow || A.sculpture) {
      const at = A.scarecrow || A.sculpture;
      reward = new THREE.Group();
      reward.position.set(at.x, H(at.x, at.z), at.z);
      if (A.scarecrow) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 5), M(0x6a4a2c));
        pole.position.y = 1.7;
        const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5).rotateZ(Math.PI / 2), M(0x6a4a2c));
        arms.position.y = 2.6;
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 6), M(0xe8c858));
        body.position.y = 2.2;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), M(0xd8a868));
        head.position.y = 3.4;
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 8), M(0x7a5a3a));
        hat.position.y = 3.9;
        reward.add(pole, arms, body, head, hat);
      } else {
        const snow = M(0xf8fbff);
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), snow);
        b1.position.y = 1;
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), snow);
        b2.position.y = 2.4;
        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6).scale(1, 1, 0.4), snow);
          ear.position.set(sx * 0.55, 3.1, 0);
          b2.parent || reward.add(ear);
        }
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6).rotateX(Math.PI / 2), M(0xe86a2a));
        nose.position.set(0, 2.4, 0.8);
        reward.add(b1, b2, nose);
      }
      reward.visible = st.state === "done";
      G.add(reward);
      addCol(at.x, at.z, 1);
    }
    // 💡 once you've done what they asked, a beam of light shines down on them
    //    so you can find your way back
    const back = new THREE.Group();
    const bx = giver.x ?? A.giver.at.x, bz = giver.z ?? A.giver.at.z;
    back.position.set(bx, H(bx, bz), bz);
    const bbeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 30, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    bbeam.position.y = 15;
    const bglow = glow(0xfff0a0, 4);
    bglow.position.y = 2.6;
    back.add(bbeam, bglow);
    back.visible = false;
    G.add(back);
    return { A, giver, st, finds, reward, back, bbeam };
  });
  const advReady = (a) =>
    (a.A.finds ? a.finds.every((f) => a.st.found[f.i]) : true) &&
    (a.A.deliver ? a.A.deliver.every(([it, n]) => api.packCount(it) >= n) : true) &&
    (a.A.cows ? a.st.cows >= a.A.cows : true);
  live.push((t) => advs.forEach((a) => {
    a.back.visible = a.st.state === "active" && advReady(a);
    if (a.back.visible) a.bbeam.material.opacity = 0.28 + Math.sin(t * 3) * 0.1;
  }));
  function advInteract() {
    for (const a of advs) {
      const { A, giver, st } = a;
      if (near(giver.x, giver.z)) {
        if (st.state === "new") {
          return { label: `talk to ${A.giver.name}`, act: () => talk(giver, A.ask, () => {
            st.state = "active";
            a.finds.forEach((f) => (f.g.visible = true));
            save();
            api.say(`🗺️ New adventure: ${A.giver.name}'s request! (A golden light marks what to find.)`, true);
          }) };
        }
        if (st.state === "active") {
          const ready =
            (A.finds ? a.finds.every((f) => st.found[f.i]) : true) &&
            (A.deliver ? A.deliver.every(([it, n]) => api.packCount(it) >= n) : true) &&
            (A.cows ? st.cows >= A.cows : true);
          if (!ready) {
            const todo = A.deliver ? `I still need ${A.deliver.map(([it, n]) => `${n} ${it}`).join(", ")}.` : A.cows ? `${st.cows}/${A.cows} cows milked.` : `You've found ${Object.keys(st.found).length}/${A.finds.length}.`;
            return { label: `talk to ${A.giver.name}`, act: () => talk(giver, [todo]) };
          }
          return { label: `talk to ${A.giver.name}`, act: () => talk(giver, [A.thanks], () => {
            if (A.deliver) for (const [it, n] of A.deliver) api.packTake(it, n);
            st.state = "done";
            if (a.reward) a.reward.visible = true;
            S.coins += A.coins;
            save();
            api.addRep(id, 1);
            api.chime();
            api.say(`🗺️ Adventure complete! +🪙 ${A.coins} coins`, true);
          }) };
        }
        return { label: `talk to ${A.giver.name}`, act: () => talk(giver, ["Thank you again, friend!"]) };
      }
      if (st.state !== "active") continue;
      for (const f of a.finds) {
        if (st.found[f.i]) continue;
        const r = f.f.water ? 3 : 2.4;
        if (!near(f.f.at.x, f.f.at.z, r)) continue;
        return { label: f.f.label, act: () => {
          if (f.f.ice) {
            playCutscene([
              { dur: 2.6, from: () => [me().x + 2, me().y + 2, me().z + 2], look: [f.f.at.x, H(f.f.at.x, f.f.at.z), f.f.at.z], text: "You drop your line through the dark hole in the ice… and wait…" },
              { dur: 2.2, from: () => [me().x + 2, me().y + 2, me().z + 2], look: [f.f.at.x, H(f.f.at.x, f.f.at.z), f.f.at.z], text: "TUG! A fat silver fish flips out onto the ice!" },
              { dur: 0.3, gameCam: true, end: () => found(a, f) },
            ]);
            return;
          }
          found(a, f);
        } };
      }
    }
    // milking: any cow, while that adventure is on
    const milk = advs.find((a) => a.A.cows && a.st.state === "active" && a.st.cows < a.A.cows);
    if (milk) {
      for (const c of cows) {
        if (c.milked || !near(c.x, c.z, 3)) continue;
        return { label: "milk the cow", act: () => {
          c.milked = true;
          milk.st.cows++;
          save();
          api.chime();
          api.say(milk.st.cows >= milk.A.cows ? "🥛 Three pails! Back to Dairymaid Posy." : `🥛 Moo! (${milk.st.cows}/${milk.A.cows})`);
        } };
      }
    }
    return null;
  }
  function found(a, f) {
    a.st.found[f.i] = true;
    f.g.visible = false;
    save();
    api.chime();
    const left = a.finds.filter((x) => !a.st.found[x.i]).length;
    api.say(left ? `✨ Found it! (${a.finds.length - left}/${a.finds.length})` : `✨ That's everything — back to ${a.A.giver.name}!`);
  }

  // ---------- 🏆 the EVENT ----------
  const EV = { running: false, t: 0, step: 0, score: 0 };
  const evHud = hudEl();
  let official = null;
  let course = []; // checkpoints / gates
  const hens = [];
  if (id === "reedmere") {
    official = fixedPerson("Captain Skiff", { x: 3.6, z: 47 }, 0x2a5a8a, Math.PI, 1.1);
    // the course: zig-zagging round the island (checkpoint rings on the water)
    for (let k = 0; k < 10; k++) {
      const a = Math.PI / 2 + (k + 1) * ((Math.PI * 2) / 10);
      const r = k % 2 ? 22 : 37;
      course.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
    course.push({ x: 0, z: 28 }); // the finish, back by the dock
    course = course.map((c, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 28), new THREE.MeshBasicMaterial({ color: 0x5ad8ff }));
      ring.position.set(c.x, 1.6, c.z);
      ring.visible = false;
      G.add(ring);
      return { ...c, ring, i };
    });
    // floating logs between the checkpoints
    const logMat = M(0x6a4a2c);
    for (let i = 0; i < course.length - 1; i++) {
      const A = course[i];
      const B = course[i + 1];
      const mx = (A.x + B.x) / 2 + (i % 2 ? 2.5 : -2.5);
      const mz = (A.z + B.z) / 2;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 3.2, 7).rotateZ(Math.PI / 2), logMat);
      log.position.set(mx, 0.3, mz);
      log.rotation.y = i * 0.7;
      G.add(log);
      addCol(mx, mz, 1.3);
    }
  }
  if (id === "golden") {
    official = fixedPerson("Judge Clementine", { x: 62, z: -24 }, 0xb85a8a, Math.PI, 1.05);
    const P = { x: 62, z: -40, r: 12 };
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * Math.PI * 2;
      if (k === 7) continue; // the gate
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 5), M(0x8a6a42));
      const x = P.x + Math.cos(a) * P.r;
      const z = P.z + Math.sin(a) * P.r;
      post.position.set(x, H(x, z) + 0.6, z);
      G.add(post);
    }
    const hm = [M(0xf4ece0), M(0xa86a3a), M(0x3a3430)];
    for (let k = 0; k < 14; k++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6).scale(1, 0.85, 1.25), hm[k % 3]);
      body.position.y = 0.5;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 7, 5), hm[k % 3]);
      head.position.set(0, 0.95, 0.45);
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.3), M(0xd83a2a));
      comb.position.set(0, 1.22, 0.45);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4).rotateX(Math.PI / 2), M(0xe8b83a));
      beak.position.set(0, 0.9, 0.74);
      const heart = glow(0xff7aa0, 1.2);
      heart.position.y = 1.8;
      heart.visible = false;
      g.add(body, head, comb, beak, heart);
      G.add(g);
      hens.push({ g, heart, x: P.x + Math.cos(k) * 6, z: P.z + Math.sin(k) * 6, h: k, full: 0, P });
    }
    live.push((t, dt) => {
      for (const h of hens) {
        // scurry about the pen (faster during the contest!)
        const sp = EV.running ? 3.4 : 1.2;
        h.h += (Math.sin(t * 0.9 + h.x) * 1.5) * dt;
        h.x += Math.sin(h.h) * sp * dt;
        h.z += Math.cos(h.h) * sp * dt;
        const dx = h.x - h.P.x;
        const dz = h.z - h.P.z;
        const d = Math.hypot(dx, dz);
        if (d > h.P.r - 1) {
          h.x = h.P.x + (dx / d) * (h.P.r - 1);
          h.z = h.P.z + (dz / d) * (h.P.r - 1);
          h.h += Math.PI * 0.7;
        }
        h.g.position.set(h.x, H(h.x, h.z) + Math.abs(Math.sin(t * 8 + h.h)) * 0.08, h.z);
        h.g.rotation.y = h.h;
        if (h.full > 0) h.full -= dt;
        h.heart.visible = h.full > 0;
      }
    });
  }
  if (id === "frostpine") {
    official = fixedPerson("Race Marshal Flurry", { x: 6, z: 96 }, 0xd83a3a, Math.PI, 1.05);
    // gates round the outer ring (flags), snowmen between them
    for (let k = 0; k < 12; k++) {
      const a = Math.PI / 2 + ((k + 1) / 12) * Math.PI * 2;
      course.push({ x: Math.cos(a) * 92, z: Math.sin(a) * 92, a });
    }
    const flagMat = [M(0xd83a3a), M(0x3a6ad8)];
    course = course.map((c, i) => {
      const g = new THREE.Group();
      for (const s of [-1, 1]) {
        const x = Math.cos(c.a) * (92 + s * 3.2);
        const z = Math.sin(c.a) * (92 + s * 3.2);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), M(0x4a4440));
        pole.position.set(x, H(x, z) + 1.5, z);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 1.1), flagMat[i % 2]);
        flag.position.set(x, H(x, z) + 2.6, z + 0.5);
        g.add(pole, flag);
      }
      const marker = glow(0x9fd8ff, 4);
      marker.position.set(c.x, H(c.x, c.z) + 1.5, c.z);
      marker.visible = false;
      g.add(marker);
      G.add(g);
      return { ...c, marker, i };
    });
    // snowmen in the way
    const snow = M(0xf8fbff);
    for (let k = 0; k < 12; k++) {
      const a = Math.PI / 2 + ((k + 1.5) / 12) * Math.PI * 2;
      const r = 92 + (k % 2 ? 1.6 : -1.6);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const g = new THREE.Group();
      g.position.set(x, H(x, z), z);
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 9, 7), snow);
      b1.position.y = 0.8;
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 9, 7), snow);
      b2.position.y = 2;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5).rotateX(Math.PI / 2), M(0xe86a2a));
      nose.position.set(0, 2, 0.6);
      g.add(b1, b2, nose);
      G.add(g);
      addCol(x, z, 1.1);
    }
  }
  const MEDALS = {
    reedmere: { gold: 26, silver: 34, bronze: 45, unit: "s", label: "time" },
    golden: { gold: 14, silver: 10, bronze: 6, unit: " hens", label: "score" },
    frostpine: { gold: 24, silver: 30, bronze: 40, unit: "s", label: "time" },
  }[id];
  const PRIZE = { gold: 30, silver: 18, bronze: 10, none: 3 };
  function startEvent() {
    EV.running = true;
    EV.t = 0;
    EV.step = 0;
    EV.score = 0;
    if (id === "reedmere") {
      api.placePlayer(0, 31, Math.PI);
      api.setRaceRaft(true);
      course.forEach((c) => (c.ring.visible = true));
    }
    if (id === "golden") {
      api.placePlayer(62, -40, 0);
      EV.t = 40; // counting DOWN
      for (const h of hens) h.full = 0;
    }
    if (id === "frostpine") {
      const a = Math.PI / 2;
      api.placePlayer(Math.cos(a) * 92, Math.sin(a) * 92, -Math.PI / 2);
      api.setRide({ speed: 34 * (S.owned.racingsled ? 1.15 : 1), sled: true });
      course.forEach((c) => (c.marker.visible = true));
    }
    api.say({ reedmere: "🛶 GO! Paddle through every blue ring in order — mind the logs!", golden: "🐔 GO! Feed as many hens as you can (E) — 40 seconds!", frostpine: "🛷 GO! Steer (A/D) through every gate — mind the snowmen!" }[id], true);
  }
  function endEvent(result) {
    EV.running = false;
    api.setRaceRaft(false);
    api.setRide(null);
    course.forEach((c) => {
      if (c.ring) c.ring.visible = false;
      if (c.marker) c.marker.visible = false;
    });
    evHud.style.display = "none";
    const better = (a, b) => (MEDALS.unit === "s" ? a <= b : a >= b);
    const medal = better(result, MEDALS.gold) ? "gold" : better(result, MEDALS.silver) ? "silver" : better(result, MEDALS.bronze) ? "bronze" : "none";
    const rank = { none: 0, bronze: 1, silver: 2, gold: 3 };
    const firstGold = medal === "gold" && S.medals[id] !== "gold";
    if (rank[medal] > rank[S.medals[id] || "none"]) S.medals[id] = medal;
    S.coins += PRIZE[medal];
    save();
    if (firstGold) api.addRep(id, 1);
    api.chime();
    const shown = MEDALS.unit === "s" ? result.toFixed(1) + "s" : result + MEDALS.unit;
    api.say(
      medal === "none"
        ? `🏁 ${shown}! No medal this time — try again! (+🪙 ${PRIZE.none})`
        : `${medal === "gold" ? "🥇 GOLD" : medal === "silver" ? "🥈 SILVER" : "🥉 BRONZE"}! ${shown} — +🪙 ${PRIZE[medal]} coins!${firstGold ? " The town cheers for you!" : ""}`,
      true
    );
  }
  function eventUpdate(t, dt) {
    if (!EV.running) return;
    evHud.style.display = "";
    if (id === "golden") {
      EV.t -= dt;
      evHud.textContent = `🐔 ${Math.max(0, EV.t).toFixed(1)}s · Hens fed: ${EV.score}  (🥇 ${MEDALS.gold})`;
      // stay in the pen
      const P = hens[0].P;
      const dx = me().x - P.x;
      const dz = me().z - P.z;
      const d = Math.hypot(dx, dz);
      if (d > P.r - 0.6) {
        me().x = P.x + (dx / d) * (P.r - 0.6);
        me().z = P.z + (dz / d) * (P.r - 0.6);
      }
      if (EV.t <= 0) endEvent(EV.score);
      return;
    }
    EV.t += dt;
    const c = course[EV.step];
    evHud.textContent = `${id === "reedmere" ? "🛶" : "🛷"} ${EV.t.toFixed(1)}s · ${id === "reedmere" ? "Ring" : "Gate"} ${EV.step + 1}/${course.length}  (🥇 under ${MEDALS.gold}s)`;
    course.forEach((k, i) => {
      const col = i < EV.step ? 0x6aff8a : i === EV.step ? 0xffd84a : 0x5ad8ff;
      if (k.ring) k.ring.material.color.set(col);
      if (k.marker) k.marker.visible = i >= EV.step;
    });
    if (near(c.x, c.z, id === "reedmere" ? 3.4 : 4)) {
      EV.step++;
      api.chime();
      if (EV.step >= course.length) endEvent(EV.t);
    }
    if (EV.t > 150) {
      api.say("⏱ Time's up — the course is closed. Try again!");
      endEvent(999);
    }
  }
  function eventInteract() {
    if (EV.running) {
      if (id === "golden") {
        for (const h of hens) {
          if (h.full > 0 || !near(h.x, h.z, 2.2)) continue;
          return { label: "feed the hen!", act: () => {
            h.full = 6;
            EV.score++;
            api.bite();
          } };
        }
      }
      return null;
    }
    if (official && near(official.x, official.z)) {
      const best = S.medals[id] ? ` Your best: ${S.medals[id]}.` : "";
      const lines = {
        reedmere: [`The Reedmere Raft Race! Round the island through all ${course.length} rings, as fast as you can. Under ${MEDALS.gold} seconds wins gold!${best} Ready?`],
        golden: [`The Chicken Feeding Contest! 40 seconds in the pen — feed every hungry hen you can catch. ${MEDALS.gold} hens wins gold!${best} Ready?`],
        frostpine: [`The Frostpine Sled Race! Once round the town through all ${course.length} gates. Under ${MEDALS.gold} seconds wins gold!${best} Ready?`],
      }[id];
      return { label: `talk to ${official.name} — enter the ${EVENT_NAMES[id]}`, act: () => talk(official, lines, startEvent) };
    }
    return null;
  }

  // ---------- 🎣 fishing, any time ----------
  const FISH_SPOTS = {
    reedmere: [{ x: 23.5, z: 23.5, bob: { x: 19, z: 23.5, y: 0.3 }, label: "fish off the jetty" }],
    frostpine: [{ x: 36, z: -21.6, bob: { x: 36, z: -24, y: H(36, -24) + 0.15 }, label: "fish through the ice hole" }],
    golden: [],
  }[id];
  const fishing = { on: false, bite: false, t: 0, spot: null, bobber: null };
  if (id === "frostpine") {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a2a3a }));
    hole.position.set(36, H(36, -24) + 0.12, -24);
    G.add(hole);
  }
  function fishInteract() {
    for (const sp of FISH_SPOTS) {
      if (!near(sp.x, sp.z, 2.4)) continue;
      if (!fishing.on) {
        return { label: sp.label, act: () => {
          fishing.on = true;
          fishing.bite = false;
          fishing.spot = sp;
          fishing.t = (2 + Math.random() * 3) * (S.owned.lure ? 0.5 : 1) * (1 - power("fish"));
          if (!fishing.bobber) {
            fishing.bobber = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4a3a }));
            G.add(fishing.bobber);
          }
          fishing.bobber.visible = true;
          fishing.bobber.position.set(sp.bob.x, sp.bob.y, sp.bob.z);
          api.say("🎣 Watch the bobber… when it SPLASHES, press E!");
        } };
      }
      return { label: fishing.bite ? "REEL IN! (now!)" : "wait for a bite…", act: () => {
        if (!fishing.bite) {
          api.say("🎣 Too soon — the fish swims off. Cast again!");
          stopFishing();
          return;
        }
        stopFishing();
        api.addToPack("Fish", 1);
        window.dispatchEvent(new CustomEvent("ww-fish")); // (the Collection Book: which fish?)
        api.chime();
        api.say(`🐟 You caught a fish! (sell it at the market for 🪙 ${sellPrice("fish") * (id === "reedmere" ? 2 : 1)})`);
      } };
    }
    return null;
  }
  function stopFishing() {
    fishing.on = false;
    fishing.bite = false;
    if (fishing.bobber) fishing.bobber.visible = false;
  }
  live.push((t, dt) => {
    if (!fishing.on) return;
    const sp = fishing.spot;
    if (!near(sp.x, sp.z, 3.2)) return stopFishing();
    if (!fishing.bite) {
      fishing.t -= dt;
      fishing.bobber.position.y = sp.bob.y + Math.sin(t * 3) * 0.04;
      if (fishing.t <= 0) {
        fishing.bite = true;
        fishing.window = 1.3;
        api.say("‼️ A BITE! Press E!");
      }
    } else {
      fishing.bobber.position.y = sp.bob.y - 0.2 + Math.sin(t * 20) * 0.08;
      fishing.window -= dt;
      if (fishing.window <= 0) {
        api.say("🎣 The fish got away! Cast again.");
        stopFishing();
      }
    }
  });

  // ---------- 🌱 YOUR FARM PLOT (Golden Hollow) ----------
  function makeFarmPlot(cfg = VEG_FARM) {
    const PLOT = cfg.at;
    const PRICE = () => cost(cfg.price, "farm:" + (cfg.key || cfg.icon)); // (🪙 grows with your adventure)
    const CROPS = cfg.crops;
    S[cfg.key] ||= { owned: false, beds: {} };
    const F = S[cfg.key];
    const y0 = H(PLOT.x, PLOT.z);
    // the fenced plot + 6 beds
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      if (k === 6) continue; // the gate
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 5), M(0x8a6a42));
      const x = PLOT.x + Math.cos(a) * 8;
      const z = PLOT.z + Math.sin(a) * 6.5;
      post.position.set(x, H(x, z) + 0.6, z);
      G.add(post);
    }
    const beds = [];
    for (let i = 0; i < 6; i++) {
      const bx = PLOT.x - 4.2 + (i % 3) * 4.2;
      const bz = PLOT.z - 2 + Math.floor(i / 3) * 4;
      const soil = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 2.4), M(cfg.soil || 0x5a3e24));
      soil.position.set(bx, H(bx, bz) + 0.12, bz);
      G.add(soil);
      const crop = new THREE.Group();
      crop.position.set(bx, H(bx, bz) + 0.3, bz);
      G.add(crop);
      beds.push({ i, x: bx, z: bz, crop });
    }
    // the sign: FOR SALE → Thistle's Farm (🪧 big, crisp, both sides — see signs.js)
    const sign = signBoard(" ", { w: 3.2, h: 1.1 });
    const drawSign = () => setSignText(sign, F.owned ? `${cfg.title}\n${cfg.water ? "plant · water · harvest" : "plant · wait · harvest"}` : `${cfg.forSale}\n🪙 ${PRICE()} coins`, F.owned ? "leaf" : FOR_SALE_STYLE);
    drawSign();
    const gx = PLOT.x + Math.cos((6 / 24) * Math.PI * 2) * 8;
    const gz = PLOT.z + Math.sin((6 / 24) * Math.PI * 2) * 6.5 + 2;
    sign.position.set(gx + 2.4, H(gx, gz) + 2.35, gz);
    sign.rotation.y = Math.atan2(-PLOT.x, -PLOT.z);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 5), M(0x5a3e24));
    sp.position.set(gx + 2.4, H(gx, gz) + 1.1, gz);
    G.add(sign, sp);
    const agent = fixedPerson(cfg.agent, { x: gx - 1.5, z: gz }, 0x8a7a4a);
    const can = { water: 0 };
    const pump = { x: PLOT.x + 7, z: PLOT.z - 6 };
    if (cfg.water) {
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), M(0x8a8880));
      p1.position.set(pump.x, H(pump.x, pump.z) + 1.1, pump.z);
      G.add(p1);
      addCol(pump.x, pump.z, 0.7);
    }
    function drawBed(b) {
      const st = F.beds[b.i];
      b.crop.clear();
      if (!st) return;
      const C = CROPS[st.crop];
      const k = st.ripe ? 1 : st.watered ? Math.min(1, (st.t || 0) / C.grow) : 0.15;
      if (cfg.key === "crystalFarm") {
        // crystals rising out of the stone, glowing brighter as they grow
        for (let n = 0; n < 5; n++) {
          const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0).scale(0.6, 1.8, 0.6), new THREE.MeshBasicMaterial({ color: C.color, transparent: true, opacity: 0.4 + k * 0.6 }));
          cr.position.set((n % 3 - 1) * 0.8, 0.3 * k + 0.05, (Math.floor(n / 3) - 0.3) * 0.9);
          cr.scale.setScalar(0.25 + k * 0.9);
          cr.rotation.z = (n % 3 - 1) * 0.3;
          b.crop.add(cr);
        }
        if (st.ripe) {
          const h = glow(C.color, 2.4);
          h.position.y = 1;
          b.crop.add(h);
        }
        return;
      }
      for (let n = 0; n < 6; n++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 5), M(st.watered ? (cfg.leaf || 0x4a8a3a) : 0x7a6a3a));
        leaf.position.set((n % 3 - 1) * 0.9, 0.45 * k, (Math.floor(n / 3) - 0.5) * 0.9);
        leaf.scale.setScalar(0.3 + k * 0.7);
        b.crop.add(leaf);
        if (st.ripe) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(st.crop === "pumpkin" ? 0.38 : 0.2, 8, 6), M(C.color, cfg.key === "flowerFarm" ? { emissive: C.color, emissiveIntensity: 0.25 } : {}));
          fruit.position.set((n % 3 - 1) * 0.9, st.crop === "sunflower" || cfg.key === "flowerFarm" ? 0.9 : 0.15, (Math.floor(n / 3) - 0.5) * 0.9);
          b.crop.add(fruit);
        }
      }
      if (st.watered && !st.ripe) {
        const drop = glow(0x6ab8ff, 0.8);
        drop.position.y = 1.2;
        b.crop.add(drop);
      }
    }
    beds.forEach(drawBed);
    live.push((t, dt) => {
      for (const b of beds) {
        const st = F.beds[b.i];
        if (!st || !st.watered || st.ripe) continue;
        st.t = (st.t || 0) + dt * (S.owned.goldenacorn ? 2 : 1) * (1 + power("grow")); // (🌰 the Golden Acorn: crops grow twice as fast · ✨ 🌱 powers)
        if (st.t >= CROPS[st.crop].grow) {
          st.ripe = true;
          save();
          api.say(`${CROPS[st.crop].icon} Your ${CROPS[st.crop].name.toLowerCase()} are ripe — harvest them!`);
        }
        if (Math.random() < dt * 0.5) drawBed(b);
      }
    });
    function seedPicker(b) {
      const el = shopEl();
      el.innerHTML = `<div class="card"><h3>${cfg.pickTitle}</h3><div class="coins">🪙 ${S.coins} coins</div>
        ${Object.entries(CROPS).map(([k, C]) => `<div class="item"><span class="ic">${C.icon}</span><span class="nm">${C.name}<small>ready in ${C.grow}s · harvest ×${C.yield} (sells for 🪙 ${sellPrice(itemKey(C.name))} each)</small></span><button data-k="${k}" ${S.coins < cost(C.seed, "seed") ? "disabled" : ""}>seeds · 🪙 ${cost(C.seed, "seed")}</button></div>`).join("")}
        <div class="close">Esc — not now</div></div>`;
      el.querySelectorAll("button[data-k]").forEach((btn) => {
        btn.onclick = () => {
          const C = CROPS[btn.dataset.k];
          const seedCost = cost(C.seed, "seed");
          if (S.coins < seedCost) return;
          S.coins -= seedCost;
          F.beds[b.i] = { crop: btn.dataset.k, watered: !cfg.water, t: 0, ripe: false };
          save();
          drawBed(b);
          el.classList.remove("open");
          shopOpenNow = false;
          api.chime();
          api.say(cfg.water ? `🌱 Planted ${C.name.toLowerCase()}! Fill your can at the pump and water them.` : `${C.icon} Planted ${C.name.toLowerCase()}! ${cfg.growNote}`);
        };
      });
      el.classList.add("open");
      shopOpenNow = true;
    }
    return {
      interactable(p) {
        // (buy from the agent, the FOR SALE sign, or the gate — wherever you walk up)
        const atSale = Math.hypot(p.x - agent.x, p.z - agent.z) < 3.2 || Math.hypot(p.x - (gx + 2.4), p.z - gz) < 3.2 || Math.hypot(p.x - gx, p.z - (gz - 2)) < 3.2;
        if (atSale && !F.owned) {
          return { label: `${cfg.buyLabel} (🪙 ${PRICE()})`, act: () => {
            if (S.coins < PRICE()) return api.say(`${cfg.icon} It costs 🪙 ${PRICE()} — you have ${S.coins}. Earn coins by selling fish, crops or gathered things at any market stall!`, true);
            S.coins -= PRICE();
            F.owned = true;
            save();
            drawSign();
            api.chime();
            api.say(cfg.boughtMsg, true);
          } };
        }
        if (!F.owned) return null;
        if (cfg.water && Math.hypot(p.x - pump.x, p.z - pump.z) < 2) return { label: "fill your watering can", act: () => { can.water = 6; api.say("💧 Can full — water your beds!"); } };
        for (const b of beds) {
          if (Math.hypot(p.x - b.x, p.z - b.z) > 2) continue;
          const st = F.beds[b.i];
          if (!st) return { label: cfg.plantLabel, act: () => seedPicker(b) };
          if (!st.watered) return can.water > 0
            ? { label: "water the bed", act: () => { can.water--; st.watered = true; save(); drawBed(b); api.say("💧 Watered — now they'll grow!"); } }
            : { label: "this bed needs water", act: () => api.say("💧 Fill your can at the pump first.") };
          if (st.ripe) return { label: `harvest the ${CROPS[st.crop].name.toLowerCase()}`, act: () => {
            const C = CROPS[st.crop];
            api.addToPack(C.name, C.yield);
            window.dispatchEvent(new CustomEvent("ww-stat", { detail: { k: "harvests" } }));
            delete F.beds[b.i];
            save();
            drawBed(b);
            api.bite();
            api.chime();
            api.say(`${C.icon} +${C.yield} ${C.name}! Sell them at any market stall.`);
          } };
          return { label: `growing… (${Math.round((st.t / CROPS[st.crop].grow) * 100)}%)`, act: () => {} };
        }
        return null;
      },
    };
  }

  // ---------- 🐄 THE DAIRY FARM (Golden Hollow) ----------
  function makeDairy() {
    const D = { x: -40, z: 48 };
    const PRICE = () => cost(90, "dairy"); // (🪙 grows with your adventure)
    S.dairy ||= { owned: false, milkT: {} };
    const F = S.dairy;
    // the barn
    const y0 = H(D.x, D.z);
    const barn = new THREE.Group();
    barn.position.set(D.x - 6, y0, D.z - 4);
    barn.rotation.y = Math.atan2(-D.x, -D.z);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), M(0xb83a2a));
    walls.position.y = 2;
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.6, 2.6, 4).rotateY(Math.PI / 4).scale(1, 1, 0.8), M(0x5a3a2a));
    roof.position.y = 5.3;
    const doorX = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), M(0xf4ece0));
    doorX.position.set(0, 1.4, 2.52);
    barn.add(walls, roof, doorX);
    G.add(barn);
    addCol(D.x - 6, D.z - 4, 3.8);
    // the pen + three dairy cows of your own
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      if (k === 5) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 5), M(0xe8e0d0));
      const x = D.x + 3 + Math.cos(a) * 7;
      const z = D.z + 3 + Math.sin(a) * 6;
      post.position.set(x, H(x, z) + 0.7, z);
      G.add(post);
    }
    const herd = [];
    for (let k = 0; k < 3; k++) {
      const cow = api.cowBuilder ? api.cowBuilder(false) : new THREE.Group();
      const x = D.x + 1 + k * 2.6;
      const z = D.z + 3 + (k % 2) * 2;
      cow.position.set(x, H(x, z), z);
      cow.rotation.y = k * 1.4;
      cow.visible = F.owned;
      G.add(cow);
      herd.push({ cow, x, z, k });
    }
    // the churn
    const churn = { x: D.x - 2, z: D.z + 9 };
    {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.3, 10), M(0x8a5e36));
      c.position.set(churn.x, H(churn.x, churn.z) + 0.65, churn.z);
      const dash = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), M(0x5a3e24));
      dash.position.set(churn.x, H(churn.x, churn.z) + 1.6, churn.z);
      G.add(c, dash);
      addCol(churn.x, churn.z, 0.8);
    }
    const agent = fixedPerson("Dairy-Mother Clover", { x: D.x + 9, z: D.z + 11 }, 0xd8a8c8);
    // the sign (🪧 big, crisp, both sides — see signs.js)
    const sign = signBoard(" ", { w: 3.2, h: 1.1 });
    const drawSign = () => setSignText(sign, F.owned ? "Thistle's Dairy\nmilk · churn · sell" : `DAIRY FOR SALE\n🪙 ${PRICE()} coins`, F.owned ? "leaf" : FOR_SALE_STYLE);
    drawSign();
    const sx = D.x + 11;
    const sz = D.z + 8;
    sign.position.set(sx, H(sx, sz) + 2.35, sz);
    sign.rotation.y = Math.atan2(-D.x, -D.z);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 5), M(0x5a3e24));
    sp.position.set(sx, H(sx, sz) + 1.1, sz);
    G.add(sign, sp);
    return {
      interactable(p) {
        if (!F.owned && Math.hypot(p.x - agent.x, p.z - agent.z) < 2.6) {
          return { label: `buy the dairy farm (🪙 ${PRICE()})`, act: () => {
            if (S.coins < PRICE()) return api.say(`🐄 The dairy costs 🪙 ${PRICE()} — you have ${S.coins}.`, true);
            S.coins -= PRICE();
            F.owned = true;
            save();
            drawSign();
            herd.forEach((h) => (h.cow.visible = true));
            api.chime();
            api.say("🐄 Three dairy cows of your very own! Milk them (E), then churn the milk into butter or cheese to sell.", true);
          } };
        }
        if (!F.owned) return null;
        for (const h of herd) {
          if (Math.hypot(p.x - h.x, p.z - h.z) > 2.6) continue;
          const wait = 40 - (Date.now() - (F.milkT[h.k] || 0)) / 1000;
          if (wait > 0) return { label: `this cow needs a rest (${Math.ceil(wait)}s)`, act: () => {} };
          return { label: "milk your cow", act: () => {
            F.milkT[h.k] = Date.now();
            save();
            api.addToPack("Milk", 2);
            api.chime();
            api.say("🥛 +2 Milk! Churn it at the butter churn.");
          } };
        }
        if (Math.hypot(p.x - churn.x, p.z - churn.z) < 2.2) {
          return { label: "churn the milk", act: () => {
            const m = api.packCount("Milk");
            if (m >= 3) {
              api.packTake("Milk", 3);
              api.addToPack("Cheese Wheel", 1);
              api.say("🧀 Churn, press, wait… a whole Cheese Wheel! (3 Milk)");
            } else if (m >= 2) {
              api.packTake("Milk", 2);
              api.addToPack("Butter", 1);
              api.say("🧈 Churn, churn, churn… golden Butter! (2 Milk)");
            } else return api.say("🥛 You need at least 2 Milk to churn.");
            api.bite();
            api.chime();
          } };
        }
        return null;
      },
    };
  }

  // ---------- ✨ MAGIC + LORE: what makes each city feel enchanted and old ----------
  function addMagic() {
    // 🪨 lore stones: the history of the place, carved for travelers
    const LORE = {
      reedmere: [
        { at: { x: -14, z: 62 }, title: "The Founding of Reedmere", text: "Reedmere was founded by raft-folk fleeing a great flood. They tied their rafts together in the lagoon — and never untied them. Every floating home is a raft that was never cut loose." },
        { at: { x: 56, z: 8 }, title: "The Lighthouse of Reeds", text: "Built in a single night by a hundred mice holding torches, so that the first Moonkeeper could find her way across the water in a storm. Her name was Renata Josephine Rudy." },
        { at: { x: -40, z: -54 }, title: "The Drowned Library", text: "Beneath the flooded ruins lies a library older than the Alliance. Divers say that on still nights you can hear its pages turning." },
      ],
      golden: [
        { at: { x: 14, z: 30 }, title: "The First Harvest", text: "Golden Hollow's first grain was a gift from Everbough: one sack of seed, carried by Renata Josephine Rudy herself. Every Harvest Feast begins by planting one seed in her honor." },
        { at: { x: -64, z: -26 }, title: "The Windmill That Sings", text: "On windy evenings the old windmill hums a tune no one remembers learning. The millers say it is the song of the first Feast." },
        { at: { x: 40, z: 46 }, title: "The Harvest Moon", text: "Once a year, the moon rises gold over the fields. That night every scarecrow in the Hollow is said to bow." },
      ],
      frostpine: [
        { at: { x: -12, z: 50 }, title: "The Northern Pact", text: "Frostpine joined the Alliance last, after Renata Josephine Rudy spent a whole winter in the snows teaching the first Wardens to light signal fires on the peaks." },
        { at: { x: 34, z: 8 }, title: "The Aurora Weavers", text: "The lights in the northern sky are woven by the spirits of old Moonkeepers, the Frostpine elders say — one ribbon for every road they walked." },
        { at: { x: -50, z: -12 }, title: "The Ice That Remembers", text: "The Hall of Everfrost was carved from a glacier that holds a thousand frozen whispers. Lay your paw on the ice and you may hear one." },
      ],
    }[id];
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff });
    for (const L of LORE) {
      const g = new THREE.Group();
      g.position.set(L.at.x, H(L.at.x, L.at.z), L.at.z);
      g.rotation.y = Math.atan2(-L.at.x, -L.at.z);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.5), M(0x8a8a82));
      slab.position.y = 1.1;
      const read0 = !!(S.lore && S.lore[L.title]);
      const myRune = new THREE.MeshBasicMaterial({ color: read0 ? 0xffd36a : 0x9fd8ff }); // gold once read
      const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 14, Math.PI * 1.3), myRune);
      crescent.position.set(0, 1.7, 0.27);
      crescent.rotation.z = 0.5;
      const lines = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0x5a7a9a }));
      lines.position.set(0, 0.95, 0.26);
      const h = glow(0x9fd8ff, 1.6);
      h.position.set(0, 1.7, 0.4);
      h.visible = !read0;
      g.add(slab, crescent, lines, h);
      G.add(g);
      addCol(L.at.x, L.at.z, 0.9);
      const read = () => {
        const fx = L.at.x - Math.sin(g.rotation.y) * -3;
        const fz = L.at.z - Math.cos(g.rotation.y) * -3;
        playCutscene([
          { dur: 3, from: [fx, H(L.at.x, L.at.z) + 2.2, fz], look: [L.at.x, H(L.at.x, L.at.z) + 1.4, L.at.z], who: L.title, text: L.text },
          { dur: 0.3, gameCam: true, end: () => {
            S.lore ||= {};
            if (!S.lore[L.title]) {
              S.lore[L.title] = true;
              save();
              myRune.color.set(0xffd36a);
              h.visible = false;
              window.dispatchEvent(new Event("ww-refresh")); // tick it off in the list
              api.say(`📜 A new page of history: "${L.title}" (lore found: ${Object.keys(S.lore).length})`);
            }
          } },
        ]);
      };
      extraShops.push({ interactable: (p) => (Math.hypot(p.x - L.at.x, p.z - L.at.z) < 2.6 ? { label: `read the lore stone — "${L.title}"`, act: read } : null) });
    }
    // 🌙 a memorial to Renata Josephine Rudy beside every waystone
    {
      const w = city.spots.waystone;
      const x = w.x - 6;
      const z = w.z - 2;
      const g = new THREE.Group();
      g.position.set(x, H(x, z), z);
      g.rotation.y = Math.atan2(-x, -z);
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.8, 10), M(0xd8d4cc));
      plinth.position.y = 0.4;
      const statue = buildThistle({ tunicColor: 0xe8f0ff, hoodColor: 0xe8f0ff, pack: true });
      statue.traverse((o) => o.isMesh && (o.material = new THREE.MeshStandardMaterial({ color: 0xdfe8f4, emissive: 0x3a4a6a, emissiveIntensity: 0.4, roughness: 0.6, flatShading: true })));
      statue.scale.setScalar(1.6);
      statue.position.y = 0.8;
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
      lantern.position.set(0.32, 1.6, 0.25);
      const h = glow(0xbfe6ff, 2.2);
      h.position.set(0.32, 1.6, 0.25);
      g.add(plinth, statue, lantern, h);
      G.add(g);
      addCol(x, z, 1.2);
      extraShops.push({ interactable: (p) => (Math.hypot(p.x - x, p.z - z) < 2.6 ? { label: "read the memorial", act: () =>
        playCutscene([{ dur: 4, from: [x + 2.6, H(x, z) + 2.4, z + 2.6], look: [x, H(x, z) + 2, z], who: "The memorial reads",
          text: "RENATA JOSEPHINE RUDY — the first Moonkeeper. She walked here with a lantern, a map and a promise: that no city would ever be alone in the dark." }]) } : null) });
    }
    // ✨ each city's own enchantment
    if (id === "frostpine") {
      // the AURORA: shimmering ribbons of light across the sky
      const auroraMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
        vertexShader: "varying vec2 vUv; uniform float uTime; void main(){ vUv = uv; vec3 p = position; p.y += sin(p.x * 0.03 + uTime * 0.4) * 6.0; p.z += sin(p.x * 0.02 + uTime * 0.25) * 10.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }",
        fragmentShader: "varying vec2 vUv; uniform float uTime; void main(){ float band = smoothstep(0.0, 0.6, vUv.y) * smoothstep(1.0, 0.4, vUv.y); float shimmer = 0.6 + 0.4 * sin(vUv.x * 40.0 + uTime * 2.0); vec3 c = mix(vec3(0.2, 1.0, 0.6), vec3(0.6, 0.3, 1.0), vUv.y); gl_FragColor = vec4(c, band * shimmer * 0.45); }",
      });
      for (const [z, ry] of [[-60, 0], [-20, 0.3], [30, -0.2]]) {
        const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(300, 30, 60, 1), auroraMat);
        ribbon.position.set(0, 75, z);
        ribbon.rotation.set(-0.5, ry, 0);
        G.add(ribbon);
      }
      live.push((t) => (auroraMat.uniforms.uTime.value = t));
      // glittering ice motes drifting in the air
      const motes = [];
      for (let k = 0; k < 40; k++) {
        const m = glow(k % 2 ? 0xbfe6ff : 0xe0c8ff, 0.6);
        m.userData = { a: k * 2.4, r: 20 + (k % 7) * 9, h: 2 + (k % 5) * 2 };
        G.add(m);
        motes.push(m);
      }
      live.push((t) => motes.forEach((m) => {
        const u = m.userData;
        const a = u.a + t * 0.05;
        m.position.set(Math.cos(a) * u.r, H(Math.cos(a) * u.r, Math.sin(a) * u.r) + u.h + Math.sin(t + u.a) * 0.6, Math.sin(a) * u.r);
        m.material.opacity = 0.5 + Math.sin(t * 2 + u.a) * 0.3;
      }));
    }
    if (id === "reedmere") {
      // WILL-O'-WISPS drifting over the lagoon, and floating lily-lanterns
      const wisps = [];
      for (let k = 0; k < 18; k++) {
        const m = glow(k % 3 ? 0x8affd8 : 0xffe08a, 1.2);
        m.userData = { a: k * 1.9, r: 12 + (k % 6) * 6, sp: 0.08 + (k % 4) * 0.03 };
        G.add(m);
        wisps.push(m);
      }
      live.push((t) => wisps.forEach((m) => {
        const u = m.userData;
        const a = u.a + t * u.sp;
        m.position.set(Math.cos(a) * u.r + Math.sin(t * 0.7 + u.a) * 2, 1.4 + Math.sin(t * 1.3 + u.a) * 0.6, Math.sin(a) * u.r);
        m.material.opacity = 0.45 + Math.sin(t * 3 + u.a) * 0.35;
      }));
      for (let k = 0; k < 14; k++) {
        const a = k * 0.45 + 0.2;
        const r = 18 + (k % 4) * 6;
        const pad = new THREE.Mesh(new THREE.CircleGeometry(0.6, 8).rotateX(-Math.PI / 2), M(0x4a8a3a));
        pad.position.set(Math.cos(a) * r, 0.24, Math.sin(a) * r);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
        flame.position.set(Math.cos(a) * r, 0.42, Math.sin(a) * r);
        const h = glow(0xffd890, 1.4);
        h.position.copy(flame.position);
        G.add(pad, flame, h);
      }
    }
    if (id === "golden") {
      // golden FIREFLIES over the wheat, and the HARVEST MOON stone circle
      const flies = [];
      for (let k = 0; k < 50; k++) {
        const m = glow(0xffd84a, 0.5);
        const patch = k % 6;
        m.userData = { cx: [-50, -38, 40, 52, -20, 30][patch], cz: [10, 40, 15, 40, 50, 55][patch], ph: k * 1.3 };
        G.add(m);
        flies.push(m);
      }
      live.push((t) => flies.forEach((m) => {
        const u = m.userData;
        const x = u.cx + Math.sin(t * 0.3 + u.ph) * 9;
        const z = u.cz + Math.cos(t * 0.27 + u.ph * 1.3) * 7;
        m.position.set(x, H(x, z) + 1.6 + Math.sin(t * 2 + u.ph) * 0.5, z);
        m.material.opacity = Math.max(0, Math.sin(t * 2.5 + u.ph)) * 0.9;
      }));
      const C = { x: -28, z: -64 };
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const x = C.x + Math.cos(a) * 6;
        const z = C.z + Math.sin(a) * 6;
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6 + (k % 3) * 0.4, 0.5), M(0xb8b0a0));
        st.position.set(x, H(x, z) + 1.3, z);
        st.rotation.y = -a;
        const rune = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
        rune.position.set(x - Math.cos(a) * 0.26, H(x, z) + 1.9, z - Math.sin(a) * 0.26);
        rune.lookAt(C.x, H(x, z) + 1.9, C.z);
        G.add(st, rune);
        addCol(x, z, 0.6);
      }
      const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
      moon.position.set(C.x, H(C.x, C.z) + 5, C.z);
      const mh = glow(0xffd870, 7);
      mh.position.copy(moon.position);
      G.add(moon, mh);
      live.push((t) => {
        moon.position.y = H(C.x, C.z) + 5 + Math.sin(t * 0.8) * 0.3;
        mh.position.y = moon.position.y;
      });
    }
  }

  // ---------- 🏁 CHALLENGES: timed courses (run / swim / climb) ----------
  const CH = { run: null, t: 0, step: 0 };
  function makeChallenge(C) {
    const off = fixedPerson(C.official.name, C.official.at, C.official.tunic, null, 1.05);
    const rings = (typeof C.rings === "function" ? C.rings(city) : C.rings).map((r) => {
      const g = new THREE.Group();
      const y = r.y ?? H(r.x, r.z);
      g.position.set(r.x, y, r.z);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.14, 6, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
      arch.rotation.y = r.face ?? 0;
      const h = glow(0xffe08a, 3.2);
      h.position.y = 1.4;
      g.add(arch, h);
      g.visible = false;
      G.add(g);
      return { ...r, y, g, arch };
    });
    C._rings = rings;
    C._off = off;
    return {
      interactable(p) {
        if (CH.run || Math.hypot(p.x - off.x, p.z - off.z) > 2.6) return null;
        const best = S.medals[C.key] ? ` Your best: ${S.medals[C.key]}.` : "";
        return { label: `talk to ${C.official.name} — the ${C.name}`, act: () => talk(off, [C.intro + ` Gold is under ${C.medals.gold} seconds.${best} Ready?`], () => startChallenge(C)) };
      },
    };
  }
  function startChallenge(C) {
    CH.run = C;
    CH.t = 0;
    CH.step = 0;
    api.placePlayer(C.start.x, C.start.z, C.start.face);
    if (C.mode === "swim") api.setNoRaft(true);
    if (C.ride) api.setRide({ ...C.ride });
    C._rings.forEach((r) => (r.g.visible = true));
    api.say(`🏁 GO! ${C.go}`, true);
  }
  function endChallenge(time) {
    const C = CH.run;
    CH.run = null;
    api.setNoRaft(false);
    if (C.ride) api.setRide(null);
    C._rings.forEach((r) => (r.g.visible = false));
    evHud.style.display = "none";
    const medal = time <= C.medals.gold ? "gold" : time <= C.medals.silver ? "silver" : time <= C.medals.bronze ? "bronze" : "none";
    const rank = { none: 0, bronze: 1, silver: 2, gold: 3 };
    const firstGold = medal === "gold" && S.medals[C.key] !== "gold";
    if (rank[medal] > rank[S.medals[C.key] || "none"]) S.medals[C.key] = medal;
    EVENT_NAMES[C.key] = C.name;
    S.coins += PRIZE[medal];
    save();
    if (firstGold) api.addRep(id, 1);
    api.chime();
    api.say(medal === "none" ? `🏁 ${time.toFixed(1)}s — no medal this time. Try again! (+🪙 ${PRIZE.none})` : `${medal === "gold" ? "🥇 GOLD" : medal === "silver" ? "🥈 SILVER" : "🥉 BRONZE"} in the ${C.name}! ${time.toFixed(1)}s — +🪙 ${PRIZE[medal]}`, true);
  }
  live.push((t, dt) => {
    const C = CH.run;
    if (!C) return;
    CH.t += dt;
    const r = C._rings[CH.step];
    evHud.style.display = "";
    evHud.textContent = `🏁 ${C.name} · ${CH.t.toFixed(1)}s · ${CH.step + 1}/${C._rings.length}  (🥇 under ${C.medals.gold}s)`;
    C._rings.forEach((k, i) => {
      k.arch.material.color.set(i < CH.step ? 0x6aff8a : i === CH.step ? 0xffd84a : 0x8a7a5a);
      k.g.visible = i >= CH.step;
    });
    if (near(r.x, r.z, C.mode === "climb" ? 2.2 : 3) && (C.mode !== "climb" || me().y > r.y - 0.8)) {
      CH.step++;
      api.chime();
      if (CH.step >= C._rings.length) endChallenge(CH.t);
    }
    if (CH.t > 180) endChallenge(999);
  });

  // ---------- 📚 from the Grand Library's pages: each city's own wonders ----------
  S.relics ||= {};
  const wonders = [];
  const extraShops = []; // { at, r, label, act, when?() }
  const relicMat = (c) => M(c, { emissive: c, emissiveIntensity: 0.6 });
  const beamAt = (g) => {
    const h = glow(0xfff2b0, 3);
    h.position.y = 1.4;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.5, 14, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 7;
    g.add(h, beam);
  };
  // ☕ the CAFÉ: sit at a table, overhear a rumor → it leads to a hidden RELIC
  const CAFE = {
    reedmere: { name: "The Lily Pad Café", at: { x: 58, z: -62 }, color: 0x6aa86a,
      gossip: [["Two old fishers, whispering", "…out past the jetty, where the old columns stick up from the water? The flooded ruins. My gran swore there's a Moonkeeper treasure still down there."], ["Two old fishers, whispering", "Nobody's brave enough to swim out. Hah! Pass the lily tea."]],
      relic: { name: "the Compass Rose of the Moonkeepers", icon: "🧭", label: "lift the glowing relic from the ruins" } },
    golden: { name: "The Butter Churn Café", at: { x: 60, z: 66 }, color: 0xd8a83a,
      gossip: [["Two farmers, over pie", "…the first windmill of Golden Hollow was built round a GOLDEN ACORN, they say. Buried at its foot, for luck."], ["Two farmers, over pie", "Behind the windmill, aye. Not that anyone's ever dug for it."]],
      relic: { name: "the Golden Acorn", icon: "🌰", label: "dig up the golden acorn" } },
    frostpine: { name: "The Cocoa Den", at: { x: -50, z: 70 }, color: 0x8a5a3a,
      gossip: [["Two trappers, by the stove", "…deep in the ice cave, past the blue crystals, there's a crystal that glows from INSIDE. The Heart of Frostpine."], ["Two trappers, by the stove", "Grandad said the Moonkeepers left it there to keep the north warm in spirit. Brr."]],
      relic: { name: "the Heart of Frostpine", icon: "💎", label: "take the glowing Heart of Frostpine" } },
  }[id];
  {
    const c = CAFE.at;
    const y = H(c.x, c.z);
    const hut = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.3, 4, 12), M(CAFE.color));
    hut.position.set(c.x, y + 2, c.z);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3, 12), M(0x6a4a2c));
    roof.position.set(c.x, y + 5.4, c.z);
    G.add(hut, roof);
    addCol(c.x, c.z, 4.6);
    // tables + stools out front (facing the middle of town)
    const out = Math.atan2(-c.x, -c.z);
    const tx = c.x + Math.sin(out) * 7;
    const tz = c.z + Math.cos(out) * 7;
    for (const [ox, oz] of [[-2, 0], [2, 0]]) {
      const x = tx + Math.cos(out) * ox;
      const z = tz - Math.sin(out) * ox + oz;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 10), M(0x8a5e36));
      top.position.set(x, H(x, z) + 1, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1, 5), M(0x5a3e24));
      leg.position.set(x, H(x, z) + 0.5, z);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8), M(0xf4ece0));
      cup.position.set(x + 0.3, H(x, z) + 1.16, z);
      G.add(top, leg, cup);
      addCol(x, z, 1);
    }
    // the two gossiping regulars
    for (const [ox, k] of [[-3.3, 0], [3.3, 1]]) {
      const x = tx + Math.cos(out) * ox;
      const z = tz - Math.sin(out) * ox;
      fixedPerson(CAFE.gossip[0][0] + k, { x, z }, k ? 0x8a6a9a : 0x6a8a7a, Math.atan2(tx - x, tz - z), 0.95).name = "Café regular";
    }
    const sign = signBoard(CAFE.name, { w: 4.6, h: 1.15, style: "wood" }); // (🪧 crisp, both sides)
    // on a post out front — clear of the roof's eaves
    const sx = c.x + Math.sin(out) * 5.8 + Math.cos(out) * 3.4;
    const sz = c.z + Math.cos(out) * 5.8 - Math.sin(out) * 3.4;
    sign.position.set(sx, H(sx, sz) + 2.4, sz);
    sign.rotation.y = out;
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 5), M(0x5a3e24));
    sp.position.set(sx, H(sx, sz) + 1.2, sz);
    G.add(sign, sp);
    wonders.push({ at: { x: tx, z: tz }, r: 3.2, label: `sit down at ${CAFE.name} and listen`, act: () => {
      const L = CAFE.gossip;
      playCutscene([
        { dur: 2.6, from: [tx + Math.sin(out) * 4, H(tx, tz) + 2.2, tz + Math.cos(out) * 4], look: [tx, H(tx, tz) + 1, tz], text: "You sip something warm and keep your ears open…" },
        ...L.map(([who, text]) => ({ dur: 3.2, from: [tx + Math.sin(out) * 3, H(tx, tz) + 1.8, tz + Math.cos(out) * 3], look: [tx, H(tx, tz) + 1, tz], who, text })),
        { dur: 0.3, gameCam: true, end: () => {
          if (!S.relics[id]) {
            S.relics[id] = "heard";
            save();
            relic.g.visible = true;
            api.say(`👂 A rumor! ${CAFE.relic.name} — a golden light now marks where to look.`, true);
          }
        } },
      ]);
    } });
  }
  // 🍲 the other hangouts: a building, tables, a host with a menu, gossiping regulars
  for (const HO of HANGOUTS[id]) {
    const c = HO.at;
    const y = H(c.x, c.z);
    const out = Math.atan2(-c.x, -c.z);
    const hall = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 6.5), M(HO.color));
    hall.position.set(c.x, y + 2.25, c.z);
    hall.rotation.y = out;
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.2, 3.2, 4).rotateY(Math.PI / 4).scale(1.05, 1, 0.85), M(HO.roof));
    roof.position.set(c.x, y + 6.1, c.z);
    roof.rotation.y = out;
    G.add(hall, roof);
    for (const [ox, oy] of [[-2.3, 2.6], [2.3, 2.6]]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), winMat);
      w.position.set(c.x + Math.sin(out) * 3.28 + Math.cos(out) * ox, y + oy, c.z + Math.cos(out) * 3.28 - Math.sin(out) * ox);
      w.rotation.y = out;
      G.add(w);
    }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), doorMat);
    door.position.set(c.x + Math.sin(out) * 3.28, y + 1.2, c.z + Math.cos(out) * 3.28);
    door.rotation.y = out;
    G.add(door);
    addCol(c.x, c.z, 5);
    // chimney smoke-glow in Frostpine
    if (id === "frostpine") city.heat.push({ x: c.x + Math.sin(out) * 6, z: c.z + Math.cos(out) * 6, y, on: true, big: false });
    // sign
    {
      const sign = signBoard(HO.name, { w: 4.6, h: 1.15, style: "wood" }); // (🪧 crisp, both sides)
      const sx = c.x + Math.sin(out) * 5 - Math.cos(out) * 3.6;
      const sz = c.z + Math.cos(out) * 5 + Math.sin(out) * 3.6;
      sign.position.set(sx, H(sx, sz) + 2.5, sz);
      sign.rotation.y = out;
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 5), M(0x5a3e24));
      sp.position.set(sx, H(sx, sz) + 1.25, sz);
      G.add(sign, sp);
    }
    // the host by the door, tables + regulars out front
    const hx = c.x + Math.sin(out) * 4.4 + Math.cos(out) * 2.4;
    const hz = c.z + Math.cos(out) * 4.4 - Math.sin(out) * 2.4;
    const host = fixedPerson(HO.host, { x: hx, z: hz }, HO.hostTunic, out);
    const tx = c.x + Math.sin(out) * 8.5;
    const tz = c.z + Math.cos(out) * 8.5;
    for (const ox of [-2.2, 2.2]) {
      const x = tx + Math.cos(out) * ox;
      const z = tz - Math.sin(out) * ox;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 10), M(0x8a5e36));
      top.position.set(x, H(x, z) + 1, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1, 5), M(0x5a3e24));
      leg.position.set(x, H(x, z) + 0.5, z);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xf4ece0));
      bowl.position.set(x, H(x, z) + 1.25, z);
      G.add(top, leg, bowl);
      addCol(x, z, 1);
      const rx = x + Math.cos(out) * (ox < 0 ? -1.3 : 1.3);
      const rz = z - Math.sin(out) * (ox < 0 ? -1.3 : 1.3);
      fixedPerson(HO.name + ox, { x: rx, z: rz }, new THREE.Color().setHSL(((ox + 3) * 0.17 + c.x * 0.01) % 1, 0.35, 0.45).getHex(), Math.atan2(x - rx, z - rz), 0.92).name = "Regular";
    }
    // order from the host
    wonders.push({ at: { x: hx, z: hz }, r: 2.4, label: `order at ${HO.name}`, act: () => {
      const el = shopEl();
      const draw = (msg = "") => {
        el.innerHTML = `<div class="card"><h3>${HO.name}</h3><div class="coins">${HO.host} · 🪙 ${S.coins} coins</div>
          ${inflate(HO.menu).map((it, i) => `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>+${it.heal} ❤️${it.warm ? " · warms you up" : ""}</small></span><button data-i="${i}" ${S.coins < it.price ? "disabled" : ""}>🪙 ${it.price}</button></div>`).join("")}
          <div class="msg">${msg}</div><div class="close">Esc — leave</div></div>`;
        el.querySelectorAll("button[data-i]").forEach((b) => {
          b.onclick = () => {
            const it = HO.menu[+b.dataset.i];
            if (S.coins < it.price) return;
            S.coins -= it.price;
          bought(it.key || it.name);
            save();
            const m = bagFood(it);
            api.chime();
            draw(`You bought ${it.icon} ${it.name}!${m}`);
          };
        });
      };
      draw();
      el.classList.add("open");
      shopOpenNow = true;
      host.mesh.userData.lookAt = me();
      shopVendor = host;
    } });
    // walk inside: tables, a hearth, the host at the counter
    {
      const orderAct = wonders[wonders.length - 1].act;
      const roomId = "room:" + HO.name;
      registerRoom(roomId, { name: HO.name, kind: "cafe", wall: HO.color, rug: 0x8a3a3a, keeper: { tunic: HO.hostTunic }, buildThistle, onUse: orderAct, useLabel: `order from ${HO.host}` });
      const ddx = c.x + Math.sin(out) * 3.6;
      const ddz = c.z + Math.cos(out) * 3.6;
      wonders.push({ at: { x: ddx, z: ddz }, r: 1.8, label: `go inside ${HO.name}`, act: () => shopHouseEnter && shopHouseEnter(roomId, { x: ddx + Math.sin(out) * 1.5, z: ddz + Math.cos(out) * 1.5, face: out }) });
    }
    // sit and listen
    wonders.push({ at: { x: tx, z: tz }, r: 3.2, label: `sit at ${HO.name} and listen`, act: () =>
      playCutscene([
        { dur: 2.4, from: [tx + Math.sin(out) * 4, H(tx, tz) + 2.2, tz + Math.cos(out) * 4], look: [tx, H(tx, tz) + 1, tz], text: `You settle in at ${HO.name}, and listen…` },
        ...HO.gossip.map(([who, text]) => ({ dur: 3.2, from: [tx + Math.sin(out) * 3, H(tx, tz) + 1.8, tz + Math.cos(out) * 3], look: [tx, H(tx, tz) + 1, tz], who, text })),
      ]) });
  }

  // the RELIC, hidden until you've heard the rumor
  const RELIC_AT = { reedmere: { x: 29.5, z: -29.5, y: 0.6, water: true }, golden: { x: -42, z: -21 }, frostpine: { x: 82, z: -46 } }[id];
  const relic = { g: new THREE.Group() };
  {
    const g = relic.g;
    g.position.set(RELIC_AT.x, RELIC_AT.y ?? H(RELIC_AT.x, RELIC_AT.z), RELIC_AT.z);
    const body =
      id === "reedmere" ? new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 6, 16), relicMat(0x9fd8ff))
      : id === "golden" ? new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8).scale(0.85, 1.1, 0.85), relicMat(0xffc840))
      : new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0).scale(0.7, 1.4, 0.7), relicMat(0xff9ad8));
    body.position.y = 0.6;
    g.add(body);
    beamAt(g);
    g.visible = S.relics[id] === "heard";
    G.add(g);
    live.push((t) => (body.rotation.y = t * 1.5));
    wonders.push({ at: RELIC_AT, r: RELIC_AT.water ? 3 : 2.4, when: () => S.relics[id] === "heard", label: CAFE.relic.label, act: () => {
      S.relics[id] = "found";
      save();
      g.visible = false;
      api.chime();
      api.say(`${CAFE.relic.icon} You found ${CAFE.relic.name}! The Museum of the Alliance in Everbough would treasure it.`, true);
    } });
  }

  if (id === "reedmere") {
    // 🏠 floating homes bobbing on the lagoon
    for (const ang of [216, 252, 288]) {
      const a = (ang * Math.PI) / 180;
      const x = Math.cos(a) * 43;
      const z = Math.sin(a) * 43;
      const g = new THREE.Group();
      g.position.set(x, 0.2, z);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 5), M(0x8a6a42));
      const hut = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2, 2.6, 8), M(0xb8a86a));
      hut.position.y = 1.5;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 8), M(0x8a7a3a));
      roof.position.y = 3.9;
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.4, 8), winMat);
      win.position.set(0, 1.8, 2.02);
      g.add(deck, hut, roof, win);
      g.lookAt(0, 0.2, 0);
      G.add(g);
      addCol(x, z, 3.2);
      live.push((t) => {
        g.position.y = 0.2 + Math.sin(t * 1.3 + ang) * 0.08;
        g.rotation.z = Math.sin(t * 0.9 + ang) * 0.03;
      });
    }
    // ⛵ boats sailing about the lagoon
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.4, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), M(0x7a5232));
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), M(0x5a3e24));
      mast.position.y = 1.5;
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), M([0xf4ece0, 0xd8a83a, 0x6ab8c8][k], { side: THREE.DoubleSide }));
      sail.position.set(0, 1.8, 0.1);
      sail.rotation.y = Math.PI / 2;
      b.add(hull, mast, sail);
      G.add(b);
      const r = [14, 27, 40][k];
      live.push((t) => {
        const a = t * (0.12 - k * 0.025) * (k % 2 ? -1 : 1) + k * 2;
        b.position.set(Math.cos(a) * r, 0.25 + Math.sin(t * 2 + k) * 0.05, Math.sin(a) * r);
        b.rotation.y = -a + (k % 2 ? Math.PI : 0);
      });
    }
    // 🏛️ the FLOODED RUINS: broken columns and an arch, half under the water
    {
      const stone = M(0x9a9890);
      const mossy = M(0x6a7a5a);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const x = RELIC_AT.x + Math.cos(a) * 4.5;
        const z = RELIC_AT.z + Math.sin(a) * 4.5;
        const h = 1.2 + ((k * 7) % 4) * 0.9;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, h, 8), k % 2 ? stone : mossy);
        col.position.set(x, -0.8 + h / 2, z);
        col.rotation.z = (k % 3 - 1) * 0.12;
        G.add(col);
        addCol(x, z, 0.8);
      }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.4, 6, 14, Math.PI), stone);
      arch.position.set(RELIC_AT.x, -0.4, RELIC_AT.z - 5);
      G.add(arch);
    }
    // 🛶 the RAFT-BUILDER'S YARD: build a raft of your very own
    {
      const Y = { x: 44, z: 56 };
      const builder = fixedPerson("Raft-builder Reedling", { x: Y.x - 2, z: Y.z - 2.5 }, 0x7a6a3a);
      for (let k = 0; k < 3; k++) {
        const r = new THREE.Group();
        for (let i = -3; i <= 3; i++) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6).rotateX(Math.PI / 2), M(0xb8a86a));
          log.position.x = i * 0.24;
          r.add(log);
        }
        r.position.set(Y.x + k * 2.4, H(Y.x, Y.z) + 0.15, Y.z + 1.5);
        r.rotation.y = k * 0.3;
        G.add(r);
      }
      wonders.push({ at: builder, r: 2.6, label: "talk to Raft-builder Reedling", act: () => {
        if (S.owned.raft) return talk(builder, ["That raft holding up? Built her yourself — she'll never sink."]);
        const have = api.packCount("Twigs") >= 6 && api.packCount("String") >= 2;
        if (!have) return talk(builder, ["Every Reedmere mouse builds their OWN raft — it's tradition! Bring me 6 Twigs and 2 String and I'll teach you how.", `(You have ${api.packCount("Twigs")} twigs and ${api.packCount("String")} string.)`]);
        return talk(builder, ["Six twigs and string — perfect! Lash them like THIS… over, under, knot…", "There! Your very own raft. On the water you'll paddle FAST, wherever you go in Reedmere."], () => {
          api.packTake("Twigs", 6);
          api.packTake("String", 2);
          S.owned.raft = true;
          save();
          api.chime();
          api.addRep(id, 1);
          api.say("🛶 You built your own raft! It's yours to keep.", true);
        });
      } });
    }
  }

  if (id === "golden") {
    // 🎨 Dyer Madder's cloth dye shop, by the market
    const dyer = shopHouse(G, H, { x: -72, z: 62 }, 0xd8a8e8, "Madder's Cloth Dyes", "Dyer Madder", 0xa84a6a, () => openDyeShop("cloth", api), addCol);
    wonders.push({ at: { x: -72 - (-72 / Math.hypot(72, 62)) * -5, z: 62 }, r: 0, label: "", act: () => {} }); // (placeholder)
    wonders.pop();
    extraShops.push(dyer);
    // 🥧 the COOKING COMPETITION (a second event, at the Harvest Hall)
    const chef = fixedPerson("Chef Saffron", { x: 10, z: -31 }, 0xe8e0d0, Math.PI, 1.05);
    const PANTRY = [
      { k: "Honey", icon: "🍯", tag: "sweet" },
      { k: "Squash", icon: "🎃", tag: "sweet" },
      { k: "Cheese", icon: "🧀", tag: "savory" },
      { k: "Beets", icon: "🟣", tag: "savory" },
      { k: "Wild Herbs", icon: "🌿", tag: "green" },
      { k: "Peas", icon: "🫛", tag: "green" },
    ];
    const openCook = () => {
      const el = shopEl();
      const pick = new Set();
      const draw = () => {
        el.innerHTML = `<div class="card"><h3>🥧 The Cooking Competition</h3><div class="coins">Choose 3 ingredients (${pick.size}/3)</div>
          ${PANTRY.map((p, i) => `<div class="item"><span class="ic">${p.icon}</span><span class="nm">${p.k}</span><button data-i="${i}" style="background:${pick.has(i) ? "#2e6a3a" : "#5a3a12"}">${pick.has(i) ? "✓ in!" : "add"}</button></div>`).join("")}
          <div class="msg"><button id="serve" ${pick.size === 3 ? "" : "disabled"}>🍽️ Serve the judges!</button></div><div class="close">Esc — leave</div></div>`;
        el.querySelectorAll("button[data-i]").forEach((b) => {
          b.onclick = () => {
            const i = +b.dataset.i;
            if (pick.has(i)) pick.delete(i);
            else if (pick.size < 3) pick.add(i);
            draw();
          };
        });
        const serve = el.querySelector("#serve");
        if (serve) serve.onclick = () => {
          el.classList.remove("open");
          shopOpenNow = false;
          const tags = new Set([...pick].map((i) => PANTRY[i].tag));
          const medal = tags.size === 3 ? "gold" : tags.size === 2 ? "silver" : "bronze";
          const dish = [...pick].map((i) => PANTRY[i].k).join(", ");
          playCutscene([
            { dur: 3, from: [chef.x + 3, H(chef.x, chef.z) + 2, chef.z + 3], look: [chef.x, H(chef.x, chef.z) + 0.8, chef.z], who: "Chef Saffron", text: `${dish}… the judges taste… they chew… they whisper…` },
            { dur: 3.2, from: [chef.x + 2, H(chef.x, chef.z) + 1.6, chef.z + 2], look: [chef.x, H(chef.x, chef.z) + 0.8, chef.z], who: "Chef Saffron",
              text: medal === "gold" ? "Sweet, savory AND green — perfect balance! GOLD RIBBON!" : medal === "silver" ? "Delicious — but it's missing something. A SILVER ribbon!" : "Hmm. A little… one-note. Bronze ribbon — try mixing your flavors!" },
            { dur: 0.3, gameCam: true, end: () => {
              const rank = { bronze: 1, silver: 2, gold: 3 };
              const first = medal === "gold" && S.medals.cook !== "gold";
              if (rank[medal] > rank[S.medals.cook || "bronze"] || !S.medals.cook) S.medals.cook = medal;
              S.coins += PRIZE[medal];
              save();
              if (first) api.addRep(id, 1);
              api.chime();
              api.say(`${medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉"} Cooking Competition: ${medal.toUpperCase()}! +🪙 ${PRIZE[medal]}`, true);
            } },
          ]);
        };
      };
      draw();
      el.classList.add("open");
      shopOpenNow = true;
    };
    wonders.push({ at: chef, r: 2.6, label: "enter the Cooking Competition (Chef Saffron)", act: () =>
      talk(chef, ["Golden Hollow's Cooking Competition! Pick three ingredients from the pantry. The judges love BALANCE — something sweet, something savory, something green."], openCook) });
  }

  if (id === "frostpine") {
    // ♨️ the HOT SPRINGS: steaming pools — swim to get warm (and heal)
    const HS = { x: -72, z: -30, r: 7 };
    // (the water sits over the highest ground under the pool, so none of it is buried)
    let hy = H(HS.x, HS.z);
    for (let k = 0; k < 24; k++) for (const rr of [HS.r * 0.5, HS.r]) hy = Math.max(hy, H(HS.x + Math.cos(k * 0.26) * rr, HS.z + Math.sin(k * 0.26) * rr) - 0.2);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(HS.r, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5ad8d8, emissive: 0x2a8a8a, emissiveIntensity: 0.6, roughness: 0.2 }));
    pool.position.set(HS.x, hy + 0.35, HS.z);
    G.add(pool);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), M(0x6a6a72));
      rock.position.set(HS.x + Math.cos(a) * (HS.r + 0.4), hy + 0.3, HS.z + Math.sin(a) * (HS.r + 0.4));
      G.add(rock);
      if (k % 2 === 0) addCol(rock.position.x, rock.position.z, 0.7); // (solid — step in between them)
    }
    // steam
    const steam = [];
    for (let k = 0; k < 24; k++) {
      const sp = glow(0xffffff, 3);
      sp.material.opacity = 0.25;
      sp.userData = { a: k * 1.7, r: (k % 4) * 1.6, ph: k };
      G.add(sp);
      steam.push(sp);
    }
    live.push((t) => {
      for (const sp of steam) {
        const u = sp.userData;
        const k = (t * 0.25 + u.ph * 0.13) % 1;
        sp.position.set(HS.x + Math.cos(u.a) * u.r, hy + 0.6 + k * 5, HS.z + Math.sin(u.a) * u.r);
        sp.material.opacity = 0.3 * (1 - k);
      }
      // soak = heal (and warm — it's a heat source too)
      if (Math.hypot(me().x - HS.x, me().z - HS.z) < HS.r) api.heal(0.05);
    });
    city.heat.push({ x: HS.x, z: HS.z, y: hy, on: true, big: true });
    const baseWater = city.waterAt;
    city.waterAt = (x, z) => (Math.hypot(x - HS.x, z - HS.z) < HS.r - 0.3 ? hy + 0.35 : baseWater(x, z));
    // 🧊 the ICE CAVE: a glittering grotto of blue crystal
    const IC = { x: 78, z: -42 };
    const iy = H(IC.x, IC.z);
    const ice = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.15, transparent: true, opacity: 0.55, emissive: 0x2a6a9a, emissiveIntensity: 0.5, side: THREE.DoubleSide });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 18, 10, 0.5, Math.PI * 2 - 1, 0, Math.PI / 2), ice);
    dome.position.set(IC.x, iy - 0.5, IC.z);
    dome.rotation.y = Math.atan2(-IC.x, -IC.z) - Math.PI / 2 + 0.5; // the opening faces town
    G.add(dome);
    const cl = new THREE.PointLight(0x8ad8ff, 20, 22, 1.6);
    cl.position.set(IC.x, iy + 4, IC.z);
    G.add(cl);
    const shards = [];
    for (let k = 0; k < 9; k++) {
      const a = k * 0.7 + 1;
      const x = IC.x + Math.cos(a) * 7;
      const z = IC.z + Math.sin(a) * 7;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.7 + (k % 3) * 0.3, 0).scale(0.6, 1.8, 0.6), new THREE.MeshBasicMaterial({ color: k % 2 ? 0x9fd8ff : 0xc4b0ff }));
      c.position.set(x, iy + 1, z);
      c.rotation.z = (k % 3 - 1) * 0.3;
      G.add(c);
      addCol(x, z, 0.5);
      shards.push({ x, z, mesh: c, k });
    }
    wonders.push({ at: IC, r: 9, label: "chip off an Ice Crystal Shard", when: () => shards.some((s) => near(s.x, s.z, 2.4)), act: () => {
      if (S.shardT && Date.now() - S.shardT < 4000) return api.say("🧊 The ice is hard — give your paws a moment.");
      S.shardT = Date.now();
      api.addToPack("Ice Crystal Shard", 1);
      api.chime();
      api.say("🧊 +1 Ice Crystal Shard — the market pays well for these!");
    } });
  }

  // 🏡 the house for sale
  const HOUSE_AT = { reedmere: { x: 70, z: -20 }, golden: { x: -30, z: 72 }, frostpine: { x: 22, z: 80 } }[id];
  extraShops.push(makeHouseForSale(G, H, HOUSE_AT, id, { ...api, addCollider: addCol }));
  // 🐴 Golden Hollow's stable
  if (id === "golden") {
    const stable = {
      vendor: "Stablemaster Dapple",
      theme: "golden",
      items: [{ key: "horse", icon: "🐴", name: "Buttercup the Pony", price: 80, keep: true, desc: "RIDE HER: Caps Lock to gallop — anywhere outdoors (not in Frostpine's snow)" }],
    };
    MARKETS.stable = { stalls: [stable] };
    extraShops.push(shopHouse(G, H, { x: 40, z: 76 }, 0xa86a3a, "Dapple's Stable", "Stablemaster Dapple", 0x7a4a2a, () => openOutfitShop(stable, api), addCol));
    // a pony waiting in the paddock
    const pony = buildPony();
    pony.position.set(48, H(48, 70), 70);
    pony.rotation.y = 2.2;
    G.add(pony);
    live.push((t) => (pony.userData.tail.rotation.z = Math.sin(t * 2) * 0.3));
  }
  // 🏁 more races & challenges
  for (const C of CHALLENGES[id] || []) extraShops.push(makeChallenge(C));
  // 🌱 Golden Hollow: buy your own plot of land and grow things on it
  if (id === "golden") extraShops.push(makeFarmPlot());
  // 🎀 Reedmere: Madame Ribbon's Design Studio — make your own hats + clothes
  if (id === "reedmere") {
    let at = null;
    for (let r = 56; r < 100 && !at; r += 4) for (let a = 2.2; a < 2.2 + Math.PI * 2 && !at; a += 0.25) {
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (city.waterAt(x, z) === null && city.waterAt(x + 5, z) === null && city.waterAt(x, z + 5) === null && !city.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 7)) at = { x, z };
    }
    if (at) extraShops.push(shopHouse(G, H, at, 0xf4c8d8, "Madame Ribbon's Design Studio", "Madame Ribbon", 0xd85a8a, () => openStudio(api), addCol));
  }
  // 🐄 Golden Hollow's dairy farm · 💎 Frostpine's crystal farm · 🌸 Reedmere's flower garden
  if (id === "golden") extraShops.push(makeDairy());
  if (id === "frostpine") extraShops.push(makeFarmPlot(CRYSTAL_FARM));
  if (id === "reedmere") extraShops.push(makeFarmPlot(FLOWER_FARM));
  // 🐾 pets!
  if (id === "frostpine") extraShops.push(shopHouse(G, H, { x: -30, z: -40 }, 0xc8d8e8, "Frostbrush's Pet Shop", "Petkeeper Frostbrush", 0x6a8aa8, () => openPetShop(api), addCol));
  if (id === "reedmere") extraShops.push(shopHouse(G, H, { x: -64, z: 26 }, 0xf0c8d8, "Lagoon Pet Boutique", "Groomer Ripple", 0xd87aa0, () => openPetBoutique(api), addCol));
  // ✨ the magic + the lore of the place
  addMagic();

  function wondersInteract() {
    for (const sh of extraShops) {
      const it = sh.interactable(me());
      if (it) return it;
    }
    for (const w of wonders) {
      if (w.when && !w.when()) continue;
      if (near(w.at.x, w.at.z, w.r)) return { label: w.label, act: w.act };
    }
    return null;
  }

  // (test) &openstall=1 — open the first stall in this city
  if (new URLSearchParams(location.search).get("openstall")) setTimeout(() => stallNpcs[0] && openShop(stallNpcs[0].stall, stallNpcs[0].v), 3000);
  // ---------- E ----------
  function interactable() {
    const ev = eventInteract();
    if (ev || EV.running) return ev;
    const fishHere = fishInteract();
    if (fishHere) return fishHere;
    const wonder = wondersInteract();
    if (wonder) return wonder;
    for (const s of stallNpcs) {
      if (near(s.x, s.z, 3.2)) return { label: `browse ${s.stall.vendor}'s stall`, act: () => openShop(s.stall, s.v) };
    }
    const a = advInteract();
    if (a) return a;
    for (const p of crowd) {
      if (near(p.x, p.z, 2)) return { label: `say hello to the ${p.name.toLowerCase()}`, act: () => talk(p, [p.line]) };
    }
    return null;
  }

  // ---------- the golden markers for adventures ----------
  function update(t, dt) {
    for (const f of live) f(t, dt);
    eventUpdate(t, dt);
    for (const a of advs) for (const f of a.finds) if (f.g.visible) f.g.children[1].material.opacity = 0.55 + Math.sin(t * 3 + f.i) * 0.3;
    coinChip.textContent = `🪙 ${S.coins}`;
  }
  return { update, interactable, ownsRaft: () => !!S.owned.raft, eventRunning: () => EV.running || !!CH.run, leave: () => {
    if (EV.running) endEvent(MEDALS.unit === "s" ? 999 : EV.score);
    if (CH.run) endChallenge(999);
  } };
}

// ---------- shared UI bits ----------
let shopOpenNow = false;
let shopVendor = null;
let _shop = null;
/** when a card or list redraws itself (you bought something, put something
 *  on…) it stays scrolled right where you were — it never jumps to the top */
export function keepScrollOnRedraw(el) {
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  Object.defineProperty(el, "innerHTML", {
    configurable: true,
    get() {
      return desc.get.call(el);
    },
    set(v) {
      const title = (el.querySelector("h3, h2") || {}).textContent;
      // remember each scrolling box by its NAME (class) and which one it was — not by position,
      // so adding or removing an item can't make anything jump
      const keyed = (root) => {
        const seen = {};
        return [...root.querySelectorAll("*")].map((n) => {
          const k = n.tagName + "." + n.className;
          seen[k] = (seen[k] || 0) + 1;
          return [k + "#" + seen[k], n];
        });
      };
      const tops = { self: el.scrollTop };
      for (const [k, n] of keyed(el)) if (n.scrollTop) tops[k] = n.scrollTop;
      desc.set.call(el, v);
      if (window.__wwSwapPics) window.__wwSwapPics(el); // (the pictures go in first — they change how tall things are)
      if (!title || title !== (el.querySelector("h3, h2") || {}).textContent) return; // (a different screen: start at the top)
      const restore = () => {
        el.scrollTop = tops.self;
        for (const [k, n] of keyed(el)) if (tops[k]) n.scrollTop = tops[k];
      };
      restore();
      requestAnimationFrame(restore); // (and once more after the page has laid itself out)
    },
  });
}
// 🔄 PAY TO REFRESH a shop: brand-new items. Each refresh today costs more
//    than the last (and grows with your adventure), and you get 12 a day.
const REFRESH_PER_DAY = 12;
const refreshesToday = () => (S.refreshes && S.refreshes.day === (S.days || 0) ? S.refreshes.n : 0);
const refreshCost = () => Math.round(5 * (refreshesToday() + 1) * priceMult());
let refreshCtx = null;
function refreshRow(stall, draw) {
  refreshCtx = { stall, draw };
  const left = REFRESH_PER_DAY - refreshesToday();
  const c = refreshCost();
  return `<div class="refresh-row" style="display:flex;justify-content:center;align-items:center;gap:8px;margin:-4px 0 8px;font:13px system-ui;color:#6a4a1a">
    <button id="shopRefresh" ${left <= 0 || S.coins < c ? "disabled" : ""} style="font:bold 13px system-ui;padding:3px 12px;border-radius:999px">🔄 Refresh the stock · 🪙 ${c}</button>
    <span>${left > 0 ? `${left} refresh${left === 1 ? "" : "es"} left today` : "no refreshes left today — come back tomorrow!"}</span></div>`;
}
function doRefresh() {
  const R = refreshCtx;
  if (!R) return;
  const c = refreshCost();
  if (refreshesToday() >= REFRESH_PER_DAY || S.coins < c) return;
  S.coins -= c;
  const day = S.days || 0;
  if (!S.refreshes || S.refreshes.day !== day) S.refreshes = { day, n: 0 };
  S.refreshes.n++;
  (S.stallBump ||= {})[R.stall.vendor] = ((S.stallBump[R.stall.vendor]) || 0) + 1;
  save();
  R.draw(`🔄 ${R.stall.vendor.split(" ").pop().replace(/'s$/, "")} unpacks a whole new batch of things! (🪙 −${c})`);
}
// 🗝️ THE SHOPKEEPERS' BACK ROOMS: chat with a market shopkeeper a few times
//    and they'll trust you with the back room — rare treasures, each a secret.
const BACKROOM = {
  reedmere: [
    { key: "br_mermaidcomb", icon: "🪮", name: "The Mermaid's Comb", price: 60, keep: true, desc: "found tangled in a fishing net, long ago" },
    { key: "br_stormglass", icon: "🔮", name: "A Storm-Glass", price: 75, keep: true, desc: "it clouds over before every storm" },
    { key: "br_lighthousekey", icon: "🗝️", name: "The Old Lighthouse Key", price: 90, keep: true, desc: "nobody remembers which door it opens" },
  ],
  golden: [
    { key: "br_goldenspoon", icon: "🥄", name: "The Golden Ladle", price: 55, keep: true, desc: "stirs any soup into the best soup" },
    { key: "br_harvestbell", icon: "🔔", name: "The Harvest Bell", price: 70, keep: true, desc: "rung once a year, on harvest morning" },
    { key: "br_sunseed", icon: "🌻", name: "A Sun-Seed", price: 95, keep: true, desc: "it's warm in your paw, like a tiny sun" },
  ],
  frostpine: [
    { key: "br_auroravial", icon: "🧪", name: "A Vial of Aurora", price: 80, keep: true, desc: "a little bottled northern light" },
    { key: "br_yetiwool", icon: "🧶", name: "Snow-Giant Wool", price: 60, keep: true, desc: "the warmest wool in the world" },
    { key: "br_icecompass", icon: "🧭", name: "The Ice-Compass", price: 85, keep: true, desc: "it always points to the nearest warm hearth" },
  ],
};
const BACKROOM_POWERS = { br_mermaidcomb: ["air", 0.15], br_stormglass: ["fish", 0.12], br_lighthousekey: ["luck", 0.1], br_goldenspoon: ["heal", 0.12], br_harvestbell: ["grow", 0.25], br_sunseed: ["grow", 0.3], br_auroravial: ["luck", 0.1], br_yetiwool: ["warm", 0.8], br_icecompass: ["warm", 0.4] };
for (const list of Object.values(BACKROOM)) for (const it of list) EXTRA_KEEPS[it.key] = [it.icon, it.name];
for (const [k, [type, n]] of Object.entries(BACKROOM_POWERS)) ITEM_POWERS[k] = { type, n };
const CHAT_LINES = [
  "“Lovely day for it, isn't it? Business is slow — sit, sit, have a chat!”",
  "“My old grandad set up this very stall. He used to say: the best things are never on the counter.”",
  "“You're the famous Moonkeeper, aren't you? Hmm. I've heard you can keep a secret…”",
];
let chatCtx = null;
function chatRow(stall, cityId) {
  chatCtx = { stall, cityId };
  if (!BACKROOM[cityId]) return "";
  const n = (S.chats || {})[stall.vendor] || 0;
  return `<div style="display:flex;justify-content:center;gap:8px;margin:-2px 0 8px">
    <button id="shopChat" style="font:13px system-ui;padding:3px 12px;border-radius:999px">💬 chat with ${stall.vendor.split(" ").pop().replace(/'s$/, "")}</button>
    ${n >= 3 ? `<button id="shopBack" style="font:bold 13px system-ui;padding:3px 12px;border-radius:999px;background:#5a3a1a;color:#ffe8b0">🗝️ the back room</button>` : ""}</div>`;
}
function openBackRoom(msg = "") {
  const C = chatCtx;
  if (!C) return;
  const wares = inflate(BACKROOM[C.cityId]);
  const el = shopEl();
  el.innerHTML = `<div class="card"><h3>🗝️ ${C.stall.vendor}'s Back Room</h3><div class="coins">🪙 ${S.coins} coins · “Only for friends, mind!”</div>
    ${wares.map((it) => {
      const owned = (S.owned || {})[it.key];
      return `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>${it.desc}${powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}</small></span><button data-bk="${it.key}" ${owned || S.coins < it.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + it.price}</button></div>`;
    }).join("")}
    <div class="msg">${msg}</div><div class="close">Esc — slip back out through the curtain</div></div>`;
  el.querySelectorAll("button[data-bk]").forEach((b) => (b.onclick = () => {
    const it = wares.find((x) => x.key === b.dataset.bk);
    if (!it || S.coins < it.price) return;
    S.coins -= it.price;
    bought(it.key);
    (S.owned ||= {})[it.key] = true;
    save();
    openBackRoom(`You bought ${it.icon} ${it.name}! ${powerText(it.key)}`);
  }));
  el.classList.add("open");
  window.dispatchEvent(new CustomEvent("ww-secret", { detail: { id: "backroom_" + C.cityId } })); // (🔍 a secret!)
}
function shopEl() {
  if (_shop) return _shop;
  const style = document.createElement("style");
  style.textContent = `
    #shop { position: fixed; inset: 0; z-index: 56; display: none; align-items: flex-start; justify-content: center; padding-top: 7vh; background: rgba(8,6,14,.45); } /* (pinned to the top: buying never makes the card jump) */
    #shop.open { display: flex; }
    #shop .card { width: min(440px, 90vw); padding: 18px 20px 12px; border-radius: 16px; background: #f1e4c4; color: #3a2614;
      font: 15px/1.35 Georgia, serif; box-shadow: 0 14px 50px rgba(0,0,0,.6), inset 0 0 40px rgba(120,80,30,.22); }
    #shop h3 { margin: 0; text-align: center; font-size: 21px; color: #5a3a12; }
    #shop .coins { text-align: center; margin: 2px 0 10px; font: bold 15px system-ui; color: #8a6a1a; }
    #shop .item { display: flex; align-items: center; gap: 10px; margin: 6px 0; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.45); }
    #shop .item .ic { font-size: 26px; }
    #shop .item .nm { flex: 1; }
    #shop .item small { display: block; font-size: 12px; color: #7a5a3a; }
    #shop button { border: 0; border-radius: 9px; padding: 7px 12px; background: #5a3a12; color: #ffe6a8; font: bold 13px system-ui; cursor: pointer; }
    #shop button:disabled { opacity: .45; cursor: default; }
    #shop h4 { margin: 10px 0 4px; font-size: 15px; color: #5a3a12; }
    #shop h4 small { display: block; font: 11px system-ui; color: #8a6a44; }
    #shop .card { max-height: 88vh; overflow: auto; }
    #shop .swatches { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; }
    #shop .sw { height: 34px; border-radius: 9px; border: 2px solid rgba(0,0,0,.25); cursor: pointer; padding: 0; }
    #shop .sw.cur { border: 3px solid #2e6a3a; box-shadow: 0 0 0 2px #fff inset; }
    #shop .sell { max-height: 230px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 6px;
      padding: 6px; border-radius: 10px; background: #6a4a2c; }
    #shop .sell .cell { position: relative; padding: 7px 4px 5px; border-radius: 9px; background: rgba(30,18,8,.45); color: #f6ead0;
      text-align: center; font: 12px system-ui; cursor: pointer; }
    #shop .sell .cell:hover { background: rgba(255,211,106,.25); }
    #shop .sell .cell .ic { display: block; font-size: 24px; }
    #shop .sell .cell b { position: absolute; top: 3px; right: 6px; color: #ffd36a; }
    #shop .sell .cell .nm { display: block; font-size: 10px; line-height: 1.15; margin-top: 2px; }
    #shop .sell .cell .pr { display: block; margin-top: 3px; font-weight: bold; color: #b7f0bb; }
    #shop .sell .empty { grid-column: 1 / -1; color: #f6ead0; }
    #shop .empty { font-size: 13px; font-style: italic; color: #8a6a44; }
    #shop .msg { min-height: 18px; text-align: center; color: #2e7a3a; font-size: 13px; }
    #shop .close { text-align: center; font: 12px system-ui; color: #8a6a44; }
    #city-coins { position: fixed; top: 178px; left: 14px; z-index: 6; padding: 4px 10px; border-radius: 999px;
      background: rgba(30,22,14,.72); color: #ffd36a; font: bold 14px system-ui; display: none; }
    #event-hud { position: fixed; top: 120px; left: 50%; transform: translateX(-50%); z-index: 41; padding: 8px 18px;
      border-radius: 12px; background: rgba(20,16,10,.8); color: #fff3c8; font: bold 18px system-ui; display: none; }
  `;
  document.head.appendChild(style);
  _shop = document.createElement("div");
  keepScrollOnRedraw(_shop);
  _shop.addEventListener("click", (e) => {
    if (e.target.closest("#shopRefresh")) doRefresh();
    if (e.target.closest("#shopChat") && chatCtx) {
      const v = chatCtx.stall.vendor;
      S.chats ||= {};
      const n = (S.chats[v] = (S.chats[v] || 0) + 1);
      save();
      const msg = n <= CHAT_LINES.length ? CHAT_LINES[n - 1] : "“Always nice to see you, friend.”";
      if (refreshCtx) refreshCtx.draw(`💬 ${msg}${n === 3 ? " …“Come with me. I want to show you something.” (🗝️ the back room!)" : ""}`);
    }
    if (e.target.closest("#shopBack")) openBackRoom();
  });
  _shop.id = "shop";
  document.body.appendChild(_shop);
  window.addEventListener(
    "keydown",
    (e) => {
      if (!shopOpenNow) return;
      if (e.code === "Escape" || e.code === "KeyE") {
        _shop.classList.remove("open");
        shopOpenNow = false;
        if (shopVendor) shopVendor.mesh.userData.lookAt = null;
      }
      e.stopImmediatePropagation();
    },
    true
  );
  return _shop;
}
let _hud = null;
function hudEl() {
  shopEl();
  if (_hud) return _hud;
  _hud = document.createElement("div");
  _hud.id = "event-hud";
  document.body.appendChild(_hud);
  return _hud;
}
const coinChip = (() => {
  shopEl();
  const el = document.createElement("div");
  el.id = "city-coins";
  document.body.appendChild(el);
  return el;
})();
export const shopIsOpen = () => shopOpenNow;
export function showCoins(on) {
  coinChip.style.display = on ? "" : "none";
  coinChip.textContent = `🪙 ${S.coins}`;
}


// ======================================================================
//  🏛️ THE MUSEUM OF THE ALLIANCE (+ art gallery), in Everbough.
//  Donate the relics you find through the cafés' rumors. When all three
//  are on display, an artist paints YOUR portrait for the gallery.
// ======================================================================
const RELICS = [
  ["reedmere", "🧭", "the Compass Rose of the Moonkeepers", "from Reedmere's flooded ruins"],
  ["golden", "🌰", "the Golden Acorn", "from beneath Golden Hollow's first windmill"],
  ["frostpine", "💎", "the Heart of Frostpine", "from Frostpine's ice cave"],
];
export function initMuseum(group, H, api) {
  const at = { x: 46, z: -36 };
  const y = H(at.x, at.z);
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
  const face = Math.atan2(-at.x, -at.z);
  const g = new THREE.Group();
  g.position.set(at.x, y, at.z);
  g.rotation.y = face;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 9), M(0xe8e0d0));
  hall.position.y = 3.5;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 9, 4, 4).rotateY(Math.PI / 4).scale(1.1, 1, 0.72), M(0x6a7a9a));
  roof.position.y = 9;
  g.add(hall, roof);
  for (let k = -2; k <= 2; k++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 6.6, 10), M(0xf4f0e8));
    col.position.set(k * 3, 3.3, 5.2);
    g.add(col);
  }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 2, 4.52);
  g.add(door);
  // the sign
  // (🪧 crisp, high-res, unlit — see signs.js)
  const tex = signTexture("MUSEUM & GALLERY OF THE ALLIANCE", { bg: "#2a3656", frame: "#ffd88a", ink: "#ffe6a8" }, 9 / 1.25);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.25), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  sign.position.set(0, 6.4, 4.53);
  g.add(sign);
  // the portrait, on the wall outside, once painted
  const pcv = document.createElement("canvas");
  pcv.width = pcv.height = 128;
  const pc = pcv.getContext("2d");
  pc.fillStyle = "#c8a86a";
  pc.fillRect(0, 0, 128, 128);
  pc.fillStyle = "#3a5a8a";
  pc.fillRect(10, 10, 108, 108);
  pc.fillStyle = "#e8dcc0";
  pc.beginPath();
  pc.arc(64, 70, 30, 0, Math.PI * 2);
  pc.fill();
  pc.fillStyle = "#e8a8b0";
  pc.beginPath();
  pc.arc(38, 40, 14, 0, Math.PI * 2);
  pc.arc(90, 40, 14, 0, Math.PI * 2);
  pc.fill();
  pc.fillStyle = "#4a6a2a";
  pc.fillRect(30, 96, 68, 22);
  pc.fillStyle = "#1a1a1a";
  pc.fillRect(50, 64, 7, 9);
  pc.fillRect(71, 64, 7, 9);
  const ptex = new THREE.CanvasTexture(pcv);
  ptex.colorSpace = THREE.SRGBColorSpace;
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: ptex }));
  portrait.position.set(4.6, 3.4, 4.53);
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), M(0xc8a03a));
  frame.position.set(4.6, 3.4, 4.52);
  g.add(frame, portrait);
  group.add(g);
  const painted = () => RELICS.every(([k]) => S.relics && S.relics[k] === "donated");
  const sync = () => (portrait.visible = frame.visible = painted());
  sync();
  const doorAt = { x: at.x + Math.sin(face) * 6.5, z: at.z + Math.cos(face) * 6.5 };
  api.addCollider(at.x, at.z, 7.6);

  function open() {
    const el = shopEl();
    const draw = (msg = "") => {
      S.relics ||= {};
      el.innerHTML = `<div class="card"><h3>🏛️ Museum of the Alliance</h3><div class="coins">Curator Marlowe: "Every relic tells the story of the five cities."</div>
        ${RELICS.map(([k, icon, name, from]) => {
          const st = S.relics[k];
          const btn = st === "donated" ? "on display ✓" : st === "found" ? "donate" : "not found yet";
          return `<div class="item"><span class="ic">${st === "donated" || st === "found" ? icon : "❔"}</span><span class="nm">${st ? name : "an unknown relic"}<small>${st ? from : "Listen for rumors in the cities' cafés…"}</small></span><button data-k="${k}" ${st === "found" ? "" : "disabled"}>${btn}</button></div>`;
        }).join("")}
        <h4>🎨 The Gallery</h4><div class="empty">${painted() ? "A portrait of YOU hangs by the door — 'The Mouse Who Reunited the World'." : "The gallery's painters are waiting for something worth painting… (donate all three relics)"}</div>
        <div class="msg">${msg}</div><div class="close">Esc — leave</div></div>`;
      el.querySelectorAll("button[data-k]").forEach((b) => {
        b.onclick = () => {
          S.relics[b.dataset.k] = "donated";
          S.coins += 10;
          save();
          api.chime();
          sync();
          draw(painted() ? "All three relics! The painters have been busy — go and look by the door! 🎨" : "Donated! The curator thanks you. (+🪙 10)");
        };
      });
    };
    draw();
    el.classList.add("open");
    shopOpenNow = true;
  }
  registerRoom("room:museum", {
    name: "Museum & Gallery of the Alliance", kind: "museum", wall: 0xe8e0d0, floor: 0x9a8a72, rug: 0x3a4a6a,
    keeper: { tunic: 0x3a4a6a }, buildThistle, onUse: open, useLabel: "talk to Curator Marlowe",
    relics: () => RELICS.map(([k, icon, name]) => [icon, name, S.relics && S.relics[k] === "donated"]),
    portrait: painted,
  });
  return {
    interactable: (p) => (Math.hypot(p.x - doorAt.x, p.z - doorAt.z) < 3.2 ? { label: "go inside the Museum & Gallery", act: () => (shopHouseEnter ? shopHouseEnter("room:museum", { ...doorAt, face }) : open()) } : null),
    doorAt,
  };
}

// ======================================================================
//  👕 THE WARDROBE — clothing & accessories you can wear, and dye shops.
//  One thing per slot: head, ears, neck, body, wrist, feet, back.
//  Worn warm things keep you warm in Frostpine (see warmthBonus).
// ======================================================================
export const WEAR = {
  reedhat: { slot: "head", icon: "👒", name: "Reed Hat" },
  strawhat: { slot: "head", icon: "👒", name: "Straw Hat" },
  sunbonnet: { slot: "head", icon: "🌻", name: "Sunflower Bonnet" },
  harvestcrown: { slot: "head", icon: "👑", name: "Harvest Crown" },
  earmuffs: { slot: "ears", icon: "🎧", name: "Woolly Earmuffs", warm: 0.4 },
  seaglassearring: { slot: "ears", icon: "💎", name: "Sea-Glass Earring" },
  scarf: { slot: "neck", icon: "🧣", name: "Wool Scarf", warm: 0.7 },
  shellnecklace: { slot: "neck", icon: "🐚", name: "Shell Necklace" },
  pearlpendant: { slot: "neck", icon: "⚪", name: "Pearl Pendant" },
  snowsweater: { slot: "body", icon: "🧶", name: "Snowflake Sweater", warm: 0.6 },
  shellbracelet: { slot: "wrist", icon: "🐚", name: "Shell Bracelet" },
  boots: { slot: "feet", icon: "🥾", name: "Snow Boots", warm: 0.7 },
  fursocks: { slot: "feet", icon: "🧦", name: "Fur-Lined Socks", warm: 0.4 },
  scholarcape: { slot: "back", icon: "🧥", name: "Scholar's Cape" },
  explorercape: { slot: "back", icon: "🧥", name: "Explorer's Cape" },
  royalcape: { slot: "back", icon: "🧥", name: "Royal Cape" },
};
// each piece of clothing can ONLY be worn in the city that made it
const WEAR_CITY = {
  reedhat: "reedmere", seaglassearring: "reedmere", shellnecklace: "reedmere", pearlpendant: "reedmere", shellbracelet: "reedmere",
  strawhat: "golden", sunbonnet: "golden", harvestcrown: "golden",
  earmuffs: "frostpine", scarf: "frostpine", snowsweater: "frostpine", boots: "frostpine", fursocks: "frostpine",
  scholarcape: "everbough", explorercape: "everbough", royalcape: "everbough",
};
/** a new COLOR of a piece of clothing ("royalcape~2a6ab8") — wearable like the original */
function registerTint(k) {
  const [b, hex] = splitTint(k);
  if (hex == null || !WEAR[b]) return;
  WEAR[k] ||= { ...WEAR[b], name: `${tintName(hex)} ${WEAR[b].name}`, tint: hex };
  WEAR_CITY[k] ||= WEAR_CITY[b];
}
for (const k of Object.keys(S.owned)) if (k.includes("~")) registerTint(k);
const CITY_LABEL = { reedmere: "Reedmere", golden: "Golden Hollow", frostpine: "Frostpine", everbough: "Everbough", any: "anywhere" };
let wardrobeCity = null; // the city you're standing in right now (main.js tells us)
const SLOT_NAMES = { head: "Head", ears: "Ears", neck: "Neck", body: "Body", wrist: "Wrist", feet: "Feet", back: "Back", cloak: "Cloak" };
S.worn ||= {};
S.look ||= {};
// what you had on in EACH city (put back on automatically when you return)
S.wornBy ||= {};
// (the Owl-Feather Cloak is a keepsake again, not clothing — take it off)
if (S.wornBy.any) delete S.wornBy.any.cloak;
for (const [slot, k] of Object.entries(S.worn)) {
  const c = WEAR_CITY[k];
  if (c) ((S.wornBy[c] ||= {})[slot] = k);
}
S.worn = {};
/** what's being worn right now (only clothes from the city you're in) */
const wornNow = () => ({ ...(S.wornBy.any || {}), ...((wardrobeCity && S.wornBy[wardrobeCity]) || {}) });
/** main.js calls this whenever you go somewhere new */
export function setWardrobeCity(c) {
  if (c === wardrobeCity) return false;
  wardrobeCity = c;
  // first time here with clothes from this city? put them all on
  if (c && !S.wornBy[c]) {
    const outfit = {};
    for (const k of Object.keys(S.owned)) if (WEAR[k] && WEAR_CITY[k] === c && !outfit[WEAR[k].slot]) outfit[WEAR[k].slot] = k;
    if (Object.keys(outfit).length) {
      S.wornBy[c] = outfit;
      save();
    }
  }
  return true;
}
{
  // (tests) &coins=200 · &horse=1 · &hung=1 (a few things on the den + Reedmere house walls)
  const q = new URLSearchParams(location.search);
  S.homes ||= {};
  if (q.get("coins")) S.coins = +q.get("coins");
  if (q.get("horse")) S.owned.horse = true;
  if (q.get("studio")) setTimeout(() => openStudio({ chime() {} }), 4000); // (test)
  if (q.get("design")) {
    // (test) &design=sunhat|tophat|beret|bonnet|cape|scarf|sweater → wear a sample design
    const k = q.get("design");
    const isHat = ["sunhat", "tophat", "beret", "bonnet"].includes(k);
    const spec = { id: "design_test_" + k, name: "Test " + k, kind: isHat ? "hat" : k, shape: isHat ? k : "sunhat", color: 0xe86a8a, trim: 0xffffff, flower: "daisy", bow: true, pattern: "stripes" };
    S.designs = [spec];
    S.owned[spec.id] = true;
    S.wornBy.any = { [isHat ? "head" : { cape: "back", scarf: "neck", sweater: "body" }[k]]: spec.id };
  }
  if (q.get("ownclothes")) for (const k of ["earmuffs", "scarf", "boots", "snowsweater"]) S.owned[k] = true;
  if (q.get("ownhome")) (S.homes[q.get("ownhome")] ||= {}).owned = true;
  if (q.get("hung")) {
    (S.homes.den ||= {}).slots = { 0: { kind: "keep", key: "pearl", icon: "⚪", name: "Lagoon Pearl" }, 2: { kind: "medal", key: "reedmere", icon: "🥇", name: "Gold medal" } };
    (S.homes.reedmere ||= { owned: true }).slots = { 0: { kind: "keep", key: "snowglobe", icon: "🔮", name: "Snow Globe" }, 1: { kind: "pack", key: "feather", icon: "🪶", name: "Feather" }, 3: { kind: "medal", key: "golden", icon: "🥈", name: "Silver medal" } };
  }
}
if (new URLSearchParams(location.search).get("hangtest")) {
  // (test) living paintings on the cottage walls
  const T = [["coralcomb", "🪮", "Coral Comb"], ["starmap", "🗺️", "Star Map"], ["snowglobe", "🔮", "Snow Globe"], ["moonlantern", "🏮", "Moon Lantern"], ["stormscale", "💙", "Pip's Storm Scale"]];
  S.homes ||= {};
  S.homes.den = { slots: Object.fromEntries(T.map(([key, icon, name], i) => [i, { kind: "keep", key, icon, name }])) };
  for (const [k] of T) S.owned[k] = true;
}
if (new URLSearchParams(location.search).get("outfit")) {
  // (test) dress up in Frostpine's best
  for (const k of ["earmuffs", "scarf", "boots", "snowsweater", "strawhat"]) S.owned[k] = true;
  S.wornBy = { frostpine: { ears: "earmuffs", neck: "scarf", feet: "boots", body: "snowsweater" } };
  S.look = { fur: 0xb8784a, tunic: 0x5a8ac8, hood: 0x2a8a8a };
}
/** extra warmth from what you're wearing (0 = none) */
export const warmthBonus = () => Object.values(wornNow()).reduce((a, k) => a + ((WEAR[k] && WEAR[k].warm) || 0), 0) + (S.owned.wardenlantern ? 3 : 0) + power("warm"); // (🏮 the Warden's Ember Lantern keeps you warm · ✨ powers)
/** put something on (or take it off) — only in its own city. → a message if you can't */
export function toggleWear(k) {
  const w = WEAR[k];
  if (!w || !S.owned[k]) return null;
  const home = WEAR_CITY[k];
  if (home !== "any" && home !== wardrobeCity) return `${w.icon} ${w.name} can only be worn in ${CITY_LABEL[home]}.`;
  const worn = (S.wornBy[home] ||= {});
  if (worn[w.slot] === k) delete worn[w.slot];
  else worn[w.slot] = k;
  save();
  return null;
}
export function wardrobeList() {
  return Object.keys(WEAR)
    .filter((k) => S.owned[k])
    .map((k) => ({
      key: k, ...WEAR[k], slotName: SLOT_NAMES[WEAR[k].slot],
      worn: wornNow()[WEAR[k].slot] === k,
      here: WEAR_CITY[k] === wardrobeCity || WEAR_CITY[k] === "any",
      cityName: CITY_LABEL[WEAR_CITY[k]],
    }));
}
let lookListener = null;
export const onLookChange = (fn) => (lookListener = fn);
const lookChanged = () => lookListener && lookListener();
/** change one part of your look (fur / tunic / hood) — for magic things like the Painter's Brush */
export function setLook(part, hex) {
  S.look[part] = hex;
  save();
  lookChanged();
}

// the colors in the dye shops
export const FUR_DYES = [
  ["Natural Cream", null], ["Snow White", 0xf4f0e8], ["Cinnamon", 0xb8784a], ["Chocolate", 0x6a4a34], ["Silver Grey", 0xa8a8b0],
  ["Midnight", 0x3e3e4c], ["Honey Gold", 0xe0b860], ["Rose", 0xe8b0b8], ["Moonlight Blue", 0xb8c8e8], ["Ginger", 0xd8803a],
];
export const CLOTH_DYES = [
  ["Moss Green (original)", null], ["Sky Blue", 0x5a8ac8], ["Berry Red", 0xb83a4a], ["Sunflower Yellow", 0xe8c040], ["Lavender", 0x9a7ac8],
  ["Pumpkin Orange", 0xe0782a], ["Charcoal", 0x3a3a40], ["Rose Pink", 0xe890a8], ["Teal", 0x2a8a8a], ["Snow White", 0xf0ece4],
];
const FUR_ORIG = { 0xd9cbb0: 0, 0xece2cd: 0.35, 0xeae2d0: 0.3, 0xf6f1e6: 0.55 };
const TUNIC_ORIG = 0x6f7a42;
const HOOD_ORIG = 0x5f6a38;

const _c = new THREE.Color();
const white = new THREE.Color(0xffffff);
/** Dress Thistle: dye colors + every worn accessory. Safe to call again any time. */
/** a snug dome that hugs the top, sides and BACK of the head (under every hat) */
function headCap(col) {
  // (open in FRONT — phi 0.35π…1.65π wraps the sides and back; stops at the
  // equator, which sits above the eyes)
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 20, 10, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, flatShading: true, side: THREE.DoubleSide })
  );
  cap.position.y = 0.07;
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.3),
    new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, flatShading: true, side: THREE.DoubleSide })
  );
  top.position.y = 0.07;
  const g = new THREE.Group();
  g.add(cap, top);
  return g;
}
// 🎀 DESIGNED clothes (the Reedmere design studio): spec → a wearable
export function registerDesign(d) {
  const slot = { hat: "head", cape: "back", scarf: "neck", sweater: "body" }[d.kind];
  WEAR[d.id] = { slot, icon: { hat: "🎩", cape: "🧥", scarf: "🧣", sweater: "🧶" }[d.kind], name: d.name, design: d };
  WEAR_CITY[d.id] = "any";
}
function buildDesign(d, u, model, add, M) {
  const g = new THREE.Group();
  const col = d.color;
  const trim = d.trim;
  if (d.kind === "hat") {
    g.add(headCap(col));
    if (d.shape === "sunhat") {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.015, 20), M(col));
      brim.position.y = 0.15;
      g.add(brim);
    } else if (d.shape === "tophat") {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 18), M(col));
      brim.position.y = 0.17;
      const tall = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16), M(col));
      tall.position.y = 0.28;
      g.add(brim, tall);
    } else if (d.shape === "beret") {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 8), M(col));
      puff.scale.y = 0.4;
      puff.position.set(0.03, 0.17, -0.02);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 5), M(col));
      stalk.position.set(0.03, 0.25, -0.02);
      g.add(puff, stalk);
    } else if (d.shape === "bonnet") {
      // a soft frill framing the face, and ribbon ties down to the chin
      const frill = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.028, 6, 22, Math.PI * 1.15), M(trim));
      frill.rotation.z = -Math.PI * 0.075;
      frill.position.set(0, 0.04, 0.02);
      g.add(frill);
      for (const sx of [-1, 1]) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.012), M(trim));
        tie.position.set(sx * 0.12, -0.08, 0.05);
        tie.rotation.z = sx * 0.35;
        g.add(tie);
      }
    }
    // the ribbon round the crown (round the sides + back — never across the face)
    const tall = d.shape === "tophat";
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(tall ? 0.123 : 0.163, 0.016, 5, 24, tall ? Math.PI * 2 : Math.PI * 1.3), M(trim));
    ribbon.rotation.x = Math.PI / 2;
    if (!tall) ribbon.rotation.z = Math.PI * 0.85 + Math.PI / 2;
    ribbon.position.y = tall ? 0.2 : 0.11;
    if (d.shape !== "bonnet") g.add(ribbon);
    if (d.bow) {
      for (const sx of [-1, 1]) {
        const loop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), M(trim));
        loop.scale.set(1.4, 0.8, 0.5);
        loop.position.set(sx * 0.04, ribbon.position.y + 0.01, -0.17);
        g.add(loop);
      }
    }
    // flowers
    const FL = { daisy: [0xffffff, 0xffd84a], rose: [0xd83a4a, 0xa82a3a], sunflower: [0xffd84a, 0x5a3a1a], violet: [0x9a5ad8, 0xffe08a] }[d.flower];
    // a little posy of flowers tucked on the LEFT side of the hat
    if (FL) for (let i = 0; i < 3; i++) {
      const a = 1.15 + i * 0.32;
      const rr = tall ? 0.13 : 0.172;
      const y = (tall ? 0.2 : 0.12) + (i === 1 ? 0.035 : 0);
      const petals = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10), M(FL[0], { side: THREE.DoubleSide }));
      petals.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      petals.rotation.y = a;
      const mid = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), M(FL[1]));
      mid.position.set(Math.sin(a) * (rr + 0.006), y, Math.cos(a) * (rr + 0.006));
      g.add(petals, mid);
    }
    g.rotation.x = -0.15;
    add(u.head, g);
    return;
  }
  if (d.kind === "cape") {
    // (the same size as the city capes: drapes from the shoulders, under the pack)
    const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.44, 14, 1, true, Math.PI * 0.62, Math.PI * 0.76), M(col, { side: THREE.DoubleSide }));
    cape.position.set(0, 0.29, -0.035);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.014, 5, 16, Math.PI * 0.76), M(trim));
    edge.rotation.x = Math.PI / 2;
    edge.rotation.z = Math.PI * 0.62 - Math.PI / 2;
    edge.position.set(0, 0.075, -0.035);
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M(trim));
    clasp.position.set(0, 0.5, 0.11);
    g.add(cape, edge, clasp);
  } else if (d.kind === "scarf") {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 6, 16), M(col));
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, 0.52, 0.02);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.03), M(col));
    tail.position.set(0.07, 0.42, 0.15);
    tail.rotation.z = 0.2;
    g.add(wrap, tail);
    if (d.pattern !== "plain") for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(d.pattern === "dots" ? new THREE.SphereGeometry(0.012, 5, 4) : new THREE.BoxGeometry(0.062, 0.015, 0.027), M(trim));
      st.position.set(0.07, 0.37 + i * 0.045, 0.166);
      g.add(st);
    }
  } else if (d.kind === "sweater") {
    const knit = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.2, 14, 1, true), M(col, { side: THREE.DoubleSide }));
    knit.position.y = 0.43;
    g.add(knit);
    if (d.pattern === "stripes") for (let i = 0; i < 3; i++) {
      // (snug to the knit, which tapers from r 0.19 at the hem to 0.17 at the top)
      const y = 0.36 + i * 0.06;
      const r = 0.19 - ((y - 0.33) / 0.2) * 0.02 + 0.004;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.001, r + 0.001, 0.025, 14, 1, true), M(trim, { side: THREE.DoubleSide }));
      band.position.y = y;
      g.add(band);
    } else if (d.pattern === "dots") for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 5, 4), M(trim));
      dot.position.set(Math.cos(a) * 0.182, 0.38 + (i % 2) * 0.07, Math.sin(a) * 0.182);
      g.add(dot);
    }
  }
  add(model, g);
}
for (const d of S.designs || []) registerDesign(d);
export function applyLook(model) {
  if (!model) return;
  const u = model.userData;
  // dyes
  model.traverse((o) => {
    if (!o.isMesh || o.userData.wardrobe) return;
    const m = o.material;
    if (!m || !m.color) return;
    if (m.userData.orig === undefined) m.userData.orig = m.color.getHex();
    const orig = m.userData.orig;
    if (orig in FUR_ORIG) {
      if (S.look.fur) m.color.copy(_c.setHex(S.look.fur).lerp(white, FUR_ORIG[orig]));
      else m.color.setHex(orig);
    } else if (orig === TUNIC_ORIG) m.color.setHex(S.look.tunic || orig);
    else if (orig === HOOD_ORIG) m.color.setHex(S.look.hood || orig);
  });
  // remove old accessories, then dress
  const old = [];
  model.traverse((o) => o.userData.wardrobe && o.userData.isRoot && old.push(o));
  old.forEach((o) => o.parent.remove(o));
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...e });
  let addedNow = [];
  const add = (parent, mesh) => {
    mesh.userData.wardrobe = true;
    mesh.userData.isRoot = true;
    mesh.traverse((o) => (o.userData.wardrobe = true));
    parent.add(mesh);
    addedNow.push(mesh);
  };
  // 🎩 wearing a hat? the hood folds away, so the hat sits right ON your head
  const hatOn = !!wornNow().head;
  model.traverse((o) => o.userData && o.userData.isHood && (o.visible = !hatOn));
  for (const [slot, kWorn] of Object.entries(wornNow())) {
    const [k, tint] = splitTint(kWorn); // (a new color of the same thing)
    addedNow = [];
    if (WEAR[k] && WEAR[k].design) {
      buildDesign(WEAR[k].design, u, model, add, M);
      continue;
    }
    const g = new THREE.Group();
    if (k === "reedhat" || k === "strawhat" || k === "sunbonnet") {
      const col = k === "reedhat" ? 0xb8a86a : k === "strawhat" ? 0xe8c878 : 0xf0d890;
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.015, 18), M(col));
      brim.position.y = 0.15;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 14), M(col));
      crown.position.y = 0.2;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.121, 0.121, 0.025, 14), M(k === "reedhat" ? 0x3a8a9a : 0xb83a4a));
      band.position.y = 0.165;
      g.add(brim, crown, band, headCap(col));
      if (k === "sunbonnet") {
        const flower = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), M(0xffd84a, { side: THREE.DoubleSide }));
        flower.position.set(0.09, 0.22, 0.06);
        flower.rotation.y = 0.6;
        const mid = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), M(0x5a3a1a));
        mid.position.set(0.095, 0.22, 0.065);
        g.add(flower, mid);
      }
      g.rotation.x = -0.15;
      add(u.head, g);
    } else if (k === "harvestcrown") {
      g.add(headCap(0xe8c868)); // (a woven-wheat cap under the crown, covering the back of the head)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 18), M(0xd8a83a, { metalness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.15;
      g.add(ring);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.08, 5), M(0xe8c858));
        ear.position.set(Math.cos(a) * 0.12, 0.19, Math.sin(a) * 0.12);
        g.add(ear);
      }
      add(u.head, g);
    } else if (k === "earmuffs") {
      // fluffy muffs right ON the ears (Thistle's ears sit at ±0.105, 0.165)
      for (const sx of [-1, 1]) {
        const muff = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), M(0xe85a7a));
        muff.scale.set(0.75, 1, 0.75);
        muff.position.set(sx * 0.112, 0.18, -0.012);
        g.add(muff);
      }
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.012, 5, 16, Math.PI), M(0x6a6a72));
      band.position.set(0, 0.2, -0.012);
      g.add(band);
      add(u.head, g);
    } else if (k === "seaglassearring") {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), M(0x6ad8b8, { emissive: 0x2a6a5a }));
      gem.position.set(0.12, 0.12, -0.01);
      g.add(gem);
      add(u.head, g);
    } else if (k === "scarf") {
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 6, 16), M(0xc83a3a));
      wrap.rotation.x = Math.PI / 2;
      wrap.position.set(0, 0.52, 0.02);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.03), M(0xc83a3a));
      tail.position.set(0.07, 0.42, 0.15);
      tail.rotation.z = 0.2;
      for (let i = 0; i < 3; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.015, 0.027), M(0xf4ece0));
        stripe.position.set(0.07, 0.37 + i * 0.045, 0.166);
        stripe.rotation.z = 0.2;
        g.add(stripe);
      }
      g.add(wrap, tail);
      add(model, g);
    } else if (k === "shellnecklace" || k === "pearlpendant") {
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.006, 4, 18), M(0x6a4a2a));
      cord.rotation.x = Math.PI / 2 - 0.3;
      cord.position.y = 0.52;
      g.add(cord);
      if (k === "shellnecklace") {
        for (let i = 0; i < 5; i++) {
          const a = Math.PI * 0.25 + (i / 4) * Math.PI * 0.5;
          const sh = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 5), M(0xf4d8c8));
          sh.position.set(Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1);
          g.add(sh);
        }
      } else {
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M(0xf8f4ff, { roughness: 0.2, metalness: 0.3 }));
        pearl.position.set(0, 0.48, 0.11);
        g.add(pearl);
      }
      add(model, g);
    } else if (k === "snowsweater") {
      const knit = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.2, 14, 1, true), M(0xe8eef8, { side: THREE.DoubleSide }));
      knit.position.y = 0.43;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.182, 0.182, 0.035, 14, 1, true), M(0x4a6aa8, { side: THREE.DoubleSide }));
      band.position.y = 0.45;
      g.add(knit, band);
      add(model, g);
    } else if (k === "shellbracelet") {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 4, 12), M(0xf4d8c8));
      b.rotation.x = Math.PI / 2;
      b.position.y = -0.16;
      g.add(b);
      if (u.armR) add(u.armR, g);
    } else if (k === "boots" || k === "fursocks") {
      for (const leg of [u.legL, u.legR]) {
        if (!leg) continue;
        const one = new THREE.Group();
        if (k === "boots") {
          const boot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.13), M(0x5a3a24));
          boot.position.set(0, -0.2, 0.045);
          const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.045, 10), M(0xf4ece0));
          cuff.position.y = -0.15;
          one.add(boot, cuff);
        } else {
          const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.08, 10), M(0xd8c8a8));
          sock.position.y = -0.17;
          one.add(sock);
        }
        add(leg, one);
      }
    } else if (k === "scholarcape" || k === "explorercape" || k === "royalcape") {
      const col = { scholarcape: 0x3a4a8a, explorercape: 0x4a6a3a, royalcape: 0x6a2a7a }[k];
      const cape = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.26, 0.44, 12, 1, true, Math.PI * 0.65, Math.PI * 0.7),
        M(col, { side: THREE.DoubleSide })
      );
      cape.position.set(0, 0.29, -0.03);
      g.add(cape);
      if (k === "royalcape") {
        const trim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 5, 16), M(0xe8c858, { metalness: 0.5 }));
        trim.rotation.x = Math.PI / 2;
        trim.position.y = 0.51;
        g.add(trim);
      }
      add(model, g);
    }
    if (tint != null) addedNow.forEach((m) => tintMeshes(m, tint));
  }
}

/** the colors on a dye shop's shelf: the originals, plus 5 NEW colors every
 *  time you've bought every color there is */
function dyeList(kind) {
  const base = kind === "fur" ? FUR_DYES : CLOTH_DYES;
  const more = (S.dyeMore || {})[kind] || 0;
  const extra = TINTS.filter(([, h]) => !base.some(([, b]) => b === h)).slice(0, more * 5);
  return [...base, ...extra];
}
function noteDyeBought(kind, hex) {
  const bought = ((S.dyeBought ||= {})[kind] ||= {});
  bought[hex] = true;
  const all = dyeList(kind).filter(([, h]) => h);
  if (all.every(([, h]) => bought[h]) && all.length < FUR_DYES.length + TINTS.length) {
    (S.dyeMore ||= {})[kind] = ((S.dyeMore || {})[kind] || 0) + 1;
    return true;
  }
  return false;
}
/** a dye shop card (fur, or tunic + hood) */
// 👗 SELL YOUR CLOTHES — any clothing or dye shop buys back clothes and hats
//    (half what they cost, growing a little with your adventure like all selling)
function wearBasePrice(k) {
  const base = k.split("~")[0];
  const lists = [...Object.values(MARKETS).flatMap((m) => m.stalls || []).flatMap((st) => [st.items, ...(RESTOCK[st.vendor] || [])].flat()), ...EVER_STALLS.flatMap((st) => st.items || [])];
  const it = lists.find((x) => x && x.key === base);
  const p = it ? it.basePrice ?? it.price : 12;
  return k.includes("~") ? p + 4 : p;
}
const wearSellPrice = (k) => Math.max(2, Math.round(wearBasePrice(k) * 0.5 * sellMult()));
const sellsClothes = (stall) => [stall.items, ...(RESTOCK[stall.vendor] || [])].flat().some((it) => it && WEAR[it.key]);
function sellClothesHTML() {
  const list = wardrobeList();
  return `<h4>👗 Sell your clothes</h4>${list.length
    ? `<div class="sell">${list.map((w) => `<button class="cell" data-sellwear="${w.key}" title="Sell your ${w.name}"><span class="ic">${w.icon}</span><span class="nm">${w.name}${w.worn ? " (wearing)" : ""}</span><span class="pr">🪙 ${wearSellPrice(w.key)}</span></button>`).join("")}</div>`
    : `<div class="empty">You don't have any clothes to sell.</div>`}`;
}
function bindSellClothes(el, draw, api) {
  el.querySelectorAll("button[data-sellwear]").forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.sellwear;
      if (!S.owned[k] || !WEAR[k]) return;
      const pr = wearSellPrice(k);
      delete S.owned[k];
      for (const c of Object.keys(S.wornBy)) if (S.wornBy[c] && S.wornBy[c][WEAR[k].slot] === k) delete S.wornBy[c][WEAR[k].slot];
      S.coins += pr;
      save();
      lookChanged();
      api.chime();
      draw(`Sold your ${WEAR[k].name} for 🪙 ${pr}!`);
    };
  });
}
function openDyeShop(kind, api) {
  const el = shopEl();
  const price = cost(kind === "fur" ? 10 : 6, "dye"); // (🪙 grows with your adventure)
  const draw = (msg = "") => {
    const rows = (part, list) =>
      `<div class="swatches">${list
        .map(([name, hex], i) => {
          const cur = (S.look[part] || null) === hex;
          return `<button class="sw ${cur ? "cur" : ""}" data-part="${part}" data-i="${i}" title="${name}" style="background:${hex ? "#" + hex.toString(16).padStart(6, "0") : "linear-gradient(135deg,#ece2cd,#d9cbb0)"}"></button>`;
        })
        .join("")}</div>`;
    el.innerHTML = `<div class="card"><h3>${kind === "fur" ? "✨ Madame Velvet's Fur Dye Salon" : "🎨 Dyer Madder's Cloth Dyes"}</h3>
      <div class="coins">🪙 ${S.coins} coins · ${price} coins a color (going back to natural is free)</div>
      ${kind === "fur" ? `<h4>Your fur</h4>${rows("fur", dyeList("fur"))}` : `<h4>Your tunic</h4>${rows("tunic", dyeList("cloth"))}<h4>Your hood</h4>${rows("hood", dyeList("cloth"))}`}
      ${sellClothesHTML()}
      <div class="msg">${msg}</div><div class="close">Esc — leave · B → 👀 mirror to admire yourself</div></div>`;
    el.querySelectorAll("button.sw").forEach((b) => {
      b.onclick = () => {
        const part = b.dataset.part;
        const list = dyeList(part === "fur" ? "fur" : "cloth");
        const [name, hex] = list[+b.dataset.i];
        if ((S.look[part] || null) === hex) return;
        if (hex && S.coins < price) return draw("Not enough coins for that one!");
        if (hex) S.coins -= price;
        S.look[part] = hex;
        const fresh = hex && noteDyeBought(part === "fur" ? "fur" : "cloth", hex);
        save();
        lookChanged();
        api.chime();
        draw(`${part === "fur" ? "Your fur" : "Your " + part} is now ${name}!${fresh ? " ✨ You've tried every color — 5 NEW colors just arrived!" : ""}`);
      };
    });
    bindSellClothes(el, draw, api);
  };
  draw();
  el.classList.add("open");
  shopOpenNow = true;
}

let shopHouseEnter = null; // main.js: enterHome(roomId, back)
export const setRoomEnter = (fn) => (shopHouseEnter = fn);
/** a little shop building with a keeper — opens a dye shop or an outfit shop */
// ======================================================================
//  🎀 THE DESIGN STUDIO (Reedmere) — design your OWN hats and clothes:
//  choose the shape, the colors, a ribbon, flowers, a pattern. Every
//  design is yours to wear anywhere.
// ======================================================================
const STUDIO_COLS = [["Rose", 0xe86a8a], ["Sky", 0x6aa8e8], ["Sunshine", 0xf0c840], ["Meadow", 0x6ab84a], ["Lilac", 0xb88ae8], ["Cream", 0xf4ecd8], ["Cocoa", 0x7a4a2e], ["Midnight", 0x2a2a5a], ["Coral", 0xf07a5a], ["Teal", 0x2a9a9a], ["Ruby", 0xb82a3a], ["Snow", 0xffffff]];
export function openStudio(api) {
  const el = shopEl();
  const d = { kind: "hat", shape: "sunhat", color: 0xe86a8a, trim: 0xffffff, flower: "daisy", bow: true, pattern: "stripes" };
  const PRICE = { hat: 18, cape: 22, scarf: 12, sweater: 20 };
  const swatches = (key) => `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0">${STUDIO_COLS.map(([nm, c]) => `<button title="${nm}" data-${key}="${c}" style="width:26px;height:26px;border-radius:50%;border:${d[key] === c ? "3px solid #3a2614" : "2px solid #fff"};background:#${c.toString(16).padStart(6, "0")}"></button>`).join("")}</div>`;
  const opt = (key, list) => `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0">${list.map(([v, label]) => `<button data-${key}="${v}" style="${String(d[key]) === String(v) ? "background:#5a3a12;color:#fff" : ""}">${label}</button>`).join("")}</div>`;
  const draw = (msg = "") => {
    el.innerHTML = `<div class="card" style="width:min(520px,94vw);max-height:86vh;overflow:auto"><h3>🎀 Madame Ribbon's Design Studio</h3><div class="coins">🪙 ${S.coins} · design it yourself — wear it ANYWHERE</div>
      <h4>What are you making?</h4>${opt("kind", [["hat", "🎩 hat"], ["cape", "🧥 cape"], ["scarf", "🧣 scarf"], ["sweater", "🧶 sweater"]])}
      ${d.kind === "hat" ? `<h4>Shape</h4>${opt("shape", [["sunhat", "👒 sun hat"], ["tophat", "🎩 top hat"], ["beret", "🎨 beret"], ["bonnet", "🌸 bonnet"]])}` : ""}
      <h4>Main color</h4>${swatches("color")}
      <h4>${d.kind === "hat" ? "Ribbon" : "Trim / pattern"} color</h4>${swatches("trim")}
      ${d.kind === "hat" ? `<h4>Flowers</h4>${opt("flower", [["none", "none"], ["daisy", "🌼 daisies"], ["rose", "🌹 roses"], ["sunflower", "🌻 sunflowers"], ["violet", "💜 violets"]])}<h4>A bow at the back?</h4>${opt("bow", [[true, "🎀 yes"], [false, "no"]])}` : ""}
      ${d.kind === "scarf" || d.kind === "sweater" ? `<h4>Pattern</h4>${opt("pattern", [["plain", "plain"], ["stripes", "stripes"], ["dots", "polka dots"]])}` : ""}
      <div style="text-align:center;margin-top:10px"><button id="dmake" style="font:bold 16px system-ui;padding:8px 18px" ${S.coins < cost(PRICE[d.kind], "design") ? "disabled" : ""}>✂️ Make it! (🪙 ${cost(PRICE[d.kind], "design")})</button></div>
      ${sellClothesHTML()}
      <div class="msg">${msg}</div><div class="close">Esc — leave · your designs are in your backpack (B → Clothing)</div></div>`;
    bindSellClothes(el, draw, api);
    for (const key of ["kind", "shape", "flower", "bow", "pattern", "color", "trim"]) {
      el.querySelectorAll(`button[data-${key}]`).forEach((b) => (b.onclick = () => {
        const v = b.dataset[key];
        d[key] = key === "color" || key === "trim" ? +v : key === "bow" ? v === "true" : v;
        draw();
      }));
    }
    el.querySelector("#dmake").onclick = () => {
      const dPrice = cost(PRICE[d.kind], "design");
      if (S.coins < dPrice) return;
      const nm = (prompt("Give your design a name!", `My ${d.kind === "hat" ? { sunhat: "Sun Hat", tophat: "Top Hat", beret: "Beret", bonnet: "Bonnet" }[d.shape] : d.kind[0].toUpperCase() + d.kind.slice(1)}`) || "").trim().slice(0, 30);
      if (!nm) return;
      S.coins -= dPrice;
      bought("design");
      const spec = { ...d, id: "design_" + Date.now(), name: nm };
      (S.designs ||= []).push(spec);
      registerDesign(spec);
      S.owned[spec.id] = true;
      (S.wornBy.any ||= {})[WEAR[spec.id].slot] = spec.id; // (put it straight on)
      save();
      lookChanged();
      api.chime();
      draw(`✂️ “${nm}” is finished — and you're wearing it! ${powerText(spec.id)} (Wear it anywhere · swap it in your backpack)`);
    };
  };
  draw();
  el.classList.add("open");
  shopOpenNow = true;
}
export function shopHouse(group, H, at, color, label, keeperName, keeperTunic, onOpen, addCol) {
  const y = H(at.x, at.z);
  const face = Math.atan2(-at.x, -at.z);
  const g = new THREE.Group();
  g.position.set(at.x, y, at.z);
  g.rotation.y = face;
  const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 4, 12), M(color));
  body.position.y = 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3, 12), M(0x5a3e5a));
  roof.position.y = 5.5;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
  win.position.set(0, 1.7, 3.42);
  g.add(body, roof, win);
  // (🪧 crisp, high-res, unlit — see signs.js)
  const tex = signTexture(label, { bg: "#3a2a3a", frame: "#e8b8d8", ink: "#ffe6f0" }, 4.4 / 1.1);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  sign.position.set(0, 3.25, 3.45); // (under the eaves, never behind them)
  g.add(sign);
  group.add(g);
  addCol(at.x, at.z, 4);
  // a door you can walk through — the keeper is inside, behind the counter
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.05, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(Math.sin(0.58) * 3.78, 1.05, Math.cos(0.58) * 3.78); // (just outside the round wall)
  door.rotation.y = 0.58;
  g.add(door);
  const roomId = "room:" + label;
  registerRoom(roomId, { name: label, kind: "shop", wall: color, rug: 0x6a4a8a, keeper: { tunic: keeperTunic }, buildThistle, onUse: onOpen, useLabel: `talk to ${keeperName}` });
  const dx = at.x + Math.sin(face) * 5 + Math.cos(face) * 1.9;
  const dz = at.z + Math.cos(face) * 5 - Math.sin(face) * 1.9;
  return {
    interactable: (p, api2) => (Math.hypot(p.x - dx, p.z - dz) < 2.6 ? { label: `go inside ${label}`, act: () => (shopHouseEnter ? shopHouseEnter(roomId, { x: dx, z: dz, face }) : onOpen()) } : null),
  };
}

/** Everbough's fashion street: the Fur Dye Salon + the Tailor (capes) */
export function initEverboughShops(group, H, api) {
  const salon = shopHouse(group, H, { x: -42, z: -50 }, 0xe8b8d8, "Fur Dye Salon", "Madame Velvet", 0xc87ab0, () => openDyeShop("fur", api), api.addCollider);
  const tailorStall = {
    vendor: "Tailor Bobbin",
    items: [
      { key: "scholarcape", icon: "🧥", name: "Scholar's Cape", price: 16, keep: true, desc: "WEAR IT: deep Academy blue" },
      { key: "explorercape", icon: "🧥", name: "Explorer's Cape", price: 16, keep: true, desc: "WEAR IT: Guild green, for the trail" },
      { key: "royalcape", icon: "🧥", name: "Royal Cape", price: 30, keep: true, desc: "WEAR IT: purple, with golden trim" },
    ],
  };
  MARKETS.everbough = { stalls: [tailorStall, ...EVER_STALLS] }; // (so ownedList knows the capes + keepsakes)
  const market = initEverboughMarket(group, H, api);
  const tailor = shopHouse(group, H, { x: 40, z: -62 }, 0xb8c8e8, "Tailor Bobbin's", "Tailor Bobbin", 0x5a6aa8, () => openOutfitShop(tailorStall, api), api.addCollider);
  const house = makeHouseForSale(group, H, { x: 60, z: -8 }, "everbough", api);
  return { interactable: (p) => salon.interactable(p) || tailor.interactable(p) || house.interactable(p) || market.interactable(p) };
}

// ======================================================================
//  🛍️ EVERBOUGH'S MARKET CIRCLE — every stall round the fountain sells
//  something (and, like every shop, restocks forever as you buy it out)
// ======================================================================
const EVER_STALLS = [
  { vendor: "Scribe Inkwell", tunic: 0x3a4a8a, items: [
    { key: "eb_quill", icon: "🪶", name: "Quill & Ink Set", price: 12, keep: true, desc: "For writing your own legends" },
    { key: "eb_journal", icon: "📔", name: "Leather-Bound Journal", price: 15, keep: true, desc: "Blank pages, waiting for you" },
    { key: "eb_candle", icon: "🕯️", name: "Reading Candle", price: 6, keep: true, desc: "Burns all night in the Grand Library" },
  ] },
  { vendor: "Baker Acorn", tunic: 0xc8884a, items: [
    { key: "eb_bread", icon: "🍞", name: "Acorn Bread", price: 4, heal: 20, desc: "Warm from the oven (+20 ❤️)" },
    { key: "eb_muffin", icon: "🧁", name: "Moss Muffin", price: 3, heal: 15, desc: "Greener than it tastes (+15 ❤️)" },
    { key: "eb_honeycake", icon: "🍯", name: "Canopy Honey Cake", price: 6, heal: 30, desc: "From the highest hives (+30 ❤️)" },
  ] },
  { vendor: "Herbalist Sorrel", tunic: 0x4a8a5a, items: [
    { key: "eb_minttea", icon: "🍵", name: "Mint Tea", price: 3, heal: 15, warm: true, desc: "Warms you right through (+15 ❤️)" },
    { key: "eb_salve", icon: "🌿", name: "Healing Salve", price: 9, heal: 50, desc: "For scrapes and bumps (+50 ❤️)" },
    { key: "eb_lavender", icon: "💜", name: "Dried Lavender Bundle", price: 7, keep: true, desc: "Smells like summer" },
  ] },
  { vendor: "Mapmaker Meridian", tunic: 0x8a6a3a, items: [
    { key: "eb_map", icon: "🗺️", name: "Map of the Five Cities", price: 18, keep: true, desc: "Every road the Moonkeepers walked" },
    { key: "eb_compass", icon: "🧭", name: "Brass Compass", price: 14, keep: true, desc: "Always points home" },
    { key: "eb_stargazer", icon: "🔭", name: "Stargazer's Glass", price: 22, keep: true, desc: "From the Highcanopy observatory" },
  ] },
  { vendor: "Toymaker Tumble", tunic: 0xc84a6a, items: [
    { key: "eb_top", icon: "🪀", name: "Acorn Spinning Top", price: 5, keep: true, desc: "Spins for a whole minute" },
    { key: "eb_kite", icon: "🪁", name: "Leaf Kite", price: 9, keep: true, desc: "Flies best in the canopy winds" },
    { key: "eb_doll", icon: "🧸", name: "Felt Mouse Doll", price: 11, keep: true, desc: "It looks a bit like you!" },
  ] },
  { vendor: "Jeweler Glimmer", tunic: 0x6a4a8a, items: [
    { key: "eb_moonring", icon: "💍", name: "Moonstone Ring", price: 24, keep: true, desc: "Glows faintly at night" },
    { key: "eb_beads", icon: "📿", name: "Acorn-Bead Necklace", price: 12, keep: true, desc: "Polished by a hundred paws" },
    { key: "eb_brooch", icon: "💎", name: "Dewdrop Brooch", price: 16, keep: true, desc: "A real dewdrop, frozen in crystal" },
  ] },
  { vendor: "Gardener Bramblewick", tunic: 0x5a7a2a, items: [
    { key: "eb_seeds", icon: "🌱", name: "Packet of Wonder Seeds", price: 6, keep: true, desc: "Nobody knows what they'll grow" },
    { key: "eb_bonsai", icon: "🪴", name: "Tiny Bonsai Oak", price: 14, keep: true, desc: "A whole Everbough, in a pot" },
    { key: "eb_berries", icon: "🫐", name: "Basket of Berries", price: 4, heal: 20, desc: "Fresh-picked (+20 ❤️)" },
  ] },
  { vendor: "Lantern-maker Glowworth", tunic: 0xd8a83a, items: [
    { key: "eb_paperlantern", icon: "🏮", name: "Paper Lantern", price: 8, keep: true, desc: "Painted with tiny oak leaves" },
    { key: "eb_fireflylamp", icon: "✨", name: "Firefly Lamp", price: 13, keep: true, desc: "The fireflies come and go as they please" },
    { key: "eb_glowjar", icon: "🫙", name: "Jar of Glow-Moss", price: 10, keep: true, desc: "A little light from Moonstone Hollow" },
  ] },
];
/** the 8 stalls round the fountain (main.js builds them at radius 24) */
function initEverboughMarket(group, H, api) {
  const spots = EVER_STALLS.map((stall, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    // the stallkeeper stands behind the counter, facing the fountain
    const vx = Math.cos(a) * 25.5;
    const vz = Math.sin(a) * 25.5;
    const m = buildThistle({ tunicColor: stall.tunic, hoodColor: stall.tunic, pack: false });
    m.position.set(vx, H(vx, vz), vz);
    m.rotation.y = Math.atan2(-vx, -vz);
    group.add(m);
    // a little hanging sign with the stallkeeper's name
    // (🪧 crisp + readable from both sides — see signs.js)
    const sign = signBoard(`${stall.items[0].icon} ${stall.vendor}`, { w: 2.8, h: 0.6, style: "wood" });
    const sx = Math.cos(a) * 23.2;
    const sz = Math.sin(a) * 23.2;
    sign.position.set(sx, H(sx, sz) + 2.95, sz);
    sign.rotation.y = Math.atan2(-sx, -sz);
    group.add(sign);
    // (you shop from the fountain side of the counter)
    return { stall, x: Math.cos(a) * 22.2, z: Math.sin(a) * 22.2 };
  });
  return {
    interactable(p) {
      for (const s of spots) {
        if (Math.hypot(p.x - s.x, p.z - s.z) < 2.4) return { label: `shop at ${s.stall.vendor}'s stall`, act: () => openEverStall(s.stall, api) };
      }
      return null;
    },
  };
}
function openEverStall(stall, api) {
  const el = shopEl();
  const sellRows = () => {
    const items = (api.packList ? api.packList() : []).filter(([, n]) => n > 0);
    if (!items.length) return `<div class="empty">Your pack is empty — gather things in the forest, or go fishing!</div>`;
    return items
      .map(([k, n]) => {
        const nm = k.replace(/\b\w/g, (c) => c.toUpperCase());
        return `<button class="cell" data-sell="${k}" title="Sell one ${nm}"><span class="ic">${api.iconFor ? api.iconFor(k) : "📦"}</span><b>${n}</b><span class="nm">${nm}</span><span class="pr">🪙 ${sellPrice(k)}</span></button>`;
      })
      .join("");
  };
  const draw = (msg = "") => {
    const oldSell = el.querySelector(".sell");
    const oldCard = el.querySelector(".card");
    const keep = { sell: oldSell ? oldSell.scrollTop : 0, card: oldCard ? oldCard.scrollTop : 0 };
    const stock = stockOf(stall);
    el.innerHTML = `<div class="card"><h3>${stall.vendor}</h3><div class="coins">🪙 ${S.coins} coins${stock.restocked ? " · ✨ fresh stock!" : ""}</div>${refreshRow(stall, draw)}
      ${stock.items.map((it) => {
        const owned = it.keep && S.owned[it.key];
        return `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>${it.desc}${powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}</small></span>
          <button data-k="${it.key}" ${owned || S.coins < it.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + it.price}</button></div>`;
      }).join("")}
      <h4>Sell from your pack</h4>
      <div class="sell">${sellRows()}</div>
      <div class="msg">${msg}</div><div class="close">Esc — leave the stall</div></div>`;
    el.querySelectorAll("button[data-sell]").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.sell;
        if ((api.packCount(k) || 0) < 1) return;
        api.packTake(k, 1);
        S.coins += sellPrice(k);
        save();
        api.chime();
        draw(`Sold for 🪙 ${sellPrice(k)}!`);
      };
    });
    const sl = el.querySelector(".sell");
    if (sl) sl.scrollTop = keep.sell;
    const cd = el.querySelector(".card");
    if (cd) cd.scrollTop = keep.card;
    el.querySelectorAll("button[data-k]").forEach((b) => {
      b.onclick = () => {
        const before = stockOf(stall);
        const it = before.items.find((x) => x.key === b.dataset.k);
        if (!it || S.coins < it.price) return;
        S.coins -= it.price;
          bought(it.key || it.name);
        (S.tried ||= {})[it.key] = true;
        let msg = `You bought ${it.icon} ${it.name}!`;
        if (it.keep) S.owned[it.key] = true;
        if (it.keep && powerText(it.key)) msg += ` ${powerText(it.key)}!`;
        if (it.heal) msg += bagFood(it);
        save();
        api.chime();
        const after = stockOf(stall);
        if (after.items[0] && before.items[0] && after.items[0].key !== before.items[0].key) msg += ` — and ${stall.vendor.split(" ").pop()} brings out something NEW!`;
        draw(msg);
      };
    });
  };
  draw();
  el.classList.add("open");
  shopOpenNow = true;
}
function openOutfitShop(stall, api) {
  const el = shopEl();
  const draw = (msg = "") => {
    const stock = stockOf(stall); // (restocks forever as you buy it out)
    el.innerHTML = `<div class="card"><h3>${stall.vendor}</h3><div class="coins">🪙 ${S.coins} coins${stock.restocked ? " · ✨ fresh stock!" : ""}</div>${refreshRow(stall, draw)}
      ${stock.items.map((it) => {
        const owned = it.keep && S.owned[it.key];
        return `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>${it.desc}${powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}</small></span><button data-k="${it.key}" ${owned || S.coins < it.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + it.price}</button></div>`;
      }).join("")}
      ${sellsClothes(stall) ? sellClothesHTML() : ""}
      <div class="msg">${msg}</div><div class="close">Esc — leave · wear & swap outfits in your backpack (B)</div></div>`;
    bindSellClothes(el, draw, api);
    el.querySelectorAll("button[data-k]").forEach((b) => {
      b.onclick = () => {
        const before = stockOf(stall);
        const it = before.items.find((x) => x.key === b.dataset.k);
        if (!it || S.coins < it.price) return;
        S.coins -= it.price;
          bought(it.key || it.name);
        (S.tried ||= {})[it.key] = true;
        let msg = `You bought ${it.icon} ${it.name}!`;
        if (it.keep) S.owned[it.key] = true;
        if (it.keep && WEAR[it.key]) {
          ((S.wornBy[WEAR_CITY[it.key]] ||= {})[WEAR[it.key].slot] = it.key); // put it straight on
          msg = `You're wearing your new ${it.name}!`;
        }
        if (it.keep && powerText(it.key)) msg += ` ${powerText(it.key)}!`;
        if (it.heal) msg += bagFood(it);
        save();
        lookChanged();
        api.chime();
        const after = stockOf(stall);
        if (after.items[0] && before.items[0] && after.items[0].key !== before.items[0].key) msg += ` — and ${stall.vendor.split(" ").pop().replace(/'s$/, "")} brings out something NEW!`;
        draw(msg);
      };
    });
  };
  draw();
  el.classList.add("open");
  shopOpenNow = true;
}

// ======================================================================
//  🏡 HOUSES you can buy (100 coins each) + things to hang on the walls
// ======================================================================
S.homes ||= {};
export const HOME_BASE = 100;
export const homePrice = () => cost(HOME_BASE, "house");
export const homeOwned = (id) => !!(S.homes[id] && S.homes[id].owned);
export const homeHung = (id) => ((S.homes[id] ||= { owned: id === "den" }).slots ||= {});
export function buyHome(id) {
  const hp = homePrice();
  if (homeOwned(id) || S.coins < hp) return false;
  S.coins -= hp;
  bought("house");
  (S.homes[id] ||= {}).owned = true;
  save();
  return true;
}
function keepsakeIcon(k) {
  if (EXTRA_KEEPS[k]) return EXTRA_KEEPS[k];
  if (isGen(k)) return [genItem(k).icon, genItem(k).name];
  if (k.includes("~") && WEAR[k]) return [WEAR[k].icon, WEAR[k].name];
  for (const m of Object.values(MARKETS)) for (const st of m.stalls) for (const it of [...st.items, ...(RESTOCK[st.vendor] || []).flat()]) if (it.key === k) return [it.icon, it.name];
  return null;
}
window.__wwKeepName = (k) => {
  const r = keepsakeIcon(k);
  return r ? `${r[0]} ${r[1]}` : null;
}; // (items.js: the name of a treasure you can use)
/** what's hung anywhere already (a keepsake can only hang in one place) */
function hungKeys() {
  const out = new Set();
  for (const h of Object.values(S.homes)) for (const v of Object.values(h.slots || {})) if (v.kind !== "pack") out.add(v.kind + ":" + v.key);
  return out;
}
/** E on a hook: pick something from your inventory to hang (or take it down) */
export function openHangPicker(homeId, i, api, onChange) {
  const el = shopEl();
  const slots = homeHung(homeId);
  const draw = (msg = "") => {
    const cur = slots[i];
    const used = hungKeys();
    const opts = [];
    for (const k of Object.keys(S.owned)) {
      if (WEAR[k] || k === "horse" || k === "raft") continue;
      const ic = keepsakeIcon(k);
      if (ic && !used.has("keep:" + k)) opts.push({ kind: "keep", key: k, icon: ic[0], name: ic[1] });
    }
    for (const [ev, medal] of Object.entries(S.medals)) {
      if (!used.has("medal:" + ev)) opts.push({ kind: "medal", key: ev, icon: medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉", name: `${medal[0].toUpperCase() + medal.slice(1)} medal — ${EVENT_NAMES[ev] || ev}` });
    }
    for (const [k, n] of api.packList()) if (n > 0) opts.push({ kind: "pack", key: k, icon: api.iconFor(k), name: k.replace(/\b\w/g, (c) => c.toUpperCase()) + ` (×${n})` });
    el.innerHTML = `<div class="card"><h3>🖼️ Hang something on the wall</h3>
      ${cur ? `<div class="item"><span class="ic">${cur.icon}</span><span class="nm">On this hook now: ${cur.name}</span><button id="down">take down</button></div>` : ""}
      <div class="sell">${opts.length ? opts.map((o, j) => `<button class="cell" data-j="${j}"><span class="ic">${o.icon}</span><span class="nm">${o.name}</span><span class="pr">hang it</span></button>`).join("") : `<div class="empty">Nothing to hang yet — buy keepsakes at the markets, win medals, or gather things!</div>`}</div>
      <div class="msg">${msg}</div><div class="close">Esc — done</div></div>`;
    const down = el.querySelector("#down");
    if (down) down.onclick = () => {
      if (cur.kind === "pack") api.addToPack(cur.key, 1);
      delete slots[i];
      save();
      onChange();
      draw("Taken down.");
    };
    el.querySelectorAll("[data-j]").forEach((b) => {
      b.onclick = () => {
        const o = opts[+b.dataset.j];
        if (slots[i] && slots[i].kind === "pack") api.addToPack(slots[i].key, 1); // swap: the old one back in your pack
        if (o.kind === "pack") api.packTake(o.key, 1);
        slots[i] = { kind: o.kind, key: o.key, icon: o.icon, name: o.name.replace(/ \(×\d+\)$/, "") };
        save();
        onChange();
        api.chime();
        draw(`Hung up: ${o.icon} ${slots[i].name}!`);
      };
    });
  };
  draw();
  el.classList.add("open");
  shopOpenNow = true;
}

/** a house for sale in a city: buy it (100 coins), then walk in */
export function makeHouseForSale(group, H, at, homeId, api) {
  const y = H(at.x, at.z);
  const face = Math.atan2(-at.x, -at.z);
  const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
  const g = new THREE.Group();
  g.position.set(at.x, y, at.z);
  g.rotation.y = face;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 4.2, 12), M(0xe8d0a8));
  body.position.y = 2.1;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 3.2, 12), M(0x8a3a3a));
  roof.position.y = 5.8;
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.1, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 1.1, 3.9); // (just outside the round wall)
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.5, 10), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
  win.position.set(1.8, 2.6, 3.2);
  win.rotation.y = 0.5;
  g.add(body, roof, door, win);
  // the sign: FOR SALE, then your name (🪧 big, crisp, both sides — see signs.js)
  const sign = signBoard(" ", { w: 2.8, h: 0.95 });
  const drawSign = () => setSignText(sign, homeOwned(homeId) ? "Thistle's House\nwelcome home!" : `FOR SALE\n🪙 ${homePrice()} coins`, homeOwned(homeId) ? "leaf" : FOR_SALE_STYLE);
  drawSign();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 5), M(0x5a3e24));
  post.position.set(-2.6, 1.2, 4.8);
  sign.position.set(-2.6, 2.5, 4.8);
  g.add(post, sign);
  group.add(g);
  api.addCollider(at.x, at.z, 4.2);
  const dx = at.x + Math.sin(face) * 4.9;
  const dz = at.z + Math.cos(face) * 4.9;
  return {
    interactable(p) {
      if (Math.hypot(p.x - dx, p.z - dz) > 2.6) return null;
      if (homeOwned(homeId)) return { label: "go inside your house", act: () => api.enterHome(homeId, { x: dx + Math.sin(face) * 1.2, z: dz + Math.cos(face) * 1.2, face }) };
      return {
        label: `buy this house (🪙 ${homePrice()})`,
        act: () => {
          if (S.coins < homePrice()) return api.say(`🏡 A house costs 🪙 ${homePrice()} coins — you have ${S.coins}. Win races, do adventures and sell things at the markets!`, true);
          buyHome(homeId);
          drawSign();
          api.chime();
          api.say("🏡 It's YOURS! Press E at the door to go inside — and hang your treasures on the walls.", true);
        },
      };
    },
  };
}

// ---- shared with pets.js / extras ----
export const cityState = () => S;
export const saveCity = () => save();
export function openCard(html, bind) {
  const el = shopEl();
  el.innerHTML = html;
  if (bind) bind(el);
  el.classList.add("open");
  shopOpenNow = true;
  return el;
}
export function closeCard() {
  if (_shop) _shop.classList.remove("open");
  shopOpenNow = false;
}
