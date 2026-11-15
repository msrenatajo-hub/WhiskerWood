// ------------------------------------------------------------
//  ✨ THINGS THAT REALLY DO WHAT THEY SAY — open a bottle from your
//  backpack (B → ✨ use) and it happens, once:
//    ❄️ A Blizzard in a Bottle — a howling blizzard swirls all around you
//    ⚡ Thunder in a Bottle     — a thunderstorm: pouring rain, lightning, thunder
//    🌈 A Rainbow in a Jar      — a huge rainbow arcs across the sky
//    🌅 A Sunset in a Jar       — the sky turns to sunset, right now
// ------------------------------------------------------------
import * as THREE from "three";

/** pack key (lower-case name) → what happens when you use it */
export const USE = {};

export function initConjure(ctx) {
  // ctx: { scene, mouseRig, setWeather(kind), setTimeOfDay(t), say(msg) }
  const effects = [];

  // ❄️ the blizzard: thousands of flakes, blowing sideways, all round you
  function blizzard() {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    const vel = [];
    const C = ctx.mouseRig.position;
    for (let i = 0; i < N; i++) {
      pos[i * 3] = C.x + (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = C.y + Math.random() * 28;
      pos[i * 3 + 2] = C.z + (Math.random() - 0.5) * 70;
      vel.push(5 + Math.random() * 6, 3 + Math.random() * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, transparent: true, opacity: 0.95, depthWrite: false }));
    pts.frustumCulled = false;
    ctx.scene.add(pts);
    ctx.setWeather("cloudy");
    let t = 0;
    effects.push((dt) => {
      t += dt;
      const p = ctx.mouseRig.position;
      const fade = t < 2 ? t / 2 : t > 40 ? Math.max(0, (45 - t) / 5) : 1;
      pts.material.opacity = 0.95 * fade;
      for (let i = 0; i < N; i++) {
        let x = pos[i * 3] + vel[i * 2] * dt + Math.sin(t * 2 + i) * dt * 2;
        let y = pos[i * 3 + 1] - vel[i * 2 + 1] * dt;
        let z = pos[i * 3 + 2] + Math.cos(t + i * 0.3) * dt * 3;
        // keep the storm round you as you walk
        if (y < p.y - 1) y += 28;
        if (x > p.x + 35) x -= 70;
        if (x < p.x - 35) x += 70;
        if (z > p.z + 35) z -= 70;
        if (z < p.z - 35) z += 70;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
      if (t > 45) {
        ctx.scene.remove(pts);
        geo.dispose();
        return true;
      }
    });
    ctx.say("❄️ You pull the cork — and a BLIZZARD bursts out of the bottle! Snow whirls and howls all around you!", true);
  }

  // ⚡ the thunderstorm: rain + lightning flashes + rumbles
  function thunder() {
    ctx.setWeather("rain");
    const flash = document.createElement("div");
    flash.style.cssText = "position:fixed;inset:0;background:#eef4ff;pointer-events:none;z-index:20;opacity:0;transition:opacity .08s";
    document.body.appendChild(flash);
    let t = 0, next = 1;
    const rumble = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const len = ac.sampleRate * 2.2;
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const src = ac.createBufferSource();
        src.buffer = buf;
        const lp = ac.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 180;
        const g = ac.createGain();
        g.gain.value = 0.9;
        src.connect(lp).connect(g).connect(ac.destination);
        src.start();
        setTimeout(() => ac.close(), 2600);
      } catch {}
    };
    effects.push((dt) => {
      t += dt;
      next -= dt;
      if (next <= 0 && t < 38) {
        next = 2 + Math.random() * 4;
        flash.style.opacity = "0.85";
        setTimeout(() => (flash.style.opacity = "0"), 90);
        setTimeout(() => (flash.style.opacity = "0.6"), 180);
        setTimeout(() => (flash.style.opacity = "0"), 260);
        setTimeout(rumble, 300 + Math.random() * 600);
      }
      if (t > 40) {
        flash.remove();
        ctx.setWeather("clear");
        return true;
      }
    });
    ctx.say("⚡ You uncork the bottle — CRACK! Black clouds pour out and a THUNDERSTORM breaks over your head!", true);
  }

  // 🌈 the rainbow: a great arc in the sky in front of you
  function rainbow() {
    ctx.setWeather("clear");
    const g = new THREE.Group();
    [0xff3a3a, 0xff9a2a, 0xffe03a, 0x4ad84a, 0x3a8aff, 0x8a4aff].forEach((c, i) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(90 - i * 2.4, 1.2, 6, 90, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      g.add(arc);
    });
    const p = ctx.mouseRig.position;
    const f = ctx.mouseRig.rotation.y;
    g.position.set(p.x + Math.sin(f) * 140, p.y - 10, p.z + Math.cos(f) * 140);
    g.rotation.y = f;
    ctx.scene.add(g);
    let t = 0;
    effects.push((dt) => {
      t += dt;
      const o = t < 3 ? t / 3 : t > 85 ? Math.max(0, (90 - t) / 5) : 1;
      g.children.forEach((m) => (m.material.opacity = 0.6 * o));
      if (t > 90) {
        ctx.scene.remove(g);
        return true;
      }
    });
    ctx.say("🌈 You open the jar… and a RAINBOW spills out, climbs into the sky and arcs right across it!", true);
  }

  function sunset() {
    ctx.setTimeOfDay(0.74);
    ctx.say("🌅 You open the jar — and the whole sky blushes gold and orange. It's SUNSET!", true);
  }

  USE["a blizzard in a bottle"] = { icon: "❄️", act: blizzard };
  USE["thunder in a bottle"] = { icon: "⚡", act: thunder };
  USE["a rainbow in a jar"] = { icon: "🌈", act: rainbow };
  USE["a sunset in a jar"] = { icon: "🌅", act: sunset };
  USE["a night in a jar"] = { icon: "🌌", act: () => {
    ctx.setTimeOfDay(0.92);
    ctx.say("🌌 You pull the cork — darkness pours out and fills the sky, and every star in it comes out at once. It's NIGHT.", true);
  } };

  return {
    update(dt) {
      for (let i = effects.length - 1; i >= 0; i--) if (effects[i](dt)) effects.splice(i, 1);
    },
  };
}
