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

// How BIG the outdoors is. Crank this number up for an even bigger world.
const OUTDOOR_SCALE = 12;
// How far apart the map places things (bigger = longer walks).
const WORLD_SCALE = 55 * OUTDOOR_SCALE;
const LANDMARK_SCALE = 4; // make landmarks bigger so they read across the big world
export const MOUND_RADIUS = 3; // the grassy den hill the mouse lives in (mouse-sized)
export const WORLD_RADIUS = 46 * OUTDOOR_SCALE; // how far you can roam before the edge

// Where the den entrance is (just south of the mound) and which way you
// face when you step outside.
export const SPAWN = { x: 0, z: MOUND_RADIUS + 1.4, facing: 0 };
export const DEN_ENTRANCE = { x: 0, z: MOUND_RADIUS - 0.2 };

// Each map place as a position (0..1 across the map) — converted below to
// world coordinates with HOME at the center (0,0).
const HOME = { nx: 0.444, ny: 0.678 };
const PLACES = [
  { name: "Aspen Forest", kind: "aspen", nx: 0.21, ny: 0.15 },
  { name: "Crossable Creek", kind: "creek", nx: 0.5, ny: 0.053 },
  { name: "Old Well", kind: "well", nx: 0.68, ny: 0.34 },
  { name: "Human House", kind: "house", nx: 0.88, ny: 0.15 },
  { name: "Pine Forest", kind: "pine", nx: 0.138, ny: 0.38 },
  { name: "Meadow", kind: "meadow", nx: 0.517, ny: 0.44 },
  { name: "Tall Grass", kind: "tallgrass", nx: 0.875, ny: 0.38 },
  { name: "Fallen Log", kind: "log", nx: 0.151, ny: 0.61 },
  { name: "Berry Bush", kind: "berry", nx: 0.853, ny: 0.615 },
  { name: "Wildflower Patch", kind: "wildflower", nx: 0.75, ny: 0.79 },
  { name: "Berry Bush", kind: "berry", nx: 0.147, ny: 0.822 },
];

const toWorld = (p) => ({
  x: (p.nx - HOME.nx) * WORLD_SCALE,
  z: (p.ny - HOME.ny) * WORLD_SCALE,
});

// ---- shared materials ----
const grassMat = new THREE.MeshStandardMaterial({ color: 0x6aa83f, roughness: 1, flatShading: true });
const darkGrassMat = new THREE.MeshStandardMaterial({ color: 0x3c5f26, roughness: 1, flatShading: true });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x5b4029, roughness: 1, flatShading: true });
const barkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1, flatShading: true });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8880, roughness: 1, flatShading: true });
const waterMat = new THREE.MeshStandardMaterial({ color: 0x3aa6d6, roughness: 0.4, flatShading: true });

// A floating name tag (same idea as in the den).
function makeLabel(text) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(20,16,12,0.8)";
  ctx.fillRect(0, 14, 256, 36);
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe6a8";
  ctx.fillText(text, 128, 33, 244);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, depthTest: true,
  }));
  sp.scale.set(4.2, 1.05, 1);
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
function buildPlace(kind) {
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
  } else if (kind === "house") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 6), new THREE.MeshStandardMaterial({ color: 0xcaa46a, roughness: 1, flatShading: true }));
    body.position.y = 2.5; body.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x8a4b32, roughness: 1, flatShading: true }));
    roof.rotation.y = Math.PI / 4; roof.position.y = 6.3;
    g.add(body, roof);
  } else if (kind === "tallgrass") {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, r = (i % 5) * 0.35;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.4 + (i % 3) * 0.4, 4), grassMat);
      blade.position.set(Math.cos(a) * r, 0.7, Math.sin(a) * r);
      g.add(blade);
    }
  } else if (kind === "log") {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 10), barkMat);
    log.rotation.z = Math.PI / 2; log.position.y = 0.7; log.castShadow = true;
    g.add(log);
  } else if (kind === "berry") {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshStandardMaterial({ color: 0x355f2a, roughness: 1, flatShading: true }));
    bush.position.y = 1.0; bush.castShadow = true; g.add(bush);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const berry = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0x7b2d5e, roughness: 0.8 }));
      berry.position.set(Math.cos(a) * 1.05, 1.0 + Math.sin(i) * 0.4, Math.sin(a) * 1.05);
      g.add(berry);
    }
  } else if (kind === "wildflower" || kind === "meadow") {
    const count = kind === "wildflower" ? 40 : 18;
    for (let i = 0; i < count; i++) {
      const a = i * 2.4, r = Math.sqrt(i) * 0.7;
      const f = makeFlower(flowerColors[i % flowerColors.length]);
      f.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      f.scale.setScalar(1 + (i % 3) * 0.4);
      g.add(f);
    }
  } else if (kind === "creek") {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(4, 16), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.y = 0.02;
    g.add(water);
  }
  return g;
}

// How high a landmark's name tag floats, by kind.
function labelHeight(kind) {
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

// We load each model file only ONCE and keep it here, then CLONE it for every
// copy in the world — so hundreds of trees stay fast.
const modelCache = {};
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
          if (mt && hasVertexColors) {
            mt.vertexColors = true;
            if (mt.color) mt.color.set(0xffffff);
            mt.needsUpdate = true;
          }
        });
      });
      // size it to about 6 units tall and stand it on the ground
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(m).getSize(size);
      m.scale.setScalar(6 / (size.y || 1));
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
  root.position.set(entry.x || 0, 0, entry.z || 0);
  root.rotation.y = entry.rot || 0;
  root.scale.setScalar(entry.scale || 1);
  root.userData.entry = entry;

  if (entry.modelUrl) {
    getBaseModel(entry.modelUrl).then((base) => {
      const m = base.clone(true); // a cheap copy of the shared model
      root.add(m);
      if (entry.textureHint) applyTextureHint(m, entry.textureHint);
    });
  } else {
    const lm = buildPlace(entry.kind);
    lm.scale.setScalar(LANDMARK_SCALE);
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

  // --- Big grassy ground ---
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 12, 64),
    grassMat
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // --- The den from outside: a grassy mound with a dark entrance ---
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(MOUND_RADIUS, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    darkGrassMat
  );
  mound.castShadow = true;
  group.add(mound);
  const door = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0x0a0705 })
  );
  door.position.set(0, 0.65, MOUND_RADIUS - 0.05);
  group.add(door);
  const denLabel = makeLabel("Home");
  denLabel.position.set(0, MOUND_RADIUS + 1.2, 0);
  group.add(denLabel);

  // --- Place everything from the layout ---
  const useLayout = layout && layout.length ? layout : DEFAULT_LAYOUT;
  const objects = [];
  for (const entry of useLayout) {
    const root = buildObject(entry);
    group.add(root);
    objects.push({ root, entry });
  }

  return { group, objects, ground };
}
