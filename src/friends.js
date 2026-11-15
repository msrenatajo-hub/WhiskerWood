// ------------------------------------------------------------
//  💌  FRIENDS + LETTERS — the townsfolk of the Great Cities.
//  Chat once a day (+1 ❤️), give gifts (+1, or +2 for a favorite — and
//  EVERYONE loves home cooking). At 2 hearts they tell you about their
//  life, at 4 they share a secret, at 5 you're best friends — and each
//  time a letter arrives in your mailbox (L), often with a present.
// ------------------------------------------------------------
import { cityState, saveCity, openCard, closeCard, registerKeepsake } from "./cityLife.js";
import { isDish } from "./cooking.js";

// name → favorites + their story (part 1 at 2 hearts, part 2 at 4) + a best-friend present
export const FOLK = {
  "Harbormaster Brindle": { favs: ["fish", "feather", "smooth stone"], gift: { coins: 40 },
    story: ["My grandfather built the first jetty in Reedmere, plank by plank. I still check every nail of it each morning — old habits!", "Between you and me… I'm terrified of deep water. Never learned to swim! A harbormaster who can't swim. Don't tell the fishers."] },
  "Fisher Mallow": { favs: ["fish", "berry", "creek water"], gift: { item: "Fish", n: 5 },
    story: ["I've caught every fish in the lagoon at least once. Except one — a silver eel with a crooked fin. Forty years I've tried!", "The secret to fishing? Humming. Fish love a hum. My mother taught me the tune — I'll hum it for you some day."] },
  "Lightkeeper Wick": { favs: ["glowing moss", "bee wax", "firefly"], gift: { coins: 50 },
    story: ["I've kept the Lighthouse of Reeds burning for fifty-one years. Not one night dark. Not ONE.", "Some nights, when the fog is thick, I see another light out on the water, blinking back at mine. I think it's Renata, still walking the old roads."] },
  "Harvest-Mother Barley": { favs: ["carrot", "pumpkin", "strawberry", "egg", "milk"], gift: { item: "Pumpkins", n: 4 },
    story: ["I've judged the Harvest Feast for thirty years. The secret? Taste with your heart, not your tongue!", "My first Feast entry was a burnt turnip. I cried for a week! Now look at me. Everyone starts somewhere, little one."] },
  "Farmer Sprout": { favs: ["clover seed", "oat grain", "sunflower"], gift: { item: "Sunflowers", n: 4 },
    story: ["I talk to my plants every morning. They grow better — it's true! The sunflowers are the chattiest.", "I once grew a pumpkin so big we used it as a house for a whole summer. My little brother still lives in the shell. Well — he keeps his boots there."] },
  "Henkeeper Dottie": { favs: ["egg", "oat grain", "berry"], gift: { item: "Eggs", n: 6 },
    story: ["Every one of my hens has a name. Pecky, Fluff, Duchess, Sir Clucks-a-Lot… I could go on. I WILL go on, if you let me.", "The chicken-feeding contest was MY idea. I just wanted the hens to get extra treats. Now it's the most famous race in the Hollow!"] },
  "Warden Ivo": { favs: ["ice crystal shard", "crystal fragment", "twig"], gift: { coins: 50 },
    story: ["The Wardens have kept the mountain passes safe since the Northern Pact. My great-great-grandmother lit the very first signal fire beside Renata herself.", "When I was your age I got lost in a blizzard for two whole days. A snow fox led me home. Ever since, I leave a little cheese out for the foxes."] },
  "Woodcarver Alder": { favs: ["twig", "bark strip", "acorn cap"], gift: { item: "Twigs", n: 8 },
    story: ["Every sled in Frostpine was carved in my workshop. I can tell whose it is just by the sound it makes on the snow!", "I'm carving something secret — a statue of every Moonkeeper who ever lived. I've done forty-one. You'll be number forty-two."] },
  "Keeper Hollis": { favs: ["moon petal", "crystal fragment", "glowing mushroom"], gift: { coins: 45 },
    story: ["The Hall of Everfrost holds a thousand frozen whispers. I've listened to every one. Some are sad, some are silly. One is just a sneeze.", "My favorite whisper is a little mouse laughing, long ago. Nobody knows who she was. I like to think she was happy."] },
  "The Last Keeper": { favs: ["moon petal", "glowing moss", "owl feather"], gift: { coins: 80 },
    story: ["I was Renata's apprentice, long, long ago — like Sprig is yours. She gave me this city to keep until someone came back.", "Renata told me one more thing before she went: 'The roads remember everyone who walks them kindly.' They remember you, Thistle."] },
};
const DAY = () => cityState().days || 0;

