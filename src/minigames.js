// ------------------------------------------------------------
//  🎮  MINI-GAMES — little games that open over the world, each with its
//  own goal, a way to lose, and a "play again". Phase 40 (The Last Letter)
//  uses one in every place a letter blew to; afterwards Hootsworth the
//  post-owl lets you play any of them again.
//
//    playMinigame(kind, { onWin, onLose }) → opens it (Esc quits = a loss)
//
//    📮 sort    — POST SORT: send each letter to the bag of its stamp (keys 1–4)
//    🍃 catch   — LEAF CATCH: catch falling letters in your basket, dodge pinecones
//    🍾 bob     — BOTTLE BOB: hook the bobbing bottle when the marker's in the green
//    🌾 hay     — HAYSTACK HUNT: grab the letter when it pops out of a haystack (1–6)
//    🧊 memory  — ICE MEMORY: match pairs of frozen pictures in few moves
//    🔐 cipher  — CIPHER WHEEL: turn the Moonkeepers' code wheel until each line reads
// ------------------------------------------------------------

export const MINIGAMES = {
  sort: { icon: "📮", name: "Post Sort", how: "A letter drops in — press the number of the bag with the SAME stamp colour (1–4). Sort 15. Three mistakes and the bags burst!" },
  catch: { icon: "🍃", name: "Leaf Catch", how: "Move your basket with the MOUSE (or A/D). Catch 8 falling letters — but not the pinecones (3 bonks and you're out)!" },
  bob: { icon: "🍾", name: "Bottle Bob", how: "Press SPACE when the marker is in the GREEN. Hook the bottle 5 times — it gets harder each time. Miss 3 and it drifts away." },
  hay: { icon: "🌾", name: "Haystack Hunt", how: "A letter pops out of a haystack — press its number (1–6) or click it, FAST. Grab 10 in 35 seconds. Don't grab the chickens!" },
  memory: { icon: "🧊", name: "Ice Memory", how: "Click two ice tiles to see what's frozen inside. Match all 8 pairs in 16 moves or fewer." },
  cipher: { icon: "🔐", name: "Cipher Wheel", how: "Each line is written in the Moonkeepers' code. ↑/↓ pick a line, ←/→ turn its wheel until it reads as real words. Then press ENTER." },
};

const W = 680, H = 440;
let root = null, cv = null, g = null, info = null, cur = null, raf = 0;

function ensure() {
  if (root) return;
  const st = document.createElement("style");
  st.textContent = `
    #ww-mini { position: fixed; inset: 0; z-index: 70; display: none; align-items: center; justify-content: center; background: rgba(8,6,14,.62); }
    #ww-mini.open { display: flex; }
    #ww-mini .box { width: min(${W + 28}px, 96vw); padding: 12px 14px 10px; border-radius: 18px; background: #f1e4c4; color: #3a2614;
      font: 15px/1.35 Georgia, serif; box-shadow: 0 16px 60px rgba(0,0,0,.6); }
    #ww-mini h3 { margin: 0 0 2px; text-align: center; font-size: 22px; color: #5a3a12; }
    #ww-mini .how { text-align: center; font: 13px system-ui; color: #6a4a2a; margin-bottom: 8px; }
    #ww-mini canvas { display: block; width: 100%; max-width: ${W}px; margin: 0 auto; border-radius: 12px; background: #2a1e14; cursor: pointer; }
    #ww-mini .bar { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font: bold 13px system-ui; color: #6a4a2a; }
    #ww-mini button { border: 0; border-radius: 9px; padding: 6px 14px; background: #5a3a12; color: #ffe6a8; font: bold 13px system-ui; cursor: pointer; }`;
  document.head.appendChild(st);
  root = document.createElement("div");
  root.id = "ww-mini";
  root.innerHTML = `<div class="box"><h3></h3><div class="how"></div><canvas width="${W}" height="${H}"></canvas>
    <div class="bar"><span class="info"></span><span><button class="again" style="display:none">↻ Play again</button> <button class="quit">✕ Quit (Esc)</button></span></div></div>`;
  document.body.appendChild(root);
  cv = root.querySelector("canvas");
  g = cv.getContext("2d");
  info = root.querySelector(".info");
  root.querySelector(".quit").onclick = () => end(false, true);
  root.querySelector(".again").onclick = () => cur && start(cur.kind, cur.opts);
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  cv.addEventListener("mousemove", (e) => cur && !cur.over && cur.move && cur.move(pos(e)));
  cv.addEventListener("click", (e) => cur && !cur.over && cur.click && cur.click(pos(e)));
}

