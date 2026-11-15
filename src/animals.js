// ------------------------------------------------------------
//  🐾 THE ANIMALS OF THE WORLD
//
//  🦌 RIDE — six great animals, each in its own SECRET REALM (secretPlaces.js).
//     Find the way in, then earn the animal's trust: bring its favourite food,
//     one visit at a time. After three visits it lets you ride it.
//       🦌 White Stag — the Moonlit Glade (Silverveil)     · berries
//       🦅 Great Eagle — the Eagle's Eyrie (Frostpine)     · fish
//       🐐 Mountain Goat — Goat Crag (Frostpine)           · pine needles
//       🐎 Wild Mustang — the Hidden Plains (Golden Hollow) · carrots
//       🦬 Bison — the Nomads' Camp (Golden Hollow)         · dry grass
//       🐢 Sea Turtle — Turtle Cove (Reedmere)              · water lilies (it SWIMS you across water)
//
//  🐺 COMPANIONS — befriend them out in the cities; they follow you like pets:
//       🐺 Ash, a wolf pup (Frostpine) — hurt in the snow; bring it a fish. Howls when danger is near.
//       🦊 Rusk, the fox scout (Golden Hollow) — give him an egg. Sniffs out secrets for you.
//       🦡 Digger, the badger (Golden Hollow) — help him dig. Digs up treasures as you go.
//       🦉 Quill, the messenger owl (Reedmere, only at NIGHT). Brings you a gift every day.
//       🦔 Old Bramble, the hedgehog healer (Reedmere) — bring her a medicinal mushroom. Heals you.
//
//  🐻 THE WILD (careful!):
//       🐻 the Old Bear of the Pines (Great Forest) — don't wake it! Berries make it a friend → honey
//       🦇 cave bats (Great Forest, at DUSK) — follow them to a hidden stash
//       🐊 the marsh crocodile (Shadowmere) — keep out of its reach
//       🐆 the snow leopard (Frostpine's edges) — it follows you… find its den
//       🐋 the singing whale (Reedmere's lagoon, at NIGHT) — dive with it to sunken treasure
// ------------------------------------------------------------
import * as THREE from "three";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { buildPet } from "./pets.js";
import { MOUNTS } from "./paradise.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

// ---------------------------------------------------------------- the rides
export const REALM_RIDES = {
  stag: { name: "Silverhorn the White Stag", icon: "🦌", food: "berry", foodName: "berries", room: "rr_glade" },
  eagle: { name: "Skyclaw the Great Eagle", icon: "🦅", food: "fish", foodName: "a fish", room: "rr_eyrie" },
  goat: { name: "Crag the Mountain Goat", icon: "🐐", food: "pine needle", foodName: "pine needles", room: "rr_crag" },
  mustang: { name: "Ember the Wild Mustang", icon: "🐎", food: "carrot", foodName: "carrots", room: "rr_plains" },
  bison: { name: "Thunderhoof the Bison", icon: "🦬", food: "dry grass", foodName: "dry grass", room: "rr_nomads" },
  turtle: { name: "Old Shellback the Sea Turtle", icon: "🐢", food: "water lily", foodName: "water lilies", room: "rr_cove" },
};
for (const [key, r] of Object.entries(REALM_RIDES)) MOUNTS.push({ key, icon: r.icon, name: r.name });
MOUNTS.push({ key: "leopard", icon: "🐆", name: "Frost the Snow Leopard" });
const TRUST_NEEDED = 3;

