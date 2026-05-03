import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('kk_token'));
  isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, { password }).pipe(
      tap(r => { localStorage.setItem('kk_token', r.access_token); this.loggedIn$.next(true); })
    );
  }

  logout() { localStorage.removeItem('kk_token'); this.loggedIn$.next(false); this.router.navigate(['/']); }
  getToken() { return localStorage.getItem('kk_token'); }
  isLoggedIn() { return this.loggedIn$.value; }
}
