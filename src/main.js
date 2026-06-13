// ============================================================
//  WhiskerWood — a low-poly mouse life simulator 🐭
//  This file builds the den and lets you control the mouse.
// ============================================================

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RECIPES } from "./recipes.js";
import {
  buildOutside,
  MOUND_RADIUS,
  WORLD_RADIUS,
  SPAWN,
  DEN_ENTRANCE,
} from "./outside.js";

// ------------------------------------------------------------
//  ⚙️  SETTINGS YOU CAN PLAY WITH
//  (change these numbers and the game changes!)
// ------------------------------------------------------------
const DEN_RADIUS = 7.5; // how wide the round room is
const WALL_HEIGHT = 5; // how tall the dirt walls are
const CEILING_RISE = 2.2; // how much the dome ceiling arches up in the middle
const MOUSE_HEIGHT = 0.45; // how tall your mouse is on all fours
const STAND_HEIGHT = 0.85; // how tall your mouse is when standing up
const WALK_SPEED = 5; // how fast the mouse walks
const TURN_SPEED = 2.6; // how fast the mouse spins when turning
const SPRINT_MULT = 6; // how much faster sprinting is than walking
const SPRINT_MAX = 15; // seconds of sprint before it wears off
const SPRINT_RECHARGE = 0.7; // how fast sprint refills when you're not sprinting
const JUMP_STRENGTH = 3.4; // how high the mouse jumps
const GRAVITY = 6.5; // how fast it falls (lower = slower, floatier jump)
const STAND_SPEED = 3.6; // how fast it stands up to look at the sky
const MOUSE_BODY_RADIUS = 0.3; // how "wide" the mouse is for bumping into things
const CRAFT_PROMPT_RADIUS = 1.9; // how close to the stump before "press E" shows
const GRAB_RANGE = 1.1; // how close the mouse must be to grab an item
const BITE_TIME = 0.32; // how long the little "bite down" animation lasts

// If your mouse ends up walking sideways or backward, change these.
// Try 0, Math.PI, Math.PI / 2, or -Math.PI / 2.
const MODEL_FACING_FIX = 0; // for the walking (all-fours) mouse
const STAND_FACING_FIX = 0; // for the standing mouse

// Nice earthy colors for our den
const COLORS = {
  floor: 0x6b4f3a, // packed dirt floor
  wall: 0x4a3525, // darker dirt walls
  stump: 0x7a5230, // tree stump (crafting table later)
  stumpTop: 0xa9763f, // lighter top of the stump
  hollow: 0x140d08, // the dark insides of the storage holes
  sky: 0x0b0a08, // the darkness above the den
};

// ------------------------------------------------------------
//  🖥️  THE BASICS: scene, camera, renderer
// ------------------------------------------------------------

// The scene is the "world" that holds everything.
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
// Fog makes faraway things fade into darkness — feels like a burrow.
scene.fog = new THREE.Fog(COLORS.sky, 8, 22);

// The camera is your "eye". This one sees in perspective (like real eyes).
const camera = new THREE.PerspectiveCamera(
  55, // field of view (how wide you see)
  window.innerWidth / window.innerHeight, // screen shape
  0.1, // closest visible distance
  3000 // farthest visible distance (big, for the large outdoors)
);

// The renderer draws the scene onto the <canvas>.
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Filmic tone-mapping = bright, vivid, "stylized render" colors.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ------------------------------------------------------------
//  💡  LIGHTING — warm, cozy, like a hole in the ground
// ------------------------------------------------------------

// Soft fill light so nothing is pure black. (a touch brighter for the
// new filmic tone-mapping, which darkens midtones)
const ambientLight = new THREE.AmbientLight(0xffe9c4, 0.7);
scene.add(ambientLight);

// A warm glow, like daylight spilling in from the den entrance above.
const sunLight = new THREE.DirectionalLight(0xffd9a0, 1.4);
sunLight.position.set(3, 9, 4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 30;
sunLight.shadow.camera.left = -DEN_RADIUS;
sunLight.shadow.camera.right = DEN_RADIUS;
sunLight.shadow.camera.top = DEN_RADIUS;
sunLight.shadow.camera.bottom = -DEN_RADIUS;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight.target);

// Sky/ground light — blue from above, green bounce from below. Off in the
// den, bright outside, for that lush sunny-forest look.
const hemiLight = new THREE.HemisphereLight(0xbfe6ff, 0x5c7a36, 0);
scene.add(hemiLight);

// ------------------------------------------------------------
//  🌍  TWO PLACES: inside the den, and the outdoors.
//  Everything in the den goes in denGroup; everything outside goes in
//  outsideGroup. We just show one at a time.
// ------------------------------------------------------------
const denGroup = new THREE.Group();
const outsideGroup = new THREE.Group();
outsideGroup.visible = false; // start inside the den
scene.add(denGroup, outsideGroup);

// ------------------------------------------------------------
//  🏠  BUILD THE DEN (floor + walls)
// ------------------------------------------------------------

// --- Make a realistic DIRT texture by painting it with code ---
// We draw a base brown, then scatter thousands of light/dark specks
// and a few little pebbles, so it looks like real packed earth.
function makeDirtTexture(baseColor) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // tiny grains of dirt (light and dark flecks)
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6 + 0.3;
    const a = Math.random() * 0.22 + 0.04;
    ctx.fillStyle =
      Math.random() > 0.5 ? `rgba(255,232,196,${a})` : `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // a few small pebbles
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3 + 1.5;
    const g = (90 + Math.random() * 50) | 0;
    ctx.fillStyle = `rgba(${g},${(g * 0.8) | 0},${(g * 0.6) | 0},0.55)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// One texture for the floor (lighter) and one for the walls (darker).
const floorTex = makeDirtTexture("#6b4f3a");
floorTex.repeat.set(5, 5);
const wallTex = makeDirtTexture("#4a3525");
wallTex.repeat.set(9, 3);

