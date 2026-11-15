// ------------------------------------------------------------
//  🏙️  THE OTHER GREAT CITIES — Reedmere, Golden Hollow, Frostpine.
//
//  Each is its own place (like Roothaven), built from one shared kit:
//  a ground mesh shaped by height(), a wall of scenery at the edge,
//  colliders, walkable platforms, water you can swim (or raft) in,
//  heat sources (Frostpine), and a Moonkeeper WAYSTONE by the arrival
//  point (E = travel the old roads).
//
//    🌊 Reedmere      — a lagoon, docks, reed homes, the Lighthouse of Reeds
//    🌾 Golden Hollow — golden fields, a windmill, the Great Harvest Hall
//    ❄️ Frostpine     — snow, a frozen lake, ice ledges up to the Summit
//                       Beacon, and the Hall of Everfrost
// ------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildThistle } from "./outside.js";
import { ZONE_INFO, isZone, buildZone } from "./questZones.js";

export const R = 128; // every city's radius (as big as Roothaven)
function hash(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
const sm = (a, b, v) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export const CITY_INFO = {
  reedmere: { name: "Reedmere", sub: "the Marsh City", icon: "🌊" },
  golden: { name: "Golden Hollow", sub: "the Plains City", icon: "🌾" },
  frostpine: { name: "Frostpine", sub: "the Northern City", icon: "❄️" },
  silverveil: { name: "Silverveil", sub: "the Lost Sixth City", icon: "🌙" },
  ...ZONE_INFO,
};

/** Build one city by id. */
export function buildCity(id) {
  if (isZone(id)) return buildZone(id); // (the quest zones: the Pact Peaks, the Drowned Deep)
  const group = new THREE.Group();
  group.visible = false;
  const colliders = []; // { x, z, r }
  const platforms = []; // { x, z, r, y } (walkable tops)
  const heat = []; // { x, z, r, on } (warm places — Frostpine)
  const people = {};
  const live = []; // (t, dt) => void
  const pieces = new Map();
  const mats = {};
  const mat = (key, color, opts = {}) => (mats[key] ||= new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, ...opts }));
  const basic = (key, color) => (mats[key] ||= new THREE.MeshBasicMaterial({ color }));
  const put = (key, geo, x, y, z, ry = 0) => {
    geo.rotateY(ry);
    geo.translate(x, y, z);
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal") g.deleteAttribute(n);
    if (!pieces.has(key)) pieces.set(key, []);
    pieces.get(key).push(g);
  };

  // ---------- the shape of the land ----------
  const rimH = (d) => {
    const k = Math.max(0, (d - R * 0.82) / (R * 0.2));
    return k * k * 30;
  };
  let height;
  let waterAt = () => null; // → water surface y, or null
  const docks = []; // Reedmere: { x0, x1, z0, z1, y }
  const onDock = (x, z) => docks.find((d) => x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1);
  if (id === "reedmere") {
    height = (x, z) => {
      const dk = onDock(x, z);
      if (dk) return dk.y;
      const d = Math.hypot(x, z);
      if (d < 7) return 0.7; // the lighthouse island
      const shore = sm(42, 52, d); // 0 in the lagoon, 1 on land
      return -1.4 * (1 - shore) * (1 - sm(7, 10, d)) + 0.3 * shore + (hash(Math.floor(x / 5), Math.floor(z / 5)) - 0.5) * 0.2 * shore + rimH(d);
    };
    waterAt = (x, z) => {
      if (onDock(x, z)) return null;
      const d = Math.hypot(x, z);
      return d > 8 && d < 47 ? 0.2 : null;
    };
  } else if (id === "golden") {
    height = (x, z) => {
      const d = Math.hypot(x, z);
      const flat = 1 - sm(20, 40, Math.hypot(x, z + 30)); // flat yard round the Harvest Hall
      return (Math.sin(x * 0.06) * 1.8 + Math.cos(z * 0.05) * 1.6 + Math.sin((x + z) * 0.03) * 1.2) * (1 - flat) + rimH(d);
    };
  } else if (id === "silverveil") {
    // terraces of silver stone round a moon-pool
    height = (x, z) => {
      const d = Math.hypot(x, z);
      const pool = d < 16 ? -0.8 * (1 - (d / 16) ** 2) : 0;
      return pool + Math.floor(Math.max(0, d - 40) / 22) * 1.6 + rimH(d);
    };
    waterAt = (x, z) => (Math.hypot(x, z) < 14 ? 0 : null);
  } else {
    height = (x, z) => {
      const d = Math.hypot(x, z);
      return (hash(Math.floor(x / 7), Math.floor(z / 7)) - 0.5) * 0.4 + Math.sin(x * 0.05) * Math.cos(z * 0.04) * 1.5 + rimH(d) * 1.4;
    };
  }

  // ---------- the ground ----------
  const theme = {
    reedmere: { lo: 0x4a6a3a, hi: 0x6a8a4a, rim: 0x3a4a3a },
    golden: { lo: 0xb8943a, hi: 0xd8b85a, rim: 0x8a7a3a },
    frostpine: { lo: 0xdde8f0, hi: 0xffffff, rim: 0xb8c8d8 },
    silverveil: { lo: 0x8a8ab0, hi: 0xb8b8d8, rim: 0x5a5a7a },
  }[id];
  {
    const geo = new THREE.RingGeometry(0.001, R * 1.15, 96, 70);
    const p = geo.attributes.position;
    const col = [];
    const lo = new THREE.Color(theme.lo);
    const hi = new THREE.Color(theme.hi);
    const rimC = new THREE.Color(theme.rim);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = -p.getY(i);
      p.setZ(i, height(x, z));
      c.copy(lo).lerp(hi, hash(Math.floor(x / 4), Math.floor(z / 4)));
      c.lerp(rimC, sm(R * 0.8, R, Math.hypot(x, z)));
      if (id === "reedmere" && Math.hypot(x, z) < 50) c.lerp(new THREE.Color(0x4a3e2a), 1 - sm(44, 50, Math.hypot(x, z))); // mud under the water
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);
  }
  const H = (x, z) => height(x, z);

  // ---------- shared bits ----------
  const pine = (x, z, s, snow) => {
    put("bark", new THREE.CylinderGeometry(0.4 * s, 0.6 * s, 3 * s, 6), x, H(x, z) + 1.5 * s, z);
    for (let t = 0; t < 3; t++) {
      put("needle", new THREE.ConeGeometry((3 - t * 0.7) * s, 3.4 * s, 7), x, H(x, z) + (3.6 + t * 2.1) * s, z);
      if (snow) put("snow", new THREE.ConeGeometry((2.2 - t * 0.6) * s, 1.3 * s, 7), x, H(x, z) + (4.7 + t * 2.1) * s, z);
    }
  };
  mat("bark", 0x5a3e28);
  mat("needle", id === "frostpine" ? 0x2e4a3a : 0x3e6a34);
  mat("snow", 0xf4f8ff);
  // a wall of scenery all round the edge
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    const r = R * (0.92 + hash(i, 3) * 0.12);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (id === "reedmere") {
      put("reed", new THREE.CylinderGeometry(0.15, 0.25, 9 + hash(i, 4) * 5, 5), x, H(x, z) + 5, z);
      if (i % 2) pine(x * 1.04, z * 1.04, 2.2 + hash(i, 5), false);
    } else if (id === "silverveil") {
      // ghostly silver birches at the edge
      put("birch", new THREE.CylinderGeometry(0.4, 0.6, 14, 6), x, H(x, z) + 7, z);
      put("silverleaf", new THREE.IcosahedronGeometry(3.4, 0), x, H(x, z) + 15, z);
    } else pine(x, z, 2.5 + hash(i, 5) * 1.6, id === "frostpine");
  }
  mat("reed", 0x8a9a4a);

  // the Moonkeeper WAYSTONE by the arrival point
  const arrive = { x: 0, z: 70 };
  const waystone = { x: 6, z: 66 };
  {
    put("stone", new THREE.BoxGeometry(1.4, 3.6, 0.6), waystone.x, H(waystone.x, waystone.z) + 1.6, waystone.z);
    put("rune", new THREE.TorusGeometry(0.4, 0.08, 5, 16, Math.PI * 1.3), waystone.x, H(waystone.x, waystone.z) + 2.4, waystone.z + 0.32);
    colliders.push({ x: waystone.x, z: waystone.z, r: 1 });
    const glow = new THREE.PointLight(0x9fd8ff, 5, 8, 1.6);
    glow.position.set(waystone.x, H(waystone.x, waystone.z) + 3, waystone.z + 1);
    group.add(glow);
  }
  mat("stone", 0x8a8a82);
  basic("rune", 0x9fd8ff);

  // folk
  const person = (key, name, tunic, hood, at, scale = 1, face = null) => {
    const m = buildThistle({ tunicColor: tunic, hoodColor: hood, pack: false });
    m.scale.setScalar(scale);
    m.position.set(at.x, H(at.x, at.z), at.z);
    m.rotation.y = face ?? Math.atan2(arrive.x - at.x, arrive.z - at.z);
    m.userData.face = m.rotation.y;
    group.add(m);
    people[key] = { key, name, mesh: m, x: at.x, z: at.z };
    return people[key];
  };
  const lantern = (x, z) => {
    put("bark", new THREE.CylinderGeometry(0.1, 0.12, 2.8, 5), x, H(x, z) + 1.4, z);
    put("glow", new THREE.BoxGeometry(0.5, 0.6, 0.5), x, H(x, z) + 3, z);
  };
  basic("glow", 0xffc870);
  const spots = { arrive, waystone };
  const props = {};

  // =====================================================================
  if (id === "reedmere") {
    // the lagoon water
    const water = new THREE.Mesh(
      new THREE.RingGeometry(7.5, 47, 64, 4).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3a8a8a, roughness: 0.25, transparent: true, opacity: 0.82, emissive: 0x0e3a3a, emissiveIntensity: 0.4 })
    );
    water.position.y = 0.2;
    group.add(water);
    live.push((t) => (water.material.emissiveIntensity = 0.35 + Math.sin(t * 1.4) * 0.08));
    // docks (walkable — part of height())
    docks.push({ x0: -1.6, x1: 1.6, z0: 33, z1: 52, y: 0.75 }); // the main dock
    docks.push({ x0: 22, x1: 47, z0: 22, z1: 25, y: 0.75 }); // the fishing jetty (from the shore out into the lagoon)
    docks.push({ x0: -3, x1: 3, z0: 6, z1: 9.5, y: 0.75 }); // the island landing
    for (const d of docks) {
      // planks laid across the dock's length
      const alongZ = d.z1 - d.z0 > d.x1 - d.x0;
      const len = alongZ ? d.z1 - d.z0 : d.x1 - d.x0;
      for (let k = 0; k * 0.9 < len; k++) {
        if (alongZ) put("plank", new THREE.BoxGeometry(d.x1 - d.x0, 0.18, 0.82), (d.x0 + d.x1) / 2, d.y - 0.09, d.z0 + 0.45 + k * 0.9);
        else put("plank", new THREE.BoxGeometry(0.82, 0.18, d.z1 - d.z0), d.x0 + 0.45 + k * 0.9, d.y - 0.09, (d.z0 + d.z1) / 2);
      }
      for (const [px, pz] of [[d.x0, d.z0], [d.x1, d.z0], [d.x0, d.z1], [d.x1, d.z1]]) put("bark", new THREE.CylinderGeometry(0.15, 0.15, 2.4, 5), px, -0.4, pz);
    }
    mat("plank", 0x8a6a42);
    // reeds and cattails round the shore, lily pads on the water
    for (let i = 0; i < 260; i++) {
      const a = hash(i, 7) * Math.PI * 2;
      const r = 43 + hash(i, 8) * 9;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (onDock(x, z) || Math.abs(x) < 4 && z > 30) continue;
      const h = 1.5 + hash(i, 9) * 2.5;
      put("reed", new THREE.CylinderGeometry(0.04, 0.06, h, 4), x, H(x, z) + h / 2, z);
      if (i % 3 === 0) put("cattail", new THREE.CylinderGeometry(0.1, 0.1, 0.5, 5), x, H(x, z) + h, z);
    }
    mat("cattail", 0x5a3a20);
    for (let i = 0; i < 70; i++) {
      const a = hash(i, 11) * Math.PI * 2;
      const r = 12 + hash(i, 12) * 32;
      put("lily", new THREE.CircleGeometry(0.5 + hash(i, 13) * 0.5, 8, 0.3, Math.PI * 1.8).rotateX(-Math.PI / 2), Math.cos(a) * r, 0.24, Math.sin(a) * r);
    }
    mat("lily", 0x4a8a3a, { side: THREE.DoubleSide });
    // reed homes on stilts round the shore
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      if (Math.abs(Math.cos(a)) < 0.25 && Math.sin(a) > 0) continue; // keep the arrival clear
      const x = Math.cos(a) * 58;
      const z = Math.sin(a) * 58;
      const y = H(x, z);
      put("reedwall", new THREE.CylinderGeometry(3, 3.2, 3.5, 10), x, y + 2.6, z);
      put("thatch", new THREE.ConeGeometry(4, 3.4, 10), x, y + 6, z);
      for (let k = 0; k < 4; k++) put("bark", new THREE.CylinderGeometry(0.2, 0.2, 1.4, 5), x + Math.cos(k * 1.57) * 2.4, y + 0.4, z + Math.sin(k * 1.57) * 2.4);
      put("glow", new THREE.CircleGeometry(0.5, 8), x - Math.cos(a) * 3.05, y + 3, z - Math.sin(a) * 3.05, Math.atan2(-Math.cos(a), -Math.sin(a)));
      colliders.push({ x, z, r: 3.6 });
    }
    mat("reedwall", 0xb8a86a);
    mat("thatch", 0x8a7a3a);
    // the LIGHTHOUSE OF REEDS on the island
    for (let k = 0; k < 7; k++) {
      put(k % 2 ? "thatch" : "reedwall", new THREE.CylinderGeometry(2.2 - k * 0.18, 2.4 - k * 0.18, 2.4, 10), 0, 0.7 + 1.2 + k * 2.4, 0);
    }
    put("thatch", new THREE.ConeGeometry(1.8, 2.4, 10), 0, 0.7 + 19.5, 0);
    colliders.push({ x: 0, z: 0, r: 2.8 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), new THREE.MeshBasicMaterial({ color: 0x4a4038 }));
    lamp.position.set(0, 18, 0);
    group.add(lamp);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 4, 50, 12, 1, true).rotateZ(Math.PI / 2).translate(25, 0, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.set(0, 18, 0);
    beam.visible = false;
    group.add(beam);
    const beamLight = new THREE.PointLight(0xffd080, 0, 60, 1.4);
    beamLight.position.set(0, 18, 0);
    group.add(beamLight);
    props.light = { lamp, beam, beamLight };
    live.push((t) => (beam.rotation.y = t * 0.7));
    // the three buoy gates through the lagoon (navigation)
    props.gates = [{ x: 14, z: 30 }, { x: -18, z: 20 }, { x: -12, z: -6 }].map((g, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.18, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
      ring.position.set(g.x, 1.4, g.z);
      ring.rotation.y = Math.atan2(g.x, g.z);
      group.add(ring);
      for (const s of [-1, 1]) {
        const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff6a4a : 0xffffff }));
        buoy.position.set(g.x + Math.cos(ring.rotation.y) * s * 2.6, 0.35, g.z - Math.sin(ring.rotation.y) * s * 2.6);
        group.add(buoy);
      }
      return { ...g, ring };
    });
    props.fishSpot = { x: 23.5, z: 23.5 }; // the lagoon end of the fishing jetty
    props.bobberAt = { x: 19, z: 23.5 }; // out over open water

    // 🐟 little fish swimming about the lagoon — and a school by the jetty
    {
      const fishMat = [0xffa83a, 0xe8eef4, 0x7ac0e8].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.25, flatShading: true }));
      const fishes = [];
      for (let i = 0; i < 34; i++) {
        const f = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5).scale(0.55, 0.6, 1.4), fishMat[i % 3]);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4).rotateX(-Math.PI / 2), fishMat[i % 3]);
        tail.position.z = -0.38;
        f.add(body, tail);
        // a school circling just off the jetty's end, the rest wandering the lagoon
        const school = i < 12;
        const cx = school ? 18 : Math.cos(i * 2.3) * (16 + (i % 5) * 5);
        const cz = school ? 23.5 : Math.sin(i * 2.3) * (16 + (i % 5) * 5);
        f.userData = { cx, cz, r: school ? 2 + (i % 4) * 0.8 : 3 + (i % 3) * 2, sp: (school ? 0.9 : 0.5) * (i % 2 ? 1 : -1), ph: i * 1.7, tail };
        group.add(f);
        fishes.push(f);
      }
      live.push((t) => {
        for (const f of fishes) {
          const u = f.userData;
          const a = t * u.sp + u.ph;
          const x = u.cx + Math.cos(a) * u.r;
          const z = u.cz + Math.sin(a) * u.r;
          f.position.set(x, 0.1 + Math.sin(t * 2 + u.ph) * 0.05, z); // backs just breaking the surface
          f.rotation.y = Math.atan2(-Math.sin(a) * u.sp, Math.cos(a) * u.sp) + Math.PI / 2 * 0; // face along the swim
          f.lookAt(u.cx + Math.cos(a + 0.1 * Math.sign(u.sp)) * u.r, f.position.y, u.cz + Math.sin(a + 0.1 * Math.sign(u.sp)) * u.r);
          u.tail.rotation.y = Math.sin(t * 12 + u.ph) * 0.5;
        }
      });
    }
    for (const [x, z] of [[-3, 54], [3, 54], [-5, 60], [5, 62], [12, 56], [-12, 56]]) lantern(x, z);
    person("harbor", "Harbormaster Brindle", 0x3a6a7a, 0x2a5a6a, { x: -3.5, z: 50 }, 1.1);
    person("mallow", "Fisher Mallow", 0x6a7a3a, 0x5a6a2a, { x: 27, z: 23.5 }, 1.0, -Math.PI / 2);
    person("wick", "Lightkeeper Wick", 0x8a5a2a, 0x6a4a1a, { x: 3.4, z: 4.8 }, 1.05, 0);
    spots.dock = { x: 0, z: 44 };
    spots.island = { x: 0, z: 8 };
  }

  // =====================================================================
  if (id === "golden") {
    // wheat fields
    for (let i = 0; i < 900; i++) {
      const patch = i % 6;
      const cx = [-50, -38, 40, 52, -20, 30][patch];
      const cz = [10, 40, 15, 40, 50, 55][patch];
      const x = cx + (hash(i, 1) - 0.5) * 22;
      const z = cz + (hash(i, 2) - 0.5) * 16;
      const h = 1.6 + hash(i, 3) * 0.8;
      put("wheat", new THREE.CylinderGeometry(0.03, 0.04, h, 3), x, H(x, z) + h / 2, z);
      put("ear", new THREE.SphereGeometry(0.12, 4, 3).scale(1, 2.4, 1), x, H(x, z) + h, z);
    }
    mat("wheat", 0xc8a848);
    mat("ear", 0xe8c858);
    // the GREAT HARVEST HALL
    {
      const y = H(0, -48);
      put("timber", new THREE.BoxGeometry(26, 12, 16), 0, y + 6, -48);
      put("roofgold", new THREE.CylinderGeometry(0.01, 15, 8, 4, 1).rotateY(Math.PI / 4).scale(1.25, 1, 0.78), 0, y + 16, -48);
      put("door", new THREE.PlaneGeometry(5, 7), 0, y + 3.5, -39.95);
      for (const sx of [-8, 8]) put("glow", new THREE.PlaneGeometry(2, 2.6), sx, y + 7, -39.94);
      for (let k = -2; k <= 2; k += 2) colliders.push({ x: k * 5, z: -48, r: 8.6 });
    }
    mat("timber", 0x9a6a3a);
    mat("roofgold", 0xd8a83a);
    basic("door", 0x000000);
    // the great hearth + cauldron in the yard
    props.hearth = { x: 0, z: -33 };
    put("stone", new THREE.CylinderGeometry(1.6, 1.8, 0.5, 10), 0, H(0, -33) + 0.25, -33);
    put("pot", new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), 0, H(0, -33) + 1.6, -33);
    mat("pot", 0x2a2a2e);
    colliders.push({ x: 0, z: -33, r: 1.9 });
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.85 }));
    fire.position.set(0, H(0, -33) + 0.9, -33);
    group.add(fire);
    live.push((t) => fire.scale.set(1 + Math.sin(t * 11) * 0.1, 1 + Math.sin(t * 7) * 0.2, 1));
    // the vegetable plots + pump
    props.plots = [-16, -10, -4].map((x) => {
      const z = -20;
      put("soil", new THREE.BoxGeometry(4.6, 0.3, 3.4), x, H(x, z) + 0.12, z);
      const crop = new THREE.Group();
      crop.position.set(x, H(x, z) + 0.3, z);
      crop.visible = false;
      for (let k = 0; k < 6; k++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1, 5), new THREE.MeshStandardMaterial({ color: 0x4a8a3a, flatShading: true }));
        leaf.position.set((k % 3 - 1) * 1.2, 0.5, (Math.floor(k / 3) - 0.5) * 1.2);
        crop.add(leaf);
        const veg = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshStandardMaterial({ color: [0xe86a2a, 0xd84a4a, 0xe8c83a][Math.floor((x + 16) / 6)], flatShading: true }));
        veg.position.set((k % 3 - 1) * 1.2, 0.15, (Math.floor(k / 3) - 0.5) * 1.2);
        veg.userData.veg = true;
        crop.add(veg);
      }
      group.add(crop);
      return { x, z, crop };
    });
    mat("soil", 0x5a3e24);
    props.pump = { x: 4, z: -21 };
    put("stone", new THREE.BoxGeometry(1, 2.4, 1), 4, H(4, -21) + 1.2, -21);
    put("bark", new THREE.BoxGeometry(1.6, 0.2, 0.2), 4.6, H(4, -21) + 2.3, -21);
    colliders.push({ x: 4, z: -21, r: 0.8 });
    // the hen pen and its hens
    const pen = { x: 30, z: -12 };
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      put("bark", new THREE.CylinderGeometry(0.1, 0.12, 1.2, 5), pen.x + Math.cos(a) * 7, H(pen.x, pen.z) + 0.6, pen.z + Math.sin(a) * 7);
    }
    props.hens = [0, 1, 2].map((k) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6).scale(1, 0.85, 1.25), new THREE.MeshStandardMaterial({ color: k === 1 ? 0xa86a3a : 0xf4ece0, flatShading: true }));
      body.position.y = 0.55;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), body.material);
      head.position.set(0, 1.05, 0.5);
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xd83a2a }));
      comb.position.set(0, 1.35, 0.5);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8b83a }));
      beak.position.set(0, 1.0, 0.8);
      g.add(body, head, comb, beak);
      group.add(g);
      return { g, k };
    });
    live.push((t) => {
      for (const h of props.hens) {
        const a = t * 0.3 + h.k * 2.1;
        const x = pen.x + Math.cos(a) * 4 + Math.sin(t * 0.7 + h.k) * 0.8;
        const z = pen.z + Math.sin(a * 1.3) * 4;
        h.g.position.set(x, H(x, z) + Math.abs(Math.sin(t * 6 + h.k)) * 0.06, z);
        h.g.rotation.y = a + Math.PI / 2;
        h.x = x;
        h.z = z;
      }
    });
    // the windmill
    {
      const wx = -42;
      const wz = -14;
      const y = H(wx, wz);
      put("timber", new THREE.CylinderGeometry(2.2, 3.4, 13, 8), wx, y + 6.5, wz);
      put("roofgold", new THREE.ConeGeometry(2.8, 3, 8), wx, y + 14.5, wz);
      colliders.push({ x: wx, z: wz, r: 3.6 });
      const blades = new THREE.Group();
      blades.position.set(wx, y + 12, wz + 3);
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8, 0.15), new THREE.MeshStandardMaterial({ color: 0xf0e0c0, flatShading: true }));
        b.position.y = 4;
        const arm = new THREE.Group();
        arm.rotation.z = (k / 4) * Math.PI * 2;
        arm.add(b);
        blades.add(arm);
      }
      group.add(blades);
      live.push((t) => (blades.rotation.z = t * 0.6));
    }
    for (const [x, z] of [[-4, 58], [4, 58], [-6, -28], [6, -28], [20, -20], [-24, -20]]) lantern(x, z);
    person("barley", "Harvest-Mother Barley", 0xa8783a, 0x8a5a2a, { x: 3.6, z: -34 }, 1.1);
    person("sprout", "Farmer Sprout", 0x5a8a3a, 0x4a7a2a, { x: -10, z: -15.5 }, 1.0);
    person("dottie", "Henkeeper Dottie", 0xc86a5a, 0xa85a4a, { x: 30, z: -3.6 }, 0.95);
    spots.pen = pen;
  }

  // =====================================================================
  if (id === "frostpine") {
    // the frozen lake
    const lake = new THREE.Mesh(new THREE.CircleGeometry(14, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa8d8f0, roughness: 0.1, metalness: 0.2 }));
    lake.position.set(36, H(36, -24) + 0.08, -24);
    group.add(lake);
    // snowy pines scattered about
    for (let i = 0; i < 40; i++) {
      const a = hash(i, 21) * Math.PI * 2;
      const r = 28 + hash(i, 22) * 45;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - 36, z + 24) < 17 || Math.hypot(x, z + 62) < 16 || Math.hypot(x, z - 66) < 12 || Math.hypot(x + 45, z - 10) < 14) continue;
      if (Math.hypot(x - 40, z - 55) < 18) continue; // (the market square)
      if (Math.hypot(x - 82, z - 22) < 13 || Math.hypot(x + 80, z - 40) < 13 || Math.hypot(x + 50, z - 70) < 12 || Math.hypot(x + 72, z + 30) < 12 || Math.hypot(x - 78, z + 42) < 14) continue; // (hangouts, springs, ice cave)
      pine(x, z, 1.4 + hash(i, 23), true);
      colliders.push({ x, z, r: 1.2 });
    }
    // the SUMMIT: a great rock pillar, with ice ledges spiralling up it
    const S = { x: 0, z: -62, r: 9, top: 24 };
    {
      const rock = new THREE.CylinderGeometry(S.r * 0.75, S.r, S.top, 10, 6);
      const rp = rock.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        const k = (hash(Math.round(rp.getX(i) * 3), Math.round(rp.getY(i))) - 0.5) * 0.9;
        rp.setX(i, rp.getX(i) + k);
        rp.setZ(i, rp.getZ(i) + k);
      }
      put("rock", rock, S.x, H(S.x, S.z) + S.top / 2, S.z);
      put("snow", new THREE.CylinderGeometry(S.r * 0.78, S.r * 0.78, 0.5, 10), S.x, H(S.x, S.z) + S.top + 0.2, S.z);
      colliders.push({ x: S.x, z: S.z, r: S.r - 0.4 });
      platforms.push({ x: S.x, z: S.z, r: S.r * 0.75, y: H(S.x, S.z) + S.top + 0.45 });
      // ledges: a spiral, each a short hop above the last
      const ledges = [];
      const n = 20;
      for (let k = 0; k < n; k++) {
        const a = Math.PI * 0.5 + k * 0.42;
        const r = S.r + 1.4;
        const x = S.x + Math.cos(a) * r;
        const z = S.z + Math.sin(a) * r;
        const y = H(S.x, S.z) + 1.1 + k * 1.18;
        put("ice", new THREE.CylinderGeometry(1.9, 1.6, 0.6, 8), x, y - 0.3, z);
        platforms.push({ x, z, r: 1.9, y });
        ledges.push({ x, z, y });
      }
      props.ledges = ledges;
      spots.summitFoot = { x: S.x, z: S.z + S.r + 3 };
      spots.summit = { x: S.x, z: S.z, y: H(S.x, S.z) + S.top + 0.45 };
    }
    mat("rock", 0x7a7e86);
    mat("ice", 0xbfe6ff, { roughness: 0.2 });
    // braziers (3 on the climb) + the Summit Beacon
    const brazier = (x, y, z, big = false) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(big ? 1.2 : 0.6, big ? 0.6 : 0.3, big ? 0.9 : 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x4a4440, flatShading: true }));
      bowl.position.y = big ? 0.9 : 0.6;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, big ? 0.9 : 0.6, 5), bowl.material);
      leg.position.y = big ? 0.45 : 0.3;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(big ? 1 : 0.45, big ? 2.4 : 1, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 }));
      flame.position.y = big ? 2.4 : 1.2;
      const light = new THREE.PointLight(0xff9a40, big ? 40 : 10, big ? 60 : 14, 1.6);
      light.position.y = big ? 3 : 1.6;
      g.add(bowl, leg, flame, light);
      group.add(g);
      const b = { x, z, y, g, flame, light, on: false, big };
      return b;
    };
    const L = props.ledges;
    props.braziers = [brazier(S.x + 4, H(S.x + 4, S.z + S.r + 4), S.z + S.r + 4), brazier(L[7].x, L[7].y, L[7].z), brazier(L[14].x, L[14].y, L[14].z)];
    props.beacon = brazier(spots.summit.x, spots.summit.y, spots.summit.z, true);
    for (const b of [...props.braziers, props.beacon]) heat.push(b);
    live.push((t) => {
      for (const b of [...props.braziers, props.beacon]) {
        b.flame.visible = b.on;
        b.light.intensity = b.on ? (b.big ? 40 : 10) + Math.sin(t * 13) : 0;
        if (b.on) b.flame.scale.set(1, 1 + Math.sin(t * 9 + b.x) * 0.15, 1);
      }
    });
    // warm cabins: the warden's post, the woodcarver's bench, the Hall
    const cabin = (x, z, ry) => {
      const y = H(x, z);
      put("timberdark", new THREE.BoxGeometry(8, 4.5, 6), x, y + 2.25, z, ry);
      put("snow", new THREE.CylinderGeometry(0.01, 6.4, 3, 4).rotateY(Math.PI / 4).scale(1.1, 1, 0.85), x, y + 6, z, ry);
      put("glow", new THREE.PlaneGeometry(1.2, 1.2), x + Math.sin(ry) * 3.02, y + 2.6, z + Math.cos(ry) * 3.02, ry);
      colliders.push({ x, z, r: 4.6 });
    };
    mat("timberdark", 0x6a4a30);
    cabin(-14, 58, Math.PI * 0.9);
    cabin(30, 24, Math.PI * 0.7);
    const fire = (x, z) => {
      const b = brazier(x, H(x, z), z);
      b.on = true;
      heat.push(b);
      return b;
    };
    fire(-8, 56);
    fire(26, 18);
    fire(-36, 14);
    // the HALL OF EVERFROST: an ice-crystal hall framed in evergreen timber
    {
      const hx = -45;
      const hz = 6;
      const y = H(hx, hz);
      const ice = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.15, transparent: true, opacity: 0.7, emissive: 0x2a5a7a, emissiveIntensity: 0.5 });
      const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 12), ice);
      hall.position.set(hx, y + 5, hz);
      group.add(hall);
      for (let k = 0; k < 9; k++) {
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.4 + hash(k, 1) * 1.2, 0).scale(0.6, 2, 0.6), ice);
        c.position.set(hx - 8 + k * 2, y + 11 + hash(k, 2) * 2, hz);
        group.add(c);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put("timberdark", new THREE.BoxGeometry(0.8, 11, 0.8), hx + sx * 9, y + 5.5, hz + sz * 6);
      put("door", new THREE.PlaneGeometry(3.4, 5), hx + 9.02, y + 2.5, hz, Math.PI / 2);
      colliders.push({ x: hx - 4, z: hz, r: 6.6 }, { x: hx + 4, z: hz, r: 6.6 });
      spots.hall = { x: hx + 12, z: hz };
    }
    mat("door", 0x1a120c);
    // woodcarver's bench
    props.bench = { x: 24, z: 30 };
    put("timberdark", new THREE.BoxGeometry(3, 0.25, 1.2), 24, H(24, 30) + 1, 30);
    put("timberdark", new THREE.BoxGeometry(0.2, 1, 1.1), 22.8, H(24, 30) + 0.5, 30);
    put("timberdark", new THREE.BoxGeometry(0.2, 1, 1.1), 25.2, H(24, 30) + 0.5, 30);
    colliders.push({ x: 24, z: 30, r: 1.4 });
    // snow falling
    {
      const n = 1400;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (hash(i, 1) - 0.5) * 80;
        pos[i * 3 + 1] = hash(i, 2) * 40;
        pos[i * 3 + 2] = (hash(i, 3) - 0.5) * 80;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.85, depthWrite: false }));
      snow.frustumCulled = false;
      group.add(snow);
      props.snow = snow;
    }
    for (const [x, z] of [[-4, 60], [4, 60], [-30, 10], [8, -44]]) lantern(x, z);
    person("ivo", "Warden Ivo", 0x5a6a8a, 0x4a5a7a, { x: -4, z: 62 }, 1.1);
    person("alder", "Woodcarver Alder", 0x8a5a3a, 0x6a4a2a, { x: 21.5, z: 31 }, 1.05);
    person("hollis", "Keeper Hollis", 0x9ad0e8, 0x7ab0c8, { x: -31, z: 8 }, 1.1);
  }

  // =====================================================================
  if (id === "silverveil") {
    mat("birch", 0xe8e8f4);
    mats.silverleaf = new THREE.MeshBasicMaterial({ color: 0xc8d0ff });
    mats.ruin = new THREE.MeshStandardMaterial({ color: 0xc8c8dc, roughness: 0.6, flatShading: true });
    mats.moonglow = new THREE.MeshBasicMaterial({ color: 0xbfe6ff });
    // the moon-pool, glowing
    const pool = new THREE.Mesh(new THREE.CircleGeometry(14.5, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8ab8ff, emissive: 0x4a6ac8, emissiveIntensity: 0.8, roughness: 0.1, transparent: true, opacity: 0.85 }));
    pool.position.y = 0.02;
    group.add(pool);
    live.push((t) => (pool.material.emissiveIntensity = 0.7 + Math.sin(t * 0.9) * 0.2));
    // a ring of broken colonnades + arches
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const r = 30;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = k % 3 === 0 ? 3 + hash(k, 2) * 2 : 9;
      put("ruin", new THREE.CylinderGeometry(0.9, 1.1, h, 10), x, H(x, z) + h / 2, z);
      colliders.push({ x, z, r: 1.4 });
      if (k % 2 === 0 && h > 8) put("ruin", new THREE.BoxGeometry(2.4, 0.8, 7).rotateY(-a), Math.cos(a + 0.2) * r, H(x, z) + 9.4, Math.sin(a + 0.2) * r);
    }
    // floating silver shards, slowly turning
    const shards = [];
    for (let k = 0; k < 14; k++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.9 + hash(k, 3), 0).scale(0.6, 1.6, 0.6), mats.moonglow);
      m.userData = { a: k * 0.45, r: 20 + (k % 4) * 14, h: 8 + (k % 5) * 3 };
      group.add(m);
      shards.push(m);
    }
    live.push((t) => shards.forEach((m) => {
      const u = m.userData;
      m.position.set(Math.cos(u.a + t * 0.03) * u.r, u.h + Math.sin(t + u.a) * 1.2, Math.sin(u.a + t * 0.03) * u.r);
      m.rotation.y = t * 0.4 + u.a;
    }));
    // ruined houses on the terraces
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 0.2;
      const r = 62 + (k % 2) * 18;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 12 && z > 50) continue;
      put("ruin", new THREE.BoxGeometry(7, 3 + (k % 3), 6), x, H(x, z) + 1.5, z, -a);
      colliders.push({ x, z, r: 4.6 });
    }
    // the Moonkeepers' observatory in the north: a great ring and dome
    put("ruin", new THREE.CylinderGeometry(9, 10, 6, 20, 1, true), 0, H(0, -58) + 3, -58);
    put("moonglow", new THREE.TorusGeometry(7, 0.3, 6, 40), 0, H(0, -58) + 12, -58);
    colliders.push({ x: 0, z: -58, r: 10.4 });
    // RENATA'S STATUE at the heart of the moon-pool island path
    props.statue = { x: 0, z: 18 };
    put("ruin", new THREE.CylinderGeometry(1.4, 1.8, 1.2, 12), 0, H(0, 18) + 0.6, 18);
    colliders.push({ x: 0, z: 18, r: 1.8 });
    const glowL = new THREE.PointLight(0xbfe6ff, 30, 50, 1.4);
    glowL.position.set(0, 8, 0);
    group.add(glowL);
    // her last journal, on a stone lectern by the observatory
    props.journal = { x: 0, z: -45 };
    put("ruin", new THREE.BoxGeometry(1.2, 1.4, 0.8), 0, H(0, -45) + 0.7, -45);
    put("moonglow", new THREE.BoxGeometry(0.9, 0.1, 0.6), 0, H(0, -45) + 1.46, -45);
    colliders.push({ x: 0, z: -45, r: 1 });
    person("keeper", "The Last Keeper", 0xbfe6ff, 0x9fb8e8, { x: 3, z: 22 }, 1.15);
  }

  // ---------- merge ----------
  for (const [key, list] of pieces) group.add(new THREE.Mesh(mergeGeometries(list), mats[key] || mat(key, 0xff00ff)));

  // ---------- walking ----------
  function constrain(p) {
    const d = Math.hypot(p.x, p.z);
    if (d > R * 0.86) {
      p.x *= (R * 0.86) / d;
      p.z *= (R * 0.86) / d;
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
  }
  // (on top of the summit pillar you're above its collider)
  for (const c of colliders) if (id === "frostpine" && Math.hypot(c.x, c.z + 62) < 0.1) c.top = H(0, -62) + 23;
  function warmAt(x, y, z) {
    return heat.some((b) => b.on && Math.hypot(x - b.x, z - b.z) < (b.big ? 9 : 5) && Math.abs(y - b.y) < 6);
  }
  function update(t, dt, player) {
    for (const f of live) f(t, dt);
    if (props.snow) {
      props.snow.position.set(player.x, player.y - 8, player.z);
      const p = props.snow.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * (2 + (i % 5) * 0.4);
        if (y < 0) y += 40;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.3);
      }
      p.needsUpdate = true;
    }
    for (const p of Object.values(people)) {
      if (p.walking) continue; // (townsfolk out walking turn themselves)
      const L = p.mesh.userData.lookAt;
      p.mesh.rotation.y = L ? Math.atan2(L.x - p.x, L.z - p.z) : p.mesh.userData.face + Math.sin(t * 0.4 + p.x) * 0.25;
    }
  }
  return {
    id,
    group,
    colliders,
    heat,
    R,
    height: H,
    waterAt,
    platforms,
    constrain,
    warmAt,
    update,
    people,
    props,
    spots,
    waterNear: (x, z) => (id === "reedmere" ? Math.max(0, 1 - Math.max(0, Math.hypot(x, z) - 46) / 20) : 0),
  };
}
