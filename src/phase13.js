// ------------------------------------------------------------
//  🌑  PHASE 13 — "The Shadow Under the Roots"
//
//  You're a Legend now… and the moonstones are dimming. Root Speaker Oriel
//  calls you to Roothaven: something far below is drinking the light.
//  Down the Great Descent lies THE UNDERGLOW — and the camp of the lost
//  Moonkeepers of the year 412, who "went deeper" to guard the moon's
//  Heartstone from a hungry Shadow (Pip's last note was right!).
//
//    1. Answer Oriel's call — take the Great Descent (Roothaven)
//    2. Find the lost Moonkeepers' camp
//    3. Relight their three lanterns:
//         🍄 the Mushroom Grove (climb the glowing caps)
//         🪞 the Mirror Lake   (stepping-stones that SINK)
//         🌫️ the Whispering Dark (a maze of light-drinking wisps)
//    4. Light the five braziers round the Shadow — dodge its sweeping arm
//
//  Your 💡 light runs down in the dark; glowing things fill it back up.
//  Afterwards: LIFE GOALS II (balloons, gliding, friends, cooking, skating…).
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { UG } from "./questZones.js";
import { signPost } from "./signs.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const LANTERNS = [
  ["grove", "🍄", "the Mushroom Grove"],
  ["lake", "🪞", "the Mirror Lake"],
  ["maze", "🌫️", "the Whispering Dark"],
];
registerKeepsake("heartstone", "💠", "Heartstone Shard (your hearts slowly heal on their own)");

// ---------- LIFE GOALS II (after the Shadow) ----------
export const GOALS2 = [
  { key: "balloon", icon: "🎈", name: "Fly a balloon to 4 different places", need: 4, have: (C) => Object.keys((C.stats || {}).balloonTo || {}).length },
  { key: "stars", icon: "⭐", name: "Catch 50 stars on balloon flights", need: 50, have: (C) => Math.min(50, (C.stats || {}).stars || 0) },
  { key: "glide", icon: "🪁", name: "Glide 300 paces on owl feathers", need: 300, have: (C) => Math.min(300, Math.floor((C.stats || {}).glide || 0)) },
  { key: "friends", icon: "💌", name: "Make 3 best friends (5 hearts)", need: 3, have: (C) => Object.values(C.friends || {}).filter((f) => f.hearts >= 5).length },
  { key: "cook", icon: "🍲", name: "Cook every dish in the recipe book", need: 10, have: (C) => Object.keys(C.cooked || {}).length },
  { key: "ribbon", icon: "🎀", name: "Win the Harvest Feast's blue ribbon", need: 1, have: (C) => ((C.owned || {}).feastribbon ? 1 : 0) },
  { key: "skate", icon: "⛸️", name: "Skate on the frozen pond in winter", need: 1, have: (C) => ((C.stats || {}).skated ? 1 : 0) },
  { key: "sprig", icon: "🧑‍🎓", name: "See Sprig become a Moonkeeper", need: 1, have: (C, st) => (st.p12 && st.p12.sprigGrad ? 1 : 0) },
  { key: "volume", icon: "📖", name: "Reach Volume 3 of the Quest Book", need: 3, have: (C) => Math.min(3, C.questVolume || 1) },
];

