import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../services/newsletter.service';

@Component({
  selector: 'app-newsletter-strip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-strip.component.html',
  styleUrls: ['./newsletter-strip.component.scss'],
})
export class NewsletterStripComponent {
  email = '';
  loading = false;
  message = '';
  ok = false;

  constructor(private newsletter: NewsletterService) {}

  submit() {
    const e = this.email.trim();
    if (!e) return;
    this.loading = true;
    this.message = '';
    this.ok = false;
    this.newsletter.subscribe(e, 'home-strip').subscribe({
      next: (r) => {
        this.loading = false;
        this.ok = r.ok;
        this.message = r.message;
        if (r.ok) this.email = '';
      },
      error: () => {
        this.loading = false;
        this.message = 'Something went wrong. Try again later.';
      },
    });
  }
}
