// ------------------------------------------------------------
//  🔎  PHASE 3 — "The Search Begins"
//
//  Willow's map scrap points north. But first: if you're going to search
//  the whole forest, you need a safe place to come back to. Home.
//
//    🏠 Go home to your den
//    🛠️ Make something for your home at the stump
//    📦 Store something in a wall hollow
//    🔥 Find the expedition's camp          (cold campfire + Fern's satchel)
//    🛒 Search the creek crossing          (Tinker's broken handcart + rope)
//    🧣 Something caught on a berry bush…   (Clover's scarf — she's alive!)
//    🌊 Reach the Great Falls               (Willow's journal: "the way in
//                                           is behind the water")
//
//  Each clue starts a line of pawprints toward the next; the minimap's
//  golden trail always leads on. Every find goes in the journal (J).
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { makePawTrail } from "./tracks.js";
import { glowTexture } from "./phase2.js";

const STEPS = [
  ["home", "Go home to your den"],
  ["craft", "Make something for your home at the stump (E)"],
  ["store", "Store something in a wall hollow (carry it in with G)"],
  ["camp", "Find the expedition's camp"],
  ["wagon", "Search the creek crossing"],
  ["scarf", "Something is caught on a berry bush…"],
  ["willow", "Reach the Great Falls"],
];