// --- The floor: a flat circle of packed dirt ---
const floorGeo = new THREE.CircleGeometry(DEN_RADIUS, 48);
const floorMat = new THREE.MeshStandardMaterial({
  map: floorTex,
  bumpMap: floorTex, // makes the grains catch the light = bumpy dirt
  bumpScale: 0.6,
  roughness: 1,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2; // lay it flat
floor.receiveShadow = true;
denGroup.add(floor);

// --- The walls: an open tube around the floor ---
// "openEnded: true" means no top or bottom caps — just the curved wall.
const wallGeo = new THREE.CylinderGeometry(
  DEN_RADIUS,
  DEN_RADIUS,
  WALL_HEIGHT,
  48, // sides around the circle
  1,
  true // open ended
);
const wallMat = new THREE.MeshStandardMaterial({
  map: wallTex,
  bumpMap: wallTex,
  bumpScale: 0.8,
  roughness: 1,
  side: THREE.DoubleSide, // visible whether you look from inside or out
});
const walls = new THREE.Mesh(wallGeo, wallMat);
walls.position.y = WALL_HEIGHT / 2;
walls.receiveShadow = true;
denGroup.add(walls);

// --- The ceiling: a low earthen dome so the room feels roomy ---
// A cone (point facing up) makes the middle of the roof higher than
// the edges, like a burrow dug out of the dirt.
const ceilingGeo = new THREE.ConeGeometry(
  DEN_RADIUS,
  CEILING_RISE,
  48,
  1,
  true // open ended (no flat disc at the bottom of the cone)
);
const ceilingTex = makeDirtTexture("#3f2c1e");
ceilingTex.repeat.set(7, 2);
const ceilingMat = new THREE.MeshStandardMaterial({
  map: ceilingTex,
  bumpMap: ceilingTex,
  bumpScale: 0.8,
  roughness: 1,
  side: THREE.BackSide, // we see it from underneath
});
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.position.y = WALL_HEIGHT + CEILING_RISE / 2;
denGroup.add(ceiling);

// ------------------------------------------------------------
//  🪵  THE STUMP (your future crafting table) — a real 3D model,
//  tucked into a "corner" against the wall.
// ------------------------------------------------------------
const STUMP_HEIGHT = 1.3; // how tall the stump is
const STUMP_ANGLE = Math.PI * 0.25; // where around the wall it sits
const STUMP_COLLIDE_RADIUS = 0.8; // how far the mouse must stay from it

let stumpPos = null; // where the stump ended up (for bumping into it)

new GLTFLoader().load("/tree-stump.glb", (gltf) => {
  const stump = gltf.scene;
  stump.traverse((part) => {
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });

  // Size it and stand it on the floor.
  const box = new THREE.Box3().setFromObject(stump);
  const size = new THREE.Vector3();
  box.getSize(size);
  stump.scale.setScalar(STUMP_HEIGHT / size.y);
  const scaledBox = new THREE.Box3().setFromObject(stump);
  stump.position.y = -scaledBox.min.y;

  // Tuck it against the wall in the corner.
  const dist = DEN_RADIUS - 1.2;
  stump.position.x = Math.sin(STUMP_ANGLE) * dist;
  stump.position.z = Math.cos(STUMP_ANGLE) * dist;

  // Remember its spot so the mouse can't walk through it.
  stumpPos = new THREE.Vector3(stump.position.x, 0, stump.position.z);

  denGroup.add(stump);
});

// ------------------------------------------------------------
//  🕳️  STORAGE HOLLOWS — little burrow holes dug into the wall.
//  Each hole is a dark cone-shaped recess with a raised dirt rim,
//  and we group several together so they look like a natural clump.
// ------------------------------------------------------------
// A dark, soft pocket painted with code: black in the middle, fading out
// to nothing at the edges — so it reads as a dent scooped into the dirt.
function makeHoleTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(0, 0, 0, 1)"); // deep dark center
  g.addColorStop(0.55, "rgba(10, 6, 4, 0.92)");
  g.addColorStop(1, "rgba(25, 17, 11, 0)"); // fades into the wall
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(canvas);
}
const holeMat = new THREE.MeshBasicMaterial({
  map: makeHoleTexture(),
  transparent: true,
  depthWrite: false, // blends onto the wall without z-fighting
  side: THREE.DoubleSide,
});

// Every hollow is a little storage slot that can hold one crafted item.
const hollows = [];

function makeHole(angle, height, radius) {
  // The hollow is a dark recessed dent painted flat ONTO the wall. It sits
  // flush with the dirt (nothing sticks out) and the dark gradient makes it
  // read as a pocket dug into the wall to store things in.
  const pocket = new THREE.Mesh(new THREE.CircleGeometry(radius, 26), holeMat);
  const dist = DEN_RADIUS - 0.02; // flush with the wall — nothing pokes out
  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;
  pocket.position.set(x, height, z);
  pocket.rotation.y = angle + Math.PI; // face into the room
  denGroup.add(pocket);

  hollows.push({ x, y: height, z, radius, angle, item: null });
}

// Each "clump" has a center spot on the wall and a few BIG hollows around
// it (da = sideways nudge, dh = up/down nudge) — roomy enough for ingredients.
const holeClumps = [
  {
    angle: Math.PI * 0.85,
    height: 1.5,
    holes: [
      { da: 0.0, dh: 0.0, r: 0.8 },
      { da: 0.18, dh: 0.1, r: 0.55 },
      { da: -0.17, dh: 0.15, r: 0.5 },
      { da: 0.03, dh: -0.85, r: 0.62 },
    ],
  },
  {
    angle: Math.PI * 1.55,
    height: 1.4,
    holes: [
      { da: 0.0, dh: 0.0, r: 0.78 },
      { da: 0.18, dh: 0.12, r: 0.5 },
      { da: -0.15, dh: -0.7, r: 0.55 },
    ],
  },
];

for (const clump of holeClumps) {
  for (const h of clump.holes) {
    makeHole(clump.angle + h.da, clump.height + h.dh, h.r);
  }
}

// ------------------------------------------------------------
//  🚪  THE EXIT — a mouse-sized hole in the wall that leads outside.
// ------------------------------------------------------------
const EXIT_ANGLE = 0; // which way around the wall (0 = straight ahead at start)
const EXIT_W = 0.75; // a little wider than the mouse
const EXIT_H = 0.9; // a little taller than the mouse
const exitDoor = new THREE.Group();
{
  // A dark tunnel mouth (so it reads as a hole going out).
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(EXIT_W, EXIT_H),
    new THREE.MeshBasicMaterial({ color: 0x080604, side: THREE.DoubleSide })
  );
  mouth.position.y = EXIT_H / 2;
  exitDoor.add(mouth);

  // A rounded dirt arch framing the top of the hole.
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(EXIT_W / 2, 0.1, 8, 16, Math.PI),
    wallMat
  );
  arch.position.y = EXIT_H;
  exitDoor.add(arch);
  // Two little dirt posts up the sides.
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, EXIT_H, 6),
      wallMat
    );
    post.position.set((sx * EXIT_W) / 2, EXIT_H / 2, 0);
    exitDoor.add(post);
  }
}
const exitPos = new THREE.Vector3(
  Math.sin(EXIT_ANGLE) * (DEN_RADIUS - 0.05),
  0,
  Math.cos(EXIT_ANGLE) * (DEN_RADIUS - 0.05)
);
exitDoor.position.copy(exitPos);
exitDoor.rotation.y = EXIT_ANGLE + Math.PI; // mouth faces into the room
denGroup.add(exitDoor);

// ------------------------------------------------------------
//  🐭  THE MOUSE (your model!)
//  We put the model inside a "rig" group. We move the rig;
//  the camera follows the rig. This keeps movement simple.
// ------------------------------------------------------------
const mouseRig = new THREE.Group();
scene.add(mouseRig);

