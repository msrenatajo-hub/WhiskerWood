// ------------------------------------------------------------
//  🖼️✨  LIVING PAINTINGS — hang a treasure on your wall and it becomes a
//  little painting that MOVES: a picture of the thing itself, in front of
//  a scene that suits it.
//    🐚 sea things    — fish swim round the coral, bubbles rise
//    ⭐ star things   — stars twinkle, a shooting star streaks past
//    ❄️ frosty things — snow drifts down (aurora things shimmer)
//    🏮 lights        — fireflies drift in the dusk
//    🌸 garden things — flowers sway, butterflies flutter
//    🔥 fiery things  — a sunset, embers rising (dragons fly past!)
//    everything else  — warm parchment with floating sparkles
// ------------------------------------------------------------
import * as THREE from "three";
import { itemPicture } from "./itemArt.js";

const SIZE = 256;
const THEMES = [
  ["sea", /coral|shell|conch|pearl|fish|\bsea\b|ocean|tide|lagoon|anchor|whale|wave|reef|turtle|net\b|lure|tackle|boat|sail|harbou?r/],
  ["night", /star|moon|night|comet|\bsky\b|dream|telescope|stargazer|spyglass|constellation|celest|owl/],
  ["snow", /snow|frost|\bice\b|icicle|winter|glacier|aurora|north|skate|sled|husk/],
  ["fire", /dragon|fire|ember|\bsun\b|sunstone|dawn|flame|torch|volcano|phoenix|scale/],
  ["lights", /lantern|lamp|candle|firefly|glow|light|wax/],
  ["garden", /flower|rose|lily|petal|garden|seed|leaf|bonsai|lavender|blossom|\bbee\b|butterfly|spring|harvest|pumpkin|clover|acorn|herb|straw|bonnet/],
];
const themeOf = (name) => {
  const n = (name || "").toLowerCase();
  for (const [k, re] of THEMES) if (re.test(n)) return k;
  return "warm";
};
const rand = (s) => {
  let x = Math.sin(s * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- each scene's moving parts
function drawScene(g, theme, t, name) {
  const W = SIZE;
  if (theme === "sea") {
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, "#5ac8e8");
    grd.addColorStop(1, "#0e4a7a");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    // sunbeams
    g.globalAlpha = 0.12;
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 4; i++) {
      const x = 30 + i * 60 + Math.sin(t * 0.4 + i) * 10;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 30, 0);
      g.lineTo(x - 20, W);
      g.lineTo(x - 60, W);
      g.fill();
    }
    g.globalAlpha = 1;
    // sand and coral
    g.fillStyle = "#e8d098";
    g.beginPath();
    g.ellipse(W / 2, W + 20, W * 0.75, 60, 0, 0, Math.PI * 2);
    g.fill();
    const coral = ["#ff6a8a", "#ffa04a", "#c87aff", "#ff5ab0"];
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 52;
      g.strokeStyle = coral[i % 4];
      g.lineWidth = 7;
      g.lineCap = "round";
      for (let b = 0; b < 3; b++) {
        g.beginPath();
        g.moveTo(x, W - 20);
        g.quadraticCurveTo(x + (b - 1) * 14 + Math.sin(t * 1.4 + i + b) * 4, W - 50, x + (b - 1) * 22 + Math.sin(t * 1.4 + i + b) * 6, W - 70 - b * 8);
        g.stroke();
      }
    }
    // little fish swimming round
    for (let i = 0; i < 5; i++) {
      const dir = i % 2 ? 1 : -1;
      const sp = 22 + rand(i) * 30;
      let x = ((t * sp * dir + rand(i + 9) * W * 2) % (W + 60)) - 30;
      if (dir < 0) x = W - x;
      const y = 40 + rand(i + 3) * 150 + Math.sin(t * 2 + i) * 8;
      const col = ["#ffd040", "#ff7a3a", "#5af0ff", "#ff8ad0", "#b8ff6a"][i];
      g.save();
      g.translate(x, y);
      g.scale(dir, 1);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
      g.fill();
      const wag = Math.sin(t * 12 + i) * 4;
      g.beginPath();
      g.moveTo(-11, 0);
      g.lineTo(-22, -7 + wag);
      g.lineTo(-22, 7 + wag);
      g.fill();
      g.fillStyle = "#101820";
      g.beginPath();
      g.arc(6, -2, 1.8, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    // bubbles
    g.strokeStyle = "rgba(255,255,255,.8)";
    g.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {
      const y = W - ((t * (20 + rand(i) * 20) + rand(i + 40) * W) % W);
      const x = rand(i + 20) * W + Math.sin(t * 2 + i) * 4;
      g.beginPath();
      g.arc(x, y, 2 + rand(i + 60) * 3, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (theme === "night") {
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, "#0a0e2a");
    grd.addColorStop(1, "#2a2a5a");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 60; i++) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + rand(i) * 2) + i));
      g.fillStyle = `rgba(255,255,240,${a})`;
      const r = rand(i + 7) < 0.15 ? 2.2 : 1.2;
      g.beginPath();
      g.arc(rand(i) * W, rand(i + 1) * W * 0.85, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#fff8e0";
    g.beginPath();
    g.arc(W * 0.8, W * 0.2, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#2a2a5a";
    g.beginPath();
    g.arc(W * 0.8 + 8, W * 0.2 - 4, 16, 0, Math.PI * 2);
    g.fill();
    // a shooting star every few seconds
    const k = (t % 6) / 6;
    if (k < 0.25) {
      const x = W * (0.1 + k * 3), y = W * (0.1 + k * 1.2);
      const gr = g.createLinearGradient(x - 50, y - 20, x, y);
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(1, "rgba(255,255,255,.95)");
      g.strokeStyle = gr;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(x - 50, y - 20);
      g.lineTo(x, y);
      g.stroke();
    }
  } else if (theme === "snow") {
    const aurora = /aurora|north/.test(name);
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, aurora ? "#10183a" : "#a8c8e8");
    grd.addColorStop(1, aurora ? "#28306a" : "#e8f4ff");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    if (aurora) {
      for (let b = 0; b < 3; b++) {
        g.strokeStyle = ["rgba(90,255,170,.45)", "rgba(140,120,255,.35)", "rgba(90,220,255,.35)"][b];
        g.lineWidth = 18;
        g.beginPath();
        for (let x = 0; x <= W; x += 16) g.lineTo(x, 60 + b * 22 + Math.sin(x * 0.03 + t * 0.8 + b) * 18);
        g.stroke();
      }
    }
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(W / 2, W + 30, W * 0.8, 70, 0, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 40; i++) {
      const y = (t * (14 + rand(i) * 18) + rand(i + 5) * W) % W;
      const x = rand(i + 11) * W + Math.sin(t + i) * 8;
      g.beginPath();
      g.arc(x, y, 1.2 + rand(i + 33) * 2.2, 0, Math.PI * 2);
      g.fill();
    }
  } else if (theme === "fire") {
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, "#3a1a4a");
    grd.addColorStop(0.55, "#e8603a");
    grd.addColorStop(1, "#ffc060");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    g.fillStyle = "rgba(255,230,140,.9)";
    g.beginPath();
    g.arc(W / 2, W * 0.78, 46, 0, Math.PI * 2);
    g.fill();
    // a dragon flies across now and then
    if (/dragon|scale|ember/.test(name)) {
      const x = ((t * 40) % (W + 120)) - 60;
      const y = 60 + Math.sin(t * 1.5) * 12;
      const flap = Math.sin(t * 8) * 10;
      g.fillStyle = "#2a1020";
      g.beginPath();
      g.ellipse(x, y, 22, 7, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(x - 4, y);
      g.lineTo(x - 18, y - 20 - flap);
      g.lineTo(x + 8, y - 2);
      g.fill();
      g.beginPath();
      g.moveTo(x + 18, y - 2);
      g.lineTo(x + 30, y - 8);
      g.lineTo(x + 20, y + 2);
      g.fill();
      g.beginPath();
      g.moveTo(x - 20, y);
      g.lineTo(x - 40, y + 6);
      g.lineTo(x - 20, y + 3);
      g.fill();
    }
    for (let i = 0; i < 18; i++) {
      const y = W - ((t * (24 + rand(i) * 26) + rand(i + 2) * W) % W);
      const x = rand(i + 5) * W + Math.sin(t * 3 + i) * 6;
      g.fillStyle = `rgba(255,${160 + rand(i) * 80},60,${0.4 + 0.5 * (y / W)})`;
      g.beginPath();
      g.arc(x, y, 1.5 + rand(i + 8) * 2, 0, Math.PI * 2);
      g.fill();
    }
  } else if (theme === "lights") {
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, "#1a1438");
    grd.addColorStop(1, "#3a2a4a");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#1a2a1a";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(i * 50 - 10, W);
      g.lineTo(i * 50 + 15, W - 70 - rand(i) * 40);
      g.lineTo(i * 50 + 40, W);
      g.fill();
    }
    for (let i = 0; i < 16; i++) {
      const x = rand(i) * W + Math.sin(t * 0.7 + i * 2) * 20;
      const y = rand(i + 3) * W * 0.8 + Math.cos(t * 0.9 + i) * 14;
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
      const gr = g.createRadialGradient(x, y, 0, x, y, 9);
      gr.addColorStop(0, `rgba(255,240,140,${a})`);
      gr.addColorStop(1, "rgba(255,240,140,0)");
      g.fillStyle = gr;
      g.fillRect(x - 9, y - 9, 18, 18);
    }
  } else if (theme === "garden") {
    const grd = g.createLinearGradient(0, 0, 0, W);
    grd.addColorStop(0, "#bfe8ff");
    grd.addColorStop(1, "#e8f8d8");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#6ac85a";
    g.beginPath();
    g.ellipse(W / 2, W + 10, W * 0.8, 70, 0, 0, Math.PI * 2);
    g.fill();
    const petals = ["#ff8ac0", "#ffd040", "#c89aff", "#ff6a6a", "#ffffff"];
    for (let i = 0; i < 9; i++) {
      const bx = 14 + i * 29;
      const sway = Math.sin(t * 1.6 + i) * 6;
      g.strokeStyle = "#3a8a3a";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(bx, W);
      g.quadraticCurveTo(bx + sway / 2, W - 30, bx + sway, W - 52 - (i % 3) * 10);
      g.stroke();
      g.fillStyle = petals[i % 5];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + t * 0.3;
        g.beginPath();
        g.arc(bx + sway + Math.cos(a) * 6, W - 52 - (i % 3) * 10 + Math.sin(a) * 6, 4.5, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (let i = 0; i < 3; i++) {
      const x = (rand(i) * W + t * 18 * (i % 2 ? 1 : -1) + W * 4) % W;
      const y = 50 + rand(i + 4) * 90 + Math.sin(t * 2 + i) * 16;
      const f = Math.abs(Math.sin(t * 14 + i));
      g.fillStyle = ["#ff9a3a", "#6ac8ff", "#ff6ab8"][i];
      g.beginPath();
      g.ellipse(x - 5 * f, y, 6 * f + 1, 8, -0.4, 0, Math.PI * 2);
      g.ellipse(x + 5 * f, y, 6 * f + 1, 8, 0.4, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    const grd = g.createRadialGradient(W / 2, W / 2, 20, W / 2, W / 2, W * 0.75);
    grd.addColorStop(0, "#fff4dc");
    grd.addColorStop(1, "#e0b880");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, W);
    for (let i = 0; i < 14; i++) {
      const y = W - ((t * (10 + rand(i) * 12) + rand(i + 1) * W) % W);
      const x = rand(i + 2) * W + Math.sin(t + i) * 6;
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i);
      g.fillStyle = `rgba(255,220,120,${a})`;
      g.beginPath();
      g.arc(x, y, 2, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// ---------------------------------------------------------------- the painting itself
const live = new Set();
export function livingPainting(name, icon) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const g = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const theme = themeOf(name);
  const img = new Image();
  let ready = false;
  img.onload = () => (ready = true);
  const url = itemPicture(name, icon);
  if (url) img.src = url;
  const P = {
    texture: tex,
    shown: () => true,
    draw(t) {
      drawScene(g, theme, t, (name || "").toLowerCase());
      if (ready) {
        // the treasure itself, front and centre, gently bobbing
        const s = SIZE * 0.52;
        const bob = Math.sin(t * 1.4) * 4;
        g.save();
        g.shadowColor = "rgba(0,0,0,.35)";
        g.shadowBlur = 10;
        g.shadowOffsetY = 4;
        g.drawImage(img, (SIZE - s) / 2, (SIZE - s) / 2 - 8 + bob, s, s);
        g.restore();
      }
      tex.needsUpdate = true;
    },
    dispose() {
      live.delete(P);
      tex.dispose();
    },
  };
  P.draw(0);
  live.add(P);
  return P;
}
// keep every painting that's on screen moving (about 15 times a second — plenty, and cheap)
setInterval(() => {
  const t = performance.now() / 1000;
  for (const P of live) if (P.shown()) P.draw(t);
}, 66);
