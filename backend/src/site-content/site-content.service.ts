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
    "title": "Full Stack Developer",
    "tagline": "Angular + .NET · enterprise systems that run in production",
    "location": "Ludhiana, Punjab, India",
    "email": "kkcode28012002@gmail.com",
    "phone": "+91-6239589464",
    "availability": "Open to freelance, remote and part-time engagements",
    "links": [
      {
        "label": "Portfolio",
        "url": "https://karan-portfolio-six-sigma.vercel.app"
      },
      {
        "label": "GitHub",
        "url": "https://github.com/Karan28012002"
      }
    ],
    "summary": "Full Stack Developer building enterprise web applications at CS Soft Solutions since January 2024, working across Angular front ends and ASP.NET Web API back ends. Work has run from modernising a legacy data layer onto Entity Framework, through owning front-end delivery on several concurrent client projects, to multi-branch systems replicating data between branches and handheld devices. Awarded High Productivity in the .NET department. Completing an MCA at Lovely Professional University alongside full-time work.",
    "experience": [
      {
        "role": "Software Developer",
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab",
        "period": "July 2025 – Present",
        "bullets": [
          "Lead full-stack developer on a client platform, owning both the Angular front end and the ASP.NET Web API services behind it.",
          "Enterprise Inventory Management System: multi-branch stock platform spanning Head Office, Back Office and HHT/POS Android devices, with Apache Kafka messaging and SymmetricDS replication keeping branches in step.",
          "AI Resume Builder: job-portal platform with AI-assisted resume generation on a document database, synchronised per client ID.",
          "Built reporting with DevExpress and worked across proxy-server configuration, Azure DevOps and Bruno for API testing.",
          "Awarded High Productivity in the .NET department."
        ]
      },
      {
        "role": "Junior Software Developer",
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab",
        "period": "July 2024 – July 2025",
        "bullets": [
          "Angular front-end developer across several concurrent client projects, coordinating API contracts directly with the back-end team.",
          "3T — Task & Time Tracking: in-house system for logging tasks, time and project contribution.",
          "Mastermind Duo Tax: property application covering depreciation and capital-loss tracking; implemented the data sync process.",
          "Swaraj Mahindra: enterprise department management portal supporting multiple admin roles.",
          "Worked in Agile/Scrum throughout, using Jira, Trello, Git and GitHub."
        ]
      },
      {
        "role": "Software Developer Intern",
        "company": "CS Soft Solutions (India) Pvt. Ltd.",
        "location": "Mohali, Punjab",
        "period": "January 2024 – June 2024",
        "bullets": [
          "Joined a 7-person team and was contributing to live client projects within the first month.",
          "GeoData property portal: migrated the legacy internal data layer to Entity Framework and rewrote queries in LINQ, substantially reducing the code involved. The system tracks ownership, tenancy, mortgages and leases.",
          "Built an open-authentication flow verifying login against an external identity server.",
          "Contributed to a Learning Management System still in development.",
          "Worked in HTML, CSS, JavaScript and AJAX against ASP.NET MVC, Web API and SQL Server."
        ]
      }
    ],
    "education": [
      {
        "degree": "MCA — Master of Computer Applications",
        "institution": "Lovely Professional University",
        "period": "Pursuing",
        "score": "",
        "note": "Online, alongside full-time work"
      },
      {
        "degree": "Full Stack Developer — Industrial Training",
        "institution": "CS Infotech",
        "period": "Jul – Dec 2023",
        "score": "6 months",
        "note": "Four projects: ASP.NET Core MVC e-commerce on Entity Framework and Identity, a national-park ticketing API, an Angular client against a .NET API, and a React storefront on Node and MongoDB"
      },
      {
        "degree": "BCA — Bachelor of Computer Applications",
        "institution": "Anglo Sanskrit College, Khanna",
        "period": "Sep 2021 – May 2023",
        "score": "93%",
        "note": ""
      },
      {
        "degree": "Diploma in Computer Applications",
        "institution": "Ideal Computer Center",
        "period": "2019",
        "score": "",
        "note": ""
      },
      {
        "degree": "Senior Secondary (12th)",
        "institution": "P.S.K.N. Senior Secondary School",
        "period": "2020",
        "score": "85%",
        "note": ""
      },
      {
        "degree": "Matriculation (10th)",
        "institution": "V.D.M. High School",
        "period": "2017",
        "score": "70%",
        "note": ""
      }
    ],
    "skills": {
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
        "OAuth"
      ],
      "Data": [
        "SQL Server",
        "Entity Framework",
        "LINQ",
        "PostgreSQL",
        "MongoDB",
        "Mongoose",
        "TypeORM"
      ],
      "Integration": [
        "Apache Kafka",
        "SymmetricDS",
        "DevExpress",
        "Proxy Server Configuration"
      ],
      "Tooling": [
        "Git",
        "GitHub",
        "Jira",
        "Trello",
        "Azure DevOps",
        "Bruno",
        "Postman",
        "Agile",
        "Scrum"
      ]
    },
    "awards": [
      {
        "title": "High Productivity — .NET Department",
        "issuer": "CS Soft Solutions (India) Pvt. Ltd.",
        "date": ""
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
