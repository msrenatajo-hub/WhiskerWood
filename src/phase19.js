// ------------------------------------------------------------
//  🌌  PHASE 19 — "The Aurora Reach"
//
//  The Sunrise Compass points west, to the last lost continent: a land of
//  endless snow under endless northern lights. Its FIVE cities lie sealed
//  inside domes of ice. Each city's STARSTONE is hidden out in the snow —
//  no golden beams this time, only riddles. Bring each starstone home and
//  the ice melts.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { AURORA } from "./questZones.js";

registerKeepsake("auroracrown", "👑", "The Aurora Crown (keeper of all three lands)");

export function initPhase19(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const p19 = () => (st.p19 ||= { started: false, sailed: false, stones: {}, freed: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "aurora" ? ctx.city() : null);
  let wait = 0;
  let finaleCool = 0;

  function begin() {
    p19().started = true;
    st.phase = 19;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "One morning the Sunrise Compass begins to hum — and its needle swings round to point WEST, past every map anyone has ever drawn." },
      { dur: 4.4, black: true, gameCam: true, who: "Captain Marisol", text: "“The last lost land. Snow, they say, and lights in the sky that never go out. I've never sailed so far. …So of course we're going.”" },
      { dur: 3.6, black: true, gameCam: true, who: "Sprig", text: "“I'm packing EVERY scarf.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌌 PHASE 19 — The Aurora Reach. Meet Captain Marisol at Reedmere's harbour and sail west!", true) },
    ]);
  }
  function sail() {
    const s = p19();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "Eight days west. The sea turns grey, then silver. Icebergs drift past, big as castles. Then one night the whole sky catches fire with green and violet light…" },
      { dur: 4.2, black: true, gameCam: true, text: "…and below it: a land of snow, and five great domes of ice, glittering. Inside each one, a whole city, frozen still." },
      { dur: 0.4, black: true, gameCam: true, end: () => {
        s.sailed = true;
        save();
        redraw();
        ctx.goCity("aurora");
        ctx.placePlayer(AURORA.dock.x, AURORA.dock.z - 6, Math.PI);
      } },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌌 THE AURORA REACH. Five cities sealed in ice. Each one's STARSTONE is hidden out in the snow — read the riddles in your list (top right). No golden beams here!", true) },
    ]);
  }
  function free(c) {
    const s = p19();
    const Z = zone();
    const O = Z.cityObjs[c.key];
    const y = Z.height(c.x, c.z);
    s.freed[c.key] = true;
    save();
    redraw();
    const n = Object.keys(s.freed).length;
    playCutscene([
      { dur: 4, from: [c.x + c.r + 10, y + 12, c.z + c.r + 10], look: [c.x, y + 6, c.z], text: `You press ${c.name}'s starstone against the ice dome. It glows… and the ice begins to CRACK.`, run: () => {
        O.star.visible = O.halo.visible = true;
      } },
      { dur: 4.4, from: [c.x + c.r + 10, y + 12, c.z + c.r + 10], look: [c.x, y + 6, c.z], text: "With a sound like a thousand bells, the dome shatters into snowflakes — and the frozen mice inside blink, stretch, and step out into the light.", update: (k) => {
        O.dome.material.opacity = 0.45 * (1 - k);
      }, end: () => {
        O.dome.visible = false;
        for (const col of O.domeCols) col.r = 0;
        spawn(Z, c);
      } },
      { dur: 0.4, gameCam: true, end: () => {
        chime();
        if (n >= 5) finaleCool = 0.5;
        else ctx.say(`${c.icon} ${c.name} is FREE! (${n}/5)`, true);
      } },
    ]);
  }
  function spawn(Z, c) {
    const O = Z.cityObjs[c.key];
    if (O.people.length) return;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const m = buildThistle({ tunicColor: [c.color, 0x6a8ab8, 0xb8c8e8][k % 3], hoodColor: 0xf4f8ff, pack: false });
      const x = c.x + Math.cos(a) * c.r * 0.3;
      const z = c.z + Math.sin(a) * c.r * 0.3;
      m.position.set(x, Z.height(x, z), z);
      m.rotation.y = Math.atan2(c.x - x, c.z - z);
      Z.group.add(m);
      O.people.push(m);
    }
  }
  function finale() {
    const s = p19();
    playCutscene([
      { dur: 4.6, from: [0, 110, 170], look: [0, 30, -60], text: "Five starstones blaze in five free cities — and the aurora above the Reach flares brighter than it has in a thousand years." },
      { dur: 5, black: true, gameCam: true, who: "A voice in the northern lights", text: "“Three lands, lost in the dark: the Moonless Isle, the Sunrise Lands, and the Aurora Reach. One small mouse with a lantern found them all.”" },
      { dur: 4.6, black: true, gameCam: true, who: "Renata Josephine Rudy (in the aurora)", text: "“I never got this far, Thistle. You went further than any Moonkeeper ever has. The whole wide world is one again.”" },
      { dur: 4, black: true, gameCam: true, who: "🌌 PHASE 19 COMPLETE", text: "The Aurora Reach\n🪙 400 · 👑 The Aurora Crown" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 400;
        (c.owned ||= {}).auroracrown = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("👑 All five cities of the Aurora Reach are free! (E at the dock to sail home.)", true);
      } },
    ]);
  }

  function interactable() {
    if (st.phase < 19) return null;
    const s = p19();
    if (here() === "reedmere" && api.marisolAt) {
      const M0 = api.marisolAt();
      if (M0 && near(M0.x, M0.z, 2.8)) return { label: s.sailed ? "sail west to the Aurora Reach ⛵" : "set sail WEST for the Aurora Reach ⛵", act: () => (s.sailed ? fadeThrough(() => {
        ctx.goCity("aurora");
        ctx.placePlayer(AURORA.dock.x, AURORA.dock.z - 6, Math.PI);
      }, 1) : sail()) };
    }
    const Z = zone();
    if (!Z) return null;
    if (near(AURORA.dock.x, AURORA.dock.z, 5)) return { label: "sail home to Reedmere ⛵", act: () => fadeThrough(() => ctx.goCity("reedmere"), 1) };
    for (const c of AURORA.cities) {
      if (!s.stones[c.key] && near(c.stone.x, c.stone.z, 2.4)) return { label: `pick up ${c.name}'s starstone ✨`, act: () => {
        s.stones[c.key] = true;
        save();
        redraw();
        chime();
        ctx.say(`✨ ${c.name}'s starstone! It's humming — take it to ${c.name}'s ice dome.`, true);
      } };
      if (s.stones[c.key] && !s.freed[c.key] && Math.hypot(me().x - c.x, me().z - c.z) < c.r + 4) return { label: `free ${c.name} from the ice ${c.icon}`, act: () => free(c) };
    }
    return null;
  }
  function update(dt) {
    if (st.phase === 18 && st.p18 && st.p18.done && !p19().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 19) return;
    const s = p19();
    finaleCool -= dt;
    if (Object.keys(s.freed).length >= 5 && !s.done && !ctx.playing() && finaleCool <= 0) {
      finaleCool = 3;
      finale();
    }
    const Z = zone();
    if (!Z) return;
    for (const c of AURORA.cities) {
      const O = Z.cityObjs[c.key];
      O.stoneObj.visible = !s.stones[c.key];
      if (s.freed[c.key]) {
        O.dome.visible = false;
        for (const col of O.domeCols) col.r = 0;
        O.star.visible = O.halo.visible = true;
        spawn(Z, c);
      }
    }
  }
  function panelHTML() {
    const s = p19();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌌 The Aurora Reach</h3><ul>
      ${row(s.sailed, "Sail WEST with Marisol from Reedmere")}
      ${AURORA.cities.map((c) => row(s.freed[c.key], `${c.icon} Free ${c.name}${s.freed[c.key] ? "" : s.stones[c.key] ? ` <span class="res">(starstone found — go to its dome!)</span>` : `<div class="sub">&nbsp;&nbsp;🔎 ${c.riddle}</div>`}`)).join("")}
    </ul><div class="kit">✨ starstones twinkle faintly in the snow — no beams, only riddles!</div>`;
  }
  return { update, interactable, panelHTML, done: () => !!p19().done };
}
