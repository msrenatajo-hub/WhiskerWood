import * as THREE from "three";

/**
 * Procedural, code-drawn materials — no texture files, in the spirit of the
 * reference project. Everything is generated once and shared.
 */

function makeCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
}

/** Warm vertical wood planks with grain streaks and the odd knot. */
function woodCanvas(base: string, dark: string, light: string): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  // grain streaks
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 256;
    ctx.strokeStyle = Math.random() > 0.5 ? dark : light;
    ctx.globalAlpha = 0.04 + Math.random() * 0.08;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (Math.random() - 0.5) * 8, 85, x + (Math.random() - 0.5) * 8, 170, x, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // plank seams (dark vertical lines)
  const planks = 4;
  ctx.strokeStyle = dark;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  for (let i = 1; i < planks; i++) {
    const x = (256 / planks) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // a couple of knots
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 3 + Math.random() * 5;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, dark);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return canvas;
}

/** Speckled stone / plaster. */
function stoneCanvas(base: string): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const a = Math.random() * 0.14;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  return canvas;
}

// Cached textures
let _woodTex: THREE.CanvasTexture | undefined;
let _darkWoodTex: THREE.CanvasTexture | undefined;
let _stoneTex: THREE.CanvasTexture | undefined;

function woodTex(): THREE.CanvasTexture {
  return (_woodTex ??= toTexture(woodCanvas("#6b482b", "#3d2716", "#8a6238")));
}
function darkWoodTex(): THREE.CanvasTexture {
  return (_darkWoodTex ??= toTexture(woodCanvas("#3f2a19", "#20140b", "#5a3d24")));
}
function stoneTex(): THREE.CanvasTexture {
  return (_stoneTex ??= toTexture(stoneCanvas("#6d6154"), 1));
}

/** Material library. Each getter returns a shared, reusable material. */
export const Materials = {
  wood(repeat = 1): THREE.MeshStandardMaterial {
    const t = woodTex().clone();
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, metalness: 0.02 });
  },
  darkWood(repeat = 1): THREE.MeshStandardMaterial {
    const t = darkWoodTex().clone();
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, metalness: 0.02 });
  },
  stone(repeat = 2): THREE.MeshStandardMaterial {
    const t = stoneTex().clone();
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  },
  /** Emissive material for lantern glass / crystal / fire glow. */
  emissive(color: number, intensity = 1.6): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0,
    });
  },
  brass(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x9c7a33, roughness: 0.4, metalness: 0.8 });
  },
  /** Flat colored material (book spines get vertex colors instead). */
  flat(color: number, roughness = 0.7): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  },
};

/** A warm palette of book-spine colors used to fill the shelves. */
export const SPINE_COLORS = [
  0x8a3b3b, 0x7a5230, 0x3d5a45, 0x35506e, 0x6b4a72, 0x9a6a2f, 0x4a6a5a, 0x86402f,
  0xa9763f, 0x5c6b8a, 0x77502f, 0x3f5f4a,
];
