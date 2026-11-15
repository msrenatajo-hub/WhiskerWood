// ------------------------------------------------------------
//  🏆  THE TROPHY ROOM
//
//  A golden arch on the wall of your cottage leads into a grand hall,
//  and every treasure you've ever won stands on its own glowing pedestal
//  — story keepsakes, quest rewards, medals, cups, everything. Walk up to
//  one (E) to hear what it is and what it does. New treasures appear the
//  next time you go in.
// ------------------------------------------------------------
import * as THREE from "three";
import { ownedList } from "./cityLife.js";
import { TROPHY } from "./questZones.js";
import { glowTexture } from "./phase2.js";

const DOOR_ANGLE = -Math.PI / 2; // (round the cottage wall, away from the front door)

export function initTrophies(ctx) {
  // ctx: { world(), city(), goCity, placePlayer, goInside, denGroup, denRadius, mouseRig, say }
  const me = () => ctx.mouseRig.position;
  const near = (x, z, r) => Math.hypot(me().x - x, me().z - z) < r;
  const doorAt = { x: Math.sin(DOOR_ANGLE) * (ctx.denRadius - 0.05), z: Math.cos(DOOR_ANGLE) * (ctx.denRadius - 0.05) };

  // the golden arch in your cottage
  {
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8c050, metalness: 0.4, roughness: 0.4, flatShading: true });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 8, 18, Math.PI), gold);
    arch.position.y = 1.1;
    const dark = new THREE.Mesh(new THREE.CircleGeometry(0.72, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    dark.position.y = 1.1;
    const low = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 1.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    low.position.y = 0.55;
    for (const sx of [-0.75, 0.75]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2), gold);
      post.position.set(sx, 0.55, 0);
      g.add(post);
    }
    const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe08a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    star.scale.setScalar(0.9);
    star.position.y = 2.05;
    g.add(arch, dark, low, star, label("🏆 Trophy Room", 0.32, "#ffe8a0", "rgba(60,30,10,.75)"));
    g.children[g.children.length - 1].position.y = 2.45;
    g.position.set(doorAt.x, 0, doorAt.z);
    g.rotation.y = DOOR_ANGLE + Math.PI; // (facing into the room)
    ctx.denGroup.add(g);
  }

  // ---------------------------------------------------------------- little picture labels
  function label(text, h, color = "#4a2a1a", bg = "rgba(255,248,230,.92)") {
    // (drawn big + heavy at high resolution so it stays crisp and readable)
    const cv = document.createElement("canvas");
    const g = cv.getContext("2d");
    const font = '900 104px "Trebuchet MS", "Segoe UI", Verdana, sans-serif';
    g.font = font;
    const w = Math.min(2048, Math.ceil(g.measureText(text).width) + 96);
    cv.width = w;
    cv.height = 160;
    g.font = font;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, w - 8, 152, 44);
    g.fill();
    g.fillStyle = color;
    g.textBaseline = "middle";
    g.textAlign = "center";
    g.fillText(text, w / 2, 84, w - 48);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.set((h * w) / 160, h, 1);
    return sp;
  }
  function icon(emoji) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    g.font = "100px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(emoji, 64, 72);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    sp.scale.setScalar(1.3);
    return sp;
  }

  // ---------------------------------------------------------------- the pedestals
  let stands = [];
  function fillHall() {
    const Z = ctx.city();
    if (!Z || !Z.shelf) return;
    while (Z.shelf.children.length) Z.shelf.remove(Z.shelf.children[0]);
    stands = [];
    const items = ownedList();
    const T = TROPHY;
    const stone = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, flatShading: true });
    const goldM = new THREE.MeshStandardMaterial({ color: 0xe8c050, metalness: 0.4, roughness: 0.4, flatShading: true });
    // rows of pedestals down both sides of the carpet, starting at the door
    const perRow = Math.max(1, Math.floor((T.l - 10) / 3.4));
    items.forEach((text, i) => {
      const side = i % 2 ? 1 : -1;
      const n = Math.floor(i / 2);
      const row = Math.floor(n / perRow);
      const z = T.l / 2 - 7 - (n % perRow) * 3.4; // (from the entrance, down the hall)
      const x = side * (4.2 + row * 3.4);
      if (Math.abs(x) > T.w - 3.5) return; // (the hall is full! — what a collector)
      const m = text.match(/^(\S+)\s+(.*)$/);
      const em = m ? m[1] : "✨";
      const name = (m ? m[2] : text).replace(/\s*\(✨.*\)\s*$/, "");
      const g = new THREE.Group();
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.1, 10), stone);
      ped.position.y = 0.55;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), goldM);
      rim.position.y = 1.12;
      const ic = icon(em);
      ic.position.y = 1.9;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe0a0, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2);
      halo.position.y = 1.9;
      const lb = label(name.length > 34 ? name.slice(0, 33) + "…" : name, 0.28);
      lb.position.y = 2.85;
      g.add(ped, rim, halo, ic, lb);
      g.position.set(x, 0, z);
      Z.shelf.add(g);
      Z.colliders.push({ x, z, r: 0.8, trophy: true });
      stands.push({ x, z, text, ic, i });
    });
    Z.colliders = Z.colliders.filter((c) => !c.trophy || stands.some((s) => s.x === c.x && s.z === c.z));
    Z.spin = (t) => stands.forEach((s) => (s.ic.position.y = 1.9 + Math.sin(t * 1.5 + s.i) * 0.08));
    return items.length;
  }

  // ---------------------------------------------------------------- E
  function interactable() {
    const w = ctx.world();
    if (w === "den" && near(doorAt.x, doorAt.z, 1.6)) return { label: "step through the golden arch into your Trophy Room 🏆", act: () => {
      ctx.goCity("trophies");
      ctx.placePlayer(TROPHY.door.x, TROPHY.door.z - 3, Math.PI);
      const n = fillHall();
      filledFor = ctx.city();
      ctx.say(n ? `🏆 Your Trophy Room — ${n} treasure${n === 1 ? "" : "s"} from all your adventures! Walk up to any one (E) to remember it.` : "🏆 Your Trophy Room… all empty for now! Every keepsake you win will stand here on its own pedestal.", true);
    } };
    if (w !== "city" || !ctx.city() || ctx.city().id !== "trophies") return null;
    if (near(TROPHY.door.x, TROPHY.door.z, 2.6)) return { label: "go back into your cottage 🏡", act: () => {
      ctx.goInside();
      const inset = ctx.denRadius - 1.6;
      ctx.placePlayer(Math.sin(DOOR_ANGLE) * inset, Math.cos(DOOR_ANGLE) * inset, DOOR_ANGLE + Math.PI);
    } };
    const s = stands.find((x) => near(x.x, x.z, 1.6));
    if (s) return { label: `look at ${s.text.replace(/\s*\(✨.*\)\s*$/, "")}`, act: () => ctx.say(`🏆 ${s.text}`, true) };
    return null;
  }

  // (arrived some other way? fill the pedestals anyway)
  let filledFor = null;
  function update() {
    const Z = ctx.world() === "city" && ctx.city() && ctx.city().id === "trophies" ? ctx.city() : null;
    if (!Z) {
      filledFor = null;
      return;
    }
    if (filledFor !== Z) {
      filledFor = Z;
      fillHall();
    }
  }

  return { interactable, update };
}
