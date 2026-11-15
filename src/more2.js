// ------------------------------------------------------------
//  🌟  MORE TO DO, part four.
//
//   🏁 TIME TRIALS        a race course in every city (+ the forest) — beat
//                         your best, and race your own GHOST
//   🎣 FISHING TOURNEY    rare + legendary fish, weights, a record board
//   🧩 THE VAULT          two Moonkeeper puzzle rooms under the forest
//   🌱 YOUR GARDEN        six beds by your den that grow over the days
//   🎂 BIRTHDAYS          every townsmouse has one — gifts count triple!
//   📜 STORYBOOK (I)      the story of YOUR adventure, with your photos
//   🌙 NEW GAME+          start again, keeping your treasures (Y menu)
//   🐣 BABY ANIMALS       chicks, a lamb and bunnies to raise by your den
//   🎶 MUSIC + SOUNDS     a little tune for every place, and footsteps
//   🐕 DOG SLEDDING       Frostpine's kennel: a husky team pulls your sled
// ------------------------------------------------------------
import * as THREE from "three";
import { inflate, bought, cost } from "./economy.js";
import { smallBuilding } from "./buildings.js";
import { noGrassHere } from "./outside.js";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { signPost as readableSignPost } from "./signs.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard, registerKeepsake } from "./cityLife.js";
import { FOLK } from "./friends.js";
import { VAULT, PASS, AURORA } from "./questZones.js";

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
registerKeepsake("vaultcrown", "👑", "Moonkeepers' Puzzle Crown (from the Vault)");
registerKeepsake("trialcup", "🏆", "Time Trial Cup (beat every course's par)");
for (const n of ["Pike", "Silver Eel", "Golden Koi", "Moon Fish", "Ice Char"]) registerKeepsake("giant_" + n, "🐟", `Mounted Giant ${n}`);

const PLACES = ["forest", "everbough", "reedmere", "golden", "frostpine", "silverveil"];
const PLACE_NAME = { forest: "the Great Forest", everbough: "Everbough", reedmere: "Reedmere", golden: "Golden Hollow", frostpine: "Frostpine", silverveil: "Silverveil" };

