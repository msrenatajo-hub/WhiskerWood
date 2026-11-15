// ------------------------------------------------------------
//  ⛸️  FROSTPINE'S FROZEN LAKE — the rink, the skate hut, and the
//  figure-skating show.
//
//  • From Frostpine, follow the ⛸️ signpost down to the lake.
//  • The skate hut: buy Ice Skates, and choose their colour (ribbons too!).
//  • The judges' booth: skate a 45-second routine to waltz music. The
//    judges watch everything — spins, spirals, hops, AXELS, hockey stops,
//    carving and speed (and falls…) — then hold up their score cards for
//    Technique, Artistry and Courage. Gold, silver or bronze, and coins.
// ------------------------------------------------------------
import * as THREE from "three";
import { cityState, saveCity, openCard, hasItem, registerKeepsake } from "./cityLife.js";
import { RINK } from "./questZones.js";
import { SKATE_COLORS } from "./skating.js";
import { cost } from "./economy.js";
import { signPost } from "./signs.js";

registerKeepsake("skatemedal", "🥇", "The Frozen Lake Gold Medal (figure skating champion)");
const ROUTINE = 45;
const NAMES = { spin: "🌀 spins", spiral: "🦢 spirals", hop: "🦘 hops", axel: "✨ axels", hockey: "🛑 hockey stops", carve: "↪️ carving", fall: "💫 falls" };

