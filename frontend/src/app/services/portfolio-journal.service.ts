import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PortfolioJournalEntry {
  id: number;
  kind: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalPayload {
  kind: 'achievement' | 'learning' | 'milestone' | 'note';
  title: string;
  body: string;
  linkUrl?: string;
  isPublished?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PortfolioJournalService {
  constructor(private http: HttpClient) {}

  getPublished(): Observable<PortfolioJournalEntry[]> {
    return this.http.get<PortfolioJournalEntry[]>(`${environment.apiUrl}/updates`);
  }

  create(payload: CreateJournalPayload): Observable<PortfolioJournalEntry> {
    return this.http.post<PortfolioJournalEntry>(`${environment.apiUrl}/updates`, payload);
  }

  patch(id: number, payload: Partial<CreateJournalPayload> & { isPublished?: boolean }): Observable<PortfolioJournalEntry> {
    return this.http.patch<PortfolioJournalEntry>(`${environment.apiUrl}/updates/${id}`, payload);
  }

  remove(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/updates/${id}`);
  }
}
