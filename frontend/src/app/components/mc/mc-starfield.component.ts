import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcAchieve } from './mc-mission-log.component';
import { MC_LITE, mcAfterLoad } from './mc-shared';

interface Star { x: number; y: number; z: number; pz: number; tone: 0 | 1 | 2 }
interface Drop { x: number; y: number; v: number; chars: string[] }
interface Node2 { x: number; y: number; vx: number; vy: number }

/* Each theme gets its own backdrop: warp stars for the deep-space themes,
   code rain for the console themes, a drafting grid for Blueprint and a
   constellation network for the paper and mono themes. */
type Mode = 'stars' | 'rain' | 'grid' | 'network';
const MODE_BY_THEME: Record<string, Mode> = {
  'terminal': 'rain', 'cyber-matrix': 'rain', 'blueprint': 'grid',
  'paper-ledger': 'network', 'mission-light': 'network', 'obsidian-mono': 'network',
};
const RAIN_GLYPHS = 'アイウエオカキクケコサシスセソ01{}[]<>/=+*#$ABCDEFKX';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/**
 * A full-viewport backdrop behind the Mission Control page; its style follows
 * the theme (see MODE_BY_THEME). In the default star mode it is a 3D star field. Stars fly
 * toward the viewer, drift against the pointer for parallax, and stretch into
 * warp streaks when the page is scrolled fast. Rendered at device pixel ratio
 * (capped at 2) so it stays sharp on HD and retina screens. The Konami code
 * engages hyperspace for a few seconds.
 */
