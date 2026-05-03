// ─────────────────────────────────────────────────────────────────────────────
// src/app/services/visitor.service.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  constructor(private http: HttpClient) {}

  log(page: string): void {
    const payload: any = {
      page,
      referrer:  document.referrer || '',
      userAgent: navigator.userAgent,
      sessionId: this.session(),
    };
    // Try geo first, fallback without it
    this.http.get<any>('https://ipapi.co/json/').subscribe({
      next: geo => {
        payload.country = geo.country_name || 'Unknown';
        payload.city    = geo.city         || 'Unknown';
        payload.region  = geo.region       || '';
        payload.flag    = this.flag(geo.country_code || '');
        this.send(payload);
      },
      error: () => this.send(payload),
    });
  }

  private send(payload: any) {
    this.http.post(`${environment.apiUrl}/visitors/log`, payload).subscribe();
  }

  private session(): string {
    let s = sessionStorage.getItem('kk_sid');
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('kk_sid', s); }
    return s;
  }

  private flag(code: string): string {
    if (!code) return '🌍';
    return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
  }
}
