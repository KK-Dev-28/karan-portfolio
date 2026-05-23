import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Session {
  id: string;
  label: string;
  duration: number;
  bullets: string[];
  waText: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent {
  sessions: Session[] = [
    {
      id: 'quick-call',
      label: 'Quick Call',
      duration: 30,
      bullets: [
        'Ideal for quick questions & advice',
        'Bug diagnosis or code review',
        'Career / tech guidance',
      ],
      waText: 'Hi Karan, I\'d like to book a Quick Call (30 min) to discuss: ',
    },
    {
      id: 'strategy',
      label: 'Strategy Session',
      duration: 60,
      bullets: [
        'Architecture & tech stack planning',
        'Project scoping & estimation',
        'In-depth code walkthrough',
      ],
      waText: 'Hi Karan, I\'d like to book a Strategy Session (60 min) to discuss: ',
    },
    {
      id: 'deep-dive',
      label: 'Deep Dive',
      duration: 90,
      bullets: [
        'Full project discovery & roadmap',
        'Team onboarding & handoff planning',
        'End-to-end system design',
      ],
      waText: 'Hi Karan, I\'d like to book a Deep Dive Session (90 min) to discuss: ',
    },
  ];

  waUrl(text: string): string {
    return `/api/wa?text=${encodeURIComponent(text)}`;
  }
}
