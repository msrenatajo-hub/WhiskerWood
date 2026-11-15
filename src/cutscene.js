// ------------------------------------------------------------
//  🎬  CUTSCENES — little movies played with the game's own camera.
//
//  A cutscene is a list of SHOTS. Each shot glides the camera from one
//  spot to another (or holds still), aims it at something, and can show
//  a line of dialogue at the bottom of the screen. Black bars slide in at
//  the top and bottom so it feels like a film, and shots can fade to /
//  from black (handy for hiding a jump to another place).
//
//    playCutscene([
//      { dur: 3, from: [x,y,z], to: [x,y,z], look: [x,y,z],
//        who: "Teacher", text: "Welcome, little one!" },
//      { dur: 1, fadeOut: true, run: () => goSomewhere() },
//    ]);
//
//  Shot fields (all optional):
//    dur            seconds the shot lasts (lines of dialogue stay up long
//                   enough to read, whatever dur says)
//    from, to       camera start / end position  [x, y, z]
//    look           what the camera aims at (or lookFrom → lookTo to pan)
//    who, text      a speaker name and their line
//    run()          called when the shot starts (switch places, pose actors…)
//    update(k, dt)  called every frame, k = 0 → 1 through the shot
//    end()          called when the shot is over (or skipped)
//    fadeOut / fadeIn / black   fade the screen to or from black
//    gameCam        let the normal game camera follow the mouse this shot
//    bars: false    no black film bars (for quick fades)
//  Positions can also be FUNCTIONS — read when the shot starts, so a shot
//  can aim at wherever the mouse happens to be.
//
//  Controls while one plays: Space / E / Enter = next line,  Esc = skip it all.
//  (Skipping still runs every shot's run + end, so the story never breaks.)
// ------------------------------------------------------------
import * as THREE from "three";

// --- the on-screen pieces: bars, caption box, black fade, skip hint ---
const style = document.createElement("style");
style.textContent = `
  .cs-bar { position: fixed; left: 0; right: 0; height: 11vh; background: #000;
    z-index: 40; transition: transform .6s ease; pointer-events: none; }
  .cs-bar.top { top: 0; transform: translateY(-100%); }
  .cs-bar.bot { bottom: 0; transform: translateY(100%); }
  body.cs-film .cs-bar { transform: translateY(0); }
  body.cs-film #hud, body.cs-film #minimap, body.cs-film #sprint,
  body.cs-film #mouse-look-btn, body.cs-film #sound-btn, body.cs-film #credits-btn { opacity: 0; transition: opacity .4s; }
  #cs-caption { position: fixed; left: 50%; bottom: 13vh; transform: translateX(-50%);
    width: min(760px, 88vw); z-index: 41; text-align: center; pointer-events: none;
    font: 21px/1.45 Georgia, serif; color: #fff6e0; text-shadow: 0 2px 6px #000, 0 0 2px #000;
    opacity: 0; transition: opacity .3s; }
  #cs-caption b { display: block; font: bold 13px system-ui; letter-spacing: .16em;
    text-transform: uppercase; color: #ffd36a; margin-bottom: 4px; }
  #cs-caption.show { opacity: 1; }
  /* a HUGE title card (the credits) */
  #cs-caption.big { bottom: auto; top: 50%; transform: translate(-50%, -50%); width: min(1100px, 94vw);
    font: bold clamp(40px, 7vw, 96px)/1.15 Georgia, serif; color: #ffe6a8;
    text-shadow: 0 4px 24px rgba(255, 200, 90, .55), 0 2px 4px #000; }
  #cs-caption.big b { font-size: clamp(16px, 2vw, 26px); letter-spacing: .3em; margin-bottom: 18px; color: #fff6e0; }
  #cs-fade { position: fixed; inset: 0; background: #000; z-index: 39; opacity: 0;
    pointer-events: none; }
  #cs-skip { position: fixed; right: 18px; bottom: 3.5vh; z-index: 41; pointer-events: none;
    font: 13px system-ui; color: rgba(255,255,255,.6); display: none; }
  body.cs-film #cs-skip { display: block; }
  /* a line that's finished typing WAITS for you: the hint grows and glows */
  #cs-skip.wait { font: 900 18px 'Trebuchet MS', system-ui; color: #ffe08a; animation: cs-pulse 1.1s ease-in-out infinite; }
  @keyframes cs-pulse { 50% { opacity: .45; } }
`;
document.head.appendChild(style);
const barTop = Object.assign(document.createElement("div"), { className: "cs-bar top" });
const barBot = Object.assign(document.createElement("div"), { className: "cs-bar bot" });
const caption = Object.assign(document.createElement("div"), { id: "cs-caption" });
const fade = Object.assign(document.createElement("div"), { id: "cs-fade" });
const skipHint = Object.assign(document.createElement("div"), { id: "cs-skip" });
skipHint.textContent = "Space — next   ·   Esc — skip";
document.body.append(fade, barTop, barBot, caption, skipHint);

