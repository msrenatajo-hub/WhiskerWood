// ------------------------------------------------------------
//  🏆  PHASE 32 — "Dragon Races: the Sky Cup"
//
//  The wild sky dragons have come down from the clouds with a challenge:
//  the SKY CUP, raced through the great canyon on Pip's back — steered with
//  the MOUSE only. Three cups, against your dragonlings and the wild dragons:
//    🥉 BRONZE — the Canyon Circuit: two laps round the beacon-lit track
//    🥈 SILVER — the Star Chase: catch more of the floating stars than any
//       rival (they snatch the ones they fly through!)
//    🥇 GOLD — the Rings: fly through every ring in order — MISS ONE and
//       you're out! (storm winds blow you off course)
//    🏁 come FIRST (or, in the Star Chase, catch the MOST) to win a cup
//  Win all three for the Sky Cup.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { SKYCUP } from "./questZones.js";
import { DRAGON_DESTS, makeDragon } from "./more3.js";
import { glowTexture } from "./phase2.js";
import { signBoard } from "./signs.js";
import { steerStart, steerStop, steerPitch } from "./mouseSteer.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("skycup", "🏆", "The Sky Cup (champion of the dragon races)");
ITEM_POWERS.skycup = { type: "jump", n: 0.08 };

const CUPS = [
  { key: "bronze", mode: "track", name: "the Bronze Cup", title: "the Canyon Circuit", icon: "🥉", laps: 2, rings: 0, wind: 0, rivals: [15.5, 17.5], wild: 0 },
  { key: "silver", mode: "stars", name: "the Silver Cup", title: "the Star Chase", icon: "🥈", laps: 1, stars: 24, rings: 0, wind: 1.2, rivals: [15, 17], wild: 1 },
  { key: "gold", mode: "rings", name: "the Gold Cup", title: "the Rings", icon: "🥇", laps: 1, rings: 10, ringR: 3.6, move: 0, wind: 2.5, rivals: [17, 18.5], wild: 0 },
];
const GATES = 12; // (invisible checkpoints round each lap — no cutting corners!)
const WINDS = [[0.18, 0.28], [0.5, 0.6], [0.78, 0.86]]; // (stretches of the course where storm winds blow)

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase32(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p32 = () => (st.p32 ||= { started: false, been: false, cups: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "skycup" ? ctx.city() : null);
  let wait = 0;
  let race = null;
  const K = SKYCUP;

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("skycup");
      ctx.placePlayer(K.start.x, K.start.z, Math.PI);
      const s = p32();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(p32().done
        ? "🏆 The Sky Cup Canyon — race any cup again, any time (E on the start rock)."
        : "🏆 THE SKY CUP CANYON! Stand on the start rock and press E to race — steer Pip with the MOUSE. Bronze: a race round the track · Silver: the Star Chase · Gold: the Rings.", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "skycup", icon: "🏆", name: "The Sky Cup Canyon — the dragon races", when: () => st.phase >= 32, go: goThere });

  function begin() {
    p32().started = true;
    st.phase = 32;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "A shadow sweeps over the cottage — then another, and another. WILD SKY DRAGONS, dozens of them, circling down out of the clouds." },
      { dur: 5, black: true, gameCam: true, who: "Thunderwing, the wild dragons' champion", text: "“Little mouse! Rider of the storm-dragon! We have heard of you. Once in a hundred years we race for the SKY CUP — through the great canyon, between the mountains. Dare you race against us?”" },
      { dur: 4.6, black: true, gameCam: true, who: "Thunderwing", text: "“Three cups. BRONZE: twice round the canyon, first home wins. SILVER: the Star Chase — catch more stars than any of us. GOLD: the Rings — miss one and you are out! Win all three… and the Sky Cup is yours.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🏆 PHASE 32 — Dragon Races! Go outside and press 1 — fly to the Sky Cup Canyon.", true) },
    ]);
  }

  // ---------------------------------------------------------------- the race
  const tangentAt = (u) => K.curve.getTangentAt(((u % 1) + 1) % 1);
  const pointAt = (u) => K.curve.getPointAt(((u % 1) + 1) % 1);
  function startRace(cup) {
    const Z = zone();
    const s = p32();
    const objs = [];
    // the rings
    const rings = [];
    for (let k = 0; k < cup.rings; k++) {
      const u = (k + 1) / (cup.rings + 1);
      const P = pointAt(u), T = tangentAt(u);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(cup.ringR, 0.25, 8, 28), new THREE.MeshBasicMaterial({ color: k === cup.rings - 1 ? 0xffffff : 0xffd040 }));
      ring.position.copy(P);
      ring.lookAt(P.clone().add(T));
      Z.group.add(ring);
      objs.push(ring);
      const side = new THREE.Vector3(-T.z, 0, T.x).normalize();
      rings.push({ ring, base: P.clone(), T, side, ph: k * 1.3 });
    }
    // 🥉 the track: red-and-white beacons down both edges, a START · FINISH banner
    if (cup.mode !== "rings") {
      for (let k = 0; k < 64; k++) {
        const u = k / 64;
        const P = pointAt(u), T = tangentAt(u);
        const side = new THREE.Vector3(-T.z, 0, T.x).normalize();
        for (const sx of [-1, 1]) {
          const b = glow(k % 2 ? 0xffffff : 0xff4a3a, 2.2, 0.9);
          b.position.copy(P).addScaledVector(side, sx * 8);
          Z.group.add(b);
          objs.push(b);
        }
      }
      const P0 = pointAt(0), T0 = tangentAt(0);
      const banner = signBoard("🏁 START · FINISH 🏁", { w: 12, h: 2, style: "gold" });
      banner.position.copy(P0).add(new THREE.Vector3(0, 7, 0));
      banner.lookAt(banner.position.clone().sub(T0));
      Z.group.add(banner);
      objs.push(banner);
    }
    // the next checkpoint: a big soft hoop (just fly near it)
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 6, 32), new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.35, depthWrite: false }));
    hoop.visible = cup.mode !== "rings";
    Z.group.add(hoop);
    objs.push(hoop);
    // 🥈 the stars
    const stars = [];
    if (cup.mode === "stars") {
      for (let k = 0; k < cup.stars; k++) {
        const u = (k + 0.7) / (cup.stars + 0.5);
        const P = pointAt(u), T = tangentAt(u);
        const side = new THREE.Vector3(-T.z, 0, T.x).normalize();
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshBasicMaterial({ color: 0xffe040 })), glow(0xffd040, 3.2, 0.9));
        g.position.copy(P).addScaledVector(side, Math.sin(k * 2.3) * 5).add(new THREE.Vector3(0, Math.cos(k * 1.7) * 3, 0));
        Z.group.add(g);
        objs.push(g);
        stars.push({ g, taken: null });
      }
    }
    // the wind: streaks of cloud blowing across those stretches
    const streaks = [];
    if (cup.wind) for (const [a, b] of WINDS) for (let k = 0; k < 14; k++) {
      const g = glow(0xe8f0ff, 3, 0.5);
      g.material.blending = THREE.NormalBlending;
      g.userData = { u: a + Math.random() * (b - a), off: Math.random() * 10 };
      Z.group.add(g);
      objs.push(g);
      streaks.push(g);
    }
    // the rivals: your dragonlings, and (Silver/Gold) wild sky dragons
    const names = (st.p23 && st.p23.names) || {};
    const RIV = [
      { name: names.dawn || "Blaze", hue: 0.07 }, { name: "Gust", hue: 0.58 }, { name: names.frost || "Hailstone", hue: 0.55, pale: true }, { name: names.jade || "Thicket", hue: 0.33 },
      { name: "Thunderwing", hue: 0.75 }, { name: "Stormclaw", hue: 0.0, pale: true },
    ].slice(0, 4 + cup.wild);
    const rivals = RIV.map((R, i) => {
      const g = makeDragon ? makeDragon(2) : new THREE.Group();
      g.traverse((o) => {
        if (!o.material || !o.material.color || o.isSprite) return;
        o.material = o.material.clone();
        const hsl = {};
        o.material.color.getHSL(hsl);
        o.material.color.setHSL(R.hue, R.pale ? 0.35 : Math.min(1, hsl.s + 0.1), R.pale ? Math.min(0.85, hsl.l + 0.35) : hsl.l);
      });
      g.scale.multiplyScalar(0.7);
      Z.group.add(g);
      objs.push(g);
      const [lo, hi] = cup.rivals;
      return { ...R, g, d: -2 - i * 2.5, v: lo + Math.random() * (hi - lo) + (i >= 4 ? 1.2 : 0), lane: cup.mode === "stars" ? Math.sin(i * 2.1) * 5 : (i % 3 - 1) * 2.2, done: null, stars: 0 };
    });
    // Pip, under you
    const pip = makeDragon ? makeDragon(2) : new THREE.Group();
    pip.scale.multiplyScalar(0.7);
    Z.group.add(pip);
    objs.push(pip);
    // start just before the first ring
    const P0 = pointAt(0), T0 = tangentAt(0);
    me().set(P0.x, P0.y, P0.z);
    ctx.mouseRig.rotation.y = Math.atan2(T0.x, T0.z);
    race = { cup, rings, next: 0, prevS: -1, rivals, streaks, objs, pip, t: -3, speed: 0, out: false, finished: false, pitch: 0, gate: 0, hoop, stars, got: 0 };
    const what = cup.mode === "track" ? `twice round the track — follow the beacons, first home wins` : cup.mode === "stars" ? `catch more stars than anyone — the rivals snatch the ones they fly through!` : `${cup.rings} rings — miss one and you're OUT`;
    ctx.say(`${cup.icon} ${cup.name[0].toUpperCase() + cup.name.slice(1)} — ${cup.title}: ${what}. 🖱 Steer with the MOUSE (left/right turn · up/down climb & dive) · W faster. Get ready…`, true);
    const camPos = new THREE.Vector3();
    // 🖱 the race is flown with the mouse only (mouseSteer.js)
    steerStart(ctx.renderer.domElement);
    ctx.setFlight((dt, keys) => {
      if (!race) return;
      const R = race;
      const p = me();
      if (R.t < 0) return; // (the countdown)
      R.speed += ((keys.KeyW || keys.ArrowUp ? 27 : keys.KeyS || keys.ArrowDown ? 10 : 18) - R.speed) * Math.min(1, dt * 1.6);
      // (the mouse turns you — main.js's mouse look spins the rig — and tilts you up and down)
      const yaw = ctx.mouseRig.rotation.y;
      const turn = Math.max(-1, Math.min(1, (yaw - (R.lastYaw ?? yaw)) / Math.max(dt, 0.001) / 2));
      R.lastYaw = yaw;
      R.pitch = steerPitch(dt);
      p.x += Math.sin(yaw) * R.speed * dt;
      p.z += Math.cos(yaw) * R.speed * dt;
      p.y += R.pitch * dt * 12;
      p.y = Math.max(K.floor + 3, Math.min(70, p.y));
      // 🌪️ storm winds push you sideways
      const u = nearestU(p);
      for (const [a, b] of WINDS) if (u > a && u < b) {
        const T = tangentAt(u);
        p.x += -T.z * R.cup.wind * dt;
        p.z += T.x * R.cup.wind * dt;
      }
      // the mesas are solid rock
      for (const m of ctx.city().mesas) {
        const dx = p.x - m.x, dz = p.z - m.z, d = Math.hypot(dx, dz);
        if (d < m.r + 1 && p.y < m.top + 1) {
          p.x = m.x + (dx / (d || 1)) * (m.r + 1);
          p.z = m.z + (dz / (d || 1)) * (m.r + 1);
          R.speed *= 0.5;
        }
      }
      R.pip.position.set(p.x, p.y - 1.1, p.z);
      R.pip.rotation.set(-R.pitch * 0.4, yaw, -turn * 0.35);
    });
    ctx.setFlightCam((dt) => {
      const p = me();
      const yaw = ctx.mouseRig.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 9, p.y + 3.4, p.z - Math.cos(yaw) * 9);
      if (camPos.lengthSq() === 0) camPos.copy(want);
      camPos.lerp(want, Math.min(1, dt * 4));
      ctx.camera.position.copy(camPos);
      ctx.camera.lookAt(p.x + Math.sin(yaw) * 6, p.y + 1, p.z + Math.cos(yaw) * 6);
      return true;
    });
  }
  let hud = null;
  function hudShow(text) {
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "ww-cup-hud";
      hud.style.cssText = "position:fixed;left:50%;top:150px;transform:translateX(-50%);padding:9px 22px;border-radius:14px;background:rgba(20,16,10,.78);color:#ffe6b0;font:900 22px 'Trebuchet MS',sans-serif;z-index:60;pointer-events:none";
      document.body.appendChild(hud);
    }
    hud.style.display = text ? "block" : "none";
    if (text && hud.textContent !== text) hud.textContent = text;
  }
  // (where along the course is this point? — a quick search)
  function nearestU(p) {
    let best = 0, bd = 1e9;
    for (let k = 0; k < 120; k++) {
      const u = k / 120;
      const P = pointAt(u);
      const d = (P.x - p.x) ** 2 + (P.z - p.z) ** 2 + (P.y - p.y) ** 2;
      if (d < bd) [best, bd] = [u, d];
    }
    return best;
  }
  function endRace(msg, won) {
    const R = race;
    race = null;
    steerStop();
    hudShow(null);
    for (const o of R.objs) o.parent && o.parent.remove(o);
    ctx.setFlight(null);
    ctx.setFlightCam(null);
    ctx.placePlayer(K.start.x, K.start.z, Math.PI);
    ctx.say(msg, true);
    if (won) {
      const s = p32();
      s.cups[R.cup.key] = true;
      save();
      redraw();
      chime();
      if (CUPS.every((c) => s.cups[c.key]) && !s.done) setTimeout(finale, 2500);
    }
  }

  function finale() {
    const s = p32();
    const S0 = K.start;
    playCutscene([
      { dur: 4.6, from: [S0.x + 12, S0.y + 6, S0.z + 12], look: [S0.x, S0.y + 2, S0.z], text: "All three cups — Bronze, Silver and Gold. The wild sky dragons land on the mesas all around the canyon, one by one, and bow their great heads." },
      { dur: 5, from: [S0.x + 12, S0.y + 6, S0.z + 12], look: [S0.x, S0.y + 2, S0.z], who: "Thunderwing", text: "“A mouse. A MOUSE has won the Sky Cup. In a thousand years, no one would have believed it. Take it, champion — and know that every dragon of the sky is your friend.”" },
      { dur: 4.4, from: [S0.x - 20, S0.y + 20, S0.z + 30], look: [0, 30, 0], text: "The wild dragons rise together in a great spiral of wings — and roar your name across the canyon." },
      { dur: 4, black: true, gameCam: true, who: "🏆 PHASE 32 COMPLETE", text: "Dragon Races: the Sky Cup\n🪙 1200 · 🏆 The Sky Cup" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1200;
        (c.owned ||= {}).skycup = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🏆 You're the Sky Cup champion! (Race any cup again whenever you like — E on the start rock.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 32) return null;
    const Z = zone();
    if (!Z || race) return null;
    const s = p32();
    if (!near(K.start.x, K.start.z, K.start.r)) return null;
    const next = CUPS.find((c) => !s.cups[c.key]) || CUPS[2];
    const choice = s.done ? CUPS[(Math.floor(performance.now() / 4000)) % 3] : next;
    return { label: `race ${choice.name} ${choice.icon}${s.cups[choice.key] ? " (won!)" : ""}`, act: () => startRace(choice) };
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 31 && st.p31 && st.p31.done && !p32().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z) {
      if (race) {
        for (const o of race.objs) o.parent && o.parent.remove(o);
        race = null;
        hudShow(null);
        steerStop();
        ctx.setFlight(null);
        ctx.setFlightCam(null);
      }
      return;
    }
    // fell off the start rock? the wind lifts you back up
    if (!race && me().y < K.floor + 2) ctx.placePlayer(K.start.x, K.start.z, Math.PI);
    if (!race) return;
    const R = race;
    R.t += dt;
    if (R.t < 0) {
      const n = Math.ceil(-R.t);
      if (n !== R.count) {
        R.count = n;
        ctx.say(`${R.cup.icon} ${n}…`);
      }
      return;
    }
    if (!R.went) {
      R.went = true;
      ctx.say("🏁 GO!!", true);
    }
    const p = me();
    // 🏁 checkpoints (track + stars), and the lap / place / star HUD
    if (R.cup.mode !== "rings") {
      const G = GATES * R.cup.laps;
      const gu = ((R.gate % GATES) + 1) / GATES;
      const GP = pointAt(gu), GT = tangentAt(gu);
      R.hoop.position.copy(GP);
      R.hoop.lookAt(GP.clone().add(GT));
      if (p.distanceTo(GP) < 18) {
        R.gate++;
        if (R.gate >= G) return finishRace();
        if (R.gate % GATES === 0) ctx.say(`🏁 LAP ${R.gate / GATES + 1} of ${R.cup.laps}!`, true);
      }
      if (R.cup.mode === "stars") {
        for (const S0 of R.stars) {
          if (S0.taken) continue;
          S0.g.rotation.y = t * 2;
          if (p.distanceTo(S0.g.position) < 3.2) {
            S0.taken = "you";
            S0.g.visible = false;
            R.got++;
            chime();
            continue;
          }
          for (const rv of R.rivals) if (rv.g.position.distanceTo(S0.g.position) < 3) {
            S0.taken = rv.name;
            S0.g.visible = false;
            rv.stars++;
            break;
          }
        }
        const best = R.rivals.reduce((a, b) => (b.stars > a.stars ? b : a));
        hudShow(`⭐ You: ${R.got}   ·   ${best.name}: ${best.stars}`);
      } else {
        const mine = R.gate / GATES * K.len;
        const place = 1 + R.rivals.filter((rv) => rv.d > mine).length;
        hudShow(`🏁 Lap ${Math.min(R.cup.laps, Math.floor(R.gate / GATES) + 1)}/${R.cup.laps}   ·   ${["1st", "2nd", "3rd", "4th", "5th"][place - 1]} place`);
      }
    }
    // ⭕ the rings (moving ones sway side to side)
    R.rings.forEach((r, i) => {
      const off = R.cup.move ? Math.sin(t * 1.2 + r.ph) * R.cup.move : 0;
      r.ring.position.copy(r.base).addScaledVector(r.side, off);
      r.ring.material.color.setHex(i < R.next ? 0x3a5a3a : i === R.next ? 0xffe040 : 0xd8a83a);
      r.ring.material.transparent = i < R.next;
      r.ring.material.opacity = i < R.next ? 0.25 : 1;
    });
    // through the next ring? (or did you fly past it?)
    const ring = R.rings[R.next];
    if (ring) {
      const rel = p.clone().sub(ring.ring.position);
      const sAlong = rel.dot(ring.T);
      if (R.prevS < 0 && sAlong >= 0 && rel.length() < 12) {
        const across = rel.clone().addScaledVector(ring.T, -sAlong).length();
        if (across <= R.cup.ringR + 0.6) {
          R.next++;
          chime();
          if (R.next >= R.rings.length) return finishRace();
        } else return endRace(`💨 You missed ring ${R.next + 1}! You're OUT of ${R.cup.name}. (Try again — E on the start rock.)`, false);
      }
      // gone way past it without crossing? that's a miss too
      if (rel.length() > 14 && sAlong > 6) return endRace(`💨 You flew right past ring ${R.next + 1}! You're OUT of ${R.cup.name}. (Try again — E on the start rock.)`, false);
      R.prevS = rel.length() < 12 ? sAlong : -1;
    }
    // 🐉 the rivals fly the course
    for (const [i, rv] of R.rivals.entries()) {
      if (rv.done) continue;
      rv.d += rv.v * dt;
      if (rv.d >= (R.cup.mode === "rings" ? K.len * (R.cup.rings / (R.cup.rings + 1)) : K.len * R.cup.laps)) rv.done = R.t;
      const u = Math.max(0, rv.d) / K.len;
      const P = pointAt(u), T = tangentAt(u);
      rv.g.position.set(P.x - T.z * rv.lane, P.y + Math.sin(t * 2 + i) * 0.6, P.z + T.x * rv.lane);
      rv.g.rotation.set(0, Math.atan2(T.x, T.z), 0);
    }
    // the wind streaks
    for (const g of R.streaks || []) {
      const u = g.userData.u;
      const P = pointAt(u), T = tangentAt(u);
      const k = ((t * 0.5 + g.userData.off) % 1) - 0.5;
      g.position.set(P.x - T.z * k * 24, P.y + (g.userData.off % 3) - 1, P.z + T.x * k * 24);
    }
  }
  function finishRace() {
    const R = race;
    if (R.cup.mode === "stars") {
      // (the rivals still out there keep snatching till you're home — count what they have now)
      const best = R.rivals.reduce((a, b) => (b.stars > a.stars ? b : a));
      if (R.got > best.stars) return endRace(`🥈 ${R.got} STARS — more than anyone! You win ${R.cup.name} ${R.cup.icon}!`, true);
      return endRace(`⭐ You caught ${R.got} stars — but ${best.name} caught ${best.stars}! Get ahead of the pack (hold W) and snatch them first. Try again!`, false);
    }
    const ahead = R.rivals.filter((rv) => rv.done && rv.done < R.t).length;
    if (ahead === 0) return endRace(`🥇 FIRST PLACE! You win ${R.cup.name} ${R.cup.icon}!`, true);
    const place = ahead + 1;
    endRace(`${place === 2 ? "🥈 Second" : place === 3 ? "🥉 Third" : `${place}th`} place — so close! ${R.rivals.filter((rv) => rv.done).sort((a, b) => a.done - b.done)[0].name} won it. Fly faster (hold W!) and try again.`, false);
  }

  function panelHTML() {
    const s = p32();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🏆 Dragon Races: the Sky Cup</h3><ul>
      ${row(s.been, "Fly to the Sky Cup Canyon <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “The Sky Cup Canyon”</div>")}
      ${CUPS.map((c) => row(!!s.cups[c.key], `${c.icon} Win ${c.name} — ${c.title} <div class="sub">&nbsp;&nbsp;${c.mode === "track" ? "twice round the track, first home wins" : c.mode === "stars" ? "catch the most stars" : `${c.rings} rings — miss one and you're out`}</div>`)).join("")}
      ${row(s.done, "Win all three for the Sky Cup")}
    </ul><div class="kit">🖱 steer with the mouse · hold W for full speed · 🌪️ storm winds push you sideways</div>`;
  }

  window.__wwP32 = { race: () => race && { next: race.next, t: race.t, n: race.rings.length, rings: race.rings.map((r) => ({ x: r.ring.position.x, y: r.ring.position.y, z: r.ring.position.z, tx: r.T.x, ty: r.T.y, tz: r.T.z })), rivals: race.rivals.map((rv) => Math.round(rv.d)), gate: race.gate, got: race.got, mode: race.cup.mode, gates: Array.from({ length: GATES }, (_, k) => pointAt((k + 1) / GATES)).map((P) => ({ x: P.x, y: P.y, z: P.z })), stars: race.stars.map((S0) => ({ x: S0.g.position.x, y: S0.g.position.y, z: S0.g.position.z, taken: S0.taken })), best: race.rivals.reduce((m, rv) => Math.max(m, rv.stars), 0) }, cups: () => p32().cups }; // (for tests)
  return { update, interactable, panelHTML, done: () => !!p32().done };
}
