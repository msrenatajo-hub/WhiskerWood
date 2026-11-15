// ------------------------------------------------------------
//  ⚔️  QUESTS — daring adventures across the five cities (and beyond).
//  Q opens the Quest Log. Givers wear a golden ❗ until you've helped.
//
//  🏔️ The Signal Fires of the Northern Pact   (Frostpine → the Pact Peaks)
//  🌊 The Drowned Library                      (Reedmere → the Drowned Deep)
//  🎶 The Song of the First Feast             (Golden Hollow)
//  🌾 Night of the Bowing Scarecrows          (Golden Hollow)
//  🏮 The Lighthouse Winked                   (Reedmere)
//  🦉 The Canopy Crossing                     (Everbough)
//  ❄️ The Ice That Remembers                  (Frostpine)
//  ✨ The Star Chart                          (Silverveil)
//  🗺️ Pip's Last Map                          (the Great Forest)
//
//  (Lore from the Grand Library + the lore stones: the Northern Pact, the
//  Aurora Weavers, the Drowned Library, the Windmill That Sings, the Golden
//  Acorn, the Harvest Moon, the Lighthouse of Reeds, the owl-watched
//  Canopy, the Ice That Remembers, Pip Thornwhisker's journals.)
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard, warmthBonus, registerKeepsake } from "./cityLife.js";
import { power } from "./powers.js";
import { PEAK_FIRES, DEEP } from "./questZones.js";
import { genBatch, hashStr } from "./restock.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const B = (c, e = {}) => new THREE.MeshBasicMaterial({ color: c, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (c) => "#" + c.toString(16).padStart(6, "0");

// ======================================================================
//  the quests
// ======================================================================
const QUESTS = [
  {
    id: "peaks", icon: "🏔️", name: "The Signal Fires of the Northern Pact", city: "frostpine", stars: 5,
    giver: { name: "Warden Ivo", at: { x: -36, z: -80 }, tunic: 0x8a3a2a },
    story: "Long ago, Renata Josephine Rudy spent a whole winter teaching the first Wardens to light signal fires on the peaks — so no traveler would ever lose the pass and freeze. The fires have been dark for a hundred years. The trail is broken. The wind is cruel. Will you climb?",
    steps: ["Begin the climb at the trailhead (E at the gate)", "Light the First Signal Fire (cross the drifting ice floes)", "Light the Second Signal Fire (the ice bridge crumbles — keep moving!)", "Light the Third Signal Fire (the wind-swept col — brace for gusts!)", "Climb the boulder chute and light Renata's Pact Fire on the summit"],
    reward: { coins: 80, key: "wardenlantern", icon: "🏮", name: "Warden's Ember Lantern" },
  },
  {
    id: "deep", icon: "🌊", name: "The Drowned Library", city: "reedmere", stars: 5,
    giver: { name: "Diver Marrow", at: { x: 40, z: -40 }, tunic: 0x2a6a8a },
    story: "Beneath the flooded ruins lies a library older than the Alliance. On still nights you can hear its pages turning. Its vault only opens for the five pages it lost. Take my diving bell — but watch your air, keep clear of the jellies… and whatever you do, stay away from the trench.",
    steps: ["Swim out to the flooded ruins and dive (E)", "Follow the Silver Eel through the kelp", "Find the five lost pages", "Return the pages to the vault of the Drowned Library"],
    reward: { coins: 80, key: "tidejournal", icon: "📘", name: "Tidebound Moonkeeper Journal" },
  },
  {
    id: "song", icon: "🎶", name: "The Song of the First Feast", city: "golden", stars: 3,
    giver: { name: "Miller Gristle", at: { x: -34, z: -4 }, tunic: 0xc8a86a },
    story: "On windy evenings the old windmill hums a tune nobody remembers learning — the song of the first Feast. Old tales say if you ring the bell-flowers in the field to its tune, the earth gives up the Golden Acorn buried behind the first windmill.",
    steps: ["Listen to the windmill's song (E at the windmill)", "Ring the four bell-flowers in the song's order", "Dig up the Golden Acorn behind the windmill"],
    reward: { coins: 40, key: "goldenacorn", icon: "🌰", name: "The Golden Acorn" },
  },
  {
    id: "scarecrows", icon: "🌾", name: "Night of the Bowing Scarecrows", city: "golden", stars: 4,
    giver: { name: "Old Thresh", at: { x: 22, z: 22 }, tunic: 0x8a6a3a },
    story: "When the Harvest Moon rises, every scarecrow in the Hollow bows — each one toward the next. Follow them all before the moon slips behind the hills, and they'll lead you to a circle in the wheat where the stars left something behind.",
    steps: ["Find the first glowing scarecrow", "Follow the bows from scarecrow to scarecrow — before the moon sets!", "Search the crop circle"],
    reward: { coins: 50, key: "moonpressedcoin", icon: "🌕", name: "Moon-Pressed Coin" },
  },
  {
    id: "lighthouse", icon: "🏮", name: "The Lighthouse Winked", city: "reedmere", stars: 4,
    giver: { name: "Old Wick", at: { x: -10, z: 56 }, tunic: 0x6a5a4a },
    story: "A sailor swore the Lighthouse of Reeds winked at him. Hah! It did — it's a message. Watch the light: it blinks the colors of the buoys. Swim through them in its order, quick as you can, and the will-o'-wisps will show you what Renata left in the lagoon.",
    steps: ["Watch the lighthouse blink (E by Old Wick)", "Swim through the glowing buoys in the light's order!", "Follow the will-o'-wisps to the sunken shrine"],
    reward: { coins: 40, key: "lighthousesail", icon: "⛵", name: "Sail of the Lighthouse" },
  },
  {
    id: "canopy", icon: "🦉", name: "The Canopy Crossing", city: "everbough", stars: 4,
    giver: { name: "Owl-Warden Fern", at: { x: 68, z: 54 }, tunic: 0x5a7a4a }, // (outside the owl garden)
    story: "The Highcanopy is watched by the great barn owl. Her fallen feathers lie in the garden round the foot of her tree — but anyone caught in her searching gaze gets swept right out! Sneak in, gather four feathers, and she'll let you climb to the top.",
    steps: ["Sneak round the owl's garden and gather 4 feathers — stay out of her light!", "Climb the great trunk to the Highcanopy deck"],
    reward: { coins: 40, key: "owlcloak", icon: "🪶", name: "Owl-Feather Cloak" },
  },
  {
    id: "whispers", icon: "❄️", name: "The Ice That Remembers", city: "frostpine", stars: 3,
    giver: { name: "Keeper Hollis", at: { x: -24, z: 34 }, tunic: 0x6a8ab8 },
    story: "The Hall of Everfrost was carved from a glacier that holds a thousand frozen whispers. Some have broken free and are drifting through town — and they're SHY. Catch seven and bring them home before they melt into nothing.",
    steps: ["Catch 7 frozen whispers (they flee — corner them!)", "Bring the whispers back to Keeper Hollis"],
    reward: { coins: 40, key: "whispercharm", icon: "❄️", name: "Frozen-Whisper Charm" },
  },
  {
    id: "stars", icon: "✨", name: "The Star Chart", city: "silverveil", stars: 4,
    giver: { name: "Stargazer Lumen", at: { x: 8, z: -40 }, tunic: 0x3a3a7a },
    story: "Here the first Moonkeepers watched the stars and learned the roads between them. The star-stones round the moon-pool remember one constellation — the Lantern-Bearer. Read the chart, then walk her stars in order before they fade.",
    steps: ["Read the star chart at the observatory (E by Lumen)", "Walk the star-stones in the constellation's order"],
    reward: { coins: 50, key: "moonmothlantern", icon: "🦋", name: "Moon Moth Lantern" },
  },
  {
    id: "pip", icon: "🗺️", name: "Pip's Last Map", city: "forest", stars: 2,
    giver: { name: "a torn map, pinned to the reading rock", at: null, tunic: 0 },
    story: "Pip Thornwhisker vanished long ago, mid-sentence. But here's a map in Pip's hand — four campsites, each with a note pointing to the next. Where was Pip going?",
    steps: ["Find Pip's four old campsites (each note points to the next)", "Open Pip's satchel at the last camp"],
    reward: { coins: 40, key: "pipsatchel", icon: "🎒", name: "Pip's Satchel" },
  },
];
// 📖 The Quest Book has VOLUMES: finish every quest and it refreshes — every
// quest comes back, a little harder, with bigger rewards and new treasures.
const VOLUME_WORDS = ["", "", "Gilded", "Moonlit", "Starforged", "Ancient", "Legendary", "Mythic", "Celestial", "Eternal"];
const volumeWord = (v) => VOLUME_WORDS[v] || `Volume ${v}`;
/** the reward for a quest in volume v (volume 1 = the original) */
function rewardFor(q, v) {
  if (v <= 1) return q.reward;
  return { coins: q.reward.coins + 25 * (v - 1), key: `${q.reward.key}_v${v}`, icon: q.reward.icon, name: `${volumeWord(v)} ${q.reward.name}` };
}
// ✨ what every reward DOES
export const POWERS = {
  wardenlantern: "keeps you warm — the cold creeps in much slower",
  tidejournal: "swim faster, and your air lasts twice as long underwater",
  goldenacorn: "farm crops grow twice as fast",
  moonpressedcoin: "everything you sell is worth 25% more",
  lighthousesail: "your raft sails faster",
  owlcloak: "hold Space while falling to GLIDE",
  whispercharm: "creatures for your Collection Book appear twice as often",
  moonmothlantern: "a moon moth flutters by you; light lasts twice as long in the dark",
  pipsatchel: "your backpack holds 20 more of everything",
};
const GEN_POWER = "+5% on everything you sell (stacks up to +50%)";
const registerVolume = (v) => {
  for (const q of QUESTS) {
    const r = rewardFor(q, v);
    registerKeepsake(r.key, r.icon, v <= 1 ? `${r.name} (${POWERS[q.reward.key]})` : r.name);
  }
};
registerVolume(1);

// ======================================================================
//  📖 VOLUMES 2, 3, 4… — BRAND-NEW quests, made fresh for each volume,
//  harder every time. Six kinds of challenge, dressed in each city's lore.
// ======================================================================
const KINDS = ["collect", "sequence", "chase", "catch", "delivery", "stealth"];
// city → kind → [name, icon, what you're after, color, the giver's plea]
const GEN = {
  everbough: { giverAt: [{ x: 32, z: -30 }, { x: -34, z: -32 }], givers: [["Archivist Thimble", 0x6a4a8a], ["Courier Larkspur", 0x3a7a8a], ["Professor Burdock", 0x6a5a3a], ["Lamplighter Ember", 0xc87a3a]], kinds: {
    collect: ["Pages on the Wind", "📜", "pages", 0xfff0c0, "A gust tore the Grand Library's oldest book apart — its pages are blowing all over the city! Catch every one before they blow away for good."],
    sequence: ["The Library Bells", "🔔", "bells", 0xffd86a, "The Library's bells must be rung in the ancient order, or the doors stay shut. I'll show you the order once — only once!"],
    chase: ["Follow the Messenger Wren", "🐦", "the wren", 0xd8a86a, "The Messenger Wren knows the secret way to the Archive — but she won't wait for slowpokes. Keep up!"],
    catch: ["Escaped Bookworms!", "🐛", "bookworms", 0x8ad86a, "The bookworms escaped their jar and they're munching through the whole city! Catch them — they're quicker than they look."],
    delivery: ["The Overdue Books Relay", "📚", "books", 0xd86a6a, "These books are WILDLY overdue. Run them to every reading-nook in the city before the bell!"],
    stealth: ["Past the Night Owls", "🦉", "acorns", 0xd8a85a, "The night owls guard the Golden Acorn tree. Gather the acorns without being seen — they have VERY good eyes."],
  } },
  reedmere: { giverAt: [{ x: 20, z: 62 }, { x: -48, z: 30 }], givers: [["Ferrymouse Tide", 0x2a6a8a], ["Lily-Keeper Marsh", 0x5a8a6a], ["Captain Skiff", 0x3a4a6a], ["Netmaker Rush", 0x8a7a4a]], kinds: {
    collect: ["Lost Lily-Lanterns", "🏮", "lily-lanterns", 0xffb86a, "The storm scattered the floating lily-lanterns all over the lagoon! Gather them before the tide carries them out to sea."],
    sequence: ["The Tide-Bells", "🔔", "tide-bells", 0x6ad8ff, "Ring the tide-bells in the old sailors' order and the tide turns kind. Get it wrong and it starts all over!"],
    chase: ["Follow the Silver Heron", "🪶", "the heron", 0xe8f0ff, "The Silver Heron always flies to where the fish are best. Follow her — but she flies FAST."],
    catch: ["Runaway Marsh Fireflies", "✨", "fireflies", 0xd8ff6a, "Every firefly in the marsh got loose at once! Catch them — they zip and dodge like crazy."],
    delivery: ["Dabble's Urgent Letters", "✉️", "letters", 0xf4ecd8, "Urgent letters! Every one has to reach its raft-house before the post-boat leaves. RUN!"],
    stealth: ["The Sleeping Pike", "🐟", "pearls", 0xf4f4ff, "Pearls lie all round the old pike's sleeping spot. Collect them — but if its lantern-eyes find you, it'll chase you off!"],
  } },
  golden: { giverAt: [{ x: 18, z: -14 }, { x: -20, z: 22 }], givers: [["Farmer Hollyhock", 0x8a6a3a], ["Miller Dusty", 0xc8b88a], ["Goose-Herd Pansy", 0xd87a8a], ["Harvester Rye", 0xa8883a]], kinds: {
    collect: ["The Great Seed Scatter", "🌻", "seed-bags", 0xffd23a, "The wind burst every seed-bag over the fields! Gather them all before the crows do."],
    sequence: ["The Scarecrow Dance", "💃", "scarecrows", 0xc8a040, "The scarecrows only dance in the right order. Step to each one exactly as the song goes!"],
    chase: ["Chase the Golden Hare", "🐇", "the hare", 0xe8c860, "The Golden Hare knows where the Harvest treasure is buried. Keep up with her — she's the fastest thing in the Hollow."],
    catch: ["Escaped Chicks!", "🐥", "chicks", 0xffe86a, "The chicks escaped the coop and they are EVERYWHERE. Catch every one before supper!"],
    delivery: ["The Harvest Cart Relay", "🧺", "baskets", 0xd8883a, "Every farm needs its basket before the Harvest Feast — and the Feast starts SOON!"],
    stealth: ["Past the Grumpy Goose", "🦆", "golden eggs", 0xffe08a, "The grumpy geese guard their golden eggs. Sneak in and gather them — if they spot you, you're OUT!"],
  } },
  frostpine: { giverAt: [{ x: 26, z: 34 }, { x: -30, z: -14 }], givers: [["Warden Brisk", 0x8a3a3a], ["Snow-Carver Flake", 0xb8c8e8], ["Cocoa-Keeper Mallow", 0x8a5a3a], ["Sled-Master Rime", 0x3a5a8a]], kinds: {
    collect: ["Aurora Ribbons", "🌌", "aurora ribbons", 0x8affc8, "Ribbons of the aurora fell to earth last night! Gather them before they melt back into the sky."],
    sequence: ["The Ice Chimes", "🎐", "ice chimes", 0xbfe6ff, "The ice chimes play the Wardens' old song — in exactly the right order. Strike them as I show you!"],
    chase: ["Follow the Snow Fox", "🦊", "the snow fox", 0xf4f4f8, "The snow fox knows the way through the drifts. Stay with her — lose her in the snow and she's gone!"],
    catch: ["Runaway Snow Sprites", "❄️", "snow sprites", 0xe8f4ff, "The snow sprites are loose and they're playing tag — with YOU. Catch every one!"],
    delivery: ["The Hot Cocoa Express", "☕", "mugs of cocoa", 0x8a5a3a, "Hot cocoa for every Warden on duty — and it has to arrive HOT. Go go go!"],
    stealth: ["The Frost Owls' Watch", "🦉", "frost crystals", 0xbfe6ff, "Frost owls guard the crystal garden. Gather the crystals without being seen!"],
  } },
};
const GEN_CITY_ORDER = ["everbough", "reedmere", "golden", "frostpine"];
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _books = {};
/** the quests in volume v (≥ 2) — 2 brand-new ones in each of four cities */
function genBook(v) {
  if (_books[v]) return _books[v];
  const d = v - 1; // how much harder
  const R = rng(hashStr("quest-volume-" + v));
  const out = [];
  for (const city of GEN_CITY_ORDER) {
    const G = GEN[city];
    const g0 = Math.floor(R() * G.givers.length); // (two different givers per city)
    // two different kinds of challenge here this volume
    const kinds = KINDS.slice().sort(() => R() - 0.5).slice(0, 2);
    kinds.forEach((kind, slot) => {
      const [name, icon, thing, color, plea] = G.kinds[kind];
      const [gName, gTunic] = G.givers[(g0 + slot) % G.givers.length];
      const id = `v${v}_${city}_${kind}`;
      const P = {
        collect: { n: Math.min(16, 8 + 2 * d), time: Math.max(50, 105 - 10 * d) },
        sequence: { len: Math.min(9, 4 + d), time: Math.max(40, 80 - 6 * d) },
        chase: { dur: Math.min(80, 40 + 8 * d), speed: Math.min(15, 10.5 + 1.2 * d) },
        catch: { n: Math.min(13, 5 + 2 * d), flee: Math.min(15, 11 + d), time: Math.max(60, 120 - 10 * d) },
        delivery: { k: Math.min(7, 3 + d), pace: Math.min(14, 10 + d) },
        stealth: { n: Math.min(8, 4 + d), gazes: Math.min(4, 1 + d), speed: 0.5 + 0.08 * d },
      }[kind];
      const rules = {
        collect: `Grab all ${P.n} ${thing} in ${P.time} seconds. Look for their faint pillars of light — no golden beam to help you!`,
        sequence: `Step on the ${P.len} markers in the order I show you, within ${P.time} seconds. A wrong step resets the order!`,
        chase: `Stay close to ${thing} for ${P.dur} seconds. Fall too far behind and you lose her!`,
        catch: `Catch all ${P.n} ${thing} in ${P.time} seconds — just touch them. They RUN.`,
        delivery: `Reach all ${P.k} drop-off points in order before time runs out. The beam shows the next one.`,
        stealth: `Gather all ${P.n} ${thing}. ${P.gazes} searching ${P.gazes > 1 ? "gazes sweep" : "gaze sweeps"} the ground — get caught and you're sent back to the edge!`,
      }[kind];
      const reward = genBatch(city, id, v)[0];
      out.push({
        id, icon, name: `${name}${v > 2 ? ` ${["", "", "", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][v] || v}` : ""}`, city, kind, P, color, thing,
        stars: Math.min(5, 3 + d), gen: true,
        giver: { name: gName, at: G.giverAt[slot], tunic: gTunic },
        story: plea,
        steps: [`Talk to ${gName} to start the challenge`, rules],
        reward: { coins: 50 + 30 * d, key: reward.key, icon: reward.icon, name: reward.name },
      });
    });
  }
  return (_books[v] = out);
}

