import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalyzeResumeRequest {
  text: string;
  jobDescription?: string;
}

@Injectable({ providedIn: 'root' })
export class ResumeReviewService {
  constructor(private readonly http: HttpClient) {}

  analyze(body: AnalyzeResumeRequest): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${environment.apiUrl}/resume/analyze`, {
      text: body.text,
      jobDescription: body.jobDescription || undefined,
    });
  }
}
