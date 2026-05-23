import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Review {
  id: number;
  name: string;
  email: string;
  company?: string;
  role?: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  name: string;
  email: string;
  company?: string;
  role?: string;
  rating: number;
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private base = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getApproved() {
    return this.http.get<Review[]>(this.base);
  }

  getAll() {
    return this.http.get<Review[]>(`${this.base}/all`);
  }

  submit(payload: CreateReviewPayload) {
    return this.http.post<Review>(this.base, payload);
  }

  moderate(id: number, status: 'approved' | 'rejected') {
    return this.http.patch(`${this.base}/${id}/moderate`, { status });
  }

  remove(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
