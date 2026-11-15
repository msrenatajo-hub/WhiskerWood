// ------------------------------------------------------------
//  🍂  PHASE 37 — "Amberwood's Long Autumn"
//
//  Far to the south-west lies Amberwood, where autumn has lasted a whole
//  year. The leaves FORGOT HOW TO FALL: every branch sags under them, there
//  isn't a breath of wind, and the old Harvest Tree can't go to sleep for
//  winter. Because the Autumn Fox — who blows the first wind of every
//  autumn — has overslept. By a year.
//    1. Find her, curled up asleep by her hollow log. Nothing wakes her…
//       except the CRUNCH of a really big leaf pile.
//    2. Shake the six heavy, drooping branches for armfuls of leaves; build
//       the pile beside her; climb the stump… and JUMP IN. CRUNCH!
//    3. She wakes, and blows the wind of autumn — at last, the leaves fall.
//       But her wind also scattered the Harvest Tree's seven GOLDEN leaves.
//       Catch them as they dance on the wind (two blew up high — climb the
//       old stumps), dodge her gusts, and lay them in the tree's acorn cups.
//    4. The Harvest Tree lets go of a whole year of gold, all at once.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { AMBERWOOD } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { buildPet } from "./pets.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("amberleaf", "🍁", "The Ever-Golden Leaf (from the Harvest Tree — it never fades, and it's always a little warm)");
ITEM_POWERS.amberleaf = { type: "warm", n: 0.3 };

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
// the seven golden leaves dance in loops round these spots (two blew up high)
const GOLDEN = [
  { cx: 20, cz: 10, r: 6, y: 1.5, sp: 0.32 },
  { cx: -14, cz: 22, r: 5, y: 1.7, sp: -0.38 },
  { cx: -42, cz: -12, r: 5, y: 1.4, sp: 0.36 },
  { cx: 12, cz: -30, r: 6, y: 1.8, sp: -0.3 },
  { cx: 30, cz: 36, r: 4, y: 1.5, sp: 0.42 },
  { cx: 44, cz: -24, r: 0.9, y: 6.5, sp: 0.5 }, // (over the third stump)
  { cx: 39, cz: -26, r: 1.2, y: 8.3, sp: -0.45 }, // (over the very top one)
];