export function initFriends(ctx) {
  const S = cityState();
  S.friends ||= {};
  S.letters ||= [];
  for (const name of Object.keys(FOLK)) registerKeepsake("friend_" + name, "💛", `Friendship Charm of ${name}`);
  const me = () => ctx.mouseRig.position;
  const F = (name) => (S.friends[name] ||= { hearts: 0, talked: -1, gifted: -1, told: 0 });
  const hearts = (n) => "❤️".repeat(n) + "🤍".repeat(5 - n);

  // ---------------------------------------------------------------- letters
  let letterId = Date.now();
  function mail(from, text, gift) {
    S.letters.unshift({ id: letterId++, from, text, gift: gift || null, read: false, claimed: false });
    saveCity();
    drawChip();
    setTimeout(() => ctx.say(`📬 A letter from ${from}! Press L to read your mail.`, true), 2500);
  }
  /** a friend reached a new heart level → stories + presents by post */
  function milestone(name) {
    const f = F(name);
    const D = FOLK[name];
    if (f.hearts >= 2 && f.told < 1) {
      f.told = 1;
      mail(name, `Dear Thistle,\n\nThank you for being so kind to me. Can I tell you something about myself?\n\n${D.story[0]}\n\nYour friend,\n${name}`, null);
    }
    if (f.hearts >= 4 && f.told < 2) {
      f.told = 2;
      mail(name, `Dear Thistle,\n\nI've never told anyone this before…\n\n${D.story[1]}\n\nWith love,\n${name}`, { coins: 15 });
    }
    if (f.hearts >= 5 && f.told < 3) {
      f.told = 3;
      mail(name, `Dear Thistle,\n\nYou're my BEST friend in all the Great Cities. I made you something — I hope you like it.\n\nForever your friend,\n${name}`, { ...D.gift, keep: "friend_" + name });
    }
  }
  const chipEl = document.createElement("div");
  chipEl.style.cssText = "position:fixed;right:16px;bottom:62px;z-index:41;padding:5px 12px;border-radius:999px;background:rgba(120,40,40,.85);color:#fff;font:bold 13px system-ui;display:none;pointer-events:none";
  document.body.appendChild(chipEl);
  function drawChip() {
    const n = S.letters.filter((l) => !l.read).length;
    chipEl.style.display = n ? "" : "none";
    chipEl.textContent = `📬 ${n} new letter${n === 1 ? "" : "s"} — press L`;
  }
  drawChip();
  function openMail(openId) {
    const L = S.letters;
    const cur = L.find((l) => l.id === openId);
    if (cur) cur.read = true;
    saveCity();
    drawChip();
    const giftText = (g) => [g.coins ? `🪙 ${g.coins}` : "", g.item ? `${g.n} ${g.item}` : "", g.keep ? "💛 a Friendship Charm" : ""].filter(Boolean).join(" + ");
    openCard(
      `<div class="card" style="width:min(520px,92vw);max-height:84vh;overflow:auto"><h3>📬 Your Mailbox</h3><div class="coins">${L.length} letter${L.length === 1 ? "" : "s"}</div>
      ${cur ? `<div style="background:#fbf6e8;border-radius:10px;padding:12px 14px;font:15px Georgia;white-space:pre-wrap;line-height:1.45;margin-bottom:8px">${cur.text}</div>
        ${cur.gift && !cur.claimed ? `<div style="text-align:center"><button id="claim">🎁 Open the present (${giftText(cur.gift)})</button></div>` : cur.gift ? `<div class="coins">🎁 present opened</div>` : ""}` : ""}
      ${L.length ? L.map((l) => `<div class="item" style="${l.read ? "" : "font-weight:bold"}"><span class="ic">${l.read ? "📨" : "✉️"}</span><span class="nm">From ${l.from}${l.gift && !l.claimed ? " 🎁" : ""}</span><button data-open="${l.id}">${l.id === openId ? "reading" : "open"}</button></div>`).join("") : `<div class="empty">No letters yet. Make friends in the Great Cities — chat and give gifts!</div>`}
      <div class="close">L or Esc — close</div></div>`,
      (el) => {
        el.querySelectorAll("button[data-open]").forEach((b) => (b.onclick = () => openMail(+b.dataset.open)));
        const c = el.querySelector("#claim");
        if (c) c.onclick = () => {
          const g = cur.gift;
          if (g.coins) S.coins += g.coins;
          if (g.item) ctx.addToPack(g.item, g.n || 1);
          if (g.keep) (S.owned ||= {})[g.keep] = true;
          cur.claimed = true;
          saveCity();
          ctx.chime();
          openMail(cur.id);
        };
      }
    );
    mailOpen = true;
  }
  let mailOpen = false;
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyL" || e.repeat || ctx.playing()) return;
    if (mailOpen && document.getElementById("shop") && document.getElementById("shop").classList.contains("open")) {
      closeCard();
      mailOpen = false;
      return;
    }
    openMail(S.letters.find((l) => !l.read) ? S.letters.find((l) => !l.read).id : null);
  });

  // ---------------------------------------------------------------- chatting + gifts
  const CHATS = ["“Lovely weather for it, isn't it?”", "“Oh, it's YOU! You always cheer me up.”", "“Did you hear? The Night Market has new things!”", "“Thank you for stopping by, Thistle.”", "“I was just thinking about you!”", "“Have you tried the Harvest Feast? Barley's a tough judge!”"];
  function chat(name) {
    const f = F(name);
    f.talked = DAY();
    const before = f.hearts;
    f.hearts = Math.min(5, f.hearts + 1);
    saveCity();
    ctx.chime();
    ctx.say(`💬 ${name}: ${CHATS[Math.floor(Math.random() * CHATS.length)]} ${hearts(f.hearts)}${f.hearts > before && f.hearts === 5 ? " — BEST FRIENDS!" : ""}`, true);
    milestone(name);
  }
  function giftCard(name) {
    const f = F(name);
    const D = FOLK[name];
    const items = ctx.packList().filter(([, n]) => n > 0);
    openCard(
      `<div class="card" style="max-height:84vh;overflow:auto"><h3>🎁 A gift for ${name}</h3><div class="coins">${hearts(f.hearts)} · loves: ${D.favs.join(", ")} — and home cooking!</div>
      ${items.length ? items.map(([k, n]) => {
        const fav = D.favs.includes(k) || isDish(k);
        return `<div class="item"><span class="ic">${ctx.iconFor(k)}</span><span class="nm">${k.replace(/\b\w/g, (c) => c.toUpperCase())}<small>you have ${n}${fav ? " · 💖 a favorite!" : ""}</small></span><button data-give="${k}">give</button></div>`;
      }).join("") : `<div class="empty">Your pack is empty — gather or cook something first!</div>`}
      <div class="close">Esc — not now</div></div>`,
      (el) =>
        el.querySelectorAll("button[data-give]").forEach((b) => (b.onclick = () => {
          const k = b.dataset.give;
          if ((ctx.packCount(k) || 0) < 1) return;
          ctx.packTake(k, 1);
          const fav = D.favs.includes(k) || isDish(k);
          f.gifted = DAY();
          f.hearts = Math.min(5, f.hearts + (fav ? 2 : 1));
          saveCity();
          closeCard();
          ctx.chime();
          window.dispatchEvent(new CustomEvent("ww-gift", { detail: { name } }));
          ctx.say(`🎁 ${name}: ${fav ? "“Oh! My FAVORITE! How did you know?!”" : "“For me? That's so thoughtful!”"} ${hearts(f.hearts)}`, true);
          milestone(name);
        }))
    );
  }
  /** E near a townsmouse (only when nothing else is happening there) */
  function interactable() {
    const c = ctx.world() === "city" ? ctx.city() : null;
    if (!c || !c.people) return null;
    for (const P of Object.values(c.people)) {
      if (!FOLK[P.name]) continue;
      if (Math.hypot(me().x - P.x, me().z - P.z) > 2.6) continue;
      const f = F(P.name);
      if (f.talked !== DAY()) return { label: `chat with ${P.name} 💬 ${hearts(f.hearts)}`, act: () => chat(P.name) };
      if (f.gifted !== DAY()) return { label: `give ${P.name} a gift 🎁 ${hearts(f.hearts)}`, act: () => giftCard(P.name) };
      return null;
    }
    return null;
  }
  return { interactable };
}
