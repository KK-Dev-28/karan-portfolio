import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'kk_token';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload?.role !== 'admin') return false;
    if (!payload?.exp) return false;
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(isTokenValid(localStorage.getItem(TOKEN_KEY)));
  isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, { password }).pipe(
      tap(r => {
        localStorage.setItem(TOKEN_KEY, r.access_token);
        this.loggedIn$.next(true);
      }),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!isTokenValid(token)) {
      localStorage.removeItem(TOKEN_KEY);
      this.loggedIn$.next(false);
      return null;
    }
    return token;
  }

  isLoggedIn(): boolean { return this.loggedIn$.value; }
}
