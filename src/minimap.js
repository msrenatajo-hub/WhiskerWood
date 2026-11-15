// ============================================================
//  WhiskerWood — THE MAP 🗺️
//  A storybook-style painted map: mossy green ground, golden dashed
//  trails, bronze medallions with parchment name banners, the winding
//  blue creek. Shown two ways:
//    • a round minimap in the corner that follows the mouse
//    • press M for the full map of the whole wilderness
//  Everything is painted onto one big canvas ONCE, then cropped.
// ============================================================

import { terrainHeight, WORLD_RADIUS } from "./outside.js";

const BASE = 3072; // resolution of the painted world map
const MINI_VIEW = 430; // world units visible across the minimap
const MINI_SIZE = 150; // CSS pixels of the round minimap

// The map frames the PLACES (not the whole empty wilderness) — these are set
// from the landmark bounds in initMinimap, before anything is painted.
let MAP_CX = 0;
let MAP_CZ = 0;
let MAP_SPAN = WORLD_RADIUS * 2;

// world → base-canvas pixels
const wx2m = (x) => ((x - MAP_CX) / MAP_SPAN + 0.5) * BASE;
const wz2m = (z) => ((z - MAP_CZ) / MAP_SPAN + 0.5) * BASE;

// A tiny deterministic hash for scatter painting.
function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Emoji glyph for each landmark kind (the medallion faces).
const GLYPHS = {
  school: "🎓",
  aspen: "🌳",
  pine: "🌲",
  creek: "🌊",
  well: "💧",
  meadow: "🌼",
  tallgrass: "🌾",
  log: "🪵",
  berry: "🍇",
  wildflower: "🌸",
  home: "🏠",
};

