// ------------------------------------------------------------
//  🌴  PHASE 38 — "The Jungle Expedition"
//
//  Captain Marisol fishes an old bottle out of the sea. Inside: a torn
//  map of a jungle that nobody has ever come back from — and a note from
//  three explorers who went in last spring… and didn't come back either.
//    1. Sail with Marisol to the jungle beach. She hands you a machete.
//    2. HACK through the wall of vines.
//    3. SWING across the great ravine on the hanging vines (let go with
//       SPACE at just the right moment — there's a rock pillar halfway).
//    4. Cross the CROCODILE RIVER on the stepping stones. Never swim. Watch
//       for the yellow eyes gliding along the lanes, and time your hops.
//    5. Find the three lost explorers — and their three pieces of the map:
//         🌳 Professor Pemberton, stuck at the top of a giant kapok tree
//         🏜️ Juniper Quickpaw, sinking in quicksand (PULL!)
//         🌊 Ottoline Burrows, trapped in a vine-choked cave by a waterfall
//    6. The finished map shows the way into the hidden temple… and the
//       wise old jungle elder who has been waiting there for a visitor.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { JUNGLE } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { buildCroc } from "./animals.js";
import { buildThistle, buildAnimal } from "./outside.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("junglemap", "🗺️", "The Lost Explorers' Map (finished at last — every hidden path in the Lost Jungle)");
registerKeepsake("machete", "🗡️", "Marisol's Machete (for vines — never for creatures)");
ITEM_POWERS.junglemap = { type: "luck", n: 0.1 };

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const EXPLORERS = {
  tree: { name: "Professor Pemberton", tunic: 0x7a6a4a, hood: 0x5a4a32 },
  quick: { name: "Juniper Quickpaw", tunic: 0x3a6a8a, hood: 0x2a4a6a },
  cave: { name: "Ottoline Burrows", tunic: 0x8a3a3a, hood: 0x6a2a2a },
};
const WAIT = { tree: { x: -6, z: -50 }, quick: { x: 6, z: -50 }, cave: { x: 9, z: -46 } }; // (where they wait, by the temple)