// 🐀 what the Secret Trader knows (650 coins a secret) — exactly where every animal is
const TRADER_PRICE = 650;
const WHERE = [
  { id: "stag", done: (s, a) => s.owned.stag || (s.secrets || {}).r_stag, text: "“The White Stag lives in the Moonlit Glade. Only at NIGHT, in SILVERVEIL, two white birches lean together like an archway. Look closely between them. Bring berries.”" },
  { id: "eagle", done: (s, a) => s.owned.eagle || (s.secrets || {}).r_eagle, text: "“The Great Eagle nests above the clouds. In the early MORNING only, a knotted rope hangs down the rock on FROSTPINE's southern hill. Climb it. Bring fish.”" },
  { id: "goat", done: (s, a) => s.owned.goat || (s.secrets || {}).r_goat, text: "“The mountain goats hide in a crag on FROSTPINE's western hill. At DUSK — and only then — the crack in the rock opens. They like pine needles.”" },
  { id: "mustang", done: (s, a) => s.owned.mustang || (s.secrets || {}).r_mustang, text: "“Wild mustangs run on the Hidden Plains — in the MORNING, a gap opens in GOLDEN HOLLOW's farthest hedge, to the south-west. Carrots, little one. Carrots.”" },
  { id: "bison", done: (s, a) => s.owned.bison || (s.secrets || {}).r_bison, text: "“The bison nomads camp in GOLDEN HOLLOW's far north-east field. At NOON — only at noon — a painted tent-flap appears there. Bison eat dry grass.”" },
  { id: "turtle", done: (s, a) => s.owned.turtle || (s.secrets || {}).r_turtle, text: "“The ancient sea turtle rests in a hidden cove. At NIGHT, when the tide is low, a sea-cave opens between the rocks on REEDMERE's north-east shore. It loves water lilies.”" },
  { id: "wolf", done: (s, a) => a.comp.wolf, text: "“A wolf pup lies hurt in the snow, south-east of FROSTPINE's square. It's starving. A fish would make you friends for life.”" },
  { id: "fox", done: (s, a) => a.comp.fox, text: "“Rusk the fox scout lurks at the edge of GOLDEN HOLLOW's wheat, north-west of the square. He'll work for an egg.”" },
  { id: "badger", done: (s, a) => a.comp.badger, text: "“A badger is digging himself silly, north-east of GOLDEN HOLLOW's square. Help him dig and he'll follow you anywhere.”" },
  { id: "owl", done: (s, a) => a.comp.owl, text: "“Quill the owl sits on an old post south-east of REEDMERE's square — only at NIGHT. Hold out your arm.”" },
  { id: "hedgehog", done: (s, a) => a.comp.hedgehog, text: "“Old Bramble the hedgehog healer sorts her herbs west of REEDMERE's square. She's out of medicinal mushrooms.”" },
  { id: "bear", done: (s, a) => a.bear, text: "“The Old Bear of the Pines sleeps in front of a honey cave, far WEST of your own cottage. Don't wake him. Three berries, left quietly, will do it.”" },
  { id: "bats", done: (s, a) => a.batFound, text: "“At DUSK, bats pour out of a great rock north-east of your cottage. Follow where they fly — they circle over something buried.”" },
  { id: "leopard", done: (s, a) => a.den, text: "“Out on FROSTPINE's edges, a snow leopard follows you. Its den is a snowy rock on the northern hill. Peek inside — and it may become your friend.”" },
  { id: "whale", done: (s, a) => a.whale, text: "“On still NIGHTS, a singing whale comes into REEDMERE's lagoon. Swim out to it when it surfaces, and hold on to its fin.”" },
  { id: "croc", done: (s, a) => a.crocTold, text: "“In SHADOWMERE's marsh lives a crocodile with yellow eyes. That one, little one, you should AVOID.”" },
];

registerKeepsake("leopardwhisker", "🐆", "A Snow Leopard's Silver Whisker (from its hidden den)");
registerKeepsake("whaleshell", "🐋", "The Whale's Song-Shell (hold it to your ear: it sings)");
ITEM_POWERS.leopardwhisker = { type: "warm", n: 0.3 };
ITEM_POWERS.whaleshell = { type: "air", n: 0.15 };

// ---------------------------------------------------------------- the companions
const COMPANIONS = [
  { key: "wolf", where: "frostpine", at: [20, 74], species: "wolf", variant: 0, name: "Ash, the Wolf Pup", icon: "🐺", need: ["Fish", 1],
    meet: "🐺 A wolf pup lies in the snow, shivering, one paw hurt. It growls weakly at you… but it's starving.",
    ask: "🐺 It needs food before it will trust you — bring it a fish.", label: "give the wolf pup a fish 🐟",
    won: "🐺 The pup gulps the fish, licks your paw… and limps after you. Ash is your companion now! (Ash howls when danger is near.)" },
  { key: "fox", where: "golden", at: [-38, -24], species: "fox", variant: 0, name: "Rusk, the Fox Scout", icon: "🦊", need: ["Egg", 1],
    meet: "🦊 A sharp-eyed fox watches you from the edge of the wheat. “I know every hidden path in this valley,” he seems to say. “What's it worth to you?”",
    ask: "🦊 Rusk wants an egg. (Golden Hollow's hens lay plenty.)", label: "offer Rusk an egg 🥚",
    won: "🦊 Rusk snaps up the egg and trots to your side. He's your scout now — he'll sniff out secrets wherever you go!" },
  { key: "badger", where: "golden", at: [34, -40], species: "badger", variant: 0, name: "Digger, the Badger", icon: "🦡", dig: 3,
    meet: "🦡 A badger is digging furiously at a hard patch of ground, muttering. He looks exhausted.",
    ask: "", label: "help the badger dig ⛏️",
    won: "🦡 CRUNCH — the ground gives way! Digger dusts himself off, looks at you, and decides you're all right. He follows you now (and digs up treasures as you go)." },
  { key: "owl", where: "reedmere", at: [26, 40], species: "owl", variant: 0, name: "Quill, the Messenger Owl", icon: "🦉", night: true,
    meet: "🦉 A big owl sits on the old post, watching the stars. She only comes out at night.",
    ask: "", label: "hold out your arm to the owl 🦉",
    won: "🦉 The owl studies you for a long moment… then hops onto your arm. Quill will carry messages for you — and bring you a little gift every day." },
  { key: "hedgehog", where: "reedmere", at: [-40, 18], species: "hedgehog", variant: 0, name: "Old Bramble, the Hedgehog Healer", icon: "🦔", need: ["Medicinal Mushroom", 1],
    meet: "🦔 An old hedgehog with spectacles is sorting herbs on a flat stone. “Healing's slow work, dearie. I'm out of my best mushroom.”",
    ask: "🦔 Old Bramble needs a medicinal mushroom (they grow in the forest).", label: "give Old Bramble a medicinal mushroom 🍄",
    won: "🦔 “Ah, a fine one!” Old Bramble packs up her herbs and comes with you. While she's with you, your hearts slowly heal." },
];

const Mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

// ---------------------------------------------------------------- wild animal models
function buildBear() {
  const g = new THREE.Group();
  const fur = Mat(0x5a3a22);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), fur);
  body.scale.set(1, 0.75, 1.4);
  body.position.y = 1;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), fur);
  head.position.set(0, 1.3, 1.9);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), Mat(0x8a6a4a));
  snout.position.set(0, 1.15, 2.55);
  g.add(body, head, snout);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), fur);
    ear.position.set(sx * 0.5, 1.9, 1.8);
    g.add(ear);
  }
  const eyes = [];
  for (const sx of [-0.25, 0.25]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    e.position.set(sx, 1.45, 2.5);
    g.add(e);
    eyes.push(e);
  }
  g.userData = { body, head, eyes };
  return g;
}
export function buildCroc() {
  const g = new THREE.Group();
  const skin = Mat(0x3a5a2a);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 3.4), skin);
  body.position.y = 0.15;
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 1.4), skin);
  jaw.position.set(0, 0.15, 2.3);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 6), skin);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.15, -2.8);
  g.add(body, jaw, tail);
  for (const sx of [-0.22, 0.22]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
    e.position.set(sx, 0.42, 1.7);
    g.add(e);
  }
  for (let k = 0; k < 6; k++) {
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), skin);
    ridge.position.set(0, 0.42, 1.2 - k * 0.5);
    g.add(ridge);
  }
  g.userData = { jaw };
  return g;
}
function buildLeopard() {
  const g = buildPet("cat", 3); // (a big white cat…)
  g.scale.setScalar(3.2);
  for (let k = 0; k < 10; k++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), Mat(0x3a3a40));
    spot.position.set((k % 2 ? 1 : -1) * 0.15, 0.42 + (k % 3) * 0.04, -0.25 + k * 0.05);
    g.add(spot);
  }
  return g;
}
function buildWhale() {
  const g = new THREE.Group();
  const skin = Mat(0x3a4a6a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 10), skin);
  body.scale.set(1, 0.7, 3);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8), Mat(0xd8d8e0));
  belly.scale.set(0.9, 0.5, 2.6);
  belly.position.y = -0.8;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 1.6), skin);
  tail.position.z = -9.5;
  g.add(body, belly, tail);
  for (const sx of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 1), skin);
    fin.position.set(sx * 3.2, -0.6, 2.5);
    fin.rotation.z = sx * 0.4;
    g.add(fin);
  }
  const spout = glow(0xe8f8ff, 4, 0);
  spout.position.set(0, 3, 4);
  g.add(spout);
  g.userData = { spout, tail };
  return g;
}

