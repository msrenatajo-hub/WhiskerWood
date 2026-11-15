// ------------------------------------------------------------
//  🍲  COOKING + THE HARVEST FEAST — the Great Cauldron in Golden Hollow.
//  Turn your crops, milk, eggs, fish and forest finds into dishes: eat
//  them (hearts!), sell them, give them as gifts (everyone LOVES food) —
//  and enter your best at the Harvest Feast for a ribbon. 🎀
// ------------------------------------------------------------
import * as THREE from "three";
import { bought, cost } from "./economy.js";
import { registerFood } from "./food.js";
import { cityState, saveCity, openCard, closeCard, registerKeepsake, setSellPrice, shopHouse } from "./cityLife.js";

/** the recipe book — [dish, icon, ingredients {key: n}, tier 1-3, hearts] */
export const DISHES = [
  { key: "carrot cake", name: "Carrot Cake", icon: "🥕", needs: { carrot: 2, egg: 1, "honey drop": 1 }, tier: 2, heal: 40 },
  { key: "pumpkin soup", name: "Pumpkin Soup", icon: "🎃", needs: { pumpkin: 1, milk: 1 }, tier: 2, heal: 40 },
  { key: "berry pie", name: "Berry Pie", icon: "🥧", needs: { berry: 3, butter: 1 }, tier: 2, heal: 45 },
  { key: "cheese pasty", name: "Cheese Pasty", icon: "🧀", needs: { "cheese wheel": 1, egg: 1 }, tier: 3, heal: 60 },
  { key: "mushroom stew", name: "Mushroom Stew", icon: "🍄", needs: { mushroom: 2, milk: 1 }, tier: 1, heal: 30 },
  { key: "fisherman's pie", name: "Fisherman's Pie", icon: "🐟", needs: { fish: 2, butter: 1 }, tier: 3, heal: 60 },
  { key: "strawberry shortcake", name: "Strawberry Shortcake", icon: "🍓", needs: { strawberry: 2, milk: 1, egg: 1 }, tier: 3, heal: 55 },
  { key: "sunflower bread", name: "Sunflower Bread", icon: "🌻", needs: { sunflower: 1, "oat grain": 2 }, tier: 1, heal: 25 },
  { key: "honey oat cake", name: "Honey Oat Cakes", icon: "🍯", needs: { "oat grain": 2, "honey drop": 1 }, tier: 1, heal: 25 },
  { key: "harvest stew", name: "Harvest Stew", icon: "🍲", needs: { carrot: 1, pumpkin: 1, mushroom: 1 }, tier: 2, heal: 45 },
];
export const isDish = (k) => DISHES.some((d) => d.key === k);
const NICE = (k) => k.replace(/\b\w/g, (c) => c.toUpperCase());
registerKeepsake("feastribbon", "🎀", "Harvest Feast Blue Ribbon");
registerKeepsake("feastribbon_red", "🎗️", "Harvest Feast Red Ribbon");

