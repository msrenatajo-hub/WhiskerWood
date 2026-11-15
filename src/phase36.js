// ------------------------------------------------------------
//  🌻  PHASE 36 — "The Giant's Garden"
//
//  A seed as big as a mouse rolls out of the sky and lands — THUMP — by
//  your cottage. It's a giant's seed. Beyond the far edge of the Great
//  Forest lies a garden where everything is HUGE, and its gentle giant has
//  lost all six of his precious seeds, scattered by the wind:
//    🌱 on top of the beanstalk (climb the spiralling leaves)
//    🍃 on the island in the puddle-lake (sail there on a leaf boat)
//    🪴 inside the tipped-over flowerpot · 🚿 in the old watering can
//    🧙 under the garden gnome's spare hat
//    🐈 …and in the CAT's own bed. The giant's cat prowls the far side of the
//       garden — if it spots you it POUNCES. Hide under the big leaves, or
//       wait for it to sit down and yawn.
//  Bring them to the giant's door, and meet the friendly giant himself.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { GIANTGARDEN } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { buildPet } from "./pets.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("giantbutton", "🔘", "The Giant's Button (big as a shield — a thank-you from a gentle giant)");
ITEM_POWERS.giantbutton = { type: "jump", n: 0.08 };

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase36(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p36 = () => (st.p36 ||= { started: false, been: false, seeds: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "giantgarden" ? ctx.city() : null);
  const K = GIANTGARDEN;
  // (the beanstalk seed sits on the very top leaf)
  {
    const k = 17, a = k * 0.85;
    Object.assign(K.seeds[0], { x: K.beanstalk.x + Math.cos(a) * 2.8, z: K.beanstalk.z + Math.sin(a) * 2.8, y: 1.6 + k * 1.65 });
  }
  let wait = 0, hurtCool = 0, sailing = null, onIsland = false;
  let testAt = new URLSearchParams(location.search).get("p36at");

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("giantgarden");
      ctx.placePlayer(K.arrive.x, K.arrive.z, Math.PI);
      const s = p36();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🌻 The Giant's Garden — the giant waves from his window (he's VERY careful where he steps now)."
        : "🌻 THE GIANT'S GARDEN! Grass like trees, flowers like towers… Six giant seeds are lost in here. Beware the giant's CAT on the far side — hide under the big leaves if it looks your way!", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "giantgarden", icon: "🌻", name: "The Giant's Garden", when: () => st.phase >= 36, go: goThere });

  function begin() {
    p36().started = true;
    st.phase = 36;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "THUMP. Something falls out of the sky right by your cottage — a seed. A single seed, as big as you are, with a little paper label tied on." },
      { dur: 4.8, black: true, gameCam: true, who: "The label (in enormous, careful handwriting)", text: "“IF FOUND, PLEASE RETURN TO THE GARDEN BEYOND THE FOREST'S FAR EDGE. THE WIND TOOK ALL MY SEEDS AND I CANNOT FIND THEM — THEY ARE SO VERY SMALL. THANK YOU. — G.”" },
      { dur: 4.4, black: true, gameCam: true, text: "A giant who can't find his seeds… because to him they're tiny. But to a mouse, they'd be easy to spot. You tuck the seed in your pack." },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌻 PHASE 36 — The Giant's Garden. Go outside and press 1 — fly to the Giant's Garden. Six seeds to find!", true) },
    ]);
  }

  // ---------------------------------------------------------------- the seeds, and the cat
  let builtFor = null, seedMeshes = [], cat = null;
  function build(Z) {
    if (builtFor === Z) return;
    builtFor = Z;
    seedMeshes = K.seeds.map((S0) => {
      const g = new THREE.Group();
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9a6a3a, flatShading: true }));
      seed.scale.set(0.8, 1.2, 0.8);
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 14), new THREE.MeshBasicMaterial({ color: 0xf0e0b0 }));
      stripe.rotation.x = Math.PI / 2;
      g.add(seed, stripe, glow(0xfff0a0, 2.2, 0.6));
      g.position.set(S0.x, S0.y + 0.7, S0.z);
      Z.group.add(g);
      return g;
    });
    // the giant's cat — an enormous ginger tabby
    const m = buildPet("cat", 1);
    m.scale.setScalar(9);
    Z.group.add(m);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(16, 20, -0.55, 1.1), new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = -Math.PI / 2;
    const coneG = new THREE.Group();
    coneG.add(cone);
    Z.group.add(coneG);
    cat = { m, coneG, u: 0, sitT: 0, nextSit: 12, x: 0, z: -30, face: 0 };
  }
  // the cat's round: a loop over the far half of the garden
  const CAT_PATH = [[-30, -20], [-8, -14], [24, -18], [34, -44], [10, -60], [-20, -58], [-40, -40]];
  function catStep(dt, t) {
    const L = CAT_PATH.length;
    if (cat.sitT > 0) {
      cat.sitT -= dt; // (sitting… licking a paw… YAWNING)
      cat.m.rotation.x = 0;
      cat.coneG.visible = false;
      return;
    }
    cat.nextSit -= dt;
    if (cat.nextSit <= 0) {
      cat.nextSit = 14 + Math.random() * 10;
      cat.sitT = 6;
      return;
    }
    cat.coneG.visible = true;
    cat.u = (cat.u + dt * 0.09) % L;
    const i = Math.floor(cat.u), f = cat.u - i;
    const a = CAT_PATH[i], b = CAT_PATH[(i + 1) % L];
    cat.x = a[0] + (b[0] - a[0]) * f;
    cat.z = a[1] + (b[1] - a[1]) * f;
    // it glances about as it walks
    cat.face = Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.sin(t * 0.7) * 0.6;
  }
  const hidden = () => K.hides.some((H) => near(H.x, H.z, 3.6));

  // ---------------------------------------------------------------- the leaf boat
  const camPos = new THREE.Vector3();
  function startSail() {
    const Z = zone();
    sailing = { speed: 0 };
    onIsland = false;
    ctx.placePlayer(K.dock.x, K.dock.z - 3.2, Math.PI);
    me().y = 0.35;
    camPos.set(0, 0, 0);
    ctx.setFlight((dt, keys) => {
      if (!sailing) return;
      const p = me();
      sailing.speed += ((keys.KeyW || keys.ArrowUp ? 7 : keys.KeyS || keys.ArrowDown ? -2 : 0) - sailing.speed) * Math.min(1, dt * 2);
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      ctx.mouseRig.rotation.y += turn * dt * 1.4;
      const yaw = ctx.mouseRig.rotation.y;
      let nx = p.x + Math.sin(yaw) * sailing.speed * dt, nz = p.z + Math.cos(yaw) * sailing.speed * dt;
      // stay on the water: inside the lake, outside the island
      const L = K.lake, I = K.island;
      const dl = Math.hypot(nx - L.x, nz - L.z);
      if (dl > L.r - 1.2) {
        nx = L.x + ((nx - L.x) / dl) * (L.r - 1.2);
        nz = L.z + ((nz - L.z) / dl) * (L.r - 1.2);
      }
      const di = Math.hypot(nx - I.x, nz - I.z);
      if (di < I.r + 1.2) {
        nx = I.x + ((nx - I.x) / di) * (I.r + 1.2);
        nz = I.z + ((nz - I.z) / di) * (I.r + 1.2);
      }
      p.x = nx;
      p.z = nz;
      p.y = 0.35;
      Z.boat.position.set(p.x, 0.3 + Math.sin(performance.now() / 400) * 0.06, p.z);
      Z.boat.rotation.set(Math.PI, yaw, 0);
    });
    ctx.setFlightCam((dt) => {
      const p = me();
      const yaw = ctx.mouseRig.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 7, p.y + 3.5, p.z - Math.cos(yaw) * 7);
      if (camPos.lengthSq() === 0) camPos.copy(want);
      camPos.lerp(want, Math.min(1, dt * 4));
      ctx.camera.position.copy(camPos);
      ctx.camera.lookAt(p.x + Math.sin(yaw) * 4, p.y + 0.8, p.z + Math.cos(yaw) * 4);
      return true;
    });
    ctx.say("🍃 You push off in the leaf boat! W paddle · A/D steer. Sail out to the island in the middle.", true);
  }
  function stopSail(x, z, face) {
    sailing = null;
    ctx.setFlight(null);
    ctx.setFlightCam(null);
    ctx.placePlayer(x, z, face);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 36) return null;
    const Z = zone();
    if (!Z) return null;
    const s = p36();
    const I = K.island;
    if (sailing) {
      if (near(I.x, I.z, I.r + 2.6)) return { label: "step onto the island 🏝️", act: () => {
        const p = me();
        const a = Math.atan2(p.x - I.x, p.z - I.z);
        stopSail(I.x + Math.sin(a) * (I.r - 1), I.z + Math.cos(a) * (I.r - 1), a + Math.PI);
        onIsland = true;
      } };
      if (near(K.dock.x, K.dock.z - 3, 4)) return { label: "step back onto the shore 🍃", act: () => stopSail(K.dock.x, K.dock.z + 1, 0) };
      return null;
    }
    if (onIsland && near(I.x, I.z, I.r + 0.5)) {
      for (const [i, S0] of K.seeds.entries()) if (!s.seeds[S0.key] && near(S0.x, S0.z, 2.9)) return seedAct(S0);
      return { label: "climb back into the leaf boat 🍃", act: () => {
        startSail();
        const p = me();
        p.x = I.x;
        p.z = I.z + I.r + 1.6;
      } };
    }
    if (near(K.arrive.x, K.arrive.z, 3)) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (s.done) return null;
    if (near(K.dock.x, K.dock.z, 3.4)) return { label: "climb into the leaf boat 🍃", act: startSail };
    for (const S0 of K.seeds) {
      if (s.seeds[S0.key] || !near(S0.x, S0.z, 2.2) || Math.abs(me().y - S0.y) > 2.2) continue;
      return seedAct(S0);
    }
    if (near(K.door.x, K.door.z + 4, 6)) {
      const n = Object.keys(s.seeds).length;
      if (n >= 6) return { label: "knock on the giant's door with all six seeds 🚪", act: finale };
      return { label: "look up at the enormous door 🚪", act: () => ctx.say(`🚪 A door as tall as a tree. You could knock… but not until you've found all his seeds. (${n}/6)`, true) };
    }
    return null;
  }
  function seedAct(S0) {
    const s = p36();
    return { label: `pick up the giant seed 🌱`, act: () => {
      s.seeds[S0.key] = true;
      save();
      redraw();
      chime();
      const n = Object.keys(s.seeds).length;
      ctx.say(`🌱 A giant seed ${S0.name}! It's as big as you are — you hug it into your pack. (${n}/6)${n >= 6 ? " ALL SIX! Take them to the giant's front door, at the far end of the garden." : ""}`, true);
    } };
  }

  function finale() {
    const s = p36();
    const Z = zone();
    const D0 = K.door;
    // the giant himself — kneeling in his doorway, leaning down to see you
    const giant = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xe8b890, flatShading: true });
    const coat = new THREE.MeshStandardMaterial({ color: 0x3a5a7a, flatShading: true });
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(16, 30), new THREE.MeshBasicMaterial({ color: 0x1a120a }));
    dark.position.set(0, 15, 0.6);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(6, 7.5, 16, 12), coat);
    body.position.set(0, 8, 3);
    body.rotation.x = 0.25;
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xd8a83a, metalness: 0.6 }));
    btn.rotation.x = Math.PI / 2 + 0.25;
    btn.position.set(0, 9, 9.6);
    const head = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 12), skin);
    head.position.set(0, 19, 7);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(5.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, flatShading: true }));
    hair.position.set(0, 19.4, 6.6);
    const beard = new THREE.Mesh(new THREE.SphereGeometry(4.4, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, flatShading: true }));
    beard.scale.set(1, 0.85, 0.6);
    beard.position.set(0, 15.2, 10);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), skin);
    nose.position.set(0, 18.6, 12.4);
    giant.add(dark, body, btn, head, hair, beard, nose);
    for (const sx of [-2, 2]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), new THREE.MeshBasicMaterial({ color: 0x2a1a0a }));
      eye.position.set(sx, 20.2, 11.9);
      giant.add(eye);
    }
    const hand = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 8), skin);
    hand.scale.set(1.3, 0.45, 1);
    hand.position.set(7, 1.6, 12);
    const gift = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 14), btn.material);
    gift.position.set(7, 2.6, 12);
    giant.add(hand, gift);
    giant.position.set(D0.x, 0, D0.z);
    giant.visible = false;
    Z.group.add(giant);
    playCutscene([
      { dur: 4, from: [D0.x + 6, 4, D0.z + 22], look: [D0.x, 10, D0.z], text: "You knock on the enormous door — knock, knock, knock — as hard as a mouse can. For a long moment, nothing…" },
      { dur: 4.6, from: [D0.x + 16, 7, D0.z + 46], look: [D0.x, 13, D0.z], text: "…then the door swings open, and a GIANT bends down — slowly, carefully — to look at the tiny visitor on his step.", run: () => {
        Z.door3d.position.x += 15.5; // (it swings aside)
        Z.door3d.position.z += 2;
        giant.visible = true;
      } },
      { dur: 5.2, from: [D0.x - 9, 9, D0.z + 34], look: [D0.x, 15, D0.z + 6], who: "The Giant (his whisper is like a gentle wind)", text: "“My SEEDS! All six! I looked for weeks — but they're so small, and my eyes are so big. Thank you, tiny friend. I'll plant them right away… and I promise to watch where I step.”" },
      { dur: 4.6, from: [D0.x + 2, 5, D0.z + 24], look: [D0.x + 7, 2, D0.z + 12], text: "He lays his great hand on the step beside you, palm up. In it: a single button from his coat — as big as a shield, and polished till it shines." },
      { dur: 4, black: true, gameCam: true, who: "🌻 PHASE 36 COMPLETE", text: "The Giant's Garden\n🪙 1000 · 🔘 The Giant's Button" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        giant.visible = false;
        Z.door3d.position.x -= 15.5;
        Z.door3d.position.z -= 2;
        const c = C();
        c.coins = (c.coins || 0) + 1000;
        (c.owned ||= {}).giantbutton = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌻 The giant has his seeds back — and a tiny new friend! (The Giant's Button makes you jump higher.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 35 && st.p35 && st.p35.done && !p36().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 36) {
      if (sailing) {
        sailing = null;
        ctx.setFlight(null);
        ctx.setFlightCam(null);
      }
      return;
    }
    build(Z);
    const s = p36();
    if (testAt) {
      // (test) &p36at=dock|beanstalk|cat — start there
      const at = { dock: [K.dock.x, K.dock.z + 2], beanstalk: [K.beanstalk.x + 5, K.beanstalk.z], cat: [0, -10] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    hurtCool = Math.max(0, hurtCool - dt);
    if (onIsland && !near(K.island.x, K.island.z, K.island.r + 1)) onIsland = false;
    seedMeshes.forEach((g, i) => {
      g.visible = !s.seeds[K.seeds[i].key] && !s.done;
      g.rotation.y = t + i;
    });
    if (Z.gnomeHat) Z.gnomeHat.position.y = s.seeds.gnome ? 0.6 : 1.8;
    if (Z.gnomeHat) Z.gnomeHat.rotation.z = s.seeds.gnome ? 1.4 : 0;
    // 🐈 the cat
    if (s.done) {
      cat.m.position.set(K.catBed.x, 0.4, K.catBed.z);
      cat.coneG.visible = false;
      return;
    }
    if (!ctx.playing() && !cat.frozen) catStep(dt, t);
    cat.m.position.set(cat.x, 0, cat.z);
    cat.m.rotation.y = cat.face;
    cat.coneG.position.set(cat.x, 0.15, cat.z);
    cat.coneG.rotation.y = cat.face - Math.PI / 2;
    const p = me();
    const dx = p.x - cat.x, dz = p.z - cat.z, d = Math.hypot(dx, dz);
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - cat.face), Math.cos(Math.atan2(dx, dz) - cat.face)));
    if ((window.__wwCalm && window.__wwCalm())) cat.sitT = Math.max(cat.sitT, 1); // (😌 calm song: the cat curls up and dozes)
    if (cat.sitT <= 0 && !hidden() && !sailing && d < 16 && diff < 0.55 && p.y < 3 && !hurtCool && !ctx.playing()) {
      hurtCool = 3;
      ctx.hurt(10);
      // (batted away from the cat — but never into the puddle-lake)
      let kx = p.x + (dx / d) * 12, kz = p.z + (dz / d) * 12;
      if (Math.hypot(kx - K.lake.x, kz - K.lake.z) < K.lake.r + 1.5) kz = K.lake.z - K.lake.r - 2;
      const kr = Math.hypot(kx, kz);
      if (kr > K.R - 4) (kx *= (K.R - 4) / kr), (kz *= (K.R - 4) / kr);
      ctx.placePlayer(kx, kz, Math.atan2(dx, dz));
      ctx.say("🐈 MROWR! The giant's cat spots you and POUNCES — one huge paw bats you tumbling away across the grass! (Hide under the big leaves when it looks your way — or wait for it to sit down for a yawn.)", true);
    } else if (d < 26 && cat.sitT > 5 && !cat.told) {
      cat.told = true;
      ctx.say("🐈 The cat sits down… licks a paw… and gives an ENORMOUS yawn. Now's your chance!");
    }
    if (cat.sitT <= 0) cat.told = false;
  }

  function panelHTML() {
    const s = p36();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = Object.keys(s.seeds).length;
    return `<h3>🌻 The Giant's Garden</h3><ul>
      ${row(s.been, "Fly to the Giant's Garden <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “The Giant's Garden”</div>")}
      ${K.seeds.map((S0) => row(!!s.seeds[S0.key], `🌱 a seed ${S0.name}`)).join("")}
      ${row(s.done, `Bring all six to the giant's door (${n}/6)`)}
    </ul><div class="kit">🐈 if the cat looks your way, hide under a big leaf · 🍃 the leaf boat is at the edge of the puddle-lake</div>`;
  }

  // (test hook)
  window.__wwP36 = {
    state: () => ({ ...p36(), sailing: !!sailing, onIsland, cat: cat && { x: cat.x, z: cat.z, sitT: cat.sitT } }),
    nap: (sec = 999) => cat && (cat.sitT = sec),
    wake: () => cat && ((cat.sitT = 0), (cat.nextSit = 999)),
    catAt: (x, z, face) => cat && Object.assign(cat, { x, z, face, sitT: 0, nextSit: 999, u: 0, frozen: true }),
  };
  return { update, interactable, panelHTML, done: () => !!p36().done };
}
