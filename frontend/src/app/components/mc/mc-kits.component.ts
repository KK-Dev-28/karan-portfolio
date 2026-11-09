import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McBriefService, McRevealDirective, MC_LINKS } from './mc-shared';

const VOTES_KEY = 'kk_kit_votes';

/** Figma "Creative · 05 Kits + Contact — Cartridge Shelf". */
@Component({
  selector: 'mc-kits',
  standalone: true,
  imports: [CommonModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="kits" aria-labelledby="kits-title">
    <p class="mc-kicker">06 · In the works</p>
    <h2 id="kits-title" class="mc-title">Starter kits — vote what ships first</h2>

    <div class="shelf">
      <article *ngFor="let k of kits; let i = index" class="mc-card kit mc-holo" mcReveal [style.transition-delay.ms]="i * 80" [class.voted]="voted(k.id)">
        <div class="meter" aria-hidden="true"><i></i></div>
        <p class="soon mc-mono"><span class="dot"></span>Coming soon</p>
        <h3>{{ k.name }}</h3>
        <p class="desc">{{ k.desc }}</p>
        <ul><li *ngFor="let b of k.bullets">▸ {{ b }}</li></ul>
        <button class="vote" (click)="vote(k.id, k.name)" [attr.aria-pressed]="voted(k.id)">
          {{ voted(k.id) ? 'Voted ✓ Noted' : "I'd buy this +" }}
        </button>
      </article>
    </div>
  </section>

  <section class="mc-sec tiers-sec" id="gigs" aria-labelledby="tiers-title">
    <p class="mc-kicker">07 · Work with me</p>
    <h2 id="tiers-title" class="mc-title">Pick how we start</h2>
    <div class="tiers">
      <button *ngFor="let t of tiers; let i = index" class="mc-card tier mc-holo" mcReveal [style.transition-delay.ms]="i * 80" (click)="brief.open(t.name)">
        <span class="mc-mono">Tier 0{{ i + 1 }}</span>
        <span class="tname">{{ t.name }}</span>
        <span class="tdesc">{{ t.desc }}</span>
        <span class="mc-link">Start ↗</span>
      </button>
    </div>
    <div class="links">
      <a class="mc-chip" [href]="links.email">Email</a>
      <a class="mc-chip" [href]="links.linkedin" target="_blank" rel="noopener">LinkedIn</a>
      <a class="mc-chip" [href]="links.github" target="_blank" rel="noopener">GitHub ↗</a>
      <a class="mc-chip" [href]="links.whatsapp" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .shelf,.tiers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 40px;margin-top:62px}
    .kit{display:flex;flex-direction:column;padding:24px 24px 28px;min-height:420px;box-sizing:border-box;transition:border-color .3s,box-shadow .3s,opacity .8s,transform .6s cubic-bezier(.2,.9,.2,1),translate .8s cubic-bezier(.2,.9,.2,1)}
    .kit:hover{border-color:rgba(var(--accent-rgb),.5)}
    .meter{height:10px;border-radius:99px;background:var(--bg-3);overflow:hidden}
    .meter i{display:block;height:100%;width:38%;border-radius:99px;background:linear-gradient(90deg,#b8860b,#e3b341);transition:width .8s cubic-bezier(.2,.9,.2,1)}
    .kit:hover .meter i{width:62%}.voted .meter i{width:100%;background:linear-gradient(90deg,#0f9488,var(--electric))}
    .soon{display:flex;align-items:center;gap:8px;margin:26px 0 0;color:var(--crimson)}
    .soon .dot{width:6px;height:6px;border-radius:50%;background:var(--crimson);animation:blink 1.6s infinite}
    h3{margin:12px 0 0;font:400 40px/1.1 var(--font-display);color:var(--text)}
    .desc{margin:14px 0 0;font:400 15px/1.5 var(--font-body);color:var(--text-muted)}
    ul{list-style:none;margin:22px 0 0;padding:0;display:grid;gap:9px;font:400 14px var(--font-body);color:var(--text-muted)}
    .vote{align-self:flex-start;margin-top:auto;min-width:170px;height:42px;padding:0 20px;border-radius:99px;cursor:pointer;
      border:1px solid rgba(var(--accent-rgb),.6);background:transparent;color:var(--accent);font:500 13px var(--font-mono);transition:.25s}
    .vote:hover{background:rgba(var(--accent-rgb),.1)}
    .voted .vote{background:var(--electric);border-color:var(--electric);color:#06201c;min-width:190px}
    .vote:focus-visible,.tier:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .tiers-sec{padding-top:0}
    .tier{display:flex;flex-direction:column;align-items:flex-start;text-align:left;min-height:230px;padding:24px;box-sizing:border-box;cursor:pointer;
      font:inherit;color:inherit;transition:border-color .3s,box-shadow .3s,transform .35s cubic-bezier(.2,.9,.2,1),opacity .8s,translate .8s cubic-bezier(.2,.9,.2,1)}
    .tier:hover{border-color:rgba(var(--accent-rgb),.6);box-shadow:var(--shadow-glow)}
    .tname{margin-top:16px;font:400 40px/1.1 var(--font-display);color:var(--text)}
    .tdesc{margin-top:14px;font:400 15px/1.5 var(--font-body);color:var(--text-muted)}
    .tier .mc-link{margin-top:auto}
    .links{display:flex;flex-wrap:wrap;gap:20px;margin-top:40px}
    .links .mc-chip{min-width:130px;justify-content:flex-start;text-decoration:none;color:var(--text);transition:border-color .2s}
    .links .mc-chip:hover{border-color:rgba(var(--accent-rgb),.6)}
    @keyframes blink{50%{opacity:.3}}
    @media (max-width:1000px){.shelf,.tiers{grid-template-columns:1fr 1fr;gap:24px}}
    @media (max-width:640px){.shelf,.tiers{grid-template-columns:1fr}}
  `],
})
export class McKitsComponent {
  readonly brief = inject(McBriefService);
  readonly links = MC_LINKS;
  private readonly votes = signal<string[]>(readVotes());

  readonly kits = [
    { id: 'portfolio-starter', name: 'Portfolio Starter Kit',
      desc: 'This site as a template: Angular 19 + NestJS, CMS, payments, CI/CD. Deploy-ready in under an hour.',
      bullets: ['Standalone components', 'Admin panel', 'Railway + Vercel config'] },
    { id: 'saas-admin', name: 'SaaS Admin Kit',
      desc: 'NestJS API with JWT roles, CQRS and Swagger, plus an Angular admin dashboard on top.',
      bullets: ['JWT auth + role guards', 'CQRS + rate limiting', 'Postgres migrations'] },
    { id: 'ai-ats', name: 'AI ATS Kit',
      desc: 'The résumé analyzer as a kit: FastAPI scoring service, Claude SDK prompts and an Angular front end.',
      bullets: ['FastAPI NLP service', 'Claude SDK integration', 'Score report UI'] },
  ];
  readonly tiers = [
    { name: 'Quick Fix', desc: 'Bug, audit or small feature. Days.' },
    { name: 'Project Build', desc: 'Scoped product, weekly sprints. Weeks.' },
    { name: 'Embedded Partner', desc: 'Ongoing engineering retainer.' },
  ];

  voted(id: string) { return this.votes().includes(id); }

  /** Votes are kept per browser; a first vote also opens a WhatsApp note so the interest reaches Karan. */
  vote(id: string, name: string) {
    const was = this.voted(id);
    this.votes.update(v => (was ? v.filter(x => x !== id) : [...v, id]));
    try { localStorage.setItem(VOTES_KEY, JSON.stringify(this.votes())); } catch {}
    if (!was) window.open('/api/wa?text=' + encodeURIComponent(`Hi Karan, I'd buy the ${name} when it ships. Please let me know.`), '_blank', 'noopener');
  }
}

function readVotes(): string[] {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '[]'); } catch { return []; }
}
