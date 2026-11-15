// ------------------------------------------------------------
//  🏡  PHASE 12 — "Your Life After the Story"
//
//  The main story is over. The world isn't. An epilogue + credits, and
//  then LIFE GOALS that live on forever (they tick off by themselves as
//  you play):
//    🏡 a home in every Great City         📜 every lore stone read
//    🏛️ the Museum complete                🥇 gold in every race & contest
//    🌱 every farm of your own             🐾 three pets befriended
//    🧑‍🎓 an apprentice of your own           🪙 a fortune of 300 coins
//  Finish them all → "Legend of the Five Cities".
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { buildThistle } from "./outside.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, openCard, closeCard } from "./cityLife.js";

const ALL_MEDALS = ["reedmere", "golden", "frostpine", "swim", "dash", "climb", "reindeer", "cook"];
// 🎬 the creator, in HUGE letters
export const CREATOR_CREDIT = [
  { dur: 6, black: true, gameCam: true, big: true, who: "✨ Created by ✨", text: "Renata Rudy :)" },
];
export const LORE_STONES = [
  ["🌊 Reedmere", ["The Founding of Reedmere", "The Lighthouse of Reeds", "The Drowned Library"]],
  ["🌾 Golden Hollow", ["The First Harvest", "The Windmill That Sings", "The Harvest Moon"]],
  ["❄️ Frostpine", ["The Northern Pact", "The Aurora Weavers", "The Ice That Remembers"]],
];
// each Life Goal pays out when you finish it — and Sprig knows how to get there
const GOAL_PRIZE = { homes: 100, museum: 80, lore: 60, gold: 120, farms: 80, pets: 50, apprentice: 30, coins: 60 };
const GOAL_TIP = {
  homes: "Every Great City has a house FOR SALE (100 coins) — Reedmere, Golden Hollow, Frostpine, Everbough and Roothaven. Look for the red FOR SALE sign!",
  museum: "Each city hides an old relic — ask around for rumors! Find it, then give it to the Museum of the Alliance in Everbough.",
  lore: "There are three lore stones in each of Reedmere, Golden Hollow and Frostpine. They glow — walk up and press E to read them.",
  gold: "Win GOLD in every race and contest — the raft race, the chicken contest, the sled race, the reindeer race, and the rest. Practice makes perfect!",
  farms: "Golden Hollow sells land AND a dairy farm, Frostpine has a crystal farm, and Reedmere a flower farm. Talk to the agents by the FOR SALE signs.",
  pets: "Frostbrush's Pet Shop in Frostpine! Three friends and this one's done.",
  apprentice: "That's me! I'm already here, silly.",
  coins: "Save up 300 coins: sell fish, crops and treasures at the market stalls, and finish quests (Q) — they pay well!",
};
const GOALS = [
  { key: "homes", icon: "🏡", name: "A home in every Great City", need: 5, have: (C) => ["reedmere", "golden", "frostpine", "everbough", "roothaven"].filter((k) => C.homes && C.homes[k] && C.homes[k].owned).length },
  { key: "museum", icon: "🏛️", name: "Complete the Museum of the Alliance", need: 3, have: (C) => Object.values(C.relics || {}).filter((v) => v === "donated").length },
  { key: "lore", icon: "📜", name: "Read every lore stone", need: 9, have: (C) => Object.keys(C.lore || {}).length },
  { key: "gold", icon: "🥇", name: "Gold in every race & contest", need: ALL_MEDALS.length, have: (C) => ALL_MEDALS.filter((k) => (C.medals || {})[k] === "gold").length },
  { key: "farms", icon: "🌱", name: "Own every farm (land, dairy, crystals, flowers)", need: 4, have: (C) => ["farm", "dairy", "crystalFarm", "flowerFarm"].filter((k) => C[k] && C[k].owned).length },
  { key: "pets", icon: "🐾", name: "Befriend three pets", need: 3, have: (C) => (C.pets || []).length },
  { key: "apprentice", icon: "🧑‍🎓", name: "Take on an apprentice", need: 1, have: (C, st) => (st.p12 && st.p12.apprentice ? 1 : 0) },
  { key: "coins", icon: "🪙", name: "Save up a fortune (300 coins)", need: 300, have: (C) => Math.min(300, C.coins || 0) },
];

