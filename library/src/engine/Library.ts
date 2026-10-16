import * as THREE from "three";
import type { AppEvents } from "@/types";
import type { Emitter } from "@/utils/events";
import { SHELVES } from "@/data/registry";
import { Engine } from "./Engine";
import { FirstPersonControls } from "./FirstPersonControls";
import { Picker } from "./Picker";
import { Book3D } from "./Book3D";
import { createRoom, ROOM } from "./props/Room";
import { createBookshelf, type ShelfHandle } from "./props/Bookshelf";
import { createLantern } from "./props/Lantern";
import { createFireplace } from "./props/Fireplace";
import { createDust } from "./props/Dust";
import { createDesk } from "./props/Furniture";
import { createMapTable } from "./props/MapTable";
import { createOwlFigurine, createCritterFigurine } from "./props/Figurine";

/** Where a shelf sits and which way it faces. */
interface Slot {
  x: number;
  z: number;
  ry: number;
}

// 13 wall slots: 4 left, 5 right, 4 back (back-center is the fireplace).
const SLOTS: Slot[] = [
  { x: -20.3, z: -9, ry: Math.PI / 2 },
  { x: -20.3, z: -3, ry: Math.PI / 2 },
  { x: -20.3, z: 3, ry: Math.PI / 2 },
  { x: -20.3, z: 9, ry: Math.PI / 2 },
  { x: 20.3, z: -11, ry: -Math.PI / 2 },
  { x: 20.3, z: -5.5, ry: -Math.PI / 2 },
  { x: 20.3, z: 0, ry: -Math.PI / 2 },
  { x: 20.3, z: 5.5, ry: -Math.PI / 2 },
  { x: 20.3, z: 11, ry: -Math.PI / 2 },
  { x: -13, z: -14.3, ry: 0 },
  { x: -6.5, z: -14.3, ry: 0 },
  { x: 6.5, z: -14.3, ry: 0 },
  { x: 13, z: -14.3, ry: 0 },
];

// Bookshelf row geometry (mirrors props/Bookshelf.ts) for placing figurines.
const SHELF_ROW_GAP = (9 - 0.8) / 5;
const shelfBoardTop = (row: number): number => 0.4 + row * SHELF_ROW_GAP + 0.075;

interface ShelfEntry {
  handle: ShelfHandle;
}

/**
 * Assembles the walkable library, wires picking + the first-person controls,
 * and owns the reading ritual: a book flies from its shelf to the desk while
 * the camera glides in; ←/→ turn its pages; closing sends it home and hands
 * the camera back to the walker.
 */
export class Library {
  readonly controls: FirstPersonControls;
  private picker: Picker;
  private book = new Book3D();
  private shelves = new Map<string, ShelfEntry>();
  private updaters: ((t: number, dt: number) => void)[] = [];
  private figurinesBuilt = false;

  // Reading-camera direction: where it glides to and what it watches.
  private camMode: "free" | "toBook" | "toFree" = "free";
  private readPos = new THREE.Vector3(0, 5.15, 5.1);
  private readLook = new THREE.Vector3(0, 3.05, 1.0);
  private curLook = new THREE.Vector3();

  constructor(private engine: Engine, private bus: Emitter<AppEvents>) {
    const dom = engine.renderer.domElement;
    this.controls = new FirstPersonControls(engine.camera, dom, {
      eyeHeight: 5.5,
      start: new THREE.Vector3(0, 5.5, 10),
      startYaw: 0, // facing the back wall
      bounds: { minX: -19, maxX: 19, minZ: -12, maxZ: 12 },
    });
    this.picker = new Picker(dom, engine.camera);
    // A clean tap (not a look-drag) selects whatever is under the cursor.
    this.controls.onTap = (x, y) => this.picker.tap(x, y);

    this.build();

    // Page turning + closing while a book is open (but never while the Keeper
    // is typing into a form field — arrows and C belong to the text then).
    window.addEventListener("keydown", (e) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (!this.book.isOpen) return;
      if (e.code === "ArrowRight") this.book.flip(1);
      else if (e.code === "ArrowLeft") this.book.flip(-1);
      else if (e.code === "KeyC") this.bus.emit("overlay:close", undefined);
    });

    // Build figurines once the Codex data arrives.
    this.bus.on("data:change", ({ pages }) => {
      if (this.figurinesBuilt) return;
      const animals = pages.filter((p) => p.category === "animal");
      if (animals.length) {
        this.buildFigurines(animals.map((a) => ({ id: a.id, name: a.title + " " + a.tags.join(" ") })));
        this.figurinesBuilt = true;
      }
    });

