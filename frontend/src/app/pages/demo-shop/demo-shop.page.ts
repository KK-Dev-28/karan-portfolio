import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  DemoShopService, ShopCategory, ShopProduct, Cart, ShopOrder,
} from '../../services/demo-shop.service';

@Component({
  selector: 'app-demo-shop-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demo-shop.page.html',
  styleUrls: ['./demo-shop.page.scss'],
})
export class DemoShopPageComponent implements OnInit {
  categories: ShopCategory[] = [];
  products: ShopProduct[] = [];
  cart: Cart = { items: [], totalPaise: 0, count: 0 };
  orders: ShopOrder[] = [];

  activeCategory = 'all';
  customerName = '';
  loading = true;
  error = '';
  notice = '';
  /* Tracks the product mid-request so only that button shows a pending state
     rather than the whole grid greying out. */
  busyProductId = '';

  constructor(private api: DemoShopService) {}

  ngOnInit(): void {
    this.api.categories().subscribe({
      next: c => (this.categories = c),
      error: () => {},
    });
    this.reload();
  }

  private reload(): void {
    this.loading = true;
    this.api.products(this.activeCategory).subscribe({
      next: p => { this.products = p; this.loading = false; },
      error: e => this.fail(e),
    });
    this.refreshCart();
    this.refreshOrders();
  }

  private refreshCart(): void {
    this.api.cart().subscribe({ next: c => (this.cart = c), error: e => this.fail(e) });
  }

  private refreshOrders(): void {
    this.api.orders().subscribe({ next: o => (this.orders = o), error: () => {} });
  }

  selectCategory(slug: string): void {
    this.activeCategory = slug;
    this.loading = true;
    this.api.products(slug).subscribe({
      next: p => { this.products = p; this.loading = false; },
      error: e => this.fail(e),
    });
  }

  add(p: ShopProduct): void {
    this.clearMessages();
    this.busyProductId = p.id;
    this.api.addToCart(p.id).subscribe({
      next: c => { this.cart = c; this.busyProductId = ''; },
      error: e => { this.busyProductId = ''; this.fail(e); },
    });
  }

  setQty(productId: string, quantity: number): void {
    if (quantity < 0) return;
    this.clearMessages();
    this.api.setQuantity(productId, quantity).subscribe({
      next: c => (this.cart = c),
      error: e => this.fail(e),
    });
  }

  checkout(): void {
    this.clearMessages();
    this.api.checkout(this.customerName || 'Guest').subscribe({
      next: order => {
        this.notice = `Order ${order.reference} placed — ${order.totalLabel}`;
        this.customerName = '';
        this.refreshCart();
        this.refreshOrders();
        /* Stock changed as part of checkout, so the grid is refetched rather
           than adjusted locally — the server stays the single source of truth. */
        this.api.products(this.activeCategory).subscribe(p => (this.products = p));
      },
      error: e => this.fail(e),
    });
  }

  advance(order: ShopOrder): void {
    this.clearMessages();
    this.api.advance(order.reference).subscribe({
      next: () => this.refreshOrders(),
      error: e => this.fail(e),
    });
  }

  canAdvance(status: string): boolean {
    return status === 'pending' || status === 'approved';
  }

  inr(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private clearMessages(): void { this.error = ''; this.notice = ''; }

  /* The API answers a rejected checkout with a specific reason — out of stock,
     empty cart — so surface that rather than a generic failure. */
  private fail(e: any): void {
    this.loading = false;
    const msg = e?.error?.message;
    this.error = Array.isArray(msg) ? msg.join(', ') : (msg || 'Something went wrong. Is the API running?');
  }
}