export function initMore2(ctx) {
  const S = cityState();
  S.trials ||= {};
  S.fishRecords ||= {};
  S.garden ||= {};
  S.animals ||= [];
  S.storybook ||= [];
  S.stats ||= {};
  const save = () => saveCity();
  // a big HUD line (the race timer) + party confetti
  const hudEl = document.createElement("div");
  hudEl.style.cssText = "position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:40;padding:6px 16px;border-radius:12px;background:rgba(24,18,40,.78);color:#ffe9b0;font:bold 16px system-ui;pointer-events:none;display:none";
  document.body.appendChild(hudEl);
  ctx.hud = (t) => {
    hudEl.style.display = t ? "" : "none";
    if (t) hudEl.textContent = t;
  };
  ctx.confetti = () => {
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-20px;width:9px;height:14px;z-index:70;pointer-events:none;background:hsl(${Math.random() * 360},80%,60%);transform:rotate(${Math.random() * 360}deg);transition:top 2.4s ease-in, transform 2.4s`;
      document.body.appendChild(c);
      requestAnimationFrame(() => {
        c.style.top = "105vh";
        c.style.transform = `rotate(${Math.random() * 900}deg)`;
      });
      setTimeout(() => c.remove(), 2600);
    }
  };
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const day = () => S.days || 0;
  const groupHere = () => (ctx.world() === "city" && ctx.city() ? ctx.city().group : ctx.world() === "everbough" ? ctx.cityGroup : ctx.world() === "outside" ? ctx.outsideGroup : null);
  const H = () => (ctx.world() === "city" && ctx.city() ? ctx.city().height : ctx.world() === "everbough" ? ctx.cityHeight : ctx.terrainHeight);
  /** is (x, z) somewhere you can stand, here? */
  function free(x, z, r = 2) {
    const w = here();
    if (w === "forest") return !ctx.isWater(x, z) && ctx.isClear(x, z, r);
    if (w === "everbough") return Math.hypot(x, z) < 100 && !ctx.cityCols().some((k) => Math.hypot(x - k.x, z - k.z) < k.r + r);
    const c = ctx.city();
    return Math.hypot(x, z) < c.R * 0.8 && (!c.waterAt || c.waterAt(x, z) === null) && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + r);
  }
  function spotNear(x0, z0, r = 2) {
    for (let rr = 0; rr < 30; rr += 1.5) for (let a = 0; a < 6.3; a += 0.5) {
      const x = x0 + Math.cos(a) * rr;
      const z = z0 + Math.sin(a) * rr;
      if (free(x, z, r)) return { x, z };
    }
    return { x: x0, z: z0 };
  }
  // 🪧 a big, crisp, two-sided signpost (see signs.js)
  function signPost(text, style = "wood") {
    return readableSignPost(text, { w: 3.6, h: 0.9, height: 1.75, style });
  }

  // ======================================================================
  //  🏁 TIME TRIALS + GHOSTS
  // ======================================================================
  const courses = {}; // place → { start, gates[], group }
  let run = null; // { place, k, t0, path[] }
  let ghost = null; // the replay of your best run
  function course(place) {
    const g = groupHere();
    if (!g || here() !== place) return null;
    if (courses[place] && courses[place].group === g) return courses[place];
    const origin = place === "forest" ? ctx.school() || { x: 0, z: 0 } : { x: 0, z: 0 };
    const R0 = place === "forest" ? 30 : 42;
    const st = spotNear(origin.x + (place === "forest" ? 14 : 0), origin.z + (place === "forest" ? -14 : 30), 2);
    const gates = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.8;
      gates.push(spotNear(origin.x + Math.cos(a) * R0, origin.z + Math.sin(a) * R0, 2.5));
    }
    const objs = [];
    // 🏁 the Trial House: the race starts at its front door
    {
      const dx = st.x - origin.x, dz = st.z - origin.z;
      const dl = Math.hypot(dx, dz) || 1;
      const bx = st.x + (dx / dl) * 3.4, bz = st.z + (dz / dl) * 3.4;
      const house = smallBuilding({ label: "TIME TRIALS", wall: 0xe8d0a8, roof: 0x8a3a3a, style: "round", w: 4.4, h: 3.2 });
      house.position.set(bx, H()(bx, bz), bz);
      house.rotation.y = Math.atan2(-dx, -dz); // (front door facing the course)
      g.add(house);
      objs.push(house);
      if (ctx.world() === "city" && ctx.city()) ctx.city().colliders.push({ x: bx, z: bz, r: 2.2 });
      else if (ctx.world() === "outside") {
        ctx.addSolid(bx, bz, 2.2);
        noGrassHere(bx, bz, 3);
      }
    }
    const rings = gates.map((p, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
      ring.position.set(p.x, H()(p.x, p.z) + 2.2, p.z);
      ring.visible = false;
      g.add(ring);
      objs.push(ring);
      return ring;
    });
    // par: about 30 paces a second over the course
    let len = 0;
    let prev = st;
    for (const p of [...gates, st]) {
      len += Math.hypot(p.x - prev.x, p.z - prev.z);
      prev = p;
    }
    return (courses[place] = { start: st, gates, rings, group: g, par: Math.round(len / 13) });
  }
  function startTrial(place) {
    const C = courses[place];
    run = { place, k: 0, t0: performance.now(), path: [] };
    C.rings.forEach((r, i) => (r.visible = true));
    // the ghost of your best run, racing beside you
    const best = S.trials[place];
    if (best && best.path && best.path.length > 2) {
      if (!ghost) {
        ghost = buildThistle({ tunicColor: 0xbfe6ff, hoodColor: 0xbfe6ff, pack: false });
        ghost.traverse((o) => o.isMesh && (o.material = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.4 })));
      }
      C.group.add(ghost);
      ghost.visible = true;
    }
    ctx.say(`🏁 GO! Run through all 6 golden rings and back to the flag! ${best ? `Your best: ${best.time.toFixed(1)}s (race your 👻 ghost!)` : `Par: ${C.par}s`}`, true);
  }
  function trialUpdate() {
    if (!run) return;
    const C = courses[run.place];
    if (!C || here() !== run.place) {
      run = null;
      if (ghost) ghost.visible = false;
      return;
    }
    const t = (performance.now() - run.t0) / 1000;
    const p = me();
    if (run.path.length < 4000 && (!run.path.length || t - run.path[run.path.length - 1][0] > 0.1)) run.path.push([t, p.x, p.y, p.z]);
    const next = run.k < C.gates.length ? C.gates[run.k] : C.start;
    C.rings.forEach((r, i) => {
      r.material.color.setHex(i === run.k ? 0xffd84a : i < run.k ? 0x6ad86a : 0x8a7a4a);
      r.rotation.y += 0.03;
    });
    ctx.hud(`🏁 ${t.toFixed(1)}s · ring ${Math.min(run.k + 1, 6)}/6${run.k >= 6 ? " → back to the FLAG!" : ""}`);
    if (Math.hypot(p.x - next.x, p.z - next.z) < 3) {
      run.k++;
      ctx.chime();
      if (run.k > C.gates.length) return finishTrial(t);
    }
    // the ghost replays your best run
    const best = S.trials[run.place];
    if (ghost && ghost.visible && best && best.path) {
      const bp = best.path;
      let i = bp.findIndex((q) => q[0] >= t);
      if (i < 0) i = bp.length - 1;
      const q = bp[i];
      ghost.position.set(q[1], q[2], q[3]);
      if (i > 0) ghost.rotation.y = Math.atan2(q[1] - bp[i - 1][1], q[3] - bp[i - 1][3]);
    }
  }
  function finishTrial(t) {
    const C = courses[run.place];
    const best = S.trials[run.place];
    C.rings.forEach((r) => (r.visible = false));
    if (ghost) ghost.visible = false;
    let msg = `🏁 FINISHED in ${t.toFixed(1)}s!`;
    if (!best || t < best.time) {
      // (only keep a short path so saves stay small)
      const path = run.path.filter((_, i) => i % 3 === 0).map((q) => q.map((v) => Math.round(v * 10) / 10));
      S.trials[run.place] = { time: t, path };
      msg += best ? ` 🎉 NEW RECORD (was ${best.time.toFixed(1)}s)! +🪙 15` : " That's your first record! +🪙 15";
      S.coins += 15;
    } else msg += ` Your record is ${best.time.toFixed(1)}s — try again!`;
    if (t <= C.par) msg += ` ⭐ Under par (${C.par}s)!`;
    (S.trialPar ||= {})[run.place] ||= t <= C.par;
    if (PLACES.every((p) => (S.trialPar || {})[p]) && !(S.owned || {}).trialcup) {
      (S.owned ||= {}).trialcup = true;
      msg += " 🏆 You beat par on EVERY course — the Time Trial Cup is yours!";
    }
    save();
    run = null;
    ctx.hud(null);
    ctx.say(msg, true);
  }

  // ======================================================================
  //  🎣 THE FISHING TOURNAMENT — every fish has a weight; giants are rare
  // ======================================================================
  const NPC_RECORD = { Minnow: 0.4, "Lagoon Perch": 1.6, "Rainbow Trout": 2.4, "Silver Eel": 3.2, Pike: 5.5, "Ice Char": 3, "Golden Koi": 4, "Moon Fish": 6 };
  window.addEventListener("ww-fish-kind", (e) => {
    const name = e.detail.name;
    const base = NPC_RECORD[name] || 1;
    // giants: rarer, bigger — at night or in the rain the big ones bite
    const lucky = (ctx.night() ? 0.06 : 0.02) + (ctx.rain() ? 0.04 : 0);
    const giant = Math.random() < lucky && ["Pike", "Silver Eel", "Golden Koi", "Moon Fish", "Ice Char"].includes(name);
    const w = Math.round(base * (giant ? 2.2 + Math.random() : 0.4 + Math.random() * 0.8) * 100) / 100;
    const rec = S.fishRecords[name];
    let msg = `⚖️ It weighs ${w} kg!`;
    if (!rec || w > rec) {
      S.fishRecords[name] = w;
      msg += " Your heaviest yet!";
      if (w > base && !(S.fishBeat || {})[name]) {
        (S.fishBeat ||= {})[name] = true;
        S.coins += 25;
        msg += ` 🏆 It beats the TOURNAMENT RECORD (${base} kg)! +🪙 25`;
      }
    }
    if (giant) {
      (S.owned ||= {})["giant_" + name] = true;
      msg = `🐟🐟 A GIANT ${name.toUpperCase()}! ${msg} (It's mounted for your wall!)`;
    }
    save();
    setTimeout(() => ctx.say(msg, true), 2400);
  });
  let board = null;
  function boardBuild(c) {
    if (board && board.c === c) return;
    const at = spotNear(c.props.fishSpot ? c.props.fishSpot.x - 6 : 10, c.props.fishSpot ? c.props.fishSpot.z + 4 : 50, 1.5);
    const g = signPost("🎣 TOURNAMENT");
    g.position.set(at.x, c.height(at.x, at.z), at.z);
    c.group.add(g);
    board = { c, ...at };
  }
  function openBoard() {
    const rows = Object.entries(NPC_RECORD).map(([n, rec]) => {
      const mine = S.fishRecords[n];
      return `<div class="item"><span class="ic">🐟</span><span class="nm">${n}<small>tournament record ${rec} kg · yours: ${mine ? mine + " kg" : "—"}</small></span><span>${mine && mine > rec ? "🏆" : ""}</span></div>`;
    }).join("");
    openCard(`<div class="card" style="max-height:84vh;overflow:auto"><h3>🎣 The Fishing Tournament</h3><div class="coins">Beat a record for 🪙 25 · giants bite at NIGHT and in the RAIN</div>${rows}<div class="close">Esc — close</div></div>`);
  }

  // ======================================================================
  //  🧩 THE VAULT — a stone door in the forest, two puzzle rooms below
  // ======================================================================
  let vaultDoor = null;
  function vaultDoorBuild() {
    if (vaultDoor || !ctx.ready()) return;
    const s0 = ctx.school();
    const at = spotNear(s0.x - 22, s0.z + 18, 2.5);
    const g = new THREE.Group();
    g.position.set(at.x, ctx.terrainHeight(at.x, at.z), at.z);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), M(0x7a7a84));
    rock.scale.y = 0.9;
    rock.position.y = 1.6;
    const door = new THREE.Mesh(new THREE.CircleGeometry(1.1, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 1.1, 2.3);
    const rune = glow(0xbfa0ff, 1.8);
    rune.position.set(0, 2.7, 2.3);
    g.add(rock, door, rune);
    ctx.outsideGroup.add(g);
    ctx.addSolid(at.x, at.z, 2.2);
    vaultDoor = { x: at.x, z: at.z + 3.4 };
  }
  const V = () => (S.vault ||= { plates: null, crystals: null, room1: false, done: false });
  function vaultInit() {
    const v = V();
    if (!v.plates) {
      // start all lit, then step on random plates (so it's always solvable)
      const p = Array(9).fill(1);
      for (let k = 0; k < 5; k++) press(p, Math.floor(Math.random() * 9));
      if (p.every((x) => x)) press(p, 4);
      v.plates = p;
    }
    if (!v.crystals) v.crystals = [6, 1, 7]; // (all three start pointing the wrong way)
    save();
  }
  function press(p, i) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < 3 && cc >= 0 && cc < 3) p[rr * 3 + cc] ^= 1;
    }
  }
  const crystalTarget = (i) => {
    const pts = [VAULT.crystals[0], VAULT.crystals[1], VAULT.crystals[2], VAULT.door];
    const a = Math.atan2(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
    return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  };
  let onPlate = -1;
  function vaultUpdate() {
    const Z = ctx.world() === "city" && ctx.city() && ctx.city().id === "vault" ? ctx.city() : null;
    if (!Z) return;
    vaultInit();
    const v = V();
    // the star floor
    Z.plates.forEach((pl, i) => (pl.m.material.emissiveIntensity = v.plates[i] ? 0.9 : 0));
    const p = me();
    const now = Z.plates.findIndex((pl) => Math.abs(p.x - pl.x) < 1.4 && Math.abs(p.z - pl.z) < 1.4);
    if (now !== onPlate && now >= 0 && !v.room1) {
      press(v.plates, now);
      ctx.chime();
      if (v.plates.every((x) => x)) {
        v.room1 = true;
        ctx.say("🧩 All nine stars blaze — and the great gate to the north grinds open!", true);
      }
      save();
    }
    onPlate = now;
    if (v.room1 && !Z.archGate.open) {
      Z.archGate.open = true;
      Z.gateMesh.visible = false;
      for (const c of Z.gateCols) c.r = 0;
    }
    // the crystal chain
    let ok = true;
    let from = VAULT.lamp;
    const pts = [...VAULT.crystals, VAULT.door];
    Z.beams.forEach((b, i) => {
      if (!ok) return (b.visible = false);
      const to = pts[i];
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const len = Math.hypot(dx, dz);
      b.visible = true;
      b.scale.y = len;
      b.position.set((from.x + to.x) / 2, 1.8, (from.z + to.z) / 2);
      b.rotation.set(Math.PI / 2, 0, 0);
      b.rotation.z = 0;
      b.lookAt(to.x, 1.8, to.z);
      b.rotateX(Math.PI / 2);
      if (i < 3) ok = v.crystals[i] === crystalTarget(i);
      from = to;
    });
    Z.crystals.forEach((cr, i) => {
      cr.turn.rotation.y = v.crystals[i] * (Math.PI / 4);
      cr.gem.material.color.setHex(v.crystals[i] === crystalTarget(i) ? 0xfff0a0 : 0x9fd8ff);
    });
    if (ok && !v.done) {
      v.done = true;
      (S.owned ||= {}).vaultcrown = true;
      S.coins += 80;
      save();
      Z.doorMesh.rotation.y = Math.PI / 2;
      playCutscene([
        { dur: 4, from: [6, 5, -18], look: [0, 3, -30], text: "The beam leaps from crystal to crystal — and strikes the moon on the vault door. Slowly, it rolls aside…" },
        { dur: 4, from: [2, 3, -24], look: [0, 1.5, -32], text: "Inside: the Moonkeepers' Puzzle Crown, glittering on a cushion of moss, and a heap of old coins. +🪙 80" },
        { dur: 0.4, gameCam: true },
      ]);
    }
  }
  function vaultInteract() {
    if (here() === "forest" && vaultDoor && near(vaultDoor.x, vaultDoor.z, 2.6)) return { label: "climb down into the Moonkeepers' Vault 🧩", act: () => fadeThrough(() => ctx.goCity("vault"), 0.6) };
    const Z = here() === "vault" ? ctx.city() : null;
    if (!Z) return null;
    if (near(VAULT.arrive.x, VAULT.arrive.z, 3)) return { label: "climb back up to the forest", act: () => fadeThrough(() => {
      ctx.goOutside();
      ctx.placePlayer(vaultDoor.x, vaultDoor.z + 1.5, 0);
    }, 0.6) };
    const v = V();
    for (let i = 0; i < Z.crystals.length; i++) {
      const cr = Z.crystals[i];
      if (!near(cr.x, cr.z, 2.4)) continue;
      return { label: "turn the crystal 💎", act: () => {
        v.crystals[i] = (v.crystals[i] + 1) % 8;
        save();
        ctx.chime();
      } };
    }
    return null;
  }

  // ======================================================================
  //  🌱 YOUR GARDEN — six beds by your den
  // ======================================================================
  const SEEDS = [
    { item: "Flower Petals", name: "Wildflowers", icon: "🌼", days: 2, gives: ["Flower Petals", 4], color: 0xff9ab8 },
    { item: "Clover Seeds", name: "Clover", icon: "☘️", days: 1, gives: ["Clover Seeds", 3], color: 0x6ad86a },
    { item: "Berry Seeds", name: "Berry Bush", icon: "🫐", days: 3, gives: ["Berries", 6], color: 0x6a6ad8 },
    { item: "Acorn Caps", name: "Oak Sapling", icon: "🌳", days: 5, gives: null, color: 0x4a8a3a },
  ];
  const beds = [];
  function gardenBuild() {
    if (beds.length || !ctx.ready()) return;
    const D = ctx.den;
    for (let i = 0; i < 6; i++) {
      const p = spotNear(D.x - 7 + (i % 3) * 3.2, D.z - 7 - Math.floor(i / 3) * 3.2, 1.2);
      const y = ctx.terrainHeight(p.x, p.z);
      const soil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), M(0x5a3e24));
      soil.position.set(p.x, y + 0.1, p.z);
      const plant = new THREE.Group();
      plant.position.set(p.x, y + 0.25, p.z);
      ctx.outsideGroup.add(soil, plant);
      beds.push({ ...p, plant, stage: -1 });
    }
  }
  function drawBed(i) {
    const b = beds[i];
    const st = S.garden[i];
    const sd = st && SEEDS.find((x) => x.name === st.name);
    const g = !st ? -1 : Math.min(3, Math.floor(((day() - st.day) / sd.days) * 3));
    if (g === b.stage) return;
    b.stage = g;
    b.plant.clear();
    if (!st) return;
    if (sd.name === "Oak Sapling") {
      const h = [0.6, 1.4, 2.6, 4.2][g];
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 + g * 0.06, 0.12 + g * 0.08, h, 6), M(0x6a4a2c));
      trunk.position.y = h / 2;
      const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + g * 0.45, 0), M(sd.color));
      top.position.y = h;
      b.plant.add(trunk, top);
      return;
    }
    for (let k = 0; k < 5; k++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2 + g * 0.25, 4), M(0x3a8a3a));
      const x = (hash(k, i) - 0.5) * 1.6;
      const z = (hash(k + 4, i) - 0.5) * 1.6;
      stem.position.set(x, 0.1 + g * 0.12, z);
      b.plant.add(stem);
      if (g >= 2) {
        const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + g * 0.04, 0), M(sd.color));
        bloom.position.set(x, 0.25 + g * 0.25, z);
        b.plant.add(bloom);
      }
    }
  }
  function gardenInteract() {
    if (here() !== "forest") return null;
    for (let i = 0; i < beds.length; i++) {
      const b = beds[i];
      if (!near(b.x, b.z, 1.8)) continue;
      const st = S.garden[i];
      if (!st) return { label: "plant something in your garden bed 🌱", act: () => {
        openCard(`<div class="card"><h3>🌱 What will you plant?</h3><div class="coins">Plants grow a little every day</div>
          ${SEEDS.map((sd, k) => `<div class="item"><span class="ic">${sd.icon}</span><span class="nm">${sd.name}<small>uses 1 ${sd.item} (you have ${ctx.packCount(sd.item)}) · ready in ${sd.days} day${sd.days === 1 ? "" : "s"}${sd.gives ? "" : " · a tree that stays forever!"}</small></span><button data-k="${k}" ${ctx.packCount(sd.item) < 1 ? "disabled" : ""}>plant</button></div>`).join("")}
          <div class="close">Esc — not now</div></div>`, (el) => el.querySelectorAll("button[data-k]").forEach((x) => (x.onclick = () => {
          const sd = SEEDS[+x.dataset.k];
          ctx.packTake(sd.item, 1);
          S.garden[i] = { name: sd.name, day: day() };
          save();
          closeCard();
          ctx.chime();
          ctx.say(`${sd.icon} Planted! Come back in ${sd.days} day${sd.days === 1 ? "" : "s"}.`);
        })));
      } };
      const sd = SEEDS.find((x) => x.name === st.name);
      const ripe = day() - st.day >= sd.days;
      if (!ripe) return { label: `${sd.icon} ${sd.name} — growing (${day() - st.day}/${sd.days} days)`, act: () => {} };
      if (!sd.gives) return { label: `${sd.icon} your oak tree — all grown up!`, act: () => ctx.say("🌳 Your very own oak tree, grown from a single acorn cap. Squirrels approve.") };
      return { label: `harvest the ${sd.name} ${sd.icon}`, act: () => {
        ctx.addToPack(sd.gives[0], sd.gives[1]);
        delete S.garden[i];
        save();
        ctx.chime();
        ctx.say(`${sd.icon} +${sd.gives[1]} ${sd.gives[0]} from your garden!`);
      } };
    }
    return null;
  }

  // ======================================================================
  //  🎂 BIRTHDAYS — a 20-day year; every townsmouse has a birthday in it
  // ======================================================================
  const FOLKS = Object.keys(FOLK);
  // (a DIFFERENT townsmouse's birthday every single day, round and round)
  const todaysBirthdays = () => [FOLKS[day() % FOLKS.length]];
  window.addEventListener("ww-gift", (e) => {
    const name = e.detail.name;
    if (!todaysBirthdays().includes(name)) return;
    const f = (S.friends ||= {})[name];
    if (f) f.hearts = Math.min(5, f.hearts + 2);
    S.coins += 10;
    save();
    setTimeout(() => {
      ctx.confetti();
      ctx.say(`🎂 It's ${name}'s BIRTHDAY — they're SO happy you remembered! (+2 extra ❤️, and a slice of cake: +🪙 10)`, true);
    }, 2600);
  });
  const bdayEl = document.createElement("div");
  bdayEl.style.cssText = "position:fixed;right:180px;top:18px;max-width:300px;z-index:41;padding:6px 14px;border-radius:14px;background:rgba(200,80,140,.85);color:#fff;font:bold 13px system-ui;display:none;pointer-events:none";
  document.body.appendChild(bdayEl);

  // ======================================================================
  //  📜 THE STORYBOOK (I) — your adventure, written as you play
  // ======================================================================
  function write(text, thumb) {
    S.storybook.push({ day: day(), text, thumb: thumb || null });
    // (keep the newest 12 pictures, so the save stays small)
    let pics = 0;
    for (let i = S.storybook.length - 1; i >= 0; i--) if (S.storybook[i].thumb && ++pics > 12) S.storybook[i].thumb = null;
    save();
  }
  const PHASE_LINES = {
    2: "Thistle left the Fallen Log School and set out alone into the Great Forest.",
    5: "Deep in Moonstone Hollow, Thistle read the old journal on the reading rock — and the Moonkeepers' secret began.",
    8: "Thistle climbed to Everbough, the City of Knowledge, high in the great trees.",
    9: "The Moonkeepers' roads opened, and Thistle travelled to Reedmere, Golden Hollow and Frostpine.",
    10: "Thistle became a MOONKEEPER, wearing a cloak the color of moonlit water.",
    11: "Thistle began to mend the old friendship between all the Great Cities.",
    12: "The Alliance lived again — and Thistle's life after the story began.",
    13: "Far beneath Roothaven, Thistle faced the Shadow Under the Roots… and found it was only afraid of the dark.",
    14: "Thistle followed the stars to Silverveil, the lost sixth city, where Renata herself said thank you.",
  };
  let snap = null;
  function storyWatch() {
    const st = ctx.story();
    const now = {
      phase: st.phase || 1,
      quests: S.stats.quests || 0,
      legends: Object.keys(S.legends || {}).join(","),
      badges: Object.keys(S.badges || {}).length,
      village: ((S.village || {}).settlers || []).length,
      pets: (S.pets || []).length,
      p14: !!(st.p14 && st.p14.done),
    };
    if (!snap) {
      snap = now;
      if (!S.storybook.length) write("Once upon a time, a small mouse named Thistle Mosswhisker lived in a cozy den under a grassy hill…");
      return;
    }
    if (now.phase > snap.phase) for (let p = snap.phase + 1; p <= now.phase; p++) if (PHASE_LINES[p]) write(PHASE_LINES[p]);
    if (now.quests > snap.quests) write(`Thistle finished another daring quest — that makes ${now.quests}!`);
    if (now.legends !== snap.legends && now.legends) write(`Thistle befriended a legendary creature: ${now.legends.split(",").pop().replace("stag", "the Moon Stag").replace("turtle", "the Lantern Turtle").replace("whale", "the Cloud-Whale")}.`);
    if (now.village > snap.village) write(`A new neighbour moved into ${(S.village || {}).name || "Thistle's village"}.`);
    if (now.pets > snap.pets) write(`Thistle adopted a new pet, who never left her side.`);
    if (now.p14 && !snap.p14) write("And the moon shone over all six cities, whole again. The End… or maybe just the beginning.");
    snap = now;
  }
  window.addEventListener("ww-photo", (e) => {
    const where = here();
    write(`A picture Thistle took in ${PLACE_NAME[where] || where}.`, e.detail && e.detail.thumb);
  });
  function openStorybook() {
    const pages = S.storybook.map((e) => `<div style="margin:10px 0;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.5)">
      <div style="font:12px system-ui;color:#8a6a44">Day ${e.day + 1}</div>
      ${e.thumb ? `<img src="${e.thumb}" style="width:100%;max-width:320px;border-radius:8px;margin:6px 0;border:6px solid #fbf8f0;box-shadow:0 2px 8px rgba(0,0,0,.3)">` : ""}
      <div style="font:16px Georgia;line-height:1.45">${e.text}</div></div>`).join("");
    openCard(`<div class="card" style="width:min(560px,92vw);max-height:86vh;overflow:auto;background:#f4e8cc"><h3 style="font:bold 24px Georgia">📜 The Tale of Thistle Mosswhisker</h3>
      <div class="coins">written as you play · your photos (P) go in too</div>${pages}<div class="close">I or Esc — close the book</div></div>`);
  }

  // ======================================================================
  //  🌙 NEW GAME+ — start the story over, keeping your treasures
  // ======================================================================
  function newGamePlus() {
    if (!confirm("🌙 NEW GAME+\n\nStart the whole story again from the Fallen Log School?\n\nYou KEEP: coins, clothes, pets, houses, keepsakes, titles and your village.\nThe story, quests and your backpack start fresh — with harder challenges and a secret new ending!")) return;
    S.ngPlus = (S.ngPlus || 0) + 1;
    S.quests = {};
    S.questVolume = 1;
    S.shards = {};
    save();
    try {
      localStorage.removeItem("ww.story.v1");
      localStorage.removeItem("ww.save.v1");
    } catch {}
    location.href = location.pathname;
  }
  window.__wwNGPlus = () => S.ngPlus || 0;
  window.__wwStartNGPlus = newGamePlus;

  // ======================================================================
  //  🐣 BABY ANIMALS — the nursery pen by your den
  // ======================================================================
  const KINDS = {
    chick: { icon: "🐣", grown: "🐔", name: "Chick", price: 8, color: 0xffe06a, adult: 0xf4f0e8, gives: ["Eggs", 1] },
    lamb: { icon: "🐑", grown: "🐑", name: "Lamb", price: 25, color: 0xf4f0e8, adult: 0xe8e4dc, gives: ["String", 2] },
    bunny: { icon: "🐰", grown: "🐇", name: "Bunny", price: 20, color: 0xc8a888, adult: 0xa88868, gives: ["Soft Cloth Fibers", 2] },
  };
  let pen = null;
  const critters = [];
  function penBuild() {
    if (pen || !ctx.ready()) return;
    const D = ctx.den;
    const c = spotNear(D.x + 10, D.z - 8, 5);
    // 🐣 the Nursery Barn: a big red barn, open at the front, facing your cottage
    const face = Math.atan2(D.x - c.x, D.z - c.z);
    const barn = smallBuilding({ label: "ANIMAL NURSERY", roof: 0xb8402e, style: "barn", w: 8.5, d: 7, h: 3.4 });
    barn.position.set(c.x, ctx.terrainHeight(c.x, c.z), c.z);
    barn.rotation.y = face;
    ctx.outsideGroup.add(barn);
    // (its walls are solid: back and both sides)
    const fx = Math.sin(face), fz = Math.cos(face);
    const rx = Math.cos(face), rz = -Math.sin(face);
    for (let k = -3; k <= 3; k++) ctx.addSolid(c.x - fx * 3.5 + rx * k * 1.2, c.z - fz * 3.5 + rz * k * 1.2, 0.7);
    for (const side of [-1, 1]) for (let k = -2; k <= 2; k++) ctx.addSolid(c.x + rx * side * 4.25 + fx * k * 1.3, c.z + rz * side * 4.25 + fz * k * 1.3, 0.7);
    noGrassHere(c.x, c.z, 5.2); // (a clean barn floor — no grass growing up through the straw)
    const gx = c.x + fx * 4.4;
    const gz = c.z + fz * 4.4;
    pen = { ...c, gate: { x: gx, z: gz } };
  }
  const ageOf = (a) => Math.min(2, Math.floor((a.fed || 0) / 2)); // 0 baby · 1 young · 2 grown
  function critterMesh(a) {
    const K = KINDS[a.kind];
    const g = new THREE.Group();
    const age = ageOf(a);
    const sc = [0.45, 0.7, 1][age];
    const col = age === 2 ? K.adult : K.color;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), M(col));
    body.scale.set(1, 0.85, a.kind === "lamb" ? 1.3 : 1.1);
    body.position.y = 0.4;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M(col));
    head.position.set(0, 0.7, 0.42);
    g.add(body, head);
    if (a.kind === "bunny") for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 3, 6), M(col));
      ear.position.set(sx * 0.1, 1.05, 0.38);
      g.add(ear);
    }
    if (a.kind === "chick") {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), M(0xf0a030));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.68, 0.7);
      g.add(beak);
      if (age === 2) {
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.2), M(0xd83a3a));
        comb.position.set(0, 0.95, 0.4);
        g.add(comb);
      }
    }
    g.scale.setScalar(sc);
    return g;
  }
  function penUpdate(t) {
    if (!pen || here() !== "forest") return;
    S.animals.forEach((a, i) => {
      let c = critters[i];
      if (!c || c.age !== ageOf(a)) {
        if (c) c.g.parent && c.g.parent.remove(c.g);
        c = critters[i] = { g: critterMesh(a), age: ageOf(a) };
        ctx.outsideGroup.add(c.g);
      }
      const ang = t * 0.3 + i * 1.7;
      const r = 1.2 + (i % 3) * 0.8;
      const x = pen.x + Math.cos(ang) * r;
      const z = pen.z + Math.sin(ang) * r;
      c.g.position.set(x, ctx.terrainHeight(x, z) + Math.abs(Math.sin(t * 5 + i)) * 0.06, z);
      c.g.rotation.y = ang + Math.PI;
    });
  }
  function openNursery(msg = "") {
    const list = S.animals.map((a, i) => {
      const K = KINDS[a.kind];
      const age = ageOf(a);
      const fedToday = a.lastFed === day();
      return `<div class="item"><span class="ic">${age === 2 ? K.grown : K.icon}</span><span class="nm">${a.name}<small>${["baby", "growing up", "all grown up!"][age]} · ${age === 2 ? `gives ${K.gives[1]} ${K.gives[0]} when fed` : `fed ${a.fed || 0}/4 days to grow up`}</small></span><button data-feed="${i}" ${fedToday ? "disabled" : ""}>${fedToday ? "fed today ✓" : "feed 🌾"}</button></div>`;
    }).join("");
    openCard(`<div class="card" style="max-height:84vh;overflow:auto"><h3>🐣 Your Nursery</h3><div class="coins">🪙 ${S.coins} · feed each baby once a day (1 Oat Grain) and watch it grow</div>
      ${list || `<div class="empty">No babies yet!</div>`}
      <h4>Adopt a baby</h4>
      ${(inflate(Object.values(KINDS), (K) => K.name), Object.entries(KINDS)).map(([k, K]) => `<div class="item"><span class="ic">${K.icon}</span><span class="nm">${K.name}<small>grows up to give ${K.gives[0].toLowerCase()}</small></span><button data-buy="${k}" ${S.coins < K.price || S.animals.length >= 6 ? "disabled" : ""}>🪙 ${K.price}</button></div>`).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — close · up to 6 animals</div></div>`, (el) => {
      el.querySelectorAll("button[data-buy]").forEach((b) => (b.onclick = () => {
        const K = KINDS[b.dataset.buy];
        S.coins -= K.price;
        bought(K.name);
        const names = { chick: ["Pip", "Peep", "Nugget", "Sunny"], lamb: ["Woolly", "Clover", "Puff"], bunny: ["Thumper", "Hazel", "Mochi", "Button"] }[b.dataset.buy];
        S.animals.push({ kind: b.dataset.buy, name: names[S.animals.length % names.length] + " the " + K.name, fed: 0, lastFed: -1 });
        save();
        ctx.chime();
        openNursery(`${K.icon} Welcome to the family!`);
      }));
      el.querySelectorAll("button[data-feed]").forEach((b) => (b.onclick = () => {
        const a = S.animals[+b.dataset.feed];
        if (ctx.packCount("Oat Grain") < 1) return openNursery("🌾 You need Oat Grain to feed them (gather it in the forest, or buy it in Golden Hollow).");
        ctx.packTake("Oat Grain", 1);
        const wasAge = ageOf(a);
        a.fed = (a.fed || 0) + 1;
        a.lastFed = day();
        let m = `🌾 ${a.name} munches happily!`;
        const K = KINDS[a.kind];
        if (wasAge === 2) {
          ctx.addToPack(K.gives[0], K.gives[1]);
          m += ` They give you ${K.gives[1]} ${K.gives[0]}!`;
        } else if (ageOf(a) > wasAge) m += ageOf(a) === 2 ? ` ${K.grown} ${a.name} is ALL GROWN UP!` : " They're growing so fast!";
        save();
        ctx.chime();
        openNursery(m);
      }));
    });
  }

  // ======================================================================
  //  🎶 MUSIC + SOUNDS — a gentle tune for every place, and footsteps
  // ======================================================================
  let AC = null;
  let master = null;
  const ac = () => {
    if (!AC) {
      try {
        AC = new AudioContext();
        master = AC.createGain();
        master.gain.value = 0.05;
        master.connect(AC.destination);
      } catch {}
    }
    return AC;
  };
  window.addEventListener("pointerdown", () => ac() && AC.state === "suspended" && AC.resume(), { once: false });
  window.addEventListener("keydown", () => ac() && AC.state === "suspended" && AC.resume());
  // each place: [root Hz, scale steps, tempo seconds per note, wave]
  const TUNES = {
    forest: [262, [0, 2, 4, 7, 9], 0.55, "triangle"], everbough: [294, [0, 2, 4, 5, 7, 9], 0.5, "triangle"],
    reedmere: [247, [0, 3, 5, 7, 10], 0.6, "sine"], golden: [330, [0, 2, 4, 7, 9], 0.42, "triangle"],
    frostpine: [220, [0, 2, 3, 7, 8], 0.7, "sine"], silverveil: [196, [0, 4, 7, 11, 14], 0.8, "sine"],
    roothaven: [175, [0, 3, 5, 7, 10], 0.6, "triangle"], underglow: [165, [0, 1, 5, 7, 8], 0.9, "sine"],
    cloud: [349, [0, 2, 4, 7, 9, 12], 0.45, "sine"], deep: [147, [0, 3, 7, 10], 1, "sine"],
  };
  let nextNote = 0;
  let step = 0;
  function musicTick() {
    if (!AC || AC.state !== "running" || ctx.muted()) return;
    const T = TUNES[here()] || TUNES.forest;
    const [root, scale, tempo0, wave] = T;
    const tempo = tempo0 * (ctx.night() ? 1.4 : 1);
    const now = AC.currentTime;
    if (nextNote < now) nextNote = now + 0.1;
    while (nextNote < now + 0.3) {
      // a little wandering melody, with a soft low note every bar
      const deg = scale[Math.floor((Math.sin(step * 1.7) * 0.5 + 0.5) * scale.length) % scale.length];
      const f = root * Math.pow(2, deg / 12) * (ctx.night() ? 0.5 : 1);
      if (step % 7 !== 3) note(f, nextNote, tempo * 0.9, wave, 0.6);
      if (step % 4 === 0) note(root / 2, nextNote, tempo * 3.5, "sine", 0.5);
      nextNote += tempo;
      step++;
    }
  }
  function note(f, t, dur, wave, vol) {
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = wave;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  let stepT = 0;
  let wasSwim = false;
  function sfx(kind) {
    if (!AC || AC.state !== "running" || ctx.muted()) return;
    const t = AC.currentTime;
    const n = AC.createBufferSource();
    const len = kind === "splash" ? 0.5 : 0.07;
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * len), AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === "splash" ? 2 : 4);
    n.buffer = buf;
    const flt = AC.createBiquadFilter();
    flt.type = kind === "splash" ? "highpass" : "lowpass";
    flt.frequency.value = kind === "splash" ? 900 : ctx.world() === "city" && here() === "frostpine" ? 2600 : 900;
    const g = AC.createGain();
    g.gain.value = kind === "splash" ? 0.5 : 0.35;
    n.connect(flt).connect(g).connect(master);
    n.start(t);
  }
  function soundUpdate(dt) {
    if (!AC) return; // (sound starts after your first key or click)
    musicTick();
    const sw = ctx.swimming();
    if (sw && !wasSwim) sfx("splash");
    wasSwim = sw;
    if (ctx.walking() && !sw) {
      stepT -= dt;
      if (stepT <= 0) {
        stepT = 0.3;
        sfx("step");
      }
    }
  }

  // ======================================================================
  //  🐕 DOG SLEDDING — Frostpine's kennel
  // ======================================================================
  let kennel = null;
  let dogs = null;
  let sledding = false;
  function kennelBuild(c) {
    if (kennel && kennel.c === c) return;
    const w = c.spots.waystone;
    const at = spotNear(w.x - 12, w.z + 4, 2.5);
    const g = new THREE.Group();
    g.position.set(at.x, c.height(at.x, at.z), at.z);
    const hut = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.4), M(0x8a5a3a));
    hut.position.y = 1;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), M(0xf4f8ff));
    roof.position.y = 2.6;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 0.6, 1.21);
    const sign = signPost("🐕 DOG SLEDS", "ice");
    sign.position.set(2.4, 0, 1.6);
    g.add(hut, roof, door, sign);
    g.rotation.y = Math.atan2(-at.x, -at.z);
    c.group.add(g);
    c.colliders.push({ x: at.x, z: at.z, r: 2 });
    kennel = { c, x: at.x + Math.sin(g.rotation.y) * 3, z: at.z + Math.cos(g.rotation.y) * 3 };
    // 🏔️ the STARLIGHT PASS TRAIL: a packed-snow sled track with lantern posts,
    // from the kennel out to the trailhead arch at the edge of town
    const ang = Math.atan2(kennel.z, kennel.x);
    let th = null;
    for (let r = c.R * 0.8; r > 40 && !th; r -= 3) {
      for (const da of [0, 0.15, -0.15, 0.3, -0.3]) {
        const x = Math.cos(ang + da) * r;
        const z = Math.sin(ang + da) * r;
        if (!c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 3)) {
          th = { x, z };
          break;
        }
      }
    }
    th ||= { x: Math.cos(ang) * 90, z: Math.sin(ang) * 90 };
    const len = Math.hypot(th.x - kennel.x, th.z - kennel.z) || 1;
    const steps = Math.max(2, Math.floor(len / 3));
    const nx = -(th.z - kennel.z) / len;
    const nz = (th.x - kennel.x) / len;
    for (let i = 0; i <= steps; i++) {
      const t0 = i / steps;
      const x = kennel.x + (th.x - kennel.x) * t0;
      const z = kennel.z + (th.z - kennel.z) * t0;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshStandardMaterial({ color: 0xc8d8ec, roughness: 0.6 }));
      strip.rotation.x = -Math.PI / 2;
      strip.rotation.z = -Math.atan2(th.z - kennel.z, th.x - kennel.x) + Math.PI / 2;
      strip.position.set(x, c.height(x, z) + 0.04, z);
      c.group.add(strip);
      if (i % 3 === 1) {
        for (const side of [-1, 1]) {
          const px = x + nx * 1.9 * side;
          const pz = z + nz * 1.9 * side;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 5), M(0x5a3e24));
          post.position.set(px, c.height(px, pz) + 0.65, pz);
          const lamp = glow(0xffd890, 1.1);
          lamp.position.set(px, c.height(px, pz) + 1.4, pz);
          c.group.add(post, lamp);
        }
      }
    }
    // 🏔️ THE PASS itself: two towering snowy cliff walls, and the trail runs
    // straight between them into a narrow canyon climbing up the mountain
    const canyon = new THREE.Group();
    canyon.position.set(th.x, c.height(th.x, th.z), th.z);
    canyon.rotation.y = Math.atan2(th.x - kennel.x, th.z - kennel.z); // (+z = up the pass)
    const rockM = M(0x8a90a8);
    const snowM = M(0xf4f8ff);
    for (const side of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const h = 14 + k * 4 + (k % 2) * 3;
        const wall = new THREE.Mesh(new THREE.ConeGeometry(6 + k * 0.8, h, 6), rockM);
        wall.position.set(side * (6.5 + k * 0.4), h / 2 - 1, k * 6);
        const cap = new THREE.Mesh(new THREE.ConeGeometry((6 + k * 0.8) * 0.45, h * 0.4, 6), snowM);
        cap.position.set(wall.position.x, h - 1 - h * 0.2, wall.position.z);
        canyon.add(wall, cap);
      }
    }
    // the snowy track rising into the canyon
    for (let k = 0; k < 9; k++) {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 4.2), new THREE.MeshStandardMaterial({ color: 0xd8e4f4, roughness: 0.7 }));
      ramp.position.set(0, 0.1 + k * 0.7, 2 + k * 4);
      ramp.rotation.x = -0.17;
      canyon.add(ramp);
    }
    const mist = glow(0xdfe8ff, 22, 0.5);
    mist.position.set(0, 9, 30);
    canyon.add(mist);
    c.group.add(canyon);
    // (solid cliff walls either side of the opening)
    const fx = Math.sin(canyon.rotation.y);
    const fz = Math.cos(canyon.rotation.y);
    for (let k = 0; k < 4; k++) for (const side of [-1, 1]) c.colliders.push({ x: th.x + fz * side * 7 + fx * k * 6, z: th.z - fx * side * 7 + fz * k * 6, r: 4.5 });
    kennel.trail = th;
    kennel.dir = { x: fx, z: fz };
    // the golden beam (shown while you're sledding)
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.1, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd86a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.set(th.x, c.height(th.x, th.z) + 30, th.z);
    beam.visible = false;
    c.group.add(beam);
    kennel.beam = beam;
  }
  function buildDogs() {
    const team = new THREE.Group();
    const cols = [0x6a6a74, 0xf4f4f8, 0x3a3a42, 0xd8a868];
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Group();
      const col = cols[i];
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), M(col));
      body.scale.set(0.8, 0.8, 1.5);
      body.position.y = 0.45;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M(col));
      head.position.set(0, 0.7, 0.5);
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 5), M(0xe8e8ec));
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.66, 0.72);
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), M(col));
        ear.position.set(sx * 0.1, 0.9, 0.45);
        d.add(ear);
      }
      const legs = [];
      for (const [x, z] of [[0.15, 0.3], [-0.15, 0.3], [0.15, -0.3], [-0.15, -0.3]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 4), M(col));
        leg.position.set(x, 0.18, z);
        d.add(leg);
        legs.push(leg);
      }
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 4), M(col));
      tail.position.set(0, 0.7, -0.5);
      tail.rotation.x = -0.8;
      d.add(body, head, snout, tail);
      d.userData.legs = legs;
      d.position.set((i % 2 ? 0.4 : -0.4), 0, 1.4 + Math.floor(i / 2) * 1.2);
      team.add(d);
    }
    // the harness lines back to the sled
    for (const sx of [-0.4, 0.4]) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 4), M(0x5a3e24));
      line.rotation.x = Math.PI / 2;
      line.position.set(sx, 0.5, 1.3);
      team.add(line);
    }
    return team;
  }
  const huskyPrice = () => cost(20, "huskies"); // (🪙 grows with your adventure)
  registerKeepsake("huskies", "🐕", "Your Husky Team (Bolt, Juniper, Snowball & Pepper)");
  function startSled() {
    parkTeam(false);
    sledding = true;
    ctx.setRide({ speed: 26, sled: true, dogs: true });
    if (!dogs) dogs = buildDogs();
    ctx.scene.add(dogs);
    ctx.say(here() === "frostpine"
      ? "🐕 MUSH! The huskies yip and pull — A/D to steer, E to stop. Follow the GOLDEN BEAM along the lantern trail to the Starlight Pass!"
      : here() === "aurora"
        ? "🐕 MUSH! Race across the snows of the Aurora Reach — A/D to steer, E to stop. (Hunt for starstones from the sled!)"
        : "🐕 MUSH! A/D to steer, E to stop.", true);
  }
  // 🏡 in the Starlight Pass, the team PARKS by your cabin
  let parked = null;
  const parkSpot = () => (here() === "aurora" ? { x: AURORA.dock.x - 6, z: AURORA.dock.z - 8 } : { x: PASS.cabin.x - 7, z: PASS.cabin.z + 2 });
  function parkTeam(on) {
    const Z = here() === "pass" || here() === "aurora" ? ctx.city() : null;
    if (!on || !Z) {
      if (parked) parked.g.visible = false;
      return;
    }
    if (!parked || parked.Z !== Z) {
      const g = new THREE.Group();
      const team = buildDogs();
      g.add(team);
      // the sled itself, with a blanket
      const sled = new THREE.Group();
      for (const sx of [-0.45, 0.45]) {
        const run = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.2), M(0x6a4a2c));
        run.position.set(sx, 0.08, -0.6);
        sled.add(run);
      }
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.6), M(0x8a5a32));
      bed.position.set(0, 0.32, -0.6);
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 1), M(0xb84a4a));
      blanket.position.set(0, 0.42, -0.6);
      sled.add(bed, blanket);
      g.add(sled);
      const sp = parkSpot();
      g.position.set(sp.x, Z.height(sp.x, sp.z), sp.z);
      g.rotation.y = Math.PI / 2;
      Z.group.add(g);
      parked = { Z, g, team };
    }
    parked.g.visible = true;
  }
  function stopSled() {
    sledding = false;
    ctx.setRide(null);
    if (dogs) dogs.parent && dogs.parent.remove(dogs);
    if (here() === "pass") {
      // the huskies trot off and park by your cabin
      const sp = parkSpot();
      fadeThrough(() => {
        parkTeam(true);
        ctx.placePlayer(sp.x + 2.5, sp.z + 1.5, Math.PI / 2);
      }, 0.5);
      ctx.say("🐕 The huskies trot over and park the sled by your cabin, then curl up in the snow for a nap. (E by the sled to hitch them up again.)", true);
      return;
    }
    ctx.say("🐕 Whoa there! The dogs flop down in the snow, tongues out, tails wagging.");
  }
  function sledUpdate(t) {
    if (!sledding) return;
    if (here() !== "frostpine" && here() !== "pass" && here() !== "aurora") return stopSled();
    const p = me();
    const yaw = ctx.mouseRig.rotation.y;
    dogs.position.set(p.x, p.y, p.z);
    dogs.rotation.y = yaw;
    dogs.children.forEach((d, i) => {
      if (!d.userData.legs) return;
      d.userData.legs.forEach((l, k) => (l.rotation.x = Math.sin(t * 16 + i + (k % 2) * Math.PI) * 0.7));
      d.position.y = Math.abs(Math.sin(t * 16 + i)) * 0.08;
    });
  }

  // ================================================================ hooks
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyI" && !e.repeat && !ctx.playing()) openStorybook();
  });
  // ---------------------------------------------------------------- 🏔️ the Starlight Pass
  const twigs = [];
  function passBuild(c) {
    if (!sledding && (!parked || parked.Z !== c || !parked.g.visible)) parkTeam(true);
    if (twigs.length && twigs[0].c === c) return;
    twigs.length = 0;
    for (let k = 0; k < 14; k++) {
      const a = k * 2.4;
      const r = 12 + (k % 5) * 9;
      let x = Math.cos(a) * r;
      let z = Math.sin(a) * r - 6;
      if (c.iceAt(x, z)) { x *= 1.6; z *= 1.6; }
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 4), M(0x7a5232));
        t.rotation.set(Math.PI / 2, (i - 2) * 0.4, 0);
        t.position.y = 0.08 + i * 0.03;
        g.add(t);
      }
      g.position.set(x, c.height(x, z), z);
      c.group.add(g);
      twigs.push({ c, g, x, z, back: 0 });
    }
  }
  function passInteract() {
    const w = here();
    if (w !== "pass") return null;
    const Z = ctx.city();
    passBuild(Z);
    const T = PASS.trail;
    const ps = parkSpot();
    if (!sledding && near(ps.x, ps.z, 3.4)) return { label: "hitch up your huskies 🐕", act: startSled };
    if (sledding) return null;
    const D = Z.cabinDoor;
    if (near(D.x, D.z, 2.6)) return { label: "go inside your Starlight Pass cabin 🏡", act: () => {
      const h = ((S.homes ||= {}).pass ||= {});
      if (!h.owned) {
        h.owned = true;
        save();
        ctx.chime();
        ctx.say("🏡 A note on the door: “For the High Moonkeeper — a cabin of your own, free, forever. Mind the wood stove.” It's YOURS!", true);
      }
      ctx.enterHome("pass", { x: D.x, z: D.z, face: D.face });
    } };
    for (const tw of twigs) {
      if (tw.back > 0 || !near(tw.x, tw.z, 2)) continue;
      return { label: "gather the twigs 🪵", act: () => {
        ctx.addToPack("Twigs", 3);
        tw.back = 25;
        tw.g.visible = false;
        ctx.chime();
        ctx.say("🪵 +3 twigs (there are always more up here!)");
      } };
    }
    return null;
  }
  let passCool = 0;
  function passUpdate(dt) {
    if (kennel && kennel.beam) kennel.beam.visible = sledding && here() === "frostpine";
    passCool -= dt;
    const p = me();
    // 🛷 sled INTO the canyon → up you go (no gate, no button)
    if (here() === "frostpine" && kennel && kennel.trail && passCool <= 0) {
      const T = kennel.trail;
      const D = kennel.dir;
      const along = (p.x - T.x) * D.x + (p.z - T.z) * D.z;
      const side = Math.abs((p.x - T.x) * D.z - (p.z - T.z) * D.x);
      if (along > -1 && side < 4) {
        passCool = 3;
        if (sledding) {
          fadeThrough(() => {
            ctx.goCity("pass");
            ctx.say("🏔️ The huskies charge up the canyon — up, up, up through the snow… and out into THE STARLIGHT PASS. A lake frozen all year round, the northern lights, and a little log cabin that's YOURS!", true);
          }, 1.2);
        } else {
          p.x = T.x - D.x * 4;
          p.z = T.z - D.z * 4;
          ctx.say("🏔️ A wall of deep snow — far too steep for paws. Only a DOG SLED can climb the pass! (Your huskies are at the kennel.)", true);
        }
      }
    }
    // 🛷 …and sled back down the canyon behind you
    if (here() === "pass" && sledding && passCool <= 0) {
      const T = PASS.trail;
      if (p.z > T.z + 3 && Math.abs(p.x - T.x) < 5) {
        passCool = 3;
        fadeThrough(() => {
          ctx.goCity("frostpine");
          if (kennel && kennel.trail) ctx.placePlayer(kennel.trail.x - kennel.dir.x * 8, kennel.trail.z - kennel.dir.z * 8, Math.atan2(-kennel.dir.x, -kennel.dir.z));
          ctx.say("🛷 Wheeeee — all the way back down to Frostpine!");
        }, 1.2);
      }
    }
    for (const tw of twigs) {
      if (tw.back <= 0) continue;
      tw.back -= dt;
      if (tw.back <= 0) tw.g.visible = true;
    }
  }
  // 💎 Roothaven: chip crystal fragments off the crystals all around
  const chipped = {};
  function crystalInteract() {
    if (ctx.world() !== "roothaven" || !ctx.roothaven) return null;
    const list = ctx.roothaven.crystalSpots || [];
    const now = performance.now();
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!near(c.x, c.z, 1.9) || (chipped[i] || 0) > now) continue;
      return { label: "chip off some crystal fragments 💎", act: () => {
        chipped[i] = now + 45000; // (it grows back)
        ctx.addToPack("Crystal Fragments", 2);
        ctx.chime();
        ctx.say("💎 Tink, tink! +2 crystal fragments (this crystal will grow back).");
      } };
    }
    return null;
  }
  function interactable() {
    const ci = crystalInteract();
    if (ci) return ci;
    const pi = passInteract();
    if (pi) return pi;
    if (sledding) return { label: "stop the dog sled 🐕", act: stopSled };
    const w = here();
    // 🌌 the Aurora Reach is ALL snow — a husky team waits at the dock
    if (w === "aurora" && !sledding && near(AURORA.dock.x - 6, AURORA.dock.z - 8, 3.4))
      return { label: (S.owned || {}).huskies ? "hitch up your huskies 🐕 (dog sled!)" : "borrow the Aurora mushers' husky team 🐕 (dog sled!)", act: startSled };
    if (w === "forest") {
      vaultDoorBuild();
      gardenBuild();
      penBuild();
      if (pen && near(pen.gate.x, pen.gate.z, 2.4)) return { label: "visit your animal nursery 🐣", act: () => openNursery() };
    }
    if (PLACES.includes(w) && !run) {
      const C = course(w);
      if (C && near(C.start.x, C.start.z, 2.4)) return { label: `start the time trial 🏁${S.trials[w] ? ` (best ${S.trials[w].time.toFixed(1)}s)` : ""}`, act: () => startTrial(w) };
    }
    if (w === "reedmere") {
      boardBuild(ctx.city());
      if (board && near(board.x, board.z, 2.4)) return { label: "read the Fishing Tournament board 🎣", act: openBoard };
    }
    if (w === "frostpine") {
      kennelBuild(ctx.city());
      if (kennel && near(kennel.x, kennel.z, 2.6)) {
        if (!(S.owned || {}).huskies) return { label: `buy a husky team 🐕 (🪙 ${huskyPrice()} — yours to keep!)`, act: () => {
          if (S.coins < huskyPrice()) return ctx.say(`🐕 Musher Kodi: “A team of four huskies is just 🪙 ${huskyPrice()} — you've got ${S.coins}. Come back soon, they're waiting!”`, true);
          S.coins -= huskyPrice();
          (S.owned ||= {}).huskies = true;
          save();
          ctx.chime();
          ctx.say("🐕 Four happy huskies — Bolt, Juniper, Snowball and Pepper — are YOURS, forever! Hitch them up here any time (E). Whenever you're on your sled, a GOLDEN BEAM shows the Starlight Pass Trail — only a dog sled can climb it to the hidden valley in the mountains!", true);
        } };
        return { label: "hitch up your husky team 🐕 (dog sled!)", act: startSled };
      }
    }
    return vaultInteract() || gardenInteract();
  }
  let watchT = 0;
  function update(dt, t) {
    trialUpdate();
    vaultUpdate();
    if (here() === "forest") {
      gardenBuild();
      penBuild();
      beds.forEach((_, i) => drawBed(i));
      penUpdate(t);
    }
    sledUpdate(t);
    // 🌌 a husky team waits by the Aurora Reach dock
    if (here() === "aurora" && !sledding && (!parked || parked.Z !== ctx.city() || !parked.g.visible)) parkTeam(true);
    passUpdate(dt);
    soundUpdate(dt);
    const b = todaysBirthdays();
    bdayEl.style.display = b.length ? "" : "none";
    if (b.length) bdayEl.textContent = `🎂 Today is ${b.join(" & ")}'s birthday — bring a gift!`;
    watchT -= dt;
    if (watchT <= 0) {
      watchT = 2;
      storyWatch();
    }
  }
  return { interactable, update, sledding: () => sledding };
}