export function initPhase38(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p38 = () => (st.p38 ||= { started: false, been: false, met: false, hacked: {}, ravine: false, river: false, found: {}, opened: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "jungle" ? ctx.city() : null);
  const K = JUNGLE;
  let falling = false;
  const PULLS = 10;
  let wait = 0, hurtCool = 0, swing = null, lastSafe = null, pulls = 0, pullT = 0;
  const hacks = {};

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("jungle");
      ctx.placePlayer(K.arrive.x, K.arrive.z, Math.PI);
      const s = p38();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🌴 The Lost Jungle — not so lost any more. The parrots squawk hello."
        : "🌴 THE LOST JUNGLE. Hot, green, and LOUD with birds. Captain Marisol is waiting by her campfire on the beach.", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "jungle", icon: "🌴", name: "The Lost Jungle", when: () => st.phase >= 38, go: goThere });

  function begin() {
    p38().started = true;
    st.phase = 38;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.6, black: true, gameCam: true, who: "Captain Marisol (bursting in, dripping with sea-spray)", text: "“Thistle! Look what my nets pulled up — a bottle, sealed with wax. Inside: a MAP. Half a map. Of a jungle across the southern sea that's on no chart I own.”" },
      { dur: 5, black: true, gameCam: true, who: "The note in the bottle", text: "“To whoever finds this: we are three explorers, and we went into the Lost Jungle to find the hidden temple. We split the map in three for safety. That was a mistake. Please — send help. — P., J. & O.”" },
      { dur: 4.4, black: true, gameCam: true, who: "Captain Marisol", text: "“They say nobody comes back from that jungle. Well — WE will. And we'll bring them with us. My ship's ready when you are.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌴 PHASE 38 — The Jungle Expedition. Go outside and press 1 — fly to the Lost Jungle, where Marisol's ship is anchored.", true) },
    ]);
  }

  // ---------------------------------------------------------------- people + crocs
  // 🐍 where the snakes glide (circles round the deep jungle's paths)
  const SNAKES = [{ cx: -30, cz: -20, r: 6, sp: 0.5 }, { cx: 22, cz: -16, r: 7, sp: -0.45 }, { cx: 36, cz: -44, r: 6, sp: 0.55 }, { cx: -14, cz: -42, r: 7, sp: -0.5 }, { cx: 8, cz: -30, r: 5, sp: 0.6 }, { cx: -40, cz: -46, r: 5, sp: -0.5 }, { cx: 46, cz: -12, r: 5, sp: 0.5 }];
  let snakes = [], hissT = 0;
  let builtFor = null, mari = null, people = {}, crocs = [], elder = null, hud = null, rope = null;
  function explorer(spec) {
    const m = buildThistle({ tunicColor: spec.tunic, hoodColor: spec.hood, pack: true });
    const hat = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8d8a8, flatShading: true }));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 14), dome.material);
    hat.add(dome, brim);
    hat.position.y = 1.32;
    m.add(hat);
    return m;
  }
  function build(Z) {
    if (builtFor === Z) return;
    builtFor = Z;
    mari = buildThistle({ tunicColor: 0x2a3a6a, hoodColor: 0x1a2a4a, pack: false });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a2a }));
    cap.position.y = 1.36;
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
    badge.position.set(0, 1.38, 0.33);
    mari.add(cap, badge);
    mari.position.set(K.marisol.x, 0, K.marisol.z);
    Z.group.add(mari);
    for (const [k, spec] of Object.entries(EXPLORERS)) {
      people[k] = explorer(spec);
      Z.group.add(people[k]);
    }
    crocs = [...K.crocLanes, ...K.crocLanes].map((L, i) => {
      const c = buildCroc();
      c.scale.setScalar(1.25);
      for (const sx of [-0.28, 0.28]) {
        const eye = glow(0xffe040, 0.55, 0.95);
        eye.position.set(sx, 0.42, 1.6);
        c.add(eye);
      }
      Z.group.add(c);
      return { m: c, lane: L, x: i < K.crocLanes.length ? (i - 1) * 14 : (i - 4) * 14 + 24, dir: (i < K.crocLanes.length ? 1 : -1) * Math.sign(L.sp), chase: false };
    });
    // 🐍 jungle snakes, gliding round the deep jungle (where the explorers are lost)
    snakes = SNAKES.map((S0, i) => {
      const g = new THREE.Group();
      const m = buildAnimal("snake");
      m.scale.setScalar(1.6);
      g.add(m);
      for (const sx of [-0.12, 0.12]) {
        const eye = glow(0x9aff4a, 0.35, 0.95);
        eye.position.set(sx, 0.35, 0.9);
        g.add(eye);
      }
      Z.group.add(g);
      return { ...S0, g, a: i * 1.3, rest: 0 };
    });
    // the wise jungle elder: an ancient tortoise, moss growing on his shell
    elder = new THREE.Group();
    const t = buildAnimal("turtle");
    t.scale.setScalar(3.2);
    elder.add(t);
    for (let k = 0; k < 7; k++) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), new THREE.MeshStandardMaterial({ color: 0x4a8a3a, flatShading: true }));
      moss.scale.y = 0.4;
      moss.position.set(Math.cos(k) * 0.9, 1.5 + (k % 2) * 0.15, Math.sin(k) * 0.9);
      elder.add(moss);
    }
    elder.position.set(K.temple.x, 0, K.temple.z + 13);
    elder.visible = false;
    Z.group.add(elder);
    rope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), new THREE.MeshStandardMaterial({ color: 0x3a8a2a }));
    rope.visible = false;
    Z.group.add(rope);
  }
  function hudShow(text, good) {
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "ww-swing-hud";
      hud.style.cssText = "position:fixed;left:50%;top:150px;transform:translateX(-50%);padding:10px 22px;border-radius:14px;font:900 22px 'Trebuchet MS',sans-serif;z-index:60;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.4)";
      document.body.appendChild(hud);
    }
    hud.style.display = text ? "block" : "none";
    hud.textContent = text || "";
    hud.style.background = good ? "#2a8a2a" : "#3a2a1a";
    hud.style.color = good ? "#fff" : "#ffe6b0";
  }

  // ---------------------------------------------------------------- 🌿 swinging on the vines
  let spaceWas = false;
  function startSwing(i, forward) {
    const S0 = K.swings[i];
    const z0 = forward ? S0.from : S0.to;
    const L = Math.hypot(z0 - S0.az, S0.ay - 0.5);
    const A = Math.asin((z0 - S0.az) / L);
    lastSafe = { x: 0, z: forward ? S0.from + 0.6 : S0.to - (i === 1 ? 0.6 : 0) };
    swing = { i, L, A, t: 0, w: 2.3 };
    spaceWas = true;
    ctx.say("🌿 You grab the vine — and SWING out over the ravine! Press SPACE to let go when you're over solid ground!", true);
    ctx.setFlight((dt, keys) => {
      if (!swing) return;
      swing.t += dt;
      const th = swing.A * Math.cos(swing.w * swing.t);
      const p = me();
      p.x = S0.ax;
      p.z = S0.az + Math.sin(th) * swing.L;
      p.y = S0.ay - Math.cos(th) * swing.L;
      ctx.mouseRig.rotation.y = Math.sin(swing.w * swing.t) * swing.A > 0 ? Math.PI : 0;
      // the vine itself
      const dy = S0.ay - p.y - 1.1, dz = S0.az - p.z, len = Math.hypot(dy, dz);
      rope.visible = true;
      rope.scale.y = len;
      rope.position.set(p.x, p.y + 1.1 + dy / 2, p.z + dz / 2);
      rope.rotation.set(Math.atan2(dz, dy), 0, 0);
      // (only the MIDDLE of the landing spot counts now: the pillar's top, or a step clear of the cliff edge)
      const Pl = K.pillar, Rv = K.ravine;
      const solid = p.y > -0.6 && (Math.hypot(p.x - Pl.x, p.z - Pl.z) < Pl.r * 0.75 || p.z > Rv.z0 + 1 || p.z < Rv.z1 - 1);
      hudShow(solid ? "✅ LET GO NOW — SPACE!" : "🌿 swinging… (SPACE to let go)", solid);
      const sp = !!keys.Space;
      if (sp && !spaceWas) {
        const x = p.x, z = p.z, y = Math.max(p.y, 0.05);
        endSwing();
        ctx.placePlayer(x, z, ctx.mouseRig.rotation.y);
        me().y = y;
        if (solid) {
          lastSafe = { x, z };
          chime();
        }
      }
      spaceWas = sp;
    });
  }
  function endSwing() {
    swing = null;
    ctx.setFlight(null);
    rope.visible = false;
    hudShow(null);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 38) return null;
    const Z = zone();
    if (!Z || swing) return null;
    const s = p38();
    if (near(K.arrive.x, K.arrive.z, 3)) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (s.done) {
      if (near(K.elderDoor.x, K.elderDoor.z + 6, 5)) return { label: "fly home on your dragon 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    }
    if (near(K.marisol.x, K.marisol.z, 3)) return { label: "talk to Captain Marisol ⚓", act: () => {
      if (!s.met) {
        s.met = true;
        const c = C();
        (c.owned ||= {}).machete = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("⚓ “Here — take my machete. It's for VINES, mind, never for creatures. The only way in is through that wall of jungle up the beach… I'll keep the fire lit. Bring them home, Thistle.” (🗡️ Marisol's Machete!)", true);
      } else ctx.say(s.done ? "⚓ “All three explorers home safe — and a temple! I'll be telling this story for years.”" : "⚓ “The wall of vines is just north of the camp. Hack through, and be careful at the ravine!”", true);
    } };
    // the vine curtains
    for (const [ci, cu] of (Z.curtains || []).entries()) {
      if (s.hacked[ci] || !near(cu.x, cu.z, 3.6)) continue;
      if (!s.met) return { label: "(a solid wall of vines — you'd need something to cut them)", act: () => ctx.say("🌿 Too thick to squeeze through. Maybe Captain Marisol has something to cut vines with?", true) };
      return { label: `hack the vines 🗡️ (${(hacks[ci] || 0) + 1}/${HACKS}) — quick, before they grow back!`, act: () => hack(ci) };
    }
    // the ravine swings
    const P = K.pillar;
    if (near(0, K.swings[0].from, 2.6)) return { label: "grab the hanging vine 🌿", act: () => startSwing(0, true) };
    if (near(P.x, P.z, P.r + 0.6) && me().y > -0.5) {
      return me().z > P.z
        ? { label: "grab the vine back to the south edge 🌿", act: () => startSwing(0, false) }
        : { label: "grab the next vine — to the far side 🌿", act: () => startSwing(1, true) };
    }
    if (near(0, K.swings[1].to, 2.6)) return { label: "grab the vine back to the pillar 🌿", act: () => startSwing(1, false) };
    // the explorers
    const L = K.lookout;
    if (!s.found.tree && near(L.x, L.z, L.r + 0.5) && me().y > L.y - 1) return { label: "help Professor Pemberton 🧭", act: () => rescue("tree") };
    const Q = K.quick;
    if (!s.found.quick && near(Q.x, Q.z, Q.r + 1.6)) return { label: `throw Juniper a vine and PULL! 💪 (keep pressing E!)`, act: pull };
    const Cv = K.cave;
    if (!s.found.cave && s.hacked[1] && near(Cv.x, Cv.z, 4.2)) return { label: "help Ottoline Burrows 🔦", act: () => rescue("cave") };
    // the temple face
    if (!s.done && near(K.elderDoor.x, K.elderDoor.z + 6, 5)) {
      const n = Object.keys(s.found).length;
      if (n >= 3) return { label: "put the three map pieces together 🗺️", act: finale };
      return { label: "look at the great stone face 🗿", act: () => ctx.say(`🗿 A huge carved face, half-swallowed by moss. Its eyes are deep and dark. There's no handle, no keyhole… The explorers' map must show the way in. (${n}/3 pieces)`, true) };
    }
    return null;
  }
  function hack(ci) {
    const s = p38();
    const Z = zone();
    hacks[ci] = (hacks[ci] || 0) + 1;
    hackT[ci] = 2; // (stop chopping for 2 seconds and they grow right back)
    const cu = Z.curtains[ci];
    shakeT = { ci, t: 0.5 };
    if (hacks[ci] >= HACKS) {
      s.hacked[ci] = true;
      save();
      redraw();
      chime();
      ctx.say(ci === 0 ? "🗡️ SHHK! The last vines fall away — the trail into the Lost Jungle is open!" : "🗡️ SHHK! The vines fall from the cave mouth — and someone inside shouts “HELLO?! Is someone THERE?!”", true);
    } else ctx.say(`🗡️ Thwack! (${hacks[ci]}/${HACKS}) — keep going, they grow back fast!`);
  }
  let shakeT = null;
  const HACKS = 5, hackT = {};
  function pull() {
    pulls += 1;
    pullT = 1.1;
    if (pulls >= PULLS) return rescue("quick");
    ctx.say(["💪 You throw her the end of a vine — she grabs it! PULL!", "💪 Heave! She comes up a little…", "💪 HEAVE!", "💪 Don't stop — the sand's pulling her back!", "💪 Up to her waist now!", "💪 HEAVE!!", "💪 Keep going!!", "💪 Almost…", "💪 One more…!"][Math.min(8, Math.floor(pulls) - 1)]);
  }
  function rescue(k) {
    const s = p38();
    s.found[k] = true;
    save();
    redraw();
    chime();
    const n = Object.keys(s.found).length;
    const tail = n >= 3 ? " — That's all THREE pieces! Take them to the great stone face at the north end of the jungle." : ` (${n}/3 map pieces)`;
    const lines = {
      tree: "🧭 “Oh thank goodness! I climbed up to spot the temple… and then I looked DOWN. I've been up here for weeks eating figs.” Professor Pemberton follows you down, step by step, and hands you his piece of the map.",
      quick: "💪 SHLOOOP! Juniper Quickpaw pops out of the quicksand like a cork! “You're a LIFESAVER. Literally! Here — my piece of the map. It's a bit sandy.”",
      cave: "🔦 “The vines grew right over the door while I was mapping the cave — I couldn't get out!” Ottoline Burrows gives you her piece of the map — the last one.",
    };
    ctx.say(lines[k] + tail + " (They'll meet you at the temple.)", true);
  }

  function finale() {
    const s = p38();
    const Z = zone();
    const T = K.temple, D = { x: K.elderDoor.x, z: K.temple.z + 16 };
    playCutscene([
      { dur: 4.4, from: [D.x + 8, 3, D.z + 12], look: [D.x, 3, D.z], text: "You lay the three torn pieces together on the grass. The explorers lean in. The torn edges line up perfectly — and in the middle, a drawing of this very face… with a tiny paw-print pressed onto each eye." },
      { dur: 4.4, from: [D.x + 4, 4, D.z + 8], look: [D.x, 6.5, D.z], text: "You reach up and press both stone eyes at once. A deep, grinding rumble — and the great stone mouth slowly sinks into the ground.", run: () => {
        Z.templeEyes.forEach((e) => (e.material.color.setHex(0x6aff8a)));
        Z.templeMouth.position.y = -4.2;
        s.opened = true;
      } },
      { dur: 5, from: [D.x + 6, 2.5, D.z + 10], look: [D.x, 1.5, D.z - 1], text: "Out of the dark, very… very… slowly… walks a tortoise. An enormous one, with a garden of moss on his shell and eyes that have seen a thousand years of jungle.", run: () => (elder.visible = true) },
      { dur: 5.6, from: [D.x + 5, 2, D.z + 8], look: [D.x, 1.6, D.z], who: "The Jungle Elder", text: "“They say nobody ever comes back from my jungle. That isn't so. It's that nobody ever stayed long enough to say HELLO. You hacked my vines, swung my ravine, tiptoed past my crocodiles… and you stopped to help every lost friend on the way.”" },
      { dur: 5, from: [D.x + 5, 2, D.z + 8], look: [D.x, 1.6, D.z], who: "The Jungle Elder", text: "“Keep the map. Finish it. Draw in everything you found. And come back — the jungle likes you.” The explorers cheer so loudly the parrots join in." },
      { dur: 4, black: true, gameCam: true, who: "🌴 PHASE 38 COMPLETE", text: "The Jungle Expedition\n🪙 1200 · 🗺️ The Lost Explorers' Map" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.opened = true;
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1200;
        (c.owned ||= {}).junglemap = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌴 Three explorers found, one temple opened, one very old friend made. (The Lost Explorers' Map brings a little luck.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  let testAt = new URLSearchParams(location.search).get("p38at");
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 37 && st.p37 && st.p37.done && !p38().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 38) {
      if (swing) endSwing();
      return;
    }
    build(Z);
    const s = p38();
    if (testAt) {
      const at = { ravine: [0, 37], river: [0, 9], north: [0, -14] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    hurtCool = Math.max(0, hurtCool - dt);
    // the vine curtains: shake while being hacked, gone once cut
    (Z.curtains || []).forEach((cu, ci) => {
      const gone = !!s.hacked[ci];
      cu.mesh.visible = !gone;
      if (gone) for (const i of cu.cols) Z.colliders[i].x = 1e5; // (cut away)
      cu.mesh.rotation.z = shakeT && shakeT.ci === ci && shakeT.t > 0 ? Math.sin(t * 40) * 0.05 : 0;
    });
    if (shakeT) shakeT.t -= dt;
    // 🌿 stop chopping and the vines grow straight back
    for (const ci of Object.keys(hackT)) {
      hackT[ci] -= dt;
      if (hackT[ci] <= 0) {
        delete hackT[ci];
        if (!s.hacked[ci] && hacks[ci]) {
          hacks[ci] = 0;
          ctx.say("🌿 The vines curl and creep… and grow right back! Chop FASTER — all five without stopping!", true);
        }
      }
    }
    if (Z.templeMouth) Z.templeMouth.position.y = s.opened || s.done ? -4.2 : -2;
    elder.visible = !!s.done || elder.visible;
    if (s.done) elder.position.set(K.temple.x + 3, 0, K.temple.z + 19);
    // Marisol, by the fire
    mari.rotation.y = Math.atan2(me().x - mari.position.x, me().z - mari.position.z);
    // the explorers: stuck where they are… or waiting by the temple
    const L = K.lookout, Q = K.quick, Cv = K.cave;
    const spots = { tree: [L.x + 1.5, L.y, L.z + 1.5], quick: [Q.x, 0, Q.z], cave: [Cv.x, 0, Cv.z - 1] };
    for (const [k, m] of Object.entries(people)) {
      if (s.found[k]) {
        m.position.set(WAIT[k].x, 0, WAIT[k].z);
        m.rotation.y = Math.atan2(me().x - m.position.x, me().z - m.position.z);
        continue;
      }
      const [x, y, z] = spots[k];
      m.position.set(x, y, z);
      if (k === "quick") {
        // sinking… unless you're pulling
        pullT = Math.max(0, pullT - dt);
        if (pullT <= 0 && pulls > 0) {
          pulls = Math.max(0, pulls - dt * 1.4); // (stop pulling and she sinks back — FAST)
        }
        m.position.y = -0.9 + Math.min(pulls, 6) * 0.15 + Math.sin(t * 2) * 0.04;
        m.rotation.y = Math.sin(t * 3) * 0.4; // (wriggling)
      } else m.rotation.y = Math.atan2(me().x - m.position.x, me().z - m.position.z);
    }
    // the safety net: fall into the ravine and the river at the bottom washes you back
    const p = me();
    if (!swing && !falling && p.y < -5 && p.z < K.ravine.z0 && p.z > K.ravine.z1) {
      falling = true;
      setTimeout(() => (falling = false), 2500);
      ctx.hurt(6);
      fadeThrough(() => {
        const back = lastSafe && Math.abs(lastSafe.z - K.pillar.z) < K.pillar.r ? lastSafe : p.z > K.pillar.z ? { x: 0, z: K.ravine.z0 + 1.6 } : { x: 0, z: K.ravine.z1 - 1.6 };
        ctx.placePlayer(back.x, back.z, Math.PI);
      }, 1);
      ctx.say("💦 AAAH— SPLASH! You tumble into the stream at the bottom of the ravine, and scramble back up the vines. Try again — let go when the sign turns GREEN!", true);
      me().y = 0;
    }
    if (!swing && p.y > -0.5) {
      if (p.z < K.ravine.z1 - 0.5 && !s.ravine) {
        s.ravine = true;
        save();
        redraw();
        ctx.say("🌿 You made it across the ravine! Next: the crocodile river…", true);
      }
      if (p.z < K.river.z1 - 0.8 && !s.river) {
        s.river = true;
        save();
        redraw();
        ctx.say("🐊 Across the crocodile river — every whisker still attached! Now find the lost explorers: high in a giant tree, out in the quicksand to the east, and somewhere by a waterfall…", true);
      }
    }
    // 🐍 the snakes: they HISS when you get close… then they bite
    hissT = Math.max(0, hissT - dt);
    const calmNow = window.__wwCalm && window.__wwCalm();
    for (const sn of snakes) {
      sn.rest = Math.max(0, sn.rest - dt);
      const d0 = Math.hypot(p.x - sn.g.position.x, p.z - sn.g.position.z);
      if (d0 < 7 && !sn.rest && !calmNow && p.y < 2) {
        // it turns and slides toward you
        const dx = p.x - sn.g.position.x, dz = p.z - sn.g.position.z;
        sn.g.position.x += (dx / (d0 || 1)) * 3.4 * dt;
        sn.g.position.z += (dz / (d0 || 1)) * 3.4 * dt;
        sn.g.rotation.y = Math.atan2(dx, dz);
        if (!hissT && !s.done) {
          hissT = 6;
          ctx.say("🐍 HSSSSSS… a jungle snake has seen you! Get away — or jump over it!");
        }
      } else {
        sn.a += sn.sp * dt;
        const tx = sn.cx + Math.cos(sn.a) * sn.r, tz = sn.cz + Math.sin(sn.a) * sn.r;
        sn.g.position.x += (tx - sn.g.position.x) * Math.min(1, dt * 2);
        sn.g.position.z += (tz - sn.g.position.z) * Math.min(1, dt * 2);
        sn.g.rotation.y = Math.atan2(-Math.sin(sn.a) * Math.sign(sn.sp), Math.cos(sn.a) * Math.sign(sn.sp));
      }
      sn.g.position.y = 0.05;
      if (d0 < 1.5 && p.y < 1 && !sn.rest && !hurtCool && !calmNow && !ctx.playing()) {
        hurtCool = 1.5;
        sn.rest = 3;
        ctx.hurt(8);
        const k = 5 / (d0 || 1);
        ctx.placePlayer(p.x + (p.x - sn.g.position.x) * k, p.z + (p.z - sn.g.position.z) * k, ctx.mouseRig.rotation.y);
        ctx.say("🐍 SNAP! The snake bites — OUCH! (Jump over them, or play the Song of Calm to make them drowsy.)", true);
      }
    }
    // 🐊 crocodiles
    const Rv = K.river;
    const inRiver = p.z < Rv.z0 - 0.4 && p.z > Rv.z1 + 0.4;
    const swimming = inRiver && p.y < 0.3;
    for (const c of crocs) {
      if (swimming && !ctx.playing() && !(window.__wwCalm && window.__wwCalm())) {
        // anyone in the water: the nearest croc comes for them
        const dx = p.x - c.x, dz = p.z - (c.z ?? c.lane.z), d = Math.hypot(dx, dz);
        c.chase = d < 26;
      } else c.chase = false;
      if (c.chase) {
        const cz = c.z ?? c.lane.z;
        const dx = p.x - c.x, dz = p.z - cz, d = Math.hypot(dx, dz) || 1;
        c.x += (dx / d) * 11 * dt;
        c.z = cz + (dz / d) * 11 * dt;
        c.m.rotation.y = Math.atan2(dx, dz);
      } else {
        const cz = c.z ?? c.lane.z;
        c.z = cz + (c.lane.z - cz) * Math.min(1, dt * 2);
        c.x += c.dir * Math.abs(c.lane.sp) * dt;
        if (c.x > 24) c.dir = -1;
        if (c.x < -24) c.dir = 1;
        c.m.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      c.m.position.set(c.x, -0.12 + Math.sin(t * 2 + c.lane.z) * 0.04, c.z);
      const near2 = Math.hypot(p.x - c.x, p.z - c.z);
      if (c.m.userData.jaw) c.m.userData.jaw.rotation.x = near2 < 4 ? -0.5 + Math.sin(t * 12) * 0.3 : 0;
      if (!hurtCool && !ctx.playing() && inRiver && near2 < 2.4 && p.y < 1.5 && !(window.__wwCalm && window.__wwCalm())) {
        hurtCool = 2.5;
        ctx.hurt(12);
        const back = !p38().river || p.z > (Rv.z0 + Rv.z1) / 2 ? Rv.z0 + 2 : Rv.z1 - 2; // (no getting flung across!)
        ctx.placePlayer(0, back, back > 0 ? Math.PI : 0);
        ctx.say(swimming ? "🐊 SNAP!! Never, EVER swim in the crocodile river! You scramble out onto the bank. Use the stepping stones — and time your hops between the yellow eyes." : "🐊 SNAP! A crocodile glides right past your stone and lunges! You leap back to the bank. Wait for it to pass before you hop!", true);
      }
    }
  }

  function panelHTML() {
    const s = p38();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌴 The Jungle Expedition</h3><ul>
      ${row(s.been, "Fly to the Lost Jungle <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “The Lost Jungle”</div>")}
      ${row(s.met, "Find Captain Marisol at her camp on the beach")}
      ${row(!!s.hacked[0], "Hack through the wall of vines 🗡️")}
      ${row(s.ravine, "Swing across the ravine 🌿 <div class=\"sub\">&nbsp;&nbsp;let go with SPACE when the sign turns green</div>")}
      ${row(s.river, "Cross the crocodile river on the stepping stones 🐊")}
      ${row(!!s.found.tree, "🧭 Professor Pemberton — stuck up a giant tree")}
      ${row(!!s.found.quick, "💪 Juniper Quickpaw — sinking in quicksand")}
      ${row(!!s.found.cave, "🔦 Ottoline Burrows — trapped in a cave by a waterfall")}
      ${row(s.done, "Find the way into the hidden temple 🗿")}
    </ul><div class="kit">🐍 snakes in the deep jungle — jump them · 🐊 never swim in the river · 🌳 the kapok tree is west · 🏜️ the quicksand is east · 🌊 the waterfall is north-east</div>`;
  }

  // (test hook)
  window.__wwP38 = {
    state: () => ({ ...p38(), swinging: !!swing, pulls }),
    playing: () => ctx.playing(),
    crocs: () => crocs.map((c) => ({ x: c.x, z: c.z, lane: c.lane.z })),
    stillSnakes: () => snakes.forEach((sn) => ((sn.cx = 200), (sn.rest = 9999))),
    stillCrocs: () => crocs.forEach((c) => ((c.lane = { ...c.lane, sp: 0 }), (c.x = 30))),
  };
  return { update, interactable, panelHTML, done: () => !!p38().done };
}
