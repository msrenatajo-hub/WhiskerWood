// ------------------------------------------------------------
//  ⛸️  REAL ICE SKATING
//
//  With Ice Skates on any ice (Frostpine's Frozen Lake, the Starlight Pass,
//  the Aurora Reach, frozen ponds in winter):
//    W         push off — left foot, right foot… each push adds speed
//    A / D     lean and CARVE (your blades bite in — turn too sharp at
//              speed and you skid… and fall!)
//    S         HOCKEY STOP — a shower of sparkly ice (or skate backwards)
//    Space     a little hop · Space again in the air = an AXEL (1½ turns!)
//    Shift     slow → SPIN on the spot · fast → tuck low and glide further
//    F         a SPIRAL — one leg high behind you, arms out wide
//  You keep gliding with real momentum, slowing a little at a time, and
//  your blades leave scratchy tracks in the ice. Cracks make you wobble.
// ------------------------------------------------------------
import * as THREE from "three";
import { glowTexture } from "./phase2.js";

export const SKATE_COLORS = [
  { key: "pink", name: "Rose Pink", color: 0xf28ab8 },
  { key: "white", name: "Snow White", color: 0xf4f4f8 },
  { key: "sky", name: "Sky Blue", color: 0x8ac8f0 },
  { key: "lilac", name: "Lilac", color: 0xc4a8e8 },
  { key: "mint", name: "Mint", color: 0x9ae0c0 },
  { key: "gold", name: "Gold", color: 0xe8c050 },
  { key: "red", name: "Cherry Red", color: 0xd84a4a },
  { key: "black", name: "Midnight", color: 0x2a2a34 },
];

