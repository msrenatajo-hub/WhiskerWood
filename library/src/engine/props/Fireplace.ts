import * as THREE from "three";
import { Materials } from "../materials";

export interface FireplaceHandle {
  group: THREE.Group;
  update(elapsed: number): void;
}

/**
 * A stone hearth with glowing logs and a warm, flickering firelight. Origin is
 * at the floor; place it against a wall.
 */
export function createFireplace(): FireplaceHandle {
  const group = new THREE.Group();
  const stone = Materials.stone(2);

  // Surround
  const mantle = new THREE.Mesh(new THREE.BoxGeometry(6, 5.5, 1.6), stone);
  mantle.position.set(0, 2.75, 0);
  mantle.castShadow = true;
  mantle.receiveShadow = true;
  group.add(mantle);

  // Firebox opening (dark recess)
  const opening = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3, 1),
    Materials.flat(0x120a06, 1)
  );
  opening.position.set(0, 1.9, 0.5);
  group.add(opening);

  // Mantel shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 2), Materials.darkWood(2));
  shelf.position.set(0, 5.7, 0.1);
  group.add(shelf);

  // Logs
  const logMat = Materials.flat(0x3a2412, 0.9);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2, 6), logMat);
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0.7 + i * 0.18, 0.6 + (i - 1) * 0.12);
    group.add(log);
  }

  // Flames — a few emissive cones
  const flameMat = Materials.emissive(0xff8a2a, 3.2);
  flameMat.transparent = true;
  flameMat.opacity = 0.95;
  const flames: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.0, 6), flameMat.clone());
    flame.position.set((i - 1.5) * 0.4, 1.2, 0.6);
    group.add(flame);
    flames.push(flame);
  }

  const light = new THREE.PointLight(0xff8433, 10, 26, 2);
  light.position.set(0, 2.1, 1.2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  group.add(light);

  return {
    group,
    update(t) {
      const f = 0.8 + 0.14 * Math.sin(t * 11) + 0.08 * Math.sin(t * 23 + 1.3);
      light.intensity = 10 * f;
      flames.forEach((fl, i) => {
        const s = 0.7 + 0.4 * Math.abs(Math.sin(t * (8 + i) + i));
        fl.scale.set(1, s, 1);
        (fl.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.8 + 1.2 * s;
      });
    },
  };
}
