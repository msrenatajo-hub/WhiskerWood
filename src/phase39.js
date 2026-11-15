// ------------------------------------------------------------
//  👑  PHASE 39 — "The Frozen Crown"
//
//  The Snow King's crown has been STOLEN — and without it, nobody can tell
//  winter when to stop. A blizzard rolls over the whole land and doesn't
//  end. The crown was taken by the frost giants, far across the frozen sea.
//    1. Fly to Glimmerhold, the Snow King's palace. The King teaches you
//       the old Song of Seasons (4 · 2 · 4 · 1 · 8 · 5 on your flute) and lends you
//       his royal husky team.
//    2. SLED across the frozen sea through the blizzard — follow the
//       lantern flags; DARK ice is thin (it cracks!); blue ramps jump you.
//    3. CLIMB the great glacier — it's slippery (stop and you slide), with
//       two crevasses to jump… and the Gate Giant rolls snowballs at you.
//       Reach the top and he gives up the first jewel.
//    4. THE HALL OF STATUES: the Watcher counts with his back turned —
//       move! — then whips round. If he sees you move, his frost breath
//       blows you back to the start. Reach the pedestal: the second jewel.
//    5. The Giant King Hrimfang won't give the crown back: every spring,
//       the giants' palace melts. Play him the Song of Seasons — the song
//       of the crown's old promise, that winter ALWAYS comes back.
//    6. Bring the crown home. The blizzard ends.
// ------------------------------------------------------------
import * as THREE from "three";
import { playCutscene, fadeThrough } from "./cutscene.js";
import { cityState, saveCity, registerKeepsake } from "./cityLife.js";
import { FROZENSEA, frozenHeight } from "./questZones.js";
import { DRAGON_DESTS } from "./more3.js";
import { buildThistle } from "./outside.js";
import { glowTexture } from "./phase2.js";
import { ITEM_POWERS } from "./powers.js";

registerKeepsake("kingsnowflake", "❄️", "The King's Snowflake (from the Frozen Crown itself — it never melts)");
ITEM_POWERS.kingsnowflake = { type: "heal", n: 0.1 };

const SONG = [4, 2, 4, 1, 8, 5];
const glow = (c, s, op = 0.85) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  h.scale.setScalar(s);
  return h;
};
const Mt = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, ...e });
// a frost giant: great pale-blue body, icicle beard, eyes like cold stars
function buildGiant(scale = 1, robe = 0x5a7a9a) {
  const g = new THREE.Group();
  const skin = Mt(0xbfe0f0);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 7, 10), Mt(robe));
  body.position.y = 5.5;
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.6, 10), Mt(0x3a4a5a));
  belt.position.y = 4.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 10), skin);
  head.position.y = 10.4;
  const beard = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const ic = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.2 + (k % 3) * 0.6, 5), Mt(0xe8f6ff));
    ic.rotation.x = Math.PI;
    ic.position.set((k - 3) * 0.42, 8.4 - (k % 3) * 0.3, 1.4 - Math.abs(k - 3) * 0.15);
    beard.add(ic);
  }
  const eyes = [-0.6, 0.6].map((x) => {
    const e = glow(0x9ad8ff, 0.9, 1);
    e.position.set(x, 10.7, 1.7);
    return e;
  });
  const legs = [-1.1, 1.1].map((x) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 3, 8), skin);
    l.position.set(x, 1.5, 0);
    return l;
  });
  const arms = [-1, 1].map((sx) => {
    const a = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 8), skin);
    arm.position.y = -2.4;
    a.add(arm);
    a.position.set(sx * 2.8, 8.4, 0);
    a.rotation.z = sx * 0.2;
    return a;
  });
  g.add(body, belt, head, beard, ...eyes, ...legs, ...arms);
  g.userData = { head, arms, eyes };
  g.scale.setScalar(scale);
  return g;
}
// the Frozen Crown: a ring of ice spikes, set with three jewels
function buildCrown() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 16), Mt(0xd8f0ff, { emissive: 0x4a8ac8, emissiveIntensity: 0.6, metalness: 0.4 }));
  band.rotation.x = Math.PI / 2;
  g.add(band);
  for (let k = 0; k < 8; k++) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6 + (k % 2) * 0.3, 4), band.material);
    sp.position.set(Math.cos((k / 8) * Math.PI * 2) * 0.5, 0.35, Math.sin((k / 8) * Math.PI * 2) * 0.5);
    g.add(sp);
  }
  [0x3a7aff, 0xffffff, 0xff3a5a].forEach((c, i) => {
    const j = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: c }));
    j.position.set(Math.cos(i * 0.6 - 0.6 + Math.PI / 2) * 0.55, 0.05, Math.sin(i * 0.6 - 0.6 + Math.PI / 2) * 0.55);
    g.add(j);
  });
  g.add(glow(0xbfe8ff, 2.4, 0.6));
  return g;
}

