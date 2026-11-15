import * as THREE from "three";

/**
 * The reading book: it flies off its shelf, lands on the reading desk, its
 * covers swing open, and page spreads render from canvases. ←/→ turn the pages
 * (an animated leaf lifts and falls); on close it shuts and flies home.
 */

const PAGE_W = 1.5;
const PAGE_H = 2.1;
const COVER_T = 0.05;
const OPEN_ANGLE = 0.09; // halves' resting tilt when open (slight V)
const CLOSED_ANGLE = 1.54; // halves vertical = book closed

type State = "hidden" | "flying" | "opening" | "open" | "flipping" | "shutting" | "returning";

export interface BookOpenOptions {
  fromPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  coverColor: number;
}

export class Book3D {
  readonly group = new THREE.Group();

  private closed: THREE.Mesh;
  private openG = new THREE.Group();
  private leftHalf = new THREE.Group();
  private rightHalf = new THREE.Group();
  private flipG = new THREE.Group();

  private leftPage: THREE.MeshBasicMaterial;
  private rightPage: THREE.MeshBasicMaterial;
  private flipFront: THREE.MeshBasicMaterial;
  private flipBack: THREE.MeshBasicMaterial;
  private coverMat: THREE.MeshStandardMaterial;

  private pages: HTMLCanvasElement[] = [];
  private cache = new Map<number, THREE.Texture>();
  private blank: THREE.Texture;

  private spread = 0;
  private flipTo = 0;
  private state: State = "hidden";
  private t = 0;

