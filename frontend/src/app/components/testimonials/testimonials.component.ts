import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
})
export class TestimonialsComponent {
  items = [
    {
      quote:
        'Clear communication, solid architecture, and shipping velocity we could rely on through a tight launch window.',
      name: 'Product lead',
      org: 'B2B SaaS',
      rating: 5,
    },
    {
      quote:
        'Production-grade NestJS and Angular work — documentation and handoff were as good as the code.',
      name: 'Engineering manager',
      org: 'Fintech',
      rating: 5,
    },
    {
      quote:
        'From schema design to admin analytics, the full stack felt cohesive. Exactly what we needed for v1.',
      name: 'Founder',
      org: 'Startup',
      rating: 5,
    },
  ];
}