let shots = null; // the cutscene playing right now (null = none)
let idx = 0;
let t = 0; // seconds into the current shot
let typed = 0; // how many letters of the caption are showing
let fadeLevel = 0;
let resolveDone = null;
let cam = null; // the game camera (handed in by updateCutscene)
const from = new THREE.Vector3();
const to = new THREE.Vector3();
const lookA = new THREE.Vector3();
const lookB = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

/** Is a cutscene playing? (normal controls pause while one is) */
export const cutscenePlaying = () => shots !== null;

const read = (v) => (typeof v === "function" ? v() : v);
// a step of a movie must never be able to break it (and leave the screen black)
const safe = (fn, ...args) => {
  try {
    return fn(...args);
  } catch (err) {
    console.error("cutscene step failed:", err);
    return undefined;
  }
};
const ease = (k) => k * k * (3 - 2 * k);

function startShot() {
  const s = shots[idx];
  t = 0;
  typed = 0;
  s._ran = true;
  if (s.run) safe(s.run); // side effects first, so positions can depend on them
  document.body.classList.toggle("cs-film", s.bars !== false);
  if (!s.gameCam) {
    const f = read(s.from);
    from.copy(f ? tmpLook.fromArray(f) : cam.position);
    const tt = read(s.to);
    to.copy(tt ? tmpLook.fromArray(tt) : from);
    const lk = read(s.look);
    const la = read(s.lookFrom) || lk;
    const lb = read(s.lookTo) || lk;
    if (la) lookA.fromArray(la);
    else cam.getWorldDirection(lookA).multiplyScalar(5).add(cam.position);
    if (lb) lookB.fromArray(lb);
    else lookB.copy(lookA);
  }
  caption.classList.toggle("big", !!s.big);
  if (s.text) {
    caption.innerHTML = (s.who ? `<b>${s.who}</b>` : "") + "<span></span>";
    caption.classList.add("show");
  } else {
    caption.classList.remove("show");
  }
}

function endShot(s) {
  if (!s._ran) {
    s._ran = true;
    if (s.run) safe(s.run);
  }
  if (!s._ended) {
    s._ended = true;
    if (s.end) safe(s.end);
  }
}

function finish() {
  // anything skipped over still happens, in order, so the world ends up
  // where the story says it should
  for (let i = idx; i < shots.length; i++) endShot(shots[i]);
  shots = null;
  document.body.classList.remove("cs-film");
  caption.classList.remove("show");
  fadeLevel = 0;
  fade.style.opacity = "0";
  const r = resolveDone;
  resolveDone = null;
  if (r) r();
}

function next() {
  skipHint.classList.remove("wait");
  endShot(shots[idx]);
  idx++;
  if (idx >= shots.length) finish();
  else startShot();
}

/** Play a list of shots. Resolves when it's over (or skipped). */
// test hook: ?csat=3 starts every cutscene at shot 3 (for screenshots)
const CS_AT = parseInt(new URLSearchParams(location.search).get("csat") || "0", 10);

