// ============================================================
//  WhiskerWood — DESIGNER EDITOR 🛠️
//  A free-fly editor for the game designer (not the player):
//   • fly anywhere above the map (no collision, floor-clamped)
//   • hover highlights any hand-placed asset; click selects it
//   • a properties panel + keybindings to move / scale / rotate /
//     rename / clone / delete
//   • a terrain tool that sculpts smooth mounds and dips
//   • an asset library for placing brand-new things
//  Saves straight into public/world-layout.json via /api/save-world.
// ============================================================

import * as THREE from "three";
import {
  buildOutside,
  buildObject,
  terrainHeight,
  setTerrainBumps,
  updateOutsideFX,
  WORLD_RADIUS,
} from "./outside.js";

// ---------- renderer / scene ----------
const canvas = document.getElementById("edit");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9d4f0);
scene.fog = new THREE.FogExp2(0xdfe9f2, 0.0003);
scene.add(new THREE.AmbientLight(0xffe9c4, 0.4));
const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x7a6a34, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffedbe, 2.2);
sun.position.set(180, 320, 140);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 9000);
window.addEventListener("resize", resize);
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
resize();

// ---------- fly camera ----------
const fly = { pos: new THREE.Vector3(0, 260, 340), yaw: Math.PI, pitch: -0.6 };
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));
window.addEventListener("blur", () => Object.keys(keys).forEach((k) => (keys[k] = false)));

let looking = false;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) looking = true; // right-drag always looks
});
window.addEventListener("mouseup", () => (looking = false, dragLook = false));
let dragLook = false; // left-drag on empty ground also looks

window.addEventListener("mousemove", (e) => {
  if (looking || dragLook) {
    fly.yaw -= e.movementX * 0.0032;
    fly.pitch = Math.max(-1.45, Math.min(1.35, fly.pitch - e.movementY * 0.0028));
  }
});
canvas.addEventListener("wheel", (e) => {
  // wheel = dolly along the view direction (zoom toward what you look at)
  const dir = lookDir();
  fly.pos.addScaledVector(dir, -e.deltaY * 0.6);
  e.preventDefault();
}, { passive: false });

function lookDir() {
  return new THREE.Vector3(
    Math.sin(fly.yaw) * Math.cos(fly.pitch),
    Math.sin(fly.pitch),
    Math.cos(fly.yaw) * Math.cos(fly.pitch)
  );
}

function typing() {
  const t = document.activeElement;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
}

function updateFly(dt) {
  if (typing()) return;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 340 : 110) * dt;
  const dir = lookDir();
  const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().negate(); // camera-right
  if (keys.KeyW) fly.pos.addScaledVector(dir, speed);
  if (keys.KeyS) fly.pos.addScaledVector(dir, -speed);
  if (keys.KeyA) fly.pos.addScaledVector(right, -speed);
  if (keys.KeyD) fly.pos.addScaledVector(right, speed);
  if (keys.KeyE) fly.pos.y += speed;
  if (keys.KeyQ) fly.pos.y -= speed;
  // the one rule: don't sink through the ground
  const floor = terrainHeight(fly.pos.x, fly.pos.z) + 1.5;
  if (fly.pos.y < floor) fly.pos.y = floor;
  camera.position.copy(fly.pos);
  camera.lookAt(fly.pos.clone().add(lookDir()));
}

// ---------- the world ----------
let entries = []; // the layout (the save file, live)
let worldGroup = null;
let ground = null;
let objects = []; // [{ root, entry }]
let bumpMarkers = []; // [{ root, entry }] for terrain bumps
const statusEl = document.getElementById("status");

function status(msg) {
  statusEl.textContent = msg;
  clearTimeout(status._t);
  status._t = setTimeout(() => (statusEl.textContent = ""), 3500);
}