// We have TWO poses of the mouse:
//   quadMouse  = on all fours (used for walking)
//   standMouse = standing up on hind legs (used when you look up)
let quadMouse = null; // the walking model
let standMouse = null; // the standing model
let quadBaseY = 0; // resting feet height of the walking model
let quadScale = 1; // the walking mouse's normal size (used to shrink it for sleeping)
let standBaseY = 0; // resting feet height of the standing model
let walkPhase = 0; // counts up while walking, drives the scurry bounce
let stand = 0; // 0 = on all fours, 1 = fully standing (eases smoothly)
let jumpVel = 0; // up/down speed while jumping (0 when on the ground)
let carriedItem = null; // the crafted thing currently held in the teeth
const droppedItems = []; // crafted things lying on the ground
let biteTimer = 0; // counts down during the bite-down animation
let sprintLeft = SPRINT_MAX; // seconds of sprint remaining
let inNest = null; // the nest the mouse is currently curled up in (or null)
let sleepPhase = 0; // drives the gentle breathing while sleeping

const loader = new GLTFLoader();

// A helper that loads one model, sizes it, drops it onto the floor,
// turns it to face forward, and hands it back to us.
function loadMouse(url, targetHeight, facingFix, onReady) {
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;

      // Turn on shadows for every part of the mouse.
      model.traverse((part) => {
        if (part.isMesh) {
          part.castShadow = true;
          part.receiveShadow = true;
        }
      });

      // Auto-size to targetHeight, no matter the model's original units.
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      model.scale.setScalar(targetHeight / size.y);

      // Drop it so its feet sit on the floor (y = 0).
      const scaledBox = new THREE.Box3().setFromObject(model);
      const baseY = -scaledBox.min.y;
      model.position.y = baseY;

      // Spin it so its nose points "forward" for our controls.
      model.rotation.y = facingFix;

      mouseRig.add(model);
      onReady(model, baseY);
    },
    undefined,
    (error) => console.error("Could not load", url, error)
  );
}

// Load the walking mouse...
loadMouse("/mouse.glb", MOUSE_HEIGHT, MODEL_FACING_FIX, (model, baseY) => {
  quadMouse = model;
  quadBaseY = baseY;
  quadScale = model.scale.x;
});

// ...and the standing mouse (hidden until you look up).
loadMouse("/standing-mouse.glb", STAND_HEIGHT, STAND_FACING_FIX, (model, baseY) => {
  standMouse = model;
  standBaseY = baseY;
  model.visible = false;
});

// --- Real 3D models for some crafted items (the rest use a placeholder).
// craftModels[recipeName] = a ready-to-clone model that sits on the floor.
const craftModels = {};

// Paint a mesh two-tone by height: brown on the bottom, green moss on top.
function applyTwoTone(root, lowHex, highHex, split) {
  const low = new THREE.Color(lowHex);
  const high = new THREE.Color(highHex);
  root.traverse((p) => {
    if (!p.isMesh) return;
    const geo = p.geometry;
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) - min.y) / Math.max(1e-6, max.y - min.y);
      const c = t < split ? low : high; // bottom = brown, top = green moss
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    p.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      flatShading: true,
    });
    p.castShadow = true;
    p.receiveShadow = true;
  });
}

// The Moss Bedding nest — two-tone (woven brown base + green moss) and
// big enough for the mouse to climb inside and shuffle around.
new GLTFLoader().load("/nest.glb", (gltf) => {
  const nest = gltf.scene;
  applyTwoTone(nest, 0x6b4a2c, 0x6f9140, 0.45);
  // Size it up so the mouse fits inside, then sit it on the floor.
  const box = new THREE.Box3().setFromObject(nest);
  const size = new THREE.Vector3();
  box.getSize(size);
  nest.scale.setScalar(1.3 / Math.max(size.x, size.z));
  const box2 = new THREE.Box3().setFromObject(nest);
  nest.position.y = -box2.min.y;
  craftModels["Moss Bedding"] = nest;
});

// ------------------------------------------------------------
//  ⌨️  KEYBOARD CONTROLS
//  We just remember which keys are held down right now.
// ------------------------------------------------------------
const keys = {};
let jumpRequested = false; // set the moment Space is pressed (a fresh tap)
let grabRequested = false; // set the moment G is pressed (a fresh tap)

window.addEventListener("keydown", (e) => {
  // A fresh tap of Space = ask for a jump (ignore the auto-repeat).
  if (e.code === "Space") {
    if (!keys["Space"]) jumpRequested = true;
    e.preventDefault(); // stop Space from scrolling the page
  }
  // A fresh tap of G = grab or drop with the teeth.
  if (e.code === "KeyG" && !keys["KeyG"]) grabRequested = true;
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => (keys[e.code] = false));

function isHeld(...codes) {
  return codes.some((c) => keys[c]);
}

// ------------------------------------------------------------
//  🛠️  CRAFTING
//  Walk near the stump → "Press E" appears → press E → the mouse
//  walks over, works for a moment, then the crafting screen opens.
// ------------------------------------------------------------
const craftPromptEl = document.getElementById("craft-prompt");
const craftScreenEl = document.getElementById("craft-screen");
const craftCloseEl = document.getElementById("craft-close");
const sprintBarEl = document.getElementById("sprint");
const sprintFillEl = document.getElementById("sprint-fill");
const nestPromptEl = document.getElementById("nest-prompt");
const hollowPromptEl = document.getElementById("hollow-prompt");

let craftMode = "play"; // "play" | "crafting" | "menu"
let craftTimer = 0; // seconds elapsed during the working animation
let craftPhase = 0; // 0 = walking to the stump, 1 = working
const craftSpot = new THREE.Vector3(); // where the mouse stands to craft
let craftFacing = 0; // which way it faces while crafting
const CRAFT_WORK_TIME = 2.2; // length of the sorting/weaving animation

// Is the mouse close enough to the stump to craft?
function nearStump() {
  if (!stumpPos) return false;
  const d = Math.hypot(
    mouseRig.position.x - stumpPos.x,
    mouseRig.position.z - stumpPos.z
  );
  return d < STUMP_COLLIDE_RADIUS + CRAFT_PROMPT_RADIUS;
}

function startCrafting() {
  craftMode = "crafting";
  craftPhase = 0;
  craftTimer = 0;
  stand = 0; // cancel any look-up

  // Pick a spot just in front of the stump (room side), facing it.
  const toCenter = new THREE.Vector3(-stumpPos.x, 0, -stumpPos.z).normalize();
  craftSpot.copy(stumpPos).addScaledVector(toCenter, STUMP_COLLIDE_RADIUS + 0.45);
  craftFacing = Math.atan2(stumpPos.x - craftSpot.x, stumpPos.z - craftSpot.z);

  craftPromptEl.classList.remove("show");
}

function openMenu() {
  craftMode = "menu";
  craftScreenEl.classList.add("show");
  alignHotspots(); // make sure the clickable layer matches the picture
}

function closeMenu() {
  craftMode = "play";
  craftScreenEl.classList.remove("show");
  recipePopupEl.classList.remove("show"); // also hide the ingredient panel
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && craftMode === "play" && world === "den" && nearStump())
    startCrafting();
  else if (e.code === "Escape" && craftMode === "menu") closeMenu();
  else if (e.code === "KeyX" && craftMode === "play") {
    // X = climb into / out of a Moss Bedding nest
    if (inNest) {
      const n = inNest;
      inNest = null;
      // un-curl: put the mouse model back to normal standing on the rig
      quadMouse.position.set(0, quadBaseY, 0);
      quadMouse.rotation.set(0, 0, 0);
      quadMouse.scale.setScalar(quadScale); // back to full size
      // step out in the direction we're facing so we don't get stuck
      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        mouseRig.rotation.y
      );
      mouseRig.position.addScaledVector(
        fwd,
        (n.userData.collide || 0.75) + MOUSE_BODY_RADIUS + 0.1
      );
    } else {
      const n = nearNest();
      if (n) enterNest(n);
    }
  }
});
craftCloseEl.addEventListener("click", closeMenu);

