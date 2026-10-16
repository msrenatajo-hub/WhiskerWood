// ============================================================
//  WhiskerWood — WORLD EDITOR 🌿🗺️
//  A top-down map view of the outdoors. Drag things to move them,
//  upload your own 3D models, then Save straight into the game.
// ============================================================

import * as THREE from "three";
import { buildOutside, buildObject, DEFAULT_LAYOUT, WORLD_RADIUS } from "./outside.js";
import { gunzipSync } from "three/addons/libs/fflate.module.js";

// ---- scene, renderer, lights ----
const canvas = document.getElementById("edit");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ef);
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
sun.position.set(120, 400, 120);
scene.add(sun);

// ---- top-down camera (like looking at a map) ----
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
const camTarget = new THREE.Vector3(40, 0, -150); // center of the view (pan)
let viewSize = 620; // half-height of the view in world units (zoom)

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  updateCamera();
}
function updateCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  cam.left = -viewSize * aspect;
  cam.right = viewSize * aspect;
  cam.top = viewSize;
  cam.bottom = -viewSize;
  cam.position.set(camTarget.x, 800, camTarget.z);
  cam.up.set(0, 0, -1); // north (-Z) points up on screen
  cam.lookAt(camTarget.x, 0, camTarget.z);
  cam.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---- selection ring ----
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.92, 1, 40),
  new THREE.MeshBasicMaterial({ color: 0xffe23a, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.2;
ring.visible = false;
scene.add(ring);

// ---- the world ----
let objects = []; // [{ root, entry }]
const rootToItem = new Map();
let selected = null;

function addItem(item) {
  objects.push(item);
  rootToItem.set(item.root, item);
}

function buildWorld(layout) {
  const built = buildOutside(layout);
  scene.add(built.group);
  worldGroup = built.group;
  objects = built.objects;
  rootToItem.clear();
  for (const o of objects) rootToItem.set(o.root, o);
}
let worldGroup = null;

fetch("/world-layout.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((saved) => {
    const layout = saved && saved.length ? saved : DEFAULT_LAYOUT.map((e) => ({ ...e }));
    buildWorld(layout);
  })
  .catch(() => buildWorld(DEFAULT_LAYOUT.map((e) => ({ ...e }))));

// ---- picking helpers ----
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tmp = new THREE.Vector3();

function ndc(e) {
  return {
    x: (e.clientX / window.innerWidth) * 2 - 1,
    y: -(e.clientY / window.innerHeight) * 2 + 1,
  };
}
function groundAt(e) {
  raycaster.setFromCamera(ndc(e), cam);
  const hit = new THREE.Vector3();
  raycaster.ray.intersectPlane(groundPlane, hit);
  return hit;
}
function objectAt(e) {
  raycaster.setFromCamera(ndc(e), cam);
  const roots = objects.map((o) => o.root);
  const hits = raycaster.intersectObjects(roots, true);
  if (!hits.length) return null;
  // climb up to the object root we know about
  let o = hits[0].object;
  while (o && !rootToItem.has(o)) o = o.parent;
  return o ? rootToItem.get(o) : null;
}

// ---- 🤝 the Claude bridge: post selection + pins so Claude can see ----
let pins = []; // [{...entry snapshot}]
let postTimer = null;

function snapshot(item) {
  return {
    ...item.entry,
    x: +item.root.position.x.toFixed(2),
    z: +item.root.position.z.toFixed(2),
    rot: +item.root.rotation.y.toFixed(3),
    scale: +item.root.scale.x.toFixed(3),
  };
}

function postState(action) {
  clearTimeout(postTimer);
  postTimer = setTimeout(() => {
    fetch("/api/editor-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          at: new Date().toISOString(),
          action,
          selected: selected ? snapshot(selected) : null,
          pins,
        },
        null,
        2
      ),
    }).catch(() => {});
  }, 150);
}

function refreshPinList() {
  const el = document.getElementById("pin-list");
  el.textContent = pins.length
    ? "📌 " + pins.map((p) => p.name || p.id).join(", ")
    : "";
}

