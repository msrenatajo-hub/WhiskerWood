// ------------------------------------------------------------
//  🌟  MORE TO DO — the living world, part three.
//
//   🏘️ YOUR VILLAGE        mice from the cities move in near your den (O)
//   🦌 LEGENDARY CREATURES  the Moon Stag · the Lantern Turtle · the Cloud-Whale
//   🌦️ WEATHER EVENTS       aurora nights · meteor showers · golden rain
//   🎵 MUSIC (U)            a reed flute and four songs that DO things
//   📸 PHOTO CHALLENGES     townsfolk ask for pictures (P to snap)
//   🙈 SPRIG'S HIDE & SEEK  Sprig sometimes runs off to hide — find them!
//   🏆 TITLES (Y)           badges you earn, and one to wear under your name
//   ☁️ NIMBUSREACH          the City in the Clouds (by balloon, after the whale)
// ------------------------------------------------------------
import * as THREE from "three";
import { inflate, bought, cost as priceNow } from "./economy.js";
import { playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard, registerKeepsake } from "./cityLife.js";
import { bagFood } from "./food.js";
import { powerText } from "./powers.js";
import { CLOUD } from "./questZones.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const hash = (x, z) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
registerKeepsake("reedflute", "🪈", "Reed Flute (U — play a song)");
registerKeepsake("stagantler", "🦌", "Silver Antler of the Moon Stag (you sprint 30% longer)");
registerKeepsake("turtleshell", "🐢", "Lantern-Turtle Scale (you never run out of air)");
registerKeepsake("whalesong", "🐋", "Cloud-Whale's Song (balloons fly you to Nimbusreach)");
registerKeepsake("starstone", "☄️", "Fallen Star (a keepsake from a meteor shower)");
registerKeepsake("musicmedal", "🎼", "Golden Note (winner of the Music Contest)");

// 🏘️ the settlers who want to move in (name, tunic, what they do in the village)
const SETTLERS = [
  { name: "Baker Poppyseed", tunic: 0xd8a04a, from: "Golden Hollow", job: "bakes you a treat each day", cost: { coins: 40, Twigs: 6 } },
  { name: "Fisher Reedling", tunic: 0x3a7a8a, from: "Reedmere", job: "brings you fish each day", cost: { coins: 40, Twigs: 6 } },
  { name: "Weaver Thimble", tunic: 0xb86a9a, from: "Everbough", job: "weaves string from your grass", cost: { coins: 50, "Bark Strips": 4 } },
  { name: "Woodcutter Burl", tunic: 0x7a4a2a, from: "Frostpine", job: "chops twigs for you each day", cost: { coins: 50, "Smooth Stones": 4 } },
  { name: "Healer Chamomile", tunic: 0x6ab87a, from: "Roothaven", job: "heals you whenever you visit", cost: { coins: 60, "Glowing Moss": 4 } },
  { name: "Bard Lilting", tunic: 0x8a5ad8, from: "Silverveil", job: "plays music for the village", cost: { coins: 70, "Moon Petals": 2 } },
];
// 🛍️ what each neighbour sells from their front door
const VILLAGE_WARES = {
  "Baker Poppyseed": [
    { key: "v_bread", icon: "🍞", name: "Crusty Loaf", price: 4, food: { heal: 20 } },
    { key: "v_honeybun", icon: "🥐", name: "Honey Bun", price: 5, food: { heal: 25 } },
    { key: "v_pie", icon: "🥧", name: "Berry Pie", price: 8, food: { heal: 45 } },
    { key: "v_cookie", icon: "🍪", name: "Acorn Cookies", price: 3, food: { heal: 15 } },
    { key: "bakersrollingpin", icon: "🥖", name: "Poppyseed's Lucky Rolling Pin", price: 20, keep: true },
  ],
  "Fisher Reedling": [
    { key: "v_fish", icon: "🐟", name: "Fresh Fish", price: 4, food: { heal: 20 } },
    { key: "v_eel", icon: "🍢", name: "Smoked Eel", price: 7, food: { heal: 35 } },
    { key: "v_bait", icon: "🪱", name: "Worms", price: 2, pack: 3 },
    { key: "fishersnet", icon: "🥅", name: "Fisher's Little Net", price: 22, keep: true },
  ],
  "Weaver Thimble": [
    { key: "v_string", icon: "🧵", name: "String", price: 2, pack: 3 },
    { key: "v_cloth", icon: "🧶", name: "Cloth Scraps", price: 3, pack: 2 },
    { key: "wovenscarf", icon: "🧣", name: "Thimble's Woven Scarf", price: 18, keep: true },
    { key: "patchquilt", icon: "🧵", name: "Patchwork Quilt", price: 26, keep: true },
  ],
  "Woodcutter Burl": [
    { key: "v_twigs", icon: "🪵", name: "Twigs", price: 2, pack: 5 },
    { key: "v_bark", icon: "🪵", name: "Bark Strips", price: 3, pack: 3 },
    { key: "v_stones", icon: "🪨", name: "Smooth Stones", price: 3, pack: 3 },
    { key: "carvedbear", icon: "🧸", name: "Carved Wooden Bear", price: 16, keep: true },
  ],
};
for (const list of Object.values(VILLAGE_WARES)) for (const W of list) if (W.keep && W.key !== "reedflute") registerKeepsake(W.key, W.icon, W.name);
const SONGS = [
  // (six notes each, across all 8 keys — play the LAST six notes and the song happens)
  { key: "bloom", icon: "🌸", name: "Song of Blooming", notes: [1, 3, 5, 8, 6, 5], text: "flowers burst up all around you (and you feel a little better)" },
  { key: "sun", icon: "☀️", name: "Song of Sunrise", notes: [1, 3, 5, 6, 7, 8], text: "the sun rises — it's morning!" },
  { key: "lull", icon: "🌙", name: "Lullaby of the Moon", notes: [8, 6, 5, 3, 2, 1], text: "night falls, and you feel rested (+40 ❤️)" },
  { key: "calm", icon: "😌", name: "Song of Calm", notes: [6, 5, 4, 3, 2, 1], text: "wild and dangerous things grow sleepy and still for 45 seconds" },
  { key: "rain", icon: "🌧️", name: "Rain Song", notes: [3, 5, 3, 5, 7, 8], text: "clouds gather — and down comes the rain" },
  { key: "clear", icon: "🌤️", name: "Song of Clear Skies", notes: [8, 7, 8, 7, 5, 3], text: "the clouds roll away and the sky clears" },
  { key: "flutter", icon: "🦋", name: "Song of the Butterflies", notes: [2, 4, 6, 8, 6, 4], text: "glowing butterflies come and dance round you" },
];
const NOTE_HZ = [0, 523, 587, 659, 784, 880, 1047, 1175, 1319]; // (1–4 = the song notes · 5–8 higher, for playing anything you like)