// ------------------------------------------------------------
//  🎒  INVENTORY + CLICKABLE RECIPES
//  The mouse starts EMPTY — it has to find ingredients outside.
//  Clicking a recipe shows each ingredient as have/need (green if
//  you have enough, red if you don't).
// ------------------------------------------------------------
const inventory = {}; // e.g. { "Moss": 3 } — starts empty on purpose
const recipeByName = {};
for (const r of RECIPES) recipeByName[r.name] = r;

// The EXACT spot of each recipe picture, measured straight from the
// crafting image (left, top, width, height as % of the picture). The
// squares are different sizes on purpose — these were detected from the
// art so the highlights line up tile-by-tile.
const CRAFT_CELLS = [
  // Home & Comfort (9)
  { l: 0.54, t: 3.48, w: 7.96, h: 11.17 }, { l: 8.5, t: 3.48, w: 10.55, h: 11.17 },
  { l: 19.04, t: 3.48, w: 11.94, h: 11.17 }, { l: 30.98, t: 3.48, w: 12.79, h: 11.17 },
  { l: 43.77, t: 3.48, w: 11.55, h: 11.17 }, { l: 55.32, t: 3.48, w: 10.18, h: 11.17 },
  { l: 65.5, t: 3.48, w: 9.11, h: 11.17 }, { l: 74.61, t: 3.48, w: 10.33, h: 11.17 },
  { l: 84.94, t: 3.48, w: 11.67, h: 11.17 },
  // Exploration Gear (10)
  { l: 0.44, t: 18.33, w: 8.45, h: 11.17 }, { l: 8.89, t: 18.33, w: 11.33, h: 11.17 },
  { l: 20.21, t: 18.33, w: 10.25, h: 11.17 }, { l: 30.47, t: 18.33, w: 10.01, h: 11.17 },
  { l: 40.48, t: 18.33, w: 10.35, h: 11.17 }, { l: 50.83, t: 18.33, w: 10.25, h: 11.17 },
  { l: 61.08, t: 18.33, w: 9.62, h: 11.17 }, { l: 70.7, t: 18.33, w: 8.59, h: 11.17 },
  { l: 79.3, t: 18.33, w: 8.3, h: 11.17 }, { l: 87.6, t: 18.33, w: 8.5, h: 11.17 },
  // Food & Survival (10)
  { l: 0.44, t: 34.54, w: 8.06, h: 10.84 }, { l: 8.5, t: 34.54, w: 11.23, h: 10.84 },
  { l: 19.73, t: 34.54, w: 10.69, h: 10.84 }, { l: 30.42, t: 34.54, w: 10.3, h: 10.84 },
  { l: 40.72, t: 34.54, w: 10.5, h: 10.84 }, { l: 51.22, t: 34.54, w: 9.96, h: 10.84 },
  { l: 61.18, t: 34.54, w: 9.18, h: 10.84 }, { l: 70.36, t: 34.54, w: 8.84, h: 10.84 },
  { l: 79.2, t: 34.54, w: 8.98, h: 10.84 }, { l: 88.18, t: 34.54, w: 9.08, h: 10.84 },
  // Charms & Cosmetics (10)
  { l: 0.44, t: 50.29, w: 8.2, h: 10.9 }, { l: 8.64, t: 50.29, w: 11.21, h: 10.9 },
  { l: 19.85, t: 50.29, w: 10.62, h: 10.9 }, { l: 30.47, t: 50.29, w: 9.81, h: 10.9 },
  { l: 40.28, t: 50.29, w: 9.86, h: 10.9 }, { l: 50.15, t: 50.29, w: 9.79, h: 10.9 },
  { l: 59.94, t: 50.29, w: 9.28, h: 10.9 }, { l: 69.21, t: 50.29, w: 9.08, h: 10.9 },
  { l: 78.3, t: 50.29, w: 8.96, h: 10.9 }, { l: 87.26, t: 50.29, w: 8.98, h: 10.9 },
  // Building & Structures (10)
  { l: 0.54, t: 66.31, w: 8.42, h: 11.69 }, { l: 8.96, t: 66.31, w: 11.79, h: 11.69 },
  { l: 20.75, t: 66.31, w: 10.72, h: 11.69 }, { l: 31.47, t: 66.31, w: 9.91, h: 11.69 },
  { l: 41.38, t: 66.31, w: 9.81, h: 11.69 }, { l: 51.2, t: 66.31, w: 9.57, h: 11.69 },
  { l: 60.77, t: 66.31, w: 9.3, h: 11.69 }, { l: 70.07, t: 66.31, w: 8.76, h: 11.69 },
  { l: 78.83, t: 66.31, w: 8.59, h: 11.69 }, { l: 87.43, t: 66.31, w: 8.54, h: 11.69 },
  // Secret / Rare (5)
  { l: 0.83, t: 83.79, w: 11.13, h: 16.99 }, { l: 11.96, t: 83.79, w: 17.63, h: 16.99 },
  { l: 29.59, t: 83.79, w: 18.38, h: 16.99 }, { l: 47.97, t: 83.79, w: 19.24, h: 16.99 },
  { l: 67.21, t: 83.79, w: 19.78, h: 16.99 },
];

// Recipe names in the SAME order the pictures appear (left-to-right,
// top-to-bottom). Note the picture skips "Storage Cache", so it's not here.
const CRAFT_NAMES = [
  "Moss Bedding", "Leaf Blanket", "Den Wall Reinforcement", "Nursery Nest",
  "Lantern Mushroom Lamp", "Warmth Stones", "Acorn Bowl",
  "Family Keepsake Shelf", "Thistle Bed",
  "Travel Backpack", "Leaf Rain Cloak", "Root Rope", "Dew Water Pouch",
  "Scent Mask Pouch", "Waterproof Leaf Pack", "Climbing Spikes",
  "Glow Lantern", "Firefly Lantern", "Moonstone Necklace",
  "Berry Bundle", "Mushroom Stew", "Nectar Energy Mix", "Roasted Beetle Snack",
  "Healing Poultice", "Bee Wax Balm", "Glow Dust Satchel", "Cheese Feast",
  "Moon Petal Tea", "Snack Pouch",
  "Braided Grass Bracelet", "Feather Charm", "Button Backpack Pin",
  "Berry Seed Charm", "Flower Crown", "Acorn Pendant", "Lavender Anklet",
  "Crystal Ear Charm", "Firefly Jar Decoration", "Moonstone Crown",
  "Grass Hideout", "Twig Bridge", "Lookout Perch", "Escape Tunnel",
  "Storm Door", "Herb Drying Rack", "Map Table", "Scent Trail Marker",
  "Baby Toy", "Sticky Sap Trap",
  "Moonstone Lantern", "Secret Root Door", "Ancient Seed Planter",
  "Family Portrait Wall", "Moonstone Hollow Shrine",
];

