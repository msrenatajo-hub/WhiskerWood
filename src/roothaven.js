// ------------------------------------------------------------
//  🪨  ROOTHAVEN — the City of Builders, beneath the forest.
//
//  “Beneath every great forest lies an even older story.”
//
//  Down the stairs behind the Moon Door, a cavern so big its ceiling is
//  lost in darkness. The colossal roots of the World Pine come down out of
//  the black and the whole city is built around them — never cutting one.
//  A glowing river runs through it under stone bridges; hundreds of
//  lanterns; and in every district, mice who never stopped living here.
//
//    Root Hall (the Council of Roots)   north, a great root through its roof
//    Archive Hall                         north-west, columns + a round window
//    Crystal Quarter                      north-east, crystal lamps
//    Hearth District                      west, round moss-roofed homes
//    the Foundry                          east, a water wheel in the river
//    River District                       south, docks and boats
//
//  Like the tunnels, it's its own place: flat-ish floor (height()), a ring
//  wall, and constrain() keeps you out of buildings. The river is a shallow
//  channel you can splash through; the bridges arch over it (their decks are
//  part of height(), so you walk right over them).
// ------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildThistle } from "./outside.js";

const R = 125; // the cavern's radius
// the river's centerline, west → east
const RIVER = [[-130, 18], [-85, 14], [-45, 30], [0, 33], [42, 22], [82, 6], [130, -2]];
const RIVER_HALF = 4.2;
// stone bridges: x positions along the river
const BRIDGE_X = [-50, 8, 56];
// the three sluice gates, upstream of the Foundry (x along the river)
const GATE_X = [-95, -20, 30];

function hash(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
// the river: nearest point, distance, and direction at a given x
function riverAt(x) {
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i];
    const [bx, bz] = RIVER[i + 1];
    if (x >= ax && x <= bx) {
      const k = (x - ax) / (bx - ax);
      // smooth it a little between points
      const s = k * k * (3 - 2 * k);
      const z = az + (bz - az) * s;
      const dz = (bz - az) / (bx - ax);
      return { z, dir: Math.atan2(1, dz) };
    }
  }
  return { z: RIVER[RIVER.length - 1][1], dir: Math.PI / 2 };
}
function riverDist(x, z) {
  return Math.abs(z - riverAt(x).z);
}

/** The ground's height (stone floor, river channel, bridge decks). */
export function rhHeight(x, z) {
  let y = (hash(Math.floor(x / 6), Math.floor(z / 6)) - 0.5) * 0.15;
  const d = riverDist(x, z);
  if (d < RIVER_HALF + 1.5) {
    const k = Math.min(1, d / (RIVER_HALF + 1.5));
    y -= 1.1 * (1 - k * k);
  }
  // walk up and over the bridges
  for (const bx of BRIDGE_X) {
    const rz = riverAt(bx).z;
    const dx = x - bx;
    const dz = z - rz;
    if (Math.abs(dx) < 2.4 && Math.abs(dz) < 9) {
      const t = dz / 9;
      y = Math.max(y, 1.6 * (1 - t * t));
    }
  }
  return y;
}

