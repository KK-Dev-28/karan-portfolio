import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderStats } from '../../../services/builder.service';
import { CountUpDirective } from '../../../directives/count-up.directive';

interface DayPoint { date: string; views: number; visitors: number; }

/**
 * The admin landing panel: thirty days of traffic as an area chart, a
 * day × hour heatmap of when people read, live visitors, and the money and
 * pipeline figures beside them.
 */
@Component({
  selector: 'app-admin-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CountUpDirective],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
})
export class AdminOverviewComponent {
  /** The whole analytics dashboard payload the admin page already polls. */
  @Input() set data(v: any) { this._data.set(v ?? null); }
  @Input() set builder(v: BuilderStats | null) { this._builder.set(v ?? null); }

  private _data = signal<any>(null);
  private _builder = signal<BuilderStats | null>(null);

  /** Which metric the big chart draws. */
  readonly metric = signal<'views' | 'visitors'>('views');

  readonly insights = computed(() => this._data()?.analytics?.insights ?? null);
  readonly stats = computed(() => this._data()?.analytics?.stats ?? {});
  readonly builderStats = computed(() => this._builder());

  readonly days = computed<DayPoint[]>(() => (this.insights()?.daily30 ?? []) as DayPoint[]);
  readonly heatmap = computed<number[][]>(() => (this.insights()?.heatmap ?? []) as number[][]);

  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ── The area chart, drawn as a single SVG path ── */

  private readonly W = 720;
  private readonly H = 180;

  readonly peak = computed(() => {
    const k = this.metric();
    return Math.max(1, ...this.days().map(d => d[k] ?? 0));
  });

  readonly points = computed(() => {
    const rows = this.days(); const k = this.metric(); const peak = this.peak();
    if (rows.length < 2) return [];
    return rows.map((d, i) => ({
      x: (i / (rows.length - 1)) * this.W,
      y: this.H - ((d[k] ?? 0) / peak) * (this.H - 12),
      day: d,
    }));
  });

  readonly linePath = computed(() => {
    const p = this.points();
    return p.length ? p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') : '';
  });

  readonly areaPath = computed(() => {
    const p = this.points();
    return p.length ? `${this.linePath()} L${this.W} ${this.H} L0 ${this.H} Z` : '';
  });

  /** Dates to label under the chart: first, middle and last. */
  readonly axisLabels = computed(() => {
    const rows = this.days();
    if (rows.length < 2) return [];
    return [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]]
      .map(d => this.shortDate(d.date));
  });

  readonly hottest = computed(() => {
    let best = 0;
    for (const row of this.heatmap()) for (const n of row) if (n > best) best = n;
    return Math.max(1, best);
  });

  heat(day: number, hour: number) {
    const n = this.heatmap()[day]?.[hour] ?? 0;
    return n / this.hottest();
  }

  heatTitle(day: number, hour: number) {
    const n = this.heatmap()[day]?.[hour] ?? 0;
    return `${this.dayNames[day]} ${String(hour).padStart(2, '0')}:00 — ${n} view${n === 1 ? '' : 's'}`;
  }

  /* ── Small helpers the template leans on ── */

  /** `[key, count]` pairs, biggest first, for the bar lists. */
  named(key: string, take = 6): { key: string; n: number }[] {
    const raw = this.insights()?.[key];
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, take);
  }

  share(n: number, rows: { n: number }[]) {
    const total = rows.reduce((s, r) => s + r.n, 0);
    return total ? Math.round((n / total) * 100) : 0;
  }

  inr(v?: number | null) {
    return typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : '—';
  }

  shortDate(iso: string) {
    const d = new Date(iso);
    return isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  /** Progress of the builder pipeline, in the order a request moves through it. */
  readonly funnel = computed(() => {
    const by = this.builderStats()?.byStatus ?? {};
    const steps: [string, string][] = [
      ['submitted', 'Submitted'], ['approved', 'Approved'], ['quoted', 'Quoted'],
      ['accepted', 'Accepted'], ['paid', 'Paid'], ['building', 'Building'], ['live', 'Live'],
    ];
    const top = Math.max(1, ...steps.map(([k]) => by[k] ?? 0));
    return steps.map(([k, label]) => ({ key: k, label, n: by[k] ?? 0, pct: Math.round(((by[k] ?? 0) / top) * 100) }));
  });

  readonly growthClass = computed(() => {
    const g = this.insights()?.growthPct ?? 0;
    return g > 0 ? 'up' : g < 0 ? 'down' : 'flat';
  });

  /**
   * A short, human line auto-written from whatever stands out most right
   * now — traffic, a waiting approval, pipeline money — so the dashboard
   * opens with a sentence, not just numbers.
   */
  readonly insightLine = computed(() => {
    const g = this.insights()?.growthPct ?? 0;
    const live = this.insights()?.live?.count ?? 0;
    const pending = this.builderStats()?.byStatus?.['submitted'] ?? 0;
    const pipeline = this.builderStats()?.pipelineInr ?? 0;
    const bounce = this.insights()?.bounceRate ?? 0;

    if (live >= 3) return { tone: 'live', text: `${live} people are on the site right now — a good moment to check in on the chat.` };
    if (pending > 0) return { tone: 'warn', text: `${pending} new portfolio request${pending === 1 ? '' : 's'} waiting on your approval.` };
    if (g >= 15) return { tone: 'up', text: `Traffic is up ${g}% on last week — whatever you changed, it's working.` };
    if (g <= -15) return { tone: 'down', text: `Traffic has dropped ${Math.abs(g)}% from last week. Worth a look at what changed.` };
    if (pipeline > 0) return { tone: 'up', text: `₹${pipeline.toLocaleString('en-IN')} sitting in quoted and accepted requests — follow up to close it.` };
    if (bounce >= 70) return { tone: 'warn', text: `${bounce}% of visits leave after one page. The hero or load speed may be worth a look.` };
    return { tone: 'flat', text: `Everything is steady. ${this.insights()?.thisWeek ?? 0} visits this week.` };
  });

  /** Streak-style chip row summarising the week, for a quick scan. */
  readonly chips = computed<{ label: string; value: number; suffix?: string }[]>(() => {
    const i = this.insights();
    if (!i) return [];
    return [
      { label: 'Sessions', value: i.sessions ?? 0 },
      { label: 'Pages/session', value: i.pagesPerSession ?? 0 },
      { label: 'Bounce', value: i.bounceRate ?? 0, suffix: '%' },
    ];
  });
}
