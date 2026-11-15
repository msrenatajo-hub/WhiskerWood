import * as THREE from "three";
import { DUST_VERT, DUST_FRAG } from "../shaders";

export interface DustHandle {
  points: THREE.Points;
  update(elapsed: number, cameraPos: THREE.Vector3): void;
}

/**
 * Floating dust motes that drift through the air and twinkle. They live in a
 * box that follows the camera, so the air always feels alive around you.
 * Adapted from the mote technique in glacial-valley.
 */
export function createDust(count = 700): DustHandle {
  const box = new THREE.Vector3(44, 18, 30);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * box.x;
    positions[i * 3 + 1] = Math.random() * box.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * box.z;
    seeds[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3(0, 6, 0) },
      uBox: { value: box },
      uColor: { value: new THREE.Color(0x6a5535) }, // additive, so kept dim
    },
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  return {
    points,
    update(t, camPos) {
      material.uniforms.uTime.value = t;
      (material.uniforms.uCenter.value as THREE.Vector3).copy(camPos);
    },
  };
}