export function initRink(ctx) {
  // ctx: { world(), city(), goCity, placePlayer, say, chime, mouseRig, skating }
  const S = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  if (new URLSearchParams(location.search).get("skates")) (S().owned ||= {}).skates = true; // (test: own skates)

  // ---------------------------------------------------------------- the signpost in Frostpine
  let sign = null;
  function frostpineSign() {
    const c = ctx.city();
    if (!c || c.id !== "frostpine") return null;
    if (sign && sign.c === c) return sign;
    const a = c.spots.arrive;
    const x = a.x + 5;
    const z = a.z - 3;
    const y = c.height(x, z);
    // 🪧 a big, crisp, frosty signpost (readable from both sides — see signs.js)
    const g = signPost("⛸️ FROZEN LAKE", { w: 3.4, h: 0.9, height: 1.75, style: "ice", post: 0x6a4a2c });
    g.rotation.y = Math.atan2(a.x - x, a.z - z); // turned to greet you as you arrive
    g.position.set(x, y, z);
    c.group.add(g);
    return (sign = { c, x, z });
  }

  // ---------------------------------------------------------------- 🎵 a little waltz (no files: a synth)
  let music = null;
  function startMusic() {
    stopMusic();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const out = ac.createGain();
      out.gain.value = 0.08;
      out.connect(ac.destination);
      const beat = 60 / 168;
      // [melody note (midi), bass root] per bar of three beats
      const BARS = [[76, 48], [79, 55], [81, 53], [79, 48], [77, 50], [76, 55], [74, 55], [72, 48], [76, 48], [79, 55], [84, 53], [83, 55], [81, 53], [79, 48], [77, 55], [76, 48]];
      const tone = (midi, t, dur, type, vol) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + dur + 0.05);
      };
      let bar = 0;
      let next = ac.currentTime + 0.1;
      const tick = () => {
        while (next < ac.currentTime + 0.6) {
          const [mel, root] = BARS[bar % BARS.length];
          tone(root, next, beat * 0.9, "triangle", 0.5); // OOM
          tone(root + 16, next + beat, beat * 0.5, "sine", 0.22); // pah
          tone(root + 19, next + beat * 2, beat * 0.5, "sine", 0.22); // pah
          tone(mel, next, beat * 2.6, "triangle", 0.35);
          if (bar % 2) tone(mel - 3, next + beat * 2, beat * 0.9, "triangle", 0.2);
          next += beat * 3;
          bar++;
        }
      };
      tick();
      music = { ac, iv: setInterval(tick, 150) };
    } catch {}
  }
  function stopMusic() {
    if (!music) return;
    clearInterval(music.iv);
    music.ac.close().catch(() => {});
    music = null;
  }

  // ---------------------------------------------------------------- the routine
  let routine = null;
  const hud = document.createElement("div");
  hud.style.cssText = "position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:35;min-width:300px;max-width:90vw;padding:8px 16px;border-radius:14px;background:rgba(30,40,80,.82);color:#eef4ff;font:bold 14px system-ui;text-align:center;pointer-events:none;display:none;box-shadow:0 0 18px rgba(160,200,255,.5)";
  document.body.appendChild(hud);
  function trick(k, n = 1) {
    if (!routine) return;
    routine.tally[k] = (routine.tally[k] || 0) + n;
  }
  function startRoutine() {
    if (!hasItem("skates")) return ctx.say("⛸️ The judges smile: “You'll need skates first, little one!” — the skate hut is on the west shore.", true);
    routine = { t: ROUTINE, tally: {}, maxSpeed: 0 };
    startMusic();
    ctx.say("🎵 The music begins! Show the judges everything: push for speed, CARVE, SPIN (Shift, slow), SPIRAL (F), hops and AXELS (Space twice), hockey stops (S)… and try not to fall!", true);
    for (const J of (ctx.city().judges || [])) J.card.visible = false;
  }
  const half = (v) => Math.round(Math.max(0, Math.min(10, v)) * 2) / 2;
  function finishRoutine() {
    const r = routine;
    routine = null;
    stopMusic();
    hud.style.display = "none";
    const T = r.tally;
    const n = (k) => T[k] || 0;
    const variety = ["spin", "spiral", "hop", "axel", "hockey", "carve"].filter((k) => n(k) > (k === "spin" || k === "spiral" || k === "carve" ? 0.6 : 0)).length;
    const technique = half(1.5 + n("axel") * 1.4 + n("hockey") * 0.7 + Math.min(4, n("hop")) * 0.35 + Math.min(2.5, n("glide") / 160) - n("fall") * 1.5);
    const artistry = half(1 + Math.min(3, n("spin") * 0.6) + Math.min(3, n("spiral") * 0.7) + Math.min(2, n("carve") * 0.3) + variety * 0.55 - n("fall"));
    const courage = half(1.5 + Math.min(4, r.maxSpeed / 6) + n("axel") * 0.7 + (n("fall") ? 0 : 1.5));
    const total = technique + artistry + courage;
    const medal = total >= 24 ? "gold" : total >= 17 ? "silver" : total >= 10 ? "bronze" : null;
    const coins = Math.round(total * 3) + (medal === "gold" ? 40 : medal === "silver" ? 20 : medal === "bronze" ? 10 : 0);
    const s = S();
    s.coins = (s.coins || 0) + coins;
    const best = s.skateBest || 0;
    if (total > best) s.skateBest = total;
    if (medal === "gold") (s.owned ||= {}).skatemedal = true;
    saveCity();
    ctx.chime();
    // the judges hold up their cards
    const scores = [technique, artistry, courage];
    (ctx.city().judges || []).forEach((J, i) => {
      const g = J.cv.getContext("2d");
      g.fillStyle = "#fffaf0";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#3a5a9a";
      g.lineWidth = 8;
      g.strokeRect(4, 4, 120, 120);
      g.fillStyle = "#2a2a4a";
      g.font = '900 84px "Trebuchet MS", Verdana, sans-serif'; // (big + heavy: readable from the ice)
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(scores[i]), 64, 68, 112);
      J.tex.needsUpdate = true;
      J.card.visible = true;
    });
    const tricks = Object.entries(NAMES).filter(([k]) => n(k) > 0).map(([k, nm]) => `${nm} ${k === "spin" || k === "spiral" || k === "carve" ? n(k).toFixed(1) + "s" : "×" + n(k)}`).join(" · ") || "just gliding";
    openCard(`<div class="card" style="text-align:center"><h3>⛸️ The Judges' Scores</h3>
      <div style="display:flex;gap:12px;justify-content:center;margin:12px 0">
        ${[["Technique", technique], ["Artistry", artistry], ["Courage", courage]].map(([nm, v], i) => `<div style="background:#fffaf0;color:#2a2a4a;border:4px solid #3a5a9a;border-radius:10px;padding:10px 14px;min-width:84px;animation:judgeFlip .6s ${i * 0.5}s both"><div style="font:bold 34px Georgia">${v}</div><div style="font-size:12px">${nm}</div></div>`).join("")}
      </div>
      <div class="coins" style="font-size:18px">Total: <b>${total}</b> / 30 ${medal ? `· ${medal === "gold" ? "🥇 GOLD!" : medal === "silver" ? "🥈 Silver!" : "🥉 Bronze!"}` : ""}</div>
      <div class="msg">${tricks}</div>
      <div class="msg">🪙 +${coins}${total > best ? " · ✨ a NEW personal best!" : ` · your best: ${best}`}</div>
      <div class="close">Esc — back to the ice</div></div>
      <style>@keyframes judgeFlip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }</style>`);
  }

  // ---------------------------------------------------------------- 🛖 the skate hut
  function hutCard(msg = "") {
    const s = S();
    const L = (s.skate ||= { color: "pink", ribbon: true });
    const owned = hasItem("skates");
    openCard(`<div class="card"><h3>🛖 The Skate Hut</h3><div class="coins">🪙 ${s.coins} · “Every skater needs the right pair!”</div>
      ${owned ? "" : `<div class="item"><span class="ic">⛸️</span><span class="nm">Ice Skates<small>real skating on any ice — yours to keep</small></span><button id="buySk" ${s.coins < cost(22, "skates") ? "disabled" : ""}>🪙 ${cost(22, "skates")}</button></div>`}
      <h4>Your skates' colour</h4>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px">
        ${SKATE_COLORS.map((c) => `<button data-c="${c.key}" title="${c.name}" style="width:44px;height:44px;border-radius:50%;cursor:pointer;background:#${c.color.toString(16).padStart(6, "0")};border:${L.color === c.key ? "4px solid #ff6fb5" : "2px solid #fff"};box-shadow:0 2px 6px rgba(0,0,0,.3)"></button>`).join("")}
      </div>
      <div class="item"><span class="ic">🎀</span><span class="nm">Ribbon bows on your skates</span><button id="ribbon">${L.ribbon ? "on ✓" : "off"}</button></div>
      <div class="msg">${msg}</div><div class="close">Esc — back to the ice</div></div>`, (el) => {
      const buy = el.querySelector("#buySk");
      if (buy) buy.onclick = () => {
        if (s.coins < cost(22, "skates")) return;
        s.coins -= cost(22, "skates");
        (s.owned ||= {}).skates = true;
        saveCity();
        ctx.chime();
        hutCard("⛸️ Your very own Ice Skates! Step onto the ice and push off (W)!");
      };
      el.querySelectorAll("button[data-c]").forEach((b) => (b.onclick = () => {
        L.color = b.dataset.c;
        saveCity();
        hutCard(`✨ ${SKATE_COLORS.find((c) => c.key === L.color).name} skates — lovely!`);
      }));
      el.querySelector("#ribbon").onclick = () => {
        L.ribbon = !L.ribbon;
        saveCity();
        hutCard(L.ribbon ? "🎀 Ribbons on!" : "Ribbons off.");
      };
    });
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    const w = here();
    if (w === "frostpine") {
      const sg = frostpineSign();
      if (sg && near(sg.x, sg.z, 2.6)) return { label: "follow the path down to the Frozen Lake ⛸️", act: () => {
        ctx.goCity("rink");
        ctx.placePlayer(RINK.gate.x, RINK.gate.z - 3, Math.PI);
        ctx.say(hasItem("skates")
          ? "⛸️ Frostpine's Frozen Lake! Step onto the ice and PUSH OFF (W). The judges' booth is on the far shore — skate a routine for them!"
          : "⛸️ Frostpine's Frozen Lake! You'll need skates — the skate hut is on the west shore.", true);
      } };
    }
    if (w !== "rink") return null;
    if (routine) return null;
    if (near(RINK.gate.x, RINK.gate.z, 3)) return { label: "go back up to Frostpine ❄️", act: () => {
      ctx.goCity("frostpine");
      const a = ctx.city().spots.arrive;
      ctx.placePlayer(a.x + 3, a.z - 1, 0);
    } };
    if (near(RINK.hut.x + 3.4, RINK.hut.z, 2.6)) return { label: "visit the skate hut 🛖", act: () => hutCard() };
    if (near(RINK.judges.x, RINK.judges.z + 2.4, 4)) return { label: `perform a routine for the judges 🎵 (${ROUTINE} seconds)${S().skateBest ? ` · best ${S().skateBest}` : ""}`, act: startRoutine };
    return null;
  }

  function update(dt) {
    if (!routine) return;
    if (here() !== "rink") {
      routine = null;
      stopMusic();
      hud.style.display = "none";
      return;
    }
    routine.t -= dt;
    routine.maxSpeed = Math.max(routine.maxSpeed, ctx.skating.speed ? ctx.skating.speed() : 0);
    const T = routine.tally;
    const live = Object.entries(NAMES).filter(([k]) => (T[k] || 0) > 0 && k !== "fall").map(([, nm]) => nm.split(" ")[0]).join(" ");
    hud.style.display = "";
    hud.textContent = `🎵 ${Math.max(0, Math.ceil(routine.t))}s · ${live || "show the judges your best tricks!"}${T.fall ? ` · 💫×${T.fall}` : ""}`;
    if (routine.t <= 0) finishRoutine();
  }

  return { interactable, update, trick, performing: () => !!routine };
}
