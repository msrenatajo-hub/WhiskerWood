// ------------------------------------------------------------
//  💎  PHASE 31 — "The Crystal Caverns"
//
//  The mountains are rumbling — not with fire, but with SONG. Deep beneath
//  them lie the Crystal Caverns, which hum like thunder whenever the wind
//  blows through. Long ago the five singing crystals that kept the mountain's
//  heart at peace were scattered, and the deepest cavern was sealed. Now the
//  heart is restless, and every hum shakes the cities above.
//    💎 find the five singing crystals — each in its own chamber
//    🗿 each one is guarded by a crystal GOLEM (a touch costs hearts)
//    🌬️ when the cavern HUMS, the golems freeze to listen — that's your chance
//    🎶 sing all five together at the sealed cavern to open it
// ------------------------------------------------------------
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { CRYSTAL } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("singingcrystal", "💎", "A Singing Crystal (it hums softly, like distant thunder)");
ITEM_POWERS.singingcrystal = { type: "luck", n: 0.12 };

const HUM_EVERY = 11; // seconds between the cavern's hums
const HUM_LONG = 3.6; // how long the golems stay frozen

export function initPhase31(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p31 = () => (st.p31 ||= { started: false, been: false, crystals: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "crystal" ? ctx.city() : null);
  let wait = 0;
  let humT = 0, toldHum = false, hurtCool = 0;
  let testAt = new URLSearchParams(location.search).get("p31at");

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("crystal");
      ctx.placePlayer(CRYSTAL.arrive.x, CRYSTAL.arrive.z, Math.PI);
      const s = p31();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "💎 The Crystal Caverns — singing softly now, every crystal in tune."
        : "💎 THE CRYSTAL CAVERNS! Five singing crystals lie in the chambers round the edge — each guarded by a crystal GOLEM. Listen: when the whole cavern HUMS, the golems freeze to listen. That's your moment!", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "crystal", icon: "💎", name: "The Crystal Caverns — deep under the mountains", when: () => st.phase >= 31, go: goThere });

  function begin() {
    p31().started = true;
    st.phase = 31;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "It starts as a hum, so low you feel it in your paws more than hear it. Then the cups rattle. Then the windows. Then the whole of Frostpine SHAKES." },
      { dur: 5, black: true, gameCam: true, who: "Warden Ivo (shouting over the rumble)", text: "“It's not an earthquake, Thistle — it's SINGING! Under the mountains are the Crystal Caverns. Old stories say five singing crystals kept the mountain's heart at peace… and somebody scattered them, long ago.”" },
      { dur: 5, black: true, gameCam: true, who: "Warden Ivo", text: "“The deepest cavern was sealed with crystal, and the heart's been restless ever since. Now it's waking. Find the five crystals and sing them together at the seal — but beware the golems. They were made to guard the crystals, and they don't know you're a friend.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("💎 PHASE 31 — The Crystal Caverns. Go outside and press 1 — fly your dragon to the Crystal Caverns.", true) },
    ]);
  }

  // ---------------------------------------------------------------- 🎵 sounds
  function tone(freqs, dur = 2.5, vol = 0.08) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      for (const f of freqs) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(vol, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
        o.connect(g).connect(ac.destination);
        o.start();
        o.stop(ac.currentTime + dur + 0.1);
      }
      setTimeout(() => ac.close(), dur * 1000 + 400);
    } catch {}
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 31) return null;
    const Z = zone();
    if (!Z) return null;
    const s = p31();
    if (near(CRYSTAL.arrive.x, CRYSTAL.arrive.z + 3, 3)) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (s.done) return null;
    for (const ch of Z.chambers) {
      if (s.crystals[ch.key] || !near(ch.x, ch.z, 2.8)) continue;
      return { label: `take ${ch.name} 💎`, act: () => {
        s.crystals[ch.key] = true;
        save();
        redraw();
        chime();
        tone([ch.note], 2.5, 0.1);
        const n = Object.keys(s.crystals).length;
        ctx.say(`💎 ${ch.name[0].toUpperCase() + ch.name.slice(1)}! It sings a single clear note in your paws. (${n}/5)${n >= 5 ? " ALL FIVE! Take them to the sealed cavern at the far end, and sing them together." : ""}`, true);
      } };
    }
    if (near(CRYSTAL.door.x, CRYSTAL.door.z + 4, 6)) {
      if (Object.keys(s.crystals).length >= 5) return { label: "hold up the five crystals and SING 🎶", act: finale };
      return { label: "look at the sealed cavern 💎", act: () => ctx.say("💎 A wall of solid crystal, humming. Five little hollows are cut into the stone in front of it — each one the shape of a crystal.", true) };
    }
    return null;
  }

  function finale() {
    const s = p31();
    const Z = zone();
    const D = CRYSTAL.door;
    playCutscene([
      { dur: 4.2, from: [D.x + 6, 4, D.z + 14], look: [D.x, 2, D.z + 3], text: "You set the five crystals in their hollows. Dawn, Sky, Leaf, Rose, Star — and they begin to sing, all at once.", run: () => {
        Z.sockets.forEach((k) => {
          k.material.opacity = 1;
          k.material.emissiveIntensity = 1;
        });
        tone(CRYSTAL.crystals.map((c) => c.note), 5, 0.06);
      } },
      { dur: 4.6, from: [D.x + 10, 8, D.z + 20], look: [D.x, 5, D.z], text: "The chord swells and swells — the whole cavern hums with it — and the great crystal seal CRACKS from top to bottom… and shatters into a shower of light.", run: () => (Z.seal.visible = false) },
      { dur: 4.6, from: [D.x + 4, 7, D.z + 6], look: [D.x, 6, D.z - 9], text: "Beyond it, the Heart of the Mountain: a crystal as big as a house, pulsing with slow, gentle light. As the song washes over it, the rumbling fades… and stops." },
      { dur: 4.6, black: true, gameCam: true, who: "Warden Ivo (far above, in Frostpine)", text: "“It's STOPPED! Not a tremor! Thistle, whatever you did down there — the mountain's at peace. Keep one of those crystals. It'll sing for you whenever you need courage.”" },
      { dur: 4, black: true, gameCam: true, who: "💎 PHASE 31 COMPLETE", text: "The Crystal Caverns\n🪙 1000 · 💎 A Singing Crystal" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1000;
        (c.owned ||= {}).singingcrystal = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("💎 The Heart of the Mountain is at peace, and the cities are safe! (Your Singing Crystal brings you luck.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 30 && st.p30 && st.p30.done && !p31().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 31) return;
    const s = p31();
    if (testAt) {
      // (test) &p31at=dawn|sky|leaf|rose|star|door — start there
      const ch = Z.chambers.find((c) => c.key === testAt);
      const at = ch ? [ch.x * 0.75, ch.z * 0.75] : testAt === "door" ? [CRYSTAL.door.x, CRYSTAL.door.z + 5] : null;
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    hurtCool = Math.max(0, hurtCool - dt);
    // 🌬️ the hum: every HUM_EVERY seconds the cavern sings, and the golems freeze
    humT += dt;
    const phase = humT % HUM_EVERY;
    const humming = !s.done && phase > HUM_EVERY - HUM_LONG;
    Z.hum += ((humming || s.done ? 1 : 0) * (s.done ? 0.4 : 1) - Z.hum) * Math.min(1, dt * 4);
    if (humming && phase - dt <= HUM_EVERY - HUM_LONG && !ctx.playing()) {
      tone([55, 82.5], HUM_LONG, 0.12);
      if (!toldHum) {
        toldHum = true;
        ctx.say("🌬️ HMMMMMMM… the whole cavern hums like thunder — and look, the golems have FROZEN, listening. GO!", true);
      }
    }
    Z.seal.visible = !s.done;
    for (const ch of Z.chambers) {
      const taken = !!s.crystals[ch.key] || s.done;
      ch.gem.visible = ch.halo.visible = !taken;
      ch.gem.rotation.y = t;
      ch.gem.position.y = 2 + Math.sin(t * 2 + ch.x) * 0.2;
      // 🗿 the golem paces round its crystal… unless the cavern is humming (or the crystal's gone)
      if (!humming && !taken) ch.ang += dt * 0.85;
      const gx = ch.x + Math.cos(ch.ang) * 4.6, gz = ch.z + Math.sin(ch.ang) * 4.6;
      ch.golem.position.set(gx, 0, gz);
      ch.golem.rotation.y = -ch.ang;
      const walk = humming || taken ? 0 : Math.sin(t * 5 + ch.x);
      ch.limbs.forEach((l, i) => (l.rotation.x = (i % 2 ? -1 : 1) * walk * 0.5));
      ch.eye.material.color.setHex(humming ? 0x404050 : ch.color);
      if (!humming && !taken && !hurtCool && near(gx, gz, 2) && !ctx.playing()) {
        hurtCool = 2;
        ctx.hurt(15);
        // thrown back out of the chamber, toward the middle of the cavern
        const d = Math.hypot(ch.x, ch.z) || 1;
        ctx.placePlayer(ch.x - (ch.x / d) * 10, ch.z - (ch.z / d) * 10, Math.atan2(ch.x, ch.z));
        ctx.say("🗿 THOOM! The crystal golem swats you clean out of its chamber! Wait for the cavern to HUM — then they freeze.", true);
      }
    }
  }

  function panelHTML() {
    const s = p31();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = Object.keys(s.crystals).length;
    return `<h3>💎 The Crystal Caverns</h3><ul>
      ${row(s.been, "Fly to the Crystal Caverns <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “The Crystal Caverns”</div>")}
      ${CRYSTAL.crystals.map((c) => row(!!s.crystals[c.key], `💎 ${c.name[0].toUpperCase() + c.name.slice(1)}`)).join("")}
      ${row(s.done, `Sing all five at the sealed cavern (${n}/5)`)}
    </ul><div class="kit">🗿 golems guard each crystal (a touch costs hearts) · 🌬️ when the cavern HUMS they freeze</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p31().done };
}
