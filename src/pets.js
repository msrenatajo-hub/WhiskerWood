// ------------------------------------------------------------
//  🐾  PETS — friends who follow you everywhere (no leashes!).
//
//  Bought at Frostbrush's Pet Shop in Frostpine; dressed up at the
//  Lagoon Pet Boutique in Reedmere. You can own as many as you like,
//  but only ONE follows you at a time (choose in your backpack).
//
//    🐱 cats (grey tabby · orange tabby · black · white)
//    🦔 hedgehogs  🦊 foxes  🐺 wolves
//    🦉 spotted barn owl  🐦 winter wren  🐦 hummingbird   (these fly)
// ------------------------------------------------------------
import * as THREE from "three";
import { inflate, bought, cost } from "./economy.js";
import { cityState, saveCity, openCard, closeCard } from "./cityLife.js";
import { splitTint, tintKey, nthTint, tintMeshes } from "./restock.js";
import { powerText } from "./powers.js";

export const SPECIES = {
  cat: { icon: "🐱", name: "Cat", price: 30, variants: [["Grey Tabby", 0x8a8a90, 0x5a5a62], ["Orange Tabby", 0xe0904a, 0xb8642a], ["Black Cat", 0x2a2a30, 0x2a2a30], ["White Cat", 0xf4f2ee, 0xf4f2ee]] },
  hedgehog: { icon: "🦔", name: "Hedgehog", price: 25, variants: [["Brown Hedgehog", 0x6a4a30, 0xd8c0a0], ["Snowy Hedgehog", 0xd8d0c4, 0xf4ece0]] },
  fox: { icon: "🦊", name: "Fox", price: 40, variants: [["Red Fox", 0xd8682a, 0xf4ece0], ["Arctic Fox", 0xf4f4f8, 0xf4f4f8], ["Silver Fox", 0x6a6a74, 0xd8d8e0]] },
  wolf: { icon: "🐺", name: "Wolf", price: 45, variants: [["Grey Wolf", 0x7a7a82, 0xd8d8dc], ["White Wolf", 0xeeeef2, 0xffffff], ["Black Wolf", 0x2e2e34, 0x5a5a62]] },
  owl: { icon: "🦉", name: "Spotted Barn Owl", price: 50, fly: true, variants: [["Barn Owl", 0xd8a868, 0xfaf6ee]] },
  wren: { icon: "🐦", name: "Winter Wren", price: 20, fly: true, variants: [["Winter Wren", 0x7a5232, 0xb8885a]] },
  hummingbird: { icon: "🐦", name: "Hummingbird", price: 35, fly: true, variants: [["Ruby-Throat", 0x3a9a5a, 0xd83a4a]] },
  // (only found in the wild — companions you befriend, never sold: see animals.js)
  badger: { icon: "🦡", name: "Badger", price: 0, found: true, variants: [["Badger", 0x4a4a50, 0xf0f0f0]] },
  leopard: { icon: "🐆", name: "Snow Leopard", price: 0, found: true, variants: [["Snow Leopard", 0xeeeef2, 0xffffff]] },
  babydragon: { icon: "🐲", name: "Baby Dragon", price: 0, found: true, fly: true, variants: [["Baby Dragon", 0xd85a3a, 0xf8c070]] },
};
export const PET_WEAR = {
  bandana: { icon: "🧣", name: "Red Bandana", price: 6, slot: "neck" },
  bluebandana: { icon: "🧣", name: "Blue Bandana", price: 6, slot: "neck" },
  bow: { icon: "🎀", name: "Pink Bow", price: 5, slot: "head" },
  tophat: { icon: "🎩", name: "Tiny Top Hat", price: 12, slot: "head" },
  flowercrown: { icon: "🌸", name: "Flower Crown", price: 9, slot: "head" },
  bellcollar: { icon: "🔔", name: "Bell Collar", price: 7, slot: "neck" },
  sweater: { icon: "🧶", name: "Knitted Pet Sweater", price: 12, slot: "body" },
};
// ♾️ new stock: buy every pet there is → a new litter (one new color of every
// animal); buy every piece of pet clothing → new colorways of all of it
const SPECIES_BASE = Object.fromEntries(Object.entries(SPECIES).map(([k, sp]) => [k, sp.variants.length]));
const PET_WEAR_BASE = Object.keys(PET_WEAR);
function addLitter(n) {
  for (const [k, sp] of Object.entries(SPECIES)) {
    if (sp.found || sp.variants.length >= SPECIES_BASE[k] + n) continue;
    const [nm, hex] = nthTint(k, n, sp.variants.map((v) => v[1]));
    const belly = new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.6).getHex();
    sp.variants.push([`${nm} ${sp.name}`, hex, belly]);
  }
}
function addPetWearColors(n) {
  for (const base of PET_WEAR_BASE) {
    const w = PET_WEAR[base];
    const [nm, hex] = nthTint(base, n);
    const k = tintKey(base, hex);
    PET_WEAR[k] ||= { ...w, name: `${nm} ${w.name.replace(/^(Red|Blue|Pink) /, "")}`, price: (w.basePrice ?? w.price) + 3, tint: hex };
  }
}
const allPetsOwned = (S) => Object.entries(SPECIES).filter(([, sp]) => !sp.found).every(([k, sp]) => sp.variants.every((_, v) => S.pets.some((p) => p.species === k && p.variant === v)));
const allPetWearOwned = (S) => Object.keys(PET_WEAR).every((k) => S.petOwnedWear[k]);
let _S = null;
/** the shared save (looked up lazily: cityLife.js imports this file too) */
function st() {
  if (_S) return _S;
  const S = (_S = cityState());
  S.pets ||= [];
  S.petWear ||= {}; // petId -> { slot: wearKey }
  S.petOwnedWear ||= {};
  for (let n = 1; n <= (S.petLitters || 0); n++) addLitter(n);
  for (let n = 1; n <= (S.petWearMore || 0); n++) addPetWearColors(n);
  {
    // (test) &pet=cat:1 → own + follow that pet; &petwear=bandana,tophat
    const q = new URLSearchParams(location.search);
    if (q.get("pet")) {
      const [sp, v] = q.get("pet").split(":");
      const pet = { id: "ptest", species: sp, variant: +v || 0, name: SPECIES[sp].variants[+v || 0][0] };
      S.pets = [pet];
      S.activePet = "ptest";
      for (const k of Object.keys(PET_WEAR)) S.petOwnedWear[k] = true;
    if (q.get("petwear")) {
        S.petWear.ptest = {};
        for (const k of q.get("petwear").split(",")) S.petWear.ptest[PET_WEAR[k].slot] = k;
      }
    }
  }
  return S;
}

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });

/** build a pet model. Returns a Group with userData { head, neck, body, legs, wings, tail, fly } */
export function buildPet(species, variant) {
  const sp = SPECIES[species];
  const [, main, belly] = sp.variants[variant] || sp.variants[0];
  const g = new THREE.Group();
  const u = { legs: [], wings: [], fly: !!sp.fly };
  if (species === "cat" || species === "fox" || species === "wolf" || species === "badger" || species === "leopard") {
    const big = species === "wolf" ? 1.25 : species === "fox" ? 1.05 : species === "badger" ? 1.1 : species === "leopard" ? 1.6 : 0.9;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32 * big, 0.3 * big, 0.6 * big), M(main));
    body.position.y = 0.38 * big;
    const head = new THREE.Group();
    head.position.set(0, 0.6 * big, 0.36 * big);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17 * big, 8, 6), M(main));
    skull.scale.set(1, 0.9, species === "cat" ? 0.95 : 1.1);
    head.add(skull);
    const snout = new THREE.Mesh(species === "cat" ? new THREE.SphereGeometry(0.07 * big, 6, 4) : new THREE.ConeGeometry(0.08 * big, 0.2 * big, 6).rotateX(Math.PI / 2), M(belly));
    snout.position.set(0, -0.04 * big, species === "cat" ? 0.14 * big : 0.2 * big);
    head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025 * big, 5, 4), M(species === "cat" ? 0xe8909a : 0x1a1a1a));
    nose.position.set(0, -0.02 * big, species === "cat" ? 0.2 * big : 0.3 * big);
    head.add(nose);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06 * big, 0.14 * big, 4), M(main));
      ear.position.set(sx * 0.1 * big, 0.15 * big, -0.02);
      ear.rotation.z = -sx * 0.25;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03 * big, 6, 5), M(species === "cat" ? 0x8ad84a : 0x2a1a0a));
      eye.position.set(sx * 0.07 * big, 0.03 * big, 0.14 * big);
      head.add(ear, eye);
    }
    // tabby stripes
    if (species === "cat" && sp.variants[variant] && /Tabby/.test(sp.variants[variant][0])) {
      for (let k = 0; k < 3; k++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.33 * big, 0.04, 0.07), M(sp.variants[variant][2]));
        stripe.position.set(0, 0.535 * big, (-0.18 + k * 0.16) * big);
        g.add(stripe);
      }
    }
    if (species === "leopard") {
      // grey rosettes all over
      for (let k = 0; k < 12; k++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.035 * big, 5, 4), M(0x5a5a64));
        spot.position.set((k % 2 ? 1 : -1) * 0.12 * big, (0.42 + (k % 3) * 0.06) * big, (-0.26 + Math.floor(k / 2) * 0.1) * big);
        g.add(spot);
      }
    }
    if (species === "badger") {
      // the white stripe down its face and back
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08 * big, 0.04, 0.62 * big), M(belly));
      stripe.position.set(0, 0.54 * big, 0);
      g.add(stripe);
    }
    if (species === "fox" || species === "wolf") {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.22 * big, 0.2 * big, 0.08), M(belly));
      chest.position.set(0, 0.36 * big, 0.31 * big);
      g.add(chest);
    }
    for (const [lx, lz] of [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08 * big, 0.26 * big, 0.08 * big), M(main));
      leg.geometry.translate(0, -0.13 * big, 0);
      leg.position.set(lx * big, 0.26 * big, lz * big);
      g.add(leg);
      u.legs.push(leg);
    }
    const tail = new THREE.Group();
    tail.position.set(0, 0.45 * big, -0.3 * big);
    const t1 = new THREE.Mesh(
      species === "cat" ? new THREE.CylinderGeometry(0.03 * big, 0.035 * big, 0.38 * big, 5) : new THREE.ConeGeometry(0.09 * big, 0.42 * big, 6),
      M(main)
    );
    t1.position.y = 0.17 * big;
    tail.add(t1);
    if (species === "fox") {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), M(0xf4ece0));
      tip.position.y = 0.4 * big;
      tail.add(tip);
    }
    tail.rotation.x = species === "cat" ? -0.4 : -1.0;
    g.add(body, head, tail);
    Object.assign(u, { head, body, tail, neck: { y: 0.55 * big, z: 0.3 * big, r: 0.13 * big }, headTop: 0.16 * big });
  } else if (species === "hedgehog") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 7), M(main));
    body.scale.set(1, 0.75, 1.2);
    body.position.y = 0.2;
    for (let k = 0; k < 26; k++) {
      const a = k * 2.4;
      const sp2 = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), M(main));
      const phi = 0.3 + (k % 6) * 0.22;
      sp2.position.set(Math.cos(a) * Math.sin(phi) * 0.24, 0.2 + Math.cos(phi) * 0.18, -0.05 + Math.sin(a) * Math.sin(phi) * 0.26);
      sp2.lookAt(sp2.position.x * 3, sp2.position.y * 3, sp2.position.z * 3 - 0.2);
      sp2.rotateX(Math.PI / 2);
      g.add(sp2);
    }
    const head = new THREE.Group();
    head.position.set(0, 0.17, 0.24);
    const face = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 7).rotateX(Math.PI / 2), M(belly));
    face.position.z = 0.06;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), M(0x1a1a1a));
    nose.position.z = 0.18;
    head.add(face, nose);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), M(0x1a1a1a));
      eye.position.set(sx * 0.05, 0.04, 0.06);
      head.add(eye);
    }
    for (const [lx, lz] of [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.12], [0.12, -0.12]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), M(belly));
      leg.geometry.translate(0, -0.04, 0);
      leg.position.set(lx, 0.08, lz);
      g.add(leg);
      u.legs.push(leg);
    }
    g.add(body, head);
    Object.assign(u, { head, body, neck: { y: 0.2, z: 0.2, r: 0.12 }, headTop: 0.1 });
  } else if (species === "babydragon") {
    // 🐲 a baby dragon (hatched from an egg) — little horns, bat wings, a long tail
    const s = 1.2;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18 * s, 9, 7), M(main));
    body.scale.set(0.9, 0.95, 1.3);
    const belly2 = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 8, 6), M(belly));
    belly2.scale.set(0.8, 0.8, 1.2);
    belly2.position.set(0, -0.04 * s, 0.03 * s);
    const head = new THREE.Group();
    head.position.set(0, 0.16 * s, 0.17 * s);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 9, 7), M(main));
    skull.scale.set(1, 0.9, 1.2);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.08 * s, 0.12 * s), M(main));
    snout.position.set(0, -0.03 * s, 0.12 * s);
    head.add(skull, snout);
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.1 * s, 5), M(0xf8e8c0));
      horn.position.set(sx * 0.06 * s, 0.11 * s, -0.03 * s);
      horn.rotation.x = -0.4;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 6, 4), M(0xffd040, { emissive: 0xffa020, emissiveIntensity: 0.6 }));
      eye.position.set(sx * 0.055 * s, 0.03 * s, 0.1 * s);
      head.add(horn, eye);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32 * s, 0.02 * s, 0.2 * s), M(belly, { transparent: true, opacity: 0.9 }));
      wing.geometry.translate(sx * 0.16 * s, 0, 0);
      wing.position.set(sx * 0.12 * s, 0.08 * s, 0);
      g.add(wing);
      u.wings.push({ m: wing, sx });
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.4 * s, 6).rotateX(-Math.PI / 2), M(main));
    tail.position.set(0, -0.02 * s, -0.3 * s);
    g.add(body, belly2, head, tail);
    Object.assign(u, { head, body, tail, neck: { y: 0.1 * s, z: 0.12 * s, r: 0.1 * s }, headTop: 0.14 * s });
  } else {
    // birds
    const s = species === "owl" ? 1.3 : species === "wren" ? 0.6 : 0.55;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 9, 7), M(main));
    body.scale.set(0.9, 1.1, 1.1);
    const head = new THREE.Group();
    head.position.set(0, 0.17 * s, 0.05 * s);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 9, 7), M(main));
    head.add(skull);
    if (species === "owl") {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.11 * s, 14), M(belly, { side: THREE.DoubleSide }));
      disc.position.z = 0.1 * s;
      disc.scale.y = 1.15;
      head.add(disc);
      for (let k = 0; k < 7; k++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.012 * s, 4, 3), M(0x4a3020));
        spot.position.set(Math.cos(k * 2.1) * 0.1 * s, -0.05 * s + Math.sin(k * 1.3) * 0.1 * s, 0.13 * s);
        g.add(spot);
      }
    }
    if (species === "hummingbird") {
      const throat = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 5), M(belly, { emissive: belly, emissiveIntensity: 0.3 }));
      throat.position.set(0, 0.08 * s, 0.1 * s);
      g.add(throat);
    }
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02 * s, (species === "hummingbird" ? 0.3 : 0.07) * s, 5).rotateX(Math.PI / 2), M(species === "owl" ? 0xe8d0a0 : 0x2a2018));
    beak.position.set(0, -0.01 * s, 0.13 * s + (species === "hummingbird" ? 0.12 * s : 0));
    head.add(beak);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022 * s, 6, 4), M(0x1a1a1a));
      eye.position.set(sx * 0.045 * s, 0.02 * s, 0.11 * s);
      head.add(eye);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.03 * s, 0.14 * s), M(main));
      wing.geometry.translate(sx * 0.11 * s, 0, 0);
      wing.position.set(sx * 0.1 * s, 0.03 * s, 0);
      g.add(wing);
      u.wings.push({ m: wing, sx });
    }
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.02 * s, 0.14 * s), M(main));
    tail.position.set(0, -0.04 * s, -0.16 * s);
    g.add(body, head, tail);
    Object.assign(u, { head, body, tail, neck: { y: 0.08 * s, z: 0.06 * s, r: 0.1 * s }, headTop: 0.12 * s });
  }
  g.userData = u;
  return g;
}

