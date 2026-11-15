// ------------------------------------------------------------
//  🔍  HIDDEN SECRETS — for those who look closely, notice things, and
//  talk to everyone. (The Idea Book's "Hidden Secrets" chapter, made real.)
//
//  How you find them:
//    🔍 LOOK  — stand by something odd and hold F (look closely) a moment
//    ✋ E     — some you just have to try (a bookcase, a bell, a snowman…)
//    🎶 TUNES — some answer to the right song on your reed flute (U)
//    🌙 TIME  — some only appear at night, in the misty morning, in winter
//    👂 TALK  — the Gossips in each city tell rumours that point the way
//  Every secret you find goes in the 🔍 Secrets page of your Collection
//  Book (N). Find them all to become a SECRET SEEKER.
// ------------------------------------------------------------
import * as THREE from "three";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { ITEM_POWERS } from "./powers.js";
import { SECRET_ROOMS, HALL } from "./questZones.js";
import { PLACES, PLACE_BY_ID, buildEntrance } from "./secretPlaces.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

// ---------------------------------------------------------------- the treasures you can find
const KEEPS = [
  ["oldmarble", "🔮", "Grandmother's Glass Marble", "luck", 0.05],
  ["silverthimble", "🪡", "A Silver Thimble", "heal", 0.06],
  ["secretbook", "📕", "The Book of Secrets", "luck", 0.1],
  ["oldschoolbell", "🔔", "The First School Bell", "jump", 0.06],
  ["heartwood", "🌰", "The Heartwood Acorn", "grow", 0.2],
  ["moonmirror", "🪞", "The Moon Mirror", "air", 0.15],
  ["owlquill", "🪶", "The Night Owl's Quill", "luck", 0.06],
  ["foglantern", "🏮", "The Fog Lantern", "warm", 0.4],
  ["treasurecompass", "🧭", "The Treasure-Hunter's Compass", "luck", 0.12],
  ["attictoy", "🧸", "A Forgotten Teddy Bear", "heal", 0.08],
  ["shipinbottle", "⛵", "A Ship in a Bottle", "fish", 0.1],
  ["snowfoxgift", "🦊", "The Snow Fox's Gift", "warm", 0.3],
  ["iceheart", "💎", "The Heart of the Ice", "warm", 0.4],
  ["snowmanscarf", "🧣", "The Snowman's Scarf", "warm", 0.3],
  ["springpebble", "🪨", "A Warm Spring Pebble", "heal", 0.1],
  ["grandpasled", "🛷", "Grandpa Frost's Old Sled", "sprint", 0.08],
  ["iciclechime", "🎐", "The Icicle Chime", "luck", 0.05],
  ["owleye", "🟠", "The Owl's Amber Eye", "fish", 0.08],
  ["giantmitten", "🧤", "A Snow Giant's Mitten", "warm", 0.5],
  ["silverblade", "⛸️", "A Silver Skate Blade", "jump", 0.05],
  ["seekercandle", "🕯️", "The Seeker's Candle (it flickers near secrets)", "luck", 0.03],
  ["seekerbadge", "🏅", "The Secret Seeker's Badge", "luck", 0.15],
];
for (const p of PLACES) KEEPS.push(p.key); // (🗝️ the Even More Secret Places' treasures)
for (const [k, icon, name, type, n] of KEEPS) {
  registerKeepsake(k, icon, name);
  ITEM_POWERS[k] = { type, n };
}

// ---------------------------------------------------------------- the secrets
// where: "forest" | a city id · at(): {x,z} · how: look | e | special
const SECRETS = [
  // 🌳 the old forest
  { id: "knothole", where: "forest", name: "The Coin-Filled Knothole", icon: "🌳", how: "look", hint: "An old stump near your cottage has a knothole that glints…", reward: { coins: 40 } },
  { id: "loosestone", where: "forest", name: "Under the Loose Stone", icon: "🪨", how: "look", hint: "One stone by the school wobbles when you step on it.", reward: { keep: "oldmarble" } },
  { id: "puddle", where: "forest", name: "The Glint in the Puddle", icon: "💧", how: "look", hint: "Something shiny lies at the bottom of a puddle west of your cottage.", reward: { keep: "silverthimble" } },
  { id: "readingroom", where: "forest", name: "The Book That Isn't a Book", icon: "📚", how: "special", hint: "In the school's little library, one red book won't come off the shelf…", reward: { keep: "secretbook", coins: 60 } },
  { id: "bell", where: "forest", name: "The Bell's Secret Pattern", icon: "🔔", how: "special", hint: "Ring the school bell THREE times, quickly — something below answers.", reward: { keep: "oldschoolbell", coins: 50 } },
  { id: "oak", where: "forest", name: "The Song That Opens the Oak", icon: "🎶", how: "special", hint: "Play the Old Oak's tune — 2, 4, 2, 1 — on your reed flute beside the oldest oak.", reward: { keep: "heartwood", coins: 60 } },
  { id: "pond", where: "forest", name: "The Still Pond's Island", icon: "🪞", how: "special", hint: "Look into the perfectly still pond (hold F). What does it show?", reward: { keep: "moonmirror" } },
  { id: "nightdoor", where: "forest", name: "The Door That Comes Out at Night", icon: "🌙", how: "special", hint: "A crooked tree in the forest has a little door — but only at NIGHT.", reward: { keep: "owlquill", coins: 80 } },
  { id: "fog", where: "forest", name: "The Village in the Fog", icon: "🌫️", how: "special", hint: "On misty MORNINGS, a patch of fog near the school hides a path…", reward: { keep: "foglantern", coins: 60 } },
  { id: "treasure", where: "forest", name: "X Marks the Spot", icon: "🗺️", how: "special", hint: "Six scraps of an old map are hidden round the cities. Put them together!", reward: { keep: "treasurecompass", coins: 250 } },
  // 🏙️ the cities
  { id: "cat", where: "golden", name: "Follow the Shop Cat", icon: "🐈", how: "special", hint: "Biscuit, the General Store's cat, naps by the door. Pop into the store and back out — then watch where she goes…", reward: { keep: "attictoy", coins: 40 } },
  { id: "bottle", where: "reedmere", name: "Messages in Bottles", icon: "💌", how: "special", hint: "A bottle washes up on Reedmere's shore — a new one each day.", reward: { keep: "shipinbottle", coins: 120 } },
  { id: "backroom_reedmere", where: "reedmere", name: "Reedmere's Back Room", icon: "🗝️", how: "special", hint: "Chat with a Reedmere shopkeeper again and again…", reward: {} },
  { id: "backroom_golden", where: "golden", name: "Golden Hollow's Back Room", icon: "🗝️", how: "special", hint: "Chat with a Golden Hollow shopkeeper again and again…", reward: {} },
  { id: "backroom_frostpine", where: "frostpine", name: "Frostpine's Back Room", icon: "🗝️", how: "special", hint: "Chat with a Frostpine shopkeeper again and again…", reward: {} },
  // ❄️ FROSTPINE — a city full of secrets
  { id: "fp_tracks", where: "frostpine", name: "The Mysterious Tracks", icon: "🐾", how: "special", hint: "Little tracks in the snow lead away from the square. Follow them to the end.", reward: { keep: "snowfoxgift", coins: 40 } },
  { id: "fp_icecave", where: "frostpine", name: "Behind the Frozen Waterfall", icon: "🧊", how: "special", hint: "Look closely at the frozen waterfall. Is that a crack?", reward: { keep: "iceheart", coins: 80 } },
  { id: "fp_snowman", where: "frostpine", name: "The Snowman's Secret", icon: "⛄", how: "special", hint: "Give the lonely snowman a few friendly pats.", reward: { keep: "snowmanscarf", coins: 30 } },
  { id: "fp_icefish", where: "frostpine", name: "The Fish Frozen in Time", icon: "🐟", how: "look", hint: "Something is frozen inside a big block of ice by the market.", reward: { coins: 40, note: "A silvery fish, frozen mid-leap — a hundred winters old. Some say it winks." } },
  { id: "fp_hotspring", where: "frostpine", name: "The Hidden Hot Spring", icon: "♨️", how: "e", hint: "Steam rises from somewhere deep in the pines…", reward: { keep: "springpebble", heal: true } },
  { id: "fp_sled", where: "frostpine", name: "Grandpa Frost's Old Sled", icon: "🛷", how: "look", hint: "A runner pokes out of a snowdrift on the edge of town.", reward: { keep: "grandpasled" } },
  { id: "fp_runestone", where: "frostpine", name: "The Rune Stone", icon: "🪨", how: "look", hint: "A stone half-buried in the snow is carved with old runes.", reward: { note: "The runes read: “Ring the icicles HIGH, then LOW, then MIDDLE.”" } },
  { id: "fp_icicles", where: "frostpine", name: "The Icicle Chimes", icon: "🎐", how: "special", hint: "Three great icicles hang near the rune stone. Ring them in the right order.", reward: { keep: "iciclechime", coins: 50 } },
  { id: "fp_owls", where: "frostpine", name: "The Watching Owls", icon: "🦉", how: "special", hint: "Three carved owls turn their heads when you're not looking. What are they all looking at?", reward: { keep: "owleye", coins: 60 } },
  { id: "fp_mitten", where: "frostpine", name: "The Snow Giant's Mitten", icon: "🧤", how: "look", hint: "Something ENORMOUS and woolly is half-buried in a drift.", reward: { keep: "giantmitten" } },
  { id: "fp_hollowpine", where: "frostpine", name: "The Hollow Pine", icon: "🌲", how: "look", hint: "One old pine is hollow inside. Peek into its knothole.", reward: { coins: 50 } },
  { id: "fp_skate", where: "frostpine", name: "The Lost Skate Blade", icon: "⛸️", how: "look", hint: "Something silver glints in the snow by the path to the Frozen Lake.", reward: { keep: "silverblade" } },
];
// 🌺 the wall behind Stablemaster Dapple → Paradise
SECRETS.push({ id: "paradise", where: "golden", name: "The Wall Behind the Stablemaster", icon: "🌺", how: "special", hint: "In Dapple's Stable in Golden Hollow, look closely at the wall behind Stablemaster Dapple…", reward: { coins: 100 } });
// 🗝️ + the nineteen Even More Secret Places
for (const p of PLACES) SECRETS.push({ id: p.id, where: p.where, name: p.name, icon: p.icon, how: "special", hint: p.hint, reward: { keep: p.key[0], coins: p.coins } });
const MAP_SCRAPS = [
  { where: "reedmere", dx: 14, dz: -10 }, { where: "reedmere", dx: -18, dz: 22 },
  { where: "golden", dx: 12, dz: 8 }, { where: "golden", dx: -26, dz: -14 },
  { where: "frostpine", dx: -12, dz: 12 }, { where: "silverveil", dx: 10, dz: -8 },
];
const RUMOURS = {
  readingroom: "“They say there's a book in the school library that's stuck to the shelf. Stuck on PURPOSE, if you ask me.”",
  bell: "“My gran used to say: ring the school bell three times quick, and the ground itself rings back.”",
  oak: "“The oldest oak in the forest knows a song. Two, four, two, one — that's how it goes, I think…”",
  pond: "“There's a pond so still it shows you things that aren't there. Or are they?”",
  nightdoor: "“I saw a little door in a crooked tree — at NIGHT. Next morning? Gone.”",
  fog: "“Some misty mornings, there's a whole village in the fog by the school. I've heard bells there.”",
  treasure: "“An old map got torn up and scattered round the cities. Find all six bits and you'll be rich!”",
  cat: "“Biscuit the shop cat disappears every afternoon. Where DOES she go?”",
  bottle: "“Bottles wash up on Reedmere's beach, with letters inside. Someone out there is writing a story.”",
  fp_tracks: "“Something small and white leaves tracks round Frostpine at night. A fox, maybe…”",
  fp_icecave: "“That frozen waterfall in Frostpine — I swear I heard an echo BEHIND it.”",
  fp_snowman: "“Frostpine's snowman looks so lonely. Somebody ought to give him a pat.”",
  fp_hotspring: "“Somewhere in Frostpine's pines there's water that's WARM. In winter!”",
  fp_icicles: "“The old rune stone in Frostpine tells you how to play the icicles, if you can read it.”",
  fp_owls: "“Those wooden owls in Frostpine move. I'm sure of it. Whenever I look away…”",
  fp_mitten: "“They say a Snow Giant passed through Frostpine once — and dropped something.”",
};
RUMOURS.paradise = "“Old Dapple's stable is bigger on the inside than the outside, my granny said. Something about the wall behind the counter…”";
for (const p of PLACES) RUMOURS[p.id] = p.rumour;

