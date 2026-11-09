// ─────────────────────────────────────────────────────────────────────────────
// src/app/services/visitor.service.ts   (v2.0 — consent-based)
// Nothing is sent to the server until the visitor opts in via the welcome card.
// Collected on opt-in: page, referrer, browser/OS, timezone, language, screen
// size, approximate city/country (from IP) and an optional name the visitor
// types in themselves. No fingerprinting, no precise GPS, no cross-site IDs.
// ─────────────────────────────────────────────────────────────────────────────
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const KEY = 'kk_visitor_v2';
interface Stored { consent: boolean; name?: string }

@Injectable({ providedIn: 'root' })
export class VisitorService {
  /** 'unknown' = not asked yet, so the welcome card shows. */
  readonly consent = signal<'unknown' | 'granted' | 'declined'>('unknown');
  readonly name = signal<string>('');
  private geo: any = null;
  private lastPage = '';

  constructor(private http: HttpClient) {
    const s = this.read();
    if (s) { this.consent.set(s.consent ? 'granted' : 'declined'); this.name.set(s.name || ''); }
  }

  accept(name?: string): void {
    const clean = (name || '').trim().slice(0, 60);
    this.name.set(clean);
    this.consent.set('granted');
    this.write({ consent: true, name: clean });
    if (this.lastPage) this.log(this.lastPage);
  }

  decline(): void {
    this.consent.set('declined');
    this.name.set('');
    this.write({ consent: false });
  }

  /** Lets a visitor withdraw consent any time from the footer. */
  reset(): void {
    try { localStorage.removeItem(KEY); } catch {}
    this.consent.set('unknown'); this.name.set('');
  }

  log(page: string): void {
    this.lastPage = page;
    if (this.consent() !== 'granted') return;

    const payload: any = {
      consent: true,
      page,
      referrer:  document.referrer || '',
      userAgent: navigator.userAgent,
      sessionId: this.session(),
      visitorName: this.name() || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
    };
    if (this.geo) { this.send({ ...payload, ...this.geo }); return; }
    this.http.get<any>('https://ipapi.co/json/').subscribe({
      next: g => {
        this.geo = {
          country: g.country_name || 'Unknown', city: g.city || 'Unknown',
          region: g.region || '', flag: this.flag(g.country_code || ''),
        };
        this.send({ ...payload, ...this.geo });
      },
      error: () => this.send(payload),
    });
  }

  private send(payload: any) {
    this.http.post(`${environment.apiUrl}/visitors/log`, payload).subscribe({
      error: err => {
        // An API still on v1 rejects the new v2 fields (forbidNonWhitelisted).
        // Resend with only the v1 fields so the visit is still recorded.
        if (err?.status !== 400) return;
        const { page, referrer, userAgent, sessionId, country, city, region, flag } = payload;
        this.http.post(`${environment.apiUrl}/visitors/log`,
          { page, referrer, userAgent, sessionId, country, city, region, flag }).subscribe({ error: () => {} });
      },
    });
  }

  private read(): Stored | null { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
  private write(s: Stored) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

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
