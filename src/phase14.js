// ------------------------------------------------------------
//  🌙  PHASE 14 — "The Road to Silverveil"
//
//  The healed Heartstone shows a star map — and a sixth city, lost long
//  ago: SILVERVEIL, where the very first Moonkeepers were born.
//    1. Gather the three star shards (Moonstone Hollow · Roothaven's World
//       Pine · Everbough's Highcanopy) — they join and open the road
//    2. Travel to Silverveil
//    3. Meet the Last Keeper
//    4. Read Renata's last journal
//    5. Wake the Moon-Pool: turn the four moon-mirrors so every beam falls
//       into the pool… but the mirrors are LINKED — turning one turns its
//       neighbour too!
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { CLIFFS } from "./questZones.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("renatastar", "🌟", "Renata's Star (your light never fades in the dark)");
const SHARDS = [
  ["hollow", "Moonstone Hollow — by the reading rock"],
  ["pine", "Roothaven — at the roots of the World Pine"],
  ["canopy", "Everbough — atop the Highcanopy (climb!)"],
];
// the four mirrors stand round the pool, between the statue (south) and the observatory (north)
const MIRROR_ANG = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
const MIRROR_R = 20;

export function initPhase14(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const p14 = () => (st.p14 ||= { started: false, mirrors: null, done: false });
  const silver = () => (ctx.world() === "city" && ctx.city() && ctx.city().id === "silverveil" ? ctx.city() : null);
  const shardsGot = () => SHARDS.filter(([k]) => (C().shards || {})[k]).length;
  const step = () => {
    const c = C();
    if (shardsGot() < 3) return 1;
    if (!c.silverVisited) return 2;
    if (!c.silverKeeper) return 3;
    if (!c.renataJournal) return 4;
    if (!p14().done) return 5;
    return 6;
  };

  // ---------------------------------------------------------------- the beginning
  function begin() {
    const s = p14();
    s.started = true;
    st.phase = 14;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "Deep in the Underglow, the healed Heartstone flickers… and paints a map of stars across the cavern ceiling." },
      { dur: 4.4, black: true, gameCam: true, who: "Moonkeeper Corin", text: "“Six cities, not five. There was a sixth — SILVERVEIL — where the very first Moonkeepers were born. Renata came from there.”" },
      { dur: 4.4, black: true, gameCam: true, who: "Moonkeeper Corin", text: "“The road to it was hidden in three star shards: one in Moonstone Hollow, one at the roots of the World Pine, one atop the Highcanopy. Find them, and the road will open.”" },
      { dur: 3.4, black: true, gameCam: true, who: "Sprig", text: "“A secret SIXTH city?! Thistle, we HAVE to go!”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌙 PHASE 14 — The Road to Silverveil. Find the three star shards (the list, top right).", true) },
    ]);
  }

  // ---------------------------------------------------------------- the moon-mirrors
  let built = null;
  let mirrors = [];
  function mirrorState() {
    const s = p14();
    if (new URLSearchParams(location.search).get("p14solve") && !s._t) {
      s._t = true; // (test) one turn of mirror 1 from solved
      s.mirrors = [7, 7, 0, 0];
    }
    if (!s.mirrors) {
      // start solved, then scramble with backwards turns (so it's always solvable)
      const m = [0, 0, 0, 0];
      for (let k = 0; k < 7; k++) {
        const i = Math.floor(Math.random() * 4);
        m[i] = (m[i] + 7) % 8;
        m[(i + 1) % 4] = (m[(i + 1) % 4] + 7) % 8;
      }
      if (m.every((v) => v === 0)) m[0] = m[1] = 1;
      s.mirrors = m;
      save();
    }
    return s.mirrors;
  }
  function buildMirrors(c) {
    if (built === c) return;
    built = c;
    mirrors = MIRROR_ANG.map((a, i) => {
      const x = Math.cos(a) * MIRROR_R;
      const z = Math.sin(a) * MIRROR_R;
      const y = c.height(x, z);
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xc8c8dc, roughness: 0.6, flatShading: true }));
      base.position.y = 0.3;
      const turn = new THREE.Group(); // (turns to aim the mirror)
      turn.position.y = 0.6;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x8a8aa8 }));
      post.position.y = 0.8;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshStandardMaterial({ color: 0xe8f0ff, metalness: 0.9, roughness: 0.1, emissive: 0x6a8ac8, emissiveIntensity: 0.6, side: THREE.DoubleSide }));
      disc.position.set(0, 1.9, 0.05);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.07, 6, 24), new THREE.MeshStandardMaterial({ color: 0xd8c070, metalness: 0.6 }));
      rim.position.copy(disc.position);
      // the beam it throws (along +z of the turn group)
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      beam.rotation.x = Math.PI / 2;
      turn.add(post, disc, rim, beam);
      // a little glowing gem shows which mirror this one is LINKED to
      const gem = glow(0xffe08a, 1.2);
      gem.position.y = 3.4;
      g.add(base, turn, gem);
      c.group.add(g);
      c.colliders.push({ x, z, r: 1.1 });
      return { x, z, y, g, turn, beam, gem, inward: Math.atan2(-x, -z) };
    });
  }
  const solved = () => mirrorState().every((v) => v === 0);
  function drawMirrors(t) {
    const m = mirrorState();
    mirrors.forEach((mi, i) => {
      // state 0 = facing the pool; each turn is 45°
      const yaw = mi.inward + m[i] * (Math.PI / 4);
      mi.turn.rotation.y += (yaw - mi.turn.rotation.y) * 0.2;
      const on = m[i] === 0;
      const len = on ? MIRROR_R : 12;
      mi.beam.scale.y = len;
      mi.beam.position.set(0, 1.9, len / 2);
      mi.beam.material.color.setHex(on ? 0xfff0a0 : 0xbfe6ff);
      mi.gem.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.3;
    });
  }
  function turnMirror(i) {
    const m = mirrorState();
    m[i] = (m[i] + 1) % 8;
    m[(i + 1) % 4] = (m[(i + 1) % 4] + 1) % 8; // (linked to the next one round the pool)
    save();
    chime();
    const n = m.filter((v) => v === 0).length;
    if (solved()) return finale();
    ctx.say(`🪞 The mirror grinds round… and so does its neighbour! (${n}/4 beams on the pool)`);
  }

  // ---------------------------------------------------------------- the finale
  function finale() {
    const c = silver();
    const y = c.height(0, 0);
    let renata = null;
    playCutscene([
      { dur: 4, from: [0, 18, 34], look: [0, 2, 0], text: "Four beams of moonlight meet in the middle of the pool. The water begins to glow — brighter, and brighter…" },
      { dur: 4.4, from: [0, 10, 30], look: [0, 12, 0], text: "…and out of the pool rises the MOON itself, small and silver, and settles above Silverveil where it belongs.", run: () => {
        const moon = new THREE.Group();
        moon.add(new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })), glow(0xdfe8ff, 22, 0.7));
        moon.position.set(0, y + 2, 0);
        c.group.add(moon);
        c.props.risenMoon = moon;
      }, update: (k) => c.props.risenMoon && (c.props.risenMoon.position.y = y + 2 + k * 14) },
      { dur: 4.4, from: [4, y + 2.4, 10], look: [0, y + 1.5, 4], text: "In the silver light, someone is standing at the edge of the pool. A mouse with a lantern.", run: () => {
        renata = buildThistle({ tunicColor: 0xe8f0ff, hoodColor: 0xbfd8ff, pack: true });
        renata.traverse((o) => o.isMesh && (o.material = new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.6 })));
        renata.scale.setScalar(1.2);
        renata.position.set(0, y + 0.2, 4);
        renata.add(glow(0xffe8a0, 2.5));
        c.group.add(renata);
      } },
      { dur: 5, from: [3, y + 1.8, 8], look: [0, y + 1.2, 4], who: "Renata Josephine Rudy", text: "“Hello, Thistle. I've watched you walk every one of my roads — the forest, the cities, the dark beneath the roots. You never once gave up.”" },
      { dur: 5, from: [3, y + 1.8, 8], look: [0, y + 1.2, 4], who: "Renata Josephine Rudy", text: "“The roads are whole again. The six cities are friends again. My promise is kept — because you kept it for me.”" },
      { dur: 4.6, from: [3, y + 1.8, 8], look: [0, y + 1.2, 4], who: "Renata Josephine Rudy", text: "“Take my star. Wherever you go, it will light your way. And Thistle… thank you.”" },
      // 🌙 the secret New Game+ ending
      ...(window.__wwNGPlus && window.__wwNGPlus() > 0 ? [{ dur: 5, from: [3, y + 1.8, 8], look: [0, y + 1.2, 4], who: "Renata Josephine Rudy (smiling)", text: "“…Wait. You've walked these roads before, haven't you? I can see it in your eyes. Then you know the secret: the journey was always the treasure. Welcome home, Moonkeeper — again.”" }] : []),
      { dur: 3.6, from: [0, y + 20, 40], look: [0, y + 8, 0], text: "She smiles, and fades into the moonlight like mist in the morning." , end: () => renata && renata.parent && renata.parent.remove(renata) },
      { dur: 4, black: true, gameCam: true, who: "🌙 PHASE 14 COMPLETE", text: "The Road to Silverveil\n🪙 200 · 🌟 Renata's Star (your light never fades in the dark)" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        const s = p14();
        s.done = true;
        const cc = C();
        cc.coins = (cc.coins || 0) + 200;
        (cc.owned ||= {}).renatastar = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌟 Renata's Star is yours. The moon shines over Silverveil again — and all six Great Cities are one. 🌙", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- 🧗 the Moonlit Cliffs
  let checkpoint = -1;
  let fallCool = 0;
  const windEl = document.createElement("div");
  windEl.style.cssText = "position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:40;padding:6px 16px;border-radius:12px;background:rgba(30,30,60,.8);color:#e8ecff;font:bold 16px system-ui;pointer-events:none;display:none";
  document.body.appendChild(windEl);
  function cliffsUpdate(dt, t) {
    const Z = ctx.world() === "city" && ctx.city() && ctx.city().id === "cliffs" ? ctx.city() : null;
    if (!Z) {
      windEl.style.display = "none";
      return;
    }
    const K = CLIFFS;
    const p = me();
    // which ledge are you on?
    const on = K.ledges.findIndex((l, i) => !Z.gone[i] && Math.hypot(p.x - l.x, p.z - l.z) < l.r && Math.abs(p.y - l.y) < 0.3);
    if (on >= 0) {
      const l = K.ledges[on];
      // 💥 crumbly ledges shake… then fall
      if (l.crumble) {
        l.stand = (l.stand || 0) + dt;
        Z.ledgeMeshes[on].position.x = l.x + Math.sin(t * 50) * 0.06;
        if (l.stand > 0.8) {
          Z.gone[on] = 4;
          l.stand = 0;
          ctx.say("💥 CRACK — the ledge crumbles away!");
        }
      }
      // 🏮 moon-lanterns are checkpoints
      if (K.lanterns.includes(on) && checkpoint < on) {
        checkpoint = on;
        chime();
        ctx.say("🏮 A moon-lantern! If you fall, you'll start again from here.");
      }
    }
    // 💨 the wind: a warning, then a gust pushing you OFF the mountain
    const W = Z.wind;
    W.t -= dt;
    if (W.t <= 0) {
      if (W.phase === "calm") Object.assign(W, { phase: "warn", t: 1.2 });
      else if (W.phase === "warn") Object.assign(W, { phase: "blow", t: 1.0 });
      else Object.assign(W, { phase: "calm", t: 3 + Math.random() * 3 });
    }
    const onMountain = p.y > 1 && p.y < K.top.y - 1;
    windEl.style.display = onMountain && W.phase !== "calm" ? "" : "none";
    if (onMountain && W.phase === "warn") windEl.textContent = "💨 A GUST IS COMING — stand still and hold on!";
    if (onMountain && W.phase === "blow") {
      windEl.textContent = "💨💨 WHOOOOSH!";
      // (standing still = you hold on; moving = it shoves you outward)
      if (ctx.moving()) {
        const d = Math.hypot(p.x, p.z) || 1;
        p.x += (p.x / d) * 2.6 * dt;
        p.z += (p.z / d) * 2.6 * dt;
      }
    }
    // a fall into the clouds → back to the last lantern
    fallCool -= dt;
    if (p.y < -10 && fallCool <= 0) {
      fallCool = 1;
      const l = checkpoint >= 0 ? K.ledges[checkpoint] : null;
      const back = l || K.start;
      ctx.placePlayer(back.x, back.z, 0);
      fadeThrough(() => {}, 0.3);
      ctx.say(l ? "🧗 You slip into the clouds — and a moonbeam lifts you back to the last lantern!" : "🧗 You tumble back down to the meadow. Up you go again!", true);
    }
    // the top! (anywhere on the summit counts)
    if (!reaching && p.y > K.top.y - 1.5 && Math.hypot(p.x, p.z) < K.R && !ctx.playing()) reachTop();
  }
  let reaching = false;
  function reachTop() {
    reaching = true;
    const c = C();
    (c.owned ||= {}).silverclimbed = true;
    saveCity();
    checkpoint = -1;
    windEl.style.display = "none";
    ctx.say("🌙 You made it to the top of the Moonlit Cliffs — and through the silver gate lies SILVERVEIL!", true);
    fadeThrough(() => {
      ctx.goCity("silverveil");
      reaching = false;
    }, 1);
  }
  // (test) &cliffstop=1 → drop onto the summit
  if (new URLSearchParams(location.search).get("cliffstop")) setTimeout(() => {
    if (ctx.world() === "city" && ctx.city() && ctx.city().id === "cliffs") {
      const p = me();
      p.set(4, CLIFFS.top.y + 0.2, 4);
    }
  }, 3500);

  // ---------------------------------------------------------------- E
  function interactable() {
    // (E at the silver gate also works)
    if (ctx.world() === "city" && ctx.city() && ctx.city().id === "cliffs" && me().y > CLIFFS.top.y - 1.5 && Math.hypot(me().x, me().z) < 6 && !reaching) return { label: "walk through the silver gate to SILVERVEIL 🌙", act: reachTop };
    if (st.phase < 14) return null;
    const c = silver();
    if (!c || step() !== 5) return null;
    buildMirrors(c);
    for (let i = 0; i < mirrors.length; i++) {
      const mi = mirrors[i];
      if (!near(mi.x, mi.z, 2.4)) continue;
      return { label: `turn the moon-mirror 🪞 (it's linked to the next one round the pool)`, act: () => turnMirror(i) };
    }
    return null;
  }

  // ---------------------------------------------------------------- each frame
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.9, 50, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 25;
    beacon.add(beam);
  }
  let lastKey = "";
  function update(dt, t) {
    cliffsUpdate(dt, t);
    if (st.phase >= 14) {
      // (redraw the list whenever a shard, the Keeper or the journal changes it)
      const key = step() + ":" + shardsGot();
      if (key !== lastKey) {
        lastKey = key;
        redraw();
      }
    }
    if (st.phase === 13 && st.p13 && st.p13.done && !p14().started && !ctx.playing() && ctx.quadMouse()) begin();
    if (st.phase < 14) return;
    const c = silver();
    beacon.visible = false;
    if (!c) return;
    const sp = step();
    if (sp >= 5) {
      buildMirrors(c);
      drawMirrors(t);
      if (p14().done && !c.props.risenMoon) {
        const moon = new THREE.Group();
        moon.add(new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })), glow(0xdfe8ff, 22, 0.7));
        moon.position.set(0, c.height(0, 0) + 16, 0);
        c.group.add(moon);
        c.props.risenMoon = moon;
      }
    }
    // the beacon: the Keeper, then the journal
    const tgt = sp === 3 ? c.people.keeper : sp === 4 ? c.props.journal : null;
    if (tgt) {
      if (beacon.parent !== c.group) c.group.add(beacon);
      beacon.visible = true;
      beacon.position.set(tgt.x, c.height(tgt.x, tgt.z), tgt.z);
    }
  }

  // ---------------------------------------------------------------- the list (top right)
  function panelHTML() {
    const sp = step();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const sh = C().shards || {};
    return `<h3>🌙 The Road to Silverveil</h3><ul>
      ${row(sp > 1, `Find the three star shards <span class="res">(${shardsGot()}/3)</span>`)}
      ${sp === 1 ? SHARDS.map(([k, where]) => `<div class="sub ${sh[k] ? "done" : ""}">&nbsp;&nbsp;${sh[k] ? "✔" : "○"} ⭐ ${where}</div>`).join("") : ""}
      ${row(sp > 2, "Travel to Silverveil (K, or a waystone) — and CLIMB the Moonlit Cliffs 🧗")}
      ${row(sp > 3, "Meet the Last Keeper")}
      ${row(sp > 4, "Read Renata's last journal (by the observatory)")}
      ${row(sp > 5, `Wake the Moon-Pool — aim all four moon-mirrors at it${sp === 5 ? ` <span class="res">(${mirrorState().filter((v) => v === 0).length}/4)</span>` : ""}`)}
    </ul><div class="kit">${sp === 5 ? "🪞 Turning a mirror turns the NEXT one round the pool too!" : "⭐ The star shards glow — look high and low"}</div>`;
  }
  /** the minimap trail (forest shard) */
  function goal() {
    if (st.phase !== 14 || step() !== 1 || ctx.world() !== "outside") return null;
    if ((C().shards || {}).hollow) return null;
    const J = ctx.journalPos;
    return J ? { x: J.x + 2, z: J.z - 2 } : null;
  }
  return { update, interactable, panelHTML, goal, done: () => !!p14().done };
}
