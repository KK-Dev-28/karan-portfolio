import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, CheckoutTier, PaymentCatalog } from '../../services/payment.service';

@Component({
  selector: 'app-hire-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hire-pricing.component.html',
  styleUrls: ['./hire-pricing.component.scss'],
})
export class HirePricingComponent implements OnInit {
  catalog: PaymentCatalog | null = null;
  loadError = false;
  email = '';
  busyTier: CheckoutTier | null = null;
  checkoutError = '';

  constructor(private payments: PaymentService) {}

  ngOnInit() {
    this.payments.getCatalog().subscribe({
      next: (c) => (this.catalog = c),
      error: () => (this.loadError = true),
    });
  }

  formatMoney(cents: number, currency: string): string {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
    }
  }

  pay(tier: CheckoutTier) {
    this.checkoutError = '';
    this.busyTier = tier;
    const email = this.email.trim() || undefined;
    this.payments.createCheckout(tier, email).subscribe({
      next: (res) => {
        this.busyTier = null;
        if (res.url) window.location.href = res.url;
        else this.checkoutError = 'Checkout URL missing. Is Stripe configured on the server?';
      },
      error: (err) => {
        this.busyTier = null;
        const msg = err?.error?.message;
        this.checkoutError = Array.isArray(msg)
          ? msg.join(' ')
          : typeof msg === 'string'
            ? msg
            : 'Could not start checkout. Try again or use Contact.';
      },
    });
  }
}
