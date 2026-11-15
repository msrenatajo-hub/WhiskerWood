// ------------------------------------------------------------
//  🌿  PHASE 11 — "Restoring the Great Canopy Alliance"
//
//  Six projects, in any order. Each one VISIBLY changes the world:
//    📮 Messenger Routes   (Postmistress Dabble, Reedmere)  → messenger wrens fly everywhere
//    📚 Shared Libraries   (Head Librarian Quill, Everbough) → the glowing Alliance Shelf
//    🛒 Trade Caravans     (Trader Pell, Roothaven)          → caravans roll through the forest
//    🎓 Student Exchange   (Headmaster Bramble, the school)  → visiting students in both places
//    🌉 The Old Bridges    (Master Joist, Everbough)         → a new Alliance Bridge over the creek
//    💎 The Lit Tunnels    (Foundry Master Cobble, Roothaven) → crystal lamps in every tunnel room
//  Every finished project raises another Alliance banner in Everbough's
//  Market Circle. All six → ALLIANCE DAY (Elder Sage) → Phase 12.
// ------------------------------------------------------------
import * as THREE from "three";
import { inflate, bought } from "./economy.js";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState as cityLifeState, openCard, registerKeepsake } from "./cityLife.js";
import { bagFood } from "./food.js";
import { powerText } from "./powers.js";
import { LORE_STONES } from "./phase12.js";

const PROJECTS = [
  { key: "mail", icon: "📮", name: "Messenger Routes", who: "Postmistress Dabble", where: "reedmere",
    need: [["String", 4], ["Feathers", 4]],
    ask: "A Moonkeeper post again! Wrens to carry letters between ALL five cities. I need string for the satchels and feathers to show the birds the way.",
    thanks: "Off they go! Letters will fly between the cities every single day now." },
  { key: "library", icon: "📚", name: "Shared Libraries", who: "Head Librarian Quill", where: "everbough",
    needLore: 5,
    ask: "Every city has its own history, carved on lore stones. Read at least five, and I'll copy them for a shelf that EVERY city's library will share.",
    thanks: "The Alliance Shelf! Copies go out to all five libraries on the first wren." },
  { key: "caravan", icon: "🛒", name: "Trade Caravans", who: "Trader Pell", where: "roothaven",
    need: [["Berries", 6]], coins: 20,
    ask: "Caravans, friend! Real ones, with ponies. I'll need coin for the carts — 20 — and berries for the ponies. They work for berries.",
    thanks: "The first caravans are rolling! Goods between every city, all year round." },
  { key: "students", icon: "🎓", name: "Student Exchange", who: "Headmaster Bramble", where: "forest",
    ask: "Everbough's Royal Academy has offered to swap students with us! Clover's packed already. Shall we send her?",
    thanks: "Off to Everbough she goes — and we'll welcome a young scholar of theirs. Just like the old days!" },
  { key: "bridge", icon: "🌉", name: "The Old Bridges", who: "Master Joist", where: "everbough",
    need: [["Twigs", 8], ["Stones", 4], ["Root Fibers", 4]],
    ask: "The Moonkeepers' bridges over the forest creek washed away long ago. Bring me twigs, stones and root fibers and we'll build an Alliance Bridge that lasts a thousand years.",
    thanks: "Down by the creek, a brand-new bridge — the Alliance Bridge. Go and walk it!" },
  { key: "tunnels", icon: "💎", name: "The Lit Tunnels", who: "Foundry Master Cobble", where: "roothaven",
    need: [["Crystal Fragments", 4]],
    ask: "The old tunnels under Everbough are black as pitch. Four crystal fragments and my engineers will hang crystal lamps in every room.",
    thanks: "Every tunnel room glows now. No traveler walks the roots in the dark again." },
];

