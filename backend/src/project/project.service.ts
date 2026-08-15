// project.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(@InjectRepository(Project) private repo: Repository<Project>) {}

  findAll()     { return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } }); }
  findFeatured(){ return this.repo.find({ where: { isFeatured: true }, order: { sortOrder: 'ASC' } }); }

  async create(data: Partial<Project>) {
    return this.repo.save(this.repo.create(data));
  }
  async update(id: number, data: Partial<Project>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
  async remove(id: number) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException();
    await this.repo.remove(p);
    return { ok: true };
  }

  /* Client work — delivered at CS Soft Solutions. Proprietary, so there is no
     public repo or live URL to link; the write-up is the whole story. */
  private static readonly CLIENT_PROJECTS: Partial<Project>[] = [
    { title: 'Enterprise Inventory Management System', description: 'Multi-branch inventory platform covering Head Office, Back Office, and HHT/POS Android devices. Apache Kafka integration for real-time data messaging between branches. Modules include stock management, order requests, inter-store transfers, and supplier price lists.', techStack: ['Angular', 'ASP.NET Web API', 'C#', 'Entity Framework', 'SQL Server', 'Apache Kafka'], period: 'Sep 2025 – Present', isFeatured: true, sortOrder: 1, },
    { title: 'Talent Arbor — Applicant Tracking System', description: 'End-to-end recruitment platform for job posting, candidate tracking, and recruiter management. Candidate pipeline with status updates, CV management, and job application workflows.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Aug 2025 – Present', isFeatured: false, sortOrder: 2 },
    { title: 'Swaraj Mahindra — Enterprise Dept Management', description: 'Enterprise-level admin web app for department and organizational activity management. Scalable architecture for large organizations with multiple admin roles.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Mar 2025 – Sep 2025', isFeatured: false, sortOrder: 3 },
    { title: '3T – Task Time Tracking', description: 'Internal productivity tool where employees log tasks, time spent, and project contributions. Enables managers to monitor team output and project-level resource utilization.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Aug 2024 – Dec 2024', isFeatured: false, sortOrder: 4 },
    { title: 'Mastermind Duo Tax — Property App', description: 'Property management app with depreciation tracking, capital loss management, and detailed property records.', techStack: ['Angular 11', 'ASP.NET Web API'], period: 'Feb 2025', isFeatured: false, sortOrder: 5 },
    { title: 'GeoData — Property Management Portal', description: 'End-to-end property lifecycle tracking covering ownership, tenancy, rentals, and map location integration.', techStack: ['VB.NET', 'C#', '.NET', 'SQL Server'], period: '2023 – 2024', isFeatured: false, sortOrder: 6 },
  ];

  /* Open-source work — every one of these has a public repo AND a running
     deployment, which is the bar for appearing here. Practice repos and
     anything not deployed are deliberately left out: a project nobody can
     open proves nothing to a visitor. */
  private static readonly OPEN_SOURCE_PROJECTS: Partial<Project>[] = [
    {
      title: 'This Portfolio — Full-Stack Platform',
      description: 'The site you are reading, built as a production system rather than a static page. Angular 19 front end on Vercel; NestJS + PostgreSQL API on Render. JWT-secured admin dashboard drives every section through a CMS, alongside Razorpay checkout, consultation booking, a blog, and an AI assistant running on the Claude API. Ships with a design system of 4 themes and 6 layouts switchable at runtime, and a GitHub Actions pipeline.',
      techStack: ['Angular 19', 'NestJS', 'PostgreSQL', 'TypeORM', 'TypeScript', 'Claude API'],
      period: '2025 – Present',
      githubUrl: 'https://github.com/KK-Dev-28/karan-portfolio',
      liveUrl: 'https://karan-portfolio-six-sigma.vercel.app',
      isFeatured: false, sortOrder: 7,
    },
    {
      title: 'Angular 19 Admin Dashboard — NgRx + SSR',
      description: 'Admin console built to exercise a full enterprise Angular stack end to end. NgRx store, effects, entity and selectors for state; Angular Material and CDK for the shell; server-side rendering via @angular/ssr behind Express. Supabase for data, Chart.js dashboards, and Google social sign-in. Deployed to Firebase Hosting with Cloud Functions, wired to GitHub Actions that ship main automatically and spin up a preview channel for every pull request.',
      techStack: ['Angular 19', 'NgRx', 'Angular Material', 'SSR', 'Firebase', 'Supabase'],
      period: '2025',
      githubUrl: 'https://github.com/Karan28012002/angular-firebase-app',
      liveUrl: 'https://live-angular-project-123.web.app',
      isFeatured: false, sortOrder: 8,
    },
    {
      title: 'LocalHaat — Community Research Survey',
      description: 'A live research instrument for an MCA capstone study into local shopping behaviour and street-vendor challenges. Branches into two separate questionnaires depending on whether the respondent is a customer or a vendor, persists every response to Supabase, and fires an email notification per submission. Written in vanilla HTML, CSS and JavaScript with no framework, and deployed on GitHub Pages.',
      techStack: ['JavaScript', 'HTML', 'CSS', 'Supabase', 'GitHub Pages'],
      period: '2026',
      githubUrl: 'https://github.com/Karan28012002/localhaat-survey',
      liveUrl: 'https://karan28012002.github.io/localhaat-survey/',
      isFeatured: false, sortOrder: 9,
    },
    {
      title: 'TaskFlow — React Task Management',
      description: 'Task manager built to push a single domain through every view a real product needs: a drag-and-drop Kanban board, a month calendar, a filterable list, and a stats dashboard, all over one shared store. React 18 with TypeScript throughout, dnd-kit for the board, Recharts for the analytics, Formik and Yup for validated forms, and protected routes behind a token guard.',
      techStack: ['React 18', 'TypeScript', 'dnd-kit', 'Material UI', 'Recharts', 'Formik'],
      period: '2025',
      githubUrl: 'https://github.com/Karan28012002/todo-app-react',
      isFeatured: false, sortOrder: 10,
    },
  ];

  /* Substantial builds whose source is archived or private, so there is no repo
     to link. They earn a card on the strength of the work: both are full
     ASP.NET Core systems I wrote a large share of, not tutorials followed. */
  private static readonly PERSONAL_PROJECTS: Partial<Project>[] = [
    {
      title: 'Multi-Tenant Learning Platform (SaaS)',
      description: 'A tenanted course platform where each organisation gets isolated data behind one deployment. Content is modelled as courses → chapters → topics, each with threaded comments and file attachments, plus enrolments, an audit trail, and a full REST API alongside the MVC admin. Subscription billing runs on Stripe against configurable plans; Gemini generates draft lesson content and Aspose.Slides turns a topic into a downloadable deck. Sign-in supports Google, Facebook and GitHub on top of ASP.NET Identity. I owned the tenancy layer, the API surface, the plans and billing screens, and the AI content integration across 56 commits.',
      techStack: ['ASP.NET Core 6', 'C#', 'Entity Framework Core', 'SQL Server', 'Stripe', 'AutoMapper'],
      period: 'Feb 2024 – Apr 2024',
      isFeatured: true, sortOrder: 11,
    },
    {
      title: 'E-Commerce Platform — Layered Architecture',
      description: 'A storefront and back office built as four separate projects — web, domain models, data access, and shared utilities — so the dependency direction stays honest end to end. Covers the full order lifecycle: catalogue with categories, companies and cover types, shopping cart, checkout, then pending → approved → history order queues with a staff console over the top. Payments through Stripe and PayPal, SMS notifications via Twilio, live updates over SignalR, and Polly wrapping the outbound calls for retries. Data access mixes EF Core for the domain with Dapper where raw query speed mattered, across 15+ migrations.',
      techStack: ['ASP.NET Core 6', 'C#', 'Entity Framework Core', 'Dapper', 'SQL Server', 'SignalR'],
      period: '2023 – 2024',
      isFeatured: false, sortOrder: 12,
    },
  ];

  /* Runs on every boot. A first run fills an empty table; later runs only add
     entries whose title is missing, so a redeploy can introduce a new project
     without duplicating rows or overwriting admin edits. Client work is seeded
     once and then left alone — it is edited from the admin, not from here. */
  async seed() {
    const existing = await this.repo.find({ select: ['title'] });
    const topUp = [...ProjectService.OPEN_SOURCE_PROJECTS, ...ProjectService.PERSONAL_PROJECTS];

    if (!existing.length) {
      await this.repo.save(
        [...ProjectService.CLIENT_PROJECTS, ...topUp].map(p => this.repo.create(p)),
      );
      console.log('✅ Projects seeded to PostgreSQL');
      return;
    }

    const titles = new Set(existing.map(p => p.title));
    const missing = topUp.filter(p => !titles.has(p.title!));
    if (!missing.length) return;

    await this.repo.save(missing.map(p => this.repo.create(p)));
    console.log(`✅ Added ${missing.length} project(s): ${missing.map(p => p.title).join(', ')}`);
  }
}