// ======================================================================
export function initQuests(ctx) {
  const S = cityState();
  S.quests ||= {};
  S.questVolume ||= 1;
  for (let v = 2; v <= S.questVolume; v++) registerVolume(v);
  const vol = () => S.questVolume;
  const reward = (q) => rewardFor(q, vol());
  const powerOf = (q) => (q.gen ? GEN_POWER : POWERS[q.reward.key] || "");
  // (timed parts get shorter each volume — down to 60% of the first time)
  const timeScale = () => Math.max(0.6, 1 - 0.1 * (vol() - 1));
  const save = () => saveCity();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const Q = (id) => (S.quests[id] ||= { st: "new", step: 0, data: {} });
  const CITY_NAME = { frostpine: "❄️ Frostpine", reedmere: "🌊 Reedmere", golden: "🌾 Golden Hollow", everbough: "🌳 Everbough", silverveil: "🌙 Silverveil", forest: "🌲 the Great Forest" };
  /** the quests in the book right now (volume 1: the nine originals) */
  const BOOK = () => (vol() <= 1 ? QUESTS : genBook(vol()));
  const def = (id) => QUESTS.find((q) => q.id === id) || BOOK().find((q) => q.id === id);
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  const groupHere = () => (ctx.world() === "city" && ctx.city() ? ctx.city().group : ctx.world() === "everbough" ? ctx.cityGroup : ctx.world() === "outside" ? ctx.outsideGroup : null);
  const heightHere = () => (ctx.world() === "city" && ctx.city() ? ctx.city().height : ctx.world() === "everbough" ? ctx.cityHeight : ctx.terrainHeight);
  // (test) &quest=peaks → that quest is accepted; &qstep=N
  {
    const q = new URLSearchParams(location.search);
    if (q.get("quest")) {
      const s = Q(q.get("quest"));
      s.st = "active";
      s.step = +(q.get("qstep") || 0);
    }
  }
  // (test) &qalmost=1 → every quest done but the Song; &qfinish=song → finish it
  {
    const q = new URLSearchParams(location.search);
    if (q.get("qvol")) S.questVolume = +q.get("qvol");
    if (q.get("qalmost")) for (const x of BOOK()) if (x.id !== (q.get("qfinish") || "song")) S.quests[x.id] = { st: "done", step: 9, data: {} };
    if (q.get("qfinish")) setTimeout(() => {
      Q(q.get("qfinish")).st = "active";
      complete(q.get("qfinish"));
    }, 2500);
  }
  let tracked = null; // the quest whose beacon you're following
  const trackedQuest = () => {
    if (tracked && Q(tracked).st === "active") return tracked;
    const act = BOOK().find((q) => Q(q.id).st === "active");
    return act ? act.id : null;
  };

  // ---------------------------------------------------------------- HUD
  const hudEl = document.createElement("div");
  hudEl.style.cssText = "position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:40;padding:5px 14px;border-radius:10px;background:rgba(24,18,40,.72);color:#ffe9b0;font:bold 14px system-ui;pointer-events:none;display:none;text-align:center;max-width:70vw";
  document.body.appendChild(hudEl);
  const meterEl = document.createElement("div");
  meterEl.style.cssText = "position:fixed;left:16px;bottom:74px;z-index:40;width:220px;padding:6px 10px;border-radius:10px;background:rgba(10,14,30,.7);color:#fff;font:bold 13px system-ui;display:none;pointer-events:none";
  document.body.appendChild(meterEl);
  function meter(label, v, color) {
    if (label == null) return (meterEl.style.display = "none");
    meterEl.style.display = "";
    meterEl.innerHTML = `${label}<div style="height:10px;margin-top:4px;border-radius:5px;background:rgba(255,255,255,.15);overflow:hidden"><div style="height:100%;width:${Math.max(0, Math.min(100, v))}%;background:${color};${v < 25 ? "animation:qblink .5s infinite alternate" : ""}"></div></div>`;
  }
  const st = document.createElement("style");
  st.textContent = "@keyframes qblink{from{opacity:1}to{opacity:.3}} .qlog .q{margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.5)} .qlog .q.done{opacity:.6} .qlog .q b{font-size:15px} .qlog .q small{display:block;color:#6a5030} .qlog .stars{color:#d8902a} .qlog button{float:right}";
  document.head.appendChild(st);
  let timerEnd = 0;
  let timerLabel = "";
  const startTimer = (secs, label) => {
    timerEnd = performance.now() + secs * timeScale() * 1000;
    timerLabel = label;
  };
  const timeLeft = () => Math.max(0, (timerEnd - performance.now()) / 1000);

  // ---------------------------------------------------------------- 🔆 the beacon (where to go)
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.1, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd86a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 30;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 6, 24), B(0xffe08a));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    beacon.add(beam, ring, glow(0xffe08a, 3));
    beacon.userData.ring = ring;
  }
  function showBeacon(at) {
    const g = groupHere();
    if (!at || !g) {
      beacon.visible = false;
      return;
    }
    if (beacon.parent !== g) g.add(beacon);
    beacon.visible = true;
    const y = at.y ?? heightHere()(at.x, at.z);
    beacon.position.set(at.x, y, at.z);
  }

  // ---------------------------------------------------------------- givers
  const givers = {}; // id → { m, mark, at }
  function markTex(ch, color) {
    // (big, heavy and outlined at high resolution, so it reads from afar)
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const c = cv.getContext("2d");
    c.font = '900 216px "Trebuchet MS", Verdana, sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineJoin = "round";
    c.lineWidth = 22;
    c.strokeStyle = "rgba(20,14,8,.9)";
    c.strokeText(ch, 128, 136);
    c.fillStyle = color;
    c.fillText(ch, 128, 136);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const MARKS = { new: markTex("!", "#ffcf3a"), active: markTex("?", "#bfe6ff"), ready: markTex("?", "#ffcf3a") };
  /** a free, dry, walkable spot near (x, z) in a city */
  function landSpot(c, x, z) {
    for (let r = 0; r < 30; r += 1.5) {
      for (let a = 0; a < Math.PI * 2; a += 0.6) {
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        if (c.waterAt && c.waterAt(px, pz) !== null) continue;
        if (c.colliders.some((k) => Math.hypot(px - k.x, pz - k.z) < k.r + 1.4)) continue;
        return { x: px, z: pz };
      }
    }
    return { x, z };
  }
  /** a clear spot near (x, z) in Everbough (nothing solid in the way) */
  function everSpot(x, z) {
    const cols = ctx.cityCols ? ctx.cityCols() : [];
    for (let r = 0; r < 30; r += 1.5) {
      for (let a = 0; a < Math.PI * 2; a += 0.6) {
        const px = x + Math.cos(a) * r;
        const pz = z + Math.sin(a) * r;
        if (!cols.some((k) => Math.hypot(px - k.x, pz - k.z) < k.r + 1.4)) return { x: px, z: pz };
      }
    }
    return { x, z };
  }
  function buildGiver(q) {
    if (!q.giver.at) return null;
    const c = ctx.world() === "city" ? ctx.city() : null;
    const g = groupHere();
    if (!g) return null;
    const at = c ? landSpot(c, q.giver.at.x, q.giver.at.z) : ctx.world() === "everbough" ? everSpot(q.giver.at.x, q.giver.at.z) : q.giver.at;
    const H = heightHere();
    const m = buildThistle({ tunicColor: q.giver.tunic, hoodColor: q.giver.tunic, pack: false });
    m.scale.setScalar(1.08);
    m.position.set(at.x, H(at.x, at.z), at.z);
    m.rotation.y = Math.atan2(-at.x, -at.z);
    const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: MARKS.new, transparent: true, depthWrite: false }));
    mark.scale.setScalar(1.1);
    mark.position.y = 2.1;
    m.add(mark);
    // 💡 a beam of light on them once it's time to go back
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 30, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 15;
    beam.visible = false;
    m.add(beam);
    g.add(m);
    if (c) c.colliders.push({ x: at.x, z: at.z, r: 0.7 });
    return { m, mark, at, group: g, beam };
  }
  const qgo = new URLSearchParams(location.search).get("qgo"); // (test: stand by this quest's giver)
  let qgoDone = false;
  function giversUpdate(t) {
    const w = here();
    if (qgo && !qgoDone && givers[qgo]) {
      qgoDone = true;
      const g = givers[qgo];
      ctx.placePlayer(g.at.x + Math.sin(g.m.rotation.y) * 1.8, g.at.z + Math.cos(g.m.rotation.y) * 1.8, g.m.rotation.y + Math.PI);
    }
    // (givers from an earlier volume go home)
    for (const id of Object.keys(givers)) {
      if (givers[id] && !BOOK().some((q) => q.id === id)) {
        givers[id].m.parent && givers[id].m.parent.remove(givers[id].m);
        givers[id] = null;
      }
    }
    for (const q of BOOK()) {
      if (q.city !== w || !q.giver.at) continue;
      let gv = givers[q.id];
      if (gv && gv.group !== groupHere()) gv = givers[q.id] = null;
      if (!gv && (ctx.world() !== "everbough" || ctx.cityBuilt())) gv = givers[q.id] = buildGiver(q);
      if (!gv) continue;
      const s = Q(q.id);
      gv.mark.visible = s.st !== "done";
      gv.mark.material.map = s.st === "new" ? MARKS.new : MARKS.active;
      gv.mark.position.y = 2.1 + Math.sin(t * 3) * 0.12;
      // the job's done — time to go back to them
      const stepTxt = s.st === "active" ? q.steps[Math.min(s.step, q.steps.length - 1)] || "" : "";
      gv.beam.visible = /^(bring|return|go back|back to)/i.test(stepTxt) && stepTxt.includes(q.giver.name.split(" ").pop());
      if (gv.beam.visible) gv.beam.material.opacity = 0.28 + Math.sin(t * 3) * 0.1;
    }
  }
  function offerCard(q) {
    const s = Q(q.id);
    const stars = "★".repeat(q.stars) + "☆".repeat(5 - q.stars);
    openCard(
      `<div class="card"><h3>${q.icon} ${q.name}</h3><div class="coins">${q.giver.name} · difficulty <span style="color:#d8902a">${stars}</span></div>
      <p style="font:15px Georgia;line-height:1.45">“${q.story}”</p>
      <ol style="font:13px system-ui;margin:6px 0 10px 18px">${q.steps.map((x) => `<li>${x}</li>`).join("")}</ol>
      <div class="coins">Reward: 🪙 ${reward(q).coins} and ${reward(q).icon} ${reward(q).name}</div>
      <div style="text-align:center;font:13px system-ui;color:#2a6a3a">✨ ${powerOf(q)}</div>
      <div style="text-align:center;margin-top:10px"><button id="qaccept" style="font:bold 16px system-ui;padding:8px 20px">⚔️ I'll do it!</button></div>
      <div class="close">Esc — not yet · Q — your Quest Log</div></div>`,
      (el) => {
        el.querySelector("#qaccept").onclick = () => {
          closeCard();
          accept(q);
        };
        if (new URLSearchParams(location.search).get("qaccept")) setTimeout(() => el.querySelector("#qaccept").click(), 1500); // (test)
      }
    );
  }
  function accept(q) {
    const s = Q(q.id);
    s.st = "active";
    s.step = 0;
    s.data = {};
    tracked = q.id;
    save();
    ctx.chime();
    ctx.say(`${q.icon} Quest begun: ${q.name}! It's in your Quest Tracker (left). ${q.city === here() ? "Follow the golden beacon!" : `Head to ${CITY_NAME[q.city]} — ${q.city === "forest" ? "it's in the Great Forest" : "travel there (K, or a waystone)"}.`}`, true);
  }
  function giverInteract() {
    for (const q of BOOK()) {
      const gv = givers[q.id];
      if (!gv || gv.group !== groupHere() || !near(gv.at.x, gv.at.z, 2.6)) continue;
      const s = Q(q.id);
      if (s.st === "new") return { label: `talk to ${q.giver.name} ${q.icon}`, act: () => offerCard(q) };
      const extra = IMPL[q.id] && IMPL[q.id].giverAct && IMPL[q.id].giverAct();
      if (extra) return extra;
      if (s.st === "active") return { label: `talk to ${q.giver.name}`, act: () => ctx.say(`${q.icon} ${q.giver.name}: “${q.steps[Math.min(s.step, q.steps.length - 1)]}. You can do it!”`, true) };
      return { label: `talk to ${q.giver.name}`, act: () => ctx.say(`${q.icon} ${q.giver.name}: “They'll be telling stories about you for years.”`, true) };
    }
    return null;
  }
  function complete(id, extraLines = []) {
    const q = def(id);
    const s = Q(id);
    const rw = reward(q);
    s.st = "done";
    window.dispatchEvent(new CustomEvent("ww-quest-done", { detail: { name: q.name } }));
    S.coins += rw.coins;
    (S.owned ||= {})[rw.key] = true;
    S.stats ||= {};
    S.stats.quests = (S.stats.quests || 0) + 1;
    if (q.gen) S.questPerks = (S.questPerks || 0) + 1; // (each Quest Book treasure: +5% selling prices)
    // every quest in the book done? → the book REFRESHES (next volume)
    const bookDone = BOOK().every((x) => Q(x.id).st === "done");
    if (bookDone) {
      // the book refreshes: a whole new volume of DIFFERENT, harder quests
      S.questVolume = vol() + 1;
      tracked = null;
    }
    save();
    hudEl.style.display = "none";
    playCutscene([
      ...extraLines,
      { dur: 3.6, black: true, gameCam: true, big: false, who: `${q.icon} QUEST COMPLETE`, text: `${q.name}\n🪙 ${rw.coins} · ${rw.icon} ${rw.name}` },
      ...(bookDone ? [{ dur: 4.2, black: true, gameCam: true, who: "📖 YOUR QUEST BOOK REFRESHES!", text: `Every quest is done… so the pages turn over to VOLUME ${S.questVolume}: ${genBook(S.questVolume).length} brand-new quests across the Great Cities — harder than anything before!` }] : []),
      { dur: 0.6, fadeIn: true, gameCam: true, end: () => {
        ctx.chime();
        if (bookDone) return ctx.say(`📖 Quest Book — Volume ${S.questVolume}! ${genBook(S.questVolume).length} NEW quests (golden ❗ on the givers) · Q to choose one`, true);
        ctx.say(`${rw.icon} ${rw.name} is yours! ✨ Its power: ${powerOf(q)}. · Q — more quests`, true);
      } },
    ]);
  }
  // 🛠️ (designer) finish a quest instantly — no movie, rewards paid
  function finishQuiet(id) {
    const q = def(id);
    if (!q || Q(id).st === "done") return;
    const rw = reward(q);
    Q(id).st = "done";
    S.coins += rw.coins;
    (S.owned ||= {})[rw.key] = true;
    S.stats ||= {};
    S.stats.quests = (S.stats.quests || 0) + 1;
    if (q.gen) S.questPerks = (S.questPerks || 0) + 1;
    if (IMPL[id] && IMPL[id].cleanup) IMPL[id].cleanup();
  }
  function finishAll() {
    for (const q of BOOK()) finishQuiet(q.id);
    S.questVolume = vol() + 1; // the book refreshes
    tracked = null;
    save();
    ctx.chime();
    ctx.say(`🛠️ (designer) Every quest finished — the Quest Book turns to Volume ${S.questVolume}!`, true);
  }
  if (new URLSearchParams(location.search).get("finishquests")) setTimeout(finishAll, 2500);
  const advance = (id, msg) => {
    const s = Q(id);
    s.step++;
    save();
    ctx.chime();
    if (msg) ctx.say(msg, true);
  };

  // ======================================================================
  //  the quests, one by one
  // ======================================================================
  const IMPL = {};
  const zoneHere = (id) => ctx.world() === "city" && ctx.city() && ctx.city().id === id;

  // ---------------------------------------------------------------- 🏔️ PEAKS
  {
    let cold = 100;
    let checkpoint = null;
    let gust = { t: 0, dir: 1, phase: "calm" };
    let bTimer = 0;
    let hitCool = 0;
    const F = (k) => PEAK_FIRES.find((f) => f.key === k);
    const lit = () => (Q("peaks").data.lit ||= {});
    IMPL.peaks = {
      target() {
        const s = Q("peaks");
        if (here() === "frostpine") return def("peaks").giver.at ? givers.peaks && givers.peaks.at : null;
        if (!zoneHere("peaks")) return null;
        const next = ["f1", "f2", "f3", "pact"].find((k) => !lit()[k]);
        if (!next) return null;
        const f = F(next);
        return { x: f.x, z: f.z, y: f.y };
      },
      giverAct() {
        const s = Q("peaks");
        if (s.st === "new") return null;
        return { label: s.st === "done" ? "climb the Pact Peaks again 🏔️" : "begin the climb to the Pact Peaks 🏔️", act: enterPeaks };
      },
      interact() {
        if (!zoneHere("peaks")) return null;
        const Z = ctx.city();
        const camp = F("camp");
        if (near(camp.x, camp.z, 4)) return { label: "go back down to Frostpine", act: () => leaveZone("frostpine", def("peaks").giver.at) };
        for (const fire of Z.fires) {
          if (fire.key === "camp" || !near(fire.x, fire.z, fire.key === "pact" ? 5 : 3) || Math.abs(me().y - fire.y) > 3) continue;
          if (lit()[fire.key]) {
            if (fire.key === "pact") return { label: "ride the wind back down to Frostpine", act: () => leaveZone("frostpine", def("peaks").giver.at) };
            continue;
          }
          if (fire.key === "pact") {
            if (!["f1", "f2", "f3"].every((k) => lit()[k])) return { label: "Renata's fire-ring, under the snow…", act: () => ctx.say("🏔️ The three signal fires below must burn first.", true) };
            if (fire.heap && fire.heap.visible) return { label: "brush the snow from Renata's fire-ring", act: () => { fire.heap.visible = false; ctx.bite(); ctx.say("🏔️ Under the snow: a ring of old stones, carved with a crescent moon and an oak leaf. Light it!", true); } };
            return { label: "light Renata's Pact Fire 🔥", act: () => lightPact(Z, fire) };
          }
          return { label: `light ${fire.name} 🔥`, act: () => {
            lit()[fire.key] = true;
            fire.setLit(true);
            checkpoint = fire;
            cold = 100;
            const n = ["f1", "f2", "f3"].filter((k) => lit()[k]).length;
            Q("peaks").step = Math.max(Q("peaks").step, 1 + n);
            save();
            ctx.chime();
            ctx.say(`🔥 ${fire.name} blazes up! (${n}/3) Far below in Frostpine, someone sees it and cheers. ${["", "The bridge ahead is old ice — don't stand still!", "The col ahead is knife-thin. When the wind howls, lean into it!", "Now the summit. Watch for falling rocks — hide in the nooks!"][n]}`, true);
          } };
        }
        return null;
      },
      update(dt, t) {
        if (!zoneHere("peaks")) return;
        const Z = ctx.city();
        const p = me();
        // fires you've lit stay lit
        for (const fire of Z.fires) if (fire.key !== "camp") fire.setLit(!!lit()[fire.key]);
        if (lit().pact && Z.fires[4].heap) Z.fires[4].heap.visible = false;
        Z.setAurora(lit().pact ? 1 : 0.15);
        if (!checkpoint) checkpoint = [...Z.fires].reverse().find((f) => f.key === "camp" || lit()[f.key]) || Z.fires[0];
        // 🥶 the cold: fires warm you, wool helps
        const warmFire = Z.fires.some((f) => (f.key === "camp" || lit()[f.key]) && Math.hypot(p.x - f.x, p.z - f.z) < 7);
        if (warmFire) cold = Math.min(100, cold + dt * 30);
        else cold -= dt * 1.6 * Math.max(0.35, 1 - warmthBonus() * 0.15);
        if (cold <= 0) {
          cold = 0;
          ctx.hurt(dt * 4);
        }
        meter(cold < 30 ? "🥶 FREEZING — get to a fire!" : "🔥 Warmth", cold, cold < 30 ? "#6ab8ff" : "linear-gradient(90deg,#ff8a2a,#ffd86a)");
        // 💨 the wind-swept col
        const col = Z.route[6];
        const o = Z.onSeg(p.x, p.z, [col.a[0], col.a[1]], [col.b[0], col.b[1]]);
        const onCol = o.t > 0.03 && o.t < 0.97 && o.d < 3;
        gust.t -= dt;
        if (gust.t <= 0) {
          if (gust.phase === "calm") {
            gust = { phase: "warn", t: 0.9, dir: Math.random() < 0.5 ? -1 : 1 };
          } else if (gust.phase === "warn") gust = { ...gust, phase: "blow", t: 1.1 };
          else gust = { phase: "calm", t: 2.2 + Math.random() * 1.5, dir: 1 };
        }
        Z.gust = gust.phase === "blow" ? gust.dir * 2 : 0;
        if (onCol) {
          if (gust.phase === "warn") hud(`💨 A GUST IS COMING ${gust.dir > 0 ? "→" : "←"} — lean the other way!`);
          else if (gust.phase === "blow") {
            p.x += o.nx * gust.dir * 3.3 * dt;
            p.z += o.nz * gust.dir * 3.3 * dt;
            hud("💨💨 WHOOOOSH!");
          }
        }
        // 🪨 the boulder chute
        const ch = Z.route[8];
        const oc = Z.onSeg(p.x, p.z, [ch.a[0], ch.a[1]], [ch.b[0], ch.b[1]]);
        const nearChute = oc.d < 12 && p.y > ch.a[2] - 4;
        bTimer -= dt;
        hitCool -= dt;
        if (nearChute && bTimer <= 0) {
          bTimer = 1.05 + Math.random() * 0.6;
          const b = Z.boulders.find((x) => !x.on);
          if (b) Object.assign(b, { on: true, t: 1, side: (Math.random() * 2 - 1) * 3, sp: 9 + Math.random() * 4 });
        }
        for (const b of Z.boulders) {
          if (!b.on) {
            b.m.visible = false;
            continue;
          }
          b.t -= (dt * b.sp) / oc.len;
          if (b.t <= -0.05) {
            b.on = false;
            continue;
          }
          const bx = lerp(ch.a[0], ch.b[0], b.t) + oc.nx * b.side;
          const bz = lerp(ch.a[1], ch.b[1], b.t) + oc.nz * b.side;
          const by = lerp(ch.a[2], ch.b[2], b.t) + 1.15;
          b.m.visible = true;
          b.m.position.set(bx, by, bz);
          b.m.rotation.x += dt * b.sp;
          if (hitCool <= 0 && Math.hypot(p.x - bx, p.z - bz) < 1.6 && Math.abs(p.y + 0.5 - by) < 1.8) {
            hitCool = 1.2;
            ctx.hurt(12);
            ctx.say("🪨 THUMP! A boulder bowls you over — back down the chute you go!", true);
            respawn();
          }
        }
        // a fall into the abyss → the Wardens' rope catches you at the last fire
        if (p.y < checkpoint.y - 12 && !ctx.playing()) {
          ctx.hurt(8);
          ctx.say("🪢 You slip into the clouds — and a Warden's rope catches you! Back to the last fire…", true);
          respawn();
        }
      },
    };
    // (put you back RIGHT AWAY, then a little fade — so a fall can never
    // trigger it again and again, fading the screen to black forever)
    function respawn() {
      const c = checkpoint;
      ctx.placePlayer(c.x + 2.5, c.z + 2.5, Math.atan2(-c.x, -c.z));
      cold = Math.max(cold, 70);
      fadeThrough(() => {}, 0.25);
    }
    function enterPeaks() {
      fadeThrough(() => {
        ctx.goCity("peaks");
        checkpoint = null;
        cold = 100;
        ctx.placePlayer(1.5, 99, Math.PI);
        if (Q("peaks").step < 1) Q("peaks").step = 1;
        save();
        ctx.say("🏔️ THE PACT PEAKS. Thin air, cold wind, and the trail falls away into cloud on both sides. The first signal fire is across the ice floes…", true);
      }, 0.8);
    }
    function lightPact(Z, fire) {
      lit().pact = true;
      fire.setLit(true);
      save();
      complete("peaks", [
        { dur: 3.6, from: [fire.x + 14, fire.y + 8, fire.z + 16], look: [fire.x, fire.y + 3, fire.z], text: "The Pact Fire roars up — for the first time in a hundred years.", update: () => Z.setAurora(0.3) },
        { dur: 4.4, from: [fire.x, fire.y + 4, fire.z + 30], look: [0, 110, -150], who: "The Aurora Weavers", text: "“One ribbon for every road a Moonkeeper ever walked… and tonight, one more. Yours.”", update: (k) => Z.setAurora(0.3 + (k || 0) * 0.7) },
        { dur: 4, from: [fire.x + 8, fire.y + 3, fire.z + 8], look: [fire.x, fire.y + 2, fire.z], who: "Renata Josephine Rudy (a voice in the fire)", text: "“No traveler will freeze on this pass again. Thank you, little Warden.”" },
      ]);
    }
  }

  // ---------------------------------------------------------------- 🌊 DEEP
  {
    let air = 100;
    let hitCool = 0;
    let eelI = 0;
    const got = () => (Q("deep").data.pages ||= {});
    const pageMeshes = {};
    let pagesBuilt = null;
    IMPL.deep = {
      target() {
        const s = Q("deep");
        if (here() === "reedmere") return { x: 26, z: -26, y: 0.3 };
        if (!zoneHere("deep")) return null;
        const Z = ctx.city();
        const n = Object.keys(got()).length;
        if (n >= 5) return { x: Z.vault.x, z: Z.vault.z };
        // the nearest page you haven't found
        let best = null;
        let bd = Infinity;
        DEEP.pages.forEach((pg, i) => {
          if (got()[i]) return;
          const d = Math.hypot(pg.x - me().x, pg.z - me().z);
          if (d < bd) { bd = d; best = pg; }
        });
        return best;
      },
      interact() {
        const s = Q("deep");
        if (here() === "reedmere" && s.st !== "new" && near(29.5, -29.5, 8)) return { label: s.st === "done" ? "dive to the Drowned Library again 🌊" : "take a deep breath… and DIVE 🌊", act: enterDeep };
        if (!zoneHere("deep")) return null;
        const Z = ctx.city();
        if (near(DEEP.anchor.x, DEEP.anchor.z, 3.5)) return { label: "climb the anchor rope back up to Reedmere", act: () => leaveZone("reedmere", { x: 40, z: -40 }) };
        for (let i = 0; i < DEEP.pages.length; i++) {
          const pg = DEEP.pages[i];
          if (got()[i] || !near(pg.x, pg.z, 2.2)) continue;
          return { label: "take the lost page 📜", act: () => {
            got()[i] = true;
            if (pageMeshes[i]) pageMeshes[i].visible = false;
            const n = Object.keys(got()).length;
            if (Q("deep").step < 2) Q("deep").step = 2;
            if (n >= 5) Q("deep").step = 3;
            save();
            ctx.chime();
            ctx.say(n >= 5 ? "📜 All FIVE pages! Bring them to the vault of the Drowned Library." : `📜 A lost page (${n}/5), ${pg.where}. The words shimmer: “${["…and the roads ran under the water as well as over it…", "…we hid the vault where the eel sleeps…", "…the stars are the same above and below…", "…Renata swam this deep once, with a lantern of pearl…", "…what is written in water is never forgotten…"][i]}”`, true);
          } };
        }
        if (Object.keys(got()).length >= 5 && Q("deep").st !== "done" && near(Z.vault.x, Z.vault.z, 4)) return { label: "return the five pages to the vault 📚", act: () => openVault(Z) };
        return null;
      },
      update(dt, t) {
        if (!zoneHere("deep")) {
          return;
        }
        const Z = ctx.city();
        const p = me();
        if (pagesBuilt !== Z) {
          pagesBuilt = Z;
          DEEP.pages.forEach((pg, i) => {
            const g = new THREE.Group();
            const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), B(0xfff4d8, { side: THREE.DoubleSide }));
            g.add(sheet, glow(0xfff0a0, 2.6));
            g.position.set(pg.x, Z.height(pg.x, pg.z) + 1.3, pg.z);
            Z.group.add(g);
            pageMeshes[i] = g;
          });
          Z.vault.open = false;
        }
        DEEP.pages.forEach((pg, i) => {
          const g = pageMeshes[i];
          g.visible = !got()[i];
          g.rotation.y = t * 1.5;
          g.position.y = Z.height(pg.x, pg.z) + 1.3 + Math.sin(t * 2 + i) * 0.2;
        });
        if (Q("deep").st === "done") Z.vault.door.rotation.y = Math.PI / 2;
        // 💨 air
        const vent = Z.vents.some((v) => Math.hypot(p.x - v.x, p.z - v.z) < 2.8);
        if (vent) air = Math.min(100, air + dt * 45);
        else air -= dt * 2.3 * (S.owned.tidejournal ? 0.5 : 1) * (S.owned.turtleshell ? 0 : 1) * (1 - power("air")); // (🐢 the Lantern-Turtle Scale: never run out) // (📘 the Tidebound Journal: air lasts twice as long)
        meter(air < 25 ? "🫧 AIR LOW — find a bubble vent!" : vent ? "🫧 Breathing the bubbles…" : "🫧 Air", air, air < 25 ? "#ff6a6a" : "linear-gradient(90deg,#6ad8ff,#e8f8ff)");
        if (air <= 0) {
          air = 100;
          ctx.hurt(10);
          ctx.say("🫧 Out of air! You kick for the surface… and Diver Marrow hauls you back down the rope. (Your pages are safe.)", true);
          ctx.placePlayer(DEEP.anchor.x + 2, DEEP.anchor.z - 3, Math.PI);
          fadeThrough(() => {}, 0.3);
        }
        hitCool -= dt;
        // 🎐 jellies sting
        for (const j of Z.jellies) {
          if (hitCool > 0) break;
          if (Math.hypot(p.x - j.g.position.x, p.z - j.g.position.z) < 1.3 && j.y - p.y < 1.5) {
            hitCool = 1;
            ctx.hurt(8);
            air -= 8;
            ctx.say("🎐 Zzzt! A jellyfish sting!");
          }
        }
        // 🐟 the anglerfish
        const A = Z.angler;
        if (hitCool <= 0 && Math.hypot(p.x - A.x, p.z - A.z) < 2.6) {
          hitCool = 2;
          ctx.hurt(18);
          air -= 25;
          const d = Math.hypot(p.x - A.x, p.z - A.z) || 1;
          p.x += ((p.x - A.x) / d) * 5;
          p.z += ((p.z - A.z) / d) * 5;
          ctx.say("🐟 CHOMP! The lantern-jawed anglerfish snaps at you — swim for it!", true);
        }
        // 🐍 the Silver Eel leads on, waiting whenever you fall behind
        const E = Z.eel;
        const tgt = DEEP.eelPath[Math.min(eelI, DEEP.eelPath.length - 1)];
        const dE = Math.hypot(tgt[0] - E.x, tgt[1] - E.z);
        const youNear = Math.hypot(p.x - E.x, p.z - E.z) < 10;
        if (dE < 0.5 && youNear && eelI < DEEP.eelPath.length - 1) {
          eelI++;
          if (eelI === DEEP.eelPath.length - 1 && Q("deep").step < 2) {
            Q("deep").step = 2;
            save();
            ctx.say("🐍 The Silver Eel coils round the library's columns. This is the place! Now — the five lost pages…", true);
          }
        }
        if (dE > 0.05 && youNear) {
          E.x += ((tgt[0] - E.x) / dE) * Math.min(dE, dt * 6);
          E.z += ((tgt[1] - E.z) / dE) * Math.min(dE, dt * 6);
        }
        E.trail.unshift([E.x, Z.height(E.x, E.z) + 2 + Math.sin(t * 2) * 0.3, E.z]);
        E.trail.length = Math.min(E.trail.length, 60);
        E.segs.forEach((s, i) => {
          const tr = E.trail[Math.min(E.trail.length - 1, i * 4)];
          s.position.set(tr[0] + Math.sin(t * 6 + i) * 0.15, tr[1], tr[2]);
        });
        E.g.children[E.g.children.length - 1].position.copy(E.segs[0].position);
        if (Q("deep").step === 1 && youNear) hud("🐍 Follow the Silver Eel…");
      },
    };
    function enterDeep() {
      fadeThrough(() => {
        ctx.goCity("deep");
        air = 100;
        eelI = 0;
        const Z = ctx.city();
        Object.assign(Z.eel, { x: DEEP.eelPath[0][0], z: DEEP.eelPath[0][1], trail: [] });
        ctx.placePlayer(DEEP.anchor.x, DEEP.anchor.z - 3, Math.PI);
        if (Q("deep").step < 1) Q("deep").step = 1;
        save();
        ctx.say("🌊 Down, down, down… THE DROWNED DEEP. Light falls in ribbons. Something silver flickers in the kelp — the Silver Eel! Follow it. Watch your 🫧 air: bubble vents refill it.", true);
      }, 0.9);
    }
    function openVault(Z) {
      const v = Z.vault;
      complete("deep", [
        { dur: 3.6, from: [v.x + 6, Z.height(v.x, v.z) + 4, v.z + 8], look: [v.x, Z.height(v.x, v.z) + 2.3, v.z - 2.5], text: "The five pages flutter from your paws and slide, one by one, into the crescent on the vault door…", update: () => (v.door.rotation.y = Math.min(Math.PI / 2, v.door.rotation.y + 0.01)) },
        { dur: 4, from: [v.x + 3, Z.height(v.x, v.z) + 3, v.z + 5], look: [v.x, Z.height(v.x, v.z) + 2.3, v.z - 3], text: "…and with a sound like a thousand pages turning, the Drowned Library opens its vault.", update: () => (v.door.rotation.y = Math.min(Math.PI / 2, v.door.rotation.y + 0.02)) },
        { dur: 4.2, from: [v.x + 2, Z.height(v.x, v.z) + 2.5, v.z + 3], look: [v.x, Z.height(v.x, v.z) + 1.5, v.z - 4], who: "Inside, a journal sealed in pearl", text: "“The roads run under the water as well as over it. Whoever reads this — you are a Moonkeeper now, above AND below.” — R.J.R." },
      ]);
    }
  }
  function leaveZone(city, at) {
    fadeThrough(() => {
      ctx.goCity(city);
      const c = ctx.city();
      const sp = c ? landSpot(c, at.x + 2, at.z + 2) : at;
      ctx.placePlayer(sp.x, sp.z, 0);
      meter(null);
    }, 0.8);
  }

  // ---------------------------------------------------------------- 🎶 SONG (Golden Hollow)
  {
    const WINDMILL = { x: -42, z: -14 };
    const ACORN = { x: -48, z: -22 };
    const BELLS = [
      { x: -64, z: 26, color: 0xff5a5a, name: "red", emo: "🔴", tone: 523 }, // (well away from the drought fields' beams)
      { x: -30, z: 30, color: 0xffd23a, name: "gold", emo: "🟡", tone: 659 },
      { x: -64, z: -36, color: 0x5a8aff, name: "blue", emo: "🔵", tone: 784 },
      { x: -20, z: 8, color: 0xf4f4ff, name: "white", emo: "⚪", tone: 988 },
    ];
    let built = null;
    let bellsAt = [];
    let acornMesh = null;
    const order = () => (Q("song").data.order ||= [0, 1, 2, 3].sort(() => Math.random() - 0.5));
    function tone(f, delay = 0) {
      try {
        const ac = (tone.ac ||= new AudioContext());
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + delay);
        g.gain.linearRampToValueAtTime(0.18, ac.currentTime + delay + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.9);
        o.connect(g).connect(ac.destination);
        o.start(ac.currentTime + delay);
        o.stop(ac.currentTime + delay + 1);
      } catch {}
    }
    IMPL.song = {
      // (no golden beam for the windmill or the bell-flowers — you have to
      // remember the song yourself! Only the Golden Acorn gets a beam.)
      noBeacon: () => Q("song").step < 2,
      target: () => (here() === "golden" && Q("song").step === 2 ? ACORN : null),
      build(c) {
        if (built === c) return;
        built = c;
        bellsAt = BELLS.map((b) => {
          const at = landSpot(c, b.x, b.z);
          const g = new THREE.Group();
          g.position.set(at.x, c.height(at.x, at.z), at.z);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 5), M(0x4a8a3a));
          stem.position.y = 0.8;
          const bell = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 8, 1, true), M(b.color, { emissive: b.color, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
          bell.position.y = 1.6;
          bell.rotation.x = Math.PI;
          g.add(stem, bell, glow(b.color, 2.4));
          g.children[2].position.y = 1.6;
          g.visible = false;
          c.group.add(g);
          return { ...b, ...at, g, bell };
        });
        const a = landSpot(c, ACORN.x, ACORN.z);
        Object.assign(ACORN, a);
        acornMesh = new THREE.Group();
        const mound = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6a4a2c));
        acornMesh.add(mound, glow(0xffd86a, 3));
        acornMesh.children[1].position.y = 0.8;
        acornMesh.position.set(a.x, c.height(a.x, a.z), a.z);
        acornMesh.visible = false;
        c.group.add(acornMesh);
      },
      interact() {
        if (here() !== "golden") return null;
        const s = Q("song");
        if (s.st !== "active") return null;
        if (s.step === 0 && near(WINDMILL.x, WINDMILL.z, 6.5)) return { label: "press your ear to the windmill and listen 🎶", act: () => {
          const ord = order();
          ord.forEach((i, k) => tone(BELLS[i].tone, k * 0.6));
          openCard(`<div class="card"><h3>🎶 The Song of the First Feast</h3><p style="font:15px Georgia">The sails creak round, and the old mill hums four notes — over and over, like it's been waiting for someone to hear:</p>
            <div style="font-size:44px;text-align:center;letter-spacing:12px">${ord.map((i) => BELLS[i].emo).join("")}</div>
            <p style="font:14px Georgia">Find the four bell-flowers in the fields (they glow!) and ring them in THIS order. Ring a wrong one and the song starts over.</p><div class="close">Esc — off you go</div></div>`);
          s.data.rung = [];
          advance("song");
        } };
        if (s.step === 1) {
          for (const b of bellsAt) {
            if (!near(b.x, b.z, 2.2)) continue;
            const i = BELLS.findIndex((x) => x.name === b.name);
            return { label: `ring the ${b.name} bell-flower ${b.emo}`, act: () => {
              tone(b.tone);
              b.bell.rotation.z = 0.5;
              const ord = order();
              const rung = (s.data.rung ||= []);
              if (ord[rung.length] === i) {
                rung.push(i);
                if (rung.length === 4) {
                  ord.forEach((k, j) => tone(BELLS[k].tone, 0.4 + j * 0.25));
                  advance("song", "🎶 The whole field sings the song back! Behind the windmill, the earth trembles… DIG!");
                } else {
                  save();
                  ctx.say(`🎶 ${rung.map((k) => BELLS[k].emo).join("")} — yes! Next…`);
                }
              } else {
                s.data.rung = [];
                save();
                ctx.say(`🎶 Ding — wrong note! The song falls silent. Start again: ${ord.map((k) => BELLS[k].emo).join("")}`, true);
              }
            } };
          }
        }
        if (s.step === 2 && near(ACORN.x, ACORN.z, 2.4)) return { label: "dig behind the windmill 🌰", act: () => {
          ctx.bite();
          acornMesh.visible = false;
          complete("song", [{ dur: 3.6, from: () => [me().x + 3, me().y + 2, me().z + 3], look: () => [me().x, me().y + 0.5, me().z], text: "Under the roots of the first windmill — glowing like a little sun — the GOLDEN ACORN that Renata planted at the first Feast." }]);
        } };
        return null;
      },
      update(dt, t) {
        if (here() !== "golden") return;
        const s = Q("song");
        bellsAt.forEach((b, i) => {
          b.g.visible = s.st === "active" && s.step >= 1;
          b.bell.rotation.z *= 0.9;
          b.g.children[2].material.opacity = (s.data.rung || []).includes(i) ? 1 : 0.6 + Math.sin(t * 3 + i) * 0.2;
        });
        if (acornMesh) acornMesh.visible = s.st === "active" && s.step === 2;
      },
    };
  }

  // ---------------------------------------------------------------- 🌾 SCARECROWS (Golden Hollow)
  {
    const SPOTS = [{ x: 44, z: 8 }, { x: 56, z: 34 }, { x: 34, z: 58 }, { x: 4, z: 52 }, { x: -18, z: 62 }, { x: -44, z: 46 }];
    const CIRCLE = { x: -26, z: 36 };
    let built = null;
    let crows = [];
    let circle = null;
    IMPL.scarecrows = {
      target() {
        if (here() !== "golden") return null;
        const s = Q("scarecrows");
        if (s.step <= 1) return crows[s.data.n || 0] || null;
        return circle ? CIRCLE : null;
      },
      build(c) {
        if (built === c) return;
        built = c;
        crows = SPOTS.map((sp) => {
          const at = landSpot(c, sp.x, sp.z);
          const g = new THREE.Group();
          g.position.set(at.x, c.height(at.x, at.z), at.z);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 5), M(0x6a4a2c));
          pole.position.y = 1.3;
          const body = new THREE.Group();
          body.position.y = 1.6;
          const coat = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.3, 6), M(0x8a5a3a));
          const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 4), M(0x6a4a2c));
          arms.rotation.z = Math.PI / 2;
          arms.position.y = 0.3;
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), M(0xe8d0a0));
          head.position.y = 0.95;
          const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), M(0xc8a040));
          hat.position.y = 1.3;
          const eyes = glow(0xffd86a, 0.9);
          eyes.position.set(0, 0.95, 0.3);
          body.add(coat, arms, head, hat, eyes);
          g.add(pole, body);
          // a path of light toward the next one (shown when it bows)
          const arrow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 6), B(0xffe08a, { transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
          arrow.rotation.x = -Math.PI / 2;
          arrow.position.y = 0.15;
          const arrowG = new THREE.Group();
          arrowG.add(arrow);
          arrow.position.z = 4;
          arrowG.visible = false;
          g.add(arrowG);
          c.group.add(g);
          c.colliders.push({ x: at.x, z: at.z, r: 0.6 });
          return { ...at, g, body, eyes, arrowG, bow: 0 };
        });
        circle = new THREE.Group();
        const at = landSpot(c, CIRCLE.x, CIRCLE.z);
        Object.assign(CIRCLE, at);
        for (let k = 0; k < 3; k++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2 + k * 1.6, 0.12, 4, 32), B(0xffe08a, { transparent: true, opacity: 0.6 }));
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.15;
          circle.add(ring);
        }
        circle.add(glow(0xfff0a0, 6));
        circle.children[3].position.y = 1;
        circle.position.set(at.x, c.height(at.x, at.z), at.z);
        circle.visible = false;
        c.group.add(circle);
      },
      interact() {
        if (here() !== "golden") return null;
        const s = Q("scarecrows");
        if (s.st !== "active") return null;
        const n = s.data.n || 0;
        if (s.step <= 1 && crows[n] && near(crows[n].x, crows[n].z, 2.8)) return { label: n === 0 ? "greet the first scarecrow 🌾" : "touch the scarecrow's sleeve 🌾", act: () => {
          crows[n].bow = 1;
          s.data.n = n + 1;
          if (n === 0) {
            s.step = 1;
            startTimer(100, "🌕 The Harvest Moon sets in");
            ctx.say("🌾 It BOWS — toward the next one! Follow the bows before the moon sets!", true);
          } else ctx.say(`🌾 ${n + 1}/6 — it bows onward!`);
          if (s.data.n >= SPOTS.length) {
            s.step = 2;
            timerEnd = 0;
            ctx.say("🌾 The last scarecrow bows to a CIRCLE pressed into the wheat, glowing gold…", true);
          }
          save();
          ctx.chime();
        } };
        if (s.step === 2 && near(CIRCLE.x, CIRCLE.z, 2.8)) return { label: "search the middle of the crop circle ✨", act: () => complete("scarecrows", [{ dur: 4, from: () => [me().x + 6, me().y + 8, me().z + 6], look: () => [me().x, me().y, me().z], text: "In the very middle of the circle: a coin pressed out of moonlight, still warm. All six scarecrows straighten up, very pleased with themselves." }]) };
        return null;
      },
      update(dt, t) {
        if (here() !== "golden") return;
        const s = Q("scarecrows");
        const n = s.data.n || 0;
        crows.forEach((c2, i) => {
          c2.g.visible = s.st !== "new";
          const lit = s.st === "active" && i === n && s.step <= 1;
          c2.eyes.material.opacity = lit ? 1 : 0.25;
          const bowed = i < n && s.st === "active";
          c2.body.rotation.x = bowed ? 0.5 : 0;
          const next = crows[i + 1] || (i === crows.length - 1 ? CIRCLE : null);
          c2.arrowG.visible = bowed && !!next;
          if (next) {
            const yaw = Math.atan2(next.x - c2.x, next.z - c2.z);
            c2.g.rotation.y = bowed ? yaw : 0;
            c2.arrowG.rotation.y = 0;
          }
        });
        if (circle) circle.visible = s.st === "active" && s.step === 2;
        if (s.st === "active" && s.step === 1 && timerEnd) {
          const left = timeLeft();
          hud(`${timerLabel} ${left.toFixed(0)}s · scarecrow ${n}/6`);
          if (left <= 0) {
            s.step = 0;
            s.data.n = 0;
            timerEnd = 0;
            save();
            ctx.say("🌕 The moon slips behind the hills, and the scarecrows stand up straight again. Start from the first one!", true);
          }
        }
      },
    };
  }

  // ---------------------------------------------------------------- 🏮 LIGHTHOUSE (Reedmere)
  {
    const COLS = [[0xff5a5a, "🔴"], [0xffd23a, "🟡"], [0x5aff8a, "🟢"], [0x5a8aff, "🔵"], [0xd85aff, "🟣"], [0xffffff, "⚪"]];
    const SHRINE = { x: -22, z: -14 };
    let built = null;
    let buoys = [];
    let wisps = [];
    let shrine = null;
    const order = () => (Q("lighthouse").data.order ||= [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 4));
    IMPL.lighthouse = {
      // (no golden beam on the buoys — remember the lighthouse's colors yourself!)
      noBeacon: () => Q("lighthouse").step === 1,
      target() {
        if (here() !== "reedmere") return null;
        const s = Q("lighthouse");
        if (s.step === 2) return { ...SHRINE, y: 0.2 };
        return null;
      },
      build(c) {
        if (built === c) return;
        built = c;
        buoys = COLS.map(([col], i) => {
          const a = (i / COLS.length) * Math.PI * 2 + 0.4;
          const r = 22 + (i % 3) * 7;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          const g = new THREE.Group();
          const float = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), M(col, { emissive: col, emissiveIntensity: 0.5 }));
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2, 0.08, 4, 24), B(col, { transparent: true, opacity: 0.55 }));
          ring.rotation.x = Math.PI / 2;
          g.add(float, ring, glow(col, 3.5));
          g.position.set(x, 0.3, z);
          g.visible = false;
          c.group.add(g);
          return { x, z, g, col };
        });
        wisps = [0, 1, 2].map(() => {
          const w = glow(0x9fffd8, 1.6);
          w.visible = false;
          c.group.add(w);
          return w;
        });
        shrine = new THREE.Group();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.4), M(0x9a9a8a, { emissive: 0x2a4a3a, emissiveIntensity: 0.4 }));
          st.position.set(Math.cos(a) * 2, 0.2, Math.sin(a) * 2);
          shrine.add(st);
        }
        shrine.add(glow(0x9fffd8, 5));
        shrine.position.set(SHRINE.x, -0.4, SHRINE.z);
        shrine.visible = false;
        c.group.add(shrine);
        // (test) &lhwin=1 → three buoys done, the clock running, and you
        // sitting on the last one — you should WIN, not fail
        if (new URLSearchParams(location.search).get("lhwin")) {
          const s = Q("lighthouse");
          s.st = "active";
          s.step = 1;
          const ord = order();
          s.data.hit = ord.slice(0, 3);
          startTimer(80, "🏮 The lamp fades in");
          setTimeout(() => ctx.placePlayer(buoys[ord[3]].x, buoys[ord[3]].z, 0), 1500);
        }
      },
      giverAct() {
        const s = Q("lighthouse");
        if (s.st !== "active" || s.step > 1) return null;
        return { label: "watch the lighthouse blink 🏮", act: () => {
          const ord = order();
          s.data.hit = [];
          s.step = 1;
          save();
          openCard(`<div class="card"><h3>🏮 The Lighthouse Winks…</h3><p style="font:15px Georgia">Out on its island, the great lamp turns — and flashes four colors, slow and deliberate, like a wink:</p>
            <div style="font-size:44px;text-align:center;letter-spacing:12px">${ord.map((i) => COLS[i][1]).join("")}</div>
            <p style="font:14px Georgia">Swim (or raft!) through the glowing buoys in that order. You've got 80 seconds before the lamp goes dark.</p><div class="close">Esc — GO!</div></div>`);
          startTimer(80, "🏮 The lamp fades in");
        } };
      },
      interact() {
        if (here() !== "reedmere") return null;
        const s = Q("lighthouse");
        if (s.st === "active" && s.step === 2 && near(SHRINE.x, SHRINE.z, 3.5)) return { label: "touch the sunken shrine ✨", act: () => complete("lighthouse", [{ dur: 4, from: [SHRINE.x + 8, 5, SHRINE.z + 8], look: [0, 6, 0], text: "The shrine glows — and out on its island, the Lighthouse of Reeds blazes every color at once. Somewhere, a hundred torch-bearing mice from long ago would be proud." }]) };
        return null;
      },
      update(dt, t) {
        if (here() !== "reedmere") return;
        const s = Q("lighthouse");
        const ord = order();
        const hit = s.data.hit || [];
        buoys.forEach((b, i) => {
          b.g.visible = s.st === "active" && s.step === 1;
          b.g.position.y = 0.3 + Math.sin(t * 2 + i) * 0.12;
          b.g.children[0].material.emissiveIntensity = hit.includes(i) ? 1.2 : 0.5;
        });
        // the lamp shows the color you need next
        const L = ctx.city().props.light;
        if (L && s.st === "active" && s.step === 1) {
          const want = COLS[ord[hit.length]];
          if (want && L.beamLight) L.beamLight.color.setHex(want[0]);
        }
        if (s.st === "active" && s.step === 1) {
          for (const i of ord) {
            const b = buoys[i];
            if (!hit.includes(i) && near(b.x, b.z, 2.4)) {
              if (ord[hit.length] === i) {
                hit.push(i);
                s.data.hit = hit;
                ctx.chime();
                if (hit.length === 4) {
                  s.step = 2;
                  timerEnd = 0;
                  ctx.say("🏮 The lamp flashes GOLD! Will-o'-wisps rise from the water… follow them!", true);
                } else ctx.say(`🏮 ${hit.map((k) => COLS[k][1]).join("")} — next!`);
                save();
              } else if (!b.warned || t - b.warned > 2) {
                b.warned = t;
                ctx.say(`🏮 Not that one yet! The order is ${ord.map((k) => COLS[k][1]).join("")}`);
              }
            }
          }
          // (just swam the last buoy? then you've WON — don't check the clock)
          if (s.step !== 1) return;
          const left = timeLeft();
          hud(`${timerLabel} ${left.toFixed(0)}s · ${ord.map((k) => (hit.includes(k) ? "✓" : COLS[k][1])).join(" ")}`);
          if (left <= 0) {
            s.step = 0;
            s.data.hit = [];
            delete s.data.order;
            timerEnd = 0;
            save();
            ctx.say("🏮 The lamp goes dark. Ask Old Wick to watch it again!", true);
          }
        }
        wisps.forEach((w, i) => {
          w.visible = s.st === "active" && s.step === 2;
          const k = ((t * 0.25 + i / 3) % 1);
          const fx = lerp(me().x, SHRINE.x, k);
          const fz = lerp(me().z, SHRINE.z, k);
          w.position.set(fx + Math.sin(t * 3 + i) * 0.6, 1.4 + Math.sin(t * 4 + i * 2) * 0.4, fz);
        });
        if (shrine) shrine.visible = s.st !== "new" && s.step >= 2;
      },
    };
  }

  // ---------------------------------------------------------------- 🦉 CANOPY (Everbough)
  // Sneak round the owl's garden at the foot of the Highcanopy for four of
  // her feathers — stay OUT of her searching gaze — then she lets you climb.
  {
    const TREE = { x: 90, z: 30 };
    let feathers = [];
    let built = false;
    let gaze = null;
    let caughtCool = 0;
    const gotN = () => Object.keys(Q("canopy").data.got || {}).length;
    IMPL.canopy = {
      target() {
        if (ctx.world() !== "everbough") return null;
        const s = Q("canopy");
        const f = feathers.find((x, i) => !(s.data.got || {})[i]);
        if (f) return { x: f.x, z: f.z };
        const dy = ctx.deckY("canopy");
        return isFinite(dy) ? { x: TREE.x, z: TREE.z, y: dy } : null;
      },
      build() {
        if (built || !ctx.cityBuilt()) return;
        built = true;
        // four feathers on the GROUND round the tree — clear of the trunk
        // (it's solid!) and of anything else in the way
        const cols = ctx.cityCols ? ctx.cityCols() : [];
        const spots = [];
        for (let k = 0; k < 40 && spots.length < 4; k++) {
          const a = 0.6 + k * 1.618;
          const r = 12 + (k % 3) * 2;
          const x = TREE.x + Math.cos(a) * r;
          const z = TREE.z + Math.sin(a) * r;
          if (cols.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 1.5)) continue;
          if (spots.some((p) => Math.hypot(x - p.x, z - p.z) < 7)) continue;
          spots.push({ x, z });
        }
        feathers = spots.map((p) => {
          const g = new THREE.Group();
          const f = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1, 4), M(0xe8d8b0, { emissive: 0x8a7a4a, emissiveIntensity: 0.5 }));
          f.rotation.z = 0.5;
          g.add(f, glow(0xffe8b0, 2));
          const y = ctx.cityHeight(p.x, p.z) + 0.7;
          g.position.set(p.x, y, p.z);
          ctx.cityGroup.add(g);
          return { ...p, y, g };
        });
        // the owl's searching gaze: a moving pool of moonlight on the ground
        gaze = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CircleGeometry(3, 24), B(0xd8e8ff, { transparent: true, opacity: 0.4, depthWrite: false }));
        disc.rotation.x = -Math.PI / 2;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 16, 16, 1, true), B(0xd8e8ff, { transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
        cone.position.y = 8;
        gaze.add(disc, cone);
        gaze.visible = false;
        ctx.cityGroup.add(gaze);
      },
      interact() {
        if (ctx.world() !== "everbough") return null;
        const s = Q("canopy");
        if (s.st !== "active") return null;
        for (let i = 0; i < feathers.length; i++) {
          const f = feathers[i];
          if ((s.data.got || {})[i] || !near(f.x, f.z, 2.4)) continue;
          return { label: "pick up the owl feather 🪶", act: () => {
            (s.data.got ||= {})[i] = true;
            f.g.visible = false;
            save();
            ctx.chime();
            const n = gotN();
            if (n >= 4) {
              s.step = 1;
              save();
              ctx.say("🦉 “Hoo… four of my feathers, and I never saw you once.” The owl closes her eyes — CLIMB the great trunk to the Highcanopy (walk into it and hold W · Climbing Spikes help!)", true);
            } else ctx.say(`🪶 An owl feather (${n}/4)! Keep out of the light…`);
          } };
        }
        return null;
      },
      update(dt, t) {
        if (ctx.world() !== "everbough") return;
        const s = Q("canopy");
        feathers.forEach((f, i) => {
          f.g.visible = s.st === "active" && !(s.data.got || {})[i];
          f.g.rotation.y = t * 1.5;
        });
        if (!gaze) return;
        const p = me();
        const n = gotN();
        const inGarden = Math.hypot(p.x - TREE.x, p.z - TREE.z) < 22;
        // she only watches the ground, and only until you have all four
        gaze.visible = s.st === "active" && n < 4 && Math.hypot(p.x - TREE.x, p.z - TREE.z) < 40;
        if (gaze.visible) {
          const a = t * 0.5;
          const gx = TREE.x + Math.sin(a) * 13;
          const gz = TREE.z + Math.sin(a * 2) * 10;
          gaze.position.set(gx, ctx.cityHeight(gx, gz) + 0.06, gz);
          caughtCool -= dt;
          const onGround = p.y < ctx.cityHeight(p.x, p.z) + 1.5;
          if (inGarden) hud(`🦉 Stay out of the owl's light! · feathers ${n}/4`);
          if (onGround && caughtCool <= 0 && !(window.__wwCalm && window.__wwCalm()) && Math.hypot(p.x - gx, p.z - gz) < 3) {
            caughtCool = 3;
            ctx.say("🦉 “HOO goes there?” The owl's gaze finds you — and a gust of wingbeats sweeps you out of her garden! (You keep your feathers.)", true);
            const g = def("canopy").giver.at;
            ctx.placePlayer(g.x + 2, g.z + 2, 0);
            fadeThrough(() => {}, 0.3);
          }
        }
        // made it to the top!
        const dy = ctx.deckY("canopy");
        if (s.st === "active" && n >= 4 && isFinite(dy) && p.y > dy - 0.8 && Math.hypot(p.x - TREE.x, p.z - TREE.z) < 14) {
          s.step = 2;
          complete("canopy", [{ dur: 4, from: [TREE.x + 14, dy + 6, TREE.z + 14], look: [TREE.x, dy + 1, TREE.z], who: "The great barn owl", text: "“Hoo… quiet as moss, and just as clever. Keep my feathers, little climber. Wear them well.”" }]);
        }
      },
    };
  }

  // ---------------------------------------------------------------- ❄️ WHISPERS (Frostpine)
  {
    const LINES = ["“…I was a Warden once. I kept the fire on the third peak…”", "“…the snow remembers every footprint…”", "“…Renata laughed when the wind took her hat…”", "“…we carved the Hall by lantern light, forty winters long…”", "“…listen to the ice. It's singing…”", "“…someone will come back for us. Someone always does…”", "“…tell them we were brave…”"];
    let wisps = [];
    let builtC = null;
    IMPL.whispers = {
      target() {
        if (here() !== "frostpine") return null;
        const s = Q("whispers");
        const n = Object.keys(s.data.got || {}).length;
        if (n >= 7) return givers.whispers ? givers.whispers.at : null;
        let best = null;
        let bd = Infinity;
        wisps.forEach((w, i) => {
          if ((s.data.got || {})[i]) return;
          const d = Math.hypot(w.x - me().x, w.z - me().z);
          if (d < bd) { bd = d; best = w; }
        });
        return best ? { x: best.x, z: best.z } : null;
      },
      build(c) {
        if (builtC === c) return;
        builtC = c;
        wisps = LINES.map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + 0.3;
          const at = landSpot(c, Math.cos(a) * (40 + (i % 3) * 14), Math.sin(a) * (40 + (i % 3) * 14));
          const g = new THREE.Group();
          g.add(glow(0x9fd8ff, 2.2), glow(0xffffff, 0.8));
          g.visible = false;
          c.group.add(g);
          return { ...at, g, vx: 0, vz: 0 };
        });
      },
      giverAct() {
        const s = Q("whispers");
        if (s.st !== "active" || Object.keys(s.data.got || {}).length < 7) return null;
        return { label: "give the seven whispers to Keeper Hollis ❄️", act: () => complete("whispers", [{ dur: 4, from: () => [me().x + 3, me().y + 2, me().z + 3], look: () => [me().x, me().y + 1, me().z], who: "Keeper Hollis", text: "“Seven voices, home again. The Ice That Remembers will sing a little louder tonight. Here — a charm, so it remembers YOU.”" }]) };
      },
      interact() {
        if (here() !== "frostpine") return null;
        const s = Q("whispers");
        if (s.st !== "active") return null;
        for (let i = 0; i < wisps.length; i++) {
          const w = wisps[i];
          if ((s.data.got || {})[i] || !near(w.x, w.z, 2)) continue;
          return { label: "cup the frozen whisper in your paws ❄️", act: () => {
            (s.data.got ||= {})[i] = true;
            save();
            ctx.chime();
            const n = Object.keys(s.data.got).length;
            ctx.say(`❄️ (${n}/7) ${LINES[i]}${n >= 7 ? " — bring them to Keeper Hollis!" : ""}`, true);
          } };
        }
        return null;
      },
      update(dt, t) {
        if (here() !== "frostpine") return;
        const s = Q("whispers");
        const c = ctx.city();
        wisps.forEach((w, i) => {
          const caught = (s.data.got || {})[i];
          w.g.visible = s.st === "active" && !caught;
          if (!w.g.visible) return;
          // shy: they dart away if you come close (but tire near walls)
          const dx = w.x - me().x;
          const dz = w.z - me().z;
          const d = Math.hypot(dx, dz) || 1;
          if (d < 8 && d > 1.8) {
            w.vx += (dx / d) * 30 * dt + Math.sin(t * 3 + i) * 10 * dt;
            w.vz += (dz / d) * 30 * dt + Math.cos(t * 3 + i) * 10 * dt;
          }
          const sp = Math.hypot(w.vx, w.vz);
          const max = 11;
          if (sp > max) {
            w.vx *= max / sp;
            w.vz *= max / sp;
          }
          w.vx *= 1 - dt * 1.5;
          w.vz *= 1 - dt * 1.5;
          const p = { x: w.x + w.vx * dt, z: w.z + w.vz * dt, y: 0 };
          c.constrain(p);
          w.x = p.x;
          w.z = p.z;
          w.g.position.set(w.x, c.height(w.x, w.z) + 1.4 + Math.sin(t * 2 + i) * 0.3, w.z);
        });
      },
    };
  }

  // ---------------------------------------------------------------- ✨ STAR CHART (Silverveil)
  {
    const STONES = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      return { x: Math.cos(a) * 30, z: Math.sin(a) * 30 };
    });
    const ORDER = [6, 1, 4, 8, 3]; // the Lantern-Bearer
    let built = null;
    let stones = [];
    IMPL.stars = {
      target() {
        if (here() !== "silverveil") return null;
        const s = Q("stars");
        if (s.step === 1) {
          const k = (s.data.walked || []).length;
          return stones[ORDER[k]] || null;
        }
        return null;
      },
      build(c) {
        if (built === c) return;
        built = c;
        stones = STONES.map((sp, i) => {
          const g = new THREE.Group();
          const y = c.height(sp.x, sp.z);
          g.position.set(sp.x, y, sp.z);
          const slab = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.3, 8), M(0x8a8ab0, { emissive: 0x3a3a6a, emissiveIntensity: 0.4 }));
          slab.position.y = 0.15;
          const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), B(0xe8f0ff));
          star.position.y = 0.6;
          const h = glow(0xbfd8ff, 2.6);
          h.position.y = 0.6;
          g.add(slab, star, h);
          c.group.add(g);
          return { ...sp, g, slab, star, h, on: false };
        });
      },
      giverAct() {
        const s = Q("stars");
        if (s.st !== "active" || s.step > 1) return null;
        return { label: "read the star chart ✨", act: () => {
          // the chart: the nine stones as dots, the constellation drawn on top
          const P = (i) => [100 + STONES[i].x * 2.6, 100 + STONES[i].z * 2.6];
          const svg = `<svg viewBox="0 0 200 200" width="240" height="240" style="background:#141a3a;border-radius:50%">
            <circle cx="100" cy="100" r="38" fill="#3a4a8a" opacity=".5"/>
            ${STONES.map((_, i) => `<circle cx="${P(i)[0]}" cy="${P(i)[1]}" r="5" fill="#8a8ab0"/>`).join("")}
            <polyline points="${ORDER.map((i) => P(i).join(",")).join(" ")}" fill="none" stroke="#ffe08a" stroke-width="2" stroke-dasharray="4 3"/>
            ${ORDER.map((i, k) => `<circle cx="${P(i)[0]}" cy="${P(i)[1]}" r="9" fill="#ffe08a"/><text x="${P(i)[0]}" y="${P(i)[1] + 4}" font-size="11" text-anchor="middle" font-weight="bold">${k + 1}</text>`).join("")}
            <text x="100" y="104" font-size="9" fill="#cfe0ff" text-anchor="middle">moon-pool</text></svg>`;
          openCard(`<div class="card" style="background:#1e2448;color:#e8ecff"><h3 style="color:#ffe08a">✨ The Lantern-Bearer</h3>
            <p style="font:14px Georgia">The chart shows the star-stones round the moon-pool (north is up — the observatory). Walk her stars in order: <b>1 → 5</b>. Step on a wrong stone and they all go dark. You have 70 seconds once you start.</p>
            <div style="text-align:center">${svg}</div><div class="close">Esc — go</div></div>`);
          s.step = 1;
          s.data.walked = [];
          save();
        } };
      },
      update(dt, t) {
        if (here() !== "silverveil") return;
        const s = Q("stars");
        const walked = s.data.walked || [];
        stones.forEach((st, i) => {
          const lit = walked.includes(i) || s.st === "done";
          st.star.material.color.setHex(lit ? 0xffe08a : 0xe8f0ff);
          st.h.material.color.setHex(lit ? 0xffe08a : 0xbfd8ff);
          st.star.rotation.y = t * 2;
          st.star.position.y = 0.6 + Math.sin(t * 2 + i) * 0.1;
        });
        if (s.st !== "active" || s.step !== 1) return;
        for (let i = 0; i < stones.length; i++) {
          const st = stones[i];
          const on = near(st.x, st.z, 1.5);
          if (on && !st.on) {
            if (walked.includes(i)) continue;
            if (ORDER[walked.length] === i) {
              if (!walked.length) startTimer(70, "✨ The stars fade in");
              walked.push(i);
              s.data.walked = walked;
              ctx.chime();
              if (walked.length === ORDER.length) {
                s.step = 2;
                timerEnd = 0;
                save();
                complete("stars", [
                  { dur: 4, from: [0, 40, 60], look: [0, 0, 0], text: "The five stones blaze — and in the moon-pool, the Lantern-Bearer appears, drawn in starlight. A moth made of moonlight flutters up out of the water and lands on your paw." },
                ]);
                break;
              }
              save();
              ctx.say(`✨ Star ${walked.length}/5!`);
            } else {
              s.data.walked = [];
              timerEnd = 0;
              save();
              ctx.say("✨ That star isn't hers — the stones go dark. Start again from star 1! (ask Lumen for the chart)", true);
            }
          }
          st.on = on;
        }
        if (walked.length && timerEnd) {
          const left = timeLeft();
          hud(`${timerLabel} ${left.toFixed(0)}s · star ${walked.length}/5`);
          if (left <= 0) {
            s.data.walked = [];
            timerEnd = 0;
            save();
            ctx.say("✨ The stars fade… try again from star 1!", true);
          }
        }
      },
    };
  }

  // ---------------------------------------------------------------- 🗺️ PIP'S LAST MAP (the forest)
  {
    let camps = null;
    let mapPin = null;
    const NOTES = [
      "“Day 1. Camped by the creek bridge. The water talks if you listen. Heading for the giants' summer camp — they leave the BEST crumbs.” →",
      "“Day 4. The giants' campsite. Found a button the size of my head! Next: the old log school, to borrow a map.” →",
      "“Day 9. The school. Headmaster's grandmother let me sleep in the bell tower. Tomorrow — the Hollow. The journals all end there. I have to know why.” →",
      "“Day 12. Moonstone Hollow. They didn't vanish. They went DEEPER. I'm going after them. If you find this — my satchel's yours. Be brave. — Pip”",
    ];
    function campSpots() {
      const s = ctx.school ? ctx.school() : null;
      const list = [
        ctx.creekBridge && ctx.creekBridge.ready ? { x: ctx.creekBridge.x + 8, z: ctx.creekBridge.z + 5 } : null,
        ctx.campsite && ctx.campsite.ready ? { x: ctx.campsite.x + 7, z: ctx.campsite.z - 6 } : null,
        s ? { x: s.x - 9, z: s.z + 7 } : null,
        ctx.hollow ? { x: ctx.hollow.x - 5, z: ctx.hollow.z + 3 } : null,
      ];
      if (list.some((x) => !x)) return null;
      // (nudge each onto dry ground)
      return list.map((p) => {
        for (let r = 0; r < 20; r += 1.5) for (let a = 0; a < 6.3; a += 0.7) {
          const x = p.x + Math.cos(a) * r;
          const z = p.z + Math.sin(a) * r;
          if (!ctx.isWater(x, z)) return { x, z };
        }
        return p;
      });
    }
    function buildCamps() {
      if (camps) return;
      const spots = campSpots();
      if (!spots) return;
      camps = spots.map((sp) => {
        const g = new THREE.Group();
        g.position.set(sp.x, ctx.terrainHeight(sp.x, sp.z), sp.z);
        const tent = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 4), M(0xb8784a));
        tent.position.y = 0.7;
        tent.rotation.y = Math.PI / 4;
        const lamp = glow(0xffd890, 2.4);
        lamp.position.set(1.2, 0.8, 0.4);
        const note = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), B(0xf4ecd8, { side: THREE.DoubleSide }));
        note.position.set(0.7, 0.6, 0.9);
        g.add(tent, lamp, note);
        g.visible = false;
        ctx.outsideGroup.add(g);
        return { ...sp, g };
      });
      // the torn map on the reading rock
      const J = ctx.journalPos;
      mapPin = { x: J.x + 3.5, z: J.z - 1 };
      const m = new THREE.Group();
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), B(0xe8d8b0, { side: THREE.DoubleSide }));
      paper.rotation.x = -Math.PI / 2.4;
      m.add(paper, glow(0xffe08a, 1.6));
      m.position.set(mapPin.x, ctx.terrainHeight(mapPin.x, mapPin.z) + 0.6, mapPin.z);
      ctx.outsideGroup.add(m);
      mapPin.g = m;
    }
    IMPL.pip = {
      target() {
        if (ctx.world() !== "outside" || !camps) return null;
        const s = Q("pip");
        if (s.st === "new") return null;
        const n = s.data.n || 0;
        return camps[Math.min(n, 3)];
      },
      interact() {
        if (ctx.world() !== "outside") return null;
        buildCamps();
        if (!camps) return null;
        const s = Q("pip");
        if (s.st === "new" && mapPin && near(mapPin.x, mapPin.z, 2)) return { label: "look at the torn map 🗺️", act: () => offerCard(def("pip")) };
        if (s.st !== "active") return null;
        const n = s.data.n || 0;
        const c = camps[n];
        if (c && near(c.x, c.z, 2.6)) {
          if (n < 3) return { label: "read Pip's note 📜", act: () => {
            s.data.n = n + 1;
            save();
            ctx.chime();
            ctx.say(`📜 ${NOTES[n]}`, true);
          } };
          return { label: "open Pip's satchel 🎒", act: () => complete("pip", [{ dur: 4.4, from: () => [me().x + 3, me().y + 2, me().z + 3], look: () => [me().x, me().y + 0.5, me().z], who: "Pip's last note", text: NOTES[3] }]) };
        }
        return null;
      },
      update() {
        if (ctx.world() !== "outside") return;
        buildCamps();
        if (!camps) return;
        const s = Q("pip");
        const n = s.data.n || 0;
        camps.forEach((c, i) => (c.g.visible = s.st === "active" ? i <= n : s.st === "done"));
        if (mapPin) mapPin.g.visible = s.st === "new";
      },
    };
  }

  // ======================================================================
  //  the GENERATED quests (volume 2+): one engine, six kinds of challenge
  // ======================================================================
  /** where a generated quest's city is (only while you're standing in it) */
  function worldFor(city) {
    if (city === "everbough") {
      if (ctx.world() !== "everbough" || !ctx.cityBuilt()) return null;
      const cols = ctx.cityCols ? ctx.cityCols() : [];
      return {
        group: ctx.cityGroup,
        H: ctx.cityHeight,
        R: 100,
        free: (x, z) => Math.hypot(x, z) < 100 && !cols.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 1.3),
        constrain: (p) => {
          const d = Math.hypot(p.x, p.z);
          if (d > 100) {
            p.x *= 100 / d;
            p.z *= 100 / d;
          }
        },
      };
    }
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || c.id !== city) return null;
    return {
      group: c.group,
      H: c.height,
      R: c.R * 0.78,
      free: (x, z) => Math.hypot(x, z) < c.R * 0.78 && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 1.3),
      constrain: (p) => c.constrain(p),
    };
  }
  function makeGenQuest(q) {
    const P = q.P;
    let W = null; // the city (while you're in it)
    let run = null; // the challenge in progress: { objs, … }
    const s = () => Q(q.id);
    const R = () => run.rnd();
    const spot = (cx, cz, rMin, rMax) => {
      for (let i = 0; i < 80; i++) {
        const a = R() * Math.PI * 2;
        const r = rMin + R() * (rMax - rMin);
        const x = cx + Math.cos(a) * r;
        const z = cz + Math.sin(a) * r;
        if (W.free(x, z)) return { x, z };
      }
      return { x: cx + rMin, z: cz };
    };
    const addObj = (o) => {
      W.group.add(o);
      run.objs.push(o);
      return o;
    };
    function orb(x, z, color, size = 0.35, pillar = true) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), B(color)), glow(color, size * 7));
      if (pillar) {
        const p = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.25, 26, 8, 1, true),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
        );
        p.position.y = 13;
        g.add(p);
      }
      g.position.set(x, W.H(x, z) + 1, z);
      return addObj(g);
    }
    function symbolSprite(ch) {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 96;
      const c = cv.getContext("2d");
      c.font = "72px serif";
      c.textAlign = "center";
      c.fillText(ch, 48, 74);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
      sp.scale.setScalar(1.6);
      return sp;
    }
    function cleanup() {
      if (run) for (const o of run.objs) o.parent && o.parent.remove(o);
      run = null;
      timerEnd = 0;
    }
    function fail(msg) {
      cleanup();
      s().step = 0;
      save();
      ctx.say(`${q.icon} ${msg} Talk to ${q.giver.name} to try again!`, true);
    }
    function win() {
      cleanup();
      s().step = 2;
      complete(q.id, [{ dur: 3.4, from: () => [me().x + 3, me().y + 2.5, me().z + 3], look: () => [me().x, me().y + 0.6, me().z], who: q.giver.name, text: `“You did it! ${q.name} — they'll be talking about this for ages!”` }]);
    }
    // ---------- starting the challenge ----------
    function start() {
      W = worldFor(q.city);
      if (!W) return;
      cleanup();
      const g = givers[q.id];
      const home = g ? g.at : { x: 0, z: 0 };
      run = { objs: [], rnd: rng(hashStr(q.id) + Date.now()), t0: performance.now(), home };
      const k = q.kind;
      if (k === "collect") {
        run.items = [];
        for (let i = 0; i < P.n; i++) {
          const p = spot(0, 0, 14, W.R);
          run.items.push({ ...p, o: orb(p.x, p.z, q.color), got: false });
        }
        startTimer(P.time, `${q.icon} Time left:`);
      } else if (k === "sequence") {
        const SYM = ["🌙", "⭐", "🍄", "🌸", "🍀", "🔔", "💎", "🐚", "🍁", "❄️", "🔥", "🌊"].sort(() => R() - 0.5);
        run.marks = [];
        const n = P.len + 3;
        for (let i = 0; i < n; i++) {
          const p = spot(home.x, home.z, 7, 26);
          const g2 = new THREE.Group();
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 16), M(q.color, { emissive: q.color, emissiveIntensity: 0.25 }));
          disc.position.y = 0.06;
          const sym = symbolSprite(SYM[i]);
          sym.position.y = 2;
          g2.add(disc, sym);
          g2.position.set(p.x, W.H(p.x, p.z), p.z);
          addObj(g2);
          run.marks.push({ ...p, sym: SYM[i], disc, on: false });
        }
        run.order = run.marks.map((_, i) => i).sort(() => R() - 0.5).slice(0, P.len);
        run.k = 0;
        openCard(`<div class="card"><h3>${q.icon} ${q.name}</h3><p style="font:15px Georgia">Remember this order — I'll only show it once!</p>
          <div style="font-size:40px;text-align:center;letter-spacing:8px">${run.order.map((i) => run.marks[i].sym).join("")}</div>
          <p style="font:13px system-ui;text-align:center">Step on the markers in that order · ${P.time}s · a wrong step resets you</p><div class="close">Esc — GO!</div></div>`);
        startTimer(P.time, `${q.icon} Time left:`);
      } else if (k === "chase") {
        const g2 = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M(q.color, { emissive: q.color, emissiveIntensity: 0.35 }));
        body.scale.set(1, 0.8, 1.3);
        const ears = [-1, 1].map((sx) => {
          const e = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5), M(q.color));
          e.position.set(sx * 0.18, 0.45, 0.3);
          return e;
        });
        g2.add(body, ...ears, glow(q.color, 3));
        addObj(g2);
        run.guide = { g: g2, x: me().x + 4, z: me().z + 4, path: [] };
        let px = run.guide.x;
        let pz = run.guide.z;
        for (let i = 0; i < 60; i++) {
          const p = spot(px, pz, 14, 30);
          run.guide.path.push(p);
          px = p.x;
          pz = p.z;
        }
        run.guide.i = 0;
        run.lost = 0;
        startTimer(P.dur, `${q.icon} Keep up for:`);
      } else if (k === "catch") {
        run.items = [];
        for (let i = 0; i < P.n; i++) {
          const p = spot(home.x, home.z, 10, 45);
          run.items.push({ ...p, o: orb(p.x, p.z, q.color, 0.3, false), got: false, vx: 0, vz: 0 });
        }
        startTimer(P.time, `${q.icon} Time left:`);
      } else if (k === "delivery") {
        run.drops = [];
        let px = home.x;
        let pz = home.z;
        let total = 0;
        for (let i = 0; i < P.k; i++) {
          const p = spot(px, pz, 30, 60);
          total += Math.hypot(p.x - px, p.z - pz);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2, 0.12, 6, 28), B(q.color));
          ring.rotation.x = Math.PI / 2;
          ring.position.set(p.x, W.H(p.x, p.z) + 0.2, p.z);
          addObj(ring);
          run.drops.push({ ...p, ring });
          px = p.x;
          pz = p.z;
        }
        run.k = 0;
        startTimer(total / P.pace + 6, `${q.icon} Deliver in:`);
      } else if (k === "stealth") {
        const c0 = spot(home.x, home.z, 30, 45);
        run.arena = c0;
        run.items = [];
        for (let i = 0; i < P.n; i++) {
          const p = spot(c0.x, c0.z, 4, 22);
          run.items.push({ ...p, o: orb(p.x, p.z, q.color, 0.28, false), got: false });
        }
        run.gazes = [];
        for (let i = 0; i < P.gazes; i++) {
          const gz = new THREE.Group();
          const disc = new THREE.Mesh(new THREE.CircleGeometry(3, 24), B(0xd8e8ff, { transparent: true, opacity: 0.4, depthWrite: false }));
          disc.rotation.x = -Math.PI / 2;
          const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 16, 16, 1, true), B(0xd8e8ff, { transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
          cone.position.y = 8;
          gz.add(disc, cone);
          addObj(gz);
          run.gazes.push({ g: gz, ph: i * 2.1 + R() * 3, ax: 14 + R() * 8, az: 10 + R() * 8 });
        }
        run.cool = 0;
      }
      s().step = 1;
      save();
      ctx.chime();
    }
    // ---------- each frame ----------
    function update(dt, t) {
      const st = s();
      if (st.st !== "active") return;
      W = worldFor(q.city);
      if (st.step === 1 && !run) {
        // (a challenge left half-done when the game closed: start fresh)
        st.step = 0;
        save();
        return;
      }
      if (!run) return;
      if (!W) return fail("You left in the middle of the challenge!");
      const p = me();
      const left = timerEnd ? timeLeft() : Infinity;
      const k = q.kind;
      if (k === "collect") {
        for (const it of run.items) {
          if (it.got) continue;
          it.o.position.y = W.H(it.x, it.z) + 1 + Math.sin(t * 2 + it.x) * 0.2;
          if (Math.hypot(p.x - it.x, p.z - it.z) < 1.9 && Math.abs(p.y - it.o.position.y) < 3) {
            it.got = true;
            it.o.visible = false;
            ctx.chime();
          }
        }
        const n = run.items.filter((i) => i.got).length;
        hud(`${q.icon} ${n}/${P.n} ${q.thing} · ${Math.ceil(left)}s`);
        if (n >= P.n) return win();
      } else if (k === "sequence") {
        for (let i = 0; i < run.marks.length; i++) {
          const m = run.marks[i];
          const on = Math.hypot(p.x - m.x, p.z - m.z) < 1.4;
          if (on && !m.on) {
            if (run.order[run.k] === i) {
              run.k++;
              m.disc.material.emissiveIntensity = 1.2;
              ctx.chime();
              if (run.k >= run.order.length) return win();
            } else if (!run.order.slice(0, run.k).includes(i)) {
              run.k = 0;
              run.marks.forEach((x) => (x.disc.material.emissiveIntensity = 0.25));
              ctx.say(`${q.icon} Wrong one! Back to the start of the order…`);
            }
          }
          m.on = on;
        }
        hud(`${q.icon} ${run.k}/${run.order.length} in order · ${Math.ceil(left)}s`);
      } else if (k === "chase") {
        const G = run.guide;
        const tgt = G.path[Math.min(G.i, G.path.length - 1)];
        const d = Math.hypot(tgt.x - G.x, tgt.z - G.z);
        if (d < 0.6) G.i = Math.min(G.i + 1, G.path.length - 1);
        else {
          G.x += ((tgt.x - G.x) / d) * Math.min(d, P.speed * dt);
          G.z += ((tgt.z - G.z) / d) * Math.min(d, P.speed * dt);
          G.g.rotation.y = Math.atan2(tgt.x - G.x, tgt.z - G.z);
        }
        G.g.position.set(G.x, W.H(G.x, G.z) + 0.6 + Math.abs(Math.sin(t * 9)) * 0.35, G.z);
        const gap = Math.hypot(p.x - G.x, p.z - G.z);
        run.lost = gap > 22 ? run.lost + dt : 0;
        hud(`${q.icon} ${gap > 16 ? "⚠️ FALLING BEHIND! " : ""}Keep up with ${q.thing} · ${Math.ceil(left)}s`);
        if (run.lost > 2.5) return fail(`You lost ${q.thing}!`);
        if (left <= 0) return win();
        return;
      } else if (k === "catch") {
        for (const it of run.items) {
          if (it.got) continue;
          const dx = it.x - p.x;
          const dz = it.z - p.z;
          const d = Math.hypot(dx, dz) || 1;
          if (d < 9) {
            it.vx += (dx / d) * 34 * dt + Math.sin(t * 4 + it.x) * 14 * dt;
            it.vz += (dz / d) * 34 * dt + Math.cos(t * 4 + it.z) * 14 * dt;
          }
          const sp = Math.hypot(it.vx, it.vz);
          if (sp > P.flee) {
            it.vx *= P.flee / sp;
            it.vz *= P.flee / sp;
          }
          it.vx *= 1 - dt * 1.6;
          it.vz *= 1 - dt * 1.6;
          const np = { x: it.x + it.vx * dt, z: it.z + it.vz * dt, y: 0 };
          W.constrain(np);
          it.x = np.x;
          it.z = np.z;
          it.o.position.set(it.x, W.H(it.x, it.z) + 0.6 + Math.abs(Math.sin(t * 7 + it.x)) * 0.4, it.z);
          if (Math.hypot(p.x - it.x, p.z - it.z) < 1.7) {
            it.got = true;
            it.o.visible = false;
            ctx.chime();
          }
        }
        const n = run.items.filter((i) => i.got).length;
        hud(`${q.icon} caught ${n}/${P.n} ${q.thing} · ${Math.ceil(left)}s`);
        if (n >= P.n) return win();
      } else if (k === "delivery") {
        run.drops.forEach((dr, i) => (dr.ring.visible = i >= run.k));
        const dr = run.drops[run.k];
        if (dr && Math.hypot(p.x - dr.x, p.z - dr.z) < 2.6) {
          run.k++;
          ctx.chime();
          if (run.k >= run.drops.length) return win();
          ctx.say(`${q.icon} Delivered! ${run.drops.length - run.k} to go!`);
        }
        hud(`${q.icon} ${run.k}/${run.drops.length} delivered · ${Math.ceil(left)}s`);
      } else if (k === "stealth") {
        run.cool -= dt;
        for (const gz of run.gazes) {
          const a = t * P.speed + gz.ph;
          gz.x = run.arena.x + Math.sin(a) * gz.ax;
          gz.z = run.arena.z + Math.sin(a * 2 + gz.ph) * gz.az;
          gz.g.position.set(gz.x, W.H(gz.x, gz.z) + 0.06, gz.z);
          if (run.cool <= 0 && Math.hypot(p.x - gz.x, p.z - gz.z) < 3 && p.y < W.H(p.x, p.z) + 1.5) {
            run.cool = 2.5;
            ctx.say(`${q.icon} SPOTTED! Back to the edge you go… (you keep what you've gathered)`, true);
            const dx = run.home.x - run.arena.x;
            const dz = run.home.z - run.arena.z;
            const dd = Math.hypot(dx, dz) || 1;
            ctx.placePlayer(run.arena.x + (dx / dd) * 30, run.arena.z + (dz / dd) * 30, Math.atan2(-dx, -dz));
            fadeThrough(() => {}, 0.25);
          }
        }
        for (const it of run.items) {
          if (it.got) continue;
          it.o.position.y = W.H(it.x, it.z) + 0.7 + Math.sin(t * 2 + it.x) * 0.15;
          if (Math.hypot(p.x - it.x, p.z - it.z) < 1.8) {
            it.got = true;
            it.o.visible = false;
            ctx.chime();
          }
        }
        const n = run.items.filter((i) => i.got).length;
        hud(`${q.icon} ${n}/${P.n} ${q.thing} — stay out of the light!`);
        if (n >= P.n) return win();
        return;
      }
      if (left <= 0) fail("Time's up!");
    }
    return {
      noBeacon: () => s().step === 1 && q.kind !== "delivery",
      target() {
        if (s().step !== 1 || !run) return null;
        if (q.kind === "delivery") {
          const dr = run.drops[run.k];
          return dr ? { x: dr.x, z: dr.z } : null;
        }
        if (q.kind === "stealth") return run.arena;
        return null;
      },
      giverAct() {
        const st = s();
        if (st.st !== "active" || st.step !== 0) return null;
        return { label: `start the challenge — ${q.name} ${q.icon}`, act: () => {
          openCard(`<div class="card"><h3>${q.icon} ${q.name}</h3><div class="coins">${q.giver.name} · ${"★".repeat(q.stars)}${"☆".repeat(5 - q.stars)}</div>
            <p style="font:15px Georgia;line-height:1.45">${q.steps[1]}</p>
            <div style="text-align:center;margin-top:10px"><button id="qgo" style="font:bold 16px system-ui;padding:8px 20px">Ready… GO!</button></div><div class="close">Esc — not yet</div></div>`,
            (el) => {
              el.querySelector("#qgo").onclick = () => {
                closeCard();
                start();
              };
              if (new URLSearchParams(location.search).get("qaccept")) setTimeout(() => el.querySelector("#qgo").click(), 800); // (test)
            });
        } };
      },
      update,
      cleanup,
      progress: () => (s().step === 1 ? "▶ challenge in progress!" : ""),
    };
  }

  // ---------------------------------------------------------------- ⚔️ the Quest Tracker (left side)
  const trackEl = document.createElement("div");
  trackEl.id = "quest-tracker";
  trackEl.style.cssText = "position:fixed;left:16px;bottom:120px;z-index:39;width:340px;padding:10px 14px;border-radius:14px;background:rgba(36,26,14,.82);color:#fff3d8;font:13px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.35);display:none;pointer-events:none";
  document.body.appendChild(trackEl);
  const PROGRESS = {
    peaks: (s) => `🔥 signal fires ${["f1", "f2", "f3"].filter((k) => (s.data.lit || {})[k]).length}/3`,
    deep: (s) => `📜 lost pages ${Object.keys(s.data.pages || {}).length}/5`,
    song: (s) => (s.step === 1 ? `🎶 bell-flowers ${(s.data.rung || []).length}/4` : ""),
    scarecrows: (s) => (s.step === 1 ? `🌾 scarecrows ${s.data.n || 0}/6` : ""),
    lighthouse: (s) => (s.step === 1 ? `🏮 buoys ${(s.data.hit || []).length}/4` : ""),
    canopy: (s) => `🪶 owl feathers ${Object.keys(s.data.got || {}).length}/4`,
    whispers: (s) => `❄️ whispers ${Object.keys(s.data.got || {}).length}/7`,
    stars: (s) => (s.step === 1 ? `✨ stars ${(s.data.walked || []).length}/5` : ""),
    pip: (s) => `🏕️ Pip's camps ${Math.min(4, (s.data.n || 0) + 1)}/4`,
  };
  function drawTracker() {
    const id = trackedQuest();
    if (!id) {
      trackEl.style.display = "none";
      return;
    }
    const q = def(id);
    const s = Q(id);
    const inZone = (q.id === "peaks" && zoneHere("peaks")) || (q.id === "deep" && zoneHere("deep"));
    const away = q.city !== here() && !inZone;
    // (some quests begin with their giver: the trailhead, the lighthouse, the star chart)
    const viaGiver = (["peaks", "lighthouse", "stars"].includes(id) || q.gen) && s.step === 0;
    const step = viaGiver ? `Find ${q.giver.name} in ${CITY_NAME[q.city]} — ${q.steps[0]}` : q.steps[Math.min(s.step, q.steps.length - 1)];
    const prog = PROGRESS[id] ? PROGRESS[id](s) : IMPL[id] && IMPL[id].progress ? IMPL[id].progress() : "";
    const others = BOOK().filter((x) => x.id !== id && Q(x.id).st === "active").length;
    const html = `<div style="font:bold 15px Georgia;color:#ffd86a">⚔️ ${q.icon} ${q.name}</div>
      <div style="margin-top:4px">▶ ${step}</div>
      ${prog ? `<div style="margin-top:3px;color:#bfe6ff">${prog}</div>` : ""}
      <div style="margin-top:5px;color:#c8b088;font-size:12px">${away ? `🧭 This quest is in ${CITY_NAME[q.city]}${q.city === "forest" ? "" : " — travel there (K / a waystone)"}` : IMPL[id] && IMPL[id].noBeacon && IMPL[id].noBeacon() ? (q.gen ? "✨ No golden beam for this part — use your eyes!" : "✨ No beacon for this part — remember the order!") : "🔆 Follow the golden beacon"} · Q — Quest Log${others ? ` (+${others} more)` : ""}</div>`;
    if (trackEl.innerHTML !== html) trackEl.innerHTML = html;
    trackEl.style.display = document.body.classList.contains("photo-mode") ? "none" : "";
  }

  // ---------------------------------------------------------------- the HUD line
  let hudMsg = null;
  function hud(text) {
    hudMsg = text;
  }

  // ---------------------------------------------------------------- 📜 THE QUEST LOG (Q)
  const logEl = document.createElement("div");
  logEl.className = "qlog";
  logEl.style.cssText = "position:fixed;inset:0;z-index:57;display:none;align-items:center;justify-content:center;background:rgba(8,6,14,.5)";
  document.body.appendChild(logEl);
  function drawLog() {
    const rows = BOOK().map((q) => {
      const s = Q(q.id);
      const stars = "★".repeat(q.stars) + "☆".repeat(5 - q.stars);
      const status = s.st === "done" ? "✔ complete" : s.st === "active" ? `▶ ${q.steps[Math.min(s.step, q.steps.length - 1)]}` : `❗ Start it here — or talk to ${q.giver.name} in ${CITY_NAME[q.city]}`;
      const isT = trackedQuest() === q.id;
      const dev = ctx.designer && ctx.designer() && s.st !== "done" ? `<button data-finish="${q.id}" title="designer cheat">✅ finish (designer)</button>` : "";
      const btn = dev + (s.st === "active" ? `<button data-t="${q.id}" ${isT ? "disabled" : ""}>${isT ? "🔆 tracking" : "🔆 track this one"}</button>` : s.st === "new" ? `<button data-start="${q.id}" style="font-weight:bold">⚔️ Start this quest</button>` : "");
      return `<div class="q ${s.st === "done" ? "done" : ""}">${btn}
        <b>${q.icon} ${q.name}</b> <span class="stars">${stars}</span><small>${CITY_NAME[q.city]} · reward 🪙 ${reward(q).coins} + ${reward(q).icon} ${reward(q).name} — ✨ ${powerOf(q)}</small><div style="font:13px system-ui;margin-top:3px">${status}</div></div>`;
    });
    const n = BOOK().filter((q) => Q(q.id).st === "done").length;
    logEl.innerHTML = `<div style="width:min(640px,92vw);max-height:86vh;overflow:auto;padding:18px 22px;border-radius:16px;background:#efe0bc;color:#3a2614;font:15px Georgia;box-shadow:0 14px 50px rgba(0,0,0,.6)">
      <h2 style="margin:0;text-align:center">⚔️ Thistle's Quest Log — ${n}/${BOOK().length}</h2>
      ${ctx.designer && ctx.designer() ? `<div style="text-align:center;margin:6px"><button id="qfinishall">✅ finish ALL quests (designer)</button></div>` : ""}
      <div style="text-align:center;font:13px system-ui;color:#8a6a44">📖 Volume ${vol()}${vol() > 1 ? " — brand-new, harder quests!" : ""} · finish them all and the book refreshes with NEW ones</div>${rows.join("")}
      <div style="text-align:center;font:12px system-ui;color:#8a6a44">A golden beacon marks where to go for the quest you're tracking · Q or Esc — close</div></div>`;
    logEl.querySelectorAll("button[data-t]").forEach((b) => (b.onclick = () => {
      tracked = b.dataset.t;
      drawLog();
    }));
    logEl.querySelectorAll("button[data-finish]").forEach((b) => (b.onclick = () => {
      finishQuiet(b.dataset.finish);
      if (BOOK().every((x) => Q(x.id).st === "done")) finishAll();
      else {
        save();
        ctx.chime();
      }
      drawLog();
    }));
    const fa = logEl.querySelector("#qfinishall");
    if (fa) fa.onclick = () => {
      finishAll();
      drawLog();
    };
    logEl.querySelectorAll("button[data-start]").forEach((b) => (b.onclick = () => {
      accept(def(b.dataset.start));
      drawLog();
    }));
  }
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyQ" && !e.repeat && !ctx.playing() && !document.body.classList.contains("photo-mode")) {
      const open = logEl.style.display === "flex";
      if (!open) drawLog();
      logEl.style.display = open ? "none" : "flex";
    } else if (e.code === "Escape" && logEl.style.display === "flex") logEl.style.display = "none";
  });
  if (new URLSearchParams(location.search).get("qlog")) setTimeout(() => {
    drawLog();
    logEl.style.display = "flex";
    // (test) &qlog=1&qstart=song → click that quest's Start button, like a player would
    const qs = new URLSearchParams(location.search).get("qstart");
    if (qs) setTimeout(() => logEl.querySelector(`button[data-start="${qs}"]`).click(), 800);
  }, 3000);

  // ================================================================ hooks
  function interactable() {
    const g = giverInteract();
    if (g) return g;
    for (const q of BOOK()) {
      const it = IMPL[q.id] && IMPL[q.id].interact && IMPL[q.id].interact();
      if (it) return it;
    }
    return null;
  }
  // 🦋 the Moon Moth (from the Moon Moth Lantern) flutters round you
  let moth = null;
  function mothUpdate(t) {
    if (!(S.owned || {}).moonmothlantern || !ctx.scene) return;
    if (!moth) {
      moth = new THREE.Group();
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, side: THREE.DoubleSide }));
        w.position.x = sx * 0.1;
        w.rotation.x = -Math.PI / 2;
        moth.add(w);
      }
      moth.add(glow(0xbfd8ff, 1.4));
      ctx.scene.add(moth);
    }
    const p = me();
    moth.visible = ctx.world() !== "den";
    moth.position.set(p.x + Math.cos(t * 1.3) * 0.9, p.y + 1.1 + Math.sin(t * 2.1) * 0.25, p.z + Math.sin(t * 1.3) * 0.9);
    moth.rotation.y = -t * 1.3;
    moth.children[0].rotation.y = Math.sin(t * 20) * 0.7;
    moth.children[1].rotation.y = -Math.sin(t * 20) * 0.7;
  }
  function update(dt, t) {
    hudMsg = null;
    mothUpdate(t);
    if (!zoneHere("peaks") && !zoneHere("deep")) meter(null);
    giversUpdate(t);
    const c = ctx.world() === "city" ? ctx.city() : null;
    for (const q of BOOK()) {
      if (q.gen && !IMPL[q.id]) IMPL[q.id] = makeGenQuest(q);
      const I = IMPL[q.id];
      if (!I) continue;
      if (I.build && c && q.city === c.id) I.build(c);
      if (I.build && q.city === "everbough" && ctx.world() === "everbough") I.build();
      if (I.update) I.update(dt, t);
    }
    // the beacon: where to go next for the quest you're tracking
    const tq = trackedQuest();
    let at = null;
    if (tq && IMPL[tq] && IMPL[tq].target) at = IMPL[tq].target();
    if (!at && tq && !(IMPL[tq] && IMPL[tq].noBeacon && IMPL[tq].noBeacon())) {
      // (in the quest's city but no special target? → the giver)
      const gv = givers[tq];
      if (gv && gv.group === groupHere() && Q(tq).step === 0) at = gv.at;
    }
    showBeacon(at);
    if (beacon.visible) beacon.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    drawTracker();
    hudEl.style.display = hudMsg ? "" : "none";
    if (hudMsg) hudEl.textContent = hudMsg;
  }
  return { interactable, update, log: () => drawLog() };
}
