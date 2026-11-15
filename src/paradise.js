// ------------------------------------------------------------
//  🌺 PARADISE — the secret behind the wall of Dapple's Stable in Golden
//  Hollow (hold F at the wall behind Stablemaster Dapple). Golden sand, a
//  turquoise lagoon, jungle cliffs and waterfalls… and a bazaar of UNUSUAL shops:
//    🦙 The High-Pasture Llama Ranch — buy a llama to ride
//    🐪 The Camel Caravanserai       — buy a camel to ride
//    ⛈️ The Storm Bottler            — bottled blizzards, thunder, rainbows (they really work!)
//    💎 Fossils & Crystals           — amber, geodes, meteorites, a dragon's tooth
//    🍈 The Strange-Fruit Trader     — glow-melons, ember peppers (they really warm you)
//    🧭 The Explorer's Outfitter     — explorer hats you can WEAR
//    ⛲ The Wishing Well of the Old Temple — toss in a coin and make a wish
//  Your ride (pony, llama or camel) is picked in your backpack.
// ------------------------------------------------------------
import * as THREE from "three";
import { cityState, saveCity, registerKeepsake, registerDesign, openCard, toggleWear } from "./cityLife.js";
import { PARADISE } from "./questZones.js";
import { ITEM_POWERS, powerText } from "./powers.js";
import { bagFood, addToBag } from "./food.js";
import { cost, bought } from "./economy.js";
import { fadeThrough } from "./cutscene.js";

// ---------------------------------------------------------------- what's for sale
const EXPLORER_HATS = [
  { id: "hat_explorer", name: "The Explorer's Sun Hat", shape: "sunhat", color: 0xc8b080, trim: 0x6a4a2a, flower: "none", bow: false },
  { id: "hat_captain", name: "The Sea Captain's Hat", shape: "tophat", color: 0x1a2a4a, trim: 0xd8b040, flower: "none", bow: false },
  { id: "hat_ranger", name: "The Jungle Ranger's Beret", shape: "beret", color: 0x3a5a2a, trim: 0x8a6a3a, flower: "none", bow: false },
  { id: "hat_palm", name: "The Palm-Leaf Hat", shape: "sunhat", color: 0xb8a858, trim: 0x3a7a2a, flower: "none", bow: false },
];
for (const h of EXPLORER_HATS) registerDesign({ ...h, kind: "hat", pattern: "plain" });

