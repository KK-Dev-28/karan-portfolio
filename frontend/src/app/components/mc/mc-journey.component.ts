import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stop { year: string; title: string; text: string; x: number; y: number; up: boolean }

/* Canvas is the Figma frame's 1440-wide band, offset so the first card's
   left edge (x=40) sits at 0. Stop coordinates are the stop circles' centres. */
const W = 1320, H = 600;

/** Figma "Creative · 03 Journey — The Winding Path". */
@Component({
  selector: 'mc-journey',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <section class="mc-sec" id="journey" aria-labelledby="journey-title">
    <p class="mc-kicker">02 · How I got here</p>
    <h2 id="journey-title" class="mc-title">Seven chapters, one long road</h2>

    <div class="track" #track (pointerdown)="grab($event)" [class.dragging]="dragging()">
      <div class="canvas" [style.width.px]="w" [style.height.px]="h" [class.drawn]="drawn()">
        <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" [attr.width]="w" [attr.height]="h" aria-hidden="true">
          <path class="road" [attr.d]="d"/>
          <path class="road-lit" [attr.d]="d" pathLength="1"/>
        </svg>
        <span class="runner" [style.offset-path]="'path(\\'' + d + '\\')'" aria-hidden="true"></span>

        <ol>
          <li *ngFor="let s of stops; let i = index" class="stop" [class.up]="s.up" [class.open]="open() === i"
            [style.left.px]="s.x" [style.top.px]="s.y" (mouseenter)="open.set(i)" (focusin)="open.set(i)">
            <span class="stem"></span>
            <button class="pin" [attr.aria-label]="s.year + ': ' + s.title" (click)="open.set(i)">{{ i + 1 }}</button>
            <div class="card">
              <p class="yr">{{ s.year }}</p>
              <p class="tt">{{ s.title }}</p>
              <p class="tx">{{ s.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
    <p class="hint mc-mono">← drag to scrub the timeline · hover a stop to expand</p>
  </section>
  `,
  styles: [`
    :host{display:block}
    .track{margin-top:56px;overflow-x:auto;overflow-y:visible;scrollbar-width:none;cursor:grab;touch-action:pan-y;
      mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}
    .track::-webkit-scrollbar{display:none}
    .track.dragging{cursor:grabbing;user-select:none}
    .canvas{position:relative;margin:0 auto}
    svg{position:absolute;inset:0;overflow:visible}
    .road{fill:none;stroke:var(--border);stroke-width:2;stroke-dasharray:2 8;stroke-linecap:round}
    .road-lit{fill:none;stroke:var(--accent-2);stroke-width:2.5;stroke-linecap:round;
      stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2.6s cubic-bezier(.4,.1,.2,1)}
    .drawn .road-lit{stroke-dashoffset:0}
    .runner{position:absolute;top:0;left:0;width:10px;height:10px;border-radius:50%;background:#e3b341;
      box-shadow:0 0 16px 4px rgba(227,179,65,.6);offset-rotate:0deg;animation:run 9s linear infinite;opacity:0}
    .drawn .runner{opacity:1;transition:opacity .4s 2.4s}
    ol{list-style:none;margin:0;padding:0}
    .stop{position:absolute;width:0;height:0}
    .pin{position:absolute;left:-16px;top:-16px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(var(--accent-rgb),.7);
      background:var(--bg);color:var(--accent);font:500 12px var(--font-mono);cursor:pointer;z-index:2;transition:.25s}
    .pin:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .open .pin{background:#e3b341;color:#14110a;box-shadow:0 0 0 7px rgba(227,179,65,.18)}
    .stem{position:absolute;left:0;width:1px;height:44px;background:rgba(var(--accent-rgb),.45);top:16px}
    .up .stem{top:-60px}
    .card{position:absolute;left:-100px;top:60px;width:200px;box-sizing:border-box;min-height:130px;padding:10px 16px 14px;
      border-radius:16px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow-card);
      transition:transform .35s cubic-bezier(.2,.9,.2,1),border-color .3s,box-shadow .3s;transform-origin:top center}
    .up .card{top:auto;bottom:60px;transform-origin:bottom center}
    .open .card{transform:scale(1.08);border-color:rgba(var(--accent-rgb),.75);box-shadow:var(--shadow-glow);z-index:3}
    .yr{margin:0;font:400 38px/1.1 var(--font-display);color:var(--accent-2)}
    html[data-theme="mission-light"] .yr{color:var(--accent)}
    .tt{margin:4px 0 0;font:500 14px var(--font-body);color:var(--text)}
    .tx{margin:6px 0 0;font:400 12px/1.4 var(--font-body);color:var(--text-muted)}
    .hint{margin:28px 0 0;text-transform:none;letter-spacing:.04em}
    @keyframes run{from{offset-distance:0%}to{offset-distance:100%}}
    @media (prefers-reduced-motion:reduce){.runner{display:none}.road-lit{transition:none}}
  `],
})
export class McJourneyComponent implements OnInit, OnDestroy {
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLDivElement>;
  readonly w = W; readonly h = H;
  readonly open = signal(6);
  readonly drawn = signal(false);
  readonly dragging = signal(false);
  private io?: IntersectionObserver;

  readonly stops: Stop[] = [
    { year: '2017', title: 'School, and a First Look', text: 'Matriculation, V.D.M. High School · 70%', x: 100, y: 246, up: true },
    { year: '2019', title: 'Diploma in Computer Applications', text: 'Ideal Computer Center', x: 260, y: 185, up: false },
    { year: '2020', title: 'Senior Secondary', text: 'P.S.K.N. Sr. Sec. School · 85%', x: 430, y: 250, up: true },
    { year: '2023', title: 'BCA complete', text: 'Anglo Sanskrit College, Khanna · 93%', x: 600, y: 372, up: false },
    { year: '2024', title: 'Intern → Junior Developer', text: 'CS Soft Solutions, Mohali · Angular + ASP.NET', x: 790, y: 376, up: true },
    { year: '2025', title: 'Software Developer', text: 'Leading Swiftec, a head-office + store retail platform', x: 990, y: 229, up: false },
    { year: 'Now', title: 'MCA completed', text: 'LPU, alongside full-time work · final result awaited', x: 1190, y: 202, up: true },
  ];
  /** A smooth road through every stop (Catmull-Rom → cubic Bézier). */
  readonly d = road([{ x: 40, y: 230 }, ...this.stops, { x: 1320, y: 260 }]);

  ngOnInit() {
    const el = this.track.nativeElement;
    if (!('IntersectionObserver' in window)) { this.drawn.set(true); return; }
    this.io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { this.drawn.set(true); this.io?.disconnect(); } }, { threshold: .3 });
    this.io.observe(el);
  }
  ngOnDestroy() { this.io?.disconnect(); }

  /** Drag-to-scrub on narrow screens where the road overflows. */
  grab(e: PointerEvent) {
    const el = this.track.nativeElement;
    if (el.scrollWidth <= el.clientWidth || e.pointerType === 'touch') return;
    const x0 = e.clientX, s0 = el.scrollLeft;
    this.dragging.set(true);
    const move = (m: PointerEvent) => { el.scrollLeft = s0 - (m.clientX - x0); };
    const up = () => { this.dragging.set(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
}

function road(p: { x: number; y: number }[]): string {
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    const c1x = b.x + (c.x - a.x) / 6, c1y = b.y + (c.y - a.y) / 6;
    const c2x = c.x - (e.x - b.x) / 6, c2y = c.y - (e.y - b.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${c.x} ${c.y}`;
  }
  return d;
}
