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
    /* Paste a YouTube/Vimeo link here (Admin → CMS → hero) to surface the
       "Watch the tour" button in the hero. Empty string hides the button
       entirely, so the site looks intentional until a video exists. */
    tourVideoUrl: '',
    tourCta: 'Watch the tour',
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
      date: 'Sep 2021 – May 2023',
      role: 'BCA — Bachelor of Computer Applications',
      company: 'Anglo Sanskrit College',
      location: 'Khanna',
      desc: '',
      isEdu: true,
      badge: '93%',
    },
    {
      date: 'Jul – Dec 2023',
      role: 'Full Stack Developer — Industrial Training',
      company: 'CS Infotech',
      location: '',
      desc: 'Six-month programme building four projects end to end: an ASP.NET Core MVC e-commerce platform on Entity Framework and Identity, a national-park ticketing system with an API consumed by its own front end, an Angular client against an ASP.NET Core API, and a React storefront on Node and MongoDB.',
      isEdu: true,
      badge: '6 months',
    },
    {
      date: '2020',
      role: 'Senior Secondary (12th)',
      company: 'P.S.K.N. Senior Secondary School',
      location: '',
      desc: '',
      isEdu: true,
      badge: '85%',
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
    {
      date: '2017',
      role: 'Matriculation (10th)',
      company: 'V.D.M. High School',
      location: '',
      desc: '',
      isEdu: true,
      badge: '70%',
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
    { q: 'Which payment provider do you use?', a: 'Checkout runs on Razorpay for smooth INR card, UPI, and netbanking acceptance (PCI compliance handled by Razorpay).' },
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
  /* Guided tour shown by the on-site assistant. `target` must be the id of a
     section on the home page; a step pointing at a missing id is skipped at
     runtime rather than breaking the tour. */
  tourGuide: {
    steps: [
      { target: 'hero',       title: 'Welcome 👋',   body: "Hi, I'm Karan's guide. I'll walk you through this portfolio in about a minute — or skip ahead any time." },
      { target: 'services',   title: 'What I do',    body: 'Full stack delivery — REST APIs through to polished interfaces. These are the engagements I take on.' },
      { target: 'skills',     title: 'The stack',    body: 'Angular on the front end, .NET and NestJS with PostgreSQL behind it. Production tooling, not tutorials.' },
      { target: 'projects',   title: 'The proof',    body: 'Real shipped systems — inventory platforms, an applicant tracking system, internal tooling. Each has a full case study.' },
      { target: 'story',      title: 'The journey',  body: 'How I got from a diploma in computer applications to building enterprise systems.' },
      { target: 'experience', title: 'Experience',   body: 'Currently a Junior Software Developer at CS Soft Solutions, alongside an MCA at Lovely Professional University.' },
      { target: 'gigs',       title: 'Work with me', body: 'Fixed-scope packages and monthly retainers, with clear deliverables and timelines.' },
      { target: 'contact',    title: "Let's talk",   body: 'That’s the tour. If something here fits what you need, send a message — I reply quickly.' },
    ],
  },
  /* The structured CV behind the public resume page. Kept in the CMS rather
     than hardcoded so it can be corrected from the admin without a deploy —
     a resume dates faster than anything else on the site. */
  resume: {
    "name": "Karan Kapoor",
    "email": "kkcode28012002@gmail.com",
    "links": [
      {
        "url": "https://karan-portfolio-six-sigma.vercel.app",
        "label": "Portfolio"
      },
      {
        "url": "https://linkedin.com/in/karan-kapoor-8928451b2",
        "label": "LinkedIn"
      },
      {
        "url": "https://github.com/Karan28012002",
        "label": "GitHub"
      }
    ],
    "phone": "+91-6239589464",
    "title": "Full Stack Developer",
    "awards": [],
    "skills": {
      "Data": [
        "SQL Server",
        "Entity Framework",
        "LINQ",
        "PostgreSQL",
        "MongoDB",
        "Mongoose",
        "TypeORM"
      ],
      "Backend": [
        "ASP.NET Web API",
        "ASP.NET Core",
        "ASP.NET MVC",
        "C#",
        ".NET",
        "VB.NET",
        "NestJS",
        "Node.js",
        "REST APIs",
        "OAuth",
        "JWT"
      ],
      "Frontend": [
        "Angular",
        "TypeScript",
        "JavaScript",
        "RxJS",
        "HTML5",
        "CSS3",
        "AJAX",
        "React",
        "Responsive Design"
      ],
      "Practice": [
        "Agile",
        "Scrum",
        "Jira",
        "Git",
        "GitHub",
        "Azure DevOps",
        "Bruno",
        "Postman",
        "CI/CD",
        "AI-Assisted Development"
      ],
      "Integration": [
        "Apache Kafka",
        "SymmetricDS",
        "DevExpress",
        "Proxy Server Configuration"
      ]
    },
    "summary": "Full Stack Developer at CS Soft Solutions, building enterprise web applications on Angular front ends and ASP.NET Web API back ends since January 2024. Progressed from intern to leading full-stack delivery on a client platform in under two years. Work spans legacy modernisation - migrating a production data layer onto Entity Framework and rewriting its queries in LINQ - through multi-branch systems replicating data across branches and handheld POS devices with Apache Kafka and SymmetricDS. Completing an MCA at Lovely Professional University alongside full-time work, including original field research built into a live product.",
    "tagline": "Angular + .NET - multi-branch enterprise systems, legacy modernisation, real-time data",
    "location": "Ludhiana, Punjab, India",
    "projects": [
      {
        "link": "",
        "name": "Swiftec",
        "stack": "Angular - ASP.NET Web API - C# - SQL Server",
        "summary": "Client platform led end to end as full-stack developer, owning both the Angular front end and the Web API services behind it."
      },
      {
        "link": "",
        "name": "Enterprise Inventory Management System",
        "stack": "Angular - ASP.NET Web API - C# - Entity Framework - SQL Server - Apache Kafka - SymmetricDS",
        "summary": "Multi-branch inventory platform spanning Head Office, Back Office and HHT/POS Android devices, with real-time branch-to-branch messaging and database replication."
      },
      {
        "link": "karan-portfolio-six-sigma.vercel.app",
        "name": "Portfolio Platform - full-stack product",
        "stack": "Angular 19 - NestJS - PostgreSQL - TypeORM - Claude API",
        "summary": "Built as a production system rather than a static page: a JWT-secured admin CMS driving every section, payment checkout, consultation booking, a blog, an AI assistant, a runtime design system and a GitHub Actions pipeline."
      },
      {
        "link": "localhaat.onrender.com",
        "name": "LocalHaat - MCA capstone research and marketplace",
        "stack": "React - Vite - Firebase - PWA - Supabase",
        "summary": "Field research into local shopping behaviour and street-vendor challenges, built first into a live survey instrument and then into a marketplace connecting shoppers with nearby vendors."
      },
      {
        "link": "",
        "name": "GeoData - property management portal",
        "stack": "VB.NET - C# - .NET - Entity Framework - LINQ - SQL Server",
        "summary": "Legacy modernisation of the data access layer, alongside end-to-end property lifecycle tracking covering ownership, tenancy, rentals and map integration."
      }
    ],
    "education": [
      {
        "note": "Online, alongside full-time work",
        "score": "",
        "degree": "MCA — Master of Computer Applications",
        "period": "Pursuing",
        "institution": "Lovely Professional University"
      },
      {
        "note": "",
        "score": "93%",
        "degree": "BCA — Bachelor of Computer Applications",
        "period": "Sep 2021 – May 2023",
        "institution": "Anglo Sanskrit College, Khanna"
      },
      {
        "note": "",
        "score": "",
        "degree": "Diploma in Computer Applications",
        "period": "2019",
        "institution": "Ideal Computer Center"
      },
      {
        "note": "",
        "score": "85%",
        "degree": "Senior Secondary (12th)",
        "period": "2020",
        "institution": "P.S.K.N. Senior Secondary School"
      },
      {
        "note": "",
        "score": "70%",
        "degree": "Matriculation (10th)",
        "period": "2017",
        "institution": "V.D.M. High School"
      }
    ],
    "experience": [
      {
        "role": "Software Developer",
        "period": "July 2025 - Present",
        "bullets": [
          "Lead full-stack developer on Swiftec, owning the Angular front end and the ASP.NET Web API services behind it end to end.",
          "Enterprise Inventory Management System - multi-branch stock platform covering Head Office, Back Office and HHT/POS Android devices. Apache Kafka carries real-time messaging between branches and SymmetricDS keeps their databases replicated; modules span stock management, order requests, inter-store transfers and supplier price lists.",
          "AI Resume Builder - job-portal platform with AI-assisted resume generation on a document database, synchronised per client ID.",
          "Built operational reporting with DevExpress, and worked across proxy-server configuration, Azure DevOps and Bruno for API verification."
        ],
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab"
      },
      {
        "role": "Junior Software Developer",
        "period": "July 2024 - July 2025",
        "bullets": [
          "Angular front-end developer across several concurrent client projects, owning client-side delivery and agreeing API contracts directly with the back-end team.",
          "Talent Arbor - applicant tracking system covering job posting, candidate pipelines with status workflows, CV management and recruiter administration.",
          "Swaraj Mahindra - enterprise department management portal supporting multiple administrative roles at organisational scale.",
          "Mastermind Duo Tax - property application handling depreciation and capital-loss tracking; implemented its data synchronisation process.",
          "3T Task and Time Tracking - internal system for logging tasks, time and project contribution, giving managers visibility of resource utilisation.",
          "Worked in Agile/Scrum throughout, tracked in Jira and Trello with Git and GitHub."
        ],
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab"
      },
      {
        "role": "Software Developer Intern",
        "period": "January 2024 - June 2024",
        "bullets": [
          "Joined a seven-person team and was contributing to live client projects within the first month.",
          "GeoData - migrated the legacy internal data access layer to Entity Framework and rewrote its queries in LINQ, substantially reducing the code involved. The portal tracks property lifecycle across ownership, tenancy, rentals, mortgages and leases.",
          "Implemented an OAuth flow verifying login against an external identity server.",
          "Contributed to a Learning Management System still under active development.",
          "Worked in HTML, CSS, JavaScript and AJAX against ASP.NET MVC, Web API and SQL Server."
        ],
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab"
      }
    ],
    "availability": "Open to freelance, remote and part-time engagements - Saturdays & Sundays · Weeknights from 10 PM IST",
    "certifications": [
      {
        "date": "Jul - Dec 2023",
        "note": "Six months across four projects: an ASP.NET Core MVC e-commerce platform on Entity Framework and Identity, a national-park ticketing API, an Angular client against a .NET API, and a React storefront on Node and MongoDB.",
        "title": "Full Stack Developer - Industrial Training",
        "issuer": "CS Infotech"
      }
    ]
  },

  appearance: {
    theme: 'midnight-gold',
    layout: 'standard',
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
