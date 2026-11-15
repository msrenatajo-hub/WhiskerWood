// ------------------------------------------------------------
//  🐭  PHASE 10 — "Becoming a Moonkeeper"
//
//  You don't inherit the title. You EARN it — by reconnecting the Great
//  Cities, sharing knowledge and restoring trust.
//
//   🤝 1. Tokens of Trust   — each city's leader gives you their token
//   🌙 2. The Moonlit Vigil — at the reading rock in Moonstone Hollow,
//                             under the moon, the old Moonkeepers appear…
//                             and their founder, RENATA JOSEPHINE RUDY,
//                             the very first Moonkeeper, names her heir
//   🏛️ 3. The Ceremony      — at Everbough's Grand Library: the Moonkeeper's
//                             Cloak, and the old roads open from ANYWHERE (K)
//   ⚖️ 4. The First Duty    — settle the fish-for-grain quarrel between
//                             Reedmere and Golden Hollow (Frostpine's ice!)
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";

const FIRST_MOONKEEPER = "Renata Josephine Rudy";
const TOKENS = [
  ["roothaven", "🪨", "Root Speaker Oriel", "Roothaven's Root-and-Crystal token"],
  ["everbough", "🌳", "Elder Sage", "Everbough's Silver Leaf token"],
  ["reedmere", "🌊", "Harbormaster Brindle", "Reedmere's Reed-Knot token"],
  ["golden", "🌾", "Harvest-Mother Barley", "Golden Hollow's Wheat-Sheaf token"],
  ["frostpine", "❄️", "Warden Ivo", "Frostpine's Snowflake token"],
];
const DUTY = [
  ["d1", "reedmere", "Hear Harbormaster Brindle's side (Reedmere)"],
  ["d2", "golden", "Hear Harvest-Mother Barley's side (Golden Hollow)"],
  ["d3", "frostpine", "Ask Warden Ivo for Frostpine ice (Frostpine)"],
  ["d4", "reedmere", "Bring the ice crates to Brindle (Reedmere)"],
  ["d5", "golden", "Bring the deal to Barley (Golden Hollow)"],
];

