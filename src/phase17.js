// ------------------------------------------------------------
//  ⛵  PHASE 17 — "The Ship with Silver Sails"
//
//  The mysterious ship reaches Reedmere. Its captain, Marisol, comes from
//  the MOONLESS ISLE far across the sea — where the moon went dark long
//  ago and the lighthouse died. Only a Moonkeeper can light it again.
//    1. Meet Captain Marisol at Reedmere's harbour
//    2. Gather what the lighthouse needs:
//         🔥 a flame from the Pact Fire  (Warden Ivo, Frostpine)
//         🗺️ the Moonkeepers' star chart (the Last Keeper, Silverveil)
//         🐚 the Singing Conch's song     (Shell Island, out on the Open Sea)
//    3. Sail with Marisol to the Moonless Isle
//    4. Climb the old lighthouse and light it
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { ISLE, SEA } from "./questZones.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("silversail", "⛵", "Silver Sail Pennant (Captain Marisol's thanks — friend of the Moonless Isle)");

const ITEMS = [
  { key: "ember", icon: "🔥", name: "a flame from the Pact Fire", where: "frostpine", who: "Warden Ivo", whereName: "Frostpine",
    line: "“A flame from Renata's Pact Fire, for a lighthouse across the sea? Here — this lantern will keep it burning all the way.”" },
  { key: "chart", icon: "🗺️", name: "the Moonkeepers' star chart", where: "silverveil", who: "the Last Keeper", whereName: "Silverveil",
    line: "“The old star chart… the first Moonkeepers drew it to find the islands beyond the sea. Take it. It has waited a long time.”" },
  { key: "conch", icon: "🐚", name: "the Singing Conch's song", where: "sea", who: "the Singing Conch on Shell Island", whereName: "Shell Island (the Open Sea)",
    line: "You lift the great conch to your ear… and it SINGS — a low, old song about the moon. You'll remember it forever." },
];

export function initPhase17(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.8) => Math.hypot(me().x - x, me().z - z) < r;
  const p17 = () => (st.p17 ||= { started: false, met: false, items: {}, sailed: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  let wait = 0;

  function begin() {
    p17().started = true;
    st.phase = 17;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "Three days after the Gathering, the ship with silver sails glides into Reedmere's lagoon. Everyone in town crowds the jetty to see." },
      { dur: 4.2, black: true, gameCam: true, who: "A note, nailed to the mast", text: "“To the Moonkeeper they call Thistle: please come to the harbour. We have sailed a very long way to find you. — Captain Marisol”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("⛵ PHASE 17 — The Ship with Silver Sails. Go to Reedmere's harbour and meet Captain Marisol.", true) },
    ]);
  }

  // ---------------------------------------------------------------- the ship + captain in Reedmere
  let ship = null;
  function shipBuild(c) {
    if (ship && ship.c === c) return;
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 12), new THREE.MeshStandardMaterial({ color: 0x3a2a3a, roughness: 0.8, flatShading: true }));
    hull.position.y = 0.6;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 11, 6), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }));
    mast.position.y = 6.5;
    g.add(hull, mast);
    for (const [y, w] of [[5, 6], [9, 4.5]]) {
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.4), new THREE.MeshStandardMaterial({ color: 0xe8ecf8, metalness: 0.6, roughness: 0.3, emissive: 0x4a5a8a, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
      sail.position.set(0, y, 0.2);
      g.add(sail);
    }
    g.add((() => { const h = glow(0xdfe8ff, 10, 0.4); h.position.y = 7; return h; })());
    g.position.set(-14, 0, 36);
    g.rotation.y = 0.5;
    c.group.add(g);
    // the captain waits on dry land nearby
    let at = { x: -8, z: 50 };
    for (let r = 0; r < 25; r += 1.5) {
      let ok = false;
      for (let a = 0; a < 6.3; a += 0.5) {
        const x = -8 + Math.cos(a) * r;
        const z = 50 + Math.sin(a) * r;
        if (c.waterAt(x, z) === null && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 1.2)) {
          at = { x, z };
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    const cap = buildThistle({ tunicColor: 0x2a3a6a, hoodColor: 0x1a2a4a, pack: false });
    cap.scale.setScalar(1.15);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 3), new THREE.MeshStandardMaterial({ color: 0x1a1a2a }));
    hat.rotation.z = Math.PI / 2;
    hat.position.y = 0.82;
    cap.add(hat);
    cap.position.set(at.x, c.height(at.x, at.z), at.z);
    cap.rotation.y = Math.atan2(-14 - at.x, 36 - at.z);
    c.group.add(cap);
    ship = { c, g, cap: at };
  }
  function meet() {
    const s = p17();
    const c = ctx.city();
    const y = c.height(ship.cap.x, ship.cap.z);
    playCutscene([
      { dur: 4.4, from: [ship.cap.x + 3, y + 2, ship.cap.z + 3], look: [ship.cap.x, y + 1, ship.cap.z], who: "Captain Marisol", text: "“So YOU'RE the Moonkeeper. Smaller than the songs say — but the songs say you're brave, and that's what we need.”" },
      { dur: 4.8, from: [ship.cap.x + 3, y + 2, ship.cap.z + 3], look: [ship.cap.x, y + 1, ship.cap.z], who: "Captain Marisol", text: "“I come from the Moonless Isle, far across the sea. Long ago our moon went dark, and our lighthouse died with it. Ships get lost. Children have never seen moonlight.”" },
      { dur: 4.8, from: [ship.cap.x + 3, y + 2, ship.cap.z + 3], look: [ship.cap.x, y + 1, ship.cap.z], who: "Captain Marisol", text: "“The old stories say only a Moonkeeper can light it — with a flame from the Pact Fire, the first Moonkeepers' star chart, and the song of the Singing Conch. Will you help us?”" },
      { dur: 0.4, gameCam: true, end: () => {
        s.met = true;
        save();
        redraw();
        chime();
        ctx.say("⛵ Gather the three things: 🔥 Warden Ivo (Frostpine) · 🗺️ the Last Keeper (Silverveil) · 🐚 the Singing Conch (Shell Island — sail from Reedmere's harbour). Then come back to Marisol!", true);
      } },
    ]);
  }
  function sail() {
    const s = p17();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4, black: true, gameCam: true, who: "Captain Marisol", text: "“All three! Then hoist the silver sails — we sail tonight!”" },
      { dur: 4.4, black: true, gameCam: true, text: "For three days and three nights the ship crosses the sea. Sprig reads the star chart. You hum the conch's song. The flame burns steady in its lantern." },
      { dur: 3.8, black: true, gameCam: true, text: "And then, out of the dark — an island. Grey. Silent. And in the middle of it, a tall, dead lighthouse." },
      { dur: 0.4, black: true, gameCam: true, end: () => {
        s.sailed = true;
        save();
        redraw();
        ctx.goCity("isle");
        ctx.placePlayer(ISLE.dock.x, ISLE.dock.z - 4, Math.PI);
      } },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🏝️ THE MOONLESS ISLE. Climb the spiral stair round the old lighthouse — and light it!", true) },
    ]);
  }
  function lightIt() {
    const Z = ctx.city();
    const s = p17();
    const T = ISLE.top;
    playCutscene([
      { dur: 4, from: [T.x + 6, T.y + 3, T.z + 6], look: [T.x, T.y + 1.6, T.z], text: "You open the lantern. The Pact Fire's flame leaps into the great lamp — and you sing the Singing Conch's song…", run: () => {
        Z.lamp.material.emissive.setHex(0xffe8a0);
        Z.lamp.material.emissiveIntensity = 1.5;
      } },
      { dur: 4.6, from: [0, T.y + 10, 40], look: [T.x, T.y, T.z], text: "The lighthouse ROARS to life. Its beam sweeps out across the dark sea — and the star chart's stars wink on, one by one, above the island.", run: () => (Z.beam.visible = true) },
      { dur: 4.6, from: [0, T.y + 4, 50], look: [0, T.y + 30, -80], text: "And rising out of the sea, slow and silver and enormous… the island's own MOON. Home at last.", run: () => {
        const moon = new THREE.Group();
        moon.add(new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })), glow(0xdfe8ff, 50, 0.6));
        moon.position.set(0, 0, -120);
        Z.group.add(moon);
        Z.moon = moon;
      }, update: (k) => Z.moon && (Z.moon.position.y = k * 40) },
      { dur: 4.6, from: [6, 4, 30], look: [0, 2, 0], who: "Captain Marisol", text: "“Look at them — every window lit, every mouse outside looking UP. Thistle… you gave a whole island its moon back.”", run: () => Z.islanders.forEach((i) => i.win.material.color.setHex(0xffd8a0)) },
      { dur: 4.6, from: [6, 4, 30], look: [0, 2, 0], who: "Captain Marisol", text: "“But the star chart shows more islands out there. Dark ones. Waiting. The sea is wide, High Moonkeeper — and I think your story is only getting started.”" },
      { dur: 4, black: true, gameCam: true, who: "⛵ PHASE 17 COMPLETE", text: "The Ship with Silver Sails\n🪙 250 · ⛵ Silver Sail Pennant\n…the islands are waiting!" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const cc = C();
        cc.coins = (cc.coins || 0) + 250;
        (cc.owned ||= {}).silversail = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌙 The Moonless Isle has its moon again! (Walk back to the dock and press E to sail home.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 17) return null;
    const s = p17();
    const w = here();
    if (w === "reedmere") {
      shipBuild(ctx.city());
      if (near(ship.cap.x, ship.cap.z)) {
        if (!s.met) return { label: "meet Captain Marisol ⛵", act: meet };
        if (ITEMS.every((it) => s.items[it.key]) && !s.sailed) return { label: "set sail with Captain Marisol ⛵", act: sail };
        if (!s.sailed) return { label: "talk to Captain Marisol", act: () => ctx.say(`⛵ Marisol: “Still need: ${ITEMS.filter((it) => !s.items[it.key]).map((it) => `${it.icon} ${it.name}`).join(", ")}.”`, true) };
        if (s.done) return { label: "talk to Captain Marisol", act: () => ctx.say("⛵ Marisol: “Whenever you're ready, High Moonkeeper — the other islands are out there.”", true) };
      }
    }
    if (s.met && !s.sailed) {
      for (const it of ITEMS) {
        if (s.items[it.key] || w !== it.where) continue;
        let P = null;
        if (it.where === "sea") {
          const I = SEA.isles.find((x) => x.key === "shell");
          P = { x: I.x, z: I.z };
        } else P = ctx.city() && ctx.city().people[it.key === "ember" ? "ivo" : "keeper"];
        if (!P || !near(P.x, P.z, it.where === "sea" ? 6 : 2.8)) continue;
        return { label: it.where === "sea" ? "listen to the Singing Conch 🐚" : `ask ${it.who} for ${it.name} ${it.icon}`, act: () => {
          s.items[it.key] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(s.items).length;
          ctx.say(`${it.icon} ${it.line} (${n}/3)${n >= 3 ? " — back to Captain Marisol in Reedmere!" : ""}`, true);
        } };
      }
    }
    if (w === "isle") {
      const T = ISLE.top;
      if (!s.done && me().y > T.y - 1 && near(T.x, T.z, T.r + 0.5)) return { label: "light the lighthouse 🔥", act: lightIt };
      if (near(ISLE.dock.x, ISLE.dock.z, 4)) return { label: "sail home to Reedmere ⛵", act: () => fadeThrough(() => ctx.goCity("reedmere"), 1) };
    }
    return null;
  }

  // ---------------------------------------------------------------- each frame + the list
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.9, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 30;
    beacon.add(beam);
  }
  function update(dt) {
    if (st.phase === 16 && st.p16 && st.p16.festival && !p17().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 17) return;
    const s = p17();
    const w = here();
    if (w === "reedmere") shipBuild(ctx.city());
    beacon.visible = false;
    let P = null;
    if (w === "reedmere" && (!s.met || (ITEMS.every((it) => s.items[it.key]) && !s.sailed))) P = ship && ship.cap;
    if (s.met && !s.sailed) {
      const it = ITEMS.find((x) => !s.items[x.key] && x.where === w);
      if (it) P = it.where === "sea" ? SEA.isles.find((x) => x.key === "shell") : ctx.city() && ctx.city().people[it.key === "ember" ? "ivo" : "keeper"];
    }
    if (w === "isle" && !s.done) P = ISLE.top;
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (P && c) {
      if (beacon.parent !== c.group) c.group.add(beacon);
      beacon.visible = true;
      beacon.position.set(P.x, w === "isle" ? ISLE.top.y : c.height(P.x, P.z), P.z);
    }
  }
  function panelHTML() {
    const s = p17();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>⛵ The Ship with Silver Sails</h3><ul>
      ${row(s.met, "Meet Captain Marisol at Reedmere's harbour")}
      ${ITEMS.map((it) => row(s.items[it.key], `${it.icon} ${it.name} <span class="res">(${it.whereName})</span>`)).join("")}
      ${row(s.sailed, "Sail with Marisol to the Moonless Isle")}
      ${row(s.done, "Climb the old lighthouse and light it")}
    </ul><div class="kit">⛵ the golden beam shows where to go · C — Life Goals</div>`;
  }
  return { update, interactable, panelHTML, done: () => !!p17().done, marisolAt: () => ship && ship.cap };
}