function disposeWorld() {
  if (worldGroup) scene.remove(worldGroup);
  for (const m of bumpMarkers) scene.remove(m.root);
  bumpMarkers = [];
  worldGroup = null;
  objects = [];
}

const bumpMat = new THREE.MeshBasicMaterial({ color: 0x7ad07a, transparent: true, opacity: 0.3, depthWrite: false });
const digMat = new THREE.MeshBasicMaterial({ color: 0xd07a7a, transparent: true, opacity: 0.3, depthWrite: false });

function addBumpMarker(entry) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), entry.h >= 0 ? bumpMat : digMat);
  dome.scale.set(entry.r, Math.max(1.5, Math.abs(entry.h)), entry.r);
  dome.position.set(entry.x, terrainHeight(entry.x, entry.z) + (entry.h < 0 ? 0.3 : 0), entry.z);
  scene.add(dome);
  bumpMarkers.push({ root: dome, entry });
  return dome;
}

function buildWorld() {
  disposeWorld();
  const built = buildOutside(entries);
  worldGroup = built.group;
  ground = built.ground;
  objects = built.objects;
  scene.add(worldGroup);
  for (const e of entries) if (e.kind === "bump") addBumpMarker(e);
  status(`world built — ${objects.length} assets, ${bumpMarkers.length} terrain bumps`);
}

fetch("/world-layout.json")
  .then((r) => (r.ok ? r.json() : []))
  .then((saved) => {
    entries = Array.isArray(saved) && saved.length ? saved : [];
    buildWorld();
  })
  .catch(() => buildWorld());

// ---------- selection ----------
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
let hovered = null; // {root, entry}
let selected = null;
const hoverBox = new THREE.Box3Helper(new THREE.Box3(), 0xffe23a);
hoverBox.visible = false;
scene.add(hoverBox);
const selBox = new THREE.Box3Helper(new THREE.Box3(), 0xff8c2a);
selBox.visible = false;
scene.add(selBox);

// faint boxes around EVERY hand-placed asset (toggle with the ▦ button / B)
let allBoxes = [];
let boxesOn = false;
function setAllBoxes(on) {
  boxesOn = on;
  for (const b of allBoxes) scene.remove(b);
  allBoxes = [];
  if (!on) return;
  for (const o of objects) {
    const box = new THREE.Box3().setFromObject(o.root);
    if (box.isEmpty()) continue;
    const h = new THREE.Box3Helper(box, 0x88aa66);
    scene.add(h);
    allBoxes.push(h);
  }
}

function pickables() {
  return objects.map((o) => o.root).concat(bumpMarkers.map((b) => b.root));
}
function itemForObject(obj) {
  let n = obj;
  while (n) {
    const hit = objects.find((o) => o.root === n) || bumpMarkers.find((b) => b.root === n);
    if (hit) return hit;
    n = n.parent;
  }
  return null;
}

let lastHoverAt = 0;
window.addEventListener("mousemove", (e) => {
  mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  const now = performance.now();
  if (now - lastHoverAt < 40 || looking || dragLook) return;
  lastHoverAt = now;
  raycaster.setFromCamera(mouseNDC, camera);
  const hits = raycaster.intersectObjects(pickables(), true);
  hovered = hits.length ? itemForObject(hits[0].object) : null;
  if (hovered && hovered !== selected) {
    hoverBox.box.setFromObject(hovered.root);
    hoverBox.visible = !hoverBox.box.isEmpty();
  } else {
    hoverBox.visible = false;
  }
  canvas.style.cursor = hovered ? "pointer" : mode === "terrain" ? "crosshair" : "default";
});

// click vs drag: only a still click selects
let downAt = null;
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  downAt = { x: e.clientX, y: e.clientY };
  // left-drag on empty ground = look around
  raycaster.setFromCamera(
    new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
    camera
  );
  const overAsset = raycaster.intersectObjects(pickables(), true).length > 0;
  if (!overAsset && mode === "select" && !placing) dragLook = true;
});
canvas.addEventListener("mouseup", (e) => {
  if (e.button !== 0 || !downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 5) return; // it was a drag, not a click
  onClick(e);
});

