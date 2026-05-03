import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="card">
        <div class="icon">×</div>
        <h1>Checkout cancelled</h1>
        <p>No charge was made. If you still want to move forward, pick a tier on the homepage or reach out via Contact.</p>
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
        background: rgba(255, 107, 107, 0.12);
        color: #ff6b6b;
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
export class PaymentCancelPageComponent {}
