// ------------------------------------------------------------
//  🌙  PHASE 26 — "Sprig's Big Day"
//
//  Sprig has been an apprentice for a long time now — and the old
//  Moonkeepers' rule says an apprentice who has seen enough of the world
//  may take the REAL Moonkeeper test: the Trial of Three.
//    1. 🦉 The Riddle   — Teacher Willow asks three riddles (help Sprig answer)
//    2. 🌑 The Night Walk — no lantern, only fireflies: lead Sprig through the dark
//    3. 🦊 The Brave Rescue — a fox kit is stuck on a tall rock; hop up the stumps,
//                         carry it down, and bring it home to its mother
//  Then Headmaster Bramble makes Sprig a true Moonkeeper, at the old school
//  door where Thistle's own story began — and Sprig gets his very own
//  starry cloak and lantern (he wears them from then on).
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";

import { cityState, saveCity, registerKeepsake, openCard, closeCard } from "./cityLife.js";

registerKeepsake("trialmedal", "🏅", "The Trial of Three Medal (teacher of a true Moonkeeper)");

const RIDDLES = [
  { q: "I have roots that nobody sees. I'm taller than the tallest trees. Up, up, up I go — and yet I never grow.", a: ["A mountain", "An oak tree", "A cloud"], right: 0 },
  { q: "The more of me you take, the more of me you leave behind.", a: ["Acorns", "Footsteps", "Breaths"], right: 1 },
  { q: "I light the way, but I'm not the sun. Carry me home when the day is done.", a: ["A firefly", "The moon", "A lantern"], right: 2 },
];
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });

