// ------------------------------------------------------------
//  ✨  PHASE 15 — "Sprig's Story"
//
//  Sprig sets off on a first solo Moonkeeper journey… and doesn't come
//  back. Follow Sprig's trail of notes through four cities, to the
//  moon-pool of Silverveil — and up the STARWAY, where Sprig is stranded
//  on a broken bridge of stars. Relight the three fallen stars, and
//  find out why Sprig went up there in the first place.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { STARWAY } from "./questZones.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("thistlestar", "🌟", "The Star Named Thistle (Sprig's gift — the whole sky is a little brighter)");

// Sprig's trail: one note in each city, each pointing to the next
const TRAIL = [
  { city: "reedmere", name: "Reedmere", text: "“Day 1. Started my FIRST solo journey! Reedmere first — the fishers say the stars are clearest over the lagoon. Next: the Harvest Moon fields in Golden Hollow!” — Sprig" },
  { city: "golden", name: "Golden Hollow", text: "“Day 2. The scarecrows bowed at me!! Harvest-Mother Barley says the oldest star maps are kept by the Wardens up north. Off to Frostpine!” — Sprig" },
  { city: "frostpine", name: "Frostpine", text: "“Day 4. SO cold. Keeper Hollis showed me a whisper in the ice: ‘the road to the stars begins in the moon-pool.’ Silverveil, here I come!” — Sprig" },
  { city: "silverveil", name: "Silverveil", text: "“Day 5. I found it — a STAIR OF STARS rising out of the moon-pool! I'm going up. I have to — it's for Thistle. Don't worry about me!” — Sprig" },
];

