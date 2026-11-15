// ------------------------------------------------------------
//  🏠  little BUILDINGS for the game's activities — instead of signposts.
//
//  smallBuilding({ label, wall, roof, style }) → a THREE.Group with its
//  doorway facing +z (local), a painted name-board over the door, lit
//  windows, and a roof in one of a few styles:
//    "peak"    — a pitched roof (a house)
//    "checker" — a black-and-white checkered roof (races!)
//    "tower"   — a tall round tower with a pointed cap and a flag
//    "barn"    — a big red barn, OPEN at the front (animals inside)
// ------------------------------------------------------------
import * as THREE from "three";
import { signTexture } from "./signs.js";

const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...e });

function nameBoard(text, w) {
  // 🪧 crisp, high-res, unlit painted letters (see signs.js)
  const h = w * 0.24;
  const tex = signTexture(text, { bg: "#4a2e18", frame: "#e8c070", ink: "#ffe8b0" }, w / h);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}
function checkerTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    g.fillStyle = (i + j) % 2 ? "#151515" : "#f4f4f4";
    g.fillRect(i * 8, j * 8, 8, 8);
  }
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  return t;
}

export function smallBuilding({ label = "", wall = 0xe8d4b0, roof = 0x8a3a3a, style = "peak", w = 4.4, d = 3.8, h = 2.8 } = {}) {
  const g = new THREE.Group();
  const timber = M(0x6a4428);
  if (style === "round") {
    // the game's own round cottage (like the village homes and houses for sale)
    const r = w / 2;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.15, h, 12), M(wall));
    body.position.y = h / 2;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, h * 0.8, 12), M(roof));
    cap.position.y = h + h * 0.4;
    const door = new THREE.Mesh(new THREE.CircleGeometry(r * 0.32, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    door.position.set(0, r * 0.32, r + 0.1);
    const win = new THREE.Mesh(new THREE.CircleGeometry(r * 0.15, 10), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
    win.position.set(r * 0.5, h * 0.62, r * 0.87);
    win.rotation.y = 0.5;
    const board = nameBoard(label, Math.min(w * 0.8, 3.6));
    board.position.set(0, r * 0.64 + 0.55, r + 0.16);
    g.add(body, cap, door, win, board);
    return g;
  }
  if (style === "barn") {
    // a big barn: three walls and a roof — open at the front so you can see in
    const W = w, D = d, Hh = h;
    const red = M(roof);
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 0.3), red);
    back.position.set(0, Hh / 2, -D / 2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, Hh, D), red);
    left.position.set(-W / 2, Hh / 2, 0);
    const right = left.clone();
    right.position.x = W / 2;
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(W / 2 + 0.9, 0.25, D + 0.8), M(0x5a3a2a));
    roofL.position.set(-W / 4, Hh + W / 8, 0);
    roofL.rotation.z = 0.5;
    const roofR = roofL.clone();
    roofR.position.x = W / 4;
    roofR.rotation.z = -0.5;
    // the gable end over the open front, with the name on it
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo(W / 2, 0);
    shape.lineTo(0, W / 4 + 0.3);
    shape.lineTo(-W / 2, 0);
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: roof, side: THREE.DoubleSide, flatShading: true }));
    gable.position.set(0, Hh, D / 2);
    const backGable = gable.clone();
    backGable.position.z = -D / 2;
    // white trim, like a real barn
    for (const x of [-W / 2, W / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, Hh, 0.35), M(0xf4f0e8));
      post.position.set(x, Hh / 2, D / 2);
      g.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.35, 0.3, 0.35), M(0xf4f0e8));
    beam.position.set(0, Hh, D / 2);
    const hay = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1), M(0xe8c860));
    hay.position.set(-W / 2 + 1.2, 0.45, -D / 2 + 0.8);
    const hay2 = hay.clone();
    hay2.position.set(W / 2 - 1.1, 0.45, -D / 2 + 0.8);
    const straw = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, D - 0.4), M(0xe0c070));
    straw.rotation.x = -Math.PI / 2;
    straw.position.y = 0.03;
    const board = nameBoard(label, Math.min(W * 0.7, 4));
    board.position.set(0, Hh + 0.75, D / 2 + 0.05);
    g.add(back, left, right, roofL, roofR, gable, backGable, beam, hay, hay2, straw, board);
    return g;
  }
  // walls, with timber corners
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(wall));
  body.position.y = h / 2;
  g.add(body);
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.22), timber);
    post.position.set(x, h / 2, z);
    g.add(post);
  }
  // the doorway and two lit windows
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  door.position.set(0, 0.9, d / 2 + 0.02);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.12), timber);
  frame.position.set(0, 1.85, d / 2 + 0.04);
  g.add(door, frame);
  for (const sx of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    win.position.set(sx * (w / 2 - 0.85), 1.5, d / 2 + 0.02);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.14), timber);
    sill.position.set(sx * (w / 2 - 0.85), 1.18, d / 2 + 0.06);
    g.add(win, sill);
  }
  // the name board over the door
  const board = nameBoard(label, Math.min(w * 0.85, 4));
  board.position.set(0, h + 0.05, d / 2 + 0.06);
  g.add(board);
  // the roof
  if (style === "tower") {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.36, h * 2.2, 10), M(wall));
    tower.position.set(0, h + h * 1.1, -d * 0.1);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.42, 1.8, 10), new THREE.MeshStandardMaterial({ map: checkerTex(), flatShading: true }));
    cap.position.set(0, h + h * 2.2 + 0.9, -d * 0.1);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), M(0xe8e8e8));
    pole.position.set(0, h + h * 2.2 + 2.4, -d * 0.1);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75, 6, 1), new THREE.MeshBasicMaterial({ map: checkerTex(), side: THREE.DoubleSide }));
    flag.position.set(0.6, h + h * 2.2 + 2.85, -d * 0.1);
    g.add(tower, cap, pole, flag);
    g.userData.flag = flag;
    const flat = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), M(roof));
    flat.position.y = h + 0.15;
    g.add(flat);
  } else {
    const roofMat = style === "checker" ? new THREE.MeshStandardMaterial({ map: checkerTex(), flatShading: true }) : M(roof);
    const r = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.4, 1.8, 4), roofMat);
    r.rotation.y = Math.PI / 4;
    r.scale.set(1, 1, d / w);
    r.position.y = h + 0.9;
    g.add(r);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), M(0x8a6a5a));
    chimney.position.set(w * 0.25, h + 1.3, -d * 0.15);
    g.add(chimney);
  }
  return g;
}
