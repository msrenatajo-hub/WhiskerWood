import * as THREE from "three";
import { Materials } from "../materials";

/** Interior dimensions of the great hall (world units). */
export const ROOM = {
  halfW: 22,
  halfD: 15,
  height: 18,
};

/**
 * Builds the library hall shell: plank floor, panelled walls, a beamed ceiling,
 * and tall glowing stained-glass windows on the back wall. Pure geometry — the
 * lights that make it cozy live in {@link Library}.
 */
export function createRoom(): THREE.Group {
  const g = new THREE.Group();
  const { halfW, halfD, height } = ROOM;
  const W = halfW * 2;
  const D = halfD * 2;

  // Floor — planks
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), Materials.wood(10));
  floor.position.y = -0.25;
  floor.receiveShadow = true;
  g.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), Materials.darkWood(6));
  ceiling.position.y = height;
  g.add(ceiling);

  // Ceiling beams across the width
  const beamMat = Materials.darkWood(2);
  for (let i = -2; i <= 2; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.8, 0.8), beamMat);
    beam.position.set(0, height - 0.6, i * (D / 5));
    beam.castShadow = true;
    g.add(beam);
  }

  // Walls (panelled)
  const wallMat = Materials.darkWood(6);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, height, 0.6), wallMat);
  back.position.set(0, height / 2, -halfD);
  back.receiveShadow = true;
  g.add(back);

  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.6, height, D), wallMat);
    side.position.set(sx * halfW, height / 2, 0);
    side.receiveShadow = true;
    g.add(side);
  }
  // Front wall (behind the camera) with a wide doorway gap left open.
  for (const sx of [-1, 1]) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 3, height, 0.6), wallMat);
    front.position.set(sx * (W / 4 + 1.5), height / 2, halfD);
    g.add(front);
  }

  // Wainscot skirting for a carved look
  const skirt = Materials.wood(8);
  const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(W, 2, 0.3), skirt);
  skirtBack.position.set(0, 1, -halfD + 0.4);
  g.add(skirtBack);

  // Tall stained-glass windows high on the back wall — glowing panels.
  const glassColors = [0xffcf8a, 0xef8f6a, 0x8fbfe0, 0xb894d6, 0x9fd08a];
  for (const wx of [-11, 0, 11]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 8.4, 0.4), Materials.darkWood(1));
    frame.position.set(wx, 11.5, -halfD + 0.35);
    g.add(frame);
    // grid of colored, emissive glass squares
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        const col = glassColors[(r * 2 + c + (wx | 0)) % glassColors.length];
        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.7, 1.7),
          Materials.emissive(col, 2.4)
        );
        pane.position.set(wx - 0.95 + c * 1.9, 9.4 + r * 1.9, -halfD + 0.6);
        g.add(pane);
      }
    }
  }

  return g;
}
