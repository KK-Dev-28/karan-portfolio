import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InsightsSubscriptionService } from '../../services/insights-subscription.service';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <div class="card">
        <h1>Visitor Logs Subscription</h1>
        <p class="sub">Buy access to detailed visitor analytics. Admin dashboard remains private.</p>

        <div class="price" *ngIf="catalog as c">
          {{ money(c.amountCents, c.currency) }} / {{ c.durationDays }} days
        </div>

        <label>Email</label>
        <input [(ngModel)]="email" type="email" placeholder="you@company.com" />

        <div class="row">
          <button (click)="buy()" [disabled]="busy">{{ busy ? 'Redirecting…' : 'Buy Access' }}</button>
          <button class="ghost" (click)="activateFromSession()" [disabled]="busy || !sessionId">Activate</button>
        </div>

        <div class="err" *ngIf="err">{{ err }}</div>
        <div class="ok" *ngIf="ok">{{ ok }}</div>

        <div class="result" *ngIf="analytics">
          <h2>Premium Analytics</h2>
          <p>Total visits: {{ analytics.stats?.total }}</p>
          <p>Today: {{ analytics.stats?.today }}</p>
          <p>Unique IPs: {{ analytics.stats?.unique }}</p>
        </div>

        <a routerLink="/">← Back to portfolio</a>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap { min-height: 100vh; background: #08090a; padding: 2rem; display: flex; align-items: center; justify-content: center; }
      .card { width: min(620px, 100%); border: 1px solid #1c1d21; background: #0f1012; padding: 2rem; }
      h1 { font-family: 'Syne', sans-serif; font-size: 1.5rem; color: #ecedf2; margin-bottom: .5rem; }
      .sub { color: #5e6070; font-size: .78rem; line-height: 1.7; margin-bottom: 1rem; }
      .price { color: #00e5a0; font-size: .85rem; margin-bottom: 1rem; }
      label { display:block; color:#5e6070; font-size:.62rem; letter-spacing:.1em; text-transform:uppercase; margin-bottom:.35rem; }
      input { width:100%; background:#08090a; border:1px solid #1c1d21; color:#ecedf2; padding:.7rem .9rem; margin-bottom:1rem; }
      .row { display:flex; gap:.6rem; margin-bottom:.8rem; flex-wrap:wrap; }
      button { border:none; background:#00e5a0; color:#000; padding:.65rem 1rem; font-family:inherit; cursor:pointer; }
      .ghost { background:transparent; color:#8a8c9e; border:1px solid #1c1d21; }
      .err { color:#ff6b6b; font-size:.72rem; margin-bottom:.5rem; }
      .ok { color:#00e5a0; font-size:.72rem; margin-bottom:.5rem; }
      .result { border:1px solid #1c1d21; background:#08090a; padding:1rem; margin:1rem 0; }
      .result h2 { font-size:.9rem; margin-bottom:.6rem; color:#ecedf2; }
      .result p { font-size:.72rem; color:#8a8c9e; margin-bottom:.2rem; }
      a { color:#00e5a0; text-decoration:none; font-size:.72rem; }
    `,
  ],
})
export class InsightsPageComponent implements OnInit {
  email = '';
  sessionId: string | null = null;
  busy = false;
  err = '';
  ok = '';
  catalog: { currency: string; amountCents: number; durationDays: number; name: string } | null = null;
  analytics: any = null;

  constructor(private route: ActivatedRoute, private insights: InsightsSubscriptionService) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const qEmail = this.route.snapshot.queryParamMap.get('email');
    if (qEmail) this.email = qEmail;
    const existing = localStorage.getItem('insights_access_token');
    if (existing) this.fetch(existing);
    this.insights.getCatalog().subscribe({ next: (c) => (this.catalog = c) });
  }

  money(cents: number, currency: string): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  }

  buy() {
    if (!this.email.trim()) return;
    this.busy = true;
    this.err = '';
    this.insights.createCheckout(this.email.trim()).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.url) window.location.href = res.url;
      },
      error: () => {
        this.busy = false;
        this.err = 'Could not start checkout.';
      },
    });
  }

  activateFromSession() {
    if (!this.sessionId) return;
    this.busy = true;
    this.err = '';
    this.ok = '';
    this.insights.activate(this.sessionId, this.email.trim() || undefined).subscribe({
      next: (res) => {
        this.busy = false;
        localStorage.setItem('insights_access_token', res.accessToken);
        this.ok = 'Access activated. Loading analytics...';
        this.fetch(res.accessToken);
      },
      error: () => {
        this.busy = false;
        this.err = 'Activation failed. Ensure payment is completed.';
      },
    });
  }

  fetch(token: string) {
    this.insights.getPremiumAnalytics(token).subscribe({
      next: (data) => (this.analytics = data),
      error: () => {
        this.err = 'Token invalid or expired. Purchase again.';
        localStorage.removeItem('insights_access_token');
      },
    });
  }
}
