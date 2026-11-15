// ------------------------------------------------------------
//  🦌🦅🐎🐐🐢🦬 the animals you can RIDE (bought in hidden places all over
//  the cities — see animals.js). Each is a little low-poly model with
//  userData { legs, tail } so the riding code can make it gallop, and a
//  saddle about the same height as Buttercup the pony's.
// ------------------------------------------------------------
import * as THREE from "three";

const Mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
const box = (w, h, d, c, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Mat(c));
  m.position.set(x, y, z);
  return m;
};
function legs4(g, coat, legH, spread, front, back, hoof = 0x2a2018, thick = 0.13) {
  const legs = [];
  for (const [lx, lz] of [[-spread, front], [spread, front], [-spread, back], [spread, back]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(thick, legH, thick), Mat(coat));
    leg.geometry.translate(0, -legH / 2, 0);
    leg.position.set(lx, legH + 0.03, lz);
    const h = box(thick + 0.02, 0.08, thick + 0.03, hoof, 0, -legH + 0.02, 0);
    leg.add(h);
    g.add(leg);
    legs.push(leg);
  }
  return legs;
}
function tailOf(g, c, y, z, len = 0.4) {
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, len, 0.08), Mat(c));
  tail.geometry.translate(0, -len / 2, 0);
  tail.position.set(0, y, z);
  tail.rotation.x = 0.4;
  g.add(tail);
  return tail;
}
const saddle = (g, y, c = 0x6a3a1a) => g.add(box(0.62, 0.1, 0.46, c, 0, y, -0.05));

/** 🦌 the White Stag — tall, pale, with a crown of antlers */
export function buildStag() {
  const g = new THREE.Group();
  const coat = 0xf2efe6;
  g.add(box(0.5, 0.5, 1.2, coat, 0, 0.95, 0));
  const neck = box(0.24, 0.6, 0.26, coat, 0, 1.4, 0.52);
  neck.rotation.x = 0.35;
  g.add(neck, box(0.26, 0.26, 0.48, coat, 0, 1.72, 0.74));
  for (const sx of [-1, 1]) {
    const beam = box(0.05, 0.6, 0.05, 0xe8dcc0, sx * 0.14, 2.05, 0.66);
    beam.rotation.z = -sx * 0.45;
    g.add(beam);
    for (let t = 0; t < 3; t++) {
      const tine = box(0.04, 0.25, 0.04, 0xe8dcc0, sx * (0.22 + t * 0.07), 2.1 + t * 0.12, 0.62 + t * 0.04);
      tine.rotation.x = -0.5;
      g.add(tine);
    }
    g.add(box(0.05, 0.05, 0.05, 0x1a1a2a, sx * 0.12, 1.78, 0.96));
  }
  saddle(g, 1.22, 0x3a5a8a);
  const legs = legs4(g, coat, 0.72, 0.17, 0.45, -0.45, 0x5a4a3a, 0.11);
  g.userData = { legs, tail: tailOf(g, 0xffffff, 1.1, -0.62, 0.25) };
  const glow = new THREE.PointLight(0xdfe8ff, 2, 4);
  glow.position.y = 1.5;
  g.add(glow);
  return g;
}

/** 🦅 the Great Eagle — you sit between its wings */
export function buildEagle() {
  const g = new THREE.Group();
  const brown = 0x6a4a2a, gold = 0xd8a840;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), Mat(brown));
  body.scale.set(0.9, 0.8, 1.5);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), Mat(0xf4f0e6));
  head.position.set(0, 1.35, 0.85);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 6), Mat(gold));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.3, 1.15);
  g.add(body, head, beak);
  for (const sx of [-1, 1]) g.add(box(0.05, 0.05, 0.05, 0x1a1a1a, sx * 0.13, 1.42, 1.05));
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    const feather = box(1.6, 0.06, 0.8, brown, sx * 0.8, 0, 0);
    const tip = box(0.6, 0.05, 0.5, 0x3a2a1a, sx * 1.7, 0, -0.1);
    w.add(feather, tip);
    w.position.set(sx * 0.4, 1.1, 0);
    g.add(w);
    wings.push({ w, sx });
  }
  saddle(g, 1.25, 0x8a3a2a);
  const legs = [];
  for (const sx of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), Mat(gold));
    leg.geometry.translate(0, -0.25, 0);
    leg.position.set(sx, 0.55, 0.1);
    g.add(leg);
    legs.push(leg);
  }
  const tail = tailOf(g, brown, 0.95, -0.75, 0.5);
  tail.scale.set(4, 1, 1);
  g.userData = { legs, tail, wings };
  return g;
}

/** 🐎 a wild mustang — every one a different coat */
export function buildMustang(coat = 0x8a5a3a, mane = 0x2a1a10) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.52, 1.25, coat, 0, 0.9, 0));
  const neck = box(0.28, 0.6, 0.3, coat, 0, 1.28, 0.58);
  neck.rotation.x = 0.45;
  g.add(neck, box(0.26, 0.28, 0.55, coat, 0, 1.55, 0.84));
  const m = box(0.08, 0.62, 0.26, mane, 0, 1.38, 0.5);
  m.rotation.x = 0.45;
  g.add(m);
  for (const sx of [-0.1, 0.1]) g.add(box(0.05, 0.14, 0.05, coat, sx, 1.75, 0.74), box(0.04, 0.04, 0.04, 0x1a1a1a, sx * 1.45, 1.6, 1.0));
  saddle(g, 1.2, 0x8a6a3a);
  const legs = legs4(g, coat, 0.66, 0.18, 0.47, -0.47);
  g.userData = { legs, tail: tailOf(g, mane, 1.05, -0.65, 0.6) };
  return g;
}

