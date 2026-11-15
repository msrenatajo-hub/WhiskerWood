// ------------------------------------------------------------
//  📖  THE STORY — Phase 1: "A Quiet Beginning"
//
//  WhiskerWood doesn't have levels. What you KNOW and what you can DO
//  opens the world (see library/data/lore-inbox/progression-v3-open-world.md).
//  Phase 1 is your last day at the Fallen Log School: meet everyone, and
//  learn the basics the natural way — by doing your lessons.
//
//    🙋 Say good morning to Headmaster Bramble     (talking)
//    🔔 Ring the school bell                       (walking, running)
//    🧗 Climb a tree                               (climbing)
//    🌿 Gather 3 lantern parts in the garden       (gathering)
//    🔨 Build your lantern at the workshop         (simple crafting)
//    📚 Borrow a book from the little library      (reading)
//    🗺️ Teacher Willow's map lesson, then open your map with M   (maps)
//    🎓 …then back to the Headmaster — the expedition leaves tomorrow.
//
//  Progress is saved in this browser. URL helpers (dev): ?story=reset
//  starts the day over; ?story=skip marks Phase 1 done.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, cutscenePlaying } from "./cutscene.js";
import { initPhase2, glowTexture } from "./phase2.js";
import { initPhase3 } from "./phase3.js";
import { initPhase4 } from "./phase4.js";
import { initPhase5 } from "./phase5.js";
import { initPhase6 } from "./phase6.js";
import { initPhase7 } from "./phase7.js";
import { initPhase8 } from "./phase8.js";
import { initPhase9 } from "./phase9.js";
import { initPhase10 } from "./phase10.js";
import { initPhase11 } from "./phase11.js";
import { initPhase12 } from "./phase12.js";
import { initPhase13 } from "./phase13.js";
import { initPhase14 } from "./phase14.js";
import { initPhase15 } from "./phase15.js";
import { initPhase16 } from "./phase16.js";
import { initPhase17 } from "./phase17.js";
import { initPhase18 } from "./phase18.js";
import { initPhase19 } from "./phase19.js";
import { initPhase20 } from "./phase20.js";
import { initPhase21 } from "./phase21.js";
import { initPhase22 } from "./phase22.js";
import { initPhase23 } from "./phase23.js";
import { initPhase24 } from "./phase24.js";
import { initPhase25 } from "./phase25.js";
import { initPhase26 } from "./phase26.js";
import { initPhase27 } from "./phase27.js";
import { initPhase28 } from "./phase28.js";
import { initPhase29 } from "./phase29.js";
import { initPhase30 } from "./phase30.js";
import { initPhase31 } from "./phase31.js";
import { initPhase32 } from "./phase32.js";
import { initPhase33 } from "./phase33.js";
import { initPhase34 } from "./phase34.js";
import { initPhase35 } from "./phase35.js";
import { initPhase36 } from "./phase36.js";
import { initPhase37 } from "./phase37.js";
import { initPhase38 } from "./phase38.js";
import { initPhase39 } from "./phase39.js";
import { initPhase40 } from "./phase40.js";
import { cityState } from "./cityLife.js";

const SAVE_KEY = "ww.story.v1";
const LESSONS = [
  ["greet", "Say good morning to Headmaster Bramble"],
  ["bell", "Ring the school bell by the east door (Shift = run!)"],
  ["climb", "Climb a tree — walk into a trunk and hold W"],
  ["gather", "Gather 3 lantern parts in the garden"],
  ["craft", "Build your lantern at the workshop"],
  ["book", "Borrow a book from the little library"],
  ["seat", "Take your seat for Teacher Willow's lesson"],
  ["map", "Open your map (press M)"],
];
const PARTS = [
  // key, label, local offset from the garden center, color
  ["moss", "glow-moss", [-1.6, -0.9], 0x7dffb0],
  ["cap", "an acorn cap", [1.4, 0.6], 0xb07a3a],
  ["twine", "a curl of twine", [0.2, 1.7], 0xe0c890],
];

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s.phase === "number") return s;
  } catch {}
  return { phase: 1, started: false, done: {}, parts: [] };
}

