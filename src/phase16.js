// ------------------------------------------------------------
//  🎆  PHASE 16 — "The Gathering of the Six Cities"
//
//  For the first time in four hundred years, all SIX cities will meet —
//  at a great Moonkeepers' Festival in Silverveil. Carry an invitation to
//  every city's leader. Each asks one small favour first. Then: the
//  Festival, fireworks over the moon-pool… and a strange sail on the
//  horizon of the Open Sea. (The story keeps going!)
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";

const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
registerKeepsake("highmoonkeeper", "👑", "Crown of the High Moonkeeper (leader of all six cities' Moonkeepers)");

// the six leaders: where they are, and the favour they ask
const LEADERS = [
  { key: "brindle", name: "Harbormaster Brindle", city: "reedmere", cityName: "Reedmere", find: (c) => c.people && c.people.harbor,
    ask: "“A festival? For ALL six cities? Bless my barnacles! I'll come — if you bring 3 fish for the harbour feast.”", need: [["Fish", 3]] },
  { key: "barley", name: "Harvest-Mother Barley", city: "golden", cityName: "Golden Hollow", find: (c) => c.people && c.people.barley,
    ask: "“Of course I'll come! But nobody arrives at a feast empty-pawed. Cook me any dish at the Great Cauldron and bring it here.”", need: [["dish", 1]] },
  { key: "ivo", name: "Warden Ivo", city: "frostpine", cityName: "Frostpine", find: (c) => c.people && c.people.ivo,
    ask: "“The Wardens will come — and we'll bring the bonfire! I just need 6 twigs to start it.”", need: [["Twigs", 6]] },
  { key: "oriel", name: "Root Speaker Oriel", city: "roothaven", cityName: "Roothaven", find: (c, ctx) => ctx.roothaven && ctx.roothaven.people.find((p) => p.key === "speaker"),
    ask: "“Roothaven will light the Festival lanterns! Bring me 3 crystal fragments to set inside them.”", need: [["Crystal Fragments", 3]] },
  { key: "sage", name: "Elder Sage", city: "everbough", cityName: "Everbough", find: () => ({ x: 9, z: -14 }),
    ask: "“The Grand Library will write it all down. I'll need ancient seeds to plant a Festival Tree — 2 of them, please.”", need: [["Ancient Seeds", 2]] },
  { key: "keeper", name: "The Last Keeper", city: "silverveil", cityName: "Silverveil", find: (c) => c.people && c.people.keeper,
    ask: "“We will host it here, by the moon-pool. Only… show me Renata's lantern, so I know her promise is truly kept.”", need: [["renatalantern", 0]] },
];