/** 🐐 a mountain goat — stocky, with curled horns */
export function buildGoat() {
  const g = new THREE.Group();
  const coat = 0xe8e0d0;
  g.add(box(0.52, 0.5, 1.0, coat, 0, 0.82, 0));
  const shag = box(0.56, 0.2, 0.9, 0xd8d0c0, 0, 0.6, 0);
  g.add(shag);
  g.add(box(0.26, 0.3, 0.42, coat, 0, 1.25, 0.6));
  for (const sx of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 10, Math.PI * 1.3), Mat(0x5a4a3a));
    horn.position.set(sx * 0.11, 1.45, 0.52);
    horn.rotation.y = Math.PI / 2;
    g.add(horn, box(0.04, 0.04, 0.04, 0x1a1a1a, sx * 0.1, 1.3, 0.82));
  }
  g.add(box(0.1, 0.18, 0.08, 0xc8c0b0, 0, 1.02, 0.8)); // (beard)
  saddle(g, 1.12, 0x2a5a3a);
  const legs = legs4(g, coat, 0.58, 0.17, 0.36, -0.36, 0x3a3a3a, 0.12);
  g.userData = { legs, tail: tailOf(g, coat, 1.0, -0.5, 0.2) };
  return g;
}

/** 🐢 the sea turtle — slow on land, swims you across the water */
export function buildTurtle() {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), Mat(0x4a6a3a));
  shell.scale.set(1, 0.55, 1.25);
  shell.position.y = 0.55;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.12, 14), Mat(0x8a7a4a));
  rim.scale.z = 1.25;
  rim.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), Mat(0x7a9a5a));
  head.position.set(0, 0.6, 1.25);
  g.add(shell, rim, head);
  for (const sx of [-0.09, 0.09]) g.add(box(0.04, 0.04, 0.04, 0x1a1a1a, sx, 0.68, 1.42));
  for (let k = 0; k < 5; k++) {
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.22, 6), Mat(0x5a8a4a));
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(Math.cos(k * 1.26) * 0.4, 1.02, Math.sin(k * 1.26) * 0.5);
    g.add(plate);
  }
  saddle(g, 1.07, 0x3a6a8a);
  const legs = [];
  for (const [lx, lz] of [[-0.75, 0.6], [0.75, 0.6], [-0.65, -0.65], [0.65, -0.65]]) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.25), Mat(0x7a9a5a));
    fl.geometry.translate(lx > 0 ? 0.2 : -0.2, 0, 0);
    fl.position.set(lx, 0.45, lz);
    g.add(fl);
    legs.push(fl);
  }
  g.userData = { legs, tail: tailOf(g, 0x7a9a5a, 0.5, -1.1, 0.2), swims: true };
  return g;
}

/** 🦬 a great shaggy bison */
export function buildBison() {
  const g = new THREE.Group();
  const coat = 0x5a3e28, shag = 0x3a2818;
  g.add(box(0.75, 0.7, 1.4, coat, 0, 1.0, -0.05));
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), Mat(shag));
  hump.scale.set(0.85, 0.8, 0.9);
  hump.position.set(0, 1.2, 0.35);
  g.add(hump, box(0.5, 0.5, 0.45, shag, 0, 1.0, 0.85));
  for (const sx of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), Mat(0xe8e0c8));
    horn.position.set(sx * 0.3, 1.25, 0.9);
    horn.rotation.z = -sx * 1.1;
    g.add(horn, box(0.05, 0.05, 0.05, 0x1a1a1a, sx * 0.17, 1.08, 1.08));
  }
  g.add(box(0.2, 0.25, 0.12, shag, 0, 0.7, 1.0)); // (beard)
  saddle(g, 1.38, 0x8a2a2a);
  const legs = legs4(g, coat, 0.66, 0.24, 0.5, -0.55, 0x1a1410, 0.17);
  g.userData = { legs, tail: tailOf(g, shag, 1.2, -0.75, 0.45) };
  return g;
}

/** 🐆 Frost, the great snow leopard — big, silver-white, with grey rosettes */
export function buildLeopardMount() {
  const g = new THREE.Group();
  const coat = 0xeeeef2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 1.5), Mat(coat));
  body.position.y = 0.95;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), Mat(coat));
  head.scale.set(1, 0.9, 1.05);
  head.position.set(0, 1.35, 0.92);
  const muzzle = box(0.24, 0.16, 0.18, 0xf8f8fa, 0, 1.24, 1.22);
  g.add(head, muzzle, box(0.08, 0.06, 0.05, 0xd8a0a8, 0, 1.3, 1.32));
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), Mat(coat));
    ear.scale.z = 0.5;
    ear.position.set(sx * 0.2, 1.66, 0.86);
    g.add(ear, box(0.07, 0.05, 0.04, 0x6ab8d8, sx * 0.14, 1.42, 1.2));
  }
  for (let k = 0; k < 18; k++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), Mat(0x5a5a66));
    spot.position.set((k % 2 ? 1 : -1) * (0.22 + (k % 3) * 0.04), 1.05 + (k % 3) * 0.12, -0.6 + Math.floor(k / 2) * 0.15);
    g.add(spot);
  }
  saddle(g, 1.26, 0x3a5a8a);
  const legs = legs4(g, coat, 0.66, 0.22, 0.55, -0.55, 0xd8d8e0, 0.16);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 7), Mat(coat));
  tail.geometry.translate(0, -0.7, 0);
  tail.position.set(0, 1.1, -0.75);
  tail.rotation.x = 1.1;
  g.add(tail);
  g.userData = { legs, tail };
  return g;
}

export const MOUNT_BUILDERS = { leopard: buildLeopardMount, stag: buildStag, eagle: buildEagle, mustang: () => buildMustang(0x9a5a2a), goat: buildGoat, turtle: buildTurtle, bison: buildBison };
