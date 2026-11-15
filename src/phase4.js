// ------------------------------------------------------------
//  🗺️  PHASE 4 — "Exploring the Great Forest"
//
//  No levels, no XP. What you KNOW and what you can DO opens the world.
//  Willow's journal said the way in is behind the water — but it's pitch
//  black back there, and the cliffs are sheer. Time to explore, learn,
//  and make the gear an explorer needs.
//
//    🌲 Discover the seven regions of the Great Forest
//    🪨 Find the four Moonkeeper standing stones (each carving hints at gear)
//    🏕️ Find the giants' summer campsite (string! cloth! buttons!)
//    🛠️ Make your explorer's gear at home — each piece is a NEW ABILITY:
//         🪢 Root Rope        → Better Rope: haul yourself up steep cliffs
//         🧗 Climbing Spikes  → Climbing Claws: climb trunks fast, all the way up
//         🏮 Glow Lantern     → Stronger Lantern: light the dark (and the Hollow)
//         🎒 Travel Backpack  → Better Backpack: carry 40 of everything
//    🌊 Return to the Great Falls and step behind the BOTTOM waterfall…
//
//  The abilities live in st.abilities, so they work in every phase.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";

const REGIONS = [
  ["meadow", "the Meadow", "Never cross the Meadow at noon — the sky hunters watch."],
  ["pine", "the Pine Forest", "Needles soften your steps. Stealth works both ways here."],
  ["aspen", "the Aspen Forest", "The pale trees tremble and whisper. Old mice say spirits live here."],
  ["wildflower", "the Wildflower Patch", "A jungle of blooms. The bees remember faces."],
  ["tallgrass", "the Tall Grass", "Stay still when the grass stops moving."],
  ["berry", "the Berry Bushes", "The sweetest berries grow where danger hunts."],
  ["creek", "the Crossable Creek", "Fast water steals careless paws."],
];
export const GEAR = {
  "Root Rope": { key: "rope", icon: "🪢", ability: "Better Rope", what: "haul yourself up steep cliffs" },
  "Climbing Spikes": { key: "spikes", icon: "🧗", ability: "Climbing Claws", what: "climb trunks fast — all the way to the top" },
  "Glow Lantern": { key: "lantern", icon: "🏮", ability: "Stronger Lantern", what: "light up dark places, even behind the falls" },
  "Travel Backpack": { key: "pack", icon: "🎒", ability: "Better Backpack", what: "carry 40 of every material (instead of 12)" },
};
// the four standing stones: biome, and what each carving says
const STONES = [
  ["pine", "Roots hold what water cannot. Braid them — and climb the stone the water falls from."],
  ["aspen", "Thorn and beetle-armor make claws for small paws. Climb as high as the owls."],
  ["wildflower", "Light lives in the fireflies of the night meadow. Carry it in a lantern, and the dark will open its door."],
  ["tallgrass", "A traveler carries much. The giants camp at the forest's edge — they leave thread and cloth behind."],
];

