// ------------------------------------------------------------
//  🌍  PHASE 7 — "Reconnecting the World"
//
//  Not survival. Not finding the teachers. Now your mission is to
//  RECONNECT the civilizations — you are the first traveler between the
//  cities in generations. Six chapters:
//
//   📮 1. The First Letters  — carry the expedition's letters to the school,
//                              and the Headmaster's reply down to Roothaven   (mail)
//   🪨 2. The Old Roads      — relight the four Moonkeeper stations            (old roads)
//   🧺 3. Trade              — surface goods for Roothaven; a Crystal Lamp
//                              for the school                                 (trade)
//   📚 4. Knowledge          — the Roothaven Atlas for the school's library,
//                              the school's Moonkeeper tales for the Archive  (academies)
//   🏡 5. Homecoming         — the expedition goes HOME to the Fallen Log
//                              School                                         (friendships)
//   🚪 6. The Sealed Door    — the crest-key opens the Moonkeepers' road
//                              beneath Everbough                              (the way on)
//
//  Places: the forest (minimap trail), Roothaven + the tunnels (golden
//  beacons). Everything is remembered in st.p7.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";

const CHAPTERS = [
  { key: "mail", icon: "📮", title: "The First Letters", steps: [
    ["letters", "Collect the expedition's letters (Teacher Willow, Roothaven)"],
    ["deliver", "Deliver them to Headmaster Bramble at the school"],
    ["reply", "Bring the Headmaster's reply to Root Speaker Oriel"],
  ] },
  { key: "roads", icon: "🪨", title: "The Old Roads", steps: [
    ["stations", "Relight the four Moonkeeper stations (1 Crystal Fragment + 1 Glowing Moss each)"],
  ] },
  { key: "trade", icon: "🧺", title: "Trade", steps: [
    ["trader", "Meet Trader Pell at Roothaven's docks"],
    ["goods", "Bring Pell 8 Berries, 4 Clover Seeds and 6 Pine Needles"],
    ["lamp", "Give the Crystal Lamp to Headmaster Bramble"],
  ] },
  { key: "know", icon: "📚", title: "Knowledge", steps: [
    ["atlas", "Borrow the Roothaven Atlas from Archivist Sable"],
    ["library", "Shelve it in the school's little library"],
    ["tales", "Bring 'Tales of the Moonkeepers' to the Archive"],
  ] },
  { key: "home", icon: "🏡", title: "Homecoming", steps: [
    ["ready", "Tell Teacher Willow it's time to go home"],
    ["homecoming", "Meet everyone back at the Fallen Log School"],
  ] },
  { key: "door", icon: "🚪", title: "The Sealed Door", steps: [
    ["key", "Receive the Moonkeeper crest-key from Root Speaker Oriel"],
    ["sealed", "Open the Sealed Door in the tunnels beneath Everbough"],
  ] },
];
const GOODS = [["Berries", 8], ["Clover Seeds", 4], ["Pine Needles", 6]];
const STATION_COST = [["Crystal Fragments", 1], ["Glowing Moss", 1]];

