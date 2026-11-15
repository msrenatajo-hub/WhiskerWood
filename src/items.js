// ------------------------------------------------------------
//  ✨ THINGS THAT DO WHAT THEY SAY — any treasure whose name promises
//  something (a dragon egg, a map, a key, a compass, seeds, a lantern…)
//  really does it. Open your backpack (B) → “✨ Things you can use”.
//
//    🥚 the Unhatched Dragon Egg   → it hatches! a baby dragon follows you
//    🗺️ the Smuggler's Map         → reveals a hidden hatch in Golden Hollow…
//    🗝️ the Thieves' Skeleton Key  → …which it unlocks (and the little door in your cottage)
//    🗝️ the Old Lighthouse Key     → opens the lost lighthouse in Reedmere
//    🧭 compasses · 🔍 the magnifying glass → point you to the nearest secret
//    🌱 seed packets               → plant them by your cottage; they grow over the days
//    🔔 the Harvest Bell           → ring it and everything you planted grows a day
//    🏮 lanterns, candles, glow-jars, the Caught Star → carry a real light
//    🪁 the Leaf Kite → fly it · 🔮 snow globes → shake them · 🔮 the Storm-Glass → tells the weather
//    🫧 the Wishing Pearl → a wish a day · 🏮 the Sky Lantern → let it go
//    🗝️ the Season Clock's Winding Key → turn the season · 🐋 / 💎 shells and crystals → sing
// ------------------------------------------------------------
import * as THREE from "three";
import { cityState, saveCity, registerKeepsake, setLook } from "./cityLife.js";
import { bagFood } from "./food.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const Mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });

registerKeepsake("doubloon", "🪙", "A Smuggler's Gold Doubloon (from the Smugglers' Hold)");
registerKeepsake("rainbowbloom", "🌈", "A Rainbow Bloom (grown from a Rainbow Seed)");
ITEM_POWERS.doubloon = { type: "luck", n: 0.08 };
ITEM_POWERS.rainbowbloom = { type: "luck", n: 0.05 };

// the lights you can carry
const LIGHTS = {
  moonlantern: [0xd8e4ff, "Moonlight Lantern"], pumpkinlantern: [0xffa040, "Pumpkin Lantern"], moonmothlantern: [0xc8b8ff, "Moon Moth Lantern"],
  wardenlantern: [0xff9a40, "Warden's Ember Lantern"], stormlantern: [0xffc060, "Storm-Lantern"], eb_paperlantern: [0xffd890, "Paper Lantern"],
  eb_fireflylamp: [0xe8ff9a, "Firefly Lamp"], fireflyjar: [0xe8ff9a, "Firefly Jar"], eb_glowjar: [0x9affc8, "Jar of Glow-Moss"], eb_candle: [0xffd890, "Reading Candle"],
  firstlantern: [0xfff0c0, "Lantern of the First Moonkeeper"], starcatcher: [0xfff4b0, "the Caught Star"], glowjar: [0x9fffa0, "Jar of Glow-Worm Light"],
  foglantern: [0xe8eeff, "Fog Lantern"], lampglass: [0xfff0a0, "Lighthouse Lens"], sunstone: [0xffd860, "Sunstone"], iceheart: [0x9fd8ff, "Heart of the Ice"],
};
// the seeds you can plant: what grows, and what you harvest
const SEEDS = {
  eb_seeds: { name: "Wonder Seeds", plant: 0x8ad86a, bloom: 0xff8ad8, harvest: "a heap of wonder-fruit" },
  goldenseeds: { name: "Golden Seeds", plant: 0x6ab84a, bloom: 0xffd040, harvest: "golden sunflowers worth 🪙 40" },
  pumpkinseeds: { name: "Giant Pumpkin Seeds", plant: 0x4a8a3a, bloom: 0xe8802a, harvest: "three giant pumpkins" },
  rainbowseed: { name: "a Rainbow Seed", plant: 0x6ad8a8, bloom: 0xb88aff, harvest: "a Rainbow Bloom" },
  br_sunseed: { name: "a Sun-Seed", plant: 0x9ad84a, bloom: 0xffe060, harvest: "a little sun of your own" },
  heartwood: { name: "the Heartwood Acorn", plant: 0x5a8a3a, bloom: 0x8a6a3a, harvest: "a little magic oak — and a pocketful of glowing acorns" },
};

