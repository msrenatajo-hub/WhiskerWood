// ------------------------------------------------------------
//  ✨  PHASE 35 — "The Wisp Ring"
//
//  The oldest part of the Great Forest is going GREY — leaves, moss, even
//  the light. Owl-Warden Fern knows why: the Forest Guardian, who keeps the
//  old wood alive, has fallen into a sleep so deep it may never wake.
//  Its glade is hidden. Deep in the darkest part of the forest there's a
//  ring of glowing mushrooms; step inside at MOONRISE and a door opens.
//    ✨ gather the glowing will-o'-wisps into your lantern
//    🌿 listen to the three whispering willows — each knows one part of
//       the Guardian's true name
//    🌳 give a wisp's light to each of the three sleeping tree spirits
//    🦌 then call the Guardian by its true name — before the glade fades!
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { WISPGLADE } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("guardianleaf", "🍃", "The Guardian's Evergreen Leaf (the old wood lives because of you)");
ITEM_POWERS.guardianleaf = { type: "heal", n: 0.12 };

const FADE_SECONDS = 360; // (the glade fades if you take too long — you can always come back next moonrise)
const LANTERN_MAX = 8;
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase35(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p35 = () => (st.p35 ||= { started: false, entered: false, lantern: 0, syl: {}, spirits: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const zone = () => (here() === "wispglade" ? ctx.city() : null);
  const K = WISPGLADE;
  let wait = 0, fadeT = 0, inGladeLast = false;
  const isMoonrise = () => {
    const d = ctx.dayTime ? ctx.dayTime() : 0.5;
    return d > 0.74 && d < 0.9;
  };

  // ---------------------------------------------------------------- 🍄 the Wisp Ring, deep in the old forest
  let ring = null;
  function buildRing() {
    if (ring || !ctx.outsideGroup || !ctx.home) return;
    const H0 = ctx.home;
    let at = { x: H0.x - 90, z: H0.z - 62 };
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = k * 1.1;
      const p = { x: H0.x - 90 + Math.cos(a) * d, z: H0.z - 62 + Math.sin(a) * d };
      if ((!ctx.isClear || ctx.isClear(p.x, p.z, 5)) && !(ctx.isWater && ctx.isWater(p.x, p.z))) {
        at = p;
        break;
      }
    }
    const g = new THREE.Group();
    const caps = [];
    for (let k = 0; k < 13; k++) {
      const a = (k / 13) * Math.PI * 2;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 }));
      stalk.position.set(Math.cos(a) * 3.2, 0.25, Math.sin(a) * 3.2);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8affd8, emissive: 0x4ad8a8, emissiveIntensity: 0.3 }));
      cap.position.set(Math.cos(a) * 3.2, 0.48, Math.sin(a) * 3.2);
      g.add(stalk, cap);
      caps.push(cap);
    }
    // an old stump to sit on while you wait for the moon
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.8, 9), new THREE.MeshStandardMaterial({ color: 0x5a4028, flatShading: true }));
    stump.position.set(5.5, 0.4, 0);
    const door = glow(0x9fffd8, 5, 0);
    door.position.y = 1.4;
    g.add(stump, door);
    g.position.set(at.x, ctx.terrainHeight(at.x, at.z), at.z);
    g.visible = false;
    ctx.outsideGroup.add(g);
    ring = { g, caps, door, ...at, stump: { x: at.x + 5.5, z: at.z } };
  }

  function enterGlade() {
    const s = p35();
    fadeThrough(() => {
      ctx.goCity("wispglade");
      ctx.placePlayer(K.door.x, K.door.z - 3, Math.PI);
      fadeT = 0;
      s.lantern = 0;
      if (!s.entered) {
        s.entered = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "✨ The glade within the Wisp Ring — green and glowing, and the Guardian dozing happily under its flowers."
        : "✨ The moonlight bends… and you're in a hidden glade, misty and grey. Wisps drift between the trees. In the middle, something ENORMOUS sleeps under a blanket of moss. (Hurry — the glade is fading!)", true);
    }, 1);
  }
  function leaveGlade(msg) {
    fadeThrough(() => {
      ctx.goOutside();
      if (ring) ctx.placePlayer(ring.x + 4.5, ring.z + 1, Math.PI / 2);
      if (msg) ctx.say(msg, true);
    }, 1);
  }

  // (you can fly back to the glade — but only once the Guardian is awake; before that, it's the moonrise door or nothing)
  DRAGON_DESTS.push({ id: "wispglade", icon: "✨", name: "The Glade Within the Wisp Ring", when: () => !!p35().done, go: enterGlade });
  function begin() {
    p35().started = true;
    st.phase = 35;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.6, black: true, gameCam: true, text: "One morning the leaves at the edge of the old wood are GREY. Not autumn-brown — grey, like ash. And the next morning, more of them." },
      { dur: 5, black: true, gameCam: true, who: "Owl-Warden Fern", text: "“The Forest Guardian sleeps. It keeps the oldest wood alive — and now it's slipped so deep into sleep that the forest is fading with it. If it isn't woken soon… it never will be.”" },
      { dur: 5.2, black: true, gameCam: true, who: "Owl-Warden Fern", text: "“Its glade is hidden. Deep in the darkest part of the forest — far to the north-west of your cottage — there's a ring of glowing mushrooms. Step inside at MOONRISE and the door will open. Go gently, Thistle. Old things wake slowly.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("✨ PHASE 35 — The Wisp Ring. Find the ring of glowing mushrooms far to the north-west of your cottage, and step inside at moonrise (there's a stump to wait on).", true) },
    ]);
  }

  // ---------------------------------------------------------------- ✨ the wisps in the glade
  let wispsFor = null, wisps = [];
  function buildWisps(Z) {
    if (wispsFor === Z) return;
    wispsFor = Z;
    wisps = [];
    for (let k = 0; k < 12; k++) {
      const g = glow([0x9fffd8, 0xd8f0ff, 0xfff0a0][k % 3], 1.6, 0.9);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      g.add(core);
      Z.group.add(g);
      wisps.push({ g, a: k * 0.52, r: 10 + (k % 4) * 6, sp: 0.2 + (k % 3) * 0.08, ph: k, gone: 0 });
    }
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 35) return null;
    const s = p35();
    if (here() === "forest" && ring) {
      if (!near(ring.x, ring.z, 7)) return null;
      if (near(ring.stump.x, ring.stump.z, 1.8) && !isMoonrise()) return { label: "sit on the old stump and wait for moonrise 🌙", act: () => fadeThrough(() => {
        ctx.setTime && ctx.setTime(0.76);
        ctx.say("🌙 You sit quietly on the old stump while the sun goes down… and down… The moon rises over the treetops — and the mushroom ring begins to GLOW.", true);
      }, 1.2) };
      if (near(ring.x, ring.z, 3) && !isMoonrise()) return { label: "step into the mushroom ring 🍄", act: () => ctx.say("🍄 Nothing happens… The ring is just a ring, in daylight. (Wait for MOONRISE — try the old stump.)", true) };
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    if (near(K.door.x, K.door.z, 2.6)) return { label: "step back out through the mushroom ring 🍄", act: () => leaveGlade() };
    if (s.done) return null;
    for (const [i, W] of Z.willows.entries()) {
      if (!near(W.x, W.z, 3.2)) continue;
      return { label: "listen to the whispering willow 🌿", act: () => {
        s.syl[i] = true;
        save();
        redraw();
        chime();
        const got = Z.willows.filter((_, j) => s.syl[j]).map((w) => w.syl);
        ctx.say(`🌿 The willow's leaves rustle, and a voice like wind whispers: “…${W.syl}…” (the Guardian's name, so far: ${got.join("·")}${got.length >= 3 ? " — ARVENDOR!" : ""})`, true);
      } };
    }
    for (const [i, SP] of Z.spirits.entries()) {
      if (s.spirits[i] || !near(SP.x, SP.z, 3)) continue;
      if (s.lantern < 1) return { label: "look at the tree spirit 🌳", act: () => ctx.say("🌳 An ancient tree spirit, still as stone, its eyes dark. It needs LIGHT to wake — catch a wisp in your lantern and bring it here.", true) };
      return { label: "give the tree spirit a wisp's light ✨", act: () => {
        s.lantern--;
        s.spirits[i] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.spirits).length;
        ctx.say(`🌳 The wisp floats from your lantern into the tree spirit's chest. Its eyes glow green, and it creaks: “…awake… the Guardian… must wake…” (${n}/3 spirits awake)`, true);
      } };
    }
    if (near(K.guardian.x, K.guardian.z + 5, 4)) {
      const named = Object.keys(s.syl).length >= 3, spirits = Object.keys(s.spirits).length >= 3, lit = s.lantern >= 5;
      if (named && spirits && lit) return { label: "call the Guardian by its true name: “ARVENDOR!” 🦌", act: finale };
      return { label: "look at the sleeping Guardian 🦌", act: () => ctx.say(`🦌 It's breathing so slowly you can hardly see it. To wake it you'll need: ${[named ? "✔" : "○", "its true name (listen to the 3 willows)"].join(" ")} · ${spirits ? "✔" : "○"} the 3 tree spirits awake · ${lit ? "✔" : "○"} 5 wisps in your lantern (you have ${s.lantern}).`, true) };
    }
    return null;
  }

  function finale() {
    const s = p35();
    const Z = zone();
    const G0 = K.guardian;
    playCutscene([
      { dur: 4.4, from: [G0.x + 8, 5, G0.z + 14], look: [G0.x, 2, G0.z + 2], text: "You lift your lantern, bright with five wisps, and call into the mist: “ARVENDOR!” The three tree spirits call it with you, in voices like creaking oaks." },
      { dur: 4.6, from: [G0.x + 8, 5, G0.z + 14], look: [G0.x, 3, G0.z + 2], text: "The moss shivers. Two great eyes open, green as new leaves — and the Forest Guardian rises, a stag as tall as a tree, antlers full of blossom.", run: () => {
        Z.awake = true;
        Z.guardian.g.position.y = 0.6;
        Z.guardian.eyes.forEach((e) => {
          e.material.color.setHex(0x8aff8a);
          e.scale.y = 4;
        });
        Z.guardian.blooms.forEach((f) => (f.visible = true));
      } },
      { dur: 4.8, from: [0, 12, 26], look: [0, 2, 0], text: "Colour floods back into the glade — the willows green, the moss bright, flowers opening everywhere. And far beyond, all through the old wood, the grey leaves turn green again." },
      { dur: 5, black: true, gameCam: true, who: "Arvendor, the Forest Guardian (a voice like wind through a thousand trees)", text: "“I dreamed so long I forgot how to wake. You called me back, little one. Keep this leaf — it will never wither, and nor will the wood while you remember me.”" },
      { dur: 4, black: true, gameCam: true, who: "✨ PHASE 35 COMPLETE", text: "The Wisp Ring\n🪙 1100 · 🍃 The Guardian's Evergreen Leaf" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1100;
        (c.owned ||= {}).guardianleaf = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("✨ The Forest Guardian is awake, and the old wood is green again! (The Evergreen Leaf slowly heals you.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 34 && st.p34 && st.p34.done && !p35().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 35) return;
    const s = p35();
    // the ring in the forest — it glows at moonrise, and stepping in opens the door
    if (ctx.world() === "outside") {
      buildRing();
      if (ring) {
        ring.g.visible = true;
        const moon = isMoonrise();
        ring.caps.forEach((c, i) => (c.material.emissiveIntensity = moon ? 0.9 + Math.sin(t * 3 + i) * 0.2 : 0.25));
        ring.door.material.opacity = moon ? 0.5 + Math.sin(t * 2) * 0.2 : 0;
        if (moon && near(ring.x, ring.z, 2.2) && !ctx.playing()) {
          if (!ring.cool) {
            ring.cool = true;
            enterGlade();
          }
        } else if (!near(ring.x, ring.z, 4)) ring.cool = false;
      }
    }
    const Z = zone();
    if (!Z) {
      inGladeLast = false;
      return;
    }
    buildWisps(Z);
    // 🌫️ the fading — everything grey until the Guardian wakes
    if (s.done) Z.awake = true;
    if (!Z.awake && !ctx.playing()) fadeT += dt;
    const grey = Z.awake ? 0 : Math.min(0.85, 0.45 + (fadeT / FADE_SECONDS) * 0.4);
    if (!Z.baseCols) Z.baseCols = Z.fadeMats.map((m) => m.color.clone());
    Z.fadeMats.forEach((m, i) => m.color.copy(Z.baseCols[i]).lerp(new THREE.Color(0x8a8a8a), grey));
    Z.spirits.forEach((SP, i) => SP.eyes.forEach((e) => e.material.color.setHex(s.spirits[i] || s.done ? 0x8aff8a : 0x2a3a2a)));
    if (Z.awake) Z.guardian.blooms.forEach((f) => (f.visible = true));
    if (!Z.awake && fadeT > FADE_SECONDS && !ctx.playing()) {
      fadeT = 0;
      s.lantern = 0;
      save();
      redraw();
      return leaveGlade("🌫️ The glade grows fainter… and fainter… and you find yourself back in the mushroom ring in the dark forest. (Come back at the next moonrise — everything you've done is remembered.)");
    }
    // ✨ the wisps drift; catch one by touching it
    for (const W of wisps) {
      W.a += dt * W.sp;
      W.g.position.set(Math.cos(W.a) * W.r, 1.4 + Math.sin(t * 1.5 + W.ph) * 0.6, Math.sin(W.a) * W.r * 0.85);
      W.g.visible = W.gone <= 0 && !s.done;
      if (W.gone > 0) W.gone -= dt;
      else if (!s.done && s.lantern < LANTERN_MAX && Math.hypot(me().x - W.g.position.x, me().z - W.g.position.z) < 1.4) {
        s.lantern++;
        W.gone = 20; // (it floats back in after a while)
        save();
        redraw();
        chime();
        ctx.say(`✨ The wisp settles into your lantern, warm and humming. (${s.lantern} wisp${s.lantern === 1 ? "" : "s"} in your lantern)`);
      }
    }
  }

  function panelHTML() {
    const s = p35();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const syl = Object.keys(s.syl).length, sp = Object.keys(s.spirits).length;
    const inside = here() === "wispglade" && !s.done;
    return `<h3>✨ The Wisp Ring</h3><ul>
      ${row(s.entered, "Find the mushroom ring far north-west of your cottage — step in at MOONRISE")}
      ${row(syl >= 3, `Listen to the three whispering willows (${syl}/3)`)}
      ${row(sp >= 3, `Give a wisp's light to each tree spirit (${sp}/3)`)}
      ${row(s.done, `Wake the Guardian: its true name + 5 wisps in your lantern (✨ ${s.lantern || 0})`)}
    </ul><div class="kit">${inside ? `🌫️ the glade is fading — ${Math.max(0, Math.ceil((FADE_SECONDS - fadeT) / 60))} min left` : "🌙 wait for moonrise on the old stump by the ring"}</div>`;
  }

  window.__wwP35 = { ring: () => ring && { x: ring.x, z: ring.z, stump: ring.stump }, state: () => p35(), wisps: () => wisps.map((W) => ({ x: W.g.position.x, z: W.g.position.z, on: W.g.visible })) }; // (for tests)
  return { update, interactable, panelHTML, done: () => !!p35().done };
}
