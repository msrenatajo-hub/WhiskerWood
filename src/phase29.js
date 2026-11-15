// ------------------------------------------------------------
//  🌑  PHASE 29 — "The Shadow Thief"
//
//  One morning every Festival lantern in the Great Cities has gone DARK.
//  Someone is stealing the light. Look round each dark lantern for a clue
//  (Reedmere, Golden Hollow, Frostpine, Silverveil) — every clue says the
//  thief was COLD — and they all point to SHADOWMERE, the marsh where the
//  shadows live. Follow the cold footprints through the fog… and find
//  Umbra, a lonely shadow-creature who only wanted to be warm. Shouting
//  won't help. Sit with it. Share some warmth. Make a friend.
// ------------------------------------------------------------
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake, openCard, closeCard } from "./cityLife.js";
import { FOOD } from "./food.js";
import { SHADOW } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";

registerKeepsake("umbraribbon", "🎀", "Umbra's Shadow-Ribbon (from a friend who was cold)");

const CLUES = [
  { key: "reedmere", name: "Reedmere", icon: "🐾", text: "Tiny FROSTY paw-prints all round the lantern post — frost, in the middle of summer! Whatever took the light was very, very cold." },
  { key: "golden", name: "Golden Hollow", icon: "🖤", text: "A wisp of something dark caught on the lantern's hook — soft as smoke, and cold as a winter night. It's trembling, like it's shivering." },
  { key: "frostpine", name: "Frostpine", icon: "✨", text: "A trail of dark glitter that drinks up the light round it, leading away out of the city… towards the Great Forest." },
  { key: "silverveil", name: "Silverveil", icon: "📜", text: "The Last Keeper: “Cold, and dark, and hungry for light? There's only one place like that — SHADOWMERE, the marsh where the shadows live.”" },
];

