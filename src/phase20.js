// ------------------------------------------------------------
//  🌠  PHASE 20 — "The Falling Star"
//
//  The star Sprig named THISTLE is slipping out of the sky. To catch it,
//  you need something from each of the three lands you saved:
//    🔦 the great lens of the Moonless Isle's lighthouse
//    ☀️ a sunstone from Skyhold's beacon (the Sunrise Lands)
//    🌌 a ribbon of aurora silk from Northlight (the Aurora Reach)
//  Bring them to the Last Keeper in Silverveil, then climb the Starway
//  one last time and CATCH the star.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, registerKeepsake, openCard, closeCard } from "./cityLife.js";
import { ISLE, SUNRISE, AURORA, STARWAY } from "./questZones.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("starcatcher", "🌠", "The Caught Star (your very own star, glowing in a jar)");
const PARTS = [
  { key: "lens", icon: "🔦", name: "the Moonless Isle's lighthouse lens", zone: "isle", hint: "climb the lighthouse on the Moonless Isle", at: () => ({ x: ISLE.top.x, z: ISLE.top.z, y: ISLE.top.y }) },
  { key: "sunstone", icon: "☀️", name: "a sunstone from Skyhold's beacon", zone: "sunrise", hint: "the beacon at the top of Skyhold (Sunrise Lands)", at: () => ({ x: SUNRISE.cities[4].x, z: SUNRISE.cities[4].z }) },
  { key: "silk", icon: "🌌", name: "a ribbon of aurora silk", zone: "aurora", hint: "Northlight's starstone tower (Aurora Reach)", at: () => ({ x: AURORA.cities[4].x, z: AURORA.cities[4].z }) },
];

