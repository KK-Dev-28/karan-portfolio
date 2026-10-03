import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeneratedLayoutDto {
  id: string;
  label: string;
  blurb: string;
  tokens: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class LayoutsService {
  constructor(private http: HttpClient) {}

  /** Published layouts. Public — a visitor needs them to render their choice. */
  list(): Observable<GeneratedLayoutDto[]> {
    return this.http.get<GeneratedLayoutDto[]>(`${environment.apiUrl}/layouts`);
  }

  /** Produces a candidate without publishing it. Admin only. */
  generate(brief?: string): Observable<GeneratedLayoutDto> {
    return this.http.post<GeneratedLayoutDto>(`${environment.apiUrl}/layouts/generate`, { brief });
  }

  save(def: GeneratedLayoutDto): Observable<GeneratedLayoutDto> {
    return this.http.post<GeneratedLayoutDto>(`${environment.apiUrl}/layouts`, def);
  }

  remove(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/layouts/${id}`);
  }
}