export function initPhase12(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p12 ||= { done: {} };
  const p12 = st.p12;
  p12.goalPaid ||= {};
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  // 🛠️ (designer cheat) ?lifegoals=1 → every Life Goal done in one go
  if (new URLSearchParams(location.search).get("lifegoals")) {
    const c = C();
    c.homes ||= {};
    for (const k of ["reedmere", "golden", "frostpine", "everbough", "roothaven"]) (c.homes[k] ||= {}).owned = true;
    c.relics = { ...(c.relics || {}), reedmere: "donated", golden: "donated", frostpine: "donated" };
    c.lore ||= {};
    for (const [, titles] of LORE_STONES) for (const t of titles) c.lore[t] = true;
    c.medals ||= {};
    for (const k of ALL_MEDALS) c.medals[k] = "gold";
    for (const k of ["farm", "dairy", "crystalFarm", "flowerFarm"]) (c[k] ||= { beds: {} }).owned = true;
    c.pets ||= [];
    const kinds = [["cat", "Grey Tabby"], ["fox", "Red Fox"], ["owl", "Barn Owl"]];
    while (c.pets.length < 3) {
      const [sp, nm] = kinds[c.pets.length];
      c.pets.push({ id: "pdev" + c.pets.length, species: sp, variant: 0, name: nm });
    }
    c.coins = Math.max(c.coins || 0, 300);
    p12.apprentice = true;
    if (st.phase < 12) st.phase = 12;
    p12.started = true;
    saveCity();
    save();
  }

  // ---------- the epilogue ----------
  function epilogue() {
    const s = ctx.school();
    const y = s ? ctx.terrainHeight(s.x, s.z) : 0;
    return playCutscene([
      { dur: 1.2, fadeOut: true, gameCam: true },
      { dur: 4, black: true, gameCam: true, text: "And so the Great Canopy Alliance lived again." },
      { dur: 4, black: true, gameCam: true, text: "Letters flew. Caravans rolled. Students crossed the old roads every spring, and came home with stories." },
      ...(s ? [{ dur: 4.5, fadeIn: true, from: [s.x + 30, y + 16, s.z + 26], to: [s.x + 14, y + 6, s.z + 12], look: [s.x, y + 2, s.z],
        text: "At the little Fallen Log School, they ring the bell every morning — once for every Great City." }] : []),
      { dur: 4, black: true, gameCam: true, who: "Headmaster Bramble", text: "“Whatever happened to Thistle?” the new students ask. And we tell them: she's still out there. Walking the roads." },
      { dur: 3, black: true, gameCam: true, who: "WHISKERWOOD", text: "~ The End ~ … but not really." },
      ...CREATOR_CREDIT,
      { dur: 3.4, black: true, gameCam: true, who: "Starring", text: "Thistle Mosswhisker · Teacher Willow · Clover · Root Speaker Oriel · Head Librarian Quill · and every mouse of the five cities" },
      { dur: 3.6, black: true, gameCam: true, who: "Phase 12 · Your Life After the Story", text: "Build the home you've always wanted. Take on an apprentice. Fill the Museum. Win every race. The world keeps going — and so do you." },
      { dur: 1.2, fadeIn: true, gameCam: true, end: () => {
        p12.started = true;
        save();
        redraw();
        ctx.say("🏡 Your Life After the Story — your Life Goals are in the list (top right). Take your time. 🌙", true);
      } },
    ]);
  }

  // ---------- the apprentice ----------
  let sprig = null;
  const sprigPos = { x: 0, z: 0, set: false };
  function buildSprig() {
    if (sprig) return;
    sprig = buildThistle({ tunicColor: 0x3a8a9a, hoodColor: 0x3a8a9a, pack: true });
    sprig.scale.setScalar(0.72);
    ctx.scene.add(sprig);
  }
  function apprenticeInteract() {
    if (p12.apprentice || ctx.world() !== "outside") return null;
    const b = ctx.npcs.find((n) => n.key === "bramble");
    if (!b || Math.hypot(me().x - b.x, me().z - b.z) > 2.8) return null;
    return { label: "talk to Headmaster Bramble — an apprentice?", act: () => {
      const y = ctx.terrainHeight(b.x, b.z);
      playCutscene([
        { dur: 3.4, from: [b.x + 2, y + 1.6, b.z + 2], look: [b.x, y + 0.8, b.z], who: "Headmaster Bramble",
          text: "Thistle! There's a young mouse here who's read every word of your journal. Twice. Sprig wants to be a Moonkeeper, just like you." },
        { dur: 3.2, from: [b.x + 2, y + 1.6, b.z + 2], look: [b.x, y + 0.8, b.z], who: "Sprig", text: "P-please let me come along! I can carry things! I can read maps! Mostly!" },
        { dur: 3, from: () => [me().x - 1.6, me().y + 1.1, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
          text: "…Every Moonkeeper starts somewhere. Come on, Sprig. Stay close." },
        { dur: 0.3, gameCam: true, end: () => {
          p12.apprentice = true;
          save();
          buildSprig();
          redraw();
          chime();
          ctx.say("🧑‍🎓 Sprig, your apprentice, follows you everywhere now!", true);
        } },
      ]);
    } };
  }

  // ---------- 📚 Sprig's lessons → Sprig's own Moonkeeper ceremony ----------
  const LESSONS = [
    ["fish", "🎣", "How to fish", "ww-fish", "Catch a fish with Sprig beside you"],
    ["cook", "🍲", "How to cook", "ww-cook", "Cook a dish at the Great Cauldron"],
    ["gift", "💌", "Kindness", "ww-gift", "Give a friend a gift"],
    ["star", "⭐", "Reading the stars", "ww-star", "Catch a star on a balloon flight"],
  ];
  p12.lessons ||= {};
  for (const [k, icon, name, ev] of LESSONS) {
    window.addEventListener(ev, () => {
      if (!p12.apprentice || p12.lessons[k]) return;
      p12.lessons[k] = true;
      save();
      chime();
      const n = Object.keys(p12.lessons).length;
      setTimeout(() => ctx.say(`📚 Sprig learned ${icon} ${name}! (${n}/${LESSONS.length})${n >= LESSONS.length ? " Sprig's ready for something BIG… press H." : ""}`, true), 3000);
    });
  }
  const lessonsDone = () => LESSONS.every(([k]) => p12.lessons[k]);
  const p13Done = () => !!(st.p13 && st.p13.done);
  function sprigGraduation() {
    const b = ctx.npcs.find((n) => n.key === "bramble");
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4, black: true, gameCam: true, text: "The whole Fallen Log School gathers at sunset. Even the Moonkeepers of the Underglow have come up to watch, pale and smiling." },
      { dur: 4.4, black: true, gameCam: true, who: "Headmaster Bramble", text: "“Sprig, apprentice of Thistle Mosswhisker: you have learned to fish, to cook, to be kind, and to read the stars. Kneel.”" },
      { dur: 4.4, black: true, gameCam: true, who: "Thistle", text: "“Every Moonkeeper starts somewhere, Sprig. Yours started the day you asked to come along. I'm so proud of you.”" },
      { dur: 4, black: true, gameCam: true, text: "A little blue cloak, the color of moonlit water, settles round Sprig's shoulders. Sprig doesn't stop grinning for a WEEK." },
      { dur: 1, fadeIn: true, gameCam: true, end: () => {
        p12.sprigGrad = true;
        save();
        chime();
        dressSprig();
        ctx.say("🌙 Sprig is a MOONKEEPER now! (and still follows you everywhere — some things never change)", true);
      } },
    ]);
    void b;
  }
  function dressSprig() {
    if (!sprig || !p12.sprigGrad || sprig.userData.cloak) return;
    const cape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 0.24, 14, 1, true, Math.PI * 0.55, Math.PI * 0.9),
      new THREE.MeshStandardMaterial({ color: 0x3a5a8a, emissive: 0x1a2a4a, emissiveIntensity: 0.4, side: THREE.DoubleSide, flatShading: true })
    );
    cape.position.set(0, 0.46, -0.02);
    sprig.add(cape);
    sprig.userData.cloak = cape;
  }

  // 🌙 after the Trial of Three (Phase 26): a midnight cloak with silver
  // stars, and Sprig's very own lantern, glowing in his paw
  function moonkeeperSprig(t) {
    if (!sprig || !(st.p26 && st.p26.done)) return;
    const u = sprig.userData;
    if (!u.moonkeeper) {
      u.moonkeeper = true;
      if (!u.cloak) {
        // (no apprentice cape yet? he gets one now — just for his new cloak to go on)
        const was = p12.sprigGrad;
        p12.sprigGrad = true;
        dressSprig();
        p12.sprigGrad = was;
      }
      if (u.cloak) {
        u.cloak.material = u.cloak.material.clone();
        u.cloak.material.color.set(0x1e2a5a);
        u.cloak.material.emissive.set(0x0a1030);
        u.cloak.scale.set(1.15, 1.6, 1.15);
        u.cloak.position.y = 0.4;
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * 0.62 + (k / 6) * Math.PI * 0.76;
          const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), new THREE.MeshBasicMaterial({ color: 0xf0f4ff }));
          star.position.set(Math.cos(a) * 0.21, -0.06 + (k % 3) * 0.05, Math.sin(a) * 0.21);
          u.cloak.add(star);
        }
      }
      const lantern = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.09), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, flatShading: true }));
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd880, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(0.6);
      lantern.add(frame, flame, halo);
      lantern.position.set(0.22, 0.32, 0.12);
      sprig.add(lantern);
      u.sprigLantern = { lantern, halo };
    }
    if (u.sprigLantern) {
      u.sprigLantern.lantern.rotation.z = Math.sin((t || 0) * 3) * 0.15;
      u.sprigLantern.halo.material.opacity = 0.65 + Math.sin((t || 0) * 7) * 0.15;
    }
  }

  // ---------- 🧑‍🎓 Sprig, a REAL apprentice ----------
  // talk to Sprig (E) for help with your Life Goals · Sprig finds things on
  // the way · cheers your quests · celebrates every Life Goal you finish
  let findT = 70;
  const nextGoal = () => GOALS.find((g) => g.have(C(), st) < g.need && g.key !== "apprentice");
  function sprigTalk() {
    const g = nextGoal();
    const done = GOALS.filter((x) => x.have(C(), st) >= x.need).length;
    openCard(`<div class="card"><h3>🧑‍🎓 Sprig</h3><div class="coins">Life Goals: ${done}/${GOALS.length}</div>
      <p style="font:15px Georgia;line-height:1.45">${g
        ? `“Ooh! Ooh! Let's do <b>${g.icon} ${g.name}</b> next! (${Math.min(g.need, g.have(C(), st))}/${g.need})<br><br>${GOAL_TIP[g.key]}”`
        : "“We did them ALL! You're a LEGEND, Thistle. Can I carry the lantern now? Pleeease?”"}</p>
      <h4 style="margin:10px 0 4px">📚 Teach me, Thistle!</h4>
      ${LESSONS.map(([k, icon, name, , how]) => `<div style="font:13px system-ui;margin:2px 0;${p12.lessons[k] ? "color:#2a7a3a" : ""}">${p12.lessons[k] ? "✔" : "○"} ${icon} <b>${name}</b> — ${how}</div>`).join("")}
      ${p12.sprigGrad ? `<p style="font:13px system-ui;color:#3a5a8a">🌙 Sprig is a Moonkeeper!</p>` : lessonsDone() && p13Done() ? `<div style="text-align:center;margin:8px"><button id="sprigcer">🌙 Hold Sprig's Moonkeeper ceremony!</button></div>` : lessonsDone() ? `<p style="font:13px system-ui;color:#6a5030">“I've learned everything! …but I think I need to see one REALLY brave adventure first.” (finish Phase 13)</p>` : ""}
      <p style="font:13px system-ui;color:#6a5030">Each Life Goal you finish pays a reward, and I'll keep my eyes open for treasure while we walk!</p>
      <div style="text-align:center"><button id="sprigok">Thanks, Sprig!</button></div></div>`, (el) => {
        el.querySelector("#sprigok").onclick = closeCard;
        const c = el.querySelector("#sprigcer");
        if (c) c.onclick = () => {
          closeCard();
          sprigGraduation();
        };
      });
  }
  // H — talk to Sprig (a hotkey, so "talk to Sprig" never crowds out E)
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyH" || e.repeat || ctx.playing()) return;
    if (!p12.apprentice) return;
    sprigTalk();
  });
  const FINDS = [["Glowing Moss", "✨"], ["Feathers", "🪶"], ["Smooth Stones", "🪨"], ["Berries", "🫐"], ["Ancient Seeds", "🌰"], ["Acorn Caps", "🌰"], ["Crystal Fragments", "💎"]];
  function sprigFinds() {
    const c = C();
    if (Math.random() < 0.55) {
      const n = 4 + Math.floor(Math.random() * 9);
      c.coins = (c.coins || 0) + n;
      saveCity();
      ctx.say(`🧑‍🎓 Sprig: “Look, look! I found ${n} coins in the grass!” +🪙 ${n}`);
    } else {
      const [item, icon] = FINDS[Math.floor(Math.random() * FINDS.length)];
      ctx.addToPack(item, 2);
      ctx.say(`🧑‍🎓 Sprig: “I found ${item.toLowerCase()} for your pack!” ${icon} +2`);
    }
    chime();
  }
  window.addEventListener("ww-quest-done", (e) => {
    if (!p12.apprentice) return;
    setTimeout(() => ctx.say(`🧑‍🎓 Sprig: “WOW! ${e.detail.name}! I'm telling EVERYONE at school!”`), 9000);
  });
  /** a Life Goal just finished? → pay its prize, and Sprig cheers */
  function goalsCheck() {
    if (!p12.started) return;
    for (const g of GOALS) {
      if (p12.goalPaid[g.key] || g.have(C(), st) < g.need) continue;
      p12.goalPaid[g.key] = true;
      const prize = GOAL_PRIZE[g.key] || 50;
      C().coins = (C().coins || 0) + prize;
      saveCity();
      save();
      chime();
      redraw();
      ctx.say(`🎉 LIFE GOAL COMPLETE: ${g.icon} ${g.name}! +🪙 ${prize}${p12.apprentice ? " — Sprig does a happy dance!" : ""}`, true);
      break; // (one celebration at a time)
    }
  }

  // ---------- each frame ----------
  let pendingEpilogue = false;
  let legendShown = false;
  function update(dt, t) {
    if (st.phase < 12 || !ctx.quadMouse()) return;
    if (!p12.started && !pendingEpilogue && !ctx.playing()) {
      pendingEpilogue = true;
      epilogue();
    }
    if (!ctx.playing()) goalsCheck();
    if (p12.apprentice && p12.started && !ctx.playing() && st.phase !== 16) { // (no finding things during Phase 16)
      findT -= dt;
      const w = ctx.world();
      if (findT <= 0 && w !== "den" && w !== "home") {
        findT = 100 + Math.random() * 60;
        sprigFinds();
      }
    }
    if (p12.apprentice) {
      buildSprig();
      dressSprig();
      moonkeeperSprig(t);
      const w = ctx.world();
      sprig.visible = w !== "den" && w !== "home" && !window.__sprigHidden; // (🙈 unless Sprig's hiding!)
      const yaw = ctx.mouseRig.rotation.y;
      const p = me();
      const mode = ctx.waterMode ? ctx.waterMode() : "walk";
      const u0 = sprig.userData;
      sprig.rotation.set(0, sprig.rotation.y, 0, "YXZ");
      // walk at your LEFT side (your pet takes the right)
      const tx = p.x - Math.sin(yaw) * 0.5 + Math.cos(yaw) * 1.1;
      const tz = p.z - Math.cos(yaw) * 0.5 - Math.sin(yaw) * 1.1;
      if (!sprigPos.set || Math.hypot(tx - sprigPos.x, tz - sprigPos.z) > 8) Object.assign(sprigPos, { x: tx, z: tz, set: true });
      const dx = tx - sprigPos.x;
      const dz = tz - sprigPos.z;
      const d = Math.hypot(dx, dz);
      const moving = d > 0.15;
      if (moving) {
        const step = Math.min(d, (4 + d * 8) * dt);
        sprigPos.x += (dx / d) * step;
        sprigPos.z += (dz / d) * step;
      }
      // 🏊 swimming: Sprig swims too (low in the water, paddling hard)
      const swim = mode === "swim" || mode === "raft"; // (on the raft, Sprig swims along behind on your left)
      const bobS = Math.sin(t * 3 + 1) * 0.03;
      sprig.position.set(sprigPos.x, swim ? ctx.waterY() - 0.2 + bobS : p.y, sprigPos.z);
      sprig.rotation.y = moving ? Math.atan2(dx, dz) : yaw;
      // 🏊 swimming: lying forward in the water like Thistle, chin up
      sprig.rotation.x = swim ? 1.05 : 0;
      if (sprig.userData.head) sprig.userData.head.rotation.x = swim ? -0.95 : 0;
      const u = sprig.userData;
      const sw = swim ? Math.sin(t * 9) : moving ? Math.sin(t * 12) : 0;
      if (u.legL) {
        u.legL.rotation.x = sw * 0.7;
        u.legR.rotation.x = -sw * 0.7;
      }
    }
    // every life goal done → the Legend
    if (!p12.legend && p12.started && GOALS.every((g) => g.have(C(), st) >= g.need) && !ctx.playing() && !legendShown) {
      legendShown = true;
      playCutscene([
        { dur: 1, fadeOut: true, gameCam: true },
        { dur: 4, black: true, gameCam: true, who: "🌙 LEGEND OF THE FIVE CITIES 🌙", text: "Every home. Every relic. Every story. Every race. The whole world knows your name now, Thistle Mosswhisker." },
        { dur: 3.6, black: true, gameCam: true, who: "Renata Josephine Rudy (a whisper on the wind)", text: "“Well walked, Moonkeeper. Well walked.”" },
        { dur: 1, fadeIn: true, gameCam: true, end: () => {
          p12.legend = true;
          save();
          redraw();
          chime();
        } },
      ]);
    }
  }

  // ---------- the list ----------
  function panelHTML() {
    const rows = GOALS.map((g) => {
      const h = Math.min(g.need, g.have(C(), st));
      const done = h >= g.need;
      let extra = "";
      if (g.key === "lore" && !done) {
        const L = C().lore || {};
        extra = LORE_STONES.map(([city, titles]) => `<div class="sub">${city}</div>` + titles.map((t) => `<div class="sub ${L[t] ? "done" : ""}">&nbsp;&nbsp;${L[t] ? "✔" : "○"} ${t}</div>`).join("")).join("");
      }
      return `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${g.icon} ${g.name}${g.need > 1 ? ` <span class="res">(${h}/${g.need})</span>` : ""}${extra}</li>`;
    });
    const n = GOALS.filter((g) => g.have(C(), st) >= g.need).length;
    return `<h3>🏡 Life Goals (${n}/${GOALS.length}) <small style="font:12px system-ui;opacity:.75">— optional, just for fun!</small></h3><ul>${rows.join("")}</ul><div class="kit">${p12.legend ? "🌙 Legend of the Five Cities" : "🌙 Moonkeeper · K — travel"}${p12.apprentice ? " · 🧑‍🎓 H — talk to Sprig (Life Goal tips)" : " · ask Headmaster Bramble about an apprentice"}</div>`;
  }
  function goal() {
    if (st.phase !== 12 || p12.apprentice || ctx.world() !== "outside") return null;
    const b = ctx.npcs.find((n) => n.key === "bramble");
    return b ? { x: b.x, z: b.z } : null;
  }

  /** the small story panel for Phase 12 (the Life Goals now open with C) */
  function storyHTML() {
    return `<h3>🏡 Your Life After the Story</h3><ul><li>○ Live your life — explore, make friends, finish quests (Q)</li>${p12.apprentice ? "" : "<li>○ Ask Headmaster Bramble about an apprentice</li>"}</ul><div class="kit">🏡 C — Life Goals (optional) · 🌙 K — travel</div>`;
  }
  return { update, interactable: () => (st.phase === 12 ? apprenticeInteract() : null), panelHTML: storyHTML, goalsHTML: panelHTML, goal, start: () => redraw() };
}
