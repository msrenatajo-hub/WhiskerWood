// ------------------------------------------------------------
//  🕳️  THE MOONKEEPER TUNNELS — a secret network under Everbough.
//
//  A hole hidden between Everbough's roots drops you into a maze of
//  ancient, hand-dug tunnels. Nobody has walked them in centuries.
//  Chambers (round rooms) are linked by winding tunnels:
//
//      Root Landing ── Glowworm Gallery ── Underground Stream ── Well Passage
//           │                                   │                (up into the
//      Mushroom Grotto ── Moonkeeper Archive ───┘                 Old Well cave)
//                               │
//                          Sealed Door   (Roothaven's crest… it won't open. Yet.)
//
//  HOW IT'S BUILT: every wall is drawn from the INSIDE only (BackSide), so
//  where a tunnel pokes into a room, its outside is simply invisible — no
//  fiddly hole-cutting. Rooms leave gaps in their walls where tunnels join.
//  All the rock is merged into a handful of meshes, and there are just four
//  lights (one is Thistle's own little lantern glow), so it stays fast.
//
//  WALKING: the floor is flat (y = 0). You can stand anywhere inside a room
//  circle or a tunnel "capsule"; constrain() pushes you back if you stray.
// ------------------------------------------------------------
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TUBE_R = 2.4; // tunnel radius
const TUBE_SQUASH = 0.85; // tunnels are a little wider than tall
const TUBE_CY = 1.2; // tunnel center height (its bottom is buried under the floor)
const WALK_R = 1.5; // how far from a tunnel's middle you can walk
const WALL_H = 5.5; // room wall height (then a dome on top)
const ROOM_PAD = 1.2; // keep this far from a room's wall

// The rooms. x/z in tunnel-world units (the mouse walks ~8 units/second).
export const TUNNEL_ROOMS = {
  landing: { x: 0, z: 0, r: 8, name: "Root Landing" },
  glow: { x: -36, z: -26, r: 10, name: "Glowworm Gallery" },
  grotto: { x: 34, z: -30, r: 9, name: "Mushroom Grotto" },
  archive: { x: 4, z: -68, r: 11, name: "Moonkeeper Archive" },
  stream: { x: -44, z: -76, r: 10, name: "Underground Stream" },
  well: { x: -78, z: -112, r: 6.5, name: "Well Passage" },
  door: { x: 46, z: -100, r: 7, name: "The Sealed Door" },
};
const LINKS = [
  ["landing", "glow", 5],
  ["landing", "grotto", -6],
  ["glow", "stream", 7],
  ["grotto", "archive", 6],
  ["archive", "stream", -5],
  ["stream", "well", 4],
  ["archive", "door", -4],
];

// tiny deterministic noise so the rock is lumpy the same way every time
function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function lumpy(geo, amp) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // round so seam vertices (same spot, different index) move together
    const k = (hash3(Math.round(v.x * 4), Math.round(v.y * 4), Math.round(v.z * 4)) - 0.5) * 2 * amp;
    pos.setXYZ(i, v.x + nor.getX(i) * k, v.y + nor.getY(i) * k, v.z + nor.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}
// strip to the attributes every piece shares, so they can all merge
function clean(geo) {
  const g = geo.index ? geo : geo;
  for (const name of Object.keys(g.attributes)) {
    if (name !== "position" && name !== "normal") g.deleteAttribute(name);
  }
  return g;
}

