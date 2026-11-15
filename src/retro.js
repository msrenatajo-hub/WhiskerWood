// ------------------------------------------------------------
//  🎮  N64 MODE — the Ocarina-of-Time look, which is also the FAST look.
//
//  Ocarina of Time ran on a console weaker than a cheap phone, so its
//  style is a list of things it simply didn't do:
//    • flat, cartoony shading — each surface is one or two solid colors,
//      not a smooth light-to-dark gradient, so the world reads almost 2D
//    • no real-time shadow maps — just a dark round "blob" under characters
//    • thick colored fog that hides how short the draw distance is
//  The picture stays sharp (full window size). Press V for chunky low-res
//  pixels if you want them — they're drawn as crisp squares, never blurred.
//  Copying those choices makes WhiskerWood look the part AND run faster.
//
//  Add ?hd=1 to the URL to get the old high-detail look back for comparison.
//  Press V in the game to cycle the picture size.
// ------------------------------------------------------------
import * as THREE from "three";

const params = new URLSearchParams(location.search);
export const RETRO = !params.has("hd");

// How many pixel rows we actually draw; the browser stretches the picture
// up to fill the window. 240 = the real N64. 0 = full window size.
const RES_STEPS = [0, 480, 360, 240];
const RES_KEY = "ww.retroRes2"; // new key: everyone starts back on sharp
let resIndex = 0; // full sharpness by default
try {
  const saved = parseInt(localStorage.getItem(RES_KEY), 10);
  if (RES_STEPS.includes(saved)) resIndex = RES_STEPS.indexOf(saved);
} catch {}
if (params.get("res")) {
  const want = parseInt(params.get("res"), 10);
  if (RES_STEPS.includes(want)) resIndex = RES_STEPS.indexOf(want);
}

// Outdoors: fog this many times thicker than the HD look, and the camera
// stops drawing at this distance (everything past it is fully fogged anyway).
export const FOG_MULT = 1; // (was 2.2× thicker in the N64 look — it made everything a little way off look hazy)
export const DRAW_DISTANCE = RETRO ? 2600 : 6500;

// Every MeshStandardMaterial in the game (ours AND the ones inside loaded
// .glb models) is drawn with the cheap cartoon ("toon") shader instead of
// the physically-based one. Swapping the shader once, here, keeps every
// material object exactly as it was — code that animates .color or
// .emissiveIntensity keeps working, and the wind/snow shader patches find
// the same #include lines in the toon shader.
// 🔭 Textures seen at a slant or a little way off stay SHARP: anisotropic
// filtering on by default for every texture (ours and the models'). The GPU
// quietly caps it at whatever it supports.
THREE.Texture.DEFAULT_ANISOTROPY = 8;

if (RETRO) {
  THREE.ShaderLib.physical.vertexShader = THREE.ShaderLib.toon.vertexShader;
  THREE.ShaderLib.physical.fragmentShader = THREE.ShaderLib.toon.fragmentShader;

  // Two hard bands of light: lit side, and a gently darker shade side.
  // (three's default shade is 70% — a bit too 3D; 82% keeps it flat.)
  THREE.ShaderChunk.gradientmap_pars_fragment = /* glsl */ `
    vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
      float dotNL = dot( normal, lightDirection );
      vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
      vec2 fw = fwidth( coord ) * 0.5;
      return mix( vec3( 0.82 ), vec3( 1.0 ), smoothstep( 0.6 - fw.x, 0.6 + fw.x, coord.x ) );
    }`;

  // The sky/ground fill light normally shades round things top-to-bottom
  // in a smooth gradient — the most "3D" thing on screen. Make it an even
  // flat wash instead (a mix of sky and ground color, same everywhere).
  const hemi = "float hemiDiffuseWeight = 0.5 * dotNL + 0.5;";
  const lp = THREE.ShaderChunk.lights_pars_begin;
  if (lp.includes(hemi)) {
    THREE.ShaderChunk.lights_pars_begin = lp.replace(hemi, "float hemiDiffuseWeight = 0.7;");
  }
}

/** Renderer options for the WebGLRenderer constructor. */
export function rendererOptions(canvas) {
  // Smooth the jagged edges so the full-size picture looks crisp and clean.
  // (stencil: the stairwell down to Roothaven is drawn as a "portal" in the floor)
  return { canvas, antialias: true, stencil: true, powerPreference: "high-performance" };
}

/** Pick the drawing resolution for the current window size. */
export function applyResolution(renderer) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const rows = RES_STEPS[resIndex];
  // (full sharpness = the screen's own pixel density — on a Retina Mac that's
  //  2 pixels per point; anything less gets stretched and looks BLURRY)
  const ratio = rows ? rows / h : Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h); // CSS size stays the full window
  // When a small picture is stretched up, show big square pixels instead of
  // letting the browser blur them together.
  renderer.domElement.style.imageRendering = rows ? "pixelated" : "auto";
}

/** V key: full → 480 → 360 → 240 → full… Returns a label for the HUD. */
export function cycleResolution(renderer) {
  resIndex = (resIndex + 1) % RES_STEPS.length;
  try {
    localStorage.setItem(RES_KEY, String(RES_STEPS[resIndex]));
  } catch {}
  applyResolution(renderer);
  const rows = RES_STEPS[resIndex];
  return rows ? `📺 Picture: ${rows} lines${rows === 240 ? " (real N64!)" : ""}` : "📺 Picture: full sharpness";
}

/**
 * A soft dark disc that sits on the ground under the player, like Link's
 * shadow. It shrinks and fades as you jump higher.
 */
export function createBlobShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.6, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      polygonOffset: true, // never flicker into the ground
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  blob.renderOrder = 1;
  blob.visible = RETRO;
  blob.userData.size = 0; // measured from the player once it exists
  return blob;
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

/** Put the blob under `body` (the player), resting on floorY. */
export function updateBlobShadow(blob, body, floorY) {
  if (!RETRO || !body) return;
  if (!blob.userData.size) {
    _box.setFromObject(body).getSize(_size);
    if (_size.x > 0) blob.userData.size = Math.max(_size.x, _size.z) * 1.1;
  }
  const lift = Math.max(0, body.position.y - floorY);
  const k = 1 / (1 + lift * 0.25); // higher jump = smaller, fainter shadow
  blob.position.set(body.position.x, floorY + 0.04, body.position.z);
  blob.scale.setScalar((blob.userData.size || 1) * (0.55 + 0.45 * k));
  blob.material.opacity = k;
}
