// ------------------------------------------------------------
//  🌙  PHASE 5 — "Moonstone Hollow"
//
//  You finally found it. Huge. Ancient. Silent. Nobody has been in here
//  for centuries — nobody except the expedition, a few days ago.
//
//    📖 Read the old journal on the reading rock
//    🐾 Find the expedition's marks (3): Willow's chalk arrow, Tinker's
//       dropped hammer, Juniper's bandage
//    🌸 Gather 3 Moon Petals (they only grow here)
//    🔆 Wake the three rune pillars with your Glow Lantern
//    🚪 Offer moonlight at the Moon Door — it opens… and you DESCEND.
//
//  Everything here is placed in the falls' local frame (lx across,
//  z into the cliffs) — the Hollow's floor is z ≈ 82…120.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { crescentGeometry } from "./phase4.js";

const MARKS = [
  { key: "chalk", at: [9.6, 100], label: "look at the chalk marks", who: "Teacher Willow (in chalk)",
    text: "An arrow, chalked on the stone, pointing at the great carved door — and the words: “Through here. Wait for the light.”",
    journal: "Willow's chalk arrow in the Hollow, pointing at a huge carved door: 'Through here. Wait for the light.'" },
  { key: "hammer", at: [-2.8, 109.5], label: "pick up the little hammer", who: null,
    text: "Master Tinker's pebble hammer, dropped by the inner falls. Its handle is worn smooth where his paw always holds it.",
    journal: "Found Master Tinker's hammer by the inner falls. He'd never leave it on purpose. They were in a hurry." },
  { key: "bandage", at: [3.6, 90.4], label: "look at the scrap of cloth", who: null,
    text: "A strip of bandage, neatly tied and then untied. Juniper's twisted paw — someone took good care of it.",
    journal: "Juniper's bandage by the pool. Someone looked after her paw. They stopped here to rest." },
];
const PILLARS = [[-2.6, 103.2], [6.6, 104.6], [6.8, 88.6]]; // all clear of the brook
const STEPS = [
  ["read", "Read the old journal on the reading rock"],
  ["marks", "Find the expedition's marks"],
  ["petals", "Gather 3 Moon Petals"],
  ["runes", "Wake the three rune pillars (your Glow Lantern)"],
  ["door", "Offer moonlight at the Moon Door"],
];

