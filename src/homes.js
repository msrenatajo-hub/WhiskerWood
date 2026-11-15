// ------------------------------------------------------------
//  🏡  HOMES — your house in each Great City (and your den's walls).
//
//  buildHomeInterior(id) makes one cozy round room, themed for its city:
//  a bed, a table, a rug, a lamp, a door — and HOOKS on the walls where
//  you can hang things from your inventory (E on a hook).
//
//  makeWallSlots(...) puts the same kind of hooks on any round wall
//  (the den uses it too).
// ------------------------------------------------------------
import * as THREE from "three";
import { livingPainting } from "./livingArt.js";
import { signTexture } from "./signs.js";

const THEMES = {
  reedmere: { wall: 0xb8a86a, floor: 0x7a5a3a, rug: 0x3a8a9a, name: "your Reedmere house" },
  golden: { wall: 0xe8d8b0, floor: 0x8a5e36, rug: 0xd8a83a, name: "your Golden Hollow house" },
  frostpine: { wall: 0x7a5a3e, floor: 0x5a4030, rug: 0xc84a4a, name: "your Frostpine cabin" },
  everbough: { wall: 0x9a7a52, floor: 0x7a5636, rug: 0x5a6a9a, name: "your Everbough treehouse" },
  roothaven: { wall: 0x8a8478, floor: 0x5a5048, rug: 0xa86a3a, name: "your Roothaven burrow" },
  pass: { wall: 0x8a5a32, floor: 0x6a4630, rug: 0x6ab8d8, name: "your Starlight Pass cabin" },
};

/** a picture of an emoji (for hung items + their frames) */
const iconTex = {};
function emojiTexture(icon) {
  if (iconTex[icon]) return iconTex[icon];
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#f4ead0";
  g.fillRect(0, 0, 128, 128);
  g.font = "84px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(icon, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (iconTex[icon] = t);
}

/**
 * Hooks round a circular wall. center {x,z}, radius R (the wall's inner
 * face), height y, a list of angles. Returns slots: { x, z, y, angle,
 * show(icon|null) }.
 */
export function makeWallSlots(group, center, R, y, angles) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 1, flatShading: true });
  return angles.map((a) => {
    const x = center.x + Math.sin(a) * (R - 0.08);
    const z = center.z + Math.cos(a) * (R - 0.08);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = a + Math.PI; // facing into the room
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 5, 10, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc8a03a, metalness: 0.5 }));
    hook.position.y = 0.72;
    g.add(hook);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.07), wood);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pic.position.z = 0.06; // (well in front of the frame's face — no flickering)
    pic.material.polygonOffset = true;
    pic.material.polygonOffsetFactor = -2;
    pic.material.polygonOffsetUnits = -2;
    const art = new THREE.Group();
    art.add(frame, pic);
    art.visible = false;
    g.add(art);
    group.add(g);
    let painting = null;
    return {
      x: center.x + Math.sin(a) * (R - 1.1),
      z: center.z + Math.cos(a) * (R - 1.1),
      y,
      angle: a,
      // 🖼️✨ a LIVING painting of whatever hangs here (fish swim round a
      //  coral comb, snow falls on a snowglobe, stars twinkle round a star map…)
      show(icon, item) {
        art.visible = !!icon;
        const key = item ? item.name + "|" + icon : null;
        if (painting && painting.key !== key) {
          painting.dispose();
          painting = null;
        }
        if (!icon) return;
        if (item && !painting) {
          painting = livingPainting(item.name, icon);
          painting.key = key;
          painting.shown = () => {
            for (let o = art; o; o = o.parent) if (!o.visible) return false;
            return true;
          };
        }
        pic.material.map = painting ? painting.texture : emojiTexture(icon);
        pic.material.needsUpdate = true;
      },
    };
  });
}

