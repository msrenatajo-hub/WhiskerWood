// ------------------------------------------------------------
//  🌈  PHASE 34 — "The Thundering Falls"
//
//  The great waterfall has run dry — and the whole valley below it is
//  dying. Someone has dammed the river at the top of the cliffs…
//    🧗 climb the ledge path up the cliffs beside the falls
//    🌉 cross the broken rope bridge (JUMP the missing planks!)
//    💎 find the seven PRISM STONES — some on the ledges, three in the cave
//       behind where the water used to fall
//    🐍 at the top, the Stone Serpent guards the dam it built. If its gaze
//       finds you, it hisses and knocks you back. Outsmart it: set the seven
//       prisms on the sun-stone and their rainbow light DAZZLES it…
//    🪨 …then pull the dam's three keystones. The river ROARS back to life!
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { FALLS } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("rainbowprism", "🌈", "The Rainbow Prism (the Thundering Falls flow again because of you)");
ITEM_POWERS.rainbowprism = { type: "luck", n: 0.12 };

export function initPhase34(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const near3 = (x, y, z, r) => near(x, z, r) && Math.abs(me().y - y) < 2.2;
  const p34 = () => (st.p34 ||= { started: false, been: false, prisms: {}, placed: false, keys: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "falls" ? ctx.city() : null);
  const K = FALLS;
  let wait = 0, hurtCool = 0;
  let testAt = new URLSearchParams(location.search).get("p34at");

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("falls");
      ctx.placePlayer(K.arrive.x, K.arrive.z, Math.PI);
      const s = p34();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🌈 The Thundering Falls — roaring, rushing, with a rainbow over the green valley."
        : "🌈 The Thundering Falls… silent. Climb the ledge path up the cliff (it starts by the dry riverbed), cross the broken bridge, and look for the seven prism stones — three are in the cave behind where the water fell.", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "falls", icon: "🌈", name: "The Thundering Falls", when: () => st.phase >= 34, go: goThere });

  function begin() {
    p34().started = true;
    st.phase = 34;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.6, black: true, gameCam: true, text: "A family of otters arrives at your door, dusty and thin. They've walked for days from the valley under the Thundering Falls — the biggest waterfall in all the land." },
      { dur: 5, black: true, gameCam: true, who: "Mother Otter", text: "“The falls have stopped. Just… stopped. The river's dry, the meadows are brown, the trees are dying. My grandfather says something at the top of the cliffs has DAMMED the river — something big, made of stone.”" },
      { dur: 4.6, black: true, gameCam: true, who: "Mother Otter", text: "“There's an old ledge path up the cliff, and a rope bridge, though it's half fallen in. And Grandfather always said: 'when the stone thing wakes, look for the colours behind the water.' We don't know what it means.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌈 PHASE 34 — The Thundering Falls. Go outside and press 1 — fly to the Thundering Falls.", true) },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 34) return null;
    const Z = zone();
    if (!Z) return null;
    const s = p34();
    if (near(K.arrive.x, K.arrive.z, 2.6) && me().y < 2) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (s.done) return null;
    // the prisms
    for (const [i, P] of K.prisms.entries()) {
      if (s.prisms[i] || !near3(P.x, P.y, P.z, 2)) continue;
      return { label: "take the prism stone 💎", act: () => {
        s.prisms[i] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.prisms).length;
        ctx.say(`💎 A prism stone — it throws little rainbows everywhere! (${n}/7)${n >= 7 ? " ALL SEVEN! Climb to the top — and remember the old saying about colours…" : ""}`, true);
      } };
    }
    const top = me().y > K.top - 1.5;
    if (top && near(K.plinth.x, K.plinth.z, 2.8) && !s.placed) {
      if (Object.keys(s.prisms).length < 7) return { label: "look at the sun-stone 🪨", act: () => ctx.say(`🪨 A flat white stone with seven little hollows round its edge, each the shape of a prism. (You have ${Object.keys(s.prisms).length}/7.)`, true) };
      return { label: "set the seven prisms on the sun-stone 🌈", act: () => {
        s.placed = true;
        save();
        redraw();
        chime();
        ctx.say("🌈 You set the seven prisms in their hollows. The sunlight hits them — and a blazing RAINBOW shoots straight into the Stone Serpent's eyes! It sways… stares… completely dazzled. NOW — pull the dam's three keystones!", true);
      } };
    }
    if (top) for (const [i, ks] of Z.keystones.entries()) {
      if (s.keys[i] || !near(ks.x, ks.z, 2)) continue;
      if (!s.placed) return { label: "try to pull the keystone 🪨", act: () => ctx.say("🐍 The Stone Serpent's head snaps round — it's WATCHING the dam. You'll have to distract it somehow… (remember: “look for the colours behind the water”)", true) };
      return { label: "pull the keystone 🪨", act: () => {
        s.keys[i] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.keys).length;
        if (n >= 3) setTimeout(finale, 600);
        else ctx.say(`🪨 HNNNG — the keystone grinds loose! The whole dam creaks. (${n}/3)`, true);
      } };
    }
    return null;
  }

  function finale() {
    const s = p34();
    const Z = zone();
    playCutscene([
      { dur: 4.4, from: [14, K.top + 8, -6], look: [0, K.top + 1, K.dam.z], text: "The last keystone comes free — and with a deep, rolling CRACK the whole dam gives way!", run: () => (Z.dam.visible = false) },
      { dur: 4.8, from: [30, 14, 40], look: [0, 12, K.cliffZ], text: "The river ROARS over the edge of the cliff. The Thundering Falls thunder again — a white wall of water crashing into the valley!", run: () => {
        Z.fall.visible = true;
        Z.river.visible = true;
      } },
      { dur: 4.8, from: [0, 18, 70], look: [0, 8, 0], text: "The water races down the dry riverbed. Everywhere it touches, the brown valley turns GREEN — and a rainbow blazes right across the sky.", run: () => {
        Z.valleyMat.color.setHex(0x5aa84a);
        Z.bushes.forEach((b) => b.material.color.setHex(0x3a8a3a));
        Z.rainbow.visible = true;
      } },
      { dur: 4.6, black: true, gameCam: true, who: "Mother Otter (splashing in the river)", text: "“The water's BACK! The meadows, the trees — everything's waking up! The Stone Serpent slithered off into the mountains, sulking. Thank you, Thistle. The whole valley thanks you.”" },
      { dur: 4, black: true, gameCam: true, who: "🌈 PHASE 34 COMPLETE", text: "The Thundering Falls\n🪙 1100 · 🌈 The Rainbow Prism" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1100;
        (c.owned ||= {}).rainbowprism = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌈 The Thundering Falls flow again, and the valley is green! (The Rainbow Prism brings you luck.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 33 && st.p33 && st.p33.done && !p34().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 34) return;
    const s = p34();
    if (testAt) {
      // (test) &p34at=bridge|cave|top — start there
      const at = { bridge: [9, -7.5, 12], cave: [0, -12, 12], top: [-12, -16, K.top] }[testAt];
      testAt = null;
      if (at) {
        ctx.placePlayer(at[0], at[1], Math.PI);
        me().y = at[2];
      }
    }
    hurtCool = Math.max(0, hurtCool - dt);
    // 💎 the prisms glitter where they hide
    if (!Z.prismMeshes) {
      const COLS = [0xff6a6a, 0xffb04a, 0xffe860, 0x6ae86a, 0x6ab8ff, 0x9a7aff, 0xe87aff];
      Z.prismMeshes = K.prisms.map((P, i) => {
        const g = new THREE.Group();
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({ color: COLS[i], emissive: COLS[i], emissiveIntensity: 0.7, flatShading: true }));
        gem.scale.y = 1.5;
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: COLS[i], transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
        halo.scale.setScalar(1.8);
        g.add(gem, halo);
        g.position.set(P.x, P.y + 0.7, P.z);
        Z.group.add(g);
        return g;
      });
    }
    Z.prismMeshes.forEach((g, i) => {
      g.visible = !s.prisms[i] && !s.done;
      g.rotation.y = t * 1.5 + i;
    });
    // what's done stays done
    if (s.done) {
      Z.dam.visible = false;
      Z.fall.visible = Z.river.visible = Z.rainbow.visible = true;
      Z.valleyMat.color.setHex(0x5aa84a);
      Z.serpent.g.visible = Z.serpent.coneG.visible = false;
    }
    Z.keystones.forEach((ks, i) => (ks.m.visible = !s.keys[i] && !s.done));
    Z.plinthGems.forEach((g) => (g.visible = s.placed || s.done));
    // 🐍 the serpent's gaze sweeps back and forth over the top of the cliff
    if (!s.done) {
      const S0 = K.serpent;
      const base = Math.atan2(K.dam.x - S0.x, K.dam.z - S0.z);
      const dazzled = s.placed;
      const ang = dazzled ? Math.atan2(K.plinth.x - S0.x, K.plinth.z - S0.z) + Math.sin(t * 3) * 0.08 : base + Math.sin(t * 0.55) * 1.05;
      Z.serpent.neck.rotation.y = ang;
      Z.serpent.coneG.rotation.y = ang - Math.PI / 2;
      Z.serpent.coneG.visible = !dazzled;
      Z.serpent.eyes.forEach((e) => e.material.color.setHSL(dazzled ? (t * 0.5) % 1 : 0.12, 1, 0.55));
      const p = me();
      const onTop = p.y > K.top - 1.5;
      const dx = p.x - S0.x, dz = p.z - S0.z, d = Math.hypot(dx, dz);
      const look = Math.atan2(dx, dz);
      const diff = Math.abs(Math.atan2(Math.sin(look - ang), Math.cos(look - ang)));
      if (!dazzled && onTop && d < 20 && diff < 0.5 && !hurtCool && !ctx.playing()) {
        hurtCool = 2.5;
        ctx.hurt(12);
        ctx.placePlayer(-14, -10, Math.PI);
        me().y = K.top;
        ctx.say("🐍 HSSSSSS! The Stone Serpent's gaze falls on you — its tail SWEEPS you back to the cliff edge! Keep out of its sight (the pale light on the ground)…", true);
      }
    }
  }

  function panelHTML() {
    const s = p34();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = Object.keys(s.prisms).length;
    return `<h3>🌈 The Thundering Falls</h3><ul>
      ${row(s.been, "Fly to the Thundering Falls <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “The Thundering Falls”</div>")}
      ${row(n >= 7, `Climb the cliffs and find the seven prism stones (${n}/7) — three are in the cave behind the falls`)}
      ${row(s.placed, "Outsmart the Stone Serpent at the top")}
      ${row(s.done, `Pull the dam's three keystones (${Object.keys(s.keys).length}/3)`)}
    </ul><div class="kit">🌉 JUMP the gaps in the rope bridge · 🐍 keep out of the serpent's gaze (the pale light)</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p34().done };
}
