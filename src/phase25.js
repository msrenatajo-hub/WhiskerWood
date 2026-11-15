// ------------------------------------------------------------
//  🏮  PHASE 25 — "The Festival of a Thousand Lanterns"
//
//  The First Moonkeeper's lantern burns with a flame older than the
//  forest — and an old custom says it must be SHARED. Carry it to four
//  Great Cities (Reedmere, Golden Hollow, Frostpine and Silverveil) and
//  light the new lantern post by each city's waystone. Then everyone
//  you've ever met gathers at your cottage, and a thousand sky lanterns
//  rise into the night.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";

registerKeepsake("skylantern", "🏮", "A Festival Sky Lantern (from the night of a thousand lanterns)");

const CITIES = [
  { key: "reedmere", name: "Reedmere", icon: "⛵" },
  { key: "golden", name: "Golden Hollow", icon: "🌾" },
  { key: "frostpine", name: "Frostpine", icon: "❄️" },
  { key: "silverveil", name: "Silverveil", icon: "🌙" },
];
const glow = (c, s, op = 0.8) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase25(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p25 = () => (st.p25 ||= { started: false, lit: {}, done: false });
  const cityId = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : null);
  let wait = 0;
  const posts = {}; // city id → { flame, spot }
  let sky = null; // the rising sky lanterns

  // a new lantern post beside each city's waystone
  function postFor(c) {
    if (posts[c.id]) return posts[c.id];
    let w = c.spots && c.spots.waystone;
    if (!w || w.x > 9999) w = c.spots && c.spots.arrive; // (no waystone? then where you arrive)
    if (!w) return null;
    const x = w.x + 2.6;
    const z = w.z + 0.5;
    const y = c.height(x, z);
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x5a3e22, flatShading: true }));
    pole.position.y = 1.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), pole.material);
    arm.position.set(0.45, 3.1, 0);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0xc84a3a, emissive: 0x000000, flatShading: true }));
    box.position.set(0.9, 2.7, 0);
    const flame = glow(0xffc060, 3.2, 0.9);
    flame.position.set(0.9, 2.7, 0);
    flame.visible = false;
    g.add(pole, arm, box, flame);
    g.position.set(x, y, z);
    c.group.add(g);
    return (posts[c.id] = { flame, box, x, z });
  }

  function begin() {
    p25().started = true;
    st.phase = 25;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "That night, the First Moonkeeper's lantern sits on your windowsill — and its little flame leans toward the window, as if it wants to go somewhere." },
      { dur: 4.6, black: true, gameCam: true, who: "Teacher Willow (who knows every old custom)", text: "“A flame that old must be SHARED, Thistle. Light a lantern with it in every Great City — and when they all burn, we hold the Festival of a Thousand Lanterns. It hasn't happened in five hundred years!”" },
      { dur: 4, black: true, gameCam: true, who: "Sprig", text: "“A FESTIVAL? With LANTERNS? …Are there snacks? There'd better be snacks.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🏮 PHASE 25 — The Festival of a Thousand Lanterns. Light the new lantern post by the waystone in Reedmere, Golden Hollow, Frostpine and Silverveil (K — the old roads, or fly your dragon with 1)!", true) },
    ]);
  }

  function interactable() {
    if (st.phase < 25 || p25().done) return null;
    const s = p25();
    const id = cityId();
    if (id && CITIES.some((c) => c.key === id) && !s.lit[id]) {
      const P = postFor(ctx.city());
      if (P && near(P.x, P.z, 2.6)) return { label: "light the city's lantern with the First Lantern's flame 🏮", act: () => {
        s.lit[id] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.lit).length;
        const cc = CITIES.find((c) => c.key === id);
        ctx.say(`🏮 ${cc.icon} ${cc.name}'s lantern glows warm and gold — and everyone nearby comes out to see! (${n}/4)${n >= 4 ? " ALL FOUR are lit! Go home to your cottage for the FESTIVAL (E by your door)." : ""}`, true);
      } };
    }
    if (Object.keys(s.lit).length >= 4 && ctx.world() === "outside" && near(ctx.home.x, ctx.home.z, 6)) return { label: "begin the Festival of a Thousand Lanterns 🏮", act: festival };
    return null;
  }

  function releaseLanterns() {
    if (sky || !ctx.outsideGroup) return;
    const h = ctx.home;
    sky = [];
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 60;
      const x = h.x + Math.cos(a) * r;
      const z = h.z + Math.sin(a) * r;
      const g = glow([0xffb050, 0xffd070, 0xff9a40][i % 3], 1.4 + Math.random() * 0.8, 0.95);
      g.position.set(x, ctx.terrainHeight(x, z) + 0.5, z);
      ctx.outsideGroup.add(g);
      sky.push({ g, v: 1.2 + Math.random() * 1.6, delay: Math.random() * 6, wob: Math.random() * 6 });
    }
  }

  function festival() {
    const s = p25();
    const h = ctx.home;
    const y = ctx.terrainHeight(h.x, h.z);
    if (ctx.setTime) ctx.setTime(0.9); // (night falls for the festival)
    playCutscene([
      { dur: 4.6, from: [h.x + 10, y + 4, h.z + 10], look: [h.x, y + 1.5, h.z], text: "They come from everywhere — Reedmere's boat-folk, Golden Hollow's farmers, Frostpine's skaters, Silverveil's star-watchers, your old teachers, Marisol, four little dragons — all carrying paper lanterns." },
      { dur: 4.4, from: [h.x + 6, y + 2.4, h.z + 6], look: [h.x, y + 1.4, h.z], text: "One by one, you light every lantern from the First Moonkeeper's flame. The meadow fills with warm, gold light." },
      { dur: 5.6, from: [h.x + 18, y + 6, h.z + 18], look: [h.x, y + 22, h.z], text: "And then, all together — they LET GO. A thousand lanterns float up into the night, over the Great Forest, up and up, until the sky is full of tiny new stars.", run: releaseLanterns },
      { dur: 4.6, from: [h.x + 18, y + 6, h.z + 18], look: [h.x, y + 30, h.z], who: "Sprig (very quietly)", text: "“Thistle… I think this is the most beautiful thing I've ever seen.”" },
      { dur: 4, black: true, gameCam: true, who: "🏮 PHASE 25 COMPLETE", text: "The Festival of a Thousand Lanterns\n🪙 800 · 🏮 A Festival Sky Lantern" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 800;
        (c.owned ||= {}).skylantern = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🏮 The Festival of a Thousand Lanterns! Every Great City's lantern burns with the First Moonkeeper's flame — forever.", true);
      } },
    ]);
  }

  function update(dt) {
    if (st.phase === 24 && st.p24 && st.p24.done && !p25().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 25 || !p25().started) return;
    const s = p25();
    const id = cityId();
    if (id && CITIES.some((c) => c.key === id)) {
      const P = postFor(ctx.city());
      if (P) {
        // (🌑 while the Shadow Thief has the lights — Phase 29 — they're dark)
        const stolen = !!(st.p29 && st.p29.started && !st.p29.done);
        P.flame.visible = !!s.lit[id] && !stolen;
        P.box.material.emissive.setHex(s.lit[id] && !stolen ? 0x8a3a10 : 0x000000);
      }
    }
    // the sky lanterns drift up (and away)
    if (sky) {
      for (const L of sky) {
        if (L.delay > 0) {
          L.delay -= dt;
          continue;
        }
        L.wob += dt;
        L.g.position.y += L.v * dt;
        L.g.position.x += Math.sin(L.wob * 0.7) * dt * 0.6;
        if (L.g.position.y > 160) L.g.visible = false;
      }
      if (sky.every((L) => !L.g.visible)) {
        for (const L of sky) L.g.parent && L.g.parent.remove(L.g);
        sky = null;
      }
    }
  }

  function panelHTML() {
    const s = p25();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🏮 The Festival of a Thousand Lanterns</h3><ul>
      ${CITIES.map((c) => row(s.lit[c.key], `${c.icon} Light ${c.name}'s lantern <div class="sub">&nbsp;&nbsp;by the city's waystone</div>`)).join("")}
      ${row(s.done, "Hold the festival at your cottage")}
    </ul><div class="kit">🧭 K — the old roads · 🐉 1 — fly your dragon there</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p25().done, postFor };
}