const hotspotsEl = document.getElementById("craft-hotspots");
const recipePopupEl = document.getElementById("recipe-popup");

// Build a clickable square over each recipe picture from a list of cells.
function buildHotspots(cells) {
  hotspotsEl.innerHTML = "";
  for (const cell of cells) {
    const recipe = recipeByName[cell.name];
    if (!recipe) continue;
    const btn = document.createElement("button");
    btn.className = "hotspot";
    btn.title = cell.name;
    btn.style.left = cell.l + "%";
    btn.style.top = cell.t + "%";
    btn.style.width = cell.w + "%";
    btn.style.height = cell.h + "%";
    btn.addEventListener("click", () => showRecipe(recipe));
    hotspotsEl.appendChild(btn);
  }
}

// Built-in default boxes (used until you save your own with the editor).
const defaultCells = CRAFT_NAMES.map((name, i) => ({ name, ...CRAFT_CELLS[i] }));

// Prefer the boxes you saved in the cell editor, if they exist.
fetch("/craft-cells.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((saved) => buildHotspots(saved && saved.length ? saved : defaultCells))
  .catch(() => buildHotspots(defaultCells));

// Lock the clickable layer EXACTLY onto the picture, whatever the window
// size — so the highlights always sit right on each tile.
const craftImgEl = document.querySelector("#craft-panel img");
function alignHotspots() {
  if (!craftImgEl) return;
  hotspotsEl.style.left = craftImgEl.offsetLeft + "px";
  hotspotsEl.style.top = craftImgEl.offsetTop + "px";
  hotspotsEl.style.width = craftImgEl.offsetWidth + "px";
  hotspotsEl.style.height = craftImgEl.offsetHeight + "px";
}
if (craftImgEl.complete) alignHotspots();
craftImgEl.addEventListener("load", alignHotspots);
window.addEventListener("resize", alignHotspots);

// Show the "have / need" panel for one recipe.
function showRecipe(recipe) {
  let allOk = true;
  const rows = recipe.ingredients
    .map((ing) => {
      const have = inventory[ing.item] || 0;
      const ok = have >= ing.qty;
      if (!ok) allOk = false;
      return `<div class="ing ${ok ? "ok" : "no"}">
        <span class="count">${have}/${ing.qty}</span> ${ing.item}
      </div>`;
    })
    .join("");

  recipePopupEl.innerHTML = `
    <div class="recipe-title">${recipe.name}</div>
    <div class="ing-list">${rows}</div>
    <div class="recipe-actions">
      <button class="craft-btn" ${allOk ? "" : "disabled"}>
        ${allOk ? "🔨 Craft!" : "Need more"}
      </button>
      <button class="test">🧪 Test: give items</button>
    </div>
    <button class="recipe-back">← Back to recipes</button>
  `;
  recipePopupEl.classList.add("show");

  recipePopupEl.querySelector(".recipe-back").onclick = () =>
    recipePopupEl.classList.remove("show");

  // TEMPORARY test button: instantly gives you this recipe's ingredients
  // so you can see the green state. Remove once gathering is in the game.
  recipePopupEl.querySelector(".test").onclick = () => {
    for (const ing of recipe.ingredients) {
      inventory[ing.item] = (inventory[ing.item] || 0) + ing.qty;
    }
    showRecipe(recipe); // redraw — now it'll be green
  };

  const craftBtn = recipePopupEl.querySelector(".craft-btn");
  if (allOk) {
    craftBtn.onclick = () => {
      for (const ing of recipe.ingredients) inventory[ing.item] -= ing.qty;
      spawnCraftedItem(recipe.name); // drop it on the ground by the stump
      recipePopupEl.innerHTML = `
        <div class="recipe-title">✨ You crafted<br>${recipe.name}! ✨</div>
        <div style="text-align:center; font-size:15px; opacity:0.9">
          It's on the ground by the stump.<br>Press <b>G</b> to grab it in your teeth!
        </div>
      `;
      // close the crafting screen shortly so you can go grab your item
      setTimeout(closeMenu, 1400);
    };
  }
}

// ------------------------------------------------------------
//  🌍  WORLD: switch between the den and the outdoors.
// ------------------------------------------------------------
// Build the outdoors from the saved world layout (made in the world editor),
// falling back to the default map layout if there isn't one yet.
fetch("/world-layout.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((layout) => outsideGroup.add(buildOutside(layout).group))
  .catch(() => outsideGroup.add(buildOutside().group));

let world = "den"; // "den" or "outside"

// The two looks: cosy dark burrow vs bright daylight.
const denBg = new THREE.Color(COLORS.sky);
const denFog = new THREE.Fog(COLORS.sky, 8, 22);
const skyBg = new THREE.Color(0xa9e4ff); // bright sunny sky
const outFog = new THREE.Fog(0xcdeeff, 380, 1500); // light, far haze

// Resize the sun's shadow box (small in the den, big outside).
function setSunShadowRange(r) {
  const c = sunLight.shadow.camera;
  c.left = -r; c.right = r; c.top = r; c.bottom = -r;
  c.near = 1; c.far = r * 4 + 30;
  c.updateProjectionMatrix();
}

function goOutside() {
  world = "outside";
  denGroup.visible = false;
  outsideGroup.visible = true;
  scene.background = skyBg;
  scene.fog = outFog;
  // bright, sunny, lush forest lighting
  ambientLight.intensity = 0.35;
  hemiLight.intensity = 1.1;
  sunLight.intensity = 2.6;
  sunLight.color.set(0xfff1cf);
  // bigger, softer shadows that follow the mouse around outside
  setSunShadowRange(45);
  // step out just south of the den mound, facing away from home
  mouseRig.position.set(SPAWN.x, 0, SPAWN.z);
  mouseRig.rotation.y = SPAWN.facing;
  jumpVel = 0;
  stand = 0;
}

function goInside() {
  world = "den";
  denGroup.visible = true;
  outsideGroup.visible = false;
  scene.background = denBg;
  scene.fog = denFog;
  ambientLight.intensity = 0.7;
  hemiLight.intensity = 0;
  sunLight.intensity = 1.4;
  sunLight.color.set(0xffd9a0);
  setSunShadowRange(DEN_RADIUS);
  // step in just inside the exit hole, facing the middle of the den
  const inset = DEN_RADIUS - 1.4;
  mouseRig.position.set(
    Math.sin(EXIT_ANGLE) * inset,
    0,
    Math.cos(EXIT_ANGLE) * inset
  );
  mouseRig.rotation.y = EXIT_ANGLE + Math.PI;
  jumpVel = 0;
  stand = 0;
}

// ------------------------------------------------------------
//  🎬  THE GAME LOOP — runs ~60 times per second
// ------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(); // seconds since last frame

  if (quadMouse && standMouse) {
    if (craftMode === "play") {
      updatePlay(dt);
      craftPromptEl.classList.toggle("show", world === "den" && nearStump());
      updateNestPrompt();
      updateHollowPrompt();
    } else if (craftMode === "crafting") {
      updateCrafting(dt);
    }
    // "menu": the mouse just sits at the stump; nothing to move.
  }

  if (craftMode !== "play") {
    nestPromptEl.classList.remove("show");
    hollowPromptEl.classList.remove("show");
  }

  // Outside, keep the sun (and its shadows) following the mouse.
  if (world === "outside") {
    sunLight.position.set(
      mouseRig.position.x + 28,
      70,
      mouseRig.position.z + 24
    );
    sunLight.target.position.set(mouseRig.position.x, 0, mouseRig.position.z);
    sunLight.target.updateMatrixWorld();
  }

  jumpRequested = false; // a Space tap only triggers one jump
  grabRequested = false; // a G tap only triggers one grab/drop
  if (biteTimer > 0) biteTimer = Math.max(0, biteTimer - dt);

  // Update the sprint meter — and hide it once it's fully charged.
  sprintFillEl.style.width = (sprintLeft / SPRINT_MAX) * 100 + "%";
  sprintFillEl.classList.toggle("empty", sprintLeft < 0.5);
  sprintBarEl.classList.toggle("hidden", sprintLeft >= SPRINT_MAX - 0.05);

  updateCamera(dt);
  renderer.render(scene, camera);
}

// --- Normal walking-around play ---
function updatePlay(dt) {
  // If we're curled up in the nest, just sleep — no walking around.
  if (inNest) {
    sleepInNest(dt);
    return;
  }

  const onGround = mouseRig.position.y <= 0.001;

  // Look up / stand up: hold F
  const wantStand = isHeld("KeyF");
  stand += ((wantStand ? 1 : 0) - stand) * Math.min(1, dt * STAND_SPEED);

  // Turn left / right
  if (isHeld("KeyA", "ArrowLeft")) mouseRig.rotation.y += TURN_SPEED * dt;
  if (isHeld("KeyD", "ArrowRight")) mouseRig.rotation.y -= TURN_SPEED * dt;

  // Jump — one hop per fresh Space tap, only from the ground
  if (jumpRequested && onGround && stand < 0.5) jumpVel = JUMP_STRENGTH;
  jumpVel -= GRAVITY * dt; // gravity always pulls down
  mouseRig.position.y += jumpVel * dt;
  if (mouseRig.position.y < 0) {
    mouseRig.position.y = 0; // landed
    jumpVel = 0;
  }

  // Walk forward / back (not while standing up)
  let move = 0;
  if (stand < 0.5) {
    if (isHeld("KeyW", "ArrowUp")) move += 1;
    if (isHeld("KeyS", "ArrowDown")) move -= 1;
  }
  const isWalking = move !== 0;

  // Sprint: hold Shift to go fast, but it runs out after SPRINT_MAX seconds.
  let speed = WALK_SPEED;
  const wantSprint = isHeld("ShiftLeft", "ShiftRight");
  if (wantSprint && isWalking && sprintLeft > 0) {
    speed *= SPRINT_MULT;
    sprintLeft = Math.max(0, sprintLeft - dt); // using it up
  } else if (!wantSprint) {
    sprintLeft = Math.min(SPRINT_MAX, sprintLeft + dt * SPRINT_RECHARGE); // refill
  }

  if (isWalking) {
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      mouseRig.rotation.y
    );
    mouseRig.position.addScaledVector(forward, move * speed * dt);
  }

  // Grab / drop / store with the teeth (a fresh G tap)
  if (grabRequested && onGround && stand < 0.5) {
    const h = nearHollow();
    if (h && carriedItem && !h.item) {
      storeInHollow(h); // tuck what you're carrying into the hollow
    } else if (h && !carriedItem && h.item) {
      takeFromHollow(h); // pull the stored item back out
    } else if (carriedItem) {
      dropCarried(); // set it down on the ground
    } else {
      tryGrab(); // pick something up off the ground
    }
    biteTimer = BITE_TIME; // play the bite-down animation
  }

  bumpCraftedItems(); // can't walk through crafted things

  if (world === "den") {
    keepInsideWalls();
    bumpStump();
    // Reached the exit hole? Go outside.
    const dExit = Math.hypot(
      mouseRig.position.x - exitPos.x,
      mouseRig.position.z - exitPos.z
    );
    if (dExit < 0.9) goOutside();
  } else {
    keepInsideWorld();
    bumpMound();
    // Reached the den entrance? Go back inside.
    const dDen = Math.hypot(
      mouseRig.position.x - DEN_ENTRANCE.x,
      mouseRig.position.z - DEN_ENTRANCE.z
    );
    if (dDen < 0.9) goInside();
  }

  updateMousePose(dt, isWalking);
}