@Component({
  selector: 'mc-starfield',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private mode: Mode = 'stars';
  private drops: Drop[] = [];
  private nodes: Node2[] = [];
  private px = -999; private py = -999;
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
      if (this.reduced) this.draw(true);
      else { this.draw(true); mcAfterLoad(() => { if (!document.hidden) this.raf = requestAnimationFrame(this.frame); }); }
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
    const next = MODE_BY_THEME[document.documentElement.getAttribute('data-theme') ?? ''] ?? 'stars';
    if (next !== this.mode) { this.mode = next; if (this.w) this.seed(); }
    if (this.reduced) this.draw(true);
  }

  private resize = () => {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight;
    const c = this.cv.nativeElement;
    c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.seed();
    if (this.reduced) this.draw(true);
  };

  private seed() {
    const { w, h } = this;
    this.stars = this.mode === 'stars' ? Array.from({ length: Math.min(MC_LITE ? 260 : 900, Math.round(w * h / 1700)) }, () => this.spawn(Math.random())) : [];
    this.drops = this.mode === 'rain' ? Array.from({ length: Math.ceil(w / 20) }, (_, i) => this.drop(i * 20, Math.random() * h)) : [];
    this.nodes = this.mode === 'network' ? Array.from({ length: Math.min(110, Math.round(w * h / 14000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 })) : [];
  }

  private drop(x: number, y: number): Drop {
    return { x, y, v: 2 + Math.random() * 4, chars: Array.from({ length: 10 + (Math.random() * 14 | 0) }, () => RAIN_GLYPHS[Math.random() * RAIN_GLYPHS.length | 0]) };
  }

  private spawn(z: number): Star {
    const r = Math.random();
    return { x: (Math.random() * 2 - 1) * 1.6, y: (Math.random() * 2 - 1) * 1.6, z, pz: z, tone: r < .8 ? 0 : r < .92 ? 1 : 2 };
  }

  private onMove = (e: PointerEvent) => { this.tmx = e.clientX / this.w - .5; this.tmy = e.clientY / this.h - .5; this.px = e.clientX; this.py = e.clientY; };
  private onVis = () => {
    cancelAnimationFrame(this.raf);
    if (!document.hidden && !this.reduced) this.raf = requestAnimationFrame(this.frame);
  };
  private onKey = (e: KeyboardEvent) => {
    this.keys = [...this.keys, e.key].slice(-KONAMI.length);
    if (KONAMI.every((k, i) => this.keys[i]?.toLowerCase() === k.toLowerCase())) {
      this.keys = [];
      this.boost = 3.6;
      this.zone.run(() => { mcAchieve('hyperspace'); this.hyper.set(true); setTimeout(() => this.hyper.set(false), 3600); });
    }
  };

  private fc = 0;
  private frame = () => {
    if (MC_LITE && (++this.fc & 1)) { this.raf = requestAnimationFrame(this.frame); return; }
    // Scroll velocity becomes warp; it eases back to a slow cruise.
    const dy = Math.abs(scrollY - this.lastY); this.lastY = scrollY;
    this.warp += (Math.min(dy / 40, 1.6) - this.warp) * .08;
    this.boost = Math.max(0, this.boost - 1 / 60);
    this.mx += (this.tmx - this.mx) * .05; this.my += (this.tmy - this.my) * .05;
    this.draw(false);
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(still: boolean) {
    if (this.mode === 'rain') return this.drawRain(still);
    if (this.mode === 'grid') return this.drawGrid();
    if (this.mode === 'network') return this.drawNetwork(still);
    this.drawStars(still);
  }

  /** Console themes: columns of code glyphs falling; brighter near the pointer. */
  private drawRain(still: boolean) {
    const { ctx, w, h } = this, fs = 15;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `500 ${fs}px "JetBrains Mono", monospace`;
    const speed = still ? 0 : 1 + this.warp * 3 + (this.boost > 0 ? 6 : 0);
    for (const d of this.drops) {
      d.y += d.v * speed * .6;
      if (Math.random() < .03) d.chars[Math.random() * d.chars.length | 0] = RAIN_GLYPHS[Math.random() * RAIN_GLYPHS.length | 0];
      const near = Math.max(0, 1 - Math.abs(d.x - this.px) / 160);
      d.chars.forEach((c, i) => {
        const y = d.y - i * fs;
        if (y < -fs || y > h + fs) return;
        const a = (i === 0 ? .95 : (1 - i / d.chars.length) * .45) * (.55 + near * .6) * this.alphaScale;
        ctx.fillStyle = i === 0 ? `rgba(${this.colors[0]},${a})` : `rgba(${this.colors[2]},${a})`;
        ctx.fillText(c, d.x, y);
      });
      if (d.y - d.chars.length * fs > h) Object.assign(d, this.drop(d.x, -Math.random() * 200));
    }
  }

  /** Blueprint: a drafting grid that drifts with scroll and pointer, plus a measuring crosshair. */
  private drawGrid() {
    const { ctx, w, h } = this, step = 48;
    ctx.clearRect(0, 0, w, h);
    const ox = (-this.mx * 30) % step, oy = ((-scrollY * .25 - this.my * 30) % step + step) % step;
    for (let x = ox, i = 0; x < w; x += step, i++) {
      ctx.strokeStyle = `rgba(${this.colors[2]},${(Math.round((x - ox) / step) % 4 === 0 ? .14 : .06) * this.alphaScale})`;
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke();
    }
    for (let y = oy; y < h; y += step) {
      ctx.strokeStyle = `rgba(${this.colors[2]},${(Math.round((y - oy) / step) % 4 === 0 ? .14 : .06) * this.alphaScale})`;
      ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke();
    }
    if (this.px < 0) return;
    ctx.strokeStyle = `rgba(${this.colors[1]},.35)`; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(this.px, 0); ctx.lineTo(this.px, h); ctx.moveTo(0, this.py); ctx.lineTo(w, this.py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(${this.colors[1]},.8)`; ctx.beginPath(); ctx.arc(this.px, this.py, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(${this.colors[1]},.85)`; ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText(`X ${String(Math.round(this.px)).padStart(4, '0')}  Y ${String(Math.round(this.py + scrollY)).padStart(5, '0')}`, this.px + 16, this.py - 14);
  }

  /** Paper and mono themes: a drifting constellation that reaches for the pointer. */
  private drawNetwork(still: boolean) {
    const { ctx, w, h } = this, R = 150;
    ctx.clearRect(0, 0, w, h);
    const sp = still ? 0 : 1 + this.warp * 4 + (this.boost > 0 ? 8 : 0);
    for (const n of this.nodes) {
      n.x += n.vx * sp; n.y += n.vy * sp;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      const dx = this.px - n.x, dy = this.py - n.y, d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) { n.x += dx / d * .4; n.y += dy / d * .4; }
    }
    const k = this.alphaScale < 1 ? 2.2 : 1;
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > R) continue;
        ctx.strokeStyle = `rgba(${this.colors[0]},${(1 - d / R) * .22 * this.alphaScale * k})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      const dp = Math.hypot(a.x - this.px, a.y - this.py);
      if (dp < 200) {
        ctx.strokeStyle = `rgba(${this.colors[1]},${(1 - dp / 200) * .6})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(this.px, this.py); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${dp < 200 ? this.colors[1] : this.colors[0]},${.5 * this.alphaScale * k})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, dp < 200 ? 2.6 : 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  private drawStars(still: boolean) {
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
