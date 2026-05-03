// ── project.service.ts ───────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Project {
  id: number; title: string; description: string;
  techStack: string[]; period: string; githubUrl: string;
  liveUrl: string; isFeatured: boolean; sortOrder: number; award: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}
  getAll(): Observable<Project[]>      { return this.http.get<Project[]>(`${environment.apiUrl}/projects`); }
  getFeatured(): Observable<Project[]> { return this.http.get<Project[]>(`${environment.apiUrl}/projects/featured`); }
}