// ------------------------------------------------------------
//  Painting the base map (runs once)
// ------------------------------------------------------------
function paintBase(landmarks) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = BASE;
  const ctx = canvas.getContext("2d");

  // --- mossy ground, shaded by the real terrain ---
  const CELLS = 150;
  const step = BASE / CELLS;
  for (let i = 0; i < CELLS; i++) {
    for (let j = 0; j < CELLS; j++) {
      const x = MAP_CX + (i / CELLS - 0.5) * MAP_SPAN;
      const z = MAP_CZ + (j / CELLS - 0.5) * MAP_SPAN;
      const h = Math.min(1, Math.max(0, terrainHeight(x, z) / 24));
      // valleys deep mossy green -> hills lighter, yellower
      const r = 34 + h * 44;
      const g = 62 + h * 52;
      const b = 24 + h * 18;
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(i * step, j * step, step + 1, step + 1);
    }
  }
  // leafy mosaic dabs (the hand-painted texture of the reference)
  for (let i = 0; i < 42000; i++) {
    const x = hash(i, 1.7) * BASE;
    const y = hash(i, 9.2) * BASE;
    const s = 2 + hash(i, 3.3) * 6;
    const tone = hash(i, 5.1);
    ctx.fillStyle =
      tone < 0.45
        ? `rgba(24, 44, 16, ${0.12 + tone * 0.2})`
        : tone < 0.85
          ? `rgba(88, 122, 48, ${0.08 + (tone - 0.45) * 0.25})`
          : `rgba(190, 200, 110, ${0.05 + (tone - 0.85) * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * 0.7, hash(i, 7.7) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const find = (kind) => landmarks.filter((l) => l.kind === kind);
  const one = (kind) => find(kind)[0];

  // --- the creek: same winding math as the 3D ribbon ---
  const creek = one("creek");
  if (creek) {
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      pts.push([
        creek.x + (t - 0.5) * 760,
        creek.z + Math.sin(t * Math.PI * 4.4) * 42 + Math.sin(t * Math.PI * 1.7 + 1.3) * 26,
      ]);
    }
    const stroke = (w, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach(([x, z], i) => (i ? ctx.lineTo(wx2m(x), wz2m(z)) : ctx.moveTo(wx2m(x), wz2m(z))));
      ctx.stroke();
    };
    const w = (30 / MAP_SPAN) * BASE;
    stroke(w * 1.25, "#1e3f52");
    stroke(w, "#2f6b8a");
    stroke(w * 0.55, "#4a9ec0");
    stroke(w * 0.2, "#8fd0e8");
  }

  // --- golden dashed trails between the places (storybook style) ---
  const home = { x: 0, z: 0 };
  const berries = find("berry");
  const berrySE = berries.find((b) => b.x > 0);
  const berrySW = berries.find((b) => b.x <= 0);
  const legs = [
    [home, one("meadow")],
    [one("meadow"), one("creek")],
    [one("meadow"), one("well")],
    [one("well"), one("tallgrass")],
    [home, one("log")],
    [one("log"), one("pine")],
    [one("pine"), one("aspen")],
    [home, one("wildflower")],
    [one("wildflower"), berrySE],
    [home, berrySW],
  ].filter(([a, b]) => a && b);

  ctx.save();
  ctx.setLineDash([(10 / MAP_SPAN) * BASE, (8 / MAP_SPAN) * BASE]);
  ctx.lineCap = "round";
  for (const [a, b] of legs) {
    // gentle bow so the trails feel walked, not ruler-drawn
    const mx = (a.x + b.x) / 2 + (b.z - a.z) * 0.08;
    const mz = (a.z + b.z) / 2 - (b.x - a.x) * 0.08;
    for (const [w, c] of [
      [(5.5 / MAP_SPAN) * BASE, "rgba(60, 40, 10, 0.55)"],
      [(3.2 / MAP_SPAN) * BASE, "#c89b4a"],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(wx2m(a.x), wz2m(a.z));
      ctx.quadraticCurveTo(wx2m(mx), wz2m(mz), wx2m(b.x), wz2m(b.z));
      ctx.stroke();
    }
  }
  ctx.restore();

  // --- illustrated forests / flowers / grass around their landmarks ---
  const pine = one("pine");
  if (pine) {
    for (let i = 0; i < 16; i++) {
      const x = wx2m(pine.x + (hash(i, 2.2) - 0.5) * 320);
      const y = wz2m(pine.z + (hash(i, 4.9) - 0.5) * 320);
      const s = 14 + hash(i, 6.1) * 16;
      ctx.fillStyle = "#163012";
      for (const [dy, k] of [[0, 1], [-s * 0.45, 0.75], [-s * 0.85, 0.5]]) {
        ctx.beginPath();
        ctx.moveTo(x, y + dy - s * k);
        ctx.lineTo(x - s * 0.6 * k, y + dy);
        ctx.lineTo(x + s * 0.6 * k, y + dy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  const aspen = one("aspen");
  if (aspen) {
    for (let i = 0; i < 14; i++) {
      const x = wx2m(aspen.x + (hash(i, 8.4) - 0.5) * 300);
      const y = wz2m(aspen.z + (hash(i, 1.9) - 0.5) * 300);
      const s = 10 + hash(i, 3.7) * 12;
      ctx.strokeStyle = "#e8e2d0";
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      ctx.moveTo(x, y + s);
      ctx.lineTo(x, y - s * 0.3);
      ctx.stroke();
      ctx.fillStyle = i % 3 ? "#c9a63a" : "#d9bc55";
      ctx.beginPath();
      ctx.ellipse(x, y - s * 0.75, s * 0.75, s * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const wf = one("wildflower");
  if (wf) {
    const petals = ["#c98bd6", "#e8a8c8", "#f0e6b0", "#9a7ad0", "#e8c85a"];
    for (let i = 0; i < 34; i++) {
      const x = wx2m(wf.x + (hash(i, 5.5) - 0.5) * 360);
      const y = wz2m(wf.z + (hash(i, 7.1) - 0.5) * 300);
      const s = 3 + hash(i, 2.8) * 4;
      ctx.fillStyle = petals[i % petals.length];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f6df7a";
      ctx.beginPath();
      ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tg = one("tallgrass");
  if (tg) {
    ctx.strokeStyle = "#9aa04a";
    ctx.lineCap = "round";
    for (let i = 0; i < 60; i++) {
      const x = wx2m(tg.x + (hash(i, 9.9) - 0.5) * 300);
      const y = wz2m(tg.z + (hash(i, 4.2) - 0.5) * 300);
      const s = 6 + hash(i, 6.6) * 9;
      ctx.lineWidth = 1.6;
      for (const dx of [-s * 0.35, 0, s * 0.35]) {
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.5);
        ctx.quadraticCurveTo(x + dx, y - s * 0.2, x + dx * 1.6, y - s * 0.7);
        ctx.stroke();
      }
    }
  }

  // vignette so the edges fall into shadow like the reference
  const vg = ctx.createRadialGradient(BASE / 2, BASE / 2, BASE * 0.35, BASE / 2, BASE / 2, BASE * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(8, 12, 4, 0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, BASE, BASE);

  return canvas;
}

// ------------------------------------------------------------
//  Medallions, banners, the YOU marker (drawn in screen space)
// ------------------------------------------------------------
function drawMedallion(ctx, x, y, r, glyph) {
  const ring = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  ring.addColorStop(0, "#e0b45c");
  ring.addColorStop(0.5, "#8a5a22");
  ring.addColorStop(1, "#d9a441");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1408";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${Math.round(r * 1.05)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, x, y + r * 0.06);
}

function drawBanner(ctx, x, y, text, scale = 1) {
  ctx.font = `bold ${Math.round(11 * scale)}px Georgia, serif`;
  const w = ctx.measureText(text).width + 14 * scale;
  const h = 16 * scale;
  ctx.fillStyle = "#e2cd96";
  ctx.strokeStyle = "#5a3d16";
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y, w, h, 3 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2a1d0a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + h / 2 + 0.5);
}

// ⭐ the way to your next task: a dotted golden trail ending in a star
function drawTrail(ctx, x0, y0, x1, y1, dpr, t) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.setLineDash([3.5 * dpr, 5 * dpr]);
  ctx.lineDashOffset = -t * 14 * dpr; // the dots march toward the goal
  ctx.strokeStyle = "rgba(40, 24, 8, 0.75)";
  ctx.lineWidth = 5 * dpr;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = "#ffd84a";
  ctx.lineWidth = 2.6 * dpr;
  ctx.stroke();
  ctx.setLineDash([]);
  // the star
  const r = (7 + Math.sin(t * 4) * 1.2) * dpr;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x1 + Math.cos(a) * rr, y1 + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffd84a";
  ctx.strokeStyle = "#5a3a10";
  ctx.lineWidth = 1.5 * dpr;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 📌 a map marker the player dropped
function drawPin(ctx, x, y, dpr, glow = false) {
  ctx.save();
  if (glow) {
    ctx.fillStyle = "rgba(255, 216, 74, 0.35)";
    ctx.beginPath();
    ctx.arc(x, y - 9 * dpr, 11 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d8402e";
  ctx.strokeStyle = "#3a1408";
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 5 * dpr, y - 9 * dpr);
  ctx.arc(x, y - 11 * dpr, 6 * dpr, Math.PI * 0.8, Math.PI * 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(x, y - 11 * dpr, 2.3 * dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawYou(ctx, x, y, r, headingAngle) {
  // heading wedge behind the medallion
  ctx.fillStyle = "#f0c766";
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(headingAngle) * (r + 9), y + Math.sin(headingAngle) * (r + 9));
  ctx.lineTo(x + Math.cos(headingAngle + 2.5) * (r + 1), y + Math.sin(headingAngle + 2.5) * (r + 1));
  ctx.lineTo(x + Math.cos(headingAngle - 2.5) * (r + 1), y + Math.sin(headingAngle - 2.5) * (r + 1));
  ctx.closePath();
  ctx.fill();
  drawMedallion(ctx, x, y, r, "🐭");
}

// ------------------------------------------------------------
//  The widget: round corner minimap + fullscreen map on M
// ------------------------------------------------------------
/**
 * entries: the world's landmarks. onTeleport(x, z): Shift-click on the big
 * map. opts.onMark(marker) / opts.onUnmark(marker): a marker was dropped /
 * removed by clicking the big map.
 */
export function initMinimap(entries, onTeleport, opts = {}) {
  // 📌 the player's own markers — saved in this browser
  let markers = [];
  try {
    markers = JSON.parse(localStorage.getItem("ww.markers") || "[]");
  } catch {}
  const saveMarkers = () => {
    try {
      localStorage.setItem("ww.markers", JSON.stringify(markers));
    } catch {}
  };
  const landmarks = entries.filter((e) => e.kind);
  // frame the map around the actual places (plus HOME), not the empty edges
  const xs = [...landmarks.map((l) => l.x), 0];
  const zs = [...landmarks.map((l) => l.z), 0];
  MAP_CX = (Math.min(...xs) + Math.max(...xs)) / 2;
  MAP_CZ = (Math.min(...zs) + Math.max(...zs)) / 2;
  MAP_SPAN = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) + 420;
  const base = paintBase(landmarks);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // --- corner minimap ---
  const wrap = document.createElement("div");
  wrap.id = "minimap";
  const mini = document.createElement("canvas");
  mini.width = mini.height = MINI_SIZE * dpr;
  wrap.appendChild(mini);
  const tag = document.createElement("div");
  tag.id = "minimap-tag";
  tag.textContent = "M — map";
  wrap.appendChild(tag);
  document.body.appendChild(wrap);
  const mctx = mini.getContext("2d");

  // --- fullscreen map ---
  const big = document.createElement("div");
  big.id = "bigmap";
  const bigCanvas = document.createElement("canvas");
  big.appendChild(bigCanvas);
  document.body.appendChild(big);
  const bctx = bigCanvas.getContext("2d");
  let bigOpen = false;

  // the travel hint under the big map
  const hint = document.createElement("div");
  hint.innerHTML = "📌 click to drop a marker (a golden trail leads there) · click a marker to remove it · Esc to close";
  hint.style.cssText =
    "margin-top:10px;text-align:center;color:#f0e0b0;font:600 15px Georgia,serif;text-shadow:0 1px 3px #000;";
  big.appendChild(hint);
  bigCanvas.style.cursor = "crosshair";

  window.addEventListener("keydown", (e) => {
    if ((e.code === "KeyM" || e.code === "Slash") && wrap.style.display !== "none") {
      bigOpen = e.code === "Slash" ? true : !bigOpen; // / always OPENS
      // ✨ from Phase 9 on, Shift-click on the map teleports you
      hint.innerHTML = "📌 click to drop a marker (a golden trail leads there) · click a marker to remove it" +
        (!opts.canTeleport || opts.canTeleport() ? " · <b>⇧ Shift-click to TELEPORT there</b>" : "") + " · Esc to close";
      big.classList.toggle("open", bigOpen);
    } else if (e.code === "Escape" && bigOpen) {
      bigOpen = false;
      big.classList.remove("open");
    }
  });

  // click the map → drop a 📌 marker (or remove the one you clicked).
  // Shift-click whisks you straight there (once opts.canTeleport() — Phase 9).
  bigCanvas.addEventListener("click", (e) => {
    if (!bigOpen) return;
    const r = bigCanvas.getBoundingClientRect();
    const mapPx = ((e.clientX - r.left) / r.width) * BASE;
    const mapPz = ((e.clientY - r.top) / r.height) * BASE;
    // invert wx2m / wz2m: map pixel -> world coordinate
    const x = (mapPx / BASE - 0.5) * MAP_SPAN + MAP_CX;
    const z = (mapPz / BASE - 0.5) * MAP_SPAN + MAP_CZ;
    if (e.shiftKey && onTeleport && (!opts.canTeleport || opts.canTeleport())) {
      bigOpen = false;
      big.classList.remove("open");
      onTeleport(x, z);
      return;
    }
    // near an existing marker (in screen pixels)? remove it
    const pxPerWorld = r.width / MAP_SPAN;
    const hit = markers.findIndex((m) => Math.hypot(m.x - x, m.z - z) * pxPerWorld < 16);
    if (hit >= 0) {
      const [gone] = markers.splice(hit, 1);
      saveMarkers();
      if (opts.onUnmark) opts.onUnmark(gone);
    } else {
      const m = { x, z, id: Date.now() };
      markers.push(m);
      saveMarkers();
      if (opts.onMark) opts.onMark(m);
    }
  });

  function drawMini(pos, ry, goal) {
    const S = MINI_SIZE * dpr;
    // zoom in when the next goal is close, so its trail is easy to see
    let view = MINI_VIEW;
    if (goal) view = Math.max(28, Math.min(MINI_VIEW, Math.hypot(goal.x - pos.x, goal.z - pos.z) * 3));
    const srcSize = (view / MAP_SPAN) * BASE;
    const cx = wx2m(pos.x);
    const cy = wz2m(pos.z);
    mctx.clearRect(0, 0, S, S);
    mctx.drawImage(base, cx - srcSize / 2, cy - srcSize / 2, srcSize, srcSize, 0, 0, S, S);

    // landmark medallions that fall inside the view
    for (const lm of landmarks) {
      const sx = ((lm.x - pos.x) / view) * S + S / 2;
      const sy = ((lm.z - pos.z) / view) * S + S / 2;
      const d = Math.hypot(sx - S / 2, sy - S / 2);
      if (d < S * 0.45) drawMedallion(mctx, sx, sy, 9 * dpr, GLYPHS[lm.kind] || "❔");
    }
    // home
    const hx = ((0 - pos.x) / view) * S + S / 2;
    const hy = ((0 - pos.z) / view) * S + S / 2;
    if (Math.hypot(hx - S / 2, hy - S / 2) < S * 0.45) drawMedallion(mctx, hx, hy, 9 * dpr, "🏠");

    // your markers, if they're in view
    for (const m of markers) {
      const sx = ((m.x - pos.x) / view) * S + S / 2;
      const sy = ((m.z - pos.z) / view) * S + S / 2;
      if (Math.hypot(sx - S / 2, sy - S / 2) < S * 0.45) drawPin(mctx, sx, sy, dpr * 0.8);
    }
    // the trail to the next task (pinned to the rim if it's off the map)
    if (goal) {
      let gx = ((goal.x - pos.x) / view) * S;
      let gy = ((goal.z - pos.z) / view) * S;
      const gd = Math.hypot(gx, gy);
      const lim = S * 0.42;
      if (gd > lim) {
        gx *= lim / gd;
        gy *= lim / gd;
      }
      drawTrail(mctx, S / 2, S / 2, S / 2 + gx, S / 2 + gy, dpr, performance.now() / 1000);
    }
    // the mouse, always center. Heading: the rig faces (sin ry, cos ry) in
    // world (x,z), and the map is x-right / z-down, so the canvas angle is:
    drawYou(mctx, S / 2, S / 2, 10 * dpr, Math.atan2(Math.cos(ry), Math.sin(ry)));
    // N compass
    mctx.font = `bold ${11 * dpr}px Georgia, serif`;
    mctx.fillStyle = "#f0e0b0";
    mctx.textAlign = "center";
    mctx.fillText("N", S / 2, 13 * dpr);
  }

  function drawBig(pos, ry, goal) {
    const vw = Math.min(window.innerWidth, window.innerHeight) * 0.92;
    const S = vw * dpr;
    if (bigCanvas.width !== S) {
      bigCanvas.width = bigCanvas.height = S;
      bigCanvas.style.width = bigCanvas.style.height = vw + "px";
    }
    bctx.clearRect(0, 0, S, S);
    bctx.drawImage(base, 0, 0, S, S);
    const toS = (v) => (v / BASE) * S;
    for (const lm of landmarks) {
      const x = toS(wx2m(lm.x));
      const y = toS(wz2m(lm.z));
      drawMedallion(bctx, x, y, 15 * dpr, GLYPHS[lm.kind] || "❔");
      drawBanner(bctx, x, y + 19 * dpr, (lm.name || lm.kind).toUpperCase(), dpr);
    }
    const hx = toS(wx2m(0));
    const hy = toS(wz2m(0));
    drawMedallion(bctx, hx, hy, 15 * dpr, "🏠");
    drawBanner(bctx, hx, hy + 19 * dpr, "HOME", dpr);
    if (goal) {
      drawTrail(bctx, toS(wx2m(pos.x)), toS(wz2m(pos.z)), toS(wx2m(goal.x)), toS(wz2m(goal.z)), dpr, performance.now() / 1000);
    }
    for (const m of markers) {
      const isGoal = goal && Math.hypot(goal.x - m.x, goal.z - m.z) < 1;
      drawPin(bctx, toS(wx2m(m.x)), toS(wz2m(m.z)), dpr * 1.3, isGoal);
    }
    drawYou(bctx, toS(wx2m(pos.x)), toS(wz2m(pos.z)), 13 * dpr, Math.atan2(Math.cos(ry), Math.sin(ry)));
  }

  return {
    get markers() {
      return markers;
    },
    isBigOpen: () => bigOpen,
    /** goal = { x, z } of the next task (or null) — drawn as a dotted trail */
    update(world, pos, ry, goal = null) {
      const outside = world === "outside";
      wrap.style.display = outside ? "" : "none";
      if (!outside) {
        if (bigOpen) {
          bigOpen = false;
          big.classList.remove("open");
        }
        return;
      }
      drawMini(pos, ry, goal);
      if (bigOpen) drawBig(pos, ry, goal);
    },
  };
}
