// ------------------------------------------------------------
//  🌅  PHASE 18 — "The Sunrise Lands"
//
//  Marisol's star chart shows a whole continent beyond the Moonless Isle:
//  the Sunrise Lands, where FIVE great cities went dark long ago, the
//  same night the Moonless Isle lost its moon. Sail there, and wake them:
//  in each city, gather its 3 sun-shards and relight its beacon.
//    🪸 Coral Spire · ☀️ Sunstone Mesa · 🎋 Whisperwood · 🍄 Glimmerfen · 🏰 Skyhold
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { SUNRISE } from "./questZones.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("sunrisecompass", "🧭", "The Sunrise Compass (it points to the next lost land)");
const WAKE_LINES = {
  coral: "“The tide remembers! Coral Spire is awake!” The coral towers blush pink, and fish leap in the bay.",
  mesa: "The red rocks catch the light and GLOW like embers. Sunstone Mesa is awake!",
  bamboo: "A wind sighs through ten thousand bamboo stalks — it sounds like a city laughing. Whisperwood is awake!",
  fen: "Every mushroom in the bog lights up at once, blue and green and gold. Glimmerfen is awake!",
  sky: "From the top of the plateau, Skyhold's beacon can be seen across the WHOLE continent. Skyhold is awake!",
};

