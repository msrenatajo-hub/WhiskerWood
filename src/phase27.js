// ------------------------------------------------------------
//  🐚  PHASE 27 — "The Sunken City of Coralmere"
//
//  Reedmere's lagoon has been glowing at night, and the fisher-mice hear
//  singing under the water. An old diving bell takes you down — in a
//  pearl-glass bubble helmet — to CORALMERE, a sunken city of sea-mice.
//    1. 👑 Meet Queen Pearlfin in her spiral-shell palace
//    2. 🔮 Light the city's five pearl lamps (two hide in the kelp forest)
//    3. 🐢 Ride Shelby the sea turtle across the bottomless trench
//    4. 🐋 Blow the three great conch shells round the sleeping whale,
//          Old Barnacle — and wake him, so the Tide Gate opens again
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { CORAL } from "./questZones.js";

registerKeepsake("queenspearl", "🦪", "Queen Pearlfin's Pearl (friend of Coralmere)");
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });

export function initPhase27(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p27 = () => (st.p27 ||= { started: false, met: false, lamps: {}, crossed: false, conchs: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "coral" ? ctx.city() : null);
  let wait = 0;

  // ---------------------------------------------------------------- the diving bell in Reedmere
  let bell = null;
  function reedmereBell() {
    const c = ctx.city();
    if (!c || c.id !== "reedmere") return null;
    if (bell && bell.c === c) return bell;
    const a = c.spots.arrive;
    const x = a.x - 5;
    const z = a.z - 4;
    const y = c.height(x, z);
    const g = new THREE.Group();
    const brass = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.5, roughness: 0.35, flatShading: true });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), brass);
    dome.position.y = 1.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 6, 18), brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.05;
    for (const sx of [-0.55, 0.55]) {
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), new THREE.MeshBasicMaterial({ color: 0x9fe0ff }));
      win.position.set(sx, 1.9, 1.08);
      g.add(win);
    }
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 12), brass);
    hook.position.y = 2.9;
    g.add(dome, ring, hook, (() => { const h = glow(0x9fe8ff, 3, 0.6); h.position.y = 1.9; return h; })());
    g.position.set(x, y, z);
    c.group.add(g);
    return (bell = { c, x, z });
  }

  // ---------------------------------------------------------------- the people of Coralmere
  let folk = null;
  function buildFolk(Z) {
    if (folk && folk.Z === Z) return folk;
    const P = CORAL.palace;
    const queen = buildThistle({ tunicColor: 0xc8a8e8, hoodColor: 0xf0e0ff, pack: false });
    queen.scale.setScalar(1.25);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0x8a6a10 }));
    crown.position.y = 0.95;
    queen.add(crown);
    const qx = P.x;
    const qz = P.z + 8;
    queen.position.set(qx, Z.height(qx, qz), qz);
    Z.group.add(queen);
    // Shelby the sea turtle
    const turtle = buildTurtle();
    const T = CORAL.turtle;
    turtle.position.set(T.x, Z.height(T.x, T.z) + 0.4, T.z);
    Z.group.add(turtle);
    // a few sea-mice round the square
    for (let k = 0; k < 6; k++) {
      const m = buildThistle({ tunicColor: [0x4ad8c8, 0xff8a9a, 0x8ac8ff][k % 3], hoodColor: 0xe8f8ff, pack: false });
      const a = (k / 6) * Math.PI * 2;
      const x = P.x + Math.cos(a) * 12;
      const z = P.z + 12 + Math.sin(a) * 6;
      m.position.set(x, Z.height(x, z), z);
      m.rotation.y = Math.atan2(qx - x, qz - z);
      Z.group.add(m);
    }
    return (folk = { Z, queen, qx, qz, turtle });
  }
  function buildTurtle() {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0x4a8a5a));
    shell.scale.set(1, 0.6, 1.25);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 6, 20), M(0x6aa86a));
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1, 1.25, 1);
    for (let i = 0; i < 6; i++) {
      const plate = new THREE.Mesh(new THREE.CircleGeometry(0.35, 6), M(0x8ac87a));
      plate.position.set(Math.cos(i) * 0.8, 0.85, Math.sin(i) * 0.9);
      plate.rotation.x = -Math.PI / 2.4;
      g.add(plate);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M(0x9ac88a));
    head.position.set(0, 0.2, 2.2);
    for (const sx of [-0.2, 0.2]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), M(0x101010));
      eye.position.set(sx, 0.38, 2.55);
      g.add(eye);
    }
    const flips = [];
    for (const [fx, fz] of [[-1.5, 1], [1.5, 1], [-1.2, -1.2], [1.2, -1.2]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.6), M(0x9ac88a));
      f.position.set(fx, 0, fz);
      g.add(f);
      flips.push({ f, sx: Math.sign(fx) });
    }
    g.add(shell, rim, head);
    g.userData.flips = flips;
    return g;
  }

  // ---------------------------------------------------------------- 🐢 riding Shelby
  let ride = null;
  const camPos = new THREE.Vector3();
  function startRide() {
    const Z = zone();
    const F = folk;
    if (!Z || !F) return;
    ride = { speed: 0, alt: 3 };
    F.turtle.visible = true;
    ctx.setFlight(rideStep);
    ctx.setFlightCam(rideCam);
    camPos.set(0, 0, 0);
    ctx.say("🐢 Shelby paddles up off the sand with you on her shell! W swim · A/D turn · Space up · Shift down · E to climb off (only over solid ground!)", true);
  }
  function endRide() {
    if (!ride) return;
    const p = me();
    const Z = zone();
    if (Z && Z.inTrench(p.x, p.z)) return ctx.say("🐢 Not here — there's no bottom to this trench! Swim to solid ground first.", true);
    ride = null;
    ctx.setFlight(null);
    ctx.setFlightCam(null);
    if (Z) p.y = Z.height(p.x, p.z);
    ctx.say("🐢 You slide off Shelby's shell onto the sand.");
  }
  function rideCam(dt) {
    const p = me();
    const yaw = ctx.mouseRig.rotation.y;
    const want = new THREE.Vector3(p.x - Math.sin(yaw) * 9, p.y + 4, p.z - Math.cos(yaw) * 9);
    if (camPos.lengthSq() === 0) camPos.copy(want);
    camPos.lerp(want, Math.min(1, dt * 3));
    ctx.camera.position.copy(camPos);
    ctx.camera.lookAt(p.x + Math.sin(yaw) * 5, p.y + 0.5, p.z + Math.cos(yaw) * 5);
    return true;
  }
  function rideStep(dt, keys) {
    const R = ride;
    const Z = zone();
    if (!R || !Z) return;
    const p = me();
    const rig = ctx.mouseRig;
    const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
    rig.rotation.y += turn * dt * 1.3;
    const want = keys.KeyW || keys.ArrowUp ? 11 : keys.KeyS || keys.ArrowDown ? -3 : 0;
    R.speed += (want - R.speed) * Math.min(1, dt * 1.2);
    p.x += Math.sin(rig.rotation.y) * R.speed * dt;
    p.z += Math.cos(rig.rotation.y) * R.speed * dt;
    if (keys.Space) R.alt = Math.min(18, R.alt + dt * 5);
    if (keys.ShiftLeft || keys.ShiftRight) R.alt = Math.max(1.2, R.alt - dt * 6);
    // over the trench, the "ground" is the trench rim height (it's water all the way down)
    const g = Z.inTrench(p.x, p.z) ? 0 : Z.height(p.x, p.z);
    p.y += (g + R.alt - p.y) * Math.min(1, dt * 2.5);
    const d = Math.hypot(p.x, p.z);
    if (d > 105) {
      p.x *= 105 / d;
      p.z *= 105 / d;
    }
    // Shelby under you, flippers paddling
    const T = folk.turtle;
    T.position.set(p.x, p.y - 0.75, p.z);
    T.rotation.y = rig.rotation.y;
    const t = performance.now() / 1000;
    T.userData.flips.forEach(({ f, sx }, i) => (f.rotation.z = sx * Math.sin(t * 4 + (i > 1 ? 1.5 : 0)) * 0.5));
    const s = p27();
    if (!s.crossed && p.z < CORAL.trench.z1 - 3) {
      s.crossed = true;
      save();
      redraw();
      chime();
      ctx.say("🐢 Across the trench! There he is — OLD BARNACLE, the giant whale, fast asleep in front of the Tide Gate. Climb off (E) and blow the three great conch shells!", true);
    }
  }

  // ---------------------------------------------------------------- begin
  function begin() {
    p27().started = true;
    st.phase = 27;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, who: "A letter from Harbormaster Brindle", text: "“Thistle — strange things in Reedmere. The lagoon GLOWS at night now, and the fisher-mice swear they hear singing, deep under the water.”" },
      { dur: 4.6, black: true, gameCam: true, who: "A letter from Harbormaster Brindle", text: "“My grandmother told of a city down there — CORALMERE, home of the sea-mice — lost when a giant whale fell asleep across its gate. I've found the old diving bell. Will you go down?”" },
      { dur: 4, black: true, gameCam: true, who: "Sprig", text: "“A city UNDER the water? …Do they have pearl-glass helmets? Please say they have pearl-glass helmets.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🐚 PHASE 27 — The Sunken City of Coralmere. Go to Reedmere and climb into the brass diving bell by the harbour!", true) },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 27) return null;
    const s = p27();
    const w = here();
    if (w === "reedmere") {
      const B = reedmereBell();
      if (B && near(B.x, B.z, 2.6)) return { label: "climb into the diving bell — down to Coralmere 🐚", act: dive };
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    const F = buildFolk(Z);
    if (ride) return { label: "climb off Shelby 🐢", act: endRide };
    if (near(CORAL.arrive.x, CORAL.arrive.z + 4, 3)) return { label: "swim up through the bubble gate to Reedmere 🫧", act: () => fadeThrough(() => {
      ctx.goCity("reedmere");
      const a = ctx.city().spots.arrive;
      ctx.placePlayer(a.x - 3, a.z - 1, 0);
    }, 1) };
    if (s.done) return null;
    if (!s.met && near(F.qx, F.qz, 3.2)) return { label: "bow to Queen Pearlfin 👑", act: meetQueen };
    if (s.met) {
      for (let i = 0; i < CORAL.lamps.length; i++) {
        const L = CORAL.lamps[i];
        if (s.lamps[i] || !near(L.x, L.z, 2.6)) continue;
        return { label: "light the pearl lamp 🔮", act: () => {
          s.lamps[i] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(s.lamps).length;
          ctx.say(`🔮 The pearl blooms with soft silver light — and the coral round it glows! (${n}/5)${n >= 5 ? " All five! Now find Shelby the sea turtle by the palace — only she can cross the trench." : ""}`, true);
        } };
      }
      const T = CORAL.turtle;
      if (Object.keys(s.lamps).length >= 5 && near(F.turtle.position.x, F.turtle.position.z, 3)) return { label: "climb onto Shelby the sea turtle 🐢", act: startRide };
      if (s.crossed) {
        for (let i = 0; i < CORAL.conchs.length; i++) {
          const c = CORAL.conchs[i];
          if (s.conchs[i] || !near(c.x, c.z, 3.2)) continue;
          return { label: "blow the great conch shell 🐚", act: () => blowConch(i) };
        }
      }
      void T;
    }
    return null;
  }
  function dive() {
    fadeThrough(() => {
      ctx.goCity("coral");
      ctx.placePlayer(CORAL.arrive.x, CORAL.arrive.z, Math.PI);
      const s = p27();
      ctx.say(s.done
        ? "🐚 Coralmere! The pearl lamps glow, the Tide Gate shines — and the sea-mice wave hello."
        : s.met
        ? "🐚 Back in Coralmere — the pearl lamps are waiting (the list, top right)."
        : "🫧 Down, down, down… and the diving bell opens onto CORALMERE! Your pearl-glass helmet lets you breathe. Find Queen Pearlfin at the great spiral-shell palace.", true);
    }, 1.2);
  }
  function meetQueen() {
    const s = p27();
    const F = folk;
    const y = zone().height(F.qx, F.qz);
    playCutscene([
      { dur: 4.6, from: [F.qx + 3, y + 2.2, F.qz + 4], look: [F.qx, y + 1.3, F.qz], who: "Queen Pearlfin", text: "“A surface-mouse — in a pearl helmet! Welcome to Coralmere, little Moonkeeper. You've come in our darkest hour.”" },
      { dur: 5, from: [F.qx + 3, y + 2.2, F.qz + 4], look: [F.qx, y + 1.3, F.qz], who: "Queen Pearlfin", text: "“Long ago Old Barnacle, the great whale, swam to our Tide Gate for a nap… and never woke. With the gate blocked, the warm currents stopped, and our pearl lamps went dark one by one.”" },
      { dur: 4.8, from: [F.qx + 3, y + 2.2, F.qz + 4], look: [F.qx, y + 1.3, F.qz], who: "Queen Pearlfin", text: "“Relight our five pearl lamps — two are lost in the kelp forest — and Shelby the sea turtle will carry you across the trench. Then… wake the whale. Gently!”" },
      { dur: 0.4, gameCam: true, end: () => {
        s.met = true;
        save();
        redraw();
        chime();
        ctx.say("🔮 Light Coralmere's five pearl lamps (E). Two are hidden in the swaying kelp forest!", true);
      } },
    ]);
  }
  function blowConch(i) {
    const s = p27();
    s.conchs[i] = true;
    save();
    redraw();
    chime();
    hoot(i);
    const n = Object.keys(s.conchs).length;
    if (n < 3) return ctx.say(`🐚 HOOOOOOO… the conch's song rolls through the water. Old Barnacle's tail twitches. (${n}/3)`, true);
    wake();
  }
  function hoot(i) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime([98, 110, 82][i] || 98, ac.currentTime);
      o.frequency.linearRampToValueAtTime(([98, 110, 82][i] || 98) * 1.06, ac.currentTime + 1.6);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 600;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.2, ac.currentTime + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);
      o.connect(lp).connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 2.1);
      setTimeout(() => ac.close(), 2500);
    } catch {}
  }
  function wake() {
    const s = p27();
    const Z = zone();
    const W = CORAL.whale;
    const y = CORAL.plateau.y;
    const Wh = Z.whale;
    playCutscene([
      { dur: 4.4, from: [W.x + 34, y + 14, W.z + 30], look: [W.x, y + 6, W.z], text: "The third conch's song fades… and the whole sea floor RUMBLES. Sand pours off Old Barnacle's back like a waterfall." },
      { dur: 4.4, from: [W.x + 16, y + 9, W.z + 24], look: [W.x + 8, y + 7, W.z + 14], text: "One enormous eye opens — blinks — and looks right at you. Then, from somewhere deep inside the whale, comes a long, slow, beautiful SONG.", run: () => {
        (Wh.userData.eyes || []).forEach((e) => (e.visible = true));
        (Wh.userData.lids || []).forEach((l) => (l.visible = false));
        whaleSong();
      } },
      { dur: 5, from: [W.x + 40, y + 20, W.z + 20], look: [W.x, y + 14, W.z - 30], who: "Old Barnacle (in a voice like the tide)", text: "“Ohhh… what a nap. Was I in your way, little ones? I'm so sorry.” — and with one great sweep of his tail he rises, gliding up and away through the open Tide Gate.", update: (k) => {
        Wh.position.y = y + k * 30;
        Wh.position.z = W.z - k * 40;
        Wh.rotation.x = -k * 0.4;
        Z.gateLight.material.opacity = k * 0.5;
      }, end: () => {
        Wh.visible = false;
        Z.gateLight.material.opacity = 0.5;
      } },
      { dur: 4.6, black: true, gameCam: true, who: "Queen Pearlfin", text: "“The warm currents are flowing again! Every pearl in Coralmere is shining! Thistle Mosswhisker — take my own pearl. You'll always have a home beneath the waves.”" },
      { dur: 4, black: true, gameCam: true, who: "🐚 PHASE 27 COMPLETE", text: "The Sunken City of Coralmere\n🪙 700 · 🦪 Queen Pearlfin's Pearl" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 700;
        (c.owned ||= {}).queenspearl = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🐚 Coralmere shines again! (Queen Pearlfin's Pearl: you hold your breath longer underwater.) Ride Shelby back, then the bubble gate takes you home.", true);
      } },
    ]);
  }
  function whaleSong() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [55, 62, 59, 67, 64, 57];
      notes.forEach((n, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        const t0 = ac.currentTime + i * 0.7;
        o.frequency.setValueAtTime(440 * Math.pow(2, (n - 69) / 12), t0);
        o.frequency.linearRampToValueAtTime(440 * Math.pow(2, (n + 2 - 69) / 12), t0 + 0.9);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.18, t0 + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
        o.connect(g).connect(ac.destination);
        o.start(t0);
        o.stop(t0 + 1.5);
      });
      setTimeout(() => ac.close(), 6000);
    } catch {}
  }

  // ---------------------------------------------------------------- each frame
  function update(dt) {
    if (st.phase === 26 && st.p26 && st.p26.done && !p27().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 27) return;
    if (here() === "reedmere") reedmereBell();
    const Z = zone();
    if (!Z) {
      if (ride) {
        ride = null;
        ctx.setFlight(null);
        ctx.setFlightCam(null);
      }
      return;
    }
    const s = p27();
    const F = buildFolk(Z);
    // the pearl lamps glow once lit
    Z.lamps.forEach((L, i) => {
      const on = !!s.lamps[i] || s.done;
      L.halo.visible = on;
      L.pearl.material.color.set(on ? 0xffffff : 0x8a8a96);
      L.pearl.material.emissive && L.pearl.material.emissive.set(on ? 0x9fd8ff : 0x000000);
    });
    Z.conchs.forEach((c, i) => (c.halo.material.opacity = s.conchs[i] ? 0.9 : 0.4));
    if (s.done) {
      Z.whale.visible = false;
      Z.gateLight.material.opacity = 0.5;
    }
    // Shelby waits by the palace (when you're not riding her)
    if (!ride) {
      const T = CORAL.turtle;
      if (!s.crossed || Math.hypot(F.turtle.position.x - T.x, F.turtle.position.z - T.z) < 1) F.turtle.position.y = Z.height(T.x, T.z) + 0.4 + Math.sin(performance.now() / 700) * 0.15;
    }
    // fell into the trench? the current carries you back up
    if (!ride && me().y < -12) {
      ctx.placePlayer(0, CORAL.trench.z0 + 6, Math.PI);
      ctx.say("🌊 Whoosh — a current carries you back up out of the trench! It's bottomless — you'll need Shelby the sea turtle to cross.", true);
    }
  }

  function panelHTML() {
    const s = p27();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = Object.keys(s.lamps).length;
    return `<h3>🐚 The Sunken City of Coralmere</h3><ul>
      ${row(s.met, "Dive down in Reedmere's diving bell and meet Queen Pearlfin")}
      ${row(n >= 5, `Light the five pearl lamps <span class="res">(${n}/5)</span><div class="sub">&nbsp;&nbsp;two are hidden in the kelp forest</div>`)}
      ${row(s.crossed, "Ride Shelby the sea turtle across the trench")}
      ${row(s.done, `Wake the whale — blow the three great conchs <span class="res">(${Object.keys(s.conchs).length}/3)</span>`)}
    </ul><div class="kit">🫧 your pearl helmet lets you breathe · 🐢 on Shelby: W swim · Space up · Shift down</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p27().done };
}
