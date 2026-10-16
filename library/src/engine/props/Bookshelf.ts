import * as THREE from "three";
import type { ShelfDef } from "@/types/category";
import { Materials, SPINE_COLORS } from "../materials";

/** A built bookshelf with hooks for hover/search glow. */
export interface ShelfHandle {
  group: THREE.Group;
  shelfId: string;
  setHover(on: boolean): void;
  setGlow(on: boolean): void;
}

const SHELF = { w: 5, h: 9, d: 1.6, rows: 5 };

/** Carved parchment plaque with the shelf's in-world name. */
function makePlaque(title: string): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ead9b2";
  ctx.fillRect(0, 0, 512, 140);
  ctx.strokeStyle = "#916a38";
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, 496, 124);
  ctx.fillStyle = "#3a2c1e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 34px Georgia, serif";

  // wrap to at most two lines
  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > 456 && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  const two = lines.slice(0, 2);
  const startY = 70 - (two.length - 1) * 20;
  two.forEach((l, i) => ctx.fillText(l, 256, startY + i * 40, 456));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.04),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
  );
  return mesh;
}

/**
 * Builds one bookshelf: a carved wooden case packed with instanced book spines,
 * a glowing accent bar (that brightens on hover / when a search matches it), and
 * a title plaque. Origin is at the base center; the front faces +Z. The library
 * places and rotates the whole group against a wall.
 */
export function createBookshelf(shelf: ShelfDef): ShelfHandle {
  const group = new THREE.Group();
  const { w, h, d, rows } = SHELF;
  const caseMat = Materials.darkWood(1.5);

  const panel = (sx: number, sy: number, sz: number, x: number, y: number, z: number): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), caseMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };

  // Case: back, two sides, top, bottom
  panel(w, h, 0.2, 0, h / 2, -d / 2 + 0.1);
  panel(0.25, h, d, -w / 2 + 0.12, h / 2, 0);
  panel(0.25, h, d, w / 2 - 0.12, h / 2, 0);
  panel(w, 0.25, d, 0, h - 0.12, 0);
  panel(w, 0.3, d, 0, 0.15, 0);

  // Horizontal shelf boards + rows of instanced books between them.
  const rowGap = (h - 0.8) / rows;
  const usableW = w - 0.7;
  const matrices: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let r = 0; r < rows; r++) {
    const boardY = 0.4 + r * rowGap;
    panel(w, 0.15, d, 0, boardY, 0);

    // Fill this row with spines from the left.
    let x = -usableW / 2;
    const bookY = boardY + 0.08;
    const rowSeed = r * 13.7;
    while (x < usableW / 2 - 0.15) {
      const thick = 0.14 + Math.random() * 0.22;
      if (x + thick > usableW / 2) break;
      const bh = rowGap * (0.62 + Math.random() * 0.28);
      const bd = d * (0.66 + Math.random() * 0.12);
      const lean = Math.random() < 0.08 ? (Math.random() - 0.5) * 0.35 : 0;
      pos.set(x + thick / 2, bookY + bh / 2, d / 2 - bd / 2 - 0.12);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), lean);
      scl.set(thick, bh, bd);
      m4.compose(pos, q, scl);
      matrices.push(m4.clone());
      const base = SPINE_COLORS[Math.floor(Math.abs(Math.sin(rowSeed + x * 3.3)) * SPINE_COLORS.length) % SPINE_COLORS.length];
      colors.push(new THREE.Color(base));
      x += thick + 0.02 + Math.random() * 0.03;
    }
  }

  const books = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    Materials.flat(0xffffff, 0.72),
    matrices.length
  );
  books.castShadow = true;
  books.receiveShadow = true;
  for (let i = 0; i < matrices.length; i++) {
    books.setMatrixAt(i, matrices[i]);
    books.setColorAt(i, colors[i]);
  }
  books.instanceMatrix.needsUpdate = true;
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  group.add(books);

  // Glowing accent bar along the top front (hover/search feedback).
  const accentMat = Materials.emissive(shelf.color, 0.35);
  const accent = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.18, 0.1), accentMat);
  accent.position.set(0, h - 0.4, d / 2 + 0.02);
  group.add(accent);

  // Title plaque
  const plaque = makePlaque(shelf.title);
  plaque.position.set(0, 1.7, d / 2 + 0.06);
  group.add(plaque);

  let hover = false;
  let glow = false;
  const refresh = (): void => {
    accentMat.emissiveIntensity = 0.35 + (hover ? 1.7 : 0) + (glow ? 2.0 : 0);
  };

  return {
    group,
    shelfId: shelf.id,
    setHover(on) {
      hover = on;
      refresh();
    },
    setGlow(on) {
      glow = on;
      refresh();
    },
  };
}
