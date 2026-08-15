// ── demo-shop.service.ts ─────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ShopCategory { id: string; slug: string; name: string; }

export interface ShopProduct {
  id: string; slug: string; name: string; description: string;
  pricePaise: number; priceInr: number; priceLabel: string;
  stock: number; inStock: boolean; imageEmoji: string; rating: number;
}

export interface CartLine {
  productId: string; quantity: number; product: ShopProduct; lineTotalPaise: number;
}

export interface Cart { items: CartLine[]; totalPaise: number; count: number; }

export interface ShopOrder {
  id: string; reference: string; status: string; customerName: string;
  totalPaise: number; totalLabel: string; itemCount: number; placedAt: string;
  lines: { productId: string; name: string; unitPricePaise: number; quantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class DemoShopService {
  private base = `${environment.apiUrl}/shop`;

  /* The cart and order history belong to a browser, not an account — a visitor
     should reach checkout without signing up. The id is minted once and kept in
     localStorage so a reload does not silently empty their cart. */
  readonly sessionId = (() => {
    const key = 'demoShopSession';
    let id = localStorage.getItem(key);
    if (!id) { id = `shop-${crypto.randomUUID()}`; localStorage.setItem(key, id); }
    return id;
  })();

  constructor(private http: HttpClient) {}

  categories(): Observable<ShopCategory[]> {
    return this.http.get<ShopCategory[]>(`${this.base}/categories`);
  }

  products(category?: string): Observable<ShopProduct[]> {
    const q = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<ShopProduct[]>(`${this.base}/products${q}`);
  }

  cart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.base}/cart?sessionId=${this.sessionId}`);
  }

  addToCart(productId: string, quantity = 1): Observable<Cart> {
    return this.http.post<Cart>(`${this.base}/cart`, { productId, quantity, sessionId: this.sessionId });
  }

  setQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.base}/cart/${productId}`, { quantity, sessionId: this.sessionId });
  }

  checkout(customerName: string): Observable<ShopOrder> {
    return this.http.post<ShopOrder>(`${this.base}/checkout`, { customerName, sessionId: this.sessionId });
  }

  orders(): Observable<ShopOrder[]> {
    return this.http.get<ShopOrder[]>(`${this.base}/orders?sessionId=${this.sessionId}`);
  }

  advance(reference: string): Observable<ShopOrder> {
    return this.http.post<ShopOrder>(`${this.base}/orders/${reference}/advance`, {});
  }
}