export function initStory(ctx) {
  const q = new URLSearchParams(location.search);
  if (q.get("story") === "reset") {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  }
  const st = load();
  if (q.get("story") === "skip" || q.get("story") === "p2") {
    // Phase 1 done — Phase 2 starts fresh
    st.phase = 2;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    delete st.p2;
  }
  if (q.get("story") === "p40") {
    q.set("story", "p39");
    st._toP40 = true;
  }
  if (q.get("story") === "p39") {
    q.set("story", "p38");
    st._toP39 = true;
  }
  if (q.get("story") === "p38") {
    q.set("story", "p37");
    st._toP38 = true;
  }
  if (q.get("story") === "p37") {
    q.set("story", "p36");
    st._toP37 = true;
  }
  if (q.get("story") === "p36") {
    q.set("story", "p35");
    st._toP36 = true;
  }
  if (q.get("story") === "p35") {
    q.set("story", "p34");
    st._toP35 = true;
  }
  if (q.get("story") === "p34") {
    q.set("story", "p33");
    st._toP34 = true;
  }
  if (q.get("story") === "p33") {
    q.set("story", "p32");
    st._toP33 = true;
  }
  if (q.get("story") === "p32") {
    q.set("story", "p31");
    st._toP32 = true;
  }
  if (q.get("story") === "p31") {
    q.set("story", "p30");
    st._toP31 = true;
  }
  if (q.get("story") === "p30") {
    q.set("story", "p29");
    st._toP30 = true;
  }
  if (q.get("story") === "p29") {
    q.set("story", "p28");
    st._toP29 = true;
  }
  if (q.get("story") === "p28") {
    q.set("story", "p27");
    st._toP28 = true;
  }
  if (q.get("story") === "p27") {
    q.set("story", "p26");
    st._toP27 = true;
  }
  if (q.get("story") === "p26") {
    q.set("story", "p25");
    st._toP26 = true;
  }
  if (q.get("story") === "p25") {
    q.set("story", "p24");
    st._toP25 = true;
  }
  if (q.get("story") === "p24") {
    q.set("story", "p23");
    st._toP24 = true;
  }
  if (q.get("story") === "p23") {
    q.set("story", "p22");
    st._toP23 = true;
  }
  if (q.get("story") === "p22") {
    q.set("story", "p21");
    st._toP22 = true;
  }
  if (q.get("story") === "p21") {
    q.set("story", "p20");
    st._toP21 = true;
  }
  if (q.get("story") === "p20") {
    q.set("story", "p19");
    st._toP20 = true;
  }
  if (q.get("story") === "p19") {
    q.set("story", "p18");
    st._toP19 = true;
  }
  if (q.get("story") === "p18") {
    q.set("story", "p17");
    st._toP18 = true;
  }
  if (q.get("story") === "p17") {
    q.set("story", "p16");
    st._toP17 = true;
  }
  if (q.get("story") === "p16") {
    q.set("story", "p15");
    st._toP16 = true;
  }
  if (q.get("story") === "p15") {
    q.set("story", "p14");
    st._toP15 = true;
  }
  if (q.get("story") === "p14") {
    // (test) straight to Phase 14: the Underglow already saved
    q.set("story", "p13");
    st._toP14 = true;
  }
  if (q.get("story") === "p13") {
    // (test) straight to Phase 13: Phase 12 done, a Legend already
    q.set("story", "p12");
    st._toP13 = true;
  }
  if (q.get("story") === "p12") {
    q.set("story", "p11");
    st._toP12 = true;
  }
  if (q.get("story") === "p11") {
    q.set("story", "p10");
    st._toP11 = true;
  }
  if (q.get("story") === "p10") {
    // everything up to Phase 9 done — Phase 10 starts fresh
    q.set("story", "p9");
    st._toP10 = true;
  }
  if (q.get("story") === "p9") {
    // Phases 1–8 done — Phase 9 starts fresh
    st.phase = 9;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["Lantern Night in Everbough."], done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    st.p4 = { started: true, done: { regions: 1, stones: 1, camp: 1, gear: 1, falls: 1 }, regions: {}, stones: {} };
    st.p5 = { started: true, done: { read: 1, marks: 1, petals: 1, runes: 1, door: 1 }, marks: { chalk: 1, hammer: 1, bandage: 1 }, runes: { 0: 1, 1: 1, 2: 1 }, doorOpen: true };
    st.p6 = { started: true, done: { arrive: 1, reunion: 1, speaker: 1, gates: 1, foundry: 1, archive: 1 }, gates: { 0: 1, 1: 1, 2: 1 }, wheelOn: true, wrench: true };
    const p7steps = ["letters", "deliver", "reply", "stations", "trader", "goods", "lamp", "atlas", "library", "tales", "ready", "homecoming", "key", "sealed"];
    st.p7 = { done: Object.fromEntries(p7steps.map((k) => [k, 1])), stations: { 0: 1, 1: 1, 2: 1, 3: 1 }, lamp: true, sealedOpen: true };
    st.p8 = { done: { road: 1, library: 1, academy: 1, guild: 1, council: 1, festival: 1 }, herbs: {}, rails: {}, folk: {}, posts: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 }, classes: { botany: 1, carto: 1, arch: 1 } };
    st.abilities = { rope: true, spikes: true, lantern: true, pack: true };
    st.rep = { roothaven: 5, school: 4, everbough: 5 };
    delete st.p9;
    if (st._toP10) {
      delete st._toP10;
      st.phase = 10;
      const done = (keys) => ({ done: Object.fromEntries(keys.map((k) => [k, 1])) });
      st.p9 = {
        reedmere: { ...done(["meet", "fish", "gates", "wick", "light"]), fish: 3, gate: 3 },
        golden: { ...done(["meet", "farm", "hens", "cook"]), plots: { 0: 4, 1: 4, 2: 4 }, hens: { 0: 1, 1: 1, 2: 1 } },
        frostpine: { ...done(["meet", "braziers", "beacon", "sled", "hall"]), braziers: 3 },
      };
      Object.assign(st.rep, { reedmere: 4, golden: 4, frostpine: 4 });
      delete st.p10;
      delete st.moonkeeper;
      if (st._toP11) {
        delete st._toP11;
        st.phase = 11;
        st.moonkeeper = true;
        st.p10 = { done: { tokens: 1, vigil: 1, ceremony: 1, d1: 1, d2: 1, d3: 1, d4: 1, d5: 1, duty: 1 }, tokens: { roothaven: 1, everbough: 1, reedmere: 1, golden: 1, frostpine: 1 } };
        delete st.p11;
        if (st._toP12) {
          delete st._toP12;
          st.phase = 12;
          st.p11 = { done: { mail: 1, library: 1, caravan: 1, students: 1, bridge: 1, tunnels: 1, allianceDay: 1 } };
          delete st.p12;
        }
      }
    }
  }
  if (q.get("story") === "p8") {
    // Phases 1–7 done — Phase 8 starts fresh (at the opened Sealed Door)
    st.phase = 8;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["The Sealed Door is open. The road climbs toward Everbough."], done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    st.p4 = { started: true, done: { regions: 1, stones: 1, camp: 1, gear: 1, falls: 1 }, regions: {}, stones: {} };
    st.p5 = { started: true, done: { read: 1, marks: 1, petals: 1, runes: 1, door: 1 }, marks: { chalk: 1, hammer: 1, bandage: 1 }, runes: { 0: 1, 1: 1, 2: 1 }, doorOpen: true };
    st.p6 = { started: true, done: { arrive: 1, reunion: 1, speaker: 1, gates: 1, foundry: 1, archive: 1 }, gates: { 0: 1, 1: 1, 2: 1 }, wheelOn: true, wrench: true };
    const p7steps = ["letters", "deliver", "reply", "stations", "trader", "goods", "lamp", "atlas", "library", "tales", "ready", "homecoming", "key", "sealed"];
    st.p7 = { done: Object.fromEntries(p7steps.map((k) => [k, 1])), stations: { 0: 1, 1: 1, 2: 1, 3: 1 }, lamp: true, sealedOpen: true };
    st.abilities = { rope: true, spikes: true, lantern: true, pack: true };
    st.rep = { roothaven: 5, school: 4 };
    delete st.p8;
  }
  if (q.get("story") === "p7") {
    // Phases 1–6 done — Phase 7 starts fresh
    st.phase = 7;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["Everbough is real."], done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    st.p4 = { started: true, done: { regions: 1, stones: 1, camp: 1, gear: 1, falls: 1 }, regions: {}, stones: {} };
    st.p5 = { started: true, done: { read: 1, marks: 1, petals: 1, runes: 1, door: 1 }, marks: { chalk: 1, hammer: 1, bandage: 1 }, runes: { 0: 1, 1: 1, 2: 1 }, doorOpen: true };
    st.p6 = { started: true, done: { arrive: 1, reunion: 1, speaker: 1, gates: 1, foundry: 1, archive: 1 }, gates: { 0: 1, 1: 1, 2: 1 }, wheelOn: true, wrench: true };
    st.abilities = { rope: true, spikes: true, lantern: true, pack: true };
    st.rep = { roothaven: 3 };
    delete st.p7;
  }
  if (q.get("story") === "p6") {
    // Phases 1–5 done (Moon Door open) — Phase 6 starts fresh
    st.phase = 6;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["The Moon Door opened. Far below there were lights, and voices."],
      done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    st.p4 = { started: true, done: { regions: 1, stones: 1, camp: 1, gear: 1, falls: 1 }, regions: {}, stones: {} };
    st.p5 = { started: true, done: { read: 1, marks: 1, petals: 1, runes: 1, door: 1 }, marks: { chalk: 1, hammer: 1, bandage: 1 }, runes: { 0: 1, 1: 1, 2: 1 }, doorOpen: true };
    st.abilities = { rope: true, spikes: true, lantern: true, pack: true };
    delete st.p6;
    st.rep = {};
  }
  if (q.get("story") === "p5") {
    // Phases 1–4 done, every ability — Phase 5 starts fresh inside the Hollow
    st.phase = 5;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["Willow's journal: the way into Moonstone Hollow is behind the water."],
      done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    st.p4 = { started: true, done: { regions: 1, stones: 1, camp: 1, gear: 1, falls: 1 }, regions: {}, stones: {} };
    st.abilities = { rope: true, spikes: true, lantern: true, pack: true };
    delete st.p5;
  }
  if (q.get("story") === "p4") {
    // Phases 1–3 done — Phase 4 starts fresh
    st.phase = 4;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["Willow's journal: the way into Moonstone Hollow is behind the water."],
      done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    st.p3 = { started: true, done: { home: 1, craft: 1, store: 1, camp: 1, wagon: 1, scarf: 1, willow: 1 }, rope: true, scarf: true };
    delete st.p4;
    st.abilities = {};
  }
  if (q.get("story") === "p3") {
    // Phases 1 + 2 done — Phase 3 starts fresh (journal kept short)
    st.phase = 3;
    st.started = true;
    for (const [k] of LESSONS) st.done[k] = true;
    st.p2 = { started: true, res: {}, journal: ["Willow's map scrap: north, past the Great Falls, to Moonstone Hollow."],
      done: { pack: 1, drink: 1, eat: 1, gather: 1, fire: 1, shelter: 1, fox: 1, sleep: 1, clue: 1 } };
    delete st.p3;
  }
  const save = () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch {}
  };
  save();

  // ---------- the lesson list (top right, under the minimap) ----------
  const panel = document.createElement("div");
  panel.id = "lessons";
  document.body.appendChild(panel);
  // (one phase's mistake must never freeze the whole story: each part runs on its own)
  const safe = (f) => {
    try {
      return f();
    } catch (e) {
      if (!safe.told) {
        safe.told = true;
        console.error(e);
      }
      return null;
    }
  };
  function drawPanel() {
    try {
      drawPanelRaw();
    } catch (e) {
      console.error(e);
    }
  }
  function drawPanelRaw() {
    if (p40 && st.phase >= 40 && !p40.done()) {
      panel.style.display = "";
      panel.innerHTML = p40.panelHTML();
      return;
    }
    if (p39 && st.phase >= 39 && !p39.done()) {
      panel.style.display = "";
      panel.innerHTML = p39.panelHTML();
      return;
    }
    if (p38 && st.phase >= 38 && !p38.done()) {
      panel.style.display = "";
      panel.innerHTML = p38.panelHTML();
      return;
    }
    if (p37 && st.phase >= 37 && !p37.done()) {
      panel.style.display = "";
      panel.innerHTML = p37.panelHTML();
      return;
    }
    if (p36 && st.phase >= 36 && !p36.done()) {
      panel.style.display = "";
      panel.innerHTML = p36.panelHTML();
      return;
    }
    if (p35 && st.phase >= 35 && !p35.done()) {
      panel.style.display = "";
      panel.innerHTML = p35.panelHTML();
      return;
    }
    if (p34 && st.phase >= 34 && !p34.done()) {
      panel.style.display = "";
      panel.innerHTML = p34.panelHTML();
      return;
    }
    if (p33 && st.phase >= 33 && !p33.done()) {
      panel.style.display = "";
      panel.innerHTML = p33.panelHTML();
      return;
    }
    if (p32 && st.phase >= 32 && !p32.done()) {
      panel.style.display = "";
      panel.innerHTML = p32.panelHTML();
      return;
    }
    if (p31 && st.phase >= 31 && !p31.done()) {
      panel.style.display = "";
      panel.innerHTML = p31.panelHTML();
      return;
    }
    if (p30 && st.phase >= 30 && !p30.done()) {
      panel.style.display = "";
      panel.innerHTML = p30.panelHTML();
      return;
    }
    if (p29 && st.phase >= 29 && !p29.done()) {
      panel.style.display = "";
      panel.innerHTML = p29.panelHTML();
      return;
    }
    if (p28 && st.phase >= 28 && !p28.done()) {
      panel.style.display = "";
      panel.innerHTML = p28.panelHTML();
      return;
    }
    if (p27 && st.phase >= 27 && !p27.done()) {
      panel.style.display = "";
      panel.innerHTML = p27.panelHTML();
      return;
    }
    if (p26 && st.phase >= 26 && !p26.done()) {
      panel.style.display = "";
      panel.innerHTML = p26.panelHTML();
      return;
    }
    if (p25 && st.phase >= 25 && !p25.done()) {
      panel.style.display = "";
      panel.innerHTML = p25.panelHTML();
      return;
    }
    if (p24 && st.phase >= 24 && !p24.done()) {
      panel.style.display = "";
      panel.innerHTML = p24.panelHTML();
      return;
    }
    if (p23 && st.phase >= 23 && !p23.done()) {
      panel.style.display = "";
      panel.innerHTML = p23.panelHTML();
      return;
    }
    if (p22 && st.phase >= 22 && !p22.done()) {
      panel.style.display = "";
      panel.innerHTML = p22.panelHTML();
      return;
    }
    if (p21 && st.phase >= 21 && !p21.done()) {
      panel.style.display = "";
      panel.innerHTML = p21.panelHTML();
      return;
    }
    if (p20 && st.phase >= 20 && !p20.done()) {
      panel.style.display = "";
      panel.innerHTML = p20.panelHTML();
      return;
    }
    if (p19 && st.phase >= 19 && !p19.done()) {
      panel.style.display = "";
      panel.innerHTML = p19.panelHTML();
      return;
    }
    if (p18 && st.phase >= 18 && !p18.done()) {
      panel.style.display = "";
      panel.innerHTML = p18.panelHTML();
      return;
    }
    if (p17 && st.phase >= 17 && !p17.done()) {
      panel.style.display = "";
      panel.innerHTML = p17.panelHTML();
      return;
    }
    if (p16 && st.phase >= 16 && !p16.done()) {
      panel.style.display = "";
      panel.innerHTML = p16.panelHTML();
      return;
    }
    if (p15 && st.phase >= 15 && !p15.done()) {
      panel.style.display = "";
      panel.innerHTML = p15.panelHTML();
      return;
    }
    if (p13 && st.phase >= 14 && (st.phase >= 15 || p14.done())) {
      // (the whole story is told — free roaming)
      panel.style.display = "";
      panel.innerHTML = st.phase < 40 || !(p40 && p40.done())
        ? `<h3>✨ The next chapter is starting…</h3><ul><li>○ your next adventure begins in a moment!</li></ul>`
        : `<h3>🌠 Every chapter told — for now!</h3><ul><li>○ Quests (Q) · your village (O) · the open sea ⛵</li></ul><div class="kit">🏡 C — Life Goals (optional)</div>`;
      return;
    }
    if (p14 && st.phase >= 14 && !p14.done()) {
      panel.style.display = "";
      panel.innerHTML = p14.panelHTML();
      return;
    }
    if (p13 && st.phase >= 13) {
      panel.style.display = "";
      panel.innerHTML = p13.panelHTML();
      return;
    }
    if (p12 && st.phase >= 12) {
      panel.style.display = "";
      panel.innerHTML = p12.panelHTML();
      return;
    }
    if (p11 && st.phase === 11) {
      panel.style.display = "";
      panel.innerHTML = p11.panelHTML();
      return;
    }
    if (p10 && st.phase === 10) {
      panel.style.display = "";
      panel.innerHTML = p10.panelHTML();
      return;
    }
    if (p9 && st.phase === 9) {
      panel.style.display = "";
      panel.innerHTML = p9.panelHTML();
      return;
    }
    if (p8 && st.phase === 8) {
      panel.style.display = "";
      panel.innerHTML = p8.panelHTML();
      return;
    }
    if (p7 && st.phase === 7) {
      panel.style.display = "";
      panel.innerHTML = p7.panelHTML();
      return;
    }
    if (p6 && st.phase === 6) {
      panel.style.display = "";
      panel.innerHTML = p6.panelHTML();
      return;
    }
    if (p5 && st.phase === 5 && p5.started) {
      panel.style.display = "";
      panel.innerHTML = p5.panelHTML();
      return;
    }
    if (p4 && st.phase === 4 && p4.started) {
      panel.style.display = "";
      panel.innerHTML = p4.panelHTML();
      return;
    }
    if (p3 && st.phase === 3 && p3.started) {
      panel.style.display = "";
      panel.innerHTML = p3.panelHTML();
      return;
    }
    if (p2 && st.phase === 2 && p2.started) {
      panel.style.display = "";
      panel.innerHTML = p2.panelHTML();
      return;
    }
    const on = st.phase === 1 && st.started;
    panel.style.display = on ? "" : "none";
    if (!on) return;
    const unlocked = st.done.greet;
    const rows = LESSONS.filter(([k]) => k === "greet" || unlocked).map(([k, label]) => {
      let text = label;
      if (k === "gather" && !st.done.gather) text += ` (${st.parts.length}/3)`;
      if (k === "map" && !st.done.seat && !st.done.map) return "";
      return `<li class="${st.done[k] ? "done" : ""}">${st.done[k] ? "✔" : "○"} ${text}</li>`;
    });
    const allDone = LESSONS.every(([k]) => st.done[k]);
    if (allDone) rows.push(`<li class="next">★ Go see Headmaster Bramble</li>`);
    panel.innerHTML = `<h3>📜 Last Day of School</h3><ul>${rows.join("")}</ul>`;
  }

  // ---------- the book overlay (the little library) ----------
  const book = document.createElement("div");
  book.id = "school-book";
  book.innerHTML = `
    <h2>Tales of the Moonkeepers</h2><h4>a book for small mice</h4>
    <p>Long ago, before the cities forgot one another, the Moonkeepers walked
    every road in the Great Forest. They carried news and seeds and stories
    from city to city, and they were welcome everywhere.</p>
    <p>Some roads ran along the creeks. Some ran through the branches. And
    some, the old tales say, ran <i>beneath the roots</i> — dug by patient paws,
    lit by glowworms, safe from every owl.</p>
    <p>Above their doors they carved a promise:<br><b>“Strength below. Light within.”</b></p>
    <p>Nobody has seen a Moonkeeper in a very long time.</p>
    <div class="close">E — close the book</div>`;
  document.body.appendChild(book);
  const bookOpen = () => book.classList.contains("open");

  // ---------- tiny sounds (no files: a little synth) ----------
  let actx = null;
  function tone(freq, dur = 0.5, type = "sine", vol = 0.18, delay = 0) {
    try {
      actx ||= new AudioContext();
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      const t0 = actx.currentTime + delay;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g).connect(actx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch {}
  }
  const ding = () => { tone(880, 1.6, "sine", 0.22); tone(1320, 1.2, "sine", 0.08); tone(660, 2, "triangle", 0.06, 0.02); };
  const chime = () => { tone(784, 0.25); tone(988, 0.25, "sine", 0.18, 0.12); tone(1175, 0.5, "sine", 0.18, 0.24); };
  const tap = (d) => tone(220 + Math.random() * 60, 0.08, "square", 0.05, d);

  // ---------- where things are ----------
  const school = () => ctx.school(); // {x, y, z} once the world loads
  const W = (local, dy = 0) => {
    const s = school();
    const x = s.x + local[0];
    const z = s.z + local[1];
    return [x, ctx.terrainHeight(x, z) + dy, z];
  };
  const npc = (key) => ctx.npcs.find((n) => n.key === key);
  const npcHead = (n) => [n.x, ctx.terrainHeight(n.x, n.z) + (n.mesh.userData.dy || 0) + 0.62 * n.mesh.scale.x, n.z];
  const me = () => ctx.mouseRig.position;
  const dist2d = (a, x, z) => Math.hypot(a.x - x, a.z - z);

  // ---------- lantern parts in the garden ----------
  const partMeshes = [];
  function spawnParts() {
    if (partMeshes.length || st.done.gather) return;
    for (const [key, label, off, color] of PARTS) {
      if (st.parts.includes(key)) continue;
      const g = new THREE.Group();
      const body =
        key === "moss"
          ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, flatShading: true }))
          : key === "cap"
          ? new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, flatShading: true }))
          : new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 5, 12), new THREE.MeshStandardMaterial({ color, flatShading: true }));
      g.add(body);
      // a soft sparkle so small paws can spot it
      const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2b0, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
      spark.scale.setScalar(0.7);
      g.add(spark);
      const [gx, gz] = ctx.spots.garden;
      const [x, y, z] = W([gx + off[0], gz + off[1]], 0.35);
      g.position.set(x, y, z);
      g.userData = { key, label, spark, base: y };
      ctx.outsideGroup.add(g);
      partMeshes.push(g);
    }
  }

  // the lantern Thistle carries (clipped to the belt) once it's built
  let beltLantern = null;
  function giveLantern() {
    const body = ctx.quadMouse();
    if (!body || beltLantern) return;
    beltLantern = new THREE.Group();
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.09), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb84a, emissiveIntensity: 1.8 }));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.06, 4), new THREE.MeshStandardMaterial({ color: 0x8a5a2e, flatShading: true }));
    cap.position.y = 0.085;
    cap.rotation.y = Math.PI / 4;
    beltLantern.add(cage, cap);
    beltLantern.position.set(0.13, 0.27, 0.02); // on the right hip
    body.add(beltLantern);
  }
  if (st.done.craft) setTimeout(giveLantern, 0);

  // ---------- conversations ----------
  const you = "Thistle";
  /** Play a back-and-forth. lines: [[who, text], …] — who is "npc" or "you" */
  function talk(n, lines, after) {
    const head = npcHead(n);
    const m = me();
    n.mesh.userData.lookAt = m;
    // turn Thistle to face them
    ctx.mouseRig.rotation.y = Math.atan2(n.x - m.x, n.z - m.z);
    const dx = m.x - n.x;
    const dz = m.z - n.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const myHead = () => [m.x, m.y + 0.6, m.z];
    // over-the-shoulder shots, swapping sides as the speaker changes
    const overMe = () => [m.x + ux * 1.5 - uz * 0.7, m.y + 1.0, m.z + uz * 1.5 + ux * 0.7];
    const overThem = () => [n.x - ux * 1.3 + uz * 0.7, head[1] + 0.35, n.z - uz * 1.3 - ux * 0.7];
    const shots = lines.map(([who, text]) => {
      const mine = who === "you";
      return {
        dur: 2.2,
        from: mine ? overThem : overMe,
        look: mine ? myHead : head,
        who: mine ? you : n.name,
        text,
      };
    });
    if (shots.length) {
      // a gentle push-in on the very first line
      const first = shots[0];
      const f0 = first.from;
      first.from = () => {
        const p = f0();
        return [p[0] + ux * 0.6, p[1] + 0.25, p[2] + uz * 0.6];
      };
      first.to = f0;
    }
    shots[shots.length - 1].end = () => {
      n.mesh.userData.lookAt = null;
      if (after) after();
    };
    return playCutscene(shots);
  }

  function complete(key, msg) {
    if (st.done[key]) return;
    st.done[key] = true;
    save();
    drawPanel();
    chime();
    if (msg) ctx.say(msg);
  }

  // ---------- what each person says ----------
  function talkTo(n) {
    const lessonsDone = LESSONS.every(([k]) => st.done[k]);
    if (n.key === "bramble") {
      if (!st.done.greet) {
        return talk(n, [
          ["npc", "Ah — Thistle! There you are. Good morning, good morning!"],
          ["you", "Good morning, Headmaster Bramble."],
          ["npc", "Today is a special day. Your very last day of lessons."],
          ["npc", "Tomorrow the teachers set out on the great expedition… and this year our oldest students come along. That means you."],
          ["npc", "So! Finish today's lessons before you go. Your teachers are waiting for you all over the grounds."],
          ["npc", "And ring the bell for me, would you? It's just past this door. Off you go — hold Shift and RUN!"],
        ], () => complete("greet", "📜 Your lessons are listed at the top right."));
      }
      if (lessonsDone && st.phase === 1) return graduation(n);
      if (st.phase > 1) {
        if (st.phase >= 7) {
          return talk(n, [["npc", st.p7 && st.p7.done && st.p7.done.homecoming
            ? "A full school again! And the roads between the cities opening — it all started with you, Thistle."
            : "Letters from below! A city under the forest! I'm too old for this much excitement. Go on, go on."]]);
        }
        if (st.p2 && st.p2.started) {
          return talk(n, [
            ["npc", "Thistle! Oh, thank the stars — you're safe!"],
            ["npc", "None of the others have come back. Not one. I've been ringing the bell every hour…"],
            ["npc", "If anyone can find them, it's you. Keep your compass close — it always points home."],
          ]);
        }
        return talk(n, [["npc", "Rest well, explorer. The forest is wide — and the compass always points home."]]);
      }
      const left = LESSONS.filter(([k]) => !st.done[k]).length;
      return talk(n, [["npc", left === 1 ? "Just one lesson left! Nearly there." : `${left} lessons left, Thistle. The day won't wait!`]]);
    }
    if (!st.done.greet) {
      return talk(n, [["npc", "Shouldn't you say good morning to the Headmaster first? He's by the east door."]]);
    }
    if (n.key === "fern") {
      if (!st.done.gather) {
        return talk(n, [
          ["npc", "Morning, Thistle! A gatherer's first lesson: look closely."],
          ["npc", "I've hidden three lantern parts in the garden — glow-moss, an acorn cap, and a curl of twine. Walk up to each one and press E."],
          ["npc", "Oh, and a good gatherer can CLIMB. Walk right into any tree trunk and hold W — your claws will do the rest."],
        ]);
      }
      return talk(n, [["npc", st.done.craft ? "A lantern of your very own! The garden's proud of you." : "Well gathered! Now take those parts to Master Tinker at the workshop."]]);
    }
    if (n.key === "tinker") {
      if (st.done.craft) return talk(n, [["npc", "Keep that lantern close. It'll glow brightest where it's darkest."]]);
      if (!st.done.gather) {
        return talk(n, [
          ["npc", "Ho there! Every explorer needs a light, and today you'll build your own."],
          ["npc", "But no parts, no lantern! Teacher Fern has them hidden in the garden."],
        ]);
      }
      return talk(n, [
        ["npc", "Glow-moss, an acorn cap and twine — splendid! Step up to the bench."],
      ], buildLantern);
    }
    if (n.key === "willow") {
      if (st.done.seat) {
        return talk(n, [["npc", st.done.map ? "A map is a memory you can carry. Don't forget it out there." : "Open your map, Thistle — press M."]]);
      }
      return talk(n, [
        ["npc", "Good morning, Thistle! Today's lesson is maps."],
        ["npc", "Take your seat — the empty stump in the back row, with the green cushion. Press E to sit."],
      ]);
    }
    // classmates
    const chat = {
      clover: ["I can't sleep tonight. The EXPEDITION! Do you think we'll see a real fox? From far away, I mean."],
      hazel: ["My gran says there's a hole under Everbough that goes all the way down. She's fibbing. Probably."],
      juniper: ["Bet I can climb higher than you. Bet you a whole acorn."],
      sorrel: ["Teacher Willow says maps are memories. I keep forgetting mine."],
      wren: ["Shh! I'm trying to remember all five Great Cities. Everbough… and… um."],
      tansy: ["Master Tinker let me hold the hammer once. ONCE."],
    }[n.key] || ["Hi, Thistle!"];
    return talk(n, chat.map((t) => ["npc", t]));
  }

  // ---------- the workshop: build a lantern ----------
  function buildLantern() {
    const [bx, by, bz] = W(ctx.spots.bench);
    const standX = bx;
    const standZ = bz + 0.95;
    let made = null;
    return playCutscene([
      {
        dur: 0.6,
        run: () => {
          ctx.placePlayer(standX, standZ, Math.PI); // face the bench
        },
        from: [bx + 2.6, by + 1.7, bz + 2.4],
        look: [bx, by + 0.9, bz],
      },
      {
        dur: 2.6,
        from: [bx + 2.6, by + 1.7, bz + 2.4],
        to: [bx + 1.6, by + 1.4, bz + 1.9],
        look: [bx, by + 0.9, bz],
        text: "Moss for the glow… the acorn cap for a lid… twine to hang it by…",
        update: (k, dt) => {
          const u = ctx.quadMouse()?.userData;
          if (u?.armL) {
            u.armL.rotation.x = -1.2 + Math.sin(k * 40) * 0.3;
            u.armR.rotation.x = -1.2 - Math.sin(k * 40) * 0.3;
          }
          if (Math.random() < dt * 6) tap(0);
        },
      },
      {
        dur: 2.4,
        run: () => {
          made = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb84a, emissiveIntensity: 2.2 }));
          made.position.set(bx, by + 1.05, bz);
          ctx.outsideGroup.add(made);
          chime();
        },
        from: [bx + 0.9, by + 1.3, bz + 1.2],
        look: [bx, by + 1.0, bz],
        who: "Master Tinker",
        text: "There! Not the brightest lantern in the forest… but it's YOURS.",
      },
      {
        dur: 2,
        from: [bx + 0.9, by + 1.3, bz + 1.2],
        look: [bx, by + 1.0, bz],
        text: "🏮 You made a Lantern! It hangs from your belt — and glows in dark places.",
        end: () => {
          if (made) ctx.outsideGroup.remove(made);
          const u = ctx.quadMouse()?.userData;
          if (u?.armL) u.armL.rotation.x = u.armR.rotation.x = 0;
          giveLantern();
          complete("craft");
        },
      },
    ]);
  }

  // ---------- Teacher Willow's map lesson (after you sit) ----------
  function mapLesson() {
    const s = school();
    const y = ctx.terrainHeight(s.x, s.z);
    const willow = npc("willow");
    if (willow) willow.mesh.userData.lookAt = new THREE.Vector3(s.x, y, s.z);
    return playCutscene([
      {
        dur: 3,
        from: [s.x - 8.9, y + 2.6, s.z + 2.8],
        to: [s.x - 8.6, y + 2.2, s.z + 2.2],
        look: [s.x - 2.5, y + 0.9, s.z],
        who: "Teacher Willow",
        text: "Good morning, class! Paws still, ears up.",
      },
      {
        dur: 3,
        from: [s.x - 5.6, y + 1.7, s.z - 2.6],
        to: [s.x - 6.2, y + 1.8, s.z - 1.8],
        look: [s.x - 9.5, y + 1.75, s.z],
        who: "Teacher Willow",
        text: "Today: maps. A map is a memory you can carry with you.",
      },
      {
        dur: 3,
        from: [s.x - 7.4, y + 1.2, s.z + 1.6],
        look: [willow ? willow.x : s.x - 8.4, y + 0.9, willow ? willow.z : s.z],
        who: "Teacher Willow",
        text: "Out on the expedition, your map will show the whole forest — the creek, the meadow, the school… and Everbough, the greatest tree of all.",
      },
      {
        dur: 3,
        from: [s.x + 0.6, y + 1.9, s.z + 1.2],
        to: [s.x + 0.2, y + 1.7, s.z + 0.8],
        look: [s.x - 9, y + 1.3, s.z],
        who: "Teacher Willow",
        text: "Old stories say the Moonkeepers once dug secret roads beneath Everbough's roots. Nobody has ever found them, of course.",
      },
      {
        dur: 2.4,
        from: [s.x - 3.6, y + 1.3, s.z + 2.6],
        look: [s.x - 3.6, y + 0.9, s.z + 1.5],
        who: "Hazel",
        text: "(whispering) …my gran says they're real.",
      },
      {
        dur: 2.6,
        from: [s.x + 0.6, y + 1.9, s.z + 1.2],
        look: [s.x - 9, y + 1.3, s.z],
        who: "Teacher Willow",
        text: "Now — open your own map. Press M, and find where we are.",
        end: () => {
          if (willow) willow.mesh.userData.lookAt = null;
          complete("seat", "🗺️ Press M to open your map.");
        },
      },
    ]);
  }

  // ---------- the evening: graduation ----------
  function graduation(n) {
    const s = school();
    const [dx, dy, dz] = W(ctx.spots.door);
    const head = npcHead(n);
    const standX = n.x - 1.6;
    const standZ = n.z - 1.2;
    return playCutscene([
      { dur: 1.2, fadeOut: true, gameCam: true },
      {
        dur: 1.6, black: true, gameCam: true, text: "That evening…",
        run: () => {
          ctx.setTime(0.72);
          ctx.placePlayer(standX, standZ, Math.atan2(n.x - standX, n.z - standZ));
          n.mesh.userData.lookAt = me();
        },
      },
      {
        dur: 4, fadeIn: true,
        from: [dx + 22, dy + 12, dz + 16], to: [dx + 12, dy + 5, dz + 8], look: [dx, dy + 1, dz],
        text: "…the whole school gathered by the east door as the sun went down.",
      },
      { dur: 3, from: [standX - 0.9, me().y + 1.0, standZ - 1.0], look: head, who: n.name,
        text: "Thistle Mosswhisker. You rang the bell, climbed the trees, gathered and built, read the old books and learned your maps." },
      { dur: 3, from: [standX - 0.9, me().y + 1.0, standZ - 1.0], to: [standX - 0.5, me().y + 0.95, standZ - 0.6], look: head, who: n.name,
        text: "Every student who sets out on the expedition is given one of these." },
      { dur: 2.6, from: [standX + 0.8, me().y + 0.9, standZ + 0.9], look: [standX, me().y + 0.5, standZ],
        text: "🧭 You received the Wooden Compass.", run: chime },
      { dur: 3, from: [standX - 0.9, me().y + 1.0, standZ - 1.0], look: head, who: n.name,
        text: "It's carved from the very same log as our school. Wherever the forest takes you, it will point you home." },
      { dur: 3, from: [dx + 6, dy + 2.2, dz + 3], look: [dx, dy + 1, dz], who: "Teacher Willow",
        text: "Sleep well, everyone. We leave at first light." },
      { dur: 4.5, from: [dx + 6, dy + 2.2, dz + 3], to: [dx + 4, dy + 30, dz + 2], lookFrom: [dx, dy + 1, dz], lookTo: [dx - 20, dy + 80, dz - 40],
        text: "Tomorrow, the expedition begins…" },
      { dur: 1.2, fadeOut: true, from: [dx + 4, dy + 30, dz + 2], look: [dx - 20, dy + 80, dz - 40] },
      { dur: 3.5, black: true, from: [dx + 4, dy + 30, dz + 2], look: [dx - 20, dy + 80, dz - 40],
        who: "WhiskerWood", text: "Phase 1 · A Quiet Beginning — complete." },
      {
        dur: 1.2, fadeIn: true, gameCam: true,
        run: () => {
          n.mesh.userData.lookAt = null;
          st.phase = 2;
          st.compass = true;
          save();
          drawPanel();
        },
        end: () => setTimeout(() => p2.start(), 600), // …and the expedition leaves at first light
      },
    ]);
  }

  // ---------- the opening ----------
  function intro() {
    st.started = true;
    save();
    const s = school();
    const [dx, dy, dz] = W(ctx.spots.door);
    const b = npc("bramble");
    if (ctx.world() !== "outside") ctx.goOutside();
    ctx.setTime(0.3); // a fresh morning
    const sx = dx + 7;
    const sz = dz + 1.5;
    ctx.placePlayer(sx, sz, -Math.PI / 2); // facing the school, west
    return playCutscene([
      { dur: 1.6, black: true, from: [s.x + 40, dy + 26, s.z + 34], look: [s.x, dy + 2, s.z] },
      { dur: 5, fadeIn: true, from: [s.x + 40, dy + 26, s.z + 34], to: [s.x + 24, dy + 12, s.z + 22], look: [s.x, dy + 2, s.z],
        who: "WhiskerWood", text: "The Fallen Log School." },
      { dur: 4.5, from: [s.x + 24, dy + 12, s.z + 22], to: [s.x + 16, dy + 4, s.z + 12], look: [s.x + 4, dy + 2, s.z],
        text: "For as long as you can remember, this old hollow log has been the center of your whole world." },
      b && {
        dur: 3, from: [sx - 1.5, dy + 1.4, sz + 2.2], look: npcHead(b), who: b.name,
        run: () => (b.mesh.userData.lookAt = me()),
        text: "Ah — Thistle! Good morning! Come over here a moment, would you?",
        end: () => (b.mesh.userData.lookAt = null),
      },
    ].filter(Boolean)).then(() => {
      drawPanel();
      ctx.say("🙋 Walk over to Headmaster Bramble and press E to talk.");
    });
  }

  // ---------- things you can press E on ----------
  function nearestNpc(maxD) {
    let best = null;
    let bd = maxD;
    for (const n of ctx.npcs) {
      if (!n.mesh.visible) continue; // gone with the expedition
      const d = dist2d(me(), n.x, n.z);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  /** What's here to do? → { label, act } or null */
  function interactable() {
    const inCity = safe(() => p40.interactable()) || safe(() => p39.interactable()) || safe(() => p38.interactable()) || safe(() => p37.interactable()) || safe(() => p36.interactable()) || safe(() => p35.interactable()) || safe(() => p34.interactable()) || safe(() => p33.interactable()) || safe(() => p32.interactable()) || safe(() => p31.interactable()) || safe(() => p30.interactable()) || safe(() => p29.interactable()) || safe(() => p28.interactable()) || safe(() => p27.interactable()) || safe(() => p26.interactable()) || safe(() => p25.interactable()) || safe(() => p24.interactable()) || safe(() => p23.interactable()) || safe(() => p22.interactable()) || safe(() => p21.interactable()) || safe(() => p20.interactable()) || safe(() => p19.interactable()) || safe(() => p18.interactable()) || safe(() => p17.interactable()) || safe(() => p16.interactable()) || safe(() => p15.interactable()) || safe(() => p14.interactable()) || safe(() => p13.interactable()) || safe(() => p12.interactable()) || safe(() => p11.interactable()) || safe(() => p10.interactable()) || safe(() => p9.interactable()) || safe(() => p8.interactable()) || safe(() => p7.interactable()) || safe(() => p6.interactable()); // (the cities are their own places)
    if (inCity) return inCity;
    if (ctx.world() !== "outside" || !school()) return null;
    const fromP2 = p2.interactable() || p3.interactable() || p4.interactable() || p5.interactable();
    if (fromP2) return fromP2;
    if (dist2d(me(), school().x, school().z) > 40) return null;
    const m = me();
    if (st.done.greet && st.phase === 1) {
      for (const p of partMeshes) {
        if (dist2d(m, p.position.x, p.position.z) < 1.3) {
          return { label: `pick up ${p.userData.label}`, act: () => gatherPart(p) };
        }
      }
      const [bx, , bz] = W(ctx.spots.bell);
      if (dist2d(m, bx, bz) < 2.2) return { label: "ring the bell", act: ringBell };
      const [lx, , lz] = W(ctx.spots.bookcase);
      if (dist2d(m, lx, lz) < 2.2) return { label: "borrow a book", act: openBook };
    } else if (st.phase > 1) {
      const [bx, , bz] = W(ctx.spots.bell);
      if (dist2d(m, bx, bz) < 2.2) return { label: "ring the bell", act: ringBell };
      const [lx, , lz] = W(ctx.spots.bookcase);
      if (dist2d(m, lx, lz) < 2.2) return { label: "read a book", act: openBook };
    }
    // 🔨 the workbench: walk up to it from any side and press E
    const [wx, , wz] = W(ctx.spots.bench);
    if (dist2d(m, wx, wz) < 2.8 && st.done.greet) {
      if (st.phase === 1 && !st.done.craft) {
        if (st.parts.length >= 3) return { label: "build your lantern at the bench", act: buildLantern };
        const t = npc("tinker");
        return { label: "use the workbench", act: () => t && talk(t, [["npc", `No parts, no lantern! You've found ${st.parts.length} of 3 — Teacher Fern hid them in the garden.`]]) };
      }
    }
    const [sx, , sz] = W(ctx.spots.seat);
    if (dist2d(m, sx, sz) < 1.6 && !ctx.isSitting()) return { label: "sit down", act: sitDown };
    const n = nearestNpc(2.4);
    if (n) return { label: `talk to ${n.name}`, act: () => talkTo(n) };
    return null;
  }

  function gatherPart(p) {
    st.parts.push(p.userData.key);
    ctx.outsideGroup.remove(p);
    partMeshes.splice(partMeshes.indexOf(p), 1);
    ctx.bite();
    tone(1046, 0.18, "sine", 0.15);
    if (st.parts.length >= 3) complete("gather", "🌿 All three lantern parts! Take them to Master Tinker at the workshop.");
    else {
      save();
      drawPanel();
      ctx.say(`🌿 You found ${p.userData.label}! (${st.parts.length}/3)`);
    }
  }

  function ringBell() {
    ding();
    // every head in school turns to look
    for (const n of ctx.npcs) n.mesh.userData.lookAt = me();
    setTimeout(() => { for (const n of ctx.npcs) n.mesh.userData.lookAt = null; }, 2200);
    if (st.phase === 1 && st.done.greet && !st.done.bell) complete("bell", "🔔 DING! The whole school heard that.");
    else ctx.say("🔔 Ding!");
  }

  function openBook() {
    book.classList.add("open");
    if (st.phase === 1 && !st.done.book) complete("book", "📚 You borrowed 'Tales of the Moonkeepers'.");
  }

  function sitDown() {
    const [sx, sy, sz] = W(ctx.spots.seat);
    ctx.sit(sx, sy + 0.91, sz, -Math.PI / 2); // eyes front, toward the board
    if (st.phase === 1 && st.done.greet && !st.done.seat) setTimeout(mapLesson, 500);
    else ctx.say("🪵 You sit on your stump. (W or E to stand up)");
  }

  // ---------- keys ----------
  window.addEventListener("keydown", (e) => {
    if (bookOpen() && (e.code === "KeyE" || e.code === "Escape")) {
      book.classList.remove("open");
      e.stopImmediatePropagation();
      return;
    }
    if (e.code === "KeyM" && st.phase === 1 && st.done.seat && !st.done.map && ctx.world() === "outside") {
      complete("map", "🗺️ There's the school — and far away, the great tree Everbough.");
    }
  }, true); // capture: before the game's own E handling

  // ---------- each frame ----------
  let pendingIntro = st.phase === 1 && !st.started && ctx.autoStart;
  let pendingP5 = st.phase === 5 && !(st.p5 && st.p5.started) && (ctx.autoStart || q.get("story") === "p5") && !q.get("p5at");
  let pendingP4 = st.phase === 4 && !(st.p4 && st.p4.started) && (ctx.autoStart || q.get("story") === "p4");
  let pendingP3 = st.phase === 3 && !(st.p3 && st.p3.started) && (ctx.autoStart || q.get("story") === "p3");
  let pendingP2 = st.phase === 2 && !(st.p2 && st.p2.started) && ctx.autoStart && !q.get("p2at");
  function update(dt, t) {
    if (pendingP2 && school() && ctx.quadMouse() && !cutscenePlaying()) {
      pendingP2 = false;
      p2.start();
    }
    if (pendingP3 && school() && ctx.quadMouse() && !cutscenePlaying()) {
      pendingP3 = false;
      p3.start();
    }
    p2.update(dt, t);
    p3.update(dt, t);
    if (pendingP4 && school() && ctx.quadMouse() && !cutscenePlaying()) {
      pendingP4 = false;
      p4.start();
    }
    p4.update(dt, t);
    if (pendingP5 && school() && ctx.quadMouse() && !cutscenePlaying()) {
      pendingP5 = false;
      p5.start();
    }
    safe(() => p5.update(dt, t));
    safe(() => p6.update(dt, t));
    safe(() => p7.update(dt, t));
    safe(() => p8.update(dt, t));
    safe(() => p9.update(dt, t));
    safe(() => p10.update(dt, t));
    safe(() => p11.update(dt, t));
    safe(() => p12.update(dt, t));
    safe(() => p13.update(dt, t));
    safe(() => p14.update(dt, t));
    safe(() => p15.update(dt, t));
    safe(() => p16.update(dt, t));
    safe(() => p17.update(dt, t));
    safe(() => p18.update(dt, t));
    safe(() => p19.update(dt, t));
    safe(() => p20.update(dt, t));
    safe(() => p21.update(dt, t));
    safe(() => p22.update(dt, t));
    safe(() => p23.update(dt, t));
    safe(() => p24.update(dt, t));
    safe(() => p25.update(dt, t));
    safe(() => p26.update(dt, t));
    safe(() => p27.update(dt, t));
    safe(() => p28.update(dt, t));
    safe(() => p29.update(dt, t));
    safe(() => p30.update(dt, t));
    safe(() => p31.update(dt, t));
    safe(() => p32.update(dt, t));
    safe(() => p33.update(dt, t));
    safe(() => p34.update(dt, t));
    safe(() => p35.update(dt, t));
    safe(() => p36.update(dt, t));
    safe(() => p37.update(dt, t));
    safe(() => p38.update(dt, t));
    safe(() => p39.update(dt, t));
    safe(() => p40.update(dt, t));
    if (pendingIntro && school() && ctx.quadMouse() && !cutscenePlaying()) {
      pendingIntro = false;
      intro();
    }
    if (st.phase !== 1 || !school()) return;
    if (st.done.greet) spawnParts();
    for (const p of partMeshes) {
      p.position.y = p.userData.base + Math.sin(t * 2 + p.position.x) * 0.08;
      p.rotation.y = t * 1.5;
      p.userData.spark.material.opacity = 0.35 + Math.sin(t * 5 + p.position.z) * 0.25;
    }
    // climbing lesson: get well up off the ground anywhere near school
    if (st.done.greet && !st.done.climb && ctx.world() === "outside") {
      const m = me();
      if (m.y - ctx.terrainHeight(m.x, m.z) > 3.5 && dist2d(m, school().x, school().z) < 260) {
        complete("climb", "🧗 Look at you up there! (Lesson complete)");
      }
    }
  }

  /** Where the next task is, for the minimap trail — { x, z } or null. */
  function goal() {
    if (st.phase === 2) return p2.goal();
    if (st.phase === 3) return p3.goal();
    if (st.phase === 4) return p4.goal();
    if (st.phase === 5) return p5.goal();
    if (st.phase === 6) return ctx.world() === "outside" && st.p5 && st.p5.doorOpen ? ctx.moonDoor.stairs : null;
    if (st.phase === 7) return p7.goal();
    if (st.phase === 8) return p8.goal();
    if (st.phase === 9) return p9.goal();
    if (st.phase === 10) return p10.goal();
    if (st.phase === 11) return p11.goal();
    if (st.phase >= 14 && p14.goal()) return p14.goal();
    if (st.phase >= 12) return p12.goal();
    if (st.phase !== 1 || !st.started || !school()) return null;
    const at = (local) => {
      const [x, , z] = W(local);
      return { x, z };
    };
    const who = (key) => {
      const n = npc(key);
      return n ? { x: n.x, z: n.z } : null;
    };
    const d = st.done;
    if (!d.greet) return who("bramble");
    if (!d.bell) return at(ctx.spots.bell);
    if (!d.gather) {
      // the nearest part still lying in the garden
      let best = null;
      let bd = Infinity;
      for (const p of partMeshes) {
        const dd = dist2d(me(), p.position.x, p.position.z);
        if (dd < bd) { bd = dd; best = { x: p.position.x, z: p.position.z }; }
      }
      return best || at(ctx.spots.garden);
    }
    if (!d.craft) return at(ctx.spots.bench);
    if (!d.book) return at(ctx.spots.bookcase);
    if (!d.seat) return at(ctx.spots.seat);
    if (!d.climb) return who("fern"); // she knows the best climbing trees
    if (!d.map) return null; // just press M — no walking needed
    return who("bramble"); // all done: back to the Headmaster
  }

  // ---------- Phase 2: Alone ----------
  const p2 = initPhase2({ ctx, st, save, chime, tone, talkTo, npc, npcHead, redraw: () => drawPanel(), onDone: () => p3.start() });
  // ---------- Phase 3: The Search Begins ----------
  const p3 = initPhase3({ ctx, st, save, chime, tone, redraw: () => drawPanel(), onDone: () => p4.start() });
  // ---------- Phase 4: Exploring the Great Forest ----------
  const p4 = initPhase4({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p5.start() });
  // ---------- Phase 5: Moonstone Hollow ----------
  const p5 = initPhase5({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p6.start() });
  // ---------- Phase 6: Roothaven ----------
  const p6 = initPhase6({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p7.start() });
  // ---------- Phase 7: Reconnecting the World ----------
  const p7 = initPhase7({ ctx, st, save, chime, redraw: () => drawPanel(), talkOutside: talk, onDone: () => p8.start(), road: () => p8.roadAction() });
  // ---------- Phase 8: Everbough ----------
  const p8 = initPhase8({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p9.start() });
  // ---------- Phase 9: The Other Great Cities ----------
  const p9 = initPhase9({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p10.start() });
  // ---------- Phase 10: Becoming a Moonkeeper ----------
  const p10 = initPhase10({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p11.start() });
  // ---------- Phase 11: Restoring the Great Canopy Alliance ----------
  const p11 = initPhase11({ ctx, st, save, chime, redraw: () => drawPanel(), onDone: () => p12.start() });
  // ---------- Phase 12: Your Life After the Story ----------
  const p12 = initPhase12({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 13: The Shadow Under the Roots ----------
  if (st._toP13) {
    delete st._toP13;
    st.p12 ||= { done: {} };
    Object.assign(st.p12, { started: true, legend: true });
    const at = new URLSearchParams(location.search).get("p13at");
    if (at) {
      st.phase = 13;
      st.p13 = { started: true, step: { camp: 1, lanterns: 2, hollow: 3 }[at] || 0, lanterns: at === "hollow" ? { grove: true, lake: true, maze: true } : {}, lit: {} };
    }
  }
  const p13 = initPhase13({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 14: The Road to Silverveil ----------
  if (st._toP14) {
    delete st._toP14;
    st.phase = 14;
    st.p13 = { started: true, done: true, step: 4, lanterns: { grove: true, lake: true, maze: true }, lit: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 } };
    st.p14 = { started: true, mirrors: null, done: false };
    const at = new URLSearchParams(location.search).get("p14at");
    const c = cityState();
    if (at === "mirrors" || at === "silver") {
      c.shards = { hollow: true, pine: true, canopy: true };
      c.silverVisited = true;
      if (at === "mirrors") c.silverKeeper = c.renataJournal = true;
    }
  }
  const p14 = initPhase14({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 15: Sprig's Story ----------
  if (st._toP15) {
    delete st._toP15;
    st.phase = 15;
    st.p14 = { started: true, done: true, mirrors: [0, 0, 0, 0] };
    st.p15 = { started: true, notes: +(new URLSearchParams(location.search).get("p15notes") || 0), stars: {}, done: false };
    st.p12 = { ...(st.p12 || {}), apprentice: true, started: true };
  }
  const p15 = initPhase15({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 16: The Gathering of the Six Cities ----------
  if (st._toP16) {
    delete st._toP16;
    st.phase = 16;
    st.p15 = { started: true, notes: 4, stars: { 0: 1, 1: 1, 2: 1 }, done: true };
    st.p16 = { started: true, asked: {}, done: {}, festival: false };
  }
  const p16 = initPhase16({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 17: The Ship with Silver Sails ----------
  if (st._toP17) {
    delete st._toP17;
    st.phase = 17;
    st.p16 = { started: true, asked: {}, done: {}, festival: true };
    st.p17 = { started: true, met: false, items: {}, sailed: false, done: false };
  }
  const p17 = initPhase17({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 18: The Sunrise Lands ----------
  if (st._toP18) {
    delete st._toP18;
    st.phase = 18;
    st.p17 = { started: true, met: true, items: { ember: 1, chart: 1, conch: 1 }, sailed: true, done: true };
    st.p18 = { started: true, sailed: false, shards: {}, woke: {}, done: false };
    // (test) &p18stuck=1 → like a save that finished every city but got stuck before the finale
    if (new URLSearchParams(location.search).get("p18stuck")) Object.assign(st.p18, { sailed: true, woke: { coral: 1, mesa: 1, bamboo: 1, fen: 1, sky: 1 }, finaleQueued: true });
  }
  const p18 = initPhase18({ ctx, st, save, chime, redraw: () => drawPanel(), marisolAt: () => p17.marisolAt() });
  // ---------- Phase 19: The Aurora Reach ----------
  if (st._toP19) {
    delete st._toP19;
    st.phase = 19;
    st.p18 = { started: true, sailed: true, shards: {}, woke: { coral: 1, mesa: 1, bamboo: 1, fen: 1, sky: 1 }, done: true };
    st.p19 = { started: true, sailed: false, stones: {}, freed: {}, done: false };
  }
  const p19 = initPhase19({ ctx, st, save, chime, redraw: () => drawPanel(), marisolAt: () => p17.marisolAt() });
  // ---------- Phase 20: The Falling Star ----------
  if (st._toP20) {
    delete st._toP20;
    st.phase = 20;
    st.p19 = { started: true, sailed: true, stones: {}, freed: { icehaven: 1, pinehold: 1, glacier: 1, crater: 1, northlight: 1 }, done: true };
    st.p20 = { started: true, parts: {}, keeper: false, done: false };
  }
  // (designer cheat) ?nextphase=1 → finish the phase you're on; the next one
  // begins a few seconds later, with its opening movie
  if (new URLSearchParams(location.search).get("nextphase")) {
    const n = st.phase;
    const o = (st["p" + n] ||= { started: true });
    if (n === 16) o.festival = true;
    else if (n >= 13) o.done = true;
    if (n === 18) Object.assign(o, { sailed: true, woke: { coral: 1, mesa: 1, bamboo: 1, fen: 1, sky: 1 } });
    if (n === 19) Object.assign(o, { sailed: true, freed: { icehaven: 1, pinehold: 1, glacier: 1, crater: 1, northlight: 1 } });
    save();
    setTimeout(() => ctx.say(n >= 29 ? "🌑 TESTING: Phase 29 marked finished — that's the last phase so far!" : n < 13 ? `⚠️ TESTING: ?nextphase only works from Phase 13 on (you're on Phase ${n}).` : `⏭️ TESTING: Phase ${n} finished — Phase ${n + 1} starts in a few seconds!`, true), 1500);
  }
  const p20 = initPhase20({ ctx, st, save, chime, redraw: () => drawPanel(), marisolAt: () => p17.marisolAt() });
  // ---------- Phase 21: The Dragon Roost ----------
  if (st._toP21) {
    delete st._toP21;
    st.phase = 21;
    st.p20 = { started: true, parts: { lens: 1, sunstone: 1, silk: 1 }, keeper: true, done: true };
    st.p21 = { started: true, been: false, lit: {}, eggs: {}, nest: false, done: false };
  }
  const p21 = initPhase21({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 22: The Great Storm ----------
  if (st._toP22) {
    delete st._toP22;
    st.phase = 22;
    st.p21 = { started: true, been: true, lit: { dawn: 1, storm: 1, frost: 1, jade: 1 }, eggs: { dawn: 1, storm: 1, frost: 1, jade: 1 }, nest: true, done: true };
    st.p22 = { started: true, been: false, rings: +(new URLSearchParams(location.search).get("p22rings") || 0), found: false, done: false };
  }
  const p22 = initPhase22({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 23: Raising the Dragonlings ----------
  if (st._toP23) {
    delete st._toP23;
    st.phase = 23;
    st.p22 = { started: true, been: true, rings: 8, found: true, done: true };
    st.p23 = { started: true, names: {}, fed: {}, hoops: 0, done: false };
  }
  const p23 = initPhase23({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 24: The Whispering Dunes ----------
  if (st._toP24) {
    delete st._toP24;
    st.phase = 24;
    st.p23 = { started: true, names: { dawn: "Ember", frost: "Snowdrop", jade: "Moss" }, fed: { dawn: 1, storm: 1, frost: 1, jade: 1 }, hoops: 3, done: true };
    st.p24 = { started: true, been: false, stones: {}, raised: false, done: false };
  }
  const p24 = initPhase24({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 25: The Festival of a Thousand Lanterns ----------
  if (st._toP25) {
    delete st._toP25;
    st.phase = 25;
    st.p24 = { started: true, been: true, stones: { dawn: 1, noon: 1, dusk: 1, night: 1 }, raised: true, done: true };
    st.p25 = { started: true, lit: {}, done: false };
  }
  const p25 = initPhase25({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 26: Sprig's Big Day ----------
  if (st._toP26) {
    delete st._toP26;
    st.phase = 26;
    st.p25 = { started: true, lit: { reedmere: 1, golden: 1, frostpine: 1, silverveil: 1 }, done: true };
    st.p26 = { started: true, riddles: 0, walk: 0, walkDone: false, kit: 0, done: false };
  }
  const p26 = initPhase26({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 27: The Sunken City of Coralmere ----------
  if (st._toP27) {
    delete st._toP27;
    st.phase = 27;
    st.p26 = { started: true, riddles: 3, walk: 99, walkDone: true, kit: 2, done: true };
    st.p27 = { started: true, met: false, lamps: {}, crossed: false, conchs: {}, done: false };
  }
  const p27 = initPhase27({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 28: The Clockwork Mountain ----------
  if (st._toP28) {
    delete st._toP28;
    st.phase = 28;
    st.p27 = { started: true, met: true, lamps: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 }, crossed: true, conchs: { 0: 1, 1: 1, 2: 1 }, done: true };
    st.p28 = { started: true, been: false, gears: {}, done: false };
  }
  const p28 = initPhase28({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 29: The Shadow Thief ----------
  if (st._toP29) {
    delete st._toP29;
    st.phase = 29;
    st.p28 = { started: true, been: true, gears: { plank: 1, piston: 1, chasm: 1, stairs: 1 }, done: true };
    st.p29 = { started: true, clues: {}, found: false, sat: false, done: false };
  }
  const p29 = initPhase29({ ctx, st, save, chime, redraw: () => drawPanel(), postFor: (c) => p25.postFor(c) });
  // ---------- Phase 30: The Glowcap Kingdom ----------
  if (st._toP30) {
    delete st._toP30;
    st.phase = 30;
    st.p29 = { started: true, clues: { reedmere: 1, golden: 1, frostpine: 1, silverveil: 1 }, found: true, sat: true, done: true };
    st.p30 = { started: true, been: false, crossed: false, knots: {}, freed: false, caps: {}, done: false };
  }
  const p30 = initPhase30({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 31: The Crystal Caverns ----------
  if (st._toP31) {
    delete st._toP31;
    st.phase = 31;
    st.p30 = { started: true, been: true, crossed: true, knots: { 0: 1, 1: 1, 2: 1 }, freed: true, caps: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 }, done: true };
    st.p31 = { started: true, been: false, crystals: {}, done: false };
  }
  const p31 = initPhase31({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 32 ----------
  if (st._toP32) {
    delete st._toP32;
    st.phase = 32;
    st.p31 = { started: true, been: true, crystals: { dawn: 1, sky: 1, leaf: 1, rose: 1, star: 1 }, done: true };
    st.p32 = { started: true, been: false, cups: {}, done: false };
  }
  const p32 = initPhase32({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 33 ----------
  if (st._toP33) {
    delete st._toP33;
    st.phase = 33;
    st.p32 = { started: true, been: true, cups: { bronze: true, silver: true, gold: true }, done: true };
    st.p33 = { started: true, been: false, carry: 0, gathered: {}, placed: false, done: false };
  }
  const p33 = initPhase33({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 34 ----------
  if (st._toP34) {
    delete st._toP34;
    st.phase = 34;
    st.p33 = { started: true, been: true, carry: 0, gathered: {}, placed: true, done: true };
    st.p34 = { started: true, been: false, prisms: {}, placed: false, keys: {}, done: false };
  }
  const p34 = initPhase34({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 35 ----------
  if (st._toP35) {
    delete st._toP35;
    st.phase = 35;
    st.p34 = { started: true, been: true, prisms: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, placed: true, keys: { 0: 1, 1: 1, 2: 1 }, done: true };
    st.p35 = { started: true, entered: false, lantern: 0, syl: {}, spirits: {}, done: false };
  }
  const p35 = initPhase35({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 36 ----------
  if (st._toP36) {
    delete st._toP36;
    st.phase = 36;
    st.p35 = { started: true, entered: true, lantern: 5, syl: {0: true, 1: true, 2: true}, spirits: {0: true, 1: true, 2: true}, done: true };
    st.p36 = { started: true, been: false, seeds: {}, done: false };
  }
  const p36 = initPhase36({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 37 ----------
  if (st._toP37) {
    delete st._toP37;
    st.phase = 37;
    st.p36 = { started: true, been: true, seeds: { bean: true, island: true, pot: true, can: true, gnome: true, bed: true }, done: true };
    st.p37 = { started: true, been: false, talked: false, shaken: {}, carry: 0, pile: 0, woke: false, golden: {}, placed: 0, done: false };
  }
  const p37 = initPhase37({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 38 ----------
  if (st._toP38) {
    delete st._toP38;
    st.phase = 38;
    st.p37 = { started: true, been: true, talked: true, shaken: { 0: true, 1: true, 2: true, 3: true, 4: true }, pile: 5, woke: true, golden: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }, placed: 7, done: true };
    st.p38 = { started: true, been: false, met: false, hacked: {}, ravine: false, river: false, found: {}, opened: false, done: false };
  }
  const p38 = initPhase38({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 39 ----------
  if (st._toP39) {
    delete st._toP39;
    st.phase = 39;
    st.p38 = { started: true, been: true, met: true, hacked: { 0: true, 1: true }, ravine: true, river: true, found: { tree: true, quick: true, cave: true }, opened: true, done: true };
    st.p39 = { started: true, been: false, met: false, crossed: false, jewels: {}, done: false };
  }
  const p39 = initPhase39({ ctx, st, save, chime, redraw: () => drawPanel() });
  // ---------- Phase 40 ----------
  if (st._toP40) {
    delete st._toP40;
    st.phase = 40;
    st.p39 = { started: true, been: true, met: true, crossed: true, jewels: { sapphire: true, diamond: true, ruby: true }, done: true };
    st.p40 = { started: true, sorted: false, letters: {}, decoded: false, deadline: 0, done: false };
  }
  const p40 = initPhase40({ ctx, st, save, chime, redraw: () => drawPanel() });
  // (designer cheat) ?gophase=N (13–40) → jump SAFELY to the start of phase N:
  // the phases before it are marked finished, nothing else is touched
  {
    const go = +(new URLSearchParams(location.search).get("gophase") || 0);
    if (go >= 13 && go <= 40) {
      for (let k = 13; k < go; k++) {
        const o = (st["p" + k] ||= {});
        o.started = true;
        if (k === 16) o.festival = true;
        else o.done = true;
        // (fill in what each finished phase's places look for)
        if (k === 13) Object.assign(o, { step: 4, lanterns: o.lanterns || { grove: true, lake: true, maze: true }, lit: o.lit || { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 } });
        if (k === 14) o.mirrors ||= [0, 0, 0, 0];
        if (k === 15) Object.assign(o, { notes: o.notes ?? 4, stars: o.stars || { 0: 1, 1: 1, 2: 1 } });
        if (k === 16) Object.assign(o, { asked: o.asked || {}, done: typeof o.done === "object" && o.done ? o.done : {} });
        if (k === 17) Object.assign(o, { met: true, sailed: true, items: o.items || { ember: 1, chart: 1, conch: 1 } });
        if (k === 18) Object.assign(o, { sailed: true, shards: o.shards || {}, woke: { coral: 1, mesa: 1, bamboo: 1, fen: 1, sky: 1 } });
        if (k === 19) Object.assign(o, { sailed: true, stones: o.stones || {}, freed: { icehaven: 1, pinehold: 1, glacier: 1, crater: 1, northlight: 1 } });
        if (k === 20) Object.assign(o, { parts: { lens: 1, sunstone: 1, silk: 1 }, keeper: true });
        if (k === 31) Object.assign(o, { been: true, crystals: { dawn: 1, sky: 1, leaf: 1, rose: 1, star: 1 } });
        if (k === 32) Object.assign(o, { been: true, cups: { bronze: true, silver: true, gold: true } });
        if (k === 33) Object.assign(o, { been: true, carry: 0, gathered: {}, placed: true });
        if (k === 34) Object.assign(o, { been: true, prisms: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, placed: true, keys: { 0: 1, 1: 1, 2: 1 } });
        if (k === 35) Object.assign(o, { entered: true, lantern: 5, syl: {0: true, 1: true, 2: true}, spirits: {0: true, 1: true, 2: true} });
        if (k === 36) Object.assign(o, { been: true, seeds: { bean: true, island: true, pot: true, can: true, gnome: true, bed: true } });
        if (k === 37) Object.assign(o, { been: true, talked: true, shaken: { 0: true, 1: true, 2: true, 3: true, 4: true }, pile: 5, woke: true, golden: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }, placed: 7 });
        if (k === 38) Object.assign(o, { been: true, met: true, hacked: { 0: true, 1: true }, ravine: true, river: true, found: { tree: true, quick: true, cave: true }, opened: true });
        if (k === 39) Object.assign(o, { been: true, met: true, crossed: true, jewels: { sapphire: true, diamond: true, ruby: true } });
        if (k === 30) Object.assign(o, { been: true, crossed: true, knots: { 0: 1, 1: 1, 2: 1 }, freed: true, caps: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 } });
        if (k === 29) Object.assign(o, { clues: { reedmere: 1, golden: 1, frostpine: 1, silverveil: 1 }, found: true, sat: true });
        if (k === 28) Object.assign(o, { been: true, gears: { plank: 1, piston: 1, chasm: 1, stairs: 1 } });
        if (k === 27) Object.assign(o, { met: true, lamps: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 }, crossed: true, conchs: { 0: 1, 1: 1, 2: 1 } });
        if (k === 26) Object.assign(o, { riddles: 3, walk: 99, walkDone: true, kit: 2 });
        if (k === 25) Object.assign(o, { lit: { reedmere: 1, golden: 1, frostpine: 1, silverveil: 1 } });
        if (k === 24) Object.assign(o, { been: true, stones: { dawn: 1, noon: 1, dusk: 1, night: 1 }, raised: true });
        if (k === 23) Object.assign(o, { names: o.names || { dawn: "Ember", frost: "Snowdrop", jade: "Moss" }, fed: { dawn: 1, storm: 1, frost: 1, jade: 1 }, hoops: 3 });
        if (k === 22) Object.assign(o, { been: true, rings: 8, found: true });
        if (k === 21) Object.assign(o, { been: true, lit: { dawn: 1, storm: 1, frost: 1, jade: 1 }, eggs: { dawn: 1, storm: 1, frost: 1, jade: 1 }, nest: true });
      }
      delete st["p" + go];
      st.phase = go;
      drawPanel(); // (this makes the phase's fresh checklist)
      if (st["p" + go]) st["p" + go].started = true;
      save();
      setTimeout(() => ctx.say(`⏭️ TESTING: you're at the start of Phase ${go}!${go >= 21 ? " Go outdoors and press 1 to call your dragon." : ""}`, true), 1500);
    }
  }
  // 🏡 C — the Life Goals (both lists), any time from Phase 12
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyC" || e.repeat || cutscenePlaying() || st.phase < 12) return;
    const el = document.getElementById("lifegoals");
    if (el) return el.remove();
    const box = document.createElement("div");
    box.id = "lifegoals";
    box.style.cssText = "position:fixed;inset:0;z-index:57;display:flex;align-items:center;justify-content:center;background:rgba(8,6,14,.45)";
    box.innerHTML = `<div id="lessons" style="position:static;width:min(420px,92vw);max-height:84vh;overflow:auto;display:block">${p12.goalsHTML()}${p13.done() ? "<hr>" + p13.goals2HTML() : ""}<div class="kit">C or Esc — close · these are optional, just for fun!</div></div>`;
    box.onclick = (ev) => ev.target === box && box.remove();
    document.body.appendChild(box);
  });
  window.addEventListener("keydown", (e) => e.code === "Escape" && document.getElementById("lifegoals") && document.getElementById("lifegoals").remove());

  // 📓 the journal (J) — Thistle writes in it once the backpack is found
  const journal = document.createElement("div");
  journal.id = "school-book";
  journal.className = "journal";
  document.body.appendChild(journal);
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyJ" || cutscenePlaying()) return;
    if (journal.classList.contains("open")) return journal.classList.remove("open");
    if (!p2.hasJournal()) return;
    const pages = p2.journal().map((t, i) => `<p><b>Day ${i < 2 ? 1 : i < 5 ? 2 : 3}.</b> ${t}</p>`).join("");
    journal.innerHTML = `<h2>Thistle's Journal</h2><h4>property of Thistle Mosswhisker, Fallen Log School</h4>${pages}<div class="close">J — close</div>`;
    journal.classList.add("open");
  });

  drawPanel();
  return {
    state: () => st,
    update,
    goal,
    onEat: () => p2.onEat(),
    chime: () => chime(),
    isMoonkeeper: () => p10.isMoonkeeper(),
    /** a Great City trusts you a little more */
    addRep: (city, n) => {
      st.rep ||= {};
      st.rep[city] = Math.min(5, (st.rep[city] || 0) + n);
      save();
      drawPanel();
    },
    /** redraw the checklist (things in it count what's in your pack) */
    refresh: () => drawPanel(),
    /** what's in the backpack besides materials */
    kitInfo: () => {
      const tools = [];
      if (st.done.craft) tools.push("🏮 Lantern");
      if (st.compass) tools.push("🧭 Wooden Compass");
      if (st.p2 && st.p2.done && st.p2.done.pack) tools.push("📓 Journal (J)", "🔪 Simple Knife");
      if (st.p3 && st.p3.rope) tools.push("🪢 Tinker's Rope");
      if (st.p3 && st.p3.scarf && !(st.p6 && st.p6.done && st.p6.done.reunion)) tools.push("🧣 Clover's Scarf");
      if (st.p6 && st.p6.wrench) tools.push("🔧 Engineer's Wrench");
      const p7 = st.p7 && st.p7.done ? st.p7.done : {};
      if (p7.letters && !p7.deliver) tools.push("📨 Letters for the school");
      if (p7.deliver && !p7.reply) tools.push("📜 The Headmaster's reply");
      if (p7.goods && !p7.lamp) tools.push("🔮 Crystal Lamp");
      if (p7.atlas && !p7.library) tools.push("📘 Roothaven Atlas");
      if (p7.library && !p7.tales) tools.push("📖 Tales of the Moonkeepers");
      if (p7.key) tools.push("🗝️ Moonkeeper crest-key");
      const A = st.abilities || {};
      const abilities = [];
      if (A.rope) abilities.push("🪢 Better Rope");
      if (A.spikes) abilities.push("🧗 Climbing Claws");
      if (A.lantern) abilities.push("🏮 Stronger Lantern");
      if (A.pack) abilities.push("🎒 Better Backpack");
      const rep = Object.entries(st.rep || {}).map(([k, n]) => `${({ roothaven: "Roothaven", school: "Fallen Log School", everbough: "Everbough", reedmere: "Reedmere", golden: "Golden Hollow", frostpine: "Frostpine" })[k] || k} ${"★".repeat(n)}${"☆".repeat(5 - n)}`);
      return { tools, abilities, rep };
    },
    onReadPip: () => p5.onReadPip(),
    moonDoorOpen: () => !!(st.p5 && st.p5.doorOpen),
    /** which places the Moonkeepers' roads reach, and the forest's relit stations */
    travelInfo: () => {
      const unlocked = ["forest"];
      if (st.p8 && st.p8.done && st.p8.done.road) unlocked.push("everbough");
      if (st.p6 && st.p6.done && st.p6.done.arrive) unlocked.push("roothaven");
      if (st.phase >= 9) unlocked.push("reedmere", "golden", "frostpine");
      if (ctx.silverveilOpen && ctx.silverveilOpen()) unlocked.push("silverveil");
      const stations = st.phase >= 9 && st.p4 && st.p4.stonesAt ? st.p4.stonesAt.filter((_, i) => st.p7 && st.p7.stations && st.p7.stations[i]) : [];
      return { unlocked, stations };
    },
    sealedDoor: () => p7.sealedDoor(),
    wheelOn: () => p6.wheelOn(),
    onGather: (bit) => p2.onGather(bit),
    onCraft: (name) => {
      p3.onCraft(name);
      p4.onCraft(name); // explorer's gear = new abilities, in any phase
    },
    /** does Thistle have this ability? ("rope", "spikes", "lantern", "pack") */
    has: (k) => p4.has(k),
    onStore: () => p3.onStore(),
    onDrink: () => p2.onDrink(),
    onFoxEscape: () => p2.onFoxEscape(),
    onFoxBite: () => p2.onFoxBite(),
    hidden: (x, z) => p2.hidden(x, z),
    interactable,
    get phase() { return st.phase; },
    /** a calm school day: no predators prowling while Phase 1 plays */
    calm: () => st.phase === 1 && st.started,
    hasLantern: () => !!st.done.craft,
    bookOpen,
    startIntro: intro,
  };
}