export function initPhase20(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 3.4) => Math.hypot(me().x - x, me().z - z) < r;
  const p20 = () => (st.p20 ||= { started: false, parts: {}, keeper: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  let wait = 0;
  let starObj = null;

  function begin() {
    p20().started = true;
    st.phase = 20;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "Home again, at last. That night, lying in the grass outside your cottage, you look up for your star — the one Sprig named THISTLE." },
      { dur: 4, black: true, gameCam: true, text: "It's there… but it's flickering. Slipping. Sliding down the sky, a little lower every night." },
      { dur: 4.4, black: true, gameCam: true, who: "Sprig (very worried)", text: "“Thistle — your star is FALLING! If it falls into the sea it'll go out forever! We have to catch it!”" },
      { dur: 4.6, black: true, gameCam: true, who: "A note from the Last Keeper", text: "“A falling star can only be caught with a net of light: a lighthouse lens, a sunstone, and aurora silk — one from each land you saved. Bring them to me.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌠 PHASE 20 — The Falling Star. Gather a treasure from each of the three lands you saved (sail with Marisol from Reedmere).", true) },
    ]);
  }
  function interactable() {
    if (st.phase < 20) return null;
    const s = p20();
    const w = here();
    // ⛵ Marisol: sail to any of the three lands
    if (w === "reedmere" && api.marisolAt) {
      const M0 = api.marisolAt();
      if (M0 && near(M0.x, M0.z, 2.8)) return { label: "ask Captain Marisol to sail ⛵", act: () => {
        const go = (zone, at) => {
          closeCard();
          fadeThrough(() => {
            ctx.goCity(zone);
            ctx.placePlayer(at.x, at.z, Math.PI);
          }, 1);
        };
        openCard(`<div class="card"><h3>⛵ Captain Marisol</h3><div class="coins">“Where to, High Moonkeeper?”</div>
          <div class="item"><span class="ic">🏝️</span><span class="nm">The Moonless Isle</span><button data-z="isle">sail!</button></div>
          <div class="item"><span class="ic">🌅</span><span class="nm">The Sunrise Lands</span><button data-z="sunrise">sail!</button></div>
          <div class="item"><span class="ic">🌌</span><span class="nm">The Aurora Reach</span><button data-z="aurora">sail!</button></div>
          <div class="close">Esc — stay in Reedmere</div></div>`, (el) => el.querySelectorAll("button[data-z]").forEach((b) => (b.onclick = () => {
          const z = b.dataset.z;
          go(z, z === "isle" ? { x: ISLE.dock.x, z: ISLE.dock.z - 4 } : z === "sunrise" ? { x: SUNRISE.dock.x, z: SUNRISE.dock.z - 6 } : { x: AURORA.dock.x, z: AURORA.dock.z - 6 });
        })));
      } };
    }
    // the three parts
    for (const P of PARTS) {
      if (s.parts[P.key] || w !== P.zone) continue;
      const a = P.at();
      if (!near(a.x, a.z, P.zone === "isle" ? ISLE.top.r + 0.6 : 6)) continue;
      if (P.zone === "isle" && me().y < ISLE.top.y - 1) continue;
      return { label: `take ${P.name} ${P.icon}`, act: () => {
        s.parts[P.key] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.parts).length;
        ctx.say(`${P.icon} ${P.name[0].toUpperCase() + P.name.slice(1)} — given gladly by the people you saved. (${n}/3)${n >= 3 ? " Now to the Last Keeper in Silverveil!" : ""}`, true);
      } };
    }
    // the Keeper weaves the net
    if (w === "silverveil" && Object.keys(s.parts).length >= 3 && !s.keeper) {
      const K = ctx.city().people.keeper;
      if (K && near(K.x, K.z, 3)) return { label: "give the Last Keeper the three treasures 🌠", act: () => {
        const y = ctx.city().height(K.x, K.z);
        playCutscene([
          { dur: 4.6, from: [K.x + 3, y + 2, K.z + 3], look: [K.x, y + 1, K.z], who: "The Last Keeper", text: "“The lens to gather light. The sunstone to warm it. The aurora silk to hold it.” She weaves them together — and in her paws is a shimmering NET OF LIGHT." },
          { dur: 4.4, from: [K.x + 3, y + 2, K.z + 3], look: [K.x, y + 1, K.z], who: "The Last Keeper", text: "“Climb the Starway out of the moon-pool, to the very top. When your star falls past — catch it. Quickly, little Moonkeeper. It's falling tonight.”" },
          { dur: 0.4, gameCam: true, end: () => {
            s.keeper = true;
            save();
            redraw();
            chime();
          } },
        ]);
      } };
    }
    // the Starway, to catch it
    if (w === "silverveil" && s.keeper && !s.done && near(0, 0, 9)) return { label: "climb the Starway to catch your star ✨", act: () => fadeThrough(() => {
      ctx.goCity("starway");
      ctx.placePlayer(0, 0, 0);
      ctx.say("🌠 Climb to the top of the Starway — the falling star is coming!", true);
    }, 1) };
    if (w === "starway" && s.keeper && !s.done) {
      const T = STARWAY.top;
      if (near(T.x, T.z, T.r + 0.5) && Math.abs(me().y - T.y) < 1.5) return { label: "hold up the net of light and CATCH YOUR STAR 🌠", act: catchIt };
    }
    return null;
  }
  function catchIt() {
    const s = p20();
    const Z = ctx.city();
    const T = STARWAY.top;
    if (!starObj) {
      starObj = new THREE.Group();
      starObj.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: 0xfff4c0 })), glow(0xffe8a0, 18, 0.95));
      Z.group.add(starObj);
    }
    playCutscene([
      { dur: 4.6, from: [T.x + 10, T.y + 6, T.z + 10], look: [T.x, T.y + 10, T.z], text: "There it is — your star, tumbling down out of the sky in a long golden streak, straight toward you…", update: (k) => {
        starObj.position.set(T.x + (1 - k) * 60, T.y + 2 + (1 - k) * 70, T.z - (1 - k) * 40);
        starObj.rotation.y += 0.1;
      } },
      { dur: 4.2, from: [T.x + 4, T.y + 2.4, T.z + 4], look: [T.x, T.y + 1.6, T.z], text: "You hold up the net of light — and the star drops into it, soft as a dandelion seed. It's warm. It's humming. It's YOURS.", update: () => starObj.position.set(T.x, T.y + 1.6, T.z) },
      { dur: 4.6, from: [T.x + 4, T.y + 2.4, T.z + 4], look: [T.x, T.y + 1.6, T.z], who: "Sprig", text: "“You CAUGHT it! Now it can live in a jar on your windowsill, and light up your whole cottage — FOREVER!”" },
      { dur: 4.4, black: true, gameCam: true, text: "And from that night on, there was always a little star glowing in the window of the cozy cottage — and anyone lost in the Great Forest could follow it home." },
      { dur: 4, black: true, gameCam: true, who: "🌠 PHASE 20 COMPLETE", text: "The Falling Star\n🪙 400 · 🌠 Your Caught Star" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 400;
        (c.owned ||= {}).starcatcher = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌠 Your star is safe — glowing in a jar, forever yours. (Hang it on a wall at home!)", true);
      } },
    ]);
  }
  function update(dt) {
    if (st.phase === 19 && st.p19 && st.p19.done && !p20().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
  }
  function panelHTML() {
    const s = p20();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌠 The Falling Star</h3><ul>
      ${PARTS.map((P) => row(s.parts[P.key], `${P.icon} ${P.name}<div class="sub">&nbsp;&nbsp;${P.hint}</div>`)).join("")}
      ${row(s.keeper, "Bring them to the Last Keeper in Silverveil")}
      ${row(s.done, "Climb the Starway and catch your star")}
    </ul><div class="kit">⛵ Marisol sails from Reedmere's harbour to every land</div>`;
  }
  return { update, interactable, panelHTML, done: () => !!p20().done };
}