// ---- selection visuals ----
function select(item) {
  selected = item;
  const has = !!item;
  for (const id of ["bigger", "smaller", "rotate", "delete"]) {
    document.getElementById(id).disabled = !has;
  }
  document.getElementById("sel-name").textContent = has
    ? "Selected: " + (item.entry.name || item.entry.id || "model")
    : "";
  document.getElementById("pin").disabled = !has;
  updateRing();
  postState("select");
}
function updateRing() {
  if (!selected) {
    ring.visible = false;
    return;
  }
  const box = new THREE.Box3().setFromObject(selected.root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const r = Math.max(size.x, size.z) / 2 + 3;
  ring.scale.set(r, r, r);
  ring.position.set(selected.root.position.x, 0.2, selected.root.position.z);
  ring.visible = true;
}

// ---- mouse interaction: drag objects, pan, zoom ----
let mode = null; // "object" | "pan"
let dragOffset = new THREE.Vector3();
let panGrab = new THREE.Vector3();

canvas.addEventListener("pointerdown", (e) => {
  const item = objectAt(e);
  if (item) {
    select(item);
    mode = "object";
    const g = groundAt(e);
    dragOffset.set(
      item.root.position.x - g.x,
      0,
      item.root.position.z - g.z
    );
  } else {
    select(null);
    mode = "pan";
    panGrab.copy(groundAt(e));
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (mode === "object" && selected) {
    const g = groundAt(e);
    selected.root.position.x = g.x + dragOffset.x;
    selected.root.position.z = g.z + dragOffset.z;
    updateRing();
  } else if (mode === "pan") {
    const g = groundAt(e);
    camTarget.x += panGrab.x - g.x; // keep the grabbed spot under the cursor
    camTarget.z += panGrab.z - g.z;
    updateCamera();
  }
});

canvas.addEventListener("pointerup", () => {
  if (mode === "object" && selected) postState("move");
  mode = null;
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    viewSize *= 1 + e.deltaY * 0.0012;
    viewSize = Math.max(25, Math.min(1600, viewSize));
    updateCamera();
  },
  { passive: false }
);

// ---- toolbar buttons ----
const statusEl = document.getElementById("status");

document.getElementById("bigger").onclick = () => {
  if (selected) {
    selected.root.scale.multiplyScalar(1.2);
    updateRing();
    postState("scale");
  }
};
document.getElementById("smaller").onclick = () => {
  if (selected) {
    selected.root.scale.multiplyScalar(1 / 1.2);
    updateRing();
    postState("scale");
  }
};
document.getElementById("rotate").onclick = () => {
  if (selected) {
    selected.root.rotation.y += Math.PI / 8;
    postState("rotate");
  }
};
document.getElementById("pin").onclick = () => {
  if (!selected) return;
  const id = selected.entry.id;
  const already = pins.findIndex((p) => p.id === id);
  if (already >= 0) pins.splice(already, 1);
  else pins.push(snapshot(selected));
  refreshPinList();
  postState("pin");
};
document.getElementById("delete").onclick = () => deleteSelected();
window.addEventListener("keydown", (e) => {
  if ((e.key === "Delete" || e.key === "Backspace") && selected) deleteSelected();
});
function deleteSelected() {
  if (!selected) return;
  const gone = snapshot(selected);
  worldGroup.remove(selected.root);
  objects = objects.filter((o) => o !== selected);
  rootToItem.delete(selected.root);
  select(null);
  pins = pins.filter((p) => p.id !== gone.id);
  refreshPinList();
  postState("delete:" + (gone.name || gone.id));
}

// ---- upload models (a single file, OR a whole .unitypackage) ----
let uploadCount = 0;

// Send raw bytes to the server, return the saved URL.
async function uploadBytes(filename, bytes) {
  const res = await fetch("/api/upload-model?name=" + encodeURIComponent(filename), {
    method: "POST",
    body: bytes,
  });
  const data = await res.json();
  if (!data.ok) throw new Error("upload failed");
  return data.url;
}

// Send model bytes to the server and drop the model into the world.
async function uploadAndPlace(filename, bytes, idx = 0, textureHint = null) {
  const url = await uploadBytes(filename, bytes);
  const entry = {
    id: "up" + ++uploadCount + "_" + filename.replace(/\W/g, ""),
    modelUrl: url,
    name: filename.replace(/\.(glb|gltf|fbx|obj)$/i, ""),
    x: Math.round(camTarget.x + (idx % 4) * 14), // fan several out so they don't stack
    z: Math.round(camTarget.z + Math.floor(idx / 4) * 14),
    rot: 0,
    scale: 1,
  };
  if (textureHint) entry.textureHint = textureHint;
  const root = buildObject(entry);
  worldGroup.add(root);
  const item = { root, entry };
  addItem(item);
  select(item);
  return entry.name;
}

// Pick the most likely texture for a model (by matching names, then common
// "base color" texture names, then just the first one).
function pickTexture(modelName, texList) {
  if (!texList.length) return null;
  const mn = modelName.toLowerCase().replace(/\.[^.]+$/, "");
  let t = texList.find((x) => {
    const b = x.base.toLowerCase().replace(/\.[^.]+$/, "");
    return b.includes(mn) || mn.includes(b);
  });
  if (t) return t.url;
  t = texList.find((x) => /albedo|diffuse|basecolor|base_color|_col|_color|main|tex/i.test(x.base));
  if (t) return t.url;
  return texList[0].url;
}

// Dig the model files (.fbx/.obj/.glb/.gltf) out of a .unitypackage. A
// unitypackage is a gzipped tar; each asset lives in a <guid>/ folder with
// an "asset" (the bytes) and a "pathname" (its original name).
function extractModelsFromUnitypackage(tarBytes) {
  const td = new TextDecoder();
  const files = {};
  let off = 0;
  while (off + 512 <= tarBytes.length) {
    const h = tarBytes.subarray(off, off + 512);
    const name = td.decode(h.subarray(0, 100)).replace(/\0.*$/, "").trim();
    if (!name) break; // end of archive
    const size = parseInt(td.decode(h.subarray(124, 136)).replace(/[^0-7]/g, ""), 8) || 0;
    off += 512;
    if (size > 0) {
      files[name] = tarBytes.subarray(off, off + size);
      off += Math.ceil(size / 512) * 512;
    }
  }
  // group entries by their <guid> folder
  const guids = {};
  for (const name in files) {
    const clean = name.replace(/^\.\//, "");
    const slash = clean.indexOf("/");
    if (slash < 0) continue;
    const guid = clean.slice(0, slash);
    (guids[guid] = guids[guid] || {})[clean.slice(slash + 1)] = files[name];
  }
  const models = [];
  const textures = [];
  const usedNames = {};
  const MODEL_EXT = ["fbx", "obj", "glb", "gltf"];
  const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "bmp"];
  for (const guid in guids) {
    const g = guids[guid];
    if (!g.asset || !g.pathname) continue;
    const pathname = td.decode(g.pathname).split(/[\r\n]/)[0].trim();
    const ext = (pathname.split(".").pop() || "").toLowerCase();
    let base = pathname.split("/").pop();
    if (usedNames[base]) base = guid.slice(0, 6) + "_" + base; // avoid clashes
    if (MODEL_EXT.includes(ext)) {
      usedNames[base] = true;
      models.push({ filename: base, data: g.asset.slice() });
    } else if (IMAGE_EXT.includes(ext)) {
      usedNames[base] = true;
      textures.push({ filename: base, data: g.asset.slice() });
    }
  }
  return { models, textures };
}

document.getElementById("upload").onclick = () =>
  document.getElementById("file").click();

document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (/\.unitypackage$/i.test(file.name)) {
    // --- a whole Unity package: unzip it and pull out the models ---
    statusEl.textContent = "Unpacking " + file.name + "…";
    try {
      const gz = new Uint8Array(await file.arrayBuffer());
      const tar = gunzipSync(gz);
      const { models, textures } = extractModelsFromUnitypackage(tar);
      if (!models.length) {
        statusEl.textContent = "No .fbx/.obj/.glb models inside (only Unity-only files).";
      } else {
        // upload textures FIRST so the models can find them by name
        const texList = [];
        for (const t of textures) {
          try {
            const url = await uploadBytes(t.filename, t.data);
            texList.push({ base: t.filename, url });
          } catch {}
        }
        let i = 0;
        for (const m of models) {
          await uploadAndPlace(m.filename, m.data, i++, pickTexture(m.filename, texList));
        }
        const tn = texList.length ? `, ${texList.length} texture${texList.length > 1 ? "s" : ""}` : "";
        statusEl.textContent = `✅ Pulled ${models.length} model${models.length > 1 ? "s" : ""}${tn} out of the package!`;
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "❌ Couldn't read that .unitypackage";
    }
  } else {
    // --- a single model file ---
    statusEl.textContent = "Uploading…";
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const name = await uploadAndPlace(file.name, bytes);
      statusEl.textContent = "✅ Added " + name + " — drag it where you want!";
    } catch {
      statusEl.textContent = "❌ Upload failed";
    }
  }
  e.target.value = "";
};

// ---- save the layout into the game ----
document.getElementById("save").onclick = async () => {
  statusEl.textContent = "Saving…";
  // read each object's current spot back into its entry
  const layout = objects.map(({ root, entry }) => ({
    ...entry,
    x: +root.position.x.toFixed(2),
    z: +root.position.z.toFixed(2),
    rot: +root.rotation.y.toFixed(3),
    scale: +root.scale.x.toFixed(3),
  }));
  try {
    const r = await fetch("/api/save-world", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layout, null, 2),
    });
    statusEl.textContent = r.ok ? "✅ Saved! It's in the game now." : "❌ Save failed";
  } catch {
    statusEl.textContent = "❌ Save failed (is the dev server running?)";
  }
};

// ---- go ----
resize();
(function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, cam);
})();
