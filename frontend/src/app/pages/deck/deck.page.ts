import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface Slide {
  type: 'cover' | 'agenda' | 'content' | 'stats' | 'quote' | 'chart' | 'split' | 'end';
  tag?:      string;
  title?:    string;
  subtitle?: string;
  bullets?:  string[];
  stats?:    { value: string; label: string; color?: string }[];
  quote?:    string;
  quoteBy?:  string;
  bars?:     { label: string; pct: number; color: string }[];
  left?:     { title: string; bullets: string[] };
  right?:    { title: string; bullets: string[] };
  accent?:   string;
}

interface Deck { title: string; author: string; date: string; slides: Slide[]; }

const DECKS: Record<string, Deck> = {
  'saas-pitch': {
    title: 'Zero to SaaS — Build, Launch & Scale', author: 'Karan Kapoor', date: '2025',
    slides: [
      { type: 'cover',   tag: 'Startup Playbook', title: 'Zero to SaaS', subtitle: 'How to Build, Launch & Scale a Software Product in 90 Days', accent: '#f59e0b' },
      { type: 'agenda',  title: 'What We Cover', bullets: ['01 — The Problem Worth Solving', '02 — Product Architecture', '03 — Tech Stack Selection', '04 — MVP to Market', '05 — Growth & Monetisation', '06 — Key Metrics & KPIs', '07 — Scaling Infrastructure', '08 — Financial Model'] },
      { type: 'stats',   tag: 'Market Opportunity', title: 'SaaS Market by Numbers', stats: [{ value: '$908B', label: 'Global SaaS Market 2030', color: '#f59e0b' }, { value: '18%', label: 'CAGR Growth Rate', color: '#22c55e' }, { value: '70%', label: 'Businesses Moving to Cloud', color: '#8b5cf6' }, { value: '3.5×', label: 'Avg ROI vs On-Premise', color: '#3b82f6' }] },
      { type: 'split',   tag: 'Architecture Decision', title: 'Monolith vs Microservices', left: { title: 'Start Monolith', bullets: ['Ship faster (0→10k users)', 'Single deployment unit', 'Easy debugging & testing', 'Refactor when pain arrives', 'Most SaaS start here'] }, right: { title: 'Scale to Micro', bullets: ['Independent deployments', 'Team autonomy at scale', 'Fault isolation per service', 'Multi-language support', 'Kubernetes orchestration'] } },
      { type: 'content', tag: 'Tech Stack', title: 'The Production-Proven Blueprint', bullets: ['Frontend — Angular 19 (standalone components, signals, SSR)', 'Backend — NestJS 10 (CQRS, DI, Swagger auto-generated docs)', 'Database — PostgreSQL on Neon (serverless, branching, zero-downtime)', 'Auth — JWT (15min) + HTTP-only refresh tokens (30 days)', 'Payments — Razorpay with webhook verification & approval flow', 'Email — Resend SDK (3,000 free emails/month, 99.9% delivery)', 'Hosting — Vercel (frontend) + Render (backend)', 'CI/CD — GitHub Actions with preview deploys on every PR'] },
      { type: 'chart',   tag: 'MVP Timeline', title: '90-Day Launch Roadmap', bars: [{ label: 'Week 1–2: Architecture & Dev Setup', pct: 100, color: '#f59e0b' }, { label: 'Week 3–4: Core Features Build', pct: 88, color: '#f59e0b' }, { label: 'Week 5–6: Auth + Payments', pct: 75, color: '#8b5cf6' }, { label: 'Week 7–8: UI Polish + QA', pct: 60, color: '#3b82f6' }, { label: 'Week 9–10: Beta Launch', pct: 45, color: '#22c55e' }, { label: 'Week 11–12: Growth Loop', pct: 28, color: '#22c55e' }] },
      { type: 'stats',   tag: 'SaaS KPIs', title: 'Metrics That Matter', stats: [{ value: 'MRR', label: 'Monthly Recurring Revenue', color: '#f59e0b' }, { value: '<2%', label: 'Target Churn Rate/Month', color: '#22c55e' }, { value: '3× LTV', label: 'Minimum LTV to CAC Ratio', color: '#8b5cf6' }, { value: '>50', label: 'NPS Score Target', color: '#3b82f6' }] },
      { type: 'content', tag: 'Monetisation', title: 'Pricing Models That Work', bullets: ['Freemium — Viral growth, best for B2C (Notion, Figma, Slack)', 'Usage-based — Pay per API call/event (Stripe, AWS, Resend)', 'Per-seat — Teams pay per user (Linear, GitHub, Vercel)', 'Tiered — Starter/Pro/Enterprise tiers (most common B2B)', 'Hybrid — Free tier + usage caps + seat limits combined', 'Annual billing — 15-20% discount = 12 months upfront cash', 'Expansion revenue — Upsells account for 30%+ of growth'] },
      { type: 'quote',   quote: 'Make something people want. The rest — pricing, growth, fundraising — becomes much easier when the core is right.', quoteBy: 'Paul Graham, Y Combinator' },
      { type: 'end',     title: 'Ready to Build Your SaaS?', subtitle: 'I build production-grade SaaS applications from architecture to deployment. Zero shortcuts, clean code, on-time delivery.' },
    ],
  },

  'web-dev-2025': {
    title: 'Full-Stack Web Development — 2025 Blueprint', author: 'Karan Kapoor', date: '2025',
    slides: [
      { type: 'cover',   tag: 'Technical Deep Dive', title: 'Full-Stack Web Dev', subtitle: 'The 2025 Blueprint — Angular · NestJS · PostgreSQL · DevOps', accent: '#8b5cf6' },
      { type: 'agenda',  title: 'Topics Covered', bullets: ['01 — Angular 19: What Changed Everything', '02 — NestJS vs Express — When to Use What', '03 — Database in a Serverless World', '04 — Authentication Done Right', '05 — API Design Principles', '06 — Performance & Core Web Vitals', '07 — The Free-Tier Production Stack', '08 — What\'s Coming in 2026'] },
      { type: 'stats',   tag: 'Angular 19', title: 'Game-Changing Features', stats: [{ value: 'Signals', label: 'Native reactivity primitives', color: '#f59e0b' }, { value: 'Standalone', label: 'Zero NgModule overhead', color: '#8b5cf6' }, { value: '@defer', label: 'Lazy content without routes', color: '#3b82f6' }, { value: 'SSR', label: 'Built-in partial hydration', color: '#22c55e' }] },
      { type: 'split',   tag: 'Backend Choice', title: 'NestJS vs Express', left: { title: '✓ NestJS', bullets: ['Structured by design', 'DI built-in (testable)', 'Decorators = self-docs', 'Swagger in 3 lines', 'CQRS, WebSockets ready', 'Teams love it at scale'] }, right: { title: 'Express', bullets: ['Maximum flexibility', 'Minimal overhead', 'Quick prototyping', 'Huge ecosystem', 'No opinions = decisions', 'Use for tiny services'] } },
      { type: 'content', tag: 'Database Layer', title: 'PostgreSQL + Neon = Perfect Pair', bullets: ['PostgreSQL: ACID, JSON support, full-text search, row-level security', 'Neon: Serverless Postgres — scales to zero, branching in milliseconds', 'TypeORM: Decorator entities, auto-migrations, elegant relations', 'DATABASE_SYNC=true — zero-config schema sync in dev/staging', 'Branching workflow: Clone prod DB for testing → merge when ready', 'Connection pooling via built-in PgBouncer (Neon)', 'Free tier: 0.5GB storage — sustains most early-stage products'] },
      { type: 'chart',   tag: 'Performance', title: 'Core Web Vitals Targets', bars: [{ label: 'LCP — Largest Contentful Paint (target <2.5s)', pct: 92, color: '#22c55e' }, { label: 'FID — First Input Delay (target <100ms)', pct: 98, color: '#22c55e' }, { label: 'CLS — Cumulative Layout Shift (target <0.1)', pct: 95, color: '#22c55e' }, { label: 'TTFB — Time to First Byte (target <600ms)', pct: 85, color: '#f59e0b' }, { label: 'TTI — Time to Interactive (target <3.8s)', pct: 78, color: '#f59e0b' }] },
      { type: 'content', tag: 'Auth', title: 'Security-First Authentication', bullets: ['Short-lived JWTs (15 min) + long-lived refresh tokens (30 days)', 'HTTP-only cookies for refresh — XSS-proof by design', 'bcrypt cost factor 12 — right balance of security vs CPU', 'Rate limiting: 5 login attempts per 5 minutes per IP', 'JTI in payload — allows token revocation without a blocklist', 'RBAC guards on every endpoint — whitelist, not blacklist', 'OTP via Resend — email verification flow baked in', 'Row-level security in PostgreSQL — tenant isolation for SaaS'] },
      { type: 'stats',   tag: 'Free Deployment', title: 'Production Stack at Zero Cost', stats: [{ value: 'Vercel', label: '100GB bandwidth, preview deploys', color: '#f5f5f5' }, { value: 'Render', label: '750 hours/month backend hosting', color: '#46e3b7' }, { value: 'Neon', label: '0.5GB DB + branching free', color: '#3b82f6' }, { value: 'Resend', label: '3,000 transactional emails free', color: '#f59e0b' }] },
      { type: 'quote',   quote: 'Architecture is not about making things perfect. It\'s about making the right trade-offs for your current stage and knowing when those trade-offs need to change.', quoteBy: 'Karan Kapoor' },
      { type: 'end',     title: 'Let\'s Build Together', subtitle: 'Need a production-grade Angular + NestJS application? Clean architecture, tested code, on-time delivery.' },
    ],
  },

  'ui-design-system': {
    title: 'Building a World-Class Design System', author: 'Karan Kapoor', date: '2025',
    slides: [
      { type: 'cover',   tag: 'Design Engineering', title: 'World-Class Design System', subtitle: 'From Design Tokens to Production Components — A Complete Guide', accent: '#a855f7' },
      { type: 'agenda',  title: 'The Journey', bullets: ['01 — Why Design Systems Fail', '02 — Design Tokens: The Foundation', '03 — Component Architecture', '04 — Dark/Light Mode Done Right', '05 — Animation Principles', '06 — Accessibility First', '07 — Documentation That Developers Love', '08 — Measuring Adoption'] },
      { type: 'stats',   tag: 'The Problem', title: 'Without a Design System', stats: [{ value: '3×', label: 'Slower feature development', color: '#ef4444' }, { value: '40%', label: 'UI inconsistency rate', color: '#ef4444' }, { value: '60%', label: 'Designer-dev handoff time', color: '#f59e0b' }, { value: '∞', label: 'Duplicate components per team', color: '#f59e0b' }] },
      { type: 'content', tag: 'Tokens', title: 'Design Tokens: The Source of Truth', bullets: ['Colors: semantic (--bg, --text, --accent) not literal (--blue-400)', 'Spacing: 4px base grid — 4, 8, 12, 16, 24, 32, 48, 64, 96', 'Typography: fluid sizing with clamp() — no breakpoint hacks', 'Shadows: layered system (card, glow, modal, floating)', 'Radii: consistent corner radii (4, 8, 12, 16, 24, 9999)', 'Transitions: fast (150ms), mid (300ms), slow (600ms)', 'Z-index: named layers (base, card, nav, modal, toast, max)', 'Store in CSS custom properties — works across frameworks'] },
      { type: 'split',   tag: 'Components', title: 'Atomic Design Hierarchy', left: { title: 'Atoms', bullets: ['Button (5 variants)', 'Input / Textarea', 'Badge / Chip', 'Icon system (SVG)', 'Spinner / Skeleton', 'Avatar'] }, right: { title: 'Organisms', bullets: ['Navigation bar', 'Data table', 'Form with validation', 'Card grid', 'Modal / Drawer', 'Toast notifications'] } },
      { type: 'chart',   tag: 'Accessibility', title: 'WCAG 2.1 Compliance Score', bars: [{ label: 'Color Contrast AA (4.5:1 ratio)', pct: 100, color: '#22c55e' }, { label: 'Keyboard Navigation', pct: 100, color: '#22c55e' }, { label: 'Screen Reader Compatibility', pct: 95, color: '#22c55e' }, { label: 'Focus Visible Indicators', pct: 100, color: '#22c55e' }, { label: 'Motion Sensitivity (prefers-reduced)', pct: 90, color: '#f59e0b' }] },
      { type: 'quote',   quote: 'A design system is not a project. It\'s a product, serving products. It needs versioning, documentation, roadmap and community.', quoteBy: 'Nathan Curtis, Design Systems Consultant' },
      { type: 'stats',   tag: 'ROI', title: 'With a Design System', stats: [{ value: '50%', label: 'Faster UI development', color: '#22c55e' }, { value: '1 source', label: 'Single truth for design & dev', color: '#22c55e' }, { value: '100%', label: 'Brand consistency', color: '#22c55e' }, { value: '30%', label: 'Fewer design reviews needed', color: '#22c55e' }] },
      { type: 'end',     title: 'Need a Design System Built?', subtitle: 'I design and build component libraries that scale. Dark/light themes, accessibility, and developer-friendly docs included.' },
    ],
  },
};

@Component({
  selector: 'app-deck-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss'],
})
export class DeckPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  deck: Deck | null = null;
  current = 0;
  transitioning = false;
  slug = '';

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.deck = DECKS[this.slug] || null;
  }

  get slide(): Slide { return this.deck?.slides[this.current] ?? ({} as Slide); }
  get progress(): number { return this.deck ? ((this.current + 1) / this.deck.slides.length) * 100 : 0; }
  get isFirst(): boolean { return this.current === 0; }
  get isLast(): boolean { return !this.deck || this.current === this.deck.slides.length - 1; }

  nav(dir: 1 | -1) {
    if (!this.deck || this.transitioning) return;
    const n = this.current + dir;
    if (n < 0 || n >= this.deck.slides.length) return;
    this.transitioning = true;
    setTimeout(() => { this.current = n; this.transitioning = false; }, 250);
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (['ArrowRight', ' '].includes(e.key)) { e.preventDefault(); this.nav(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.nav(-1); }
  }

  stripNum(s: string): string { return s.replace(/^\d+\s*[—\-]\s*/, ''); }

  @HostListener('contextmenu', ['$event'])
  noCtx(e: Event) { e.preventDefault(); }
}
