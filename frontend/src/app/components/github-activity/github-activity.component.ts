import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService } from '../../services/sound.service';

interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  url: string;
}

@Component({
  selector: 'app-github-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './github-activity.component.html',
  styleUrls: ['./github-activity.component.scss'],
})
export class GithubActivityComponent implements OnInit {
  public readonly sound = inject(SoundService);

  username = 'KK-Dev-28';
  profileUrl = 'https://github.com/KK-Dev-28';

  stats = {
    totalCommits: '1,420+',
    totalRepos: 18,
    publicGists: 6,
    contributionsThisYear: 840,
  };

  languages = [
    { name: 'TypeScript / Angular', pct: 44, color: '#3178c6' },
    { name: 'C# / .NET Web API', pct: 28, color: '#178600' },
    { name: 'SQL / PostgreSQL', pct: 16, color: '#336791' },
    { name: 'Python NLP', pct: 8, color: '#3572A5' },
    { name: 'HTML / SCSS', pct: 4, color: '#e34c26' },
  ];

  featuredRepos: GitHubRepo[] = [
    {
      name: 'OmniSync-SymmetricDS-Replication',
      description: 'Distributed bidirectional database synchronization engine with conflict resolution and offline edge caches.',
      stars: 42,
      forks: 9,
      language: 'C# / Java',
      languageColor: '#178600',
      url: 'https://github.com/KK-Dev-28',
    },
    {
      name: 'karan-portfolio-complete',
      description: 'Angular 19 Standalone 5D developer portfolio with Web Audio SFX, Three.js, AI Voice Copilot, and NestJS API.',
      stars: 68,
      forks: 14,
      language: 'TypeScript / Angular',
      languageColor: '#3178c6',
      url: 'https://github.com/KK-Dev-28/karan-portfolio',
    },
    {
      name: 'TaskFlow-Enterprise-Kanban',
      description: 'Full-stack collaborative project management platform with JWT session auth and PostgreSQL persistence.',
      stars: 35,
      forks: 7,
      language: 'TypeScript / NestJS',
      languageColor: '#e0234e',
      url: 'https://github.com/KK-Dev-28',
    },
    {
      name: 'ResumeLens-ATS-Optimizer',
      description: 'Python NLP backend and Angular frontend for instant semantic ATS keyword gap analysis and scoring.',
      stars: 29,
      forks: 5,
      language: 'Python',
      languageColor: '#3572A5',
      url: 'https://github.com/KK-Dev-28',
    },
  ];

  ngOnInit() {}
}