export function initPhase11(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p11 ||= { done: {} };
  const p11 = st.p11;
  const CL = () => cityLifeState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.8) => Math.hypot(me().x - x, me().z - z) < r;
  const where = () => (ctx.world() === "city" ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const doneCount = () => PROJECTS.filter((p) => p11.done[p.key]).length;

  // ---------- who to talk to (and where they stand right now) ----------
  function giver(P) {
    if (where() !== P.where) return null;
    if (P.where === "everbough") {
      const at = P.key === "library" ? { x: 0, z: -40 } : { x: -58, z: 90 };
      return { ...at, y: ctx.cityHeight(at.x, at.z) };
    }
    if (P.where === "roothaven") {
      const p = ctx.roothaven.people.find((x) => x.key === (P.key === "caravan" ? "pell" : "foundry"));
      return p && { x: p.x, z: p.z, y: ctx.roothaven.height(p.x, p.z) };
    }
    if (P.where === "reedmere") {
      const p = ctx.city().people["x-Postmistress Dabble"];
      return p && { x: p.x, z: p.z, y: ctx.city().height(p.x, p.z) };
    }
    if (P.where === "forest") {
      const b = ctx.npcs.find((n) => n.key === "bramble");
      return b && { x: b.x, z: b.z, y: ctx.terrainHeight(b.x, b.z) };
    }
    return null;
  }
  const say = (L, name, lines, after) => {
    const m = me();
    const dx = m.x - L.x;
    const dz = m.z - L.z;
    const d = Math.hypot(dx, dz) || 1;
    return playCutscene(
      lines.map((text, i) => ({
        dur: 2.6,
        from: [m.x + (dx / d) * 1.6 - (dz / d) * 0.8, m.y + 1.1, m.z + (dz / d) * 1.6 + (dx / d) * 0.8],
        look: [L.x, L.y + 0.75, L.z],
        who: name,
        text,
        end: i === lines.length - 1 ? after : undefined,
      }))
    );
  };
  function missing(P) {
    const out = [];
    for (const [it, n] of P.need || []) if (ctx.packCount(it) < n) out.push(`${n - ctx.packCount(it)} more ${it}`);
    if (P.coins && CL().coins < P.coins) out.push(`🪙 ${P.coins - CL().coins} more coins`);
    if (P.needLore && Object.keys(CL().lore || {}).length < P.needLore) out.push(`${P.needLore - Object.keys(CL().lore || {}).length} more lore stones read`);
    return out;
  }

  // ---------- the visible changes ----------
  const glow = (c, s) => {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(s);
    return h;
  };
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...e });
  const built = {};
  // 🏳️ Alliance banners in Everbough's Market Circle (one per finished project)
  const BANNER_COLORS = [0x8a6a4a, 0x4a8a4a, 0x3a8ac8, 0xd8a83a, 0xbfe6ff, 0x9a6ac8];
  const banners = [];
  function buildBanners() {
    if (built.banners) return;
    built.banners = true;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      const x = Math.cos(a) * 30;
      const z = Math.sin(a) * 30;
      const y = ctx.cityHeight(x, z);
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 6), M(0x5a3e24));
      pole.position.y = 3.5;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4, 4, 4), M(BANNER_COLORS[i], { side: THREE.DoubleSide }));
      flag.position.set(0.8, 5.6, 0);
      const moon = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 14, 1, 0.5, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      moon.position.set(0.8, 5.7, 0.01);
      g.add(pole, flag, moon);
      g.rotation.y = Math.atan2(-x, -z) + Math.PI / 2;
      ctx.cityGroup.add(g);
      banners.push({ g, flag });
    }
  }
  // 🐦 messenger wrens, flying loops over wherever you are
  const wrens = [];
  function wrensFor(group, H) {
    if (group.userData.wrens) return;
    group.userData.wrens = true;
    for (let k = 0; k < 6; k++) {
      const b = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 5).scale(0.8, 0.8, 1.2), M(0x7a5232));
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.1), M(0xc8a03a));
      bag.position.y = -0.14;
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.16), M(0x6a4428));
      w1.geometry.translate(0.2, 0, 0);
      const w2 = w1.clone();
      w2.scale.x = -1;
      b.add(body, bag, w1, w2);
      group.add(b);
      wrens.push({ b, w1, w2, k, H, r: 25 + k * 9, h: 9 + (k % 3) * 3, sp: 0.18 + (k % 3) * 0.05 });
    }
  }
  // 🛒 caravans: a pony and a covered cart rolling through the forest
  const caravans = [];
  function buildCaravans() {
    if (built.caravans) return;
    built.caravans = true;
    for (let k = 0; k < 2; k++) {
      const g = new THREE.Group();
      const pony = ctx.buildPony(k ? 0x6a4a34 : 0xd8b07a);
      pony.scale.setScalar(1.6);
      pony.position.z = 1.6;
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 2.2), M(0x8a5e36));
      cart.position.set(0, 1, -1.2);
      const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 10, 1, true, 0, Math.PI), M(0xf0e6d0, { side: THREE.DoubleSide }));
      cover.rotation.x = Math.PI / 2;
      cover.rotation.z = Math.PI / 2;
      cover.position.set(0, 1.5, -1.2);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), M(BANNER_COLORS[k + 2], { side: THREE.DoubleSide }));
      flag.position.set(0, 2.6, -2.2);
      g.add(pony, cart, cover, flag);
      for (const sx of [-0.9, 0.9]) {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 5, 12), M(0x5a3e24));
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(sx, 0.45, -1.2);
        g.add(wheel);
      }
      ctx.outsideGroup.add(g);
      caravans.push({ g, pony, k });
    }
  }
  // 🎓 the exchange students
  function buildStudents() {
    if (built.students) return;
    built.students = true;
    const clover = buildThistle({ tunicColor: 0x8a5a68, hoodColor: 0x8a5a68, pack: true });
    clover.scale.setScalar(0.82);
    clover.position.set(14, ctx.cityHeight(14, -36), -36);
    clover.rotation.y = Math.PI;
    ctx.cityGroup.add(clover);
    const s = ctx.school();
    if (s) {
      const scholar = buildThistle({ tunicColor: 0x3a4a8a, hoodColor: 0x3a4a8a, pack: false });
      scholar.scale.setScalar(0.85);
      const x = s.x + 2;
      const z = s.z + 4;
      scholar.position.set(x, ctx.terrainHeight(x, z), z);
      scholar.rotation.y = Math.PI;
      ctx.outsideGroup.add(scholar);
    }
  }
  // 📚 the glowing Alliance Shelf by the Grand Library
  function buildShelf() {
    if (built.shelf) return;
    built.shelf = true;
    const x = -9;
    const z = -34;
    const y = ctx.cityHeight(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = 0.4;
    const case_ = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3, 0.8), M(0x6a4a2c));
    case_.position.y = 1.5;
    g.add(case_);
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 7; i++) {
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.5), M(BANNER_COLORS[(i + r) % 6], { emissive: BANNER_COLORS[(i + r) % 6], emissiveIntensity: 0.35 }));
        book.position.set(-1.25 + i * 0.4, 0.6 + r * 0.9, 0.2);
        g.add(book);
      }
    }
    const h = glow(0xffe6a8, 4);
    h.position.set(0, 1.8, 0.6);
    g.add(h);
    ctx.cityGroup.add(g);
  }
  // 💎 crystal lamps in every tunnel room
  function buildTunnelLamps() {
    if (built.lamps) return;
    built.lamps = true;
    for (const R of Object.values(ctx.tunnels.rooms)) {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        const x = R.x + Math.cos(a) * (R.r - 1.8);
        const z = R.z + Math.sin(a) * (R.r - 1.8);
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0).scale(0.7, 1.5, 0.7), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
        c.position.set(x, 2.2, z);
        const h = glow(0x9fd8ff, 2.4);
        h.position.copy(c.position);
        ctx.tunnels.group.add(c, h);
      }
      const l = new THREE.PointLight(0x9fd8ff, 14, R.r * 2.5, 1.6);
      l.position.set(R.x, 3, R.z);
      ctx.tunnels.group.add(l);
    }
  }
  // 🌉 the Alliance Bridge over the forest creek
  function buildBridge() {
    if (built.bridge || !ctx.creekBridge.ready) return;
    built.bridge = true;
    const B = ctx.creekBridge;
    // 80 units downstream from the old plank bridge
    const ax = -B.sz;
    const az = B.sx;
    const cx = B.x + ax * 80;
    const cz = B.z + az * 80;
    const half = 24;
    const g = new THREE.Group();
    const stone = M(0xb8b4a8);
    const yA = ctx.terrainHeight(cx - B.sx * half, cz - B.sz * half);
    const yB = ctx.terrainHeight(cx + B.sx * half, cz + B.sz * half);
    const deck = (k) => yA + (yB - yA) * k + Math.sin(k * Math.PI) * 2.6 + 0.3;
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      const x = cx + B.sx * (-half + k * half * 2);
      const z = cz + B.sz * (-half + k * half * 2);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 2.1), stone);
      slab.position.set(x, deck(k), z);
      slab.rotation.y = Math.atan2(B.sx, B.sz);
      g.add(slab);
      if (i % 4 === 0) {
        for (const s of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), stone);
          post.position.set(x + Math.cos(Math.atan2(B.sx, B.sz)) * s * 2.4, deck(k) + 0.7, z - Math.sin(Math.atan2(B.sx, B.sz)) * s * 2.4);
          g.add(post);
          const lamp = glow(0xffd890, 1.4);
          lamp.position.set(post.position.x, post.position.y + 1, post.position.z);
          g.add(lamp);
        }
      }
      ctx.addPlatform(x, z, 2.2, deck(k) + 0.25);
    }
    ctx.outsideGroup.add(g);
  }
  function applyAll() {
    if (ctx.cityBuilt()) {
      buildBanners();
      banners.forEach((b, i) => (b.g.visible = i < doneCount()));
      if (p11.done.library) buildShelf();
      if (p11.done.students) buildStudents();
    }
    if (p11.done.caravan) buildCaravans();
    if (p11.done.tunnels) buildTunnelLamps();
    if (p11.done.bridge) buildBridge();
  }

  // ---------- 🛒 the caravans' travelling shop ----------
  // (any time after the caravans start rolling: walk up and see what they've brought)
  const WARES = [
    { key: "c_fish", icon: "🐟", name: "Smoked Fish", from: "Reedmere", price: 6, food: { heal: 30 } },
    { key: "c_cake", icon: "🍯", name: "Honeycake", from: "Golden Hollow", price: 6, food: { heal: 30 } },
    { key: "c_cocoa", icon: "☕", name: "Pine-Needle Cocoa", from: "Frostpine", price: 6, food: { heal: 25, warm: true } },
    { key: "c_crystal", icon: "💎", name: "Crystal Fragments", from: "Roothaven", price: 5, pack: 1 },
    { key: "c_carrot", icon: "🥕", name: "Carrots", from: "the caravan's own garden", price: 2, pack: 2 },
    { key: "caravanbell", icon: "🔔", name: "Caravan Bell", from: "a keepsake", price: 18, keep: true },
    { key: "trailmap", icon: "🗺️", name: "Trader Pell's Trail Map", from: "a keepsake", price: 22, keep: true },
    { key: "ponybrush", icon: "🪮", name: "Pony Grooming Brush", from: "a keepsake", price: 14, keep: true },
    { key: "silkbundle", icon: "🧵", name: "Bundle of Eastern Silk", from: "a keepsake", price: 16, keep: true },
  ];
  for (const W of WARES) if (W.keep) registerKeepsake(W.key, W.icon, W.name);
  inflate(WARES); // (🪙 prices grow with your adventure)
  function caravanShop(c, msg = "") {
    const S = CL();
    openCard(`<div class="card"><h3>🛒 The ${c.k ? "Chestnut" : "Honey"} Caravan</h3><div class="coins">🪙 ${S.coins} · “Goods from every city — and a few treasures besides!”</div>
      ${WARES.map((W) => {
        const owned = W.keep && (S.owned || {})[W.key];
        return `<div class="item"><span class="ic">${W.icon}</span><span class="nm">${W.name}${W.pack > 1 ? ` ×${W.pack}` : ""}<small>from ${W.from}${powerText(W.key) ? ` · <b>${powerText(W.key)}</b>` : ""}</small></span><button data-w="${W.key}" ${owned || S.coins < W.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + W.price}</button></div>`;
      }).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — wave goodbye to the pony</div></div>`, (el) => el.querySelectorAll("button[data-w]").forEach((b) => (b.onclick = () => {
      const W = WARES.find((x) => x.key === b.dataset.w);
      if (!W || S.coins < W.price) return;
      S.coins -= W.price;
      bought(W.key);
      let m = `You bought ${W.icon} ${W.name}!`;
      if (W.food) m += bagFood({ icon: W.icon, name: W.name, heal: W.food.heal, warm: W.food.warm });
      else if (W.pack) ctx.addToPack(W.name, W.pack);
      else if (W.keep) {
        (S.owned ||= {})[W.key] = true;
        if (powerText(W.key)) m += ` ${powerText(W.key)}!`;
      }
      ctx.saveCity();
      chime();
      caravanShop(c, m);
    })));
  }
  const nearCaravan = () => caravans.find((c) => ctx.world() === "outside" && near(c.g.position.x, c.g.position.z, 4));

  // ---------- E ----------
  function interactable() {
    if (p11.done.caravan && caravans.length) {
      const c = nearCaravan();
      if (c) return { label: `browse the ${c.k ? "Chestnut" : "Honey"} Caravan's wares 🛒`, act: () => caravanShop(c) };
    }
    if (st.phase !== 11) return null;
    for (const P of PROJECTS) {
      const L = giver(P);
      if (!L || !near(L.x, L.z)) continue;
      if (p11.done[P.key]) return { label: `talk to ${P.who}`, act: () => say(L, P.who, [P.thanks]) };
      const miss = missing(P);
      if (miss.length) {
        return { label: `talk to ${P.who} — ${P.icon} ${P.name}`, act: () => say(L, P.who, [P.ask, `(Still needed: ${miss.join(", ")}.)`]) };
      }
      return { label: `${P.icon} start the ${P.name} with ${P.who}`, act: () => say(L, P.who, [P.ask, P.thanks], () => {
        for (const [it, n] of P.need || []) ctx.packTake(it, n);
        if (P.coins) {
          CL().coins -= P.coins;
          ctx.saveCity();
        }
        p11.done[P.key] = true;
        save();
        applyAll();
        redraw();
        chime();
        write(`Alliance project: ${P.name} — done, with ${P.who}.`);
        ctx.say(`${P.icon} ${P.name} restored! Another Alliance banner rises in Everbough. (${doneCount()}/6)`, true);
      }) };
    }
    // the finale
    if (doneCount() >= 6 && !p11.done.allianceDay && where() === "everbough" && near(9, -14, 3)) {
      return { label: "talk to Elder Sage — it's time", act: allianceDay };
    }
    return null;
  }

  function allianceDay() {
    applyAll();
    ctx.cityDusk(true);
    const y = ctx.cityHeight(0, 0);
    return playCutscene([
      { dur: 3.6, from: [30, y + 14, 34], to: [20, y + 8, 24], look: [0, y + 3, 0], who: "Elder Sage", text: "Then let the whole world hear it. Today, the Great Canopy Alliance is restored!" },
      { dur: 4, from: [0, y + 3, 20], to: [0, y + 6, 26], look: [0, y + 5, 0], text: "Six banners snap in the wind above the Market Circle. Leaders of all five Great Cities stand together beneath them." },
      { dur: 4, from: [20, y + 4, -10], look: [0, y + 2, 0], text: "Messenger wrens wheel overhead. Caravans roll in down the old roads. Students from five academies trade addresses and promises." },
      { dur: 4, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "Renata walked the first road with a lantern and a promise. I think… I think we kept it." },
      { dur: 4.4, from: [10, y + 10, 10], to: [4, y + 40, 4], look: [0, y + 20, -20], text: "For the first time in a hundred years, no city is alone in the dark." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 11 · Restoring the Great Canopy Alliance — complete." },
      { dur: 1.2, fadeIn: true, gameCam: true, end: () => {
        p11.done.allianceDay = true;
        st.phase = 12;
        for (const k of ["roothaven", "everbough", "reedmere", "golden", "frostpine", "school"]) {
          st.rep ||= {};
          st.rep[k] = 5;
        }
        write("ALLIANCE DAY. The Great Canopy Alliance is whole again — mail, books, caravans, students, bridges and lit roads between all five cities.");
        save();
        redraw();
        ctx.say("🏡 Phase 11 complete! Phase 12 — Your Life After the Story — is next.", true);
        if (api.onDone) setTimeout(api.onDone, 600);
      } },
    ]);
  }

  // ---------- each frame ----------
  const beacon = new THREE.Group();
  {
    const h = glow(0xffc860, 4);
    h.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 20;
    beacon.add(h, beam);
  }
  let restored = false;
  function update(dt, t) {
    if (st.phase < 11 || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      const at = new URLSearchParams(location.search).get("p11all");
      if (at) {
        for (const P of PROJECTS) p11.done[P.key] = true;
        save();
      }
    }
    applyAll();
    // messenger wrens over whichever place you're in
    if (p11.done.mail) {
      const w = where();
      const grp = w === "forest" ? ctx.outsideGroup : w === "everbough" ? ctx.cityGroup : w === "roothaven" ? null : ctx.world() === "city" ? ctx.city().group : null;
      const H = w === "forest" ? ctx.terrainHeight : w === "everbough" ? ctx.cityHeight : ctx.world() === "city" ? ctx.city().height : null;
      if (grp && H) wrensFor(grp, H);
    }
    for (const b of wrens) {
      if (!b.b.parent || !b.b.parent.visible) continue;
      const a = t * b.sp + b.k * 1.1;
      const cx = b.b.parent === ctx.outsideGroup ? me().x : 0;
      const cz = b.b.parent === ctx.outsideGroup ? me().z : 0;
      const x = cx + Math.cos(a) * b.r;
      const z = cz + Math.sin(a) * b.r;
      b.b.position.set(x, b.H(x, z) + b.h, z);
      b.b.rotation.y = -a;
      const f = Math.sin(t * 18 + b.k) * 0.8;
      b.w1.rotation.z = f;
      b.w2.rotation.z = -f;
    }
    // caravans travel a loop between home and the school
    const s = ctx.school();
    for (const c of caravans) {
      if (!s) break;
      // (the pony stops while you're beside the cart)
      c.clock = (c.clock ?? t) + (near(c.g.position.x, c.g.position.z, 6) && ctx.world() === "outside" ? 0 : dt);
      const k = (Math.sin(c.clock * 0.012 + c.k * Math.PI) + 1) / 2;
      const x = s.x * k + (c.k ? 30 : -30) * Math.sin(k * Math.PI);
      const z = 6 + (s.z - 6) * k;
      const dk = Math.cos(c.clock * 0.012 + c.k * Math.PI);
      c.g.position.set(x, ctx.terrainHeight(x, z), z);
      c.g.rotation.y = Math.atan2(s.x, s.z - 6) + (dk < 0 ? Math.PI : 0);
      c.pony.userData.legs.forEach((l, i) => (l.rotation.x = (i % 3 === 0 ? 1 : -1) * Math.sin(t * 8) * 0.5));
    }
    // a beacon over the next project's giver
    beacon.visible = false;
    if (st.phase === 11) {
      const P = PROJECTS.find((p) => !p11.done[p.key] && giver(p));
      const L = P ? giver(P) : doneCount() >= 6 && where() === "everbough" ? { x: 9, z: -14, y: ctx.cityHeight(9, -14) } : null;
      const parent = where() === "everbough" ? ctx.cityGroup : where() === "roothaven" ? ctx.roothaven.group : where() === "forest" ? ctx.outsideGroup : ctx.world() === "city" ? ctx.city().group : null;
      if (L && parent) {
        if (beacon.parent !== parent) parent.add(beacon);
        beacon.visible = true;
        beacon.position.set(L.x, L.y, L.z);
      }
    }
  }

  // ---------- list + trail ----------
  const PLACE = { reedmere: "Reedmere", everbough: "Everbough", roothaven: "Roothaven", forest: "the school" };
  function panelHTML() {
    const rows = PROJECTS.map((P) => {
      const d = p11.done[P.key];
      const miss = d ? [] : missing(P);
      let stones = "";
      if (P.key === "library" && !d) {
        const L = CL().lore || {};
        stones = LORE_STONES.map(([city, titles]) => `<div class="sub">${city}</div>` + titles.map((t) => `<div class="sub ${L[t] ? "done" : ""}">&nbsp;&nbsp;${L[t] ? "✔" : "○"} ${t}</div>`).join("")).join("");
      }
      return `<li class="${d ? "done" : ""}">${d ? "✔" : "○"} ${P.icon} ${P.name}<br><span class="res">${P.who} · ${PLACE[P.where]}${miss.length ? " — needs " + miss.join(", ") : d ? "" : " — ready!"}</span>${stones}</li>`;
    });
    if (doneCount() >= 6) rows.push(`<li class="${p11.done.allianceDay ? "done" : "next"}">🏳️ Alliance Day — Elder Sage, Everbough</li>`);
    return `<h3>🌿 Restoring the Alliance (${doneCount()}/6)</h3><ul>${rows.join("")}</ul><div class="kit">🌙 K — travel the roads</div>`;
  }
  function goal() {
    if (st.phase !== 11 || ctx.world() !== "outside") return null;
    if (!p11.done.students) {
      const b = ctx.npcs.find((n) => n.key === "bramble");
      if (b) return { x: b.x, z: b.z };
    }
    return null;
  }
  return { update, interactable, panelHTML, goal, start: () => {
    redraw();
    ctx.say("🌿 Phase 11 — Restore the Great Canopy Alliance! Six projects in any order (see your list).", true);
  } };
}