function groundPoint(e) {
  raycaster.setFromCamera(
    new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
    camera
  );
  if (!ground) return null;
  const hits = raycaster.intersectObject(ground, false);
  return hits.length ? hits[0].point : null;
}

function onClick(e) {
  if (placing) return placeAt(e);
  if (mode === "terrain") return sculptAt(e);
  raycaster.setFromCamera(mouseNDC, camera);
  const hits = raycaster.intersectObjects(pickables(), true);
  select(hits.length ? itemForObject(hits[0].object) : null);
}

function select(item) {
  selected = item;
  if (!selected) {
    selBox.visible = false;
    propsEl.style.display = "none";
    return;
  }
  refreshSelBox();
  fillProps();
  propsEl.style.display = "block";
}

function refreshSelBox() {
  if (!selected) return;
  selBox.box.setFromObject(selected.root);
  selBox.visible = !selBox.box.isEmpty();
}

// ---------- properties panel ----------
const propsEl = document.getElementById("props");
const pTitle = document.getElementById("p-title");
const pName = document.getElementById("p-name");
const pX = document.getElementById("p-x");
const pZ = document.getElementById("p-z");
const pY = document.getElementById("p-y");
const pRot = document.getElementById("p-rot");
const pScale = document.getElementById("p-scale");
const pRadius = document.getElementById("p-radius");
const pHeight = document.getElementById("p-height");
const pDims = document.getElementById("p-dims");

function isBump(item) {
  return item && item.entry.kind === "bump";
}

function fillProps() {
  const e = selected.entry;
  const bump = isBump(selected);
  pTitle.textContent = bump
    ? "⛰ Terrain " + (e.h >= 0 ? "mound" : "dip")
    : e.name || (e.modelUrl ? e.modelUrl.split("/").pop() : e.kind);
  pName.value = e.name || "";
  pX.value = (e.x || 0).toFixed(1);
  pZ.value = (e.z || 0).toFixed(1);
  pY.value = (e.yOff || 0).toFixed(1);
  pRot.value = Math.round(((e.rot || 0) * 180) / Math.PI);
  pScale.value = (e.scale || 1).toFixed(2);
  pRadius.value = e.r || 0;
  pHeight.value = e.h || 0;
  document.querySelectorAll(".bump-only").forEach((el) => (el.style.display = bump ? "flex" : "none"));
  pName.parentElement.style.display = bump ? "none" : "flex";
  pRot.parentElement.style.display = bump ? "none" : "flex";
  pScale.parentElement.style.display = bump ? "none" : "flex";
  pY.parentElement.style.display = bump ? "none" : "flex";
  const size = new THREE.Box3().setFromObject(selected.root).getSize(new THREE.Vector3());
  pDims.textContent = bump
    ? "smooth terrain — rebuild to see it settle"
    : `size: ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)}`;
}

function applyTransform() {
  if (!selected) return;
  const e = selected.entry;
  if (isBump(selected)) {
    selected.root.position.set(e.x, terrainHeight(e.x, e.z) + (e.h < 0 ? 0.3 : 0), e.z);
    selected.root.scale.set(e.r, Math.max(1.5, Math.abs(e.h)), e.r);
    selected.root.material = e.h >= 0 ? bumpMat : digMat;
  } else {
    selected.root.position.set(e.x, terrainHeight(e.x, e.z) + (e.yOff || 0), e.z);
    selected.root.rotation.y = e.rot || 0;
    selected.root.scale.setScalar(e.scale || 1);
  }
  refreshSelBox();
}