export function initPhase13(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const p13 = () => (st.p13 ||= { step: 0, lanterns: {}, lit: {} });
  const zone = () => (ctx.world() === "city" && ctx.city() && ctx.city().id === "underglow" ? ctx.city() : null);

  // ---------------------------------------------------------------- the light meter
  let light = 100;
  let p13Wait = 0;
  let hitCool = 0;
  const meterEl = document.createElement("div");
  meterEl.style.cssText = "position:fixed;left:16px;bottom:74px;z-index:40;width:220px;padding:6px 10px;border-radius:10px;background:rgba(10,8,24,.75);color:#fff;font:bold 13px system-ui;display:none;pointer-events:none";
  document.body.appendChild(meterEl);
  function drawMeter() {
    meterEl.style.display = "";
    const low = light < 25;
    meterEl.innerHTML = `${low ? "💡 YOUR LIGHT IS FADING — find something glowing!" : "💡 Light"}<div style="height:10px;margin-top:4px;border-radius:5px;background:rgba(255,255,255,.15);overflow:hidden"><div style="height:100%;width:${Math.max(0, light)}%;background:${low ? "#d88aff" : "linear-gradient(90deg,#8ad8ff,#fff4c0)"}"></div></div>`;
  }

  // ---------------------------------------------------------------- the Great Descent (Roothaven)
  let descent = null;
  function buildDescent() {
    if (descent || !ctx.roothaven) return;
    const R = ctx.roothaven;
    const sp = R.spots.hall; // (where Root Speaker Oriel stands)
    let at = { x: sp.x + 7, z: sp.z + 5 };
    for (let r = 0; r < 20; r += 1.5) {
      let ok = false;
      for (let a = 0; a < Math.PI * 2; a += 0.6) {
        const x = sp.x + 7 + Math.cos(a) * r;
        const z = sp.z + 5 + Math.sin(a) * r;
        if (!R.colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 2.6)) {
          at = { x, z };
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    const y = R.height(at.x, at.z);
    const g = new THREE.Group();
    g.position.set(at.x, y, at.z);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(2, 20), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.05;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.25, 6, 24), new THREE.MeshStandardMaterial({ color: 0x5a3e24, roughness: 1, flatShading: true }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    const breath = glow(0x8a6aff, 6, 0.5);
    breath.position.y = 0.6;
    // a little sign (🪧 big, crisp, readable from both sides — see signs.js)
    const sign = signPost("THE GREAT DESCENT", { w: 3.4, h: 0.85, height: 2.0, style: { bg: "#2a1a10", frame: "#a890e8", ink: "#e8deff" }, post: 0x4a3420 });
    sign.position.set(0, 0, -2.6);
    g.add(hole, ring, breath, sign);
    R.group.add(g);
    descent = { ...at, g };
  }

  // ---------------------------------------------------------------- the Underglow, per visit
  let built = null;
  let ghosts = [];
  let lanternObjs = {};
  function buildInZone(Z) {
    if (built === Z) return;
    built = Z;
    // the lost Moonkeepers: pale, see-through, smiling
    ghosts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const m = buildThistle({ tunicColor: 0x8ab8ff, hoodColor: 0x6a8ad8, pack: false });
      m.traverse((o) => {
        if (!o.isMesh) return;
        o.material = new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.45 });
      });
      const x = UG.camp.x + Math.cos(a) * 3.4;
      const z = UG.camp.z + Math.sin(a) * 3.4;
      m.position.set(x, Z.height(x, z), z);
      m.rotation.y = Math.atan2(UG.camp.x - x, UG.camp.z - z);
      Z.group.add(m);
      ghosts.push(m);
    }
    // the three lost lanterns
    lanternObjs = {};
    for (const [k] of LANTERNS) {
      const sp = Z.lanternSpots[k];
      const g = new THREE.Group();
      const y = k === "grove" ? sp.y : Z.height(sp.x, sp.z);
      g.position.set(sp.x, y, sp.z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5), new THREE.MeshStandardMaterial({ color: 0x3a3a48 }));
      pole.position.y = 0.8;
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.55, 6), new THREE.MeshBasicMaterial({ color: 0x3a3a4a, transparent: true, opacity: 0.8 }));
      cage.position.y = 1.8;
      const flame = glow(0xffe08a, 4);
      flame.position.y = 1.8;
      const light = new THREE.PointLight(0xffd890, 14, 16, 1.6);
      light.position.y = 2;
      g.add(pole, cage, flame, light);
      Z.group.add(g);
      lanternObjs[k] = { g, cage, flame, light, x: sp.x, z: sp.z, y };
    }
  }

  // ---------------------------------------------------------------- the beacon
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.9, 50, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfa0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 25;
    beacon.add(beam, glow(0xbfa0ff, 3));
  }
  function showBeacon(group, at) {
    if (!at || !group) return (beacon.visible = false);
    if (beacon.parent !== group) group.add(beacon);
    beacon.visible = true;
    beacon.position.set(at.x, at.y ?? 0, at.z);
  }
  function target() {
    const s = p13();
    const Z = zone();
    if (ctx.world() === "roothaven" && s.step <= 1) return descent ? { x: descent.x, z: descent.z, y: ctx.roothaven.height(descent.x, descent.z) } : null;
    if (!Z) return null;
    if (s.step === 1) return { x: UG.camp.x, z: UG.camp.z, y: Z.height(UG.camp.x, UG.camp.z) };
    if (s.step === 2) {
      // the nearest unlit lantern
      let best = null;
      let bd = Infinity;
      for (const [k] of LANTERNS) {
        if (s.lanterns[k]) continue;
        const L = lanternObjs[k];
        if (!L) continue;
        const d = Math.hypot(L.x - me().x, L.z - me().z);
        if (d < bd) { bd = d; best = { x: L.x, z: L.z, y: L.y }; }
      }
      return best;
    }
    if (s.step === 3) {
      const b = Z.braziers.find((x, i) => !s.lit[i]);
      return b ? { x: b.x, z: b.z, y: Z.height(b.x, b.z) } : null;
    }
    return null;
  }

  // ---------------------------------------------------------------- the story beats
  function begin() {
    const s = p13();
    s.started = true;
    st.phase = 13;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4, black: true, gameCam: true, text: "That night, something strange happened. One by one, all across the Great Forest… the moonstones began to DIM." },
      { dur: 4.2, black: true, gameCam: true, who: "A letter, sealed with an oak leaf", text: "“Thistle — the roots are cold. Something far below Roothaven is drinking the light. Come quickly. — Root Speaker Oriel”" },
      { dur: 3.6, black: true, gameCam: true, who: "Sprig", text: "“Pip's last note said they went DEEPER… Thistle, I think it's time we found out where.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌑 PHASE 13 — The Shadow Under the Roots. Go to Roothaven and find the Great Descent by Root Speaker Oriel.", true) },
    ]);
  }
  function enterUnderglow() {
    fadeThrough(() => {
      ctx.goCity("underglow");
      light = 100;
      const s = p13();
      if (s.step < 1) s.step = 1;
      save();
      redraw();
      ctx.say("🌑 THE UNDERGLOW. Down, down the root-stair, into a cavern glowing like the night sky turned upside down. Watch your 💡 light — glowing things refill it.", true);
    }, 0.9);
  }
  function leaveUnderglow() {
    fadeThrough(() => {
      ctx.goRoothaven();
      if (descent) ctx.placePlayer(descent.x + 3, descent.z + 3, 0);
      meterEl.style.display = "none";
    }, 0.9);
  }
  function campScene(Z) {
    const y = Z.height(UG.camp.x, UG.camp.z);
    playCutscene([
      { dur: 4, from: [UG.camp.x + 9, y + 5, UG.camp.z + 10], look: [UG.camp.x, y + 1, UG.camp.z], text: "Round a cold blue fire sit five mice, pale as moonlight. You can see the fire right through them." },
      { dur: 4.6, from: [UG.camp.x + 4, y + 2, UG.camp.z + 5], look: [UG.camp.x, y + 1, UG.camp.z], who: "Moonkeeper Corin, of the year 412", text: "“A living mouse! With a lantern! We came down here long ago to guard the moon's Heartstone. Something was hungry for its light — a great Shadow.”" },
      { dur: 4.6, from: [UG.camp.x + 4, y + 2, UG.camp.z + 5], look: [UG.camp.x, y + 1, UG.camp.z], who: "Moonkeeper Corin", text: "“We lit three lanterns to hold it back… but one by one they went out. Relight them — in the Mushroom Grove, on the Mirror Lake, and in the Whispering Dark.”" },
      { dur: 4, from: [UG.camp.x + 4, y + 2, UG.camp.z + 5], look: [UG.camp.x, y + 1, UG.camp.z], who: "Moonkeeper Corin", text: "“Then take their light to the Shadow's Hollow. Light the five braziers round it. Be brave — and be QUICK. Its arm sweeps the floor.”" },
      { dur: 0.4, gameCam: true, end: () => {
        p13().step = 2;
        save();
        redraw();
        chime();
        ctx.say("🏮 Relight the three lost lanterns (any order). Purple beam = the nearest one.", true);
      } },
    ]);
  }
  function finale(Z) {
    const H0 = UG.hollow;
    const y = Z.height(H0.x, H0.z);
    const sh = Z.shadow;
    playCutscene([
      { dur: 4, from: [H0.x + 16, y + 8, H0.z + 16], look: [H0.x, y + 3, H0.z], text: "The fifth brazier roars to life. Light floods the Hollow from every side — and the great Shadow… shrinks." },
      { dur: 4.4, from: [H0.x + 8, y + 3, H0.z + 8], look: [H0.x, y + 1, H0.z], text: "Smaller and smaller, until all that's left is a tiny shadow-kit with big, frightened eyes, curled up and shivering.", update: (k) => {
        const sc = 1 - k * 0.8;
        sh.g.scale.setScalar(Math.max(0.2, sc));
      } },
      { dur: 4.6, from: [H0.x + 4, y + 1.6, H0.z + 4], look: [H0.x, y + 0.6, H0.z], who: "Sprig (whispering)", text: "“Thistle… it's not a monster. It's SCARED. It was eating the light because it's afraid of the dark!”" },
      { dur: 4.6, from: [H0.x + 4, y + 1.6, H0.z + 4], look: [H0.x, y + 0.6, H0.z], who: "Moonkeeper Corin", text: "“All these years we fought it… and all it needed was a little light of its own. You've done what four hundred years of Moonkeepers could not.”" },
      { dur: 4, from: [H0.x, y + 6, H0.z + 14], look: [H0.x, y + 3, H0.z - 10], text: "The Heartstone blazes white. Far above, all across the Great Forest, every moonstone shines brighter than it ever has." },
      { dur: 4, black: true, gameCam: true, who: "🌑 PHASE 13 COMPLETE", text: "The Shadow Under the Roots\n🪙 150 · 💠 Heartstone Shard (your hearts heal on their own!) — and new LIFE GOALS!" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        const s = p13();
        s.done = true;
        s.step = 4;
        const c = C();
        c.coins = (c.coins || 0) + 150;
        (c.owned ||= {}).heartstone = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("💠 The little Shadow — they call it Gloam — sleeps by the Heartstone now, warm in the light. Your LIFE GOALS II are in the list (top right)!", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 13) return null;
    const s = p13();
    if (ctx.world() === "roothaven") {
      buildDescent();
      if (descent && near(descent.x, descent.z, 3.4)) return { label: s.done ? "climb down the Great Descent to the Underglow 🌑" : "climb down the Great Descent 🌑", act: enterUnderglow };
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    if (near(UG.arrive.x, UG.arrive.z, 4)) return { label: "climb the root-stair back up to Roothaven", act: leaveUnderglow };
    if (s.step === 2) {
      for (const [k, icon, where] of LANTERNS) {
        const L = lanternObjs[k];
        if (!L || s.lanterns[k] || !near(L.x, L.z, 2.4) || Math.abs(me().y - L.y) > 2.2) continue;
        return { label: `relight the lost lantern of ${where} ${icon}`, act: () => {
          s.lanterns[k] = true;
          light = 100;
          const n = Object.keys(s.lanterns).length;
          if (n >= 3) s.step = 3;
          save();
          redraw();
          chime();
          ctx.say(n >= 3 ? "🏮 All three lanterns burn again! Now — the Shadow's Hollow, deep in the south. Light the five braziers!" : `🏮 The lantern of ${where} blazes up! (${n}/3)`, true);
        } };
      }
    }
    if (s.step === 3) {
      for (let i = 0; i < Z.braziers.length; i++) {
        const b = Z.braziers[i];
        if (s.lit[i] || !near(b.x, b.z, 2.6)) continue;
        return { label: "light the brazier 🔥", act: () => {
          s.lit[i] = true;
          light = Math.min(100, light + 40);
          const n = Object.keys(s.lit).length;
          save();
          redraw();
          chime();
          if (n >= 5) finale(Z);
          else ctx.say(`🔥 ${n}/5 — the Shadow flinches from the light… and sweeps FASTER!`);
        } };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t) {
    // (Life Goals are OPTIONAL: the story carries on a little while after Phase 12 begins)
    if (st.phase === 12 && st.p12 && st.p12.started && !p13().started && !ctx.playing() && ctx.quadMouse()) {
      p13Wait = (p13Wait || 0) + dt;
      if (p13Wait > 90 || st.p12.legend) begin();
    }
    if (st.phase < 13) return;
    const s = p13();
    if (ctx.world() === "roothaven") buildDescent();
    const Z = zone();
    if (!Z) {
      meterEl.style.display = "none";
      showBeacon(ctx.world() === "roothaven" ? ctx.roothaven.group : null, target());
      return;
    }
    buildInZone(Z);
    showBeacon(Z.group, s.done ? null : target());
    if (beacon.visible) beacon.children[1].scale.setScalar(3 + Math.sin(t * 3) * 0.4);
    const p = me();
    // ghosts bob gently; lanterns + braziers show what's lit
    ghosts.forEach((g, i) => (g.position.y = Z.height(g.position.x, g.position.z) + 0.15 + Math.sin(t * 1.5 + i) * 0.12));
    for (const [k] of LANTERNS) {
      const L = lanternObjs[k];
      if (!L) continue;
      const on = !!s.lanterns[k];
      L.flame.visible = L.light.visible = on;
      L.cage.material.color.setHex(on ? 0xffe8a0 : 0x3a3a4a);
    }
    Z.braziers.forEach((b, i) => b.set(!!s.lit[i]));
    const sh = Z.shadow;
    if (s.done) {
      sh.g.scale.setScalar(0.2);
      sh.arm.visible = false;
      Z.heartstone.m.material.opacity = 0.95;
      Z.heartstone.glow.material.opacity = 0.9;
    }
    if (ctx.playing()) return;
    // the camp
    if (s.step === 1 && near(UG.camp.x, UG.camp.z, 9)) {
      s.step = 1.5; // (only once)
      campScene(Z);
      return;
    }
    // 💡 your light
    hitCool -= dt;
    const glowNear =
      near(UG.camp.x, UG.camp.z, 9) ||
      LANTERNS.some(([k]) => s.lanterns[k] && lanternObjs[k] && near(lanternObjs[k].x, lanternObjs[k].z, 6)) ||
      Z.caps.some((c) => near(c.x, c.z, 2.8)) ||
      Z.braziers.some((b, i) => s.lit[i] && near(b.x, b.z, 5)) ||
      (Z.mazePath && Z.mazePath.some((m) => near(m.x, m.z, 1.6))) ||
      s.done;
    const M = Z.maze;
    const inMaze = p.x > M.x0 && p.x < M.x0 + M.n * M.cs && p.z > M.z0 && p.z < M.z0 + M.n * M.cs;
    if (glowNear) light = Math.min(100, light + dt * 30);
    else light -= dt * (inMaze ? 1.3 : 0.9) * ((C().owned || {}).moonmothlantern ? 0.5 : 1) * ((C().owned || {}).renatastar ? 0 : 1); // (🌟 Renata's Star: your light never fades) // (🦋 the Moon Moth Lantern: light lasts twice as long)
    drawMeter();
    // the wisps drink your light
    for (const w of Z.wisps) {
      if (hitCool > 0) break;
      const d = Math.hypot(p.x - w.x, p.z - w.z);
      if (d < 1.4 && !(window.__wwCalm && window.__wwCalm())) { // (😌 the Song of Calm stills them)
        hitCool = 1.2;
        light -= 35; // (the wisps drink a LOT of light — keep clear of them!)
        p.x += ((p.x - w.x) / (d || 1)) * 3;
        p.z += ((p.z - w.z) / (d || 1)) * 3;
        ctx.say("🌫️ A shadow-wisp brushes past — your light gutters! Keep clear of them!");
      }
    }
    // the Mirror Lake: fall in, and the ghosts fish you out
    if (p.y < -8) {
      light -= 15;
      ctx.placePlayer(UG.lake.x, UG.lake.z - UG.lake.r - 3, 0);
      fadeThrough(() => {}, 0.3);
      ctx.say("🪞 SPLASH — into the dark water! Pale paws pull you back to the shore. (Don't stand still on the stones!)", true);
    }
    // the Shadow: its arm sweeps the Hollow, faster with every brazier lit
    if (!s.done) {
      const lit = Object.keys(s.lit).length;
      sh.armAng += dt * (0.55 + lit * 0.22);
      sh.arm.rotation.y = sh.armAng;
      sh.body.rotation.y = sh.armAng * 0.3;
      sh.body.scale.set(1 - lit * 0.06, 1.15 - lit * 0.07, 1 - lit * 0.06);
      const H0 = UG.hollow;
      const dx = p.x - H0.x;
      const dz = p.z - H0.z;
      const d = Math.hypot(dx, dz);
      if (s.step >= 3 && d > 4 && d < 16.5 && hitCool <= 0) {
        // (the arm points along +z of its group, rotated by armAng)
        const armDir = sh.armAng;
        const youDir = Math.atan2(dx, dz);
        let diff = Math.atan2(Math.sin(youDir - armDir), Math.cos(youDir - armDir));
        if (Math.abs(diff) < Math.atan(1.3 / d) + 0.05) {
          hitCool = 1.6;
          light -= 20;
          ctx.placePlayer(H0.x + (dx / d) * 20, H0.z + (dz / d) * 20, Math.atan2(-dx, -dz));
          fadeThrough(() => {}, 0.25);
          ctx.say("🌑 WHOOSH — the Shadow's arm sweeps you clean out of the Hollow! Time it — run in BEHIND the arm.", true);
        }
      }
    }
    // out of light → the ghosts carry you back to camp
    if (light <= 0) {
      light = 100;
      ctx.hurt(10);
      ctx.placePlayer(UG.camp.x + 4, UG.camp.z + 4, 0);
      fadeThrough(() => {}, 0.5);
      ctx.say("💡 The dark closes in… and cold, kind paws carry you back to the Moonkeepers' fire.", true);
    }
  }

  // ---------------------------------------------------------------- the list (top right)
  function panelHTML() {
    const s = p13();
    if (s.done) return goals2HTML();
    return storyHTML();
  }
  function goals2HTML() {
    {
      const rows = GOALS2.map((g) => {
        const h = Math.min(g.need, g.have(C(), st));
        const done = h >= g.need;
        return `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${g.icon} ${g.name}${g.need > 1 ? ` <span class="res">(${h}/${g.need})</span>` : ""}</li>`;
      });
      const n = GOALS2.filter((g) => g.have(C(), st) >= g.need).length;
      return `<h3>🌟 Life Goals II (${n}/${GOALS2.length}) <small style="font:12px system-ui;opacity:.75">— optional, just for fun!</small></h3><ul>${rows.join("")}</ul><div class="kit">💠 Hero of the Underglow · 🧑‍🎓 H — ask Sprig</div>`;
    }
  }
  function storyHTML() {
    const s = p13();
    const n = Object.keys(s.lanterns).length;
    const lit = Object.keys(s.lit).length;
    const step = s.step;
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌑 The Shadow Under the Roots</h3><ul>
      ${row(step >= 1, "Answer Oriel's call — the Great Descent (Roothaven)")}
      ${row(step >= 2, "Find the lost Moonkeepers' camp")}
      ${row(step >= 3, `Relight the three lost lanterns <span class="res">(${n}/3)</span>`)}
      ${step >= 2 && step < 3 ? LANTERNS.map(([k, icon, where]) => `<div class="sub ${s.lanterns[k] ? "done" : ""}">&nbsp;&nbsp;${s.lanterns[k] ? "✔" : "○"} ${icon} ${where}</div>`).join("") : ""}
      ${row(false, `Light the five braziers round the Shadow <span class="res">(${lit}/5)</span>`)}
    </ul><div class="kit">💡 Your light fades in the dark — glowing things refill it</div>`;
  }
  return { update, interactable, panelHTML, goals2HTML, done: () => !!p13().done, goal: () => null, start: () => begin() };
}
