// ------------------------------------------------------------
//  🐉  PHASE 21 — "The Dragon Roost"
//
//  The star in your jar shows you a vision: Emberroost, the lost home of
//  the dragons, high above a sea of clouds. Its four great braziers have
//  gone cold, and without their warmth the Elder Dragon's last four eggs
//  will never hatch. Fly your dragon there (press 1), breathe FIRE on
//  each brazier, carry each warmed egg back to the great nest — and wake
//  the Elder Dragon.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { ROOST } from "./questZones.js";
import { DRAGON_DESTS, makeDragon, dragonFlying } from "./more3.js";

registerKeepsake("dragoncrown", "👑", "The Dragon Rider's Crown (friend of the Elder Dragon)");

export function initPhase21(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p21 = () => (st.p21 ||= { started: false, been: false, lit: {}, eggs: {}, nest: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "roost" ? ctx.city() : null);
  let wait = 0;
  let elder = null;

  // (so you can always play this chapter: the star's light grows your dragon up)
  function makeSureOfDragon() {
    const c = C();
    const grown = c.dragon && (c.days || 0) - c.dragon.got >= 3;
    if (grown) return false;
    c.dragon = { ...(c.dragon || {}), got: (c.days || 0) - 20, hatchTold: true, grownTold: true };
    saveCity();
    return true;
  }

  function begin() {
    p21().started = true;
    st.phase = 21;
    save();
    redraw();
    const grewUp = makeSureOfDragon();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "That night, your star in its jar begins to glow — not gold, but deep ember RED. In its light, you see a picture…" },
      { dur: 4.6, black: true, gameCam: true, text: "…crags of black rock floating high above a sea of pink clouds. A great nest. Four stone braziers, cold and grey. And four dragon eggs, scattered and shivering." },
      { dur: 4.6, black: true, gameCam: true, who: "A deep, sleepy voice in the starlight", text: "“I am the Elder Dragon of EMBERROOST. Our fires have gone out, little Moonkeeper. Without their warmth, my last four eggs will never hatch.”" },
      grewUp
        ? { dur: 4.4, black: true, gameCam: true, who: "The Elder Dragon", text: "“You have no dragon to carry you? Then take one of mine.” — and with a WHOOSH, a great red dragon lands in your garden, lowering her head for you to climb on." }
        : { dur: 4.2, black: true, gameCam: true, who: "Sprig", text: "“Your dragon's ears just pricked up — I think she heard it too! She knows the way, Thistle!”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🐉 PHASE 21 — The Dragon Roost. Go outdoors, press 1 to call your dragon, and choose “Emberroost” to fly above the clouds!", true) },
    ]);
  }

  // 🐉 Emberroost appears in your dragon's list once the chapter starts
  DRAGON_DESTS.push({
    id: "roost",
    icon: "🌋",
    name: "Emberroost — the lost home of the dragons, above the clouds",
    when: () => st.phase >= 21,
    go: () => fadeThrough(() => {
      ctx.goCity("roost");
      ctx.placePlayer(ROOST.nest.x, ROOST.nest.z + ROOST.nest.r - 4, Math.PI);
      const s = p21();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🐉 Emberroost — the four young dragons swoop round you, squeaking hello!"
        : "🌋 EMBERROOST! Four floating isles, four cold braziers. Press 1 to FLY, swoop close to a brazier and breathe FIRE (F) on it!", true);
    }, 1),
  });

  // 🔥 fire breath from dragon-back lights a brazier you're close to
  window.addEventListener("ww-warm", () => {
    const Z = zone();
    if (!Z || st.phase < 21 || !dragonFlying()) return;
    const s = p21();
    const p = me();
    for (const I of ROOST.isles) {
      if (s.lit[I.key]) continue;
      if (Math.hypot(p.x - I.x, p.z - I.z) > 16 || Math.abs(p.y - (I.y + 3)) > 16) continue;
      s.lit[I.key] = true;
      save();
      redraw();
      chime();
      const n = Object.keys(s.lit).length;
      ctx.say(`🔥 WHOOSH! ${I.icon} ${I.name}'s brazier ROARS into flame (${n}/4) — and beside it, a warmed egg starts to wiggle! Land on the isle (E) and pick it up.`, true);
    }
  });

  function interactable() {
    if (st.phase < 21) return null;
    const Z = zone();
    if (!Z || dragonFlying()) return null;
    const s = p21();
    for (const I of ROOST.isles) {
      if (!s.lit[I.key] || s.eggs[I.key]) continue;
      if (near(I.x, I.z, I.r + 0.5) && me().y > I.y - 1.5) return { label: `pick up the warm ${I.name.replace(" Isle", "")} egg 🥚`, act: () => {
        s.eggs[I.key] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.eggs).length;
        ctx.say(`🥚 You tuck the warm egg into your cloak (${n}/4)${n >= 4 ? " — ALL FOUR! Fly them home to the great nest in the middle!" : ". Press 1 to fly on!"}`, true);
      } };
    }
    const N = ROOST.nest;
    if (!s.nest && Object.keys(s.eggs).length >= 4 && near(N.x, N.z, N.r + 0.5) && me().y > N.y - 1.5) return { label: "lay the four eggs in the great nest 🪺", act: finale };
    return null;
  }

  function finale() {
    const s = p21();
    const Z = zone();
    const N = ROOST.nest;
    s.nest = true;
    save();
    if (!elder && makeDragon) {
      elder = makeDragon(3);
      elder.scale.setScalar(5.5);
      elder.position.set(N.x - 30, N.y + 30, N.z - 30);
      Z.group.add(elder);
    }
    const babies = [];
    playCutscene([
      { dur: 4, from: [N.x + 12, N.y + 7, N.z + 12], look: [N.x, N.y + 1, N.z], text: "One by one you lay the four warm eggs in the great nest. They glow — dawn-orange, storm-blue, frost-white, jade-green…", run: () => Z.nestEggs.forEach((e) => (e.visible = true)) },
      { dur: 4.6, from: [N.x + 22, N.y + 12, N.z + 22], look: [N.x - 10, N.y + 14, N.z - 10], text: "…and out of the sunset clouds rises the ELDER DRAGON — vast and golden-red, with eyes like two harvest moons.", update: (k) => {
        if (elder) {
          elder.position.set(N.x - 30 + k * 18, N.y + 30 - k * 18, N.z - 30 + k * 18);
          elder.rotation.y = Math.PI * 0.25;
        }
      } },
      { dur: 4.4, from: [N.x + 12, N.y + 6, N.z + 12], look: [N.x, N.y + 1.2, N.z], text: "She breathes one long, gentle flame over the nest. CRACK… CRACK… CRACK… CRACK! Four baby dragons tumble out, squeaking and sneezing sparks.", run: () => {
        Z.nestEggs.forEach((e, i) => {
          e.visible = false;
          if (!makeDragon) return;
          const b = makeDragon(1);
          b.position.set(e.position.x, e.position.y - 0.6, e.position.z);
          b.rotation.y = i * 1.57;
          Z.group.add(b);
          babies.push(b);
        });
      } },
      { dur: 4.8, from: [N.x + 12, N.y + 7, N.z + 12], look: [N.x - 6, N.y + 6, N.z - 6], who: "The Elder Dragon", text: "“Emberroost is warm again, Thistle Mosswhisker. From this day you are a DRAGON RIDER — the first in a thousand years. Wear this crown, and come back to visit my little ones.”" },
      { dur: 4, black: true, gameCam: true, who: "🐉 PHASE 21 COMPLETE", text: "The Dragon Roost\n🪙 500 · 👑 The Dragon Rider's Crown" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 500;
        (c.owned ||= {}).dragoncrown = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("👑 You're a DRAGON RIDER! Emberroost's fires burn bright, and four baby dragons have a home. (Press 1 to fly home.)", true);
      } },
    ]);
  }

  function update(dt) {
    if (st.phase === 20 && st.p20 && st.p20.done && !p21().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 21) return;
    const s = p21();
    for (const I of ROOST.isles) {
      const B = Z.braziers[I.key];
      B.flame.visible = !!s.lit[I.key];
      Z.eggs[I.key].visible = !!s.lit[I.key] && !s.eggs[I.key];
    }
  }

  function panelHTML() {
    const s = p21();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🐉 The Dragon Roost</h3><ul>
      ${row(s.been, "Fly your dragon to Emberroost <div class=\"sub\">&nbsp;&nbsp;outdoors: press 1 → “Emberroost”</div>")}
      ${ROOST.isles.map((I) => row(s.eggs[I.key], `${I.icon} ${I.name}: ${s.lit[I.key] ? "brazier lit 🔥 — land & take the egg" : "breathe fire (F) on its brazier"}`)).join("")}
      ${row(s.done, "Bring all four eggs to the great nest")}
    </ul><div class="kit">🐉 1 fly/land · Space up · Shift down · F fire · the cold braziers glow faintly</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p21().done };
}
