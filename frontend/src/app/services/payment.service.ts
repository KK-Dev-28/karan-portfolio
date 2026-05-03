import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CheckoutTier = 'starter' | 'standard' | 'enterprise';

export interface PaymentCatalog {
  currency: string;
  tiers: Array<{
    id: CheckoutTier;
    label: string;
    amountCents: number;
    description: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  getCatalog(): Observable<PaymentCatalog> {
    return this.http.get<PaymentCatalog>(`${environment.apiUrl}/payments/catalog`);
  }

  createCheckout(tier: CheckoutTier, customerEmail?: string): Observable<{ url: string | null; sessionId: string }> {
    return this.http.post<{ url: string | null; sessionId: string }>(`${environment.apiUrl}/payments/checkout`, {
      tier,
      customerEmail: customerEmail || undefined,
    });
  }
}
