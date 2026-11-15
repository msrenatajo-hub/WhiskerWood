// ------------------------------------------------------------
//  🌳  PHASE 8 — "Everbough"
//
//  The legendary City of Knowledge, high in the branches of five great
//  trees. The largest city. The Grand Library. The Royal Academy. Guilds,
//  politics, festivals — and dozens of mice who have never met a traveler.
//
//   🛤️ 1. The Moonkeepers' Road — from the Sealed Door, up to Everbough
//   📚 2. The Grand Library     — Head Librarian Quill
//   🎓 3. The Royal Academy     — three classes, any order:
//          🌿 Botany (Professor Thyme): find 3 rare plants around the city
//          🔭 Cartography (Professor Vane): climb to the Highcanopy telescope
//          🛠️ Architecture (Master Joist): mend 3 broken railings at Millroot
//   🧭 4. The Explorers' Guild   — mark Roothaven on the Guild's great map
//   🏛️ 5. The Council of Branches — win over 3 citizens, then the vote
//   🏮 6. Lantern Night          — light the plaza; an envoy arrives…
//
//  Everbough Reputation: st.rep.everbough. A golden beacon shows the way.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";

const STEPS = [
  ["road", "🛤️", "Follow the Moonkeepers' road from the Sealed Door"],
  ["library", "📚", "Present yourself at the Grand Library"],
  ["academy", "🎓", "Take three classes at the Royal Academy"],
  ["guild", "🧭", "Join the Explorers' Guild"],
  ["council", "🏛️", "Win over the Council of Branches"],
  ["festival", "🏮", "Lantern Night"],
];
// where everything is (city coordinates — see buildEverbough in main.js)
const P = {
  arrive: { x: 8, z: 58 }, // just south of the Market Circle (dry ground)
  quill: { x: 0, z: -40 },
  thyme: { x: -82, z: 24 },
  herbs: [{ x: -66, z: 34 }, { x: -46, z: -26 }, { x: 22, z: 64 }],
  vane: { x: 78, z: 28 },
  telescope: { x: 90, z: 30, r: 11 }, // anywhere up on the Highcanopy deck
  joist: { x: -58, z: 90 },
  rails: [{ x: -60, z: 76 }, { x: -86, z: 86 }, { x: -78, z: 116 }],
  fennick: { x: -24, z: 10 },
  guildMap: { x: -29, z: 4 },
  sage: { x: 9, z: -14 },
  thorn: { x: -9, z: -14 },
  folk: [{ x: 34, z: 20 }, { x: -34, z: 44 }, { x: 58, z: 92 }],
  pim: { x: 0, z: 30 },
  posts: [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    return { x: Math.cos(a) * 24, z: Math.sin(a) * 24 };
  }),
};

