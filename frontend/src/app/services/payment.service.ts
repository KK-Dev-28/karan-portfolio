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

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiUrl}/payments`;
  constructor(private http: HttpClient) {}

  getCatalog(): Observable<PaymentCatalog> {
    return this.http.get<PaymentCatalog>(`${this.base}/catalog`);
  }

  createOrder(tier: CheckoutTier, customerEmail?: string): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.base}/checkout`, { tier, customerEmail });
  }

  verifyPayment(orderId: string, paymentId: string, signature: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/verify`, { orderId, paymentId, signature });
  }

  createInsightsOrder(email: string): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.base}/insights/checkout`, { email });
  }

  verifyInsightsPayment(orderId: string, paymentId: string, signature: string, email: string) {
    return this.http.post(`${this.base}/insights/verify`, { orderId, paymentId, signature, email });
  }

  openCheckout(order: RazorpayOrder, onSuccess: (paymentId: string, orderId: string, signature: string) => void, onDismiss?: () => void) {
    const options = {
      key:         order.keyId,
      amount:      order.amount,
      currency:    order.currency,
      name:        'Karan Kapoor',
      description: order.name,
      order_id:    order.orderId,
      prefill:     { email: order.email },
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