for (const [input, apply] of [
  [pX, (e, v) => (e.x = v)],
  [pZ, (e, v) => (e.z = v)],
  [pY, (e, v) => (e.yOff = v)],
  [pRot, (e, v) => (e.rot = (v * Math.PI) / 180)],
  [pScale, (e, v) => (e.scale = Math.max(0.05, v))],
  [pRadius, (e, v) => (e.r = Math.max(4, v))],
  [pHeight, (e, v) => (e.h = v)],
]) {
  input.addEventListener("input", () => {
    if (!selected) return;
    const v = parseFloat(input.value);
    if (Number.isNaN(v)) return;
    apply(selected.entry, v);
    applyTransform();
  });
}
pName.addEventListener("change", () => {
  if (!selected || isBump(selected)) return;
  selected.entry.name = pName.value.trim();
  rebuildOne(selected); // labels are baked into the object, so remake it
});

// remake one object in place (rename / heavy edits)
function rebuildOne(item) {
  const e = item.entry;
  worldGroup.remove(item.root);
  const root = buildObject(e);
  worldGroup.add(root);
  item.root = root;
  if (selected === item) {
    setTimeout(refreshSelBox, 400); // async models settle in
    refreshSelBox();
  }
}

// ---------- keybindings ----------
let idCounter = Date.now() % 100000;
function freshId(prefix) {
  return prefix + (idCounter++).toString(36);
}

function cloneSelected() {
  if (!selected) return;
  const src = selected.entry;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = freshId(isBump(selected) ? "bump" : "e");
  const size = new THREE.Box3().setFromObject(selected.root).getSize(new THREE.Vector3());
  const off = Math.max(2.5, Math.max(size.x, size.z) * 0.7) * (src.scale || 1);
  copy.x = (copy.x || 0) + off;
  copy.z = (copy.z || 0) + off * 0.6;
  entries.push(copy);
  let item;
  if (copy.kind === "bump") {
    item = { root: addBumpMarker(copy), entry: copy };
  } else {
    const root = buildObject(copy);
    worldGroup.add(root);
    item = { root, entry: copy };
    objects.push(item);
  }
  select(item);
  status("cloned → nudge it into place with the arrow keys");
}

function deleteSelected() {
  if (!selected) return;
  const e = selected.entry;
  entries = entries.filter((x) => x !== e);
  if (isBump(selected)) {
    scene.remove(selected.root);
    bumpMarkers = bumpMarkers.filter((b) => b !== selected);
    status("terrain bump removed — Rebuild world to smooth it out");
  } else {
    worldGroup.remove(selected.root);
    objects = objects.filter((o) => o !== selected);
    status("deleted");
  }
  select(null);
}

window.addEventListener("keydown", (e) => {
  if (typing()) return;
  if (e.code === "Escape") {
    if (placing) return setPlacing(null);
    return select(null);
  }
  if (e.code === "KeyB") return setAllBoxes(!boxesOn);
  if ((e.metaKey || e.ctrlKey) && e.code === "KeyD") {
    e.preventDefault();
    return cloneSelected();
  }
  if (!selected) return;
  const step = e.shiftKey ? 5 : e.altKey ? 0.2 : 1;
  const ent = selected.entry;
  let handled = true;
  switch (e.code) {
    case "ArrowLeft": ent.x = (ent.x || 0) - step; break;
    case "ArrowRight": ent.x = (ent.x || 0) + step; break;
    case "ArrowUp": ent.z = (ent.z || 0) - step; break;
    case "ArrowDown": ent.z = (ent.z || 0) + step; break;
    case "KeyR": if (isBump(selected)) ent.h = (ent.h || 0) + step; else ent.yOff = (ent.yOff || 0) + step * 0.5; break;
    case "KeyF": if (isBump(selected)) ent.h = (ent.h || 0) - step; else ent.yOff = (ent.yOff || 0) - step * 0.5; break;
    case "Equal": case "NumpadAdd":
      if (isBump(selected)) ent.r = Math.max(4, (ent.r || 10) * 1.12);
      else ent.scale = Math.min(30, (ent.scale || 1) * 1.12);
      break;
    case "Minus": case "NumpadSubtract":
      if (isBump(selected)) ent.r = Math.max(4, (ent.r || 10) / 1.12);
      else ent.scale = Math.max(0.05, (ent.scale || 1) / 1.12);
      break;
    case "BracketLeft": ent.rot = (ent.rot || 0) - 0.2; break;
    case "BracketRight": ent.rot = (ent.rot || 0) + 0.2; break;
    case "KeyG": ent.yOff = 0; break;
    case "Delete": case "Backspace": return deleteSelected();
    default: handled = false;
  }
  if (handled) {
    e.preventDefault();
    applyTransform();
    fillProps();
  }
});

