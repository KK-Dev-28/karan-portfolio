import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Fx = 'fireworks' | 'diyas' | 'colour' | 'snow' | 'tricolour' | 'embers' | 'lights';
interface Occasion { id: string; icon: string; greet: string; sub: string; fx: Fx; hint?: string }

/* Festivals move with the lunar calendar, so their dates are listed per year.
   Each entry is [start, end] inclusive (YYYY-MM-DD). Add a year here to extend. */
const DATED: Record<string, [string, string][]> = {
  diwali:   [['2026-11-05', '2026-11-10'], ['2027-10-26', '2027-10-31'], ['2028-10-14', '2028-10-19']],
  holi:     [['2026-03-03', '2026-03-05'], ['2027-03-21', '2027-03-23'], ['2028-03-10', '2028-03-12']],
  gurpurab: [['2026-11-23', '2026-11-25'], ['2027-11-13', '2027-11-15'], ['2028-11-01', '2028-11-03']],
};
/* Fixed-date occasions: [month, firstDay, lastDay]. */
const FIXED: Record<string, [number, number, number]> = {
  lohri: [1, 12, 14], republic: [1, 25, 27], baisakhi: [4, 13, 14], independence: [8, 14, 16], christmas: [12, 20, 26],
};

const OCCASIONS: Record<string, Occasion> = {
  diwali:       { id: 'diwali', icon: '🪔', greet: 'Happy Diwali', sub: 'May every build ship bright.', fx: 'fireworks', hint: 'Click anywhere to light a firework' },
  holi:         { id: 'holi', icon: '🎨', greet: 'Happy Holi', sub: 'Bura na mano, Holi hai!', fx: 'colour', hint: 'Click anywhere to throw colour' },
  gurpurab:     { id: 'gurpurab', icon: '🙏', greet: 'Gurpurab di lakh lakh vadhaiyan', sub: 'Light, service and gratitude.', fx: 'lights' },
  lohri:        { id: 'lohri', icon: '🔥', greet: 'Happy Lohri', sub: 'Warm wishes from Punjab.', fx: 'embers' },
  republic:     { id: 'republic', icon: '🇮🇳', greet: 'Happy Republic Day', sub: 'Jai Hind.', fx: 'tricolour' },
  baisakhi:     { id: 'baisakhi', icon: '🌾', greet: 'Happy Baisakhi', sub: 'A good harvest to everyone.', fx: 'embers' },
  independence: { id: 'independence', icon: '🇮🇳', greet: 'Happy Independence Day', sub: 'Jai Hind.', fx: 'tricolour' },
  christmas:    { id: 'christmas', icon: '🎄', greet: 'Merry Christmas', sub: 'Peace, joy and green builds.', fx: 'snow' },
  newyear:      { id: 'newyear', icon: '🎆', greet: 'Happy New Year', sub: 'Here’s to what we ship next.', fx: 'fireworks', hint: 'Click anywhere to light a firework' },
};

