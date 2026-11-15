import * as THREE from "three";

/** A clickable/hoverable object registered with the {@link Picker}. */
export interface Interactive {
  object: THREE.Object3D;
  onEnter?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}

/**
 * Ray picking over the 3D scene. It highlights whatever the cursor is over
 * (hover), and selects on {@link tap} — which the first-person controller calls
 * only for a clean click (not a look-drag), so turning around never opens a
 * shelf by accident. Disabled while an HTML overlay is open.
 */
export class Picker {
  private ray = new THREE.Raycaster();
  private items: Interactive[] = [];
  private roots: THREE.Object3D[] = [];
  private hovered: Interactive | null = null;
  private ndc = new THREE.Vector2();
  private enabled = true;

  constructor(private dom: HTMLElement, private camera: THREE.Camera) {
    dom.addEventListener("pointermove", this.onMove);
  }

  register(item: Interactive): void {
    this.items.push(item);
    this.roots.push(item.object);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.setHover(null);
  }

  private pickAt(clientX: number, clientY: number): Interactive | null {
    this.ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObjects(this.roots, true);
    if (hits.length === 0) return null;
    let node: THREE.Object3D | null = hits[0].object;
    while (node) {
      const item = this.items.find((i) => i.object === node);
      if (item) return item;
      node = node.parent;
    }
    return null;
  }

  /** Called by the controller on a clean tap; selects whatever is under it. */
  tap(clientX: number, clientY: number): void {
    if (this.enabled) this.pickAt(clientX, clientY)?.onClick?.();
  }

  private onMove = (e: PointerEvent): void => {
    if (this.enabled) this.setHover(this.pickAt(e.clientX, e.clientY));
  };

  private setHover(item: Interactive | null): void {
    if (item === this.hovered) return;
    this.hovered?.onLeave?.();
    this.hovered = item;
    item?.onEnter?.();
    this.dom.classList.toggle("is-pointing", !!item);
  }
}
