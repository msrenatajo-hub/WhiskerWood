// ============================================================
//  WhiskerWood — a low-poly mouse life simulator 🐭
//  This file builds the den and lets you control the mouse.
// ============================================================

import "./boot.js"; // (first: ?newgame wipes the save before anything loads it)
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RECIPES } from "./recipes.js";
import { whereToFind, placesFor, keyOf, allIngredientKeys } from "./ingredients.js";
import { showTutorialOnce } from "./tutorial.js";
import { buildOutside, terrainHeight, updateOutsideFX, MOUND_RADIUS, WORLD_RADIUS, SPAWN, DEN_ENTRANCE, EVERBOUGH_POS, OWL_NEST_HEIGHT, FALLS_POS, loadModelFile, ANIMAL_YAW, isWater, buildAnimal, JOURNAL_POS, buildThistle, EVERBOUGH_HOLE, SCHOOL_SPOTS, SCHOOL_NPCS, litterNear, takeLitter, biomeAt, CAMPSITE, HOLLOW_CENTER, HOLLOW_DOORS, setWinter, CREEK_BRIDGE, waterSurfaceAt, fallsToWorld, MOON_DOOR, isHollow, moonStepTop, groundTop } from "./outside.js";
import { playCutscene, updateCutscene, cutscenePlaying, fadeThrough } from "./cutscene.js";
import { buildTunnels } from "./tunnels.js";
import { buildRoothaven } from "./roothaven.js";
import { buildCity, CITY_INFO } from "./cities.js";
import { openTravel, travelOpen } from "./travel.js";
import { initCityLife, hasItem, ownedList, shopIsOpen, showCoins, getCoins, initMuseum, initEverboughShops, applyLook, onLookChange, wardrobeList, toggleWear, setWardrobeCity, homeHung, openHangPicker, makeHouseForSale, buildPony, setRoomEnter, saveCity as saveCityLife, sellableKeys, cityState as cityLifeSave, keepScrollOnRedraw, setEconomySource } from "./cityLife.js";
import { buildHomeInterior, makeWallSlots } from "./homes.js";
import { initPets, petsHTML, togglePet, petWearHTML, togglePetWear } from "./pets.js";
import { CREATOR_CREDIT } from "./phase12.js";
import { initStory } from "./story.js";
import { initExtras } from "./extras.js";
import { initQuests } from "./quests.js";
import { initBalloons } from "./balloons.js";
import { initCooking, DISHES } from "./cooking.js";
import { FOOD, setFoodAdder, bagFood } from "./food.js";
import { power, powerText, powerSummaryHTML, CRAFT_FOOD } from "./powers.js";
import { initFriends } from "./friends.js";
import { initMore } from "./more.js";
import { initMore2 } from "./more2.js";
import { initHelp } from "./help.js";
import { initMore3 } from "./more3.js";
import { initSkating, SKATE_COLORS } from "./skating.js";
import { initRink } from "./rink.js";
import { initTrophies } from "./trophies.js";
import { initSecrets } from "./secrets.js";
import { PLACES } from "./secretPlaces.js";
import { initParadise, buildLlama, buildCamel, MOUNTS } from "./paradise.js";
import { initConjure, USE } from "./conjure.js";
import { initAnimals } from "./animals.js";
import { initSignatures } from "./signatures.js";
import { signBoard, signTexture } from "./signs.js";
import { initItems } from "./items.js";
import { MOUNT_BUILDERS } from "./mountModels.js";
import { initItemPictures } from "./itemArt.js";
import { initMinimap } from "./minimap.js";
import { initAmbientAudio, updateAmbient, setAmbientMuted, ambientMuted } from "./ambient.js";
import { RETRO, FOG_MULT, DRAW_DISTANCE, rendererOptions, applyResolution, cycleResolution, createBlobShadow, updateBlobShadow } from "./retro.js";

// ------------------------------------------------------------
//  ⚙️  SETTINGS YOU CAN PLAY WITH
//  (change these numbers and the game changes!)
// ------------------------------------------------------------
const DEN_RADIUS = 7.5; // how wide the round room is
const WALL_HEIGHT = 5; // how tall the dirt walls are
const CEILING_RISE = 2.2; // how much the dome ceiling arches up in the middle
const MOUSE_HEIGHT = 0.45; // how tall your mouse is on all fours
const STAND_HEIGHT = 0.85; // how tall your mouse is when standing up
const CLEAR_AIR = 0.45; // 🔭 every place's fog is thinned to this — so things a little way off stay sharp and clear
const WALK_SPEED = 16; // how fast the mouse walks (doubled — exploring the big forest should feel brisk)
const TURN_SPEED = 3.0; // top turning speed (radians/second) — eases in, so a tap is a nudge
const SPRINT_MULT = 3; // how much faster sprinting is than walking (16 -> 48)
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
const BASE_FOV = 55; // (looking closely at a secret zooms in from this)
const camera = new THREE.PerspectiveCamera(
  BASE_FOV, // field of view (how wide you see)
  window.innerWidth / window.innerHeight, // screen shape
  0.25, // closest visible distance (not too tiny — far-off water would flicker)
  DRAW_DISTANCE // farthest visible distance (N64 mode: shorter, hidden by fog)
);

// The renderer draws the scene onto the <canvas>.
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer(rendererOptions(canvas));
// N64 mode draws a small picture and stretches it to the window (see retro.js)
applyResolution(renderer);
// N64 mode: no shadow maps at all (a whole extra scene render saved) — a
// blob shadow under the mouse stands in for them, Ocarina-style.
renderer.shadowMap.enabled = !RETRO;
renderer.shadowMap.type = THREE.PCFShadowMap; // cheaper filter, still soft-edged
renderer.shadowMap.autoUpdate = false; // we refresh it every other frame ourselves
// Filmic tone-mapping = bright, vivid, "stylized render" colors.
// (N64 mode skips it: plain, punchy, saturated cartridge colors)
renderer.toneMapping = RETRO ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
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
// 🏡 (a cozy cottage now: warm wooden floorboards instead of dirt)
{
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  for (let i = 0; i < 8; i++) {
    g.fillStyle = ["#9a6a3e", "#8e6038", "#a47244", "#94663c"][i % 4];
    g.fillRect(0, i * 32, 256, 32);
    g.fillStyle = "rgba(60,36,18,.55)";
    g.fillRect(0, i * 32, 256, 2);
    g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = "rgba(70,44,22,.18)";
      g.fillRect((i * 53 + k * 41) % 256, i * 32 + 8 + (k % 3) * 6, 30, 1);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  floorMat.map = tex;
  floorMat.bumpMap = null;
}
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
// 🏡 cream plaster walls with dark timber beams
{
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 128;
  const g = cv.getContext("2d");
  g.fillStyle = "#e8d6b4";
  g.fillRect(0, 0, 512, 128);
  for (let k = 0; k < 400; k++) {
    g.fillStyle = `rgba(${150 + Math.random() * 60},${120 + Math.random() * 40},90,.07)`;
    g.fillRect(Math.random() * 512, Math.random() * 128, 6, 3);
  }
  g.fillStyle = "#6a4a2c";
  for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 14, 128);
  g.fillRect(0, 0, 512, 10);
  g.fillRect(0, 118, 512, 10);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  wallMat.map = tex;
  wallMat.bumpMap = null;
}
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
// 🏡 a wooden beamed ceiling
ceilingMat.map = null;
ceilingMat.bumpMap = null;
ceilingMat.color.setHex(0x8a6038);
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.position.y = WALL_HEIGHT + CEILING_RISE / 2;
denGroup.add(ceiling);
// 🏡 cozy touches: rafters, a round rag rug, and warm lamplight
{
  const timber = new THREE.MeshStandardMaterial({ color: 0x5a3e24, roughness: 1, flatShading: true });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const len = Math.hypot(DEN_RADIUS, CEILING_RISE);
    const raft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, len), timber);
    raft.position.set(Math.cos(a) * DEN_RADIUS * 0.5, WALL_HEIGHT + CEILING_RISE / 2 - 0.2, Math.sin(a) * DEN_RADIUS * 0.5);
    raft.lookAt(0, WALL_HEIGHT + CEILING_RISE, 0);
    denGroup.add(raft);
  }
  for (let r = 0; r < 4; r++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4 + r * 0.45, 0.85 + r * 0.45, 32), new THREE.MeshStandardMaterial({ color: [0xb84a4a, 0xe8c070, 0x5a8ab8, 0x8a5aa8][r], roughness: 1 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.012 + r * 0.001, -0.5);
    denGroup.add(ring);
  }
  const warm = new THREE.PointLight(0xffc880, 6, DEN_RADIUS * 3, 1.4);
  warm.position.set(0, WALL_HEIGHT * 0.9, 0);
  denGroup.add(warm);
}

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
function makeNicheTexture() {
  const w = 128;
  const h = 96;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#120b06"; // deep shadowed recess
  ctx.fillRect(0, 0, w, h);
  // soft inner shading so the alcove reads as carved INTO the wall
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(60, 40, 24, 0.55)");
  g.addColorStop(0.25, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(50, 34, 20, 0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(canvas);
}
const nicheTex = makeNicheTexture();
nicheTex.colorSpace = THREE.SRGBColorSpace;
const nicheMat = new THREE.MeshBasicMaterial({ map: nicheTex, color: 0x3a3a3a });
const nicheWood = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.85 });

// Every hollow is a little storage slot that can hold one crafted item.
const hollows = [];

function makeHole(angle, height, radius) {
  // A recessed BOOKSHELF niche carved into the den wall: a dark rectangular
  // alcove with a carved wooden frame and a little shelf board to set your
  // crafted treasures on.
  const w = radius * 2.1;
  const h = radius * 1.5;
  const dist = DEN_RADIUS - 0.02;
  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;

  const niche = new THREE.Group();
  niche.position.set(x, height, z);
  niche.rotation.y = angle + Math.PI; // face into the room

  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), nicheMat);
  niche.add(back);
  // carved wooden frame
  const t = 0.07;
  for (const [fw, fh, fx, fy] of [
    [w + t * 2, t, 0, h / 2 + t / 2],
    [w + t * 2, t, 0, -h / 2 - t / 2],
    [t, h, -w / 2 - t / 2, 0],
    [t, h, w / 2 + t / 2, 0],
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.08), nicheWood);
    bar.position.set(fx, fy, 0.03);
    niche.add(bar);
  }
  // the little shelf board your treasures sit on
  const board = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.06, 0.3), nicheWood);
  board.position.set(0, -h / 2 + 0.06, 0.12);
  board.castShadow = true;
  niche.add(board);
  denGroup.add(niche);

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
// The INSTALLED Storm Door: a stout plank panel that fills the doorway
// once a crafted Storm Door is in the den (see updateFlood). Hidden until then.
const stormPanel = new THREE.Group();
{
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.9, flatShading: true });
  const braceMat = new THREE.MeshStandardMaterial({ color: 0x4e3620, roughness: 1, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(EXIT_W / 4 - 0.015, EXIT_H - 0.06, 0.05), plankMat);
    plank.position.set(-EXIT_W / 2 + EXIT_W / 8 + (i * EXIT_W) / 4, EXIT_H / 2, 0.03);
    stormPanel.add(plank);
  }
  for (const by of [0.22, EXIT_H - 0.22]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(EXIT_W - 0.04, 0.09, 0.06), braceMat);
    brace.position.set(0, by, 0.07);
    stormPanel.add(brace);
  }
  const diag = new THREE.Mesh(new THREE.BoxGeometry(EXIT_W * 1.05, 0.08, 0.055), braceMat);
  diag.position.set(0, EXIT_H / 2, 0.065);
  diag.rotation.z = Math.atan2(EXIT_H - 0.44, EXIT_W);
  stormPanel.add(diag);
  const peg = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), braceMat);
  peg.position.set(EXIT_W * 0.28, EXIT_H * 0.5, 0.1);
  stormPanel.add(peg);
  stormPanel.visible = false;
  exitDoor.add(stormPanel);
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
// N64 mode's round shadow on the ground under the mouse
const blobShadow = createBlobShadow();
scene.add(blobShadow);

// We have TWO poses of the mouse:
//   quadMouse  = on all fours (used for walking)
//   standMouse = standing up on hind legs (used when you look up)
let quadMouse = null; // the walking model
let standMouse = null; // the standing model
let quadBaseY = 0; // resting feet height of the walking model
let quadScale = 1; // the walking mouse's normal size (used to shrink it for sleeping)
let standBaseY = 0; // resting feet height of the standing model
let walkPhase = 0; // counts up while walking, drives the scurry bounce
let idleTime = 0; // how long Thistle has been standing still
let stand = 0; // 0 = on all fours, 1 = fully standing (eases smoothly)
let jumpVel = 0; // up/down speed while jumping (0 when on the ground)
let carriedItem = null; // the crafted thing currently held in the teeth
const droppedItems = []; // crafted things lying on the ground
let biteTimer = 0; // counts down during the bite-down animation
let sprintLeft = SPRINT_MAX; // seconds of sprint remaining
let inNest = null; // the nest the mouse is currently curled up in (or null)
let sleepPhase = 0; // drives the gentle breathing while sleeping

const loader = new GLTFLoader();

// Thistle IS both the walking and the standing mouse — one brave body.
{
  const thistle = buildThistle({ pack: true });
  mouseRig.add(thistle);
  quadMouse = thistle;
  standMouse = thistle;
  quadBaseY = 0;
  standBaseY = 0;
  quadScale = 1;
}

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
  // 🎓 the first time: how the book works… and right after, how to mark the map
  showTutorialOnce("book", [
    { title: "📖 Your Recipe Book", text: "Every picture is something you can make — home comforts, exploring gear, food, charms, and secret recipes." },
    { title: "👆 Pick a recipe", text: "Click any picture to see the ingredients it needs. <b>Green</b> means you have enough, <b>red</b> means not yet." },
    { title: "📍 Where do I find it?", text: "Click an ingredient to learn where it grows or hides out in the forest." },
    { title: "✨ Follow the gold", text: "Then click the gold place name — a <b>golden trail</b> appears on your map, leading to the nearest spot." },
    { title: "🗺️ Your map", text: "Press <kbd>M</kbd> any time to open your big map of the whole forest." },
    { title: "📌 Mark your map", text: "On the big map, <b>click anywhere</b> to drop a marker — a golden trail leads you straight to it. Click a marker again to remove it.", button: "Let's go!" },
  ]);
}

function closeMenu() {
  craftMode = "play";
  craftScreenEl.classList.remove("show");
  recipePopupEl.classList.remove("show"); // also hide the ingredient panel
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyV" && !e.repeat) owlSay(cycleResolution(renderer)); // picture size
  // 🌙 a Moonkeeper can travel the old roads from ANYWHERE
  if (e.code === "KeyK" && !e.repeat && story && story.isMoonkeeper() && !cutscenePlaying() && !travelOpen()) openRoads();
  if (e.code === "KeyT" && world === "outside") {
    // hop the clock forward an eighth of a day — watch the sky change!
    setTimeOfDay(dayTime + 0.125);
    owlSay("🕐 Time slips forward…");
  }
  if (e.code === "KeyR" && world === "outside") {
    // call the next weather in: clear → cloudy → rain → clear
    const order = { clear: "cloudy", cloudy: "rain", rain: "clear" };
    const next = order[weatherNext] || "clear";
    setWeather(next);
    owlSay(next === "rain" ? "🌧️ Rain is coming…" : next === "cloudy" ? "☁️ Clouds roll in…" : "☀️ The sky clears!");
  }
  if (e.code === "Equal") {
    // = : whisk the mouse straight to the Great Falls
    if (world !== "outside") goOutside();
    const len = Math.hypot(FALLS_POS.x, FALLS_POS.z);
    const ax = FALLS_POS.x / len; // unit vector pointing into the cliffs
    const az = FALLS_POS.z / len;
    // land on the pond's SHORE (off to the side, clear of the water)
    const tx = FALLS_POS.x - ax * 8 - az * 28;
    const tz = FALLS_POS.z - az * 8 + ax * 28;
    mouseRig.position.set(tx, terrainHeight(tx, tz), tz);
    // face the falls across the water
    mouseRig.rotation.y = Math.atan2(FALLS_POS.x + ax * 22 - tx, FALLS_POS.z + az * 22 - tz);
    owlSay("💦 The Great Falls!");
  }
  if (journalOpen() && (e.code === "KeyE" || e.code === "Escape")) {
    journalEl.style.display = "none";
    return;
  }
  if (e.code === "KeyE" && craftMode === "play" && !e.repeat) {
    if (sitting) return standUp();
    const it = currentInteract();
    if (it) return it.act();
  }
  if (e.code === "KeyE" && craftMode === "play" && world === "den" && nearStump())
    startCrafting();
  else if (e.code === "KeyE" && craftMode === "play" && world === "outside" && !inNest)
    tryEatDrink();
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
      if (n) {
        // Minecraft rules: you can only SLEEP when it's dark out
        if (dayTime > 0.62 || dayTime < 0.2) {
          enterNest(n);
          sleepToMorning();
        } else {
          enterNest(n); // cosy, but no sleeping till nightfall
          owlSay("🌙 Snug! But mice only sleep after dark.");
        }
      }
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

// ------------------------------------------------------------
//  ❤️  HEALTH — cozy, Breath-of-the-Wild style. No hunger or thirst
//  timers: eating berries and drinking water RESTORE health, the owl
//  and other misadventures take it away, and sleeping in a nest at
//  night restores it ALL and skips to morning (Minecraft rules).
// ------------------------------------------------------------
let health = 100;
let eatCooldown = 0;
let berrySpots = []; // filled when the outside world installs
let meadowPos = null; // …so is the fox's territory
let tallGrassPos = null;

// the heart bar in the corner
const healthEl = document.createElement("div");
healthEl.style.cssText =
  "position:fixed;left:14px;bottom:14px;z-index:6;display:flex;align-items:center;gap:6px;font:600 15px system-ui;pointer-events:none;";
const heartIcon = document.createElement("span");
heartIcon.textContent = "❤️";
heartIcon.style.cssText = "filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))";
const healthTrack = document.createElement("div");
healthTrack.style.cssText =
  "width:140px;height:11px;background:rgba(20,16,10,.55);border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.25)";
const healthFill = document.createElement("div");
healthFill.style.cssText =
  "height:100%;width:100%;background:linear-gradient(90deg,#e5533f,#f07a5a);border-radius:6px;transition:width .3s";
healthTrack.appendChild(healthFill);
healthEl.append(heartIcon, healthTrack);
document.body.appendChild(healthEl);

// ------------------------------------------------------------
//  🖱️  MINECRAFT-STYLE MOUSE LOOK — a toggle button locks the pointer:
//  the mouse turns you (and tilts the view), A/D strafe sideways.
// ------------------------------------------------------------
let mouseLookWanted = false;
let lookPitch = 0; // -down .. +up, eased back to 0 when the mode is off
const isMouseLocked = () => document.pointerLockElement === renderer.domElement;
const mouseLookBtn = document.createElement("button");
mouseLookBtn.textContent = "🖱 Mouse look: OFF";
mouseLookBtn.id = "mouse-look-btn";
mouseLookBtn.style.cssText =
  "position:fixed;right:14px;bottom:14px;z-index:6;padding:7px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:rgba(20,16,10,.6);color:#f0e6d0;font:600 13px system-ui;cursor:pointer;";
mouseLookBtn.addEventListener("click", () => {
  mouseLookWanted = !mouseLookWanted;
  if (mouseLookWanted) renderer.domElement.requestPointerLock();
  else document.exitPointerLock();
});
document.body.appendChild(mouseLookBtn);
initAmbientAudio();
const soundBtn = document.createElement("button");
soundBtn.textContent = "🔊 Sound: ON";
soundBtn.id = "sound-btn";
// 🎬 the credits, any time
const creditsBtn = document.createElement("button");
creditsBtn.textContent = "🎬 Credits";
creditsBtn.id = "credits-btn";
creditsBtn.style.cssText = mouseLookBtn.style.cssText;
creditsBtn.style.right = "330px";
creditsBtn.addEventListener("click", () => {
  creditsBtn.blur();
  if (cutscenePlaying()) return;
  playCutscene([
    { dur: 1, fadeOut: true, gameCam: true, bars: true },
    ...CREATOR_CREDIT,
    { dur: 3.4, black: true, gameCam: true, who: "Starring", text: "Thistle Mosswhisker · Teacher Willow · Clover · Root Speaker Oriel · Head Librarian Quill · and every mouse of the five cities" },
    { dur: 3, black: true, gameCam: true, who: "WHISKERWOOD", text: "Thank you for playing! 🐭🌙" },
    { dur: 1, fadeIn: true, gameCam: true },
  ]);
});
document.body.appendChild(creditsBtn);
soundBtn.style.cssText = mouseLookBtn.style.cssText;
soundBtn.style.right = "205px";
soundBtn.addEventListener("click", () => {
  setAmbientMuted(!ambientMuted());
  soundBtn.textContent = ambientMuted() ? "🔇 Sound: OFF" : "🔊 Sound: ON";
});
document.body.appendChild(soundBtn);
document.addEventListener("pointerlockchange", () => {
  mouseLookBtn.textContent = isMouseLocked() ? "🖱 Mouse look: ON (Esc frees the mouse)" : "🖱 Mouse look: OFF";
  if (!isMouseLocked()) lookPitch = 0;
});
// clicking the world re-locks if the mode is still wanted (Esc unlocks)
renderer.domElement.addEventListener("click", () => {
  if (mouseLookWanted && !isMouseLocked()) renderer.domElement.requestPointerLock();
});
document.addEventListener("mousemove", (e) => {
  if (!isMouseLocked()) return;
  mouseRig.rotation.y -= e.movementX * 0.0026;
  lookPitch = Math.max(-0.55, Math.min(0.8, lookPitch - e.movementY * 0.002));
});

// ------------------------------------------------------------
//  🛋️  HOME DECORATING — only works in YOUR den: stand beside any
//  crafted thing and grow it or shrink it to taste.
// ------------------------------------------------------------
const decorEl = document.createElement("div");
decorEl.style.cssText =
  "position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:6;display:none;gap:8px;";
const mkDecorBtn = (label) => {
  const b = document.createElement("button");
  b.textContent = label;
  b.style.cssText =
    "padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:rgba(20,16,10,.65);color:#f0e6d0;font:600 13px system-ui;cursor:pointer;";
  decorEl.appendChild(b);
  return b;
};
const growBtn = mkDecorBtn("⬆ Grow it");
const shrinkBtn = mkDecorBtn("⬇ Shrink it");
document.body.appendChild(decorEl);

function nearestFurniture() {
  if (world !== "den") return null; // decorating is a HOME privilege
  let best = null;
  let bd = 3.4;
  for (const it of droppedItems) {
    if (it.parent !== denGroup || it === carriedItem) continue;
    const d = Math.hypot(mouseRig.position.x - it.position.x, mouseRig.position.z - it.position.z);
    if (d < bd) {
      bd = d;
      best = it;
    }
  }
  return best;
}
function rescaleFurniture(mult) {
  const it = nearestFurniture();
  if (!it) return;
  const u = it.userData;
  if (u.homeScale === undefined) {
    u.homeScale = 1;
    u.baseScale = it.scale.x;
    u.baseCollide = u.collide || 0.35;
  }
  u.homeScale = Math.min(3, Math.max(0.5, u.homeScale * mult));
  it.scale.setScalar(u.baseScale * u.homeScale);
  if (u.baseCollide) u.collide = u.baseCollide * u.homeScale;
}
growBtn.addEventListener("click", () => rescaleFurniture(1.25));
shrinkBtn.addEventListener("click", () => rescaleFurniture(0.8));

// ------------------------------------------------------------
//  🌊  THE FLOOD — when it rains hard, water trickles into the burrow
//  and slowly rises… unless a crafted STORM DOOR is installed at Home.
//  (It's in the Building & Structures recipes, just like the books say.)
// ------------------------------------------------------------
let floodLevel = 0;
let floodWarned = false;
const floodMesh = new THREE.Mesh(
  new THREE.CircleGeometry(DEN_RADIUS - 0.05, 36),
  new THREE.MeshStandardMaterial({
    color: 0x2a5a74,
    transparent: true,
    opacity: 0.72,
    roughness: 0.15,
    emissive: 0x123240,
    emissiveIntensity: 0.35,
  })
);
floodMesh.rotation.x = -Math.PI / 2;
floodMesh.visible = false;
denGroup.add(floodMesh);

function hasStormDoor() {
  return droppedItems.some((it) => it.parent === denGroup && /storm door/i.test(it.userData.name || ""));
}

let stormAnnounced = false;
function updateFlood(dt) {
  // a Storm Door in the den INSTALLS itself into the doorway: the item
  // vanishes into the frame and the plank panel appears. Pick it back up
  // (G near the door) and the doorway is bare again.
  const sd = droppedItems.find(
    (it) => it.parent === denGroup && it !== carriedItem && /storm door/i.test(it.userData.name || "")
  );
  stormPanel.visible = !!sd;
  for (const it of droppedItems) {
    if (!/storm door/i.test(it.userData.name || "")) continue;
    const installed = it === sd;
    if (installed && !it.userData.installed) {
      it.userData.installed = true;
      it.position.set(exitPos.x * 0.9, 0, exitPos.z * 0.9); // tucked at the door
      if (!stormAnnounced) {
        owlSay("🚪 Storm Door installed! The burrow is sealed snug and dry.");
        stormAnnounced = true;
      }
    }
    if (!installed && it.userData.installed) it.userData.installed = false;
    it.visible = !installed; // the item IS the door now
  }
  const leaking = rainAmt > 0.6 && !hasStormDoor();
  floodLevel = Math.max(0, Math.min(0.55, floodLevel + (leaking ? 0.014 : -0.06) * dt));
  floodMesh.visible = floodLevel > 0.02;
  floodMesh.position.y = floodLevel;
  if (leaking && !floodWarned && floodLevel > 0.04 && world === "den") {
    owlSay("💧 Rain is trickling in! A STORM DOOR (Building recipes) would keep the burrow dry…");
    floodWarned = true;
  }
  if (!leaking && floodLevel <= 0.02) floodWarned = false;
}

/** Lose some hearts (the owl's peck, mostly). */
function hurt(amount, why) {
  health = Math.max(0, health - amount);
  if (health <= 0) faint(why);
}

// ------------------------------------------------------------
//  📖  PIP'S JOURNAL — Entry One, found on a reading rock deep in
//  Moonstone Hollow. Walk close and press E to read it.
// ------------------------------------------------------------
const journalEl = document.createElement("div");
journalEl.style.cssText =
  "position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:50;background:rgba(8,10,16,.55);";
journalEl.innerHTML = `
  <div style="max-width:560px;margin:20px;padding:38px 44px;background:linear-gradient(160deg,#f6ecd2,#eaddba);
       border-radius:6px;box-shadow:0 24px 80px rgba(0,0,0,.6);font-family:Georgia,serif;color:#3a2c1e;
       border:1px solid #c9b88a;transform:rotate(-.4deg)">
    <div style="font-size:13px;letter-spacing:2px;color:#8a7357;text-transform:uppercase">Pip's Journal</div>
    <h2 style="margin:.2em 0 .8em;font-size:26px;color:#33261a">Entry One</h2>
    <p style="line-height:1.55;margin:0 0 .8em">The teachers say the Hollow is just a story. But tonight I followed
    the blue glow behind the great falls — and the story lit up all around me.</p>
    <p style="line-height:1.55;margin:0 0 .8em">The stones remember moonlight. The flowers hum it back. And the great
    door with the crescent… it felt <i>awake</i>. As if someone knew I was coming.</p>
    <p style="line-height:1.55;margin:0 0 .8em">So I am going to write down <b>everything</b>. Every stone, every song,
    every name. If the world ever forgets again, my books will remember.</p>
    <p style="line-height:1.55;margin:0;text-align:right">— Pip Thornwhisker, apprentice ☾</p>
    <div style="margin-top:1.2em;text-align:center;font-size:13px;color:#8a7357">E or Esc — close the journal</div>
  </div>`;
journalEl.addEventListener("click", () => (journalEl.style.display = "none"));
document.body.appendChild(journalEl);
const journalOpen = () => journalEl.style.display !== "none";
let journalHinted = false;

/** E outside: drink if facing water, eat if beside a berry bush. */
function tryEatDrink() {
  // reading comes first: Pip's journal on its rock in the Hollow
  if (Math.hypot(mouseRig.position.x - JOURNAL_POS.x, mouseRig.position.z - JOURNAL_POS.z) < 5) {
    journalEl.style.display = "flex";
    return;
  }
  if (eatCooldown > 0) return;
  const fwdX = Math.sin(mouseRig.rotation.y);
  const fwdZ = Math.cos(mouseRig.rotation.y);
  for (const d of [1.2, 2.4, 3.8]) {
    if (isWater(mouseRig.position.x + fwdX * d, mouseRig.position.z + fwdZ * d)) {
      eatCooldown = 1.2;
      biteTimer = BITE_TIME;
      if (story) story.onDrink();
      addToPack("Creek Water", 1, true);
      if (health >= 100) return owlSay("💧 Cool, sweet water — and a cupful of Creek Water for your pack.");
      health = Math.min(100, health + 15);
      owlSay("💧 Cool, sweet water! (+❤️)");
      return;
    }
  }
  const p = mouseRig.position;
  if (berrySpots.some((b) => Math.hypot(p.x - b.x, p.z - b.z) < 16)) {
    eatCooldown = 1.2;
    biteTimer = BITE_TIME;
    if (story) story.onEat();
    if (health >= 100) return owlSay("🍓 Sweet berries — you're already full of beans!");
    health = Math.min(100, health + 25);
    owlSay("🍓 Mmm — sweet berries! (+❤️)");
    return;
  }
  owlSay("E — nibble at a berry bush, or drink at the water's edge.");
}

/** Night-time only: sleep the night away and wake at full health. */
function sleepToMorning() {
  const fade = document.createElement("div");
  fade.style.cssText =
    "position:fixed;inset:0;background:#000;opacity:0;transition:opacity 1.2s;z-index:40;pointer-events:none";
  document.body.appendChild(fade);
  requestAnimationFrame(() => (fade.style.opacity = "1"));
  setTimeout(() => {
    setTimeOfDay(0.27); // just after sunrise
    health = 100;
    owlSay("🌅 You slept the whole night — fully rested! (❤️ full)");
    fade.style.opacity = "0";
    setTimeout(() => fade.remove(), 1400);
  }, 1300);
}

/** Everything went dizzy… wake up safe at Home (this is a kind world). */
function faint() {
  health = 55;
  if (world !== "den") goInside();
  mouseRig.position.set(0, 0, 2);
  owlSay("💫 Everything went dizzy… you wake up safe at Home.");
}

function updateHealth(dt) {
  if (eatCooldown > 0) eatCooldown -= dt;
  if (hasItem("heartstone") && health > 0 && health < 100) health = Math.min(100, health + dt * 0.6); // 💠 the Heartstone Shard: hearts heal on their own
  if (health > 0 && health < 100 && power("heal") > 0) health = Math.min(100, health + dt * power("heal")); // (✨ ❤️ powers)
  healthFill.style.width = health + "%";
}

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
// ------------------------------------------------------------
//  ✨  THE GOLDEN TRAIL to a material (from the recipe book) or a marker.
// ------------------------------------------------------------
let trailTarget = null; // { x, z, r, label, biome?, item?, marker? }
const PLACE_NAMES = {
  "biome:pine": "the Pine Forest",
  "biome:aspen": "the Aspen Forest",
  "biome:meadow": "the Meadow",
  "biome:wildflower": "the Wildflower Patch",
  "biome:tallgrass": "the Tall Grass",
  "biome:berry": "the Berry Bushes",
  creek: "the Crossable Creek",
  log: "the Fallen Log",
  well: "the Old Well (climb down its ivy into the cave)",
  hollow: "the bottom of the Great Falls (Moonstone Hollow hides behind the water)",
  tunnels: "Everbough's roots (there's a secret hole…)",
  everbough: "Everbough",
  home: "your den",
  school: "the school garden",
  edges: "the giants' summer campsite",
};
// where to start searching from (the den is its own little room)
const searchFrom = () => (world === "outside" ? mouseRig.position : { x: DEN_ENTRANCE.x, z: DEN_ENTRANCE.z });
function nearestSpot(test, from) {
  for (let r = 15; r <= 1300; r += 15) {
    const n = Math.max(12, Math.round(r / 6));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = from.x + Math.cos(a) * r;
      const z = from.z + Math.sin(a) * r;
      if (test(x, z, a, r)) return { x, z };
    }
  }
  return null;
}
/** A place name from ingredients.js → a spot in the world ({x, z, biome?}). */
function locatePlace(place, from) {
  if (place.startsWith("biome:")) {
    const biome = place.slice(6);
    if (biome === "tallgrass" && tallGrassPos) return { ...tallGrassPos, biome };
    if (world === "outside" && from === mouseRig.position && biomeAt(from.x, from.z) === biome) return { x: from.x, z: from.z, biome };
    // well inside the biome: the spot and a bit beyond it both match
    const at = nearestSpot((x, z, a, r) => {
      const x2 = from.x + Math.cos(a) * (r + 25);
      const z2 = from.z + Math.sin(a) * (r + 25);
      return biomeAt(x, z) === biome && biomeAt(x2, z2) === biome && !isWater(x, z);
    }, from);
    if (!at) return null;
    // step a little further in, so it's the forest's heart, not its edge
    const dx = at.x - from.x;
    const dz = at.z - from.z;
    const dl = Math.hypot(dx, dz) || 1;
    return { x: at.x + (dx / dl) * 25, z: at.z + (dz / dl) * 25, biome };
  }
  if (place === "creek") return nearestSpot((x, z) => isWater(x, z), from);
  if (place === "log") return landmarkAt.log || null;
  if (place === "well") return wellPos;
  if (place === "hollow") return HOLLOW_DOORS.ready ? { ...HOLLOW_DOORS.outside } : { x: FALLS_POS.x, z: FALLS_POS.z };
  if (place === "tunnels") return EVERBOUGH_HOLE.ready ? { x: EVERBOUGH_HOLE.x, z: EVERBOUGH_HOLE.z } : { ...EVERBOUGH_POS };
  if (place === "everbough") return { ...EVERBOUGH_POS };
  if (place === "home") return { x: DEN_ENTRANCE.x, z: DEN_ENTRANCE.z };
  if (place === "school") return schoolPos && { x: schoolPos.x + SCHOOL_SPOTS.garden[0], z: schoolPos.z + SCHOOL_SPOTS.garden[1] };
  if (place === "edges") return CAMPSITE.ready ? { x: CAMPSITE.x, z: CAMPSITE.z } : null;
  return null;
}
/** Point the golden trail at the nearest place to find `item`. → a message. */
function setMaterialTrail(item) {
  const from = searchFrom();
  let best = null;
  let bd = Infinity;
  const places = placesFor(item);
  for (const place of places) {
    const spot = locatePlace(place, from);
    if (!spot) continue;
    const d = Math.hypot(spot.x - from.x, spot.z - from.z);
    if (d < bd) {
      bd = d;
      best = { ...spot, place };
    }
  }
  if (!best) {
    return places.includes("edges")
      ? "🏕️ That's found out at the edges of the wild — the campsite, picnic area and hiking trail aren't on your map yet."
      : "🔎 Nobody's spotted that nearby yet. Keep exploring!";
  }
  const label = PLACE_NAMES[best.place] || "there";
  if (world === "outside" && best.biome && biomeAt(from.x, from.z) === best.biome) {
    trailTarget = null;
    return `🌿 You're already in ${label}! Look on the ground around you for ${item}.`;
  }
  trailTarget = { x: best.x, z: best.z, r: 10, biome: best.biome, label, item };
  return `✨ Golden trail set to ${label}! ${world === "outside" ? "Close the book and follow it on your map." : "Head outside and follow it on your map."}`;
}