export function initPhase3(api) {
  const { ctx, st, save, chime, tone, redraw } = api;
  st.p3 ||= { started: false, done: {} };
  st.p2 ||= { started: true, done: {}, res: {}, journal: [] };
  const p3 = st.p3;
  const me = () => ctx.mouseRig.position;
  const dist2d = (a, x, z) => Math.hypot(a.x - x, a.z - z);
  const write = (text) => {
    st.p2.journal.push(text);
    save();
  };
  function complete(key, msg) {
    if (p3.done[key]) return;
    p3.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg);
    afterStep();
  }

  // ---------- where the clues lie: a line north toward the Great Falls ----------
  function pickPlaces() {
    const s = ctx.school();
    const O = (st.p2 && (st.p2.clueAt || st.p2.camp)) || { x: s.x, z: s.z - 40 };
    const F = ctx.falls;
    const len = Math.hypot(F.x, F.z);
    const ax = F.x / len;
    const az = F.z / len;
    // the pool's shore, off to the side of the falls (same spot the = key uses)
    const shore = { x: F.x - ax * 8 - az * 28, z: F.z - az * 8 + ax * 28 };
    const along = (k) => ({ x: O.x + (shore.x - O.x) * k, z: O.z + (shore.z - O.z) * k });
    const dry = (p) => {
      for (let i = 0; i < 40 && ctx.isWater(p.x, p.z); i++) p.x += 4;
      return p;
    };
    const camp = dry(along(0.28));
    // the creek ford: the first water on the way north — stop on the near bank
    let wagon = null;
    for (let k = 0.32; k < 0.9 && !wagon; k += 0.01) {
      const p = along(k);
      if (ctx.isWater(p.x, p.z)) {
        const b = along(k - 0.012);
        wagon = dry({ x: b.x, z: b.z });
      }
    }
    if (!wagon) wagon = dry(along(0.55));
    // Clover's scarf on the berry bush nearest the path, further on
    const want = along(0.72);
    let scarf = null;
    let bd = 220;
    for (const b of ctx.berrySpots()) {
      const d = Math.hypot(b.x - want.x, b.z - want.z);
      if (d < bd) { bd = d; scarf = { x: b.x + 2.6, z: b.z + 2.6, bush: true }; }
    }
    if (!scarf) scarf = dry(want);
    p3.places = { origin: O, camp, wagon, scarf: dry(scarf), willow: dry(shore) };
    save();
  }

  // ---------- the clue props ----------
  const props = {};
  const trails = [];
  const glint = () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2b0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(0.9);
    sp.position.y = 0.6;
    return sp;
  };
  const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true });
  function place(key) {
    if (props[key] || p3.done[key]) return;
    const at = p3.places[key];
    const g = new THREE.Group();
    g.position.set(at.x, ctx.terrainHeight(at.x, at.z), at.z);
    if (key === "camp") {
      // a cold campfire, two flattened bedrolls, and Fern's green satchel
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), mat(0x7a786e));
        r.position.set(Math.cos(a) * 0.42, 0.07, Math.sin(a) * 0.42);
        g.add(r);
      }
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.55, 5), mat(0x1e1814)); // charred
        s.rotation.z = Math.PI / 2;
        s.rotation.y = (i / 4) * Math.PI;
        s.position.y = 0.05;
        g.add(s);
      }
      const ash = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10).rotateX(-Math.PI / 2), mat(0x5a5650));
      ash.position.y = 0.02;
      g.add(ash);
      for (const [bx, bz, rot] of [[1.3, 0.6, 0.4], [-1.1, 1.0, -0.6]]) {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 7).rotateZ(Math.PI / 2), mat(0x8a6a4a));
        roll.position.set(bx, 0.16, bz);
        roll.rotation.y = rot;
        g.add(roll);
      }
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.22), mat(0x4f7a3a));
      bag.position.set(0.7, 0.13, -0.8);
      bag.rotation.y = 0.5;
      g.add(bag);
    } else if (key === "wagon") {
      // Tinker's little handcart, tipped, one wheel snapped off
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.9), mat(0x8a5a2e));
      body.position.y = 0.45;
      body.rotation.z = 0.25;
      g.add(body);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 5, 12), mat(0x5a3e24));
      wheel.position.set(0.55, 0.32, 0.5);
      g.add(wheel);
      const broken = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 5, 12), mat(0x5a3e24));
      broken.rotation.x = Math.PI / 2;
      broken.position.set(-1.2, 0.06, 0.9);
      g.add(broken);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4).rotateZ(Math.PI / 2), mat(0x6b4a2c));
      handle.position.set(1.2, 0.5, 0);
      g.add(handle);
      for (const [cx, cz] of [[-0.6, -0.9], [-1.0, -0.5]]) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.32), mat(0xa8844c));
        crate.position.set(cx, 0.14, cz);
        crate.rotation.y = cx;
        g.add(crate);
      }
      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 5, 12).rotateX(Math.PI / 2), mat(0xc9b06a));
      rope.position.set(0.1, 0.72, 0);
      g.add(rope);
    } else if (key === "scarf") {
      // Clover's knitted scarf, snagged and fluttering
      const scarf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 1.0, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0x8a5a68, flatShading: true, side: THREE.DoubleSide })
      );
      scarf.position.set(0, 0.85, 0);
      scarf.rotation.z = 0.5;
      g.add(scarf);
      g.userData.scarf = scarf;
      for (let i = 0; i < 4; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.05), new THREE.MeshBasicMaterial({ color: 0xe8d8c0, side: THREE.DoubleSide }));
        stripe.position.set(0, -0.35 + i * 0.22, 0.002);
        scarf.add(stripe);
      }
      if (!at.bush) {
        const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 5), mat(0x5a3e24));
        twig.position.y = 0.7;
        g.add(twig);
      }
    } else if (key === "willow") {
      // a flat rock by the pool, Willow's journal on it under a pebble
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.4, 8), mat(0x8a8880));
      rock.position.y = 0.2;
      g.add(rock);
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.32), mat(0x3f6fa8));
      book.position.set(0, 0.44, 0);
      book.rotation.y = 0.3;
      g.add(book);
      const pebble = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), mat(0x6a6860));
      pebble.position.set(0.05, 0.53, 0.03);
      g.add(pebble);
    }
    const sp = glint();
    g.add(sp);
    g.userData.glint = sp;
    ctx.outsideGroup.add(g);
    props[key] = g;
  }
  function removeProp(key) {
    if (props[key]) {
      // leave the scenery, take away the sparkle
      props[key].remove(props[key].userData.glint);
      props[key].userData.glint = null;
    }
  }
  // pawprints leading off from one clue toward the next (the first stretch)
  function tracksBetween(a, b) {
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const k = Math.min(1, 70 / L);
    trails.push(makePawTrail(ctx.outsideGroup, a, { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k }, ctx.terrainHeight));
  }

  // which clue is next, and set it out (+ its pawprints)
  const CLUES = ["camp", "wagon", "scarf", "willow"];
  function nextClue() {
    return CLUES.find((k) => !p3.done[k]) || null;
  }
  function afterStep() {
    if (!p3.done.store) return; // home first
    const k = nextClue();
    if (!k) return;
    place(k);
    const i = CLUES.indexOf(k);
    const from = i === 0 ? p3.places.origin : p3.places[CLUES[i - 1]];
    tracksBetween(from, p3.places[k]);
  }

  // ---------- start ----------
  function start() {
    if (!p3.places) pickPlaces();
    p3.started = true;
    save();
    redraw();
    write("Willow's map points north. But I can't search the whole forest from a pile of leaves — I need home. A safe place to come back to.");
    ctx.say("🏠 Before the search: go home to your den. The golden trail will lead you.");
  }

  // ---------- the finds ----------
  const look = (key, up = 0.3) => () => {
    const a = p3.places[key];
    return [a.x, ctx.terrainHeight(a.x, a.z) + up, a.z];
  };
  const cam = (key, ox, oy, oz) => () => {
    const a = p3.places[key];
    return [a.x + ox, ctx.terrainHeight(a.x, a.z) + oy, a.z + oz];
  };
  const meCam = () => [me().x - 1.5, me().y + 1.0, me().z - 1.2];
  const meLook = () => [me().x, me().y + 0.6, me().z];

  function searchCamp() {
    return playCutscene([
      { dur: 3.2, from: cam("camp", 3, 2.2, 3), to: cam("camp", 1.8, 1.4, 1.8), look: look("camp"),
        text: "A campfire — cold for a day or more. Bedrolls pressed flat in the grass." },
      { dur: 3, from: cam("camp", 1.6, 0.9, -1.2), look: look("camp", 0.1),
        text: "Teacher Fern's satchel! Inside, a page torn from her journal:" },
      { dur: 4.2, from: cam("camp", 1.6, 0.9, -1.2), look: look("camp", 0.1), who: "Teacher Fern",
        text: "“Night one. We found nine of us after the fox. Juniper has twisted a paw. Willow says we keep north — to the creek, then the falls.”" },
      { dur: 3, from: meCam, look: meLook, who: "Thistle", text: "Nine… not everyone. But most of them. They're together." ,
        end: () => {
          removeProp("camp");
          write("Found their camp! Teacher Fern's journal page: nine of them got away together. They went north — to the creek, then the falls.");
          complete("camp", "🐾 Pawprints lead on toward the creek…");
        } },
    ]);
  }
  function searchWagon() {
    return playCutscene([
      { dur: 3, from: cam("wagon", 3.2, 2, 2.4), to: cam("wagon", 2.2, 1.4, 1.6), look: look("wagon", 0.4),
        text: "Master Tinker's handcart — tipped over, one wheel snapped clean off." },
      { dur: 3.2, from: cam("wagon", -2, 2.6, 3), look: () => { const a = p3.places.wagon; const o = p3.places.origin; const L = Math.hypot(a.x - o.x, a.z - o.z) || 1; return [a.x + ((a.x - o.x) / L) * 10, ctx.terrainHeight(a.x, a.z), a.z + ((a.z - o.z) / L) * 10]; },
        text: "Pawprints in the mud, going down into the water… and out again on the far bank." },
      { dur: 3, from: cam("wagon", 1.2, 1.2, 0.9), look: look("wagon", 0.7),
        text: "Tucked under the seat: a coil of strong rope, and a note." },
      { dur: 4, from: cam("wagon", 1.2, 1.2, 0.9), look: look("wagon", 0.7), who: "Master Tinker",
        text: "“Left the cart — too heavy for the crossing. The rope's for whoever comes after us. Mind the current. — T.”" },
      { dur: 2.6, from: meCam, look: meLook, text: "🪢 You got Tinker's Rope!",
        end: () => {
          removeProp("wagon");
          p3.rope = true;
          write("Master Tinker's cart at the creek. He left his rope 'for whoever comes after.' That's me. They crossed here.");
          complete("wagon", "🪢 Tinker's Rope is in your pack. Cross the creek and keep following the tracks!");
        } },
    ]);
  }
  function searchScarf() {
    return playCutscene([
      { dur: 3, from: cam("scarf", 2.4, 1.6, 2), to: cam("scarf", 1.2, 1.1, 1.1), look: look("scarf", 0.8),
        text: "A little knitted scarf, snagged on the thorns…" },
      { dur: 2.6, from: meCam, look: meLook, who: "Thistle", text: "That's Clover's! She was here. She got this far!" },
      { dur: 3.6, from: cam("scarf", -2, 1.8, -2), look: look("scarf", 0),
        text: "Small pawprints lead away north — side by side with bigger ones. Somebody was looking after her." ,
        end: () => {
          removeProp("scarf");
          if (props.scarf && props.scarf.userData.scarf) props.scarf.remove(props.scarf.userData.scarf);
          p3.scarf = true;
          write("Clover's scarf, on a berry bush. Her prints go north beside a teacher's. She's alive. I'm keeping her scarf safe for her.");
          complete("scarf", "🧣 You tucked Clover's scarf in your pack. On to the Great Falls!");
        } },
    ]);
  }
  function searchWillow() {
    const F = ctx.falls;
    const fy = ctx.terrainHeight(F.x, F.z);
    return playCutscene([
      { dur: 4, from: cam("willow", 6, 6, 6), to: cam("willow", 3, 3.5, 3), lookFrom: look("willow"), lookTo: [F.x, fy + 30, F.z],
        text: "The Great Falls." },
      { dur: 3.2, from: cam("willow", 1.4, 1.4, 1.2), look: look("willow", 0.45),
        text: "On a flat rock by the pool: Teacher Willow's journal, weighed down with a pebble." },
      { dur: 5, from: cam("willow", 1.1, 1.2, 0.9), look: look("willow", 0.45), who: "Teacher Willow",
        text: "“We are going DOWN — into Moonstone Hollow. If anyone from the school finds this: the way in is behind the water. Don't follow alone. — W.”" },
      { dur: 3.6, from: meCam, look: meLook, who: "Thistle",
        text: "Behind the water… I'm not alone. I've got a lantern, a compass, a rope — and Clover's scarf to give back." },
      { dur: 4, from: cam("willow", 4, 5, 4), to: cam("willow", 2, 14, 2), lookFrom: look("willow"), lookTo: [F.x, fy + 40, F.z],
        who: "WhiskerWood", text: "Phase 3 · The Search Begins — complete." },
      { dur: 0.6, gameCam: true,
        end: () => {
          removeProp("willow");
          write("Willow's journal at the falls. They went DOWN, into Moonstone Hollow — 'the way in is behind the water.' I'm going after them.");
          complete("willow");
          st.phase = 4;
          save();
          redraw();
          if (api.onDone) setTimeout(api.onDone, 600); // → Phase 4: Exploring the Great Forest
        } },
    ]);
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase !== 3 || !p3.started || ctx.world() !== "outside") return null;
    const m = me();
    const k = nextClue();
    if (!k || !props[k]) return null;
    const a = p3.places[k];
    if (dist2d(m, a.x, a.z) > 2.6) return null;
    const label = { camp: "search the cold campfire", wagon: "search the handcart", scarf: "look at what's caught on the thorns", willow: "read the journal on the rock" }[k];
    const act = { camp: searchCamp, wagon: searchWagon, scarf: searchScarf, willow: searchWillow }[k];
    return { label, act };
  }

  // ---------- hooks ----------
  function onCraft() {
    if (st.phase === 3 && p3.started && p3.done.home && !p3.done.craft) {
      complete("craft", "🛠️ Something of your own, for your own home. Now carry it (G) into a wall hollow to store it.");
      write("Made something for the den. It already feels more like mine.");
    }
  }
  function onStore() {
    if (st.phase === 3 && p3.started && p3.done.home && !p3.done.store) {
      complete("store", "📦 Stored safe. Home is ready — now follow the trail north to find the expedition's camp!");
      write("Supplies stored. Home is ready. Now — north, after them.");
    }
  }

  // ---------- each frame ----------
  let restored = false;
  const devAt = new URLSearchParams(location.search).get("p3at");
  function update(dt, t) {
    if (st.phase < 3 || !ctx.school() || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      if (!p3.places) pickPlaces();
      if (devAt) {
        const i = STEPS.findIndex(([k]) => k === devAt);
        STEPS.slice(0, Math.max(0, i)).forEach(([k]) => (p3.done[k] = true));
        p3.started = true;
        if (ctx.world() !== "outside") ctx.goOutside();
        const prev = i > 3 ? p3.places[STEPS[i - 1][0]] : p3.places.origin;
        const tgt = p3.places[devAt] || prev;
        const L = Math.hypot(tgt.x - prev.x, tgt.z - prev.z) || 1;
        ctx.placePlayer(tgt.x - ((tgt.x - prev.x) / L) * 6, tgt.z - ((tgt.z - prev.z) / L) * 6, Math.atan2(tgt.x - prev.x, tgt.z - prev.z));
        save();
      }
      if (st.phase === 3) afterStep();
      redraw();
    }
    if (st.phase !== 3 || !p3.started) return;
    if (!p3.done.home && ctx.world() === "den") {
      complete("home", "🏠 Home. Small — but yours. Make something for it at the stump (E).");
      write("Home again. The den is just as I left it. It's going to be my base now.");
    }
    for (const g of Object.values(props)) {
      if (g.userData.glint) g.userData.glint.material.opacity = 0.3 + Math.sin(t * 4 + g.position.x) * 0.2;
      if (g.userData.scarf) g.userData.scarf.rotation.y = Math.sin(t * 2.3) * 0.35;
    }
  }

  // ---------- list + trail ----------
  function panelHTML() {
    const rows = [];
    for (const [k, label] of STEPS) {
      if (!p3.done.home && k !== "home") break;
      if (CLUES.includes(k) && !p3.done.store) break;
      const i = CLUES.indexOf(k);
      if (i > 0 && !p3.done[CLUES[i - 1]]) break; // one clue at a time
      rows.push(`<li class="${p3.done[k] ? "done" : ""}">${p3.done[k] ? "✔" : "○"} ${label}</li>`);
    }
    const kit = "🎒 📓 🔪 🏮 🧭" + (p3.rope ? " 🪢" : "") + (p3.scarf ? " 🧣" : "");
    return `<h3>🔎 The Search</h3><ul>${rows.join("")}</ul><div class="kit">Kit: ${kit} · J = journal</div>`;
  }
  function goal() {
    if (st.phase !== 3 || !p3.started) return null;
    if (!p3.done.home || !p3.done.craft || !p3.done.store) return ctx.world() === "outside" ? ctx.home : null;
    const k = nextClue();
    return k ? p3.places[k] : null;
  }

  return { start, update, interactable, goal, panelHTML, onCraft, onStore, get started() { return p3.started; } };
}
