import * as THREE from "three";
import { Materials } from "../materials";

export interface LanternHandle {
  group: THREE.Group;
  update(elapsed: number): void;
}

/**
 * A brass lantern hanging on a chain with a warm, gently flickering glow. The
 * group's origin is the ceiling attach point; the lantern hangs below it.
 */
export function createLantern(color = 0xffb85a, seed = 0): LanternHandle {
  const group = new THREE.Group();
  const drop = 2.2;

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, drop, 5), Materials.brass());
  chain.position.y = -drop / 2;
  group.add(chain);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.35, 6), Materials.brass());
  cap.position.y = -drop + 0.18;
  group.add(cap);

  const glassMat = Materials.emissive(color, 2.6);
  glassMat.transparent = true;
  glassMat.opacity = 0.92;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.6, 8), glassMat);
  glass.position.y = -drop - 0.2;
  group.add(glass);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.14, 8), Materials.brass());
  base.position.y = -drop - 0.55;
  group.add(base);

  const light = new THREE.PointLight(color, 7, 18, 2);
  light.position.y = -drop - 0.2;
  group.add(light);

  const baseIntensity = 7;
  return {
    group,
    update(t) {
      const f = 0.86 + 0.1 * Math.sin(t * 7 + seed) + 0.05 * Math.sin(t * 17 + seed * 2);
      light.intensity = baseIntensity * f;
      glassMat.emissiveIntensity = 2.6 * f;
      group.rotation.z = 0.025 * Math.sin(t * 1.2 + seed);
    },
  };
}
