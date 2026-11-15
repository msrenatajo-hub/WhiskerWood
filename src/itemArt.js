// ------------------------------------------------------------
//  🖼️  ITEM PICTURES — every item gets a real little picture of
//  itself instead of an emoji.
//
//  Each picture is a tiny 3D model, built from the item's NAME ("Honey
//  Cake", "Rose Pink Bonnet", "Brass Spyglass"…) and drawn once in the
//  game's own low-poly style, then kept (cached). Colour words in the name
//  ("pink", "golden", "blue"…) tint it.
//
//  Shops, the backpack and every other list in the game show items as
//  <span class="ic">EMOJI</span> next to a name — a watcher swaps each of
//  those emoji for the picture automatically (and the little "tags" too).
// ------------------------------------------------------------
import * as THREE from "three";

const SIZE = 128;
let R = null, scene = null, cam = null;
const cache = new Map();

function setup() {
  if (R) return true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1);
    R.setSize(SIZE, SIZE, false);
    R.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(2, 4, 3);
    scene.add(sun);
    cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    return true;
  } catch {
    R = null;
    return false;
  }
}

// ---------------------------------------------------------------- colours
const COLOR_WORDS = [
  [/cherry|ruby|scarlet|crimson|\bred\b/, 0xd8404a], [/rose|pink|blush|bubblegum/, 0xf28ab8], [/coral/, 0xff7a6a],
  [/orange|amber|pumpkin|apricot/, 0xf08a3a], [/gold|golden|honey|sunflower|sun\b|sunstone/, 0xf0c040], [/yellow|lemon|butter/, 0xf4dc5a],
  [/mint|jade|emerald|sage|green|moss|clover|leaf|pine/, 0x5ab86a], [/teal|sea\b|tide|lagoon/, 0x3aa8a8], [/sky|ice|frost|snow(?!flake)|aqua|winter/, 0x9fd0f0],
  [/blue|navy|sapphire|midnight/, 0x3a6ac8], [/lilac|lavender|violet|purple|amethyst|plum/, 0xa87ad8], [/silver|moon|steel|pewter/, 0xc8d0dc],
  [/white|pearl|cream|ivory|milk/, 0xf4f0e8], [/black|onyx|shadow|night/, 0x34343e], [/brown|chocolate|cocoa|oak|acorn|walnut|bronze|copper/, 0x8a5a36],
];
const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const PALETTE = [0xd8404a, 0xf28ab8, 0xf08a3a, 0xf0c040, 0x5ab86a, 0x3aa8a8, 0x3a6ac8, 0xa87ad8, 0x8a5a36];
function colorFor(name, fallback) {
  const n = name.toLowerCase();
  for (const [re, c] of COLOR_WORDS) if (re.test(n)) return c;
  return fallback ?? PALETTE[hashStr(n) % PALETTE.length];
}

// ---------------------------------------------------------------- building blocks
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, flatShading: true, ...o });
const shiny = (c) => mat(c, { metalness: 0.6, roughness: 0.25 });
function mesh(geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
}
const cyl = (r1, r2, h, n = 16) => new THREE.CylinderGeometry(r1, r2, h, n);
const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const tor = (r, t, a = 10, b = 24, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, a, b, arc);
const cone = (r, h, n = 16) => new THREE.ConeGeometry(r, h, n);
function group(...parts) {
  const g = new THREE.Group();
  parts.forEach((p) => g.add(p));
  return g;
}

