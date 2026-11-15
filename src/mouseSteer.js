// ------------------------------------------------------------
//  🖱  MOUSE STEERING — every time you ride your dragon, you steer with the
//  mouse ONLY: left/right turns (main.js's mouse look spins you while the
//  pointer is locked), up/down climbs and dives. steerStart() grabs the
//  pointer (a "click to steer" sign shows until it's caught), steerPitch()
//  is how hard you're pulling up (+) or pushing down (−), and steerStop()
//  gives the mouse back — unless mouse look was already on before.
// ------------------------------------------------------------
let canvas = null, on = false, weLocked = false, pitch = 0, hint = null;
const locked = () => canvas && document.pointerLockElement === canvas;
function grab() {
  try {
    canvas.requestPointerLock()?.catch?.(() => {});
  } catch {}
}
document.addEventListener("mousemove", (e) => {
  if (!on || !locked()) return;
  pitch = Math.max(-1, Math.min(1, pitch - e.movementY * 0.012));
});
document.addEventListener("click", (e) => {
  if (on && !locked() && e.target === canvas) grab();
});
function showHint(show) {
  if (!hint) {
    hint = document.createElement("div");
    hint.id = "ww-steer-hint";
    hint.style.cssText = "position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);padding:14px 26px;border-radius:14px;background:rgba(20,16,10,.82);color:#ffe6b0;font:900 24px 'Trebuchet MS',sans-serif;z-index:60;pointer-events:none";
    hint.textContent = "🖱 CLICK to steer your dragon with the mouse";
    document.body.appendChild(hint);
  }
  hint.style.display = show ? "block" : "none";
}
export function steerStart(cv) {
  canvas = cv || canvas || document.querySelector("canvas");
  if (on) return;
  on = true;
  pitch = 0;
  weLocked = !locked();
  if (weLocked) grab();
}
export function steerStop() {
  if (!on) return;
  on = false;
  pitch = 0;
  showHint(false);
  if (weLocked && locked()) document.exitPointerLock();
}
// call once a frame while steering: eases back to level, and shows the hint if the mouse isn't caught
export function steerPitch(dt) {
  pitch *= Math.pow(0.12, dt);
  showHint(on && !locked());
  return pitch;
}
