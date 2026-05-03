import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wrap">
      <div class="card">
        <div class="icon">✓</div>
        <h1>Payment received</h1>
        <p>Thanks — Stripe confirmed this session. You will get a receipt by email if one was provided.</p>
        <p class="meta" *ngIf="sessionId">Session: {{ sessionId }}</p>
        <a routerLink="/">← Back to portfolio</a>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: #08090a;
      }
      .card {
        max-width: 28rem;
        border: 1px solid #1c1d21;
        background: #0f1012;
        padding: 2.5rem;
        text-align: center;
      }
      .icon {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: rgba(0, 229, 160, 0.15);
        color: #00e5a0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        margin: 0 auto 1.5rem;
      }
      h1 {
        font-family: 'Syne', sans-serif;
        font-size: 1.5rem;
        color: #ecedf2;
        margin-bottom: 1rem;
      }
      p {
        font-size: 0.78rem;
        color: #5e6070;
        line-height: 1.75;
        margin-bottom: 0.75rem;
      }
      .meta {
        font-size: 0.65rem;
        color: #4a4c56;
        word-break: break-all;
      }
      a {
        display: inline-block;
        margin-top: 1.5rem;
        font-size: 0.72rem;
        color: #00e5a0;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class PaymentSuccessPageComponent implements OnInit {
  sessionId: string | null = null;
  constructor(private route: ActivatedRoute) {}
  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
  }
}