document.getElementById("clone-b").addEventListener("click", cloneSelected);
document.getElementById("delete-b").addEventListener("click", deleteSelected);
document.getElementById("focus-b").addEventListener("click", () => {
  if (!selected) return;
  const p = selected.root.position;
  fly.pos.set(p.x + 24, p.y + 20, p.z + 24);
  fly.yaw = Math.atan2(p.x - fly.pos.x, p.z - fly.pos.z);
  fly.pitch = -0.5;
});

// ---------- modes: select / terrain ----------
let mode = "select";
const selBtn = document.getElementById("tool-select");
const terBtn = document.getElementById("tool-terrain");
function setMode(m) {
  mode = m;
  selBtn.classList.toggle("on", m === "select");
  terBtn.classList.toggle("on", m === "terrain");
  setPlacing(null);
}
selBtn.addEventListener("click", () => setMode("select"));
terBtn.addEventListener("click", () => setMode("terrain"));

function sculptAt(e) {
  const p = groundPoint(e);
  if (!p) return;
  const entry = { id: freshId("bump"), kind: "bump", x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, r: 26, h: e.altKey ? -5 : 6 };
  entries.push(entry);
  const item = { root: addBumpMarker(entry), entry };
  select(item);
  status(e.altKey ? "dip painted — Rebuild world to dig it" : "mound painted — Rebuild world to raise it");
}

// ---------- asset library ----------
const LIBRARY = [
  ["Landmarks", [
    ["🌳 Aspen grove", { kind: "aspen", name: "Aspen Forest" }],
    ["🌲 Pine grove", { kind: "pine", name: "Pine Forest" }],
    ["🌼 Meadow", { kind: "meadow", name: "Meadow" }],
    ["🌸 Wildflowers", { kind: "wildflower", name: "Wildflower Patch" }],
    ["🍇 Berry bush", { kind: "berry", name: "Berry Bush" }],
    ["🌾 Tall grass", { kind: "tallgrass", name: "Tall Grass" }],
    ["🪵 Hollow log", { kind: "log", name: "Fallen Log" }],
    ["💧 Old well", { kind: "well", name: "Old Well" }],
    ["🎓 School", { kind: "school", name: "Fallen Log School" }],
  ]],
  ["Trees", [
    ["Common tree 1", { modelUrl: "/models/nature/CommonTree_1.gltf" }],
    ["Common tree 2", { modelUrl: "/models/nature/CommonTree_2.gltf" }],
    ["Common tree 3", { modelUrl: "/models/nature/CommonTree_3.gltf" }],
    ["Common tree 4", { modelUrl: "/models/nature/CommonTree_4.gltf" }],
    ["Pine 2", { modelUrl: "/models/nature/Pine_2.gltf" }],
    ["Pine 4", { modelUrl: "/models/nature/Pine_4.gltf" }],
    ["Pine 5", { modelUrl: "/models/nature/Pine_5.gltf" }],
    ["Twisted tree", { modelUrl: "/models/nature/TwistedTree_1.gltf" }],
  ]],
  ["Plants", [
    ["Bush", { modelUrl: "/models/nature/Bush_Common.gltf" }],
    ["Flowering bush", { modelUrl: "/models/nature/Bush_Common_Flowers.gltf" }],
    ["Tall wispy grass", { modelUrl: "/models/nature/Grass_Wispy_Tall.gltf" }],
    ["Short grass", { modelUrl: "/models/nature/Grass_Common_Short.gltf" }],
    ["Clover 1", { modelUrl: "/models/nature/Clover_1.gltf" }],
    ["Clover 2", { modelUrl: "/models/nature/Clover_2.gltf" }],
    ["Plant", { modelUrl: "/models/nature/Plant_1.gltf" }],
    ["Big plant", { modelUrl: "/models/nature/Plant_7_Big.gltf" }],
    ["Pebble", { modelUrl: "/models/nature/Pebble_Round_3.gltf" }],
  ]],
  ["Flowers", [
    ["🌺 Flower single", { modelUrl: "/models/flowers/flower_single.glb" }],
    ["🌷 Rayden bloom", { modelUrl: "/models/flowers/flower_rayden.glb" }],
    ["🔔 Bell flower", { modelUrl: "/models/flowers/bell_flower.glb" }],
  ]],
  ["Props & rocks", [
    ["💎 Moonstone crystal", { modelUrl: "/models/props/crystal.glb" }],
    ["🪨 Big rock A", { modelUrl: "/models/kenney/rock_largeA.glb" }],
    ["🪨 Big rock B", { modelUrl: "/models/kenney/rock_largeB.glb" }],
    ["🪨 Big rock C", { modelUrl: "/models/kenney/rock_largeC.glb" }],
  ]],
];

