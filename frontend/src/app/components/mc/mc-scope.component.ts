import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McBriefService, McRevealDirective } from './mc-shared';

interface Opt { id: string; label: string; fit: number; stack?: string; note?: string }

/* `fit` is how squarely an option sits in Karan's stack and past work
   (1 = core, lower = doable with caveats). `note` flags a caveat. */
const KINDS: Opt[] = [
  { id: 'webapp', label: 'Web app', fit: 1, stack: 'Angular 19 · NestJS · PostgreSQL' },
  { id: 'saas', label: 'SaaS product', fit: 1, stack: 'Angular 19 · NestJS · PostgreSQL' },
  { id: 'api', label: 'API / backend', fit: 1, stack: 'NestJS or .NET 8 · PostgreSQL' },
  { id: 'ai', label: 'AI feature', fit: .95, stack: 'Claude SDK · FastAPI · NestJS' },
  { id: 'site', label: 'Marketing site', fit: .9, stack: 'Angular 19 · Vercel' },
  { id: 'rescue', label: 'Fix an existing app', fit: .9, stack: 'Your stack, audited first' },
];
const MUSTS: Opt[] = [
  { id: 'auth', label: 'Login & roles', fit: 1 },
  { id: 'payments', label: 'Payments', fit: .95 },
  { id: 'admin', label: 'Admin / CMS', fit: 1 },
  { id: 'realtime', label: 'Real-time updates', fit: .85 },
  { id: 'ai', label: 'AI / NLP', fit: .95 },
  { id: 'mobile', label: 'Mobile-first', fit: .8, note: 'Mobile means a responsive web app or PWA, not a native iOS/Android build.' },
  { id: 'integrations', label: 'Third-party APIs', fit: .9 },
];
const STAGES: Opt[] = [
  { id: 'idea', label: 'Just an idea', fit: 1 },
  { id: 'designs', label: 'Designs ready', fit: 1 },
  { id: 'code', label: 'Existing codebase', fit: .95 },
];
const PACES: Opt[] = [
  { id: 'asap', label: 'ASAP', fit: .9, note: 'For ASAP work, a Quick Fix or a tightly scoped first sprint starts fastest.' },
  { id: 'months', label: '1–3 months', fit: 1 },
  { id: 'flex', label: 'Flexible', fit: 1 },
];