export function initPhase18(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const p18 = () => (st.p18 ||= { started: false, sailed: false, shards: {}, woke: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "sunrise" ? ctx.city() : null);
  let wait = 0;
  let finaleCool = 0;

  function begin() {
    p18().started = true;
    st.phase = 18;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, who: "A letter from Captain Marisol", text: "“High Moonkeeper — the old star chart shows something we never knew was there. Beyond our isle lies a whole CONTINENT: the Sunrise Lands.”" },
      { dur: 4.6, black: true, gameCam: true, who: "A letter from Captain Marisol", text: "“Five great cities stood there once. They went dark the very same night our moon did. My ship is waiting in Reedmere. Will you come?”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌅 PHASE 18 — The Sunrise Lands. Meet Captain Marisol at Reedmere's harbour and set sail!", true) },
    ]);
  }

  // ---------------------------------------------------------------- sailing there + back
  function sail() {
    const s = p18();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "Past the Moonless Isle, its lighthouse winking goodbye. Five days of open sea. Sprig spots a whale. Marisol sings sea-shanties, badly." },
      { dur: 4, black: true, gameCam: true, text: "Then, at dawn, a coastline glowing pink and gold — and five dark shapes on the land, where five cities sleep." },
      { dur: 0.4, black: true, gameCam: true, end: () => {
        s.sailed = true;
        save();
        redraw();
        ctx.goCity("sunrise");
        ctx.placePlayer(SUNRISE.dock.x, SUNRISE.dock.z - 6, Math.PI);
      } },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌅 THE SUNRISE LANDS. Five lost cities — each with 3 golden SUN-SHARDS to find and a beacon to relight. Their dim glows mark where they are!", true) },
    ]);
  }

  // ---------------------------------------------------------------- waking a city
  function wake(c) {
    const s = p18();
    const Z = zone();
    const O = Z.cityObjs[c.key];
    const y = Z.height(c.x, c.z);
    s.woke[c.key] = true;
    save();
    redraw();
    const n = Object.keys(s.woke).length;
    playCutscene([
      { dur: 4, from: [c.x + 16, y + 10, c.z + 16], look: [c.x, y + 8, c.z], text: `You set the three sun-shards into ${c.name}'s beacon…`, run: () => {
        O.flame.visible = O.halo.visible = O.beam.visible = true;
      } },
      { dur: 4.2, from: [c.x + 22, y + 14, c.z + 22], look: [c.x, y + 4, c.z], text: WAKE_LINES[c.key], run: () => spawnPeople(Z, c) },
      { dur: 0.4, gameCam: true, end: () => {
        chime();
        if (n >= 5) finaleCool = 0.5; // (update() plays it once this scene has finished)
        else ctx.say(`${c.icon} ${c.name} is awake! (${n}/5 lost cities)`, true);
      } },
    ]);
  }
  function spawnPeople(Z, c) {
    const O = Z.cityObjs[c.key];
    if (O.people.length) return;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const m = buildThistle({ tunicColor: [c.color, 0x8a6a4a, 0x6a8aa8][k % 3], hoodColor: c.color, pack: false });
      const x = c.x + Math.cos(a) * c.r * 0.3;
      const z = c.z + Math.sin(a) * c.r * 0.3;
      m.position.set(x, Z.height(x, z), z);
      m.rotation.y = Math.atan2(c.x - x, c.z - z);
      Z.group.add(m);
      O.people.push(m);
    }
  }
  function finale() {
    const s = p18();
    playCutscene([
      { dur: 4.4, from: [0, 90, 160], look: [0, 0, -20], text: "Five beacons blaze across the Sunrise Lands — coral pink, ember orange, bamboo green, fen blue and sky white — and their beams meet high in the sky." },
      { dur: 4.6, from: [0, 90, 160], look: [0, 0, -20], who: "Captain Marisol", text: "“Look at it, Thistle. A whole continent, waking up. Mice who've never seen a sunrise are standing on their rooftops, cheering.”" },
      { dur: 4.8, black: true, gameCam: true, who: "The Elders of the Five Cities", text: "“Moonkeeper, take this compass. Our oldest stories speak of one more land — far to the west, under endless snow and stars. It went dark first of all. The compass will point the way.”" },
      { dur: 4, black: true, gameCam: true, who: "🌅 PHASE 18 COMPLETE", text: "The Sunrise Lands\n🪙 300 · 🧭 The Sunrise Compass\n…one more lost land waits in the west!" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 300;
        (c.owned ||= {}).sunrisecompass = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🧭 All five lost cities of the Sunrise Lands are awake! (E at the dock to sail home.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 18) return null;
    const s = p18();
    // Marisol in Reedmere: sail to the Sunrise Lands
    if (here() === "reedmere" && api.marisolAt) {
      const M0 = api.marisolAt();
      if (M0 && near(M0.x, M0.z, 2.8)) return { label: s.sailed ? "sail to the Sunrise Lands ⛵" : "set sail for the Sunrise Lands with Marisol ⛵", act: () => (s.sailed ? fadeThrough(() => {
        ctx.goCity("sunrise");
        ctx.placePlayer(SUNRISE.dock.x, SUNRISE.dock.z - 6, Math.PI);
      }, 1) : sail()) };
    }
    const Z = zone();
    if (!Z) return null;
    if (near(SUNRISE.dock.x, SUNRISE.dock.z, 5)) return { label: "sail home to Reedmere ⛵", act: () => fadeThrough(() => ctx.goCity("reedmere"), 1) };
    for (const c of SUNRISE.cities) {
      const got = (s.shards[c.key] ||= {});
      c.shards.forEach((sp, i) => (Z.cityObjs[c.key].shardObjs[i].visible = !got[i] && !s.woke[c.key]));
      for (let i = 0; i < c.shards.length; i++) {
        const sp = c.shards[i];
        if (got[i] || s.woke[c.key] || !near(sp.x, sp.z, 2.2) || Math.abs(me().y - Z.height(sp.x, sp.z)) > 3) continue;
        return { label: `pick up ${c.name}'s sun-shard ☀️`, act: () => {
          got[i] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(got).length;
          ctx.say(`☀️ A sun-shard of ${c.name} (${n}/3)${n >= 3 ? " — now relight its beacon in the middle of the city!" : ""}`);
        } };
      }
      if (!s.woke[c.key] && Object.keys(got).length >= 3 && near(c.x, c.z, 4.5) && Math.abs(me().y - Z.height(c.x, c.z)) < 3) return { label: `relight ${c.name}'s beacon ${c.icon}`, act: () => wake(c) };
    }
    return null;
  }

  // ---------------------------------------------------------------- each frame + the list
  function update(dt) {
    if (st.phase === 17 && st.p17 && st.p17.done && !p18().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 18) return;
    const s = p18();
    // (all five awake but the finale never played? play it now)
    // (all five awake but no finale yet? play it — and keep trying until it does)
    finaleCool -= dt;
    if (Object.keys(s.woke).length >= 5 && !s.done && !ctx.playing() && finaleCool <= 0) {
      finaleCool = 3;
      finale();
    }
    const Z = zone();
    if (!Z) return;
    for (const c of SUNRISE.cities) {
      const O = Z.cityObjs[c.key];
      const on = !!s.woke[c.key];
      O.flame.visible = O.halo.visible = O.beam.visible = on;
      O.mark.material.opacity = on ? 0.7 : 0.35;
      if (on) spawnPeople(Z, c);
      const got = s.shards[c.key] || {};
      O.shardObjs.forEach((g, i) => (g.visible = !got[i] && !on));
    }
  }
  function panelHTML() {
    const s = p18();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌅 The Sunrise Lands</h3><ul>
      ${row(s.sailed, "Sail with Marisol from Reedmere's harbour")}
      ${SUNRISE.cities.map((c) => row(s.woke[c.key], `${c.icon} Wake ${c.name} <span class="res">(${Object.keys(s.shards[c.key] || {}).length}/3 shards)</span>`)).join("")}
    </ul><div class="kit">☀️ each city's dim glow shows where it is · relight its beacon with 3 shards</div>`;
  }
  return { update, interactable, panelHTML, done: () => !!p18().done };
}
