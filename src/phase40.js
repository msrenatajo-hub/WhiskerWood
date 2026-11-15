// ------------------------------------------------------------
//  ✉️  PHASE 40 — "The Last Letter"
//
//  A storm catches Hootsworth, the royal post-owl, over your cottage —
//  and his whole mail sack bursts open over the land. Most letters land
//  in your garden (sort them for him!), but five blow far away… and one
//  of those is sealed in purple wax: a warning RENATA wrote long, long ago,
//  meant for "the Moonkeeper after me".
//    📮 sort the spilled post at your cottage          (Post Sort)
//    🍃 the Great Forest — a letter caught in the leaves (Leaf Catch)
//    🍾 Reedmere — a letter in a bottle, bobbing away    (Bottle Bob)
//    🌾 Golden Hollow — letters lost in the haystacks    (Haystack Hunt)
//    🧊 Frostpine — a letter frozen into the ice         (Ice Memory)
//    🔐 Silverveil — Renata's letter, in the old Moonkeeper code (Cipher Wheel)
//  …then get the warning home to Hootsworth before he flies at DAWN. Too
//  slow, and the old ink fades — you'll have to decode it all over again.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake, openCard, closeCard } from "./cityLife.js";
import { buildPet } from "./pets.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";
import { playMinigame, minigameOpen, MINIGAMES } from "./minigames.js";

registerKeepsake("renataseal", "💜", "Renata's Purple Seal (from the last letter she ever wrote)");
ITEM_POWERS.renataseal = { type: "luck", n: 0.12 };

