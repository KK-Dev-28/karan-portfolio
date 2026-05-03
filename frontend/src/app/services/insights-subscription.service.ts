import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InsightsSubscriptionService {
  constructor(private http: HttpClient) {}

  getCatalog(): Observable<{ currency: string; amountCents: number; durationDays: number; name: string }> {
    return this.http.get<{ currency: string; amountCents: number; durationDays: number; name: string }>(
      `${environment.apiUrl}/payments/insights/catalog`,
    );
  }

  createCheckout(email: string): Observable<{ url: string | null; sessionId: string }> {
    return this.http.post<{ url: string | null; sessionId: string }>(
      `${environment.apiUrl}/payments/insights/checkout`,
      { email },
    );
  }

  activate(sessionId: string, email?: string): Observable<{ accessToken: string; expiresAt: string; email: string }> {
    return this.http.post<{ accessToken: string; expiresAt: string; email: string }>(
      `${environment.apiUrl}/payments/insights/activate`,
      { sessionId, email },
    );
  }

  getPremiumAnalytics(accessToken: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/visitors/premium-analytics`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    });
  }
}
