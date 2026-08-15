// ── demo-learning.service.ts ─────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CourseSummary {
  id: string; slug: string; title: string; summary: string;
  level: string; instructor: string; category: string;
  durationMinutes: number; chapterCount: number; topicCount: number;
}

export interface CourseTopic {
  id: string; title: string; body: string; minutes: number; completed: boolean;
}

export interface CourseChapter { id: string; title: string; topics: CourseTopic[]; }

export interface CourseDetail extends CourseSummary {
  enrolled: boolean; completedCount: number; totalTopics: number;
  chapters: CourseChapter[];
}

@Injectable({ providedIn: 'root' })
export class DemoLearningService {
  private base = `${environment.apiUrl}/lms`;

  /* Progress is tied to the browser rather than an account, so a visitor can
     tick topics off without being asked to register. Kept in localStorage so
     returning to the page keeps whatever they completed. */
  readonly sessionId = (() => {
    const key = 'demoLearningSession';
    let id = localStorage.getItem(key);
    if (!id) { id = `lms-${crypto.randomUUID()}`; localStorage.setItem(key, id); }
    return id;
  })();

  constructor(private http: HttpClient) {}

  courses(): Observable<CourseSummary[]> {
    return this.http.get<CourseSummary[]>(`${this.base}/courses`);
  }

  course(slug: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.base}/courses/${slug}?sessionId=${this.sessionId}`);
  }

  enroll(courseId: string): Observable<{ ok: boolean; alreadyEnrolled: boolean }> {
    return this.http.post<{ ok: boolean; alreadyEnrolled: boolean }>(
      `${this.base}/enrollments`, { courseId, sessionId: this.sessionId });
  }

  toggleTopic(topicId: string): Observable<{ ok: boolean; completed: boolean; completedCount: number }> {
    return this.http.post<{ ok: boolean; completed: boolean; completedCount: number }>(
      `${this.base}/progress`, { topicId, sessionId: this.sessionId });
  }
}