const PLACES = [
  { key: "forest", name: "the Great Forest", icon: "🍃", game: "catch", where: "deep in the Great Forest, east of your cottage" },
  { key: "reedmere", name: "Reedmere", icon: "🍾", game: "bob", where: "bobbing in Reedmere's lagoon, by the waystone" },
  { key: "golden", name: "Golden Hollow", icon: "🌾", game: "hay", where: "in Golden Hollow's haystacks, by the waystone" },
  { key: "frostpine", name: "Frostpine", icon: "🧊", game: "memory", where: "frozen into the ice at Frostpine, by the waystone" },
];
const DAWN_SECS = 180; // (how long you have to get Renata's warning home)

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase40(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p40 = () => (st.p40 ||= { started: false, sorted: false, letters: {}, decoded: false, deadline: 0, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  let wait = 0;

  function begin() {
    p40().started = true;
    st.phase = 40;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "Thunder rolls over the forest. Through the rain comes a frantic flapping — and a very wet owl tumbles out of the sky into your garden, mail sack first." },
      { dur: 4.8, black: true, gameCam: true, who: "Hootsworth, the royal post-owl", text: "“Oh, FEATHERS. Oh, my letters! The wind tore the sack right open — the post is EVERYWHERE. Half of it's in your cabbages, and the rest blew… blew…” He points a trembling wing at the whole horizon." },
      { dur: 4.8, black: true, gameCam: true, who: "Hootsworth", text: "“And one of them — oh dear — one of them was sealed in PURPLE wax. I've carried it for a hundred years, waiting for the right day to deliver it. It's from Renata. It says: ‘For the Moonkeeper after me.’ That's YOU.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("✉️ PHASE 40 — The Last Letter. Help Hootsworth the post-owl sort the letters in your garden (he's by your cottage)!", true) },
    ]);
  }

  // ---------------------------------------------------------------- Hootsworth, and the glowing letters
  let owl = null, owlBuilt = false;
  const beacons = {};
  function owlSpot() {
    const H0 = ctx.home;
    return { x: H0.x + 4, z: H0.z + 3.5 };
  }
  function buildOwl() {
    if (owlBuilt || !ctx.outsideGroup || !ctx.home) return;
    owlBuilt = true;
    owl = new THREE.Group();
    const O = owlSpot();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x5a3e22, flatShading: true }));
    post.position.y = 0.8;
    const bird = buildPet("owl", 0);
    bird.scale.setScalar(1.8);
    bird.position.y = 1.6;
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, flatShading: true }));
    sack.scale.set(1, 0.8, 0.8);
    sack.position.set(0.6, 0.35, 0.2);
    owl.add(post, bird, sack);
    owl.position.set(O.x, ctx.terrainHeight(O.x, O.z), O.z);
    ctx.outsideGroup.add(owl);
    owl.userData.bird = bird;
  }
  // a floating envelope with a beam of light you can see from far away
  function makeBeacon(col) {
    const g = new THREE.Group();
    const env = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), new THREE.MeshBasicMaterial({ color: 0xf6ead0 }));
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), new THREE.MeshBasicMaterial({ color: col }));
    seal.position.z = 0.04;
    env.add(paper, seal);
    env.position.y = 1.4;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 30, 10, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 15;
    g.add(env, beam, glow(col, 2.6, 0.8));
    g.userData.env = env;
    return g;
  }
  function beaconAt(key) {
    // where this place's letter landed: by the city's waystone, or out in the forest
    if (key === "forest") {
      const H0 = ctx.home;
      return { x: H0.x + 46, z: H0.z + 28, y: ctx.terrainHeight(H0.x + 46, H0.z + 28) };
    }
    const c = ctx.city();
    let w = c.spots && c.spots.waystone;
    if (!w || w.x > 9999) w = c.spots && c.spots.arrive;
    const x = w.x - 3.2, z = w.z + 2.6;
    return { x, z, y: c.height(x, z) };
  }
  function ensureBeacon(key) {
    const parent = key === "forest" ? ctx.outsideGroup : ctx.city() && ctx.city().group;
    if (!parent) return null;
    if (beacons[key] && beacons[key].parent === parent) return beacons[key];
    const at = beaconAt(key);
    const b = makeBeacon(key === "silverveil" ? 0xa04aff : 0xffd040);
    b.position.set(at.x, at.y, at.z);
    b.userData.at = at;
    parent.add(b);
    beacons[key] = b;
    return b;
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 40 || minigameOpen()) return null;
    const s = p40();
    const w = here();
    if (w === "forest" && owl) {
      const O = owlSpot();
      if (near(O.x, O.z, 3)) {
        if (!s.sorted) return { label: "help Hootsworth sort the spilled post 📮", act: () => playMinigame("sort", { title: "Post Sort — Hootsworth's spilled mail", onWin: sorted }) };
        if (s.done) return { label: "play a post-owl game with Hootsworth 🎮", act: gamesCard };
        if (s.decoded) return { label: "give Renata's warning to Hootsworth 💜", act: finale };
        return { label: "talk to Hootsworth 🦉", act: () => ctx.say(hint(), true) };
      }
    }
    if (!s.sorted || s.done) return null;
    for (const P of PLACES) {
      if (P.key !== w || s.letters[P.key]) continue;
      const b = beacons[P.key];
      if (b && near(b.userData.at.x, b.userData.at.z, 3)) return { label: `rescue the lost letter ${P.icon} (${MINIGAMES[P.game].name})`, act: () => playMinigame(P.game, { title: `${MINIGAMES[P.game].name} — a letter in ${P.name}`, onWin: () => gotLetter(P) }) };
    }
    if (w === "silverveil" && !s.decoded) {
      const b = beacons.silverveil;
      if (b && near(b.userData.at.x, b.userData.at.z, 3)) {
        if (PLACES.some((P) => !s.letters[P.key])) return { label: "a letter sealed in purple wax 💜", act: () => ctx.say(`💜 It's Renata's letter — but the seal won't break. Hootsworth said it only opens once all the other lost letters are home. (${Object.keys(s.letters).length}/4)`, true) };
        return { label: "break the purple seal and read Renata's letter 🔐", act: () => playMinigame("cipher", { title: "Cipher Wheel — Renata's last letter", onWin: decoded }) };
      }
    }
    return null;
  }
  const hint = () => {
    const s = p40();
    const left = PLACES.filter((P) => !s.letters[P.key]);
    return left.length
      ? `🦉 “Still out there: ${left.map((P) => `${P.icon} ${P.where}`).join(" · ")}. Follow the golden beams of light!”`
      : "🦉 “All four home! Now the purple one — it fell in SILVERVEIL, by the waystone. Look for the purple beam.”";
  };
  function sorted() {
    const s = p40();
    s.sorted = true;
    save();
    redraw();
    chime();
    ctx.say(`🦉 “Wonderful! Every letter in the right bag.” He counts, and his feathers droop. “…But FIVE are missing. ${hint().slice(3)}`, true);
  }
  function gotLetter(P) {
    const s = p40();
    s.letters[P.key] = true;
    save();
    redraw();
    chime();
    const n = Object.keys(s.letters).length;
    ctx.say(`✉️ You rescued the letter from ${P.name}! (${n}/4)${n >= 4 ? " That's all four — now Renata's purple-sealed letter in SILVERVEIL will open." : ""}`, true);
  }
  function decoded() {
    const s = p40();
    s.decoded = true;
    s.deadline = Date.now() + DAWN_SECS * 1000;
    save();
    redraw();
    chime();
    playCutscene([
      { dur: 5, black: true, gameCam: true, who: "Renata's letter (in faded purple ink)", text: "“To the Moonkeeper after me: a star will fall in the forest. Guard its heart, and plant it — or the Moon Road will close, and the cities will forget each other again.”" },
      { dur: 4.4, black: true, gameCam: true, text: "As you read, the old ink begins to FADE in the air. Hootsworth must copy this and carry it to every city — and he leaves at dawn!" },
      { dur: 0.6, gameCam: true, end: () => ctx.say(`💜 Get Renata's warning home to Hootsworth at your cottage before DAWN — ${DAWN_SECS / 60} minutes! (Press 1 — your dragon is fastest.)`, true) },
    ]);
  }

  function gamesCard() {
    openCard(
      `<div class="card"><h3>🦉 Hootsworth's Post-Office Games</h3><div class="coins">“Fancy a game while I sort the morning post?”</div>
      ${Object.entries(MINIGAMES).map(([k, M]) => `<div class="item"><span class="ic">${M.icon}</span><span class="nm"><b>${M.name}</b><small>${M.how}</small></span><button data-g="${k}">play!</button></div>`).join("")}
      <div class="close">Esc — not now</div></div>`,
      (el) => el.querySelectorAll("button[data-g]").forEach((b) => (b.onclick = () => {
        closeCard();
        playMinigame(b.dataset.g, { onWin: () => {
          const c = C();
          c.coins = (c.coins || 0) + 15;
          saveCity();
          chime();
          ctx.say("🦉 “Splendid!” Hootsworth tucks 🪙 15 under your paw.", true);
        } });
      }))
    );
  }

  function finale() {
    const s = p40();
    const O = owlSpot();
    const y = ctx.terrainHeight(O.x, O.z);
    playCutscene([
      { dur: 4.4, from: [O.x + 4, y + 2.4, O.z + 4], look: [O.x, y + 1.8, O.z], text: "You race up the garden path, the letter clutched to your chest — and press it into Hootsworth's wing just as the sky turns pink." },
      { dur: 5, from: [O.x + 4, y + 2.4, O.z + 4], look: [O.x, y + 1.8, O.z], who: "Hootsworth", text: "“Renata's own hand! ‘A star will fall in the forest…’ Oh my. Oh MY. I'll copy it out six times and every city will have it by tonight. The roads won't forget each other — not while I've got wings.”" },
      { dur: 4.4, from: [O.x - 6, y + 6, O.z + 10], look: [O.x, y + 8, O.z - 10], text: "He takes off into the dawn, sack bulging, and becomes a tiny dot over the treetops. On your doorstep: one last envelope, sealed in purple, with nothing inside but the seal itself." },
      { dur: 4, black: true, gameCam: true, who: "✉️ PHASE 40 COMPLETE", text: "The Last Letter\n🪙 1500 · 💜 Renata's Purple Seal" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        s.deadline = 0;
        const c = C();
        c.coins = (c.coins || 0) + 1500;
        (c.owned ||= {}).renataseal = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("✉️ The warning is on its way to every city. (Renata's Purple Seal brings luck — and Hootsworth's games are always open at his perch.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- the dawn clock
  let clockEl = null;
  function dawnClock() {
    const s = p40();
    const on = s.decoded && !s.done && s.deadline;
    if (!clockEl) {
      clockEl = document.createElement("div");
      clockEl.style.cssText = "position:fixed;left:50%;top:60px;transform:translateX(-50%);padding:6px 18px;border-radius:12px;background:rgba(58,26,74,.88);color:#ffe0ff;font:900 18px 'Trebuchet MS',sans-serif;z-index:45;pointer-events:none";
      document.body.appendChild(clockEl);
    }
    clockEl.style.display = on && !ctx.playing() ? "block" : "none";
    if (!on) return;
    const left = Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000));
    clockEl.textContent = `🌅 Dawn in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} — get the warning to Hootsworth!`;
    if (left <= 0 && !ctx.playing()) {
      s.decoded = false;
      s.deadline = 0;
      save();
      redraw();
      ctx.say("🌅 Dawn breaks — and Hootsworth's sack is gone over the hill without the warning. Worse, Renata's ink has FADED. Go back to Silverveil and decode it again (and be quicker this time)!", true);
    }
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 39 && st.p39 && st.p39.done && !p40().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 40) return;
    const s = p40();
    buildOwl();
    if (owl) {
      owl.visible = true;
      owl.userData.bird.rotation.y = Math.atan2(me().x - owl.position.x, me().z - owl.position.z);
    }
    const w = here();
    if (!s.done && s.sorted) {
      if (w === "forest" || PLACES.some((P) => P.key === w) || w === "silverveil") {
        const b = ensureBeacon(w);
        if (b) {
          const got = w === "silverveil" ? s.decoded : !!s.letters[w];
          b.visible = !got;
          b.userData.env.rotation.y = t * 1.5;
          b.userData.env.position.y = 1.4 + Math.sin(t * 2) * 0.15;
        }
      }
    } else for (const b of Object.values(beacons)) b.visible = false;
    dawnClock();
  }

  function panelHTML() {
    const s = p40();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>✉️ The Last Letter</h3><ul>
      ${row(s.sorted, "Help Hootsworth sort the spilled post 📮 <div class=\"sub\">&nbsp;&nbsp;he's on a post by your cottage</div>")}
      ${PLACES.map((P) => row(!!s.letters[P.key], `${P.icon} A letter in ${P.name} <div class="sub">&nbsp;&nbsp;${MINIGAMES[P.game].name} · follow the golden beam</div>`)).join("")}
      ${row(s.decoded || s.done, "🔐 Read Renata's purple-sealed letter in Silverveil")}
      ${row(s.done, "💜 Get the warning to Hootsworth before dawn")}
    </ul><div class="kit">✉️ golden beams of light mark where the letters fell · 🐉 press 1 to fly between places</div>`;
  }

  // (test hook)
  window.__wwP40 = {
    state: () => ({ ...p40() }),
    playing: () => ctx.playing(),
    owl: () => owlSpot(),
    beacon: (k) => beacons[k] && beacons[k].userData.at,
  };
  return { update, interactable, panelHTML, done: () => !!p40().done };
}
