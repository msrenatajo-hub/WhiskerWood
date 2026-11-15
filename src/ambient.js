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

  // --- WATER, in layers (all from noise — no sound files) ---
  //   body:  deep brown noise, low-passed — the weight of moving water
  //   rush:  bright white noise, band-limited — the hiss of a running stream
  //   roar:  both, much louder and fuller — a waterfall pounding the pool
  //   + little rising "plip" bubbles (see bubble()) so streams babble
  const noiseBuf = (brown) => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + w * 0.04) * 0.99;
        d[i] = last * 5;
      } else d[i] = w * 0.5;
    }
    return b;
  };
  const loop = (buf) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.start(0, Math.random() * 3);
    return src;
  };
  const filter = (type, f, q = 0.7) => {
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    return fl;
  };
  const brown = noiseBuf(true);
  const white = noiseBuf(false);

  // the stream: body + rush, with a slow wobble so it never sounds static
  waterGain = ctx.createGain();
  waterGain.gain.value = 0;
  waterGain.connect(master);
  const body = loop(brown);
  const bodyLp = filter("lowpass", 520);
  body.connect(bodyLp).connect(waterGain);
  const rush = loop(white);
  const rushHp = filter("highpass", 700);
  const rushLp = filter("lowpass", 3800);
  const rushGain = ctx.createGain();
  rushGain.gain.value = 0.35;
  rush.connect(rushHp).connect(rushLp).connect(rushGain).connect(waterGain);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.31;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 600;
  lfo.connect(lfoGain).connect(rushLp.frequency);
  lfo.start();

  // the BABBLE of a little brook: a real recording, looped
  // ("Babbling Brook Sounds", Orange Free Sounds, CC BY 4.0 — see
  // public/audio/CREDITS.txt)
  babbleGain = ctx.createGain();
  babbleGain.gain.value = 0;
  babbleGain.connect(master);
  fetch("/audio/babbling-brook.mp3")
    .then((r) => r.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buf) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(babbleGain);
      src.start(0, Math.random() * buf.duration); // start somewhere in the middle
    })
    .catch(() => {}); // no recording? the rushing water still plays

  // the waterfall roar
  fallsGain = ctx.createGain();
  fallsGain.gain.value = 0;
  fallsGain.connect(master);
  const thunder = loop(brown);
  thunder.connect(filter("lowpass", 900)).connect(fallsGain);
  const spray = loop(white);
  const sprayGain = ctx.createGain();
  sprayGain.gain.value = 0.55;
  spray.connect(filter("bandpass", 1500, 0.35)).connect(sprayGain).connect(fallsGain);
}

let fallsGain = null;
let babbleGain = null;
let babbleLevel = 0;
let fallsLevel = 0;
let bubbleTimer = 0;
/** One water bubble: a tiny rising "plip". */
function bubble(level) {
  const t0 = ctx.currentTime + 0.01;
  const f = 380 + Math.random() * 700;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f, t0);
  osc.frequency.exponentialRampToValueAtTime(f * (1.6 + Math.random() * 0.8), t0 + 0.06);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(0.02 * level, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.1);
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
 * water (0..1: how close running water is), falls (0..1: how close a
 * waterfall is) }. Call every frame with dt in seconds.
 */
export function updateAmbient(dt, env) {
  if (!ctx || muted) return;

  // running water swells smoothly as you get closer (env.water: 0..1)
  const want = env.water !== undefined ? env.water : env.outside && env.nearWater ? 1 : 0;
  waterLevel += (want - waterLevel) * Math.min(1, dt * 2);
  if (waterGain) waterGain.gain.value = waterLevel * 0.16;
  // …and babbles: little bubbles, quicker the closer you are
  bubbleTimer -= dt;
  if (bubbleTimer <= 0 && waterLevel > 0.15 && (env.brook || 0) < 0.3) {
    bubble(waterLevel);
    bubbleTimer = 0.05 + Math.random() * (0.5 / waterLevel);
  }
  // a brook BABBLES (env.brook: 0..1) — the recording swells as you near it
  babbleLevel += ((env.brook || 0) - babbleLevel) * Math.min(1, dt * 2);
  if (babbleGain) babbleGain.gain.value = babbleLevel * 0.85;
  // the waterfalls ROAR when you're near (env.falls: 0..1)
  fallsLevel += ((env.falls || 0) - fallsLevel) * Math.min(1, dt * 2);
  if (fallsGain) fallsGain.gain.value = fallsLevel * 0.42;

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
