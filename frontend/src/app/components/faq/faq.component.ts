import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  openIndex: number | null = 0;

  faqs = [
    {
      q: 'How do engagements start?',
      a: 'We align on scope, timeline, and success metrics. A deposit secures calendar time; detailed SOW can follow for larger programs.',
    },
    {
      q: 'Which payment provider do you use?',
      a: 'Checkout runs on Stripe for global card acceptance and strong compliance (PCI handled by Stripe). For India-first UPI-heavy flows, Razorpay is a common alternative you can add in parallel.',
    },
    {
      q: 'Do you offer retainers?',
      a: 'Yes — monthly retainers are available for roadmap ownership, on-call coverage, and continuous delivery after the initial build.',
    },
    {
      q: 'What about NDAs and IP?',
      a: 'Standard practice: your IP remains yours; we can sign mutual NDAs before sharing sensitive materials.',
    },
  ];

  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }
}