export function initSecrets(ctx) {
  // ctx: { world(), city(), outsideGroup, terrainHeight, isClear, isWater, den, school(), dayTime(), season(), say, chime,
  //        goCity, placePlayer, goOutside, addToPack, mouseRig, camera, playing(), heal(n), ready() }
  const S = () => cityState();
  const save = () => saveCity();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const found = (id) => !!(S().secrets || {})[id];
  const day = () => S().days || 0;
  const SEC = Object.fromEntries(SECRETS.map((s) => [s.id, s]));

  function reward(sec) {
    const s = S();
    const R = sec.reward || {};
    const bits = [];
    if (R.coins) {
      s.coins = (s.coins || 0) + R.coins;
      bits.push(`🪙 +${R.coins}`);
    }
    if (R.keep) {
      (s.owned ||= {})[R.keep] = true;
      const K = KEEPS.find((k) => k[0] === R.keep);
      bits.push(`${K[1]} ${K[2]}`);
    }
    if (R.heal) ctx.heal(100);
    return bits.join(" · ");
  }
  function discover(id, extra = "") {
    if (found(id)) return;
    const sec = SEC[id];
    const s = S();
    (s.secrets ||= {})[id] = day() + 1;
    const got = reward(sec);
    save();
    ctx.chime();
    const n = SECRETS.filter((x) => found(x.id)).length;
    ctx.say(`🔍 SECRET FOUND! ${sec.icon} ${sec.name}${extra ? " — " + extra : ""}${sec.reward && sec.reward.note ? " " + sec.reward.note : ""}${got ? " · " + got : ""} (${n}/${SECRETS.length} secrets)`, true);
    if (n >= SECRETS.length && !(s.owned || {}).seekerbadge) {
      s.owned.seekerbadge = true;
      s.coins += 500;
      save();
      setTimeout(() => ctx.say("🏅 You've found EVERY secret in the land! You are a true SECRET SEEKER. (+🪙 500 · The Secret Seeker's Badge)", true), 3500);
    }
  }
  window.addEventListener("ww-secret", (e) => discover(e.detail.id)); // (other parts of the game can report secrets)

  // ---------------------------------------------------------------- 🔍 looking closely (hold F)
  let fHeld = false;
  window.addEventListener("keydown", (e) => e.code === "KeyF" && (fHeld = true));
  window.addEventListener("keyup", (e) => e.code === "KeyF" && (fHeld = false));
  let lookT = 0;
  let lookLatch = false;
  // 💙 the glowing blue frame round the thing you're looking at
  const frame = document.createElement("div");
  frame.id = "lookFrame";
  frame.style.cssText = "position:fixed;z-index:40;pointer-events:none;display:none;border:3px solid #8fdcff;border-radius:14px;box-shadow:0 0 18px 4px rgba(90,190,255,.85), inset 0 0 18px 2px rgba(90,190,255,.6);transform:translate(-50%,-50%);transition:opacity .2s";
  document.body.appendChild(frame);
  /** the box round the thing you're looking at (for the glowing blue frame) */
  function frameBox(L) {
    const groundAt = (x, z) => (here() === "forest" ? ctx.terrainHeight(x, z) : ctx.city() ? ctx.city().height(x, z) : 0);
    const at = (P, r, h, up = 0) => (P ? { x: P.x, z: P.z, y: groundAt(P.x, P.z) + up, r, h } : null);
    if (L.place) {
      const E = placesHere().find((x) => x.p.id === L.id);
      if (!E) return null;
      const S = { easel: [1, 2.3], well: [1.3, 3.2], bigtree: [2.2, 7], burrow: [2.3, 1.8], torch: [0.5, 1.2, 2], planks: [1.7, 0.4], lighthouse: [2.6, 7], shell: [2.1, 2.6], iceplate: [3, 0.4], cave: [3.6, 4], mirror: [0.9, 3.1], clock: [1.6, 9], owltree: [1.6, 4], doors: [4.5, 3.4], littledoor: [0.5, 1.2], globe: [1, 3], stones: [3.6, 1.8], mushrooms: [3, 0.8], grate: [0.8, 0.2], bircharch: [1.8, 5.5], rope: [0.7, 4], crevice: [1.2, 3.6], hedgegap: [1.8, 2.4], camp: [1.1, 3], seacave: [2.2, 2], rathole: [1.2, 1.4] }[E.p.entrance] || [1, 1.5];
      const g = E.e.g.position;
      return { x: g.x, z: g.z, y: g.y + (S[2] || 0), r: S[0], h: S[1] };
    }
    const sz = {
      knothole: [0.9, 1.5], loosestone: [0.6, 0.6], puddle: [1.1, 0.35], fp_icefish: [1, 1.5], fp_sled: [2.4, 1.2], fp_runestone: [1, 1.9],
      fp_mitten: [2.4, 1.6], fp_hollowpine: [1, 3.2], fp_skate: [0.5, 0.35], fp_tracks: [1.9, 1.7],
    }[L.id];
    if (L.id === "pond") return at(spots.pond, 3, 1.2);
    if (L.id === "paradise") return { x: 0, z: -6.2, y: 0.2, r: 1.8, h: 3.4 };
    if (L.id === "fp_icecave") return at(spots.fp_icecave, 1.4, 2.4);
    return sz ? at(spots[L.id], sz[0], sz[1]) : null;
  }
  /** where the secret you're looking at is (for the frame + the camera) */
  function focusPos(L) {
    if (!L) return null;
    if (L.place) {
      const E = placesHere().find((x) => x.p.id === L.id);
      return E ? E.e.focus : null;
    }
    if (L.id === "paradise") return { x: 0, y: 1.8, z: -6.2 };
    if (L.id === "pond") return { x: spots.pond.x, y: ctx.terrainHeight(spots.pond.x, spots.pond.z) + 0.4, z: spots.pond.z };
    const list = here() === "forest" ? forest && forest.glints : props[here()] && props[here()].glints;
    const g = list && list.find((x) => x.id === L.id);
    if (g) return { x: g.g.position.x, y: g.g.position.y, z: g.g.position.z };
    const P = spots[L.id];
    const c = ctx.city();
    return P && c ? { x: P.x, y: c.height(P.x, P.z) + 0.8, z: P.z } : null;
  }

  // ---------------------------------------------------------------- placing things
  // forest spots are worked out from your cottage and the school; city spots from where you arrive
  const freeForest = (x, z, r = 1.6) => {
    for (let k = 0; k < 30; k++) {
      const a = k * 2.4, d = k * 0.9;
      const xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d;
      if (ctx.isClear(xx, zz, r) && !ctx.isWater(xx, zz)) return { x: xx, z: zz };
    }
    return { x, z };
  };
  const freeCity = (c, x, z, r = 1.6) => {
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = k * 1.1;
      const xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d;
      if (Math.hypot(xx, zz) > 100) continue;
      if (c.waterAt(xx, zz) !== null) continue;
      if (c.colliders.some((cc) => Math.hypot(xx - cc.x, zz - cc.z) < cc.r + r)) continue;
      return { x: xx, z: zz };
    }
    return { x, z };
  };
  const spots = {}; // id → {x,z} (in its own place)
  const props = {}; // where → { group, objs }
  function hintGlint(group, x, y, z, color = 0xfff4c0) {
    // a tiny sparkle — you only notice it when you're close
    const g = glow(color, 0.7, 0);
    g.position.set(x, y, z);
    group.add(g);
    return g;
  }

  // ---------------------------------------------------------------- 🌳 the forest's secrets
  let forest = null;
  function buildForest() {
    if (forest || !ctx.ready()) return;
    const D = ctx.den;
    const Sc = ctx.school();
    if (!Sc) return;
    const G = ctx.outsideGroup;
    const H = ctx.terrainHeight;
    const F = { glints: [] };
    // the knothole stump
    spots.knothole = freeForest(D.x + 27, D.z - 33);
    {
      const P = spots.knothole;
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 1.4, 9), M(0x6a4a2c));
      stump.position.set(P.x, H(P.x, P.z) + 0.7, P.z);
      ctx.addSolid(P.x, P.z, 0.85); // (solid)
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), new THREE.MeshBasicMaterial({ color: 0x1a0e06 }));
      hole.position.set(P.x, H(P.x, P.z) + 0.9, P.z + 0.86);
      G.add(stump, hole);
      F.glints.push({ id: "knothole", g: hintGlint(G, P.x, H(P.x, P.z) + 0.95, P.z + 0.9) });
    }
    // the loose stone by the school
    spots.loosestone = freeForest(Sc.x - 21, Sc.z + 26);
    {
      const P = spots.loosestone;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), M(0x9a9aa0));
      st.scale.y = 0.5;
      st.position.set(P.x, H(P.x, P.z) + 0.2, P.z);
      G.add(st);
      F.glints.push({ id: "loosestone", g: hintGlint(G, P.x, H(P.x, P.z) + 0.5, P.z) });
    }
    // the puddle
    spots.puddle = freeForest(D.x - 34, D.z - 9);
    {
      const P = spots.puddle;
      const pud = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16), new THREE.MeshStandardMaterial({ color: 0x5a7a9a, roughness: 0.05, metalness: 0.5 }));
      pud.rotation.x = -Math.PI / 2;
      pud.position.set(P.x, H(P.x, P.z) + 0.04, P.z);
      G.add(pud);
      F.glints.push({ id: "puddle", g: hintGlint(G, P.x + 0.3, H(P.x, P.z) + 0.15, P.z, 0xdfe8ff) });
    }
    // the school's bookcase and bell (their spots, relative to the school)
    spots.readingroom = { x: Sc.x - 6.4, z: Sc.z - 2.6 };
    spots.bell = { x: Sc.x + 18.8, z: Sc.z - 3.4 };
    spots.trapdoor = freeForest(Sc.x + 16, Sc.z + 3, 1.2);
    {
      const P = spots.trapdoor;
      const td = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.6), M(0x5a3e24));
      td.position.set(P.x, H(P.x, P.z) + 0.04, P.z);
      td.visible = false;
      G.add(td);
      F.trapdoor = td;
    }
    // 🌳 the oldest oak
    spots.oak = freeForest(D.x + 40, D.z + 25, 3.5);
    {
      const P = spots.oak;
      const y = H(P.x, P.z);
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.6, 9, 10), M(0x5a3e24));
      trunk.position.y = 4.5;
      g.add(trunk);
      for (let k = 0; k < 6; k++) {
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 3.4, 6), M(0x5a3e24));
        const a = (k / 6) * Math.PI * 2;
        root.position.set(Math.cos(a) * 2.4, 0.5, Math.sin(a) * 2.4);
        root.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
        g.add(root);
      }
      for (let k = 0; k < 7; k++) {
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.6, 5, 6), M(0x5a3e24));
        br.position.set(0, 8.5, 0);
        br.rotation.set(Math.sin(k) * 0.9, k, Math.cos(k) * 0.9);
        br.translateY(2.2);
        g.add(br);
      }
      for (let k = 0; k < 9; k++) {
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), M(0x3a6a2e));
        crown.position.set(Math.cos(k) * 3.6, 11 + (k % 3), Math.sin(k) * 3.6);
        g.add(crown);
      }
      const door = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      door.position.set(0, 0.05, 2.55);
      door.visible = false;
      g.add(door);
      F.oakDoor = door;
      g.position.set(P.x, y, P.z);
      G.add(g);
      ctx.addSolid && ctx.addSolid(P.x, P.z, 2.6);
      spots.oakDoor = { x: P.x, z: P.z + 3.4 };
    }
    // 🪞 the still pond
    spots.pond = freeForest(D.x - 35, D.z - 20, 6);
    {
      const P = spots.pond;
      const y = H(P.x, P.z);
      const pond = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: 0.02, metalness: 0.7 }));
      pond.rotation.x = -Math.PI / 2;
      pond.position.set(P.x, y + 0.05, P.z);
      G.add(pond);
      const isle = new THREE.Group();
      const land = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 14), M(0x6a8a4a));
      land.position.y = 0.2;
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), M(0xc8a040));
      chest.position.y = 0.65;
      isle.add(land, chest);
      isle.position.set(P.x, y, P.z);
      isle.visible = false;
      G.add(isle);
      F.isle = isle;
      F.stones = [];
      for (let k = 1; k <= 3; k++) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 10), M(0x9a9aa0));
        st.position.set(P.x + k * 1.6, y + 0.15, P.z);
        st.visible = false;
        G.add(st);
        F.stones.push(st);
      }
      spots.pondEdge = { x: P.x + 6.8, z: P.z };
    }
    // 🌙 the crooked tree with a night-time door
    spots.nightdoor = freeForest(D.x - 25, D.z + 30, 2);
    {
      const P = spots.nightdoor;
      const y = H(P.x, P.z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 6, 8), M(0x4a3424));
      trunk.position.set(P.x, y + 3, P.z);
      trunk.rotation.z = 0.15;
      const door = new THREE.Group();
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), M(0x8a5a2a));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), M(0xf0c040));
      knob.position.set(0.25, 0, 0.03);
      const lightW = glow(0xffd890, 1.6, 0.8);
      lightW.position.set(0, 0.8, 0.1);
      door.add(d, knob, lightW);
      door.position.set(P.x, y + 0.65, P.z + 1.32);
      G.add(trunk, door);
      F.nightDoor = door;
      ctx.addSolid && ctx.addSolid(P.x, P.z, 1.2);
    }
    // 🌫️ the fog patch (misty mornings only)
    spots.fog = freeForest(Sc.x + 30, Sc.z - 30, 3);
    {
      const P = spots.fog;
      F.fog = [];
      for (let k = 0; k < 10; k++) {
        const m = glow(0xe8ecf4, 6 + Math.random() * 4, 0);
        m.position.set(P.x + (Math.random() - 0.5) * 6, H(P.x, P.z) + 1 + Math.random(), P.z + (Math.random() - 0.5) * 6);
        G.add(m);
        F.fog.push(m);
      }
    }
    // 🗺️ the X on the map
    spots.treasure = freeForest(D.x + 55, D.z - 40, 1.5);
    {
      const P = spots.treasure;
      const x1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.3), M(0xc83a2a));
      const x2 = x1.clone();
      x1.rotation.y = Math.PI / 4;
      x2.rotation.y = -Math.PI / 4;
      const X = new THREE.Group();
      X.add(x1, x2);
      X.position.set(P.x, H(P.x, P.z) + 0.05, P.z);
      X.visible = false;
      G.add(X);
      F.X = X;
    }
    F.places = placeAll("forest", G, H, (p) => {
      const base = p.at.from === "school" ? Sc : D;
      const at = freeForest(base.x + p.at.dx, base.z + p.at.dz, 2.6);
      return { ...at, face: Math.atan2(D.x - at.x, D.z - at.z) };
    });
    forest = F;
  }

  // ---------------------------------------------------------------- 🏙️ the cities' secrets
  function buildCity(c) {
    if (props[c.id] && props[c.id].c === c) return props[c.id];
    const P = { c, glints: [], scraps: [] };
    props[c.id] = P;
    const G = c.group;
    const H = c.height;
    const a = c.spots.arrive;
    // 🗺️ map scraps
    MAP_SCRAPS.forEach((sc, i) => {
      if (sc.where !== c.id) return;
      const at = freeCity(c, a.x + sc.dx, a.z + sc.dz, 0.8);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.25), new THREE.MeshStandardMaterial({ color: 0xe8d8b0, side: THREE.DoubleSide }));
      paper.rotation.x = -Math.PI / 2.3;
      paper.position.set(at.x, H(at.x, at.z) + 0.1, at.z);
      G.add(paper);
      P.scraps.push({ i, at, paper, gl: hintGlint(G, at.x, H(at.x, at.z) + 0.4, at.z) });
    });
    // 👂 a Gossip in every city square
    if (["reedmere", "golden", "frostpine", "silverveil"].includes(c.id)) {
      const at = freeCity(c, a.x - 7, a.z + 3, 1);
      const m = buildThistle({ tunicColor: 0xb87ab8, hoodColor: 0xd8a8d8, pack: false });
      m.position.set(at.x, H(at.x, at.z), at.z);
      m.rotation.y = Math.atan2(a.x - at.x, a.z - at.z);
      G.add(m);
      P.gossip = at;
    }
    if (c.id === "reedmere") {
      // 💌 the bottle on the shore, and the hidden cove
      const at = { x: 35, z: 35 };
      const bottle = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0x8ad8b0, transparent: true, opacity: 0.7 }));
      glass.rotation.z = Math.PI / 2;
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 6), M(0xc8a070));
      cork.rotation.z = Math.PI / 2;
      cork.position.x = 0.36;
      bottle.add(glass, cork);
      bottle.position.set(at.x, H(at.x, at.z) + 0.18, at.z);
      G.add(bottle);
      P.bottle = { g: bottle, ...at };
      const cove = { x: -37, z: -33 };
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.7), M(0xc8a040));
      chest.position.set(cove.x, H(cove.x, cove.z) + 0.3, cove.z);
      chest.visible = false;
      G.add(chest);
      P.cove = { chest, ...cove };
    }
    if (c.id === "frostpine") buildFrostpine(c, P);
    if (c.id === "golden") spots.paradise = { x: 40, z: 76 }; // (Dapple's Stable — for the Seeker's Candle)
    P.places = placeAll(c.id, G, H, (p) => {
      if (p.at.ring) {
        const ang = (p.at.ring[0] * Math.PI) / 180;
        let at = { x: Math.cos(ang) * p.at.ring[1], z: Math.sin(ang) * p.at.ring[1] };
        if (!p.at.hill) at = freeCity(c, at.x, at.z, 2.6);
        return { ...at, face: Math.atan2(-at.x, -at.z) };
      }
      const base = p.at.c ? { x: 0, z: 0 } : a; // (some are measured from the middle of town)
      const at = freeCity(c, base.x + p.at.dx, base.z + p.at.dz, 2.6);
      return { ...at, face: Math.atan2(a.x - at.x, a.z - at.z) };
    }, c.colliders);
    return P;
  }

  // ---------------------------------------------------------------- 🗝️ the Even More Secret Places: their ways in
  function placeAll(where, G, H, posOf, colliders = null) {
    const out = [];
    for (const p of PLACES) {
      if (p.where !== where) continue;
      const at = posOf(p);
      const e = buildEntrance(p.entrance, at.x, H(at.x, at.z), at.z, at.face);
      G.add(e.g);
      if (e.r) colliders ? colliders.push({ x: at.x, z: at.z, r: e.r }) : ctx.addSolid(at.x, at.z, e.r);
      spots[p.id] = e.focus;
      if (p.kind === "look" && !p.hidden) e.glint = hintGlint(G, e.focus.x, e.focus.y + 0.2, e.focus.z, 0xbfe8ff);
      out.push({ p, e });
    }
    return out;
  }
  // the cottage's little door, and the castle's crooked torch, are built the first time you're there
  let denPlaces = null, hallPlaces = null, hallFor = null;
  function placesHere() {
    const w = here();
    if (w === "forest") return (forest && forest.places) || [];
    if (w === "den") {
      if (!denPlaces && ctx.denGroup) {
        const R = ctx.denRadius - 0.08;
        denPlaces = placeAll("den", ctx.denGroup, () => 0, () => ({ x: 0, z: -R, face: 0 }), []);
      }
      return denPlaces || [];
    }
    if (w === "castlehall") {
      const Z = ctx.city();
      if (Z && hallFor !== Z) {
        hallFor = Z;
        hallPlaces = placeAll("castlehall", Z.group, () => 0, () => ({ x: HALL.w - 0.12, z: 8, face: -Math.PI / 2 }), Z.colliders);
      }
      return hallPlaces || [];
    }
    return (props[w] && props[w].c === ctx.city() && props[w].places) || [];
  }
  const dtNow = () => (ctx.dayTime ? ctx.dayTime() : 0.5);
  function whenOK(p) {
    const d = dtNow();
    if (p.when === "night") return d > 0.78 || d < 0.2;
    if (p.when === "noon") return d > 0.42 && d < 0.58;
    if (p.when === "dusk") return d > 0.66 && d < 0.82;
    if (p.when === "morning") return d > 0.2 && d < 0.34;
    return true;
  }
  function enterPlace(p) {
    enterRoom(p.room, p.id);
    window.dispatchEvent(new CustomEvent("ww-enter-place", { detail: { id: p.id } })); // (animals.js: each visit counts)
    ctx.say(found(p.id) ? `${p.icon} Back in ${p.name}.` : p.arrive, true);
  }
  let knocks = [], spins = {}, puzzleSeq = [], walkCool = 0;
  const PUZZLE_ORDER = [0, 2, 1]; // ☀️ the one that wakes you · ⭐ the one that guides sailors · 🌙 the one that watches you sleep
  function placeInteract() {
    const s = S();
    for (const { p, e } of placesHere()) {
      const F = e.focus;
      const reach = (e.r || 0) + 1.9;
      if (p.kind === "puzzle") {
        // the clue stone, and the three doors
        if (near(F.x, F.z, 1.9)) return { label: "read the carved clue stone 🪨", act: () => ctx.say("🪨 The stone reads: “First the one that WAKES you. Then the one that guides SAILORS home. Last, the one that WATCHES you sleep.”", true) };
        for (let k = 0; k < e.parts.doors.length; k++) {
          const D = e.parts.doors[k];
          const wx = e.g.position.x + Math.cos(e.g.rotation.y) * D.dx + Math.sin(e.g.rotation.y) * 0.8;
          const wz = e.g.position.z - Math.sin(e.g.rotation.y) * D.dx + Math.cos(e.g.rotation.y) * 0.8;
          if (!near(wx, wz, 1.4)) continue;
          if (found(p.id)) return { label: `go back into ${p.name} ${p.icon}`, act: () => enterPlace(p) };
          return { label: `push the ${D.sym} door`, act: () => {
            puzzleSeq = [...puzzleSeq, k].slice(-3);
            D.slab.position.z = 0.15;
            setTimeout(() => (D.slab.position.z = 0.3), 600);
            ctx.chime();
            if (puzzleSeq.length === 3 && puzzleSeq.every((v, i) => v === PUZZLE_ORDER[i])) {
              puzzleSeq = [];
              enterPlace(p);
            } else if (puzzleSeq.length === 3) {
              ctx.say("🧩 The doors rumble… and settle back. Wrong order! (Read the clue stone.)");
              puzzleSeq = [];
            } else ctx.say(`🧩 *clunk* — the ${D.sym} door sinks in a little…`);
          } };
        }
        continue;
      }
      if (!near(F.x, F.z, reach)) continue;
      if (p.when && !whenOK(p)) continue;
      if (found(p.id)) return { label: `go back into ${p.name} ${p.icon}`, act: () => enterPlace(p) };
      if (p.need === "candle" && !(s.owned || {}).seekercandle && !(s.owned || {}).skeletonkey) return { label: "try the tiny locked door 🔒", act: () => ctx.say("🔒 Locked tight. The keyhole is a funny shape… like a little candle FLAME. 🕯️", true) };
      if (p.kind === "e") return { label: p.label, act: () => enterPlace(p) };
      if (p.kind === "look" && (s.placeSeen || {})[p.id]) return { label: p.label, act: () => enterPlace(p) };
      // 🗝️ the Old Lighthouse Key opens the lost lighthouse straight away
      if (p.id === "p_lighthouse" && (s.owned || {}).br_lighthousekey) return { label: "unlock the lighthouse with the Old Lighthouse Key 🗝️", act: () => enterPlace(p) };
      if (p.kind === "knock") return { label: p.label, act: () => {
        const now = performance.now();
        knocks = [...knocks.filter((t) => now - t < 2500), now];
        ctx.chime();
        if (knocks.length >= 3) {
          knocks = [];
          enterPlace(p);
        } else ctx.say(knocks.length === 1 ? "✊ *knock*…" : "✊ *knock, knock*…");
      } };
      if (p.kind === "spin") {
        if (e.parts.trap.visible) return { label: "climb down the hidden steps 🗺️", act: () => enterPlace(p) };
        return { label: p.label, act: () => {
          spins[p.id] = (spins[p.id] || 0) + 1;
          e.spinT = 1.2;
          ctx.chime();
          if (spins[p.id] >= 3) {
            e.parts.trap.visible = true;
            ctx.say("🌍 Whirr… *click*. A square of floor beside the globe slides away — STEPS, going down!", true);
          } else ctx.say(`🌍 Whirrrr… (${spins[p.id]})`);
        } };
      }
    }
    return null;
  }
  function placeLook() {
    const s = S();
    for (const { p, e } of placesHere()) {
      if (p.kind !== "look" || found(p.id) || (s.placeSeen || {})[p.id]) continue;
      if (p.when && !whenOK(p)) continue; // (the hidden realms' doors only exist at their own time of day)
      if (near(e.focus.x, e.focus.z, (e.r || 0) + (p.hidden ? 1.2 : 1.9))) return { id: p.id, place: true };
    }
    return null;
  }
  function placeUpdate(dt, t) {
    const d = dtNow();
    const night = d > 0.78 || d < 0.2;
    const list = placesHere();
    walkCool = Math.max(0, walkCool - dt);
    for (const { p, e } of list) {
      const P2 = e.parts;
      if (p.hidden) e.g.visible = whenOK(p) || found(p.id); // (gone completely, except at its time — until you've found it)
      if (e.glint) e.glint.material.opacity = found(p.id) || (S().placeSeen || {})[p.id] ? 0 : Math.max(0, 1 - Math.hypot(me().x - e.focus.x, me().z - e.focus.z) / 3) * (0.35 + Math.sin(t * 5) * 0.3);
      if (P2.night) P2.night.forEach((m) => (m.visible = night));
      if (P2.shine) P2.shine.material.opacity = night ? 0.25 + Math.sin(t * 2) * 0.1 : 0;
      if (P2.caps) P2.caps.forEach((c, i) => (c.material.emissiveIntensity = whenOK(p) ? 0.7 + Math.sin(t * 3 + i) * 0.3 : 0));
      if (P2.river) P2.river.material.color.setHSL(0.58, 0.65, 0.45 + Math.sin(t * 3) * 0.08);
      if (P2.hands) {
        // the clock tells the real time of day (noon = both hands up)
        const hrs = (d * 24 + 12) % 12;
        P2.hands[0].rotation.z = -(hrs / 12) * Math.PI * 2;
        P2.hands[1].rotation.z = -((d * 24 * 60) % 60 / 60) * Math.PI * 2;
        P2.shut.visible = !whenOK(p);
      }
      if (P2.ref) P2.ref.position.x = Math.sin(t * 1.3) * 0.15;
      if (P2.ball && e.spinT > 0) {
        e.spinT -= dt;
        P2.ball.rotation.y += dt * 9 * e.spinT;
      }
      // walk-in places: step into the middle (but not straight back in as you come out)
      if (p.kind === "walk") {
        if (!near(e.focus.x, e.focus.z, 3.2)) e.armed = true;
        if (e.armed && !walkCool && whenOK(p) && !ctx.playing() && near(e.focus.x, e.focus.z, 1.6)) {
          e.armed = false;
          walkCool = 2;
          enterPlace(p);
        }
      }
    }
  }
  // 🐈 Biscuit, the General Store's cat: she naps by the store's door, and
  //    (if you follow her) leads you round the back to a ladder up into the
  //    store's own forgotten attic.
  function buildCat(c, P) {
    if (P.cat || !c.props || !c.props.generalStore) return;
    const st = c.props.generalStore;
    const H = c.height;
    const face = Math.atan2(-st.x, -st.z);
    const fx = Math.sin(face), fz = Math.cos(face), rx = Math.cos(face), rz = -Math.sin(face);
    const sit = { x: st.x + fx * 4.4 + rx * 2.2, z: st.z + fz * 4.4 + rz * 2.2 };
    const cat = new THREE.Group();
    const fur = M(0xe8a050);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), fur);
    body.scale.set(0.8, 0.7, 1.3);
    body.position.y = 0.4;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), fur);
    head.position.set(0, 0.65, 0.45);
    for (const sx of [-0.13, 0.13]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), fur);
      ear.position.set(sx, 0.92, 0.45);
      cat.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 5), fur);
    tail.position.set(0, 0.7, -0.5);
    tail.rotation.x = -0.6;
    cat.add(body, head, tail);
    cat.position.set(sit.x, H(sit.x, sit.z), sit.z);
    c.group.add(cat);
    // her path: round the side of the store to its back wall
    const path = [];
    for (let k = 1; k <= 5; k++) {
      const a = face + (k / 5) * Math.PI * 0.95;
      path.push({ x: st.x + Math.sin(a) * 5.4, z: st.z + Math.cos(a) * 5.4 });
    }
    const back = path[path.length - 1];
    const ladder = new THREE.Group();
    for (const sx of [-0.4, 0.4]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 0.1), M(0x8a6a42));
      rail.position.set(sx, 2.2, 0);
      ladder.add(rail);
    }
    for (let k = 0; k < 8; k++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), M(0x8a6a42));
      rung.position.y = 0.4 + k * 0.52;
      ladder.add(rung);
    }
    ladder.position.set(back.x, H(back.x, back.z), back.z);
    ladder.rotation.set(-0.25, Math.atan2(st.x - back.x, st.z - back.z), 0);
    ladder.visible = false;
    c.group.add(ladder);
    P.cat = { g: cat, body, head, tail, x: sit.x, z: sit.z, path, step: -1, ladder };
  }

  // ---------------------------------------------------------------- ❄️ Frostpine's many secrets
  function buildFrostpine(c, P) {
    const G = c.group;
    const H = c.height;
    const ring = (deg, r) => freeCity(c, Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r, 1.6);
    // 🐾 the tracks, and the snow fox's den at the end
    const start = freeCity(c, c.spots.arrive.x + 4, c.spots.arrive.z - 6, 0.6);
    const den = ring(200, 84);
    P.tracks = [];
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      const x = start.x + (den.x - start.x) * t + Math.sin(t * 9) * 5;
      const z = start.z + (den.z - start.z) * t + Math.cos(t * 7) * 4;
      const pr = new THREE.Mesh(new THREE.CircleGeometry(0.16, 6), new THREE.MeshBasicMaterial({ color: 0x9aa8c0 }));
      pr.rotation.x = -Math.PI / 2;
      pr.position.set(x + (k % 2 ? 0.25 : -0.25), H(x, z) + 0.04, z);
      G.add(pr);
      P.tracks.push(pr);
    }
    spots.fp_tracks = den;
    {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf4f8ff));
      mound.position.set(den.x, H(den.x, den.z), den.z);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), new THREE.MeshBasicMaterial({ color: 0x1a2030 }));
      hole.position.set(den.x, H(den.x, den.z) + 0.5, den.z + 1.75);
      G.add(mound, hole);
      c.colliders.push({ x: den.x, z: den.z, r: 1.8 });
    }
    // 🧊 the frozen waterfall — frozen solid as it tumbled down the steep hill
    //    at the edge of town. A crack hides at its foot.
    {
      const ang = (332 * Math.PI) / 180; // (behind the open snowfield — no cottage hides it)
      const out = { x: Math.cos(ang), z: Math.sin(ang) };
      const base = { x: out.x * 106, z: out.z * 106 };
      const top = { x: out.x * 122, z: out.z * 122 };
      const by = H(base.x, base.z), ty = H(top.x, top.z) + 1.5;
      const dh = 16, dy = Math.max(4, ty - by);
      const L = Math.hypot(dh, dy);
      const g = new THREE.Group();
      g.position.set(base.x, by, base.z);
      g.rotation.y = Math.atan2(out.x, out.z);
      const ice = M(0x8ccaf8, { transparent: true, opacity: 0.95, emissive: 0x4a90d0, emissiveIntensity: 0.45 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(8, L, 1.4), ice);
      slab.position.set(0, dy / 2, dh / 2);
      slab.rotation.x = Math.atan2(dh, dy);
      g.add(slab);
      // frozen ripples and icicles down its face
      for (let k = 0; k < 9; k++) {
        const r = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.4, 6), M(0xe8f6ff, { transparent: true, opacity: 0.9 }));
        const f = k / 9;
        r.position.set(-2 + (k % 5), dy * f + 0.3, dh * f - 0.5);
        r.rotation.x = Math.PI;
        g.add(r);
      }
      // a cold blue shimmer all down it, so you can see it from across town
      for (let k = 0; k <= 4; k++) {
        const sh = glow(0x8ad0ff, 7, 0.45);
        sh.position.set(0, dy * (k / 4) + 1, dh * (k / 4));
        g.add(sh);
      }
      const mist = glow(0xe8f6ff, 9, 0.5);
      mist.position.set(0, 1, -1.5);
      g.add(mist);
      // a frozen pool at its foot
      const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20), M(0xd8eeff));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.05, -2.2);
      g.add(pool);
      G.add(g);
      // the crack, low on the ice — easy to walk right past
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.4), new THREE.MeshBasicMaterial({ color: 0x4a6a8a }));
      crack.position.set(base.x - out.x * 0.75, by + 0.8, base.z - out.z * 0.75);
      crack.rotation.y = Math.atan2(-out.x, -out.z);
      G.add(crack);
      c.colliders.push({ x: base.x, z: base.z, r: 2.4 });
      spots.fp_icecave = base;
      spots.fp_icecaveFront = { x: base.x - out.x * 2.6, z: base.z - out.z * 2.6 };
      P.glints.push({ id: "fp_icecave", g: hintGlint(G, crack.position.x, by + 1.1, crack.position.z, 0xdff4ff) });
    }
    // ⛄ the snowman
    spots.fp_snowman = ring(40, 52);
    {
      const S0 = spots.fp_snowman;
      const y = H(S0.x, S0.z);
      const g = new THREE.Group();
      const snow = M(0xffffff);
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), snow);
      b1.position.y = 0.9;
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), snow);
      b2.position.y = 2.2;
      const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), snow);
      b3.position.y = 3.1;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), M(0xf08a2a));
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 3.1, 0.6);
      g.add(b1, b2, b3, nose);
      for (const sx of [-0.16, 0.16]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), M(0x101010));
        eye.position.set(sx, 3.25, 0.42);
        g.add(eye);
      }
      g.position.set(S0.x, y, S0.z);
      g.rotation.y = Math.atan2(-S0.x, -S0.z);
      G.add(g);
      c.colliders.push({ x: S0.x, z: S0.z, r: 1.1 });
      P.snowman = g;
    }
    // 🐟 the fish frozen in a block of ice
    spots.fp_icefish = ring(110, 58);
    {
      const F = spots.fp_icefish;
      const y = H(F.x, F.z);
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.2), M(0xcfe8ff, { transparent: true, opacity: 0.6 }));
      block.position.set(F.x, y + 0.7, F.z);
      const fish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M(0xb8c8d8));
      fish.scale.set(1.8, 0.8, 0.5);
      fish.position.set(F.x, y + 0.75, F.z);
      fish.rotation.z = 0.4;
      G.add(fish, block);
      c.colliders.push({ x: F.x, z: F.z, r: 1 });
      P.glints.push({ id: "fp_icefish", g: hintGlint(G, F.x, y + 1.5, F.z, 0xdff4ff) });
    }
    // ♨️ the hidden hot spring
    spots.fp_hotspring = ring(160, 90);
    {
      const W = spots.fp_hotspring;
      const y = H(W.x, W.z);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), M(0x6ac8d8, { emissive: 0x2a5a6a, emissiveIntensity: 0.4 }));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(W.x, y + 0.06, W.z);
      G.add(pool);
      P.steam = [];
      for (let k = 0; k < 6; k++) {
        const st = glow(0xffffff, 3, 0.25);
        st.position.set(W.x + (Math.random() - 0.5) * 3, y + 1, W.z + (Math.random() - 0.5) * 3);
        G.add(st);
        P.steam.push(st);
      }
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), M(0x7a7a84));
        rk.position.set(W.x + Math.cos(a) * 2.8, y + 0.2, W.z + Math.sin(a) * 2.8);
        G.add(rk);
      }
    }
    // 🛷 the old sled in a snowdrift
    spots.fp_sled = ring(250, 70);
    {
      const W = spots.fp_sled;
      const y = H(W.x, W.z);
      const drift = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xffffff));
      drift.scale.set(1.6, 0.6, 1);
      drift.position.set(W.x, y, W.z);
      const runner = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 12, Math.PI), M(0x8a3a2a));
      runner.position.set(W.x + 1.9, y + 0.3, W.z);
      runner.rotation.y = Math.PI / 2;
      G.add(drift, runner);
      P.glints.push({ id: "fp_sled", g: hintGlint(G, W.x + 1.9, y + 0.6, W.z) });
      spots.fp_sledLook = { x: W.x + 1.9, z: W.z };
    }
    // 🪨 the rune stone, and 🎐 the three icicle chimes beside it
    spots.fp_runestone = ring(330, 60);
    {
      const W = spots.fp_runestone;
      const y = H(W.x, W.z);
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.5), M(0x7a7a84));
      st.position.set(W.x, y + 0.6, W.z);
      st.rotation.set(0.15, Math.atan2(-W.x, -W.z), 0);
      const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.5 }));
      rune.position.set(W.x - Math.sin(st.rotation.y) * -0.27, y + 0.75, W.z - Math.cos(st.rotation.y) * -0.27);
      rune.rotation.y = st.rotation.y;
      G.add(st, rune);
      c.colliders.push({ x: W.x, z: W.z, r: 0.9 });
      P.glints.push({ id: "fp_runestone", g: hintGlint(G, W.x, y + 1.7, W.z, 0x9fd8ff) });
      // the icicles: high, low, middle (each a different length)
      P.icicles = [2.6, 1.2, 1.9].map((len, k) => {
        const x = W.x + (k - 1) * 2.4, z = W.z + 3;
        const arch = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), M(0x8a8a90));
        const ice = new THREE.Mesh(new THREE.ConeGeometry(0.22, len, 8), M(0xdff0ff, { transparent: true, opacity: 0.85 }));
        ice.rotation.x = Math.PI;
        ice.position.set(x, y + 4 - len / 2, z);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 0.2), M(0x6a4a2c));
        beam.position.set(x, y + 2.1, z - 0.4);
        arch.position.set(x, y + 4.05, z);
        G.add(ice, beam, arch);
        return { x, z, ice, len };
      });
      spots.fp_icicles = { x: W.x, z: W.z + 3 };
    }
    // 🦉 three watching owls (carved, on posts) — and the spot they all watch
    spots.fp_owls = ring(70, 78);
    P.owls = [0, 1, 2].map((k) => {
      const at = ring(20 + k * 35, 38 + k * 6);
      const y = H(at.x, at.z);
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2, 6), M(0x6a4a2c));
      post.position.y = 1;
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), M(0x8a6a4a));
      body.scale.y = 1.2;
      body.position.y = 2.5;
      const head = new THREE.Group();
      const hm = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), M(0x9a7a5a));
      for (const sx of [-0.14, 0.14]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M(0xf0a020, { emissive: 0x8a5a00, emissiveIntensity: 0.6 }));
        eye.position.set(sx, 0.05, 0.32);
        head.add(eye);
      }
      head.add(hm);
      head.position.y = 3.2;
      g.add(post, body, head);
      g.position.set(at.x, y, at.z);
      G.add(g);
      c.colliders.push({ x: at.x, z: at.z, r: 0.5 });
      return { g, head, at, studied: false };
    });
    {
      const W = spots.fp_owls;
      const mark = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0 }));
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(W.x, H(W.x, W.z) + 0.05, W.z);
      G.add(mark);
      P.owlMark = mark;
    }
    // 🧤 the giant's mitten
    spots.fp_mitten = ring(225, 50);
    {
      const W = spots.fp_mitten;
      const y = H(W.x, W.z);
      const mit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 3.4), M(0xc83a4a));
      mit.position.set(W.x, y + 0.35, W.z);
      mit.rotation.y = 0.6;
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.4), M(0xc83a4a));
      thumb.position.set(W.x + 1.4, y + 0.3, W.z + 0.6);
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.6), M(0xffffff));
      cuff.position.set(W.x - Math.sin(0.6) * 1.8, y + 0.4, W.z - Math.cos(0.6) * 1.8);
      cuff.rotation.y = 0.6;
      G.add(mit, thumb, cuff);
      c.colliders.push({ x: W.x, z: W.z, r: 1.8 });
    }
    // 🌲 the hollow pine
    spots.fp_hollowpine = ring(15, 66);
    {
      const W = spots.fp_hollowpine;
      const y = H(W.x, W.z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6, 8), M(0x5a3e24));
      trunk.position.set(W.x, y + 3, W.z);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 8), M(0x2e4a3a));
      crown.position.set(W.x, y + 8, W.z);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), new THREE.MeshBasicMaterial({ color: 0x100804 }));
      const fa = Math.atan2(-W.x, -W.z);
      hole.position.set(W.x + Math.sin(fa) * 0.78, y + 1.6, W.z + Math.cos(fa) * 0.78);
      hole.rotation.y = fa;
      G.add(trunk, crown, hole);
      c.colliders.push({ x: W.x, z: W.z, r: 0.9 });
      P.glints.push({ id: "fp_hollowpine", g: hintGlint(G, hole.position.x, y + 1.7, hole.position.z) });
      spots.fp_hollowpineFront = { x: hole.position.x + Math.sin(fa) * 0.8, z: hole.position.z + Math.cos(fa) * 0.8 };
    }
    // ⛸️ the lost skate blade (on the way to the Frozen Lake sign)
    spots.fp_skate = freeCity(c, c.spots.arrive.x + 17, c.spots.arrive.z - 11, 0.6);
    P.glints.push({ id: "fp_skate", g: hintGlint(G, spots.fp_skate.x, H(spots.fp_skate.x, spots.fp_skate.z) + 0.2, spots.fp_skate.z, 0xe8f0ff) });
    P.glints.push({ id: "fp_mitten", g: hintGlint(G, spots.fp_mitten.x, H(spots.fp_mitten.x, spots.fp_mitten.z) + 1.4, spots.fp_mitten.z) });
  }

  // ---------------------------------------------------------------- 🚪 secret rooms (in and out)
  let backTo = null;
  function enterRoom(room, id) {
    backTo = { where: here(), x: me().x, z: me().z, face: ctx.mouseRig.rotation.y + Math.PI };
    ctx.goCity(room);
    const D = SECRET_ROOMS[room];
    ctx.placePlayer(0, D.r - 2.2, Math.PI);
    roomSecret = id;
  }
  let roomSecret = null;
  function leaveRoom() {
    const B = backTo || { where: "forest", x: ctx.den.x, z: ctx.den.z + 3, face: 0 };
    if (B.where === "forest") ctx.goOutside();
    else if (B.where === "den") ctx.goInside();
    else ctx.goCity(B.where);
    ctx.placePlayer(B.x, B.z, B.face);
  }

  // ---------------------------------------------------------------- 🕯️ the Seeker's Candle (flickers near secrets)
  const candle = document.createElement("div");
  candle.style.cssText = "position:fixed;right:22px;bottom:64px;z-index:30;pointer-events:none;display:none;text-align:center;width:60px";
  const candleFlame = document.createElement("div");
  candleFlame.style.cssText = "font-size:30px;transform-origin:50% 90%;filter:drop-shadow(0 0 6px #ffb040)";
  candleFlame.textContent = "🕯️";
  candle.append(candleFlame);
  document.body.appendChild(candle);

  // ---------------------------------------------------------------- 👂 rumours
  function gossip() {
    const s = S();
    s.rumours ||= {};
    // (the Secret Trader is everyone's favourite gossip — until you've found his lair)
    const trader = !found("r_lair") && Math.random() < 0.5 ? SECRETS.find((x) => x.id === "r_lair") : null;
    const next = trader || SECRETS.find((x) => !found(x.id) && RUMOURS[x.id] && !s.rumours[x.id]) || SECRETS.find((x) => !found(x.id) && RUMOURS[x.id]);
    let msg;
    if (!next) msg = "“Secrets? Ha! You've found them ALL, haven't you? You're the talk of the town!”";
    else {
      s.rumours[next.id] = true;
      msg = RUMOURS[next.id];
    }
    const heard = Object.keys(s.rumours).length;
    if (heard >= 3 && !(s.owned || {}).seekercandle) {
      s.owned.seekercandle = true;
      msg += " …“Oh, and take this candle, dearie. It flickers whenever a secret's close. You'll see.” (🕯️ The Seeker's Candle!)";
    }
    save();
    ctx.say(`👂 The Gossip whispers: ${msg}`, true);
  }

  // ---------------------------------------------------------------- E
  let bellRings = [];
  function interactable() {
    const w = here();
    const s = S();
    // 🚪 inside a secret room
    if (SECRET_ROOMS[w]) {
      const Z = ctx.city();
      if (near(Z.door.x, Z.door.z, 2.2)) return { label: "go back out 🚪", act: leaveRoom };
      if (roomSecret && !found(roomSecret) && near(Z.chestAt.x, Z.chestAt.z, 2.2)) return { label: "open the old chest 🗝️", act: () => {
        Z.chestLid.rotation.x = -1;
        discover(roomSecret);
      } };
      return null;
    }
    // 🗝️ a secret place's way in?
    const PI = placeInteract();
    if (PI) return PI;
    if (w === "forest") {
      buildForest();
      if (!forest) return null;
      if (near(spots.readingroom.x, spots.readingroom.z, 2.4)) return { label: found("readingroom") ? "visit the secret reading room 📚" : "pull the red book that won't come off the shelf 📕", act: () => {
        ctx.say("📕 You tug the red book… CLICK. The whole bookcase swings open like a door!", true);
        enterRoom("readingroom", "readingroom");
      } };
      if (near(spots.bell.x, spots.bell.z, 2.6)) return { label: "ring the school bell 🔔", act: () => {
        const now = performance.now();
        bellRings = bellRings.filter((t) => now - t < 4000);
        bellRings.push(now);
        ctx.chime();
        if (bellRings.length >= 3 && !found("bell") && !forest.trapdoor.visible) {
          forest.trapdoor.visible = true;
          ctx.say("🔔 DING — DING — DING! …and from under the ground, something goes CLUNK. A trapdoor has opened beside the school!", true);
        } else ctx.say("🔔 DING!");
      } };
      if (forest.trapdoor.visible && near(spots.trapdoor.x, spots.trapdoor.z, 2)) return { label: "climb down through the trapdoor 🕳️", act: () => enterRoom("basement", "bell") };
      if (forest.oakDoor.visible && near(spots.oakDoor.x, spots.oakDoor.z, 2.4)) return { label: "step through the door in the oak's roots 🌳", act: () => enterRoom("rootchamber", "oak") };
      if (forest.isle.visible && !found("pond") && near(spots.pond.x, spots.pond.z, 2.4)) return { label: "open the little chest on the island 🪞", act: () => discover("pond") };
      if (forest.nightDoor.visible && !found("nightdoor") && near(spots.nightdoor.x, spots.nightdoor.z + 1.6, 2)) return { label: "knock on the little night-time door 🌙", act: () => discover("nightdoor", "an old owl lets you in for tea, and gives you a gift") };
      if (forest.X.visible && !found("treasure") && near(spots.treasure.x, spots.treasure.z, 2)) return { label: "dig where X marks the spot ⛏️", act: () => discover("treasure", "a chest FULL of gold") };
    } else if (props[w]) {
      const P = buildCity(ctx.city());
      for (const sc of P.scraps) {
        if ((s.mapScraps || {})[sc.i] || !near(sc.at.x, sc.at.z, 1.8)) continue;
        return { label: "pick up the scrap of old map 🗺️", act: () => {
          (s.mapScraps ||= {})[sc.i] = true;
          save();
          ctx.chime();
          const n = Object.keys(s.mapScraps).length;
          ctx.say(`🗺️ A torn scrap of an old map! (${n}/6)${n >= 6 ? " — ALL SIX! Put together, they show an X… in the Great Forest, east of your cottage!" : ""}`, true);
        } };
      }
      if (P.gossip && near(P.gossip.x, P.gossip.z, 2.6)) return { label: "listen to the Gossip 👂", act: gossip };
      if (P.cat && !found("cat")) {
        const K = P.cat;
        if (K.ladder.visible && near(K.ladder.position.x, K.ladder.position.z, 2.2)) return { label: "climb Biscuit's ladder up to the attic 🪜", act: () => enterRoom("attic", "cat") };
      }
      if (P.bottle && P.bottle.g.visible && near(P.bottle.x, P.bottle.z, 2.2)) return { label: "open the message in a bottle 💌", act: () => readBottle(P) };
      if (P.cove && P.cove.chest.visible && !found("bottle") && near(P.cove.x, P.cove.z, 2.2)) return { label: "open the chest in the hidden cove ⛵", act: () => discover("bottle", "the story's last surprise") };
      if (w === "frostpine") {
        const T = spots.fp_tracks;
        if (!found("fp_tracks") && near(T.x, T.z + 2, 2.4)) return { label: "peek into the snowy den 🦊", prompt: "Hold <b>F</b> to examine the snowy den closely 🔍", act: () => discover("fp_tracks", "a little white snow fox leaves you a gift and scampers off") };
        if (near(spots.fp_icecave.x, spots.fp_icecave.z, 3.8) && (s.secretCrack || found("fp_icecave"))) return { label: "squeeze through the crack in the frozen waterfall 🧊", act: () => enterRoom("icecave", "fp_icecave") };
        if (!found("fp_snowman") && near(spots.fp_snowman.x, spots.fp_snowman.z, 2.4)) return { label: "give the snowman a friendly pat ⛄", act: () => {
          s.snowPats = (s.snowPats || 0) + 1;
          save();
          if (s.snowPats < 3) return ctx.say(s.snowPats === 1 ? "⛄ Pat, pat. The snowman's carrot nose twitches…" : "⛄ Pat, pat, pat. Was that a smile?", true);
          P.snowman.rotation.z = 0.25;
          discover("fp_snowman", "he wobbles, giggles, and drops a scarf he was hiding");
        } };
        if (!found("fp_hotspring") && near(spots.fp_hotspring.x, spots.fp_hotspring.z, 3.2)) return { label: "dip your paws in the warm spring ♨️", act: () => discover("fp_hotspring", "warm all the way through (hearts full)") };
        if (!found("fp_icicles")) for (let k = 0; k < (P.icicles || []).length; k++) {
          const I = P.icicles[k];
          if (!near(I.x, I.z, 1.3)) continue;
          return { label: `tap the ${["long", "short", "middle"][k]} icicle 🎐`, act: () => ringIcicle(P, k) };
        }
        if (!found("fp_owls")) {
          for (const O of P.owls) if (!O.studied && near(O.at.x, O.at.z, 2.4)) return { label: "study the carved owl 🦉", act: () => {
            O.studied = true;
            const n = P.owls.filter((x) => x.studied).length;
            ctx.say(n < 3 ? `🦉 Its amber eyes are fixed on something far away… (${n}/3 owls)` : "🦉 All three owls are staring at the SAME spot — and now it's glowing gold!", true);
          } };
          if (P.owls.every((x) => x.studied) && near(spots.fp_owls.x, spots.fp_owls.z, 2)) return { label: "dig where the owls are looking 👁️", act: () => discover("fp_owls") };
        }
      }
    }
    // 🔍 something here… (hold F)
    const L = lookHere();
    if (L && L.id !== "paradise") return { label: "examine it closely 🔍", prompt: "Hold <b>F</b> to examine it closely 🔍", act: () => doLook(L) };
    return null;
  }
  function readBottle(P) {
    const s = S();
    const n = s.bottles || 0;
    const NOTES = [
      "“Day 1. My name is Captain Tilly. My ship is stuck on a sandbar and I'm SO bored. If anyone finds this, write back! (You can't. It's a bottle.)”",
      "“Day 2. A seagull stole my hat. We are now enemies. I have named him Gerald.”",
      "“Day 3. Gerald brought the hat back. We are now friends. He is sitting on it.”",
      "“Day 4. The tide is rising! I'm going to sail away at last. I've hidden my treasure in a little cove across Reedmere's lagoon, behind the rocks to the north-west…”",
      "“Day 5. Free! Whoever you are, finder of my bottles — the treasure is YOURS. Fair winds! — Captain Tilly (and Gerald)”",
    ];
    if (n >= NOTES.length) return;
    s.bottles = n + 1;
    s.bottleDay = day();
    save();
    P.bottle.g.visible = false;
    ctx.say(`💌 ${NOTES[n]} (bottle ${n + 1}/5${n + 1 < 5 ? " · another may wash up tomorrow" : ""})`, true);
  }
  function ringIcicle(P, k) {
    const s = S();
    const want = [0, 1, 2]; // high (the long one), low (the short one), middle
    s.icicleSeq = [...(s.icicleSeq || []), k].slice(-3);
    ctx.chime();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = [1568, 784, 1175][k];
      g.gain.setValueAtTime(0.18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 1.3);
      setTimeout(() => ac.close(), 1600);
    } catch {}
    if (s.icicleSeq.length === 3 && s.icicleSeq.every((v, i) => v === want[i])) discover("fp_icicles", "the ice sings, and a little hollow opens in the snow");
    save();
  }
  // which "look closely" secret is right here?
  const inStable = () => ctx.homeRoom && ctx.homeRoom() === "room:Dapple's Stable";
  function lookHere() {
    const w = here();
    // 🌺 at Dapple's counter: the wall behind her looks… perfectly normal (F only — no hint!)
    if (inStable() && me().z < -0.8 && Math.abs(me().x) < 2.8) return { id: "paradise", special: true };
    const LOOKS = {
      forest: ["knothole", "loosestone", "puddle"],
      frostpine: ["fp_tracks", "fp_icefish", "fp_sled", "fp_runestone", "fp_mitten", "fp_hollowpine", "fp_skate"],
    };
    if (w === "forest" && forest) {
      if (!found("pond") && !forest.isle.visible && near(spots.pondEdge.x, spots.pondEdge.z, 1.8)) return { id: "pond", special: true };
    }
    if (w === "frostpine" && props.frostpine && !found("fp_icecave") && !S().secretCrack && near(spots.fp_icecave.x, spots.fp_icecave.z, 3.6)) return { id: "fp_icecave", special: true };
    const PL = placeLook();
    if (PL) return PL;
    // (secrets you haven't found come first — but you can always examine the ones you have)
    const order = [...(LOOKS[w] || [])].sort((a, b) => found(a) - found(b));
    for (const id of order) {
      const P = id === "fp_hollowpine" ? spots.fp_hollowpineFront : id === "fp_sled" ? spots.fp_sledLook : id === "fp_tracks" ? { x: spots.fp_tracks.x, z: spots.fp_tracks.z + 2 } : spots[id];
      // (just past the edge of anything solid — you can't stand inside it!)
      const R = { fp_icefish: 2.5, fp_mitten: 3.2, fp_runestone: 2.4, fp_hollowpine: 2.3, fp_tracks: 2.6 }[id] || 2.2;
      if (P && near(P.x, P.z, R)) return found(id) ? { id, again: true } : { id };
    }
    return null;
  }

  // what you find when you look closely (hold F, or press E)
  function doLook(L) {
    const s = S();
    lookLatch = true; // (let go of F before looking again)
    if (L.id === "paradise") {
      const first = !found("paradise");
      ctx.say(first ? "🌺 You look closely at the wall behind Stablemaster Dapple… one plank is a slightly different colour. You push it — CLICK — and a whole section of wall swings open. Warm air, birdsong, and the smell of flowers pour through!" : "🌺 The secret door behind Dapple swings open again…", true);
      if (first) discover("paradise", "a secret door to PARADISE");
      setTimeout(() => {
        ctx.goCity("paradise");
        ctx.placePlayer(0, 49, Math.PI);
        ctx.say("🌺 PARADISE. A hidden valley: golden sand, a deep turquoise lagoon, jungle cliffs with waterfalls thundering down them — and an old traders' bazaar that no map has ever shown. (The stone archway behind you leads back.)", true);
      }, 1800);
      return;
    }
    if (L.again) {
      const sec = SEC[L.id];
      ctx.say(`🔍 ${sec.icon} ${sec.name} — you've already found this secret's treasure. (${SECRETS.filter((x) => found(x.id)).length}/${SECRETS.length} secrets)`);
      return;
    }
    if (L.place) {
      (s.placeSeen ||= {})[L.id] = true;
      save();
      ctx.chime();
      ctx.say(PLACE_BY_ID[L.id].look, true);
      return;
    }
    if (L.id === "pond") {
      forest.isle.visible = true;
      forest.stones.forEach((x) => (x.visible = true));
      ctx.say("🪞 You gaze into the still pond… and the reflection shows a tiny island with a chest on it. You look up — and there it is, real as anything, with stepping stones out to it!", true);
    } else if (L.id === "fp_icecave") {
      s.secretCrack = true;
      save();
      ctx.say("🧊 Looking closely… there's a CRACK in the frozen waterfall, just big enough for a mouse! (E to squeeze through)", true);
    } else discover(L.id, {
      knothole: "a little hoard of coins tucked inside", loosestone: "a glass marble hidden underneath", puddle: "a silver thimble at the bottom",
      fp_tracks: "a little white snow fox peeks out, leaves you a gift and scampers off", fp_icefish: "", fp_sled: "an old red sled, buried in the drift", fp_runestone: "", fp_mitten: "a mitten the size of a house", fp_hollowpine: "a squirrel's forgotten coin stash", fp_skate: "a silver skate blade",
    }[L.id] || "");
  }
  // ---------------------------------------------------------------- each frame
  function update(dt) {
    const w = here();
    const s = S();
    const t = performance.now() / 1000;
    const dtm = ctx.dayTime ? ctx.dayTime() : 0.5;
    placeUpdate(dt, t);
    if (w === "forest") {
      buildForest();
      if (forest) {
        forest.trapdoor.visible = forest.trapdoor.visible || found("bell");
        forest.oakDoor.visible = forest.oakDoor.visible || found("oak");
        if (found("pond")) {
          forest.isle.visible = true;
          forest.stones.forEach((x) => (x.visible = true));
        }
        forest.nightDoor.visible = dtm > 0.78 || dtm < 0.2;
        const morning = dtm > 0.2 && dtm < 0.34;
        forest.fog.forEach((m) => (m.material.opacity += ((morning ? 0.35 : 0) - m.material.opacity) * Math.min(1, dt * 2)));
        if (morning && near(spots.fog.x, spots.fog.z, 2.5) && !ctx.playing()) {
          ctx.say("🌫️ You step into the fog… and keep walking… and the fog thins out onto a village that isn't on any map.", true);
          enterRoom("lostvillage", "fog");
        }
        forest.X.visible = Object.keys(s.mapScraps || {}).length >= 6 && !found("treasure");
      }
    }
    if (ctx.world() === "city" && ctx.city() && ["reedmere", "golden", "frostpine", "silverveil"].includes(w)) {
      const P = buildCity(ctx.city());
      if (w === "golden") buildCat(ctx.city(), P);
      P.scraps.forEach((sc) => {
        sc.paper.visible = !(s.mapScraps || {})[sc.i];
        sc.gl.material.opacity = sc.paper.visible ? Math.max(0, 1 - Math.hypot(me().x - sc.at.x, me().z - sc.at.z) / 3) * 0.6 : 0;
      });
      if (P.bottle) P.bottle.g.visible = (s.bottles || 0) < 5 && (s.bottleDay === undefined || s.bottleDay < day());
      if (P.cove) P.cove.chest.visible = (s.bottles || 0) >= 4 && !found("bottle");
      if (P.cat && !found("cat")) {
        const K = P.cat;
        const shopOpen = document.querySelector("#shop.open");
        if (storeVisit && !shopOpen && K.step < 0) {
          storeVisit = false;
          K.step = 0;
          ctx.say("🐈 As you step out of the General Store, Biscuit the shop cat glances at you… and slinks off round the side of the building. Follow her!", true);
        }
        // a slinky walk: low to the ground, tail swishing, looking back at you
        const moving = K.step >= 0 && K.step < K.path.length;
        K.body.position.y = moving ? 0.3 : 0.4;
        K.head.position.y = moving ? 0.5 : 0.65;
        K.tail.rotation.z = Math.sin(t * (moving ? 6 : 1.5)) * 0.5;
        if (K.step >= 0 && K.step < K.path.length) {
          const T = K.path[K.step];
          const dx = T.x - K.g.position.x, dz = T.z - K.g.position.z;
          const d = Math.hypot(dx, dz);
          const waiting = Math.hypot(me().x - K.g.position.x, me().z - K.g.position.z) > 7;
          if (waiting) K.g.rotation.y = Math.atan2(me().x - K.g.position.x, me().z - K.g.position.z); // (she waits, looking back for you)
          // …but if you don't follow her, she gives up and pads back to her nap
          K.lost = Math.hypot(me().x - K.g.position.x, me().z - K.g.position.z) > 14 ? (K.lost || 0) + dt : 0;
          if (K.lost > 4) {
            K.lost = 0;
            K.step = -1;
            K.g.position.set(K.x, ctx.city().height(K.x, K.z), K.z);
            ctx.say("🐈 Biscuit gave up waiting and wandered back to her spot by the General Store door.", true);
          }
          if (d > 0.3 && !waiting) {
            K.g.position.x += (dx / d) * Math.min(d, dt * 2.6);
            K.g.position.z += (dz / d) * Math.min(d, dt * 2.6);
            K.g.position.y = ctx.city().height(K.g.position.x, K.g.position.z);
            K.g.rotation.y = Math.atan2(dx, dz);
          } else if (d <= 0.3) {
            K.step++;
            if (K.step >= K.path.length) {
              K.ladder.visible = true;
              ctx.say("🐈 Biscuit scrambles up an old ladder and vanishes through a hatch under the eaves. An ATTIC!", true);
            }
          }
        }
      }
      if (w === "frostpine" && P.owls) {
        // 🦉 the owls turn their heads… but only when you're not looking at them
        const cam = ctx.camera;
        const fwd = new THREE.Vector3();
        cam.getWorldDirection(fwd);
        for (const O of P.owls) {
          const to = new THREE.Vector3(O.at.x - cam.position.x, 0, O.at.z - cam.position.z).normalize();
          const seen = fwd.x * to.x + fwd.z * to.z > 0.55;
          const want = Math.atan2(spots.fp_owls.x - O.at.x, spots.fp_owls.z - O.at.z);
          if (!seen) O.head.rotation.y = want - O.g.rotation.y;
        }
        P.owlMark.material.opacity = P.owls.every((x) => x.studied) && !found("fp_owls") ? 0.5 + Math.sin(t * 3) * 0.3 : 0;
      }
      if (P.steam) P.steam.forEach((st, i) => {
        st.position.y = ctx.city().height(st.position.x, st.position.z) + 0.5 + ((t * 0.6 + i * 0.4) % 2.5);
        st.material.opacity = 0.3 * (1 - ((t * 0.6 + i * 0.4) % 2.5) / 2.5);
      });
      for (const gl of P.glints) gl.g.material.opacity = found(gl.id) ? 0 : Math.max(0, 1 - Math.hypot(me().x - gl.g.position.x, me().z - gl.g.position.z) / 3) * (0.35 + Math.sin(t * 5) * 0.3);
    }
    if (w === "forest" && forest) for (const gl of forest.glints) gl.g.material.opacity = found(gl.id) ? 0 : Math.max(0, 1 - Math.hypot(me().x - gl.g.position.x, me().z - gl.g.position.z) / 3) * (0.35 + Math.sin(t * 5) * 0.3);
    // 🔍 hold F to look closely
    const L = lookHere();
    const box = L && fHeld ? frameBox(L) : null;
    if (box && ctx.camera) {
      // the frame hugs the whole object: project the corners of its box onto the screen
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
      const v = new THREE.Vector3();
      for (const dx of [-box.r, box.r]) for (const dz of [-box.r, box.r]) for (const yy of [box.y, box.y + box.h]) {
        v.set(box.x + dx, yy, box.z + dz).project(ctx.camera);
        if (v.z > 1) behind = true;
        const sx = ((v.x + 1) / 2) * innerWidth, sy = ((1 - v.y) / 2) * innerHeight;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      const pad = 10;
      x0 = Math.max(4, x0 - pad); y0 = Math.max(4, y0 - pad); x1 = Math.min(innerWidth - 4, x1 + pad); y1 = Math.min(innerHeight - 4, y1 + pad);
      frame.style.display = behind || x1 <= x0 ? "none" : "block";
      frame.style.transform = "none";
      frame.style.left = x0 + "px";
      frame.style.top = y0 + "px";
      frame.style.width = x1 - x0 + "px";
      frame.style.height = y1 - y0 + "px";
      frame.style.opacity = String(0.6 + 0.4 * Math.min(1, lookT / 0.8));
    } else frame.style.display = "none";
    if (!fHeld) lookLatch = false;
    if (L && fHeld && !lookLatch) {
      lookT += dt;
      if (lookT > 0.8) {
        lookT = 0;
        doLook(L);
      }
    } else lookT = 0;
    // 🕯️ the candle flickers near secrets
    if ((s.owned || {}).seekercandle) {
      candle.style.display = "";
      let best = 99;
      for (const sec of SECRETS) {
        if (found(sec.id) || sec.where !== w) continue;
        const P = spots[sec.id === "fp_hollowpine" ? "fp_hollowpineFront" : sec.id === "fp_icecave" ? "fp_icecaveFront" : sec.id];
        if (P) best = Math.min(best, Math.hypot(me().x - P.x, me().z - P.z));
      }
      // the nearer a secret, the bigger, brighter and faster it burns
      const k = best < 60 ? 1 - best / 60 : 0;
      const flick = 0.75 + 0.25 * Math.abs(Math.sin(t * (3 + k * 16)));
      candleFlame.style.opacity = String(best >= 99 ? 0.3 : 0.45 + 0.55 * k * flick);
      candleFlame.style.transform = `scale(${1 + k * 0.9 * flick})`;
      candleFlame.style.filter = `drop-shadow(0 0 ${4 + k * 22}px rgb(255,${Math.round(180 - k * 80)},40))`;
    } else candle.style.display = "none";
  }
  // 🐈 go into the General Store and back out… and Biscuit starts slinking away
  let storeVisit = false;
  window.addEventListener("ww-store-open", () => (storeVisit = true));
  // 🎶 the Old Oak's tune: 2, 4, 2, 1
  window.addEventListener("ww-note", (e) => {
    const n = e.detail.notes;
    if (here() !== "forest" || !forest || found("oak") || forest.oakDoor.visible) return;
    if (n.length === 4 && [2, 4, 2, 1].every((v, i) => v === n[i]) && near(spots.oak.x, spots.oak.z, 9)) {
      forest.oakDoor.visible = true;
      ctx.say("🎶 The last note hangs in the air… and the oak's great roots CREAK apart, opening a little door into the ground!", true);
    }
  });

  // ---------------------------------------------------------------- 📖 the Secrets page (in the Collection Book)
  function pageHTML() {
    const s = S();
    const n = SECRETS.filter((x) => found(x.id)).length;
    const heard = s.rumours || {};
    return `<h3 style="margin:12px 0 6px;color:#5a3a12">🔍 Secrets — ${n}/${SECRETS.length}${n >= SECRETS.length ? " ✔ SECRET SEEKER!" : ""}</h3>
      <div style="font:12px system-ui;color:#8a6a44;margin-bottom:6px">Look closely (hold F) at odd things · try things (E) · play tunes · come back at night, in the morning mist… · talk to the 👂 Gossips in each city</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px">${SECRETS.map((x) => {
        const f = found(x.id);
        return `<div style="padding:6px 8px;border-radius:9px;background:${f ? "rgba(255,240,200,.85)" : "rgba(0,0,0,.08)"};font-size:13px"><b>${f ? x.icon + " " + x.name : "❓ ???"}</b><div style="font-size:11px;color:#6a4a2a">${f ? "found!" : heard[x.id] ? "👂 " + x.hint : x.where === "frostpine" ? "somewhere in Frostpine…" : x.where === "forest" ? "somewhere in the Great Forest…" : x.where === "den" ? "somewhere in your own cottage…" : x.where === "castlehall" ? "somewhere in your castle…" : "somewhere in " + { reedmere: "Reedmere", golden: "Golden Hollow", silverveil: "Silverveil" }[x.where] + "…"}</div></div>`;
      }).join("")}</div>`;
  }
  window.__wwSecretsPage = pageHTML;
  // 📕 a true hint about a secret you haven't found (the Book of Secrets, the Truth-Telling Mirror)
  window.__wwSecretHint = () => {
    const s = S();
    s.rumours ||= {};
    const next = SECRETS.find((x) => !found(x.id) && RUMOURS[x.id] && !s.rumours[x.id]) || SECRETS.find((x) => !found(x.id) && RUMOURS[x.id]);
    if (!next) return null;
    s.rumours[next.id] = true;
    save();
    return RUMOURS[next.id];
  };
  // 🐉 fly straight into a secret room you've found (its door brings you back to where you flew from)
  window.__wwFlyInto = (room) => {
    const D = SECRET_ROOMS[room];
    if (!D) return;
    backTo = { where: here(), x: me().x, z: me().z, face: ctx.mouseRig.rotation.y + Math.PI };
    ctx.goCity(room);
    ctx.placePlayer(0, D.r - 2.2, Math.PI);
    roomSecret = (PLACES.find((p) => p.room === room) || {}).id || { readingroom: "readingroom", attic: "cat", rootchamber: "oak", basement: "bell", icecave: "fp_icecave", lostvillage: "fog" }[room] || null;
  };
  window.__wwSecrets = { spots, found: () => Object.keys(S().secrets || {}), debug: () => ({ look: lookHere(), fHeld, lookT }), unfoundHere: () => SECRETS.filter((x) => !found(x.id) && x.where === here() && spots[x.id]).map((x) => ({ id: x.id, x: spots[x.id].x, z: spots[x.id].z })), places: () => placesHere().map(({ p, e }) => ({ id: p.id, kind: p.kind, when: p.when || null, room: p.room, r: SECRET_ROOMS[p.room].r, f: e.focus, gx: e.g.position.x, gz: e.g.position.z, gr: e.g.rotation.y, doors: e.parts.doors ? e.parts.doors.map((d) => d.dx) : null })), ia: () => interactable()?.label || null, cat: () => props.golden?.cat && { x: props.golden.cat.g.position.x, z: props.golden.cat.g.position.z, step: props.golden.cat.step, n: props.golden.cat.path.length, ladder: props.golden.cat.ladder.visible && { x: props.golden.cat.ladder.position.x, z: props.golden.cat.ladder.position.z } } }; // (for tests)

  // (the school's bookcase and bell already do things — these secrets go FIRST there)
  function priority() {
    // (secret places and "look closely" come before gathering, chatting…)
    if (!SECRET_ROOMS[here()]) {
      // (every secret's action wins over the other things nearby — but not the Gossip, so stories still work)
      const I = interactable();
      if (I && !/Gossip/.test(I.label)) return I;
    }
    if (here() !== "forest" || !forest) return null;
    if (near(spots.readingroom.x, spots.readingroom.z, 2.4) || near(spots.bell.x, spots.bell.z, 2.6)) return interactable();
    return null;
  }
  /** while you hold F at a secret: where the camera should look (and zoom) */
  const focus = () => (fHeld ? focusPos(lookHere()) : null);
  const canExamine = () => !!lookHere();
  return { interactable, update, priority, focus, canExamine };
}
