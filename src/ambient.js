// ============================================================
//  WhiskerWood — AMBIENT SOUND 🎶
//  Everything here is SYNTHESIZED live with WebAudio — no files:
//   • soft mellow music (gentle pentatonic pads, always)
//   • birdsong by day, cricket-chirp by night (outside only)
//   • water babbling that swells as you near the creek/pond/brooks
//  Browsers only allow audio after a user gesture, so we arm the
//  engine on the first key press / click.
// ============================================================

let ctx = null;
let master = null;
let waterGain = null;
let muted = false;
let birdTimer = 2;
let cricketTimer = 1;
let musicTimer = 2.5;
let waterLevel = 0; // smoothed 0..1

function ensureContext() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.55;
  master.connect(ctx.destination);

  // --- the brook: looping noise through a watery band-pass filter ---
  const seconds = 2;
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // brown-ish noise reads as moving water better than white
    last = (last + (Math.random() * 2 - 1) * 0.04) * 0.985;
    data[i] = last * 6;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 620;
  band.Q.value = 0.8;
  // a slow wobble on the filter = the burble
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 2.7;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain);
  lfoGain.connect(band.frequency);
  lfo.start();
  waterGain = ctx.createGain();
  waterGain.gain.value = 0;
  src.connect(band);
  band.connect(waterGain);
  waterGain.connect(master);
  src.start();
}

/** One soft blip with an envelope — the building block of everything. */
function blip(freq, when, dur, peak, type = "sine", glideTo = null) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, when + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(peak, when + Math.min(0.03, dur * 0.3));
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(env);
  env.connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

/** A little birdsong phrase: two to four bright falling whistles. */
function birdsong() {
  const t0 = ctx.currentTime + 0.02;
  const base = 2300 + Math.random() * 900;
  const notes = 2 + (Math.random() * 3) | 0;
  for (let i = 0; i < notes; i++) {
    const f = base * (0.9 + Math.random() * 0.25);
    blip(f, t0 + i * (0.13 + Math.random() * 0.06), 0.11, 0.03, "sine", f * 0.75);
  }
}

/** A cricket: three quick pulses, high and dry. */
function cricketChirp() {
  const t0 = ctx.currentTime + 0.02;
  for (let i = 0; i < 3; i++) blip(4300 + Math.random() * 250, t0 + i * 0.07, 0.03, 0.012, "triangle");
}

/** The mellow music: a slow two-note pad from the pentatonic scale. */
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
function musicPad() {
  const t0 = ctx.currentTime + 0.02;
  const root = SCALE[(Math.random() * SCALE.length) | 0] * 0.5; // low and soft
  const second = SCALE[(Math.random() * SCALE.length) | 0] * 0.5;
  for (const f of [root, second]) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f * (1 + (Math.random() - 0.5) * 0.002);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(0.035, t0 + 1.4);
    env.gain.linearRampToValueAtTime(0.0001, t0 + 4.2);
    osc.connect(env);
    env.connect(master);
    osc.start(t0);
    osc.stop(t0 + 4.4);
  }
}

/** Arm the engine on the first gesture (browsers require it). */
export function initAmbientAudio() {
  const arm = () => {
    ensureContext();
    if (ctx && ctx.state === "suspended") ctx.resume();
  };
  window.addEventListener("keydown", arm, { once: false });
  window.addEventListener("pointerdown", arm, { once: false });
}

export function setAmbientMuted(m) {
  muted = m;
  if (master) master.gain.value = muted ? 0 : 0.55;
}

export function ambientMuted() {
  return muted;
}

/**
 * Tick the soundscape. env = { outside, dayF (0..1), nightF (0..1),
 * nearWater (bool) }. Call every frame with dt in seconds.
 */
export function updateAmbient(dt, env) {
  if (!ctx || muted) return;

  // the brook fades in as you approach any water
  waterLevel += ((env.outside && env.nearWater ? 1 : 0) - waterLevel) * Math.min(1, dt * 1.6);
  if (waterGain) waterGain.gain.value = waterLevel * 0.09;

  // birdsong in the daylight
  birdTimer -= dt;
  if (birdTimer <= 0 && env.outside && env.dayF > 0.35) {
    birdsong();
    birdTimer = 2.5 + Math.random() * 7;
  }
  // crickets after dark
  cricketTimer -= dt;
  if (cricketTimer <= 0 && env.outside && env.nightF > 0.45) {
    cricketChirp();
    cricketTimer = 0.4 + Math.random() * 0.7;
  }
  // the soft music, wherever you are
  musicTimer -= dt;
  if (musicTimer <= 0) {
    musicPad();
    musicTimer = 5 + Math.random() * 7;
  }
}
