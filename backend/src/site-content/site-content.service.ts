import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContent } from './site-content.entity';

const DEFAULTS: Record<string, any> = {
  hero: {
    badge: 'Available for Freelance',
    name: 'Karan',
    lastName: 'Kapoor',
    role: 'Full Stack Developer',
    stack: 'Angular + .NET + NestJS + PostgreSQL',
    description:
      '2.6 years building production-grade web apps. I deliver complete solutions — from REST APIs to polished UIs — clean, fast, and on time. Available for freelance, remote & part-time work.',
    yearsExp: '2.6',
    liveApps: '5',
    ctaPrimary: 'View My Work',
    ctaGhost: 'Get In Touch',
    whatsappNumber: '918360426467',
    available: true,
  },
  skills: {
    bars: [
      { name: 'Angular / TypeScript', pct: 90, color: 'green' },
      { name: 'ASP.NET Web API / C#', pct: 88, color: 'green' },
      { name: 'SQL Server / EF Core', pct: 82, color: 'purple' },
      { name: 'NestJS / Node.js', pct: 75, color: 'orange' },
      { name: 'Apache Kafka', pct: 68, color: 'blue' },
      { name: 'PostgreSQL', pct: 72, color: 'purple' },
      { name: 'Next.js / React', pct: 60, color: 'green' },
      { name: 'Docker / DevOps', pct: 55, color: 'orange' },
    ],
    tags: [
      'VB.NET', '.NET MVC', 'Postman', 'Git', 'Jira Cloud', 'Azure DevOps',
      'CI/CD', 'JWT Auth', 'Swagger', 'RxJS', 'HTML5/CSS3', 'REST Design',
      'TypeORM', 'Entity Framework',
    ],
    award: null,
  },
  experience: [
    {
      date: 'July 2024 – Present',
      role: 'Junior Software Developer',
      company: 'CS Soft Solutions (India) Pvt. Ltd.',
      location: 'Mohali, Punjab',
      desc: 'Building production Angular + .NET Web API applications. Led development on the Enterprise Inventory Management System with Apache Kafka real-time messaging.',
      isEdu: false,
      badge: '',
    },
    {
      date: 'Jan 2024 – Jun 2024',
      role: 'Software Developer Intern',
      company: 'CS Soft Solutions (India) Pvt. Ltd.',
      location: 'Mohali, Punjab',
      desc: 'Joined as intern and quickly ramped up on Angular and ASP.NET Web API. Contributed to live client projects within the first month of joining.',
      isEdu: false,
      badge: '',
    },
    {
      date: 'Pursuing',
      role: 'MCA — Master of Computer Applications',
      company: 'Lovely Professional University',
      location: 'Online',
      desc: '',
      isEdu: true,
      badge: '',
    },
    {
      date: '2023',
      role: 'BCA — Bachelor of Computer Applications',
      company: 'Anglo Sanskrit College',
      location: 'Khanna',
      desc: '',
      isEdu: true,
      badge: '',
    },
    {
      date: '2019',
      role: 'Diploma in Computer Applications',
      company: 'Ideal Computer Center',
      location: '',
      desc: '',
      isEdu: true,
      badge: '',
    },
  ],
  services: [
    { icon: '🅰️', name: 'Angular Apps', color: 'green', desc: 'Dashboards, admin panels, portals & SPAs with clean component architecture and responsive design.' },
    { icon: '⚙️', name: 'REST API Dev', color: 'purple', desc: 'Scalable APIs using ASP.NET Web API or NestJS with auth, guards, validation and Swagger docs.' },
    { icon: '🗄️', name: 'Database Design', color: 'orange', desc: 'Relational schema design, Entity Framework migrations, stored procedures, SQL Server & PostgreSQL.' },
    { icon: '🏢', name: 'ERP / Inventory', color: 'blue', desc: 'Multi-branch inventory, HR portals, ATS platforms and enterprise management systems.' },
    { icon: '🔄', name: 'Apache Kafka', color: 'green', desc: 'Real-time data messaging between services and branches using Apache Kafka event streaming.' },
    { icon: '🚀', name: 'Full Deployment', color: 'purple', desc: 'Complete CI/CD setup, Docker containers, deployment to Railway, Vercel, or Azure.' },
  ],
  faqs: [
    { q: 'How do engagements start?', a: 'We align on scope, timeline, and success metrics. A deposit secures calendar time; detailed SOW can follow for larger programs.' },
    { q: 'Which payment provider do you use?', a: 'Checkout runs on Stripe for global card acceptance and strong compliance (PCI handled by Stripe).' },
    { q: 'Do you offer retainers?', a: 'Yes — monthly retainers are available for roadmap ownership, on-call coverage, and continuous delivery after the initial build.' },
    { q: 'What about NDAs and IP?', a: 'Standard practice: your IP remains yours; we can sign mutual NDAs before sharing sensitive materials.' },
  ],
  gigs: [
    { icon: '✍️', name: 'Blog Writing', desc: 'Tech blogs, how-to articles, product write-ups delivered fast with clear and engaging writing.', time: '⚡ Same day', wa: 'Hi Karan, I need a blog written. Topic: ', serviceType: 'blog', featured: false },
    { icon: '📊', name: 'PowerPoint Presentations', desc: 'Professional slide decks for business proposals, tech demos, and project reports.', time: '⚡ Same-day delivery', wa: 'Hi Karan, I need a PowerPoint presentation. Topic: ', serviceType: 'presentation', featured: true },
    { icon: '📄', name: 'Word Reports & Documents', desc: 'Business reports, technical documentation, SRS documents, and project proposals.', time: '⚡ Same-day delivery', wa: 'Hi Karan, I need a Word document. Details: ', serviceType: 'word-report', featured: false },
    { icon: '📝', name: 'Survey / Quiz Creation', desc: 'Custom surveys and quizzes for research, feedback collection, and audience engagement.', time: '⚡ Within 24 hours', wa: 'Hi Karan, I need a survey/quiz created. Details: ', serviceType: 'survey-quiz', featured: false },
    { icon: '🌐', name: 'Static Websites', desc: 'Clean, fast, mobile-friendly static sites for portfolios, landing pages, and small businesses.', time: '⚡ 24–48 hours', wa: 'Hi Karan, I need a static website. My requirements: ', serviceType: 'static-website', featured: false },
    { icon: '🐛', name: 'Bug Fixes & Refactoring', desc: 'Got a broken Angular or .NET app? I dig in, find the root cause, fix bugs and improve performance.', time: '⚡ Quick turnaround', wa: 'Hi Karan, I have a bug that needs fixing. My stack and issue: ', serviceType: 'bugfix', featured: false },
  ],
  'contact-info': {
    email: 'kkcode28012002@gmail.com',
    outlookEmail: 'Karankapoor281@outlook.com',
    phone: '+91 83604 26467',
    whatsapp1: '916239589464',
    whatsapp2: '918360426467',
    whatsappBusiness: '916239589464',
    location: 'Ludhiana, Punjab, India',
    github: 'https://github.com/Karan28012002',
    linkedin: 'https://linkedin.com/in/karan-kapoor-8928451b2',
    instagram: 'https://instagram.com/__k__k_28',
    facebook: 'https://www.facebook.com/profile.php?id=100012225409125',
    teams: 'https://teams.microsoft.com/l/chat/0/0?users=Karankapoor281@outlook.com',
    availability: 'Saturdays & Sundays · Weeknights from 10 PM IST',
  },
  marquee: [
    'Angular 11+', 'ASP.NET Web API', 'NestJS', 'PostgreSQL', 'SQL Server',
    'Entity Framework', 'Apache Kafka', 'TypeScript', 'C#', 'REST APIs',
    'Azure DevOps', 'JWT Auth', 'Docker', 'Redis',
  ],
  about: {
    summary: 'Full Stack Developer with 2.6+ years building enterprise-grade web applications. Passionate about clean architecture, performance, and delivering value.',
    tagline: 'Building production-grade systems that scale.',
  },
};

@Injectable()
export class SiteContentService implements OnModuleInit {
  constructor(
    @InjectRepository(SiteContent)
    private repo: Repository<SiteContent>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    for (const [section, data] of Object.entries(DEFAULTS)) {
      const existing = await this.repo.findOne({ where: { section } });
      if (!existing) {
        await this.repo.save(this.repo.create({ section, data }));
      }
    }
  }

  async getAll(): Promise<Record<string, any>> {
    const rows = await this.repo.find();
    return Object.fromEntries(rows.map(r => [r.section, r.data]));
  }

  async getSection(section: string): Promise<any> {
    const row = await this.repo.findOne({ where: { section } });
    return row ? row.data : null;
  }

  async updateSection(section: string, data: any): Promise<SiteContent> {
    let row = await this.repo.findOne({ where: { section } });
    if (!row) {
      row = this.repo.create({ section, data });
    } else {
      row.data = data;
    }
    return this.repo.save(row);
  }
}