export function initMore(ctx) {
  const S = cityState();
  S.village ||= { settlers: [], name: "", lastGift: -1 };
  S.legends ||= {};
  S.badges ||= {};
  S.stats ||= {};
  S.photoDone ||= {};
  const save = () => saveCity();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const day = () => S.days || 0;
  const night = () => ctx.dayTime() > 0.76 || ctx.dayTime() < 0.22;
  let audio = null;
  const testQuiet = new URLSearchParams(location.search).has("mcontest"); // (headless tests: no audio)
  function tone(f, delay = 0, dur = 0.5) {
    if (testQuiet) return;
    try {
      audio ||= new AudioContext();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, audio.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.16, audio.currentTime + delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + dur);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + delay);
      o.stop(audio.currentTime + delay + dur + 0.05);
    } catch {}
  }

  // ======================================================================
  //  🏘️ YOUR VILLAGE — the Village Board by your den
  // ======================================================================
  const village = { board: null, houses: [] };
  function clearSpot(x0, z0, r) {
    for (let rr = 0; rr < 30; rr += 1.5) for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const x = x0 + Math.cos(a) * rr;
      const z = z0 + Math.sin(a) * rr;
      if (!ctx.isWater(x, z) && ctx.isClear(x, z, r)) return { x, z };
    }
    return { x: x0, z: z0 };
  }
  function buildVillage() {
    if (village.board || !ctx.ready()) return;
    const D = ctx.den;
    const b = clearSpot(D.x + 5, D.z + 6, 1.5);
    const g = new THREE.Group();
    g.position.set(b.x, ctx.terrainHeight(b.x, b.z), b.z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.15), M(0x8a6a42));
    board.position.y = 1.5;
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshBasicMaterial({ color: 0xf4ecd8 }));
    paper.position.set(0, 1.5, 0.08);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 5), M(0x5a3e24));
      leg.position.set(sx, 1.1, -0.05);
      g.add(leg);
    }
    g.add(board, paper, glow(0xffe08a, 1.6));
    g.children[g.children.length - 1].position.y = 2.6;
    g.rotation.y = Math.atan2(D.x - b.x, D.z - b.z);
    ctx.outsideGroup.add(g);
    village.board = { ...b, g };
    // the six house plots in a ring round the den
    village.plots = SETTLERS.map((_, i) => {
      const a = (i / SETTLERS.length) * Math.PI * 2 + 0.4;
      return clearSpot(D.x + Math.cos(a) * 16, D.z + Math.sin(a) * 16, 3);
    });
    S.village.settlers.forEach((nm) => buildHouse(SETTLERS.findIndex((x) => x.name === nm)));
  }
  function buildHouse(i) {
    if (i < 0 || village.houses[i]) return;
    const P = village.plots[i];
    const st = SETTLERS[i];
    const y = ctx.terrainHeight(P.x, P.z);
    const g = new THREE.Group();
    g.position.set(P.x, y, P.z);
    g.rotation.y = Math.atan2(ctx.den.x - P.x, ctx.den.z - P.z);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.8, 10), M(0xe8d0a8));
    wall.position.y = 0.9;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.6, 10), M(st.tunic));
    roof.position.y = 2.6;
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.5, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, 0.55, 1.62);
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
    win.position.set(0.9, 1.1, 1.3);
    win.rotation.y = 0.6;
    const m = buildThistle({ tunicColor: st.tunic, hoodColor: st.tunic, pack: false });
    m.position.set(0.9, 0, 2.6);
    g.add(wall, roof, door, win, m);
    ctx.outsideGroup.add(g);
    ctx.addSolid(P.x, P.z, 1.7);
    village.houses[i] = { g, x: P.x + Math.sin(g.rotation.y) * 2.6, z: P.z + Math.cos(g.rotation.y) * 2.6, m };
  }
  function openVillage(msg = "") {
    const V = S.village;
    const n = V.settlers.length;
    openCard(
      `<div class="card" style="max-height:84vh;overflow:auto"><h3>🏘️ ${V.name || "Your Village"}</h3><div class="coins">🪙 ${S.coins} · ${n}/${SETTLERS.length} neighbours</div>
      <p style="font:14px Georgia">Mice from all over the Great Cities want to live near the famous Thistle Mosswhisker! Build them a home and they'll move in.</p>
      ${SETTLERS.map((st, i) => {
        const has = V.settlers.includes(st.name);
        const cost = Object.entries(st.cost).map(([k, v]) => (k === "coins" ? `🪙 ${priceNow(v, "settler")}` : `${v} ${k}`)).join(" + ");
        const can = Object.entries(st.cost).every(([k, v]) => (k === "coins" ? S.coins >= priceNow(v, "settler") : ctx.packCount(k) >= v));
        return `<div class="item"><span class="ic">🏠</span><span class="nm">${st.name}<small>from ${st.from} · ${st.job}</small><small>${has ? "✓ lives here!" : "build a house: " + cost}</small></span>${has ? "" : `<button data-s="${i}" ${can ? "" : "disabled"}>build</button>`}</div>`;
      }).join("")}
      ${n >= 3 ? `<div style="text-align:center;margin-top:8px"><button id="vname">✏️ ${V.name ? "Rename" : "Name"} your village</button></div>` : `<div class="coins">Three neighbours, and you can name your village!</div>`}
      <div class="msg">${msg}</div><div class="close">Esc — close · O — open this board from anywhere in the forest</div></div>`,
      (el) => {
        el.querySelectorAll("button[data-s]").forEach((b) => (b.onclick = () => {
          const st = SETTLERS[+b.dataset.s];
          for (const [k, v] of Object.entries(st.cost)) {
            if (k === "coins") S.coins -= priceNow(v, "settler");
            else ctx.packTake(k, v);
          }
          V.settlers.push(st.name);
          save();
          buildHouse(+b.dataset.s);
          ctx.chime();
          openVillage(`🏠 ${st.name} has moved in! (${st.job})`);
        }));
        const nb = el.querySelector("#vname");
        if (nb) nb.onclick = () => {
          const nm = (prompt("What will you call your village?", V.name || "Mossy Hollow") || "").trim().slice(0, 28);
          if (nm) {
            V.name = nm;
            save();
            ctx.chime();
            openVillage(`🏘️ Welcome to ${nm}!`);
          }
        };
      }
    );
  }
  /** once a day, your neighbours help out */
  function villageDaily() {
    const V = S.village;
    if (!V.settlers.length || V.lastGift === day()) return;
    V.lastGift = day();
    const gifts = [];
    const has = (nm) => V.settlers.some((s) => s.startsWith(nm));
    if (has("Baker")) gifts.push(bagFood({ name: "Village Honey Bun", icon: "🍯", heal: 30 }) && "🍯 a honey bun");
    if (has("Fisher")) ctx.addToPack("Fish", 2), gifts.push("🐟 2 fish");
    if (has("Weaver")) ctx.addToPack("String", 2), gifts.push("🧵 2 string");
    if (has("Woodcutter")) ctx.addToPack("Twigs", 4), gifts.push("🪵 4 twigs");
    if (has("Bard")) S.coins += 10, gifts.push("🪙 10 (the Bard's tips!)");
    save();
    if (gifts.length) ctx.say(`🏘️ Good morning from ${V.name || "your village"}! Your neighbours left you: ${gifts.join(", ")}.`, true);
  }

  // ======================================================================
  //  🦌 LEGENDARY CREATURES
  // ======================================================================
  const legend = {};
  function moonStag(t) {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "silverveil") return;
    if (!legend.stag || legend.stag.c !== c) {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.85 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), mat);
      body.scale.set(0.8, 0.8, 1.5);
      body.position.y = 2;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.2, 6), mat);
      neck.position.set(0, 2.8, 1.1);
      neck.rotation.x = -0.5;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat);
      head.position.set(0, 3.4, 1.5);
      for (const sx of [-1, 1]) {
        const ant = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
        ant.position.set(sx * 0.3, 4.1, 1.4);
        ant.rotation.z = -sx * 0.5;
        g.add(ant);
        for (const sz of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.6, 5), mat);
          leg.position.set(sx * 0.4, 0.8, sz * 0.8);
          g.add(leg);
        }
      }
      g.add(body, neck, head, glow(0xdfe8ff, 6, 0.4));
      c.group.add(g);
      legend.stag = { c, g, x: -60, z: 40 };
    }
    const L = legend.stag;
    L.g.visible = night() || !!S.legends.stag;
    const a = t * 0.05;
    L.x = -55 + Math.cos(a) * 12;
    L.z = 40 + Math.sin(a) * 12;
    L.g.position.set(L.x, L.c.height(L.x, L.z), L.z);
    L.g.rotation.y = a + Math.PI / 2;
  }
  function lanternTurtle(t) {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "deep") return;
    if (!legend.turtle || legend.turtle.c !== c) {
      const g = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x3a6a5a, { emissive: 0x1a4a3a, emissiveIntensity: 0.5 }));
      shell.scale.y = 0.6;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), M(0x6a9a7a));
      head.position.set(0, 0.3, 2.4);
      for (let k = 0; k < 6; k++) {
        const lamp = glow([0xffe08a, 0x8affd8, 0xd8a8ff][k % 3], 1.6);
        lamp.position.set(Math.cos(k) * 1.3, 1.2, Math.sin(k) * 1.3);
        g.add(lamp);
      }
      for (const [x, z] of [[1.8, 1.2], [-1.8, 1.2], [1.6, -1.4], [-1.6, -1.4]]) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), M(0x6a9a7a));
        fl.scale.set(1.4, 0.3, 0.7);
        fl.position.set(x, 0.1, z);
        g.add(fl);
      }
      g.add(shell, head);
      c.group.add(g);
      legend.turtle = { c, g, x: 0, z: 0 };
    }
    const L = legend.turtle;
    const a = t * 0.08;
    L.x = -40 + Math.cos(a) * 18;
    L.z = 50 + Math.sin(a) * 14;
    L.g.position.set(L.x, L.c.height(L.x, L.z) + 2.5 + Math.sin(t) * 0.3, L.z);
    L.g.rotation.y = a + Math.PI / 2;
  }
  function cloudWhale(t) {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== "sky") return;
    if (!legend.whale || legend.whale.c !== c) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), M(0xe8eef8, { emissive: 0x8aa8d8, emissiveIntensity: 0.3 }));
      body.scale.set(1, 0.7, 2.2);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(3, 5, 4), M(0xe8eef8));
      tail.rotation.x = -Math.PI / 2;
      tail.position.z = -15;
      tail.scale.x = 2;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a4a6a }));
      eye.position.set(5, 1, 9);
      g.add(body, tail, eye, eye.clone().translateX(-10), glow(0xbfd8ff, 30, 0.3));
      c.group.add(g);
      legend.whale = { c, g };
    }
    const L = legend.whale;
    L.g.visible = (S.stats.stars || 0) >= 20 || !!S.legends.whale;
    L.g.position.set(-40 + Math.sin(t * 0.1) * 10, 40 + Math.sin(t * 0.4) * 2, -60 + t * 1.5 % 260);
  }
  function befriend(key, lines, reward, extra) {
    playCutscene([...lines, { dur: 0.4, gameCam: true, end: () => {
      S.legends[key] = true;
      (S.owned ||= {})[reward] = true;
      save();
      ctx.chime();
      if (extra) extra();
    } }]);
  }
  function legendInteract() {
    const L1 = legend.stag;
    if (L1 && L1.g.visible && L1.c === ctx.city() && near(L1.x, L1.z, 4) && !S.legends.stag) {
      if (ctx.packCount("Moon Petals") < 1) return { label: "the Moon Stag watches you…", act: () => ctx.say("🦌 The Moon Stag only trusts those who bring it a Moon Petal (from the forest, at night).", true) };
      return { label: "offer the Moon Stag a Moon Petal 🦌", act: () => {
        ctx.packTake("Moon Petals", 1);
        befriend("stag", [
          { dur: 4, from: [L1.x + 5, L1.c.height(L1.x, L1.z) + 3, L1.z + 5], look: [L1.x, L1.c.height(L1.x, L1.z) + 2.5, L1.z], text: "The Moon Stag lowers its great silver head and takes the petal from your paw, gentle as snowfall." },
          { dur: 3.6, from: [L1.x + 5, L1.c.height(L1.x, L1.z) + 3, L1.z + 5], look: [L1.x, L1.c.height(L1.x, L1.z) + 2.5, L1.z], text: "When it lifts its head again, one silver antler-tip lies in the grass — a gift." },
        ], "stagantler", () => ctx.say("🦌 The Moon Stag is your friend! Silver Antler: you sprint 30% longer.", true));
      } };
    }
    const L2 = legend.turtle;
    if (L2 && L2.c === ctx.city() && near(L2.x, L2.z, 4.5) && !S.legends.turtle) {
      if (ctx.packCount("Fish") < 3) return { label: "the Lantern Turtle drifts by…", act: () => ctx.say("🐢 The ancient Lantern Turtle looks hungry. It might trust you for 3 fish.", true) };
      return { label: "feed the Lantern Turtle 3 fish 🐢", act: () => {
        ctx.packTake("Fish", 3);
        befriend("turtle", [
          { dur: 4.2, from: [L2.x + 7, L2.c.height(L2.x, L2.z) + 5, L2.z + 7], look: [L2.x, L2.c.height(L2.x, L2.z) + 2.5, L2.z], text: "The Lantern Turtle — older than Reedmere itself — gulps the fish, and all its shell-lanterns glow at once." },
          { dur: 3.6, from: [L2.x + 7, L2.c.height(L2.x, L2.z) + 5, L2.z + 7], look: [L2.x, L2.c.height(L2.x, L2.z) + 2.5, L2.z], text: "A single glowing scale drifts down to you. You can breathe easier just holding it." },
        ], "turtleshell", () => ctx.say("🐢 The Lantern Turtle is your friend! Its scale means you never run out of air.", true));
      } };
    }
    return null;
  }
  /** (balloons.js asks: did the whale come? — then the flight ends in Nimbusreach) */
  window.addEventListener("ww-star", () => {
    if (S.legends.whale || (S.stats.stars || 0) < 20) return;
    S.legends.whale = true;
    (S.owned ||= {}).whalesong = true;
    save();
    setTimeout(() => ctx.say("🐋 A great CLOUD-WHALE rises out of the clouds and sings a long, low song… It wants to show you its home! Balloons can now fly to ☁️ NIMBUSREACH, the City in the Clouds.", true), 800);
  });

  // ======================================================================
  //  🌦️ WEATHER EVENTS — a special sky every few days
  // ======================================================================
  const EVENTS = [
    { key: "aurora", icon: "🌌", name: "Aurora Night", text: "ribbons of light dance across the sky — every star you find is worth double!" },
    { key: "meteors", icon: "☄️", name: "Meteor Shower", text: "stars are FALLING — catch them where they land!" },
    { key: "golden", icon: "✨", name: "Golden Rain", text: "golden rain! Everything sells for DOUBLE today." },
  ];
  S.event ||= { day: -1, key: null };
  const eventNow = () => (S.event.day === day() ? EVENTS.find((e) => e.key === S.event.key) : null);
  window.__wwGoldenRain = () => !!(eventNow() && eventNow().key === "golden");
  let lastDay = -1;
  function eventsDaily() {
    if (lastDay === day()) return;
    lastDay = day();
    villageDaily();
    if (S.event.day === day()) return;
    if (hash(day(), 77) < 0.4) {
      const ev = EVENTS[Math.floor(hash(day(), 78) * EVENTS.length)];
      S.event = { day: day(), key: ev.key };
      save();
      setTimeout(() => ctx.say(`${ev.icon} A SPECIAL DAY — ${ev.name}! ${ev.text}`, true), 2000);
    }
  }
  const sky = { aurora: null, meteors: [], gold: null };
  function eventUpdate(dt, t) {
    const ev = eventNow();
    const out = ctx.world() === "outside";
    // 🌌 aurora (outside, at night)
    if (!sky.aurora) {
      sky.aurora = new THREE.Group();
      [0x6affb8, 0x8ab8ff, 0xd88aff].forEach((c, k) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 50, 30, 1), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
        m.position.set(0, 150 + k * 18, -200 + k * 40);
        m.rotation.x = -0.4;
        sky.aurora.add(m);
      });
      ctx.scene.add(sky.aurora);
    }
    sky.aurora.visible = out && ev && ev.key === "aurora" && night();
    if (sky.aurora.visible) {
      sky.aurora.position.set(me().x, 0, me().z);
      sky.aurora.children.forEach((m, k) => (m.material.opacity = 0.18 + Math.sin(t * 0.5 + k) * 0.08));
    }
    // ☄️ meteors: streaks that land near you — walk to the glow and press E
    if (out && ev && ev.key === "meteors" && night() && Math.random() < dt * 0.25 && sky.meteors.length < 4) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 16;
      const x = me().x + Math.cos(a) * r;
      const z = me().z + Math.sin(a) * r;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0xfff0a0 })), glow(0xffd86a, 4));
      g.position.set(x, ctx.terrainHeight(x, z) + 40, z);
      ctx.outsideGroup.add(g);
      sky.meteors.push({ g, x, z, landed: false });
    }
    for (const m of sky.meteors) {
      if (m.landed) continue;
      const gy = ctx.terrainHeight(m.x, m.z) + 0.6;
      m.g.position.y = Math.max(gy, m.g.position.y - dt * 30);
      if (m.g.position.y <= gy) m.landed = true;
    }
    // ✨ golden rain: glittering drops round you
    if (!sky.gold) {
      const N = 400;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) pos.set([(hash(i, 1) - 0.5) * 50, hash(i, 2) * 20, (hash(i, 3) - 0.5) * 50], i * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      sky.gold = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd84a, size: 0.25, transparent: true, opacity: 0.9 }));
      sky.gold.frustumCulled = false;
      ctx.scene.add(sky.gold);
    }
    sky.gold.visible = !!(ev && ev.key === "golden") && ctx.world() !== "den" && ctx.world() !== "home";
    if (sky.gold.visible) {
      sky.gold.position.set(me().x, me().y - 4, me().z);
      const p = sky.gold.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 6;
        if (y < 0) y += 20;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
  }
  function meteorInteract() {
    for (let i = 0; i < sky.meteors.length; i++) {
      const m = sky.meteors[i];
      if (!m.landed || !near(m.x, m.z, 2)) continue;
      return { label: "pick up the fallen star ☄️", act: () => {
        m.g.parent && m.g.parent.remove(m.g);
        sky.meteors.splice(i, 1);
        S.stats.meteors = (S.stats.meteors || 0) + 1;
        if (!(S.owned || {}).starstone) (S.owned ||= {}).starstone = true;
        S.coins += 6;
        ctx.addToPack("Crystal Fragments", 1);
        save();
        ctx.chime();
        ctx.say(`☄️ A fallen star, still warm! +🪙 6 and a crystal fragment. (${S.stats.meteors} caught)`);
      } };
    }
    return null;
  }

  // ======================================================================
  //  🎵 MUSIC — the reed flute (U) + the Music Contest (Golden Hollow)
  // ======================================================================
  let flute = null; // { notes: [], all: [] } while the flute is out
  // 🪈 while you play, a slim guide sits at the very TOP of the screen — the
  // world stays in view, you can walk about, and play anything you like
  const fEl = document.createElement("div");
  fEl.id = "ww-flute";
  fEl.style.cssText = "position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:59;display:none;align-items:center;gap:10px;padding:7px 12px;border-radius:14px;background:rgba(24,18,12,.88);color:#ffe6b0;font:600 14px 'Trebuchet MS',system-ui;box-shadow:0 6px 22px rgba(0,0,0,.45);max-width:96vw;flex-wrap:wrap;justify-content:center";
  document.body.appendChild(fEl);
  function openFlute() {
    if (!(S.owned || {}).reedflute) return ctx.say("🪈 You need a Reed Flute — Bard Lilting sells them at the Music Stage in Golden Hollow (or invite the Bard to your village!).", true);
    closeCard();
    flute = { notes: [], all: [], lit: 0, msg: "" };
    drawFlute("");
  }
  function closeFlute() {
    flute = null;
    fEl.style.display = "none";
  }
  function drawFlute(msg) {
    if (!flute) return;
    if (msg !== undefined) flute.msg = msg;
    const key = (n) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;font:900 17px 'Trebuchet MS',sans-serif;${flute.lit === n ? "background:#ffd860;color:#2a1a0a;transform:scale(1.12)" : "background:rgba(255,255,255,.12);color:#ffe6b0"}">${n}</span>`;
    const songs = SONGS.map((g) => `<span title="${g.name} — ${g.text}" style="white-space:nowrap">${g.icon} ${g.notes.join(" ")}</span>`).join(" &nbsp; ");
    fEl.innerHTML = `<span style="font-size:20px">🎵</span>
      <span style="display:inline-flex;gap:4px">${[1, 2, 3, 4, 5, 6, 7, 8].map(key).join("")}</span>
      <span style="font:900 16px 'Trebuchet MS',sans-serif;min-width:110px;color:#fff;letter-spacing:2px">${flute.all.slice(-6).join(" ") || "play!"}</span>
      <span style="font-size:13px;color:#e8d4a8;flex-basis:100%;text-align:center">${songs}</span>
      ${flute.msg ? `<span style="color:#a8ffb8;font-weight:900">${flute.msg}</span>` : ""}
      <button id="ww-flute-x" style="border:0;border-radius:9px;padding:5px 10px;background:#8a3a2a;color:#fff;font:900 13px 'Trebuchet MS',sans-serif;cursor:pointer">✕ Put away (Esc)</button>`;
    fEl.style.display = "flex";
    fEl.querySelector("#ww-flute-x").onclick = closeFlute;
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "KeyU" && !e.repeat && !ctx.playing() && !document.body.classList.contains("photo-mode")) {
        if (flute) closeFlute();
        else openFlute();
        return;
      }
      if (e.code === "Escape") {
        if (flute) closeFlute();
        contest = null;
        drawContest();
      }
      const n = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Digit5: 5, Digit6: 6, Digit7: 7, Digit8: 8 }[e.code];
      if (!n) return;
      if (contest) return n <= 4 && (contestNote(n), e.stopImmediatePropagation());
      if (!flute) return;
      e.stopImmediatePropagation();
      tone(NOTE_HZ[n]);
      flute.all.push(n);
      flute.lit = n;
      setTimeout(() => flute && flute.lit === n && ((flute.lit = 0), drawFlute()), 220);
      flute.notes.push(n);
      if (flute.notes.length > 6) flute.notes.shift();
      window.dispatchEvent(new CustomEvent("ww-note", { detail: { notes: flute.notes.slice(-4), all: [...flute.notes] } })); // (🔍 secrets + story tunes listen for their 4 notes)
      const song = SONGS.find((g) => flute.notes.length >= g.notes.length && g.notes.every((v, i) => v === flute.notes[flute.notes.length - g.notes.length + i]));
      if (song) {
        (S.songs ||= {})[song.key] = true;
        save();
        playSong(song);
        flute.notes = [];
        drawFlute(`${song.icon} ${song.name}!`);
      } else drawFlute("");
    },
    true
  );
  function playSong(song) {
    S.notesPlayed = (S.notesPlayed || 0) + 1;
    ctx.chime();
    const P = me();
    const fx = (fn, secs) => {
      // (a little effect that runs for a while, then tidies itself away)
      const t0 = performance.now();
      const step = () => {
        const k = (performance.now() - t0) / 1000;
        if (fn(k) === false || k > secs) return;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (song.key === "sun") ctx.setTime(0.3);
    if (song.key === "lull") {
      ctx.heal(40);
      ctx.setTime(0.85);
    }
    if (song.key === "calm") S.calmUntil = performance.now() + 45000;
    if (song.key === "rain" || song.key === "clear") window.__ww && window.__ww.setWeather && window.__ww.setWeather(song.key === "rain" ? "rain" : "clear");
    if (song.key === "bloom") {
      ctx.heal(10);
      // flowers, right where you're standing — in the forest, a city, anywhere
      const g = new THREE.Group();
      for (let k = 0; k < 44; k++) {
        const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 5.5;
        const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
        const y = ctx.world() === "outside" ? ctx.terrainHeight(x, z) : P.y;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0x4a9a3a }));
        stem.position.set(x, y + 0.2, z);
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: [0xff9ab8, 0xffe06a, 0xffffff, 0xb88aff][k % 4] }));
        f.position.set(x, y + 0.4, z);
        g.add(stem, f);
      }
      g.scale.y = 0.01;
      (ctx.world() === "outside" ? ctx.outsideGroup : ctx.scene).add(g);
      fx((k) => {
        g.scale.y = Math.min(1, k / 0.8);
        if (ctx.world() !== "outside" && k > 40) return (g.parent && g.parent.remove(g)), false; // (indoors they fade after a while)
      }, 41);
    }
    if (song.key === "flutter") {
      const flock = [];
      for (let k = 0; k < 12; k++) {
        const b = new THREE.Group();
        for (const sx of [-1, 1]) {
          const w = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), new THREE.MeshBasicMaterial({ color: [0xffb040, 0x8ad8ff, 0xff8ad8, 0xffe060][k % 4], side: THREE.DoubleSide, transparent: true }));
          w.position.x = sx * 0.2;
          b.add(w);
        }
        ctx.scene.add(b);
        flock.push(b);
      }
      fx((k) => {
        const p = me();
        flock.forEach((b, i) => {
          const a = k * (0.9 + (i % 4) * 0.15) + i;
          b.position.set(p.x + Math.cos(a) * (1.4 + (i % 3) * 0.6), p.y + 0.8 + Math.sin(k * 2 + i) * 0.5 + (i % 3) * 0.3, p.z + Math.sin(a) * (1.4 + (i % 3) * 0.6));
          b.rotation.y = -a;
          b.children.forEach((w, j) => (w.rotation.y = (j ? -1 : 1) * Math.sin(k * 14 + i) * 1.1));
          b.children.forEach((w) => (w.material.opacity = k > 26 ? Math.max(0, (30 - k) / 4) : 1));
        });
        if (k > 30) return flock.forEach((b) => b.parent && b.parent.remove(b)), false;
      }, 31);
    }
    ctx.say(`${song.icon} ♪ ${song.name} — ${song.text}!`, true);
  }

  // 🎼 the Music Contest: Bard Lilting plays a tune, you play it back
  let contest = null;
  let stage = null;
  function buildStage(c) {
    if (stage && stage.c === c) return;
    let at = { x: 30, z: 6 };
    for (let r = 0; r < 25; r += 1.5) {
      let ok = false;
      for (let a = 0; a < 6.3; a += 0.6) {
        const x = 30 + Math.cos(a) * r;
        const z = 6 + Math.sin(a) * r;
        if (!c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 3)) {
          at = { x, z };
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    const g = new THREE.Group();
    g.position.set(at.x, c.height(at.x, at.z), at.z);
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.5, 14), M(0x8a5e36));
    deck.position.y = 0.25;
    const bard = buildThistle({ tunicColor: 0x8a5ad8, hoodColor: 0x6a3ab8, pack: false });
    bard.position.y = 0.5;
    g.add(deck, bard);
    for (let k = 0; k < 5; k++) {
      const n = glow([0xff6a6a, 0xffd84a, 0x6ad86a, 0x6ab8ff, 0xd88aff][k], 0.9);
      n.position.set(Math.cos(k) * 1.4, 2.6 + k * 0.25, Math.sin(k) * 1.4);
      g.add(n);
    }
    g.rotation.y = Math.atan2(-at.x, -at.z);
    c.group.add(g);
    c.colliders.push({ x: at.x, z: at.z, r: 2.9 });
    stage = { c, ...at, front: { x: at.x + Math.sin(g.rotation.y) * 3.8, z: at.z + Math.cos(g.rotation.y) * 3.8 } };
  }
  const NOTE_COL = ["", "#e84a4a", "#f0c030", "#4ac060", "#4a8ae8"];
  const NOTE_EMO = ["", "🔴", "🟡", "🟢", "🔵"];
  const WIN_ROUNDS = 4;
  function openStage() {
    const owned = (S.owned || {}).reedflute;
    openCard(
      `<div class="card"><h3>🎼 Bard Lilting's Music Stage</h3><div class="coins">🪙 ${S.coins}</div>
      ${owned ? `<p style="font:15px Georgia">“Fancy a contest? Here's how it works:”</p>
      <ol style="font:14px system-ui;line-height:1.6;margin:4px 0 10px 20px">
        <li>🎧 <b>LISTEN</b> — I play a little tune. Watch the notes light up!</li>
        <li>🎵 <b>YOUR TURN</b> — play the SAME notes back, in the same order.<br>
          Press <b>1</b> 🔴 &nbsp; <b>2</b> 🟡 &nbsp; <b>3</b> 🟢 &nbsp; <b>4</b> 🔵 — or click the big buttons.</li>
        <li>✅ Get it right and the next tune is <b>one note longer</b>.</li>
        <li>🏆 Win <b>${WIN_ROUNDS} rounds</b> for the Golden Note (+🪙 40)! One wrong note ends the contest — you can always try again.</li>
      </ol>
      <div style="text-align:center"><button id="mgo" style="font:bold 17px system-ui;padding:8px 22px">🎼 I'm ready — start!</button></div>`
      : `<p style="font:14px Georgia">“Every Moonkeeper should carry a song! You need a reed flute to play in my contest — just 15 coins.”</p>
      <div style="text-align:center"><button id="mbuy" ${S.coins < priceNow(15, "flute") ? "disabled" : ""}>🪈 Buy a Reed Flute (🪙 ${priceNow(15, "flute")})</button></div>`}
      <div class="close">Esc — leave · U — play your flute anywhere</div></div>`,
      (el) => {
        const b = el.querySelector("#mbuy");
        if (b) b.onclick = () => {
          S.coins -= priceNow(15, "flute");
          (S.owned ||= {}).reedflute = true;
          save();
          ctx.chime();
          openStage();
        };
        const g = el.querySelector("#mgo");
        if (g) g.onclick = () => {
          closeCard();
          contest = { round: 3, tune: [], heard: [], phase: "listen", lit: -1, wrong: false };
          nextRound();
        };
      }
    );
  }
  // ---- the contest panel (big, clear, on screen the whole time) ----
  const cEl = document.createElement("div");
  cEl.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:58;width:min(560px,92vw);padding:18px 22px;border-radius:18px;background:rgba(38,24,58,.94);color:#fff;font:15px system-ui;text-align:center;box-shadow:0 14px 50px rgba(0,0,0,.6);display:none";
  document.body.appendChild(cEl);
  function drawContest(msg = "") {
    if (!contest) {
      cEl.style.display = "none";
      return;
    }
    cEl.style.display = "";
    const C = contest;
    const round = C.round - 2;
    const head = C.phase === "listen" ? "🎧 LISTEN… watch the notes!" : C.phase === "play" ? "🎵 YOUR TURN — play it back!" : C.phase === "done" ? "🏁 Contest over" : "✅ Well played!";
    const tuneRow = C.tune.map((n, i) => {
      // (listening: notes light up one by one · your turn: they hide — remember them!)
      const shown = C.phase === "listen" ? i <= C.lit : C.phase === "play" ? i < C.heard.length : true;
      const hit = i < C.heard.length;
      const bad = C.wrong && i === C.heard.length - 1;
      const bg = !shown ? "rgba(255,255,255,.12)" : NOTE_COL[n];
      const glowS = C.phase === "listen" && i === C.lit ? "box-shadow:0 0 18px #fff;transform:scale(1.15)" : "";
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:3px;border-radius:50%;background:${bg};font:bold 18px system-ui;${glowS}">${hit ? (bad ? "✖" : "✓") : shown ? n : "?"}</span>`;
    }).join("");
    cEl.innerHTML = `<div style="font:bold 13px system-ui;color:#d8c8ff">🎼 MUSIC CONTEST · Round ${round} of ${WIN_ROUNDS} to win${C.round - 3 >= WIN_ROUNDS ? " (bonus round!)" : ""}</div>
      <div style="font:bold 24px Georgia;margin:8px 0 6px;color:#ffe08a">${head}</div>
      <div style="margin:6px 0 12px">${tuneRow}</div>
      <div style="margin-bottom:6px;color:#d8c8ff">${C.phase === "play" ? `Note ${Math.min(C.heard.length + 1, C.tune.length)} of ${C.tune.length} — press its number:` : C.phase === "listen" ? "Remember the colors and numbers — they'll hide on your turn!" : ""}</div>
      <div>${[1, 2, 3, 4].map((n) => `<button data-n="${n}" ${C.phase === "play" ? "" : "disabled"} style="width:92px;height:72px;margin:5px;border:0;border-radius:14px;background:${NOTE_COL[n]};color:#fff;font:bold 26px system-ui;cursor:pointer;opacity:${C.phase === "play" ? 1 : 0.45}">${n}<div style="font:12px system-ui">${["", "red", "yellow", "green", "blue"][n]}</div></button>`).join("")}</div>
      <div style="min-height:22px;margin-top:8px;color:#a8ffb8;font-weight:bold">${msg}</div>
      <div style="font:12px system-ui;color:#b8a8d8;margin-top:4px">${C.phase === "done" ? "Talk to Bard Lilting to play again · Esc — close" : "Esc — stop the contest"}</div>`;
    cEl.querySelectorAll("button[data-n]").forEach((b) => (b.onclick = () => contest && contest.phase === "play" && contestNote(+b.dataset.n)));
  }
  function nextRound() {
    const C = contest;
    C.tune = Array.from({ length: C.round }, () => 1 + Math.floor(Math.random() * 4));
    C.heard = [];
    C.wrong = false;
    C.phase = "listen";
    C.lit = -1;
    drawContest();
    // play the tune, lighting each note as it sounds
    C.tune.forEach((n, i) => {
      setTimeout(() => {
        if (contest !== C) return;
        tone(NOTE_HZ[n], 0, 0.45);
        C.lit = i;
        drawContest();
      }, 700 + i * 700);
    });
    setTimeout(() => {
      if (contest !== C) return;
      C.phase = "play";
      drawContest("Your turn!");
    }, 700 + C.tune.length * 700 + 300);
  }
  function contestNote(n) {
    const C = contest;
    if (C.phase !== "play") return;
    tone(NOTE_HZ[n]);
    C.heard.push(n);
    const i = C.heard.length - 1;
    if (C.tune[i] !== n) {
      const score = C.round - 3;
      C.wrong = true;
      C.phase = "done";
      drawContest(`Oops — that was ${NOTE_EMO[n]} ${n}, but the note was ${NOTE_EMO[C.tune[i]]} ${C.tune[i]}. You won ${score} round${score === 1 ? "" : "s"}!${score >= WIN_ROUNDS ? "" : ` (Win ${WIN_ROUNDS} for the Golden Note.)`}`);
      setTimeout(() => {
        if (contest === C) {
          contest = null;
          drawContest();
        }
      }, 5000);
      return;
    }
    if (C.heard.length === C.tune.length) {
      C.round++;
      C.phase = "good";
      ctx.chime();
      let msg = "Perfect! Next tune is one note longer…";
      if (C.round - 3 >= WIN_ROUNDS && !(S.owned || {}).musicmedal) {
        (S.owned ||= {}).musicmedal = true;
        S.coins += 40;
        save();
        msg = "🏆 FOUR ROUNDS! The Golden Note is yours, +🪙 40! (keep going for fun…)";
        ctx.say("🎼 The crowd goes wild! The Golden Note is yours! +🪙 40", true);
      }
      drawContest(msg);
      setTimeout(() => contest === C && nextRound(), 1800);
    } else drawContest("✓ Right! Keep going…");
  }

  // ======================================================================
  //  📸 PHOTO CHALLENGES — a new request on the Village Board each day
  // ======================================================================
  const PHOTOS = [
    { key: "sunset", icon: "🌅", text: "the sky at SUNSET (in the forest)", ok: () => ctx.world() === "outside" && ctx.dayTime() > 0.7 && ctx.dayTime() < 0.8 },
    { key: "pet", icon: "🐾", text: "your PET, close up", ok: () => ctx.petNear() },
    { key: "night", icon: "🌙", text: "anywhere under the NIGHT sky", ok: () => night() && ctx.world() !== "den" && ctx.world() !== "home" },
    { key: "frost", icon: "❄️", text: "FROSTPINE in the snow", ok: () => here() === "frostpine" },
    { key: "lagoon", icon: "🌊", text: "REEDMERE's lagoon", ok: () => here() === "reedmere" },
    { key: "silver", icon: "🌙", text: "the moon-pool of SILVERVEIL", ok: () => here() === "silverveil" },
    { key: "deep", icon: "🐠", text: "the DROWNED DEEP, underwater", ok: () => here() === "deep" },
    { key: "cloud", icon: "☁️", text: "NIMBUSREACH, the City in the Clouds", ok: () => here() === "cloud" },
    { key: "friends", icon: "🧑‍🎓", text: "you and SPRIG together", ok: () => ctx.sprigNear() },
  ];
  const todaysPhoto = () => PHOTOS[Math.floor(hash(day(), 31) * PHOTOS.length)];
  window.addEventListener("ww-photo", () => {
    const P = todaysPhoto();
    if (S.photoDone[day()]) return;
    if (P.ok()) {
      S.photoDone[day()] = true;
      S.stats.photoJobs = (S.stats.photoJobs || 0) + 1;
      S.coins += 30;
      save();
      setTimeout(() => ctx.say(`📸 That's PERFECT for today's photo request (${P.icon} ${P.text})! +🪙 30`, true), 900);
    }
  });

  // ======================================================================
  //  🙈 SPRIG'S HIDE & SEEK — every so often Sprig runs off to hide
  // ======================================================================
  let hide = null;
  let hideT = 240;
  function hideUpdate(dt) {
    if (!ctx.sprigActive() || ctx.playing() || ctx.world() !== "outside") return;
    if (!hide) {
      hideT -= dt;
      if (hideT > 0) return;
      hideT = 300 + Math.random() * 200;
      const a = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 14;
      const sp = clearSpot(me().x + Math.cos(a) * r, me().z + Math.sin(a) * r, 1);
      const g = new THREE.Group();
      g.add(glow(0xffe08a, 1.2, 0.6));
      g.position.set(sp.x, ctx.terrainHeight(sp.x, sp.z) + 0.8, sp.z);
      ctx.outsideGroup.add(g);
      hide = { ...sp, g, t: 90 };
      ctx.sprigHide(true);
      ctx.say("🙈 Sprig: “Bet you can't find me! Ready or not… GO!” (Sprig is hiding nearby — look for a little sparkle! 90s)", true);
      return;
    }
    hide.t -= dt;
    hide.g.children[0].material.opacity = 0.3 + Math.abs(Math.sin(performance.now() / 300)) * 0.6;
    if (hide.t <= 0) {
      ctx.say("🙈 Sprig: “Haha, you gave up! I was RIGHT HERE!” (Sprig skips back to your side)", true);
      endHide();
    }
  }
  function endHide() {
    if (hide) hide.g.parent && hide.g.parent.remove(hide.g);
    hide = null;
    ctx.sprigHide(false);
  }
  function hideInteract() {
    if (!hide || !near(hide.x, hide.z, 2.4)) return null;
    return { label: "FOUND YOU, Sprig! 🙈", act: () => {
      S.stats.sprigFound = (S.stats.sprigFound || 0) + 1;
      S.coins += 15;
      save();
      ctx.chime();
      ctx.say(`🧑‍🎓 Sprig: “Aww, you found me! You're SO good at this!” +🪙 15 (found ${S.stats.sprigFound} time${S.stats.sprigFound === 1 ? "" : "s"})`, true);
      endHide();
    } };
  }

  // ======================================================================
  //  🏆 TITLES — badges you earn, and one to wear under your name (Y)
  // ======================================================================
  const BADGES = [
    { key: "legend", icon: "🌙", name: "Legend of the Six Cities", ok: () => !!(ctx.story().p14 && ctx.story().p14.done) },
    { key: "hero", icon: "💠", name: "Hero of the Underglow", ok: () => !!(ctx.story().p13 && ctx.story().p13.done) },
    { key: "friend", icon: "💛", name: "Friend of Everyone", ok: () => Object.values(S.friends || {}).filter((f) => f.hearts >= 5).length >= 3 },
    { key: "rafter", icon: "🛶", name: "Fastest Rafter", ok: () => (S.medals || {}).reedmere === "gold" },
    { key: "chef", icon: "🍲", name: "Master Chef", ok: () => Object.keys(S.cooked || {}).length >= 10 },
    { key: "mayor", icon: "🏘️", name: "Village Mayor", ok: () => S.village.settlers.length >= 3 },
    { key: "beastfriend", icon: "🦌", name: "Friend of Legends", ok: () => Object.keys(S.legends).length >= 3 },
    { key: "star", icon: "⭐", name: "Star Catcher", ok: () => (S.stats.stars || 0) >= 50 },
    { key: "bard", icon: "🎼", name: "Golden Bard", ok: () => !!(S.owned || {}).musicmedal },
    { key: "seeker", icon: "🙈", name: "Champion Seeker", ok: () => (S.stats.sprigFound || 0) >= 5 },
    { key: "snapper", icon: "📸", name: "Photographer", ok: () => (S.stats.photoJobs || 0) >= 5 },
    { key: "quester", icon: "⚔️", name: "Quest Master", ok: () => (S.questVolume || 1) >= 3 },
    { key: "glider", icon: "🪁", name: "Sky Glider", ok: () => (S.stats.glide || 0) >= 300 },
    { key: "weather", icon: "☄️", name: "Stargazer", ok: () => (S.stats.meteors || 0) >= 10 },
  ];
  const titleEl = document.createElement("div");
  titleEl.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:39;padding:3px 12px;border-radius:999px;background:rgba(40,28,10,.75);color:#ffe08a;font:bold 13px Georgia;pointer-events:none;display:none";
  document.body.appendChild(titleEl);
  function badgeCheck() {
    for (const b of BADGES) {
      if (S.badges[b.key] || !b.ok()) continue;
      S.badges[b.key] = true;
      if (!S.title) S.title = b.key;
      save();
      ctx.chime();
      ctx.say(`🏆 NEW TITLE: ${b.icon} “${b.name}”! (Y — choose which title you wear)`, true);
      break;
    }
    const b = BADGES.find((x) => x.key === S.title);
    titleEl.style.display = b && S.badges[b.key] && !document.body.classList.contains("photo-mode") ? "" : "none";
    if (b) titleEl.textContent = `${b.icon} Thistle Mosswhisker, ${b.name}`;
  }
  function openTitles() {
    openCard(
      `<div class="card" style="max-height:84vh;overflow:auto"><h3>🏆 Titles & Badges</h3><div class="coins">${Object.keys(S.badges).length}/${BADGES.length} earned · click one to wear it</div>
      ${BADGES.map((b) => `<div class="item" style="${S.badges[b.key] ? "" : "opacity:.45"}"><span class="ic">${S.badges[b.key] ? b.icon : "🔒"}</span><span class="nm">${b.name}</span>${S.badges[b.key] ? `<button data-t="${b.key}" ${S.title === b.key ? "disabled" : ""}>${S.title === b.key ? "wearing" : "wear"}</button>` : ""}</div>`).join("")}
      ${ctx.story().p14 && ctx.story().p14.done ? `<div style="text-align:center;margin-top:10px"><button id="ngplus">🌙 Start NEW GAME+ ${window.__wwNGPlus && window.__wwNGPlus() ? `(you've done it ${window.__wwNGPlus()}×)` : ""}</button></div>` : `<div class="coins">🌙 Finish the Road to Silverveil to unlock NEW GAME+</div>`}
      <div class="close">Y or Esc — close</div></div>`,
      (el) => {
        el.querySelectorAll("button[data-t]").forEach((x) => (x.onclick = () => {
          S.title = x.dataset.t;
          save();
          openTitles();
        }));
        const ng = el.querySelector("#ngplus");
        if (ng) ng.onclick = () => window.__wwStartNGPlus && window.__wwStartNGPlus();
      }
    );
  }
  window.addEventListener("keydown", (e) => {
    if (ctx.playing() || e.repeat) return;
    if (e.code === "KeyY") openTitles();
    if (e.code === "KeyO" && ctx.world() === "outside" && village.board) openVillage();
  });

  // ======================================================================
  //  ☁️ NIMBUSREACH — the people of the clouds
  // ======================================================================
  let cloudBuilt = null;
  function cloudBuild(c) {
    if (cloudBuilt === c) return;
    cloudBuilt = c;
    const add = (name, tunic, at) => {
      const m = buildThistle({ tunicColor: tunic, hoodColor: 0xffffff, pack: false });
      m.position.set(at.x, c.height(at.x, at.z), at.z);
      m.rotation.y = Math.atan2(-at.x, -at.z);
      c.group.add(m);
      return { name, ...at };
    };
    const I = CLOUD.isles;
    c.people.storm = add("Storm-Keeper Gale", 0x6a8ad8, { x: I[1].x - 2, z: I[1].z + 3 });
    c.people.cloudseller = add("Cloud-Baker Fluff", 0xf4b8d8, { x: I[2].x, z: I[2].z + 2 });
    c.people.gardener = add("Rainbow-Gardener Prism", 0x8ad86a, { x: I[3].x + 2, z: I[3].z + 3 });
  }
  function cloudInteract() {
    const c = here() === "cloud" ? ctx.city() : null;
    if (!c) return null;
    cloudBuild(c);
    const P = c.people;
    if (near(P.storm.x, P.storm.z)) return { label: "talk to Storm-Keeper Gale 🌦️", act: () => {
      openCard(`<div class="card"><h3>🌦️ The Weather Spire</h3><div class="coins">Storm-Keeper Gale · 🪙 ${S.coins}</div>
        <p style="font:14px Georgia">“From up here, I stir the weather for the whole world below. For ${priceNow(25, "weather")} coins, I'll make TODAY special!”</p>
        ${EVENTS.map((e) => `<div class="item"><span class="ic">${e.icon}</span><span class="nm">${e.name}<small>${e.text}</small></span><button data-e="${e.key}" ${S.coins < priceNow(25, "weather") ? "disabled" : ""}>🪙 ${priceNow(25, "weather")}</button></div>`).join("")}
        <div class="close">Esc — leave</div></div>`, (el) => el.querySelectorAll("button[data-e]").forEach((b) => (b.onclick = () => {
        S.coins -= priceNow(25, "weather");
        bought("weather");
        S.event = { day: day(), key: b.dataset.e };
        save();
        closeCard();
        ctx.chime();
        const ev = EVENTS.find((x) => x.key === b.dataset.e);
        ctx.say(`${ev.icon} Gale whirls the weather-vane… ${ev.name} — ${ev.text}`, true);
      })));
    } };
    if (near(P.cloudseller.x, P.cloudseller.z)) return { label: "buy cloud treats from Fluff ☁️", act: () => {
      const goods = [
        { icon: "🍬", name: "Cloud Candy", heal: 25, price: 5 },
        { icon: "🧁", name: "Rainbow Cupcake", heal: 45, price: 9 },
        { icon: "☕", name: "Sky Cocoa", heal: 30, price: 6, warm: true },
      ];
      inflate(goods, (g) => g.name);
      const draw = (msg = "") => openCard(`<div class="card"><h3>☁️ Fluff's Cloud Bakery</h3><div class="coins">🪙 ${S.coins}</div>
        ${goods.map((g, i) => `<div class="item"><span class="ic">${g.icon}</span><span class="nm">${g.name}<small>+${g.heal} ❤️</small></span><button data-g="${i}" ${S.coins < g.price ? "disabled" : ""}>🪙 ${g.price}</button></div>`).join("")}
        <div class="msg">${msg}</div><div class="close">Esc — leave</div></div>`, (el) => el.querySelectorAll("button[data-g]").forEach((b) => (b.onclick = () => {
        const g = goods[+b.dataset.g];
        S.coins -= g.price;
        bought(g.name);
        save();
        ctx.chime();
        draw(`You bought ${g.icon} ${g.name}!${bagFood(g)}`);
      })));
      draw();
    } };
    if (near(P.gardener.x, P.gardener.z)) return { label: "talk to Rainbow-Gardener Prism 🌈", act: () => {
      if ((S.owned || {}).rainbowseed) return ctx.say("🌈 Prism: “Plant that rainbow seed with love! Oh — you already did? Then the rainbows are yours.”", true);
      (S.owned ||= {}).rainbowseed = true;
      registerKeepsake("rainbowseed", "🌈", "Rainbow Seed (from the cloud garden)");
      save();
      ctx.chime();
      ctx.say("🌈 Prism: “A visitor from BELOW? How lovely! Take a rainbow seed — a keepsake from the cloud garden.”", true);
    } };
    return null;
  }

  function neighbourShop(st, msg = "") {
    const wares = inflate(VILLAGE_WARES[st.name] || []);
    openCard(`<div class="card"><h3>🛍️ ${st.name}</h3><div class="coins">🪙 ${S.coins} · from ${st.from}</div>
      ${wares.map((W) => {
        const owned = W.keep && (S.owned || {})[W.key];
        return `<div class="item"><span class="ic">${W.icon}</span><span class="nm">${W.name}${W.pack > 1 ? ` ×${W.pack}` : ""}<small>${W.food ? `food · +${W.food.heal} ❤️${W.food.warm ? " · warming" : ""}` : W.pack ? "for your pack" : "a keepsake"}${powerText(W.key) ? ` · <b>${powerText(W.key)}</b>` : ""}</small></span><button data-w="${W.key}" ${owned || S.coins < W.price ? "disabled" : ""}>${owned ? "owned" : "🪙 " + W.price}</button></div>`;
      }).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — say goodbye</div></div>`, (el) => el.querySelectorAll("button[data-w]").forEach((b) => (b.onclick = () => {
      const W = wares.find((x) => x.key === b.dataset.w);
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
      save();
      ctx.chime();
      neighbourShop(st, m);
    })));
  }

  // ================================================================ hooks
  function interactable() {
    if (ctx.world() === "outside") {
      buildVillage();
      if (village.board && near(village.board.x, village.board.z, 2.4)) return { label: `read the Village Board 🏘️ — today's photo request: ${todaysPhoto().icon} ${todaysPhoto().text}`, act: openVillage };
      // 🛍️ every neighbour has a little shop at their front door
      // (only the tradesfolk — baker, fisher, weaver, woodcutter — keep a shop)
      for (let i = 0; i < SETTLERS.length; i++) {
        const H = village.houses[i];
        const st = SETTLERS[i];
        if (!H || !S.village.settlers.includes(st.name) || !near(H.x, H.z, 2.4)) continue;
        if (VILLAGE_WARES[st.name]) return { label: `shop with ${st.name} 🛍️`, act: () => neighbourShop(st) };
        if (st.name === "Healer Chamomile") return { label: "visit Healer Chamomile 🌿", act: () => {
          ctx.heal(100);
          ctx.chime();
          ctx.say("🌿 Chamomile: “There, there — good as new!” (hearts full)", true);
        } };
      }
    }
    if (here() === "golden") {
      buildStage(ctx.city());
      if (stage && near(stage.front.x, stage.front.z, 3)) return { label: "visit Bard Lilting's Music Stage 🎼", act: openStage };
    }
    return hideInteract() || meteorInteract() || legendInteract() || cloudInteract();
  }
  function update(dt, t) {
    if (ctx.world() === "outside") buildVillage();
    eventsDaily();
    eventUpdate(dt, t);
    moonStag(t);
    lanternTurtle(t);
    cloudWhale(t);
    hideUpdate(dt);
    badgeCheck();
    if (S.village.settlers.includes("Bard Lilting") && ctx.world() === "outside" && Math.random() < dt * 0.05 && village.houses[5] && near(village.houses[5].x, village.houses[5].z, 12)) {
      const tune = [1, 3, 2, 4, 3];
      tune.forEach((n, i) => tone(NOTE_HZ[n] / 2, i * 0.3, 0.4));
    }
  }
  if (new URLSearchParams(location.search).get("mcontest")) setTimeout(() => {
    contest = { round: 3, tune: [], heard: [], phase: "listen", lit: -1, wrong: false };
    nextRound();
  }, 3000); // (test)
  window.__wwCalm = () => (S.calmUntil || 0) > performance.now();
  return { interactable, update, cloudOpen: () => !!S.legends.whale, calm: () => (S.calmUntil || 0) > performance.now(), noAir: () => !!(S.owned || {}).turtleshell };
}