/** Today's occasion, if any. `?occasion=holi` previews one on any day. */
export function currentOccasion(now = new Date()): Occasion | null {
  const q = new URLSearchParams(location.search).get('occasion');
  if (q && OCCASIONS[q]) return OCCASIONS[q];
  const m = now.getMonth() + 1, d = now.getDate();
  if ((m === 12 && d === 31) || (m === 1 && d <= 2)) return OCCASIONS['newyear'];
  const iso = `${now.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const [id, ranges] of Object.entries(DATED)) if (ranges.some(([a, b]) => iso >= a && iso <= b)) return OCCASIONS[id];
  for (const [id, [mm, a, b]] of Object.entries(FIXED)) if (m === mm && d >= a && d <= b) return OCCASIONS[id];
  return null;
}

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: 'spark' | 'rocket' | 'flake' | 'dust' | 'petal' }

const PALETTES: Record<Fx, string[]> = {
  fireworks: ['#ffd166', '#ff7a5c', '#e3b341', '#5eead4', '#f472b6', '#fff3c4'],
  diyas: ['#ffb347', '#ffd166', '#ff7a5c'],
  colour: ['#ff3d7f', '#ffd60a', '#3a86ff', '#06d6a0', '#8338ec', '#fb5607'],
  snow: ['#ffffff', '#e6f0ff', '#cfe3ff'],
  tricolour: ['#ff9933', '#ffffff', '#138808'],
  embers: ['#ff7a1a', '#ffb347', '#ffd166'],
  lights: ['#ffd166', '#fff3c4', '#e3b341'],
};

/**
 * Festive layer: on an occasion it tints the theme (html[data-occasion]),
 * shows a dismissible greeting and runs a matching particle effect —
 * fireworks, thrown colour, snow, tricolour petals, embers or lamp light.
 */
@Component({
  selector: 'mc-festive',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #cv class="fx" aria-hidden="true" *ngIf="occ"></canvas>
    <div class="greet" *ngIf="occ && show()" role="status">
      <span class="ic" aria-hidden="true">{{ occ.icon }}</span>
      <span class="tx"><b>{{ occ.greet }}</b> — {{ occ.sub }}<small *ngIf="occ.hint"> · {{ occ.hint }}</small></span>
      <button (click)="hide()" aria-label="Dismiss greeting">×</button>
    </div>
  `,
  styles: [`
    :host{display:contents}
    .fx{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none}
    .greet{position:fixed;z-index:890;top:76px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;
      max-width:calc(100vw - 32px);box-sizing:border-box;padding:9px 10px 9px 16px;border-radius:99px;
      background:var(--nav-bg-scrolled);border:1px solid rgba(var(--accent-rgb),.55);backdrop-filter:blur(12px);
      box-shadow:0 14px 34px -14px rgba(0,0,0,.7),0 0 28px rgba(var(--accent-rgb),.25);animation:drop .7s cubic-bezier(.2,.9,.2,1) both}
    .ic{font-size:20px;animation:sway 2.4s ease-in-out infinite}
    .tx{font:400 14px var(--font-body);color:var(--text-muted)} .tx b{font:400 18px var(--font-display);color:var(--text)}
    .tx small{font:500 11px var(--font-mono);color:var(--accent);letter-spacing:.04em}
    button{flex:none;width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:none;color:var(--text-muted);cursor:pointer}
    @keyframes drop{from{opacity:0;transform:translate(-50%,-16px)}}
    @keyframes sway{50%{transform:rotate(-10deg) scale(1.1)}}
    @media (max-width:700px){.tx small{display:none}.greet{top:70px}}
    @media (prefers-reduced-motion:reduce){.greet,.ic{animation:none}}
  `],
})
export class McFestiveComponent implements OnInit, OnDestroy {
  @ViewChild('cv') cv?: ElementRef<HTMLCanvasElement>;
  readonly occ = currentOccasion();
  readonly show = signal(false);
  private zone = inject(NgZone);
  private ctx?: CanvasRenderingContext2D;
  private ps: P[] = [];
  private raf = 0; private t = 0; private w = 0; private h = 0; private dpr = 1;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngOnInit() {
    if (!this.occ) return;
    document.documentElement.setAttribute('data-occasion', this.occ.id);
    try { this.show.set(sessionStorage.getItem('kk_greet_' + this.occ.id) !== '0'); } catch { this.show.set(true); }
    if (this.reduced) return;
    setTimeout(() => this.zone.runOutsideAngular(() => this.start()));
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    removeEventListener('click', this.onClick);
    document.documentElement.removeAttribute('data-occasion');
  }

  hide() { this.show.set(false); try { sessionStorage.setItem('kk_greet_' + this.occ!.id, '0'); } catch {} }

  private start() {
    const c = this.cv?.nativeElement; if (!c) return;
    this.ctx = c.getContext('2d')!;
    this.resize();
    addEventListener('resize', this.resize);
    if (this.occ!.hint) addEventListener('click', this.onClick);
    this.raf = requestAnimationFrame(this.frame);
  }