// --- The crafting routine: walk over, then work at the table ---
function updateCrafting(dt) {
  if (craftPhase === 0) {
    // Phase 0: scurry over to the crafting spot.
    const dx = craftSpot.x - mouseRig.position.x;
    const dz = craftSpot.z - mouseRig.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.06) {
      mouseRig.rotation.y = Math.atan2(dx, dz); // face where we walk
      const step = Math.min(d, WALK_SPEED * dt);
      mouseRig.position.x += (dx / d) * step;
      mouseRig.position.z += (dz / d) * step;
      updateMousePose(dt, true); // scurry animation
    } else {
      mouseRig.position.x = craftSpot.x;
      mouseRig.position.z = craftSpot.z;
      mouseRig.rotation.y = craftFacing;
      craftPhase = 1;
      craftTimer = 0;
    }
  } else {
    // Phase 1: stand at the table, fiddle with materials, then open menu.
    mouseRig.rotation.y = craftFacing;
    quadMouse.visible = false;
    standMouse.visible = true;
    craftTimer += dt;
    standMouse.position.y = standBaseY + Math.abs(Math.sin(craftTimer * 9)) * 0.03;
    standMouse.rotation.x = 0.25 + Math.sin(craftTimer * 6) * 0.08; // reaching
    standMouse.rotation.z = Math.sin(craftTimer * 12) * 0.16; // paws weaving
    if (craftTimer >= CRAFT_WORK_TIME) openMenu();
  }
}

// --- Keep the mouse inside the round walls ---
function keepInsideWalls() {
  const limit = DEN_RADIUS - 0.6;
  const d = Math.hypot(mouseRig.position.x, mouseRig.position.z);
  if (d > limit) {
    mouseRig.position.x *= limit / d;
    mouseRig.position.z *= limit / d;
  }
}

