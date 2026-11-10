import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Stats {
  totalVisits: number; uniqueVisitors: number; countries: number; thisWeek: number;
  topCountries: { country: string; flag: string; count: number }[];
  devices: { key: string; count: number }[];
  daily: { date: string; count: number }[];
}

/** Public "popularity" panel. Shows aggregate numbers only, never who visited. */
@Component({
  selector: 'app-popularity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <section class="pop" *ngIf="s() as s" aria-labelledby="pop-title">
    <p class="pop-kicker"><span class="live"></span>LIVE · WHO'S LOOKING</p>
    <h2 id="pop-title">Seen from <em>{{ s.countries }} countries</em> and counting.</h2>

    <div class="pop-grid">
      <div class="pop-card" *ngFor="let k of kpis(s)" (pointermove)="spot($event)">
        <span class="pop-num">{{ k.v * t() | number:'1.0-0' }}</span><span class="pop-lbl">{{ k.l }}</span>
      </div>
    </div>

    <div class="pop-split">
      <div class="pop-panel">
        <p class="pop-ph">Top countries</p>
        <div class="bar-row" *ngFor="let c of s.topCountries">
          <span class="bar-name">{{ c.flag }} {{ c.country }}</span>
          <span class="bar"><i [style.width.%]="c.count / s.topCountries[0].count * 100"></i></span>
          <span class="bar-n">{{ c.count }}</span>
        </div>
      </div>
      <div class="pop-panel">
        <p class="pop-ph">Last 7 days</p>
        <div class="spark">
          <div class="sp-col" *ngFor="let d of s.daily" [attr.title]="d.date + ': ' + d.count">
            <i [style.height.%]="max(s) ? d.count / max(s) * 100 : 0"></i>
            <span>{{ day(d.date) }}</span>
          </div>
        </div>
        <p class="pop-dev"><span *ngFor="let d of s.devices">{{ d.key }} {{ pct(d.count, s.totalVisits) }}%</span></p>
      </div>
    </div>
    <p class="pop-note">New visits are counted only when a visitor says yes to the welcome card. Only totals are shown here, never who visited.</p>
  </section>
  `,
  styleUrls: ['./popularity.component.scss'],
})
export class PopularityComponent implements OnInit {
  private http = inject(HttpClient);
  readonly s = signal<Stats | null>(null);

  ngOnInit() {
    this.http.get<Stats>(`${environment.apiUrl}/visitors/public-stats`)
      .subscribe({ next: s => { if (s?.totalVisits) { this.s.set(s); this.countUp(); } }, error: () => {} });
  }

  /** 0 → 1 over ~1.2s with ease-out, so the KPI numbers count up on load. */
  readonly t = signal(1);
  private countUp() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      this.t.set(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    this.t.set(0); requestAnimationFrame(step);
  }

  /** Moves the card's accent spotlight to the pointer. */
  spot(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
  kpis(s: Stats) {
    return [{ v: s.totalVisits, l: 'total visits' }, { v: s.uniqueVisitors, l: 'unique visitors' },
            { v: s.thisWeek, l: 'this week' }, { v: s.countries, l: 'countries' }];
  }
  max(s: Stats) { return Math.max(...s.daily.map(d => d.count)); }
  // Parse as local midnight; a bare YYYY-MM-DD is UTC and shows the previous day west of GMT.
  day(d: string) { return new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2); }
  pct(n: number, t: number) { return t ? Math.round(n / t * 100) : 0; }
}
