import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  constructor(private http: HttpClient) {}

  subscribe(email: string, source = 'footer'): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${environment.apiUrl}/newsletter/subscribe`, {
      email,
      source,
    });
  }
}
