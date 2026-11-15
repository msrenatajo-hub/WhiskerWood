// ------------------------------------------------------------
//  ⚙️  PHASE 28 — "The Clockwork Mountain"
//
//  The seasons have gone WRONG — snow in summer, blossoms in winter.
//  Master Tinker knows why: deep inside the Clockwork Mountain, the
//  Great Season Clock has stopped, and its four golden gears were shaken
//  loose. Get one at the end of each moving-platform challenge:
//    🌸 the great rotating plank (east)   ☀️ the steam pistons (west)
//    🍂 the sliders over the chasm (north) ❄️ the spiral gear-stairs (tower)
//  …then fit them back into the clock, and the seasons turn again.
// ------------------------------------------------------------
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { CLOCK, clockParts } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";

registerKeepsake("seasonkey", "🗝️", "The Season Clock's Winding Key (keeper of the seasons)");

export function initPhase28(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p28 = () => (st.p28 ||= { started: false, been: false, gears: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "clockwork" ? ctx.city() : null);
  const npc = (k) => ctx.npcs.find((n) => n.key === k);
  let wait = 0;
  let testAt = new URLSearchParams(location.search).get("p28at");

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("clockwork");
      ctx.placePlayer(CLOCK.arrive.x, CLOCK.arrive.z, Math.PI);
      const s = p28();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "⚙️ The Clockwork Mountain — the Great Season Clock ticks, and the pendulum swings."
        : "⚙️ THE CLOCKWORK MOUNTAIN! Four golden gears are lost in here — one at the end of each challenge: the rotating plank (east), the steam pistons (west), the sliders over the chasm (north), and the spiral gear-stairs round the clock tower. Find them all!", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "clockwork", icon: "⚙️", name: "The Clockwork Mountain", when: () => st.phase >= 28, go: goThere });

  function begin() {
    p28().started = true;
    st.phase = 28;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "Something is wrong with the world. On Monday it snowed on the strawberries. On Tuesday blossoms fell in a blizzard. On Wednesday the leaves turned orange… and then green again." },
      { dur: 4.8, black: true, gameCam: true, who: "A note from Master Tinker (very smudged with oil)", text: "“Thistle! It's the GREAT SEASON CLOCK — deep inside the Clockwork Mountain. It tells the seasons when to change, and it has STOPPED. Its four golden gears have shaken loose!”" },
      { dur: 4.2, black: true, gameCam: true, who: "A note from Master Tinker", text: "“The mountain is full of moving machinery — planks, pistons, sliders, stairs. Mind your step. Come to my workshop at the school and I'll send you down in my lift.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("⚙️ PHASE 28 — The Clockwork Mountain. Talk to Master Tinker at the Fallen Log School (or fly your dragon there — press 1).", true) },
    ]);
  }

  // ---------------------------------------------------------------- 🚶 riding the moving platforms
  let last = null; // where the platforms were last frame
  function carry() {
    const p = me();
    const P = clockParts();
    if (last) {
      const K = CLOCK;
      // on the rotating plank? turn round its middle with it
      const a = last.plankAngle;
      const dx = p.x - K.plank.x, dz = p.z - K.plank.z;
      const u = dx * Math.cos(a) - dz * Math.sin(a);
      const v = dx * Math.sin(a) + dz * Math.cos(a);
      if (Math.abs(u) < K.plank.half && Math.abs(v) < K.plank.w && Math.abs(p.y - K.plank.y) < 0.35) {
        const da = P.plankAngle - last.plankAngle;
        const c = Math.cos(-da), s = Math.sin(-da);
        p.x = K.plank.x + dx * c - dz * s;
        p.z = K.plank.z + dx * s + dz * c;
        ctx.mouseRig.rotation.y += da;
      }
      // on a slider? slide along with it
      K.sliders.forEach((S, i) => {
        if (Math.abs(p.x - last.sliders[i]) < S.half && Math.abs(p.z - S.z) < S.half && Math.abs(p.y) < 0.35) p.x += P.sliders[i] - last.sliders[i];
      });
    }
    last = P;
  }

  // ---------------------------------------------------------------- 🧲 sticky edges
  // While you're standing on a platform you can't stumble off its edge —
  // you only leave it by JUMPING. (Every ledge, piston, slider, the plank
  // and each gear-stair.)
  function platformsNow() {
    const K = CLOCK;
    const P = clockParts();
    const list = [];
    for (const c of [K.plankStep, K.plankLedge, K.pistonLedge, ...K.stairs, K.balcony]) list.push({ kind: "circle", x: c.x, z: c.z, r: c.r, top: c.y });
    K.pistons.forEach((Pn, i) => list.push({ kind: "circle", x: Pn.x, z: Pn.z, r: Pn.r, top: P.pistons[i] }));
    K.sliders.forEach((S, i) => list.push({ kind: "square", x: P.sliders[i], z: S.z, h: S.half, top: 0 }));
    list.push({ kind: "plank", x: K.plank.x, z: K.plank.z, a: P.plankAngle, half: K.plank.half, w: K.plank.w, top: K.plank.y });
    return list;
  }
  const inside = (Q, x, z, m = 0) => {
    if (Q.kind === "circle") return Math.hypot(x - Q.x, z - Q.z) < Q.r - m;
    if (Q.kind === "square") return Math.abs(x - Q.x) < Q.h - m && Math.abs(z - Q.z) < Q.h - m;
    const dx = x - Q.x, dz = z - Q.z;
    const u = dx * Math.cos(Q.a) - dz * Math.sin(Q.a);
    const v = dx * Math.sin(Q.a) + dz * Math.cos(Q.a);
    return Math.abs(u) < Q.half - m && Math.abs(v) < Q.w - m;
  };
  function pullBack(Q, p) {
    const m = 0.25;
    if (Q.kind === "circle") {
      const dx = p.x - Q.x, dz = p.z - Q.z;
      const d = Math.hypot(dx, dz) || 1;
      const r = Math.max(0.1, Q.r - m);
      p.x = Q.x + (dx / d) * Math.min(d, r);
      p.z = Q.z + (dz / d) * Math.min(d, r);
    } else if (Q.kind === "square") {
      p.x = Math.max(Q.x - Q.h + m, Math.min(Q.x + Q.h - m, p.x));
      p.z = Math.max(Q.z - Q.h + m, Math.min(Q.z + Q.h - m, p.z));
    } else {
      const dx = p.x - Q.x, dz = p.z - Q.z;
      let u = dx * Math.cos(Q.a) - dz * Math.sin(Q.a);
      let v = dx * Math.sin(Q.a) + dz * Math.cos(Q.a);
      u = Math.max(-Q.half + m, Math.min(Q.half - m, u));
      v = Math.max(-Q.w + m, Math.min(Q.w - m, v));
      // (turn back from the plank's own frame to the world's)
      p.x = Q.x + u * Math.cos(Q.a) + v * Math.sin(Q.a);
      p.z = Q.z - u * Math.sin(Q.a) + v * Math.cos(Q.a);
    }
    p.y = Math.max(p.y, Q.top);
  }
  let standingOn = -1; // (which platform you were standing on last frame)
  function stickyEdges() {
    const p = me();
    const list = platformsNow();
    if (standingOn >= 0) {
      const Q = list[standingOn];
      // still on it? fine. Jumping up off it? fine. Stepped off the edge? — back you go
      if (Q && !inside(Q, p.x, p.z) && p.y <= Q.top + 0.04) pullBack(Q, p);
    }
    standingOn = list.findIndex((Q) => inside(Q, p.x, p.z) && Math.abs(p.y - Q.top) < 0.12);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 28) return null;
    const s = p28();
    if (ctx.world() === "outside") {
      const T = npc("tinker");
      if (T && near(T.x, T.z, 3)) return { label: "ride Master Tinker's lift down to the Clockwork Mountain ⚙️", act: goThere };
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    if (near(CLOCK.lift.x, CLOCK.lift.z, 2.8)) return { label: "ride the lift back up to the school ⬆️", act: () => fadeThrough(() => {
      ctx.goOutside();
      const T = npc("tinker");
      if (T) ctx.placePlayer(T.x + 2, T.z + 2, 0);
    }, 1) };
    if (s.done) return null;
    for (const Gr of CLOCK.gears) {
      if (s.gears[Gr.key] || !near(Gr.x, Gr.z, 2.2) || Math.abs(me().y - Gr.y) > 1.6) continue;
      return { label: `take ${Gr.name} ${Gr.icon}`, act: () => {
        s.gears[Gr.key] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.gears).length;
        ctx.say(`⚙️ ${Gr.icon} ${Gr.name[0].toUpperCase() + Gr.name.slice(1)}! It's warm, and ticking softly. (${n}/4)${n >= 4 ? " ALL FOUR! Take them to the door of the Great Season Clock." : ""}`, true);
      } };
    }
    if (Object.keys(s.gears).length >= 4 && near(CLOCK.door.x, CLOCK.door.z, 2.8)) return { label: "fit the four golden gears into the Great Season Clock 🕰️", act: finale };
    return null;
  }

  function finale() {
    const s = p28();
    const Z = zone();
    const T = CLOCK.tower;
    playCutscene([
      { dur: 4.2, from: [T.x + 6, 4, T.z + 16], look: [T.x, 2.4, T.z + 7], text: "One by one, you fit the golden gears into their slots — Spring, Summer, Autumn, Winter. Each one clicks home with a soft, satisfying CLUNK.", run: () => Z.slots.forEach((g) => (g.visible = true)) },
      { dur: 4.6, from: [T.x + 10, 14, T.z + 26], look: [T.x, 18, T.z], text: "Deep inside the tower something shudders… whirrs… and then — TICK. TOCK. The great pendulum swings. The giant hands begin to turn.", run: () => (Z.running = true) },
      { dur: 4.6, from: [T.x + 24, 22, T.z + 34], look: [T.x, 20, T.z], text: "All through the mountain, gears spin faster, steam sings in the pipes — and far above, all over the world, the seasons settle back into their places like birds coming home to roost." },
      { dur: 4.4, black: true, gameCam: true, who: "Master Tinker (over the speaking-tube)", text: "“YOU DID IT! The strawberries are thawing! Keep the Winding Key, Thistle — the clock will only ever answer to you now.”" },
      { dur: 4, black: true, gameCam: true, who: "⚙️ PHASE 28 COMPLETE", text: "The Clockwork Mountain\n🪙 700 · 🗝️ The Season Clock's Winding Key" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 700;
        (c.owned ||= {}).seasonkey = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🕰️ The Great Season Clock is ticking again, and the seasons are back in order! (The Winding Key helps your crops grow.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt) {
    if (st.phase === 27 && st.p27 && st.p27.done && !p28().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z) {
      last = null;
      return;
    }
    carry();
    stickyEdges();
    if (testAt) {
      // (test) &p28at=plank|piston|chasm|stairs — start beside a challenge
      const at = { step: [21.2, 8, -Math.PI / 2], plank: [17, 8, Math.PI / 2], piston: [-17, 10, -Math.PI / 2], chasm: [0, -16, Math.PI], stairs: [-9, 13, Math.PI] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], at[2]);
    }
    const s = p28();
    Z.lostGears.forEach((g, i) => (g.visible = !s.gears[CLOCK.gears[i].key] && !s.done));
    if (s.done) {
      Z.running = true;
      Z.slots.forEach((g) => (g.visible = true));
    }
    // fell into the chasm? the clockwork lifts you back out
    if (me().y < -8) {
      ctx.placePlayer(0, CLOCK.chasm.z0 + 3, Math.PI);
      ctx.say("⚙️ Whoops — down into the chasm! A clanking brass claw lifts you back out. Jump onto the sliders as they come past!", true);
    }
  }

  function panelHTML() {
    const s = p28();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const g = (k) => !!s.gears[k];
    return `<h3>⚙️ The Clockwork Mountain</h3><ul>
      ${row(s.been, "Ride Master Tinker's lift down (he's at the school)")}
      ${row(g("plank"), "🌸 Spring — ride the great rotating plank (east)")}
      ${row(g("piston"), "☀️ Summer — climb the steam pistons (west)")}
      ${row(g("chasm"), "🍂 Autumn — cross the chasm on the sliders (north)")}
      ${row(g("stairs"), "❄️ Winter — up the spiral gear-stairs round the clock tower")}
      ${row(s.done, "Fit the four gears into the Great Season Clock")}
    </ul><div class="kit">⚙️ moving platforms carry you · time your jumps (Space, Space again for a double jump)</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p28().done };
}
