import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/sessions`);
  }

  checkout(dto: { sessionType: string; name: string; email: string; phone?: string; message?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/checkout`, dto);
  }

  verify(dto: { bookingId: number; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/verify`, dto);
  }

  getAll(token: string): Observable<any[]> {
    return this.http.get<any[]>(this.base, { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) });
  }

  updateStatus(token: string, id: number, status: string, adminNotes?: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}`, { status, adminNotes }, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }
}