function showRecipe(recipe) {
  let allOk = true;
  const rows = recipe.ingredients
    .map((ing) => {
      const have = inventory[keyOf(ing.item)] || 0;
      const ok = have >= ing.qty;
      if (!ok) allOk = false;
      // click an ingredient to see where in the world to find it
      const w = whereToFind(ing.item);
      return `<div class="ing ${ok ? "ok" : "no"}" title="Where do I find this?">
        <div class="ing-row"><span class="count">${have}/${ing.qty}</span> ${ing.item}<span class="ing-pin">📍</span></div>
        <div class="ing-where">
          <button class="where-go" data-item="${ing.item}"><b>${w.where}</b><i>✨ click for a golden trail on your map</i></button>
          <span>${w.tip}</span>
          <div class="where-msg"></div>
        </div>
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
  // 📍 tap an ingredient → where to find it (tap again to tuck it away)
  recipePopupEl.querySelectorAll(".where-go").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation(); // don't fold the panel away
      btn.parentElement.querySelector(".where-msg").textContent = setMaterialTrail(btn.dataset.item);
    };
  });
  recipePopupEl.querySelectorAll(".ing").forEach((row) => {
    row.onclick = (e) => {
      if (e.target.closest(".ing-where")) return;
      const open = row.classList.contains("open");
      recipePopupEl.querySelectorAll(".ing.open").forEach((r) => r.classList.remove("open"));
      if (!open) row.classList.add("open");
    };
  });

  // TEMPORARY test button: instantly gives you this recipe's ingredients
  // so you can see the green state. Remove once gathering is in the game.
  recipePopupEl.querySelector(".test").onclick = () => {
    for (const ing of recipe.ingredients) {
      inventory[keyOf(ing.item)] = (inventory[keyOf(ing.item)] || 0) + ing.qty;
      packChanged();
    }
    showRecipe(recipe); // redraw — now it'll be green
  };

  const craftBtn = recipePopupEl.querySelector(".craft-btn");
  if (allOk) {
    craftBtn.onclick = () => {
      for (const ing of recipe.ingredients) inventory[keyOf(ing.item)] -= ing.qty;
      packChanged();
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
// The solid things (trees, rocks, boulders…) the mouse must walk around outside.
let outsideColliders = [];
let minimapCtl = null; // the storybook map widget (corner minimap + M)
let wellPos = null; // where the Old Well stands (walk onto it to climb down)
let schoolPos = null; // the Fallen Log School (Phase 1 happens here)
const landmarkAt = {}; // kind -> { x, z } of the first landmark of that kind
let story = null; // the story script (story.js) — set up just before the loop starts
let extras = null; // ✨ the living-world extras (extras.js)
let quests = null; // ⚔️ the quests (quests.js)
let balloons = null; // 🎈 balloon flights (balloons.js)
let cooking = null; // 🍲 the Great Cauldron + the Harvest Feast (cooking.js)
let friends = null; // 💌 friendship hearts + letters (friends.js)
let more = null; // 🌟 village, legends, weather, music, photos, hide & seek, titles (more.js)
let skating = null; // ⛸️ real ice skating (skating.js)
let secrets = null; // 🔍 hidden secrets all over the land (secrets.js)
let secretFocus = null, lastFocus = null, focusK = 0; // (hold F at a secret: the camera looks at it)
let trophies = null; // 🏆 the Trophy Room (trophies.js)
let rink = null; // ⛸️ Frostpine's Frozen Lake: the rink, the show, the skate hut (rink.js)
let itemUses = null; // ✨ treasures that really do what they say (items.js)
let signatures = null; // 🌟 each world's one special thing (signatures.js)
let animals = null; // 🦌 riding animals' secret realms, companions, the wild (animals.js)
let conjure = null; // ✨ bottled blizzards, thunder, rainbows — they really happen (conjure.js)
let paradise = null; // 🌺 the secret Paradise behind Dapple's Stable (paradise.js)
let more3 = null; // 🌟 the sea, the dragon, your castle, the circus, mysteries, the telescope, painting, city seasons (more3.js)
let more2 = null; // 🌟 time trials, fishing, vault, garden, birthdays, storybook, NG+, animals, music, dog sleds (more2.js)
// 🛠️ designer mode (?designer=1 turns it on for good, ?designer=0 off): map teleport in any phase
const designerMode = (() => {
  try {
    const d = new URLSearchParams(location.search).get("designer");
    if (d !== null) localStorage.setItem("ww.designer", d === "0" ? "" : "1");
    return !!localStorage.getItem("ww.designer");
  } catch {
    return false;
  }
})();
function installOutside(built) {
  outsideGroup.add(built.group);
  outsideColliders = built.colliders;
  // clicking the big map (M or /) teleports the mouse to that spot
  minimapCtl = initMinimap(built.objects.map((o) => o.entry), (x, z) => {
    if (world !== "outside") return;
    const d = Math.hypot(x, z);
    const lim = WORLD_RADIUS * 0.92; // stay inside the mountain ring
    if (d > lim) {
      x *= lim / d;
      z *= lim / d;
    }
    mouseRig.position.set(x, terrainHeight(x, z), z);
    owlSay("🗺️ Whisked away!");
  }, {
    // map teleporting unlocks in Phase 9 (the Moonkeepers' roads)
    // (the game designer always can: open the game once with ?designer=1)
    canTeleport: () => !!(story && story.phase >= 9) || designerMode,
    // 📌 a new marker → a golden trail straight to it
    onMark: (m) => {
      trailTarget = { x: m.x, z: m.z, r: 6, label: "your marker", marker: m.id };
      owlSay("📌 Marker dropped — follow the golden trail!");
    },
    onUnmark: (m) => {
      if (trailTarget && trailTarget.marker === m.id) trailTarget = null;
      owlSay("📌 Marker removed.");
    },
  });
  for (const o of built.objects) {
    if (o.entry.kind && !landmarkAt[o.entry.kind]) landmarkAt[o.entry.kind] = { x: o.entry.x, z: o.entry.z };
  }
  const well = built.objects.find((o) => o.entry.kind === "well");
  if (well) wellPos = { x: well.entry.x, z: well.entry.z };
  const school = built.objects.find((o) => o.entry.kind === "school");
  if (school) schoolPos = { x: school.entry.x, z: school.entry.z };
  berrySpots = built.objects
    .filter((o) => o.entry.kind === "berry")
    .map((o) => ({ x: o.entry.x, z: o.entry.z }));
  const meadow = built.objects.find((o) => o.entry.kind === "meadow");
  const tallgrass = built.objects.find((o) => o.entry.kind === "tallgrass");
  meadowPos = meadow ? { x: meadow.entry.x, z: meadow.entry.z } : null;
  tallGrassPos = tallgrass ? { x: tallgrass.entry.x, z: tallgrass.entry.z } : null;
}
// (?minimal=1 builds a tiny world — used by headless verification renders)
if (new URLSearchParams(location.search).get("minimal")) {
  const tiny = [{ id: "place2", kind: "creek", name: "Crossable Creek", x: 0, z: -493, rot: 0, scale: 1 }];
  // ?minimal=school adds the Fallen Log School (to test Phase 1 quickly)
  if (new URLSearchParams(location.search).get("minimal") === "school") {
    tiny.push({ id: "school1", kind: "school", name: "Fallen Log School", x: 7.9, z: 372.2, rot: 0, scale: 1 });
  }
  installOutside(buildOutside(tiny));
} else {
  fetch("/world-layout.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((layout) => installOutside(buildOutside(layout)))
    .catch(() => installOutside(buildOutside()));
}

let world = "den"; // "den" | "outside" | "cave" | "everbough"

// ------------------------------------------------------------
//  🌳  EVERBOUGH — THE CITY OF BRANCHES. When the Great Horned Owl
//  catches you, it carries you up out of the meadow and drops you
//  into the legendary treetop city woven through five great trees:
//  the Heartwood and its Grand Library, the Highcanopy observatory,
//  the Learning Leaves, the Millroot waterwheel, the Market Circle,
//  and the little homes of the Greenhollow. Half the size of the
//  wilderness — and the way home is the glowing Root Entrance.
// ------------------------------------------------------------
const cityGroup = new THREE.Group();
cityGroup.visible = false;
scene.add(cityGroup);
const CITY_R = 260; // roughly half the main world's playable heart
const cityGate = new THREE.Vector3(40, 0, CITY_R * 0.55); // the Root Entrance home (SE edge)
let cityBuilt = false;
let cityFireflies = null;

// gentle rolling forest floor that flattens at the plaza and climbs into a
// ring of forest at the rim (so you can't wander off the edge of the world)
function cityHeight(x, z) {
  const d = Math.hypot(x, z);
  // dead flat across the whole Market Circle, easing into GENTLE hills
  const plaza = 1 - Math.min(1, Math.max(0, d - 38) / 75);
  let h = (Math.sin(x * 0.02) * 1.3 + Math.cos(z * 0.023) * 1.4) * (1 - plaza);
  const rim = Math.max(0, (d - CITY_R * 0.8) / (CITY_R * 0.22));
  h += rim * rim * 80; // the forest wall rises at the edge
  return h;
}

// What you actually WALK on in Everbough: the ground — or, inside the
// Market Circle, the top of its stone plaza slab (0.4 thick).
function cityFloor(x, z) {
  return cityHeight(x, z) + (Math.hypot(x, z) < 33.8 ? 0.4 : 0);
}

function buildEverbough() {
  cityBuilt = true;
  const F = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
  const bark = F(0x6b4a2c);
  const barkDark = F(0x4e3620);
  const leaf = F(0x3f6a34);
  const leafHi = F(0x5a8a42);
  const plank = F(0x8a6238);
  const stone = F(0x9a978c);
  const roofCols = [0xa8524a, 0x4a7a8a, 0x6a8a4a, 0xc9a04a, 0x7a5a9a, 0xb0703a];
  const glassWarm = F(0xffe6a8, { emissive: 0xffbe52, emissiveIntensity: 1.8 });

  // ---- the forest floor + surrounding tree wall ----
  // (many rings, so the ground follows the hills everywhere — a plain circle
  // has no points between its middle and its rim, and the rising forest wall
  // turned it into a huge cone floating OVER the whole city)
  const floorGeo = new THREE.RingGeometry(0.001, CITY_R, 96, 90);
  const fp = floorGeo.attributes.position;
  const fc = new Float32Array(fp.count * 3);
  const gLo = new THREE.Color(0x3f5a2e), gHi = new THREE.Color(0x6a944a), tmp = new THREE.Color();
  for (let i = 0; i < fp.count; i++) {
    const x = fp.getX(i), y = fp.getY(i);
    tmp.copy(gLo).lerp(gHi, Math.min(1, (Math.sin(x * 0.05) + Math.cos(y * 0.05) + 2) / 4));
    fc[i * 3] = tmp.r; fc[i * 3 + 1] = tmp.g; fc[i * 3 + 2] = tmp.b;
  }
  floorGeo.setAttribute("color", new THREE.BufferAttribute(fc, 3));
  // displace the floor to the SAME hills everything stands on — the walk
  // floor, the buildings and the visual ground must all agree
  for (let i = 0; i < fp.count; i++) {
    fp.setZ(i, cityHeight(fp.getX(i), -fp.getY(i)));
  }
  floorGeo.computeVertexNormals();
  const floor = new THREE.Mesh(floorGeo, F(0xffffff, { vertexColors: true }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  cityGroup.add(floor);

  // a ring of tall forest pines walling the city in
  const pine = (px, pz, scale, dark) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scale, 0.9 * scale, 6 * scale, 6), barkDark);
    trunk.position.y = 3 * scale;
    g.add(trunk);
    for (let t = 0; t < 3; t++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((4 - t) * scale, 5 * scale, 7), dark ? leaf : leafHi);
      cone.position.y = (5 + t * 3) * scale;
      g.add(cone);
    }
    g.position.set(px, cityHeight(px, pz) - 1, pz);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    cityGroup.add(g);
  };
  for (let ring = 0; ring < 2; ring++) {
    const rr = CITY_R * (0.9 + ring * 0.07), count = 54 - ring * 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.3;
      pine(Math.cos(a) * rr, Math.sin(a) * rr, 3 + (i % 3) * 0.9, i % 2 === 0);
    }
  }

  // ---- a little cluster of homes on a platform (a "district") ----
  const homeCluster = (n) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const hx = Math.cos(a) * (2.6 + (i % 2) * 1.2), hz = Math.sin(a) * (2.6 + (i % 2) * 1.2);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.5), F(0xd8c49a));
      body.position.set(hx, 0.7, hz);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.1, 4), F(roofCols[i % roofCols.length]));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(hx, 1.95, hz);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.05), glassWarm);
      win.position.set(hx, 0.8, hz + 0.78);
      const g = new THREE.Group();
      g.add(body, roof, win);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return_g_push(g);
    }
  };
  // (helper closure needs the deck group; defined per-tree below)

  // ---- ONE great tree with a deck, homes, and a climbable trunk ----
  const platforms = []; // {x,z,r,y} decks you can stand on
  const trunks = []; // climbable trunk stacks
  function greatTree(tx, tz, trunkH, deckR, opts = {}) {
    const gy = cityHeight(tx, tz);
    // the massive trunk
    const seg = 8;
    for (let i = 0; i < seg; i++) {
      const r0 = (deckR * 0.55) * (1 - i / seg * 0.4);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r0 * 0.86, r0, trunkH / seg + 0.4, 9), i % 2 ? bark : barkDark);
      trunk.position.set(tx, gy + (i + 0.5) * (trunkH / seg), tz);
      trunk.castShadow = true;
      cityGroup.add(trunk);
    }
    // spreading roots at the base
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, deckR * 0.9, 6), barkDark);
      root.rotation.z = 0.9; root.rotation.y = -a;
      root.position.set(tx + Math.cos(a) * deckR * 0.4, gy + 0.6, tz + Math.sin(a) * deckR * 0.4);
      root.castShadow = true;
      cityGroup.add(root);
    }
    // the round wooden DECK
    const deckY = gy + trunkH;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(deckR, deckR, 0.6, 20), plank);
    deck.position.set(tx, deckY, tz);
    deck.castShadow = true; deck.receiveShadow = true;
    cityGroup.add(deck);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(deckR - 0.2, 0.12, 6, 24), bark);
    rail.rotation.x = Math.PI / 2; rail.position.set(tx, deckY + 0.9, tz);
    cityGroup.add(rail);
    // the leafy canopy above the deck (not on the Highcanopy — open to the stars)
    for (let i = 0; i < 0; i++) { // (no leaves on the great trees — bare bark, open to the sky)
      const a = i * 1.7;
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(deckR * (0.7 + (i % 2) * 0.3), 0), i % 2 ? leaf : leafHi);
      ball.position.set(tx + Math.cos(a) * deckR * 0.5, deckY + trunkH * 0.45 + (i % 3) * 4, tz + Math.sin(a) * deckR * 0.5);
      ball.castShadow = true;
      cityGroup.add(ball);
    }
    // homes + warm lantern-posts on the deck
    const deckG = new THREE.Group();
    deckG.position.set(tx, deckY + 0.3, tz);
    cityGroup.add(deckG);
    const push = (g2) => deckG.add(g2);
    const homes = opts.homes ?? 4;
    for (let i = 0; i < homes; i++) {
      const a = (i / homes) * Math.PI * 2 + 0.4;
      const rr = deckR * 0.55;
      const hx = Math.cos(a) * rr, hz = Math.sin(a) * rr;
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), F(0xd8c49a));
      body.position.set(hx, 0.75, hz);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.2, 4), F(roofCols[(i + opts.roofOff | 0) % roofCols.length]));
      roof.rotation.y = Math.PI / 4; roof.position.set(hx, 2.1, hz);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.06), glassWarm);
      win.position.set(hx, 0.85, hz + 0.84);
      body.castShadow = roof.castShadow = true;
      push(body); push(roof); push(win);
    }
    // a lantern post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), bark);
    post.position.set(0, 0.9, 0);
    const lant = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), glassWarm);
    lant.position.set(0, 1.9, 0);
    push(post); push(lant);
    const deckLight = new THREE.PointLight(0xffc46a, 26, deckR * 2.4, 1.7);
    deckLight.position.set(tx, deckY + 3, tz);
    cityGroup.add(deckLight);

    // register the deck as a floor + the trunk as climbable
    platforms.push({ x: tx, z: tz, r: deckR - 0.4, y: deckY + 0.6 });
    const samples = [];
    for (let y = 0; y <= trunkH; y += 5) {
      const r0 = (deckR * 0.55) * (1 - (y / trunkH) * 0.4);
      samples.push({ y: gy + y, x: tx, z: tz, r: r0 });
    }
    trunks.push({ type: "trunk", samples });
    return { tx, tz, deckY, deckR, gy };
  }

  // ---- lay out the five great trees around the Market Circle ----
  const heart = greatTree(0, -60, 46, 24, { homes: 0, roofOff: 0 }); // The Heartwood (Grand Library)
  const canopy = greatTree(90, 30, 60, 13, { homes: 1, roofOff: 1, noLeaves: true }); // The Highcanopy (observatory)

  // a reusable parchment name-plaque, just like the map's little banners
  // (🪧 big, crisp, unlit and readable from both sides — see signs.js)
  const makePlaque = (title, sub, w = 6.4) => signBoard(sub ? title + "\n" + sub : title, { w, h: w * 0.3, style: "gold" });

  // ================================================================
  //  🔭  THE HIGHCANOPY — the observatory and lookout, to the map:
  //  a stone-and-cream tower crowned with a slitted dome, the great
  //  telescope poking at the sky, a crow's-nest lookout with its own
  //  spyglass, pennants, and the name-plaque facing the bridges.
  // ================================================================
  {
    const ox = canopy.tx - 2.5, oz = canopy.tz - 2.5;
    const dy = canopy.deckY + 0.3;
    // stone base drum + cream tower with a doorway and windows
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 2.2, 12), stone);
    drum.position.set(ox, dy + 1.1, oz);
    drum.castShadow = true;
    cityGroup.add(drum);
    const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 6, 12), F(0xe2d6b8));
    towerBody.position.set(ox, dy + 5.2, oz);
    towerBody.castShadow = true;
    cityGroup.add(towerBody);
    const doorway = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.3), barkDark);
    doorway.position.set(ox, dy + 1.5, oz + 3.35);
    cityGroup.add(doorway);
    for (let w = 0; w < 4; w++) {
      const wa = 0.8 + w * 1.55;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.12), glassWarm);
      win.position.set(ox + Math.sin(wa) * 2.75, dy + 4.6 + (w % 2) * 1.6, oz + Math.cos(wa) * 2.75);
      win.rotation.y = wa;
      cityGroup.add(win);
    }
    // the DOME, split with an observing slit
    const domeMat2 = F(0x4a7a8a, { roughness: 0.6 });
    for (const sx of [-1, 1]) {
      const half = new THREE.Mesh(
        new THREE.SphereGeometry(3.1, 12, 8, sx > 0 ? 0.22 : Math.PI + 0.22, Math.PI - 0.44, 0, Math.PI / 2),
        domeMat2
      );
      half.position.set(ox, dy + 8.2, oz);
      half.castShadow = true;
      cityGroup.add(half);
    }
    // the great telescope, aimed through the slit at the sky
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 7, 10), F(0x6a5a48, { roughness: 0.5, metalness: 0.3 }));
    tube.rotation.x = -0.75;
    tube.position.set(ox, dy + 10.3, oz + 1.8);
    cityGroup.add(tube);
    const tubeRim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 6, 12), F(0xc9a04a, { metalness: 0.5, roughness: 0.4 }));
    tubeRim.rotation.x = -0.75 + Math.PI / 2;
    tubeRim.position.set(ox, dy + 12.6, oz + 4.15);
    cityGroup.add(tubeRim);
    const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.1, 8), F(0x3a3430));
    eyepiece.rotation.x = -0.75;
    eyepiece.position.set(ox, dy + 7.6, oz - 0.9);
    cityGroup.add(eyepiece);

    // the crow's-nest LOOKOUT: a small high ring off the deck's edge
    const lx = canopy.tx + 6.5, lz = canopy.tz + 5.5;
    const nest = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 12), plank);
    nest.position.set(lx, dy + 4, lz);
    nest.castShadow = true;
    cityGroup.add(nest);
    const nestRail = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.12, 6, 18), bark);
    nestRail.rotation.x = Math.PI / 2;
    nestRail.position.set(lx, dy + 5.1, lz);
    cityGroup.add(nestRail);
    for (let i = 0; i < 3; i++) {
      const pa = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 4.2, 6), bark);
      leg.position.set(lx + Math.cos(pa) * 2, dy + 1.9, lz + Math.sin(pa) * 2);
      cityGroup.add(leg);
    }
    // steps up to the crow's nest
    for (let st = 0; st < 4; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.1), plank);
      step.position.set(lx - 3.6 + st * 0.6, dy + 0.9 + st * 0.95, lz - 3.6 + st * 0.7);
      cityGroup.add(step);
      platforms.push({ x: step.position.x, z: step.position.z, r: 1.1, y: step.position.y + 0.15 });
    }
    platforms.push({ x: lx, z: lz, r: 2.8, y: dy + 4.3 }); // the nest is a floor
    // the little brass spyglass on its tripod
    const spy = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.6, 8), F(0xc9a04a, { metalness: 0.6, roughness: 0.35 }));
    spy.rotation.x = -0.6;
    spy.rotation.y = 0.4;
    spy.position.set(lx, dy + 5.6, lz);
    cityGroup.add(spy);
    for (let i = 0; i < 3; i++) {
      const pa = 0.6 + (i / 3) * Math.PI * 2;
      const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 4), barkDark);
      tleg.rotation.z = Math.cos(pa) * 0.35;
      tleg.rotation.x = Math.sin(pa) * 0.35;
      tleg.position.set(lx + Math.cos(pa) * 0.3, dy + 4.9, lz + Math.sin(pa) * 0.3);
      cityGroup.add(tleg);
    }

    // pennants strung from the dome to the tea-blue watchtower
    const startP = new THREE.Vector3(ox, dy + 10.6, oz);
    const endP = new THREE.Vector3(canopy.tx - 5, dy + 8.5, canopy.tz - 3);
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      const px2 = startP.x + (endP.x - startP.x) * t;
      const py2 = startP.y + (endP.y - startP.y) * t - Math.sin(t * Math.PI) * 1.1;
      const pz2 = startP.z + (endP.z - startP.z) * t;
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.75, 3),
        F(roofCols[i % roofCols.length])
      );
      flag.rotation.x = Math.PI; // little triangle hanging point-down
      flag.position.set(px2, py2 - 0.4, pz2);
      cityGroup.add(flag);
    }

    // the name-plaque, facing the bridge from the Heartwood
    const hcPlaque = makePlaque("THE HIGHCANOPY", "Watch and learn");
    hcPlaque.position.set(canopy.tx - 8, dy + 3.2, canopy.tz - 6.5);
    hcPlaque.lookAt(heart.tx, dy + 2, heart.tz);
    cityGroup.add(hcPlaque);

    // a warm observatory light
    const obsLight = new THREE.PointLight(0xffc46a, 30, 22, 1.7);
    obsLight.position.set(ox, dy + 6, oz + 3);
    cityGroup.add(obsLight);
  }
  const leaves = greatTree(-95, 20, 40, 14, { homes: 0, roofOff: 2 }); // The Learning Leaves (school)

  // ================================================================
  //  📚  THE LEARNING LEAVES — the school in the branches, to the map:
  //  a peaked schoolhouse hall, twin purple-spired towers joined by a
  //  little bridge, the school bell, purple banners, and the plaque.
  // ================================================================
  {
    const dy = leaves.deckY + 0.3;
    const sx = leaves.tx, sz = leaves.tz;
    // the schoolhouse hall: peaked roof, big double door, round window
    const hall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 4.6), F(0xd8c49a));
    hall.position.set(sx + 1.5, dy + 1.6, sz + 2.5);
    hall.castShadow = true;
    cityGroup.add(hall);
    const hallRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.9, 2.6, 4), F(0x7a5a9a));
    hallRoof.rotation.y = Math.PI / 4;
    hallRoof.scale.z = 0.72;
    hallRoof.position.set(sx + 1.5, dy + 4.5, sz + 2.5);
    hallRoof.castShadow = true;
    cityGroup.add(hallRoof);
    for (const ddx of [-0.55, 0.55]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.14), barkDark);
      door.position.set(sx + 1.5 + ddx, dy + 1.05, sz + 4.85);
      cityGroup.add(door);
    }
    const roundWin = new THREE.Mesh(new THREE.CircleGeometry(0.66, 14), glassWarm);
    roundWin.position.set(sx + 1.5, dy + 3.6, sz + 4.83);
    cityGroup.add(roundWin);
    for (const wx of [-2.2, 2.2]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.9), glassWarm);
      win.position.set(sx + 1.5 + (wx > 0 ? 3.2 : -3.2), dy + 1.8, sz + 2.5);
      cityGroup.add(win);
    }
    // the twin purple towers, one taller, joined by a tiny plank bridge
    const twin = (tx3, tz3, h3) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.6, h3, 9), F(0xd8c49a));
      body.position.set(tx3, dy + h3 / 2, tz3);
      body.castShadow = true;
      cityGroup.add(body);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.9, h3 * 0.75, 9), F(0x7a5a9a));
      spire.position.set(tx3, dy + h3 + h3 * 0.37, tz3);
      spire.castShadow = true;
      cityGroup.add(spire);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.12), glassWarm);
      win.position.set(tx3, dy + h3 * 0.62, tz3 + 1.62);
      cityGroup.add(win);
      return { tx3, tz3, h3 };
    };
    const t1 = twin(sx - 4.2, sz - 2.6, 7.5);
    const t2 = twin(sx - 0.6, sz - 4.4, 5.4);
    // the little bridge between the twins
    const span = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.0), plank);
    span.position.set((t1.tx3 + t2.tx3) / 2, dy + 4.7, (t1.tz3 + t2.tz3) / 2);
    span.lookAt(t2.tx3, dy + 4.7, t2.tz3);
    span.rotation.y += Math.PI / 2;
    cityGroup.add(span);
    // the school bell on its post by the doors
    const bellPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.8, 6), bark);
    bellPost.position.set(sx + 5.6, dy + 1.4, sz + 4.2);
    const bellArm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.12), bark);
    bellArm.position.set(sx + 5.9, dy + 2.75, sz + 4.2);
    const bell2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.42, 8),
      F(0xc8a03a, { roughness: 0.4, metalness: 0.4 })
    );
    bell2.position.set(sx + 6.25, dy + 2.5, sz + 4.2);
    cityGroup.add(bellPost, bellArm, bell2);
    // purple banners hanging off the deck rim
    for (let i = 0; i < 3; i++) {
      const ba = Math.PI * 0.9 + i * 0.5;
      const banner = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.4, 0.08), F(i % 2 ? 0x7a5a9a : 0x9a7ab8));
      banner.position.set(sx + Math.cos(ba) * 13.4, dy - 1.4, sz + Math.sin(ba) * 13.4);
      banner.lookAt(sx, dy - 1.4, sz);
      cityGroup.add(banner);
      const bannerTip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 4), F(i % 2 ? 0x7a5a9a : 0x9a7ab8));
      bannerTip.rotation.x = Math.PI;
      bannerTip.position.set(sx + Math.cos(ba) * 13.4, dy - 2.9, sz + Math.sin(ba) * 13.4);
      cityGroup.add(bannerTip);
    }
    // the name-plaque facing the Heartwood bridge
    const llPlaque = makePlaque("THE LEARNING LEAVES", "Knowledge grows here", 7.4);
    llPlaque.position.set(sx + 9, dy + 3, sz - 3);
    llPlaque.lookAt(heart.tx, dy + 2.4, heart.tz);
    cityGroup.add(llPlaque);
    const llLight = new THREE.PointLight(0xffc46a, 26, 20, 1.7);
    llLight.position.set(sx + 1.5, dy + 3.4, sz + 4);
    cityGroup.add(llLight);
  }
  const mill = greatTree(-70, 100, 30, 13, { homes: 3, roofOff: 3 }); // The Millroot
  const green = greatTree(70, 105, 28, 15, { homes: 5, roofOff: 4 }); // The Greenhollow

  // ---- the Market Circle: a stone plaza + fountain at the very heart ----
  const plazaFloor = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 0.4, 32), F(0xbdae94));
  window.__plazaFloor = plazaFloor;
  plazaFloor.position.set(0, cityHeight(0, 0) + 0.2, 0);
  plazaFloor.receiveShadow = true;
  cityGroup.add(plazaFloor);
  for (let i = 0; i < 3; i++) {
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(10 + i * 8, 0.25, 5, 40), stone);
    ringM.rotation.x = Math.PI / 2; ringM.position.set(0, cityHeight(0, 0) + 0.42, 0);
    cityGroup.add(ringM);
  }
  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.6, 1.2, 16), stone);
  fBase.position.set(0, cityHeight(0, 0) + 0.6, 0);
  cityGroup.add(fBase);
  const fWater = new THREE.Mesh(new THREE.CircleGeometry(3.6, 20), F(0x4aa3c0, { emissive: 0x2a6a8a, emissiveIntensity: 0.4, roughness: 0.15 }));
  fWater.rotation.x = -Math.PI / 2; fWater.position.set(0, cityHeight(0, 0) + 1.25, 0);
  cityGroup.add(fWater);
  const fSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.4, 8), stone);
  fSpout.position.set(0, cityHeight(0, 0) + 2.4, 0);
  cityGroup.add(fSpout);
  // ================================================================
  //  🛍  MARKET CIRCLE — trade and gather, to the map: striped awning
  //  stalls with goods on the counters, the fountain monument, and
  //  strings of festival lights criss-crossing the plaza.
  // ================================================================
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const sx = Math.cos(a) * 24, sz = Math.sin(a) * 24, sy = cityHeight(sx, sz);
    const col = roofCols[i % roofCols.length];
    // counter + four legs
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 1.5), plank);
    counter.position.set(sx, sy + 1.05, sz);
    counter.rotation.y = -a;
    cityGroup.add(counter);
    for (const [dx, dz2] of [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.3, 5), bark);
      const lx2 = sx + Math.cos(-a) * dx - Math.sin(-a) * dz2;
      const lz2 = sz + Math.sin(-a) * dx + Math.cos(-a) * dz2;
      leg.position.set(lx2, sy + 1.15, lz2);
      cityGroup.add(leg);
    }
    // STRIPED awning: alternating colored and cream slats, gently tilted
    for (let st = 0; st < 5; st++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 1.9), st % 2 ? F(0xe8dcc0) : F(col));
      const off = (st - 2) * 0.55;
      slat.position.set(sx + Math.cos(-a) * off, sy + 2.42 - Math.abs(off) * 0.06, sz + Math.sin(-a) * off);
      slat.rotation.y = -a;
      slat.rotation.x = 0.22;
      cityGroup.add(slat);
    }
    // goods on the counter: a basket of bright wares + a stack
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.3, 8), F(0xb08a4a));
    basket.position.set(sx + Math.cos(-a) * 0.6, sy + 1.3, sz + Math.sin(-a) * 0.6);
    cityGroup.add(basket);
    for (let g2 = 0; g2 < 3; g2++) {
      const fruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), F([0xc94a3a, 0xe8a53a, 0x7a4fa8][(g2 + i) % 3]));
      fruit.position.set(
        sx + Math.cos(-a) * 0.6 + (g2 - 1) * 0.14,
        sy + 1.5,
        sz + Math.sin(-a) * 0.6 + ((g2 * 7) % 2) * 0.12
      );
      cityGroup.add(fruit);
    }
    const sack2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), F(0x9a8a6a));
    sack2.scale.y = 0.8;
    sack2.position.set(sx - Math.cos(-a) * 0.7, sy + 1.35, sz - Math.sin(-a) * 0.7);
    cityGroup.add(sack2);
    outsideCityCol.push({ x: sx, z: sz, r: 1.2 });
  }
  // the fountain monument: a slender stone spire rising from the water
  const monu = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 4.2, 8), stone);
  monu.position.set(0, cityHeight(0, 0) + 3.2, 0);
  cityGroup.add(monu);
  const monuTop = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 8), stone);
  monuTop.position.set(0, cityHeight(0, 0) + 5.9, 0);
  cityGroup.add(monuTop);
  const monuGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), F(0x9fd8ff, { emissive: 0x5fb8f0, emissiveIntensity: 1.2 }));
  monuGem.position.set(0, cityHeight(0, 0) + 7, 0);
  cityGroup.add(monuGem);
  // festival light-strings criss-crossing the plaza on four posts
  {
    const postR = 30;
    const posts = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px2 = Math.cos(a) * postR, pz2 = Math.sin(a) * postR;
      const py2 = cityHeight(px2, pz2);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 6), bark);
      post.position.set(px2, py2 + 2.5, pz2);
      cityGroup.add(post);
      posts.push(new THREE.Vector3(px2, py2 + 5, pz2));
    }
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
    for (const [a2, b2] of pairs) {
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const px2 = posts[a2].x + (posts[b2].x - posts[a2].x) * t;
        const py2 = posts[a2].y + (posts[b2].y - posts[a2].y) * t - Math.sin(t * Math.PI) * 1.6;
        const pz2 = posts[a2].z + (posts[b2].z - posts[a2].z) * t;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), glassWarm);
        bulb.position.set(px2, py2, pz2);
        cityGroup.add(bulb);
      }
    }
  }
  // the plaza's plaque on the fountain rim
  const mcPlaque = makePlaque("MARKET CIRCLE", "Trade and gather", 5.6);
  mcPlaque.position.set(0, cityHeight(0, 0) + 2.2, 6.2);
  cityGroup.add(mcPlaque);

  // ---- wooden BRIDGES arcing between the great trees ----
  const bridge = (A, B) => {
    const steps = Math.ceil(Math.hypot(B.tx - A.tx, B.tz - A.tz) / 2.1); // planks nearly touch
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = A.tx + (B.tx - A.tx) * t;
      const z = A.tz + (B.tz - A.tz) * t;
      const y = A.deckY + (B.deckY - A.deckY) * t + Math.sin(t * Math.PI) * 4; // gentle arc
      const plankM = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 1.6), plank);
      plankM.position.set(x, y, z);
      plankM.lookAt(B.tx, y, B.tz);
      plankM.castShadow = true;
      cityGroup.add(plankM);
      platforms.push({ x, z, r: 1.6, y: y + 0.12 }); // you can WALK the bridges
      // little lanterns strung along the way
      if (i % 4 === 2) {
        const bl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), glassWarm);
        bl.position.set(x, y + 1.6, z);
        cityGroup.add(bl);
      }
    }
  };
  bridge(heart, canopy);
  bridge(heart, leaves);
  bridge(heart, mill);
  bridge(heart, green);

  // ---- the Millroot waterwheel + a stream with a little waterfall ----
  const wheel = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), barkDark);
  hub.rotation.z = Math.PI / 2; wheel.add(hub);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 0.2), bark);
    spoke.rotation.x = a; wheel.add(spoke);
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.15), plank);
    paddle.position.set(0, Math.cos(a) * 2.5, Math.sin(a) * 2.5); wheel.add(paddle);
  }
  wheel.position.set(mill.tx + 15, cityHeight(mill.tx + 15, mill.tz + 6) + 2.4, mill.tz + 6);
  cityGroup.add(wheel);
  cityWheel = wheel;

  // ================================================================
  //  ⚙️  THE MILLROOT — work and craft, to the map: the green-roofed
  //  mill workshop driving the wheel, a smoking chimney, crates and
  //  barrels and a lumber pile, and the name-plaque out front.
  // ================================================================
  {
    const mx = mill.tx - 1, mz = mill.tz + 19; // beside the wheel & pond
    const my = cityHeight(mx, mz);
    // the workshop: cream walls, deep-green pyramid roof
    const shed = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.2, 5.6), F(0xd8c49a));
    shed.position.set(mx, my + 2.1, mz);
    shed.castShadow = true;
    cityGroup.add(shed);
    const shedRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 5.4, 3, 4), F(0x4a7a4a));
    shedRoof.rotation.y = Math.PI / 4;
    shedRoof.scale.z = 0.8;
    shedRoof.position.set(mx, my + 5.6, mz);
    shedRoof.castShadow = true;
    cityGroup.add(shedRoof);
    const shedDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.16), barkDark);
    shedDoor.position.set(mx + 3.8, my + 1.3, mz - 1);
    shedDoor.rotation.y = Math.PI / 2;
    cityGroup.add(shedDoor);
    for (const wz2 of [-1.6, 1.6]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.14), glassWarm);
      win.position.set(mx + wz2, my + 2.4, mz + 2.86);
      cityGroup.add(win);
    }
    // the stone chimney with lazy smoke puffs
    const chim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.4, 1.1), stone);
    chim.position.set(mx - 2.4, my + 6.4, mz - 1.4);
    cityGroup.add(chim);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d4, transparent: true, opacity: 0.4, depthWrite: false });
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + i * 0.3, 0), smokeMat);
      puff.position.set(mx - 2.4 + i * 0.4, my + 8.6 + i * 1.3, mz - 1.4 - i * 0.2);
      cityGroup.add(puff);
    }
    // the axle from the shed wall out to the waterwheel hub
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 7), barkDark);
    axle.rotation.z = Math.PI / 2;
    axle.rotation.y = 0.35;
    axle.position.set((mx + mill.tx + 15) / 2 + 1.5, my + 3, (mz + mill.tz + 6) / 2);
    cityGroup.add(axle);
    // crates, barrels, and the lumber pile
    for (const [cx2, cz2, cs] of [[mx - 5.2, mz + 1.2, 1.3], [mx - 5.4, mz - 1.0, 1.0], [mx - 4.6, mz + 0.2, 0.9]]) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(cs, cs, cs), plank);
      crate.position.set(cx2, my + cs / 2, cz2);
      crate.rotation.y = cx2 * 1.7;
      crate.castShadow = true;
      cityGroup.add(crate);
    }
    for (const bx2 of [0, 1.4]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.35, 9), F(0x8a6238));
      barrel.position.set(mx - 5 + bx2, my + 0.68, mz + 3.4);
      barrel.castShadow = true;
      cityGroup.add(barrel);
    }
    for (let i = 0; i < 5; i++) {
      const row = i < 3 ? 0 : 1;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4.6, 7), bark);
      log.rotation.x = Math.PI / 2;
      log.position.set(mx + 2 + (row ? 0.4 : 0), my + 0.4 + row * 0.72, mz - 3.6 - (i % 3) * 0.85 + row * 0.4);
      log.rotation.z = Math.PI / 2;
      cityGroup.add(log);
    }
    // the plaque out front
    const mrPlaque = makePlaque("THE MILLROOT", "Work and craft");
    mrPlaque.position.set(mx + 1, my + 4.6, mz + 3.1);
    cityGroup.add(mrPlaque);
    const mrLight = new THREE.PointLight(0xffc46a, 24, 18, 1.7);
    mrLight.position.set(mx + 2, my + 3, mz + 3.5);
    cityGroup.add(mrLight);
    // solid things
    outsideCityCol.push({ x: mx, z: mz, r: 4.4 }, { x: mx - 5, z: mz + 0.5, r: 1.6 }, { x: mx - 5, z: mz + 3.4, r: 1.2 });
  }
  // the millpond + stream
  const pondY = cityHeight(mill.tx + 18, mill.tz + 10);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(9, 24), F(0x4aa3c0, { emissive: 0x2a6a8a, emissiveIntensity: 0.35, roughness: 0.12 }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(mill.tx + 18, pondY + 0.45, mill.tz + 10);
  cityGroup.add(pond);

  // fireflies + pollen motes drifting through the golden air
  {
    const N = 220;
    const sp = new Float32Array(N * 3), ss = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * CITY_R * 0.8;
      sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = 2 + Math.random() * 30; sp[i * 3 + 2] = Math.sin(a) * r;
      ss[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float aSeed; uniform float uTime; varying float v;
        void main(){ vec3 p=position; p.x+=sin(uTime*0.25+aSeed*30.0)*4.0; p.y+=sin(uTime*0.4+aSeed*17.0)*2.0; p.z+=cos(uTime*0.22+aSeed*23.0)*4.0;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=clamp(160.0/max(-mv.z,1.0),1.5,5.0); v=0.4+0.6*pow(0.5+0.5*sin(uTime*1.2+aSeed*50.0),2.0); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float v; void main(){ vec2 c=gl_PointCoord*2.0-1.0; if(dot(c,c)>1.0)discard;
        gl_FragColor=vec4(vec3(1.0,0.92,0.6), smoothstep(1.0,0.0,dot(c,c))*v*0.7); }`,
    });
    const motes = new THREE.Points(geo, mat);
    motes.frustumCulled = false;
    cityGroup.add(motes);
    cityFireflies = mat;
  }

  // 🌱 THE ROOT ENTRANCE home: a glowing archway back to the meadow
  const ggy = cityHeight(cityGate.x, cityGate.z);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3, 0.7, 8, 20, Math.PI), F(0x7a6a4a));
  arch.position.set(cityGate.x, ggy + 0.4, cityGate.z);
  cityGroup.add(arch);
  for (const sx of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 3.4, 8), stone);
    jamb.position.set(cityGate.x + sx * 3, ggy + 1.7, cityGate.z);
    cityGroup.add(jamb);
  }
  const warm = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  warm.position.set(cityGate.x, ggy + 2.4, cityGate.z);
  cityGroup.add(warm);
  const gateLight = new THREE.PointLight(0xffc46a, 60, 46, 1.6);
  gateLight.position.set(cityGate.x, ggy + 3, cityGate.z);
  cityGroup.add(gateLight);

  // ================================================================
  //  THE PICTURE PASS — everything the concept map shows:
  //  spiral ramps, the Grand Library arch, spired towers, waterfalls,
  //  the river + Hollowbrook Docks, Greenhollow gardens, deep forest.
  // ================================================================

  // ---- winding plank ramps spiraling up the great trunks (walkable!) ----
  const spiralRamp = (tree, turns = 1.7, phase = Math.PI * 0.5) => {
    const rise = tree.deckY - tree.gy;
    const n = Math.ceil(rise / 1.9);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = phase + t * Math.PI * 2 * turns;
      const trunkR = tree.deckR * 0.55 * (1 - t * 0.4);
      const rr = trunkR + 2.4;
      const x = tree.tx + Math.cos(a) * rr;
      const z = tree.tz + Math.sin(a) * rr;
      const y = tree.gy + t * rise;
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 2.8), plank);
      step.position.set(x, y, z);
      step.rotation.y = -a;
      step.castShadow = true;
      step.receiveShadow = true;
      cityGroup.add(step);
      platforms.push({ x, z, r: 2.0, y: y + 0.2 });
      if (i % 3 === 0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 5), bark);
        post.position.set(tree.tx + Math.cos(a) * (rr + 1.5), y + 0.65, tree.tz + Math.sin(a) * (rr + 1.5));
        cityGroup.add(post);
      }
    }
  };
  spiralRamp(heart, 1.9, Math.PI * 0.6); // the grand ramp of the Heartwood
  spiralRamp(green, 1.3, 0.4);
  spiralRamp(leaves, 1.4, 2.2);

  // ================================================================
  //  🏛  THE HEARTWOOD — matched to the map, piece by piece:
  //  a grand terrace partway up the trunk, the huge glowing arch of
  //  the GRAND LIBRARY with book-lined walls inside, lanterns, the
  //  name plaque, a crown of canopy bigger than any other tree,
  //  shelf-fungi, hanging vines, and windows spiraling the bark.
  // ================================================================
  {
    const trunkRAt = (y) => 24 * 0.55 * (1 - (y / 46) * 0.4); // heart's taper
    const ty = heart.gy + 15; // the terrace level
    const faceR = trunkRAt(15);
    const faceZ = heart.tz + faceR; // south face of the trunk

    // --- the broad terrace jutting out over the plaza ---
    const terrace = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 0.7, 22, 1, false, Math.PI * 1.5, Math.PI), plank);
    terrace.position.set(heart.tx, ty, faceZ - 1);
    terrace.castShadow = true;
    terrace.receiveShadow = true;
    cityGroup.add(terrace);
    // full disc underneath so it reads solid from below
    const terraceUnder = new THREE.Mesh(new THREE.CylinderGeometry(10.6, 8.5, 0.5, 22), barkDark);
    terraceUnder.position.set(heart.tx, ty - 0.5, faceZ - 1);
    cityGroup.add(terraceUnder);
    // railing arc around the terrace lip
    const railArc = new THREE.Mesh(new THREE.TorusGeometry(10.3, 0.16, 6, 24, Math.PI), bark);
    railArc.rotation.x = Math.PI / 2;
    railArc.rotation.z = Math.PI; // the open side hugs the trunk
    railArc.position.set(heart.tx, ty + 1.15, faceZ - 1);
    cityGroup.add(railArc);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.2, 5), bark);
      post.position.set(heart.tx + Math.cos(a) * 10.3, ty + 0.6, faceZ - 1 - Math.sin(a) * 10.3);
      cityGroup.add(post);
    }
    // two great root-struts propping the terrace from below
    for (const sx of [-1, 1]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 15, 7), barkDark);
      strut.position.set(heart.tx + sx * 6.5, ty - 7.2, faceZ + 2.4);
      strut.rotation.x = 0.42;
      strut.rotation.z = -sx * 0.22;
      strut.castShadow = true;
      cityGroup.add(strut);
    }
    // the terrace is a real floor (the spiral ramp passes right by it)
    platforms.push({ x: heart.tx, z: faceZ - 1, r: 10.4, y: ty + 0.55 });

    // --- THE GRAND ARCH: the library's glowing doorway in the trunk ---
    const archR = 5.6;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(archR, 1.15, 9, 22, Math.PI), barkDark);
    arch.position.set(heart.tx, ty + 0.4, faceZ + 0.9); // proud of the bark
    cityGroup.add(arch);
    // carved rings around the arch, like grown wood
    const arch2 = new THREE.Mesh(new THREE.TorusGeometry(archR + 1.35, 0.45, 7, 22, Math.PI), bark);
    arch2.position.set(heart.tx, ty + 0.4, faceZ + 0.75);
    cityGroup.add(arch2);
    // the dark hall mouth
    // the dark of the hall sits BEHIND the bookshelves, so the arch
    // frames lamplit books on darkness — like looking into the library
    const mouth = new THREE.Mesh(
      new THREE.CircleGeometry(archR + 0.6, 22, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x140b06 })
    );
    mouth.position.set(heart.tx, ty + 0.4, faceZ - 0.1); // the dark of the hall
    cityGroup.add(mouth);
    const mouthBase = new THREE.Mesh(
      new THREE.PlaneGeometry(archR * 2 + 1.2, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x140b06 })
    );
    mouthBase.position.set(heart.tx, ty + 0.2, faceZ - 0.1);
    cityGroup.add(mouthBase);
    // a wooden hall floor between the door and the shelves
    const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(archR * 2 + 1, 0.3, 2.2), plank);
    hallFloor.position.set(heart.tx, ty + 0.35, faceZ + 0.45);
    cityGroup.add(hallFloor);

    // --- inside: the BOOK WALL, rows of little colored spines, lamplit ---
    const spineCols = [0xa8434f, 0x3f6fa8, 0x4a8a4f, 0xc9a04a, 0x7a4fa8, 0x9a5a3a, 0xb0703a, 0x4a7a8a];
    for (let row = 0; row < 3; row++) {
      const shelfY = ty + 0.9 + row * 1.55;
      const board = new THREE.Mesh(new THREE.BoxGeometry(8.4 - row * 1.2, 0.18, 0.9), bark);
      board.position.set(heart.tx, shelfY - 0.62, faceZ + 0.2);
      cityGroup.add(board);
      const count = 11 - row * 2;
      for (let b = 0; b < count; b++) {
        const w2 = 0.55 + ((b * 7 + row * 3) % 3) * 0.1;
        const h2 = 1.0 + ((b * 5 + row) % 3) * 0.12;
        const spineM = new THREE.Mesh(
          new THREE.BoxGeometry(w2, h2, 0.42),
          F(spineCols[(b + row * 3) % spineCols.length], { roughness: 0.8 })
        );
        const rowW = 8.0 - row * 1.2;
        spineM.position.set(heart.tx - rowW / 2 + (b + 0.5) * (rowW / count), shelfY + h2 / 2 - 0.55, faceZ + 0.35);
        spineM.rotation.z = (((b * 13 + row * 7) % 5) - 2) * 0.02;
        cityGroup.add(spineM);
      }
    }
    // the warm lamplight spilling out of the hall
    const hall = new THREE.PointLight(0xffbe52, 60, 30, 1.6);
    hall.position.set(heart.tx, ty + 4, faceZ + 1.6);
    cityGroup.add(hall);

    // --- lanterns flanking the door + one hanging in the arch peak ---
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.6, 6), bark);
      post.position.set(heart.tx + sx * (archR + 2.2), ty + 1.3, faceZ - 1.6);
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.55), glassWarm);
      cage.position.set(heart.tx + sx * (archR + 2.2), ty + 2.9, faceZ - 1.6);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), barkDark);
      cap.position.set(heart.tx + sx * (archR + 2.2), ty + 3.4, faceZ - 1.6);
      cityGroup.add(post, cage, cap);
    }
    const hangCord = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), barkDark);
    hangCord.position.set(heart.tx, ty + archR - 0.4, faceZ + 0.9);
    const hangLant = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), glassWarm);
    hangLant.position.set(heart.tx, ty + archR - 1.3, faceZ + 0.9);
    cityGroup.add(hangCord, hangLant);

    // --- the name plaque above the arch, just like the map's banner ---
    const plaque = signBoard("THE HEARTWOOD\nThe Great Heartwood", { w: 7.2, h: 2.1, style: "gold" });
    plaque.position.set(heart.tx, ty + archR + 3.4, faceZ - 1.5);
    plaque.rotation.x = -0.06;
    cityGroup.add(plaque);

    // --- glowing windows spiraling up the bark above the library ---
    for (let i = 0; i < 5; i++) {
      const t = 0.48 + i * 0.1;
      const wy = heart.gy + t * 46;
      const wa = -0.7 + i * 0.5;
      const wr = trunkRAt(t * 46) + 0.25;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.3), barkDark);
      frame.position.set(heart.tx + Math.sin(wa) * wr, wy, heart.tz + Math.cos(wa) * wr);
      frame.lookAt(heart.tx + Math.sin(wa) * (wr + 8), wy, heart.tz + Math.cos(wa) * (wr + 8));
      cityGroup.add(frame);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.34), glassWarm);
      glow.position.copy(frame.position);
      glow.quaternion.copy(frame.quaternion);
      cityGroup.add(glow);
    }

    // --- shelf-fungi brackets on the bark ---
    for (let i = 0; i < 4; i++) {
      const fa = 2.2 + i * 0.9;
      const fy = heart.gy + 6 + i * 7;
      const fr = trunkRAt(fy - heart.gy) + 0.3;
      const fungus = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4 - i * 0.15, 1.7 - i * 0.15, 0.4, 10, 1, false, 0, Math.PI),
        F(0xc9a878, { roughness: 0.9 })
      );
      fungus.position.set(heart.tx + Math.sin(fa) * fr, fy, heart.tz + Math.cos(fa) * fr);
      fungus.rotation.y = fa + Math.PI / 2;
      cityGroup.add(fungus);
    }

    // --- hanging vines trailing off the terrace lip and the arch ---
    const vineMat = F(0x4a7a3a, { roughness: 1 });
    for (let v = 0; v < 7; v++) {
      const va = Math.PI + (v / 6) * Math.PI;
      const vx = heart.tx + Math.cos(va) * 10.2;
      const vz = faceZ - 1 - Math.sin(va) * 10.2;
      const len = 2.5 + (v % 3) * 1.4;
      for (let li = 0; li < 5; li++) {
        const leafy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + (li % 2) * 0.08, 0), vineMat);
        leafy.position.set(vx + Math.sin(li * 2 + v) * 0.2, ty - 0.3 - (li / 4) * len, vz + Math.cos(li * 1.6 + v) * 0.2);
        leafy.scale.set(1, 0.6, 0.5);
        void leafy; // (no green leaves on the vines either)
      }
    }

    // --- the CROWN: (removed — the great trees have no leaves) ---
    for (let i = 0; i < 0; i++) {
      const ca = i * 2.399;
      const cr2 = 6 + (i % 4) * 7;
      const ball = new THREE.Mesh(
        new THREE.IcosahedronGeometry(13 + (i % 3) * 6, 0),
        i % 3 === 1 ? leafHi : leaf
      );
      ball.position.set(
        heart.tx + Math.cos(ca) * cr2,
        heart.deckY + 14 + (i % 3) * 9,
        heart.tz + Math.sin(ca) * cr2
      );
      ball.castShadow = true;
      cityGroup.add(ball);
    }
  }

  // ---- spired TOWERS, like the map's castle turrets ----
  const towerAt = (tx2, tz2, baseY, h, spireCol) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.0, h, 9), F(0xd8c49a));
    body.position.set(tx2, baseY + h / 2, tz2);
    body.castShadow = true;
    cityGroup.add(body);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(2.3, h * 0.8, 9), F(spireCol));
    spire.position.set(tx2, baseY + h + h * 0.4, tz2);
    spire.castShadow = true;
    cityGroup.add(spire);
    for (let w = 0; w < 3; w++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.1), glassWarm);
      const wa = w * 2.1;
      win.position.set(tx2 + Math.sin(wa) * 1.85, baseY + h * 0.3 + w * h * 0.25, tz2 + Math.cos(wa) * 1.85);
      win.rotation.y = wa;
      cityGroup.add(win);
    }
    // a little pennant flag on the spire tip
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 4), bark);
    pole.position.set(tx2, baseY + h + h * 0.8 + 0.8, tz2);
    cityGroup.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.05), F(spireCol));
    flag.position.set(tx2 + 0.6, baseY + h + h * 0.8 + 1.2, tz2);
    cityGroup.add(flag);
  };
  // Learning Leaves: the purple school towers…
  towerAt(leaves.tx - 5, leaves.tz + 3, leaves.deckY + 0.3, 7, 0x7a5a9a);
  towerAt(leaves.tx + 5.5, leaves.tz - 3, leaves.deckY + 0.3, 5, 0x9a7ab8);
  // …the Highcanopy's teal watchtower…
  towerAt(canopy.tx - 5, canopy.tz - 3, canopy.deckY + 0.3, 6, 0x4a7a8a);
  // …and the Millroot's green work-tower
  towerAt(mill.tx + 5, mill.tz - 4, mill.deckY + 0.3, 5, 0x6a8a4a);

  // ---- WATERFALLS pouring off the platforms, like the map ----
  const fallsMat2 = F(0xbfe8f0, { emissive: 0x5aa8c0, emissiveIntensity: 0.5, roughness: 0.15, transparent: true, opacity: 0.85 });
  const cityFall = (fx, fz, topY, botY, w = 4) => {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, topY - botY), fallsMat2);
    sheet.position.set(fx, (topY + botY) / 2, fz);
    sheet.material.side = THREE.DoubleSide;
    cityGroup.add(sheet);
    const splash = new THREE.Mesh(new THREE.CircleGeometry(w * 0.9, 14), fallsMat2);
    splash.rotation.x = -Math.PI / 2;
    splash.position.set(fx, botY + 0.25, fz);
    cityGroup.add(splash);
  };
  cityFall(leaves.tx + 12, leaves.tz + 6, leaves.deckY - 0.5, leaves.gy, 4.5); // Learning Leaves falls
  cityFall(mill.tx + 12.5, mill.tz + 7, mill.deckY - 0.5, mill.gy + 0.3, 3.5); // Millroot falls into the pond

  // ---- THE RIVER, arcing around the south to the Hollowbrook Docks ----
  const riverMat = F(0x4aa3c0, { emissive: 0x2a6a8a, emissiveIntensity: 0.4, roughness: 0.12 });
  {
    const segs = 40;
    const verts = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = 0.15 + (i / segs) * (Math.PI - 0.3); // a southern arc, west to east
      const rr = 118 + Math.sin(t * 5) * 8;
      const cx = Math.cos(Math.PI - t) * rr;
      const cz = 20 + Math.sin(t) * rr * 0.85;
      const dirx = Math.sin(Math.PI - t), dirz = Math.cos(t) * 0.85;
      const len = Math.hypot(dirx, dirz) || 1;
      const nx = -dirz / len, nz = dirx / len;
      for (const sd of [-1, 1]) {
        const px = cx + nx * sd * 5.5;
        const pz = cz + nz * sd * 5.5;
        verts.push(px, cityHeight(px, pz) + 0.22, pz);
      }
      if (i < segs) {
        const a2 = i * 2;
        idx.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    cityGroup.add(new THREE.Mesh(geo, riverMat));
  }

  // ---- THE HOLLOWBROOK DOCKS: pier, posts, and a little boat ----
  {
    const dx = 96, dz = 92; // where the river runs, south-east
    const dy = cityHeight(dx, dz);
    for (let i = 0; i < 5; i++) {
      const plankD = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.6), plank);
      plankD.position.set(dx - 6 + i * 1.7, dy + 0.9, dz - i * 0.9);
      plankD.rotation.y = 0.5;
      cityGroup.add(plankD);
      platforms.push({ x: plankD.position.x, z: plankD.position.z, r: 1.3, y: dy + 1.05 });
    }
    for (const [px2, pz2] of [[dx - 5, dz + 1], [dx + 1, dz - 3.6]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 6), barkDark);
      post.position.set(px2, dy + 1, pz2);
      cityGroup.add(post);
    }
    // the boat, moored and bobbing-still
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.9, 4.6, 7), barkDark);
    hull.rotation.z = Math.PI / 2;
    hull.rotation.y = 0.45;
    hull.scale.y = 0.62;
    hull.position.set(dx + 4.5, dy + 0.7, dz - 4.5);
    cityGroup.add(hull);
    const boatLant = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), glassWarm);
    boatLant.position.set(dx + 4.5, dy + 1.7, dz - 4.5);
    cityGroup.add(boatLant);
    const dockLight = new THREE.PointLight(0xffc46a, 30, 24, 1.7);
    dockLight.position.set(dx, dy + 2.5, dz);
    cityGroup.add(dockLight);
  }

  // ---- THE GREENHOLLOW gardens: blue-roofed homes + fenced veg plots ----
  {
    const gx = green.tx - 4, gz = green.tz + 26;
    for (let i = 0; i < 3; i++) {
      const hx = gx - 8 + i * 8, hz = gz + (i % 2) * 5;
      const hy = cityHeight(hx, hz);
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 3.4), F(0xd8c49a));
      body.position.set(hx, hy + 1.3, hz);
      body.castShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 2.2, 4), F(0x4a7a9a));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(hx, hy + 3.7, hz);
      roof.castShadow = true;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.1), glassWarm);
      win.position.set(hx, hy + 1.4, hz + 1.75);
      cityGroup.add(body, roof, win);
      outsideCityCol.push({ x: hx, z: hz, r: 2.4 });
    }
    // the garden: fence posts + tidy sprout rows + a pumpkin
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1, 5), bark);
      post.position.set(gx + 12 + Math.cos(a) * 5, cityHeight(gx + 12, gz) + 0.5, gz + Math.sin(a) * 4);
      cityGroup.add(post);
    }
    for (let i = 0; i < 8; i++) {
      const sx2 = gx + 9.5 + (i % 4) * 1.7, sz2 = gz - 1.5 + Math.floor(i / 4) * 3;
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 5), leafHi);
      sprout.position.set(sx2, cityHeight(sx2, sz2) + 0.45, sz2);
      cityGroup.add(sprout);
    }
    const pk = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), F(0xd8792a));
    pk.scale.y = 0.75;
    pk.position.set(gx + 14, cityHeight(gx + 14, gz + 2) + 0.5, gz + 2);
    cityGroup.add(pk);
  }

  // ---- deeper forest inside the walls, so the city sits IN a wood ----
  for (let i = 0; i < 34; i++) {
    const a = i * 2.399 + 0.7;
    const r = CITY_R * (0.42 + ((i * 29) % 40) / 100);
    const px2 = Math.cos(a) * r, pz2 = Math.sin(a) * r;
    // keep clear of the plaza, decks, river-south and the gate
    if (Math.hypot(px2, pz2) < 80) continue;
    let nearDeck = false;
    for (const tt of [heart, canopy, leaves, mill, green]) {
      if (Math.hypot(px2 - tt.tx, pz2 - tt.tz) < 26) nearDeck = true;
    }
    if (nearDeck) continue;
    if (Math.hypot(px2 - cityGate.x, pz2 - cityGate.z) < 22) continue;
    pine(px2, pz2, 1.6 + (i % 3) * 0.7, i % 2 === 0);
  }

  // merge the deck floors + trunk climbers into the live collider set
  cityPlatforms = platforms;
  cityTrunks = trunks;
}
let cityWheel = null;
let cityPlatforms = [];
let cityTrunks = [];
const outsideCityCol = []; // solid stalls etc. in the city

