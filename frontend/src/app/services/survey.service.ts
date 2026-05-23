import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private base = `${environment.apiUrl}/surveys`;

  constructor(private http: HttpClient) {}

  getActive() {
    return this.http.get<any[]>(`${this.base}/active`);
  }

  getBySlug(slug: string) {
    return this.http.get<any>(`${this.base}/slug/${slug}`);
  }

  respond(id: number, answers: Record<string, any>, respondentEmail?: string, respondentName?: string) {
    return this.http.post(`${this.base}/${id}/respond`, { answers, respondentEmail, respondentName });
  }

  // Admin
  getAll() { return this.http.get<any[]>(this.base); }
  create(data: any) { return this.http.post<any>(this.base, data); }
  update(id: number, data: any) { return this.http.patch<any>(`${this.base}/${id}`, data); }
  remove(id: number) { return this.http.delete(`${this.base}/${id}`); }
  getResponses(id: number) { return this.http.get<any[]>(`${this.base}/${id}/responses`); }
}
