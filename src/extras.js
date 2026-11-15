// ------------------------------------------------------------
//  ✨  EXTRAS — the living world after (and around) the story.
//
//   1 🎉 SEASONS & FESTIVALS   spring → summer → autumn → winter (every 2
//        game days); falling petals / leaves / snow in the forest; a
//        festival in Everbough's Market Circle each season with a game
//   2 🛋️ HOME DECORATING      Hearth & Home Furnishings (Everbough) — place
//        furniture anywhere in your houses (E at the furniture chest)
//   3 🐛 COLLECTION BOOK (N)  bugs & butterflies to catch, fish to land,
//        fossils to dig up — the Museum takes complete pages
//   4 🏰 GUILDS               the Guild Board in Everbough: Botanists,
//        Builders, Historians, Explorers — ranks + rewards
//   5 ⛈️ WEATHER RESCUES      flood (Reedmere), blizzard (Frostpine),
//        drought (Golden Hollow) — help the city in trouble
//   6 🌙 NIGHT MARKET         glowing stalls in Everbough's plaza, only at night
//   7 📸 PHOTO MODE (P)       free camera, frames, save the picture
//   8 🗺️ SILVERVEIL           the lost sixth city: three star shards open the way
// ------------------------------------------------------------
import * as THREE from "three";
import { inflate, bought } from "./economy.js";
import { playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard, shopHouse } from "./cityLife.js";
import { genBatch, splitTint, tintKey, nthTint, tintMeshes } from "./restock.js";
import { bagFood } from "./food.js";
import { powerText } from "./powers.js";
import { signBoard, signTexture } from "./signs.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const glow = (c, s) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const hash = (x, z) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ======================================================================
//  data
// ======================================================================
const SEASONS = [
  { key: "spring", icon: "🌸", name: "Spring", fest: "Spring Blossom Festival", color: 0xffb8d8, item: "Blossom Crown", fall: 0xffc8e0 },
  { key: "summer", icon: "☀️", name: "Summer", fest: "Midsummer Lantern Night", color: 0xffd84a, item: "Sun Lantern", fall: null },
  { key: "autumn", icon: "🍂", name: "Autumn", fest: "Harvest Feast", color: 0xe08a2a, item: "Harvest Ribbon", fall: 0xd8782a },
  { key: "winter", icon: "❄️", name: "Winter", fest: "Winter Lights", color: 0xbfe6ff, item: "Star of Winter Lights", fall: 0xffffff },
];
const FURNITURE = [
  { key: "rug", icon: "🟥", name: "Round Rug", price: 8 },
  { key: "armchair", icon: "🪑", name: "Cozy Armchair", price: 14 },
  { key: "plant", icon: "🪴", name: "Potted Fern", price: 6 },
  { key: "shelf", icon: "📚", name: "Bookshelf", price: 16 },
  { key: "lamp", icon: "💡", name: "Floor Lamp", price: 10 },
  { key: "table", icon: "🍵", name: "Tea Table", price: 12 },
  { key: "bed", icon: "🛏️", name: "Feather Bed", price: 20 },
  { key: "aquarium", icon: "🐠", name: "Little Aquarium", price: 18 },
  { key: "fireplace", icon: "🔥", name: "Stone Fireplace", price: 24 },
];
const BOOK = {
  bugs: [
    ["Ladybird", "🐞", 0xd83a2a, "forest"], ["Bumblebee", "🐝", 0xe8c83a, "golden"], ["Firefly", "✨", 0xd8ff6a, "forest"],
    ["Dragonfly", "🪰", 0x3a9ad8, "reedmere"], ["Monarch Butterfly", "🦋", 0xe8882a, "golden"], ["Blue Morpho", "🦋", 0x3a6ae8, "forest"],
    ["Snow Moth", "🦋", 0xf4f4ff, "frostpine"], ["Stag Beetle", "🪲", 0x5a3a2a, "forest"], ["Water Strider", "🦟", 0x6a8a6a, "reedmere"],
    ["Ice Beetle", "🪲", 0x9fd8ff, "frostpine"], ["Moon Moth", "🦋", 0xbfe6ff, "silverveil"], ["Glow Snail", "🐌", 0x8affd8, "roothaven"],
  ],
  fish: [
    ["Minnow", "🐟", 0xc8c8c8], ["Lagoon Perch", "🐠", 0xd8a83a], ["Rainbow Trout", "🐟", 0xe86aa8], ["Silver Eel", "🐍", 0xa8b8c8],
    ["Pike", "🐟", 0x5a8a3a], ["Ice Char", "🐟", 0x9fd8ff], ["Golden Koi", "🐠", 0xffc83a], ["Moon Fish", "🌙", 0xe8f0ff],
  ],
  fossils: [
    ["Ancient Shell", "🐚"], ["Fern Fossil", "🌿"], ["Old Claw", "🦴"], ["Amber Drop", "🟠"], ["Trilobite", "🪨"], ["Moon Bone", "🌙"],
  ],
};
const GUILDS = [
  { key: "botanists", icon: "🌱", name: "Botanists' Guild", stat: (S) => (S.stats.harvests || 0) + Object.keys(S.book.bugs || {}).length, unit: "harvests + bugs" },
  { key: "builders", icon: "🔨", name: "Builders' Guild", stat: (S) => Object.values(S.homes || {}).filter((h) => h.owned).length * 3 + Object.values(S.homes || {}).reduce((a, h) => a + (h.furn ? h.furn.length : 0), 0), unit: "homes ×3 + furniture" },
  { key: "historians", icon: "📜", name: "Historians' Guild", stat: (S) => Object.keys(S.lore || {}).length + Object.values(S.relics || {}).filter((v) => v === "donated").length * 2 + Object.keys(S.book.fossils || {}).length, unit: "lore + relics ×2 + fossils" },
  { key: "explorers", icon: "🧭", name: "Explorers' Guild", stat: (S) => (S.stats.travels || 0) + Object.keys(S.medals || {}).length * 2 + (S.stats.rescues || 0) * 2, unit: "travels + medals ×2 + rescues ×2" },
];
const RANKS = [["Novice", 0], ["Apprentice", 4], ["Journeymouse", 10], ["Expert", 18], ["Master", 28]];
const NIGHT_GOODS = [
  { key: "moonlantern", icon: "🏮", name: "Moonlight Lantern", price: 22, desc: "Glows with captured moonlight — a keepsake" },
  { key: "starmap", icon: "🗺️", name: "Star Map", price: 28, desc: "Every constellation the Moonkeepers named" },
  { key: "fireflyjar", icon: "✨", name: "Firefly Jar", price: 12, desc: "A jar of friendly lights" },
  { key: "dreamtea", icon: "🍵", name: "Dream Tea", price: 6, heal: 50, desc: "Tastes like a good night's sleep (+50 ❤️)" },
  { key: "mystery", icon: "🎁", name: "Mystery Parcel", price: 15, mystery: true, desc: "Could be anything… (coins, a treasure, or a fossil!)" },
  { key: "owlfigure", icon: "🦉", name: "Silver Owl Figurine", price: 30, desc: "Carved by a night-market silversmith" },
];
const RESCUES = {
  reedmere: { icon: "🌊", name: "The Great Flood", text: "A storm has flooded the lagoon homes! Rescue the stranded mice from their rooftops — swim or raft out to each one.",
    spots: [{ x: -36, z: -30, water: true }, { x: 26, z: 36, water: true }, { x: -12, z: -38, water: true }], verb: "help the stranded mouse to safety", fog: 0x8a9aa0 },
  frostpine: { icon: "🌨️", name: "The Blizzard", text: "Travelers are lost in a blizzard outside town! Find them before the cold does — follow their lantern glow.",
    spots: [{ x: -80, z: 50 }, { x: 70, z: 60 }, { x: 80, z: -70 }], verb: "lead the lost traveler home", fog: 0xe8eef4 },
  golden: { icon: "☀️", name: "The Drought", text: "No rain for weeks and the far fields are wilting! Carry water from the pump (E) to each thirsty field.",
    spots: [{ x: -50, z: 10 }, { x: 40, z: 15 }, { x: -20, z: 50 }, { x: 52, z: 40 }], verb: "water the wilting field", needWater: true, fog: 0xf0d090 },
};

