// ============================================================
//  WhiskerWood — THE OUTDOORS 🌿
//  Builds the outside world from the map: a grassy land with the
//  den mound in the middle and all the map landmarks around it.
//  Returns the world group plus a few useful spots for the game.
// ============================================================

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { signBoard, signTexture } from "./signs.js";

// How BIG the outdoors is. Crank this number up for an even bigger world.
// (24 = twice the original wilderness — big enough for real journeys, small
// enough that landmarks stay reachable. The saved layout matches.)
const OUTDOOR_SCALE = 24;
// How far apart the map places things (bigger = longer walks).
const WORLD_SCALE = 55 * OUTDOOR_SCALE;
const LANDMARK_SCALE = 7; // landmarks are giant from a mouse's-eye view
export const MOUND_RADIUS = 3; // the grassy den hill the mouse lives in (mouse-sized)
export const WORLD_RADIUS = 46 * OUTDOOR_SCALE; // how far you can roam before the edge

// Where the den entrance is (just south of the mound) and which way you
// face when you step outside.
export const SPAWN = { x: 0, z: MOUND_RADIUS + 1.4, facing: 0 };
// Where the colossal hero tree stands — and how high the owl nests in it.
export const EVERBOUGH_POS = { x: -140, z: -560 };
export const OWL_NEST_HEIGHT = 58;
// 🕳️ the secret hole between Everbough's roots (set once the tree loads).
// Walk into it to drop into the Moonkeeper tunnels. No map label — on purpose.
export const EVERBOUGH_HOLE = { x: 0, z: 0, out: { x: 0, z: 1 }, ready: false };
// 🎓 handy spots at the Fallen Log School, in the school's LOCAL units
// (add the school's x/z — its layout rot is 0)
export const SCHOOL_SPOTS = {
  seat: [-0.6, 0], // the empty "new student" stump
  board: [-9.6, 0],
  bookcase: [-6.4, -2.6], // the school's little library
  bell: [18.8, -3.4],
  garden: [7, 7],
  bench: [6, -9.6], // the workshop's workbench
  door: [15.5, 1.5], // just outside the east mouth
};
// the school's named folk, filled in when the world is built:
// { key, name, role, mesh, x, z }
export const SCHOOL_NPCS = [];
// 🏕️ the summer campsite — giants' things at the edge of the wild (set by buildOutside)
export const CAMPSITE = { x: 0, z: 0, ready: false };
// 🌙 the heart of Moonstone Hollow (inside the cliff, behind the falls)
export const HOLLOW_CENTER = { x: 0, z: 0 };
// 🚪 the hidden passage: behind the BOTTOM waterfall ↔ the arch inside the Hollow
export const HOLLOW_DOORS = { ready: false };
// the stone steps up to the Moon Door: { w, z0, z1, top } in falls-local units
const MOON_STEPS = [];
/** The top of a Moon Door step under (x, z) — or null if you're not on one.
 *  (One exact, gap-free floor per step, so walking up them is smooth.) */
export function moonStepTop(x, z) {
  if (!MOON_STEPS.length) return null;
  const gdx = x - FALLS_POS.x;
  const gdz = z - FALLS_POS.z;
  const proj = gdx * FALLS_AX + gdz * FALLS_AZ;
  if (proj < 105 || proj > 111) return null;
  const lx = gdx * FALLS_AZ - gdz * FALLS_AX;
  let top = null;
  for (const s of MOON_STEPS) {
    if (proj >= s.z0 && proj <= s.z1 && Math.abs(lx) <= s.w / 2) top = Math.max(top ?? -Infinity, s.top);
  }
  return top;
}
// 🚪 the Moon Door deep in the Hollow (Phase 5 opens it): its meshes + colliders
export const MOON_DOOR = { ready: false };
/** falls-local (lx = across, z = into the cliffs) → world { x, z } */
export function fallsToWorld(lx, z) {
  return { x: FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, z: FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX };
}
// where the creek's plank bridge stands (for test views)
export const CREEK_BRIDGE = { ready: false };
// The Waterfall Gorge at the creek's source (west end), and its cliff axis.
export const FALLS_POS = { x: -306, z: -800 };
const FALLS_LEN = Math.hypot(FALLS_POS.x, FALLS_POS.z);
const FALLS_AX = FALLS_POS.x / FALLS_LEN;
const FALLS_AZ = FALLS_POS.z / FALLS_LEN;
// Hand-sculpted terrain: smooth mounds/dips painted in the editor and saved
// in the world layout as { kind: "bump", x, z, r, h } entries. Set by
// buildOutside before the ground is meshed, so everything lines up.
export let TERRAIN_BUMPS = [];
export function setTerrainBumps(list) {
  TERRAIN_BUMPS = list || [];
}
// Pip's journal waits on a reading rock inside Moonstone Hollow
// (falls-local lx 4.2, z 96 — converted to world coordinates here).
export const JOURNAL_POS = {
  x: FALLS_POS.x + 96 * FALLS_AX + 4.2 * FALLS_AZ,
  z: FALLS_POS.z + 96 * FALLS_AZ - 4.2 * FALLS_AX,
};
// The outlet brook: from the pool's back shore to the creek's western end
// (the creek curve's k=0 point for the default layout — see fillBiomes).
const OUTLET_P0 = { x: FALLS_POS.x + 16, z: FALLS_POS.z + 42 };
const OUTLET_P1 = { x: -380, z: -468 };
const OUTLET_LEN = Math.hypot(OUTLET_P1.x - OUTLET_P0.x, OUTLET_P1.z - OUTLET_P0.z);
const OUTLET_AX = (OUTLET_P1.x - OUTLET_P0.x) / OUTLET_LEN;
const OUTLET_AZ = (OUTLET_P1.z - OUTLET_P0.z) / OUTLET_LEN;
export const DEN_ENTRANCE = { x: 0, z: MOUND_RADIUS - 0.2 };
/** the cottage chimney's smoke puffs (main.js drifts them up) */
export const denSmoke = [];

// Each map place as a position (0..1 across the map) — converted below to
// world coordinates with HOME at the center (0,0).
const HOME = { nx: 0.444, ny: 0.678 };
const PLACES = [
  { name: "Aspen Forest", kind: "aspen", nx: 0.21, ny: 0.15 },
  { name: "Crossable Creek", kind: "creek", nx: 0.5, ny: 0.053 },
  { name: "Old Well", kind: "well", nx: 0.68, ny: 0.34 },
  // (the Human House was removed in canon v2 — humans live at the edges now)
  { name: "Pine Forest", kind: "pine", nx: 0.138, ny: 0.38 },
  { name: "Meadow", kind: "meadow", nx: 0.517, ny: 0.44 },
  { name: "Tall Grass", kind: "tallgrass", nx: 0.875, ny: 0.38 },
  { name: "Fallen Log", kind: "log", nx: 0.151, ny: 0.61 },
  { name: "Berry Bush", kind: "berry", nx: 0.853, ny: 0.615 },
  { name: "Wildflower Patch", kind: "wildflower", nx: 0.75, ny: 0.79 },
  { name: "Berry Bush", kind: "berry", nx: 0.147, ny: 0.822 },
  { name: "Fallen Log School", kind: "school", nx: 0.45, ny: 0.96 },
];

const toWorld = (p) => ({
  x: (p.nx - HOME.nx) * WORLD_SCALE,
  z: (p.ny - HOME.ny) * WORLD_SCALE,
});

// ------------------------------------------------------------
//  ⛰️  TERRAIN — rolling hills you can walk over.
//  We use a tiny hand-rolled "value noise" so the hills are the SAME
//  every time the game loads (no random jumps), and so both the ground
//  mesh and the game code (for standing objects + the mouse) can ask
//  "how high is the ground at (x, z)?" and get the same answer.
// ------------------------------------------------------------
const HILL_HEIGHT = 24; // tallest a hill gets (world units)
const HILL_SCALE = 210; // how spread-out the hills are (bigger = broader)
const FLAT_RADIUS = 30; // keep the ground flat around the den...
const FLAT_BLEND = 60; // ...then blend up into hills over this distance

// Deterministic hash -> a number in [0,1) for a grid corner.
function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
// Smooth (bilinear + smoothstep) value noise, output in [0,1].
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

// The ground height at any world (x, z). Layered noise = natural-looking
// hills, flattened to a gentle bowl around the den so home stays level.
// The ground MESH is a grid (cells ~9 units wide), so steep places like the
// waterfall cliffs are drawn as long slanted triangles — not exactly where
// terrainHeight() says. groundMeshHeight() gives the height of the ground
// as it's actually DRAWN, so things can sit on (or in front of) what you see.
const GROUND_SIZE = WORLD_RADIUS * 1.38 * 2;
const GROUND_SEG = 340;
export function groundMeshHeight(x, z) {
  const c = GROUND_SIZE / GROUND_SEG;
  const h = GROUND_SIZE / 2;
  const fx = (x + h) / c;
  const fz = (z + h) / c;
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const x0 = -h + i * c;
  const z0 = -h + j * c;
  const a = terrainHeight(x0, z0);
  const b = terrainHeight(x0 + c, z0);
  const d = terrainHeight(x0, z0 + c);
  const e = terrainHeight(x0 + c, z0 + c);
  // (the grid's two triangles per cell, split along the same diagonal the mesh uses)
  return u + v <= 1 ? a + (b - a) * u + (d - a) * v : e + (d - e) * (1 - u) + (b - e) * (1 - v);
}
/** the top of the ground — as drawn, or as calculated, whichever is higher (so nothing sinks in) */
export const groundTop = (x, z) => Math.max(terrainHeight(x, z), groundMeshHeight(x, z));

export function terrainHeight(x, z) {
  let h = 0;
  h += valueNoise(x / HILL_SCALE, z / HILL_SCALE) * 1.0;
  h += valueNoise(x / (HILL_SCALE * 0.45) + 5.2, z / (HILL_SCALE * 0.45) + 1.7) * 0.5;
  h += valueNoise(x / (HILL_SCALE * 0.19) + 9.1, z / (HILL_SCALE * 0.19) + 4.3) * 0.22;
  h = (h / 1.72) * HILL_HEIGHT; // normalize, then scale to world units

  // Flatten a disc around the den (origin) so the mound + entrance sit level.
  const d = Math.hypot(x, z);
  let t = (d - FLAT_RADIUS) / FLAT_BLEND;
  t = Math.min(1, Math.max(0, t));
  let out = h * (t * t * (3 - 2 * t));

  // 🏔️ The mountain ring: past the playable meadowland the ground climbs
  // into rocky, snow-capped peaks that wall the whole wilderness in — the
  // Breath-of-the-Wild horizon in every direction. A ridged noise term
  // (sharp creases instead of smooth bumps) makes the peaks properly craggy.
  let m = (d - WORLD_RADIUS * 0.8) / (WORLD_RADIUS * 0.45);
  if (m > 0) {
    m = Math.min(1.35, m);
    const ridge = 0.55 + 0.45 * valueNoise(x / 240 + 3.3, z / 240 + 8.8);
    const crag = 1 - Math.abs(2 * valueNoise(x / 95 + 7.7, z / 95 + 2.2) - 1);
    out += m * m * (330 * ridge + 200 * crag * crag);
  }

  // 💧 The Waterfall Gorge: two stepped cliffs at the creek's source. The
  // face where the water falls is sheer; the sides slope gently, so a brave
  // mouse can CLIMB around and stand at the top of the falls.
  const gdx = x - FALLS_POS.x;
  const gdz = z - FALLS_POS.z;
  if (gdx * gdx + gdz * gdz < 52900) {
    const proj = gdx * FALLS_AX + gdz * FALLS_AZ; // + = into the cliffs
    const lat = Math.abs(-gdx * FALLS_AZ + gdz * FALLS_AX);
    const sm = (a, b, v) => {
      const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const sheer = lat < 22;
    const t1 = sheer ? sm(30, 38, proj) : sm(10, 64, proj);
    const t2 = sheer ? sm(78, 88, proj) : sm(58, 122, proj);
    // the plunge pool: sink the BASE hills into a basin FIRST, then raise
    // the cliffs out of it — so the rock wall climbs straight out of the
    // water and the falls land in the pond, never on a grassy mound
    const poolK = (1 - sm(30, 40, proj)) * (1 - sm(18, 32, lat)) * sm(-34, -22, proj);
    out = out * (1 - poolK * 0.92) + 0.45 * poolK * 0.92;
    // 🌙 Moonstone Hollow: a hidden grotto carved into the upper cliff,
    // BEHIND the highest waterfall — walk the mid terrace, step through
    // the falling curtain, and the glowing hollow opens up. (No label,
    // no path — you find it the way the old books say: by stumbling in.)
    const hollowK = sm(76, 80, proj) * (1 - sm(112, 126, proj)) * (1 - sm(13, 20, lat));
    out += t1 * 22 + t2 * 26 * (1 - hollowK);
  }

  // 🏞️ the outlet brook: a carved channel that carries the pool's water
  // down to the creek's western end — one unbroken waterway, peak to creek
  const obx = x - OUTLET_P0.x;
  const obz = z - OUTLET_P0.z;
  const ou = (obx * OUTLET_AX + obz * OUTLET_AZ) / OUTLET_LEN;
  if (ou > -0.1 && ou < 1.08) {
    const pd = Math.abs(-obx * OUTLET_AZ + obz * OUTLET_AX);
    const smO = (a, b, v) => {
      const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const ch = (1 - smO(7, 16, pd)) * smO(-0.08, 0.0, ou) * (1 - smO(0.98, 1.06, ou));
    if (ch > 0) out = out * (1 - ch * 0.85) + 0.9 * ch * 0.85;
  }
  // ⛰️ the designer's hand-sculpted bumps (editor.html terrain tool)
  for (let i = 0; i < TERRAIN_BUMPS.length; i++) {
    const b = TERRAIN_BUMPS[i];
    const bdx = x - b.x;
    const bdz = z - b.z;
    const q = 1 - (bdx * bdx + bdz * bdz) / (b.r * b.r);
    if (q > 0) out += b.h * q * q;
  }
  return out;
}

// Is this spot open WATER? (plunge pool, outlet brook, falls streams, or
// the creek.) Used to keep grass and flowers from growing out of the drink.
let CREEK_POS = null;
let SCHOOL_POS = null; // no grass grows through the schoolhouse floor
export function isWater(x, z) {
  // the creek's winding ribbon
  if (CREEK_POS) {
    const k = (x - CREEK_POS.x) / 760 + 0.5;
    if (k > -0.01 && k < 1.01) {
      const zc = CREEK_POS.z + Math.sin(k * Math.PI * 4.4) * 42 + Math.sin(k * Math.PI * 1.7 + 1.3) * 26;
      if (Math.abs(z - zc) < 13) return true;
    }
  }
  // the plunge pool and the falls' terrace streams
  const gdx = x - FALLS_POS.x;
  const gdz = z - FALLS_POS.z;
  if (gdx * gdx + gdz * gdz < 52900) {
    const proj = gdx * FALLS_AX + gdz * FALLS_AZ;
    const lat = Math.abs(-gdx * FALLS_AZ + gdz * FALLS_AX);
    if (proj > -32 && proj < 32 && lat < 26) return true; // the pool
    if (proj >= 32 && proj < 81 && lat < 7.5) return true; // the mid-terrace stream
    if (proj >= 81 && proj < 124) return inHollowWater(gdx * FALLS_AZ - gdz * FALLS_AX, proj); // the Hollow
    if (proj >= 124 && proj < 142 && lat < 7.5) return true; // the source brook
  }
  // the outlet brook
  const obx = x - OUTLET_P0.x;
  const obz = z - OUTLET_P0.z;
  const ou = (obx * OUTLET_AX + obz * OUTLET_AZ) / OUTLET_LEN;
  if (ou > -0.06 && ou < 1.03) {
    const pd = Math.abs(-obx * OUTLET_AZ + obz * OUTLET_AX);
    if (pd < 10.5) return true;
  }
  return false;
}

/** Inside Moonstone Hollow (the cave behind the falls)? Nothing grows in
 *  there from the forest outside — no trees, bushes, grass or daisies. */
export function isHollow(x, z) {
  const gdx = x - FALLS_POS.x;
  const gdz = z - FALLS_POS.z;
  const proj = gdx * FALLS_AX + gdz * FALLS_AZ;
  if (proj < 79 || proj > 128) return false;
  return Math.abs(-gdx * FALLS_AZ + gdz * FALLS_AX) < 22;
}

// 🌙 The Hollow's water (falls-local): a small glowing pool at the foot of the
// inner falls (back-left corner), and a narrow brook along the LEFT side down
// to the entrance — the middle of the floor stays dry for exploring.
const HOLLOW_POOL = { lx: -6, z: 110, r: 3.2 };
const hollowBrookX = (z) => -6 + Math.sin(z * 0.35) * 0.6;
function inHollowWater(lx, z) {
  const px = lx - HOLLOW_POOL.lx;
  const pz = z - HOLLOW_POOL.z;
  if (px * px + pz * pz < HOLLOW_POOL.r * HOLLOW_POOL.r) return true;
  return z > 82.5 && z < 108 && Math.abs(lx - hollowBrookX(z)) < 0.9;
}

/**
 * How high the water's SURFACE is at (x, z) — or null if it's dry land.
 * (So the mouse can swim AT the surface instead of walking along the bed.)
 */
export function waterSurfaceAt(x, z) {
  if (!isWater(x, z)) return null;
  const ground = groundTop(x, z); // (the same ground the water's drawn over)
  const gdx = x - FALLS_POS.x;
  const gdz = z - FALLS_POS.z;
  if (gdx * gdx + gdz * gdz < 52900) {
    const proj = gdx * FALLS_AX + gdz * FALLS_AZ;
    const lat = Math.abs(-gdx * FALLS_AZ + gdz * FALLS_AX);
    if (proj > -32 && proj < 32 && lat < 26) {
      // the plunge pool: one level sheet of water
      return Math.max(terrainHeight(FALLS_POS.x, FALLS_POS.z) + 0.9, ground + 0.2);
    }
    // the Hollow's little pool and brook
    if (proj >= 81 && proj < 124) return ground + 0.3;
    // the terrace streams are narrow ribbons — only swim IN the ribbon itself
    if (lat < 2.0) return ground + 0.25;
    return null;
  }
  return ground + 0.28; // the creek and the outlet brook
}

// ------------------------------------------------------------
//  🗺️  BIOMES — the whole wilderness belongs to somebody. Every spot
//  gets a biome by nearest landmark seed (with noise-warped borders so
//  regions interlock organically). Forests are FORESTS, thickets are
//  THICKETS; only the meadowlands stay open.
// ------------------------------------------------------------
let biomeSeeds = [];

function biomeAt(x, z) {
  // warp the lookup point so borders wander like real treelines
  const wx = x + (valueNoise(x / 130 + 31.7, z / 130 + 11.3) - 0.5) * 240;
  const wz = z + (valueNoise(x / 130 - 17.2, z / 130 + 47.9) - 0.5) * 240;
  let best = "meadow";
  let bd = Infinity;
  for (const s of biomeSeeds) {
    const d = (wx - s.x) * (wx - s.x) + (wz - s.z) * (wz - s.z);
    if (d < bd) {
      bd = d;
      best = s.biome;
    }
  }
  return best;
}

// What grows (densely!) in each biome. `collide` = trunk radius per unit of
// instance scale — everything solid enough to bump into gets a collider.
const BIOME_SPECS = {
  pine: {
    cell: 27,
    chance: 0.85,
    kinds: ["/models/nature/Pine_2.gltf", "/models/nature/Pine_4.gltf"],
    sMin: 0.7,
    sVar: 0.65,
    collide: 3.0, // fat enough that no paw clips inside the trunk
  },
  aspen: {
    cell: 29,
    chance: 0.8,
    kinds: ["/models/nature/CommonTree_2.gltf", "/models/nature/CommonTree_5.gltf"],
    sMin: 0.65,
    sVar: 0.65,
    collide: 3.0, // fat enough that no paw clips inside the trunk
  },
  berry: {
    cell: 17,
    chance: 0.72,
    kinds: ["/models/nature/Bush_Common.gltf"],
    sMin: 0.75,
    sVar: 0.75,
    collide: 2.0,
  },
  wildflower: {
    cell: 11,
    chance: 0.7,
    // ONLY the hand-picked blooms — the old Flower_Group models had a
    // giant purple variant that towered over the mouse (royally banished)
    kinds: [
      "/models/flowers/flower_single.glb",
      "/models/flowers/flower_rayden.glb",
      "/models/flowers/bell_flower.glb",
    ],
    sMin: 0.6,
    sVar: 0.5,
    collide: 0, // flowers bend, they don't block
  },
};

// Fill every biome with instanced growth (a handful of draw calls for
// thousands of plants) and push a collider for everything solid.
function fillBiomes(group, colliders, landmarks) {
  const kindToBiome = {
    aspen: "aspen",
    pine: "pine",
    berry: "berry",
    wildflower: "wildflower",
    meadow: "meadow",
    tallgrass: "tallgrass",
    well: "meadow",
    creek: "meadow",
    log: "pine", // the Fallen Log lies at the pine forest's feet
    school: "meadow", // open ground around the little school
  };
  biomeSeeds = landmarks
    .filter((l) => kindToBiome[l.kind])
    .map((l) => ({ x: l.x, z: l.z, biome: kindToBiome[l.kind] }));
  biomeSeeds.push({ x: 0, z: 0, biome: "meadow" }); // home clearing stays open

  // keep growth out of the creek and the tall-grass maze
  const creek = landmarks.find((l) => l.kind === "creek");
  CREEK_POS = creek ? { x: creek.x, z: creek.z } : null; // for isWater()
  const schoolLm = landmarks.find((l) => l.kind === "school");
  SCHOOL_POS = schoolLm ? { x: schoolLm.x, z: schoolLm.z } : null;
  const creekPts = [];
  if (creek) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      creekPts.push([
        creek.x + (t - 0.5) * 760,
        creek.z + Math.sin(t * Math.PI * 4.4) * 42 + Math.sin(t * Math.PI * 1.7 + 1.3) * 26,
      ]);
    }
  }
  const nearCreek = (x, z) => {
    for (const [cx, cz] of creekPts) if (Math.hypot(x - cx, z - cz) < 30) return true;
    return false;
  };
  const maze = landmarks.find((l) => l.kind === "tallgrass");

  const R = WORLD_RADIUS * 0.8 + 70; // forests climb a little into the foothills
  const placements = new Map(); // url -> [{x, z, s, rot}]
  let bi = 0;
  for (const [biome, spec] of Object.entries(BIOME_SPECS)) {
    bi += 17.3;
    const span = Math.ceil(R / spec.cell);
    for (let gx = -span; gx <= span; gx++) {
      for (let gz = -span; gz <= span; gz++) {
        const x = gx * spec.cell + (hash2(gx + bi, gz + 99) - 0.5) * spec.cell;
        const z = gz * spec.cell + (hash2(gx + 55, gz - bi) - 0.5) * spec.cell;
        // the heart of the Wildflower Patch is PACKED with blooms
        let chance = spec.chance;
        if (biome === "wildflower") {
          for (const sd of biomeSeeds) {
            if (sd.biome === "wildflower" && Math.hypot(x - sd.x, z - sd.z) < 80) {
              chance = 0.97;
              break;
            }
          }
        }
        if (hash2(gx * 3.1 + bi, gz * 7.7 - bi) > chance) continue;
        const d = Math.hypot(x, z);
        if (d < 45 || d > R) continue;
        if (biomeAt(x, z) !== biome) continue;
        if (nearCreek(x, z)) continue;
        if (isWater(x, z)) continue; // nothing grows out of open water
        if (isHollow(x, z)) continue; // …or inside the Hollow
        if (SCHOOL_POS && Math.abs(x - SCHOOL_POS.x) < 16 && Math.abs(z - SCHOOL_POS.z) < 7) continue;
        if (maze && Math.hypot(x - maze.x, z - maze.z) < 155) continue;
        const url = spec.kinds[(hash2(gx * 1.3, gz * 9.1) * spec.kinds.length) | 0];
        const s = spec.sMin + hash2(gx + 7, gz + 13) * spec.sVar;
        if (!placements.has(url)) placements.set(url, []);
        placements
          .get(url)
          .push({ x, z, s, rot: hash2(gx - 3, gz + 3) * Math.PI * 2, fr: spec.collide * s * 0.9 });
        if (spec.collide) colliders.push({ x, z, r: spec.collide * s });
      }
    }
  }

  for (const [url, list] of placements) {
    getBaseModel(url).then((base) => {
      base.updateMatrixWorld(true);
      const parts = [];
      base.traverse((o) => {
        if (o.isMesh) parts.push(o);
      });
      // SPEED: split each model's placements into ~300-unit map sectors,
      // one InstancedMesh per sector, so the camera can CULL whole groves
      // it isn't looking at — instead of drawing every plant in the world
      // every frame. Small things also skip the shadow pass entirely.
      const sectors = new Map();
      for (const p of list) {
        const key = Math.floor(p.x / 300) * 97 + Math.floor(p.z / 300);
        if (!sectors.has(key)) sectors.set(key, []);
        sectors.get(key).push(p);
      }
      const throwsShadow = targetHeightFor(url) >= 6; // trees + bushes only
      for (const src of parts) {
        const geo = src.geometry.clone();
        geo.applyMatrix4(src.matrixWorld); // bake to world size, grounded
        for (const chunk of sectors.values()) {
          const inst = new THREE.InstancedMesh(geo, src.material, chunk.length);
          chunk.forEach((p, i) => {
            _gq.setFromAxisAngle(_gup, p.rot);
            _gm4.compose(_gpos.set(p.x, groundY(p.x, p.z, p.fr), p.z), _gq, _gscl.set(p.s, p.s, p.s));
            inst.setMatrixAt(i, _gm4);
          });
          inst.castShadow = throwsShadow;
          inst.receiveShadow = true;
          inst.computeBoundingSphere(); // tight bounds -> real frustum culling
          group.add(inst);
        }
      }
    });
  }
}

// ------------------------------------------------------------
//  🍃  WIND — one shared clock drives everything that moves:
//  swaying grass and leaves, rippling water, drifting fall leaves.
//  main.js advances it each frame via updateOutsideFX().
// ------------------------------------------------------------
export const WIND = { uTime: { value: 0 } };