// ---------------------------------------------------------------- the pictures (one per kind of thing)
const B = {
  cake: (c) => group(mesh(cyl(1, 1, 0.55), mat(0xe8c890), 0, 0.28), mesh(cyl(1.02, 1.02, 0.12), mat(c), 0, 0.6), mesh(cyl(0.98, 0.98, 0.5), mat(0xe8c890), 0, 0.9), mesh(cyl(1.03, 1.03, 0.18), mat(0xfff4f4), 0, 1.2), mesh(sph(0.2), mat(0xd8303a), 0, 1.42)),
  bun: (c) => group(mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(c === 0x8a5a36 ? 0xc88a4a : 0xd8a058)), mesh(cyl(1, 1, 0.2), mat(0xc8904a), 0, 0)),
  cookie: (c) => group(mesh(cyl(1, 1, 0.22, 18), mat(0xd8a058), 0, 0, 0, 0.5), ...[[-0.4, 0.2], [0.3, -0.3], [0.2, 0.4]].map(([x, z]) => mesh(sph(0.13), mat(0x5a3420), x, 0.15, z))),
  pie: (c) => group(mesh(cyl(1.1, 0.9, 0.45), mat(0xd8a058), 0, 0.2), mesh(cyl(0.95, 0.95, 0.1), mat(c), 0, 0.45), ...[0, 1, 2, 3].map((i) => mesh(box(2, 0.06, 0.12), mat(0xe8b870), 0, 0.5, 0, 0, (i * Math.PI) / 4))),
  cheese: () => group(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 3, 1, false, 0, Math.PI / 2.2), mat(0xf4c840), 0, 0.4), mesh(sph(0.14), mat(0xd8a020), 0.4, 0.5, 0.45)),
  fish: () => {
    const body = mesh(sph(0.7), mat(0x8ab8d8));
    body.scale.set(1.6, 0.8, 0.5);
    return group(body, mesh(cone(0.55, 0.8, 4), mat(0x6a98c0), -1.4, 0, 0, 0, 0, Math.PI / 2), mesh(sph(0.1), mat(0x101010), 0.75, 0.15, 0.3));
  },
  mug: (c) => group(mesh(cyl(0.6, 0.55, 1.1), mat(c), 0, 0.55), mesh(cyl(0.52, 0.52, 0.05), mat(0x6a3a20), 0, 1.08), mesh(tor(0.32, 0.09, 8, 16), mat(c), 0.62, 0.6, 0), mesh(sph(0.22), mat(0xffffff, { transparent: true, opacity: 0.6 }), 0, 1.5), mesh(sph(0.16), mat(0xffffff, { transparent: true, opacity: 0.5 }), 0.15, 1.85)),
  jar: (c) => group(mesh(cyl(0.65, 0.6, 1.1), mat(0xf0b040, { transparent: true, opacity: 0.85 }), 0, 0.55), mesh(cyl(0.68, 0.68, 0.25), mat(0xd8483a), 0, 1.2), mesh(cyl(0.5, 0.5, 0.06), mat(0xf4e8d0), 0, 0.6, 0.6, Math.PI / 2)),
  berries: (c) => group(...[[0, 0, 0], [0.55, 0, 0.2], [-0.5, 0.05, 0.25], [0.2, 0.45, 0], [-0.15, 0.4, 0.3], [0.3, 0.05, -0.45]].map(([x, y, z]) => mesh(sph(0.36), mat(c === 0x5ab86a ? 0x3a5ad8 : c), x, y, z)), mesh(box(0.3, 0.06, 0.12), mat(0x3a8a3a), 0.1, 0.85, 0)),
  candy: (c) => group(mesh(sph(0.55), mat(c), 0, 0, 0), mesh(cone(0.4, 0.5, 8), mat(c), 0.75, 0, 0, 0, 0, Math.PI / 2), mesh(cone(0.4, 0.5, 8), mat(c), -0.75, 0, 0, 0, 0, -Math.PI / 2)),
  bowl: (c) => group(mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xe8dcc8, { side: THREE.DoubleSide })), mesh(cyl(0.92, 0.92, 0.06), mat(c), 0, -0.12)),
  apple: (c) => group(mesh(sph(0.8), mat(c === 0x5ab86a ? 0x8ac840 : 0xd83a3a)), mesh(cyl(0.05, 0.05, 0.4), mat(0x5a3a20), 0, 0.85), mesh(box(0.4, 0.04, 0.2), mat(0x3a8a3a), 0.2, 0.9, 0, 0, 0, 0.4)),
  carrot: () => group(mesh(cone(0.4, 1.8, 10), mat(0xf08a2a), 0, 0, 0, Math.PI), mesh(box(0.1, 0.6, 0.1), mat(0x3a9a3a), 0, 1.1, 0, 0, 0, 0.3), mesh(box(0.1, 0.6, 0.1), mat(0x3a9a3a), 0.1, 1.1, 0, 0, 0, -0.3)),
  pumpkin: () => group(...[0, 1, 2, 3, 4, 5].map((i) => {
    const s = mesh(sph(0.55), mat(0xf08a2a), Math.cos(i) * 0.35, 0, Math.sin(i) * 0.35);
    s.scale.y = 0.8;
    return s;
  }), mesh(cyl(0.08, 0.1, 0.4), mat(0x5a7a2a), 0, 0.55)),
  mushroom: (c) => group(mesh(cyl(0.25, 0.3, 0.9), mat(0xf4ecd8), 0, 0.45), mesh(new THREE.SphereGeometry(0.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(c === 0x5ab86a ? 0xd84a3a : c), 0, 0.85), ...[[0.3, 1.4, 0.4], [-0.4, 1.3, 0.2], [0.1, 1.5, -0.3]].map(([x, y, z]) => mesh(sph(0.1), mat(0xffffff), x, y, z))),
  egg: () => group((() => {
    const e = mesh(sph(0.7), mat(0xf8f0e0));
    e.scale.y = 1.3;
    return e;
  })()),
  bottle: (c) => group(mesh(sph(0.65), mat(c, { transparent: true, opacity: 0.85 }), 0, 0.6), mesh(cyl(0.2, 0.25, 0.6), mat(c, { transparent: true, opacity: 0.85 }), 0, 1.35), mesh(cyl(0.22, 0.22, 0.2), mat(0x8a5a36), 0, 1.7)),
  flower: (c) => group(mesh(cyl(0.05, 0.06, 1.4), mat(0x3a8a3a), 0, 0), ...[0, 1, 2, 3, 4].map((i) => mesh(sph(0.3), mat(c === 0x5ab86a ? 0xf28ab8 : c), Math.cos((i / 5) * 6.28) * 0.35, 0.8, Math.sin((i / 5) * 6.28) * 0.35)), mesh(sph(0.2), mat(0xf4d040), 0, 0.85, 0)),
  acorn: () => group(mesh(sph(0.55), mat(0xc88a3a), 0, -0.1), mesh(new THREE.SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a5232), 0, 0.15), mesh(cyl(0.05, 0.06, 0.3), mat(0x5a3a20), 0, 0.75)),
  hat: (c) => group(mesh(cyl(1.25, 1.25, 0.08, 24), mat(c)), mesh(cyl(0.65, 0.75, 0.75), mat(c), 0, 0.4), mesh(cyl(0.77, 0.77, 0.18), mat(0xffffff), 0, 0.15), mesh(sph(0.18), mat(0xf28ab8), 0.7, 0.3, 0.3)),
  crown: (c) => group(mesh(cyl(0.8, 0.8, 0.45, 16, 1), shiny(c === 0xf0c040 ? c : 0xf0c040)), ...[0, 1, 2, 3, 4].map((i) => mesh(cone(0.18, 0.5, 6), shiny(0xf0c040), Math.cos((i / 5) * 6.28) * 0.75, 0.45, Math.sin((i / 5) * 6.28) * 0.75)), mesh(sph(0.14), mat(0xd8303a), 0, 0.15, 0.8)),
  cape: (c) => group(mesh(new THREE.ConeGeometry(1.1, 2, 18, 1, true, -Math.PI * 0.6, Math.PI * 1.2), mat(c, { side: THREE.DoubleSide }), 0, 0, 0, 0, Math.PI), mesh(cyl(0.3, 0.3, 0.12), shiny(0xf0c040), 0, 0.95, 0.15)),
  scarf: (c) => group(mesh(tor(0.6, 0.22, 8, 20), mat(c), 0, 0.3, 0, Math.PI / 2.4), mesh(box(0.4, 1.1, 0.15), mat(c), 0.35, -0.4, 0.4, 0, 0, 0.15), mesh(box(0.42, 0.12, 0.17), mat(0xffffff), 0.42, -0.9, 0.4, 0, 0, 0.15)),
  sweater: (c) => group(mesh(box(1.3, 1.3, 0.5), mat(c), 0, 0), mesh(box(0.45, 1.1, 0.42), mat(c), -0.9, 0.05, 0, 0, 0, -0.35), mesh(box(0.45, 1.1, 0.42), mat(c), 0.9, 0.05, 0, 0, 0, 0.35), mesh(box(1.32, 0.15, 0.52), mat(0xffffff), 0, -0.6), mesh(cyl(0.25, 0.25, 0.1), mat(0xffffff), 0, 0.68, 0)),
  boot: (c) => group(mesh(box(0.6, 1.2, 0.6), mat(c), 0, 0.6), mesh(box(0.6, 0.45, 1.1), mat(c), 0, 0.22, 0.3), mesh(box(0.66, 0.2, 0.66), mat(0xffffff), 0, 1.15)),
  earmuffs: (c) => group(mesh(tor(0.8, 0.07, 8, 20, Math.PI), shiny(0xc8d0dc), 0, 0.2), mesh(sph(0.42), mat(c), -0.82, 0.1), mesh(sph(0.42), mat(c), 0.82, 0.1)),
  skate: (c) => group(mesh(box(0.6, 1.1, 0.6), mat(c), 0, 0.75), mesh(box(0.6, 0.4, 1.1), mat(c), 0, 0.4, 0.3), mesh(box(0.08, 0.15, 1.5), shiny(0xdfe6ee), 0, 0.08, 0.25), mesh(sph(0.15), mat(0xff7ab8), 0, 1.2, 0.3)),
  pendant: (c) => group(mesh(tor(0.75, 0.04, 6, 30), shiny(0xf0c040), 0, 0.3), mesh(new THREE.OctahedronGeometry(0.35), shiny(c), 0, -0.55)),
  ring: (c) => group(mesh(tor(0.6, 0.15, 10, 28), shiny(0xf0c040), 0, 0, 0, 0.5), mesh(new THREE.OctahedronGeometry(0.28), shiny(c), 0, 0.7, 0)),
  medal: (c) => group(mesh(box(0.35, 0.8, 0.05), mat(c), -0.15, 0.6, 0, 0, 0, 0.3), mesh(box(0.35, 0.8, 0.05), mat(c), 0.15, 0.6, 0, 0, 0, -0.3), mesh(cyl(0.55, 0.55, 0.12, 20), shiny(0xf0c040), 0, -0.1, 0, Math.PI / 2)),
  bow: (c) => group(mesh(cone(0.45, 0.8, 8), mat(c), -0.45, 0, 0, 0, 0, Math.PI / 2), mesh(cone(0.45, 0.8, 8), mat(c), 0.45, 0, 0, 0, 0, -Math.PI / 2), mesh(sph(0.2), mat(c), 0, 0, 0)),
  pearl: (c) => group(mesh(new THREE.SphereGeometry(0.75, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8d8c8, { side: THREE.DoubleSide }), 0, -0.2, 0, Math.PI), mesh(sph(0.5, 24, 18), mat(c === 0x34343e ? 0x34343e : 0xf8f4f0, { roughness: 0.15, metalness: 0.2 }), 0, 0.1)),
  shell: (c) => group(...[0, 1, 2, 3, 4].map((i) => mesh(cone(0.55 - i * 0.09, 0.5, 12), mat(i % 2 ? 0xffd8c8 : 0xf4b8a8), 0, i * 0.35, 0, 0, i * 0.8, 0))),
  lantern: () => group(mesh(box(0.9, 0.12, 0.9), mat(0x3a2a1a), 0, 0), mesh(box(0.9, 0.12, 0.9), mat(0x3a2a1a), 0, 1.1), mesh(box(0.7, 0.95, 0.7), mat(0xffd860, { emissive: 0xffa020, emissiveIntensity: 0.8 }), 0, 0.55), mesh(cone(0.6, 0.4, 4), mat(0x3a2a1a), 0, 1.35, 0, 0, Math.PI / 4), mesh(tor(0.2, 0.04, 6, 12), mat(0x3a2a1a), 0, 1.65)),
  candle: () => group(mesh(cyl(0.35, 0.35, 1.2), mat(0xf8f0e0), 0, 0.6), mesh(cone(0.15, 0.4, 8), mat(0xffc040, { emissive: 0xff8a20, emissiveIntensity: 1 }), 0, 1.45), mesh(cyl(0.6, 0.6, 0.12), shiny(0xc8a050), 0, 0)),
  book: (c) => group(mesh(box(1.4, 0.35, 1.8), mat(c), 0, 0, 0, 0, 0.4), mesh(box(1.3, 0.28, 1.7), mat(0xf8f0dc), 0.05, 0, 0, 0, 0.4), mesh(box(0.2, 0.37, 1.82), mat(0xf0c040), -0.55, 0, -0.25, 0, 0.4)),
  feather: (c) => group(mesh(cyl(0.03, 0.03, 2), mat(0xf4f0e8), 0, 0, 0, 0, 0, 0.5), (() => {
    const v = mesh(sph(0.5), mat(c === 0x5ab86a ? 0xa87a4a : c), -0.15, 0.25, 0, 0, 0, 0.5);
    v.scale.set(0.45, 1.9, 0.12);
    return v;
  })()),
  scroll: (c) => group(mesh(box(1.6, 0.04, 1.1), mat(0xf4e4c0), 0, 0), mesh(cyl(0.15, 0.15, 1.3), mat(0xe8d4a8), -0.82, 0.05, 0, Math.PI / 2), mesh(cyl(0.15, 0.15, 1.3), mat(0xe8d4a8), 0.82, 0.05, 0, Math.PI / 2), mesh(box(0.6, 0.05, 0.05), mat(0xd8404a), 0.2, 0.05, 0.1), mesh(box(0.05, 0.05, 0.5), mat(0xd8404a), -0.2, 0.05, -0.1)),
  compass: () => group(mesh(cyl(0.85, 0.85, 0.2, 24), shiny(0xc8a050), 0, 0), mesh(cyl(0.72, 0.72, 0.22, 24), mat(0xf8f0dc), 0, 0.02), mesh(cone(0.12, 0.6, 4), mat(0xd8303a), 0, 0.15, -0.3, -Math.PI / 2), mesh(cone(0.12, 0.6, 4), mat(0x3a3a4a), 0, 0.15, 0.3, Math.PI / 2)),
  spyglass: () => group(mesh(cyl(0.22, 0.3, 1.2), shiny(0xc8a050), -0.5, 0, 0, 0, 0, Math.PI / 2), mesh(cyl(0.3, 0.38, 0.9), mat(0x5a3a20), 0.5, 0, 0, 0, 0, Math.PI / 2), mesh(cyl(0.4, 0.4, 0.15), shiny(0xc8a050), 0.95, 0, 0, 0, 0, Math.PI / 2)),
  kite: (c) => {
    const k = mesh(new THREE.OctahedronGeometry(0.9, 0), mat(c), 0, 0.3, 0);
    k.scale.set(0.8, 1.2, 0.1);
    return group(k, mesh(box(0.04, 1.2, 0.04), mat(0x5a3a20), 0, -1, 0, 0, 0, 0.2), mesh(sph(0.1), mat(0xf28ab8), 0.1, -0.7), mesh(sph(0.1), mat(0xf0c040), 0.2, -1.1));
  },
  figurine: (c) => group(mesh(cyl(0.6, 0.7, 0.2), mat(0x8a6a4a), 0, -0.5), (() => {
    const b = mesh(sph(0.55), mat(c), 0, 0.05);
    b.scale.y = 1.2;
    return b;
  })(), mesh(sph(0.38), mat(c), 0, 0.8), mesh(sph(0.1), mat(0xffffff), -0.14, 0.88, 0.32), mesh(sph(0.1), mat(0xffffff), 0.14, 0.88, 0.32), mesh(cone(0.12, 0.3, 4), mat(c), -0.2, 1.15), mesh(cone(0.12, 0.3, 4), mat(c), 0.2, 1.15)),
  spintop: (c) => group(mesh(cone(0.75, 1, 12), mat(c), 0, 0, 0, Math.PI), mesh(cyl(0.75, 0.75, 0.2, 12), mat(0xffffff), 0, 0.55), mesh(cyl(0.08, 0.08, 0.6), mat(0x5a3a20), 0, 0.9)),
  beads: (c) => group(...Array.from({ length: 12 }, (_, i) => mesh(sph(0.16), mat(PALETTE[(i + 3) % PALETTE.length]), Math.cos((i / 12) * 6.28) * 0.8, Math.sin((i / 12) * 6.28) * 0.8 * 0.6, 0))),
  comb: (c) => group(mesh(box(1.6, 0.25, 0.1), mat(c), 0, 0.4), ...Array.from({ length: 9 }, (_, i) => mesh(box(0.08, 0.6, 0.08), mat(c), -0.7 + i * 0.175, 0))),
  anchor: () => group(mesh(box(0.15, 1.6, 0.15), shiny(0x5a6a7a), 0, 0.2), mesh(tor(0.6, 0.08, 6, 16, Math.PI), shiny(0x5a6a7a), 0, -0.45, 0, 0, 0, Math.PI), mesh(tor(0.2, 0.06, 6, 12), shiny(0x5a6a7a), 0, 1.15), mesh(box(0.8, 0.12, 0.12), shiny(0x5a6a7a), 0, 0.7)),
  bell: (c) => group(mesh(new THREE.CylinderGeometry(0.35, 0.8, 1, 16, 1, true), shiny(c === 0xc8d0dc ? c : 0xf0c040), 0, 0.3), mesh(sph(0.36), shiny(0xf0c040), 0, 0.8), mesh(sph(0.15), shiny(0xc8a050), 0, -0.25), mesh(tor(0.15, 0.04, 6, 12), shiny(0xc8a050), 0, 1.2)),
  key: (c) => group(mesh(tor(0.35, 0.09, 8, 16), shiny(c === 0xc8d0dc ? c : 0xf0c040), -0.8, 0, 0), mesh(box(1.3, 0.14, 0.12), shiny(0xf0c040), 0.15, 0), mesh(box(0.12, 0.35, 0.12), shiny(0xf0c040), 0.6, -0.2), mesh(box(0.12, 0.25, 0.12), shiny(0xf0c040), 0.35, -0.15)),
  coin: () => group(mesh(cyl(0.8, 0.8, 0.15, 24), shiny(0xf0c040), 0, 0, 0, Math.PI / 2.4), mesh(cyl(0.6, 0.6, 0.17, 24), shiny(0xd8a830), 0, 0, 0, Math.PI / 2.4)),
  trophy: (c) => group(mesh(cyl(0.5, 0.6, 0.25), shiny(0xc8a050), 0, -0.7), mesh(cyl(0.12, 0.12, 0.6), shiny(0xf0c040), 0, -0.3), mesh(new THREE.CylinderGeometry(0.8, 0.35, 0.9, 18, 1, true), shiny(0xf0c040), 0, 0.4), mesh(tor(0.3, 0.06, 6, 12), shiny(0xf0c040), -0.85, 0.45), mesh(tor(0.3, 0.06, 6, 12), shiny(0xf0c040), 0.85, 0.45)),
  gem: (c) => group(mesh(new THREE.OctahedronGeometry(0.9, 0), mat(c, { roughness: 0.15, metalness: 0.2, emissive: c, emissiveIntensity: 0.15 }), 0, 0, 0, 0, 0.4)),
  crystal: (c) => group(...[[0, 0, 0, 1.4], [0.45, -0.2, 0.2, 0.9], [-0.4, -0.25, 0.15, 0.8]].map(([x, y, z, h]) => mesh(cone(0.3, h, 6), mat(c, { roughness: 0.1, emissive: c, emissiveIntensity: 0.2 }), x, y + h / 2 - 0.4, z, (x * 0.4), 0, -x * 0.6))),
  star: (c) => group((() => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? 0.42 : 1;
      i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false }), mat(0xf4d040, { emissive: 0xc89a10, emissiveIntensity: 0.3 }), 0, 0, -0.12);
  })()),
  snowglobe: () => group(mesh(cyl(0.7, 0.8, 0.4), mat(0x8a5a36), 0, -0.6), mesh(sph(0.75), mat(0xcfe8ff, { transparent: true, opacity: 0.45 }), 0, 0.2), mesh(cone(0.3, 0.6, 8), mat(0x3a7a4a), 0, 0.05), mesh(sph(0.06), mat(0xffffff), 0.2, 0.4, 0.2)),
  sled: (c) => group(mesh(box(0.8, 0.15, 1.6), mat(0xc8402a), 0, 0.35), mesh(box(0.06, 0.06, 1.8), shiny(0xc8d0dc), -0.35, 0, 0.1), mesh(box(0.06, 0.06, 1.8), shiny(0xc8d0dc), 0.35, 0, 0.1), mesh(tor(0.2, 0.05, 6, 12, Math.PI), shiny(0xc8d0dc), -0.35, 0.15, 0.95, 0, Math.PI / 2)),
  rollingpin: () => group(mesh(cyl(0.3, 0.3, 1.4), mat(0xd8b080), 0, 0, 0, 0, 0, Math.PI / 2), mesh(cyl(0.1, 0.1, 0.5), mat(0xa87a4a), -0.95, 0, 0, 0, 0, Math.PI / 2), mesh(cyl(0.1, 0.1, 0.5), mat(0xa87a4a), 0.95, 0, 0, 0, 0, Math.PI / 2)),
  knife: () => group(mesh(box(0.9, 0.3, 0.05), shiny(0xdfe6ee), 0.35, 0), mesh(box(0.6, 0.18, 0.14), mat(0x5a3a20), -0.4, 0)),
  flag: (c) => group(mesh(cyl(0.05, 0.05, 2), mat(0x8a6a4a), -0.6, 0), mesh(cone(0.5, 1.2, 3), mat(c), 0, 0.5, 0, 0, 0, -Math.PI / 2)),
  chest: (c) => group(mesh(box(1.4, 0.8, 0.9), mat(0x8a5a36), 0, 0), mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12, 1, false, 0, Math.PI), mat(0x7a4a2a), 0, 0.4, 0, 0, 0, Math.PI / 2), mesh(box(0.25, 0.3, 0.05), shiny(0xf0c040), 0, 0.3, 0.47)),
  lure: () => group(mesh(sph(0.4), mat(0xf0c040), 0, 0.2), mesh(tor(0.25, 0.04, 6, 12, Math.PI * 1.4), shiny(0xc8d0dc), 0, -0.4), mesh(sph(0.12), mat(0xd8303a), 0.25, 0.3, 0.2)),
  potplant: (c) => group(mesh(cyl(0.55, 0.42, 0.6), mat(0xc8703a), 0, -0.4), mesh(cyl(0.08, 0.1, 0.7), mat(0x6a4a2a), 0, 0.15), mesh(sph(0.55), mat(c === 0x5ab86a || c === undefined ? 0x4a9a4a : 0x4a9a4a), 0, 0.7), mesh(sph(0.35), mat(0x5ab05a), 0.35, 0.55, 0.1)),
  cloth: (c) => group(mesh(box(1.5, 0.12, 1.1), mat(c), 0, 0), mesh(box(1.5, 0.12, 1.1), mat(c), 0.05, 0.13, 0.05, 0, 0.1), mesh(box(1.52, 0.02, 0.15), mat(0xffffff), 0.05, 0.2, 0)),
  brush: (c) => group(mesh(box(1.2, 0.3, 0.55), mat(0x8a5a36), 0, 0.2), mesh(box(1.1, 0.25, 0.5), mat(0xe8d8b8), 0, -0.05), mesh(tor(0.25, 0.07, 6, 12, Math.PI), mat(0x8a5a36), 0, 0.4)),
  sticks: () => group(...[0, 1, 2].map((i) => mesh(cyl(0.08, 0.1, 1.8), mat(0x7a5232), (i - 1) * 0.25, 0, 0, 0.2 * (i - 1), 0, Math.PI / 2 + (i - 1) * 0.3))),
  rocks: () => group(mesh(new THREE.DodecahedronGeometry(0.6, 0), mat(0x9a9a9a), -0.3, 0), mesh(new THREE.DodecahedronGeometry(0.45, 0), mat(0x8a8a90), 0.45, -0.1, 0.2), mesh(new THREE.DodecahedronGeometry(0.35, 0), mat(0xaaaaaa), 0.1, 0.4, -0.2)),
  moss: () => group(...[[0, 0, 0, 0.6], [0.5, -0.05, 0.2, 0.45], [-0.45, -0.05, 0.1, 0.45]].map(([x, y, z, r]) => {
    const b = mesh(sph(r, 10, 8), mat(0x5aa84a), x, y, z);
    b.scale.y = 0.6;
    return b;
  })),
  spool: (c) => group(mesh(cyl(0.5, 0.5, 0.9), mat(c === 0x5ab86a ? 0xe8d8b8 : c), 0, 0), mesh(cyl(0.65, 0.65, 0.12), mat(0xc8a070), 0, 0.5), mesh(cyl(0.65, 0.65, 0.12), mat(0xc8a070), 0, -0.5)),
  droplet: (c) => group(mesh(sph(0.6), mat(0x6ac8f0, { transparent: true, opacity: 0.85 }), 0, -0.1), mesh(cone(0.5, 0.8, 16), mat(0x6ac8f0, { transparent: true, opacity: 0.85 }), 0, 0.55)),
  gear: () => group(mesh(cyl(0.8, 0.8, 0.25, 20), shiny(0xc8a050), 0, 0, 0, Math.PI / 2), ...Array.from({ length: 10 }, (_, i) => mesh(box(0.25, 0.25, 0.25), shiny(0xc8a050), Math.cos((i / 10) * 6.28) * 0.9, Math.sin((i / 10) * 6.28) * 0.9, 0)), mesh(cyl(0.2, 0.2, 0.3), mat(0x3a3a3a), 0, 0, 0, Math.PI / 2)),
  animal: (c) => group((() => {
    const b = mesh(sph(0.6), mat(c), 0, 0);
    b.scale.set(1.3, 0.85, 0.85);
    return b;
  })(), mesh(sph(0.42), mat(c), 0.85, 0.35), mesh(cone(0.14, 0.3, 4), mat(c), 0.75, 0.75, 0.15), mesh(cone(0.14, 0.3, 4), mat(c), 0.95, 0.75, -0.15), mesh(sph(0.07), mat(0x101010), 1.18, 0.42, 0.15), ...[[-0.4, 0.25], [0.4, 0.25], [-0.4, -0.25], [0.4, -0.25]].map(([x, z]) => mesh(cyl(0.1, 0.1, 0.5), mat(c), x, -0.55, z))),
  furniture: (c) => group(mesh(box(1.4, 0.2, 1), mat(c), 0, 0.3), mesh(box(1.4, 1, 0.2), mat(c), 0, 0.8, -0.4), ...[[-0.6, 0.4], [0.6, 0.4], [-0.6, -0.4], [0.6, -0.4]].map(([x, z]) => mesh(box(0.15, 0.6, 0.15), mat(0x7a5232), x, -0.1, z))),
  bug: () => group((() => {
    const b = mesh(sph(0.7), mat(0x2a5a3a, { metalness: 0.4, roughness: 0.3 }), 0, 0.1);
    b.scale.set(1, 0.6, 1.3);
    return b;
  })(), mesh(sph(0.35), mat(0x1a2a1a), 0, 0.1, 0.95), mesh(box(0.04, 0.5, 1.6), mat(0x1a3a2a), 0, 0.42, 0), ...[-0.45, 0, 0.45].flatMap((z) => [mesh(box(0.7, 0.06, 0.06), mat(0x1a1a1a), -0.65, -0.1, z, 0, 0, 0.5), mesh(box(0.7, 0.06, 0.06), mat(0x1a1a1a), 0.65, -0.1, z, 0, 0, -0.5)])),
  butter: () => group(mesh(box(1.3, 0.6, 0.8), mat(0xf8e080), 0, 0), mesh(box(1.4, 0.1, 0.9), mat(0xd8d8e0), 0, -0.35)),
  gift: (c) => group(mesh(box(1.2, 1, 1.2), mat(c), 0, 0), mesh(box(1.25, 1.02, 0.2), mat(0xffffff), 0, 0), mesh(box(0.2, 1.02, 1.25), mat(0xffffff), 0, 0), mesh(tor(0.25, 0.08, 6, 12), mat(0xffffff), -0.2, 0.6, 0, 0, 0.8), mesh(tor(0.25, 0.08, 6, 12), mat(0xffffff), 0.2, 0.6, 0, 0, -0.8)),
};