// rooms other than your houses (museum, shops, cafés) register themselves here
const ROOMS = {};
export function registerRoom(id, opts) {
  ROOMS[id] = opts;
}
export function buildHomeInterior(id) {
  if (ROOMS[id]) return buildRoom(id, ROOMS[id]);
  const T = THEMES[id];
  const R = 6.5;
  const group = new THREE.Group();
  group.visible = false;
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.2, 32).rotateX(-Math.PI / 2), M(T.floor));
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 4.6, 32, 1, true), M(T.wall, { side: THREE.BackSide }));
  wall.position.y = 2.3;
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 32).rotateX(Math.PI / 2), M(0x4a3420));
  ceil.position.y = 4.6;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24).rotateX(-Math.PI / 2), M(T.rug));
  rug.position.y = 0.02;
  group.add(floor, wall, ceil, rug);
  // beams across the ceiling
  for (let k = 0; k < 3; k++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(R * 2, 0.25, 0.3), M(0x5a3e24));
    beam.position.y = 4.4;
    beam.rotation.y = (k / 3) * Math.PI;
    group.add(beam);
  }
  // the door (south, +z)
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 1.3, R - 0.05);
  door.rotation.y = Math.PI;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0xc8a03a, { metalness: 0.5 }));
  knob.position.set(0.5, 1.2, R - 0.1);
  group.add(door, knob);
  // furniture: bed, table + chairs, a lamp, a shelf
  const solid = [];
  const bed = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.6), M(0x6a4a2c));
  frame.position.y = 0.3;
  const quilt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 2.0), M(T.rug));
  quilt.position.set(0, 0.55, 0.25);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), M(0xf4ece0));
  pillow.position.set(0, 0.6, -0.95);
  bed.add(frame, quilt, pillow);
  bed.position.set(-3.6, 0, -2.6);
  bed.rotation.y = 0.6;
  group.add(bed);
  solid.push({ x: -3.6, z: -2.6, r: 1.5 });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 14), M(0x8a5e36));
  table.position.set(2.6, 0.9, -1.8);
  const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.9, 6), M(0x5a3e24));
  tleg.position.set(2.6, 0.45, -1.8);
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M(0xe8e0d0));
  teapot.position.set(2.5, 1.12, -1.8);
  group.add(table, tleg, teapot);
  solid.push({ x: 2.6, z: -1.8, r: 1.1 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
  lamp.position.set(0, 3.7, 0);
  const light = new THREE.PointLight(0xffc880, 16, 14, 1.5);
  light.position.set(0, 3.5, 0);
  group.add(lamp, light);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.5), M(0x6a4a2c));
  shelf.position.set(0, 1.6, -R + 0.35);
  group.add(shelf);
  // the hooks: round the wall, skipping the door
  const angles = [];
  for (let k = 0; k < 8; k++) {
    const a = Math.PI + (k / 8) * Math.PI * 2 + Math.PI / 8;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5) continue; // (the door is at angle 0)
    angles.push(a);
  }
  const slots = makeWallSlots(group, { x: 0, z: 0 }, R, 2.4, angles);
  return {
    id,
    name: T.name,
    group,
    slots,
    door: { x: 0, z: R - 1 },
    spawn: { x: 0, z: R - 2, face: Math.PI },
    constrain(p) {
      const d = Math.hypot(p.x, p.z);
      if (d > R - 0.6) {
        p.x *= (R - 0.6) / d;
        p.z *= (R - 0.6) / d;
      }
      for (const c of solid) {
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const dd = Math.hypot(dx, dz);
        if (dd < c.r && dd > 0.0001) {
          p.x = c.x + (dx / dd) * c.r;
          p.z = c.z + (dz / dd) * c.r;
        }
      }
    },
  };
}