// homeCluster's push helper (unused placeholder kept simple)
function return_g_push() {}

let museum = null; // 🏛️ the Museum & Gallery of the Alliance (cityLife.js)
function goEverbough() {
  world = "everbough";
  tunnels.group.visible = false;
  if (roothaven) roothaven.group.visible = false;
  hideCities();
  sitting = null;
  if (!cityBuilt) {
    buildEverbough();
    museum = initMuseum(cityGroup, cityFloor, {
      chime: () => story && story.chime(),
      addCollider: (x, z, r) => outsideCityCol.push({ x, z, r }),
    });
    // ✨ the Fur Dye Salon + Tailor Bobbin's capes
    const shops = initEverboughShops(cityGroup, cityFloor, {
      chime: () => story && story.chime(),
      // (the Market Circle stalls buy from your pack too)
      packList: () => Object.entries(inventory),
      packCount: (it) => inventory[keyOf(it)] || 0,
      packTake: (it, n) => {
        inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
        packChanged();
      },
      iconFor: (k) => ITEM_ICON[k] || "📦",
      heal: (n) => (health = Math.min(100, health + n)),
      say: owlSay,
      addCollider: (x, z, r) => outsideCityCol.push({ x, z, r }),
      enterHome: (id, back) => enterHome(id, back),
    });
    const m0 = museum;
    museum = { interactable: (p) => m0.interactable(p) || shops.interactable(p) };
  }
  denGroup.visible = false;
  outsideGroup.visible = false;
  skyDome.visible = false;
  caveGroup.visible = false;
  cityGroup.visible = true;
  scene.background = new THREE.Color(0xbcd8ea);
  scene.fog = new THREE.FogExp2(0xcfe0ea, 0.0016);
  // (the N64 look has no tone-mapping, so it needs far gentler light —
  // the full-strength sun washed the grass out to sky-white)
  ambientLight.intensity = 0.42;
  ambientLight.color.set(0xffe9c4);
  hemiLight.intensity = RETRO ? 0.75 : 0.95;
  hemiLight.color.set(0xcfe0ff);
  hemiLight.groundColor.set(0x5a6a34);
  sunLight.intensity = RETRO ? 1.9 : 2.6;
  sunLight.color.set(0xffedbe);
  sunLight.position.set(120, 180, 60);
  setSunShadowRange(70);
  // wake at the south of the Market Circle, looking north across the
  // fountain to the Heartwood — the whole city of branches ahead of you
  const sx = 0, sz = 52;
  mouseRig.position.set(sx, cityFloor(sx, sz), sz);
  mouseRig.rotation.y = Math.PI; // face north across the fountain to the city
  jumpVel = 0;
  stand = 0;
  if (cityDuskOn) applyCityDusk();
}
// 🏮 Lantern Night (Phase 8): Everbough at dusk
let cityDuskOn = false;
function applyCityDusk() {
  scene.background = new THREE.Color(0x221c38);
  scene.fog = new THREE.FogExp2(0x221c38, 0.0028);
  ambientLight.intensity = 0.32;
  ambientLight.color.set(0x9a90d0);
  hemiLight.intensity = 0.4;
  hemiLight.color.set(0x8a80c0);
  sunLight.intensity = 0.6;
  sunLight.color.set(0xff9a5a);
}
function cityDusk(on) {
  cityDuskOn = on;
  if (on && world === "everbough") applyCityDusk();
}

// ------------------------------------------------------------
//  💎  THE WELL CAVE — climb down the Old Well and a huge crystal
//  cavern opens beneath the world: glowing moonstone clusters, an
//  underground pool, stalagmites, and one rope back to the sky.
// ------------------------------------------------------------
const caveGroup = new THREE.Group();
caveGroup.visible = false;
scene.add(caveGroup);
const CAVE_R = 34;
const ropeSpot = new THREE.Vector3(0, 0, CAVE_R * 0.62);
const caveCrystals = []; // { mat, phase } for the twinkle
let caveBuilt = false;

function buildCave() {
  caveBuilt = true;
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a3f48, roughness: 1, flatShading: true, side: THREE.BackSide });

  // The cavern shell: a wide, noisy dome you're inside of.
  const shellGeo = new THREE.SphereGeometry(CAVE_R, 44, 28);
  const sp = shellGeo.attributes.position;
  const sv = new THREE.Vector3();
  for (let i = 0; i < sp.count; i++) {
    sv.set(sp.getX(i), sp.getY(i), sp.getZ(i));
    const n = 1 + (Math.sin(sv.x * 0.5) + Math.sin(sv.y * 0.7 + 2) + Math.sin(sv.z * 0.55 + 4)) * 0.05;
    sp.setXYZ(i, sv.x * n, sv.y * 0.62 * n + 6, sv.z * n); // squashed + lifted
  }
  shellGeo.computeVertexNormals();
  caveGroup.add(new THREE.Mesh(shellGeo, rockMat));

  // Floor: dark stone with faint glow-moss patches.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(CAVE_R * 0.98, 48),
    new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 1, flatShading: true })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  caveGroup.add(floor);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + i;
    const moss = new THREE.Mesh(
      new THREE.CircleGeometry(1 + (i % 3), 12),
      new THREE.MeshStandardMaterial({ color: 0x1e3a2a, emissive: 0x2a6a4a, emissiveIntensity: 0.5, roughness: 1 })
    );
    moss.rotation.x = -Math.PI / 2;
    moss.position.set(Math.cos(a) * (6 + (i * 7) % 18), 0.02, Math.sin(a) * (6 + (i * 5) % 16));
    caveGroup.add(moss);
  }

  // An underground pool, still and glowing faintly.
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(7, 32),
    new THREE.MeshStandardMaterial({ color: 0x0e2f42, emissive: 0x14506a, emissiveIntensity: 0.55, roughness: 0.15 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-CAVE_R * 0.4, 0.04, -CAVE_R * 0.25);
  caveGroup.add(pool);

  // Moonstone crystal clusters — the REAL crystal model ("Crystal" by
  // iPoly3D via Poly Pizza, CC0 — see models/props/CREDITS.txt), loaded
  // once and cloned everywhere, keeping its own colors but made to GLOW.
  let crystalBase = null;
  const crystalReady = new Promise((res) =>
    loadModelFile("/models/props/crystal.glb", (m) => {
      crystalBase = m;
      res();
    })
  );
  const mkCrystal = (r, x, z, tilt) => {
    const holder = new THREE.Group();
    holder.position.set(x, 0, z);
    holder.rotation.y = tilt * 2.3;
    caveGroup.add(holder);
    crystalReady.then(() => {
      const m = crystalBase.clone(true);
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(m).getSize(size);
      m.scale.setScalar((r * 2.4) / (size.y || 1));
      const b2 = new THREE.Box3().setFromObject(m);
      m.position.y = -b2.min.y;
      m.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.material = o.material.clone();
        o.material.color.set(0x9fd8ff); // moonstone
        o.material.emissive = new THREE.Color(0x3f88c8); // …with a blue heart
        o.material.emissiveIntensity = 1.0;
        caveCrystals.push({ mat: o.material, phase: x + z });
      });
      holder.add(m);
    });
  };
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + i * 0.7;
    const r = 8 + ((i * 13) % 20);
    mkCrystal(0.5 + (i % 4) * 0.45, Math.cos(a) * r, Math.sin(a) * r, i * 0.4);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    mkCrystal(2.6 + (i % 3), Math.cos(a) * CAVE_R * 0.72, Math.sin(a) * CAVE_R * 0.72, i);
  }

  // Stalagmites & stalactites.
  const stalMat = new THREE.MeshStandardMaterial({ color: 0x474d58, roughness: 1, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const a = i * 1.9;
    const r = 10 + ((i * 11) % 16);
    const h = 2.5 + (i % 5);
    const up = new THREE.Mesh(new THREE.ConeGeometry(0.8 + (i % 3) * 0.4, h, 7), stalMat);
    up.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    up.castShadow = true;
    caveGroup.add(up);
    const down = new THREE.Mesh(new THREE.ConeGeometry(0.6 + (i % 2) * 0.4, h * 0.8, 7), stalMat);
    down.rotation.x = Math.PI;
    down.position.set(Math.cos(a + 0.9) * r * 0.8, 14 + (i % 4), Math.sin(a + 0.9) * r * 0.8);
    caveGroup.add(down);
  }

  // The rope down from the well mouth, lit by a shaft of daylight.
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 22, 6),
    new THREE.MeshStandardMaterial({ color: 0xc9b06a, roughness: 1 })
  );
  rope.position.set(ropeSpot.x, 11, ropeSpot.z);
  caveGroup.add(rope);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 5, 22, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  shaft.position.set(ropeSpot.x, 11, ropeSpot.z);
  caveGroup.add(shaft);

  // ------------------------------------------------------------
  //  The concept-art dressing: turquoise water with stepping stones,
  //  terraced falls, a stone arch, the crescent rune stone, ivy,
  //  glowing mushrooms, lanterns, an open book — and the old stone
  //  mouse, holding its lantern for four hundred years.
  // ------------------------------------------------------------
  const caveRock = new THREE.MeshStandardMaterial({ color: 0x39404c, roughness: 1, flatShading: true });
  const glowTurq = new THREE.MeshStandardMaterial({
    color: 0x0e4440,
    emissive: 0x27c8b4,
    emissiveIntensity: 0.55,
    roughness: 0.12,
  });
  // the big turquoise pool fills the middle of the cavern
  const bigPool = new THREE.Mesh(new THREE.CircleGeometry(15, 30), glowTurq);
  bigPool.rotation.x = -Math.PI / 2;
  bigPool.position.set(-2, 0.06, -2);
  caveGroup.add(bigPool);
  // stepping stones from the rope landing across the water
  for (let i = 0; i < 6; i++) {
    const t = 0.3 + (i / 5) * 0.7; // start clear of the rope landing
    const sx = ropeSpot.x * (1 - t) + -6 * t + Math.sin(i * 2.3) * 1.6;
    const sz = ropeSpot.z * (1 - t) * 0.72 + -8 * t;
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 - (i % 2) * 0.3, 0), caveRock);
    stone.scale.y = 0.28;
    stone.position.set(sx, 0.32, sz);
    stone.rotation.y = i * 1.7;
    caveGroup.add(stone);
  }
  // terraced falls sliding down the west wall into the pool
  for (let tstep = 0; tstep < 4; tstep++) {
    const tx = -CAVE_R * 0.62 + tstep * 2.6;
    const ty = 7.5 - tstep * 2.1;
    const shelfR = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), caveRock);
    shelfR.scale.y = 0.5;
    shelfR.position.set(tx, ty - 1.2, -6);
    caveGroup.add(shelfR);
    const water = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 3.2), glowTurq);
    water.position.set(tx, ty, -6);
    caveGroup.add(water);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.3), glowTurq);
    sheet.position.set(tx + 1.3, ty - 1.1, -6);
    sheet.rotation.y = Math.PI / 2;
    caveGroup.add(sheet);
  }
  // the stone ARCH doorway (where the Tunnel Network begins…)
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.9, 8, 18, Math.PI), caveRock);
  arch.position.set(-CAVE_R * 0.52, 0.4, 13);
  arch.rotation.y = 0.9;
  caveGroup.add(arch);
  const dark = new THREE.Mesh(
    new THREE.CircleGeometry(3.1, 18),
    new THREE.MeshBasicMaterial({ color: 0x05070c })
  );
  dark.position.set(-CAVE_R * 0.52 - Math.sin(0.9) * 0.4, 2.6, 13 - Math.cos(0.9) * -0.4);
  dark.rotation.y = 0.9;
  caveGroup.add(dark);
  // the CRESCENT rune stone standing against the far wall
  const runeStoneMat = new THREE.MeshStandardMaterial({ color: 0x4a5260, roughness: 0.85, flatShading: true });
  const runeStone = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.9, 8.5, 10), runeStoneMat);
  runeStone.scale.z = 0.4;
  runeStone.position.set(10, 4.2, -CAVE_R * 0.62);
  caveGroup.add(runeStone);
  const silver = new THREE.MeshStandardMaterial({
    color: 0xcfd8de,
    emissive: 0x9fb8d0,
    emissiveIntensity: 0.75,
    side: THREE.DoubleSide,
  });
  const cres = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), silver);
  cres.position.set(10, 5.6, -CAVE_R * 0.62 + 1.62);
  caveGroup.add(cres);
  const bite2 = new THREE.Mesh(new THREE.CircleGeometry(1.28, 24), runeStoneMat.clone());
  bite2.position.set(10.6, 5.75, -CAVE_R * 0.62 + 1.66);
  caveGroup.add(bite2);
  for (let col = 0; col < 4; col++) {
    const rx = 10 + [-2.3, -1.6, 1.6, 2.3][col];
    for (let r = 0; r < 4; r++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.4, 0.06), silver);
      rune.position.set(rx, 1.6 + r * 0.85, -CAVE_R * 0.62 + 1.55);
      rune.rotation.z = ((col * 7 + r * 3) % 5 - 2) * 0.3;
      caveGroup.add(rune);
    }
  }
  // two smaller rune stones flanking it
  for (const sx of [-1, 1]) {
    const small = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 4.6, 8), runeStoneMat);
    small.scale.z = 0.45;
    small.position.set(10 + sx * 5.6, 2.3, -CAVE_R * 0.6);
    caveGroup.add(small);
  }
  // ivy trailing down the cavern walls
  const caveIvy = new THREE.MeshStandardMaterial({
    color: 0x2e6b34,
    emissive: 0x143a1e,
    emissiveIntensity: 0.3,
    roughness: 1,
    flatShading: true,
  });
  for (let sI = 0; sI < 16; sI++) {
    const a = (sI / 16) * Math.PI * 2 + 0.3;
    const wr = CAVE_R * 0.86;
    const top = 9 + (sI % 4) * 2;
    const len = 3 + (sI % 5);
    for (let li = 0; li < 6; li++) {
      const t2 = li / 5;
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + (li % 2) * 0.08, 0), caveIvy);
      leaf.position.set(
        Math.cos(a) * (wr - t2 * 1.2),
        top - t2 * len,
        Math.sin(a) * (wr - t2 * 1.2)
      );
      leaf.scale.set(1, 0.6, 0.5);
      caveGroup.add(leaf);
    }
  }
  // glowing mushrooms, teal and violet families
  const capTeal = new THREE.MeshStandardMaterial({ color: 0x2a6a60, emissive: 0x4ff0d0, emissiveIntensity: 1.2, roughness: 0.7, flatShading: true });
  const capViolet = new THREE.MeshStandardMaterial({ color: 0x4a3a6a, emissive: 0xb06af0, emissiveIntensity: 1.1, roughness: 0.7, flatShading: true });
  const stemPale = new THREE.MeshStandardMaterial({ color: 0xb9c4c8, roughness: 1 });
  for (let i = 0; i < 16; i++) {
    const a = i * 1.83;
    const rr = 16 + ((i * 7) % 13);
    const mx = Math.cos(a) * rr;
    const mz = Math.sin(a) * rr;
    const h = 0.5 + ((i * 13) % 10) / 12;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 6), stemPale);
    stem.position.set(mx, h / 2, mz);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 + ((i * 11) % 5) * 0.04, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      i % 3 === 2 ? capViolet : capTeal
    );
    cap.position.set(mx, h, mz);
    caveGroup.add(stem, cap);
  }
  // warm lanterns around the water
  const caveGlass = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb84a, emissiveIntensity: 2.2 });
  const caveWood = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 });
  for (const [llx, llz] of [[-16, 6], [14, -6], [4, 16], [-8, -14]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 6), caveWood);
    post.position.set(llx, 1.3, llz);
    const cage2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), caveGlass);
    cage2.position.set(llx, 2.9, llz);
    caveGroup.add(post, cage2);
  }
  const warmCave = new THREE.PointLight(0xffb060, 36, 20, 1.8);
  warmCave.position.set(14, 3.2, -6);
  caveGroup.add(warmCave);
  // the open book on its reading rock (someone was here before you)
  const bookRock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), caveRock);
  bookRock.scale.y = 0.5;
  bookRock.position.set(13, 0.5, 4);
  caveGroup.add(bookRock);
  const cavePage = new THREE.MeshStandardMaterial({ color: 0xf2e6c8, emissive: 0x8a7a50, emissiveIntensity: 0.3, roughness: 0.9 });
  for (const sx of [-1, 1]) {
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), cavePage);
    pg.rotation.x = -Math.PI / 2 + 0.12;
    pg.rotation.y = sx * 0.3;
    pg.position.set(13 + sx * 0.38, 1.36, 4);
    caveGroup.add(pg);
  }
  // the stone mouse, lantern raised, waiting patiently in the dark
  const stoneFur = new THREE.MeshStandardMaterial({ color: 0x6e747c, roughness: 0.95, flatShading: true });
  const statue = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.SphereGeometry(1.05, 9, 7), stoneFur);
  sBody.scale.set(0.9, 1.15, 0.85);
  sBody.position.y = 1.15;
  const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.7, 9, 7), stoneFur);
  sHead.position.set(0, 2.35, 0.25);
  statue.add(sBody, sHead);
  for (const sx of [-1, 1]) {
    const sEar = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), stoneFur);
    sEar.scale.z = 0.4;
    sEar.position.set(sx * 0.42, 2.95, 0.05);
    statue.add(sEar);
  }
  const sTail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 1.8, 5), stoneFur);
  sTail.rotation.x = 1.25;
  sTail.position.set(0, 0.5, -1.15);
  statue.add(sTail);
  const sArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 1.3, 6), stoneFur);
  sArm.rotation.z = -0.9;
  sArm.position.set(0.85, 1.9, 0.4);
  statue.add(sArm);
  const sLant = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), caveGlass);
  sLant.position.set(1.5, 1.7, 0.55);
  statue.add(sLant);
  statue.position.set(16.5, 0.7, 9);
  statue.rotation.y = -2.2; // gazing out over the water
  const statueBase = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 0), caveRock);
  statueBase.scale.y = 0.4;
  statueBase.position.set(16.5, 0.35, 9);
  caveGroup.add(statueBase, statue);

  // Cool blue cave light.
  for (const [lx, lz, i2] of [[0, 0, 8], [-14, -9, 9], [12, 10, 8], [ropeSpot.x, ropeSpot.z, 6]]) {
    const l = new THREE.PointLight(0x6fc0ff, i2, 46, 1.8);
    l.position.set(lx, 7, lz);
    caveGroup.add(l);
  }
}

function goCave() {
  world = "cave";
  tunnels.group.visible = false;
  if (roothaven) roothaven.group.visible = false;
  hideCities();
  sitting = null;
  if (!caveBuilt) buildCave();
  denGroup.visible = false;
  outsideGroup.visible = false;
  skyDome.visible = false;
  caveGroup.visible = true;
  scene.background = new THREE.Color(0x05080d);
  scene.fog = new THREE.Fog(0x05080d, 24, 95);
  ambientLight.intensity = 0.26;
  ambientLight.color.set(0x9fc4e0);
  hemiLight.intensity = 0.12;
  sunLight.intensity = 0;
  setSunShadowRange(CAVE_R);
  mouseRig.position.set(ropeSpot.x, 0, ropeSpot.z - 5.5); // clear of the rope
  mouseRig.rotation.y = Math.PI; // facing into the cavern
  jumpVel = 0;
  stand = 0;
}

function climbOutOfWell() {
  goOutside(); // restores sky, fog, and daylight
  if (wellPos) {
    const x = wellPos.x + 10;
    const z = wellPos.z + 2;
    mouseRig.position.set(x, terrainHeight(x, z), z);
  }
}

