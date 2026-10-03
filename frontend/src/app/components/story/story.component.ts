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
  /* Every chapter here is taken from the CV and the dates on the experience
     timeline. The version this replaced was invented — it opened with a first
     line of code in 2020, a year after the DCA; put the MCA in 2023, when the
     BCA was still being finished; and described 2024 as the year freelancing
     began, which is when the CS Soft Solutions internship started. A story a
     reader can check against the timeline below it is worth more than a
     better-sounding one that contradicts it. */
  chapters: Chapter[] = [
    {
      year: '2017',
      title: 'School, and a First Look',
      body: 'Finished matriculation at V.D.M. High School with 70%. Computers were still a subject rather than a direction, but the interest was there.',
      tags: ['Matriculation', '70%'],
      icon: '📘',
      accent: '#64748b'
    },
    {
      year: '2019',
      title: 'First Formal Training',
      body: 'Took a Diploma in Computer Applications at Ideal Computer Center — the first time software was something to be studied deliberately rather than poked at.',
      tags: ['DCA', 'Foundations'],
      icon: '🧭',
      accent: '#0ea5e9'
    },
    {
      year: '2020',
      title: 'Senior Secondary',
      body: 'Completed senior secondary at P.S.K.N. Senior Secondary School with 85%, and committed to computer applications as the thing to study properly.',
      tags: ['12th', '85%'],
      icon: '🎓',
      accent: '#14b8a6'
    },
    {
      year: '2021–23',
      title: 'BCA at Anglo Sanskrit College',
      body: 'Three years of computer applications at A.S. College, Khanna, finishing with 93%. Programming stopped being coursework somewhere in the middle of it and became the thing I actually wanted to do.',
      tags: ['BCA', '93%', 'Khanna'],
      icon: '📗',
      accent: '#22c55e'
    },
    {
      year: '2023',
      title: 'Industrial Training — Four Builds',
      body: 'Six months at CS Infotech, building four projects end to end: an ASP.NET Core MVC e-commerce platform on Entity Framework and Identity, a national-park ticketing system, an Angular client against a .NET API, and a React storefront on Node and MongoDB. This is where the stack I still work in was settled.',
      tags: ['ASP.NET Core', 'Angular', 'React'],
      icon: '🛠️',
      accent: '#7c3aed'
    },
    {
      year: '2024',
      title: 'Into Production at CS Soft Solutions',
      body: 'Joined as a Software Developer Intern in January and was contributing to live client projects within the first month. Took the full-time Junior Software Developer role in July. Training projects became systems with real users and real consequences.',
      tags: ['Internship', 'Full-time', 'Mohali'],
      icon: '💼',
      accent: '#f59e0b'
    },
    {
      year: '2025',
      title: 'Enterprise Scale',
      body: 'Delivered the Swaraj Mahindra department management app, then moved onto the Enterprise Inventory Management System — multi-branch stock across Head Office, Back Office and HHT/POS devices, with real-time messaging between branches. Awarded High Productivity in the .NET department for the work.',
      tags: ['Angular', '.NET', 'Kafka', 'Award'],
      icon: '🏆',
      accent: '#eab308'
    },
    {
      year: '2026',
      title: 'MCA, and Research of My Own',
      body: 'Pursuing an MCA at Lovely Professional University alongside full-time work. The capstone studies how people shop locally and what street vendors are up against — a live survey, and LocalHaat, the marketplace built from what it found.',
      tags: ['MCA', 'LocalHaat', 'Research'],
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
