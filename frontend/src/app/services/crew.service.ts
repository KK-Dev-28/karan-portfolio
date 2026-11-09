import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CrewMember { email: string; name: string | null; topics: string[]; subscribed: boolean; since: string }

const TOKEN_KEY = 'kk_crew_token';

/** Visitor accounts ("mission crew"): email-code sign-in and update preferences. */
@Injectable({ providedIn: 'root' })
export class CrewService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/crew`;
  readonly member = signal<CrewMember | null>(null);

  private get token(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
  private headers() { return new HttpHeaders({ 'X-Crew-Token': this.token ?? '' }); }

  /** Restores the signed-in member on page load, if a token is stored. */
  restore() {
    if (!this.token) return;
    this.http.get<CrewMember>(`${this.base}/me`, { headers: this.headers() }).subscribe({
      next: m => this.member.set(m),
      error: () => this.forget(),
    });
  }

  start(email: string, name?: string) { return this.http.post<{ ok: boolean }>(`${this.base}/start`, { email, name: name || undefined }); }

  verify(email: string, code: string): Observable<{ token: string; member: CrewMember }> {
    return this.http.post<{ token: string; member: CrewMember }>(`${this.base}/verify`, { email, code }).pipe(
      tap(r => { try { localStorage.setItem(TOKEN_KEY, r.token); } catch {} this.member.set(r.member); }),
    );
  }

  update(patch: Partial<Pick<CrewMember, 'name' | 'topics' | 'subscribed'>>) {
    return this.http.patch<CrewMember>(`${this.base}/me`, patch, { headers: this.headers() }).pipe(tap(m => this.member.set(m)));
  }

  logout() {
    this.http.post(`${this.base}/logout`, {}, { headers: this.headers() }).subscribe({ error: () => {} });
    this.forget();
  }

  deleteAccount() {
    return this.http.delete(`${this.base}/me`, { headers: this.headers() }).pipe(tap(() => this.forget()));
  }

  // Admin
  private admin() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` }) }; }
  stats() { return this.http.get<{ total: number; crew: number; reachable: number; sending: boolean }>(`${this.base}/stats`, this.admin()); }
  broadcast(subject: string, body: string, topic?: string) {
    return this.http.post<{ queued: number }>(`${this.base}/broadcast`, { subject, body, topic: topic || undefined }, this.admin());
  }

  private forget() { try { localStorage.removeItem(TOKEN_KEY); } catch {} this.member.set(null); }
}
