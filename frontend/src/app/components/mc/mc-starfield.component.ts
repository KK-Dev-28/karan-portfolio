import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Star { x: number; y: number; z: number; pz: number; tone: 0 | 1 | 2 }

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/**
 * A full-viewport 3D star field behind the Mission Control page. Stars fly
 * toward the viewer, drift against the pointer for parallax, and stretch into
 * warp streaks when the page is scrolled fast. Rendered at device pixel ratio
 * (capped at 2) so it stays sharp on HD and retina screens. The Konami code
 * engages hyperspace for a few seconds.
 */
@Component({
  selector: 'mc-starfield',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #cv class="sf" aria-hidden="true"></canvas>
    <p class="hyper" *ngIf="hyper()" role="status">Hyperspace engaged · hold on</p>
  `,
  styles: [`
    :host{display:contents}
    .sf{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none}
    .hyper{position:fixed;z-index:9000;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;padding:14px 26px;border-radius:99px;
      background:rgba(10,11,12,.75);border:1px solid rgba(227,179,65,.6);color:#e3b341;backdrop-filter:blur(8px);
      font:500 13px var(--font-mono);letter-spacing:.2em;text-transform:uppercase;animation:hy 3.6s ease forwards}
    @keyframes hy{0%{opacity:0;transform:translate(-50%,-40%) scale(.9)}12%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
  `],
})
export class McStarfieldComponent implements OnInit, OnDestroy {
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;
  readonly hyper = signal(false);
  private zone = inject(NgZone);
  private ctx!: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private w = 0; private h = 0; private dpr = 1;
  private raf = 0;
  private mx = 0; private my = 0; private tmx = 0; private tmy = 0;
  private lastY = 0; private warp = 0; private boost = 0;
  private colors: [string, string, string] = ['241,237,227', '240,200,96', '94,234,212'];
  private alphaScale = 1;
  private keys: string[] = [];
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private mo?: MutationObserver;

  ngOnInit() {
    this.ctx = this.cv.nativeElement.getContext('2d', { alpha: true })!;
    this.readTheme();
    this.resize();
    this.mo = new MutationObserver(() => this.readTheme());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.zone.runOutsideAngular(() => {
      addEventListener('resize', this.resize);
      addEventListener('pointermove', this.onMove, { passive: true });
      addEventListener('keydown', this.onKey);
      document.addEventListener('visibilitychange', this.onVis);
      this.lastY = scrollY;
      if (this.reduced) this.draw(true); else this.raf = requestAnimationFrame(this.frame);
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    removeEventListener('pointermove', this.onMove);
    removeEventListener('keydown', this.onKey);
    document.removeEventListener('visibilitychange', this.onVis);
    this.mo?.disconnect();
  }

  private readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (v: string, fb: string) => {
      const m = cs.getPropertyValue(v).trim().match(/^#([0-9a-f]{6})$/i);
      if (!m) return fb;
      const n = parseInt(m[1], 16);
      return `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    };
    this.colors = [rgb('--text', '241,237,227'), rgb('--accent-2', '240,200,96'), rgb('--electric', '94,234,212')];
    const bg = cs.getPropertyValue('--bg').trim();
    // Light themes get fewer, fainter stars so the paper stays calm.
    this.alphaScale = /^#[ef]/i.test(bg) ? .35 : 1;
    if (this.reduced) this.draw(true);
  }

  private resize = () => {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight;
    const c = this.cv.nativeElement;
    c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const n = Math.min(900, Math.round(this.w * this.h / 1700));
    this.stars = Array.from({ length: n }, () => this.spawn(Math.random()));
    if (this.reduced) this.draw(true);
  };

  private spawn(z: number): Star {
    const r = Math.random();
    return { x: (Math.random() * 2 - 1) * 1.6, y: (Math.random() * 2 - 1) * 1.6, z, pz: z, tone: r < .8 ? 0 : r < .92 ? 1 : 2 };
  }

  private onMove = (e: PointerEvent) => { this.tmx = e.clientX / this.w - .5; this.tmy = e.clientY / this.h - .5; };
  private onVis = () => {
    cancelAnimationFrame(this.raf);
    if (!document.hidden && !this.reduced) this.raf = requestAnimationFrame(this.frame);
  };
  private onKey = (e: KeyboardEvent) => {
    this.keys = [...this.keys, e.key].slice(-KONAMI.length);
    if (KONAMI.every((k, i) => this.keys[i]?.toLowerCase() === k.toLowerCase())) {
      this.keys = [];
      this.boost = 3.6;
      this.zone.run(() => { this.hyper.set(true); setTimeout(() => this.hyper.set(false), 3600); });
    }
  };

  private frame = () => {
    // Scroll velocity becomes warp; it eases back to a slow cruise.
    const dy = Math.abs(scrollY - this.lastY); this.lastY = scrollY;
    this.warp += (Math.min(dy / 40, 1.6) - this.warp) * .08;
    this.boost = Math.max(0, this.boost - 1 / 60);
    this.mx += (this.tmx - this.mx) * .05; this.my += (this.tmy - this.my) * .05;
    this.draw(false);
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(still: boolean) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const speed = still ? 0 : .0011 + this.warp * .012 + (this.boost > 0 ? .045 : 0);
    const streak = this.warp > .12 || this.boost > 0;
    const f = Math.max(w, h) * .55;
    const cx = w / 2 - this.mx * 60, cy = h / 2 - this.my * 60;
    for (const s of this.stars) {
      s.pz = s.z; s.z -= speed;
      if (s.z <= .02) { Object.assign(s, this.spawn(1)); continue; }
      const sx = cx + (s.x / s.z) * f, sy = cy + (s.y / s.z) * f;
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) { if (!still) Object.assign(s, this.spawn(1)); continue; }
      const depth = 1 - s.z;
      const a = Math.min(1, depth * 1.25) * (s.tone ? .9 : .55) * this.alphaScale;
      const col = this.colors[s.tone];
      const size = .35 + depth * (s.tone ? 2 : 1.5);
      if (streak) {
        const px = cx + (s.x / s.pz) * f, py = cy + (s.y / s.pz) * f;
        ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = size;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}