export function buildTunnels() {
  const group = new THREE.Group();
  group.visible = false;

  // --- materials ---
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5e4432, roughness: 1, flatShading: true, side: THREE.BackSide });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3f2d20, roughness: 1, flatShading: true });
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x7a5636, roughness: 1, flatShading: true });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x77736a, roughness: 1, flatShading: true });
  const pieces = { wall: [], floor: [], root: [], stone: [] };
  const put = (kind, geo, m4) => {
    if (m4) geo.applyMatrix4(m4);
    pieces[kind].push(clean(geo.index ? geo.toNonIndexed() : geo));
  };
  const M = new THREE.Matrix4();
  const at = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) =>
    M.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry),
      new THREE.Vector3(sx, sy, sz)
    ).clone();

  // --- walking shapes (for constrain) ---
  const discs = [];
  const caps = [];
  const doorways = {}; // room key -> [angle…] where tunnels join

  // ---------- TUNNELS ----------
  for (const [a, b, bend] of LINKS) {
    const A = TUNNEL_ROOMS[a];
    const B = TUNNEL_ROOMS[b];
    const dx = B.x - A.x;
    const dz = B.z - A.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    // leave each room straight out through its wall, then wander a bit
    const midX = (A.x + B.x) / 2 - uz * bend;
    const midZ = (A.z + B.z) / 2 + ux * bend;
    const pts = [
      new THREE.Vector3(A.x + ux * (A.r - 0.5), 0, A.z + uz * (A.r - 0.5)),
      new THREE.Vector3(A.x + ux * (A.r + 3), 0, A.z + uz * (A.r + 3)),
      new THREE.Vector3(midX, 0, midZ),
      new THREE.Vector3(B.x - ux * (B.r + 3), 0, B.z - uz * (B.r + 3)),
      new THREE.Vector3(B.x - ux * (B.r - 0.5), 0, B.z - uz * (B.r - 0.5)),
    ];
    (doorways[a] ||= []).push(Math.atan2(ux, uz));
    (doorways[b] ||= []).push(Math.atan2(-ux, -uz));
    const curve = new THREE.CatmullRomCurve3(pts);
    const segs = Math.max(16, Math.round(curve.getLength() / 2));
    // the tunnel tube, squashed a little, sunk so its belly hides under the floor
    const tube = lumpy(new THREE.TubeGeometry(curve, segs, TUBE_R, 10, false), 0.18);
    put("wall", tube, M.compose(new THREE.Vector3(0, TUBE_CY, 0), new THREE.Quaternion(), new THREE.Vector3(1, TUBE_SQUASH, 1)).clone());
    // a flat dirt floor ribbon along the tunnel
    const half = Math.sqrt(TUBE_R * TUBE_R - (TUBE_CY / TUBE_SQUASH) ** 2) + 0.1;
    const samples = curve.getSpacedPoints(segs);
    const fpos = [];
    for (let i = 0; i < samples.length - 1; i++) {
      const p = samples[i];
      const q = samples[i + 1];
      const tx = q.x - p.x;
      const tz = q.z - p.z;
      const tl = Math.hypot(tx, tz) || 1;
      const nx = (-tz / tl) * half;
      const nz = (tx / tl) * half;
      // two triangles, facing up
      fpos.push(p.x - nx, 0.005, p.z - nz, q.x + nx, 0.005, q.z + nz, q.x - nx, 0.005, q.z - nz);
      fpos.push(p.x - nx, 0.005, p.z - nz, p.x + nx, 0.005, p.z + nz, q.x + nx, 0.005, q.z + nz);
      caps.push({ ax: p.x, az: p.z, bx: q.x, bz: q.z });
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(fpos, 3));
    fg.computeVertexNormals();
    // make sure the ribbon faces up whichever way the tunnel runs
    if (fg.attributes.normal.getY(0) < 0) {
      for (let i = 0; i < fpos.length; i += 9) {
        for (let j = 0; j < 3; j++) {
          const tmp = fpos[i + 3 + j];
          fpos[i + 3 + j] = fpos[i + 6 + j];
          fpos[i + 6 + j] = tmp;
        }
      }
      fg.setAttribute("position", new THREE.Float32BufferAttribute(fpos, 3));
      fg.computeVertexNormals();
    }
    put("floor", fg);
    // a few roots snaking along the ceiling
    for (let i = 0; i < 3; i++) {
      const s0 = 0.15 + i * 0.28;
      const rp = [];
      for (let j = 0; j < 5; j++) {
        const p = curve.getPointAt(Math.min(1, s0 + j * 0.035));
        const side = Math.sin(i * 2.1 + j) * 1.2;
        const tng = curve.getTangentAt(Math.min(1, s0 + j * 0.035));
        rp.push(new THREE.Vector3(p.x - tng.z * side, TUBE_CY + TUBE_R * TUBE_SQUASH - 0.35 - (j % 2) * 0.25, p.z + tng.x * side));
      }
      put("root", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 10, 0.13, 5, false));
    }
  }

  // ---------- ROOMS ----------
  for (const [key, R] of Object.entries(TUNNEL_ROOMS)) {
    discs.push({ x: R.x, z: R.z, r: R.r - ROOM_PAD });
    // walls: arcs between the doorways, plus a lintel over each doorway
    const gaps = (doorways[key] || []).map((ang) => ({ ang, half: Math.asin(Math.min(0.95, (TUBE_R + 0.15) / R.r)) }));
    gaps.sort((p, q) => p.ang - q.ang);
    const norm = (x) => ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const segN = Math.max(14, Math.round(R.r * 3));
    if (gaps.length === 0) {
      put("wall", lumpy(new THREE.CylinderGeometry(R.r, R.r * 1.05, WALL_H, segN, 3, true), 0.3), at(R.x, WALL_H / 2, R.z));
    } else {
      for (let i = 0; i < gaps.length; i++) {
        const g0 = gaps[i];
        const g1 = gaps[(i + 1) % gaps.length];
        const start = norm(g0.ang + g0.half);
        let span = norm(g1.ang - g1.half - start);
        if (gaps.length === 1) span = Math.PI * 2 - 2 * g0.half;
        if (span < 0.02) continue;
        const n = Math.max(3, Math.round((segN * span) / (Math.PI * 2)));
        put("wall", lumpy(new THREE.CylinderGeometry(R.r, R.r * 1.05, WALL_H, n, 3, true, start, span), 0.3), at(R.x, WALL_H / 2, R.z));
      }
      // lintels: wall above each tunnel mouth
      const top = TUBE_CY + TUBE_R * TUBE_SQUASH - 0.25;
      for (const g of gaps) {
        put(
          "wall",
          new THREE.CylinderGeometry(R.r, R.r, WALL_H - top, 4, 1, true, g.ang - g.half, g.half * 2),
          at(R.x, top + (WALL_H - top) / 2, R.z)
        );
      }
    }
    // the dome overhead
    put(
      "wall",
      lumpy(new THREE.SphereGeometry(R.r * 1.05, segN, 7, 0, Math.PI * 2, 0, Math.PI / 2), 0.35),
      at(R.x, WALL_H - 0.15, R.z, 0, 1, 0.55, 1)
    );
    // floor
    put("floor", new THREE.CircleGeometry(R.r + 0.6, segN).rotateX(-Math.PI / 2), at(R.x, 0, R.z));
    // roots bursting out of the dome and down the walls
    for (let i = 0; i < 5; i++) {
      const a = i * 1.37 + R.x * 0.1;
      if (gaps.some((g) => Math.abs(Math.atan2(Math.sin(a - g.ang), Math.cos(a - g.ang))) < g.half + 0.25)) continue;
      const rr = R.r - 0.35;
      const rp = [
        new THREE.Vector3(R.x + Math.sin(a) * rr * 0.4, WALL_H + R.r * 0.4, R.z + Math.cos(a) * rr * 0.4),
        new THREE.Vector3(R.x + Math.sin(a) * rr * 0.85, WALL_H + 0.6, R.z + Math.cos(a) * rr * 0.85),
        new THREE.Vector3(R.x + Math.sin(a + 0.08) * rr, WALL_H * 0.5, R.z + Math.cos(a + 0.08) * rr),
        new THREE.Vector3(R.x + Math.sin(a - 0.05) * (rr - 0.6), 0.1, R.z + Math.cos(a - 0.05) * (rr - 0.6)),
      ];
      put("root", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 14, 0.22 + (i % 2) * 0.1, 6, false));
    }
  }

  // ---------- ROOM DRESSING ----------
  const spots = {};
  const live = []; // things that animate
  const emissive = (color, intensity = 1.6) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 1, flatShading: true });

  // 🪜 ROOT LANDING: a ladder of roots up to a shaft of daylight
  {
    const L = TUNNEL_ROOMS.landing;
    const lx = L.x + 2.5;
    const lz = L.z + 4.2;
    spots.ladder = { x: lx, z: lz };
    for (let i = 0; i < 2; i++) {
      const rp = [];
      for (let j = 0; j < 6; j++) {
        rp.push(new THREE.Vector3(lx + (i ? 0.55 : -0.55) + Math.sin(j * 1.3 + i) * 0.15, j * 2.2, lz + Math.cos(j * 0.9) * 0.15));
      }
      put("root", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 20, 0.14, 5, false));
    }
    for (let j = 0; j < 6; j++) {
      put("root", new THREE.CylinderGeometry(0.08, 0.08, 1.2, 5).rotateZ(Math.PI / 2), at(lx, 0.6 + j * 0.9, lz));
    }
    // the light pouring down the shaft
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.4, 12, 14, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
    );
    beam.position.set(lx, 6, lz);
    group.add(beam);
    const sunPool = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 18).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    sunPool.position.set(lx, 0.03, lz);
    group.add(sunPool);
  }

  // ✨ GLOWWORM GALLERY: a ceiling full of blue-green stars + silk threads
  let glowA = null;
  let glowB = null;
  {
    const G = TUNNEL_ROOMS.glow;
    const mk = (n, seed, color, size) => {
      const p = [];
      for (let i = 0; i < n; i++) {
        const a = hash3(i, seed, 1) * Math.PI * 2;
        const rr = Math.sqrt(hash3(i, seed, 2)) * G.r * 0.95;
        const y = WALL_H + (1 - (rr / (G.r * 1.05)) ** 2) ** 0.5 * G.r * 0.55 - 0.4;
        p.push(G.x + Math.sin(a) * rr, Math.max(WALL_H - 1, y), G.z + Math.cos(a) * rr);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      group.add(pts);
      return pts;
    };
    glowA = mk(260, 3, 0x7dffe0, 0.28);
    glowB = mk(200, 7, 0x6fc8ff, 0.22);
    // dangling silk threads with glowing beads
    const lines = [];
    for (let i = 0; i < 18; i++) {
      const a = hash3(i, 9, 3) * Math.PI * 2;
      const rr = Math.sqrt(hash3(i, 9, 4)) * G.r * 0.8;
      const x = G.x + Math.sin(a) * rr;
      const z = G.z + Math.cos(a) * rr;
      const top = WALL_H + 1.2;
      lines.push(x, top, z, x, top - 0.8 - hash3(i, 9, 5) * 1.4, z);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5fd8c0, transparent: true, opacity: 0.22 })));
    const gl = new THREE.PointLight(0x5fe8d0, 26, 22, 1.6);
    gl.position.set(G.x, 4.5, G.z);
    group.add(gl);
  }

  // 🍄 MUSHROOM GROTTO: clusters of glowing toadstools
  {
    const Gr = TUNNEL_ROOMS.grotto;
    const caps2 = [];
    const stems = [];
    for (let i = 0; i < 26; i++) {
      const a = hash3(i, 11, 1) * Math.PI * 2;
      const rr = Gr.r * (0.45 + hash3(i, 11, 2) * 0.45);
      const x = Gr.x + Math.sin(a) * rr;
      const z = Gr.z + Math.cos(a) * rr;
      const h = 0.4 + hash3(i, 11, 3) * 1.6;
      const s = 0.25 + h * 0.3;
      stems.push(new THREE.CylinderGeometry(s * 0.25, s * 0.35, h, 6).translate(x, h / 2, z));
      caps2.push(new THREE.SphereGeometry(s, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1).translate(x, h, z));
    }
    const capMesh = new THREE.Mesh(mergeGeometries(caps2.map(clean)), emissive(0xb06cff, 1.2));
    const stemMesh = new THREE.Mesh(mergeGeometries(stems.map(clean)), emissive(0x9ad8e0, 0.5));
    group.add(capMesh, stemMesh);
  }

  // 📜 MOONKEEPER ARCHIVE: niches of scrolls, candles, and the Root Map
  {
    const Ar = TUNNEL_ROOMS.archive;
    // shelves carved into the wall (stone slabs) with scroll bundles
    const scrolls = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.55 + (i / 8) * Math.PI * 0.9;
      const rr = Ar.r - 1.1;
      const x = Ar.x + Math.sin(a) * rr;
      const z = Ar.z + Math.cos(a) * rr;
      for (let s = 0; s < 3; s++) {
        put("stone", new THREE.BoxGeometry(2.2, 0.18, 0.9), at(x, 0.9 + s * 1.2, z, a));
        for (let k = 0; k < 4; k++) {
          scrolls.push(
            new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6)
              .rotateZ(Math.PI / 2)
              .rotateY(a)
              .translate(x + Math.cos(a) * (k - 1.5) * 0.45, 1.1 + s * 1.2, z - Math.sin(a) * (k - 1.5) * 0.45)
          );
        }
      }
    }
    group.add(new THREE.Mesh(mergeGeometries(scrolls.map(clean)), new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 1, flatShading: true })));
    // the stone table in the middle, with the Root Map lying on it
    put("stone", new THREE.CylinderGeometry(1.9, 2.2, 0.9, 10), at(Ar.x, 0.45, Ar.z));
    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = mapCanvas.height = 1024; // (drawn at 4× so its words stay crisp)
    mapCanvas.getContext("2d").scale(4, 4);
    drawRootMap(mapCanvas.getContext("2d"));
    const mapTex = new THREE.CanvasTexture(mapCanvas);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    const map = new THREE.Mesh(
      new THREE.CircleGeometry(1.75, 24).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: mapTex, roughness: 1, emissive: 0x3a2a14, emissiveIntensity: 0.5 })
    );
    map.position.set(Ar.x, 0.92, Ar.z);
    group.add(map);
    spots.map = { x: Ar.x, z: Ar.z, r: 4 };
    discs.push({ x: Ar.x, z: Ar.z, r: -1, solid: 2.4 }); // the table is solid
    // candles
    const flames = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Ar.x + Math.sin(a) * 1.5;
      const z = Ar.z + Math.cos(a) * 1.5;
      put("stone", new THREE.CylinderGeometry(0.1, 0.12, 0.35, 6), at(x, 1.07, z));
      flames.push(new THREE.SphereGeometry(0.08, 5, 4).scale(1, 1.6, 1).translate(x, 1.33, z));
    }
    group.add(new THREE.Mesh(mergeGeometries(flames.map(clean)), emissive(0xffc060, 2.5)));
    const al = new THREE.PointLight(0xffb060, 30, 20, 1.6);
    al.position.set(Ar.x, 3.5, Ar.z);
    group.add(al);
    live.push((t) => (al.intensity = 28 + Math.sin(t * 9) * 2 + Math.sin(t * 23) * 1.2));
  }

  // 🌊 UNDERGROUND STREAM: a glowing channel crossing the room
  let streamMat = null;
  {
    const S = TUNNEL_ROOMS.stream;
    streamMat = new THREE.MeshStandardMaterial({ color: 0x2fb8c8, emissive: 0x1aa0b0, emissiveIntensity: 0.9, roughness: 0.3, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(S.r * 2.2, 2.6, 30, 1).rotateX(-Math.PI / 2), streamMat);
    water.position.set(S.x, 0.06, S.z);
    water.rotation.y = 0.6;
    group.add(water);
    for (let i = -2; i <= 2; i++) {
      put("stone", new THREE.CylinderGeometry(0.55, 0.65, 0.3, 7), at(S.x + Math.cos(0.6) * 0 + i * 0.25, 0.15, S.z + i * 0.55 - Math.sin(0.6) * 0, 0));
    }
    const sl = new THREE.PointLight(0x40d8e8, 22, 20, 1.6);
    sl.position.set(S.x, 3, S.z);
    group.add(sl);
  }

  // 🪢 WELL PASSAGE: a rope dangling from a crack of blue light above
  {
    const W = TUNNEL_ROOMS.well;
    const wx = W.x - 2;
    const wz = W.z - 2;
    spots.wellRope = { x: wx, z: wz };
    put("root", new THREE.CylinderGeometry(0.09, 0.09, WALL_H + 3, 6), at(wx, (WALL_H + 3) / 2, wz));
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 1.8, 9, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
    );
    glow.position.set(wx, 4.5, wz);
    group.add(glow);
  }

  // 🚪 THE SEALED DOOR: a great round stone door, Roothaven's crest upon it
  {
    const D = TUNNEL_ROOMS.door;
    // set into the wall opposite the tunnel that leads here
    const inAng = (doorways.door || [0])[0];
    const a = inAng + Math.PI;
    const dx = D.x + Math.sin(a) * (D.r - 0.5);
    const dz = D.z + Math.cos(a) * (D.r - 0.5);
    const doorCanvas = document.createElement("canvas");
    doorCanvas.width = doorCanvas.height = 1024; // (drawn at 4× so its words stay crisp)
    doorCanvas.getContext("2d").scale(4, 4);
    drawCrest(doorCanvas.getContext("2d"));
    const doorTex = new THREE.CanvasTexture(doorCanvas);
    doorTex.colorSpace = THREE.SRGBColorSpace;
    const door = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 28),
      new THREE.MeshStandardMaterial({ map: doorTex, roughness: 1, emissive: 0x6fb8ff, emissiveMap: doorTex, emissiveIntensity: 0.25 })
    );
    door.position.set(dx, 2.7, dz);
    door.lookAt(D.x, 2.7, D.z);
    group.add(door);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.35, 8, 28), stoneMat);
    ring.position.copy(door.position);
    ring.quaternion.copy(door.quaternion);
    group.add(ring);
    spots.door = { x: dx - Math.sin(a) * 2.2, z: dz - Math.cos(a) * 2.2, look: [dx, 2.7, dz], face: a, meshes: [door, ring] };
    // the passage behind it, seen once the door rolls aside (Phase 7)
    const passage = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), new THREE.MeshBasicMaterial({ color: 0x0a1420 }));
    passage.position.set(dx + Math.sin(a) * 0.06, 2.7, dz + Math.cos(a) * 0.06);
    passage.lookAt(D.x, 2.7, D.z);
    passage.visible = false;
    group.add(passage);
    spots.door.passage = passage;
    live.push((t) => (door.material.emissiveIntensity = 0.22 + Math.sin(t * 1.3) * 0.12));
  }

  // ---------- merge all the rock ----------
  const mats = { wall: wallMat, floor: floorMat, root: rootMat, stone: stoneMat };
  for (const [k, list] of Object.entries(pieces)) {
    if (!list.length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(list), mats[k]);
    group.add(mesh);
  }

  // Thistle's lantern glow: one warm light that follows the mouse around
  const lantern = new THREE.PointLight(0xffc880, 16, 13, 1.5);
  group.add(lantern);

  // ---------- walking ----------
  const shapes = { discs, caps };
  /**
   * Keep a point inside the tunnels. `grow` widens the walkable space
   * (the camera may float a little closer to the walls than the mouse).
   */
  function constrain(p, grow = 0) {
    let best = -Infinity;
    let bx = p.x;
    let bz = p.z;
    for (const d of shapes.discs) {
      if (d.r < 0) continue;
      const dx = p.x - d.x;
      const dz = p.z - d.z;
      const dist = Math.hypot(dx, dz) || 0.0001;
      const R = d.r + grow;
      const inside = R - dist;
      if (inside >= 0) { best = Infinity; break; }
      if (inside > best) {
        best = inside;
        bx = d.x + (dx / dist) * R;
        bz = d.z + (dz / dist) * R;
      }
    }
    if (best !== Infinity) {
      for (const c of shapes.caps) {
        const ex = c.bx - c.ax;
        const ez = c.bz - c.az;
        const l2 = ex * ex + ez * ez || 1;
        const k = Math.max(0, Math.min(1, ((p.x - c.ax) * ex + (p.z - c.az) * ez) / l2));
        const qx = c.ax + ex * k;
        const qz = c.az + ez * k;
        const dx = p.x - qx;
        const dz = p.z - qz;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const R = WALK_R + grow;
        const inside = R - dist;
        if (inside >= 0) { best = Infinity; break; }
        if (inside > best) {
          best = inside;
          bx = qx + (dx / dist) * R;
          bz = qz + (dz / dist) * R;
        }
      }
    }
    if (best !== Infinity) {
      p.x = bx;
      p.z = bz;
    }
    // solid things inside rooms (the archive table)
    if (grow === 0) {
      for (const d of shapes.discs) {
        if (!d.solid) continue;
        const dx = p.x - d.x;
        const dz = p.z - d.z;
        const dist = Math.hypot(dx, dz);
        if (dist < d.solid && dist > 0.0001) {
          p.x = d.x + (dx / dist) * d.solid;
          p.z = d.z + (dz / dist) * d.solid;
        }
      }
    }
  }

  /** Which room is this point in? (null = in a tunnel) */
  function roomAt(x, z) {
    for (const [key, R] of Object.entries(TUNNEL_ROOMS)) {
      if (Math.hypot(x - R.x, z - R.z) < R.r - 0.5) return key;
    }
    return null;
  }

  /** lantern = has Thistle built her own lantern yet? (it lights much further) */
  function update(t, player, lanternOn = false, glowLantern = false) {
    lantern.position.set(player.x, player.y + 2.2, player.z);
    // without a lantern, only a faint glow of your own; with one, a warm
    // pool; the crafted Glow Lantern lights the tunnels far and wide
    lantern.intensity = glowLantern ? 30 + Math.sin(t * 5) * 1 : lanternOn ? 18 + Math.sin(t * 7) * 0.8 : 6;
    lantern.distance = glowLantern ? 24 : lanternOn ? 15 : 8;
    if (glowA) glowA.material.opacity = 0.75 + Math.sin(t * 1.7) * 0.25;
    if (glowB) glowB.material.opacity = 0.75 + Math.sin(t * 2.3 + 2) * 0.25;
    if (streamMat) streamMat.emissiveIntensity = 0.8 + Math.sin(t * 2.2) * 0.15;
    for (const f of live) f(t);
  }

  return { group, constrain, roomAt, update, spots, rooms: TUNNEL_ROOMS };
}

