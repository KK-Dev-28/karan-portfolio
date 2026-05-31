import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Service {
  icon: string;
  name: string;
  tagline: string;
  desc: string;
  bullets: string[];
  wa: string;
  featured?: boolean;
  badge?: string;
}

import { ReactionBarComponent } from '../reaction-bar/reaction-bar.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactionBarComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent {
  readonly waBase = '/api/wa?text=';

  featured: Service[] = [
    {
      icon: '🌐',
      name: 'Full-Stack Web Application',
      tagline: 'From idea to production in weeks',
      desc: 'Complete web apps with Angular frontend, NestJS / ASP.NET backend, and PostgreSQL. Admin panel, CMS, Stripe payments, CI/CD — all production-ready.',
      bullets: [
        'Angular 19 + NestJS / ASP.NET Web API',
        'Admin dashboard + CMS out of the box',
        'Stripe payment integration',
        'Deployed to Railway + Vercel with CI/CD',
      ],
      wa: 'Hi Karan, I need a full-stack web application built. Here are my requirements: ',
      featured: true,
      badge: 'Full Build',
    },
    {
      icon: '📊',
      name: 'Presentations & Reports',
      tagline: 'Any topic · Any format · Fast',
      desc: 'Professional PowerPoint decks, Word documents, and PDF reports for business proposals, tech demos, academic work, and investor pitches.',
      bullets: [
        'Business proposals & pitch decks',
        'Technical documentation & SRS',
        'Academic reports & research papers',
        'Same-day or next-day delivery',
      ],
      wa: 'Hi Karan, I need a presentation / document created. Details: ',
      featured: true,
      badge: 'Fast Delivery',
    },
    {
      icon: '🐛',
      name: 'Bug Fixes & Code Review',
      tagline: 'Root cause found, clean fix delivered',
      desc: 'Broken Angular, .NET, or NestJS project? I dig in, find the actual root cause, fix it, and leave the code cleaner than I found it.',
      bullets: [
        'Angular / .NET / NestJS / React',
        'Performance audit & refactoring',
        'Detailed explanation of what was wrong',
        'Quick turnaround — usually same day',
      ],
      wa: 'Hi Karan, I have a bug that needs fixing. My tech stack and issue: ',
      featured: true,
      badge: 'Quick Fix',
    },
  ];

  more: Service[] = [
    {
      icon: '⚙️',
      name: 'API Design & Integration',
      tagline: 'Clean, documented, production-ready',
      desc: 'REST APIs with auth, guards, validation, Swagger docs. Third-party integrations — payment gateways, webhooks, external services.',
      bullets: ['JWT / OAuth2 auth', 'Swagger / OpenAPI docs', 'Webhook + third-party setup'],
      wa: 'Hi Karan, I need API design / integration work: ',
    },
    {
      icon: '🏢',
      name: 'Admin Dashboard & CMS',
      tagline: 'Edit your site without a developer',
      desc: 'Custom admin panel with role-based access, CMS for all content, analytics, and moderation tools built specifically for your workflow.',
      bullets: ['Multi-role access control', 'Content management system', 'Dashboard analytics'],
      wa: 'Hi Karan, I need an admin dashboard / CMS: ',
    },
    {
      icon: '🚀',
      name: 'Deployment & DevOps',
      tagline: 'Ship to production confidently',
      desc: 'Complete deployment setup — Railway, Vercel, Azure, Docker containers, GitHub Actions CI/CD, env config, and smoke tests.',
      bullets: ['Railway + Vercel setup', 'Docker & CI/CD pipelines', 'Environment & secrets config'],
      wa: 'Hi Karan, I need deployment / DevOps help for: ',
    },
  ];

  process = [
    { step: '01', title: 'Discovery', desc: 'WhatsApp or email me. Tell me what you need — no forms, no waiting.' },
    { step: '02', title: 'Scoping', desc: 'I send a clear scope doc with timeline and custom quote — no hidden costs.' },
    { step: '03', title: 'Sprint Plan', desc: 'Work is split into 1-2 week sprints. You see progress at every milestone.' },
    { step: '04', title: 'Build & Review', desc: 'Daily updates on active days. You review, I refine. Feedback is fast.' },
    { step: '05', title: 'Launch & Support', desc: 'I deploy, hand over the code, and stay available post-launch.' },
  ];

  channels = [
    {
      label: 'WhatsApp Business',
      value: 'WhatsApp Business',
      icon: '💬',
      color: 'wa',
      href: '/api/wa?text=Hi Karan, I need help with ',
      note: 'Fastest response',
    },
    {
      label: 'Outlook Email',
      value: 'Karankapoor281@outlook.com',
      icon: '📧',
      color: 'outlook',
      href: 'mailto:Karankapoor281@outlook.com',
      note: 'Professional enquiries',
    },
    {
      label: 'Microsoft Teams',
      value: 'Start a Teams chat',
      icon: '🟦',
      color: 'teams',
      href: 'https://teams.microsoft.com/l/chat/0/0?users=Karankapoor281@outlook.com',
      note: 'For active projects',
    },
    {
      label: 'LinkedIn',
      value: 'Karan Kapoor',
      icon: '💼',
      color: 'li',
      href: 'https://linkedin.com/in/karan-kapoor-8928451b2',
      note: 'Professional network',
    },
    {
      label: 'Instagram',
      value: '@__k__k_28',
      icon: '📸',
      color: 'insta',
      href: 'https://instagram.com/__k__k_28',
      note: 'DM for quick chat',
    },
    {
      label: 'Facebook',
      value: 'Karan Kapoor',
      icon: '📘',
      color: 'fb',
      href: 'https://www.facebook.com/profile.php?id=100012225409125',
      note: 'Connect on Facebook',
    },
    {
      label: 'GitHub',
      value: 'Karan28012002',
      icon: '🐙',
      color: 'gh',
      href: 'https://github.com/Karan28012002',
      note: 'See my code',
    },
  ];

  waLink(msg: string): string {
    return this.waBase + encodeURIComponent(msg);
  }
}