// ------------------------------------------------------------
//  🕳️  THE MOONKEEPER TUNNELS — a secret network under Everbough
//  (built in tunnels.js). In through the hole between the great tree's
//  roots; out by the root ladder, or up the rope into the Old Well cave.
// ------------------------------------------------------------
const tunnels = buildTunnels();
scene.add(tunnels.group);
// 🪨 ROOTHAVEN — the city under the forest (roothaven.js; Phase 6)
const roothaven = buildRoothaven();
scene.add(roothaven.group);
function goRoothaven() {
  world = "roothaven";
  hideCities();
  sitting = null;
  denGroup.visible = false;
  outsideGroup.visible = false;
  skyDome.visible = false;
  caveGroup.visible = false;
  cityGroup.visible = false;
  tunnels.group.visible = false;
  roothaven.group.visible = true;
  scene.background = new THREE.Color(0x0c0907);
  scene.fog = new THREE.Fog(0x0c0907, 40, 170);
  ambientLight.intensity = 0.8;
  ambientLight.color.set(0xffd8a8);
  hemiLight.intensity = 0.45;
  hemiLight.color.set(0xffe0b0);
  hemiLight.groundColor.set(0x3a2a20);
  sunLight.intensity = 0;
  const A = roothaven.spots.arrive;
  mouseRig.position.set(A.x, roothaven.height(A.x, A.z), A.z);
  mouseRig.rotation.y = A.face;
  jumpVel = 0;
  stand = 0;
  snapCamera();
}
// ------------------------------------------------------------
//  🏙️  THE OTHER GREAT CITIES (cities.js) — Reedmere, Golden Hollow,
//  Frostpine. Built the first time you travel there.
// ------------------------------------------------------------
const cityState = { all: {}, current: null };
function getCity(id) {
  if (!cityState.all[id]) {
    const c = buildCity(id);
    scene.add(c.group);
    cityState.all[id] = c;
    // 🎪 markets, crowds, events, adventures (cityLife.js)
    // (Silverveil, the lost city, is quiet: no markets or races — extras.js tells its story)
    if (id === "silverveil" || CITY_INFO[id].zone) c.life = { interactable: () => null, eventRunning: () => false, leave() {}, update() {}, ownsRaft: () => id === "sea" }; // (⛵ out at sea you're always on your raft)
    else c.life = initCityLife(c, {
      mouse: mouseRig,
      say: owlSay,
      chime: () => story && story.chime(),
      heal: (n) => (health = Math.min(100, health + n)),
      addToPack: (it, n) => addToPack(it, n, true),
      packCount: (it) => inventory[keyOf(it)] || 0,
      packTake: (it, n) => {
        inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
        packChanged();
      },
      addRep: (city, n) => story && story.addRep(city, n),
      setRide: (r) => (rideMode = r),
      setRaceRaft: (on) => (raceRaft = on),
      placePlayer: (x, z, face) => placePlayer(x, z, face),
      bite: () => (biteTimer = BITE_TIME),
      packList: () => Object.entries(inventory),
      setNoRaft: (on) => (noRaft = on),
      petsChanged: () => pets.sync(),
      enterHome: (id, back) => enterHome(id, back),
      iconFor: (k) => ITEM_ICON[k] || (k === "fish" ? "🐟" : k === "ice crystal shard" ? "🧊" : k === "egg" ? "🥚" : "📦"),
    });
  }
  return cityState.all[id];
}
function hideCities() {
  if (typeof cityState === "undefined") return;
  if (cityState.current && cityState.current.life) cityState.current.life.leave(); // (stop any race)
  for (const c of Object.values(cityState.all)) c.group.visible = false;
  if (world !== "city") cityState.current = null;
  if (typeof homeState !== "undefined") for (const h of Object.values(homeState.all)) h.group.visible = false;
}
const CITY_LOOK = {
  reedmere: { bg: 0xa8c0c0, fog: 0.006, amb: 0.45, ambC: 0xe8f0e0, hemi: 0.7, sun: 1.6, sunC: 0xfff0d0 },
  golden: { bg: 0xf0d8a0, fog: 0.004, amb: 0.45, ambC: 0xffe8c0, hemi: 0.75, sun: 2.0, sunC: 0xffe0a0 },
  frostpine: { bg: 0xc8d8e8, fog: 0.008, amb: 0.5, ambC: 0xe0ecff, hemi: 0.6, sun: 1.2, sunC: 0xf0f4ff },
  silverveil: { bg: 0x2a2e4a, fog: 0.007, amb: 0.55, ambC: 0xc8d4ff, hemi: 0.55, sun: 0.9, sunC: 0xd8e0ff },
  peaks: { bg: 0xb8c8e0, fog: 0.0045, amb: 0.55, ambC: 0xe8f0ff, hemi: 0.7, sun: 1.5, sunC: 0xfff4e0 },
  deep: { bg: 0x0b3a55, fog: 0.022, amb: 0.75, ambC: 0x8ad8ff, hemi: 0.5, sun: 0.6, sunC: 0x9fe8ff },
  aurora: { bg: 0x1a2448, fog: 0.0035, amb: 0.9, ambC: 0xc8d8ff, hemi: 0.6, sun: 0.7, sunC: 0xd8e8ff },
  sunrise: { bg: 0xf0c8a8, fog: 0.0028, amb: 0.75, ambC: 0xffe8d0, hemi: 0.8, sun: 1.6, sunC: 0xffd8b0 },
  pass: { bg: 0x2a3050, fog: 0.004, amb: 0.9, ambC: 0xdfe8ff, hemi: 0.75, sun: 0.9, sunC: 0xe8f0ff },
  castlehall: { bg: 0x3a3028, fog: 0.008, amb: 1.05, ambC: 0xffe8d0, hemi: 0.6, sun: 0.9, sunC: 0xfff0d8 },
  readingroom: { bg: 0x2a1a12, fog: 0.02, amb: 0.95, ambC: 0xffe0b0, hemi: 0.5, sun: 0.7, sunC: 0xffd8a0 },
  attic: { bg: 0x2a2018, fog: 0.025, amb: 0.9, ambC: 0xffe8c8, hemi: 0.5, sun: 0.6, sunC: 0xffe0b0 },
  rootchamber: { bg: 0x10180e, fog: 0.025, amb: 0.85, ambC: 0xbfe8b0, hemi: 0.4, sun: 0.4, sunC: 0xbfe8b0 },
  basement: { bg: 0x1a1a1e, fog: 0.025, amb: 0.85, ambC: 0xffe0c0, hemi: 0.45, sun: 0.5, sunC: 0xffd8a0 },
  smugglers: { bg: 0x1a0e05, fog: 0.02, amb: 0.9, ambC: 0xffd0a0, hemi: 0.4, sun: 0.6, sunC: 0xffc080 },
  crystalgrotto: { bg: 0x1a1030, fog: 0.02, amb: 1.0, ambC: 0xd8c8ff, hemi: 0.5, sun: 0.7, sunC: 0xe8d8ff },
  icecave: { bg: 0x9fc8e8, fog: 0.02, amb: 1.1, ambC: 0xdff0ff, hemi: 0.7, sun: 0.8, sunC: 0xffffff },
  lostvillage: { bg: 0xb8bcc8, fog: 0.035, amb: 1, ambC: 0xe8ecff, hemi: 0.7, sun: 0.6, sunC: 0xf0f0ff },
  shadowmere: { bg: 0x1a1a2a, fog: 0.022, amb: 0.75, ambC: 0x9aa8d8, hemi: 0.4, sun: 0.35, sunC: 0xb8c0e8 },
  clockwork: { bg: 0x4a3626, fog: 0.006, amb: 1.1, ambC: 0xffe0b8, hemi: 0.7, sun: 1.3, sunC: 0xffd098 },
  coral: { bg: 0x0e4a6a, fog: 0.016, amb: 0.95, ambC: 0x9fe0ff, hemi: 0.55, sun: 0.7, sunC: 0xbff0ff },
  trophies: { bg: 0x2a1a14, fog: 0.012, amb: 0.95, ambC: 0xffe0c0, hemi: 0.5, sun: 0.7, sunC: 0xffd8a0 },
  rink: { bg: 0x2a3a5a, fog: 0.008, amb: 0.95, ambC: 0xdfe8ff, hemi: 0.75, sun: 0.9, sunC: 0xfff0e0 },
  pyramid: { bg: 0x1a120a, fog: 0.02, amb: 0.75, ambC: 0xffd8a0, hemi: 0.45, sun: 0.4, sunC: 0xffc880 },
  dunes: { bg: 0xf0d8a8, fog: 0.0035, amb: 0.85, ambC: 0xfff0d8, hemi: 0.8, sun: 1.9, sunC: 0xfff0c0 },
  storm: { bg: 0x252a3c, fog: 0.006, amb: 0.7, ambC: 0xb8c8e8, hemi: 0.5, sun: 0.6, sunC: 0xc8d8ff },
  roost: { bg: 0xf0a888, fog: 0.003, amb: 0.8, ambC: 0xffe0d0, hemi: 0.75, sun: 1.5, sunC: 0xffc8a0 },
  isle: { bg: 0x141a26, fog: 0.012, amb: 0.55, ambC: 0x8a9ab8, hemi: 0.35, sun: 0.2, sunC: 0x8a9ab8 },
  cliffs: { bg: 0x6a6a9a, fog: 0.006, amb: 0.75, ambC: 0xd8d8ff, hemi: 0.6, sun: 1.0, sunC: 0xe8e8ff },
  starway: { bg: 0x0a0820, fog: 0.002, amb: 0.9, ambC: 0xc8c8ff, hemi: 0.6, sun: 0.6, sunC: 0xd8e0ff },
  circus: { bg: 0x2a1a2a, fog: 0.004, amb: 0.7, ambC: 0xffe8d0, hemi: 0.5, sun: 0.4, sunC: 0xffe0c0 },
  sea: { bg: 0x8ac8e8, fog: 0.003, amb: 0.7, ambC: 0xfff8e8, hemi: 0.8, sun: 1.6, sunC: 0xfff0d0 },
  vault: { bg: 0x14121c, fog: 0.012, amb: 0.75, ambC: 0xffe0c0, hemi: 0.4, sun: 0.3, sunC: 0xffd8a0 },
  cloud: { bg: 0x9fc8f0, fog: 0.004, amb: 0.85, ambC: 0xffffff, hemi: 0.8, sun: 1.5, sunC: 0xfff0d0 },
  sky: { bg: 0xf0a878, fog: 0.0028, amb: 0.75, ambC: 0xffd8b8, hemi: 0.8, sun: 1.6, sunC: 0xffc890 },
  underglow: { bg: 0x16123a, fog: 0.0065, amb: 0.95, ambC: 0x9a9ae8, hemi: 0.65, sun: 0.45, sunC: 0xbfa0ff },
};
CITY_LOOK.paradise = { bg: 0x9ad8ff, fog: 0.006, amb: 0.7, ambC: 0xfff0f0, hemi: 0.8, sun: 1.8, sunC: 0xfff0d0 }; // 🌺
CITY_LOOK.wispglade = { bg: 0x0a1018, fog: 0.022, amb: 0.65, ambC: 0xb8d8e8, hemi: 0.35, sun: 0.45, sunC: 0xc8e0ff }; // ✨ Phase 35
CITY_LOOK.giantgarden = { bg: 0x9ad0f0, fog: 0.007, amb: 0.75, ambC: 0xfff4e0, hemi: 0.75, sun: 1.6, sunC: 0xfff0c8 }; // 🌻 Phase 36
CITY_LOOK.amberwood = { bg: 0xe8b878, fog: 0.012, amb: 0.7, ambC: 0xffe0b8, hemi: 0.6, sun: 1.4, sunC: 0xffc888 }; // 🍂 Phase 37
CITY_LOOK.jungle = { bg: 0x7ab88a, fog: 0.016, amb: 0.65, ambC: 0xe0ffd8, hemi: 0.7, sun: 1.5, sunC: 0xfff4d0 }; // 🌴 Phase 38
CITY_LOOK.frozensea = { bg: 0xc8d8e8, fog: 0.02, amb: 0.8, ambC: 0xe8f4ff, hemi: 0.7, sun: 1.1, sunC: 0xe8f0ff }; // 👑 Phase 39
CITY_LOOK.falls = { bg: 0x9ac8e8, fog: 0.006, amb: 0.65, ambC: 0xfff4e0, hemi: 0.8, sun: 1.7, sunC: 0xfff0d0 }; // 🌈 Phase 34
CITY_LOOK.skycup = { bg: 0x8ac8f0, fog: 0.004, amb: 0.7, ambC: 0xfff0e0, hemi: 0.8, sun: 1.8, sunC: 0xfff0d0 }; // 🏆 Phase 32
CITY_LOOK.crystal = { bg: 0x0c0818, fog: 0.014, amb: 0.6, ambC: 0xc8b8ff, hemi: 0.35, sun: 0.4, sunC: 0xb8d8ff }; // 💎 Phase 31
CITY_LOOK.glowcap = { bg: 0x0a0818, fog: 0.018, amb: 0.55, ambC: 0xb8a8ff, hemi: 0.35, sun: 0.35, sunC: 0x9ad8ff }; // 🍄 Phase 30
CITY_LOOK.cinder = { bg: 0x3a1a10, fog: 0.012, amb: 0.6, ambC: 0xffb080, hemi: 0.5, sun: 1.2, sunC: 0xffa060 }; // 🌋 (for Phase 33)
// 🗝️ the Even More Secret Places each have their own light
for (const p of PLACES) CITY_LOOK[p.room] = { bg: p.theme.bg, fog: p.theme.wall === null ? 0.012 : 0.02, amb: 1.0, ambC: p.theme.light, hemi: 0.6, sun: 0.8, sunC: p.theme.light };
function goCity(id) {
  const c = getCity(id);
  world = "city";
  sitting = null;
  denGroup.visible = false;
  outsideGroup.visible = false;
  skyDome.visible = false;
  caveGroup.visible = false;
  cityGroup.visible = false;
  tunnels.group.visible = false;
  roothaven.group.visible = false;
  for (const o of Object.values(cityState.all)) o.group.visible = o === c;
  // (leaving a room — e.g. through the secret wall in Dapple's Stable — must hide it,
  //  or that room stays drawn in the middle of every city and zone you visit)
  try {
    for (const h of Object.values(homeState.all)) h.group.visible = false;
    homeState.current = null;
  } catch {} // (homeState isn't made yet on the very first load)
  cityState.current = c;
  const L = CITY_LOOK[id];
  scene.background = new THREE.Color(L.bg);
  scene.fog = new THREE.FogExp2(L.bg, L.fog * CLEAR_AIR); // (thinned — far things stay CLEAR, not hazy)
  ambientLight.intensity = L.amb;
  ambientLight.color.set(L.ambC);
  hemiLight.intensity = L.hemi;
  hemiLight.color.set(0xdde8ff);
  hemiLight.groundColor.set(0x6a5a3a);
  sunLight.intensity = L.sun;
  sunLight.color.set(L.sunC);
  sunLight.position.set(60, 120, 40);
  const A = c.spots.arrive || { x: 0, z: 0 }; // (never crash here — a crash mid-fade = a black screen)
  mouseRig.position.set(A.x, c.height(A.x, A.z), A.z);
  mouseRig.rotation.y = Math.PI; // facing into the city
  jumpVel = 0;
  stand = 0;
  snapCamera();
}
// 🛶 the reed raft (Reedmere): on the water you paddle fast
let raftOn = false;
let raceRaft = false; // (the Raft Race lends you one)
let rideMode = null; // { speed, sled } — the sled race: always moving, A/D steer
let noRaft = false; // (the Lagoon Swim: no rafts!)
const raftActive = () =>
  !noRaft && (raftOn || raceRaft || !!(world === "city" && cityState.current && cityState.current.life && cityState.current.life.ownsRaft()));
// 🛷 CAPS LOCK on snow: belly-sledding! Zoom around on your stomach
// across the snow, as fast as Reedmere's raft. (anywhere snowy.)
let capsLock = false;
const trackCaps = (e) => {
  if (e.getModifierState) capsLock = window.__wwForceCaps ?? e.getModifierState("CapsLock"); // (tests can hold Caps Lock on)
};
window.addEventListener("keydown", trackCaps);
window.addEventListener("keyup", trackCaps);
const SNOWY = ["frostpine", "pass", "aurora", "peaks", "rink"];
const bellySledding = () => capsLock && world === "city" && cityState.current && (SNOWY.includes(cityState.current.id) || (window.__wwSandboard && cityState.current.id === "dunes")) && !rideMode; // (🏜️ sandboarding too)
const sledMesh = new THREE.Group();
{
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, flatShading: true });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.4), wood);
  seat.position.y = 0.18;
  sledMesh.add(seat);
  for (const sx of [-0.3, 0.3]) {
    // low runners under the seat, curling up at the front
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.5), new THREE.MeshStandardMaterial({ color: 0x8a8a90 }));
    runner.position.set(sx, 0.06, 0);
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 4, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a8a90 }));
    curl.rotation.y = Math.PI / 2;
    curl.position.set(sx, 0.18, 0.75);
    sledMesh.add(runner, curl);
  }
  sledMesh.visible = false;
  scene.add(sledMesh);
}
/** 🏊 walking, swimming, or on the raft? (Sprig + your pet join in) */
const waterMode = () => (swimming ? (raft.visible ? "raft" : "swim") : "walk");
const raft = new THREE.Group();
{
  const reedMat = new THREE.MeshStandardMaterial({ color: 0xb8a86a, flatShading: true });
  for (let i = -3; i <= 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 6).rotateX(Math.PI / 2), reedMat);
    log.position.set(i * 0.2, 0, 0);
    raft.add(log);
  }
  raft.visible = false;
  scene.add(raft);
}

// 🌙 the Moonkeeper's Cloak (Phase 10): a cape the color of moonlit water
let cloak = null;
function setCloak(on) {
  if (!quadMouse) return;
  if (on && !cloak) {
    cloak = new THREE.Group();
    const cape = new THREE.Mesh(
      // a short shoulder CAPELET (over the robe's narrow top, so it shows —
      // and the Owl-Feather Cloak, if you wear it, flows out beneath it)
      new THREE.CylinderGeometry(0.15, 0.25, 0.24, 14, 1, true, Math.PI * 0.55, Math.PI * 0.9),
      new THREE.MeshStandardMaterial({ color: 0x3a5a8a, emissive: 0x1a2a4a, emissiveIntensity: 0.4, side: THREE.DoubleSide, flatShading: true })
    );
    cape.position.set(0, 0.46, -0.02); // (y 0.34 → 0.58: just the shoulders)
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 5, 18), new THREE.MeshBasicMaterial({ color: 0xd8e8ff }));
    trim.rotation.x = Math.PI / 2;
    trim.position.set(0, 0.58, 0);
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
    clasp.position.set(0, 0.57, 0.15);
    cloak.add(cape, trim, clasp);
    quadMouse.add(cloak);
  }
  if (cloak) cloak.visible = on;
}

// 🛤️ travel the Moonkeepers' roads
function travelTo(id) {
  fadeThrough(() => {
    if (id === "forest") goOutside();
    else if (id === "everbough") {
      goEverbough();
      placePlayer(8, 58, Math.PI);
    } else if (id === "roothaven") goRoothaven();
    else if (id === "silverveil" && !hasItem("silverclimbed")) {
      // 🧗 the only way to Silverveil (the first time): the Moonlit Cliffs
      goCity("cliffs");
      setTimeout(() => owlSay("🧗 THE MOONLIT CLIFFS — Silverveil sits on top of this sheer silver mountain. Climb the ledges! Gaps need a DOUBLE JUMP, dark cracked ledges CRUMBLE, and the wind… watch the wind.", true), 1200);
      return;
    } else goCity(id);
    const name = { forest: "the Great Forest", everbough: "Everbough", roothaven: "Roothaven" }[id] || CITY_INFO[id].name;
    window.dispatchEvent(new CustomEvent("ww-stat", { detail: { k: "travels" } }));
    owlSay(`🛤️ Along the Moonkeepers' road… to ${name}.`);
  }, 0.7);
}
function openRoads() {
  const T = story ? story.travelInfo() : { unlocked: ["forest"] };
  const here = world === "city" ? cityState.current.id : world === "outside" ? "forest" : world;
  const D = {
    forest: { icon: "🌲", name: "The Great Forest", sub: "home, the school, the Hollow" },
    everbough: { icon: "🌳", name: "Everbough", sub: "the City of Knowledge" },
    roothaven: { icon: "🪨", name: "Roothaven", sub: "the City of Builders" },
    reedmere: { icon: "🌊", name: "Reedmere", sub: "the Marsh City" },
    golden: { icon: "🌾", name: "Golden Hollow", sub: "the Plains City" },
    frostpine: { icon: "❄️", name: "Frostpine", sub: "the Northern City" },
    silverveil: { icon: "🌙", name: "Silverveil", sub: "the Lost Sixth City" },
  };
  openTravel(T.unlocked.map((id) => ({ id, ...D[id], here: id === here })), travelTo);
}
function travelInteract() {
  if (!story) return null;
  const T = story.travelInfo();
  if (T.unlocked.length < 3) return null; // (the roads open in Phase 9)
  const p = mouseRig.position;
  const act = { label: "travel the Moonkeepers' roads", act: openRoads };
  if (world === "city" && cityState.current) {
    const w = cityState.current.spots.waystone;
    if (Math.hypot(p.x - w.x, p.z - w.z) < 2.6) return act;
  }
  if (world === "everbough" && Math.hypot(p.x + 29, p.z - 4) < 2.6) return act;
  if (world === "roothaven" && Math.hypot(p.x - roothaven.spots.arrive.x, p.z - roothaven.spots.arrive.z) < 3) return act;
  if (world === "outside") for (const s2 of T.stations) if (Math.hypot(p.x - s2.x, p.z - s2.z) < 3.2) return act;
  return null;
}

// ------------------------------------------------------------
//  🏡  YOUR HOUSES (homes.js): bought for 100 coins in each Great City.
//  Inside: a cozy room, and hooks on the walls to hang your treasures.
// ------------------------------------------------------------
const homeState = { all: {}, current: null, back: null };
setRoomEnter((id, back) => enterHome(id, back)); // (shops, museum, cafés: walk right in)
function showHung(id, slots) {
  const hung = homeHung(id);
  slots.forEach((sl, i) => sl.show(hung[i] ? hung[i].icon : null, hung[i])); // (🖼️✨ as living paintings)
}
function enterHome(id, back) {
  pets.setRiding(false);
  const from = { world, cityId: world === "city" && cityState.current ? cityState.current.id : null, ...back };
  fadeThrough(() => {
    if (!homeState.all[id]) {
      homeState.all[id] = buildHomeInterior(id);
      scene.add(homeState.all[id].group);
    }
    const h = homeState.all[id];
    if (h.refresh) h.refresh();
    hideCities();
    denGroup.visible = outsideGroup.visible = skyDome.visible = caveGroup.visible = cityGroup.visible = false;
    tunnels.group.visible = roothaven.group.visible = false;
    world = "home";
    homeState.current = h;
    homeState.back = from;
    h.group.visible = true;
    showHung(id, h.slots);
    scene.background = new THREE.Color(0x1a120c);
    scene.fog = new THREE.Fog(0x1a120c, 10, 40);
    ambientLight.intensity = 0.55;
    ambientLight.color.set(0xffe0c0);
    hemiLight.intensity = 0.2;
    sunLight.intensity = 0;
    placePlayer(h.spawn.x, h.spawn.z, h.spawn.face);
    owlSay(h.slots.length ? `🏡 Welcome home — ${h.name}. Press E on a hook to hang something.` : `🚪 ${h.name}`);
  }, 0.5);
}
function leaveHome() {
  const b = homeState.back;
  fadeThrough(() => {
    homeState.current.group.visible = false;
    homeState.current = null;
    if (b.world === "city" && b.cityId) goCity(b.cityId);
    else if (b.world === "everbough") goEverbough();
    else if (b.world === "roothaven") goRoothaven();
    else goOutside();
    placePlayer(b.x, b.z, b.face ?? 0);
  }, 0.5);
}
function homeInteract() {
  const p = mouseRig.position;
  if (world === "home" && homeState.current) {
    const h = homeState.current;
    if (Math.hypot(p.x - h.door.x, p.z - h.door.z) < 1.6) return { label: "go back outside", act: leaveHome };
    const inside = h.interact && h.interact(p);
    if (inside) return inside;
    for (let i = 0; i < h.slots.length; i++) {
      const sl = h.slots[i];
      if (Math.hypot(p.x - sl.x, p.z - sl.z) < 1.4) {
        const cur = homeHung(h.id)[i];
        return { label: cur ? `change what's on this hook (${cur.icon})` : "hang something on this hook", act: () => openHangPicker(h.id, i, hangApi, () => showHung(h.id, h.slots)) };
      }
    }
  }
  if (world === "den") {
    for (let i = 0; i < denHooks.length; i++) {
      const sl = denHooks[i];
      if (Math.hypot(p.x - sl.x, p.z - sl.z) < 1.3) {
        const cur = homeHung("den")[i];
        return { label: cur ? `change what's on this hook (${cur.icon})` : "hang something on the wall", act: () => openHangPicker("den", i, hangApi, () => showHung("den", denHooks)) };
      }
    }
  }
  return null;
}
const hangApi = {
  chime: () => story && story.chime(),
  packList: () => Object.entries(inventory),
  packTake: (it, n) => {
    inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
    packChanged();
  },
  addToPack: (it, n) => addToPack(it, n, true),
  iconFor: (k) => ITEM_ICON[k] || (k === "fish" ? "🐟" : k === "ice crystal shard" ? "🧊" : k === "egg" ? "🥚" : "📦"),
};
// hooks on the den's own walls (between the exit, the stump and the bookshelf niches)
const denHooks = makeWallSlots(denGroup, { x: 0, z: 0 }, DEN_RADIUS, 2.6, [0.38, 0.55, 1.12, 1.3, 1.78].map((k) => k * Math.PI));
showHung("den", denHooks);
// Roothaven's house for sale (by the Archive)
let rhHouse = null;
function rhHouseInteract() {
  if (world !== "roothaven") return null;
  rhHouse ||= makeHouseForSale(roothaven.group, roothaven.height, { x: -92, z: -28 }, "roothaven", {
    chime: () => story && story.chime(),
    say: owlSay,
    addCollider: (x, z, r) => roothaven.colliders.push({ x, z, r }),
    enterHome: (id, back) => enterHome(id, back),
  });
  return rhHouse.interactable(mouseRig.position);
}

// 🐴 Buttercup the pony (bought at Dapple's Stable in Golden Hollow):
// Caps Lock to ride — everywhere outdoors but Frostpine's snow (that's sledding!)
const pony = buildPony();
pony.visible = false;
scene.add(pony);
// 🦌 Dasher the reindeer (Frostpine's Reindeer Race)
const reindeer = buildPony(0x8a6a4a);
// 🦙🐫 more rides (bought in Paradise) — you pick who you ride in your backpack
const llamaMount = buildLlama();
const camelMount = buildCamel();
// (and the great animals from the secret realms)
const realmMounts = Object.fromEntries(Object.entries(MOUNT_BUILDERS).map(([k, b]) => [k, b()]));
for (const m of [llamaMount, camelMount, ...Object.values(realmMounts)]) {
  m.visible = false;
  scene.add(m);
}
const SNOW_MOUNTS = ["goat", "eagle", "bison", "stag", "leopard"]; // (these don't mind Frostpine's snow)
const hasMount = () => MOUNTS.some((m) => hasItem(m.key));
/** which animal you're riding: your pick (if you own it), else the first one you have */
const mountNow = () => {
  const pick = cityLifeSave().mount;
  return pick && hasItem(pick) ? pick : (MOUNTS.find((m) => hasItem(m.key)) || {}).key;
};
{
  const ant = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, flatShading: true });
  for (const sx of [-1, 1]) {
    const a = new THREE.Group();
    a.position.set(sx * 0.12, 1.62, 0.7);
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.45, 5), ant);
    main.position.y = 0.2;
    main.rotation.z = -sx * 0.4;
    a.add(main);
    for (let k = 0; k < 3; k++) {
      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.18, 4), ant);
      tine.position.set(sx * (0.06 + k * 0.05), 0.15 + k * 0.1, 0.05);
      tine.rotation.x = -0.7;
      a.add(tine);
    }
    reindeer.add(a);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
  nose.position.set(0, 1.45, 1.04);
  reindeer.add(nose);
  reindeer.visible = false;
  scene.add(reindeer);
}
// 🐾 your pet (pets.js) — follows you everywhere
const pets = initPets(scene);
const onReindeer = () => !!(rideMode && rideMode.reindeer);
const petRiding = () => false; // (pets stay by your side — they're friends, not mounts)
const riding = () =>
  onReindeer() || petRiding() ||
  capsLock && hasMount() && !rideMode && (!swimming || mountNow() === "turtle") && // (🐢 the turtle swims you across the water)
  (world === "outside" || world === "everbough" || world === "roothaven" || (world === "city" && cityState.current && (!SNOWY.includes(cityState.current.id) || SNOW_MOUNTS.includes(mountNow()))));

function leaveRoothaven() {
  goOutside();
  // back up the stairs, standing before the open Moon Door in the Hollow
  const at = fallsToWorld(0, 105.4);
  placePlayer(at.x, at.z, HOLLOW_DOORS.intoHollow + Math.PI);
}
const tunnelRoomsSeen = new Set();
let tunnelsFound = false;
try {
  tunnelsFound = localStorage.getItem("ww.tunnelsFound") === "1";
} catch {}

function goTunnels(at = "landing") {
  world = "tunnels";
  sitting = null;
  denGroup.visible = false;
  outsideGroup.visible = false;
  skyDome.visible = false;
  caveGroup.visible = false;
  cityGroup.visible = false;
  tunnels.group.visible = true;
  roothaven.group.visible = false;
  hideCities();
  scene.background = new THREE.Color(0x070504);
  scene.fog = new THREE.Fog(0x070504, 12, 62);
  ambientLight.intensity = 0.55;
  ambientLight.color.set(0xd8c0a0);
  hemiLight.intensity = 0.1;
  sunLight.intensity = 0;
  // step off the ladder (or rope) toward the middle of the room
  const spot = at === "well" ? tunnels.spots.wellRope : tunnels.spots.ladder;
  const room = at === "well" ? tunnels.rooms.well : tunnels.rooms.landing;
  const dx = room.x - spot.x;
  const dz = room.z - spot.z;
  const d = Math.hypot(dx, dz) || 1;
  mouseRig.position.set(spot.x + (dx / d) * 4.6, 0, spot.z + (dz / d) * 4.6);
  mouseRig.rotation.y = Math.atan2(dx, dz);
  jumpVel = 0;
  stand = 0;
  tunnelRoomsSeen.add(at === "well" ? "well" : "landing");
  snapCamera();
}

function climbOutOfTunnels() {
  goOutside();
  const h = EVERBOUGH_HOLE;
  const x = h.x + h.out.x * 3.4;
  const z = h.z + h.out.z * 3.4;
  mouseRig.position.set(x, terrainHeight(x, z), z);
  mouseRig.rotation.y = Math.atan2(h.out.x, h.out.z); // facing away from the tree
  snapCamera();
}

// The first time you find the hole, it's a little movie. After that, a quick fade.
function enterTunnels() {
  if (tunnelsFound) return fadeThrough(() => goTunnels("landing"));
  tunnelsFound = true;
  try {
    localStorage.setItem("ww.tunnelsFound", "1");
  } catch {}
  const h = EVERBOUGH_HOLE;
  const y = terrainHeight(h.x, h.z);
  const ox = h.out.x;
  const oz = h.out.z;
  const near = [h.x + ox * 3.2 - oz * 1.8, y + 1.4, h.z + oz * 3.2 + ox * 1.8];
  const L = tunnels.rooms.landing;
  const G = tunnels.rooms.glow;
  return playCutscene([
    {
      dur: 3.4,
      from: [h.x + ox * 6 - oz * 3.5, y + 2.6, h.z + oz * 6 + ox * 3.5],
      to: near,
      look: [h.x, y + 0.2, h.z],
      text: "A hole, hidden between Everbough's roots… cold air breathes out of it.",
    },
    {
      dur: 2.2,
      fadeOut: true,
      from: near,
      lookFrom: [h.x, y + 0.2, h.z],
      lookTo: [h.x, y - 1.2, h.z],
      text: "…and it goes down. A long, long way down.",
      update: (k) => (mouseRig.position.y = y - k * 1.4),
    },
    { dur: 0.8, black: true, run: () => goTunnels("landing"), from: [L.x - 5, 9, L.z - 6], look: [L.x, 1, L.z] },
    {
      dur: 4,
      fadeIn: true,
      from: [L.x - 5, 9, L.z - 6],
      to: [L.x - 3, 4.2, L.z - 3],
      look: [L.x + 1, 1, L.z + 2],
      text: "Tunnels. Dozens of them, winding off into the dark.",
    },
    {
      dur: 3.6,
      from: [L.x - 3, 4.2, L.z - 3],
      to: [L.x - 1, 2.4, L.z - 1],
      lookFrom: [L.x + 1, 1, L.z + 2],
      lookTo: [(G.x + L.x) / 2, 1.4, (G.z + L.z) / 2],
      text: "Somebody dug these a long, long time ago… and never told anyone.",
    },
  ]).then(() => owlSay("🕳️ A secret tunnel network! The root ladder takes you back up."));
}

// E in the tunnels: the Root Map in the Archive, and the Sealed Door
function tunnelInteract() {
  if (world !== "tunnels") return null;
  const m = mouseRig.position;
  const rope = tunnels.spots.wellRope;
  if (Math.hypot(m.x - rope.x, m.z - rope.z) < 2.2) {
    return {
      label: "climb the rope up to the Old Well cave",
      act: () =>
        fadeThrough(() => {
          goCave();
          owlSay("🪢 You climb the rope up… into the Old Well's crystal cave!");
        }),
    };
  }
  const mp = tunnels.spots.map;
  if (Math.hypot(m.x - mp.x, m.z - mp.z) < mp.r) {
    return {
      label: "study the stone map",
      act: () =>
        playCutscene([
          {
            dur: 3.2,
            from: [mp.x + 2.2, 4.2, mp.z + 2.2],
            to: [mp.x + 0.6, 3.2, mp.z + 0.6],
            look: [mp.x, 0.9, mp.z],
            text: "A map carved in stone. Five great trees, joined by dashed roads.",
          },
          {
            dur: 3.2,
            from: [mp.x + 0.6, 3.2, mp.z + 0.6],
            look: [mp.x, 0.9, mp.z],
            text: "Frostpine… Golden Hollow… Everbough… Reedmere… and one more, beneath the roots: Roothaven.",
          },
          {
            dur: 3,
            from: [mp.x + 0.6, 3.2, mp.z + 0.6],
            to: [mp.x + 1.4, 3.6, mp.z + 1.2],
            look: [mp.x, 0.9, mp.z],
            who: "Thistle",
            text: "Roothaven? That's just a story… isn't it?",
          },
        ]),
    };
  }
  const dr = tunnels.spots.door;
  if (Math.hypot(m.x - dr.x, m.z - dr.z) < 2.6 && story) {
    const p7door = story.sealedDoor(); // Phase 7: the crest-key opens it
    if (p7door) return p7door;
  }
  if (Math.hypot(m.x - dr.x, m.z - dr.z) < 2.6) {
    return {
      label: "push the great round door",
      act: () =>
        playCutscene([
          {
            dur: 3,
            from: [dr.x - Math.sin(dr.face) * 1.5, 2.2, dr.z - Math.cos(dr.face) * 1.5],
            to: [dr.x, 2.6, dr.z],
            look: dr.look,
            text: "A great round door of stone, carved with a root wrapped around a crystal.",
          },
          { dur: 2.6, from: [dr.x, 2.6, dr.z], look: dr.look, text: "STRENGTH BELOW. LIGHT WITHIN." },
          {
            dur: 2.6,
            from: [dr.x, 2.6, dr.z],
            to: [dr.x - Math.sin(dr.face) * 1.2, 2.0, dr.z - Math.cos(dr.face) * 1.2],
            look: dr.look,
            who: "Thistle",
            text: "Nnngh… it won't budge. Not yet.",
          },
        ]),
    };
  }
  return null;
}

// What can be done right here with E? (story things first, then tunnels)
function currentInteract() {
  if (cutscenePlaying() || travelOpen() || shopIsOpen() || sitting || inNest || craftMode !== "play") return null;
  // (travel first: at a relit station, E should open the roads — not re-read the stone)
  const life = world === "city" && cityState.current && cityState.current.life;
  if (life && life.eventRunning()) return life.interactable(); // (racing — nothing else)
  const museumHere = world === "everbough" && museum && museum.interactable(mouseRig.position);
  const homeHere = homeInteract() || rhHouseInteract();
  if (homeHere) return homeHere;
  return travelInteract() || (secrets && secrets.priority()) || (paradise && paradise.interactable()) || (itemUses && itemUses.interactable()) || (signatures && signatures.interactable()) || (animals && animals.interactable()) || (story && story.interactable()) || (quests && quests.interactable()) || (balloons && balloons.interactable()) || (extras && extras.interactable()) || museumHere || (life && life.interactable()) || (cooking && cooking.interactable()) || (friends && friends.interactable()) || (rink && rink.interactable()) || (trophies && trophies.interactable()) || (secrets && secrets.interactable()) || (more2 && more2.interactable()) || (more3 && more3.interactable()) || (more && more.interactable()) || tunnelInteract() || journalInteract() || gatherInteract();
}
function journalInteract() {
  if (world !== "outside") return null;
  const p = mouseRig.position;
  if (Math.hypot(p.x - JOURNAL_POS.x, p.z - JOURNAL_POS.z) > 3.5) return null;
  return {
    label: "read the old journal on the rock",
    act: () => {
      journalEl.style.display = "flex";
      if (story) story.onReadPip();
    },
  };
}

// ------------------------------------------------------------
//  🎒  GATHERING — everything a biome holds can go in your pack.
//  Forest-floor litter (outside.js) says what each bit gives; the cave and
//  the tunnels can be foraged; fireflies come out over the Meadow at night.
// ------------------------------------------------------------
const packLimit = () => (ability("pack") ? 40 : 12) + (hasItem("pipsatchel") ? 20 : 0); // 🎒 Travel Backpack (+ 🎒 Pip's Satchel) = room for more
function addToPack(item, n = 1, quiet = false) {
  const k = keyOf(item);
  if ((inventory[k] || 0) >= packLimit()) {
    owlSay(`🎒 Your pack is full of ${item} (${packLimit()}).${ability("pack") ? "" : " A Travel Backpack would hold more!"}`);
    return false;
  }
  inventory[k] = Math.min(packLimit(), (inventory[k] || 0) + n);
  packChanged();
  if (!quiet) owlSay(`🎒 +${n} ${item} (${inventory[k]})`);
}
// roll a list of [item, chance]: the first always comes; the rest by luck
function rollItems(items) {
  const got = [];
  items.forEach(([name, chance], i) => {
    if (i === 0 || Math.random() < chance) got.push(name);
  });
  return got;
}
let forageCooldown = 0;
const FORAGE = {
  cave: { label: "forage the cave floor", items: [["Crystal Fragments", 1], ["Glowing Mushrooms", 0.4]] },
  landing: { label: "forage among the roots", items: [["Root Fibers", 1], ["Moss", 0.4]] },
  glow: { label: "forage in the glowworm light", items: [["Root Fibers", 1], ["Moss", 0.5]] },
  grotto: { label: "pick glowing mushrooms", items: [["Glowing Mushrooms", 1], ["Mushrooms", 0.5], ["Mushroom Dust", 0.3]] },
  archive: { label: "search the old shelves", items: [["Ancient Seeds", 1], ["Root Fibers", 0.3]] },
  stream: { label: "forage by the glowing stream", items: [["Smooth Stones", 1], ["Clay Mud", 0.5], ["Creek Water", 0.5]] },
  tunnel: { label: "forage the tunnel floor", items: [["Root Fibers", 1], ["Packed Dirt", 0.4]] },
  fireflies: { label: "catch a firefly (gently!)", items: [["Fireflies", 1]] },
};
function forageAct(spot) {
  return {
    label: spot.label,
    act: () => {
      if (forageCooldown > 0) return;
      forageCooldown = 1.2;
      biteTimer = BITE_TIME;
      const got = rollItems(spot.items);
      for (const name of got) addToPack(name, 1, true);
      owlSay("🎒 " + got.map((n) => `+1 ${n}`).join(" · "));
    },
  };
}
function gatherInteract() {
  const p = mouseRig.position;
  if (world === "outside") {
    const bit = litterNear(p.x, p.z, 1.4);
    if (bit) {
      return {
        label: `gather ${bit.label}`,
        act: () => {
          const first = bit.items[0] && keyOf(bit.items[0][0]);
          if (first && (inventory[first] || 0) >= packLimit()) {
            owlSay(`🎒 No room for more ${bit.items[0][0]} (${packLimit()}).${ability("pack") ? "" : " A Travel Backpack would hold more!"}`);
            return; // leave it on the ground
          }
          takeLitter(bit.key);
          biteTimer = BITE_TIME;
          const got = rollItems(bit.items);
          for (const name of got) addToPack(name, 1, true);
          if (bit.gather === "food") health = Math.min(100, health + 8);
          const storyTalked = story && story.onGather(bit);
          if (!storyTalked) owlSay(got.length ? "🎒 " + got.map((n) => `+1 ${n}`).join(" · ") : "🌰 Crunchy pine nuts! (+❤️)");
        },
      };
    }
    // 🌌 fireflies drift over the Meadow and the flowers at night
    if (currentNight > 0.55) {
      const b = biomeAt(p.x, p.z);
      if (b === "meadow" || b === "wildflower") return forageAct(FORAGE.fireflies);
    }
    return null;
  }
  if (world === "cave") return forageAct(FORAGE.cave);
  if (world === "tunnels") return forageAct(FORAGE[tunnels.roomAt(p.x, p.z) || "tunnel"]);
  return null;
}