export function initSkating(env) {
  // env: { mouseRig, quadMouse(), baseY(), isHeld(...codes), say, group(), look() → { color, ribbon }, cracks() → [{x,z,r}], onTrick(name, n) }
  const S = {
    on: false,
    vx: 0,
    vz: 0,
    pushT: 0,
    foot: 0,
    strideT: 0,
    lean: 0,
    spin: 0, // radians/sec while spinning
    spinAng: 0,
    axelT: 0,
    axelAng: 0,
    fallT: 0,
    wobT: 0,
    braking: false,
    brakeFrom: 0,
    wasGround: true,
    spiral: 0,
    trackD: 0,
    crackCool: 0,
  };
  const speed = () => Math.hypot(S.vx, S.vz);
  const trick = (k, n = 1) => env.onTrick && env.onTrick(k, n);

  // ---------------------------------------------------------------- sounds (a little synth: no files)
  let ac = null, glideGain = null, noiseBuf = null;
  function audio() {
    if (ac) return ac;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // the steady swish of blades gliding
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 3200;
      bp.Q.value = 0.8;
      glideGain = ac.createGain();
      glideGain.gain.value = 0;
      src.connect(bp).connect(glideGain).connect(ac.destination);
      src.start();
    } catch {
      ac = null;
    }
    return ac;
  }
  function burst(freq, dur, vol, type = "highpass") {
    if (!audio() || ac.state !== "running") return;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ac.createGain();
    const t = ac.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }
  window.addEventListener("keydown", () => ac && ac.state === "suspended" && ac.resume(), true);

  // ---------------------------------------------------------------- 🥾 the skates on your feet
  let boots = null;
  function dressBoots(on) {
    const q = env.quadMouse();
    if (!q || !q.userData.legL) return;
    const L = env.look();
    const key = L.color + ":" + (L.ribbon ? 1 : 0);
    if (!boots || boots.key !== key) {
      if (boots) boots.parts.forEach((p) => p.parent && p.parent.remove(p));
      const parts = [];
      for (const hip of [q.userData.legL, q.userData.legR]) {
        const g = new THREE.Group();
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.17), new THREE.MeshStandardMaterial({ color: L.color, roughness: 0.6, flatShading: true }));
        boot.position.set(0, -0.215, 0.04);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.035, 0.22), new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 0.8, roughness: 0.25 }));
        blade.position.set(0, -0.272, 0.04);
        g.add(boot, blade);
        if (L.ribbon) {
          const bow = new THREE.Group();
          const m = new THREE.MeshStandardMaterial({ color: 0xff7ab8, flatShading: true });
          for (const sx of [-1, 1]) {
            const loop = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 6), m);
            loop.rotation.z = sx * Math.PI / 2;
            loop.position.x = sx * 0.035;
            bow.add(loop);
          }
          bow.position.set(0, -0.17, 0.12);
          g.add(bow);
        }
        hip.add(g);
        parts.push(g);
      }
      boots = { key, parts };
    }
    boots.parts.forEach((p) => (p.visible = on));
  }

  // ---------------------------------------------------------------- ❄️ ice spray + skate tracks
  const spray = [];
  function puff(x, y, z, n, power = 1) {
    const grp = env.group();
    if (!grp) return;
    for (let i = 0; i < n; i++) {
      let p = spray.find((s) => s.life <= 0);
      if (!p) {
        if (spray.length > 140) break;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xf0f8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        p = { sp, life: 0 };
        spray.push(p);
      }
      if (p.sp.parent !== grp) grp.add(p.sp);
      const a = Math.random() * Math.PI * 2;
      const v = (1 + Math.random() * 2.5) * power;
      p.sp.position.set(x, y + 0.05, z);
      p.vx = Math.cos(a) * v + S.vx * 0.15;
      p.vz = Math.sin(a) * v + S.vz * 0.15;
      p.vy = 1.5 + Math.random() * 2.5 * power;
      p.life = p.max = 0.45 + Math.random() * 0.35;
      p.sp.scale.setScalar(0.12 + Math.random() * 0.14);
      p.sp.visible = true;
    }
  }
  function sprayStep(dt) {
    for (const p of spray) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy -= 9 * dt;
      p.sp.position.x += p.vx * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += p.vz * dt;
      p.sp.material.opacity = Math.max(0, p.life / p.max);
      if (p.life <= 0) p.sp.visible = false;
    }
  }
  const tracks = [];
  let trackI = 0;
  const trackMat = new THREE.MeshBasicMaterial({ color: 0xc8d8e8, transparent: true, opacity: 0.6, depthWrite: false });
  const trackGeo = new THREE.PlaneGeometry(0.035, 0.36);
  trackGeo.rotateX(-Math.PI / 2);
  function addTrack(x, y, z, yaw) {
    const grp = env.group();
    if (!grp) return;
    let t = tracks[trackI];
    if (!t) {
      t = { m: new THREE.Mesh(trackGeo, trackMat.clone()), born: 0 };
      tracks[trackI] = t;
    }
    trackI = (trackI + 1) % 320;
    if (t.m.parent !== grp) grp.add(t.m);
    t.m.position.set(x, y + 0.015, z);
    t.m.rotation.y = yaw;
    t.m.visible = true;
    t.born = performance.now();
  }
  function trackStep() {
    const now = performance.now();
    for (const t of tracks) {
      if (!t || !t.m.visible) continue;
      const age = (now - t.born) / 1000;
      t.m.material.opacity = Math.max(0, 0.6 * (1 - age / 45));
      if (age > 45) t.m.visible = false;
    }
  }

  // ---------------------------------------------------------------- start / stop
  function start(initialSpeed) {
    if (S.on) return;
    S.on = true;
    const yaw = env.mouseRig.rotation.y;
    S.vx = Math.sin(yaw) * initialSpeed;
    S.vz = Math.cos(yaw) * initialSpeed;
    S.fallT = S.axelT = S.spin = 0;
    S.pushT = 0;
    dressBoots(true);
    audio();
  }
  function stop() {
    if (!S.on) return;
    S.on = false;
    S.spin = S.spinAng = S.axelT = S.fallT = 0;
    dressBoots(false);
    if (glideGain) glideGain.gain.value = 0;
  }

  // ---------------------------------------------------------------- each frame (while skating)
  function step(dt, I) {
    // I: { onGround, push (W), brake (S), shift, spiral (F) }
    const rig = env.mouseRig;
    const p = rig.position;
    const yaw = rig.rotation.y;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    let sp = speed();
    S.crackCool -= dt;

    // 💫 fallen over: wait to get back up
    if (S.fallT > 0) {
      S.fallT -= dt;
      S.vx *= Math.exp(-dt * 3);
      S.vz *= Math.exp(-dt * 3);
      p.x += S.vx * dt;
      p.z += S.vz * dt;
      sprayStep(dt);
      trackStep();
      if (glideGain) glideGain.gain.value = 0;
      return;
    }

    // ⬆️ push off, one foot then the other
    S.pushT -= dt;
    S.strideT = Math.max(0, S.strideT - dt * 2.6);
    if (I.push && I.onGround && S.pushT <= 0 && !S.spin) {
      const gain = 5.2 * Math.max(0.15, 1 - sp / 34);
      S.vx += fx * gain;
      S.vz += fz * gain;
      S.pushT = 0.42;
      S.foot ^= 1;
      S.strideT = 1;
      burst(2600, 0.16, 0.05);
      trick("push");
    }

    // 🛑 S: hockey stop (fast) — or skate slowly backwards (stopped)
    sp = speed();
    if (I.brake && I.onGround) {
      if (sp > 2.2) {
        if (!S.braking) {
          S.braking = true;
          S.brakeFrom = sp;
          burst(1800, 0.55, 0.09, "bandpass");
        }
        const k = Math.max(0, sp - 30 * dt) / sp;
        S.vx *= k;
        S.vz *= k;
        if (Math.random() < 0.8) puff(p.x + fx * 0.15, p.y, p.z + fz * 0.15, 2, 1.2);
      } else {
        S.vx += (-fx * 3 - S.vx) * Math.min(1, dt * 2);
        S.vz += (-fz * 3 - S.vz) * Math.min(1, dt * 2);
      }
    } else if (S.braking) {
      S.braking = false;
      if (S.brakeFrom > 10 && speed() < 3) {
        trick("hockey");
        puff(p.x, p.y, p.z, 14, 1.6);
      }
    }

    // ↪️ carving: your blades pull your glide round to where you're facing
    sp = speed();
    let diff = 0;
    if (sp > 0.3) {
      const va = Math.atan2(S.vx, S.vz);
      diff = Math.atan2(Math.sin(yaw - va), Math.cos(yaw - va));
      const backwards = Math.abs(diff) > 2.4 && I.brake; // (skating backwards on purpose)
      if (!backwards) {
        if (sp < 3) {
          // slow: just go where you face
          S.vx = fx * sp;
          S.vz = fz * sp;
          diff = 0;
        } else {
          // skid! turned far too sharply at speed
          if (Math.abs(diff) > 1.3 && sp > 13 && I.onGround) return fall("You turned too sharply and your blades skid out from under you");
          const grip = (I.shift ? 2.2 : 3.4) * dt;
          const turn = Math.max(-grip, Math.min(grip, diff));
          const na = va + turn;
          const loss = Math.abs(turn) * 0.9; // (carving costs a little speed)
          const ns = sp * (1 - loss * 0.12);
          S.vx = Math.sin(na) * ns;
          S.vz = Math.cos(na) * ns;
          if (Math.abs(diff) > 0.35 && sp > 7 && I.onGround) {
            if (Math.random() < 0.35) puff(p.x, p.y, p.z, 1, 0.6);
            trick("carve", dt);
          }
        }
      }
    }
    S.lean += ((Math.max(-0.5, Math.min(0.5, diff * 0.6)) * Math.min(1, sp / 10)) - S.lean) * Math.min(1, dt * 6);

    // 🌀 Shift: spin on the spot (slow) · tuck and glide (fast)
    sp = speed();
    const tuck = I.shift && sp >= 3;
    if (I.shift && sp < 3 && I.onGround) {
      S.spin = Math.min(15, S.spin + dt * 10);
      S.vx *= Math.exp(-dt * 4);
      S.vz *= Math.exp(-dt * 4);
      trick("spin", dt);
    } else S.spin = Math.max(0, S.spin - dt * 18);
    S.spinAng += S.spin * dt;
    if (!S.spin) S.spinAng = 0;

    // 🦢 F: the spiral (only while gliding)
    S.spiral += ((I.spiral && !S.spin ? 1 : 0) - S.spiral) * Math.min(1, dt * 5);
    if (S.spiral > 0.8 && I.onGround && sp > 4) trick("spiral", dt); // (the judges count spirals while you GLIDE)

    // the glide itself — ice is slippery, so you slow only a little at a time
    const friction = I.brake ? 0 : tuck ? 0.045 : S.spiral > 0.5 ? 0.07 : 0.11;
    S.vx *= Math.exp(-dt * friction);
    S.vz *= Math.exp(-dt * friction);
    if (S.spin === 0 && speed() > 38) {
      const k = 38 / speed();
      S.vx *= k;
      S.vz *= k;
    }
    p.x += S.vx * dt;
    p.z += S.vz * dt;
    sp = speed();
    if (sp > 2) trick("glide", sp * dt);

    // 🦘 hops and axels
    if (S.wasGround && !I.onGround) trick("hop");
    if (!S.wasGround && I.onGround) {
      if (S.axelT > 0 || S.axelLanding) {
        S.axelLanding = false;
        trick("axel");
        env.say(["⛸️ A perfect AXEL!", "⛸️ AXEL — and a clean landing!", "⛸️ Whoosh — AXEL!"][Math.floor(Math.random() * 3)]);
      }
      puff(p.x, p.y, p.z, 6, 0.8);
      burst(900, 0.12, 0.08, "lowpass");
    }
    S.wasGround = I.onGround;
    if (S.axelT > 0) {
      S.axelT = Math.max(0, S.axelT - dt * 1.7);
      S.axelAng = (1 - S.axelT) * Math.PI * 3;
      if (S.axelT === 0) S.axelAng = 0;
    }

    // ⚡ cracks in the ice: a wobble… or a tumble
    if (S.crackCool <= 0 && I.onGround && sp > 9) {
      const c = (env.cracks() || []).find((k) => Math.hypot(p.x - k.x, p.z - k.z) < k.r);
      if (c) {
        S.crackCool = 1.2;
        if (sp > 21) return fall("Your blade catches a crack in the ice");
        S.wobT = 1;
        S.vx *= 0.75;
        S.vz *= 0.75;
        burst(700, 0.2, 0.08, "lowpass");
        env.say("⛸️ Whoa — a crack in the ice! You wobble… and stay up!");
      }
    }
    S.wobT = Math.max(0, S.wobT - dt * 1.8);

    // scratchy tracks, and the swish of the blades
    if (I.onGround && sp > 1.5) {
      S.trackD += sp * dt;
      if (S.trackD > 0.32) {
        S.trackD = 0;
        const va = Math.atan2(S.vx, S.vz);
        const side = (S.foot ? 1 : -1) * 0.06;
        addTrack(p.x + Math.cos(va) * side, p.y, p.z - Math.sin(va) * side, va);
      }
    }
    if (glideGain) glideGain.gain.value += ((I.onGround && sp > 1 ? Math.min(0.09, sp * 0.0035) : 0) - glideGain.gain.value) * Math.min(1, dt * 8);
    sprayStep(dt);
    trackStep();
  }
  function fall(why) {
    S.fallT = 1.5;
    S.spin = 0;
    S.axelT = 0;
    const p = env.mouseRig.position;
    puff(p.x, p.y, p.z, 18, 1.4);
    burst(500, 0.35, 0.12, "lowpass");
    trick("fall");
    env.say(`⛸️ WHOOPS! ${why} — down you go! (You'll be back up in a moment.)`);
  }
  // the second Space, in the air: an axel
  function axel() {
    if (S.fallT > 0) return;
    S.axelT = 1;
    S.axelLanding = true;
  }

  // ---------------------------------------------------------------- the skater's pose
  function pose(dt, q) {
    if (!S.on) return false;
    const u = q.userData;
    const t = performance.now() / 1000;
    q.position.y += (env.baseY() - q.position.y) * Math.min(1, dt * 10);
    if (u.head) u.head.rotation.x = 0;
    if (S.fallT > 0) {
      // 💫 flat on your side on the ice, legs in the air
      q.rotation.set(0.2, 0, 1.35);
      if (u.legL) {
        u.legL.rotation.x = -0.8 + Math.sin(t * 9) * 0.3;
        u.legR.rotation.x = 0.5 - Math.sin(t * 9) * 0.3;
      }
      if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -2;
      return true;
    }
    const wob = S.wobT > 0 ? Math.sin(t * 30) * 0.25 * S.wobT : 0;
    if (S.axelT > 0) {
      // 🌀 the axel: arms tucked in tight, spinning in the air
      q.rotation.set(0.05, S.axelAng, 0);
      if (u.legL) u.legL.rotation.x = u.legR.rotation.x = 0.15;
      if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -1.3;
      return true;
    }
    if (S.spin > 0.5) {
      // 🌀 the spin: arms up high, spinning faster and faster
      q.rotation.set(0, S.spinAng, 0);
      if (u.legL) {
        u.legL.rotation.x = 0;
        u.legR.rotation.x = -0.25;
      }
      if (u.armL) u.armL.rotation.x = u.armR.rotation.x = -2.7;
      return true;
    }
    if (S.spiral > 0.3) {
      // 🦢 the spiral: leaning forward, one leg stretched high behind
      q.rotation.set(0.55 * S.spiral, 0, S.lean * 0.6 + wob);
      if (u.legL) {
        u.legL.rotation.x = -0.1;
        u.legR.rotation.x = 1.6 * S.spiral;
      }
      if (u.armL) {
        u.armL.rotation.x = -1.4;
        u.armR.rotation.x = -1.4;
      }
      if (u.head) u.head.rotation.x = -0.4 * S.spiral;
      return true;
    }
    // gliding: knees soft, leaning into the turns, pushing off foot by foot
    const sv = S.strideT;
    q.rotation.set(0.18, 0, S.lean + wob);
    if (u.legL) {
      const back = Math.sin(sv * Math.PI) * 0.9;
      u.legL.rotation.x = S.foot === 0 ? back : -0.1;
      u.legR.rotation.x = S.foot === 1 ? back : -0.1;
    }
    if (u.armL) {
      // arms out for balance, swinging with each push
      u.armL.rotation.x = -0.6 + (S.foot ? 0.3 : -0.3) * sv;
      u.armR.rotation.x = -0.6 + (S.foot ? -0.3 : 0.3) * sv;
    }
    if (u.tail) u.tail.rotation.y = -S.lean * 0.8;
    return true;
  }

  return { start, stop, step, axel, pose, on: () => S.on, speed, falling: () => S.fallT > 0, fall };
}
