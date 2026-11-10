import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcScrollTo } from './mc-shared';

interface RadarNode { label: string; dx: number; dy: number; tone: 'gold' | 'teal' | 'coral' | 'dim'; intel: string }
interface Blip { id: number; x: number; y: number }

const SWEEP_SECONDS = 6;

/** Figma "Creative · 01 Hero — Radar Mission Control". */
import { UiSoundService } from '../../services/ui-sound.service';
@Component({
  selector: 'mc-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <section class="hero" id="hero" aria-labelledby="hero-title">
    <div class="radar" aria-hidden="true">
      <svg viewBox="-470 -470 940 940" class="radar-svg" #svg>
        <defs>
          <radialGradient id="mcGlow"><stop offset="0" stop-color="rgb(var(--accent-2-rgb))" stop-opacity=".34"/><stop offset=".55" stop-color="rgb(var(--accent-2-rgb))" stop-opacity=".08"/><stop offset="1" stop-color="rgb(var(--accent-2-rgb))" stop-opacity="0"/></radialGradient>
        </defs>
        <circle r="450" fill="url(#mcGlow)"/>
        <g class="rings">
          <circle r="90"/><circle r="170" class="dash"/><circle r="250"/><circle r="330" class="dash"/><circle r="410"/>
        </g>
        <g class="cross"><path d="M0-409V-33M33 0H409M0 33V409M-409 0H-33"/></g>
        <circle r="410" class="hit" (click)="blip($event, svg)"/>
        <circle *ngFor="let b of blips(); trackBy: bid" [attr.cx]="b.x" [attr.cy]="b.y" r="10" class="blip"/>
        <g *ngFor="let n of nodes" class="node" [ngClass]="n.tone" [class.sel]="contact() === n" (click)="pin(n)" (mouseenter)="pin(n)">
          <path [attr.d]="'M0 0L' + n.dx + ' ' + n.dy" class="spoke"/>
          <circle [attr.cx]="n.dx" [attr.cy]="n.dy" r="16" class="ping" [style.animation-delay.s]="delay(n)" [style.animation-duration.s]="sweep"/>
          <circle [attr.cx]="n.dx" [attr.cy]="n.dy" r="7" class="pin"/>
          <g [attr.transform]="'translate(' + (n.dx + 18) + ' ' + (n.dy - 14) + ')'" class="label">
            <rect [attr.width]="n.label.length * 8.2 + 30" height="28" rx="14"/>
            <text x="14" y="18">{{ n.label | uppercase }}</text>
          </g>
        </g>
        <circle r="34" class="core"/><text class="core-txt" y="6">KK</text>
      </svg>
      <!-- An HTML layer, not SVG: rotating it is GPU-composited, where an SVG
           transform animation repaints the whole radar every frame. -->
      <div class="sweep" [style.animation-duration.s]="sweep"></div>
    </div>

    <div class="copy">
      <p class="mc-kicker"><span class="dot"></span>Mission control · online</p>
      <h1 id="hero-title" class="title">
        <span class="ln">I engineer</span><br>
        <span class="ln mc-em"><span class="rot" *ngFor="let w of [word()]">{{ w }}</span> that</span><br>
        <span class="ln">hold at scale.</span>
      </h1>
      <p class="lede">Full-stack engineer shipping Angular 19, NestJS, .NET and PostgreSQL products — from first sketch to production in weeks.</p>
      <div class="ctas">
        <button class="mc-btn mc-btn--gold" (click)="go('contact')">Start a conversation ↗</button>
        <button class="mc-btn" (click)="go('architecture')">Explore the map ↓</button>
      </div>
      <dl class="stats">
        <div class="stat" *ngFor="let s of stats"><dt>{{ s.k }}</dt><dd>{{ s.v }}</dd></div>
      </dl>
      <p class="clock" aria-label="Local time in Mohali">
        <span class="live"></span>IST {{ ist() }} · MOHALI 30.70°N 76.72°E<span *ngIf="yours()"> · YOUR TIME {{ yours() }}</span>
      </p>
    </div>

    <aside class="intel" *ngIf="contact() as c" aria-live="polite">
      <p class="mc-mono"><span class="ld"></span>{{ pinned() ? 'Contact locked' : 'Contact detected' }} · bearing {{ bearing(c) }}°</p>
      <h3>{{ c.label }}</h3>
      <p>{{ c.intel }}</p>
    </aside>
  </section>
  `,
  styles: [`
    :host{display:block}
    .hero{position:relative;min-height:min(960px,100svh);display:flex;align-items:center;overflow:hidden;
      padding:clamp(120px,14vh,170px) clamp(16px,5.6vw,80px) clamp(64px,8vh,96px);max-width:1440px;margin:0 auto;box-sizing:border-box}
    .copy{position:relative;z-index:1;max-width:820px}
    .title{margin:28px 0 0;font:400 clamp(44px,8.2vw,118px)/1 var(--font-display);letter-spacing:-.02em;color:var(--text);white-space:nowrap;animation:rise .9s cubic-bezier(.2,.9,.2,1) both}
    .ln{display:inline}
    .lede{max-width:560px;margin:32px 0 0;font:400 clamp(16px,1.35vw,19px)/1.6 var(--font-body);color:var(--text-muted)}
    .ctas{display:flex;flex-wrap:wrap;gap:16px;margin-top:36px}
    .ctas .mc-btn--gold{min-width:260px}.ctas .mc-btn:not(.mc-btn--gold){min-width:220px}
    .stats{display:flex;flex-wrap:wrap;gap:20px;margin:44px 0 0}
    .stat{min-width:150px;padding:12px 16px;border-radius:14px;background:color-mix(in srgb,var(--card) 85%,transparent);border:1px solid var(--border);backdrop-filter:blur(6px)}
    .stat dt{font:500 11px var(--font-mono);letter-spacing:.12em;color:var(--text-dim)}
    .stat dd{margin:2px 0 0;font:400 34px/1.1 var(--font-display);color:var(--text)}

    .radar{position:absolute;top:min(480px,50svh);left:73.6%;width:min(940px,72vw);aspect-ratio:1;pointer-events:none;
      transform:translate(-50%,-50%) perspective(1400px) rotateY(calc(var(--px,0) * 16deg)) rotateX(calc(var(--py,0) * -16deg)) scale(calc(1 + var(--sp,0) * .35));
      opacity:calc(1 - var(--sp,0) * .7);transition:transform .6s cubic-bezier(.2,.9,.2,1)}
    .copy{translate:calc(var(--px,0) * -12px) calc(var(--py,0) * -8px);transition:translate .6s cubic-bezier(.2,.9,.2,1)}
    .radar-svg{width:100%;height:100%;overflow:visible}
    .rings circle{fill:none;stroke:rgba(var(--accent-2-rgb),.42);stroke-width:1.2}
    .rings .dash{stroke-dasharray:4 7;stroke:rgba(var(--accent-2-rgb),.3)}
    .cross path{stroke:rgba(var(--accent-2-rgb),.22);stroke-width:1;fill:none}
    .sweep{position:absolute;left:50%;top:50%;width:87.23%;height:87.23%;translate:-50% -50%;border-radius:50%;will-change:rotate;
      background:conic-gradient(from 62deg,transparent 0deg,rgba(var(--electric-rgb),.42) 27.4deg,rgba(var(--electric-rgb),.95) 28deg,transparent 28.4deg);
      animation:spin linear infinite}
    .spoke{stroke-width:1.2;fill:none;stroke-opacity:.55}
    .pin{stroke:var(--bg);stroke-width:3}
    .ping{fill:none;stroke-width:2;opacity:0;transform-box:fill-box;transform-origin:center;animation:ping ease-out infinite}
    .gold .spoke,.gold .ping{stroke:var(--accent-2)} .gold .pin{fill:var(--accent-2)}
    .teal .spoke,.teal .ping{stroke:var(--electric)} .teal .pin{fill:var(--electric)}
    .coral .spoke,.coral .ping{stroke:var(--crimson)} .coral .pin{fill:var(--crimson)}
    .dim .spoke,.dim .ping{stroke:var(--text-dim)} .dim .pin{fill:var(--text-dim)}
    .label rect{fill:var(--bg-2);stroke:rgba(var(--accent-2-rgb),.45)}
    .label text{font:500 11px var(--font-mono);letter-spacing:.06em;fill:var(--text-muted)}
    .core{fill:#e3b341;filter:drop-shadow(0 0 22px rgba(227,179,65,.7))}
    .core-txt{font:600 16px var(--font-mono);fill:#14110a;text-anchor:middle}

    .hit{fill:transparent;pointer-events:all;cursor:crosshair}
    .node{pointer-events:all;cursor:pointer}
    .node .pin{transition:r .25s}
    .node.sel .pin{r:10}
    .node.sel .label rect{stroke:var(--accent-2);fill:rgba(var(--accent-2-rgb),.16)}
    .node.sel .label text{fill:var(--text)}
    .node.sel .spoke{stroke-opacity:1;stroke-width:2}
    .blip{fill:none;stroke:var(--electric);stroke-width:2;transform-box:fill-box;transform-origin:center;animation:blip 1.6s ease-out forwards}
    .rot{display:inline-block;animation:word .55s cubic-bezier(.2,.9,.2,1) both}
    .clock{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:22px 0 0;font:500 11px var(--font-mono);letter-spacing:.12em;color:var(--text-dim)}
    .clock .live{width:6px;height:6px;border-radius:50%;background:var(--crimson);animation:blink 1s steps(2) infinite}
    .intel{position:absolute;z-index:2;right:clamp(16px,4vw,64px);bottom:clamp(28px,6vh,72px);width:300px;padding:16px 18px;border-radius:16px;
      background:color-mix(in srgb,var(--card) 88%,transparent);border:1px solid rgba(var(--accent-rgb),.45);backdrop-filter:blur(10px);
      box-shadow:var(--shadow-card);animation:word .4s cubic-bezier(.2,.9,.2,1)}
    .intel .mc-mono{display:flex;align-items:center;gap:8px;margin:0;font-size:10px;color:var(--accent)}
    .intel .ld{width:6px;height:6px;border-radius:50%;background:var(--electric)}
    .intel h3{margin:6px 0 4px;font:400 28px/1.1 var(--font-display);color:var(--text)}
    .intel p:last-child{margin:0;font:400 13px/1.5 var(--font-body);color:var(--text-muted)}
    @keyframes blip{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(5)}}
    @keyframes word{from{opacity:0;transform:translateY(.35em) rotateX(-60deg);filter:blur(6px)}}
    @keyframes blink{50%{opacity:.2}}
    @media (max-width:1100px){.intel{display:none}}
    @keyframes spin{to{rotate:360deg}}
    @keyframes ping{0%{opacity:.9;transform:scale(.5)}35%{opacity:0;transform:scale(2.2)}100%{opacity:0}}
    @keyframes rise{from{transform:translateY(30px)}}
    @media (max-width:1100px){.radar{left:78%;width:110vw;opacity:calc(.45 - var(--sp,0) * .3)}}
    @media (max-width:700px){.radar{left:70%;top:34svh;width:150vw;opacity:.28}.stat{min-width:0;flex:1}}
    @media (prefers-reduced-motion:reduce){.sweep,.ping,.title{animation:none}}
  `],
})
export class McHeroComponent implements OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private raf = 0;

  /* Pointer parallax (--px/--py, -0.5..0.5) tilts the radar in 3D; scroll
     progress through the hero (--sp, 0..1) zooms it past the viewer. */
  private onMove = (e: PointerEvent) => {
    const el = this.host.nativeElement as HTMLElement;
    const c = (v: number) => Math.min(.5, Math.max(-.5, v)).toFixed(3);
    el.style.setProperty('--px', c(e.clientX / innerWidth - .5));
    el.style.setProperty('--py', c(e.clientY / innerHeight - .5));
  };
  private onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      const el = this.host.nativeElement as HTMLElement;
      el.style.setProperty('--sp', Math.min(1, Math.max(0, scrollY / (el.offsetHeight || 1))).toFixed(3));
    });
  };

  /* Started after the first browser render: the page is prerendered, and the
     clock / pointer / scroll state would otherwise differ from the static HTML
     during hydration. Never runs at build time. */
  constructor() {
    afterNextRender(() => this.start());
  }

  private start() {
    this.zone.runOutsideAngular(() => this.startTicks());
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.zone.runOutsideAngular(() => {
      if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', this.onMove, { passive: true });
      addEventListener('scroll', this.onScroll, { passive: true });
    });
  }
  ngOnDestroy() {
    if (typeof window === 'undefined') return;
    this.ticks.forEach(clearInterval);
    removeEventListener('pointermove', this.onMove);
    removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.raf);
  }

  private sound = inject(UiSoundService);
  readonly sweep = SWEEP_SECONDS;
  readonly nodes: RadarNode[] = [
    { label: 'Angular 19', dx: -250, dy: -190, tone: 'gold', intel: 'Standalone components, signals and RxJS. The client side of everything here, LocalHaat included.' },
    { label: 'NestJS', dx: 230, dy: -260, tone: 'teal', intel: 'The API gateway: CQRS command and query buses, guards and rate limits.' },
    { label: 'PostgreSQL', dx: 330, dy: 60, tone: 'teal', intel: 'The data layer, with TypeORM entities and migrations.' },
    { label: '.NET 8', dx: 120, dy: 300, tone: 'teal', intel: 'Backend for the multi-store Retail ERP, syncing store servers to head office.' },
    { label: 'Three.js', dx: -300, dy: 170, tone: 'gold', intel: 'Interactive 3D and motion for front ends that need to feel alive.' },
    { label: 'Claude SDK', dx: -60, dy: -370, tone: 'coral', intel: 'AI features, like the ATS résumé analyzer that scores CVs against a job.' },
    { label: 'Railway', dx: -120, dy: 340, tone: 'dim', intel: 'Where the APIs deploy, alongside Vercel for front ends, via CI/CD.' },
  ];
  readonly stats = [{ k: 'RENDER', v: '<18ms' }, { k: 'UPTIME', v: '99.9%' }, { k: 'STACK', v: '7 live' }];

  readonly words = ['products', 'platforms', 'APIs', 'dashboards', 'AI tools'];
  readonly word = signal(this.words[0]);
  readonly contact = signal<RadarNode | null>(null);
  readonly pinned = signal(false);
  readonly blips = signal<Blip[]>([]);
  readonly ist = signal('');
  readonly yours = signal('');
  private ticks: ReturnType<typeof setInterval>[] = [];
  private bseq = 0;
  private t0 = performance.now();
  bid = (_: number, b: Blip) => b.id;

  bearing(n: RadarNode) { return Math.round(((Math.atan2(n.dy, n.dx) * 180 / Math.PI) + 450) % 360); }

  pin(n: RadarNode) { this.contact.set(n); this.pinned.set(true); }

  /** Drops a sonar blip where the radar was clicked, and releases a pinned contact. */
  blip(e: MouseEvent, svg: SVGSVGElement) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const b = { id: ++this.bseq, x: p.x, y: p.y };
    this.blips.update(l => [...l, b]);
    setTimeout(() => this.blips.update(l => l.filter(x => x.id !== b.id)), 1700);
    this.pinned.set(false);
  }

  private startTicks() {
    const fmt = (tz?: string) => new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: tz });
    const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const clock = () => { this.ist.set(fmt('Asia/Kolkata')); this.yours.set(myTz !== 'Asia/Kolkata' && myTz !== 'Asia/Calcutta' ? fmt() : ''); };
    clock();
    this.ticks.push(setInterval(clock, 1000));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    this.ticks.push(setInterval(() => this.word.set(this.words[++i % this.words.length]), 2600));
    // Report whichever node the sweep crossed most recently, unless one is pinned.
    this.ticks.push(setInterval(() => {
      if (this.pinned()) return;
      const sweepDeg = (((performance.now() - this.t0) / 1000) % this.sweep) / this.sweep * 360;
      const behind = (n: RadarNode) => (sweepDeg - ((Math.atan2(n.dy, n.dx) * 180 / Math.PI + 360) % 360) + 360) % 360;
      const n = [...this.nodes].sort((a, b) => behind(a) - behind(b))[0];
      if (n !== this.contact()) { this.contact.set(n); if (scrollY < innerHeight) this.sound.blip(660 + this.nodes.indexOf(n) * 70); }
    }, 250));
  }

  /** Starts each node's ping when the clockwise sweep reaches its bearing. */
  delay(n: RadarNode) {
    const deg = (Math.atan2(n.dy, n.dx) * 180 / Math.PI + 360) % 360;
    return (deg / 360) * this.sweep;
  }

  go(id: string) { mcScrollTo(id); }
}
