// ------------------------------------------------------------
//  🌋  PHASE 33 — "The Volcano's Heart"
//
//  Emberpeak, the old volcano beyond Frostpine, is grumpy and rumbly — its
//  fire-spirit, Cinder, can't sleep, and every grumble shakes ash over the
//  snow. Warden Ivo knows the old way to soothe it:
//    ❄️ gather three FROST STONES in Frostpine (they glow blue in the snow)
//    🔥 carry them all the way up Emberpeak — but heat melts them! a burn
//       from lava or a fire-vent and you lose one (go back for more)
//    🌋 jump the two rivers of lava that ring the mountain
//    ❄️ set the frost stones round Cinder in the crater to cool its fire…
//    🎶 …and play it the old Volcano Lullaby on your reed flute: 3 · 2 · 3 · 1
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { CINDER, cinderHeight, inLava } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { ITEM_POWERS } from "./powers.js";
import { glowTexture } from "./phase2.js";

registerKeepsake("cinderheart", "🔥", "Cinder's Spark (the volcano's thank-you — you'll never be cold again)");
ITEM_POWERS.cinderheart = { type: "warm", n: 0.6 };

const LULLABY = [3, 2, 3, 1];
const STONES_NEEDED = 3;
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase33(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p33 = () => (st.p33 ||= { started: false, been: false, carry: 0, gathered: {}, placed: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "cinder" ? ctx.city() : null);
  let wait = 0;
  let testAt = new URLSearchParams(location.search).get("p33at");

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("cinder");
      ctx.placePlayer(CINDER.camp.x, CINDER.camp.z - 3, Math.PI);
      const s = p33();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🌋 Emberpeak — warm and peaceful now. Cinder hums in its sleep."
        : s.carry
          ? `🌋 EMBERPEAK! You're carrying ${s.carry} frost stone${s.carry === 1 ? "" : "s"} ❄️ — keep them away from the heat! JUMP the two rivers of lava, dodge the fire-vents and falling rocks, and climb to the crater.`
          : "🌋 Emberpeak. Without frost stones, there's nothing you can do for Cinder yet — gather three in Frostpine first!", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "cinder", icon: "🌋", name: "Emberpeak — the grumpy volcano", when: () => st.phase >= 33, go: goThere });

  function begin() {
    p33().started = true;
    st.phase = 33;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "RUMBLE… The ground grumbles under Frostpine. Grey ash drifts down onto the snow, and far away, Emberpeak puffs out a great sulky cloud of smoke." },
      { dur: 5, black: true, gameCam: true, who: "Warden Ivo", text: "“Emberpeak's fire-spirit, Cinder, can't sleep. When it can't sleep it grumbles, and when it grumbles, the whole north shakes. My granny knew how to soothe it: three FROST STONES to cool its fire… and a lullaby.”" },
      { dur: 5, black: true, gameCam: true, who: "Warden Ivo", text: "“The frost stones glow blue in the snow round Frostpine. But mind — they MELT in the heat. A splash of lava or a puff from a fire-vent and one's gone. And the lullaby goes like this, on your flute: three… two… three… one.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌋 PHASE 33 — The Volcano's Heart. Find three glowing frost stones ❄️ around Frostpine, then fly to Emberpeak (press 1).", true) },
    ]);
  }

  // ---------------------------------------------------------------- ❄️ the frost stones, out in Frostpine's snow
  const SPOTS = [[38, 30], [-52, 22], [12, -58], [-30, -44], [60, -12]]; // (spares, in case some melt)
  let stonesFor = null, stones = [];
  function buildStones(c) {
    if (stonesFor === c) return;
    stonesFor = c;
    stones = SPOTS.map(([x0, z0], i) => {
      let at = { x: x0, z: z0 };
      for (let k = 0; k < 30; k++) {
        const a = k * 2.4, d = k * 1.2;
        const x = x0 + Math.cos(a) * d, z = z0 + Math.sin(a) * d;
        if (!c.colliders.some((cc) => Math.hypot(x - cc.x, z - cc.z) < cc.r + 1.5)) {
          at = { x, z };
          break;
        }
      }
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4a9ad8, emissiveIntensity: 0.8, flatShading: true })), glow(0x9fd8ff, 3, 0.8));
      g.position.set(at.x, c.height(at.x, at.z) + 0.6, at.z);
      c.group.add(g);
      return { ...at, g, i };
    });
  }

  // ---------------------------------------------------------------- 🔥 heat melts what you carry
  let hurtCool = 0, safe = null;
  function meltOne(why) {
    const s = p33();
    if (s.carry <= 0) return;
    s.carry--;
    // ❄️ …and a fresh one forms back in the snow, right where you found it
    const held = (s.held ||= []);
    const back = held.length ? held.pop() : +Object.keys(s.gathered).find((k) => s.gathered[k]);
    if (back >= 0 && !Number.isNaN(back)) delete s.gathered[back];
    save();
    redraw();
    ctx.say(`💧 ${why} — one of your frost stones MELTS into a puddle! (${s.carry} left) A new one is already forming in the snow at Frostpine, right where you found it.`, true);
  }
  function dangers(dt, t) {
    const Z = zone();
    const p = me();
    hurtCool = Math.max(0, hurtCool - dt);
    const onGround = p.y < cinderHeight(p.x, p.z) + 0.4;
    // 🌋 lava: OUCH — and you hop back to where you were
    if (onGround && inLava(p.x, p.z)) {
      if (!hurtCool) {
        hurtCool = 1.2;
        ctx.hurt(12);
        meltOne("SIZZLE! Lava");
        ctx.say("🔥 OUCH! LAVA! Take a running JUMP over it (double-jump if you need to)!");
      }
      if (safe) ctx.placePlayer(safe.x, safe.z, ctx.mouseRig.rotation.y);
    } else if (onGround) safe = { x: p.x, z: p.z };
    // 💨 the fire-vents puff in turn
    for (const v of Z.vents) {
      const k = (t * 0.45 + v.ph) % 1;
      const on = k < 0.25;
      v.fire.material.opacity = on ? 0.95 : 0.15 + k * 0.1;
      v.fire.scale.setScalar(on ? 3.4 + Math.sin(t * 20) * 0.4 : 1.2);
      v.fire.position.y = cinderHeight(v.x, v.z) + (on ? 1.6 : 0.6);
      if (on && !hurtCool && Math.hypot(p.x - v.x, p.z - v.z) < 1.3 && p.y < cinderHeight(v.x, v.z) + 2) {
        hurtCool = 1.2;
        ctx.hurt(8);
        meltOne("FWOOSH! A fire-vent");
      }
    }
    // 🪨 falling rocks on the slopes (watch for the red shadow)
    const d = Math.hypot(p.x, p.z);
    if (d > CINDER.rim + 2 && d < CINDER.foot - 2 && !p33().done) {
      Z.rockTimer = (Z.rockTimer ?? 3) - dt;
      if (Z.rockTimer <= 0) {
        Z.rockTimer = 3.5 + Math.random() * 3;
        const R = Z.rocks.find((r) => r.t < 0);
        if (R) {
          const fw = ctx.mouseRig.rotation.y;
          R.x = p.x + Math.sin(fw) * 2 + (Math.random() - 0.5) * 3;
          R.z = p.z + Math.cos(fw) * 2 + (Math.random() - 0.5) * 3;
          R.t = 0;
        }
      }
    }
    for (const R of Z.rocks) {
      if (R.t < 0) continue;
      R.t += dt;
      const gy = cinderHeight(R.x, R.z);
      const WARN = 1.4;
      R.sh.visible = R.t < WARN + 0.1;
      R.sh.position.set(R.x, gy + 0.12, R.z);
      R.sh.material.opacity = 0.35 + 0.45 * Math.abs(Math.sin(R.t * 10));
      R.b.visible = R.t > WARN - 0.45;
      R.b.position.set(R.x, gy + 0.9 + Math.max(0, (WARN - R.t) / 0.45) * 14, R.z);
      if (!R.hit && R.t >= WARN) {
        R.hit = true;
        if (Math.hypot(p.x - R.x, p.z - R.z) < 1.5 && p.y < gy + 2) {
          ctx.hurt(15);
          ctx.say("🪨 BONK! A falling rock! Watch for the RED shadow and get out of the way!");
        }
      }
      if (R.t > WARN + 1.4) {
        R.t = -1;
        R.hit = false;
        R.b.visible = R.sh.visible = false;
      }
    }
  }

  // ---------------------------------------------------------------- 🎶 the lullaby (played on your reed flute)
  window.addEventListener("ww-note", (e) => {
    const s = p33();
    if (st.phase < 33 || s.done || !s.placed || !zone() || !near(0, 0, 10)) return;
    const n = e.detail.notes;
    if (n.length === 4 && LULLABY.every((v, i) => v === n[i])) setTimeout(finale, 1200);
  });

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 33) return null;
    const s = p33();
    if (here() === "frostpine" && !s.done) {
      for (const S0 of stones) {
        if (s.gathered[S0.i] || !near(S0.x, S0.z, 2.2)) continue;
        return { label: "pick up the frost stone ❄️", act: () => {
          s.gathered[S0.i] = true;
          (s.held ||= []).push(S0.i);
          s.carry++;
          save();
          redraw();
          chime();
          ctx.say(`❄️ A frost stone — so cold it smokes in your paw! (carrying ${s.carry}${s.carry >= STONES_NEEDED ? " — that's enough! Fly to Emberpeak (press 1) and keep them away from the heat" : ""})`, true);
        } };
      }
      return null;
    }
    const Z = zone();
    if (!Z) return null;
    if (near(CINDER.spring.x, CINDER.spring.z, 3)) return { label: "drink from the cold mountain spring 💧 (heals you)", act: () => {
      ctx.heal(100);
      chime();
      ctx.say("💧 Icy cold and SO good. All your hearts are back!");
    } };
    if (near(CINDER.camp.x, CINDER.camp.z, 3.2)) return { label: "climb on your dragon and fly home to Frostpine 🐉", act: () => fadeThrough(() => ctx.goCity("frostpine"), 1) };
    if (s.done) return null;
    if (near(0, 0, 9)) {
      if (!s.placed) {
        if (s.carry < STONES_NEEDED) return { label: "talk to the fire-spirit 🔥", act: () => ctx.say(`🔥 Cinder ROARS and tosses in its crater — too hot and too cross to listen. (You need ${STONES_NEEDED} frost stones to cool it — you have ${s.carry}.)`, true) };
        return { label: "set the frost stones round Cinder ❄️", act: () => {
          s.placed = true;
          s.carry -= STONES_NEEDED;
          s.held = [];
          save();
          redraw();
          chime();
          ctx.say("❄️ You set the three frost stones round the crater. They hiss and steam — and Cinder's wild flames shrink down, grumbling… it's cooler, calmer… nearly sleepy. NOW: play it the lullaby on your flute! (U, then 3 · 2 · 3 · 1)", true);
        } };
      }
      return { label: "play the Volcano Lullaby (U, then 3 · 2 · 3 · 1) 🎶", act: () => ctx.say("🎶 Press U to take out your reed flute, then play 3 · 2 · 3 · 1.", true) };
    }
    return null;
  }

  function finale() {
    const s = p33();
    if (s.done) return;
    const Z = zone();
    const y = cinderHeight(0, 0);
    playCutscene([
      { dur: 4.6, from: [0, y + 5, 11], look: [0, y + 3, 0], text: "Your little tune drifts over the crater: three… two… three… one. Cinder's eyes, huge and fiery, droop… and droop…", run: () => (Z.calm = true) },
      { dur: 4.6, from: [0, y + 5, 11], look: [0, y + 3, 0], who: "Cinder (in a voice like a crackling hearth)", text: "“That song… my mother sang it… when the mountain was young… Thank you, little one. I have been so tired. So… very… tired.”" },
      { dur: 4.6, from: [26, y + 14, 34], look: [0, y + 2, 0], text: "The fire-spirit curls up in its crater like a cat by the hearth, and falls fast asleep. The smoke thins. The lava slows to a warm, gentle glow. And over Frostpine, the ash stops falling." },
      { dur: 4.4, black: true, gameCam: true, who: "Warden Ivo", text: "“Not a rumble! Thistle, you sang a VOLCANO to sleep. Granny would have been so proud.”" },
      { dur: 4, black: true, gameCam: true, who: "🌋 PHASE 33 COMPLETE", text: "The Volcano's Heart\n🪙 1000 · 🔥 Cinder's Spark" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1000;
        (c.owned ||= {}).cinderheart = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌋 Emberpeak sleeps, and the north is peaceful again! (Cinder's Spark keeps you warm everywhere.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 32 && st.p32 && st.p32.done && !p33().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 33) return;
    const s = p33();
    // the frost stones out in Frostpine (more appear if yours melted)
    if (here() === "frostpine" && ctx.city()) {
      buildStones(ctx.city());
      // ❄️ every stone you AREN'T carrying is always back in its spot in the snow
      if (!s.done) {
        const held = s.carry > 0 ? (s.held ||= []).slice(-s.carry) : [];
        if (held.length !== (s.held || []).length) s.held = held;
        const want = Object.fromEntries(held.map((i) => [i, true]));
        if (JSON.stringify(want) !== JSON.stringify(s.gathered)) {
          s.gathered = want;
          save();
        }
      }
      for (const S0 of stones) {
        S0.g.visible = !s.gathered[S0.i] && !s.done;
        S0.g.rotation.y = t + S0.i;
      }
    }
    const Z = zone();
    if (!Z) {
      safe = null;
      return;
    }
    if (testAt) {
      // (test) &p33at=crater|lava — start there
      const at = testAt === "crater" ? [0, 9] : testAt === "lava" ? [0, 44.5] : null;
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    if (s.done) Z.calm = true;
    if (!ctx.playing()) dangers(dt, t);
  }

  function panelHTML() {
    const s = p33();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const have = s.placed ? STONES_NEEDED : s.carry;
    return `<h3>🌋 The Volcano's Heart</h3><ul>
      ${row(have >= STONES_NEEDED, `Gather ${STONES_NEEDED} glowing frost stones ❄️ in Frostpine (${Math.min(have, STONES_NEEDED)}/${STONES_NEEDED})`)}
      ${row(s.been, "Fly to Emberpeak <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “Emberpeak”</div>")}
      ${row(s.placed, "Carry them up past the lava (heat MELTS them!) and set them round Cinder")}
      ${row(s.done, "Play the Volcano Lullaby on your flute: 3 · 2 · 3 · 1")}
    </ul><div class="kit">🌋 JUMP the two rivers of lava · 💨 fire-vents · 🪨 falling rocks · 💧 the spring at camp heals you</div>`;
  }

  window.__wwP33 = { stones: () => stones.map((S0) => ({ x: S0.x, z: S0.z, i: S0.i })), state: () => p33() }; // (for tests)
  return { update, interactable, panelHTML, done: () => !!p33().done };
}
