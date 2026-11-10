import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Review, ReviewsService } from '../../services/reviews.service';
import { McRevealDirective } from './mc-shared';

/** Figma "Creative · 06 Reviews" — the empty state until approved reviews exist. */
@Component({
  selector: 'mc-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="reviews" aria-labelledby="rev-title">
    <p class="mc-kicker">10 · Reviews</p>
    <h2 id="rev-title" class="mc-title">{{ reviews().length ? 'In their words' : 'Be the first to leave one' }}</h2>

    <div class="row">
      <div class="mc-card quote mc-holo" mcReveal>
        <ng-container *ngIf="current() as r; else empty">
          <div class="who"><span class="av">{{ r.name.charAt(0) }}</span><div><b>{{ r.name }}</b><small>{{ [r.role, r.company].filter(Boolean).join(', ') }}</small></div></div>
          <p class="mc-mono">{{ r.title }}</p>
          <blockquote>“{{ r.body }}”</blockquote>
          <p class="stars" [attr.aria-label]="r.rating + ' out of 5'">{{ '★'.repeat(r.rating) }}<span>{{ '★'.repeat(5 - r.rating) }}</span></p>
          <div class="pager" *ngIf="reviews().length > 1">
            <button *ngFor="let x of reviews(); let i = index" [class.on]="i === idx()" (click)="idx.set(i)" [attr.aria-label]="'Review ' + (i + 1)"></button>
          </div>
        </ng-container>
        <ng-template #empty>
          <div class="avs" aria-hidden="true"><span></span><span></span><span></span></div>
          <p class="mc-mono">No reviews yet</p>
          <blockquote class="big">Work with me and your words go here.</blockquote>
          <p class="stars" aria-hidden="true">★ ★ ★ ★ ★</p>
        </ng-template>
      </div>

      <form class="mc-card form" mcReveal (ngSubmit)="submit()" *ngIf="!sent(); else thanks">
        <div class="two">
          <label><span class="mc-label">Name</span><input class="mc-field" name="name" [(ngModel)]="f.name" required maxlength="80" placeholder="Your name"></label>
          <label><span class="mc-label">Email</span><input class="mc-field" name="email" type="email" [(ngModel)]="f.email" required placeholder="you@company.com"></label>
        </div>
        <label><span class="mc-label">Role / Company</span><input class="mc-field" name="rc" [(ngModel)]="roleCompany" maxlength="120" placeholder="e.g. CTO, Acme"></label>
        <label><span class="mc-label">Your review</span><textarea class="mc-field" name="body" [(ngModel)]="f.body" required maxlength="2000" placeholder="Tell the story…"></textarea></label>
        <div class="foot">
          <div class="rate" role="radiogroup" aria-label="Rating">
            <button type="button" *ngFor="let n of [1,2,3,4,5]" [class.on]="n <= f.rating" (click)="f.rating = n" [attr.aria-label]="n + ' stars'" role="radio" [attr.aria-checked]="f.rating === n">★</button>
          </div>
          <button class="mc-btn mc-btn--gold" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Submit review ↗' }}</button>
        </div>
        <p class="err" *ngIf="error()">{{ error() }}</p>
      </form>
      <ng-template #thanks><div class="mc-card form done"><p class="mc-mono">Received</p><p class="big">Thank you. It will show here once approved.</p></div></ng-template>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .row{display:grid;grid-template-columns:600fr 640fr;gap:40px;margin-top:62px}
    .quote,.form{padding:32px;box-sizing:border-box}
    .quote{min-height:430px;display:flex;flex-direction:column;overflow:hidden;
      background:radial-gradient(ellipse at 0% 100%,rgba(var(--accent-rgb),.14),transparent 60%),var(--card)}
    .avs{display:flex;gap:16px;margin:8px 0 36px}
    .avs span{width:44px;height:44px;border-radius:12px;border:1px dashed rgba(var(--accent-rgb),.5);background:var(--bg-2)}
    blockquote{margin:16px 0 0;font:400 24px/1.4 var(--font-display);color:var(--text)}
    .big{font:400 clamp(36px,3.6vw,50px)/1.05 var(--font-display);color:var(--text);margin:20px 0 0}
    .stars{margin:auto 0 0;padding-top:28px;font-size:26px;letter-spacing:6px;color:var(--accent-2)} .stars span{color:var(--border)}
    .who{display:flex;align-items:center;gap:14px;margin-bottom:22px}
    .who b{display:block;font:500 16px var(--font-body);color:var(--text)} .who small{color:var(--text-muted)}
    .av{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#e3b341;color:#14110a;font:400 24px var(--font-display)}
    .pager{display:flex;gap:8px;margin-top:18px}.pager button{width:22px;height:4px;border:0;border-radius:2px;background:var(--border);cursor:pointer}.pager .on{background:var(--accent)}
    .form{display:grid;gap:20px;align-content:start}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
    .rate button{border:0;background:none;font-size:24px;color:var(--border);cursor:pointer;padding:2px}
    .rate .on{color:var(--accent-2)}
    .form .mc-btn{min-width:180px;min-height:46px}
    .err{margin:0;color:var(--crimson);font-size:14px}
    .done{align-content:center}
    @media (max-width:900px){.row{grid-template-columns:1fr}.quote{min-height:0}.two{grid-template-columns:1fr}}
  `],
})
export class McReviewsComponent implements OnInit {
  private svc = inject(ReviewsService);
  readonly reviews = signal<Review[]>([]);
  readonly idx = signal(0);
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  f = { name: '', email: '', rating: 5, body: '' };
  roleCompany = '';

  current() { return this.reviews()[this.idx()] ?? null; }

  ngOnInit() {
    this.svc.getApproved().subscribe({ next: r => this.reviews.set(r ?? []), error: () => {} });
  }

  submit() {
    if (!this.f.name.trim() || !this.f.email.trim() || !this.f.body.trim()) { this.error.set('Name, email and a review are needed.'); return; }
    const [role, ...rest] = this.roleCompany.split(',');
    const title = this.f.body.trim().split(/\s+/).slice(0, 8).join(' ');
    this.busy.set(true); this.error.set('');
    this.svc.submit({ ...this.f, role: role?.trim() || undefined, company: rest.join(',').trim() || undefined, title }).subscribe({
      next: () => { this.busy.set(false); this.sent.set(true); },
      error: () => { this.busy.set(false); this.error.set('Could not submit right now. Please try again.'); },
    });
  }
}