export function initPhase37(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p37 = () => (st.p37 ||= { started: false, been: false, talked: false, shaken: {}, carry: 0, pile: 0, woke: false, golden: {}, placed: 0, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "amberwood" ? ctx.city() : null);
  const K = AMBERWOOD;
  const PILE_FULL = 5;
  let wait = 0, high = false, gustT = 0, nextGust = 8, toldGust = false;

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("amberwood");
      ctx.placePlayer(K.arrive.x, K.arrive.z, Math.PI);
      const s = p37();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🍂 Amberwood — leaves drift down all day long now, and the Harvest Tree sleeps, golden and happy."
        : s.woke
          ? "🍂 Amberwood — the wind is back! Catch the seven GOLDEN leaves and lay them in the Harvest Tree's acorn cups."
          : "🍂 AMBERWOOD. Not a breath of wind… every branch sags with leaves that won't fall. Somewhere in here the Autumn Fox is fast asleep — find her!", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "amberwood", icon: "🍂", name: "Amberwood", when: () => st.phase >= 37, go: goThere });

  function begin() {
    p37().started = true;
    st.phase = 37;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "A single red leaf blows in under your cottage door. It's dry and crackly… and very, very old. Tied to its stem is a strand of golden hair — fox hair." },
      { dur: 4.8, black: true, gameCam: true, who: "Old Hazelnut, the Amberwood messenger-squirrel (out of breath)", text: "“Please — you've got to come to Amberwood! It's been autumn for a WHOLE YEAR. The leaves forgot how to fall, the branches are breaking, and the Harvest Tree can't sleep!”" },
      { dur: 4.6, black: true, gameCam: true, who: "Old Hazelnut", text: "“It's the Autumn Fox. She blows the first wind every autumn — and she's ASLEEP. We've tried everything. Shouting. Tickling. A trumpet. Nothing works!”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🍂 PHASE 37 — Amberwood's Long Autumn. Go outside and press 1 — fly to Amberwood, and wake the Autumn Fox.", true) },
    ]);
  }

  // ---------------------------------------------------------------- the fox, the leaves
  let builtFor = null, fox = null, zzz = null, goldMeshes = [], bundle = null, puffs = [];
  function zzzSprite() {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 128;
    const c = cv.getContext("2d");
    c.font = "900 64px Georgia";
    c.lineWidth = 8;
    c.strokeStyle = "#2a1a0a";
    c.fillStyle = "#fff2c8";
    c.strokeText("z z Z", 24, 92);
    c.fillText("z z Z", 24, 92);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(2.4, 1.2, 1);
    return sp;
  }
  function build(Z) {
    if (builtFor === Z) return;
    builtFor = Z;
    // the Autumn Fox: a big golden-red fox, a little bit magic
    fox = buildPet("fox", 0);
    fox.scale.setScalar(2.4);
    fox.traverse((o) => {
      if (o.isMesh && o.material && o.material.color) {
        o.material = o.material.clone();
        if (o.material.color.getHex() === 0xd8682a) o.material.color.setHex(0xe8822a);
      }
    });
    fox.add(glow(0xffb040, 2.2, 0.35));
    Z.group.add(fox);
    zzz = zzzSprite();
    Z.group.add(zzz);
    // the seven golden leaves
    goldMeshes = GOLDEN.map(() => {
      const g = new THREE.Group();
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.55, 6), new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xc08000, emissiveIntensity: 0.9, side: THREE.DoubleSide, flatShading: true }));
      leaf.scale.set(0.7, 1.2, 1);
      const vein = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.2), new THREE.MeshBasicMaterial({ color: 0xa06a10, side: THREE.DoubleSide }));
      vein.position.z = 0.01;
      g.add(leaf, vein, glow(0xffe070, 2.6, 0.7));
      g.visible = false;
      Z.group.add(g);
      return g;
    });
  }
  // a little burst of leaves when you shake a branch, or CRUNCH the pile
  function burst(Z, x, y, z, n = 40, spread = 2) {
    const AUT = [0xd8402a, 0xe86a1a, 0xf0a020, 0xc8301a, 0xe8c040];
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.26), new THREE.MeshBasicMaterial({ color: AUT[k % 5], side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      Z.group.add(m);
      puffs.push({ m, vx: (Math.random() - 0.5) * spread * 2, vy: 1 + Math.random() * spread * 1.6, vz: (Math.random() - 0.5) * spread * 2, life: 2.4 + Math.random() });
    }
  }
  function carryShow(on) {
    if (on && !bundle) {
      bundle = new THREE.Group();
      for (let k = 0; k < 9; k++) {
        const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: [0xd8402a, 0xe86a1a, 0xf0a020][k % 3], flatShading: true }));
        lf.position.set(Math.cos(k * 2.4) * 0.22, (k % 3) * 0.14, Math.sin(k * 2.4) * 0.22);
        bundle.add(lf);
      }
      bundle.position.set(0, 1.05, -0.25);
      ctx.mouseRig.add(bundle);
    }
    if (!on && bundle) {
      ctx.mouseRig.remove(bundle);
      bundle = null;
    }
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 37) return null;
    const Z = zone();
    if (!Z) return null;
    const s = p37();
    if (near(K.arrive.x, K.arrive.z, 3)) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (s.done) return null;
    const B = K.foxBed;
    if (!s.woke && near(B.x, B.z, 3.6)) return { label: "try to wake the Autumn Fox 🦊", act: () => {
      s.talked = true;
      save();
      redraw();
      ctx.say(s.pile >= PILE_FULL
        ? "🦊 “…zzz… mmh… crunch… …zzz…” — The pile's ready! Climb the stump next to it and JUMP IN!"
        : "🦊 You shout. You tug her ear. You blow on her whiskers. She just smiles in her sleep and mumbles: “…zzz… only… the CRUNCH… of a big… leaf pile… zzz…” — Build a big pile of leaves by her, then jump in it! (Shake the low, drooping branches for leaves.)", true);
    } };
    if (!s.woke) {
      for (const [i, H] of K.heavy.entries()) {
        if (s.shaken[i] || !near(H.x, H.z, 5)) continue;
        if (s.carry) return { label: "(your arms are full — take the leaves to the pile first)", act: () => ctx.say("🍂 Your arms are full! Carry these leaves to the pile by the sleeping fox first.", true) };
        return { label: "shake the drooping branch 🍂", act: () => shake(i) };
      }
      if (near(K.pile.x, K.pile.z, 3.4) && s.carry) return { label: "add your armful to the leaf pile 🍂", act: () => {
        s.carry = 0;
        s.pile += 1;
        carryShow(false);
        save();
        redraw();
        chime();
        burst(Z, K.pile.x, 1, K.pile.z, 14, 1);
        ctx.say(s.pile >= PILE_FULL
          ? "🍂 That's a GIANT leaf pile! Now climb up the stump beside it… and JUMP IN!"
          : `🍂 Fwump! The pile grows. (${s.pile}/${PILE_FULL} armfuls)`, true);
      } };
      return null;
    }
    // (the fox is awake) — the golden leaves go in the Harvest Tree's acorn cups
    const T = K.tree;
    if (near(T.x, T.z, 9.5)) {
      const have = Object.keys(s.golden).length - s.placed;
      if (have > 0) return { label: `lay ${have > 1 ? "the golden leaves" : "the golden leaf"} in the acorn cups 🍁`, act: () => {
        s.placed += have;
        save();
        redraw();
        chime();
        if (s.placed >= 7) return finale();
        ctx.say(`🍁 The leaf settles into its acorn cup and glows. (${s.placed}/7) The Harvest Tree's branches give a long, sleepy creak…`, true);
      } };
      return { label: "look up at the Harvest Tree 🌳", act: () => ctx.say(`🌳 Seven acorn cups round its roots, ${s.placed} with a golden leaf in. Catch the rest as they dance on the wind!`, true) };
    }
    return null;
  }
  function shake(i) {
    const s = p37();
    const Z = zone();
    const H = K.heavy[i];
    s.shaken[i] = true;
    s.carry = 1;
    save();
    redraw();
    chime();
    carryShow(true);
    shakeT[i] = 1.2;
    burst(Z, H.x + (me().x - H.x) * 0.4, 3, H.z + (me().z - H.z) * 0.4, 46, 1.4);
    ctx.say(`🍂 You grab the branch and SHAKE — and an avalanche of leaves comes tumbling down on your head! You scoop up an armful. Take it to the pile by the sleeping fox.`, true);
  }
  const shakeT = {};

  function wake() {
    const s = p37();
    const Z = zone();
    const B = K.foxBed, T = K.tree;
    s.woke = true;
    save();
    redraw();
    burst(Z, K.pile.x, 0.8, K.pile.z, 90, 2.4);
    Z.pile.scale.set(1.2, 0.35, 1.2);
    playCutscene([
      { dur: 3.2, from: [K.pile.x + 7, 3, K.pile.z + 7], look: [K.pile.x, 0.5, K.pile.z], text: "C R U N C H !  Leaves EVERYWHERE." },
      { dur: 4.4, from: [B.x + 5, 2.4, B.z + 5], look: [B.x, 1, B.z], text: "One golden ear twitches. Then the other. The Autumn Fox opens her eyes, stretches all the way to the tip of her tail… and yawns a yawn that smells of bonfires and apples.", run: () => (foxPose = "stretch") },
      { dur: 5.4, from: [B.x + 5, 2.4, B.z + 5], look: [B.x, 1.6, B.z], who: "The Autumn Fox", text: "“That crunch! Best sound in the whole year. Wait — what year is it? Oh no. Oh NO. The first wind! I was meant to blow the first wind of autumn… a whole year ago!”" },
      { dur: 4.6, from: [T.x + 9, 6, T.z + 12], look: [T.x, 7, T.z], text: "She bounds to the Harvest Tree, fills her chest… and BLOWS. A wind like a river of air rolls through Amberwood — and every branch lets go at once.", run: () => {
        foxPose = "tree";
        Z.fall = 1;
      } },
      { dur: 5.2, from: [T.x + 10, 3, T.z + 12], look: [T.x, 3, T.z], who: "The Autumn Fox", text: "“Ahh, that's better! …Oh. Oops. I blew the Harvest Tree's seven GOLDEN leaves right off. It can't sleep without them in its acorn cups. Would you catch them for me? They do dance about a bit — and I sneeze a gust now and then. Sorry!”" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => ctx.say("🍁 Catch the SEVEN golden leaves dancing on the wind (two blew up high — try the old stumps to the east!) and lay them in the Harvest Tree's acorn cups. Watch for the fox's gusts!", true) },
    ]);
  }
  let foxPose = "sleep";

  function finale() {
    const s = p37();
    const Z = zone();
    const T = K.tree;
    playCutscene([
      { dur: 4.2, from: [T.x + 12, 3, T.z + 14], look: [T.x, 2, T.z], text: "The seventh golden leaf settles into its cup. All seven glow… and the glow climbs up the roots, up the trunk, into every single branch.", run: () => Z.cupLeaves.forEach((g) => (g.visible = true)) },
      { dur: 5, from: [T.x + 11, 4, T.z + 13], look: [T.x, 15, T.z], text: "And the Harvest Tree lets go. A whole year of gold, all at once — a storm of golden leaves pouring down over Amberwood like warm, glittering snow.", run: () => (Z.fall = 2) },
      { dur: 5, from: [T.x + 8, 2, T.z + 10], look: [T.x + 3, 1, T.z + 5], who: "The Autumn Fox", text: "“There. Now it can sleep all winter and wake up green. Here — the last leaf it kept back. It's for you. It'll never fade, and it's always a little bit warm.” She winks. “Next year I'm setting an alarm.”" },
      { dur: 4, black: true, gameCam: true, who: "🍂 PHASE 37 COMPLETE", text: "Amberwood's Long Autumn\n🪙 1000 · 🍁 The Ever-Golden Leaf" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        Z.fall = 1;
        const c = C();
        c.coins = (c.coins || 0) + 1000;
        (c.owned ||= {}).amberleaf = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🍂 Amberwood's autumn is over at last — leaves drift down all day long now. (The Ever-Golden Leaf keeps you warm in the cold.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  let testAt = new URLSearchParams(location.search).get("p37at");
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 36 && st.p36 && st.p36.done && !p37().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 37) {
      if (bundle) carryShow(false);
      return;
    }
    build(Z);
    const s = p37();
    if (testAt) {
      const at = { fox: [K.foxBed.x + 2.5, K.foxBed.z + 2], tree: [K.tree.x, K.tree.z + 8], tower: [K.tower[0].x + 3, K.tower[0].z + 2] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    if (s.carry && !bundle && !s.woke) carryShow(true);
    if (!Z.fall && s.woke) Z.fall = 1;
    if (s.done && Z.cupLeaves) Z.cupLeaves.forEach((g) => (g.visible = true));
    else if (Z.cupLeaves) Z.cupLeaves.forEach((g, i) => (g.visible = i < s.placed));
    // the pile
    const pf = s.woke ? 0 : Math.min(1, s.pile / PILE_FULL);
    if (!s.woke) Z.pile.scale.setScalar(Math.max(0.01, pf * 1.8));
    else if (Z.pile.scale.y > 0.36) Z.pile.scale.set(1.2, 0.35, 1.2);
    // the shaken branches: wobble, then spring up (lighter now)
    Z.heavyBranches.forEach((br, i) => {
      if (shakeT[i] > 0) shakeT[i] -= dt;
      br.children.forEach((c) => (c.rotation.x = shakeT[i] > 0 ? Math.sin(t * 30) * 0.25 * shakeT[i] : 0));
      br.position.y = s.shaken[i] || s.woke ? 0.9 : 0;
    });
    // leaf puffs
    for (let k = puffs.length - 1; k >= 0; k--) {
      const P = puffs[k];
      P.life -= dt;
      P.vy -= 3.2 * dt;
      P.vx *= 0.985;
      P.vz *= 0.985;
      P.m.position.x += P.vx * dt;
      P.m.position.y = Math.max(0.05, P.m.position.y + P.vy * dt);
      P.m.position.z += P.vz * dt;
      P.m.rotation.set(t * 4 + k, t * 3, 0);
      if (P.life <= 0) {
        Z.group.remove(P.m);
        puffs.splice(k, 1);
      }
    }
    // 🦊 the fox
    const B = K.foxBed, T = K.tree;
    if (!s.woke && foxPose === "sleep") {
      fox.position.set(B.x, 0, B.z);
      fox.rotation.set(0, 2.4, 0);
      fox.scale.set(2.4, 1.5 + Math.sin(t * 1.6) * 0.08, 2.4); // (breathing…)
      zzz.visible = true;
      zzz.position.set(B.x + 0.8, 3 + Math.sin(t) * 0.3, B.z);
      zzz.material.opacity = 0.6 + Math.sin(t * 1.6) * 0.3;
    } else {
      zzz.visible = false;
      fox.scale.setScalar(2.4);
      if (foxPose === "stretch") fox.position.set(B.x, 0, B.z);
      else fox.position.set(T.x + 4.5, 0, T.z + 6.5);
      fox.rotation.set(0, foxPose === "stretch" ? 2.4 : s.done ? 0.6 : Math.atan2(me().x - fox.position.x, me().z - fox.position.z), 0);
      if (s.woke && !ctx.playing()) foxPose = "tree";
    }
    // 💥 jump in the pile → CRUNCH
    const p = me();
    if (!s.woke && s.pile >= PILE_FULL && !ctx.playing()) {
      if (p.y > 1.6) high = true;
      else if (p.y < 0.4) {
        if (high && near(K.pile.x, K.pile.z, 3.3)) wake();
        high = false;
      }
    }
    // 🍁 the golden leaves, dancing on the wind
    if (s.woke) {
      GOLDEN.forEach((G0, i) => {
        const g = goldMeshes[i];
        const got = !!s.golden[i];
        g.visible = !got && !s.done;
        if (got) return;
        const a = t * G0.sp + i * 1.7;
        const wob = Math.sin(t * 1.3 + i) * 0.6;
        g.position.set(G0.cx + Math.cos(a) * (G0.r + wob) + Z.wind.x * gustT * 2, G0.y + Math.sin(t * 2.1 + i) * 0.35, G0.cz + Math.sin(a) * (G0.r + wob) + Z.wind.z * gustT * 2);
        g.rotation.set(Math.sin(t * 3 + i) * 0.8, t * 1.5 + i, Math.cos(t * 2 + i) * 0.5);
        if (!ctx.playing() && Math.hypot(p.x - g.position.x, p.z - g.position.z) < 1.6 && Math.abs(p.y + 0.6 - g.position.y) < 1.7) {
          s.golden[i] = true;
          save();
          redraw();
          chime();
          const n = Object.keys(s.golden).length;
          ctx.say(`🍁 You snatch a golden leaf out of the air! It's warm, like a cup of cocoa. (${n}/7)${n >= 7 ? " ALL SEVEN! Lay them in the Harvest Tree's acorn cups." : ""}`, true);
        }
      });
      // the fox's gusts (she sneezes)
      if (!s.done && !ctx.playing()) {
        nextGust -= dt;
        if (nextGust <= 0) {
          nextGust = 10 + Math.random() * 6;
          gustT = 1.4;
          const a = Math.random() * Math.PI * 2;
          Z.wind.x = Math.cos(a);
          Z.wind.z = Math.sin(a);
          if (!toldGust || Math.random() < 0.3) ctx.say("🦊 “AH— AH— AHHH-CHOO!” — a GUST of wind whooshes through the wood!");
          toldGust = true;
        }
        if (gustT > 0) {
          gustT -= dt;
          const k = Math.min(1, gustT) * 3.2 * dt;
          if (p.y < 2) ctx.placePlayer(p.x + Z.wind.x * k, p.z + Z.wind.z * k, ctx.mouseRig.rotation.y);
        }
      }
    }
  }

  function panelHTML() {
    const s = p37();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const g = Object.keys(s.golden).length;
    return `<h3>🍂 Amberwood's Long Autumn</h3><ul>
      ${row(s.been, "Fly to Amberwood <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “Amberwood”</div>")}
      ${row(s.talked || s.woke, "Find the sleeping Autumn Fox")}
      ${row(s.pile >= PILE_FULL || s.woke, `Shake the drooping branches and build a BIG leaf pile (${Math.min(s.pile, PILE_FULL)}/${PILE_FULL})`)}
      ${row(s.woke, "Climb the stump… and JUMP IN! 💥")}
      ${s.woke ? row(g >= 7, `Catch the seven golden leaves on the wind (${g}/7)`) : ""}
      ${s.woke ? row(s.done, `Lay them in the Harvest Tree's acorn cups (${s.placed}/7)`) : ""}
    </ul><div class="kit">${s.woke ? "🍁 two golden leaves blew up high — climb the old stumps to the east · 🦊 watch for her sneezes!" : "🍂 the heavy trees have low, drooping branches — press E by one to shake it"}</div>`;
  }

  // (test hook)
  window.__wwP37 = {
    state: () => ({ ...p37() }),
    golden: () => goldMeshes.map((g, i) => ({ i, x: g.position.x, y: g.position.y, z: g.position.z, on: g.visible })),
    playing: () => ctx.playing(),
    calm: () => {
      nextGust = 9999;
      gustT = 0;
    },
  };
  return { update, interactable, panelHTML, done: () => !!p37().done };
}