// ---------------------------------------------------------------- the whole thing
export function initAnimals(ctx) {
  // ctx: { world(), city(), outsideGroup, terrainHeight, isClear, home, dayTime(), say, chime, hurt, heal,
  //        packCount, packTake, addToPack, placePlayer, mouseRig, camera, petsSync, fadeThrough? }
  const S = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const day = () => S().days || 0;
  const A = () => {
    const a = (S().creatures ||= {});
    for (const k of ["trust", "visit", "comp", "dig", "told"]) a[k] ||= {};
    return a;
  };
  const dtm = () => (ctx.dayTime ? ctx.dayTime() : 0.5);
  const isNight = () => dtm() > 0.78 || dtm() < 0.2;
  const isDusk = () => dtm() > 0.66 && dtm() < 0.82;
  const save = () => saveCity();
  let hurtCool = 0;
  const ouch = (n, msg, from) => {
    if (hurtCool > 0) return;
    hurtCool = 2;
    ctx.hurt(n);
    ctx.say(msg, true);
    if (from) {
      const dx = me().x - from.x, dz = me().z - from.z, d = Math.hypot(dx, dz) || 1;
      ctx.placePlayer(me().x + (dx / d) * 4, me().z + (dz / d) * 4, ctx.mouseRig.rotation.y);
    }
  };
  const freeIn = (c, x, z, r = 1.5) => {
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = k * 1.1;
      const xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d;
      if (c.waterAt && c.waterAt(xx, zz) !== null) continue;
      if (c.colliders.some((cc) => Math.hypot(xx - cc.x, zz - cc.z) < cc.r + r)) continue;
      return { x: xx, z: zz };
    }
    return { x, z };
  };

  // ======================================================== 🦌 earning a great animal's trust (in its realm)
  let realmVisitedFor = null;
  window.addEventListener("ww-enter-place", (e) => (realmVisitedFor = e.detail.id + ":" + Date.now())); // (every time you step in is a new visit)
  function realmHere() {
    const Z = ctx.city();
    return Z && Z.realmMount ? Z.realmMount : null;
  }
  function realmInteract() {
    const R = realmHere();
    if (!R) return null;
    const key = R.key;
    const info = REALM_RIDES[key];
    const s = S();
    if (!near(R.x, R.z, 4.2)) return null;
    if (s.owned && s.owned[key]) return { label: `greet ${info.name} ${info.icon}`, act: () => ctx.say(`${info.icon} ${info.name} nuzzles you. (Ride with Caps Lock — choose who you ride in your backpack.)`, true) };
    const a = A();
    const trust = a.trust[key] || 0;
    const fed = a.visit[key] === realmVisitedFor;
    if (fed) return { label: `sit quietly near ${info.name.split(" ")[0]} ${info.icon}`, act: () => ctx.say(`${info.icon} It watches you calmly. (Trust ${trust}/${TRUST_NEEDED} — come back another time with more ${info.foodName}.)`, true) };
    const have = ctx.packCount(info.food) || ctx.packCount(info.food + "s") || 0;
    if (!have) return { label: `approach ${info.name.split(" ")[0]} slowly ${info.icon}`, act: () => ctx.say(`${info.icon} It backs away and stamps — it doesn't trust you yet. (Bring ${info.foodName}. Trust ${trust}/${TRUST_NEEDED}.)`, true) };
    return { label: `offer ${info.foodName} to ${info.name.split(" ")[0]} ${info.icon}`, act: () => {
      ctx.packTake(info.food, 1);
      a.visit[key] = realmVisitedFor;
      a.trust[key] = trust + 1;
      ctx.chime();
      if (a.trust[key] >= TRUST_NEEDED) {
        (s.owned ||= {})[key] = true;
        s.mount = key;
        ctx.say(`${info.icon} ${info.name} lowers its head… and lets you climb onto its back. It TRUSTS you! (Caps Lock to ride — switch rides in your backpack.)`, true);
      } else ctx.say(`${info.icon} It takes the ${info.foodName} from your paw, very carefully. (Trust ${a.trust[key]}/${TRUST_NEEDED} — leave, and come back again.)`, true);
      save();
    } };
  }

  // ======================================================== 🐺 companions
  const compBuilt = {}; // where → { c, list: [{ C, g, at }] }
  function buildCompanions(c) {
    if (compBuilt[c.id] && compBuilt[c.id].c === c) return compBuilt[c.id];
    const list = [];
    for (const C of COMPANIONS) {
      if (C.where !== c.id) continue;
      const at = freeIn(c, C.at[0], C.at[1]); // (measured from the middle of town)
      const g = buildPet(C.species, C.variant);
      g.scale.setScalar(C.species === "owl" ? 1.6 : 1.5);
      const y = c.height(at.x, at.z);
      g.position.set(at.x, y + (C.species === "owl" ? 1.6 : 0), at.z);
      g.rotation.y = Math.atan2(c.spots.arrive.x - at.x, c.spots.arrive.z - at.z);
      c.group.add(g);
      if (C.species === "owl") {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.6, 6), Mat(0x6a4a2a));
        post.position.set(at.x, y + 0.8, at.z);
        c.group.add(post);
      }
      if (C.key === "badger") {
        const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), Mat(0x6a5038));
        mound.scale.y = 0.5;
        mound.position.set(at.x + 1, y, at.z);
        c.group.add(mound);
      }
      list.push({ C, g, at });
    }
    return (compBuilt[c.id] = { c, list });
  }
  const isCompanion = (key) => !!A().comp[key];
  const activeCompanion = () => {
    const s = S();
    const p = (s.pets || []).find((x) => x.id === s.activePet);
    return p && p.companion;
  };
  function befriend(C) {
    const s = S();
    A().comp[C.key] = true;
    (s.pets ||= []).push({ id: "comp_" + C.key, species: C.species, variant: C.variant, name: C.name, companion: C.key });
    s.activePet = "comp_" + C.key;
    save();
    ctx.chime();
    if (ctx.petsSync) ctx.petsSync();
    ctx.say(C.won, true);
  }
  function companionInteract() {
    const c = ctx.city();
    if (!c || !compBuilt[c.id]) return null;
    for (const { C, at } of compBuilt[c.id].list) {
      if (isCompanion(C.key) || !near(at.x, at.z, 2.8)) continue;
      if (C.night && !isNight()) continue;
      if (C.need) {
        const [item, n] = C.need;
        if ((ctx.packCount(item) || 0) < n) return { label: `look at the ${C.species} ${C.icon}`, act: () => ctx.say(`${C.meet} ${C.ask}`, true) };
        return { label: C.label, act: () => {
          ctx.packTake(item, n);
          befriend(C);
        } };
      }
      if (C.dig) return { label: C.label, act: () => {
        const a = A();
        a.dig[C.key] = (a.dig[C.key] || 0) + 1;
        ctx.chime();
        if (a.dig[C.key] >= C.dig) befriend(C);
        else ctx.say(a.dig[C.key] === 1 ? `${C.meet} You grab a stick and start digging beside him. (${a.dig[C.key]}/${C.dig})` : `⛏️ Dig, dig… the ground is cracking! (${a.dig[C.key]}/${C.dig})`, true);
        save();
      } };
      return { label: C.label, act: () => befriend(C) };
    }
    return null;
  }
  // what each companion does while it follows you
  let compT = 0;
  let leopardWarm = 0;
  function companionPowers(dt) {
    // 🐆 riding Frost through the snow keeps you warm
    if (S().owned && S().owned.leopard && S().mount === "leopard" && here() === "frostpine" && (leopardWarm += dt) > 12) {
      leopardWarm = 0;
      window.dispatchEvent(new Event("ww-warm"));
    }
    const k = activeCompanion();
    if (!k) return;
    compT += dt;
    if (k === "hedgehog") ctx.heal(dt * 0.5); // 🦔 slow, steady healing

    if (k === "owl" && A().owlDay !== day()) {
      // 🦉 a gift every day
      A().owlDay = day();
      const coins = 15 + Math.floor(Math.random() * 25);
      S().coins = (S().coins || 0) + coins;
      save();
      ctx.say(`🦉 Quill swoops down and drops something in your paw — 🪙 ${coins} coins she found on her rounds!`, true);
    }
    if (compT < 30) return;
    compT = 0;
    if (k === "fox") {
      // 🦊 sniff out the nearest secret here
      const list = (window.__wwSecrets && window.__wwSecrets.unfoundHere && window.__wwSecrets.unfoundHere()) || [];
      let best = null, bd = 1e9;
      for (const p of list) {
        const d = Math.hypot(p.x - me().x, p.z - me().z);
        if (d < bd) [best, bd] = [p, d];
      }
      if (!best) return ctx.say("🦊 Rusk sniffs the air… and yawns. No secrets left around here.");
      const ang = Math.atan2(best.x - me().x, -(best.z - me().z)); // (0 = north)
      const dirs = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
      const dir = dirs[(Math.round(ang / (Math.PI / 4)) + 8) % 8];
      ctx.say(`🦊 Rusk's ears prick up. He trots a few steps ${dir} and looks back at you — something secret is that way (about ${Math.round(bd)} steps).`, true);
    }
    if (k === "badger" && Math.random() < 0.6) {
      const finds = ["Tiny Pebble", "Smooth Stone", "Ancient Seed", "Crystal Fragment", "Tiny Trinket", "Glass Fragment"];
      const it = finds[Math.floor(Math.random() * finds.length)];
      ctx.addToPack(it, 1, true);
      const coins = 2 + Math.floor(Math.random() * 6);
      S().coins = (S().coins || 0) + coins;
      save();
      ctx.say(`🦡 Digger scrabbles at the ground and proudly brings you… a ${it}! (and 🪙 ${coins})`);
    }
  }
  let howled = 0;
  function wolfWarn(dangerNear) {
    if (activeCompanion() !== "wolf" || !dangerNear) return;
    if (performance.now() - howled < 20000) return;
    howled = performance.now();
    ctx.say("🐺 Ash stops dead, hackles up — and HOWLS. Something dangerous is close!", true);
  }

  // ======================================================== 🐻 the wild
  let forest = null;
  function buildForest() {
    if (forest || !ctx.outsideGroup || !ctx.home) return;
    const H = ctx.terrainHeight;
    const pick = (dx, dz, r) => {
      for (let k = 0; k < 40; k++) {
        const a = k * 2.4, d = k * 1.2;
        const x = ctx.home.x + dx + Math.cos(a) * d, z = ctx.home.z + dz + Math.sin(a) * d;
        if ((!ctx.isClear || ctx.isClear(x, z, r)) && !(ctx.isWater && ctx.isWater(x, z))) return { x, z };
      }
      return { x: ctx.home.x + dx, z: ctx.home.z + dz };
    };
    // the bear, asleep in front of the honey cave
    const bc = pick(-72, 18, 6);
    const cave = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(4.5), Mat(0x6a6460));
    rock.scale.set(1.4, 0.9, 1);
    rock.position.set(0, 1.5, -3);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.6, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0604 }));
    mouth.position.set(0, 0.1, 1.15);
    const honey = glow(0xffc040, 1.5, 0.6);
    honey.position.set(0, 0.8, 0.6);
    cave.add(rock, mouth, honey);
    cave.position.set(bc.x, H(bc.x, bc.z), bc.z);
    cave.rotation.y = Math.atan2(ctx.home.x - bc.x, ctx.home.z - bc.z);
    ctx.outsideGroup.add(cave);
    if (ctx.addSolid) ctx.addSolid(bc.x - Math.sin(cave.rotation.y) * 3, bc.z - Math.cos(cave.rotation.y) * 3, 4.5);
    const bear = buildBear();
    const fx = Math.sin(cave.rotation.y), fz = Math.cos(cave.rotation.y);
    const bearAt = { x: bc.x + fx * 4, z: bc.z + fz * 4 };
    bear.position.set(bearAt.x, H(bearAt.x, bearAt.z), bearAt.z);
    bear.rotation.y = cave.rotation.y;
    ctx.outsideGroup.add(bear);
    const zzz = glow(0xffffff, 0.8, 0.6);
    zzz.position.set(bearAt.x, H(bearAt.x, bearAt.z) + 3, bearAt.z);
    ctx.outsideGroup.add(zzz);
    // the bats' rock (they pour out at dusk) and where they lead
    const br = pick(45, -58, 4);
    const batRock = new THREE.Mesh(new THREE.DodecahedronGeometry(3), Mat(0x5a5650));
    batRock.position.set(br.x, H(br.x, br.z) + 1.5, br.z);
    ctx.outsideGroup.add(batRock);
    if (ctx.addSolid) ctx.addSolid(br.x, br.z, 3);
    const stash = pick(80, -30, 1.5);
    const bats = [];
    for (let k = 0; k < 28; k++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.18), new THREE.MeshBasicMaterial({ color: 0x1a1418 }));
      b.visible = false;
      ctx.outsideGroup.add(b);
      bats.push(b);
    }
    forest = { bear, bearAt, zzz, cave: { x: bc.x + fx * 1.6, z: bc.z + fz * 1.6 }, awake: 0, br, stash, bats };
  }
  const cityWild = {};
  function buildCityWild(c) {
    if (cityWild[c.id] && cityWild[c.id].c === c) return cityWild[c.id];
    const W = { c };
    if (c.id === "frostpine") {
      W.leopard = buildLeopard();
      W.leopard.visible = false;
      c.group.add(W.leopard);
      const a = (250 * Math.PI) / 180;
      W.den = { x: Math.cos(a) * 104, z: Math.sin(a) * 104 };
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3), Mat(0xe8eef4));
      rock.position.set(W.den.x, c.height(W.den.x, W.den.z) + 1.2, W.den.z);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a1a24 }));
      const fa = Math.atan2(-W.den.x, -W.den.z);
      hole.position.set(W.den.x + Math.sin(fa) * 2.9, c.height(W.den.x, W.den.z) + 0.05, W.den.z + Math.cos(fa) * 2.9);
      hole.rotation.y = fa;
      c.group.add(rock, hole);
      c.colliders.push({ x: W.den.x, z: W.den.z, r: 2.8 });
      W.denFront = { x: W.den.x + Math.sin(fa) * 4, z: W.den.z + Math.cos(fa) * 4 };
      W.stalk = 0;
    }
    if (c.id === "reedmere") {
      W.whale = buildWhale();
      W.whale.visible = false;
      W.whaleAt = { x: 6, z: 8 };
      c.group.add(W.whale);
      W.song = 0;
    }
    if (c.id === "shadowmere") {
      W.croc = buildCroc();
      const p0 = { x: 12, z: 18 };
      W.crocHome = p0;
      c.group.add(W.croc);
    }
    return (cityWild[c.id] = W);
  }

  function wildUpdate(dt, t) {
    const w = here();
    let danger = false;
    if (w === "forest") {
      buildForest();
      if (forest) {
        const F = forest;
        const a = A();
        const H = ctx.terrainHeight;
        // 🐻 asleep (gently breathing)… unless you get too close
        const d = Math.hypot(me().x - F.bearAt.x, me().z - F.bearAt.z);
        F.awake = Math.max(0, F.awake - dt);
        F.bear.userData.body.scale.y = 0.75 + Math.sin(t * 1.2) * 0.03;
        F.bear.userData.eyes.forEach((e) => (e.scale.y = F.awake > 0 || a.bear ? 4 : 1));
        F.zzz.material.opacity = F.awake > 0 || a.bear ? 0 : 0.4 + Math.sin(t * 2) * 0.3;
        F.zzz.position.y = H(F.bearAt.x, F.bearAt.z) + 3 + ((t * 0.4) % 1);
        if (!a.bear && d < 3.6) {
          F.awake = 6;
          ouch(22, "🐻 The bear's eyes SNAP open — ROOOAR! A huge paw swipes you away! (Don't wake it… unless you've brought it something it likes.)", F.bearAt);
        }
        if (!a.bear && d < 12) danger = true;
        // 🦇 at dusk, the bats pour out of their rock and stream away — follow them!
        const batsOut = isDusk() && a.batDay !== day();
        F.bats.forEach((b, i) => {
          b.visible = batsOut;
          if (!batsOut) return;
          const k = ((t * 0.12 + i / F.bats.length) % 1);
          const x = F.br.x + (F.stash.x - F.br.x) * k + Math.sin(t * 3 + i) * 2;
          const z = F.br.z + (F.stash.z - F.br.z) * k + Math.cos(t * 2.5 + i) * 2;
          b.position.set(x, H(x, z) + 4 + Math.sin(t * 5 + i) * 1.2, z);
          b.rotation.set(Math.sin(t * 20 + i) * 0.6, Math.atan2(F.stash.x - F.br.x, F.stash.z - F.br.z), 0);
        });
      }
    }
    if (ctx.world() === "city" && ctx.city()) {
      const c = ctx.city();
      const W = ["frostpine", "reedmere", "shadowmere"].includes(c.id) ? buildCityWild(c) : null;
      if (["golden", "frostpine", "reedmere"].includes(c.id)) {
        const B = buildCompanions(c);
        for (const { C, g, at } of B.list) {
          g.visible = !isCompanion(C.key) && (!C.night || isNight());
          if (g.visible) g.rotation.y = Math.atan2(me().x - at.x, me().z - at.z);
        }
      }
      if (W && W.leopard) {
        // 🐆 out at the edge of town, something white follows you… it vanishes when you turn round
        const far = Math.hypot(me().x, me().z) > 55;
        W.stalk = far ? W.stalk + dt : 0;
        const show = far && W.stalk > 6 && !A().den;
        if (show) {
          const back = ctx.mouseRig.rotation.y + Math.PI;
          const lx = me().x + Math.sin(back) * 14, lz = me().z + Math.cos(back) * 14;
          W.leopard.position.set(lx, c.height(lx, lz), lz);
          W.leopard.rotation.y = Math.atan2(me().x - lx, me().z - lz);
          // seen? it melts into the snow
          const cam = ctx.camera;
          const fwd = new THREE.Vector3();
          cam.getWorldDirection(fwd);
          const to = new THREE.Vector3(lx - cam.position.x, 0, lz - cam.position.z).normalize();
          W.leopard.visible = fwd.x * to.x + fwd.z * to.z < 0.6;
        } else W.leopard.visible = false;
      }
      if (W && W.whale) {
        // 🐋 on still nights the whale comes into the lagoon and sings
        const on = isNight();
        W.song += dt;
        const up = on && W.song % 40 < 22;
        W.whale.visible = on;
        if (on) {
          W.whale.position.set(W.whaleAt.x + Math.sin(t * 0.1) * 6, up ? -1.4 + Math.sin(t * 0.8) * 0.3 : -6, W.whaleAt.z + Math.cos(t * 0.1) * 6);
          W.whale.rotation.y = t * 0.1 + Math.PI / 2;
          W.whale.userData.spout.material.opacity = up && W.song % 40 < 3 ? 0.8 : 0;
          W.whale.userData.tail.rotation.x = Math.sin(t) * 0.3;
        }
        W.whaleUp = up;
      }
      if (W && W.croc) {
        // 🐊 drifting in the marsh… and it LUNGES
        const H0 = W.crocHome;
        const d = Math.hypot(me().x - W.croc.position.x, me().z - W.croc.position.z);
        if (d < 9) danger = true;
        W.rest = Math.max(0, (W.rest || 0) - dt);
        let tx = H0.x + Math.sin(t * 0.15) * 6, tz = H0.z + Math.cos(t * 0.12) * 6;
        // it lunges at you — but never strays far from its marsh, and backs off after a bite
        const leashed = Math.hypot(me().x - H0.x, me().z - H0.z) < 9;
        const chasing = d < 6 && leashed && !W.rest && !(window.__wwCalm && window.__wwCalm()); // (😌 the Song of Calm makes it drowsy)
        if (chasing) [tx, tz] = [me().x, me().z];
        const dx = tx - W.croc.position.x, dz = tz - W.croc.position.z, dd = Math.hypot(dx, dz) || 1;
        const sp = chasing ? 4.5 : W.rest ? 3 : 1.2;
        W.croc.position.x += (dx / dd) * Math.min(dd, sp * dt);
        W.croc.position.z += (dz / dd) * Math.min(dd, sp * dt);
        W.croc.position.y = c.height(W.croc.position.x, W.croc.position.z) - 0.1;
        W.croc.rotation.y = Math.atan2(dx, dz);
        W.croc.userData.jaw.rotation.x = d < 4 ? -0.5 + Math.sin(t * 12) * 0.3 : 0;
        if (d < 2.2 && !W.rest && !(window.__wwCalm && window.__wwCalm())) {
          // (push you away from its home, so the bite always throws you clear)
          const from = { x: H0.x, z: H0.z };
          if (Math.hypot(me().x - from.x, me().z - from.z) < 0.5) from.x -= 1;
          ouch(18, "🐊 SNAP! The crocodile lunges out of the marsh! Get AWAY from it!", from);
          W.rest = 4;
        }
      }
    }
    wolfWarn(danger);
  }

  function wildInteract() {
    const w = here();
    const a = A();
    if (w === "forest" && forest) {
      const F = forest;
      if (!a.bear && near(F.bearAt.x, F.bearAt.z, 6)) {
        if ((ctx.packCount("Berry") || 0) >= 3) return { label: "creep up and leave 3 berries by the sleeping bear 🫐", act: () => {
          ctx.packTake("Berry", 3);
          a.bear = true;
          save();
          ctx.chime();
          ctx.say("🐻 The bear sniffs… opens one eye… and gobbles the berries. Then it rolls aside with a huge contented sigh. The Old Bear of the Pines is your friend — and the honey cave is open to you!", true);
        } };
        return { label: "look at the sleeping bear 🐻", act: () => ctx.say("🐻 An ENORMOUS bear, snoring in front of a cave that smells of honey. Don't wake it… bears love berries, though (3 should do).", true) };
      }
      if (a.bear && near(F.cave.x, F.cave.z, 3)) return { label: a.honeyDay === day() ? "the honey's all gone for today 🍯" : "take some honey from the cave 🍯", act: () => {
        if (a.honeyDay === day()) return ctx.say("🍯 The bear has eaten the rest. Come back tomorrow!");
        a.honeyDay = day();
        ctx.addToPack("Honey Drop", 4, true);
        save();
        ctx.chime();
        ctx.say("🍯 The bear watches lazily as you fill your paws with golden honey. (+4 Honey Drops)", true);
      } };
      if (isDusk() && a.batDay !== day() && near(F.stash.x, F.stash.z, 3)) return { label: "dig where the bats are circling 🦇", act: () => {
        a.batDay = day();
        a.batFound = true;
        const coins = 30 + Math.floor(Math.random() * 40);
        S().coins = (S().coins || 0) + coins;
        ctx.addToPack("Crystal Fragment", 2, true);
        save();
        ctx.chime();
        ctx.say(`🦇 Where the bats circle, the earth is soft — and someone buried a little pouch here long ago! 🪙 ${coins} and 2 Crystal Fragments.`, true);
      } };
    }
    if (ctx.world() === "city" && ctx.city()) {
      const W = cityWild[ctx.city().id];
      if (W && W.denFront && !a.den && near(W.denFront.x, W.denFront.z, 3)) return { label: "peek into the snowy den 🐆", act: () => {
        a.den = true;
        (S().owned ||= {}).leopardwhisker = true;
        const s = S();
        s.owned.leopard = true;
        s.mount = "leopard";
        save();
        ctx.chime();
        ctx.say("🐆 Inside the den, two silver eyes blink at you — the snow leopard that's been following you. It studies you a long time… nudges a silver whisker into your paw… then pads out, HUGE in the daylight, and crouches low so you can climb on. Frost is your friend! (Caps Lock to ride — he keeps you warm in the snow.)", true);
      } };
      if (W && W.whale && W.whaleUp && near(W.whale.position.x, W.whale.position.z, 9)) return { label: a.whale ? "listen to the whale sing 🐋" : "grab the whale's fin and DIVE 🐋", act: () => {
        if (a.whale) return ctx.say("🐋 The whale's song rolls through the water — long, low, and so beautiful it makes your whiskers tremble.", true);
        a.whale = true;
        const s = S();
        s.coins = (s.coins || 0) + 150;
        (s.owned ||= {}).whaleshell = true;
        save();
        ctx.chime();
        ctx.say("🐋 You grab the fin — and DOWN you go, through the dark water, to a sunken ship on the lagoon floor! Gold spills from its hold. The whale brings you back up, singing. (🪙 150 · 🐋 the Whale's Song-Shell)", true);
      } };
    }
    return null;
  }

  // 🐀 the Secret Trader
  function traderInteract() {
    const Z = ctx.city();
    if (!Z || !Z.trader || !near(Z.trader.x, Z.trader.z, 3.5)) return null;
    const s = S();
    const a = A();
    a.told ||= {};
    const next = WHERE.find((w) => !w.done(s, a) && !a.told[w.id]);
    if (!next) return { label: "talk to the Secret Trader 🐀", act: () => ctx.say("🐀 “You've bought every secret I have about the creatures of this land. Go — and use them well.” He closes his eye.", true) };
    return { label: `pay the Secret Trader 🪙 ${TRADER_PRICE} for a secret 🐀`, act: sellSecret };
  }
  // (his secret — also when you ring his brass bell, wherever you are)
  function sellSecret() {
    const s = S();
    const a = A();
    a.told ||= {};
    const next = WHERE.find((w) => !w.done(s, a) && !a.told[w.id]);
    if (!next) return ctx.say("🐀 “You've bought every secret I have about the creatures of this land. Go — and use them well.”", true);
    if ((s.coins || 0) < TRADER_PRICE) return ctx.say(`🐀 The giant rat yawns, showing every one of his teeth. “${TRADER_PRICE} coins, little one. Not a coin less. Come back when your purse is heavier.”`, true);
    s.coins -= TRADER_PRICE;
    a.told[next.id] = true;
    if (next.id === "croc") a.crocTold = true;
    save();
    ctx.chime();
    ctx.say(`🐀 The coins vanish into his paw. He leans close, whiskers tickling your ears, and whispers: ${next.text}`, true);
  }
  window.__wwTraderSecret = sellSecret;

  window.__wwAnimals = { comps: () => Object.values(compBuilt).flatMap((b) => b.list.map((x) => ({ key: x.C.key, x: x.at.x, z: x.at.z }))), state: () => A(), forest: () => forest && { bear: forest.bearAt, cave: forest.cave, stash: forest.stash, rock: forest.br }, wild: () => { const c = ctx.city(); const W = c && cityWild[c.id]; return W && { den: W.denFront, whale: W.whale && { x: W.whale.position.x, z: W.whale.position.z, up: W.whaleUp }, croc: W.croc && { x: W.croc.position.x, z: W.croc.position.z } }; } }; // (for tests)
  return {
    interactable() {
      return traderInteract() || realmInteract() || companionInteract() || wildInteract();
    },
    update(dt) {
      const t = performance.now() / 1000;
      hurtCool = Math.max(0, hurtCool - dt);
      if (realmHere() && !realmVisitedFor) realmVisitedFor = "first:" + Date.now();
      wildUpdate(dt, t);
      companionPowers(dt);
    },
  };
}
