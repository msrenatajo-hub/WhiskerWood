// ------------------------------------------------------------
//  ⛈️  PHASE 22 — "The Great Storm"
//
//  Pip, the little blue Stormwing hatchling from Emberroost, chased a
//  flash of lightning — straight into the Great Storm, a thunderstorm
//  that never ends, high above the world. Fly your dragon through the
//  trail of SPARK-RINGS Pip left behind (in order!), dodge the lightning
//  (a yellow glow warns you where it will strike), and find Pip in the
//  calm eye of the storm.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { STORM } from "./questZones.js";
import { DRAGON_DESTS, makeDragon, dragonFlying } from "./more3.js";

registerKeepsake("stormscale", "💙", "Pip's Storm Scale (a gift from a brave little dragon)");

export function initPhase22(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p22 = () => (st.p22 ||= { started: false, been: false, rings: 0, found: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "storm" ? ctx.city() : null);
  let wait = 0;
  let pip = null;
  const zap = { t: 4, warnT: 0, x: 0, z: 0, y: 0, boltT: 0 };

  // (so anyone can play it: make sure you have a grown dragon)
  function makeSureOfDragon() {
    const c = C();
    if (c.dragon && (c.days || 0) - c.dragon.got >= 3) return;
    c.dragon = { ...(c.dragon || {}), got: (c.days || 0) - 20, hatchTold: true, grownTold: true };
    saveCity();
  }
  function begin() {
    p22().started = true;
    st.phase = 22;
    save();
    redraw();
    makeSureOfDragon();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "A week later, a scorched little letter drops down your chimney, still smoking at the edges." },
      { dur: 4.6, black: true, gameCam: true, who: "A letter from the Elder Dragon", text: "“Thistle — PIP is missing. The little blue one. She saw a flash of lightning and chased it, the way hatchlings do… straight into the GREAT STORM.”" },
      { dur: 4.8, black: true, gameCam: true, who: "A letter from the Elder Dragon", text: "“It is a storm that has raged for a thousand years, high above the world. My wings are too old for it. But Pip leaves a trail of sparks wherever she flies. Follow them — and mind the lightning.”" },
      { dur: 3.8, black: true, gameCam: true, who: "Sprig", text: "“A storm that never ends?! …I'll hold the umbrella.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("⛈️ PHASE 22 — The Great Storm. Go outdoors, press 1 to call your dragon, and choose “The Great Storm”!", true) },
    ]);
  }

  // ⛈️ the Great Storm in your dragon's list
  DRAGON_DESTS.push({
    id: "storm",
    icon: "⛈️",
    name: "The Great Storm — where Pip flew off to",
    when: () => st.phase >= 22,
    go: () => fadeThrough(() => {
      ctx.goCity("storm");
      ctx.placePlayer(STORM.start.x, STORM.start.z - 3, Math.PI);
      const s = p22();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "⛈️ The Great Storm rumbles — but in its eye, it's calm and silver. Pip waves from your shoulder."
        : "⛈️ THE GREAT STORM! Press 1 to fly, and follow Pip's glowing SPARK-RINGS — fly through each one, in order (a tall blue BEAM of light always marks the next one). A yellow glow means LIGHTNING is about to strike there — swerve!", true);
    }, 1),
  });

  function interactable() {
    if (st.phase < 22) return null;
    const Z = zone();
    if (!Z || dragonFlying()) return null;
    const s = p22();
    const E = STORM.eye;
    if (s.rings >= STORM.rings.length && !s.done && near(E.x, E.z, E.r + 0.5) && me().y > E.y - 1.5) return { label: "kneel down and talk softly to Pip 💙", act: finale };
    return null;
  }

  function finale() {
    const s = p22();
    const Z = zone();
    const E = STORM.eye;
    s.found = true;
    save();
    playCutscene([
      { dur: 4.4, from: [E.x + 8, E.y + 4, E.z + 8], look: [E.x, E.y + 0.8, E.z], text: "There, curled up tight in the very middle of the calm, is Pip — shivering, sparks fizzing off her little blue wings." },
      { dur: 4.4, from: [E.x + 5, E.y + 2.4, E.z + 5], look: [E.x, E.y + 0.8, E.z], who: "Pip (very small)", text: "“I just wanted to catch the lightning… but it was SO big. And then I couldn't find the way out.”" },
      { dur: 4.6, from: [E.x + 5, E.y + 2.4, E.z + 5], look: [E.x, E.y + 0.8, E.z], text: "You tell her the bravest thing anyone ever did was get lost and keep going anyway. Pip sniffs — then sneezes, and a tiny spark of her very own lightning flies up into the storm…" },
      { dur: 4.8, from: [E.x + 30, E.y + 18, E.z + 30], look: [E.x, E.y + 10, E.z], text: "…and the whole Great Storm SIGHS. The thunder rolls away. The clouds open. For the first time in a thousand years, sunlight pours down — and a rainbow arches over everything.", run: () => {
        Z.calm = true;
        if (Z.lid) Z.lid.visible = false;
        Z.bolt.visible = Z.warn.visible = false;
      } },
      { dur: 4.4, black: true, gameCam: true, who: "The Elder Dragon (far away, smiling)", text: "“You found her, Dragon Rider. And you did what no dragon could — you calmed the storm. Pip wants you to have one of her scales. She says it makes your sprints last and last.”" },
      { dur: 4, black: true, gameCam: true, who: "⛈️ PHASE 22 COMPLETE", text: "The Great Storm\n🪙 600 · 💙 Pip's Storm Scale" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 600;
        (c.owned ||= {}).stormscale = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("💙 Pip is safe, and the Great Storm is calm at last! (Pip's Storm Scale: your sprint lasts much longer.) Press 1 to fly her home.", true);
      } },
    ]);
  }

  function update(dt) {
    if (st.phase === 21 && st.p21 && st.p21.done && !p22().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 22) return;
    const s = p22();
    const R = STORM.rings;
    // the spark-rings: the next two glow; fly through the next one
    Z.rings.forEach((g, i) => (g.visible = !s.done && i >= s.rings && i < s.rings + 2));
    // (a beam of light marks the next ring — or the eye, once you've flown them all)
    const nextAt = s.rings < R.length ? R[s.rings] : STORM.eye;
    Z.ringBeam.visible = !s.done;
    Z.ringBeam.position.set(nextAt.x, nextAt.y + 60, nextAt.z);
    // Pip, in the eye (once you've followed the whole trail)
    if (!pip && makeDragon) {
      pip = makeDragon(1);
      pip.traverse((o) => {
        if (!o.material || !o.material.color) return;
        o.material = o.material.clone();
        const hsl = {};
        o.material.color.getHSL(hsl);
        o.material.color.setHSL(0.58, Math.min(1, hsl.s + 0.1), hsl.l);
      });
      pip.position.set(STORM.eye.x, STORM.eye.y, STORM.eye.z);
      Z.group.add(pip);
    }
    if (pip) pip.visible = s.rings >= R.length && !s.done;
    if (s.done || Z.calm) {
      Z.calm = true;
      if (Z.lid) Z.lid.visible = false;
      Z.bolt.visible = Z.warn.visible = false;
      return;
    }
    const p = me();
    if (dragonFlying() && s.rings < R.length) {
      const r = R[s.rings];
      if (Math.hypot(p.x - r.x, p.z - r.z) < 5.5 && Math.abs(p.y - r.y) < 6) {
        s.rings++;
        save();
        redraw();
        chime();
        ctx.say(s.rings >= R.length
          ? "✨ The last spark-ring! Pip's trail ends in the calm EYE of the storm, just ahead — land on the rock there (E) and find her!"
          : `✨ Spark-ring ${s.rings}/${R.length} — follow the next glow!`, s.rings >= R.length);
      }
    }
    // ⚡ lightning: only while you fly — a yellow glow warns you, then CRACK
    if (zap.boltT > 0) {
      zap.boltT -= dt;
      if (zap.boltT <= 0) Z.bolt.visible = false;
    }
    if (!dragonFlying()) {
      Z.warn.visible = false;
      zap.warnT = 0;
      return;
    }
    if (zap.warnT > 0) {
      zap.warnT -= dt;
      Z.warn.position.set(zap.x, zap.y, zap.z);
      Z.warn.material.opacity = 0.4 + Math.abs(Math.sin(zap.warnT * 14)) * 0.5;
      if (zap.warnT <= 0) {
        Z.warn.visible = false;
        Z.bolt.position.set(zap.x, 0, zap.z);
        Z.bolt.visible = true;
        zap.boltT = 0.35;
        if (Math.hypot(p.x - zap.x, p.z - zap.z) < 6) {
          // ZAP — you tumble back along the trail
          const back = s.rings > 0 ? R[s.rings - 1] : STORM.start;
          p.x = back.x;
          p.z = back.z + (s.rings > 0 ? 0 : -3);
          ctx.say("⚡ CRACK! The lightning knocks you head over tail — your dragon catches you, back along the trail. Watch for the yellow glow and SWERVE!", true);
        }
      }
      return;
    }
    zap.t -= dt;
    if (zap.t <= 0) {
      zap.t = 3.5 + Math.random() * 3;
      // aim just ahead of where you're flying
      const yaw = ctx.mouseRig.rotation.y;
      zap.x = p.x + Math.sin(yaw) * 10;
      zap.z = p.z + Math.cos(yaw) * 10;
      zap.y = p.y;
      zap.warnT = 1.6;
      Z.warn.visible = true;
    }
  }

  function panelHTML() {
    const s = p22();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const n = STORM.rings.length;
    return `<h3>⛈️ The Great Storm</h3><ul>
      ${row(s.been, "Fly your dragon to the Great Storm <div class=\"sub\">&nbsp;&nbsp;outdoors: press 1 → “The Great Storm”</div>")}
      ${row(s.rings >= n, `Follow Pip's spark-rings <span class="res">(${s.rings}/${n})</span>`)}
      ${row(s.done, "Find Pip in the calm eye of the storm")}
    </ul><div class="kit">⚡ a yellow glow = lightning about to strike — swerve! · 1 fly/land</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p22().done };
}