export function initPhase7(api) {
  const { ctx, st, save, chime, redraw, talkOutside } = api;
  st.p7 ||= { done: {}, stations: {} };
  st.rep ||= {};
  const p7 = st.p7;
  const RH = ctx.roothaven;
  const me = () => ctx.mouseRig.position;
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const addRep = (city, n) => {
    st.rep[city] = Math.min(5, (st.rep[city] || 0) + n);
    save();
    redraw();
    const name = city === "roothaven" ? "Roothaven" : "The Fallen Log School";
    ctx.say(`⭐ ${name} trusts you more! (${"★".repeat(st.rep[city])}${"☆".repeat(5 - st.rep[city])})`);
  };
  function complete(key, msg) {
    if (p7.done[key]) return;
    p7.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg, true);
  }
  const allSteps = CHAPTERS.flatMap((c) => c.steps.map(([k]) => k));
  /** the step you're on (chapters go in order) */
  const current = () => allSteps.find((k) => !p7.done[k]) || null;
  const chapterOf = (k) => CHAPTERS.find((c) => c.steps.some(([s]) => s === k));

  // ---------- people ----------
  const rhPerson = (key) => RH.people.find((p) => p.key === key);
  const schoolNpc = (key) => ctx.npcs.find((n) => n.key === key);
  // Trader Pell, at Roothaven's docks
  const pell = (() => {
    const x = RH.spots.pine.x + 20;
    const z = 44;
    const m = buildThistle({ tunicColor: 0x3a7a8a, hoodColor: 0x2a5a6a, pack: true });
    m.position.set(x, RH.height(x, z), z);
    m.rotation.y = Math.PI;
    m.userData.home = { x, z, face: Math.PI };
    RH.group.add(m);
    const p = { key: "pell", name: "Trader Pell", role: "trader", mesh: m, x, z };
    RH.people.push(p);
    return p;
  })();

  // talk in Roothaven (its own floor)
  function talkRH(p, lines, after) {
    const m = me();
    p.mesh.userData.lookAt = m;
    ctx.mouseRig.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
    const dx = m.x - p.x;
    const dz = m.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = [p.x, RH.height(p.x, p.z) + 0.65 * p.mesh.scale.x, p.z];
    const overMe = () => [m.x + ux * 1.6 - uz * 0.8, m.y + 1.1, m.z + uz * 1.6 + ux * 0.8];
    const overThem = () => [p.x - ux * 1.4 + uz * 0.8, head[1] + 0.4, p.z - uz * 1.4 - ux * 0.8];
    const shots = lines.map(([who, text]) => {
      const mine = who === "you";
      return { dur: 2.4, from: mine ? overThem : overMe, look: mine ? () => [m.x, m.y + 0.6, m.z] : head, who: mine ? "Thistle" : who || p.name, text };
    });
    shots[shots.length - 1].end = () => {
      p.mesh.userData.lookAt = null;
      if (after) after();
    };
    return playCutscene(shots);
  }
  // talk on the surface (the story's own talk, which knows the forest floor)
  const talkS = (n, lines, after) => talkOutside(n, lines.map(([w, t]) => [w === "you" ? "you" : "npc", t]), after);

  // ---------- the Moonkeeper stations (the Phase 4 standing stones) ----------
  const stationBeams = [];
  function buildStations() {
    if (stationBeams.length || !st.p4 || !st.p4.stonesAt) return;
    st.p4.stonesAt.forEach((at, i) => {
      const g = new THREE.Group();
      g.position.set(at.x, ctx.terrainHeight(at.x, at.z), at.z);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 2.6, 160, 12, 1, true),
        // fog: false — a relit station is seen from ANYWHERE in the forest
        new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
      );
      beam.position.y = 80;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9fd8ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      halo.scale.setScalar(5);
      halo.position.y = 4.2;
      g.add(beam, halo);
      g.visible = !!p7.stations[i];
      g.userData = { beam, halo };
      ctx.outsideGroup.add(g);
      stationBeams.push(g);
    });
  }

  // ---------- the Crystal Lamp at the school door ----------
  let schoolLamp = null;
  function placeSchoolLamp() {
    if (schoolLamp || !ctx.school()) return;
    const s = ctx.school();
    const x = s.x + ctx.spots.door[0] - 1;
    const z = s.z + ctx.spots.door[1] - 2.5;
    schoolLamp = new THREE.Group();
    schoolLamp.position.set(x, ctx.terrainHeight(x, z), z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x5a5650, flatShading: true }));
    post.position.y = 1.1;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0).scale(0.7, 1.4, 0.7), new THREE.MeshBasicMaterial({ color: 0xc4a8ff }));
    gem.position.y = 2.6;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xc4a8ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(2.4);
    glow.position.y = 2.6;
    const light = new THREE.PointLight(0xb89cf0, 10, 12, 1.6);
    light.position.y = 2.6;
    schoolLamp.add(post, gem, glow, light);
    ctx.outsideGroup.add(schoolLamp);
  }

  // ---------- the expedition comes home ----------
  const SEAT_DY = 0.84 + 0.07 - 0.24 * 0.82;
  const HOME_FACE = { willow: Math.PI / 2, fern: -Math.PI * 0.6, tinker: Math.PI / 2 };
  function schoolFolkHome() {
    for (const n of ctx.npcs) {
      if (n.key === "bramble") continue;
      const u = n.mesh.userData;
      n.mesh.visible = true;
      u.hx = n.x;
      u.hz = n.z;
      u.lookAt = null;
      if (n.role === "classmate") {
        u.sit = true;
        u.dy = SEAT_DY;
        u.face = -Math.PI / 2;
      } else {
        u.sit = false;
        u.dy = n.key === "willow" ? 0.42 : 0;
        u.face = HOME_FACE[n.key] || 0;
        if (u.legL) u.legL.rotation.x = u.legR.rotation.x = 0;
      }
    }
    for (const p of RH.expedition) p.mesh.visible = false; // they've gone home
  }
  function homecoming() {
    const s = ctx.school();
    const D = { x: s.x + ctx.spots.door[0], z: s.z + ctx.spots.door[1] };
    const y = ctx.terrainHeight(D.x, D.z);
    const bramble = schoolNpc("bramble");
    // everyone gathers by the east door first
    const folk = ctx.npcs.filter((n) => n.key !== "bramble");
    folk.forEach((n, i) => {
      const a = Math.PI * 0.2 + (i / folk.length) * Math.PI * 1.2;
      const u = n.mesh.userData;
      n.mesh.visible = true;
      u.sit = false;
      u.dy = 0;
      u.hx = D.x + 2 + Math.cos(a) * 5;
      u.hz = D.z + Math.sin(a) * 5;
      u.lookAt = bramble ? { x: bramble.x, z: bramble.z } : null;
      if (u.legL) u.legL.rotation.x = u.legR.rotation.x = 0;
    });
    ctx.placePlayer(D.x + 4, D.z - 3, Math.atan2(-4, 3));
    const head = bramble ? [bramble.x, y + 0.75, bramble.z] : [D.x, y + 0.75, D.z];
    return playCutscene([
      { dur: 4, from: [D.x + 26, y + 14, D.z + 18], to: [D.x + 12, y + 5, D.z + 9], look: [D.x, y + 1, D.z],
        text: "Up through the Hollow, down past the falls, across the meadow… the expedition came home." },
      { dur: 3.4, from: [head[0] + 2, head[1] + 0.3, head[2] + 2], look: head, who: "Headmaster Bramble",
        text: "Every one of you. EVERY ONE. Oh, I rang that bell every hour, you know. Every single hour." },
      { dur: 3.2, from: [D.x + 6, y + 2.2, D.z + 4], look: [D.x + 2, y + 0.6, D.z], who: "Clover",
        text: "Headmaster! There's a CITY under the forest! With bridges! And Thistle found us!" },
      { dur: 3.6, from: [head[0] + 2, head[1] + 0.3, head[2] + 2], look: head, who: "Headmaster Bramble",
        text: "So I've heard, from a certain mouse who's been carrying letters up and down the Moonkeepers' roads." },
      { dur: 3.6, from: [head[0] + 2, head[1] + 0.3, head[2] + 2], look: head, who: "Headmaster Bramble",
        text: "The school will never forget this, Thistle. Whatever you need — our doors, our books, our bell — they're yours." },
      { dur: 4, from: [D.x + 12, y + 6, D.z + 10], to: [D.x + 30, y + 22, D.z + 20], look: [D.x, y + 1, D.z],
        text: "That night, the Fallen Log School was louder and happier than it had been in a very long time." },
      { dur: 0.4, gameCam: true,
        end: () => {
          schoolFolkHome();
          complete("homecoming", "🏡 The expedition is home! The school is full again.");
          addRep("school", 3);
          write("The expedition came home to the Fallen Log School. Bramble cried. Clover told everyone about Roothaven nine times. The classroom is full again.");
        } },
    ]);
  }

  // ---------- the Sealed Door ----------
  function openSealed() {
    const T = ctx.tunnels;
    const D = T.spots.door;
    const [lx, ly, lz] = D.look;
    return playCutscene([
      { dur: 3, from: [D.x - Math.sin(D.face) * 1.5, 2.2, D.z - Math.cos(D.face) * 1.5], to: [D.x, 2.4, D.z], look: D.look,
        text: "You press Oriel's crest-key into the carving — a root wrapped round a crystal, a perfect fit." },
      { dur: 3.6, from: [D.x, 2.4, D.z], look: D.look, text: "STRENGTH BELOW. LIGHT WITHIN. The runes flare blue… and the great round door ROLLS aside.",
        update: (k) => {
          for (const m of D.meshes) {
            m.position.x = lx + Math.cos(D.face) * k * 5.5;
            m.position.z = lz - Math.sin(D.face) * k * 5.5;
          }
          D.passage.visible = true;
          const c = ctx.camera.position;
          c.x += (Math.random() - 0.5) * 0.05;
          c.y += (Math.random() - 0.5) * 0.05;
        } },
      { dur: 4, from: [D.x, 2.4, D.z], to: [lx - Math.sin(D.face) * 0.6, 2.6, lz - Math.cos(D.face) * 0.6], look: [lx + Math.sin(D.face) * 20, ly + 2, lz + Math.cos(D.face) * 20],
        text: "Beyond it, a Moonkeeper road runs on into the dark — little blue stations glowing along it, one after another…" },
      { dur: 3.6, from: () => [me().x - 1.5, me().y + 1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "One way leads down to Roothaven. And the other climbs UP… toward Everbough." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 7 · Reconnecting the World — complete." },
      { dur: 1, fadeIn: true, gameCam: true,
        end: () => {
          complete("sealed");
          p7.sealedOpen = true;
          st.phase = 8;
          write("I opened the Sealed Door! The Moonkeepers' road is open again — down to Roothaven, and up toward Everbough. The cities are starting to find each other.");
          save();
          redraw();
          ctx.say("🌳 Phase 7 complete! Phase 8 — follow the Moonkeepers' road up to Everbough!", true);
          if (api.onDone) setTimeout(api.onDone, 600);
        } },
    ]);
  }
  function applySealed() {
    const D = ctx.tunnels.spots.door;
    if (!p7.sealedOpen || !D.meshes) return;
    const [lx, , lz] = D.look;
    for (const m of D.meshes) {
      m.position.x = lx + Math.cos(D.face) * 5.5;
      m.position.z = lz - Math.sin(D.face) * 5.5;
    }
    D.passage.visible = true;
  }

  // ---------- what can be done here? ----------
  const near = (a, x, z, r) => Math.hypot(a.x - x, a.z - z) < r;
  function interactable() {
    if (st.phase !== 7 && !(st.phase > 7 && ctx.world() === "tunnels")) return null;
    const m = me();
    const step = current();
    const w = ctx.world();
    if (w === "roothaven") {
      const willow = RH.expedition.find((p) => p.key === "willow");
      const oriel = rhPerson("speaker");
      const sable = rhPerson("archivist");
      if (willow && willow.mesh.visible && near(m, willow.x, willow.z, 2.6)) {
        if (step === "letters") {
          return { label: "talk to Teacher Willow", act: () => talkRH(willow, [
            ["", "Thistle! We've been writing letters for days — to the Headmaster, to our families…"],
            ["", "But no surface mouse has carried a letter between the cities in a hundred years. Would you be the first?"],
            ["you", "I'll take them. All of them."],
            ["", "Then you're a Moonkeeper courier now — the first in generations. Off to the Headmaster with you!"],
          ], () => { complete("letters", "📨 The letters are in your pack. Take them to Headmaster Bramble at the school."); write("Willow gave me a whole bundle of letters for the school. I'm a courier on the Moonkeepers' roads now — the first in a hundred years."); }) };
        }
        if (step === "ready") {
          return { label: "talk to Teacher Willow", act: () => talkRH(willow, [
            ["you", "Teacher Willow… I think it's time. Everyone at school is waiting."],
            ["", "You're right. Roothaven has been wonderful — but the Fallen Log School is our home."],
            ["", "We'll go up through the Hollow, the way you came. Go on ahead and tell Bramble we're coming!"],
          ], () => {
            for (const p of RH.expedition) p.mesh.visible = false;
            complete("ready", "🏡 The expedition is heading home! Meet them at the Fallen Log School.");
          }) };
        }
      }
      if (oriel && near(m, oriel.x, oriel.z, 2.6)) {
        if (step === "reply") {
          return { label: `give ${oriel.name} the Headmaster's reply`, act: () => talkRH(oriel, [
            ["", "A letter… from the surface. For the Council of Roots."],
            ["", "“To our friends below: thank you for keeping our children safe. May the old roads open again. — Bramble, Fallen Log School.”"],
            ["", "The first letter between our peoples in a hundred years. The Moonkeepers' post lives again — because of you."],
          ], () => { complete("reply"); addRep("roothaven", 1); write("Delivered Bramble's reply to the Council of Roots. The first letter between the surface and Roothaven in a hundred years."); }) };
        }
        if (step === "key") {
          return { label: `talk to ${oriel.name}`, act: () => talkRH(oriel, [
            ["", "Letters, trade, books, stations relit, and our guests safely home. You have done what no mouse has done in generations."],
            ["", "Long ago, when the cities forgot one another, the Moonkeepers sealed their road with our crest. This key is its other half."],
            ["", "There is a door in the old tunnels beneath the great tree you call Everbough. Open it — and the road between the cities lives again."],
          ], () => { complete("key", "🗝️ The Moonkeeper crest-key! The Sealed Door is in the tunnels — through the hole between Everbough's roots."); write("Oriel gave me the Moonkeeper crest-key. The Sealed Door in the tunnels under Everbough — I'm going to open it."); }) };
        }
      }
      if (near(m, pell.x, pell.z, 2.6)) {
        if (step === "trader") {
          return { label: "talk to Trader Pell", act: () => talkRH(pell, [
            ["", "A SURFACE mouse! Do you know what we'd give for real sun-ripened berries down here? Or clover? Or pine needles that smell of the sky?"],
            ["", "Bring me 8 berries, 4 clover seeds and 6 pine needles — and I'll send up something your school has never seen."],
          ], () => complete("trader", "🧺 Gather 8 Berries, 4 Clover Seeds and 6 Pine Needles for Trader Pell.")) };
        }
        if (step === "goods") {
          const lacking = GOODS.filter(([it, n]) => ctx.packCount(it) < n);
          if (lacking.length) return { label: "talk to Trader Pell", act: () => talkRH(pell, [["", "Still need " + lacking.map(([it, n]) => `${n - ctx.packCount(it)} more ${it}`).join(", ") + ". The surface has plenty!"]]) };
          return { label: "trade with Trader Pell", act: () => {
            for (const [it, n] of GOODS) ctx.packTake(it, n);
            talkRH(pell, [
              ["", "Oh, smell those berries! You'll start a whole new market down here."],
              ["", "And for your school — a Crystal Lamp from the Crystal Quarter. It never goes out. Take it to your Headmaster."],
            ], () => { complete("goods", "🔮 A Crystal Lamp! Take it up to Headmaster Bramble."); addRep("roothaven", 1); write("The first trade between the surface and Roothaven! Berries, clover and pine needles for a Crystal Lamp that never goes out."); });
          } };
        }
      }
      if (sable && near(m, sable.x, sable.z, 2.6)) {
        if (step === "atlas") {
          return { label: `talk to ${sable.name}`, act: () => talkRH(sable, [
            ["", "A school library on the surface? With BOOKS? Then it ought to have ours."],
            ["", "Take the Roothaven Atlas — every road and river under the forest. And if your school has any Moonkeeper tales, I would dearly love to read them."],
          ], () => complete("atlas", "📘 The Roothaven Atlas. Shelve it in the school's little library.")) };
        }
        if (step === "tales") {
          return { label: `give ${sable.name} the school's book`, act: () => talkRH(sable, [
            ["", "“Tales of the Moonkeepers — a book for small mice.” Oh… oh, it's lovely. The surface remembered them too."],
            ["", "Two libraries, swapping books for the first time in a century. That is how cities find each other again, little one."],
          ], () => { complete("tales"); addRep("roothaven", 1); write("Sable has the school's Moonkeeper book now, and our library has the Roothaven Atlas. The two academies are talking again."); }) };
        }
      }
      return null;
    }
    if (w === "outside" && ctx.school()) {
      const bramble = schoolNpc("bramble");
      if (bramble && near(m, bramble.x, bramble.z, 2.6)) {
        if (step === "deliver") {
          return { label: "give Headmaster Bramble the letters", act: () => talkS(bramble, [
            ["npc", "Letters? From… from ROOTHAVEN? Willow's handwriting! And Clover's — oh, she's spelled 'safe' with three Fs."],
            ["npc", "They're ALIVE. All of them. Oh, Thistle…"],
            ["npc", "Wait right there. I'm writing back this very minute. Take this to whoever is in charge down there — with the whole school's thanks."],
          ], () => { complete("deliver", "📜 Bramble's reply. Carry it down to Root Speaker Oriel in Roothaven."); write("Gave Bramble the letters. He read every one twice. He wrote a reply to the Council of Roots."); }) };
        }
        if (step === "lamp") {
          return { label: "give Headmaster Bramble the Crystal Lamp", act: () => talkS(bramble, [
            ["npc", "A lamp made of… crystal? From under the forest? It's glowing all by itself!"],
            ["npc", "We'll hang it by the east door, so every mouse who comes to school sees that Roothaven is our friend."],
          ], () => { placeSchoolLamp(); p7.lamp = true; complete("lamp", "🔮 The Crystal Lamp glows by the school's east door."); addRep("school", 1); write("The Crystal Lamp hangs by the school door now. Trade between the cities — I started it!"); }) };
        }
      }
      if (step === "library") {
        const s = ctx.school();
        const bx = s.x + ctx.spots.bookcase[0];
        const bz = s.z + ctx.spots.bookcase[1];
        if (near(m, bx, bz, 2.4)) {
          return { label: "shelve the Roothaven Atlas", act: () => { ctx.bite(); complete("library", "📚 The Atlas is on the shelf. You borrow 'Tales of the Moonkeepers' for Archivist Sable."); write("The Roothaven Atlas is in our little library now. I'm taking 'Tales of the Moonkeepers' down to Sable."); } };
        }
      }
      if (step === "stations" && st.p4 && st.p4.stonesAt) {
        for (let i = 0; i < st.p4.stonesAt.length; i++) {
          if (p7.stations[i]) continue;
          const at = st.p4.stonesAt[i];
          if (!near(m, at.x, at.z, 3.2)) continue;
          const lacking = STATION_COST.filter(([it, n]) => ctx.packCount(it) < n);
          if (lacking.length) {
            return { label: "look at the Moonkeeper station", act: () => ctx.say(`🪨 The station's crescent is dark. It needs ${lacking.map(([it]) => it).join(" and ")} — from Moonstone Hollow.`, true) };
          }
          return { label: "relight the Moonkeeper station", act: () => {
            for (const [it, n] of STATION_COST) ctx.packTake(it, n);
            p7.stations[i] = true;
            if (stationBeams[i]) stationBeams[i].visible = true;
            chime();
            const n = Object.keys(p7.stations).length;
            if (n >= 4) {
              complete("stations", "🪨 All four Moonkeeper stations shine again! Travelers will see the old roads from anywhere.");
              addRep("roothaven", 1);
              write("All four Moonkeeper stations are lit again — four blue beams over the forest, marking the old roads between the cities.");
            } else {
              save();
              redraw();
              ctx.say(`🪨 The station blazes blue into the sky! (${n}/4)`);
            }
          } };
        }
      }
    }
    return null;
  }
  /** the Sealed Door, in the tunnels (main.js asks) */
  function sealedDoor() {
    if (p7.sealedOpen) {
      const road = api.road && api.road(); // Phase 8: the road up to Everbough
      if (road) return road;
      return { label: "look down the Moonkeepers' road", act: () => ctx.say("🌳 The road climbs on toward Everbough…", true) };
    }
    if (st.phase === 7 && current() === "sealed") return { label: "fit the crest-key into the door", act: openSealed };
    return null;
  }

  // ---------- where to go next ----------
  function target() {
    const s = ctx.school();
    const step = current();
    if (!step || st.phase !== 7) return null;
    const rh = (x, z) => ({ x, z, world: "roothaven" });
    const out = (x, z) => ({ x, z, world: "outside" });
    const willow = RH.expedition.find((p) => p.key === "willow");
    const bramble = schoolNpc("bramble");
    switch (step) {
      case "letters": case "ready": return rh(willow.x, willow.z);
      case "deliver": case "lamp": return bramble ? out(bramble.x, bramble.z) : null;
      case "reply": case "key": return rh(RH.spots.hall.x, RH.spots.hall.z);
      case "trader": case "goods": {
        const lacking = GOODS.find(([it, n]) => ctx.packCount(it) < n);
        if (step === "goods" && lacking) return null; // go gather (the recipe book's 📍 can help)
        return rh(pell.x, pell.z);
      }
      case "atlas": case "tales": return rh(RH.spots.archive.x, RH.spots.archive.z);
      case "library": return s ? out(s.x + ctx.spots.bookcase[0], s.z + ctx.spots.bookcase[1]) : null;
      case "homecoming": return s ? out(s.x + ctx.spots.door[0], s.z + ctx.spots.door[1]) : null;
      case "stations": {
        const lacking = STATION_COST.some(([it, n]) => ctx.packCount(it) < n);
        if (lacking) return out(ctx.hollowDoor.outside.x, ctx.hollowDoor.outside.z); // crystal + glowing moss: the Hollow
        let best = null;
        let bd = Infinity;
        (st.p4.stonesAt || []).forEach((at, i) => {
          if (p7.stations[i]) return;
          const d = Math.hypot(at.x - me().x, at.z - me().z);
          if (d < bd) { bd = d; best = at; }
        });
        return best ? out(best.x, best.z) : null;
      }
      case "sealed": return { ...ctx.tunnels.spots.door, world: "tunnels" };
    }
    return null;
  }
  /** for the minimap (outside): the way to the next thing, wherever it is */
  function goal() {
    const t = target();
    if (!t || ctx.world() !== "outside") return null;
    if (t.world === "outside") return t;
    if (t.world === "roothaven") {
      // into the Hollow first, then the stairs behind the Moon Door
      return ctx.isHollow(me().x, me().z) ? ctx.moonDoor.stairs : ctx.hollowDoor.outside;
    }
    if (t.world === "tunnels") return { x: ctx.hole.x, z: ctx.hole.z };
    return null;
  }

  // golden beacons underground (Roothaven + tunnels)
  const mkBeacon = (parent) => {
    const b = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc860, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(4);
    halo.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 30, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 15;
    b.add(halo, beam);
    b.userData = { halo, beam };
    b.visible = false;
    parent.add(b);
    return b;
  };
  const beaconRH = mkBeacon(RH.group);
  const beaconT = mkBeacon(ctx.tunnels.group);

  // ---------- each frame ----------
  let restored = false;
  const devAt = new URLSearchParams(location.search).get("p7at");
  function update(dt, t) {
    if (st.phase < 7 || !ctx.school() || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      if (devAt) {
        // test hook: ?story=p7&p7at=<step> — everything before it is done
        const i = allSteps.indexOf(devAt);
        allSteps.slice(0, Math.max(0, i)).forEach((k) => (p7.done[k] = true));
        if (p7.done.stations) for (let s = 0; s < 4; s++) p7.stations[s] = true;
        if (p7.done.lamp) p7.lamp = true;
        save();
      }
      buildStations();
      if (new URLSearchParams(location.search).get("stationcam") && st.p4 && st.p4.stonesAt) {
        // test view: look at station 1 from far away
        const at = st.p4.stonesAt[0];
        window.__devCam = [at.x + 160, ctx.terrainHeight(at.x, at.z) + 60, at.z + 160];
        window.__devLook = [at.x, ctx.terrainHeight(at.x, at.z) + 30, at.z];
      }
      if (p7.lamp) placeSchoolLamp();
      if (p7.done.homecoming) schoolFolkHome();
      else if (p7.done.ready) for (const p of RH.expedition) p.mesh.visible = false;
      applySealed();
      redraw();
    }
    for (const g of stationBeams) {
      if (!g.visible) continue;
      g.userData.beam.material.opacity = 0.26 + Math.sin(t * 1.4 + g.position.x) * 0.08;
    }
    // underground beacons
    const tg = st.phase === 7 ? target() : null;
    const w = ctx.world();
    beaconRH.visible = false;
    beaconT.visible = false;
    if (tg) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      const show = (b, x, z, y) => {
        b.visible = true;
        b.position.set(x, y, z);
        b.userData.halo.material.opacity = 0.55 + pulse * 0.4;
        b.userData.beam.material.opacity = 0.18 + pulse * 0.16;
      };
      if (w === "roothaven") {
        if (tg.world === "roothaven") show(beaconRH, tg.x, tg.z, RH.height(tg.x, tg.z));
        else show(beaconRH, RH.spots.stairsUp.x, RH.spots.stairsUp.z, 0); // the way back up
      } else if (w === "tunnels") {
        if (tg.world === "tunnels") show(beaconT, tg.x, tg.z, 0);
        else show(beaconT, ctx.tunnels.spots.ladder.x, ctx.tunnels.spots.ladder.z, 0);
      }
    }
    if (st.phase !== 7) return;
    // the homecoming starts as you reach the school
    if (current() === "homecoming" && w === "outside" && !ctx.playing()) {
      const s = ctx.school();
      const D = { x: s.x + ctx.spots.door[0], z: s.z + ctx.spots.door[1] };
      if (Math.hypot(me().x - D.x, me().z - D.z) < 22) homecoming();
    }
  }

  // ---------- the list ----------
  function panelHTML() {
    const step = current();
    const rows = [];
    for (const c of CHAPTERS) {
      const doneAll = c.steps.every(([k]) => p7.done[k]);
      const isCur = c.steps.some(([k]) => k === step);
      if (doneAll) rows.push(`<li class="done">✔ ${c.icon} ${c.title}</li>`);
      else if (isCur) {
        rows.push(`<li class="next">${c.icon} ${c.title}</li>`);
        for (const [k, label] of c.steps) {
          let text = label;
          if (k === "stations") text += ` (${Object.keys(p7.stations).length}/4)`;
          if (k === "goods") text += "<br><span class='res'>" + GOODS.map(([it, n]) => `${it} ${Math.min(n, ctx.packCount(it))}/${n}`).join(" · ") + "</span>";
          if (k === "stations") text += "<br><span class='res'>" + STATION_COST.map(([it]) => `${it}: ${ctx.packCount(it)}`).join(" · ") + "</span>";
          rows.push(`<li class="sub ${p7.done[k] ? "done" : ""}">${p7.done[k] ? "✔" : "○"} ${text}</li>`);
        }
      } else rows.push(`<li class="sub">○ ${c.icon} ${c.title}</li>`);
    }
    const kit = [];
    if (p7.done.letters && !p7.done.deliver) kit.push("📨 letters");
    if (p7.done.deliver && !p7.done.reply) kit.push("📜 reply");
    if (p7.done.goods && !p7.done.lamp) kit.push("🔮 lamp");
    if (p7.done.atlas && !p7.done.library) kit.push("📘 atlas");
    if (p7.done.library && !p7.done.tales) kit.push("📖 tales");
    if (p7.done.key && !p7.done.sealed) kit.push("🗝️ crest-key");
    const rep = (k) => "★".repeat(st.rep[k] || 0) + "☆".repeat(5 - (st.rep[k] || 0));
    return `<h3>🌍 Reconnecting the World</h3><ul>${rows.join("")}</ul><div class="kit">${kit.length ? "Carrying: " + kit.join(" · ") + "<br>" : ""}Roothaven ${rep("roothaven")}<br>Fallen Log School ${rep("school")}</div>`;
  }

  return {
    update,
    interactable,
    sealedDoor,
    goal,
    panelHTML,
    start: () => redraw(),
  };
}