// The direction the sunlight comes from (matches the light offset used in the
// game loop). The sky's sun disk is drawn here so light + sky agree.
const SUN_DIR = new THREE.Vector3(28, 70, 24).normalize();

// Sky + horizon colors. The horizon color is reused for the fog so distant
// hills melt smoothly into the sky instead of ending on a hard line.
const SKY_TOP = new THREE.Color(0x3f7ad8); // bright midday blue
const SKY_HORIZON = new THREE.Color(0xe4edf4); // bright pale haze at the horizon
const SUN_TINT = new THREE.Color(0xffefc8); // warm sun

// ------------------------------------------------------------
//  🦉  THE GREAT HORNED OWL — it roosts in the owl hole high in
//  Everbough and hunts by night. Stray near the great tree after
//  dark and it swoops: slower than your sprint, but sprint runs
//  out. If it catches you in the open, it pecks — and everything
//  in your backpack scatters. Shelter (the den, the cave, or the
//  hollow log) is the only escape.
// ------------------------------------------------------------
const OWL_SPEED = 26; // faster than walking (8), slower than sprint (40)
// ------------------------------------------------------------
//  🦊  THE RED FOX — the patient patroller of the meadow edges and
//  berry bushes (see the library's Red Fox page). It prowls a loop
//  between the Meadow and the nearest Berry Bush; wander too close
//  and it CHASES. Sprint away, or melt into the Tall Grass — if it
//  catches you, it nips (−❤️) and trots off, satisfied for a while.
// ------------------------------------------------------------
const FOX_TRIGGER = 26; // how close before it locks on
const FOX_SPEED = 22; // slower than your sprint (40), faster than walking (8)
const FOX_GIVEUP = 85; // how far it will chase
let fox = null;
let foxState = "prowl"; // "prowl" | "chase" | "satisfied"
let foxTimer = 0;
let foxHunting = false; // the story sent the fox after you (works at dusk too)
function ensureFox() {
  if (!fox) {
    fox = buildAnimal("fox");
    outsideGroup.add(fox);
    const h = meadowPos || { x: mouseRig.position.x + 60, z: mouseRig.position.z };
    fox.position.set(h.x, terrainHeight(h.x, h.z), h.z);
  }
  return fox;
}
function resetFox() {
  ensureFox();
  const h = meadowPos || { x: mouseRig.position.x + 300, z: mouseRig.position.z };
  fox.position.set(h.x, terrainHeight(h.x, h.z), h.z);
  foxState = "prowl";
  foxTimer = 0;
  foxHunting = false;
}
/** The story sends the fox: it appears behind you, already on your trail. */
function foxHunt() {
  ensureFox();
  const back = mouseRig.rotation.y + Math.PI + (Math.random() - 0.5);
  const x = mouseRig.position.x + Math.sin(back) * 30;
  const z = mouseRig.position.z + Math.cos(back) * 30;
  fox.position.set(x, terrainHeight(x, z), z);
  fox.visible = true;
  foxState = "chase";
  foxHunting = true;
}

/** Is the mouse tucked out of a fox's sight? */
function foxCantSeeYou() {
  if (insideLog()) return true;
  if (story && story.hidden(mouseRig.position.x, mouseRig.position.z)) return true; // your own leaf shelter
  if (tallGrassPos) {
    const d = Math.hypot(mouseRig.position.x - tallGrassPos.x, mouseRig.position.z - tallGrassPos.z);
    if (d < 140) return true; // the Tall Grass swallows you whole
  }
  return false;
}

function updateFox(dt, t, nightF) {
  if (cutscenePlaying()) return; // the story is steering the fox right now
  if ((!meadowPos || !berrySpots.length) && !foxHunting) return;
  if (story && story.calm()) {
    if (fox) fox.visible = false; // the last day of school is a peaceful one
    return;
  }
  if (fox) fox.visible = true;
  if (!fox) {
    fox = buildAnimal("fox");
    outsideGroup.add(fox);
    fox.position.set(meadowPos.x, terrainHeight(meadowPos.x, meadowPos.z), meadowPos.z);
  }
  // deep night belongs to the owl — the fox sleeps (unless the story sent it)
  if (nightF > 0.6 && !foxHunting) {
    fox.visible = false;
    return;
  }
  fox.visible = true;
  const den = berrySpots[0];
  const px = mouseRig.position.x;
  const pz = mouseRig.position.z;
  const dPlayer = Math.hypot(fox.position.x - px, fox.position.z - pz);

  if (foxTimer > 0) foxTimer -= dt;

  if (foxState === "prowl" || foxState === "satisfied") {
    // pace the loop between the Meadow and the berry bushes, weaving a bit
    const k = 0.5 + 0.5 * Math.sin(t * 0.045);
    const wx = meadowPos.x + (den.x - meadowPos.x) * k + Math.sin(t * 0.4) * 9;
    const wz = meadowPos.z + (den.z - meadowPos.z) * k + Math.cos(t * 0.31) * 9;
    const dx = wx - fox.position.x;
    const dz = wz - fox.position.z;
    const d = Math.hypot(dx, dz) || 1;
    const trot = Math.min(6 * dt, d);
    fox.position.x += (dx / d) * trot;
    fox.position.z += (dz / d) * trot;
    fox.position.y = terrainHeight(fox.position.x, fox.position.z);
    if (d > 1.5) fox.rotation.y = Math.atan2(dx, dz);
    if (foxState === "satisfied" && foxTimer <= 0) foxState = "prowl";
    if (foxState === "prowl" && dPlayer < FOX_TRIGGER && !foxCantSeeYou()) {
      foxState = "chase";
      owlSay("🦊 A fox! RUN — or melt into the Tall Grass!", true);
    }
    return;
  }

  if (foxState === "chase") {
    if (foxCantSeeYou() || world !== "outside" || dPlayer > FOX_GIVEUP) {
      foxState = "prowl";
      foxHunting = false;
      owlSay(foxCantSeeYou() ? "You vanished into cover — the fox sniffs and trots off." : "The fox gives up the chase.");
      if (story) story.onFoxEscape();
      if (!meadowPos) fox.visible = false;
      return;
    }
    const dx = px - fox.position.x;
    const dz = pz - fox.position.z;
    const d = Math.hypot(dx, dz) || 1;
    fox.position.x += (dx / d) * FOX_SPEED * dt;
    fox.position.z += (dz / d) * FOX_SPEED * dt;
    fox.position.y = terrainHeight(fox.position.x, fox.position.z);
    fox.rotation.y = Math.atan2(dx, dz);
    if (d < 1.7) {
      hurt(25);
      foxState = "satisfied";
      foxTimer = 60; // it won't bother you again for a while
      foxHunting = false;
      owlSay("🦊 The fox nipped you! (−❤️) It trots away, satisfied… for now.");
      if (story) story.onFoxBite();
    }
  }
}

const OWL_TRIGGER = 90; // how close to Everbough wakes it
const OWL_GIVEUP = 190; // how far it will chase before returning
let owl = null;
let owlState = "roost"; // "roost" | "chase" | "return"
let owlWings = [];
let currentNight = 0;

const owlPromptEl = document.createElement("div");
owlPromptEl.style.cssText =
  "position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:40;" +
  "font:bold 17px system-ui;color:#ffd2b0;background:rgba(60,10,5,.75);" +
  "padding:10px 22px;border-radius:12px;display:none;text-align:center;";
document.body.appendChild(owlPromptEl);
let owlMsgTimer = 0;
function owlSay(text, sticky = false) {
  owlPromptEl.textContent = text;
  owlPromptEl.style.display = "";
  owlMsgTimer = sticky ? Infinity : 4;
}

function buildOwl() {
  // the REAL Great Horned Owl — Poly by Google [CC-BY], see
  // public/models/animals/CREDITS.txt. Sized to loom over a 0.45 mouse.
  const g = new THREE.Group();
  loadModelFile("/models/animals/great_horned_owl.glb", (m) => {
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(m).getSize(size);
    m.scale.setScalar(5.2 / (size.y || 1));
    m.rotation.y = ANIMAL_YAW.great_horned_owl || 0; // face +Z like the chase code expects
    const b2 = new THREE.Box3().setFromObject(m);
    m.position.y = -b2.min.y;
    m.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
      // the model comes perched on a branch — leave the branch at the nest
      if (/branch|stick|perch|log/i.test(o.name)) o.visible = false;
    });
    g.add(m);
  });
  return g;
}

function owlNestSpot() {
  return new THREE.Vector3(
    EVERBOUGH_POS.x,
    terrainHeight(EVERBOUGH_POS.x, EVERBOUGH_POS.z) + OWL_NEST_HEIGHT,
    EVERBOUGH_POS.z + 6.5
  );
}

// Is the mouse tucked inside the hollow log's tunnel?
function insideLog() {
  for (const c of outsideColliders) {
    if (c.type !== "tube") continue;
    const rx = mouseRig.position.x - c.x;
    const rz = mouseRig.position.z - c.z;
    const along = rx * c.ax + rz * c.az;
    if (Math.abs(along) > c.halfLen) continue;
    const lat = Math.hypot(rx - along * c.ax, rz - along * c.az);
    if (lat < c.innerR * 0.9) return true;
  }
  return false;
}

function owlPeck() {
  // everything in the backpack scatters
  let lost = 0;
  for (const k in inventory) {
    lost += inventory[k];
    delete inventory[k];
  }
  if (carriedItem) dropCarried();
  hurt(35); // that BEAK. it costs hearts
  owlSay(lost > 0 ? "🦉 The owl snatches you up! Your backpack spills — " + lost + " things lost!" : "🦉 The owl snatches you up!");
  // …and carries you off, up out of the meadow, into the City of Branches.
  owlState = "roost";
  const fade = document.createElement("div");
  fade.style.cssText =
    "position:fixed;inset:0;background:#000;opacity:0;transition:opacity 1s;z-index:40;pointer-events:none";
  document.body.appendChild(fade);
  requestAnimationFrame(() => (fade.style.opacity = "1"));
  setTimeout(() => {
    goEverbough();
    owlSay("🌳 …you wake high in Everbough, the City of Branches. Find the Root Entrance to get home.", true);
    fade.style.opacity = "0";
    setTimeout(() => fade.remove(), 1200);
  }, 1000);
}

function updateOwl(dt, t, nightF) {
  if (!owl) {
    owl = buildOwl();
    outsideGroup.add(owl);
    owl.position.copy(owlNestSpot());
  }
  const nest = owlNestSpot();
  const px = mouseRig.position.x;
  const pz = mouseRig.position.z;
  const dPlayer = Math.hypot(owl.position.x - px, owl.position.z - pz);
  const dTree = Math.hypot(px - EVERBOUGH_POS.x, pz - EVERBOUGH_POS.z);

  if (owlMsgTimer !== Infinity) {
    owlMsgTimer -= dt;
    if (owlMsgTimer <= 0) owlPromptEl.style.display = "none";
  }

  if (owlState === "roost") {
    owl.position.lerp(nest, Math.min(1, dt * 2));
    owl.rotation.y += (0 - owl.rotation.y) * dt;
    for (const w of owlWings) w.hinge.rotation.z = w.sx * 1.25; // folded
    if (nightF > 0.5 && dTree < OWL_TRIGGER) {
      owlState = "chase";
      owlSay("🦉 A screech from Everbough — the Great Horned Owl is hunting you! RUN!", true);
    }
    return;
  }

  if (owlState === "chase") {
    // escape conditions: shelter, dawn, or outran it
    const sheltered = insideLog();
    if (sheltered || nightF < 0.25 || Math.hypot(px - EVERBOUGH_POS.x, pz - EVERBOUGH_POS.z) > OWL_GIVEUP + OWL_TRIGGER) {
      owlState = "return";
      owlSay(sheltered ? "You squeezed into shelter — the owl wheels away!" : "The owl gives up and glides home…");
      return;
    }
    // swoop toward the mouse
    const dx = px - owl.position.x;
    const dz = pz - owl.position.z;
    const d = Math.hypot(dx, dz) || 1;
    owl.position.x += (dx / d) * OWL_SPEED * dt;
    owl.position.z += (dz / d) * OWL_SPEED * dt;
    const groundY = terrainHeight(owl.position.x, owl.position.z);
    const swoop = 2.2 + Math.max(0, (d - 6) * 0.25) + Math.sin(t * 2.2) * 0.6;
    owl.position.y += (groundY + swoop - owl.position.y) * Math.min(1, dt * 3);
    owl.rotation.y = Math.atan2(dx, dz);
    for (const w of owlWings) w.hinge.rotation.z = w.sx * (0.25 + Math.sin(t * 9) * 0.55); // beating
    // the peck
    if (d < 1.7 && Math.abs(owl.position.y - mouseRig.position.y) < 4.5) {
      owlPeck();
      owlState = "return";
    }
    return;
  }

  // return to the nest
  const toNest = nest.clone().sub(owl.position);
  const dn = toNest.length();
  if (dn < 2.5) {
    owlState = "roost";
    return;
  }
  toNest.normalize();
  owl.position.addScaledVector(toNest, Math.min(OWL_SPEED * 1.2 * dt, dn));
  owl.rotation.y = Math.atan2(toNest.x, toNest.z);
  for (const w of owlWings) w.hinge.rotation.z = w.sx * (0.25 + Math.sin(t * 6) * 0.4);
}

// ------------------------------------------------------------
//  🌗  DAY & NIGHT — the sun crosses the sky, dusk blushes the
//  clouds, stars come out, and a pale moon lights the meadows.
// ------------------------------------------------------------
const DAY_LENGTH = 900; // real seconds per full day-night cycle (15 min)
let dayTime = 0.34; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
const PAL = {
  dayTop: new THREE.Color(0x3f7ad8),
  dayHor: new THREE.Color(0xe4edf4),
  duskTop: new THREE.Color(0x4a4276),
  duskHor: new THREE.Color(0xf4a05a),
  nightTop: new THREE.Color(0x0a1124),
  nightHor: new THREE.Color(0x18213a),
  daySun: new THREE.Color(0xffedbe),
  duskSun: new THREE.Color(0xff9a4a),
  moon: new THREE.Color(0x9fb4dc),
};
const _sunDir = new THREE.Vector3();
const _lightDir = new THREE.Vector3();
const _colA = new THREE.Color();
const _colB = new THREE.Color();
const _rainTop = new THREE.Color(0x5c646d); // storm-gray zenith
const _rainHor = new THREE.Color(0x8e979e); // storm-gray horizon

// ------------------------------------------------------------
//  🌦️  WEATHER — the sky drifts between clear blue, gray blankets
//  of cloud, and proper rain (with far-off thunder). Every change
//  fades in gently over ~14 seconds.
// ------------------------------------------------------------
const WEATHER_LOOK = {
  clear: { cloud: 0.12, rain: 0 },
  cloudy: { cloud: 0.78, rain: 0 },
  rain: { cloud: 1, rain: 1 },
};
const WEATHER_KINDS = ["clear", "clear", "cloudy", "rain"]; // clear twice — a sunny world
let weatherNow = "clear";
let weatherNext = "clear";
let weatherMix = 1; // 0..1 progress of the current change-over
let weatherTimer = 35 + Math.random() * 45; // seconds until the sky turns
let cloudAmt = 0.12;
let rainAmt = 0;
let thunderTimer = 0;

function setWeather(kind) {
  if (!WEATHER_LOOK[kind]) return;
  weatherNow = weatherNext;
  weatherNext = kind;
  weatherMix = 0;
  weatherTimer = 60 + Math.random() * 60;
}

function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    let pick = WEATHER_KINDS[(Math.random() * WEATHER_KINDS.length) | 0];
    if (pick === weatherNext) pick = pick === "clear" ? "cloudy" : "clear";
    setWeather(pick);
  }
  weatherMix = Math.min(1, weatherMix + dt / 14);
  const a = WEATHER_LOOK[weatherNow];
  const b = WEATHER_LOOK[weatherNext];
  cloudAmt = a.cloud + (b.cloud - a.cloud) * weatherMix;
  rainAmt = a.rain + (b.rain - a.rain) * weatherMix;
  // ⚡ far-off thunder while it pours: a brief flash of light
  if (thunderTimer > 0) thunderTimer -= dt;
  else if (rainAmt > 0.85 && Math.random() < dt * 0.05) thunderTimer = 0.12 + Math.random() * 0.15;
}
const smooth01 = (v, a, b) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

function setTimeOfDay(t) {
  dayTime = ((t % 1) + 1) % 1;
}

// Returns how "night" it is (0..1) so the pollen can become fireflies.
function updateDayNight(dt) {
  dayTime = (dayTime + dt / DAY_LENGTH) % 1;
  const ang = (dayTime - 0.25) * Math.PI * 2;
  const elev = Math.sin(ang); // -1 (midnight) .. 1 (noon)
  _sunDir.set(Math.cos(ang) * 0.82, elev, 0.4).normalize();

  const dayF = smooth01(elev, 0.02, 0.38);
  const nightF = smooth01(-elev, 0.06, 0.35);
  const duskF = Math.max(0, 1 - Math.abs(elev) / 0.32) * (1 - nightF * 0.4);
  const dawnF = dayTime < 0.5 ? 1 : 0; // morning half of the day → pink light

  // sky palette (rain washes everything toward storm gray)
  _colA.copy(PAL.nightTop).lerp(PAL.dayTop, dayF).lerp(PAL.duskTop, duskF * 0.7);
  _colB.copy(PAL.nightHor).lerp(PAL.dayHor, dayF).lerp(PAL.duskHor, duskF * 0.85);
  _colA.lerp(_rainTop, rainAmt * 0.55 * (0.25 + dayF * 0.75));
  _colB.lerp(_rainHor, rainAmt * 0.55 * (0.25 + dayF * 0.75));
  const u = skyDome.material.uniforms;
  u.topColor.value.copy(_colA);
  u.horizonColor.value.copy(_colB);
  u.sunColor.value.copy(PAL.daySun).lerp(PAL.duskSun, duskF);
  u.sunDir.value.copy(_sunDir);
  u.uTime.value = clock.elapsedTime;
  u.uNight.value = nightF;
  u.uDusk.value = duskF;
  u.uDawn.value = dawnF;
  u.uCloud.value = cloudAmt;
  u.uRain.value = rainAmt;

  // fog + clear color follow the horizon; rain pulls the world in close
  outFog.color.copy(_colB);
  outFog.density = 0.00042 * FOG_MULT * (1 + cloudAmt * 0.35 + rainAmt * 2.1);
  skyBg.copy(_colB);
  if (world === "outside") scene.background = skyBg;

  // the sun is the light by day; a pale moon takes over by night;
  // clouds and rain dim everything — and thunder flashes light it all up
  _lightDir.copy(_sunDir);
  if (elev < 0.05) _lightDir.y = Math.max(0.18, -_sunDir.y * 0.8); // moon path
  const gloom = 1 - cloudAmt * 0.42 - rainAmt * 0.2;
  sunLight.intensity = (2.8 * dayF + 0.35 * nightF + 0.6 * duskF) * gloom;
  sunLight.color.copy(PAL.daySun).lerp(PAL.duskSun, duskF).lerp(PAL.moon, nightF);
  ambientLight.intensity = 0.1 + 0.24 * dayF + 0.05 * nightF;
  hemiLight.intensity = (0.12 + 0.9 * dayF) * (1 - cloudAmt * 0.3);
  if (thunderTimer > 0) {
    sunLight.intensity += 2.6;
    ambientLight.intensity += 1.4;
  }
  return nightF;
}

// The two looks: cosy dark burrow vs bright daylight.
const denBg = new THREE.Color(COLORS.sky);
const denFog = new THREE.Fog(COLORS.sky, 8, 22);
const skyBg = SKY_HORIZON.clone(); // any gaps blend into the horizon
// Exponential fog = natural aerial perspective: nearby is crisp, the far
// hills fade into the haze the way real distance looks. Thin enough that the
// huge world shows kilometer-long vistas before melting into the sky.
const outFog = new THREE.FogExp2(0xe4edf4, 0.00042 * FOG_MULT); // matches the bright horizon

// ------------------------------------------------------------
//  🌤️  THE SKY — a giant inside-out dome with a painted gradient,
//  a real sun disk + glow, and soft drifting clouds. It rides along
//  with the camera so you can never reach its edge.
// ------------------------------------------------------------
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(5200, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: SKY_TOP.clone() },
      horizonColor: { value: SKY_HORIZON.clone() },
      sunColor: { value: SUN_TINT.clone() },
      sunDir: { value: SUN_DIR.clone() },
      exponent: { value: 0.6 },
      uTime: { value: 0 },
      uNight: { value: 0 },
      uDusk: { value: 0 },
      uDawn: { value: 0 },
      uCloud: { value: 0.12 },
      uRain: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vDir = wp.xyz - cameraPosition; // direction from the eye to this point
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor, horizonColor, sunColor, sunDir;
      uniform float exponent, uTime, uNight, uDusk, uDawn, uCloud, uRain;
      varying vec3 vDir;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);
        float h = max(dir.y, 0.0);
        vec3 col = mix(topColor, horizonColor, pow(1.0 - h, exponent));

        // 🌅 Sunrise / sunset: a glowing band hugging the horizon around
        // the sun — molten orange at dusk, rose-pink at dawn.
        float az = max(dot(normalize(vec3(dir.x, 0.0, dir.z)),
                           normalize(vec3(sunDir.x, 0.001, sunDir.z))), 0.0);
        float band = uDusk * pow(az, 2.4) * pow(1.0 - h, 3.0);
        vec3 glowCol = mix(vec3(1.0, 0.50, 0.20), vec3(1.0, 0.48, 0.60), uDawn);
        col = mix(col, glowCol, clamp(band * 1.25, 0.0, 0.85));

        // Sun: a crisp disk plus a soft warm halo — swelling and blushing
        // as it sits low on the horizon, hidden when the rain closes in.
        float s = max(dot(dir, sunDir), 0.0);
        float low = 1.0 - smoothstep(0.04, 0.4, sunDir.y);
        float disk = smoothstep(mix(0.9990, 0.9958, low), mix(0.9994, 0.9976, low), s);
        float glow = pow(s, 350.0) * 0.7 + pow(s, 12.0) * (0.15 + low * 0.2);
        col += sunColor * (disk * 1.3 + glow) * (1.0 - uRain * 0.85);

        // Rain: the whole sky closes over, gray and low.
        col = mix(col, mix(vec3(0.58, 0.62, 0.67), vec3(0.08, 0.09, 0.12), uNight), uRain * 0.5);

        // Stars: appear as the sky darkens (clouds hide them), twinkling.
        if (uNight > 0.01 && dir.y > 0.0) {
          vec2 sp = floor(dir.xz / (dir.y + 0.25) * 48.0);
          float star = step(0.992, hash(sp));
          float tw = 0.55 + 0.45 * sin(uTime * 2.5 + hash(sp + 7.0) * 40.0);
          col += vec3(0.85, 0.9, 1.0) * star * tw * uNight
               * smoothstep(0.04, 0.3, dir.y) * (1.0 - uCloud * 0.9);
        }
        // Clouds: soft puffs on a clear day; a heavy gray blanket as the
        // weather turns (uCloud spreads them, uRain darkens them).
        if (dir.y > 0.03) {
          vec2 uv = dir.xz / dir.y * 0.6 + uTime * 0.005;
          float cover = mix(0.50, 0.14, uCloud);
          float c = smoothstep(cover, 0.92, fbm(uv * 1.3 + vec2(3.0, 1.0)));
          float fade = smoothstep(0.03, 0.4, dir.y);
          vec3 cloudCol = mix(vec3(1.0), vec3(1.0, 0.66, 0.45), uDusk * 0.85);
          cloudCol = mix(cloudCol, vec3(0.42, 0.45, 0.50), uRain * 0.85);
          cloudCol *= 1.0 - uNight * 0.82;
          col = mix(col, cloudCol, c * fade * mix(0.62, 0.9, uCloud));
        }
        gl_FragColor = vec4(col, 1.0);
        // Match the scene's tone-mapping + sRGB so the sky's colors agree
        // with everything else (raw shader output would come out too dark).
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
);
skyDome.renderOrder = -1; // draw the sky first, behind everything
// the dome must sit inside the camera's draw distance or it gets clipped away
skyDome.scale.setScalar(Math.min(1, (DRAW_DISTANCE * 0.9) / 5200));
skyDome.visible = false; // shown only when outside
scene.add(skyDome);

// Resize the sun's shadow box (small in the den, big outside).
function setSunShadowRange(r) {
  const c = sunLight.shadow.camera;
  c.left = -r; c.right = r; c.top = r; c.bottom = -r;
  c.near = 1; c.far = r * 4 + 30;
  c.updateProjectionMatrix();
}

function goOutside() {
  world = "outside";
  tunnels.group.visible = false;
  if (roothaven) roothaven.group.visible = false;
  hideCities();
  sitting = null;
  denGroup.visible = false;
  outsideGroup.visible = true;
  skyDome.visible = true;
  scene.background = skyBg;
  scene.fog = outFog;
  // golden-hour forest light: warm sun, honeyed bounce, soft blue sky fill
  ambientLight.intensity = 0.32;
  ambientLight.color.set(0xffe9c4);
  hemiLight.intensity = 1.0;
  hemiLight.color.set(0xcfe0ff);
  hemiLight.groundColor.set(0x7a6a34); // warm golden bounce off the grass
  sunLight.intensity = 2.8;
  sunLight.color.set(0xffedbe);
  // bigger, softer shadows that follow the mouse around outside
  setSunShadowRange(45);
  // step out just south of the den mound, facing away from home
  mouseRig.position.set(SPAWN.x, terrainHeight(SPAWN.x, SPAWN.z), SPAWN.z);
  mouseRig.rotation.y = SPAWN.facing;
  jumpVel = 0;
  stand = 0;
}