export function initPhase8(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p8 ||= { done: {}, herbs: {}, rails: {}, folk: {}, posts: {}, classes: {} };
  st.rep ||= {};
  const p8 = st.p8;
  const me = () => ctx.mouseRig.position;
  const H = (x, z) => ctx.cityHeight(x, z);
  const inCity = () => ctx.world() === "everbough";
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const addRep = (n) => {
    st.rep.everbough = Math.min(5, (st.rep.everbough || 0) + n);
    save();
    redraw();
    ctx.say(`⭐ Everbough trusts you more! (${"★".repeat(st.rep.everbough)}${"☆".repeat(5 - st.rep.everbough)})`);
  };
  function complete(key, msg) {
    if (p8.done[key]) return;
    p8.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg, true);
  }
  const current = () => STEPS.map(([k]) => k).find((k) => !p8.done[k]) || null;

  // ---------- the people of Everbough ----------
  const G = ctx.cityGroup;
  const people = {};
  const person = (key, name, tunic, hood, at, scale = 1, pack = false) => {
    const m = buildThistle({ tunicColor: tunic, hoodColor: hood, pack });
    m.scale.setScalar(scale);
    m.position.set(at.x, H(at.x, at.z), at.z);
    G.add(m);
    people[key] = { key, name, mesh: m, x: at.x, z: at.z };
    return people[key];
  };
  person("quill", "Head Librarian Quill", 0x3a4a7a, 0x2a3a6a, P.quill, 1.1);
  person("thyme", "Professor Thyme", 0x4f8a4a, 0x3f7a3a, P.thyme, 1.05);
  person("vane", "Professor Vane", 0x3a7a8a, 0x2a6a7a, P.vane, 1.05);
  person("joist", "Master Joist", 0x8a6a3a, 0x6a4a2a, P.joist, 1.1);
  person("fennick", "Guildmaster Fennick", 0x7a4a2a, 0x5a3a1a, P.fennick, 1.1, true);
  person("sage", "Elder Sage", 0xd8d0c0, 0xb8b0a0, P.sage, 1.12);
  person("thorn", "Elder Bramblethorn", 0x5a3a4a, 0x4a2a3a, P.thorn, 1.12);
  person("pim", "Lamplighter Pim", 0xc8843c, 0xa8642c, P.pim, 0.9);
  const folkColors = [0x8a6a9a, 0x6a9a8a, 0x9a8a5a];
  const folkNames = ["Baker Nettle", "Weaver Lark", "Gardener Bryony"];
  P.folk.forEach((at, i) => person("folk" + i, folkNames[i], folkColors[i], folkColors[i], at, 0.95));
  // the envoy from Roothaven arrives for Lantern Night
  const oriel = person("oriel", "Root Speaker Oriel", 0x3e4a58, 0x2e3a48, { x: 0, z: 18 }, 1.15);
  oriel.mesh.visible = !!p8.done.festival;

  // ---------- city props ----------
  const glowMat = (c) => new THREE.MeshBasicMaterial({ color: c });
  const halo = (c, s = 1.6) => {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(s);
    return h;
  };
  // rare plants for Botany
  const herbMeshes = P.herbs.map((at, i) => {
    const g = new THREE.Group();
    g.position.set(at.x, H(at.x, at.z), at.z);
    const colors = [0x9fffa0, 0xffa0f0, 0xa0d8ff];
    for (let k = 0; k < 5; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 5), glowMat(colors[i]));
      leaf.position.set(Math.cos(k * 1.26) * 0.2, 0.35, Math.sin(k * 1.26) * 0.2);
      leaf.rotation.z = Math.cos(k * 1.26) * 0.4;
      leaf.rotation.x = Math.sin(k * 1.26) * 0.4;
      g.add(leaf);
    }
    const h = halo(colors[i]);
    h.position.y = 0.7;
    g.add(h);
    g.userData.halo = h;
    g.visible = !p8.herbs[i];
    G.add(g);
    return g;
  });
  // broken railings at Millroot (Architecture)
  const railMeshes = P.rails.map((at, i) => {
    const g = new THREE.Group();
    g.position.set(at.x, H(at.x, at.z), at.z);
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5e36, flatShading: true });
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), wood);
      post.position.set(sx * 1.1, 0.6, 0);
      g.add(post);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), wood);
    bar.position.set(0, p8.rails[i] ? 1.0 : 0.3, 0);
    bar.rotation.z = p8.rails[i] ? 0 : 0.5; // broken: sagging to the ground
    g.add(bar);
    const h = halo(0xffd27a, 2);
    h.position.y = 1;
    h.visible = !p8.rails[i];
    g.add(h);
    g.userData = { bar, halo: h };
    G.add(g);
    return g;
  });
  // the Explorers' Guild's great map table
  const mapTable = (() => {
    const g = new THREE.Group();
    const at = P.guildMap;
    g.position.set(at.x, H(at.x, at.z), at.z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x6a4a2c, flatShading: true }));
    top.position.y = 1.0;
    const c = document.createElement("canvas");
    c.width = 1024; // (drawn at 4× so the map's words stay crisp up close)
    c.height = 704;
    const x = c.getContext("2d");
    x.scale(4, 4);
    x.fillStyle = "#d8c49a";
    x.fillRect(0, 0, 256, 176);
    x.strokeStyle = "#6a4a2a";
    x.lineWidth = 4;
    x.strokeRect(4, 4, 248, 168);
    x.fillStyle = "#3a5a2a";
    x.font = "900 16px Georgia";
    x.fillText("THE KNOWN WORLD", 60, 26);
    x.fillText("Everbough ★", 92, 90);
    x.font = "italic bold 13px Georgia";
    x.fillText("(here be dragons)", 140, 160);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    sheet.position.y = 1.11;
    g.add(top, sheet);
    for (const [lx, lz] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1, 5), new THREE.MeshStandardMaterial({ color: 0x4a3018 }));
      leg.position.set(lx, 0.5, lz);
      g.add(leg);
    }
    g.userData = { canvas: c, tex };
    G.add(g);
    return g;
  })();
  function markRoothaven() {
    const { canvas, tex } = mapTable.userData;
    const x = canvas.getContext("2d");
    x.fillStyle = "#7a3a1a";
    x.font = "900 16px Georgia";
    x.fillText("Roothaven ⛏", 90, 140);
    x.setLineDash([5, 5]);
    x.strokeStyle = "#7a3a1a";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(128, 96);
    x.lineTo(128, 124);
    x.stroke();
    tex.needsUpdate = true;
  }
  if (p8.done.guild) markRoothaven();
  // Lantern Night posts around the plaza
  const postMeshes = P.posts.map((at, i) => {
    const g = new THREE.Group();
    g.position.set(at.x, H(at.x, at.z), at.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x4a3018 }));
    pole.position.y = 1.6;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5a4a3a }));
    lamp.position.y = 3.5;
    const h = halo(0xffc860, 3.4);
    h.position.y = 3.5;
    const light = new THREE.PointLight(0xffb060, 0, 14, 1.6);
    light.position.y = 3.5;
    g.add(pole, lamp, h, light);
    g.userData = { lamp, halo: h, light };
    G.add(g);
    return g;
  });
  function setPost(i, lit) {
    const u = postMeshes[i].userData;
    u.lamp.material.color.set(lit ? 0xffd27a : 0x5a4a3a);
    u.halo.visible = lit;
    u.light.intensity = lit ? 14 : 0;
  }
  P.posts.forEach((_, i) => setPost(i, !!p8.posts[i]));
  // floating festival lanterns (rise into the sky at the end)
  const sky = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), glowMat(i % 3 ? 0xffc860 : 0xff9a5a));
    const a = i * 2.39;
    const r = 4 + (i % 10) * 3;
    l.position.set(Math.cos(a) * r, 2 + (i % 7), Math.sin(a) * r);
    l.userData.base = l.position.clone();
    sky.add(l);
  }
  sky.visible = !!p8.done.festival;
  G.add(sky);

  // ---------- talking (on Everbough's own ground) ----------
  function talk(p, lines, after) {
    const m = me();
    p.mesh.userData.lookAt = m;
    ctx.mouseRig.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
    const dx = m.x - p.x;
    const dz = m.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = [p.x, H(p.x, p.z) + 0.65 * p.mesh.scale.x, p.z];
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

  // ---------- 1. the road up to Everbough ----------
  function travel() {
    return playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 3.4, black: true, gameCam: true, text: "Past the Sealed Door, the Moonkeepers' road climbs — up through the roots, into the heartwood of a tree older than memory." },
      { dur: 3.2, black: true, gameCam: true, text: "Little blue stations glow along the way. A hundred years since anyone walked here." },
      { dur: 2.6, black: true, gameCam: true, text: "Then — daylight, through a door of living roots…",
        run: () => {
          ctx.goEverbough();
          ctx.placePlayer(P.arrive.x, P.arrive.z, Math.atan2(-P.arrive.x, -P.arrive.z));
        } },
      { dur: 4.5, fadeIn: true, from: [P.arrive.x + 6, H(P.arrive.x, P.arrive.z) + 4, P.arrive.z + 8], to: [10, 70, 70], lookFrom: [P.arrive.x - 10, 6, P.arrive.z - 20], lookTo: [0, 40, -40],
        text: "EVERBOUGH. Five great trees, a city woven through their branches — bridges, towers, a thousand windows." },
      { dur: 4, from: [10, 70, 70], to: [0, 30, -6], look: [0, 18, -55], text: "And at its heart, in the Heartwood, the glowing arch of the Grand Library." },
      { dur: 3.2, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "It's real. It's really, really real." },
      { dur: 0.4, gameCam: true,
        end: () => {
          complete("road", "📚 Everbough! Find the Grand Library — follow the golden beacon.");
          write("I walked the Moonkeepers' road and came out in EVERBOUGH. Everyone said it was only a story. The Grand Library glows like a lantern in the Heartwood.");
        } },
    ]);
  }

  // ---------- the festival ----------
  function festival() {
    ctx.cityDusk(true);
    oriel.mesh.visible = true;
    sky.visible = true;
    const y0 = H(0, 0);
    return playCutscene([
      { dur: 3.6, from: [30, y0 + 12, 30], to: [20, y0 + 6, 20], look: [0, y0 + 3, 0], text: "Lantern Night. The whole of Everbough gathers in the Market Circle." },
      { dur: 3.6, from: [6, y0 + 2.6, 26], look: [0, y0 + 1, 18], who: "Elder Sage",
        text: "Friends — tonight we welcome a guest no one in Everbough has seen in a hundred years…" },
      { dur: 3.6, from: [3, y0 + 2, 23], look: [0, y0 + 0.8, 18], who: "Root Speaker Oriel",
        text: "Roothaven sends its greetings, Everbough. Strength below…" },
      { dur: 3, from: [6, y0 + 2.6, 26], look: [0, y0 + 1, 18], who: "Elder Sage", text: "…and light within. Welcome home, cousin." },
      { dur: 5, from: [24, y0 + 4, 24], to: [10, y0 + 30, 10], look: [0, y0 + 14, 0], text: "And a thousand lanterns rose into the branches, all at once.",
        update: (k) => {
          for (const l of sky.children) l.position.y = l.userData.base.y + k * 28 + Math.sin(k * 6 + l.userData.base.x) * 0.5;
        } },
      { dur: 3.6, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "Two cities, together again. Three more to go." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 8 · Everbough — complete." },
      { dur: 1, fadeIn: true, gameCam: true,
        end: () => {
          complete("festival");
          addRep(2);
          st.phase = 9;
          write("Lantern Night in Everbough. Root Speaker Oriel came up the Moonkeepers' road as Roothaven's envoy, and a thousand lanterns went up. Two of the Five Great Cities, friends again.");
          save();
          redraw();
          ctx.say("🌎 Phase 8 complete! Phase 9 — The Other Great Cities — is next.", true);
          if (api.onDone) setTimeout(api.onDone, 600);
        } },
    ]);
  }

  // ---------- what can be done here? ----------
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  function interactable() {
    if (st.phase !== 8 || !inCity()) return null;
    const step = current();
    const pp = (k) => people[k];
    const at = (k, r) => near(pp(k).x, pp(k).z, r);

    if (at("quill")) {
      if (step === "library") {
        return { label: "talk to Head Librarian Quill", act: () => talk(pp("quill"), [
          ["", "A visitor at the Grand Library — and not one I've ever seen. Where on earth have you come from, little one?"],
          ["you", "From the Fallen Log School. And from Roothaven, under the forest — by the Moonkeepers' road."],
          ["", "Roothaven?! The lost city of builders? Our oldest books say it fell silent a century ago!"],
          ["you", "It didn't fall. It's full of mice. They've been waiting for you to remember them, too."],
          ["", "…Then you must tell the Royal Academy, the Guild, the Council — everyone. Start with the Academy, at the Learning Leaves. Tell them Quill sent you."],
        ], () => { complete("library", "🎓 Take three classes at the Royal Academy — Botany, Cartography and Architecture."); addRep(1); write("Head Librarian Quill of the Grand Library didn't believe me about Roothaven at first. Then she did. She's sent me to the Royal Academy."); }) };
      }
      return { label: "talk to Head Librarian Quill", act: () => talk(pp("quill"), [["", p8.done.festival ? "I'm writing all of this down, you know. Every word. The Library will remember." : "The Library has a hundred thousand books, and not one of them mentions you. Yet."]]) };
    }
    if (step === "academy") {
      if (at("thyme")) {
        const n = Object.keys(p8.herbs).length;
        if (!p8.classes.botany && n >= 3) {
          return { label: "show Professor Thyme your plants", act: () => talk(pp("thyme"), [
            ["", "Glowcap, Moonmint AND Skybell — in one morning! You've a botanist's eye, young Thistle."],
          ], () => { p8.classes.botany = true; save(); afterClass(); }) };
        }
        return { label: "talk to Professor Thyme", act: () => talk(pp("thyme"), [[
          "", p8.classes.botany ? "Botany's done! Off to your other classes." : `Botany! Find three rare plants hidden around the city — they glow, so look carefully. (${n}/3)`,
        ]]) };
      }
      if (at("vane")) {
        return { label: "talk to Professor Vane", act: () => talk(pp("vane"), [[
          "", p8.classes.carto ? "A cartographer who's SEEN the world from the top. Well done." : "Cartography begins with a view! Climb the Highcanopy — the ramps spiral up the trunk — and press E at the very top to look through the telescope.",
        ]]) };
      }
      if (at("joist")) {
        const n = Object.keys(p8.rails).length;
        if (!p8.classes.arch && n >= 3) {
          return { label: "show Master Joist your work", act: () => talk(pp("joist"), [
            ["", "Square, true and sturdy. An architect builds for the mice who come after. Class passed!"],
          ], () => { p8.classes.arch = true; save(); afterClass(); }) };
        }
        return { label: "talk to Master Joist", act: () => talk(pp("joist"), [[
          "", p8.classes.arch ? "Those railings will outlast us both." : `Architecture! Three railings around Millroot have broken — mend them for me. (${n}/3)`,
        ]]) };
      }
      for (let i = 0; i < herbMeshes.length; i++) {
        if (p8.herbs[i] || !near(P.herbs[i].x, P.herbs[i].z, 2.2)) continue;
        return { label: "study the glowing plant", act: () => {
          p8.herbs[i] = true;
          herbMeshes[i].visible = false;
          chime();
          save();
          redraw();
          ctx.say(`🌿 ${["Glowcap", "Moonmint", "Skybell"][i]}! (${Object.keys(p8.herbs).length}/3) — bring them to Professor Thyme.`);
        } };
      }
      for (let i = 0; i < railMeshes.length; i++) {
        if (p8.rails[i] || !near(P.rails[i].x, P.rails[i].z, 2.4)) continue;
        return { label: "mend the broken railing", act: () => {
          p8.rails[i] = true;
          const u = railMeshes[i].userData;
          u.bar.position.y = 1.0;
          u.bar.rotation.z = 0;
          u.halo.visible = false;
          ctx.bite();
          chime();
          save();
          redraw();
          ctx.say(`🛠️ Good as new! (${Object.keys(p8.rails).length}/3)`);
        } };
      }
      // the telescope, at the top of the Highcanopy
      const T = P.telescope;
      if (!p8.classes.carto && near(T.x, T.z, T.r) && me().y > ctx.deckY("canopy") - 1.5) {
        return { label: "look through the great telescope", act: () => {
          const y = me().y;
          playCutscene([
            { dur: 3.5, from: [T.x, y + 2, T.z], to: [T.x - 20, y + 10, T.z - 20], look: [-300, y - 20, -200], text: "From the top of the Highcanopy, the whole forest spreads out below…" },
            { dur: 3.5, from: [T.x - 20, y + 10, T.z - 20], look: [-300, y - 40, 300], text: "The meadow. The creek. The Great Falls — and far, far away, the little Fallen Log School." },
            { dur: 0.4, gameCam: true,
              end: () => {
                p8.classes.carto = true;
                save();
                afterClass();
                ctx.say("🔭 Cartography class: passed! (Professor Vane will be proud)", true);
              } },
          ]);
        } };
      }
    }
    if (at("fennick")) {
      if (step === "guild") {
        return { label: "talk to Guildmaster Fennick", act: () => talk(pp("fennick"), [
          ["", "So YOU'RE the one the whole Academy is buzzing about. A traveler who came up the Moonkeepers' road!"],
          ["", "The Explorers' Guild hasn't added a new city to the Great Map in a hundred years. Would you do the honors? The map table's right here."],
        ]) };
      }
      return { label: "talk to Guildmaster Fennick", act: () => talk(pp("fennick"), [["", p8.done.guild ? "Explorer Thistle! It has a ring to it, doesn't it?" : "Guild business is for explorers, small one. Come back when you've been somewhere."]]) };
    }
    if (step === "guild" && near(P.guildMap.x, P.guildMap.z, 2.6)) {
      return { label: "mark Roothaven on the Great Map", act: () => {
        markRoothaven();
        playCutscene([
          { dur: 3.2, from: [P.guildMap.x + 1.4, H(P.guildMap.x, P.guildMap.z) + 3, P.guildMap.z + 1.6], look: [P.guildMap.x, H(P.guildMap.x, P.guildMap.z) + 1.1, P.guildMap.z],
            text: "You dip the quill and draw it in: ROOTHAVEN — and a dashed road, down beneath the trees." },
          { dur: 3, from: [P.fennick.x + 2, H(P.fennick.x, P.fennick.z) + 1.4, P.fennick.z + 2], look: [P.fennick.x, H(P.fennick.x, P.fennick.z) + 0.7, P.fennick.z], who: "Guildmaster Fennick",
            text: "The first new city on the Great Map in a century. Welcome to the Explorers' Guild — Explorer Thistle!" },
          { dur: 0.4, gameCam: true,
            end: () => { complete("guild", "🏛️ The Council of Branches is meeting at the fountain. Go and tell them about Roothaven."); addRep(1); write("I drew Roothaven onto the Explorers' Guild's Great Map. I'm a member of the Guild now — Explorer Thistle."); } },
        ]);
      } };
    }
    if (step === "council") {
      if (at("thorn")) {
        if (!p8.thornAsked) {
          return { label: "talk to Elder Bramblethorn", act: () => talk(pp("thorn"), [
            ["", "A lost city under the ground? Old roads? Friendship? Hmph. Fairy stories for kittens."],
            ["", "The Council won't vote on a fairy story. Show me that ordinary Everbough mice want this, and I'll listen."],
          ], () => { p8.thornAsked = true; save(); redraw(); ctx.say("🏛️ Win over three citizens of Everbough — the beacon will show you who."); }) };
        }
        if (Object.keys(p8.folk).length >= 3) {
          return { label: "talk to Elder Bramblethorn", act: () => council() };
        }
        return { label: "talk to Elder Bramblethorn", act: () => talk(pp("thorn"), [["", `Three ordinary mice, I said. You've found ${Object.keys(p8.folk).length}.`]]) };
      }
      if (at("sage")) {
        return { label: "talk to Elder Sage", act: () => talk(pp("sage"), [["", "I believe you, child. But a Council needs more than one old believer. Bramblethorn is the one to convince."]]) };
      }
      for (let i = 0; i < 3; i++) {
        if (!p8.thornAsked || p8.folk[i] || !at("folk" + i)) continue;
        const lines = [
          [["", "Roothaven? With bakers? Do they bake with mushroom flour? Oh, I'd LOVE that recipe… All right — tell the Council I'm for it!"]],
          [["", "Under-forest weavers spin crystal thread, you say? Then yes — open the roads. The Council will hear from me."]],
          [["", "My grandmother had a seed from 'the deep city'. I always thought she made it up… I'm with you, little one."]],
        ][i];
        return { label: `talk to ${people["folk" + i].name}`, act: () => talk(people["folk" + i], lines, () => {
          p8.folk[i] = true;
          save();
          redraw();
          ctx.say(`🤝 ${people["folk" + i].name} will speak for the roads! (${Object.keys(p8.folk).length}/3)`);
        }) };
      }
    }
    if (step === "festival") {
      if (at("pim") && !p8.pimAsked) {
        return { label: "talk to Lamplighter Pim", act: () => talk(pp("pim"), [
          ["", "Lantern Night is tonight — the Council's declared it in your honor! But I've five lamps to light round the plaza and only two paws."],
          ["you", "I'll help!"],
        ], () => { p8.pimAsked = true; save(); redraw(); }) };
      }
      if (p8.pimAsked) {
        for (let i = 0; i < postMeshes.length; i++) {
          if (p8.posts[i] || !near(P.posts[i].x, P.posts[i].z, 2.4)) continue;
          return { label: "light the lamp", act: () => {
            p8.posts[i] = true;
            setPost(i, true);
            chime();
            save();
            redraw();
            const n = Object.keys(p8.posts).length;
            if (n >= 5) festival();
            else ctx.say(`🏮 The lamp glows gold! (${n}/5)`);
          } };
        }
      }
    }
    return null;
  }
  function afterClass() {
    const c = p8.classes;
    redraw();
    if (c.botany && c.carto && c.arch) {
      complete("academy", "🎓 All three classes! The Royal Academy enrolls you as its first traveling scholar. Now find Guildmaster Fennick in the Market Circle.");
      addRep(1);
      write("Passed Botany, Cartography and Architecture at the Royal Academy of Everbough. I'm a traveling scholar now!");
    }
  }
  function council() {
    const y0 = H(0, 0);
    return playCutscene([
      { dur: 3.4, from: [0, y0 + 5, 6], look: [0, y0 + 1, -14], text: "The Council of Branches gathers at the fountain. Half of Everbough crowds round to listen." },
      { dur: 3.4, from: [P.thorn.x + 2, y0 + 1.6, P.thorn.z + 2.5], look: [P.thorn.x, y0 + 0.8, P.thorn.z], who: "Elder Bramblethorn",
        text: "A baker, a weaver, a gardener — and a schoolmouse who walked under the world. Hmph. …I have been an old fool." },
      { dur: 3.6, from: [P.sage.x + 2, y0 + 1.6, P.sage.z + 2.5], look: [P.sage.x, y0 + 0.8, P.sage.z], who: "Elder Sage",
        text: "Then the Council is agreed: Everbough will open the Moonkeepers' road, and send an invitation to Roothaven — for Lantern Night!" },
      { dur: 3, from: [0, y0 + 4, 10], to: [0, y0 + 8, 18], look: [0, y0 + 1, -10], text: "The crowd cheers so loudly the leaves shake." },
      { dur: 0.4, gameCam: true,
        end: () => { complete("council", "🏮 Lantern Night is tonight! Find Lamplighter Pim in the plaza."); addRep(1); write("The Council of Branches voted to open the old road and invite Roothaven to Lantern Night. Even grumpy Elder Bramblethorn."); } },
    ]);
  }

  // ---------- the Sealed Door's road (tunnels) ----------
  function roadAction() {
    if (st.phase < 8) return null;
    return { label: "follow the Moonkeepers' road up to Everbough", act: travel };
  }

  // ---------- where next? ----------
  function target() {
    const step = current();
    if (st.phase !== 8 || !step) return null;
    const c = (p) => ({ ...p, world: "everbough" });
    switch (step) {
      case "road": return { ...ctx.tunnels.spots.door, world: "tunnels" };
      case "library": return c(P.quill);
      case "academy": {
        const cl = p8.classes;
        if (!cl.botany) {
          const i = [0, 1, 2].find((k) => !p8.herbs[k]);
          return c(i === undefined ? P.thyme : P.herbs[i]);
        }
        if (!cl.carto) return c(me().y > ctx.deckY("canopy") - 3 ? P.telescope : P.vane);
        const i = [0, 1, 2].find((k) => !p8.rails[k]);
        return c(i === undefined ? P.joist : P.rails[i]);
      }
      case "guild": return c(P.fennick);
      case "council": {
        if (!p8.thornAsked) return c(P.thorn);
        const i = [0, 1, 2].find((k) => !p8.folk[k]);
        return c(i === undefined ? P.thorn : P.folk[i]);
      }
      case "festival": {
        if (!p8.pimAsked) return c(P.pim);
        const i = [0, 1, 2, 3, 4].find((k) => !p8.posts[k]);
        return i === undefined ? null : c(P.posts[i]);
      }
    }
    return null;
  }
  function goal() {
    const t = target();
    if (!t || ctx.world() !== "outside") return null;
    // to Everbough: through the hole between the great tree's roots, into the tunnels
    return { x: ctx.hole.x, z: ctx.hole.z };
  }
  const mkBeacon = (parent) => {
    const b = new THREE.Group();
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc860, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(4);
    h.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 20;
    b.add(h, beam);
    b.userData = { h, beam };
    b.visible = false;
    parent.add(b);
    return b;
  };
  const beaconCity = mkBeacon(G);
  const beaconT = mkBeacon(ctx.tunnels.group);

  // ---------- each frame ----------
  let restored = false;
  const devAt = new URLSearchParams(location.search).get("p8at");
  function update(dt, t) {
    if (st.phase < 8 || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      if (devAt) {
        const keys = STEPS.map(([k]) => k);
        keys.slice(0, Math.max(0, keys.indexOf(devAt))).forEach((k) => (p8.done[k] = true));
        if (p8.done.academy) p8.classes = { botany: true, carto: true, arch: true };
        if (devAt !== "road") {
          ctx.goEverbough();
          ctx.placePlayer(P.arrive.x, P.arrive.z, Math.atan2(-P.arrive.x, -P.arrive.z));
        }
        save();
      }
      if (p8.done.festival) ctx.cityDusk(true);
      redraw();
    }
    // townsfolk turn to face whoever they're talking to
    for (const p of Object.values(people)) {
      const L = p.mesh.userData.lookAt;
      if (L) p.mesh.rotation.y = Math.atan2(L.x - p.x, L.z - p.z);
      else p.mesh.rotation.y = Math.atan2(-p.x, -p.z) + Math.sin(t * 0.4 + p.x) * 0.3; // facing the plaza
      p.mesh.position.y = H(p.x, p.z) + Math.sin(t * 2 + p.z) * 0.01;
    }
    for (const g of herbMeshes) if (g.visible) g.userData.halo.material.opacity = 0.45 + Math.sin(t * 3 + g.position.x) * 0.25;
    if (sky.visible && current() === null) {
      for (const l of sky.children) l.position.y = l.userData.base.y + 28 + Math.sin(t * 0.8 + l.userData.base.x) * 0.6;
    }
    // beacons
    const tg = st.phase === 8 ? target() : null;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    beaconCity.visible = false;
    beaconT.visible = false;
    if (tg) {
      const show = (b, x, y, z) => {
        b.visible = true;
        b.position.set(x, y, z);
        b.userData.h.material.opacity = 0.55 + pulse * 0.4;
        b.userData.beam.material.opacity = 0.18 + pulse * 0.16;
      };
      if (ctx.world() === "everbough" && tg.world === "everbough") {
        const y = tg === P.telescope || (tg.x === P.telescope.x && tg.z === P.telescope.z) ? ctx.deckY("canopy") : H(tg.x, tg.z);
        show(beaconCity, tg.x, y, tg.z);
      } else if (ctx.world() === "tunnels") {
        const d = ctx.tunnels.spots.door;
        show(beaconT, d.x, 0, d.z);
      }
    }
  }

  // ---------- the list ----------
  function panelHTML() {
    const step = current();
    const rows = STEPS.map(([k, icon, label]) => {
      if (p8.done[k]) return `<li class="done">✔ ${icon} ${label}</li>`;
      if (k !== step) return `<li class="sub">○ ${icon} ${label}</li>`;
      let extra = "";
      if (k === "academy") {
        const c = p8.classes;
        extra = `<div class="sub ${c.botany ? "done" : ""}">${c.botany ? "✔" : "○"} 🌿 Botany — find 3 glowing plants (${Object.keys(p8.herbs).length}/3), then Professor Thyme</div>`
          + `<div class="sub ${c.carto ? "done" : ""}">${c.carto ? "✔" : "○"} 🔭 Cartography — the telescope atop the Highcanopy</div>`
          + `<div class="sub ${c.arch ? "done" : ""}">${c.arch ? "✔" : "○"} 🛠️ Architecture — mend 3 railings at Millroot (${Object.keys(p8.rails).length}/3), then Master Joist</div>`;
      }
      if (k === "council") extra = p8.thornAsked ? `<div class="sub">○ Win over 3 citizens (${Object.keys(p8.folk).length}/3), then Elder Bramblethorn</div>` : `<div class="sub">○ Talk to Elder Bramblethorn at the fountain</div>`;
      if (k === "festival") extra = p8.pimAsked ? `<div class="sub">○ Light the 5 plaza lamps (${Object.keys(p8.posts).length}/5)</div>` : `<div class="sub">○ Find Lamplighter Pim</div>`;
      return `<li class="next">${icon} ${label}${extra}</li>`;
    });
    const rep = (k) => "★".repeat(st.rep[k] || 0) + "☆".repeat(5 - (st.rep[k] || 0));
    return `<h3>🌳 Everbough</h3><ul>${rows.join("")}</ul><div class="kit">Everbough ${rep("everbough")}<br>Roothaven ${rep("roothaven")} · School ${rep("school")}</div>`;
  }

  return { update, interactable, roadAction, goal, panelHTML, start: () => redraw() };
}