// which picture for which name (first match wins)
const RULES = [
  [/cupcake|cake|gateau/, "cake"], [/cookie|biscuit|shortbread/, "cookie"], [/pie|tart|quiche|pasty/, "pie"], [/bun|bread|muffin|loaf|scone|roll\b|pretzel|croissant|donut|doughnut/, "bun"],
  [/cheese/, "cheese"], [/beetle|bug|ladybird|ladybug/, "bug"], [/butter(?!fly)/, "butter"], [/juice|cordial|lemonade|smoothie/, "bottle"], [/seed|acorn/, "acorn"], [/fish|eel|trout|minnow|salmon/, "fish"], [/tea\b|cocoa|coffee|cider|cup of|mug|latte|chocolate drink|hot /, "mug"],
  [/honey|jam|jar\b|syrup|preserve/, "jar"], [/berr|cherr|grape/, "berries"], [/toffee|candy|sweet|caramel|fudge|lolli|bonbon|treat/, "candy"],
  [/stew|soup|porridge|broth|chowder|bowl of|salad|feast/, "bowl"], [/apple/, "apple"], [/carrot|\bbeets?\b|radish/, "carrot"], [/pumpkin|squash/, "pumpkin"],
  [/mushroom|toadstool|glowcap/, "mushroom"], [/\begg/, "egg"], [/milk|bottle|potion|tonic|salve|poultice|balm|elixir|nectar|dew/, "bottle"],
  [/seed|acorn|nut\b|nuts|grain|oat/, "acorn"], [/flower|petal|bouquet|blossom|rose\b|lily|daisy|sunflower|iris|marigold|lotus|lavender|clover|herb/, "flower"],
  [/crown|tiara|circlet/, "crown"], [/hat|cap\b|beret|bonnet|hood\b/, "hat"], [/cape|cloak|robe|shawl/, "cape"], [/scarf|bandana/, "scarf"],
  [/sweater|jumper|cardigan|tunic|vest|coat|jacket|dress|gown/, "sweater"], [/skate/, "skate"], [/boot|shoe|sock|slipper/, "boot"], [/earmuff/, "earmuffs"],
  [/necklace|pendant|locket|amulet|charm/, "pendant"], [/bracelet|ring\b|anklet|band\b/, "ring"], [/earring/, "pendant"], [/brooch|pin\b|badge|medal|ribbon\b(?!s on)/, "medal"], [/bow\b|bows\b/, "bow"],
  [/pearl|marble|orb/, "pearl"], [/shell|conch|scallop/, "shell"], [/lantern|lamp|glow ?jar|firefly/, "lantern"], [/candle/, "candle"],
  [/book|journal|tome|diary|almanac/, "book"], [/quill|feather/, "feather"], [/map|scroll|letter|chart|note|recipe|diploma/, "scroll"],
  [/compass/, "compass"], [/spyglass|telescope|stargazer/, "spyglass"], [/kite/, "kite"], [/spinning top|\btop\b/, "spintop"], [/bead/, "beads"], [/comb/, "comb"],
  [/anchor/, "anchor"], [/bell/, "bell"], [/key\b/, "key"], [/coin/, "coin"], [/cup\b|trophy|chalice|goblet/, "trophy"],
  [/crystal|quartz|amethyst|shard|ice\b|icicle/, "crystal"], [/gem|jewel|diamond|moonstone|sunstone|starstone|stone of|ruby|sapphire|emerald|scale/, "gem"], [/star\b|stars\b|starlight/, "star"],
  [/snow ?globe|globe/, "snowglobe"], [/sled|sleigh/, "sled"], [/rolling ?pin/, "rollingpin"], [/knife|blade/, "knife"], [/flag|pennant|banner/, "flag"],
  [/chest|box|tackle|case|crate|trunk/, "chest"], [/lure|hook/, "lure"], [/plant|bonsai|sapling|pot\b|fern|cactus/, "potplant"],
  [/rug|blanket|cloth|silk|fabric|quilt|scrap|wool|cushion|pillow/, "cloth"], [/brush/, "brush"], [/doll|figure|figurine|owl|statue|carved/, "figurine"],
  [/twig|stick|wood|log|branch/, "sticks"], [/stone|pebble|rock|clay|mud|dirt/, "rocks"], [/moss/, "moss"], [/string|thread|yarn|rope|twine/, "spool"],
  [/water|droplet|drop\b/, "droplet"], [/gear|cog|clock|watch/, "gear"],
  [/cat|kitten|fox|wolf|husk|dog|pony|horse|lamb|sheep|bunny|rabbit|hedgehog|mouse|chick|wren|hummingbird|bird/, "animal"],
  [/chair|armchair|table|bed\b|shelf|stool|bench|sofa|aquarium|fireplace|lamp/, "furniture"],
];
// …and a few emoji that say plainly what they are (when the name doesn't)
const EMOJI_RULES = { "🍰": "cake", "🎂": "cake", "🧁": "cake", "🥧": "pie", "🍞": "bun", "🥐": "bun", "🧀": "cheese", "🐟": "fish", "🍵": "mug", "☕": "mug", "🍯": "jar", "🫐": "berries", "🍓": "berries", "🍬": "candy", "🍭": "candy", "🍲": "bowl", "🥣": "bowl", "🍎": "apple", "🥕": "carrot", "🎃": "pumpkin", "🍄": "mushroom", "🥚": "egg", "🥛": "bottle", "🌸": "flower", "🌷": "flower", "🌻": "flower", "🌰": "acorn", "👒": "hat", "🎩": "hat", "👑": "crown", "🧣": "scarf", "🧥": "sweater", "👢": "boot", "🧦": "boot", "⛸️": "skate", "📿": "beads", "💍": "ring", "🎀": "bow", "🏅": "medal", "🐚": "shell", "🏮": "lantern", "🕯️": "candle", "📖": "book", "📕": "book", "🪶": "feather", "🗺️": "scroll", "📜": "scroll", "🧭": "compass", "🔭": "spyglass", "🪁": "kite", "🔔": "bell", "🗝️": "key", "🔑": "key", "🪙": "coin", "🏆": "trophy", "💎": "gem", "🔮": "pearl", "⭐": "star", "🌟": "star", "✨": "star", "🛷": "sled", "🚩": "flag", "📦": "chest", "🎣": "lure", "🪴": "potplant", "🧵": "spool", "🧶": "spool", "🪮": "comb", "💧": "droplet", "⚙️": "gear", "🪵": "sticks", "🪨": "rocks", "🎁": "gift" };

