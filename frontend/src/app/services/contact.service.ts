import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactPayload { name: string; email: string; phone?: string; subject: string; message: string; }

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient) {}
  send(p: ContactPayload): Observable<any>   { return this.http.post(`${environment.apiUrl}/contact`, p); }
  getAll(): Observable<any[]>                { return this.http.get<any[]>(`${environment.apiUrl}/contact`); }
  markRead(id: number): Observable<any>      { return this.http.patch(`${environment.apiUrl}/contact/${id}/read`, {}); }
}
