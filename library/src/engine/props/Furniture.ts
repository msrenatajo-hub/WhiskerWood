import * as THREE from "three";
import { Materials } from "../materials";

/**
 * The central reading desk — the landing pad where books from the shelves fly
 * to and open. Kept bare on top so the Book3D can rest on it.
 */
export function createDesk(): THREE.Group {
  const g = new THREE.Group();
  const wood = Materials.wood(2);

  const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2.6), wood);
  top.position.y = 2.1;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  const legMat = Materials.darkWood(1);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.1, 2.2), legMat);
    leg.position.set(sx * 2.1, 1.05, 0);
    leg.castShadow = true;
    g.add(leg);
  }
  return g;
}
