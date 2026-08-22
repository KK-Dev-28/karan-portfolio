// ── demo-tasks.service.ts ────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface DemoTask {
  id: string;
  text: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  category: string;
  progress: number;
  completed: boolean;
  isStarred: boolean;
  dueDate: string | null;
  tags: string[];
  estimatedTime: number | null;
}

interface Session { token: string; user: { id: string; name: string; email: string }; }

@Injectable({ providedIn: 'root' })
export class DemoTasksService {
  private base = environment.apiUrl;
  private tokenKey = 'demoTasksToken';

  constructor(private http: HttpClient) {}

  private get token(): string | null { return localStorage.getItem(this.tokenKey); }

  /* The TaskFlow API is account-based, because it backs a real client that has
     login screens. A portfolio visitor should not have to invent a password to
     look at a board, so the page provisions a throwaway account on first visit
     and keeps its token in localStorage. Returning later reuses that token, so
     the board they left is the board they come back to. */
  private ensureSession(): Observable<string> {
    const existing = this.token;
    if (existing) return of(existing);

    const rand = crypto.randomUUID().slice(0, 12);
    return this.http.post<Session>(`${this.base}/users/register`, {
      name: 'Demo Visitor',
      email: `demo-${rand}@example.invalid`,
      password: crypto.randomUUID(),
    }).pipe(
      tap(s => localStorage.setItem(this.tokenKey, s.token)),
      switchMap(s => of(s.token)),
    );
  }

  private auth(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  list(): Observable<DemoTask[]> {
    return this.ensureSession().pipe(
      switchMap(t => this.http.get<DemoTask[]>(`${this.base}/todos`, this.auth(t))),
    );
  }

  create(body: Partial<DemoTask>): Observable<DemoTask> {
    return this.ensureSession().pipe(
      switchMap(t => this.http.post<DemoTask>(`${this.base}/todos`, body, this.auth(t))),
    );
  }

  update(id: string, body: Partial<DemoTask>): Observable<DemoTask> {
    return this.ensureSession().pipe(
      switchMap(t => this.http.put<DemoTask>(`${this.base}/todos/${id}`, body, this.auth(t))),
    );
  }

  remove(id: string): Observable<{ ok: boolean }> {
    return this.ensureSession().pipe(
      switchMap(t => this.http.delete<{ ok: boolean }>(`${this.base}/todos/${id}`, this.auth(t))),
    );
  }
}
