// ------------------------------------------------------------
//  🗺️  QUEST ZONES — two whole worlds just for the big adventures.
//  They look like a "city" to main.js (height, platforms, colliders,
//  water, update), so walking, jumping and the camera all just work.
//
//  🏔️ THE PACT PEAKS (from Frostpine) — the Signal Fires of the Northern
//     Pact. A ridge trail high over the abyss: drifting ice floes, a
//     crumbling ice bridge, a wind-swept col, a boulder chute — and
//     Renata's old Pact Fire on the summit.
//  🌊 THE DROWNED DEEP (under Reedmere's lagoon) — the Drowned Library.
//     Kelp forests, air vents, jellyfish, a lantern-jawed anglerfish in
//     the trench, a friendly Silver Eel… and pages turning in the dark.
// ------------------------------------------------------------
import * as THREE from "three";
import { signPost, signTexture } from "./signs.js";
import { makeWisp } from "./wisp.js";
import { PLACES, decorPlace } from "./secretPlaces.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const B = (c, e = {}) => new THREE.MeshBasicMaterial({ color: c, ...e });
const glow = (c, s, op = 0.8) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const hash = (x, z) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const lerp = (a, b, t) => a + (b - a) * t;
/** where (x,z) sits on segment a→b: { t 0..1, d distance, side signed } */
function onSeg(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  const px = a[0] + dx * t;
  const pz = a[1] + dz * t;
  const L = Math.sqrt(L2);
  return { t, d: Math.hypot(x - px, z - pz), side: ((x - a[0]) * dz - (z - a[1]) * dx) / L, nx: dz / L, nz: -dx / L, len: L };
}
export const ZONE_INFO = {
  peaks: { name: "The Pact Peaks", sub: "high above Frostpine", icon: "🏔️", zone: true },
  deep: { name: "The Drowned Deep", sub: "beneath Reedmere's lagoon", icon: "🌊", zone: true },
  underglow: { name: "The Underglow", sub: "far beneath Roothaven", icon: "🌑", zone: true },
  sky: { name: "The Open Sky", sub: "high above the treetops", icon: "🎈", zone: true },
  cloud: { name: "Nimbusreach", sub: "the City in the Clouds", icon: "☁️", zone: true },
  vault: { name: "The Moonkeepers' Vault", sub: "hidden under the forest", icon: "🧩", zone: true },
  sea: { name: "The Open Sea", sub: "beyond Reedmere's lagoon", icon: "⛵", zone: true },
  circus: { name: "The Circus Tent", sub: "the Greatest Show Under the Canopy", icon: "🎪", zone: true },
  starway: { name: "The Starway", sub: "the road to the stars", icon: "✨", zone: true },
  cliffs: { name: "The Moonlit Cliffs", sub: "the only way to Silverveil", icon: "🧗", zone: true },
  isle: { name: "The Moonless Isle", sub: "far across the sea", icon: "🏝️", zone: true },
  aurora: { name: "The Aurora Reach", sub: "a frozen continent far in the west", icon: "🌌", zone: true },
  sunrise: { name: "The Sunrise Lands", sub: "a lost continent across the sea", icon: "🌅", zone: true },
  pass: { name: "The Starlight Pass", sub: "high above Frostpine — only dog sleds go here", icon: "🏔️", zone: true },
  roost: { name: "Emberroost", sub: "the lost home of the dragons, above the clouds", icon: "🐉", zone: true },
  storm: { name: "The Great Storm", sub: "a thunderstorm that never ends, high above the world", icon: "⛈️", zone: true },
  castlehall: { name: "Your Castle's Great Hall", sub: "long live Queen Thistle!", icon: "🏰", zone: true },
  readingroom: { name: "The Secret Reading Room", sub: "behind the bookcase", icon: "📚", zone: true },
  attic: { name: "The Forgotten Attic", sub: "where the shop cat goes", icon: "🐈", zone: true },
  rootchamber: { name: "The Root Chamber", sub: "beneath the oldest oak", icon: "🌳", zone: true },
  basement: { name: "Under the School", sub: "a room no one remembers", icon: "🔔", zone: true },
  icecave: { name: "The Ice Cave", sub: "behind the frozen waterfall", icon: "🧊", zone: true },
  smugglers: { name: "The Smugglers' Hold", sub: "under Golden Hollow — found with a map and a key", icon: "🏴‍☠️", zone: true },
  crystalgrotto: { name: "The Crystal Grotto", sub: "opened by the crystals' songs", icon: "💎", zone: true },
  lostvillage: { name: "The Village in the Fog", sub: "on no map at all", icon: "🌫️", zone: true },
  shadowmere: { name: "Shadowmere", sub: "a dim, misty marsh where the shadows live", icon: "🌑", zone: true },
  clockwork: { name: "The Clockwork Mountain", sub: "where the Great Season Clock ticks", icon: "⚙️", zone: true },
  coral: { name: "Coralmere", sub: "the sunken city under Reedmere's lagoon", icon: "🐚", zone: true },
  trophies: { name: "The Trophy Room", sub: "every treasure from every adventure", icon: "🏆", zone: true },
  rink: { name: "Frostpine's Frozen Lake", sub: "skate, spin — and win the judges' scores", icon: "⛸️", zone: true },
  pyramid: { name: "Inside the Temple", sub: "the Temple of the First Moonkeeper", icon: "🏛️", zone: true },
  frozensea: { name: "The Frozen Sea", sub: "from the Snow King's palace to the frost giants' glacier", icon: "👑", zone: true },
  jungle: { name: "The Lost Jungle", sub: "nobody has ever come back from it — until now", icon: "🌴", zone: true },
  amberwood: { name: "Amberwood", sub: "the wood where it's always autumn", icon: "🍂", zone: true },
  giantgarden: { name: "The Giant's Garden", sub: "where everything is HUGE", icon: "🌻", zone: true },
  wispglade: { name: "The Glade Within the Wisp Ring", sub: "a secret glade that opens at moonrise", icon: "✨", zone: true },
  falls: { name: "The Thundering Falls", sub: "the great waterfall that ran dry", icon: "🌈", zone: true },
  skycup: { name: "The Sky Cup Canyon", sub: "where the dragons race", icon: "🏆", zone: true },
  crystal: { name: "The Crystal Caverns", sub: "deep under the mountains — they hum like thunder", icon: "💎", zone: true },
  paradise: { name: "Paradise", sub: "behind the wall of Dapple's Stable — shh!", icon: "🌺", zone: true },
  glowcap: { name: "The Glowcap Kingdom", sub: "a glowing kingdom deep under the forest floor", icon: "🍄", zone: true },
  cinder: { name: "Emberpeak", sub: "the grumpy volcano beyond Frostpine", icon: "🌋", zone: true },
  dunes: { name: "The Whispering Dunes", sub: "a hidden desert, where the first Moonkeeper's lantern lies buried", icon: "🏜️", zone: true },
};
export const isZone = (id) => !!ZONE_INFO[id];
export function buildZone(id) {
  return id === "peaks" ? buildPeaks() : id === "underglow" ? buildUnderglow() : id === "sky" ? buildSky() : id === "cloud" ? buildCloud() : id === "vault" ? buildVault() : id === "sea" ? buildSea() : id === "circus" ? buildCircus() : id === "starway" ? buildStarway() : id === "cliffs" ? buildCliffs() : id === "isle" ? buildIsle() : id === "pass" ? buildPass() : id === "sunrise" ? buildSunrise() : id === "aurora" ? buildAurora() : id === "roost" ? buildRoost() : id === "storm" ? buildStorm() : id === "dunes" ? buildDunes() : id === "pyramid" ? buildPyramid() : id === "rink" ? buildRink() : id === "trophies" ? buildTrophies() : id === "coral" ? buildCoral() : id === "clockwork" ? buildClockwork() : id === "shadowmere" ? buildShadowmere() : SECRET_ROOMS[id] ? buildSecretRoom(id) : id === "castlehall" ? buildCastleHall() : id === "cinder" ? buildCinder() : id === "glowcap" ? buildGlowcap() : id === "paradise" ? buildParadise() : id === "crystal" ? buildCrystal() : id === "skycup" ? buildSkyCup() : id === "falls" ? buildFalls() : id === "wispglade" ? buildWispGlade() : id === "giantgarden" ? buildGiantGarden() : id === "amberwood" ? buildAmberwood() : id === "jungle" ? buildJungle() : id === "frozensea" ? buildFrozenSea() : buildDeep();
}
function baseZone(id, R) {
  const group = new THREE.Group();
  group.visible = false;
  const colliders = [];
  const platforms = [];
  return {
    id,
    group,
    colliders,
    platforms,
    heat: [],
    R,
    people: {},
    props: {},
    // (arrive: where goCity() sets you down — each zone fills its own in)
    spots: { waystone: { x: 99999, z: 99999 }, arrive: { x: 0, z: 0 } },
    waterAt: () => null,
    waterNear: () => 0,
    warmAt: () => false,
    constrain(p) {
      const d = Math.hypot(p.x, p.z);
      if (d > R) {
        p.x *= R / d;
        p.z *= R / d;
      }
      for (const c of colliders) {
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const dd = Math.hypot(dx, dz);
        const cr = c.r + 0.25; // (+ the mouse's own body, so she doesn't clip into things)
        if (dd < cr && dd > 0.0001 && !(p.y > (c.top ?? Infinity))) {
          p.x = c.x + (dx / dd) * cr;
          p.z = c.z + (dz / dd) * cr;
        }
      }
    },
  };
}

// ======================================================================
//  🏔️ THE PACT PEAKS
// ======================================================================
export const ABYSS = -60;
// the trail: each piece is solid ground ("path", "narrow", "chute"), or a
// gap you cross on "floes" (drifting) or a "crumble" bridge (ice that falls)
const ROUTE = [
  { a: [0, 104, 0], b: [0, 74, 4], w: 8, kind: "path" },
  { a: [0, 74, 4], b: [-34, 54, 9], w: 5, kind: "path" },
  { a: [-34, 54, 9], b: [-62, 22, 13], kind: "floes" },
  { a: [-62, 22, 13], b: [-54, -4, 16], w: 5.5, kind: "path" },
  { a: [-54, -4, 16], b: [-14, -16, 21], kind: "crumble" },
  { a: [-14, -16, 21], b: [22, -10, 24], w: 5, kind: "path" },
  { a: [22, -10, 24], b: [54, -40, 31], w: 1.9, kind: "narrow" },
  { a: [54, -40, 31], b: [42, -60, 34], w: 6, kind: "path" },
  { a: [42, -60, 34], b: [8, -84, 48], w: 7.5, kind: "chute" },
];
const SUMMIT = { x: 0, z: -96, y: 50, r: 13 };
/** the signal fires — each one a checkpoint, a warm-up, and a quest step */
export const PEAK_FIRES = [
  { key: "camp", name: "Base Camp", x: -5, z: 101, y: 0, lit: true },
  { key: "f1", name: "the First Signal Fire", x: -62, z: 22, y: 13 },
  { key: "f2", name: "the Second Signal Fire", x: -14, z: -16, y: 21 },
  { key: "f3", name: "the Third Signal Fire", x: 54, z: -40, y: 31 },
  { key: "pact", name: "Renata's Pact Fire", x: 0, z: -96, y: 50 },
];
function buildPeaks() {
  const Z = baseZone("peaks", 120);
  Z.wardrobe = "frostpine"; // (your Frostpine woollies keep you warm up here)
  Z.spots.arrive = { x: 1.5, z: 99 }; // Base Camp
  const G = Z.group;
  const live = [];
  // the ground: the trail and its landings — everything else is the abyss
  const pads = [];
  for (const s of ROUTE) if (s.kind !== "floes" && s.kind !== "crumble") pads.push({ x: s.a[0], z: s.a[1], y: s.a[2], r: s.w / 2 + 1.6 }, { x: s.b[0], z: s.b[1], y: s.b[2], r: s.w / 2 + 1.6 });
  for (const f of PEAK_FIRES) pads.push({ x: f.x, z: f.z, y: f.y, r: 5.5 });
  // two safe nooks off the boulder chute
  const chute = ROUTE[8];
  const nooks = [0.33, 0.66].map((t, i) => {
    const o = onSeg(0, 0, chute.a, chute.b);
    const sx = i ? 1 : -1;
    const x = lerp(chute.a[0], chute.b[0], t) + o.nx * sx * 6;
    const z = lerp(chute.a[1], chute.b[1], t) + o.nz * sx * 6;
    return { x, z, y: lerp(chute.a[2], chute.b[2], t), r: 2.6 };
  });
  pads.push(...nooks);
  Z.nooks = nooks;
  Z.height = (x, z) => {
    let best = ABYSS;
    if (Math.hypot(x - SUMMIT.x, z - SUMMIT.z) < SUMMIT.r) best = SUMMIT.y;
    for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r) best = Math.max(best, p.y);
    for (const s of ROUTE) {
      if (s.kind === "floes" || s.kind === "crumble") continue;
      const o = onSeg(x, z, [s.a[0], s.a[1]], [s.b[0], s.b[1]]);
      if (o.d < s.w / 2) best = Math.max(best, lerp(s.a[2], s.b[2], o.t));
    }
    return best;
  };
  Z.route = ROUTE;
  Z.summit = SUMMIT;
  Z.onSeg = onSeg;

  // ---- what it looks like ----
  const rock = M(0x6a6e78);
  const snow = M(0xf4f8ff);
  const ice = M(0xbfe6ff, { transparent: true, opacity: 0.85, emissive: 0x3a6a8a, emissiveIntensity: 0.2 });
  // trail strips: rock with a snow top, dropping into a cliff below
  for (const s of ROUTE) {
    if (s.kind === "floes" || s.kind === "crumble") continue;
    const o = onSeg(0, 0, [s.a[0], s.a[1]], [s.b[0], s.b[1]]);
    const yaw = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    const n = Math.max(2, Math.ceil(o.len / 4));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const x = lerp(s.a[0], s.b[0], (t0 + t1) / 2);
      const z = lerp(s.a[1], s.b[1], (t0 + t1) / 2);
      const y = lerp(s.a[2], s.b[2], (t0 + t1) / 2);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(s.w, 1, o.len / n + 0.5), snow);
      seg.position.set(x, y - 0.5, z);
      seg.rotation.order = "YXZ"; // (yaw first, then tilt up the slope)
      seg.rotation.y = yaw;
      seg.rotation.x = -Math.atan2(s.b[2] - s.a[2], o.len);
      // a solid wall of rock beneath, narrowing as it drops into the clouds
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.92, 30, o.len / n + 0.6), rock);
      cliff.position.set(x, y - 16, z);
      cliff.rotation.y = yaw;
      cliff.scale.x = 1;
      G.add(seg, cliff);
    }
  }
  for (const p of pads) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r * 0.9, 1, 14), snow);
    top.position.set(p.x, p.y - 0.5, p.z);
    const below = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.95, 34, 7), rock);
    below.position.set(p.x, p.y - 18, p.z);
    below.rotation.x = Math.PI;
    G.add(top, below);
  }
  {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(SUMMIT.r, SUMMIT.r * 0.8, 1.4, 20), snow);
    top.position.set(SUMMIT.x, SUMMIT.y - 0.7, SUMMIT.z);
    const below = new THREE.Mesh(new THREE.ConeGeometry(SUMMIT.r, 60, 9), rock);
    below.position.set(SUMMIT.x, SUMMIT.y - 31, SUMMIT.z);
    below.rotation.x = Math.PI;
    G.add(top, below);
    // a ring of old standing stones round Renata's fire
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3 + (k % 3) * 0.6, 0.6), M(0x8a8e9a));
      st.position.set(SUMMIT.x + Math.cos(a) * 9.5, SUMMIT.y + 1.5, SUMMIT.z + Math.sin(a) * 9.5);
      st.rotation.y = -a;
      G.add(st);
      Z.colliders.push({ x: st.position.x, z: st.position.z, r: 0.8 });
    }
  }
  // prayer-flag lines along the trail (red, gold, white, blue, green)
  const flagCols = [0xd84a4a, 0xf0c040, 0xf4f4f4, 0x4a8ad8, 0x5ab85a];
  ROUTE.forEach((s, si) => {
    if (s.kind !== "path") return;
    for (let k = 0; k < 7; k++) {
      const t = (k + 0.5) / 7;
      const o = onSeg(0, 0, [s.a[0], s.a[1]], [s.b[0], s.b[1]]);
      const x = lerp(s.a[0], s.b[0], t) + o.nx * (s.w / 2 - 0.3);
      const z = lerp(s.a[1], s.b[1], t) + o.nz * (s.w / 2 - 0.3);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), M(flagCols[(k + si) % 5], { side: THREE.DoubleSide }));
      f.position.set(x, lerp(s.a[2], s.b[2], t) + 2.4, z);
      f.rotation.y = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) + Math.PI / 2;
      G.add(f);
      live.push((tt) => (f.rotation.z = Math.sin(tt * 4 + k) * 0.25));
    }
  });
  // 🔥 the signal fires: stone braziers (dark until you light them)
  Z.fires = PEAK_FIRES.map((f) => {
    const g = new THREE.Group();
    g.position.set(f.x, f.y, f.z);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.7, 0.8, 10), M(0x5a5a62));
    bowl.position.y = 1.1;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.8, 8), M(0x4a4a52));
    post.position.y = 0.4;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 7), B(0xff8a2a, { transparent: true, opacity: 0.9 }));
    flame.position.y = 2.3;
    const halo = glow(0xff9a40, f.key === "pact" ? 14 : 7);
    halo.position.y = 2.4;
    const light = new THREE.PointLight(0xff9040, f.key === "pact" ? 40 : 18, f.key === "pact" ? 40 : 22, 1.6);
    light.position.y = 3;
    g.add(bowl, post, flame, halo, light);
    if (f.key === "pact") {
      g.scale.setScalar(1.8);
      // snow heaped over Renata's old fire-ring, until you brush it away
      const heap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), snow);
      heap.position.y = 0.9;
      g.add(heap);
      f.heap = heap;
    }
    G.add(g);
    Z.colliders.push({ x: f.x, z: f.z, r: f.key === "pact" ? 2.2 : 1.3 });
    const fire = { ...f, g, flame, halo, light, setLit(on) {
      flame.visible = halo.visible = light.visible = on;
    } };
    fire.setLit(!!f.lit);
    live.push((t) => {
      flame.scale.set(1 + Math.sin(t * 11 + f.x) * 0.1, 1 + Math.sin(t * 7 + f.z) * 0.2, 1);
    });
    return fire;
  });
  // 🧊 drifting ice floes over the first gap
  Z.floes = [];
  {
    const s = ROUTE[2];
    const o = onSeg(0, 0, [s.a[0], s.a[1]], [s.b[0], s.b[1]]);
    const N = 8;
    for (let i = 1; i <= N; i++) {
      const t = i / (N + 1);
      const bx = lerp(s.a[0], s.b[0], t);
      const bz = lerp(s.a[1], s.b[1], t);
      const y = lerp(s.a[2], s.b[2], t);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.4, 0.6, 8), ice);
      G.add(m);
      const pl = { x: bx, z: bz, r: 1.7, y: y + 0.05 };
      Z.platforms.push(pl);
      const fl = { m, pl, bx, bz, y, nx: o.nx, nz: o.nz, amp: 1.6 + (i % 3) * 0.6, sp: 0.6 + (i % 4) * 0.18, ph: i * 1.7 };
      Z.floes.push(fl);
    }
  }
  // 🧊 the crumbling ice bridge
  Z.slabs = [];
  {
    const s = ROUTE[4];
    const o = onSeg(0, 0, [s.a[0], s.a[1]], [s.b[0], s.b[1]]);
    const N = 12;
    for (let i = 1; i <= N; i++) {
      const t = i / (N + 1);
      const x = lerp(s.a[0], s.b[0], t);
      const z = lerp(s.a[1], s.b[1], t);
      const y = lerp(s.a[2], s.b[2], t);
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 2.6), ice.clone());
      m.position.set(x, y - 0.2, z);
      m.rotation.y = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      G.add(m);
      const pl = { x, z, r: 1.45, y };
      Z.platforms.push(pl);
      Z.slabs.push({ m, pl, x, z, y, stand: 0, gone: 0, len: o.len });
    }
  }
  // 🪨 boulders for the chute (rolled by quests.js)
  Z.boulders = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), M(0x7a7e88));
    m.visible = false;
    G.add(m);
    Z.boulders.push({ m, t: 1, side: 0, on: false });
  }
  // scenery: a ring of great snowy peaks, and a sea of cloud far below
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 + hash(k, 1) * 0.2;
    const r = 150 + hash(k, 2) * 60;
    const h = 60 + hash(k, 3) * 90;
    const pk = new THREE.Mesh(new THREE.ConeGeometry(30 + hash(k, 4) * 25, h, 7), rock);
    pk.position.set(Math.cos(a) * r, -40 + h / 2, Math.sin(a) * r);
    const cap = new THREE.Mesh(new THREE.ConeGeometry((30 + hash(k, 4) * 25) * 0.42, h * 0.42, 7), snow);
    cap.position.set(pk.position.x, -40 + h - h * 0.21, pk.position.z);
    G.add(pk, cap);
  }
  {
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xf4f8ff, transparent: true, opacity: 0.55, depthWrite: false });
    for (let k = 0; k < 60; k++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(8 + hash(k, 5) * 10, 8, 6), cloudMat);
      c.scale.y = 0.35;
      c.position.set((hash(k, 6) - 0.5) * 300, -28 + hash(k, 7) * 6, (hash(k, 8) - 0.5) * 300);
      G.add(c);
      live.push((t) => (c.position.x += Math.sin(t * 0.05 + k) * 0.01));
    }
  }
  // 🌌 the aurora — faint until the Pact Fire is lit, then blazing
  Z.aurora = new THREE.Group();
  {
    const cols = [0x6affb8, 0x8ab8ff, 0xd88aff];
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.PlaneGeometry(260, 40, 40, 1);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[k], transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(0, 120 + k * 14, -160 + k * 30);
      m.rotation.x = -0.3;
      Z.aurora.add(m);
      const base = geo.attributes.position.array.slice();
      live.push((t) => {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + Math.sin(base[i * 3] * 0.03 + t * 0.6 + k) * 10);
        p.needsUpdate = true;
      });
    }
    G.add(Z.aurora);
  }
  Z.setAurora = (strength) => Z.aurora.children.forEach((m) => (m.material.opacity = 0.12 + strength * 0.5));
  // falling snow round the climber
  {
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(hash(i, 1) - 0.5) * 60, hash(i, 2) * 30, (hash(i, 3) - 0.5) * 60], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const snowfall = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9 }));
    snowfall.frustumCulled = false;
    G.add(snowfall);
    Z.snowfall = snowfall;
  }
  Z.update = (t, dt, player) => {
    for (const f of live) f(t, dt);
    // floes drift side to side
    for (const f of Z.floes) {
      const s = Math.sin(t * f.sp + f.ph) * f.amp;
      f.pl.x = f.bx + f.nx * s;
      f.pl.z = f.bz + f.nz * s;
      f.m.position.set(f.pl.x, f.y - 0.25 + Math.sin(t * 1.3 + f.ph) * 0.05, f.pl.z);
    }
    // slabs crack under you… and fall
    for (const sl of Z.slabs) {
      if (sl.gone > 0) {
        sl.gone -= dt;
        sl.m.position.y -= dt * 18;
        if (sl.gone <= 0) {
          sl.m.position.y = sl.y - 0.2;
          sl.m.visible = true;
          sl.pl.y = sl.y;
          sl.stand = 0;
          sl.m.material.color.setHex(0xbfe6ff);
        }
        continue;
      }
      const on = Math.hypot(player.x - sl.x, player.z - sl.z) < sl.pl.r && Math.abs(player.y - sl.y) < 0.6;
      sl.stand = on ? sl.stand + dt : Math.max(0, sl.stand - dt * 0.5);
      sl.m.material.color.setHex(sl.stand > 0.35 ? 0xffffff : 0xbfe6ff);
      sl.m.position.x = sl.x + (sl.stand > 0.35 ? Math.sin(t * 60) * 0.06 : 0);
      if (sl.stand > 0.75) {
        sl.gone = 4.5; // (it comes back after a while)
        sl.pl.y = -999;
      }
    }
    const sp = Z.snowfall.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let y = sp.getY(i) - dt * 3;
      if (y < 0) y += 30;
      sp.setY(i, y);
      sp.setX(i, sp.getX(i) + dt * (Z.gust || 0) * 4);
    }
    sp.needsUpdate = true;
    Z.snowfall.position.set(player.x, player.y - 10, player.z);
  };
  return Z;
}

// ======================================================================
//  🌊 THE DROWNED DEEP
// ======================================================================
export const DEEP = {
  anchor: { x: 0, z: 92 },
  library: { x: 0, z: -78 },
  vents: [{ x: 4, z: 70 }, { x: -22, z: 42 }, { x: 24, z: 30 }, { x: -6, z: 8 }, { x: 40, z: -12 }, { x: -40, z: -14 }, { x: 18, z: -40 }, { x: -16, z: -52 }],
  // the five lost pages
  pages: [
    { x: -30, z: 30, where: "in a clearing in the kelp forest" },
    { x: 46, z: 12.5, where: "tucked against the wreck of an old raft" }, // (beside the wreck — not inside its solid hull)
    { x: -52, z: -26, where: "in the jellyfish garden" },
    { x: 30, z: -46, where: "at the bottom of the trench" },
    { x: -6, z: -64, where: "on the library's front steps" },
  ],
  // the Silver Eel's swim: anchor → kelp → wreck → trench edge → library
  eelPath: [[0, 84], [-8, 60], [-28, 34], [-10, 14], [20, 4], [44, 16], [30, -8], [0, -26], [-30, -30], [-12, -50], [0, -66]],
  trench: { x: 30, z: -44, r: 15 },
};
function buildDeep() {
  const Z = baseZone("deep", 108);
  Z.wardrobe = "reedmere";
  Z.spots.arrive = { x: DEEP.anchor.x, z: DEEP.anchor.z - 3 }; // at the foot of the anchor rope
  const G = Z.group;
  const live = [];
  const T = DEEP.trench;
  Z.height = (x, z) => {
    const dune = Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.07) * 0.7 + Math.sin((x + z) * 0.03) * 1.2;
    const tr = Math.hypot(x - T.x, z - T.z);
    const trench = tr < T.r ? -7 * (1 - (tr / T.r) ** 2) : 0;
    const lib = Math.hypot(x - DEEP.library.x, z - DEEP.library.z) < 22 ? 1.2 : 0;
    return dune + trench + lib;
  };
  Z.deep = DEEP;
  // the sand
  {
    const geo = new THREE.PlaneGeometry(240, 240, 90, 90);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const col = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, Z.height(x, z));
      const c = new THREE.Color(0xc8b88a).lerp(new THREE.Color(0x3a6a7a), Math.min(1, Math.hypot(x, z) / 130) * 0.6);
      if (Math.hypot(x - T.x, z - T.z) < T.r) c.lerp(new THREE.Color(0x1a2a3a), 0.6);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // 🌿 the kelp forest — tall swaying strands you must weave between
  const kelpMat = M(0x3a8a4a, { emissive: 0x0a3a1a, emissiveIntensity: 0.4 });
  for (let k = 0; k < 170; k++) {
    const x = (hash(k, 11) - 0.5) * 120;
    const z = 20 + hash(k, 12) * 52;
    if (Math.abs(x - lerp(-8, -28, (60 - z) / 26)) < 4 && z > 30 && z < 64) continue; // (the eel's lane stays open)
    if (Math.hypot(x + 30, z - 30) < 6 || DEEP.vents.some((v) => Math.hypot(x - v.x, z - v.z) < 4)) continue;
    const h = 8 + hash(k, 13) * 10;
    const strand = new THREE.Group();
    strand.position.set(x, Z.height(x, z), z);
    const segs = [];
    let parent = strand;
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(new THREE.ConeGeometry(0.35 - s * 0.05, h / 5, 5), kelpMat);
      seg.position.y = s === 0 ? h / 10 : h / 5;
      parent.add(seg);
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.4), M(0x5aa85a, { side: THREE.DoubleSide }));
      leaf.position.set(0.35, 0, 0);
      leaf.rotation.z = -0.6;
      seg.add(leaf);
      segs.push(seg);
      parent = seg;
    }
    G.add(strand);
    Z.colliders.push({ x, z, r: 0.7 });
    live.push((t) => segs.forEach((s, i) => (s.rotation.z = Math.sin(t * 0.9 + k + i * 0.6) * 0.12)));
  }
  // 🪸 coral, glowing in a hundred colors
  const coralCols = [0xff6a8a, 0xffa84a, 0xb86aff, 0x4ad8ff, 0xffe06a, 0x6affb8];
  for (let k = 0; k < 140; k++) {
    const x = (hash(k, 21) - 0.5) * 200;
    const z = (hash(k, 22) - 0.5) * 200;
    if (Math.hypot(x, z) > 104 || Math.hypot(x - DEEP.library.x, z - DEEP.library.z) < 20) continue;
    const c = coralCols[k % coralCols.length];
    const g = new THREE.Group();
    g.position.set(x, Z.height(x, z), z);
    for (let b = 0; b < 4; b++) {
      const br = new THREE.Mesh(k % 2 ? new THREE.ConeGeometry(0.25, 1.6, 5) : new THREE.SphereGeometry(0.5, 6, 5), M(c, { emissive: c, emissiveIntensity: 0.45 }));
      br.position.set((b - 1.5) * 0.4, 0.6 + (b % 2) * 0.3, (b % 2) * 0.3);
      br.rotation.z = (b - 1.5) * 0.3;
      g.add(br);
    }
    G.add(g);
  }
  // 💨 air vents: rising columns of silver bubbles
  Z.vents = DEEP.vents.map((v, i) => {
    const g = new THREE.Group();
    g.position.set(v.x, Z.height(v.x, v.z), v.z);
    const rockRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.4, 6, 12), M(0x5a5a62));
    rockRing.rotation.x = Math.PI / 2;
    rockRing.position.y = 0.2;
    g.add(rockRing, glow(0xcfefff, 3));
    const bubbles = [];
    for (let b = 0; b < 14; b++) {
      const bb = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (b % 3) * 0.06, 6, 5), B(0xe8f8ff, { transparent: true, opacity: 0.7 }));
      g.add(bb);
      bubbles.push(bb);
    }
    live.push((t) => bubbles.forEach((bb, b) => {
      const k = (t * 0.8 + b * 0.37 + i) % 4;
      bb.position.set(Math.sin(b * 3 + t * 2) * 0.4, k * 4, Math.cos(b * 2 + t * 2) * 0.4);
    }));
    G.add(g);
    return v;
  });
  // ⛵ the wreck of an old raft
  {
    const g = new THREE.Group();
    g.position.set(46, Z.height(46, 18), 18);
    g.rotation.set(0.15, 0.6, 0.2);
    for (let k = 0; k < 8; k++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 6), M(0x5a4a32));
      log.rotation.z = Math.PI / 2;
      log.position.set(0, 0.4, (k - 3.5) * 0.85);
      g.add(log);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 5), M(0x4a3a24));
    mast.position.set(0, 3, 0);
    mast.rotation.z = 0.5;
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), M(0xd8ccb0, { side: THREE.DoubleSide }));
    sail.position.set(1.2, 3.6, 0.3);
    sail.rotation.z = 0.5;
    g.add(mast, sail);
    G.add(g);
    Z.colliders.push({ x: 46, z: 18, r: 3 });
  }
  // 🎐 jellyfish drifting in their garden
  Z.jellies = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const r = 3 + (k % 4) * 3.2;
    const x = -52 + Math.cos(a) * r;
    const z = -26 + Math.sin(a) * r;
    const g = new THREE.Group();
    const col = [0xff8ad8, 0x8ad8ff, 0xd8a8ff][k % 3];
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), B(col, { transparent: true, opacity: 0.65 }));
    g.add(bell, glow(col, 3));
    for (let s = 0; s < 6; s++) {
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 3), B(col, { transparent: true, opacity: 0.6 }));
      tent.position.set(Math.cos(s) * 0.4, -0.9, Math.sin(s) * 0.4);
      g.add(tent);
    }
    G.add(g);
    const j = { g, x, z, ph: k * 1.3, y: 0 };
    Z.jellies.push(j);
    live.push((t) => {
      j.y = Z.height(x, z) + 0.9 + (Math.sin(t * 0.8 + j.ph) * 0.5 + 0.5) * 3;
      g.position.set(x + Math.sin(t * 0.3 + j.ph) * 1.2, j.y, z + Math.cos(t * 0.25 + j.ph) * 1.2);
      bell.scale.y = 1 + Math.sin(t * 3 + j.ph) * 0.15;
    });
  }
  // 🐟 the lantern-jawed anglerfish, circling the trench
  {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), M(0x2a2a3a));
    body.scale.set(1, 0.85, 1.3);
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 8, 1, true), M(0x1a1a24, { side: THREE.DoubleSide }));
    jaw.rotation.x = Math.PI / 2;
    jaw.position.z = 1.9;
    for (let s = 0; s < 8; s++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 3), B(0xf4f4e8));
      tooth.position.set(Math.cos(s) * 0.7, Math.sin(s) * 0.4 - 0.1, 2.1);
      tooth.rotation.x = Math.PI;
      g.add(tooth);
    }
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), M(0x2a2a3a));
    stalk.position.set(0, 1.7, 1.2);
    stalk.rotation.x = 0.6;
    const lure = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), B(0xd8ff6a));
    lure.position.set(0, 2.4, 2.1);
    const lureGlow = glow(0xd8ff6a, 4);
    lureGlow.position.copy(lure.position);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), B(0xffe0a0));
    eyeL.position.set(-0.8, 0.5, 1.3);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.8;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 4), M(0x2a2a3a));
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -2.2;
    g.add(body, jaw, stalk, lure, lureGlow, eyeL, eyeR, tail);
    const light = new THREE.PointLight(0xd8ff6a, 10, 14, 1.5);
    light.position.copy(lure.position);
    g.add(light);
    G.add(g);
    Z.angler = { g, x: T.x, z: T.z, tail, ang: 0 };
  }
  // 🐍 the Silver Eel — your guide through the dark
  {
    const g = new THREE.Group();
    const segs = [];
    for (let s = 0; s < 9; s++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.28 - s * 0.022, 8, 6), M(0xd8e4f0, { emissive: 0x6a8ab8, emissiveIntensity: 0.6, metalness: 0.4 }));
      g.add(seg);
      segs.push(seg);
    }
    g.add(glow(0xbfe6ff, 3.5));
    G.add(g);
    Z.eel = { g, segs, i: 0, x: DEEP.eelPath[0][0], z: DEEP.eelPath[0][1], trail: [] };
  }
  // 📚 THE DROWNED LIBRARY — a domed hall of fallen shelves
  {
    const L = DEEP.library;
    const y = Z.height(L.x, L.z);
    const stone = M(0x8a9a9a, { emissive: 0x1a2a3a, emissiveIntensity: 0.3 });
    const mossy = M(0x5a7a6a);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      if (k === 3 || k === 4) continue; // (the doorway faces the sea)
      const x = L.x + Math.cos(a) * 14;
      const z = L.z + Math.sin(a) * 14;
      const h = 9 + (k % 3) * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, h, 10), k % 2 ? stone : mossy);
      col.position.set(x, y + h / 2, z);
      G.add(col);
      Z.colliders.push({ x, z, r: 1.4 });
    }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), M(0x7a8a8a, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    dome.position.set(L.x, y + 10, L.z);
    G.add(dome);
    // shelves of books, still standing (and some fallen)
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const shelf = new THREE.Group();
      shelf.position.set(L.x + Math.cos(a) * 9, y, L.z + Math.sin(a) * 9);
      shelf.rotation.y = -a + Math.PI / 2;
      if (k % 4 === 1) shelf.rotation.z = 0.9;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.7), M(0x4a3a2a));
      frame.position.y = 2;
      shelf.add(frame);
      for (let b = 0; b < 14; b++) {
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.45), M(new THREE.Color().setHSL((b * 0.13 + k * 0.07) % 1, 0.5, 0.45).getHex()));
        bk.position.set(-1.2 + (b % 7) * 0.38, 1.1 + Math.floor(b / 7) * 1.3, 0.15);
        shelf.add(bk);
      }
      G.add(shelf);
      if (shelf.rotation.z === 0) Z.colliders.push({ x: shelf.position.x, z: shelf.position.z, r: 1.4 });
    }
    // the vault: a round door with the Moonkeepers' crescent, sealed until the pages come home
    const vault = new THREE.Group();
    vault.position.set(L.x, y, L.z - 6);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.5, 20), M(0xb8a878, { metalness: 0.5, emissive: 0x3a3010, emissiveIntensity: 0.4 }));
    door.rotation.x = Math.PI / 2;
    door.position.y = 2.3;
    const moon = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.18, 6, 16, Math.PI * 1.3), B(0xe8f0ff));
    moon.position.set(0, 2.3, 0.3);
    moon.rotation.z = 0.8;
    vault.add(door, moon);
    G.add(vault);
    Z.vault = { g: vault, door, x: L.x, z: L.z - 3.5 };
    Z.colliders.push({ x: L.x, z: L.z - 6, r: 2.4 });
    // floating pages drifting round the dome (the ones you hear turning)
    for (let k = 0; k < 24; k++) {
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), B(0xf4ecd8, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
      G.add(pg);
      live.push((t) => {
        const a = t * 0.15 + k;
        pg.position.set(L.x + Math.cos(a) * (5 + (k % 5)), y + 3 + (k % 6) + Math.sin(t + k) * 0.5, L.z + Math.sin(a) * (5 + (k % 5)));
        pg.rotation.set(t * 0.7 + k, t * 0.5, 0);
      });
    }
    const light = new THREE.PointLight(0x9fd8ff, 20, 34, 1.4);
    light.position.set(L.x, y + 8, L.z);
    G.add(light);
  }
  // ☀️ light shafts from the surface, swaying
  for (let k = 0; k < 18; k++) {
    const x = (hash(k, 31) - 0.5) * 170;
    const z = (hash(k, 32) - 0.5) * 170;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 4.5, 60, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    shaft.position.set(x, 28, z);
    shaft.rotation.z = 0.25;
    G.add(shaft);
    live.push((t) => (shaft.material.opacity = 0.05 + Math.sin(t * 0.5 + k) * 0.03));
  }
  // the surface far above, shimmering
  {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ color: 0x6ac8e8, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    s.rotation.x = Math.PI / 2;
    s.position.y = 46;
    G.add(s);
  }
  // 🐠 schools of little fish
  for (let sch = 0; sch < 7; sch++) {
    const col = [0xffa84a, 0x6ad8ff, 0xffe06a, 0xff6a8a][sch % 4];
    const fish = [];
    const g = new THREE.Group();
    for (let f = 0; f < 14; f++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 4), M(col, { emissive: col, emissiveIntensity: 0.3 }));
      m.rotation.x = Math.PI / 2;
      g.add(m);
      fish.push(m);
    }
    G.add(g);
    const cx = (hash(sch, 41) - 0.5) * 140;
    const cz = (hash(sch, 42) - 0.5) * 140;
    live.push((t) => {
      const a = t * 0.3 + sch;
      g.position.set(cx + Math.cos(a) * 12, 4 + Math.sin(t * 0.4 + sch) * 2, cz + Math.sin(a) * 12);
      g.rotation.y = -a;
      fish.forEach((m, f) => m.position.set(Math.sin(f * 2.1 + t * 2) * 1.2, Math.cos(f * 1.3 + t) * 0.6, (f % 5) * 0.5));
    });
  }
  // the anchor rope you came down on
  {
    const A = DEEP.anchor;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 50, 5), M(0xb89a6a));
    rope.position.set(A.x, 25, A.z);
    const anchor = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.18, 6, 12, Math.PI), M(0x5a5a62, { metalness: 0.6 }));
    anchor.position.set(A.x, Z.height(A.x, A.z) + 0.8, A.z);
    anchor.rotation.z = Math.PI;
    G.add(rope, anchor, (() => { const h = glow(0xfff0c0, 4); h.position.set(A.x, Z.height(A.x, A.z) + 2, A.z); return h; })());
  }
  // rising bubbles round you
  {
    const N = 300;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(hash(i, 1) - 0.5) * 40, hash(i, 2) * 20, (hash(i, 3) - 0.5) * 40], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdff4ff, size: 0.18, transparent: true, opacity: 0.7 }));
    pts.frustumCulled = false;
    G.add(pts);
    Z.bubbles = pts;
  }
  Z.update = (t, dt, player) => {
    for (const f of live) f(t, dt);
    const sp = Z.bubbles.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let y = sp.getY(i) + dt * 1.5;
      if (y > 20) y -= 20;
      sp.setY(i, y);
    }
    sp.needsUpdate = true;
    Z.bubbles.position.set(player.x, player.y - 4, player.z);
    // the anglerfish circles the trench (it turns toward you if you're close)
    const A = Z.angler;
    A.ang += dt * 0.35;
    const tx = T.x + Math.cos(A.ang) * 9;
    const tz = T.z + Math.sin(A.ang) * 9;
    const toYou = Math.hypot(player.x - A.x, player.z - A.z) < 9;
    const gx = toYou ? player.x : tx;
    const gz = toYou ? player.z : tz;
    const d = Math.hypot(gx - A.x, gz - A.z);
    const sp2 = toYou ? 4.2 : 6;
    if (d > 0.1) {
      A.x += ((gx - A.x) / d) * Math.min(d, sp2 * dt);
      A.z += ((gz - A.z) / d) * Math.min(d, sp2 * dt);
      A.g.rotation.y = Math.atan2(gx - A.x, gz - A.z);
    }
    A.g.position.set(A.x, Z.height(A.x, A.z) + 2.2 + Math.sin(t) * 0.3, A.z);
    A.tail.rotation.y = Math.sin(t * 6) * 0.4;
  };
  return Z;
}

// ======================================================================
//  🌑 THE UNDERGLOW — Phase 13. A glowing cavern world far beneath
//  Roothaven, where the lost Moonkeepers of the year 412 went to guard the
//  moon's Heartstone from a hungry Shadow.
// ======================================================================
export const UG = {
  arrive: { x: 0, z: 96 },
  camp: { x: 0, z: 64 },
  grove: { x: -58, z: 18 }, // 🍄 the Mushroom Grove
  lake: { x: 58, z: 18, r: 16, island: 3.6 }, // 🪞 the Mirror Lake
  maze: { x: 0, z: -24, cell: 6, n: 6 }, // 🌫️ the Whispering Dark
  hollow: { x: 0, z: -80, r: 18 }, // the Shadow's Hollow
};
// (the maze: a fixed little labyrinth — walls between cells, carved once)
function carveMaze(n, seed) {
  let a = seed;
  const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  const walls = { h: [], v: [] }; // h[r][c]: wall on the SOUTH of cell; v[r][c]: wall on the EAST
  for (let r = 0; r < n; r++) {
    walls.h.push(Array(n).fill(true));
    walls.v.push(Array(n).fill(true));
  }
  const seen = new Set();
  const stack = [[0, 0]];
  seen.add("0,0");
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && x >= 0 && y < n && x < n && !seen.has(y + "," + x));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [y, x] = nb[Math.floor(rnd() * nb.length)];
    if (y > r) walls.h[r][c] = false;
    if (y < r) walls.h[y][x] = false;
    if (x > c) walls.v[r][c] = false;
    if (x < c) walls.v[y][x] = false;
    seen.add(y + "," + x);
    stack.push([y, x]);
  }
  return walls;
}
function buildUnderglow() {
  const Z = baseZone("underglow", 104);
  Z.spots.arrive = UG.arrive;
  const G = Z.group;
  const live = [];
  const L = UG.lake;
  const inLake = (x, z) => Math.hypot(x - L.x, z - L.z) < L.r && Math.hypot(x - L.x, z - L.z) > L.island;
  Z.height = (x, z) => {
    if (inLake(x, z)) return ABYSS; // the Mirror Lake is bottomless dark
    const bump = Math.sin(x * 0.07) * 0.6 + Math.cos(z * 0.06) * 0.5;
    const hd = Math.hypot(x - UG.hollow.x, z - UG.hollow.z);
    const bowl = hd < UG.hollow.r ? -1.2 * (1 - (hd / UG.hollow.r) ** 2) : 0;
    return bump * (hd < UG.hollow.r + 4 ? 0.2 : 1) + bowl;
  };
  Z.ug = UG;
  Z.inLake = inLake;
  // the cavern floor (dark blue-violet, glowing faintly)
  {
    const geo = new THREE.PlaneGeometry(230, 230, 100, 100);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const col = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const h = Z.height(x, z);
      p.setY(i, Math.max(h, -6));
      const c = new THREE.Color(0x2a2448).lerp(new THREE.Color(0x3a3a6a), hash(Math.floor(x / 4), Math.floor(z / 4)) * 0.5);
      if (h < -2) c.setHex(0x05040a);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // the cavern wall + a ceiling of stalactites and glowworms
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(110, 112, 60, 40, 1, true), M(0x1a1630, { side: THREE.BackSide }));
    wall.position.y = 20;
    G.add(wall);
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(112, 40), M(0x120f22, { side: THREE.DoubleSide }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 46;
    G.add(ceil);
    for (let k = 0; k < 90; k++) {
      const x = (hash(k, 51) - 0.5) * 200;
      const z = (hash(k, 52) - 0.5) * 200;
      if (Math.hypot(x, z) > 104) continue;
      const h = 4 + hash(k, 53) * 12;
      const st = new THREE.Mesh(new THREE.ConeGeometry(0.8 + hash(k, 54) * 1.6, h, 6), M(0x2a2444));
      st.rotation.x = Math.PI;
      st.position.set(x, 46 - h / 2, z);
      G.add(st);
    }
    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(hash(i, 61) - 0.5) * 210, 38 + hash(i, 62) * 7, (hash(i, 63) - 0.5) * 210], i * 3);
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    G.add(new THREE.Points(g2, new THREE.PointsMaterial({ color: 0x8affd8, size: 0.45, transparent: true, opacity: 0.85 })));
  }
  // crystals growing everywhere, in moon colors
  const crystalCols = [0x8ab8ff, 0xb88aff, 0x6affd8];
  for (let k = 0; k < 120; k++) {
    const x = (hash(k, 71) - 0.5) * 200;
    const z = (hash(k, 72) - 0.5) * 200;
    if (Math.hypot(x, z) > 100 || inLake(x, z) || Math.hypot(x - UG.camp.x, z - UG.camp.z) < 10) continue;
    if (Math.abs(x - UG.maze.x) < 22 && Math.abs(z - UG.maze.z) < 22) continue;
    if (Math.hypot(x - UG.hollow.x, z - UG.hollow.z) < UG.hollow.r + 3) continue;
    const c = crystalCols[k % 3];
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 + hash(k, 73), 0).scale(0.6, 2, 0.6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 }));
    cr.position.set(x, Z.height(x, z) + 0.8, z);
    cr.rotation.z = (hash(k, 74) - 0.5) * 0.6;
    G.add(cr, (() => { const h = glow(c, 3, 0.5); h.position.set(x, Z.height(x, z) + 1, z); return h; })());
  }
  // where you arrive: the bottom of the Great Descent (a root-stair from above)
  {
    const A = UG.arrive;
    for (let k = 0; k < 14; k++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.2), M(0x5a3e24));
      step.position.set(A.x + Math.sin(k * 0.5) * 3, k * 2.4 + 0.2, A.z + 6 + Math.cos(k * 0.5) * 3);
      step.rotation.y = k * 0.5;
      G.add(step);
    }
    const h = glow(0xfff0c0, 5);
    h.position.set(A.x, 2, A.z + 3);
    G.add(h);
  }
  // 🔥 the lost Moonkeepers' camp: a cold blue fire and five ghostly mice
  Z.ghosts = [];
  {
    const C = UG.camp;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.3, 6, 12), M(0x4a4a5a));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(C.x, Z.height(C.x, C.z) + 0.2, C.z);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 7), new THREE.MeshBasicMaterial({ color: 0x8ad8ff, transparent: true, opacity: 0.85 }));
    fire.position.set(C.x, Z.height(C.x, C.z) + 1, C.z);
    const halo = glow(0x8ad8ff, 9);
    halo.position.copy(fire.position);
    const light = new THREE.PointLight(0x8ad8ff, 25, 26, 1.5);
    light.position.set(C.x, Z.height(C.x, C.z) + 3, C.z);
    G.add(ring, fire, halo, light);
    Z.colliders.push({ x: C.x, z: C.z, r: 1.6 });
    live.push((t) => fire.scale.set(1 + Math.sin(t * 9) * 0.1, 1 + Math.sin(t * 6) * 0.2, 1));
  }
  // 🍄 the Mushroom Grove: giant glowing mushrooms — climb the caps!
  Z.caps = [];
  {
    const C = UG.grove;
    const N = 11;
    for (let i = 0; i < N; i++) {
      const a = i * 1.05;
      const r = 4.5 + (i % 2) * 2.5;
      const x = C.x + Math.cos(a) * r;
      const z = C.z + Math.sin(a) * r;
      const top = 1.6 + i * 1.45;
      const col = [0x6affd8, 0xb88aff, 0xff8ad8][i % 3];
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, top, 8), M(0xe8e0d0));
      stem.position.set(x, Z.height(x, z) + top / 2, z);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.9, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(col, { emissive: col, emissiveIntensity: 0.55 }));
      cap.scale.y = 0.5;
      cap.position.set(x, Z.height(x, z) + top - 0.1, z);
      G.add(stem, cap);
      Z.colliders.push({ x, z, r: 0.75, top: Z.height(x, z) + top - 0.5 });
      Z.platforms.push({ x, z, r: 1.8, y: Z.height(x, z) + top + 0.35 });
      Z.caps.push({ x, z, y: Z.height(x, z) + top + 0.35 });
    }
    const last = Z.caps[Z.caps.length - 1];
    Z.lanternSpots = { grove: { x: last.x, z: last.z, y: last.y } };
  }
  // 🪞 the Mirror Lake: bottomless dark, crossed on crystal stones that SINK
  Z.stones = [];
  {
    const water = new THREE.Mesh(new THREE.RingGeometry(L.island, L.r, 40), new THREE.MeshBasicMaterial({ color: 0x0a0a1a, side: THREE.DoubleSide }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(L.x, -0.3, L.z);
    // the "mirror": stars reflected in the dark water
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 300 }, (_, i) => {
        const k = Math.floor(i / 3);
        const a = hash(k, 81) * Math.PI * 2;
        const r = L.island + hash(k, 82) * (L.r - L.island);
        return i % 3 === 0 ? L.x + Math.cos(a) * r : i % 3 === 1 ? -0.25 : L.z + Math.sin(a) * r;
      }), 3)),
      new THREE.PointsMaterial({ color: 0xe8f0ff, size: 0.25 })
    );
    G.add(water, stars);
    const island = new THREE.Mesh(new THREE.CylinderGeometry(L.island, L.island * 0.8, 1, 16), M(0x3a3a6a));
    island.position.set(L.x, -0.5, L.z);
    G.add(island);
    // a winding path of stones from the south shore to the island
    const path = [[0, -15.2], [2.6, -12.6], [0.4, -10], [-2.4, -7.6], [0, -5]];
    for (const [dx, dz] of path) {
      const x = L.x + dx;
      const z = L.z + dz;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.9 }));
      m.position.set(x, -0.05, z);
      G.add(m);
      const pl = { x, z, r: 1.2, y: 0.15 };
      Z.platforms.push(pl);
      Z.stones.push({ m, pl, x, z, y: 0.15, stand: 0, gone: 0 });
    }
    Z.lanternSpots.lake = { x: L.x, z: L.z, y: 0 };
  }
  // 🌫️ the Whispering Dark: a maze of black rock, full of shadow-wisps
  {
    const MZ = UG.maze;
    const n = MZ.n;
    const cs = MZ.cell;
    const x0 = MZ.x - (n * cs) / 2;
    const z0 = MZ.z - (n * cs) / 2;
    const walls = carveMaze(n, 4127);
    const wallMat = M(0x14101e, { emissive: 0x2a1a4a, emissiveIntensity: 0.25 });
    const wallSeg = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, len + 0.8), wallMat);
      m.position.set((ax + bx) / 2, 2, (az + bz) / 2);
      m.rotation.y = Math.atan2(bx - ax, bz - az);
      G.add(m);
      for (let t2 = 0; t2 <= 1.0001; t2 += 0.8 / len) Z.colliders.push({ x: lerp(ax, bx, t2), z: lerp(az, bz, t2), r: 0.75 });
    };
    // outer walls (the way in: a gap on the north side, cell 0)
    wallSeg(x0 + cs, z0 + n * cs, x0 + n * cs, z0 + n * cs); // north (gap at the first cell)
    wallSeg(x0, z0, x0 + n * cs, z0); // south
    wallSeg(x0, z0, x0, z0 + n * cs); // west
    wallSeg(x0 + n * cs, z0, x0 + n * cs, z0 + n * cs); // east
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // (row 0 is the north row)
        const cx = x0 + c * cs;
        const cz = z0 + (n - 1 - r) * cs;
        if (r < n - 1 && walls.h[r][c]) wallSeg(cx, cz, cx + cs, cz);
        if (c < n - 1 && walls.v[r][c]) wallSeg(cx + cs, cz, cx + cs, cz + cs);
      }
    }
    Z.maze = { x0, z0, cs, n };
    // 🌿 moon-moss glows along the ONE true path (follow the glow!)
    {
      const prev = { "0,0": null };
      const q = [[0, 0]];
      while (q.length) {
        const [r, c] = q.shift();
        if (r === n - 1 && c === n - 1) break;
        const mv = [];
        if (r < n - 1 && !walls.h[r][c]) mv.push([r + 1, c]);
        if (r > 0 && !walls.h[r - 1][c]) mv.push([r - 1, c]);
        if (c < n - 1 && !walls.v[r][c]) mv.push([r, c + 1]);
        if (c > 0 && !walls.v[r][c - 1]) mv.push([r, c - 1]);
        for (const [y, x] of mv) {
          const k = y + "," + x;
          if (k in prev) continue;
          prev[k] = [r, c];
          q.push([y, x]);
        }
      }
      const cells = [];
      let k = n - 1 + "," + (n - 1);
      while (k) {
        const [r, c] = k.split(",").map(Number);
        cells.unshift([r, c]);
        k = prev[k] ? prev[k].join(",") : null;
      }
      Z.mazePath = [];
      const mossMat = new THREE.MeshBasicMaterial({ color: 0x8affc8 });
      const at = ([r, c]) => ({ x: x0 + c * cs + cs / 2, z: z0 + (n - 1 - r) * cs + cs / 2 });
      // (only every THIRD room along the path — you still have to find the way between)
      for (let i = 2; i < cells.length - 1; i += 3) {
        const a = at(cells[i]);
        for (const [mx, mz] of [[a.x, a.z]]) {
          const clump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), mossMat);
          clump.scale.y = 0.4;
          clump.position.set(mx, 0.08, mz);
          const h = glow(0x8affc8, 1.8, 0.7);
          h.position.set(mx, 0.35, mz);
          G.add(clump, h);
          Z.mazePath.push({ x: mx, z: mz });
        }
      }
    }
    // the lantern waits in the far corner of the maze
    Z.lanternSpots.maze = { x: x0 + (n - 0.5) * cs, z: z0 + 0.5 * cs, y: 0 };
    // shadow-wisps drifting through it
    Z.wisps = [];
    for (let i = 0; i < 6; i++) {
      const g = makeWisp();
      G.add(g);
      Z.wisps.push({ g, ph: i * 1.7, cx: x0 + (1 + (i % 4)) * cs + cs / 2, cz: z0 + (1 + Math.floor(i / 2)) * cs - cs / 2 });
    }
  }
  // the Shadow's Hollow: the Heartstone, five cold braziers, and the Shadow
  {
    const H0 = UG.hollow;
    const hs = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 1), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.35 }));
    hs.position.set(H0.x, Z.height(H0.x, H0.z - 10) + 3, H0.z - 10);
    const hsGlow = glow(0xbfd8ff, 8, 0.25);
    hsGlow.position.copy(hs.position);
    G.add(hs, hsGlow);
    Z.heartstone = { m: hs, glow: hsGlow };
    live.push((t) => (hs.rotation.y = t * 0.4));
    Z.braziers = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
      const x = H0.x + Math.cos(a) * 13;
      const z = H0.z + Math.sin(a) * 13;
      const g = new THREE.Group();
      g.position.set(x, Z.height(x, z), z);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.7, 10), M(0x4a4a5a));
      bowl.position.y = 1;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.8, 8), M(0x3a3a48));
      post.position.y = 0.4;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 }));
      flame.position.y = 2;
      const halo = glow(0xffd890, 6);
      halo.position.y = 2;
      g.add(bowl, post, flame, halo);
      G.add(g);
      Z.colliders.push({ x, z, r: 1.1 });
      Z.braziers.push({ x, z, g, flame, halo, set(on) {
        flame.visible = halo.visible = on;
      } });
    }
    // the Shadow: a huge dark shape with lantern-sad eyes, and one long arm
    const sh = new THREE.Group();
    sh.position.set(H0.x, Z.height(H0.x, H0.z), H0.z);
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 1), new THREE.MeshStandardMaterial({ color: 0x07050c, emissive: 0x1a0a2a, emissiveIntensity: 0.6, roughness: 1, flatShading: true }));
    body.position.y = 3.6;
    body.scale.set(1, 1.15, 1);
    const eyes = [-1, 1].map((sx) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd8b0ff }));
      e.position.set(sx * 1.2, 4.6, 3.1);
      return e;
    });
    const arm = new THREE.Group();
    const armM = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 15), new THREE.MeshBasicMaterial({ color: 0x0a0612, transparent: true, opacity: 0.8 }));
    armM.position.set(0, 0.5, 8.5);
    arm.add(armM);
    sh.add(body, ...eyes, arm, glow(0x3a1a6a, 16, 0.35));
    G.add(sh);
    Z.colliders.push({ x: H0.x, z: H0.z, r: 4 });
    Z.shadow = { g: sh, body, eyes, arm, armAng: 0 };
  }
  // soft colored light over each place, so the cavern glows
  for (const [x, z, c, i] of [[UG.grove.x, UG.grove.z, 0x6affd8, 30], [UG.lake.x, UG.lake.z, 0x8ab8ff, 26], [UG.maze.x, UG.maze.z, 0xb88aff, 18], [UG.hollow.x, UG.hollow.z, 0x8a6aff, 26], [0, 30, 0x6a8aff, 20]]) {
    const l = new THREE.PointLight(c, i, 60, 1.2);
    l.position.set(x, 16, z);
    G.add(l);
  }
  Z.update = (t, dt, player) => {
    for (const f of live) f(t, dt);
    // stones sink if you stand still on them
    for (const st of Z.stones) {
      if (st.gone > 0) {
        st.gone -= dt;
        st.m.position.y -= dt * 4;
        if (st.gone <= 0) {
          st.m.position.y = -0.05;
          st.pl.y = st.y;
          st.stand = 0;
        }
        continue;
      }
      const on = Math.hypot(player.x - st.x, player.z - st.z) < st.pl.r && Math.abs(player.y - st.y) < 0.6;
      st.stand = on ? st.stand + dt : Math.max(0, st.stand - dt);
      st.m.material.color.setHex(st.stand > 0.3 ? 0xffffff : 0x9fd8ff);
      if (st.stand > 0.65) {
        st.gone = 3;
        st.pl.y = -999;
      }
    }
    // the wisps drift through their corner of the maze
    for (const w of Z.wisps) {
      w.x = w.cx + Math.sin(t * 0.7 + w.ph) * 4.5;
      w.z = w.cz + Math.cos(t * 0.5 + w.ph * 2) * 4.5;
      w.g.position.set(w.x, 1.2 + Math.sin(t * 2 + w.ph) * 0.3, w.z);
    }
  };
  return Z;
}

// ======================================================================
//  🎈 THE OPEN SKY — where the balloon flights happen: a sea of treetops
//  far below, clouds drifting by, the sun going down, and stars to catch.
// ======================================================================
function buildSky() {
  const Z = baseZone("sky", 400);
  Z.spots.arrive = { x: 0, z: -190 };
  Z.height = () => 0;
  const G = Z.group;
  // the endless forest canopy below (one instanced mesh)
  {
    const N = 2600;
    const cone = new THREE.ConeGeometry(4, 9, 7);
    const inst = new THREE.InstancedMesh(cone, M(0x2e5a2e), N);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const x = (hash(i, 91) - 0.5) * 420;
      const z = (hash(i, 92) - 0.5) * 460;
      const s = 0.7 + hash(i, 93) * 0.9;
      m4.makeScale(s, s * (0.8 + hash(i, 94) * 0.6), s);
      m4.setPosition(x, -4 + hash(i, 95) * 3, z);
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, col.setHSL(0.28 + hash(i, 96) * 0.08, 0.45, 0.22 + hash(i, 97) * 0.12));
    }
    G.add(inst);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M(0x1e3a1e));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -5;
    G.add(floor);
  }
  // a river winding through the trees, catching the sunset
  {
    const pts = [];
    for (let i = 0; i <= 40; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.4) * 50 - 30, -0.5, -230 + i * 11.5));
    const curve = new THREE.CatmullRomCurve3(pts);
    const river = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 4, 6), new THREE.MeshBasicMaterial({ color: 0xf0a868 }));
    river.scale.y = 0.15;
    G.add(river);
  }
  // great mountains far away, and fluffy clouds
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    const h = 90 + hash(k, 101) * 80;
    const mt = new THREE.Mesh(new THREE.ConeGeometry(60, h, 7), M(0x6a5a8a));
    mt.position.set(Math.cos(a) * 380, h / 2 - 10, Math.sin(a) * 380);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(24, h * 0.4, 7), M(0xfff0e8));
    cap.position.set(mt.position.x, h - 10 - h * 0.2, mt.position.z);
    G.add(mt, cap);
  }
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffe8e0, roughness: 1, flatShading: true, transparent: true, opacity: 0.92 });
  for (let k = 0; k < 70; k++) {
    const c = new THREE.Group();
    for (let b = 0; b < 4; b++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + hash(k * 4 + b, 111) * 4, 1), cloudMat);
      puff.position.set(b * 4 - 6, hash(k * 4 + b, 112) * 2, hash(k * 4 + b, 113) * 3);
      c.add(puff);
    }
    c.position.set((hash(k, 114) - 0.5) * 300, 14 + hash(k, 115) * 40, (hash(k, 116) - 0.5) * 420);
    G.add(c);
  }
  return Z;
}

// ======================================================================
//  ☁️ NIMBUSREACH — the City in the Clouds (reached by balloon, once the
//  cloud-whale is your friend). Puffy islands joined by bouncy cloud-steps,
//  rainbow bridges, a sky market, and the Weather Spire.
// ======================================================================
export const CLOUD = {
  isles: [
    { x: 0, z: 0, r: 16, y: 0, name: "the Sky Plaza" },
    { x: 30, z: -18, r: 9, y: 3, name: "the Weather Spire" },
    { x: -30, z: -16, r: 9, y: 2, name: "the Sky Market" },
    { x: 0, z: -40, r: 10, y: 6, name: "the Rainbow Garden" },
    { x: 24, z: 26, r: 8, y: 1, name: "the Balloon Dock" },
  ],
};
function buildCloud() {
  const Z = baseZone("cloud", 120);
  Z.spots.arrive = { x: 24, z: 26 };
  Z.spots.waystone = { x: 26, z: 30 };
  const G = Z.group;
  const live = [];
  const I = CLOUD.isles;
  // stepping-clouds between the islands (you hop across)
  const steps = [];
  const link = (a, b, n) => {
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      steps.push({ x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t), r: 2.1, y: lerp(a.y, b.y, t) + Math.sin(t * Math.PI) * 1.2 });
    }
  };
  link(I[0], I[1], 3);
  link(I[0], I[2], 3);
  link(I[0], I[3], 4);
  link(I[0], I[4], 2);
  Z.cloud = CLOUD;
  Z.height = (x, z) => {
    let best = ABYSS;
    for (const c of [...I, ...steps]) if (Math.hypot(x - c.x, z - c.z) < c.r) best = Math.max(best, c.y);
    return best;
  };
  const puff = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, emissive: 0xc8d8ff, emissiveIntensity: 0.25 });
  const blob = (x, y, z, r) => {
    const g = new THREE.Group();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (0.45 + hash(k, r) * 0.2), 1), puff);
      m.position.set(Math.cos(a) * r * 0.55, -r * 0.18, Math.sin(a) * r * 0.55);
      m.scale.y = 0.55;
      g.add(m);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, 0.6, 24), puff);
    top.position.y = -0.3;
    g.add(top);
    g.position.set(x, y, z);
    G.add(g);
    return g;
  };
  for (const c of I) blob(c.x, c.y, c.z, c.r);
  for (const st of steps) {
    const b = blob(st.x, st.y, st.z, st.r);
    const ph = st.x * 0.3;
    live.push((t) => (b.position.y = st.y + Math.sin(t * 1.2 + ph) * 0.06));
  }
  // rainbow arches over the bridges
  const rainbow = [0xff6a6a, 0xffb84a, 0xffe86a, 0x6ad86a, 0x6ab8ff, 0xb86aff];
  for (const target of [I[1], I[2], I[3]]) {
    const mx = (target.x + I[0].x) / 2;
    const mz = (target.z + I[0].z) / 2;
    const len = Math.hypot(target.x - I[0].x, target.z - I[0].z);
    rainbow.forEach((col, k) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(len / 2, 0.18, 6, 32, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 }));
      arc.position.set(mx, (target.y + I[0].y) / 2 + k * 0.36, mz);
      arc.rotation.y = Math.atan2(target.x - I[0].x, target.z - I[0].z) + Math.PI / 2;
      G.add(arc);
    });
  }
  // little cloud-cottages round the plaza, with sky-blue doors (black — they're open!)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.5;
    const x = Math.cos(a) * 11;
    const z = Math.sin(a) * 11;
    const h = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), puff);
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 0.6, 2.21);
    h.add(body, door);
    h.position.set(x, 0, z);
    h.rotation.y = Math.atan2(-x, -z);
    G.add(h);
    Z.colliders.push({ x, z, r: 2.3 });
  }
  // the Weather Spire: a tall white tower with a spinning weather-vane
  {
    const W = I[1];
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf4f4ff, roughness: 0.8, flatShading: true }));
    tower.position.set(W.x, W.y + 6, W.z - 2);
    const vane = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xd8b04a, metalness: 0.6 }));
    vane.position.set(W.x, W.y + 13, W.z - 2);
    G.add(tower, vane);
    live.push((t) => (vane.rotation.y = t * 0.8));
    Z.colliders.push({ x: W.x, z: W.z - 2, r: 2.1 });
  }
  // the Rainbow Garden: flowers made of light
  {
    const R0 = I[3];
    for (let k = 0; k < 40; k++) {
      const a = hash(k, 3) * Math.PI * 2;
      const r = hash(k, 4) * (R0.r - 1.5);
      const col = rainbow[k % rainbow.length];
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 0), new THREE.MeshBasicMaterial({ color: col }));
      f.position.set(R0.x + Math.cos(a) * r, R0.y + 0.35, R0.z + Math.sin(a) * r);
      G.add(f);
    }
  }
  // the sun, low and golden, and a sea of cloud far below
  {
    const sun = glow(0xffe8a0, 60, 0.9);
    sun.position.set(-150, 40, -220);
    G.add(sun);
    const seaMat = new THREE.MeshBasicMaterial({ color: 0xf4f0ff, transparent: true, opacity: 0.9 });
    for (let k = 0; k < 80; k++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(10 + hash(k, 9) * 12, 8, 6), seaMat);
      c.scale.y = 0.3;
      c.position.set((hash(k, 7) - 0.5) * 400, -40 + hash(k, 8) * 6, (hash(k, 6) - 0.5) * 400);
      G.add(c);
    }
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🧩 THE MOONKEEPERS' VAULT — two puzzle rooms deep under the forest.
//   Room 1 (south): the STAR FLOOR — 9 plates; stepping on one flips it AND
//          the plates beside it. Light all nine.
//   Room 2 (north): the CRYSTAL CHAIN — turn three crystals so the beam
//          bounces from the lamp, crystal to crystal, into the vault door.
// ======================================================================
export const VAULT = {
  arrive: { x: 0, z: 30 },
  plates: { x: 0, z: 14, gap: 3.4 },
  crystals: [{ x: -8, z: -6 }, { x: 8, z: -12 }, { x: -6, z: -20 }],
  lamp: { x: -14, z: -6 },
  door: { x: 0, z: -30 },
};
function buildVault() {
  const Z = baseZone("vault", 34);
  Z.spots.arrive = VAULT.arrive;
  const G = Z.group;
  Z.height = () => 0;
  Z.vault = VAULT;
  const stone = M(0x5a5e6a);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(44, 1, 76), M(0x3a3e4a));
  floor.position.set(0, -0.5, 0);
  G.add(floor);
  // walls + a dividing wall with an arch between the rooms
  const wall = (x, z, w, d, h = 7) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
    m.position.set(x, h / 2, z);
    G.add(m);
    const n = Math.ceil(Math.max(w, d) / 1.4);
    for (let i = 0; i <= n; i++) {
      const t = i / n - 0.5;
      Z.colliders.push({ x: x + (w > d ? t * w : 0), z: z + (d > w ? t * d : 0), r: 1 });
    }
  };
  wall(-21, 0, 1, 76);
  wall(21, 0, 1, 76);
  wall(0, 37, 44, 1);
  wall(0, -37, 44, 1);
  wall(-12.5, 2, 17, 1);
  wall(12.5, 2, 17, 1);
  Z.archGate = { x: 0, z: 2, open: false };
  const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.6), M(0x2a2a34, { emissive: 0x2a1a4a, emissiveIntensity: 0.3 }));
  gate.position.set(0, 3, 2);
  G.add(gate);
  Z.gateMesh = gate;
  Z.gateCols = [-3, -1.5, 0, 1.5, 3].map((dx) => ({ x: dx, z: 2, r: 1 }));
  Z.colliders.push(...Z.gateCols);
  // torches on the walls
  for (const [x, z] of [[-20, 24], [20, 24], [-20, 8], [20, 8], [-20, -14], [20, -14], [-20, -30], [20, -30]]) {
    const h = glow(0xffb860, 3);
    h.position.set(x * 0.95, 4, z);
    const l = new THREE.PointLight(0xffb860, 8, 16, 1.6);
    l.position.set(x * 0.9, 4, z);
    G.add(h, l);
  }
  // Room 1: the 3×3 star floor
  Z.plates = [];
  const P = VAULT.plates;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = P.x + (c - 1) * P.gap;
    const z = P.z + (r - 1) * P.gap;
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 2.8), new THREE.MeshStandardMaterial({ color: 0x4a4a5a, emissive: 0xffe08a, emissiveIntensity: 0, roughness: 0.6 }));
    m.position.set(x, 0.1, z);
    G.add(m);
    Z.plates.push({ r, c, x, z, m });
  }
  // Room 2: lamp, crystals, door
  {
    const L = VAULT.lamp;
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), M(0x8a7a4a));
    lamp.position.set(L.x, 1.1, L.z);
    const fl = glow(0xfff0a0, 4);
    fl.position.set(L.x, 2.6, L.z);
    G.add(lamp, fl);
    Z.colliders.push({ x: L.x, z: L.z, r: 1 });
  }
  Z.crystals = VAULT.crystals.map((cr) => {
    const g = new THREE.Group();
    g.position.set(cr.x, 0, cr.z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.6, 8), stone);
    base.position.y = 0.3;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0).scale(0.7, 1.4, 0.7), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.85 }));
    gem.position.y = 1.8;
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
    pointer.rotation.x = Math.PI / 2;
    pointer.position.set(0, 1.8, 1.1);
    const turn = new THREE.Group();
    turn.add(gem, pointer);
    g.add(base, turn);
    G.add(g);
    Z.colliders.push({ x: cr.x, z: cr.z, r: 1.2 });
    return { ...cr, g, turn, gem };
  });
  {
    const D = VAULT.door;
    const door = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 24), M(0xb8a878, { metalness: 0.5, emissive: 0x3a3010, emissiveIntensity: 0.3 }));
    door.rotation.x = Math.PI / 2;
    door.position.set(D.x, 3, D.z + 0.6);
    const moon = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.2, 6, 16, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xe8f0ff }));
    moon.position.set(D.x, 3, D.z + 0.95);
    moon.rotation.z = 0.8;
    G.add(door, moon);
    Z.doorMesh = door;
  }
  // beam segments (redrawn by the puzzle)
  Z.beams = [0, 1, 2, 3].map(() => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    b.visible = false;
    G.add(b);
    return b;
  });
  // the stair you came down
  {
    const A = VAULT.arrive;
    for (let k = 0; k < 8; k++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 1), stone);
      st.position.set(A.x, k * 0.8 + 0.2, A.z + 3 + k);
      G.add(st);
    }
  }
  Z.update = () => {};
  return Z;
}

// ======================================================================
//  ⛵ THE OPEN SEA — sail your raft out past Reedmere to four islands,
//  a shipwreck, and a lighthouse rock. (Reached from Reedmere's harbour.)
// ======================================================================
export const SEA = {
  home: { x: 0, z: 150 },
  isles: [
    { key: "palm", x: -90, z: 60, r: 14, name: "Palm Key" },
    { key: "shell", x: 100, z: 20, r: 12, name: "Shell Island" },
    { key: "wreck", x: -40, z: -90, r: 10, name: "the Shipwreck Shoal" },
    { key: "dragon", x: 70, z: -150, r: 13, name: "Ember Isle" },
  ],
};
function buildSea() {
  const Z = baseZone("sea", 230);
  Z.spots.arrive = { x: SEA.home.x, z: SEA.home.z - 6 };
  const G = Z.group;
  const live = [];
  const isleAt = (x, z) => SEA.isles.find((I) => Math.hypot(x - I.x, z - I.z) < I.r) || (Math.hypot(x - SEA.home.x, z - SEA.home.z) < 8 ? { r: 8 } : null);
  Z.height = (x, z) => {
    const I = isleAt(x, z);
    if (!I) return -3;
    return 0.6;
  };
  Z.waterAt = (x, z) => (isleAt(x, z) ? null : 0.2);
  Z.sea = SEA;
  // the sea itself: rolling blue
  {
    const geo = new THREE.PlaneGeometry(600, 600, 60, 60);
    geo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a7aa8, roughness: 0.4, flatShading: true, transparent: true, opacity: 0.92 }));
    water.position.y = 0.2;
    G.add(water);
    const base = geo.attributes.position.array.slice();
    live.push((t) => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(base[i * 3] * 0.05 + t) * 0.25 + Math.cos(base[i * 3 + 2] * 0.04 + t * 0.8) * 0.2);
      p.needsUpdate = true;
    });
    const deep = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x0a3a5a }));
    deep.rotation.x = -Math.PI / 2;
    deep.position.y = -3;
    G.add(deep);
  }
  const sand = M(0xf0d8a0);
  const island = (x, z, r) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 3, 3.6, 24), sand);
    m.position.set(x, -1.2, z);
    G.add(m);
  };
  // the home jetty (back to Reedmere)
  island(SEA.home.x, SEA.home.z, 8);
  {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), M(0x6a4a2c));
    post.position.set(SEA.home.x + 3, 2, SEA.home.z + 3);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({ color: 0x3a8a9a, side: THREE.DoubleSide }));
    flag.position.set(SEA.home.x + 3.8, 3.5, SEA.home.z + 3);
    G.add(post, flag);
  }
  for (const I of SEA.isles) {
    island(I.x, I.z, I.r);
    if (I.key === "palm") for (let k = 0; k < 6; k++) {
      const a = k * 1.1;
      const px = I.x + Math.cos(a) * I.r * 0.55;
      const pz = I.z + Math.sin(a) * I.r * 0.55;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 6, 6), M(0x8a6a42));
      trunk.position.set(px, 3.6, pz);
      trunk.rotation.z = Math.sin(a) * 0.25;
      G.add(trunk);
      for (let f = 0; f < 6; f++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3, 4), M(0x3a9a4a));
        leaf.position.set(px + Math.cos(f) * 1.2, 6.6, pz + Math.sin(f) * 1.2);
        leaf.rotation.set(Math.sin(f) * 1.2, 0, -Math.cos(f) * 1.2);
        G.add(leaf);
      }
      Z.colliders.push({ x: px, z: pz, r: 0.6 });
    }
    if (I.key === "shell") for (let k = 0; k < 14; k++) {
      const a = k * 2.3;
      const r = hash(k, 5) * I.r * 0.8;
      const sh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 6), M([0xffb8c8, 0xf4f0e8, 0xffd8a0][k % 3]));
      sh.rotation.x = Math.PI / 2;
      sh.position.set(I.x + Math.cos(a) * r, 0.8, I.z + Math.sin(a) * r);
      G.add(sh);
    }
    if (I.key === "wreck") {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 14), M(0x5a3a22));
      hull.position.set(I.x, 1, I.z);
      hull.rotation.set(0.2, 0.6, 0.35);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 10, 6), M(0x4a2e1a));
      mast.position.set(I.x + 1, 5, I.z);
      mast.rotation.z = 0.6;
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), M(0xd8ccb0, { side: THREE.DoubleSide }));
      sail.position.set(I.x + 2.6, 6, I.z);
      sail.rotation.z = 0.6;
      G.add(hull, mast, sail);
      Z.colliders.push({ x: I.x, z: I.z, r: 4 });
    }
    if (I.key === "dragon") {
      const rock = new THREE.Mesh(new THREE.ConeGeometry(I.r * 0.6, 12, 7), M(0x4a3a3a));
      rock.position.set(I.x, 6, I.z - 4);
      const lava = glow(0xff7a2a, 10, 0.6);
      lava.position.set(I.x, 12, I.z - 4);
      G.add(rock, lava);
      Z.colliders.push({ x: I.x, z: I.z - 4, r: I.r * 0.55 });
    }
  }
  // gulls wheeling overhead
  for (let k = 0; k < 10; k++) {
    const g = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    g.rotation.z = Math.PI / 2;
    G.add(g);
    live.push((t) => {
      const a = t * 0.3 + k;
      g.position.set(Math.cos(a) * (40 + k * 6), 18 + Math.sin(t + k) * 2, Math.sin(a) * (40 + k * 6));
      g.rotation.y = -a;
    });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🎪 INSIDE THE CIRCUS TENT — the ring, the stands, a REAL tightrope
//  high overhead (ladders at each end, a net below), and performers.
// ======================================================================
export const CIRCUS = {
  door: { x: 0, z: 26 },
  rope: { x0: -13, x1: 13, z: -6, y: 9 },
  ladder: { x: -13, z: -3 }, // (stand here + E to climb up)
  seat: { x: 0, z: 16 },
  ring: { x: 0, z: -6, r: 8 },
};
function buildCircus() {
  const Z = baseZone("circus", 27);
  Z.spots.arrive = { x: 0, z: 23 };
  const G = Z.group;
  const C = CIRCUS;
  const R = C.rope;
  const onRope = (x, z) => x > R.x0 && x < R.x1 && Math.abs(z - R.z) < 0.4;
  const onPlat = (x, z) => Math.hypot(x - R.x0, z - R.z) < 1.8 || Math.hypot(x - R.x1, z - R.z) < 1.8;
  const inNet = (x, z) => x > R.x0 - 2 && x < R.x1 + 2 && Math.abs(z - R.z) < 4;
  Z.height = (x, z) => (onPlat(x, z) || onRope(x, z) ? R.y : inNet(x, z) ? 1.2 : 0);
  Z.circus = C;
  Z.onRope = onRope;
  // the big striped tent (from the inside)
  for (let k = 0; k < 24; k++) {
    const panel = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 16, 24, 1, true, (k / 24) * Math.PI * 2, Math.PI / 12), M(k % 2 ? 0xd83a3a : 0xf4f0e8, { side: THREE.BackSide }));
    panel.position.y = 8;
    G.add(panel);
  }
  for (let k = 0; k < 24; k++) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(28, 12, 24, 1, true, (k / 24) * Math.PI * 2, Math.PI / 12), M(k % 2 ? 0xd83a3a : 0xf4f0e8, { side: THREE.BackSide }));
    roof.position.y = 22;
    G.add(roof);
  }
  // the HUGE door (the way in and out), with curtains tied back
  {
    const D = C.door;
    const doorway = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    doorway.position.set(D.x, 4.5, 27.7);
    doorway.rotation.y = Math.PI;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.3, 6, 18, Math.PI), M(0xf0c040));
    arch.position.set(D.x, 9, 27.6);
    G.add(doorway, arch);
    for (const sx of [-1, 1]) {
      const curtain = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 6), M(0xb82a2a));
      curtain.position.set(D.x + sx * 4.2, 4.5, 27.4);
      curtain.rotation.z = Math.PI;
      G.add(curtain);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.9), new THREE.MeshBasicMaterial({ color: 0x2a1a10 }));
    sign.position.set(D.x, 10.6, 27.5);
    sign.rotation.y = Math.PI;
    G.add(sign);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 40), M(0xc8a878));
  floor.rotation.x = -Math.PI / 2;
  G.add(floor);
  // the ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(C.ring.r, 0.4, 8, 40), M(0xd83a3a));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(C.ring.x, 0.4, C.ring.z);
  const sawdust = new THREE.Mesh(new THREE.CircleGeometry(C.ring.r, 40), M(0xe8c888));
  sawdust.rotation.x = -Math.PI / 2;
  sawdust.position.set(C.ring.x, 0.02, C.ring.z);
  G.add(ring, sawdust);
  // the stands, full of mice
  const crowdCols = [0x8a6a9a, 0x6a8aa8, 0xa86a6a, 0x6aa86a, 0xc8a04a, 0x4a8a8a];
  Z.crowd = [];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 18; k++) {
      const a = Math.PI * 0.15 + (k / 17) * Math.PI * 0.7;
      const r = 17 + row * 2.5;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r * 0.8 + 4;
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6 + row * 1.2, 1.4), M(0x8a5e36));
      bench.position.set(x, (0.6 + row * 1.2) / 2, z);
      G.add(bench);
      if ((k + row) % 2 === 0) continue;
      const fan = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), M(crowdCols[(k + row) % crowdCols.length]));
      body.position.y = 0.4;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), M(0xd8c8a8));
      head.position.y = 0.9;
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), M(0xe8b8b8));
        ear.position.set(sx * 0.2, 1.12, 0);
        fan.add(ear);
      }
      fan.add(body, head);
      fan.position.set(x, 0.6 + row * 1.2, z);
      fan.rotation.y = Math.atan2(C.ring.x - x, C.ring.z - z);
      G.add(fan);
      Z.crowd.push({ g: fan, base: fan.position.y, ph: k + row * 3 });
    }
  }
  // 🎢 the tightrope: two tall platforms, ladders, the rope, a net
  const wood = M(0x8a6a42);
  for (const x of [R.x0, R.x1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, R.y, 8), wood);
    post.position.set(x, R.y / 2, R.z);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.3, 14), M(0xd8b04a));
    plat.position.set(x, R.y - 0.15, R.z);
    G.add(post, plat);
    Z.colliders.push({ x, z: R.z, r: 0.5, top: R.y - 1 });
  }
  for (let k = 0; k < 12; k++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 4), wood);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(R.x0, 0.6 + k * 0.72, R.z + 1.9);
    G.add(rung);
  }
  for (const sx of [-0.6, 0.6]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, R.y, 4), wood);
    rail.position.set(R.x0 + sx, R.y / 2, R.z + 1.9);
    G.add(rail);
  }
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, R.x1 - R.x0, 6), M(0xf4ecd8));
  rope.rotation.z = Math.PI / 2;
  rope.position.set(0, R.y - 0.05, R.z);
  G.add(rope);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(R.x1 - R.x0 + 4, 8, 14, 4), new THREE.MeshBasicMaterial({ color: 0xf4f0e8, wireframe: true }));
  net.rotation.x = -Math.PI / 2;
  net.position.set(0, 1.2, R.z);
  G.add(net);
  const goalFlag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: 0xf0c040, side: THREE.DoubleSide }));
  goalFlag.position.set(R.x1, R.y + 2.4, R.z);
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 4), wood);
  flagPole.position.set(R.x1 - 0.6, R.y + 1.3, R.z);
  G.add(goalFlag, flagPole);
  // spotlights
  Z.spots2 = [];
  for (const [x, c] of [[-16, 0xffe8a0], [16, 0xa0d8ff], [0, 0xffa0d8]]) {
    const l = new THREE.SpotLight(c, 120, 60, 0.35, 0.5, 1.2);
    l.position.set(x, 24, 10);
    l.target.position.set(C.ring.x, 0, C.ring.z);
    G.add(l, l.target);
    Z.spots2.push(l);
  }
  const amb = new THREE.PointLight(0xffe0c0, 40, 70, 1.2);
  amb.position.set(0, 18, 0);
  G.add(amb);
  // 🎭 the performers (they wait at the edge of the ring until the show)
  const performer = (tunic, x, z) => {
    const m = buildThistle({ tunicColor: tunic, hoodColor: tunic, pack: false });
    m.scale.setScalar(1.3);
    m.position.set(x, 0, z);
    G.add(m);
    return m;
  };
  Z.cast = {
    ringmaster: performer(0xb81a2a, 3, 5),
    juggler: performer(0x3a8ad8, -5, -12),
    magician: performer(0x2a1a4a, 5, -12),
    acrobatA: performer(0xf0a030, -2, -14),
    acrobatB: performer(0x4ac060, 2, -14),
  };
  // the ringmaster's top hat
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 12), M(0x1a1a1a));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12), M(0x1a1a1a));
  top.position.y = 0.15;
  hat.add(brim, top);
  hat.position.y = 0.78;
  Z.cast.ringmaster.add(hat);
  // juggling balls, a magic hat, doves, trapeze
  Z.balls = [0xe84a4a, 0xf0c030, 0x4a8ae8, 0x4ac060].map((c) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: c }));
    b.visible = false;
    G.add(b);
    return b;
  });
  Z.magicHat = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 14), M(0x1a1a1a));
  Z.magicHat.visible = false;
  G.add(Z.magicHat);
  Z.doves = Array.from({ length: 6 }, () => {
    const d = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    body.scale.z = 1.6;
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      w.position.x = sx * 0.25;
      w.rotation.x = -Math.PI / 2;
      d.add(w);
    }
    d.add(body);
    d.visible = false;
    G.add(d);
    return d;
  });
  Z.trapeze = new THREE.Group();
  {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), M(0xd8b04a));
    bar.rotation.z = Math.PI / 2;
    bar.position.y = -6;
    for (const sx of [-0.8, 0.8]) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6, 4), M(0xf4ecd8));
      line.position.set(sx, -3, 0);
      Z.trapeze.add(line);
    }
    Z.trapeze.add(bar);
    Z.trapeze.position.set(C.ring.x, 18, C.ring.z);
    G.add(Z.trapeze);
  }
  Z.sparkles = Array.from({ length: 40 }, (_, i) => {
    const s2 = glow([0xffe08a, 0xff8ab8, 0x8ad8ff, 0xb8ff8a][i % 4], 1.2);
    s2.visible = false;
    G.add(s2);
    return s2;
  });
  Z.update = (t) => {
    for (const c of Z.crowd) c.g.position.y = c.base + (Z.cheer ? Math.abs(Math.sin(t * 8 + c.ph)) * 0.3 : Math.abs(Math.sin(t * 1.2 + c.ph)) * 0.03);
    Z.spots2.forEach((l, i) => l.target.position.set(C.ring.x + Math.sin(t * 0.7 + i * 2) * 4, 0, C.ring.z + Math.cos(t * 0.5 + i) * 3));
    Z.trapeze.rotation.x = Math.sin(t * 1.2) * 0.5;
  };
  return Z;
}

// ======================================================================
//  ✨ THE STARWAY — Phase 15. Floating star-stones spiralling up through
//  the night sky. Three FALLEN STARS lie on side-ledges; light all three
//  and the broken top of the bridge appears — where Sprig is stranded.
// ======================================================================
export const STARWAY = { stones: [], ledges: [], top: null, broken: 3 };
{
  let ang = 0;
  let y = 0;
  for (let i = 0; i < 16; i++) {
    ang += 0.42;
    y += 0.85;
    const r = 14 + Math.sin(i * 0.7) * 2;
    STARWAY.stones.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, y, r: 1.7 });
  }
  // three fallen stars on ledges just off the path
  for (const i of [3, 7, 11]) {
    const s0 = STARWAY.stones[i];
    const a = Math.atan2(s0.z, s0.x);
    STARWAY.ledges.push({ x: Math.cos(a) * (Math.hypot(s0.x, s0.z) + 4.2), z: Math.sin(a) * (Math.hypot(s0.x, s0.z) + 4.2), y: s0.y + 0.6, r: 1.6, from: i });
  }
  const last = STARWAY.stones[STARWAY.stones.length - 1];
  STARWAY.top = { x: last.x * 0.4, z: last.z * 0.4, y: last.y + 0.8, r: 5 };
}
function buildStarway() {
  const Z = baseZone("starway", 60);
  const W = STARWAY;
  Z.spots.arrive = { x: 0, z: 0 };
  const G = Z.group;
  const live = [];
  Z.starway = W;
  Z.unbroken = false; // (set by phase15 once all three stars are lit)
  const plats = () => [
    { x: 0, z: 0, y: 0, r: 6 },
    ...W.stones.filter((_, i) => i < W.stones.length - W.broken || Z.unbroken),
    ...W.ledges,
    ...(Z.unbroken ? [W.top] : []),
  ];
  // (the stair spirals more than once round, so stones stack above each other —
  //  given your height, only count stones you could actually step up onto,
  //  or you'd be snapped straight up to the top)
  Z.height = (x, z, y) => {
    let best = ABYSS;
    for (const p of plats()) if (Math.hypot(x - p.x, z - p.z) < p.r && (y === undefined || p.y <= y + 1.2)) best = Math.max(best, p.y);
    return best;
  };
  // the night: stars everywhere, a huge moon, a purple nebula
  {
    const N = 2000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = hash(i, 1) * Math.PI * 2;
      const b = (hash(i, 2) - 0.3) * Math.PI;
      const r = 150 + hash(i, 3) * 100;
      pos.set([Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    G.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9 })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f8ff }));
    moon.position.set(-60, 60, -120);
    G.add(moon, (() => { const h = glow(0xdfe8ff, 80, 0.5); h.position.copy(moon.position); return h; })());
    for (let k = 0; k < 6; k++) {
      const n = glow([0x8a5ad8, 0x5a8ad8, 0xd85aa8][k % 3], 90, 0.18);
      n.position.set((hash(k, 4) - 0.5) * 300, (hash(k, 5) - 0.2) * 120, (hash(k, 6) - 0.5) * 300);
      G.add(n);
    }
  }
  // the start: a moonstone disc (the way home is here too)
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(6, 5, 0.6, 24), new THREE.MeshBasicMaterial({ color: 0xbfd8ff }));
  disc.position.y = -0.3;
  G.add(disc);
  // the star-stones
  const stoneMat = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.95 });
  Z.stoneMeshes = W.stones.map((st, i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(st.r, st.r * 0.6, 0.4, 5), stoneMat.clone());
    m.position.set(st.x, st.y - 0.2, st.z);
    m.add(glow(0xbfd8ff, 4, 0.5));
    G.add(m);
    live.push((t) => (m.rotation.y = t * 0.3 + i));
    return m;
  });
  Z.ledgeMeshes = W.ledges.map((l) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(l.r, l.r * 0.6, 0.4, 5), new THREE.MeshBasicMaterial({ color: 0xd8c8ff }));
    m.position.set(l.x, l.y - 0.2, l.z);
    G.add(m);
    return m;
  });
  // the top: a little star-temple where Sprig waits
  {
    const T = W.top;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(T.r, T.r * 0.7, 0.6, 24), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
    m.position.set(T.x, T.y - 0.3, T.z);
    G.add(m);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), new THREE.MeshBasicMaterial({ color: 0xfff4d0 }));
      col.position.set(T.x + Math.cos(a) * (T.r - 0.6), T.y + 1.5, T.z + Math.sin(a) * (T.r - 0.6));
      G.add(col);
    }
    Z.topMesh = m;
  }
  Z.update = (t) => {
    for (const f of live) f(t);
    const n = W.stones.length;
    Z.stoneMeshes.forEach((m, i) => (m.visible = i < n - W.broken || Z.unbroken));
    Z.topMesh.visible = Z.unbroken;
  };
  return Z;
}

// ======================================================================
//  🧗 THE MOONLIT CLIFFS — a sheer silver mountain; narrow ledges spiral
//  up its side. Gaps (double-jump!), ledges that CRUMBLE, and gusts of
//  wind. Moon-lanterns are checkpoints; Silverveil's gate is at the top.
// ======================================================================
export const CLIFFS = { ledges: [], lanterns: [8, 17], top: null, R: 20 };
{
  let ang = Math.PI / 2;
  let y = 0;
  for (let i = 0; i < 26; i++) {
    const gap = i % 5 === 4; // every fifth step: a wide gap — double-jump!
    ang -= gap ? 0.27 : 0.2;
    y += gap ? 1.5 : 1.15;
    const r = CLIFFS.R + 3 + (i % 3 === 1 ? 0.6 : 0);
    CLIFFS.ledges.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, y, r: i % 4 === 2 ? 1.6 : 2.1, crumble: i % 4 === 2 && i > 3, gap });
  }
  const last = CLIFFS.ledges[CLIFFS.ledges.length - 1];
  CLIFFS.top = { x: 0, z: 0, y: last.y + 1, r: CLIFFS.R };
  CLIFFS.start = { x: 0, z: CLIFFS.R + 9, y: 0 };
}
function buildCliffs() {
  const Z = baseZone("cliffs", 60);
  const K = CLIFFS;
  Z.spots.arrive = { x: K.start.x, z: K.start.z };
  const G = Z.group;
  const live = [];
  Z.cliffs = K;
  Z.gone = {}; // crumbled ledges (i → seconds till they grow back)
  const reachTop = (x, z, y) => Math.hypot(x, z) < K.R && y > K.top.y - 3;
  Z.height = (x, z) => {
    let best = Math.hypot(x - K.start.x, z - K.start.z) < 7 ? 0 : ABYSS;
    K.ledges.forEach((l, i) => {
      if (!Z.gone[i] && Math.hypot(x - l.x, z - l.z) < l.r) best = Math.max(best, l.y);
    });
    return best;
  };
  // (the summit is only "ground" once you're up there — so you can't stand on it from below)
  Z.platforms.push({ x: 0, z: 0, r: K.R - 0.5, y: K.top.y });
  Z.colliders.push(...Array.from({ length: 24 }, (_, k) => ({ x: Math.cos((k / 24) * Math.PI * 2) * (K.R - 1), z: Math.sin((k / 24) * Math.PI * 2) * (K.R - 1), r: 2.4, top: K.top.y - 0.5 })));
  // the mountain itself
  const rock = new THREE.MeshStandardMaterial({ color: 0x9a9ab8, roughness: 0.8, flatShading: true });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(K.R, K.R + 4, K.top.y + 30, 18, 6), rock);
  col.position.y = (K.top.y - 30) / 2;
  G.add(col);
  const snowCap = new THREE.Mesh(new THREE.CylinderGeometry(K.R + 0.3, K.R + 0.3, 0.6, 18), M(0xf4f8ff));
  snowCap.position.y = K.top.y - 0.3;
  G.add(snowCap);
  // the start meadow + the abyss of cloud below
  const meadow = new THREE.Mesh(new THREE.CylinderGeometry(7, 6, 1, 16), M(0x6a8a6a));
  meadow.position.set(K.start.x, -0.5, K.start.z);
  G.add(meadow);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xc8c8e8, transparent: true, opacity: 0.6, depthWrite: false });
  for (let k = 0; k < 50; k++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(10 + hash(k, 7) * 10, 8, 6), cloudMat);
    c.scale.y = 0.3;
    c.position.set((hash(k, 8) - 0.5) * 260, -22 + hash(k, 9) * 4, (hash(k, 10) - 0.5) * 260);
    G.add(c);
  }
  // the ledges (crumbly ones are cracked and darker)
  Z.ledgeMeshes = K.ledges.map((l) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(l.r, l.r * 0.5, 0.8, 7), M(l.crumble ? 0x7a6a6a : 0xc8c8dc));
    m.position.set(l.x, l.y - 0.4, l.z);
    G.add(m);
    return m;
  });
  // moon-lanterns (checkpoints)
  Z.lanternObjs = K.lanterns.map((i) => {
    const l = K.ledges[i];
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5), M(0x5a5a6a));
    post.position.y = 0.8;
    const lamp = glow(0xbfd8ff, 2.6);
    lamp.position.y = 1.8;
    g.add(post, lamp);
    const a = Math.atan2(l.z, l.x);
    g.position.set(l.x + Math.cos(a) * 1.2, l.y, l.z + Math.sin(a) * 1.2);
    G.add(g);
    return { g, lamp, i };
  });
  // Silverveil's gate at the top
  {
    const T = K.top;
    const gate = new THREE.Group();
    for (const sx of [-1.6, 1.6]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 8), M(0xe8e8f8));
      pillar.position.set(sx, 2.5, 0);
      gate.add(pillar);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.3, 6, 16, Math.PI), M(0xe8e8f8));
    arch.position.y = 5;
    const shine = glow(0xdfe8ff, 6);
    shine.position.y = 2.5;
    gate.add(arch, shine);
    gate.position.set(0, T.y, 0);
    G.add(gate);
    Z.gate = { x: 0, z: 0 };
  }
  // wind streaks
  Z.wind = { t: 0, phase: "calm", dir: 1 };
  Z.update = (t, dt) => {
    for (const f of live) f(t);
    for (const [i, s2] of Object.entries(Z.gone)) {
      Z.gone[i] = s2 - dt;
      Z.ledgeMeshes[i].visible = false;
      if (Z.gone[i] <= 0) {
        delete Z.gone[i];
        Z.ledgeMeshes[i].visible = true;
        Z.ledgeMeshes[i].position.y = K.ledges[i].y - 0.4;
      }
    }
  };
  return Z;
}

// ======================================================================
//  🏝️ THE MOONLESS ISLE — Phase 17. A dark island where the moon went out
//  long ago. Grey houses, sleepy mice, and a tall dead lighthouse with a
//  spiral stair round the outside. Light it, and the moon comes back.
// ======================================================================
export const ISLE = { R: 46, tower: { x: 0, z: -14, r: 3.2, h: 22 }, steps: [], dock: { x: 0, z: 40 } };
{
  const T = ISLE.tower;
  for (let i = 0; i < 26; i++) {
    const a = i * 0.5;
    ISLE.steps.push({ x: T.x + Math.cos(a) * (T.r + 1.3), z: T.z + Math.sin(a) * (T.r + 1.3), y: 0.6 + i * 0.82, r: 1.25 });
  }
  ISLE.top = { x: T.x, z: T.z, y: ISLE.steps[ISLE.steps.length - 1].y + 0.6, r: T.r + 0.6 };
}
function buildIsle() {
  const Z = baseZone("isle", 60);
  const I = ISLE;
  const T = I.tower;
  Z.spots.arrive = { x: I.dock.x, z: I.dock.z - 4 };
  const G = Z.group;
  const live = [];
  Z.isle = I;
  Z.height = (x, z) => {
    const d = Math.hypot(x, z);
    let h = d < I.R ? 0.3 : -3; // (flat, to match the island's top — no sinking into the ground)
    if (Math.abs(x - I.dock.x) < 2 && z > I.dock.z - 4.6 && z < I.dock.z + 8) h = 0.6; // standing ON the dock
    for (const st of I.steps) if (Math.hypot(x - st.x, z - st.z) < st.r) h = Math.max(h, st.y);
    return h;
  };
  Z.waterAt = (x, z) => (Math.hypot(x, z) > I.R && !(Math.abs(x - I.dock.x) < 2 && z > I.dock.z - 4.6 && z < I.dock.z + 8) ? 0.2 : null);
  Z.platforms.push({ x: I.top.x, z: I.top.z, r: I.top.r, y: I.top.y });
  Z.colliders.push({ x: T.x, z: T.z, r: T.r + 0.2, top: I.top.y - 0.5 });
  // the island, the dark sea
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(I.R, I.R + 4, 3, 40), M(0x4a5048));
  ground.position.y = -1.2;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.4 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.2;
  G.add(ground, sea);
  // the dock
  const dock = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 12), M(0x5a4a3a));
  dock.position.set(I.dock.x, 0.4, I.dock.z + 2);
  G.add(dock);
  // the old lighthouse: a tall striped tower with a spiral stair
  for (let k = 0; k < 6; k++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(T.r - k * 0.12, T.r - k * 0.12 + 0.12, T.h / 6, 16), M(k % 2 ? 0xe8e4dc : 0x8a3a3a));
    band.position.set(T.x, (k + 0.5) * (T.h / 6), T.z);
    G.add(band);
  }
  const stepMat = M(0x8a7a6a);
  for (const st of I.steps) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.6), stepMat);
    m.position.set(st.x, st.y - 0.15, st.z);
    m.rotation.y = -Math.atan2(st.z - T.z, st.x - T.x);
    G.add(m);
  }
  {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(I.top.r, I.top.r, 0.4, 16), M(0x6a6a6a));
    top.position.set(I.top.x, I.top.y - 0.2, I.top.z);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(I.top.r, 0.08, 6, 24), M(0x3a3a3a));
    rail.rotation.x = Math.PI / 2;
    rail.position.set(I.top.x, I.top.y + 0.9, I.top.z);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), new THREE.MeshStandardMaterial({ color: 0x5a5a6a, emissive: 0x000000 }));
    lamp.position.set(I.top.x, I.top.y + 1.6, I.top.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2, 1.6, 12), M(0x8a3a3a));
    cap.position.set(I.top.x, I.top.y + 3.6, I.top.z);
    G.add(top, rail, lamp, cap);
    Z.lamp = lamp;
    // the beam (off until lit)
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 6, 70, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.rotation.z = Math.PI / 2;
    beam.position.x = 35;
    const pivot = new THREE.Group();
    pivot.position.set(I.top.x, I.top.y + 1.6, I.top.z);
    pivot.add(beam);
    pivot.visible = false;
    G.add(pivot);
    Z.beam = pivot;
    live.push((t) => (pivot.rotation.y = t * 0.6));
  }
  // grey sleepy houses, and the islanders
  Z.islanders = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.3;
    const x = Math.cos(a) * 28;
    const z = Math.sin(a) * 28;
    if (Math.hypot(x - I.dock.x, z - I.dock.z) < 10) continue;
    const g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 2.6, 10), M(0x8a8a8a));
    wall.position.y = 1.3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2, 10), M(0x5a5a62));
    roof.position.y = 3.6;
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), new THREE.MeshBasicMaterial({ color: 0x2a2a2a }));
    win.position.set(0, 1.5, 2.62);
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(1.1, 0.75, 2.45);
    door.rotation.y = 0.4;
    g.add(wall, roof, win, door);
    g.position.set(x, 0.3, z);
    g.rotation.y = Math.atan2(-x, -z);
    G.add(g);
    Z.colliders.push({ x, z, r: 2.8 });
    Z.islanders.push({ win });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏔️ THE STARLIGHT PASS — a hidden valley high above Frostpine that only
//  a dog sled can climb to. A lake frozen all year round, a little log
//  cabin that's yours for free, frosted pines, glowing ice crystals, the
//  northern lights every night (and day!), and twigs everywhere.
// ======================================================================
export const PASS = { R: 80, lake: { x: 0, z: -18, r: 26 }, cabin: { x: 30, z: 26 }, trail: { x: 0, z: 70 } };
function buildPass() {
  const Z = baseZone("pass", 78);
  const P = PASS;
  Z.spots.arrive = { x: P.trail.x, z: P.trail.z - 4 };
  Z.wardrobe = "frostpine";
  const G = Z.group;
  const live = [];
  Z.pass = P;
  const L = P.lake;
  Z.iceAt = (x, z) => Math.hypot(x - L.x, z - L.z) < L.r; // (skate!)
  Z.height = (x, z) => {
    if (Z.iceAt(x, z)) return 0.05;
    const d = Math.hypot(x, z);
    const rim = Math.max(0, (d - P.R * 0.82) / (P.R * 0.18));
    return Math.sin(x * 0.07) * 0.6 + Math.cos(z * 0.06) * 0.5 + rim * rim * 26;
  };
  // the snowy valley floor
  {
    const geo = new THREE.PlaneGeometry(200, 200, 90, 90);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Z.height(pos.getX(i), pos.getZ(i)) - (Z.iceAt(pos.getX(i), pos.getZ(i)) ? 0.4 : 0));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 1, flatShading: true })));
  }
  // the frozen lake: smooth, pale blue, with cracks and a shine
  {
    const ice = new THREE.Mesh(new THREE.CircleGeometry(L.r, 48), new THREE.MeshStandardMaterial({ color: 0xbfe0f4, roughness: 0.1, metalness: 0.2, emissive: 0x2a4a6a, emissiveIntensity: 0.25 }));
    ice.rotation.x = -Math.PI / 2;
    ice.position.set(L.x, 0.06, L.z);
    G.add(ice);
    for (let k = 0; k < 12; k++) {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 4 + hash(k, 2) * 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = hash(k, 3) * Math.PI;
      crack.position.set(L.x + (hash(k, 4) - 0.5) * L.r, 0.08, L.z + (hash(k, 5) - 0.5) * L.r);
      G.add(crack);
    }
  }
  // great peaks all round, snow-capped
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const h = 50 + hash(k, 6) * 40;
    const r = 105 + hash(k, 7) * 20;
    const mt = new THREE.Mesh(new THREE.ConeGeometry(30, h, 7), M(0x8a90a8));
    mt.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(14, h * 0.45, 7), M(0xffffff));
    cap.position.set(mt.position.x, h - 4 - h * 0.22, mt.position.z);
    G.add(mt, cap);
  }
  // frosted pines with sparkles
  for (let k = 0; k < 70; k++) {
    const a = hash(k, 8) * Math.PI * 2;
    const r = 34 + hash(k, 9) * 30;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x - P.cabin.x, z - P.cabin.z) < 9 || Math.hypot(x - P.trail.x, z - P.trail.z) < 8) continue;
    const s0 = 0.8 + hash(k, 10) * 0.8;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s0, 0.35 * s0, 2 * s0, 6), M(0x5a3e2a));
    trunk.position.y = s0;
    g.add(trunk);
    for (let t = 0; t < 3; t++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((2.4 - t * 0.6) * s0, 2.4 * s0, 7), M(t % 2 ? 0xe8f0f8 : 0x2e5a4a));
      cone.position.y = (2.2 + t * 1.4) * s0;
      g.add(cone);
    }
    g.add((() => { const h = glow(0xdfefff, 1.2 * s0, 0.5); h.position.y = 5 * s0; return h; })());
    g.position.set(x, Z.height(x, z), z);
    G.add(g);
    Z.colliders.push({ x, z, r: 0.6 * s0 });
  }
  // glowing ice crystals round the lake
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const x = L.x + Math.cos(a) * (L.r + 2 + hash(k, 11) * 3);
    const z = L.z + Math.sin(a) * (L.r + 2 + hash(k, 11) * 3);
    const col = [0x9fd8ff, 0xc8a8ff, 0x8affe0][k % 3];
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.5 + hash(k, 12) * 0.6, 0).scale(0.6, 2, 0.6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
    cr.position.set(x, Z.height(x, z) + 0.9, z);
    G.add(cr, (() => { const h = glow(col, 3, 0.5); h.position.copy(cr.position); return h; })());
  }
  // the little log cabin (yours!)
  {
    const C0 = P.cabin;
    const g = new THREE.Group();
    const logMat = M(0x8a5a32);
    for (let i = 0; i < 6; i++) {
      for (const [w, d, x, z] of [[7, 0.5, 0, 2.8], [7, 0.5, 0, -2.8], [0.5, 6, 3.3, 0], [0.5, 6, -3.3, 0]]) {
        const log = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), logMat);
        log.position.set(x, 0.25 + i * 0.5, z);
        g.add(log);
      }
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.8, 4), M(0xf4f8ff));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.4;
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 1.05, 3.06);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), M(0x8a8478));
    chim.position.set(-2, 4.8, -1);
    g.add(roof, door, chim);
    for (const sx of [-2, 2]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
      win.position.set(sx, 1.7, 3.06);
      g.add(win);
    }
    const light = new THREE.PointLight(0xffc870, 10, 12, 1.5);
    light.position.set(0, 2, 4.5);
    g.add(light);
    g.position.set(C0.x, Z.height(C0.x, C0.z), C0.z);
    g.rotation.y = Math.atan2(-C0.x, -C0.z);
    G.add(g);
    Z.colliders.push({ x: C0.x, z: C0.z, r: 4 });
    Z.cabinDoor = { x: C0.x + Math.sin(g.rotation.y) * 4.4, z: C0.z + Math.cos(g.rotation.y) * 4.4, face: g.rotation.y };
  }
  // a packed-snow sled trail with lantern posts: arrival → cabin, and → the lake
  {
    const path = (a, b) => {
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const n = Math.floor(len / 3);
      const nx = -(b.z - a.z) / len;
      const nz = (b.x - a.x) / len;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshStandardMaterial({ color: 0xc8d8ec, roughness: 0.6 }));
        strip.rotation.x = -Math.PI / 2;
        strip.rotation.z = -Math.atan2(b.z - a.z, b.x - a.x) + Math.PI / 2;
        strip.position.set(x, Z.height(x, z) + 0.05, z);
        G.add(strip);
        if (i % 3 === 1) for (const side of [-1, 1]) {
          const px = x + nx * 1.9 * side;
          const pz = z + nz * 1.9 * side;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 5), M(0x5a3e24));
          post.position.set(px, Z.height(px, pz) + 0.65, pz);
          const lamp = glow(0xffd890, 1.1);
          lamp.position.set(px, Z.height(px, pz) + 1.4, pz);
          G.add(post, lamp);
        }
      }
    };
    const mid = { x: 12, z: 44 };
    path(P.trail, mid);
    path(mid, { x: P.cabin.x - 3, z: P.cabin.z + 5 });
    path(mid, { x: L.x + 6, z: L.z + L.r + 1 });
  }
  // the canyon you sled up through (and back down, going north… er, south)
  {
    const T = P.trail;
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const h = 16 + k * 4;
        const wall = new THREE.Mesh(new THREE.ConeGeometry(6 + k, h, 6), M(0x8a90a8));
        wall.position.set(T.x + side * (6.5 + k * 0.5), Z.height(T.x, T.z) + h / 2 - 1, T.z + 4 + k * 6);
        const cap = new THREE.Mesh(new THREE.ConeGeometry((6 + k) * 0.45, h * 0.4, 6), M(0xffffff));
        cap.position.set(wall.position.x, wall.position.y + h * 0.3, wall.position.z);
        G.add(wall, cap);
        Z.colliders.push({ x: wall.position.x, z: wall.position.z, r: 4.5 });
      }
    }
  }
  // the northern lights, always
  {
    const cols = [0x6affb8, 0x8ab8ff, 0xd88aff];
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.PlaneGeometry(300, 50, 40, 1);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[k], transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(0, 90 + k * 14, -100 + k * 25);
      m.rotation.x = -0.35;
      G.add(m);
      const base = geo.attributes.position.array.slice();
      live.push((t) => {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + Math.sin(base[i * 3] * 0.03 + t * 0.5 + k) * 12);
        p.needsUpdate = true;
      });
    }
  }
  // ✨ sky lanterns drifting slowly up from the lake into the aurora
  for (let k = 0; k < 18; k++) {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 8), new THREE.MeshBasicMaterial({ color: [0xffc870, 0xffa0c8, 0xb8d8ff][k % 3], transparent: true, opacity: 0.9 }));
    g.add(paper, glow([0xffc870, 0xffa0c8, 0xb8d8ff][k % 3], 2.4));
    G.add(g);
    const ph = hash(k, 31) * 60;
    const ax = L.x + (hash(k, 32) - 0.5) * L.r * 1.6;
    const az = L.z + (hash(k, 33) - 0.5) * L.r * 1.6;
    live.push((t) => {
      const k2 = ((t + ph) % 60) / 60;
      g.position.set(ax + Math.sin(t * 0.3 + k) * 2, 1 + k2 * 70, az + Math.cos(t * 0.25 + k) * 2);
      g.children[1].material.opacity = 0.85 * (1 - k2);
      paper.material.opacity = 0.9 * (1 - k2 * 0.8);
    });
  }
  // the aurora's colors shimmering in the ice
  for (let k = 0; k < 12; k++) {
    const r = glow([0x6affb8, 0x8ab8ff, 0xd88aff][k % 3], 10, 0.25);
    r.position.set(L.x + (hash(k, 41) - 0.5) * L.r * 1.4, 0.2, L.z + (hash(k, 42) - 0.5) * L.r * 1.4);
    G.add(r);
    live.push((t) => (r.material.opacity = 0.15 + Math.sin(t * 0.8 + k) * 0.1));
  }
  // a crystal stag standing on the ice — glowing, very still, watching
  {
    const stag = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.75 });
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mat);
    body.scale.set(0.8, 0.7, 1.5);
    body.position.y = 2;
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), mat);
    head.position.set(0, 3.1, 1.3);
    stag.add(body, head);
    for (const sx of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1.3, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ant.position.set(sx * 0.3, 3.8, 1.2);
      ant.rotation.z = -sx * 0.5;
      stag.add(ant);
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 1.6, 4), mat);
        leg.position.set(sx * 0.35, 0.8, sz * 0.8);
        stag.add(leg);
      }
    }
    stag.add((() => { const h = glow(0xcfe8ff, 7, 0.45); h.position.y = 2.2; return h; })());
    stag.position.set(L.x - 6, 0.05, L.z - 4);
    stag.rotation.y = 0.8;
    G.add(stag);
    live.push((t) => (stag.children[1].rotation.y = Math.sin(t * 0.4) * 0.3));
  }
  // shooting stars across the sky
  {
    const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.4, 14, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }));
    streak.rotation.z = Math.PI / 2.6;
    G.add(streak);
    live.push((t) => {
      const k2 = (t % 9) / 9;
      streak.visible = k2 < 0.12;
      streak.position.set(-80 + k2 * 900, 75 - k2 * 200, -60 + Math.floor(t / 9) % 3 * 30);
    });
  }
  // frost-sprites drifting about
  for (let k = 0; k < 16; k++) {
    const sp = glow([0xdfefff, 0xc8b8ff, 0xb8ffe8][k % 3], 1.2);
    G.add(sp);
    live.push((t) => {
      const a = t * 0.2 + k * 0.7;
      sp.position.set(Math.cos(a) * (12 + (k % 5) * 6), 2 + Math.sin(t * 1.3 + k) * 1.2, -10 + Math.sin(a * 1.3) * (12 + (k % 4) * 5));
    });
  }
  // snow drifting down
  {
    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(hash(i, 21) - 0.5) * 70, hash(i, 22) * 30, (hash(i, 23) - 0.5) * 70], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.9 }));
    snow.frustumCulled = false;
    G.add(snow);
    Z.snow = snow;
  }
  Z.update = (t, dt, player) => {
    for (const f of live) f(t);
    const p = Z.snow.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 1.6;
      if (y < 0) y += 30;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    Z.snow.position.set(player.x, player.y - 6, player.z);
  };
  return Z;
}

// ======================================================================
//  🌅 THE SUNRISE LANDS — Phase 18. A whole lost continent across the sea,
//  with FIVE lost cities gone dark: Coral Spire (by the sea), Sunstone
//  Mesa (red rock), Whisperwood (bamboo), Glimmerfen (a glowing bog) and
//  Skyhold (high on a plateau). Each has a beacon and 3 sun-shards.
// ======================================================================
export const SUNRISE = {
  R: 190,
  dock: { x: 0, z: 170 },
  cities: [
    { key: "coral", name: "Coral Spire", icon: "🪸", x: -110, z: 90, r: 26, color: 0xff8a9a, ground: 0xf0d8a8 },
    { key: "mesa", name: "Sunstone Mesa", icon: "☀️", x: 110, z: 80, r: 28, color: 0xffa040, ground: 0xc8704a },
    { key: "bamboo", name: "Whisperwood", icon: "🎋", x: -120, z: -60, r: 28, color: 0x8ae86a, ground: 0x6a9a4a },
    { key: "fen", name: "Glimmerfen", icon: "🍄", x: 100, z: -80, r: 28, color: 0x8affd8, ground: 0x3a5a4a },
    { key: "sky", name: "Skyhold", icon: "🏰", x: 0, z: -140, r: 24, color: 0xbfd8ff, ground: 0xd8d8e8, high: 18 },
  ],
};
// 3 sun-shards per city, round its edge
for (const c of SUNRISE.cities) {
  c.shards = [0, 1, 2].map((i) => {
    const a = i * 2.1 + c.x * 0.01;
    return { x: c.x + Math.cos(a) * c.r * 0.75, z: c.z + Math.sin(a) * c.r * 0.75 };
  });
}
function buildSunrise() {
  const Z = baseZone("sunrise", SUNRISE.R - 4);
  const S0 = SUNRISE;
  Z.spots.arrive = { x: S0.dock.x, z: S0.dock.z - 6 };
  const G = Z.group;
  const live = [];
  Z.sunrise = S0;
  const sky = S0.cities[4];
  // Skyhold sits on a tall plateau, reached by a winding ramp
  const ramp = [];
  for (let i = 0; i < 24; i++) {
    const a = Math.PI / 2 + i * 0.26;
    ramp.push({ x: sky.x + Math.cos(a) * (sky.r + 3), z: sky.z + Math.sin(a) * (sky.r + 3), y: (i + 1) * (sky.high / 24), r: 2.6 });
  }
  const BASE = 4.2; // (the land stands well above the sea)
  Z.height = (x, z) => {
    const d = Math.hypot(x, z);
    const shore = Math.min(1, Math.max(0, (S0.R - 6 - d) / 14));
    if (shore < 1) return -1 + (BASE + 1 + Math.sin(x * 0.03) * 2 + Math.cos(z * 0.025) * 2) * shore; // (the beach)
    let h = BASE + Math.sin(x * 0.03) * 2 + Math.cos(z * 0.025) * 2 + Math.sin((x + z) * 0.017) * 1.5;
    const ds = Math.hypot(x - sky.x, z - sky.z);
    if (ds < sky.r) return BASE + sky.high;
    for (const r of ramp) if (Math.hypot(x - r.x, z - r.z) < r.r) h = Math.max(h, BASE + r.y);
    for (const c of S0.cities) if (c !== sky && Math.hypot(x - c.x, z - c.z) < c.r) h = BASE + (h - BASE) * 0.25 + 0.4; // (flatter in the cities)
    return h;
  };
  Z.waterAt = (x, z) => (Math.hypot(x, z) > S0.R - 10 ? 0.2 : null);
  Z.colliders.push(...Array.from({ length: 30 }, (_, k) => {
    const a = (k / 30) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2 - 0.4) < 0.5) return null; // (the ramp's foot is open)
    return { x: sky.x + Math.cos(a) * (sky.r - 0.5), z: sky.z + Math.sin(a) * (sky.r - 0.5), r: 2.2, top: 4.2 + sky.high - 1 };
  }).filter(Boolean));
  // the land, colored by region
  {
    const geo = new THREE.PlaneGeometry(S0.R * 2.3, S0.R * 2.3, 140, 140);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.min(Z.height(x, z), BASE + 8));
      let c = new THREE.Color(0x7aa85a);
      let best = 1e9;
      for (const ct of S0.cities) {
        const d = Math.hypot(x - ct.x, z - ct.z);
        if (d < ct.r + 30 && d < best) {
          best = d;
          c = new THREE.Color(0x7aa85a).lerp(new THREE.Color(ct.ground), Math.max(0, 1 - Math.max(0, d - ct.r) / 30));
        }
      }
      if (Math.hypot(x, z) > S0.R - 14) c = new THREE.Color(0xf0dca0);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x2a8ab8, roughness: 0.3 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.15;
    G.add(sea);
  }
  // the plateau + ramp for Skyhold
  {
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(sky.r, sky.r + 6, sky.high + 2, 24), M(0xa8a0b8));
    plat.position.set(sky.x, BASE + sky.high / 2 - 1, sky.z);
    G.add(plat);
    for (const r of ramp) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.6, 3.4), M(0xc8c0d0));
      st.position.set(r.x, BASE + r.y - 0.3, r.z);
      st.rotation.y = -Math.atan2(r.z - sky.z, r.x - sky.x);
      G.add(st);
    }
  }
  // the dock you land at
  {
    const dock = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 16), M(0x8a6a42));
    dock.position.set(S0.dock.x, Z.height(S0.dock.x, S0.dock.z) + 0.2, S0.dock.z + 4);
    G.add(dock);
  }
  // each lost city: ruins in its own style, a dark beacon tower, and its sun-shards
  Z.cityObjs = {};
  for (const c of S0.cities) {
    const y0 = Z.height(c.x, c.z);
    const g = new THREE.Group();
    g.position.set(c.x, y0, c.z);
    const stoneCol = { coral: 0xf0b8b0, mesa: 0xc8784a, bamboo: 0x9ab87a, fen: 0x5a7a6a, sky: 0xe8e8f8 }[c.key];
    // buildings round the edge (styled per city)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + 0.3;
      const x = Math.cos(a) * c.r * 0.55;
      const z = Math.sin(a) * c.r * 0.55;
      let b;
      if (c.key === "coral") b = new THREE.Mesh(new THREE.ConeGeometry(1.8, 8 + (k % 3) * 3, 7), M(stoneCol));
      else if (c.key === "mesa") b = new THREE.Mesh(new THREE.BoxGeometry(5, 3 + (k % 3), 5), M(stoneCol));
      else if (c.key === "bamboo") b = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 3, 8), M(0xb89a5a));
      else if (c.key === "fen") b = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a5aa8));
      else b = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 7 + (k % 2) * 4, 8), M(stoneCol));
      b.position.set(x, (b.geometry.parameters.height || 3) / 2, z);
      g.add(b);
      if (c.key === "bamboo") {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2, 8), M(0x6a8a3a));
        roof.position.set(x, 4, z);
        g.add(roof);
      }
      Z.colliders.push({ x: c.x + x, z: c.z + z, r: c.key === "mesa" ? 3.4 : 2.6, top: c.key === "sky" ? sky.high + 20 : undefined });
    }
    // city scenery
    if (c.key === "bamboo") for (let k = 0; k < 60; k++) {
      const a = k * 2.399;
      const r = c.r + 4 + (k % 7) * 3;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 10 + (k % 4) * 2, 5), M(0x6ac04a));
      st.position.set(Math.cos(a) * r, 5, Math.sin(a) * r);
      g.add(st);
    }
    if (c.key === "fen") for (let k = 0; k < 30; k++) {
      const a = k * 2.399;
      const r = 4 + (k % 8) * 3;
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.6 + (k % 3) * 0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8affd8, { emissive: 0x2a8a6a, emissiveIntensity: 0.6 }));
      sh.position.set(Math.cos(a) * r, 0.9, Math.sin(a) * r);
      g.add(sh);
    }
    if (c.key === "coral") for (let k = 0; k < 24; k++) {
      const a = k * 2.399;
      const r = 6 + (k % 6) * 3;
      const co = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 5), M([0xff6a8a, 0xffa84a, 0xb86aff][k % 3]));
      co.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r);
      g.add(co);
    }
    if (c.key === "mesa") for (let k = 0; k < 8; k++) {
      const a = k * 0.8;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 14 + (k % 3) * 4, 6), M(0xa85a3a));
      pil.position.set(Math.cos(a) * (c.r + 12), 7, Math.sin(a) * (c.r + 12));
      g.add(pil);
    }
    // the beacon tower in the middle (dark until relit)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 8, 10), M(stoneCol));
    tower.position.y = 4;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1, 1, 10), M(0x5a5a5a));
    bowl.position.y = 8.5;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.6, 8), new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.9 }));
    flame.position.y = 10.2;
    const halo = glow(c.color, 16, 0.7);
    halo.position.y = 10;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 2, 120, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 70;
    g.add(tower, bowl, flame, halo, beam);
    flame.visible = halo.visible = beam.visible = false;
    G.add(g);
    Z.colliders.push({ x: c.x, z: c.z, r: 2 });
    // the shards
    const shardObjs = c.shards.map((sp) => {
      const sg = new THREE.Group();
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: 0xffe080 }));
      sg.add(st, glow(0xffd860, 2.6));
      sg.position.set(sp.x, Z.height(sp.x, sp.z) + 1.1, sp.z);
      G.add(sg);
      live.push((t) => (st.rotation.y = t * 2));
      return sg;
    });
    // a dim lantern glow marks each city from afar
    const mark = glow(c.color, 10, 0.35);
    mark.position.set(c.x, y0 + 14, c.z);
    G.add(mark);
    Z.cityObjs[c.key] = { flame, halo, beam, shardObjs, mark, people: [] };
  }
  // scattered trees across the countryside
  for (let k = 0; k < 160; k++) {
    const x = (hash(k, 61) - 0.5) * S0.R * 1.7;
    const z = (hash(k, 62) - 0.5) * S0.R * 1.7;
    if (Math.hypot(x, z) > S0.R - 16 || S0.cities.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 8) || Math.hypot(x - S0.dock.x, z - S0.dock.z) < 12) continue;
    if (ramp.some((r) => Math.hypot(x - r.x, z - r.z) < 6)) continue;
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), M(0x6a4a2c));
    trunk.position.y = 1.5;
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 + hash(k, 63), 0), M([0x5a9a4a, 0x7ab84a, 0xe8a03a][k % 3]));
    top.position.y = 4;
    t.add(trunk, top);
    t.position.set(x, Z.height(x, z), z);
    G.add(t);
    Z.colliders.push({ x, z, r: 0.6 });
  }
  // a dawn-pink sky glow
  const sun = glow(0xffc890, 80, 0.7);
  sun.position.set(200, 50, -240);
  G.add(sun);
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🌌 THE AURORA REACH — Phase 19. The last lost continent: endless snow
//  under endless northern lights. FIVE cities lie sealed inside domes of
//  ice. Each one's STARSTONE is hidden out in the snow — follow its riddle.
// ======================================================================
export const AURORA = {
  R: 190,
  dock: { x: 0, z: 172 },
  cities: [
    { key: "icehaven", name: "Icehaven", icon: "🏰", x: -100, z: 100, r: 22, color: 0x9fd8ff,
      stone: { x: -150, z: 40 }, riddle: "“Where three frozen waterfalls hang like curtains, west of Icehaven.”" },
    { key: "pinehold", name: "Pinehold", icon: "🌲", x: 110, z: 90, r: 22, color: 0x8affb8,
      stone: { x: 60, z: 140 }, riddle: "“Beneath the tallest pine in the whole Reach — it stands alone, near the shore.”" },
    { key: "glacier", name: "Glacier Gate", icon: "🧊", x: -120, z: -70, r: 22, color: 0xbfe0ff,
      stone: { x: -40, z: -30 }, riddle: "“In the middle of the great frozen lake, where the ice is smoothest.”" },
    { key: "crater", name: "Starfall Crater", icon: "☄️", x: 110, z: -80, r: 22, color: 0xd8a8ff,
      stone: { x: 150, z: -10 }, riddle: "“Where a ring of standing stones watches the sky, east of the crater.”" },
    { key: "northlight", name: "Northlight", icon: "🌠", x: 0, z: -150, r: 20, color: 0xffe8a0,
      stone: { x: 20, z: -60 }, riddle: "“On top of the little snow-hill with the sleeping stone bear.”" },
  ],
  lake: { x: -40, z: -30, r: 30 },
};
function buildAurora() {
  const Z = baseZone("aurora", AURORA.R - 4);
  const A = AURORA;
  Z.spots.arrive = { x: A.dock.x, z: A.dock.z - 6 };
  Z.wardrobe = "frostpine";
  const G = Z.group;
  const live = [];
  Z.aurora = A;
  const L = A.lake;
  Z.iceAt = (x, z) => Math.hypot(x - L.x, z - L.z) < L.r;
  const bear = { x: 20, z: -60, r: 9 };
  const BASE = 3.5; // (the land stands well above the sea)
  Z.height = (x, z) => {
    const d = Math.hypot(x, z);
    const shore = Math.min(1, Math.max(0, (A.R - 6 - d) / 14)); // 0 at the water's edge → 1 inland
    if (Z.iceAt(x, z)) return BASE + 0.1;
    const hb = Math.hypot(x - bear.x, z - bear.z);
    const hill = hb < bear.r ? 4 * (1 - (hb / bear.r) ** 2) : 0;
    return -1 + (BASE + 1 + Math.sin(x * 0.04) * 1.4 + Math.cos(z * 0.035) * 1.3 + hill) * shore;
  };
  Z.waterAt = (x, z) => (Math.hypot(x, z) > A.R - 10 ? 0.2 : null);
  // snowy land
  {
    const geo = new THREE.PlaneGeometry(A.R * 2.3, A.R * 2.3, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Z.height(pos.getX(i), pos.getZ(i)) - (Z.iceAt(pos.getX(i), pos.getZ(i)) ? 0.3 : 0));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf0f6ff, roughness: 1, flatShading: true })));
    const ice = new THREE.Mesh(new THREE.CircleGeometry(L.r, 48), new THREE.MeshStandardMaterial({ color: 0xbfe0f4, roughness: 0.08, metalness: 0.2, emissive: 0x2a4a6a, emissiveIntensity: 0.3 }));
    ice.rotation.x = -Math.PI / 2;
    ice.position.set(L.x, BASE + 0.12, L.z);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.3 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.15;
    G.add(ice, sea);
    const dock = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 16), M(0x6a5a4a));
    dock.position.set(A.dock.x, Z.height(A.dock.x, A.dock.z) + 0.2, A.dock.z + 4);
    G.add(dock);
  }
  // landmarks for the riddles
  {
    // 🧊 three frozen waterfalls (west of Icehaven)
    const st = A.cities[0].stone;
    for (let k = -1; k <= 1; k++) {
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 4), M(0x8a90a8));
      cliff.position.set(st.x - 8, BASE + 7, st.z + k * 7);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 3), new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.85, emissive: 0x4a7aaa, emissiveIntensity: 0.4 }));
      fall.position.set(st.x - 4.7, BASE + 6, st.z + k * 7);
      G.add(cliff, fall);
      Z.colliders.push({ x: st.x - 8, z: st.z + k * 7, r: 3.4 });
    }
    // 🌲 the tallest lone pine
    const sp = A.cities[1].stone;
    const pine = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 10, 7), M(0x5a3e2a));
    trunk.position.y = 5;
    pine.add(trunk);
    for (let t = 0; t < 5; t++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(5 - t * 0.8, 5, 8), M(t % 2 ? 0xe8f0f8 : 0x2e5a4a));
      cone.position.y = 8 + t * 3.2;
      pine.add(cone);
    }
    pine.position.set(sp.x + 2, Z.height(sp.x + 2, sp.z + 2), sp.z + 2);
    G.add(pine);
    Z.colliders.push({ x: sp.x + 2, z: sp.z + 2, r: 1.1 });
    // ⭕ standing stones east of the crater
    const cs = A.cities[3].stone;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const stn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 0.8), M(0x7a7a8a));
      stn.position.set(cs.x + Math.cos(a) * 7, Z.height(cs.x + Math.cos(a) * 7, cs.z + Math.sin(a) * 7) + 2.2, cs.z + Math.sin(a) * 7);
      stn.rotation.y = -a;
      G.add(stn);
      Z.colliders.push({ x: stn.position.x, z: stn.position.z, r: 0.9 });
    }
    // 🐻 the sleeping stone bear on its hill
    const bearM = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), M(0x9a9aa8));
    body.scale.set(1.4, 0.8, 1);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), M(0x9a9aa8));
    head.position.set(2.8, -0.3, 0.6);
    bearM.add(body, head);
    bearM.position.set(bear.x - 3, Z.height(bear.x - 3, bear.z) + 1.4, bear.z - 2);
    G.add(bearM);
    Z.colliders.push({ x: bear.x - 3, z: bear.z - 2, r: 3 });
  }
  // the five frozen cities: buildings sealed under a great ice dome
  Z.cityObjs = {};
  for (const c of A.cities) {
    const y0 = Z.height(c.x, c.z);
    const g = new THREE.Group();
    g.position.set(c.x, y0, c.z);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const r = c.r * 0.5;
      const h = 4 + (k % 3) * 2;
      const b = new THREE.Mesh(c.key === "icehaven" ? new THREE.ConeGeometry(1.8, h + 4, 6) : new THREE.CylinderGeometry(2, 2.3, h, 8), M(c.key === "pinehold" ? 0x8a5a32 : 0xd8e0f0));
      b.position.set(Math.cos(a) * r, (b.geometry.parameters.height || h) / 2, Math.sin(a) * r);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2, 8), M(0x5a6aa8));
      roof.position.set(b.position.x, h + 1, b.position.z);
      g.add(b);
      if (c.key !== "icehaven") g.add(roof);
    }
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 9, 10), M(0xe8f0ff));
    tower.position.y = 4.5;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: c.color }));
    star.position.y = 10;
    const halo = glow(c.color, 14, 0.8);
    halo.position.y = 10;
    g.add(tower, star, halo);
    star.visible = halo.visible = false;
    // the ice dome sealing it
    const dome = new THREE.Mesh(new THREE.SphereGeometry(c.r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false }));
    g.add(dome);
    G.add(g);
    const domeCols = Array.from({ length: 28 }, (_, k) => {
      const a = (k / 28) * Math.PI * 2;
      return { x: c.x + Math.cos(a) * c.r, z: c.z + Math.sin(a) * c.r, r: 2.4 };
    });
    Z.colliders.push(...domeCols);
    // the starstone, hidden out in the snow (a faint twinkle, no beam)
    const sg = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: c.color }));
    sg.add(stone, glow(c.color, 2.2, 0.6));
    sg.position.set(c.stone.x, Z.height(c.stone.x, c.stone.z) + 0.8, c.stone.z);
    G.add(sg);
    live.push((t) => {
      stone.rotation.y = t;
      sg.children[1].material.opacity = 0.35 + Math.sin(t * 3) * 0.25;
    });
    Z.cityObjs[c.key] = { g, dome, domeCols, star, halo, stoneObj: sg, people: [] };
  }
  // snow pines everywhere
  for (let k = 0; k < 140; k++) {
    const x = (hash(k, 71) - 0.5) * A.R * 1.7;
    const z = (hash(k, 72) - 0.5) * A.R * 1.7;
    if (Math.hypot(x, z) > A.R - 16 || Z.iceAt(x, z) || A.cities.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 6 || Math.hypot(x - c.stone.x, z - c.stone.z) < 12) || Math.hypot(x - A.dock.x, z - A.dock.z) < 12) continue;
    const s0 = 0.7 + hash(k, 73) * 0.7;
    const t = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((2.2 - i * 0.55) * s0, 2.4 * s0, 7), M(i % 2 ? 0xe8f0f8 : 0x2e5a4a));
      cone.position.y = (1.6 + i * 1.3) * s0;
      t.add(cone);
    }
    t.position.set(x, Z.height(x, z), z);
    G.add(t);
    Z.colliders.push({ x, z, r: 0.7 * s0 });
  }
  // the aurora — huge and always shimmering
  {
    const cols = [0x6affb8, 0x8ab8ff, 0xd88aff, 0x6affe8];
    for (let k = 0; k < 4; k++) {
      const geo = new THREE.PlaneGeometry(500, 70, 50, 1);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[k], transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(0, 110 + k * 18, -160 + k * 60);
      m.rotation.x = -0.3;
      G.add(m);
      const base = geo.attributes.position.array.slice();
      live.push((t) => {
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + Math.sin(base[i * 3] * 0.02 + t * 0.4 + k) * 18);
        p.needsUpdate = true;
      });
    }
    const N = 1500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(hash(i, 81) - 0.5) * 600, 80 + hash(i, 82) * 120, (hash(i, 83) - 0.5) * 600], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    G.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1 })));
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🐉 EMBERROOST — Phase 21. The lost home of the dragons, high above a
//  sea of clouds: a great nest on a central crag, and four floating
//  volcanic isles, each with a cold brazier (breathe FIRE on it from
//  dragon-back) and a lost egg. Only a dragon can reach the isles.
// ======================================================================
export const ROOST = {
  nest: { x: 0, z: 0, r: 15, y: 16 },
  isles: [
    { key: "dawn", name: "Dawnfire Isle", icon: "🌅", a: 0.3, d: 62, r: 8, y: 22, egg: 0xffa040 },
    { key: "storm", name: "Stormwing Isle", icon: "⛈️", a: 1.9, d: 70, r: 8, y: 30, egg: 0x6a8ae8 },
    { key: "frost", name: "Frostfang Isle", icon: "❄️", a: 3.5, d: 58, r: 8, y: 12, egg: 0xc8f0ff },
    { key: "jade", name: "Jadescale Isle", icon: "🌿", a: 5.0, d: 74, r: 8, y: 26, egg: 0x5ad88a },
  ],
};
for (const I of ROOST.isles) {
  I.x = Math.cos(I.a) * I.d;
  I.z = Math.sin(I.a) * I.d;
}
function buildRoost() {
  const Z = baseZone("roost", 110);
  const R = ROOST;
  const N = R.nest;
  Z.spots.arrive = { x: 0, z: N.r - 4 };
  Z.roost = R;
  const G = Z.group;
  const live = [];
  const crags = [N, ...R.isles];
  // the cloud sea is soft — you can walk on it (but only a dragon gets you back up)
  Z.height = (x, z) => {
    for (const c of crags) if (Math.hypot(x - c.x, z - c.z) < c.r) return c.y;
    return 0.3;
  };
  for (const c of crags) Z.colliders.push({ x: c.x, z: c.z, r: c.r + 0.3, top: c.y - 0.5 });
  // clouds
  const sea = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshStandardMaterial({ color: 0xffe8e0, roughness: 1 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.2;
  G.add(sea);
  for (let k = 0; k < 70; k++) {
    const a = hash(k, 31) * Math.PI * 2;
    const d = 20 + hash(k, 32) * 180;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(4 + hash(k, 33) * 7, 10, 8), M(k % 3 ? 0xfff0ea : 0xffd8c8));
    puff.scale.y = 0.45;
    puff.position.set(Math.cos(a) * d, 0.6, Math.sin(a) * d);
    G.add(puff);
  }
  // a sunset sky glow
  for (let k = 0; k < 5; k++) {
    const h = glow([0xff8a50, 0xffc070, 0xd86a8a][k % 3], 160, 0.22);
    h.position.set(Math.cos(k * 1.3) * 200, 50 + k * 10, Math.sin(k * 1.3) * 200);
    G.add(h);
  }
  // the floating crags: a flat top, a long rocky root hanging below, lava cracks
  const rockMat = M(0x4a3a3a);
  const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff6a20 });
  Z.crags = {};
  for (const c of crags) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r * 0.85, 2, 9), rockMat);
    top.position.y = c.y - 1;
    const root = new THREE.Mesh(new THREE.ConeGeometry(c.r * 0.85, c.y * 0.9 + 6, 9), rockMat);
    root.rotation.x = Math.PI;
    root.position.y = c.y - 2 - (c.y * 0.9 + 6) / 2;
    g.add(top, root);
    for (let i = 0; i < 6; i++) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3 + (i % 3), 0.25), lavaMat);
      const a = i * 1.05;
      crack.position.set(Math.cos(a) * c.r * 0.8, c.y - 3 - (i % 2) * 2, Math.sin(a) * c.r * 0.8);
      g.add(crack);
    }
    g.position.set(c.x, 0, c.z);
    G.add(g);
    Z.crags[c.key || "nest"] = g;
  }
  // the great nest: a huge ring of twigs on the central crag
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 1.6, 8, 28), M(0x6a4a2a));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(N.x, N.y + 0.6, N.z);
    G.add(ring);
    for (let i = 0; i < 30; i++) {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 4, 4), M(0x8a6a3a));
      const a = i * 0.21;
      tw.position.set(N.x + Math.cos(a) * 7, N.y + 1.1, N.z + Math.sin(a) * 7);
      tw.rotation.set(Math.PI / 2, 0, a + 0.5);
      G.add(tw);
    }
    Z.nestEggs = [];
    R.isles.forEach((I, i) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), M(I.egg, { emissive: I.egg, emissiveIntensity: 0.5 }));
      e.scale.y = 1.3;
      e.position.set(N.x + Math.cos(i * 1.57) * 2.2, N.y + 1.1, N.z + Math.sin(i * 1.57) * 2.2);
      e.visible = false;
      G.add(e);
      Z.nestEggs.push(e);
    });
  }
  // the braziers (cold until you breathe fire on them) and the eggs beside them
  Z.braziers = {};
  Z.eggs = {};
  for (const I of R.isles) {
    const b = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.8, 1.2, 10), M(0x5a5a62));
    bowl.position.y = 2.4;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.8, 8), M(0x4a4a52));
    post.position.y = 0.9;
    const ash = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 10), M(0x3a3a3a));
    ash.position.y = 3;
    const flame = new THREE.Group();
    flame.add(new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 8), new THREE.MeshBasicMaterial({ color: 0xff8a30 })), glow(0xffa040, 12, 0.9));
    flame.position.y = 4.2;
    flame.visible = false;
    // a faint ember glow so you can spot the cold braziers from afar
    const hint = glow(I.egg, 9, 0.45);
    hint.position.y = 4;
    b.add(bowl, post, ash, flame, hint);
    b.position.set(I.x, I.y, I.z);
    G.add(b);
    Z.braziers[I.key] = { flame, hint };
    live.push((t) => {
      flame.scale.y = 1 + Math.sin(t * 9 + I.d) * 0.15;
      hint.material.opacity = flame.visible ? 0 : 0.3 + Math.sin(t * 2 + I.d) * 0.15;
    });
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), M(I.egg, { emissive: I.egg, emissiveIntensity: 0.6 }));
    egg.scale.y = 1.3;
    egg.position.set(I.x + 3, I.y + 0.9, I.z + 1);
    egg.visible = false;
    G.add(egg);
    Z.eggs[I.key] = egg;
    live.push((t) => (egg.rotation.z = Math.sin(t * 5 + I.d) * 0.12));
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  ⛈️ THE GREAT STORM — Phase 22. A thunderstorm that never ends, high
//  above the world. A trail of SPARK-RINGS (left by a runaway baby
//  dragon) spirals in toward the calm EYE, where the hatchling hides.
//  Only a dragon can fly it — and the lightning is real.
// ======================================================================
export const STORM = { start: { x: 0, z: 92, r: 8, y: 6 }, eye: { x: 0, z: 0, r: 9, y: 24 }, rings: [] };
{
  // the trail: round the storm, closer and higher, into the eye
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 2 + i * 0.85; // (the first ring is straight ahead of where you arrive)
    const d = 72 - i * 6.6;
    STORM.rings.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, y: 12 + Math.sin(i * 1.3) * 7 + i * 2.2 });
  }
}
function buildStorm() {
  const Z = baseZone("storm", 110);
  const W = STORM;
  Z.spots.arrive = { x: W.start.x, z: W.start.z - 3 };
  Z.storm = W;
  const G = Z.group;
  const live = [];
  const rocks = [W.start, W.eye];
  Z.height = (x, z) => {
    for (const c of rocks) if (Math.hypot(x - c.x, z - c.z) < c.r) return c.y;
    return 0.3;
  };
  for (const c of rocks) Z.colliders.push({ x: c.x, z: c.z, r: c.r + 0.3, top: c.y - 0.5 });
  // the dark cloud floor, and great towering thunderheads all round
  const floor = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshStandardMaterial({ color: 0x3a4058, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.2;
  G.add(floor);
  const cloudMat = M(0x4a5068);
  const darkMat = M(0x2e3448);
  Z.thunderheads = [];
  for (let k = 0; k < 46; k++) {
    const a = hash(k, 41) * Math.PI * 2;
    const d = 30 + hash(k, 42) * 160;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    // (keep the cloud towers clear of the spark trail, the eye and where you arrive)
    if (W.rings.some((r) => Math.hypot(r.x - x, r.z - z) < 16) || Math.hypot(x, z) < 24 || Math.hypot(x - W.start.x, z - W.start.z) < 18) continue;
    const g = new THREE.Group();
    const n = 3 + (k % 3);
    for (let i = 0; i < n; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(6 + hash(k, 43 + i) * 7, 10, 8), i % 2 ? cloudMat : darkMat);
      puff.position.set((hash(k, 50 + i) - 0.5) * 10, i * 7 + 2, (hash(k, 60 + i) - 0.5) * 10);
      g.add(puff);
    }
    g.position.set(x, 0, z);
    G.add(g);
    Z.thunderheads.push(g);
    live.push((t) => (g.rotation.y = t * 0.04 * (k % 2 ? 1 : -1)));
  }
  // a swirling ring of storm cloud overhead
  const lid = new THREE.Mesh(new THREE.TorusGeometry(70, 22, 8, 32), new THREE.MeshStandardMaterial({ color: 0x2a3044, roughness: 1, transparent: true, opacity: 0.85 }));
  lid.rotation.x = Math.PI / 2;
  lid.position.y = 62;
  G.add(lid);
  live.push((t) => (lid.rotation.z = t * 0.05));
  Z.lid = lid;
  // the floating rocks: where you arrive, and the calm eye
  const rockMat = M(0x5a5a6a);
  for (const c of rocks) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r * 0.85, 2, 9), rockMat);
    top.position.set(c.x, c.y - 1, c.z);
    const root = new THREE.Mesh(new THREE.ConeGeometry(c.r * 0.85, c.y * 0.9 + 6, 9), rockMat);
    root.rotation.x = Math.PI;
    root.position.set(c.x, c.y - 2 - (c.y * 0.9 + 6) / 2, c.z);
    G.add(top, root);
  }
  // the calm eye: a column of soft silver light
  const eyeLight = glow(0xd8e8ff, 40, 0.35);
  eyeLight.position.set(W.eye.x, W.eye.y + 6, W.eye.z);
  G.add(eyeLight);
  // the spark-rings
  Z.rings = W.rings.map((r, i) => {
    const g = new THREE.Group();
    // big, bright rings that don't fade in the storm's gloom
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.5, 10, 32), new THREE.MeshBasicMaterial({ color: 0x9fe4ff, fog: false }));
    const inner = new THREE.Mesh(new THREE.TorusGeometry(3, 0.18, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    const halo = glow(0x8ad8ff, 14, 0.7);
    halo.material.fog = false;
    g.add(ring, inner, halo);
    g.position.set(r.x, r.y, r.z);
    const nx = W.rings[i + 1] || W.eye;
    g.lookAt(nx.x, nx.y ?? r.y, nx.z);
    g.visible = false;
    G.add(g);
    live.push((t) => {
      ring.rotation.z = t * 2;
      inner.rotation.z = -t * 3;
      const k = 1 + Math.sin(t * 4 + i) * 0.08;
      ring.scale.setScalar(k);
    });
    return g;
  });
  // a tall glowing beam on the NEXT ring, so you can always spot it
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 160, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0.35, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.visible = false;
    G.add(beam);
    Z.ringBeam = beam;
  }
  // ⚡ a bolt + its warning glow (the phase moves them about)
  const bolt = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 0.5), new THREE.MeshBasicMaterial({ color: 0xf8f8ff }));
    seg.position.set((i % 2 ? 1 : -1) * 1.2, 66 - i * 11, 0);
    seg.rotation.z = (i % 2 ? 1 : -1) * 0.2;
    bolt.add(seg);
  }
  bolt.add((() => { const h = glow(0xd8e0ff, 60, 0.6); h.position.y = 30; return h; })());
  bolt.visible = false;
  G.add(bolt);
  Z.bolt = bolt;
  const warn = glow(0xffe060, 12, 0.7);
  warn.visible = false;
  G.add(warn);
  Z.warn = warn;
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏜️ THE WHISPERING DUNES — Phase 23. A hidden desert of golden dunes.
//  Four ancient OBELISKS each guard a sun-stone; three OASES (palms and
//  cool water) are the only shade. In the middle, under the sand, sleeps
//  the Temple of the First Moonkeeper.
// ======================================================================
// ======================================================================
//  🌻 THE GIANT'S GARDEN — Phase 36. A tiny mouse in a giant's wild,
//  overgrown garden: grass like trees, flowers like towers, a puddle that's
//  a lake, a beanstalk to climb, flowerpots, a watering can, a garden gnome,
//  and the giant's CAT prowling the far side. (phase36.js runs the cat and
//  the seeds.)
// ======================================================================
export const GIANTGARDEN = {
  R: 84,
  arrive: { x: 0, z: 74 },
  lake: { x: 0, z: 8, r: 18 },
  island: { x: 0, z: 4, r: 3.2 },
  dock: { x: 0, z: 28 },
  beanstalk: { x: -44, z: 22 },
  pots: { x: 34, z: 26 },
  can: { x: 40, z: -24 },
  gnome: { x: -36, z: -32 },
  catBed: { x: 6, z: -46 },
  door: { x: 0, z: -76 },
  hides: [{ x: -14, z: -24 }, { x: 18, z: -30 }, { x: -6, z: -58 }, { x: 26, z: -50 }, { x: -24, z: -50 }],
  seeds: [],
};
{
  const K = GIANTGARDEN;
  K.seeds.push(
    { key: "bean", name: "on top of the beanstalk", x: K.beanstalk.x + 2.8, z: K.beanstalk.z, y: 30 },
    { key: "island", name: "on the island in the puddle-lake", x: K.island.x, z: K.island.z, y: 0.6 },
    { key: "pot", name: "inside the tipped-over flowerpot", x: K.pots.x + 2, z: K.pots.z - 1, y: 0 },
    { key: "can", name: "in the old watering can", x: K.can.x - 3.2, z: K.can.z, y: 0 },
    { key: "gnome", name: "under the garden gnome's hat", x: K.gnome.x + 2.2, z: K.gnome.z + 1, y: 0 },
    { key: "bed", name: "in the cat's own bed", x: K.catBed.x, z: K.catBed.z, y: 0.6 },
  );
}
function buildGiantGarden() {
  const K = GIANTGARDEN;
  const Z = baseZone("giantgarden", K.R);
  Z.spots.arrive = { ...K.arrive };
  const G = Z.group;
  const live = [];
  const L = K.lake;
  Z.height = (x, z) => (Math.hypot(x - K.island.x, z - K.island.z) < K.island.r ? 0.5 : Math.hypot(x - L.x, z - L.z) < L.r ? -1.5 : 0);
  Z.waterAt = (x, z) => (Math.hypot(x - L.x, z - L.z) < L.r - 0.5 && Math.hypot(x - K.island.x, z - K.island.z) > K.island.r ? 0 : null);
  // the lawn (enormous blades of grass are the "trees" here)
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(K.R + 20, 48), M(0x5a9a3a));
  lawn.rotation.x = -Math.PI / 2;
  G.add(lawn);
  const keep = (x, z, r) => [K.lake, { ...K.dock, r: 4 }, { ...K.beanstalk, r: 8 }, { ...K.pots, r: 9 }, { ...K.can, r: 9 }, { ...K.gnome, r: 7 }, { ...K.catBed, r: 8 }, { ...K.door, r: 10 }, { ...K.arrive, r: 6 }].some((o) => Math.hypot(x - o.x, z - o.z) < (o.r || 6) + r);
  for (let k = 0; k < 160; k++) {
    const a = k * 2.39, d = 10 + ((k * 13.7) % (K.R - 8));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 2)) continue;
    const h = 6 + (k % 5) * 2;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.6, h, 4), M([0x4a8a2a, 0x5a9a3a, 0x6aaa4a][k % 3]));
    blade.position.set(x, h / 2, z);
    blade.rotation.set(Math.sin(k) * 0.15, k, Math.cos(k) * 0.15);
    G.add(blade);
    Z.colliders.push({ x, z, r: 0.5 });
  }
  // giant flowers, tall as towers
  for (let k = 0; k < 14; k++) {
    const a = k * 1.9 + 0.5, d = 30 + (k % 4) * 12;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 4)) continue;
    const h = 16 + (k % 3) * 5;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, h, 8), M(0x3a7a2a));
    stalk.position.set(x, h / 2, z);
    const col = [0xffd040, 0xff6a8a, 0xd8d8ff, 0xff9a3a][k % 4];
    const head = new THREE.Mesh(new THREE.CylinderGeometry(5, 4, 1.2, 14), M(col));
    head.position.set(x, h, z);
    const mid = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), M(0x6a4a1a));
    mid.scale.y = 0.5;
    mid.position.set(x, h + 0.7, z);
    G.add(stalk, head, mid);
    Z.colliders.push({ x, z, r: 1.1 });
  }
  // the big leaves you can hide under (the cat can't see you there)
  Z.hides = K.hides.map((H) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x3a8a3a, { side: THREE.DoubleSide }));
    leaf.scale.set(1, 0.4, 1.4);
    leaf.position.set(H.x, 0.2, H.z);
    G.add(leaf);
    return H;
  });
  // the puddle-lake, its island, and the leaf-boat dock
  {
    const water = new THREE.Mesh(new THREE.CircleGeometry(L.r, 40), new THREE.MeshStandardMaterial({ color: 0x6ab8d8, roughness: 0.1, transparent: true, opacity: 0.88 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(L.x, 0.02, L.z);
    G.add(water);
    const isle = new THREE.Mesh(new THREE.CylinderGeometry(K.island.r, K.island.r + 0.6, 1, 14), M(0x8a7a5a));
    isle.position.set(K.island.x, 0, K.island.z);
    G.add(isle);
    const pebble = new THREE.Mesh(new THREE.CircleGeometry(2.6, 12), M(0x9a8a6a));
    pebble.rotation.x = -Math.PI / 2;
    pebble.position.set(K.dock.x, 0.04, K.dock.z);
    G.add(pebble);
    const boat = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x4a9a3a, { side: THREE.DoubleSide }));
    boat.scale.set(0.7, 0.35, 1.4);
    boat.rotation.x = Math.PI;
    boat.position.set(K.dock.x, 0.4, K.dock.z - 3.2);
    G.add(boat);
    Z.boat = boat;
  }
  // the beanstalk: a great twisting stalk with leaves spiralling up — climb them
  {
    const B = K.beanstalk;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 34, 10), M(0x4a9a3a));
    stalk.position.set(B.x, 17, B.z);
    G.add(stalk);
    Z.colliders.push({ x: B.x, z: B.z, r: 1.6 });
    for (let k = 0; k < 18; k++) {
      const a = k * 0.85, y = 1.6 + k * 1.65;
      const lx = B.x + Math.cos(a) * 2.8, lz = B.z + Math.sin(a) * 2.8;
      const leaf = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.25, 10), M(0x5aaa4a));
      leaf.scale.set(1, 1, 0.75);
      leaf.position.set(lx, y - 0.12, lz);
      leaf.rotation.y = -a;
      G.add(leaf);
      Z.platforms.push({ x: lx, z: lz, r: 1.8, y });
    }
  }
  // flowerpots (one tipped over — walk inside)
  {
    const P0 = K.pots;
    for (const [dx, dz, s] of [[-6, -4, 1], [5, 4, 0.8]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(4 * s, 3 * s, 7 * s, 12), M(0xc8603a));
      pot.position.set(P0.x + dx, 3.5 * s, P0.z + dz);
      G.add(pot);
      Z.colliders.push({ x: P0.x + dx, z: P0.z + dz, r: 4 * s });
    }
    const tipped = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 7, 12, 1, true), M(0xc8603a, { side: THREE.DoubleSide }));
    tipped.rotation.z = Math.PI / 2;
    tipped.position.set(P0.x + 4, 3.6, P0.z - 1);
    G.add(tipped);
    const dirt = new THREE.Mesh(new THREE.CircleGeometry(3, 12), M(0x5a3a1a));
    dirt.rotation.x = -Math.PI / 2;
    dirt.position.set(P0.x - 1, 0.05, P0.z - 1);
    G.add(dirt);
  }
  // the old watering can (lying on its side — the spout's big enough to crawl into)
  {
    const C0 = K.can;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 7, 14), M(0x7a9aaa, { metalness: 0.5, roughness: 0.4 }));
    body.rotation.z = Math.PI / 2;
    body.position.set(C0.x + 3, 4, C0.z);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 8, 10, 1, true), M(0x7a9aaa, { metalness: 0.5, side: THREE.DoubleSide }));
    spout.rotation.z = -Math.PI / 2.6;
    spout.position.set(C0.x - 3, 3, C0.z);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(3, 0.3, 6, 16, Math.PI), M(0x6a8a9a, { metalness: 0.5 }));
    handle.position.set(C0.x + 3, 8, C0.z);
    G.add(body, spout, handle);
    Z.colliders.push({ x: C0.x + 3, z: C0.z, r: 4 });
  }
  // the garden gnome (huge, of course) — and his tall red hat
  {
    const N0 = K.gnome;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 8, 10), M(0x3a6ab8));
    body.position.set(N0.x, 4, N0.z);
    const face = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), M(0xf0c8a8));
    face.position.set(N0.x, 9.5, N0.z);
    const beard = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4, 10), M(0xf4f4f4));
    beard.position.set(N0.x, 7.6, N0.z + 1.4);
    beard.rotation.x = Math.PI;
    G.add(body, face, beard);
    Z.colliders.push({ x: N0.x, z: N0.z, r: 4 });
    // his spare hat lies on the grass beside him (the seed's under it)
    const hat = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.6, 10), M(0xd8302a));
    hat.position.set(N0.x + 2.2, 1.8, N0.z + 1);
    G.add(hat);
    Z.gnomeHat = hat;
    const hat2 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 6, 10), M(0xd8302a));
    hat2.position.set(N0.x, 14, N0.z);
    G.add(hat2);
  }
  // the cat's basket
  {
    const B0 = K.catBed;
    const bed = new THREE.Mesh(new THREE.TorusGeometry(3.4, 1, 8, 20), M(0x9a6a3a));
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(B0.x, 0.8, B0.z);
    const cushion = new THREE.Mesh(new THREE.CircleGeometry(3, 18), M(0xd85a5a));
    cushion.rotation.x = -Math.PI / 2;
    cushion.position.set(B0.x, 0.3, B0.z);
    G.add(bed, cushion);
  }
  // the giant's house: a wall and a door as tall as a tree
  {
    const D0 = K.door;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(170, 40, 4), M(0xe8d8b8));
    wall.position.set(0, 20, D0.z - 2);
    const door = new THREE.Mesh(new THREE.BoxGeometry(16, 30, 1), M(0x7a4a2a));
    door.position.set(D0.x, 15, D0.z);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), M(0xd8a83a, { metalness: 0.6 }));
    knob.position.set(D0.x + 5.5, 14, D0.z + 0.8);
    const step = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 6), M(0xa8a8a0));
    step.position.set(D0.x, 0.6, D0.z + 3);
    G.add(wall, door, knob, step);
    Z.door3d = door;
    for (let x = -80; x <= 80; x += 3) Z.colliders.push({ x, z: D0.z - 1, r: 1.6 });
    Z.platforms.push({ x: D0.x, z: D0.z + 3, r: 6, y: 1.2 });
  }
  // butterflies as big as birds
  {
    const bs = [];
    for (let k = 0; k < 8; k++) {
      const b = new THREE.Group();
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CircleGeometry(1.2, 10), new THREE.MeshBasicMaterial({ color: [0xffb040, 0x8ad8ff, 0xff8ad8][k % 3], side: THREE.DoubleSide }));
        w.position.x = sx * 1.1;
        b.add(w);
      }
      G.add(b);
      bs.push(b);
    }
    live.push((t) => bs.forEach((b, i) => {
      b.position.set(Math.cos(t * 0.3 + i) * (20 + i * 4), 8 + Math.sin(t + i) * 2, Math.sin(t * 0.25 + i * 1.3) * (20 + i * 4));
      b.children.forEach((w, j) => (w.rotation.y = (j ? -1 : 1) * Math.sin(t * 8 + i) * 0.9));
    }));
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  👑 THE FROZEN SEA — Phase 39. South to north:
//    the Snow King's palace of Glimmerhold and its kennel of royal huskies
//    → the frozen sea (sled it! lantern flags mark the way through the
//    blizzard; DARK ice is thin; blue ramps jump you over it; icebergs, a
//    ship frozen fast, a whale asleep under the ice) → the great glacier,
//    a slippery slope between rock walls with two crevasses → the frost
//    giants' palace on the plateau: the Hall of Statues, and the Giant
//    King's throne.
// ======================================================================
export const FROZENSEA = {
  R: 132,
  arrive: { x: 0, z: 118 },
  king: { x: -6, z: 114 },
  kennel: { x: 9, z: 110 },
  sledStart: { x: 9, z: 104 },
  seaEnd: -40,
  flags: [{ x: 0, z: 90 }, { x: -12, z: 70 }, { x: 9, z: 48 }, { x: -6, z: 26 }, { x: 14, z: 4 }, { x: 0, z: -20 }, { x: 0, z: -38 }],
  thin: [
    { x: -4, z: 79, r: 4 }, { x: 2, z: 58, r: 5.5 }, { x: -16, z: 46, r: 4 }, { x: 6, z: 35, r: 5 }, { x: 4, z: 14, r: 5.5 }, { x: -8, z: -4, r: 5 }, { x: 12, z: -12, r: 4 },
    { x: 6, z: 88, r: 3 }, { x: -9, z: 61, r: 3.5 }, { x: 12, z: 42, r: 3 }, { x: -2, z: 30, r: 3 }, { x: 10, z: -2, r: 3.5 }, { x: 4, z: -30, r: 3.5 }, { x: -6, z: -34, r: 3 },
    { x: 30, z: 80, r: 7 }, { x: -36, z: 60, r: 8 }, { x: 34, z: 34, r: 7 }, { x: -34, z: 6, r: 8 }, { x: 36, z: -6, r: 7 }, { x: -30, z: -30, r: 7 },
  ],
  ramps: [{ x: 2, z: 65, yaw: Math.PI }, { x: 5, z: 21, yaw: Math.PI }],
  bergs: [{ x: -22, z: 84, r: 5 }, { x: 22, z: 62, r: 6 }, { x: -26, z: 30, r: 6 }, { x: 28, z: 18, r: 5 }, { x: -20, z: -12, r: 6 }, { x: 24, z: -26, r: 5 }, { x: 18, z: 92, r: 4 }],
  ship: { x: -30, z: 54 },
  whale: { x: 16, z: 42 },
  glacier: { z0: -44, z1: -80, w: 10, top: 18, crevs: [-54, -63, -72] },
  hall: { z0: -86, z1: -116, w: 13 },
  watcher: { x: 0, z: -113 },
  jewel2: { x: 0, z: -109 },
  throne: { x: 0, z: -125 },
};
export function frozenHeight(x, z) {
  const K = FROZENSEA, Gl = K.glacier;
  if (z <= Gl.z1) return Gl.top;
  if (z < Gl.z0) {
    if (Gl.crevs.some((c) => Math.abs(z - c) < 1.15) && Math.abs(x) < Gl.w + 1) return -12;
    return Math.abs(x) < Gl.w + 1 ? ((Gl.z0 - z) / (Gl.z0 - Gl.z1)) * Gl.top : 0;
  }
  return 0;
}
function buildFrozenSea() {
  const K = FROZENSEA;
  const Z = baseZone("frozensea", K.R);
  Z.spots.arrive = { ...K.arrive };
  Z.height = (x, z) => frozenHeight(x, z);
  Z.iceAt = (x, z) => z > K.seaEnd && z < 98;
  const G = Z.group;
  const live = [];
  const SNOW = M(0xf0f6ff), ICE = M(0xbfe0f4), ROCK = M(0x7a8a9a), DEEP = M(0x4a6a8a);
  // the snowy shore (south) and the sea ice
  const shore = new THREE.Mesh(new THREE.CircleGeometry(K.R + 30, 48), SNOW);
  shore.rotation.x = -Math.PI / 2;
  G.add(shore);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2 * K.R + 40, 98 - K.seaEnd), new THREE.MeshStandardMaterial({ color: 0xa8d0ec, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.03, (98 + K.seaEnd) / 2);
  G.add(sea);
  // a whale, fast asleep under the ice
  {
    const W = K.whale;
    const body = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8), M(0x2a3a5a));
    body.scale.set(1, 0.6, 3.2);
    body.position.set(W.x, -1.6, W.z);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3, 3), M(0x2a3a5a));
    tail.rotation.x = Math.PI / 2;
    tail.scale.y = 0.3;
    tail.position.set(W.x, -1.6, W.z - 10);
    G.add(body, tail);
  }
  // thin ice: dark, cracked patches
  for (const T of K.thin) {
    const dark = new THREE.Mesh(new THREE.CircleGeometry(T.r, 18), new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.1, transparent: true, opacity: 0.85 }));
    dark.rotation.x = -Math.PI / 2;
    dark.position.set(T.x, 0.05, T.z);
    G.add(dark);
    for (let k = 0; k < 5; k++) {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.08, T.r * 1.4), new THREE.MeshBasicMaterial({ color: 0xe8f4ff }));
      crack.rotation.set(-Math.PI / 2, 0, k * 1.26 + T.x);
      crack.position.set(T.x, 0.07, T.z);
      G.add(crack);
    }
  }
  // blue snow ramps
  for (const R0 of K.ramps) {
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 3.4), M(0x6ab8ff, { emissive: 0x2a5aa0, emissiveIntensity: 0.5 }));
    ramp.position.set(R0.x, 0.2, R0.z);
    ramp.rotation.set(-0.28, R0.yaw, 0);
    G.add(ramp);
  }
  // lantern flags through the blizzard
  Z.flags = K.flags.map((F, i) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.4, 6), M(0x5a3e24));
    pole.position.y = 2.2;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), M(0xd83a3a, { side: THREE.DoubleSide }));
    flag.position.set(0.75, 3.8, 0);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd080 }));
    lamp.position.y = 4.5;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc060, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.setScalar(5);
    halo.position.y = 4.5;
    g.add(pole, flag, lamp, halo);
    g.position.set(F.x, 0, F.z);
    G.add(g);
    live.push((t) => (flag.rotation.y = Math.sin(t * 6 + i) * 0.4));
    return g;
  });
  // icebergs, and a ship frozen fast
  for (const B of K.bergs) {
    const berg = new THREE.Mesh(new THREE.IcosahedronGeometry(B.r, 0), ICE);
    berg.scale.y = 1.3;
    berg.position.set(B.x, B.r * 0.4, B.z);
    G.add(berg);
    Z.colliders.push({ x: B.x, z: B.z, r: B.r * 0.9 });
  }
  {
    const S0 = K.ship;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 13), M(0x5a4030));
    hull.position.set(S0.x, 0.8, S0.z);
    hull.rotation.set(0.12, 0.5, 0.1);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 11, 6), M(0x5a4030));
    mast.position.set(S0.x, 6, S0.z);
    mast.rotation.z = 0.1;
    const frost = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.5, 13.2), SNOW);
    frost.position.set(S0.x, 2.4, S0.z);
    frost.rotation.copy(hull.rotation);
    G.add(hull, mast, frost);
    Z.colliders.push({ x: S0.x - 2, z: S0.z - 4, r: 3 }, { x: S0.x, z: S0.z, r: 3 }, { x: S0.x + 2, z: S0.z + 4, r: 3 });
  }
  // ---- Glimmerhold, the Snow King's palace (south)
  {
    const P = { x: 0, z: 128 };
    const wall = new THREE.Mesh(new THREE.BoxGeometry(44, 12, 4), ICE);
    wall.position.set(P.x, 6, P.z);
    G.add(wall);
    for (const [dx, h] of [[-20, 22], [-9, 18], [0, 26], [9, 18], [20, 22]]) {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, h, 10), M(0xd8ecff));
      tw.position.set(P.x + dx, h / 2, P.z - 1);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 10), M(0x7ab0e8));
      sp.position.set(P.x + dx, h + 3, P.z - 1);
      G.add(tw, sp);
    }
    for (let x = -22; x <= 22; x += 2.5) Z.colliders.push({ x, z: P.z - 2.6, r: 1.3 });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), M(0x3a5a8a));
    door.position.set(P.x, 4, P.z - 2.05);
    door.rotation.y = Math.PI;
    G.add(door);
    // the royal kennel
    const Kn = K.kennel;
    const hut = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4), M(0x8a5a32));
    hut.position.set(Kn.x + 4, 1.5, Kn.z + 2);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 2, 4), SNOW);
    roof.position.set(Kn.x + 4, 4, Kn.z + 2);
    roof.rotation.y = Math.PI / 4;
    G.add(hut, roof);
    Z.colliders.push({ x: Kn.x + 2.5, z: Kn.z + 2, r: 2 }, { x: Kn.x + 5.5, z: Kn.z + 2, r: 2 });
    const sg = signPost("👑 GLIMMERHOLD 👑\nthe Snow King's palace", { w: 4.4, h: 1.5, height: 2.2, style: "ice" });
    sg.position.set(-5, 0, K.arrive.z - 2);
    sg.rotation.y = 0.25;
    const sg2 = signPost("🐕 ROYAL SLEDS → the Frozen Sea", { w: 4, h: 1.1, style: "ice" });
    sg2.position.set(K.kennel.x - 4, 0, K.kennel.z - 3);
    sg2.rotation.y = -0.3;
    G.add(sg, sg2);
  }
  // ---- the glacier: a slope of blue ice between walls of rock, with two crevasses
  {
    const Gl = K.glacier, L = Gl.z0 - Gl.z1, len = Math.hypot(L, Gl.top);
    const slope = new THREE.Mesh(new THREE.PlaneGeometry(2 * Gl.w + 2, len), M(0xcfe8fa));
    slope.rotation.x = -Math.PI / 2 + Math.atan2(Gl.top, L);
    slope.position.set(0, Gl.top / 2 + 0.02, (Gl.z0 + Gl.z1) / 2);
    G.add(slope);
    for (const c of Gl.crevs) {
      const y = ((Gl.z0 - c) / L) * Gl.top;
      const gap = new THREE.Mesh(new THREE.BoxGeometry(2 * Gl.w + 2, 0.3, 2.3), M(0x0a1a2a));
      gap.position.set(0, y + 0.06, c);
      gap.rotation.x = Math.atan2(Gl.top, L);
      G.add(gap);
    }
    for (const sx of [-1, 1]) {
      const rock = new THREE.Mesh(new THREE.BoxGeometry(8, Gl.top + 10, L + 4), ROCK);
      rock.position.set(sx * (Gl.w + 5), (Gl.top + 10) / 2, (Gl.z0 + Gl.z1) / 2);
      G.add(rock);
      for (let z = Gl.z0 + 2; z >= Gl.z1 - 2; z -= 2.4) Z.colliders.push({ x: sx * (Gl.w + 1.6), z, r: 1.4 });
    }
    // the plateau's face, either side of the glacier
    for (const sx of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.BoxGeometry(60, Gl.top, 3), ROCK);
      face.position.set(sx * (Gl.w + 31), Gl.top / 2, Gl.z1 + 1.5);
      G.add(face);
      for (let x = Gl.w + 1; x <= 64; x += 2.4) Z.colliders.push({ x: sx * x, z: Gl.z1 + 1, r: 1.4, top: Gl.top - 1 });
    }
    const top = new THREE.Mesh(new THREE.CircleGeometry(80, 40, Math.PI, Math.PI), SNOW);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, Gl.top + 0.01, Gl.z1);
    G.add(top);
    const foot = signPost("⛰️ THE GREAT GLACIER\nkeep moving — it's SLIPPERY!", { w: 4.4, h: 1.5, style: "ice" });
    foot.position.set(5, 0, Gl.z0 + 4);
    foot.rotation.y = -0.2;
    G.add(foot);
  }
  // ---- the frost giants' palace on the plateau: the Hall of Statues, and the throne
  {
    const H = K.hall, y0 = K.glacier.top;
    for (const sx of [-1, 1]) {
      for (let z = H.z0; z >= H.z1; z -= 6) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 16, 8), M(0xd8f0ff));
        col.position.set(sx * (H.w - 2), y0 + 8, z);
        G.add(col);
        Z.colliders.push({ x: sx * (H.w - 2), z, r: 1.3 });
      }
      const side = new THREE.Mesh(new THREE.BoxGeometry(2, 18, H.z0 - H.z1 + 20), ICE);
      side.position.set(sx * (H.w + 1), y0 + 9, (H.z0 + H.z1) / 2 - 8);
      G.add(side);
      for (let z = H.z0; z >= H.z1 - 14; z -= 2.4) Z.colliders.push({ x: sx * (H.w + 0.5), z, r: 1.2 });
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * H.w, H.z0 - H.z1 + 20), new THREE.MeshStandardMaterial({ color: 0xe0f2ff, roughness: 0.05, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, y0 + 0.03, (H.z0 + H.z1) / 2 - 8);
    G.add(floor);
    // the start line of the Hall of Statues
    const line = new THREE.Mesh(new THREE.PlaneGeometry(2 * H.w - 4, 0.4), new THREE.MeshBasicMaterial({ color: 0x3a8aff }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, y0 + 0.05, H.z0);
    G.add(line);
    // the jewel's pedestal, and the throne
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 1.4, 8), M(0xbfe0f4));
    ped.position.set(K.jewel2.x, y0 + 0.7, K.jewel2.z);
    G.add(ped);
    Z.colliders.push({ x: K.jewel2.x, z: K.jewel2.z, r: 0.8, top: y0 + 1.4 });
    const T = K.throne;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 6), M(0x9ac8ec));
    seat.position.set(T.x, y0 + 3, T.z - 2);
    const back = new THREE.Mesh(new THREE.BoxGeometry(12, 20, 2), M(0x9ac8ec));
    back.position.set(T.x, y0 + 10, T.z - 5);
    G.add(seat, back);
    for (let x = -6; x <= 6; x += 2.4) Z.colliders.push({ x: T.x + x, z: T.z - 1.5, r: 1.4 });
    const sg = signPost("THE HALL OF STATUES\nmove ONLY when he isn't looking", { w: 4.6, h: 1.5, style: "ice" });
    sg.position.set(-6, y0, H.z0 + 3);
    sg.rotation.y = 0.2;
    G.add(sg);
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🌴 THE LOST JUNGLE — Phase 38. South to north:
//    base camp on the river beach (Marisol's boat) → a WALL of jungle with
//    one way through, choked with vines (hack it) → a deep RAVINE (swing
//    across on hanging vines, via a rock pillar in the middle) → the
//    CROCODILE RIVER (hop the stepping stones — never swim!) → the deep
//    jungle, where three lost explorers are stuck: up a giant kapok tree,
//    sinking in quicksand, and in a vine-choked cave by a waterfall → and
//    hidden at the very end, the overgrown temple of the jungle elder.
// ======================================================================
export const JUNGLE = {
  R: 86,
  arrive: { x: 0, z: 76 },
  marisol: { x: 5, z: 70 },
  wallZ: 56,
  curtain: { x: 0, z: 56 },
  ravine: { z0: 34, z1: 20, floor: -14 },
  pillar: { x: 0, z: 27, r: 1.8 },
  swings: [
    { ax: 0, ay: 9.5, az: 31, from: 35.2, to: 27 }, // south edge ⇄ the pillar
    { ax: 0, ay: 9.5, az: 23, from: 27, to: 18.8 }, // the pillar ⇄ north edge
  ],
  river: { z0: 6, z1: -10 },
  stones: [{ x: 0, z: 3.4 }, { x: 0.6, z: 0.2 }, { x: -0.4, z: -3 }, { x: 0.3, z: -6.2 }, { x: 0, z: -9.2 }],
  crocLanes: [{ z: 0.2, sp: 8 }, { z: -3, sp: -9.5 }, { z: -6.2, sp: 7.5 }], // (two crocs patrol each lane — HARD)
  kapok: { x: -44, z: -32 },
  quick: { x: 40, z: -28, r: 4 },
  cave: { x: 54, z: -60 },
  temple: { x: 0, z: -72 },
  elderDoor: { x: 0, z: -60 },
  platforms: [],
};
{
  const K = JUNGLE;
  // the kapok's spiral of branch-steps up to the explorer's lookout
  for (let k = 0; k < 10; k++) {
    const a = k * 1.15;
    K.platforms.push({ x: K.kapok.x + Math.cos(a) * 4.2, z: K.kapok.z + Math.sin(a) * 4.2, r: 1.7, y: 1.4 + k * 1.45 });
  }
  K.lookout = { x: K.kapok.x, z: K.kapok.z, y: 1.4 + 10 * 1.45, r: 4.4 };
}
export function jungleHeight(x, z) {
  const K = JUNGLE, Rv = K.ravine;
  if (z < Rv.z0 && z > Rv.z1) return Math.hypot(x - K.pillar.x, z - K.pillar.z) < K.pillar.r ? 0 : Rv.floor;
  if (z < K.river.z0 && z > K.river.z1) return -1.6;
  return 0;
}
function buildJungle() {
  const K = JUNGLE;
  const Z = baseZone("jungle", K.R);
  Z.spots.arrive = { ...K.arrive };
  Z.height = (x, z) => jungleHeight(x, z);
  Z.waterAt = (x, z) => (z < K.river.z0 - 0.4 && z > K.river.z1 + 0.4 ? 0 : null);
  const G = Z.group;
  const live = [];
  const GR = [0x2a6a2a, 0x3a7a2a, 0x1f5a2a, 0x4a8a3a];
  // ground — two halves either side of the ravine, plus the riverbanks
  for (const [z0, z1] of [[K.R + 20, K.ravine.z0], [K.ravine.z1, K.river.z0], [K.river.z1, -K.R - 20]]) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(2 * K.R + 40, z0 - z1), M(0x4a6a2a));
    g.rotation.x = -Math.PI / 2;
    g.position.set(0, 0, (z0 + z1) / 2);
    G.add(g);
  }
  // the beach + Marisol's boat at the south
  {
    const sand = new THREE.Mesh(new THREE.CircleGeometry(16, 24), M(0xe8d8a0));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.02, K.R - 4);
    G.add(sand);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 9), M(0x7a4a2a));
    hull.position.set(-8, 0.8, K.R - 2);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 8, 6), M(0x5a3a1a));
    mast.position.set(-8, 5, K.R - 2);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5), M(0xf4ecd8, { side: THREE.DoubleSide }));
    sail.position.set(-8, 5.4, K.R - 1.6);
    sail.rotation.y = Math.PI / 2;
    G.add(hull, mast, sail);
    Z.colliders.push({ x: -8, z: K.R - 4, r: 1.8 }, { x: -8, z: K.R, r: 1.8 });
    // the camp: a tent and a campfire
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 4), M(0xc8b080));
    tent.position.set(10, 1.5, 70);
    tent.rotation.y = Math.PI / 4;
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff9a3a }));
    fire.position.set(6, 0.5, 66);
    G.add(tent, fire);
    Z.colliders.push({ x: 10, z: 70, r: 2.2 });
  }
  // a jungle tree: tall trunk, a wide flat crown, hanging vines
  const jtree = (x, z, h, k, col = true) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, h, 7), M(0x5a4a32));
    trunk.position.set(x, h / 2, z);
    G.add(trunk);
    for (let j = 0; j < 3; j++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(3.2 - j * 0.4, 9, 6), M(GR[(k + j) % 4]));
      c.scale.y = 0.42;
      c.position.set(x + Math.cos(j * 2.1 + k) * 1.8 * (j ? 1 : 0), h + j * 0.5, z + Math.sin(j * 2.1 + k) * 1.8 * (j ? 1 : 0));
      G.add(c);
    }
    if (k % 2 === 0) {
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h * 0.7, 4), M(0x3a7a2a));
      vine.position.set(x + 1.6, h * 0.65, z + 0.6);
      G.add(vine);
    }
    if (col) Z.colliders.push({ x, z, r: 0.85 });
  };
  const palm = (x, z, h, k) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, h, 6), M(0x8a6a42));
    trunk.position.set(x, h / 2, z);
    trunk.rotation.z = Math.sin(k) * 0.12;
    G.add(trunk);
    for (let j = 0; j < 6; j++) {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 3.4), M(GR[(k + j) % 4]));
      fr.position.set(x + Math.cos(j) * 1.4, h - 0.3, z + Math.sin(j) * 1.4);
      fr.rotation.set(0.35, -j + Math.PI / 2, 0);
      G.add(fr);
    }
    Z.colliders.push({ x, z, r: 0.5 });
  };
  const keep = (x, z, r) => {
    const Rv = K.ravine;
    if (z < Rv.z0 + 3 && z > Rv.z1 - 3) return true;
    if (z < K.river.z0 + 2.5 && z > K.river.z1 - 2.5) return true;
    if (Math.abs(x) < 7 + r) return true; // (the trail north stays clear)
    return [{ ...K.arrive, r: 18 }, { ...K.kapok, r: 9 }, { ...K.quick, r: 8 }, { ...K.cave, r: 12 }, { ...K.temple, r: 22 }].some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r);
  };
  for (let k = 0; k < 240; k++) {
    const a = k * 2.39996, d = 6 + ((k * 9.7) % (K.R - 4));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 2)) continue;
    if (k % 4 === 0) palm(x, z, 6 + (k % 3), k);
    else jtree(x, z, 7 + (k % 5) * 1.3, k);
  }
  // giant ferns and bright jungle flowers
  for (let k = 0; k < 90; k++) {
    const a = k * 1.618 * 2.4, d = 5 + ((k * 13.1) % (K.R - 4));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 0.5) && Math.abs(x) < 7) continue;
    if (z < K.ravine.z0 + 1 && z > K.river.z1 - 1) continue;
    if (k % 3) {
      for (let j = 0; j < 5; j++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 3), M(GR[(k + j) % 4]));
        f.position.set(x, 0.9, z);
        f.rotation.set(Math.cos(j * 1.26) * 0.9, 0, Math.sin(j * 1.26) * 0.9);
        G.add(f);
      }
    } else {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 6, 1, true), M([0xff3a6a, 0xffb020, 0xd040ff][k % 3], { side: THREE.DoubleSide }));
      fl.rotation.x = Math.PI;
      fl.position.set(x, 0.7, z);
      G.add(fl);
    }
  }
  // ---- the jungle WALL: an impassable tangle — one way through, choked with vines
  {
    for (let x = -K.R; x <= K.R; x += 2.6) {
      if (Math.abs(x) < 3.2) continue;
      const h = 5 + Math.abs(Math.sin(x)) * 4;
      const bush = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), M(GR[Math.abs(Math.round(x)) % 4]));
      bush.scale.set(1, h / 4.4, 1);
      bush.position.set(x, h / 2, K.wallZ + Math.sin(x * 1.7) * 0.6);
      G.add(bush);
      Z.colliders.push({ x, z: K.wallZ, r: 1.6 });
    }
    // the vine curtain
    const cur = new THREE.Group();
    for (let k = 0; k < 16; k++) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 6, 4), M(GR[k % 4]));
      v.position.set(-3 + k * 0.4, 3, Math.sin(k * 2.3) * 0.3);
      v.rotation.z = Math.sin(k * 1.7) * 0.15;
      cur.add(v);
      if (k % 3 === 0) {
        const lf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), M(GR[(k + 1) % 4]));
        lf.scale.set(1, 0.4, 1.4);
        lf.position.set(-3 + k * 0.4, 1 + (k % 5), 0.2);
        cur.add(lf);
      }
    }
    cur.position.set(K.curtain.x, 0, K.curtain.z);
    G.add(cur);
    const ci = Z.colliders.length;
    for (const dx of [-2, 0, 2]) Z.colliders.push({ x: K.curtain.x + dx, z: K.curtain.z, r: 1.3 });
    Z.curtains = [{ ...K.curtain, mesh: cur, cols: [ci, ci + 1, ci + 2] }];
    const sg = signPost("⚠ THE LOST JUNGLE ⚠\nnobody has ever come back", { w: 4, h: 1.4, style: "wood" });
    sg.position.set(6, 0, K.wallZ + 4);
    sg.rotation.y = -0.3;
    G.add(sg);
  }
  // ---- the ravine
  {
    const Rv = K.ravine, W = 2 * K.R + 40;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Rv.z0 - Rv.z1), M(0x2a3a2a));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, Rv.floor, (Rv.z0 + Rv.z1) / 2);
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(W, 3), new THREE.MeshStandardMaterial({ color: 0x4a9ab8, roughness: 0.2 }));
    stream.rotation.x = -Math.PI / 2;
    stream.position.set(0, Rv.floor + 0.05, (Rv.z0 + Rv.z1) / 2);
    G.add(floor, stream);
    for (const [zz, dir] of [[Rv.z0, -1], [Rv.z1, 1]]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(W, -Rv.floor), M(0x6a5a42, { side: THREE.DoubleSide }));
      wall.position.set(0, Rv.floor / 2, zz);
      G.add(wall);
      // mossy lip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, 0.8), M(0x3a7a2a));
      lip.position.set(0, -0.15, zz + dir * 0.4);
      G.add(lip);
    }
    const P = K.pillar;
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r + 1, -Rv.floor, 10), M(0x7a6a52));
    pil.position.set(P.x, Rv.floor / 2, P.z);
    const top = new THREE.Mesh(new THREE.CircleGeometry(P.r, 12), M(0x3a7a2a));
    top.rotation.x = -Math.PI / 2;
    top.position.set(P.x, 0.02, P.z);
    G.add(pil, top);
    // the two great swinging vines, hanging from a fallen trunk across the ravine
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 26, 8), M(0x5a4a32));
    log.rotation.x = Math.PI / 2;
    log.position.set(0, K.swings[0].ay + 0.6, (Rv.z0 + Rv.z1) / 2);
    G.add(log);
    for (const zz of [Rv.z0 + 3, Rv.z1 - 3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, K.swings[0].ay + 1, 8), M(0x5a4a32));
      post.position.set(0, (K.swings[0].ay + 1) / 2, zz);
      G.add(post);
      Z.colliders.push({ x: 0, z: zz, r: 0.9 });
    }
    Z.vines = K.swings.map((S0) => {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 5), M(0x3a8a2a));
      G.add(v);
      return v;
    });
    const sg = signPost("GRAB A VINE (E)\nlet go with SPACE", { w: 3.4, h: 1.2, style: "leaf" });
    sg.position.set(3.4, 0, Rv.z0 + 2.4);
    sg.rotation.y = -0.4;
    G.add(sg);
  }
  // ---- the crocodile river + stepping stones
  {
    const Rr = K.river, W = 2 * K.R + 40;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(W, Rr.z0 - Rr.z1), new THREE.MeshStandardMaterial({ color: 0x4a7a5a, roughness: 0.15, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.02, (Rr.z0 + Rr.z1) / 2);
    G.add(water);
    for (const S0 of K.stones) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 1.2, 9), M(0x8a8478));
      st.position.set(S0.x, 0, S0.z);
      G.add(st);
      Z.platforms.push({ x: S0.x, z: S0.z, r: 1.25, y: 0.6 });
    }
    const sg = signPost("🐊 DO NOT SWIM 🐊\nhop the stones — watch the eyes!", { w: 4, h: 1.4, style: "stone" });
    sg.position.set(-4, 0, Rr.z0 + 3);
    sg.rotation.y = 0.3;
    G.add(sg);
  }
  // ---- explorer 1: the giant kapok tree, with a lookout up top
  {
    const T = K.kapok;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 22, 10), M(0x6a5a42));
    trunk.position.set(T.x, 11, T.z);
    G.add(trunk);
    Z.colliders.push({ x: T.x, z: T.z, r: 2.8 });
    for (let j = 0; j < 5; j++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(6 - j * 0.5, 10, 7), M(GR[j % 4]));
      c.scale.y = 0.4;
      c.position.set(T.x + Math.cos(j * 1.3) * (j ? 5 : 0), 22 + j * 0.6, T.z + Math.sin(j * 1.3) * (j ? 5 : 0));
      G.add(c);
    }
    for (const P of K.platforms) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.4, 9), M(0x7a6a4a));
      br.position.set(P.x, P.y - 0.2, P.z);
      G.add(br);
      Z.platforms.push({ ...P });
    }
    const L = K.lookout;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(L.r, L.r, 0.4, 14), M(0x9a7a4a));
    deck.position.set(L.x, L.y - 0.2, L.z);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(L.r + 0.6, 2.4, 10), M(0xc8a860));
    roof.position.set(L.x, L.y + 4.2, L.z);
    G.add(deck, roof);
    Z.platforms.push({ x: L.x, z: L.z, r: L.r, y: L.y });
  }
  // ---- explorer 2: the quicksand
  {
    const Q = K.quick;
    const pit = new THREE.Mesh(new THREE.CircleGeometry(Q.r, 20), M(0xb89a5a));
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(Q.x, 0.04, Q.z);
    G.add(pit);
    const swirl = new THREE.Mesh(new THREE.RingGeometry(1, 1.3, 20), M(0x9a7a42));
    swirl.rotation.x = -Math.PI / 2;
    swirl.position.set(Q.x, 0.06, Q.z);
    G.add(swirl);
    live.push((t) => (swirl.rotation.z = t * 0.6));
    Z.colliders.push({ x: Q.x, z: Q.z, r: Q.r - 1.2 });
  }
  // ---- explorer 3: a cave, choked with vines, beside a waterfall
  {
    const C0 = K.cave;
    const rock = M(0x6a6a5a);
    for (const [dx, dz, w, d] of [[0, -4, 12, 2], [-5, 0, 2, 8], [5, 0, 2, 8]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 9, d), rock);
      b.position.set(C0.x + dx, 4.5, C0.z + dz);
      G.add(b);
      for (let k = -w / 2 + 1; k <= w / 2 - 1; k += 1.6) for (let j = -d / 2 + 1; j <= d / 2 - 1; j += 1.6) Z.colliders.push({ x: C0.x + dx + k, z: C0.z + dz + j, r: 1.1 });
      if (w > 4) Z.colliders.push({ x: C0.x + dx + w / 2 - 0.8, z: C0.z + dz, r: 1.1 }, { x: C0.x + dx - w / 2 + 0.8, z: C0.z + dz, r: 1.1 });
    }
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 10), rock);
    roofR.position.set(C0.x, 9.5, C0.z - 1);
    G.add(roofR);
    // the waterfall pours down right beside it
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(4, 14), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    fall.position.set(C0.x + 9, 7, C0.z - 2);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 16), new THREE.MeshStandardMaterial({ color: 0x6ab8d8, roughness: 0.1 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(C0.x + 9, 0.04, C0.z);
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(10, 15, 3), rock);
    cliff.position.set(C0.x + 9, 7.5, C0.z - 4.5);
    G.add(fall, pool, cliff);
    live.push((t) => (fall.material.opacity = 0.6 + Math.sin(t * 9) * 0.1));
    // vines across the mouth
    const cur = new THREE.Group();
    for (let k = 0; k < 18; k++) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 8, 4), M(GR[k % 4]));
      v.position.set(-4 + k * 0.47, 4, Math.sin(k * 2.3) * 0.3);
      v.rotation.z = Math.sin(k * 1.7) * 0.12;
      cur.add(v);
    }
    cur.position.set(C0.x, 0, C0.z + 4);
    G.add(cur);
    const ci = Z.colliders.length;
    for (const dx of [-3, -1, 1, 3]) Z.colliders.push({ x: C0.x + dx, z: C0.z + 4, r: 1.2 });
    Z.curtains.push({ x: C0.x, z: C0.z + 4, mesh: cur, cols: [ci, ci + 1, ci + 2, ci + 3] });
  }
  // ---- the overgrown temple (and its elder's great stone door)
  {
    const T = K.temple;
    const stone = M(0x8a8a72), moss = M(0x4a7a3a);
    for (let k = 0; k < 5; k++) {
      const w = 30 - k * 5.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 3.2, w), k % 2 ? moss : stone);
      b.position.set(T.x, 1.6 + k * 3.2, T.z);
      G.add(b);
    }
    for (let x = -14; x <= 14; x += 2.2) Z.colliders.push({ x: T.x + x, z: T.z + 14, r: 1.2 });
    for (let z = -14; z <= 14; z += 2.2) Z.colliders.push({ x: T.x - 14, z: T.z + z, r: 1.2 }, { x: T.x + 14, z: T.z + z, r: 1.2 });
    // the great carved face over the door
    const face = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(9, 9, 1), stone);
    const eyes = [-2, 2].map((dx) => {
      const e = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), new THREE.MeshBasicMaterial({ color: 0x1a1a10 }));
      e.position.set(dx, 2, 0.52);
      return e;
    });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 1.1), M(0x6a6a52));
    mouth.position.set(0, -2, 0.05);
    face.add(slab, ...eyes, mouth);
    face.position.set(T.x, 4.5, T.z + 15.2);
    G.add(face);
    Z.templeMouth = mouth;
    Z.templeEyes = eyes;
    // a dark way in, behind the mouth
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshBasicMaterial({ color: 0x0a0a06 }));
    dark.position.set(T.x, 2.5, T.z + 15.68);
    G.add(dark);
    // mossy statues of monkeys either side
    for (const sx of [-7, 7]) {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), moss);
      body.position.set(T.x + sx, 1.4, T.z + 18);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), stone);
      head.position.set(T.x + sx, 3.2, T.z + 18);
      G.add(body, head);
      Z.colliders.push({ x: T.x + sx, z: T.z + 18, r: 1.4 });
    }
  }
  // parrots, looping over the treetops
  {
    const ps = [];
    for (let k = 0; k < 7; k++) {
      const b = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), M([0xff3a2a, 0x2a8aff, 0x3ad84a][k % 3]));
      body.scale.z = 1.8;
      b.add(body);
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), new THREE.MeshBasicMaterial({ color: [0xffd020, 0x2ad8ff, 0xffe020][k % 3], side: THREE.DoubleSide }));
        w.position.x = sx * 0.6;
        b.add(w);
      }
      G.add(b);
      ps.push(b);
    }
    live.push((t) => ps.forEach((b, i) => {
      const a = t * (0.25 + i * 0.03) + i * 0.9, r = 24 + i * 7;
      b.position.set(Math.cos(a) * r, 13 + Math.sin(t + i) * 1.5, Math.sin(a) * r - 10);
      b.rotation.y = -a;
      b.children.forEach((w, j) => j && (w.rotation.z = (j === 1 ? 1 : -1) * Math.sin(t * 10 + i) * 0.6));
    }));
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🍂 AMBERWOOD — Phase 37. A wood that's been stuck in autumn for a whole
//  year: every tree heavy with red and gold leaves that FORGOT HOW TO FALL.
//  Not a breath of wind. In a hollow log the Autumn Fox — who blows the
//  first wind of every autumn — is fast asleep. In the middle stands the old
//  Harvest Tree, with seven empty leaf-cups round its roots.
// ======================================================================
export const AMBERWOOD = {
  R: 64,
  arrive: { x: 0, z: 56 },
  tree: { x: 0, z: -6 },
  den: { x: -32, z: -30 },
  foxBed: { x: -26.6, z: -35.4 },
  pile: { x: -21, z: -29 },
  stump: { x: -17.2, z: -25.4, y: 2.6 },
  heavy: [{ x: 24, z: 30 }, { x: 38, z: 4 }, { x: 30, z: -30 }, { x: 6, z: -44 }, { x: -42, z: 6 }, { x: -26, z: 32 }],
  tower: [{ x: 44, z: -14, y: 1.6, r: 2.2 }, { x: 47, z: -19, y: 3.4, r: 1.8 }, { x: 44, z: -24, y: 5.2, r: 1.8 }, { x: 39, z: -26, y: 7, r: 2.4 }],
  cups: [],
};
{
  const K = AMBERWOOD;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.3;
    K.cups.push({ x: K.tree.x + Math.cos(a) * 6, z: K.tree.z + Math.sin(a) * 6 });
  }
}
function buildAmberwood() {
  const K = AMBERWOOD;
  const Z = baseZone("amberwood", K.R);
  Z.spots.arrive = { ...K.arrive };
  Z.height = () => 0;
  const G = Z.group;
  const live = [];
  const ground = new THREE.Mesh(new THREE.CircleGeometry(K.R + 24, 48), M(0x8a5a2a));
  ground.rotation.x = -Math.PI / 2;
  G.add(ground);
  {
    const welcome = signPost("🍂 AMBERWOOD 🍂\nwhere it's always autumn", { w: 4.2, h: 1.5, height: 2.2, style: "gold" });
    welcome.position.set(K.arrive.x + 4, 0, K.arrive.z - 3);
    welcome.rotation.y = -0.3;
    G.add(welcome);
  }
  const AUT = [0xd8402a, 0xe86a1a, 0xf0a020, 0xc8301a, 0xe8c040, 0xb8501a];
  // scattered fallen-looking leaves painted on the ground (just a few — they never fell!)
  for (let k = 0; k < 90; k++) {
    const a = k * 2.4, d = 4 + ((k * 17.3) % (K.R - 4));
    const lf = new THREE.Mesh(new THREE.CircleGeometry(0.35, 5), M(AUT[k % 6]));
    lf.rotation.set(-Math.PI / 2, 0, k);
    lf.position.set(Math.cos(a) * d, 0.03, Math.sin(a) * d);
    G.add(lf);
  }
  const keep = (x, z, r) =>
    [{ ...K.tree, r: 15 }, { ...K.den, r: 7 }, { ...K.pile, r: 7 }, { ...K.foxBed, r: 4 }, { ...K.arrive, r: 8 }, ...K.heavy.map((h) => ({ ...h, r: 5 })), ...K.tower.map((t) => ({ ...t, r: 4 }))].some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r);
  const autumnTree = (x, z, h, k, heavy) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * (heavy ? 1.4 : 1), 0.7 * (heavy ? 1.4 : 1), h, 7), M(0x5a3a22));
    trunk.position.set(x, h / 2, z);
    G.add(trunk);
    const n = heavy ? 5 : 3;
    for (let j = 0; j < n; j++) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry((heavy ? 3.2 : 2.4) - j * 0.2, 0), M(AUT[(k + j) % 6]));
      const a = j * 2.1 + k;
      blob.position.set(x + Math.cos(a) * (j ? 1.6 : 0), h + (j ? -0.6 + (j % 2) : 0.8), z + Math.sin(a) * (j ? 1.6 : 0));
      G.add(blob);
    }
    Z.colliders.push({ x, z, r: heavy ? 1 : 0.75 });
  };
  for (let k = 0; k < 120; k++) {
    const a = k * 2.39996, d = 9 + ((k * 11.3) % (K.R - 6));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 2)) continue;
    autumnTree(x, z, 5 + (k % 4) * 1.4, k, false);
  }
  // the heavy trees: branches drooping low under all their leaves — shake them!
  Z.heavyBranches = K.heavy.map((H, i) => {
    autumnTree(H.x, H.z, 7, i * 2, true);
    const br = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 4, 6), M(0x5a3a22));
    limb.rotation.z = Math.PI / 2 - 0.5;
    limb.position.set(1.8, 2.6, 0);
    const bunch = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), M(AUT[(i + 2) % 6]));
    bunch.position.set(3.4, 1.7, 0);
    br.add(limb, bunch);
    br.position.set(H.x, 0, H.z);
    br.rotation.y = Math.atan2(-H.x, -H.z) - Math.PI / 2; // (droops toward the middle of the wood)
    G.add(br);
    return br;
  });
  // ---- the Harvest Tree
  {
    const T = K.tree;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 18, 10), M(0x6a4428));
    trunk.position.set(T.x, 9, T.z);
    G.add(trunk);
    Z.colliders.push({ x: T.x, z: T.z, r: 3 });
    for (let j = 0; j < 9; j++) {
      const a = j * 0.7;
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(5 - (j % 3), 1), M([0xe8b030, 0xd8902a, 0xf0c848][j % 3]));
      blob.position.set(T.x + Math.cos(a) * (j ? 5 : 0), 19 + (j % 3) * 1.6, T.z + Math.sin(a) * (j ? 5 : 0));
      G.add(blob);
    }
    for (let j = 0; j < 6; j++) {
      const a = j * 1.05;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 5, 6), M(0x6a4428));
      root.rotation.set(Math.PI / 2 - 0.35, 0, -a + Math.PI / 2);
      root.position.set(T.x + Math.cos(a) * 3.4, 0.6, T.z + Math.sin(a) * 3.4);
      G.add(root);
    }
    // seven little acorn-cup bowls round the roots, for the golden leaves
    Z.cupLeaves = K.cups.map((c) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 0.6, 12, 1, true), M(0x8a6a3a, { side: THREE.DoubleSide }));
      cup.position.set(c.x, 0.3, c.z);
      const base = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), M(0x5a4020));
      base.rotation.x = -Math.PI / 2;
      base.position.set(c.x, 0.05, c.z);
      const gold = new THREE.Mesh(new THREE.CircleGeometry(0.6, 6), new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xa07000, emissiveIntensity: 0.8, side: THREE.DoubleSide, flatShading: true }));
      gold.rotation.x = -Math.PI / 2.4;
      gold.position.set(c.x, 0.7, c.z);
      gold.visible = false;
      G.add(cup, base, gold);
      return gold;
    });
  }
  // ---- the Autumn Fox's den: a big hollow log
  {
    const D = K.den;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 9, 14, 1, true), M(0x6a4a2a, { side: THREE.DoubleSide }));
    log.rotation.z = Math.PI / 2;
    log.rotation.y = 0.8;
    log.position.set(D.x, 2.4, D.z);
    const ends = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.6, 14), M(0xc8a070, { side: THREE.DoubleSide }));
    ends.rotation.y = 0.8 + Math.PI / 2;
    ends.position.set(D.x + Math.cos(0.8) * 4.5, 2.4, D.z - Math.sin(0.8) * 4.5);
    G.add(log, ends);
    for (let k = -3; k <= 3; k++) if (Math.abs(k) > 0) Z.colliders.push({ x: D.x - Math.sin(0.8 + Math.PI / 2) * k * 1.3, z: D.z - Math.cos(0.8 + Math.PI / 2) * k * 1.3, r: 2.4 });
    // the stump to jump off — and the empty spot where the leaf pile will go
    const S = K.stump;
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, S.y, 10), M(0x7a5232));
    stump.position.set(S.x, S.y / 2, S.z);
    const rings = new THREE.Mesh(new THREE.CircleGeometry(1.45, 14), M(0xc8a070));
    rings.rotation.x = -Math.PI / 2;
    rings.position.set(S.x, S.y + 0.01, S.z);
    G.add(stump, rings);
    Z.colliders.push({ x: S.x, z: S.z, r: 1.2, top: S.y });
    Z.platforms.push({ x: S.x, z: S.z, r: 1.6, y: S.y });
    // the leaf pile grows bundle by bundle
    const pile = new THREE.Group();
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = (k % 5) * 0.5;
      const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), M(AUT[k % 6]));
      lf.position.set(Math.cos(a) * d, 0.3 + (k % 7) * 0.12, Math.sin(a) * d);
      pile.add(lf);
    }
    pile.position.set(K.pile.x, 0, K.pile.z);
    pile.scale.setScalar(0.01);
    G.add(pile);
    Z.pile = pile;
    // a sign, so nobody misses the stump trick
    const sg = signPost("SHH! 🦊 FOX ASLEEP\n(only a BIG crunch wakes her)", { w: 3.6, h: 1.3, style: "wood" });
    sg.position.set(S.x + 3.2, 0, S.z + 1.4);
    sg.rotation.y = 0.5;
    G.add(sg);
  }
  // ---- a stack of old stumps to the east (some golden leaves blow up high)
  for (const T0 of K.tower) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(T0.r, T0.r + 0.3, T0.y, 10), M(0x7a5232));
    st.position.set(T0.x, T0.y / 2, T0.z);
    G.add(st);
    Z.platforms.push({ x: T0.x, z: T0.z, r: T0.r + 0.2, y: T0.y });
    Z.colliders.push({ x: T0.x, z: T0.z, r: T0.r - 0.4, top: T0.y });
  }
  // pumpkins and toadstools
  for (let k = 0; k < 18; k++) {
    const a = k * 1.7 + 0.4, d = 14 + (k % 6) * 7;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (keep(x, z, 1.5)) continue;
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.9 + (k % 3) * 0.3, 10, 8), M(0xe8781a));
    pk.scale.y = 0.75;
    pk.position.set(x, 0.6, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 5), M(0x4a6a2a));
    stem.position.set(x, 1.3 + (k % 3) * 0.2, z);
    G.add(pk, stem);
    Z.colliders.push({ x, z, r: 0.9 });
  }
  // ---- falling leaves (only once the Autumn Fox's wind comes back)
  {
    const N = 260;
    const lv = [];
    const geo = new THREE.PlaneGeometry(0.4, 0.3);
    const mats = AUT.map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    for (let k = 0; k < N; k++) {
      const m = new THREE.Mesh(geo, mats[k % 6]);
      m.visible = false;
      G.add(m);
      lv.push({ m, x: 0, y: -1, z: 0, s: k });
    }
    Z.fall = 0; // 0 = still air · 1 = the wind is back · 2 = the Harvest Tree's great golden storm
    Z.wind = { x: 0.6, z: -0.3 };
    live.push((t, dt = 0.016) => {
      if (!Z.fall) return;
      for (const L of lv) {
        if (L.y <= 0.05) {
          const a = Math.random() * Math.PI * 2, d = Math.random() * (Z.fall === 2 ? 14 : K.R);
          L.x = (Z.fall === 2 ? K.tree.x : 0) + Math.cos(a) * d;
          L.z = (Z.fall === 2 ? K.tree.z : 0) + Math.sin(a) * d;
          L.y = Z.fall === 2 ? 14 + Math.random() * 10 : 3 + Math.random() * 8;
          if (L.m.visible === false && Math.random() < 0.97) {
            L.m.visible = true;
            L.y = Math.random() * 10;
          }
        }
        L.y -= dt * (1.1 + (L.s % 5) * 0.15);
        L.x += (Z.wind.x * 2.2 + Math.sin(t * 2 + L.s) * 0.8) * dt;
        L.z += (Z.wind.z * 2.2 + Math.cos(t * 1.7 + L.s) * 0.8) * dt;
        L.m.position.set(L.x, L.y, L.z);
        L.m.rotation.set(t * 2 + L.s, t * 1.3 + L.s, 0);
        if (Z.fall === 2) L.m.material = mats[(L.s % 2) ? 2 : 4];
      }
    });
  }
  let last = 0;
  Z.update = (t) => {
    const dt = last ? Math.min(0.1, t - last) : 0.016;
    last = t;
    for (const f of live) f(t, dt);
  };
  return Z;
}

// ======================================================================
//  ✨ THE GLADE WITHIN THE WISP RING — Phase 35. A hidden glade of mist and
//  moonlight: whispering willows round the edge, three ancient tree spirits
//  standing stone-still, glowing will-o'-wisps drifting everywhere — and in
//  the middle, the great Forest Guardian, asleep under a blanket of moss.
//  (Everything is grey and fading until the Guardian wakes.)
// ======================================================================
export const WISPGLADE = {
  R: 40,
  door: { x: 0, z: 34 },
  guardian: { x: 0, z: -6 },
  willows: [{ x: -24, z: 8, syl: "AR" }, { x: 22, z: -14, syl: "VEN" }, { x: -8, z: -28, syl: "DOR" }],
  spirits: [{ x: 16, z: 12 }, { x: -20, z: -14 }, { x: 24, z: 6 }],
};
function buildWispGlade() {
  const K = WISPGLADE;
  const Z = baseZone("wispglade", K.R);
  Z.spots.arrive = { x: K.door.x, z: K.door.z - 3 };
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  // the mossy floor (it greys as the glade fades)
  const floorMat = M(0x3a5a3a);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(K.R + 8, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  G.add(floor);
  Z.fadeMats = [floorMat];
  // the dark old forest all round the edge (you can't leave except by the door)
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, r = K.R + 2 + (k % 3) * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 16, 7), M(0x2a2018));
    trunk.position.set(Math.cos(a) * r, 8, Math.sin(a) * r);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 6), M(0x1a2a1a));
    crown.position.set(Math.cos(a) * r, 17, Math.sin(a) * r);
    G.add(trunk, crown);
  }
  // 🌿 the whispering willows
  Z.willows = K.willows.map((W) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6, 7), M(0x5a4a3a));
    trunk.position.y = 3;
    g.add(trunk);
    const leafMat = M(0x6a9a5a);
    Z.fadeMats.push(leafMat);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const strand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 0.15), leafMat);
      strand.position.set(Math.cos(a) * 2.2, 4.2, Math.sin(a) * 2.2);
      strand.rotation.z = Math.cos(a) * 0.15;
      g.add(strand);
    }
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.6, 9, 6), leafMat);
    top.position.y = 6.5;
    top.scale.y = 0.6;
    g.add(top);
    g.position.set(W.x, 0, W.z);
    G.add(g);
    Z.colliders.push({ x: W.x, z: W.z, r: 1 });
    live.push((t) => g.children.forEach((c, i) => i > 0 && (c.rotation.x = Math.sin(t * 0.8 + i) * 0.06)));
    return { ...W, g };
  });
  // 🌳 the three ancient tree spirits (still as stone until you give them light)
  Z.spirits = K.spirits.map((S0) => {
    const g = new THREE.Group();
    const bark = M(0x6a5a4a);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 4.5, 8), bark);
    body.position.y = 2.25;
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), bark);
    head.position.y = 5;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 7), M(0x4a7a3a));
    crown.position.y = 6.6;
    g.add(body, head, crown);
    const eyes = [];
    for (const sx of [-0.35, 0.35]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a3a2a }));
      e.position.set(sx, 5.15, 0.9);
      g.add(e);
      eyes.push(e);
    }
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), bark);
      arm.position.set(sx * 1.3, 3.5, 0);
      arm.rotation.z = sx * 0.7;
      g.add(arm);
    }
    g.position.set(S0.x, 0, S0.z);
    g.rotation.y = Math.atan2(K.guardian.x - S0.x, K.guardian.z - S0.z);
    G.add(g);
    Z.colliders.push({ x: S0.x, z: S0.z, r: 1.4 });
    return { ...S0, g, eyes };
  });
  // 🦌 the Forest Guardian, asleep under moss: a great stag of bark and leaves
  {
    const g = new THREE.Group();
    const moss = M(0x5a7a4a);
    Z.fadeMats.push(moss);
    const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), moss);
    body.scale.set(1, 0.65, 1.6);
    body.position.y = 1.8;
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), moss);
    head.position.set(0, 2.4, 4.6);
    g.add(body, head);
    const antlerMat = M(0x8a6a4a);
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const a = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 5), antlerMat);
        a.position.set(sx * (0.7 + k * 0.5), 3.8 + k * 0.6, 4.4 - k * 0.3);
        a.rotation.z = -sx * (0.4 + k * 0.15);
        g.add(a);
      }
    }
    const eyes = [];
    for (const sx of [-0.5, 0.5]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
      e.position.set(sx, 2.7, 5.9);
      g.add(e);
      eyes.push(e);
    }
    // little flowers in the moss on its back (they bloom when it wakes)
    const blooms = [];
    for (let k = 0; k < 16; k++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), new THREE.MeshStandardMaterial({ color: [0xff8ab8, 0xffe060, 0x8ad8ff][k % 3], emissive: 0x402020, emissiveIntensity: 0.3 }));
      const a = k * 2.39, r = 0.8 + (k % 4) * 0.5;
      f.position.set(Math.cos(a) * r, 3.6 - (k % 4) * 0.2, Math.sin(a) * r * 1.4);
      f.visible = false;
      g.add(f);
      blooms.push(f);
    }
    g.position.set(K.guardian.x, 0, K.guardian.z);
    G.add(g);
    Z.colliders.push({ x: K.guardian.x, z: K.guardian.z, r: 4 }, { x: K.guardian.x, z: K.guardian.z + 4.6, r: 1.6 });
    Z.guardian = { g, eyes, blooms, body, head };
  }
  // the mist
  for (let k = 0; k < 30; k++) {
    const m = glow(0xc8d8e8, 14, 0.12);
    m.material.blending = THREE.NormalBlending;
    m.position.set((Math.random() - 0.5) * K.R * 1.8, 1 + Math.random() * 2, (Math.random() - 0.5) * K.R * 1.8);
    G.add(m);
  }
  // the door back out (a ring of glowing mushrooms, like the one you came in by)
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8affd8, emissive: 0x4ad8a8, emissiveIntensity: 0.8 }));
    cap.position.set(K.door.x + Math.cos(a) * 2.2, 0.4, K.door.z + Math.sin(a) * 2.2);
    G.add(cap);
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🌈 THE THUNDERING FALLS — Phase 34. A great cliff, and the waterfall
//  that ran dry. A narrow ledge path zig-zags up beside it, across a broken
//  rope bridge over the falls, past the caves behind where the water fell,
//  up to the plateau — where the Stone Serpent coils by the dam it built.
// ======================================================================
export const FALLS = {
  R: 75,
  arrive: { x: 24, z: 30 },
  cliffZ: -10, top: 24,
  // the ledge path: [x, z, y] waypoints (it switches back and forth up the cliff)
  path: [[26, -4, 0], [46, -7, 6], [36, -7.5, 9], [8, -7.5, 12], [-8, -7.5, 12], [-44, -7.5, 18], [-34, -7.5, 21], [-14, -7.5, 24], [-14, -13, 24]],
  bridge: { from: 3, gaps: [[0.22, 0.34], [0.58, 0.7]] }, // (segment 3→4 is the rope bridge; these bits have no planks)
  cave: { x: 0, z0: -8, z1: -17, y: 12 },
  plinth: { x: -8, z: -20 },
  dam: { x: 0, z: -26 },
  keystones: [{ x: -3.2, z: -24.6 }, { x: 0, z: -24.4 }, { x: 3.2, z: -24.6 }],
  serpent: { x: 16, z: -32 },
  prisms: [], // (filled below: 7 spots)
};
{
  const F = FALLS;
  // where the seven prisms hide: two on the lower ledges, three in the cave behind the falls, two up high
  F.prisms.push({ x: 40, z: -8.8, y: 7 }, { x: 20, z: -8.8, y: 10.5 });
  F.prisms.push({ x: -1.6, z: -13, y: 12 }, { x: 1.6, z: -15, y: 12 }, { x: 0, z: -16.5, y: 12 });
  F.prisms.push({ x: -30, z: -8.8, y: 16 }, { x: -24, z: -8.8, y: 22.5 });
}
/** the ground under you at (x, z) — it depends on how high you already are (ledges overlap!) */
export function fallsHeight(x, z, y = 99) {
  const F = FALLS;
  let best = 0;
  if (z <= F.cliffZ - 1 && y >= F.top - 4) best = F.top; // (the plateau, up top)
  const pts = F.path;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az, ay] = pts[i], [bx, bz, by] = pts[i + 1];
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    const px = ax + dx * t, pz = az + dz * t;
    if (Math.hypot(x - px, z - pz) > 1.5) continue;
    if (i === F.bridge.from && F.bridge.gaps.some(([g0, g1]) => t > g0 && t < g1)) continue; // (no planks!)
    const h = ay + (by - ay) * t;
    if (h <= y + 1.7 && h > best) best = h;
  }
  // the cave behind the falls
  const C = F.cave;
  if (Math.abs(x - C.x) < 3 && z < C.z0 && z > C.z1 && y >= C.y - 1.7 && C.y > best) best = C.y;
  return best;
}
function buildFalls() {
  const K = FALLS;
  const Z = baseZone("falls", K.R);
  Z.spots.arrive = { ...K.arrive };
  const G = Z.group;
  const live = [];
  Z.height = fallsHeight;
  // the valley floor (dry and brown — until the river comes back)
  const valleyMat = M(0x9a8a5a);
  const valley = new THREE.Mesh(new THREE.PlaneGeometry(2 * K.R + 40, 2 * K.R + 40), valleyMat);
  valley.rotation.x = -Math.PI / 2;
  G.add(valley);
  Z.valleyMat = valleyMat;
  // the dry riverbed
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(8, K.R + 10), M(0x6a5a3a));
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0.03, (K.cliffZ + K.R) / 2);
  G.add(bed);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(7, K.R + 10), new THREE.MeshStandardMaterial({ color: 0x3aa8d8, roughness: 0.15 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.08, (K.cliffZ + K.R) / 2);
  river.visible = false;
  G.add(river);
  Z.river = river;
  // dead bushes (they'll bloom)
  Z.bushes = [];
  for (let k = 0; k < 24; k++) {
    const x = (k % 2 ? 1 : -1) * (8 + ((k * 7.3) % 50)), z = 4 + ((k * 11.7) % 60);
    const b = new THREE.Mesh(new THREE.SphereGeometry(1 + (k % 3) * 0.4, 7, 5), M(0x7a6a4a));
    b.scale.y = 0.6;
    b.position.set(x, 0.5, z);
    G.add(b);
    Z.bushes.push(b);
  }
  // the great cliff
  const cliffMat = M(0x8a7a6a);
  // (built in pieces, so the cave behind the falls is a real hollow)
  const block = (x0, x1, y0, y1, z0, z1, mat = cliffMat) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    G.add(b);
  };
  const cz = K.cliffZ, cy = K.cave.y;
  block(-75, -4, 0, K.top, -90, cz);
  block(4, 75, 0, K.top, -90, cz);
  block(-4, 4, 0, K.top, -90, K.cave.z1 - 1);
  block(-4, 4, 0, cy - 0.5, K.cave.z1 - 1, cz, M(0x6a5a4a));
  block(-4, 4, cy + 4, K.top, K.cave.z1 - 1, cz, M(0x6a5a4a));
  // the waterfall itself (hidden until the dam breaks)
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(7, K.top + 2), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  fall.position.set(0, K.top / 2, K.cliffZ + 0.6);
  fall.visible = false;
  G.add(fall);
  Z.fall = fall;
  // the cliff is solid (but you can walk into the cave mouth, up at the bridge)
  for (let x = -70; x <= 70; x += 2) {
    if (Math.abs(x) < 4) {
      Z.colliders.push({ x, z: K.cliffZ - 1, r: 1.2, top: K.cave.y - 1 }); // (below the cave — solid)
      continue;
    }
    Z.colliders.push({ x, z: K.cliffZ - 1, r: 1.2, top: K.top - 0.5 });
  }
  // the cave's own walls and back
  for (let z = K.cave.z0; z >= K.cave.z1; z -= 1.6) for (const sx of [-3.8, 3.8]) Z.colliders.push({ x: sx, z, r: 0.9, top: K.top - 0.5 });
  // the ledge path (stone ledges) and the rope bridge (planks with gaps)
  const ledgeMat = M(0x9a8a7a), plankMat = M(0x8a6a42);
  const P = K.path;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az, ay] = P[i], [bx, bz, by] = P[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.ceil(len / (i === K.bridge.from ? 0.7 : 1.4));
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps;
      if (i === K.bridge.from && K.bridge.gaps.some(([g0, g1]) => t > g0 - 0.02 && t < g1 + 0.02)) continue;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(i === K.bridge.from ? 2.8 : 3, i === K.bridge.from ? 0.15 : 0.6, len / steps + 0.05), i === K.bridge.from ? plankMat : ledgeMat);
      slab.position.set(x, y - (i === K.bridge.from ? 0.08 : 0.3), z);
      slab.rotation.y = Math.atan2(bx - ax, bz - az);
      G.add(slab);
    }
    if (i === K.bridge.from) {
      for (const sz of [-1.5, 1.5]) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 5), M(0xc8a870));
        rope.rotation.z = Math.PI / 2;
        rope.position.set((ax + bx) / 2, ay + 1, az + sz);
        G.add(rope);
      }
    }
  }
  // the cave floor behind the falls
  const caveFloor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 10), ledgeMat);
  caveFloor.position.set(K.cave.x, K.cave.y - 0.25, (K.cave.z0 + K.cave.z1) / 2);
  G.add(caveFloor);
  const caveLight = glow(0xb8e0ff, 6, 0.35);
  caveLight.position.set(0, K.cave.y + 2, -13);
  G.add(caveLight);
  // up top: the lake held back by the dam, the dam, the keystones, the plinth
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: 0x3a8ab8, roughness: 0.15 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, K.top + 0.3, -45);
  G.add(lake);
  const dam = new THREE.Group();
  for (let k = 0; k < 14; k++) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + (k % 3) * 0.4), M(0x6a6460));
    b.position.set(-9 + (k % 7) * 3, K.top + 1 + Math.floor(k / 7) * 1.8, K.dam.z - 1.5);
    dam.add(b);
  }
  G.add(dam);
  Z.dam = dam;
  for (let x = -10; x <= 10; x += 2) Z.colliders.push({ x, z: K.dam.z - 2, r: 1.4, top: K.top + 4 });
  Z.keystones = K.keystones.map((ks) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x8a7a6a, emissive: 0xffd080, emissiveIntensity: 0.25, flatShading: true }));
    m.position.set(ks.x, K.top + 0.7, ks.z);
    G.add(m);
    return { ...ks, m };
  });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.2, 8), M(0xd8c8a8));
  plinth.position.set(K.plinth.x, K.top + 0.6, K.plinth.z);
  G.add(plinth);
  Z.colliders.push({ x: K.plinth.x, z: K.plinth.z, r: 1.3, top: K.top + 1.2 });
  Z.plinthGems = [];
  for (let k = 0; k < 7; k++) {
    const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: [0xff4a4a, 0xff9a3a, 0xffe040, 0x4ad84a, 0x4a9aff, 0x6a4aff, 0xc84aff][k] }));
    const a = (k / 7) * Math.PI * 2;
    gm.position.set(K.plinth.x + Math.cos(a) * 0.8, K.top + 1.4, K.plinth.z + Math.sin(a) * 0.8);
    gm.visible = false;
    G.add(gm);
    Z.plinthGems.push(gm);
  }
  // the Stone Serpent, coiled on its rock
  {
    const S0 = K.serpent;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3), M(0x7a7470));
    rock.scale.y = 0.6;
    rock.position.set(S0.x, K.top + 1, S0.z);
    G.add(rock);
    Z.colliders.push({ x: S0.x, z: S0.z, r: 3.4, top: K.top + 3 });
    const serp = new THREE.Group();
    const scale = M(0x5a6a5a);
    for (let k = 0; k < 22; k++) {
      const a = k * 0.55, r = 2.6 - k * 0.08;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.7 - k * 0.012, 8, 6), scale);
      seg.position.set(Math.cos(a) * r, 2 + k * 0.12, Math.sin(a) * r);
      serp.add(seg);
    }
    const neck = new THREE.Group();
    neck.position.set(0, 4.8, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), scale);
    head.position.set(0, 0.6, 0.6);
    const eyes = [];
    for (const sx of [-0.4, 0.4]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc020 }));
      e.position.set(sx, 0.9, 1.3);
      neck.add(e);
      eyes.push(e);
    }
    neck.add(head);
    serp.add(neck);
    // its gaze: a pale cone of light on the ground
    const cone = new THREE.Mesh(new THREE.CircleGeometry(20, 24, -0.5, 1), new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(0, K.top - (K.top + 1) + 0.15 + 0.0, 0);
    serp.position.set(S0.x, K.top + 0.6, S0.z);
    G.add(serp);
    const coneG = new THREE.Group();
    coneG.position.set(S0.x, K.top + 0.15, S0.z);
    cone.position.set(0, 0, 0);
    coneG.add(cone);
    G.add(coneG);
    Z.serpent = { g: serp, neck, eyes, coneG, cone };
  }
  // the rainbow (after)
  {
    const rb = new THREE.Group();
    [0xff3a3a, 0xff9a2a, 0xffe03a, 0x4ad84a, 0x3a8aff, 0x8a4aff].forEach((c, i) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(50 - i * 1.6, 0.8, 6, 80, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6, depthWrite: false }));
      rb.add(arc);
    });
    rb.position.set(0, 0, 30);
    rb.visible = false;
    G.add(rb);
    Z.rainbow = rb;
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏆 THE SKY CUP CANYON — Phase 32. A vast red-rock canyon far below, mesas
//  towering up from it, and a racecourse that winds between them high in the
//  air. You start on a floating rock. (phase32.js runs the races.)
// ======================================================================
export const SKYCUP = {
  R: 170,
  start: { x: 0, z: 118, y: 26, r: 7 },
  floor: -40,
};
{
  // the course: a winding loop between the mesas (closed curve)
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const a = Math.PI / 2 + (k / 16) * Math.PI * 2;
    const r = 105 + Math.sin(k * 1.7) * 22;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 30 + Math.sin(k * 1.3) * 9 + (k % 3) * 3, Math.sin(a) * r));
  }
  SKYCUP.curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
  SKYCUP.len = SKYCUP.curve.getLength();
}
function buildSkyCup() {
  const K = SKYCUP;
  const Z = baseZone("skycup", K.R);
  Z.spots.arrive = { x: K.start.x, z: K.start.z };
  const G = Z.group;
  const live = [];
  const S0 = K.start;
  Z.height = (x, z) => (Math.hypot(x - S0.x, z - S0.z) < S0.r ? S0.y : K.floor);
  // the canyon floor, far below
  const floor = new THREE.Mesh(new THREE.CircleGeometry(K.R + 60, 40), M(0x9a4a2a));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = K.floor;
  G.add(floor);
  const river = new THREE.Mesh(new THREE.RingGeometry(60, 66, 60), new THREE.MeshBasicMaterial({ color: 0x3a8ab8 }));
  river.rotation.x = -Math.PI / 2;
  river.position.y = K.floor + 0.1;
  G.add(river);
  // mesas towering up out of the canyon (none right on the course)
  const rock = M(0xb8603a), topM = M(0xd88a5a);
  Z.mesas = [];
  for (let k = 0; k < 46; k++) {
    const a = k * 2.39, d = 30 + ((k * 31.7) % (K.R - 20));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    // keep the racing line clear
    let clear = true;
    for (let u = 0; u < 1; u += 0.01) {
      const P = K.curve.getPointAt(u);
      if (Math.hypot(P.x - x, P.z - z) < 16) {
        clear = false;
        break;
      }
    }
    if (!clear || Math.hypot(x - S0.x, z - S0.z) < 16) continue;
    const h = 50 + ((k * 13) % 5) * 12;
    const r = 6 + (k % 4) * 3;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r * 1.15, h, 7), rock);
    m.position.set(x, K.floor + h / 2, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 1.2, 7), topM);
    cap.position.set(x, K.floor + h + 0.6, z);
    G.add(m, cap);
    Z.mesas.push({ x, z, r, top: K.floor + h });
  }
  // the floating start rock, with banners
  {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(S0.r, S0.r * 0.4, 6, 10), M(0x9a5a3a));
    top.position.set(S0.x, S0.y - 3, S0.z);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(S0.r, S0.r, 0.3, 10), M(0x6aa84a));
    grass.position.set(S0.x, S0.y - 0.1, S0.z);
    G.add(top, grass);
    for (const [c, a] of [[0xc8902a, 0], [0xc0c0d0, 2.1], [0xffd040, 4.2]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 5), M(0x5a3a1a));
      pole.position.set(S0.x + Math.cos(a) * (S0.r - 1), S0.y + 2, S0.z + Math.sin(a) * (S0.r - 1));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      flag.position.set(pole.position.x + 0.7, S0.y + 3.5, pole.position.z);
      G.add(pole, flag);
    }
  }
  // clouds drifting below
  for (let k = 0; k < 30; k++) {
    const c = glow(0xffffff, 18 + (k % 4) * 6, 0.35);
    c.material.blending = THREE.NormalBlending;
    c.position.set((Math.random() - 0.5) * K.R * 2, K.floor + 20 + Math.random() * 15, (Math.random() - 0.5) * K.R * 2);
    G.add(c);
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  💎 THE CRYSTAL CAVERNS — Phase 31. A vast cavern of humming crystal under
//  the mountains. Five chambers round the edge, each with a singing crystal on
//  a pedestal and a crystal GOLEM pacing round it. Every so often the wind
//  blows through and the whole cavern HUMS — and the golems freeze, listening.
//  At the far end: the sealed cavern, a wall of solid crystal.
// ======================================================================
export const CRYSTAL = {
  R: 64,
  arrive: { x: 0, z: 54 },
  door: { x: 0, z: -48 },
  crystals: [
    { key: "dawn", name: "the Dawn Crystal", color: 0xffb070, note: 392 },
    { key: "sky", name: "the Sky Crystal", color: 0x70c8ff, note: 440 },
    { key: "leaf", name: "the Leaf Crystal", color: 0x80e890, note: 494 },
    { key: "rose", name: "the Rose Crystal", color: 0xff80c0, note: 523 },
    { key: "star", name: "the Star Crystal", color: 0xd8b0ff, note: 587 },
  ].map((c, i) => {
    const a = Math.PI * 0.95 + (i / 4) * Math.PI * 1.1; // (round the sides of the cavern)
    return { ...c, x: Math.cos(a) * 36, z: Math.sin(a) * 30 + 6 };
  }),
};
function buildCrystal() {
  const K = CRYSTAL;
  const Z = baseZone("crystal", K.R);
  Z.spots.arrive = { ...K.arrive };
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  // the cavern floor, and walls of dark rock bristling with crystal
  const floor = new THREE.Mesh(new THREE.CircleGeometry(K.R + 6, 48), M(0x1e1a2a));
  floor.rotation.x = -Math.PI / 2;
  G.add(floor);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(K.R + 2, K.R + 2, 40, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x14101e, side: THREE.BackSide, flatShading: true }));
  wall.position.y = 18;
  G.add(wall);
  const shards = [];
  for (let k = 0; k < 90; k++) {
    const a = k * 2.39, d = k % 3 === 0 ? K.R - 1 : 8 + ((k * 7.7) % (K.R - 14));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (K.crystals.some((c) => Math.hypot(c.x - x, c.z - z) < 9) || Math.hypot(x - K.door.x, z - K.door.z) < 10 || Math.hypot(x - K.arrive.x, z - K.arrive.z) < 8) continue;
    const h = 1.5 + (k % 5) * 1.2;
    const col = [0x8a6aff, 0x5ad8ff, 0xff8ad8, 0x8affc8][k % 4];
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.5 + (k % 3) * 0.3, h, 6), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, transparent: true, opacity: 0.85, flatShading: true }));
    c.position.set(x, h / 2, z);
    c.rotation.z = Math.sin(k) * 0.25;
    G.add(c);
    shards.push(c);
    if (d < K.R - 2) Z.colliders.push({ x, z, r: 0.6 + (k % 3) * 0.3 });
  }
  // the hum: every shard brightens together when the cavern sings
  Z.hum = 0;
  live.push(() => shards.forEach((c) => (c.material.emissiveIntensity = 0.3 + Z.hum * 0.9)));
  for (let k = 0; k < 40; k++) {
    const g = glow([0x8a6aff, 0x5ad8ff, 0xff8ad8][k % 3], 2 + (k % 3), 0.5);
    g.position.set((Math.random() - 0.5) * K.R * 1.6, 6 + Math.random() * 20, (Math.random() - 0.5) * K.R * 1.6);
    G.add(g);
  }
  // the five chambers: a pedestal, the singing crystal, and its golem
  Z.chambers = K.crystals.map((C) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1, 8), M(0x4a4058));
    ped.position.set(C.x, 0.5, C.z);
    G.add(ped);
    Z.colliders.push({ x: C.x, z: C.z, r: 1.3 });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), new THREE.MeshStandardMaterial({ color: C.color, emissive: C.color, emissiveIntensity: 0.9, flatShading: true }));
    gem.position.set(C.x, 2, C.z);
    const halo = glow(C.color, 5, 0.8);
    halo.position.copy(gem.position);
    G.add(gem, halo);
    // a ring of low crystal walls round the chamber, with one gap facing the middle
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const toMid = Math.atan2(-C.z, -C.x);
      if (Math.abs(Math.atan2(Math.sin(a - toMid), Math.cos(a - toMid))) < 0.5) continue;
      const x = C.x + Math.cos(a) * 8, z = C.z + Math.sin(a) * 8;
      const w = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 6), new THREE.MeshStandardMaterial({ color: C.color, emissive: C.color, emissiveIntensity: 0.25, flatShading: true, transparent: true, opacity: 0.8 }));
      w.position.set(x, 1.75, z);
      G.add(w);
      Z.colliders.push({ x, z, r: 1 });
    }
    // the golem: a hulking figure of crystal blocks
    const golem = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8aa8, emissive: C.color, emissiveIntensity: 0.15, flatShading: true });
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3), stone);
    torso.position.y = 2.4;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6), stone);
    head.position.y = 4;
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: C.color }));
    eye.position.set(0, 4.05, 0.55);
    golem.add(torso, head, eye);
    const limbs = [];
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), stone);
      arm.geometry.translate(0, -0.9, 0);
      arm.position.set(sx * 1.6, 3.1, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), stone);
      leg.geometry.translate(0, -0.8, 0);
      leg.position.set(sx * 0.6, 1.5, 0);
      golem.add(arm, leg);
      limbs.push(arm, leg);
    }
    G.add(golem);
    return { ...C, gem, halo, golem, limbs, eye, ang: Math.random() * 6 };
  });
  // the sealed cavern: a great wall of crystal
  {
    const D = K.door;
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xc8b8ff, emissive: 0x6a4aff, emissiveIntensity: 0.3, transparent: true, opacity: 0.85, flatShading: true });
    const seal = new THREE.Group();
    for (let k = 0; k < 9; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9 + (k % 3) * 2, 6), sealMat);
      c.position.set(-8 + k * 2, 4.5, 0);
      c.rotation.z = (k - 4) * 0.05;
      seal.add(c);
    }
    seal.position.set(D.x, 0, D.z);
    G.add(seal);
    for (let x = -9; x <= 9; x += 1.6) Z.colliders.push({ x: D.x + x, z: D.z, r: 1 });
    Z.seal = seal;
    // the Crystal Heart beyond it
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(3.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xb89aff, emissiveIntensity: 1.2, flatShading: true }));
    heart.position.set(D.x, 6, D.z - 9);
    const hh = glow(0xd8c8ff, 18, 0.6);
    hh.position.copy(heart.position);
    G.add(heart, hh);
    Z.heart = heart;
    live.push((t) => (heart.rotation.y = t * 0.4));
    // the five sockets where you sing the crystals
    Z.sockets = K.crystals.map((C, i) => {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: C.color, emissive: C.color, emissiveIntensity: 0, transparent: true, opacity: 0.25 }));
      s.position.set(D.x - 6 + i * 3, 1.2, D.z + 3);
      G.add(s);
      return s;
    });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🌺 PARADISE — the secret behind the wall of Dapple's Stable: pink sand,
//  a turquoise lagoon, palms, a rainbow waterfall, floating islands… and
//  some very UNUSUAL shops (paradise.js runs them).
// ======================================================================
export const PARADISE = {
  R: 62,
  door: { x: 0, z: 52 },
  lagoon: { x: 0, z: -14, r: 15 },
  shops: [
    { key: "llama", name: "The High-Pasture Llama Ranch", keeper: "Rancher Lulu", icon: "🦙", x: -30, z: 30, roof: 0xb8562a },
    { key: "camel", name: "The Camel Caravanserai", keeper: "Old Sahib Sandy", icon: "🐪", x: 30, z: 30, roof: 0xc8902a },
    { key: "weather", name: "The Storm Bottler", keeper: "Captain Gale", icon: "⛈️", x: -40, z: 2, roof: 0x2a4a7a },
    { key: "rocks", name: "Fossils & Crystals", keeper: "Old Flint", icon: "💎", x: 40, z: 2, roof: 0x5a4a6a },
    { key: "sweets", name: "The Strange-Fruit Trader", keeper: "Mama Saffron", icon: "🍈", x: -26, z: -36, roof: 0x2a7a6a },
    { key: "wish", name: "The Wishing Well of the Old Temple", keeper: null, icon: "⛲", x: 0, z: 22, roof: null },
    { key: "hats", name: "The Explorer's Outfitter", keeper: "Ranger Tamsin", icon: "🧭", x: 26, z: -36, roof: 0x5a6a3a },
  ],
};
function buildParadise() {
  const K = PARADISE;
  const Z = baseZone("paradise", K.R);
  Z.spots.arrive = { x: K.door.x, z: K.door.z - 3 };
  const G = Z.group;
  const live = [];
  const L = K.lagoon;
  Z.height = (x, z) => {
    const d = Math.hypot(x - L.x, z - L.z);
    return d < L.r ? -1.4 : d < L.r + 4 ? -1.4 + ((d - L.r) / 4) * 1.6 : 0.2 + Math.sin(x * 0.08) * Math.cos(z * 0.07) * 0.35;
  };
  Z.waterAt = (x, z) => (Math.hypot(x - L.x, z - L.z) < L.r - 0.5 ? 0 : null);
  // warm golden sand, darker and damp near the water
  {
    const g = new THREE.PlaneGeometry(2 * K.R + 40, 2 * K.R + 40, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Z.height(x, z));
      const d = Math.hypot(x - L.x, z - L.z);
      const c = new THREE.Color(d < L.r + 5 ? 0xc8a868 : 0xe8d098).lerp(new THREE.Color(0xd8b878), Math.abs(Math.sin(x * 0.21 + z * 0.13)) * 0.4);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    G.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // the lagoon: clear turquoise over the shallows, deep blue in the middle, with coral
  {
    const deep = new THREE.Mesh(new THREE.CircleGeometry(L.r * 0.6, 30), new THREE.MeshStandardMaterial({ color: 0x0a6a8a, roughness: 0.1, transparent: true, opacity: 0.92 }));
    deep.rotation.x = -Math.PI / 2;
    deep.position.set(L.x, 0.01, L.z);
    const shallow = new THREE.Mesh(new THREE.RingGeometry(L.r * 0.6, L.r + 1.5, 40), new THREE.MeshStandardMaterial({ color: 0x2ac8c0, roughness: 0.1, transparent: true, opacity: 0.85 }));
    shallow.rotation.x = -Math.PI / 2;
    shallow.position.set(L.x, 0, L.z);
    G.add(deep, shallow);
    for (let k = 0; k < 16; k++) {
      const a = k * 2.4, d = L.r * (0.5 + (k % 4) * 0.12);
      const coral = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 5), M([0xd8603a, 0xe8a03a, 0xb84a6a][k % 3]));
      coral.position.set(L.x + Math.cos(a) * d, -1.0, L.z + Math.sin(a) * d);
      G.add(coral);
    }
    const shimmer = [];
    for (let k = 0; k < 20; k++) {
      const sp = glow(0xe8ffff, 0.9, 0.5);
      sp.position.set(L.x + (Math.random() - 0.5) * L.r * 1.6, 0.1, L.z + (Math.random() - 0.5) * L.r * 1.6);
      G.add(sp);
      shimmer.push(sp);
    }
    live.push((t) => shimmer.forEach((sp, i) => (sp.material.opacity = 0.15 + 0.5 * Math.abs(Math.sin(t * 1.7 + i)))));
  }
  // great jungle cliffs all round the back, with waterfalls thundering down them into the lagoon
  {
    const rock = M(0x7a6a5a), green = M(0x2e6a2a);
    for (let k = 0; k < 22; k++) {
      const a = Math.PI + (k / 21) * Math.PI; // the far half of the valley
      const r = K.R + 6 + (k % 3) * 3;
      const h = 22 + ((k * 7) % 5) * 5;
      const cliff = new THREE.Mesh(new THREE.CylinderGeometry(7, 9, h, 7), rock);
      cliff.position.set(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r);
      cliff.rotation.y = k;
      const top = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6), green);
      top.scale.y = 0.45;
      top.position.set(cliff.position.x, h - 1, cliff.position.z);
      G.add(cliff, top);
    }
    for (const fx of [-14, 0, 14]) {
      const h = 30;
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(fx === 0 ? 7 : 4, h), new THREE.MeshBasicMaterial({ color: 0xe8fcff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      fall.position.set(fx, h / 2 - 1.2, -K.R - 2);
      G.add(fall);
      // the river from the falls to the lagoon
      const run = new THREE.Mesh(new THREE.PlaneGeometry(fx === 0 ? 6 : 3, K.R + 2 - (L.r - L.z) + 2), new THREE.MeshStandardMaterial({ color: 0x3ac8d0, roughness: 0.1 }));
      run.rotation.x = -Math.PI / 2;
      const zz = (-K.R - 2 + (L.z - L.r)) / 2;
      run.position.set(fx * 0.6, 0.12, zz);
      G.add(run);
      const mist = glow(0xffffff, 12, 0.35);
      mist.position.set(fx, 1.5, -K.R);
      G.add(mist);
      live.push((t) => (mist.material.opacity = 0.25 + Math.sin(t * 2 + fx) * 0.08));
    }
  }
  // tall leaning palms, giant ferns and red hibiscus — a real jungle edge
  for (let k = 0; k < 44; k++) {
    const a = k * 2.39, d = 16 + ((k * 11.3) % 42);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - L.x, z - L.z) < L.r + 4 || K.shops.some((sh) => Math.hypot(sh.x - x, sh.z - z) < 8) || Math.hypot(x - K.door.x, z - K.door.z) < 7) continue;
    const y = Z.height(x, z);
    if (k % 4 !== 3) {
      const lean = Math.sin(k * 1.7) * 0.25;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 9, 7), M(0x8a6a42));
      trunk.position.set(x, y + 4.5, z);
      trunk.rotation.z = lean;
      G.add(trunk);
      const tx = x - Math.sin(lean) * 4.5, ty = y + 9;
      for (let f = 0; f < 8; f++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 4.4), M(f % 2 ? 0x2a7a3a : 0x3a8a3a));
        leaf.geometry.translate(0, 0, 2.2);
        leaf.position.set(tx, ty, z);
        leaf.rotation.set(0.55, (f / 8) * Math.PI * 2, 0);
        G.add(leaf);
      }
      for (let c = 0; c < 3; c++) {
        const nut = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), M(0x5a3a1a));
        nut.position.set(tx + Math.cos(c * 2.1) * 0.35, ty - 0.3, z + Math.sin(c * 2.1) * 0.35);
        G.add(nut);
      }
      Z.colliders.push({ x, z, r: 0.6 });
    } else {
      for (let f = 0; f < 7; f++) {
        const frond = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 2.4), M(0x3a7a2a));
        frond.geometry.translate(0, 0, 1.2);
        frond.position.set(x, y + 0.3, z);
        frond.rotation.set(-0.5, (f / 7) * Math.PI * 2, 0);
        G.add(frond);
      }
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), M(0xc82a2a));
      bloom.scale.y = 0.5;
      bloom.position.set(x + 0.6, y + 1, z);
      G.add(bloom);
    }
  }
  // parrots wheeling over the treetops
  {
    const birds = [];
    for (let k = 0; k < 8; k++) {
      const b = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 5), M([0xd82a2a, 0x2a8ad8, 0x3ab83a, 0xe8b82a][k % 4]));
      body.rotation.x = Math.PI / 2;
      const wings = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.35), M([0x2a5ad8, 0xe8c82a, 0xd83a2a, 0x2a8a3a][k % 4]));
      b.add(body, wings);
      G.add(b);
      birds.push({ b, wings });
    }
    live.push((t) => birds.forEach(({ b, wings }, i) => {
      const a = t * 0.25 + i * 0.8, r = 25 + (i % 3) * 8;
      b.position.set(Math.cos(a) * r, 14 + (i % 4) * 2 + Math.sin(t + i) * 1.5, Math.sin(a) * r - 6);
      b.rotation.y = -a;
      wings.rotation.z = Math.sin(t * 9 + i) * 0.5;
    }));
  }
  // the bazaar: open-air stalls of carved wood and earthy canvas, with lanterns (the well is an old temple well)
  Z.shopAt = {};
  for (const sh of K.shops) {
    const y = Z.height(sh.x, sh.z);
    const g = new THREE.Group();
    g.position.set(sh.x, y, sh.z);
    g.rotation.y = Math.atan2(-sh.x, -sh.z);
    if (sh.key === "wish") {
      for (let k = 0; k < 10; k++) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.7), M(0x9a8a72));
        const a = (k / 10) * Math.PI * 2;
        st.position.set(Math.cos(a) * 2.2, 0.5, Math.sin(a) * 2.2);
        st.rotation.y = -a;
        g.add(st);
      }
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.9, 18), new THREE.MeshStandardMaterial({ color: 0x1a6a7a, roughness: 0.1 }));
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.7;
      g.add(water);
      for (const sx of [-2.6, 2.6]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5, 8), M(0xb8a888));
        pillar.position.set(sx, 2.5, 0);
        g.add(pillar);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.6, 0.9), M(0xb8a888));
      lintel.position.y = 5.2;
      const vine = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 1.1), M(0x3a7a2a));
      vine.position.y = 5.55;
      g.add(lintel, vine);
      Z.colliders.push({ x: sh.x, z: sh.z, r: 2.8 });
    } else {
      const wood = M(0x6a4a2a);
      for (const [px, pz] of [[-2.6, -1.6], [2.6, -1.6], [-2.6, 2.4], [2.6, 2.4]]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 3.6, 6), wood);
        post.position.set(px, 1.8, pz);
        g.add(post);
      }
      const awning = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 4.8), M(sh.roof));
      awning.position.set(0, 3.7, 0.4);
      awning.rotation.x = -0.12;
      const back = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.2), M(0x8a6a4a));
      back.position.set(0, 1.3, -1.6);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 0.9), wood);
      counter.position.set(0, 0.5, 2.6);
      g.add(awning, back, counter);
      // wares heaped on the counter
      for (let k = 0; k < 6; k++) {
        const w = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), M([0xc8902a, 0x8a3a2a, 0x3a6a8a, 0xd8c8a8, 0x6a8a3a, 0xa86a3a][(k + sh.x) & 5 ? k : 5 - k]));
        w.position.set(-1.8 + k * 0.72, 1.15, 2.6);
        g.add(w);
      }
      for (const lx of [-2.4, 2.4]) {
        const lantern = glow(0xffb860, 1.6, 0.85);
        lantern.position.set(lx, 3.1, 2.6);
        g.add(lantern);
      }
      // the sign, carved and painted (crisp, bold, lit the same day or night)
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.1), new THREE.MeshBasicMaterial({ map: signTexture(sh.icon + " " + sh.name, "wood", 5.6 / 1.1), toneMapped: false, fog: false }));
      sign.position.set(0, 4.2, 2.85);
      g.add(sign);
      Z.colliders.push({ x: sh.x, z: sh.z, r: 3 });
    }
    G.add(g);
    const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y);
    Z.shopAt[sh.key] = { x: sh.x + fx * 4.8, z: sh.z + fz * 4.8, keeperAt: { x: sh.x + fx * 1.3, z: sh.z + fz * 1.3 }, face: g.rotation.y };
  }
  // the way back: a little arched door standing on its own in the sand
  {
    const D = K.door;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.3, 8, 18, Math.PI), M(0xa89878));
    arch.position.set(D.x, 1.6, D.z);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.6), new THREE.MeshBasicMaterial({ color: 0x3a2a1a }));
    panel.position.set(D.x, 0.8, D.z);
    const top = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x3a2a1a }));
    top.position.set(D.x, 1.6, D.z);
    for (const m of [panel, top]) m.rotation.y = Math.PI;
    G.add(arch, panel, top);
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🍄 THE GLOWCAP KINGDOM — Phase 30. Deep under the forest floor: the
//  mushroom folk's kingdom (north), a bottomless chasm crossed by an old
//  rope bridge with broken planks (jump the gaps!), and the Rootworm's
//  winding tunnels (south), where the Glowcap King is tied up in roots.
// ======================================================================
export const GLOWCAP = {
  R: 66,
  arrive: { x: 0, z: 56 },
  ladder: { x: 0, z: 61 },
  chasm: { z0: 10, z1: 26 },
  bridge: { x: -10, w: 1.1, gaps: [[14, 15.8], [19.5, 21.3]] },
  broken: { x: 18 },
  caps: [
    { x: -26, z: 44 }, { x: 24, z: 46 }, { x: -14, z: 34 }, { x: 14, z: 34 }, { x: 0, z: 44 },
  ],
  walls: [
    { z: -6, x0: -46, x1: 30 },
    { z: -22, x0: -30, x1: 46 },
    { z: -38, x0: -46, x1: 30 },
  ],
  cage: { x: 0, z: -52 },
  worm: [], // its patrol loop (filled in below)
};
{
  // the Rootworm wriggles back and forth along the tunnels
  const W = GLOWCAP.worm;
  const lanes = [2, -14, -30, -46];
  lanes.forEach((z, i) => {
    const xs = i % 2 ? [-40, 40] : [40, -40];
    W.push({ x: xs[0], z }, { x: xs[1], z });
  });
}
export const glowcapOnBridge = (x, z) => {
  const B = GLOWCAP.bridge;
  if (Math.abs(x - B.x) > B.w) return false;
  return !B.gaps.some(([a, b]) => z > a && z < b);
};
export function glowcapHeight(x, z) {
  const C = GLOWCAP.chasm;
  if (z > C.z0 && z < C.z1) return glowcapOnBridge(x, z) ? 0 : -60;
  return 0;
}
function buildGlowcap() {
  const K = GLOWCAP;
  const Z = baseZone("glowcap", K.R);
  Z.spots.arrive = { ...K.arrive };
  const G = Z.group;
  const live = [];
  Z.height = glowcapHeight;
  // the cave floor (north and south of the chasm), and the dark walls all round
  const floorMat = M(0x2a2238);
  for (const [z0, z1] of [[K.chasm.z1, K.R + 4], [-K.R - 4, K.chasm.z0]]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2 * K.R + 8, z1 - z0), floorMat);
    f.rotation.x = -Math.PI / 2;
    f.position.set(0, 0, (z0 + z1) / 2);
    G.add(f);
  }
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(K.R + 1, K.R + 1, 26, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1428, side: THREE.BackSide, flatShading: true }));
    wall.position.y = 6;
    G.add(wall);
  }
  // glowing crystals and moss on the floor and walls
  for (let k = 0; k < 70; k++) {
    const a = k * 2.39, d = 10 + ((k * 13.7) % (K.R - 12));
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > K.chasm.z0 - 1 && z < K.chasm.z1 + 1) continue;
    const g = glow([0x6affd8, 0xb88aff, 0x8ad8ff][k % 3], 1.6 + (k % 4) * 0.5, 0.6);
    g.position.set(x, 0.4 + (k % 5) * 0.3, z);
    G.add(g);
  }
  // 🌉 the chasm: a dark nothing far below, and the old rope bridge across it
  {
    const C = K.chasm;
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(2 * K.R + 8, C.z1 - C.z0), new THREE.MeshBasicMaterial({ color: 0x020108 }));
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(0, -30, (C.z0 + C.z1) / 2);
    G.add(pit);
    for (let k = 0; k < 24; k++) {
      const mist = glow(0x6a4aaa, 8, 0.25);
      mist.position.set(-60 + k * 5.2, -8 - (k % 3) * 4, C.z0 + 2 + (k % 4) * 3.5);
      G.add(mist);
    }
    // cliff edges
    for (const ez of [C.z0, C.z1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(2 * K.R + 8, 30, 0.6), M(0x241c30));
      edge.position.set(0, -15, ez);
      G.add(edge);
    }
    const B = K.bridge;
    const plankMat = M(0x8a6a42);
    for (let z = C.z0; z <= C.z1; z += 0.55) {
      if (B.gaps.some(([a, b]) => z > a - 0.2 && z < b + 0.2)) continue;
      const pl = new THREE.Mesh(new THREE.BoxGeometry(B.w * 2 + 0.3, 0.12, 0.45), plankMat);
      pl.position.set(B.x, -0.06, z);
      pl.rotation.z = Math.sin(z * 3) * 0.04;
      G.add(pl);
    }
    // the ropes (rails)
    for (const sx of [-1, 1]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, C.z1 - C.z0, 5), M(0xc8a870));
      rope.rotation.x = Math.PI / 2;
      rope.position.set(B.x + sx * (B.w + 0.2), 0.9, (C.z0 + C.z1) / 2);
      G.add(rope);
      for (const pz of [C.z0, C.z1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), M(0x6a4a2a));
        post.position.set(B.x + sx * (B.w + 0.2), 0.5, pz);
        G.add(post);
      }
    }
    // the other bridge — snapped long ago, just dangling ropes
    for (const pz of [C.z0, C.z1]) {
      const stub = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 2.5), plankMat);
      stub.position.set(K.broken.x, -0.06, pz + (pz === C.z0 ? 1.2 : -1.2));
      stub.rotation.x = pz === C.z0 ? -0.6 : 0.6;
      G.add(stub);
    }
  }
  // 🍄 the kingdom: five giant mushrooms (dark until you light them), little houses, the mushroom folk
  Z.caps = K.caps.map((c, i) => {
    const g = new THREE.Group();
    g.position.set(c.x, 0, c.z);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 9, 10), M(0xe8e0d0));
    stalk.position.y = 4.5;
    const capMat = new THREE.MeshStandardMaterial({ color: 0x4a3a5a, emissive: 0x000000, roughness: 0.7, flatShading: true });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.scale.y = 0.6;
    cap.position.y = 8.6;
    const halo = glow([0x6affd8, 0xff8ad8, 0x8ad8ff, 0xffd86a, 0xb88aff][i], 20, 0);
    halo.position.y = 9;
    g.add(stalk, cap, halo);
    G.add(g);
    Z.colliders.push({ x: c.x, z: c.z, r: 1.8 });
    return { ...c, capMat, halo, color: [0x6affd8, 0xff8ad8, 0x8ad8ff, 0xffd86a, 0xb88aff][i] };
  });
  Z.folk = [];
  for (let k = 0; k < 14; k++) {
    const a = k * 2.1, d = 8 + (k % 5) * 3;
    const x = Math.cos(a) * d * 1.6, z = 42 + Math.sin(a) * d * 0.7;
    const m = new THREE.Group();
    m.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 8), M(0xf0e8d8)));
    m.children[0].position.y = 0.35;
    const capC = [0xd85a8a, 0x5ab8d8, 0xd8a83a, 0x8ad86a][k % 4];
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(capC, { emissive: capC, emissiveIntensity: 0.4 }));
    hat.position.y = 0.7;
    m.add(hat);
    for (const sx of [-0.09, 0.09]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0x101010 }));
      eye.position.set(sx, 0.5, 0.25);
      m.add(eye);
    }
    m.position.set(x, 0, z);
    G.add(m);
    Z.folk.push({ m, x, z, ph: k });
  }
  live.push((t) => Z.folk.forEach((f) => {
    f.m.position.y = Math.abs(Math.sin(t * 3 + f.ph)) * 0.12;
    f.m.rotation.y = Math.sin(t * 0.7 + f.ph) * 1.2;
  }));
  // little mushroom houses round the edge of the kingdom
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * 0.05 + (k / 8) * Math.PI * 0.9;
    const x = Math.cos(a) * 46, z = 32 + Math.sin(a) * 26;
    const h = new THREE.Group();
    h.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 3, 10), M(0xe8dcc8)));
    h.children[0].position.y = 1.5;
    const c = [0xd85a8a, 0x5ab8d8, 0xd8a83a][k % 3];
    const roof = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(c, { emissive: c, emissiveIntensity: 0.35 }));
    roof.position.y = 2.9;
    roof.scale.y = 0.7;
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    door.position.set(0, 0.8, 1.9);
    h.add(roof, door);
    h.position.set(x, 0, z);
    h.rotation.y = Math.atan2(-x, 40 - z);
    G.add(h);
    Z.colliders.push({ x, z, r: 2.2 });
  }
  // the way back up: a long root ladder
  {
    const L = K.ladder;
    for (const sx of [-0.5, 0.5]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 20, 5), M(0x6a4a2a));
      rail.position.set(L.x + sx, 10, L.z);
      G.add(rail);
    }
    for (let k = 0; k < 28; k++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.1), M(0x8a6a42));
      r.position.set(L.x, 0.4 + k * 0.7, L.z);
      G.add(r);
    }
    const sky = glow(0xfff0c0, 6, 0.6);
    sky.position.set(L.x, 20, L.z);
    G.add(sky);
  }
  // 🪱 the Rootworm's tunnels: walls of tangled roots
  for (const W of K.walls) {
    for (let x = W.x0; x <= W.x1; x += 1.6) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 5 + Math.sin(x) * 1.5, 7), M(0x4a3420));
      root.position.set(x, 2.4, W.z + Math.sin(x * 0.7) * 0.4);
      root.rotation.z = Math.sin(x * 1.3) * 0.15;
      G.add(root);
      Z.colliders.push({ x, z: W.z, r: 1.1 });
    }
  }
  // the worm itself
  {
    const segs = [];
    for (let k = 0; k < 14; k++) {
      const r = 1.3 - k * 0.04;
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), M(k % 2 ? 0x8a5a4a : 0x9a6a5a));
      G.add(s);
      segs.push(s);
    }
    for (const sx of [-0.45, 0.45]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe04a }));
      eye.position.set(sx, 0.4, 1.1);
      segs[0].add(eye);
    }
    Z.worm = { segs, trail: [], u: 0 };
  }
  // the King, tied up in roots, and the three root knots round him
  {
    const C = K.cage;
    const king = new THREE.Group();
    king.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.2, 10), M(0xf0e8d8)));
    king.children[0].position.y = 0.6;
    const kc = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd8a83a, { emissive: 0xd8a83a, emissiveIntensity: 0.25 }));
    kc.position.y = 1.15;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.3, 8, 1, true), M(0xffd040, { metalness: 0.6, side: THREE.DoubleSide }));
    crown.position.y = 2.05;
    king.add(kc, crown);
    for (const sx of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0x101010 }));
      eye.position.set(sx, 0.85, 0.42);
      king.add(eye);
    }
    king.position.set(C.x, 0, C.z);
    G.add(king);
    Z.king = { g: king, kc };
    Z.colliders.push({ x: C.x, z: C.z, r: 1.2 });
    Z.knots = [0, 1, 2].map((k) => {
      const a = Math.PI / 2 + (k - 1) * 1.6;
      const x = C.x + Math.cos(a) * 2.6, z = C.z + Math.sin(a) * 2.6;
      const knot = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 6, 10), M(0x5a3a22));
        r.rotation.set(i, i * 0.7, 0);
        r.position.y = 0.6 + i * 0.25;
        knot.add(r);
      }
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 5), M(0x5a3a22));
      vine.position.set((C.x - x) / 2, 1, (C.z - z) / 2);
      vine.lookAt(new THREE.Vector3(C.x, 1, C.z).sub(new THREE.Vector3(x, 0, z)).add(vine.position));
      vine.rotateX(Math.PI / 2);
      knot.add(vine);
      knot.position.set(x, 0, z);
      G.add(knot);
      return { x, z, g: knot };
    });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🌋 EMBERPEAK — Phase 33 ("The Volcano's Heart"). A smoking volcano: two rings of lava
//  run down its sides (cross on the stepping stones!), ember vents puff
//  fire, boulders tumble down the west gully, two rings of lava circle the
//  mountain, and in the crater at the top, Cinder the fire-spirit roars.
// ======================================================================
export const CINDER = {
  R: 72,
  camp: { x: 0, z: 64 },
  spring: { x: -6, z: 62 },
  rim: 12, top: 22, foot: 58,
  // two rivers of lava ring the mountain — JUMP them (running jump, or a double jump)
  rings: [{ d: 42, w: 1.15 }, { d: 26, w: 1.15 }],
  rivers: [],
  embers: [],
  vents: [],
  gully: { a: (205 * Math.PI) / 180, d0: 28, d1: 54 },
};
for (let k = 0; k < 7; k++) {
  const a = (-0.32 + k * 0.1), d = 30 + (k % 3) * 4;
  CINDER.vents.push({ x: Math.cos(a) * d, z: Math.sin(a) * d });
}
// height of the mountain: flat round the foot, a steady slope up, a crater at the top
export function cinderHeight(x, z) {
  const K = CINDER;
  const d = Math.hypot(x, z);
  if (d >= K.foot) return 0;
  if (d >= K.rim) {
    const slope = (dd) => (K.top * (K.foot - dd)) / (K.foot - K.rim);
    // each ring of lava runs along a FLAT shelf — so you can take a running jump across it
    // (on the bare slope you'd land higher than you took off, and never clear it)
    for (const Rg of K.rings) {
      const off = Math.abs(d - Rg.d), flat = Rg.w + 3, ease = 2.5;
      if (off < flat) return slope(Rg.d);
      if (off < flat + ease) {
        const k = (off - flat) / ease, sm = k * k * (3 - 2 * k);
        return slope(Rg.d) + (slope(d) - slope(Rg.d)) * sm;
      }
    }
    return slope(d);
  }
  // the crater dips down inside the rim
  return K.top - 3 * ((K.rim - d) / K.rim);
}
/** world spot of something on the mountain at angle a, distance d */
export const cinderAt = (a, d) => ({ x: Math.cos(a) * d, z: Math.sin(a) * d });
/** are you standing in a lava river? (stepping stones are safe) */
export function inLava(x, z) {
  const d = Math.hypot(x, z);
  for (const Rg of CINDER.rings) if (Math.abs(d - Rg.d) < Rg.w) return true;
  if (d < CINDER.rim + 0.5 || d > CINDER.foot - 0.5) return false;
  for (const Rv of CINDER.rivers) {
    // distance from the river's line (a ray from the middle)
    const ux = Math.cos(Rv.a), uz = Math.sin(Rv.a);
    const along = x * ux + z * uz;
    if (along < 0) continue;
    const off = Math.abs(-x * uz + z * ux);
    if (off > Rv.w) continue;
    if (Rv.stones.some((sd) => Math.abs(along - sd) < 1.4)) return false;
    return true;
  }
  return false;
}
function buildCinder() {
  const K = CINDER;
  const Z = baseZone("cinder", K.R);
  Z.spots.arrive = { x: K.camp.x, z: K.camp.z - 3 };
  const G = Z.group;
  const live = [];
  Z.height = cinderHeight;
  // the mountain (fine mesh, so you never sink into it)
  {
    const g2 = new THREE.PlaneGeometry(2 * (K.R + 20), 2 * (K.R + 20), 180, 180);
    g2.rotateX(-Math.PI / 2);
    const pos = g2.attributes.position;
    const col = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = cinderHeight(x, z);
      pos.setY(i, h);
      const d = Math.hypot(x, z);
      const c = new THREE.Color(d > K.foot ? 0x4a3a30 : d > K.rim ? 0x3a2e2a : 0x2a1e1a).lerp(new THREE.Color(0x6a4a3a), Math.max(0, Math.sin(x * 0.3) * Math.cos(z * 0.27)) * 0.25);
      col.push(c.r, c.g, c.b);
    }
    g2.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g2.computeVertexNormals();
    G.add(new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // the lava rivers: glowing strips down the mountain, and the stepping stones over them
  const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
  Z.lava = [];
  for (const Rv of K.rivers) {
    const L = K.foot - K.rim;
    const g = new THREE.PlaneGeometry(Rv.w * 2, L, 2, 60);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const ux = Math.cos(Rv.a), uz = Math.sin(Rv.a);
    for (let i = 0; i < pos.count; i++) {
      const across = pos.getX(i), along = K.rim + (pos.getZ(i) + L / 2);
      const x = ux * along - uz * across, z = uz * along + ux * across;
      pos.setXYZ(i, x, cinderHeight(x, z) + 0.08, z);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, lavaMat);
    G.add(m);
    Z.lava.push(m);
    for (const sd of Rv.stones) {
      const at = { x: ux * sd, z: uz * sd };
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.35, 9), M(0x6a6058));
      stone.position.set(at.x, cinderHeight(at.x, at.z) + 0.2, at.z);
      G.add(stone);
    }
    for (let k = 0; k < 8; k++) {
      const gl = glow(0xff7a2a, 4, 0.5);
      const along = K.rim + 3 + k * 5.5;
      gl.position.set(ux * along, cinderHeight(ux * along, uz * along) + 0.6, uz * along);
      G.add(gl);
    }
  }
  // the two rings of lava round the mountain
  for (const Rg of K.rings) {
    const N = 160;
    const pos = [], idx = [];
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * Math.PI * 2;
      for (const off of [-Rg.w, Rg.w]) {
        const x = Math.cos(a) * (Rg.d + off), z = Math.sin(a) * (Rg.d + off);
        pos.push(x, cinderHeight(x, z) + 0.1, z);
      }
      if (k < N) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff6a1a, side: THREE.DoubleSide }));
    G.add(m);
    Z.lava.push(m);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const gl = glow(0xff7a2a, 4, 0.45);
      gl.position.set(Math.cos(a) * Rg.d, cinderHeight(Math.cos(a) * Rg.d, Math.sin(a) * Rg.d) + 0.6, Math.sin(a) * Rg.d);
      G.add(gl);
    }
  }
  live.push((t) => {
    lavaMat.color.setHSL(0.05, 1, 0.5 + Math.sin(t * 2) * 0.06);
    Z.lava.forEach((m) => m.material.color.setHSL(0.05, 1, 0.5 + Math.sin(t * 2) * 0.06));
  });
  // the crater: a lava pool, and Cinder hovering over it
  {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 24), lavaMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = cinderHeight(0, 0) + 0.1;
    G.add(pool);
    Z.colliders.push({ x: 0, z: 0, r: 4.2 });
    const cinder = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
    cinder.add(core);
    const flames = [];
    for (let k = 0; k < 9; k++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 6), new THREE.MeshBasicMaterial({ color: 0xffa02a, transparent: true, opacity: 0.85 }));
      const a = (k / 9) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.9, 1.3, Math.sin(a) * 0.9);
      cinder.add(f);
      flames.push(f);
    }
    for (const sx of [-0.45, 0.45]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffa0 }));
      eye.position.set(sx, 0.35, 1.25);
      cinder.add(eye);
    }
    const halo = glow(0xff7a2a, 9, 0.75);
    cinder.add(halo);
    cinder.position.set(0, cinderHeight(0, 0) + 3.4, 0);
    G.add(cinder);
    Z.cinder = { g: cinder, core, flames, halo };
    Z.calm = false;
    live.push((t) => {
      const calm = Z.calm;
      cinder.position.y = cinderHeight(0, 0) + 3.4 + Math.sin(t * (calm ? 1.2 : 3)) * (calm ? 0.25 : 0.5);
      core.material.color.setHex(calm ? 0xffc040 : 0xff3a10);
      halo.material.color.setHex(calm ? 0xffd070 : 0xff4a1a);
      flames.forEach((f, i) => (f.scale.y = (calm ? 0.8 : 1.3) + Math.sin(t * (calm ? 3 : 9) + i) * (calm ? 0.15 : 0.45)));
    });
  }
  // smoke rising from the crater
  {
    const puffs = [];
    for (let k = 0; k < 14; k++) {
      const p = glow(0x5a5050, 10, 0.35);
      p.material.blending = THREE.NormalBlending;
      G.add(p);
      puffs.push(p);
    }
    live.push((t) => puffs.forEach((p, i) => {
      const k = (t * 0.08 + i / puffs.length) % 1;
      p.position.set(Math.sin(i * 2.3) * (2 + k * 8), cinderHeight(0, 0) + 4 + k * 30, Math.cos(i * 1.7) * (2 + k * 8));
      p.material.opacity = 0.4 * (1 - k);
      p.scale.setScalar(6 + k * 14);
    }));
  }
  // the ember vents (east slope): cracks that puff fire
  Z.vents = K.vents.map((v, i) => {
    const y = cinderHeight(v.x, v.z);
    const crack = new THREE.Mesh(new THREE.CircleGeometry(0.9, 8), new THREE.MeshBasicMaterial({ color: 0x1a0a05 }));
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(v.x, y + 0.06, v.z);
    const fire = glow(0xff8a2a, 3, 0);
    fire.position.set(v.x, y + 1, v.z);
    G.add(crack, fire);
    return { ...v, fire, ph: i * 0.77 };
  });
  // the camp at the foot: a tent, a fire, a cold mountain spring
  {
    const C = K.camp;
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 4), M(0x3a6a8a));
    tent.position.set(C.x + 4, 1.4, C.z + 2);
    G.add(tent);
    Z.colliders.push({ x: C.x + 4, z: C.z + 2, r: 2.2 });
    const S = K.spring;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.8, 18), new THREE.MeshStandardMaterial({ color: 0x5ac8e8, roughness: 0.15 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(S.x, 0.06, S.z);
    G.add(pool);
    for (let k = 0; k < 8; k++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), M(0x7a7470));
      rock.position.set(S.x + Math.cos(k * 0.8) * 2.2, 0.3, S.z + Math.sin(k * 0.8) * 2.2);
      G.add(rock);
    }
  }
  // the Heart-Embers
  Z.embers = K.embers.map((E) => {
    const at = cinderAt(E.a, E.d);
    const g = new THREE.Group();
    g.position.set(at.x, cinderHeight(at.x, at.z) + 0.8, at.z);
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffb040 })), glow(0xff8a2a, 3.4, 0.9));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.6, 26, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.y = 13;
    g.add(beam);
    G.add(g);
    return { ...E, ...at, g };
  });
  live.push((t) => Z.embers.forEach((e, i) => {
    e.g.rotation.y = t * 1.5 + i;
    e.g.children[0].position.y = Math.sin(t * 2 + i) * 0.15;
  }));
  // scattered boulders (solid!)
  for (let k = 0; k < 26; k++) {
    const a = k * 2.39, d = 16 + ((k * 7.3) % 40);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (inLava(x, z) || Math.hypot(x - K.camp.x, z - K.camp.z) < 8) continue;
    if (Z.embers.some((e) => Math.hypot(e.x - x, e.z - z) < 4)) continue;
    const r = 0.8 + (k % 3) * 0.4;
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(r), M(0x5a4e48));
    b.position.set(x, cinderHeight(x, z) + r * 0.5, z);
    G.add(b);
    Z.colliders.push({ x, z, r: r + 0.3 });
  }
  // falling rocks (the phase moves them): a pool of boulders + warning shadows
  Z.rocks = [];
  for (let k = 0; k < 6; k++) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), M(0x4a3e38));
    b.visible = false;
    const sh = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.4, 20), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    sh.rotation.x = -Math.PI / 2;
    sh.visible = false;
    G.add(b, sh);
    Z.rocks.push({ b, sh, t: -1, x: 0, z: 0 });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

export const DUNES = {
  camp: { x: 0, z: 88 },
  temple: { x: 0, z: 0, r: 13 },
  obelisks: [
    { key: "dawn", name: "the Obelisk of Dawn", icon: "🌅", x: 70, z: 40, whisper: "past the oasis nearest your camp — and on beyond it" },
    { key: "noon", name: "the Obelisk of Noon", icon: "☀️", x: 78, z: -55, whisper: "straight toward the great sun, far past the middle oasis" },
    { key: "dusk", name: "the Obelisk of Dusk", icon: "🌇", x: -75, z: -48, whisper: "with the sun at your back, past the lonely oasis, among the tallest dunes" },
    { key: "night", name: "the Obelisk of Night", icon: "🌙", x: -64, z: 52, whisper: "near your camp — on the side away from the first oasis" },
  ],
  oases: [
    { x: 30, z: 56, r: 7 },
    { x: 52, z: -14, r: 7 },
    { x: -44, z: 4, r: 7 },
  ],
};
function buildDunes() {
  const Z = baseZone("dunes", 110);
  const D = DUNES;
  Z.spots.arrive = { x: D.camp.x, z: D.camp.z - 3 };
  Z.dunes = D;
  const G = Z.group;
  const live = [];
  // rolling dunes — flattened at the camp, the oases, the obelisks and the temple
  const flats = [{ ...D.camp, r: 9 }, ...D.oases.map((o) => ({ ...o, r: o.r + 3 })), ...D.obelisks.map((o) => ({ ...o, r: 5 })), { ...D.temple, r: D.temple.r + 4 }];
  const raw = (x, z) => 1.2 + Math.sin(x * 0.045) * Math.cos(z * 0.05) * 3 + Math.sin(x * 0.12 + z * 0.07) * 1.1;
  Z.height = (x, z) => {
    let h = raw(x, z);
    for (const f of flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + 6) {
        const k = Math.max(0, Math.min(1, (d - f.r) / 6));
        h = 0.6 + (h - 0.6) * k;
      }
    }
    return h;
  };
  // the sand
  {
    const geo = new THREE.PlaneGeometry(240, 240, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Z.height(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, M(0xe8c27a)));
  }
  // your camp: a striped tent and a little fire
  {
    const C = D.camp;
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 4), M(0xc84a3a));
    tent.position.set(C.x + 3, 0.6 + 1.5, C.z + 2);
    const fire = glow(0xffa040, 4, 0.9);
    fire.position.set(C.x - 2, 1.1, C.z + 1);
    G.add(tent, fire);
    Z.colliders.push({ x: C.x + 3, z: C.z + 2, r: 2.4 });
  }
  // the oases: a pool, palms, cool shade
  for (const o of D.oases) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(o.r - 2, 24), new THREE.MeshStandardMaterial({ color: 0x3ab8c8, roughness: 0.2 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(o.x, 0.65, o.z);
    G.add(pool);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.6 + 0.4;
      const px = o.x + Math.cos(a) * (o.r - 0.5);
      const pz = o.z + Math.sin(a) * (o.r - 0.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 6, 6), M(0x8a6a3a));
      trunk.position.set(px, 3.6, pz);
      trunk.rotation.z = 0.15;
      G.add(trunk);
      for (let l = 0; l < 5; l++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.8), M(0x4a9a3a));
        leaf.position.set(px + Math.cos(l * 1.26) * 1.4, 6.6, pz + Math.sin(l * 1.26) * 1.4);
        leaf.rotation.set(0.3, -l * 1.26, 0);
        G.add(leaf);
      }
      Z.colliders.push({ x: px, z: pz, r: 0.5 });
    }
  }
  // the obelisks, each with a sun-stone at its foot
  Z.stones = {};
  for (const o of D.obelisks) {
    const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 12, 4), M(0xc8a060));
    ob.position.set(o.x, 0.6 + 6, o.z);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 4), M(0xffd860, { emissive: 0x8a6a10 }));
    tip.position.set(o.x, 0.6 + 12.8, o.z);
    G.add(ob, tip);
    Z.colliders.push({ x: o.x, z: o.z, r: 1.6 });
    const stone = new THREE.Group();
    stone.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xffc040 })), glow(0xffd060, 4, 0.7));
    stone.position.set(o.x + 2.6, 1.4, o.z);
    G.add(stone);
    Z.stones[o.key] = stone;
    live.push((t) => {
      stone.rotation.y = t * 1.5;
      stone.position.y = 1.4 + Math.sin(t * 2) * 0.15;
    });
  }
  // the buried temple: only its golden tip shows — until it RISES
  {
    const T = D.temple;
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const w = (T.r - i * 2.4) * 2;
      const step = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, w), M(i % 2 ? 0xd8b070 : 0xc8a060));
      step.position.y = 1.2 + i * 2.4;
      g.add(step);
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3, 4), M(0xffd860, { emissive: 0x6a5010 }));
    cap.position.y = 12 + 1.5;
    cap.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 2, T.r + 0.02);
    g.add(cap, door);
    g.position.set(T.x, 0.6 - 12, T.z); // (buried: only the cap pokes out)
    G.add(g);
    Z.temple = g;
    const lantern = new THREE.Group();
    lantern.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff0b0 })), glow(0xffe8a0, 10, 0.9));
    lantern.position.set(T.x, 0.6 + 16, T.z);
    lantern.visible = false;
    G.add(lantern);
    Z.lantern = lantern;
  }
  Z.raiseTemple = (k) => {
    Z.temple.position.y = 0.6 - 12 * (1 - k);
    if (k >= 1 && !Z.templeSolid) {
      Z.templeSolid = true;
      Z.colliders.push({ x: D.temple.x, z: D.temple.z, r: D.temple.r });
    }
  };
  // heat shimmer + a big sun
  {
    const sun = glow(0xfff0c0, 120, 0.6);
    sun.position.set(80, 90, -160);
    G.add(sun);
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏛️ INSIDE THE TEMPLE — a torch-lit hall under the pyramid, with
//  pillars and murals of the Moonkeepers. Light the four torches and a
//  stone slab slides up: behind it, the First Moonkeeper's treasure room.
// ======================================================================
export const PYRAMID = {
  hall: { r: 19 },
  door: { x: 0, z: 19 }, // the way out
  torches: [
    { x: 13.4, z: 6 }, { x: 13.4, z: -6 }, { x: -13.4, z: -6 }, { x: -13.4, z: 6 },
  ],
  vault: { x: 0, z: -29, r: 7.5 },
};
function buildPyramid() {
  const P = PYRAMID;
  const Z = baseZone("pyramid", 40);
  Z.spots.arrive = { x: 0, z: P.hall.r - 3 };
  Z.pyramid = P;
  Z.vaultOpen = false;
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  // (you can only be in the hall — or, once the slab is up, the passage and the treasure room)
  let last = { x: 0, z: P.hall.r - 3 };
  const ok = (x, z) => Math.hypot(x, z) < P.hall.r - 0.8 || (Z.vaultOpen && ((Math.abs(x) < 1.8 && z < 0 && z > P.vault.z) || Math.hypot(x - P.vault.x, z - P.vault.z) < P.vault.r - 0.8));
  const baseConstrain = Z.constrain;
  Z.constrain = (p) => {
    baseConstrain(p);
    if (ok(p.x, p.z)) last = { x: p.x, z: p.z };
    else {
      p.x = last.x;
      p.z = last.z;
    }
  };
  const stone = M(0xc8a46a);
  const dark = M(0x8a6a3e);
  // the floor and ceiling
  const floor = new THREE.Mesh(new THREE.CircleGeometry(P.hall.r + 1, 8), M(0xb89058));
  floor.rotation.x = -Math.PI / 2;
  floor.rotation.z = Math.PI / 8;
  G.add(floor);
  const ceil = new THREE.Mesh(new THREE.ConeGeometry(P.hall.r + 1, 14, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x7a5a32, side: THREE.BackSide, flatShading: true }));
  ceil.position.y = 8 + 7;
  ceil.rotation.y = Math.PI / 8;
  G.add(ceil);
  // eight walls (with a doorway at the south, and the sealed slab at the north)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const w = 2 * (P.hall.r + 0.5) * Math.tan(Math.PI / 8);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 8, 1), k % 2 ? stone : dark);
    wall.position.set(Math.sin(a) * (P.hall.r + 0.5), 4, Math.cos(a) * (P.hall.r + 0.5));
    wall.rotation.y = a;
    G.add(wall);
    // the murals: a little Moonkeeper with a lantern, on every other wall
    if (k % 2 && k !== 4) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ color: 0x3a5a8a }));
      const head = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), new THREE.MeshBasicMaterial({ color: 0xa87a4a }));
      head.position.y = 1.6;
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), new THREE.MeshBasicMaterial({ color: 0xffd860 }));
      lamp.position.set(1.1, 0.4, 0);
      const moon = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshBasicMaterial({ color: 0xf4f0e0 }));
      moon.position.set(-1.8, 2.6, 0);
      g.add(body, head, lamp, moon);
      g.position.set(Math.sin(a) * (P.hall.r - 0.05), 3, Math.cos(a) * (P.hall.r - 0.05));
      g.rotation.y = a + Math.PI;
      G.add(g);
    }
  }
  // the doorway out (south) — bright desert light
  {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.4), new THREE.MeshBasicMaterial({ color: 0xfff0c8 }));
    d.position.set(P.door.x, 2.2, P.door.z + 0.45);
    d.rotation.y = Math.PI;
    G.add(d);
  }
  // pillars
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const px = Math.sin(a) * 9;
    const pz = Math.cos(a) * 9;
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 10, 8), stone);
    pil.position.set(px, 5, pz);
    G.add(pil);
    Z.colliders.push({ x: px, z: pz, r: 1.2 });
  }
  // a pedestal in the middle, where the First Lantern slept
  {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.4, 8), dark);
    ped.position.y = 0.7;
    G.add(ped);
    Z.colliders.push({ x: 0, z: 0, r: 1.9 });
  }
  // the four torches (cold until you light them)
  Z.torches = P.torches.map((T) => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.4, 6), M(0x5a3e22));
    post.position.y = 1.2;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 0.5, 8), M(0x8a7a5a));
    bowl.position.y = 2.6;
    const flame = new THREE.Group();
    flame.add(new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffa040 })), glow(0xffb050, 8, 0.85));
    flame.position.y = 3.3;
    flame.visible = false;
    g.add(post, bowl, flame);
    g.position.set(T.x, 0, T.z);
    G.add(g);
    Z.colliders.push({ x: T.x, z: T.z, r: 0.6 });
    live.push((t) => (flame.scale.y = 1 + Math.sin(t * 11 + T.x) * 0.15));
    return { flame };
  });
  // the sealed slab (north) — it slides up when all four torches burn
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.8), M(0x9a7a4a));
  slab.position.set(0, 2.3, -P.hall.r - 0.3);
  G.add(slab);
  Z.slab = slab;
  // the passage and the treasure room
  {
    const pass = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, Math.abs(P.vault.z) - P.hall.r), M(0xb89058));
    pass.position.set(0, 0.02, (-P.hall.r + P.vault.z + P.vault.r) / 2);
    G.add(pass);
    for (const sx of [-2.2, 2.2]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, Math.abs(P.vault.z) - P.hall.r - P.vault.r + 2), dark);
      w.position.set(sx, 2.5, (-P.hall.r + P.vault.z + P.vault.r) / 2);
      G.add(w);
    }
    const room = new THREE.Mesh(new THREE.CylinderGeometry(P.vault.r + 0.4, P.vault.r + 0.4, 6, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a6a3e, side: THREE.BackSide, flatShading: true }));
    room.position.set(P.vault.x, 3, P.vault.z);
    const rf = new THREE.Mesh(new THREE.CircleGeometry(P.vault.r + 0.4, 10), M(0xb89058));
    rf.rotation.x = -Math.PI / 2;
    rf.position.set(P.vault.x, 0.02, P.vault.z);
    G.add(room, rf);
    // heaps of gold, and a chest
    const goldMat = M(0xffc840, { emissive: 0x6a4a00 });
    for (let k = 0; k < 14; k++) {
      const a = k * 0.45 + 0.3;
      const r = P.vault.r - 1.6 - (k % 3) * 0.8;
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.6 + (k % 3) * 0.3, 8, 6), goldMat);
      c.scale.y = 0.5;
      c.position.set(P.vault.x + Math.cos(a + 2.4) * r, 0.25, P.vault.z + Math.sin(a + 2.4) * r);
      G.add(c);
    }
    const chest = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1.2), M(0x6a4422));
    box.position.y = 0.5;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.3), M(0xc8a040));
    lid.position.y = 1.15;
    chest.add(box, lid);
    chest.position.set(P.vault.x, 0, P.vault.z - 2.5);
    G.add(chest, (() => { const h = glow(0xffd860, 10, 0.55); h.position.set(P.vault.x, 1.5, P.vault.z - 2.5); return h; })());
    Z.chestLid = lid;
  }
  Z.openVault = (k) => {
    Z.slab.position.y = 2.3 + 5 * k;
    if (k >= 1) Z.vaultOpen = true;
  };
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  ⛸️ FROSTPINE'S FROZEN LAKE — a big oval of glassy ice in a ring of
//  snowy pines and lanterns. The judges' booth (for the figure-skating
//  show) on the north shore, the skate hut on the west, the gate back to
//  Frostpine on the south. Mind the cracks!
// ======================================================================
export const RINK = {
  lake: { rx: 36, rz: 25 },
  gate: { x: 0, z: 42 },
  judges: { x: 0, z: -31 },
  hut: { x: -41, z: 10 },
  cracks: [
    { x: 14, z: -9, r: 1.6, a: 0.4 }, { x: -18, z: 7, r: 1.6, a: 1.9 }, { x: 22, z: 12, r: 1.5, a: 2.6 }, { x: -6, z: -16, r: 1.4, a: 1.1 }, { x: -26, z: -8, r: 1.4, a: 0.2 },
  ],
};
function buildRink() {
  const K = RINK;
  const Z = baseZone("rink", 62);
  Z.spots.arrive = { x: K.gate.x, z: K.gate.z - 3 };
  Z.rink = K;
  const G = Z.group;
  const live = [];
  const inLake = (x, z) => (x / K.lake.rx) ** 2 + (z / K.lake.rz) ** 2;
  Z.iceAt = (x, z) => inLake(x, z) < 1;
  Z.height = (x, z) => {
    const e = inLake(x, z);
    if (e < 1) return 0.05;
    const d = Math.hypot(x, z);
    return 0.05 + Math.min(1, (e - 1) * 1.6) * 0.9 + Math.max(0, d - 50) * 0.8 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.25 * Math.min(1, e - 1);
  };
  Z.cracks = K.cracks;
  // snowy ground
  {
    const geo = new THREE.PlaneGeometry(150, 150, 70, 70);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Z.height(pos.getX(i), pos.getZ(i)) - (Z.iceAt(pos.getX(i), pos.getZ(i)) ? 0.2 : 0));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, M(0xf0f4fa)));
  }
  // the ice: glassy, pale blue, with a soft shine
  {
    const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0xbfe0f4, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.92 }));
    ice.rotation.x = -Math.PI / 2;
    ice.scale.set(K.lake.rx, K.lake.rz, 1);
    ice.position.y = 0.04;
    G.add(ice);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 80), M(0xffffff));
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(K.lake.rx, K.lake.rz, 1);
    rim.position.y = 0.08;
    G.add(rim);
  }
  // ⚡ the cracks (skate over them fast and you wobble — or fall!)
  for (const c of K.cracks) {
    const g = new THREE.Group();
    let x = -c.r, z = 0;
    for (let i = 0; i < 6; i++) {
      const nx = x + (c.r * 2) / 6;
      const nz = (Math.random() - 0.5) * 0.7;
      const len = Math.hypot(nx - x, nz - z);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(len, 0.01, 0.05), new THREE.MeshBasicMaterial({ color: 0x5a7a9a }));
      seg.position.set((x + nx) / 2, 0.06, (z + nz) / 2);
      seg.rotation.y = -Math.atan2(nz - z, nx - x);
      g.add(seg);
      x = nx;
      z = nz;
    }
    g.position.set(c.x, 0, c.z);
    g.rotation.y = c.a;
    G.add(g);
  }
  // snowy pines all round
  const needle = M(0x2e4a3a);
  const snowM = M(0xffffff);
  for (let k = 0; k < 46; k++) {
    const a = (k / 46) * Math.PI * 2 + hash(k, 71) * 0.1;
    const d = 46 + hash(k, 72) * 10;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.hypot(x - K.gate.x, z - K.gate.z) < 7) continue;
    const h = 7 + hash(k, 73) * 5;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6), M(0x6a4a2c));
    trunk.position.y = 0.8;
    tree.add(trunk);
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 - i * 0.55, h / 2.4, 8), needle);
      cone.position.y = 1.6 + i * (h / 4);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.4 - i * 0.35, h / 6, 8), snowM);
      cap.position.y = 1.6 + i * (h / 4) + h / 10;
      tree.add(cone, cap);
    }
    tree.position.set(x, Z.height(x, z) - 0.1, z);
    G.add(tree);
    Z.colliders.push({ x, z, r: 1.2 });
  }
  // lantern posts round the lake, with strings of warm lights between them
  const posts = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const x = Math.cos(a) * (K.lake.rx + 3.5);
    const z = Math.sin(a) * (K.lake.rz + 3.5);
    const y = Z.height(x, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.2, 6), M(0x3a2a1a));
    post.position.set(x, y + 1.6, z);
    const lamp = glow(0xffd890, 3, 0.9);
    lamp.position.set(x, y + 3.3, z);
    G.add(post, lamp);
    Z.colliders.push({ x, z, r: 0.35 });
    posts.push(new THREE.Vector3(x, y + 3.2, z));
  }
  for (let k = 0; k < posts.length; k++) {
    const A = posts[k];
    const B = posts[(k + 1) % posts.length];
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const b = glow([0xffb0d0, 0xfff0a0, 0xa0d8ff][(k + i) % 3], 0.7, 0.9);
      b.position.set(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t - Math.sin(t * Math.PI) * 0.8, A.z + (B.z - A.z) * t);
      G.add(b);
      live.push((tt) => (b.material.opacity = 0.6 + Math.sin(tt * 3 + k + i) * 0.3));
    }
  }
  // the judges' booth: a long table under a striped roof, and three judges
  {
    const J = K.judges;
    const y = Z.height(J.x, J.z);
    const g = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 1.4), M(0x8a5a3a));
    table.position.y = 0.5;
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.7, 1.45), M(0x3a5a9a));
    cloth.position.y = 0.45;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 3), M(0xd84a6a));
    roof.position.set(0, 3.4, -0.4);
    for (const sx of [-3.8, 3.8]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6), M(0xffffff));
      pole.position.set(sx, 1.7, -0.4);
      g.add(pole);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sign.position.set(0, 3.9, 1.05);
    g.add(table, cloth, roof, sign);
    Z.judges = [];
    const looks = [[0x6a4a8a, 0x4a3a6a], [0x8a4a4a, 0x6a3a3a], [0x4a6a8a, 0x3a4a6a]];
    for (let i = 0; i < 3; i++) {
      const m = buildThistle({ tunicColor: looks[i][0], hoodColor: looks[i][1], pack: false });
      m.scale.setScalar(1.6);
      m.position.set(-2.2 + i * 2.2, 0, -1.2);
      // their score cards (blank until a routine ends)
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const tex = new THREE.CanvasTexture(cv);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
      card.position.set(-2.2 + i * 2.2, 2.2, -0.4);
      card.visible = false;
      g.add(m, card);
      Z.judges.push({ m, card, cv, tex });
    }
    g.position.set(J.x, y, J.z);
    G.add(g);
    Z.colliders.push({ x: J.x - 2.5, z: J.z, r: 1.2 }, { x: J.x, z: J.z, r: 1.2 }, { x: J.x + 2.5, z: J.z, r: 1.2 });
  }
  // the skate hut
  {
    const Hh = K.hut;
    const y = Z.height(Hh.x, Hh.z);
    const g = new THREE.Group();
    const logs = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), M(0x7a5232));
    logs.position.y = 1.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 2.2, 4), snowM);
    roof.position.y = 4.1;
    roof.rotation.y = Math.PI / 4;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    win.position.set(2.52, 1.7, 0);
    win.rotation.y = Math.PI / 2;
    const skatesSign = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 6, 14), M(0xf28ab8));
    skatesSign.position.set(2.6, 3.2, 0);
    skatesSign.rotation.y = Math.PI / 2;
    g.add(logs, roof, win, skatesSign);
    g.position.set(Hh.x, y, Hh.z);
    G.add(g);
    Z.colliders.push({ x: Hh.x, z: Hh.z, r: 2.8 });
  }
  // the gate back to Frostpine
  {
    const T = K.gate;
    const y = Z.height(T.x, T.z);
    for (const sx of [-2.4, 2.4]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 4, 6), M(0x6a4a2c));
      p.position.set(T.x + sx, y + 2, T.z + 1.5);
      G.add(p);
      Z.colliders.push({ x: T.x + sx, z: T.z + 1.5, r: 0.4 });
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 0.5), M(0x6a4a2c));
    top.position.set(T.x, y + 4, T.z + 1.5);
    G.add(top);
  }
  // gentle snowfall
  {
    const N = 500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(Math.random() - 0.5) * 120, Math.random() * 30, (Math.random() - 0.5) * 120], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 }));
    G.add(snow);
    live.push((t) => {
      const a = geo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = a.getY(i) - 0.04;
        if (y < 0) y = 30;
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t + i) * 0.01);
      }
      a.needsUpdate = true;
    });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏆 THE TROPHY ROOM — a grand hall through a golden arch in your
//  cottage: red carpet, pillars, chandeliers, and a pedestal for every
//  treasure you've ever won (trophies.js fills the pedestals).
// ======================================================================
export const TROPHY = { w: 18, l: 64, door: { x: 0, z: 30 } };
function buildTrophies() {
  const T = TROPHY;
  const Z = baseZone("trophies", 60);
  Z.spots.arrive = { x: T.door.x, z: T.door.z - 3 };
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  const baseC = Z.constrain;
  Z.constrain = (p) => {
    baseC(p);
    p.x = Math.max(-T.w + 1, Math.min(T.w - 1, p.x));
    p.z = Math.max(-T.l / 2 + 1, Math.min(T.l / 2 - 1, p.z));
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(T.w * 2, T.l), M(0x7a5232));
  floor.rotation.x = -Math.PI / 2;
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4, T.l - 2), M(0xa82a3a));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = 0.02;
  G.add(floor, carpet);
  for (const sx of [-1.9, 1.9]) {
    const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.25, T.l - 2), M(0xe8c050));
    trim.rotation.x = -Math.PI / 2;
    trim.position.set(sx, 0.025, 0);
    G.add(trim);
  }
  // walls, with tall windows full of night sky
  const wallM = M(0xc8b090);
  for (const [w, h, x, z, ry] of [[T.w * 2, 9, 0, -T.l / 2, 0], [T.w * 2, 9, 0, T.l / 2, Math.PI], [T.l, 9, -T.w, 0, Math.PI / 2], [T.l, 9, T.w, 0, -Math.PI / 2]]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xc8b090, side: THREE.DoubleSide, flatShading: true }));
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    G.add(wall);
  }
  for (let k = -2; k <= 2; k++) {
    for (const sx of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), new THREE.MeshBasicMaterial({ color: 0x1a2a5a }));
      win.position.set(sx * (T.w - 0.05), 4.6, k * 12);
      win.rotation.y = -sx * Math.PI / 2;
      const moon = glow(0xdfe8ff, 2.2, 0.8);
      moon.position.set(sx * (T.w - 0.1), 5.6, k * 12 + 0.6);
      G.add(win, moon);
    }
  }
  // pillars and banners
  for (let k = -3; k <= 3; k++) {
    for (const sx of [-1, 1]) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 9, 10), wallM);
      pil.position.set(sx * (T.w - 2.2), 4.5, k * 9);
      G.add(pil);
      Z.colliders.push({ x: sx * (T.w - 2.2), z: k * 9, r: 0.9 });
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3), M([0x3a5a9a, 0xa82a3a, 0x3a8a5a][(k + 3) % 3]));
      ban.position.set(sx * (T.w - 0.1), 6, k * 9 + 4.5);
      ban.rotation.y = -sx * Math.PI / 2;
      G.add(ban);
    }
  }
  // chandeliers
  for (let k = -2; k <= 2; k++) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 6, 20), M(0xe8c050));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    for (let i = 0; i < 8; i++) {
      const c = glow(0xffd890, 1.4, 0.95);
      c.position.set(Math.cos(i * 0.785) * 1.4, 0.3, Math.sin(i * 0.785) * 1.4);
      g.add(c);
    }
    g.add(glow(0xffe0a0, 8, 0.4));
    g.position.set(0, 7.6, k * 12);
    G.add(g);
    live.push((t) => (g.rotation.y = t * 0.1));
  }
  // the golden arch back into your cottage
  {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.3, 8, 20, Math.PI), M(0xe8c050));
    arch.position.set(T.door.x, 2.4, T.door.z + 1.9);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(T.door.x, 2.1, T.door.z + 1.95);
    door.rotation.y = Math.PI;
    G.add(arch, door);
  }
  Z.shelf = new THREE.Group(); // (trophies.js puts the pedestals in here)
  G.add(Z.shelf);
  Z.update = (t) => {
    for (const f of live) f(t);
    if (Z.spin) Z.spin(t);
  };
  return Z;
}

// ======================================================================
//  🐚 CORALMERE — Phase 27. A sunken city of sea-mice under Reedmere's
//  lagoon: shell-domed houses, coral reefs, a swaying kelp forest, pearl
//  lamps (dark until you light them), Queen Pearlfin's palace — and,
//  across a bottomless trench, the Tide Gate, where the giant whale
//  Old Barnacle lies fast asleep.
// ======================================================================
export const CORAL = {
  arrive: { x: 0, z: 70 },
  palace: { x: 0, z: 24 },
  turtle: { x: 9, z: 18 },
  lamps: [
    { x: -26, z: 46 }, { x: 30, z: 40 }, { x: -44, z: 12 }, { x: 46, z: 2 }, { x: -8, z: -4 },
  ],
  kelp: { x: -38, z: 30, r: 22 },
  trench: { z0: -18, z1: -40 },
  plateau: { x: 0, z: -72, r: 30, y: 3 },
  whale: { x: 0, z: -78 },
  conchs: [{ x: -22, z: -58 }, { x: 24, z: -60 }, { x: 0, z: -94 }],
};
function buildCoral() {
  const C = CORAL;
  const Z = baseZone("coral", 110);
  Z.spots.arrive = { ...C.arrive };
  Z.coral = C;
  const G = Z.group;
  const live = [];
  const inTrench = (x, z) => z < C.trench.z0 && z > C.trench.z1;
  Z.inTrench = inTrench;
  Z.height = (x, z) => {
    if (inTrench(x, z)) return ABYSS;
    if (z <= C.trench.z1) return C.plateau.y + Math.sin(x * 0.08) * 0.6;
    return Math.sin(x * 0.07) * Math.cos(z * 0.06) * 1.2 + Math.sin((x + z) * 0.11) * 0.4;
  };
  // the sandy seabed (and the far plateau)
  {
    const geo = new THREE.PlaneGeometry(240, 240, 90, 90);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, inTrench(x, z) ? -40 : Z.height(x, z));
    }
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, M(0xd8c89a)));
  }
  // the trench walls: deep, dark, bottomless
  for (const zz of [C.trench.z0, C.trench.z1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(240, 46), new THREE.MeshStandardMaterial({ color: 0x2a4a5a, side: THREE.DoubleSide, flatShading: true }));
    wall.position.set(0, -20, zz);
    G.add(wall);
  }
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(240, Math.abs(C.trench.z1 - C.trench.z0)), new THREE.MeshBasicMaterial({ color: 0x041420 }));
  dark.rotation.x = -Math.PI / 2;
  dark.position.set(0, -38, (C.trench.z0 + C.trench.z1) / 2);
  G.add(dark);
  // shafts of sunlight from far above, and bubbles rising
  for (let k = 0; k < 9; k++) {
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 4, 60, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ray.position.set((hash(k, 81) - 0.5) * 160, 28, (hash(k, 82) - 0.5) * 160);
    ray.rotation.z = 0.15;
    G.add(ray);
    live.push((t) => (ray.material.opacity = 0.05 + Math.sin(t * 0.6 + k) * 0.025));
  }
  {
    const N = 300;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(Math.random() - 0.5) * 200, Math.random() * 40, (Math.random() - 0.5) * 200], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const bub = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8fbff, size: 0.35, transparent: true, opacity: 0.7 }));
    G.add(bub);
    live.push(() => {
      const a = geo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = a.getY(i) + 0.05;
        if (y > 40) y = 0;
        a.setY(i, y);
      }
      a.needsUpdate = true;
    });
  }
  // coral reefs: branching, bright
  const coralCols = [0xff7a8a, 0xffa04a, 0xc87aff, 0x4ad8c8, 0xffe060, 0xff5ab0];
  for (let k = 0; k < 70; k++) {
    const x = (hash(k, 91) - 0.5) * 200;
    const z = (hash(k, 92) - 0.5) * 200;
    if (inTrench(x, z) || Math.hypot(x - C.palace.x, z - C.palace.z) < 14 || Math.hypot(x - C.arrive.x, z - C.arrive.z) < 8 || Math.hypot(x - C.whale.x, z - C.whale.z) < 26) continue;
    if (C.lamps.some((l) => Math.hypot(x - l.x, z - l.z) < 5)) continue;
    const g = new THREE.Group();
    const col = coralCols[k % coralCols.length];
    const n = 3 + (k % 4);
    for (let i = 0; i < n; i++) {
      const h = 1 + hash(k, 100 + i) * 2.2;
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, h, 6), M(col, { emissive: col, emissiveIntensity: 0.15 }));
      br.position.set((hash(k, 110 + i) - 0.5) * 1.2, h / 2, (hash(k, 120 + i) - 0.5) * 1.2);
      br.rotation.set((hash(k, 130 + i) - 0.5) * 0.8, 0, (hash(k, 140 + i) - 0.5) * 0.8);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), M(col));
      tip.position.set(br.position.x + Math.sin(br.rotation.z) * -h / 2, h, br.position.z + Math.sin(br.rotation.x) * h / 2);
      g.add(br, tip);
    }
    g.position.set(x, Z.height(x, z), z);
    G.add(g);
  }
  // 🌿 the kelp forest: tall swaying strands (lamps hide among them)
  Z.kelp = [];
  for (let k = 0; k < 90; k++) {
    const a = hash(k, 151) * Math.PI * 2;
    const r = Math.sqrt(hash(k, 152)) * C.kelp.r;
    const x = C.kelp.x + Math.cos(a) * r;
    const z = C.kelp.z + Math.sin(a) * r;
    if (C.lamps.some((l) => Math.hypot(x - l.x, z - l.z) < 3)) continue;
    const h = 9 + hash(k, 153) * 10;
    const strand = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, h / 5, 0.06), M(0x3a8a4a));
      seg.position.y = (i + 0.5) * (h / 5);
      strand.add(seg);
    }
    strand.position.set(x, Z.height(x, z), z);
    G.add(strand);
    live.push((t) => {
      strand.children.forEach((s, i) => {
        s.rotation.z = Math.sin(t * 0.9 + k + i * 0.5) * 0.12 * i;
        s.position.x = Math.sin(t * 0.9 + k) * 0.18 * i * i;
      });
    });
  }
  // 🐚 shell-domed houses of the sea-mice
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const r = 34 + (k % 3) * 9;
    const x = C.palace.x + Math.cos(a) * r;
    const z = C.palace.z + Math.sin(a) * r * 0.7;
    if (inTrench(x, z) || z < C.trench.z0 + 6 || Math.hypot(x - C.kelp.x, z - C.kelp.z) < C.kelp.r || Math.hypot(x - C.arrive.x, z - C.arrive.z) < 9) continue;
    if (Math.abs(x - C.palace.x) < 10 && z > C.palace.z) continue; // (keep the avenue to the palace clear)
    if (C.lamps.some((l) => Math.hypot(x - l.x, z - l.z) < 5)) continue;
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M([0xf8e0d0, 0xe8c8f0, 0xd0f0e8][k % 3]));
    const ribs = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.08, 4, 20, Math.PI), M(0xffffff));
    ribs.rotation.y = Math.PI / 2;
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 0.7, 2.55);
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
    win.position.set(1.4, 1.4, 2.1);
    win.rotation.y = 0.5;
    g.add(dome, ribs, door, win);
    g.position.set(x, Z.height(x, z), z);
    g.rotation.y = Math.atan2(C.palace.x - x, C.palace.z - z);
    G.add(g);
    Z.colliders.push({ x, z, r: 2.8 });
  }
  // 👑 Queen Pearlfin's palace: a tall spiral shell
  {
    const P = C.palace;
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const tier = new THREE.Mesh(new THREE.ConeGeometry(6 - i * 0.9, 3.4, 14, 1, true), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xfff0f4 : 0xf8d8e8, side: THREE.DoubleSide, flatShading: true }));
      tier.position.y = 1.7 + i * 2.6;
      tier.rotation.y = i * 0.6;
      g.add(tier);
    }
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xc8e8ff, emissiveIntensity: 0.5, roughness: 0.2 }));
    pearl.position.y = 17.6;
    g.add(pearl, (() => { const h = glow(0xdff4ff, 10, 0.6); h.position.y = 17.6; return h; })());
    g.position.set(P.x, Z.height(P.x, P.z), P.z);
    G.add(g);
    Z.colliders.push({ x: P.x, z: P.z, r: 6 });
  }
  // the pearl lamps (dark until you light them)
  Z.lamps = C.lamps.map((L) => {
    const g = new THREE.Group();
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 3.2, 6), M(0xc8b8a0));
    stand.position.y = 1.6;
    const clam = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8d8c8));
    clam.position.y = 3.2;
    clam.rotation.x = Math.PI;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a8a96, roughness: 0.3 }));
    pearl.position.y = 3.25;
    const halo = glow(0xdff8ff, 9, 0.85);
    halo.position.y = 3.3;
    halo.visible = false;
    g.add(stand, clam, pearl, halo);
    g.position.set(L.x, Z.height(L.x, L.z), L.z);
    G.add(g);
    Z.colliders.push({ x: L.x, z: L.z, r: 0.5 });
    return { pearl, halo };
  });
  // the far plateau, the great conch shells, the Tide Gate — and the whale
  {
    const W = C.whale;
    const y = C.plateau.y;
    const whale = new THREE.Group();
    const skin = M(0x4a6a8a);
    const belly = M(0xd8e0e8);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin);
    body.scale.set(9, 6, 22);
    body.position.y = 6;
    const under = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), belly);
    under.scale.set(8, 4, 20);
    under.position.y = 4.6;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(4, 10, 8), skin);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 6, -26);
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 5), skin);
    fluke.position.set(0, 6, -31);
    for (const sx of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 3), skin);
      fin.position.set(sx * 10, 3.4, 6);
      fin.rotation.z = sx * -0.4;
      const eyeLid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 1.6), M(0x1a2a3a));
      eyeLid.position.set(sx * 8.6, 7, 14);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), M(0xffffff));
      eye.position.set(sx * 8.5, 7, 14);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), M(0x101820));
      pupil.position.set(sx * 9.1, 7, 14.3);
      eye.visible = pupil.visible = false;
      whale.add(fin, eyeLid, eye, pupil);
      (whale.userData.eyes ||= []).push(eye, pupil);
      (whale.userData.lids ||= []).push(eyeLid);
    }
    for (let k = 0; k < 14; k++) {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 6), M(0xc8c0b0));
      b.position.set((hash(k, 171) - 0.5) * 12, 6 + 5.6 * Math.sqrt(1 - ((hash(k, 171) - 0.5) * 2) ** 2 * 0.5), (hash(k, 172) - 0.5) * 30);
      whale.add(b);
    }
    whale.add(body, under, tail, fluke);
    whale.position.set(W.x, y, W.z);
    G.add(whale);
    Z.whale = whale;
    Z.colliders.push({ x: W.x, z: W.z + 10, r: 10, top: y + 11 }, { x: W.x, z: W.z - 8, r: 9, top: y + 11 });
    // the Tide Gate behind him (blocked, dark — until he moves)
    const gate = new THREE.Group();
    for (const sx of [-12, 12]) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 26, 8), M(0x8aa0b0));
      pil.position.set(sx, 13, 0);
      gate.add(pil);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(12, 1.4, 8, 24, Math.PI), M(0x8aa0b0));
    arch.position.y = 26;
    const light = new THREE.Mesh(new THREE.PlaneGeometry(22, 30), new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    light.position.y = 15;
    gate.add(arch, light);
    gate.position.set(W.x, y, W.z - 40);
    G.add(gate);
    Z.gateLight = light;
    // the three great conch shells
    Z.conchs = C.conchs.map((c) => {
      const g = new THREE.Group();
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 1.6, 8), M(0x6a7a8a));
      rock.position.y = 0.8;
      const shell = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 10), M(0xffd8c8));
      shell.rotation.z = Math.PI / 2.4;
      shell.position.y = 2.2;
      const halo = glow(0xffe0d0, 4, 0.5);
      halo.position.y = 2.2;
      g.add(rock, shell, halo);
      g.position.set(c.x, y + Math.sin(c.x * 0.08) * 0.6, c.z);
      G.add(g);
      Z.colliders.push({ x: c.x, z: c.z, r: 2 });
      return { halo };
    });
  }
  // little fish darting about
  const fishCols = [0xffc040, 0x40c8ff, 0xff6a8a, 0xa0ff80];
  for (let k = 0; k < 30; k++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 5), M(fishCols[k % 4]));
    f.rotation.z = Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(f);
    G.add(holder);
    const cx = (hash(k, 181) - 0.5) * 120, cz = (hash(k, 182) - 0.5) * 120 + 20, r = 4 + hash(k, 183) * 8, sp = 0.4 + hash(k, 184) * 0.6, yy = 2 + hash(k, 185) * 8;
    live.push((t) => {
      const a = t * sp + k;
      holder.position.set(cx + Math.cos(a) * r, yy + Math.sin(t * 2 + k) * 0.4, cz + Math.sin(a) * r);
      holder.rotation.y = -a;
    });
  }
  // the way home: a bubble gate up to Reedmere
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.3, 8, 24), new THREE.MeshStandardMaterial({ color: 0xbff0ff, emissive: 0x6ac8e8, emissiveIntensity: 0.5 }));
    ring.position.set(C.arrive.x, 2.6, C.arrive.z + 4);
    G.add(ring, (() => { const h = glow(0xbff0ff, 7, 0.6); h.position.copy(ring.position); return h; })());
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  ⚙️ THE CLOCKWORK MOUNTAIN — Phase 28. Inside a hollow mountain of
//  brass and steam stands the Great Season Clock. Its four golden gears
//  were shaken loose — one waits at the end of each challenge:
//    east  — the great rotating PLANK (ride it round, leap to the ledge)
//    west  — three rising-and-falling steam PISTONS
//    north — SLIDERS over a bottomless chasm
//    tower — a spiral STAIRCASE of spinning gears up to the balcony
//  The moving platforms are worked out from the clock (CLOCK.now()), so
//  the floor under your feet moves with them.
// ======================================================================
export const CLOCK = {
  arrive: { x: 0, z: 52 },
  lift: { x: 7, z: 52 },
  tower: { x: 0, z: 0, r: 7 },
  door: { x: 0, z: 8.6 },
  plank: { x: 30, z: 8, half: 7.5, w: 1.25, y: 2.2, spin: 0.45 },
  plankStep: { x: 21.2, z: 8, r: 1.4, y: 1.0 },
  plankLedge: { x: 30, z: -3.5, r: 2.4, y: 3.0 },
  pistons: [
    { x: -22, z: 8, r: 1.7, ph: 0 },
    { x: -27, z: 13, r: 1.7, ph: 2.1 },
    { x: -32.5, z: 8.5, r: 1.7, ph: 4.2 },
  ],
  pistonLedge: { x: -38.5, z: 3.5, r: 2.4, y: 6.4 },
  chasm: { z0: -20, z1: -36 },
  sliders: [
    { z: -24, half: 1.8, amp: 11, sp: 0.7, ph: 0 },
    { z: -31.2, half: 1.8, amp: 11, sp: 0.62, ph: 1.7 },
  ],
  stairs: [],
  balcony: null,
  gears: [], // (filled below: where each lost gear waits)
  now: () => performance.now() / 1000,
};
{
  const K = CLOCK;
  for (let i = 0; i < 9; i++) {
    const a = (130 + i * 26) * (Math.PI / 180);
    K.stairs.push({ x: Math.cos(a) * 11.5, z: Math.sin(a) * 11.5, r: 1.55, y: 0.8 + i * 0.8 });
  }
  const last = (130 + 9 * 26) * (Math.PI / 180);
  K.balcony = { x: Math.cos(last) * 11.5, z: Math.sin(last) * 11.5, r: 2.4, y: 0.8 + 9 * 0.8 };
  K.gears = [
    { key: "plank", name: "the Gear of Spring", icon: "🌸", x: K.plankLedge.x, z: K.plankLedge.z, y: K.plankLedge.y },
    { key: "piston", name: "the Gear of Summer", icon: "☀️", x: K.pistonLedge.x, z: K.pistonLedge.z, y: K.pistonLedge.y },
    { key: "chasm", name: "the Gear of Autumn", icon: "🍂", x: 0, z: -44, y: 0 },
    { key: "stairs", name: "the Gear of Winter", icon: "❄️", x: K.balcony.x, z: K.balcony.z, y: K.balcony.y },
  ];
}
// where the moving things are, right now
export function clockParts(t = CLOCK.now()) {
  const K = CLOCK;
  return {
    plankAngle: t * K.plank.spin,
    pistons: K.pistons.map((P) => 1 + 2.6 * (1 + Math.sin(t * 1.1 + P.ph))),
    sliders: K.sliders.map((S) => Math.sin(t * S.sp + S.ph) * S.amp),
  };
}
function buildClockwork() {
  const K = CLOCK;
  const Z = baseZone("clockwork", 66);
  Z.spots.arrive = { ...K.arrive };
  Z.clock = K;
  const G = Z.group;
  const live = [];
  const inChasm = (x, z) => z < K.chasm.z0 && z > K.chasm.z1;
  Z.inChasm = inChasm;
  const statics = [K.plankStep, K.plankLedge, K.pistonLedge, ...K.stairs, K.balcony];
  // the floor under (x, z) — given your height y, only floors you could step onto count
  Z.height = (x, z, y) => {
    const P = clockParts();
    let best = inChasm(x, z) ? ABYSS : 0;
    const ok = (top) => y === undefined || top <= y + 0.5;
    for (const s of statics) if (Math.hypot(x - s.x, z - s.z) < s.r && ok(s.y)) best = Math.max(best, s.y);
    // the rotating plank
    const a = P.plankAngle;
    const dx = x - K.plank.x, dz = z - K.plank.z;
    const u = dx * Math.cos(a) - dz * Math.sin(a);
    const v = dx * Math.sin(a) + dz * Math.cos(a);
    if (Math.abs(u) < K.plank.half && Math.abs(v) < K.plank.w && ok(K.plank.y)) best = Math.max(best, K.plank.y);
    K.pistons.forEach((Pn, i) => {
      if (Math.hypot(x - Pn.x, z - Pn.z) < Pn.r && ok(P.pistons[i] + 0.25)) best = Math.max(best, P.pistons[i]);
    });
    K.sliders.forEach((S, i) => {
      if (Math.abs(x - P.sliders[i]) < S.half && Math.abs(z - S.z) < S.half && ok(0)) best = Math.max(best, 0);
    });
    return best;
  };
  const brass = M(0xc8a050, { metalness: 0.5, roughness: 0.35 });
  const darkBrass = M(0x8a6a2a, { metalness: 0.4, roughness: 0.5 });
  const iron = M(0x5a5a62, { metalness: 0.5, roughness: 0.5 });
  const gearMesh = (r, teeth, th, mat) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 24), mat));
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(r * 0.22, th, r * 0.22), mat);
      tooth.position.set(Math.cos(a) * (r + r * 0.09), 0, Math.sin(a) * (r + r * 0.09));
      tooth.rotation.y = -a;
      g.add(tooth);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, th * 1.4, 10), iron);
    g.add(hub);
    return g;
  };
  // the floor: brass plates
  {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(66, 48), M(0x7a6a52));
    floor.rotation.x = -Math.PI / 2;
    G.add(floor);
    for (let k = 0; k < 40; k++) {
      const x = (hash(k, 201) - 0.5) * 100, z = (hash(k, 202) - 0.5) * 100;
      if (inChasm(x, z) || Math.hypot(x, z) < 9) continue;
      const plate = new THREE.Mesh(new THREE.CircleGeometry(1.5 + hash(k, 203) * 2, 8), M(0x8a7a5a));
      plate.rotation.x = -Math.PI / 2;
      plate.position.set(x, 0.02, z);
      G.add(plate);
    }
  }
  // the chasm: a dark slot all the way across, glowing faintly far below
  {
    const w = 140, d = Math.abs(K.chasm.z1 - K.chasm.z0);
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0x0a0604 }));
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(0, 0.04, (K.chasm.z0 + K.chasm.z1) / 2);
    G.add(pit);
    const glowFar = glow(0xff8a30, 30, 0.25);
    glowFar.position.set(0, -4, (K.chasm.z0 + K.chasm.z1) / 2);
    G.add(glowFar);
    for (const zz of [K.chasm.z0, K.chasm.z1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.4), brass);
      edge.position.set(0, 0.15, zz);
      G.add(edge);
    }
  }
  // the mountain walls all round, with great gears turning in them
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(70, 80, 70, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, side: THREE.BackSide, flatShading: true }));
    wall.position.y = 30;
    G.add(wall);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const r = 8 + hash(k, 211) * 8;
      const g = gearMesh(r, 14 + (k % 3) * 4, 1.2, k % 2 ? darkBrass : brass);
      g.rotation.x = Math.PI / 2;
      const holder = new THREE.Group();
      holder.add(g);
      holder.position.set(Math.cos(a) * 67, 14 + hash(k, 212) * 22, Math.sin(a) * 67);
      holder.lookAt(0, holder.position.y, 0);
      G.add(holder);
      live.push((t) => (g.rotation.y = t * (k % 2 ? 0.2 : -0.15)));
    }
    // pipes and steam vents
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 0.2;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 40, 10), k % 2 ? brass : iron);
      pipe.position.set(Math.cos(a) * 60, 20, Math.sin(a) * 60);
      G.add(pipe);
      Z.colliders.push({ x: Math.cos(a) * 60, z: Math.sin(a) * 60, r: 1 });
    }
  }
  // 💨 puffs of steam drifting up from vents
  const puffs = [];
  const vents = [[14, 30], [-16, 28], [24, -12], [-26, -10], [6, -44], [-8, -46], [38, 22], [-40, 20]];
  for (const [vx, vz] of vents) {
    const grate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 10), iron);
    grate.position.set(vx, 0.08, vz);
    G.add(grate);
    for (let i = 0; i < 4; i++) {
      const sp = glow(0xf0f0f0, 3, 0.35);
      sp.position.set(vx, 1 + i * 2, vz);
      G.add(sp);
      puffs.push({ sp, vx, vz, o: i * 2 });
    }
  }
  live.push((t) => {
    for (const P of puffs) {
      const k = ((t * 1.2 + P.o) % 8) / 8;
      P.sp.position.y = 0.5 + k * 9;
      P.sp.scale.setScalar(2 + k * 5);
      P.sp.material.opacity = 0.4 * (1 - k);
    }
  });
  // 🕰️ the Great Season Clock: a tall brass tower with a huge clock face
  {
    const T = K.tower;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(T.r - 0.5, T.r, 30, 16), M(0x9a7a4a));
    tower.position.set(T.x, 15, T.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(T.r + 0.8, 8, 16), brass);
    cap.position.set(T.x, 34, T.z);
    G.add(tower, cap);
    Z.colliders.push({ x: T.x, z: T.z, r: T.r + 0.3 });
    // the clock face
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d");
    g.fillStyle = "#f8f0dc";
    g.beginPath();
    g.arc(128, 128, 124, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#8a6a2a";
    g.lineWidth = 10;
    g.stroke();
    g.fillStyle = "#3a2a1a";
    g.font = "bold 24px Georgia";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const marks = ["🌸", "", "", "☀️", "", "", "🍂", "", "", "❄️", "", ""];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(marks[i] || "•", 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96);
    }
    const face = new THREE.Mesh(new THREE.CircleGeometry(5.2, 40), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
    face.position.set(T.x, 20, T.z + T.r - 0.02);
    G.add(face);
    const hand = (len, w) => {
      const h = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.12), M(0x2a1a0a));
      bar.position.y = len / 2;
      h.add(bar);
      h.position.set(T.x, 20, T.z + T.r + 0.08);
      G.add(h);
      return h;
    };
    Z.hourHand = hand(3, 0.35);
    Z.minHand = hand(4.4, 0.22);
    Z.hourHand.rotation.z = 2.3;
    Z.minHand.rotation.z = -0.9;
    // the pendulum (still, until the clock is fixed)
    const pend = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6, 0.15), brass);
    rod.position.y = -3;
    const bob = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 20), brass);
    bob.rotation.x = Math.PI / 2;
    bob.position.y = -6.2;
    pend.add(rod, bob);
    pend.position.set(T.x, 15, T.z + T.r + 0.4);
    G.add(pend);
    Z.pendulum = pend;
    // the door, with four empty gear slots round it
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(T.x, 1.8, T.z + T.r + 0.03);
    G.add(door);
    Z.slots = [];
    for (let i = 0; i < 4; i++) {
      const gm = gearMesh(0.55, 10, 0.15, brass);
      gm.rotation.x = Math.PI / 2;
      gm.position.set(T.x - 2.4 + (i % 2) * 4.8, 2.6 - Math.floor(i / 2) * 1.6, T.z + T.r + 0.1);
      gm.visible = false;
      G.add(gm);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), new THREE.MeshBasicMaterial({ color: 0x2a1a0a }));
      hole.position.copy(gm.position);
      hole.position.z -= 0.04;
      G.add(hole);
      Z.slots.push(gm);
    }
  }
  // ⚙️ the rotating plank (east)
  {
    const P = K.plank;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(K.plankStep.r, K.plankStep.r, K.plankStep.y, 12), darkBrass);
    step.position.set(K.plankStep.x, K.plankStep.y / 2, K.plankStep.z);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, P.y, 12), iron);
    hub.position.set(P.x, P.y / 2, P.z);
    const plank = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(P.half * 2, 0.35, P.w * 2), brass);
    board.position.y = P.y - 0.17;
    plank.add(board);
    for (const sx of [-1, 1]) {
      const g = gearMesh(0.9, 10, 0.4, darkBrass);
      g.position.set(sx * (P.half - 0.9), P.y + 0.05, 0);
      plank.add(g);
    }
    plank.position.set(P.x, 0, P.z);
    const ledge = new THREE.Mesh(new THREE.CylinderGeometry(K.plankLedge.r, K.plankLedge.r * 0.8, K.plankLedge.y, 12), darkBrass);
    ledge.position.set(K.plankLedge.x, K.plankLedge.y / 2, K.plankLedge.z);
    G.add(step, hub, plank, ledge);
    Z.plank = plank;
    Z.colliders.push(
      { x: K.plankStep.x, z: K.plankStep.z, r: K.plankStep.r, top: K.plankStep.y - 0.3 },
      { x: K.plankLedge.x, z: K.plankLedge.z, r: K.plankLedge.r, top: K.plankLedge.y - 0.3 },
      { x: P.x, z: P.z, r: 1.5, top: P.y - 0.3 }
    );
  }
  // 💨 the pistons (west)
  Z.pistonCols = [];
  Z.pistons = K.pistons.map((P) => {
    const col = { x: P.x, z: P.z, r: P.r + 0.1, top: 1 };
    Z.colliders.push(col);
    Z.pistonCols.push(col);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(P.r + 0.3, P.r + 0.3, 0.6, 14), iron);
    base.position.set(P.x, 0.3, P.z);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), M(0xd8d8e0, { metalness: 0.7, roughness: 0.2 }));
    const top = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r, 0.4, 14), brass);
    G.add(base, rod, top);
    return { P, rod, top };
  });
  {
    const L = K.pistonLedge;
    const ledge = new THREE.Mesh(new THREE.CylinderGeometry(L.r, L.r * 0.8, L.y, 12), darkBrass);
    ledge.position.set(L.x, L.y / 2, L.z);
    G.add(ledge);
    Z.colliders.push({ x: L.x, z: L.z, r: L.r, top: L.y - 0.3 });
  }
  // 🕳️ the sliders (north, over the chasm)
  Z.sliders = K.sliders.map((S) => {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(S.half * 2, 0.4, S.half * 2), brass);
    plate.position.y = -0.2;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(S.amp * 2 + 4, 0.15, 0.2), iron);
    rail.position.y = -0.6;
    g.add(plate);
    G.add(g);
    const r2 = rail.clone();
    r2.position.set(0, -0.6, S.z);
    G.add(r2);
    return { S, g };
  });
  // 🌀 the spiral gear staircase round the tower
  Z.stairGears = K.stairs.map((S, i) => {
    const g = gearMesh(S.r, 12, 0.35, i % 2 ? brass : darkBrass);
    g.position.set(S.x, S.y - 0.17, S.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, S.y, 6), iron);
    post.position.set(S.x, S.y / 2 - 0.3, S.z);
    G.add(g, post);
    Z.colliders.push({ x: S.x, z: S.z, r: S.r, top: S.y - 0.3 });
    live.push((t) => (g.rotation.y = t * (i % 2 ? 0.5 : -0.5)));
    return g;
  });
  {
    const B = K.balcony;
    const bal = new THREE.Mesh(new THREE.CylinderGeometry(B.r, B.r * 0.7, 0.6, 14), brass);
    bal.position.set(B.x, B.y - 0.3, B.z);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(B.r, 0.06, 6, 24), iron);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(B.x, B.y + 0.9, B.z);
    G.add(bal, rail);
    Z.colliders.push({ x: B.x, z: B.z, r: B.r, top: B.y - 0.3 });
  }
  // the four lost golden gears, glowing where they fell
  Z.lostGears = K.gears.map((Gr) => {
    const g = gearMesh(0.55, 10, 0.18, M(0xffd040, { emissive: 0x8a6a00, emissiveIntensity: 0.6 }));
    g.rotation.x = Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(g, glow(0xffe080, 4, 0.7));
    holder.position.set(Gr.x, Gr.y + 1.1, Gr.z);
    G.add(holder);
    live.push((t) => {
      holder.rotation.y = t * 1.5;
      holder.position.y = Gr.y + 1.1 + Math.sin(t * 2) * 0.12;
    });
    return holder;
  });
  // the way out: a brass lift-cage back to the forest
  {
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.4, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xc8a050, wireframe: true }));
    cage.position.set(K.lift.x, 1.7, K.lift.z);
    Z.colliders.push({ x: K.lift.x, z: K.lift.z, r: 1.7 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2, 1.2, 10), brass);
    roof.position.set(K.lift.x, 4, K.lift.z);
    G.add(cage, roof, (() => { const h = glow(0xffd890, 4, 0.6); h.position.set(K.lift.x, 2.4, K.lift.z); return h; })());
  }
  // warm brass lamps round the plaza
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.3;
    const x = Math.cos(a) * 18, z = Math.sin(a) * 18;
    if (inChasm(x, z) || K.stairs.some((s2) => Math.hypot(x - s2.x, z - s2.z) < 3)) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.6, 6), iron);
    post.position.set(x, 1.8, z);
    const lamp = glow(0xffc870, 4.5, 0.95);
    lamp.position.set(x, 3.8, z);
    G.add(post, lamp);
    Z.colliders.push({ x, z, r: 0.35 });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
    const P = clockParts();
    Z.plank.rotation.y = -P.plankAngle;
    Z.pistons.forEach((x, i) => {
      const h = P.pistons[i];
      Z.pistonCols[i].top = h - 0.3;
      x.top.position.set(x.P.x, h - 0.2, x.P.z);
      x.rod.scale.y = h;
      x.rod.position.set(x.P.x, h / 2, x.P.z);
    });
    Z.sliders.forEach((x, i) => x.g.position.set(P.sliders[i], 0, x.S.z));
    if (Z.running) {
      Z.pendulum.rotation.z = Math.sin(t * 2.2) * 0.4;
      Z.minHand.rotation.z = -t * 0.6;
      Z.hourHand.rotation.z = -t * 0.05;
    }
  };
  return Z;
}

// ======================================================================
//  🌑 SHADOWMERE — Phase 29. A dim, misty marsh of black pools and
//  leafless trees, where the shadows live. A trail of faint, cold
//  footprints winds through the fog to a hollow at the heart of the marsh
//  — where Umbra sits shivering among every light it took.
// ======================================================================
export const SHADOW = {
  arrive: { x: 0, z: 78 },
  hollow: { x: 0, z: -46, r: 9 },
  trail: [],
};
{
  // the footprints: a winding path from the edge of the marsh to the hollow
  for (let i = 0; i < 40; i++) {
    const k = i / 39;
    const z = 74 - k * 112;
    const x = Math.sin(k * 7) * 26 * (1 - k * 0.7);
    SHADOW.trail.push({ x: x + (i % 2 ? 0.45 : -0.45), z });
  }
}
function buildShadowmere() {
  const S0 = SHADOW;
  const Z = baseZone("shadowmere", 95);
  Z.spots.arrive = { ...S0.arrive };
  Z.shadow = S0;
  const G = Z.group;
  const live = [];
  Z.height = (x, z) => {
    const d = Math.hypot(x - S0.hollow.x, z - S0.hollow.z);
    const dip = d < S0.hollow.r ? -1.2 * (1 - (d / S0.hollow.r) ** 2) : 0;
    return Math.sin(x * 0.09) * Math.cos(z * 0.08) * 0.6 + dip;
  };
  // the boggy ground
  {
    const geo = new THREE.PlaneGeometry(220, 220, 70, 70);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Z.height(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    G.add(new THREE.Mesh(geo, M(0x2a2a34)));
  }
  // black mirror pools (they're shallow — you can splash through)
  for (let k = 0; k < 14; k++) {
    const x = (hash(k, 301) - 0.5) * 150, z = (hash(k, 302) - 0.5) * 150;
    if (Math.hypot(x - S0.hollow.x, z - S0.hollow.z) < 16 || S0.trail.some((t) => Math.hypot(t.x - x, t.z - z) < 7)) continue;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3 + hash(k, 303) * 6, 20), new THREE.MeshStandardMaterial({ color: 0x14141e, roughness: 0.05, metalness: 0.6 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, Z.height(x, z) + 0.05, z);
    G.add(pool);
  }
  // leafless, twisted trees
  const bark = M(0x1a1a22);
  for (let k = 0; k < 60; k++) {
    const x = (hash(k, 311) - 0.5) * 180, z = (hash(k, 312) - 0.5) * 180;
    if (Math.hypot(x - S0.hollow.x, z - S0.hollow.z) < 14 || Math.hypot(x - S0.arrive.x, z - S0.arrive.z) < 8 || S0.trail.some((t) => Math.hypot(t.x - x, t.z - z) < 4)) continue;
    const g = new THREE.Group();
    const h = 6 + hash(k, 313) * 8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, h, 6), bark);
    trunk.position.y = h / 2;
    trunk.rotation.z = (hash(k, 314) - 0.5) * 0.3;
    g.add(trunk);
    for (let b = 0; b < 4; b++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 3, 5), bark);
      br.position.set(0, h * (0.55 + b * 0.1), 0);
      br.rotation.set(0, b * 1.6, 0.9 + hash(k, 315 + b) * 0.5);
      br.translateY(1.4);
      g.add(br);
    }
    g.position.set(x, Z.height(x, z), z);
    G.add(g);
    Z.colliders.push({ x, z, r: 0.6 });
  }
  // drifting shadow-wisps (black, with glowing purple eyes)
  for (let k = 0; k < 16; k++) {
    const w = makeWisp(0.8);
    G.add(w);
    const cx = (hash(k, 321) - 0.5) * 140, cz = (hash(k, 322) - 0.5) * 140;
    live.push((t) => w.position.set(cx + Math.sin(t * 0.3 + k) * 6, 1.5 + Math.sin(t * 0.8 + k * 2) * 0.6, cz + Math.cos(t * 0.25 + k) * 6));
  }
  // low mist hugging the ground
  for (let k = 0; k < 24; k++) {
    const m = glow(0x9a9ab8, 22, 0.12);
    m.position.set((hash(k, 331) - 0.5) * 170, 1, (hash(k, 332) - 0.5) * 170);
    G.add(m);
  }
  // the trail of cold footprints (they glow faintly once you know to look)
  Z.prints = S0.trail.map((t, i) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.28, 8), new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.55 }));
    p.rotation.x = -Math.PI / 2;
    p.scale.set(0.7, 1.2, 1);
    p.position.set(t.x, Z.height(t.x, t.z) + 0.06, t.z);
    G.add(p);
    return p;
  });
  // the hollow: a ring of stones, and every stolen light, piled round Umbra
  {
    const H0 = S0.hollow;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + hash(k, 341) * 0.6, 0), M(0x3a3a46));
      const x = H0.x + Math.cos(a) * (H0.r + 1), z = H0.z + Math.sin(a) * (H0.r + 1);
      st.position.set(x, Z.height(x, z) + 0.4, z);
      G.add(st);
    }
    Z.lights = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + 0.3;
      const x = H0.x + Math.cos(a) * 4.6, z = H0.z + Math.sin(a) * 4.6;
      const g = new THREE.Group();
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.5 }));
      jar.position.y = 0.35;
      const lightG = glow([0xffd870, 0xffb050, 0xfff0b0][k % 3], 2.4, 0.95);
      lightG.position.y = 0.45;
      g.add(jar, lightG);
      g.position.set(x, Z.height(x, z), z);
      G.add(g);
      Z.lights.push({ g, lightG });
      live.push((t) => (lightG.material.opacity = 0.7 + Math.sin(t * 3 + k) * 0.25));
    }
  }
  // 🌑 Umbra: a soft shadow-creature with big glowing eyes, shivering
  {
    const H0 = S0.hollow;
    const u = new THREE.Group();
    const dark = new THREE.MeshBasicMaterial({ color: 0x0a0a14, transparent: true, opacity: 0.88 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 18, 14), dark);
    body.scale.set(1, 1.15, 0.9);
    body.position.y = 1.2;
    u.add(body);
    const tendrils = [];
    for (let k = 0; k < 7; k++) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.2, 6), dark);
      const a = (k / 7) * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.9, 0.3, Math.sin(a) * 0.9);
      t.rotation.set(Math.PI, 0, 0);
      u.add(t);
      tendrils.push(t);
    }
    for (const sx of [-0.42, 0.42]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshBasicMaterial({ color: 0xe8f0ff }));
      eye.scale.set(1, 1.3, 0.5);
      eye.position.set(sx, 1.55, 1.05);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a5aa8 }));
      pupil.position.set(sx, 1.5, 1.18);
      u.add(eye, pupil);
    }
    u.add((() => { const h = glow(0x3a3a6a, 7, 0.5); h.position.y = 1.2; return h; })());
    u.position.set(H0.x, Z.height(H0.x, H0.z), H0.z);
    G.add(u);
    Z.umbra = u;
    Z.umbraWarm = false;
    live.push((t) => {
      const shiver = Z.umbraWarm ? 0 : Math.sin(t * 40) * 0.035;
      body.position.x = shiver;
      body.scale.y = 1.15 + Math.sin(t * 1.5) * 0.04;
      tendrils.forEach((tt, k) => (tt.rotation.z = Math.sin(t * 2 + k) * 0.25));
    });
    Z.colliders.push({ x: H0.x, z: H0.z, r: 1.8 });
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🔍 SECRET ROOMS — the hidden places you find by looking closely.
//  One builder, six looks. Each room has a way out (E at the door) and a
//  treasure chest in the middle (secrets.js handles both).
// ======================================================================
export const SECRET_ROOMS = {
  readingroom: { r: 9, floor: 0x7a5232, wall: 0x6a3a2a, light: 0xffd890, props: "books" },
  attic: { r: 8, floor: 0x8a6a4a, wall: 0x6a5240, light: 0xffe0b0, props: "attic" },
  rootchamber: { r: 10, floor: 0x5a4030, wall: 0x4a3424, light: 0x9fe8a0, props: "roots" },
  basement: { r: 8, floor: 0x6a6a72, wall: 0x5a5a62, light: 0xffd080, props: "basement" },
  icecave: { r: 11, floor: 0xd8ecff, wall: 0x9fc8e8, light: 0xbfe8ff, props: "ice" },
  lostvillage: { r: 26, floor: 0x7a8a6a, wall: null, light: 0xdde4ff, props: "village" },
  crystalgrotto: { r: 12, floor: 0x2a2440, wall: 0x3a2a5a, light: 0xd8b8ff, props: "ice" }, // (💎 opened by Crystal Music)
  smugglers: { r: 12, floor: 0x4a3a2a, wall: 0x3a2a1a, light: 0xffb860, place: "hoard" }, // (🗺️🗝️ the smuggler's map + the skeleton key)
};
// 🗝️ the nineteen Even More Secret Places (secretPlaces.js)
for (const p of PLACES) {
  SECRET_ROOMS[p.room] = { r: p.theme.r, floor: p.theme.floor, wall: p.theme.wall, light: p.theme.light, place: p.theme.deco };
  ZONE_INFO[p.room] = { name: p.name, sub: "a secret place", icon: p.icon, zone: true };
}
function buildSecretRoom(id) {
  const D = SECRET_ROOMS[id];
  const Z = baseZone(id, D.r - 0.6);
  Z.spots.arrive = { x: 0, z: D.r - 2.2 };
  Z.door = { x: 0, z: D.r - 0.8 };
  Z.chestAt = { x: 0, z: -D.r * 0.35 };
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(D.r + 0.3, 32), M(D.floor));
  floor.rotation.x = -Math.PI / 2;
  G.add(floor);
  if (D.wall !== null) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(D.r + 0.3, D.r + 0.3, 6, 32, 1, true), new THREE.MeshStandardMaterial({ color: D.wall, side: THREE.BackSide, flatShading: true }));
    wall.position.y = 3;
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(D.r + 0.3, 32), M(0x3a2a1a));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 6;
    G.add(wall, ceil);
  }
  // the way back out: a dark doorway
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 1.3, D.r + 0.25);
  door.rotation.y = Math.PI;
  G.add(door);
  // a warm light, hanging in the middle
  const lamp = glow(D.light, 9, 0.6);
  lamp.position.set(0, 4.5, 0);
  G.add(lamp);
  // the treasure chest
  {
    const C = Z.chestAt;
    const chest = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.1), M(0x6a4422));
    box.position.y = 0.45;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 1.2), M(0xc8a040));
    lid.position.y = 1.05;
    chest.add(box, lid, (() => { const h = glow(0xffd860, 4, 0.55); h.position.y = 1.2; return h; })());
    chest.position.set(C.x, 0, C.z);
    G.add(chest);
    Z.chestLid = lid;
    Z.colliders.push({ x: C.x, z: C.z, r: 1 });
  }
  const ring = (n, rad, fn) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.4;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.5) continue; // (keep the doorway clear)
      fn(Math.cos(a) * rad, Math.sin(a) * rad, a, k);
    }
  };
  if (D.props === "books") {
    // tall shelves of books all round, a reading chair and a rug
    ring(10, D.r - 0.7, (x, z, a, k) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.4, 0.6), M(0x5a3420));
      shelf.position.set(x, 2.2, z);
      shelf.rotation.y = -a + Math.PI / 2;
      G.add(shelf);
      for (let r2 = 0; r2 < 4; r2++) for (let b = 0; b < 6; b++) {
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.45), M([0xa83a3a, 0x3a6aa8, 0x3a8a4a, 0xc8a040, 0x8a4aa8][(k + r2 + b) % 5]));
        book.position.set(-0.8 + b * 0.32, 0.6 + r2 * 1.05 - 2.2, 0.1);
        shelf.add(book);
      }
    });
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3, 24), M(0xa83a4a));
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.02;
    G.add(rug);
  } else if (D.props === "attic") {
    // sloped beams, dusty trunks, a rocking horse, cobwebs
    for (let k = -3; k <= 3; k++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, D.r * 2), M(0x5a3e24));
      beam.position.set(k * 2.2, 5.2, 0);
      G.add(beam);
    }
    ring(7, D.r - 1.5, (x, z, a, k) => {
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), M([0x7a4a2a, 0x5a6a8a, 0x8a3a3a][k % 3]));
      trunk.position.set(x, 0.45, z);
      trunk.rotation.y = a;
      G.add(trunk);
      Z.colliders.push({ x, z, r: 0.9 });
    });
    const dust = [];
    for (let k = 0; k < 30; k++) {
      const d = glow(0xfff0d0, 0.25, 0.6);
      d.position.set((Math.random() - 0.5) * 10, 1 + Math.random() * 4, (Math.random() - 0.5) * 10);
      G.add(d);
      dust.push(d);
    }
    live.push((t) => dust.forEach((d, i) => (d.position.y = 1 + ((t * 0.1 + i * 0.37) % 4))));
  } else if (D.props === "roots") {
    // great roots arching overhead, glowing moss and mushrooms
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.TorusGeometry(D.r * 0.7, 0.45, 6, 16, Math.PI), M(0x5a3e24));
      root.rotation.y = a;
      root.position.y = 0;
      G.add(root);
    }
    for (let k = 0; k < 20; k++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * (D.r - 4);
      const m = glow([0x9fe8a0, 0x7ad8ff, 0xffd8a0][k % 3], 1, 0.9);
      m.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r);
      G.add(m);
    }
  } else if (D.props === "basement") {
    // old school desks, a dusty blackboard, a forgotten bell
    for (let k = 0; k < 6; k++) {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.8), M(0x8a6a42));
      const x = -3 + (k % 3) * 3, z = 1.6 + Math.floor(k / 3) * 2.2;
      desk.position.set(x, 0.4, z);
      G.add(desk);
      Z.colliders.push({ x, z, r: 0.8 });
    }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), M(0x2a3a2a));
    board.position.set(0, 2.4, -D.r + 0.2);
    G.add(board);
  } else if (D.props === "ice") {
    // glittering crystals of every size, and a frozen pool
    for (let k = 0; k < 26; k++) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * (D.r - 5);
      const h = 1 + Math.random() * 3;
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.3 + Math.random() * 0.4, h, 6), M([0xbfe8ff, 0xd8c8ff, 0xffffff][k % 3], { emissive: 0x4a7aa8, emissiveIntensity: 0.25 }));
      c.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      G.add(c);
      if (r > 5) Z.colliders.push({ x: c.position.x, z: c.position.z, r: 0.4 });
    }
    const sparkles = [];
    for (let k = 0; k < 24; k++) {
      const sp = glow(0xffffff, 0.5, 0.9);
      sp.position.set((Math.random() - 0.5) * 18, Math.random() * 5, (Math.random() - 0.5) * 18);
      G.add(sp);
      sparkles.push(sp);
    }
    live.push((t) => sparkles.forEach((sp, i) => (sp.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i)))));
  } else if (D.place) {
    decorPlace(D.place, G, D.r, Z, live);
  } else if (D.props === "village") {
    // a forgotten village, half in the mist: old cottages, a well, lanterns
    ring(9, D.r * 0.62, (x, z, a, k) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 2.6, 10), M(0xc8c0b0));
      body.position.y = 1.3;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2, 10), M([0x6a5a7a, 0x5a6a7a, 0x7a6a5a][k % 3]));
      roof.position.y = 3.6;
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
      win.position.set(0, 1.5, 2.15);
      g.add(body, roof, win);
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      G.add(g);
      Z.colliders.push({ x, z, r: 2.4 });
    });
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 1, 12, 1, true), M(0x8a8a90, { side: THREE.DoubleSide }));
    well.position.set(6, 0.5, 4);
    G.add(well);
    Z.colliders.push({ x: 6, z: 4, r: 1.2 });
    for (let k = 0; k < 30; k++) {
      const m = glow(0xdde4ff, 14, 0.12);
      m.position.set((Math.random() - 0.5) * 50, 1.5, (Math.random() - 0.5) * 50);
      G.add(m);
    }
  }
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}

// ======================================================================
//  🏰 YOUR CASTLE'S GREAT HALL — inside the Keep on Castle Hill: a red
//  carpet to your throne, banners, chandeliers, tall windows, a roaring
//  fireplace and a royal feast table. Two guards at the door.
// ======================================================================
export const HALL = { w: 13, l: 34, door: { x: 0, z: 16 }, throne: { x: 0, z: -14 }, fire: { x: -12, z: -2 }, feast: { x: 6.5, z: 0 } };
function buildCastleHall() {
  const T = HALL;
  const Z = baseZone("castlehall", 40);
  Z.spots.arrive = { x: T.door.x, z: T.door.z - 2.5 };
  const G = Z.group;
  const live = [];
  Z.height = () => 0;
  const baseC = Z.constrain;
  Z.constrain = (p) => {
    baseC(p);
    p.x = Math.max(-T.w + 0.8, Math.min(T.w - 0.8, p.x));
    p.z = Math.max(-T.l / 2 + 0.8, Math.min(T.l / 2 - 0.8, p.z));
  };
  const stone = M(0xb8b0a0);
  const darkStone = M(0x8a8478);
  // floor: big stone flags, and the long red carpet
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(T.w * 2, T.l), M(0x9a9488));
  floor.rotation.x = -Math.PI / 2;
  G.add(floor);
  for (let i = -6; i <= 6; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(T.w * 2, 0.06), M(0x7a7468));
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.01, i * 2.6);
    G.add(line);
  }
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, T.l - 3), M(0xb8202e));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 1);
  G.add(carpet);
  for (const sx of [-1.75, 1.75]) {
    const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.2, T.l - 3), M(0xf0c040));
    trim.rotation.x = -Math.PI / 2;
    trim.position.set(sx, 0.025, 1);
    G.add(trim);
  }
  // walls, with tall arched windows
  for (const [w, x, z, ry] of [[T.w * 2, 0, -T.l / 2, 0], [T.w * 2, 0, T.l / 2, Math.PI], [T.l, -T.w, 0, Math.PI / 2], [T.l, T.w, 0, -Math.PI / 2]]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, 12), new THREE.MeshStandardMaterial({ color: 0xb8b0a0, side: THREE.DoubleSide, flatShading: true }));
    wall.position.set(x, 6, z);
    wall.rotation.y = ry;
    G.add(wall);
  }
  for (let k = -2; k <= 2; k++) {
    for (const sx of [-1, 1]) {
      if (sx < 0 && k === 0) continue; // (the fireplace is here)
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), new THREE.MeshBasicMaterial({ color: 0x8ac8f0 }));
      win.position.set(sx * (T.w - 0.05), 5.5, k * 6.5);
      win.rotation.y = -sx * Math.PI / 2;
      const arch = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8ac8f0 }));
      arch.position.set(sx * (T.w - 0.05), 8, k * 6.5);
      arch.rotation.y = -sx * Math.PI / 2;
      const sun = glow(0xfff0c0, 4, 0.35);
      sun.position.set(sx * (T.w - 0.4), 6, k * 6.5);
      G.add(win, arch, sun);
      // a banner between the windows
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.6), M([0xb8202e, 0x2a4a9a, 0xf0c040][(k + 3) % 3]));
      ban.position.set(sx * (T.w - 0.08), 6.5, k * 6.5 + 3.25);
      ban.rotation.y = -sx * Math.PI / 2;
      const crest = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), M(0xf8f0d8));
      crest.position.set(sx * (T.w - 0.1), 7, k * 6.5 + 3.25);
      crest.rotation.y = -sx * Math.PI / 2;
      G.add(ban, crest);
    }
  }
  // pillars down both sides
  for (let k = -3; k <= 3; k++) for (const sx of [-1, 1]) {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 12, 10), stone);
    pil.position.set(sx * 5.5, 6, k * 4.6);
    G.add(pil);
    Z.colliders.push({ x: sx * 5.5, z: k * 4.6, r: 0.95 });
  }
  // chandeliers
  for (let k = -2; k <= 2; k++) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 6, 20), M(0x3a3a3a));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    for (let i = 0; i < 8; i++) {
      const c = glow(0xffd890, 1.5, 0.95);
      c.position.set(Math.cos(i * 0.785) * 1.5, 0.35, Math.sin(i * 0.785) * 1.5);
      g.add(c);
    }
    g.add(glow(0xffe0a0, 9, 0.35));
    g.position.set(0, 9.5, k * 6.5);
    G.add(g);
    live.push((t) => (g.rotation.y = t * 0.08));
  }
  // 👑 the throne, up on a dais
  {
    const R0 = T.throne;
    const dais = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 4), darkStone);
    dais.position.set(R0.x, 0.25, R0.z);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.6), M(0xb8202e));
    seat.position.set(R0.x, 1.05, R0.z);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.4), M(0xd8a830, { metalness: 0.4, roughness: 0.35 }));
    back.position.set(R0.x, 2.4, R0.z - 0.7);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 5), M(0xf0c040, { metalness: 0.5 }));
    top.position.set(R0.x, 4.4, R0.z - 0.7);
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.2), M(0xb8202e));
    cushion.position.set(R0.x, 2.2, R0.z - 0.48);
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 1.6), M(0xd8a830, { metalness: 0.4 }));
      arm.position.set(R0.x + sx * 0.95, 1.5, R0.z);
      G.add(arm);
    }
    G.add(dais, seat, back, top, cushion, (() => { const h = glow(0xffe8a0, 5, 0.4); h.position.set(R0.x, 3, R0.z - 0.5); return h; })());
  }
  // 🔥 the great fireplace
  {
    const F = T.fire;
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5, 5), darkStone);
    hearth.position.set(-T.w + 0.7, 2.5, F.z);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), new THREE.MeshBasicMaterial({ color: 0x1a0a04 }));
    hole.position.set(-T.w + 1.42, 1.3, F.z);
    hole.rotation.y = Math.PI / 2;
    G.add(hearth, hole);
    const flames = [];
    for (let k = 0; k < 5; k++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 6), new THREE.MeshBasicMaterial({ color: [0xff6a20, 0xffa030, 0xffe060][k % 3] }));
      f.position.set(-T.w + 1.5, 0.6, F.z - 0.9 + k * 0.45);
      G.add(f);
      flames.push(f);
    }
    const warmth = glow(0xff9a40, 8, 0.6);
    warmth.position.set(-T.w + 2, 1.3, F.z);
    G.add(warmth);
    live.push((t) => {
      flames.forEach((f, k) => (f.scale.y = 1 + Math.sin(t * 9 + k * 1.7) * 0.35));
      warmth.material.opacity = 0.5 + Math.sin(t * 6) * 0.12;
    });
    Z.colliders.push({ x: -T.w + 0.7, z: F.z, r: 1.2 });
  }
  // 🍗 the royal feast table
  {
    const Fz = T.feast;
    const table = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 12), M(0x7a4a2a));
    table.position.set(Fz.x + 2.5, 0.5, Fz.z);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.1, 12.1), M(0xf8f0d8));
    cloth.position.set(Fz.x + 2.5, 1.02, Fz.z);
    G.add(table, cloth);
    const foods = [0xd8a058, 0xd83a3a, 0xf0c040, 0x8ac840, 0xf4f0e8];
    for (let k = 0; k < 10; k++) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12), M(0xffffff));
      plate.position.set(Fz.x + 2.5 + (k % 2 ? 0.7 : -0.7), 1.1, Fz.z - 5 + k * 1.1);
      const food = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), M(foods[k % 5]));
      food.position.set(plate.position.x, 1.3, plate.position.z);
      G.add(plate, food);
    }
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.7, 14), M(0xf8d8e0));
    cake.position.set(Fz.x + 2.5, 1.45, Fz.z);
    G.add(cake);
    for (let k = 0; k < 2; k++) Z.colliders.push({ x: Fz.x + 2.5, z: Fz.z - 3 + k * 6, r: 1.8 });
  }
  // two royal guards at the door
  for (const sx of [-2.4, 2.4]) {
    const gd = buildThistle({ tunicColor: 0xb8202e, hoodColor: 0x2a2a2a, pack: false });
    gd.scale.setScalar(1.15);
    gd.position.set(sx, 0, T.door.z - 1);
    gd.rotation.y = Math.PI;
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), M(0x8a6a42));
    spear.position.set(sx + (sx < 0 ? 0.5 : -0.5), 1.2, T.door.z - 1);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), M(0xd8d8e0));
    tip.position.set(spear.position.x, 2.5, T.door.z - 1);
    G.add(gd, spear, tip);
    Z.colliders.push({ x: sx, z: T.door.z - 1, r: 0.6 });
  }
  // the great doors (the way out)
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 2.5, T.l / 2 - 0.05);
  door.rotation.y = Math.PI;
  G.add(door);
  Z.update = (t) => {
    for (const f of live) f(t);
  };
  return Z;
}