// ---------------------------------------------------------------- 📷 real pictures (Fluent 3D, by Microsoft — MIT licence)
// public/items/ holds a realistic little 3D picture for every emoji the game
// uses (downloaded once by scripts — see index.json). The NAME picks the best
// picture first ("Piglet Plush" → a pig), then the item's own emoji.
const NAME_PICS = [
  // (the most specific first: an "Acorn Cap" is an acorn, "Bee Wax" is wax, a "Berry Seed" is a seed)
  [/acorn|ancient seed/, "🌰"], [/\bwax\b|beeswax/, "🕯️"], [/berry seed|seedling|seeds?\b(?!.*cake)/, "🌱"],
  [/piglet|\bpig\b|\bpigs\b/, "🐖"], [/\bcow\b|calf|dairy/, "🐄"], [/\bhen\b|chicken/, "🐔"], [/chick\b|chicks/, "🐤"], [/lamb|sheep|wool\b/, "🐑"], [/bunny|rabbit/, "🐇"], [/kitten|\bcat\b/, "🐈"],
  [/\bfox/, "🦊"], [/\bwolf/, "🐺"], [/\bowl\b|owl /, "🦉"], [/hedgehog/, "🦔"], [/husk|\bdog\b|puppy/, "🐕"], [/\bpony|horse/, "🐴"], [/llama/, "🦙"], [/camel/, "🐪"], [/\bgoat/, "🐐"], [/\bduck/, "🦆"], [/wren|sparrow|\bbird/, "🐦"],
  [/hummingbird/, "🐦"], [/turtle|tortoise/, "🐢"], [/\bfrog|toad\b/, "🐸"], [/butterfly/, "🦋"], [/\bbee\b|bees/, "🐝"], [/beetle/, "🪲"], [/ladybird|ladybug/, "🐞"], [/snail/, "🐌"], [/whale/, "🐋"], [/dragon/, "🐉"],
  [/cupcake|muffin/, "🧁"], [/cake|gateau/, "🍰"], [/\bpie\b|tart|pasty/, "🥧"], [/cookie|biscuit|shortbread/, "🍪"], [/bread|loaf|\bbun\b|\broll\b/, "🍞"], [/croissant|pastry/, "🥐"], [/pancake|crepe/, "🥞"], [/donut|doughnut/, "🍩"],
  [/cheese/, "🧀"], [/butter(?!fly)/, "🧈"], [/honey/, "🍯"], [/\bjam\b|preserve|\bjar\b/, "🫙"], [/\btea\b|teacup/, "🍵"], [/teapot/, "🫖"], [/cocoa|coffee|hot choc|cider/, "☕"], [/milk/, "🥛"], [/juice|cordial|lemonade/, "🧃"],
  [/\begg/, "🥚"], [/carrot/, "🥕"], [/\bbeets?\b|radish/, "🍠"], [/pumpkin|squash/, "🎃"], [/apple/, "🍎"], [/strawberr/, "🍓"], [/cherr/, "🍒"], [/grape/, "🍇"], [/blueberr|berr/, "🫐"], [/mushroom|toadstool|glowcap/, "🍄"],
  [/\bcorn\b/, "🌽"], [/potato/, "🥔"], [/tomato/, "🍅"], [/\bpear\b/, "🍐"], [/lemon/, "🍋"], [/peach/, "🍑"], [/coconut/, "🥥"], [/\bnut\b|nuts|peanut/, "🥜"], [/chocolate/, "🍫"], [/lolli/, "🍭"], [/toffee|candy|sweet|caramel|fudge|bonbon/, "🍬"],
  [/stew|soup|chowder|broth|porridge/, "🍲"], [/salad/, "🥗"], [/sandwich/, "🥪"], [/feast/, "🍱"], [/fish|eel|trout|salmon|minnow/, "🐟"], [/oyster|pearl/, "🦪"], [/\bshell|conch|scallop/, "🐚"],
  [/top hat/, "🎩"], [/\bcap\b/, "🧢"], [/hat\b|bonnet|beret/, "👒"], [/crown|tiara/, "👑"], [/scarf|bandana/, "🧣"], [/coat|sweater|jumper|cardigan|cloak|cape/, "🧥"], [/dress|gown/, "👗"], [/boot/, "👢"], [/sock/, "🧦"], [/glove|mitten/, "🧤"],
  [/\bring\b/, "💍"], [/necklace|pendant|beads|locket|amulet/, "📿"], [/\bbow\b|ribbon/, "🎀"], [/medal|badge|brooch/, "🏅"], [/trophy|\bcup\b(?! of)|chalice/, "🏆"], [/lantern/, "🏮"], [/candle/, "🕯️"], [/lamp/, "🪔"],
  [/book|journal|tome|diary|almanac/, "📖"], [/quill|feather/, "🪶"], [/\bmap\b|trail map/, "🗺️"], [/scroll|chart|diploma|letter|note/, "📜"], [/compass/, "🧭"], [/spyglass|telescope|stargazer/, "🔭"], [/kite/, "🪁"],
  [/doll|plush|teddy/, "🧸"], [/spinning top|\btop\b/, "🪀"], [/bell/, "🔔"], [/\bkey\b/, "🗝️"], [/coin/, "🪙"], [/crystal|gem|jewel|diamond|amethyst|quartz|moonstone|sunstone|starstone|shard/, "💎"], [/\bstar\b|star\b/, "⭐"],
  [/snow ?globe|crystal ball|orb/, "🔮"], [/\bglobe/, "🌍"], [/sled|sleigh/, "🛷"], [/skate/, "⛸️"], [/flag|pennant|banner/, "🚩"], [/toolbox|tackle/, "🧰"], [/chest|box\b|crate/, "📦"], [/lure|fishing rod|rod\b/, "🎣"], [/hook\b/, "🪝"],
  [/bonsai|plant|\bpot\b|sapling/, "🪴"], [/cactus/, "🌵"], [/sunflower/, "🌻"], [/tulip/, "🌷"], [/\brose\b/, "🌹"], [/lily|lotus|blossom|petal|flower|bouquet/, "🌸"], [/clover/, "🍀"], [/herb|lavender|mint\b/, "🌿"],
  [/seed|acorn/, "🌰"], [/wheat|grain|\boat/, "🌾"], [/leaf|leaves/, "🍃"], [/twig|stick|wood|\blog\b|bark|branch/, "🪵"], [/stone|pebble|rock|clay|mud|dirt/, "🪨"], [/yarn|wool/, "🧶"], [/string|thread|twine|silk|fiber|fibre|rope/, "🧵"],
  [/water|dew|droplet/, "💧"], [/basket/, "🧺"], [/broom/, "🧹"], [/umbrella/, "☂️"], [/rug|blanket|quilt|cushion|pillow|cloth|scrap|fabric/, "🧵"], [/\bbed\b/, "🛏️"], [/chair|armchair|stool|bench|sofa|table|shelf/, "🪑"],
  [/clock|watch/, "🕰️"], [/gear|cog/, "⚙️"], [/scissors/, "✂️"], [/needle/, "🪡"], [/comb/, "🪮"], [/mirror/, "🪞"], [/brush|paint|easel/, "🖌️"], [/palette/, "🎨"], [/flute|pipe\b/, "🪈"], [/drum/, "🥁"], [/guitar|lute/, "🎸"],
  [/bone/, "🦴"], [/snowflake/, "❄️"], [/fire\b|ember/, "🔥"], [/moon/, "🌙"], [/\bsun\b/, "☀️"], [/rainbow/, "🌈"], [/cloud/, "☁️"], [/anchor/, "⚓"], [/sail/, "⛵"], [/jar\b/, "🫙"], [/potion|tonic|elixir|nectar/, "🧪"],
  [/salve|balm|poultice|lotion/, "🧴"], [/soap/, "🧼"], [/bowl/, "🥣"], [/spoon/, "🥄"], [/knife|blade/, "🔪"], [/rolling ?pin/, "🥖"], [/backpack|satchel|pouch|\bbag\b/, "🎒"], [/glasses|spectacles/, "👓"], [/mask/, "🎭"],
  [/puzzle/, "🧩"], [/dice/, "🎲"], [/aquarium|fishbowl/, "🐠"], [/fireplace|hearth/, "🔥"], [/net\b/, "🥅"], [/ice\b|icicle/, "🧊"], [/tent/, "⛺"], [/house|cottage|home/, "🏡"], [/castle/, "🏰"], [/wagon|cart\b/, "🛒"],
];
let PIC_INDEX = null;
const strip = (e) => (e || "").replace(/\uFE0F/g, "");
const picReady = fetch("/items/index.json")
  .then((r) => (r.ok ? r.json() : {}))
  .then((j) => {
    PIC_INDEX = {};
    for (const [k, v] of Object.entries(j)) PIC_INDEX[strip(k)] = v;
  })
  .catch(() => (PIC_INDEX = {}));