/** dress a pet in its clothes */
function dressPet(model, petId) {
  const S = st();
  const u = model.userData;
  const old = [];
  model.traverse((o) => o.userData && o.userData.petWear && old.push(o));
  old.forEach((o) => o.parent && o.parent.remove(o));
  const wear = S.petWear[petId] || {};
  for (const kWorn of Object.values(wear)) {
    const [k, tint] = splitTint(kWorn); // (a new color of the same piece)
    let m;
    if (k === "bandana" || k === "bluebandana") {
      m = new THREE.Mesh(new THREE.ConeGeometry(u.neck.r * 0.9, u.neck.r * 1.3, 3).rotateX(Math.PI), M(k === "bandana" ? 0xc83a3a : 0x3a6ac8));
      m.position.set(0, u.neck.y - 0.03, u.neck.z + 0.02);
      model.add(m);
    } else if (k === "bellcollar") {
      m = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(u.neck.r, u.neck.r * 0.15, 5, 14), M(0xc83a3a));
      ring.rotation.x = Math.PI / 2;
      const bell = new THREE.Mesh(new THREE.SphereGeometry(u.neck.r * 0.3, 6, 5), M(0xe8c83a, { metalness: 0.6 }));
      bell.position.set(0, -u.neck.r * 0.3, u.neck.r);
      m.add(ring, bell);
      m.position.set(0, u.neck.y, u.neck.z - 0.04);
      model.add(m);
    } else if (k === "sweater") {
      // sized from the pet's own body, so it covers the whole torso
      u.body.geometry.computeBoundingBox();
      const bb = u.body.geometry.boundingBox;
      const sx = (bb.max.x - bb.min.x) * u.body.scale.x;
      const sy = (bb.max.y - bb.min.y) * u.body.scale.y;
      const sz = (bb.max.z - bb.min.z) * u.body.scale.z;
      m = new THREE.Group();
      const knit = new THREE.Mesh(new THREE.BoxGeometry(sx * 1.12, sy * 1.1, sz * 0.92), M(0x4a8ac8));
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sx * 1.14, sy * 0.18, sz * 0.94), M(0xf0ece4));
      stripe.position.y = sy * 0.15;
      const collar = new THREE.Mesh(new THREE.BoxGeometry(sx * 1.16, sy * 1.12, sz * 0.12), M(0xf0ece4));
      collar.position.z = sz * 0.44;
      m.add(knit, stripe, collar);
      m.position.copy(u.body.position);
      model.add(m);
    } else if (k === "bow") {
      m = new THREE.Group();
      for (const sx of [-1, 1]) {
        const loop = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4).rotateZ(sx * Math.PI / 2), M(0xe86a9a));
        loop.position.x = sx * 0.04;
        m.add(loop);
      }
      m.position.set(0.05, u.headTop, 0);
      u.head.add(m);
    } else if (k === "tophat") {
      m = new THREE.Group();
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.01, 12), M(0x1a1a1a));
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), M(0x1a1a1a));
      top.position.y = 0.05;
      m.add(brim, top);
      m.position.set(0, u.headTop, 0);
      u.head.add(m);
    } else if (k === "flowercrown") {
      m = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), M([0xff9ab8, 0xffe06a, 0xffffff][i % 3]));
        f.position.set(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
        m.add(f);
      }
      m.position.set(0, u.headTop * 0.8, 0);
      u.head.add(m);
    }
    if (m && tint != null) tintMeshes(m, tint);
    if (m) m.traverse((o) => (o.userData.petWear = true));
  }
}