export function initPhase29(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p29 = () => (st.p29 ||= { started: false, clues: {}, found: false, sat: false, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "shadowmere" ? ctx.city() : null);
  const allClues = () => CLUES.every((c) => p29().clues[c.key]);
  let wait = 0;

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("shadowmere");
      ctx.placePlayer(SHADOW.arrive.x, SHADOW.arrive.z, Math.PI);
      ctx.say(p29().done
        ? "🌑 Shadowmere — misty and quiet. Somewhere in the hollow, Umbra is humming to itself, warm at last."
        : "🌑 SHADOWMERE. It's so cold here, and so dim… Look at the ground — little cold FOOTPRINTS, glowing faintly. Follow them!", true);
    }, 1.2);
  }
  DRAGON_DESTS.push({ id: "shadowmere", icon: "🌑", name: "Shadowmere — the marsh where the shadows live", when: () => st.phase >= 29 && (allClues() || p29().done), go: goThere });

  function begin() {
    p29().started = true;
    st.phase = 29;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "One morning Sprig bursts through your door, still in his slippers." },
      { dur: 4.6, black: true, gameCam: true, who: "Sprig", text: "“Thistle — the LANTERNS! All the Festival lanterns, in every city — they've gone DARK. Not blown out… EMPTY. Like someone scooped the light right out of them!”" },
      { dur: 4.2, black: true, gameCam: true, text: "Somebody is stealing the light. And whoever it is leaves only a strange, cold stillness behind." },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("🌑 PHASE 29 — The Shadow Thief. Visit the dark Festival lantern in Reedmere, Golden Hollow, Frostpine and Silverveil — look round each one for a clue (E).", true) },
    ]);
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 29 || p29().done) return null;
    const s = p29();
    const id = here();
    const clue = CLUES.find((c) => c.key === id);
    if (clue && !s.clues[id] && api.postFor) {
      const P = api.postFor(ctx.city());
      if (P && near(P.x, P.z, 3.2)) return { label: "look round the dark lantern for clues 🔍", act: () => {
        s.clues[id] = true;
        save();
        redraw();
        chime();
        const n = Object.keys(s.clues).length;
        ctx.say(`${clue.icon} ${clue.text} (${n}/4 clues)${n >= 4 ? " — Now you know where to look. Call your dragon (1) and fly to SHADOWMERE!" : ""}`, true);
      } };
    }
    const Z = zone();
    if (!Z) return null;
    const H = SHADOW.hollow;
    if (s.found && near(H.x, H.z, 4.2)) return { label: "talk to the shadow-creature… gently 🌑", act: talkToUmbra };
    return null;
  }

  function meetUmbra() {
    const s = p29();
    const Z = zone();
    const H = SHADOW.hollow;
    const y = Z.height(H.x, H.z);
    s.found = true;
    save();
    redraw();
    playCutscene([
      { dur: 4.4, from: [H.x + 9, y + 4, H.z + 12], look: [H.x, y + 1.5, H.z], text: "The footprints end in a hollow ringed with stones — and it's full of LIGHT. Every stolen lantern-glow, glimmering in jars." },
      { dur: 4.4, from: [H.x + 4, y + 2.4, H.z + 6], look: [H.x, y + 1.4, H.z], text: "In the middle sits a shadow. A small, soft, shivering shadow, with two huge glowing eyes — and it shrinks back from you, trembling." },
      { dur: 3.8, from: [H.x + 4, y + 2.4, H.z + 6], look: [H.x, y + 1.4, H.z], who: "Sprig (whispering)", text: "“Thistle… I don't think it's a monster. I think it's SCARED.”" },
      { dur: 0.4, gameCam: true, end: () => ctx.say("🌑 Walk up to the shadow-creature and talk to it (E). Be gentle…", true) },
    ]);
  }

  function warmThings() {
    const out = [];
    for (const F of Object.values(FOOD)) if (F.warm && (ctx.packCount(F.name) || 0) > 0) out.push(F);
    return out;
  }
  function talkToUmbra(msg = "") {
    const s = p29();
    const warm = warmThings();
    openCard(`<div class="card"><h3>🌑 The Shadow-Creature</h3>
      <div class="coins" style="font-style:italic">It watches you with enormous, frightened eyes. It's shivering so hard the mist trembles.</div>
      ${!s.sat ? `
        <div class="item"><span class="ic">😠</span><span class="nm">“Give back the lights, you THIEF!”</span><button data-c="shout">say it</button></div>
        <div class="item"><span class="ic">🪵</span><span class="nm">Sit down beside it, very quietly</span><button data-c="sit">sit</button></div>`
      : `
        ${warm.slice(0, 3).map((F, i) => `<div class="item"><span class="ic">${F.icon}</span><span class="nm">Share your ${F.name}<small>something warm, from your bag</small></span><button data-c="food" data-i="${i}">share</button></div>`).join("")}
        <div class="item"><span class="ic">🧥</span><span class="nm">Wrap your Moonkeeper cloak round its shoulders</span><button data-c="cloak">wrap</button></div>`}
      <div class="msg">${msg}</div><div class="close">Esc — step back</div></div>`, (el) => el.querySelectorAll("button[data-c]").forEach((b) => (b.onclick = () => {
      const c = b.dataset.c;
      if (c === "shout") {
        closeCard();
        return ctx.say("🌑 The shadow SHRINKS into a tiny ball, and the mist rolls thick and cold round your paws. …That only made it more frightened. Try being kind.", true);
      }
      if (c === "sit") {
        s.sat = true;
        save();
        redraw();
        return talkToUmbra("You sit down on a cold stone beside it, and say nothing at all. After a long while… one glowing eye peeks out at you. It's still shivering.");
      }
      if (c === "food") {
        const F = warm[+b.dataset.i];
        if (F) ctx.packTake(F.name, 1);
        closeCard();
        return finale(F ? `the warm ${F.name}` : "something warm");
      }
      if (c === "cloak") {
        closeCard();
        return finale("your cloak");
      }
    })));
  }

  function finale(gift) {
    const s = p29();
    const Z = zone();
    const H = SHADOW.hollow;
    const y = Z.height(H.x, H.z);
    playCutscene([
      { dur: 4.6, from: [H.x + 4, y + 2.4, H.z + 6], look: [H.x, y + 1.4, H.z], text: `You share ${gift} with the little shadow. It holds it close… and slowly, slowly, it stops shivering.`, run: () => (Z.umbraWarm = true) },
      { dur: 5, from: [H.x + 4, y + 2.4, H.z + 6], look: [H.x, y + 1.4, H.z], who: "The shadow (in a voice like a whisper of wind)", text: "“I'm… Umbra. It's always so COLD in the dark. I saw your lanterns, so bright and warm… I only wanted to feel warm too. I'm sorry. I didn't know they were yours.”" },
      { dur: 4.6, from: [H.x + 10, y + 6, H.z + 12], look: [H.x, y + 4, H.z], text: "Umbra opens every jar. The stolen lights rise up out of the hollow like golden fireflies — and drift away over the treetops, home to their lanterns.", run: () => (Z.lights || []).forEach((L) => (L.lightG.visible = false)) },
      { dur: 4.4, black: true, gameCam: true, text: "In Reedmere, in Golden Hollow, in Frostpine, in Silverveil, the Festival lanterns flicker… and blaze back to life." },
      { dur: 4.6, black: true, gameCam: true, who: "Umbra", text: "“Will you… come and see me again? Nobody has ever sat with me before.” — “Of course,” you say. “That's what friends do.”" },
      { dur: 4, black: true, gameCam: true, who: "🌑 PHASE 29 COMPLETE", text: "The Shadow Thief\n🪙 800 · 🎀 Umbra's Shadow-Ribbon\nand a new friend" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 800;
        (c.owned ||= {}).umbraribbon = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🌑 Every lantern is lit again — and Umbra is your friend now. (Umbra's Shadow-Ribbon keeps you warm on the coldest nights.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function update(dt) {
    if (st.phase === 28 && st.p28 && st.p28.done && !p29().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    const Z = zone();
    if (!Z || st.phase < 29) return;
    const s = p29();
    if (s.done) {
      Z.umbraWarm = true;
      (Z.lights || []).forEach((L) => (L.lightG.visible = false));
    }
    // the footprints glow brighter the closer you are
    const p = me();
    Z.prints.forEach((pr) => (pr.material.opacity = Math.max(0.15, 0.85 - Math.hypot(p.x - pr.position.x, p.z - pr.position.z) / 30)));
    if (!s.found && !s.done && near(SHADOW.hollow.x, SHADOW.hollow.z, 15) && !ctx.playing()) meetUmbra();
    // Umbra turns to watch you
    Z.umbra.rotation.y = Math.atan2(p.x - Z.umbra.position.x, p.z - Z.umbra.position.z);
  }

  function panelHTML() {
    const s = p29();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🌑 The Shadow Thief</h3><ul>
      ${CLUES.map((c) => row(s.clues[c.key], `${c.icon} Search ${c.name}'s dark Festival lantern for clues`)).join("")}
      ${row(s.found, "Follow the cold footprints through Shadowmere <div class=\"sub\">&nbsp;&nbsp;🐉 press 1 → “Shadowmere”</div>")}
      ${row(s.done, "Make friends with the shadow-creature — be gentle")}
    </ul><div class="kit">🔍 the lanterns stand beside each city's waystone</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p29().done };
}