/** the best real picture for an item (a URL), or null */
export function realPicture(name, icon) {
  if (!PIC_INDEX) return null;
  const n = (name || "").toLowerCase();
  for (const [re, e] of NAME_PICS) if (re.test(n) && PIC_INDEX[strip(e)]) return "/items/" + PIC_INDEX[strip(e)];
  const ic = strip(icon);
  if (ic && PIC_INDEX[ic]) return "/items/" + PIC_INDEX[ic];
  return null;
}

function pickShape(name, icon) {
  const n = (name || "").toLowerCase();
  for (const [re, k] of RULES) if (re.test(n)) return k;
  if (icon && EMOJI_RULES[icon]) return EMOJI_RULES[icon];
  return "gift";
}

/** a picture (data URL) of an item, by its name (and emoji, as a hint) */
export function itemPicture(name, icon = "") {
  const real = realPicture(name, icon);
  if (real) return real;
  const key = name + "|" + icon;
  if (cache.has(key)) return cache.get(key);
  if (!setup()) return null;
  const shape = pickShape(name, icon);
  const c = colorFor(name);
  let g;
  try {
    g = (B[shape] || B.gift)(c);
  } catch {
    g = B.gift(c);
  }
  // centre it and fit it in the frame, turned a little so it looks solid
  g.rotation.y = -0.5;
  g.rotation.x = 0.18;
  const bb = new THREE.Box3().setFromObject(g);
  const size = bb.getSize(new THREE.Vector3());
  const mid = bb.getCenter(new THREE.Vector3());
  const holder = new THREE.Group();
  g.position.sub(mid);
  holder.add(g);
  const r = Math.max(size.x, size.y, size.z) || 1;
  holder.scale.setScalar(2 / r);
  scene.add(holder);
  cam.position.set(0, 0.6, 7.2);
  cam.lookAt(0, 0, 0);
  R.render(scene, cam);
  const url = R.domElement.toDataURL("image/png");
  scene.remove(holder);
  holder.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  cache.set(key, url);
  return url;
}

