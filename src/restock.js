// ------------------------------------------------------------
//  ♾️  ENDLESS RESTOCK — buy out ANY store and it brings out something new.
//
//  Everything here is made from a seed, so a generated item can always be
//  rebuilt from its key alone (nothing extra to save):
//    "gen:<theme>:<seed>:<n>:<j>"  a keepsake or treat (batch n, slot j)
//    "<baseKey>~<hex>"              a new COLOR of something that exists
//                                    (capes, hats, pet clothes, pets, furniture…)
// ------------------------------------------------------------
import * as THREE from "three";

/** named colors for new stock (dyes, recolored clothes, pets, furniture) */
export const TINTS = [
  ["Crimson", 0xc8323c], ["Tangerine", 0xf08a2a], ["Buttercup", 0xf2cf3a], ["Meadow", 0x5aa83a], ["Mint", 0x8ad8b0],
  ["Ocean", 0x2a6ab8], ["Periwinkle", 0x8a9ae8], ["Plum", 0x7a3a8a], ["Blush", 0xf0a8b8], ["Cocoa", 0x7a4a2e],
  ["Slate", 0x5a6474], ["Ivory", 0xf4ecd8], ["Coral", 0xf07a6a], ["Forest", 0x2e6a3a], ["Lilac", 0xc8a8e8],
  ["Sapphire", 0x1e3a9a], ["Saffron", 0xe8a020], ["Rosewood", 0x9a4a5a], ["Seafoam", 0x6ac8b8], ["Moonbeam", 0xd8e4ff],
  ["Ruby", 0x9a1a2a], ["Sage", 0x9ab08a], ["Amber", 0xd8902a], ["Twilight", 0x4a3a7a], ["Peach", 0xf8c09a],
  ["Teal", 0x1e8a8a], ["Honey", 0xd8a84a], ["Cherry", 0xe0485a], ["Storm", 0x46505e], ["Marigold", 0xf0a030],
];
export const tintName = (hex) => (TINTS.find(([, h]) => h === hex) || ["Dyed"])[0];
/** "scholarcape~3a4a8a" → ["scholarcape", 0x3a4a8a]; "scholarcape" → ["scholarcape", null] */
export function splitTint(k) {
  const i = k.indexOf("~");
  return i < 0 ? [k, null] : [k.slice(0, i), parseInt(k.slice(i + 1), 16)];
}
export const tintKey = (base, hex) => `${base}~${hex.toString(16).padStart(6, "0")}`;
/** the n-th new color for a base item (skipping colors it already comes in) */
export function nthTint(base, n, avoid = []) {
  const seed = hashStr(base);
  const pool = TINTS.filter(([, h]) => !avoid.includes(h));
  return pool[(seed + n * 7) % pool.length];
}
/** recolor every mesh of a freshly built piece (keeps a little of the original shading) */
export function tintMeshes(obj, hex) {
  if (hex == null) return;
  const c = new THREE.Color(hex);
  obj.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    o.material = o.material.clone();
    o.material.color.lerp(c, 0.8);
  });
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

// ---------- generated keepsakes + treats ----------
const ADJ = {
  reedmere: ["Sea-Glass", "Driftwood", "Pearl", "Lagoon", "Salt-Kissed", "Reed-Woven", "Tidal", "Coral", "Lighthouse", "Shell"],
  golden: ["Golden", "Sunflower", "Harvest", "Honey", "Wheat-Woven", "Clover", "Painted", "Barnwood", "Haystack", "Apple"],
  frostpine: ["Frosted", "Snowflake", "Pine", "Aurora", "Icicle", "Silver", "Woolly", "Starlit", "Cozy", "Winter"],
  everbough: ["Scholar's", "Leafy", "Acorn", "Mossy", "Lantern", "Ancient", "Carved", "Twig", "Library", "Canopy"],
  night: ["Moonlit", "Starry", "Glowing", "Midnight", "Twilight", "Dreaming", "Comet", "Silver-Moon", "Firefly", "Nebula"],
  roothaven: ["Copper", "Root-Carved", "Gear", "Glowstone", "Forged", "Crystal", "Lantern", "Iron", "Tunnel", "Foundry"],
};
const THINGS = [
  ["🏺", "Vase"], ["🕯️", "Candle"], ["🧸", "Plush Mouse"], ["📿", "Bead String"], ["🪆", "Nesting Doll"], ["🎐", "Wind Chime"],
  ["🪁", "Kite"], ["🧭", "Compass"], ["⏳", "Hourglass"], ["🔔", "Bell"], ["🪞", "Hand Mirror"], ["🖼️", "Tiny Painting"],
  ["📯", "Horn"], ["🎻", "Fiddle"], ["🪈", "Flute"], ["🧩", "Puzzle Box"], ["🎲", "Dice Set"], ["🧿", "Charm"],
  ["💍", "Ring"], ["📔", "Journal"], ["🗝️", "Old Key"], ["🫖", "Teapot"], ["☕", "Teacup"], ["🧺", "Basket"],
  ["🪴", "Bonsai"], ["🐚", "Shell"], ["🪶", "Quill"], ["🕰️", "Clock"], ["🎨", "Paint Set"], ["🏮", "Lantern"],
  ["🎀", "Ribbon"], ["🧵", "Thread Spool"], ["🪡", "Sewing Kit"], ["📜", "Scroll"], ["🗺️", "Map"], ["🔭", "Telescope"],
];
const TREATS = [["🍪", "Cookie", 15], ["🧁", "Cupcake", 20], ["🥧", "Pie", 30], ["🍮", "Pudding", 25], ["🍩", "Honey Ring", 20], ["🍡", "Dumplings", 25], ["🥐", "Crescent Roll", 20], ["🍯", "Honey Cake", 30]];
const DESC = ["A brand-new arrival!", "Just unpacked this morning", "Only one in the whole city", "Handmade — a keepsake", "The vendor's newest treasure", "Fresh off the caravan"];

/** one generated item (rebuilt from its key) */
export function genItem(key) {
  const [, theme, seedS, nS, jS] = key.split(":");
  const seed = +seedS;
  const n = +nS;
  const j = +jS;
  const adj = ADJ[theme] || ADJ.everbough;
  if (j === 2) {
    // the third thing in every batch is something good to eat
    const [icon, nm, heal] = TREATS[(seed + n * 3) % TREATS.length];
    const a = adj[(seed + n * 5) % adj.length];
    return { key, icon, name: `${a} ${nm}`, price: 3 + (heal / 5) | 0, heal, desc: `Fresh from the oven (+${heal} ❤️)` };
  }
  // (each pick walks its own list, so a batch's two keepsakes never match)
  const [icon, nm] = THINGS[(seed + n * 2 + j) % THINGS.length];
  const a = adj[(seed + n * 3 + j * 5) % adj.length];
  return { key, icon, name: `${a} ${nm}`, price: 10 + ((seed >> (n % 8)) + j * 7 + n * 3) % 21, keep: true, desc: DESC[(seed + n + j) % DESC.length] };
}
/** batch n (1, 2, 3…) of new stock for a vendor */
export function genBatch(theme, vendor, n) {
  const seed = hashStr(vendor) % 100000;
  return [0, 1, 2].map((j) => genItem(`gen:${theme}:${seed}:${n}:${j}`));
}
export const isGen = (k) => typeof k === "string" && k.startsWith("gen:");
