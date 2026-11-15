// ------------------------------------------------------------
//  🌎  PHASE 9 — "The Other Great Cities"
//
//  Each city opens a whole new chapter of play. Visit them in any order
//  along the Moonkeepers' roads (the waystones, Everbough's Guild map, or
//  any relit Moonkeeper station):
//
//   🌊 REEDMERE (boats, navigation, fishing)
//        Harbormaster Brindle → catch 3 fish with Fisher Mallow → take the
//        reed raft through the 3 buoy gates → feed Lightkeeper Wick →
//        relight the Lighthouse of Reeds
//   🌾 GOLDEN HOLLOW (farming, animal care, cooking)
//        Harvest-Mother Barley → plant, water + harvest 3 plots (Farmer
//        Sprout) → feed the 3 hens (Henkeeper Dottie) → cook the Harvest
//        Stew at the great hearth → the Harvest Feast
//   ❄️ FROSTPINE (cold survival, mountaineering, woodworking)
//        Warden Ivo → light the 3 braziers up the ice ledges (stay WARM!)
//        → relight the Summit Beacon → carve a sled with Woodcarver Alder
//        (and ride it down!) → Keeper Hollis at the Hall of Everfrost
//
//  When all three join, the Five Great Cities are one again → Phase 10.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { CITY_INFO } from "./cities.js";
import { hasItem, warmthBonus } from "./cityLife.js";

const QUESTS = {
  reedmere: [
    ["meet", "Meet Harbormaster Brindle on the dock"],
    ["fish", "Catch 3 fish from the fishing jetty (Fisher Mallow)"],
    ["gates", "Raft through the 3 buoy gates to the island"],
    ["wick", "Bring the fish to Lightkeeper Wick"],
    ["light", "Relight the Lighthouse of Reeds"],
  ],
  golden: [
    ["meet", "Meet Harvest-Mother Barley at the Harvest Hall"],
    ["farm", "Plant, water & harvest the 3 plots (Farmer Sprout)"],
    ["hens", "Feed the 3 hens (Henkeeper Dottie)"],
    ["cook", "Cook the Harvest Stew at the great hearth"],
  ],
  frostpine: [
    ["meet", "Meet Warden Ivo by the gate"],
    ["braziers", "Light the 3 braziers up the ice ledges"],
    ["beacon", "Relight the Summit Beacon"],
    ["sled", "Carve a sled with Woodcarver Alder"],
    ["hall", "Visit Keeper Hollis at the Hall of Everfrost"],
  ],
};
const ORDER = ["reedmere", "golden", "frostpine"];