function goInside() {
  world = "den";
  tunnels.group.visible = false;
  if (roothaven) roothaven.group.visible = false;
  hideCities();
  sitting = null;
  denGroup.visible = true;
  outsideGroup.visible = false;
  skyDome.visible = false;
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
  // clamp dt so slow frames / returning to a background tab never
  // teleport the mouse or fast-forward the day
  const dt = Math.min(clock.getDelta(), 0.05); // seconds since last frame

  // Everything the game does this frame is guarded: if one part ever fails,
  // the rest (fades, the camera, drawing) keeps going — no frozen black screen.
  try {
  if (quadMouse && standMouse) {
    if (craftMode === "play") {
      if (!cutscenePlaying()) updatePlay(dt);
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

  // The clock keeps turning in the cities, homes and tunnels too (so the
  // Night Market opens, the afternoon Bonfire gets lit…) — only the den waits.
  if (world !== "outside" && world !== "den" && !cutscenePlaying()) dayTime = (dayTime + dt / DAY_LENGTH) % 1;
  // Outside: the day turns, and the light (sun by day, moon by night)
  // follows the mouse so shadows always land nearby.
  if (world === "outside") {
    const nightF = updateDayNight(dt);
    sunLight.position.set(
      mouseRig.position.x + _lightDir.x * 85,
      Math.max(24, _lightDir.y * 110),
      mouseRig.position.z + _lightDir.z * 85
    );
    sunLight.target.position.set(mouseRig.position.x, 0, mouseRig.position.z);
    sunLight.target.updateMatrixWorld();
    // Keep the sky dome centered on the eye so its horizon stays put.
    skyDome.position.copy(camera.position);
    // Advance wind, water, leaves, butterflies — and firefly-mode at night.
    updateOutsideFX(clock.elapsedTime, mouseRig.position, nightF, rainAmt);
    currentNight = nightF;
    updateOwl(dt, clock.elapsedTime, nightF);
    updateFox(dt, clock.elapsedTime, nightF);
  } else if (world === "cave") {
    // the moonstone crystals breathe with light
    for (const c of caveCrystals) {
      c.mat.emissiveIntensity = 1.1 + 0.5 * Math.sin(clock.elapsedTime * 1.6 + c.phase);
    }
  } else if (world === "city" && cityState.current) {
    cityState.current.update(clock.elapsedTime, dt, mouseRig.position);
    if (cityState.current.life) cityState.current.life.update(clock.elapsedTime, dt);
  } else if (world === "roothaven") {
    roothaven.update(clock.elapsedTime, dt, { wheelOn: story ? story.wheelOn() : false });
  } else if (world === "tunnels") {
    tunnels.update(clock.elapsedTime, mouseRig.position, story ? story.hasLantern() : false, ability("lantern"));
  } else if (world === "everbough") {
    if (cityFireflies) cityFireflies.uniforms.uTime.value = clock.elapsedTime;
    if (cityWheel) cityWheel.rotation.x = clock.elapsedTime * 0.4; // the mill turns
  }
  // The map follows you everywhere (and hides itself inside the den).
  // the golden trail: a material or marker you asked for wins over the story's
  if (trailTarget && world === "outside") {
    const p = mouseRig.position;
    const there = trailTarget.biome ? biomeAt(p.x, p.z) === trailTarget.biome : Math.hypot(p.x - trailTarget.x, p.z - trailTarget.z) < trailTarget.r;
    if (there) {
      owlSay(trailTarget.item ? `📍 You've reached ${trailTarget.label}! Look around for ${trailTarget.item}.` : `📍 You've reached ${trailTarget.label}!`);
      trailTarget = null;
    }
  }
  if (minimapCtl) {
    const goal = trailTarget || (story ? story.goal() : null);
    minimapCtl.update(world, mouseRig.position, mouseRig.rotation.y, goal);
  }

  jumpRequested = false; // a Space tap only triggers one jump
  grabRequested = false; // a G tap only triggers one grab/drop
  if (biteTimer > 0) biteTimer = Math.max(0, biteTimer - dt);
  if (forageCooldown > 0) forageCooldown -= dt;

  updateWeather(dt); // the sky turns even while you're indoors
  updateFlood(dt); // …and rain finds its way into an unguarded burrow
  updateHealth(dt); // keep the heart bar honest
  decorEl.style.display = nearestFurniture() ? "flex" : "none";
  {
    // birdsong by day, crickets by night, babbling near any water
    const px = mouseRig.position.x;
    const pz = mouseRig.position.z;
    // how close is running water? (0..1, from rings of samples around you)
    let water = 0;
    let falls = 0;
    if (world === "outside") {
      for (const [r, v] of [[0, 1], [5, 0.85], [10, 0.6], [18, 0.35], [28, 0.15]]) {
        if (water >= v) break;
        const hit = r === 0 ? isWater(px, pz) : [0, 1, 2, 3, 4, 5].some((k) => isWater(px + Math.cos(k * 1.047) * r, pz + Math.sin(k * 1.047) * r));
        if (hit) water = v;
      }
      // the two waterfalls (lower + upper sheets) and the Hollow's inner falls
      const fl = Math.hypot(FALLS_POS.x, FALLS_POS.z);
      const ax = FALLS_POS.x / fl;
      const az = FALLS_POS.z / fl;
      for (const [d, loud] of [[31.3, 1], [79.2, 0.8]]) {
        const dist = Math.hypot(px - (FALLS_POS.x + ax * d), pz - (FALLS_POS.z + az * d));
        falls = Math.max(falls, loud * Math.pow(Math.max(0, 1 - dist / 130), 1.6));
      }
      if (Math.hypot(px - HOLLOW_CENTER.x, pz - HOLLOW_CENTER.z) < 26) falls = Math.max(falls, 0.45);
    } else if (world === "cave") {
      water = 0.4; // the turquoise pool and the little falls down there
    } else if (world === "tunnels") {
      const room = tunnels.roomAt(px, pz);
      water = room === "stream" ? 0.8 : 0;
    } else if (world === "roothaven") {
      water = roothaven.waterNear(px, pz) * 0.9; // the glowing river
    } else if (world === "city" && cityState.current) {
      water = cityState.current.waterNear(px, pz);
    }
    updateAmbient(dt, {
      outside: world === "outside",
      dayF: 1 - currentNight,
      nightF: currentNight,
      water,
      falls,
      // the little creek and brooks BABBLE (the falls drown that out)
      brook: water * Math.max(0, 1 - falls * 1.8),
    });
  }
  if (!journalHinted && world === "outside") {
    if (Math.hypot(mouseRig.position.x - JOURNAL_POS.x, mouseRig.position.z - JOURNAL_POS.z) < 5) {
      owlSay("📖 A little journal lies open on the rock… (E to read)");
      journalHinted = true;
    }
  }

  // Update the sprint meter — and hide it once it's fully charged.
  sprintFillEl.style.width = (sprintLeft / SPRINT_MAX) * 100 + "%";
  sprintFillEl.classList.toggle("empty", sprintLeft < 0.5);
  sprintBarEl.classList.toggle("hidden", sprintLeft >= SPRINT_MAX - 0.05);

  if (story) story.update(dt, clock.elapsedTime);
  if (extras) extras.update(dt, clock.elapsedTime);
  {
    const want = winterNow() ? 1 : 0;
    if (Math.abs(want - winterLook) > 0.001) {
      winterLook += (want - winterLook) * Math.min(1, dt * 0.8);
      setWinter(winterLook, winterLook);
    }
  }
  if (quests) quests.update(dt, clock.elapsedTime);
  if (balloons) balloons.update(dt, clock.elapsedTime);
  if (more) more.update(dt, clock.elapsedTime);
  if (more2) more2.update(dt, clock.elapsedTime);
  if (more3) more3.update(dt, clock.elapsedTime);
  if (paradise) paradise.update(dt);
  if (conjure) conjure.update(dt);
  if (itemUses) try {
    itemUses.update(dt);
  } catch (e) {
    console.error(e);
  }
  if (signatures) try {
    signatures.update(dt);
  } catch (e) {
    console.error(e);
  }
  if (animals) try {
    animals.update(dt);
  } catch (e) {
    console.error(e); // (one creature's trouble must never stop the whole game)
  }
  if (rink) rink.update(dt);
  if (trophies) trophies.update();
  if (secrets) secrets.update(dt);
  showCoins(world === "city");
  pets.update(dt, clock.elapsedTime, mouseRig.position, mouseRig.rotation.y, world !== "den" || true, waterMode(), mouseRig.position.y + SWIM_DEPTH);
  {
    const wc = world === "city" && cityState.current ? cityState.current.wardrobe || cityState.current.id : world === "everbough" ? "everbough" : null;
    if (setWardrobeCity(wc) && quadMouse) applyLook(quadMouse); // (back in a city: last time's outfit goes on)
  }
  updateCompass();
  {
    // "Press E to …" for whatever's right here
    const it = currentInteract();
    // (and if there's something here to examine closely, say so too)
    const fHint = !(it && it.prompt) && secrets && secrets.canExamine();
    actPromptEl.innerHTML = (it ? it.prompt || `Press <b>E</b> to ${it.label}` : "") + (fHint ? `${it ? " · " : ""}Hold <b>F</b> to examine it closely 🔍` : "");
    actPromptEl.classList.toggle("show", !!it || fHint);
  }
  } catch (err) {
    gameError(err);
  }
  // a cutscene steers the camera while it plays; otherwise the game does
  try {
    if (!updateCutscene(dt, camera) && !(extras && extras.photoCamera(dt)) && !(flightCam && flightCam(dt))) updateCamera(dt);
  } catch (err) {
    gameError(err);
  }
  // Shadows redraw every OTHER frame — half the shadow cost, invisible to
  // the eye (the sun crawls, the mouse barely moves in 1/30s).
  shadowTick = !shadowTick;
  if (shadowTick) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
}
let shadowTick = false;
// a small note on screen when something breaks (so it can be reported + fixed)
const errEl = document.createElement("div");
errEl.style.cssText =
  "position:fixed;left:12px;bottom:46px;z-index:70;max-width:60vw;padding:6px 10px;border-radius:8px;" +
  "background:rgba(120,20,10,.85);color:#fff;font:12px system-ui;display:none;";
document.body.appendChild(errEl);
let lastErr = "";
function gameError(err) {
  const msg = (err && err.message) || String(err);
  if (msg === lastErr) return;
  lastErr = msg;
  console.error(err);
  errEl.textContent = "⚠️ " + msg + ((err && err.stack && " — " + err.stack.split("\n")[1].trim()) || "");
  errEl.style.display = "";
  setTimeout(() => (errEl.style.display = "none"), 15000);
}

// --- Normal walking-around play ---
let flightCtl = null; // 🐉 while flying on your dragon: (dt, keys) → it moves you
let flightCam = null; // 🐉 …and its camera, pulled back behind her
function updatePlay(dt) {
  if (flightCtl) {
    flightCtl(dt, keys);
    jumpVel = 0;
    moveVel = 0;
    return;
  }
  // If we're curled up in the nest, just sleep — no walking around.
  if (inNest) {
    sleepInNest(dt);
    return;
  }
  if (sitting) {
    holdSit(dt);
    return;
  }

  // How high the ground is right under us (flat floor inside, hills outside).
  const groundY =
    world === "outside"
      ? terrainHeight(mouseRig.position.x, mouseRig.position.z)
      : world === "roothaven"
      ? roothaven.height(mouseRig.position.x, mouseRig.position.z)
      : world === "city"
      ? cityState.current.height(mouseRig.position.x, mouseRig.position.z)
      : 0;
  // on the ground — or on a deck, ledge or step (last frame's floor)
  const onGround = mouseRig.position.y <= Math.max(groundY, lastFloorY) + 0.05;
  if (onGround) airJumps = 1;
  // ⛸️ on ice, with Ice Skates on: REAL skating (momentum, carving, spins…)
  const skateNow = !!skating && onIce && hasItem("skates") && !rideMode && !swimming && !riding() && !bellySledding();
  if (skateNow && !skating.on()) skating.start(Math.abs(moveVel));
  else if (!skateNow && skating && skating.on()) skating.stop();

  // Look up / stand up: hold F
  // 🔍 holding F right by a secret? Then you look closely at IT (a glowing blue
  //    frame and a little zoom), not up at the sky.
  secretFocus = isHeld("KeyF") && !skateNow && secrets ? secrets.focus() : null;
  if (secretFocus) lastFocus = secretFocus;
  const wantStand = isHeld("KeyF") && !skateNow && !secretFocus; // (⛸️ on skates F is a SPIRAL, not looking up)
  stand += ((wantStand ? 1 : 0) - stand) * Math.min(1, dt * STAND_SPEED);
  // 🔍 looking closely at a secret zooms in a little
  {
    const wantFov = secretFocus ? BASE_FOV / 1.5 : BASE_FOV;
    if (Math.abs(camera.fov - wantFov) > 0.05) {
      camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
    }
  }

  // Turn left / right — unless the MOUSE is steering; then A/D strafe.
  // Turning EASES IN: a quick tap is a gentle nudge, holding builds up to
  // full speed, and letting go stops quickly. (Much easier to aim.)
  let strafe = 0;
  let turn = 0;
  if (isHeld("KeyA", "ArrowLeft")) {
    if (isMouseLocked()) strafe -= 1;
    else turn += 1;
  }
  if (isHeld("KeyD", "ArrowRight")) {
    if (isMouseLocked()) strafe += 1;
    else turn -= 1;
  }
  turnVel += (turn * TURN_SPEED - turnVel) * Math.min(1, dt * (turn ? 8 : 14));
  mouseRig.rotation.y += turnVel * dt;

  // Jump — one hop per fresh Space tap, only from the ground
  if (jumpRequested && (stand < 0.5 || skateNow) && !swimming && !(skateNow && skating.falling())) {
    const rideNow = riding() && !onReindeer() ? mountNow() : null;
    const jumpPow = Math.sqrt(1 + power("jump")) * ({ goat: 1.7, leopard: 1.4, eagle: 1.3, stag: 1.15 }[rideNow] || 1); // (✨ 🦘 powers: n% higher · 🐐 a goat LEAPS)
    if (rideNow === "eagle" || Date.now() < (window.__wwGlideUntil || 0)) airJumps = Math.max(airJumps, 1); // (🦅 the eagle flaps again and again — it carries you through the air)
    if (onGround) jumpVel = JUMP_STRENGTH * jumpPow;
    else if (airJumps > 0) {
      // 🦘 DOUBLE JUMP: one more hop in mid-air, with a little flip
      jumpVel = JUMP_STRENGTH * 0.95 * jumpPow;
      airJumps = 0;
      if (skateNow) skating.axel(); // ⛸️ on skates the second hop is an AXEL
      else flipT = 1;
    }
  }
  jumpVel -= GRAVITY * dt; // gravity always pulls down
  // 🦅 on the Great Eagle, hold Space to glide down slowly
  if (((riding() && !onReindeer() && mountNow() === "eagle") || Date.now() < (window.__wwGlideUntil || 0)) && isHeld("Space") && jumpVel < -1.2) jumpVel = -1.2; // (🪶 or holding a magic feather)
  // 🪁 GLIDING: with the Owl-Feather Cloak (the Canopy Crossing's reward),
  // hold Space while you're falling — feathered wings open and you sail.
  const gliding = !onGround && !swimming && !climbingNow && jumpVel < 0 && keys["Space"] && hasItem("owlcloak");
  if (gliding) {
    jumpVel = Math.max(jumpVel, -1.1);
    const fx = Math.sin(mouseRig.rotation.y);
    const fz = Math.cos(mouseRig.rotation.y);
    mouseRig.position.x += fx * 7 * dt;
    mouseRig.position.z += fz * 7 * dt;
    glideAcc += 7 * dt;
    if (glideAcc >= 5) {
      window.dispatchEvent(new CustomEvent("ww-stat", { detail: { k: "glide", n: glideAcc } }));
      glideAcc = 0;
    }
  }
  setGlideWings(gliding);
  mouseRig.position.y += jumpVel * dt;
  // (Landing onto the ground happens at the end, once we know where we moved to.)

  const prevX = mouseRig.position.x; // (for swept collisions below)
  const prevZ = mouseRig.position.z;
  // Walk forward / back (not while standing up)
  let move = 0;
  if (stand < 0.5) {
    if (isHeld("KeyW", "ArrowUp")) move += 1;
    if (isHeld("KeyS", "ArrowDown")) move -= 1;
  }
  if (rideMode) move = 1; // (on the sled you never stop — steer!)
  const isWalking = move !== 0;

  // Sprint: hold Shift to go fast, but it runs out after SPRINT_MAX seconds.
  let speed = WALK_SPEED;
  if (world === "den" && floodLevel > 0.12) speed *= 0.65; // wading through flood water
  const wantSprint = isHeld("ShiftLeft", "ShiftRight");
  if (wantSprint && isWalking && sprintLeft > 0) {
    speed *= SPRINT_MULT;
    sprintLeft = Math.max(0, sprintLeft - dt * (hasItem("stagantler") ? 0.77 : 1) * (1 - power("sprint"))); // using it up (🦌 the Silver Antler: 30% longer)
  } else if (!wantSprint) {
    sprintLeft = Math.min(SPRINT_MAX, sprintLeft + dt * SPRINT_RECHARGE); // refill
  }

  // (⛵ the Sail of the Lighthouse makes the raft faster · 📘 the Tidebound Journal makes you a faster swimmer)
  if (swimming) speed = raftActive() && world === "city" ? WALK_SPEED * 1.6 * (hasItem("sail") ? 1.3 : 1) * (hasItem("lighthousesail") ? 1.3 : 1) : Math.min(speed, WALK_SPEED * (hasItem("tidejournal") ? 1.05 : 0.7)); // paddling is slower (the raft is FAST)
  if (rideMode) speed = rideMode.speed;
  if (bellySledding()) speed = WALK_SPEED * 1.6 * (hasItem("sail") ? 1.3 : 1); // as speedy as the raft
  if (riding() && !onReindeer()) {
    // 🐴 a gallop (Shift for a full charge) — and every animal has its own pace
    const m = mountNow();
    const pace = swimming ? (m === "turtle" ? 1.4 : 1) : { stag: 1.35, leopard: 1.3, mustang: 1.2, eagle: 1.1, bison: 0.9, turtle: 0.7, goat: 1 }[m] || 1;
    speed = WALK_SPEED * (wantSprint ? 3 : 1.9) * pace;
  }
  if (petRiding() && pets.flies()) speed = WALK_SPEED * (wantSprint ? 3.2 : 2.2); // 🦉 flying is fastest of all
  // Walking eases in and out too, so a tap of W is a small step
  // (on ice you SLIDE: speed builds and fades slowly)
  // ⛸️ with your Ice Skates on, skating.js moves you (pushes, glides, carves, spins)
  if (skateNow) {
    moveVel = 0;
    skating.step(dt, { onGround, push: isHeld("KeyW", "ArrowUp"), brake: isHeld("KeyS", "ArrowDown"), shift: isHeld("ShiftLeft", "ShiftRight"), spiral: isHeld("KeyF") });
    if (!skatesTold && skating.speed() > 4) {
      skatesTold = true;
      owlSay("⛸️ You're SKATING! W push off (again and again!) · A/D carve · S hockey stop · Space hop (twice = AXEL) · Shift spin · F spiral");
    }
  } else moveVel += (move * speed - moveVel) * Math.min(1, dt * (onIce ? 1.1 : move ? 7 : 10));
  if (onIce && Math.abs(moveVel) > 4 && !skatedTold) {
    skatedTold = true;
    window.dispatchEvent(new CustomEvent("ww-stat", { detail: { k: "skated", n: 1 } }));
    owlSay("⛸️ Wheee! You're SKATING on the frozen pond!");
  }
  if (Math.abs(moveVel) > 0.05) {
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      mouseRig.rotation.y
    );
    let step = moveVel * dt;
    if (world === "outside") {
      // 🧗 steep ground is too sheer to WALK — hold C to climb it, paw
      // over paw. (Cliffs, the gorge walls, the mountain ring…)
      const hereY = terrainHeight(mouseRig.position.x, mouseRig.position.z);
      const dirX = forward.x * Math.sign(step);
      const dirZ = forward.z * Math.sign(step);
      const aheadY = terrainHeight(
        mouseRig.position.x + dirX * 0.8,
        mouseRig.position.z + dirZ * 0.8
      );
      const slope = (aheadY - hereY) / 0.8;
      // steep! little claws dig in — automatic climb (🪢 Root Rope hauls you up fast)
      if (slope > 1.35) step *= ability("rope") ? 0.85 : 0.3;
    }
    mouseRig.position.addScaledVector(forward, step);
  }
  strafeVel += ((stand < 0.5 && !skateNow ? strafe : 0) * speed * 0.5 - strafeVel) * Math.min(1, dt * (strafe ? 6 : 10));
  if (Math.abs(strafeVel) > 0.05) {
    // sidestep (gently): right = up × forward
    const right = new THREE.Vector3(Math.cos(mouseRig.rotation.y), 0, -Math.sin(mouseRig.rotation.y));
    mouseRig.position.addScaledVector(right, strafeVel * dt);
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
  } else if (world === "cave") {
    // stay inside the cavern walls
    const dCave = Math.hypot(mouseRig.position.x, mouseRig.position.z);
    const lim = CAVE_R * 0.86;
    if (dCave > lim) {
      mouseRig.position.x *= lim / dCave;
      mouseRig.position.z *= lim / dCave;
    }
    // back at the rope? climb up into the daylight
    if (
      Math.hypot(mouseRig.position.x - ropeSpot.x, mouseRig.position.z - ropeSpot.z) < 1.3
    ) {
      climbOutOfWell();
    }
  } else if (world === "home" && homeState.current) {
    homeState.current.constrain(mouseRig.position);
  } else if (world === "city") {
    const c = cityState.current;
    sweep(prevX, prevZ, () => c.constrain(mouseRig.position));
    c.constrain(mouseRig.position);
    bumpPeople(Object.values(c.people), c.height);
  } else if (world === "roothaven") {
    sweep(prevX, prevZ, () => roothaven.constrain(mouseRig.position));
    roothaven.constrain(mouseRig.position); // homes, halls, roots, the cavern wall
    bumpPeople(roothaven.people, roothaven.height);
    const up = roothaven.spots.stairsUp;
    if (!cutscenePlaying() && Math.hypot(mouseRig.position.x - up.x, mouseRig.position.z - up.z) < 1.6) {
      fadeThrough(() => {
        leaveRoothaven();
        owlSay("🪜 Up the long stairs, back into Moonstone Hollow.");
      }, 0.6);
    }
  } else if (world === "tunnels") {
    sweep(prevX, prevZ, () => tunnels.constrain(mouseRig.position));
    tunnels.constrain(mouseRig.position); // rock walls all round
    const m = mouseRig.position;
    const lad = tunnels.spots.ladder;
    const rope = tunnels.spots.wellRope;
    if (Math.hypot(m.x - lad.x, m.z - lad.z) < 1.0) {
      fadeThrough(climbOutOfTunnels);
    }
    // (the Well Passage rope only takes you up when you CHOOSE to: press E)
    const room = tunnels.roomAt(m.x, m.z);
    if (room && !tunnelRoomsSeen.has(room)) {
      tunnelRoomsSeen.add(room);
      owlSay(`✨ Discovered: ${tunnels.rooms[room].name}`);
    }
  } else if (world === "everbough") {
    // stay within the ring of forest
    const dc = Math.hypot(mouseRig.position.x, mouseRig.position.z);
    const lim = CITY_R * 0.88;
    if (dc > lim) {
      mouseRig.position.x *= lim / dc;
      mouseRig.position.z *= lim / dc;
    }
    bumpCity(dt); // great-tree trunks (climbable) + market stalls are solid
    // step through the glowing Root Entrance to wake back home
    if (Math.hypot(mouseRig.position.x - cityGate.x, mouseRig.position.z - cityGate.z) < 3) {
      goOutside();
      owlSay("🌱 You slip down the Root Entrance and wake in the meadow…");
    }
  } else {
    keepInsideWorld();
    bumpMound();
    // fast feet can't skip through thin things: replay a big move in small steps
    sweep(prevX, prevZ, () => bumpColliders(0));
    bumpColliders(dt); // trees, rocks, bushes… (walk into a trunk to CLIMB it)
    bumpPeople(SCHOOL_NPCS, (x, z) => terrainHeight(x, z));
    // The well is solid stone — but the IVY side is a ladder. Touch the
    // wall where the ivy hangs, and down you climb.
    if (wellPos) {
      const dx = mouseRig.position.x - wellPos.x;
      const dz = mouseRig.position.z - wellPos.z;
      const dWell = Math.hypot(dx, dz);
      if (dWell < 8.8) {
        const ang = Math.atan2(dz, dx);
        if (ang > 0.55 && ang < 2.75) goCave(); // the ivy arc
      }
    }
    // 🌙 the way into Moonstone Hollow: a dark crack in the cliff behind the
    // BOTTOM waterfall. It's pitch black (🏮 Glow Lantern) and the passage
    // climbs steeply up inside the rock (🪢 Root Rope).
    if (HOLLOW_DOORS.ready && !cutscenePlaying()) {
      const D = HOLLOW_DOORS;
      const p = mouseRig.position;
      if (Math.hypot(p.x - D.outside.x, p.z - D.outside.z) < 2.4) {
        if (!ability("lantern") || !ability("rope")) {
          // step back out through the curtain
          const dx = p.x - D.outside.x;
          const dz = p.z - D.outside.z;
          const dl = Math.hypot(dx, dz) || 1;
          p.x = D.outside.x + (dx / dl) * 2.6;
          p.z = D.outside.z + (dz / dl) * 2.6;
          if (clock.elapsedTime - slipWarned > 5) {
            slipWarned = clock.elapsedTime;
            owlSay(
              !ability("lantern")
                ? "🌑 Behind the falling water: a crack in the cliff, pitch black inside. You'll need a stronger lantern."
                : "🧗 A passage climbs steeply up into the rock — far too steep without a rope."
            );
          }
        } else {
          fadeThrough(() => {
            placePlayer(D.insideStand.x, D.insideStand.z, D.intoHollow);
            owlSay("🏮 Lantern high, you climb the hidden passage behind the falls… into Moonstone Hollow.");
          }, 0.6);
        }
      }
    }
    // 🪜 the stairs behind the open Moon Door lead down to Roothaven
    if (MOON_DOOR.ready && story && story.moonDoorOpen() && !cutscenePlaying()) {
      const S = MOON_DOOR.stairs;
      if (Math.hypot(mouseRig.position.x - S.x, mouseRig.position.z - S.z) < MOON_DOOR.stairR - 0.9) {
        fadeThrough(() => {
          goRoothaven();
          owlSay("🪜 Down, and down, and down the winding stairs…");
        }, 0.8);
      }
    }
    if (HOLLOW_DOORS.ready && !cutscenePlaying()) {
      const D = HOLLOW_DOORS;
      if (Math.hypot(mouseRig.position.x - D.inside.x, mouseRig.position.z - D.inside.z) < 1.8) {
        fadeThrough(() => {
          placePlayer(D.outsideStand.x, D.outsideStand.z, D.intoHollow + Math.PI);
          owlSay("💦 Down the passage and out through the curtain of the bottom falls.");
        }, 0.5);
      }
    }
    // 🕳️ the secret hole between Everbough's roots
    if (EVERBOUGH_HOLE.ready) {
      const dh = Math.hypot(mouseRig.position.x - EVERBOUGH_HOLE.x, mouseRig.position.z - EVERBOUGH_HOLE.z);
      if (dh < 1.1 && mouseRig.position.y < terrainHeight(EVERBOUGH_HOLE.x, EVERBOUGH_HOLE.z) + 1) enterTunnels();
    }
    // Reached the den entrance? Go back inside.
    const dDen = Math.hypot(
      mouseRig.position.x - DEN_ENTRANCE.x,
      mouseRig.position.z - DEN_ENTRANCE.z
    );
    if (dDen < 0.9) goInside();
  }

  // Settle onto the ground where we ended up: a flat floor in the den, rolling
  // hills outside. This is what keeps the mouse ON the terrain instead of
  // floating above it or sinking through it.
  let floorY = 0;
  if (world === "outside") floorY = groundTop(mouseRig.position.x, mouseRig.position.z); // (never below the ground you can SEE)
  else if (world === "everbough") floorY = cityFloor(mouseRig.position.x, mouseRig.position.z);
  else if (world === "roothaven") floorY = roothaven.height(mouseRig.position.x, mouseRig.position.z);
  else if (world === "city") {
    const c = cityState.current;
    floorY = c.height(mouseRig.position.x, mouseRig.position.z, mouseRig.position.y); // (some zones only count floors you can step up to)
    // ledges and rooftops you can stand on (Frostpine's ice stair…)
    for (const pl of c.platforms) {
      const d = Math.hypot(mouseRig.position.x - pl.x, mouseRig.position.z - pl.z);
      if (d < pl.r && mouseRig.position.y > pl.y - 3 && floorY < pl.y) floorY = pl.y;
    }
  }
  // High ledges (Everbough's top, the city's tree-decks) are floors too — but
  // only once you've climbed up near them, so they don't block you from below.
  if (world === "outside") {
    // the Moon Door's stone steps: walk right up them
    const stepTop = moonStepTop(mouseRig.position.x, mouseRig.position.z);
    if (stepTop !== null && stepTop > floorY && mouseRig.position.y > stepTop - 1.2) floorY = stepTop;
    for (const c of outsideColliders) {
      if (c.type !== "platform") continue;
      const d = Math.hypot(mouseRig.position.x - c.x, mouseRig.position.z - c.z);
      if (d < c.r && mouseRig.position.y > c.y - 3 && floorY < c.y) floorY = c.y;
    }
  } else if (world === "everbough") {
    for (const c of cityPlatforms) {
      const d = Math.hypot(mouseRig.position.x - c.x, mouseRig.position.z - c.z);
      if (d < c.r && mouseRig.position.y > c.y - 3 && floorY < c.y) floorY = c.y;
    }
  }
  // 🏊 in water, Thistle SWIMS at the surface instead of walking the bed
  swimming = false;
  onIce = false;
  if ((world === "outside" || world === "city") && !climbingNow) {
    const surf =
      world === "city"
        ? cityState.current.waterAt(mouseRig.position.x, mouseRig.position.z)
        : waterSurfaceAt(mouseRig.position.x, mouseRig.position.z);
    const here = world === "city" && cityState.current ? cityState.current.id : world;
    const frost = surf !== null && (window.__wwFrostIce || []).some((k) => k.where === here && Math.hypot(mouseRig.position.x - k.x, mouseRig.position.z - k.z) < k.r);
    if (world === "city" && cityState.current && cityState.current.iceAt && cityState.current.iceAt(mouseRig.position.x, mouseRig.position.z)) {
      onIce = true; // ⛸️ (the Starlight Pass's lake: frozen all year)
    } else if (frost) {
      // ❄️ frozen by your frost dragon's breath — walk (and SKATE) on it
      floorY = Math.max(floorY, surf + 0.06);
      onIce = true;
    } else if (surf !== null && world === "outside" && winterNow()) {
      // ❄️ frozen solid — walk (and SKATE) on the ice
      floorY = Math.max(floorY, surf + 0.03);
      onIce = true;
    } else if (surf !== null) {
      const swimY = Math.max(surf - SWIM_DEPTH, floorY - 0.3);
      if (mouseRig.position.y <= swimY + 0.6 && jumpVel <= 0.5) {
        mouseRig.position.y = swimY;
        jumpVel = 0;
        swimming = true;
      }
    }
  }
  // 🦉 riding a flying pet: you soar a little way above the ground
  if (petRiding() && pets.flies() && !swimming) {
    floorY += 1.6 + Math.sin(clock.elapsedTime * 2.2) * 0.12;
    mouseRig.position.y += (floorY - mouseRig.position.y) * Math.min(1, dt * 6);
    jumpVel = 0;
  }
  lastFloorY = floorY;
  if (swimming) {
    // (held at the surface above)
  } else if (mouseRig.position.y < floorY) {
    mouseRig.position.y = floorY; // landed, or walked up a slope
    jumpVel = 0;
  } else if (!climbingNow && jumpVel <= 0 && mouseRig.position.y - floorY < 0.6) {
    mouseRig.position.y = floorY; // hug the ground down gentle slopes
    jumpVel = 0;
  }
  climbingNow = false; // each frame the claws must grip anew
  updateBlobShadow(blobShadow, mouseRig, floorY);
  if (swimming) blobShadow.visible = false; // (no shadow on the water)
  else blobShadow.visible = RETRO;
  // 🛶 on the raft: sit on it, it rides the water under you
  raft.visible = swimming && raftActive() && world === "city";
  sledMesh.visible = !!(rideMode && rideMode.sled && !rideMode.reindeer) || bellySledding();
  const onAnimal = riding() && !onReindeer() && !petRiding();
  const which = onAnimal ? mountNow() : null;
  pony.visible = which === "horse";
  llamaMount.visible = which === "llama";
  camelMount.visible = which === "camel";
  for (const [k, m] of Object.entries(realmMounts)) m.visible = which === k;
  reindeer.visible = onReindeer();
  for (const mount of [pony, reindeer, llamaMount, camelMount, ...Object.values(realmMounts)]) {
    if (!mount.visible) continue;
    mount.position.set(mouseRig.position.x, mouseRig.position.y, mouseRig.position.z);
    mount.rotation.y = mouseRig.rotation.y;
    const gallop = Math.abs(moveVel) > 1 ? Math.sin(clock.elapsedTime * 14) : 0;
    mount.userData.legs.forEach((l, i) => (l.rotation.x = (i % 3 === 0 ? 1 : -1) * gallop * 0.7));
    mount.userData.tail.rotation.x = 0.4 + Math.abs(gallop) * 0.3;
    if (mount.userData.wings) mount.userData.wings.forEach(({ w, sx }) => (w.rotation.z = sx * (Math.abs(moveVel) > 1 ? Math.sin(clock.elapsedTime * 9) * 0.6 : 0.15))); // (🦅 the eagle's wings beat as you go)
  }
  if (bellySledding()) raft.visible = false; // (the sled carries you over the water too)
  if (sledMesh.visible) {
    sledMesh.position.set(mouseRig.position.x, mouseRig.position.y, mouseRig.position.z);
    sledMesh.rotation.y = mouseRig.rotation.y;
  }
  if (raft.visible) {
    raft.position.set(mouseRig.position.x, mouseRig.position.y + SWIM_DEPTH - 0.02, mouseRig.position.z);
    raft.rotation.y = mouseRig.rotation.y;
  }
  updateRipple(dt);

  updateMousePose(dt, isWalking);
  if (window.__probe) {
    const p = mouseRig.position;
    document.title = `POS ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`;
  }
}

// --- Push the mouse out of Everbough's solid things: the great-tree
//     trunks (climbable!) and the market stalls. ---
function bumpCity(dt = 0) {
  const bx = mouseRig.position.x;
  const bz = mouseRig.position.z;
  const gripping = isHeld("KeyW", "ArrowUp");
  const fwdX = Math.sin(mouseRig.rotation.y);
  const fwdZ = Math.cos(mouseRig.rotation.y);
  for (const t of cityTrunks) {
    let best = t.samples[0];
    let bd = Infinity;
    for (const seg of t.samples) {
      const dd = Math.abs(seg.y - mouseRig.position.y);
      if (dd < bd) { bd = dd; best = seg; }
    }
    const dx = bx - best.x, dz = bz - best.z, d = Math.hypot(dx, dz);
    const minD = best.r + MOUSE_BODY_RADIUS;
    if (d < minD && d > 0.0001) {
      if (gripping && dt > 0 && (-dx * fwdX - dz * fwdZ) / d > (stillClimbing() ? -0.6 : 0.3)) {
        faceBark(dx, dz, dt); // square-on to the bark, so she climbs straight up
        climbUp(dt);
        jumpVel = 0;
        climbingNow = true;
      }
      mouseRig.position.x = best.x + (dx / d) * minD;
      mouseRig.position.z = best.z + (dz / d) * minD;
    }
  }
  for (const c of outsideCityCol) {
    const dx = bx - c.x, dz = bz - c.z, d = Math.hypot(dx, dz);
    const minD = c.r + MOUSE_BODY_RADIUS;
    if (d < minD && d > 0.0001) {
      mouseRig.position.x = c.x + (dx / d) * minD;
      mouseRig.position.z = c.z + (dz / d) * minD;
    }
  }
}

// --- Push the mouse out of solid world things (trees, rocks, bushes…).
//     Tube colliders (the hollow log) keep the tunnel open but make the
//     bark walls solid from both sides. ---
const CLIMB_SPEED = 4.2; // how fast little claws go up a trunk
const CLAW_LIMIT = 8; // without Climbing Spikes, paws slip past this height
let slipWarned = 0;
const ability = (k) => !!(story && story.has(k));
// 🧗 Once your claws grip, you stay gripped (even if you drift a little) and
// you turn to face the bark square-on — so a climb goes STRAIGHT up, no
// fiddling with A and D. (A/D still shuffles you round the trunk.)
let lastGrip = -1;
const stillClimbing = () => clock.elapsedTime - lastGrip < 0.25;
function faceBark(dx, dz, dt) {
  lastGrip = clock.elapsedTime;
  const want = Math.atan2(-dx, -dz);
  let diff = want - mouseRig.rotation.y;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // (the short way round)
  mouseRig.rotation.y += diff * Math.min(1, dt * 12);
}
/** Climb a little: 🧗 Climbing Spikes = faster, and no height limit. */
function climbUp(dt) {
  const ground = world === "everbough" ? cityHeight(mouseRig.position.x, mouseRig.position.z) : terrainHeight(mouseRig.position.x, mouseRig.position.z);
  if (!ability("spikes") && mouseRig.position.y - ground > CLAW_LIMIT) {
    if (clock.elapsedTime - slipWarned > 6) {
      slipWarned = clock.elapsedTime;
      owlSay("🐾 Your claws slip — the bark's too smooth up here. Climbing Spikes would help!");
    }
    return; // cling where you are
  }
  mouseRig.position.y += CLIMB_SPEED * (ability("spikes") ? 1.8 : 1) * dt;
}
let climbingNow = false; // true only on frames where claws grip bark
let glideAcc = 0; // (paces glided since the last tally)
let onIce = false; // ⛸️ standing on frozen water (winter)
let skatesTold = false;
let skatedTold = false;
const winterNow = () => !!(extras && extras.season && extras.season().key === "winter");
let winterLook = 0; // (eases in and out as the seasons turn)
let glideWings = null;
/** the owl-feather wings that open while you glide */
function setGlideWings(on) {
  if (!quadMouse) return;
  if (on && !glideWings) {
    glideWings = new THREE.Group();
    const cols = [0x6a4428, 0x8a5a32, 0xa06a3a, 0x7a4e2c, 0xd8c09a];
    for (const sx of [-1, 1]) {
      const wing = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.9, flatShading: true }));
        f.scale.set(0.05, 0.012, 0.16 + i * 0.012);
        f.position.set(sx * (0.12 + i * 0.075), 0, -0.04 - i * 0.01);
        f.rotation.y = sx * (0.5 - i * 0.12);
        wing.add(f);
      }
      wing.position.set(sx * 0.12, 0.46, -0.02);
      glideWings.add(wing);
    }
    quadMouse.add(glideWings);
  }
  if (glideWings) {
    glideWings.visible = on;
    if (on) glideWings.children.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.sin(clock.elapsedTime * 6) * 0.08));
  }
}
let airJumps = 1; // one extra jump in mid-air (refills on landing)
let flipT = 0; // 1 → 0 during the double-jump flip
let lastFloorY = 0; // the floor under us last frame (ground, deck or step)
/** Replay this frame's move in small steps, colliding after each one. */
function sweep(prevX, prevZ, collide) {
  const p = mouseRig.position;
  const dx = p.x - prevX;
  const dz = p.z - prevZ;
  const d = Math.hypot(dx, dz);
  if (d < 0.3) return;
  const n = Math.min(12, Math.ceil(d / 0.3));
  p.x = prevX;
  p.z = prevZ;
  for (let i = 0; i < n; i++) {
    p.x += dx / n;
    p.z += dz / n;
    collide();
  }
}
/** Other mice are solid too — no walking through your classmates. */
function bumpPeople(list, heightAt) {
  const p = mouseRig.position;
  for (const n of list) {
    if (!n.mesh || !n.mesh.visible) continue;
    const nx = n.mesh.userData.hx ?? n.x;
    const nz = n.mesh.userData.hz ?? n.z;
    const dx = p.x - nx;
    const dz = p.z - nz;
    const d = Math.hypot(dx, dz);
    const r = (n.r ?? 0.45 * n.mesh.scale.x) + MOUSE_BODY_RADIUS;
    if (d < r && d > 0.0001 && p.y < heightAt(nx, nz) + 1.2) {
      p.x = nx + (dx / d) * r;
      p.z = nz + (dz / d) * r;
    }
  }
}
let swimming = false; // floating in the creek / pool (set each frame)
const SWIM_DEPTH = 0.2; // how far below the surface the paws are while swimming
// a ring of ripples that follows a swimming mouse
const ripple = new THREE.Mesh(
  new THREE.RingGeometry(0.42, 0.55, 24).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
);
scene.add(ripple);
let ripplePhase = 0;
function updateRipple(dt) {
  if (!swimming) {
    ripple.material.opacity = 0;
    return;
  }
  ripplePhase = (ripplePhase + dt * (Math.abs(moveVel) > 1 ? 1.4 : 0.6)) % 1;
  ripple.position.set(mouseRig.position.x, mouseRig.position.y + SWIM_DEPTH + 0.02, mouseRig.position.z);
  ripple.scale.setScalar(0.8 + ripplePhase * 2.2);
  ripple.material.opacity = 0.55 * (1 - ripplePhase);
}
let turnVel = 0; // eased turning speed (radians/second)
let moveVel = 0; // eased forward speed
let strafeVel = 0; // eased sidestep speed
function bumpColliders(dt = 0) {
  const bx = mouseRig.position.x;
  const bz = mouseRig.position.z;
  const gripping = isHeld("KeyW", "ArrowUp");
  const fwdX = Math.sin(mouseRig.rotation.y);
  const fwdZ = Math.cos(mouseRig.rotation.y);
  for (const c of outsideColliders) {
    if (c.type === "platform") continue; // a floor, handled in the settle step
    if (c.type === "trunk") {
      // pick the trunk disc nearest our current height, so collision AND
      // the climb follow the twisting bark all the way up to the nest ledge.
      let best = c.samples[0];
      let bd = Infinity;
      for (const seg of c.samples) {
        const dd = Math.abs(seg.y - mouseRig.position.y);
        if (dd < bd) { bd = dd; best = seg; }
      }
      const dx = bx - best.x;
      const dz = bz - best.z;
      const d = Math.hypot(dx, dz);
      const minD = best.r + MOUSE_BODY_RADIUS;
      if (d < minD && d > 0.0001) {
        if (gripping && dt > 0 && (-dx * fwdX - dz * fwdZ) / d > (stillClimbing() ? -0.6 : 0.3)) {
          faceBark(dx, dz, dt); // square-on to the bark, so she climbs straight up
          climbUp(dt); // claws grip, up she goes
          jumpVel = 0;
          climbingNow = true;
        }
        mouseRig.position.x = best.x + (dx / d) * minD;
        mouseRig.position.z = best.z + (dz / d) * minD;
      }
      continue;
    }
    if (c.type === "tube") {
      const rx = bx - c.x;
      const rz = bz - c.z;
      const along = rx * c.ax + rz * c.az;
      if (Math.abs(along) > c.halfLen) continue; // past the open mouths
      const px = rx - along * c.ax;
      const pz = rz - along * c.az;
      const lat = Math.hypot(px, pz);
      const inLo = c.innerR - MOUSE_BODY_RADIUS;
      const outHi = c.outerR + MOUSE_BODY_RADIUS;
      if (lat > inLo && lat < outHi && lat > 0.0001) {
        const mid = (c.innerR + c.outerR) / 2;
        const k = (lat < mid ? inLo : outHi) / lat;
        mouseRig.position.x = c.x + along * c.ax + px * k;
        mouseRig.position.z = c.z + along * c.az + pz * k;
      }
      continue;
    }
    const dx = bx - c.x;
    const dz = bz - c.z;
    const d = Math.hypot(dx, dz);
    const minD = c.r + MOUSE_BODY_RADIUS;
    if (d < minD && d > 0.0001) {
      // 🐾 pressing INTO the trunk? claws grip bark — climb straight up
      if (gripping && dt > 0 && (-dx * fwdX - dz * fwdZ) / d > (stillClimbing() ? -0.6 : 0.35)) {
        faceBark(dx, dz, dt); // square-on to the bark, so she climbs straight up
        climbUp(dt);
        jumpVel = 0; // no gravity while clinging
        climbingNow = true; // tells the ground-settle to let go
      }
      mouseRig.position.x = c.x + (dx / d) * minD;
      mouseRig.position.z = c.z + (dz / d) * minD;
    }
  }
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
  const activeGroup = world === "den" ? denGroup : world === "cave" ? caveGroup : world === "tunnels" ? tunnels.group : outsideGroup;
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
  const activeGroup = world === "den" ? denGroup : world === "cave" ? caveGroup : world === "tunnels" ? tunnels.group : outsideGroup;
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
  // set it down on the niche's shelf board
  it.position.set(h.x * 0.985, h.y - h.radius * 0.66, h.z * 0.985);
  it.rotation.set(0, h.angle + Math.PI, 0); // face into the room
  h.item = it;
  if (story) story.onStore();
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

// --- Keep the mouse inside the world — you can climb well into the
//     foothills now (all the way up beside the waterfall), but the high
//     peaks still wall everything in. ---
function keepInsideWorld() {
  const limit = WORLD_RADIUS * 0.95;
  const d = Math.hypot(mouseRig.position.x, mouseRig.position.z);
  if (d > limit) {
    mouseRig.position.x *= limit / d;
    mouseRig.position.z *= limit / d;
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
  quadMouse.visible = true; // one body now — Thistle is always Thistle
  const u = quadMouse.userData;
  if (flipT > 0) {
    // the double-jump somersault: one quick forward roll
    flipT = Math.max(0, flipT - dt * 2.4);
    quadMouse.rotation.x = (1 - flipT) * Math.PI * 2;
    if (u.legL) u.legL.rotation.x = u.legR.rotation.x = -1.2;
    if (flipT > 0) return;
    quadMouse.rotation.x = 0;
  }
  if (skating && skating.pose(dt, quadMouse)) return; // ⛸️ the skater's poses
  if (riding()) {
    // 🐴 up in the saddle: legs astride, paws on the reins
    quadMouse.rotation.set(0, 0, 0);
    const seat = petRiding() ? pets.seat() : 0.95;
    quadMouse.position.y = quadBaseY + seat + (Math.abs(moveVel) > 1 ? Math.abs(Math.sin(clock.elapsedTime * 14)) * 0.05 : 0);
    if (u.legL) {
      u.legL.rotation.set(-1.3, 0, 0.5);
      u.legR.rotation.set(-1.3, 0, -0.5);
    }
    if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -0.9;
    if (u.head) u.head.rotation.x = 0;
    idleTime = 0;
    return;
  }
  if (u.legL) u.legL.rotation.z = u.legR.rotation.z = 0; // (out of the saddle)
  if (bellySledding()) {
    // 🛷 flat on her tummy, paws out front, feet kicking up behind
    quadMouse.rotation.x = 1.5;
    quadMouse.rotation.y = 0;
    quadMouse.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.05;
    quadMouse.position.y = quadBaseY + 0.32;
    if (u.head) u.head.rotation.x = -1.2; // chin up, looking ahead
    if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -2.8; // arms stretched forward
    if (u.legL) {
      u.legL.rotation.x = 0.3 + Math.sin(clock.elapsedTime * 8) * 0.25;
      u.legR.rotation.x = 0.3 - Math.sin(clock.elapsedTime * 8) * 0.25;
    }
    idleTime = 0;
    return;
  }
  if (swimming) {
    // 🏊 lean forward into the water, head up, legs kicking, paws stroking
    const t = clock.elapsedTime * (isWalking ? 9 : 3.5);
    quadMouse.rotation.x = 1.05; // lying forward in the water
    quadMouse.rotation.y += (0 - quadMouse.rotation.y) * Math.min(1, dt * 8);
    quadMouse.rotation.z = Math.sin(t * 0.5) * 0.08;
    quadMouse.position.y = quadBaseY + 0.06 + Math.sin(t * 0.7) * 0.025; // bobbing
    if (u.head) u.head.rotation.x = -0.95; // chin up, nose above water
    if (u.legL) {
      u.legL.rotation.x = Math.sin(t) * 0.6;
      u.legR.rotation.x = -Math.sin(t) * 0.6;
    }
    if (u.armL) {
      u.armL.rotation.x = -1.2 + Math.sin(t) * 0.9;
      u.armR.rotation.x = -1.2 - Math.sin(t) * 0.9;
    }
    if (u.tail) u.tail.rotation.y = Math.sin(t * 0.8) * 0.4;
    idleTime = 0;
    return;
  }

  // F: tip the head (and a little of the body) back to watch the sky
  if (u.head) u.head.rotation.x = -stand * 0.85;

  // Bite: a quick bow when grabbing/dropping with the teeth
  const biteDip =
    biteTimer > 0 ? Math.sin((1 - biteTimer / BITE_TIME) * Math.PI) * 0.35 : 0;
  quadMouse.rotation.x = biteDip - stand * 0.12;

  if (isWalking) {
    idleTime = 0;
    quadMouse.rotation.y += (0 - quadMouse.rotation.y) * Math.min(1, dt * 8);
    walkPhase += dt * 11;
    const sw = Math.sin(walkPhase);
    quadMouse.position.y = quadBaseY + Math.abs(sw) * 0.03;
    quadMouse.rotation.z = sw * 0.05;
    if (u.legL) {
      u.legL.rotation.x = sw * 0.75;
      u.legR.rotation.x = -sw * 0.75;
    }
    if (u.armL) {
      u.armL.rotation.x = -sw * 0.5;
      u.armR.rotation.x = sw * 0.5;
    }
    if (u.tail) u.tail.rotation.y = sw * 0.3;
  } else {
    quadMouse.position.y += (quadBaseY - quadMouse.position.y) * Math.min(1, dt * 10);
    quadMouse.rotation.z += (0 - quadMouse.rotation.z) * Math.min(1, dt * 10);
    const settle = Math.min(1, dt * 8);
    for (const part of [u.legL, u.legR, u.armL, u.armR]) {
      if (part) part.rotation.x *= 1 - settle;
    }
    if (u.tail) u.tail.rotation.y = Math.sin(clock.elapsedTime * 1.3) * 0.16; // idle sway
    // after a few quiet seconds, Thistle turns around to look at YOU
    if (!inNest) {
      idleTime += dt;
      const wantYaw = idleTime > 4.5 ? Math.PI : 0;
      quadMouse.rotation.y += (wantYaw - quadMouse.rotation.y) * Math.min(1, dt * 2.5);
    }
  }
}

// ------------------------------------------------------------
//  📦  CRAFTED ITEMS — little bundles you can carry in your teeth
// ------------------------------------------------------------

// A floating name tag drawn with code (so we don't need picture files).
function makeLabel(text) {
  // 🪧 a crisp, high-res tag with bright outlined letters (see signs.js)
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: signTexture(text, "wood", 4.5),
      transparent: true,
      depthTest: false, // always show the label on top
      toneMapped: false,
      fog: false,
    })
  );
  sprite.scale.set(1.35, 0.3, 1);
  return sprite;
}

// Build the crafted item: use a real model if we have one for this
// recipe, otherwise a simple placeholder bundle.
// EVERY recipe gets a real little model: each crafting category has its own
// shape family, and every recipe gets its own color (seeded from its name),
// so all 55 crafts look like themselves.
function craftColor(name, sat = 0.55, lit = 0.5) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return new THREE.Color().setHSL((h % 360) / 360, sat, lit);
}

