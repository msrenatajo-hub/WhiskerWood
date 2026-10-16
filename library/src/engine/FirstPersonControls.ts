import * as THREE from "three";

export interface FPOptions {
  eyeHeight?: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  start?: THREE.Vector3;
  startYaw?: number;
  moveSpeed?: number;
  lookSpeed?: number;
}

/**
 * A cozy first-person controller for walking the library: drag to look around
 * (turn all the way around), WASD / arrows to walk (Shift to hurry), wheel to
 * glide forward. Movement is clamped inside the room.
 *
 * It also disambiguates a *click* from a *look-drag*: a quick press-and-release
 * that didn't move fires `onTap`, which the picker uses to open a shelf. That's
 * why you can drag to look without accidentally opening things.
 */
export class FirstPersonControls {
  private yaw: number;
  private pitch = 0;
  private pos: THREE.Vector3;
  private keys = new Set<string>();
  private dragging = false;
  private moved = false;
  private downX = 0;
  private downY = 0;
  private downT = 0;
  private lastX = 0;
  private lastY = 0;
  private enabled = true;

  // Slide-look: the camera follows wherever the cursor rests — slide it toward
  // a screen edge to keep turning, up/down to tilt. No dragging needed.
  private hoverX = 0;
  private hoverY = 0;
  private hoverActive = false;

  private eyeHeight: number;
  private bounds: NonNullable<FPOptions["bounds"]>;
  private moveSpeed: number;
  private lookSpeed: number;

  /** Called on a clean tap (no drag). The picker wires this to selection. */
  onTap: (clientX: number, clientY: number) => void = () => {};

  /**
   * While true, an external director (e.g. the book-reading camera) owns the
   * camera: update() neither moves nor applies the walking pose.
   */
  cinematic = false;

  constructor(private camera: THREE.PerspectiveCamera, private dom: HTMLElement, opts: FPOptions = {}) {
    this.eyeHeight = opts.eyeHeight ?? 6;
    this.bounds = opts.bounds ?? { minX: -19, maxX: 19, minZ: -12, maxZ: 12 };
    this.pos = (opts.start ?? new THREE.Vector3(0, this.eyeHeight, 8)).clone();
    this.pos.y = this.eyeHeight;
    this.yaw = opts.startYaw ?? 0;
    this.moveSpeed = opts.moveSpeed ?? 11;
    this.lookSpeed = opts.lookSpeed ?? 0.0026;

    dom.addEventListener("pointerdown", this.onDown);
    dom.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    dom.addEventListener("wheel", this.onWheel, { passive: false });
    // Track the cursor everywhere (even over HUD buttons) for slide-look, and
    // stop turning the moment it leaves the window so the room never spins.
    window.addEventListener("pointermove", this.onHover);
    document.addEventListener("pointerleave", this.onHoverEnd);
    window.addEventListener("blur", this.onHoverEnd);
    this.apply();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.dragging = false;
      this.dom.style.cursor = "";
    }
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled || e.button !== 0) return;
    this.dragging = true;
    this.moved = false;
    this.downX = this.lastX = e.clientX;
    this.downY = this.lastY = e.clientY;
    this.downT = performance.now();
    try {
      this.dom.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic pointer ids (tests) can't be captured — ignore */
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging || !this.enabled) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    if (Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 5) {
      this.moved = true;
      this.dom.style.cursor = "grabbing";
    }
    this.yaw += dx * this.lookSpeed;
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch - dy * this.lookSpeed));
  };

  private onHover = (e: PointerEvent): void => {
    this.hoverX = e.clientX;
    this.hoverY = e.clientY;
    this.hoverActive = true;
  };
  private onHoverEnd = (): void => {
    this.hoverActive = false;
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.dom.style.cursor = "";
    const quick = performance.now() - this.downT < 500;
    if (this.enabled && !this.moved && quick) this.onTap(e.clientX, e.clientY);
  };

  private onKey = (e: KeyboardEvent): void => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (this.enabled) this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.enabled) return;
    e.preventDefault();
    this.pos.addScaledVector(this.forwardFlat(), -e.deltaY * 0.02);
    this.clamp();
  };

  private forwardFlat(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
  private rightFlat(): THREE.Vector3 {
    return new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));
  }
  private clamp(): void {
    this.pos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.pos.x));
    this.pos.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.pos.z));
    this.pos.y = this.eyeHeight;
  }

  /** Where the walking eye currently is (for the cinematic camera to return to). */
  poseEye(): THREE.Vector3 {
    return this.pos.clone();
  }
  /** The point the walking eye is looking at. */
  poseLook(): THREE.Vector3 {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(
      this.pos.x + Math.sin(this.yaw) * cp,
      this.pos.y + Math.sin(this.pitch),
      this.pos.z - Math.cos(this.yaw) * cp
    );
  }

  update(dt: number): void {
    if (this.cinematic) return; // the reading camera owns the view right now
    if (this.enabled) {
      // Slide-look: rest the cursor toward a screen edge to turn (with a
      // comfortable dead zone in the middle so aiming at things stays easy);
      // cursor height tilts the view. Dragging still works and overrides.
      if (this.hoverActive && !this.dragging) {
        const nx = (this.hoverX / window.innerWidth) * 2 - 1;
        const ny = (this.hoverY / window.innerHeight) * 2 - 1;
        const dead = 0.35;
        const strength = Math.max(0, Math.abs(nx) - dead) / (1 - dead);
        this.yaw += Math.sign(nx) * strength * strength * 2.4 * dt;
        const targetPitch = Math.max(-0.9, Math.min(0.9, -ny * 0.65));
        this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * 4);
      }

      const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 2.1 : 1;
      const step = this.moveSpeed * sprint * dt;
      const f = this.forwardFlat();
      const r = this.rightFlat();
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) this.pos.addScaledVector(f, step);
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) this.pos.addScaledVector(f, -step);
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) this.pos.addScaledVector(r, step);
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) this.pos.addScaledVector(r, -step);
      this.clamp();
    }
    this.apply();
  }

  private apply(): void {
    this.camera.position.copy(this.pos);
    const cp = Math.cos(this.pitch);
    this.camera.lookAt(
      this.pos.x + Math.sin(this.yaw) * cp,
      this.pos.y + Math.sin(this.pitch),
      this.pos.z - Math.cos(this.yaw) * cp
    );
  }
}