export const SHOP_STOCK = {
  llama: [
    { key: "llama", icon: "🦙", name: "Atlas, a Mountain Llama", price: 160, mount: true, desc: "RIDE HIM: Caps Lock (pick your ride in your backpack). Bred in the high passes — sure-footed on any cliff path." },
    { key: "llamabells", icon: "🔔", name: "Llama Trail Bells", price: 28, desc: "hand-forged bronze, worn by the old caravan llamas" },
  ],
  camel: [
    { key: "camel", icon: "🐪", name: "Dune the Camel", price: 180, mount: true, desc: "RIDE HER: Caps Lock (pick your ride in your backpack). She has crossed the great deserts twice." },
    { key: "camelrug", icon: "🧶", name: "A Woven Saddle Rug", price: 30, desc: "woven by the desert nomads, in the colours of the dunes" },
  ],
  // ⛈️ bottled weather — each one you open REALLY does it (once): open it from your backpack
  weather: [
    { key: "blizzard", icon: "❄️", name: "A Blizzard in a Bottle", price: 40, use: true, desc: "uncork it to unleash a real blizzard (one use)" },
    { key: "thunder", icon: "⚡", name: "Thunder in a Bottle", price: 45, use: true, desc: "uncork it to call down a thunderstorm (one use)" },
    { key: "rainbow", icon: "🌈", name: "A Rainbow in a Jar", price: 35, use: true, desc: "open it and a rainbow spans the whole sky (one use)" },
    { key: "sunset", icon: "🌅", name: "A Sunset in a Jar", price: 25, use: true, desc: "open it to turn the sky to sunset, whatever the hour (one use)" },
  ],
  rocks: [
    { key: "amberbeetle", icon: "🟠", name: "Amber with a Beetle Inside", price: 30, desc: "an ancient beetle, sealed in golden resin" },
    { key: "geode", icon: "🪨", name: "A Thunder-Egg Geode", price: 26, desc: "split open to show a cave of violet crystal" },
    { key: "meteorite", icon: "☄️", name: "A Meteorite Fragment", price: 55, desc: "iron from the sky, pitted by its fall through the air" },
    { key: "dragontooth", icon: "🦷", name: "A Petrified Dragon Tooth", price: 70, desc: "from a dragon older than the forests themselves" },
  ],
  sweets: [
    { key: "glowmelon", icon: "🍈", name: "A Glow-Melon", price: 8, food: true, heal: 25, desc: "cut it open and the flesh glows softly blue" },
    { key: "emberpepper", icon: "🌶️", name: "Ember Peppers", price: 10, food: true, heal: 20, warm: true, desc: "one bite and you're warm to the bone — even in a blizzard" },
    { key: "cloudberry", icon: "🫐", name: "Cloud-Berries", price: 9, food: true, heal: 25, desc: "they grow on the cliff tops and weigh almost nothing" },
    { key: "dragonfruit", icon: "🐉", name: "Dragon Fruit", price: 14, food: true, heal: 45, desc: "the rarest fruit of the southern islands" },
  ],

  // 🛒 the Underground Market (a secret place under Golden Hollow's street — knock 3 times on the grate)
  under: [
    { key: "smugglermap", icon: "🗺️", name: "A Smuggler's Map of the Under-Roads", price: 60, desc: "every hidden tunnel under the six cities, inked in secret" },
    { key: "skeletonkey", icon: "🗝️", name: "The Thieves' Skeleton Key", price: 85, desc: "it fits locks it has no business fitting" },
    { key: "dragonegg", icon: "🥚", name: "An Unhatched Dragon Egg", price: 140, desc: "warm to the touch — something inside is moving" },
    { key: "thunderfeather", icon: "🪶", name: "A Thunderbird Feather", price: 75, desc: "it crackles with static and makes your paws feel light" },
    { key: "stormlantern", icon: "🏮", name: "A Smuggler's Storm-Lantern", price: 50, desc: "it never goes out, whatever the weather" },
    { key: "night", icon: "🌌", name: "A Night in a Jar", price: 45, use: true, desc: "uncork it and night falls at once, every star out (one use)" },
  ],
  hats: EXPLORER_HATS.map((h, i) => ({ key: h.id, icon: "🎩", name: h.name, price: 24 + i * 4, wear: true, desc: "WEAR IT: proper explorer's kit (wear it anywhere)" })),
};
const POW = {
  smugglermap: ["luck", 0.08], skeletonkey: ["luck", 0.06], dragonegg: ["warm", 0.4], thunderfeather: ["jump", 0.08], stormlantern: ["warm", 0.3],
  llamabells: ["luck", 0.04], camelrug: ["warm", 0.3], amberbeetle: ["luck", 0.06], geode: ["jump", 0.05], meteorite: ["air", 0.1], dragontooth: ["jump", 0.08], wishpearl: ["luck", 0.1],
};
for (const list of Object.values(SHOP_STOCK)) for (const it of list) if (!it.food && !it.wear && !it.use) registerKeepsake(it.key, it.icon, it.name);
registerKeepsake("wishpearl", "🫧", "The Wishing Pearl (from the old temple well in Paradise)");
for (const [k, [type, n]] of Object.entries(POW)) ITEM_POWERS[k] = { type, n };

export const MOUNTS = [
  { key: "horse", icon: "🐴", name: "Buttercup the Pony" },
  { key: "llama", icon: "🦙", name: "Atlas, a Mountain Llama" },
  { key: "camel", icon: "🐪", name: "Dune the Camel" },
];

