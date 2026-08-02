import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CheckoutTier = 'starter' | 'standard' | 'enterprise';

export interface RazorpayOrder {
  orderId:  string;
  amount:   number;
  currency: string;
  keyId:    string;
  name:     string;
  email:    string;
}

export interface PaymentCatalog {
  currency: string;
  tiers: Array<{
    id: CheckoutTier;
    label: string;
    amountPaise: number;
    description: string;
  }>;
}

declare const Razorpay: any;

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiUrl}/payments`;
  /** Shared across calls so a second checkout reuses the first load. */
  private razorpayLoad?: Promise<void>;

  constructor(private http: HttpClient) {}

  getCatalog(): Observable<PaymentCatalog> {
    return this.http.get<PaymentCatalog>(`${this.base}/catalog`);
  }

  createOrder(tier: CheckoutTier, customerEmail?: string, customerName?: string, customerPhone?: string): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.base}/checkout`, { tier, customerEmail, customerName, customerPhone });
  }

  verifyPayment(orderId: string, paymentId: string, signature: string, customerName?: string, customerPhone?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.base}/verify`, { orderId, paymentId, signature, customerName, customerPhone });
  }

  createInsightsOrder(email: string): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.base}/insights/checkout`, { email });
  }

  verifyInsightsPayment(orderId: string, paymentId: string, signature: string, email: string) {
    return this.http.post(`${this.base}/insights/verify`, { orderId, paymentId, signature, email });
  }

  // ── Admin approval actions ───────────────────────────────────────────────

  getPendingApprovals(token: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/pending-approvals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  approvePayment(token: string, id: number, adminNote?: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/approve`, { adminNote }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  rejectPayment(token: string, id: number, reason: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/reject`, { reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  requestInfo(token: string, id: number, message: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/request-info`, { message }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  snoozePayment(token: string, id: number, hours: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/snooze`, { hours }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createPaymentLink(token: string, body: { amount: number; description: string; customerName: string; customerEmail: string; customerPhone?: string }): Observable<{ url: string; id: string; amount: number }> {
    return this.http.post<any>(`${this.base}/create-link`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── Razorpay modal ───────────────────────────────────────────────────────

  /**
   * Fetches the Razorpay checkout SDK the first time a payment is started.
   *
   * It used to be a `<script defer>` in index.html, which cost every visitor a
   * third-party request on every page even though only a handful ever open
   * checkout. Resolves immediately if the SDK is already present.
   */
  private loadRazorpay(): Promise<void> {
    if (typeof Razorpay !== 'undefined') return Promise.resolve();
    if (this.razorpayLoad) return this.razorpayLoad;

    this.razorpayLoad = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SRC}"]`);
      const script = existing ?? document.createElement('script');
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => {
        // Let a later attempt retry rather than caching the failure forever.
        this.razorpayLoad = undefined;
        reject(new Error('Failed to load the Razorpay checkout script.'));
      });
      if (!existing) {
        script.src = RAZORPAY_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    });
    return this.razorpayLoad;
  }

  /**
   * Opens the Razorpay modal. Returns a promise that rejects if the SDK could
   * not be fetched; `onDismiss` still runs so callers can clear their busy
   * state either way.
   */
  async openCheckout(
    order: RazorpayOrder,
    customerName: string,
    customerPhone: string,
    onSuccess: (paymentId: string, orderId: string, signature: string) => void,
    onDismiss?: () => void,
  ): Promise<void> {
    try {
      await this.loadRazorpay();
    } catch (err) {
      if (onDismiss) onDismiss();
      throw err;
    }

    const options = {
      key:         order.keyId,
      amount:      order.amount,
      currency:    order.currency,
      name:        'Karan Kapoor',
      description: order.name,
      order_id:    order.orderId,
      prefill:     { name: customerName, email: order.email, contact: customerPhone },
      theme:       { color: '#f59e0b' },
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
      },
      modal: {
        ondismiss: () => { if (onDismiss) onDismiss(); },
      },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
}
