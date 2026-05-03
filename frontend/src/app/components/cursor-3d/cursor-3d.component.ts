import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-cursor-3d',
  standalone: true,
  template: `<canvas #cv class="cv" [class.off]="disabled" [class.ready]="visible" aria-hidden="true"></canvas>`,
  styleUrl: './cursor-3d.component.scss',
})
export class Cursor3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv') cv!: ElementRef<HTMLCanvasElement>;

  private readonly doc = inject(DOCUMENT);
  disabled = false;
  visible = false;
  private rafId = 0;
  private renderer: import('three').WebGLRenderer | null = null;
  private ring: import('three').Mesh | null = null;
  private glow: import('three').Mesh | null = null;
  private scene: import('three').Scene | null = null;
  private camera: import('three').PerspectiveCamera | null = null;
  private envTarget: import('three').WebGLRenderTarget | null = null;
  /** PMREM generator — kept until destroy so environment map stays valid */
  private pmremGenerator: InstanceType<typeof import('three').PMREMGenerator> | null = null;

  private targetX = 0;
  private targetY = 0;
  private curX = 0;
  private curY = 0;
  private hoverT = 0;

  async ngAfterViewInit(): Promise<void> {
    const win = this.doc.defaultView;
    const reduce = win?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !win) {
      this.disabled = true;
      return;
    }

    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

    this.doc.body.classList.add('cursor-3d-on');

    const canvas = this.cv.nativeElement;
    const w = 112;
    const h = 112;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(2, win.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.88;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.06, 50);
    this.camera.position.z = 3.35;

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envRt = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.envTarget = envRt;
    this.scene.environment = envRt.texture;

    const glowGeo = new THREE.TorusGeometry(0.58, 0.022, 16, 96);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.glow.rotation.x = Math.PI / 2.2;
    this.glow.renderOrder = 0;
    this.scene.add(this.glow);

    const ringGeo = new THREE.TorusGeometry(0.56, 0.026, 24, 96);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdf4,
      metalness: 0.02,
      roughness: 0.04,
      transmission: 0.97,
      thickness: 0.45,
      transparent: true,
      opacity: 0.98,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      ior: 1.48,
      envMapIntensity: 1.15,
      reflectivity: 0.4,
      emissive: 0x022c1f,
      emissiveIntensity: 0.09,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2.2;
    this.ring.renderOrder = 1;
    this.scene.add(this.ring);

    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(2, 4, 5);
    const fill = new THREE.DirectionalLight(0xa5f3fc, 0.35);
    fill.position.set(-4, -2, 4);
    this.scene.add(amb, key, fill);

    const loop = () => {
      this.rafId = win.requestAnimationFrame(loop);

      this.curX += (this.targetX - this.curX) * 0.24;
      this.curY += (this.targetY - this.curY) * 0.24;
      const el = this.cv?.nativeElement;
      if (el) {
        el.style.left = `${this.curX}px`;
        el.style.top = `${this.curY}px`;
      }

      this.hoverT += ((this.pointerOverInteractive ? 1 : 0) - this.hoverT) * 0.14;

      const scale = 1 + this.hoverT * 0.18;
      const spin = 1 + this.hoverT * 0.5;
      if (this.ring) {
        this.ring.rotation.z += 0.012 * spin;
        this.ring.scale.setScalar(scale);
      }
      if (this.glow) {
        this.glow.rotation.z -= 0.008 * spin;
        this.glow.scale.setScalar(scale * 1.06);
        const gm = this.glow.material as import('three').MeshBasicMaterial;
        gm.opacity = 0.16 + this.hoverT * 0.14;
      }

      const rm = this.ring?.material as import('three').MeshPhysicalMaterial | undefined;
      if (rm) {
        rm.emissiveIntensity = 0.08 + this.hoverT * 0.35;
        rm.envMapIntensity = 1.05 + this.hoverT * 0.35;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  private pointerOverInteractive = false;

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    if (this.disabled) return;
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.visible) {
      this.curX = e.clientX;
      this.curY = e.clientY;
      this.visible = true;
    }

    const hit = this.doc.elementFromPoint(e.clientX, e.clientY);
    this.pointerOverInteractive = !!hit?.closest(
      'button, a, input, textarea, select, [role="button"], label, .admin-btn, .login-btn',
    );
  }

  ngOnDestroy(): void {
    const win = this.doc.defaultView;
    if (win) win.cancelAnimationFrame(this.rafId);
    this.doc.body.classList.remove('cursor-3d-on');

    const disposeMesh = (m: import('three').Mesh | null) => {
      if (!m) return;
      m.geometry.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat.dispose();
    };
    disposeMesh(this.ring);
    disposeMesh(this.glow);

    if (this.scene) this.scene.environment = null;
    this.envTarget?.dispose();
    this.envTarget = null;
    this.pmremGenerator?.dispose();
    this.pmremGenerator = null;

    this.renderer?.dispose();
    this.renderer = null;
    this.ring = null;
    this.glow = null;
    this.scene = null;
    this.camera = null;
  }
}
