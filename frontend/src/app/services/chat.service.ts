import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = `${environment.apiUrl}/chat`;
  private status$?: Observable<boolean>;

  constructor(private http: HttpClient) {}

  /** True when the backend has an API key configured. Cached — the answer
   *  can't change without a redeploy, and the launcher asks on every load. */
  isAvailable(): Observable<boolean> {
    if (!this.status$) {
      this.status$ = this.http.get<{ available: boolean }>(`${this.base}/status`).pipe(
        map(r => !!r?.available),
        catchError(() => of(false)),
        shareReplay(1),
      );
    }
    return this.status$;
  }

  /** Sends the whole visible conversation — the API is stateless, so history
   *  is what gives the assistant continuity between turns. */
  ask(messages: ChatTurn[]): Observable<string> {
    return this.http.post<{ reply: string }>(this.base, { messages }).pipe(
      map(r => r?.reply?.trim() || ''),
    );
  }
}
