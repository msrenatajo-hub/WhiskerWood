// ------------------------------------------------------------
//  🎈  BALLOON FLIGHTS — a striped hot-air balloon in the forest,
//  Everbough and every Great City. Choose where to go, then fly over the
//  treetops at sunset: A/D steer, W/S up and down — catch the floating ⭐
//  stars on the way! (Esc skips the flight.)
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { glowTexture } from "./phase2.js";
import { buildThistle } from "./outside.js";
import { cityState, saveCity, openCard, closeCard } from "./cityLife.js";
import { signBoard } from "./signs.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...e });
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  h.scale.setScalar(s);
  return h;
};
const PLACES = {
  forest: { icon: "🌲", name: "the Great Forest" },
  everbough: { icon: "🌳", name: "Everbough" },
  reedmere: { icon: "🌊", name: "Reedmere" },
  golden: { icon: "🌾", name: "Golden Hollow" },
  frostpine: { icon: "❄️", name: "Frostpine" },
  silverveil: { icon: "🌙", name: "Silverveil" },
  cloud: { icon: "☁️", name: "Nimbusreach, the City in the Clouds" },
};
const FLIGHT_SECS = 40;
const SPEED = 9;

/** a striped balloon (envelope + basket + ropes + burner) */
function buildBalloon(withMouse) {
  const g = new THREE.Group();
  const env = new THREE.Group();
  const cols = [0xd84a4a, 0xf4ecd8, 0xf0b040, 0xf4ecd8, 0x4a8ad8, 0xf4ecd8];
  for (let i = 0; i < 12; i++) {
    const gore = new THREE.Mesh(new THREE.SphereGeometry(4, 3, 12, (i / 12) * Math.PI * 2, Math.PI / 6), M(cols[i % cols.length]));
    env.add(gore);
  }
  env.scale.set(1, 1.18, 1);
  env.position.y = 7.4;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.9, 1.6, 12, 1, true), M(0xc83a3a, { side: THREE.DoubleSide }));
  skirt.position.y = 3.2;
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 1.1, 10), M(0x8a5e36));
  basket.position.y = 0.55;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 5, 16), M(0x5a3e24));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.1;
  g.add(env, skirt, basket, rim);
  for (const [x, z] of [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 4), M(0x6a5a4a));
    rope.position.set(x * 1.2, 2.2, z * 1.2);
    rope.rotation.z = -x * 0.25;
    rope.rotation.x = z * 0.25;
    g.add(rope);
  }
  const flame = glow(0xffa040, 2.2);
  flame.position.y = 2.8;
  g.add(flame);
  g.userData.flame = flame;
  if (withMouse) {
    const m = buildThistle({ pack: true });
    m.scale.setScalar(1.6);
    m.position.y = 0.5;
    m.rotation.y = 0;
    g.add(m);
  }
  return g;
}