// --- Push the mouse out of the stump if it bumps into it ---
function bumpStump() {
  if (!stumpPos) return;
  const dx = mouseRig.position.x - stumpPos.x;
  const dz = mouseRig.position.z - stumpPos.z;
  const d = Math.hypot(dx, dz);
  const minD = STUMP_COLLIDE_RADIUS + MOUSE_BODY_RADIUS;
  if (d < minD && d > 0.0001) {
    mouseRig.position.x = stumpPos.x + (dx / d) * minD;
    mouseRig.position.z = stumpPos.z + (dz / d) * minD;
  }
}

// --- Bump out of solid crafted items (but the Moss Bedding nest is a
//     bed you can climb into, so it doesn't block you). ---
function bumpCraftedItems() {
  const activeGroup = world === "den" ? denGroup : outsideGroup;
  for (const it of droppedItems) {
    if (it === carriedItem || it === inNest || !it.userData.solid) continue;
    if (it.parent !== activeGroup) continue; // only the ones in this place
    const dx = mouseRig.position.x - it.position.x;
    const dz = mouseRig.position.z - it.position.z;
    const d = Math.hypot(dx, dz);
    const minD = (it.userData.collide || 0.35) + MOUSE_BODY_RADIUS;
    if (d < minD && d > 0.0001) {
      mouseRig.position.x = it.position.x + (dx / d) * minD;
      mouseRig.position.z = it.position.z + (dz / d) * minD;
    }
  }
}

// Find the nearest Moss Bedding nest you could climb into.
function nearNest() {
  const activeGroup = world === "den" ? denGroup : outsideGroup;
  let best = null;
  let bestD = 1.5;
  for (const it of droppedItems) {
    if (it.userData.name !== "Moss Bedding" || it.parent !== activeGroup) continue;
    const d = Math.hypot(
      mouseRig.position.x - it.position.x,
      mouseRig.position.z - it.position.z
    );
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}

// Climb into a nest: hop to its middle (its collision is ignored while in).
function enterNest(n) {
  inNest = n;
  mouseRig.position.x = n.position.x;
  mouseRig.position.z = n.position.z;
}

// Find the nearest wall hollow you could store into / take from.
function nearHollow() {
  if (world !== "den") return null;
  let best = null;
  let bestD = 1.4;
  for (const h of hollows) {
    const d = Math.hypot(mouseRig.position.x - h.x, mouseRig.position.z - h.z);
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}

// Tuck the item you're carrying into a hollow.
function storeInHollow(h) {
  const it = carriedItem;
  carriedItem = null;
  it.removeFromParent();
  denGroup.add(it);
  it.position.set(h.x, h.y, h.z);
  it.rotation.set(0, h.angle + Math.PI, 0); // face into the room
  h.item = it;
}

// Take the item back out of a hollow, into the teeth.
function takeFromHollow(h) {
  const it = h.item;
  h.item = null;
  it.removeFromParent();
  mouseRig.add(it);
  it.position.set(0, 0.1, 0.42);
  it.rotation.set(0, 0, 0);
  carriedItem = it;
}

// Curl up asleep inside the nest: sink down into it, tip onto one side,
// and breathe gently. The nest stays solid; the feet just tuck through it.
function sleepInNest(dt) {
  mouseRig.position.set(inNest.position.x, 0, inNest.position.z);
  mouseRig.rotation.y = 0; // neutral facing while asleep (keeps the math simple)
  quadMouse.visible = true;
  standMouse.visible = false;
  sleepPhase += dt * 2;
  const breathe = Math.sin(sleepPhase) * 0.015; // slow sleepy breaths

  // Shrink him a little so his WHOLE body (head and all) fits in the bowl.
  quadMouse.scale.setScalar(quadScale * 0.72);
  // Lay the mouse on its side, then recenter it so it sits right in the
  // middle of the nest and fully visible (the model's pivot isn't centered,
  // so we measure it and nudge it back into place).
  quadMouse.rotation.set(0, 0, Math.PI / 2);
  quadMouse.position.set(0, 0, 0);
  quadMouse.updateMatrixWorld(true);
  const center = new THREE.Vector3();
  new THREE.Box3().setFromObject(quadMouse).getCenter(center);
  quadMouse.position.set(
    inNest.position.x - center.x,
    0.24 + breathe - center.y, // sit down in the bowl, fully inside the rim
    inNest.position.z - center.z
  );
}

// Show the right "Press X" hint, and hop out if we've wandered away.
function updateNestPrompt() {
  if (inNest) {
    const d = Math.hypot(
      mouseRig.position.x - inNest.position.x,
      mouseRig.position.z - inNest.position.z
    );
    if (d > (inNest.userData.collide || 0.75) + 1.4) inNest = null;
  }
  if (inNest) {
    nestPromptEl.textContent = "Press X to get out of the nest";
    nestPromptEl.classList.add("show");
  } else {
    nestPromptEl.textContent = "Press X to get in the nest";
    nestPromptEl.classList.toggle("show", !!nearNest());
  }
}

// Show "Press G to store / take" when near a hollow with something to do.
function updateHollowPrompt() {
  const h = inNest ? null : nearHollow();
  if (h && carriedItem && !h.item) {
    hollowPromptEl.textContent = "Press G to store it in the hollow";
    hollowPromptEl.classList.add("show");
  } else if (h && !carriedItem && h.item) {
    hollowPromptEl.textContent = "Press G to take it from the hollow";
    hollowPromptEl.classList.add("show");
  } else {
    hollowPromptEl.classList.remove("show");
  }
}

// --- Keep the mouse inside the edge of the outdoor world ---
function keepInsideWorld() {
  const d = Math.hypot(mouseRig.position.x, mouseRig.position.z);
  if (d > WORLD_RADIUS) {
    mouseRig.position.x *= WORLD_RADIUS / d;
    mouseRig.position.z *= WORLD_RADIUS / d;
  }
}

// --- Don't let the mouse walk through the den mound (but leave the
//     entrance open so it can go back inside). ---
function bumpMound() {
  const dx = mouseRig.position.x;
  const dz = mouseRig.position.z;
  const d = Math.hypot(dx, dz);
  const minD = MOUND_RADIUS + MOUSE_BODY_RADIUS;
  // skip the push near the entrance so the mouse can step in
  const nearEntrance =
    Math.hypot(dx - DEN_ENTRANCE.x, dz - DEN_ENTRANCE.z) < 0.9;
  if (d < minD && d > 0.0001 && !nearEntrance) {
    mouseRig.position.x = (dx / d) * minD;
    mouseRig.position.z = (dz / d) * minD;
  }
}

// --- Swap between the two poses and animate the scurry ---
function updateMousePose(dt, isWalking) {
  const showStanding = stand >= 0.5;
  standMouse.visible = showStanding;
  quadMouse.visible = !showStanding;

  const rise = Math.max(0, (stand - 0.5) / 0.5); // 0 crouched -> 1 upright
  standMouse.position.y = standBaseY - (1 - rise) * 0.25;
  standMouse.rotation.x = (1 - rise) * 0.6;
  standMouse.rotation.z = 0;

  if (isWalking) {
    walkPhase += dt * 14;
    quadMouse.position.y = quadBaseY + Math.abs(Math.sin(walkPhase)) * 0.05;
    quadMouse.rotation.z = Math.sin(walkPhase) * 0.12;
  } else {
    quadMouse.position.y +=
      (quadBaseY - quadMouse.position.y) * Math.min(1, dt * 10);
    quadMouse.rotation.z += (0 - quadMouse.rotation.z) * Math.min(1, dt * 10);
  }

  // Bite down: a quick nose-dip when grabbing/dropping with the teeth.
  const biteDip =
    biteTimer > 0 ? Math.sin((1 - biteTimer / BITE_TIME) * Math.PI) * 0.5 : 0;
  quadMouse.rotation.x = biteDip;
}

// ------------------------------------------------------------
//  📦  CRAFTED ITEMS — little bundles you can carry in your teeth
// ------------------------------------------------------------

// A floating name tag drawn with code (so we don't need picture files).
function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(20, 16, 12, 0.82)";
  ctx.fillRect(0, 16, 256, 34);
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe6a8";
  ctx.fillText(text, 128, 34, 244);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthTest: false, // always show the label on top
    })
  );
  sprite.scale.set(1.0, 0.25, 1);
  return sprite;
}

