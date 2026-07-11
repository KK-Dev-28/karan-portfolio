import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Chapter {
  year: string;
  title: string;
  body: string;
  tags: string[];
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.scss']
})
export class StoryComponent implements AfterViewInit, OnDestroy {
  chapters: Chapter[] = [
    {
      year: '2020',
      title: 'The Spark',
      body: 'Opened a code editor for the first time — wrote "Hello World" and somehow broke it twice. That single moment of curiosity lit a fire that hasn\'t gone out since.',
      tags: ['Python', 'HTML', 'First Steps'],
      icon: '⚡',
      accent: '#f59e0b'
    },
    {
      year: '2021',
      title: 'Web Unlocked',
      body: 'JavaScript clicked. CSS felt like painting. Built my first interactive pages and realised I wanted to make things people could actually feel and use — not just read.',
      tags: ['JavaScript', 'CSS3', 'DOM'],
      icon: '🌐',
      accent: '#06b6d4'
    },
    {
      year: '2022',
      title: 'Backend Descent',
      body: 'Node.js, Express, MongoDB — the backend opened a whole new dimension. Shipped my first REST API and felt the genuine rush of something real running in the cloud.',
      tags: ['Node.js', 'MongoDB', 'REST'],
      icon: '🔩',
      accent: '#10b981'
    },
    {
      year: '2023',
      title: 'Angular Era',
      body: 'Adopted Angular for serious project scale — RxJS, lazy-loading, smart architecture. MCA pushed design-thinking; software engineering clicked as a craft, not just code.',
      tags: ['Angular', 'TypeScript', 'Architecture'],
      icon: '🔴',
      accent: '#e11d48'
    },
    {
      year: '2024',
      title: 'First Clients',
      body: 'Turned design briefs into shipped products. Learned that great software is also great communication — with real users, not just machines. Freelancing changed everything.',
      tags: ['Freelance', 'UI/UX', 'Delivery'],
      icon: '💼',
      accent: '#7c3aed'
    },
    {
      year: '2025',
      title: 'Building at Scale',
      body: 'Launched this portfolio as a living product — AI integrations, real-time CMS, full booking flows. Engineering and design converging into one coherent practice.',
      tags: ['AI', 'Full-Stack', 'Products'],
      icon: '🚀',
      accent: '#f59e0b'
    },
    {
      year: '2026',
      title: 'Now →',
      body: 'Partnering with ambitious builders to create digital experiences that actually matter. If you found this page — you found the right person. Let\'s build something extraordinary.',
      tags: ['Open to Work', 'Collabs', 'Let\'s Go'],
      icon: '✦',
      accent: '#fbbf24'
    }
  ];

  private cleanups: (() => void)[] = [];

  ngAfterViewInit() {
    const cards = document.querySelectorAll<HTMLElement>('.chapter-card');
    cards.forEach(card => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
        const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
        card.style.setProperty('--rx', `${-dy * 14}deg`);
        card.style.setProperty('--ry', `${dx * 14}deg`);
        card.style.setProperty('--sx', `${(dx + 1) * 50}%`);
        card.style.setProperty('--sy', `${(dy + 1) * 50}%`);
      };
      const onLeave = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      this.cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  ngOnDestroy() {
    this.cleanups.forEach(fn => fn());
  }
}