  private fromPos = new THREE.Vector3();
  private fromQuat = new THREE.Quaternion();
  /** Where the open book rests: on the desk, tilted back toward the reader. */
  private restPos = new THREE.Vector3(0, 3.15, 1.05);
  private restQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.46, 0, 0));

  constructor() {
    this.group.visible = false;
    this.coverMat = new THREE.MeshStandardMaterial({ color: 0x5a3d26, roughness: 0.55 });

    // Closed form (used while flying).
    this.closed = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W + 0.08, PAGE_H + 0.1, 0.32), this.coverMat);
    this.closed.castShadow = true;
    this.group.add(this.closed);

    // Open form: two halves hinged at the spine (group origin).
    const mkPage = (): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.leftPage = mkPage();
    this.rightPage = mkPage();
    this.flipFront = mkPage();
    this.flipBack = mkPage();

    const coverGeo = new THREE.BoxGeometry(PAGE_W + 0.07, PAGE_H + 0.09, COVER_T);
    const pageGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);

    const rCover = new THREE.Mesh(coverGeo, this.coverMat);
    rCover.position.set(PAGE_W / 2 + 0.02, 0, 0);
    const rPage = new THREE.Mesh(pageGeo, this.rightPage);
    rPage.position.set(PAGE_W / 2, 0, COVER_T / 2 + 0.012);
    this.rightHalf.add(rCover, rPage);

    const lCover = new THREE.Mesh(coverGeo, this.coverMat);
    lCover.position.set(-PAGE_W / 2 - 0.02, 0, 0);
    const lPage = new THREE.Mesh(pageGeo, this.leftPage);
    lPage.position.set(-PAGE_W / 2, 0, COVER_T / 2 + 0.012);
    this.leftHalf.add(lCover, lPage);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, PAGE_H + 0.09, COVER_T), this.coverMat);

    // The turning leaf: front + back planes hinged at the spine.
    const fFront = new THREE.Mesh(pageGeo, this.flipFront);
    fFront.position.set(PAGE_W / 2, 0, 0.052);
    const fBack = new THREE.Mesh(pageGeo, this.flipBack);
    fBack.position.set(PAGE_W / 2, 0, 0.048);
    fBack.rotation.y = Math.PI;
    this.flipG.add(fFront, fBack);
    this.flipG.visible = false;

    this.openG.add(this.leftHalf, this.rightHalf, this.flipG, spine);
    this.openG.visible = false;
    this.group.add(this.openG);

    // Blank parchment for out-of-range pages.
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f8efd9";
    g.fillRect(0, 0, 64, 64);
    this.blank = new THREE.CanvasTexture(c);
    this.blank.colorSpace = THREE.SRGBColorSpace;
  }

  /** Which spread the reader is on (0 = cover/contents). */
  get currentSpread(): number {
    return this.spread;
  }

  get isOpen(): boolean {
    return this.state !== "hidden" && this.state !== "returning";
  }

  private tex(i: number): THREE.Texture {
    if (i < 0 || i >= this.pages.length) return this.blank;
    let t = this.cache.get(i);
    if (!t) {
      t = new THREE.CanvasTexture(this.pages[i]);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      this.cache.set(i, t);
    }
    return t;
  }

  private setSpread(s: number): void {
    this.spread = s;
    this.leftPage.map = this.tex(2 * s);
    this.rightPage.map = this.tex(2 * s + 1);
    this.leftPage.needsUpdate = true;
    this.rightPage.needsUpdate = true;
  }

  private maxSpread(): number {
    return Math.max(0, Math.ceil(this.pages.length / 2) - 1);
  }

  /** 0 = fully open, 1 = fully closed. */
  private setHalves(closedness: number): void {
    const a = OPEN_ANGLE + (CLOSED_ANGLE - OPEN_ANGLE) * closedness;
    this.rightHalf.rotation.y = -a;
    this.leftHalf.rotation.y = a;
  }

  /** Launch the book from its shelf to the desk and open it at page one. */
  open(pages: HTMLCanvasElement[], opts: BookOpenOptions): void {
    for (const t of this.cache.values()) t.dispose();
    this.cache.clear();
    this.pages = pages;
    this.coverMat.color.copy(new THREE.Color(opts.coverColor).lerp(new THREE.Color(0x1a0f08), 0.45));

    this.fromPos.copy(opts.fromPos);
    this.fromQuat.copy(opts.fromQuat);
    this.group.position.copy(this.fromPos);
    this.group.quaternion.copy(this.fromQuat);
    this.group.visible = true;
    this.closed.visible = true;
    this.openG.visible = false;
    this.flipG.visible = false;
    this.setSpread(0);
    this.state = "flying";
    this.t = 0;
  }

  /** Turn one spread forward (+1) or back (−1), with an animated leaf. */
  flip(dir: 1 | -1): void {
    if (this.state !== "open") return;
    const target = this.spread + dir;
    if (target < 0 || target > this.maxSpread()) return;
    this.flipTo = target;
    this.t = 0;
    this.state = "flipping";
    this.flipG.visible = true;
    if (dir > 0) {
      // leaf lifts from the right: its face is the old right page, its back the new left
      this.rightPage.map = this.tex(2 * target + 1);
      this.flipFront.map = this.tex(2 * this.spread + 1);
      this.flipBack.map = this.tex(2 * target);
      this.flipG.rotation.y = -OPEN_ANGLE;
    } else {
      // leaf falls back from the left: its back is the old left, its face the new right
      this.leftPage.map = this.tex(2 * target);
      this.flipBack.map = this.tex(2 * this.spread);
      this.flipFront.map = this.tex(2 * target + 1);
      this.flipG.rotation.y = -(Math.PI - OPEN_ANGLE);
    }
    for (const m of [this.rightPage, this.leftPage, this.flipFront, this.flipBack]) m.needsUpdate = true;
  }

  /** Shut the covers and fly home to the shelf. */
  close(): void {
    if (this.state === "hidden" || this.state === "returning") return;
    if (this.state === "flying") {
      // never landed — just turn around mid-air
      this.state = "returning";
      this.t = 0;
      return;
    }
    this.flipG.visible = false;
    this.state = "shutting";
    this.t = 0;
  }

  update(dt: number): void {
    const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    switch (this.state) {
      case "flying": {
        this.t += dt / 0.95;
        const e = ease(this.t);
        this.group.position.lerpVectors(this.fromPos, this.restPos, e);
        this.group.position.y += Math.sin(Math.min(1, this.t) * Math.PI) * 1.1; // gentle arc
        this.group.quaternion.slerpQuaternions(this.fromQuat, this.restQuat, e);
        if (this.t >= 1) {
          this.state = "opening";
          this.t = 0;
          this.closed.visible = false;
          this.openG.visible = true;
          this.setHalves(1);
        }
        break;
      }
      case "opening": {
        this.t += dt / 0.55;
        this.setHalves(1 - ease(this.t));
        if (this.t >= 1) this.state = "open";
        break;
      }
      case "flipping": {
        this.t += dt / 0.5;
        const forward = this.flipTo > this.spread;
        const from = forward ? -OPEN_ANGLE : -(Math.PI - OPEN_ANGLE);
        const to = forward ? -(Math.PI - OPEN_ANGLE) : -OPEN_ANGLE;
        this.flipG.rotation.y = from + (to - from) * ease(this.t);
        if (this.t >= 1) {
          this.setSpread(this.flipTo);
          this.flipG.visible = false;
          this.state = "open";
        }
        break;
      }
      case "shutting": {
        this.t += dt / 0.4;
        this.setHalves(ease(this.t));
        if (this.t >= 1) {
          this.openG.visible = false;
          this.closed.visible = true;
          this.state = "returning";
          this.t = 0;
        }
        break;
      }
      case "returning": {
        this.t += dt / 0.85;
        const e = ease(this.t);
        this.group.position.lerpVectors(this.restPos, this.fromPos, e);
        this.group.position.y += Math.sin(Math.min(1, this.t) * Math.PI) * 1.1;
        this.group.quaternion.slerpQuaternions(this.restQuat, this.fromQuat, e);
        if (this.t >= 1) {
          this.state = "hidden";
          this.group.visible = false;
        }
        break;
      }
      case "hidden":
      case "open":
        break;
    }
  }
}
