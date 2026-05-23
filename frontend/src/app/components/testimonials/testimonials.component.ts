import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '../../services/reviews.service';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
})
export class TestimonialsComponent implements OnInit {
  items: any[] = [];

  constructor(private reviews: ReviewsService) {}

  ngOnInit() {
    this.reviews.getApproved().subscribe({ next: r => (this.items = r), error: () => {} });
  }

  stars(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  starsArr(n: number): number[] { return Array.from({ length: Math.max(0, Math.min(5, n)) }); }
}
