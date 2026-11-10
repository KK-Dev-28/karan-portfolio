import { ChangeDetectionStrategy, Component, Input, NgZone, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcScrollTo } from './mc-shared';

/** Fire from anywhere to unlock an achievement: mcAchieve('squasher'). */
export function mcAchieve(id: string) {
  window.dispatchEvent(new CustomEvent('mc:achieve', { detail: id }));
}

interface Badge { id: string; icon: string; name: string; how: string }
const BADGES: Badge[] = [
  { id: 'explorer', icon: '🛰️', name: 'Explorer', how: 'See every section' },
  { id: 'squasher', icon: '🐛', name: 'Bug squasher', how: 'Finish a bug-hunt round' },
  { id: 'voter', icon: '🗳️', name: 'Early backer', how: 'Vote for a starter kit' },
  { id: 'crew', icon: '✉️', name: 'Crew member', how: 'Join the mission crew' },
  { id: 'hyperspace', icon: '🚀', name: 'Hyperspace', how: 'Find the secret code' },
];
const KEY = 'kk_mission_log';

/**
 * A small HUD that logs which sections a visitor has seen and which
 * achievements they've unlocked, nudging them through the whole page.
 * Progress is kept in localStorage only.
 */
@Component({
  selector: 'mc-mission-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <div class="ml" [class.open]="open()">
    <button class="hud" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="ml-panel">
      <svg viewBox="0 0 36 36" aria-hidden="true"><circle r="15" cx="18" cy="18" class="bg"/><circle r="15" cx="18" cy="18" class="fg" [style.stroke-dashoffset]="94.25 * (1 - pct())"/></svg>
      <span class="lbl"><b>Mission log</b><small>{{ seenCount() }}/{{ ids.length }} explored</small></span>
    </button>

    <div class="panel" id="ml-panel" *ngIf="open()" role="region" aria-label="Mission log">
      <p class="h">Sections</p>
      <ul class="secs">
        <li *ngFor="let s of ids"><button (click)="jump(s)" [class.done]="seen().includes(s)"><i>{{ seen().includes(s) ? '✓' : '○' }}</i>{{ label(s) }}</button></li>
      </ul>
      <p class="h">Achievements · {{ got().length }}/{{ badges.length }}</p>
      <ul class="badges">
        <li *ngFor="let b of badges" [class.got]="got().includes(b.id)" [title]="b.how">
          <span class="bi">{{ got().includes(b.id) ? b.icon : '🔒' }}</span><span><b>{{ b.name }}</b><small>{{ b.how }}</small></span>
        </li>
      </ul>
    </div>
  </div>

  <div class="toast" *ngIf="toast() as t" role="status">
    <span class="ti">{{ t.icon }}</span><span><small>Achievement unlocked</small><b>{{ t.name }}</b></span>
  </div>

  <div class="done" *ngIf="complete()" role="dialog" aria-label="Mission complete">
    <div class="confetti" aria-hidden="true"><i *ngFor="let c of confetti" [style.left.%]="c.x" [style.background]="c.c" [style.animation-delay.ms]="c.d"></i></div>
    <div class="card">
      <p class="k">Mission complete</p>
      <h3>You've seen the whole ship.</h3>
      <p>Thanks for exploring every section. If something caught your eye, let's talk.</p>
      <div class="row"><button class="go" (click)="finish(true)">Start a conversation ↗</button><button class="x" (click)="finish(false)">Keep looking</button></div>
    </div>
  </div>
  `,
  styles: [`
    :host{display:contents}
    .ml{position:fixed;z-index:895;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));font-family:var(--font-body)}
    .hud{display:flex;align-items:center;gap:10px;padding:6px 16px 6px 6px;border-radius:99px;cursor:pointer;
      background:var(--nav-bg-scrolled);border:1px solid var(--border);backdrop-filter:blur(12px);color:var(--text);transition:border-color .2s}
    .hud:hover,.open .hud{border-color:rgba(var(--accent-rgb),.6)}
    .hud:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    svg{width:36px;height:36px;transform:rotate(-90deg)}
    .bg{fill:none;stroke:var(--border);stroke-width:3}
    .fg{fill:none;stroke:var(--accent-2);stroke-width:3;stroke-linecap:round;stroke-dasharray:94.25;transition:stroke-dashoffset .8s cubic-bezier(.2,.9,.2,1)}
    .lbl{display:grid;text-align:left;line-height:1.15}.lbl b{font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase}
    .lbl small{font-size:12px;color:var(--text-muted)}
    .panel{position:absolute;left:0;bottom:calc(100% + 10px);width:min(320px,calc(100vw - 32px));max-height:min(70vh,560px);overflow:auto;box-sizing:border-box;
      padding:16px;border-radius:18px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow-card);animation:up .3s cubic-bezier(.2,.9,.2,1)}
    .h{margin:4px 0 8px;font:500 11px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
    ul{list-style:none;margin:0 0 12px;padding:0}
    .secs{display:grid;grid-template-columns:1fr 1fr;gap:4px}
    .secs button{display:flex;gap:6px;width:100%;padding:6px 8px;border:0;border-radius:8px;background:none;color:var(--text-muted);font:400 13px var(--font-body);cursor:pointer;text-align:left}
    .secs button:hover{background:var(--bg-2);color:var(--text)} .secs .done{color:var(--text)} .secs i{font-style:normal;color:var(--electric);width:12px}
    .badges li{display:flex;gap:10px;align-items:center;padding:7px 8px;border-radius:10px;opacity:.55}
    .badges li.got{opacity:1;background:rgba(var(--accent-rgb),.08)}
    .bi{font-size:20px;width:26px;text-align:center}.badges b{display:block;font:500 13px var(--font-body);color:var(--text)}.badges small{color:var(--text-dim);font-size:12px}
    .toast{position:fixed;z-index:9600;left:50%;bottom:28px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:10px 20px 10px 12px;
      border-radius:16px;background:var(--card);border:1px solid rgba(var(--accent-rgb),.7);box-shadow:var(--shadow-glow);animation:pop 3.2s cubic-bezier(.2,.9,.2,1) forwards}
    .ti{font-size:28px}.toast small{display:block;font:500 10px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
    .toast b{font:400 22px var(--font-display);color:var(--text)}
    .done{position:fixed;inset:0;z-index:9700;display:grid;place-items:center;padding:16px;background:rgba(5,5,6,.6);backdrop-filter:blur(4px);animation:fade .4s}
    .card{position:relative;max-width:440px;padding:32px;border-radius:24px;background:var(--card);border:1px solid rgba(var(--accent-rgb),.6);box-shadow:var(--shadow-glow);text-align:center;animation:up .5s cubic-bezier(.2,.9,.2,1)}
    .k{margin:0;font:500 12px var(--font-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
    .card h3{margin:10px 0;font:400 38px/1.05 var(--font-display);color:var(--text)} .card p{color:var(--text-muted)}
    .row{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:18px}
    .go,.x{height:46px;padding:0 22px;border-radius:99px;cursor:pointer;font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase}
    .go{border:0;background:#e3b341;color:#14110a}.x{border:1px solid var(--border);background:none;color:var(--text)}
    .confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none}
    .confetti i{position:absolute;top:-12px;width:8px;height:14px;border-radius:2px;animation:fall 2.8s cubic-bezier(.3,.6,.4,1) forwards}
    @keyframes fall{to{transform:translateY(105vh) rotate(720deg)}}
    @keyframes pop{0%{opacity:0;transform:translate(-50%,20px) scale(.9)}10%,82%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,10px)}}
    @keyframes up{from{opacity:0;transform:translateY(12px)}}
    @keyframes fade{from{opacity:0}}
    @media (max-width:600px){.lbl small{display:none}.hud{padding-right:12px}}
    @media (prefers-reduced-motion:reduce){.toast,.panel,.card,.done{animation:none}.confetti{display:none}}
  `],
})
export class McMissionLogComponent implements OnInit, OnDestroy {
  @Input({ required: true }) ids: string[] = [];
  readonly badges = BADGES;
  readonly open = signal(false);
  readonly seen = signal<string[]>([]);
  readonly got = signal<string[]>([]);
  readonly toast = signal<Badge | null>(null);
  readonly complete = signal(false);
  readonly seenCount = computed(() => this.ids.filter(i => this.seen().includes(i)).length);
  readonly pct = computed(() => this.ids.length ? this.seenCount() / this.ids.length : 0);
  readonly confetti = Array.from({ length: 40 }, (_, i) => ({
    x: Math.random() * 100, d: Math.random() * 900, c: ['#e3b341', '#5eead4', '#ff7a5c', '#f1ede3', '#f0c860'][i % 5],
  }));
  private zone = inject(NgZone);
  private io?: IntersectionObserver;
  private toastTimer?: ReturnType<typeof setTimeout>;

  private static readonly LABELS: Record<string, string> = {
    hero: 'Mission control', architecture: 'Architecture', journey: 'Journey', services: 'Services', process: 'Process',
    projects: 'Selected work', play: 'Bug hunt', kits: 'Starter kits', scope: 'Scope it', reviews: 'Reviews', faq: 'FAQ', contact: 'Contact', crew: 'Mission crew',
  };
  label(id: string) { return McMissionLogComponent.LABELS[id] ?? id; }

  ngOnInit() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); this.seen.set(s.seen ?? []); this.got.set(s.got ?? []); } catch {}
    addEventListener('mc:achieve', this.onAchieve as EventListener);
    // Observed after the sections have rendered.
    setTimeout(() => this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver(es => {
        for (const e of es) if (e.isIntersecting) this.zone.run(() => this.mark((e.target as HTMLElement).id));
      }, { threshold: .35 });
      this.ids.forEach(id => { const el = document.getElementById(id); if (el) this.io!.observe(el); });
    }), 600);
  }

  ngOnDestroy() { this.io?.disconnect(); removeEventListener('mc:achieve', this.onAchieve as EventListener); clearTimeout(this.toastTimer); }

  jump(id: string) { this.open.set(false); mcScrollTo(id); }

  finish(talk: boolean) { this.complete.set(false); if (talk) mcScrollTo('contact'); }

  private onAchieve = (e: CustomEvent<string>) => this.zone.run(() => this.unlock(e.detail));

  private mark(id: string) {
    if (this.seen().includes(id)) return;
    this.seen.update(s => [...s, id]);
    this.save();
    if (this.ids.every(i => this.seen().includes(i)) && !this.got().includes('explorer')) {
      this.unlock('explorer');
      this.complete.set(true);
    }
  }

  private unlock(id: string) {
    const b = BADGES.find(x => x.id === id);
    if (!b || this.got().includes(id)) return;
    this.got.update(g => [...g, id]);
    this.save();
    this.toast.set(b);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3300);
  }

  private save() {
    try { localStorage.setItem(KEY, JSON.stringify({ seen: this.seen(), got: this.got() })); } catch {}
  }
}
