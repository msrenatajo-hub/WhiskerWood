// ------------------------------------------------------------
//  🌟 SIGNATURE ADVENTURES — once you've finished a world's quest, it opens
//  up ONE really special, really fun thing you can only do there. Each one
//  keeps your best score, and the first time you beat its goal you win a
//  trophy keepsake (it stands in your Trophy Room).
//
//    ⚡ the Great Storm      — Lightning Surfing (surf the storm, catch lightning in jars)
//    ⚙️ Clockwork Mountain   — the Gear Coaster (lean A/D to grab the gold cogs)
//    🐋 Coralmere            — the Whale Run (ride a whale, catch the glowing fish)
//    🍄 the Glowcap Kingdom  — Mushroom Bouncing (bounce up the giant caps to the top)
//    💎 the Crystal Caverns  — Crystal Music (play the songs, open the hidden grotto)
//    🌑 Shadowmere           — Shadow Tag with Umbra
//    🏜️ the Whispering Dunes — Sandboarding (Caps Lock to board — through every flag)
//    🌌 the Aurora Reach     — Aurora Gliding (glide through the ribbons of light)
//    🌠 the Starway          — Ride a Falling Star
//    🏝️ the Moonless Isle    — the Pirate's Daily Dig (a new treasure map every day)
//    🎪 the Circus           — the Human Cannon (land on the target!)
//    🦪 the Open Sea         — Pearl Diving
// ------------------------------------------------------------
import * as THREE from "three";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";
import { makeWisp } from "./wisp.js";
import { signBoard } from "./signs.js";
import { startDuneRun } from "./dunerun.js";
import { ZONE_INFO, SECRET_ROOMS } from "./questZones.js";
import { PLACES } from "./secretPlaces.js";
import { DRAGON_DESTS } from "./more3.js";

const Mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const Basic = (c, e = {}) => new THREE.MeshBasicMaterial({ color: c, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

// unlock: which story chapter (st.pN.done) opens it (null = as soon as you can get there)
export const ACTS = [
  { key: "lightning", zone: "storm", phase: 22, icon: "⚡", name: "Lightning Surfing", mode: "fly", board: "storm", time: 60, goal: 15, unit: "jars",
    how: "Surf the storm! Catch the lightning in jars before it fades — W go · A/D turn · Space up · Shift down", trophy: ["trophylightning", "⚡", "The Lightning-Jar Trophy", "jump", 0.05] },
  { key: "coaster", zone: "clockwork", phase: 28, icon: "⚙️", name: "The Gear Coaster", mode: "coaster", time: 0, goal: 70, unit: "cogs",
    how: "HOLD ON! The cart screams round the mountain three times, faster on every drop — lean with A and D to grab the gold cogs", trophy: ["trophycoaster", "⚙️", "The Golden Cog Trophy", "luck", 0.04] },
  { key: "whalerun", zone: "coral", phase: 27, icon: "🐋", name: "The Whale Run", mode: "fly", board: "whale", time: 60, goal: 14, unit: "fish", moving: true,
    how: "Ride the whale through the sunken city and catch the glowing fish — W go · A/D turn · Space up · Shift down", trophy: ["trophywhale", "🐋", "The Whale-Rider's Trophy", "air", 0.1] },
  { key: "bounce", zone: "glowcap", phase: 30, icon: "🍄", name: "Mushroom Bouncing", mode: "bounce", time: 90, goal: 1, unit: "",
    how: "The giant caps are TRAMPOLINES! Bounce from cap to cap all the way to the top — as fast as you can", trophy: ["trophybounce", "🍄", "The Highest Bounce Trophy", "jump", 0.08] },
  { key: "music", zone: "crystal", phase: 31, icon: "🎶", name: "Crystal Music", mode: "music", time: 0, goal: 3, unit: "songs",
    how: "Strike the singing crystals (E) in the order of the song — play all three songs", trophy: ["trophymusic", "🎶", "The Crystal Harp Trophy", "luck", 0.05] },
  { key: "shadowtag", zone: "shadowmere", phase: 29, icon: "🌑", name: "Shadow Tag with Umbra", mode: "tag", time: 90, goal: 8, unit: "tags",
    how: "Umbra pops out of the shadows — tag him (run into him) before he melts away again!", trophy: ["trophyshadow", "🌑", "Umbra's Tag Trophy", "luck", 0.04] },
  { key: "sandboard", zone: "dunes", phase: 24, icon: "🏜️", name: "The Dune Run", mode: "dunerun", time: 0, goal: 5000, unit: "points",
    how: "Board down the endless dunes at sunset! Space to jump · hold Space in the air to BACKFLIP (land upright!) · land on vines to grind · Esc to leave", trophy: ["trophysand", "🏜️", "The Golden Sandboard Trophy", "sprint", 0.05] },
  { key: "aurora", zone: "aurora", phase: 19, icon: "🌌", name: "Aurora Gliding", mode: "rings", board: "glider", time: 90, goal: 1, unit: "",
    how: "Glide along the northern lights — through every glowing ring, in order! W go · A/D turn · Space up · Shift down", trophy: ["trophyaurora", "🌌", "The Aurora Wings Trophy", "air", 0.1] },
  { key: "starride", zone: "starway", phase: 20, icon: "🌠", name: "Ride a Falling Star", mode: "fly", board: "star", time: 50, goal: 16, unit: "stardust", fast: true,
    how: "Hold on to the falling star! Steer through the sky and scoop up the stardust — W go · A/D turn · Space up · Shift down", trophy: ["trophystar", "🌠", "The Shooting Star Trophy", "jump", 0.06] },
  { key: "dig", zone: "isle", phase: 17, icon: "🏝️", name: "The Pirate's Daily Dig", mode: "dig", time: 0, goal: 5, unit: "treasures",
    how: "Every day there's a new treasure map. Read the clue and dig in the right place!", trophy: ["trophydig", "🏴‍☠️", "The Pirate King's Trophy", "luck", 0.06] },
  { key: "cannon", zone: "circus", phase: null, icon: "🎪", name: "The Human Cannon", mode: "cannon", time: 0, goal: 250, unit: "points",
    how: "Climb in the cannon — BOOM! Steer with A/D in mid-air and land on the target. Three shots!", trophy: ["trophycannon", "🎪", "The Star Performer's Trophy", "jump", 0.06] },
  { key: "pearls", zone: "sea", phase: null, icon: "🦪", name: "Pearl Diving", mode: "walk", time: 75, goal: 10, unit: "pearls",
    how: "Swim out and gather the pearls glinting on the water before time runs out!", trophy: ["trophypearl", "🦪", "The Pearl-Diver's Trophy", "fish", 0.08] },
];
for (const A of ACTS) {
  const [k, icon, name, type, n] = A.trophy;
  registerKeepsake(k, icon, name);
  ITEM_POWERS[k] = { type, n };
}
registerKeepsake("grottogeode", "💎", "The Grotto's Heart-Geode (from the hidden Crystal Grotto)");
ITEM_POWERS.grottogeode = { type: "luck", n: 0.08 };

export function initSignatures(ctx) {
  // ctx: { world(), city(), mouseRig, camera, placePlayer, say, chime, story() (state), setFlight, setFlightCam, bounce(v), keys, hurt }
  const S = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const rec = () => (S().signatures ||= {});
  const unlocked = (A) => {
    if (A.phase == null) return true;
    const st = ctx.story && ctx.story();
    return !!(st && st["p" + A.phase] && st["p" + A.phase].done);
  };

  // ---------------------------------------------------------------- the score bar
  const hud = document.createElement("div");
  hud.style.cssText = "position:fixed;top:142px;left:50%;transform:translateX(-50%);z-index:30;display:none;padding:6px 16px;border-radius:999px;background:rgba(20,14,30,.82);color:#ffe8b0;font:bold 16px Georgia,serif;box-shadow:0 4px 16px rgba(0,0,0,.4);pointer-events:none";
  document.body.appendChild(hud);

  // ---------------------------------------------------------------- each world's start marker (+ its props)
  const built = {}; // zone id → { Z, start, extra }
  function startSpot(Z) {
    const a = Z.spots.arrive;
    return { x: a.x + 5, z: a.z - 4 };
  }
  function buildFor(Z) {
    if (built[Z.id] && built[Z.id].Z === Z) return built[Z.id];
    const A = ACTS.find((x) => x.zone === Z.id);
    if (!A) return null;
    const at = startSpot(Z);
    const y = Z.height(at.x, at.z, 99);
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 6), Mat(0x6a4a2a));
    post.position.y = 1.3;
    const star = glow(0xffe08a, 2.6, 0.9);
    star.position.y = 2.9;
    // the sign (🪧 big, crisp, readable from both sides — see signs.js)
    const sign = signBoard(A.icon + " " + A.name, { w: 3.8, h: 0.85, style: { bg: "#2a1a3a", frame: "#c8a8ff", ink: "#ffe8a8" } });
    sign.position.y = 2.2;
    g.add(post, star, sign);
    g.position.set(at.x, y, at.z);
    g.rotation.y = Math.atan2(Z.spots.arrive.x - at.x, Z.spots.arrive.z - at.z);
    Z.group.add(g);
    const B = (built[Z.id] = { Z, A, start: { ...at, y }, marker: g, extra: {} });
    if (A.mode === "bounce") buildBounceTower(B);
    if (A.mode === "music") buildMusic(B);
    if (A.mode === "dig") buildDig(B);
    if (A.mode === "cannon") buildCannon(B);
    return B;
  }

  // ---------------------------------------------------------------- the run that's going on
  let run = null; // { A, B, t, score, objs, ... }
  const best = (A) => rec()[A.key] && rec()[A.key].best;
  const better = (A, v) => (A.mode === "bounce" || A.mode === "gates" || A.mode === "rings" ? v < (best(A) ?? 1e9) : v > (best(A) ?? -1));
  function finish(msg, value, won) {
    const A = run.A;
    cleanup();
    const r = (rec()[A.key] ||= {});
    let m = msg;
    if (value != null && better(A, value)) {
      r.best = value;
      m += " ✨ NEW BEST!";
    }
    if (won && !r.trophy) {
      r.trophy = true;
      (S().owned ||= {})[A.trophy[0]] = true;
      S().coins = (S().coins || 0) + 150;
      m += ` 🏆 You win ${A.trophy[1]} ${A.trophy[2]} (and 🪙 150)!`;
    }
    saveCity();
    ctx.chime();
    ctx.say(m, true);
  }
  function cleanup() {
    if (!run) return;
    for (const o of run.objs || []) o.parent && o.parent.remove(o);
    if (run.flyer) run.flyer.parent && run.flyer.parent.remove(run.flyer);
    if (run.flying) {
      ctx.setFlight(null);
      ctx.setFlightCam(null);
      const Z = ctx.city();
      if (Z) me().y = Z.height(me().x, me().z, me().y);
    }
    window.__wwSandboard = false;
    hud.style.display = "none";
    run = null;
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function showHud() {
    if (!run) return;
    const A = run.A;
    const b = best(A);
    const timed = A.mode === "bounce" || A.mode === "gates" || A.mode === "rings";
    const left = A.time ? Math.max(0, A.time - run.t) : null;
    const scoreTxt = timed ? `${run.score}/${run.need}` : `${run.score} ${A.unit}`;
    const bestTxt = b == null ? "" : ` · best ${timed ? fmt(b) : b + " " + A.unit}`;
    const clock = timed ? " · ⏱ " + fmt(run.t) : A.time ? " · ⏳ " + fmt(left) : "";
    hud.textContent = `${A.icon} ${A.name} — ${scoreTxt}${clock}${bestTxt}`;
    hud.style.display = "";
  }

  // ---------------------------------------------------------------- 🛹 flying (surf · glide · ride)
  function flyerMesh(kind) {
    const g = new THREE.Group();
    if (kind === "storm") {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 2), Mat(0x3a3a5a, { emissive: 0x6a8aff, emissiveIntensity: 0.4 }));
      g.add(board, glow(0x8ab8ff, 3, 0.6));
    } else if (kind === "glider") {
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.9), Mat(0x8ad8a8, { transparent: true, opacity: 0.8 }));
        w.position.set(sx * 0.9, 1.2, 0);
        w.rotation.z = sx * -0.15;
        g.add(w);
      }
    } else if (kind === "star") {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), Basic(0xfff4b0));
      s.position.y = -0.3;
      g.add(s, glow(0xffe880, 4, 0.9));
    } else if (kind === "whale") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), Mat(0x3a5a8a));
      body.scale.set(1, 0.6, 2.4);
      body.position.y = -0.8;
      const belly = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6), Mat(0xd8e0e8));
      belly.scale.set(0.9, 0.4, 2.1);
      belly.position.y = -1.1;
      const tail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.7), Mat(0x3a5a8a));
      tail.position.set(0, -0.8, -3.4);
      g.add(body, belly, tail);
      g.userData.tail = tail;
    }
    return g;
  }
  const camPos = new THREE.Vector3();
  function startFlying(A, Z, alt) {
    run.flying = { speed: 0, alt };
    me().y = alt;
    run.flyer = flyerMesh(A.board);
    Z.group.add(run.flyer);
    camPos.set(0, 0, 0);
    ctx.setFlight((dt, keys) => {
      const F = run && run.flying;
      if (!F) return;
      const max = A.fast ? 26 : 16;
      F.speed += ((keys.KeyW || keys.ArrowUp ? max : keys.KeyS || keys.ArrowDown ? 2 : 6) - F.speed) * Math.min(1, dt * 1.5);
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      ctx.mouseRig.rotation.y += turn * dt * 1.8;
      const yaw = ctx.mouseRig.rotation.y;
      const p = me();
      p.x += Math.sin(yaw) * F.speed * dt;
      p.z += Math.cos(yaw) * F.speed * dt;
      p.y += ((keys.Space ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight ? 1 : 0)) * dt * 8;
      // stay in the world: above the ground, below the ceiling, inside the edge
      const R = (Z.R || 60) - 3;
      const d = Math.hypot(p.x, p.z);
      if (d > R) {
        p.x *= R / d;
        p.z *= R / d;
      }
      p.y = Math.max(Z.height(p.x, p.z, 99) + 1.2, Math.min(alt + 30, p.y));
      run.flyer.position.copy(p);
      run.flyer.rotation.set(0, yaw, -turn * 0.3);
      if (run.flyer.userData.tail) run.flyer.userData.tail.rotation.x = Math.sin(performance.now() / 300) * 0.3;
    });
    ctx.setFlightCam((dt) => {
      const p = me();
      const yaw = ctx.mouseRig.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 8, p.y + 3.2, p.z - Math.cos(yaw) * 8);
      if (camPos.lengthSq() === 0) camPos.copy(want);
      camPos.lerp(want, Math.min(1, dt * 4));
      ctx.camera.position.copy(camPos);
      ctx.camera.lookAt(p.x + Math.sin(yaw) * 4, p.y + 1, p.z + Math.cos(yaw) * 4);
      return true;
    });
  }

  // ---------------------------------------------------------------- the pieces of each game
  function spawnTarget(Z, center, spread, yLo, yHi, color) {
    const g = new THREE.Group();
    const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * spread;
    const x = center.x + Math.cos(a) * d, z = center.z + Math.sin(a) * d;
    const water = Z.waterAt ? Z.waterAt(x, z) : null;
    const ground = water !== null && water !== undefined ? Math.max(water, Z.height(x, z, 99)) : Z.height(x, z, 99);
    const y = yHi > yLo ? ground + yLo + Math.random() * (yHi - yLo) : ground + yLo;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), Basic(color));
    g.add(core, glow(color, 2.6, 0.8));
    g.position.set(x, y, z);
    g.userData = { born: run.t, vx: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 6 };
    Z.group.add(g);
    run.objs.push(g);
    return g;
  }
  function begin(A, B) {
    const Z = B.Z;
    run = { A, B, t: 0, score: 0, objs: [], targets: [] };
    ctx.say(`${A.icon} ${A.name}! ${A.how}`, true);
    if (A.mode === "fly" || A.mode === "rings") {
      const alt = Z.height(me().x, me().z, 99) + (A.zone === "storm" ? 14 : 8);
      startFlying(A, Z, alt);
      run.center = { x: me().x * 0.3, z: me().z * 0.3 };
      if (A.mode === "rings") {
        // a ribbon of rings curling round the sky
        run.rings = [];
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const r = 26 + Math.sin(k * 1.3) * 8;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 8, 24), Basic([0x6affc8, 0x8a8aff, 0xff8ad8][k % 3], { transparent: true, opacity: 0.85 }));
          ring.position.set(x, alt + Math.sin(k * 0.9) * 5, z);
          ring.lookAt(Math.cos(a + 0.3) * r, ring.position.y, Math.sin(a + 0.3) * r);
          Z.group.add(ring);
          run.objs.push(ring);
          run.rings.push(ring);
        }
        run.need = 12;
      }
    }
    if (A.mode === "walk") run.center = { ...Z.spots.arrive };
    if (A.mode === "tag") run.center = { ...Z.spots.arrive };
    if (A.mode === "gates") {
      window.__wwSandboard = true;
      // a slalom of flags down the dunes, away from your camp
      run.gates = [];
      const a0 = Math.atan2(-Z.spots.arrive.z, -Z.spots.arrive.x);
      for (let k = 0; k < 8; k++) {
        const x = Z.spots.arrive.x + Math.cos(a0) * (10 + k * 9) + Math.sin(k * 1.4) * 6;
        const z = Z.spots.arrive.z + Math.sin(a0) * (10 + k * 9) + Math.cos(k * 1.4) * 6;
        const flag = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), Mat(0x5a3a1a));
        pole.position.y = 1.5;
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), Basic(k % 2 ? 0xe83a2a : 0x2a6ae8, { side: THREE.DoubleSide }));
        cloth.position.set(0.6, 2.6, 0);
        flag.add(pole, cloth, glow(0xfff0a0, 2.4, 0.5));
        flag.position.set(x, Z.height(x, z, 99), z);
        Z.group.add(flag);
        run.objs.push(flag);
        run.gates.push(flag);
      }
      run.need = 8;
    }
    if (A.mode === "bounce") run.need = B.extra.caps.length;
    if (A.mode === "coaster") startCoaster(A, B);
    if (A.mode === "music") startMusic(B);
    if (A.mode === "cannon") startCannon(B);
    if (A.mode === "dig") return digToday(B);
    if (A.mode === "dunerun") {
      // 🏜️ the Dune Run is its own little game, full screen
      const r = (rec()[A.key] ||= {});
      run.dune = startDuneRun({
        best: r.best || 0,
        onEnd: ({ score, coins, final }) => {
          if (coins) S().coins = (S().coins || 0) + coins;
          if (score > (r.best || 0)) r.best = score;
          if (score >= A.goal && !r.trophy) {
            r.trophy = true;
            (S().owned ||= {})[A.trophy[0]] = true;
            S().coins = (S().coins || 0) + 150;
            ctx.say(`🏆 ${score} points! You win ${A.trophy[1]} ${A.trophy[2]} (and 🪙 150)!`, true);
          }
          saveCity();
          if (final) {
            run = null;
            ctx.say(`🏜️ What a ride! Best Dune Run: ${r.best} points.`, true);
          }
        },
      });
      return;
    }
    showHud();
  }

  // 🍄 the bounce tower — trampoline caps spiralling up to a high ledge
  function buildBounceTower(B) {
    const Z = B.Z;
    const c0 = { x: B.start.x + 10, z: B.start.z - 8 };
    const caps = [];
    for (let k = 0; k < 8; k++) {
      const a = k * 1.1;
      const x = c0.x + Math.cos(a) * 5, z = c0.z + Math.sin(a) * 5;
      const y = 1.2 + k * 5;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, y, 8), Mat(0xe8e0d0));
      stalk.position.set(x, y / 2, z);
      const col = [0xff6ab8, 0x6ad8ff, 0xffd84a, 0x8aff8a][k % 4];
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), Mat(col, { emissive: col, emissiveIntensity: 0.4 }));
      cap.scale.y = 0.45;
      cap.position.set(x, y, z);
      Z.group.add(stalk, cap);
      const pl = { x, z, r: 1.9, y: y + 0.6, bounce: true };
      Z.platforms.push(pl);
      caps.push({ ...pl, cap });
    }
    // the ledge at the top, with a glowing lantern
    const top = caps[caps.length - 1];
    const ledge = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.4, 12), Mat(0x8a6a4a));
    ledge.position.set(c0.x, top.y + 5, c0.z);
    const lamp = glow(0xffe08a, 3, 0.9);
    lamp.position.set(c0.x, top.y + 6.2, c0.z);
    Z.group.add(ledge, lamp);
    Z.platforms.push({ x: c0.x, z: c0.z, r: 2.6, y: top.y + 5.2 });
    B.extra.caps = caps;
    B.extra.top = { x: c0.x, z: c0.z, y: top.y + 5.2 };
  }
  let lastBounce = 0;
  function bounceUpdate(dt) {
    const B = built.glowcap;
    if (!B || here() !== "glowcap") return;
    const p = me();
    for (const [i, c] of B.extra.caps.entries()) {
      if (Math.hypot(p.x - c.x, p.z - c.z) < c.r && Math.abs(p.y - c.y) < 0.15 && performance.now() - lastBounce > 300) {
        lastBounce = performance.now();
        ctx.bounce(8.2); // BOING
        c.cap.scale.y = 0.3;
        setTimeout(() => (c.cap.scale.y = 0.45), 160);
        if (run && run.A.key === "bounce") run.score = Math.max(run.score, i + 1);
      }
    }
    if (run && run.A.key === "bounce" && Math.hypot(p.x - B.extra.top.x, p.z - B.extra.top.z) < 2.6 && Math.abs(p.y - B.extra.top.y) < 0.4) {
      finish(`🍄 You made it to the TOP in ${fmt(run.t)}!`, Math.round(run.t), true);
    }
  }

  // 💎 crystal music — strike the pillars in the song's order
  const SONGS = [[0, 2, 4], [4, 3, 2, 1, 0], [0, 4, 1, 3, 2, 0]];
  const NOTES = [392, 440, 494, 523, 587];
  function buildMusic(B) {
    const Z = B.Z;
    const cols = [0xffb070, 0x70c8ff, 0x80e890, 0xff80c0, 0xd8b0ff];
    // the hidden grotto's archway — it opens once you've played all three songs
    const arch = new THREE.Group();
    for (const sx of [-1.4, 1.4]) {
      const side = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 6), new THREE.MeshStandardMaterial({ color: 0xd8b8ff, emissive: 0x8a5aff, emissiveIntensity: 0.6, flatShading: true }));
      side.position.set(sx, 2.5, 0);
      arch.add(side);
    }
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.4), new THREE.MeshBasicMaterial({ color: 0x0a0418 }));
    dark.position.set(0, 1.7, 0);
    const shine = glow(0xd8b8ff, 5, 0.7);
    shine.position.set(0, 2.5, 0.4);
    arch.add(dark, shine);
    const ax = B.start.x + 10, az = B.start.z - 7;
    arch.position.set(ax, 0, az);
    arch.rotation.y = Math.atan2(B.start.x - ax, B.start.z - az);
    arch.visible = false;
    Z.group.add(arch);
    B.extra.arch = { g: arch, x: ax, z: az };
    B.extra.pillars = cols.map((c, i) => {
      const x = B.start.x - 6 + i * 3, z = B.start.z - 7;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2 + i * 0.4, 6), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.25, flatShading: true }));
      m.position.set(x, 1 + i * 0.2, z);
      Z.group.add(m);
      Z.colliders.push({ x, z, r: 0.6 });
      return { x, z, m, c };
    });
  }
  function tone(f, dur = 1.2) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur + 0.1);
      setTimeout(() => ac.close(), dur * 1000 + 300);
    } catch {}
  }
  function flash(P, on = 1) {
    P.m.material.emissiveIntensity = on ? 1.2 : 0.25;
    if (on) setTimeout(() => (P.m.material.emissiveIntensity = 0.25), 500);
  }
  function playSong(B, k) {
    SONGS[k].forEach((i, n) => setTimeout(() => {
      tone(NOTES[i]);
      flash(B.extra.pillars[i]);
    }, 700 + n * 650));
  }
  function startMusic(B) {
    run.song = 0;
    run.pos = 0;
    run.need = SONGS.length;
    playSong(B, 0);
  }
  function strike(i) {
    const B = run.B;
    tone(NOTES[i]);
    flash(B.extra.pillars[i]);
    const song = SONGS[run.song];
    if (song[run.pos] === i) {
      run.pos++;
      if (run.pos >= song.length) {
        run.score++;
        run.song++;
        run.pos = 0;
        if (run.song >= SONGS.length) {
          S().coins = (S().coins || 0) + 60;
          return finish("🎶 You played all three songs — and right beside the singing crystals, a glowing crystal ARCHWAY opens into a hidden grotto! (🪙 +60)", 3, true);
        }
        ctx.say(`🎶 Beautiful! Song ${run.song + 1} of 3 — listen…`, true);
        playSong(B, run.song);
      }
    } else {
      ctx.say("🎶 A wrong note — listen again, and start that song from the beginning.");
      run.pos = 0;
      playSong(B, run.song);
    }
    showHud();
  }

  // 🏝️ the daily dig — one treasure a day, with a clue
  const CLUES = [
    ["“Where the tall tower casts its shadow at noon.”", (Z) => ({ x: 0, z: -6 })],
    ["“Ten paces from the dock, toward the setting sun.”", (Z) => ({ x: -10, z: 36 })],
    ["“Beside the lonely palm on the east shore.”", (Z) => ({ x: 30, z: 4 })],
    ["“Under the old rocks to the north-west.”", (Z) => ({ x: -26, z: -26 })],
    ["“Between the dock and the tower, halfway.”", (Z) => ({ x: 0, z: 13 })],
    ["“Where the waves meet the sand, due south.”", (Z) => ({ x: 4, z: 40 })],
  ];
  function buildDig(B) {
    const X = new THREE.Group();
    for (const r of [Math.PI / 4, -Math.PI / 4]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.25), Basic(0xc82a1a));
      bar.rotation.y = r;
      X.add(bar);
    }
    X.visible = false;
    B.Z.group.add(X);
    B.extra.X = X;
  }
  const today = () => S().days || 0;
  function digToday(B) {
    const r = (rec().dig ||= {});
    if (r.day === today()) {
      run = null;
      return ctx.say("🏴‍☠️ You've already dug up today's treasure. A new map washes ashore tomorrow!", true);
    }
    const [clue, at] = CLUES[today() % CLUES.length];
    run.dig = at(B.Z);
    ctx.say(`🗺️ Today's treasure map says: ${clue} (Walk there and press E to dig.)`, true);
    hud.textContent = `🏝️ Today's clue: ${clue}`;
    hud.style.display = "";
  }

  // 🎪 the human cannon — three shots at the target
  function buildCannon(B) {
    const Z = B.Z;
    const cx = B.start.x - 6, cz = B.start.z;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 3, 12), Mat(0xc83a3a));
    barrel.position.set(cx, 1.6, cz);
    barrel.rotation.x = -0.9;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 6, 14), Mat(0xe8c040));
    wheel.position.set(cx, 0.8, cz);
    wheel.rotation.y = Math.PI / 2;
    Z.group.add(barrel, wheel);
    // the target, far across the ring
    const tx = cx, tz = cz - 18;
    for (const [r, c] of [[5, 0xffffff], [3.4, 0xe83a3a], [1.8, 0xffffff], [0.8, 0xe83a3a]]) {
      const ring = new THREE.Mesh(new THREE.CircleGeometry(r, 30), Basic(c));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(tx, Z.height(tx, tz) + 0.04 + (5 - r) * 0.004, tz);
      Z.group.add(ring);
    }
    B.extra.cannon = { x: cx, z: cz };
    B.extra.target = { x: tx, z: tz };
  }
  function startCannon(B) {
    run.shots = 0;
    shoot(B);
  }
  function shoot(B) {
    const C = B.extra.cannon, T = B.extra.target;
    run.shot = { t: 0, x: C.x, z: C.z, side: 0, dur: 2.4 };
    ctx.placePlayer(C.x, C.z, Math.atan2(T.x - C.x, T.z - C.z));
    ctx.say(`🎪 BOOM! (shot ${run.shots + 1} of 3 — steer with A/D!)`);
    run.flying = { cannon: true };
    ctx.setFlight((dt, keys) => {
      const sh = run && run.shot;
      if (!sh) return;
      sh.t += dt;
      const k = Math.min(1, sh.t / sh.dur);
      sh.side += ((keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0)) * dt * 6;
      const wobble = Math.sin(run.shots * 2.1 + 1) * 4; // (every shot flies a little differently)
      const p = me();
      const dx = T.x - C.x, dz = T.z - C.z, L = Math.hypot(dx, dz);
      const nx = -dz / L, nz = dx / L;
      p.x = C.x + dx * k + nx * (sh.side + wobble * k);
      p.z = C.z + dz * k + nz * (sh.side + wobble * k);
      p.y = B.Z.height(p.x, p.z) + Math.sin(k * Math.PI) * 14;
      if (k >= 1) {
        const miss = Math.hypot(p.x - T.x, p.z - T.z);
        const pts = miss < 0.8 ? 100 : miss < 1.8 ? 60 : miss < 3.4 ? 30 : miss < 5 ? 10 : 0;
        run.score += pts;
        run.shots++;
        run.shot = null;
        ctx.setFlight(null);
        run.flying = null;
        ctx.say(pts ? `🎯 ${pts === 100 ? "BULLSEYE!" : "On the target!"} +${pts}` : "💨 Missed the target! (the crowd goes “ooooh”)");
        showHud();
        if (run.shots >= 3) setTimeout(() => run && finish(`🎪 Three shots: ${run.score} points!`, run.score, run.score >= 250), 900);
        else setTimeout(() => run && shoot(B), 1500);
      }
    });
  }

  // ⚙️ the gear coaster — the cart runs a loop round the mountain; you lean for the cogs
  function startCoaster(A, B) {
    const Z = B.Z;
    const R0 = Math.min(26, (Z.R || 40) - 8);
    const path = (u) => {
      const a = u * Math.PI * 2;
      return { x: Math.cos(a) * R0, z: Math.sin(a) * R0, y: 9 + Math.sin(a * 3) * 7 + Math.sin(a * 7) * 2 };
    };
    const LAPS = 3;
    const lapLen = 2 * Math.PI * R0;
    run.lean = 0;
    run.cogs = [];
    for (let k = 0; k < 40 * LAPS; k++) {
      const u = ((k + 0.5) / 40) % 1;
      const P = path(u), P2 = path(u + 0.001);
      const tx = P2.x - P.x, tz = P2.z - P.z, L = Math.hypot(tx, tz);
      const lane = [-1.6, 0, 1.6][Math.floor(Math.random() * 3)];
      const cog = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.14, 6, 10), Basic(0xffd040));
      cog.position.set(P.x + (-tz / L) * lane, P.y + 1, P.z + (tx / L) * lane);
      Z.group.add(cog);
      run.objs.push(cog);
      run.cogs.push(cog);
    }
    // the track
    const pts = [];
    for (let k = 0; k <= 200; k++) {
      const P = path(k / 200);
      pts.push(new THREE.Vector3(P.x, P.y - 0.3, P.z));
    }
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 300, 0.12, 5, true), Mat(0x8a6a3a, { metalness: 0.5 }));
    Z.group.add(rail);
    run.objs.push(rail);
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.6), Mat(0xb84a2a));
    Z.group.add(cart);
    run.objs.push(cart);
    run.coaster = { u: 0, path, cart, speed: 24, laps: LAPS, lapLen };
    run.flying = { coaster: true };
    camPos.set(0, 0, 0);
    ctx.setFlight((dt, keys) => {
      const C = run && run.coaster;
      if (!C) return;
      // gravity: faster down every drop, slower up every climb
      const Pa = C.path(C.u % 1), Pb = C.path((C.u + 0.003) % 1);
      const pitch = (Pb.y - Pa.y) / (C.lapLen * 0.003);
      C.speed = Math.max(18, Math.min(48, C.speed - pitch * 40 * dt + 2 * dt));
      C.u += (C.speed * dt) / C.lapLen;
      run.lean += (((keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0)) * 1.6 - run.lean) * Math.min(1, dt * 6);
      const P = C.path(C.u % 1), P2 = C.path((C.u + 0.002) % 1);
      const tx = P2.x - P.x, tz = P2.z - P.z, L = Math.hypot(tx, tz) || 1;
      const p = me();
      p.x = P.x + (-tz / L) * run.lean;
      p.z = P.z + (tx / L) * run.lean;
      p.y = P.y;
      ctx.mouseRig.rotation.y = Math.atan2(tx, tz);
      C.cart.position.set(p.x, p.y - 0.1, p.z);
      C.cart.rotation.y = ctx.mouseRig.rotation.y;
    });
    ctx.setFlightCam((dt) => {
      const p = me();
      const yaw = ctx.mouseRig.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 6, p.y + 2.6, p.z - Math.cos(yaw) * 6);
      if (camPos.lengthSq() === 0) camPos.copy(want);
      camPos.lerp(want, Math.min(1, dt * 6));
      ctx.camera.position.copy(camPos);
      ctx.camera.lookAt(p.x + Math.sin(yaw) * 5, p.y + 0.8, p.z + Math.cos(yaw) * 5);
      return true;
    });
  }

  // ---------------------------------------------------------------- each frame
  function update(dt) {
    backfill();
    const w = here();
    const Z = ctx.city();
    if (Z && ZONE_INFO[w] && !visited()[w]) {
      visited()[w] = true; // (now you can fly back here any time)
      saveCity();
    }
    if (Z && ACTS.some((A) => A.zone === w)) buildFor(Z);
    bounceUpdate(dt);
    if (built.crystal && built.crystal.extra.arch) built.crystal.extra.arch.g.visible = !!(rec().music && rec().music.trophy);
    if (!run || run.dune) return;
    if (!Z || w !== run.A.zone) return cleanup(); // (you left)
    const A = run.A;
    run.t += dt;
    const p = me();
    const t = performance.now() / 1000;
    // ⚡🐋🌠 catch things while flying · 🦪 pearls
    if (A.mode === "fly" || A.mode === "walk") {
      const want = A.mode === "walk" ? 10 : 6;
      run.targets = run.targets.filter((g) => g.parent);
      while (run.targets.length < want) {
        const g = A.mode === "walk"
          ? spawnTarget(Z, run.center, 30, 0.4, 0.4, 0xf4f0ff)
          : spawnTarget(Z, { x: p.x, z: p.z }, 22, A.zone === "storm" ? 6 : 3, A.zone === "storm" ? 22 : 14, A.zone === "storm" ? 0xbfe0ff : A.zone === "coral" ? 0x6affd8 : 0xfff0a0);
        run.targets.push(g);
      }
      for (const g of run.targets) {
        g.rotation.y += dt * 2;
        if (A.moving) {
          g.position.x += g.userData.vx * dt;
          g.position.z += g.userData.vz * dt;
        }
        if (A.zone === "storm") g.children[1].material.opacity = 0.5 + Math.abs(Math.sin(t * 9 + g.position.x)) * 0.5;
        const d = A.mode === "walk" ? Math.hypot(p.x - g.position.x, p.z - g.position.z) : p.distanceTo(g.position);
        if (d < (A.mode === "walk" ? 1.6 : 2.4)) {
          run.score++;
          ctx.chime();
          g.parent.remove(g);
        } else if (run.t - g.userData.born > (A.mode === "walk" ? 999 : 14)) g.parent.remove(g); // (lightning fades…)
      }
      if (run.t >= A.time) return finish(`${A.icon} Time! You caught ${run.score} ${A.unit}.`, run.score, run.score >= A.goal);
    }
    // 🌌 through the rings, in order
    if (A.mode === "rings") {
      const next = run.rings[run.score];
      run.rings.forEach((r, i) => (r.material.opacity = i === run.score ? 0.95 : i < run.score ? 0.1 : 0.4));
      if (next && p.distanceTo(next.position) < 3) {
        run.score++;
        ctx.chime();
        if (run.score >= run.need) return finish(`🌌 Through every ring of light in ${fmt(run.t)}!`, Math.round(run.t), true);
      }
      if (run.t > A.time) return finish("🌌 The aurora fades… try again!", null, false);
    }
    // 🏜️ through the flags, in order
    if (A.mode === "gates") {
      const next = run.gates[run.score];
      run.gates.forEach((g, i) => (g.children[2].material.opacity = i === run.score ? 0.9 : 0));
      if (next && Math.hypot(p.x - next.position.x, p.z - next.position.z) < 3.2) {
        run.score++;
        ctx.chime();
        if (run.score >= run.need) return finish(`🏜️ Through every flag in ${fmt(run.t)}!`, Math.round(run.t), true);
      }
      if (run.t > A.time) return finish("🏜️ Too slow — the sun's going down! Try again.", null, false);
    }
    // 🌑 shadow tag
    if (A.mode === "tag") {
      if (!run.umbra || run.t > run.umbra.until) {
        if (run.umbra) run.umbra.g.parent && run.umbra.g.parent.remove(run.umbra.g);
        const a = Math.random() * Math.PI * 2, d = 8 + Math.random() * 14;
        const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        const g = makeWisp(1.3);
        g.position.set(x, Z.height(x, z) + 1, z);
        Z.group.add(g);
        run.objs.push(g);
        run.umbra = { g, until: run.t + 6 };
      }
      const U = run.umbra.g;
      U.position.y = Z.height(U.position.x, U.position.z) + 1 + Math.sin(t * 4) * 0.3;
      if (Math.hypot(p.x - U.position.x, p.z - U.position.z) < 1.6) {
        run.score++;
        ctx.chime();
        ctx.say(`🌑 TAG! Umbra giggles (a sound like wind in reeds) and melts into the shadows… (${run.score})`);
        run.umbra.until = 0;
      }
      if (run.t >= A.time) return finish(`🌑 Umbra flops down, laughing. You tagged him ${run.score} times!`, run.score, run.score >= A.goal);
    }
    // 🍄 the bounce clock
    if (A.mode === "bounce" && run.t > A.time) return finish("🍄 Out of time — but what a bounce! Try again.", null, false);
    // 🏝️ the dig waits for you to dig; ⚙️ the coaster ends with its loop
    if (A.mode === "coaster") {
      for (const c of run.cogs) {
        if (!c.parent) continue;
        c.rotation.y += dt * 4;
        if (c.visible && p.distanceTo(c.position) < 1.8) {
          run.score++;
          ctx.chime();
          c.parent.remove(c);
        }
      }
      // the cogs for each lap only appear on that lap
      const lap = Math.floor(run.coaster.u);
      run.cogs.forEach((c, i) => (c.visible = Math.floor(i / 40) === lap));
      if (run.coaster.u >= run.coaster.laps) return finish(`⚙️ What a ride! You grabbed ${run.score} gold cogs.`, run.score, run.score >= A.goal);
    }
    showHud();
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    const w = here();
    // 💎 the hidden Crystal Grotto
    if (w === "crystalgrotto") {
      const r = rec().music || {};
      if (near(0, 11.2, 2.4)) return { label: "go back out to the Crystal Caverns 🚪", act: () => {
        ctx.goCity("crystal");
        const A2 = built.crystal && built.crystal.extra.arch;
        if (A2) ctx.placePlayer(A2.x + Math.sin(A2.g.rotation.y) * 3, A2.z + Math.cos(A2.g.rotation.y) * 3, A2.g.rotation.y);
      } };
      if (!r.grotto && near(0, -4.2, 2.4)) return { label: "open the crystal chest 💎", act: () => {
        r.grotto = true;
        (S().owned ||= {}).grottogeode = true;
        S().coins = (S().coins || 0) + 120;
        saveCity();
        ctx.chime();
        ctx.say("💎 Inside the chest: a geode that glows from within, and a heap of crystal coins! (🪙 120 · 💎 The Grotto's Heart-Geode)", true);
      } };
      return null;
    }
    if (w === "crystal" && built.crystal && built.crystal.extra.arch && built.crystal.extra.arch.g.visible && !run) {
      const A2 = built.crystal.extra.arch;
      if (near(A2.x, A2.z, 3)) return { label: "step through the crystal archway into the hidden grotto 💎", act: () => {
        ctx.goCity("crystalgrotto");
        ctx.placePlayer(0, 9.8, Math.PI);
        ctx.say("💎 The Crystal Grotto — every wall glitters, and the crystals hum the songs you played. A chest sits at the far end.", true);
      } };
    }
    const B = built[w];
    if (!B || B.Z !== ctx.city()) return null;
    const A = B.A;
    if (run) {
      if (A.mode === "music") for (const [i, P] of B.extra.pillars.entries()) if (near(P.x, P.z, 1.8)) return { label: "strike the crystal 🎶", act: () => strike(i) };
      if (A.mode === "dig" && run.dig) {
        if (near(B.start.x, B.start.z, 2.6)) return { label: "give up today's dig", act: cleanup };
        return { label: "dig here ⛏️", act: () => {
          const ok = near(run.dig.x, run.dig.z, 3.5);
          if (!ok) return ctx.say("⛏️ Nothing but sand… read the clue again.");
          const r = (rec().dig ||= {});
          r.day = today();
          r.n = (r.n || 0) + 1;
          const coins = 60 + Math.floor(Math.random() * 80);
          S().coins = (S().coins || 0) + coins;
          B.extra.X.position.set(run.dig.x, B.Z.height(run.dig.x, run.dig.z) + 0.05, run.dig.z);
          B.extra.X.visible = true;
          finish(`🏴‍☠️ CLUNK — a little chest! 🪙 ${coins} pirate gold! (treasures found: ${r.n})`, r.n, r.n >= A.goal);
        } };
      }
      if (near(B.start.x, B.start.z, 2.4)) return { label: `stop ${A.name}`, act: cleanup };
      return null;
    }
    if (!near(B.start.x, B.start.z, 2.6)) return null;
    if (!unlocked(A)) return { label: `${A.icon} ${A.name}`, act: () => ctx.say(`${A.icon} ${A.name} — finish this world's adventure first, and it's yours!`, true) };
    const b = best(A);
    const timed = A.mode === "bounce" || A.mode === "gates" || A.mode === "rings";
    return { label: `${A.icon} ${A.name}${b != null ? ` (best: ${timed ? fmt(b) : b + " " + A.unit})` : ""}`, act: () => begin(A, B) };
  }

  // 🐉 every place you've found goes on your dragon's list (press 1 outdoors)
  const visited = () => (S().visitedPlaces ||= {});
  for (const id of Object.keys(ZONE_INFO)) {
    if (DRAGON_DESTS.some((d) => d.id === id)) continue;
    const Zi = ZONE_INFO[id];
    DRAGON_DESTS.push({
      id, icon: Zi.icon, name: `${Zi.name} — ${Zi.sub}`,
      when: () => !!visited()[id],
      go: () => {
        ctx.say(`🐉 WHOOOSH! Your dragon carries you to ${Zi.name}…`, true);
        if (SECRET_ROOMS[id] && window.__wwFlyInto) window.__wwFlyInto(id);
        else ctx.goCity(id);
      },
    });
  }
  // (places you'd already been before this — counted from your story and the secrets you've found)
  let backfilled = false;
  function backfill() {
    const st = ctx.story && ctx.story();
    if (!st || backfilled) return;
    backfilled = true;
    const v = visited();
    const BY_PHASE = { glowcap: 30, crystal: 31, shadowmere: 29, clockwork: 28, coral: 27, dunes: 24, pyramid: 24, storm: 22, roost: 21, starway: 20, aurora: 19, sunrise: 18, isle: 17, pass: 19, cliffs: 14, underglow: 13, vault: 11 };
    for (const [id, n] of Object.entries(BY_PHASE)) {
      const P = st["p" + n];
      if (ZONE_INFO[id] && P && (P.been || P.done || P.started)) v[id] = true;
    }
    const sec = S().secrets || {};
    const CLASSIC = { readingroom: "readingroom", attic: "cat", rootchamber: "oak", basement: "bell", icecave: "fp_icecave", lostvillage: "fog" };
    for (const [room, id] of Object.entries(CLASSIC)) if (sec[id]) v[room] = true;
    for (const P of PLACES) if (sec[P.id]) v[P.room] = true; // (the secret places and the animals' realms)
    if (sec.paradise) v.paradise = true;
    if (rec().music && rec().music.trophy) v.crystalgrotto = true;
    saveCity();
  }
  // ⭐ the places with a Signature Adventure get a star on the dragon list
  for (const A of ACTS) {
    const d = DRAGON_DESTS.find((x) => x.id === A.zone);
    if (d) d.fun = `${A.icon} ${A.name}`;
  }
  window.__wwFly = { list: () => DRAGON_DESTS.filter((d) => d.when()).map((d) => d.id + (d.fun ? " ⭐" : "")), go: (id) => DRAGON_DESTS.find((d) => d.id === id).go() }; // (for tests)
  window.__wwSignatures = { start: (key) => { const Z = ctx.city(); const B = Z && buildFor(Z); if (B) begin(B.A, B); }, run: () => run && { key: run.A.key, score: run.score, t: run.t }, built: () => Object.keys(built), arch: () => built.crystal && built.crystal.extra.arch && { x: built.crystal.extra.arch.x, z: built.crystal.extra.arch.z, visible: built.crystal.extra.arch.g.visible }, caps: () => built.glowcap && built.glowcap.extra.caps.map((c) => ({ x: c.x, z: c.z, y: c.y })) }; // (for tests)
  return { update, interactable, active: () => !!run };
}