// ---------------------------------------------------------------- the animals (also what you ride)
const Mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
function legsAndTail(g, coat, legH, spread, tailY, tailZ) {
  const legs = [];
  for (const [lx, lz] of [[-spread, 0.45], [spread, 0.45], [-spread, -0.45], [spread, -0.45]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, legH, 0.13), Mat(coat));
    leg.geometry.translate(0, -legH / 2, 0);
    leg.position.set(lx, legH + 0.03, lz);
    g.add(leg);
    legs.push(leg);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), Mat(coat));
  tail.geometry.translate(0, -0.17, 0);
  tail.position.set(0, tailY, tailZ);
  tail.rotation.x = 0.4;
  g.add(tail);
  g.userData = { legs, tail };
}
export function buildLlama(coat = 0xf4ecdc) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 1.2), Mat(coat));
  body.position.y = 0.9;
  const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), Mat(coat));
  fluff.scale.set(0.8, 0.7, 1.4);
  fluff.position.y = 0.95;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.26), Mat(coat));
  neck.position.set(0, 1.55, 0.5);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.45), Mat(coat));
  head.position.set(0, 2.05, 0.66);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.5), Mat(0xd85a8a));
  saddle.position.set(0, 1.2, -0.05);
  g.add(body, fluff, neck, head, saddle);
  for (const sx of [-0.09, 0.09]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), Mat(coat));
    ear.position.set(sx, 2.3, 0.6);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), Mat(0x1a1a1a));
    eye.position.set(sx * 1.5, 2.1, 0.85);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), Mat(sx < 0 ? 0xff5a8a : 0x5ad8ff));
    pom.position.set(sx * 1.2, 2.42, 0.6);
    g.add(ear, eye, pom);
  }
  legsAndTail(g, coat, 0.66, 0.18, 1.05, -0.62);
  return g;
}
export function buildCamel(coat = 0xd8a868) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 1.4), Mat(coat));
  body.position.y = 1.05;
  const rug = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.6), Mat(0xb83a3a));
  rug.position.set(0, 1.34, -0.02);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), Mat(coat));
  neck.position.set(0, 1.3, 0.8);
  neck.rotation.x = 0.7;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.5), Mat(coat));
  head.position.set(0, 1.62, 1.08);
  g.add(body, rug, neck, head);
  for (const sx of [-0.09, 0.09]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), Mat(coat));
    ear.position.set(sx, 1.8, 0.95);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), Mat(0x1a1a1a));
    eye.position.set(sx * 1.4, 1.68, 1.22);
    g.add(ear, eye);
  }
  legsAndTail(g, coat, 0.8, 0.18, 1.15, -0.72);
  return g;
}

