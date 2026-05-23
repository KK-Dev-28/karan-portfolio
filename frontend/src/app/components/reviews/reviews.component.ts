import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService } from '../../services/reviews.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
})
export class ReviewsComponent {
  form = { name: '', email: '', company: '', role: '', rating: 5, title: '', body: '' };
  hover = 0;
  busy = false;
  success = false;
  error = '';

  constructor(private reviewSvc: ReviewsService) {}

  setRating(n: number) { this.form.rating = n; }
  setHover(n: number) { this.hover = n; }

  effectiveRating(): number { return this.hover || this.form.rating; }

  submit() {
    if (!this.form.name || !this.form.email || !this.form.title || !this.form.body) return;
    this.busy = true;
    this.error = '';
    this.reviewSvc.submit(this.form).subscribe({
      next: () => {
        this.busy = false;
        this.success = true;
      },
      error: () => {
        this.busy = false;
        this.error = 'Could not submit review. Please try again.';
      },
    });
  }
}