export function initBalloons(ctx) {
  const S = cityState();
  S.stats ||= {};
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r = 3) => Math.hypot(me().x - x, me().z - z) < r;
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world() === "outside" ? "forest" : ctx.world());

  // ---------------------------------------------------------------- the stations
  const stations = {}; // place → { x, z, g }
  function stationFor(place) {
    if (stations[place] && stations[place].g.parent) return stations[place];
    let group = null;
    let H = null;
    let at = null;
    const free = (ok) => (x0, z0) => {
      for (let r = 0; r < 30; r += 1.5) for (let a = 0; a < Math.PI * 2; a += 0.6) {
        const x = x0 + Math.cos(a) * r;
        const z = z0 + Math.sin(a) * r;
        if (ok(x, z)) return { x, z };
      }
      return { x: x0, z: z0 };
    };
    if (place === "forest") {
      const s = ctx.school();
      if (!s) return null;
      group = ctx.outsideGroup;
      H = ctx.terrainHeight;
      at = free((x, z) => !ctx.isWater(x, z) && ctx.isClear(x, z, 4))(s.x + 16, s.z - 12);
    } else if (place === "everbough") {
      if (!ctx.cityBuilt()) return null;
      group = ctx.cityGroup;
      H = ctx.cityHeight;
      const cols = ctx.cityCols();
      at = free((x, z) => !cols.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 4))(-44, 44);
      cols.push({ x: at.x, z: at.z, r: 1.3 });
    } else {
      const c = ctx.world() === "city" ? ctx.city() : null;
      if (!c || c.id !== place) return null;
      group = c.group;
      H = c.height;
      const w = c.spots.waystone;
      at = free((x, z) => (!c.waterAt || c.waterAt(x, z) === null) && !c.colliders.some((k) => Math.hypot(x - k.x, z - k.z) < k.r + 4))(w.x + 10, w.z + 8);
      c.colliders.push({ x: at.x, z: at.z, r: 1.3 });
    }
    const g = buildBalloon(false);
    g.position.set(at.x, H(at.x, at.z), at.z);
    // tethered: a little wooden platform and a sign
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 12), M(0x8a6a42));
    deck.position.y = 0.15;
    g.add(deck);
    // (🪧 big, crisp, readable from both sides — see signs.js)
    const sign = signBoard("🎈 BALLOON FLIGHTS", { w: 3.4, h: 0.85, style: "wood" });
    sign.position.set(0, 2.25, 2.6);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 5), M(0x5a3e24));
    post.position.set(0, 1.1, 2.6);
    g.add(sign, post);
    group.add(g);
    return (stations[place] = { ...at, g });
  }

  // ---------------------------------------------------------------- choosing where to fly
  function openFlights() {
    const T = ctx.travelInfo();
    const from = here();
    // (☁️ Nimbusreach: only once the cloud-whale is your friend)
    const dests = [...T.unlocked, ...((S.legends || {}).whale ? ["cloud"] : [])].filter((id) => PLACES[id] && id !== from);
    const stars = S.stats.stars || 0;
    openCard(
      `<div class="card"><h3>🎈 Balloon Flights</h3><div class="coins">Balloonist Breeze · ⭐ ${stars} stars caught so far</div>
      <p style="font:14px Georgia">“Where to, little one? Steer with A and D, rise and sink with W and S — and catch every star you can!”</p>
      ${dests.length ? dests.map((id) => `<div class="item"><span class="ic">${PLACES[id].icon}</span><span class="nm">${PLACES[id].name}${(S.stats.balloonTo || {})[id] ? "<small>✓ you've flown here</small>" : "<small>a new trip!</small>"}</span><button data-to="${id}">fly!</button></div>`).join("") : `<div class="empty">Nowhere to fly yet — the Moonkeepers' roads open more places.</div>`}
      <div class="close">Esc — maybe later</div></div>`,
      (el) =>
        el.querySelectorAll("button[data-to]").forEach((b) => (b.onclick = () => {
          closeCard();
          takeOff(b.dataset.to);
        }))
    );
  }

  // ---------------------------------------------------------------- the flight
  const keys = {};
  let flying = false;
  window.addEventListener("keydown", (e) => (keys[e.code] = true));
  window.addEventListener("keyup", (e) => (keys[e.code] = false));
  let sky = null; // { balloon, stars[] } in the sky zone
  const hudEl = document.createElement("div");
  hudEl.style.cssText = "position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:62;padding:6px 16px;border-radius:12px;background:rgba(60,30,20,.7);color:#ffe9b0;font:bold 16px system-ui;pointer-events:none;display:none";
  document.body.appendChild(hudEl);
  function buildSkyStuff(Z) {
    if (sky && sky.Z === Z) return sky;
    const balloon = buildBalloon(true);
    Z.group.add(balloon);
    const stars = [];
    for (let i = 0; i < 64; i++) {
      const z = -160 + i * 5.1;
      const x = Math.sin(i * 0.9) * 9 + Math.sin(i * 2.3) * 5;
      const y = 26 + Math.sin(i * 0.6) * 6 + Math.cos(i * 1.7) * 3;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xffe86a })), glow(0xfff0a0, 3.2));
      g.position.set(x, y, z);
      Z.group.add(g);
      stars.push({ g, x, y, z, got: false });
    }
    return (sky = { Z, balloon, stars });
  }
  function takeOff(dest) {
    // (another scene still on screen? wait for it — or the flight starts before the sky exists)
    if (ctx.playing && ctx.playing()) return void setTimeout(() => takeOff(dest), 400);
    flying = true;
    let ready = false;
    fadeThrough(() => {
      ready = true;
      ctx.goCity("sky");
      const Z = ctx.city();
      const s2 = buildSkyStuff(Z);
      s2.stars.forEach((st) => {
        st.got = false;
        st.g.visible = true;
      });
      s2.pos = { x: 0, y: 24, z: -190 };
      s2.caught = 0;
      ctx.mouseRig.visible = false;
    }, 0.8).then(() => {
      if (ready && sky) fly(dest);
      else {
        flying = false;
        ctx.mouseRig.visible = true;
      }
    });
  }
  function fly(dest) {
    const s2 = sky;
    const b = s2.balloon;
    hudEl.style.display = "";
    playCutscene([
      {
        dur: FLIGHT_SECS,
        from: [0, 30, -205],
        to: [0, 30, -205],
        look: [0, 24, -180],
        update: (k, dt) => {
          const P = s2.pos;
          const t = performance.now() / 1000;
          // steer (A/D), climb + sink (W/S) — gently
          const lr = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
          const ud = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
          P.x = Math.max(-18, Math.min(18, P.x + lr * 9 * dt));
          P.y = Math.max(16, Math.min(38, P.y + ud * 7 * dt));
          P.z += SPEED * dt;
          b.position.set(P.x, P.y + Math.sin(t * 1.4) * 0.3, P.z);
          b.rotation.z = -lr * 0.12;
          b.userData.flame.scale.setScalar(2 + (ud > 0 ? 1.4 : 0) + Math.sin(t * 20) * 0.2);
          // the camera rides along behind
          const cam = ctx.camera;
          cam.position.set(P.x * 0.6, P.y + 7, P.z - 15);
          cam.lookAt(P.x, P.y + 2, P.z + 10);
          // catch stars (near the basket or the balloon)
          for (const st of s2.stars) {
            if (st.got) continue;
            st.g.rotation.y = t * 2;
            const dy = st.y - P.y;
            if (Math.hypot(st.x - P.x, st.z - P.z) < 3.2 && dy > -1.5 && dy < 10) {
              st.got = true;
              st.g.visible = false;
              s2.caught++;
              S.stats.stars = (S.stats.stars || 0) + 1;
              window.dispatchEvent(new CustomEvent("ww-star"));
              ctx.chime();
            }
          }
          hudEl.textContent = `🎈 to ${PLACES[dest].name} · ⭐ ${s2.caught} caught · A/D steer · W/S up/down · Esc skip`;
        },
        end: () => {
          hudEl.style.display = "none";
          (S.stats.balloonTo ||= {})[dest] = true;
          S.stats.flights = (S.stats.flights || 0) + 1;
          saveCity();
          const caught = s2.caught;
          // (after the movie lets go of the screen)
          setTimeout(() => {
            ctx.mouseRig.visible = true;
            flying = false;
            ctx.travelTo(dest);
            setTimeout(() => ctx.say(`🎈 You drift down into ${PLACES[dest].name}! ⭐ ${caught} stars caught on the way (${S.stats.stars} in all).`, true), 1600);
          }, 60);
        },
      },
    ]);
  }

  // ---------------------------------------------------------------- hooks
  // (there's only ONE balloon station: in Golden Hollow, the windy plains)
  const STATION_AT = "golden";
  function interactable() {
    if (flying) return null;
    const place = here();
    if (place !== STATION_AT) return null;
    const st = stationFor(place);
    if (!st || !near(st.x, st.z, 3.2)) return null;
    if (ctx.travelInfo().unlocked.length < 2) return { label: "look at the balloon 🎈", act: () => ctx.say("🎈 Balloonist Breeze: “Once the Moonkeepers' roads open, I can fly you anywhere!”", true) };
    return { label: "take a balloon flight 🎈", act: openFlights };
  }
  function update() {
    const place = here();
    if (place === STATION_AT) stationFor(place);
    if (stations[place] && stations[place].g.userData.flame) stations[place].g.userData.flame.scale.setScalar(2 + Math.sin(performance.now() / 120) * 0.2);
  }
  // (test) &fly=reedmere → take off on your own
  {
    const f = new URLSearchParams(location.search).get("fly");
    if (f && PLACES[f]) setTimeout(() => takeOff(f), 3500);
  }
  return { interactable, update, flying: () => flying };
}
