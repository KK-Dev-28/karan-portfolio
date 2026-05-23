import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ServiceOrderPayload {
  serviceType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  requirements: any;
}

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private base = `${environment.apiUrl}/service-orders`;

  constructor(private http: HttpClient) {}

  create(payload: ServiceOrderPayload) {
    return this.http.post<{ order: any; checkoutUrl?: string }>(this.base, payload);
  }

  getAll() {
    return this.http.get<any[]>(this.base);
  }

  updateStatus(id: number, status: string, adminNotes?: string) {
    return this.http.patch(`${this.base}/${id}/status`, { status, adminNotes });
  }
}
