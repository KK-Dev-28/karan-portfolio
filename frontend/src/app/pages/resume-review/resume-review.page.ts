import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ResumeReviewService } from '../../services/resume-review.service';

@Component({
  selector: 'app-resume-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resume-review.page.html',
  styleUrl: './resume-review.page.scss',
})
export class ResumeReviewPageComponent {
  resumeText = '';
  jobText = '';
  busy = false;
  error = '';
  resultJson = '';

  constructor(private readonly resumeApi: ResumeReviewService) {}

  run() {
    this.error = '';
    this.resultJson = '';
    const t = this.resumeText.trim();
    if (t.length < 10) {
      this.error = 'Paste at least a short resume excerpt (10+ characters).';
      return;
    }
    this.busy = true;
    this.resumeApi
      .analyze({
        text: t,
        jobDescription: this.jobText.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.busy = false;
          this.resultJson = JSON.stringify(data, null, 2);
        },
        error: (err) => {
          this.busy = false;
          const msg = err?.error?.message;
          this.error =
            typeof msg === 'string'
              ? msg
              : 'Request failed. Is the API running with RESUME_SERVICE_URL and the Python service on port 8010?';
        },
      });
  }
}