// the games own the keyboard while they're open (the world behind them doesn't see the keys).
// (added the moment this module loads, so it runs BEFORE every other key handler in the game)
window.addEventListener("keydown", (e) => {
  if (!cur) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (e.repeat) return;
  if (e.code === "Escape") return end(false, true);
  if (cur.over) {
    if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") cur.won ? end(true) : start(cur.kind, cur.opts);
    return;
  }
  cur.key && cur.key(e.code);
}, true);
window.addEventListener("keyup", (e) => {
  if (!cur) return;
  e.stopImmediatePropagation();
  cur.keyUp && cur.keyUp(e.code);
}, true);

export const minigameOpen = () => !!cur;
// (test hook: win or check the game that is open)
window.__wwMini = { play: (k) => playMinigame(k), G: () => cur && cur.G, kind: () => cur && cur.kind, win: () => cur && !cur.over && finish(true, "(test)"), over: () => cur && cur.over };

/** Open a mini-game. onWin() after a win (when you close it); onLose() if you quit. */
export function playMinigame(kind, opts = {}) {
  ensure();
  if (document.pointerLockElement) document.exitPointerLock(); // (you need the mouse for some of these)
  start(kind, opts);
}

function start(kind, opts) {
  cancelAnimationFrame(raf);
  const M = MINIGAMES[kind];
  root.querySelector("h3").textContent = `${M.icon} ${opts.title || M.name}`;
  root.querySelector(".how").textContent = M.how;
  root.querySelector(".again").style.display = "none";
  root.classList.add("open");
  cur = { kind, opts, over: false, won: false, ...GAMES[kind]() };
  let last = performance.now();
  const loop = (now) => {
    if (!cur) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!cur.over) cur.step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function finish(won, msg) {
  cur.over = true;
  cur.won = won;
  cur.msg = msg;
  root.querySelector(".again").style.display = won ? "none" : "";
}

function end(won, quit) {
  const c = cur;
  cur = null;
  cancelAnimationFrame(raf);
  root.classList.remove("open");
  if (!c) return;
  if (won && c.won && c.opts.onWin) c.opts.onWin();
  else if (quit && c.opts.onLose) c.opts.onLose();
}

// ---------------------------------------------------------------- drawing helpers
function draw() {
  g.clearRect(0, 0, W, H);
  cur.draw(g);
  info.textContent = cur.status ? cur.status() : "";
  if (cur.over) {
    g.fillStyle = "rgba(10,6,4,.72)";
    g.fillRect(0, 0, W, H);
    text(cur.won ? "🎉 YOU DID IT!" : "💥 Not this time…", W / 2, H / 2 - 24, 40, cur.won ? "#ffe08a" : "#ffb0a0");
    text(cur.msg || "", W / 2, H / 2 + 18, 18, "#fff");
    text(cur.won ? "press SPACE to carry on" : "press SPACE to try again", W / 2, H / 2 + 54, 15, "#d8c8a8");
  }
}
function text(s, x, y, size, col, align = "center") {
  g.font = `900 ${size}px 'Trebuchet MS', system-ui, sans-serif`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.lineWidth = Math.max(3, size / 7);
  g.strokeStyle = "rgba(0,0,0,.7)";
  g.strokeText(s, x, y);
  g.fillStyle = col;
  g.fillText(s, x, y);
}
function rr(x, y, w, h, r, fill) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}
function envelope(x, y, s, stamp = "#e84a4a") {
  rr(x - 22 * s, y - 14 * s, 44 * s, 28 * s, 4 * s, "#f6ead0");
  g.strokeStyle = "#b89a6a";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 22 * s, y - 14 * s);
  g.lineTo(x, y + 2 * s);
  g.lineTo(x + 22 * s, y - 14 * s);
  g.stroke();
  rr(x + 10 * s, y - 11 * s, 9 * s, 9 * s, 2, stamp);
}
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- the games
const STAMPS = [
  { col: "#e84a4a", name: "red" },
  { col: "#f0c030", name: "yellow" },
  { col: "#4ac060", name: "green" },
  { col: "#4a8ae8", name: "blue" },
];
const GAMES = {
  // 📮 POST SORT
  sort() {
    const G = { done: 0, bad: 0, goal: 15, letter: null, flash: 0, flashOk: true };
    const next = () => (G.letter = { s: Math.floor(Math.random() * 4), t: 0, life: Math.max(0.5, (3.2 - G.done * 0.11) / 3) /* (3× faster drop) */, y: 60 });
    next();
    const send = (k) => {
      if (!G.letter) return;
      const ok = k === G.letter.s;
      G.flash = 0.35;
      G.flashOk = ok;
      ok ? G.done++ : G.bad++;
      G.letter = null;
      if (G.done >= G.goal) return finish(true, "Every letter sorted into the right bag!");
      if (G.bad >= 3) return finish(false, "Three letters in the wrong bags — the bags burst!");
      next();
    };
    return {
      status: () => `📮 sorted ${G.done}/${G.goal} · ✖ ${G.bad}/3`,
      key: (c) => {
        const k = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[c];
        if (k !== undefined) send(k);
      },
      click: (p) => p.y > 300 && send(Math.max(0, Math.min(3, Math.floor(p.x / (W / 4))))),
      step(dt) {
        G.flash = Math.max(0, G.flash - dt);
        const L = G.letter;
        if (!L) return;
        L.t += dt;
        L.y = 60 + Math.min(1, L.t / L.life) * 180;
        if (L.t >= L.life) send(-1); // (too slow — it lands on the floor)
      },
      draw() {
        rr(0, 0, W, H, 12, "#4a3424");
        if (G.letter) {
          envelope(W / 2, G.letter.y, 2.2, STAMPS[G.letter.s].col);
          const k = 1 - G.letter.t / G.letter.life;
          rr(W / 2 - 80, 22, 160 * k, 8, 4, k > 0.35 ? "#8ad86a" : "#e86a4a");
        }
        STAMPS.forEach((S, i) => {
          const x = i * (W / 4) + 14, w = W / 4 - 28;
          rr(x, 310, w, 110, 18, "#8a6a42");
          rr(x + 10, 322, w - 20, 26, 8, S.col);
          text(String(i + 1), x + w / 2, 385, 38, "#fff");
        });
        if (G.flash) text(G.flashOk ? "✔" : "✖", W / 2, 270, 44, G.flashOk ? "#8aff8a" : "#ff8a7a");
      },
    };
  },

  // 🍃 LEAF CATCH
  catch() {
    const G = { x: W / 2, vx: 0, aim: null, got: 0, goal: 8, lives: 3, t: 45, items: [], spawn: 0, left: false, right: false };
    return {
      status: () => `✉️ ${G.got}/${G.goal} · ❤️ ${G.lives} · ⏱ ${Math.ceil(G.t)}s`,
      move: (p) => (G.aim = p.x), // (the basket SLIDES toward the mouse — it doesn't snap)
      key: (c) => ((c === "KeyA" || c === "ArrowLeft") && (G.left = true), (c === "KeyD" || c === "ArrowRight") && (G.right = true)),
      keyUp: (c) => ((c === "KeyA" || c === "ArrowLeft") && (G.left = false), (c === "KeyD" || c === "ArrowRight") && (G.right = false)),
      step(dt) {
        G.t -= dt;
        // 🧺 a SMOOTH basket: it eases up to speed and eases to a stop — never jerky, never icy
        const push = (G.right ? 1 : 0) - (G.left ? 1 : 0);
        if (push) {
          G.aim = null; // (keys take over from the mouse)
          G.vx += (push * 1500 - G.vx) * Math.min(1, dt * 12);
          G.x += G.vx * dt;
        } else if (G.aim !== null) {
          const nx = G.x + (G.aim - G.x) * Math.min(1, dt * 14); // (glides to the mouse — no overshoot)
          G.vx = (nx - G.x) / Math.max(dt, 0.001);
          G.x = nx;
        } else {
          G.vx += (0 - G.vx) * Math.min(1, dt * 12);
          G.x += G.vx * dt;
        }
        G.x = Math.max(56, Math.min(W - 56, G.x)); // (the whole basket stays on screen)
        G.spawn -= dt;
        if (G.spawn <= 0) {
          G.spawn = rnd(0.35, 0.7);
          const r = Math.random();
          G.items.push({ kind: r < 0.32 ? "letter" : r < 0.62 ? "cone" : "leaf", x: rnd(30, W - 30), y: -20, vy: rnd(90, 170), ph: rnd(0, 6), col: ["#e86a1a", "#d8402a", "#f0a020"][Math.floor(rnd(0, 3))] });
        }
        for (const it of G.items) {
          it.y += it.vy * dt;
          it.ph += dt * 3;
          if (it.kind !== "cone") it.x += Math.sin(it.ph) * 60 * dt; // (letters and leaves flutter)
          if (!it.gone && it.y > H - 70 && it.y < H - 40 && Math.abs(it.x - G.x) < 46) {
            it.gone = true;
            if (it.kind === "letter") G.got++;
            if (it.kind === "cone") G.lives--;
          }
        }
        G.items = G.items.filter((it) => !it.gone && it.y < H + 30);
        if (G.got >= G.goal) finish(true, "Eight letters, safe in your basket!");
        else if (G.lives <= 0) finish(false, "BONK! Too many pinecones.");
        else if (G.t <= 0) finish(false, "Time's up — the wind carried the rest away.");
      },
      draw() {
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#f0b878");
        sky.addColorStop(1, "#6a8a3a");
        rr(0, 0, W, H, 12, sky);
        for (const it of G.items) {
          if (it.kind === "letter") envelope(it.x, it.y, 0.9);
          else if (it.kind === "cone") {
            g.fillStyle = "#6a4422";
            g.beginPath();
            g.ellipse(it.x, it.y, 9, 13, 0, 0, Math.PI * 2);
            g.fill();
          } else {
            g.fillStyle = it.col;
            g.beginPath();
            g.ellipse(it.x, it.y, 10, 5, it.ph, 0, Math.PI * 2);
            g.fill();
          }
        }
        // the basket (it tilts as it slides)
        g.save();
        g.translate(G.x, H - 45);
        g.rotate(Math.max(-0.35, Math.min(0.35, G.vx / 4000)));
        rr(-46, -17, 92, 34, 10, "#a8783a");
        rr(-46, -17, 92, 8, 4, "#7a5426");
        g.restore();
      },
    };
  },

  // 🍾 BOTTLE BOB
  bob() {
    const G = { hits: 0, goal: 5, miss: 0, m: 0, dir: 1, sp: 0.75, zone: 0.24, z0: 0.4, flash: 0, ok: true, t: 0 };
    const newZone = () => (G.z0 = rnd(0.08, 0.92 - G.zone));
    newZone();
    return {
      G, // (for tests)
      status: () => `🍾 hooked ${G.hits}/${G.goal} · misses ${G.miss}/3`,
      key: (c) => {
        if (c !== "Space" && c !== "KeyE") return;
        const slack = 0.03; // (forgiving: it counts the moment ANY part of the marker touches the green)
        const ok = G.m >= G.z0 - slack && G.m <= G.z0 + G.zone + slack;
        G.flash = 0.4;
        G.ok = ok;
        if (ok) {
          G.hits++;
          G.zone = Math.max(0.09, G.zone - 0.035);
          G.sp += 0.22;
          if (G.hits >= G.goal) return finish(true, "You reel the bottle in — there's a letter inside!");
        } else if (++G.miss >= 3) return finish(false, "The bottle bobs away on the current…");
        newZone();
      },
      click() {
        this.key("Space"); // (clicking hooks it too)
      },
      step(dt) {
        G.t += dt;
        G.flash = Math.max(0, G.flash - dt);
        G.m += G.dir * G.sp * dt;
        if (G.m > 1) (G.m = 1), (G.dir = -1);
        if (G.m < 0) (G.m = 0), (G.dir = 1);
      },
      draw() {
        rr(0, 0, W, H, 12, "#2a6a8a");
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = "rgba(255,255,255,.25)";
          g.lineWidth = 3;
          g.beginPath();
          for (let x = 0; x <= W; x += 20) g.lineTo(x, 120 + k * 30 + Math.sin(x / 40 + G.t * 2 + k) * 6);
          g.stroke();
        }
        // the bottle
        const bx = W / 2 + Math.sin(G.t * 1.3) * 120, by = 190 + Math.sin(G.t * 2.4) * 10;
        rr(bx - 16, by - 40, 32, 70, 10, "rgba(170,230,200,.85)");
        rr(bx - 6, by - 58, 12, 20, 4, "rgba(170,230,200,.85)");
        envelope(bx, by, 0.45);
        // the meter
        const x0 = 60, w = W - 120, y = 340;
        rr(x0, y, w, 34, 17, "#1a2a3a");
        rr(x0 + G.z0 * w, y, G.zone * w, 34, 14, "#4ad86a");
        rr(x0 + G.m * w - 5, y - 10, 10, 54, 5, "#fff");
        if (G.flash) text(G.ok ? "HOOKED!" : "MISS!", W / 2, 300, 30, G.ok ? "#8aff8a" : "#ff8a7a");
      },
    };
  },

  // 🌾 HAYSTACK HUNT
  hay() {
    const G = { got: 0, goal: 10, oops: 0, t: 35, pop: null, wait: 0.8, flash: 0, ok: true };
    const spot = (i) => ({ x: 110 + (i % 3) * 230, y: i < 3 ? 160 : 330 });
    const grab = (i) => {
      const P = G.pop;
      if (!P || P.i !== i || P.t > P.life) {
        G.flash = 0.3;
        G.ok = false;
        return;
      }
      G.pop = null;
      G.wait = rnd(0.25, 0.7);
      G.flash = 0.3;
      if (P.kind === "letter") (G.got++, (G.ok = true));
      else (G.oops++, (G.ok = false));
      if (G.got >= G.goal) finish(true, "Ten letters pulled out of the hay!");
      else if (G.oops >= 3) finish(false, "BAWK! You grabbed too many chickens.");
    };
    return {
      status: () => `✉️ ${G.got}/${G.goal} · 🐔 ${G.oops}/3 · ⏱ ${Math.ceil(G.t)}s`,
      key: (c) => {
        const i = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 }[c];
        if (i !== undefined) grab(i);
      },
      click: (p) => {
        for (let i = 0; i < 6; i++) {
          const S = spot(i);
          if (Math.hypot(p.x - S.x, p.y - S.y) < 70) return grab(i);
        }
      },
      step(dt) {
        G.t -= dt;
        G.flash = Math.max(0, G.flash - dt);
        if (G.pop) {
          G.pop.t += dt;
          if (G.pop.t > G.pop.life) {
            G.pop = null;
            G.wait = rnd(0.2, 0.6);
          }
        } else if ((G.wait -= dt) <= 0) G.pop = { i: Math.floor(rnd(0, 6)), kind: Math.random() < 0.72 ? "letter" : "chicken", t: 0, life: Math.max(0.55, 1.1 - G.got * 0.05) };
        if (G.t <= 0) finish(false, "Time's up — the letters are lost in the hay.");
      },
      draw() {
        rr(0, 0, W, H, 12, "#c8a050");
        for (let i = 0; i < 6; i++) {
          const S = spot(i);
          const P = G.pop && G.pop.i === i ? G.pop : null;
          if (P) {
            const up = Math.min(1, P.t / 0.15) * 46;
            if (P.kind === "letter") envelope(S.x, S.y - 20 - up, 1.2);
            else text("🐔", S.x, S.y - 20 - up, 44, "#fff");
          }
          g.fillStyle = "#e8c050";
          g.beginPath();
          g.ellipse(S.x, S.y + 20, 80, 52, 0, Math.PI, 0);
          g.fill();
          rr(S.x - 82, S.y + 18, 164, 18, 6, "#b88a30");
          text(String(i + 1), S.x, S.y + 54, 22, "#fff");
        }
        if (G.flash) text(G.ok ? "✔" : "✖", W / 2, 40, 34, G.ok ? "#2a8a2a" : "#c83a2a");
      },
    };
  },

  // 🧊 ICE MEMORY
  memory() {
    const pics = ["❄️", "🦭", "⛄", "🐧", "🧣", "🏔️", "🦊", "🔔"];
    const deck = [...pics, ...pics].sort(() => Math.random() - 0.5).map((p) => ({ p, up: false, done: false }));
    const G = { moves: 0, max: 16, open: [], wait: 0 };
    const at = (i) => ({ x: 60 + (i % 4) * 150, y: 22 + Math.floor(i / 4) * 102 });
    return {
      status: () => `🧊 moves ${G.moves}/${G.max} · pairs ${deck.filter((c) => c.done).length / 2}/8`,
      click: (p) => {
        if (G.wait > 0) return;
        for (let i = 0; i < deck.length; i++) {
          const A = at(i);
          if (p.x < A.x || p.x > A.x + 120 || p.y < A.y || p.y > A.y + 88) continue;
          const c = deck[i];
          if (c.up || c.done) return;
          c.up = true;
          G.open.push(c);
          if (G.open.length === 2) {
            G.moves++;
            if (G.open[0].p === G.open[1].p) {
              G.open.forEach((o) => (o.done = true));
              G.open = [];
              if (deck.every((o) => o.done)) finish(true, `All eight pairs in ${G.moves} moves!`);
            } else G.wait = 0.8;
          }
          return;
        }
      },
      step(dt) {
        if (G.wait > 0 && (G.wait -= dt) <= 0) {
          G.open.forEach((o) => (o.up = false));
          G.open = [];
          if (G.moves >= G.max) finish(false, "Out of moves — the ice freezes over again.");
        }
      },
      draw() {
        rr(0, 0, W, H, 12, "#1a3a5a");
        deck.forEach((c, i) => {
          const A = at(i);
          rr(A.x, A.y, 120, 88, 12, c.done ? "#8ad8a8" : c.up ? "#e8f6ff" : "#7ab8e8");
          if (c.up || c.done) text(c.p, A.x + 60, A.y + 46, 44, "#fff");
          else text("❅", A.x + 60, A.y + 46, 30, "rgba(255,255,255,.7)");
        });
      },
    };
  },

  // 🔐 CIPHER WHEEL
  cipher() {
    const LINES = ["TO THE MOONKEEPER AFTER ME", "A STAR WILL FALL IN THE FOREST", "GUARD ITS HEART AND PLANT IT", "OR THE MOON ROAD WILL CLOSE"];
    const shiftOf = () => 3 + Math.floor(Math.random() * 20);
    const code = (s, k) => s.replace(/[A-Z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + k) % 26) + 65));
    const G = { sel: 0, secret: LINES.map(shiftOf), turn: LINES.map(() => 0), tries: 0, flash: 0 };
    const solved = (i) => (G.turn[i] + G.secret[i]) % 26 === 0;
    return {
      status: () => `🔐 lines reading right: ${LINES.filter((_, i) => solved(i)).length}/${LINES.length}`,
      key: (c) => {
        if (c === "ArrowUp" || c === "KeyW") G.sel = (G.sel + LINES.length - 1) % LINES.length;
        if (c === "ArrowDown" || c === "KeyS") G.sel = (G.sel + 1) % LINES.length;
        if (c === "ArrowLeft" || c === "KeyA") G.turn[G.sel] = (G.turn[G.sel] + 25) % 26;
        if (c === "ArrowRight" || c === "KeyD") G.turn[G.sel] = (G.turn[G.sel] + 1) % 26;
        if (c === "Enter" || c === "Space") {
          if (LINES.every((_, i) => solved(i))) finish(true, "Renata's warning, after all these years…");
          else G.flash = 1.2;
        }
      },
      click: (p) => {
        const i = Math.floor((p.y - 60) / 80);
        if (i >= 0 && i < LINES.length) {
          G.sel = i;
          G.turn[i] = (G.turn[i] + (p.x > W / 2 ? 1 : 25)) % 26;
        }
      },
      step(dt) {
        G.flash = Math.max(0, G.flash - dt);
      },
      draw() {
        rr(0, 0, W, H, 12, "#2a1a3a");
        text("✒ in Renata's own hand, in the old Moonkeeper code", W / 2, 28, 15, "#d8b8ff");
        LINES.forEach((L, i) => {
          const y = 60 + i * 80;
          rr(20, y, W - 40, 64, 12, i === G.sel ? "#5a3a7a" : "#3a2a4a");
          const shown = code(code(L, G.secret[i]), G.turn[i]);
          text(shown, W / 2, y + 26, 24, solved(i) ? "#a8ffb8" : "#f0e0ff");
          text(`◀  wheel ${G.turn[i]}  ▶`, W / 2, y + 52, 12, "#b8a0d8");
        });
        if (G.flash) text("Some lines are still gibberish!", W / 2, H - 22, 18, "#ffb0a0");
      },
    };
  },
};