let placing = null; // template entry being placed
let placingBtn = null;
const libScroll = document.getElementById("lib-scroll");
for (const [cat, items] of LIBRARY) {
  const h = document.createElement("div");
  h.className = "lib-cat";
  h.textContent = cat;
  libScroll.appendChild(h);
  for (const [label, tpl] of items) {
    const b = document.createElement("button");
    b.className = "lib-item";
    b.textContent = label;
    b.addEventListener("click", () => setPlacing(placing === tpl ? null : tpl, b));
    libScroll.appendChild(b);
  }
}
function setPlacing(tpl, btn = null) {
  placing = tpl;
  if (placingBtn) placingBtn.classList.remove("placing");
  placingBtn = tpl ? btn : null;
  if (placingBtn) placingBtn.classList.add("placing");
  canvas.style.cursor = tpl ? "copy" : "default";
  if (tpl) status("click the ground to place it (Esc to stop)");
}
function placeAt(e) {
  const p = groundPoint(e);
  if (!p || !placing) return;
  const entry = {
    id: freshId("e"),
    ...JSON.parse(JSON.stringify(placing)),
    x: Math.round(p.x * 10) / 10,
    z: Math.round(p.z * 10) / 10,
    rot: 0,
    scale: 1,
  };
  if (entry.modelUrl && !entry.name) entry.noLabel = true; // scatter props stay quiet
  entries.push(entry);
  const root = buildObject(entry);
  worldGroup.add(root);
  const item = { root, entry };
  objects.push(item);
  select(item);
  status("placed — arrows to nudge, +/− to size, Esc when happy");
}

// ---------- toolbar ----------
document.getElementById("toggle-boxes").addEventListener("click", () => setAllBoxes(!boxesOn));
document.getElementById("rebuild").addEventListener("click", () => {
  select(null);
  setAllBoxes(false);
  buildWorld();
});
document.getElementById("save").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/save-world", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });
    status(res.ok ? "💾 saved! (players see it after a refresh)" : "save failed: " + res.status);
  } catch (err) {
    status("save failed: " + err.message);
  }
});

// ---------- frame loop ----------
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateFly(dt);
  // keep the little world alive (wind, water, animals near the camera)
  updateOutsideFX(clock.elapsedTime, camera.position);
  renderer.render(scene, camera);
}
tick();