function buildCraftModel(name) {
  const g = new THREE.Group();
  const col = craftColor(name);
  const mat = (c, extra = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...extra });
  const glowMat = (c, i = 1.2) => mat(c, { emissive: c, emissiveIntensity: i, roughness: 0.35 });
  const bark = mat(0x6b4a2c);
  const rope = mat(0xc9b06a);
  const stone = mat(0x8a877e);
  const leafG = mat(0x4e7a34);
  const add = (mesh) => (g.add(mesh), mesh);
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
    const b = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m));
    b.position.set(x, y, z);
    return b;
  };
  const ball = (r, m, x = 0, y = 0, z = 0, sy = 1) => {
    const b = add(new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), m));
    b.position.set(x, y, z);
    b.scale.y = sy;
    return b;
  };
  const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0) => {
    const c = add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 9), m));
    c.position.set(x, y, z);
    return c;
  };
  // ---- shared mini-shapes, tuned to the crafting-sheet pictures ----
  const sack = (tint, glow = 0) => {
    ball(0.13, glow ? glowMat(tint, glow) : mat(tint), 0, 0.12, 0, 1.15);
    cyl(0.045, 0.06, 0.06, mat(tint).clone(), 0, 0.26, 0);
    const tie = add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 5, 8), rope));
    tie.rotation.x = Math.PI / 2;
    tie.position.y = 0.23;
  };
  const bowl = (contents, glow = 0) => {
    cyl(0.15, 0.1, 0.11, bark, 0, 0.055, 0);
    ball(0.115, glow ? glowMat(contents, glow) : mat(contents), 0, 0.115, 0, 0.5);
  };
  const lanternPot = (glowCol) => {
    cyl(0.1, 0.13, 0.17, mat(0x50565e), 0, 0.12, 0);
    ball(0.09, glowMat(glowCol, 1.6), 0, 0.14, 0);
    const handle = add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.014, 5, 10, Math.PI), rope));
    handle.position.y = 0.22;
  };
  const beadRing = (beadCol, n = 9, r = 0.1) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ball(0.035, mat(beadCol), Math.cos(a) * r, 0.05, Math.sin(a) * r);
    }
  };
  const archway = (m, doorMat) => {
    const arch = add(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 6, 10, Math.PI), m));
    arch.position.y = 0.13;
    box(0.34, 0.06, 0.1, m, 0, 0.03, 0);
    if (doorMat) {
      const door = cyl(0.11, 0.11, 0.03, doorMat, 0, 0.13, 0);
      door.rotation.x = Math.PI / 2;
      door.scale.y = 1;
    }
  };

  const n = name.toLowerCase();
  if (/mushroom lamp/.test(n)) {
    // the picture: a red toadstool house with warm windows in the stem
    cyl(0.07, 0.1, 0.17, mat(0xe8dcc4), 0, 0.085, 0);
    ball(0.17, mat(0xb8402e, { emissive: 0x7a1f12, emissiveIntensity: 0.35, roughness: 0.6 }), 0, 0.21, 0, 0.62);
    for (let i = 0; i < 6; i++)
      ball(0.028, mat(0xf2ece0), Math.cos(i * 1.9) * 0.1, 0.245 + (i % 2) * 0.02, Math.sin(i * 1.9) * 0.1, 0.6);
    for (const wa of [0.5, -0.9, 2.2]) {
      const win = box(0.035, 0.045, 0.012, glowMat(0xffc46a, 2.2), Math.sin(wa) * 0.085, 0.09, Math.cos(wa) * 0.085);
      win.rotation.y = wa;
    }
    ball(0.11, glowMat(0xffb060, 0.5), 0, 0.13, 0, 0.25); // warm spill under the cap
  } else if (/glow lantern/.test(n)) lanternPot(0x7fe8d0);
  else if (/firefly lantern/.test(n)) lanternPot(0xffd27a);
  else if (/moonstone lantern/.test(n)) lanternPot(0x7fc8ff);
  else if (/firefly jar/.test(n)) {
    cyl(0.09, 0.09, 0.18, mat(0xbfd8d2, { transparent: true, opacity: 0.55, roughness: 0.2 }), 0, 0.11, 0);
    for (let i = 0; i < 4; i++) ball(0.02, glowMat(0xffe08a, 2), Math.cos(i * 2.2) * 0.045, 0.08 + i * 0.035, Math.sin(i * 2.2) * 0.045);
    cyl(0.095, 0.095, 0.03, bark, 0, 0.21, 0);
  } else if (/blanket|rain cloak|leaf pack/.test(n)) {
    for (let i = 0; i < 3; i++) {
      const leaf = ball(0.16, leafG, 0, 0.05 + i * 0.045, -i * 0.02, 0.22);
      leaf.scale.set(1, 0.22, 0.62);
      leaf.rotation.y = (i - 1) * 0.5;
    }
    if (/cloak/.test(n)) cyl(0.02, 0.16, 0.2, leafG, 0, 0.12, 0);
  } else if (/root rope/.test(n)) {
    const ropeBrown = mat(0x8a5c36, { roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const coil = add(new THREE.Mesh(new THREE.TorusGeometry(0.11 - i * 0.01, 0.032, 6, 12), ropeBrown));
      coil.rotation.x = -Math.PI / 2;
      coil.position.y = 0.045 + i * 0.055;
    }
    ball(0.05, ropeBrown, 0.1, 0.16, 0); // the knot
    const tail2 = cyl(0.022, 0.028, 0.12, ropeBrown, 0.15, 0.09, 0.03);
    tail2.rotation.z = 0.7;
  } else if (/dew water pouch/.test(n)) {
    sack(0x5e7a4a);
    ball(0.035, glowMat(0x9fd8ff, 0.8), 0.1, 0.22, 0.05);
  } else if (/scent mask/.test(n)) {
    sack(0x5e7a4a);
    ball(0.035, mat(0x9d7fd6), 0.1, 0.22, 0.05);
  } else if (/glow dust/.test(n)) sack(0x9fd8b0, 0.7);
  else if (/snack pouch/.test(n)) {
    sack(0x8a6a42);
    ball(0.03, mat(0x5a2148), 0.09, 0.2, 0.06);
  } else if (/climbing spikes/.test(n)) {
    for (const sx of [-1, 0, 1]) {
      const spike = cyl(0.008, 0.05, 0.3, bark, sx * 0.07, 0.14, 0);
      spike.rotation.z = sx * 0.4;
    }
  } else if (/backpack/.test(n) && !/pin/.test(n)) {
    const leather = mat(0x7a4e2a, { roughness: 0.7 });
    const darkLeather = mat(0x5a3820, { roughness: 0.75 });
    box(0.2, 0.24, 0.13, leather, 0, 0.12, 0);
    const flap = box(0.21, 0.1, 0.145, darkLeather, 0, 0.235, 0);
    flap.rotation.x = 0.12;
    box(0.09, 0.09, 0.05, darkLeather, 0, 0.1, 0.085); // front pocket
    for (const sx of [-1, 1]) {
      box(0.035, 0.23, 0.15, rope, sx * 0.07, 0.12, 0);
      ball(0.018, mat(0xc9a04a, { metalness: 0.5, roughness: 0.4 }), sx * 0.07, 0.185, 0.085);
    }
  } else if (/berry bundle/.test(n)) {
    const stick = box(0.32, 0.025, 0.025, bark, 0, 0.18, 0);
    stick.rotation.z = 0.3;
    for (let i = 0; i < 4; i++) ball(0.05 + (i % 2) * 0.015, mat(0x5a2148, { roughness: 0.35 }), -0.1 + i * 0.07, 0.11 + (i % 2) * 0.05, 0);
  } else if (/roasted beetle/.test(n)) {
    const skewer = box(0.34, 0.02, 0.02, bark, 0, 0.14, 0);
    skewer.rotation.z = 0.25;
    ball(0.06, mat(0x5a3420, { roughness: 0.4 }), -0.05, 0.13, 0, 0.8);
    ball(0.05, mat(0x6b4226, { roughness: 0.4 }), 0.07, 0.16, 0, 0.8);
  } else if (/cheese feast/.test(n)) {
    const wedge = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 3), mat(0xe8c33a)));
    wedge.position.y = 0.06;
    for (let i = 0; i < 3; i++) ball(0.035, mat(0x5a2148, { roughness: 0.35 }), 0.1 - i * 0.09, 0.14, 0.07);
  } else if (/mushroom stew/.test(n)) {
    bowl(0x8a5c36);
    ball(0.03, mat(0xe8dcc4), 0.04, 0.16, 0.02);
    ball(0.026, mat(0xe8dcc4), -0.05, 0.16, -0.03);
  } else if (/poultice/.test(n)) bowl(0x4e7a34);
  else if (/nectar/.test(n)) bowl(0xe8a53a, 0.4);
  else if (/moon petal tea/.test(n)) {
    bowl(0x7a5230);
    for (let i = 0; i < 4; i++) ball(0.028, glowMat(0xcfd8ff, 0.5), Math.cos(i * 1.57) * 0.06, 0.17, Math.sin(i * 1.57) * 0.06, 0.5);
  } else if (/bee wax/.test(n)) {
    cyl(0.11, 0.13, 0.14, mat(0xd8a53a), 0, 0.08, 0);
    cyl(0.12, 0.12, 0.02, bark, 0, 0.16, 0);
  } else if (/warmth stones/.test(n)) {
    const dark = mat(0x55524c, { roughness: 0.55 });
    ball(0.1, dark, -0.07, 0.06, 0, 0.7);
    ball(0.09, dark, 0.07, 0.055, 0.04, 0.7);
    ball(0.075, mat(0x6a675e, { roughness: 0.55 }), 0.02, 0.05, -0.08, 0.7);
    ball(0.08, mat(0x716d64, { emissive: 0xb8562a, emissiveIntensity: 0.28, roughness: 0.5 }), 0, 0.14, -0.01, 0.7);
    ball(0.06, dark, -0.02, 0.2, 0.02, 0.7);
  } else if (/acorn bowl/.test(n)) {
    bowl(0x3a2a1a);
    const rim = add(new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 6, 16), mat(0xc9a04a, { metalness: 0.4, roughness: 0.45 })));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.115;
  }
  else if (/braided grass bracelet/.test(n)) {
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 14), mat(0x5e8a3a)));
    band.rotation.x = -Math.PI / 2;
    band.position.y = 0.05;
    ball(0.035, mat(0xd8b04a), 0.11, 0.05, 0);
  } else if (/lavender anklet/.test(n)) beadRing(0x8a6ac9);
  else if (/feather charm/.test(n)) {
    const feather = ball(0.14, mat(0xd8d2e0), 0, 0.14, 0, 1);
    feather.scale.set(0.28, 1, 0.08);
    feather.rotation.z = 0.5;
    cyl(0.008, 0.008, 0.16, mat(0xe8e4da), -0.07, 0.06, 0);
  } else if (/button/.test(n)) {
    const btn = cyl(0.13, 0.13, 0.045, mat(0xb04a3a), 0, 0.05, 0);
    btn.rotation.x = 0.3;
    ball(0.02, mat(0x6a2a20), 0.03, 0.07, 0);
    ball(0.02, mat(0x6a2a20), -0.03, 0.05, 0);
  } else if (/berry seed charm/.test(n)) {
    for (let i = 0; i < 3; i++) ball(0.055, mat(0x5a2148, { roughness: 0.35 }), Math.cos(i * 2.1) * 0.055, 0.07 + (i % 2) * 0.05, Math.sin(i * 2.1) * 0.055);
    leafG && (ball(0.06, leafG, 0, 0.15, 0, 0.3).scale.z = 0.5);
  } else if (/flower crown/.test(n)) {
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 14), mat(0x5e8a3a)));
    band.rotation.x = -Math.PI / 2;
    band.position.y = 0.06;
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7;
      ball(0.032, mat([0xc98bd6, 0xe8a8c8, 0xf2efe4, 0x9d7fd6][i % 4]), Math.cos(a) * 0.12, 0.085, Math.sin(a) * 0.12);
      ball(0.014, mat(0xf6df7a), Math.cos(a) * 0.12, 0.105, Math.sin(a) * 0.12);
    }
  } else if (/moonstone crown/.test(n)) {
    const gold = mat(0xc9a04a, { metalness: 0.5, roughness: 0.4 });
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.028, 6, 14), gold));
    band.rotation.x = -Math.PI / 2;
    band.position.y = 0.06;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tip = cyl(0.002, 0.018, 0.07, gold, Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12);
    }
    const heart = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), glowMat(0x9fd8ff, 1.5)));
    heart.position.set(0, 0.15, 0.12);
    heart.scale.y = 1.9;
    for (const sx of [-1, 1]) {
      const c = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), glowMat(0x7fb8f0)));
      c.position.set(sx * 0.07, 0.12, 0.1);
      c.scale.y = 1.7;
    }
  } else if (/acorn pendant/.test(n)) {
    ball(0.08, mat(0x8a5c36), 0, 0.1, 0, 1.15);
    cyl(0.085, 0.06, 0.05, bark, 0, 0.18, 0);
    const cord = add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 5, 12), rope));
    cord.position.y = 0.22;
  } else if (/necklace/.test(n)) {
    const cord = add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 5, 14), rope));
    cord.rotation.x = -Math.PI / 2;
    cord.position.y = 0.05;
    const gem = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), glowMat(0x7fc8ff)));
    gem.position.set(0.1, 0.05, 0);
    gem.scale.y = 1.6;
  } else if (/crystal ear/.test(n)) {
    for (const sx of [-1, 1]) {
      const c = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), glowMat(0xbfe0ff, 0.9)));
      c.position.set(sx * 0.07, 0.08, 0);
      c.scale.y = 1.7;
    }
  } else if (/grass hideout/.test(n)) {
    const tent = cyl(0.01, 0.2, 0.26, mat(0x6a8a3a), 0, 0.13, 0);
    tent.rotation.y = 0.3;
    cyl(0.005, 0.14, 0.18, mat(0x87a34a), 0.04, 0.1, 0.08);
  } else if (/twig bridge/.test(n)) {
    for (let i = 0; i < 6; i++) box(0.05, 0.02, 0.14, bark, -0.14 + i * 0.055, 0.06 + Math.sin(i / 5 * Math.PI) * 0.035, 0);
    for (const sz of [-1, 1]) box(0.34, 0.015, 0.015, rope, 0, 0.14, sz * 0.06);
  } else if (/lookout perch/.test(n)) {
    box(0.2, 0.025, 0.16, bark, 0, 0.22, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(0.015, 0.02, 0.22, bark, sx * 0.08, 0.11, sz * 0.06);
  } else if (/escape tunnel/.test(n)) {
    archway(mat(0x4e6a3a));
    cyl(0.1, 0.1, 0.02, mat(0x141210), 0, 0.12, 0.02).rotation.x = Math.PI / 2;
  } else if (/storm door|root door/.test(n)) {
    const frame = /storm/.test(n) ? stone : mat(0x5e8a3a);
    for (let i = 0; i <= 7; i++) {
      const a = (i / 7) * Math.PI;
      ball(0.045, frame, Math.cos(a) * 0.13, 0.05 + Math.sin(a) * 0.13, 0, 0.9);
    }
    box(0.36, 0.055, 0.1, frame, 0, 0.025, 0);
    for (let i = 0; i < 4; i++) box(0.045, 0.19, 0.02, bark, -0.075 + i * 0.05, 0.095, 0.01);
    box(0.2, 0.03, 0.022, mat(0x4e3620), 0, 0.13, 0.02);
    ball(0.016, mat(0xc9a04a, { metalness: 0.5, roughness: 0.4 }), 0.05, 0.1, 0.03);
  } else if (/drying rack/.test(n)) {
    for (const sx of [-1, 1]) cyl(0.015, 0.02, 0.26, bark, sx * 0.13, 0.13, 0);
    box(0.3, 0.02, 0.02, bark, 0, 0.25, 0);
    for (let i = 0; i < 3; i++) cyl(0.03, 0.005, 0.1, leafG, -0.08 + i * 0.08, 0.19, 0);
  } else if (/map table/.test(n)) {
    box(0.26, 0.03, 0.2, bark, 0, 0.14, 0);
    box(0.2, 0.012, 0.15, mat(0xe2cd96), 0, 0.16, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.025, 0.14, 0.025, bark, sx * 0.11, 0.07, sz * 0.08);
  } else if (/trail marker/.test(n)) {
    cyl(0.02, 0.025, 0.24, bark, 0, 0.12, 0);
    ball(0.05, glowMat(0xb8e8a0, 0.8), 0, 0.27, 0);
  } else if (/baby toy/.test(n)) {
    const cloth = mat(0x9a9088, { roughness: 1 });
    ball(0.09, cloth, 0, 0.09, 0, 1);
    ball(0.07, mat(0xa89e94, { roughness: 1 }), 0, 0.2, 0.03);
    for (const sx of [-1, 1]) {
      const ear = ball(0.045, mat(0xc0b4a8), sx * 0.055, 0.27, 0.02);
      ear.scale.z = 0.4;
    }
    const btn = cyl(0.02, 0.02, 0.012, mat(0xb04a3a), 0.032, 0.215, 0.085);
    btn.rotation.x = Math.PI / 2;
    ball(0.012, mat(0x2a2320), -0.03, 0.215, 0.085); // the OTHER eye is a stitch
    box(0.05, 0.008, 0.008, mat(0x6a6058), 0, 0.14, 0.088); // a chest stitch
    const tail = cyl(0.008, 0.014, 0.12, mat(0xc9a08a), 0.04, 0.05, -0.09);
    tail.rotation.x = 1.1;
  } else if (/sap trap/.test(n)) {
    cyl(0.13, 0.1, 0.09, bark, 0, 0.045, 0);
    ball(0.1, glowMat(0xe8a53a, 0.9), 0, 0.1, 0, 0.55);
  } else if (/seed planter/.test(n)) {
    cyl(0.11, 0.08, 0.14, mat(0x8a5c36), 0, 0.08, 0);
    cyl(0.008, 0.008, 0.12, leafG, 0, 0.2, 0);
    ball(0.045, leafG, 0.03, 0.27, 0, 0.5);
    ball(0.04, leafG, -0.035, 0.25, 0.01, 0.5);
  } else if (/portrait wall/.test(n)) {
    box(0.28, 0.24, 0.035, bark, 0, 0.15, 0);
    box(0.22, 0.18, 0.012, mat(0xe2cd96), 0, 0.15, 0.015);
    for (const [mx, mc] of [[-0.045, 0x9a8a7a], [0.045, 0xb0a090]]) {
      ball(0.033, mat(mc), mx, 0.125, 0.03);
      ball(0.024, mat(mc), mx, 0.17, 0.032);
      for (const sx of [-1, 1]) ball(0.012, mat(mc), mx + sx * 0.018, 0.19, 0.03, 0.6);
    }
  } else if (/shrine/.test(n)) {
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI;
      box(0.065, 0.075, 0.06, stone, Math.cos(a) * 0.14, 0.04 + Math.sin(a) * 0.14, -0.02);
    }
    ball(0.075, glowMat(0xa06ae8, 1.6), 0, 0.1, -0.01); // the purple heart-glow
    for (const [cx, ch] of [[-0.09, 0.05], [0.1, 0.06], [0.02, 0.045]]) {
      const c = add(new THREE.Mesh(new THREE.OctahedronGeometry(ch, 0), glowMat(0x9fd8ff, 1.3)));
      c.position.set(cx, 0.2 + ch, -0.02);
      c.scale.y = 1.9;
    }
    for (const sx of [-1, 1]) {
      cyl(0.016, 0.02, 0.05, mat(0xe8dcc4), sx * 0.17, 0.025, 0.06);
      ball(0.014, glowMat(0xffc46a, 2.2), sx * 0.17, 0.06, 0.06);
    }
  } else if (/nursery nest/.test(n)) {
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 7, 14), mat(0xd8d2c4)));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    for (let i = 0; i < 3; i++) ball(0.025, mat(0x9d7fd6), Math.cos(i * 2.1) * 0.07, 0.07, Math.sin(i * 2.1) * 0.07);
  } else if (/thistle bed/.test(n)) {
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 7, 14), stone));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    for (let i = 0; i < 4; i++) ball(0.035, mat(0x9d7fd6), Math.cos(i * 1.57) * 0.06, 0.1, Math.sin(i * 1.57) * 0.06);
  } else if (/den wall/.test(n)) {
    for (let i = 0; i < 5; i++) box(0.05, 0.2 + (i % 2) * 0.06, 0.04, bark, -0.12 + i * 0.06, 0.11 + (i % 2) * 0.03, 0);
  } else if (/keepsake shelf/.test(n)) {
    box(0.28, 0.02, 0.1, bark, 0, 0.1, 0);
    box(0.28, 0.02, 0.1, bark, 0, 0.2, 0);
    for (const sx of [-1, 1]) box(0.02, 0.22, 0.1, bark, sx * 0.13, 0.11, 0);
    ball(0.025, glowMat(0x9fd8ff, 0.6), -0.05, 0.24, 0);
    ball(0.03, mat(0xb04a3a), 0.06, 0.13, 0);
  } else {
    // gentle fallback: a woven bundle in this recipe's own color
    ball(0.13, mat(col), 0, 0.11, 0, 0.8);
    const tie = add(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 5, 10), rope));
    tie.position.y = 0.11;
    tie.rotation.z = Math.PI / 2;
  }

  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

function makeCraftedItem(name) {
  const group = new THREE.Group();

  if (craftModels[name]) {
    // a hand-tuned 3D model (e.g. the Moss Bedding nest)
    group.add(craftModels[name].clone(true));
  } else {
    // its category's handmade shape, colored for this exact recipe
    group.add(buildCraftModel(name));
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
  // ✨ everything you make does something: remember it (for its power)…
  const L = cityLifeSave();
  if (L && L.owned && !L.owned["craft:" + name]) {
    L.owned["craft:" + name] = true;
    saveCityLife();
    if (powerText("craft:" + name)) setTimeout(() => owlSay(`🔨 ${name}! ${powerText("craft:" + name)} (for good!)`), 400);
  }
  // …and food you make goes in your bag, to eat
  if (CRAFT_FOOD[name]) {
    const F = CRAFT_FOOD[name];
    owlSay(`${F.icon} ${name}!${bagFood({ name, icon: F.icon, heal: F.heal, warm: F.warm })}`);
    if (story) story.onCraft(name);
    return;
  }
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
  if (story) story.onCraft(name);
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
  (world === "den" ? denGroup : world === "cave" ? caveGroup : world === "tunnels" ? tunnels.group : outsideGroup).add(carriedItem);
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

// ------------------------------------------------------------
//  🪵  SITTING — perch on a seat (the school stump). W or E stands up.
// ------------------------------------------------------------
let sitting = null; // { x, y, z, face } while seated
const _hipV = new THREE.Vector3();
function sit(x, seatTopY, z, face) {
  // measure how high the hips are above the feet, so any body size sits right
  let hip = 0.24;
  const u = quadMouse && quadMouse.userData;
  if (u && u.legL) {
    u.legL.getWorldPosition(_hipV);
    hip = _hipV.y - mouseRig.position.y;
  }
  sitting = { x, y: seatTopY - hip + 0.03, z, face };
  jumpVel = 0;
  stand = 0;
}
function standUp() {
  if (!sitting) return;
  const s = sitting;
  sitting = null;
  // hop off the back of the seat
  const x = s.x - Math.sin(s.face) * 0.95;
  const z = s.z - Math.cos(s.face) * 0.95;
  mouseRig.position.set(x, world === "outside" ? terrainHeight(x, z) : 0, z);
  const u = quadMouse.userData;
  for (const part of [u.legL, u.legR, u.armL, u.armR]) if (part) part.rotation.x = 0;
}
function holdSit(dt) {
  mouseRig.position.set(sitting.x, sitting.y, sitting.z);
  mouseRig.rotation.y = sitting.face;
  const u = quadMouse.userData;
  quadMouse.rotation.y += (0 - quadMouse.rotation.y) * Math.min(1, dt * 8);
  quadMouse.rotation.x = 0;
  quadMouse.position.y = quadBaseY;
  if (u.legL) u.legL.rotation.x = u.legR.rotation.x = -1.45; // knees forward
  if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -0.55; // paws on knees
  if (u.tail) u.tail.rotation.y = Math.sin(clock.elapsedTime * 1.1) * 0.2;
  if (u.head) u.head.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.05;
  updateBlobShadow(blobShadow, mouseRig, world === "outside" ? terrainHeight(sitting.x, sitting.z) : 0);
  if (isHeld("KeyW", "ArrowUp", "KeyS", "ArrowDown")) standUp();
}

/** Jump the camera straight to its follow spot (after teleporting). */
function snapCamera() {
  if (quadMouse) updateCamera(1);
}

/** Put Thistle somewhere outside, facing `face`. */
function placePlayer(x, z, face) {
  const y =
    world === "outside" ? terrainHeight(x, z)
    : world === "everbough" ? cityFloor(x, z)
    : world === "roothaven" ? roothaven.height(x, z)
    : world === "city" && cityState.current ? cityState.current.height(x, z)
    : 0;
  mouseRig.position.set(x, y, z);
  mouseRig.rotation.y = face;
  jumpVel = 0;
  stand = 0;
  sitting = null;
  turnVel = moveVel = strafeVel = 0;
  snapCamera(); // (a playing cutscene still steers the camera)
}

// 🧭 the GREAT COMPASS round the minimap (the Great Forest): N at the top like the map,
//    and a golden pointer that swings round to show which way you're facing
const compassEl = document.createElement("div");
compassEl.id = "compass";
compassEl.innerHTML = `<svg viewBox="-120 -120 240 240" width="100%" height="100%">
  <defs><radialGradient id="cmpRing" r="1"><stop offset="0.72" stop-color="#3a250e"/><stop offset="0.8" stop-color="#c8963a"/><stop offset="0.9" stop-color="#8a5a1e"/><stop offset="1" stop-color="#3a250e"/></radialGradient></defs>
  <circle r="118" fill="url(#cmpRing)"/>
  <g id="cmpFace">
    <circle r="100" fill="#22170c"/>
    <circle r="100" fill="none" stroke="#c8963a" stroke-width="1.5"/>
    ${[0, 90, 180, 270].map((a) => `<path d="M0,-78 L13,0 L0,0 Z" fill="#e8c878" transform="rotate(${a})"/><path d="M0,-78 L-13,0 L0,0 Z" fill="#a8803a" transform="rotate(${a})"/>`).join("")}
    ${[45, 135, 225, 315].map((a) => `<path d="M0,-50 L9,0 L0,0 Z" fill="#c8a868" transform="rotate(${a})"/><path d="M0,-50 L-9,0 L0,0 Z" fill="#8a6a3a" transform="rotate(${a})"/>`).join("")}
    <circle r="7" fill="#c8963a" stroke="#2a1808" stroke-width="2"/>
  </g>
  <g id="cmpRose">
    ${Array.from({ length: 72 }, (_, i) => `<line x1="0" y1="${i % 9 === 0 ? -116 : -113}" x2="0" y2="-104" stroke="#f0d890" stroke-width="${i % 9 === 0 ? 2.4 : 1}" transform="rotate(${i * 5})"/>`).join("")}
    ${[["N", 0, "#ff5a3a"], ["NE", 45, "#f0d890"], ["E", 90, "#f0d890"], ["SE", 135, "#f0d890"], ["S", 180, "#f0d890"], ["SW", 225, "#f0d890"], ["W", 270, "#f0d890"], ["NW", 315, "#f0d890"]].map(([t, a, c]) => `<text transform="rotate(${a}) translate(0,-90) rotate(${-a})" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-weight="bold" font-size="${t.length === 1 ? 22 : 12}" fill="${c}" stroke="#2a1808" stroke-width="${t.length === 1 ? 3 : 2}" paint-order="stroke">${t}</text>`).join("")}
  </g>
  <g id="cmpFacing"><path d="M0,-121 L11,-99 L0,-104 L-11,-99 Z" fill="#ffd040" stroke="#2a1808" stroke-width="2"/></g>
</svg>`;
document.body.appendChild(compassEl);
function updateCompass() {
  // in the Great Forest it rings the minimap; everywhere else (but indoors) it's just the compass
  const mm = document.getElementById("minimap");
  const withMap = !!mm && getComputedStyle(mm).display !== "none" && world === "outside";
  const show = withMap || (world !== "den" && world !== "home");
  compassEl.style.display = show ? "" : "none";
  document.getElementById("cmpFace").style.display = withMap ? "none" : "";
  document.body.classList.toggle("has-compass", withMap);
  document.body.classList.toggle("compass-shown", show);
  if (!show) return;
  const f = new THREE.Vector3();
  camera.getWorldDirection(f);
  const yaw = Math.atan2(f.x, -f.z); // (0 = facing north, turning clockwise)
  // (the map is north-up, so the ring stays put — the golden pointer shows which way you're facing)
  document.getElementById("cmpFacing").setAttribute("transform", `rotate(${(yaw * 180) / Math.PI})`);
}
// the "Press E to …" bubble
const actPromptEl = document.createElement("div");
actPromptEl.id = "act-prompt";
document.body.appendChild(actPromptEl);

function updateCamera(dt) {
  if (window.__devSelfie) {
    const d = window.__devSelfie;
    const fx = Math.sin(mouseRig.rotation.y);
    const fz = Math.cos(mouseRig.rotation.y);
    camera.position.set(
      mouseRig.position.x + fx * d,
      mouseRig.position.y + 0.72,
      mouseRig.position.z + fz * d
    );
    camera.lookAt(mouseRig.position.x, mouseRig.position.y + 0.45, mouseRig.position.z);
    return;
  }
  if (window.__devRabbitCam) {
    const r = window.__devRabbitCam.position;
    camera.position.set(r.x + 2.2, r.y + 1.0, r.z + 2.2);
    camera.lookAt(r.x, r.y + 0.4, r.z);
    return;
  }
  if (window.__devCam) {
    camera.position.set(...window.__devCam);
    camera.lookAt(...(window.__devLook || [0, 10, 0]));
    return;
  }
  if (window.__devHero) {
    const h = window.__devHero;
    camera.position.set(h, h * 0.62, h);
    camera.lookAt(0, 24, 0);
    return;
  }
  if (window.__devSide) {
    const p = mouseRig.position;
    camera.position.set(p.x + window.__devSide, p.y + 2, p.z + 4);
    camera.lookAt(p.x, p.y, p.z);
    return;
  }
  if (window.__devBird) {
    camera.position.set(mouseRig.position.x, window.__devBird, mouseRig.position.z + 1);
    camera.lookAt(mouseRig.position.x, 0, mouseRig.position.z);
    return;
  }
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

  // Sitting on a stump: a calm view from just behind, looking where she looks
  if (sitting) {
    const fx = Math.sin(sitting.face);
    const fz = Math.cos(sitting.face);
    const desired = new THREE.Vector3(sitting.x - fx * 2.1, sitting.y + 1.25, sitting.z - fz * 2.1);
    camera.position.lerp(desired, Math.min(1, dt * 4));
    tmpTarget.set(sitting.x + fx * 3, sitting.y + 0.35, sitting.z + fz * 3);
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
    mix(1.8, 0.9, skyLook) - lookPitch * 0.9, // mouse-look tilts the camera
    mix(-3.0, -1.8, skyLook)
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
  // --- In Roothaven, keep the camera out of the houses and halls ---
  if (world === "roothaven") {
    roothaven.constrain(camera.position);
    camera.position.y = Math.max(camera.position.y, roothaven.height(camera.position.x, camera.position.z) + 0.5);
  }
  // --- In the tunnels, keep the camera inside the rock too ---
  if (world === "tunnels") {
    tunnels.constrain(camera.position, 0.6);
    const inRoom = tunnels.roomAt(camera.position.x, camera.position.z);
    camera.position.y = Math.min(camera.position.y, inRoom ? 4.6 : 2.7);
  }
  camera.position.y = Math.max(0.4, camera.position.y);

  // Where we look: a touch above the mouse by default, but WAY up high
  // when looking up, so the view points straight at the sky.
  tmpTarget.copy(mouseRig.position);
  tmpTarget.y += mix(1.1, 6.0, skyLook) + lookPitch * 5;
  focusK += ((secretFocus ? 1 : 0) - focusK) * Math.min(1, dt * 5);
  if (lastFocus && focusK > 0.001) tmpTarget.lerp(new THREE.Vector3(lastFocus.x, lastFocus.y, lastFocus.z), focusK * 0.85);
  camera.lookAt(tmpTarget);
}

// ------------------------------------------------------------
//  📐  Keep the game fitting the window when it resizes
// ------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyResolution(renderer);
});

// Dev-only handle so tooling can drive world transitions for verification.
if (import.meta.env.DEV) {
  // dev shortcut: /?out=1&t=0.75&weather=rain drops you straight into
  // a chosen sky (used by headless verification renders too)
  const devQ = new URLSearchParams(location.search);
  if (devQ.get("t")) setTimeOfDay(parseFloat(devQ.get("t")));
  if (devQ.get("weather") && WEATHER_LOOK[devQ.get("weather")]) {
    weatherNow = weatherNext = devQ.get("weather");
    weatherMix = 1;
    weatherTimer = 9999; // hold it steady while we look
  }
  if (devQ.get("face")) mouseRig.rotation.y = parseFloat(devQ.get("face"));
  if (devQ.get("bird")) window.__devBird = parseFloat(devQ.get("bird")) || 90;
  if (devQ.get("holdW")) keys["KeyW"] = true; // fake a held key for tests
  if (devQ.get("side")) window.__devSide = parseFloat(devQ.get("side")) || 30;
  if (devQ.get("probe")) window.__probe = true;
  if (devQ.get("hero")) window.__devHero = parseFloat(devQ.get("hero")) || 150;
  if (devQ.get("cam")) window.__devCam = devQ.get("cam").split(",").map(Number);
  if (devQ.get("audit"))
    setTimeout(() => {
      const pf = window.__plazaFloor;
      const cnt = cityGroup.children.length;
      const low = cityGroup.children.filter((o) => o.position.y < 4 && Math.hypot(o.position.x, o.position.z) < 40).length;
      document.title = pf
        ? `AUDIT kids=${cnt} low=${low} plazaY=${pf.position.y.toFixed(2)} vis=${pf.visible} scene=${!!pf.parent} groupVis=${cityGroup.visible}`
        : `AUDIT kids=${cnt} NO-PLAZA-REF`;
    }, 2500);
  if (devQ.get("look")) window.__devLook = devQ.get("look").split(",").map(Number);
  if (devQ.get("selfie")) window.__devSelfie = parseFloat(devQ.get("selfie")) || 2.2;
  if (devQ.get("crafts")) setTimeout(() => window.__ww.spawnAllCrafts(), 400); // after __ww exists
  if (devQ.get("out")) goOutside();
  if (devQ.get("pos")) {
    // AFTER goOutside — it would otherwise snap us back to spawn
    const [px, pz] = devQ.get("pos").split(",").map(Number);
    mouseRig.position.set(px, terrainHeight(px, pz), pz);
    setTimeout(snapCamera, 0); // (quadMouse may still be loading)
    setTimeout(snapCamera, 1500);
  }
  if (devQ.get("y")) mouseRig.position.y = parseFloat(devQ.get("y"));
  if (devQ.get("cave")) goCave();
  if (devQ.get("city")) goEverbough();
  if (devQ.get("tut") === "book") setTimeout(openMenu, 800);
  if (devQ.get("trailfor")) {
    // set a material trail once the world is in (e.g. &trailfor=Moss)
    setTimeout(() => owlSay(setMaterialTrail(devQ.get("trailfor"))), 2500);
  }
  if (devQ.get("recipe")) {
    // open the recipe book on recipe N with its first ingredient's 📍 showing
    setTimeout(() => {
      openMenu();
      showRecipe(RECIPES[(parseInt(devQ.get("recipe"), 10) || 1) - 1]);
      const first = recipePopupEl.querySelector(".ing");
      if (first) first.click();
    }, 800);
  }
  if (devQ.get("caps")) capsLock = true; // (test: belly-sled)
  if (devQ.get("credits")) setTimeout(() => creditsBtn.click(), 2500);
  if (devQ.get("wear")) setTimeout(() => {
    for (const k of devQ.get("wear").split(",")) {
      const why = toggleWear(k);
      document.title += " | " + k + ":" + (why || "ok");
    }
    applyLook(quadMouse);
  }, 4000);
  if (devQ.get("gohome")) setTimeout(() => enterHome(devQ.get("gohome"), { x: 0, z: 70, face: Math.PI }), 2500);
  if (devQ.get("cpos")) {
    // (test) stand at x,z inside a city, once it's loaded
    setTimeout(() => {
      const [x, z] = devQ.get("cpos").split(",").map(Number);
      placePlayer(x, z, 0);
      if (devQ.get("fish")) addToPack("Fish", 3, true);
    }, 2500);
  }
  if (devQ.get("atstation")) {
    // stand beside the first Moonkeeper station
    const iv = setInterval(() => {
      const st4 = JSON.parse(localStorage.getItem("ww.story.v1") || "{}");
      const at = st4.p4 && st4.p4.stonesAt && st4.p4.stonesAt[0];
      if (!at || !quadMouse || world !== "outside") return;
      clearInterval(iv);
      placePlayer(at.x + 2, at.z + 1, 0);
    }, 300);
  }
  if (devQ.get("presse")) {
    // test: press E (whatever is here) after this many ms
    setTimeout(() => {
      const it = currentInteract();
      document.title = "E: " + (it ? it.label : "(nothing)");
      if (it) it.act();
    }, parseInt(devQ.get("presse"), 10) || 3000);
    window.addEventListener("error", (e) => (document.title = "ERR " + e.message + " @" + (e.filename || "").split("/").pop() + ":" + e.lineno));
    setInterval(() => {
      if (!document.title.startsWith("ERR")) document.title = "world=" + world + " cs=" + window.__cs + " playing=" + cutscenePlaying();
    }, 4000);
  }
  if (devQ.get("pack")) {
    // open the backpack with a few things in it
    setTimeout(() => {
      for (const [it, n] of [["Twigs", 6], ["Pine Needles", 4], ["Glowing Moss", 2], ["Crystal Fragments", 1], ["Berries", 9], ["String", 3], ["Cheese Chunk", 1], ["Moon Petals", 3]]) addToPack(it, n, true);
      drawPack();
      packEl.classList.add("open");
    }, 1500);
  }
  if (devQ.get("rh")) {
    // straight down to Roothaven
    const iv = setInterval(() => {
      if (!quadMouse) return;
      clearInterval(iv);
      goRoothaven();
    }, 200);
  }
  if (devQ.get("swim")) {
    // into the creek, beside its bridge, facing downstream
    const iv = setInterval(() => {
      if (!quadMouse || world !== "outside" || !CREEK_BRIDGE.ready) return;
      clearInterval(iv);
      const B = CREEK_BRIDGE;
      placePlayer(B.x + B.sz * 10, B.z - B.sx * 10, Math.atan2(B.sz, -B.sx));
    }, 200);
  }
  if (devQ.get("view")) {
    // fixed test cameras: &view=lower | bridge | hollow | creek
    const iv = setInterval(() => {
      if (!quadMouse || world !== "outside" || !HOLLOW_DOORS.ready || !CREEK_BRIDGE.ready) return;
      clearInterval(iv);
      const F = FALLS_POS;
      const L = Math.hypot(F.x, F.z);
      const ax = F.x / L;
      const az = F.z / L;
      const W = (lx, z) => [F.x + z * ax + lx * az, F.z + z * az - lx * ax];
      const H = (lx, z) => terrainHeight(...W(lx, z));
      const v = devQ.get("view");
      let cam, look;
      if (v === "lower") {
        const [cx, cz] = W(5, 17);
        const [lx2, lz2] = W(0, 32);
        cam = [cx, H(0, 0) + 4, cz];
        look = [lx2, H(0, 0) + 2.5, lz2];
      } else if (v === "bridge") {
        const [cx, cz] = W(-10, 28);
        const [lx2, lz2] = W(0, 44);
        cam = [cx, H(0, 50) + 7, cz];
        look = [lx2, H(0, 44) + 0.5, lz2];
      } else if (v === "stair") {
        const [cx, cz] = W(3, 103.5);
        const [lx2, lz2] = W(0, 111.6);
        cam = [cx, H(0, 103.5) + 5.5, cz];
        look = [lx2, H(0, 111.6) - 2, lz2];
      } else if (v === "hollow") {
        const [cx, cz] = W(3, 93);
        const [lx2, lz2] = W(0, 83);
        cam = [cx, H(0, 92) + 3, cz];
        look = [lx2, H(0, 84) + 1.8, lz2];
      } else {
        const B = CREEK_BRIDGE;
        cam = [B.x + B.sz * 34, terrainHeight(B.x, B.z) + 7, B.z - B.sx * 34];
        look = [B.x, terrainHeight(B.x, B.z) + 1, B.z];
      }
      placePlayer(cam[0] + 400, cam[2], 0); // the mouse waits off-stage
      window.__devCam = cam;
      window.__devLook = look;
    }, 200);
  }
  if (devQ.get("hdoor") || devQ.get("bridge")) {
    // test views: &hdoor=out (the pool, facing the hidden arch), &hdoor=in
    // (inside the Hollow, facing the way back), &bridge=1 (by the creek bridge)
    const iv = setInterval(() => {
      if (!quadMouse || world !== "outside") return;
      const D = HOLLOW_DOORS;
      if (devQ.get("bridge")) {
        if (!CREEK_BRIDGE.ready) return;
        clearInterval(iv);
        const B = CREEK_BRIDGE;
        placePlayer(B.x - B.sx * 30 + B.sz * 6, B.z - B.sz * 30 - B.sx * 6, Math.atan2(B.sx, B.sz));
        return;
      }
      if (!D.ready) return;
      clearInterval(iv);
      if (devQ.get("hdoor") === "in") placePlayer(D.insideStand.x, D.insideStand.z, D.intoHollow + Math.PI);
      else placePlayer(D.outsideStand.x, D.outsideStand.z, D.intoHollow);
    }, 200);
  }
  if (devQ.get("camp")) {
    // stand at the edge of the giants' summer campsite
    const iv = setInterval(() => {
      if (!CAMPSITE.ready || !quadMouse || world !== "outside") return;
      clearInterval(iv);
      const d = parseFloat(devQ.get("camp")) > 1 ? parseFloat(devQ.get("camp")) : 40;
      placePlayer(CAMPSITE.x + d, CAMPSITE.z + d, Math.atan2(-1, -1));
    }, 200);
  }
  if (devQ.get("hole")) {
    // wait for Everbough to load, then stand a few steps out from its secret hole
    const iv = setInterval(() => {
      if (!EVERBOUGH_HOLE.ready || world !== "outside") return;
      clearInterval(iv);
      const h = EVERBOUGH_HOLE;
      const d = parseFloat(devQ.get("hole")) || 5;
      placePlayer(h.x + h.out.x * d, h.z + h.out.z * d, Math.atan2(-h.out.x, -h.out.z));
      snapCamera();
    }, 200);
  }
  if (devQ.get("seat")) {
    // sit on the new student's stump in the classroom
    const iv = setInterval(() => {
      if (!schoolPos || !quadMouse || world !== "outside") return;
      clearInterval(iv);
      const x = schoolPos.x + SCHOOL_SPOTS.seat[0];
      const z = schoolPos.z + SCHOOL_SPOTS.seat[1];
      placePlayer(x + 1, z, -Math.PI / 2);
      sit(x, terrainHeight(x, z) + 0.91, z, -Math.PI / 2);
      snapCamera();
    }, 200);
  }
  if (devQ.get("tunnels")) {
    goTunnels(devQ.get("tunnels") === "well" ? "well" : "landing");
    const room = tunnels.rooms[devQ.get("room")];
    if (room) mouseRig.position.set(room.x, 0, room.z + 2);
    if (devQ.get("station")) {}
    if (devQ.get("room") === "sealed") {
      // right in front of the Sealed Door
      const d = tunnels.spots.door;
      mouseRig.position.set(d.x, 0, d.z);
    }
    if (devQ.get("room") === "rope") {
      // right beside the Well Passage rope
      const r = tunnels.spots.wellRope;
      mouseRig.position.set(r.x + 0.6, 0, r.z + 0.6);
    }
  }

  window.__ww = {
    goOutside,
    goInside,
    goCave,
    mouseRig,
    camera,
    setTimeOfDay,
    setWeather,
    get weather() { return { now: weatherNow, next: weatherNext, cloud: cloudAmt, rain: rainAmt }; },
    get owlState() { return owlState; },
    get rooms() { return Object.entries(homeState.all).map(([k, h]) => k + (h.group.visible ? " (SHOWING)" : "")); }, // (test hook)
    falls: FALLS_POS,
    // lay out every recipe's crafted model in the den (visual checks)
    spawnAllCrafts() {
      RECIPES.forEach((r, i) => {
        const it = makeCraftedItem(r.name);
        it.position.set(((i % 10) - 4.5) * 1.05, 0, Math.floor(i / 10) * 1.05 - 2.2);
        denGroup.add(it);
        droppedItems.push(it);
      });
    },
  };
}

// ------------------------------------------------------------
//  💾  SAVING — your pack, health, the time of day, and where you are
//  are remembered in this browser, so a refresh picks up right where you
//  left off. (Story progress is saved by story.js.) ?newgame=1 starts over.
// ------------------------------------------------------------
const SAVE_KEY = "ww.save.v1";
const devParams = [...new URLSearchParams(location.search).keys()];
// (?newgame=1 is handled in boot.js, before any module reads its save)
// Test URLs that set up their own scene (cpos, cam, city…) never load or
// overwrite a save — but the designer's helpers (story jumps, cheats) DO save,
// so you never lose your progress on a refresh.
const SAVE_SAFE = ["hd", "res", "newgame", "savetest", "showpack", "designer", "give", "story", "coins", "season", "shards", "tut", "finishquests", "lifegoals", "growdragon", "nextphase", "gophase"];
const saving = devParams.every((k) => SAVE_SAFE.includes(k));
// One-shot helpers (wipe, story jump, cheats) come OFF the address bar once
// they've run — so pressing refresh just reloads your game, it never repeats them.
{
  const ONE_SHOT = ["newgame", "story", "give", "coins", "designer", "season", "shards", "tut", "finishquests", "lifegoals", "growdragon", "nextphase", "gophase"];
  const url = new URL(location.href);
  if (ONE_SHOT.some((k) => url.searchParams.has(k)) && saving) {
    setTimeout(() => {
      for (const k of ONE_SHOT) url.searchParams.delete(k);
      history.replaceState(null, "", url.pathname + (url.searchParams.toString() ? "?" + url.searchParams : "") + url.hash);
    }, 4000);
  }
}
function saveGame() {
  if (!saving || cutscenePlaying()) return;
  const p = mouseRig.position;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      inventory, health, dayTime, world: world === "home" ? (homeState.back && homeState.back.world) || "outside" : world,
      cityId: world === "city" && cityState.current ? cityState.current.id : world === "home" && homeState.back ? homeState.back.cityId : null,
      pos: [p.x, p.y, p.z], ry: mouseRig.rotation.y,
    }));
  } catch {}
}
let packDirty = false;
function packChanged() {
  packDirty = true; // the checklist + backpack redraw on the next frame
}
function loadGame() {
  if (!saving) return;
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch {}
  if (!s) return;
  Object.assign(inventory, s.inventory || {});
  if (typeof s.health === "number") health = s.health;
  if (typeof s.dayTime === "number") setTimeOfDay(s.dayTime);
  const [x, y, z] = s.pos || [0, 0, 0];
  if (s.world === "outside") goOutside();
  else if (s.world === "roothaven") goRoothaven();
  else if (s.world === "tunnels") goTunnels();
  else if (s.world === "cave") goCave();
  else if (s.world === "everbough") goEverbough();
  else if (s.world === "city" && s.cityId && CITY_INFO[s.cityId]) goCity(s.cityId);
  if (s.world && s.world !== "den") {
    mouseRig.position.set(x, y, z);
    mouseRig.rotation.y = s.ry || 0;
  }
  snapCamera();
}
setInterval(saveGame, 2000);
window.addEventListener("beforeunload", saveGame);
window.addEventListener("pagehide", saveGame); // (Safari / mobile fire this instead)

