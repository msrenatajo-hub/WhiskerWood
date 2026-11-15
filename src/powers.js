// ------------------------------------------------------------
//  ✨ POWERS — everything you can buy or make DOES something.
//
//  Every keepsake, outfit, decoration, castle piece, pet, pet outfit and
//  crafted thing gives you a small power. They add up (to a cap each):
//    🪙 luck   — things you sell fetch more
//    🦘 jump   — you jump higher
//    💨 sprint — your sprint lasts longer
//    🔥 warm   — the cold bothers you less
//    ❤️ heal   — your hearts slowly heal by themselves
//    🎣 fish   — fish bite sooner
//    🌱 grow   — crops grow faster
//    🫧 air    — your breath lasts longer underwater
//  (The special quest treasures keep their own big powers — this is for
//   everything else.)
// ------------------------------------------------------------
export const POWER_TYPES = {
  luck: { icon: "🪙", cap: 0.5, text: (n) => `sell for +${Math.round(n * 100)}%` },
  jump: { icon: "🦘", cap: 0.3, text: (n) => `jump ${Math.round(n * 100)}% higher` },
  sprint: { icon: "💨", cap: 0.5, text: (n) => `sprint lasts ${Math.round(n * 100)}% longer` },
  warm: { icon: "🔥", cap: 3, text: (n) => `+${+n.toFixed(1)} warmth in the cold` },
  heal: { icon: "❤️", cap: 1, text: (n) => `hearts heal by themselves (+${+n.toFixed(2)}/sec)` },
  fish: { icon: "🎣", cap: 0.5, text: (n) => `fish bite ${Math.round(n * 100)}% sooner` },
  grow: { icon: "🌱", cap: 1, text: (n) => `crops grow ${Math.round(n * 100)}% faster` },
  air: { icon: "🫧", cap: 0.6, text: (n) => `breath lasts ${Math.round(n * 100)}% longer underwater` },
};
const P = (type, n) => ({ type, n });
// named things → their power
export const ITEM_POWERS = {
  // 💙 story treasures
  stormscale: P("sprint", 0.15),
  firstlantern: P("heal", 0.2),
  dragondiploma: P("luck", 0.1),
  goldenscarab: P("luck", 0.1),
  skylantern: P("warm", 0.6),
  trialmedal: P("jump", 0.08),
  queenspearl: P("air", 0.3),
  seasonkey: P("grow", 0.3),
  umbraribbon: P("warm", 0.6),
  // 🛒 the caravans' keepsakes
  bakersrollingpin: P("heal", 0.1), fishersnet: P("fish", 0.15), wovenscarf: P("warm", 0.6), patchquilt: P("heal", 0.1), carvedbear: P("luck", 0.05), herbsachet: P("heal", 0.15), songbook: P("luck", 0.05), lute: P("luck", 0.05),
  caravanbell: P("luck", 0.05), trailmap: P("sprint", 0.1), ponybrush: P("sprint", 0.08), silkbundle: P("warm", 0.4),
  // 🐚 Reedmere keepsakes
  pearl: P("luck", 0.05), anchorcharm: P("air", 0.15), seaglassbowl: P("fish", 0.1), blackpearl: P("luck", 0.1), coralcomb: P("air", 0.1),
  pennant: P("luck", 0.04), spyglass: P("fish", 0.1), featherfly: P("fish", 0.15), tacklebox: P("fish", 0.15),
  // 🎃 Golden Hollow
  pumpkinlantern: P("warm", 0.5), goldenseeds: P("grow", 0.25), rollingpin: P("heal", 0.1), cheeseknife: P("luck", 0.05), pumpkinseeds: P("grow", 0.25), seedpouch: P("grow", 0.2),
  // ❄️ Frostpine
  icecrystal: P("warm", 0.5), toffeetin: P("heal", 0.1), skates: P("jump", 0.06), carvedowl: P("jump", 0.08), snowglobe: P("warm", 0.4),
  // 🌳 Everbough
  eb_quill: P("luck", 0.04), eb_journal: P("luck", 0.04), eb_candle: P("warm", 0.3), eb_lavender: P("heal", 0.1), eb_map: P("luck", 0.04), eb_compass: P("luck", 0.04),
  eb_stargazer: P("jump", 0.05), eb_top: P("sprint", 0.1), eb_kite: P("jump", 0.1), eb_doll: P("heal", 0.08), eb_moonring: P("luck", 0.06), eb_beads: P("luck", 0.04),
  eb_brooch: P("warm", 0.3), eb_seeds: P("grow", 0.2), eb_bonsai: P("grow", 0.15), eb_paperlantern: P("warm", 0.3), eb_fireflylamp: P("air", 0.1), eb_glowjar: P("heal", 0.08),
  // 🌙 the Night Market
  moonlantern: P("warm", 0.4), starmap: P("luck", 0.05), fireflyjar: P("heal", 0.1), owlfigure: P("jump", 0.08), moonpearl: P("luck", 0.1),
  // 👒 outfits
  shellnecklace: P("air", 0.15), reedhat: P("fish", 0.15), pearlpendant: P("luck", 0.06), seaglassearring: P("fish", 0.1), shellbracelet: P("air", 0.1),
  strawhat: P("grow", 0.2), sunbonnet: P("grow", 0.2), harvestcrown: P("grow", 0.3), scholarcape: P("luck", 0.08), explorercape: P("jump", 0.08), royalcape: P("luck", 0.12),
  // 🏰 your castle (S.castle)
  "castle:walls": P("heal", 0.1), "castle:keep": P("heal", 0.15), "castle:towers": P("jump", 0.05), "castle:gate": P("heal", 0.08), "castle:flags": P("luck", 0.05), "castle:garden": P("grow", 0.2),
  // 🛋️ furniture (once you've bought one)
  "furn:rug": P("heal", 0.05), "furn:armchair": P("heal", 0.05), "furn:plant": P("grow", 0.1), "furn:shelf": P("luck", 0.03), "furn:lamp": P("warm", 0.2),
  "furn:table": P("heal", 0.05), "furn:bed": P("heal", 0.1), "furn:aquarium": P("fish", 0.1), "furn:fireplace": P("warm", 0.5),
  // 🐾 pets (each kind you have)
  "pet:cat": P("fish", 0.1), "pet:hedgehog": P("heal", 0.05), "pet:fox": P("jump", 0.05), "pet:wolf": P("warm", 0.4), "pet:owl": P("jump", 0.05), "pet:wren": P("luck", 0.04), "pet:hummingbird": P("sprint", 0.1),
  // 🎀 pet outfits
  "petwear:bandana": P("jump", 0.03), "petwear:bluebandana": P("jump", 0.03), "petwear:bow": P("luck", 0.03), "petwear:tophat": P("luck", 0.04),
  "petwear:flowercrown": P("grow", 0.1), "petwear:bellcollar": P("fish", 0.05), "petwear:sweater": P("warm", 0.3),
  // 🎨 your own designs (by kind)
  "design:hat": P("jump", 0.05), "design:cape": P("jump", 0.05), "design:scarf": P("warm", 0.5), "design:sweater": P("warm", 0.6),
  // 🔨 crafted at the stump
  "craft:Leaf Blanket": P("warm", 0.4), "craft:Den Wall Reinforcement": P("heal", 0.05), "craft:Nursery Nest": P("heal", 0.05), "craft:Lantern Mushroom Lamp": P("warm", 0.2),
  "craft:Warmth Stones": P("warm", 0.6), "craft:Acorn Bowl": P("heal", 0.05), "craft:Storage Cache": P("luck", 0.03), "craft:Family Keepsake Shelf": P("luck", 0.04),
  "craft:Thistle Bed": P("heal", 0.12), "craft:Leaf Rain Cloak": P("warm", 0.4), "craft:Dew Water Pouch": P("air", 0.15), "craft:Scent Mask Pouch": P("sprint", 0.06),
  "craft:Waterproof Leaf Pack": P("air", 0.1), "craft:Firefly Lantern": P("warm", 0.2), "craft:Moonstone Necklace": P("luck", 0.08), "craft:Glow Dust Satchel": P("jump", 0.05),
  "craft:Braided Grass Bracelet": P("sprint", 0.1), "craft:Feather Charm": P("jump", 0.08), "craft:Button Backpack Pin": P("luck", 0.04), "craft:Berry Seed Charm": P("grow", 0.15),
  "craft:Flower Crown": P("grow", 0.15), "craft:Acorn Pendant": P("luck", 0.05), "craft:Lavender Anklet": P("jump", 0.05), "craft:Crystal Ear Charm": P("fish", 0.1),
  "craft:Firefly Jar Decoration": P("heal", 0.05), "craft:Moonstone Crown": P("luck", 0.1), "craft:Grass Hideout": P("heal", 0.05), "craft:Twig Bridge": P("jump", 0.04),
  "craft:Lookout Perch": P("jump", 0.06), "craft:Escape Tunnel": P("sprint", 0.12), "craft:Herb Drying Rack": P("heal", 0.08), "craft:Map Table": P("luck", 0.04),
  "craft:Scent Trail Marker": P("sprint", 0.06), "craft:Baby Toy": P("luck", 0.03), "craft:Sticky Sap Trap": P("fish", 0.1), "craft:Moonstone Lantern": P("warm", 0.4),
  "craft:Secret Root Door": P("sprint", 0.1), "craft:Ancient Seed Planter": P("grow", 0.3), "craft:Family Portrait Wall": P("heal", 0.06), "craft:Moonstone Hollow Shrine": P("heal", 0.15),
};
// 🍲 crafted FOOD goes in your bag to eat (name → heal, warm)
export const CRAFT_FOOD = {
  "Berry Bundle": { icon: "🫐", heal: 20 }, "Mushroom Stew": { icon: "🍲", heal: 35, warm: true }, "Nectar Energy Mix": { icon: "🍯", heal: 25 },
  "Roasted Beetle Snack": { icon: "🪲", heal: 20 }, "Healing Poultice": { icon: "🌿", heal: 60 }, "Bee Wax Balm": { icon: "🕯️", heal: 30 },
  "Cheese Feast": { icon: "🧀", heal: 80 }, "Moon Petal Tea": { icon: "🍵", heal: 30, warm: true }, "Snack Pouch": { icon: "🎒", heal: 25 }, Cookie: { icon: "🍪", heal: 15 },
};
// endless generated shop things ("gen:theme:seed:n:j") get a small power picked from their key
const GEN_TYPES = ["luck", "jump", "sprint", "warm", "heal", "fish", "grow", "air"];
const GEN_AMT = { luck: 0.02, speed: 0.02, jump: 0.02, sprint: 0.04, warm: 0.15, heal: 0.03, fish: 0.04, grow: 0.06, air: 0.05 };
const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** the power of one owned key (or null) */
export function powerOf(key) {
  if (!key) return null;
  const base = String(key).split("~")[0]; // (colour copies share their power)
  if (ITEM_POWERS[base]) return ITEM_POWERS[base];
  if (base.startsWith("gen:")) {
    const t = GEN_TYPES[hashStr(base) % GEN_TYPES.length];
    return P(t, GEN_AMT[t]);
  }
  if (base.startsWith("design_") && getS) {
    const d = (getS().designs || []).find((x) => x.id === base);
    if (d) return ITEM_POWERS["design:" + d.kind] || null;
  }
  return null;
}
/** "✨ walk 5% faster" (or "") */
export const powerText = (key) => {
  const p = powerOf(key);
  return p ? `✨ ${POWER_TYPES[p.type].icon} ${POWER_TYPES[p.type].text(p.n)}` : "";
};

