import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private base = `${environment.apiUrl}/site-content`;
  private cache$: Observable<Record<string, any>> | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Record<string, any>> {
    if (!this.cache$) {
      this.cache$ = this.http.get<Record<string, any>>(this.base).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  getSection(section: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${section}`);
  }

  updateSection(section: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${section}`, { data });
  }

  clearCache() {
    this.cache$ = null;
  }
}
