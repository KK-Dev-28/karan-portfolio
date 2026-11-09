import { Component, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcScrollTo } from './mc-shared';

interface RadarNode { label: string; dx: number; dy: number; tone: 'gold' | 'teal' | 'coral' | 'dim' }

const SWEEP_SECONDS = 6;

/** Figma "Creative · 01 Hero — Radar Mission Control". */
@Component({
  selector: 'mc-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="hero" id="hero" aria-labelledby="hero-title">
    <div class="radar" aria-hidden="true">
      <svg viewBox="-470 -470 940 940" class="radar-svg">
        <defs>
          <radialGradient id="mcGlow"><stop offset="0" stop-color="rgb(var(--accent-2-rgb))" stop-opacity=".34"/><stop offset=".55" stop-color="rgb(var(--accent-2-rgb))" stop-opacity=".08"/><stop offset="1" stop-color="rgb(var(--accent-2-rgb))" stop-opacity="0"/></radialGradient>
          <linearGradient id="mcSweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--electric)" stop-opacity="0"/><stop offset="1" stop-color="var(--electric)" stop-opacity=".45"/></linearGradient>
        </defs>
        <circle r="450" fill="url(#mcGlow)"/>
        <g class="rings">
          <circle r="90"/><circle r="170" class="dash"/><circle r="250"/><circle r="330" class="dash"/><circle r="410"/>
        </g>
        <g class="cross"><path d="M0-409V-33M33 0H409M0 33V409M-409 0H-33"/></g>
        <g class="sweep" [style.animation-duration.s]="sweep"><path d="M0 0L410 0A410 410 0 0 0 360.4-195.6Z" fill="url(#mcSweep)"/><path d="M0 0H410" class="sweep-edge"/></g>
        <g *ngFor="let n of nodes" class="node" [ngClass]="n.tone">
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
    </div>

    <div class="copy">
      <p class="mc-kicker"><span class="dot"></span>Mission control · online</p>
      <h1 id="hero-title" class="title">
        <span class="ln">I engineer</span>
        <span class="ln mc-em">products that</span>
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
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .hero{position:relative;min-height:min(960px,100svh);display:flex;align-items:center;overflow:hidden;
      padding:clamp(120px,14vh,170px) clamp(16px,5.6vw,80px) clamp(64px,8vh,96px);max-width:1440px;margin:0 auto;box-sizing:border-box}
    .copy{position:relative;z-index:1;max-width:760px}
    .title{margin:28px 0 0;font:400 clamp(58px,8.9vw,128px)/1 var(--font-display);letter-spacing:-.02em;color:var(--text)}
    .ln{display:block;animation:rise .9s cubic-bezier(.2,.9,.2,1) both}
    .ln:nth-child(2){animation-delay:.08s}.ln:nth-child(3){animation-delay:.16s}
    .lede{max-width:560px;margin:32px 0 0;font:400 clamp(16px,1.35vw,19px)/1.6 var(--font-body);color:var(--text-muted)}
    .ctas{display:flex;flex-wrap:wrap;gap:16px;margin-top:36px}
    .ctas .mc-btn--gold{min-width:260px}.ctas .mc-btn:not(.mc-btn--gold){min-width:220px}
    .stats{display:flex;flex-wrap:wrap;gap:20px;margin:44px 0 0}
    .stat{min-width:150px;padding:12px 16px;border-radius:14px;background:color-mix(in srgb,var(--card) 85%,transparent);border:1px solid var(--border);backdrop-filter:blur(6px)}
    .stat dt{font:500 11px var(--font-mono);letter-spacing:.12em;color:var(--text-dim)}
    .stat dd{margin:2px 0 0;font:400 34px/1.1 var(--font-display);color:var(--text)}

    .radar{position:absolute;top:50%;left:73.6%;width:min(940px,72vw);aspect-ratio:1;pointer-events:none;
      transform:translate(-50%,-50%) perspective(1400px) rotateY(calc(var(--px,0) * 16deg)) rotateX(calc(var(--py,0) * -16deg)) scale(calc(1 + var(--sp,0) * .35));
      opacity:calc(1 - var(--sp,0) * .7);transition:transform .6s cubic-bezier(.2,.9,.2,1)}
    .copy{translate:calc(var(--px,0) * -12px) calc(var(--py,0) * -8px);transition:translate .6s cubic-bezier(.2,.9,.2,1)}
    .radar-svg{width:100%;height:100%;overflow:visible}
    .rings circle{fill:none;stroke:rgba(var(--accent-2-rgb),.42);stroke-width:1.2}
    .rings .dash{stroke-dasharray:4 7;stroke:rgba(var(--accent-2-rgb),.3)}
    .cross path{stroke:rgba(var(--accent-2-rgb),.22);stroke-width:1;fill:none}
    .sweep{transform-origin:0 0;animation:spin linear infinite}
    .sweep-edge{stroke:var(--electric);stroke-opacity:.7;stroke-width:1.5}
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

    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes ping{0%{opacity:.9;transform:scale(.5)}35%{opacity:0;transform:scale(2.2)}100%{opacity:0}}
    @keyframes rise{from{opacity:0;transform:translateY(30px)}}
    @media (max-width:1100px){.radar{left:78%;width:110vw;opacity:calc(.45 - var(--sp,0) * .3)}}
    @media (max-width:700px){.radar{left:70%;top:34%;width:150vw;opacity:.28}.stat{min-width:0;flex:1}}
    @media (prefers-reduced-motion:reduce){.sweep,.ping,.ln{animation:none}}
  `],
})
export class McHeroComponent implements OnInit, OnDestroy {
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

  ngOnInit() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.zone.runOutsideAngular(() => {
      if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', this.onMove, { passive: true });
      addEventListener('scroll', this.onScroll, { passive: true });
    });
  }
  ngOnDestroy() {
    removeEventListener('pointermove', this.onMove);
    removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.raf);
  }

  readonly sweep = SWEEP_SECONDS;
  readonly nodes: RadarNode[] = [
    { label: 'Angular 19', dx: -250, dy: -190, tone: 'gold' },
    { label: 'NestJS', dx: 230, dy: -260, tone: 'teal' },
    { label: 'PostgreSQL', dx: 330, dy: 60, tone: 'teal' },
    { label: '.NET 8', dx: 120, dy: 300, tone: 'teal' },
    { label: 'Three.js', dx: -300, dy: 170, tone: 'gold' },
    { label: 'Claude SDK', dx: -60, dy: -370, tone: 'coral' },
    { label: 'Railway', dx: -120, dy: 340, tone: 'dim' },
  ];
  readonly stats = [{ k: 'RENDER', v: '<18ms' }, { k: 'UPTIME', v: '99.9%' }, { k: 'STACK', v: '7 live' }];

  /** Starts each node's ping when the clockwise sweep reaches its bearing. */
  delay(n: RadarNode) {
    const deg = (Math.atan2(n.dy, n.dx) * 180 / Math.PI + 360) % 360;
    return (deg / 360) * this.sweep;
  }

  go(id: string) { mcScrollTo(id); }
}