// ---------------------------------------------------------------- the place
export function initParadise(ctx) {
  // ctx: { world(), city(), goCity, placePlayer, mouseRig, say, chime, buildThistle, packAdd? }
  const S = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  let builtFor = null;
  const animals = [];
  // (things from the first version of Paradise are gone — pet rocks, silly hats, old jars: your coins come back)
  {
    const s0 = S();
    const OLD = { rockgravel: 8, rockpebbles: 15, rockiggy: 30, rocksir: 45, rainbowjar: 40, thunderbottle: 45, pocketsnow: 35, sunsetjam: 25, silly_upside: 24, silly_flowerpot: 28, silly_pancake: 32, silly_rainbow: 36 };
    let back = 0;
    for (const [k, c] of Object.entries(OLD)) if (s0.owned && s0.owned[k]) {
      delete s0.owned[k];
      for (const w of Object.values(s0.wornBy || {})) for (const slot of Object.keys(w || {})) if (w[slot] === k) delete w[slot];
      back += c;
    }
    if (back) {
      s0.coins = (s0.coins || 0) + back;
      saveCity();
    }
  }

  function dress(Z) {
    if (builtFor === Z) return;
    builtFor = Z;
    // keepers behind their counters, and a llama + a camel waiting by their tents
    for (const sh of PARADISE.shops) {
      const A = Z.shopAt[sh.key];
      if (sh.keeper && ctx.buildThistle) {
        const tunic = { llama: 0xb8562a, camel: 0xc8902a, weather: 0x2a4a7a, rocks: 0x5a4a6a, sweets: 0x2a7a6a, hats: 0x5a6a3a }[sh.key];
        const k = ctx.buildThistle({ tunicColor: tunic, hoodColor: tunic, pack: false });
        k.position.set(A.keeperAt.x, Z.height(A.keeperAt.x, A.keeperAt.z), A.keeperAt.z);
        k.rotation.y = A.face;
        Z.group.add(k);
      }
    }
    for (const [build, sh, side] of [[buildLlama, "llama", 1], [buildCamel, "camel", -1]]) {
      const S0 = PARADISE.shops.find((x) => x.key === sh);
      const x = S0.x + side * 5, z = S0.z - 4;
      const m = build();
      m.scale.setScalar(1.6);
      m.position.set(x, Z.height(x, z), z);
      m.rotation.y = side * 0.8;
      Z.group.add(m);
      Z.colliders.push({ x, z, r: 1.3 });
      animals.push(m);
    }
  }

  function shopCard(key, msg = "") {
    const sh = PARADISE.shops.find((x) => x.key === key) || { key, name: "The Smugglers' Counter", keeper: "a one-eyed rat in a long coat", icon: "🛒" };
    const s = S();
    const list = SHOP_STOCK[key];
    const price = (it) => cost(it.price, it.key);
    const has = (it) => !it.food && !it.use && s.owned && s.owned[it.key];
    openCard(
      `<div class="card"><h3>${sh.icon} ${sh.name}</h3><div class="coins">${sh.keeper} · 🪙 ${s.coins}</div>
      ${list.map((it) => `<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}<small>${it.desc}${!it.food && powerText(it.key) ? ` <b>${powerText(it.key)}</b>` : ""}${it.food ? ` (+${it.heal} ❤️)` : ""}</small></span><button data-buy="${it.key}" ${has(it) || s.coins < price(it) ? "disabled" : ""}>${has(it) ? "owned" : "🪙 " + price(it)}</button></div>`).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — leave${key === "llama" || key === "camel" ? " · switch who you ride in your backpack (B)" : ""}</div></div>`,
      (el) => el.querySelectorAll("button[data-buy]").forEach((b) => (b.onclick = () => {
        const it = list.find((x) => x.key === b.dataset.buy);
        const p = price(it);
        if (!it || has(it) || s.coins < p) return;
        s.coins -= p;
        bought(it.key);
        let m = `You bought ${it.icon} ${it.name}!`;
        if (it.food) m += bagFood(it);
        else if (it.use) m += addToBag(it.name, 1) ? ` ${it.icon} It's in your backpack — open it whenever you like (B → ✨ use).` : " 🎒 Your bag is too full!";
        else {
          (s.owned ||= {})[it.key] = true;
          if (it.mount) {
            s.mount = it.key;
            m = `${it.icon} ${it.name} is YOURS! Press Caps Lock to ride. (Switch rides any time in your backpack.)`;
          }
          if (it.wear) {
            toggleWear(it.key);
            m = `You're wearing ${it.name}! 🎩`;
          }
          if (powerText(it.key)) m += ` ${powerText(it.key)}!`;
        }
        saveCity();
        ctx.chime();
        shopCard(key, m);
      }))
    );
  }

  function wish() {
    const s = S();
    const p = cost(5, "wish");
    if (s.coins < p) return ctx.say("⛲ You need a coin for the well.");
    s.coins -= p;
    bought("wish");
    const r = Math.random();
    let m;
    if (!(s.owned || {}).wishpearl && r < 0.12) {
      (s.owned ||= {}).wishpearl = true;
      m = "⛲ Deep in the well something glimmers… the water swirls up and leaves a shimmering pearl on the stones! 🫧 The Wishing Pearl is yours!";
    } else if (r < 0.45) {
      const got = p * 3;
      s.coins += got;
      m = `⛲ The well echoes, and the water throws back 🪙 ${got} coins. Lucky!`;
    } else m = ["⛲ The coin falls a long way before you hear it land.", "⛲ The old temple well is silent. Perhaps another time.", "⛲ Your coin sinks into the dark water. The jungle goes quiet for a moment.", "⛲ Far below, something glints — then is gone."][Math.floor(Math.random() * 4)];
    saveCity();
    ctx.chime();
    ctx.say(m, true);
  }

  function interactable() {
    // 🛒 down in the Underground Market: the smugglers' counter in the middle
    if (here() === "pr_market" && near(0, 3, 3.6)) return { label: "browse the smugglers' counter 🛒", act: () => shopCard("under") };
    if (here() !== "paradise") return null;
    const Z = ctx.city();
    dress(Z);
    const D = PARADISE.door;
    if (near(D.x, D.z, 2.4)) return { label: "go back through the secret door to Dapple's Stable 🚪", act: () => fadeThrough(() => {
      ctx.goCity("golden");
      ctx.placePlayer(36, 68, Math.PI);
    }, 0.6) };
    for (const sh of PARADISE.shops) {
      const A = Z.shopAt[sh.key];
      if (!near(A.x, A.z, 2.8)) continue;
      if (sh.key === "wish") return { label: `toss a coin into the old temple well ⛲ (🪙 ${cost(5, "wish")})`, act: wish };
      return { label: `shop at ${sh.name} ${sh.icon}`, act: () => shopCard(sh.key) };
    }
    return null;
  }
  function update(dt) {
    if (here() !== "paradise") return;
    dress(ctx.city());
    const t = performance.now() / 1000;
    animals.forEach((a, i) => {
      a.userData.tail.rotation.z = Math.sin(t * 2 + i) * 0.3;
      a.position.y = ctx.city().height(a.position.x, a.position.z);
    });
  }
  return { interactable, update };
}