// ------------------------------------------------------------
//  🚪 WALK-IN ROOMS: the museum, shops, cafés…
//  opts: { name, kind: "museum"|"shop"|"cafe", wall, floor, rug,
//          keeper: { tunic }, onUse(), relics: () => [[icon, name, shown]],
//          portrait: () => bool, buildThistle }
// ------------------------------------------------------------
function buildRoom(id, o) {
  const R = o.kind === "museum" ? 9 : 6.5;
  const group = new THREE.Group();
  group.visible = false;
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.2, 36).rotateX(-Math.PI / 2), M(o.floor || 0x7a5636));
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 5, 36, 1, true), M(o.wall || 0xd8c8a8, { side: THREE.BackSide }));
  wall.position.y = 2.5;
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 36).rotateX(Math.PI / 2), M(0x4a3420));
  ceil.position.y = 5;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(R * 0.4, 24).rotateX(-Math.PI / 2), M(o.rug || 0x8a3a3a));
  rug.position.y = 0.02;
  group.add(floor, wall, ceil, rug);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 1.3, R - 0.05);
  door.rotation.y = Math.PI;
  group.add(door);
  const lamp = new THREE.PointLight(0xffd0a0, 20, R * 3, 1.4);
  lamp.position.set(0, 4.2, 0);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe0b0 }));
  shade.position.set(0, 4.75, 1.5);
  group.add(lamp, shade);
  const solid = [];
  // the name, painted over the far wall
  {
    // (🪧 crisp, high-res, unlit — see signs.js)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.8), new THREE.MeshBasicMaterial({ map: signTexture(o.name, "wood", 5.2 / 0.8), toneMapped: false }));
    sign.position.set(0, 3.1, -R + 0.75); // (in front of the curved wall, so its ends show)
    group.add(sign);
  }
  const keeperAt = { x: 0, z: -R + 2.4 };
  if (o.kind === "shop" || o.kind === "cafe" || o.kind === "museum") {
    // a counter (or the curator's desk) with the keeper behind it
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 0.55, 1), M(0x8a5e36));
    counter.position.set(0, 0.28, -R + 3.4);
    group.add(counter);
    solid.push({ x: -1.4, z: -R + 3.4, r: 0.9 }, { x: 0, z: -R + 3.4, r: 0.9 }, { x: 1.4, z: -R + 3.4, r: 0.9 });
    if (o.buildThistle) {
      const k = o.buildThistle({ tunicColor: o.keeper ? o.keeper.tunic : 0x6a5a8a, hoodColor: o.keeper ? o.keeper.tunic : 0x6a5a8a, pack: false });
      k.position.set(keeperAt.x, 0, keeperAt.z);
      k.scale.setScalar(1.25);
      group.add(k);
    }
    // shelves of wares behind
    for (const sx of [-3, 3]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.5), M(0x6a4a2c));
      shelf.position.set(sx, 1.3, -R + 0.6);
      group.add(shelf);
      for (let k = 0; k < 8; k++) {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), M(new THREE.Color().setHSL((k * 0.13 + sx) % 1, 0.55, 0.55).getHex()));
        w.position.set(sx - 0.9 + (k % 4) * 0.6, 0.9 + Math.floor(k / 4) * 0.9, -R + 0.95);
        group.add(w);
      }
    }
  }
  if (o.kind === "cafe") {
    for (const [x, z] of [[-3, 1], [3, 1], [0, 3]]) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 12), M(0x8a5e36));
      top.position.set(x, 1, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1, 6), M(0x5a3e24));
      leg.position.set(x, 0.5, z);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 8), M(0xf4ece0));
      cup.position.set(x + 0.3, 1.17, z);
      group.add(top, leg, cup);
      solid.push({ x, z, r: 1.1 });
    }
    // a crackling hearth
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 0.8), M(0x6a6460));
    hearth.position.set(-R + 0.6, 0.8, 0);
    hearth.rotation.y = Math.PI / 2;
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
    fire.position.set(-R + 1.1, 0.6, 0);
    const fl = new THREE.PointLight(0xff9a40, 10, 8, 1.6);
    fl.position.set(-R + 1.6, 1, 0);
    group.add(hearth, fire, fl);
  }
  // the museum: glowing pedestals for the relics + the portrait
  const pedestals = [];
  let portrait = null;
  if (o.kind === "museum") {
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 0.75 + i * Math.PI * 0.25;
      const x = Math.cos(a) * 5.4;
      const z = Math.sin(a) * 5.4 * -1 + 1.5;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.2, 10), M(0xe8e0d0));
      ped.position.set(x, 0.6, z);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
      glass.position.set(x, 1.7, z);
      const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: [0x9fd8ff, 0xffc840, 0xff9ad8][i] }));
      relic.position.set(x, 1.6, z);
      // (🪧 a crisp little name plaque — its words are set in refresh())
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.36), new THREE.MeshBasicMaterial({ map: signTexture("— awaiting a relic —", "wood", 1.6 / 0.36), toneMapped: false }));
      plaque.position.set(x, 1.0, z + 0.62);
      group.add(ped, glass, relic, plaque);
      solid.push({ x, z, r: 0.9 });
      pedestals.push({ relic, plaque });
    }
    // more of the Alliance's history on display
    for (const [x, z, c] of [[5.5, -1, 0x6a8ac8], [-5.5, -1, 0xc8a86a]]) {
      const ped = new THREE.Mesh(new THREE.BoxGeometry(1, 1.1, 1), M(0xe8e0d0));
      ped.position.set(x, 0.55, z);
      const thing = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.07, 40, 6), M(c, { metalness: 0.5, roughness: 0.4 }));
      thing.position.set(x, 1.4, z);
      group.add(ped, thing);
      solid.push({ x, z, r: 0.8 });
    }
    portrait = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), M(0xc8a03a));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x3a5a8a }));
    pic.position.z = 0.04;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0xe8dcc0 }));
    face.position.set(0, -0.1, 0.08);
    portrait.add(frame, pic, face);
    portrait.position.set(R * 0.7, 2.6, -R * 0.7 + 0.1);
    portrait.rotation.y = -Math.PI / 4;
    group.add(portrait);
  }
  function refresh() {
    if (o.relics) {
      const list = o.relics();
      pedestals.forEach((p, i) => {
        const r = list[i];
        p.relic.visible = !!(r && r[2]);
        p.plaque.material.map = signTexture(r && r[2] ? r[1] : "— awaiting a relic —", "wood", 1.6 / 0.36);
        p.plaque.material.needsUpdate = true;
      });
    }
    if (portrait) portrait.visible = !!(o.portrait && o.portrait());
  }
  return {
    id,
    name: o.name,
    group,
    slots: [],
    door: { x: 0, z: R - 1 },
    spawn: { x: 0, z: R - 2, face: Math.PI },
    refresh,
    interact(p) {
      if (o.onUse && Math.hypot(p.x - keeperAt.x, p.z - (keeperAt.z + 2.2)) < 2) return { label: o.useLabel || "talk to the keeper", act: o.onUse };
      return null;
    },
    constrain(p) {
      const d = Math.hypot(p.x, p.z);
      if (d > R - 0.6) {
        p.x *= (R - 0.6) / d;
        p.z *= (R - 0.6) / d;
      }
      for (const c of solid) {
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const dd = Math.hypot(dx, dz);
        if (dd < c.r && dd > 0.0001) {
          p.x = c.x + (dx / dd) * c.r;
          p.z = c.z + (dz / dd) * c.r;
        }
      }
    },
  };
}