// ---------------------------------------------------------------- totals
let getS = null;
export const setPowerSave = (fn) => (getS = fn);
let cache = null;
let cacheT = 0;
function totals() {
  const now = performance.now();
  if (cache && now - cacheT < 1000) return cache;
  const S = getS ? getS() : null;
  const t = Object.fromEntries(Object.keys(POWER_TYPES).map((k) => [k, 0]));
  if (S) {
    const add = (key) => {
      const p = powerOf(key);
      if (p) t[p.type] += p.n;
    };
    for (const k of Object.keys(S.owned || {})) if (S.owned[k]) add(k);
    for (const k of Object.keys(S.castle || {})) if (S.castle[k]) add("castle:" + k);
    for (const k of Object.keys(S.furnBought || {})) if (S.furnBought[k]) add("furn:" + k.split("~")[0]);
    for (const k of new Set((S.pets || []).map((p) => p.species))) add("pet:" + k);
    for (const k of Object.keys(S.petOwnedWear || {})) if (S.petOwnedWear[k]) add("petwear:" + k.split("~")[0]);
  }
  for (const k of Object.keys(t)) t[k] = Math.min(POWER_TYPES[k].cap, t[k]);
  cache = t;
  cacheT = now;
  return t;
}
/** your total power of one type (already capped) */
export const power = (type) => totals()[type] || 0;
export const powersChanged = () => (cache = null);
/** a little summary for the backpack */
export function powerSummaryHTML() {
  const t = totals();
  const on = Object.keys(t).filter((k) => t[k] > 0);
  if (!on.length) return "";
  return `<div class="powers"><b>✨ Your powers</b> (from everything you own and make)<br>${on.map((k) => `${POWER_TYPES[k].icon} ${POWER_TYPES[k].text(t[k])}${t[k] >= POWER_TYPES[k].cap ? " <i>(max!)</i>" : ""}`).join(" · ")}</div>`;
}
