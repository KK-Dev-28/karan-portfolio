import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McRevealDirective } from './mc-shared';

type Layer = 'Frontend' | 'Backend' | 'Database' | 'DevOps';

interface Box { id: string; layer: Layer; kicker: string; title: string; rows: string[]; live?: boolean }

/** Figma "Creative · 02 Architecture — Live System Map". */
@Component({
  selector: 'mc-architecture',
  standalone: true,
  imports: [CommonModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="architecture" aria-labelledby="arch-title">
    <p class="mc-kicker">01 · System architecture</p>
    <h2 id="arch-title" class="mc-title">Engineered for High Scale</h2>

    <div class="filters" role="tablist" aria-label="Highlight a layer">
      <button *ngFor="let l of layers" role="tab" class="filter" [class.on]="layer() === l"
        [attr.aria-selected]="layer() === l" (click)="toggle(l)">{{ l }}</button>
    </div>

    <div class="map" mcReveal>
      <article class="mc-card box client mc-holo" [class.lit]="lit(client)" [class.dim]="dim(client)">
        <p class="mc-mono">{{ client.kicker }}</p><h3>{{ client.title }}</h3>
        <ul><li *ngFor="let r of client.rows">{{ r }}</li></ul>
      </article>

      <div class="wire w1" aria-hidden="true"><i></i></div>

      <article class="mc-card box gateway mc-holo" [class.lit]="lit(gateway)" [class.dim]="dim(gateway)">
        <p class="mc-mono live"><span class="pulse"></span>{{ gateway.kicker }}</p><h3>{{ gateway.title }}</h3>
        <ul><li *ngFor="let r of gateway.rows">{{ r }}</li></ul>
      </article>

      <div class="wires-right" aria-hidden="true"><div class="wire w2"><i></i></div><div class="wire w3"><i></i></div></div>

      <div class="stack">
        <article *ngFor="let b of right" class="mc-card box mc-holo" [class.lit]="lit(b)" [class.dim]="dim(b)">
          <p class="mc-mono">{{ b.kicker }}</p><h3>{{ b.title }}</h3>
          <ul><li *ngFor="let r of b.rows">{{ r }}</li></ul>
        </article>
      </div>
    </div>

    <div class="mc-card pipe" mcReveal [class.lit]="layer() === 'DevOps'" [class.dim]="layer() && layer() !== 'DevOps'">
      <p class="mc-mono">DevOps pipeline</p>
      <ol>
        <li *ngFor="let s of steps; let i = index" [class.done]="i < step()" [class.now]="i === step()">
          <span class="n">{{ i + 1 }}</span><span class="t">{{ s }}</span>
        </li>
      </ol>
    </div>

    <div class="chips">
      <span class="mc-chip" *ngFor="let c of chips"><span class="dot"></span>{{ c }}</span>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .filters{display:flex;flex-wrap:wrap;gap:14px;margin:32px 0 0}
    .filter{min-width:116px;height:40px;padding:0 20px;border-radius:12px;border:1px solid var(--border);background:var(--card);
      color:var(--text-muted);font:500 14px var(--font-body);cursor:pointer;transition:.2s}
    .filter:hover{color:var(--text);border-color:rgba(var(--accent-rgb),.5)}
    .filter.on{background:#e3b341;border-color:#e3b341;color:#14110a}
    .filter:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

    .map{display:grid;grid-template-columns:300px 1fr 340px 1fr 400px;align-items:center;margin-top:60px}
    .box{padding:22px 24px;transition:opacity .35s,transform .35s,border-color .35s,box-shadow .35s}
    .box h3{margin:8px 0 22px;font:400 26px/1.1 var(--font-display);color:var(--text)}
    .box ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
    .box li{padding:6px 12px;border-radius:8px;background:var(--bg-2);border:1px solid var(--border);font:400 13px var(--font-body);color:var(--text-muted)}
    .client{min-height:300px}
    .gateway{min-height:360px;border-color:rgba(var(--accent-rgb),.55);box-shadow:var(--shadow-glow)}
    .live{display:flex;align-items:center;gap:8px;color:var(--accent)}
    .pulse{width:7px;height:7px;border-radius:50%;background:var(--electric);animation:blink 1.4s infinite}
    .stack{display:grid;gap:40px}
    .lit{border-color:rgba(var(--accent-rgb),.8)!important;--lift:-6px;box-shadow:var(--shadow-glow)}
    .dim{opacity:.38}

    .wire{position:relative;height:1px;background:rgba(var(--accent-rgb),.45);margin:0 -1px}
    .wire i{position:absolute;top:-5.5px;left:0;width:12px;height:12px;border-radius:50%;background:#e3b341;
      box-shadow:0 0 14px rgba(227,179,65,.8);animation:travel 2.4s linear infinite}
    .wires-right{display:grid;gap:200px}
    .w3 i{animation-delay:1.2s}

    .pipe{margin-top:80px;padding:24px 28px 40px;transition:opacity .35s,border-color .35s,box-shadow .35s}
    .pipe ol{list-style:none;margin:44px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:20px 0}
    .pipe li{display:flex;align-items:center;gap:12px;flex:1 1 150px;position:relative;padding-right:56px}
    .pipe li:not(:last-child)::after{content:'';position:absolute;right:8px;top:50%;width:40px;height:1px;background:var(--border)}
    .pipe li.done:not(:last-child)::after{background:rgba(var(--accent-rgb),.7)}
    .n{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;border:1px solid var(--border);
      font:500 12px var(--font-mono);color:var(--text-muted);transition:.3s}
    .t{font:400 20px var(--font-display);color:var(--text-muted);white-space:nowrap;transition:color .3s}
    .done .n{background:rgba(var(--accent-rgb),.15);border-color:rgba(var(--accent-rgb),.6);color:var(--accent)}
    .now .n{background:#e3b341;border-color:#e3b341;color:#14110a;box-shadow:0 0 0 6px rgba(227,179,65,.18)}
    .now .t,.done .t{color:var(--text)}

    .chips{display:flex;flex-wrap:wrap;gap:20px;margin-top:50px}
    .chips .mc-chip{min-width:200px;box-sizing:border-box}
    .chips .dot{background:var(--electric)}

    @keyframes travel{from{left:0}to{left:calc(100% - 12px)}}
    @keyframes blink{50%{opacity:.25}}
    @media (max-width:1180px){
      .map{grid-template-columns:1fr 1fr;gap:20px}
      .wire,.wires-right{display:none}
      .stack{grid-column:1 / -1;grid-template-columns:1fr 1fr;gap:20px}
    }
    @media (max-width:640px){.map,.stack{grid-template-columns:1fr}.pipe li{flex-basis:100%}}
    @media (prefers-reduced-motion:reduce){.wire i,.pulse{animation:none}}
  `],
})
export class McArchitectureComponent implements OnInit, OnDestroy {
  readonly layers: Layer[] = ['Frontend', 'Backend', 'Database', 'DevOps'];
  readonly layer = signal<Layer | null>(null);
  readonly step = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly client: Box = { id: 'client', layer: 'Frontend', kicker: 'Client', title: 'Angular 19 SPA',
    rows: ['Standalone components', 'Signals + RxJS', 'Three.js hero', 'SCSS tokens'] };
  readonly gateway: Box = { id: 'gateway', layer: 'Backend', kicker: 'Gateway · active', title: 'NestJS · CQRS',
    rows: ['Command bus', 'Query bus', 'Guards + rate limits', 'Claude SDK service'] };
  readonly right: Box[] = [
    { id: 'ai', layer: 'Backend', kicker: 'AI service', title: 'FastAPI ATS Analyzer', rows: ['NLP scoring'] },
    { id: 'data', layer: 'Database', kicker: 'Data', title: 'PostgreSQL', rows: ['TypeORM migrations'] },
  ];
  readonly steps = ['git push', 'CI build', 'Tests', 'Vercel preview', 'Railway deploy', 'Live'];
  readonly chips = ['<18ms render', '99.9% uptime', 'CQRS', 'Zero-downtime deploys'];

  ngOnInit() {
    // Walks the pipeline like a running deploy.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this.step.set(this.steps.length - 1); return; }
    this.timer = setInterval(() => this.step.update(s => (s + 1) % (this.steps.length + 1)), 1100);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  toggle(l: Layer) { this.layer.update(c => (c === l ? null : l)); }
  lit(b: Box) { return this.layer() === b.layer; }
  dim(b: Box) { return !!this.layer() && this.layer() !== b.layer; }
}
