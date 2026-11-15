import * as THREE from "three";

/**
 * Little carved wooden animal figurines that stand on the Naturalist's Journal
 * shelf. Each is clickable and opens its animal's book. Origin at the base.
 */

function carved(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
}

/** A carved owl (used for owl-ish animals). ~0.5 units tall. */
export function createOwlFigurine(): THREE.Group {
  const g = new THREE.Group();
  const wood = carved(0x6b4a2c);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 10), carved(0x4a3320));
  base.position.y = 0.025;
  g.add(base);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), wood);
  body.scale.set(1, 1.25, 0.95);
  body.position.y = 0.21;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), wood);
  head.position.y = 0.39;
  g.add(head);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 6), wood);
    ear.position.set(s * 0.06, 0.48, 0);
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.028, 10), carved(0xf0dfae));
    eye.position.set(s * 0.04, 0.41, 0.086);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), carved(0x1c120a));
    pupil.position.set(s * 0.04, 0.41, 0.09);
    g.add(pupil);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), carved(0x59391f));
    wing.scale.set(0.5, 1.4, 0.8);
    wing.position.set(s * 0.12, 0.21, 0);
    g.add(wing);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), carved(0xa9763f));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.375, 0.1);
  g.add(beak);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return g;
}

/** A generic carved critter (mouse-ish) for other animals. ~0.42 tall. */
export function createCritterFigurine(): THREE.Group {
  const g = new THREE.Group();
  const wood = carved(0x7a5535);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.05, 10), carved(0x4a3320));
  base.position.y = 0.025;
  g.add(base);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), wood);
  body.scale.set(0.9, 1.0, 1.3);
  body.position.set(0, 0.16, -0.02);
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), wood);
  head.scale.set(0.9, 0.9, 1.15);
  head.position.set(0, 0.28, 0.12);
  g.add(head);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), carved(0x8a6238));
    ear.position.set(s * 0.05, 0.37, 0.09);
    ear.rotation.y = s * 0.3;
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), carved(0x1c120a));
    eye.position.set(s * 0.035, 0.3, 0.2);
    g.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), carved(0x33231a));
  nose.position.set(0, 0.27, 0.22);
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 14, Math.PI * 1.1), wood);
  tail.position.set(0, 0.1, -0.15);
  tail.rotation.x = Math.PI / 2.4;
  g.add(tail);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return g;
}
