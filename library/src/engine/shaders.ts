/**
 * GLSL for the engine's custom passes. Kept as plain strings (no build step).
 *
 * The post pass and dust motes are adapted from the techniques in
 * github.com/deedy/glacial-valley: scene renders to a linear-HDR target, then a
 * fullscreen pass applies ACES tonemapping + vignette + film grain; dust is a
 * camera-following point cloud that twinkles.
 */

/** Fullscreen-quad vertex shader (position is a 2×2 plane in clip space). */
export const POST_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** ACES tonemap → warm tint → vignette → grain → sRGB encode. */
export const POST_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform float uExposure;
uniform float uTime;
uniform float uVignette;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 aces(vec3 x) {
  return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  c *= uExposure;
  c = aces(c);
  // a touch warm — candlelight bias
  c = pow(c, vec3(0.98, 1.0, 1.03));
  // vignette
  float r = length(vUv - 0.5);
  c *= 1.0 - uVignette * r * r;
  // subtle film grain
  c += (hash(vUv * vec2(1919.0, 1023.0) + fract(uTime) * 11.0) - 0.5) * 0.012;
  // sRGB encode (renderer outputs linear)
  c = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
  gl_FragColor = vec4(c, 1.0);
}
`;

/** Dust motes drifting in the air, wrapped in a box that follows the camera. */
export const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime;
  p.x += sin(t * 0.20 + aSeed * 12.0) * 1.3;
  p.y += sin(t * 0.13 + aSeed * 7.0) * 0.9 + t * 0.12; // slow drift upward
  p.z += cos(t * 0.17 + aSeed * 5.0) * 1.3;
  // keep motes in a box centered on the viewer so they're always around you
  p = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5 + uCenter;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  gl_PointSize = clamp(70.0 / max(dist, 1.0), 1.0, 6.0) * (0.5 + 0.7 * aSeed);
  vAlpha = 0.30 + 0.70 * pow(0.5 + 0.5 * sin(t * 0.8 + aSeed * 30.0), 2.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const DUST_FRAG = /* glsl */ `
precision highp float;
varying float vAlpha;
uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0) discard;
  float a = smoothstep(1.0, 0.0, d) * vAlpha;
  gl_FragColor = vec4(uColor, a);
}
`;