export function initPhase16(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 2.8) => Math.hypot(me().x - x, me().z - z) < r;
  const p16 = () => (st.p16 ||= { started: false, asked: {}, done: {}, festival: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());
  let wait = 0;

  function begin() {
    const s = p16();
    s.started = true;
    st.phase = 16;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.2, black: true, gameCam: true, text: "A week after Sprig came home, a silver letter flutters down out of the sky and lands right in your paws." },
      { dur: 4.6, black: true, gameCam: true, who: "A letter from the Last Keeper", text: "“Moonkeeper Thistle — the roads are whole. The six cities are friends. It is time for the GATHERING: the first Moonkeepers' Festival in four hundred years.”" },
      { dur: 4.4, black: true, gameCam: true, who: "A letter from the Last Keeper", text: "“Carry an invitation to every city's leader. They will each ask something of you — they always do. Then come to Silverveil.”" },
      { dur: 3.4, black: true, gameCam: true, who: "Sprig", text: "“A FESTIVAL?! With ALL the cities?! Thistle, I'm going to need a new hat.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🎆 PHASE 16 — The Gathering of the Six Cities. Invite all six leaders (the list, top right).", true) },
    ]);
  }

  // ---------------------------------------------------------------- the leaders
  function leaderPos(L) {
    const w = here();
    if (w !== L.city) return null;
    const c = w === "roothaven" || w === "everbough" ? null : ctx.city();
    return L.find(c, ctx);
  }
  const has = (item, n) => {
    if (item === "dish") return ctx.dishes().some((k) => ctx.packCount(k) > 0);
    if (n === 0) return !!(C().owned || {})[item];
    return ctx.packCount(item) >= n;
  };
  const needText = (L) => L.need.map(([item, n]) => (item === "dish" ? "any cooked dish" : n === 0 ? "Renata's lantern" : `${n} ${item}`)).join(", ");
  function take(L) {
    for (const [item, n] of L.need) {
      if (item === "dish") {
        const k = ctx.dishes().find((d) => ctx.packCount(d) > 0);
        ctx.packTake(k, 1);
      } else if (n > 0) ctx.packTake(item, n);
    }
  }
  function interactable() {
    if (st.phase < 16) return null;
    const s = p16();
    for (const L of LEADERS) {
      const P = leaderPos(L);
      if (!P || !near(P.x, P.z)) continue;
      if (s.done[L.key]) continue;
      if (!s.asked[L.key]) return { label: `give ${L.name} the Festival invitation 💌`, act: () => {
        s.asked[L.key] = true;
        save();
        redraw();
        ctx.say(`💌 ${L.name}: ${L.ask}`, true);
      } };
      if (!has(...L.need[0])) return { label: `${L.name} is waiting for: ${needText(L)}`, act: () => ctx.say(`💌 ${L.name}: “${needText(L)}, please — then I'll be there!”`, true) };
      return { label: `give ${L.name} ${needText(L)} 🎁`, act: () => {
        take(L);
        s.done[L.key] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.done).length;
        ctx.say(`🎉 ${L.name} will come to the Gathering! (${n}/6)${n >= 6 ? " EVERYONE is coming — go to Silverveil and talk to the Last Keeper!" : ""}`, true);
      } };
    }
    // everyone invited → the Festival
    if (Object.keys(s.done).length >= 6 && !s.festival && here() === "silverveil") {
      const K = ctx.city().people.keeper;
      if (K && near(K.x, K.z, 3)) return { label: "begin the Gathering of the Six Cities 🎆", act: festival };
    }
    return null;
  }

  // ---------------------------------------------------------------- the Festival
  function festival() {
    const c = ctx.city();
    const y = c.height(0, 0);
    const fireworks = [];
    const boom = () => {
      const col = [0xff6a8a, 0xffd84a, 0x6ad8ff, 0xb88aff, 0x8aff8a][Math.floor(Math.random() * 5)];
      const cx = (Math.random() - 0.5) * 50;
      const cz = -20 - Math.random() * 30;
      const cy = y + 22 + Math.random() * 14;
      for (let i = 0; i < 26; i++) {
        const sp = glow(col, 1.4);
        sp.position.set(cx, cy, cz);
        c.group.add(sp);
        const a = Math.random() * Math.PI * 2;
        const b = (Math.random() - 0.5) * Math.PI;
        fireworks.push({ sp, vx: Math.cos(a) * Math.cos(b) * 9, vy: Math.sin(b) * 9, vz: Math.sin(a) * Math.cos(b) * 9, life: 1.6 });
      }
    };
    let next = 0;
    const tick = (k, dt) => {
      next -= dt;
      if (next <= 0) {
        next = 0.5;
        boom();
      }
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.life -= dt;
        f.vy -= 6 * dt;
        f.sp.position.x += f.vx * dt;
        f.sp.position.y += f.vy * dt;
        f.sp.position.z += f.vz * dt;
        f.sp.material.opacity = Math.max(0, f.life / 1.6);
        if (f.life <= 0) {
          f.sp.parent && f.sp.parent.remove(f.sp);
          fireworks.splice(i, 1);
        }
      }
    };
    playCutscene([
      { dur: 4.4, from: [0, y + 18, 50], look: [0, y + 3, 0], text: "They come from everywhere. Rafts from Reedmere. Hay-carts from Golden Hollow. Sleds from Frostpine. Lantern-bearers from Roothaven. Scholars from Everbough.", update: tick },
      { dur: 4.4, from: [10, y + 4, 22], look: [0, y + 2, 8], who: "The Last Keeper", text: "“For four hundred years, these cities forgot each other. Tonight — because of one small mouse with a lantern — we remember.”", update: tick },
      { dur: 4.6, from: [6, y + 3, 16], look: [0, y + 1.5, 6], who: "The Last Keeper", text: "“Thistle Mosswhisker: by the vote of all six cities, you are named HIGH MOONKEEPER — keeper of every road, and every friendship between them.”", update: tick },
      { dur: 4.4, from: [0, y + 6, 40], look: [0, y + 24, -30], text: "And then the sky EXPLODES with fireworks — red and gold and blue, raining sparkles into the moon-pool.", update: tick },
      { dur: 4.6, from: [0, y + 6, 40], look: [0, y + 24, -30], who: "Sprig", text: "“HIGH MOONKEEPER! Thistle, that's the BIGGEST hat of all! …Wait. What's that, way out past Reedmere? On the sea?”", update: tick },
      { dur: 4.4, black: true, gameCam: true, text: "Far out on the Open Sea, a ship with silver sails is drifting toward the shore. Nobody has ever seen a ship like it. Nobody knows where it came from…" },
      { dur: 4, black: true, gameCam: true, who: "🎆 PHASE 16 COMPLETE", text: "The Gathering of the Six Cities\n🪙 250 · 👑 Crown of the High Moonkeeper\n…to be continued!" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        for (const f of fireworks) f.sp.parent && f.sp.parent.remove(f.sp);
        const s = p16();
        s.festival = true;
        const cc = C();
        cc.coins = (cc.coins || 0) + 250;
        (cc.owned ||= {}).highmoonkeeper = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("👑 HIGH MOONKEEPER Thistle! …and a mysterious silver-sailed ship is heading for Reedmere. The story continues soon!", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame + the list
  const beacon = new THREE.Group();
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.9, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.y = 30;
    beacon.add(beam);
  }
  function update(dt) {
    if (st.phase === 15 && st.p15 && st.p15.done === true && !p16().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 16) return;
    const s = p16();
    beacon.visible = false;
    if (s.festival) return;
    // the beacon: the next leader in this place (or the Keeper, at the end)
    const allIn = Object.keys(s.done).length >= 6;
    const L = allIn ? LEADERS[5] : LEADERS.find((x) => !s.done[x.key] && x.city === here());
    if (!L) return;
    const P = leaderPos(L);
    const grp = here() === "roothaven" ? ctx.roothaven.group : here() === "everbough" ? ctx.cityGroup : ctx.city() && ctx.city().group;
    const H = here() === "roothaven" ? ctx.roothaven.height : here() === "everbough" ? ctx.cityHeight : ctx.city() && ctx.city().height;
    if (!P || !grp) return;
    if (beacon.parent !== grp) grp.add(beacon);
    beacon.visible = true;
    beacon.position.set(P.x, H(P.x, P.z), P.z);
  }
  function panelHTML() {
    const s = p16();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🎆 The Gathering of the Six Cities</h3><ul>
      ${LEADERS.map((L) => row(s.done[L.key], `${L.name} <span class="res">(${L.cityName})</span>${s.asked[L.key] && !s.done[L.key] ? `<div class="sub">&nbsp;&nbsp;🎁 bring: ${needText(L)}</div>` : ""}`)).join("")}
      ${row(s.festival, "The Festival in Silverveil — talk to the Last Keeper")}
    </ul><div class="kit">💌 the golden beam marks a leader in this city · C — Life Goals</div>`;
  }
  return { update, interactable, panelHTML, done: () => !!p16().festival };
}
