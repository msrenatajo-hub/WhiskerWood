// ------------------------------------------------------------
//  🦊  PHASE 2 — "Alone"
//
//  The expedition leaves at first light… a fox scatters it… and you wake
//  up alone with almost nothing. The only objective is: SURVIVE.
//
//    🎒 Find your backpack        (inside: your journal + a simple knife;
//                                  the lantern + compass are on your belt)
//    💧 Drink at the water's edge
//    🍓 Eat something             (berries, fallen berries, clover, pine nuts)
//    🪵 Gather 4 twigs · 3 tinder · 5 leaves   (from the forest floor — every
//                                  biome drops different things)
//    🔥 Build a campfire
//    🍂 Build a leaf shelter
//    🦊 Dusk: the fox comes — hide in your shelter!
//    🌙 Sleep through the night
//    🐾 Morning: follow the pawprints… a scrap of Teacher Willow's map.
//       "They were here."
//
//  The minimap trail always points at the next thing to do. J opens the
//  journal, where Thistle writes down each day.
// ------------------------------------------------------------
import * as THREE from "three";
import { playStoryCutscene as playCutscene } from "./cutscene.js";
import { makePawTrail } from "./tracks.js";

const STEPS = [
  ["pack", "Find your backpack"],
  ["drink", "Drink water (E at the water's edge)"],
  ["eat", "Eat something — berries, clover, pine nuts…"],
  ["gather", "Gather from the forest floor"],
  ["fire", "Build a campfire"],
  ["shelter", "Build a leaf shelter"],
  ["fox", "Hide from the fox!"],
  ["sleep", "Sleep in your shelter"],
  ["clue", "Follow the pawprints"],
];
const NEED = { twig: 4, tinder: 3, leaf: 5 };
const FIRE_COST = { twig: 2, tinder: 3 };
const SHELTER_COST = { twig: 2, leaf: 5 };
// a soft round glow for sparkles (a Sprite with no texture is a hard square)
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,245,200,0.7)");
  grad.addColorStop(1, "rgba(255,240,180,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

const RES_ICON = { twig: "🪵", tinder: "🌾", leaf: "🍂", food: "🍓", moss: "🌿" };
const RES_NAME = { twig: "twigs", tinder: "tinder", leaf: "leaves", food: "food", moss: "moss" };

export function initPhase2(api) {
  const { ctx, st, save, chime, tone, talkTo, npc, npcHead, redraw } = api;
  st.p2 ||= { started: false, done: {}, res: {}, journal: [] };
  const p2 = st.p2;
  const me = () => ctx.mouseRig.position;
  const dist2d = (a, x, z) => Math.hypot(a.x - x, a.z - z);
  const has = (cost) => Object.entries(cost).every(([k, n]) => (p2.res[k] || 0) >= n);
  const spend = (cost) => {
    for (const [k, n] of Object.entries(cost)) p2.res[k] = (p2.res[k] || 0) - n;
  };
  const write = (text) => {
    p2.journal.push(text);
    save();
  };
  function complete(key, msg) {
    if (p2.done[key]) return;
    p2.done[key] = true;
    save();
    redraw();
    chime();
    if (msg) ctx.say(msg);
  }

  // the expedition: everyone except the Headmaster (he stays to keep the school)
  const members = () => ctx.npcs.filter((n) => n.key !== "bramble");

  // ---------- where things happen ----------
  function pickPlaces() {
    const s = ctx.school();
    const F = ctx.falls;
    const dx = F.x - s.x;
    const dz = F.z - s.z;
    const L = Math.hypot(dx, dz) || 1;
    const dir = { x: dx / L, z: dz / L }; // north-ish, toward Moonstone Hollow
    // the attack: out in the open, not far past the school
    const door = { x: s.x + ctx.spots.door[0], z: s.z + ctx.spots.door[1] };
    const attack = { x: door.x + dir.x * 55, z: door.z + dir.z * 55 };
    // you run… and wake up far off, ideally beside a berry bush
    let wake = { x: s.x + dx * 0.42, z: s.z + dz * 0.42 };
    let best = null;
    let bd = 260;
    for (const b of ctx.berrySpots()) {
      const d = Math.hypot(b.x - wake.x, b.z - wake.z);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) {
      const ox = s.x - best.x;
      const oz = s.z - best.z;
      const ol = Math.hypot(ox, oz) || 1;
      wake = { x: best.x + (ox / ol) * 10, z: best.z + (oz / ol) * 10 };
    }
    for (let i = 0; i < 30 && ctx.isWater(wake.x, wake.z); i++) wake.x += 6;
    // the nearest water to drink from (spiral outwards)
    let water = null;
    for (let r = 8; r < 700 && !water; r += 8) {
      for (let a = 0; a < 24; a++) {
        const x = wake.x + Math.cos((a / 24) * Math.PI * 2) * r;
        const z = wake.z + Math.sin((a / 24) * Math.PI * 2) * r;
        if (ctx.isWater(x, z)) {
          // stand on the bank, just short of the water
          const bx = wake.x + Math.cos((a / 24) * Math.PI * 2) * (r - 5);
          const bz = wake.z + Math.sin((a / 24) * Math.PI * 2) * (r - 5);
          water = { x: bx, z: bz };
          break;
        }
      }
    }
    p2.places = { dir, door, attack, wake, water };
    save();
  }

  // ---------- props: backpack, campfire, shelter, pawprints, map scrap ----------
  let packMesh = null;
  let fire = null; // { group, flames, light }
  let shelterMesh = null;
  let clueMesh = null;
  let prints = null;

  function placePack() {
    if (packMesh || p2.done.pack) return;
    const w = p2.places.wake;
    const x = w.x + p2.places.dir.x * 4.5 + 1.2;
    const z = w.z + p2.places.dir.z * 4.5;
    packMesh = new THREE.Group();
    const leather = new THREE.MeshStandardMaterial({ color: 0x8a5c36, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.26), leather);
    body.position.y = 0.15;
    body.rotation.z = 0.5; // tipped over in the grass
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.28), new THREE.MeshStandardMaterial({ color: 0x5f6a38, flatShading: true }));
    flap.position.set(0.08, 0.3, 0);
    flap.rotation.z = 0.5;
    const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2b0, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    spark.scale.setScalar(0.8);
    spark.position.y = 0.45;
    packMesh.add(body, flap, spark);
    packMesh.userData.spark = spark;
    packMesh.position.set(x, ctx.terrainHeight(x, z), z);
    ctx.outsideGroup.add(packMesh);
    p2.packAt = { x, z };
  }

  function buildFire(x, z) {
    const g = new THREE.Group();
    g.position.set(x, ctx.terrainHeight(x, z), z);
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8880, flatShading: true });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), stone);
      r.position.set(Math.cos(a) * 0.42, 0.07, Math.sin(a) * 0.42);
      g.add(r);
    }
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3e24, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.6, 5), wood);
      s.rotation.z = Math.PI / 2;
      s.rotation.y = (i / 4) * Math.PI;
      s.position.y = 0.06;
      g.add(s);
    }
    const flames = [];
    for (const [c, h, r] of [[0xff7a1a, 0.55, 0.16], [0xffc23a, 0.38, 0.11]]) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
      f.position.y = h / 2 + 0.05;
      g.add(f);
      flames.push(f);
    }
    const light = new THREE.PointLight(0xff9a40, 18, 14, 1.6);
    light.position.y = 0.8;
    g.add(light);
    ctx.outsideGroup.add(g);
    fire = { group: g, flames, light };
  }

  function buildShelter(x, z, face) {
    const g = new THREE.Group();
    g.position.set(x, ctx.terrainHeight(x, z), z);
    g.rotation.y = face; // the open side faces `face`
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, flatShading: true });
    // a ridge pole on two forked sticks, leaves leaning on it
    for (const sx of [-0.7, 0.7]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.0, 5), wood);
      post.position.set(sx, 0.5, 0.25);
      g.add(post);
    }
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 5), wood);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, 0.98, 0.25);
    g.add(ridge);
    const leafCols = [0xe8b830, 0x3a6030, 0xd89a28, 0x2e5024, 0xc8a030];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 6, 4).scale(1, 0.16, 0.75),
          new THREE.MeshStandardMaterial({ color: leafCols[(row + i) % leafCols.length], flatShading: true, side: THREE.DoubleSide })
        );
        // the roof slopes from the ridge down to the ground behind
        const t = row / 3;
        leaf.position.set(-0.68 + i * 0.34, 0.95 - t * 0.85, 0.2 - t * 0.85);
        leaf.rotation.x = -0.85;
        leaf.rotation.y = (i - 2) * 0.12;
        g.add(leaf);
      }
    }
    const bed = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, flatShading: true }));
    bed.position.set(0, 0.02, -0.15);
    g.add(bed);
    ctx.outsideGroup.add(g);
    shelterMesh = g;
  }

  function placeClue() {
    if (clueMesh || !p2.camp) return;
    const d = p2.places.dir;
    const x = p2.camp.x + d.x * 32 - d.z * 8;
    const z = p2.camp.z + d.z * 32 + d.x * 8;
    p2.clueAt = { x, z };
    clueMesh = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0xe8d8b0, side: THREE.DoubleSide }));
    paper.rotation.x = -Math.PI / 2 + 0.4;
    paper.position.y = 0.12;
    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x6b4a2c }));
    twig.rotation.z = 1.2;
    twig.position.y = 0.1;
    const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2b0, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    spark.scale.setScalar(0.8);
    spark.position.y = 0.4;
    clueMesh.add(paper, twig, spark);
    clueMesh.userData.spark = spark;
    clueMesh.position.set(x, ctx.terrainHeight(x, z), z);
    ctx.outsideGroup.add(clueMesh);
    // a clear line of mouse pawprints from camp to the scrap
    prints = makePawTrail(ctx.outsideGroup, p2.camp, { x, z }, ctx.terrainHeight);
  }

  // ---------- the opening: the expedition, the fox, waking alone ----------
  function start() {
    if (!p2.places) pickPlaces();
    const P = p2.places;
    if (ctx.world() !== "outside") ctx.goOutside();
    const team = members();
    const lead = npc("willow");
    const clover = npc("clover");
    const fox = ctx.fox();
    const d = P.dir;
    const side = { x: -d.z, z: d.x };
    const marchLen = Math.hypot(P.attack.x - P.door.x, P.attack.z - P.door.z);
    // formation: teachers up front, students two by two, Thistle at the back
    const slot = (i) => ({ back: Math.floor(i / 2) * 1.7, lat: (i % 2 ? 0.7 : -0.7) });
    const order = [npc("willow"), npc("tinker"), npc("fern"), ...team.filter((n) => n.role === "classmate")].filter(Boolean);
    let march = 0;
    const placeTeam = (k, dt = 0) => {
      march = k;
      const along = marchLen * k;
      order.forEach((n, i) => {
        const s = slot(i);
        const u = n.mesh.userData;
        u.sit = false;
        u.dy = 0;
        u.hx = P.door.x + d.x * (along - s.back) + side.x * s.lat;
        u.hz = P.door.z + d.z * (along - s.back) + side.z * s.lat;
        u.face = Math.atan2(d.x, d.z);
        u.lookAt = null;
        if (u.legL && dt) {
          const sw = Math.sin(performance.now() / 90 + i);
          u.legL.rotation.x = sw * 0.6;
          u.legR.rotation.x = -sw * 0.6;
          if (u.armL) {
            u.armL.rotation.x = -sw * 0.4;
            u.armR.rotation.x = sw * 0.4;
          }
        }
      });
      const s = slot(order.length + 1);
      const px = P.door.x + d.x * (along - s.back);
      const pz = P.door.z + d.z * (along - s.back);
      ctx.mouseRig.position.set(px, ctx.terrainHeight(px, pz), pz);
      ctx.mouseRig.rotation.y = Math.atan2(d.x, d.z);
      if (dt) ctx.walkPose(dt);
    };
    const center = () => {
      const along = marchLen * march - 4;
      const x = P.door.x + d.x * along;
      const z = P.door.z + d.z * along;
      return [x, ctx.terrainHeight(x, z) + 0.6, z];
    };
    const at = (fwd, lat, up) => () => {
      const [x, y, z] = center();
      return [x + d.x * fwd + side.x * lat, y + up, z + d.z * fwd + side.z * lat];
    };
    const headOf = (n) => () => (n ? npcHead(n) : center());
    let scatter = null;
    const shake = (amt) => {
      const c = ctx.camera.position;
      c.x += (Math.random() - 0.5) * amt;
      c.y += (Math.random() - 0.5) * amt;
    };
    return playCutscene([
      {
        dur: 2.2, black: true, text: "First light.",
        run: () => {
          ctx.setTime(0.27);
          for (const n of order) n.mesh.visible = true;
          if (fox) fox.visible = false;
          placeTeam(0);
        },
        from: at(-12, 9, 5), look: center,
      },
      { dur: 5.5, fadeIn: true, from: at(-14, 12, 6), to: at(-4, 10, 3), look: center, update: (k, dt) => placeTeam(0.0 + k * 0.3, dt),
        text: "The expedition set out at first light — teachers in front, students two by two." },
      { dur: 4, from: at(6, 2.2, 1.4), look: headOf(lead), update: (k, dt) => placeTeam(0.3 + k * 0.2, dt), who: "Teacher Willow",
        text: "Stay together, everyone. Moonstone Hollow is three days north — past the Great Falls." },
      { dur: 3.6, from: at(-1, -2.4, 1.2), look: headOf(clover), update: (k, dt) => placeTeam(0.5 + k * 0.15, dt), who: "Clover",
        text: "Do you think we'll see a real fox? From far away, I mean." },
      { dur: 3.2, from: at(9, 0.6, 0.35), look: center, update: (k, dt) => placeTeam(0.65 + k * 0.1, dt),
        text: "Then the grass went quiet." },
      {
        dur: 2.4, who: "Master Tinker", text: "FOX!! Everyone — SCATTER!",
        run: () => {
          if (!fox) return;
          const [x, , z] = center();
          fox.visible = true;
          fox.position.set(x + d.x * 8 + side.x * 10, 0, z + d.z * 8 + side.z * 10);
          fox.position.y = ctx.terrainHeight(fox.position.x, fox.position.z);
          tone(180, 0.5, "sawtooth", 0.12);
          tone(140, 0.7, "sawtooth", 0.1, 0.15);
        },
        from: at(-6, 5, 2.2), look: center,
        update: (k) => {
          if (fox) {
            const [x, , z] = center();
            const tx = x - side.x * 2;
            const tz = z - side.z * 2;
            fox.position.x += (tx - fox.position.x) * 0.08;
            fox.position.z += (tz - fox.position.z) * 0.08;
            fox.position.y = ctx.terrainHeight(fox.position.x, fox.position.z);
            fox.rotation.y = Math.atan2(tx - fox.position.x, tz - fox.position.z);
          }
          shake(0.15 * k);
        },
      },
      {
        dur: 3, fadeOut: true, text: "You ran. You ran until your legs gave out…",
        run: () => {
          // everyone bolts a different way
          scatter = order.map((n, i) => {
            const a = (i / order.length) * Math.PI * 2 + 0.4;
            return { n, x0: n.mesh.userData.hx, z0: n.mesh.userData.hz, ax: Math.cos(a), az: Math.sin(a) };
          });
        },
        from: at(-5, 1.5, 1.4), lookFrom: center, lookTo: at(25, 0, 0.5),
        update: (k, dt) => {
          for (const s of scatter || []) {
            s.n.mesh.userData.hx = s.x0 + s.ax * k * 30;
            s.n.mesh.userData.hz = s.z0 + s.az * k * 30;
            s.n.mesh.userData.face = Math.atan2(s.ax, s.az);
          }
          const p = ctx.mouseRig.position;
          p.x += d.x * 26 * dt;
          p.z += d.z * 26 * dt;
          p.y = ctx.terrainHeight(p.x, p.z);
          ctx.walkPose(dt);
          if (fox) {
            fox.position.x += (p.x - 3 * d.x - fox.position.x) * 0.05;
            fox.position.z += (p.z - 3 * d.z - fox.position.z) * 0.05;
            fox.position.y = ctx.terrainHeight(fox.position.x, fox.position.z);
          }
          shake(0.08);
        },
      },
      {
        dur: 2.4, black: true, text: "…",
        run: () => {
          for (const n of order) n.mesh.visible = false; // the expedition is gone
          ctx.resetFox();
          ctx.setTime(0.47);
          ctx.placePlayer(P.wake.x, P.wake.z, Math.atan2(d.x, d.z));
          placePack();
        },
        from: () => [P.wake.x + 2, ctx.terrainHeight(P.wake.x, P.wake.z) + 1.2, P.wake.z + 2],
        look: () => [P.wake.x, ctx.terrainHeight(P.wake.x, P.wake.z) + 0.3, P.wake.z],
      },
      {
        dur: 4, fadeIn: true, text: "You wake up alone.",
        from: () => [P.wake.x + 1.4, ctx.terrainHeight(P.wake.x, P.wake.z) + 0.9, P.wake.z + 1.6],
        to: () => [P.wake.x + 2.4, ctx.terrainHeight(P.wake.x, P.wake.z) + 1.6, P.wake.z + 2.6],
        look: () => [P.wake.x, ctx.terrainHeight(P.wake.x, P.wake.z) + 0.4, P.wake.z],
      },
      {
        dur: 3.2, who: "Thistle", text: "Hello…? Teacher Willow? Clover? …Anyone?",
        from: () => [P.wake.x + 2.4, ctx.terrainHeight(P.wake.x, P.wake.z) + 1.6, P.wake.z + 2.6],
        look: () => [P.wake.x, ctx.terrainHeight(P.wake.x, P.wake.z) + 0.5, P.wake.z],
      },
      {
        dur: 4.5, text: "The expedition is gone. Only the wind answers.",
        from: () => [P.wake.x + 2.4, ctx.terrainHeight(P.wake.x, P.wake.z) + 1.6, P.wake.z + 2.6],
        to: () => [P.wake.x + 10, ctx.terrainHeight(P.wake.x, P.wake.z) + 22, P.wake.z + 12],
        look: () => [P.wake.x, ctx.terrainHeight(P.wake.x, P.wake.z) + 0.5, P.wake.z],
        end: () => {
          p2.started = true;
          for (const n of order) n.mesh.visible = false;
          if (!p2.journal.length) write("The fox came out of the grass and everyone ran. I don't know where they went. I'm alone. Survive first — then find them.");
          save();
          redraw();
          ctx.snapCamera();
          ctx.say("🎒 Something is lying in the grass nearby…");
        },
      },
    ]);
  }

  // ---------- dusk: the fox comes ----------
  let foxRetry = 0;
  function duskFalls() {
    ctx.setTime(0.66);
    ctx.say("🌇 The sun is sinking… something is moving in the grass.", true);
    setTimeout(() => {
      if (!p2.done.fox) {
        ctx.foxHunt();
        ctx.say("🦊 The FOX! Get inside your shelter — quick!", true);
      }
    }, 4000);
  }

  // ---------- night + morning ----------
  function sleep() {
    const sh = p2.shelter;
    const y = ctx.terrainHeight(sh.x, sh.z);
    return playCutscene([
      { dur: 1.4, fadeOut: true, gameCam: true },
      { dur: 3, black: true, gameCam: true, text: "The fire crackles low. You curl up under the leaves…" },
      { dur: 3, black: true, gameCam: true, text: "…and dream of the school bell.",
        run: () => { ctx.setTime(0.27); ctx.heal(100); } },
      {
        dur: 4, fadeIn: true, text: "Morning.",
        from: [sh.x + 4, y + 2.5, sh.z + 4], to: [sh.x + 6, y + 4, sh.z + 6], look: [sh.x, y + 0.5, sh.z],
        end: () => {
          complete("sleep");
          write("I made it through the night. The fire kept me warm. This morning there are pawprints by the camp — small ones. A mouse's.");
          placeClue();
          ctx.say("🐾 Pawprints in the dirt… mouse-sized. Follow them!");
        },
      },
    ]);
  }

  function readClue() {
    const c = p2.clueAt;
    const y = ctx.terrainHeight(c.x, c.z);
    return playCutscene([
      { dur: 3, from: [c.x + 1.6, y + 1.4, c.z + 1.6], to: [c.x + 0.7, y + 0.9, c.z + 0.7], look: [c.x, y + 0.1, c.z],
        text: "A scrap of map, snagged on a twig." },
      { dur: 4, from: [c.x + 0.7, y + 0.9, c.z + 0.7], look: [c.x, y + 0.1, c.z],
        text: "Teacher Willow's handwriting: “…north, past the Great Falls… Moonstone Hollow… keep together—”" },
      { dur: 3.4, from: () => [me().x - 1.6, me().y + 1.0, me().z - 1.2], look: () => [me().x, me().y + 0.6, me().z], who: "Thistle",
        text: "They were here. They're alive — they have to be." },
      { dur: 3.5, from: [c.x + 8, y + 14, c.z + 8], to: [c.x + 4, y + 26, c.z + 4],
        lookFrom: [c.x, y, c.z], lookTo: [c.x + p2.places.dir.x * 200, y + 40, c.z + p2.places.dir.z * 200],
        who: "WhiskerWood", text: "Phase 2 · Alone — complete." },
      {
        dur: 0.6, gameCam: true,
        end: () => {
          complete("clue");
          write("A scrap of Teacher Willow's map! North, past the Great Falls, to Moonstone Hollow. They were here. I'm going to find them.");
          if (clueMesh) ctx.outsideGroup.remove(clueMesh);
          if (prints) ctx.outsideGroup.remove(prints);
          st.phase = 3;
          save();
          redraw();
          if (api.onDone) setTimeout(api.onDone, 600); // → Phase 3: The Search Begins
        },
      },
    ]);
  }

  // ---------- E: what's here to do? ----------
  function interactable() {
    if (st.phase < 2 || !p2.started || ctx.world() !== "outside") return null;
    const m = me();
    if (packMesh && dist2d(m, packMesh.position.x, packMesh.position.z) < 1.5) {
      return {
        label: "pick up your backpack",
        act: () => {
          ctx.outsideGroup.remove(packMesh);
          packMesh = null;
          ctx.bite();
          complete("pack", "🎒 Your backpack! Inside: your journal and a simple knife. (J opens the journal)");
          write("Found my backpack in the grass. Journal, knife. The lantern and the compass are still on my belt.");
        },
      };
    }
    if (clueMesh && p2.clueAt && dist2d(m, p2.clueAt.x, p2.clueAt.z) < 1.6) return { label: "pick up the scrap of paper", act: readClue };
    if (p2.shelter && dist2d(m, p2.shelter.x, p2.shelter.z) < 2.0 && p2.done.fox && !p2.done.sleep) {
      return { label: "sleep in your shelter", act: sleep };
    }
    if (p2.done.gather && !p2.done.fire && has(FIRE_COST)) {
      return {
        label: "build a campfire here",
        act: () => {
          spend(FIRE_COST);
          const f = { x: Math.sin(ctx.mouseRig.rotation.y), z: Math.cos(ctx.mouseRig.rotation.y) };
          p2.camp = { x: m.x + f.x * 1.6, z: m.z + f.z * 1.6 };
          buildFire(p2.camp.x, p2.camp.z);
          tone(300, 0.4, "triangle", 0.1);
          complete("fire", "🔥 A crackling campfire! Now a leaf shelter beside it.");
          write("Built my first campfire, all by myself. Master Tinker would be proud.");
        },
      };
    }
    if (p2.done.fire && !p2.done.shelter && has(SHELTER_COST)) {
      if (dist2d(m, p2.camp.x, p2.camp.z) < 12) {
        return {
          label: "build a leaf shelter here",
          act: () => {
            spend(SHELTER_COST);
            const f = { x: Math.sin(ctx.mouseRig.rotation.y), z: Math.cos(ctx.mouseRig.rotation.y) };
            const x = m.x + f.x * 2.2;
            const z = m.z + f.z * 2.2;
            // its open side faces the fire
            const face = Math.atan2(p2.camp.x - x, p2.camp.z - z);
            p2.shelter = { x, z, face };
            buildShelter(x, z, face);
            complete("shelter", "🍂 A snug leaf shelter. You can hide in it — and sleep in it.");
            write("A shelter of leaves and sticks. Small, but mine.");
            setTimeout(duskFalls, 2500);
          },
        };
      }
    }
    return null;
  }

  // ---------- hooks from the game ----------
  /** Thistle picked something up off the forest floor (any phase). */
  function onGather(bit) {
    if (st.phase !== 2 || !p2.started || !bit.gather) return false;
    const wasPine = pineDone();
    const wasAspen = aspenDone();
    p2.res[bit.gather] = (p2.res[bit.gather] || 0) + 1;
    if (bit.gather === "food") onEat();
    save();
    redraw();
    if (!p2.done.gather && Object.entries(NEED).every(([k, n]) => (p2.res[k] || 0) >= n)) {
      complete("gather", "🪵 Enough to build with! Press E to build a campfire.");
      return true;
    }
    if (wasPine !== pineDone() && !aspenDone()) {
      ctx.say("🌲 That's all you need from the pines! Follow the golden trail to the Aspen Forest for fallen leaves.", true);
      return true;
    }
    if (wasAspen !== aspenDone() && !pineDone()) {
      ctx.say("🍃 Plenty of leaves! Follow the golden trail to the Pine Forest for twigs and needles.", true);
      return true;
    }
    return false;
  }
  function onEat() {
    if (st.phase === 2 && p2.started && p2.done.pack && !p2.done.eat) complete("eat", "🍓 Food in your belly. One less worry.");
  }
  function onDrink() {
    if (st.phase === 2 && p2.started && p2.done.pack && !p2.done.drink) complete("drink", "💧 Cold, clear water. You feel braver already.");
  }
  function onFoxEscape() {
    if (st.phase === 2 && p2.done.shelter && !p2.done.fox) {
      complete("fox", "🦊 The fox sniffs… and slinks away. You're safe. Time to sleep — press E in your shelter.");
      write("The fox came at dusk. I hid under the leaves and held my breath. It went away. Foxes listen more than they look.");
      ctx.say("🌙 Night is falling. Sleep in your shelter (E).", true);
    }
  }
  function onFoxBite() {
    if (st.phase === 2 && p2.done.shelter && !p2.done.fox) {
      ctx.say("🦊 Ow! Next time — get inside your shelter before it reaches you!", true);
      clearTimeout(foxRetry);
      foxRetry = setTimeout(() => {
        if (!p2.done.fox) {
          ctx.foxHunt();
          ctx.say("🦊 It's back! Into the shelter!", true);
        }
      }, 15000);
    }
  }
  /** Is this spot hidden from predators? (inside your own shelter) */
  function hidden(x, z) {
    return !!(p2.shelter && Math.hypot(x - p2.shelter.x, z - p2.shelter.z) < 1.8);
  }

  // test hook: ?story=p2&p2at=sleep jumps straight to that step (camp built)
  const devAt = new URLSearchParams(location.search).get("p2at");
  function jumpTo(step) {
    if (ctx.world() !== "outside") ctx.goOutside();
    if (!p2.places) pickPlaces();
    const i = STEPS.findIndex(([k]) => k === step);
    STEPS.slice(0, Math.max(0, i)).forEach(([k]) => (p2.done[k] = true));
    p2.started = true;
    const { wake, dir } = p2.places;
    if (p2.done.fire) p2.camp = { x: wake.x + dir.x * 2, z: wake.z + dir.z * 2 };
    if (p2.done.shelter) {
      const x = wake.x - dir.z * 2.6;
      const z = wake.z + dir.x * 2.6;
      p2.shelter = { x, z, face: Math.atan2(p2.camp.x - x, p2.camp.z - z) };
    }
    if (!p2.done.gather) p2.res = {};
    else if (!p2.done.fire) p2.res = { twig: 4, tinder: 3, leaf: 5 };
    if (step === "clue" && p2.camp) {
      // stand just past the fire, looking along the pawprints
      ctx.placePlayer(p2.camp.x + dir.x * 1.2, p2.camp.z + dir.z * 1.2, Math.atan2(dir.x, dir.z));
    } else {
      ctx.placePlayer(wake.x - dir.x * 4, wake.z - dir.z * 4, Math.atan2(dir.x, dir.z));
    }
    save();
    redraw();
  }

  // ---------- each frame ----------
  let restored = false;
  function update(dt, t) {
    if (st.phase < 2 || !ctx.school()) return;
    if (!restored) {
      // rebuild the camp after a reload, and keep the expedition gone
      restored = true;
      if (devAt && ctx.quadMouse()) jumpTo(devAt);
      else if (devAt) { restored = false; return; }
      if (p2.started) for (const n of members()) n.mesh.visible = false;
      if (p2.started && p2.places && !p2.done.pack) placePack();
      if (p2.camp) buildFire(p2.camp.x, p2.camp.z);
      if (p2.shelter) buildShelter(p2.shelter.x, p2.shelter.z, p2.shelter.face);
      if (p2.done.sleep && !p2.done.clue) placeClue();
      if (p2.done.shelter && !p2.done.fox) setTimeout(duskFalls, 3000);
    }
    if (fire) {
      fire.flames.forEach((f, i) => {
        f.scale.set(1 + Math.sin(t * 13 + i) * 0.12, 1 + Math.sin(t * 9 + i * 2) * 0.2, 1 + Math.cos(t * 11 + i) * 0.12);
        f.rotation.y = t * (i ? -2 : 1.5);
      });
      fire.light.intensity = 16 + Math.sin(t * 17) * 2 + Math.sin(t * 7.3) * 1.5;
    }
    for (const o of [packMesh, clueMesh]) {
      if (o) o.userData.spark.material.opacity = 0.35 + Math.sin(t * 5) * 0.25;
    }
  }

  // ---------- the lesson list ----------
  function panelHTML() {
    const rows = [];
    for (const [k, label] of STEPS) {
      if (k !== "pack" && !p2.done.pack) break;
      let text = label;
      if (k === "gather" && !p2.done.gather) {
        const c = (r) => `${RES_ICON[r]} ${Math.min(NEED[r], p2.res[r] || 0)}/${NEED[r]}`;
        const pine = pineDone() ? "✔" : `${c("twig")} twigs &nbsp;${c("tinder")} needles`;
        const aspen = aspenDone() ? "✔" : `${c("leaf")} fallen leaves`;
        text += `<br><span class='res'>🌲 Pine Forest: ${pine}</span><br><span class='res'>🍃 Aspen Forest: ${aspen}</span>`;
      }
      if (k === "fire" && !p2.done.fire && p2.done.gather) text += " (E — anywhere)";
      if (k === "shelter" && !p2.done.shelter && p2.done.fire) text += " (E — near the fire)";
      if (k === "fox" && !p2.done.shelter) continue;
      if (k === "sleep" && !p2.done.fox) continue;
      if (k === "clue" && !p2.done.sleep) continue;
      rows.push(`<li class="${p2.done[k] ? "done" : ""}">${p2.done[k] ? "✔" : "○"} ${text}</li>`);
    }
    const kit = p2.done.pack ? "🎒 📓 🔪 🏮 🧭" : "🏮 🧭";
    return `<h3>🌲 Alone</h3><ul>${rows.join("")}</ul><div class="kit">Kit: ${kit}${p2.done.pack ? " · J = journal" : ""}</div>`;
  }

  const pineDone = () => (p2.res.twig || 0) >= NEED.twig && (p2.res.tinder || 0) >= NEED.tinder;
  const aspenDone = () => (p2.res.leaf || 0) >= NEED.leaf;
  // the nearest spot well inside a biome (searched outward in rings, cached
  // until you've moved a fair way — it's a lot of lookups)
  const forestCache = {};
  function nearestForest(biome) {
    const m = me();
    const c = forestCache[biome];
    if (c && Math.hypot(c.fromX - m.x, c.fromZ - m.z) < 30) return c.at;
    let at = null;
    for (let r = 20; r <= 1200 && !at; r += 20) {
      const n = Math.max(12, Math.round(r / 6));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = m.x + Math.cos(a) * r;
        const z = m.z + Math.sin(a) * r;
        // "well inside": the spot AND a little beyond it are both this biome
        const x2 = m.x + Math.cos(a) * (r + 25);
        const z2 = m.z + Math.sin(a) * (r + 25);
        if (ctx.biomeAt(x, z) === biome && ctx.biomeAt(x2, z2) === biome && !ctx.isWater(x, z)) {
          at = { x: x2, z: z2 };
          break;
        }
      }
    }
    forestCache[biome] = { fromX: m.x, fromZ: m.z, at };
    return at;
  }

  /** Where's the next thing to do? (for the minimap trail) */
  function goal() {
    if (st.phase !== 2 || !p2.started) return null;
    const m = me();
    const d = p2.done;
    if (!d.pack && packMesh) return { x: packMesh.position.x, z: packMesh.position.z };
    if (!d.drink && p2.places.water) return p2.places.water;
    if (!d.eat) {
      const food = ctx.litterNear(m.x, m.z, 60, "food");
      let best = food ? { x: food.x, z: food.z } : null;
      let bd = food ? Math.hypot(food.x - m.x, food.z - m.z) : Infinity;
      for (const b of ctx.berrySpots()) {
        const dd = Math.hypot(b.x - m.x, b.z - m.z);
        if (dd < bd) { bd = dd; best = b; }
      }
      return best;
    }
    if (!d.gather) {
      // twigs + needles come from the PINE forest, fallen leaves from the
      // ASPEN forest. Finish the forest you're standing in, then the trail
      // leads to the other one. In neither? Pine first.
      const here = ctx.biomeAt(m.x, m.z);
      let want;
      if (!pineDone() && !aspenDone()) want = here === "aspen" ? "aspen" : "pine";
      else want = pineDone() ? "aspen" : "pine";
      if (here === want) {
        const needs = want === "pine" ? ["twig", "tinder"].filter((r) => (p2.res[r] || 0) < NEED[r]) : ["leaf"];
        for (const r of needs) {
          const bit = ctx.litterNear(m.x, m.z, 60, r);
          if (bit) return { x: bit.x, z: bit.z };
        }
      }
      return nearestForest(want);
    }
    if (!d.fire || !d.shelter) return p2.camp || null;
    if (!d.fox || !d.sleep) return p2.shelter;
    if (!d.clue && p2.clueAt) return p2.clueAt;
    return null;
  }

  return {
    start,
    update,
    interactable,
    goal,
    panelHTML,
    onEat,
    onGather,
    onDrink,
    onFoxEscape,
    onFoxBite,
    hidden,
    get started() { return p2.started; },
    journal: () => p2.journal,
    hasJournal: () => !!p2.done.pack,
  };
}
