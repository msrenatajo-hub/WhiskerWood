// ------------------------------------------------------------
//  🐾  TRACKS — clear little mouse pawprints across the ground.
//
//  makePawTrail(group, from, to, terrainHeight) lays a line of prints from
//  one spot to another: a real pawprint shape (palm pad + four toes),
//  dark and crisp, alternating left / right in a mouse-sized stride and
//  pointing the way the mouse walked. One InstancedMesh per trail.
// ------------------------------------------------------------
import * as THREE from "three";

let pawTex = null;
function pawTexture() {
  if (pawTex) return pawTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; // tinted by the material color
  // the palm pad (a soft heart-ish oval), toward the heel
  g.beginPath();
  g.ellipse(64, 84, 22, 19, 0, 0, Math.PI * 2);
  g.fill();
  // four toes fanned across the front
  const toes = [
    [33, 52, 9, 12, -0.45],
    [52, 34, 9, 13, -0.15],
    [76, 34, 9, 13, 0.15],
    [95, 52, 9, 12, 0.45],
  ];
  for (const [x, y, rx, ry, rot] of toes) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    g.fill();
  }
  pawTex = new THREE.CanvasTexture(c);
  pawTex.anisotropy = 4;
  return pawTex;
}

const STRIDE = 0.42; // distance between prints
const SIZE = 0.3; // how big each print is

/**
 * Lay pawprints from `from` to `to` ({x, z} each). Returns the mesh (add
 * it with group.add, remove it the same way). `wobble` gives the path a
 * gentle meander so it reads as a real animal's walk.
 */
export function makePawTrail(group, from, to, terrainHeight, { color = 0x2a1a0c, wobble = 0.8, max = 400 } = {}) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const n = Math.min(max, Math.floor(len / STRIDE));
  const geo = new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: pawTexture(),
    color,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    polygonOffset: true, // never flicker into the ground
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const inst = new THREE.InstancedMesh(geo, mat, n);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    // the meander, and which way the path is heading right here
    const off = Math.sin(k * Math.PI * 3) * wobble * Math.sin(k * Math.PI);
    const slope = Math.cos(k * Math.PI * 3) * wobble * 3 * Math.PI / len;
    const hx = ux - uz * slope;
    const hz = uz + ux * slope;
    const side = i % 2 ? 0.09 : -0.09; // left paw, right paw
    const x = from.x + dx * k - uz * (off + side);
    const z = from.z + dz * k + ux * (off + side);
    // the plane's "toes" point toward -Z in texture space → face travel
    q.setFromAxisAngle(up, Math.atan2(-hx, -hz) + (i % 2 ? 0.12 : -0.12));
    p.set(x, terrainHeight(x, z) + 0.04, z);
    m.compose(p, q, s);
    inst.setMatrixAt(i, m);
  }
  inst.frustumCulled = false;
  inst.renderOrder = 1;
  group.add(inst);
  return inst;
}