export function initPhase15(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const p15 = () => (st.p15 ||= { started: false, notes: 0, stars: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "starway" ? ctx.city() : null);
  let wait = 0;

  // ---------------------------------------------------------------- beginning
  function begin() {
    const s = p15();
    s.started = true;
    st.phase = 15;
    st.p12 ||= {};
    st.p12.apprentice = true; // (Sprig's story — even if you never took an apprentice)
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "A few quiet days after Silverveil, Sprig comes to you, bouncing with excitement." },
      { dur: 4.2, black: true, gameCam: true, who: "Sprig", text: "“Thistle! I want to go on a journey — ALL by myself. A real Moonkeeper journey! I'll be back in three days. I promise!”" },
      { dur: 3.6, black: true, gameCam: true, text: "Three days pass. Then four. Then five…" },
      { dur: 4.4, black: true, gameCam: true, who: "A letter from Headmaster Bramble", text: "“Thistle — Sprig hasn't come home. The last anyone saw, Sprig was setting off for Reedmere. Please… find our little Moonkeeper.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("✨ PHASE 15 — Sprig's Story. Sprig is missing! Start in Reedmere — look for Sprig's notes (the golden beam).", true) },
    ]);
  }

  // ---------------------------------------------------------------- the notes
  let notes = {};
  function noteFor(i) {
    const T = TRAIL[i];
    const c = ctx.city();
    if (!c || here() !== T.city) return null;
    if (notes[i] && notes[i].c === c) return notes[i];
    const w = c.spots.waystone || { x: 0, z: 30 };
    let at = { x: w.x + 7, z: w.z + 5 };
    for (let r = 0; r < 30; r += 1.5) {
      let ok = false;
      for (let a = 0; a < 6.3; a += 0.5) {
        const x = w.x + 7 + Math.cos(a) * r;
        const z = w.z + 5 + Math.sin(a) * r;
        if ((!c.waterAt || c.waterAt(x, z) === null) && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 1.2)) {
          at = { x, z };
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    if (T.city === "silverveil") at = { x: 0, z: 13 }; // (at the edge of the moon-pool)
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), new THREE.MeshBasicMaterial({ color: 0xfff4d8, side: THREE.DoubleSide }));
    paper.position.y = 0.9;
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: 0x8a8a94 }));
    pebble.position.y = 0.15;
    g.add(paper, pebble, glow(0xffe08a, 2));
    g.children[2].position.y = 0.9;
    g.position.set(at.x, c.height(at.x, at.z), at.z);
    c.group.add(g);
    return (notes[i] = { c, g, ...at, paper });
  }
  // ---------------------------------------------------------------- the Starway
  function enterStarway() {
    fadeThrough(() => {
      ctx.goCity("starway");
      ctx.placePlayer(0, 0, 0);
      ctx.say("✨ THE STARWAY. Stepping-stones of starlight spiral up into the night… and far above, the bridge is BROKEN. Three fallen stars lie on ledges beside the path — light them!", true);
    }, 1);
  }
  let sprigUp = null;
  function starwayUpdate(dt, t) {
    const Z = zone();
    if (!Z) return;
    const s = p15();
    const W = STARWAY;
    Z.unbroken = W.ledges.every((_, i) => s.stars[i]);
    // the fallen stars on the ledges (dim until lit)
    if (!Z.starObjs) {
      Z.starObjs = W.ledges.map((l) => {
        const g = new THREE.Group();
        const st0 = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0x8a8aa8 }));
        const h = glow(0xffe08a, 3, 0.15);
        g.add(st0, h);
        g.position.set(l.x, l.y + 1, l.z);
        Z.group.add(g);
        return { g, st: st0, h };
      });
      // Sprig, stranded at the top, waving
      sprigUp = buildThistle({ tunicColor: 0x3a8a9a, hoodColor: 0x3a8a9a, pack: true });
      sprigUp.scale.setScalar(0.72);
      sprigUp.position.set(W.top.x, W.top.y, W.top.z);
      Z.group.add(sprigUp);
    }
    Z.starObjs.forEach((o, i) => {
      const lit = !!s.stars[i];
      o.st.material.color.setHex(lit ? 0xfff0a0 : 0x6a6a88);
      o.h.material.opacity = lit ? 0.9 : 0.15 + Math.sin(t * 3 + i) * 0.08;
      o.g.rotation.y = t;
    });
    sprigUp.rotation.y = Math.atan2(me().x - W.top.x, me().z - W.top.z);
    sprigUp.position.y = W.top.y + (Z.unbroken ? Math.abs(Math.sin(t * 6)) * 0.2 : 0);
    // a fall into the night → back to the bottom (or the last lit star)
    const p = me();
    if (p.y < -12) {
      // (a fall sends you all the way back to the BOTTOM — the moonstone disc)
      ctx.placePlayer(0, 0, 0);
      me().y = 0;
      fadeThrough(() => {}, 0.3);
      ctx.say("✨ You slip off into the stars… and float all the way back down to the bottom, like a dandelion seed. (The stars you lit stay lit!) Try again!", true);
    }
    // reached Sprig!
    if (Z.unbroken && !s.done && near(W.top.x, W.top.z, 3.2) && Math.abs(p.y - W.top.y) < 1.5 && !ctx.playing()) finale(Z);
  }
  function finale(Z) {
    const W = STARWAY;
    const T = W.top;
    const s = p15();
    s.done = "playing";
    playCutscene([
      { dur: 4, from: [T.x + 6, T.y + 3, T.z + 6], look: [T.x, T.y + 0.8, T.z], who: "Sprig", text: "“THISTLE! You came! I knew you would — I KNEW it! The bridge broke behind me and I couldn't get down…”" },
      { dur: 4.6, from: [T.x + 3, T.y + 1.6, T.z + 3], look: [T.x, T.y + 0.6, T.z], who: "Thistle", text: "“Sprig, you scared everyone half to death! What were you DOING all the way up here?”" },
      { dur: 5, from: [T.x + 3, T.y + 1.6, T.z + 3], look: [T.x, T.y + 0.6, T.z], who: "Sprig (very small voice)", text: "“…I wanted to give you something. You gave ME everything — the lessons, the cloak, the adventures. So I climbed up to the stars… to find one with no name.”" },
      { dur: 5, from: [T.x - 2, T.y + 6, T.z + 10], look: [T.x, T.y + 20, T.z - 20], text: "Sprig points up. Right above the star-temple, one new star shines brighter than all the rest.", run: () => {
        const star = new THREE.Group();
        star.add(new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), new THREE.MeshBasicMaterial({ color: 0xfff4c0 })), glow(0xffe8a0, 22, 0.9));
        star.position.set(T.x, T.y + 22, T.z - 18);
        Z.group.add(star);
      } },
      { dur: 4.6, from: [T.x + 3, T.y + 1.6, T.z + 3], look: [T.x, T.y + 0.6, T.z], who: "Sprig", text: "“The Moonkeepers wrote it in the star book now. That one's called THISTLE. Forever and ever. Do you… do you like it?”" },
      { dur: 4, from: [T.x + 3, T.y + 1.6, T.z + 3], look: [T.x, T.y + 0.6, T.z], who: "Thistle", text: "“…It's the best present anyone's ever given me. Now come here — and let's go HOME.”" },
      { dur: 4, black: true, gameCam: true, who: "✨ PHASE 15 COMPLETE", text: "Sprig's Story\n🪙 200 · 🌟 The Star Named Thistle" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 200;
        (c.owned ||= {}).thistlestar = true;
        saveCity();
        save();
        redraw();
        chime();
        window.__sprigHidden = false;
        ctx.say("🌟 Sprig is safe — and there's a star named THISTLE in the sky. Sprig follows you everywhere again. (E on the moonstone disc at the bottom to go home.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 15) return null;
    const s = p15();
    // the notes, in order
    if (s.notes < TRAIL.length) {
      const N = noteFor(s.notes);
      if (N && near(N.x, N.z, 2.4)) return { label: "read Sprig's note 📜", act: () => {
        const T = TRAIL[s.notes];
        s.notes++;
        N.g.visible = false;
        save();
        redraw();
        chime();
        ctx.say(`📜 ${T.text}`, true);
      } };
    }
    // after the last note: the stair of stars in the moon-pool
    if (s.notes >= TRAIL.length && here() === "silverveil" && near(0, 0, 9) && s.done !== true) return { label: "climb the stair of stars out of the moon-pool ✨", act: enterStarway };
    const Z = zone();
    if (Z) {
      if (near(0, 0, 4) && me().y < 1) return { label: "go back down to Silverveil", act: () => fadeThrough(() => ctx.goCity("silverveil"), 0.8) };
      for (let i = 0; i < STARWAY.ledges.length; i++) {
        const l = STARWAY.ledges[i];
        if (s.stars[i] || !near(l.x, l.z, 2) || Math.abs(me().y - l.y) > 1.5) continue;
        return { label: "relight the fallen star ⭐", act: () => {
          s.stars[i] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(s.stars).length;
          ctx.say(n >= 3 ? "⭐ All three stars blaze — and the broken bridge FILLS IN with starlight! Climb to Sprig!" : `⭐ A star relit (${n}/3) — the bridge flickers…`, true);
        } };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- each frame
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.9, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 30;
    beacon.add(beam);
  }
  function update(dt, t) {
    if (st.phase === 14 && st.p14 && st.p14.done && !p15().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 15) return;
    const s = p15();
    // Sprig is away until you find them
    window.__sprigHidden = s.done !== true;
    starwayUpdate(dt, t);
    // the beacon on the next note
    beacon.visible = false;
    if (s.notes < TRAIL.length) {
      const N = noteFor(s.notes);
      if (N) {
        if (beacon.parent !== N.c.group) N.c.group.add(beacon);
        beacon.visible = true;
        beacon.position.set(N.x, N.c.height(N.x, N.z), N.z);
        N.paper.rotation.y = t;
      }
    }
  }
  function panelHTML() {
    const s = p15();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const lit = Object.keys(s.stars).length;
    return `<h3>✨ Sprig's Story</h3><ul>
      ${TRAIL.map((T, i) => row(s.notes > i, `Find Sprig's note in ${T.name}`)).join("")}
      ${row(s.notes >= TRAIL.length && (here() === "starway" || lit > 0), "Climb the stair of stars from the moon-pool")}
      ${row(lit >= 3, `Relight the three fallen stars <span class="res">(${lit}/3)</span>`)}
      ${row(s.done === true, "Reach Sprig")}
    </ul><div class="kit">✨ the golden beam marks Sprig's next note · C — Life Goals</div>`;
  }
  return { update, interactable, panelHTML, done: () => p15().done === true };
}
