import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SectionReactions {
  likes: number;
  comments: { id: number; name: string; content: string; createdAt: string }[];
  hasLiked: boolean;
  commentCount: number;
}

@Injectable({ providedIn: 'root' })
export class ReactionsService {
  private base = `${environment.apiUrl}/reactions`;
  constructor(private http: HttpClient) {}

  getSection(section: string): Observable<SectionReactions> {
    return this.http.get<SectionReactions>(`${this.base}/${section}`);
  }

  getCounts(): Observable<Record<string, { likes: number; comments: number }>> {
    return this.http.get<any>(`${this.base}/counts`);
  }

  toggleLike(section: string): Observable<{ liked: boolean; likes: number }> {
    return this.http.post<any>(`${this.base}/like`, { section });
  }

  addComment(section: string, content: string, name?: string): Observable<any> {
    return this.http.post(`${this.base}/comment`, { section, content, name });
  }
}
