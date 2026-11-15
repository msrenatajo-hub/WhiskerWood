// ------------------------------------------------------------
//  🖤 A SHADOW-WISP — the original look: a little ball of black smoke
//  with two glowing purple eyes (they always turn to look at you).
// ------------------------------------------------------------
import * as THREE from "three";
import { glowTexture } from "./phase2.js";

export function makeWisp(size = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ color: 0x0a0612, transparent: true, opacity: 0.85 }));
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xd88aff }));
  eyeL.position.set(-0.18, 0.1, 0.45);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x6a3a9a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(2.2);
  g.add(body, eyeL, eyeR, halo);
  g.scale.setScalar(size);
  // the eyes always find you
  body.onBeforeRender = (_r, _s, cam) => {
    const p = new THREE.Vector3();
    g.getWorldPosition(p);
    g.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
  };
  return g;
}
