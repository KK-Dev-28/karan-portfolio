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
  template: `<canvas #cv class="cv" [class.off]="disabled" aria-hidden="true"></canvas>`,
  styleUrl: './cursor-3d.component.scss',
})
export class Cursor3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv') cv!: ElementRef<HTMLCanvasElement>;

  private readonly doc = inject(DOCUMENT);
  disabled = false;
  private rafId = 0;
  private renderer: import('three').WebGLRenderer | null = null;
  private mesh: import('three').Mesh | null = null;
  private scene: import('three').Scene | null = null;
  private camera: import('three').PerspectiveCamera | null = null;
  private threeMod: typeof import('three') | null = null;

  async ngAfterViewInit(): Promise<void> {
    const win = this.doc.defaultView;
    const reduce = win?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !win) {
      this.disabled = true;
      return;
    }

    const THREE = await import('three');
    this.threeMod = THREE;

    this.doc.body.classList.add('cursor-3d-on');

    const canvas = this.cv.nativeElement;
    const w = 140;
    const h = 140;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, win.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
    this.camera.position.z = 2.85;

    const geo = new THREE.IcosahedronGeometry(0.58, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      metalness: 0.4,
      roughness: 0.28,
      emissive: 0x061a14,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    const pt = new THREE.PointLight(0x60a5fa, 1.15, 12);
    pt.position.set(1.4, 1.2, 2.4);
    this.scene.add(amb, pt);

    const loop = () => {
      this.rafId = win.requestAnimationFrame(loop);
      if (this.mesh) {
        this.mesh.rotation.x += 0.011;
        this.mesh.rotation.y += 0.017;
      }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    if (this.disabled) return;
    const el = this.cv?.nativeElement;
    if (!el) return;
    el.style.left = `${e.clientX}px`;
    el.style.top = `${e.clientY}px`;
  }

  ngOnDestroy(): void {
    const win = this.doc.defaultView;
    if (win) win.cancelAnimationFrame(this.rafId);
    this.doc.body.classList.remove('cursor-3d-on');
    if (this.mesh && this.threeMod) {
      this.mesh.geometry.dispose();
      const m = this.mesh.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m.dispose();
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.mesh = null;
    this.scene = null;
    this.camera = null;
    this.threeMod = null;
  }
}
