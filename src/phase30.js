// ------------------------------------------------------------
//  🍄  PHASE 30 — "The Glowcap Kingdom"
//
//  A tiny mushroom-person pops up out of the ground by your cottage, glowing
//  and terrified: deep under the forest floor, the Glowcap Kingdom has gone
//  DARK. The giant Rootworm burrowed up through the kingdom, snatched the
//  Glowcap King and dragged him down into its tunnels — and without the
//  King's glow-song, the giant mushrooms have all gone out.
//    🕳️ climb down the glowing hole near your cottage
//    🌉 cross the bottomless chasm on the old rope bridge (JUMP the broken planks!)
//    🪱 sneak through the Rootworm's tunnels — don't let it touch you
//    ✂️ cut the three root knots and free the King
//    🍄 light the five giant mushroom caps, and the whole kingdom shines again
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { GLOWCAP } from "./questZones.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("glowcapcrown", "🍄", "The Glowcap Crown-Light (the mushroom folk's thank-you — it glows in the dark)");
ITEM_POWERS.glowcapcrown = { type: "luck", n: 0.1 };

export function initPhase30(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p30 = () => (st.p30 ||= { started: false, been: false, crossed: false, knots: {}, freed: false, caps: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "glowcap" ? ctx.city() : null);
  let wait = 0;
  let testAt = new URLSearchParams(location.search).get("p30at");

  // ---------------------------------------------------------------- 🕳️ the hole near your cottage
  let hole = null;
  function buildHole() {
    if (hole || !ctx.outsideGroup || !ctx.home) return;
    const H0 = ctx.home;
    let at = { x: H0.x + 16, z: H0.z - 14 };
    for (let k = 0; k < 30; k++) {
      const a = k * 2.4, d = k * 0.8;
      const p = { x: H0.x + 16 + Math.cos(a) * d, z: H0.z - 14 + Math.sin(a) * d };
      if ((!ctx.isClear || ctx.isClear(p.x, p.z, 2)) && !(ctx.isWater && ctx.isWater(p.x, p.z))) {
        at = p;
        break;
      }
    }
    const y = ctx.terrainHeight(at.x, at.z);
    const g = new THREE.Group();
    const pit = new THREE.Mesh(new THREE.CircleGeometry(1.5, 18), new THREE.MeshBasicMaterial({ color: 0x05030a }));
    pit.rotation.x = -Math.PI / 2;
    pit.position.y = 0.06;
    g.add(pit);
    const glowMat = (c) => new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
    const halo = new THREE.Sprite(glowMat(0x6affd8));
    halo.scale.setScalar(4);
    halo.position.y = 0.4;
    g.add(halo);
    // a ring of little glowing mushrooms round the edge
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const c = [0x6affd8, 0xff8ad8, 0xb88aff][k % 3];
      const st2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0xf0e8d8 }));
      st2.position.set(Math.cos(a) * 1.9, 0.2, Math.sin(a) * 1.9);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8 }));
      cap.position.set(Math.cos(a) * 1.9, 0.38, Math.sin(a) * 1.9);
      g.add(st2, cap);
    }
    g.position.set(at.x, y, at.z);
    g.visible = false;
    ctx.outsideGroup.add(g);
    hole = { g, ...at };
  }

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("glowcap");
      ctx.placePlayer(GLOWCAP.arrive.x, GLOWCAP.arrive.z, Math.PI);
      const s = p30();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🍄 The Glowcap Kingdom — every giant mushroom glowing, and the mushroom folk singing."
        : s.freed
          ? "🍄 The King is free! Now light the five giant mushroom caps (E at each one's stalk)."
          : "🍄 THE GLOWCAP KINGDOM… all dark. The King was dragged SOUTH, over the chasm and into the Rootworm's tunnels. Cross the old rope bridge — and JUMP where the planks are broken!", true);
    }, 1);
  }
  function goHome() {
    fadeThrough(() => {
      ctx.goOutside();
      if (hole) ctx.placePlayer(hole.x + 2.4, hole.z + 2.4, 0);
    }, 1);
  }

  function begin() {
    p30().started = true;
    st.phase = 30;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "One evening, right outside your cottage, the ground goes *pop*. A tiny person with a glowing blue mushroom for a hat climbs out of a hole — and bursts into tears." },
      { dur: 5, black: true, gameCam: true, who: "Puffle, a Glowcap messenger", text: "“Please, please help us! I'm from the Glowcap Kingdom — deep, deep under the forest floor. Last night the giant ROOTWORM burrowed right up through our town… and it TOOK our King!”" },
      { dur: 5, black: true, gameCam: true, who: "Puffle", text: "“Without the King's glow-song, all our great mushrooms have gone out. It's so DARK down there. The Rootworm dragged him into its tunnels, past the Bottomless Chasm… nobody's brave enough to follow.”" },
      { dur: 4.4, black: true, gameCam: true, who: "Puffle", text: "“You're the mouse who saved the whole world, aren't you? Follow me down the hole — I'll leave it glowing for you!”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🍄 PHASE 30 — The Glowcap Kingdom. A glowing hole has opened in the ground near your cottage — walk up to it and press E to climb down.", true) },
    ]);
  }

  // ---------------------------------------------------------------- 🌉 the bridge, 🪱 the worm
  let lastSafe = null, hurtCool = 0;
  function bridgeAndWorm(dt, t) {
    const Z = zone();
    const K = GLOWCAP;
    const p = me();
    const s = p30();
    hurtCool = Math.max(0, hurtCool - dt);
    // the rope rails keep you on the bridge — only the broken gaps can drop you
    const B = K.bridge;
    const onBand = p.z > K.chasm.z0 && p.z < K.chasm.z1;
    if (onBand && p.y > -0.6 && Math.abs(p.x - B.x) < B.w + 1.2) p.x = Math.max(B.x - B.w + 0.15, Math.min(B.x + B.w - 0.15, p.x));
    if (!onBand && p.y > -0.5) lastSafe = { x: p.x, z: p.z };
    if (p.z < K.chasm.z0 - 1 && !s.crossed) {
      s.crossed = true;
      save();
      redraw();
      ctx.say("🌉 Across the Bottomless Chasm! The Rootworm's tunnels wind away south — the King is at the very end. Don't let the worm touch you!", true);
    }
    // fell in? the glow-moths carry you back up (it hurts a bit)
    if (p.y < -9) {
      ctx.hurt(10);
      const back = p.z < (K.chasm.z0 + K.chasm.z1) / 2 ? { x: B.x, z: K.chasm.z0 - 1.5 } : { x: B.x, z: K.chasm.z1 + 1.5 };
      ctx.placePlayer(back.x, back.z, p.z < (K.chasm.z0 + K.chasm.z1) / 2 ? 0 : Math.PI);
      ctx.say("🦋 Aaah! You fall… and a cloud of glow-moths catches you and carries you back up. (Run and JUMP over the broken planks!)", true);
    }
    // the worm wriggles along its tunnel path (it stops once the King is free and the kingdom shines)
    const W = Z.worm;
    const path = K.worm;
    let total = 0;
    const segLen = path.map((a, i) => {
      const b = path[(i + 1) % path.length];
      const l = Math.hypot(b.x - a.x, b.z - a.z);
      total += l;
      return l;
    });
    if (!s.done) W.u = (W.u + dt * 7) % total;
    let u = W.u;
    let i = 0;
    while (u > segLen[i]) {
      u -= segLen[i];
      i = (i + 1) % path.length;
    }
    const a = path[i], b = path[(i + 1) % path.length];
    const head = { x: a.x + ((b.x - a.x) * u) / segLen[i], z: a.z + ((b.z - a.z) * u) / segLen[i] };
    W.trail.unshift(head);
    if (W.trail.length > 200) W.trail.length = 200;
    W.segs.forEach((sg, k) => {
      const P = W.trail[Math.min(W.trail.length - 1, k * 4)];
      sg.position.set(P.x, 1.1 + Math.abs(Math.sin(t * 6 + k * 0.6)) * 0.35, P.z);
    });
    const nxt = W.trail[3] || head;
    W.segs[0].rotation.y = Math.atan2(head.x - nxt.x, head.z - nxt.z);
    // touched you?
    if (!s.done && !hurtCool && W.segs.some((sg) => Math.hypot(p.x - sg.position.x, p.z - sg.position.z) < 1.6)) {
      hurtCool = 1.5;
      ctx.hurt(15);
      // knocked away from it
      const dx = p.x - head.x, dz = p.z - head.z, d = Math.hypot(dx, dz) || 1;
      ctx.placePlayer(p.x + (dx / d) * 3, p.z + (dz / d) * 3, ctx.mouseRig.rotation.y);
      ctx.say("🪱 WHUMP! The Rootworm bumps you flat! Keep out of its way — wait for it to wriggle past.");
    }
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 30) return null;
    const s = p30();
    if (ctx.world() === "outside") {
      buildHole();
      if (hole && near(hole.x, hole.z, 2.8)) return { label: s.done ? "climb down to the Glowcap Kingdom 🍄" : "climb down the glowing hole 🍄", act: goThere };
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    const K = GLOWCAP;
    if (near(K.ladder.x, K.ladder.z, 2.6)) return { label: "climb the root ladder back up to the forest ⬆️", act: goHome };
    if (s.done) return null;
    if (!s.freed) {
      for (let k = 0; k < Z.knots.length; k++) {
        const N = Z.knots[k];
        if (s.knots[k] || !near(N.x, N.z, 1.9)) continue;
        return { label: "cut the root knot ✂️", act: () => {
          s.knots[k] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(s.knots).length;
          if (n >= 3) freeKing();
          else ctx.say(`✂️ Snip! The tough old root springs loose. (${n}/3)`);
        } };
      }
      if (near(K.cage.x, K.cage.z, 3)) return { label: "talk to the Glowcap King 👑", act: () => ctx.say("👑 “Oh! A MOUSE! Quick — cut the three root knots holding me, before that worm comes back round!”", true) };
      return null;
    }
    for (let k = 0; k < Z.caps.length; k++) {
      const c = Z.caps[k];
      if (s.caps[k] || !near(c.x, c.z, 3.4)) continue;
      return { label: "light the giant mushroom 🍄 (sing the King's glow-song)", act: () => {
        s.caps[k] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.caps).length;
        if (n >= Z.caps.length) finale();
        else ctx.say(`🍄 You hum the glow-song… and the giant cap blooms with light! The mushroom folk cheer. (${n}/${Z.caps.length})`, true);
      } };
    }
    return null;
  }

  function freeKing() {
    const s = p30();
    const K = GLOWCAP;
    playCutscene([
      { dur: 4, from: [K.cage.x + 4, 3, K.cage.z + 6], look: [K.cage.x, 1, K.cage.z], text: "The last root knot snaps — and the Glowcap King tumbles free, brushing dirt off his golden cap." },
      { dur: 5, from: [K.cage.x + 4, 3, K.cage.z + 6], look: [K.cage.x, 1, K.cage.z], who: "The Glowcap King", text: "“Saved by a MOUSE! Bless your whiskers! Now — listen. Here is my glow-song: hum-hum-hmmm, hum-HMMM. Sing it at the foot of each great mushroom and it will shine again.”" },
      { dur: 4.4, black: true, gameCam: true, text: "A cloud of glow-moths swirls up around you both — and carries you up, over the tunnels, over the chasm, all the way home to the dark kingdom." },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.freed = true;
        save();
        redraw();
        ctx.placePlayer(0, 40, Math.PI);
        ctx.say("👑 The King is home! Now light the FIVE giant mushrooms — walk up to each one's stalk and press E to sing the glow-song.", true);
      } },
    ]);
  }

  function finale() {
    const s = p30();
    playCutscene([
      { dur: 4.4, from: [0, 10, 64], look: [0, 6, 38], text: "As the fifth great mushroom bursts into light, the whole kingdom glows — pink, blue, gold and green, brighter than it has ever been." },
      { dur: 4.6, from: [20, 6, 50], look: [0, 2, 40], text: "The mushroom folk come pouring out of their little houses, bouncing and singing the glow-song, and the King dances right in the middle of them." },
      { dur: 5, black: true, gameCam: true, who: "The Glowcap King", text: "“Thistle Mosswhisker, Friend of the Glowcaps! Take this little crown-light — it will glow for you in every dark place, forever. And the Rootworm? We'll make it a nice cosy burrow of its own, far, far away.”" },
      { dur: 4, black: true, gameCam: true, who: "🍄 PHASE 30 COMPLETE", text: "The Glowcap Kingdom\n🪙 900 · 🍄 The Glowcap Crown-Light" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 900;
        (c.owned ||= {}).glowcapcrown = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🍄 The Glowcap Kingdom shines again! (The Glowcap Crown-Light brings you luck.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 29 && st.p29 && st.p29.done && !p30().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase >= 30 && ctx.world() === "outside") {
      buildHole();
      if (hole) hole.g.visible = true;
    }
    const Z = zone();
    if (!Z || st.phase < 30) return;
    const s = p30();
    if (testAt) {
      // (test) &p30at=bridge|tunnels|king|caps — start there
      const at = { bridge: [GLOWCAP.bridge.x, GLOWCAP.chasm.z1 + 2, Math.PI], tunnels: [40, 4, Math.PI], king: [GLOWCAP.cage.x, GLOWCAP.cage.z + 4, Math.PI], caps: [0, 40, Math.PI] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], at[2]);
    }
    // the King (tied up or free), the knots, the mushrooms
    Z.king.g.visible = !s.freed;
    Z.knots.forEach((N, k) => (N.g.visible = !s.knots[k] && !s.freed));
    Z.caps.forEach((c, k) => {
      const lit = !!s.caps[k] || s.done;
      c.capMat.emissive.setHex(lit ? c.color : 0x000000);
      c.capMat.emissiveIntensity = lit ? 0.9 + Math.sin(t * 2 + k) * 0.15 : 0;
      c.capMat.color.setHex(lit ? c.color : 0x4a3a5a);
      c.halo.material.opacity = lit ? 0.45 : 0;
    });
    if (!ctx.playing()) bridgeAndWorm(dt, t);
  }

  function panelHTML() {
    const s = p30();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const nCaps = Object.keys(s.caps).length;
    return `<h3>🍄 The Glowcap Kingdom</h3><ul>
      ${row(s.been, "Climb down the glowing hole near your cottage")}
      ${row(s.crossed, "Cross the Bottomless Chasm on the old rope bridge — JUMP the gaps!")}
      ${row(s.freed, `Find the King in the Rootworm's tunnels and cut the root knots (${Object.keys(s.knots).length}/3)`)}
      ${row(s.done, `Light the five giant mushrooms with the glow-song (${nCaps}/5)`)}
    </ul><div class="kit">🪱 the Rootworm costs hearts if it touches you · fall in the chasm and you lose a heart</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p30().done };
}