// ---------- the pet that's following you ----------
let follower = null; // { id, model }
let ridingPet = false; // 1 = hop on / hop off
// how high you sit on each kind of pet (your seat on its back)
const SEAT = { cat: 0.52, fox: 0.62, wolf: 0.78, hedgehog: 0.42, owl: 0.3, wren: 0.18, hummingbird: 0.16 };
export function initPets(scene) {
  const S = st();
  // 🛟 the little buoy (red + white) your pet rides behind the raft, and its rope
  const buoy = new THREE.Group();
  {
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.06, 6, 6, Math.PI / 4), M(i % 2 ? 0xf4f0e8 : 0xd83a3a));
      seg.rotation.x = Math.PI / 2;
      seg.rotation.z = (i / 8) * Math.PI * 2;
      buoy.add(seg);
    }
  }
  buoy.visible = false;
  scene.add(buoy);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 4), M(0xc8b08a));
  rope.visible = false;
  scene.add(rope);
  const sync = () => {
    const want = S.pets.find((p) => p.id === S.activePet) || null;
    if (follower && (!want || follower.id !== want.id)) {
      scene.remove(follower.model);
      follower = null;
    }
    if (want && !follower) {
      const model = buildPet(want.species, want.variant);
      scene.add(model);
      follower = { id: want.id, model, pos: null, heading: 0 };
    }
    if (follower) dressPet(follower.model, follower.id);
  };
  sync();
  const species = () => {
    if (!follower) return null;
    const S = st();
    const p = S.pets.find((x) => x.id === follower.id);
    return p ? p.species : null;
  };
  return {
    sync,
    hasPet: () => !!follower,
    isRiding: () => ridingPet && !!follower,
    setRiding: (on) => (ridingPet = on && !!follower),
    flies: () => !!(follower && follower.model.userData.fly),
    seat: () => SEAT[species()] ?? 0.5,
    name: () => {
      const S = st();
      const p = follower && S.pets.find((x) => x.id === follower.id);
      return p ? p.name : "";
    },
    /** tick: follow the player (target = a point behind them) */
    update(dt, t, player, playerYaw, visible, mode = "walk", waterY = 0) {
      if (!follower) return;
      const m = follower.model;
      m.visible = visible;
      if (!visible) {
        follower.pos = null;
        buoy.visible = rope.visible = false;
        return;
      }
      const u = m.userData;
      // 🛟 on the raft: a land pet floats in a little buoy (round its middle),
      // in its usual spot — behind you, on your right — roped to the raft
      const onBuoy = mode === "raft" && !u.fly && !ridingPet;
      buoy.visible = rope.visible = onBuoy;
      // right at your side (a half-step back, on your right)
      // (on the raft a little further out, so the buoy clears the logs)
      const side = onBuoy ? 1.45 : 0.85;
      const back = { x: player.x - Math.sin(playerYaw) * 0.3 - Math.cos(playerYaw) * side, z: player.z - Math.cos(playerYaw) * 0.3 + Math.sin(playerYaw) * side };
      if (!follower.pos) follower.pos = { ...back };
      const p = follower.pos;
      const dx = back.x - p.x;
      const dz = back.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 8) Object.assign(p, back); // (never left behind)
      const moving = d > 0.15;
      if (moving) {
        const step = Math.min(d, (4 + d * 8) * dt); // keeps pace, even when you sprint
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        follower.heading = Math.atan2(dx, dz);
      }
      const fly = u.fly;
      const swimmingNow = (mode === "swim" || mode === "raft") && !fly;
      // (in the water the pet floats with its body at the surface)
      const bodyY = u.body ? u.body.position.y * m.scale.y : 0.2;
      const bob = Math.sin(t * 3) * 0.03;
      m.position.set(p.x, fly ? player.y + (mode === "walk" ? 0 : 0.4) + 1.3 + Math.sin(t * 2.5) * 0.15 : swimmingNow ? waterY - bodyY * (onBuoy ? 0.9 : 1.15) + bob : player.y, p.z);
      m.rotation.y = moving ? follower.heading : Math.atan2(player.x - p.x, player.z - p.z);
      if (onBuoy) {
        // the ring sits round the pet's torso, sized to its body
        if (!follower.ringSize && u.body) {
          u.body.geometry.computeBoundingBox();
          const bb = u.body.geometry.boundingBox;
          const sx = (bb.max.x - bb.min.x) * u.body.scale.x * m.scale.x;
          const sz = (bb.max.z - bb.min.z) * u.body.scale.z * m.scale.z;
          follower.ringSize = { x: sx / 0.45 + 0.25, z: sz / 0.45 + 0.25 };
        }
        const rs = follower.ringSize || { x: 1, z: 1.4 };
        buoy.scale.set(rs.x, 1, rs.z);
        buoy.position.set(p.x, waterY + bob, p.z);
        buoy.rotation.y = m.rotation.y;
        // the rope: from the raft's stern to the buoy
        const fx = Math.sin(playerYaw);
        const fz = Math.cos(playerYaw);
        const stern = { x: player.x - fx * 0.8, z: player.z - fz * 0.8 };
        const len = Math.hypot(p.x - stern.x, p.z - stern.z);
        rope.position.set((stern.x + p.x) / 2, waterY + 0.06, (stern.z + p.z) / 2);
        rope.scale.set(1, Math.max(0.01, len), 1);
        rope.lookAt(p.x, waterY + 0.06, p.z);
        rope.rotateX(Math.PI / 2);
      }
      // (swimming: legs paddle the whole time)
      const sw = swimmingNow ? Math.sin(t * 9) : moving ? Math.sin(t * 14) : 0;
      u.legs.forEach((l, i) => (l.rotation.x = (i % 3 === 0 ? 1 : -1) * sw * 0.6));
      if (u.tail && !fly) u.tail.rotation.z = Math.sin(t * (moving ? 10 : 3)) * 0.3;
      for (const w of u.wings) w.m.rotation.z = w.sx * Math.sin(t * (fly && /hummingbird/.test(S.pets.find((x) => x.id === follower.id).species) ? 60 : 16)) * 0.7;
      if (u.head && !moving) u.head.rotation.y = Math.sin(t * 0.8) * 0.4; // looking about
    },
  };
}