export function initPhase39(api) {
  const { ctx, st, save, chime, redraw } = api;
  const C = () => cityState();
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const p39 = () => (st.p39 ||= { started: false, been: false, met: false, crossed: false, jewels: {}, done: false });
  const here = () => (ctx.world() === "city" && ctx.city() ? ctx.city().id : ctx.world());
  const zone = () => (here() === "frozensea" ? ctx.city() : null);
  const K = FROZENSEA;
  const Gl = K.glacier, H = K.hall, TOP = Gl.top;
  let wait = 0, hurtCool = 0, sled = null, falling = false;
  const held = {};
  window.addEventListener("keydown", (e) => (held[e.code] = true));
  window.addEventListener("keyup", (e) => (held[e.code] = false));
  window.addEventListener("blur", () => Object.keys(held).forEach((k) => (held[k] = false)));

  function goThere() {
    fadeThrough(() => {
      ctx.goCity("frozensea");
      ctx.placePlayer(K.arrive.x, K.arrive.z, Math.PI);
      const s = p39();
      if (!s.been) {
        s.been = true;
        save();
        redraw();
      }
      ctx.say(s.done
        ? "👑 Glimmerhold — the Snow King waves from his balcony, his crown glittering. The sea ice sparkles in the sun."
        : "👑 GLIMMERHOLD, the Snow King's palace, at the edge of the frozen sea. The blizzard howls. The King is waiting for you in the courtyard.", true);
    }, 1);
  }
  DRAGON_DESTS.push({ id: "frozensea", icon: "👑", name: "Glimmerhold & the Frozen Sea", when: () => st.phase >= 39, go: goThere });

  function begin() {
    p39().started = true;
    st.phase = 39;
    save();
    redraw();
    playCutscene([
      { dur: 1, fadeOut: true, gameCam: true },
      { dur: 4.4, black: true, gameCam: true, text: "It starts as a few flakes. Then a few more. By lunchtime the whole forest is white — and by evening the snow is coming down SIDEWAYS, and it doesn't stop." },
      { dur: 4.8, black: true, gameCam: true, who: "A snowy owl, iced to the eyebrows (the Snow King's own herald)", text: "“A message from His Majesty the Snow King! The Frozen Crown has been STOLEN — by the frost giants, from across the frozen sea. Without it, no one can tell winter when to stop!”" },
      { dur: 4.6, black: true, gameCam: true, who: "The herald owl", text: "“If the crown isn't home by spring… there won't BE a spring. His Majesty asks for you by name, Thistle. Please — come to Glimmerhold.”" },
      { dur: 1, fadeIn: true, gameCam: true, end: () => ctx.say("👑 PHASE 39 — The Frozen Crown. A blizzard covers the land! Go outside and press 1 — fly to Glimmerhold, the Snow King's palace.", true) },
    ]);
  }

  // ---------------------------------------------------------------- 🌨️ the blizzard (everywhere, until the crown comes home)
  const SN = 1600;
  let snow = null, snowPos = null;
  function blizzard(dt, t) {
    const s = p39();
    const want = st.phase >= 39 && s.started && !s.done && (ctx.world() === "outside" || here() === "frozensea");
    if (!want) {
      if (snow) snow.visible = false;
      return;
    }
    if (!snow) {
      snowPos = new Float32Array(SN * 3);
      for (let i = 0; i < SN; i++) snowPos.set([(Math.random() - 0.5) * 40, Math.random() * 18, (Math.random() - 0.5) * 40], i * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
      snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, map: glowTexture(), transparent: true, opacity: 0.95, depthWrite: false, fog: false }));
      snow.frustumCulled = false;
      ctx.scene.add(snow);
    }
    snow.visible = true;
    const c = ctx.camera.position;
    const wind = here() === "frozensea" ? 9 : 5;
    for (let i = 0; i < SN; i++) {
      let x = snowPos[i * 3], y = snowPos[i * 3 + 1], z = snowPos[i * 3 + 2];
      y -= dt * (3 + (i % 5) * 0.5);
      x += dt * (wind + Math.sin(t * 1.3 + i) * 2);
      z += dt * Math.cos(t + i * 0.3) * 1.5;
      if (y < -4) y += 18;
      if (x > 20) x -= 40;
      if (z > 20) z -= 40;
      if (z < -20) z += 40;
      snowPos[i * 3] = x;
      snowPos[i * 3 + 1] = y;
      snowPos[i * 3 + 2] = z;
    }
    snow.position.set(c.x, c.y - 8, c.z);
    snow.geometry.attributes.position.needsUpdate = true;
  }

  // ---------------------------------------------------------------- people, giants, snowballs
  let builtFor = null, king = null, dogsHome = null, team = null, gate = null, watcher = null, hrim = null, jewelMesh = null, crown = null, hud = null;
  let balls = [], ballT = 0;
  function huskies() {
    const g = new THREE.Group();
    const cols = [0x6a6a74, 0xf4f4f8, 0x3a3a40, 0xc8a070];
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.9), Mt(cols[i]));
      body.position.y = 0.55;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.36), Mt(cols[i]));
      head.position.set(0, 0.8, 0.55);
      const legs = [];
      for (const [lx, lz] of [[-0.14, 0.3], [0.14, 0.3], [-0.14, -0.3], [0.14, -0.3]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), Mt(cols[i]));
        leg.position.set(lx, 0.2, lz);
        d.add(leg);
        legs.push(leg);
      }
      d.add(body, head);
      d.userData.legs = legs;
      d.position.set(i % 2 ? 0.45 : -0.45, 0, 1.6 + Math.floor(i / 2) * 1.2);
      g.add(d);
    }
    const sl = new THREE.Group();
    for (const sx of [-0.45, 0.45]) {
      const run = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.2), Mt(0x6a4a2c));
      run.position.set(sx, 0.08, -0.6);
      sl.add(run);
    }
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.6), Mt(0x3a5a9a));
    bed.position.set(0, 0.32, -0.6);
    sl.add(bed);
    g.add(sl);
    return g;
  }
  function build(Z) {
    if (builtFor === Z) return;
    builtFor = Z;
    king = buildThistle({ tunicColor: 0xf4f8ff, hoodColor: 0xd8e8ff, pack: false });
    king.scale.setScalar(1.5);
    const cape = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 10, 1, true), Mt(0x3a5aa8, { side: THREE.DoubleSide }));
    cape.position.set(0, 0.7, -0.08);
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), Mt(0xffffff));
    beard.scale.set(1, 1.3, 0.7);
    beard.position.set(0, 0.95, 0.28);
    king.add(cape, beard);
    crown = buildCrown();
    crown.scale.setScalar(0.55);
    crown.position.y = 1.5;
    crown.visible = false;
    king.add(crown);
    king.position.set(K.king.x, 0, K.king.z);
    Z.group.add(king);
    dogsHome = huskies();
    dogsHome.position.set(K.sledStart.x, 0, K.sledStart.z);
    dogsHome.rotation.y = Math.PI;
    Z.group.add(dogsHome);
    team = huskies();
    team.visible = false;
    Z.group.add(team);
    gate = buildGiant(1, 0x4a6a8a);
    gate.position.set(4, TOP, Gl.z1 - 5);
    Z.group.add(gate);
    watcher = buildGiant(1.1, 0x6a5a9a);
    watcher.position.set(K.watcher.x, TOP, K.watcher.z);
    Z.group.add(watcher);
    Z.colliders.push({ x: K.watcher.x, z: K.watcher.z, r: 3 });
    hrim = buildGiant(1.6, 0x2a3a6a);
    hrim.position.set(K.throne.x, TOP + 1.5, K.throne.z);
    const hc = buildCrown();
    hc.scale.setScalar(2);
    hc.position.set(0, 12.3, 0);
    hrim.add(hc);
    hrim.userData.crown = hc;
    Z.group.add(hrim);
    // the second jewel, glittering on its pedestal
    jewelMesh = new THREE.Group();
    jewelMesh.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe8ff, emissiveIntensity: 0.8, metalness: 0.5, flatShading: true })), glow(0xffffff, 2.6, 0.8));
    jewelMesh.position.set(K.jewel2.x, TOP + 2, K.jewel2.z);
    Z.group.add(jewelMesh);
  }
  function hudShow(text, col) {
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "ww-frost-hud";
      hud.style.cssText = "position:fixed;left:50%;top:150px;transform:translateX(-50%);padding:10px 24px;border-radius:14px;font:900 26px 'Trebuchet MS',sans-serif;z-index:60;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.4);color:#fff";
      document.body.appendChild(hud);
    }
    hud.style.display = text ? "block" : "none";
    hud.textContent = text || "";
    hud.style.background = col || "#2a4a6a";
  }

  // ---------------------------------------------------------------- 🐕 the sled run
  const camPos = new THREE.Vector3();
  function startSled() {
    const S0 = K.sledStart;
    sled = { speed: 0, vy: 0, y: 0, cp: { x: S0.x, z: S0.z - 3, yaw: Math.PI }, next: 0, bump: 0 };
    dogsHome.visible = false;
    team.visible = true;
    ctx.placePlayer(S0.x, S0.z - 3, Math.PI);
    camPos.set(0, 0, 0);
    ctx.setFlight((dt, keys) => {
      if (!sled) return;
      const p = me();
      const want = keys.KeyW || keys.ArrowUp ? 30 : keys.KeyS || keys.ArrowDown ? 8 : 21;
      sled.speed += (want - sled.speed) * Math.min(1, dt * 1.6);
      if (sled.bump > 0) {
        sled.bump -= dt;
        sled.speed = Math.min(sled.speed, 6);
      }
      const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      ctx.mouseRig.rotation.y += turn * dt * 1.7;
      const yaw = ctx.mouseRig.rotation.y;
      let nx = p.x + Math.sin(yaw) * sled.speed * dt, nz = p.z + Math.cos(yaw) * sled.speed * dt;
      // icebergs, and the frozen ship: THUD
      const Z = zone();
      for (const c of Z.colliders) {
        const d = Math.hypot(nx - c.x, nz - c.z);
        if (d < c.r + 0.9 && d > 0.001 && !(sled.y > (c.top ?? Infinity))) {
          nx = c.x + ((nx - c.x) / d) * (c.r + 0.9);
          nz = c.z + ((nz - c.z) / d) * (c.r + 0.9);
          if (sled.speed > 12 && sled.bump <= 0) {
            sled.bump = 0.8;
            ctx.say("🐕 THUD! Straight into the ice — the dogs shake their heads and carry on. (A/D to steer round!)");
          }
        }
      }
      const dR = Math.hypot(nx, nz);
      if (dR > K.R - 3) (nx *= (K.R - 3) / dR), (nz *= (K.R - 3) / dR);
      p.x = nx;
      p.z = nz;
      // ramps: WHOOSH
      if (sled.y <= 0.01 && K.ramps.some((R0) => Math.hypot(p.x - R0.x, p.z - R0.z) < 2.4)) {
        sled.vy = 9;
        sled.y = 0.4;
        ctx.say("🐕 WHEEEE! The team flies off the ramp!");
      }
      if (sled.y > 0 || sled.vy > 0) {
        sled.vy -= 18 * dt;
        sled.y = Math.max(0, sled.y + sled.vy * dt);
        if (sled.y === 0) sled.vy = 0;
      }
      p.y = sled.y;
      // checkpoints: the lantern flags
      K.flags.forEach((F, i) => {
        if (i >= sled.next && Math.hypot(p.x - F.x, p.z - F.z) < 9) {
          sled.next = i + 1;
          sled.cp = { x: F.x, z: F.z - 2, yaw };
        }
      });
      // THIN ICE — crack!
      if (sled.y <= 0.01 && K.thin.some((T) => Math.hypot(p.x - T.x, p.z - T.z) < T.r - 0.4) && !falling) {
        falling = true;
        ctx.hurt(4);
        ctx.say("💦 CRRRACK — SPLOOSH! Thin ice! The huskies scramble out and haul you onto solid ice, shivering. Back to the last lantern flag… (keep off the DARK ice — or jump it from a blue ramp!)", true);
        fadeThrough(() => {
          ctx.placePlayer(sled.cp.x, sled.cp.z, sled.cp.yaw);
          sled.speed = 0;
          falling = false;
        }, 0.8);
      }
      // the far shore: the glacier's foot
      if (p.z < K.seaEnd + 1) stopSled(true);
      team.position.set(p.x, p.y, p.z);
      team.rotation.y = yaw;
      const t = performance.now() / 1000;
      team.children.forEach((d, i) => {
        if (!d.userData.legs) return;
        d.userData.legs.forEach((l, k) => (l.rotation.x = Math.sin(t * 16 + i + (k % 2) * Math.PI) * 0.7));
        d.position.y = Math.abs(Math.sin(t * 16 + i)) * 0.08;
      });
    });
    ctx.setFlightCam((dt) => {
      const p = me();
      const yaw = ctx.mouseRig.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 8, p.y + 3.6, p.z - Math.cos(yaw) * 8);
      if (camPos.lengthSq() === 0) camPos.copy(want);
      camPos.lerp(want, Math.min(1, dt * 4));
      ctx.camera.position.copy(camPos);
      ctx.camera.lookAt(p.x + Math.sin(yaw) * 6, p.y + 0.8, p.z + Math.cos(yaw) * 6);
      return true;
    });
    ctx.say("🐕 MUSH! The royal huskies YIP and pull! A/D steer · W faster · S slower. Follow the glowing LANTERN FLAGS north through the blizzard — and keep off the DARK ice!", true);
  }
  function stopSled(arrived) {
    if (!sled) return;
    sled = null;
    ctx.setFlight(null);
    ctx.setFlightCam(null);
    team.visible = false;
    const s = p39();
    if (arrived) {
      ctx.placePlayer(0, K.seaEnd - 1, Math.PI);
      team.visible = true;
      team.position.set(7, 0, K.seaEnd + 2);
      team.rotation.y = Math.PI / 2;
      if (!s.crossed) {
        s.crossed = true;
        save();
        redraw();
        chime();
      }
      ctx.say("🐕 You made it across the frozen sea! The huskies flop down to wait for you. Ahead: the GREAT GLACIER. It's slippery — don't stop walking, or you'll slide back down. And something big is moving at the top…", true);
    }
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    if (st.phase < 39) return null;
    const Z = zone();
    if (!Z || sled) return null;
    const s = p39();
    if (near(K.arrive.x, K.arrive.z, 3)) return { label: "climb on your dragon and fly home 🐉", act: () => fadeThrough(() => ctx.goOutside(), 1) };
    if (near(K.king.x, K.king.z, 3.4)) return { label: "speak with the Snow King 👑", act: () => {
      if (s.done) return ctx.say("👑 “Winter will come back next year, little friend — as it should. And it will LEAVE again, as it should. Thank you.”", true);
      if (!s.met) {
        s.met = true;
        save();
        redraw();
        chime();
        playCutscene([
          { dur: 4.6, from: [K.king.x + 3, 2.6, K.king.z - 4], look: [K.king.x, 1.8, K.king.z], who: "The Snow King", text: "“Thistle. Thank you for coming through this storm. The frost giants took my crown three nights ago. Their palace is on the glacier, far across the frozen sea.”" },
          { dur: 5, from: [K.king.x + 3, 2.6, K.king.z - 4], look: [K.king.x, 1.8, K.king.z], who: "The Snow King", text: "“The giants are not wicked — only frightened. Every spring their palace melts, and they must build it again. I think they want winter to never end. But it MUST end, or nothing will grow.”" },
          { dur: 5.4, from: [K.king.x + 3, 2.6, K.king.z - 4], look: [K.king.x, 1.8, K.king.z], who: "The Snow King", text: "“Learn this song. It is the Song of Seasons — the crown's oldest promise: that winter always comes back. Four… two… four… one… eight… five. If their king will listen to anything, it is that.”" },
          { dur: 4.4, from: [K.king.x + 3, 2.6, K.king.z - 4], look: [K.king.x, 1.8, K.king.z], who: "The Snow King", text: "“Take my huskies. They know the ice — but you must steer. Follow the lantern flags, and keep off the dark ice.”" },
          { dur: 0.6, gameCam: true, end: () => ctx.say("🎶 The Song of Seasons: 4 · 2 · 4 · 1 · 8 · 5 (U for your flute). Now — the royal sleds are by the kennel!", true) },
        ]);
      } else ctx.say("👑 “The Song of Seasons: four, two, four, one… eight, five. The huskies are waiting by the kennel.”", true);
    } };
    if (!s.done && near(K.sledStart.x, K.sledStart.z, 3.4)) {
      if (!s.met) return { label: "(the royal huskies — talk to the King first)", act: () => ctx.say("🐕 The huskies wag at you, but they're the King's dogs. Speak to the Snow King first.", true) };
      return { label: "hitch up the royal huskies 🐕", act: startSled };
    }
    if (near(0, K.seaEnd - 1, 4) && s.crossed) return { label: "sled back to Glimmerhold 🐕", act: () => fadeThrough(() => ctx.placePlayer(K.arrive.x, K.arrive.z - 4, Math.PI), 1) };
    // the throne
    if (near(K.throne.x, K.throne.z + 5, 6) && me().y > TOP - 1 && !s.done) {
      const n = Object.keys(s.jewels).length;
      if (n < 2) return { label: "look up at the Giant King 🧊", act: () => ctx.say("🧊 Hrimfang, King of the Frost Giants, sits on his throne of ice with the Frozen Crown on his head. He doesn't even look down at you. (Win the other two jewels first!)", true) };
      return { label: "speak to Hrimfang, King of the Frost Giants 🧊", act: kingTalk };
    }
    return null;
  }
  let talked = false, storm = null, stormDone = false;
  const STORM_SECS = 25;
  function icicleStorm(dt) {
    if (!storm) return;
    const Z = zone();
    const p = me();
    storm.t += dt;
    storm.next -= dt;
    hudShow(`🧊 ICICLE STORM — survive! ${Math.max(0, Math.ceil(STORM_SECS - storm.t))}`, "#3a5a8a");
    if (storm.next <= 0 && storm.t < STORM_SECS - 1) {
      storm.next = Math.max(0.28, 0.75 - storm.t * 0.018);
      // half of them fall right where you are standing
      const aim = Math.random() < 0.5;
      const x = aim ? p.x + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 2 * (H.w - 2);
      const z = aim ? p.z + (Math.random() - 0.5) * 2 : K.throne.z + 3 + Math.random() * 14;
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), new THREE.MeshBasicMaterial({ color: 0x0a1a2a, transparent: true, opacity: 0.2, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, TOP + 0.06, z);
      const ic = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.4, 6), Mt(0xd8f4ff, { emissive: 0x6ab8ff, emissiveIntensity: 0.3 }));
      ic.rotation.x = Math.PI;
      ic.position.set(x, TOP + 22, z);
      Z.group.add(shadow, ic);
      storm.ice.push({ shadow, ic, x, z, t: 0 });
    }
    for (let i = storm.ice.length - 1; i >= 0; i--) {
      const I = storm.ice[i];
      I.t += dt;
      I.shadow.material.opacity = Math.min(0.75, 0.2 + I.t * 0.6);
      I.shadow.scale.setScalar(0.6 + Math.min(1, I.t) * 0.4);
      if (I.t > 1) I.ic.position.y = Math.max(TOP + 1.7, TOP + 22 - (I.t - 1) ** 2 * 60);
      if (I.t > 1 && I.ic.position.y <= TOP + 1.8 && !I.hit) {
        I.hit = true;
        if (Math.hypot(p.x - I.x, p.z - I.z) < 1.6 && !hurtCool) {
          hurtCool = 0.8;
          ctx.hurt(9);
          ctx.say("🧊 CRASH! An icicle shatters right on top of you! Watch the shadows!");
        }
      }
      if (I.t > 2.2) {
        Z.group.remove(I.shadow, I.ic);
        storm.ice.splice(i, 1);
      }
    }
    if (storm.t >= STORM_SECS) {
      storm.ice.forEach((I) => Z.group.remove(I.shadow, I.ic));
      storm = null;
      stormDone = true;
      hudShow(null);
      chime();
      ctx.say("🧊 The last icicle shatters… and Hrimfang lowers his arms, staring at you. “…You are still standing.” NOW play him the Song of Seasons: U, then 4 · 2 · 4 · 1 · 8 · 5.", true);
    }
  }
  // 🥶 the blizzard's COLD: on the sea and the glacier it chills you — lantern flags, the dogs and the palace warm you up
  let warmth = 100, coldEl = null, coldSaid = 0;
  function cold(dt) {
    const s = p39();
    const p = me();
    const out = !s.done && p.z < 98 && p.z > Gl.z1 - 0.5 && p.y < TOP - 1;
    const warmSpot = K.flags.some((F) => Math.hypot(p.x - F.x, p.z - F.z) < 7) || Math.hypot(p.x - 7, p.z - (K.seaEnd + 2)) < 6 || p.z > 96;
    if (!coldEl) {
      coldEl = document.createElement("div");
      coldEl.style.cssText = "position:fixed;left:50%;bottom:58px;transform:translateX(-50%);width:240px;height:18px;border-radius:9px;background:rgba(10,20,40,.7);border:2px solid #bfe8ff;z-index:40;pointer-events:none;overflow:hidden;font:900 12px 'Trebuchet MS',sans-serif;color:#fff;text-align:center;line-height:18px";
      document.body.appendChild(coldEl);
    }
    coldEl.style.display = out && zone() ? "block" : "none";
    if (!out) {
      warmth = Math.min(100, warmth + dt * 30);
      return;
    }
    warmth = warmSpot ? Math.min(100, warmth + dt * 25) : Math.max(0, warmth - dt * (sled ? 1.7 : 2.6));
    coldEl.innerHTML = `<div style="position:absolute;inset:0;width:${warmth}%;background:linear-gradient(90deg,#4a8aff,#ffb040)"></div><span style="position:relative">${warmSpot ? "🔥 warming up…" : "🥶 warmth"} ${Math.round(warmth)}%</span>`;
    if (warmth < 30 && performance.now() - coldSaid > 9000) {
      coldSaid = performance.now();
      ctx.say("🥶 Brrr — you're FREEZING! Get to a lantern flag (or the huskies) to warm up!");
    }
    if (warmth <= 0 && !falling) {
      falling = true;
      ctx.hurt(8);
      if (sled) stopSled(false);
      const back = K.flags.filter((F) => F.z > p.z).sort((a, b) => a.z - b.z)[0];
      const to = p.z < K.seaEnd ? { x: 0, z: K.seaEnd - 2 } : back ? { x: back.x, z: back.z } : { x: K.sledStart.x, z: K.sledStart.z };
      ctx.say("🥶 Too cold… you can't go on. You stumble back to the last warm spot, teeth chattering. (Hop between the lantern flags — they're WARM!)", true);
      fadeThrough(() => {
        ctx.placePlayer(to.x, to.z, Math.PI);
        warmth = 70;
        falling = false;
      }, 0.8);
    }
  }
  function kingTalk() {
    const T = K.throne;
    playCutscene([
      { dur: 4.8, from: [T.x + 9, TOP + 9, T.z + 34], look: [T.x, TOP + 15, T.z], who: "Hrimfang, King of the Frost Giants", text: "“So. The little one who climbed our glacier and crossed the Hall of Statues. You came for the crown. You will not have it.”" },
      { dur: 5.4, from: [T.x + 9, TOP + 9, T.z + 34], look: [T.x, TOP + 15, T.z], who: "Hrimfang", text: "“Every spring, the sun comes. Our halls drip. Our towers fall. Every year we build them again, and every year they melt. With this crown, winter NEVER ends. We will never lose our home again.”" },
      { dur: 4.4, from: [T.x + 9, TOP + 9, T.z + 34], look: [T.x, TOP + 15, T.z], who: "Hrimfang", text: "“And if you want me to LISTEN to you… first, little one, survive my ICICLE STORM!” He raises his great arms — and the roof of the hall begins to crack." },
      { dur: 0.6, gameCam: true, end: () => {
        talked = true;
        storm = { t: 0, next: 0, ice: [] };
        ctx.say("🧊 ICICLE STORM! Watch for the dark SHADOWS on the floor and get out from under them! Survive 25 seconds!", true);
      } },
    ]);
  }
  window.addEventListener("ww-note", (e) => {
    const s = p39();
    if (st.phase < 39 || s.done || !zone() || !talked || !near(K.throne.x, K.throne.z + 5, 9)) return;
    if (!stormDone) return ctx.say("🧊 Hrimfang can't hear a thing over his own icicle storm! Survive it first.");
    const n = e.detail.all || e.detail.notes;
    if (n.length >= SONG.length && SONG.every((v, i) => v === n[n.length - SONG.length + i])) setTimeout(finale, 1200);
  });

  function jewel(k) {
    const s = p39();
    s.jewels[k] = true;
    save();
    redraw();
    chime();
  }
  function gateWin() {
    jewel("sapphire");
    balls.forEach((b) => b.m.parent && b.m.parent.remove(b.m));
    balls = [];
    const P = gate.position;
    playCutscene([
      { dur: 4.6, from: [P.x - 6, TOP + 4, P.z + 14], look: [P.x, TOP + 9, P.z], who: "Grumblefrost, the Gate Giant", text: "“WHAT?! Nobody's EVER climbed my glacier! Not with my snowballs. Not EVER.” He scratches his icicle beard. “…Hmph. Well. Fair's fair. A climber like that earns a jewel.”" },
      { dur: 4, from: [P.x - 6, TOP + 4, P.z + 14], look: [P.x, TOP + 9, P.z], text: "He prises a deep-blue jewel off his belt — the Sapphire of Snowfall, one of the three jewels of the Frozen Crown — and drops it at your feet." },
      { dur: 0.6, gameCam: true, end: () => ctx.say("💎 The Sapphire of Snowfall! (1/3) Ahead: the Hall of Statues. The Watcher guards the next jewel — move ONLY while his back is turned!", true) },
    ]);
  }
  function watcherWin() {
    jewel("diamond");
    const P = watcher.position;
    playCutscene([
      { dur: 4.6, from: [P.x + 6, TOP + 3, P.z + 14], look: [P.x, TOP + 6, P.z], who: "The Watcher (slowly, with a creak)", text: "“…You did not move. Not one whisker. In a thousand years of watching… no one has ever been so still.” He bows — a long, frosty bow." },
      { dur: 3.6, from: [P.x + 4, TOP + 2.5, P.z + 9], look: [K.jewel2.x, TOP + 2, K.jewel2.z], text: "The Diamond of Stillness is yours. Beyond the hall, on his throne of ice, sits the King of the Frost Giants — wearing the Frozen Crown." },
      { dur: 0.6, gameCam: true, end: () => ctx.say("💎 The Diamond of Stillness! (2/3) Now: Hrimfang, King of the Frost Giants, on his throne at the end of the hall.", true) },
    ]);
  }

  function finale() {
    const s = p39();
    const Z = zone();
    const T = K.throne;
    playCutscene([
      { dur: 4.6, from: [T.x + 9, TOP + 9, T.z + 34], look: [T.x, TOP + 15, T.z], text: "Four… two… four… one. The little tune drifts up through the frozen hall — and the howling of the blizzard goes quiet to listen." },
      { dur: 5.2, from: [T.x + 4, TOP + 16, T.z + 20], look: [T.x, TOP + 18, T.z], who: "Hrimfang (very softly)", text: "“My mother sang me that. ‘Winter goes, and winter comes again. Always, always, comes again.’ …I had forgotten.” A single frozen tear rolls down his cheek and lands — tink — beside you." },
      { dur: 5.2, from: [T.x + 9, TOP + 9, T.z + 34], look: [T.x, TOP + 15, T.z], who: "Hrimfang", text: "“The palace will melt. And next winter, we will build it again — and it will be beautiful again. Take the crown home, little one. And the last jewel with it: the Ruby of the Hearth.”", run: () => (hrim.userData.crown.visible = false) },
      { dur: 4.6, from: [K.king.x + 6, 3.2, K.king.z - 8], look: [K.king.x, 2, K.king.z], text: "Your dragon carries you home over the frozen sea, the crown held tight. In the courtyard of Glimmerhold, you set the Frozen Crown on the Snow King's head…", run: () => {
        crown.visible = true;
        ctx.placePlayer(K.king.x + 1.6, K.king.z - 2.4, Math.PI * 0.2);
      } },
      { dur: 5, from: [K.king.x + 14, 10, K.king.z - 26], look: [K.king.x, 14, K.king.z + 10], text: "…and the blizzard simply STOPS. The clouds pull apart. Ribbons of green and violet light ripple across the sky — and far away, over the Great Forest, the snow begins, at last, to melt.", run: () => (s.done = true) },
      { dur: 5, from: [K.king.x + 3, 2.4, K.king.z - 4], look: [K.king.x, 1.8, K.king.z], who: "The Snow King", text: "“The giants will melt, and build again, and so will we all. Thank you, Thistle. Take this — a snowflake from the crown itself. It will never melt. Neither will my thanks.”" },
      { dur: 4, black: true, gameCam: true, who: "👑 PHASE 39 COMPLETE", text: "The Frozen Crown\n🪙 1500 · ❄️ The King's Snowflake" },
      { dur: 0.8, fadeIn: true, gameCam: true, end: () => {
        jewel("ruby");
        s.done = true;
        const c = C();
        c.coins = (c.coins || 0) + 1500;
        (c.owned ||= {}).kingsnowflake = true;
        saveCity();
        save();
        redraw();
        chime();
        ctx.say("👑 The crown is home, the blizzard is over, and spring is on its way. (The King's Snowflake helps you heal.)", true);
      } },
    ]);
  }

  // ---------------------------------------------------------------- each frame
  function caught() {
    hurtCool = 1.5;
    ctx.hurt(4);
    ctx.say("❄️ “I SAW THAT!” — WHOOOSH! The Watcher's frost breath blows you all the way back to the start line!", true);
    fadeThrough(() => ctx.placePlayer(0, H.z0 + 1.2, Math.PI), 0.5);
    W.mode = "count";
    W.t = 3;
    W.c = 0;
    W.peeked = false;
  }
  // 🗿 the Hall of Statues: the Watcher's game
  const W = { mode: "count", t: 4, start: null, said: -1 };
  function statues(dt, t) {
    const s = p39();
    const p = me();
    const inHall = p.y > TOP - 1 && p.z < H.z0 && p.z > H.z1 - 2 && Math.abs(p.x) < H.w;
    if (s.jewels.diamond || !s.jewels.sapphire) {
      watcher.rotation.y = 0;
      return;
    }
    if (!inHall) {
      hudShow(null);
      W.mode = "count";
      W.t = 4;
      watcher.rotation.y = Math.PI;
      return;
    }
    W.t -= dt;
    if (W.mode === "count") {
      watcher.rotation.y += (Math.PI - watcher.rotation.y) * Math.min(1, dt * 8); // (back turned)
      W.c = (W.c || 0) + dt;
      const n = Math.min(3, Math.floor(W.c / 0.9) + 1);
      hudShow(`🙈 ${["ONE…", "ONE… TWO…", "ONE… TWO… THREE…"][n - 1]}  MOVE!`, "#2a8a3a");
      // …and sometimes he PEEKS back over his shoulder mid-count!
      if (!W.peeked && W.c > 0.8 && W.t > 0.9 && Math.random() < dt * 0.6) {
        W.peeked = true;
        W.mode = "peek";
        W.pt = 0.7;
        W.start = { x: p.x, z: p.z };
      }
      if (W.t <= 0) {
        W.mode = "turn";
        W.t = 0.3;
      }
    } else if (W.mode === "peek") {
      W.pt -= dt;
      W.t += dt; // (the count pauses while he peeks)
      watcher.rotation.y += (0.6 - watcher.rotation.y) * Math.min(1, dt * 14);
      hudShow("👀 A PEEK!", "#c84a1a");
      if (W.start && Math.hypot(p.x - W.start.x, p.z - W.start.z) > 0.18 && !hurtCool) caught();
      else if (W.pt <= 0) W.mode = "count";
    } else if (W.mode === "turn") {
      watcher.rotation.y += (0 - watcher.rotation.y) * Math.min(1, dt * 10);
      hudShow("👀 …FOUR!", "#c88a1a");
      if (W.t <= 0) {
        W.mode = "look";
        W.t = 3 + Math.random() * 1.6;
        W.start = { x: p.x, z: p.z };
      }
    } else {
      watcher.rotation.y = 0;
      hudShow("🧊 FREEZE! He's WATCHING…", "#b83a3a");
      if (W.start && Math.hypot(p.x - W.start.x, p.z - W.start.z) > 0.18 && !hurtCool) caught();
      if (W.t <= 0) {
        W.mode = "count";
        W.t = 1.6 + Math.random() * 1.6; // (short, unpredictable bursts)
        W.c = 0;
        W.peeked = false;
      }
    }
    if (near(K.jewel2.x, K.jewel2.z, 2.6)) {
      hudShow(null);
      watcherWin();
    }
  }
  // ⛄ the Gate Giant's snowballs, rolling down the glacier
  function snowballs(dt, t) {
    const s = p39();
    const Z = zone();
    const p = me();
    if (s.jewels.sapphire) return;
    const onGlacier = p.z < K.seaEnd && p.z > Gl.z1 - 2 && Math.abs(p.x) < Gl.w + 1;
    // the giant winds up and throws while you're on his glacier
    gate.userData.arms[1].rotation.x = onGlacier ? Math.sin(t * 3) * 1.1 : 0;
    if (onGlacier) {
      ballT -= dt;
      if (ballT <= 0) {
        ballT = 0.8 + Math.random() * 0.45;
        const m = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), Mt(0xffffff));
        Z.group.add(m);
        // aim near you, about half the time
        const x = Math.random() < 0.7 ? Math.max(-Gl.w + 1.4, Math.min(Gl.w - 1.4, p.x + (Math.random() - 0.5) * 3)) : (Math.random() - 0.5) * 2 * (Gl.w - 1.4);
        balls.push({ m, x, z: Gl.z1 + 1, sp: 12 + Math.random() * 4 });
      }
    }
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.z += b.sp * dt;
      const y = frozenHeight(b.x, b.z);
      b.m.position.set(b.x, Math.max(0, y) + 1.3, b.z);
      b.m.rotation.x += b.sp * dt / 1.3;
      if (b.z > Gl.z0 + 6) {
        Z.group.remove(b.m);
        balls.splice(i, 1);
        continue;
      }
      if (!hurtCool && !ctx.playing() && Math.hypot(p.x - b.x, p.z - b.z) < 1.9 && Math.abs(p.y - y) < 2.2) {
        hurtCool = 1.6;
        ctx.hurt(6);
        // bowled back down the slope (but not into a crevasse)
        let nz = Math.min(Gl.z0 - 1, p.z + 9);
        if (Gl.crevs.some((c) => Math.abs(nz - c) < 1.8)) nz += 2.6;
        ctx.placePlayer(p.x, nz, Math.PI);
        ctx.say("⛄ BOOF! A giant snowball bowls you over and you tumble back down the glacier! (Watch the top — dodge left and right!)");
      }
    }
    if (p.z < Gl.z1 - 1.5 && p.y > TOP - 1.5 && !s.jewels.sapphire && !ctx.playing()) gateWin();
  }

  let testAt = new URLSearchParams(location.search).get("p39at");
  function update(dt, t = performance.now() / 1000) {
    if (st.phase === 38 && st.p38 && st.p38.done && !p39().started && !ctx.playing() && ctx.quadMouse()) {
      wait += dt;
      if (wait > 6) begin(); // (a few seconds after the last phase)
    }
    blizzard(dt, t);
    const Z = zone();
    if (!Z || st.phase < 39) {
      if (sled) stopSled(false);
      hudShow(null);
      return;
    }
    build(Z);
    const s = p39();
    if (testAt) {
      const at = { sled: [K.sledStart.x, K.sledStart.z - 1], glacier: [0, K.seaEnd - 2], hall: [0, H.z0 + 2], throne: [0, K.throne.z + 8] }[testAt];
      testAt = null;
      if (at) ctx.placePlayer(at[0], at[1], Math.PI);
    }
    hurtCool = Math.max(0, hurtCool - dt);
    king.rotation.y = s.done ? Math.PI : Math.atan2(me().x - king.position.x, me().z - king.position.z);
    crown.visible = !!s.done;
    dogsHome.visible = !sled;
    hrim.userData.crown.visible = !s.done;
    jewelMesh.visible = !s.jewels.diamond;
    jewelMesh.rotation.y = t;
    if (!sled) team.visible = s.crossed && !s.done;
    if (ctx.playing()) return;
    const p = me();
    // (on foot across the sea? the dark ice cracks under you too)
    if (!sled && !falling && p.y < 0.4 && p.z > K.seaEnd && K.thin.some((T) => Math.hypot(p.x - T.x, p.z - T.z) < T.r - 0.4)) {
      falling = true;
      ctx.hurt(4);
      const back = K.flags.filter((F) => F.z > p.z + 3).sort((a, b) => a.z - b.z)[0] || { x: K.sledStart.x, z: K.sledStart.z };
      ctx.say("💦 CRRRACK — SPLOOSH! The dark ice is THIN! You haul yourself out, shivering, and squelch back to the last lantern flag.", true);
      fadeThrough(() => {
        ctx.placePlayer(back.x, back.z, Math.PI);
        falling = false;
      }, 0.8);
    }
    if (!sled && !s.crossed && p.z < K.seaEnd - 0.5) {
      s.crossed = true;
      save();
      redraw();
    }
    // ⛰️ slippery: stop walking on the glacier and you SLIDE back down
    const onSlope = p.z < Gl.z0 && p.z > Gl.z1 && Math.abs(p.x) < Gl.w + 1 && p.y > -0.5;
    if (onSlope && !sled && !(held.KeyW || held.ArrowUp)) {
      const nz = Math.min(Gl.z0 + 0.5, p.z + dt * 7.5);
      if (!Gl.crevs.some((c) => Math.abs(nz - c) < 1.3)) ctx.placePlayer(p.x, nz, ctx.mouseRig.rotation.y);
    }
    // 🕳️ fell in a crevasse
    if (!falling && p.y < -4 && p.z < Gl.z0 && p.z > Gl.z1) {
      falling = true;
      ctx.hurt(5);
      ctx.say("🕳️ WHOOOA— you slip into a crevasse! A long, slidey ride under the ice spits you out at the bottom of the glacier. (JUMP the dark cracks!)", true);
      fadeThrough(() => {
        ctx.placePlayer(0, K.seaEnd - 2, Math.PI);
        falling = false;
      }, 0.8);
    }
    snowballs(dt, t);
    statues(dt, t);
    cold(dt);
    icicleStorm(dt);
    // the giants breathe
    for (const g of [gate, watcher, hrim]) g.userData.head.position.y = 10.4 + Math.sin(t * 1.2 + g.position.z) * 0.08;
  }

  function panelHTML() {
    const s = p39();
    const row = (done, text) => `<li class="${done ? "done" : ""}">${done ? "✔" : "○"} ${text}</li>`;
    const j = s.jewels;
    return `<h3>👑 The Frozen Crown</h3><ul>
      ${row(s.been, "Fly to Glimmerhold, the Snow King's palace <div class=\"sub\">&nbsp;&nbsp;🐉 outside, press 1 → “Glimmerhold”</div>")}
      ${row(s.met, "Speak with the Snow King")}
      ${row(s.crossed, "Sled across the frozen sea 🐕 <div class=\"sub\">&nbsp;&nbsp;follow the lantern flags · keep off the DARK ice</div>")}
      ${row(!!j.sapphire, "Climb the great glacier — dodge the snowballs ⛄")}
      ${row(!!j.diamond, "Cross the Hall of Statues 🗿 <div class=\"sub\">&nbsp;&nbsp;move only while the Watcher's back is turned</div>")}
      ${row(s.done, "Win back the Frozen Crown from Hrimfang 🎶")}
    </ul><div class="kit">🥶 warm up at the lantern flags · 🎶 the Song of Seasons: U, then 4 · 2 · 4 · 1 · 8 · 5 · ⛰️ on the glacier, keep walking or you'll slide</div>`;
  }

  // (test hook)
  window.__wwP39 = {
    state: () => ({ ...p39(), sledding: !!sled, watcher: W.mode, talked }),
    playing: () => ctx.playing(),
    noBalls: () => (ballT = 9999),
    stormNow: () => (storm ? storm.t : stormDone ? "done" : null),
    skipStorm: () => storm && (storm.t = STORM_SECS),
    warmth: () => warmth,
  };
  return { update, interactable, panelHTML, done: () => !!p39().done };
}
