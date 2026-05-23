import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiToolsApiService } from '../../services/ai-tools.service';

type Step = 'email' | 'otp' | 'generate' | 'results';

interface Idea {
  title: string;
  hook: string;
  outline: string[];
  tags: string[];
}

@Component({
  selector: 'app-ai-tools-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-tools.page.html',
  styleUrls: ['./ai-tools.page.scss'],
})
export class AiToolsPageComponent {
  step: Step = 'email';

  email = '';
  otp = '';
  topic = '';

  ideas: Idea[] = [];
  remaining: number | null = null;

  loading = false;
  error = '';

  constructor(private api: AiToolsApiService) {}

  // ── Step 1: send OTP ─────────────────────────────────
  sendCode() {
    if (!this.email.trim()) return;
    this.loading = true;
    this.error = '';

    this.api.sendCode(this.email.trim().toLowerCase()).subscribe({
      next: () => {
        this.step = 'otp';
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractError(err);
        this.loading = false;
      },
    });
  }

  resendCode() {
    this.otp = '';
    this.sendCode();
  }

  // ── Step 2: verify OTP ───────────────────────────────
  verifyCode() {
    if (this.otp.trim().length !== 6) return;
    this.loading = true;
    this.error = '';

    this.api.verifyCode(this.email.trim().toLowerCase(), this.otp.trim()).subscribe({
      next: () => {
        this.api.getRemaining(this.email.trim().toLowerCase()).subscribe({
          next: (r) => { this.remaining = r.remaining; },
          error: () => {},
        });
        this.step = 'generate';
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractError(err);
        this.loading = false;
      },
    });
  }

  // ── Step 3: generate ideas ───────────────────────────
  generate() {
    if (this.topic.trim().length < 3 || this.loading) return;
    this.loading = true;
    this.error = '';

    this.api.generateIdeas(this.email.trim().toLowerCase(), this.topic.trim()).subscribe({
      next: (res) => {
        this.ideas = res.ideas;
        this.remaining = res.remaining;
        this.step = 'results';
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractError(err);
        this.loading = false;
      },
    });
  }

  generateAnother() {
    this.topic = '';
    this.ideas = [];
    this.error = '';
    this.step = 'generate';
  }

  startOver() {
    this.email = '';
    this.otp = '';
    this.topic = '';
    this.ideas = [];
    this.remaining = null;
    this.error = '';
    this.step = 'email';
  }

  private extractError(err: any): string {
    const msg = err?.error?.message;
    return Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.');
  }
}