// ---------------------------------------------------------------- swap the emoji for pictures, everywhere
const EMOJI = /^\s*(\p{Extended_Pictographic}|\p{Emoji_Presentation})(️|‍|\p{Extended_Pictographic}|\p{Emoji_Modifier})*\s*$/u;
const LEADING = /^\s*((?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:️|‍|\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s+(.+)$/u;
const nameOf = (row) => {
  const nm = row && row.querySelector(".nm");
  if (!nm) return "";
  // (just the name itself — not the little description under it)
  let t = "";
  for (const n of nm.childNodes) {
    if (n.nodeType === 3) t += n.textContent;
    else if (n.tagName === "B" && !t.trim()) t += n.textContent;
  }
  return t.replace(/×\s*\d+/, "").trim();
};
function swap(root) {
  if (!root || !root.querySelectorAll || !PIC_INDEX) return; // (wait until we know which pictures we have)
  root.querySelectorAll(".ic:not([data-pic])").forEach((ic) => {
    const txt = ic.textContent;
    ic.dataset.pic = "1";
    if (!EMOJI.test(txt)) return;
    const row = ic.closest(".item, .cell, li, div");
    const name = nameOf(row);
    if (!name) return;
    const url = itemPicture(name, txt.trim());
    if (!url) return;
    ic.innerHTML = `<img src="${url}" alt="${name.replace(/"/g, "")}" class="item-pic">`;
  });
  root.querySelectorAll(".tag:not([data-pic])").forEach((tag) => {
    tag.dataset.pic = "1";
    const m = tag.textContent.match(LEADING);
    if (!m || /coins?\b/.test(m[2])) return;
    const name = m[2].replace(/\s*\(✨.*\)\s*$/, "").replace(/\s*\(.*\)\s*$/, "");
    const url = itemPicture(name, m[1]);
    if (!url) return;
    tag.innerHTML = `<img src="${url}" alt="" class="item-pic tag-pic">${tag.innerHTML.replace(m[1], "").trim()}`;
  });
}
export function initItemPictures() {
  const style = document.createElement("style");
  style.textContent = `.item-pic { width: 2.2em; height: 2.2em; object-fit: contain; vertical-align: middle; image-rendering: auto; filter: drop-shadow(0 1px 1px rgba(0,0,0,.25)); }
    .ic .item-pic { width: 2.4em; height: 2.4em; }
    .cell .ic .item-pic { width: 3em; height: 3em; }
    .tag-pic { width: 1.6em; height: 1.6em; margin-right: 4px; }`;
  document.head.appendChild(style);
  picReady.then(() => swap(document.body));
  window.__wwSwapPics = swap; // (redraws swap their pictures in BEFORE restoring the scroll — so nothing jumps)
  new MutationObserver((list) => {
    for (const m of list) for (const n of m.addedNodes) if (n.nodeType === 1) swap(n.parentElement || n);
  }).observe(document.body, { childList: true, subtree: true });
}
