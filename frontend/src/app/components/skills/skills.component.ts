import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
})
export class SkillsComponent implements OnInit, AfterViewInit {
  skills: any[] = [];
  tags: string[] = [];
  award: any = null;
  animated = false;
  activeTechCat = 'frontend';

  techCategories = [
    {
      key: 'frontend',
      label: 'Frontend',
      items: [
        { name: 'Angular',      icon: 'angularjs',           variant: 'original' },
        { name: 'React',        icon: 'react',               variant: 'original' },
        { name: 'TypeScript',   icon: 'typescript',          variant: 'original' },
        { name: 'JavaScript',   icon: 'javascript',          variant: 'original' },
        { name: 'HTML5',        icon: 'html5',               variant: 'original' },
        { name: 'CSS3',         icon: 'css3',                variant: 'original' },
        { name: 'Tailwind',     icon: 'tailwindcss',         variant: 'plain'    },
        { name: 'SCSS',         icon: 'sass',                variant: 'original' },
      ],
    },
    {
      key: 'backend',
      label: 'Backend',
      items: [
        { name: 'Node.js',      icon: 'nodejs',              variant: 'original' },
        { name: 'NestJS',       icon: 'nestjs',              variant: 'plain'    },
        { name: 'Express',      icon: 'express',             variant: 'original' },
        { name: 'Python',       icon: 'python',              variant: 'original' },
        { name: 'GraphQL',      icon: 'graphql',             variant: 'plain'    },
        { name: 'REST API',     icon: null,                  variant: null       },
      ],
    },
    {
      key: 'design',
      label: 'Design',
      items: [
        { name: 'Figma',        icon: 'figma',               variant: 'original' },
        { name: 'Adobe XD',     icon: 'xd',                  variant: 'plain'    },
        { name: 'Illustrator',  icon: 'illustrator',         variant: 'plain'    },
        { name: 'Photoshop',    icon: 'photoshop',           variant: 'plain'    },
        { name: 'Canva',        icon: 'canva',               variant: 'original' },
        { name: 'PowerPoint',   icon: null,                  variant: null       },
      ],
    },
    {
      key: 'database',
      label: 'Database',
      items: [
        { name: 'MongoDB',      icon: 'mongodb',             variant: 'original' },
        { name: 'PostgreSQL',   icon: 'postgresql',          variant: 'original' },
        { name: 'MySQL',        icon: 'mysql',               variant: 'original' },
        { name: 'Redis',        icon: 'redis',               variant: 'original' },
        { name: 'Firebase',     icon: 'firebase',            variant: 'plain'    },
      ],
    },
    {
      key: 'devops',
      label: 'DevOps',
      items: [
        { name: 'Docker',       icon: 'docker',              variant: 'original' },
        { name: 'Git',          icon: 'git',                 variant: 'original' },
        { name: 'GitHub',       icon: 'github',              variant: 'original' },
        { name: 'AWS',          icon: 'amazonwebservices',   variant: 'plain'    },
        { name: 'Linux',        icon: 'linux',               variant: 'original' },
        { name: 'VS Code',      icon: 'vscode',              variant: 'original' },
      ],
    },
  ];

  get activeCatItems() {
    return this.techCategories.find(c => c.key === this.activeTechCat)?.items ?? [];
  }

  deviconUrl(icon: string, variant: string) {
    return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${icon}/${icon}-${variant}.svg`;
  }

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      const s = c['skills'];
      if (s) {
        this.skills = s.bars ?? [];
        this.tags   = s.tags ?? [];
        this.award  = s.award ?? null;
      }
    });
  }

  ngAfterViewInit() {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { this.animated = true; obs.disconnect(); }
    }, { threshold: 0.25 });
    const el = document.querySelector('.skills-sec');
    if (el) obs.observe(el);
  }
}
