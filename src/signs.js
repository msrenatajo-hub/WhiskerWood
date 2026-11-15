// ------------------------------------------------------------
//  🪧  READABLE SIGNS — one place that draws every sign in the world.
//
//  • crisp: a big high-resolution canvas, text auto-sized to fill the board
//    (long text wraps onto two or three lines instead of shrinking to dots)
//  • high contrast: a dark board with a light frame and bright, outlined
//    letters — lit the same by day, dusk or night (it ignores the lighting)
//  • readable from BOTH sides: two faces back to back, so the back never
//    shows mirror-writing
// ------------------------------------------------------------
import * as THREE from "three";

const STYLES = {
  wood: { bg: "#2e2014", frame: "#c8a060", ink: "#fff2cc" },
  stone: { bg: "#2a2c34", frame: "#b8bcc8", ink: "#ffffff" },
  ice: { bg: "#123048", frame: "#bfe8ff", ink: "#ffffff" },
  gold: { bg: "#3a2408", frame: "#ffd060", ink: "#ffe890" },
  leaf: { bg: "#183018", frame: "#a8d878", ink: "#f4ffe0" },
  night: { bg: "#141428", frame: "#a8a8ff", ink: "#f0f0ff" },
};

const cache = new Map();
// Draw `text` onto a canvas texture. Lines split on "\n"; long lines wrap.
export function signTexture(text, style = "wood", aspect = 4) {
  const S = typeof style === "string" ? STYLES[style] || STYLES.wood : { ...STYLES.wood, ...style };
  const key = text + "|" + JSON.stringify(S) + "|" + aspect;
  if (cache.has(key)) return cache.get(key);
  const W = 1024, H = Math.round(W / aspect);
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d");
  // board + frame
  const pad = Math.max(10, H * 0.07);
  c.fillStyle = S.frame;
  c.fillRect(0, 0, W, H);
  c.fillStyle = S.bg;
  c.fillRect(pad, pad, W - pad * 2, H - pad * 2);
  // fit the text: the biggest size where every (wrapped) line fits
  const font = (px) => `900 ${px}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif`;
  const maxW = W - pad * 2 - W * 0.05, maxH = H - pad * 2 - H * 0.08;
  const wrap = (px, maxLines) => {
    c.font = font(px);
    const out = [];
    for (const para of String(text).split("\n")) {
      const words = para.split(" ");
      let line = "";
      for (const w of words) {
        const tryL = line ? line + " " + w : w;
        if (c.measureText(tryL).width <= maxW || !line) line = tryL;
        else {
          out.push(line);
          line = w;
        }
      }
      out.push(line);
    }
    return out.length <= maxLines && out.every((l) => c.measureText(l).width <= maxW) ? out : null;
  };
  let px = Math.floor(maxH * 0.86), lines = null;
  for (; px > 14; px -= 2) {
    const n = Math.max(1, Math.floor(maxH / (px * 1.12)));
    lines = wrap(px, Math.min(3, n));
    if (lines) break;
  }
  lines ||= [String(text)];
  c.font = font(px);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  const lh = px * 1.12;
  const y0 = H / 2 - ((lines.length - 1) * lh) / 2 + px * 0.04;
  lines.forEach((l, i) => {
    c.lineWidth = Math.max(4, px * 0.16);
    c.strokeStyle = "rgba(0,0,0,0.85)";
    c.strokeText(l, W / 2, y0 + i * lh);
    c.fillStyle = S.ink;
    c.fillText(l, W / 2, y0 + i * lh);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  cache.set(key, tex);
  return tex;
}

// A flat board (w × h world units) that reads right from the front AND back.
export function signBoard(text, { w = 3, h = 0.9, style = "wood" } = {}) {
  const tex = signTexture(text, style, w / h);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false });
  const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  front.position.z = 0.03;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  back.rotation.y = Math.PI;
  back.position.z = -0.03;
  const core = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0x3a2814, flatShading: true }));
  g.add(core, front, back);
  g.userData.sign = text;
  g.userData.aspect = w / h;
  return g;
}

// Change the words on a signBoard (e.g. FOR SALE → Thistle's Farm).
export function setSignText(board, text, style = "wood") {
  const face = board.children[1];
  face.material.map = signTexture(text, style, board.userData.aspect || 4);
  face.material.needsUpdate = true;
  board.userData.sign = text;
}

// A sign on a post: the board's bottom edge at `height`.
export function signPost(text, { w = 3, h = 0.9, height = 1.9, style = "wood", post = 0x5a3e24 } = {}) {
  const g = new THREE.Group();
  const board = signBoard(text, { w, h, style });
  board.position.y = height + h / 2;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, height + h * 0.6, 6), new THREE.MeshStandardMaterial({ color: post, flatShading: true }));
  pole.position.y = (height + h * 0.6) / 2;
  g.add(pole, board);
  return g;
}