export function initPhase9(api) {
  const { ctx, st, save, chime, redraw } = api;
  st.p9 ||= { reedmere: { done: {} }, golden: { done: {} }, frostpine: { done: {} } };
  st.rep ||= {};
  const p9 = st.p9;
  const me = () => ctx.mouseRig.position;
  const write = (t) => {
    if (st.p2) st.p2.journal.push(t);
    save();
  };
  const C = () => ctx.city(); // the city you're in (or null)
  const here = () => (C() ? C().id : null);
  const q = (id) => p9[id];
  const current = (id) => QUESTS[id].map(([k]) => k).find((k) => !q(id).done[k]) || null;
  const joined = (id) => !current(id);
  const addRep = (id, n) => {
    st.rep[id] = Math.min(5, (st.rep[id] || 0) + n);
    save();
    redraw();
    ctx.say(`⭐ ${CITY_INFO[id].name} trusts you more! (${"★".repeat(st.rep[id])}${"☆".repeat(5 - st.rep[id])})`);
  };
  function complete(id, key, msg) {
    if (q(id).done[key]) return;
    q(id).done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg, true);
    if (joined(id)) cityJoins(id);
  }
  function cityJoins(id) {
    addRep(id, 3);
    write(`${CITY_INFO[id].name}, ${CITY_INFO[id].sub}, has joined the old friendship of the Great Cities!`);
    if (ORDER.every(joined)) setTimeout(allJoined, 1500);
  }

  // ---------- talking (on the city's own ground) ----------
  function talk(p, lines, after) {
    const city = C();
    const m = me();
    p.mesh.userData.lookAt = m;
    ctx.mouseRig.rotation.y = Math.atan2(p.x - m.x, p.z - m.z);
    const dx = m.x - p.x;
    const dz = m.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    const head = [p.x, city.height(p.x, p.z) + 0.65 * p.mesh.scale.x, p.z];
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
  const near = (x, z, r = 2.6) => Math.hypot(me().x - x, me().z - z) < r;
  const meCam = () => [me().x - 1.6, me().y + 1.1, me().z - 1.2];
  const meLook = () => [me().x, me().y + 0.6, me().z];

  // ---------- 🌊 REEDMERE ----------
  const fishing = { on: false, bite: false, t: 0, bobber: null };
  function fishInteract(city) {
    const R = q("reedmere");
    const P = city.props;
    if (!fishing.on) {
      return { label: "cast your line", act: () => {
        fishing.on = true;
        fishing.bite = false;
        fishing.t = (2 + Math.random() * 3) * (hasItem("lure") ? 0.5 : 1); // seconds till a nibble (🪝 Golden Lure: faster)
        if (!fishing.bobber) {
          fishing.bobber = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4a3a }));
          city.group.add(fishing.bobber);
        }
        fishing.bobber.visible = true;
        fishing.bobber.position.set(P.bobberAt.x, 0.3, P.bobberAt.z);
        ctx.say("🎣 Wait for the bobber to dip… then press E!");
      } };
    }
    return { label: fishing.bite ? "REEL IN! (now!)" : "wait for a bite…", act: () => {
      if (!fishing.bite) {
        ctx.say("🎣 Too soon — the fish swims off. Cast again!");
        stopFishing();
        return;
      }
      stopFishing();
      R.fish = (R.fish || 0) + 1;
      ctx.addToPack("Fish", 1);
      chime();
      save();
      redraw();
      if (R.fish >= 3) complete("reedmere", "fish", "🐟 Three fish! Fisher Mallow lends you a reed raft — on the water you'll paddle FAST. Head through the buoy gates to the island!");
      else ctx.say(`🐟 Caught one! (${R.fish}/3) Cast again.`);
    } };
  }
  function stopFishing() {
    fishing.on = false;
    fishing.bite = false;
    if (fishing.bobber) fishing.bobber.visible = false;
  }
  function reedmereInteract(city) {
    const R = q("reedmere");
    const step = current("reedmere");
    const P = city.props;
    const pp = city.people;
    if (near(pp.harbor.x, pp.harbor.z)) {
      if (step === "meet") return { label: "talk to Harbormaster Brindle", act: () => talk(pp.harbor, [
        ["", "A traveler — by the OLD road? Bless my whiskers. You've come to Reedmere on a dark day, friend."],
        ["", "The Lighthouse of Reeds went out in the last storm. Old Wick the lightkeeper is stuck out on the island, and the raft-folk can't find home at night."],
        ["you", "How do I get out there?"],
        ["", "By raft, how else? See Fisher Mallow on the jetty — and catch Wick some supper while you're at it. He'll be starving."],
      ], () => complete("reedmere", "meet", "🎣 Find Fisher Mallow on the fishing jetty (east).")) };
      return { label: "talk to Harbormaster Brindle", act: () => talk(pp.harbor, [["", joined("reedmere") ? "Look at her shine! Reedmere will never forget you, friend." : "The island's out past the buoys. Mind the gates — they mark the safe water."]]) };
    }
    if (near(pp.mallow.x, pp.mallow.z) && step !== "fish") {
      return { label: "talk to Fisher Mallow", act: () => talk(pp.mallow, [["", step === "meet" ? "Talk to the Harbormaster first, love." : "Keep that raft — every Reedmere mouse should have one."]]) };
    }
    if (step === "fish") {
      if (near(pp.mallow.x, pp.mallow.z) && !R.mallowTalked) return { label: "talk to Fisher Mallow", act: () => talk(pp.mallow, [
        ["", "Fishing? Easy as breathing. Walk to the end of the jetty, press E to cast…"],
        ["", "…then watch the red bobber. When it DIPS — splash! — press E again, quick as you can. Three fish for old Wick, now."],
      ], () => { R.mallowTalked = true; save(); }) };
      if (R.mallowTalked && near(P.fishSpot.x, P.fishSpot.z, 2.2)) return fishInteract(city);
    }
    if (step === "wick" && near(pp.wick.x, pp.wick.z)) {
      return { label: "give Lightkeeper Wick the fish", act: () => talk(pp.wick, [
        ["", "Fish?! Fresh fish?! Oh, you blessed creature. Three days on this rock with nothing but reeds to chew…"],
        ["", "Now — the lamp. The storm blew out the flame and my paws are too shaky. Climb up and press E by the lamp-door at the tower's foot; I'll talk you through it."],
      ], () => { ctx.packTake("Fish", 3); complete("reedmere", "wick", "💡 Relight the Lighthouse of Reeds — E at the tower's foot."); }) };
    }
    if (step === "light" && near(0, 3.6, 3)) {
      return { label: "relight the Lighthouse of Reeds", act: () => {
        const L = P.light;
        playCutscene([
          { dur: 3, from: [8, 6, 14], to: [10, 14, 20], look: [0, 16, 0], text: "Up the reed stair, round and round… you strike the flint." },
          { dur: 4, from: [10, 14, 20], to: [24, 26, 40], look: [0, 18, 0], text: "WHOOMPH — the great lamp blazes, and its beam sweeps out across the lagoon.",
            run: () => {
              L.lamp.material.color.set(0xffe6a0);
              L.beam.visible = true;
              L.beamLight.intensity = 60;
            } },
          { dur: 3.4, from: [6, 3, 10], look: [3.4, 1.4, 4.8], who: "Lightkeeper Wick", text: "Reedmere is a city of the water again. Tell your Alliance we're IN, little friend!" },
          { dur: 0.4, gameCam: true, end: () => complete("reedmere", "light", "🌊 Reedmere joins the Great Cities!") },
        ]);
      } };
    }
    return null;
  }

  // ---------- 🌾 GOLDEN HOLLOW ----------
  function goldenInteract(city) {
    const G = q("golden");
    const step = current("golden");
    const P = city.props;
    const pp = city.people;
    G.plots ||= {};
    G.hens ||= {};
    if (near(pp.barley.x, pp.barley.z)) {
      if (step === "meet") return { label: "talk to Harvest-Mother Barley", act: () => talk(pp.barley, [
        ["", "Well I never — a guest from the old roads! And you've come just in time for the Harvest Feast… that we can't hold."],
        ["", "Our Feast has fed every mouse in Golden Hollow for three hundred years. But the gardens failed, the hens are off their feed, and the great pot is cold."],
        ["you", "I'll help! What do I do first?"],
        ["", "Farmer Sprout needs paws in the vegetable plots, and Dottie needs help with her hens. Then you and I will cook."],
      ], () => complete("golden", "meet", "🌱 Help Farmer Sprout in the plots by the Harvest Hall.")) };
      if (step === "cook") return { label: "cook the Harvest Stew with Barley", act: cook };
      return { label: "talk to Harvest-Mother Barley", act: () => talk(pp.barley, [["", joined("golden") ? "The Feast will be sung about for another three hundred years!" : "Vegetables and eggs, love — then we cook!"]]) };
    }
    if (step === "farm") {
      if (near(pp.sprout.x, pp.sprout.z) && !G.sproutTalked) return { label: "talk to Farmer Sprout", act: () => talk(pp.sprout, [
        ["", "Three plots, three crops: carrots, beets and squash. PLANT the seeds (E), fill the can at the pump and WATER them (E), then watch 'em grow!"],
        ["", "Golden Hollow soil is magic — they're up in a minute. Then HARVEST."],
      ], () => { G.sproutTalked = true; save(); }) };
      if (G.sproutTalked) {
        if (near(P.pump.x, P.pump.z, 2.2) && !G.can) return { label: "fill the watering can at the pump", act: () => { G.can = 3; save(); redraw(); ctx.say("💧 The can is full — water each planted plot."); } };
        for (let i = 0; i < 3; i++) {
          const pl = P.plots[i];
          const s = G.plots[i] || 0; // 0 bare, 1 planted, 2 watered/growing, 3 ripe, 4 harvested
          if (!near(pl.x, pl.z, 2.8)) continue;
          if (s === 0) return { label: "plant the seeds", act: () => { G.plots[i] = 1; plotLook(city); save(); redraw(); ctx.say("🌱 Planted! Now water it."); } };
          if (s === 1) return G.can > 0
            ? { label: "water the plot", act: () => { G.can--; G.plots[i] = 2; G.grow ||= {}; G.grow[i] = 0; plotLook(city); save(); redraw(); ctx.say("💧 Watered — watch it grow!"); } }
            : { label: "the plot needs water", act: () => ctx.say("💧 Fill the watering can at the pump first.") };
          if (s === 3) return { label: "harvest the vegetables", act: () => {
            G.plots[i] = 4;
            plotLook(city);
            ctx.addToPack(["Carrots", "Beets", "Squash"][i], 3);
            ctx.bite();
            save();
            redraw();
            if ([0, 1, 2].every((k) => G.plots[k] === 4)) complete("golden", "farm", "🥕 A fine harvest! Now Henkeeper Dottie's hens, by the pen (east).");
            else ctx.say("🧺 Harvested!");
          } };
        }
      }
    }
    if (step === "hens") {
      if (near(pp.dottie.x, pp.dottie.z) && !G.dottieTalked) return { label: "talk to Henkeeper Dottie", act: () => talk(pp.dottie, [
        ["", "My girls won't lay a single egg — they're sulking! A little corn from a kind paw might cheer them. Walk up to each hen and press E."],
      ], () => { G.dottieTalked = true; save(); }) };
      if (G.dottieTalked) {
        for (const h of P.hens) {
          if (G.hens[h.k] || h.x === undefined || !near(h.x, h.z, 2)) continue;
          return { label: "feed the hen some corn", act: () => {
            G.hens[h.k] = true;
            ctx.addToPack("Egg", 1);
            chime();
            save();
            redraw();
            if (Object.keys(G.hens).length >= 3) complete("golden", "hens", "🥚 Happy hens — and fresh eggs! Back to Harvest-Mother Barley at the great hearth.");
            else ctx.say(`🐔 Cluck! She lays an egg for you. (${Object.keys(G.hens).length}/3)`);
          } };
        }
      }
    }
    if (step === "cook" && near(P.hearth.x, P.hearth.z, 3)) return { label: "cook the Harvest Stew", act: cook };
    return null;
  }
  function plotLook(city) {
    const G = q("golden");
    city.props.plots.forEach((pl, i) => {
      const s = (G.plots || {})[i] || 0;
      pl.crop.visible = s >= 2 && s < 4;
      const k = s === 2 ? Math.min(1, ((G.grow || {})[i] || 0) / 30) : 1;
      pl.crop.scale.setScalar(0.2 + k * 0.8);
      pl.crop.children.forEach((c) => c.userData.veg && (c.visible = s === 3));
    });
  }
  function cook() {
    const city = C();
    const H = city.hearth || city.props.hearth;
    const y = city.height(H.x, H.z);
    return playCutscene([
      { dur: 3, from: [H.x + 4, y + 3, H.z + 4], look: [H.x, y + 1.6, H.z], who: "Harvest-Mother Barley", text: "Carrots in… beets in… squash, and a little cream from the dairy…" },
      { dur: 3, from: [H.x + 2.5, y + 3.2, H.z + 2.5], look: [H.x, y + 1.6, H.z], text: "You stir, and stir, and stir. The smell drifts out across every field in Golden Hollow." },
      { dur: 3.4, from: [H.x + 18, y + 10, H.z + 26], to: [H.x + 10, y + 6, H.z + 16], look: [H.x, y + 2, H.z - 8], text: "That evening the long tables fill the yard — the Harvest Feast, for the three hundredth year." },
      { dur: 3, from: [H.x + 2, y + 1.6, H.z + 3], look: [H.x + 3.6, y + 0.8, H.z - 1], who: "Harvest-Mother Barley", text: "Golden Hollow will feed the Alliance again, as it always did. Bless you, child." },
      { dur: 0.4, gameCam: true, end: () => {
        for (const k of ["Carrots", "Beets", "Squash"]) ctx.packTake(k, 3);
        ctx.packTake("Egg", 3);
        complete("golden", "cook", "🌾 Golden Hollow joins the Great Cities!");
      } },
    ]);
  }

  // ---------- ❄️ FROSTPINE ----------
  function frostInteract(city) {
    const F = q("frostpine");
    const step = current("frostpine");
    const P = city.props;
    const pp = city.people;
    if (near(pp.ivo.x, pp.ivo.z)) {
      if (step === "meet") return { label: "talk to Warden Ivo", act: () => talk(pp.ivo, [
        ["", "HALT — oh. A little one, on the old road, in THIS cold? Get by the fire, quick!"],
        ["", "Listen well: out here the cold bites. Your warmth runs down away from a fire — stand near flames to warm up again."],
        ["", "The Summit Beacon blew out in the storm. Without it, travelers lose the pass and freeze. Light the three braziers up the ice ledges as you climb — then the Beacon at the top."],
      ], () => complete("frostpine", "meet", "🔥 Climb the ice ledges up the great rock (north), lighting the braziers on the way.")) };
      return { label: "talk to Warden Ivo", act: () => talk(pp.ivo, [["", joined("frostpine") ? "The pass is safe again. Frostpine owes you, small one." : "Stay warm! Fires are your friends up here."]]) };
    }
    if (step === "braziers") {
      for (let i = 0; i < 3; i++) {
        const b = P.braziers[i];
        if (b.on || !near(b.x, b.z, 2.6) || Math.abs(me().y - b.y) > 2) continue;
        return { label: "light the brazier", act: () => {
          b.on = true;
          F.braziers = (F.braziers || 0) + 1;
          chime();
          save();
          redraw();
          if (F.braziers >= 3) complete("frostpine", "braziers", "🔥 All three braziers burn! Keep climbing to the Summit Beacon.");
          else ctx.say(`🔥 Warm at last! (${F.braziers}/3) Keep climbing.`);
        } };
      }
    }
    if (step === "beacon") {
      const B = P.beacon;
      if (near(B.x, B.z, 4) && me().y > B.y - 1.5) return { label: "relight the Summit Beacon", act: () => {
        playCutscene([
          { dur: 3.4, from: () => [B.x + 6, B.y + 4, B.z + 6], look: [B.x, B.y + 2, B.z], text: "You pile on dry pine and strike your flint…" },
          { dur: 4, from: [B.x + 10, B.y + 8, B.z + 14], to: [B.x + 30, B.y + 22, B.z + 50], look: [B.x, B.y + 3, B.z], text: "…and the Summit Beacon ROARS into flame. Far below, in the snowy pass, every traveler can see the way.",
            run: () => (B.on = true) },
          { dur: 0.4, gameCam: true, end: () => complete("frostpine", "beacon", "🪵 Woodcarver Alder (by the east cabin) wants to see the mouse who lit the Beacon.") },
        ]);
      } };
    }
    if (near(pp.alder.x, pp.alder.z) || near(P.bench.x, P.bench.z, 2.6)) {
      if (step === "sled") return { label: "carve a sled with Woodcarver Alder", act: () => {
        const S = city.spots.summit;
        playCutscene([
          { dur: 3, from: [P.bench.x + 3, city.height(P.bench.x, P.bench.z) + 2.6, P.bench.z + 3], look: [P.bench.x, city.height(P.bench.x, P.bench.z) + 1, P.bench.z], who: "Woodcarver Alder", text: "The storm brought down a fine pine up top. Hold the plane steady — long strokes, with the grain…" },
          { dur: 3, from: [P.bench.x + 2, city.height(P.bench.x, P.bench.z) + 2, P.bench.z + 2.5], look: [P.bench.x, city.height(P.bench.x, P.bench.z) + 1, P.bench.z], text: "Shavings curl away. Runners, a seat, a little rope to steer. A real Frostpine sled!" },
          { dur: 2.4, who: "Woodcarver Alder", from: [P.bench.x + 2, city.height(P.bench.x, P.bench.z) + 2, P.bench.z + 2.5], look: [P.bench.x, city.height(P.bench.x, P.bench.z) + 1, P.bench.z], text: "Well? A sled's not finished till it's ridden. Off you go!" },
          { dur: 4.5, from: [S.x + 8, S.y + 4, S.z + 12], to: [8, city.height(8, 40) + 3, 40], lookFrom: [S.x, S.y, S.z + 14], lookTo: [0, city.height(0, 60), 60], text: "WHEEEEE—! Down the long snowy slope, faster and faster, snow flying everywhere!",
            end: () => ctx.placePlayer(4, 50, Math.PI) },
          { dur: 0.4, gameCam: true, end: () => { ctx.addToPack("Sled", 1); complete("frostpine", "sled", "🛷 What a ride! Now visit Keeper Hollis at the Hall of Everfrost (west)."); } },
        ]);
      } };
      if (near(pp.alder.x, pp.alder.z)) return { label: "talk to Woodcarver Alder", act: () => talk(pp.alder, [["", step === "meet" || step === "braziers" || step === "beacon" ? "Light the Beacon, then we'll talk woodwork." : "That sled'll outlast us both."]]) };
    }
    if (step === "hall" && near(pp.hollis.x, pp.hollis.z)) {
      return { label: "talk to Keeper Hollis", act: () => talk(pp.hollis, [
        ["", "The Hall of Everfrost keeps Frostpine's memory in its ice — every name, every winter, every friend."],
        ["", "Your name goes in the ice today, little Moonkeeper's helper. And Frostpine's name goes back on the Alliance roll — where it belongs."],
      ], () => complete("frostpine", "hall", "❄️ Frostpine joins the Great Cities!")) };
    }
    return null;
  }

  // ---------- all five, together ----------
  function allJoined() {
    return playCutscene([
      { dur: 1.2, fadeOut: true, gameCam: true },
      { dur: 3.6, black: true, gameCam: true, text: "Roothaven. Everbough. Reedmere. Golden Hollow. Frostpine." },
      { dur: 3.6, black: true, gameCam: true, text: "For the first time in a hundred years, all five Great Cities know each other's names again." },
      { dur: 3.6, black: true, gameCam: true, text: "And everywhere along the old roads, mice are starting to say a word nobody has said in a century: Moonkeeper." },
      { dur: 3.6, black: true, gameCam: true, who: "WhiskerWood", text: "Phase 9 · The Other Great Cities — complete." },
      { dur: 1.2, fadeIn: true, gameCam: true, end: () => {
        st.phase = 10;
        write("All five Great Cities are friends again: Roothaven, Everbough, Reedmere, Golden Hollow and Frostpine. People keep calling me 'Moonkeeper'.");
        save();
        redraw();
        ctx.say("🐭 Phase 9 complete! Phase 10 — Becoming a Moonkeeper — is next.", true);
        if (api.onDone) setTimeout(api.onDone, 600);
      } },
    ]);
  }

  // ---------- E ----------
  function interactable() {
    if (st.phase < 9) return null;
    const city = C();
    if (!city || st.phase !== 9) return null;
    if (city.id === "reedmere") return reedmereInteract(city);
    if (city.id === "golden") return goldenInteract(city);
    if (city.id === "frostpine") return frostInteract(city);
    return null;
  }

  // ---------- the beacon + per-frame ----------
  const beacons = {};
  const beaconFor = (city) => {
    if (beacons[city.id]) return beacons[city.id];
    const b = new THREE.Group();
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc860, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(4);
    h.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 20;
    b.add(h, beam);
    b.userData = { h, beam };
    city.group.add(b);
    return (beacons[city.id] = b);
  };
  function target(city) {
    const id = city.id;
    const step = current(id);
    if (!step) return null;
    const P = city.props;
    const pp = city.people;
    const at = (o) => ({ x: o.x, z: o.z, y: o.y });
    if (id === "reedmere") {
      const R = q(id);
      if (step === "meet") return at(pp.harbor);
      if (step === "fish") return R.mallowTalked ? at(P.fishSpot) : at(pp.mallow);
      if (step === "gates") return at(P.gates[R.gate || 0] || city.spots.island);
      if (step === "wick") return at(pp.wick);
      return { x: 0, z: 3.6 };
    }
    if (id === "golden") {
      const G = q(id);
      if (step === "meet" || step === "cook") return at(P.hearth);
      if (step === "farm") {
        if (!G.sproutTalked) return at(pp.sprout);
        const i = [0, 1, 2].find((k) => (G.plots || {})[k] !== 4 && (G.plots || {})[k] !== 2);
        if (i !== undefined && (G.plots || {})[i] === 1 && !G.can) return at(P.pump);
        return i === undefined ? null : at(P.plots[i]);
      }
      if (step === "hens") return G.dottieTalked ? at(city.spots.pen) : at(pp.dottie);
    }
    if (id === "frostpine") {
      if (step === "meet") return at(pp.ivo);
      if (step === "braziers") {
        const b = P.braziers.find((x) => !x.on);
        return b ? at(b) : null;
      }
      if (step === "beacon") return at(P.beacon);
      if (step === "sled") return at(pp.alder);
      return at(pp.hollis);
    }
    return null;
  }
  // warmth (Frostpine)
  const warmEl = document.createElement("div");
  warmEl.style.cssText = "position:fixed;left:14px;bottom:42px;z-index:6;display:none;font:12px system-ui;color:#dff;";
  warmEl.innerHTML = `❄️ Warmth <span style="display:inline-block;width:140px;height:9px;border-radius:5px;background:rgba(0,0,0,.4);vertical-align:middle;overflow:hidden"><span id="warm-fill" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#6ac8ff,#ffb060)"></span></span>`;
  document.body.appendChild(warmEl);
  let warmth = 1;
  window.addEventListener("ww-warm", () => (warmth = 1)); // ☕ Hot Cocoa
  let coldHurt = 0;
  let restored = false;
  const devAt = new URLSearchParams(location.search).get("p9city");
  function update(dt, t) {
    if (st.phase < 9 || !ctx.quadMouse()) return;
    roadsUpdate(t);
    if (!restored) {
      restored = true;
      if (devAt && CITY_INFO[devAt]) ctx.goCity(devAt);
    }
    const city = C();
    warmEl.style.display = city && city.id === "frostpine" ? "" : "none";
    if (!city) {
      ctx.setRaft(false);
      return;
    }
    // re-apply saved progress to the city's props once
    if (!city._p9) {
      city._p9 = true;
      if (city.id === "frostpine") {
        const F = q("frostpine");
        city.props.braziers.forEach((b, i) => (b.on = i < (F.braziers || 0)));
        city.props.beacon.on = !!F.done.beacon;
      }
      if (city.id === "reedmere" && q("reedmere").done.light) {
        const L = city.props.light;
        L.lamp.material.color.set(0xffe6a0);
        L.beam.visible = true;
        L.beamLight.intensity = 60;
      }
      if (city.id === "golden") plotLook(city);
    }
    // 🌊 Reedmere: the raft, the buoy gates, the fish
    if (city.id === "reedmere") {
      const R = q("reedmere");
      ctx.setRaft(!!R.done.fish);
      if (current("reedmere") === "gates") {
        const g = city.props.gates[R.gate || 0];
        if (g && near(g.x, g.z, 3)) {
          R.gate = (R.gate || 0) + 1;
          g.ring.material.color.set(0x6aff8a);
          chime();
          save();
          redraw();
          if (R.gate >= 3) complete("reedmere", "gates", "🛶 Through every gate! Paddle on to the island landing.");
          else ctx.say(`🛶 Gate ${R.gate}/3!`);
        }
      }
      city.props.gates.forEach((g, i) => g.ring.material.color.set(i < (R.gate || 0) ? 0x6aff8a : i === (R.gate || 0) ? 0xffb040 : 0x8a7a5a));
      if (fishing.on) {
        if (!near(city.props.fishSpot.x, city.props.fishSpot.z, 3)) stopFishing();
        else if (!fishing.bite) {
          fishing.t -= dt;
          fishing.bobber.position.y = 0.3 + Math.sin(t * 3) * 0.04;
          if (fishing.t <= 0) {
            fishing.bite = true;
            fishing.window = 1.2;
            ctx.say("‼️ A BITE! Press E!");
          }
        } else {
          fishing.bobber.position.y = 0.05 + Math.sin(t * 20) * 0.08; // splashing
          fishing.window -= dt;
          if (fishing.window <= 0) {
            ctx.say("🎣 The fish got away! Cast again.");
            stopFishing();
          }
        }
      }
    } else ctx.setRaft(false);
    // 🌾 Golden Hollow: crops grow
    if (city.id === "golden") {
      const G = q("golden");
      let changed = false;
      for (let i = 0; i < 3; i++) {
        if ((G.plots || {})[i] !== 2) continue;
        G.grow[i] = (G.grow[i] || 0) + dt;
        if (G.grow[i] >= 30) {
          G.plots[i] = 3;
          changed = true;
          ctx.say("🥕 A plot is ripe — harvest it!");
        }
      }
      plotLook(city);
      if (changed) {
        save();
        redraw();
      }
    }
    // ❄️ Frostpine: warmth
    if (city.id === "frostpine") {
      const p = me();
      if (city.warmAt(p.x, p.y, p.z)) warmth = Math.min(1, warmth + dt * 0.35);
      else warmth = Math.max(0, warmth - dt / (70 * (1 + warmthBonus()))); // (only clothes you're WEARING count)
      const fill = document.getElementById("warm-fill");
      if (fill) fill.style.width = warmth * 100 + "%";
      if (warmth <= 0) {
        coldHurt -= dt;
        if (coldHurt <= 0) {
          coldHurt = 3;
          ctx.hurt(4);
          ctx.say("🥶 Too cold! Find a fire — quick!");
        }
      }
    } else warmth = 1;
    // the golden beacon
    const b = beaconFor(city);
    // (city done? the beacon shows its waystone — on to the next city)
    // (only the three Great Cities have Phase 9 tasks — not Silverveil or the quest zones)
    const tg = st.phase === 9 && QUESTS[city.id] ? target(city) || (ORDER.every(joined) ? null : city.spots.waystone) : null;
    b.visible = !!tg;
    if (tg) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      b.position.set(tg.x, tg.y ?? city.height(tg.x, tg.z), tg.z);
      b.userData.h.material.opacity = 0.55 + pulse * 0.4;
      b.userData.beam.material.opacity = 0.18 + pulse * 0.16;
    }
  }

  // ---------- the way to the roads (outside the new cities) ----------
  const extra = {};
  const roadBeacon = (key, parent) => {
    if (extra[key]) return extra[key];
    const b = new THREE.Group();
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9fd8ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    h.scale.setScalar(4);
    h.position.y = 1;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.8, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 20;
    b.add(h, beam);
    b.userData = { h, beam };
    parent.add(b);
    return (extra[key] = b);
  };
  const roadsNeeded = () => st.phase === 9 && !ORDER.every(joined);
  function roadsUpdate(t) {
    const w = ctx.world();
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    const show = (b, x, y, z) => {
      b.visible = true;
      b.position.set(x, y, z);
      b.userData.h.material.opacity = 0.55 + pulse * 0.4;
      b.userData.beam.material.opacity = 0.2 + pulse * 0.16;
    };
    const eb = roadBeacon("everbough", ctx.cityGroup);
    const rb = roadBeacon("roothaven", ctx.roothaven.group);
    eb.visible = rb.visible = false;
    if (!roadsNeeded()) return;
    if (w === "everbough") show(eb, -29, ctx.cityHeight(-29, 4), 4); // the Guild map table
    if (w === "roothaven") {
      const A = ctx.roothaven.spots.arrive;
      show(rb, A.x, ctx.roothaven.height(A.x, A.z), A.z);
    }
  }
  /** minimap (forest): the nearest relit Moonkeeper station */
  function goal() {
    if (!roadsNeeded() || ctx.world() !== "outside") return null;
    const stones = (st.p4 && st.p4.stonesAt) || [];
    let best = null;
    let bd = Infinity;
    stones.forEach((s, i) => {
      if (!(st.p7 && st.p7.stations && st.p7.stations[i])) return;
      const d = Math.hypot(s.x - me().x, s.z - me().z);
      if (d < bd) { bd = d; best = s; }
    });
    return best;
  }

  // ---------- list ----------
  function panelHTML() {
    const rows = [];
    for (const id of ORDER) {
      const info = CITY_INFO[id];
      const cur = current(id);
      if (!cur) {
        rows.push(`<li class="done">✔ ${info.icon} ${info.name}</li>`);
        continue;
      }
      const isHere = here() === id;
      rows.push(`<li class="${isHere ? "next" : ""}">${info.icon} ${info.name} <span class="res">— ${info.sub}</span></li>`);
      if (isHere) {
        for (const [k, label] of QUESTS[id]) {
          let text = label;
          if (k === "fish") text += ` (${q(id).fish || 0}/3)`;
          if (k === "gates") text += ` (${q(id).gate || 0}/3)`;
          if (k === "braziers") text += ` (${q(id).braziers || 0}/3)`;
          if (k === "hens") text += ` (${Object.keys(q(id).hens || {}).length}/3)`;
          rows.push(`<li class="sub ${q(id).done[k] ? "done" : ""}">${q(id).done[k] ? "✔" : "○"} ${text}</li>`);
        }
      }
    }
    const rep = (k) => "★".repeat(st.rep[k] || 0) + "☆".repeat(5 - (st.rep[k] || 0));
    return `<h3>🌎 The Other Great Cities</h3><ul>${rows.join("")}</ul><div class="kit">${here() ? "" : "✨ Follow the trail to a travel point, then press E to travel the Moonkeepers' roads.<br>"}${ORDER.map((id) => `${CITY_INFO[id].name} ${rep(id)}`).join("<br>")}</div>`;
  }

  return { update, interactable, panelHTML, goal, start: () => {
    redraw();
    ctx.say("🛤️ Phase 9: visit the other Great Cities! Press E at a waystone or Moonkeeper station to travel the old roads.", true);
  } };
}
