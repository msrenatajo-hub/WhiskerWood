import * as THREE from "three";
import { POST_VERT, POST_FRAG } from "./shaders";

export type Updater = (dt: number, elapsed: number) => void;

/**
 * Owns the renderer, scene, camera, and the render loop. Renders the scene into
 * a linear-HDR target, then a fullscreen post pass applies ACES tonemapping,
 * vignette, and film grain for a warm, filmic look.
 */
export class Engine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private clock = new THREE.Clock();
  private updaters = new Set<Updater>();

  private rt: THREE.WebGLRenderTarget;
  private postScene = new THREE.Scene();
  private postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private postMaterial: THREE.ShaderMaterial;

  /** Post-pass exposure; tweak for mood. */
  exposure = 1.18;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // The post pass does tonemapping + sRGB, so the scene renders linear HDR.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 6.5, 19);

    const { x, y } = this.bufferSize();
    this.rt = new THREE.WebGLRenderTarget(x, y, {
      type: THREE.HalfFloatType,
      samples: 4, // MSAA inside the HDR target (WebGL2)
    });

    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: POST_VERT,
      fragmentShader: POST_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: this.rt.texture },
        uExposure: { value: this.exposure },
        uTime: { value: 0 },
        uVignette: { value: 0.34 },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial);
    quad.frustumCulled = false;
    this.postScene.add(quad);

    window.addEventListener("resize", this.resize);
  }

  private bufferSize(): { x: number; y: number } {
    const pr = this.renderer.getPixelRatio();
    return { x: Math.floor(window.innerWidth * pr), y: Math.floor(window.innerHeight * pr) };
  }

  private resize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const { x, y } = this.bufferSize();
    this.rt.setSize(x, y);
  };

  /** Register a per-frame callback. Returns an unregister function. */
  onUpdate(fn: Updater): () => void {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  start(): void {
    const loop = (): void => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      for (const u of this.updaters) u(dt, t);

      // Scene → HDR target
      this.renderer.setRenderTarget(this.rt);
      this.renderer.render(this.scene, this.camera);

      // HDR target → screen, through the post shader
      this.postMaterial.uniforms.uTime.value = t;
      this.postMaterial.uniforms.uExposure.value = this.exposure;
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postScene, this.postCamera);
    };
    loop();
  }
}
