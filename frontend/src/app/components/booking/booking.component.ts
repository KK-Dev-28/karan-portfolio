import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Session {
  id: string;
  label: string;
  duration: number;
  icon: string;
  bullets: string[];
  waText: string;
  featured?: boolean;
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
      icon: '⚡',
      bullets: [
        'Quick questions & expert advice',
        'Bug diagnosis or code review',
        'Career & tech guidance',
      ],
      waText: 'Hi Karan, I\'d like to book a Quick Call (30 min) to discuss: ',
    },
    {
      id: 'strategy',
      label: 'Strategy Session',
      duration: 60,
      icon: '🎯',
      featured: true,
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
      icon: '🚀',
      bullets: [
        'Full project discovery & roadmap',
        'Team onboarding & handoff',
        'End-to-end system design',
      ],
      waText: 'Hi Karan, I\'d like to book a Deep Dive Session (90 min) to discuss: ',
    },
  ];

  waUrl(text: string): string {
    return `/api/wa?text=${encodeURIComponent(text)}`;
  }
}