export function initPhase26(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p26 = () => (st.p26 ||= { started: false, riddles: 0, walk: 0, walkDone: false, kit: 0, done: false });
  const outside = () => ctx.world() === "outside";
  const npc = (k) => ctx.npcs.find((n) => n.key === k);
  let wait = 0;
  let testAt = new URLSearchParams(location.search).get("p26at");
  function applyTest() {
    // (test) &p26at=walk|rescue|done — start partway through the trials
    const at = testAt;
    testAt = null;
    if (at && st.phase === 26) {
      Object.assign(p26(), { riddles: 3 }, at === "walk" ? { walk: 1 } : { walk: 99, walkDone: true }, at === "done" ? { kit: 2, done: true } : {});
      if (at === "done") (st.p12 ||= {}).apprentice = true;
    }
  }

  // ---------------------------------------------------------------- places
  // (worked out once, from the school: clear ground, away from the water)
  let places = null;
  function findPlaces() {
    if (places) return places;
    const B = npc("bramble");
    if (!B) return null;
    const ok = (x, z, r) => ctx.isClear(x, z, r) && !ctx.nearWater(x, z);
    // 🌑 the firefly trail: a long loop out into the woods and back to the door
    const trail = [];
    let a0 = Math.atan2(B.z - ctx.home.z, B.x - ctx.home.x); // (heads away from your cottage)
    for (let i = 0; i < 8; i++) {
      const a = a0 - 1.3 + (i / 7) * 2.6;
      const d = 22 + Math.sin(i * 1.7) * 8 + (i % 2) * 6;
      let pt = null;
      for (let tries = 0; tries < 12 && !pt; tries++) {
        const r = d + tries * 2.5;
        const x = B.x + Math.cos(a) * r;
        const z = B.z + Math.sin(a) * r;
        if (ok(x, z, 1.5)) pt = { x, z };
      }
      if (pt) trail.push(pt);
    }
    trail.push({ x: B.x + 2.5, z: B.z + 2.5 }); // (and home to the door)
    // 🦊 the rescue rock: somewhere open, a little way off
    let rock = null;
    for (let r = 30; r < 90 && !rock; r += 6) {
      for (let k = 0; k < 16 && !rock; k++) {
        const a = a0 + Math.PI + (k / 16) * Math.PI * 2;
        const x = B.x + Math.cos(a) * r;
        const z = B.z + Math.sin(a) * r;
        if (ok(x, z, 9)) rock = { x, z, a };
      }
    }
    rock ||= { x: B.x + 40, z: B.z, a: 0 };
    return (places = { B, trail, rock });
  }

  // ---------------------------------------------------------------- the night walk
  let flies = null;
  function buildFlies() {
    if (flies || !ctx.outsideGroup) return;
    const P = findPlaces();
    if (!P) return;
    flies = P.trail.map((pt) => {
      const g = new THREE.Group();
      g.add(glow(0xfff2a0, 2.6, 0.95));
      for (let k = 0; k < 5; k++) {
        const f = glow(0xffe680, 0.7, 0.9);
        f.position.set(Math.cos(k * 1.3) * 0.8, Math.sin(k * 2.1) * 0.4, Math.sin(k * 1.3) * 0.8);
        g.add(f);
      }
      g.position.set(pt.x, ctx.terrainHeight(pt.x, pt.z) + 1.3, pt.z);
      g.visible = false;
      ctx.outsideGroup.add(g);
      return { g, pt };
    });
  }

  // ---------------------------------------------------------------- the rescue rock
  let rockBuilt = null;
  function buildRock() {
    if (rockBuilt || !ctx.outsideGroup) return;
    const P = findPlaces();
    if (!P) return;
    const R = P.rock;
    const t0 = ctx.terrainHeight(R.x, R.z);
    const g = new THREE.Group();
    // five rising stumps, with little gaps between (hop across!)
    const stumps = [];
    for (let i = 0; i < 5; i++) {
      const d = 9 - i * 2.2;
      const x = R.x + Math.cos(R.a) * d + Math.sin(i * 1.4) * 0.6;
      const z = R.z + Math.sin(R.a) * d + Math.cos(i * 1.4) * 0.6;
      const top = ctx.terrainHeight(x, z) + 0.8 + i * 0.75;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, top - ctx.terrainHeight(x, z) + 1, 9), M(i % 2 ? 0x7a5432 : 0x6a4a2c));
      s.position.set(x, (top + ctx.terrainHeight(x, z) - 1) / 2, z);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.06, 9), M(0xc8a070));
      ring.position.set(x, top + 0.02, z);
      g.add(s, ring);
      ctx.addPlatform(x, z, 0.8, top);
      stumps.push({ x, z, top });
    }
    // the tall rock, with the fox kit stuck on top
    const top = t0 + 4.6;
    const rock = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.2, top - t0 + 0.5, 8), M(0x8a8a90));
    rock.position.set(R.x, (top + t0 - 0.5) / 2, R.z);
    g.add(rock);
    ctx.addPlatform(R.x, R.z, 1.5, top);
    const kit = buildFox(0.55);
    kit.position.set(R.x, top, R.z);
    g.add(kit);
    // the worried mother fox, waiting below
    const mum = buildFox(1);
    const mx = R.x - Math.cos(R.a) * 4;
    const mz = R.z - Math.sin(R.a) * 4;
    mum.position.set(mx, ctx.terrainHeight(mx, mz), mz);
    mum.rotation.y = Math.atan2(R.x - mx, R.z - mz);
    g.add(mum);
    ctx.addSolid(mx, mz, 0.9);
    ctx.outsideGroup.add(g);
    rockBuilt = { g, kit, mum, top, mx, mz, R };
  }
  function buildFox(s) {
    const g = new THREE.Group();
    const fur = M(0xd8743a);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), fur);
    body.scale.set(0.8, 0.7, 1.3);
    body.position.y = 0.55;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), fur);
    head.position.set(0, 0.85, 0.62);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 8), M(0xf0e0d0));
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.8, 0.95);
    for (const sx of [-0.17, 0.17]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 4), fur);
      ear.position.set(sx, 1.15, 0.58);
      g.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), fur);
    tail.rotation.x = -1.1;
    tail.position.set(0, 0.7, -0.85);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), M(0xf8f0e8));
    tip.position.set(0, 0.95, -1.25);
    g.add(body, head, snout, tail, tip);
    g.scale.setScalar(s);
    return g;
  }

  // ---------------------------------------------------------------- begin
  function begin() {
    p26().started = true;
    st.phase = 26;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "The morning after the Festival, a letter arrives sealed with silver wax — the old seal of the Moonkeepers." },
      { dur: 4.8, black: true, gameCam: true, who: "Headmaster Bramble", text: "“Thistle — your apprentice has crossed oceans, ridden dragons and walked the Starway. By the old rule, Sprig may now take the REAL Moonkeeper test: the Trial of Three. Bring him to the school.”" },
      { dur: 4.2, black: true, gameCam: true, who: "Sprig (very pale)", text: "“The Trial of THREE? …Thistle, what if I can't do it? What if I'm not brave enough?”" },
      { dur: 4.2, black: true, gameCam: true, who: "Thistle", text: "“Then we'll be brave together. That's what a teacher is for.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌙 PHASE 26 — Sprig's Big Day. Take Sprig to the Fallen Log School — Teacher Willow has the first trial waiting!", true) },
    ]);
  }

  // ---------------------------------------------------------------- 🦉 the riddles
  function riddleCard() {
    const s = p26();
    const R = RIDDLES[s.riddles];
    if (!R) return;
    openCard(`<div class="card"><h3>🦉 The First Trial — the Riddle (${s.riddles + 1}/3)</h3>
      <div class="coins" style="font-style:italic;font-size:16px;line-height:1.5">Teacher Willow: “${R.q}”</div>
      <div class="msg" style="margin:6px 0">Sprig looks at you, chewing his whiskers. Whisper him the answer:</div>
      ${R.a.map((t, i) => `<div class="item"><span class="ic">${["🅰️", "🅱️", "©️"][i]}</span><span class="nm">“${t}”</span><button data-i="${i}">whisper</button></div>`).join("")}
      <div class="close">Esc — think about it a bit longer</div></div>`, (el) => el.querySelectorAll("button[data-i]").forEach((b) => (b.onclick = () => {
      const i = +b.dataset.i;
      closeCard();
      if (i !== R.right) return ctx.say(`🦉 Sprig: “Is it… ${R.a[i].toLowerCase()}?” Teacher Willow shakes her head kindly. “Think again, young one.” (Talk to her again — E)`, true);
      s.riddles++;
      save();
      redraw();
      chime();
      if (s.riddles < 3) return ctx.say(`🦉 Sprig: “${R.a[i]}!” — “Correct!” says Teacher Willow. (${s.riddles}/3) Talk to her again for the next riddle.`, true);
      ctx.say("🦉 “Three riddles, three right answers. The first trial is PASSED!” Sprig does a little hop. Now the Night Walk — find Headmaster Bramble by the school door.", true);
    })));
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 26 || p26().done || !outside()) return null;
    const s = p26();
    const W = npc("willow");
    const B = npc("bramble");
    if (s.riddles < 3 && W && near(W.x, W.z, 3)) return { label: "talk to Teacher Willow — the Riddle Trial 🦉", act: riddleCard };
    if (s.riddles >= 3 && !s.walkDone && s.walk === 0 && B && near(B.x, B.z, 3)) return { label: "begin the Night Walk 🌑 (no lantern!)", act: startWalk };
    // 🦊 the rescue
    if (s.walkDone && rockBuilt) {
      const K = rockBuilt;
      if (s.kit === 0 && near(K.R.x, K.R.z, 1.8) && me().y > K.top - 0.6) return { label: "scoop up the frightened fox kit 🦊", act: () => {
        s.kit = 1;
        save();
        redraw();
        chime();
        K.kit.visible = false;
        ctx.say("🦊 You tuck the shivering kit inside your cloak. Sprig, below, cheers. Now climb down CAREFULLY and bring it to its mother!", true);
      } };
      if (s.kit === 1 && near(K.mx, K.mz, 2.8)) return { label: "give the kit back to its mother 🦊", act: () => {
        s.kit = 2;
        save();
        redraw();
        chime();
        K.kit.visible = true;
        K.kit.position.set(K.mx + 0.9, ctx.terrainHeight(K.mx + 0.9, K.mz), K.mz + 0.4);
        ctx.say("🦊 The mother fox licks her kit from ears to tail — then bows her head to Sprig. The third trial is PASSED! Go back to Headmaster Bramble at the school door.", true);
      } };
    }
    if (s.kit >= 2 && B && near(B.x, B.z, 3.2)) return { label: "stand with Sprig before Headmaster Bramble 🌙", act: ceremony };
    return null;
  }

  function startWalk() {
    const s = p26();
    buildFlies();
    if (!flies || !flies.length) return ctx.say("🌑 (The fireflies aren't ready yet — try again in a moment.)");
    const B = npc("bramble");
    const y = ctx.terrainHeight(B.x, B.z);
    playCutscene([
      { dur: 4.4, from: [B.x + 3, y + 2, B.z + 3], look: [B.x, y + 1.2, B.z], who: "Headmaster Bramble", text: "“The second trial. A Moonkeeper must be able to find the way when every light has gone out. No lantern tonight, Sprig. Only the fireflies.”", run: () => ctx.setTime && ctx.setTime(0.93) },
      { dur: 3.8, from: [B.x + 3, y + 2, B.z + 3], look: [B.x, y + 1.2, B.z], who: "Sprig (in a very small voice)", text: "“It's so DARK… Thistle, you'll stay right beside me?”" },
      { dur: 0.4, gameCam: true, end: () => {
        s.walk = 1;
        save();
        redraw();
        ctx.say("🌑 Follow the fireflies, one cluster at a time — Sprig stays close behind you. Don't lose them in the dark!", true);
      } },
    ]);
  }

  function ceremony() {
    const s = p26();
    const B = npc("bramble");
    const y = ctx.terrainHeight(B.x, B.z);
    if (ctx.setTime) ctx.setTime(0.8); // (moonrise)
    playCutscene([
      { dur: 4.6, from: [B.x + 4, y + 2.2, B.z + 4], look: [B.x, y + 1.2, B.z], text: "The moon rises over the old Fallen Log School — the very place where your own story began. The whole school has come out to watch." },
      { dur: 4.8, from: [B.x + 3, y + 1.8, B.z + 3], look: [B.x, y + 1.2, B.z], who: "Headmaster Bramble", text: "“Sprig. You found the answers, you walked through the dark, and you were brave for someone smaller than you. Those are the three things that make a Moonkeeper. Kneel.”" },
      { dur: 4.6, from: [B.x + 3, y + 1.8, B.z + 3], look: [B.x, y + 1.2, B.z], text: "A cloak the colour of midnight, sewn with tiny silver stars, settles round Sprig's shoulders — and into his paws, a lantern of his very own. It lights by itself the moment he holds it." },
      { dur: 4.4, from: [B.x + 3, y + 1.8, B.z + 3], look: [B.x, y + 1.2, B.z], who: "Sprig (Moonkeeper Sprig!)", text: "“Thistle… I did it. WE did it. Thank you for never once letting go of my paw.”" },
      { dur: 4, black: true, gameCam: true, who: "🌙 PHASE 26 COMPLETE", text: "Sprig's Big Day\n🪙 600 · 🏅 The Trial of Three Medal\nSprig is a true Moonkeeper now!" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 600;
        (c.owned ||= {}).trialmedal = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌙 Moonkeeper Sprig! Look — he's wearing his starry cloak and carrying his own lantern now.", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t) {
    if (testAt) applyTest();
    if (st.phase === 25 && st.p25 && st.p25.done && !p26().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 26 || !p26().started || p26().done) {
      if (flies) flies.forEach((f) => (f.g.visible = false));
      return;
    }
    const s = p26();
    if (!outside()) return;
    // 🌑 the firefly trail: the next cluster glows bright, the one after it faintly
    if (s.walk > 0 && !s.walkDone) {
      buildFlies();
      if (!flies) return;
      const i = s.walk - 1;
      flies.forEach((f, k) => {
        f.g.visible = k === i || k === i + 1;
        const bright = k === i ? 1 : 0.35;
        f.g.children.forEach((c, j) => {
          c.material.opacity = bright * (j ? 0.6 + Math.sin((t || 0) * 6 + j + k) * 0.3 : 0.95);
          if (j) c.position.y = Math.sin((t || 0) * 2 + j * 1.7) * 0.5;
        });
      });
      const F = flies[i];
      if (F && near(F.pt.x, F.pt.z, 2.6)) {
        s.walk++;
        save();
        redraw();
        chime();
        if (s.walk > flies.length) {
          s.walkDone = true;
          save();
          redraw();
          flies.forEach((f) => (f.g.visible = false));
          buildRock();
          ctx.say("🌑 Back at the school door — and Sprig never let go of your paw once! The SECOND trial is passed. …But listen — a tiny yelp in the woods! A fox kit is stuck on top of a tall rock. Go and help it! (the third trial)", true);
        } else if (s.walk === 4) ctx.say("🦉 HOO-HOO! An owl swoops low over your heads — Sprig grabs your paw tight. “Keep going,” you whisper. “Follow the fireflies.”", true);
      }
    }
    if (s.walkDone) buildRock();
  }

  function panelHTML() {
    const s = p26();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = flies ? flies.length : 9;
    return `<h3>🌙 Sprig's Big Day</h3><ul>
      ${row(s.riddles >= 3, `🦉 The Riddle — answer Teacher Willow's riddles <span class="res">(${s.riddles}/3)</span><div class="sub">&nbsp;&nbsp;she's inside the Fallen Log School</div>`)}
      ${row(s.walkDone, `🌑 The Night Walk — follow the fireflies, no lantern${s.walk > 0 && !s.walkDone ? ` <span class="res">(${Math.min(s.walk - 1, n)}/${n})</span>` : ""}<div class="sub">&nbsp;&nbsp;Headmaster Bramble, by the school door</div>`)}
      ${row(s.kit >= 2, `🦊 The Brave Rescue — ${s.kit === 0 ? "hop up the stumps to the fox kit on the tall rock" : s.kit === 1 ? "carry the kit down to its mother" : "the kit is home!"}`)}
      ${row(s.done, "🌙 The ceremony — back to Headmaster Bramble")}
    </ul><div class="kit">🧑‍🎓 Sprig follows you through every trial</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p26().done };
}
