// ------------------------------------------------------------
//  ❓  THE HELP BOOK (Z, or the ❓ Help button) — every key and every
//  thing to do in WhiskerWood, in one place, in chapters.
// ------------------------------------------------------------
import { openCard, closeCard } from "./cityLife.js";

const CHAPTERS = [
  ["🐭 Moving around", [
    ["W A S D / arrows", "walk and turn"],
    ["Space", "jump — press again in mid-air for a double jump"],
    ["Hold Space while falling", "GLIDE (once you have the 🪶 Owl-Feather Cloak)"],
    ["Shift", "sprint (it runs out, then refills)"],
    ["Walk into a tree + hold W", "climb (🧗 Climbing Spikes let you climb higher)"],
    ["Caps Lock", "ride your pony 🐴 · belly-sled on any snow (Frostpine, the Starlight Pass, the Aurora Reach)"],
    ["F", "stand up and look at the sky — or, right by something odd, LOOK CLOSELY at it (a glowing blue frame) 🔍"],
    ["🔍 Secrets", "Hidden things are EVERYWHERE (Frostpine is full of them!). Hold F to look closely at odd little things, try things with E, play tunes on your flute, come back at night or on misty mornings, and listen to the 👂 Gossip in each city square. Your Collection Book (N) has a 🔍 Secrets page."],
    ["⛸️ Ice Skating", "with Ice Skates on ice: W push off (again and again!) · A/D carve · S hockey stop · Space hop (twice = AXEL) · Shift spin (slow) or tuck (fast) · F spiral. Frostpine's Frozen Lake (follow the ⛸️ signpost in Frostpine) has a skate hut and a figure-skating show with judges!"],
    ["✨ Powers", "EVERYTHING you buy or make does something — sell for more, jump higher, sprint longer, stay warm, heal, catch fish sooner, grow crops faster, hold your breath longer. Hang your treasures on your walls (E on a hook) and they become LIVING paintings! See your powers in your backpack (B)."],
  ]],
  ["✋ Doing things", [
    ["E", "talk, gather, buy, use — whatever the prompt says"],
    ["G", "grab or drop something with your teeth"],
    ["X", "get in or out of your nest (at home)"],
  ]],
  ["📚 Books & menus", [
    ["B", "your backpack — 🍴 eat food, 👕 wear clothes, 🐾 choose your pet"],
    ["J", "Thistle's journal (the story so far)"],
    ["Q", "⚔️ the Quest Log — start quests, choose which to track"],
    ["N", "📖 the Collection Book — bugs, fish and fossils"],
    ["M", "🗺️ the map · click to drop a marker"],
    ["L", "📬 your mailbox — letters (and presents) from friends"],
    ["I", "📜 your storybook — the tale of YOUR adventure"],
    ["Y", "🏆 titles & badges (and New Game+)"],
    ["H", "🧑‍🎓 talk to Sprig — tips for your Life Goals, and lessons"],
    ["O", "🏘️ your village board (in the forest)"],
    ["C", "🏡 your Life Goals (optional, just for fun)"],
    ["Z", "❓ this help book"],
  ]],
  ["🌙 Moonkeeper powers", [
    ["K", "travel the Moonkeepers' roads (once you're a Moonkeeper)"],
    ["Waystones / stations", "E to travel the roads"],
    ["🎈 Balloons", "fly between cities — steer with A/D, W/S, catch ⭐ stars"],
  ]],
  ["🎨 Fun extras", [
    ["P", "📸 photo mode — A/D orbit, W/S zoom, Q frame, Space snap"],
    ["U", "🪈 take out your reed flute — play ANY notes on keys 1–8 · seven 6-note songs (shown in the guide at the top) really DO things: flowers, sunrise, moonlit night, calm, rain, clear skies, butterflies · Esc or ✕ to put it away"],
    ["T", "skip time forward (in the forest)"],
    ["R", "change the weather (in the forest)"],
    ["V", "change the picture size"],
  ]],
  ["🗺️ Where things are", [
    ["Your den", "🌱 garden beds · 🐣 nursery · 🏘️ village board · 🧩 the vault door is near the school"],
    ["Everbough", "🛍️ Market Circle stalls · 🏛️ museum · 🛋️ furniture · 🏰 guild board · 🌙 night market"],
    ["Reedmere", "🎣 fishing + the tournament board · 🌊 dive at the flooded ruins (Drowned Library)"],
    ["Golden Hollow", "🔥 bonfire (afternoons) · 🍲 Great Cauldron + Harvest Feast · 🎼 music stage · 🌱 farms"],
    ["Frostpine", "🐾 pet shop · 🐕 dog sleds · 🏔️ the Pact Peaks (Warden Ivo)"],
    ["Silverveil", "🌙 the moon-pool · 🦌 the Moon Stag (at night)"],
    ["Every city", "🏁 a time trial flag · ❗ quest givers · 💬 friends to chat with · 🕵️ a mystery to solve"],
    ["Castle Hill (forest)", "🏰 build your own castle, piece by piece"],
    ["By your den", "🎨 your painting easel"],
    ["Reedmere harbour", "⛵ sail to the OPEN SEA — four islands of treasure (and a dragon egg!)"],
    ["Silverveil (at night)", "🔭 the telescope — trace constellations, spot a comet"],
    ["🎪 The circus", "visits a different city every week — juggling + tightrope"],
  ]],
  ["💡 Good to know", [
    ["Golden beam", "shows where to go for your story or the quest you're tracking"],
    ["Coins", "sell things at any market stall · finish quests · catch fish"],
    ["Hearts", "eat food from your backpack (B → 🍴 eat)"],
    ["Your game saves itself", "close the tab or refresh any time — you won't lose anything"],
  ]],
];

export function initHelp(ctx) {
  function open() {
    openCard(
      `<div class="card" style="width:min(640px,94vw);max-height:86vh;overflow:auto">
      <h3 style="font:bold 24px Georgia">❓ The WhiskerWood Help Book</h3>
      <div class="coins">everything you can do — and how</div>
      ${CHAPTERS.map(([title, rows]) => `<h4 style="margin:14px 0 6px;font:bold 17px Georgia;color:#5a3a12">${title}</h4>
        <table style="width:100%;border-collapse:collapse;font:14px system-ui">${rows.map(([k, v]) => `<tr><td style="padding:4px 8px;white-space:nowrap;vertical-align:top"><b style="display:inline-block;padding:2px 7px;border-radius:6px;background:#5a3a12;color:#fff3d8">${k}</b></td><td style="padding:4px 8px">${v}</td></tr>`).join("")}</table>`).join("")}
      <div class="close">Z or Esc — close</div></div>`
    );
    isOpen = true;
  }
  let isOpen = false;
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyZ" || e.repeat || ctx.playing()) return;
    if (isOpen && document.querySelector("#shop.open")) {
      closeCard();
      isOpen = false;
    } else open();
  });
  // ❓ a Help button, next to Credits
  const btn = document.createElement("button");
  btn.textContent = "❓ Help (Z)";
  ctx.styleLike(btn);
  btn.addEventListener("click", () => {
    btn.blur();
    open();
  });
  document.body.appendChild(btn);
  return { open };
}
