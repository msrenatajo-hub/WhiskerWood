import * as THREE from "three";

/**
 * Smoothly eases the camera toward a target position + look-at point using
 * frame-rate-independent exponential damping. The library calls {@link moveTo}
 * to frame a shelf, then {@link overview} to pull back out.
 */
export class CameraRig {
  private targetPos = new THREE.Vector3();
  private targetLook = new THREE.Vector3();
  private currentLook = new THREE.Vector3();
  private readonly overviewPos: THREE.Vector3;
  private readonly overviewLook: THREE.Vector3;

  constructor(
    private camera: THREE.PerspectiveCamera,
    overviewPos = new THREE.Vector3(0, 6.5, 19),
    overviewLook = new THREE.Vector3(0, 5.2, -6),
    private damping = 2.6
  ) {
    this.overviewPos = overviewPos.clone();
    this.overviewLook = overviewLook.clone();
    this.targetPos.copy(overviewPos);
    this.targetLook.copy(overviewLook);
    this.currentLook.copy(overviewLook);
    this.camera.position.copy(overviewPos);
    this.camera.lookAt(this.currentLook);
  }

  moveTo(pos: THREE.Vector3, look: THREE.Vector3): void {
    this.targetPos.copy(pos);
    this.targetLook.copy(look);
  }

  overview(): void {
    this.targetPos.copy(this.overviewPos);
    this.targetLook.copy(this.overviewLook);
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-this.damping * dt);
    this.camera.position.lerp(this.targetPos, k);
    this.currentLook.lerp(this.targetLook, k);
    this.camera.lookAt(this.currentLook);
  }
}
