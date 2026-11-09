import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { McRevealDirective, MC_LINKS } from './mc-shared';

interface Work { kind: string; name: string; blurb: string; stack: string; route?: string; href?: string }

/** Figma "Creative · Projects Showcase". */
@Component({
  selector: 'mc-work',
  standalone: true,
  imports: [CommonModule, RouterLink, McRevealDirective],
  template: `
  <section class="mc-sec" id="projects" aria-labelledby="work-title">
    <p class="mc-kicker">05 · Selected work</p>
    <h2 id="work-title" class="mc-title">Things I shipped, end to end</h2>

    <div class="grid">
      <article *ngFor="let w of work; let i = index" class="mc-card item mc-holo" mcReveal [style.transition-delay.ms]="(i % 2) * 90">
        <div class="screen">
          <span class="num">{{ (i + 1).toString().padStart(2, '0') }}</span>
          <p class="blurb">{{ w.blurb }}</p>
          <span class="scan" aria-hidden="true"></span>
        </div>
        <p class="kind mc-mono">{{ w.kind }}</p>
        <h3>{{ w.name }}</h3>
        <div class="foot">
          <p class="stack mc-mono">{{ w.stack }}</p>
          <a *ngIf="w.route" class="mc-link" [routerLink]="w.route">View case ↗</a>
          <a *ngIf="!w.route" class="mc-link" [href]="w.href" target="_blank" rel="noopener">View code ↗</a>
        </div>
      </article>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 40px;margin-top:88px}
    .item{padding:24px 24px 26px;transition:border-color .3s,box-shadow .3s,transform .4s cubic-bezier(.2,.9,.2,1),opacity .8s,translate .8s cubic-bezier(.2,.9,.2,1)}
    .item:hover{border-color:rgba(var(--accent-rgb),.6);box-shadow:var(--shadow-glow)}
    .screen{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;height:150px;padding:10px 26px 22px 20px;
      box-sizing:border-box;border-radius:14px;overflow:hidden;border:1px solid var(--border);
      background:radial-gradient(ellipse at 80% 0%,rgba(var(--accent-rgb),.18),transparent 60%),var(--bg-2)}
    .num{align-self:flex-start;font:400 110px/1 var(--font-display);color:rgba(var(--accent-rgb),.85)}
    .blurb{margin:0 0 50px;max-width:350px;font:400 15px/1.4 var(--font-body);color:var(--text-muted);text-align:right}
    .scan{position:absolute;inset:0;background:linear-gradient(180deg,transparent 0,rgba(var(--electric-rgb),.12) 50%,transparent 100%);
      transform:translateY(-100%);opacity:0}
    .item:hover .scan{animation:scan 1.4s ease-in-out;opacity:1}
    .kind{margin:22px 0 0;color:var(--text-muted);text-transform:none;letter-spacing:.02em}
    h3{margin:2px 0 0;font:400 clamp(40px,4vw,54px)/1.1 var(--font-display);color:var(--text)}
    .foot{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:8px}
    .stack{margin:0;color:var(--accent);text-transform:none;letter-spacing:.02em}
    @keyframes scan{to{transform:translateY(100%)}}
    @media (max-width:900px){.grid{grid-template-columns:1fr;margin-top:56px}}
    @media (max-width:520px){.blurb{display:none}}
  `],
})
export class McWorkComponent {
  readonly work: Work[] = [
    { kind: 'Hyperlocal marketplace', name: 'LocalHaat', blurb: 'Orders, vendors, live delivery tracking', stack: 'Angular · NestJS · PostgreSQL', route: '/case-study/local-shopping-survey' },
    { kind: 'AI scoring engine', name: 'ATS Résumé Analyzer', blurb: 'Scores résumés against a job description', stack: 'FastAPI · NLP · Claude SDK', route: '/resume-review' },
    { kind: 'Multi-store head office', name: 'Retail ERP', blurb: 'Head office portal syncing store servers', stack: 'Angular · .NET 8 · SQL Server', href: MC_LINKS.github },
    { kind: 'Interactive 3D site', name: 'This Portfolio', blurb: 'Radar hero, live telemetry, voting kits', stack: 'Angular 19 · NestJS', href: 'https://github.com/KK-Dev-28/karan-portfolio' },
  ];
}