export function initItems(ctx) {
  // ctx: { world(), city(), mouseRig, scene, outsideGroup, terrainHeight, home, say, chime, goCity, flyInto, addToPack,
  //        weather(), setTimeOfDay, dayTime(), petsSync }
  const S = () => cityState();
  const owned = (k) => !!(S().owned || {})[k];
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const day = () => S().days || 0;
  const I = () => (S().itemUse ||= { garden: [], used: {} });
  const usedToday = (k) => I().used[k] === day();
  const markUsed = (k) => (I().used[k] = day());
  const sound = (freqs, dur = 1.5, type = "sine", vol = 0.09) => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, ac.currentTime + i * 0.25);
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.setValueAtTime(vol, ac.currentTime + i * 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.25 + dur);
        o.connect(g).connect(ac.destination);
        o.start(ac.currentTime + i * 0.25);
        o.stop(ac.currentTime + i * 0.25 + dur + 0.1);
      });
      setTimeout(() => ac.close(), (freqs.length * 0.25 + dur) * 1000 + 400);
    } catch {}
  };
  const effects = [];

  // ---------------------------------------------------------------- 🧭 which way is the nearest secret?
  function pointToSecret(who, placesOnly = false) {
    const list = ((window.__wwSecrets && window.__wwSecrets.unfoundHere && window.__wwSecrets.unfoundHere()) || []).filter((p) => !placesOnly || /^(p_|r_)/.test(p.id));
    let best = null, bd = 1e9;
    for (const p of list) {
      const d = Math.hypot(p.x - me().x, p.z - me().z);
      if (d < bd) [best, bd] = [p, d];
    }
    if (!best) return ctx.say(`${who} spins slowly round… and settles. No secrets left to find around here.`, true);
    const ang = Math.atan2(best.x - me().x, -(best.z - me().z));
    const dirs = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
    ctx.say(`${who} points ${dirs[(Math.round(ang / (Math.PI / 4)) + 8) % 8]} — a secret is that way, about ${Math.round(bd)} steps.`, true);
  }

  // ---------------------------------------------------------------- 🏮 carry a light
  let carried = null;
  const lightG = new THREE.Group();
  const pl = new THREE.PointLight(0xffd890, 0, 14, 1.4);
  const halo = glow(0xffd890, 2, 0);
  pl.position.y = 1.4;
  halo.position.set(0.35, 1.1, 0.2);
  lightG.add(pl, halo);
  ctx.scene.add(lightG);
  function carry(k) {
    if (carried === k) {
      carried = null;
      pl.intensity = 0;
      halo.material.opacity = 0;
      return ctx.say(`🏮 You put away the ${LIGHTS[k][1]}.`);
    }
    carried = k;
    pl.color.setHex(LIGHTS[k][0]);
    halo.material.color.setHex(LIGHTS[k][0]);
    pl.intensity = 6;
    halo.material.opacity = 0.85;
    ctx.say(`🏮 You hold up the ${LIGHTS[k][1]} — it lights up everything around you! (use it again to put it away)`, true);
  }

  // ---------------------------------------------------------------- 🌱 the garden by your cottage
  const plants = []; // built meshes
  let gardenBuilt = false;
  function plantMesh(P) {
    const sp = SEEDS[P.kind];
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1, 6), Mat(sp.plant));
    stem.position.y = 0.5;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), Mat(sp.plant));
    leaf.scale.y = 0.4;
    leaf.position.y = 0.4;
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), Mat(sp.bloom, { emissive: sp.bloom, emissiveIntensity: P.kind === "br_sunseed" ? 0.9 : 0.2 }));
    bloom.position.y = 1.2;
    g.add(stem, leaf, bloom);
    g.position.set(P.x, ctx.terrainHeight(P.x, P.z), P.z);
    ctx.outsideGroup.add(g);
    return { P, g, stem, bloom };
  }
  const stage = (P) => Math.min(3, day() - P.day + (P.boost || 0));
  function plant(k) {
    if (here() !== "forest") return ctx.say("🌱 Seeds want proper earth — plant them out in the Great Forest, near your cottage.", true);
    if (usedToday(k)) return ctx.say(`🌱 You've already planted your ${SEEDS[k].name} today. Tomorrow!`, true);
    markUsed(k);
    const P = { kind: k, x: me().x + Math.sin(ctx.mouseRig.rotation.y) * 1.5, z: me().z + Math.cos(ctx.mouseRig.rotation.y) * 1.5, day: day() };
    I().garden.push(P);
    plants.push(plantMesh(P));
    saveCity();
    ctx.chime();
    ctx.say(`🌱 You press ${SEEDS[k].name} into the earth and pat it down. Come back over the next few days and watch it grow!`, true);
  }
  function harvest(pm) {
    const k = pm.P.kind;
    const s = S();
    let msg = `🌾 You harvest ${SEEDS[k].harvest}!`;
    if (k === "eb_seeds") for (const f of ["Berry", "Strawberry", "Carrot"]) ctx.addToPack(f, 3, true);
    if (k === "goldenseeds") s.coins = (s.coins || 0) + 40;
    if (k === "pumpkinseeds") ctx.addToPack("Pumpkin", 3, true);
    if (k === "rainbowseed") (s.owned ||= {}).rainbowbloom = true;
    if (k === "heartwood") {
      ctx.heal && ctx.heal(100);
      ctx.addToPack("Ancient Seed", 3, true);
      return ctx.say("🌳 Your heartwood oak stands tall and green by your cottage. Its leaves whisper, and you feel completely well. (+3 Ancient Seeds · full hearts — come back any day)", true);
    }
    if (k === "br_sunseed") return ctx.say("☀️ Your little sun glows warm and golden. It stays right here by your cottage — forever.", true);
    I().garden = I().garden.filter((x) => x !== pm.P);
    pm.g.parent && pm.g.parent.remove(pm.g);
    plants.splice(plants.indexOf(pm), 1);
    saveCity();
    ctx.chime();
    ctx.say(msg, true);
  }

  // ---------------------------------------------------------------- 🪁 the kite · ❄️ snow globes · 🏮 sky lanterns
  function kite() {
    if (ctx.world() !== "outside" && ctx.world() !== "city") return ctx.say("🪁 You need open sky to fly a kite!");
    const k = new THREE.Group();
    const sail = new THREE.Mesh(new THREE.CircleGeometry(0.8, 4), new THREE.MeshBasicMaterial({ color: 0x5ad86a, side: THREE.DoubleSide }));
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.05), new THREE.MeshBasicMaterial({ color: 0xff5a8a }));
    tail.position.y = -1.2;
    k.add(sail, tail);
    ctx.scene.add(k);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff }));
    ctx.scene.add(line);
    let t = 0;
    effects.push((dt) => {
      t += dt;
      const p = me(), yaw = ctx.mouseRig.rotation.y;
      k.position.set(p.x - Math.sin(yaw) * 8 + Math.sin(t * 1.3) * 2, p.y + 9 + Math.sin(t * 2) * 1.2, p.z - Math.cos(yaw) * 8);
      k.rotation.z = Math.sin(t * 2.2) * 0.4;
      line.geometry.setFromPoints([new THREE.Vector3(p.x, p.y + 1, p.z), k.position.clone()]);
      if (t > 40) {
        ctx.scene.remove(k);
        ctx.scene.remove(line);
        return true;
      }
    });
    ctx.say("🪁 Up goes your leaf kite, dancing on the wind! (it flies for a while, then comes down)", true);
  }
  function snowfall(n = 600, secs = 14) {
    const pos = new Float32Array(n * 3);
    const p0 = me();
    for (let i = 0; i < n; i++) pos.set([p0.x + (Math.random() - 0.5) * 30, p0.y + Math.random() * 14, p0.z + (Math.random() - 0.5) * 30], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, depthWrite: false }));
    pts.frustumCulled = false;
    ctx.scene.add(pts);
    let t = 0;
    effects.push((dt) => {
      t += dt;
      const p = me();
      for (let i = 0; i < n; i++) {
        pos[i * 3 + 1] -= dt * 2.2;
        pos[i * 3] += Math.sin(t + i) * dt * 0.6;
        if (pos[i * 3 + 1] < p.y - 1) pos[i * 3 + 1] += 14;
      }
      geo.attributes.position.needsUpdate = true;
      pts.material.opacity = t > secs - 2 ? Math.max(0, (secs - t) / 2) : 1;
      if (t > secs) {
        ctx.scene.remove(pts);
        return true;
      }
    });
  }
  function skyLantern() {
    const l = glow(0xffb860, 2.4, 0.95);
    const p = me();
    l.position.set(p.x, p.y + 1.5, p.z);
    ctx.scene.add(l);
    let t = 0;
    effects.push((dt) => {
      t += dt;
      l.position.y += dt * 2.2;
      l.position.x += Math.sin(t) * dt;
      l.material.opacity = Math.max(0, 0.95 - t / 30);
      if (t > 30) {
        ctx.scene.remove(l);
        return true;
      }
    });
    ctx.say("🏮 You light the sky lantern and let it go. It drifts up… and up… until it's just one more star.", true);
  }

  // ---------------------------------------------------------------- 🥚 the dragon egg hatches
  function hatch() {
    const s = S();
    if (s.pets && s.pets.some((p) => p.species === "babydragon")) return ctx.say("🐲 Your baby dragon is already with you — and VERY pleased about it.", true);
    s.pets ||= [];
    s.pets.push({ id: "babydragon", species: "babydragon", variant: 0, name: "Sparky the Baby Dragon", companion: "babydragon" });
    s.activePet = "babydragon";
    delete s.owned.dragonegg;
    saveCity();
    if (ctx.petsSync) ctx.petsSync();
    sound([392, 523, 659], 0.8, "triangle", 0.1);
    ctx.say("🥚 You cup the egg in your paws and breathe on it, warm and gentle… it wobbles… CRACK… CRACK… and out tumbles a BABY DRAGON! She sneezes a tiny puff of smoke and climbs straight onto your shoulder. Meet Sparky! (She follows you everywhere — choose your pets in the backpack.)", true);
  }

  // ---------------------------------------------------------------- 🗺️🗝️ the Smugglers' Hold
  const HATCH = { x: 62, z: 8 }; // (in Golden Hollow)
  let hatchBuilt = null;
  function buildHatch(c) {
    if (hatchBuilt && hatchBuilt.c === c) return hatchBuilt;
    // (find a clear patch of ground near the spot on the map)
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4, d = k * 1.2;
      const x = 62 + Math.cos(a) * d, z = 8 + Math.sin(a) * d;
      if (c.colliders.some((cc) => Math.hypot(x - cc.x, z - cc.z) < cc.r + 2) || (c.waterAt && c.waterAt(x, z) !== null)) continue;
      HATCH.x = x;
      HATCH.z = z;
      break;
    }
    const g = new THREE.Group();
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.4), Mat(0x5a3a1a));
    const bands = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.2), Mat(0x3a3a40, { metalness: 0.5 }));
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), Mat(0xb89040, { metalness: 0.6 }));
    lock.position.set(0, 0.15, 0.7);
    const X = new THREE.Group();
    for (const r of [Math.PI / 4, -Math.PI / 4]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 0.25), new THREE.MeshBasicMaterial({ color: 0xc82a1a }));
      bar.rotation.y = r;
      X.add(bar);
    }
    X.position.y = 0.09;
    g.add(lid, bands, lock, X, glow(0xffd890, 2, 0.4));
    g.position.set(HATCH.x, c.height(HATCH.x, HATCH.z) + 0.06, HATCH.z);
    c.group.add(g);
    return (hatchBuilt = { c, g });
  }

  // ---------------------------------------------------------------- what each thing does
  const USES = {
    dragonegg: { label: "warm it in your paws", act: hatch },
    smugglermap: { label: "study the map", act: () => {
      I().mapRead = true;
      saveCity();
      ctx.say("🗺️ You unroll the smuggler's map. Most of it is tunnels and scribbles… but one spot is marked with a big red X: in GOLDEN HOLLOW, east of the square, a hatch hidden in the ground. Under it: “THE HOLD”. (You'll need a key — a very clever one.)", true);
    } },
    skeletonkey: { label: "turn it over in your paws", act: () => ctx.say(I().mapRead ? "🗝️ The Skeleton Key fits locks it has no business fitting. That hatch the smuggler's map marked — in Golden Hollow, east of the square — would be a good place to try it. (It opens the tiny locked door in your cottage, too.)" : "🗝️ The Skeleton Key fits locks it has no business fitting. It opens the tiny locked door in your cottage… and the old smugglers' map might show you something bigger to open.", true) },
    br_lighthousekey: { label: "look at it", act: () => ctx.say("🗝️ The Old Lighthouse Key — it opens the old red-and-white lighthouse on the west side of Reedmere. Walk up to its door.", true) },
    eb_compass: { label: "open the compass", act: () => pointToSecret("🧭 The brass needle trembles, then") },
    br_icecompass: { label: "open the Ice-Compass", act: () => pointToSecret("🧭 The frosty needle") },
    detectivebadge: { label: "look through the magnifying glass", act: () => pointToSecret("🔍 Through the glass you spot tiny clues — scratches, footprints — and they all lead one way. Your nose") },
    sunrisecompass: { label: "open the Sunrise Compass", act: () => ctx.say("🧭 The Sunrise Compass's needle points out to sea, toward the sunrise — the lost lands lie that way, across the Open Sea from Reedmere's harbour.", true) },
    eb_map: { label: "unfold the map", act: () => (window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyM", key: "m" })), ctx.say("🗺️ You unfold your Map of the Five Cities.")) },
    br_harvestbell: { label: "ring the Harvest Bell", act: () => {
      if (usedToday("br_harvestbell")) return ctx.say("🔔 The Harvest Bell has rung once today already. Its magic needs a night's rest.", true);
      markUsed("br_harvestbell");
      sound([523, 523, 659], 1.2, "triangle", 0.12);
      I().garden.forEach((P) => (P.boost = (P.boost || 0) + 1));
      saveCity();
      ctx.say(I().garden.length ? "🔔 DONG… DONG… The bell rings out over the fields — and everything you've planted shoots up a whole day's worth!" : "🔔 DONG… DONG… The bell rings out over the fields. (Plant some seeds, and the bell will make them grow faster!)", true);
    } },
    caravanbell: { label: "ring the bell", act: () => (sound([659, 784], 1, "triangle"), ctx.say("🔔 Jingle-jingle! Far off, you hear an answering bell — the caravans know you're a friend.", true)) },
    llamabells: { label: "shake the bells", act: () => (sound([880, 988, 880], 0.6, "triangle"), ctx.say("🔔 Jingle-jangle — somewhere a llama looks up, pleased.")) },
    eb_kite: { label: "fly the kite", act: kite },
    snowglobe: { label: "shake it", act: () => (snowfall(), ctx.say("🔮 You shake the snow globe… and real snow starts to fall all around you!", true)) },
    br_stormglass: { label: "look into the Storm-Glass", act: () => {
      const w = ctx.weather ? ctx.weather() : null;
      const next = w && w.next;
      ctx.say(next === "rain" ? "🔮 The Storm-Glass clouds over, dark and swirly — RAIN is on its way. Better find shelter!" : next === "cloudy" ? "🔮 Wispy clouds drift inside the Storm-Glass — it'll turn cloudy soon." : "🔮 The Storm-Glass is clear as a summer sky — fine weather ahead!", true);
    } },
    wishpearl: { label: "make a wish", act: () => {
      if (usedToday("wishpearl")) return ctx.say("🫧 The Wishing Pearl is resting — one wish a day.", true);
      markUsed("wishpearl");
      const s = S();
      const r = Math.random();
      let m;
      if (r < 0.5) {
        const c = 30 + Math.floor(Math.random() * 60);
        s.coins = (s.coins || 0) + c;
        m = `🫧 You hold the pearl to your heart and wish… and coins jingle in your pocket! (🪙 ${c})`;
      } else if (r < 0.8) {
        ctx.addToPack("Crystal Fragment", 2, true);
        m = "🫧 You make a wish… and two glittering crystals tumble into your paw!";
      } else {
        ctx.heal && ctx.heal(100);
        m = "🫧 You wish to feel wonderful — and you DO. All your hearts are full!";
      }
      saveCity();
      ctx.say(m, true);
    } },
    skylantern: { label: "let it go", act: skyLantern },
    seasonkey: { label: "wind the Season Clock", act: () => {
      const s = S();
      s.seasonShift = ((s.seasonShift || 0) + 1) % 4;
      saveCity();
      sound([262, 330, 392, 523], 0.7, "triangle");
      ctx.say("🗝️ You wind the Season Clock's key — tick… tock… — and the world turns to the next SEASON! (Wind it again to keep turning.)", true);
    } },
    whaleshell: { label: "hold it to your ear", act: () => (sound([110, 98, 131, 87], 2.2, "sine", 0.12), ctx.say("🐋 You hold the shell to your ear — and the whale's song rolls out, long and low and beautiful.", true)) },
    singingcrystal: { label: "let it sing", act: () => (sound([392, 494, 587, 784], 2, "sine"), ctx.say("💎 The crystal hums like distant thunder — and you feel braver all at once.", true)) },
    reedflute: { label: "play it (or press U)", act: () => ctx.say("🪈 Press U to play your reed flute — keys 1 to 4 play the notes.", true) },
  };
  // ---------------------------------------------------------------- …and many more
  const once = (k, fn) => () => {
    if (usedToday(k)) return ctx.say("✨ It needs a night's rest before it works again — tomorrow!", true);
    markUsed(k);
    fn();
    saveCity();
  };
  const ringer = (freqs, msg) => () => (sound(freqs, 1.2, "triangle", 0.12), ctx.say(msg, true));
  const wish = (who) => once(who, () => {
    const c = 40 + Math.floor(Math.random() * 60);
    S().coins = (S().coins || 0) + c;
    ctx.say(`✨ You close your eyes and make a wish… and when you open them, there are 🪙 ${c} coins in your paw!`, true);
  });
  const glide = (secs, msg) => () => {
    window.__wwGlideUntil = Date.now() + secs * 1000;
    ctx.say(msg, true);
  };
  Object.assign(USES, {
    oldschoolbell: { label: "ring it", act: ringer([784, 784, 659], "🔔 Ding-a-ling! The First School Bell rings out — somewhere, every mouse who ever went to school sits up a little straighter.") },
    iciclechime: { label: "ring it", act: ringer([1568, 784, 1175], "🎐 The Icicle Chime sings high, low, middle — the ice song.") },
    fairybell: { label: "ring it", act: () => {
      sound([1318, 1568, 1760, 2093], 0.7, "triangle", 0.08);
      for (let i = 0; i < 24; i++) {
        const sp = glow([0xffb0f0, 0xb0e0ff, 0xfff0a0][i % 3], 0.6, 0.9);
        ctx.scene.add(sp);
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 2;
        let t = 0;
        effects.push((dt) => {
          t += dt;
          const p = me();
          sp.position.set(p.x + Math.cos(a + t) * r, p.y + 1 + t * 0.8, p.z + Math.sin(a + t) * r);
          sp.material.opacity = Math.max(0, 0.9 - t / 3);
          if (t > 3) {
            ctx.scene.remove(sp);
            return true;
          }
        });
      }
      ctx.say("🔔 The tiny silver bell tinkles — and a swirl of fairy-lights dances up all around you!", true);
    } },
    goatbell: { label: "ring it", act: ringer([440, 392], "🔔 Clonk-clonk! Far away on a mountain, a goat bleats back.") },
    nomaddrum: { label: "play it", act: ringer([98, 98, 131, 98, 147], "🥁 Boom — boom-boom — BOOM. The nomads' rhythm. Your heart beats along.") },
    traderbell: { label: "ring for the Secret Trader", act: () => {
      sound([523, 392, 262], 1.4, "sine", 0.1);
      if (window.__wwTraderSecret) {
        ctx.say("🐀 You ring the little brass bell… and from the nearest shadow, two gold-ringed eyes open. The Secret Trader has come to you.", true);
        setTimeout(() => window.__wwTraderSecret(), 1800);
      }
    } },
    treasurecompass: { label: "open the compass", act: () => pointToSecret("🧭 The Treasure-Hunter's Compass whirls, then") },
    oldmap: { label: "unroll the map", act: () => pointToSecret("🗺️ The ink on the Map of Places Not on Any Map shifts and swirls… a new path draws itself, and", true) },
    owlspecs: { label: "put them on", act: () => pointToSecret("👓 Through the owl spectacles, the dark looks bright as day — and you spot faint tracks. They") },
    handmirror: { label: "ask the mirror", act: () => {
      const h = window.__wwSecretHint && window.__wwSecretHint();
      ctx.say(h ? `🪞 The Truth-Telling Mirror ripples, and a voice like silver says: ${h}` : "🪞 The mirror shows only you — smiling. (You've found every secret it knows!)", true);
    } },
    secretbook: { label: "read a page", act: () => {
      const h = window.__wwSecretHint && window.__wwSecretHint();
      ctx.say(h ? `📕 You open the Book of Secrets to a page you've never seen before. It says: ${h}` : "📕 Every page of the Book of Secrets is ticked off. You've found them ALL!", true);
    } },
    wishcoin: { label: "make a wish", act: wish("wishcoin") },
    starstone: { label: "wish on it", act: wish("starstone") },
    cloudpillow: { label: "take a nap", act: once("cloudpillow", () => {
      ctx.setTimeOfDay && ctx.setTimeOfDay(0.28);
      ctx.heal && ctx.heal(100);
      ctx.say("☁️ You lay your head on the cloud pillow… and wake up in the fresh morning, every heart full.", true);
    }) },
    pocketwatch: { label: "wind the watch", act: () => {
      const d = ctx.dayTime ? ctx.dayTime() : 0.5;
      const hrs = Math.floor(d * 24), mins = Math.floor((d * 24 * 60) % 60);
      ctx.setTimeOfDay && ctx.setTimeOfDay((d + 3 / 24) % 1);
      sound([1760, 1760], 0.15, "square", 0.04);
      ctx.say(`⌚ The Clockmaker's Pocket Watch says ${hrs}:${String(mins).padStart(2, "0")}. You wind it three turns… and the whole world skips three hours ahead!`, true);
    } },
    geode: { label: "crack it open", act: () => {
      if (I().geode) return ctx.say("🪨 Your geode is already cracked — a little cave of violet crystal, glittering in your paw.", true);
      I().geode = true;
      ctx.addToPack("Amethyst", 2, true);
      ctx.addToPack("Crystal Fragment", 2, true);
      saveCity();
      sound([1200, 900], 0.3, "square", 0.05);
      ctx.say("🪨 CRACK! Inside the plain grey stone: a tiny cave of violet crystals! (+2 Amethyst · +2 Crystal Fragments)", true);
    } },
    puzzlecube: { label: "solve it", act: () => {
      if (I().puzzle) return ctx.say("🧩 Click-click-click — you can solve it with your eyes closed now.", true);
      I().puzzle = true;
      S().coins = (S().coins || 0) + 80;
      saveCity();
      ctx.say("🧩 Twist… slide… turn… CLICK! The Ancient Puzzle Box springs open: old gold coins inside! (🪙 80)", true);
    } },
    grannylocket: { label: "open the locket", act: () => ctx.say("📿 Inside the locket: a tiny painting of an old mouse in an apron, standing in YOUR cottage doorway, laughing. On the back, in faded ink: “For whoever lives here next — be happy in it.”", true) },
    owlquill: { label: "write with it", act: () => ctx.say("🪶 You dip the Night Owl's Quill and write in your journal. The ink glows faintly in the dark — your adventures, written in moonlight.", true) },
    eaglefeather: { label: "hold it up to the wind", act: glide(30, "🪶 You hold up the Golden Eagle Feather — and the wind lifts you! For a little while, tap Space in the air to flap again, and hold it to GLIDE.") },
    thunderfeather: { label: "hold it up", act: glide(20, "🪶 The Thunderbird Feather crackles — your paws go light as air! For a little while: tap Space in the air to jump again, hold it to glide.") },
    paintbrush: { label: "paint yourself", act: once("paintbrush", () => {
      const hues = [0xe86a8a, 0x6ab8e8, 0x8ae86a, 0xb88aff, 0xffd060, 0x5ad8c8, 0xf0f0ff];
      setLook("fur", hues[Math.floor(Math.random() * hues.length)]);
      ctx.say("🖌️ You swish the Painter's Magic Brush over your fur — and it changes colour like a painting! (Dye it back at the Fur Dye Salon any time.)", true);
    }) },
    fishersnet: { label: "cast the net", act: once("fishersnet", () => {
      ctx.addToPack("Fish", 3, true);
      ctx.say("🥅 You cast the Fisher's Little Net… and haul in three fish! (once a day)", true);
    }) },
    bakersrollingpin: { label: "bake with it", act: once("bakersrollingpin", () => {
      const m = bagFood({ icon: "🥖", name: "Fresh Bread", heal: 30 });
      ctx.say(`🥖 You roll out some dough with Poppyseed's Lucky Rolling Pin — and bake a warm, golden loaf!${m}`, true);
    }) },
    singingpearl: { label: "let it sing", act: () => (sound([523, 659, 784, 1047], 1.6, "sine"), ctx.say("🫧 The Singing Pearl hums a song from under the sea — the same song the shell sang.", true)) },
    conch: { label: "blow the conch", act: () => (sound([196, 220, 196], 1.8, "sawtooth", 0.05), ctx.say("🐚 You blow the conch — a deep, booming call rolls out over everything.", true)) },
  });
  for (const k of Object.keys(LIGHTS)) USES[k] = { label: "hold it up", act: () => carry(k) };
  for (const k of Object.keys(SEEDS)) USES[k] = { label: "plant it", act: () => plant(k) };

  // ---------------------------------------------------------------- each frame
  function update(dt) {
    for (let i = effects.length - 1; i >= 0; i--) if (effects[i](dt)) effects.splice(i, 1);
    // the light you're carrying goes with you
    if (carried) {
      lightG.position.copy(me());
      lightG.rotation.y = ctx.mouseRig.rotation.y;
      halo.material.opacity = 0.75 + Math.sin(performance.now() / 160) * 0.1;
      if (!owned(carried)) carry(carried);
    }
    // the garden by your cottage
    if (ctx.world() === "outside" && !gardenBuilt && ctx.outsideGroup) {
      gardenBuilt = true;
      for (const P of I().garden) plants.push(plantMesh(P));
    }
    for (const pm of plants) {
      const k = stage(pm.P);
      pm.g.scale.setScalar(0.35 + k * 0.35);
      pm.bloom.visible = k >= 3;
    }
    // the smugglers' hatch, once the map has shown you where
    if (ctx.world() === "city" && ctx.city() && ctx.city().id === "golden" && I().mapRead) buildHatch(ctx.city());
  }
  function interactable() {
    const w = here();
    if (w === "forest") for (const pm of plants) if (stage(pm.P) >= 3 && near(pm.P.x, pm.P.z, 2)) return { label: `harvest your ${SEEDS[pm.P.kind].name.replace(/^an? /, "")} 🌾`, act: () => harvest(pm) };
    if (w === "golden" && I().mapRead && hatchBuilt && near(HATCH.x, HATCH.z, 3)) {
      if (!owned("skeletonkey")) return { label: "try the locked hatch 🔒", act: () => ctx.say("🔒 A heavy hatch with a big iron lock — the one on the smuggler's map! You'll need a key that fits ANY lock… (the Underground Market might sell one).", true) };
      return { label: "unlock the hatch with the Skeleton Key 🗝️", act: () => {
        if (ctx.flyInto) ctx.flyInto("smugglers");
        ctx.say("🏴‍☠️ CLICK — the Skeleton Key turns, the hatch swings up, and you climb down a ladder into the SMUGGLERS' HOLD: gold, crates, and an old sea-chest.", true);
      } };
    }
    if (w === "smugglers" && !I().hold && near(0, -4.2, 2.4)) return { label: "open the smugglers' sea-chest 🏴‍☠️", act: () => {
      I().hold = true;
      const s = S();
      s.coins = (s.coins || 0) + 300;
      (s.owned ||= {}).doubloon = true;
      saveCity();
      ctx.chime();
      ctx.say("🏴‍☠️ The chest creaks open: a fortune in old gold! (🪙 300 · 🪙 A Smuggler's Gold Doubloon)", true);
    } };
    return null;
  }
  /** for the backpack: the things you own that you can USE */
  function usableHTML() {
    const s = S();
    const list = Object.keys(USES).filter((k) => (s.owned || {})[k]);
    if (!list.length) return "";
    const nameOf = (k) => (window.__wwKeepName && window.__wwKeepName(k)) || k;
    return `<h3>✨ Things you can use</h3><div class="wear">${list.map((k) => `<button class="wcell ${carried === k ? "on" : ""}" data-useitem="${k}"><span class="nm">${nameOf(k)}</span><small>✨ ${USES[k].label}${carried === k ? " (carrying)" : ""}</small></button>`).join("")}</div>`;
  }
  function use(k) {
    if (USES[k] && owned(k)) USES[k].act();
  }
  window.__wwHatch = () => ({ ...HATCH, built: !!hatchBuilt }); // (for tests)
  return { update, interactable, usableHTML, use };
}
