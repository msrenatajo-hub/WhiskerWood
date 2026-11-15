// ------------------------------------------------------------
//  🪨  PHASE 6 — "Roothaven"
//
//  Down the stairs behind the Moon Door… an underground city that never
//  stopped living. And the expedition — every one of them — safe.
//
//    🏮 Follow the lights down into Roothaven         (the reveal)
//    🫂 Find the expedition                            (the reunion!)
//    🪨 Meet the Root Speaker in Root Hall             (+ Reputation)
//    ⚙️ Open the three sluice gates on the river       (water systems)
//    🔥 Tell the Foundry Master — watch the wheel turn (+ Reputation)
//    📜 Visit the Archive Hall… "Everbough is real."   (+ Reputation)
//
//  Reputation: each Great City trusts you a little more as you help it —
//  st.rep.roothaven (★ stars). A golden beacon of light marks what's next.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";

export function initPhase6(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p6 ||= { started: false, done: {}, gates: {} };
  st.rep ||= {};
  const p6 = st.p6;
  const RH = ctx.roothaven;
  const me = () => ctx.mouseRig.position;
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const person = (key) => RH.people.find((p) => p.key === key);
  const headOf = (p) => [p.x, RH.height(p.x, p.z) + 0.65 * p.mesh.scale.x, p.z];
  const addRep = (n) => {
    st.rep.roothaven = Math.min(5, (st.rep.roothaven || 0) + n);
    save();
    redraw();
    ctx.say(`⭐ Roothaven trusts you more! (Reputation ${"★".repeat(st.rep.roothaven)}${"☆".repeat(5 - st.rep.roothaven)})`);
  };
  function complete(key, msg) {
    if (p6.done[key]) return;
    p6.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg);
  }

  // the expedition only shows up once you find them
  for (const p of RH.expedition) p.mesh.visible = !!p6.done.reunion;
  // the sluice gates you've already opened stay open
  for (const g of RH.gates) if (p6.gates[g.i]) g.board.position.y = 2.6;

  // ---------- talking (Roothaven's floor, not the forest's) ----------
  function talk(p, lines, after) {
    const m = me();
    p.mesh.userData.lookAt = m;
    ctx.mouseRig.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
    const dx = m.x - p.x;
    const dz = m.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = headOf(p);
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

  // ---------- 1. arrival: the reveal ----------
  function arrive() {
    const A = RH.spots.arrive;
    return playCutscene([
      { dur: 3.5, from: [A.x, 12, A.z - 4], to: [A.x, 9, A.z + 6], look: [0, 4, -40],
        text: "The stairs end. The tunnel widens. Warm air… golden light… the sound of water, and of voices." },
      { dur: 5, from: [A.x - 6, 26, A.z + 6], to: [-30, 34, -50], lookFrom: [0, 10, -30], lookTo: [0, 16, -5],
        text: "Below you, an entire city — built around the roots of a pine so old its top is lost in the dark." },
      { dur: 4, from: [100, 26, -30], to: [80, 14, 46], look: [10, 1, 34],
        text: "Stone bridges over glowing water. Hundreds of lanterns. Mice, everywhere, going about their day." },
      { dur: 3.4, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "This isn't a ruin. People still LIVE here." },
      { dur: 0.4, gameCam: true,
        end: () => {
          complete("arrive");
          write("ROOTHAVEN. A whole city under the forest — the one from the stone map. It's real. Mice live here. Lanterns everywhere.");
          ctx.say("🏮 Roothaven! The golden beacon shows where to go.", true);
        } },
    ]);
  }

  // ---------- 2. the reunion ----------
  function reunion() {
    for (const p of RH.expedition) p.mesh.visible = true;
    const clover = person("clover");
    const willow = person("willow");
    const C = RH.spots.hearth;
    for (const p of RH.expedition) p.mesh.userData.lookAt = me();
    return playCutscene([
      { dur: 2.6, from: [C.x + 9, 4, C.z + 9], look: [C.x, 1, C.z], who: "Clover", text: "…THISTLE?! IT'S THISTLE!!" },
      { dur: 3.2, from: headOf(clover).map((v, i) => v + [1.6, 0.4, 1.4][i]), look: headOf(clover), who: "Clover",
        text: "We thought the fox got you! We looked and looked — I kept your seat in class and EVERYTHING—" },
      { dur: 2.2, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "I found your scarf. I kept it safe for you." },
      { dur: 3.4, from: headOf(willow).map((v, i) => v + [1.8, 0.3, 1.6][i]), look: headOf(willow), who: "Teacher Willow",
        text: "Oh, Thistle. We searched for two whole days before the Hollow took us in. We never meant to leave you behind." },
      { dur: 3.4, from: headOf(willow).map((v, i) => v + [1.8, 0.3, 1.6][i]), look: headOf(willow), who: "Teacher Willow",
        text: "The mice of Roothaven found us on their stairs and welcomed us like family. The first surface mice in generations." },
      { dur: 3.2, from: [C.x + 7, 3, C.z - 7], look: [C.x, 1, C.z], who: "Master Tinker",
        text: "And they build things down here you wouldn't BELIEVE. Wheels, pumps, lifts… Go and meet the Root Speaker, lad. They'll want to know you." },
      { dur: 0.4, gameCam: true,
        end: () => {
          for (const p of RH.expedition) p.mesh.userData.lookAt = null;
          complete("reunion", "🫂 Everyone is safe. Every single one.");
          write("I FOUND THEM. All of them — Willow, Fern, Tinker, Clover, Hazel, Juniper, Sorrel, Wren, Tansy. Safe, in Roothaven. Clover cried. So did I.");
        } },
    ]);
  }

  // ---------- 6. the Archive: Everbough is real ----------
  function archiveReveal(sable) {
    const A = RH.spots.archive;
    return playCutscene([
      { dur: 3.2, from: headOf(sable).map((v, i) => v + [1.6, 0.4, 1.4][i]), look: headOf(sable), who: sable.name,
        text: "So you're the one who opened the Moon Door from the outside. Come — there's something every surface mouse should see." },
      { dur: 3.6, from: [A.x + 3, 6, A.z + 6], to: [A.x + 1.5, 4, A.z + 3], look: [A.x - 2, 2, A.z - 2],
        text: "Deep in the Archive, under glass, lies the oldest map in Roothaven — older than the city's oldest root." },
      { dur: 4.2, from: [A.x + 1.5, 4, A.z + 3], look: [A.x - 2, 2, A.z - 2], who: sable.name,
        text: "Five Great Cities, joined by the Moonkeepers' roads. Frostpine. Golden Hollow. Reedmere. Roothaven… and here, at the heart of it all—" },
      { dur: 3.8, from: [A.x + 1.5, 4, A.z + 3], look: [A.x - 2, 2, A.z - 2], who: sable.name,
        text: "—EVERBOUGH. The City of Knowledge, high in the branches of the greatest tree in the world." },
      { dur: 3.2, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "But… Everbough is just a story. Isn't it?" },
      { dur: 4, from: headOf(sable).map((v, i) => v + [1.6, 0.4, 1.4][i]), look: headOf(sable), who: sable.name,
        text: "So we thought, about the surface. Yet here you stand. If the surface is real, little one — so is Everbough." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 6 · Roothaven — complete." },
      { dur: 1, fadeIn: true, gameCam: true,
        end: () => {
          complete("archive");
          addRep(1);
          st.phase = 7;
          write("The oldest map in Roothaven shows FIVE Great Cities, all connected. And Everbough… Everbough is REAL. The cities forgot each other. Maybe they don't have to.");
          save();
          redraw();
          ctx.say("🌍 Phase 6 complete! Phase 7 — Reconnecting the World — is next.", true);
          if (api.onDone) setTimeout(api.onDone, 600);
        } },
    ]);
  }

  // ---------- 5. the wheel turns ----------
  function wheelTurns(cobble) {
    const W = RH.spots.wheel;
    return playCutscene([
      { dur: 3, from: headOf(cobble).map((v, i) => v + [1.6, 0.4, 1.4][i]), look: headOf(cobble), who: cobble.name,
        text: "All three sluices open? Then stand back, surface-mouse — and WATCH." },
      { dur: 4.4, from: [W.x - 14, 7, W.z + 10], to: [W.x - 10, 6, W.z + 8], look: [W.x, 4, W.z],
        text: "The river surges through the open gates. The great wheel shudders… creaks… and begins to TURN.",
        run: () => (p6.wheelOn = true) },
      { dur: 3.4, from: [W.x - 10, 6, W.z + 8], to: [W.x - 16, 14, W.z - 4], look: [W.x + 5, 14, W.z - 14],
        text: "Deep in the Foundry, hammers start to ring and the great chimney glows red-gold." },
      { dur: 3.6, from: headOf(cobble).map((v, i) => v + [1.6, 0.4, 1.4][i]), look: headOf(cobble), who: cobble.name,
        text: "Ha HA! The silt's been choking those gates for a season. You've a builder's paws. Here — every engineer needs one of these." },
      { dur: 2.8, from: () => [me().x - 1.4, me().y + 1, me().z - 1.1], look: () => [me().x, me().y + 0.5, me().z],
        text: "🔧 You received an Engineer's Wrench!" },
      { dur: 0.4, gameCam: true,
        end: () => {
          complete("foundry");
          p6.wrench = true;
          addRep(1);
          write("Opened the three sluice gates and the Foundry's great wheel turned again! Foundry Master Cobble gave me an Engineer's Wrench. Water does the work down here — clever.");
        } },
    ]);
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase < 6 || ctx.world() !== "roothaven") return null;
    const m = me();
    const near = (p, r = 2.6) => p && p.mesh.visible && Math.hypot(m.x - p.x, m.z - p.z) < r;
    // the sluice gates
    if (p6.done.speaker && !p6.done.gates) {
      for (const g of RH.gates) {
        if (p6.gates[g.i]) continue;
        if (Math.hypot(m.x - g.at.x, m.z - g.at.z) < 2.8) {
          return {
            label: "turn the sluice-gate wheel",
            act: () => {
              p6.gates[g.i] = true;
              ctx.bite();
              chime();
              // the board lifts out of the water
              let k = 0;
              const lift = setInterval(() => {
                k = Math.min(1, k + 0.05);
                g.board.position.y = -0.2 + k * 2.8;
                g.valve.rotation.x += 0.4;
                if (k >= 1) clearInterval(lift);
              }, 30);
              const n = Object.keys(p6.gates).length;
              if (n >= 3) complete("gates", "⚙️ All three sluices open! Go tell the Foundry Master.");
              else {
                save();
                redraw();
                ctx.say(`⚙️ The gate grinds up and the river rushes through. (${n}/3)`);
              }
            },
          };
        }
      }
    }
    const speaker = person("speaker");
    if (near(speaker)) {
      if (!p6.done.reunion) return { label: `talk to ${speaker.name}`, act: () => talk(speaker, [["", "A surface mouse! Your friends are in the Hearth District, child — go to them first. We can talk after."]]) };
      if (!p6.done.speaker) {
        return {
          label: `talk to ${speaker.name}`,
          act: () =>
            talk(speaker, [
              ["", "So. The mouse who walked through the Hollow ALONE, and opened the Moon Door from the outside."],
              ["", "I am Oriel, Root Speaker of the Council of Roots. Welcome to Roothaven. Strength below—"],
              ["you", "—light within. It was carved on the stone door in the tunnels!"],
              ["", "Then you already know us a little. Trust here is earned, not given. Our Foundry wheel has stopped — the river's sluice gates are choked with silt."],
              ["", "Open the three gates upstream, and tell Foundry Master Cobble. Do that, and Roothaven will remember you."],
            ], () => {
              complete("speaker", "🪨 Find the three sluice gates on the river — the beacon will guide you.");
              addRep(1);
              write("Met Root Speaker Oriel of the Council of Roots. Roothaven's Foundry wheel has stopped — I'm going to open the river's three sluice gates.");
            }),
        };
      }
      return { label: `talk to ${speaker.name}`, act: () => talk(speaker, [["", p6.done.archive ? "Five cities, once one. Perhaps, young Moonkeeper, they can be again." : "Roothaven remembers those who help it. Go on."]]) };
    }
    const cobble = person("foundry");
    if (near(cobble)) {
      if (p6.done.gates && !p6.done.foundry) return { label: `talk to ${cobble.name}`, act: () => wheelTurns(cobble) };
      return { label: `talk to ${cobble.name}`, act: () => talk(cobble, [["", p6.done.foundry ? "Listen to her sing! That wheel runs half the city." : "Wheel's stopped. Sluices upstream are silted shut. Can't leave the forge to fix 'em myself."]]) };
    }
    const sable = person("archivist");
    if (near(sable)) {
      if (p6.done.foundry && !p6.done.archive) return { label: `talk to ${sable.name}`, act: () => archiveReveal(sable) };
      return { label: `talk to ${sable.name}`, act: () => talk(sable, [["", p6.done.archive ? "The map will keep. Will the cities?" : "The Archive is for those Roothaven trusts. Help the city first, and come back."]]) };
    }
    // the expedition, after the reunion
    if (p6.done.reunion) {
      const lines = {
        willow: "A map is a memory you can carry — and Roothaven has the oldest memories of all.",
        fern: "Glowing moss gardens, mushroom farms… I could study down here for a hundred years.",
        tinker: "Did you SEE their water wheels? Pulleys! Lifts! I'll never go back to hammers.",
        clover: "I'm never letting you out of my sight again. Ever. Probably.",
        hazel: "My gran was RIGHT. She's going to be insufferable.",
        juniper: "My paw's all better. The Roothaven healers use glowing moss!",
        sorrel: "I drew a map of the whole city. I only got lost four times.",
        wren: "Five Great Cities… Everbough… Roothaven… I KNEW I'd remember them all.",
        tansy: "They let me hold a REAL engineer's wrench. Twice!",
      };
      for (const p of RH.expedition) {
        if (near(p, 2.2)) return { label: `talk to ${p.name}`, act: () => talk(p, [["", lines[p.key] || "Thistle!"]]) };
      }
    }
    // folk
    for (const p of RH.people) {
      if (p.role === "citizen" && near(p, 2)) {
        const say = ["A surface mouse! Mind the bridges — they're older than your forest.", "Strength below, light within, friend.", "Have you seen the Root Cathedral? Oh, you must.", "The Foundry wheel's been still all season. Bad luck, that."];
        return { label: "talk to the Roothaven mouse", act: () => talk(p, [["Roothaven mouse", say[Math.floor(p.x * 7 + 99) % say.length]]]) };
      }
    }
    return null;
  }

  // ---------- the guiding beacon ----------
  const beacon = new THREE.Group();
  {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc860, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(4);
    halo.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 30, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 15;
    beacon.add(halo, beam);
    beacon.userData = { halo, beam };
    RH.group.add(beacon);
  }
  function goal() {
    if (st.phase !== 6) return null;
    if (!p6.done.reunion) return RH.spots.hearth;
    if (!p6.done.speaker) return RH.spots.hall;
    if (!p6.done.gates) {
      const g = RH.gates.find((x) => !p6.gates[x.i]);
      return g ? g.at : null;
    }
    if (!p6.done.foundry) return RH.spots.foundry;
    if (!p6.done.archive) return RH.spots.archive;
    return null;
  }

  // test hook: ?story=p6&rh=1&p6at=reunion|speaker|gates|foundry|archive
  const devAt = new URLSearchParams(location.search).get("p6at");
  const ORDER = ["arrive", "reunion", "speaker", "gates", "foundry", "archive"];
  let devDone = !devAt;
  function devJump() {
    devDone = true;
    const i = ORDER.indexOf(devAt);
    ORDER.slice(0, Math.max(0, i)).forEach((k) => (p6.done[k] = true));
    if (p6.done.reunion) for (const p of RH.expedition) p.mesh.visible = true;
    if (p6.done.gates) for (const g of RH.gates) (p6.gates[g.i] = true), (g.board.position.y = 2.6);
    const spot = { arrive: RH.spots.arrive, reunion: RH.spots.hearth, speaker: RH.spots.hall, gates: RH.gates[0].at, foundry: RH.spots.foundry, archive: RH.spots.archive }[devAt];
    if (spot) {
      const x = spot.x + (devAt === "reunion" ? 14 : 3);
      const z = spot.z + 3;
      ctx.placePlayer(x, z, Math.atan2(spot.x - x, spot.z - z));
      ctx.mouseRig.position.y = RH.height(x, z);
    }
    save();
    redraw();
  }

  // ---------- each frame ----------
  function update(dt, t) {
    if (ctx.world() !== "roothaven") return;
    if (!devDone) devJump();
    const g = st.phase === 6 ? goal() : null;
    beacon.visible = !!g;
    if (g) {
      beacon.position.set(g.x, RH.height(g.x, g.z), g.z);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      beacon.userData.halo.material.opacity = 0.55 + pulse * 0.4;
      beacon.userData.beam.material.opacity = 0.18 + pulse * 0.16;
    }
    if (st.phase !== 6) return;
    if (!p6.started) {
      p6.started = true;
      save();
    }
    if (!p6.done.arrive && !ctx.playing()) arrive();
    // walking into the Hearth District finds them
    if (p6.done.arrive && !p6.done.reunion && !ctx.playing()) {
      const H = RH.spots.hearth;
      if (Math.hypot(me().x - H.x, me().z - H.z) < 12) reunion();
    }
  }

  // ---------- list ----------
  function panelHTML() {
    const row = (k, text) => `<li class="${p6.done[k] ? "done" : ""}">${p6.done[k] ? "✔" : "○"} ${text}</li>`;
    const n = Object.keys(p6.gates).length;
    const rep = st.rep.roothaven || 0;
    return `<h3>🪨 Roothaven</h3><ul>${[
      row("arrive", "Follow the lights down into Roothaven"),
      row("reunion", "Find the expedition"),
      row("speaker", "Meet the Root Speaker in Root Hall"),
      row("gates", `Open the three sluice gates (${n}/3)`),
      row("foundry", "Tell the Foundry Master"),
      row("archive", "Visit the Archive Hall"),
    ].join("")}</ul><div class="kit">Roothaven Reputation: ${"★".repeat(rep)}${"☆".repeat(5 - rep)}${p6.wrench ? " · 🔧 Wrench" : ""}</div>`;
  }

  return {
    update,
    interactable,
    goal,
    panelHTML,
    start: () => {
      p6.started = true;
      save();
      redraw();
    },
    wheelOn: () => !!p6.wheelOn || !!p6.done.foundry,
    get started() { return p6.started; },
  };
}