// Build the crafted item: use a real model if we have one for this
// recipe, otherwise a simple placeholder bundle.
function makeCraftedItem(name) {
  const group = new THREE.Group();

  if (craftModels[name]) {
    // a real 3D model (e.g. the Moss Bedding nest)
    group.add(craftModels[name].clone(true));
  } else {
    // placeholder bundle for recipes we haven't modelled yet
    const body = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: 0x8fae4d,
        roughness: 1,
        flatShading: true,
      })
    );
    body.position.y = 0.16;
    body.castShadow = true;
    group.add(body);
  }

  const label = makeLabel(name);
  label.position.y = 0.55;
  group.add(label);

  group.userData.name = name;
  // Everything crafted is solid — you bump into it, you don't walk through.
  group.userData.solid = true;
  group.userData.collide = name === "Moss Bedding" ? 0.6 : 0.35; // nest is bigger
  return group;
}

// Drop a freshly crafted item on the ground next to the stump.
function spawnCraftedItem(name) {
  if (!stumpPos) return;
  const item = makeCraftedItem(name);

  const toCenter = new THREE.Vector3(-stumpPos.x, 0, -stumpPos.z).normalize();
  const side = new THREE.Vector3(toCenter.z, 0, -toCenter.x); // sideways
  const n = droppedItems.length;
  const pos = new THREE.Vector3()
    .copy(stumpPos)
    .addScaledVector(toCenter, STUMP_COLLIDE_RADIUS + 0.55)
    .addScaledVector(side, ((n % 3) - 1) * 0.45); // fan them out a little

  item.position.set(pos.x, 0, pos.z);
  denGroup.add(item); // crafted items live in the den
  droppedItems.push(item);
}

// Bite the nearest item on the ground and carry it.
function tryGrab() {
  let best = null;
  let bestD = GRAB_RANGE;
  for (const it of droppedItems) {
    const d = Math.hypot(
      it.position.x - mouseRig.position.x,
      it.position.z - mouseRig.position.z
    );
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  if (!best) return;

  // Move it from the world into the mouse's "mouth" so it follows along.
  droppedItems.splice(droppedItems.indexOf(best), 1);
  best.removeFromParent();
  mouseRig.add(best);
  best.position.set(0, 0.1, 0.42); // held just in front of the snout
  best.rotation.set(0, 0, 0);
  carriedItem = best;
}

// Open the teeth and set the carried item down where the mouse is.
function dropCarried() {
  const worldPos = new THREE.Vector3();
  carriedItem.getWorldPosition(worldPos);
  mouseRig.remove(carriedItem);
  // put it down in whichever place we're standing in
  (world === "den" ? denGroup : outsideGroup).add(carriedItem);
  carriedItem.position.set(worldPos.x, 0, worldPos.z); // back onto the floor
  carriedItem.rotation.set(0, 0, 0);
  droppedItems.push(carriedItem);
  carriedItem = null;
}

// ------------------------------------------------------------
//  🎥  THIRD-PERSON CAMERA — floats behind & above the mouse
// ------------------------------------------------------------
const tmpTarget = new THREE.Vector3();
const camOffset = new THREE.Vector3();

// A tiny helper: blend between two numbers (a when t=0, b when t=1).
function mix(a, b, t) {
  return a + (b - a) * t;
}

function updateCamera(dt) {
  // While sleeping in the nest, look down INTO the bowl at the curled mouse.
  if (inNest) {
    const tx = inNest.position.x;
    const tz = inNest.position.z;
    const desired = new THREE.Vector3(tx, 3.0, tz + 1.5); // high & close = peek in
    camera.position.lerp(desired, Math.min(1, dt * 4));
    camera.position.y = Math.max(0.5, camera.position.y);
    tmpTarget.set(tx, 0.25, tz);
    camera.lookAt(tmpTarget);
    return;
  }

  // The camera's upward "sky look" lags behind the standing-up, so you
  // first watch the mouse rise, THEN the view tilts up to the sky.
  let skyLook = Math.max(0, (stand - 0.45) / 0.55); // starts after it's up
  skyLook = Math.min(1, skyLook);
  skyLook = skyLook * skyLook * (3 - 2 * skyLook); // smooth it out

  // DEFAULT view: camera sits behind and a bit above, looking slightly
  // up over the mouse so you see the top of its back and head.
  // SKY LOOK: the camera swings down close behind and aims way up high.
  camOffset.set(
    0,
    mix(1.8, 0.9, skyLook), // height: drops low when looking up
    mix(-3.0, -1.8, skyLook) // distance: pulls in close when looking up
  );

  const desired = camOffset
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseRig.rotation.y)
    .add(mouseRig.position);

  // Glide smoothly toward that spot instead of snapping.
  camera.position.lerp(desired, Math.min(1, dt * 6));

  // --- Inside the den, don't let the camera poke through the walls ---
  if (world === "den") {
    const camR = Math.hypot(camera.position.x, camera.position.z);
    const maxR = DEN_RADIUS - 0.4;
    if (camR > maxR) {
      camera.position.x *= maxR / camR;
      camera.position.z *= maxR / camR;
    }
  }
  camera.position.y = Math.max(0.4, camera.position.y);

  // Where we look: a touch above the mouse by default, but WAY up high
  // when looking up, so the view points straight at the sky.
  tmpTarget.copy(mouseRig.position);
  tmpTarget.y += mix(1.1, 6.0, skyLook);
  camera.lookAt(tmpTarget);
}

// ------------------------------------------------------------
//  📐  Keep the game fitting the window when it resizes
// ------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the loop!
animate();
