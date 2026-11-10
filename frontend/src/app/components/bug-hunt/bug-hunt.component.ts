import { ChangeDetectionStrategy, Component, OnDestroy, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcAchieve } from '../mc/mc-mission-log.component';

interface Target { id: number; x: number; y: number; kind: 'bug' | 'feature' | 'gold'; born: number; life: number }

const ROUND = 20; // seconds
const BEST_KEY = 'kk_bughunt_best';

/**
 * "Squash the Bugs" — a 20-second reflex game in a code-editor arena.
 * Bugs +1 (combo multiplies), golden bugs +5, never squash a ✨ feature (−3).
 */
@Component({
  selector: 'app-bug-hunt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <section class="bh" id="play" aria-labelledby="bh-title">
    <div class="bh-head">
      <p class="bh-kicker">06 · BREAK · 20 SECONDS</p>
      <h2 id="bh-title">Bored of reading? <em>Squash some bugs.</em></h2>
      <p class="bh-sub">Hit the bugs, grab the golden ones, and don't break a ✨ feature. Combos multiply your score.</p>
    </div>

    <div class="bh-ide" [class.playing]="state() === 'play'" [class.shake]="shake()">
      <div class="bh-bar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="bh-file">production.ts</span>
        <span class="bh-hud">
          <b>{{ score() }}</b> pts · x{{ mult() }} · {{ timeLeft() }}s · best {{ best() }}
        </span>
      </div>

      <div class="bh-arena" [class.live]="state() === 'play'">
        <pre class="bh-code" aria-hidden="true">{{ code }}</pre>

        <button *ngFor="let t of targets(); trackBy: tid" class="bh-t" [ngClass]="t.kind"
          [style.left.%]="t.x" [style.top.%]="t.y"
          [attr.aria-label]="t.kind === 'feature' ? 'Feature, do not click' : 'Bug'"
          (pointerdown)="hit(t, $event)">
          {{ t.kind === 'feature' ? '✨' : '🐛' }}
        </button>

        <span *ngFor="let p of pops(); trackBy: pid" class="bh-pop" [class.neg]="p.v < 0"
          [style.left.%]="p.x" [style.top.%]="p.y">{{ p.v > 0 ? '+' : '' }}{{ p.v }}</span>

        <i *ngFor="let s of sparks(); trackBy: pid" class="bh-spark"
          [style.left.%]="s.x" [style.top.%]="s.y" [style.--dx]="s.dx + 'px'" [style.--dy]="s.dy + 'px'" [style.--c]="s.c"></i>

        <div class="bh-overlay" *ngIf="state() !== 'play'">
          <ng-container *ngIf="state() === 'idle'">
            <p class="bh-big">Ready to ship?</p>
            <button class="bh-go" (click)="start()">Start debugging ▶</button>
          </ng-container>
          <ng-container *ngIf="state() === 'over'">
            <p class="bh-rank">{{ rank() }}</p>
            <p class="bh-big">{{ score() }} points</p>
            <p class="bh-meta">{{ squashed }} bugs squashed · best combo x{{ bestMult }}<span *ngIf="newBest"> · new personal best 🏆</span></p>
            <button class="bh-go" (click)="start()">Play again ↻</button>
          </ng-container>
        </div>
      </div>
      <div class="bh-prog"><i [style.width.%]="timeLeft() / ${ROUND} * 100"></i></div>
    </div>
  </section>
  `,
  styleUrls: ['./bug-hunt.component.scss'],
})
export class BugHuntComponent implements OnDestroy {
  readonly state = signal<'idle' | 'play' | 'over'>('idle');
  readonly score = signal(0);
  readonly combo = signal(0);
  readonly timeLeft = signal(ROUND);
  readonly targets = signal<Target[]>([]);
  readonly pops = signal<{ id: number; x: number; y: number; v: number }[]>([]);
  readonly sparks = signal<{ id: number; x: number; y: number; dx: number; dy: number; c: string }[]>([]);
  readonly shake = signal(false);
  readonly best = signal(this.loadBest());
  readonly mult = computed(() => 1 + Math.floor(this.combo() / 4));
  readonly rank = computed(() => {
    const s = this.score();
    return s >= 60 ? 'Principal engineer 🚀' : s >= 40 ? 'Senior dev energy' : s >= 20 ? 'Solid mid-level' : s > 0 ? 'Intern on day one' : 'Production is on fire 🔥';
  });

  squashed = 0; bestMult = 1; newBest = false;
  private seq = 0; private raf = 0; private startAt = 0; private nextSpawn = 0;

  readonly code = `async function deploy(build) {
  const tests = await run(build.suite);
  if (!tests.green) throw new Error('nope');
  await cdn.purge('/*');
  return railway.ship(build, { zeroDowntime: true });
}
// TODO: remove the bugs before Friday
for (const user of visitors) greet(user.name ?? 'friend');`;

  constructor(private zone: NgZone) {}

  tid = (_: number, t: Target) => t.id;
  pid = (_: number, p: { id: number }) => p.id;

  start() {
    this.score.set(0); this.combo.set(0); this.targets.set([]); this.pops.set([]);
    this.squashed = 0; this.bestMult = 1; this.newBest = false;
    this.timeLeft.set(ROUND); this.state.set('play');
    this.startAt = performance.now(); this.nextSpawn = 0;
    cancelAnimationFrame(this.raf);
    this.zone.runOutsideAngular(() => { this.raf = requestAnimationFrame(this.tick); });
  }

  private tick = (now: number) => {
    const elapsed = (now - this.startAt) / 1000;
    const left = Math.max(0, Math.ceil(ROUND - elapsed));
    this.zone.run(() => {
      if (left !== this.timeLeft()) this.timeLeft.set(left);
      // Expire old targets; a bug that escapes breaks the combo.
      const alive = this.targets().filter(t => now - t.born < t.life);
      if (alive.length !== this.targets().length) {
        const escaped = this.targets().some(t => now - t.born >= t.life && t.kind !== 'feature');
        if (escaped) this.combo.set(0);
        this.targets.set(alive);
      }
      // Spawn faster as the round goes on.
      if (now >= this.nextSpawn) {
        const r = Math.random();
        const kind: Target['kind'] = r < 0.08 ? 'gold' : r < 0.28 ? 'feature' : 'bug';
        this.targets.update(ts => [...ts, {
          id: ++this.seq, kind, born: now,
          x: 6 + Math.random() * 84, y: 8 + Math.random() * 78,
          life: kind === 'gold' ? 900 : 1500 - elapsed * 30,
        }]);
        this.nextSpawn = now + Math.max(260, 720 - elapsed * 24);
      }
      if (elapsed >= ROUND) this.end();
    });
    if (this.state() === 'play') this.raf = requestAnimationFrame(this.tick);
  };

  hit(t: Target, ev: Event) {
    ev.preventDefault();
    if (this.state() !== 'play') return;
    let v: number;
    if (t.kind === 'feature') {
      v = -3; this.combo.set(0);
      this.shake.set(true); setTimeout(() => this.shake.set(false), 300);
    }
    else {
      this.combo.update(c => c + 1);
      v = (t.kind === 'gold' ? 5 : 1) * this.mult();
      this.squashed++; this.bestMult = Math.max(this.bestMult, this.mult());
    }
    this.score.update(s => Math.max(0, s + v));
    this.targets.update(ts => ts.filter(x => x.id !== t.id));
    const pop = { id: ++this.seq, x: t.x, y: t.y, v };
    this.pops.update(p => [...p, pop]);
    setTimeout(() => this.pops.update(p => p.filter(x => x.id !== pop.id)), 700);
    if (t.kind !== 'feature') this.burst(t);
  }

  /** A ring of splat particles where a bug was squashed. */
  private burst(t: Target) {
    const c = t.kind === 'gold' ? 'var(--accent)' : 'var(--bug)';
    const n = t.kind === 'gold' ? 12 : 8;
    const ps = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, r = 28 + Math.random() * 22;
      return { id: ++this.seq, x: t.x, y: t.y, dx: Math.cos(a) * r, dy: Math.sin(a) * r, c };
    });
    this.sparks.update(s => [...s, ...ps]);
    const ids = new Set(ps.map(p => p.id));
    setTimeout(() => this.sparks.update(s => s.filter(p => !ids.has(p.id))), 560);
  }

  private end() {
    this.state.set('over'); this.targets.set([]);
    mcAchieve('squasher');
    if (this.score() > this.best()) {
      this.best.set(this.score()); this.newBest = true;
      try { localStorage.setItem(BEST_KEY, String(this.score())); } catch {}
    }
  }

  private loadBest(): number { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }

  ngOnDestroy() { cancelAnimationFrame(this.raf); }
}