export function initPhase4(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p4 ||= { started: false, done: {}, regions: {}, stones: {} };
  st.abilities ||= {};
  const p4 = st.p4;
  const me = () => ctx.mouseRig.position;
  const write = (text) => {
    if (st.p2) st.p2.journal.push(text);
    save();
  };
  const has = (k) => !!st.abilities[k];

  // ---------- where the stones stand ----------
  function pickStones() {
    p4.stonesAt = STONES.map(([biome], i) => {
      // somewhere well inside that biome, spread around the world…
      const a = i * 1.7 + 0.6;
      const from = { x: Math.cos(a) * 300, z: Math.sin(a) * 300 };
      const spot = ctx.nearestBiomeSpot(biome, from) || from;
      // …in a little clearing: walk outward until no tree, rock or water is close
      for (let r = 0; r < 60; r += 2) {
        for (let k = 0; k < 12; k++) {
          const x = spot.x + Math.cos(k * 0.52 + r) * r;
          const z = spot.z + Math.sin(k * 0.52 + r) * r;
          if (ctx.isClear(x, z, 4.5) && !ctx.isWater(x, z)) return { x, z };
        }
      }
      return spot;
    });
    p4.stonesV = 2; // placement version (older saves get re-placed)
    save();
  }
  const stoneMeshes = [];
  function placeStones() {
    if (stoneMeshes.length) return;
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8a82, flatShading: true });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, side: THREE.DoubleSide });
    const hollowMat = new THREE.MeshStandardMaterial({ color: 0x4a4a46, flatShading: true });
    const moonGeo = crescentGeometry(0.62, 0.34);
    const starGeo = starGeometry(0.11);
    p4.stonesAt.forEach((at, i) => {
      const g = new THREE.Group();
      // stand on the LOWEST ground under its footprint, bedded in — never floating
      const y = Math.min(
        ctx.terrainHeight(at.x, at.z),
        ctx.terrainHeight(at.x + 0.9, at.z), ctx.terrainHeight(at.x - 0.9, at.z),
        ctx.terrainHeight(at.x, at.z + 0.9), ctx.terrainHeight(at.x, at.z - 0.9)
      );
      g.position.set(at.x, y, at.z);
      g.rotation.y = i * 0.9;
      if (ctx.addSolid) ctx.addSolid(at.x, at.z, 0.9); // (solid stone)
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 0.7, 1, 3, 1), stoneMat);
      slab.position.y = 1.7; // 0.4 of it is underground
      slab.rotation.z = 0.04;
      g.add(slab);
      // the carving: a dark round hollow, a glowing crescent moon, two stars
      const dish = new THREE.Mesh(new THREE.CircleGeometry(0.78, 24), hollowMat);
      dish.position.set(0, 0.55, 0.352);
      slab.add(dish);
      const moon = new THREE.Mesh(moonGeo, runeMat);
      moon.position.set(-0.05, 0.55, 0.358);
      moon.rotation.z = 0.35; // tipped, like a waxing moon
      slab.add(moon);
      for (const [sx, sy, sc] of [[0.42, 0.95, 1], [0.5, 0.3, 0.7]]) {
        const star = new THREE.Mesh(starGeo, runeMat);
        star.position.set(sx, sy, 0.358);
        star.scale.setScalar(sc);
        slab.add(star);
      }
      // a ring of tiny runes around the edge
      for (let k = 0; k < 10; k++) {
        const ra = (k / 10) * Math.PI * 2;
        const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.13), runeMat);
        rune.position.set(Math.cos(ra) * 0.9, 0.55 + Math.sin(ra) * 0.9, 0.356);
        rune.rotation.z = ra;
        slab.add(rune);
      }
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 4).scale(1.4, 0.35, 0.8), new THREE.MeshStandardMaterial({ color: 0x4e6a38, flatShading: true }));
      moss.position.set(0, 3.75, 0);
      g.add(moss);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9fd8ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(2.4);
      sp.position.y = 2.2;
      g.add(sp);
      g.userData = { i, sp, moon };
      ctx.outsideGroup.add(g);
      stoneMeshes.push(g);
    });
  }

  // ---------- start ----------
  function start() {
    if (!p4.stonesAt || p4.stonesV !== 2) pickStones();
    placeStones();
    p4.started = true;
    save();
    redraw();
    write("Willow went behind the falls — but it's black as a burrow back there, and the cliffs are sheer. I need to learn this forest, and make real explorer's gear.");
    ctx.say("🗺️ Phase 4 — explore the Great Forest! Your list (top right) shows what to find.", true);
  }

  // ---------- reading a standing stone ----------
  function readStone(i) {
    const at = p4.stonesAt[i];
    const y = ctx.terrainHeight(at.x, at.z);
    const [biome, words] = STONES[i];
    return playCutscene([
      { dur: 3, from: [at.x + 4, y + 2.5, at.z + 4], to: [at.x + 2.2, y + 2, at.z + 2.2], look: [at.x, y + 2, at.z],
        text: "A standing stone, older than any tree. A crescent moon is carved on its face." },
      { dur: 4.5, from: [at.x + 2.2, y + 2, at.z + 2.2], look: [at.x, y + 2.2, at.z], who: "The Moonkeepers' carving", text: `“${words}”` },
      { dur: 0.4, gameCam: true,
        end: () => {
          p4.stones[i] = true;
          stoneMeshes[i].userData.sp.material.opacity = 0.12;
          write(`A Moonkeeper stone in ${REGIONS.find((r) => r[0] === biome)[1]}: “${words}”`);
          const n = Object.keys(p4.stones).length;
          save();
          redraw();
          chime();
          ctx.say(n >= 4 ? "🪨 All four Moonkeeper stones found!" : `🪨 Moonkeeper stone ${n}/4. Its words are in your journal (J).`);
          check();
        } },
    ]);
  }

  // ---------- step behind the falls ----------
  let finale = false;
  function behindTheFalls() {
    finale = true;
    const H = ctx.hollow;
    const y = ctx.terrainHeight(H.x, H.z);
    return playCutscene([
      { dur: 3.5, from: () => [me().x - 2, me().y + 1.4, me().z - 2], look: () => [H.x, y + 2, H.z],
        text: "You climb up out of the passage behind the bottom falls, Glow Lantern raised. The dark gives way…" },
      { dur: 4, from: [H.x + 6, y + 4, H.z + 6], to: [H.x + 3, y + 2.5, H.z + 3], look: [H.x, y + 1.5, H.z],
        text: "…to a cavern that glows — crystals, moss, and petals shining like the moon." },
      { dur: 3.4, from: () => [me().x - 1.5, me().y + 1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "Moonstone Hollow. Willow was right. They came through here." },
      { dur: 4, from: [H.x + 4, y + 8, H.z + 4], to: [H.x + 2, y + 16, H.z + 2], look: [H.x, y, H.z],
        who: "WhiskerWood", text: "Phase 4 · Exploring the Great Forest — complete." },
      { dur: 0.4, gameCam: true,
        end: () => {
          p4.done.falls = true;
          st.phase = 5;
          write("I found the way behind the falls. Moonstone Hollow — glowing, silent, ancient. Nobody has been here in centuries… except the expedition.");
          save();
          redraw();
          ctx.say("🌙 Phase 4 complete! Phase 5 — Moonstone Hollow — awaits.", true);
          if (api.onDone) setTimeout(api.onDone, 600);
        } },
    ]);
  }

  // ---------- progress ----------
  function regionsFound() {
    return REGIONS.filter(([k]) => p4.regions[k]).length;
  }
  function gearCount() {
    return Object.values(GEAR).filter((g) => has(g.key)).length;
  }
  function check() {
    if (!p4.done.regions && regionsFound() >= REGIONS.length) {
      p4.done.regions = true;
      chime();
      ctx.say("🗺️ You've explored every region of the Great Forest!");
    }
    if (!p4.done.stones && Object.keys(p4.stones).length >= 4) p4.done.stones = true;
    if (!p4.done.gear && gearCount() >= 4) {
      p4.done.gear = true;
      ctx.say("🛠️ A real explorer's kit! Now — back to the Great Falls.", true);
    }
    save();
    redraw();
  }

  // ---------- hooks ----------
  /** Crafting any gear grants its ability — in any phase. */
  function onCraft(name) {
    const g = GEAR[name];
    if (!g || has(g.key)) return;
    st.abilities[g.key] = true;
    save();
    chime();
    ctx.say(`${g.icon} New ability: ${g.ability}! You can now ${g.what}.`, true);
    write(`Made a ${name}. ${g.ability}: I can ${g.what}.`);
    if (st.phase === 4) check();
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase < 4 || !p4.stonesAt || ctx.world() !== "outside") return null;
    const m = me();
    for (let i = 0; i < stoneMeshes.length; i++) {
      const at = p4.stonesAt[i];
      if (Math.hypot(m.x - at.x, m.z - at.z) < 3) {
        return { label: p4.stones[i] ? "read the stone again" : "read the Moonkeeper carving", act: () => readStone(i) };
      }
    }
    return null;
  }

  // ---------- each frame ----------
  let restored = false;
  let lastRegionCheck = 0;
  const devAt = new URLSearchParams(location.search).get("p4at");
  function update(dt, t) {
    if (st.phase < 4 || !ctx.school() || !ctx.quadMouse()) return;
    if (!restored) {
      restored = true;
      if (!p4.stonesAt || p4.stonesV !== 2) pickStones();
      placeStones();
      if (devAt === "falls") {
        for (const g of Object.values(GEAR)) st.abilities[g.key] = true;
        for (const [k] of REGIONS) p4.regions[k] = true;
        for (let i = 0; i < 4; i++) p4.stones[i] = true;
        p4.done = { regions: true, stones: true, camp: true, gear: true };
        p4.started = true;
        if (ctx.world() !== "outside") ctx.goOutside();
        const H = ctx.hollow;
        ctx.placePlayer(H.x + (H.x > 0 ? -1 : 1) * 30, H.z + (H.z > 0 ? -1 : 1) * 30, 0);
      } else if (devAt && devAt.startsWith("stone")) {
        // ?p4at=stone2 → stand in front of stone 2's carved face
        p4.started = true;
        if (ctx.world() !== "outside") ctx.goOutside();
        const i = Math.max(0, (parseInt(devAt.slice(5), 10) || 1) - 1);
        const at = p4.stonesAt[i];
        const fx = Math.sin(i * 0.9);
        const fz = Math.cos(i * 0.9);
        ctx.placePlayer(at.x + fx * 4.5, at.z + fz * 4.5, Math.atan2(-fx, -fz));
      }
      save();
      redraw();
    }
    for (const g of stoneMeshes) {
      if (!p4.stones[g.userData.i]) g.userData.sp.material.opacity = 0.3 + Math.sin(t * 2 + g.userData.i) * 0.15;
    }
    if (st.phase !== 4 || !p4.started || ctx.world() !== "outside") return;
    const m = me();
    // discover regions as you wander into them (checked a few times a second)
    if (t - lastRegionCheck > 0.4) {
      lastRegionCheck = t;
      let here = ctx.biomeAt(m.x, m.z);
      if (ctx.nearWater(m.x, m.z)) here = "creek";
      if (here === "tallgrass" || ctx.inTallGrass(m.x, m.z)) here = "tallgrass";
      const reg = REGIONS.find(([k]) => k === here);
      if (reg && !p4.regions[here]) {
        p4.regions[here] = true;
        chime();
        ctx.say(`🗺️ Discovered ${reg[1]}! (${regionsFound()}/${REGIONS.length}) — “${reg[2]}”`);
        write(`Explored ${reg[1]}. ${reg[2]}`);
        check();
      }
      // the giants' camp
      const C = ctx.campsite;
      if (!p4.done.camp && C.ready && Math.hypot(m.x - C.x, m.z - C.z) < 45) {
        p4.done.camp = true;
        chime();
        ctx.say("🏕️ The giants' summer campsite! Everything's ENORMOUS — and there's string, cloth and buttons everywhere.", true);
        write("Found the giants' campsite at the edge of the forest. A tent like a mountain! They left string and cloth behind — just what I need for a backpack and a lantern.");
        check();
      }
      // behind the falls
      const H = ctx.hollow;
      if (!finale && Math.hypot(m.x - H.x, m.z - H.z) < 24 && has("lantern") && has("rope")) behindTheFalls();
    }
  }

  // ---------- list + trail ----------
  function panelHTML() {
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const places = REGIONS.map(([k, name]) => `<div class="sub ${p4.regions[k] ? "done" : ""}">${p4.regions[k] ? "✔" : "○"} ${name.replace(/^the /, "").replace(/^./, (c) => c.toUpperCase())}</div>`).join("");
    const rows = [
      row(p4.done.regions, `Explore the Great Forest (${regionsFound()}/${REGIONS.length})${places}`),
      row(p4.done.stones, `Find the Moonkeeper stones (${Object.keys(p4.stones).length}/4)`),
      row(p4.done.camp, "Find the giants' campsite"),
      row(p4.done.gear, `Make explorer's gear at home (${gearCount()}/4)`),
    ];
    const gear = Object.entries(GEAR)
      .map(([name, g]) => `<div class="gear ${has(g.key) ? "have" : ""}">${g.icon} ${has(g.key) ? g.ability : name}</div>`)
      .join("");
    if (has("lantern") && has("rope")) rows.push(row(p4.done.falls, "Step behind the bottom waterfall"));
    return `<h3>🗺️ The Great Forest</h3><ul>${rows.join("")}</ul><div class="kit">Abilities:${gear}</div>`;
  }
  function goal() {
    if (st.phase !== 4 || !p4.started) return null;
    const m = me();
    if (has("lantern") && has("rope")) return ctx.hollowDoor.ready ? ctx.hollowDoor.outside : ctx.hollow;
    // nearest unread stone
    let best = null;
    let bd = Infinity;
    (p4.stonesAt || []).forEach((at, i) => {
      if (p4.stones[i]) return;
      const d = Math.hypot(at.x - m.x, at.z - m.z);
      if (d < bd) { bd = d; best = at; }
    });
    if (best) return best;
    if (!p4.done.camp && ctx.campsite.ready) return ctx.campsite;
    if (!p4.done.gear) return ctx.home;
    return null;
  }

  return { start, update, interactable, goal, panelHTML, onCraft, has, get started() { return p4.started; } };
}

// 🌙 a crescent moon: the part of one circle NOT covered by a second circle
// shifted to the side. r = moon radius, bite = how far the shadow is shifted.
export function crescentGeometry(r, bite) {
  // where the two circles cross
  const ix = bite / 2;
  const iy = Math.sqrt(r * r - ix * ix);
  const top = Math.atan2(iy, ix);
  const shape = new THREE.Shape();
  // the outer edge: the big lit curve, round the left side
  shape.absarc(0, 0, r, top, Math.PI * 2 - top, false);
  // the inner edge: the shadow circle's curve, back up to the top
  shape.absarc(bite, 0, r, -Math.PI + top, Math.PI - top, true);
  return new THREE.ShapeGeometry(shape, 24);
}
// ✦ a little four-pointed star
export function starGeometry(r) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.32 : r;
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
