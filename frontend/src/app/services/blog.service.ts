import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const JWT_KEY = 'blog_jwt';

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private base = `${environment.apiUrl}/blog`;

  constructor(private http: HttpClient) {}

  // ── Token helpers ──────────────────────────────────
  getToken(): string | null { return localStorage.getItem(JWT_KEY); }
  saveToken(t: string)      { localStorage.setItem(JWT_KEY, t); }
  clearToken()              { localStorage.removeItem(JWT_KEY); }
  isLoggedIn(): boolean     { return !!this.getToken(); }

  private authHeader(): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken() ?? ''}` }) };
  }

  // ── Public ──────────────────────────────────────────
  getAccessInfo()                    { return this.http.get<any>(`${this.base}/access-info`); }
  getPosts(page = 1)                 { return this.http.get<any>(`${this.base}/posts?page=${page}`); }
  getPost(slug: string)              { return this.http.get<any>(`${this.base}/posts/${slug}`); }
  getProfile(username: string)       { return this.http.get<any>(`${this.base}/u/${username}`); }
  getUserPosts(username: string)     { return this.http.get<any[]>(`${this.base}/u/${username}/posts`); }

  // ── Payment ─────────────────────────────────────────
  checkout(name: string, email: string) { return this.http.post<any>(`${this.base}/checkout`, { name, email }); }
  verify(body: any)                     { return this.http.post<any>(`${this.base}/verify`, body); }

  // ── Auth ─────────────────────────────────────────────
  register(body: any): Observable<{ token: string; user: any }> { return this.http.post<any>(`${this.base}/auth/register`, body); }
  registerFree(body: { email: string; username: string; name: string; password: string }): Observable<{ token: string; user: any }> {
    return this.http.post<any>(`${this.base}/auth/register-free`, body);
  }
  login(email: string, password: string): Observable<{ token: string; user: any }> { return this.http.post<any>(`${this.base}/auth/login`, { email, password }); }
  getMe(): Observable<any>                    { return this.http.get<any>(`${this.base}/auth/me`, this.authHeader()); }
  updateMe(body: any): Observable<any>        { return this.http.patch<any>(`${this.base}/auth/me`, body, this.authHeader()); }

  // ── AI ───────────────────────────────────────────────
  aiGenerate(prompt: string, tone: string, length: string): Observable<any> {
    return this.http.post<any>(`${this.base}/ai/generate`, { prompt, tone, length }, this.authHeader());
  }

  // ── Writer ────────────────────────────────────────────
  getMyPosts(): Observable<any[]>              { return this.http.get<any[]>(`${this.base}/mine`, this.authHeader()); }
  createPost(dto: any): Observable<any>        { return this.http.post<any>(`${this.base}/posts`, dto, this.authHeader()); }
  updatePost(id: number, dto: any): Observable<any> { return this.http.patch<any>(`${this.base}/posts/${id}`, dto, this.authHeader()); }
  deletePost(id: number): Observable<any>      { return this.http.delete<any>(`${this.base}/posts/${id}`, this.authHeader()); }
}
