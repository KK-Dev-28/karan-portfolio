import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';
import { AnalyticsService } from '../../services/analytics.service';

export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'frontend' | 'gateway' | 'database' | 'ai' | 'payment';
  role: string;
  tech: string;
  latency: string;
  status: 'active' | 'synced' | 'secure';
  description: string;
  icon: string;
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
})
export class SkillsComponent implements OnInit, AfterViewInit {
  private readonly cms = inject(SiteContentService);
  private readonly analytics = inject(AnalyticsService);

  skills: any[] = [];
  tags: string[] = [];
  award: any = null;
  animated = false;
  activeTechCat = 'architecture';
  selectedArchNode: ArchitectureNode | null = null;

  architectureNodes: ArchitectureNode[] = [
    {
      id: 'spa',
      name: 'Angular 19 SPA',
      category: 'frontend',
      role: 'Client & Spatial 3D/5D UI',
      tech: 'Angular 19 · Three.js · SCSS Tokens · RxJS',
      latency: '< 18ms render',
      status: 'active',
      description: 'Zoneless-ready standalone client with adaptive WebGL tiering and dynamic SEO metadata.',
      icon: '⚡',
    },
    {
      id: 'gateway',
      name: 'NestJS API Gateway',
      category: 'gateway',
      role: 'Core Backend & CQRS Layer',
      tech: 'NestJS 10 · TypeScript · Helmet · Throttler',
      latency: '< 24ms p95',
      status: 'secure',
      description: 'Hardened REST API with JWT guards, strict DTO validation, compression, and Swagger documentation.',
      icon: '🛡️',
    },
    {
      id: 'db',
      name: 'PostgreSQL Relational DB',
      category: 'database',
      role: 'Primary Data Persistence',
      tech: 'PostgreSQL · TypeORM · Connection Pooling',
      latency: '< 4ms query',
      status: 'synced',
      description: 'Enterprise relational store managing visitors, telemetry, portfolio journal, reviews, and bookings.',
      icon: '🗄️',
    },
    {
      id: 'ai',
      name: 'Claude AI Engine',
      category: 'ai',
      role: 'Generative Intelligence',
      tech: 'Anthropic SDK · Claude Opus · OTP Verification',
      latency: '~ 650ms stream',
      status: 'active',
      description: 'Generates blog insights, code explanations, and regex structures with rate-capped usage limits.',
      icon: '🧠',
    },
    {
      id: 'nlp',
      name: 'Python ATS Analyzer',
      category: 'ai',
      role: 'Heuristic NLP Microservice',
      tech: 'FastAPI · Pydantic · Python 3.10 · Uvicorn',
      latency: '< 35ms scan',
      status: 'active',
      description: 'Deep text and keyword density scoring engine matching developer resumes to job specs.',
      icon: '🔬',
    },
    {
      id: 'pay',
      name: 'Razorpay Gateway',
      category: 'payment',
      role: 'Monetization & Invoicing',
      tech: 'Razorpay API · Webhook HMAC SHA-256',
      latency: 'Instant Sync',
      status: 'secure',
      description: 'Automated order creation, signature verification, and instant invoice token generation.',
      icon: '💳',
    },
  ];

  techCategories = [
    {
      key: 'architecture',
      label: '⚡ System Architecture',
      items: [],
    },
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
      key: 'database',
      label: 'Database',
      items: [
        { name: 'PostgreSQL',   icon: 'postgresql',          variant: 'original' },
        { name: 'MongoDB',      icon: 'mongodb',             variant: 'original' },
        { name: 'MySQL',        icon: 'mysql',               variant: 'original' },
        { name: 'Redis',        icon: 'redis',               variant: 'original' },
        { name: 'Firebase',     icon: 'firebase',            variant: 'plain'    },
      ],
    },
    {
      key: 'devops',
      label: 'DevOps & Tools',
      items: [
        { name: 'Docker',       icon: 'docker',              variant: 'original' },
        { name: 'Git',          icon: 'git',                 variant: 'original' },
        { name: 'GitHub Actions', icon: 'github',            variant: 'original' },
        { name: 'AWS',          icon: 'amazonwebservices',   variant: 'plain'    },
        { name: 'Linux',        icon: 'linux',               variant: 'original' },
        { name: 'VS Code',      icon: 'vscode',              variant: 'original' },
      ],
    },
  ];

  get activeCatItems() {
    return this.techCategories.find(c => c.key === this.activeTechCat)?.items ?? [];
  }

  selectCategory(key: string) {
    this.activeTechCat = key;
    this.analytics.trackInteraction('select_tech_category', 'skills', { category: key });
  }

  selectArchNode(node: ArchitectureNode) {
    this.selectedArchNode = this.selectedArchNode?.id === node.id ? null : node;
    if (this.selectedArchNode) {
      this.analytics.trackInteraction('inspect_arch_node', 'skills', { node: node.id });
    }
  }

  deviconUrl(icon: string, variant: string) {
    return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${icon}/${icon}-${variant}.svg`;
  }

  ngOnInit() {
    this.selectedArchNode = this.architectureNodes[0];
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
      if (entries[0].isIntersecting) {
        this.animated = true;
        obs.disconnect();
      }
    }, { threshold: 0.25 });

    const el = document.querySelector('.skills-sec');
    if (el) obs.observe(el);
  }
}
