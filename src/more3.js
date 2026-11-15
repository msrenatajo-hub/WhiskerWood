// ------------------------------------------------------------
//  🌟  MORE TO DO, part five.
//
//   ⛵ THE SEA VOYAGE     sail from Reedmere's harbour to four islands
//   🐉 THE DRAGON EGG     found on Ember Isle — hatch it, raise it, fly it
//   🏰 YOUR CASTLE        build it piece by piece on Castle Hill
//   🎪 THE CIRCUS         a new city each week: juggling + tightrope
//   🕵️ MYSTERY CASES      clues, suspects — who did it?
//   🌌 THE TELESCOPE      Silverveil's observatory, at night
//   🎨 THE EASEL          paint pictures to hang in your houses
//   🌸 CITY SEASONS       the cities change with the seasons too
// ------------------------------------------------------------
import * as THREE from "three";
import { steerStart, steerStop, steerPitch } from "./mouseSteer.js";
import { cost as priceNow } from "./economy.js";

import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard, registerKeepsake } from "./cityLife.js";
import { powerText } from "./powers.js";
import { signPost as readableSignPost, signTexture } from "./signs.js";
import { SEA, CIRCUS, HALL } from "./questZones.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const hash = (x, z) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
for (const [k, i, n] of [["palm", "🥥", "Golden Coconut (Palm Key)"], ["shell", "🐚", "Singing Conch (Shell Island)"], ["wreck", "🧭", "Captain's Compass (the Shipwreck)"]]) registerKeepsake("sea_" + k, i, n);
registerKeepsake("skycup", "🏆", "The Sky Cup (dragon race champion)");
registerKeepsake("circusstar", "🎪", "Circus Star (juggling + tightrope champion)");
registerKeepsake("detectivebadge", "🕵️", "Detective's Magnifying Glass (solved every case)");
registerKeepsake("comet", "☄️", "Comet Chart (you discovered a comet!)");