    // One place drives the camera + the book + every animated prop.
    engine.onUpdate((dt, t) => {
      this.updateCamera(dt);
      this.controls.update(dt);
      this.book.update(dt);
      for (const u of this.updaters) u(t, dt);
    });
  }

  private build(): void {
    const scene = this.engine.scene;
    scene.fog = new THREE.FogExp2(0x1a120b, 0.018);

    scene.add(createRoom());
    this.addLights();

    // Shelves at their wall slots.
    SHELVES.forEach((shelf, i) => {
      const slot = SLOTS[i % SLOTS.length];
      const handle = createBookshelf(shelf);
      handle.group.position.set(slot.x, 0, slot.z);
      handle.group.rotation.y = slot.ry;
      scene.add(handle.group);
      this.shelves.set(shelf.id, { handle });

      this.picker.register({
        object: handle.group,
        onEnter: () => handle.setHover(true),
        onLeave: () => handle.setHover(false),
        onClick: () => this.bus.emit("shelf:open", { shelfId: shelf.id }),
      });
    });

    // Hanging lanterns along the hall.
    for (const x of [-9, 9]) {
      for (const z of [-6, 0, 6]) {
        const lantern = createLantern(0xffb85a, x * 0.7 + z);
        lantern.group.position.set(x, ROOM.height - 6, z);
        scene.add(lantern.group);
        this.updaters.push((t) => lantern.update(t));
      }
    }

    // Fireplace on the back wall, between the two center shelves.
    const fire = createFireplace();
    fire.group.position.set(0, 0, -14);
    scene.add(fire.group);
    this.updaters.push((t) => fire.update(t));

    // Reading desk — where books land.
    const desk = createDesk();
    desk.position.set(0, 0, 1);
    scene.add(desk);

    // The world-map table (in place of the old search crystal). Clicking it
    // opens the Atlas of the Great Forest.
    const mapTable = createMapTable();
    mapTable.group.position.set(0, 0, 6.9); // behind the reading camera at z≈5.1
    this.engine.scene.add(mapTable.group);
    this.picker.register({
      object: mapTable.group,
      onClick: () => this.bus.emit("shelf:open", { shelfId: "atlas" }),
    });

    // The reading book itself (hidden until summoned).
    scene.add(this.book.group);

    // Dust in the air, following the camera.
    const dust = createDust(700);
    scene.add(dust.points);
    this.updaters.push((t) => dust.update(t, this.engine.camera.position));
  }

  /** Carved animal figurines on the Naturalist's Journal shelf. */
  private buildFigurines(animals: { id: string; name: string }[]): void {
    const entry = this.shelves.get("naturalist");
    if (!entry) return;
    const n = animals.length;
    animals.forEach((animal, i) => {
      const fig = /owl/i.test(animal.name) ? createOwlFigurine() : createCritterFigurine();
      fig.position.set((i - (n - 1) / 2) * 1.2, shelfBoardTop(2), 0.62);
      entry.handle.group.add(fig);
      this.picker.register({
        object: fig,
        onEnter: () => fig.scale.setScalar(1.18),
        onLeave: () => fig.scale.setScalar(1),
        onClick: () => this.bus.emit("page:open", { pageId: animal.id }),
      });
    });
  }

  private addLights(): void {
    const scene = this.engine.scene;
    scene.add(new THREE.AmbientLight(0xffe9c4, 0.22));
    scene.add(new THREE.HemisphereLight(0x9fbfe0, 0x241a10, 0.35));

    const sun = new THREE.DirectionalLight(0xffdca0, 1.35);
    sun.position.set(12, 22, 14);
    sun.target.position.set(0, 4, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -26;
    c.right = 26;
    c.top = 20;
    c.bottom = -20;
    c.near = 1;
    c.far = 90;
    c.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(sun.target);
  }

  // ---- The reading camera ----

  private updateCamera(dt: number): void {
    if (this.camMode === "free") return;
    const cam = this.engine.camera;
    const k = 1 - Math.exp(-3.2 * dt);
    const targetPos = this.camMode === "toBook" ? this.readPos : this.controls.poseEye();
    const targetLook = this.camMode === "toBook" ? this.readLook : this.controls.poseLook();
    cam.position.lerp(targetPos, k);
    this.curLook.lerp(targetLook, k);
    cam.lookAt(this.curLook);
    if (this.camMode === "toFree" && cam.position.distanceTo(targetPos) < 0.04) {
      this.camMode = "free";
      this.controls.cinematic = false;
    }
  }

  // ---- Public API used by the App / router ----

  /**
   * The ritual: summon a book (already rendered to page canvases) from its
   * shelf to the desk, and glide the camera in to read it.
   */
  private bookCanvases: HTMLCanvasElement[] = [];

  /** The Codex page visible on the current spread (for "Edit this book"). */
  currentPageId(): string | null {
    const sIdx = 2 * this.book.currentSpread;
    // prefer the left page, then the right, then whatever came before
    for (let i = sIdx; i >= 0; i--) {
      const id = this.bookCanvases[i]?.dataset.ownerPageId;
      if (id) return id;
    }
    const right = this.bookCanvases[sIdx + 1]?.dataset.ownerPageId;
    return right ?? null;
  }

  openBook(pages: HTMLCanvasElement[], shelfId: string | undefined, coverColor: number): void {
    this.bookCanvases = pages;
    let fromPos = new THREE.Vector3(0, 7, -12);
    let fromQuat = new THREE.Quaternion();
    const entry = shelfId ? this.shelves.get(shelfId) : undefined;
    if (entry) {
      entry.handle.group.updateMatrixWorld(true);
      fromPos = entry.handle.group.localToWorld(new THREE.Vector3(0, 5, 1.3));
      fromQuat = entry.handle.group.quaternion.clone();
    }
    this.book.open(pages, { fromPos, fromQuat, coverColor });
    this.controls.cinematic = true;
    this.curLook.copy(this.controls.poseLook());
    this.camMode = "toBook";
  }

  /** Shut the book, send it home, and hand the camera back to the walker. */
  closeBook(): void {
    this.book.close();
    if (this.controls.cinematic) this.camMode = "toFree";
  }

  /** Make the shelves whose ids are given glow (search feedback). */
  setSearchGlow(shelfIds: string[]): void {
    const set = new Set(shelfIds);
    for (const [id, entry] of this.shelves) entry.handle.setGlow(set.has(id));
  }

  /** Freeze walking + picking while an overlay or the book owns the screen. */
  setPickingEnabled(enabled: boolean): void {
    this.picker.setEnabled(enabled);
    this.controls.setEnabled(enabled);
  }
}