export function buildRoothaven() {
  const group = new THREE.Group();
  group.visible = false;
  const colliders = []; // { x, z, r }
  const pieces = new Map(); // material key -> geometries (merged at the end)
  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: 1, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 1, flatShading: true }),
    clay: new THREE.MeshStandardMaterial({ color: 0xa8784a, roughness: 1, flatShading: true }),
    bark: new THREE.MeshStandardMaterial({ color: 0x5e4430, roughness: 1, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5e36, roughness: 1, flatShading: true }),
    moss: new THREE.MeshStandardMaterial({ color: 0x4e7a3a, roughness: 1, flatShading: true }),
    slate: new THREE.MeshStandardMaterial({ color: 0x3e4a58, roughness: 1, flatShading: true }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffc870 }), // lantern glass + windows
    crystal: new THREE.MeshBasicMaterial({ color: 0xb89cf0 }),
    door: new THREE.MeshBasicMaterial({ color: 0x1a120c }),
  };
  const put = (key, geo, x, y, z, ry = 0) => {
    geo.rotateY(ry);
    geo.translate(x, y, z);
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal") g.deleteAttribute(n);
    if (!pieces.has(key)) pieces.set(key, []);
    pieces.get(key).push(g);
  };
  const H = rhHeight;

  // ---------- the floor ----------
  const floorGeo = new THREE.PlaneGeometry(R * 2.2, R * 2.2, 110, 110).rotateX(-Math.PI / 2);
  const fp = floorGeo.attributes.position;
  const fcol = [];
  const cA = new THREE.Color(0x5a5048);
  const cB = new THREE.Color(0x6e6252);
  const cMoss = new THREE.Color(0x3e5a32);
  for (let i = 0; i < fp.count; i++) {
    const x = fp.getX(i);
    const z = fp.getZ(i);
    fp.setY(i, H(x, z) - 0.02);
    const c = cA.clone().lerp(cB, hash(Math.floor(x / 4), Math.floor(z / 4)));
    if (hash(Math.floor(x / 9) + 3, Math.floor(z / 9)) > 0.8) c.lerp(cMoss, 0.6); // moss patches
    fcol.push(c.r, c.g, c.b);
  }
  floorGeo.setAttribute("color", new THREE.Float32BufferAttribute(fcol, 3));
  floorGeo.computeVertexNormals();
  group.add(new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));

  // ---------- the cavern wall (fading up into darkness) ----------
  {
    const wall = new THREE.CylinderGeometry(R + 4, R + 10, 70, 48, 6, true);
    const wp = wall.attributes.position;
    for (let i = 0; i < wp.count; i++) {
      const k = (hash(Math.round(wp.getX(i)), Math.round(wp.getZ(i) + wp.getY(i))) - 0.5) * 6;
      wp.setX(i, wp.getX(i) * (1 + k / R));
      wp.setZ(i, wp.getZ(i) * (1 + k / R));
    }
    wall.computeVertexNormals();
    const m = new THREE.Mesh(wall, new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 1, flatShading: true, side: THREE.BackSide }));
    m.position.y = 30;
    group.add(m);
  }

  // ---------- the World Pine: its trunk and roots, coming down from the dark ----------
  {
    const trunk = new THREE.CylinderGeometry(9, 14, 140, 14, 8);
    const tp = trunk.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const k = (hash(Math.round(tp.getX(i) * 2), Math.round(tp.getY(i) / 6)) - 0.5) * 1.6;
      tp.setX(i, tp.getX(i) + k);
      tp.setZ(i, tp.getZ(i) + k);
    }
    put("bark", trunk, 0, 68, -5);
    colliders.push({ x: 0, z: -5, r: 15 });
    // great roots: from high in the dark, sweeping down to the floor
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.3;
      // the roots plunge down close round the trunk (the city around them stays open)
      const far = 22 + hash(i, 1) * 26;
      const ex = Math.cos(a) * far;
      const ez = -5 + Math.sin(a) * far;
      // keep them clear of the river, and of the view from the stairs (north)
      if (riverDist(ex, ez) < 12) continue;
      if (Math.sin(a) < -0.75) continue;
      const pts = [
        new THREE.Vector3(Math.cos(a) * 8, 70, -5 + Math.sin(a) * 8),
        new THREE.Vector3(Math.cos(a) * (far * 0.45), 46 + hash(i, 2) * 10, -5 + Math.sin(a) * (far * 0.45)),
        new THREE.Vector3(Math.cos(a) * (far * 0.85), 14, -5 + Math.sin(a) * (far * 0.85)),
        new THREE.Vector3(ex, H(ex, ez) - 1, ez),
      ];
      const r = 2.4 + hash(i, 3) * 2.2;
      put("bark", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 8, false), 0, 0, 0);
      colliders.push({ x: ex, z: ez, r: r + 0.6 });
      const mid = pts[2];
      if (mid.y < 18) colliders.push({ x: mid.x, z: mid.z, r: r * 0.8 });
    }
    // hanging lanterns on the trunk, like stars
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4;
      const y = 6 + (i % 10) * 5;
      put("glow", new THREE.BoxGeometry(0.6, 0.8, 0.6), Math.cos(a) * 14.5, y, -5 + Math.sin(a) * 14.5);
    }
  }

  // ---------- the glowing river ----------
  const riverMat = new THREE.MeshStandardMaterial({ color: 0x1f7a8a, emissive: 0x1aa0b0, emissiveIntensity: 0.9, roughness: 0.2, transparent: true, opacity: 0.88 });
  {
    const verts = [];
    const idx = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const x = -R * 1.05 + (i / N) * R * 2.1;
      const { z } = riverAt(x);
      verts.push(x, -0.4, z - RIVER_HALF, x, -0.4, z + RIVER_HALF);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, riverMat));
  }
  // stone bridges (their decks are walkable: see rhHeight)
  for (const bx of BRIDGE_X) {
    const { z: rz } = riverAt(bx);
    for (let s = -8; s <= 8; s++) {
      const t = s / 9;
      const y = 1.6 * (1 - t * t);
      put("stone", new THREE.BoxGeometry(4.6, 0.5, 1.05), bx, y - 0.25, rz + s);
    }
    for (const side of [-1, 1]) {
      for (let s = -8; s <= 8; s += 4) {
        const t = s / 9;
        put("stone", new THREE.BoxGeometry(0.5, 1, 0.5), bx + side * 2.2, 1.6 * (1 - t * t) + 0.5, rz + s);
      }
      // a lantern at each end
      put("dark", new THREE.CylinderGeometry(0.12, 0.14, 3, 6), bx + side * 2.6, 1.5, rz - 9.5 * side);
      put("glow", new THREE.BoxGeometry(0.6, 0.7, 0.6), bx + side * 2.6, 3.2, rz - 9.5 * side);
    }
  }

  // ---------- buildings ----------
  const house = (x, z, r, h, wallKey, roofKey, ry = 0) => {
    const y = H(x, z);
    put(wallKey, new THREE.CylinderGeometry(r, r * 1.05, h, 10), x, y + h / 2, z);
    put(roofKey, new THREE.SphereGeometry(r * 1.15, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.65, 1), x, y + h, z);
    // a round door and a warm window, facing ry
    const fx = Math.sin(ry);
    const fz = Math.cos(ry);
    put("door", new THREE.CircleGeometry(r * 0.38, 12), x + fx * (r + 0.02), y + r * 0.38, z + fz * (r + 0.02), ry);
    put("glow", new THREE.CircleGeometry(r * 0.2, 8), x + Math.sin(ry + 0.9) * (r + 0.02), y + h * 0.62, z + Math.cos(ry + 0.9) * (r + 0.02), ry + 0.9);
    colliders.push({ x, z, r: r + 0.4 });
  };
  const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

  // Hearth District (west): round homes with moss roofs, moss gardens
  const HEARTH = { x: -62, z: -12 };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const x = HEARTH.x + Math.cos(a) * 18;
    const z = HEARTH.z + Math.sin(a) * 15;
    house(x, z, 3.2 + hash(i, 5), 4 + hash(i, 6) * 2, "clay", "moss", facing(x, z, HEARTH.x, HEARTH.z));
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 2.1;
    const x = HEARTH.x + Math.cos(a) * 7;
    const z = HEARTH.z + Math.sin(a) * 6;
    put("moss", new THREE.SphereGeometry(0.9, 6, 4).scale(1.3, 0.35, 1.3), x, H(x, z), z);
  }
  // south homes, across the river
  for (const [x, z] of [[-40, 62], [-22, 70], [32, 58], [50, 66], [-60, 55]]) house(x, z, 3.4, 4.5, "clay", "slate", facing(x, z, 0, 40));

  // Root Hall (north): the council hall, a root coming through its roof
  const HALL = { x: 36, z: -80 }; // north-east, beside the way in
  {
    const y = H(HALL.x, HALL.z);
    put("stone", new THREE.BoxGeometry(28, 12, 18), HALL.x, y + 6, HALL.z);
    put("slate", new THREE.CylinderGeometry(0.01, 18, 7, 4).rotateY(Math.PI / 4).scale(1.1, 1, 0.75), HALL.x, y + 15.5, HALL.z);
    for (let i = -3; i <= 3; i++) put("stone", new THREE.CylinderGeometry(0.9, 1.1, 11, 8), HALL.x + i * 4, y + 5.5, HALL.z + 9.6);
    put("door", new THREE.PlaneGeometry(5, 7), HALL.x, y + 3.5, HALL.z + 9.05);
    for (let i = -2; i <= 2; i++) if (i) put("glow", new THREE.PlaneGeometry(1.4, 2.4), HALL.x + i * 5.2, y + 7.5, HALL.z + 9.06);
    put("bark", new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(HALL.x + 4, 80, HALL.z - 20), new THREE.Vector3(HALL.x + 2, 40, HALL.z - 6), new THREE.Vector3(HALL.x, 14, HALL.z), new THREE.Vector3(HALL.x - 1, y + 1, HALL.z + 1),
    ]), 20, 3.2, 8, false), 0, 0, 0);
    for (let k = -10; k <= 10; k += 5) colliders.push({ x: HALL.x + k, z: HALL.z, r: 9.6 });
  }
  // Archive Hall (north-west): columns and a great round window
  const ARCHIVE = { x: -62, z: -52 };
  {
    const y = H(ARCHIVE.x, ARCHIVE.z);
    const ry = facing(ARCHIVE.x, ARCHIVE.z, 0, -5);
    put("stone", new THREE.BoxGeometry(16, 14, 12), ARCHIVE.x, y + 7, ARCHIVE.z, ry);
    put("slate", new THREE.BoxGeometry(17, 1, 13), ARCHIVE.x, y + 14.5, ARCHIVE.z, ry);
    const fx = Math.sin(ry);
    const fz = Math.cos(ry);
    put("glow", new THREE.CircleGeometry(3, 18), ARCHIVE.x + fx * 6.05, y + 9.5, ARCHIVE.z + fz * 6.05, ry);
    put("door", new THREE.PlaneGeometry(3.5, 5), ARCHIVE.x + fx * 6.04, y + 2.5, ARCHIVE.z + fz * 6.04, ry);
    for (const s of [-1, 1]) {
      for (const k of [3.2, 6.4]) {
        const px = ARCHIVE.x + fx * 7 + Math.cos(ry) * s * k;
        const pz = ARCHIVE.z + fz * 7 - Math.sin(ry) * s * k;
        put("stone", new THREE.CylinderGeometry(0.7, 0.8, 13, 8), px, y + 6.5, pz);
      }
    }
    colliders.push({ x: ARCHIVE.x, z: ARCHIVE.z, r: 10.6 });
  }
  // Crystal Quarter (north-east): crystal lamps on stone posts
  const CRYSTAL = { x: 58, z: -50 };
  const crystalSpots = []; // (💎 E by any of them for crystal fragments)
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const rr = 4 + (i % 4) * 4;
    const x = CRYSTAL.x + Math.cos(a) * rr;
    const z = CRYSTAL.z + Math.sin(a) * rr;
    put("stone", new THREE.CylinderGeometry(0.3, 0.4, 3, 6), x, H(x, z) + 1.5, z);
    put("crystal", new THREE.OctahedronGeometry(0.8, 0).scale(0.7, 1.5, 0.7), x, H(x, z) + 3.8, z);
    crystalSpots.push({ x, z });
  }
  for (const [x, z] of [[72, -58], [56, -62], [72, -38]]) house(x, z, 3.6, 5, "stone", "slate", facing(x, z, CRYSTAL.x, CRYSTAL.z));
  // the Foundry (east): a workshop with a chimney, and a water wheel in the river
  const FOUNDRY = { x: 80, z: -12 };
  let wheel = null;
  {
    const y = H(FOUNDRY.x, FOUNDRY.z);
    put("stone", new THREE.BoxGeometry(16, 9, 12), FOUNDRY.x, y + 4.5, FOUNDRY.z);
    put("slate", new THREE.CylinderGeometry(0.01, 12, 5, 4).rotateY(Math.PI / 4).scale(1, 1, 0.75), FOUNDRY.x, y + 11.5, FOUNDRY.z);
    put("dark", new THREE.CylinderGeometry(1.4, 1.8, 10, 8), FOUNDRY.x + 5, y + 14, FOUNDRY.z - 3);
    put("door", new THREE.PlaneGeometry(4, 5), FOUNDRY.x - 8.05, y + 2.5, FOUNDRY.z, -Math.PI / 2);
    colliders.push({ x: FOUNDRY.x, z: FOUNDRY.z, r: 10.6 }); // covers the corners too
    // the great water wheel, standing in the river beside the Foundry
    const { z: rz } = riverAt(FOUNDRY.x);
    wheel = new THREE.Group();
    wheel.position.set(FOUNDRY.x, 4.2, rz - 1);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.35, 6, 24), mats.wood);
    wheel.add(rim);
    for (let i = 0; i < 12; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.25, 9, 0.25), mats.wood);
      sp.rotation.z = (i / 12) * Math.PI;
      wheel.add(sp);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.6), mats.wood);
      const a = (i / 12) * Math.PI * 2;
      pad.position.set(Math.cos(a) * 4.8, Math.sin(a) * 4.8, 0);
      pad.rotation.z = a;
      wheel.add(pad);
    }
    // (the wheel stands along the current, its axle across the river)
    group.add(wheel);
    colliders.push({ x: FOUNDRY.x, z: rz - 1, r: 2.4 });
  }
  // the Foundry's chimney glow (cold until the wheel turns)
  const forge = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a2a20 }));
  forge.position.set(FOUNDRY.x + 5, H(FOUNDRY.x, FOUNDRY.z) + 19.5, FOUNDRY.z - 3);
  group.add(forge);
  // River District (south): docks and boats
  const DOCKS = { x: 10, z: 42 };
  for (let i = 0; i < 6; i++) put("wood", new THREE.BoxGeometry(3, 0.3, 6), DOCKS.x - 9 + i * 3.4, 0.25, riverAt(DOCKS.x - 9 + i * 3.4).z + RIVER_HALF + 2);
  for (const bx of [-6, 14]) {
    const { z: rz } = riverAt(bx);
    put("wood", new THREE.CylinderGeometry(1.2, 1.2, 5.5, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), bx, -0.1, rz + 1);
  }

  // ---------- the three sluice gates (Phase 6 opens them) ----------
  const gates = GATE_X.map((gx, i) => {
    const { z: rz } = riverAt(gx);
    const g = new THREE.Group();
    g.position.set(gx, 0, rz);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), mats.wood);
      post.position.set(0, 1.5, s * (RIVER_HALF + 0.6));
      g.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, RIVER_HALF * 2 + 2), mats.wood);
    beam.position.y = 4;
    g.add(beam);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, RIVER_HALF * 2), mats.bark);
    board.position.y = -0.2;
    g.add(board);
    const valve = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 5, 12), mats.dark);
    valve.position.set(0, 2.4, RIVER_HALF + 1.4);
    valve.rotation.y = Math.PI / 2;
    g.add(valve);
    group.add(g);
    // stand by the valve on the bank to turn it
    return { g, board, valve, at: { x: gx, z: rz + RIVER_HALF + 2.6 }, i };
  });

  // ---------- the stair down from the Moon Door (north edge) ----------
  const STAIRS = { x: 0, z: -112 };
  for (let i = 0; i < 18; i++) {
    const a = Math.PI * 0.5 + (i / 18) * Math.PI * 1.6;
    const y = (18 - i) * 1.1;
    put("stone", new THREE.BoxGeometry(3.2, 0.5, 1.6), STAIRS.x + Math.cos(a) * 5, y, STAIRS.z + Math.sin(a) * 5, -a);
  }
  put("dark", new THREE.CylinderGeometry(1.4, 1.6, 22, 10), STAIRS.x, 11, STAIRS.z);
  colliders.push({ x: STAIRS.x, z: STAIRS.z, r: 3 });

  // ---------- lanterns on posts along the ways ----------
  const lanternAt = (x, z) => {
    put("dark", new THREE.CylinderGeometry(0.1, 0.12, 2.8, 5), x, H(x, z) + 1.4, z);
    put("glow", new THREE.BoxGeometry(0.5, 0.6, 0.5), x, H(x, z) + 3, z);
  };
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const x = Math.cos(a) * 34;
    const z = -5 + Math.sin(a) * 34;
    if (riverDist(x, z) > 7) lanternAt(x, z);
  }
  for (let z = -100; z < -68; z += 8) lanternAt(4, z), lanternAt(-4, z);

  // ---------- merge ----------
  for (const [key, list] of pieces) group.add(new THREE.Mesh(mergeGeometries(list), mats[key]));

  // a few real lights (warm), the rest is glow
  const lights = [];
  for (const [x, y, z, i, d] of [[0, 30, -5, 80, 110], [HEARTH.x, 12, HEARTH.z, 40, 45], [HALL.x, 14, HALL.z + 14, 36, 45], [ARCHIVE.x + 6, 12, ARCHIVE.z + 8, 30, 40]]) {
    const l = new THREE.PointLight(0xffb868, i, d, 1.5);
    l.position.set(x, y, z);
    group.add(l);
    lights.push(l);
  }

  // ---------- ✨ MAGIC: glowing water, spray, mist, motes, mushrooms ----------
  const fx = []; // particle systems (their uniforms tick in update)
  const particles = (positions, opts) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const seeds = new Float32Array(positions.length / 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = hash(i * 1.7, opts.seed || 3);
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const u = {
      uTime: { value: 0 },
      uRise: { value: opts.rise ?? 2 },
      uSpread: { value: opts.spread ?? 0.6 },
      uSpeed: { value: opts.speed ?? 0.4 },
      uSize: { value: opts.size ?? 0.25 },
      uOn: { value: opts.on ?? 1 },
      uColor: { value: new THREE.Color(opts.color ?? 0x8ff0ff) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime, uRise, uSpread, uSpeed, uSize, uOn;
        attribute float aSeed;
        varying float vA;
        void main() {
          float k = fract(uTime * uSpeed + aSeed);
          vec3 p = position;
          p.y += k * uRise;
          p.x += sin(uTime * 0.7 + aSeed * 31.0) * uSpread * (0.3 + k);
          p.z += cos(uTime * 0.6 + aSeed * 17.0) * uSpread * (0.3 + k);
          vA = sin(k * 3.14159) * uOn * (0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 50.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, (1.0 - d * 2.0) * vA);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group.add(pts);
    fx.push(u);
    return u;
  };
  // drifting motes of light filling the cavern — gold near the city, teal by the water
  {
    const gold = [];
    const teal = [];
    for (let i = 0; i < 900; i++) {
      const a = hash(i, 1) * Math.PI * 2;
      const r = Math.sqrt(hash(i, 2)) * (R - 8);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = H(x, z) + 0.5 + hash(i, 3) * 14;
      (riverDist(x, z) < 14 ? teal : gold).push(x, y, z);
    }
    particles(gold, { color: 0xffd27a, rise: 6, spread: 1.6, speed: 0.05, size: 0.35, seed: 5 });
    particles(teal, { color: 0x7ff6ff, rise: 6, spread: 1.6, speed: 0.06, size: 0.35, seed: 7 });
  }
  // spray sparkling up off the whole glowing river
  {
    const spray = [];
    for (let i = 0; i < 700; i++) {
      const x = -R + hash(i, 4) * R * 2;
      const z = riverAt(x).z + (hash(i, 5) - 0.5) * RIVER_HALF * 1.8;
      spray.push(x, -0.35, z);
    }
    particles(spray, { color: 0x9ffcff, rise: 1.6, spread: 0.3, speed: 0.55, size: 0.22, seed: 9 });
  }
  // two glowing waterfalls pour out of the cavern wall into the river
  const fallsMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float s = sin(vUv.x * 40.0 + sin(uTime * 2.0 + vUv.y * 9.0)) * 0.5 + 0.5;
        float flow = fract(vUv.y * 3.0 + uTime * 1.2 + s * 0.1);
        vec3 col = mix(vec3(0.15, 0.7, 0.8), vec3(0.75, 1.0, 1.0), s * 0.5 + (1.0 - flow) * 0.4);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        gl_FragColor = vec4(col, edge * (0.55 + s * 0.3));
      }`,
  });
  fx.push(fallsMat.uniforms);
  for (const [x, top, w] of [[-R + 3, 34, 8], [R - 4, 26, 6]]) {
    const { z } = riverAt(x);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, top + 2, 6, 12), fallsMat);
    sheet.position.set(x, top / 2 - 1, z);
    sheet.rotation.y = Math.PI / 2;
    group.add(sheet);
    const mist = [];
    for (let i = 0; i < 260; i++) mist.push(x + (hash(i, x) - 0.5) * 8 + (x < 0 ? 3 : -3), -0.3, z + (hash(i, z + 9) - 0.5) * w * 1.6);
    particles(mist, { color: 0xbffcff, rise: 7, spread: 2.2, speed: 0.35, size: 0.6, seed: x });
    const glow = new THREE.PointLight(0x5fe8ff, 30, 40, 1.6);
    glow.position.set(x + (x < 0 ? 6 : -6), 6, z);
    group.add(glow);
  }
  // splashes around the water wheel — only once it turns
  let wheelSpray = null;
  {
    const W = { x: FOUNDRY.x, z: riverAt(FOUNDRY.x).z - 1 };
    const sp = [];
    for (let i = 0; i < 220; i++) sp.push(W.x + (hash(i, 11) - 0.5) * 9, -0.2, W.z + (hash(i, 12) - 0.5) * 3.5);
    wheelSpray = particles(sp, { color: 0xd8ffff, rise: 3.2, spread: 1.2, speed: 0.9, size: 0.45, on: 0, seed: 13 });
  }
  // glowing mushrooms and crystal clusters around the roots and the banks
  {
    const caps = [];
    const stems = [];
    const crystals = [];
    for (let i = 0; i < 160; i++) {
      const a = hash(i, 21) * Math.PI * 2;
      const r = 16 + hash(i, 22) * 95;
      let x = Math.cos(a) * r;
      let z = -5 + Math.sin(a) * r;
      if (i % 3 === 0) {
        // line the riverbanks
        x = -R + hash(i, 23) * R * 2;
        z = riverAt(x).z + (hash(i, 24) > 0.5 ? 1 : -1) * (RIVER_HALF + 1.2 + hash(i, 25) * 2);
      }
      if (colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue;
      const y = H(x, z);
      const h = 0.25 + hash(i, 26) * 0.9;
      const sz = 0.18 + h * 0.3;
      stems.push(new THREE.CylinderGeometry(sz * 0.25, sz * 0.32, h, 5).translate(x, y + h / 2, z));
      caps.push(new THREE.SphereGeometry(sz, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1).translate(x, y + h, z));
      if (i % 5 === 0) crystalSpots.push({ x: x + 0.8, z: z + 0.5 });
      if (i % 5 === 0) crystals.push(new THREE.OctahedronGeometry(0.4 + hash(i, 27) * 0.5, 0).scale(0.6, 1.8, 0.6).rotateZ((hash(i, 28) - 0.5) * 0.6).translate(x + 0.8, y + 0.5, z + 0.5));
    }
    const clean = (list) => list.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal") n.deleteAttribute(k);
      return n;
    });
    if (caps.length) group.add(new THREE.Mesh(mergeGeometries(clean(caps)), new THREE.MeshBasicMaterial({ color: 0x6ff0e0 })));
    if (stems.length) group.add(new THREE.Mesh(mergeGeometries(clean(stems)), new THREE.MeshBasicMaterial({ color: 0xc8e8f0 })));
    if (crystals.length) group.add(new THREE.Mesh(mergeGeometries(clean(crystals)), new THREE.MeshBasicMaterial({ color: 0xc4a0ff })));
    // a soft teal glow over the river so the water lights its banks
    for (const x of [-80, -20, 40, 100]) {
      const l = new THREE.PointLight(0x40e0f0, 18, 34, 1.6);
      l.position.set(x, 3, riverAt(x).z);
      group.add(l);
    }
  }

  // ---------- the people of Roothaven ----------
  const people = [];
  const person = (key, name, role, tunic, hood, x, z, face, scale = 1) => {
    const m = buildThistle({ tunicColor: tunic, hoodColor: hood, pack: false });
    m.scale.setScalar(scale);
    m.position.set(x, H(x, z), z);
    m.rotation.y = face;
    m.userData.home = { x, z, face };
    group.add(m);
    const p = { key, name, role, mesh: m, x, z };
    people.push(p);
    return p;
  };
  person("speaker", "Root Speaker Oriel", "elder", 0x3e4a58, 0x2e3a48, HALL.x, HALL.z + 13, 0, 1.15);
  person("foundry", "Foundry Master Cobble", "engineer", 0x6a4a2e, 0x4a3420, FOUNDRY.x - 12.5, FOUNDRY.z + 2, -Math.PI / 2, 1.1);
  person("archivist", "Archivist Sable", "archivist", 0x5a4a6a, 0x4a3a5a, ARCHIVE.x + 10, ARCHIVE.z + 9, Math.PI * 0.8, 1.0);
  // townsfolk going about their day
  const folk = [[0x8a6a4a, -30, -20], [0x4a6a8a, 20, -30], [0x6a8a4a, -15, 48], [0xa8843c, 40, 40], [0x7a5a8a, -45, 10], [0x996a4a, 30, -60], [0x5a7a6a, -20, -40]];
  folk.forEach(([c, x, z], i) => person("folk" + i, "Roothaven mouse", "citizen", c, c, x, z, hash(i, 9) * 6, 0.95));

  // the expedition, safe in the Hearth District (Phase 6 reveals them)
  const expedition = [];
  const EXP = [
    ["willow", "Teacher Willow", 0x5d4a38, 0x4a3a2c, 1.05],
    ["fern", "Teacher Fern", 0x4f7a3a, 0x3f6a2e, 1.02],
    ["tinker", "Master Tinker", 0x8a5a2e, 0x6a4422, 1.0],
    ["clover", "Clover", 0x8a5a68, 0x8a5a68, 0.82],
    ["hazel", "Hazel", 0x5a6a8a, 0x5a6a8a, 0.82],
    ["juniper", "Juniper", 0xa8843c, 0xa8843c, 0.82],
    ["sorrel", "Sorrel", 0x6a8a5a, 0x6a8a5a, 0.82],
    ["wren", "Wren", 0x7a5a8a, 0x7a5a8a, 0.82],
    ["tansy", "Tansy", 0x996a4a, 0x996a4a, 0.82],
  ];
  EXP.forEach(([key, name, tunic, hood, sc], i) => {
    const a = (i / EXP.length) * Math.PI * 2;
    const x = HEARTH.x + Math.cos(a) * 4.2;
    const z = HEARTH.z + Math.sin(a) * 3.6;
    const p = person(key, name, key === "willow" || key === "fern" || key === "tinker" ? "teacher" : "classmate", tunic, hood, x, z, Math.atan2(HEARTH.x - x, HEARTH.z - z), sc);
    expedition.push(p);
  });

  // ---------- walking ----------
  function constrain(p) {
    const d = Math.hypot(p.x, p.z);
    if (d > R - 4) {
      p.x *= (R - 4) / d;
      p.z *= (R - 4) / d;
    }
    for (const c of colliders) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const dd = Math.hypot(dx, dz);
      if (dd < c.r && dd > 0.0001) {
        p.x = c.x + (dx / dd) * c.r;
        p.z = c.z + (dz / dd) * c.r;
      }
    }
  }

  // ---------- each frame ----------
  let wheelSpeed = 0; // the Foundry's wheel turns once the sluices are open
  function update(t, dt, opts = {}) {
    wheelSpeed += ((opts.wheelOn ? 0.9 : 0) - wheelSpeed) * Math.min(1, dt * 0.8);
    if (wheel) wheel.rotation.z -= wheelSpeed * dt; // spinning on its axle, pushed by the current
    forge.material.color.set(opts.wheelOn ? 0xff8a30 : 0x3a2a20);
    for (const u of fx) u.uTime.value = t;
    if (wheelSpray) wheelSpray.uOn.value += ((opts.wheelOn ? 1 : 0) - wheelSpray.uOn.value) * Math.min(1, dt);
    riverMat.emissiveIntensity = 0.85 + Math.sin(t * 1.8) * 0.12;
    // townsfolk breathe and glance about
    for (const p of people) {
      const h = p.mesh.userData.home;
      if (p.mesh.userData.lookAt) {
        const L = p.mesh.userData.lookAt;
        p.mesh.rotation.y = Math.atan2(L.x - p.x, L.z - p.z);
      } else p.mesh.rotation.y = h.face + Math.sin(t * 0.4 + p.x) * 0.3;
      p.mesh.position.y = H(p.x, p.z) + Math.sin(t * 2 + p.z) * 0.01;
    }
  }

  return {
    group,
    colliders,
    height: rhHeight,
    /** 0..1 — how close the glowing river is (for the water sounds) */
    waterNear: (x, z) => Math.max(0, 1 - Math.max(0, riverDist(x, z) - RIVER_HALF) / 26),
    crystalSpots,
    constrain,
    update,
    gates,
    people,
    expedition,
    spots: {
      arrive: { x: 0, z: -100, face: 0 }, // at the stair's foot, facing the city
      stairsUp: { x: STAIRS.x, z: STAIRS.z + 4.5 },
      hearth: HEARTH,
      hall: { x: HALL.x, z: HALL.z + 13 },
      foundry: { x: FOUNDRY.x - 12.5, z: FOUNDRY.z + 2 },
      archive: { x: ARCHIVE.x + 10, z: ARCHIVE.z + 9 },
      pine: { x: 0, z: -5 },
      wheel: { x: FOUNDRY.x, z: riverAt(FOUNDRY.x).z },
    },
  };
}
