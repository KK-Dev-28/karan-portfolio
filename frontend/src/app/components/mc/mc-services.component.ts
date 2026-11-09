import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McBriefService, McRevealDirective } from './mc-shared';

/** Figma "Creative · 04 Services — Module Bay". */
@Component({
  selector: 'mc-services',
  standalone: true,
  imports: [CommonModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="services" aria-labelledby="svc-title">
    <p class="mc-kicker">03 · What I build &amp; deliver</p>
    <h2 id="svc-title" class="mc-title">Six modules, one owner</h2>

    <div class="bay">
      <article *ngFor="let m of modules; let i = index" class="mc-card mod" mcReveal [style.transition-delay.ms]="(i % 3) * 80"
        (pointermove)="tilt($event)" (pointerleave)="untilt($event)">
        <header><span class="num">{{ (i + 1).toString().padStart(2, '0') }}</span><span class="code mc-mono">{{ m.code }}</span></header>
        <h3>{{ m.title }}</h3>
        <p class="desc">{{ m.desc }}</p>
        <div class="tags"><span class="mc-tag" *ngFor="let t of m.tags">{{ t }}</span></div>
        <button class="mc-link" (click)="brief.open(m.title)">Open brief ↗</button>
        <span class="led" aria-hidden="true"></span>
      </article>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .bay{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 40px;margin-top:62px}
    .mod{display:flex;flex-direction:column;min-height:340px;box-sizing:border-box;padding:12px 24px 26px;overflow:hidden;
      transform:perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0));transition:transform .4s cubic-bezier(.2,.9,.2,1),border-color .3s,box-shadow .3s,opacity .8s}
    .mod:hover{border-color:rgba(var(--accent-rgb),.6);box-shadow:var(--shadow-glow)}
    header{display:flex;justify-content:space-between;align-items:flex-start}
    .num{font:400 112px/1 var(--font-display);color:transparent;-webkit-text-stroke:1px rgba(var(--accent-rgb),.55);transition:color .4s}
    .mod:hover .num{color:rgba(var(--accent-rgb),.16)}
    .code{margin-top:18px;color:var(--accent)}
    h3{margin:auto 0 0;padding-top:8px;font:400 30px/1.1 var(--font-display);color:var(--text)}
    .desc{margin:8px 0 0;font:400 15px/1.5 var(--font-body);color:var(--text-muted);min-height:44px}
    .tags{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0 24px}
    .mc-link{align-self:flex-start}
    .led{position:absolute;right:24px;bottom:30px;width:8px;height:8px;border-radius:50%;background:var(--border);transition:.3s}
    .mod:hover .led{background:var(--electric);box-shadow:0 0 12px var(--electric)}
    @media (max-width:1100px){.bay{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}}
    @media (max-width:680px){.bay{grid-template-columns:1fr}.num{font-size:88px}}
    @media (prefers-reduced-motion:reduce){.mod{transform:none!important}}
  `],
})
export class McServicesComponent {
  readonly brief = inject(McBriefService);
  readonly modules = [
    { code: 'FULL BUILD', title: 'Full-Stack Web App', desc: 'Angular 19 + NestJS/.NET, admin, payments, deployed.', tags: ['Admin + CMS', 'Payments', 'CI/CD'] },
    { code: 'API', title: 'Backend & API Design', desc: 'CQRS, auth, rate limits, documented.', tags: ['Swagger', 'JWT + roles', 'Queues'] },
    { code: 'AI', title: 'AI & NLP Features', desc: 'Claude SDK, ATS analyzer, smart search.', tags: ['Claude SDK', 'FastAPI', 'Embeddings'] },
    { code: 'UI', title: 'Interactive Frontends', desc: 'Three.js, motion, design systems.', tags: ['Three.js', 'Tokens', 'A11y'] },
    { code: 'PERF', title: 'Performance Rescue', desc: 'Profiling, query tuning, bundle diet.', tags: ['SQL tuning', 'Lazy routes', 'Caching'] },
    { code: 'OPS', title: 'DevOps & Deploy', desc: 'Railway, Vercel, CI/CD, monitoring.', tags: ['Docker', 'Pipelines', 'Alerts'] },
  ];

  /** A slight 3D tilt toward the pointer, like pulling a module out of a rack. */
  tilt(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 6}deg`);
    el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - .5) * 6}deg`);
  }
  untilt(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
  }
}