// ======================================================================
export function initExtras(ctx) {
  const S = cityState();
  S.stats ||= {};
  S.book ||= { bugs: {}, fish: {}, fossils: {} };
  S.guildClaimed ||= {};
  S.seasonFest ||= {};
  S.rescued ||= {};
  S.shards ||= {};
  S.photos ||= 0;
  const save = () => saveCity();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const where = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const groupHere = () => {
    const w = where();
    if (w === "forest") return ctx.outsideGroup;
    if (w === "everbough") return ctx.cityGroup;
    if (w === "roothaven") return ctx.roothaven.group;
    if (ctx.world() === "city" && ctx.city()) return ctx.city().group;
    return null;
  };
  const heightHere = () => {
    const w = where();
    if (w === "forest") return ctx.terrainHeight;
    if (w === "everbough") return ctx.cityHeight;
    if (w === "roothaven") return ctx.roothaven.height;
    if (ctx.world() === "city" && ctx.city()) return ctx.city().height;
    return () => 0;
  };
  const stat = (k, n = 1) => {
    S.stats[k] = (S.stats[k] || 0) + n;
    save();
  };
  window.addEventListener("ww-stat", (e) => stat(e.detail.k, e.detail.n || 1));

  // ---------------------------------------------------------------- 1 SEASONS
  // a day passes each time the clock rolls past midnight; a season = 2 days
  S.days ||= 0;
  let lastTime = ctx.dayTime();
  const q = new URLSearchParams(location.search);
  if (q.get("season")) S.days = Number(q.get("season")) * 2;
  if (q.get("shards") === "3") S.shards = { hollow: true, pine: true, canopy: true };
  const season = () => SEASONS[(Math.floor(S.days / 2) + (S.seasonShift || 0)) % 4]; // (🗝️ the Season Clock's key can turn it)
  const seasonChip = document.createElement("div");
  seasonChip.style.cssText = "position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:6;padding:4px 14px;border-radius:999px;background:rgba(30,22,14,.72);color:#ffe6a8;font:bold 13px system-ui;pointer-events:none;";
  document.body.appendChild(seasonChip);
  // falling things (petals / leaves / snow) round the mouse in the forest
  const fallGeo = new THREE.BufferGeometry();
  const FN = 500;
  const fallPos = new Float32Array(FN * 3);
  for (let i = 0; i < FN; i++) {
    fallPos[i * 3] = (hash(i, 1) - 0.5) * 70;
    fallPos[i * 3 + 1] = hash(i, 2) * 25;
    fallPos[i * 3 + 2] = (hash(i, 3) - 0.5) * 70;
  }
  fallGeo.setAttribute("position", new THREE.BufferAttribute(fallPos, 3));
  const fall = new THREE.Points(fallGeo, new THREE.PointsMaterial({ size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
  fall.frustumCulled = false;
  ctx.outsideGroup.add(fall);
  // the festival in the Market Circle: collect 10 floating festival tokens in 45s
  const FEST = { on: false, t: 0, got: 0, items: [] };
  let festHost = null;
  function festHostBuild() {
    if (festHost || !ctx.cityBuilt()) return;
    const m = buildThistle({ tunicColor: 0xd84a8a, hoodColor: 0xd84a8a, pack: false });
    m.scale.setScalar(1.1);
    m.position.set(-6, ctx.cityHeight(-6, 18), 18);
    ctx.cityGroup.add(m);
    festHost = { m, x: -6, z: 18 };
    // seasonal decorations round the plaza (recolored each season)
    festHost.decor = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const x = Math.cos(a) * 20;
      const z = Math.sin(a) * 20;
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      d.position.set(x, ctx.cityHeight(x, z) + 4.2 + Math.sin(k) * 0.3, z);
      ctx.cityGroup.add(d);
      festHost.decor.push(d);
    }
  }
  function startFestival() {
    const s = season();
    FEST.on = true;
    FEST.t = 45;
    FEST.got = 0;
    FEST.items.forEach((i) => ctx.cityGroup.remove(i));
    FEST.items = [];
    for (let k = 0; k < 14; k++) {
      const a = k * 2.39;
      const r = 6 + (k % 5) * 5;
      const g = new THREE.Group();
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      g.position.set(x, ctx.cityHeight(x, z) + 1.2, z);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: s.color })), glow(s.color, 2));
      ctx.cityGroup.add(g);
      FEST.items.push(g);
    }
    ctx.say(`${s.icon} The ${s.fest} game! Grab 10 floating ${s.name.toLowerCase()} charms in 45 seconds!`, true);
  }
  function festUpdate(dt, t) {
    if (!FEST.on) return;
    FEST.t -= dt;
    hud(`${season().icon} ${season().fest}: ${FEST.got}/10 · ${Math.max(0, FEST.t).toFixed(0)}s`);
    for (const g of FEST.items) {
      if (!g.visible) continue;
      g.position.y += Math.sin(t * 2 + g.position.x) * 0.005;
      if (near(g.position.x, g.position.z, 1.6) && ctx.world() === "everbough") {
        g.visible = false;
        FEST.got++;
        ctx.chime();
      }
    }
    if (FEST.got >= 10 || FEST.t <= 0) {
      FEST.on = false;
      hud(null);
      FEST.items.forEach((i) => ctx.cityGroup.remove(i));
      const s = season();
      if (FEST.got >= 10) {
        const first = !S.seasonFest[s.key];
        S.seasonFest[s.key] = true;
        S.coins += 15;
        if (first) (S.owned ||= {})["fest_" + s.key] = true;
        save();
        ctx.say(`${s.icon} You won the ${s.fest}! +🪙 15${first ? ` and the ${s.item}!` : ""}`, true);
      } else ctx.say(`${s.icon} Time! You caught ${FEST.got}/10 — try again!`, true);
    }
  }

  // ---------------------------------------------------------------- 1b THE SEASONS CHANGE THE FOREST
  // 🌸 spring: carpets of wildflowers · 🍂 autumn: leaf piles to JUMP in
  // (❄️ winter's frozen pond + snow live in main.js / outside.js)
  let flowers = null;
  let piles = null;
  const burst = [];
  function seasonalBuild() {
    if (flowers || !ctx.school || !ctx.school()) return;
    const S0 = ctx.school();
    const ok = (x, z) => !(ctx.isWater && ctx.isWater(x, z));
    // spring flowers: one instanced mesh, thousands of little blooms
    const N = 2400;
    const geo = new THREE.IcosahedronGeometry(0.13, 0);
    flowers = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), N);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    const cols = [0xff9ab8, 0xffe06a, 0xffffff, 0xb88aff, 0x8ab8ff, 0xff7a6a];
    let n = 0;
    for (let i = 0; i < N * 3 && n < N; i++) {
      // in drifts: a few big patches round the school + the meadow
      const patch = i % 9;
      const pa = patch * 0.7 + 0.3;
      const pr = 18 + patch * 9;
      const cx = S0.x + Math.cos(pa) * pr;
      const cz = S0.z + Math.sin(pa) * pr;
      const x = cx + (hash(i, 7) - 0.5) * 22;
      const z = cz + (hash(i, 8) - 0.5) * 22;
      if (!ok(x, z)) continue;
      m4.makeScale(1, 0.7, 1);
      m4.setPosition(x, ctx.terrainHeight(x, z) + 0.12, z);
      flowers.setMatrixAt(n, m4);
      flowers.setColorAt(n, col.setHex(cols[Math.floor(hash(i, 9) * cols.length)]));
      n++;
    }
    flowers.count = n;
    flowers.visible = false;
    ctx.outsideGroup.add(flowers);
    // autumn leaf piles
    piles = [];
    const leafCols = [0xd8682a, 0xe8a03a, 0xb83a2a, 0xd8b04a];
    for (let k = 0; k < 16; k++) {
      const a = k * 2.4;
      const r = 12 + (k % 5) * 9;
      let x = S0.x + Math.cos(a) * r;
      let z = S0.z + Math.sin(a) * r;
      if (!ok(x, z)) continue;
      const g = new THREE.Group();
      // a big round heap of leaves (mouse-sized!), with loose leaves on top
      const heap = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(leafCols[k % 4]));
      heap.scale.y = 0.55;
      g.add(heap);
      for (let j = 0; j < 22; j++) {
        const a2 = hash(j, k) * Math.PI * 2;
        const r2 = hash(j + 3, k) * 1.4;
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), M(leafCols[(j + k) % 4]));
        leaf.scale.set(1, 0.3, 1);
        leaf.position.set(Math.cos(a2) * r2, 0.15 + (1.5 - r2) * 0.5 + hash(j + 5, k) * 0.15, Math.sin(a2) * r2);
        leaf.rotation.y = a2;
        g.add(leaf);
      }
      g.position.set(x, ctx.terrainHeight(x, z), z);
      g.visible = false;
      ctx.outsideGroup.add(g);
      piles.push({ x, z, g, cool: 0 });
    }
  }
  let lastY = 0;
  let wasAir = false;
  function seasonalUpdate(dt, t) {
    seasonalBuild();
    if (!flowers) return;
    const k = season().key;
    const out = ctx.world() === "outside";
    flowers.visible = out && k === "spring";
    for (const p of piles) p.g.visible = out && k === "autumn";
    // 🍂 jump INTO a leaf pile → whoosh!
    const p = me();
    const air = p.y > ctx.terrainHeight(p.x, p.z) + 0.25;
    if (out && k === "autumn" && wasAir && !air) {
      for (const pl of piles) {
        if (pl.cool > 0 || Math.hypot(p.x - pl.x, p.z - pl.z) > 2.2) continue;
        pl.cool = 4;
        for (let i = 0; i < 26; i++) {
          const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), new THREE.MeshBasicMaterial({ color: [0xd8682a, 0xe8a03a, 0xb83a2a][i % 3], side: THREE.DoubleSide }));
          leaf.position.set(pl.x, ctx.terrainHeight(pl.x, pl.z) + 0.4, pl.z);
          ctx.outsideGroup.add(leaf);
          burst.push({ m: leaf, vx: (Math.random() - 0.5) * 6, vy: 3 + Math.random() * 4, vz: (Math.random() - 0.5) * 6, life: 1.8 });
        }
        ctx.chime();
        const r = Math.random();
        if (r < 0.25) {
          S.coins += 5;
          save();
          ctx.say("🍂 WHOOSH! Leaves everywhere — and 5 shiny coins tumble out!");
        } else if (r < 0.5) ctx.say("🍂 WHOOSH! You found an acorn cap in the pile!"), ctx.addToPack && ctx.addToPack("Acorn Caps", 1);
        else ctx.say("🍂 WHOOOOSH! Leaves EVERYWHERE!");
        break;
      }
    }
    wasAir = air;
    for (const pl of piles) pl.cool -= dt;
    for (let i = burst.length - 1; i >= 0; i--) {
      const b = burst[i];
      b.life -= dt;
      b.vy -= 6 * dt;
      b.vx *= 0.98;
      b.vz *= 0.98;
      b.m.position.x += b.vx * dt;
      b.m.position.y += Math.max(b.vy, -1.2) * dt;
      b.m.position.z += b.vz * dt;
      b.m.rotation.x += dt * 5;
      b.m.rotation.y += dt * 3;
      if (b.life <= 0) {
        b.m.parent && b.m.parent.remove(b.m);
        burst.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------- 2 HOME DECORATING
  let furnShop = null;
  function furnShopBuild() {
    if (furnShop || !ctx.cityBuilt()) return;
    furnShop = shopHouse(ctx.cityGroup, ctx.cityHeight, { x: -40, z: 30 }, 0xc8a878, "Hearth & Home Furnishings", "Upholsterer Tuft", 0x8a6a4a, openFurnShop, (x, z, r) => ctx.addCityCol(x, z, r));
  }
  // ♾️ bought one of every piece? → three pieces arrive in brand-new colors
  const FURN_BASE = FURNITURE.slice();
  function addFurnColors(n) {
    for (let j = 0; j < 3; j++) {
      const f = FURN_BASE[(n * 3 + j) % FURN_BASE.length];
      const [nm, hex] = nthTint(f.key, n);
      const k = tintKey(f.key, hex);
      if (!FURNITURE.some((x) => x.key === k)) FURNITURE.push({ ...f, key: k, name: `${nm} ${f.name}`, price: (f.basePrice ?? f.price) + 4 });
    }
  }
  for (let n = 1; n <= (S.furnMore || 0); n++) addFurnColors(n);
  function openFurnShop() {
    S.furnOwned ||= {};
    const draw = (msg = "") =>
      openCard(
        `<div class="card"><h3>🛋️ Hearth & Home Furnishings</h3><div class="coins">🪙 ${S.coins} coins · furniture goes in your furniture chest at home</div>
        ${inflate(FURNITURE).map((f) => `<div class="item"><span class="ic">${f.icon}</span><span class="nm">${f.name}<small>${S.furnOwned[f.key] ? `you have ${S.furnOwned[f.key]}` : "for any of your houses"} <b>${powerText("furn:" + f.key.split("~")[0])}</b></small></span><button data-k="${f.key}" ${S.coins < f.price ? "disabled" : ""}>🪙 ${f.price}</button></div>`).join("")}
        <div class="msg">${msg}</div><div class="close">Esc — leave · in your house, E at the 📦 chest to place furniture</div></div>`,
        (el) =>
          el.querySelectorAll("button[data-k]").forEach((b) => {
            b.onclick = () => {
              const f = FURNITURE.find((x) => x.key === b.dataset.k);
              if (S.coins < f.price) return;
              S.coins -= f.price;
              bought(f.key);
              S.furnOwned[f.key] = (S.furnOwned[f.key] || 0) + 1;
              (S.furnBought ||= {})[f.key] = true;
              let more = "";
              if (FURNITURE.every((x) => S.furnBought[x.key])) {
                S.furnMore = (S.furnMore || 0) + 1;
                addFurnColors(S.furnMore);
                more = " ✨ You've bought one of everything — NEW pieces just arrived!";
              }
              save();
              ctx.chime();
              draw(`${f.icon} ${f.name} — delivered to your furniture chest! ${powerText("furn:" + f.key.split("~")[0])}${more}`);
            };
          })
      );
    draw();
  }
  function buildFurniture(kAny) {
    const [k, tint] = splitTint(kAny); // (a new color of the same piece)
    const g = new THREE.Group();
    g.userData.tint = tint;
    const add = (geo, c, x, y, z, e) => {
      const m = new THREE.Mesh(geo, M(c, e));
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
    if (k === "rug") add(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 20), 0xb84a4a, 0, 0.03, 0);
    if (k === "armchair") {
      add(new THREE.BoxGeometry(1.2, 0.5, 1.1), 0x6a8ac8, 0, 0.35, 0);
      add(new THREE.BoxGeometry(1.2, 0.9, 0.25), 0x5a7ab8, 0, 0.8, -0.45);
      add(new THREE.BoxGeometry(0.22, 0.6, 1.1), 0x5a7ab8, -0.6, 0.6, 0);
      add(new THREE.BoxGeometry(0.22, 0.6, 1.1), 0x5a7ab8, 0.6, 0.6, 0);
    }
    if (k === "plant") {
      add(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 10), 0xc87a4a, 0, 0.25, 0);
      for (let i = 0; i < 7; i++) {
        const l = add(new THREE.ConeGeometry(0.14, 0.9, 5), 0x3a8a3a, Math.cos(i) * 0.15, 0.85, Math.sin(i) * 0.15);
        l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5);
      }
    }
    if (k === "shelf") {
      add(new THREE.BoxGeometry(1.6, 2.2, 0.45), 0x6a4a2c, 0, 1.1, 0);
      for (let i = 0; i < 12; i++) add(new THREE.BoxGeometry(0.15, 0.4, 0.3), new THREE.Color().setHSL(i * 0.13 % 1, 0.5, 0.5).getHex(), -0.6 + (i % 6) * 0.24, 0.65 + Math.floor(i / 6) * 0.75, 0.1);
    }
    if (k === "lamp") {
      add(new THREE.CylinderGeometry(0.05, 0.08, 1.8, 6), 0x3a3a3a, 0, 0.9, 0);
      add(new THREE.ConeGeometry(0.4, 0.45, 10, 1, true), 0xf4e0b0, 0, 1.9, 0, { emissive: 0xffd890, emissiveIntensity: 0.8, side: THREE.DoubleSide });
      const l = new THREE.PointLight(0xffd090, 6, 7, 1.6);
      l.position.y = 1.8;
      g.add(l);
    }
    if (k === "table") {
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 14), 0x8a5e36, 0, 0.7, 0);
      add(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 6), 0x5a3e24, 0, 0.35, 0);
      add(new THREE.SphereGeometry(0.15, 8, 6), 0xf4ece0, 0.2, 0.84, 0);
    }
    if (k === "bed") {
      add(new THREE.BoxGeometry(1.4, 0.4, 2.2), 0x8a5e36, 0, 0.25, 0);
      add(new THREE.BoxGeometry(1.35, 0.2, 1.7), 0xe8d8f0, 0, 0.5, 0.2);
      add(new THREE.BoxGeometry(1.0, 0.18, 0.4), 0xffffff, 0, 0.55, -0.8);
    }
    if (k === "aquarium") {
      add(new THREE.BoxGeometry(1.2, 0.6, 0.6), 0x6a4a2c, 0, 0.3, 0);
      add(new THREE.BoxGeometry(1.1, 0.7, 0.55), 0x6ac8e8, 0, 0.95, 0, { transparent: true, opacity: 0.5 });
      add(new THREE.SphereGeometry(0.08, 6, 4), 0xff8a2a, 0.2, 0.95, 0);
      add(new THREE.SphereGeometry(0.07, 6, 4), 0xffd84a, -0.25, 1.1, 0.1);
    }
    if (k === "fireplace") {
      add(new THREE.BoxGeometry(2, 1.8, 0.8), 0x8a8478, 0, 0.9, 0);
      add(new THREE.BoxGeometry(1.1, 0.9, 0.3), 0x1a1210, 0, 0.55, 0.3);
      add(new THREE.ConeGeometry(0.3, 0.6, 7), 0xff8a2a, 0, 0.4, 0.3, { emissive: 0xff6a1a, emissiveIntensity: 1 });
      const l = new THREE.PointLight(0xff9a40, 8, 8, 1.6);
      l.position.set(0, 0.8, 0.8);
      g.add(l);
    }
    if (tint != null) tintMeshes(g, tint);
    return g;
  }
  // the furniture inside the house you're in
  let furnShown = null;
  function syncFurniture() {
    const h = ctx.homeNow();
    if (!h || !(S.homes && S.homes[h.id])) return;
    if (furnShown && furnShown.id === h.id && furnShown.n === (S.homes[h.id].furn || []).length) return;
    if (furnShown) furnShown.meshes.forEach((m) => m.parent && m.parent.remove(m));
    const list = S.homes[h.id].furn || [];
    const meshes = list.map((f) => {
      const m = buildFurniture(f.k);
      m.position.set(f.x, 0, f.z);
      m.rotation.y = f.rot;
      h.group.add(m);
      return m;
    });
    // the furniture chest by the door
    if (!h.group.userData.chest) {
      const chest = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.7), M(0x8a5e36));
      box.position.y = 0.3;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.75), M(0x6a4a2c));
      lid.position.y = 0.65;
      chest.add(box, lid, glow(0xffe6a8, 1.4));
      chest.children[2].position.y = 1.2;
      chest.position.set(2.2, 0, h.door.z - 0.6);
      h.group.add(chest);
      h.group.userData.chest = { x: 2.2, z: h.door.z - 0.6 };
    }
    furnShown = { id: h.id, n: list.length, meshes };
  }
  function furnInteract() {
    const h = ctx.homeNow();
    if (!h || !(S.homes && S.homes[h.id] && S.homes[h.id].owned)) return null;
    syncFurniture();
    const c = h.group.userData.chest;
    const list = (S.homes[h.id].furn ||= []);
    for (let i = 0; i < list.length; i++) {
      if (near(list[i].x, list[i].z, 1.2)) {
        return { label: `pick up the ${FURNITURE.find((f) => f.key === list[i].k).name} (back to the chest)`, act: () => {
          S.furnOwned[list[i].k] = (S.furnOwned[list[i].k] || 0) + 1;
          list.splice(i, 1);
          save();
          syncFurniture();
        } };
      }
    }
    if (c && near(c.x, c.z, 1.6)) {
      return { label: "open your furniture chest", act: () => {
        S.furnOwned ||= {};
        const have = FURNITURE.filter((f) => S.furnOwned[f.key] > 0);
        openCard(
          `<div class="card"><h3>📦 Your Furniture Chest</h3><div class="coins">Pick something — it goes down right where you're standing (walk away first, then come back to the chest!)</div>
          ${have.length ? have.map((f) => `<div class="item"><span class="ic">${f.icon}</span><span class="nm">${f.name} ×${S.furnOwned[f.key]}</span><button data-k="${f.key}">place it</button></div>`).join("") : `<div class="empty">Empty! Buy furniture at Hearth & Home Furnishings in Everbough.</div>`}
          <div class="close">Esc — close · placed things: stand on them + E to pick up</div></div>`,
          (el) =>
            el.querySelectorAll("button[data-k]").forEach((b) => {
              b.onclick = () => {
                closeCard();
                placing = b.dataset.k;
                ctx.say(`🛋️ Walk to where you want it, then press E to put it down. (Esc cancels)`, true);
              };
            })
        );
      } };
    }
    if (placing) {
      return { label: `put the ${FURNITURE.find((f) => f.key === placing).name} down here`, act: () => {
        list.push({ k: placing, x: me().x + Math.sin(ctx.mouseRig.rotation.y) * 1.2, z: me().z + Math.cos(ctx.mouseRig.rotation.y) * 1.2, rot: ctx.mouseRig.rotation.y + Math.PI });
        S.furnOwned[placing]--;
        placing = null;
        save();
        syncFurniture();
        ctx.chime();
      } };
    }
    return null;
  }
  let placing = null;
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && placing) {
      placing = null;
      ctx.say("🛋️ Never mind.");
    }
  });

  // ---------------------------------------------------------------- 3 COLLECTION BOOK
  const critters = [];
  let critterT = 0;
  function spawnCritters(t) {
    const w = where();
    const grp = groupHere();
    if (!grp) return;
    critters.forEach((c) => c.parent !== grp && c.parent && c.parent.remove(c));
    const here = critters.filter((c) => c.parent === grp);
    const pool = BOOK.bugs.filter((b) => b[3] === w || (b[3] === "forest" && w === "everbough"));
    const charm = !!(S.owned && S.owned.whispercharm); // (❄️ the Frozen-Whisper Charm: creatures show themselves twice as often)
    if (!pool.length || here.length >= (charm ? 8 : 5) || t - critterT < (charm ? 1.5 : 3)) return;
    critterT = t;
    const [name, , color] = pool[Math.floor(Math.random() * pool.length)];
    const H = heightHere();
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 14;
    const x = me().x + Math.cos(a) * r;
    const z = me().z + Math.sin(a) * r;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), M(color, { emissive: color, emissiveIntensity: 0.3 }));
    g.add(body);
    if (/Butterfly|Moth/.test(name)) {
      for (const sx of [-1, 1]) {
        const w2 = new THREE.Mesh(new THREE.CircleGeometry(0.22, 6), M(color, { side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.3 }));
        w2.position.x = sx * 0.18;
        w2.rotation.x = -Math.PI / 2;
        g.add(w2);
      }
    }
    const sp = glow(0xffffff, 0.9);
    g.add(sp);
    g.userData = { name, base: { x, z }, H, ph: Math.random() * 9, fly: /Butterfly|Moth|Dragonfly|Bee|Firefly/.test(name) };
    grp.add(g);
    critters.push(g);
  }
  function critterUpdate(t) {
    for (const c of critters) {
      if (!c.parent) continue;
      const u = c.userData;
      const x = u.base.x + Math.sin(t * 0.7 + u.ph) * 2;
      const z = u.base.z + Math.cos(t * 0.6 + u.ph) * 2;
      c.position.set(x, u.H(x, z) + (u.fly ? 1.2 + Math.sin(t * 3 + u.ph) * 0.4 : 0.1), z);
      c.children.slice(1, 3).forEach((wg, i) => (wg.rotation.y = (i ? 1 : -1) * Math.sin(t * 18) * 0.8));
    }
  }
  function bookInteract() {
    for (const c of critters) {
      if (!c.parent || c.parent !== groupHere()) continue;
      if (!near(c.position.x, c.position.z, 1.6)) continue;
      return { label: `catch the ${c.userData.name}!`, act: () => {
        const first = !S.book.bugs[c.userData.name];
        S.book.bugs[c.userData.name] = (S.book.bugs[c.userData.name] || 0) + 1;
        save();
        c.parent.remove(c);
        ctx.bite();
        ctx.chime();
        ctx.say(first ? `📖 NEW! ${c.userData.name} added to your Collection Book (N)` : `🐞 Another ${c.userData.name} — you let it go gently.`);
      } };
    }
    // fossil dig spots
    for (const f of fossilSpots) {
      if (!f.g.parent || f.g.parent !== groupHere() || !f.g.visible) continue;
      if (!near(f.x, f.z, 1.8)) continue;
      return { label: "dig here — something's buried!", act: () => {
        f.g.visible = false;
        const pick = BOOK.fossils[Math.floor(Math.random() * BOOK.fossils.length)];
        const first = !S.book.fossils[pick[0]];
        S.book.fossils[pick[0]] = (S.book.fossils[pick[0]] || 0) + 1;
        save();
        ctx.bite();
        ctx.chime();
        ctx.say(`${pick[1]} You dug up ${first ? "a NEW fossil: " : "another "}${pick[0]}!`);
      } };
    }
    return null;
  }
  const fossilSpots = [];
  let fossilT = 0;
  function fossilsUpdate(t) {
    // (every fossil found? then no more dig piles — and the old ones go away)
    if (BOOK.fossils.every(([n]) => S.book.fossils[n])) {
      for (const f of fossilSpots) f.g.visible = false;
      return;
    }
    const grp = groupHere();
    if (!grp || where() === "everbough") return;
    if (t - fossilT < 20 || fossilSpots.filter((f) => f.g.parent === grp && f.g.visible).length >= 2) return;
    fossilT = t;
    const H = heightHere();
    const a = Math.random() * Math.PI * 2;
    const x = me().x + Math.cos(a) * 15;
    const z = me().z + Math.sin(a) * 15;
    const g = new THREE.Group();
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6a4a2c));
    g.add(mound, glow(0xffe08a, 1.6));
    g.children[1].position.y = 0.6;
    g.position.set(x, H(x, z), z);
    grp.add(g);
    fossilSpots.push({ g, x, z });
  }
  window.addEventListener("ww-fish", () => {
    // a caught fish: what kind was it?
    const w = where();
    const pool = BOOK.fish.filter(([n]) => (w === "frostpine" ? true : n !== "Ice Char") && (w === "silverveil" || n !== "Moon Fish"));
    const [name, icon] = pool[Math.floor(Math.random() * pool.length)];
    window.dispatchEvent(new CustomEvent("ww-fish-kind", { detail: { name } })); // (🎣 the tournament weighs it)
    const first = !S.book.fish[name];
    S.book.fish[name] = (S.book.fish[name] || 0) + 1;
    save();
    if (first) setTimeout(() => ctx.say(`📖 NEW! ${icon} ${name} — added to your Collection Book (N)`), 1200);
  });
  const bookEl = document.createElement("div");
  bookEl.id = "collection-book";
  bookEl.style.cssText = "position:fixed;inset:0;z-index:57;display:none;align-items:center;justify-content:center;background:rgba(8,6,14,.5);";
  document.body.appendChild(bookEl);
  function drawBook() {
    const page = (title, list, got, icon) => {
      const n = list.filter(([nm]) => got[nm]).length;
      return `<h3 style="margin:12px 0 6px;color:#5a3a12">${icon} ${title} — ${n}/${list.length}${n === list.length ? " ✔ complete! (+museum display)" : ""}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">${list.map(([nm, ic]) => `<div style="padding:6px;border-radius:9px;text-align:center;background:${got[nm] ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.08)"};font:12px system-ui"><div style="font-size:24px">${got[nm] ? ic : "❔"}</div>${got[nm] ? nm : "???"}</div>`).join("")}</div>`;
    };
    bookEl.innerHTML = `<div style="width:min(620px,92vw);max-height:86vh;overflow:auto;padding:18px 22px;border-radius:16px;background:#f1e4c4;color:#3a2614;font:15px Georgia,serif;box-shadow:0 14px 50px rgba(0,0,0,.6)">
      <h2 style="margin:0;text-align:center">📖 Thistle's Collection Book</h2>
      ${page("Bugs & Butterflies", BOOK.bugs, S.book.bugs, "🦋")}${page("Fish", BOOK.fish, S.book.fish, "🐟")}${page("Fossils", BOOK.fossils, S.book.fossils, "🦴")}${window.__wwSecretsPage ? window.__wwSecretsPage() : ""}
      <div style="text-align:center;margin-top:10px;font:12px system-ui;color:#8a6a44">Catch bugs (E), fish at jetties & ice holes, dig at glowing mounds · N or Esc — close</div></div>`;
  }
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyN" && !e.repeat && !ctx.playing()) {
      const open = bookEl.style.display === "flex";
      if (!open) drawBook();
      bookEl.style.display = open ? "none" : "flex";
    } else if (e.code === "Escape" && bookEl.style.display === "flex") bookEl.style.display = "none";
  });
  const bookCompleteCount = () => ["bugs", "fish", "fossils"].filter((k) => BOOK[k].every(([n]) => S.book[k][n])).length;

  // ---------------------------------------------------------------- 4 GUILDS
  let guildBoard = null;
  function guildBuild() {
    if (guildBoard || !ctx.cityBuilt()) return;
    const x = -20;
    const z = 20;
    const y = ctx.cityHeight(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(-x, -z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.2), M(0x6a4a2c));
    board.position.y = 2;
    // (🪧 crisp, high-res, unlit — see signs.js)
    const tex = signTexture("GUILD BOARD\n🌱 🔨 📜 🧭", "wood", 3.4 / 2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    face.position.set(0, 2, 0.11);
    for (const sx of [-1.6, 1.6]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3, 5), M(0x5a3e24));
      leg.position.set(sx, 1.5, -0.05);
      g.add(leg);
    }
    g.add(board, face);
    ctx.cityGroup.add(g);
    ctx.addCityCol(x, z, 1.6);
    guildBoard = { x: x + Math.sin(g.rotation.y) * 2, z: z + Math.cos(g.rotation.y) * 2 };
  }
  const rankOf = (v) => RANKS.reduce((r, [name, need], i) => (v >= need ? i : r), 0);
  function openGuilds() {
    const draw = (msg = "") =>
      openCard(
        `<div class="card"><h3>🏰 The Guild Board</h3><div class="coins">Rise through the ranks by living your life! · 🪙 ${S.coins}</div>
        ${GUILDS.map((G) => {
          const v = G.stat(S);
          const r = rankOf(v);
          const next = RANKS[r + 1];
          const claimed = S.guildClaimed[G.key] || 0;
          return `<div class="item"><span class="ic">${G.icon}</span><span class="nm">${G.name} — <b>${RANKS[r][0]}</b><small>${v} ${G.unit}${next ? ` · ${next[0]} at ${next[1]}` : " · top rank!"}</small></span>
            <button data-g="${G.key}" ${claimed >= r ? "disabled" : ""}>${claimed >= r ? "✓" : "claim 🪙 " + (r - claimed) * 15}</button></div>`;
        }).join("")}
        <div class="msg">${msg}</div><div class="close">Esc — leave</div></div>`,
        (el) =>
          el.querySelectorAll("button[data-g]").forEach((b) => {
            b.onclick = () => {
              const G = GUILDS.find((x) => x.key === b.dataset.g);
              const r = rankOf(G.stat(S));
              const gain = (r - (S.guildClaimed[G.key] || 0)) * 15;
              S.guildClaimed[G.key] = r;
              S.coins += gain;
              if (r >= 4) (S.owned ||= {})["master_" + G.key] = true;
              save();
              ctx.chime();
              draw(`${G.icon} You are now a ${RANKS[r][0]} of the ${G.name}! +🪙 ${gain}`);
            };
          })
      );
    draw();
  }

  // ---------------------------------------------------------------- 5 WEATHER RESCUES
  const R = { city: null, spots: [], water: 0 };
  function rescueSetup(city) {
    const def = RESCUES[city.id];
    if (!def || S.rescued[city.id] || R.city === city) return;
    // one rescue at a time, and only once you've helped the city before
    if (!ctx.storyPhase || ctx.storyPhase() < 10) return;
    R.city = city;
    R.water = 0;
    R.spots = def.spots.map((sp) => {
      const g = new THREE.Group();
      const y = sp.water ? 0.3 : city.height(sp.x, sp.z);
      g.position.set(sp.x, y, sp.z);
      if (def.needWater) {
        for (let k = 0; k < 9; k++) {
          const p = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 4), M(0x9a8a3a));
          p.position.set((k % 3 - 1) * 0.9, 0.3, (Math.floor(k / 3) - 1) * 0.9);
          p.rotation.z = 0.8;
          g.add(p);
        }
      } else {
        if (sp.water) {
          const roof = new THREE.Mesh(new THREE.ConeGeometry(2, 1.4, 8), M(0x8a7a3a));
          roof.position.y = 0.4;
          g.add(roof);
        }
        const m = buildThistle({ tunicColor: 0x8a6a9a, hoodColor: 0x8a6a9a, pack: false });
        m.scale.setScalar(0.9);
        m.position.y = sp.water ? 1.1 : 0;
        g.add(m);
      }
      const lamp = glow(0xffd890, 3);
      lamp.position.y = 2.2;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.6, 30, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      beam.position.y = 15;
      g.add(lamp, beam);
      city.group.add(g);
      return { ...sp, g, done: false };
    });
    ctx.say(`${def.icon} ${def.name}! ${def.text}`, true);
  }
  function rescueInteract() {
    const city = ctx.world() === "city" ? ctx.city() : null;
    if (!city || R.city !== city) return null;
    const def = RESCUES[city.id];
    if (def.needWater && city.props.pump && near(city.props.pump.x, city.props.pump.z, 2.2) && R.water < 4) {
      return { label: "fill your bucket at the pump", act: () => { R.water = 4; ctx.say("🪣 Bucket full — water the wilting fields!"); } };
    }
    for (const sp of R.spots) {
      if (sp.done || !near(sp.x, sp.z, sp.water ? 3 : 2.6)) continue;
      if (def.needWater && R.water <= 0) return { label: "this field needs water", act: () => ctx.say("🪣 Fill your bucket at the pump first.") };
      return { label: def.verb, act: () => {
        sp.done = true;
        if (def.needWater) {
          R.water--;
          sp.g.children.forEach((c) => c.geometry && c.geometry.type === "ConeGeometry" && (c.material = M(0x4a9a3a), (c.rotation.z = 0)));
        } else sp.g.visible = false;
        sp.g.children.filter((c) => c.isSprite || c.geometry?.type === "CylinderGeometry").forEach((c) => (c.visible = false));
        ctx.chime();
        const left = R.spots.filter((x) => !x.done).length;
        if (!left) {
          S.rescued[city.id] = true;
          S.coins += 30;
          stat("rescues");
          ctx.addRep(city.id, 1);
          save();
          R.city = null;
          ctx.say(`${def.icon} ${def.name} — everyone's safe! The city cheers! +🪙 30`, true);
        } else ctx.say(`${def.icon} ${R.spots.length - left}/${R.spots.length} — keep going!`);
      } };
    }
    return null;
  }

  // ---------------------------------------------------------------- 6 NIGHT MARKET
  let nightMarket = null;
  const isNight = () => ctx.dayTime() > 0.76 || ctx.dayTime() < 0.22;
  /** noon → sunset: when the Great Bonfire burns */
  const isAfternoon = () => ctx.dayTime() >= 0.5 && ctx.dayTime() < 0.75;
  const timeName = () => {
    const d = ctx.dayTime();
    return d < 0.22 ? "🌙 Night" : d < 0.3 ? "🌅 Dawn" : d < 0.5 ? "🌤️ Morning" : d < 0.75 ? "☀️ Afternoon" : d < 0.8 ? "🌇 Dusk" : "🌙 Night";
  };
  function nightBuild() {
    if (nightMarket || !ctx.cityBuilt()) return;
    const g = new THREE.Group();
    const stalls = [];
    for (let k = 0; k < 6; k++) {
      const a = Math.PI * 0.65 + (k / 5) * Math.PI * 0.7;
      const x = Math.cos(a) * 14;
      const z = Math.sin(a) * 14;
      const y = ctx.cityHeight(x, z);
      const s = new THREE.Group();
      s.position.set(x, y, z);
      s.rotation.y = Math.atan2(-x, -z);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1), M(0x3a2a4a));
      counter.position.y = 0.45;
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2, 1.2, 4), M([0x6a3a9a, 0x2a4a8a, 0x8a2a6a][k % 3], { emissive: [0x3a1a6a, 0x1a2a6a, 0x5a1a4a][k % 3], emissiveIntensity: 0.6 }));
      canopy.position.y = 3;
      canopy.rotation.y = Math.PI / 4;
      const lantern = glow([0xbfa0ff, 0x9fd8ff, 0xffa0d8][k % 3], 2.6);
      lantern.position.y = 2.2;
      for (const sx of [-1.2, 1.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), M(0x2a2a2a));
        pole.position.set(sx, 1.3, -0.4);
        s.add(pole);
      }
      s.add(counter, canopy, lantern);
      g.add(s);
      stalls.push({ x: x * 0.86, z: z * 0.86 });
    }
    // strings of lights across the plaza
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const l = glow([0xffd890, 0xbfa0ff, 0x9fd8ff][k % 3], 0.9);
      l.position.set(Math.cos(a) * 17, ctx.cityHeight(0, 0) + 5 + Math.sin(k * 0.7) * 0.4, Math.sin(a) * 17);
      g.add(l);
    }
    const seller = buildThistle({ tunicColor: 0x2a2a4a, hoodColor: 0x1a1a3a, pack: false });
    seller.position.set(0, ctx.cityHeight(0, 10), 10.5);
    seller.rotation.y = Math.PI;
    g.add(seller);
    ctx.cityGroup.add(g);
    nightMarket = { g, stalls, seller: { x: 0, z: 9 } };
  }
  // ♾️ what's on the night stalls: the treats + mystery parcels always, and
  // keepsakes — buy every one and the merchants unpack NEW ones
  function nightGoods() {
    const base = NIGHT_GOODS;
    let n = 0;
    let keeps = base.filter((it) => !it.heal && !it.mystery);
    while (n < 400 && keeps.every((it) => S.owned[it.key])) {
      n++;
      keeps = genBatch("night", "Night Market", n);
    }
    return { items: inflate([...keeps, ...base.filter((it) => it.heal || it.mystery)]), fresh: n > 0 };
  }
  function openNightMarket() {
    S.owned ||= {};
    const draw = (msg = "") =>
      openCard(
        `<div class="card" style="background:#2a2440;color:#e8e0ff"><h3 style="color:#d8c8ff">🌙 The Night Market</h3><div class="coins" style="color:#ffd890">🪙 ${S.coins} · open only while the moon is up${nightGoods().fresh ? " · ✨ new treasures tonight!" : ""}</div>
        ${nightGoods().items.map((it) => {
          const owned = !it.heal && !it.mystery && S.owned[it.key];
          return `<div class="item" style="background:rgba(255,255,255,.08)"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small style="color:#b8a8d8">${it.desc}${powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}</small></span><button data-k="${it.key}" ${owned || S.coins < it.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + it.price}</button></div>`;
        }).join("")}
        <div class="msg" style="color:#a8ffb8">${msg}</div><div class="close">Esc — leave</div></div>`,
        (el) =>
          el.querySelectorAll("button[data-k]").forEach((b) => {
            b.onclick = () => {
              const before = nightGoods().items;
              const it = before.find((x) => x.key === b.dataset.k);
              if (!it || S.coins < it.price) return;
              S.coins -= it.price;
              bought(it.key);
              let msg = `You bought ${it.icon} ${it.name}!`;
              if (it.heal) msg += bagFood(it);
              else if (it.mystery) {
                const r = Math.random();
                if (r < 0.4) {
                  S.coins += 25;
                  msg = "🎁 Inside: 25 shiny coins!";
                } else if (r < 0.7) {
                  const f = BOOK.fossils[Math.floor(Math.random() * BOOK.fossils.length)];
                  S.book.fossils[f[0]] = (S.book.fossils[f[0]] || 0) + 1;
                  msg = `🎁 Inside: a fossil — ${f[1]} ${f[0]}!`;
                } else {
                  S.owned.moonpearl = true;
                  msg = `🎁 Inside: a glowing Moon Pearl! (a keepsake) ${powerText("moonpearl")}`;
                }
              } else {
                S.owned[it.key] = true;
                if (powerText(it.key)) msg += ` ${powerText(it.key)}!`;
              }
              if (nightGoods().items[0].key !== before[0].key) msg += " — and the merchants unpack something NEW!";
              save();
              ctx.chime();
              draw(msg);
            };
          })
      );
    draw();
  }

  // ---------------------------------------------------------------- 7 PHOTO MODE
  const PH = { on: false, yaw: 0, pitch: 0.25, dist: 4, frame: 0 };
  const FRAMES = ["none", "polaroid", "gold", "moonlit"];
  const photoUI = document.createElement("div");
  photoUI.style.cssText = "position:fixed;inset:0;z-index:58;pointer-events:none;display:none;";
  document.body.appendChild(photoUI);
  function drawPhotoUI() {
    const f = FRAMES[PH.frame];
    const border = { none: "none", polaroid: "18px solid #fbf8f0", gold: "16px ridge #d8a83a", moonlit: "14px solid rgba(160,190,255,.85)" }[f];
    photoUI.innerHTML = `<div style="position:absolute;inset:6%;border:${border};border-bottom-width:${f === "polaroid" ? "70px" : ""};box-shadow:${f === "moonlit" ? "0 0 40px #8ab8ff inset" : "none"}"></div>
      <div style="position:absolute;bottom:2%;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:10px;background:rgba(0,0,0,.55);color:#fff;font:13px system-ui">📸 A/D orbit · W/S zoom · R/F tilt · Q frame (${f}) · Space — snap! · P/Esc — exit</div>`;
  }
  function togglePhoto(on) {
    PH.on = on;
    photoUI.style.display = on ? "" : "none";
    // a clean picture: hide every panel and button (just the world + the frame)
    for (const el of document.body.children) {
      if (el === photoUI || el.tagName === "CANVAS" || el.tagName === "SCRIPT") continue;
      if (on) {
        el.dataset.photoVis = el.style.visibility;
        el.style.visibility = "hidden";
      } else if ("photoVis" in el.dataset) {
        el.style.visibility = el.dataset.photoVis;
        delete el.dataset.photoVis;
      }
    }
    if (on) {
      PH.yaw = ctx.mouseRig.rotation.y + Math.PI;
      drawPhotoUI();
    }
  }
  const photoKeys = {};
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "KeyP" && !e.repeat && !ctx.playing()) {
        togglePhoto(!PH.on);
        e.stopImmediatePropagation();
        return;
      }
      if (!PH.on) return;
      if (e.code === "Escape") togglePhoto(false);
      else if (e.code === "KeyQ") {
        PH.frame = (PH.frame + 1) % FRAMES.length;
        drawPhotoUI();
      } else if (e.code === "Space") snap();
      else photoKeys[e.code] = true;
      e.stopImmediatePropagation();
      e.preventDefault();
    },
    true
  );
  window.addEventListener("keyup", (e) => (photoKeys[e.code] = false));
  function snap() {
    ctx.renderNow();
    const src = ctx.renderer.domElement;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const g = c.getContext("2d");
    g.drawImage(src, 0, 0);
    const f = FRAMES[PH.frame];
    const pad = Math.round(c.width * 0.04);
    if (f !== "none") {
      g.lineWidth = pad;
      g.strokeStyle = f === "polaroid" ? "#fbf8f0" : f === "gold" ? "#d8a83a" : "rgba(160,190,255,.9)";
      g.strokeRect(pad / 2, pad / 2, c.width - pad, c.height - pad);
      if (f === "polaroid") {
        g.fillStyle = "#fbf8f0";
        g.fillRect(0, c.height - pad * 2.4, c.width, pad * 2.4);
        g.fillStyle = "#5a4a3a";
        g.font = `${Math.round(pad * 0.9)}px Georgia`;
        g.textAlign = "center";
        g.fillText("WhiskerWood 🐭 " + new Date().toLocaleDateString(), c.width / 2, c.height - pad * 0.9);
      }
    }
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `whiskerwood-photo-${Date.now()}.png`;
    a.click();
    S.photos++;
    // (a little copy for Thistle's storybook)
    let thumb = null;
    try {
      const tc = document.createElement("canvas");
      tc.width = 200;
      tc.height = Math.round((200 * c.height) / c.width);
      tc.getContext("2d").drawImage(c, 0, 0, tc.width, tc.height);
      thumb = tc.toDataURL("image/jpeg", 0.6);
    } catch {}
    window.dispatchEvent(new CustomEvent("ww-photo", { detail: { frame: FRAMES[PH.frame], yaw: PH.yaw, dist: PH.dist, thumb } }));
    save();
    const flash = document.createElement("div");
    flash.style.cssText = "position:fixed;inset:0;background:#fff;z-index:59;opacity:.9;transition:opacity .5s;pointer-events:none";
    document.body.appendChild(flash);
    requestAnimationFrame(() => (flash.style.opacity = "0"));
    setTimeout(() => flash.remove(), 600);
    ctx.say("📸 Snap! Your photo was saved to your downloads.");
  }
  /** called by main every frame: true = photo mode owns the camera */
  function photoCamera(dt) {
    if (!PH.on) return false;
    if (photoKeys.KeyA) PH.yaw += dt * 1.5;
    if (photoKeys.KeyD) PH.yaw -= dt * 1.5;
    if (photoKeys.KeyW) PH.dist = Math.max(1.2, PH.dist - dt * 4);
    if (photoKeys.KeyS) PH.dist = Math.min(20, PH.dist + dt * 4);
    if (photoKeys.KeyR) PH.pitch = Math.min(1.3, PH.pitch + dt);
    if (photoKeys.KeyF) PH.pitch = Math.max(-0.2, PH.pitch - dt);
    const p = me();
    const cam = ctx.camera;
    cam.position.set(p.x + Math.sin(PH.yaw) * Math.cos(PH.pitch) * PH.dist, p.y + 0.6 + Math.sin(PH.pitch) * PH.dist, p.z + Math.cos(PH.yaw) * Math.cos(PH.pitch) * PH.dist);
    cam.lookAt(p.x, p.y + 0.5, p.z);
    return true;
  }

  // ---------------------------------------------------------------- 8 SILVERVEIL
  // three star shards: Moonstone Hollow's reading rock, Roothaven's World
  // Pine, and Everbough's Highcanopy deck
  const SHARDS = [
    { key: "hollow", where: "forest", label: "the star shard by the reading rock", at: () => ({ x: ctx.journalPos.x + 2, z: ctx.journalPos.z - 2 }) },
    { key: "pine", where: "roothaven", label: "the star shard at the World Pine's roots", at: () => ({ x: 0, z: 12 }) },
    { key: "canopy", where: "everbough", label: "the star shard atop the Highcanopy", at: () => ({ x: 92, z: 26 }), high: true },
  ];
  const shardMeshes = {};
  const shardsUnlocked = () => !!(ctx.storyPhase && ctx.storyPhase() >= 14); // (Phase 14: the Road to Silverveil)
  function shardsUpdate(t) {
    if (!shardsUnlocked()) return;
    for (const sh of SHARDS) {
      if (S.shards[sh.key] || where() !== sh.where) continue;
      const grp = groupHere();
      if (!grp) continue;
      if (!shardMeshes[sh.key]) {
        const at = sh.at();
        const H = heightHere();
        const y = sh.high ? ctx.deckY("canopy") : H(at.x, at.z);
        if (!isFinite(y)) continue;
        const g = new THREE.Group();
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshBasicMaterial({ color: 0xe8f0ff }));
        // a tall silver beam — so you can spot the shard from far away
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.8, 120, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
        );
        beam.position.y = 60;
        g.add(star, glow(0xbfe6ff, 3.2), beam);
        g.position.set(at.x, y + 1.2, at.z);
        grp.add(g);
        shardMeshes[sh.key] = { g, star, at, y };
      }
      const m = shardMeshes[sh.key];
      m.star.rotation.y = t * 2;
      m.g.position.y = m.y + 1.2 + Math.sin(t * 2) * 0.15;
    }
  }
  function shardInteract() {
    if (!shardsUnlocked()) return null;
    for (const sh of SHARDS) {
      const m = shardMeshes[sh.key];
      if (S.shards[sh.key] || !m || where() !== sh.where) continue;
      if (!near(m.at.x, m.at.z, 2.2) || Math.abs(me().y - m.y) > 3) continue;
      return { label: `take ${sh.label}`, act: () => {
        S.shards[sh.key] = true;
        m.g.visible = false;
        save();
        ctx.chime();
        const n = Object.keys(S.shards).length;
        if (n >= 3) {
          playCutscene([
            { dur: 1, fadeOut: true, gameCam: true },
            { dur: 4, black: true, gameCam: true, text: "The three star shards rise from your pack and spin together into a single silver star…" },
            { dur: 4, black: true, gameCam: true, who: "A voice like moonlight", text: "“Beyond the five, there was a sixth. The city where the Moonkeepers were born. Silverveil.”" },
            { dur: 3.6, black: true, gameCam: true, text: "🗺️ A new road appears on the Moonkeepers' map: SILVERVEIL — the Lost Sixth City." },
            { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌙 Silverveil is on your travel map! (E at a waystone / station, or K)", true) },
          ]);
        } else ctx.say(`⭐ A star shard! (${n}/3) — it hums, as if calling to the others.`, true);
      } };
    }
    return null;
  }
  const silverveilOpen = () => Object.keys(S.shards).length >= 3;
  // Silverveil's own story: Renata's statue + her last journal
  let silverBuilt = null;
  function silverUpdate() {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "silverveil" || silverBuilt === c) return;
    silverBuilt = c;
    const st = buildThistle({ tunicColor: 0xe8f0ff, hoodColor: 0xe8f0ff, pack: true });
    st.traverse((o) => o.isMesh && (o.material = new THREE.MeshStandardMaterial({ color: 0xdfe8f4, emissive: 0x4a5a8a, emissiveIntensity: 0.6, flatShading: true })));
    st.scale.setScalar(2.4);
    st.position.set(0, c.height(0, 18) + 1.2, 18);
    st.rotation.y = Math.PI;
    c.group.add(st);
    if (!S.silverVisited) {
      S.silverVisited = true;
      save();
      playCutscene([
        { dur: 4, from: [0, 30, 90], to: [0, 14, 50], look: [0, 4, 0], text: "SILVERVEIL. Moonlit towers, silver birches, a pool that holds the moon itself." },
        { dur: 3.6, from: [6, 4, 26], look: [0, 3.5, 18], text: "And in the middle of it all — a statue of a mouse with a lantern. Renata." },
        { dur: 0.4, gameCam: true },
      ]);
    }
  }
  function silverInteract() {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "silverveil") return null;
    const J = c.props.journal;
    if (near(J.x, J.z, 2.4)) {
      return { label: "read Renata's last journal", act: () => {
        const y = c.height(J.x, J.z);
        playCutscene([
          { dur: 4, from: [J.x + 1.6, y + 2.2, J.z + 1.8], look: [J.x, y + 1.4, J.z], who: "Renata Josephine Rudy — her last journal", text: "“I was born here, in Silverveil, where the first Moonkeepers watched the stars and learned the roads between them.”" },
          { dur: 4.4, from: [J.x + 1.6, y + 2.2, J.z + 1.8], look: [J.x, y + 1.4, J.z], who: "Renata Josephine Rudy — her last journal", text: "“I am old now. The roads are failing. But I am not afraid. One day a small mouse with a lantern will walk them again — and she will find this book.”" },
          { dur: 4.4, from: [J.x + 1.6, y + 2.2, J.z + 1.8], look: [J.x, y + 1.4, J.z], who: "Renata Josephine Rudy — her last journal", text: "“Hello, little one. Thank you for keeping my promise. The moon is yours now.”" },
          { dur: 0.4, gameCam: true, end: () => {
            if (!S.renataJournal) {
              S.renataJournal = true;
              (S.owned ||= {}).renatalantern = true;
              save();
              window.dispatchEvent(new Event("ww-refresh"));
              ctx.say("🏮 Beside the journal lies Renata's own lantern. It's yours now. (a keepsake)", true);
            }
          } },
        ]);
      } };
    }
    const K = c.people.keeper;
    if (K && near(K.x, K.z)) {
      return { label: "talk to the Last Keeper", act: () => {
        const y = c.height(K.x, K.z);
        const first = !S.silverKeeper;
        const line = !S.renataJournal
          ? "I have kept Silverveil for a long, long time, waiting. Renata said you would come. Her journal is on the lectern by the observatory, in the north — go, read."
          : "“Now — wake the Moon-Pool. Four moon-mirrors stand round it. Turn them until every beam falls into the water. But mind: the old mirrors are LINKED. Turn one, and its neighbour turns too. Think before you turn!”";
        playCutscene([{ dur: 4.4, from: [K.x + 2, y + 1.8, K.z + 2], look: [K.x, y + 0.9, K.z], who: "The Last Keeper", text: line, end: () => {
          if (first) {
            S.silverKeeper = true;
            save();
            window.dispatchEvent(new Event("ww-refresh"));
          }
        } }]);
      } };
    }
    return null;
  }

  // ---------------------------------------------------------------- 🔥 THE GREAT BONFIRE (Golden Hollow)
  // in the Harvest Hall's yard: free food + hot cocoa for everyone, and the
  // Bonfire Keeper hands a newcomer the keys to a house of her own
  const BONFIRE = { x: -24, z: -30 };
  const FREE_FOOD = [
    { key: "cocoa", icon: "☕", name: "Hot Cocoa", heal: 20, warm: true, desc: "warm all the way to your tail" },
    { key: "corn", icon: "🌽", name: "Roasted Corn", heal: 25, desc: "straight off the coals" },
    { key: "bread", icon: "🍞", name: "Toasted Harvest Bread", heal: 30, desc: "with honey butter" },
    { key: "soup", icon: "🍲", name: "Pumpkin Soup", heal: 35, desc: "from the big black kettle" },
    { key: "apple", icon: "🍎", name: "Baked Apple", heal: 20, desc: "cinnamon and brown sugar" },
  ];
  let bonfire = null;
  function bonfireBuild(c) {
    if (bonfire && bonfire.city === c) return;
    const H = c.height;
    const { x, z } = BONFIRE;
    const y = H(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    // a ring of stones, a great stack of logs, tall flames
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), M(0x8a8478));
      st.userData.keep = true;
      st.position.set(Math.cos(a) * 3, 0.3, Math.sin(a) * 3);
      g.add(st);
    }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.4, 6), M(0x5a3a22));
      log.position.set(Math.cos(a) * 0.9, 1.8, Math.sin(a) * 0.9);
      log.userData.keep = true;
      log.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
      g.add(log);
    }
    const flames = [];
    for (const [r, h, col, yy] of [[1.9, 4.6, 0xff5a1a, 2.4], [1.4, 3.8, 0xff9a2a, 2.6], [0.8, 2.8, 0xffe06a, 2.4]]) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
      f.position.y = yy;
      g.add(f);
      flames.push(f);
    }
    const halo = glow(0xff9a40, 12);
    halo.position.y = 3;
    const light = new THREE.PointLight(0xff8a30, 30, 30, 1.6);
    light.position.y = 4;
    g.add(halo, light);
    // sparks drifting up
    const sparks = [];
    for (let k = 0; k < 30; k++) {
      const sp = glow(0xffc060, 0.5);
      sp.userData.ph = hash(k, 5) * 10;
      g.add(sp);
      sparks.push(sp);
    }
    // log benches round the fire, mice gathered to warm their paws
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 7), M(0x6a4a2c));
      bench.rotation.z = Math.PI / 2;
      bench.rotation.y = -a;
      bench.position.set(Math.cos(a) * 6.5, 0.4, Math.sin(a) * 6.5);
      g.add(bench);
      if (k % 2 === 0) {
        const m = buildThistle({ tunicColor: [0xc86a3a, 0x6a8a3a, 0x8a5aa8][k / 2], hoodColor: [0xa85a2a, 0x5a7a2a, 0x6a4a88][k / 2], pack: false });
        m.scale.setScalar(0.9);
        m.position.set(Math.cos(a) * 7.4, 0, Math.sin(a) * 7.4);
        m.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
        g.add(m);
      }
    }
    // the Bonfire Keeper + a long table of free food
    const keeper = buildThistle({ tunicColor: 0xd8642a, hoodColor: 0xb84a1a, pack: false });
    keeper.scale.setScalar(1.15);
    keeper.position.set(0, 0, 5.2);
    g.add(keeper);
    const table = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 1.3), M(0x8a5e36));
    table.position.set(0, 0.9, 6.6);
    g.add(table);
    for (let k = 0; k < 5; k++) {
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), M([0x6a3a1a, 0xffd84a, 0xd8a85a, 0xe8882a, 0xd83a3a][k]));
      dish.position.set(-1.7 + k * 0.85, 1.12, 6.6);
      g.add(dish);
    }
    // a big sign: THE GREAT BONFIRE · free food & cocoa
    // (🪧 big, crisp, readable from both sides — see signs.js)
    const sign = signBoard("🔥 THE GREAT BONFIRE 🔥\nlit every afternoon · free food & cocoa!", { w: 4.8, h: 1.45, style: { bg: "#4a200c", frame: "#ffb050", ink: "#ffe0a0" } });
    sign.position.set(4.6, 2.9, 6.4);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 5), M(0x5a3e24));
    post.position.set(4.6, 1.3, 6.35);
    g.add(sign, post);
    // the stone ring, the stacked logs and the sign stay all day; everything
    // else (fire, food, keeper, the crowd) only comes out in the afternoon
    const party = new THREE.Group();
    for (const ch of [...g.children]) {
      if (ch.userData.keep || ch === sign || ch === post) continue;
      party.add(ch);
    }
    g.add(party);
    c.group.add(g);
    c.colliders.push({ x, z, r: 3.4 });
    const face = Math.atan2(-x, -z);
    g.rotation.y = face; // (the food table faces the town centre)
    const at = (lx, lz) => ({ x: x + lx * Math.cos(face) + lz * Math.sin(face), z: z - lx * Math.sin(face) + lz * Math.cos(face) });
    bonfire = { city: c, flames, sparks, halo, light, party, table: at(0, 7.8) };
  }
  function bonfireUpdate(t) {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "golden") return;
    bonfireBuild(c);
    bonfire.party.visible = isAfternoon();
    if (!bonfire.party.visible) return;
    bonfire.flames.forEach((f, i) => f.scale.set(1 + Math.sin(t * (9 + i * 3)) * 0.08, 1 + Math.sin(t * (6 + i * 2) + i) * 0.15, 1));
    bonfire.light.intensity = 26 + Math.sin(t * 13) * 5;
    bonfire.sparks.forEach((sp) => {
      const k = (t * 0.5 + sp.userData.ph) % 3;
      sp.position.set(Math.sin(sp.userData.ph * 3 + t) * 1.2, 3 + k * 3, Math.cos(sp.userData.ph * 5 + t) * 1.2);
      sp.material.opacity = 0.9 * (1 - k / 3);
    });
  }
  function openBonfire() {
    S.owned ||= {};
    const c = ctx.city();
    // first time at the fire: the keys to a house of your own, free!
    let gift = "";
    if (!S.bonfireHouse) {
      S.bonfireHouse = true;
      const had = S.homes && S.homes.golden && S.homes.golden.owned;
      (S.homes ||= {}).golden ||= {};
      S.homes.golden.owned = true;
      save();
      ctx.chime();
      gift = had
        ? "🔑 “You've already got a house here? Then take this purse for the fire's sake!” +🪙 50"
        : "🔑 “Welcome, newcomer! Every new face at the Great Bonfire gets a home in Golden Hollow — here are your keys!” A FREE HOUSE is yours (by the fields, near the stable).";
      if (had) S.coins += 50;
      save();
    }
    const draw = (msg = "") =>
      openCard(
        `<div class="card"><h3>🔥 The Great Bonfire</h3><div class="coins">Bonfire Keeper Ember · everything here is FREE — take as much as you like!</div>
        ${gift ? `<div class="msg" style="font-size:16px">${gift}</div>` : ""}
        ${FREE_FOOD.map((f) => `<div class="item"><span class="ic">${f.icon}</span><span class="nm">${f.name}<small>${f.desc} · +${f.heal} ❤️</small></span><button data-k="${f.key}">take one</button></div>`).join("")}
        <div class="msg">${msg}</div><div class="close">Esc — back to the fire</div></div>`,
        (el) =>
          el.querySelectorAll("button[data-k]").forEach((b) => {
            b.onclick = () => {
              const f = FREE_FOOD.find((x) => x.key === b.dataset.k);
              const m = bagFood(f);
              ctx.chime();
              gift = "";
              draw(`${f.icon} ${f.name}, free from the fire!${m}`);
            };
          })
      );
    draw();
    if (c && S.bonfireHouse) c.life && c.life.refreshHouse && c.life.refreshHouse();
  }
  function bonfireInteract() {
    if (!bonfire || ctx.world() !== "city" || !ctx.city() || ctx.city().id !== "golden") return null;
    if (!near(bonfire.table.x, bonfire.table.z, 4)) return null;
    if (!isAfternoon()) return { label: "look at the Great Bonfire (it\u2019s lit every afternoon)", act: () => ctx.say(`🔥 The logs are stacked and waiting. The Great Bonfire is lit every AFTERNOON — it's ${timeName()} now. Come back after noon!`, true) };
    return { label: "join the Great Bonfire — free food & hot cocoa!", act: openBonfire };
  }

  // ---------------------------------------------------------------- tiny HUD line
  const hudEl = document.createElement("div");
  hudEl.style.cssText = "position:fixed;top:120px;left:50%;transform:translateX(-50%);z-index:41;padding:8px 18px;border-radius:12px;background:rgba(20,16,10,.8);color:#fff3c8;font:bold 18px system-ui;display:none;";
  document.body.appendChild(hudEl);
  function hud(text) {
    hudEl.style.display = text ? "" : "none";
    if (text) hudEl.textContent = text;
  }

  // ================================================================ hooks
  function interactable() {
    if (PH.on) return null;
    const p = me();
    const w = where();
    if (w === "everbough") {
      if (festHost && near(festHost.x, festHost.z, 2.6) && !FEST.on) return { label: `talk to the Festival Host — the ${season().fest}`, act: startFestival };
      if (furnShop) {
        const f = furnShop.interactable(p);
        if (f) return f;
      }
      if (guildBoard && near(guildBoard.x, guildBoard.z, 2.6)) return { label: "read the Guild Board", act: openGuilds };
      if (nightMarket && nightMarket.g.visible && near(nightMarket.seller.x, nightMarket.seller.z, 6)) return { label: "browse the Night Market", act: openNightMarket };
    }
    return bonfireInteract() || furnInteract() || rescueInteract() || shardInteract() || silverInteract() || bookInteract();
  }
  function update(dt, t) {
    const dtNow = ctx.dayTime();
    if (dtNow < lastTime - 0.5) {
      S.days++;
      save();
      if (S.days % 2 === 0) ctx.say(`${season().icon} ${season().name} has come! The ${season().fest} is on in Everbough's Market Circle.`, true);
    }
    lastTime = dtNow;
    const s = season();
    seasonChip.textContent = `${s.icon} ${s.name} · ${timeName()}${ctx.cityBuilt() ? ` · the ${s.fest} in Everbough` : ""}`;
    // falling seasonal things in the forest
    seasonalUpdate(dt, t);
    fall.visible = !!s.fall && ctx.world() === "outside";
    if (fall.visible) {
      fall.material.color.set(s.fall);
      fall.material.size = s.key === "winter" ? 0.25 : 0.4;
      fall.position.set(me().x, me().y - 4, me().z);
      const pa = fallGeo.attributes.position;
      for (let i = 0; i < FN; i++) {
        let y = pa.getY(i) - dt * (s.key === "winter" ? 2 : 1.2);
        if (y < 0) y += 25;
        pa.setY(i, y);
        pa.setX(i, pa.getX(i) + Math.sin(t + i) * dt * 0.5);
      }
      pa.needsUpdate = true;
    }
    // everything that lives in Everbough
    if (ctx.cityBuilt()) {
      festHostBuild();
      furnShopBuild();
      guildBuild();
      nightBuild();
      if (festHost) festHost.decor.forEach((d) => d.material.color.set(s.color));
      if (nightMarket) nightMarket.g.visible = isNight();
    }
    festUpdate(dt, t);
    // critters, fossils, rescues, shards, Silverveil
    if (!PH.on && ctx.world() !== "home" && ctx.world() !== "den") {
      spawnCritters(t);
      critterUpdate(t);
      fossilsUpdate(t);
    }
    if (ctx.world() === "city" && ctx.city()) rescueSetup(ctx.city());
    if (!S.mapTpTold && ctx.storyPhase && ctx.storyPhase() >= 9 && !ctx.playing()) {
      S.mapTpTold = true;
      save();
      ctx.say("🗺️ NEW POWER: open the map (M) and Shift-click anywhere in the forest to TELEPORT there!", true);
    }
    bonfireUpdate(t);
    shardsUpdate(t);
    silverUpdate();
    if (ctx.homeNow()) syncFurniture();
  }

  // (test views)
  if (q.get("book")) setTimeout(() => { S.book.bugs.Ladybird = 1; S.book.fish.Minnow = 1; S.book.fossils["Old Claw"] = 1; drawBook(); bookEl.style.display = "flex"; }, 3000);
  if (q.get("photo")) setTimeout(() => { PH.frame = Number(q.get("photo")) % FRAMES.length; togglePhoto(true); drawPhotoUI(); }, 3000);
  if (q.get("furn")) {
    S.furnOwned = {};
    const h = q.get("ownhome");
    if (h) ((S.homes[h] ||= {}).furn = [{ k: "rug", x: 0, z: 0, rot: 0 }, { k: "armchair", x: -2.5, z: -2, rot: 0.6 }, { k: "lamp", x: -4, z: -3.5, rot: 0 }, { k: "plant", x: 3.5, z: -3.5, rot: 0 }, { k: "fireplace", x: 0, z: -5.2, rot: 0 }, { k: "table", x: 1, z: 0.5, rot: 0 }]);
  }

  return {
    update,
    interactable,
    photoCamera,
    photoOn: () => PH.on,
    silverveilOpen,
    bookCompleteCount,
    season,
  };
}