export function initPhase10(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p10 ||= { done: {}, tokens: {} };
  const p10 = st.p10;
  const me = () => ctx.mouseRig.position;
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  function complete(key, msg) {
    if (p10.done[key]) return;
    p10.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg, true);
  }
  const allTokens = () => TOKENS.every(([k]) => p10.tokens[k]);
  const dutyStep = () => DUTY.find(([k]) => !p10.done[k]);
  const where = () => (ctx.world() === "city" ? ctx.city().id : ctx.world());

  // ---------- where each leader stands ----------
  function leader(cityId) {
    const w = where();
    if (w !== cityId) return null;
    if (cityId === "roothaven") {
      const p = ctx.roothaven.people.find((x) => x.key === "speaker");
      return p && { x: p.x, z: p.z, y: ctx.roothaven.height(p.x, p.z), p, H: ctx.roothaven.height };
    }
    if (cityId === "everbough") return { x: 9, z: -14, y: ctx.cityHeight(9, -14), H: ctx.cityHeight };
    const c = ctx.city();
    const key = { reedmere: "harbor", golden: "barley", frostpine: "ivo" }[cityId];
    const p = c.people[key];
    return { x: p.x, z: p.z, y: c.height(p.x, p.z), p, H: c.height };
  }
  const near = (x, z, r = 2.8) => Math.hypot(me().x - x, me().z - z) < r;
  const talkAt = (L, name, lines, after) => {
    if (L.p) L.p.mesh.userData.lookAt = me();
    const m = me();
    const dx = m.x - L.x;
    const dz = m.z - L.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = [L.x, L.y + 0.75, L.z];
    return playCutscene(
      lines.map(([who, text], i) => ({
        dur: 2.4,
        from: who === "you" ? [L.x - ux * 1.4 + uz * 0.8, L.y + 1.2, L.z - uz * 1.4 - ux * 0.8] : [m.x + ux * 1.6 - uz * 0.8, m.y + 1.1, m.z + uz * 1.6 + ux * 0.8],
        look: who === "you" ? [m.x, m.y + 0.6, m.z] : head,
        who: who === "you" ? "Thistle" : name,
        text,
        end: i === lines.length - 1 ? () => {
          if (L.p) L.p.mesh.userData.lookAt = null;
          if (after) after();
        } : undefined,
      }))
    );
  };

  // ---------- 1. tokens ----------
  const TOKEN_LINES = {
    roothaven: "Strength below, light within. Roothaven would follow you into the dark — and back out again. Take our token.",
    everbough: "The Library has argued for a week about what you are. I say: you are what the old books call a Moonkeeper. Take Everbough's leaf.",
    reedmere: "You lit our lighthouse and taught a city of boats to find its way again. Reedmere's knot is yours, friend.",
    golden: "You fed the Feast and the Feast feeds the world. Here, love — Golden Hollow's sheaf, with all our hearts.",
    frostpine: "You climbed the ice and lit the Beacon. In Frostpine that's enough to trust a mouse forever. Our snowflake.",
  };
  function tokenInteract() {
    for (const [k, icon, name, token] of TOKENS) {
      if (p10.tokens[k]) continue;
      const L = leader(k);
      if (!L || !near(L.x, L.z)) continue;
      const rep = (st.rep || {})[k] || 0;
      if (rep < 3) {
        return { label: `talk to ${name}`, act: () => talkAt(L, name, [["", `${name.split(" ").pop()} smiles kindly. "We don't know you well enough yet, traveler. Help us a little more — our events, our adventures — and come back." (Reputation ${rep}/3)`]]) };
      }
      return { label: `talk to ${name}`, act: () => talkAt(L, name, [
        ["", `Thistle. Word travels fast on the old roads now — they say the cities want to name you something no mouse has been called in a hundred years.`],
        ["", TOKEN_LINES[k]],
      ], () => {
        p10.tokens[k] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(p10.tokens).length;
        ctx.say(n >= 5 ? `${icon} ${token}! All five tokens — take them to the reading rock in Moonstone Hollow, under the moon.` : `${icon} You received ${token}! (${n}/5)`, true);
        write(`${name} gave me ${token}.`);
        if (n >= 5) complete("tokens");
      }) };
    }
    return null;
  }

  // ---------- 2. the vigil ----------
  let ghosts = null;
  function makeGhosts(cx, cy, cz) {
    const g = new THREE.Group();
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending });
    const fig = (x, z, s, face) => {
      const m = buildThistle({ tunicColor: 0x9fd8ff, hoodColor: 0x9fd8ff, pack: false });
      m.traverse((o) => o.isMesh && (o.material = ghostMat));
      m.scale.setScalar(s);
      m.position.set(x, cy, z);
      m.rotation.y = face;
      g.add(m);
      return m;
    };
    const figs = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      figs.push(fig(cx + Math.cos(a) * 3.2, cz + Math.sin(a) * 3.2, 1, Math.atan2(-Math.cos(a), -Math.sin(a))));
    }
    const renata = fig(cx, cz - 0.01, 1.25, 0);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbfe6ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(4);
    halo.position.set(cx, cy + 1, cz);
    g.add(halo);
    g.visible = false;
    ctx.outsideGroup.add(g);
    return { g, figs, renata };
  }
  function vigil() {
    const J = ctx.journalPos;
    const y = ctx.terrainHeight(J.x, J.z);
    if (!ghosts) ghosts = makeGhosts(J.x + 3, y, J.z + 3);
    const night = ctx.dayTime() > 0.7 || ctx.dayTime() < 0.22;
    const R = ghosts.renata;
    const rhead = () => [R.position.x, R.position.y + 1.0, R.position.z];
    const rcam = () => [R.position.x + 2.6, R.position.y + 1.6, R.position.z + 2.6];
    return playCutscene([
      !night && { dur: 1.2, fadeOut: true, gameCam: true },
      !night && { dur: 3, black: true, gameCam: true, text: "You sit by the reading rock and wait for the moon…", run: () => ctx.setTime(0.82) },
      !night && { dur: 1, fadeIn: true, gameCam: true },
      { dur: 3.4, from: [J.x + 8, y + 4, J.z + 8], look: [J.x + 3, y + 1, J.z + 3],
        text: "You lay the five tokens on the reading rock. Root, leaf, knot, sheaf and snowflake…" },
      { dur: 3.6, from: [J.x + 8, y + 4, J.z + 8], to: [J.x + 7, y + 3, J.z + 7], look: [J.x + 3, y + 1, J.z + 3],
        text: "…and the moonlight pours down through the Hollow, and the tokens begin to glow.",
        run: () => (ghosts.g.visible = true),
        update: (k) => ghosts.g.children.forEach((c) => c.isSprite && (c.material.opacity = 0.3 + k * 0.6)) },
      { dur: 3.6, from: [J.x + 12, y + 6, J.z + 12], look: [J.x + 3, y + 1, J.z + 3],
        text: "Shapes of silver light rise all around you — mice, in hooded cloaks, carrying lanterns. The Moonkeepers." },
      { dur: 3.6, from: rcam, look: rhead, who: FIRST_MOONKEEPER,
        text: `Do not be afraid, little one. My name is ${FIRST_MOONKEEPER}. I was the first of the Moonkeepers.` },
      { dur: 4.4, from: rcam, look: rhead, who: FIRST_MOONKEEPER,
        text: "Long, long ago, the cities were strangers. I walked the very first road between Everbough and Roothaven with nothing but a lantern, a map, and a promise." },
      { dur: 4.2, from: rcam, look: rhead, who: FIRST_MOONKEEPER,
        text: "We swore to carry letters, seeds and stories wherever mice lived — so no city would ever be alone in the dark." },
      { dur: 4, from: rcam, look: rhead, who: FIRST_MOONKEEPER,
        text: "When the last of us was gone, the roads fell silent. A hundred years we have waited for someone to walk them again." },
      { dur: 3, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle", text: "…That was me?" },
      { dur: 4.4, from: rcam, look: rhead, who: FIRST_MOONKEEPER,
        text: "That was you. Five cities have trusted you with their hearts. The moon remembers. Go to the Grand Library — and let them call you what you already are." },
      { dur: 3.4, from: [J.x + 8, y + 4, J.z + 8], to: [J.x + 6, y + 14, J.z + 6], look: [J.x + 3, y + 3, J.z + 3],
        text: "The silver figures fade into the moonlight… all but a warm glow in the five tokens.",
        update: (k) => ghosts.g.traverse((o) => o.material && (o.material.opacity = 0.45 * (1 - k))),
        end: () => {
          ghosts.g.visible = false;
          complete("vigil", "🏛️ Go to the Grand Library in Everbough.");
          write(`Under the moon in Moonstone Hollow I met ${FIRST_MOONKEEPER} — the FIRST Moonkeeper, who walked the very first road between Everbough and Roothaven. She called me her heir.`);
        } },
    ].filter(Boolean));
  }

  // ---------- 3. the ceremony ----------
  let ceremonyFolk = null;
  function ceremony() {
    const H = ctx.cityHeight;
    const C = { x: 0, z: -30 };
    if (!ceremonyFolk) {
      ceremonyFolk = [];
      const guests = [
        [0x3e4a58, 1.15], [0xd8d0c0, 1.12], [0x3a6a7a, 1.1], [0xa8783a, 1.1], [0x5a6a8a, 1.1], [0x6a6a72, 1.12], [0x5d4a38, 1.05],
      ];
      guests.forEach(([c, s], i) => {
        const a = Math.PI * 0.15 + (i / (guests.length - 1)) * Math.PI * 0.7;
        const x = C.x + Math.cos(a) * 6;
        const z = C.z - 6 + Math.sin(a) * 6 + 6;
        const m = buildThistle({ tunicColor: c, hoodColor: c, pack: false });
        m.scale.setScalar(s);
        m.position.set(x, H(x, z), z);
        m.rotation.y = Math.atan2(C.x - x, C.z - z);
        ctx.cityGroup.add(m);
        ceremonyFolk.push(m);
      });
    }
    ctx.placePlayer(C.x, C.z, Math.PI);
    const y = H(C.x, C.z);
    return playCutscene([
      { dur: 3.6, from: [C.x + 18, y + 10, C.z + 22], to: [C.x + 8, y + 4, C.z + 10], look: [C.x, y + 2, C.z - 8],
        text: "The whole of Everbough fills the steps of the Grand Library. Leaders from all five Great Cities stand together." },
      { dur: 3.6, from: [C.x + 2, y + 1.8, C.z + 3], look: [C.x, y + 0.8, C.z - 2], who: "Head Librarian Quill",
        text: `The first book in this Library was written in the paw of ${FIRST_MOONKEEPER}. For a hundred years, no one has been worthy to write in it again.` },
      { dur: 3.6, from: [C.x + 2, y + 1.8, C.z + 3], look: [C.x, y + 0.8, C.z - 2], who: "Root Speaker Oriel",
        text: "Roothaven, Everbough, Reedmere, Golden Hollow, Frostpine — five cities, one voice." },
      { dur: 4, from: [C.x - 3, y + 1.6, C.z + 2.5], look: () => [me().x, me().y + 0.6, me().z], who: "Elder Sage",
        text: "Thistle Mosswhisker of the Fallen Log School: rise, as the first Moonkeeper in a hundred years." },
      { dur: 3.4, from: () => [me().x + 1.8, me().y + 1.2, me().z + 1.8], look: () => [me().x, me().y + 0.6, me().z],
        text: "A cloak the color of moonlit water settles on your shoulders. 🌙",
        run: () => ctx.setCloak(true) },
      { dur: 4, from: [C.x + 6, y + 3, C.z + 8], to: [C.x + 14, y + 14, C.z + 18], look: [C.x, y + 2, C.z - 4],
        text: "And the cheer that went up shook every leaf in Everbough." },
      { dur: 0.4, gameCam: true,
        end: () => {
          st.moonkeeper = true;
          complete("ceremony", "🌙 You are a MOONKEEPER! Press K anywhere to travel the old roads. Your first duty awaits in Reedmere…");
          write("I am a Moonkeeper. The first in a hundred years — the first since Renata Josephine Rudy's line ended. My cloak is the color of moonlit water.");
        } },
    ]);
  }

  // ---------- 4. the first duty ----------
  const DUTY_TALK = {
    d1: ["Harbormaster Brindle", [
      ["", "Moonkeeper! Thank the tides. Golden Hollow wants our fish for their grain — but by the time it gets there it's spoiled, and they won't pay!"],
      ["", "And they say our nets are too dear. Hmph! Go and talk sense into them, would you?"],
    ]],
    d2: ["Harvest-Mother Barley", [
      ["", "Oh, love, it's a mess. Reedmere's fish arrives smelling like a boot! We can't feed THAT to the Feast."],
      ["", "If only there were a way to keep it cold all the way here…"],
      ["you", "…Cold. Frostpine!"],
    ]],
    d3: ["Warden Ivo", [
      ["", "Ice? Little one, we have more ice than we know what to do with. Crates of it!"],
      ["", "Take these ice crates to Reedmere — packed in ice, their fish will stay fresh all the way to the plains."],
    ]],
    d4: ["Harbormaster Brindle", [
      ["", "Ice crates from FROSTPINE? Packed in snow and sawdust… why, the fish would arrive fresher than it left!"],
      ["", "Tell Barley: fish in ice for her grain — fair and square. And Frostpine gets a share of both for the ice!"],
    ]],
    d5: ["Harvest-Mother Barley", [
      ["", "Fresh fish, packed in Frostpine ice, for our grain… and the ice-folk get bread and fish besides?"],
      ["", "Done! Three cities, one bargain. That's what a Moonkeeper's for, isn't it?"],
    ]],
  };
  // which duty steps can be done right now (not a strict order: hear both
  // sides in any order; Ivo once you've heard one; then back to each)
  const DUTY_NEEDS = { d1: [], d2: [], d3: [["d1", "d2"]], d4: [["d3"]], d5: [["d4"]] };
  const dutyOpen = (k) => !p10.done[k] && DUTY_NEEDS[k].every((any) => any.some((n) => p10.done[n]));
  function dutyInteract() {
    const step = DUTY.find(([k, cityId]) => {
      if (!dutyOpen(k)) return false;
      const L = leader(cityId);
      return L && near(L.x, L.z);
    });
    if (!step) return null;
    const [key, cityId] = step;
    const L = leader(cityId);
    const [name, lines] = DUTY_TALK[key];
    return { label: `talk to ${name}`, act: () => talkAt(L, name, lines, () => {
      p10.done[key] = true;
      save();
      redraw();
      chime();
      if (key === "d3") ctx.say("🧊 Ice crates! Take them to Brindle in Reedmere (press K to travel).", true);
      if (DUTY.every(([k]) => p10.done[k])) finishPhase();
      else if (key !== "d3") {
        const next = DUTY.find(([k]) => dutyOpen(k));
        if (next) ctx.say(`⚖️ Next: ${next[2]}`, true);
      }
    }) };
  }
  function finishPhase() {
    write("My first duty as Moonkeeper: fish packed in Frostpine ice, for Golden Hollow's grain. Three cities, one bargain.");
    for (const k of ["reedmere", "golden", "frostpine"]) {
      st.rep ||= {};
      st.rep[k] = Math.min(5, (st.rep[k] || 0) + 1);
    }
    return playCutscene([
      { dur: 1.2, fadeOut: true, gameCam: true },
      { dur: 3.6, black: true, gameCam: true, text: "And so the first caravan in a hundred years set out along the old roads — fish, grain and ice, city to city." },
      { dur: 3.6, black: true, gameCam: true, text: "Behind it walked a small mouse in a cloak the color of moonlit water." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 10 · Becoming a Moonkeeper — complete." },
      { dur: 1.2, fadeIn: true, gameCam: true, end: () => {
        p10.done.duty = true;
        st.phase = 11;
        save();
        redraw();
        ctx.say("🌿 Phase 10 complete! Phase 11 — Restoring the Great Canopy Alliance — is next.", true);
        if (api.onDone) setTimeout(api.onDone, 600);
      } },
    ]);
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase !== 10) return null;
    if (!p10.done.tokens) return tokenInteract();
    if (!p10.done.vigil) {
      const J = ctx.journalPos;
      if (ctx.world() === "outside" && near(J.x, J.z, 3.5)) return { label: "lay the five tokens on the reading rock", act: vigil };
      return null;
    }
    if (!p10.done.ceremony) {
      if (ctx.world() === "everbough" && near(0, -40, 7)) return { label: "climb the steps of the Grand Library", act: ceremony };
      return null;
    }
    return dutyInteract();
  }

  // ---------- where next ----------
  function target() {
    if (st.phase !== 10) return null;
    const w = where();
    if (!p10.done.tokens) {
      const t = TOKENS.find(([k]) => !p10.tokens[k] && k === w);
      if (t) {
        const L = leader(t[0]);
        return L && { x: L.x, z: L.z, here: true };
      }
      return { travel: true };
    }
    if (!p10.done.vigil) {
      if (w === "outside") return ctx.isHollow(me().x, me().z) ? { ...ctx.journalPos, here: true } : { ...ctx.hollowDoor.outside, here: true };
      return { travel: true };
    }
    if (!p10.done.ceremony) return w === "everbough" ? { x: 0, z: -36, here: true } : { travel: true };
    const open = DUTY.filter(([k]) => dutyOpen(k));
    if (!open.length) return null;
    const hereStep = open.find(([, c]) => c === w);
    if (hereStep) {
      const L = leader(hereStep[1]);
      return L && { x: L.x, z: L.z, here: true };
    }
    return { travel: true };
  }
  function goal() {
    if (ctx.world() !== "outside") return null;
    const t = target();
    if (!t) return null;
    if (t.here) return t;
    return ctx.nearestStation();
  }
  const beacon = new THREE.Group();
  {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbfe6ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(4);
    h.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 20;
    beacon.add(h, beam);
    beacon.userData = { h, beam };
  }
  let restored = false;
  let finishing = false;
  function update(dt, t) {
    if (st.phase < 10 || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      if (new URLSearchParams(location.search).get("p10at") === "duty") {
        // (test) tokens, vigil + ceremony done — straight to the first duty
        for (const [k] of TOKENS) p10.tokens[k] = true;
        Object.assign(p10.done, { tokens: true, vigil: true, ceremony: true });
        st.moonkeeper = true;
        save();
        redraw();
      }
      if (st.moonkeeper) ctx.setCloak(true);
    }
    // safety net: every duty step done but the phase never finished? finish it now
    if (st.phase === 10 && p10.done.ceremony && !p10.done.duty && DUTY.every(([k]) => p10.done[k]) && !ctx.playing() && !finishing) {
      finishing = true;
      finishPhase();
    }
    // the beacon (in whichever city you're in)
    const tg = st.phase === 10 ? target() : null;
    const w = where();
    const parent = w === "everbough" ? ctx.cityGroup : w === "roothaven" ? ctx.roothaven.group : ctx.world() === "city" ? ctx.city().group : null;
    if (tg && tg.here && parent) {
      if (beacon.parent !== parent) parent.add(beacon);
      const H = w === "everbough" ? ctx.cityHeight : w === "roothaven" ? ctx.roothaven.height : ctx.city().height;
      beacon.visible = true;
      beacon.position.set(tg.x, H(tg.x, tg.z), tg.z);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      beacon.userData.h.material.opacity = 0.55 + pulse * 0.4;
      beacon.userData.beam.material.opacity = 0.2 + pulse * 0.16;
    } else beacon.visible = false;
  }

  // ---------- the list ----------
  function panelHTML() {
    const row = (done, text, cur) => `<li class="${done ? "done" : cur ? "next" : "sub"}">${done ? "✔" : "○"} ${text}</li>`;
    const rows = [];
    rows.push(row(p10.done.tokens, `🤝 Tokens of Trust (${Object.keys(p10.tokens).length}/5)`, !p10.done.tokens));
    if (!p10.done.tokens) for (const [k, icon, name] of TOKENS) rows.push(`<li class="sub ${p10.tokens[k] ? "done" : ""}">${p10.tokens[k] ? "✔" : "○"} ${icon} ${name}</li>`);
    rows.push(row(p10.done.vigil, "🌙 The Moonlit Vigil — the reading rock in Moonstone Hollow", p10.done.tokens && !p10.done.vigil));
    rows.push(row(p10.done.ceremony, "🏛️ The Ceremony — the Grand Library, Everbough", p10.done.vigil && !p10.done.ceremony));
    rows.push(row(p10.done.duty, "⚖️ Your first duty as Moonkeeper", p10.done.ceremony && !p10.done.duty));
    if (p10.done.ceremony && !p10.done.duty) for (const [k, , label] of DUTY) rows.push(`<li class="sub ${p10.done[k] ? "done" : ""}">${p10.done[k] ? "✔" : dutyOpen(k) ? "➤" : "○"} ${label}</li>`);
    return `<h3>🐭 Becoming a Moonkeeper</h3><ul>${rows.join("")}</ul><div class="kit">${st.moonkeeper ? "🌙 Moonkeeper — press K to travel the roads from anywhere" : "Travel: E at waystones & Moonkeeper stations"}</div>`;
  }

  return { update, interactable, goal, panelHTML, isMoonkeeper: () => !!st.moonkeeper, start: () => {
    redraw();
    ctx.say("🐭 Phase 10 — Becoming a Moonkeeper. Gather a Token of Trust from the leader of each Great City.", true);
  } };
}
