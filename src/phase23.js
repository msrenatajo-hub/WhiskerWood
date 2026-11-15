// ------------------------------------------------------------
//  🐲  PHASE 23 — "Raising the Dragonlings"
//
//  The four baby dragons from Emberroost come to stay at your cottage —
//  Pip (the blue one you rescued from the Great Storm) and her three
//  brothers and sisters, who don't have names yet. Name them, feed each
//  one its favourite food, teach them to fly (they follow you through
//  three cloud-hoops over the forest), and hold a little Dragon Academy
//  graduation on your doorstep.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { makeDragon, dragonFlying } from "./more3.js";

registerKeepsake("dragondiploma", "📜", "The Dragon Academy Diploma (teacher of four dragonlings)");

const BABIES = [
  { key: "dawn", hue: 0.07, food: "Fish", foodIcon: "🐟", likes: "fish — the smellier the better!" },
  { key: "storm", hue: 0.58, food: "Honey Drops", foodIcon: "🍯", likes: "honey drops (sticky sparks!)", name: "Pip" },
  { key: "frost", hue: 0.55, light: true, food: "Strawberries", foodIcon: "🍓", likes: "cold strawberries" },
  { key: "jade", hue: 0.33, food: "Cheese Wheel", foodIcon: "🧀", likes: "a whole wheel of cheese (greedy!)" },
];
const glow = (c, s, op = 0.8) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};