export function initCooking(ctx) {
  const S = cityState();
  S.cooked ||= {};
  for (const d of DISHES) {
    registerFood(d); // (eat dishes from your bag: B → 🍴 eat)
    ctx.setIcon(d.key, d.icon);
    setSellPrice(d.key, 4 + d.tier * 4);
  }
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 3) => Math.hypot(me().x - x, me().z - z) < r;
  const golden = () => (ctx.world() === "city" && ctx.city() && ctx.city().id === "golden" ? ctx.city() : null);
  const have = (k) => ctx.packCount(k) || 0;
  const canCook = (d) => Object.entries(d.needs).every(([k, n]) => have(k) >= n);

  // ---------------------------------------------------------------- the cauldron
  function openKitchen(msg = "") {
    const rows = DISHES.map((d) => {
      const ok = canCook(d);
      const parts = Object.entries(d.needs).map(([k, n]) => `<span style="color:${have(k) >= n ? "#2a7a3a" : "#a83a3a"}">${n}× ${NICE(k)} (${have(k)})</span>`).join(" · ");
      const mine = have(d.key);
      return `<div class="item"><span class="ic">${d.icon}</span><span class="nm">${d.name}${S.cooked[d.key] ? " ✓" : ""}<small>${parts}</small>${mine ? `<small>you have ${mine} · <a href="#" data-eat="${d.key}">eat one (+${d.heal} ❤️)</a></small>` : ""}</span><button data-cook="${d.key}" ${ok ? "" : "disabled"}>cook</button></div>`;
    }).join("");
    const n = Object.keys(S.cooked).length;
    openCard(
      `<div class="card" style="width:min(520px,92vw);max-height:84vh;overflow:auto"><h3>🍲 The Great Cauldron</h3><div class="coins">Recipe book: ${n}/${DISHES.length} dishes cooked · green = you have enough</div>
      ${rows}<div class="msg">${msg}</div><div class="close">Esc — done cooking · dishes go in your backpack: eat them, sell them, or give them as gifts!</div></div>`,
      (el) => {
        el.querySelectorAll("button[data-cook]").forEach((b) => (b.onclick = () => {
          const d = DISHES.find((x) => x.key === b.dataset.cook);
          if (!canCook(d)) return;
          for (const [k, n] of Object.entries(d.needs)) ctx.packTake(k, n);
          ctx.addToPack(d.name, 1);
          const first = !S.cooked[d.key];
          S.cooked[d.key] = true;
          saveCity();
          window.dispatchEvent(new CustomEvent("ww-cook", { detail: { dish: d.key } }));
          ctx.chime();
          openKitchen(`${d.icon} ${first ? "NEW recipe! " : ""}A steaming ${d.name} — into your pack it goes!`);
        }));
        el.querySelectorAll("a[data-eat]").forEach((a) => (a.onclick = (e) => {
          e.preventDefault();
          const d = DISHES.find((x) => x.key === a.dataset.eat);
          if (have(d.key) < 1) return;
          ctx.packTake(d.key, 1);
          ctx.heal(d.heal);
          ctx.bite();
          openKitchen(`${d.icon} Mmm! ${d.name} (+${d.heal} ❤️)`);
        }));
      }
    );
  }

  // ---------------------------------------------------------------- the Harvest Feast
  function openFeast(msg = "") {
    const mine = DISHES.filter((d) => have(d.key) > 0);
    const today = S.days || 0;
    const entered = S.feastDay === today;
    const pick = new Set();
    const draw = (m = msg) =>
      openCard(
        `<div class="card"><h3>🎀 The Harvest Feast</h3><div class="coins">Judge: Harvest-Mother Barley · one entry a day</div>
        <p style="font:14px Georgia">“Bring me up to THREE different dishes. Fancier dishes score more — and a good variety pleases me most of all!”</p>
        ${entered ? `<div class="empty">You've entered today! Come back tomorrow (the next game day).</div>` : mine.length ? mine.map((d) => `<div class="item"><span class="ic">${d.icon}</span><span class="nm">${d.name}<small>${"⭐".repeat(d.tier)} · you have ${have(d.key)}</small></span><button data-pick="${d.key}">${pick.has(d.key) ? "✓ chosen" : "choose"}</button></div>`).join("") + `<div style="text-align:center;margin-top:8px"><button id="feastgo" ${pick.size ? "" : "disabled"}>🍽️ Present ${pick.size} dish${pick.size === 1 ? "" : "es"} to the judge</button></div>` : `<div class="empty">You haven't any dishes yet — cook some at the Great Cauldron!</div>`}
        <div class="msg">${m}</div><div class="close">Esc — leave</div></div>`,
        (el) => {
          el.querySelectorAll("button[data-pick]").forEach((b) => (b.onclick = () => {
            const k = b.dataset.pick;
            if (pick.has(k)) pick.delete(k);
            else if (pick.size < 3) pick.add(k);
            draw("");
          }));
          const go = el.querySelector("#feastgo");
          if (go) go.onclick = () => judge([...pick]);
        }
      );
    function judge(keys) {
      const dishes = keys.map((k) => DISHES.find((d) => d.key === k));
      for (const d of dishes) ctx.packTake(d.key, 1);
      const tiers = dishes.reduce((a, d) => a + d.tier, 0);
      const score = tiers + (dishes.length === 3 ? 1 : 0) + Math.round(Math.random());
      S.feastDay = today;
      let result;
      if (score >= 8) {
        const first = !(S.owned ||= {}).feastribbon;
        S.owned.feastribbon = true;
        S.coins += 60;
        result = `🎀 BLUE RIBBON! “Magnificent — the best table at the Feast!” ${first ? "The Blue Ribbon is yours (a keepsake)! " : ""}+🪙 60`;
      } else if (score >= 5) {
        (S.owned ||= {}).feastribbon_red = true;
        S.coins += 25;
        result = `🎗️ Red ribbon! “Lovely cooking. Bring me three FANCY dishes for the blue!” +🪙 25`;
      } else {
        S.coins += 8;
        result = `🏵️ A participation rosette! “A good start, dear. Try fancier dishes — and three of them!” +🪙 8`;
      }
      saveCity();
      ctx.chime();
      ctx.say(result, true);
      closeCard();
    }
    draw();
  }

  // ---------------------------------------------------------------- the judging table (built once)
  let table = null;
  function buildTable(c) {
    if (table && table.c === c) return;
    const H = c.props.hearth || { x: 0, z: -33 };
    const x = H.x + 6;
    const z = H.z + 3;
    const y = c.height(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 1.4), new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 1 }));
    top.position.y = 0.95;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a5e36, roughness: 1 }));
    legs.position.y = 0.45;
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12), new THREE.MeshBasicMaterial({ color: 0x3a6ad8 }));
    ribbon.position.set(0, 1.6, 0.6);
    g.add(top, legs, ribbon);
    for (let k = 0; k < 3; k++) {
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.15, 10), new THREE.MeshStandardMaterial({ color: [0xe08a2a, 0xd83a4a, 0xf4d06a][k], roughness: 1 }));
      dish.position.set(-1 + k, 1.1, 0);
      g.add(dish);
    }
    c.group.add(g);
    c.colliders.push({ x, z, r: 1.6 });
    table = { c, x, z };
  }
  // ---------------------------------------------------------------- 🛒 the General Store
  const STORE = [
    ["Carrots", "🥕", 2], ["Pumpkins", "🎃", 3], ["Strawberries", "🍓", 3], ["Sunflowers", "🌻", 2], ["Mushrooms", "🍄", 2],
    ["Berries", "🫐", 2], ["Eggs", "🥚", 2], ["Milk", "🥛", 3], ["Butter", "🧈", 4], ["Cheese Wheel", "🧀", 9],
    ["Honey Drops", "🍯", 3], ["Oat Grain", "🌾", 1], ["Fish", "🐟", 4], ["Clover Seeds", "☘️", 1], ["Flower Petals", "🌸", 1],
  ];
  let store = null;
  function buildStore(c) {
    if (store && store.c === c) return;
    let at = { x: 14, z: -20 };
    for (let r = 0; r < 40; r += 2) {
      let ok = false;
      for (let a = 0; a < 6.3; a += 0.4) {
        const x = 18 + Math.cos(a) * r;
        const z = -24 + Math.sin(a) * r;
        if (!c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 6)) {
          at = { x, z };
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    const sh = shopHouse(c.group, c.height, at, 0xe8c888, "General Store", "Shopkeeper Oats", 0x8a6a3a, () => openStore(), (x, z, r) => c.colliders.push({ x, z, r }));
    (c.props ||= {}).generalStore = { x: at.x, z: at.z }; // (🐈 Biscuit the shop cat lives here)
    store = { c, sh };
  }
  function openStore(msg = "") {
    window.dispatchEvent(new Event("ww-store-open")); // (🐈 Biscuit notices you went in…)
    openCard(
      `<div class="card" style="max-height:84vh;overflow:auto"><h3>🛒 The General Store</h3><div class="coins">Shopkeeper Oats · 🪙 ${S.coins} · everything for your cooking pot!</div>
      ${STORE.map(([name, icon, base], i) => ((price) => `<div class="item"><span class="ic">${icon}</span><span class="nm">${name}<small>you have ${have(name)}</small></span><button data-i="${i}" data-n="1" ${S.coins < price ? "disabled" : ""}>1 · 🪙 ${price}</button><button data-i="${i}" data-n="5" ${S.coins < price * 5 ? "disabled" : ""}>5 · 🪙 ${price * 5}</button></div>`)(cost(base, name))).join("")}
      <div class="msg">${msg}</div><div class="close">Esc — leave · cook at the Great Cauldron by the Harvest Hall 🍲</div></div>`,
      (el) =>
        el.querySelectorAll("button[data-i]").forEach((b) => (b.onclick = () => {
          const [name, icon, base] = STORE[+b.dataset.i];
          const price = cost(base, name); // (🪙 grows with your adventure)
          const n = +b.dataset.n;
          if (S.coins < price * n) return;
          S.coins -= price * n;
          bought(name);
          ctx.addToPack(name, n);
          saveCity();
          ctx.chime();
          openStore(`${icon} +${n} ${name} — into your backpack!`);
        }))
    );
  }
  function interactable() {
    const c = golden();
    if (!c) return null;
    buildTable(c);
    buildStore(c);
    const si = store.sh.interactable(me());
    if (si) return si;
    const H = c.props.hearth || { x: 0, z: -33 };
    if (near(table.x, table.z, 2.8)) return { label: "enter the Harvest Feast 🎀", act: () => openFeast() };
    if (near(H.x, H.z, 3.6)) return { label: "cook at the Great Cauldron 🍲", act: () => openKitchen() };
    return null;
  }
  return { interactable };
}
