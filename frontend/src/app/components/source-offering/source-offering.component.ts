import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-source-offering',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-offering.component.html',
  styleUrl: './source-offering.component.scss',
})
export class SourceOfferingComponent {
  step = 0;

  answers: Record<string, string> = {
    purpose: '',
    stack: '',
    timeline: '',
    level: '',
  };

  questions = [
    {
      key: 'purpose',
      label: 'What do you want to build?',
      options: ['A personal portfolio', 'A client/business site', 'Learning & inspiration', 'SaaS / product'],
    },
    {
      key: 'stack',
      label: 'Which stack are you comfortable with?',
      options: ['Angular / TypeScript', '.NET / C#', 'React / Next.js', 'Other / Not sure'],
    },
    {
      key: 'timeline',
      label: 'When do you need this?',
      options: ['Immediately', 'Within a week', 'Within a month', 'Just exploring'],
    },
    {
      key: 'level',
      label: 'Your experience level?',
      options: ['Beginner', 'Intermediate', 'Senior', 'Team / Agency'],
    },
  ];

  get currentQ() { return this.questions[this.step]; }
  get allAnswered() { return this.questions.every(q => this.answers[q.key]); }

  select(value: string) {
    this.answers[this.currentQ.key] = value;
    if (this.step < this.questions.length - 1) {
      setTimeout(() => this.step++, 180);
    }
  }

  get waMessage(): string {
    const lines = [
      `Hi Karan, I'm interested in getting the portfolio source code.`,
      `Purpose: ${this.answers['purpose'] || '—'}`,
      `Stack: ${this.answers['stack'] || '—'}`,
      `Timeline: ${this.answers['timeline'] || '—'}`,
      `Level: ${this.answers['level'] || '—'}`,
      `Let's discuss how you can help me.`,
    ];
    return encodeURIComponent(lines.join('\n'));
  }

  get waUrl(): string {
    return `/api/wa?text=${this.waMessage}`;
  }

  restart() {
    this.answers = { purpose: '', stack: '', timeline: '', level: '' };
    this.step = 0;
  }
}