// 🐉 other modules can add places your dragon flies to ({ id, icon, name, when(), go() }),
//    and borrow the dragon model (makeDragon(age) — set once the game starts)
export const DRAGON_DESTS = [];
export let makeDragon = null;
export let dragonFlying = () => false;
export function initMore3(ctx) {
  const S = cityState();
  S.sea ||= {};
  S.castle ||= {};
  S.cases ||= {};
  S.stars2 ||= {};
  S.paintings ||= [];
  const save = () => saveCity();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const day = () => S.days || 0;
  const night = () => ctx.dayTime() > 0.76 || ctx.dayTime() < 0.22;
  function free(x, z, r = 2) {
    const w = here();
    if (w === "forest") return !ctx.isWater(x, z) && ctx.isClear(x, z, r);
    if (w === "everbough") return Math.hypot(x, z) < 100 && !ctx.cityCols().some((k) => Math.hypot(x - k.x, z - k.z) < k.r + r);
    const c = ctx.city();
    return Math.hypot(x, z) < c.R * 0.8 && (!c.waterAt || c.waterAt(x, z) === null) && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + r);
  }
  function spotNear(x0, z0, r = 2) {
    for (let rr = 0; rr < 40; rr += 1.5) for (let a = 0; a < 6.3; a += 0.5) {
      const x = x0 + Math.cos(a) * rr;
      const z = z0 + Math.sin(a) * rr;
      if (free(x, z, r)) return { x, z };
    }
    return { x: x0, z: z0 };
  }
  const groupHere = () => (ctx.world() === "city" && ctx.city() ? ctx.city().group : ctx.world() === "everbough" ? ctx.cityGroup : ctx.world() === "outside" ? ctx.outsideGroup : null);
  const H = () => (ctx.world() === "city" && ctx.city() ? ctx.city().height : ctx.world() === "everbough" ? ctx.cityHeight : ctx.terrainHeight);
  // 🪧 a big, crisp, two-sided signpost (see signs.js)
  function signPost(text, style = "wood") {
    return readableSignPost(text, { w: 3.6, h: 0.9, height: 1.75, style });
  }

  // ======================================================================
  //  ⛵ THE SEA VOYAGE
  // ======================================================================
  let harbour = null;
  function harbourBuild(c) {
    if (harbour && harbour.c === c) return;
    const at = spotNear(-10, 50, 2);
    const g = signPost("⛵ TO THE OPEN SEA");
    g.position.set(at.x, c.height(at.x, at.z), at.z);
    c.group.add(g);
    harbour = { c, ...at };
  }
  let chests = null;
  function seaBuild(Z) {
    if (chests && chests.Z === Z) return;
    chests = { Z, list: [] };
    for (const I of SEA.isles) {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), M(0x8a5a2a));
      box.position.y = 0.4;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.25, 0.85), M(0xd8a83a, { metalness: 0.4 }));
      lid.position.y = 0.92;
      g.add(box, lid, glow(0xffe08a, 2.4));
      g.children[2].position.y = 1.4;
      const x = I.x + (I.key === "wreck" ? 5 : 3);
      const z = I.z + (I.key === "dragon" ? 6 : 3);
      g.position.set(x, 0.6, z);
      Z.group.add(g);
      chests.list.push({ I, g, x, z, lid });
    }
  }
  function seaInteract() {
    const w = here();
    if (w === "reedmere") {
      harbourBuild(ctx.city());
      if (near(harbour.x, harbour.z, 2.6)) return { label: "sail out to the OPEN SEA ⛵", act: () => fadeThrough(() => {
        ctx.goCity("sea");
        ctx.say("⛵ The open sea! Four islands are out there — Palm Key (west), Shell Island (east), the Shipwreck Shoal (south-west) and smoky Ember Isle (far south). Treasure on every one!", true);
      }, 0.8) };
    }
    if (w !== "sea") return null;
    const Z = ctx.city();
    seaBuild(Z);
    if (near(SEA.home.x, SEA.home.z, 7)) return { label: "sail home to Reedmere ⛵", act: () => fadeThrough(() => {
      ctx.goCity("reedmere");
      if (harbour) ctx.placePlayer(harbour.x + 2, harbour.z + 2, 0);
    }, 0.8) };
    for (const ch of chests.list) {
      if (!near(ch.x, ch.z, 2.2)) continue;
      if (S.sea[ch.I.key]) return null;
      return { label: `open the treasure chest on ${ch.I.name} 💰`, act: () => {
        S.sea[ch.I.key] = true;
        ch.lid.rotation.x = -1.2;
        S.coins += 40;
        if (ch.I.key === "dragon") {
          S.dragon = { stage: 0, got: day() };
          ctx.say("🐉 Inside the chest, wrapped in warm ash: a big EGG, glowing orange and gently… wobbling. It's a DRAGON EGG! (+🪙 40) — it'll hatch in a day or so.", true);
        } else {
          (S.owned ||= {})["sea_" + ch.I.key] = true;
          ctx.say(`💰 Treasure! +🪙 40 and ${{ palm: "🥥 a Golden Coconut", shell: "🐚 a Singing Conch", wreck: "🧭 the Captain's Compass" }[ch.I.key]}!`, true);
        }
        save();
        ctx.chime();
      } };
    }
    return null;
  }

  // ======================================================================
  //  🐉 THE DRAGON — hatches, grows, and finally flies you anywhere
  // ======================================================================
  let dragon = null;
  const dragonAge = () => (!S.dragon ? -1 : Math.min(3, Math.max(0, day() - S.dragon.got)));
  // 0 egg · 1 hatchling · 2 young · 3 grown
  function dragonMesh(age) {
    const g = new THREE.Group();
    if (age === 0) {
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), M(0xe8783a, { emissive: 0xc84a1a, emissiveIntensity: 0.6 }));
      egg.scale.y = 1.3;
      egg.position.y = 0.45;
      g.add(egg, glow(0xff9a40, 1.6));
      return g;
    }
    // 🐉 a deep-crimson dragon with golden belly-plates, a mane of flame,
    // great webbed wings, horns, glowing eyes, and a fire-tipped tail
    const scale = M(0xa8222a, { emissive: 0x3a0808, emissiveIntensity: 0.4 });
    const gold = M(0xe8b040, { metalness: 0.4 });
    const s = [0, 0.4, 0.75, 1.8][age];
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), scale);
    body.scale.set(0.95, 0.85, 1.7);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), gold);
    belly.scale.set(0.8, 0.6, 1.45);
    belly.position.set(0, -0.25, 0.1);
    // a long curving neck, in segments
    const neck = [];
    for (let i = 0; i < 4; i++) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.38 - i * 0.04, 8, 6), scale);
      n.position.set(0, 0.35 + i * 0.32, 1.1 + i * 0.28);
      neck.push(n);
      g.add(n);
    }
    const head = new THREE.Group();
    head.position.set(0, 1.65, 2.25);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), scale);
    skull.scale.set(0.9, 0.75, 1.2);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.6), scale);
    snout.position.set(0, -0.08, 0.5);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.5), gold);
    jaw.position.set(0, -0.24, 0.45);
    head.add(skull, snout, jaw);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
      eye.position.set(sx * 0.22, 0.1, 0.3);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.7, 5), gold);
      horn.position.set(sx * 0.2, 0.35, -0.25);
      horn.rotation.x = -0.9;
      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 5), gold);
      horn2.position.set(sx * 0.32, 0.18, -0.15);
      horn2.rotation.set(-0.6, 0, sx * -0.6);
      head.add(eye, horn, horn2);
    }
    g.add(head);
    // a mane of flame down the neck and back
    const flames = [];
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffa030 : 0xffd060, transparent: true, opacity: 0.9 }));
      f.position.set(0, 0.95 + Math.max(0, 3 - i) * 0.25, 1.6 - i * 0.35);
      g.add(f);
      flames.push(f);
    }
    // great webbed wings (bone + membrane)
    const wings = [];
    for (const sx of [-1, 1]) {
      const w = new THREE.Group();
      w.position.set(sx * 0.7, 0.55, 0.2);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 5), gold);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = sx * 1.3;
      const mem = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.6, 3), M(0xd8404a, { side: THREE.DoubleSide, transparent: true, opacity: 0.88 }));
      mem.scale.z = 0.08;
      mem.rotation.z = sx * Math.PI / 2;
      mem.position.set(sx * 1.3, -0.15, -0.5);
      mem.rotation.y = 0.2;
      w.add(arm, mem);
      g.add(w);
      wings.push({ w, sx });
    }
    // a long tail with a flame at the tip
    const tail = [];
    for (let i = 0; i < 6; i++) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.32 - i * 0.045, 8, 6), scale);
      t.position.set(0, 0.05 - i * 0.05, -1.4 - i * 0.42);
      g.add(t);
      tail.push(t);
    }
    const tailFire = glow(0xff8a30, 1.6);
    tailFire.position.set(0, -0.25, -4);
    g.add(body, belly, tailFire);
    // four legs with golden claws
    for (const [x, z] of [[0.5, 0.8], [-0.5, 0.8], [0.5, -0.7], [-0.5, -0.7]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.7, 6), scale);
      leg.position.set(x, -0.7, z);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 5), gold);
      claw.position.set(x, -1.05, z + 0.08);
      claw.rotation.x = Math.PI / 2;
      g.add(leg, claw);
    }
    // a little saddle for Thistle
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.7), M(0x5a3e24));
    saddle.position.set(0, 0.82, 0.2);
    g.add(saddle, glow(0xff6a30, 6, 0.25));
    g.userData = { wings, flames, tail, tailFire, head };
    g.scale.setScalar(s);
    return g;
  }
  makeDragon = dragonMesh;
  // 🐲 RIDE YOUR BABY DRAGONS — once the dragonlings from Emberroost have grown
  // up, choose which dragon carries you. Each has its own power (F):
  const RIDERS = {
    red: { icon: "🐉", power: "breathes FIRE" },
    storm: { hue: 0.58, icon: "⚡", power: "calls down LIGHTNING (and she's the fastest flier!)" },
    frost: { hue: 0.55, light: true, icon: "❄️", power: "freezes water into ice you can walk — and skate! — on" },
    jade: { hue: 0.33, icon: "🌿", power: "makes flowers burst up wherever she breathes (petals for your pack!)" },
    dawn: { hue: 0.07, icon: "🌅", power: "dawn-fire that sniffs out treasure twice as often" },
  };
  const riderKey = () => {
    const D = ctx.dragonlings && ctx.dragonlings();
    return D && D.grown && S.dragonPick && RIDERS[S.dragonPick] ? S.dragonPick : "red";
  };
  const riderName = (k) => {
    if (k === "red") return "your great red dragon";
    const D = ctx.dragonlings && ctx.dragonlings();
    return (D && D.names[k]) || k;
  };
  function tintDragon(g, k) {
    const R = RIDERS[k];
    if (!R || R.hue === undefined) return g;
    g.traverse((o) => {
      if (!o.material || !o.material.color || o.isSprite) return;
      o.material = o.material.clone();
      const hsl = {};
      o.material.color.getHSL(hsl);
      o.material.color.setHSL(R.hue, R.light ? 0.35 : Math.min(1, hsl.s + 0.1), R.light ? Math.min(0.85, hsl.l + 0.35) : hsl.l);
    });
    return g;
  }
  dragonFlying = () => !!flying;
  let dragonFollow = { x: 0, z: 0, set: false };
  function dragonUpdate(t) {
    powerFxStep(1 / 60);
    if (raceFlag) {
      const pos = raceFlag.flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(t * 5 + pos.getX(i) * 3) * 0.12 * (pos.getX(i) + 0.8));
      pos.needsUpdate = true;
    }
    const age = dragonAge();
    if (age < 0 || ctx.world() === "den" || ctx.world() === "home") {
      if (dragon) dragon.g.visible = false;
      return;
    }
    if (!dragon || dragon.age !== age || dragon.pick !== riderKey()) {
      if (dragon) dragon.g.parent && dragon.g.parent.remove(dragon.g);
      const pick = age >= 3 ? riderKey() : "red";
      dragon = { g: tintDragon(dragonMesh(age), pick), age, pick };
      ctx.scene.add(dragon.g);
      if (age === 1 && !S.dragon.hatchTold) {
        S.dragon.hatchTold = true;
        save();
        ctx.say("🐉 CRACK! The egg hatches — a tiny red dragon blinks up at you and sneezes a puff of smoke. It thinks you're its mum!", true);
      }
      if (age === 3 && !S.dragon.grownTold) {
        S.dragon.grownTold = true;
        save();
        ctx.say("🐉 Your dragon is ALL GROWN UP — big enough to carry you! She glides along in the corner of the sky — press 1 any time outdoors to call her down and FLY.", true);
      }
    }
    dragon.g.visible = true;
    const p = me();
    const yaw = ctx.mouseRig.rotation.y;
    if (flying) {
      // (you ride on its back: the dragon is right under you)
      dragon.g.position.set(p.x - Math.sin(yaw) * 0.4, p.y - 1.9, p.z - Math.cos(yaw) * 0.4);
      dragon.g.rotation.set(-(flying.pitch || 0) * 0.35, yaw, -(flying.bank || 0) * 0.35);
      animateDragon(t, true);
      dragonFollow.x = dragon.g.position.x;
      dragonFollow.z = dragon.g.position.z;
      return;
    }
    if (age === 0) {
      // (the egg sits by your door)
      dragon.g.position.set(ctx.den.x + 2.5, ctx.groundAt(ctx.den.x + 2.5, ctx.den.z + 1), ctx.den.z + 1);
      dragon.g.rotation.z = Math.sin(t * 6) * 0.1;
      return;
    }
    // 🐉 she glides in the TOP-LEFT corner of your screen — far enough off to
    // the side and up high that she never covers you or anyone else
    const cam = ctx.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const dist = 26 + age * 4;
    const target = cam.position.clone().addScaledVector(fwd, dist).addScaledVector(right, -dist * 0.44).addScaledVector(up, dist * 0.3 + Math.sin(t * 1.2) * 0.6);
    if (!dragonFollow.set || Math.hypot(target.x - dragonFollow.x, target.z - dragonFollow.z) > 60) Object.assign(dragonFollow, { x: target.x, z: target.z, y: target.y, set: true });
    dragonFollow.x += (target.x - dragonFollow.x) * 0.06;
    dragonFollow.z += (target.z - dragonFollow.z) * 0.06;
    dragonFollow.y += (target.y - dragonFollow.y) * 0.06;
    dragon.g.position.set(dragonFollow.x, dragonFollow.y, dragonFollow.z);
    dragon.g.rotation.y = yaw;
    animateDragon(t, true);
  }
  function animateDragon(t, flying) {
    const u = dragon.g.userData;
    if (!u.wings) return;
    const beat = flying ? 5 : 2.4;
    u.wings.forEach(({ w, sx }) => (w.rotation.z = sx * Math.sin(t * beat) * (flying ? 0.7 : 0.25)));
    u.flames.forEach((f, i) => (f.scale.y = 1 + Math.sin(t * 12 + i) * 0.3));
    u.tail.forEach((p, i) => (p.position.x = Math.sin(t * 2 - i * 0.5) * i * 0.12));
    u.tailFire.position.x = Math.sin(t * 2 - 3) * 0.7;
    u.tailFire.scale.setScalar(1.4 + Math.sin(t * 10) * 0.3);
  }
  // 🐉 FLYING — steered with the MOUSE only (mouseSteer.js): left/right turn · up/down climb & dive · W forward · F fire breath · E land
  let flying = null;
  const fireBits = [];
  const flyHud = document.createElement("div");
  flyHud.style.cssText = "position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:40;padding:6px 16px;border-radius:12px;background:rgba(80,20,20,.8);color:#ffe0b0;font:bold 14px system-ui;pointer-events:none;display:none";
  document.body.appendChild(flyHud);
  function startFlying() {
    flying = { speed: 0, alt: 6, coins: 0, nextGold: 8, pitch: 0, bank: 0 };
    steerStart(ctx.renderer && ctx.renderer.domElement);
    ctx.setFlight(flyStep);
    ctx.setFlightCam(flyCam);
    ctx.say("🐉 Up, up and AWAY! 🖱 steer with the MOUSE (left/right turn · up/down climb & dive) · W fly forward · F breathe FIRE · E or 1 to land. Watch for glittering treasure below!", true);
  }
  function stopFlying() {
    if (race) endRace(null);
    flying = null;
    steerStop();
    ctx.setFlight(null);
    ctx.setFlightCam(null);
    flyHud.style.display = "none";
    const p = me();
    p.y = ctx.groundAt(p.x, p.z);
    ctx.say("🐉 Your dragon glides down and lands with a soft WHUMP.");
  }
  // the flying camera: well behind and above her, so you see her whole
  const camPos = new THREE.Vector3();
  function flyCam(dt) {
    const p = me();
    const yaw = ctx.mouseRig.rotation.y;
    const want = new THREE.Vector3(p.x - Math.sin(yaw) * 16, p.y + 7, p.z - Math.cos(yaw) * 16);
    if (camPos.lengthSq() === 0) camPos.copy(want);
    camPos.lerp(want, Math.min(1, dt * 3));
    ctx.camera.position.copy(camPos);
    if (shake > 0) {
      // 📳 thunder shakes the world
      ctx.camera.position.x += (Math.random() - 0.5) * shake;
      ctx.camera.position.y += (Math.random() - 0.5) * shake;
      shake = Math.max(0, shake - dt * 1.6);
    }
    ctx.camera.lookAt(p.x + Math.sin(yaw) * 8, p.y + 1, p.z + Math.cos(yaw) * 8);
    return true;
  }
  const gold = [];
  const powerFx = []; // (bolts, ice, flowers — each fades after a while)
  let shake = 0;
  const flashEl = document.createElement("div");
  flashEl.style.cssText = "position:fixed;inset:0;z-index:38;pointer-events:none;background:#eef6ff;opacity:0;transition:opacity .25s ease-out";
  document.body.appendChild(flashEl);
  function screenFlash() {
    flashEl.style.transition = "none";
    flashEl.style.opacity = "0.75";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      flashEl.style.transition = "opacity .35s ease-out";
      flashEl.style.opacity = "0";
    }));
  }
  let thunderAc = null;
  function thunder() {
    try {
      thunderAc ||= new (window.AudioContext || window.webkitAudioContext)();
      const ac = thunderAc;
      if (ac.state === "suspended") ac.resume();
      const len = 2.2;
      const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / ac.sampleRate;
        last = last * 0.96 + (Math.random() * 2 - 1) * 0.04; // (brown-ish noise: a deep rumble)
        const crack = t < 0.08 ? (Math.random() * 2 - 1) * (1 - t / 0.08) : 0; // (the sharp CRACK first)
        d[i] = (crack + last * 6) * Math.exp(-t * 1.6) * (0.7 + 0.3 * Math.sin(t * 9));
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const g = ac.createGain();
      g.gain.value = 0.55;
      src.connect(lp).connect(g).connect(ac.destination);
      src.start();
    } catch {}
  }
  let powerT = 0;
  function riderPower(dt, rig, p) {
    const k = riderKey();
    if (k === "red") return;
    powerT -= dt;
    if (powerT > 0) return;
    const fx = Math.sin(rig.rotation.y);
    const fz = Math.cos(rig.rotation.y);
    const grp = ctx.world() === "outside" ? ctx.outsideGroup : ctx.city() ? ctx.city().group : null;
    if (!grp) return;
    if (k === "storm") {
      // ⚡ LIGHTNING: Pip calls a huge forked bolt down out of the sky onto
      // the ground ahead — a white flash, a CRACK of thunder, a shaking
      // camera, and a glowing scorch where it struck
      powerT = 0.45;
      const x = p.x + fx * (10 + Math.random() * 6) + (Math.random() - 0.5) * 5;
      const z = p.z + fz * (10 + Math.random() * 6) + (Math.random() - 0.5) * 5;
      const gy = ctx.groundAt(x, z);
      const bolt = new THREE.Group();
      const core = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const edge = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
      const zig = (x0, y0, z0, x1, y1, z1, n, thick, jag) => {
        let ax = x0, ay = y0, az = z0;
        const pts = [];
        for (let i = 1; i <= n; i++) {
          const k2 = i / n;
          const bx = x0 + (x1 - x0) * k2 + (i < n ? (Math.random() - 0.5) * jag : 0);
          const by = y0 + (y1 - y0) * k2;
          const bz = z0 + (z1 - z0) * k2 + (i < n ? (Math.random() - 0.5) * jag : 0);
          const len = Math.hypot(bx - ax, by - ay, bz - az);
          for (const [m, w] of [[core, thick], [edge, thick * 3]]) {
            const seg = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), m);
            seg.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
            seg.lookAt(bx, by, bz);
            seg.rotateX(Math.PI / 2);
            bolt.add(seg);
          }
          pts.push({ x: bx, y: by, z: bz });
          ax = bx; ay = by; az = bz;
        }
        return pts;
      };
      const top = gy + 55;
      const main = zig(x + (Math.random() - 0.5) * 8, top, z + (Math.random() - 0.5) * 8, x, gy, z, 11, 0.42, 5);
      // two forks branching off
      for (let f = 0; f < 2; f++) {
        const from = main[3 + f * 3];
        zig(from.x, from.y, from.z, from.x + (Math.random() - 0.5) * 16, from.y - 14 - Math.random() * 8, from.z + (Math.random() - 0.5) * 16, 5, 0.22, 3);
      }
      // a crackle of sparks from Pip's mouth up to the sky
      zig(p.x + fx * 3, p.y + 1.6, p.z + fz * 3, p.x + fx * 6, p.y + 12, p.z + fz * 6, 4, 0.15, 1.5);
      const flash = glow(0xcfe8ff, 46, 1);
      flash.position.set(x, gy + 3, z);
      bolt.add(flash);
      grp.add(bolt);
      powerFx.push({ o: bolt, grp, until: performance.now() + 380, flicker: true });
      // the scorch where it struck (glows blue, then fades)
      const scorch = new THREE.Mesh(new THREE.CircleGeometry(2.6, 18), new THREE.MeshBasicMaterial({ color: 0x6ab8ff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      scorch.rotation.x = -Math.PI / 2;
      scorch.position.set(x, gy + 0.08, z);
      grp.add(scorch);
      powerFx.push({ o: scorch, grp, until: performance.now() + 2500, fade: true });
      // ⚪ the whole screen flashes white…
      screenFlash();
      // 🔊 …CRACK — and a long rumble of thunder
      thunder();
      // 📳 …and the camera shakes
      shake = 0.6;
      // lightning sometimes strikes TREASURE out of the ground
      if (Math.random() < 0.3 && gold.length < 5) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: 0xffd040 })), glow(0xffd860, 4));
        g.position.set(x, gy + 1.5, z);
        ctx.scene.add(g);
        gold.push({ g, x, z });
      }
    } else if (k === "frost") {
      // ❄️ frost breath: water turns to ice (for a couple of minutes)
      powerT = 0.3;
      const x = p.x + fx * 8;
      const z = p.z + fz * 8;
      for (let i = 0; i < 5; i++) {
        const f = glow(0xd8f0ff, 1.2, 0.9);
        f.position.set(p.x + fx * (3 + i * 1.2), p.y + 1.4 - i * 0.3, p.z + fz * (3 + i * 1.2));
        grp.add(f);
        powerFx.push({ o: f, grp, until: performance.now() + 400 });
      }
      const wy = ctx.waterSurf ? ctx.waterSurf(x, z) : null;
      if (wy !== null && wy !== undefined) {
        const where = ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world();
        const ice = new THREE.Mesh(new THREE.CircleGeometry(4.6, 20), new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.15, transparent: true, opacity: 0.9 }));
        ice.rotation.x = -Math.PI / 2;
        ice.position.set(x, wy + 0.04, z);
        grp.add(ice);
        (window.__wwFrostIce ||= []).push({ where, x, z, r: 4.5, y: wy, until: performance.now() + 120000 });
        powerFx.push({ o: ice, grp, until: performance.now() + 120000, fade: true });
        if (!riderPower.toldIce) {
          riderPower.toldIce = true;
          ctx.say("❄️ The water FREEZES solid! Land on it (E) — you can walk on it, or skate if you've got your skates. (It melts in a couple of minutes.)", true);
        }
      }
    } else if (k === "jade") {
      // 🌿 flowers burst up where her breath lands
      powerT = 0.22;
      const x = p.x + fx * 7 + (Math.random() - 0.5) * 3;
      const z = p.z + fz * 7 + (Math.random() - 0.5) * 3;
      if (ctx.waterSurf && ctx.waterSurf(x, z) !== null) return;
      const gy = ctx.groundAt(x, z);
      const fl = new THREE.Group();
      const col = [0xff8cc6, 0xffd860, 0xc49aff, 0xff7a6a, 0xffffff][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 3; i++) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 5), M(0x4a9a3a));
        const ox = (Math.random() - 0.5) * 1.4, oz = (Math.random() - 0.5) * 1.4;
        st.position.set(ox, 0.6, oz);
        const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), M(col));
        head.position.set(ox, 1.25, oz);
        fl.add(st, head);
      }
      fl.position.set(x, gy, z);
      fl.scale.setScalar(0.1);
      grp.add(fl);
      powerFx.push({ o: fl, grp, until: performance.now() + 180000, grow: true });
      if (Math.random() < 0.25 && ctx.addToPack) ctx.addToPack("Flower Petals", 1);
    } else if (k === "dawn") {
      // 🌅 golden dawn-fire (it keeps you toasty too)
      powerT = 0.12;
      for (let i = 0; i < 3; i++) {
        const f = glow([0xffd060, 0xffb040, 0xfff0a0][i], 1.8, 0.9);
        f.position.set(p.x + fx * (3.5 + i * 1.6), p.y + 2.2, p.z + fz * (3.5 + i * 1.6));
        grp.add(f);
        powerFx.push({ o: f, grp, until: performance.now() + 450 });
      }
      window.dispatchEvent(new Event("ww-warm"));
    }
  }
  function powerFxStep(dt) {
    const now = performance.now();
    for (let i = powerFx.length - 1; i >= 0; i--) {
      const e = powerFx[i];
      if (e.grow && e.o.scale.x < 1) e.o.scale.setScalar(Math.min(1, e.o.scale.x + dt * 3));
      if (e.flicker) e.o.visible = Math.random() < 0.8;
      if (e.fade && e.o.material) e.o.material.opacity = Math.min(0.9, (e.until - now) / 8000);
      if (now > e.until) {
        e.grp.remove(e.o);
        powerFx.splice(i, 1);
      }
    }
    if (window.__wwFrostIce) window.__wwFrostIce = window.__wwFrostIce.filter((k) => now < k.until);
  }
  // ================================================================ 🏁 DRAGON RACES
  // A loop of 10 glowing rings over the forest round your cottage. Race your
  // four dragonlings: 3-2-1-GO, fly through every ring in order, and back
  // through the first ring to finish. Land (E or 1) to give up.
  let race = null;
  let course = null;
  const raceHud = document.createElement("div");
  raceHud.style.cssText = "position:fixed;left:50%;top:150px;transform:translateX(-50%);z-index:40;padding:6px 18px;border-radius:12px;background:rgba(20,40,80,.85);color:#fff6d0;font:bold 16px system-ui;pointer-events:none;display:none;box-shadow:0 0 16px rgba(255,210,120,.5)";
  document.body.appendChild(raceHud);
  function buildCourse() {
    if (course) return course;
    const D = ctx.den;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 70 + Math.sin(i * 2.3) * 20;
      const x = D.x + Math.cos(a) * r;
      const z = D.z + Math.sin(a) * r * 0.8;
      pts.push({ x, z, y: ctx.groundAt(x, z) + 16 + Math.sin(i * 1.7) * 9 + (i % 3) * 4 });
    }
    const rings = pts.map((pt, i) => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.45, 10, 28), new THREE.MeshBasicMaterial({ color: 0xffd860 }));
      g.add(ring, glow(0xffd860, 12, 0.5));
      g.position.set(pt.x, pt.y, pt.z);
      const nx = pts[(i + 1) % pts.length];
      g.lookAt(nx.x, nx.y, nx.z);
      g.visible = false;
      ctx.outsideGroup.add(g);
      return { g, ring };
    });
    let len = 0;
    const seg = pts.map((pt, i) => {
      const nx = pts[(i + 1) % pts.length];
      const l = Math.hypot(nx.x - pt.x, nx.y - pt.y, nx.z - pt.z);
      len += l;
      return l;
    });
    return (course = { pts, rings, seg, len });
  }
  const along = (d) => {
    // a point d along the course (wraps round the loop)
    const C = course;
    d = ((d % C.len) + C.len) % C.len;
    for (let i = 0; i < C.pts.length; i++) {
      if (d <= C.seg[i]) {
        const a = C.pts[i];
        const b = C.pts[(i + 1) % C.pts.length];
        const k = d / C.seg[i];
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, dir: Math.atan2(b.x - a.x, b.z - a.z) };
      }
      d -= C.seg[i];
    }
    return C.pts[0];
  };
  function startRace() {
    if (ctx.world() !== "outside") return ctx.say("🏁 The race course is over the Great Forest, round your cottage — go home first!", true);
    const C = buildCourse();
    const D = ctx.dragonlings && ctx.dragonlings();
    const names = D ? D.names : { dawn: "Blaze", storm: "Gust", frost: "Hailstone", jade: "Thicket" };
    const HUE = { dawn: [0.07], storm: [0.58], frost: [0.55, true], jade: [0.33] };
    const keys = Object.keys(HUE).filter((k) => !(D && D.grown && riderKey() === k)); // (not the one you're riding!)
    const racers = keys.map((k, i) => {
      const g = makeDragon(D && D.grown ? 2 : 3);
      g.traverse((o) => {
        if (!o.material || !o.material.color || o.isSprite) return;
        o.material = o.material.clone();
        const hsl = {};
        o.material.color.getHSL(hsl);
        o.material.color.setHSL(HUE[k][0], HUE[k][1] ? 0.35 : Math.min(1, hsl.s + 0.1), HUE[k][1] ? Math.min(0.85, hsl.l + 0.35) : hsl.l);
      });
      g.scale.multiplyScalar(D && D.grown ? 0.8 : 0.45);
      ctx.outsideGroup.add(g);
      return { k, name: names[k], g, d: -6 - i * 3, v: 21 + i * 1.4 + Math.random() * 1.5, done: 0 };
    });
    // start just before the first ring
    const s0 = along(C.len - 14);
    if (!flying) startFlying();
    const p = me();
    p.x = s0.x;
    p.z = s0.z;
    flying.alt = s0.y - ctx.groundAt(s0.x, s0.z);
    ctx.mouseRig.rotation.y = s0.dir;
    p.y = s0.y;
    camPos.set(0, 0, 0); // (the camera jumps straight to the start line)
    race = { racers, next: 0, lap: false, t: -3, finished: [], over: false };
    C.rings.forEach((r) => (r.g.visible = true));
    ctx.say("🏁 DRAGON RACE! Fly through every golden ring in order — the bright one is next — then back through the first ring to finish. Space/Shift to climb and dive!", true);
  }
  function endRace(place) {
    const r = race;
    race = null;
    raceHud.style.display = "none";
    if (course) course.rings.forEach((x) => (x.g.visible = false));
    if (r) r.racers.forEach((x) => x.g.parent && x.g.parent.remove(x.g));
    if (!place) return;
    const t = r.t;
    const prize = [0, 60, 30, 15, 5, 5][place] || 5;
    S.coins += prize;
    const best = S.raceBest || 0;
    if (!best || t < best) S.raceBest = t;
    let cup = "";
    if (place === 1 && !(S.owned || {}).skycup) {
      (S.owned ||= {}).skycup = true;
      cup = " 🏆 You win THE SKY CUP!";
    }
    save();
    ctx.chime();
    const ord = ["", "1st", "2nd", "3rd", "4th", "5th"][place] || place + "th";
    ctx.say(`🏁 You finished ${ord}! Time ${t.toFixed(1)}s${!best || t < best ? " — a NEW best!" : ` (best ${best.toFixed(1)}s)`} · 🪙 +${prize}${cup}`, true);
  }
  function raceStep(dt) {
    if (!race || !course) return;
    const R = race;
    const C = course;
    R.t += dt;
    const p = me();
    // the countdown: everyone waits on the line
    if (R.t < 0) {
      const s0 = along(C.len - 14);
      p.x = s0.x;
      p.z = s0.z;
      raceHud.style.display = "";
      raceHud.textContent = `🏁 ${Math.ceil(-R.t)}…`;
    } else if (R.t < 0.8) raceHud.textContent = "🏁 GO!";
    // the dragonlings fly the course
    for (const x of R.racers) {
      if (R.t > 0 && !x.done) {
        x.d += x.v * dt * (0.95 + Math.sin(R.t * 0.7 + x.v) * 0.08);
        if (x.d >= C.len + 2) {
          x.done = R.t;
          R.finished.push(x.name);
        }
      }
      const q = along(x.d);
      const side = (R.racers.indexOf(x) - 1.5) * 2.2;
      x.g.position.set(q.x + Math.cos(q.dir) * side, q.y + Math.sin(R.t * 3 + side) * 0.6 - 1, q.z - Math.sin(q.dir) * side);
      x.g.rotation.y = q.dir;
      const u = x.g.userData;
      if (u && u.wings) u.wings.forEach(({ w, sx }) => (w.rotation.z = sx * Math.sin(R.t * 9 + side) * 0.7));
    }
    if (R.t < 0) return;
    // your rings
    const idx = R.lap ? 0 : R.next;
    C.rings.forEach((r, i) => {
      r.ring.material.color.set(i === idx ? 0xfff2a0 : 0xa07a30);
      r.g.scale.setScalar(i === idx ? 1 + Math.sin(R.t * 6) * 0.06 : 0.9);
    });
    const ring = C.pts[idx];
    if (Math.hypot(p.x - ring.x, p.z - ring.z) < 6 && Math.abs(p.y - ring.y) < 7) {
      ctx.chime();
      if (R.lap) return endRace(R.finished.length + 1);
      R.next++;
      if (R.next >= C.pts.length) R.lap = true;
    }
    const place = R.finished.length + 1 + R.racers.filter((x) => !x.done && x.d > (R.lap ? C.len : course.seg.slice(0, R.next).reduce((a, b) => a + b, 0) - 3)).length;
    raceHud.style.display = "";
    raceHud.textContent = `🏁 ring ${Math.min(R.next + (R.lap ? 1 : 0), C.pts.length + 1)}/${C.pts.length + 1} · ${R.t.toFixed(1)}s · place ${place}${R.lap ? " · back through the FIRST ring to finish!" : ""}`;
  }
  function flyStep(dt, keys) {
    const F = flying;
    raceStep(dt);
    const p = me();
    const rig = ctx.mouseRig;
    // 🖱 the mouse steers (main.js's mouse look turns the rig) — no keys for turning
    const yawNow = rig.rotation.y;
    F.bank += (Math.max(-1, Math.min(1, (yawNow - (F.lastYaw ?? yawNow)) / Math.max(dt, 0.001) / 2)) - F.bank) * Math.min(1, dt * 6);
    F.lastYaw = yawNow;
    F.pitch = steerPitch(dt);
    const want = keys.KeyW || keys.ArrowUp ? (riderKey() === "storm" ? 29 : 22) : keys.KeyS || keys.ArrowDown ? -6 : 4;
    F.speed += (want - F.speed) * Math.min(1, dt * 1.5);
    p.x += Math.sin(rig.rotation.y) * F.speed * dt;
    p.z += Math.cos(rig.rotation.y) * F.speed * dt;
    F.alt = Math.max(2.5, Math.min(70, F.alt + F.pitch * dt * 14));
    const ground = ctx.groundAt(p.x, p.z);
    p.y += (ground + F.alt - p.y) * Math.min(1, dt * 3);
    // stay within the world
    const lim = here() === "forest" ? 900 : 120;
    const d = Math.hypot(p.x, p.z);
    if (d > lim) {
      p.x *= lim / d;
      p.z *= lim / d;
    }
    // 💰 treasure glints appear below — swoop low to grab it!
    F.nextGold -= dt;
    if (F.nextGold <= 0 && gold.length < 3) {
      F.nextGold = (6 + Math.random() * 6) * (riderKey() === "dawn" ? 0.5 : 1); // (🌅 Ember sniffs out twice the treasure)
      const a = rig.rotation.y + (Math.random() - 0.5) * 1.2;
      const r = 30 + Math.random() * 30;
      const x = p.x + Math.sin(a) * r;
      const z = p.z + Math.cos(a) * r;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: 0xffd040 })), glow(0xffd860, 4));
      g.position.set(x, ctx.groundAt(x, z) + 1.5, z);
      ctx.scene.add(g);
      gold.push({ g, x, z });
    }
    for (let i = gold.length - 1; i >= 0; i--) {
      const gd = gold[i];
      gd.g.rotation.y += dt * 2;
      const dd = Math.hypot(p.x - gd.x, p.z - gd.z);
      if (dd < 4 && p.y - gd.g.position.y < 6) {
        ctx.scene.remove(gd.g);
        gold.splice(i, 1);
        const n = 8 + Math.floor(Math.random() * 12);
        S.coins += n;
        F.coins += n;
        save();
        ctx.chime();
      } else if (dd > 120) {
        ctx.scene.remove(gd.g);
        gold.splice(i, 1);
      }
    }
    // ⚡❄️🌿🌅 your dragonling's own power
    if (keys.KeyF) riderPower(dt, rig, p);
    // 🔥 fire breath
    if (keys.KeyF && Math.random() < 0.7 && riderKey() !== "storm") {
      const f = glow([0xff6a20, 0xffa030, 0xffe060][Math.floor(Math.random() * 3)], 1.6 + Math.random());
      const hx = p.x + Math.sin(rig.rotation.y) * 3.6;
      const hz = p.z + Math.cos(rig.rotation.y) * 3.6;
      f.position.set(hx, p.y + 2.6, hz);
      ctx.scene.add(f);
      fireBits.push({ f, vx: Math.sin(rig.rotation.y) * 22 + (Math.random() - 0.5) * 4, vy: (Math.random() - 0.4) * 4, vz: Math.cos(rig.rotation.y) * 22 + (Math.random() - 0.5) * 4, life: 0.7 });
      window.dispatchEvent(new Event("ww-warm")); // (dragon fire keeps you toasty)
    }
    for (let i = fireBits.length - 1; i >= 0; i--) {
      const b = fireBits[i];
      b.life -= dt;
      b.f.position.x += b.vx * dt;
      b.f.position.y += b.vy * dt;
      b.f.position.z += b.vz * dt;
      b.f.scale.multiplyScalar(1 + dt * 2);
      b.f.material.opacity = Math.max(0, b.life / 0.7);
      if (b.life <= 0) {
        ctx.scene.remove(b.f);
        fireBits.splice(i, 1);
      }
    }
    flyHud.style.display = "";
    flyHud.textContent = `🐉 flying · height ${Math.round(F.alt)} · treasure 🪙 ${F.coins} · 🖱 mouse steers · W fly · F ${{ red: "fire", storm: "⚡ LIGHTNING", frost: "❄️ freeze water", jade: "🌿 flowers", dawn: "🌅 dawn-fire" }[riderKey()]} · E land`;
  }
  {
    // (test) &dragon=1 → a grown dragon · &dragonfly=1 → already flying, breathing fire
    const q = new URLSearchParams(location.search);
    if (q.get("dragon")) S.dragon = { got: (S.days || 0) - 20, hatchTold: true, grownTold: true };
    // (designer cheat) ?growdragon=1 → your dragon is fully grown, saved for good
    if (q.get("growdragon")) {
      S.dragon = { ...(S.dragon || {}), got: (S.days || 0) - 20, hatchTold: true, grownTold: true };
      saveCity();
      setTimeout(() => ctx.say("🐉 TESTING: your dragon is FULLY GROWN! Go outside and press 1 to fly.", true), 1500);
    }
    if (q.get("rider")) S.dragonPick = q.get("rider"); // (test: &rider=storm|frost|jade|dawn)
    if (q.get("race")) setTimeout(() => startRace(), 4000); // (test: &race=1)
    if (q.get("press1")) setTimeout(() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Digit1" })), 4000);
    if (q.get("dragonfly")) setTimeout(() => {
      startFlying();
      const k = {};
      ctx.setFlight((dt) => flyStep(dt, { KeyF: true, KeyW: true, ...k }));
    }, 3500);
  }
  // 🏁 a checkered start-line flag beside your cottage — walk up and race!
  let raceFlag = null;
  function buildRaceFlag() {
    if (raceFlag || !ctx.ready()) return;
    const D = ctx.den;
    let at = null;
    for (let r = 9; r < 30 && !at; r += 2) for (let a = 0.8; a < 7 && !at; a += 0.5) {
      const x = D.x + Math.cos(a) * r;
      const z = D.z + Math.sin(a) * r;
      if (ctx.isClear(x, z, 1.6) && !ctx.isWater(x, z)) at = { x, z };
    }
    at ||= { x: D.x + 12, z: D.z };
    const y = ctx.terrainHeight(at.x, at.z);
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.2, 6), M(0xe8e8e8));
    pole.position.y = 2.1;
    // the checkered flag
    const cv = document.createElement("canvas");
    cv.width = 96;
    cv.height = 64;
    const c2 = cv.getContext("2d");
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      c2.fillStyle = (i + j) % 2 ? "#111" : "#fff";
      c2.fillRect(i * 16, j * 16, 16, 16);
    }
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.05, 6, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }));
    flag.position.set(0.82, 3.6, 0);
    // a sign: 🏁 DRAGON RACES (big, crisp, always facing you)
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTexture("🏁 DRAGON RACES", "gold", 4), depthWrite: false, toneMapped: false, fog: false }));
    sign.scale.set(3.8, 0.95, 1);
    sign.position.y = 4.8;
    const halo = glow(0xffd860, 5, 0.5);
    halo.position.y = 3.6;
    g.add(pole, flag, sign, halo);
    g.position.set(at.x, y, at.z);
    ctx.outsideGroup.add(g);
    raceFlag = { g, flag, x: at.x, z: at.z };
  }
  function dragonInteract() {
    if (flying) return { label: race ? "give up the race and land 🐉" : "land your dragon 🐉 (or press 1)", act: stopFlying };
    if (here() === "forest") {
      buildRaceFlag();
      if (raceFlag && near(raceFlag.x, raceFlag.z, 3)) {
        const age = dragonAge();
        return { label: `start a DRAGON RACE 🏁${S.raceBest ? ` (your best: ${S.raceBest.toFixed(1)}s)` : ""}`, act: () => {
          if (age < 3) return ctx.say(age < 0 ? "🏁 You need a dragon to race! (A dragon egg waits on Ember Isle, out on the Open Sea.)" : "🏁 Your dragon is still too little to race — soon!", true);
          startRace();
        } };
      }
    }
    return null;
  }
  // 1 — call your dragon down (from anywhere outdoors)
  window.addEventListener("keydown", (e) => {
    if ((e.code !== "Digit1" && e.code !== "Numpad1") || e.repeat || ctx.playing()) return;
    if (document.querySelector("#shop.open")) return; // (the flute + contests use 1-4)
    if (flying) return stopFlying();
    const age = dragonAge();
    if (age < 0) return ctx.say("🐉 You don't have a dragon yet! Somewhere out on the OPEN SEA, on smoky Ember Isle, a treasure chest holds a dragon egg. (Reedmere's harbour → “To the Open Sea”)", true);
    if (age === 0) return ctx.say("🥚 Your dragon egg is still warming by your cottage door — it'll hatch very soon (by tomorrow)!", true);
    if (age < 3) return ctx.say(`🐉 Your dragon is still ${age === 1 ? "a tiny hatchling" : "young"} — too small to carry you yet. She'll be ALL grown up ${age === 1 ? "in about 2 days" : "tomorrow"}!`, true);
    if (ctx.world() === "home" || ctx.world() === "den") return ctx.say("🐉 Your dragon can't fit indoors! Go outside, then press 1.", true);
    if (["vault", "circus", "underglow", "deep"].includes(here())) return ctx.say("🐉 There's no room for your dragon in here — try outdoors!", true);
    callDragon();
  });
  function ridersHTML() {
    const D = ctx.dragonlings && ctx.dragonlings();
    if (!D) return "";
    if (!D.grown) return `<div class="msg">🐲 Your dragonlings are still growing — in ${D.daysLeft} more day${D.daysLeft === 1 ? "" : "s"} they'll be big enough to ride!</div>`;
    const cur = riderKey();
    return `<h4>Who will carry you?</h4>${Object.keys(RIDERS).map((k) => `<div class="item"><span class="ic">${RIDERS[k].icon}</span><span class="nm"><b>${riderName(k)}</b><small>${RIDERS[k].power}</small></span><button data-r="${k}" ${k === cur ? "disabled" : ""}>${k === cur ? "riding ✓" : "ride"}</button></div>`).join("")}`;
  }
  // 🐉 the flight list is SMALL text — compact rows, two columns of places, so it all fits
  let dlStyled = false;
  function dragonListStyle() {
    if (dlStyled) return;
    dlStyled = true;
    const st2 = document.createElement("style");
    st2.textContent = `
      #shop .card.dragonlist { font-size: 12px; font-family: system-ui, sans-serif; width: min(560px, 94vw); padding: 12px 14px 10px; max-height: 88vh; overflow-y: auto; }
      #shop .card.dragonlist h3 { font-size: 17px; margin-bottom: 2px; }
      #shop .card.dragonlist h4 { font-size: 12px; margin: 6px 0 2px; }
      #shop .card.dragonlist .coins { font-size: 11px; }
      #shop .card.dragonlist .item { padding: 3px 6px; margin: 2px 0; min-height: 0; gap: 6px; }
      #shop .card.dragonlist .item .ic { font-size: 15px !important; width: 22px !important; height: 22px !important; min-width: 22px; }
      #shop .card.dragonlist .item .ic img, #shop .card.dragonlist .item img { width: 22px !important; height: 22px !important; }
      #shop .card.dragonlist .item .nm, #shop .card.dragonlist .item .nm b { font-size: 12px; line-height: 1.25; }
      #shop .card.dragonlist .item small { font-size: 10.5px; }
      #shop .card.dragonlist .item button { font-size: 11px; padding: 2px 8px; }
      #shop .card.dragonlist .dl-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 6px; }
      #shop .card.dragonlist .close { font-size: 11px; }`;
    document.head.appendChild(st2);
  }
  function callDragon() {
    const T = ctx.travelInfo();
    {
      const dests = T.unlocked.filter((d) => d !== here());
      dragonListStyle();
      openCard(`<div class="card dragonlist"><h3>🐉 Your Dragon</h3><div class="coins">it lowers its great head for you to climb on…</div>
        <div class="item"><span class="ic">🏁</span><span class="nm"><b>DRAGON RACE!</b><small>10 golden rings over the Great Forest, against your dragonlings${S.raceBest ? ` · your best: ${S.raceBest.toFixed(1)}s` : ""}</small></span><button id="drace">race!</button></div>
        ${ridersHTML()}
        <div class="item"><span class="ic">🐉</span><span class="nm"><b>FLY right here!</b><small>soar over everything — 🖱 mouse steers · W fly · F breathe fire · grab glittering treasure</small></span><button id="dfly">fly!</button></div>
        <div class="dl-grid">${DRAGON_DESTS.filter((x) => x.when() && x.id !== here()).map((x) => `<div class="item"><span class="ic">${x.icon}</span><span class="nm"><b>${x.name}${x.fun ? " ⭐" : ""}</b>${x.fun ? `<small>⭐ ${x.fun}</small>` : ""}</span><button data-x="${x.id}">fly!</button></div>`).join("")}</div>
        <h4>…or fly far away to:</h4>
        <div class="dl-grid">${dests.map((d) => `<div class="item"><span class="ic">🐉</span><span class="nm">${{ forest: "the Great Forest", everbough: "Everbough", roothaven: "Roothaven", reedmere: "Reedmere", golden: "Golden Hollow", frostpine: "Frostpine", silverveil: "Silverveil" }[d] || d}</span><button data-d="${d}">fly!</button></div>`).join("")}</div>
        <div class="close">Esc — not now</div></div>`, (el) => {
        el.querySelectorAll("button[data-r]").forEach((b) => (b.onclick = () => {
          S.dragonPick = b.dataset.r;
          save();
          closeCard();
          ctx.say(`${RIDERS[b.dataset.r].icon} ${riderName(b.dataset.r)} it is! She ${RIDERS[b.dataset.r].power}. (F while flying)`, true);
          callDragon();
        }));
        const rb = el.querySelector("#drace");
        if (rb) rb.onclick = () => {
          closeCard();
          if (here() !== "forest") {
            // (the course is over the Great Forest — fly there first)
            ctx.say("🏁 To the race course! Your dragon carries you home to the Great Forest…", true);
            ctx.travelTo("forest");
            setTimeout(() => startRace(), 1800);
            return;
          }
          startRace();
        };
        el.querySelector("#dfly").onclick = () => {
          closeCard();
          startFlying();
        };
        el.querySelectorAll("button[data-x]").forEach((b) => (b.onclick = () => {
          closeCard();
          DRAGON_DESTS.find((x) => x.id === b.dataset.x).go();
        }));
        el.querySelectorAll("button[data-d]").forEach((b) => (b.onclick = () => {
          closeCard();
          ctx.say("🐉 WHOOOSH! Up through the clouds on dragon-back…", true);
          ctx.travelTo(b.dataset.d);
        }));
      });
    }
  }

  // ======================================================================
  //  🏰 YOUR CASTLE — Castle Hill, in the forest
  // ======================================================================
  const PIECES = [
    { key: "walls", icon: "🧱", name: "Stone Walls", cost: { coins: 60, "Smooth Stones": 6 } },
    { key: "keep", icon: "🏰", name: "The Great Keep", cost: { coins: 100, "Smooth Stones": 8, Twigs: 6 } },
    { key: "towers", icon: "🗼", name: "Four Towers", cost: { coins: 80, "Smooth Stones": 6 } },
    { key: "gate", icon: "🚪", name: "Gatehouse + Drawbridge", cost: { coins: 50, Twigs: 8 } },
    { key: "flags", icon: "🚩", name: "Banners & Flags", cost: { coins: 30, "Cloth Scraps": 3 } },
    { key: "garden", icon: "🌹", name: "Rose Garden", cost: { coins: 40, "Flower Petals": 6 } },
  ];
  let castle = null;
  function castleBuild() {
    if (castle || !ctx.ready()) return;
    const D = ctx.den;
    let at = null;
    for (let r = 50; r < 140 && !at; r += 8) for (let a = 0; a < 6.3 && !at; a += 0.4) {
      const x = D.x + Math.cos(a) * r;
      const z = D.z + Math.sin(a) * r;
      let ok = true;
      for (let k = 0; k < 8 && ok; k++) if (!free(x + Math.cos(k) * 9, z + Math.sin(k) * 9, 1.5)) ok = false;
      if (ok && free(x, z, 3)) at = { x, z };
    }
    at ||= { x: D.x + 60, z: D.z };
    const y = ctx.terrainHeight(at.x, at.z);
    const g = new THREE.Group();
    g.position.set(at.x, y, at.z);
    ctx.outsideGroup.add(g);
    const sign = signPost("🏰 CASTLE HILL");
    sign.position.set(0, 0, 13);
    g.add(sign);
    castle = { ...at, g, parts: {}, sign: { x: at.x, z: at.z + 13.5 } };
  }
  function castleDraw() {
    if (!castle) return;
    const stone = M(0xb8b0a0);
    const add = (key, build) => {
      if (castle.parts[key] || !S.castle[key]) return;
      const g = new THREE.Group();
      build(g);
      castle.g.add(g);
      castle.parts[key] = g;
      // (solid stone — no walking through the walls)
      const solid = (lx, lz, r) => ctx.addSolid && ctx.addSolid(castle.x + lx, castle.z + lz, r);
      if (key === "walls") {
        for (let c = -8; c <= 8; c += 1.4) {
          solid(8, c, 0.8);
          solid(-8, c, 0.8);
          solid(c, -8, 0.8);
          if (Math.abs(c) > 1.6 && Math.abs(c) < 3) solid(c, 8, 0.8); // (the gate stays open)
        }
      }
      if (key === "keep") for (let c = -3.5; c <= 3.5; c += 1.4) {
        solid(3.5, c, 0.8);
        solid(-3.5, c, 0.8);
        solid(c, 3.5, 0.8);
        solid(c, -3.5, 0.8);
      }
      if (key === "towers") for (const [x, z] of [[8, 8], [-8, 8], [8, -8], [-8, -8]]) solid(x, z, 1.9);
      if (key === "gate") {
        solid(-2.1, 8, 0.6);
        solid(2.1, 8, 0.6);
      }
    };
    add("walls", (g) => {
      for (let k = 0; k < 4; k++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 1), stone);
        w.position.set(Math.cos((k * Math.PI) / 2) * 8, 1.5, Math.sin((k * Math.PI) / 2) * 8);
        w.rotation.y = (k * Math.PI) / 2 + Math.PI / 2;
        if (k === 1) w.scale.x = 0.35; // (a gap for the gate)
        if (k === 1) w.position.x += 0;
        g.add(w);
        for (let c = -7; c <= 7; c += 2) {
          const cr = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1), stone);
          cr.position.set(Math.cos((k * Math.PI) / 2) * 8 + Math.sin((k * Math.PI) / 2) * c * (k === 1 ? 0 : 1), 3.4, Math.sin((k * Math.PI) / 2) * 8 + Math.cos((k * Math.PI) / 2) * c * (k === 1 ? 0 : 1));
          if (k !== 1) g.add(cr);
        }
      }
    });
    add("keep", (g) => {
      const k = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 7), stone);
      k.position.y = 4;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4, 4), M(0x5a6a9a));
      roof.position.y = 10;
      roof.rotation.y = Math.PI / 4;
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      door.position.set(0, 1.3, 3.52);
      g.add(k, roof, door);
    });
    add("towers", (g) => {
      for (const [x, z] of [[8, 8], [-8, 8], [8, -8], [-8, -8]]) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 7, 10), stone);
        t.position.set(x, 3.5, z);
        const r = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3, 10), M(0x5a6a9a));
        r.position.set(x, 8.5, z);
        g.add(t, r);
      }
    });
    add("gate", (g) => {
      const gh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), stone);
      gh.position.set(0, 2.5, 8);
      const arch = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      arch.position.set(0, 1.7, 9.02);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 4), M(0x8a6a42));
      bridge.position.set(0, 0.1, 11);
      g.add(gh, arch, bridge);
    });
    add("flags", (g) => {
      for (const [x, z] of [[8, 8], [-8, 8], [8, -8], [-8, -8], [0, 0]]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 4), M(0x5a3e24));
        pole.position.set(x, x === 0 ? 13 : 11, z);
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ color: [0xd83a3a, 0xf0c040, 0x3a6ad8][Math.abs(x + z) % 3], side: THREE.DoubleSide }));
        fl.position.set(x + 0.7, (x === 0 ? 13 : 11) + 1, z);
        g.add(pole, fl);
      }
    });
    add("garden", (g) => {
      for (let k = 0; k < 30; k++) {
        const a = k * 0.6;
        const r = 4.6 + (k % 3) * 0.6;
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), M([0xd83a4a, 0xff8ab8, 0xffffff][k % 3]));
        f.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
        g.add(f);
      }
    });
  }
  function openCastle(msg = "") {
    const n = PIECES.filter((p) => S.castle[p.key]).length;
    openCard(`<div class="card" style="max-height:84vh;overflow:auto"><h3>🏰 Your Castle</h3><div class="coins">🪙 ${S.coins} · ${n}/${PIECES.length} built</div>
      ${PIECES.map((p) => {
        const has = S.castle[p.key];
        const cost = Object.entries(p.cost).map(([k, v]) => (k === "coins" ? `🪙 ${priceNow(v, "castle")}` : `${v} ${k}`)).join(" + ");
        const can = Object.entries(p.cost).every(([k, v]) => (k === "coins" ? S.coins >= priceNow(v, "castle") : ctx.packCount(k) >= v));
        return `<div class="item"><span class="ic">${p.icon}</span><span class="nm">${p.name}<small>${has ? "✓ built!" : cost} <b>${powerText("castle:" + p.key)}</b></small></span>${has ? "" : `<button data-p="${p.key}" ${can ? "" : "disabled"}>build</button>`}</div>`;
      }).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — close</div></div>`, (el) => el.querySelectorAll("button[data-p]").forEach((b) => (b.onclick = () => {
      const p = PIECES.find((x) => x.key === b.dataset.p);
      for (const [k, v] of Object.entries(p.cost)) k === "coins" ? (S.coins -= priceNow(v, "castle")) : ctx.packTake(k, v);
      S.castle[p.key] = true;
      save();
      castleDraw();
      ctx.chime();
      const all = PIECES.every((x) => S.castle[x.key]);
      openCastle(all ? "🏰 YOUR CASTLE IS COMPLETE! Long live Queen Thistle of Castle Hill!" : `${p.icon} ${p.name} — built! ${powerText("castle:" + p.key)}`);
    })));
  }

  // ======================================================================
  //  🎪 THE TRAVELLING CIRCUS — a new city each week
  // ======================================================================
  const CIRCUS_CITIES = ["everbough", "reedmere", "golden", "frostpine"];
  const circusCity = () => CIRCUS_CITIES[Math.floor(day() / 7) % 4];
  let tent = null;
  function tentBuild() {
    const w = here();
    if (w !== circusCity()) return;
    const g0 = groupHere();
    if (!g0 || (tent && tent.g.parent === g0)) return;
    const at = spotNear(w === "everbough" ? 30 : 20, w === "everbough" ? 40 : -10, 5);
    const g = new THREE.Group();
    g.position.set(at.x, H()(at.x, at.z), at.z);
    for (let k = 0; k < 12; k++) {
      const panel = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 4, 12, 1, true, (k / 12) * Math.PI * 2, Math.PI / 6), M(k % 2 ? 0xd83a3a : 0xf4f0e8, { side: THREE.DoubleSide }));
      panel.position.y = 2;
      g.add(panel);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 4, 12), M(0xd83a3a));
    roof.position.y = 6;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: 0xf0c040, side: THREE.DoubleSide }));
    flag.position.set(0.6, 8.6, 0);
    const sign = signPost("🎪 THE CIRCUS!", "gold");
    sign.position.set(3.4, 0, 6.4);
    // a HUGE doorway, with the striped curtains tied back
    const doorway = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    doorway.position.set(0, 1.9, 4.85);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.18, 6, 16, Math.PI), M(0xf0c040));
    arch.position.set(0, 3.8, 4.9);
    for (const sx of [-1, 1]) {
      const curtain = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.8, 6), M(0xd83a3a));
      curtain.position.set(sx * 2.05, 1.9, 4.95);
      curtain.rotation.z = Math.PI;
      g.add(curtain);
    }
    g.add(roof, flag, sign, doorway, arch);
    g0.add(g);
    tent = { g, x: at.x, z: at.z + 6.8 };
  }
  const game = document.createElement("div");
  game.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:58;width:min(520px,92vw);padding:16px 20px;border-radius:18px;background:rgba(58,20,30,.95);color:#fff;font:15px system-ui;text-align:center;display:none";
  document.body.appendChild(game);
  let mini = null;
  // ---- walking in and out of the tent ----
  let tentBack = null;
  function enterTent() {
    tentBack = { city: here(), x: tent.x, z: tent.z + 1.5 };
    fadeThrough(() => {
      ctx.goCity("circus");
      ctx.placePlayer(CIRCUS.door.x, CIRCUS.door.z - 3, Math.PI);
      ctx.say("🎪 Inside the Big Top! The crowd is buzzing. Talk to the RINGMASTER (in the red coat) to see what's on.", true);
    }, 0.6);
  }
  function leaveTent() {
    const b = tentBack || { city: circusCity(), x: 0, z: 0 };
    fadeThrough(() => {
      if (b.city === "everbough") ctx.goEverbough();
      else ctx.goCity(b.city);
      ctx.placePlayer(b.x, b.z, 0);
    }, 0.6);
  }
  function openCircus() {
    openCard(`<div class="card"><h3>🎪 The Ringmaster</h3><div class="coins">“Roll up, roll up!” · 🪙 ${S.coins}</div>
      <div class="item"><span class="ic">🎢</span><span class="nm">The High Wire<small>climb the ladder on the LEFT (stand at its foot + E), then walk the rope to the golden flag. <b>W</b> walks · <b>A / D</b> keep your balance — the wind pushes you!</small></span><button id="ct">how?</button></div>
      <div class="item"><span class="ic">🎩</span><span class="nm">The Greatest Show<small>take a seat and watch the juggler, the acrobats and the Great Whiskerini (🪙 ${priceNow(3, "circus")})</small></span><button id="cm" ${S.coins < priceNow(3, "circus") ? "disabled" : ""}>watch!</button></div>
      <div class="item"><span class="ic">🤹</span><span class="nm">Juggling School<small>balls fall in 3 lanes — press 1, 2 or 3 as each crosses the line. Catch 15!</small></span><button id="cj">play</button></div>
      <div class="close">Esc — close · win the high wire AND juggling for the Circus Star!</div></div>`, (el) => {
      el.querySelector("#cj").onclick = () => (closeCard(), startJuggle());
      el.querySelector("#ct").onclick = () => {
        closeCard();
        ctx.say("🎢 Go to the ladder on the LEFT side of the ring and press E to climb. Up top: W to walk, A and D to balance. Watch the balance meter!", true);
      };
      el.querySelector("#cm").onclick = () => {
        S.coins -= priceNow(3, "circus");
        save();
        closeCard();
        playShow();
      };
    });
  }
  // ---- 🎢 the real high wire ----
  const keys3 = {};
  window.addEventListener("keydown", (e) => (keys3[e.code] = true));
  window.addEventListener("keyup", (e) => (keys3[e.code] = false));
  let wire = null; // { lean, v, wind, t, fallT }
  let pole = null;
  const balEl = document.createElement("div");
  balEl.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:40;width:340px;padding:8px 12px;border-radius:12px;background:rgba(58,20,30,.85);color:#fff;font:bold 13px system-ui;text-align:center;display:none;pointer-events:none";
  document.body.appendChild(balEl);
  function climbLadder() {
    const R = CIRCUS.rope;
    ctx.placePlayer(R.x0, R.z, Math.PI / 2);
    wire = { lean: 0, v: 0, wind: 0, t: 0, fallT: 0 };
    ctx.say("🎢 Up on the high platform! The rope stretches away to the golden flag. W to walk — A and D to balance!", true);
  }
  function wireUpdate(dt) {
    const Z = here() === "circus" ? ctx.city() : null;
    const R = CIRCUS.rope;
    if (!Z || !wire) {
      balEl.style.display = "none";
      if (pole) pole.visible = false;
      return;
    }
    const p = me();
    if (!pole) {
      pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 5), M(0xd8b04a));
      pole.rotation.z = Math.PI / 2;
      ctx.scene.add(pole);
    }
    // fell? into the net… then back up the ladder
    if (wire.fallT > 0) {
      wire.fallT -= dt;
      balEl.style.display = "none";
      pole.visible = false;
      ctx.mouseRig.rotation.z = 0;
      if (wire.fallT <= 0) {
        wire = null;
        ctx.placePlayer(CIRCUS.ladder.x + 1.5, CIRCUS.ladder.z + 2, 0);
        ctx.say("🎢 BOING! Into the safety net — the crowd goes “ooooh!”. Climb the ladder to try again.", true);
      }
      return;
    }
    const up = p.y > R.y - 1.5;
    if (!up) {
      wire = null;
      ctx.mouseRig.rotation.z = 0;
      return;
    }
    const onRope = p.x > R.x0 + 1.6 && p.x < R.x1 - 1.6;
    // face along the rope; keep you on it
    ctx.mouseRig.rotation.y = Math.PI / 2;
    if (onRope) {
      // (on the wire you can only shuffle, VERY slowly — step by careful step)
      if (wire.lastX !== undefined && p.x > wire.lastX) p.x = wire.lastX + Math.min(p.x - wire.lastX, dt * 1.1);
      if (wire.lastX !== undefined && p.x < wire.lastX) p.x = wire.lastX - Math.min(wire.lastX - p.x, dt * 1.1);
      p.z = R.z + wire.lean * 0.25;
      wire.t += dt;
      // the wind changes every few seconds, and grows as you go
      if (Math.floor(wire.t / 2.2) !== Math.floor((wire.t - dt) / 2.2)) wire.wind = (Math.random() - 0.5) * (1.2 + (p.x - R.x0) / 14);
      const push = (keys3.KeyD || keys3.ArrowRight ? 1 : 0) - (keys3.KeyA || keys3.ArrowLeft ? 1 : 0);
      wire.v += (wire.wind + wire.lean * 0.9 - push * 3.2) * dt;
      wire.v *= 1 - dt * 1.2;
      wire.lean += wire.v * dt;
      if (Math.abs(wire.lean) >= 1) {
        // over you go!
        p.z = R.z + Math.sign(wire.lean) * 1.6;
        wire.fallT = 1.6;
        Z.cheer = false;
        return;
      }
    } else wire.lean *= 0.9;
    wire.lastX = p.x;
    ctx.mouseRig.rotation.z = -wire.lean * 0.5;
    pole.visible = true;
    pole.position.set(p.x, p.y + 0.55, p.z);
    pole.rotation.x = wire.lean * 0.5;
    // the balance meter
    balEl.style.display = "";
    const pct = 50 + wire.lean * 50;
    balEl.innerHTML = `🎢 BALANCE — ${onRope ? "keep the dot in the GREEN!" : "walk onto the rope (W)"}<div style="position:relative;height:16px;margin-top:6px;border-radius:8px;background:linear-gradient(90deg,#e84a4a,#f0c030 25%,#4ac060 40%,#4ac060 60%,#f0c030 75%,#e84a4a)"><div style="position:absolute;left:calc(${pct}% - 7px);top:-3px;width:14px;height:22px;border-radius:7px;background:#fff;box-shadow:0 0 6px #000"></div></div><div style="margin-top:4px;font-weight:normal">A ← lean left · D → lean right · wind: ${wire.wind > 0.15 ? "pushing →" : wire.wind < -0.15 ? "← pushing" : "calm"}</div>`;
    // made it!
    if (p.x >= R.x1 - 1.4) {
      wire = null;
      ctx.mouseRig.rotation.z = 0;
      pole.visible = false;
      balEl.style.display = "none";
      Z.cheer = true;
      setTimeout(() => (Z.cheer = false), 4000);
      circusWin("rope");
      ctx.say("🎢 YOU MADE IT ACROSS! The whole tent leaps to its feet — THUNDEROUS applause! 👏👏👏", true);
    }
  }
  // ---- 🎩 the Greatest Show ----
  function playShow() {
    const Z = ctx.city();
    const C = CIRCUS.ring;
    const cast = Z.cast;
    const home = {};
    for (const [k, m] of Object.entries(cast)) home[k] = m.position.clone();
    const seat = [CIRCUS.seat.x, 4.5, CIRCUS.seat.z];
    const look = [C.x, 2, C.z];
    const end = () => {
      for (const [k, m] of Object.entries(cast)) {
        m.position.copy(home[k]);
        m.rotation.set(0, 0, 0);
      }
      Z.balls.forEach((b) => (b.visible = false));
      Z.doves.forEach((d) => (d.visible = false));
      Z.sparkles.forEach((s2) => (s2.visible = false));
      Z.magicHat.visible = false;
      Z.cheer = false;
    };
    playCutscene([
      { dur: 4, from: seat, look, who: "The Ringmaster", text: "“Mice of all ages! Welcome to the GREATEST SHOW UNDER THE CANOPY!”", update: () => {
        cast.ringmaster.position.set(C.x, 0, C.z + 2);
        cast.ringmaster.rotation.y = 0;
      } },
      { dur: 6, from: [C.x + 4, 3, C.z + 7], look: [C.x, 2.5, C.z], who: "🤹 Juggling Juniper", text: "One ball… two… three… FOUR! Never dropping a single one!", update: (k) => {
        const j = cast.juggler;
        j.position.set(C.x, 0, C.z);
        j.rotation.y = 0;
        const t = performance.now() / 1000;
        Z.balls.forEach((b, i) => {
          b.visible = true;
          const a = t * 4 + (i / 4) * Math.PI * 2;
          b.position.set(C.x + Math.cos(a) * 0.7, 1.6 + Math.abs(Math.sin(a)) * 1.8, C.z + 0.4);
        });
      }, end: () => {
        Z.balls.forEach((b) => (b.visible = false));
        cast.juggler.position.copy(home.juggler);
      } },
      { dur: 6.5, from: [C.x + 10, 7, C.z + 10], look: [C.x, 9, C.z], who: "🤸 The Flying Fennels", text: "High on the trapeze — they swing… they LET GO… and catch each other in mid-air!", update: (k) => {
        const tr = Z.trapeze;
        const a = tr.rotation.x;
        const bx = C.x;
        const bz = C.z + Math.sin(a) * 6;
        const by = 18 - Math.cos(a) * 6;
        cast.acrobatA.position.set(bx, by - 1.2, bz);
        // the flier: tumbles across, then lands on the bar
        const f = Math.min(1, k * 1.6);
        cast.acrobatB.position.set(bx + (1 - f) * 6, by - 1.2 + Math.sin(f * Math.PI) * 3, bz);
        cast.acrobatB.rotation.x = f < 1 ? f * Math.PI * 4 : 0;
        Z.cheer = k > 0.6;
      }, end: () => {
        cast.acrobatA.position.copy(home.acrobatA);
        cast.acrobatB.position.copy(home.acrobatB);
        cast.acrobatB.rotation.x = 0;
      } },
      { dur: 7, from: [C.x + 3, 2.6, C.z + 6], look: [C.x, 1.6, C.z], who: "🎩 The Great Whiskerini", text: "“Nothing in my hat… NOTHING… and now — ABRACADABRA!” Out flutter SIX white doves!", update: (k) => {
        const m = cast.magician;
        m.position.set(C.x, 0, C.z);
        m.rotation.y = 0;
        Z.magicHat.visible = true;
        Z.magicHat.position.set(C.x + 0.9, 0.35, C.z + 0.6);
        Z.doves.forEach((d, i) => {
          const kk = Math.max(0, k * 1.6 - 0.5 - i * 0.05);
          d.visible = kk > 0;
          const a = i * 1.05 + kk * 3;
          d.position.set(C.x + 0.9 + Math.cos(a) * kk * 5, 0.8 + kk * 9, C.z + 0.6 + Math.sin(a) * kk * 5);
          d.children[0].rotation.y = Math.sin(performance.now() / 60 + i) * 0.8;
          d.children[1].rotation.y = -Math.sin(performance.now() / 60 + i) * 0.8;
        });
        Z.cheer = k > 0.5;
      }, end: () => {
        cast.magician.position.copy(home.magician);
        Z.magicHat.visible = false;
      } },
      { dur: 4.5, from: seat, look: [C.x, 6, C.z], who: "The Ringmaster", text: "“…and THAT, dear friends, is the Greatest Show Under the Canopy! Good NIGHT!” ✨", update: (k) => {
        Z.cheer = true;
        cast.ringmaster.position.set(C.x, 0, C.z + 2);
        Object.values(cast).forEach((m, i) => m !== cast.ringmaster && m.position.set(C.x - 4 + i * 2, 0, C.z - 1));
        Z.sparkles.forEach((s2, i) => {
          s2.visible = true;
          const a = i * 0.6 + k * 4;
          s2.position.set(C.x + Math.cos(a) * (2 + (i % 5)), 3 + ((i * 1.7 + k * 12) % 14), C.z + Math.sin(a) * (2 + (i % 5)));
        });
      }, end },
      { dur: 0.4, gameCam: true, end: () => {
        end();
        S.stats = S.stats || {};
        S.stats.shows = (S.stats.shows || 0) + 1;
        save();
        ctx.say("🎪 What a show! (Next: try the HIGH WIRE yourself — the ladder's on the left.)", true);
      } },
    ]);
  }
  // (test) &circustest=show|wire
  {
    const ct = new URLSearchParams(location.search).get("circustest");
    const go = () => {
      if (here() !== "circus" || (ctx.playing && ctx.playing())) return setTimeout(go, 500);
      if (ct === "show") playShow();
      if (ct === "wire") {
        climbLadder();
        setTimeout(() => (me().x = CIRCUS.rope.x0 + 6), 300);
      }
    };
    if (ct) setTimeout(go, 3500);
  }
  function circusInteract() {
    if (here() !== "circus") return null;
    const Z = ctx.city();
    const C = CIRCUS;
    if (wire) return null;
    if (near(C.door.x, C.door.z, 3.2)) return { label: "leave the circus tent", act: leaveTent };
    const rm = Z.cast.ringmaster.position;
    if (near(rm.x, rm.z, 2.6)) return { label: "talk to the Ringmaster 🎩", act: openCircus };
    if (near(C.ladder.x, C.ladder.z + 2, 2.4) && me().y < 3) return { label: "climb the ladder to the HIGH WIRE 🎢", act: climbLadder };
    if (near(C.seat.x, C.seat.z, 3) && S.coins >= priceNow(3, "circus")) return { label: `take a seat for the Greatest Show 🎩 (🪙 ${priceNow(3, "circus")})`, act: () => {
      S.coins -= priceNow(3, "circus");
      save();
      playShow();
    } };
    return null;
  }
  function circusWin(k) {
    (S.circus ||= {})[k] = true;
    S.coins += 20;
    let m = `🎪 You WIN! +🪙 20`;
    if (S.circus.juggle && S.circus.rope && !(S.owned || {}).circusstar) {
      (S.owned ||= {}).circusstar = true;
      m += " — and the ringmaster pins the CIRCUS STAR on you! ⭐";
    }
    save();
    ctx.chime();
    ctx.say(m, true);
  }
  function startJuggle() {
    mini = { kind: "juggle", balls: [], caught: 0, missed: 0, t: 0, next: 0 };
    game.style.display = "";
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (!mini) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (e.code === "Escape") {
        mini = null;
        game.style.display = "none";
        return;
      }
      if (mini.kind === "juggle") {
        const lane = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (lane === undefined) return;
        const b = mini.balls.find((x) => x.lane === lane && x.y > 0.78 && !x.done);
        if (b) {
          b.done = true;
          mini.caught++;
        } else mini.missed++;
      }
      if (mini.kind === "rope") {
        if (e.code === "KeyA" || e.code === "ArrowLeft") mini.v -= 0.35;
        if (e.code === "KeyD" || e.code === "ArrowRight") mini.v += 0.35;
      }
    },
    true
  );
  function miniUpdate(dt) {
    if (!mini) return;
    mini.t += dt;
    if (mini.kind === "juggle") {
      if (mini.t > mini.next) {
        mini.next = mini.t + Math.max(0.45, 1.1 - mini.caught * 0.04);
        mini.balls.push({ lane: Math.floor(Math.random() * 3), y: 0, done: false, col: ["#e84a4a", "#f0c030", "#4a8ae8", "#4ac060"][Math.floor(Math.random() * 4)] });
      }
      for (const b of mini.balls) {
        if (b.done) continue;
        b.y += dt * 0.55;
        if (b.y > 1) {
          b.done = true;
          mini.missed++;
        }
      }
      mini.balls = mini.balls.filter((b) => !b.done || b.y < 1);
      game.innerHTML = `<div style="font:bold 20px Georgia;color:#ffe08a">🤹 JUGGLING — caught ${mini.caught}/15 · dropped ${mini.missed}/5</div>
        <div style="position:relative;height:260px;margin:10px auto;width:300px;background:rgba(255,255,255,.08);border-radius:12px">
          ${mini.balls.filter((b) => !b.done).map((b) => `<div style="position:absolute;left:${50 + b.lane * 100 - 16}px;top:${b.y * 230}px;width:32px;height:32px;border-radius:50%;background:${b.col}"></div>`).join("")}
          <div style="position:absolute;left:0;right:0;top:${0.8 * 230}px;height:40px;border-top:2px dashed #ffe08a"></div>
        </div>
        <div style="display:flex;justify-content:center;gap:58px;font:bold 22px system-ui">${[1, 2, 3].map((n) => `<span>${n}</span>`).join("")}</div>
        <div style="font:12px system-ui;color:#d8b8c8;margin-top:6px">press 1 2 3 when a ball crosses the dashed line · Esc — stop</div>`;
      if (mini.caught >= 15) {
        mini = null;
        game.style.display = "none";
        circusWin("juggle");
      } else if (mini.missed >= 5) {
        mini = null;
        game.style.display = "none";
        ctx.say("🤹 Oops — too many dropped balls! The crowd cheers anyway. Try again?", true);
      }
    } else {
      // the wind changes every couple of seconds
      if (Math.floor(mini.t / 2) !== Math.floor((mini.t - dt) / 2)) mini.wind = (Math.random() - 0.5) * (1 + mini.t * 0.05);
      mini.v += mini.wind * dt + mini.x * dt * 0.8;
      mini.v *= 1 - dt * 0.8;
      mini.x += mini.v * dt;
      const left = Math.max(0, 20 - mini.t);
      game.innerHTML = `<div style="font:bold 20px Georgia;color:#ffe08a">🎢 THE TIGHTROPE — ${left.toFixed(1)}s to go</div>
        <div style="position:relative;height:60px;margin:18px auto;width:320px;border-radius:30px;background:linear-gradient(90deg,#e84a4a,#f0c030 30%,#4ac060 45%,#4ac060 55%,#f0c030 70%,#e84a4a)">
          <div style="position:absolute;left:${160 + mini.x * 160 - 4}px;top:-8px;width:8px;height:76px;background:#fff;border-radius:4px;box-shadow:0 0 8px #000"></div>
        </div>
        <div style="font:14px system-ui">wind: ${mini.wind > 0.1 ? "→→" : mini.wind < -0.1 ? "←←" : "calm"} · tap A ← and D → to keep the needle in the GREEN</div>
        <div style="font:12px system-ui;color:#d8b8c8;margin-top:6px">Esc — stop</div>`;
      if (Math.abs(mini.x) >= 1) {
        mini = null;
        game.style.display = "none";
        ctx.say("🎢 Wobble… wobble… WHOOPS! Into the safety net you go. Try again?", true);
      } else if (left <= 0) {
        mini = null;
        game.style.display = "none";
        circusWin("rope");
      }
    }
  }

  // ======================================================================
  //  🕵️ MYSTERY CASES
  // ======================================================================
  const CASES = [
    { key: "pie", city: "golden", icon: "🥧", title: "The Case of the Vanished Pie", victim: "Baker Poppy", text: "My prize berry pie — GONE from the windowsill!",
      clues: ["purple berry stains on the fence… heading towards the windmill", "a trail of crumbs that stops at a tiny pair of boot prints", "a single long grey whisker caught on the windowsill"],
      suspects: [["Miller Dusty", "a mouse with dusty white whiskers"], ["Little Pip-Squeak", "a young mouse with tiny boots and a purple-stained grin"], ["Old Grey Barnaby", "an old mouse with long grey whiskers, who hates berries"]], culprit: 1 },
    { key: "bell", city: "frostpine", icon: "🔔", title: "The Case of the Silent Bell", victim: "Warden Brisk", text: "Someone stole the clapper from the Warning Bell!",
      clues: ["a scrap of red knitted wool snagged on the bell rope", "fresh sled tracks leading toward the frozen lake", "a whittled wooden clapper left behind — a bad copy"],
      suspects: [["Knitter Purl", "always in red wool"], ["Sled-Master Rime", "had his sled out all night"], ["Woodcarver Alder", "the best whittler in town — he'd never make a BAD copy"]], culprit: 1 },
    { key: "pearl", city: "reedmere", icon: "⚪", title: "The Case of the Missing Pearl", victim: "Pearl Diver Coral", text: "My biggest pearl was swapped for a painted pebble!",
      clues: ["the fake pearl is still wet with paint — painted TODAY", "a raft was rowed out at dawn (the ropes are still damp)", "a paint pot hidden under the jetty, with a ribbon from the Boutique"],
      suspects: [["Painter Lark", "paints signs, but hasn't left her studio all week"], ["Ferry-Mouse Tide", "rows at dawn every day, and sells ribbons on the side"], ["Netmender Juno", "has no raft and can't stand paint"]], culprit: 1 },
  ];
  const caseObjs = {};
  function caseState(k) {
    return (S.cases[k] ||= { st: "new", clues: {} });
  }
  function caseBuild(C) {
    const g0 = groupHere();
    if (!g0) return null;
    if (caseObjs[C.key] && caseObjs[C.key].g0 === g0) return caseObjs[C.key];
    const rnd = (i) => hash(i, C.key.length);
    const mk = (name, tunic, at) => {
      const m = buildThistle({ tunicColor: tunic, hoodColor: tunic, pack: false });
      m.position.set(at.x, H()(at.x, at.z), at.z);
      m.rotation.y = Math.atan2(-at.x, -at.z);
      g0.add(m);
      return { name, ...at, m };
    };
    const victim = mk(C.victim, 0x8a6a9a, spotNear(16, 24, 1.5));
    const clues = C.clues.map((_, i) => {
      const at = spotNear(Math.cos(i * 2.1 + 1) * 40, Math.sin(i * 2.1 + 1) * 40, 1);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 16), M(0xd8b04a)), glow(0xbfe6ff, 1.8));
      g.position.set(at.x, H()(at.x, at.z) + 0.8, at.z);
      g0.add(g);
      return { ...at, g };
    });
    const suspects = C.suspects.map(([n], i) => mk(n, [0x6a8aa8, 0xa86a6a, 0x6aa86a][i], spotNear(-20 + i * 10, -30 - rnd(i) * 10, 1.5)));
    return (caseObjs[C.key] = { g0, victim, clues, suspects });
  }
  function openAccuse(C) {
    openCard(`<div class="card"><h3>${C.icon} ${C.title}</h3><div class="coins">Your clues:</div>
      <ul style="font:14px Georgia;line-height:1.5">${C.clues.map((c) => `<li>🔎 ${c}</li>`).join("")}</ul>
      <div class="coins">Who did it?</div>
      ${C.suspects.map(([n, d], i) => `<div class="item"><span class="ic">🐭</span><span class="nm">${n}<small>${d}</small></span><button data-i="${i}">it was them!</button></div>`).join("")}
      <div class="close">Esc — think some more</div></div>`, (el) => el.querySelectorAll("button[data-i]").forEach((b) => (b.onclick = () => {
      closeCard();
      const s = caseState(C.key);
      if (+b.dataset.i === C.culprit) {
        s.st = "solved";
        S.coins += 50;
        if (CASES.every((x) => caseState(x.key).st === "solved")) (S.owned ||= {}).detectivebadge = true;
        save();
        ctx.chime();
        ctx.say(`🕵️ CASE CLOSED! It was ${C.suspects[C.culprit][0]} — who says sorry and gives everything back. +🪙 50${(S.owned || {}).detectivebadge ? " · You've solved EVERY case — the Detective's Magnifying Glass is yours!" : ""}`, true);
      } else ctx.say(`🕵️ “It wasn't ME!” says ${C.suspects[+b.dataset.i][0]}, very offended. Look at the clues again…`, true);
    })));
  }
  function caseInteract() {
    const C = CASES.find((x) => x.city === here() && caseState(x.key).st !== "solved");
    if (!C) return null;
    const O = caseBuild(C);
    if (!O) return null;
    const s = caseState(C.key);
    O.clues.forEach((c, i) => (c.g.visible = s.st === "open" && !s.clues[i]));
    if (near(O.victim.x, O.victim.z)) {
      if (s.st === "new") return { label: `talk to ${C.victim} — something's wrong! 🕵️`, act: () => {
        s.st = "open";
        save();
        ctx.say(`🕵️ ${C.victim}: “${C.text} Please, detective — find the clues (glowing 🔎 rings round town), then tell me who did it!”`, true);
      } };
      const n = Object.keys(s.clues).length;
      if (n >= 3) return { label: `tell ${C.victim} who did it 🕵️`, act: () => openAccuse(C) };
      return { label: `${C.victim}: “Found the clues yet?” (${n}/3)`, act: () => {} };
    }
    if (s.st === "open") {
      for (let i = 0; i < O.clues.length; i++) {
        const c = O.clues[i];
        if (s.clues[i] || !near(c.x, c.z, 2)) continue;
        return { label: "examine the clue 🔎", act: () => {
          s.clues[i] = true;
          save();
          ctx.chime();
          ctx.say(`🔎 CLUE (${Object.keys(s.clues).length}/3): ${C.clues[i]}`, true);
        } };
      }
      for (let i = 0; i < O.suspects.length; i++) {
        const sp = O.suspects[i];
        if (!near(sp.x, sp.z)) continue;
        return { label: `question ${sp.name} 🗣️`, act: () => ctx.say(`🗣️ ${sp.name} (${C.suspects[i][1]}): “${["I was home all day, I swear!", "Who, me? I've been, um… busy. Very busy.", "I saw NOTHING. Absolutely nothing. Hmph."][i]}”`, true) };
      }
    }
    return null;
  }

  // ======================================================================
  //  🌌 THE TELESCOPE — Silverveil's observatory, at night
  // ======================================================================
  const CONST = [
    { key: "lantern", name: "the Lantern-Bearer", pts: [[0.2, 0.3], [0.3, 0.2], [0.42, 0.28], [0.38, 0.42], [0.25, 0.45]] },
    { key: "acorn", name: "the Great Acorn", pts: [[0.6, 0.15], [0.7, 0.12], [0.78, 0.2], [0.72, 0.32], [0.62, 0.3]] },
    { key: "mouse", name: "the Sleeping Mouse", pts: [[0.15, 0.7], [0.25, 0.65], [0.35, 0.68], [0.42, 0.62], [0.47, 0.7]] },
    { key: "owl", name: "the Watchful Owl", pts: [[0.62, 0.6], [0.7, 0.55], [0.78, 0.6], [0.74, 0.72], [0.66, 0.72]] },
  ];
  function openTelescope() {
    if (!night()) return ctx.say("🔭 It's too bright to see the stars — come back at NIGHT!", true);
    const comet = Math.random() < 0.35 && !(S.owned || {}).comet ? { x: 0.5 + Math.random() * 0.3, y: 0.4 + Math.random() * 0.15 } : null;
    let sel = [];
    let found = Object.keys(S.stars2).length;
    const draw = (msg = "") => {
      const W = 520;
      const Hh = 320;
      const dots = [];
      CONST.forEach((C, ci) => C.pts.forEach(([x, y], pi) => dots.push({ ci, pi, x: x * W, y: y * Hh })));
      for (let i = 0; i < 40; i++) dots.push({ ci: -1, x: hash(i, 9) * W, y: hash(i, 8) * Hh });
      const lines = CONST.filter((C) => S.stars2[C.key]).map((C) => C.pts.map(([x, y]) => `${x * W},${y * Hh}`).join(" "));
      openCard(`<div class="card" style="width:min(580px,94vw);background:#0e1430;color:#e8ecff"><h3 style="color:#ffe08a">🔭 The Moonkeepers' Telescope</h3>
        <div class="coins" style="color:#bfd8ff">Click the 5 bright stars of a constellation, in a row, to trace it · found ${found}/${CONST.length}</div>
        <svg viewBox="0 0 ${W} ${Hh}" style="width:100%;background:radial-gradient(#1a2450,#05070f);border-radius:12px;cursor:crosshair">
          ${lines.map((l) => `<polyline points="${l}" fill="none" stroke="#ffe08a" stroke-width="2"/>`).join("")}
          ${sel.length > 1 ? `<polyline points="${sel.map((d) => `${d.x},${d.y}`).join(" ")}" fill="none" stroke="#8ab8ff" stroke-width="2" stroke-dasharray="4 3"/>` : ""}
          ${dots.map((d, i) => `<circle data-i="${i}" cx="${d.x}" cy="${d.y}" r="${d.ci >= 0 ? 5 : 2}" fill="${d.ci >= 0 ? "#fff8e0" : "#8a98c8"}" style="cursor:pointer"/>`).join("")}
          ${comet ? `<g data-comet="1" style="cursor:pointer"><circle cx="${comet.x * W}" cy="${comet.y * Hh}" r="6" fill="#bfffef"/><line x1="${comet.x * W}" y1="${comet.y * Hh}" x2="${comet.x * W + 40}" y2="${comet.y * Hh - 18}" stroke="#bfffef" stroke-width="3" opacity=".6"/></g>` : ""}
        </svg>
        <div class="msg" style="color:#a8ffb8">${msg}</div><div class="close">Esc — step away${comet ? " · ✨ something's MOVING up there…" : ""}</div></div>`, (el) => {
        el.querySelectorAll("circle[data-i]").forEach((c) => (c.onclick = () => {
          const d = dots[+c.dataset.i];
          if (d.ci < 0) return draw("Just a faint star… try the BRIGHT ones.");
          if (sel.length && sel[0].ci !== d.ci) sel = [];
          if (!sel.includes(d)) sel.push(d);
          if (sel.length === 5) {
            const C = CONST[d.ci];
            sel = [];
            if (!S.stars2[C.key]) {
              S.stars2[C.key] = true;
              found++;
              S.coins += 15;
              save();
              ctx.chime();
              return draw(`✨ You traced ${C.name}! +🪙 15`);
            }
            return draw(`(You've already found ${C.name}.)`);
          }
          draw(`${sel.length}/5 stars…`);
        }));
        const cm = el.querySelector("[data-comet]");
        if (cm) cm.onclick = () => {
          (S.owned ||= {}).comet = true;
          S.coins += 40;
          save();
          ctx.chime();
          closeCard();
          ctx.say("☄️ A COMET! You're the first to see it — the Moonkeepers name it after you: Comet Thistle! +🪙 40 and the Comet Chart.", true);
        };
      });
    };
    draw();
  }

  // ======================================================================
  //  🎨 THE EASEL — paint a picture
  // ======================================================================
  let easel = null;
  function easelBuild() {
    if (easel || !ctx.ready()) return;
    const D = ctx.den;
    const at = spotNear(D.x - 6, D.z + 5, 1.2);
    const g = new THREE.Group();
    g.position.set(at.x, ctx.terrainHeight(at.x, at.z), at.z);
    for (const [x, rz] of [[-0.4, 0.15], [0.4, -0.15]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2, 4), M(0x8a6a42));
      leg.position.set(x, 1, 0);
      leg.rotation.z = rz;
      g.add(leg);
    }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ color: 0xfbf8f0, side: THREE.DoubleSide }));
    board.position.set(0, 1.4, 0.05);
    board.rotation.x = -0.15;
    g.add(board);
    ctx.outsideGroup.add(g);
    easel = { ...at, board };
  }
  function openEasel() {
    const cols = ["#3a2a1a", "#e84a4a", "#f0a030", "#f0d040", "#4ac060", "#4a8ae8", "#9a5ad8", "#ff9ab8", "#ffffff", "#8ac8f0"];
    openCard(`<div class="card" style="width:min(560px,94vw)"><h3>🎨 Your Easel</h3><div class="coins">draw with your mouse · pick colors and brush size</div>
      <canvas id="pnt" width="400" height="280" style="width:100%;max-width:400px;background:#fbf8f0;border-radius:8px;cursor:crosshair;touch-action:none;box-shadow:0 2px 10px rgba(0,0,0,.3)"></canvas>
      <div style="margin:8px 0">${cols.map((c) => `<button data-c="${c}" style="width:28px;height:28px;border-radius:50%;border:2px solid #fff;background:${c};margin:2px"></button>`).join("")}</div>
      <div><button data-b="3">fine</button> <button data-b="8">medium</button> <button data-b="18">big</button> <button id="pclear">🧽 clear</button> <button id="psave" style="font-weight:bold">🖼️ Finish & keep it!</button></div>
      <div class="msg"></div><div class="close">Esc — put the brush down</div></div>`, (el) => {
      const cv = el.querySelector("#pnt");
      const g = cv.getContext("2d");
      g.fillStyle = "#fbf8f0";
      g.fillRect(0, 0, 400, 280);
      let col = "#3a2a1a";
      let size = 8;
      let down = false;
      let last = null;
      const pos = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 280 };
      };
      cv.onpointerdown = (e) => {
        down = true;
        last = pos(e);
        cv.setPointerCapture(e.pointerId);
      };
      cv.onpointerup = () => (down = false);
      cv.onpointermove = (e) => {
        if (!down) return;
        const p = pos(e);
        g.strokeStyle = col;
        g.lineWidth = size;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(last.x, last.y);
        g.lineTo(p.x, p.y);
        g.stroke();
        last = p;
      };
      el.querySelectorAll("button[data-c]").forEach((b) => (b.onclick = () => (col = b.dataset.c)));
      el.querySelectorAll("button[data-b]").forEach((b) => (b.onclick = () => (size = +b.dataset.b)));
      el.querySelector("#pclear").onclick = () => {
        g.fillStyle = "#fbf8f0";
        g.fillRect(0, 0, 400, 280);
      };
      el.querySelector("#psave").onclick = () => {
        const small = document.createElement("canvas");
        small.width = 200;
        small.height = 140;
        small.getContext("2d").drawImage(cv, 0, 0, 200, 140);
        const n = S.paintings.length + 1;
        const title = (prompt("What's your painting called?", `Painting No. ${n}`) || `Painting No. ${n}`).slice(0, 40);
        S.paintings.push({ title, img: small.toDataURL("image/jpeg", 0.7) });
        if (S.paintings.length > 8) S.paintings.shift();
        const key = "painting_" + Date.now();
        (S.owned ||= {})[key] = true;
        registerKeepsake(key, "🖼️", `“${title}” (your painting)`);
        (S.paintKeys ||= {})[key] = title;
        (S.storybook ||= []).push({ day: day(), text: `Thistle painted a picture called “${title}”.`, thumb: small.toDataURL("image/jpeg", 0.6) });
        save();
        ctx.chime();
        closeCard();
        ctx.say(`🖼️ “${title}” — a masterpiece! It's in your treasures: hang it on a wall in any of your houses. (It's in your storybook too — press I)`, true);
      };
    });
  }
  for (const [k, title] of Object.entries(S.paintKeys || {})) registerKeepsake(k, "🖼️", `“${title}” (your painting)`);

  // ======================================================================
  //  🌸 CITY SEASONS — the cities change too
  // ======================================================================
  const seasonFx = { key: null, objs: [], city: null, waterAt: null };
  function citySeason() {
    const c = ctx.world() === "city" ? ctx.city() : ctx.world() === "everbough" ? { id: "everbough", group: ctx.cityGroup, height: ctx.cityHeight } : null;
    const s = ctx.season();
    const want = c ? `${c.id}:${s}` : null;
    if (want === seasonFx.key) return;
    // tidy away the last place's season
    seasonFx.objs.forEach((o) => o.parent && o.parent.remove(o));
    seasonFx.objs = [];
    if (seasonFx.city && seasonFx.waterAt) seasonFx.city.waterAt = seasonFx.waterAt;
    if (seasonFx.restoreH) {
      seasonFx.restoreH();
      seasonFx.restoreH = null;
    }
    seasonFx.city = null;
    seasonFx.waterAt = null;
    seasonFx.key = want;
    if (!c) return;
    const add = (o) => (c.group.add(o), seasonFx.objs.push(o));
    // 🌸 Everbough in spring: cherry blossoms drifting everywhere
    if (c.id === "everbough" && s === "spring") {
      const N = 800;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) pos.set([(hash(i, 1) - 0.5) * 200, 2 + hash(i, 2) * 40, (hash(i, 3) - 0.5) * 200], i * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb8d0, size: 0.4 }));
      pts.userData.drift = true;
      add(pts);
    }
    // 🎃 Golden Hollow in autumn: pumpkins in the fields, a harvest glow
    if (c.id === "golden" && s === "autumn") {
      for (let k = 0; k < 40; k++) {
        const x = (hash(k, 4) - 0.5) * 140;
        const z = (hash(k, 5) - 0.5) * 140;
        if (c.colliders && c.colliders.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 1)) continue;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.5 + hash(k, 6) * 0.4, 10, 8), M(0xe8782a));
        p.scale.y = 0.75;
        p.position.set(x, c.height(x, z) + 0.35, z);
        add(p);
      }
    }
    // ❄️ Reedmere in winter: the lagoon FREEZES (walk on it!) and snow falls
    if (c.id === "reedmere" && s === "winter") {
      seasonFx.city = c;
      seasonFx.waterAt = c.waterAt;
      const orig = c.waterAt;
      c.waterAt = (x, z) => (orig(x, z) !== null ? null : null); // (frozen solid)
      c.frozenH = c.height;
      const ice = new THREE.Mesh(new THREE.RingGeometry(8, 47, 48), new THREE.MeshStandardMaterial({ color: 0xd8ecf8, roughness: 0.2, metalness: 0.1 }));
      ice.rotation.x = -Math.PI / 2;
      ice.position.y = 0.22;
      add(ice);
      // (you walk on the ice's surface)
      const h0 = c.height;
      c.height = (x, z) => (orig(x, z) !== null ? Math.max(0.22, h0(x, z)) : h0(x, z));
      seasonFx.restoreH = () => (c.height = h0);
    }
    // ☀️ Frostpine in summer: the snow melts into wildflower meadows
    if (c.id === "frostpine" && s === "summer") {
      for (let k = 0; k < 300; k++) {
        const x = (hash(k, 7) - 0.5) * 180;
        const z = (hash(k, 8) - 0.5) * 180;
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), new THREE.MeshBasicMaterial({ color: [0xff9ab8, 0xffe06a, 0xb88aff, 0xffffff][k % 4] }));
        f.position.set(x, c.height(x, z) + 0.15, z);
        add(f);
      }
    }
  }
  function citySeasonTick(dt) {
    for (const o of seasonFx.objs) {
      if (!o.userData.drift) continue;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 1.5;
        if (y < 0) y += 40;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(y * 0.3 + i) * dt * 0.6);
      }
      p.needsUpdate = true;
    }
  }
  // ================================================================ hooks
  function interactable() {
    const w = here();
    if (w === "forest") {
      castleBuild();
      castleDraw();
      if (castle && near(castle.sign.x, castle.sign.z, 2.6)) return { label: "build your castle 🏰", act: () => openCastle() };
      // 🏰 walk in through the Keep's front door
      if (castle && near(castle.x, castle.z + 4.3, 2.2)) {
        if (!S.castle.keep) return { label: "the Great Keep isn't built yet 🏰", act: () => ctx.say("🏰 Build the Great Keep first (at the Castle Hill sign) — then you can go inside!", true) };
        return { label: "go inside your castle 🏰", act: () => {
          ctx.goCity("castlehall");
          ctx.placePlayer(HALL.door.x, HALL.door.z - 2.5, Math.PI);
          ctx.say("🏰 Your Great Hall! Walk up the red carpet to your throne. (The feast table and the fireplace are yours too.)", true);
        } };
      }
    }
    if (w === "castlehall") {
      if (near(HALL.door.x, HALL.door.z - 1, 2.4)) return { label: "go back outside 🚪", act: () => {
        ctx.goOutside();
        if (castle) ctx.placePlayer(castle.x, castle.z + 6, 0);
      } };
      if (near(HALL.throne.x, HALL.throne.z + 1.4, 2.2)) return { label: "sit on your throne 👑", act: () => ctx.say(["👑 You settle onto your throne. The guards bang their spears: “LONG LIVE QUEEN THISTLE!”", "👑 Comfy. Very comfy. Sprig bows so low he falls over.", "👑 From up here you can see the whole Great Hall. It's all yours."][Math.floor(Math.random() * 3)], true) };
      if (near(HALL.feast.x + 0.6, HALL.feast.z, 2.6)) return { label: "help yourself to the royal feast 🍗", act: () => {
        if (S.feastDay === (S.days || 0)) return ctx.say("🍗 You're still full from today's feast! (Come back tomorrow.)", true);
        S.feastDay = S.days || 0;
        save();
        ctx.heal(100);
        ctx.chime();
        ctx.say("🍗 A royal feast! Roast roots, honey-cake, cheese and berry pie — your hearts are FULL.", true);
      } };
      if (near(-HALL.w + 2.4, HALL.fire.z, 2.6)) return { label: "warm your paws by the fire 🔥", act: () => {
        window.dispatchEvent(new Event("ww-warm"));
        ctx.say("🔥 Toasty warm, all the way to your whiskers.", true);
      } };
    }
    if (tent && tent.g.parent === groupHere() && near(tent.x, tent.z, 3)) return { label: "go into the circus tent 🎪", act: enterTent };
    const ci = circusInteract();
    if (ci) return ci;
    if (w === "silverveil" && ctx.city()) {
      if (near(0, -49, 4)) return { label: "look through the Moonkeepers' telescope 🔭", act: openTelescope };
    }
    return seaInteract() || dragonInteract() || caseInteract();
  }
  function update(dt, t) {
    if (here() === "forest") {
      castleBuild();
      castleDraw();
    }
    tentBuild();
    miniUpdate(dt);
    wireUpdate(dt);
    dragonUpdate(t);
    citySeason();
    citySeasonTick(dt);
    if (here() === "sea") seaBuild(ctx.city());
  }
  return { interactable, update };
}