// 📖 the STORY's movies can't be skipped with Esc (Space still turns the page)
let noSkip = false;
export function playStoryCutscene(list) {
  return playCutscene(list, { noSkip: true });
}
export function playCutscene(list, opts = {}) {
  if (shots) return Promise.resolve(); // one movie at a time
  noSkip = true; // (no movie can be skipped with Esc — Space still turns the page)
  void opts;
  skipHint.textContent = "Space or E — next ▸";
  shots = list.map((s) => ({ ...s }));
  idx = 0;
  if (CS_AT >= shots.length) {
    // test hook asked to skip the whole movie
    for (const sh of shots) {
      if (sh.run) sh.run();
      if (sh.end) sh.end();
    }
    shots = null;
    return Promise.resolve();
  }
  if (CS_AT > 0) {
    // run the skipped shots' side effects, then start at the asked-for one
    for (let i = 0; i < Math.min(CS_AT, shots.length - 1); i++) {
      shots[i]._ran = shots[i]._ended = true;
      if (shots[i].run) shots[i].run();
      if (shots[i].end) shots[i].end();
    }
    idx = Math.min(CS_AT, shots.length - 1);
  }
  return new Promise((res) => {
    resolveDone = res;
    if (cam) startShot();
    else shots.pending = true; // first frame will start it
  });
}

window.addEventListener(
  "keydown",
  (e) => {
    if (!shots || shots.pending) return;
    if (e.code === "Escape") {
      if (!noSkip) finish(); // (story movies play to the end)
    } else if (e.code === "Space" || e.code === "KeyE" || e.code === "Enter") {
      if (e.repeat) return;
      const s = shots[idx];
      // first tap finishes the typing; the next one moves on
      if (s.text && typed < s.text.length) typed = s.text.length;
      else if (s.text) next();
    } else return;
    e.preventDefault();
    e.stopImmediatePropagation(); // the game doesn't see these keys during a movie
  },
  true // capture: run before the game's own key handlers
);

/**
 * Advance the movie. Call once per frame; returns true while a cutscene
 * owns the camera (the game should skip its own camera that frame).
 */
let lastNow = 0;
export function updateCutscene(_gameDt, camera) {
  cam = camera;
  // movies run on the real clock, so a slow frame never turns them into slow-motion
  const now = performance.now();
  // (the real clock — but never less than the game's own frame time, so a
  // stalled timer can't freeze a movie, or a fade, on the screen)
  const dt = Math.max(lastNow ? Math.min(0.25, (now - lastNow) / 1000) : 1 / 60, Math.min(0.05, _gameDt || 0), 1 / 120);
  lastNow = now;
  if (!shots) {
    // (safety: with no movie playing the screen is NEVER left black)
    if (fadeLevel > 0) {
      fadeLevel = Math.max(0, fadeLevel - dt * 2);
      fade.style.opacity = String(fadeLevel);
    }
    return false;
  }
  if (shots.pending) {
    shots.pending = false;
    startShot();
  }
  const s = shots[idx];
  t += dt;
  const dur = s.dur || 2;
  // safety net: no single shot may hold the screen for long (a stuck fade
  // to black would look like the game froze) — move on no matter what
  // (a shot with words in it never moves on by itself — only Space / E / Enter turns the page)
  if (!s.text && t > Math.max(12, dur * 3)) {
    next();
    return shots !== null;
  }
  const k = Math.min(1, t / dur);
  if (!s.gameCam) {
    const e = s.linear ? k : ease(k);
    camera.position.lerpVectors(from, to, e);
    tmpLook.lerpVectors(lookA, lookB, e);
    camera.lookAt(tmpLook);
  }
  if (s.update) safe(s.update, k, dt);

  // black fades: fadeOut darkens over the shot, fadeIn brightens from black
  if (s.fadeOut) fadeLevel = k;
  else if (s.fadeIn) fadeLevel = 1 - k;
  else if (s.black) fadeLevel = 1;
  else fadeLevel = Math.max(0, fadeLevel - dt * 3);
  fade.style.opacity = String(fadeLevel);

  // typewriter caption
  if (s.text) {
    typed = Math.min(s.text.length, typed + dt * 40);
    const span = caption.querySelector("span");
    if (span) span.textContent = s.text.slice(0, Math.floor(typed));
  }
  // 💬 a line of talking or telling WAITS until you press Space or E (no auto-advance)
  const owned = !s.gameCam;
  skipHint.classList.toggle("wait", !!s.text && typed >= s.text.length);
  if (!s.text && t >= dur) next();
  return owned;
}

/** A quick fade to black, `run` (e.g. change places), then fade back in. */
export function fadeThrough(run, secs = 0.4) {
  return playCutscene([
    { dur: secs, fadeOut: true, gameCam: true, bars: false, linear: true },
    { dur: secs, fadeIn: true, gameCam: true, bars: false, linear: true, run },
  ]);
}