export function initPhase5(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p5 ||= { started: false, done: {}, marks: {}, runes: {} };
  const p5 = st.p5;
  const me = () => ctx.mouseRig.position;
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const W = (lx, z) => {
    const w = ctx.fallsToWorld(lx, z);
    return { x: w.x, z: w.z, y: ctx.terrainHeight(w.x, w.z) };
  };
  function complete(key, msg) {
    if (p5.done[key]) return;
    p5.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg);
  }

  // ---------- props ----------
  const props = { marks: [], pillars: [] };
  const faceInward = (lx) => Math.atan2(ctx.fallsToWorld(0, 100).x - ctx.fallsToWorld(lx, 100).x, ctx.fallsToWorld(0, 100).z - ctx.fallsToWorld(lx, 100).z);
  const glint = (color = 0xfff2b0) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(1.1);
    sp.position.y = 0.7;
    return sp;
  };
  // ✨ an expedition sign must be EASY to spot: a warm halo, a soft beam of
  // light rising into the dark, and a little lamp so it lights its spot
  const beacon = () => {
    const b = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc860, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(2.6);
    halo.position.y = 0.6;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.45, 9, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 4.8;
    const lamp = new THREE.PointLight(0xffc060, 6, 7, 1.6);
    lamp.position.y = 1.2;
    b.add(halo, beam, lamp);
    b.userData = { halo, beam };
    return b;
  };
  function build() {
    if (props.built) return;
    props.built = true;
    const stone = new THREE.MeshStandardMaterial({ color: 0x5a6070, flatShading: true });
    const chalk = new THREE.MeshBasicMaterial({ color: 0xf4f4ea, side: THREE.DoubleSide });
    for (const m of MARKS) {
      const at = W(...m.at);
      const g = new THREE.Group();
      g.position.set(at.x, at.y, at.z);
      if (m.key === "chalk") {
        // a flat-faced stone with a chalked arrow
        const rock = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.8), stone);
        rock.position.y = 0.8;
        if (ctx.addSolid) ctx.addSolid(at.x, at.z, 0.9); // (solid stone)
        g.add(rock);
        const arrow = new THREE.Shape();
        arrow.moveTo(-0.5, 0.1); arrow.lineTo(0.15, 0.1); arrow.lineTo(0.15, 0.32); arrow.lineTo(0.55, 0);
        arrow.lineTo(0.15, -0.32); arrow.lineTo(0.15, -0.1); arrow.lineTo(-0.5, -0.1); arrow.closePath();
        const am = new THREE.Mesh(new THREE.ShapeGeometry(arrow), chalk);
        am.position.set(0, 0.95, 0.41);
        g.add(am);
        g.rotation.y = faceInward(m.at[0]) + Math.PI; // its face looks into the Hollow
      } else if (m.key === "hammer") {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.7, 5), new THREE.MeshStandardMaterial({ color: 0x8a5a2e, emissive: 0x6a3a10, emissiveIntensity: 0.8 }));
        handle.rotation.z = Math.PI / 2;
        handle.position.y = 0.05;
        const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0xb8b4a8, emissive: 0x6a6658, emissiveIntensity: 0.7, flatShading: true }));
        head.position.set(0.38, 0.12, 0);
        g.add(handle, head);
      } else {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff8e8, side: THREE.DoubleSide }));
        strip.position.y = 0.03;
        strip.rotation.y = 0.6;
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), new THREE.MeshBasicMaterial({ color: 0xfff8e8 }));
        knot.position.set(0.25, 0.05, 0.1);
        g.add(strip, knot);
      }
      const sp = beacon();
      g.add(sp);
      g.userData = { key: m.key, sp };
      ctx.outsideGroup.add(g);
      props.marks.push(g);
      if (p5.marks[m.key]) sp.visible = false;
    }
    // the rune pillars: short stone columns with a crescent carved on top
    const moonGeo = crescentGeometry(0.34, 0.2);
    PILLARS.forEach(([lx, z], i) => {
      const at = W(lx, z);
      const g = new THREE.Group();
      g.position.set(at.x, at.y - 0.3, at.z);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 2.6, 7), stone);
      col.position.y = 1.3;
      g.add(col);
      const rune = new THREE.MeshBasicMaterial({ color: 0x3a4860, side: THREE.DoubleSide });
      for (const a of [0, Math.PI * 0.66, Math.PI * 1.33]) {
        const moon = new THREE.Mesh(moonGeo, rune);
        moon.position.set(Math.sin(a) * 0.56, 1.9, Math.cos(a) * 0.56);
        moon.rotation.y = a;
        g.add(moon);
      }
      const glow = glint(0x9fd8ff);
      glow.position.y = 2.9;
      glow.scale.setScalar(2.2);
      g.add(glow);
      g.userData = { i, rune, glow };
      ctx.outsideGroup.add(g);
      if (ctx.addSolid) ctx.addSolid(at.x, at.z, 0.75); // you can't walk through a pillar
      props.pillars.push(g);
      setPillar(i, !!p5.runes[i]);
    });
    if (p5.doorOpen) sinkDoor(1);
  }
  function setPillar(i, awake) {
    const g = props.pillars[i];
    if (!g) return;
    g.userData.rune.color.set(awake ? 0xbfe6ff : 0x3a4860);
    g.userData.glow.visible = awake;
  }
  let doorBase = null;
  function sinkDoor(k) {
    const D = ctx.moonDoor;
    if (!D.ready) return;
    if (!doorBase) doorBase = D.parts.map((p) => p.position.y);
    D.parts.forEach((p, i) => (p.position.y = doorBase[i] - k * 9.6));
    if (k > 0.3 && D.stairwell) D.stairwell.visible = true; // the stair opens up
    if (k >= 1) {
      for (const c of D.colliders) c.r = 0; // walk right through where it stood
      D.parts.forEach((p) => (p.visible = false));
    }
  }

  // ---------- start ----------
  function start() {
    p5.started = true;
    save();
    build();
    redraw();
    write("Moonstone Hollow. Glowing crystals, silver petals, silence. Huge. Ancient. Nobody has been here in centuries — nobody but the expedition.");
    ctx.say("🌙 Phase 5 — Moonstone Hollow. Look around… the expedition left signs.", true);
  }

  // ---------- the door opens: the descent ----------
  function openDoor() {
    const D = ctx.moonDoor;
    const at = W(0, 105.4);
    const door = W(0, 113);
    const stairs = W(0, 116);
    ctx.packTake("Moon Petals", 3);
    return playCutscene([
      { dur: 3, from: [at.x, at.y + 2.4, at.z], look: [door.x, door.y + 5.5, door.z],
        text: "You lay three moon petals in the carved crescent…",
        update: (k) => (D.moonMat.emissiveIntensity = 2 + k * 6) },
      { dur: 4, from: [at.x, at.y + 2.4, at.z], to: [at.x, at.y + 3, at.z], look: [door.x, door.y + 4, door.z],
        text: "…and with a long, grinding sigh, the Moon Door sinks into the floor.",
        update: (k) => {
          sinkDoor(k);
          const c = ctx.camera.position;
          c.x += (Math.random() - 0.5) * 0.06;
          c.y += (Math.random() - 0.5) * 0.06;
        },
        end: () => sinkDoor(1) },
      { dur: 3.6, from: [door.x, door.y + 2.6, door.z], to: [stairs.x, stairs.y + 1.6, stairs.z], look: [stairs.x, stairs.y - 3, stairs.z],
        text: "Worn steps spiral down into the dark. Cold air rises from below — and the sound of water, far, far down." },
      { dur: 3, from: () => [me().x - 1.5, me().y + 1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "Willow… Clover… everyone. I'm coming." },
      { dur: 1.4, fadeOut: true, from: [stairs.x, stairs.y + 1.6, stairs.z], look: [stairs.x, stairs.y - 3, stairs.z] },
      { dur: 3, black: true, gameCam: true, text: "You descend." },
      { dur: 3.2, black: true, gameCam: true, text: "Down, and down, and down — past roots older than any tree you've ever seen…" },
      { dur: 3.6, black: true, gameCam: true, text: "…until, far below, warm golden lights flicker in the dark. And voices." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 5 · Moonstone Hollow — complete." },
      { dur: 1.4, fadeIn: true, gameCam: true,
        run: () => {
          p5.doorOpen = true;
          p5.done.door = true;
          st.phase = 6;
          write("The Moon Door opened. I went down the stairs as far as I dared. Far below there were lights. And VOICES. Mouse voices.");
          save();
          redraw();
          const back = W(0, 105.4);
          ctx.placePlayer(back.x, back.z, ctx.hollowDoor.intoHollow);
        },
        end: () => {
          ctx.say("🪨 Phase 5 complete! Take the stairs behind the Moon Door down to Roothaven.", true);
          if (api.onDone) setTimeout(api.onDone, 600);
        } },
    ]);
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase < 5 || !p5.started || ctx.world() !== "outside") return null;
    const m = me();
    for (const g of props.marks) {
      const key = g.userData.key;
      if (p5.marks[key]) continue;
      if (Math.hypot(m.x - g.position.x, m.z - g.position.z) < 2.4) {
        const mk = MARKS.find((x) => x.key === key);
        return {
          label: mk.label,
          act: () =>
            playCutscene([
              { dur: 3.4, from: [g.position.x + 1.8, g.position.y + 1.6, g.position.z + 1.8], look: [g.position.x, g.position.y + 0.4, g.position.z],
                who: mk.who, text: mk.text,
                end: () => {
                  p5.marks[key] = true;
                  g.userData.sp.visible = false;
                  write(mk.journal);
                  const n = Object.keys(p5.marks).length;
                  if (n >= 3) complete("marks", "🐾 All three marks. They came through here — and went through that door.");
                  else {
                    save();
                    redraw();
                    ctx.say(`🐾 A sign of the expedition! (${n}/3)`);
                  }
                } },
            ]),
        };
      }
    }
    for (const g of props.pillars) {
      const i = g.userData.i;
      if (p5.runes[i]) continue;
      if (Math.hypot(m.x - g.position.x, m.z - g.position.z) < 3.2) {
        return {
          label: "hold your lantern to the runes",
          act: () => {
            // any lantern wakes them — the crafted Glow Lantern, or the one
            // Thistle built at school (it hangs on her belt)
            if (!ctx.has("lantern") && !(st.done && st.done.craft)) return ctx.say("🌑 The runes stay dark. They want a lantern's light.");
            p5.runes[i] = true;
            setPillar(i, true);
            chime();
            const n = Object.keys(p5.runes).length;
            if (n >= 3) complete("runes", "🔆 All three pillars glow! The Moon Door's crescent is shining…");
            else {
              save();
              redraw();
              ctx.say(`🔆 The runes drink in the light and glow. (${n}/3)`);
            }
          },
        };
      }
    }
    const D = ctx.moonDoor;
    if (D.ready && !p5.doorOpen && Math.hypot(m.x - D.at.x, m.z - D.at.z) < 3.4) {
      if (!p5.done.runes) return { label: "look at the Moon Door", act: () => ctx.say("🚪 A great carved door with a crescent moon. Three dark rune pillars stand around it…") };
      if (ctx.packCount("Moon Petals") < 3) return { label: "look at the Moon Door", act: () => ctx.say(`🌸 The crescent has a little hollow, like a cupped paw. Moonlight… Moon Petals? (${ctx.packCount("Moon Petals")}/3)`) };
      return { label: "lay three Moon Petals in the crescent", act: openDoor };
    }
    return null;
  }

  // ---------- hooks ----------
  function onReadPip() {
    if (st.phase === 5 && p5.started && !p5.done.read) {
      complete("read", "📖 Someone else found the Hollow, long ago…");
      write("An old, old journal on the reading rock, by a mouse called Pip. Someone found this place long before us.");
    }
  }

  // ---------- each frame ----------
  let restored = false;
  const devAt = new URLSearchParams(location.search).get("p5at");
  function update(dt, t) {
    if (st.phase < 5 || !ctx.school() || !ctx.quadMouse() || !ctx.moonDoor.ready) return;
    if (!restored) {
      restored = true;
      build();
      if (devAt) {
        if (ctx.world() !== "outside") ctx.goOutside();
        if (devAt === "door") {
          p5.done = { read: 1, marks: 1, petals: 1 };
          for (const m of MARKS) p5.marks[m.key] = true;
          ctx.packTake("Moon Petals", 0);
          ctx.addToPack("Moon Petals", 3);
          const at = W(0, 105.4);
          ctx.placePlayer(at.x, at.z, ctx.hollowDoor.intoHollow);
        } else {
          const D = ctx.hollowDoor;
          ctx.placePlayer(D.insideStand.x, D.insideStand.z, D.intoHollow);
        }
        p5.started = true;
        save();
      }
      redraw();
    }
    for (const g of props.marks) {
      const b = g.userData.sp.userData;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + g.position.x);
      b.halo.material.opacity = 0.6 + pulse * 0.35;
      b.halo.scale.setScalar(2.3 + pulse * 0.8);
      b.beam.material.opacity = 0.22 + pulse * 0.18;
    }
    if (st.phase !== 5 || !p5.started) return;
    if (!p5.done.petals && ctx.packCount("Moon Petals") >= 3) complete("petals", "🌸 Three moon petals, cool and shining.");
  }

  // ---------- list + trail ----------
  function panelHTML() {
    const row = (k, text) => `<li class="${p5.done[k] ? "done" : ""}">${p5.done[k] ? "✔" : "○"} ${text}</li>`;
    const nM = Object.keys(p5.marks).length;
    const nR = Object.keys(p5.runes).length;
    const rows = [
      row("read", STEPS[0][1]),
      row("marks", `${STEPS[1][1]} (${nM}/3)`),
      row("petals", `${STEPS[2][1]} (${Math.min(3, ctx.packCount("Moon Petals"))}/3)`),
      row("runes", `${STEPS[3][1]} (${nR}/3)`),
      row("door", STEPS[4][1]),
    ];
    return `<h3>🌙 Moonstone Hollow</h3><ul>${rows.join("")}</ul>`;
  }
  function goal() {
    if (st.phase !== 5 || !p5.started) return null;
    const m = me();
    const nearest = (list) => {
      let best = null;
      let bd = Infinity;
      for (const g of list) {
        const d = Math.hypot(g.position.x - m.x, g.position.z - m.z);
        if (d < bd) { bd = d; best = { x: g.position.x, z: g.position.z }; }
      }
      return best;
    };
    if (!p5.done.read) return { x: ctx.journalPos.x, z: ctx.journalPos.z };
    if (!p5.done.marks) return nearest(props.marks.filter((g) => !p5.marks[g.userData.key]));
    if (!p5.done.runes) return nearest(props.pillars.filter((g) => !p5.runes[g.userData.i]));
    if (!p5.done.door && p5.done.petals) return ctx.moonDoor.at;
    return null;
  }

  return { start, update, interactable, goal, panelHTML, onReadPip, get started() { return p5.started; } };
}
