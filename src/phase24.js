// ------------------------------------------------------------
//  🏜️  PHASE 24 — "The Whispering Dunes"
//
//  Pip's storm scale hums, and the wind whispers a secret: far past the
//  edge of every map lies a hidden desert, and under its sand sleeps the
//  Temple of the First Moonkeeper — with the very first Moonkeeper's
//  lantern inside. Fly there, find the four SUN-STONES at the four old
//  obelisks (the panel tells you what the sand whispers), and raise the
//  temple. But the sun is HOT: rest in the shade of an oasis (or your
//  camp) before the heat gets too much.
// ------------------------------------------------------------
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { DUNES, PYRAMID } from "./questZones.js";
import { DRAGON_DESTS, dragonFlying } from "./more3.js";

registerKeepsake("firstlantern", "🏮", "The Lantern of the First Moonkeeper");
registerKeepsake("goldenscarab", "🪲", "The Golden Scarab (from the First Moonkeeper's treasure room)");

export function initPhase24(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p24 = () => (st.p24 ||= { started: false, been: false, stones: {}, raised: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "dunes" ? ctx.city() : null);
  let wait = 0;
  let heat = 100;
  let hotTold = false;

  // ☀️ the heat meter
  const hud = document.createElement("div");
  hud.style.cssText = "position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:30;width:260px;padding:6px 10px;border-radius:12px;background:rgba(80,50,20,.75);color:#fff0d0;font:bold 13px system-ui;pointer-events:none;display:none;text-align:center";
  hud.innerHTML = `<div id="heatTxt">☀️ Cool</div><div style="height:9px;border-radius:5px;background:rgba(0,0,0,.35);margin-top:4px;overflow:hidden"><div id="heatBar" style="height:100%;width:100%;border-radius:5px;background:linear-gradient(90deg,#ff7a3a,#ffd86a)"></div></div>`;
  document.body.appendChild(hud);

  function makeSureOfDragon() {
    const c = C();
    if (c.dragon && (c.days || 0) - c.dragon.got >= 3) return;
    c.dragon = { ...(c.dragon || {}), got: (c.days || 0) - 20, hatchTold: true, grownTold: true };
    saveCity();
  }
  function begin() {
    p24().started = true;
    st.phase = 24;
    save();
    redraw();
    makeSureOfDragon();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "One windy evening, Pip's storm scale begins to HUM in your pocket — and the wind through the window starts to whisper." },
      { dur: 4.6, black: true, gameCam: true, who: "The wind (very softly)", text: "“Far past the edge of every map… golden dunes… and under the sand, the Temple of the FIRST Moonkeeper. Her lantern still waits there, for the one who lights the way.”" },
      { dur: 4.4, black: true, gameCam: true, who: "Sprig", text: "“The FIRST Moonkeeper?! Before Renata, before everyone? Thistle, we HAVE to find it. …I'm bringing a hat. Deserts are hot.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🏜️ PHASE 24 — The Whispering Dunes. Go outdoors, press 1 to call your dragon, and choose “The Whispering Dunes”!", true) },
    ]);
  }

  DRAGON_DESTS.push({
    id: "dunes",
    icon: "🏜️",
    name: "The Whispering Dunes — the hidden desert",
    when: () => st.phase >= 24,
    go: () => fadeThrough(() => {
      ctx.goCity("dunes");
      ctx.placePlayer(DUNES.camp.x, DUNES.camp.z - 3, Math.PI);
      heat = 100;
      const s = p24();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "🏜️ The Whispering Dunes — the Temple of the First Moonkeeper shines gold in the sun."
        : "🏜️ THE WHISPERING DUNES! Find the four SUN-STONES at the old obelisks — the list (top right) tells you what the sand whispers. The sun is HOT: rest at an oasis 🌴 (or your camp ⛺) to cool down!", true);
    }, 1),
  });

  // 🏛️ inside the temple: light the four torches → the treasure room opens
  function insideInteract() {
    const s = p24();
    const Z = ctx.city();
    const P = PYRAMID;
    s.torches ||= {};
    if (near(P.door.x, P.door.z, 3)) return { label: "go back out into the desert ☀️", act: () => fadeThrough(() => {
      ctx.goCity("dunes");
      ctx.placePlayer(DUNES.temple.x, DUNES.temple.z + DUNES.temple.r + 3, 0);
    }, 0.8) };
    for (let i = 0; i < P.torches.length; i++) {
      const T = P.torches[i];
      if (s.torches[i] || !near(T.x, T.z, 2.4)) continue;
      return { label: "light the torch with the First Lantern 🔥", act: () => {
        s.torches[i] = true;
        save();
        chime();
        const n = Object.keys(s.torches).length;
        if (n < 4) return ctx.say(`🔥 The torch flares up — and a picture on the wall glows gold. (${n}/4 torches)`, true);
        playCutscene([
          { dur: 4.6, from: [0, 4, -6], look: [0, 2.6, -P.hall.r], text: "All four torches blaze — and with a deep stony GRIND, the great slab in the north wall begins to rise…", update: (k) => Z.openVault(k), end: () => Z.openVault(1) },
          { dur: 3.6, from: [0, 3, -P.hall.r + 2], look: [0, 1, P.vault.z], text: "…and behind it, glittering in the torchlight: the First Moonkeeper's TREASURE ROOM.", end: () => {
            s.vault = true;
            save();
            ctx.say("✨ The treasure room is open — go through the passage in the north wall!", true);
          } },
        ]);
      } };
    }
    if (s.vault && !s.treasure && near(P.vault.x, P.vault.z - 2.5, 2.6)) return { label: "open the First Moonkeeper's chest 🪙", act: () => {
      s.treasure = true;
      const c = C();
      c.coins = (c.coins || 0) + 300;
      (c.owned ||= {}).goldenscarab = true;
      saveCity();
      save();
      chime();
      if (Z.chestLid) Z.chestLid.rotation.x = -1.1;
      ctx.say("🪙 The chest creaks open: 300 gold coins — and a GOLDEN SCARAB that glints like the sun! (things you sell fetch more)", true);
    } };
    return null;
  }
  function interactable() {
    if (st.phase < 24) return null;
    if (here() === "pyramid") return insideInteract();
    const Z = zone();
    if (!Z || dragonFlying()) return null;
    const s = p24();
    for (const o of DUNES.obelisks) {
      if (s.stones[o.key]) continue;
      if (near(o.x + 2.6, o.z, 3.2)) return { label: `take the sun-stone from ${o.name} ${o.icon}`, act: () => {
        s.stones[o.key] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.stones).length;
        ctx.say(`☀️ A warm, glowing SUN-STONE from ${o.name}! (${n}/4)${n >= 4 ? " — ALL FOUR! Take them to the golden tip poking out of the sand, in the middle of the desert." : ""}`, true);
      } };
    }
    const T = DUNES.temple;
    if (s.raised && near(T.x, T.z + T.r + 1, 3.4)) return { label: "go inside the Temple of the First Moonkeeper 🏛️", act: () => fadeThrough(() => {
      ctx.goCity("pyramid");
      ctx.placePlayer(PYRAMID.door.x, PYRAMID.door.z - 3, Math.PI);
      ctx.say(p24().vault ? "🏛️ The temple hall — torches burning, the treasure room open to the north." : "🏛️ Inside the temple: a great hall of pillars and pictures of Moonkeepers. Four cold TORCHES stand by the walls — light them with the First Lantern (E)…", true);
    }, 0.8) };
    if (Object.keys(s.stones).length >= 4 && !s.raised && near(T.x, T.z, T.r + 5)) return { label: "set the four sun-stones round the golden tip 🏛️", act: finale };
    return null;
  }

  function finale() {
    const s = p24();
    const Z = zone();
    const T = DUNES.temple;
    s.raised = true;
    save();
    playCutscene([
      { dur: 4.2, from: [T.x + 24, 8, T.z + 30], look: [T.x, 2, T.z], text: "You set the four sun-stones in the sand round the golden tip. They blaze — dawn, noon, dusk and night — and the ground begins to SHAKE…" },
      { dur: 5, from: [T.x + 30, 12, T.z + 36], look: [T.x, 6, T.z], text: "…and up out of the dunes rises a TEMPLE — step after golden step, sand pouring off it like water, until it stands tall in the sun.", update: (k) => Z.raiseTemple(k), end: () => Z.raiseTemple(1) },
      { dur: 4.4, from: [T.x + 10, 18, T.z + 12], look: [T.x, 16, T.z], text: "On its very top, a small, plain lantern flickers alight — the first lantern any Moonkeeper ever carried.", run: () => (Z.lantern.visible = true) },
      { dur: 4.8, from: [T.x + 10, 18, T.z + 12], look: [T.x, 16, T.z], who: "A voice from the lantern, older than the forest", text: "“I was the first, little one. I lit this lantern so no one would ever be lost in the dark. Every Moonkeeper since has carried its light — Renata, and now you. Take it home.”" },
      { dur: 4, black: true, gameCam: true, who: "🏜️ PHASE 24 COMPLETE", text: "The Whispering Dunes\n🪙 700 · 🏮 The Lantern of the First Moonkeeper" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 700;
        (c.owned ||= {}).firstlantern = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🏮 The Lantern of the First Moonkeeper is yours — its light heals you, little by little, wherever you go. The temple's door is open now — go INSIDE (E at the door)!", true);
      } },
    ]);
  }

  function update(dt) {
    if (st.phase === 23 && st.p23 && st.p23.done && !p24().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (here() === "pyramid" && st.phase >= 24) {
      hud.style.display = "none";
      const Zp = ctx.city();
      const s0 = p24();
      Zp.torches.forEach((T, i) => (T.flame.visible = !!(s0.torches && s0.torches[i])));
      if (s0.vault) Zp.openVault(1);
      if (s0.treasure && Zp.chestLid) Zp.chestLid.rotation.x = -1.1;
      return;
    }
    const Z = zone();
    if (!Z || st.phase < 24) {
      hud.style.display = "none";
      return;
    }
    const s = p24();
    for (const o of DUNES.obelisks) Z.stones[o.key].visible = !s.stones[o.key];
    if (s.raised) {
      Z.raiseTemple(1);
      Z.lantern.visible = true;
    }
    // ☀️ the heat: rises in the sun, cools in the shade of an oasis or your camp
    if (s.done || ctx.playing()) {
      hud.style.display = "none";
      return;
    }
    const shade = DUNES.oases.some((o) => near(o.x, o.z, o.r + 1.5)) || near(DUNES.camp.x, DUNES.camp.z, 7);
    heat = shade ? Math.min(100, heat + dt * 30) : Math.max(0, heat - dt * 1.4);
    hud.style.display = "";
    hud.querySelector("#heatBar").style.width = heat + "%";
    hud.querySelector("#heatTxt").textContent = shade ? "🌴 Cooling off in the shade…" : heat < 30 ? "🥵 SO HOT — find shade (an oasis 🌴)!" : "☀️ Cool enough · rest in shade to cool down";
    if (heat < 30 && !hotTold) {
      hotTold = true;
      ctx.say("🥵 Phew, it's HOT! Get to an oasis 🌴 (the palm trees with water) before you faint!", true);
    }
    if (heat > 60) hotTold = false;
    if (heat <= 0) {
      heat = 100;
      fadeThrough(() => ctx.placePlayer(DUNES.camp.x, DUNES.camp.z - 3, Math.PI), 1);
      ctx.say("😵 The heat was too much — you wake up in the cool of your tent at camp. (Rest at the oases 🌴 on the way!) Your sun-stones are safe.", true);
    }
  }

  function panelHTML() {
    const s = p24();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🏜️ The Whispering Dunes</h3><ul>
      ${row(s.been, "Fly your dragon to the Whispering Dunes <div class=\"sub\">&nbsp;&nbsp;outdoors: press 1 → “The Whispering Dunes”</div>")}
      ${DUNES.obelisks.map((o) => row(s.stones[o.key], `${o.icon} Sun-stone at ${o.name}${s.stones[o.key] ? "" : `<div class="sub">&nbsp;&nbsp;🌬️ “${o.whisper}”</div>`}`)).join("")}
      ${row(s.done, "Raise the Temple of the First Moonkeeper (the golden tip in the middle)")}
    </ul><div class="kit">🌴 rest in an oasis's shade to cool off · the obelisks are tall and golden-tipped</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p24().done };
}