// ---------- the shops ----------
export function openPetShop(api) {
  inflate(Object.values(SPECIES), (sp) => sp.name); // (🪙 prices grow with your adventure)
  const S = st();
  const draw = (msg = "") =>
    openCard(
      `<div class="card"><h3>🐾 Frostbrush's Pet Shop</h3><div class="coins">🪙 ${S.coins} coins · pets follow you (no leashes!)</div>
      ${Object.entries(SPECIES).filter(([, sp]) => !sp.found).map(([k, sp]) => `<div class="item"><span class="ic">${sp.icon}</span><span class="nm">${sp.name}<small>${sp.fly ? "flutters along beside you" : "trots along behind you"}</small>
        <span class="vars">${sp.variants.map(([vn, c], vi) => `<button class="var" data-k="${k}" data-v="${vi}" title="${vn}" style="background:#${c.toString(16).padStart(6, "0")}" ${S.coins < sp.price ? "disabled" : ""}>${vn}</button>`).join("")}</span></span>
        <b class="price">🪙 ${sp.price}</b></div>`).join("")}
      ${S.pets.filter((p) => !p.companion).length ? `<h4>Sell a pet back to the shop (full price)</h4>${S.pets.filter((p) => !p.companion).map((p) => {
        const sp = SPECIES[p.species];
        return `<div class="item"><span class="ic">${sp.icon}</span><span class="nm">${p.name}<small>${S.activePet === p.id ? "following you right now" : "at home"}</small></span><button data-sell="${p.id}">sell · 🪙 ${sp.fairPrice ?? sp.price}</button></div>`;
      }).join("")}` : ""}
      <div class="msg">${msg}</div><div class="close">Esc — leave · choose who follows you in your backpack (B)</div></div>`,
      (el) => {
        // 💰 sell a pet back — for exactly what it cost
        el.querySelectorAll("button[data-sell]").forEach((b) => {
          b.onclick = () => {
            const i = S.pets.findIndex((p) => p.id === b.dataset.sell);
            if (i < 0) return;
            const pet = S.pets[i];
            const sp = SPECIES[pet.species];
            S.pets.splice(i, 1);
            delete S.petWear[pet.id];
            if (S.activePet === pet.id) S.activePet = null;
            S.coins += sp.fairPrice ?? sp.price;
            saveCity();
            api.petsChanged();
            api.chime();
            draw(`${sp.icon} You said goodbye to ${pet.name} — Frostbrush will find them a cozy home. +🪙 ${sp.fairPrice ?? sp.price}`);
          };
        });
        el.querySelectorAll("button.var").forEach((b) => {
          b.onclick = () => {
            const sp = SPECIES[b.dataset.k];
            if (S.coins < sp.price) return;
            S.coins -= sp.price;
            bought(sp.name);
            const v = +b.dataset.v;
            const pet = { id: "p" + Date.now(), species: b.dataset.k, variant: v, name: sp.variants[v][0] };
            S.pets.push(pet);
            S.activePet = pet.id; // your new friend follows you right away
            let more = powerText("pet:" + pet.species) ? ` ${powerText("pet:" + pet.species)}!` : "";
            if (allPetsOwned(S)) {
              S.petLitters = (S.petLitters || 0) + 1;
              addLitter(S.petLitters);
              more = " ✨ You've adopted one of EVERY pet — a new litter just arrived, in brand-new colors!";
            }
            saveCity();
            api.petsChanged();
            api.chime();
            draw(`${sp.icon} Your ${sp.variants[v][0]} is following you!${more}`);
          };
        });
      }
    );
  draw();
}
export function openPetBoutique(api) {
  inflate(Object.values(PET_WEAR), (w) => w.name);
  const S = st();
  const active = S.pets.find((p) => p.id === S.activePet);
  const draw = (msg = "") =>
    openCard(
      `<div class="card"><h3>🎀 The Lagoon Pet Boutique</h3><div class="coins">🪙 ${S.coins} coins · ${active ? "dressing your " + active.name : "bring a pet to dress up!"}</div>
      ${Object.entries(PET_WEAR).map(([k, w]) => {
        const owned = S.petOwnedWear[k];
        const on = active && (S.petWear[active.id] || {})[w.slot] === k;
        return `<div class="item"><span class="ic">${w.icon}</span><span class="nm">${w.name}<small>${owned ? (on ? "✓ wearing — click to take off" : "click to put on your pet") : "for your pet"}</small></span><button data-k="${k}" ${!owned && S.coins < w.price ? "disabled" : ""}>${owned ? (on ? "take off" : "put on") : "🪙 " + w.price}</button></div>`;
      }).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — leave · buy once, fits ALL your pets · swap them in your backpack (B)</div></div>`,
      (el) =>
        el.querySelectorAll("button[data-k]").forEach((b) => {
          b.onclick = () => {
            const k = b.dataset.k;
            const w = PET_WEAR[k];
            let fresh = false;
            if (!S.petOwnedWear[k]) {
              if (S.coins < w.price) return;
              S.coins -= w.price;
              bought(k);
              S.petOwnedWear[k] = true;
              if (allPetWearOwned(S)) {
                S.petWearMore = (S.petWearMore || 0) + 1;
                addPetWearColors(S.petWearMore);
                fresh = true;
              }
            }
            if (active) {
              const pw = (S.petWear[active.id] ||= {});
              if (pw[w.slot] === k) delete pw[w.slot];
              else pw[w.slot] = k;
            }
            saveCity();
            api.petsChanged();
            api.chime();
            draw((active ? `${w.icon} ${w.name} — how sweet!` : `${w.icon} Bought! Bring a pet along to put it on.`) + (fresh ? " ✨ You own every piece — NEW colors just came in!" : ""));
          };
        })
    );
  draw();
}
/** the backpack's pets section */
export function petsHTML() {
  const S = st();
  if (!S.pets.length) return `<div class="empty">No pets yet — visit Frostbrush's Pet Shop in Frostpine!</div>`;
  return S.pets
    .map((p) => {
      const sp = SPECIES[p.species];
      const on = S.activePet === p.id;
      return `<button class="wcell ${on ? "on" : ""}" data-pet="${p.id}"><span class="ic">${sp.icon}</span><span class="nm">${p.name}</span><small>${on ? "✓ following you — click to send home" : "click to have them follow you"}</small></button>`;
    })
    .join("");
}
/** the backpack's pet-clothes section (for the pet following you) */
export function petWearHTML() {
  const S = st();
  const owned = Object.keys(PET_WEAR).filter((k) => S.petOwnedWear[k]);
  if (!owned.length) return "";
  const active = S.pets.find((p) => p.id === S.activePet);
  if (!active) return `<div class="empty">Choose a pet to follow you, then dress them up here.</div>`;
  const worn = S.petWear[active.id] || {};
  return owned
    .map((k) => {
      const w = PET_WEAR[k];
      const on = worn[w.slot] === k;
      return `<button class="wcell ${on ? "on" : ""}" data-petwear="${k}"><span class="ic">${w.icon}</span><span class="nm">${w.name}</span><small>${on ? "✓ on " + active.name + " — click to take off" : "click to put on " + active.name}</small></button>`;
    })
    .join("");
}
/** put a piece of pet clothing on (or off) the pet that's following you */
export function togglePetWear(k) {
  const S = st();
  const w = PET_WEAR[k];
  const active = S.pets.find((p) => p.id === S.activePet);
  if (!w || !active || !S.petOwnedWear[k]) return;
  const pw = (S.petWear[active.id] ||= {});
  if (pw[w.slot] === k) delete pw[w.slot];
  else pw[w.slot] = k;
  saveCity();
}
export function togglePet(id) {
  const S = st();
  S.activePet = S.activePet === id ? null : id;
  saveCity();
}
export { closeCard };
