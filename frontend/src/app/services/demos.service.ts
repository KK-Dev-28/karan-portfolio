import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Demo {
  id: number;
  title: string;
  description?: string;
  category: string;
  type: string; // image | video | file | link
  url: string;
  thumbnailUrl?: string;
  liveUrl?: string;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DemosService {
  private base = `${environment.apiUrl}/demos`;
  constructor(private http: HttpClient) {}

  getAll() { return this.http.get<Demo[]>(this.base); }
  getAllAdmin(token: string) {
    return this.http.get<Demo[]>(`${this.base}/all`, { headers: { Authorization: `Bearer ${token}` } });
  }
  create(token: string, body: Partial<Demo>) {
    return this.http.post<Demo>(this.base, body, { headers: { Authorization: `Bearer ${token}` } });
  }
  update(token: string, id: number, body: Partial<Demo>) {
    return this.http.patch<Demo>(`${this.base}/${id}`, body, { headers: { Authorization: `Bearer ${token}` } });
  }
  remove(token: string, id: number) {
    return this.http.delete(`${this.base}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  }
}
