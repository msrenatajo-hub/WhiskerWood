// ------------------------------------------------------------
//  🏜️ THE DUNE RUN — WhiskerWood's own endless sandboarding game.
//  Thistle boards down an endless desert of dunes, side-on, as the sun sets:
//    Space (tap)         — jump
//    Space (hold in air) — backflip! land upright for a speed boost + combo
//    land on a vine      — grind along it · jump into a ruined wall — ride along it
//    land on a hot-air balloon — a huge bounce (and combo)
//    jump the rocks and canyons — a bad landing or a rock = WIPE-OUT
//    collect the gold coins · the sky turns from sunset to starry night
//  Esc — leave. (Launched from the ⭐ sign in the Whispering Dunes.)
// ------------------------------------------------------------

export function startDuneRun({ best = 0, onEnd }) {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:80;background:#000";
  document.body.appendChild(cv);
  const g = cv.getContext("2d");
  let W = 0, H = 0, DPR = Math.min(2, devicePixelRatio || 1);
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  resize();
  addEventListener("resize", resize);

  // ---------------------------------------------------------------- the land (an endless slope of dunes)
  const seed = Math.random() * 1000;
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + seed) * 43758.5453;
    return s - Math.floor(s);
  };
  // features every ~stretch: canyons (gaps), rocks, vines between poles
  const SEG = 60;
  const feature = (i) => {
    if (i < 3) return null;
    const r = hash(i);
    if (r < 0.18) return { type: "gap", w: 9 + hash(i + 0.5) * 7 };
    if (r < 0.38) return { type: "rock" };
    if (r < 0.54) return { type: "vine", len: 24 + hash(i + 0.3) * 18, lift: 5 + hash(i + 0.7) * 3 };
    if (r < 0.7) return { type: "wall", len: 16 + hash(i + 0.4) * 12, h: 7 + hash(i + 0.6) * 4 };
    if (r < 0.84) return { type: "balloon", lift: 9 + hash(i + 0.2) * 5, col: Math.floor(hash(i + 0.8) * 4) };
    return null;
  };
  const baseY = (x) => x * 0.32 + Math.sin(x * 0.045 + seed) * 7 + Math.sin(x * 0.013 + seed * 2) * 16 + Math.sin(x * 0.11) * 1.2;
  const inGap = (x) => {
    const i = Math.floor(x / SEG);
    const f = feature(i);
    if (!f || f.type !== "gap") return false;
    const x0 = i * SEG + 30;
    return x > x0 && x < x0 + f.w;
  };
  const ground = (x) => (inGap(x) ? Infinity : baseY(x));
  const slope = (x) => Math.atan2(baseY(x + 0.5) - baseY(x - 0.5), 1);
  const rocks = (x0, x1) => {
    const out = [];
    for (let i = Math.floor(x0 / SEG); i <= Math.floor(x1 / SEG); i++) {
      const f = feature(i);
      if (f && f.type === "rock") out.push(i * SEG + 32);
    }
    return out;
  };
  const vines = (x0, x1) => {
    const out = [];
    for (let i = Math.floor(x0 / SEG) - 1; i <= Math.floor(x1 / SEG); i++) {
      const f = feature(i);
      if (f && f.type === "vine") {
        const a = i * SEG + 20, b = a + f.len;
        out.push({ a, b, ya: baseY(a) - f.lift, yb: baseY(b) - f.lift });
      }
    }
    return out;
  };
  // 🧱 ruined walls you can ride along · 🎈 hot-air balloons you can bounce on
  const walls = (x0, x1) => {
    const out = [];
    for (let i = Math.floor(x0 / SEG) - 1; i <= Math.floor(x1 / SEG); i++) {
      const f = feature(i);
      if (f && f.type === "wall") {
        const a = i * SEG + 22, b = a + f.len;
        out.push({ a, b, top: Math.min(baseY(a), baseY(b)) - f.h, i });
      }
    }
    return out;
  };
  const balloons = (x0, x1) => {
    const out = [];
    for (let i = Math.floor(x0 / SEG) - 1; i <= Math.floor(x1 / SEG) + 1; i++) {
      const f = feature(i);
      if (f && f.type === "balloon") {
        const x = i * SEG + 30;
        // (tethered low, right in your path: its top is just above the sand — a bouncy trampoline)
        const top = baseY(x) - 2.4 + Math.sin(t * 1.6 + i) * 0.15;
        out.push({ x, top, col: f.col, i });
      }
    }
    return out;
  };
  const vineY = (v, x) => v.ya + ((v.yb - v.ya) * (x - v.a)) / (v.b - v.a) + Math.sin(((x - v.a) / (v.b - v.a)) * Math.PI) * 1.4;
  const coinsTaken = new Set();
  const coinsAt = (x0, x1) => {
    const out = [];
    for (let i = Math.floor(x0 / SEG); i <= Math.floor(x1 / SEG); i++) {
      if (hash(i + 9.1) < 0.45) continue;
      const f = feature(i);
      for (let k = 0; k < 6; k++) {
        const x = i * SEG + 8 + k * 3.2;
        const key = i * 10 + k;
        if (coinsTaken.has(key)) continue;
        const arc = f && f.type === "gap" ? 0 : Math.sin((k / 5) * Math.PI) * 4;
        out.push({ x, y: baseY(x) - 2 - arc, key });
      }
    }
    return out;
  };

  // ---------------------------------------------------------------- the rider
  const P = { x: 0, y: baseY(0), vx: 14, vy: 0, rot: 0, spin: 0, air: false, grind: null, wall: null, crashed: false };
  const usedBalloon = new Set();
  let score = 0, coins = 0, combo = 0, flips = 0, dist = 0, t = 0, trickT = 0, trickText = "", over = false, hold = false;
  const pops = [];
  const pop = (text, color = "#fff6d8") => pops.push({ text, color, t: 0 });

  const onKey = (e) => {
    if (e.code === "Space" || e.code === "Escape" || e.code === "KeyW" || e.code === "ArrowUp") {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    if (e.type === "keydown" && !e.repeat && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) {
      if (over) return restart();
      hold = true;
      if (!P.air || P.grind) jump();
    }
    if (e.type === "keyup" && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) hold = false;
    if (e.type === "keydown" && e.code === "Escape") quit();
  };
  addEventListener("keydown", onKey, true);
  addEventListener("keyup", onKey, true);
  const onTouch = (e) => {
    e.preventDefault();
    if (e.type === "pointerdown") {
      if (over) return restart();
      hold = true;
      if (!P.air || P.grind) jump();
    } else hold = false;
  };
  cv.addEventListener("pointerdown", onTouch);
  cv.addEventListener("pointerup", onTouch);

  // 🎈 a tethered balloon is a trampoline: touch its top and BOING
  let lastBounce = -1;
  function balloonBounce(b) {
    if (Math.abs(P.x - b.x) > 2.4 || P.y < b.top - 0.6 || lastBounce === b.i) return false;
    lastBounce = b.i;
    P.grind = null;
    P.wall = null;
    P.air = true;
    P.vy = -26;
    P.y = b.top - 0.2;
    combo++;
    const pts = 400 * combo + flips * 250 * combo;
    score += pts;
    flips = 0;
    P.spin = 0;
    boost(3);
    pop(`BOING! Balloon bounce! +${pts}${combo > 1 ? `  (×${combo})` : ""}`, "#ffb0d8");
    return true;
  }
  let boostT = 0;
  function boost(n) {
    P.vx = Math.min(40, P.vx + n);
    boostT = 1.4;
  }
  function jump() {
    P.grind = null;
    P.wall = null;
    P.air = true;
    P.vy = -16;
    P.y -= 0.3;
  }
  function land() {
    // how upright are you, compared with the slope under your board?
    const s = slope(P.x);
    let d = ((P.rot - s) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    // (forgiving: you only wipe out if you land nearly sideways or upside-down)
    if (Math.abs(d) > 1.35) return crash("WIPE-OUT!");
    const perfect = Math.abs(d) < 0.3;
    P.air = false;
    P.vy = 0;
    P.rot = slope(P.x); // (snap the board onto the sand)
    if (flips > 0) {
      combo++;
      const pts = flips * 250 * combo + (perfect ? 150 : 0);
      score += pts;
      boost(4 + 3 * flips + (perfect ? 3 : 0)); // (a trick landing gives you SPEED)
      pop(`${perfect ? "Perfect " : ""}${flips === 1 ? "backflip" : flips === 2 ? "double backflip" : flips + "× backflip"}!  +${pts}${combo > 1 ? `  (×${combo} combo)` : ""}`, "#ffe08a");
    } else if (perfect && P.lastAir > 0.5) boost(2);
    flips = 0;
    P.spin = 0;
  }
  function crash(why) {
    if (P.crashed) return;
    P.crashed = true;
    over = true;
    combo = 0;
    pop(why, "#ff9a7a");
  }

  // ---------------------------------------------------------------- each frame
  let last = performance.now(), raf = 0;
  function step(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    t += dt;
    if (!P.crashed) physics(dt);
    else {
      P.vx *= 0.96;
      P.x += P.vx * dt;
      P.rot += dt * 6;
      P.y = Math.min(P.y + 12 * dt, isFinite(ground(P.x)) ? ground(P.x) : P.y + 30 * dt);
    }
    draw(dt);
    raf = requestAnimationFrame(step);
  }
  function physics(dt) {
    const gy = ground(P.x);
    // riding along a ruined wall — sparks fly!
    if (P.wall) {
      P.vx = Math.min(32, P.vx + dt * 3);
      P.x += P.vx * dt;
      P.rot = -0.12;
      score += Math.round(dt * 180);
      if (P.x > P.wall.b) {
        P.wall = null;
        P.air = true;
        P.vy = -9; // (pop off the end of the wall)
        pop("Wall ride!", "#ffcf9a");
      }
      return;
    }
    // grinding a vine
    if (P.grind) {
      P.vx = Math.min(30, P.vx + dt * 2);
      P.x += P.vx * dt;
      if (P.x > P.grind.b) {
        P.grind = null;
        P.air = true;
        P.vy = -4;
      } else {
        P.y = vineY(P.grind, P.x);
        P.rot = Math.atan2(P.grind.yb - P.grind.ya, P.grind.b - P.grind.a);
        score += Math.round(dt * 120);
        trickT += dt;
      }
      return;
    }
    if (P.air) {
      P.lastAir = (P.lastAir || 0) + dt;
      if (!hold) {
        // let go of Space and the board settles back toward the slope (so you land it)
        const target = slope(P.x) - Math.round((slope(P.x) - P.rot) / (Math.PI * 2)) * Math.PI * 2;
        P.rot += (target - P.rot) * Math.min(1, dt * 5);
      }
      P.vy += 38 * dt;
      P.x += P.vx * dt;
      P.y += P.vy * dt;
      if (hold) {
        P.spin -= dt * 7.5; // (backflip)
        P.rot -= dt * 7.5;
        if (P.spin <= -Math.PI * 2 * (flips + 1) + 0.6) flips++;
      }
      // 🎈 drop onto a balloon and it bounces you sky-high
      if (P.vy > 0) for (const b of balloons(P.x - 3, P.x + 3)) if (balloonBounce(b)) return;
      // 🧱 hit the face of a ruined wall in mid-air → ride along it
      for (const w of walls(P.x - 1, P.x + 1)) {
        const base = Math.max(baseY(w.a), baseY(w.b));
        if (P.x > w.a && P.x < w.b - 2 && P.y > w.top && P.y < base - 0.8) {
          P.wall = w;
          if (flips) {
            combo++;
            score += flips * 250 * combo;
            pop(`Flip into a wall ride! +${flips * 250 * combo}`, "#ffe08a");
          }
          flips = 0;
          P.spin = 0;
          return;
        }
      }
      // landing on a vine
      for (const v of vines(P.x - 1, P.x + 1)) {
        if (P.x > v.a && P.x < v.b && P.vy > 0) {
          const vy = vineY(v, P.x);
          if (P.y >= vy - 0.4 && P.y <= vy + 1) {
            let d = ((P.rot % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            if (Math.abs(d) > 1.35) return crash("WIPE-OUT!");
            P.grind = v;
            P.y = vy;
            if (flips) {
              combo++;
              score += flips * 250 * combo;
              pop(`Backflip onto the vine! +${flips * 250 * combo}`, "#ffe08a");
              flips = 0;
              P.spin = 0;
            } else pop("Grind!", "#bff4c0");
            return;
          }
        }
      }
      if (isFinite(gy) && P.y >= gy) {
        P.y = gy;
        land();
      }
      if (P.y > baseY(P.x) + 40) crash("Into the canyon!");
      return;
    }
    // on the sand: speed builds downhill
    P.lastAir = 0;
    boostT = Math.max(0, boostT - dt);
    const s = slope(P.x);
    P.vx = Math.max(10, Math.min(boostT > 0 ? 40 : 32, P.vx + Math.sin(s) * 22 * dt - (P.vx > 32 ? 4 : 0.6) * dt));
    P.x += P.vx * dt;
    P.rot += (s - P.rot) * Math.min(1, dt * 14);
    const ng = ground(P.x);
    if (!isFinite(ng)) {
      // off the edge of a canyon!
      P.air = true;
      P.vy = Math.sin(s) * P.vx * 0.4;
    } else if (ng > P.y + 1.2) {
      // the sand drops away under you — airborne off the crest
      P.air = true;
      P.vy = Math.sin(s) * P.vx * 0.6;
    } else P.y = ng;
    // rocks!
    for (const rx of rocks(P.x - 1, P.x + 1)) if (Math.abs(P.x - rx) < 0.9 && !P.air) return crash("Hit a rock!");
    // ride into a balloon and it springs you up
    for (const b of balloons(P.x - 3, P.x + 3)) if (balloonBounce(b)) return;
    // ride straight into a wall from the sand and you climb onto its face
    for (const w of walls(P.x - 1, P.x + 1)) if (P.x > w.a && P.x < w.a + 1.5) {
      P.wall = w;
      P.y = Math.max(w.top + 1, P.y - 2.5);
      return;
    }
    dist = Math.floor(P.x);
    score += Math.round(dt * P.vx * 2);
  }
  // coins
  function collect() {
    for (const c of coinsAt(P.x - 2, P.x + 2)) if (Math.hypot(c.x - P.x, c.y - (P.y - 0.8)) < 1.6) {
      coinsTaken.add(c.key);
      coins++;
      score += 25;
    }
  }

  // ---------------------------------------------------------------- drawing (side-on, a sunset desert)
  const SCALE = () => H / 34; // world units → pixels (close enough to see Thistle clearly)
  function draw(dt) {
    collect();
    const s = SCALE();
    const camX = P.x - W / s * 0.32, camY = P.y - H / s * 0.55;
    const sx = (x) => (x - camX) * s, sy = (y) => (y - camY) * s;
    // the sky turns from late afternoon to sunset to night as you go
    const k = Math.min(1, P.x / 2400);
    const lerp = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
    const top = k < 0.5 ? lerp([250, 190, 120], [180, 90, 110], k * 2) : lerp([180, 90, 110], [20, 24, 60], (k - 0.5) * 2);
    const bot = k < 0.5 ? lerp([255, 230, 170], [250, 150, 100], k * 2) : lerp([250, 150, 100], [60, 50, 90], (k - 0.5) * 2);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${top})`);
    sky.addColorStop(1, `rgb(${bot})`);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // stars (at night)
    if (k > 0.55) {
      g.fillStyle = `rgba(255,255,255,${(k - 0.55) * 2})`;
      for (let i = 0; i < 80; i++) g.fillRect((hash(i) * W * 1.3 - P.x * 0.5) % W + (hash(i) * W * 1.3 - P.x * 0.5 < 0 ? W : 0), hash(i + 3) * H * 0.5, 1.5, 1.5);
    }
    // the sun (or moon), sinking
    g.fillStyle = k < 0.6 ? "rgba(255,240,200,0.9)" : "rgba(240,240,255,0.85)";
    g.beginPath();
    g.arc(W * 0.72, H * (0.25 + k * 0.35) * (k < 0.6 ? 1 : 0.5), H * 0.06, 0, Math.PI * 2);
    g.fill();
    // far mesas and dunes (parallax layers)
    const layer = (par, amp, base, col, f) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const wx = x + P.x * s * par;
        g.lineTo(x, H * base - (f(wx * 0.004) * amp));
      }
      g.lineTo(W, H);
      g.fill();
    };
    const shade = (c, u) => `rgba(${c.join(",")},${u})`;
    layer(0.08, H * 0.18, 0.55, shade(lerp([200, 120, 110], [40, 40, 80], k), 0.55), (x) => Math.max(0, Math.sin(x) * 0.6 + Math.sin(x * 2.3) * 0.4 > 0.3 ? 1 : 0.2) + Math.sin(x * 0.7) * 0.2);
    layer(0.2, H * 0.12, 0.66, shade(lerp([220, 140, 100], [50, 45, 85], k), 0.7), (x) => Math.sin(x * 1.5) * 0.6 + Math.sin(x * 3.1) * 0.3 + 0.6);
    layer(0.4, H * 0.08, 0.76, shade(lerp([230, 160, 100], [60, 50, 90], k), 0.85), (x) => Math.sin(x * 2.4) * 0.5 + Math.sin(x * 5) * 0.2 + 0.5);
    // the slope you're riding
    const sandTop = lerp([240, 190, 120], [90, 70, 110], k), sandBot = lerp([200, 140, 90], [40, 35, 70], k);
    const sand = g.createLinearGradient(0, H * 0.4, 0, H);
    sand.addColorStop(0, `rgb(${sandTop})`);
    sand.addColorStop(1, `rgb(${sandBot})`);
    g.fillStyle = sand;
    const x0 = camX - 2, x1 = camX + W / s + 2;
    g.beginPath();
    let inside = false;
    for (let x = x0; x <= x1; x += 0.5) {
      const y = ground(x);
      if (!isFinite(y)) {
        if (inside) {
          g.lineTo(sx(x), H + 10);
          g.closePath();
          g.fill();
          g.beginPath();
          inside = false;
        }
        continue;
      }
      if (!inside) {
        g.moveTo(sx(x), H + 10);
        inside = true;
      }
      g.lineTo(sx(x), sy(y));
    }
    if (inside) {
      g.lineTo(sx(x1), H + 10);
      g.closePath();
      g.fill();
    }
    // rocks
    g.fillStyle = `rgb(${lerp([120, 80, 60], [30, 25, 45], k)})`;
    for (const rx of rocks(x0, x1)) {
      const y = baseY(rx);
      g.beginPath();
      g.moveTo(sx(rx - 1), sy(y + 0.2));
      g.lineTo(sx(rx - 0.4), sy(y - 1.6));
      g.lineTo(sx(rx + 0.5), sy(y - 1.2));
      g.lineTo(sx(rx + 1), sy(y + 0.2));
      g.fill();
    }
    // vines between old poles
    for (const v of vines(x0, x1)) {
      g.strokeStyle = `rgb(${lerp([90, 70, 40], [30, 30, 50], k)})`;
      g.lineWidth = s * 0.25;
      for (const [x, y] of [[v.a, v.ya], [v.b, v.yb]]) {
        g.beginPath();
        g.moveTo(sx(x), sy(y));
        g.lineTo(sx(x), sy(baseY(x) + 1));
        g.stroke();
      }
      g.strokeStyle = `rgb(${lerp([60, 120, 50], [30, 60, 50], k)})`;
      g.lineWidth = s * 0.12;
      g.beginPath();
      for (let x = v.a; x <= v.b; x += 0.5) (x === v.a ? g.moveTo : g.lineTo).call(g, sx(x), sy(vineY(v, x)));
      g.stroke();
    }
    // 🧱 ruined walls
    for (const w of walls(x0, x1)) {
      const base = Math.max(baseY(w.a), baseY(w.b)) + 1;
      g.fillStyle = `rgb(${lerp([170, 110, 80], [45, 38, 60], k)})`;
      g.fillRect(sx(w.a), sy(w.top), (w.b - w.a) * s, (base - w.top) * s);
      g.fillStyle = `rgba(0,0,0,0.12)`;
      for (let yy = w.top + 1.2; yy < base; yy += 1.4) g.fillRect(sx(w.a), sy(yy), (w.b - w.a) * s, 1.5);
      // a broken top edge
      g.fillStyle = `rgb(${lerp([150, 95, 70], [40, 34, 55], k)})`;
      for (let x = w.a; x < w.b; x += 2) g.fillRect(sx(x), sy(w.top - 0.5 - (Math.floor(x) % 3) * 0.3), s * 1.2, s * 0.6);
    }
    // sparks off the wall while you ride it
    if (P.wall && !P.crashed) {
      g.fillStyle = "#ffd890";
      for (let i = 0; i < 6; i++) g.fillRect(sx(P.x - Math.random() * 1.5), sy(P.y - Math.random() * 0.8), 2, 2);
    }
    // 🎈 hot-air balloons, tied down low over the sand like trampolines
    for (const b of balloons(x0 - 4, x1 + 4)) {
      const cols = [["#e8603a", "#ffd04a"], ["#3a8ad8", "#f0f0f0"], ["#8a4ad8", "#ff8ab8"], ["#3aa86a", "#ffe08a"]][b.col];
      const squash = lastBounce === b.i && P.air && P.vy < -12 ? 0.8 : 1;
      const bx = sx(b.x), by = sy(b.top + 1.6), rx = s * 2.4, ry = s * 1.7 * squash;
      // the ropes, staked into the sand
      g.strokeStyle = "rgba(70,45,25,0.85)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(bx - rx * 0.8, by + ry * 0.4);
      g.lineTo(sx(b.x - 3.2), sy(baseY(b.x - 3.2)));
      g.moveTo(bx + rx * 0.8, by + ry * 0.4);
      g.lineTo(sx(b.x + 3.2), sy(baseY(b.x + 3.2)));
      g.stroke();
      // the striped envelope
      for (let st = 0; st < 6; st++) {
        g.fillStyle = cols[st % 2];
        g.beginPath();
        g.ellipse(bx, by, rx * (1 - st / 6), ry, 0, 0, Math.PI * 2);
        g.fill();
      }
      // a little basket peeking out underneath
      g.fillStyle = "#7a5030";
      g.fillRect(bx - s * 0.5, by + ry * 0.85, s * 1, s * 0.5);
    }
    // coins
    for (const c of coinsAt(x0, x1)) {
      g.fillStyle = "#ffd84a";
      g.beginPath();
      g.ellipse(sx(c.x), sy(c.y), s * 0.45 * Math.abs(Math.cos(t * 3 + c.x)) + 1, s * 0.45, 0, 0, Math.PI * 2);
      g.fill();
    }
    // sand spray behind the board
    if (!P.air && !P.crashed) {
      g.fillStyle = `rgba(${sandTop},0.6)`;
      for (let i = 0; i < 5; i++) g.fillRect(sx(P.x - 0.6 - Math.random() * 2), sy(P.y - Math.random() * 1.2), 2, 2);
    }
    // speed streaks while you're boosting
    if (boostT > 0 && !P.crashed) {
      g.strokeStyle = `rgba(255,250,230,${0.5 * Math.min(1, boostT)})`;
      g.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const yy = sy(P.y - 0.5 - Math.random() * 2.5);
        const xx = sx(P.x - 1.5 - Math.random() * 3);
        g.beginPath();
        g.moveTo(xx, yy);
        g.lineTo(xx - s * (2 + Math.random() * 3), yy);
        g.stroke();
      }
    }
    // 🐭 Thistle on her sandboard
    g.save();
    g.translate(sx(P.x), sy(P.y));
    g.rotate(P.rot);
    const u = s;
    g.fillStyle = "#6a3a1a"; // the board
    g.beginPath();
    g.ellipse(0, -0.1 * u, 1.3 * u, 0.18 * u, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#4a6a2a"; // her cloak
    g.beginPath();
    g.ellipse(0, -0.95 * u, 0.42 * u, 0.62 * u, -0.15, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e8d8c0"; // head
    g.beginPath();
    g.arc(0.18 * u, -1.75 * u, 0.36 * u, 0, Math.PI * 2);
    g.fill();
    g.beginPath(); // ears
    g.arc(-0.05 * u, -2.12 * u, 0.2 * u, 0, Math.PI * 2);
    g.arc(0.36 * u, -2.12 * u, 0.2 * u, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1a1a1a";
    g.beginPath();
    g.arc(0.4 * u, -1.8 * u, 0.06 * u, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#c89a8a"; // tail, streaming behind
    g.lineWidth = 0.08 * u;
    g.beginPath();
    g.moveTo(-0.35 * u, -0.6 * u);
    g.quadraticCurveTo(-1.2 * u, -0.9 * u + Math.sin(t * 12) * 0.2 * u, -1.8 * u, -1.3 * u);
    g.stroke();
    g.restore();

    // ---------------------------------------------------------------- the words on screen
    g.fillStyle = "rgba(255,248,230,0.95)";
    g.font = `bold ${Math.round(H * 0.035)}px Georgia, serif`;
    g.textAlign = "left";
    g.fillText(`${score}`, 24, H * 0.07);
    g.font = `${Math.round(H * 0.022)}px Georgia, serif`;
    g.fillText(`${dist} m · 🪙 ${coins}${best ? ` · best ${best}` : ""}`, 24, H * 0.11);
    g.textAlign = "right";
    g.fillText("Space: jump · hold in the air: backflip · bounce on balloons · ride the walls · Esc: leave", W - 24, H * 0.06);
    // trick pop-ups
    g.textAlign = "center";
    for (const p of pops) {
      p.t += dt;
      g.fillStyle = p.color;
      g.globalAlpha = Math.max(0, 1 - p.t / 1.6);
      g.font = `bold ${Math.round(H * 0.04)}px Georgia, serif`;
      g.fillText(p.text, W / 2, H * 0.3 - p.t * 30);
    }
    g.globalAlpha = 1;
    while (pops.length && pops[0].t > 1.6) pops.shift();
    if (over) {
      g.fillStyle = "rgba(20,10,30,0.5)";
      g.fillRect(0, H * 0.38, W, H * 0.24);
      g.fillStyle = "#fff4d8";
      g.font = `bold ${Math.round(H * 0.05)}px Georgia, serif`;
      g.fillText(`${score}${score > best ? "  ✨ NEW BEST!" : ""}`, W / 2, H * 0.47);
      g.font = `${Math.round(H * 0.026)}px Georgia, serif`;
      g.fillText(`${dist} m · 🪙 ${coins} coins · Space to ride again · Esc to leave`, W / 2, H * 0.55);
    }
  }

  function restart() {
    report();
    best = Math.max(best, score);
    Object.assign(P, { x: 0, y: baseY(0), vx: 14, vy: 0, rot: 0, spin: 0, air: false, grind: null, wall: null, crashed: false });
    usedBalloon.clear();
    lastBounce = -1;
    score = coins = combo = flips = dist = 0;
    over = false;
    coinsTaken.clear();
  }
  let reported = 0;
  function report() {
    // (every finished run counts — your best, and the coins you picked up)
    if (over && onEnd) onEnd({ score, coins, dist, final: false });
    reported++;
  }
  function quit() {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", onKey, true);
    removeEventListener("keyup", onKey, true);
    removeEventListener("resize", resize);
    cv.remove();
    if (onEnd) onEnd({ score: over ? score : Math.max(score, 0), coins, dist, final: true });
  }
  raf = requestAnimationFrame(step);
  return { quit };
}