// Patch a standard material so its vertices sway in the wind. The sway grows
// with height (roots stay planted) and each spot in the world gets its own
// phase, so a whole field never waves in lockstep.
function addWind(mat, amplitude, swayHeight) {
  if (!mat || mat.userData.wind) return;
  mat.userData.wind = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = WIND.uTime;
    shader.uniforms.uWindAmp = { value: amplitude };
    shader.uniforms.uWindH = { value: swayHeight };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTime;\nuniform float uWindAmp;\nuniform float uWindH;"
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          #ifdef USE_INSTANCING
            vec4 wWind = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );
          #else
            vec4 wWind = modelMatrix * vec4( transformed, 1.0 );
          #endif
          float hWind = smoothstep( 0.0, uWindH, transformed.y );
          float phWind = wWind.x * 0.11 + wWind.z * 0.09;
          transformed.x += uWindAmp * hWind * ( sin( uTime * 1.6 + phWind ) * 0.75 + sin( uTime * 3.8 + phWind * 2.7 ) * 0.25 );
          transformed.z += uWindAmp * hWind * cos( uTime * 1.25 + phWind * 1.4 ) * 0.6;
        }`
      );
  };
  // All wind materials share one shader program (uniform values stay per-material).
  mat.customProgramCacheKey = () => "whiskerwood-wind";
  mat.needsUpdate = true;
}

// How strongly each KIND of model sways. Trees only sway their leaf materials
// (trunks stay solid); rocks and mushrooms don't sway at all.
function applyWind(model, url, srcHeight) {
  const n = url.toLowerCase();
  let amp = 0;
  let leavesOnly = false;
  if (/grass_/.test(n)) amp = 0.12;
  else if (/clover|petal/.test(n)) amp = 0.05;
  else if (/fern|plant_|flower/.test(n)) amp = 0.07;
  else if (/bush/.test(n)) amp = 0.035;
  else if (/twistedtree|commontree|pine_\d/.test(n)) {
    amp = 0.012;
    leavesOnly = true;
  }
  if (!amp) return;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mt) => {
      if (!mt) return;
      if (leavesOnly && !/leaf|leaves/i.test(mt.name || "")) return;
      addWind(mt, srcHeight * amp, srcHeight);
    });
  });
}

// ------------------------------------------------------------
//  🍂  FALLING LEAVES — a drifting cloud of autumn leaves that
//  follows the mouse so the air is always alive around you.
// ------------------------------------------------------------
let leafUniforms = null;

function makeLeafTexture() {
  const s = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  ctx.translate(s / 2, s / 2);
  // a simple white leaf (tinted per-leaf in the shader), small enough that
  // the rotated sprite never samples outside the transparent margin
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 15, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 14);
  ctx.lineTo(6, -12);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createFallingLeaves(count = 260) {
  const BOX = 130; // how wide the leaf cloud around the mouse is
  const FALL = 46; // how high above the mouse leaves spawn
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX;
    positions[i * 3 + 1] = Math.random() * FALL;
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOX;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  leafUniforms = {
    uTime: WIND.uTime,
    uCenter: { value: new THREE.Vector3() },
    uMap: { value: makeLeafTexture() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: leafUniforms,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uCenter;
      varying float vSeed;
      void main() {
        vSeed = aSeed;
        vec3 p = position;
        // fall forever: wrap the height as time passes, each leaf its own speed
        float y = mod(p.y - uTime * (1.1 + aSeed * 1.7), ${FALL.toFixed(1)});
        // sway side to side on the way down
        p.x += sin(uTime * (0.7 + aSeed * 0.5) + aSeed * 37.0 + y * 0.25) * 2.2;
        p.z += cos(uTime * (0.6 + aSeed * 0.4) + aSeed * 53.0 + y * 0.22) * 2.2;
        // keep the cloud wrapped around the player
        vec2 box = vec2(${BOX.toFixed(1)});
        p.xz = mod(p.xz - uCenter.xz + box * 0.5, box) - box * 0.5 + uCenter.xz;
        p.y = uCenter.y - 5.0 + y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(260.0 / max(-mv.z, 1.0), 2.0, 15.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uTime;
      varying float vSeed;
      void main() {
        // tumble: spin the sprite as it falls
        float ang = uTime * (1.0 + vSeed * 1.5) + vSeed * 40.0;
        vec2 c = gl_PointCoord - 0.5;
        float s = sin(ang), k = cos(ang);
        vec2 uv = vec2(c.x * k - c.y * s, c.x * s + c.y * k) + 0.5;
        if (texture2D(uMap, uv).a < 0.5) discard;
        vec3 gold = vec3(0.82, 0.62, 0.18);
        vec3 olive = vec3(0.42, 0.52, 0.16);
        vec3 rust = vec3(0.62, 0.32, 0.12);
        vec3 col = vSeed < 0.34 ? gold : (vSeed < 0.67 ? olive : rust);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// ------------------------------------------------------------
//  ✨  DRIFTING GLOW — tiny golden motes floating through the air
//  (pollen catching the sun), twinkling softly. Pure magic, cheap.
// ------------------------------------------------------------
let pollenUniforms = null;

function createPollen(count = 480) {
  const BOX = 110;
  const HEIGHT = 16;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX;
    positions[i * 3 + 1] = Math.random() * HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOX;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  pollenUniforms = { uTime: WIND.uTime, uCenter: { value: new THREE.Vector3() }, uNight: { value: 0 }, uRain: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: pollenUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uCenter;
      varying float vGlow;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.22 + aSeed * 21.0) * 2.4;
        p.y += sin(uTime * 0.31 + aSeed * 13.0) * 1.6;
        p.z += cos(uTime * 0.19 + aSeed * 33.0) * 2.4;
        vec2 box = vec2(${BOX.toFixed(1)});
        p.xz = mod(p.xz - uCenter.xz + box * 0.5, box) - box * 0.5 + uCenter.xz;
        p.y = uCenter.y - 1.5 + mod(p.y, ${HEIGHT.toFixed(1)});
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(150.0 / max(-mv.z, 1.0), 1.0, 6.0);
        vGlow = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * 1.4 + aSeed * 60.0), 3.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform float uRain;
      varying float vGlow;
      void main() {
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        float d = dot(c, c);
        if (d > 1.0) discard;
        float a = smoothstep(1.0, 0.0, d) * vGlow * (1.0 - uRain); // pollen shelters from rain
        // golden pollen by day -> green firefly lights after dark
        vec3 day = vec3(1.0, 0.86, 0.5) * 0.9;
        vec3 firefly = vec3(0.72, 1.0, 0.42) * 1.6;
        gl_FragColor = vec4(mix(day, firefly, uNight), a * (0.75 + uNight * 0.25));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// ------------------------------------------------------------
//  🌧️  RAIN — a box of falling streaks that rides along with the mouse.
//  uRain (0..1) fades the whole shower in and out as the weather turns.
// ------------------------------------------------------------
let rainUniforms = null;

function createRain(count = 2400) {
  const BOX = 95;
  const HEIGHT = 42;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX;
    positions[i * 3 + 1] = Math.random() * HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOX;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  rainUniforms = { uTime: WIND.uTime, uCenter: { value: new THREE.Vector3() }, uRain: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: rainUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uCenter;
      uniform float uRain;
      varying float vA;
      void main() {
        vec3 p = position;
        // every drop falls at its own speed, streaking slightly sideways
        float speed = 26.0 + aSeed * 14.0;
        p.y = mod(p.y - uTime * speed, ${HEIGHT.toFixed(1)});
        p.x += sin(aSeed * 40.0) * 1.5 + uTime * 1.2 * (aSeed - 0.5);
        vec2 box = vec2(${BOX.toFixed(1)});
        p.xz = mod(p.xz - uCenter.xz + box * 0.5, box) - box * 0.5 + uCenter.xz;
        p.y += uCenter.y - 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(160.0 / max(-mv.z, 1.0), 1.6, 5.5);
        // thin the shower out as uRain fades (drops wink out one by one)
        vA = uRain * step(1.0 - uRain * 0.9, fract(aSeed * 7.31)) * 0.85;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        if (vA < 0.01) discard;
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        // a tall sliver, not a round dot — reads as a falling streak
        float d = c.x * c.x * 3.0 + c.y * c.y * 0.4;
        if (d > 1.0) discard;
        gl_FragColor = vec4(vec3(0.78, 0.85, 0.93), smoothstep(1.0, 0.15, d) * vA);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// ------------------------------------------------------------
//  💧  THE WATERFALL — white water pouring down the gorge's two cliffs
//  into a plunge pool that feeds the creek, with a rope bridge across
//  the falls (climb the gentle side slopes to reach it).
// ------------------------------------------------------------
function createWaterfall(group, colliders) {
  const g = new THREE.Group();
  g.position.set(FALLS_POS.x, 0, FALLS_POS.z);
  g.rotation.y = Math.atan2(FALLS_AX, FALLS_AZ); // local +Z points into the cliffs

  const yPool = terrainHeight(FALLS_POS.x, FALLS_POS.z);
  const at = (proj) => terrainHeight(FALLS_POS.x + FALLS_AX * proj, FALLS_POS.z + FALLS_AZ * proj);
  const y1 = at(50);
  const y2 = at(122); // top-terrace height measured PAST the hollow's carve

  // --- the cliff itself: stacked faceted rock, mossy on top, so the water
  //     pours over STONE instead of smeared grass ---
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f6d64, roughness: 1, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4e6a38, roughness: 1, flatShading: true });
  const slab = (x, y, z, sx, sy, sz, seed) => {
    const geo = cragGeometry(seed);
    const m = new THREE.Mesh(geo, rockMat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.y = seed;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    // (solid rock — you can't walk through it)
    if (colliders) colliders.push({ x: FALLS_POS.x + x * FALLS_AZ + z * FALLS_AX, z: FALLS_POS.z - x * FALLS_AX + z * FALLS_AZ, r: Math.max(sx, sz) * 0.8 });
    const moss = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mossMat);
    moss.scale.set(sx * 0.8, sy * 0.16, sz * 0.8);
    moss.position.set(x, y + sy * 0.95, z);
    g.add(moss);
  };
  for (let i = 0; i < 7; i++) {
    if (i === 3) continue; // the gap the water pours through
    const lx = (i - 3) * 10.5;
    slab(lx, yPool + 2, 33 + Math.abs(i - 3) * 1.5, 6.5, (y1 - yPool) * 0.62, 6, i * 2.17 + 1.1);
  }
  slab(-9.5, yPool + 4, 30, 4, (y1 - yPool) * 0.7, 4.5, 9.7);
  slab(9.5, yPool + 4, 30, 4, (y1 - yPool) * 0.7, 4.5, 4.3);
  for (let i = 0; i < 5; i++) {
    if (i === 2) continue;
    const lx = (i - 2) * 12 + 3; // clear of the curtain AND the grotto inside
    slab(lx, y1 + 2, 77.5 + Math.abs(i - 2) * 1.5, 5.5, (y2 - y1) * 0.6, 5.5, i * 3.31 + 7.7);
  }
  slab(-10.5, y1 + 3, 77, 3.5, (y2 - y1) * 0.66, 4, 12.9);
  slab(16.5, y1 + 3, 77, 3.5, (y2 - y1) * 0.66, 4, 15.3);

  // --- honest riverside rocks from the Kenney Nature Kit (CC0), placed
  //     around the plunge pool at prop scale — where they look right ---
  for (const [nm, kh, kx, kz, kr] of [
    ["rock_largeA", 5.5, -17, 14, 0.6],
    ["rock_largeB", 4.5, 16, 12, 2.3],
    ["rock_largeC", 3.6, 9, -9, 4.1],
    ["rock_largeE", 3, -9, -11, 1.4],
  ]) {
    loadModelFile("/models/kenney/" + nm + ".glb", (m) => {
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(m).getSize(size);
      m.scale.setScalar(kh / (size.y || 1));
      m.rotation.y = kr;
      m.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      const b2 = new THREE.Box3().setFromObject(m);
      m.position.set(kx, yPool - 0.4 - b2.min.y, kz);
      g.add(m);
      if (colliders) {
        const sz2 = b2.getSize(new THREE.Vector3());
        colliders.push({ x: FALLS_POS.x + kx * FALLS_AZ + kz * FALLS_AX, z: FALLS_POS.z - kx * FALLS_AX + kz * FALLS_AZ, r: Math.max(sz2.x, sz2.z) * 0.42 });
      }
    });
  }

  // --- the falling water: curved sheets that kick out at the base,
  //     streaked, edge-faded, churning white where they land ---
  const fallsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: WIND.uTime },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        // the sheet arcs outward as it falls (uv.y = 1 at the lip)
        p.z += pow(1.0 - uv.y, 2.2) * 3.2 - (uv.y > 0.94 ? (uv.y - 0.94) * 18.0 : 0.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        // several ropes of water sliding at slightly different speeds
        float s1 = sin(vUv.x * 42.0 + sin(uTime * 2.4 + vUv.y * 11.0));
        float s2 = sin(vUv.x * 17.0 - uTime * 0.7 + vUv.y * 5.0);
        float flow = fract(vUv.y * 2.0 - uTime * 1.1 + s2 * 0.06);
        float streak = 0.5 + 0.5 * s1;
        vec3 deep = vec3(0.34, 0.58, 0.66);
        vec3 pale = vec3(0.88, 0.96, 0.99);
        vec3 col = mix(deep, pale, streak * 0.45 + (1.0 - flow) * 0.35);
        // churn: boiling white at the base with a ragged edge
        float churn = smoothstep(0.30, 0.02, vUv.y + s1 * 0.03);
        col = mix(col, vec3(0.97, 1.0, 1.0), churn);
        // the sheet thins to nothing at its side edges
        float edge = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
        float alpha = edge * (0.66 + streak * 0.18 + churn * 0.35);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  // Both curtains run PAST the ground at their feet (the extra length hides
  // under the pond / terrace), so the water visibly pours ALL the way down.
  // The LOWER falls pours down the cliff face as it's actually drawn: find
  // where that face leaves the pool (zFoot) and where it reaches the top
  // (zLip), then lay the sheet from the lip down into the water. (The hidden
  // way into Moonstone Hollow is right behind it, at the cliff's foot.)
  const meshAt = (lx, z) =>
    groundMeshHeight(FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX);
  let zFoot = 26;
  let zLip = 34;
  for (let z = 18; z < 40; z += 0.25) {
    if (meshAt(0, z) > yPool + 1.4) { zFoot = z - 0.5; break; }
  }
  for (let z = zFoot; z < 44; z += 0.25) {
    if (meshAt(0, z) >= y1 - 0.6) { zLip = z; break; }
  }
  {
    const top = new THREE.Vector3(0, y1 + 2.8, zLip);
    const bot = new THREE.Vector3(0, yPool - 1.2, zFoot - 1.2);
    const len = top.distanceTo(bot);
    const sheet1 = new THREE.Mesh(new THREE.PlaneGeometry(13, len + 2, 8, 16), fallsMat);
    sheet1.position.copy(top).add(bot).multiplyScalar(0.5);
    sheet1.rotation.x = Math.atan2(top.z - bot.z, top.y - bot.y); // lean with the cliff
    sheet1.scale.z = -1; // its foot kicks OUT into the pool, not into the rock
    g.add(sheet1);
  }
  FALLS_FOOT.z = zFoot; // (the hidden arch goes here)
  FALLS_FOOT.lean = Math.atan2(zLip - zFoot, y1 - yPool);
  const h2 = y2 - y1 + 12;
  const sheet2 = new THREE.Mesh(new THREE.PlaneGeometry(10, h2, 8, 16), fallsMat);
  sheet2.position.set(3, y2 + 2.8 - h2 / 2, 79.2);
  g.add(sheet2);

  // --- the CONNECTING streams, so the water is one unbroken chain:
  //     a source brook on the top terrace feeds the upper falls, a
  //     mid-terrace stream carries it to the lower falls, and the pool
  //     already overlaps the creek's end. All draped on the terrain. ---
  const stream = (z0, z1, w, segs = 22) => {
    const verts = [];
    const sides = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const k = i / segs;
      const z = z0 + (z1 - z0) * k;
      const meander = Math.sin(k * 5.2 + z0) * 1.6;
      // (the water's surface sits over the HIGHEST ground under it, so it's never buried)
      const toW = (lx) => [FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX];
      const level = Math.max(...[-w / 2, 0, w / 2].map((o) => groundTop(...toW(meander + o)))) + 0.25;
      for (const sd of [-1, 1]) {
        const lx = meander + (sd * w) / 2;
        verts.push(lx, level, z);
        sides.push(sd);
      }
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("aSide", new THREE.Float32BufferAttribute(sides, 1));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, waterMat);
  };
  g.add(stream(38, 80, 7)); // the mid-terrace run between the two falls
  g.add(stream(124, 138, 5.5)); // the source brook, arriving from the peaks (it sinks into the rock behind the Hollow)

  // --- the plunge pool, and drifting MIST rising off the churn ---
  // The basin floor sits ~0.9 below this waterline, and the shore rises
  // above it on every side, so the pond reads as REAL standing water.
  const pool = new THREE.Mesh(new THREE.CircleGeometry(30, 32), waterMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, yPool + 0.9, 2);
  g.add(pool);

  // --- the outlet brook's water: a draped ribbon (world coords) that
  //     slides out of the pool, through the shore notch, to the creek ---
  {
    const segs = 44;
    const w = 7;
    const verts = [];
    const sides = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const u = -0.08 + (1.11 * i) / segs;
      const mw = Math.sin(u * 7.3) * 4.5; // gentle meander inside the carve
      const cx = OUTLET_P0.x + OUTLET_AX * OUTLET_LEN * u - OUTLET_AZ * mw;
      const cz = OUTLET_P0.z + OUTLET_AZ * OUTLET_LEN * u + OUTLET_AX * mw;
      const level = Math.max(...[-1, 0, 1].map((sd) => groundTop(cx - OUTLET_AZ * ((sd * w) / 2), cz + OUTLET_AX * ((sd * w) / 2)))) + 0.25;
      for (const sd of [-1, 1]) {
        const px = cx - OUTLET_AZ * ((sd * w) / 2);
        const pz = cz + OUTLET_AX * ((sd * w) / 2);
        verts.push(px, level, pz);
        sides.push(sd);
      }
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("aSide", new THREE.Float32BufferAttribute(sides, 1));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, waterMat));
  }

  const mistCount = 70;
  const mp = new Float32Array(mistCount * 3);
  const ms = new Float32Array(mistCount);
  for (let i = 0; i < mistCount; i++) {
    const tier = i % 3 === 0 ? 1 : 0; // some mist at the upper falls too
    mp[i * 3] = (Math.random() - 0.5) * 14 + (tier ? 3 : 0);
    mp[i * 3 + 1] = (tier ? y1 : yPool) + Math.random() * 6;
    mp[i * 3 + 2] = (tier ? 76 : 26) + (Math.random() - 0.5) * 8;
    ms[i] = Math.random();
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  mistGeo.setAttribute("aSeed", new THREE.BufferAttribute(ms, 1));
  const mistMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: WIND.uTime },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      varying float vLife;
      void main() {
        vec3 p = position;
        float life = fract(uTime * (0.14 + aSeed * 0.1) + aSeed);
        p.y += life * 7.0;
        p.x += sin(uTime * 0.5 + aSeed * 20.0) * (1.0 + life * 2.5);
        vLife = life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((240.0 + aSeed * 200.0) * (0.4 + life) / max(-mv.z, 1.0), 4.0, 64.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        float d = dot(c, c);
        if (d > 1.0) discard;
        float a = smoothstep(1.0, 0.1, d) * (1.0 - vLife) * 0.16;
        gl_FragColor = vec4(vec3(0.94, 0.98, 1.0), a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mist = new THREE.Points(mistGeo, mistMat);
  mist.frustumCulled = false;
  g.add(mist);

  // --- the rope bridge across the top of the first falls ---
  // the rope bridge over the mid-terrace stream — every plank and post takes
  // its height from the ground right under it (no floating!), and it only
  // spans the flat terrace (the old one ran out past the cliff edge)
  const groundAt = (lx, z) =>
    terrainHeight(FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX);
  const BR_HALF = 14;
  const deckY = (lx) => {
    const k = (lx + BR_HALF) / (BR_HALF * 2);
    const ends = groundAt(-BR_HALF, 44) + (groundAt(BR_HALF, 44) - groundAt(-BR_HALF, 44)) * k;
    // a gentle rise over the water, never below the ground beneath
    return Math.max(ends + 0.3 + Math.sin(k * Math.PI) * 0.9, groundAt(lx, 44) + 0.3);
  };
  const railPts = { "-1": [], "1": [] };
  for (let i = 0; i <= 7; i++) {
    const lx = -BR_HALF + i * 4;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 2.4), barkMat);
    const y = deckY(lx);
    plank.position.set(lx, y, 44);
    // tilt to follow the deck's curve
    plank.rotation.z = Math.atan2(deckY(lx + 1) - deckY(lx - 1), 2);
    plank.rotation.y = (hash2(i, 8.8) - 0.5) * 0.05;
    plank.castShadow = true;
    g.add(plank);
    for (const side of [-1, 1]) railPts[side].push(new THREE.Vector3(lx, y + 2.4, 44 + side * 1.6));
  }
  const ropeMat2 = new THREE.MeshStandardMaterial({ color: 0xc9b06a, roughness: 1 });
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      // posts planted IN the ground, reaching just above the rope
      const lx = end * (BR_HALF + 0.6);
      const base = groundAt(lx, 44 + side * 1.6) - 0.5;
      const top = deckY(end * BR_HALF) + 2.7;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, top - base, 7), barkMat);
      post.position.set(lx, (top + base) / 2, 44 + side * 1.6);
      post.castShadow = true;
      g.add(post);
    }
    const ropeRail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts[side]), 24, 0.14, 5, false), ropeMat2);
    g.add(ropeRail);
  }

  // ------------------------------------------------------------
  //  🌙  MOONSTONE HOLLOW — the hidden grotto BEHIND the upper falls.
  //  Silver-blue light, glowing stones, pale flowers, drifting spores,
  //  and the Reading Stone at its heart. The source brook runs right
  //  through it before pouring over the lip as the highest waterfall.
  // ------------------------------------------------------------
  const lyAt = (lx, z) =>
    terrainHeight(FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX);
  // solid things in the grotto — the mouse can't walk through them
  const addCol = (lx, z, r) => {
    const c = {
      x: FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ,
      z: FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX,
      r,
    };
    if (colliders) colliders.push(c);
    return c;
  };

  // the rock dome that roofs the grotto (dark inside, a bulge outside)
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x4d4a44,
    roughness: 1,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 22, 15), domeMat);
  dome.scale.set(1.3, 0.68, 1.28);
  dome.position.set(0, y1 + 10, 101);
  dome.castShadow = true; // the sun stays OUTSIDE — silver light rules here
  dome.receiveShadow = true;
  g.add(dome);

  // the grotto's own silver light
  const moonGlow = new THREE.PointLight(0x9fd4ff, 560, 58, 1.7);
  moonGlow.position.set(0, y1 + 6, 100);
  g.add(moonGlow);

  // Everything below paints the hollow to match the concept art:
  // purple amethyst clusters on rock shelves, teal glow-flowers and
  // mushrooms, hanging ivy, an inner cascade into a glowing pool,
  // warm lanterns, the carved MOON DOOR, and the wooden sign.

  // — purple amethyst clusters (the real iPoly3D crystal, re-tinted) —
  getBaseModel("/models/props/crystal.glb").then((base) => {
    const place = (lx, z, h, ry, tint, glow, yOverride) => {
      const m = base.clone(true);
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(m).getSize(size);
      m.scale.multiplyScalar(h / (size.y || 1));
      const b2 = new THREE.Box3().setFromObject(m);
      m.position.set(lx, (yOverride !== undefined ? yOverride : lyAt(lx, z) - 0.25) - b2.min.y, z);
      m.rotation.y = ry;
      m.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        o.material.color.set(tint);
        o.material.emissive = new THREE.Color(glow);
        o.material.emissiveIntensity = 1.15;
      });
      g.add(m);
    };
    // big amethyst formations on the wall shelves (a few blue among them)
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1;
      const lx = side * (7.5 + hash2(i, 3.3) * 6);
      const z = 81 + (i / 26) * 38 + hash2(i, 7.7) * 2;
      const blue = i % 4 === 3;
      const h = 1.6 + hash2(i, 1.1) * 4.2;
      place(
        lx, z, h,
        hash2(i, 4.4) * 6,
        blue ? 0x9fd8ff : 0xc49df0,
        blue ? 0x3f88c8 : 0x8a3fd8
      );
      addCol(lx, z, Math.min(1.6, h * 0.3));
    }
    // two GIANTS flanking the Moon Door, like the painting's right wall
    place(-9, 111, 7.5, 0.8, 0xc49df0, 0x8a3fd8);
    place(9.4, 109, 6.4, 3.9, 0xb98fe8, 0x7a2fd0);
    addCol(-9, 111, 2.1);
    addCol(9.4, 109, 1.9);
    // and a shard beside the Moon Door's steps
    place(2.9, 108, 1.6, 2.1, 0xc49df0, 0x8a3fd8);
  });

  // — dark faceted ROCK lines the walls and floor, so the grotto reads
  //   as deep blue cave stone (not grassy hillside) like the painting —
  const caveRockMat = new THREE.MeshStandardMaterial({ color: 0x252b38, roughness: 1, flatShading: true });
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? 1 : -1;
    const t = i / 34;
    const lx = side * (12 + hash2(i, 17.3) * 4.5);
    const z = 80 + t * 42 + hash2(i, 19.1) * 1.5;
    const rr = 2.2 + hash2(i, 21.7) * 3;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), caveRockMat);
    rock.position.set(lx, lyAt(lx, z) + 0.4 + hash2(i, 23.9) * 2.4, z);
    rock.rotation.set(hash2(i, 25.1) * 3, hash2(i, 27.3) * 6, hash2(i, 29.5) * 3);
    rock.scale.set(1, 1.1 + hash2(i, 31.7) * 0.8, 0.8);
    g.add(rock);
    addCol(lx, z, rr * 0.75);
  }
  // dark floor plates breaking up the grass color
  for (let i = 0; i < 22; i++) {
    const lx = (hash2(i, 33.1) - 0.5) * 21;
    const z = 82 + hash2(i, 35.3) * 36;
    const plate = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + hash2(i, 37.5) * 1.5, 0), caveRockMat);
    plate.scale.y = 0.16;
    plate.position.set(lx, lyAt(lx, z) + 0.05, z);
    plate.rotation.y = hash2(i, 39.7) * 6;
    g.add(plate);
  }

  // — a pale MOONBEAM falling from the dome onto the Moon Door —
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 5.4, 16, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xbfd8ff,
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  beam.position.set(0, lyAt(0, 110) + 8.5, 110);
  g.add(beam);

  const glowWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0e2f42,
    emissive: 0x2a7ab8,
    emissiveIntensity: 0.85,
    roughness: 0.12,
  });
  // — the glowing stream: an overlay ribbon where the brook crosses
  //   the grotto, lit from within like the painting's water —
  {
    const segs = 16;
    const verts = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const z = 83 + (i / segs) * 25;
      for (const sd of [-1, 1]) {
        const lx = hollowBrookX(z) + sd * 0.9; // a narrow glowing rill along the left wall
        verts.push(lx, lyAt(lx, z) + 0.3, z);
      }
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, glowWaterMat));
  }

  // — dark rock shelves under the crystal beds —
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2f343c, roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const lx = side * (9 + hash2(i, 6.1) * 4.5);
    const z = 84 + hash2(i, 2.9) * 34;
    const rr = 1.4 + hash2(i, 8.2) * 1.4;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), shelfMat);
    rock.scale.y = 0.55;
    rock.position.set(lx, lyAt(lx, z), z);
    rock.rotation.y = hash2(i, 3.7) * 6;
    g.add(rock);
    addCol(lx, z, rr * 0.85); // (solid)
  }

  // — teal glow-moss and bioluminescent flower patches —
  const glowMossMat = new THREE.MeshStandardMaterial({
    color: 0x143c34,
    emissive: 0x35e8c0,
    emissiveIntensity: 0.75,
    roughness: 1,
    flatShading: true,
  });
  const glowBloomMat = new THREE.MeshStandardMaterial({
    color: 0x2a5a50,
    emissive: 0x4ff0d0,
    emissiveIntensity: 1.5,
    roughness: 0.8,
    flatShading: true,
  });
  const stemMat2 = new THREE.MeshStandardMaterial({ color: 0x2a4a3c, roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const lx = (hash2(i, 5.1) - 0.5) * 22;
    const z = 82 + hash2(i, 9.3) * 36;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.7 + hash2(i, 2.7) * 0.8, 8, 6), glowMossMat);
    m.scale.y = 0.25;
    m.position.set(lx, lyAt(lx, z) + 0.08, z);
    g.add(m);
    // a sprinkle of tiny glowing blossoms on each patch
    for (let f = 0; f < 3; f++) {
      const fx = lx + (hash2(i * 3 + f, 4.2) - 0.5) * 1.6;
      const fz = z + (hash2(i * 7 + f, 6.6) - 0.5) * 1.6;
      const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14 + hash2(f + i, 1.9) * 0.08, 0), glowBloomMat);
      bloom.position.set(fx, lyAt(fx, fz) + 0.3, fz);
      g.add(bloom);
    }
  }

  // — glowing mushrooms, huddled in little families —
  const shroomCapMat = new THREE.MeshStandardMaterial({
    color: 0x3a6a8a,
    emissive: 0x55c8f0,
    emissiveIntensity: 1.1,
    roughness: 0.7,
    flatShading: true,
  });
  const shroomStemMat = new THREE.MeshStandardMaterial({ color: 0xb9c4c8, roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const lx = (hash2(i, 11.7) - 0.5) * 20;
    const z = 83 + hash2(i, 13.1) * 35;
    const gy = lyAt(lx, z);
    const h = 0.5 + hash2(i, 3.9) * 0.6;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, h, 6), shroomStemMat);
    stem.position.set(lx, gy + h / 2, z);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + hash2(i, 5.3) * 0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      shroomCapMat
    );
    cap.position.set(lx, gy + h, z);
    g.add(stem, cap);
  }

  // — pale moonpetals (kept from before, teal-white now) —
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xd8f0ea,
    emissive: 0xa8f0dc,
    emissiveIntensity: 0.8,
    roughness: 0.8,
    flatShading: true,
  });
  for (let i = 0; i < 6; i++) {
    const lx = (hash2(i, 12.3) - 0.5) * 18;
    const z = 85 + hash2(i, 15.7) * 30;
    const gy = lyAt(lx, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.4, 5), stemMat2);
    stem.position.set(lx, gy + 0.7, z);
    const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), petalMat);
    bloom.position.set(lx, gy + 1.5, z);
    g.add(stem, bloom);
  }

  // — ivy trailing down from the dome's dark ceiling —
  const ivyMat = new THREE.MeshStandardMaterial({
    color: 0x2e6b34,
    emissive: 0x123820,
    emissiveIntensity: 0.35,
    roughness: 1,
    flatShading: true,
  });
  for (let sI = 0; sI < 20; sI++) {
    const lx = (hash2(sI, 21.3) - 0.5) * 22;
    const z = 84 + hash2(sI, 23.7) * 34;
    const top = y1 + 6 + hash2(sI, 25.1) * 4;
    const len = 2 + hash2(sI, 27.9) * 3;
    const leaves = 5 + (sI % 3);
    for (let li = 0; li < leaves; li++) {
      const t = li / (leaves - 1);
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + (li % 2) * 0.07, 0), ivyMat);
      leaf.position.set(lx + Math.sin(t * 7 + sI) * 0.25, top - t * len, z + Math.cos(t * 5 + sI) * 0.25);
      leaf.scale.set(1, 0.6, 0.5);
      leaf.rotation.set(t * 2, sI, t);
      g.add(leaf);
    }
  }

  // — the inner cascade: a small falls down the back wall into a
  //   GLOWING pool (the brook then slips on through the grotto) —
  const innerPool = new THREE.Mesh(new THREE.CircleGeometry(HOLLOW_POOL.r, 24), glowWaterMat);
  innerPool.rotation.x = -Math.PI / 2;
  innerPool.position.set(HOLLOW_POOL.lx, lyAt(HOLLOW_POOL.lx, HOLLOW_POOL.z) + 0.35, HOLLOW_POOL.z);
  g.add(innerPool);
  const innerFallsY = lyAt(-8, 122);
  const innerFalls = new THREE.Mesh(new THREE.PlaneGeometry(3.5, innerFallsY - lyAt(-8, 112) + 8, 4, 10), fallsMat);
  innerFalls.rotation.y = 0.35;
  innerFalls.position.set(-8, lyAt(-8, 112) + (innerFallsY - lyAt(-8, 112)) / 2 + 0.5, 114);
  g.add(innerFalls);
  // rocky terraces under the cascade, like the painting's stepped falls
  for (let st = 0; st < 3; st++) {
    const tr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 - st * 0.25, 0), caveRockMat);
    tr.scale.y = 0.4;
    tr.position.set(-8 + st * 0.7, lyAt(-8 + st * 0.7, 113 - st * 2) + 0.5 + (2 - st) * 0.8, 113 - st * 2);
    g.add(tr);
  }

  // — warm wooden lanterns —
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffd9a0,
    emissive: 0xffb84a,
    emissiveIntensity: 2.2,
  });
  const lanternWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 });
  for (const [llx, lz] of [[-8.5, 86], [8.8, 104], [-3, 112], [-7.2, 84.5]]) {
    const gy = lyAt(llx, lz);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.2, 6), lanternWoodMat);
    post.position.set(llx, gy + 1.1, lz);
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.5), lanternGlassMat);
    cage.position.set(llx, gy + 2.4, lz);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 4), lanternWoodMat);
    cap.position.set(llx, gy + 2.85, lz);
    g.add(post, cage, cap);
  }
  const lanternLight = new THREE.PointLight(0xffb060, 42, 16, 1.8);
  lanternLight.position.set(-3, lyAt(-3, 112) + 2.6, 112);
  g.add(lanternLight);
  const signLight = new THREE.PointLight(0xffb060, 30, 13, 1.8);
  signLight.position.set(-7.2, lyAt(-7.2, 84.5) + 2.6, 84.5);
  g.add(signLight);

  // — THE MOON DOOR: a carved rune stone with a glowing crescent —
  const doorY = lyAt(0, 111);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2e3d52, roughness: 0.85, flatShading: true });
  const door = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.1, 9, 10, 1), doorMat);
  door.scale.z = 0.42; // a great flattened slab
  door.position.set(0, doorY + 4.5, 113);
  g.add(door);
  for (const sx of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 5.5, 8), doorMat);
    wing.scale.z = 0.45;
    wing.position.set(sx * 4.6, lyAt(sx * 4.6, 112) + 2.7, 113.4);
    g.add(wing);
  }
  // the crescent: a glowing disc with a dark disc biting into it
  const moonFaceMat = new THREE.MeshStandardMaterial({
    color: 0x9fd4ff,
    emissive: 0x6fb8ff,
    emissiveIntensity: 2.0,
    side: THREE.DoubleSide,
  });
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(1.35, 24), moonFaceMat);
  moonDisc.position.set(0, doorY + 6.2, 111.4);
  moonDisc.rotation.y = Math.PI; // face the entrance
  g.add(moonDisc);
  const bite = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), doorMat.clone());
  bite.position.set(0.55, doorY + 6.35, 111.35);
  bite.rotation.y = Math.PI;
  g.add(bite);
  const doorCols = [addCol(-1.6, 113, 2.2), addCol(1.6, 113, 2.2)];
  addCol(-4.6, 113.4, 1.6);
  addCol(4.6, 113.4, 1.6);
  const moonRing = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.1, 6, 28), moonFaceMat);
  moonRing.position.set(0, doorY + 6.2, 111.45);
  g.add(moonRing);
  // the dark stairway the door hides (seen once it sinks away)
  const stairway = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x020306, side: THREE.DoubleSide }));
  stairway.position.set(0, doorY + 0.05, 113.9);
  stairway.rotation.y = Math.PI;
  g.add(stairway);
  // — THE STAIRWELL DOWN TO ROOTHAVEN (hidden until the door opens) —
  // A round shaft right where the door stood, a spiral stair winding down
  // into warm light. The forest floor is one big mesh, so the hole is a
  // "portal": a disc that resets the depth buffer to FAR, letting the shaft
  // (drawn right after it) show through — and only through the hole.
  const STAIR_Z = 111.6;
  const STAIR_R = 2.1;
  // (use the ground as DRAWN — the coarse mesh sits higher here than terrainHeight)
  const drawnAt = (lx, z) => {
    const w = fallsToWorld(lx, z);
    return Math.max(groundMeshHeight(w.x, w.z), terrainHeight(w.x, w.z));
  };
  const sy = drawnAt(0, STAIR_Z);
  const stairwell = new THREE.Group();
  stairwell.position.set(0, sy, STAIR_Z);
  stairwell.visible = false;
  {
    // the portal disc follows every bump of the drawn ground (a hair above it)
    const holeGeo = new THREE.CircleGeometry(STAIR_R, 32).rotateX(-Math.PI / 2);
    {
      const hp = holeGeo.attributes.position;
      for (let i = 0; i < hp.count; i++) {
        // local x is across the falls (lx), local z runs into the cliffs
        hp.setY(i, drawnAt(hp.getX(i), STAIR_Z + hp.getZ(i)) - sy + 0.06);
      }
    }
    // pass 1: mark (in the stencil buffer) every pixel where the hole is seen
    const mark = new THREE.Mesh(
      holeGeo,
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp,
      })
    );
    mark.renderOrder = 5;
    // pass 2: in exactly those pixels, push the depth back to FAR
    const clearDepth = new THREE.Mesh(
      holeGeo,
      new THREE.ShaderMaterial({
        vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "void main(){ gl_FragColor = vec4(0.0); gl_FragDepth = 1.0; }",
        colorWrite: false,
        depthFunc: THREE.AlwaysDepth,
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.EqualStencilFunc,
        stencilZPass: THREE.KeepStencilOp,
      })
    );
    clearDepth.renderOrder = 5.5;
    stairwell.add(mark, clearDepth);
    // (unlit, shaded by depth: dark stone, steps catching the lamplight)
    const shaftMat = new THREE.MeshBasicMaterial({ color: 0x24222a, side: THREE.BackSide });
    const stepMat = new THREE.MeshBasicMaterial({ color: 0x8a6a48 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc870 });
    const inside = [];
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(STAIR_R, STAIR_R, 26, 24, 1, true), shaftMat);
    shaft.position.y = -13;
    inside.push(shaft);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(STAIR_R, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb860 }));
    floor.position.y = -26;
    inside.push(floor); // warm light far, far below
    for (let i = 0; i < 40; i++) {
      const a = i * 0.42;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.7), stepMat);
      step.position.set(Math.cos(a) * (STAIR_R - 0.75), -0.35 - i * 0.6, Math.sin(a) * (STAIR_R - 0.75));
      step.rotation.y = -a;
      inside.push(step);
      if (i % 6 === 3) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), glowMat);
        lamp.position.set(Math.cos(a + 0.3) * (STAIR_R - 0.08), -0.1 - i * 0.6, Math.sin(a + 0.3) * (STAIR_R - 0.08));
        inside.push(lamp);
      }
    }
    // pass 3: the shaft and its stair, drawn only inside the hole
    for (const o of inside) {
      o.renderOrder = 6;
      o.material = o.material.clone();
      Object.assign(o.material, { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp });
      stairwell.add(o);
    }
    // the clear DOOR: a glowing stone arch over the top of the stair
    const archMat = new THREE.MeshStandardMaterial({ color: 0x5a6070, roughness: 0.9, flatShading: true });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(STAIR_R + 0.4, 0.35, 8, 24, Math.PI), archMat);
    arch.position.set(0, 0, STAIR_R * 0.55);
    stairwell.add(arch);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), archMat);
      post.position.set(sx * (STAIR_R + 0.4), 0.2, STAIR_R * 0.55);
      stairwell.add(post);
    }
    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(STAIR_R + 0.1, 0.07, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
    runeRing.position.y = 0.04;
    stairwell.add(runeRing);
    const warm = new THREE.PointLight(0xffb868, 8, 9, 1.6);
    warm.position.y = 1.2;
    stairwell.add(warm);
  }
  g.add(stairwell);

  // everything that sinks into the floor when the door opens
  Object.assign(MOON_DOOR, {
    stairwell,
    parts: [door, moonDisc, bite, moonRing],
    colliders: doorCols,
    moonMat: moonFaceMat,
    doorY,
    at: fallsToWorld(0, 111), // stand here to face the door
    stairs: fallsToWorld(0, STAIR_Z), // the way down, once it's open
    stairR: STAIR_R,
    ready: true,
  });
  // silver runes carved in columns beside the crescent
  for (let col = 0; col < 4; col++) {
    const rx = [-2.6, -1.9, 1.9, 2.6][col];
    for (let r = 0; r < 5; r++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.06), moonFaceMat);
      rune.position.set(rx, doorY + 2.2 + r * 0.85, 111.55 - Math.abs(rx) * 0.12);
      rune.rotation.z = (hash2(col, r) - 0.5) * 1.3;
      g.add(rune);
      MOON_DOOR.parts.push(rune); // carved on the door — it sinks with it
    }
  }
  for (const sx of [-1, 1]) {
    for (let r = 0; r < 3; r++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.06), moonFaceMat);
      rune.position.set(sx * 4.6, lyAt(sx * 4.6, 112) + 1.6 + r * 0.8, 111.9);
      rune.rotation.z = (hash2(sx * 3 + r, 5.5) - 0.5) * 1.2;
      g.add(rune);
    }
  }
  // stone steps rising to the door — SOLID: you walk up them, not through
  for (let st = 0; st < 3; st++) {
    const w = 5 - st * 0.9;
    const z = 106.5 + st * 1.6;
    const y = lyAt(0, z) + 0.2 + st * 0.3;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 1.6), shelfMat);
    step.position.set(0, y, z);
    g.add(step);
    MOON_STEPS.push({ w, z0: z - 0.8, z1: z + 0.8, top: y + 0.25 });
  }

  // — the wooden sign at the entrance —
  {
    // (🪧 big, crisp, unlit and readable from both sides — see signs.js)
    const board = signBoard("MOONSTONE HOLLOW\nmoonlight reveals\nwhat time forgets ☾", { w: 3.8, h: 2.3, style: "wood" });
    const sgy = lyAt(-5.5, 83);
    board.position.set(-5.5, sgy + 2.2, 83);
    board.rotation.y = 0.5; // angled to greet you as you step through
    for (const px of [-1.2, 1.2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 6), lanternWoodMat);
      post.position.set(-5.5 + px * Math.cos(0.5), sgy + 1.1, 83 + px * Math.sin(0.5));
      g.add(post);
    }
    g.add(board);
    addCol(-5.5, 83, 0.9);
  }

  // — 📖 PIP'S JOURNAL: a little open book waiting on a reading rock
  //   beside the glowing pool (walk up and press E to read Entry One) —
  {
    const deskRock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), caveRockMat);
    deskRock.scale.y = 0.5;
    const jy = lyAt(4.2, 96);
    deskRock.position.set(4.2, jy + 0.3, 96);
    g.add(deskRock);
    addCol(4.2, 96, 1.0);
    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xf2e6c8,
      emissive: 0x8a7a50,
      emissiveIntensity: 0.25,
      roughness: 0.9,
    });
    for (const sx of [-1, 1]) {
      const page = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.85), pageMat);
      page.rotation.x = -Math.PI / 2 + 0.12;
      page.rotation.y = sx * 0.28;
      page.position.set(4.2 + sx * 0.3, jy + 0.86, 96);
      g.add(page);
    }
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x5d3a24, roughness: 1 })
    );
    spine.position.set(4.2, jy + 0.84, 96);
    g.add(spine);
  }

  // — fireflies: warm green-gold motes drifting in the still air —
  {
    const N = 110;
    const sp = new Float32Array(N * 3);
    const ss = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 24;
      sp[i * 3 + 1] = y1 + 1 + Math.random() * 10;
      sp[i * 3 + 2] = 81 + Math.random() * 40;
      ss[i] = Math.random();
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sgeo.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
    const smat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: WIND.uTime },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        varying float vTw;
        varying float vKind;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.3 + aSeed * 30.0) * 1.4;
          p.y += sin(uTime * 0.22 + aSeed * 17.0) * 1.1;
          p.z += cos(uTime * 0.26 + aSeed * 23.0) * 1.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(130.0 / max(-mv.z, 1.0), 1.5, 5.5);
          vTw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 50.0), 2.4);
          vKind = step(0.5, fract(aSeed * 3.7)); // green fireflies + blue spores
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vTw;
        varying float vKind;
        void main() {
          vec2 c = gl_PointCoord * 2.0 - 1.0;
          float d = dot(c, c);
          if (d > 1.0) discard;
          vec3 col = mix(vec3(0.62, 1.0, 0.45), vec3(0.7, 0.86, 1.0), vKind);
          gl_FragColor = vec4(col, smoothstep(1.0, 0.0, d) * vTw * 0.6);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const motes = new THREE.Points(sgeo, smat);
    motes.frustumCulled = false;
    g.add(motes);
  }

  // ------------------------------------------------------------
  //  🚪 THE WAY IN is behind the BOTTOM waterfall. A hidden mouth in the
  //  cliff behind the lower curtain leads up a passage into the Hollow.
  //  The old opening behind the upper falls is sealed with rock; inside,
  //  an arch in that wall leads back down to the pool.
  // ------------------------------------------------------------
  {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 1, flatShading: true });
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x030405, side: THREE.DoubleSide });
    const lumpy = (geo, amp) => {
      const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const k = (hash2(pa.getX(i) * 3.1 + pa.getY(i), pa.getZ(i) * 2.7) - 0.5) * amp;
        pa.setXYZ(i, pa.getX(i) + k, pa.getY(i) + k * 0.6, pa.getZ(i) + k);
      }
      geo.computeVertexNormals();
      return geo;
    };
    // the seal: a rock wall right behind the upper falls curtain
    const wallZ = 80.6;
    const wallBase = Math.min(lyAt(-14, wallZ), lyAt(0, wallZ), lyAt(14, wallZ)) - 1.5;
    const wallTop = y1 + 17;
    const wall = new THREE.Mesh(lumpy(new THREE.BoxGeometry(34, wallTop - wallBase, 3, 10, 6, 1), 1.4), rockMat);
    wall.position.set(0, (wallTop + wallBase) / 2, wallZ + 1.5);
    wall.castShadow = true;
    g.add(wall);
    for (let lx = -16; lx <= 16; lx += 2.5) addCol(lx, wallZ + 1.5, 2.2);
    // the inner arch: a dark passage mouth on the Hollow side of the wall
    const archIn = new THREE.Group();
    const inY = lyAt(0, wallZ + 3.4);
    archIn.position.set(0, inY, wallZ + 3.06);
    const holeIn = new THREE.Mesh(new THREE.CircleGeometry(2.3, 18, 0, Math.PI), darkMat);
    archIn.add(holeIn);
    const rimIn = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.32, 6, 18, Math.PI), rockMat);
    archIn.add(rimIn);
    g.add(archIn);
    // the outer arch: hidden behind the LOWER waterfall's curtain, at pool level
    const outZ = FALLS_FOOT.z + 0.4;
    const archOut = new THREE.Group();
    // its foot sits at the pool's waterline, so it rises out of the water
    // right behind the falling curtain, set INTO the cliff face as drawn
    const outY = Math.max(meshAt(0, outZ), yPool + 0.75);
    archOut.position.set(0, outY, outZ);
    archOut.rotation.y = Math.PI; // facing out, toward the pool
    archOut.rotation.x = FALLS_FOOT.lean * 0.85; // leaning back with the rock
    archOut.add(new THREE.Mesh(new THREE.CircleGeometry(3.2, 20, 0, Math.PI), darkMat));
    archOut.add(new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.45, 6, 20, Math.PI), rockMat));
    // a ledge of stones leading to it, just above the water
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 7), rockMat);
      st.position.set(1.2 - i * 0.9, yPool + 0.75, outZ - 2.6 - i * 2.4);
      g.add(st);
    }
    g.add(archOut);
    const W = (lx, z) => ({ x: FALLS_POS.x + z * FALLS_AX + lx * FALLS_AZ, z: FALLS_POS.z + z * FALLS_AZ - lx * FALLS_AX });
    Object.assign(HOLLOW_DOORS, {
      outside: W(0, outZ), // walk in here (behind the bottom falls)…
      outsideStand: W(3.5, 22), // …and step out here, on the pool's edge
      inside: W(0, wallZ + 3.4), // the arch inside the Hollow…
      insideStand: W(0, wallZ + 8), // …and where you arrive
      intoHollow: Math.atan2(FALLS_AX, FALLS_AZ), // facing deeper into the Hollow
      ready: true,
    });
  }

  group.add(g);
}

// ------------------------------------------------------------
//  🦋  BUTTERFLIES — little flapping wanderers over the flower country.
// ------------------------------------------------------------
const butterflies = [];

function createButterflies(group, landmarks) {
  const spots = [{ x: 0, z: 0 }]; // home clearing first — life at your door
  for (const kind of ["wildflower", "meadow", "berry"]) {
    for (const l of landmarks) if (l.kind === kind) spots.push(l);
  }
  const tints = [0xe8a8c8, 0x9a7ad0, 0xf2efe4, 0xe8c85a];
  const wingGeo = new THREE.CircleGeometry(0.42, 6);
  wingGeo.scale(1, 0.55, 1);
  wingGeo.translate(0.36, 0, 0);
  spots.forEach((spot, si) => {
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: tints[(i + si) % tints.length], side: THREE.DoubleSide });
      const b = new THREE.Group();
      const w1 = new THREE.Mesh(wingGeo, mat);
      const w2 = new THREE.Mesh(wingGeo, mat);
      w2.rotation.y = Math.PI;
      b.add(w1, w2);
      b.scale.setScalar(0.8);
      b.userData = {
        hx: spot.x + (hash2(i * 1.7, si * 3.1) - 0.5) * 170,
        hz: spot.z + (hash2(i * 4.3, si * 7.7) - 0.5) * 170,
        seed: hash2(i * 9.1, si * 2.3) * 100,
        w1,
        w2,
      };
      group.add(b);
      butterflies.push(b);
    }
  });
}

function updateButterflies(t, center) {
  for (const b of butterflies) {
    const u = b.userData;
    if (center) {
      const dx = u.hx - center.x;
      const dz = u.hz - center.z;
      if (dx * dx + dz * dz > 260 * 260) {
        b.visible = false;
        continue;
      }
      b.visible = true;
    }
    const s = u.seed;
    const x = u.hx + Math.sin(t * 0.31 + s) * 24 + Math.sin(t * 0.83 + s * 2.0) * 6;
    const z = u.hz + Math.cos(t * 0.27 + s * 1.3) * 24 + Math.cos(t * 0.71 + s) * 6;
    b.position.set(x, terrainHeight(x, z) + 2.1 + Math.sin(t * 1.7 + s) * 0.9, z);
    b.rotation.y = -t * 0.31 - s; // loosely faces its wander
    const flap = Math.sin(t * 13 + s * 5) * 0.75;
    u.w1.rotation.y = flap;
    u.w2.rotation.y = Math.PI - flap;
  }
}

// ------------------------------------------------------------
//  🪲  CRITTERS — beetles amble through the grass, dragonflies dart
//  over the creek. Little lives everywhere you look down.
// ------------------------------------------------------------
const critters = [];

const FUR = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });

// ------------------------------------------------------------
//  🦌  REAL ANIMAL MODELS (public/models/animals — see CREDITS.txt).
//  Heights are world units; the mouse is ~0.45 tall, so a deer TOWERS.
//  Yaw turns a model to face +Z, the way all the critter code expects.
// ------------------------------------------------------------
export const ANIMAL_HEIGHTS = {
  rabbit: 0.95,
  hedgehog: 0.55,
  raccoon: 1.6,
  porcupine: 1.3,
  squirrel: 0.85,
  deer: 6,
  mule_deer: 6.2,
  fox: 2.2,
  wolf: 4,
  black_bear: 5,
  river_otter: 1.1,
  bobcat: 2.6,
  great_horned_owl: 2.8,
  turtle: 0.6,
  bluebird: 0.55,
  hummingbird: 0.32,
  trout: 0.55,
  badger: 2.0,
  coyote: 3.2,
  beaver: 1.5,
  moose: 7.5,
  turkey: 2.2,
  bison: 5.2,
  muskrat: 0.9,
  woodpecker: 0.6,
  snake: 0.4,
};
// Per-model facing fix, measured from lineup renders: most Poly-by-Google
// quadrupeds face -X (turn them +90°), the raccoon faces -Z (turn 180°),
// and the fox/wolf/bear/bobcat/owl already face +Z.
const QT = Math.PI / 2;
export const ANIMAL_YAW = {
  rabbit: QT,
  hedgehog: QT,
  raccoon: Math.PI,
  porcupine: QT,
  squirrel: QT,
  deer: QT,
  mule_deer: QT,
  river_otter: QT,
  turtle: QT,
  bluebird: QT,
  hummingbird: QT,
  trout: QT,
  badger: QT,
  coyote: QT,
  beaver: QT,
  moose: QT,
  turkey: QT,
  bison: QT,
  muskrat: QT,
  woodpecker: QT,
  snake: QT,
};

export function buildAnimal(name) {
  const g = new THREE.Group();
  getBaseModel("/models/animals/" + name + ".glb").then((base) => {
    const m = base.clone(true);
    m.rotation.y = ANIMAL_YAW[name] || 0;
    g.add(m);
  });
  return g;
}

// The little leather traveling pack, worn on Thistle's back.
export function buildAdventurerPack() {
  const g = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0x8a5c36, roughness: 0.75, flatShading: true });
  const canvasy = new THREE.MeshStandardMaterial({ color: 0x6a6a3a, roughness: 0.9, flatShading: true });
  const strap = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.1), leather);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.11), canvasy);
  flap.position.y = 0.1;
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 7), canvasy);
  roll.rotation.z = Math.PI / 2;
  roll.position.y = 0.145;
  for (const sx of [-1, 1]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.19, 0.115), strap);
    st.position.set(sx * 0.05, 0, 0);
    g.add(st);
  }
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xc9a04a, metalness: 0.6, roughness: 0.4 })
  );
  buckle.position.set(0, 0.02, 0.058);
  g.add(body, flap, roll, buckle);
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

// ------------------------------------------------------------
//  🐭  THISTLE MOSSWHISKER — the player character, built to match
//  the portrait: cream faceted fur, big rose-lined ears, a mossy
//  green hooded tunic, leather belt with a golden buckle, and the
//  trusty leather pack. Bipedal, brave, and very small.
// ------------------------------------------------------------
export function buildThistle({ tunicColor = 0x6f7a42, hoodColor = 0x5f6a38, pack = true } = {}) {
  const g = new THREE.Group();
  const F = (c, extra = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...extra });
  const fur = F(0xd9cbb0);
  const furLight = F(0xece2cd);
  const earPink = F(0xe09a92);
  const tunic = F(tunicColor);
  const hoodGreen = F(hoodColor);
  const leather = F(0x6b4a2c);
  const gold = F(0xc9a04a, { metalness: 0.5, roughness: 0.4 });
  const pinkSkin = F(0xc9a08a);
  const dark = F(0x17130f, { roughness: 0.4 });

  const ball2 = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, detail = 1) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), m);
    b.position.set(x, y, z);
    b.scale.set(sx, sy, sz);
    g.add(b);
    return b;
  };

  // — legs (grouped at the hip so they can swing) —
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.075, 0.24, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.2, 7), fur);
    leg.position.y = -0.1;
    hip.add(leg);
    const foot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 1), pinkSkin);
    foot.scale.set(0.85, 0.5, 1.5);
    foot.position.set(0, -0.21, 0.045);
    hip.add(foot);
    g.add(hip);
    legs.push(hip);
  }

  // — the mossy green tunic, darker hem, belted leather —
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.185, 0.34, 9), tunic);
  robe.position.y = 0.37;
  g.add(robe);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.195, 0.05, 9), hoodGreen);
  hem.position.y = 0.215;
  g.add(hem);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.163, 0.17, 0.055, 9), leather);
  belt.position.y = 0.33;
  g.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.02), gold);
  buckle.position.set(0, 0.33, 0.165);
  g.add(buckle);
  const buckleHole = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.026, 0.022), leather);
  buckleHole.position.set(0, 0.33, 0.166);
  g.add(buckleHole);

  // — arms in green sleeves, little cream paws —
  const arms = [];
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.145, 0.5, 0.01);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.17, 7), tunic);
    sleeve.position.y = -0.075;
    shoulder.add(sleeve);
    const paw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.042, 1), furLight);
    paw.position.y = -0.165;
    shoulder.add(paw);
    shoulder.rotation.z = sx * 0.28; // resting slightly out from the body
    g.add(shoulder);
    arms.push(shoulder);
  }

  // — the head: big, faceted, friendly —
  const head = new THREE.Group();
  head.position.set(0, 0.62, 0);
  g.add(head);
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.155, 1), F(0xeae2d0));
  skull.position.y = 0.02;
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.IcosahedronGeometry(0.082, 1), F(0xf6f1e6));
  muzzle.scale.set(1, 0.82, 0.95);
  muzzle.position.set(0, -0.02, 0.13);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 1), earPink);
  nose.position.set(0, -0.005, 0.205);
  head.add(nose);
  for (const sx of [-1, 1]) {
    // painted-on eyes, like the portrait: big soft-cornered dark ovals
    // lying flat against the face…
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 12), F(0x14100b, { roughness: 0.3 }));
    eye.scale.set(0.92, 1.3, 0.16);
    eye.position.set(sx * 0.058, 0.042, 0.138);
    eye.rotation.y = sx * 0.32; // hugging the head's curve
    head.add(eye);
    // …with ONE big round white shine, high on the eye
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), F(0xf8f5ee, { roughness: 0.4 }));
    glint.scale.set(1, 1, 0.2);
    glint.position.set(sx * 0.058 - 0.013, 0.065, 0.157);
    glint.rotation.y = sx * 0.32;
    head.add(glint);
    // whiskers — three fine white threads a side
    for (let w = 0; w < 3; w++) {
      const whisker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0022, 0.15, 4),
        F(0xf2ede2, { roughness: 0.6 })
      );
      whisker.rotation.z = Math.PI / 2 + sx * (0.14 - w * 0.14);
      whisker.position.set(sx * 0.13, -0.02 + (w - 1) * 0.018, 0.15);
      head.add(whisker);
    }
    // — the BIG ears, rose inside, poking past the hood —
    const ear = new THREE.Group();
    ear.position.set(sx * 0.105, 0.165, -0.015);
    ear.rotation.z = sx * 0.3;
    const outer = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), fur);
    outer.scale.set(1, 1.15, 0.28);
    ear.add(outer);
    const innerEar = new THREE.Mesh(new THREE.IcosahedronGeometry(0.058, 1), earPink);
    innerEar.scale.set(1, 1.12, 0.16);
    innerEar.position.z = 0.018;
    ear.add(innerEar);
    head.add(ear);
  }
  // — the hood: a closed green shell over the WHOLE head; only the
  //   white face pokes out the front, under the brim —
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.186, 16, 12), F(hoodColor));
  hood.scale.set(1.06, 1.04, 0.8);
  hood.position.set(0, 0.03, -0.052);
  hood.userData.isHood = true; // (folded away when you wear a hat)
  head.add(hood);
  // the hood's little cape over the shoulders
  const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.2, 0.24, 9, 1, true), F(hoodColor, { side: THREE.DoubleSide }));
  cape.position.y = 0.52;
  g.add(cape);

  // — ONE thin tail, a single smooth curve trailing behind —
  const tail = new THREE.Group();
  tail.position.set(0, 0.2, -0.13);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.08, -0.12),
    new THREE.Vector3(0.02, -0.13, -0.24),
    new THREE.Vector3(0.05, -0.08, -0.33),
  ]);
  const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 14, 0.013, 5), pinkSkin);
  tail.add(tailMesh);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), pinkSkin);
  tailTip.position.set(0.05, -0.08, -0.33);
  tail.add(tailTip);
  g.add(tail);

  // — the trusty leather pack on the back (the player's badge of honor) —
  if (pack) {
    const packG = buildAdventurerPack();
    packG.scale.setScalar(1.25);
    packG.position.set(0, 0.4, -0.19);
    g.add(packG);
  }

  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  g.userData = { head, tail, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
  return g;
}


// A little classmate mouse — gray or brown, mouse-sized, forever curious.
function buildNPCMouse(tint) {
  const g = new THREE.Group();
  const fur = FUR(tint);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.19, 9, 7), fur);
  body.scale.set(0.85, 0.8, 1.2);
  body.position.y = 0.17;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 9, 7), fur);
  head.position.set(0, 0.32, 0.16);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), FUR(0x2a1c14));
  nose.position.set(0, 0.3, 0.29);
  g.add(body, head, nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), fur);
    ear.scale.z = 0.4;
    ear.position.set(sx * 0.075, 0.43, 0.1);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), FUR(0x14100a));
    eye.position.set(sx * 0.06, 0.34, 0.26);
    g.add(ear, eye);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.026, 0.34, 5), FUR(0xc9a08a));
  tail.rotation.x = 1.1;
  tail.position.set(0, 0.12, -0.3);
  g.add(tail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildHedgehog() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), FUR(0x5a4632));
  body.scale.set(1, 0.78, 1.25);
  body.position.y = 0.23;
  g.add(body);
  // the spiny coat: a crown of little cones over the back
  const spike = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.85, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const u = hash2(i * 1.7, 3.3) * Math.PI * 2;
    const v = 0.15 + hash2(i * 3.1, 7.7) * 0.85; // upper hemisphere only
    const dir = new THREE.Vector3(Math.cos(u) * Math.sin(v * 1.4), Math.cos(v * 1.4) + 0.4, Math.sin(u) * Math.sin(v * 1.4)).normalize();
    const q = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), spike);
    q.position.copy(dir).multiplyScalar(0.27).add(new THREE.Vector3(0, 0.23, -0.04));
    q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(q);
  }
  // pale little face
  const face = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 8), FUR(0xcabb9a));
  face.rotation.x = Math.PI / 2;
  face.position.set(0, 0.16, 0.4);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), FUR(0x1c120a));
  nose.position.set(0, 0.16, 0.56);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), FUR(0x14100a));
    eye.position.set(sx * 0.06, 0.22, 0.42);
    g.add(eye);
  }
  g.add(face, nose);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildRabbit() {
  const g = new THREE.Group();
  const fur = FUR(0x9a8a76);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 7), fur);
  body.scale.set(0.9, 1, 1.3);
  body.position.y = 0.24;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 7), fur);
  head.position.set(0, 0.48, 0.22);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), FUR(0xf0eadd));
  tail.position.set(0, 0.26, -0.32);
  g.add(body, head, tail);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 6), fur);
    ear.position.set(sx * 0.07, 0.74, 0.18);
    ear.rotation.z = -sx * 0.12;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), FUR(0x14100a));
    eye.position.set(sx * 0.09, 0.5, 0.33);
    g.add(ear, eye);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildBird(tint) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), FUR(0x4a4d54));
  body.scale.set(0.7, 0.6, 1.4);
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 6), FUR(tint));
  breast.position.set(0, -0.06, 0.16);
  g.add(body, breast);
  const wings = [];
  const wingMat = FUR(0x3a3d44);
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(sx * 0.12, 0.05, 0);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.4), wingMat);
    wing.position.x = sx * 0.45;
    hinge.add(wing);
    g.add(hinge);
    wings.push({ hinge, sx });
  }
  g.userData.wings = wings;
  return g;
}

function buildFish(tint) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.35, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 9, 7), skin);
  body.scale.set(0.5, 0.62, 1.5);
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 4), skin);
  tail.scale.set(0.35, 1, 1.4);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0, -0.4);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 4), skin);
  fin.scale.set(0.3, 1, 1.2);
  fin.position.set(0, 0.16, -0.05);
  g.add(fin);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), FUR(0x14100a));
    eye.position.set(sx * 0.085, 0.03, 0.24);
    g.add(eye);
  }
  g.userData.tail = tail;
  return g;
}

function buildFrog() {
  const g = new THREE.Group();
  const skin = FUR(0x5a8a3a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
  body.scale.set(1.1, 0.7, 1.2);
  body.position.y = 0.1;
  g.add(body);
  for (const sx of [-1, 1]) {
    const bump = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), skin);
    bump.position.set(sx * 0.07, 0.19, 0.08);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), FUR(0x14100a));
    eye.position.set(sx * 0.07, 0.21, 0.11);
    g.add(bump, eye);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function createCritters(group, landmarks) {
  const find = (kind) => landmarks.filter((l) => l.kind === kind);
  const spotsOf = (...kinds) => {
    const out = [];
    for (const k of kinds) out.push(...find(k));
    return out;
  };

  // 🪲 beetles: home clearing + near the log, berries, pines and meadow
  const beetleSpots = [{ x: 0, z: 0 }, ...spotsOf("log", "berry", "pine", "meadow", "wildflower")];
  const shellMats = [0x2a1f16, 0x3a2416, 0x1e2a16, 0x33261e].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })
  );
  const headMat = new THREE.MeshStandardMaterial({ color: 0x171008, roughness: 0.4 });
  beetleSpots.forEach((spot, si) => {
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), shellMats[(i + si) % shellMats.length]);
      shell.scale.set(0.7, 0.45, 1);
      shell.position.y = 0.07;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), headMat);
      head.position.set(0, 0.05, 0.16);
      b.add(shell, head);
      b.userData = {
        kind: "beetle",
        hx: spot.x + (hash2(i * 1.1, si * 2.7) - 0.5) * 80,
        hz: spot.z + (hash2(i * 5.3, si * 1.3) - 0.5) * 80,
        seed: hash2(i * 3.3, si * 1.7) * 100,
        speed: 0.6 + hash2(i, si + 3) * 0.8,
      };
      group.add(b);
      critters.push(b);
    }
  });

  // 🦔 hedgehogs waddle the forest floor
  spotsOf("log", "pine", "aspen").forEach((spot, si) => {
    for (let i = 0; i < 2; i++) {
      const h = buildAnimal("hedgehog");
      h.userData = {
        kind: "hedgehog",
        hx: spot.x + (hash2(i * 2.9, si * 4.1) - 0.5) * 110,
        hz: spot.z + (hash2(i * 6.3, si * 8.3) - 0.5) * 110,
        seed: hash2(i * 5.1, si * 3.9) * 100,
      };
      group.add(h);
      critters.push(h);
    }
  });

  // 🐇 rabbits bound across the open ground
  [{ x: 0, z: 0 }, ...spotsOf("meadow", "aspen")].forEach((spot, si) => {
    for (let i = 0; i < 2; i++) {
      const r = buildAnimal("rabbit");
      r.userData = {
        kind: "rabbit",
        hx: spot.x + (hash2(i * 3.7, si * 2.1) - 0.5) * 130,
        hz: spot.z + (hash2(i * 8.9, si * 6.7) - 0.5) * 130,
        seed: hash2(i * 4.3, si * 9.1) * 100,
      };
      group.add(r);
      critters.push(r);
    }
  });

  // 🐦 songbirds circle high over the forests and Everbough
  const birdSpots = [...spotsOf("pine", "aspen"), EVERBOUGH_POS];
  const breasts = [0xc06a3a, 0xd8a53a, 0x7a8ac0];
  birdSpots.forEach((spot, si) => {
    for (let i = 0; i < 2; i++) {
      const b = buildAnimal("bluebird");
      Object.assign(b.userData, {
        kind: "bird",
        hx: spot.x,
        hz: spot.z,
        r: 26 + hash2(i, si) * 42,
        h: 24 + hash2(i * 2, si * 3) * 22,
        seed: hash2(i * 7.1, si * 5.3) * 100,
        dir: i % 2 ? 1 : -1,
      });
      group.add(b);
      critters.push(b);
    }
  });

  // 🐸 frogs sit by the creek and the waterfall pool
  const creek = find("creek")[0];
  const frogSpots = [];
  if (creek) {
    for (let i = 0; i < 5; i++) {
      const t = 0.12 + i * 0.18;
      frogSpots.push({
        x: creek.x + (t - 0.5) * 760 + 16,
        z: creek.z + Math.sin(t * Math.PI * 4.4) * 42 + Math.sin(t * Math.PI * 1.7 + 1.3) * 26 + 15,
      });
    }
  }
  // two frogs on the plunge pool's SHORE (lat ±30 clears the water)
  frogSpots.push(
    { x: FALLS_POS.x + FALLS_AX * -5 - FALLS_AZ * 30, z: FALLS_POS.z + FALLS_AZ * -5 + FALLS_AX * 30 },
    { x: FALLS_POS.x + FALLS_AX * -5 + FALLS_AZ * 30, z: FALLS_POS.z + FALLS_AZ * -5 - FALLS_AX * 30 }
  );
  frogSpots.forEach((spot, si) => {
    const f = buildFrog();
    f.userData = { kind: "frog", hx: spot.x, hz: spot.z, seed: hash2(si * 3.1, 8.8) * 100 };
    group.add(f);
    critters.push(f);
  });

  // 🐟 fish porpoise along the creek and circle the plunge pool
  const fishTints = [0xd07038, 0x8fa8b8, 0xc9564a, 0x7a9a6a];
  if (creek) {
    for (let i = 0; i < 10; i++) {
      const f = buildAnimal("trout");
      f.scale.setScalar(0.8 + hash2(i * 1.3, 5.5) * 0.7);
      Object.assign(f.userData, {
        kind: "fish",
        creekX: creek.x,
        creekZ: creek.z,
        span: 0.62 + hash2(i, 2.2) * 0.3, // how much of the creek it patrols
        off: (hash2(i * 3.7, 8.1) - 0.5) * 8, // lane within the water
        speed: 0.016 + hash2(i * 2.1, 4.4) * 0.02,
        seed: hash2(i * 7.9, 1.7) * 100,
      });
      group.add(f);
      critters.push(f);
    }
    for (let i = 0; i < 3; i++) {
      const f = buildAnimal("trout");
      f.scale.setScalar(0.9 + i * 0.25);
      Object.assign(f.userData, {
        kind: "poolfish",
        r: 7 + i * 4,
        seed: hash2(i * 9.3, 6.6) * 100,
        dir: i % 2 ? 1 : -1,
      });
      group.add(f);
      critters.push(f);
    }
  }

  // 🪸 dragonflies over the creek
  if (creek) {
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const d = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.04, 0.55, 5),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x3a8ac0 : 0x3aa06a, roughness: 0.35 })
      );
      body.rotation.x = Math.PI / 2;
      const wingGeo = new THREE.PlaneGeometry(0.5, 0.1);
      const w1 = new THREE.Mesh(wingGeo, wingMat);
      w1.position.set(0.26, 0.04, -0.05);
      const w2 = new THREE.Mesh(wingGeo, wingMat);
      w2.position.set(-0.26, 0.04, -0.05);
      d.add(body, w1, w2);
      d.userData = {
        kind: "dragonfly",
        hx: creek.x + (hash2(i * 1.9, 9.1) - 0.5) * 480,
        hz: creek.z + (hash2(i * 4.7, 2.3) - 0.5) * 80,
        seed: hash2(i * 7.7, 3.1) * 100,
        w1,
        w2,
      };
      group.add(d);
      critters.push(d);
    }
  }

  // 🎓 the school mice: classmates on their stumps, the teacher up front
  const school = find("school")[0];
  if (school) {
    // little Thistles, every one — same build as the player, each in
    // their own tunic color (and no adventurer pack yet; they're students)
    const tunics = [0x8a5a68, 0x5a6a8a, 0xa8843c, 0x6a8a5a, 0x7a5a8a, 0x996a4a];
    const names = ["Clover", "Hazel", "Juniper", "Sorrel", "Wren", "Tansy"];
    const seats = [
      [-4.6, -1.5, 0.84], [-4.6, 0, 0.84], [-4.6, 1.5, 0.84],
      [-2.6, -1.5, 0.84], [-2.6, 0, 0.84], [-2.6, 1.5, 0.84],
    ];
    seats.forEach(([sx, sz, dy], i) => {
      const m = buildThistle({ tunicColor: tunics[i], hoodColor: tunics[i], pack: false });
      m.scale.setScalar(0.82); // classmates are a whisker smaller
      Object.assign(m.userData, {
        kind: "npc",
        sit: true, // bottoms on the stump, knees forward
        hx: school.x + sx,
        hz: school.z + sz,
        dy: dy + 0.07 - 0.24 * 0.82, // seat top, minus hip height at this scale
        face: -Math.PI / 2, // eyes front — toward the blackboard
        seed: hash2(i * 3.7, 8.1) * 100,
      });
      group.add(m);
      critters.push(m);
      SCHOOL_NPCS.push({ key: names[i].toLowerCase(), name: names[i], role: "classmate", mesh: m, x: school.x + sx, z: school.z + sz });
    });
    const teacher = buildThistle({ tunicColor: 0x5d4a38, hoodColor: 0x4a3a2c, pack: false });
    teacher.scale.setScalar(1.05); // the teacher stands tall
    teacher.userData = {
      kind: "npc",
      hx: school.x - 8.4,
      hz: school.z - 0.6,
      dy: 0.42,
      face: Math.PI / 2, // facing the class
      seed: 42,
    };
    group.add(teacher);
    critters.push(teacher);
    SCHOOL_NPCS.push({ key: "willow", name: "Teacher Willow", role: "teacher", mesh: teacher, x: school.x - 8.4, z: school.z - 0.6 });
    // the rest of the staff, out and about the grounds
    const staff = [
      // key, name, role, tunic, hood, scale, local x, z, facing
      ["bramble", "Headmaster Bramble", "headmaster", 0x6a6a72, 0x4a4a52, 1.12, SCHOOL_SPOTS.door[0] + 1.2, SCHOOL_SPOTS.door[1] + 1.4, Math.PI * 0.75],
      ["fern", "Teacher Fern", "teacher", 0x4f7a3a, 0x3f6a2e, 1.02, SCHOOL_SPOTS.garden[0] + 3.6, SCHOOL_SPOTS.garden[1] - 2.2, -Math.PI * 0.6],
      ["tinker", "Master Tinker", "teacher", 0x8a5a2e, 0x6a4422, 1.0, SCHOOL_SPOTS.bench[0] - 1.6, SCHOOL_SPOTS.bench[1] + 0.2, Math.PI / 2],
    ];
    for (const [key, name, role, tunic, hood, sc, lx, lz, face] of staff) {
      const m = buildThistle({ tunicColor: tunic, hoodColor: hood, pack: false });
      m.scale.setScalar(sc);
      Object.assign(m.userData, { kind: "npc", hx: school.x + lx, hz: school.z + lz, dy: 0, face, seed: hash2(lx, lz) * 100 });
      group.add(m);
      critters.push(m);
      SCHOOL_NPCS.push({ key, name, role, mesh: m, x: school.x + lx, z: school.z + lz });
    }
  }

  // 🦌 the WIDER menagerie — every animal keeps to its own country
  const ROAMERS = [
    { name: "squirrel", homes: ["aspen", "pine"], per: 2, range: 13, pace: 0.5, bob: 0.35, gait: 7 },
    { name: "raccoon", homes: ["log", "creek"], per: 1, range: 16, pace: 0.14 },
    { name: "porcupine", homes: ["pine"], per: 1, range: 10, pace: 0.08 },
    { name: "turtle", homes: ["creek"], per: 2, range: 7, pace: 0.045 },
    { name: "river_otter", homes: ["creek"], per: 2, range: 18, pace: 0.32, bob: 0.12, gait: 5 },
    { name: "deer", homes: ["meadow", "aspen"], per: 2, range: 28, pace: 0.1 },
    { name: "mule_deer", homes: ["meadow"], per: 1, range: 28, pace: 0.085 },
    { name: "fox", homes: ["meadow", "tallgrass"], per: 1, range: 24, pace: 0.24 },
    { name: "wolf", homes: ["pine"], per: 1, range: 32, pace: 0.2 },
    { name: "black_bear", homes: ["berry"], per: 1, range: 18, pace: 0.07 },
    { name: "bobcat", homes: ["tallgrass", "pine"], per: 1, range: 22, pace: 0.16 },
    { name: "badger", homes: ["log", "pine"], per: 1, range: 12, pace: 0.09 },
    { name: "coyote", homes: ["tallgrass", "meadow"], per: 1, range: 30, pace: 0.2 },
    { name: "beaver", homes: ["creek"], per: 2, range: 14, pace: 0.11 },
    { name: "moose", homes: ["aspen", "creek"], per: 1, range: 30, pace: 0.07 },
    { name: "turkey", homes: ["meadow", "berry"], per: 2, range: 16, pace: 0.15, bob: 0.1, gait: 6 },
    { name: "bison", homes: ["meadow"], per: 2, range: 26, pace: 0.055 },
    { name: "muskrat", homes: ["creek"], per: 2, range: 9, pace: 0.13 },
    { name: "snake", homes: ["tallgrass", "creek"], per: 2, range: 15, pace: 0.12 },
  ];
  ROAMERS.forEach((spec, ri) => {
    spotsOf(...spec.homes).forEach((spot, si) => {
      for (let i = 0; i < spec.per; i++) {
        const a = buildAnimal(spec.name);
        a.userData = {
          kind: "roamer",
          hx: spot.x + (hash2(i * 2.3 + ri, si * 5.1) - 0.5) * 90,
          hz: spot.z + (hash2(i * 7.1, si * 3.3 + ri) - 0.5) * 90,
          range: spec.range,
          pace: spec.pace,
          bob: spec.bob || 0,
          gait: spec.gait || 5,
          seed: hash2(i * 4.7 + ri * 1.3, si * 6.1) * 100,
        };
        group.add(a);
        critters.push(a);
      }
    });
  });

  // 🪶 woodpeckers — low, busy loops among the pine trunks
  spotsOf("pine").forEach((spot, si) => {
    for (let i = 0; i < 2; i++) {
      const w = buildAnimal("woodpecker");
      Object.assign(w.userData, {
        kind: "bird",
        hx: spot.x,
        hz: spot.z,
        r: 14 + hash2(i, si) * 20,
        h: 8 + hash2(i * 2, si * 3) * 8,
        seed: hash2(i * 6.3, si * 4.9) * 100,
        dir: i % 2 ? 1 : -1,
      });
      group.add(w);
      critters.push(w);
    }
  });

  // 🌺 hummingbirds — jeweled darts over the wildflowers
  spotsOf("wildflower").forEach((spot, si) => {
    for (let i = 0; i < 3; i++) {
      const h = buildAnimal("hummingbird");
      h.userData = {
        kind: "hummingbird",
        hx: spot.x + (hash2(i * 3.1, si * 2.9) - 0.5) * 120,
        hz: spot.z + (hash2(i * 6.7, si * 8.1) - 0.5) * 120,
        seed: hash2(i * 5.9, si * 4.3) * 100,
      };
      group.add(h);
      critters.push(h);
    }
  });
}

function updateCritters(t, center) {
  for (const c of critters) {
    const u = c.userData;
    // SPEED: creatures whose home is far from the mouse aren't visible —
    // skip their animation AND their draw. (Fish patrol the whole creek,
    // so they have no fixed home and always update — there are only a few.)
    if (center && u.hx !== undefined) {
      const dx = u.hx - center.x;
      const dz = u.hz - center.z;
      if (dx * dx + dz * dz > 260 * 260) {
        c.visible = false;
        continue;
      }
      c.visible = true;
    }
    const s = u.seed;
    if (u.kind === "beetle") {
      const a = t * 0.14 * u.speed + s;
      const x = u.hx + Math.cos(a) * 6 + Math.sin(t * 0.4 + s) * 2;
      const z = u.hz + Math.sin(a * 1.3) * 6;
      c.position.set(x, terrainHeight(x, z) + 0.02, z);
      c.rotation.y = -a * 1.2;
    } else if (u.kind === "hedgehog") {
      // a slow, snuffling waddle with little pauses
      const amble = t * 0.045 + Math.sin(t * 0.11 + s) * 0.6;
      const x = u.hx + Math.cos(amble + s) * 11;
      const z = u.hz + Math.sin(amble * 1.4 + s) * 11;
      c.position.set(x, terrainHeight(x, z) + 0.02, z);
      c.rotation.y = -amble - s + Math.PI / 2;
      c.rotation.z = Math.sin(t * 6 + s) * 0.045; // the waddle itself
    } else if (u.kind === "rabbit") {
      if (window.__devRabbitCam === undefined && location.search.includes("rabbitcam")) window.__devRabbitCam = c;
      // bounding hops: moves in arcs, rests between
      const cycle = t * 0.55 + s;
      const hop = Math.max(0, Math.sin(cycle * Math.PI));
      const drift = Math.floor(cycle) * 0.9 + s;
      const x = u.hx + Math.cos(drift) * 14 + Math.cos(cycle * Math.PI) * 1.2;
      const z = u.hz + Math.sin(drift * 1.31) * 14;
      c.position.set(x, terrainHeight(x, z) + hop * 0.85, z);
      c.rotation.y = -drift;
      c.rotation.x = -hop * 0.3; // nose-down mid-leap
    } else if (u.kind === "bird") {
      // wide banking circles over the treetops
      const a = t * (0.14 + (s % 1) * 0.05) * u.dir + s;
      const x = u.hx + Math.cos(a) * u.r;
      const z = u.hz + Math.sin(a) * u.r;
      c.position.set(x, terrainHeight(u.hx, u.hz) + u.h + Math.sin(t * 0.6 + s) * 2, z);
      c.rotation.y = -a - u.dir * Math.PI / 2;
      c.rotation.z = u.dir * 0.28; // bank into the turn
      if (u.wings) for (const w of u.wings) w.hinge.rotation.z = w.sx * Math.sin(t * 7 + s) * 0.4;
    } else if (u.kind === "frog") {
      // sit... sit... HOP
      const ph = ((t * 0.24 + s) % 1 + 1) % 1;
      const hop = ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI) : 0;
      c.position.set(u.hx, terrainHeight(u.hx, u.hz) + hop * 0.6, u.hz);
      c.rotation.y = Math.floor(t * 0.24 + s) * 1.7; // face somewhere new each hop
      c.scale.y = 1 - hop * 0.15 + (ph > 0.9 ? (ph - 0.9) * 1.2 : 0); // crouch wind-up
    } else if (u.kind === "fish") {
      // patrol the winding creek, porpoising up through the surface
      const tri = 1 - Math.abs(1 - 2 * (((t * u.speed + s) % 1) + 1) % 2 % 2); // ping-pong 0..1
      const k = 0.5 + (tri - 0.5) * u.span;
      const px = u.creekX + (k - 0.5) * 760;
      const pz = u.creekZ + Math.sin(k * Math.PI * 4.4) * 42 + Math.sin(k * Math.PI * 1.7 + 1.3) * 26 + u.off;
      // a touch ahead, to face the direction of travel
      const k2 = k + 0.004;
      const qx = u.creekX + (k2 - 0.5) * 760;
      const qz = u.creekZ + Math.sin(k2 * Math.PI * 4.4) * 42 + Math.sin(k2 * Math.PI * 1.7 + 1.3) * 26 + u.off;
      const waterY = terrainHeight(px, pz) + 0.18;
      const arc = Math.max(0, Math.sin(t * 0.9 + s));
      c.position.set(px, waterY - 0.34 + arc * 0.55, pz);
      c.rotation.y = Math.atan2(qx - px, qz - pz);
      c.rotation.x = -Math.cos(t * 0.9 + s) * 0.45 * (arc > 0 ? 1 : 0);
      if (u.tail) u.tail.rotation.y = Math.sin(t * 9 + s) * 0.5;
    } else if (u.kind === "poolfish") {
      // lazy circles in the waterfall's plunge pool
      const px = FALLS_POS.x + FALLS_AX * 2;
      const pz = FALLS_POS.z + FALLS_AZ * 2;
      const a = t * 0.4 * u.dir + s;
      const x = px + Math.cos(a) * u.r;
      const z = pz + Math.sin(a) * u.r;
      const waterY = terrainHeight(px, pz) + 0.9; // the pond's waterline
      const arc = Math.max(0, Math.sin(t * 0.7 + s));
      c.position.set(x, waterY - 0.34 + arc * 0.5, z);
      c.rotation.y = -a - u.dir * Math.PI / 2;
      c.rotation.x = -Math.cos(t * 0.7 + s) * 0.4 * (arc > 0 ? 1 : 0);
      if (u.tail) u.tail.rotation.y = Math.sin(t * 8 + s) * 0.5;
    } else if (u.kind === "npc") {
      // settled in their seat: tiny breaths, an occasional glance around
      c.position.set(u.hx, terrainHeight(u.hx, u.hz) + u.dy + Math.sin(t * 2.1 + s) * 0.012, u.hz);
      if (u.sit && u.legL) {
        u.legL.rotation.x = u.legR.rotation.x = -1.45;
        if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -0.55;
      }
      if (u.lookAt) {
        // in conversation: turn to face them (shortest way round)
        const want = Math.atan2(u.lookAt.x - u.hx, u.lookAt.z - u.hz);
        let d = want - c.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        c.rotation.y += d * 0.15;
      } else {
        c.rotation.y = u.face + Math.sin(t * 0.4 + s) * 0.3 + Math.sin(t * 1.7 + s * 2) * 0.05;
      }
    } else if (u.kind === "roamer") {
      // an unhurried wander around home, always facing its travel
      const amble = t * u.pace + Math.sin(t * 0.09 + s) * 0.7;
      const px = u.hx + Math.cos(amble + s) * u.range;
      const pz = u.hz + Math.sin(amble * 1.37 + s) * u.range;
      const a2 = amble + 0.1;
      const qx = u.hx + Math.cos(a2 + s) * u.range;
      const qz = u.hz + Math.sin(a2 * 1.37 + s) * u.range;
      const trot = u.bob ? Math.abs(Math.sin(t * u.gait + s)) * u.bob : 0;
      c.position.set(px, terrainHeight(px, pz) + trot, pz);
      c.rotation.y = Math.atan2(qx - px, qz - pz);
    } else if (u.kind === "hummingbird") {
      // hover... DART... hover — quick as a wish
      const px = u.hx + Math.sin(t * 0.9 + s) * 9 + Math.sin(t * 3.7 + s * 2.1) * 1.5;
      const pz = u.hz + Math.cos(t * 0.8 + s * 1.4) * 9 + Math.cos(t * 4.3 + s) * 1.5;
      c.position.set(px, terrainHeight(px, pz) + 2.0 + Math.sin(t * 2.9 + s) * 0.5, pz);
      c.rotation.y = Math.atan2(Math.cos(t * 0.9 + s), -Math.sin(t * 0.8 + s * 1.4)) ;
    } else {
      // dragonfly
      const x = u.hx + Math.sin(t * 0.5 + s) * 28 + Math.sin(t * 2.3 + s) * 3;
      const z = u.hz + Math.cos(t * 0.4 + s * 1.4) * 14;
      c.position.set(x, terrainHeight(x, z) + 2.4 + Math.sin(t * 3 + s) * 0.5, z);
      c.rotation.y = t * 0.5 + s;
      const flap = Math.sin(t * 42 + s);
      u.w1.rotation.z = flap * 0.5;
      u.w2.rotation.z = -flap * 0.5;
    }
  }
}

/** Advance every outdoor effect. Called each frame from the game loop. */
export function updateOutsideFX(time, center, night = 0, rain = 0) {
  // 🏡 the cottage chimney: smoke drifting up and away
  for (const puff of denSmoke) {
    const k = ((time * 0.35 + puff.userData.smoke * 0.25) % 1);
    puff.position.set(-1.3 + k * 0.8, 5.1 + k * 2.6, -1 - k * 0.3);
    puff.scale.setScalar(0.6 + k * 1.4);
    puff.material.opacity = 0.55 * (1 - k);
  }
  WIND.uTime.value = time;
  if (leafUniforms) leafUniforms.uCenter.value.copy(center);
  if (pollenUniforms) {
    pollenUniforms.uCenter.value.copy(center);
    pollenUniforms.uNight.value = night;
    pollenUniforms.uRain.value = rain;
  }
  if (rainUniforms) {
    rainUniforms.uCenter.value.copy(center);
    rainUniforms.uRain.value = rain;
  }
  for (const field of grassFields) refillGrassField(field, center.x, center.z);
  refillLitter(center.x, center.z);
  updateButterflies(time, center);
  updateCritters(time, center);
}

// ---- shared materials ----
const grassMat = new THREE.MeshStandardMaterial({ color: 0x6aa83f, roughness: 1, flatShading: true });
// A tiling detail texture for the ground: thousands of tiny blade strokes and
// dirt flecks in near-neutral tones, so the vertex colors keep the hue while
// the texture adds up-close realism (and bump for the light to catch).
function makeGroundDetail() {
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#dfe4d2";
  ctx.fillRect(0, 0, s, s);
  // grass blade strokes
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const len = 3 + Math.random() * 7;
    const a = -0.4 + Math.random() * 0.8;
    ctx.strokeStyle =
      Math.random() > 0.5
        ? `rgba(70, 105, 45, ${0.10 + Math.random() * 0.18})`
        : `rgba(240, 248, 225, ${0.08 + Math.random() * 0.14})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len);
    ctx.stroke();
  }
  // bare-earth flecks
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(110, 85, 55, ${0.05 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
const groundDetail = makeGroundDetail();
// tile roughly every 9 world units across the whole ground plane
groundDetail.repeat.setScalar(Math.round(((46 * OUTDOOR_SCALE + 40) * 2) / 9));

// The terrain uses per-vertex colors (green flats, browner slopes) multiplied
// by the detail texture, plus a bump so the grass catches the light.
const groundMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  map: groundDetail,
  bumpMap: groundDetail,
  bumpScale: 0.35,
  roughness: 1,
  flatShading: true, // chunky faceted low-poly, like the concept art
});
const darkGrassMat = new THREE.MeshStandardMaterial({ color: 0x3c5f26, roughness: 1, flatShading: true });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5b4029, roughness: 1, flatShading: true });
const barkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1, flatShading: true });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8880, roughness: 1, flatShading: true });
// Living water: rolling waves of light and dark blue with sun sparkles,
// driven by the shared WIND clock. Fog-aware so it fades into the haze.
const waterMat = new THREE.ShaderMaterial({
  transparent: true,
  fog: true,
  side: THREE.DoubleSide, // the winding creek ribbon must show from any bend
  uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uTime: WIND.uTime, // shared clock (assigned after clone so it stays shared)
    uIce: { value: 0 }, // ❄️ 0 = water, 1 = frozen solid (winter)
  }),
  vertexShader: /* glsl */ `
    #include <fog_pars_vertex>
    uniform float uTime;
    uniform float uIce;
    attribute float aSide;
    varying vec3 vWp;
    varying float vSide;
    void main() {
      vSide = aSide;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      // little rolling swells (stilled when it freezes)
      wp.y += sin(uTime * 1.2 + wp.x * 0.22 + wp.z * 0.18) * 0.12 * (1.0 - abs(aSide)) * (1.0 - uIce);
      vWp = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    #include <fog_pars_fragment>
    uniform float uTime;
    uniform float uIce;
    varying vec3 vWp;
    varying float vSide;
    void main() {
      float w1 = sin(vWp.x * 0.35 + uTime * 1.3) * sin(vWp.z * 0.28 + uTime * 0.9);
      float w2 = sin(vWp.x * 1.1 - uTime * 2.0 + vWp.z * 0.9);
      float m = 0.5 + 0.32 * w1 + 0.18 * w2;
      vec3 col = mix(vec3(0.02, 0.34, 0.42), vec3(0.30, 0.78, 0.78), m);
      // sun glitter: two waves at unrelated frequencies so the sparkles
      // scatter naturally instead of forming a polka-dot grid
      float sp1 = sin(vWp.x * 2.3 + uTime * 2.6) * sin(vWp.z * 2.1 - uTime * 2.2);
      float sp2 = sin(vWp.x * 6.13 - uTime * 1.7 + vWp.z * 3.71);
      col += smoothstep(0.955, 1.0, sp1 * sp2) * 0.5;
      // white foam clinging to the banks, nibbled by little waves
      float edge = abs(vSide);
      float foamLine = 0.78 + 0.08 * sin(vWp.x * 0.9 + vWp.z * 0.7 + uTime * 1.8);
      col = mix(col, vec3(0.94, 0.98, 1.0), smoothstep(foamLine, 0.98, edge));
      // ❄️ winter: frosty blue-white ice with a few pale cracks
      if (uIce > 0.0) {
        float crack = smoothstep(0.97, 1.0, abs(sin(vWp.x * 0.7 + sin(vWp.z * 0.5) * 2.0)));
        vec3 ice = mix(vec3(0.74, 0.88, 0.96), vec3(0.92, 0.97, 1.0), 0.5 + 0.5 * sin(vWp.x * 0.13 + vWp.z * 0.11));
        ice = mix(ice, vec3(1.0), crack * 0.7);
        col = mix(col, ice, uIce);
      }
      gl_FragColor = vec4(col, mix(0.92, 1.0, uIce));
      #include <fog_fragment>
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
waterMat.uniforms.uTime = WIND.uTime;
/** ❄️ freeze the forest's water (0 → 1) and dust the ground with snow (0 → 1) */
export function setWinter(ice, snow) {
  waterMat.uniforms.uIce.value = ice;
  groundMat.emissive.setRGB(0.55 * snow, 0.58 * snow, 0.62 * snow);
  darkGrassMat.color.setHex(0x3c5f26).lerp(new THREE.Color(0xdde6ee), snow * 0.7);
}

// A floating name tag (same idea as in the den).
function makeLabel(text) {
  // 🪧 crisp, high-res, bright outlined letters (see signs.js)
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: signTexture(text, "wood", 4.5), transparent: true, depthTest: true, toneMapped: false, fog: false,
  }));
  sp.scale.set(4.4, 0.98, 1);
  return sp;
}

function makeTree(foliageColor, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.2, 6), barkMat);
  trunk.position.y = 0.6; trunk.castShadow = true;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2.6, 7),
    new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 1, flatShading: true })
  );
  foliage.position.y = 2.3; foliage.castShadow = true;
  g.add(trunk, foliage);
  g.scale.setScalar(scale);
  return g;
}

function makeFlower(color) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4), darkGrassMat);
  stem.position.y = 0.17;
  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true })
  );
  head.position.y = 0.36;
  g.add(stem, head);
  return g;
}

// Build one landmark of a given kind, centered at (0,0) in its own group.
// `entry` gives world placement for kinds that drape over the terrain (creek).
function buildPlace(kind, entry) {
  const g = new THREE.Group();
  const flowerColors = [0xff6f91, 0xffd54a, 0x9b6bd6, 0xff8a3d, 0xf4f0e6];

  if (kind === "aspen" || kind === "pine") {
    const color = kind === "aspen" ? 0xd9c23a : 0x2f5a32; // yellow vs dark green
    const spots = [[0, 0], [2, 1.5], [-2, 1], [1.5, -2], [-1.8, -1.6], [0.4, 2.4]];
    for (const [x, z] of spots) {
      const t = makeTree(color, 0.9 + (Math.abs(x) % 1) * 0.4);
      t.position.set(x, 0, z);
      g.add(t);
    }
  } else if (kind === "well") {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.0, 14, 1, true), stoneMat);
    ring.position.y = 0.5;
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.85, 14), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.y = 0.45;
    g.add(ring, water);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6), barkMat);
      post.position.set(sx, 1.3, 0); g.add(post);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 4), barkMat);
    roof.rotation.y = Math.PI / 4; roof.position.y = 2.4; g.add(roof);
    // 🌿 ivy spills down one side of the stone — the mouse's ladder in.
    const ivyMats = [0x2e6b34, 0x3f7a3a, 0x24552a].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })
    );
    for (let sI = 0; sI < 5; sI++) {
      const a = 0.9 + sI * 0.3 + (sI % 2) * 0.09; // one arc of the wall
      const leaves = 6 + (sI % 3);
      for (let li = 0; li < leaves; li++) {
        const t = li / (leaves - 1);
        const rr = 1.05 + Math.sin(t * 9 + sI) * 0.03; // hugs the outer wall
        const leaf = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.085 + ((li + sI) % 3) * 0.03, 0),
          ivyMats[(li + sI) % 3]
        );
        leaf.position.set(Math.cos(a + t * 0.14) * rr, 1.02 - t, Math.sin(a + t * 0.14) * rr);
        leaf.scale.set(1, 0.7, 0.55);
        leaf.rotation.set(t * 2, a, t);
        g.add(leaf);
      }
    }
    // leafy tufts gripping the rim…
    for (let i = 0; i < 4; i++) {
      const a = 1.0 + i * 0.28;
      const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), ivyMats[i % 3]);
      tuft.position.set(Math.cos(a) * 0.98, 1.04, Math.sin(a) * 0.98);
      tuft.scale.set(1, 0.55, 1);
      g.add(tuft);
    }
    // …and two strands dropping INSIDE, down into the dark
    for (const [ia, len] of [[1.1, 0.35], [1.35, 0.5]]) {
      for (let li = 0; li < 5; li++) {
        const t = li / 4;
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), ivyMats[li % 3]);
        leaf.position.set(Math.cos(ia) * 0.88, 0.98 - t * len, Math.sin(ia) * 0.88);
        leaf.scale.set(1, 0.7, 0.55);
        g.add(leaf);
      }
    }
  } else if (kind === "school") {
    // 🎓 THE FALLEN LOG SCHOOL, v2 — built in WORLD units (mouse scale!):
    // a grand hollow log schoolhouse with ramps up to its mouths, the
    // blackboard and bookcase INSIDE, stump seats, a rug, a garden, a bell.
    const logR = 4.4;
    const logLen = 27;
    const shell = new THREE.Group();
    const barkOut = new THREE.Mesh(new THREE.CylinderGeometry(logR, logR * 1.06, logLen, 26, 1, true), barkMat);
    barkOut.castShadow = true;
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(logR * 0.94, logR * 0.99, logLen * 1.001, 26, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x33221a, roughness: 1, side: THREE.BackSide })
    );
    shell.add(barkOut, inner);
    for (const e of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(logR * 0.97, 0.22, 8, 26), barkMat);
      rim.position.y = (e * logLen) / 2;
      rim.rotation.x = Math.PI / 2;
      shell.add(rim);
    }
    shell.rotation.z = Math.PI / 2; // a tunnel along X
    shell.position.y = logR;
    g.add(shell);
    // mossy roof + toadstools so it reads old and loved
    for (let i = 0; i < 7; i++) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(1.1 + (i % 3) * 0.5, 8, 6), darkGrassMat);
      moss.scale.y = 0.35;
      moss.position.set((i - 3) * 3.6, logR * 1.92, i % 2 ? 0.9 : -0.7);
      g.add(moss);
    }
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x7a5836, roughness: 1, flatShading: true });
    // ---- INSIDE the log ----
    // the rug the whole class sits on
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 18),
      new THREE.MeshStandardMaterial({ color: 0x8a4a3a, roughness: 1 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-3.4, 0.42, 0);
    g.add(rug);
    // the BLACKBOARD, deep inside, chalked with today's lesson
    // (crisp chalk letters, see signs.js)
    const bbTex = signTexture("To-day:\nwhat do the stars remember?\n☾ ✶ ✶", { bg: "#22352c", frame: "#6b4a2c", ink: "#f4f0e4" }, 3.2 / 2.1);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 2.1, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x2a3a30, roughness: 1 })
    );
    const boardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.1),
      new THREE.MeshBasicMaterial({ map: bbTex, toneMapped: false })
    );
    board.position.set(-9.6, 1.75, 0);
    boardFace.position.set(-9.5, 1.75, 0);
    boardFace.rotation.y = Math.PI / 2;
    g.add(board, boardFace);
    // teacher's desk before the board
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.7), rampMat);
    desk.position.set(-7.6, 0.85, 1.5);
    g.add(desk);
    for (const [dx, dz] of [[-0.4, 1.0], [0.4, 2.0]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.8, 6), barkMat);
      leg.position.set(-7.6 + dx, 0.45, dz);
      g.add(leg);
    }
    // 📚 the bookcase, snug against the inner wall
    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.7, 2.6), barkMat);
    shelf2.position.set(-6.4, 1.25, -2.6);
    shelf2.rotation.y = 0.35;
    g.add(shelf2);
    const bookCols = [0xa8434f, 0x3f6fa8, 0x4a8a4f, 0xc8a03a, 0x7a4fa8, 0x9a5a3a, 0xa8434f, 0x4a8a4f];
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 4; i++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.52, 0.16),
          new THREE.MeshStandardMaterial({ color: bookCols[r * 4 + i], roughness: 0.85 })
        );
        const bx = -6.4 + Math.sin(0.35) * (i - 1.5) * 0.24;
        const bz = -2.6 + Math.cos(0.35) * (i - 1.5) * 0.24;
        book.position.set(bx - 0.18, 0.75 + r * 0.72, bz);
        book.rotation.y = 0.35;
        book.rotation.z = ((i + r) % 3 - 1) * 0.05;
        g.add(book);
      }
    }
    // stump seats in two neat rows, facing the board
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.4, 0.42, 8), barkMat);
        seat.position.set(-4.6 + r * 2.0, 0.63, (c - 1) * 1.5);
        g.add(seat);
      }
    }
    // the empty "new student" stump in the back row — with a leaf cushion,
    // saved for YOU (walk up and press E to sit)
    {
      const [nx, nz] = SCHOOL_SPOTS.seat;
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.4, 0.42, 8), barkMat);
      seat.position.set(nx, 0.63, nz);
      const cushion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.32, 0.07, 8),
        new THREE.MeshStandardMaterial({ color: 0x6aa83f, roughness: 1, flatShading: true })
      );
      cushion.position.set(nx, 0.87, nz);
      g.add(seat, cushion);
    }
    // ---- THE WORKSHOP: a lean-to by the north wall ----
    {
      const [wx, wz] = SCHOOL_SPOTS.bench;
      for (const [px, pz, ph] of [[-2.2, -1.4, 2.2], [2.2, -1.4, 2.2], [-2.2, 1.4, 3.2], [2.2, 1.4, 3.2]]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, ph, 6), barkMat);
        post.position.set(wx + px, ph / 2, wz + pz);
        g.add(post);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 3.6), rampMat);
      roof.position.set(wx, 2.75, wz);
      roof.rotation.x = 0.38; // sloped: low at the back, high toward the school
      g.add(roof);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1.0), rampMat);
      bench.position.set(wx, 0.86, wz);
      g.add(bench);
      for (const [lx, lz] of [[-1.1, -0.35], [1.1, -0.35], [-1.1, 0.35], [1.1, 0.35]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 5), barkMat);
        leg.position.set(wx + lx, 0.4, wz + lz);
        g.add(leg);
      }
      // tools: a pebble hammer, a thorn awl, a twine spool, wood shavings
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), barkMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(wx - 0.6, 0.97, wz + 0.1);
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), stoneMat);
      head.position.set(wx - 0.9, 0.99, wz + 0.1);
      const spool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xc9b06a, roughness: 1 })
      );
      spool.position.set(wx + 0.7, 1.04, wz - 0.15);
      const awl = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.4, 5), stoneMat);
      awl.rotation.z = Math.PI / 2;
      awl.position.set(wx + 0.15, 0.97, wz + 0.25);
      g.add(handle, head, spool, awl);
      for (let i = 0; i < 6; i++) {
        const shav = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI * 1.4), rampMat);
        shav.position.set(wx - 0.8 + i * 0.35, 0.03, wz + 0.9 + (i % 2) * 0.2);
        shav.rotation.x = Math.PI / 2;
        g.add(shav);
      }
      // a workshop sign
      const sign = signBoard("WORKSHOP", { w: 2.1, h: 0.62, style: "wood" });
      sign.position.set(wx, 2.35, wz + 1.55);
      g.add(sign);
    }
    // warm lantern hanging inside
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.5, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb84a, emissiveIntensity: 2.2 })
    );
    cage.position.set(-3.4, logR * 1.4, 0);
    g.add(cage);
    const schoolLight = new THREE.PointLight(0xffb060, 30, 15, 1.8);
    schoolLight.position.set(-3.4, logR * 1.35, 0);
    g.add(schoolLight);
    // ---- OUTSIDE ----
    // 🔔 the school bell by the east mouth
    const bellPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.4, 6), barkMat);
    bellPost.position.set(logLen / 2 + 4.5, 1.7, -3.4);
    const bellArm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.14), barkMat);
    bellArm.position.set(logLen / 2 + 4.9, 3.3, -3.4);
    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.44, 8),
      new THREE.MeshStandardMaterial({ color: 0xc8a03a, roughness: 0.4, metalness: 0.4 })
    );
    bell.position.set(logLen / 2 + 5.3, 3.05, -3.4);
    g.add(bellPost, bellArm, bell);
    // 🌱 the fenced garden, mouse rows
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 5), barkMat);
      post.position.set(7 + Math.cos(a) * 3.2, 0.45, 7 + Math.sin(a) * 2.6);
      g.add(post);
    }
    for (let i = 0; i < 10; i++) {
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 5), darkGrassMat);
      sprout.position.set(5.6 + (i % 5) * 0.7, 0.28, 6 + Math.floor(i / 5) * 1.4);
      g.add(sprout);
    }
    const pumpkin = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xd8792a, roughness: 0.8, flatShading: true })
    );
    pumpkin.scale.y = 0.75;
    pumpkin.position.set(8.6, 0.3, 8.2);
    g.add(pumpkin);
  } else if (kind === "tallgrass") {
    // (the real Tall Grass is the giant maze built by createTallGrassMaze —
    // this landmark group only carries the floating name tag)
  } else if (kind === "log") {
    // A REAL fallen log: hollow all the way through — the mouse can crawl in!
    const logR = 0.75;
    const logLen = 4.6;
    const shell = new THREE.Group();
    const barkOut = new THREE.Mesh(
      new THREE.CylinderGeometry(logR, logR * 1.08, logLen, 24, 1, true),
      barkMat
    );
    barkOut.castShadow = true;
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(logR * 0.93, logR * 0.99, logLen * 1.001, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 1, side: THREE.BackSide })
    );
    shell.add(barkOut, inner);
    // weathered rims around both open mouths
    for (const e of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(logR * 0.96, 0.055, 8, 22), barkMat);
      rim.position.y = (e * logLen) / 2;
      rim.rotation.x = Math.PI / 2;
      shell.add(rim);
    }
    shell.rotation.z = Math.PI / 2; // lie on its side: a tunnel along X
    shell.position.y = logR;
    g.add(shell);
    // moss cushions on top + a few mushrooms so it reads old and damp
    for (let i = 0; i < 5; i++) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.26 + (i % 3) * 0.09, 8, 6), darkGrassMat);
      moss.scale.y = 0.35;
      moss.position.set((i - 2) * 0.82, logR * 1.86, i % 2 ? 0.22 : -0.18);
      g.add(moss);
    }
    for (const [mx, mz] of [[-1.6, 0.9], [1.9, -0.8]]) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1 }));
      stem.position.set(mx, 0.11, mz);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa94f38, roughness: 1 }));
      cap.position.set(mx, 0.22, mz);
      g.add(stem, cap);
    }
  } else if (kind === "berry") {
    // A thicket, not a blob: overlapping foliage mounds heavy with dark fruit.
    const greens = [0x2e5024, 0x3a6030, 0x24421e];
    for (const [bx, bz, br, gi] of [[0, 0, 1.15, 0], [0.95, 0.3, 0.85, 1], [-0.9, -0.25, 0.8, 2], [0.15, -0.85, 0.7, 1]]) {
      const blob = new THREE.Mesh(
        new THREE.IcosahedronGeometry(br, 1),
        new THREE.MeshStandardMaterial({ color: greens[gi], roughness: 1, flatShading: true })
      );
      blob.position.set(bx, br * 0.82, bz);
      blob.castShadow = true;
      g.add(blob);
    }
    const berryMat = new THREE.MeshStandardMaterial({ color: 0x5a2148, roughness: 0.35 });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const rr = 0.8 + (i % 4) * 0.22;
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.1 + (i % 3) * 0.03, 8, 6), berryMat);
      berry.position.set(Math.cos(a) * rr, 0.55 + ((i * 37) % 10) / 10, Math.sin(a) * rr * 0.9);
      g.add(berry);
    }
  } else if (kind === "wildflower" || kind === "meadow") {
    // NO built-in blooms: at landmark scale (7x) the old makeFlower petals
    // became purple monsters taller than the mouse. The real downloaded
    // flower models carpet these biomes at mouse scale instead (BIOME_SPECS),
    // extra-dense at the patch's heart — see fillBiomes.
  } else if (kind === "creek") {
    // A REAL creek: a long, winding ribbon of living water draped over the
    // terrain, built in world units (buildObject skips LANDMARK_SCALE for it).
    const L = 760; // how far the creek runs
    const W = 13; // half-width of the water
    const SEGS = 150;
    const ox = entry ? entry.x || 0 : 0;
    const oz = entry ? entry.z || 0 : 0;
    const oy = terrainHeight(ox, oz);
    const path = [];
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS;
      path.push([
        (t - 0.5) * L,
        Math.sin(t * Math.PI * 4.4) * 42 + Math.sin(t * Math.PI * 1.7 + 1.3) * 26,
      ]);
    }
    const verts = [];
    const sides = []; // -1 = left bank, +1 = right bank (drives edge foam)
    const idx = [];
    for (let i = 0; i <= SEGS; i++) {
      const [x, z] = path[i];
      const [px, pz] = path[Math.max(0, i - 1)];
      const [nx, nz] = path[Math.min(SEGS, i + 1)];
      let dx = nx - px;
      let dz = nz - pz;
      const dl = Math.hypot(dx, dz) || 1;
      const lx = -dz / dl; // sideways (bank-to-bank) direction
      const lz = dx / dl;
      const half = W * (0.72 + 0.28 * Math.sin(i * 0.7)); // the banks breathe
      // the surface sits over the highest ground under it (drawn or calculated), so it always shows
      const level = Math.max(...[-1, -0.5, 0, 0.5, 1].map((s) => groundTop(ox + x + lx * half * s, oz + z + lz * half * s))) - oy + 0.28;
      for (const s of [-1, 1]) {
        const wx = x + lx * half * s;
        const wz = z + lz * half * s;
        verts.push(wx, level, wz);
        sides.push(s);
      }
      if (i < SEGS) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("aSide", new THREE.Float32BufferAttribute(sides, 1));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, waterMat));

    // 🌉 A little wooden plank bridge across the middle of the creek —
    // rope rails, weathered posts, just wide enough for a brave mouse.
    const mid = path[Math.floor(SEGS / 2)];
    const before = path[Math.floor(SEGS / 2) - 2];
    const after = path[Math.floor(SEGS / 2) + 2];
    const bdx = after[0] - before[0];
    const bdz = after[1] - before[1];
    const bl = Math.hypot(bdx, bdz) || 1;
    const sx = -bdz / bl; // across-the-water direction
    const sz = bdx / bl;
    const span = 46;
    const yA = terrainHeight(ox + mid[0] + sx * (span / 2), oz + mid[1] + sz * (span / 2)) - oy;
    const yB = terrainHeight(ox + mid[0] - sx * (span / 2), oz + mid[1] - sz * (span / 2)) - oy;
    // an ARCHED plank bridge: each end rests on its own bank, the middle
    // lifts clear of the water, and every post is planted in the ground
    const bridge = new THREE.Group();
    bridge.position.set(mid[0], 0, mid[1]);
    bridge.rotation.y = Math.atan2(sx, sz); // local +z runs along (sx, sz)
    const gAt = (lz) => terrainHeight(ox + mid[0] + sx * lz, oz + mid[1] + sz * lz) - oy;
    const H = 21.7; // half the deck length
    const deck = (lz) => {
      const k = (lz + H) / (2 * H);
      const ends = gAt(-H) + (gAt(H) - gAt(-H)) * k;
      return Math.max(ends + 0.3 + Math.sin(k * Math.PI) * 1.8, gAt(lz) + 0.3);
    };
    const rails = { "-1": [], "1": [] };
    for (let p = 0; p < 15; p++) {
      const lz = (p - 7) * 3.1;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, 2.6), barkMat);
      plank.position.set(0, deck(lz), lz);
      plank.rotation.x = -Math.atan2(deck(lz + 1) - deck(lz - 1), 2); // follow the arch
      plank.rotation.y = (hash2(p, 3.3) - 0.5) * 0.06; // slightly uneven planks
      plank.castShadow = true;
      bridge.add(plank);
      for (const side of [-1, 1]) rails[side].push(new THREE.Vector3(side * 3.4, deck(lz) + 2.2, lz));
    }
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc9b06a, roughness: 1 });
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) {
        const lz = end * 21.5;
        const base = gAt(lz) - 0.6; // sunk into the bank
        const top = deck(lz) + 2.6;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, top - base, 7), barkMat);
        post.position.set(side * 3.4, (top + base) / 2, lz);
        post.castShadow = true;
        bridge.add(post);
      }
      const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rails[side]), 30, 0.16, 5, false), ropeMat);
      bridge.add(rope);
    }
    g.add(bridge);
    Object.assign(CREEK_BRIDGE, { x: ox + mid[0], z: oz + mid[1], sx, sz, ready: true });
  }
  return g;
}

// How high a landmark's name tag floats, by kind.
function labelHeight(kind) {
  if (kind === "school") return 1.35;
  if (kind === "house") return 8;
  if (kind === "aspen" || kind === "pine") return 5;
  return 2.4;
}

// The DEFAULT layout: every map place at its spot from the map. The editor
// and game both start from this if there's no saved layout.
export const DEFAULT_LAYOUT = PLACES.map((p, i) => {
  const w = toWorld(p);
  return { id: "place" + i, kind: p.kind, name: p.name, x: w.x, z: w.z, rot: 0, scale: 1 };
});

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();

// If a model loaded with NO texture, paint the given one onto it (used for
// textures pulled out of a .unitypackage that didn't auto-attach).
function applyTextureHint(model, url) {
  let hasMap = false;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((m) => m && m.map)) hasMap = true;
  });
  if (hasMap) return; // it already has a texture — leave it alone

  textureLoader.load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    model.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        m.map = tex;
        if (m.color) m.color.set(0xffffff); // don't tint the texture dark
        m.needsUpdate = true;
      });
    });
  });
}

// Load a model file and hand back a three.js object — works for GLB/GLTF
// AND the FBX / OBJ models that Unity (and most 3D sites) use. This is the
// "convert Unity models into three.js" part.
export function loadModelFile(url, onReady) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (ext === "fbx") {
    fbxLoader.load(url, (obj) => onReady(obj), undefined, (e) =>
      console.error("Couldn't load FBX", url, e)
    );
  } else if (ext === "obj") {
    objLoader.load(
      url,
      (obj) => {
        // OBJ files often have no material — give those a neutral one.
        obj.traverse((o) => {
          if (o.isMesh && (!o.material || (Array.isArray(o.material) && !o.material.length))) {
            o.material = new THREE.MeshStandardMaterial({ color: 0xb0a487, roughness: 1, flatShading: true });
          }
        });
        onReady(obj);
      },
      undefined,
      (e) => console.error("Couldn't load OBJ", url, e)
    );
  } else {
    gltfLoader.load(url, (gltf) => onReady(gltf.scene), undefined, (e) =>
      console.error("Couldn't load GLB/GLTF", url, e)
    );
  }
}

// How tall (in world units) each KIND of nature model should be. The mouse
// is about 0.45 tall, so trees at ~11 tower over it while grass/pebbles stay
// small — this replaces the old "everything is 6 units tall" sizing that made
// clovers and pebbles as big as trees.
function targetHeightFor(url) {
  const n = url.toLowerCase();
  // Sizes are in world units; the mouse is ~0.45 tall. Everything is set for
  // a MOUSE'S-EYE view: trees are ~100x the mouse (towering giants), grass and
  // ferns arch overhead, flowers loom, and "pebbles" are little boulders.
  if (/twistedtree|commontree|pine_\d/.test(n)) return 45; // giant trees
  if (/plant_\d+_big/.test(n)) return 7;
  if (/bush/.test(n)) return 8;
  if (/fern/.test(n)) return 5.5;
  if (/plant_/.test(n)) return 4.5;
  if (/models\/flowers\//.test(n)) return 3.4; // the downloaded blooms
  if (/models\/props\/crystal/.test(n)) return 2.2; // moonstone shards
  const am = n.match(/models\/animals\/(\w+)\.glb/);
  if (am) return ANIMAL_HEIGHTS[am[1]] || 2; // real animals, real sizes
  if (/flower/.test(n)) return 4;
  if (/clover/.test(n)) return 1.3;
  if (/petal/.test(n)) return 1.1;
  if (/grass_\w*tall/.test(n)) return 4.2; // taller than the mouse
  if (/grass_/.test(n)) return 2.3;
  if (/mushroom/.test(n)) return 2.2;
  if (/rock_medium/.test(n)) return 5.5; // boulders
  if (/pebble/.test(n)) return 0.8;
  return 8; // unknown / uploaded models
}

// How far the mouse must stay away from a thing (0 = walk right through it).
// Only big, solid stuff blocks you; grass, flowers, clover, etc. don't.
// The LOWEST ground under a thing's footprint — bushes and trees sit on
// slopes without their downhill side floating in the air.
function groundY(x, z, r) {
  let y = terrainHeight(x, z);
  if (r > 0) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      y = Math.min(y, terrainHeight(x + Math.cos(a) * r, z + Math.sin(a) * r));
    }
  }
  return y;
}

function colliderRadius(entry) {
  if (entry.modelUrl) {
    const n = entry.modelUrl.toLowerCase();
    const s = entry.scale || 1;
    if (/twistedtree|commontree|pine_\d/.test(n)) return 3.1 * s; // giant trunks — no clipping inside
    if (/rock_medium/.test(n)) return 3.6 * s; // boulders (as wide as they LOOK)
    if (/kenney\/rock|kenney\/stone|cliff_/.test(n)) return 1.3 * s; // Kenney rocks placed in the editor
    if (/bush/.test(n)) return 2.2 * s;
    if (/mushroom/.test(n)) return 0.55 * s; // solid little stools
    if (/pebble/.test(n)) return 0.4 * s;
    return 0; // grass, flowers, ferns — soft things you brush through
  }
  const s = (entry.scale || 1) * LANDMARK_SCALE;
  switch (entry.kind) {
    // the log and school are hollow — their tube walls collide separately
    case "well": return 1.06 * s; // solid stone; the ivy side is the way in
    case "aspen":
    case "pine": return 2.6 * s; // the old grove hearts still block
    case "berry": return 1.2 * s;
    default: return 0;
  }
}

// We load each model file only ONCE and keep it here, then CLONE it for every
// copy in the world — so hundreds of trees stay fast.
const modelCache = {};
// models exported lying on their side (their height runs along Z)
const Z_UP_MODELS = new Set(["/models/animals/rabbit.glb"]);
function getBaseModel(url) {
  if (modelCache[url]) return modelCache[url];
  modelCache[url] = new Promise((resolve) => {
    loadModelFile(url, (m) => {
      m.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        // Some low-poly models store colors in the mesh's VERTICES.
        const hasVertexColors = o.geometry?.attributes?.color;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((mt) => {
          if (!mt) return;
          if (hasVertexColors) {
            mt.vertexColors = true;
            if (mt.color) mt.color.set(0xffffff);
          }
          // Grass blades and leaf cards are thin — draw both faces so they
          // don't wink out when you look at them edge-on.
          mt.side = THREE.DoubleSide;
          // Crisper textures on the ground and off in the distance.
          if (mt.map) mt.map.anisotropy = 8;
          if (mt.normalMap) {
            mt.normalMap.anisotropy = 8;
            mt.normalScale.set(1.2, 1.2); // let the bark relief read a bit more
          }
          mt.needsUpdate = true;
        });
      });
      // a few models are built lying down ("Z-up") — stand them upright
      // inside a wrapper, so the facing turn (rotation.y) still works after
      if (Z_UP_MODELS.has(url)) {
        const wrap = new THREE.Group();
        m.rotation.x = -Math.PI / 2;
        wrap.add(m);
        m = wrap;
      }
      // size it by its KIND (trees tall, pebbles tiny) and stand it on the ground
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(m).getSize(size);
      // let living things sway in the wind (in the model's own units)
      applyWind(m, url, size.y || 1);
      m.scale.setScalar(targetHeightFor(url) / (size.y || 1));
      const b2 = new THREE.Box3().setFromObject(m);
      m.position.y = -b2.min.y;
      resolve(m);
    });
  });
  return modelCache[url];
}

// Build ONE world object — either a built-in landmark ("kind") or an
// uploaded 3D model ("modelUrl") — as a group placed in the world.
export function buildObject(entry) {
  const root = new THREE.Group();
  // Sit it on the LOWEST ground under its footprint — on hills this keeps
  // bushes and trees from floating off the downhill side of a slope.
  const footR = entry.modelUrl
    ? colliderRadius(entry) * 0.9
    : entry.kind === "berry"
      ? 8
      : 0;
  root.position.set(entry.x || 0, groundY(entry.x || 0, entry.z || 0, footR) + (entry.yOff || 0), entry.z || 0);
  root.rotation.y = entry.rot || 0;
  root.scale.setScalar(entry.scale || 1);
  root.userData.entry = entry;
  root.userData.collide = colliderRadius(entry); // 0 = walk-through scenery

  if (entry.modelUrl) {
    getBaseModel(entry.modelUrl).then((base) => {
      const m = base.clone(true); // a cheap copy of the shared model
      root.add(m);
      if (entry.textureHint) applyTextureHint(m, entry.textureHint);
    });
  } else {
    const lm = buildPlace(entry.kind, entry);
    // the creek is built directly in world units (it drapes over the terrain)
    // the creek and the school are built directly in world units
    if (entry.kind !== "creek" && entry.kind !== "school") lm.scale.setScalar(LANDMARK_SCALE);
    root.add(lm);
  }

  // Name tags only on the landmarks / single uploads — not scattered scenery.
  if (!entry.noLabel) {
    const label = makeLabel(entry.name || "thing");
    label.scale.set(11, 2.8, 1);
    label.position.y = entry.modelUrl ? 7 : labelHeight(entry.kind) * LANDMARK_SCALE;
    root.add(label);
  }

  return root;
}

// Build the whole outdoors from a layout (defaults to the map layout).
// Returns the group, the list of editable objects, and the ground mesh.
export function buildOutside(layout) {
  const group = new THREE.Group();
  // sculpted terrain must be live BEFORE the ground mesh samples it
  const layIn = layout && layout.length ? layout : DEFAULT_LAYOUT;
  setTerrainBumps(layIn.filter((e) => e.kind === "bump"));

  // --- Big rolling grassy ground (a subdivided plane pushed into hills) ---
  const groundSize = GROUND_SIZE; // room for the mountain ring
  const seg = GROUND_SEG; // grid resolution — more = smoother hills, slower to build
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, seg, seg);
  const gp = groundGeo.attributes.position;
  // The plane lies in its own XY; after we rotate it flat, a vertex (px, py)
  // ends up at world (px, height, -py) — so sample the terrain accordingly.
  for (let i = 0; i < gp.count; i++) {
    gp.setZ(i, terrainHeight(gp.getX(i), -gp.getY(i)));
  }
  groundGeo.computeVertexNormals();

  // Paint it: lush green on the flats, browner as slopes get steeper, with a
  // little noisy patchiness so the huge field isn't one dead-flat color.
  const green = new THREE.Color(0x6aa83f);
  const dryGreen = new THREE.Color(0x577f34);
  const dirt = new THREE.Color(0x6b5030);
  const rock = new THREE.Color(0x8a877e); // chunky mountain stone
  const snow = new THREE.Color(0xf2f5f8); // the white caps
  const mud = new THREE.Color(0x54452e); // wet earth along the creek
  // sample the creek's path so the banks can darken with damp
  const layoutForBanks = layout && layout.length ? layout : DEFAULT_LAYOUT;
  const creekLm = layoutForBanks.find((e) => e.kind === "creek");
  const bankPts = [];
  if (creekLm) {
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      bankPts.push([
        creekLm.x + (t - 0.5) * 760,
        creekLm.z + Math.sin(t * Math.PI * 4.4) * 42 + Math.sin(t * Math.PI * 1.7 + 1.3) * 26,
      ]);
    }
  }
  const nrm = groundGeo.attributes.normal;
  const colors = new Float32Array(gp.count * 3);
  const c = new THREE.Color();
  const smooth = (a, b, v) => {
    const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  for (let i = 0; i < gp.count; i++) {
    // The plane's "up" is its LOCAL +Z (it gets rotated flat on the mesh),
    // so the Z component of the normal is how flat this spot is.
    const steep = 1 - nrm.getZ(i); // 0 flat -> ~1 on a cliff
    const patch = valueNoise(gp.getX(i) * 0.03, -gp.getY(i) * 0.03); // 0..1
    c.copy(green).lerp(dryGreen, patch * 0.6); // gentle green variation
    c.lerp(dirt, Math.min(1, steep * 3.2)); // slopes show bare earth
    // altitude bands: green foothills -> bare rock -> snow caps
    const alt = gp.getZ(i); // displaced height of this vertex
    c.lerp(rock, smooth(55, 130, alt));
    c.lerp(snow, smooth(200, 300, alt));
    // damp mud along the creek banks
    if (bankPts.length) {
      const vx = gp.getX(i);
      const vz = -gp.getY(i);
      if (Math.abs(vx - creekLm.x) < 440 && Math.abs(vz - creekLm.z) < 160) {
        let dMin = 1e9;
        for (const [bx, bz] of bankPts) {
          const dd = (vx - bx) * (vx - bx) + (vz - bz) * (vz - bz);
          if (dd < dMin) dMin = dd;
        }
        c.lerp(mud, (1 - smooth(15, 30, Math.sqrt(dMin))) * 0.85);
      }
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  groundGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // --- Home from outside: a COZY COTTAGE (round, thatched, smoke curling) ---
  {
    const R = MOUND_RADIUS;
    const plaster = new THREE.MeshStandardMaterial({ color: 0xf0e2c4, roughness: 1, flatShading: true });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.1, 2.3, 20), plaster);
    wall.position.y = 1.15;
    wall.castShadow = true;
    group.add(wall);
    // timber beams up the walls
    const timber = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 1, flatShading: true });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.12), timber);
      beam.position.set(Math.sin(a) * (R + 0.05), 1.15, Math.cos(a) * (R + 0.05));
      beam.rotation.y = a;
      group.add(beam);
    }
    const band = new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.08, 4, 24), timber);
    band.rotation.x = Math.PI / 2;
    band.position.y = 2.3;
    group.add(band);
    // the thatched roof: two layers of straw, a little lumpy
    const thatch = new THREE.MeshStandardMaterial({ color: 0xc89a4a, roughness: 1, flatShading: true });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.9, 2.6, 18), thatch);
    roof.position.y = 3.55;
    roof.castShadow = true;
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(R + 1.05, 0.6, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0xb08438, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
    roof2.position.y = 2.55;
    group.add(roof, roof2);
    // a stone chimney, with smoke
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 1, flatShading: true });
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), stone);
    chim.position.set(-1.3, 4.1, -1);
    group.add(chim);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.5, depthWrite: false });
    for (let k = 0; k < 4; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22 + k * 0.08, 8, 6), smokeMat);
      puff.userData.smoke = k;
      puff.position.set(-1.3, 5.2 + k * 0.5, -1);
      group.add(puff);
      denSmoke.push(puff);
    }
    // the round front door (black, like every door), with a step and a lantern
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.72, 18), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 0.68, R + 0.12);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.08, 6, 20), timber);
    frame.position.copy(door.position);
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.15, 12, 1, false, 0, Math.PI), stone);
    step.position.set(0, 0.07, R + 0.05);
    step.rotation.y = -Math.PI / 2;
    group.add(door, frame, step);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    lamp.position.set(0.95, 1.55, R + 0.25);
    const lampLight = new THREE.PointLight(0xffc870, 3, 6, 1.6);
    lampLight.position.copy(lamp.position);
    group.add(lamp, lampLight);
    // glowing windows with flower boxes
    for (const a of [-0.9, 0.9, Math.PI - 0.7, Math.PI + 0.7]) {
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
      win.position.set(Math.sin(a) * (R + 0.12), 1.4, Math.cos(a) * (R + 0.12));
      win.rotation.y = a;
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.22), timber);
      sill.position.set(Math.sin(a) * (R + 0.2), 0.98, Math.cos(a) * (R + 0.2));
      sill.rotation.y = a;
      group.add(win, sill);
      for (let f = -1; f <= 1; f++) {
        const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), new THREE.MeshStandardMaterial({ color: [0xff6a8a, 0xffd84a, 0xb88aff][f + 1], flatShading: true }));
        fl.position.set(Math.sin(a) * (R + 0.24) + Math.cos(a) * f * 0.22, 1.1, Math.cos(a) * (R + 0.24) - Math.sin(a) * f * 0.22);
        group.add(fl);
      }
    }
    // a little stone path to the door
    for (let k = 0; k < 5; k++) {
      const ps = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 7), stone);
      ps.position.set((k % 2 ? 0.15 : -0.15), 0.04, R + 0.8 + k * 0.7);
      group.add(ps);
    }
  }
  const denLabel = makeLabel("Home");
  denLabel.position.set(0, MOUND_RADIUS + 3.4, 0);
  group.add(denLabel);

  // --- Place everything from the layout ---
  const useLayout = layIn;
  const logLenHalfWorld = 13.5; // the school log's half-length (world units)
  const objects = [];
  const colliders = []; // { x, z, r } the mouse must walk around
  for (const entry of useLayout) {
    if (entry.kind === "bump") continue; // sculpted terrain, not an object
    if (entry.modelUrl && isHollow(entry.x, entry.z)) continue; // no stray trees in the Hollow
    const root = buildObject(entry);
    group.add(root);
    objects.push({ root, entry });
    const r = root.userData.collide || 0;
    if (r > 0) colliders.push({ x: root.position.x, z: root.position.z, r });
    // The hollow log's WALLS are solid but its tunnel stays open: a tube
    // collider lets the mouse crawl through the middle, never the bark.
    if (entry.kind === "log") {
      const s = (entry.scale || 1) * LANDMARK_SCALE;
      const a = entry.rot || 0;
      colliders.push({
        type: "tube",
        x: entry.x,
        z: entry.z,
        ax: Math.cos(a),
        az: -Math.sin(a),
        halfLen: 2.3 * s,
        innerR: 0.64 * s,
        outerR: 0.88 * s,
      });
    }
    if (entry.kind === "school") {
      // the schoolhouse log: solid bark, open tunnel (world units)
      const a = entry.rot || 0;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      colliders.push({
        type: "tube",
        x: entry.x,
        z: entry.z,
        ax: cosA,
        az: -sinA,
        halfLen: 13.5 * (entry.scale || 1),
        innerR: 4.0 * (entry.scale || 1),
        outerR: 4.7 * (entry.scale || 1),
      });
      // …and the furniture inside is solid too (local -> world by rot)
      const furn = [
        [-9.5, 0, 1.1], // blackboard
        [-7.6, 1.5, 0.75], // teacher's desk
        [-6.4, -2.6, 0.9], // bookcase
        [-4.6, -1.5, 0.45], [-4.6, 0, 0.45], [-4.6, 1.5, 0.45], // seats
        [-2.6, -1.5, 0.45], [-2.6, 0, 0.45], [-2.6, 1.5, 0.45],
        [logLenHalfWorld + 4.5, -3.4, 0.35], // bell post
        [SCHOOL_SPOTS.seat[0], SCHOOL_SPOTS.seat[1], 0.45], // the new student's stump
        [SCHOOL_SPOTS.bench[0] - 0.7, SCHOOL_SPOTS.bench[1], 0.6], // workbench
        [SCHOOL_SPOTS.bench[0] + 0.7, SCHOOL_SPOTS.bench[1], 0.6],
      ];
      for (const [lx, lz, r] of furn) {
        colliders.push({
          x: entry.x + lx * cosA + lz * sinA,
          z: entry.z - lx * sinA + lz * cosA,
          r,
        });
      }
    }
  }

  // 🌲 Fill every biome with dense instanced growth (forests! thickets!) —
  // colliders for all of it get pushed into the same array main.js reads.
  const landmarks = useLayout.filter((e) => e.kind);
  fillBiomes(group, colliders, landmarks);

  // 🎨 Dress the world like the concept art: snow-capped crags, boulders,
  // giant toadstools, daisies, lupines, and Everbough itself.
  decorateWorld(group, colliders, landmarks);
  createButterflies(group, landmarks);
  createCritters(group, landmarks);
  createWaterfall(group, colliders);

  // 🍂 falling leaves drifting around the mouse, 🌱 and a dense carpet of
  // wind-blown grass that follows the player across the huge world
  // (instanced — thousands of tufts for the price of two draw calls).
  group.add(createFallingLeaves());
  group.add(createPollen());
  group.add(createRain());
  createGrassFields(group);
  createGroundLitter(group); // 🍂 needles, leaves, petals… each biome its own
  {
    const log = landmarks.find((l) => l.kind === "log");
    const hollowC = { x: FALLS_POS.x + FALLS_AX * 101, z: FALLS_POS.z + FALLS_AZ * 101 };
    Object.assign(HOLLOW_CENTER, hollowC);
    // 🏕️ the giants' summer campsite: out toward the edge of the wild, on
    // dry open ground, as far from every landmark as we can manage
    let best = null;
    let bestScore = -1;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r = WORLD_RADIUS * 0.66;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (isWater(x, z) || isWater(x + 30, z) || isWater(x - 30, z)) continue;
      let near = Infinity;
      for (const l of landmarks) near = Math.min(near, Math.hypot(l.x - x, l.z - z));
      near = Math.min(near, Math.hypot(EVERBOUGH_POS.x - x, EVERBOUGH_POS.z - z), Math.hypot(FALLS_POS.x - x, FALLS_POS.z - z));
      if (near > bestScore) { bestScore = near; best = { x, z }; }
    }
    if (best) {
      Object.assign(CAMPSITE, best, { ready: true });
      buildCampsite(group, colliders, best.x, best.z);
    }
    LITTER_ZONES = [
      ...(best ? [{ x: best.x, z: best.z, r: 50, biome: "campsite" }] : []), // 🏕️ the giants' camp
      { ...hollowC, r: 22, biome: "hollow" }, // 🌙 Moonstone Hollow, behind the falls
      { x: EVERBOUGH_POS.x, z: EVERBOUGH_POS.z, r: 48, biome: "everbough" }, // 🌳 under the great tree
      ...(log ? [{ x: log.x, z: log.z, r: 16, biome: "fallenlog" }] : []), // 🪵 the Fallen Log
    ];
  }

  // 🌾 the Tall Grass region grows into a towering living labyrinth
  for (const { entry } of objects) {
    if (entry.kind === "tallgrass") createTallGrassMaze(group, entry.x || 0, entry.z || 0);
  }

  return { group, objects, ground, colliders };
}

// ------------------------------------------------------------
//  🌱  THE GRASS CARPET — dense instanced tufts that FOLLOW the mouse.
//  The world is far too big to cover in grass all at once, so each field
//  re-scatters itself around the player as they roam. Placement comes from
//  hashing the world grid, so the same spot always grows the same grass.
// ------------------------------------------------------------
const grassFields = [];

function createGrassFields(group) {
  // Field grass stays SHORT — you can always see over it (only the Tall
  // Grass biome's maze towers overhead). sMin/sVar set each tuft's size.
  const KINDS = [
    { url: "/models/nature/Grass_Wispy_Tall.gltf", count: 4200, cell: 6, radius: 150, sMin: 0.22, sVar: 0.22 },
    { url: "/models/nature/Grass_Common_Short.gltf", count: 3200, cell: 5, radius: 115, sMin: 0.35, sVar: 0.3 },
  ];
  KINDS.forEach((kind, ki) => {
    getBaseModel(kind.url).then((base) => {
      base.updateMatrixWorld(true);
      let src = null;
      base.traverse((o) => {
        if (o.isMesh && !src) src = o;
      });
      if (!src) return;

      // Bake the model's own scale/offset into the geometry so instances
      // only need position + spin + size.
      const geo = src.geometry.clone();
      geo.applyMatrix4(src.matrixWorld);
      geo.computeBoundingBox();
      const tuftH = Math.max(0.2, geo.boundingBox.max.y);

      // A fresh material so the field can have its own (world-unit) wind.
      const srcMat = Array.isArray(src.material) ? src.material[0] : src.material;
      const mat = srcMat.clone();
      mat.userData = {};
      addWind(mat, tuftH * 0.16, tuftH);

      const inst = new THREE.InstancedMesh(geo, mat, kind.count);
      inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      inst.frustumCulled = false; // the field surrounds the camera anyway
      inst.receiveShadow = true;
      group.add(inst);
      grassFields.push({ inst, ki, ...kind, lastX: 1e9, lastZ: 1e9 });
    });
  });
}

// ------------------------------------------------------------
//  🌾  THE TALL GRASS MAZE — around the Tall Grass landmark the blades
//  grow into towering walls, packed so dense you can't see through them,
//  with winding corridors carved by noise. A living labyrinth: to a mouse,
//  walls three times higher than the tallest grass anywhere else.
// ------------------------------------------------------------
function createTallGrassMaze(group, cx, cz) {
  getBaseModel("/models/nature/Grass_Wispy_Tall.gltf").then((base) => {
    base.updateMatrixWorld(true);
    let src = null;
    base.traverse((o) => {
      if (o.isMesh && !src) src = o;
    });
    if (!src) return;
    const geo = src.geometry.clone();
    geo.applyMatrix4(src.matrixWorld);
    geo.computeBoundingBox();
    const tuftH = Math.max(0.2, geo.boundingBox.max.y);

    const srcMat = Array.isArray(src.material) ? src.material[0] : src.material;
    const mat = srcMat.clone();
    mat.userData = {};
    addWind(mat, tuftH * 0.09, tuftH); // gentler sway — these are WALLS

    const R = 130; // how far the maze spreads from the landmark
    const CELL = 2.4; // spacing — tight enough to be a solid wall of stems
    const cap = 11000;
    const inst = new THREE.InstancedMesh(geo, mat, cap);
    inst.frustumCulled = false;
    inst.receiveShadow = true;

    let placed = 0;
    const span = Math.ceil(R / CELL);
    outer: for (let gx = -span; gx <= span; gx++) {
      for (let gz = -span; gz <= span; gz++) {
        const h1 = hash2(gx * 1.91 + 3.7, gz * 2.53 + 1.1);
        const h2 = hash2(gx * 4.31, gz * 3.17 + 9.2);
        const x = gx * CELL + (h1 - 0.5) * CELL;
        const z = gz * CELL + (h2 - 0.5) * CELL;
        const dCenter = Math.hypot(x, z);
        if (dCenter > R) continue;
        if (dCenter < 10) continue; // a small clearing at the heart of the maze
        // carve winding corridors: two layers of noise leave snaking paths
        const wx = cx + x;
        const wz = cz + z;
        const n1 = valueNoise(wx * 0.045, wz * 0.045);
        const n2 = valueNoise(wx * 0.021 + 7.7, wz * 0.021 + 3.1);
        if (Math.abs(n1 - 0.5) < 0.065 || Math.abs(n2 - 0.5) < 0.05) continue;
        // walls tower: 1.6x–2.8x the normal tall grass
        const s = 1.6 + hash2(gx * 7.7, gz * 5.1) * 1.2;
        _gq.setFromAxisAngle(_gup, h1 * Math.PI * 2);
        _gm4.compose(_gpos.set(x, terrainHeight(wx, wz), z), _gq, _gscl.set(s * 0.8, s, s * 0.8));
        inst.setMatrixAt(placed++, _gm4);
        if (placed >= cap) break outer;
      }
    }
    inst.count = placed;
    inst.position.set(cx, 0, cz);
    group.add(inst);
  });
}

// ------------------------------------------------------------
//  🎨  CONCEPT-ART DRESSING — every element from the picture:
//  faceted snow-capped crags, chunky boulders, red spotted toadstools,
//  white daisies, purple lupines, and one colossal hero tree.
// ------------------------------------------------------------

/** Paint a whole geometry one vertex color (so parts can merge). */
function paintGeo(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** A jagged low-poly rock: jittered icosahedron folded upward (sits on y=0). */
function cragGeometry(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const j = 1 + (hash2(i * 3.1 + seed, i * 1.7 - seed) - 0.5) * 0.55;
    p.setXYZ(
      i,
      p.getX(i) * j,
      Math.abs(p.getY(i)) * (1.1 + hash2(i * 0.7, seed + 2.2) * 0.55),
      p.getZ(i) * j
    );
  }
  geo.computeVertexNormals();
  return geo;
}

/** Gray faceted stone that turns crisp white above the snowline. */
function snowCappedRockMat() {
  const m = new THREE.MeshStandardMaterial({ color: 0x7d7a72, roughness: 1, flatShading: true });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vWy;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vWy = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;
        #else
          vWy = (modelMatrix * vec4(transformed, 1.0)).y;
        #endif`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vWy;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), smoothstep(135.0, 195.0, vWy));`
      );
  };
  m.customProgramCacheKey = () => "ww-snowrock";
  return m;
}

/** A red toadstool with white spots (merged into one geometry). */
function toadstoolGeometry() {
  const parts = [];
  parts.push(paintGeo(new THREE.CylinderGeometry(0.16, 0.24, 0.55, 8).translate(0, 0.275, 0), 0xe8dcc4));
  const cap = new THREE.SphereGeometry(0.5, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.68, 1);
  cap.translate(0, 0.52, 0);
  parts.push(paintGeo(cap, 0xc23a2e));
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    const r = 0.16 + (i % 3) * 0.12;
    const dot = new THREE.SphereGeometry(0.06, 6, 5);
    dot.translate(Math.cos(a) * r, 0.6 + (0.3 - r * 0.45), Math.sin(a) * r);
    parts.push(paintGeo(dot, 0xf2ece0));
  }
  return mergeGeometries(parts, false);
}

/** A chunky white daisy with a yellow heart. */
function daisyGeometry() {
  const parts = [];
  parts.push(paintGeo(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 6).translate(0, 0.31, 0), 0x4a7a34));
  const petals = new THREE.TorusGeometry(0.2, 0.1, 6, 10);
  petals.scale(1, 1, 0.32);
  petals.rotateX(-Math.PI / 2);
  petals.translate(0, 0.64, 0);
  parts.push(paintGeo(petals, 0xf2efe4));
  parts.push(paintGeo(new THREE.SphereGeometry(0.12, 8, 6).translate(0, 0.66, 0), 0xe8c33a));
  return mergeGeometries(parts, false);
}

/** A purple lupine spike. */
function lupineGeometry() {
  const parts = [];
  parts.push(paintGeo(new THREE.CylinderGeometry(0.04, 0.05, 0.75, 6).translate(0, 0.37, 0), 0x4a7a34));
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const bud = new THREE.SphereGeometry(0.13 - t * 0.07, 7, 5);
    bud.translate((i % 2 ? 0.05 : -0.05) * (1 - t), 0.55 + t * 0.6, (i % 3 ? 0.04 : -0.04) * (1 - t));
    parts.push(paintGeo(bud, i % 2 ? 0x8a6ac9 : 0x9d7fd6));
  }
  return mergeGeometries(parts, false);
}

/** Drop `list` placements of a merged geometry as one instanced mesh. */
function scatterMerged(group, colliders, geo, list, collideK, matOpts = {}) {
  list = list.filter((p) => !isHollow(p.x, p.z)); // the Hollow grows its own things
  if (!list.length) return;
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: !!geo.attributes.color, // ONLY if the geometry has colors!
    roughness: 0.9,
    flatShading: true,
    ...matOpts,
  });
  const inst = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((p, i) => {
    _gq.setFromAxisAngle(_gup, p.rot);
    _gm4.compose(_gpos.set(p.x, p.y, p.z), _gq, _gscl.set(p.s, p.s, p.s));
    inst.setMatrixAt(i, _gm4);
    if (collideK) colliders.push({ x: p.x, z: p.z, r: collideK * p.s });
  });
  inst.castShadow = true;
  inst.receiveShadow = true;
  inst.frustumCulled = false;
  group.add(inst);
}

function decorateWorld(group, colliders, landmarks) {
  const maze = landmarks.find((l) => l.kind === "tallgrass");
  const log = landmarks.find((l) => l.kind === "log");
  const well = landmarks.find((l) => l.kind === "well");

  // --- red spotted toadstools (some giant, like the picture) ---
  {
    const geo = toadstoolGeometry();
    const list = [];
    const span = Math.ceil((WORLD_RADIUS * 0.82) / 34);
    for (let gx = -span; gx <= span; gx++) {
      for (let gz = -span; gz <= span; gz++) {
        if (hash2(gx * 9.4, gz * 3.3 + 5) > 0.5) continue;
        const x = gx * 34 + (hash2(gx + 4, gz) - 0.5) * 28;
        const z = gz * 34 + (hash2(gx, gz + 7) - 0.5) * 28;
        const d = Math.hypot(x, z);
        if (d < 50 || d > WORLD_RADIUS * 0.82) continue;
        const b = biomeAt(x, z);
        if (b !== "pine" && b !== "berry") continue;
        const s = 1 + hash2(gx * 2.2, gz * 6.1) * 1.6;
        list.push({ x, y: terrainHeight(x, z), z, s, rot: hash2(gx, gz) * Math.PI * 2 });
      }
    }
    // a few GIANTS near the Fallen Log and the Old Well
    for (const home of [log, well]) {
      if (!home) continue;
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.6;
        const x = home.x + Math.cos(a) * (26 + i * 9);
        const z = home.z + Math.sin(a) * (24 + i * 7);
        list.push({ x, y: terrainHeight(x, z), z, s: 3.2 + i * 0.7, rot: a });
      }
    }
    scatterMerged(group, colliders, geo, list, 0.3);
  }

  // --- white daisies + purple lupines ---
  const flowerScatter = (geo, offset) => {
    const list = [];
    const span = Math.ceil((WORLD_RADIUS * 0.82) / 9);
    for (let gx = -span; gx <= span; gx++) {
      for (let gz = -span; gz <= span; gz++) {
        const h = hash2(gx * 3.7 + offset, gz * 8.1 - offset);
        const x = gx * 9 + (hash2(gx + offset, gz) - 0.5) * 8;
        const z = gz * 9 + (hash2(gx, gz + offset) - 0.5) * 8;
        const d = Math.hypot(x, z);
        if (d < 45 || d > WORLD_RADIUS * 0.82) continue;
        const b = biomeAt(x, z);
        const keep = b === "wildflower" ? 0.55 : b === "meadow" ? 0.08 : 0;
        if (h > keep) continue;
        const s = 1.4 + hash2(gx * 1.1, gz * 4.4) * 2.2;
        list.push({ x, y: terrainHeight(x, z), z, s, rot: h * 40 });
      }
    }
    scatterMerged(group, colliders, geo, list, 0);
  };
  flowerScatter(daisyGeometry(), 11.3);
  // (the giant purple lupines were retired by royal decree 🐭)

  // --- EVERBOUGH: the colossal hero tree, visible from everywhere.
  //     High on its trunk: the Great Horned Owl's hole and stick nest. ---
  getBaseModel("/models/nature/TwistedTree_1.gltf").then((base) => {
    const tree = base.clone(true);
    tree.scale.multiplyScalar(3.4); // ~150 units — a giant among giants
    const root = new THREE.Group();
    root.position.set(EVERBOUGH_POS.x, terrainHeight(EVERBOUGH_POS.x, EVERBOUGH_POS.z), EVERBOUGH_POS.z);
    root.add(tree);
    // the owl hole — a dark mouth in the bark
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 14),
      new THREE.MeshBasicMaterial({ color: 0x0a0705 })
    );
    hole.position.set(0, OWL_NEST_HEIGHT + 2.5, 6.2);
    root.add(hole);
    // the stick nest ledge beneath the owl hole — AND a solid ledge to
    // stand on once you climb all the way to the top.
    const nest = new THREE.Mesh(
      new THREE.TorusGeometry(4.6, 1.3, 7, 16),
      new THREE.MeshStandardMaterial({ color: 0x5a4226, roughness: 1, flatShading: true })
    );
    nest.rotation.x = Math.PI / 2;
    nest.position.set(0, OWL_NEST_HEIGHT - 1.2, 6.2);
    root.add(nest);
    const ledge = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.4, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x6a4e2e, roughness: 1, flatShading: true })
    );
    ledge.position.set(0, OWL_NEST_HEIGHT - 1.4, 6.2);
    root.add(ledge);
    const label = makeLabel("Everbough");
    label.scale.set(30, 7.5, 1);
    label.position.y = 150;
    root.add(label);
    group.add(root);

    // The twisted trunk LEANS and TWISTS as it rises, so a single ground
    // circle can't cover it — climb past the base and you'd sail through the
    // bark. Instead we sample the trunk into a STACK of discs, each one
    // hugging the wood at its own height (following the trunk's drift and
    // ignoring the far-flung leaves). bumpColliders picks the disc nearest
    // your height, so collision — and the climb — track the bark all the
    // way up to the nest.
    root.updateMatrixWorld(true);
    const groundY = root.position.y;
    const fv = new THREE.Vector3();
    const BAND = 5; // world units per stack disc
    const topY = OWL_NEST_HEIGHT + 4;
    const nb = Math.ceil((topY) / BAND);
    const bands = Array.from({ length: nb }, () => []);
    tree.traverse((o) => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        fv.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        const b = Math.floor((fv.y - groundY) / BAND);
        if (b >= 0 && b < nb) bands[b].push(fv.x, fv.z);
      }
    });
    // walk up the trunk, each disc's center = mean of the vertices in that
    // band that lie near the previous center (so leaves don't drag it away)
    const samples = [];
    let cx = EVERBOUGH_POS.x;
    let cz = EVERBOUGH_POS.z;
    for (let b = 0; b < nb; b++) {
      const pts = bands[b];
      let sx = 0, sz = 0, n = 0, maxd = 0;
      const near = b < 2 ? 999 : 11; // base band takes everything; higher bands hug
      for (let i = 0; i < pts.length; i += 2) {
        const dxp = pts[i] - cx, dzp = pts[i + 1] - cz;
        if (dxp * dxp + dzp * dzp < near * near) { sx += pts[i]; sz += pts[i + 1]; n++; }
      }
      if (n > 0) { cx = sx / n; cz = sz / n; }
      // radius = tight cluster spread around the (updated) center
      let acc = [];
      for (let i = 0; i < pts.length; i += 2) {
        const dd = Math.hypot(pts[i] - cx, pts[i + 1] - cz);
        if (dd < near) acc.push(dd);
      }
      acc.sort((a, z) => a - z);
      const r = acc.length ? Math.min(9, Math.max(3.5, acc[Math.floor(acc.length * 0.75)])) : 5;
      samples.push({ y: groundY + b * BAND + BAND / 2, x: cx, z: cz, r });
    }
    colliders.push({ type: "trunk", samples });

    // 🕳️ THE SECRET HOLE — a dark burrow tucked between two big roots on
    // the side facing home. Cold air breathes out of it…
    {
      const base = samples[0];
      const tx = -base.x;
      const tz = -base.z;
      const tl = Math.hypot(tx, tz) || 1;
      const ox = tx / tl; // pointing from the trunk toward home (0, 0)
      const oz = tz / tl;
      const hr = base.r + MOUSE_HOLE_GAP;
      const hx = base.x + ox * hr;
      const hz = base.z + oz * hr;
      const hy = terrainHeight(hx, hz);
      const holeG = new THREE.Group();
      holeG.position.set(hx, hy, hz);
      holeG.rotation.y = Math.atan2(ox, oz);
      const pit = new THREE.Mesh(
        new THREE.CircleGeometry(1.25, 16).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x050302, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
      );
      pit.position.y = 0.22;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.28, 6, 16), dirtMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.2;
      holeG.add(pit, rim);
      // two roots arching over the hole, from the trunk down into the ground
      for (const side of [-1, 1]) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 1.6, 3.2, -MOUSE_HOLE_GAP - 0.6),
          new THREE.Vector3(side * 1.5, 2.0, -0.4),
          new THREE.Vector3(side * 1.4, 0.4, 1.2),
          new THREE.Vector3(side * 1.6, -0.3, 2.2),
        ]);
        holeG.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.32, 6, false), barkMat));
      }
      group.add(holeG);
      Object.assign(EVERBOUGH_HOLE, { x: hx, z: hz, out: { x: ox, z: oz }, ready: true });
    }
    // …and a floor platform at the nest, so you can stand at the very top
    colliders.push({ type: "platform", x: cx, z: cz + 6.2, r: 5.2, y: groundY + OWL_NEST_HEIGHT - 1.1 });
  });
}

const FALLS_FOOT = { z: 30, lean: 0.3 }; // where the lower falls meets the pool
const MOUSE_HOLE_GAP = 1.6; // how far out from the trunk collider the hole sits
const _gm4 = new THREE.Matrix4();
const _gpos = new THREE.Vector3();
const _gscl = new THREE.Vector3();
const _gq = new THREE.Quaternion();
const _gup = new THREE.Vector3(0, 1, 0);

// Re-scatter one field's tufts around (cx, cz). Runs only after the player
// has wandered a couple of cells — a few thousand matrix writes, rarely.
// 🚫🌾 no grass inside buildings (barns, halls…): circles { x, z, r }
export const NO_GRASS = [];
export function noGrassHere(x, z, r) {
  NO_GRASS.push({ x, z, r });
  for (const f of grassFields) f.lastX = 1e9; // (re-grow the field without it)
}
function refillGrassField(field, cx, cz) {
  if (Math.hypot(cx - field.lastX, cz - field.lastZ) < field.cell * 2) return;
  field.lastX = cx;
  field.lastZ = cz;
  const { inst, cell, radius, count, ki } = field;
  const span = Math.ceil(radius / cell);
  const bx = Math.round(cx / cell);
  const bz = Math.round(cz / cell);
  let placed = 0;
  outer: for (let gx = bx - span; gx <= bx + span; gx++) {
    for (let gz = bz - span; gz <= bz + span; gz++) {
      for (let k = 0; k < 2; k++) {
        // the grid cell decides — the same spot always grows the same grass
        const h1 = hash2(gx * 1.37 + ki * 17.1 + k * 7.3, gz * 2.11 + k * 3.7);
        const h2 = hash2(gx * 3.7 + k * 1.9, gz * 5.3 + ki * 11.1);
        const x = gx * cell + (h1 - 0.5) * cell;
        const z = gz * cell + (h2 - 0.5) * cell;
        if (Math.hypot(x - cx, z - cz) > radius) continue;
        const dHome = Math.hypot(x, z);
        if (dHome < MOUND_RADIUS + 3 || dHome > WORLD_RADIUS) continue;
        if (isWater(x, z) || isHollow(x, z)) continue; // no tufts in the water (or the Hollow)
        if (NO_GRASS.length && NO_GRASS.some((n) => Math.hypot(x - n.x, z - n.z) < n.r)) continue; // (or inside buildings)
        if (SCHOOL_POS && Math.abs(x - SCHOOL_POS.x) < 15 && Math.abs(z - SCHOOL_POS.z) < 5.4) continue;
        const s = field.sMin + hash2(gx + k * 11.7, gz * 1.9 - ki) * field.sVar;
        _gq.setFromAxisAngle(_gup, h1 * Math.PI * 2);
        _gm4.compose(_gpos.set(x, terrainHeight(x, z), z), _gq, _gscl.set(s, s, s));
        inst.setMatrixAt(placed++, _gm4);
        if (placed >= count) break outer;
      }
    }
  }
  inst.count = placed;
  inst.instanceMatrix.needsUpdate = true;
}

// ------------------------------------------------------------
//  🍂  GROUND LITTER — the little things on the forest floor.
//
//  Every biome drops its own materials (from the Grand Library's
//  Forager's Guide + region pages):
//    🌲 Pine Forest   — dry pine needles, pinecones, twigs, moss
//    🍃 Aspen Forest  — golden fallen leaves, curls of pale bark, twigs
//    🌾 Meadow        — clover, dry grass stems, a few twigs and pebbles
//    🌸 Wildflowers   — drifting petals, dry stems, clover
//    🫐 Berry Bushes  — fallen berries, big dark leaves, twigs
//    🌾 Tall Grass    — dry stalks and twigs
//    💧 by the water  — smooth pebbles
//
//  Like the grass, the litter is a ring that FOLLOWS the mouse: a world
//  grid of little cells around you, each deciding (from a hash of its
//  position, so it never changes) what lies there. One InstancedMesh per
//  kind = a dozen draw calls for thousands of bits of forest floor.
//
//  Some litter can be GATHERED (twigs, tinder, leaves, food) — see
//  litterNear() / takeLitter(), used by the story's survival lessons.
// ------------------------------------------------------------
const LITTER_CELL = 1.7; // world units per grid cell
const LITTER_RADIUS = 55; // how far around the mouse the floor is dressed
const LITTER_CAP = 2600; // max instances per kind

function nonIndexedMerge(list) {
  return mergeGeometries(
    list.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal") n.deleteAttribute(name);
      return n;
    })
  );
}
function litterGeometries() {
  const flat = (g) => g.rotateX(-Math.PI / 2);
  const needles = [];
  for (let i = 0; i < 11; i++) {
    const b = new THREE.BoxGeometry(0.5, 0.018, 0.024);
    b.rotateY(i * 0.61 + (i % 3) * 0.3);
    b.translate(Math.sin(i * 2.3) * 0.07, 0.012 + (i % 4) * 0.012, Math.cos(i * 1.7) * 0.07);
    needles.push(b);
  }
  const twig = [
    new THREE.CylinderGeometry(0.018, 0.026, 0.7, 5).rotateZ(Math.PI / 2).translate(0, 0.025, 0),
    new THREE.CylinderGeometry(0.012, 0.017, 0.26, 4).rotateZ(Math.PI / 2).rotateY(0.7).translate(0.13, 0.025, 0.07),
  ];
  const cone = [new THREE.IcosahedronGeometry(0.11, 0).scale(1.7, 1, 1).translate(0, 0.1, 0)];
  for (let i = 0; i < 3; i++) cone.push(new THREE.TorusGeometry(0.09 - i * 0.015, 0.025, 4, 7).rotateY(Math.PI / 2).translate(-0.1 + i * 0.1, 0.1, 0));
  const leaf = (s) => [flat(new THREE.CircleGeometry(0.2 * s, 6)).scale(0.55, 1, 1).translate(0, 0.02, 0)];
  const bark = [new THREE.CylinderGeometry(0.08, 0.08, 0.42, 6, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, 0.05, 0)];
  const clover = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    clover.push(flat(new THREE.CircleGeometry(0.075, 6)).translate(Math.cos(a) * 0.075, 0.05, Math.sin(a) * 0.075));
  }
  clover.push(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 3).translate(0, 0.025, 0));
  const stem = [
    new THREE.CylinderGeometry(0.008, 0.011, 0.5, 4).rotateZ(Math.PI / 2).translate(0, 0.015, 0),
    new THREE.SphereGeometry(0.03, 5, 3).scale(2.2, 1, 1).translate(0.28, 0.02, 0),
  ];
  const petal = [];
  for (let i = 0; i < 3; i++) petal.push(flat(new THREE.CircleGeometry(0.07, 5)).scale(1, 1, 0.6).rotateY(i * 1.9).translate(Math.sin(i * 2.4) * 0.14, 0.015 + i * 0.004, Math.cos(i * 2.4) * 0.14));
  const berry = [new THREE.SphereGeometry(0.065, 6, 4).translate(0, 0.06, 0), new THREE.SphereGeometry(0.05, 6, 4).translate(0.09, 0.05, 0.04)];
  const pebble = [new THREE.IcosahedronGeometry(0.1, 0).scale(1, 0.55, 0.8).translate(0, 0.04, 0)];
  const moss = [new THREE.SphereGeometry(0.24, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.28, 0.8)];
  // --- the rest of the Forager's Guide ---
  const shroom = [
    new THREE.CylinderGeometry(0.035, 0.045, 0.16, 6).translate(0, 0.08, 0),
    new THREE.SphereGeometry(0.11, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.7, 1).translate(0, 0.15, 0),
  ];
  const root = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.0, 0), new THREE.Vector3(-0.1, 0.06, 0.08), new THREE.Vector3(0.1, 0.03, -0.06), new THREE.Vector3(0.3, 0.08, 0.04),
  ]), 8, 0.022, 4, false)];
  const sap = [
    new THREE.CylinderGeometry(0.02, 0.025, 0.4, 4).rotateZ(Math.PI / 2).translate(0, 0.025, 0),
    new THREE.SphereGeometry(0.05, 6, 4).scale(1, 1.3, 1).translate(0.05, 0.07, 0),
  ];
  const beetle = [
    new THREE.SphereGeometry(0.07, 6, 4).scale(0.8, 0.55, 1.2).translate(0, 0.04, 0),
    new THREE.SphereGeometry(0.035, 5, 3).translate(0, 0.04, 0.09),
  ];
  const shell = [new THREE.SphereGeometry(0.08, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.8, 0.6, 1.2).translate(0, 0.005, 0)];
  const feather = [
    flat(new THREE.CircleGeometry(0.16, 8)).scale(0.32, 1, 1).translate(0, 0.02, 0.04),
    new THREE.CylinderGeometry(0.006, 0.008, 0.42, 3).rotateX(Math.PI / 2).translate(0, 0.025, 0),
  ];
  const acorncap = [
    new THREE.SphereGeometry(0.08, 7, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0, 0.08, 0),
    new THREE.CylinderGeometry(0.012, 0.012, 0.05, 4).translate(0, 0.0, 0),
  ];
  const thorn = [new THREE.CylinderGeometry(0.016, 0.022, 0.5, 4).rotateZ(Math.PI / 2).translate(0, 0.025, 0)];
  for (let i = 0; i < 4; i++) thorn.push(new THREE.ConeGeometry(0.018, 0.08, 4).rotateZ(i % 2 ? 0.6 : -0.6).translate(-0.18 + i * 0.12, 0.06, i % 2 ? 0.02 : -0.02));
  const oat = [new THREE.CylinderGeometry(0.008, 0.01, 0.5, 3).rotateZ(Math.PI / 2).translate(0, 0.015, 0)];
  for (let i = 0; i < 5; i++) oat.push(new THREE.SphereGeometry(0.022, 4, 3).scale(1.8, 1, 1).translate(0.18 + i * 0.03, 0.02, (i % 2 ? 1 : -1) * 0.025));
  const thistle = [
    new THREE.CylinderGeometry(0.01, 0.012, 0.25, 3).rotateZ(Math.PI / 2).translate(0, 0.015, 0),
    new THREE.IcosahedronGeometry(0.05, 0).translate(0.15, 0.05, 0),
    new THREE.ConeGeometry(0.035, 0.07, 6).rotateZ(-Math.PI / 2).translate(0.21, 0.05, 0),
  ];
  const herb = [new THREE.CylinderGeometry(0.008, 0.01, 0.2, 3).translate(0, 0.1, 0)];
  for (let i = 0; i < 4; i++) herb.push(new THREE.SphereGeometry(0.045, 5, 3).scale(1.4, 0.3, 0.8).rotateY(i * 1.6).translate(Math.cos(i * 1.6) * 0.04, 0.06 + i * 0.035, -Math.sin(i * 1.6) * 0.04));
  const dirt = [new THREE.IcosahedronGeometry(0.11, 0).scale(1.2, 0.5, 1).translate(0, 0.03, 0)];
  const stone = [new THREE.IcosahedronGeometry(0.17, 1).scale(1, 0.5, 0.75).translate(0, 0.06, 0)];
  const mud = [flat(new THREE.CircleGeometry(0.28, 9)).scale(1, 1, 0.7).translate(0, 0.012, 0)];
  const bloom = [new THREE.CylinderGeometry(0.008, 0.01, 0.3, 3).rotateZ(Math.PI / 2).translate(0, 0.015, 0)];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    bloom.push(flat(new THREE.CircleGeometry(0.035, 5)).scale(1.4, 1, 0.8).rotateY(-a).translate(0.17 + Math.cos(a) * 0.04, 0.03, Math.sin(a) * 0.04));
  }
  const lavender = [new THREE.CylinderGeometry(0.008, 0.01, 0.42, 3).rotateZ(Math.PI / 2).translate(0, 0.015, 0)];
  for (let i = 0; i < 6; i++) lavender.push(new THREE.SphereGeometry(0.02, 4, 3).translate(0.1 + i * 0.03, 0.03, (i % 2 ? 1 : -1) * 0.012));
  const stalk = [new THREE.BoxGeometry(1.2, 0.012, 0.05).translate(0, 0.01, 0)];
  const crystal = [new THREE.OctahedronGeometry(0.08, 0).scale(0.7, 1.6, 0.7).rotateZ(0.35).translate(0, 0.08, 0)];
  // --- giants' leftovers at the campsite ---
  const string = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.01, 0), new THREE.Vector3(-0.15, 0.01, 0.15), new THREE.Vector3(0.05, 0.01, -0.1), new THREE.Vector3(0.2, 0.01, 0.12), new THREE.Vector3(0.38, 0.01, -0.02),
  ]), 14, 0.012, 3, false)];
  const cloth = [flat(new THREE.PlaneGeometry(0.42, 0.34, 2, 2)).rotateY(0.3).translate(0, 0.012, 0)];
  const button = [new THREE.CylinderGeometry(0.09, 0.09, 0.025, 10).translate(0, 0.013, 0)];
  const bead = [new THREE.SphereGeometry(0.045, 6, 4).translate(0, 0.045, 0)];
  const glass = [new THREE.TetrahedronGeometry(0.09, 0).scale(1.4, 0.4, 1).translate(0, 0.02, 0)];
  const paper = [flat(new THREE.PlaneGeometry(0.4, 0.3)).rotateY(-0.4).translate(0, 0.01, 0)];
  const cheese = [new THREE.CylinderGeometry(0.16, 0.16, 0.12, 3, 1, false, 0, Math.PI / 2).translate(0, 0.06, 0)];
  const butter = [new THREE.BoxGeometry(0.12, 0.06, 0.09).translate(0, 0.03, 0)];
  const trinket = [new THREE.TorusGeometry(0.06, 0.018, 5, 10).rotateX(Math.PI / 2).translate(0, 0.02, 0)];
  return {
    string, cloth, button, bead, glass, paper, cheese, butter, trinket,
    needles, twig, cone, leaf: leaf(1), bark, clover, stem, petal, berry, bleaf: leaf(1.25), pebble, moss,
    mushroom: shroom, medshroom: shroom, glowshroom: shroom, root, sap, beetle, shell, feather, owlfeather: feather,
    acorncap, thorn, oat, thistle, herb, bitterherb: herb, dirt, stone, mud, wildflower: bloom, lavender, tallstalk: stalk,
    glowmoss: moss, crystal, moonpetal: petal,
  };
}

// what each kind looks like, what it's called, what it's good for (`gather`:
// the survival lessons' categories) and what goes in your pack (`items`:
// recipe ingredient names, each with a chance). From the Forager's Guide.
const LITTER_KINDS = {
  needles: { colors: [0xa06a34, 0x8a5a2c, 0xb47a40], gather: "tinder", label: "dry pine needles", items: [["Pine Needles", 1]] },
  cone: { colors: [0x7a4a2a, 0x6a4024, 0x8a5634], gather: "food", label: "a pinecone (pine nuts!)", items: [] },
  twig: { colors: [0x6b4a2c, 0x7a5636, 0x5a3e24], gather: "twig", label: "a twig", items: [["Twigs", 1], ["Sticks", 0.4]] },
  leaf: { colors: [0xe8b830, 0xd89a28, 0xf0c850, 0xc8a030], gather: "leaf", label: "a golden aspen leaf", items: [["Large Leaves", 1]] },
  bark: { colors: [0xe6e0d0, 0xd4ccb8], gather: "tinder", label: "a curl of aspen bark", items: [["Bark Strips", 1], ["Bark Fibers", 0.5], ["Bark Sheets", 0.3]] },
  clover: { colors: [0x4f9a3a, 0x5aa844, 0x468a34], gather: "food", label: "clover seeds", items: [["Clover Seeds", 1]] },
  stem: { colors: [0xb4a464, 0xa89858, 0xbcac70], gather: "tinder", label: "dry grass", items: [["Dry Grass", 1], ["Grass Fibers", 0.5]] },
  petal: { colors: [0xf2a0b8, 0xfff0a0, 0xffffff, 0xf8c8a0], gather: null, label: "flower petals", items: [["Flower Petals", 1]] },
  berry: { colors: [0x4a1838, 0x5a2148], gather: "food", label: "a fallen berry", items: [["Berries", 1], ["Berry Seeds", 0.5], ["Berry Juice", 0.2]] },
  bleaf: { colors: [0x2e5024, 0x3a6030, 0x4a6a2a], gather: "leaf", label: "a big berry leaf", items: [["Large Leaves", 1]] },
  pebble: { colors: [0x8a8880, 0x9a968c, 0x7a776e], gather: null, label: "a tiny pebble", items: [["Tiny Pebble", 1]] },
  moss: { colors: [0x4e6a38, 0x5a7a40], gather: "moss", label: "a tuft of moss", items: [["Moss", 1]] },
  mushroom: { colors: [0x9a6a3a, 0xb07a44, 0x8a5a30], gather: "food", label: "a mushroom", items: [["Mushrooms", 1], ["Mushroom Cap", 0.6], ["Mushroom Dust", 0.3]] },
  medshroom: { colors: [0xf0ead8, 0xe0d8c4], gather: null, label: "a pale healing mushroom", items: [["Medicinal Mushrooms", 1]] },
  root: { colors: [0x8a6440, 0x7a5636], gather: null, label: "fine root fibers", items: [["Root Fibers", 1]] },
  sap: { colors: [0xe8a030, 0xd88a20], gather: null, label: "an amber sap droplet", items: [["Sap Droplets", 1]] },
  beetle: { colors: [0x1e2a1e, 0x2a1e30, 0x302418], gather: "food", label: "a beetle", items: [["Beetles", 1]] },
  shell: { colors: [0x2e8a5a, 0x3a6aa8, 0x7a4a8a], gather: null, label: "a shiny beetle shell", items: [["Beetle Shells", 1]] },
  feather: { colors: [0xf0f0f0, 0xd0d4d8, 0xb8b0a4], gather: null, label: "a feather", items: [["Feathers", 1]] },
  owlfeather: { colors: [0x8a6a44, 0x6a5038], gather: null, label: "a big owl feather", items: [["Owl Feather", 1], ["Feathers", 0.5]] },
  acorncap: { colors: [0x8a6036, 0x7a5430], gather: null, label: "an acorn cap", items: [["Acorn Caps", 1], ["Large Acorn Cap", 0.12]] },
  thorn: { colors: [0x4a3220, 0x5a3e24], gather: null, label: "a thorny twig", items: [["Sharp Thorns", 1]] },
  oat: { colors: [0xd8c088, 0xc8b078], gather: "food", label: "wild oats", items: [["Oat Grains", 1]] },
  thistle: { colors: [0xc87ab8, 0xb86aa8], gather: null, label: "a thistle flower", items: [["Thistle Flowers", 1]] },
  herb: { colors: [0x5ab878, 0x4aa868], gather: null, label: "fresh herbs", items: [["Herbs", 1]] },
  bitterherb: { colors: [0x3a6a3a, 0x2e5a34], gather: null, label: "a bitter herb", items: [["Bitter Herb", 1]] },
  dirt: { colors: [0x6a4a2c, 0x5a3e24], gather: null, label: "a clod of packed dirt", items: [["Packed Dirt", 1]] },
  stone: { colors: [0x9a9890, 0x8a8880, 0xaaa69c], gather: null, label: "a smooth stone", items: [["Stones", 1], ["Smooth Stones", 0.5]] },
  mud: { colors: [0x5a4a3a, 0x4e4034], gather: null, label: "clay mud", items: [["Clay Mud", 1]] },
  wildflower: { colors: [0xffd84a, 0xf2a0b8, 0xffffff, 0xff9a5a], gather: null, label: "a wildflower", items: [["Wildflowers", 1], ["Nectar", 0.4], ["Honey Drop", 0.05], ["Bee Wax", 0.05]] },
  lavender: { colors: [0x9a7ad8, 0x8a6ac8], gather: null, label: "a lavender sprig", items: [["Lavender Flowers", 1]] },
  tallstalk: { colors: [0x8aa850, 0xa8a860], gather: "tinder", label: "a tall grass stalk", items: [["Tall Grass", 1], ["Grass Fibers", 0.7]] },
  glowmoss: { colors: [0x35e8c0, 0x4ff0d0], glow: true, gather: "moss", label: "glowing moss", items: [["Glowing Moss", 1]] },
  crystal: { colors: [0xc49df0, 0x9fd8ff], glow: true, gather: null, label: "a crystal fragment", items: [["Crystal Fragments", 1]] },
  moonpetal: { colors: [0xe8f0ff, 0xd0e4ff], glow: true, gather: null, label: "a moon petal", items: [["Moon Petals", 1]] },
  glowshroom: { colors: [0x6fc0ff, 0x8ad8ff], glow: true, gather: null, label: "a glowing mushroom", items: [["Glowing Mushrooms", 1]] },
  // 🏕️ the giants' campsite
  string: { colors: [0xe8e0d0, 0xd84a3a, 0x3a6ad8], gather: null, label: "a length of string", items: [["String", 1]] },
  cloth: { colors: [0xc84a4a, 0x4a7ac8, 0xe8d8a8, 0x6a9a4a], gather: null, label: "a cloth scrap", items: [["Cloth Scrap", 1], ["Cloth Fibers", 0.6], ["Soft Cloth Fibers", 0.3]] },
  button: { colors: [0x2a2a2a, 0xd84a3a, 0xe8d8b0, 0x4a6ad8], gather: null, label: "a button", items: [["Tiny Button", 1], ["Human Button", 0.35]] },
  bead: { colors: [0xff5a8a, 0x5ad8ff, 0xffd84a, 0x8aff6a], gather: null, label: "a shiny bead", items: [["Tiny Bead", 1]] },
  glass: { colors: [0x6ab89a, 0x8ac8d8], gather: null, label: "a smooth glass fragment", items: [["Glass Fragment", 1]] },
  paper: { colors: [0xf4f0e6, 0xe8e4d8], gather: null, label: "a paper scrap", items: [["Human Paper Scrap", 1]] },
  cheese: { colors: [0xf2c84a], gather: "food", label: "a CHEESE CHUNK!!", items: [["Cheese Chunk", 1]] },
  butter: { colors: [0xf8e8a0], gather: "food", label: "a bit of butter", items: [["Butter Bit", 1]] },
  trinket: { colors: [0xd8b04a, 0xc0c0c8], gather: null, label: "a tiny trinket", items: [["Tiny Trinkets", 1]] },
};
// per biome: chance a cell holds anything, then weighted kinds
const LITTER_BIOMES = {
  pine: { chance: 0.78, kinds: [["needles", 5], ["cone", 1.4], ["twig", 2], ["moss", 1.1], ["mushroom", 0.7], ["root", 0.5], ["beetle", 0.35], ["shell", 0.3], ["feather", 0.3], ["sap", 0.18], ["medshroom", 0.08]] },
  aspen: { chance: 0.72, kinds: [["leaf", 6], ["bark", 1.6], ["twig", 2], ["acorncap", 0.8], ["medshroom", 0.25], ["feather", 0.25], ["mushroom", 0.3]] },
  meadow: { chance: 0.3, kinds: [["clover", 4], ["stem", 1.5], ["twig", 0.8], ["pebble", 0.6], ["oat", 0.8], ["thistle", 0.4], ["herb", 0.4], ["dirt", 0.5]] },
  wildflower: { chance: 0.6, kinds: [["petal", 6], ["wildflower", 2], ["lavender", 1], ["thistle", 0.6], ["stem", 1], ["clover", 1.2]] },
  berry: { chance: 0.62, kinds: [["berry", 3], ["bleaf", 3], ["twig", 1.6], ["thorn", 1.2], ["beetle", 0.4]] },
  tallgrass: { chance: 0.45, kinds: [["tallstalk", 3], ["stem", 3], ["twig", 1]] },
  water: { chance: 0.5, kinds: [["pebble", 3], ["stone", 1.5], ["mud", 1.2], ["herb", 0.8], ["bitterherb", 0.6], ["moss", 0.8], ["stem", 1]] },
  // special spots (see LITTER_ZONES)
  fallenlog: { chance: 0.8, kinds: [["mushroom", 3], ["shell", 1.5], ["root", 1], ["moss", 1], ["beetle", 0.6], ["twig", 1]] },
  everbough: { chance: 0.6, kinds: [["feather", 1.5], ["owlfeather", 0.5], ["twig", 2], ["moss", 1], ["root", 1]] },
  hollow: { chance: 0.8, kinds: [["glowmoss", 3], ["crystal", 1.5], ["moonpetal", 1.2], ["glowshroom", 1]] },
  campsite: { chance: 0.45, kinds: [["string", 3], ["cloth", 2.5], ["button", 1.5], ["bead", 1], ["glass", 0.6], ["paper", 1.2], ["trinket", 0.8], ["oat", 1], ["cheese", 0.12], ["butter", 0.15], ["stem", 1]] },
};
// places with their own litter: { x, z, r, biome } — filled in by buildOutside
let LITTER_ZONES = [];

let litter = null; // { meshes: {kind: InstancedMesh}, placed: [...], lastX, lastZ }
const litterTaken = new Set(); // gathered cells never grow back (this session)

function createGroundLitter(group) {
  const geos = litterGeometries();
  const meshes = {};
  for (const kind of Object.keys(LITTER_KINDS)) {
    // glowing things (Hollow moss, crystals, moon petals) light themselves
    const mat = LITTER_KINDS[kind].glow
      ? new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, side: THREE.DoubleSide });
    const inst = new THREE.InstancedMesh(nonIndexedMerge(geos[kind]), mat, LITTER_CAP);
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LITTER_CAP * 3), 3);
    inst.count = 0;
    inst.frustumCulled = false; // the ring surrounds the camera anyway
    group.add(inst);
    meshes[kind] = inst;
  }
  litter = { meshes, placed: [], lastX: Infinity, lastZ: Infinity };
}

const _lc = new THREE.Color();
function refillLitter(cx, cz, force = false) {
  if (!litter) return;
  if (!force && Math.hypot(cx - litter.lastX, cz - litter.lastZ) < 6) return;
  litter.lastX = cx;
  litter.lastZ = cz;
  const counts = {};
  for (const k in litter.meshes) counts[k] = 0;
  const placed = [];
  const span = Math.ceil(LITTER_RADIUS / LITTER_CELL);
  const gx0 = Math.round(cx / LITTER_CELL);
  const gz0 = Math.round(cz / LITTER_CELL);
  for (let gx = gx0 - span; gx <= gx0 + span; gx++) {
    for (let gz = gz0 - span; gz <= gz0 + span; gz++) {
      const x = gx * LITTER_CELL + (hash2(gx * 1.7, gz * 3.1) - 0.5) * LITTER_CELL;
      const z = gz * LITTER_CELL + (hash2(gx * 5.3, gz * 0.7) - 0.5) * LITTER_CELL;
      if ((x - cx) * (x - cx) + (z - cz) * (z - cz) > LITTER_RADIUS * LITTER_RADIUS) continue;
      if (Math.hypot(x, z) < MOUND_RADIUS + 1.5) continue; // keep the doorstep tidy
      if (isWater(x, z)) continue;
      let biome = biomeAt(x, z);
      if (isWater(x + 5, z) || isWater(x - 5, z) || isWater(x, z + 5) || isWater(x, z - 5)) biome = "water";
      for (const zn of LITTER_ZONES) {
        if ((x - zn.x) * (x - zn.x) + (z - zn.z) * (z - zn.z) < zn.r * zn.r) {
          biome = zn.biome;
          break;
        }
      }
      const spec = LITTER_BIOMES[biome] || LITTER_BIOMES.meadow;
      if (hash2(gx * 2.9 + 11, gz * 4.3 - 7) > spec.chance) continue;
      const key = gx + "," + gz;
      if (litterTaken.has(key)) continue;
      // pick a kind by weight
      let total = 0;
      for (const [, w] of spec.kinds) total += w;
      let r = hash2(gx * 7.7 - 3, gz * 1.9 + 5) * total;
      let kind = spec.kinds[0][0];
      for (const [k, w] of spec.kinds) {
        r -= w;
        if (r <= 0) {
          kind = k;
          break;
        }
      }
      const inst = litter.meshes[kind];
      const i = counts[kind];
      if (i >= LITTER_CAP) continue;
      const s = 0.8 + hash2(gx + 31, gz - 17) * 0.6;
      _gq.setFromAxisAngle(_gup, hash2(gx - 9, gz + 4) * Math.PI * 2);
      _gm4.compose(_gpos.set(x, terrainHeight(x, z) + 0.01, z), _gq, _gscl.set(s, s, s));
      inst.setMatrixAt(i, _gm4);
      const pal = LITTER_KINDS[kind].colors;
      _lc.setHex(pal[(hash2(gx * 0.3, gz * 0.9) * pal.length) | 0]);
      inst.setColorAt(i, _lc);
      counts[kind] = i + 1;
      placed.push({ key, kind, x, z });
    }
  }
  for (const [k, inst] of Object.entries(litter.meshes)) {
    inst.count = counts[k];
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }
  litter.placed = placed;
}

/**
 * The nearest gatherable bit of litter within r of (x, z) — optionally only
 * of one use ("twig", "tinder", "leaf", "food", "moss"). → { key, kind,
 * label, gather, x, z } or null.
 */
export function litterNear(x, z, r, gather = null) {
  if (!litter) return null;
  let best = null;
  let bd = r;
  for (const p of litter.placed) {
    const info = LITTER_KINDS[p.kind];
    if (gather ? info.gather !== gather : !info.gather && !info.items.length) continue;
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  if (!best) return null;
  const info = LITTER_KINDS[best.kind];
  return { ...best, label: info.label, gather: info.gather, items: info.items };
}

/** Pick up a bit of litter (it won't grow back). */
export function takeLitter(key) {
  litterTaken.add(key);
  if (litter) refillLitter(litter.lastX, litter.lastZ, true);
}

export { biomeAt };


// ------------------------------------------------------------
//  🏕️  THE SUMMER CAMPSITE — where the giants (people!) camp in summer.
//  Everything is ENORMOUS to a mouse: a tent like a mountain, fire-ring
//  stones like boulders, a picnic blanket like a field. They've gone home —
//  but they always leave treasures behind: string, cloth, buttons, beads…
// ------------------------------------------------------------
function buildCampsite(group, colliders, cx, cz) {
  const g = new THREE.Group();
  const gy = terrainHeight(cx, cz);
  g.position.set(cx, gy, cz);
  // ground height under a spot (local x/z), relative to the group — so every
  // prop sits ON the slope beneath it, never floating, never buried
  const at = (lx, lz) => terrainHeight(cx + lx, cz + lz) - gy;
  // the LOWEST ground under a footprint, for big things (bed them in a bit)
  const low = (lx, lz, r) => Math.min(at(lx, lz), at(lx + r, lz), at(lx - r, lz), at(lx, lz + r), at(lx, lz - r));
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

  // the tent: a giant orange ridge tent, sunk into the ground at its lowest corner
  const tent = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 42, 3, 1), M(0xe0782e));
  tent.rotation.z = Math.PI / 2;
  tent.rotation.x = Math.PI / 2;
  tent.position.set(-26, low(-26, -18, 16) + 7.2, -18);
  tent.castShadow = true;
  g.add(tent);
  const door = new THREE.Mesh(new THREE.CircleGeometry(7, 3), M(0x3a2414, { side: THREE.DoubleSide }));
  door.rotation.z = Math.PI / 2;
  door.position.set(-26, low(-26, 3, 6) + 5.3, 3.2);
  g.add(door);
  colliders.push({ x: cx - 26, z: cz - 18, r: 17 });

  // the fire ring: boulder-sized stones, each bedded where it lies
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sx = 14 + Math.cos(a) * 7;
    const sz = 6 + Math.sin(a) * 7;
    const st = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), M(0x8a8880));
    st.scale.set(1, 0.7, 1);
    st.position.set(sx, low(sx, sz, 2) + 0.9, sz);
    st.rotation.y = i;
    g.add(st);
    colliders.push({ x: cx + sx, z: cz + sz, r: 2.2 });
  }
  // ash and charred logs, draped on the ground
  const ashGeo = new THREE.CircleGeometry(5.5, 14).rotateX(-Math.PI / 2);
  const ap = ashGeo.attributes.position;
  for (let i = 0; i < ap.count; i++) ap.setY(i, at(14 + ap.getX(i), 6 + ap.getZ(i)) + 0.07);
  ashGeo.computeVertexNormals();
  g.add(new THREE.Mesh(ashGeo, M(0x4a4640)));
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 9, 7), M(0x2a2018));
    log.rotation.z = Math.PI / 2;
    log.rotation.y = i * 1.1;
    log.position.set(14, low(14, 6, 4.5) + 0.75, 6);
    g.add(log);
  }

  // the picnic blanket: a checkered field that follows every bump of the ground
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x2 = c.getContext("2d");
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    x2.fillStyle = (i + j) % 2 ? "#d84a3a" : "#f2ead8";
    x2.fillRect(i * 8, j * 8, 8, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const bGeo = new THREE.PlaneGeometry(26, 20, 26, 20).rotateX(-Math.PI / 2).rotateY(0.2);
  const bp = bGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) bp.setY(i, at(-4 + bp.getX(i), 24 + bp.getZ(i)) + 0.08);
  bGeo.computeVertexNormals();
  const blanket = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  blanket.position.set(-4, 0, 24);
  g.add(blanket);

  // a dropped tin cup (lying on its side) and a bottle cap
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.6, 6, 14, 1, true), M(0xb8bcc4, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }));
  cup.rotation.z = Math.PI / 2;
  cup.position.set(4, low(4, 18, 3) + 2.7, 18);
  g.add(cup);
  colliders.push({ x: cx + 4, z: cz + 18, r: 3.2 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.5, 16), M(0xc83a2a, { metalness: 0.4 }));
  cap.position.set(-12, low(-12, 30, 1.4) + 0.22, 30);
  g.add(cap);

  // a sign the giants put up — its post driven into the ground
  const sy = at(30, -10);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 16, 0.8), M(0x6b4a2c));
  post.position.set(30, sy + 6, -10); // 2 units of it are underground
  const board = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 0.5), M(0x6b4a2c));
  board.position.set(30, sy + 13, -10);
  g.add(post, board);
  colliders.push({ x: cx + 30, z: cz - 10, r: 0.8 });
  const label = makeLabel("Summer Campsite");
  label.scale.set(16, 4, 1);
  label.position.set(0, 26, 0);
  g.add(label);
  group.add(g);
}
