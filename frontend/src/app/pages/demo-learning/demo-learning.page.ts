import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  DemoLearningService, CourseSummary, CourseDetail, CourseTopic,
} from '../../services/demo-learning.service';

@Component({
  selector: 'app-demo-learning-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './demo-learning.page.html',
  styleUrls: ['./demo-learning.page.scss'],
})
export class DemoLearningPageComponent implements OnInit {
  courses: CourseSummary[] = [];
  open: CourseDetail | null = null;

  loading = true;
  error = '';
  notice = '';

  constructor(private api: DemoLearningService) {}

  ngOnInit(): void {
    this.api.courses().subscribe({
      next: c => { this.courses = c; this.loading = false; },
      error: e => this.fail(e),
    });
  }

  openCourse(slug: string): void {
    this.clearMessages();
    this.api.course(slug).subscribe({
      next: c => {
        this.open = c;
        /* The detail panel renders below the catalogue, so without this the
           page looks unchanged on a long list. */
        setTimeout(() => document.getElementById('course-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
      },
      error: e => this.fail(e),
    });
  }

  close(): void { this.open = null; }

  enroll(course: CourseSummary, event: MouseEvent): void {
    event.stopPropagation();
    this.clearMessages();
    this.api.enroll(course.id).subscribe({
      next: r => {
        this.notice = r.alreadyEnrolled
          ? `You are already enrolled in ${course.title}.`
          : `Enrolled in ${course.title}.`;
        if (this.open?.id === course.id) this.refreshOpen();
      },
      error: e => this.fail(e),
    });
  }

  /* Ticking a topic enrols implicitly on the server, so the whole course is
     refetched rather than only flipping the checkbox — that keeps the progress
     bar and the enrolled flag honest. */
  toggle(topic: CourseTopic): void {
    if (!this.open) return;
    this.clearMessages();
    this.api.toggleTopic(topic.id).subscribe({
      next: () => this.refreshOpen(),
      error: e => this.fail(e),
    });
  }

  private refreshOpen(): void {
    if (!this.open) return;
    this.api.course(this.open.slug).subscribe({
      next: c => (this.open = c),
      error: e => this.fail(e),
    });
  }

  percent(c: CourseDetail): number {
    return c.totalTopics ? Math.round((c.completedCount / c.totalTopics) * 100) : 0;
  }

  private clearMessages(): void { this.error = ''; this.notice = ''; }

  private fail(e: any): void {
    this.loading = false;
    const msg = e?.error?.message;
    this.error = Array.isArray(msg) ? msg.join(', ') : (msg || 'Something went wrong. Is the API running?');
  }
}