export function initPhase23(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p23 = () => (st.p23 ||= { started: false, names: {}, fed: {}, hoops: 0, done: false });
  let wait = 0;
  let babies = null; // [{ g, b }]
  let hoops = null;

  // where the dragonlings sit: in a little ring by your cottage door
  const H = () => ctx.home;
  const seat = (i) => {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    const r = babies && babies.grown ? 9 : 4.8; // (grown dragons need more room)
    const x = H().x + Math.cos(a) * r;
    const z = H().z + Math.sin(a) * r;
    return { x, z, y: ctx.terrainHeight(x, z) };
  };
  // three cloud-hoops over the forest, for the flying lessons
  const HOOPS = () => [
    { x: H().x + 28, z: H().z + 6, up: 16 },
    { x: H().x + 12, z: H().z + 38, up: 22 },
    { x: H().x - 26, z: H().z + 16, up: 18 },
  ].map((h) => ({ ...h, y: ctx.terrainHeight(h.x, h.z) + h.up }));

  function makeSureOfDragon() {
    const c = C();
    if (c.dragon && (c.days || 0) - c.dragon.got >= 3) return;
    c.dragon = { ...(c.dragon || {}), got: (c.days || 0) - 20, hatchTold: true, grownTold: true };
    saveCity();
  }
  const grown = () => {
    const s = p23();
    return !!s.done && (s.doneDay === undefined || (C().days || 0) >= s.doneDay + 2);
  };
  function build() {
    if (babies && babies.grown !== grown()) {
      // (they've grown up! swap the hatchlings for young dragons)
      babies.forEach((B) => B.g.parent && B.g.parent.remove(B.g));
      babies = null;
    }
    if (babies || !makeDragon || !ctx.outsideGroup) return;
    const big = grown();
    babies = BABIES.map((b, i) => {
      const g = makeDragon(big ? 2 : 1);
      g.traverse((o) => {
        if (!o.material || !o.material.color || o.isSprite) return;
        o.material = o.material.clone();
        const hsl = {};
        o.material.color.getHSL(hsl);
        o.material.color.setHSL(b.hue, b.light ? 0.35 : Math.min(1, hsl.s + 0.1), b.light ? Math.min(0.85, hsl.l + 0.35) : hsl.l);
      });
      g.scale.multiplyScalar(big ? 0.7 : 0.95);
      const s0 = seat(i);
      g.position.set(s0.x, s0.y, s0.z);
      ctx.outsideGroup.add(g);
      return { g, b, i, fly: { x: s0.x, y: s0.y, z: s0.z } };
    });
    babies.grown = big;
    hoops = HOOPS().map((h) => {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.6, 10, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }));
      g.add(ring, glow(0xfff0d0, 12, 0.6));
      g.position.set(h.x, h.y, h.z);
      g.lookAt(H().x, h.y, H().z);
      g.visible = false;
      ctx.outsideGroup.add(g);
      return { g, h };
    });
  }
  const nameOf = (b) => (b.name || p23().names[b.key] || "");
  const allNamed = () => BABIES.every((b) => nameOf(b));
  const allFed = () => BABIES.every((b) => p23().fed[b.key]);

  function begin() {
    p23().started = true;
    st.phase = 23;
    save();
    redraw();
    makeSureOfDragon();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "A few mornings later you wake to a THUMP on the roof… then a squeak… then three more squeaks." },
      { dur: 4.6, black: true, gameCam: true, who: "A letter tied to a little blue tail", text: "“Dear Dragon Rider — the hatchlings will not stop talking about you. Pip most of all. Would you raise them for a while? Teach them to be brave, and kind, and to FLY. — The Elder Dragon”" },
      { dur: 4.2, black: true, gameCam: true, who: "Sprig", text: "“FOUR baby dragons?! Thistle — three of them don't even have NAMES yet!”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => {
        build();
        ctx.say("🐲 PHASE 23 — Raising the Dragonlings. Four baby dragons are waiting by your cottage door! Walk up to each one (E) to give it a name.", true);
      } },
    ]);
  }

  function interactable() {
    if (st.phase < 23 || p23().done || ctx.world() !== "outside" || !babies || dragonFlying()) return null;
    const s = p23();
    for (const B of babies) {
      const b = B.b;
      if (!near(B.g.position.x, B.g.position.z, 2.2)) continue;
      if (!nameOf(b)) return { label: "give this little dragon a name 🐲", act: () => {
        const nm = (prompt("What will you name this little dragon?", "") || "").trim().slice(0, 20);
        if (!nm) return;
        s.names[b.key] = nm;
        save();
        redraw();
        chime();
        ctx.say(`🐲 “${nm}”! The dragonling sneezes a happy puff of smoke — it LOVES its new name.${allNamed() ? " Now they're HUNGRY — each one has a favourite food (see your list)." : ""}`, true);
      } };
      if (allNamed() && !s.fed[b.key]) return { label: `feed ${nameOf(b)} ${b.foodIcon} (${b.food})`, act: () => {
        if ((ctx.packCount(b.food) || 0) < 1) return ctx.say(`🐲 ${nameOf(b)} only wants ${b.likes} ${b.foodIcon}. You can buy ${b.food} at the General Store in Golden Hollow!`, true);
        ctx.packTake(b.food, 1);
        s.fed[b.key] = true;
        save();
        redraw();
        chime();
        ctx.say(`${b.foodIcon} ${nameOf(b)} gobbles it up and does a happy little loop-the-loop!${allFed() ? " All four are full — time for FLYING LESSONS! Press 1 to fly, and they'll follow you through the three cloud-hoops over the forest." : ""}`, true);
      } };
      if (allFed() && s.hoops < 3) return { label: `pat ${nameOf(b)} 🐲`, act: () => ctx.say(`🐲 ${nameOf(b)} wiggles. “Fly! FLY!” — press 1 to call your dragon and lead them through the cloud-hoops!`, true) };
    }
    if (s.hoops >= 3 && near(H().x, H().z, 6)) return { label: "hold the Dragon Academy graduation 🎓", act: graduation };
    return null;
  }

  function graduation() {
    const s = p23();
    const h = H();
    const y = ctx.terrainHeight(h.x, h.z);
    const names = BABIES.map(nameOf);
    playCutscene([
      { dur: 4.4, from: [h.x + 7, y + 4, h.z + 7], look: [h.x, y + 1, h.z], text: "On your doorstep, four little dragons sit in a row — each wearing a tiny paper graduation cap that Sprig folded." },
      { dur: 4.6, from: [h.x + 5, y + 2.4, h.z + 5], look: [h.x, y + 1, h.z], who: "Sprig (very official)", text: `“For bravery, kindness, and flying through ALL THREE HOOPS: ${names.slice(0, 3).join(", ")} and ${names[3]} — you are graduates of the DRAGON ACADEMY!”` },
      { dur: 4.4, from: [h.x + 12, y + 8, h.z + 12], look: [h.x, y + 6, h.z], text: "Four caps fly into the air. Four tiny flames. And high above the forest, a great golden shape circles once and dips its wings — the Elder Dragon, watching." },
      { dur: 4.4, black: true, gameCam: true, who: "The Elder Dragon", text: "“They will be fine dragons, because they had a fine teacher. They may stay by your cottage as long as they like.”" },
      { dur: 4, black: true, gameCam: true, who: "🐲 PHASE 23 COMPLETE", text: "Raising the Dragonlings\n🪙 650 · 📜 The Dragon Academy Diploma" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        s.done = true;
        s.doneDay = C().days || 0; // (they're grown, ready to ride, two days after this)
        const c = C();
        c.coins = (c.coins || 0) + 650;
        (c.owned ||= {}).dragondiploma = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("🎓 Your four dragonlings are Dragon Academy graduates — and they'll live by your cottage from now on!", true);
      } },
    ]);
  }

  function update(dt, t) {
    if (st.phase === 22 && st.p22 && st.p22.done && !p23().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    if (st.phase < 23 || !p23().started) return;
    build();
    if (!babies) return;
    const s = p23();
    const outside = ctx.world() === "outside";
    const lessons = allFed() && s.hoops < 3 && !s.done;
    const flying = dragonFlying() && outside;
    hoops.forEach((H0, i) => (H0.g.visible = outside && lessons && i === s.hoops));
    const p = me();
    for (const B of babies) {
      B.g.visible = outside && !(babies.grown && C().dragonPick === B.b.key); // (the one you're riding is with you!)
      if (!outside) continue;
      const tt = (t || 0) + B.i;
      if (flying && (lessons || s.done)) {
        // 🐲 they follow you, in a little V behind your dragon
        const yaw = ctx.mouseRig.rotation.y;
        const side = (B.i % 2 ? 1 : -1) * (2.5 + Math.floor(B.i / 2) * 2.5);
        const back = 6 + Math.floor(B.i / 2) * 3;
        const tx = p.x - Math.sin(yaw) * back + Math.cos(yaw) * side;
        const tz = p.z - Math.cos(yaw) * back - Math.sin(yaw) * side;
        const ty = p.y - 1 + Math.sin(tt * 3) * 0.4;
        B.fly.x += (tx - B.fly.x) * Math.min(1, dt * 3);
        B.fly.y += (ty - B.fly.y) * Math.min(1, dt * 3);
        B.fly.z += (tz - B.fly.z) * Math.min(1, dt * 3);
        B.g.position.set(B.fly.x, B.fly.y, B.fly.z);
        B.g.rotation.y = yaw;
      } else {
        // …and wait by your door (hopping about a little)
        const s0 = seat(B.i);
        B.fly.x += (s0.x - B.fly.x) * Math.min(1, dt * 2);
        B.fly.z += (s0.z - B.fly.z) * Math.min(1, dt * 2);
        B.fly.y += (s0.y + Math.abs(Math.sin(tt * 2.5)) * 0.25 - B.fly.y) * Math.min(1, dt * 4);
        B.g.position.set(B.fly.x, B.fly.y, B.fly.z);
        B.g.rotation.y = Math.atan2(p.x - B.fly.x, p.z - B.fly.z);
      }
      const u = B.g.userData;
      if (u && u.wings) u.wings.forEach(({ w, sx }) => (w.rotation.z = sx * Math.sin(tt * (flying ? 9 : 3)) * (flying ? 0.7 : 0.2)));
    }
    // 🌥️ the flying lessons: lead them through each hoop
    if (lessons && flying) {
      const h = hoops[s.hoops].h;
      if (Math.hypot(p.x - h.x, p.z - h.z) < 5 && Math.abs(p.y - h.y) < 6) {
        s.hoops++;
        save();
        redraw();
        chime();
        ctx.say(s.hoops >= 3
          ? "🌥️ All THREE hoops! The dragonlings squeal with joy — they can FLY! Land by your cottage door (E) for the Dragon Academy graduation."
          : `🌥️ Through the hoop — and all four dragonlings swoop through after you! (${s.hoops}/3) On to the next one!`, true);
      }
    }
  }

  function panelHTML() {
    const s = p23();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    return `<h3>🐲 Raising the Dragonlings</h3><ul>
      ${row(allNamed(), "Name the three new dragonlings (by your cottage door)")}
      ${BABIES.map((b) => row(s.fed[b.key], `Feed ${nameOf(b) || "a dragonling"} ${b.foodIcon} <span class="res">(${b.food})</span>`)).join("")}
      ${row(s.hoops >= 3, `Flying lessons: lead them through the cloud-hoops <span class="res">(${s.hoops}/3)</span><div class="sub">&nbsp;&nbsp;press 1 to fly — they follow you!</div>`)}
      ${row(s.done, "Hold the Dragon Academy graduation (at your door)")}
    </ul><div class="kit">🛒 the General Store in Golden Hollow sells all their favourite foods</div>`;
  }

  return { update, interactable, panelHTML, done: () => !!p23().done };
}