// ------------------------------------------------------------
//  🎒  THE BACKPACK (B) — everything you're carrying, at a glance
// ------------------------------------------------------------
const packEl = document.createElement("div");
packEl.id = "backpack";
keepScrollOnRedraw(packEl); // (putting something on doesn't jump the backpack back to the top)
document.body.appendChild(packEl);
const ITEM_ICON = {
  twig: "🪵", stick: "🪵", "pine needle": "🌲", "large leave": "🍂", moss: "🌿", "glowing moss": "✨",
  "bark strip": "🪵", "bark fiber": "🧵", "bark sheet": "📜", "root fiber": "🧶", "grass fiber": "🌾",
  "dry grass": "🌾", "tall grass": "🌾", "clover seed": "☘️", "oat grain": "🌾", "flower petal": "🌸",
  wildflower: "🌼", "lavender flower": "💜", "thistle flower": "🌺", nectar: "🍯", "honey drop": "🍯",
  "bee wax": "🕯️", "moon petal": "🌙", herb: "🌱", "bitter herb": "🌱", berry: "🫐", "berry seed": "🫐",
  "berry juice": "🧃", mushroom: "🍄", "mushroom cap": "🍄", "mushroom dust": "🍄", "medicinal mushroom": "🍄",
  "glowing mushroom": "🍄", beetle: "🪲", "beetle shell": "🪲", firefly: "✨", "creek water": "💧",
  "acorn cap": "🌰", "large acorn cap": "🌰", stone: "🪨", "smooth stone": "🪨", "tiny pebble": "🪨",
  "clay mud": "🟤", "packed dirt": "🟫", "crystal fragment": "💎", "ancient seed": "🌰", feather: "🪶",
  "owl feather": "🪶", "cloth scrap": "🧣", "cloth fiber": "🧵", "soft cloth fiber": "🧵", string: "🧵",
  "human button": "🔘", "tiny button": "🔘", "tiny bead": "🔮", "tiny trinket": "💍", "glass fragment": "🔷",
  "human paper scrap": "📄", "cheese chunk": "🧀", "butter bit": "🧈", "sharp thorn": "🌵", "sap droplet": "🟠",
  fish: "🐟", egg: "🥚", milk: "🥛", butter: "🧈", "cheese wheel": "🧀", carrot: "🥕", beet: "🟣", squash: "🎃",
  pumpkin: "🎃", sunflower: "🌻", strawberry: "🍓", "frost quartz": "💠", amethyst: "🔮", "rose ice": "🌹",
  moonstone: "🌙", "water lily": "🪷", "iris bouquet": "💐", "marsh marigold": "🌼", "moon lotus bloom": "🪷", "ice crystal shard": "🧊",
};
const titleCase = (k) => k.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());
function drawPack() {
  const items = Object.entries(inventory).filter(([, n]) => n > 0).sort((a, b) => a[0].localeCompare(b[0]));
  const cells = items.length
    ? items.map(([k, n]) => USE[k]
        ? `<div class="cell food"><span class="ic">${USE[k].icon}</span><b>${n}</b><span class="nm">${titleCase(k)}</span><button class="eat" data-use="${k}">✨ use</button></div>`
        : FOOD[k]
        ? `<div class="cell food"><span class="ic">${FOOD[k].icon}</span><b>${n}</b><span class="nm">${titleCase(k)}</span><button class="eat" data-eat="${k}" title="+${FOOD[k].heal} ❤️">🍴 eat +${FOOD[k].heal}</button></div>`
        : `<div class="cell"><span class="ic">${ITEM_ICON[k] || "📦"}</span><b>${n}</b><span class="nm">${titleCase(k)}</span></div>`).join("")
    : `<div class="empty">Nothing yet — press E on things on the forest floor to gather them.</div>`;
  const kit = story ? story.kitInfo() : { tools: [], abilities: [], rep: [] };
  const list = (arr) => arr.map((t) => `<span class="tag">${t}</span>`).join("");
  // 🔖 shortcuts: jump straight to any part of the backpack
  const pw = powerSummaryHTML();
  const jumps = [
    ["mat", "🧺 Materials", true], ["tools", "🧰 Tools", kit.tools.length], ["abil", "🌟 Abilities", kit.abilities.length], ["pow", "✨ Powers", pw],
    ["treas", "💎 Treasures", ownedList().length], ["use", "✨ Use", itemUses && itemUses.usableHTML()], ["rep", "🏅 Reputation", kit.rep.length], ["purse", "🪙 Purse", true], ["ride", "🐴 Ride", hasMount()], ["pets", "🐾 Pets", true], ["wear", "👕 Clothes", true],
  ].filter((j) => j[2]);
  const A = (id) => `<a class="pk-anchor" id="pk-${id}"></a>`;
  packEl.innerHTML = `
    <div class="sheet">
      ${A("top")}<h2>🎒 Thistle's Backpack</h2>
      <div class="pk-jump">${jumps.map(([id, label]) => `<button data-jump="${id}">${label}</button>`).join("")}<button data-jump="top" title="back to the top">🔝</button></div>
      ${A("mat")}<div class="sub">Materials — ${items.length} kinds · room for ${packLimit()} of each${ability("pack") ? " (Travel Backpack!)" : ""}</div>
      <div class="grid">${cells}</div>
      ${kit.tools.length ? `${A("tools")}<h3>Tools & keepsakes</h3><div class="tags">${list(kit.tools)}</div>` : ""}
      ${kit.abilities.length ? `${A("abil")}<h3>Abilities</h3><div class="tags">${list(kit.abilities)}</div>` : ""}
      ${pw ? A("pow") + pw : ""}
      ${ownedList().length ? `${A("treas")}<h3>Treasures from the cities</h3><div class="tags">${list(ownedList())}</div>` : ""}
      ${itemUses && itemUses.usableHTML() ? A("use") + itemUses.usableHTML() : ""}
      ${kit.rep.length ? `${A("rep")}<h3>Reputation</h3><div class="tags">${list(kit.rep)}</div>` : ""}
      ${A("purse")}<h3>Purse</h3><div class="tags"><span class="tag">🪙 ${getCoins()} coins</span></div>
      ${hasMount() ? `${A("ride")}<h3>🐴 Your ride <small style="font:12px system-ui;opacity:.7">(Caps Lock to ride)</small></h3><div class="wear">${MOUNTS.filter((m) => hasItem(m.key)).map((m) => `<button class="wcell ${mountNow() === m.key ? "on" : ""}" data-mount="${m.key}"><span class="ic">${m.icon}</span><span class="nm">${m.name}</span><small>${mountNow() === m.key ? "✓ riding this one" : "click to ride this one"}</small></button>`).join("")}</div>` : ""}
      ${A("pets")}<h3>🐾 Pets</h3>
      <div class="wear">${petsHTML()}</div>
      ${petWearHTML() ? `<h3>🎀 Pet clothes <small style="font:12px system-ui;opacity:.7">(fit every pet — swap them any time)</small></h3><div class="wear">${petWearHTML()}</div>` : ""}
      ${A("wear")}<h3>👕 Clothing & Accessories <button class="mirror">${window.__devSelfie ? "🙈 Stop looking" : "👀 Look in the mirror"}</button></h3>
      <div class="wear">${wardrobeList().length
        ? wardrobeList().map((w) => `<button class="wcell ${w.worn ? "on" : ""} ${w.here ? "" : "away"}" data-w="${w.key}"><span class="ic">${w.icon}</span><span class="nm">${w.name}</span><small>${!w.here ? "only in " + w.cityName : w.slotName + " · " + (w.worn ? "✓ wearing — click to take off" : "click to put on")}</small></button>`).join("")
        : `<div class="empty">Nothing to wear yet — the city markets, the Tailor in Everbough and Frostpine's knitters sell clothes.</div>`}</div>
      <div class="close">B or Esc — close</div>
    </div>`;
}
const packOpen = () => packEl.classList.contains("open");
// clicks inside the backpack: put clothes on / take them off, the mirror
packEl.addEventListener("click", (e) => {
  // ✨ use one of your treasures
  const ui = e.target.closest("[data-useitem]");
  if (ui) {
    packEl.classList.remove("open"); // (close the bag so you can see what happens)
    itemUses.use(ui.dataset.useitem);
    return;
  }
  // 🐴 pick who you ride
  const mt = e.target.closest("[data-mount]");
  if (mt) {
    cityLifeSave().mount = mt.dataset.mount;
    saveCityLife();
    owlSay(`${(MOUNTS.find((m) => m.key === mt.dataset.mount) || {}).icon} You'll ride ${(MOUNTS.find((m) => m.key === mt.dataset.mount) || {}).name} now! (Caps Lock)`);
    drawPack();
    return;
  }
  // 🔖 a shortcut button
  const j = e.target.closest("[data-jump]");
  if (j) {
    const to = packEl.querySelector("#pk-" + j.dataset.jump);
    if (to) to.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  // ✨ open a bottled blizzard / thunderstorm / rainbow / sunset
  const use = e.target.closest("[data-use]");
  if (use) {
    const k = use.dataset.use;
    if (!USE[k] || !(inventory[k] > 0)) return;
    inventory[k]--;
    packChanged();
    packEl.classList.remove("open"); // (close the bag so you can watch it happen)
    USE[k].act();
    return;
  }
  // 🍴 eat something from the bag
  const eat = e.target.closest("[data-eat]");
  if (eat) {
    const k = eat.dataset.eat;
    const f = FOOD[k];
    if (!f || !(inventory[k] > 0)) return;
    inventory[k]--;
    health = Math.min(100, health + f.heal);
    if (f.warm) window.dispatchEvent(new Event("ww-warm"));
    biteTimer = BITE_TIME;
    packChanged();
    if (story) story.chime();
    owlSay(`${f.icon} Mmm — ${f.name}! (+${f.heal} ❤️)${f.warm ? " Toasty warm!" : ""}`);
    drawPack();
    return;
  }
  const pw = e.target.closest("[data-petwear]");
  if (pw) {
    togglePetWear(pw.dataset.petwear);
    pets.sync();
    drawPack();
    return;
  }
  const pe = e.target.closest("[data-pet]");
  if (pe) {
    pets.setRiding(false);
    togglePet(pe.dataset.pet);
    pets.sync();
    drawPack();
    return;
  }
  const w = e.target.closest("[data-w]");
  if (w) {
    const why = toggleWear(w.dataset.w);
    if (why) owlSay(why);
    applyLook(quadMouse);
    drawPack();
  }
  if (e.target.closest(".mirror")) {
    window.__devSelfie = window.__devSelfie ? 0 : 2.4; // the camera swings round to look at you
    drawPack();
  }
});
onLookChange(() => applyLook(quadMouse));
window.addEventListener("ww-refresh", () => story && story.refresh());
window.addEventListener("keydown", (e) => {
  if (cutscenePlaying()) return;
  if (e.code === "KeyB" && !e.repeat) {
    if (packOpen()) {
      packEl.classList.remove("open");
      window.__devSelfie = 0; // (put the mirror away)
    }
    else {
      drawPack();
      packEl.classList.add("open");
    }
  } else if (e.code === "Escape" && packOpen()) {
    packEl.classList.remove("open");
    window.__devSelfie = 0;
  }
});
setInterval(() => {
  if (!packDirty) return;
  packDirty = false;
  if (story) story.refresh(); // the checklist counts what's in your pack
  if (packOpen()) drawPack();
}, 150);

// 📖 The story (Phase 1: the last day at the Fallen Log School).
// A brand-new game starts there; any dev URL param (except hd/res/story)
// skips the automatic opening so test views stay put.
story = initStory({
  school: () => schoolPos,
  terrainHeight,
  mouseRig,
  outsideGroup,
  npcs: SCHOOL_NPCS,
  spots: SCHOOL_SPOTS,
  quadMouse: () => quadMouse,
  playing: () => cutscenePlaying(),
  setFlight: (fn) => (flightCtl = fn), // (🐢 Phase 27: riding the sea turtle)
  setFlightCam: (fn) => (flightCam = fn),
  camera,
  renderer, // (🖱 the Sky Cup grabs the mouse)
  world: () => world,
  goOutside,
  say: owlSay,
  sit,
  isSitting: () => !!sitting,
  setTime: setTimeOfDay,
  placePlayer,
  bite: () => (biteTimer = BITE_TIME),
  // Phase 2 needs these:
  camera,
  snapCamera,
  isWater,
  berrySpots: () => berrySpots,
  falls: FALLS_POS,
  litterNear,
  takeLitter,
  biomeAt,
  fox: ensureFox,
  resetFox,
  foxHunt,
  heal: (n) => (health = Math.min(100, health + n)),
  walkPose: (dt) => updateMousePose(dt, true),
  home: { x: DEN_ENTRANCE.x, z: DEN_ENTRANCE.z },
  campsite: CAMPSITE,
  hollow: HOLLOW_CENTER,
  hollowDoor: HOLLOW_DOORS,
  moonDoor: MOON_DOOR,
  fallsToWorld,
  journalPos: JOURNAL_POS,
  packCount: (item) => inventory[keyOf(item)] || 0,
  addToPack: (item, n) => addToPack(item, n, true),
  has: (k) => ability(k),
  roothaven,
  tunnels,
  dayTime: () => dayTime,
  terrainHeight,
  setCloak: (on) => setCloak(on),
  nearestStation: () => {
    const T = story ? story.travelInfo() : { stations: [] };
    let best = null;
    let bd = Infinity;
    for (const s2 of T.stations) {
      const d = Math.hypot(s2.x - mouseRig.position.x, s2.z - mouseRig.position.z);
      if (d < bd) { bd = d; best = s2; }
    }
    return best;
  },
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  scene,
  addPlatform: (x, z, r, y) => outsideColliders.push({ type: "platform", x, z, r, y }),
  creekBridge: CREEK_BRIDGE,
  buildPony,
  cityBuilt: () => cityBuilt,
  saveCity: () => saveCityLife(),
  goEverbough,
  goCity,
  goRoothaven: () => goRoothaven(),
  waterMode: () => waterMode(),
  dishes: () => DISHES.map((d) => d.key),
  moving: () => Math.abs(moveVel) > 0.5 || Math.abs(strafeVel) > 0.5,
  waterY: () => mouseRig.position.y + SWIM_DEPTH,
  city: () => (world === "city" ? cityState.current : null),
  setRaft: (on) => (raftOn = on),
  hurt: (n) => hurt(n),
  cityHeight: cityFloor,
  cityGroup,
  cityDusk,
  // the height of a great tree's deck in Everbough (Infinity until it's built)
  deckY: (k) => {
    const at = { canopy: [90, 30], heart: [0, -60], leaves: [-95, 20], mill: [-70, 100], green: [70, 105] }[k];
    const p = at && cityPlatforms.find((c) => Math.hypot(c.x - at[0], c.z - at[1]) < 1);
    return p ? p.y : Infinity;
  },
  isHollow,
  hole: EVERBOUGH_HOLE,
  playing: () => cutscenePlaying(),
  packTake: (item, n) => {
    inventory[keyOf(item)] = Math.max(0, (inventory[keyOf(item)] || 0) - n);
    packChanged();
  },
  nearestBiomeSpot: (biome, from) => locatePlace("biome:" + biome, from),
  // no tree trunk, rock, bush or building within r of (x, z)?
  isClear: (x, z, r) => {
    for (const c of outsideColliders) {
      if (c.type === "trunk") {
        const b = c.samples[0];
        if (Math.hypot(x - b.x, z - b.z) < b.r + r) return false;
      } else if (c.type === "tube") {
        if (Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r) return false;
      } else if (c.r && Math.hypot(x - c.x, z - c.z) < c.r + r) return false;
    }
    return true;
  },
  nearWater: (x, z) => isWater(x, z) || isWater(x + 6, z) || isWater(x - 6, z) || isWater(x, z + 6) || isWater(x, z - 6),
  silverveilOpen: () => !!(extras && extras.silverveilOpen()),
  inTallGrass: (x, z) => !!tallGrassPos && Math.hypot(x - tallGrassPos.x, z - tallGrassPos.z) < 140,
  autoStart: [...new URLSearchParams(location.search).keys()].every((k) => ["hd", "res", "story"].includes(k)) ||
    new URLSearchParams(location.search).get("minimal") === "school",
});

// ✨ seasons, festivals, furniture, the Collection Book, guilds, rescues,
// the Night Market, photo mode, and Silverveil (extras.js)
extras = initExtras({
  mouseRig,
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  outsideGroup,
  cityGroup,
  roothaven,
  terrainHeight,
  cityHeight: cityFloor,
  cityBuilt: () => cityBuilt,
  addCityCol: (x, z, r) => outsideCityCol.push({ x, z, r }),
  dayTime: () => dayTime,
  say: owlSay,
  chime: () => story && story.chime(),
  bite: () => (biteTimer = BITE_TIME),
  heal: (n) => (health = Math.min(100, health + n)),
  addRep: (c, n) => story && story.addRep(c, n),
  storyPhase: () => (story ? story.phase : 0),
  playing: () => cutscenePlaying(),
  homeNow: () => (world === "home" ? homeState.current : null),
  journalPos: JOURNAL_POS,
  school: () => schoolPos,
  isWater,
  addToPack: (it, n) => addToPack(it, n, true),
  deckY: (k) => {
    const at = { canopy: [90, 30], heart: [0, -60] }[k];
    const p = at && cityPlatforms.find((c) => Math.hypot(c.x - at[0], c.z - at[1]) < 1);
    return p ? p.y : Infinity;
  },
  camera,
  renderer,
  renderNow: () => renderer.render(scene, camera),
});

// ⚔️ the quests: the Pact Peaks, the Drowned Library, and more (quests.js) — Q for the log
quests = initQuests({
  mouseRig,
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  goCity,
  placePlayer,
  outsideGroup,
  cityGroup,
  terrainHeight,
  cityHeight: cityFloor,
  cityBuilt: () => cityBuilt,
  cityPlatforms: () => cityPlatforms || [],
  cityCols: () => outsideCityCol,
  deckY: (k) => {
    const at = { canopy: [90, 30] }[k];
    const p = at && cityPlatforms.find((c) => Math.hypot(c.x - at[0], c.z - at[1]) < 1);
    return p ? p.y : Infinity;
  },
  say: owlSay,
  chime: () => story && story.chime(),
  bite: () => (biteTimer = BITE_TIME),
  hurt: (n) => hurt(n),
  playing: () => cutscenePlaying(),
  isWater,
  school: () => schoolPos,
  campsite: CAMPSITE,
  creekBridge: CREEK_BRIDGE,
  hollow: HOLLOW_CENTER,
  journalPos: JOURNAL_POS,
  designer: () => designerMode,
  scene,
});

// 🍲 cooking + the Harvest Feast, 💌 friends + letters
{
  const packApi = {
    mouseRig,
    world: () => world,
    city: () => (world === "city" ? cityState.current : null),
    packCount: (it) => inventory[keyOf(it)] || 0,
    packTake: (it, n) => {
      inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
      packChanged();
    },
    packList: () => Object.entries(inventory),
    addToPack: (it, n) => addToPack(it, n, true),
    setIcon: (k, icon) => (ITEM_ICON[k] = icon),
    iconFor: (k) => ITEM_ICON[k] || "📦",
    heal: (n) => (health = Math.min(100, health + n)),
    bite: () => (biteTimer = BITE_TIME),
    say: owlSay,
    chime: () => story && story.chime(),
    playing: () => cutscenePlaying(),
  };
  cooking = initCooking(packApi);
  friends = initFriends(packApi);
}
// 🌟 the village, legendary creatures, weather events, music, photo requests,
// Sprig's hide & seek, titles, and the people of Nimbusreach (more.js)
more = initMore({
  mouseRig,
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  scene,
  outsideGroup,
  terrainHeight,
  isWater,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  den: DEN_ENTRANCE,
  ready: () => !!schoolPos,
  packCount: (it) => inventory[keyOf(it)] || 0,
  packTake: (it, n) => {
    inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
    packChanged();
  },
  addToPack: (it, n) => addToPack(it, n, true),
  heal: (n) => (health = Math.min(100, health + n)),
  setTime: (t) => setTimeOfDay(t),
  dayTime: () => dayTime,
  say: owlSay,
  chime: () => story && story.chime(),
  playing: () => cutscenePlaying(),
  story: () => (story ? story.state() : {}),
  petNear: () => pets.hasPet(),
  sprigNear: () => !!(story && story.state().p12 && story.state().p12.apprentice && !window.__sprigHidden),
  sprigActive: () => !!(story && story.state().p12 && story.state().p12.apprentice && story.state().phase >= 12),
  sprigHide: (on) => (window.__sprigHidden = on),
});
// 🌟 time trials, the fishing tournament, the vault, your garden, birthdays,
// the storybook, New Game+, baby animals, music + sounds, dog sleds (more2.js)
more2 = initMore2({
  mouseRig,
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  scene,
  outsideGroup,
  cityGroup,
  terrainHeight,
  cityHeight: cityFloor,
  cityCols: () => outsideCityCol,
  isWater,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  den: DEN_ENTRANCE,
  ready: () => !!schoolPos,
  school: () => schoolPos,
  packCount: (it) => inventory[keyOf(it)] || 0,
  packTake: (it, n) => {
    inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
    packChanged();
  },
  addToPack: (it, n) => addToPack(it, n, true),
  say: owlSay,
  chime: () => story && story.chime(),
  playing: () => cutscenePlaying(),
  story: () => (story ? story.state() : {}),
  goCity,
  goOutside,
  placePlayer,
  night: () => dayTime > 0.76 || dayTime < 0.22,
  rain: () => rainAmt > 0.3,
  muted: () => ambientMuted(),
  swimming: () => swimming,
  walking: () => Math.abs(moveVel) > 1 && world !== "den",
  setRide: (r) => (rideMode = r),
  enterHome: (id, back) => enterHome(id, back),
  roothaven,
});
// 🌟 the sea voyage, the dragon, your castle, the circus, mystery cases, the
// telescope, the easel, and the cities' seasons (more3.js)
// ⛸️ real ice skating, and Frostpine's Frozen Lake
skating = initSkating({
  mouseRig,
  quadMouse: () => quadMouse,
  baseY: () => quadBaseY,
  say: owlSay,
  group: () => (world === "outside" ? outsideGroup : world === "city" && cityState.current ? cityState.current.group : null),
  look: () => {
    const L = cityLifeSave().skate || { color: "pink", ribbon: true };
    return { color: (SKATE_COLORS.find((c) => c.key === L.color) || SKATE_COLORS[0]).color, ribbon: !!L.ribbon };
  },
  cracks: () => (world === "city" && cityState.current && cityState.current.cracks) || [],
  onTrick: (k, n) => rink && rink.trick(k, n),
});
initItemPictures(); // 🖼️ real pictures of items (instead of emoji) in every shop and list
window.__wwTeleport = (x, z, f = 0) => placePlayer(x, z, f); // (for tests)
window.__wwPos = () => ({ x: +mouseRig.position.x.toFixed(2), y: +mouseRig.position.y.toFixed(2), z: +mouseRig.position.z.toFixed(2), world }); // (for tests)
// 🪙 prices grow the further you get in the story (economy.js)
setEconomySource(() => (story ? story.state().phase : 1), () => cityLifeSave());
secrets = initSecrets({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  outsideGroup,
  terrainHeight,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  isWater,
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  den: DEN_ENTRANCE,
  school: () => schoolPos,
  ready: () => !!schoolPos,
  dayTime: () => dayTime,
  say: owlSay,
  chime: () => story && story.chime(),
  goCity,
  goOutside: () => goOutside(),
  goInside: () => goInside(),
  denGroup,
  denRadius: DEN_RADIUS,
  homeRoom: () => (world === "home" && homeState.current ? homeState.current.id : null),
  placePlayer,
  mouseRig,
  camera,
  playing: () => cutscenePlaying(),
  heal: (n) => (health = Math.min(100, health + n)),
});
conjure = initConjure({ scene, mouseRig, setWeather, setTimeOfDay, say: owlSay });
itemUses = initItems({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  mouseRig,
  scene,
  outsideGroup,
  terrainHeight,
  say: owlSay,
  chime: () => story && story.chime(),
  addToPack: (it, n, quiet) => addToPack(it, n, quiet),
  heal: (n) => (health = Math.min(100, health + n)),
  weather: () => ({ now: weatherNow, next: weatherNext }),
  setTimeOfDay,
  dayTime: () => dayTime,
  petsSync: () => pets.sync(),
  flyInto: (room) => window.__wwFlyInto && window.__wwFlyInto(room),
});
signatures = initSignatures({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  mouseRig,
  camera,
  placePlayer,
  say: owlSay,
  chime: () => story && story.chime(),
  story: () => story && story.state(),
  setFlight: (fn) => (flightCtl = fn),
  setFlightCam: (fn) => (flightCam = fn),
  bounce: (v) => (jumpVel = v), // (🍄 BOING)
  goCity,
});
animals = initAnimals({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  outsideGroup,
  terrainHeight,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  isWater,
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  home: { x: DEN_ENTRANCE.x, z: DEN_ENTRANCE.z },
  dayTime: () => dayTime,
  say: owlSay,
  chime: () => story && story.chime(),
  hurt: (n) => hurt(n),
  heal: (n) => (health = Math.min(100, health + n)),
  packCount: (it) => inventory[keyOf(it)] || 0,
  packTake: (it, n) => {
    inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
    packChanged();
  },
  addToPack: (it, n, quiet) => addToPack(it, n, quiet),
  placePlayer,
  mouseRig,
  camera,
  petsSync: () => pets.sync(),
});
paradise = initParadise({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  goCity,
  placePlayer,
  mouseRig,
  say: owlSay,
  chime: () => story && story.chime(),
  buildThistle,
});
trophies = initTrophies({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  goCity,
  placePlayer,
  goInside: () => goInside(),
  denGroup,
  denRadius: DEN_RADIUS,
  mouseRig,
  say: owlSay,
});
rink = initRink({
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  goCity,
  placePlayer,
  say: owlSay,
  chime: () => story && story.chime(),
  mouseRig,
  skating,
});
more3 = initMore3({
  mouseRig,
  addSolid: (x, z, r) => outsideColliders.push({ x, z, r }),
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  scene,
  outsideGroup,
  cityGroup,
  terrainHeight,
  cityHeight: cityFloor,
  cityCols: () => outsideCityCol,
  isWater,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  den: DEN_ENTRANCE,
  ready: () => !!schoolPos,
  packCount: (it) => inventory[keyOf(it)] || 0,
  packTake: (it, n) => {
    inventory[keyOf(it)] = Math.max(0, (inventory[keyOf(it)] || 0) - n);
    packChanged();
  },
  say: owlSay,
  chime: () => story && story.chime(),
  dayTime: () => dayTime,
  goCity,
  placePlayer,
  travelInfo: () => (story ? story.travelInfo() : { unlocked: ["forest"] }),
  travelTo: (id) => travelTo(id),
  setFlight: (fn) => (flightCtl = fn),
  setFlightCam: (fn) => (flightCam = fn),
  groundAt: (x, z) => (world === "outside" ? terrainHeight(x, z) : world === "everbough" ? cityFloor(x, z) : world === "roothaven" ? roothaven.height(x, z) : world === "city" && cityState.current ? cityState.current.height(x, z) : 0),
  camera,
  renderer, // (🖱 dragon flight grabs the mouse)
  goEverbough: () => goEverbough(),
  playing: () => cutscenePlaying(),
  season: () => (extras && extras.season ? extras.season().key : "spring"),
  // 🐲 the dragonlings (Phase 23): grown up two days after their graduation
  dragonlings: () => {
    const p = story && story.state().p23;
    if (!p || !p.done) return null;
    const left = p.doneDay === undefined ? 0 : Math.max(0, p.doneDay + 2 - (cityLifeSave().days || 0));
    return { grown: left <= 0, daysLeft: left, names: { dawn: (p.names && p.names.dawn) || "Ember", storm: "Pip", frost: (p.names && p.names.frost) || "Snowdrop", jade: (p.names && p.names.jade) || "Moss" } };
  },
  waterSurf: (x, z) => (world === "city" && cityState.current ? cityState.current.waterAt(x, z) : world === "outside" ? waterSurfaceAt(x, z) : null),
  addToPack: (item, n) => addToPack(item, n, true),
  goOutside: () => goOutside(), // (🏰 back out of your castle)
  heal: (n) => (health = Math.min(100, health + n)),
});
// ❓ the Help Book (Z)
initHelp({
  playing: () => cutscenePlaying(),
  styleLike: (b) => {
    b.style.cssText = mouseLookBtn.style.cssText;
    b.style.right = "455px";
  },
});
// 🎈 balloon flights between the cities (balloons.js)
balloons = initBalloons({
  mouseRig,
  world: () => world,
  city: () => (world === "city" ? cityState.current : null),
  goCity,
  travelTo: (id) => travelTo(id),
  travelInfo: () => (story ? story.travelInfo() : { unlocked: ["forest"] }),
  outsideGroup,
  cityGroup,
  terrainHeight,
  cityHeight: cityFloor,
  cityBuilt: () => cityBuilt,
  cityCols: () => outsideCityCol,
  isWater,
  isClear: (x, z, r) => !outsideColliders.some((c) => (c.type === "trunk" ? Math.hypot(x - c.samples[0].x, z - c.samples[0].z) < c.samples[0].r + r : c.type === "tube" ? Math.hypot(x - c.x, z - c.z) < c.halfLen + c.outerR + r : c.r && Math.hypot(x - c.x, z - c.z) < c.r + r)),
  school: () => schoolPos,
  camera,
  say: owlSay,
  chime: () => story && story.chime(),
  playing: () => cutscenePlaying(),
});

setFoodAdder((name, n) => addToPack(name, n, true)); // 🍴 bought + cooked food → the bag

loadGame(); // pick up where you left off
// 👕 dress Thistle (dyes + clothes) as soon as her model is ready
{
  const iv = setInterval(() => {
    if (!quadMouse) return;
    clearInterval(iv);
    applyLook(quadMouse);
  }, 200);
}
// 🎁 (designer cheat) ?give=10 → 10 of EVERY item in the game, in your pack (kept in your save)
{
  const give = new URLSearchParams(location.search).get("give");
  if (give) {
  const n = Math.max(1, parseInt(give, 10) || 10);
  const keys = new Set([...Object.keys(ITEM_ICON), ...allIngredientKeys().map(keyOf), ...sellableKeys()]);
  setTimeout(() => {
    for (const k of keys) inventory[k] = Math.max(inventory[k] || 0, n);
    packChanged();
    saveGame();
    owlSay(`🎁 ${n} of everything — ${keys.size} kinds of things in your backpack! (B to look)`, true);
  }, 1500);
  }
}
if (devParams.includes("savetest")) {
  // (test: put a few things in the pack, so a reload can show they're kept)
  addToPack("Glowing Moss", 5, true);
  addToPack("Twigs", 2, true);
  setTimeout(saveGame, 300);
}
if (devParams.includes("showpack")) {
  setTimeout(() => {
    drawPack();
    packEl.classList.add("open");
  }, 1500);
}

// Start the loop!
animate();
