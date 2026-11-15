import * as THREE from "three";
import { Materials } from "../materials";

export interface MapTableHandle {
  group: THREE.Group;
}

/**
 * The world-map table: a great carved table with a hand-drawn parchment map of
 * the Great Forest laid across it (the real places from WhiskerWood's world).
 * Clicking it opens the Atlas. Replaces the old floating search crystal.
 */

// The known places, in the same normalized map coordinates the game uses.
const PLACES: [name: string, nx: number, ny: number][] = [
  ["Aspen Forest", 0.21, 0.15],
  ["Crossable Creek", 0.5, 0.08],
  ["Old Well", 0.68, 0.34],
  ["Human House", 0.88, 0.15],
  ["Pine Forest", 0.14, 0.38],
  ["Meadow", 0.52, 0.44],
  ["Tall Grass", 0.87, 0.38],
  ["Fallen Log", 0.15, 0.61],
  ["Berry Bush", 0.85, 0.62],
  ["Wildflower Patch", 0.75, 0.79],
  ["Berry Bush", 0.15, 0.82],
];
const HOME: [number, number] = [0.444, 0.678];

function drawMap(): HTMLCanvasElement {
  const W = 1024;
  const H = 680;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Parchment
  ctx.fillStyle = "#e9d8ac";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(120,90,55,${0.02 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // Double border
  ctx.strokeStyle = "#7a5230";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Title
  ctx.fillStyle = "#4a3520";
  ctx.textAlign = "center";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText("The Great Forest of EVERBOUGH", W / 2, 72);

  const px = (nx: number): number => 60 + nx * (W - 120);
  const py = (ny: number): number => 100 + ny * (H - 170);

  // Dashed trails from Home to a few landmarks
  ctx.setLineDash([9, 8]);
  ctx.strokeStyle = "rgba(138,98,56,0.55)";
  ctx.lineWidth = 3;
  for (const [, nx, ny] of PLACES.filter((p) => ["Pine Forest", "Meadow", "Aspen Forest"].includes(p[0]))) {
    ctx.beginPath();
    ctx.moveTo(px(HOME[0]), py(HOME[1]));
    ctx.quadraticCurveTo(px((HOME[0] + nx) / 2) + 30, py((HOME[1] + ny) / 2) - 30, px(nx), py(ny));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // The creek: a blue ribbon along the top
  ctx.strokeStyle = "#4a86b0";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(70, py(0.1));
  ctx.bezierCurveTo(W * 0.3, py(0.02), W * 0.6, py(0.14), W - 70, py(0.06));
  ctx.stroke();

  // Places
  ctx.textAlign = "center";
  for (const [name, nx, ny] of PLACES) {
    const x = px(nx);
    const y = py(ny);
    if (/forest/i.test(name)) {
      // a little grove of tree blobs
      for (const [dx, dy] of [[0, 0], [-22, 12], [22, 14], [-10, -14], [14, -10]]) {
        ctx.fillStyle = /pine/i.test(name) ? "rgba(47,90,50,0.75)" : "rgba(150,150,55,0.75)";
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (/house/i.test(name)) {
      ctx.fillStyle = "#8a5b3a";
      ctx.fillRect(x - 14, y - 10, 28, 20);
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 10);
      ctx.lineTo(x, y - 28);
      ctx.lineTo(x + 18, y - 10);
      ctx.closePath();
      ctx.fill();
    } else if (/well/i.test(name)) {
      ctx.strokeStyle = "#5a4632";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#8a4a2f";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#3a2c1e";
    ctx.font = "italic 23px Georgia, serif";
    ctx.fillText(name, x, y + 38);
  }

  // Everbough — the great tree at the heart of the map
  const ex = px(0.5);
  const ey = py(0.52);
  ctx.fillStyle = "#5a3d26";
  ctx.fillRect(ex - 7, ey - 6, 14, 34);
  for (const [dx, dy, r] of [[0, -26, 26], [-24, -12, 18], [24, -12, 18], [0, -6, 16]]) {
    ctx.fillStyle = "rgba(58,102,54,0.85)";
    ctx.beginPath();
    ctx.arc(ex + dx, ey + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#33261a";
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText("EVERBOUGH", ex, ey + 62);

  // Home den
  const hx = px(HOME[0]);
  const hy = py(HOME[1]);
  ctx.fillStyle = "#6b4a2c";
  ctx.beginPath();
  ctx.arc(hx, hy, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#3a2c1e";
  ctx.font = "italic 23px Georgia, serif";
  ctx.fillText("Home", hx, hy + 32);

  // Compass rose
  const cx = W - 92;
  const cy = H - 96;
  ctx.strokeStyle = "#5a4632";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 22);
  ctx.lineTo(cx, cy - 22);
  ctx.moveTo(cx - 8, cy - 10);
  ctx.lineTo(cx, cy - 22);
  ctx.lineTo(cx + 8, cy - 10);
  ctx.stroke();
  ctx.font = "bold 22px Georgia, serif";
  ctx.fillText("N", cx, cy - 36);

  return canvas;
}

export function createMapTable(): MapTableHandle {
  const group = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.24, 3.6), Materials.wood(2));
  top.position.y = 2.0;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legMat = Materials.darkWood(1);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.0, 0.26), legMat);
      leg.position.set(sx * 2.35, 1.0, sz * 1.45);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  const tex = new THREE.CanvasTexture(drawMap());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mapMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.9,
    // softly self-lit so the map stays readable in the candlelight
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.38,
  });

  // The map stands on the table as a framed display, leaning gently back, so
  // the whole world is visible the moment you walk into the hall.
  const board = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.95, 2.62, 0.12), Materials.darkWood(1));
  frame.position.y = 1.31;
  frame.castShadow = true;
  board.add(frame);
  const map = new THREE.Mesh(new THREE.PlaneGeometry(3.65, 2.36), mapMat);
  map.position.set(0, 1.31, 0.08);
  board.add(map);
  board.position.set(0, 2.1, -0.5);
  board.rotation.x = -0.28; // lean back like an easel
  group.add(board);

  return { group };
}