// The Root Map: the Five Great Cities, joined by roads beneath the roots.
function drawRootMap(c) {
  c.fillStyle = "#cdb88c";
  c.fillRect(0, 0, 256, 256);
  c.strokeStyle = "#6b5030";
  c.lineWidth = 6;
  c.beginPath();
  c.arc(128, 128, 122, 0, Math.PI * 2);
  c.stroke();
  const cities = [
    ["Frostpine", 128, 42],
    ["Golden Hollow", 52, 118],
    ["Everbough", 128, 118],
    ["Reedmere", 204, 118],
    ["Roothaven", 128, 206],
  ];
  // the old roads, dashed
  c.setLineDash([6, 6]);
  c.lineWidth = 3;
  c.strokeStyle = "#7a4a2a";
  const link = (a, b) => {
    c.beginPath();
    c.moveTo(cities[a][1], cities[a][2]);
    c.lineTo(cities[b][1], cities[b][2]);
    c.stroke();
  };
  link(0, 2); link(1, 2); link(2, 3); link(2, 4); link(1, 4); link(3, 4); link(0, 1); link(0, 3);
  c.setLineDash([]);
  c.font = "900 14px Georgia, serif";
  c.textAlign = "center";
  for (const [name, x, y] of cities) {
    c.fillStyle = "#3e5a2a";
    c.beginPath();
    c.moveTo(x, y - 14);
    c.lineTo(x - 9, y + 4);
    c.lineTo(x + 9, y + 4);
    c.closePath();
    c.fill();
    c.fillStyle = "#3a2614";
    c.fillText(name, x, y + 19);
  }
  c.font = "italic bold 12px Georgia, serif";
  c.fillText("☾ the Moonkeepers' roads ☾", 128, 246);
}

// Roothaven's crest: a great root wrapped around a crystal.
function drawCrest(c) {
  c.fillStyle = "#6e6a62";
  c.fillRect(0, 0, 256, 256);
  // crystal
  c.fillStyle = "#9fd8ff";
  c.beginPath();
  c.moveTo(128, 40);
  c.lineTo(158, 110);
  c.lineTo(128, 190);
  c.lineTo(98, 110);
  c.closePath();
  c.fill();
  // the root, coiling around it
  c.strokeStyle = "#4a3220";
  c.lineWidth = 12;
  c.lineCap = "round";
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    const x = 128 + Math.sin(k * Math.PI * 4) * 44;
    const y = 30 + k * 180;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.font = "900 17px Georgia, serif";
  c.textAlign = "center";
  c.lineJoin = "round";
  c.lineWidth = 3.5;
  c.strokeStyle = "rgba(20,14,8,.9)";
  c.fillStyle = "#fff4dc";
  for (const [t, y] of [["STRENGTH BELOW", 222], ["LIGHT WITHIN", 242]]) {
    c.strokeText(t, 128, y);
    c.fillText(t, 128, y);
  }
}