/** Figma page 3 "What do you need to build?" — a quick scoper that turns into a brief. */
@Component({
  selector: 'mc-scope',
  standalone: true,
  imports: [CommonModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="scope" aria-labelledby="scope-title">
    <p class="mc-kicker">09 · Scope it in 20 seconds</p>
    <h2 id="scope-title" class="mc-title">What do you need <em>to build?</em></h2>

    <div class="grid">
      <div class="mc-card picks" mcReveal>
        <fieldset>
          <legend class="mc-mono">01 · It's a…</legend>
          <button *ngFor="let o of kinds" type="button" class="chip" [class.on]="kind() === o.id" [attr.aria-pressed]="kind() === o.id" (click)="kind.set(o.id)">{{ o.label }}</button>
        </fieldset>
        <fieldset>
          <legend class="mc-mono">02 · It needs</legend>
          <button *ngFor="let o of musts" type="button" class="chip" [class.on]="has(o.id)" [attr.aria-pressed]="has(o.id)" (click)="toggle(o.id)">{{ o.label }}</button>
        </fieldset>
        <fieldset>
          <legend class="mc-mono">03 · Where it stands</legend>
          <button *ngFor="let o of stages" type="button" class="chip" [class.on]="stage() === o.id" [attr.aria-pressed]="stage() === o.id" (click)="stage.set(o.id)">{{ o.label }}</button>
        </fieldset>
        <fieldset>
          <legend class="mc-mono">04 · Timeline</legend>
          <button *ngFor="let o of paces" type="button" class="chip" [class.on]="pace() === o.id" [attr.aria-pressed]="pace() === o.id" (click)="pace.set(o.id)">{{ o.label }}</button>
        </fieldset>
      </div>

      <aside class="mc-card result mc-holo" mcReveal aria-live="polite">
        <div class="ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" class="bg"/>
            <circle cx="60" cy="60" r="52" class="fg" [style.stroke-dashoffset]="326.7 * (1 - (score() ?? 0) / 100)"/>
          </svg>
          <div class="val"><b>{{ score() ?? '—' }}</b><small>stack fit</small></div>
        </div>
        <ng-container *ngIf="score() !== null; else hint">
          <dl>
            <div><dt>Suggested start</dt><dd>{{ tier() }}</dd></div>
            <div><dt>Likely stack</dt><dd>{{ stack() }}</dd></div>
          </dl>
          <p class="note" *ngFor="let n of notes()">⚑ {{ n }}</p>
          <button class="mc-btn mc-btn--gold" (click)="send()">Send this brief ↗</button>
        </ng-container>
        <ng-template #hint><p class="hint">Pick what you're building and the score shows how squarely it sits in my stack, with a suggested way to start.</p></ng-template>
      </aside>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .grid{display:grid;grid-template-columns:1.35fr 1fr;gap:40px;margin-top:56px;align-items:start}
    .picks{padding:28px 32px;display:grid;gap:24px}
    fieldset{border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
    legend{width:100%;margin-bottom:12px;color:var(--accent)}
    .chip{height:40px;padding:0 18px;border-radius:99px;border:1px solid var(--border);background:var(--bg-2);color:var(--text-muted);
      font:400 14px var(--font-body);cursor:pointer;transition:background .2s,border-color .2s,color .2s,transform .2s}
    .chip:hover{border-color:rgba(var(--accent-rgb),.6);color:var(--text);transform:translateY(-1px)}
    .chip.on{background:#e3b341;border-color:#e3b341;color:#14110a}
    .chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .result{position:sticky;top:96px;padding:32px;display:grid;gap:18px;justify-items:start;
      background:radial-gradient(ellipse at 100% 0%,rgba(var(--accent-rgb),.14),transparent 60%),var(--card)}
    .ring{position:relative;width:170px;height:170px;justify-self:center}
    .ring svg{width:100%;height:100%;transform:rotate(-90deg)}
    .bg{fill:none;stroke:var(--border);stroke-width:8}
    .fg{fill:none;stroke:var(--accent-2);stroke-width:8;stroke-linecap:round;stroke-dasharray:326.7;
      transition:stroke-dashoffset .9s cubic-bezier(.2,.9,.2,1);filter:drop-shadow(0 0 8px rgba(var(--accent-2-rgb),.6))}
    .val{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
    .val b{font:400 58px/1 var(--font-display);color:var(--text)}
    .val small{font:500 10px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
    dl{margin:0;display:grid;gap:12px;width:100%}
    dt{font:500 11px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim)}
    dd{margin:2px 0 0;font:400 22px/1.2 var(--font-display);color:var(--text)}
    .note{margin:0;font:400 13px/1.5 var(--font-body);color:var(--crimson)}
    .hint{margin:0;color:var(--text-muted);font:400 15px/1.6 var(--font-body)}
    @media (max-width:980px){.grid{grid-template-columns:1fr}.result{position:static}}
  `],
})
export class McScopeComponent {
  private brief = inject(McBriefService);
  readonly kinds = KINDS; readonly musts = MUSTS; readonly stages = STAGES; readonly paces = PACES;
  readonly kind = signal<string | null>(null);
  readonly picks = signal<string[]>([]);
  readonly stage = signal<string | null>(null);
  readonly pace = signal<string | null>(null);

  has(id: string) { return this.picks().includes(id); }
  toggle(id: string) { this.picks.update(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])); }

  private chosen = computed(() => [
    ...KINDS.filter(o => o.id === this.kind()), ...MUSTS.filter(o => this.has(o.id)),
    ...STAGES.filter(o => o.id === this.stage()), ...PACES.filter(o => o.id === this.pace()),
  ]);

  readonly score = computed(() => {
    const c = this.chosen();
    if (!this.kind()) return null;
    return Math.round(c.reduce((a, o) => a + o.fit, 0) / c.length * 100);
  });

  readonly tier = computed(() => {
    if (this.kind() === 'rescue' || this.pace() === 'asap' && this.picks().length <= 1) return 'Tier 01 · Quick Fix';
    if (this.picks().length >= 4 && this.pace() !== 'asap') return 'Tier 03 · Embedded Partner';
    return 'Tier 02 · Project Build';
  });

  readonly stack = computed(() => {
    const base = KINDS.find(o => o.id === this.kind())?.stack ?? '';
    const extra = [this.has('ai') && !base.includes('Claude') ? 'Claude SDK' : '', this.has('payments') ? 'payments gateway' : ''].filter(Boolean);
    return [base, ...extra].join(' + ');
  });

  readonly notes = computed(() => this.chosen().map(o => o.note).filter((n): n is string => !!n));

  send() {
    const name = (list: Opt[], id: string | null) => list.find(o => o.id === id)?.label;
    const parts = [
      name(KINDS, this.kind()),
      this.picks().length ? 'needs ' + MUSTS.filter(o => this.has(o.id)).map(o => o.label.toLowerCase()).join(', ') : '',
      name(STAGES, this.stage())?.toLowerCase(),
      name(PACES, this.pace()) ? 'timeline: ' + name(PACES, this.pace()) : '',
    ].filter(Boolean);
    this.brief.open(`${parts.join('; ')} (${this.tier()})`);
  }
}