  private resize = () => {
    const c = this.cv!.nativeElement;
    this.dpr = Math.min(2, devicePixelRatio || 1); this.w = innerWidth; this.h = innerHeight;
    c.width = this.w * this.dpr; c.height = this.h * this.dpr;
    this.ctx!.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  /* Clicks on empty space (not links, buttons or fields) set something off. */
  private onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('a,button,input,textarea,select,label,[role=button]')) return;
    if (this.occ!.fx === 'colour') this.splash(e.clientX, e.clientY, 70);
    else this.burst(e.clientX, e.clientY, 90);
  };

  private pick(fx: Fx) { const p = PALETTES[fx]; return p[(Math.random() * p.length) | 0]; }

  private burst(x: number, y: number, n: number) {
    const color = this.pick('fireworks'), color2 = this.pick('fireworks');
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 4.5;
      this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 60 + Math.random() * 40, size: 1.6 + Math.random() * 1.4, color: i % 3 ? color : color2, kind: 'spark' });
    }
  }

  private splash(x: number, y: number, n: number) {
    const color = this.pick('colour');
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * 6;
      this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 0, max: 70 + Math.random() * 50, size: 3 + Math.random() * 9, color, kind: 'dust' });
    }
  }

  private ambient() {
    const fx = this.occ!.fx, t = this.t;
    if (fx === 'fireworks' && t % 70 === 0) {
      this.ps.push({ x: this.w * (.15 + Math.random() * .7), y: this.h, vx: (Math.random() - .5) * 1.2, vy: -(7 + Math.random() * 3),
        life: 0, max: 55 + Math.random() * 20, size: 2, color: '#fff3c4', kind: 'rocket' });
    }
    if (fx === 'snow' && t % 3 === 0) this.ps.push({ x: Math.random() * this.w, y: -10, vx: Math.random() - .5, vy: .6 + Math.random() * 1.2, life: 0, max: 900, size: 1 + Math.random() * 2.6, color: this.pick('snow'), kind: 'flake' });
    if (fx === 'tricolour' && t % 6 === 0) this.ps.push({ x: Math.random() * this.w, y: -10, vx: (Math.random() - .5) * .8, vy: .8 + Math.random(), life: 0, max: 900, size: 4 + Math.random() * 4, color: this.pick('tricolour'), kind: 'petal' });
    if ((fx === 'embers' || fx === 'diyas') && t % 4 === 0) this.ps.push({ x: Math.random() * this.w, y: this.h + 10, vx: (Math.random() - .5) * .6, vy: -(.6 + Math.random() * 1.4), life: 0, max: 500, size: 1 + Math.random() * 2.2, color: this.pick('embers'), kind: 'flake' });
    if (fx === 'lights' && t % 8 === 0) this.ps.push({ x: Math.random() * this.w, y: Math.random() * this.h, vx: 0, vy: -.15, life: 0, max: 220, size: 2 + Math.random() * 3, color: this.pick('lights'), kind: 'dust' });
    if (fx === 'colour' && t % 120 === 0) this.splash(this.w * Math.random(), this.h * (.2 + Math.random() * .6), 40);
  }

  private frame = () => {
    const ctx = this.ctx!; this.t++;
    if (!document.hidden) this.ambient();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    const next: P[] = [];
    for (const p of this.ps) {
      p.life++;
      if (p.kind === 'rocket') {
        p.x += p.vx; p.y += p.vy; p.vy += .12;
        if (p.vy >= -1 || p.life > p.max) { this.burst(p.x, p.y, 70); continue; }
      } else if (p.kind === 'spark') { p.vx *= .985; p.vy = p.vy * .985 + .05; p.x += p.vx; p.y += p.vy; }
      else if (p.kind === 'dust') { p.vx *= .96; p.vy = p.vy * .96 + .02; p.x += p.vx; p.y += p.vy; }
      else { p.x += p.vx + Math.sin((p.life + p.y) / 40) * .4; p.y += p.vy; }
      if (p.life > p.max || p.y > this.h + 20 || p.y < -30) continue;
      const fade = 1 - p.life / p.max;
      const a = p.kind === 'flake' || p.kind === 'petal' ? .55 : Math.max(0, fade);
      ctx.globalAlpha = a * (p.kind === 'dust' ? .45 : 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.kind === 'petal') ctx.ellipse(p.x, p.y, p.size, p.size / 2.2, p.life / 20, 0, Math.PI * 2);
      else ctx.arc(p.x, p.y, p.size * (p.kind === 'spark' ? fade + .3 : 1), 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    this.ps = next.slice(-1400);
    this.raf = requestAnimationFrame(this.frame);
  };
}
