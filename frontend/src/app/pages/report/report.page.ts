import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface MetricCard { value: string; label: string; change?: string; up?: boolean; color?: string; }
interface TableRow   { cells: string[]; highlight?: boolean; }
interface Section {
  type: 'hero' | 'metrics' | 'text' | 'table' | 'bars' | 'quote' | 'divider';
  tag?:     string;
  title?:   string;
  body?:    string[];
  metrics?: MetricCard[];
  headers?: string[];
  rows?:    TableRow[];
  bars?:    { label: string; pct: number; value: string; color: string }[];
  quote?:   string;
  quoteBy?: string;
}

interface Report { title: string; subtitle: string; company: string; date: string; sections: Section[]; }

const REPORTS: Record<string, Report> = {

  'annual-report-2024': {
    title: 'Annual Technology Report', subtitle: 'Full-Year Performance · Financial Highlights · Strategic Outlook',
    company: 'KK Development Studio', date: 'FY 2024',
    sections: [
      { type: 'hero' },
      { type: 'metrics', tag: 'Key Highlights', title: 'FY 2024 at a Glance',
        metrics: [
          { value: '₹48.2L', label: 'Total Revenue', change: '+32%', up: true, color: '#22c55e' },
          { value: '18', label: 'Projects Delivered', change: '+50%', up: true, color: '#3b82f6' },
          { value: '100%', label: 'On-Time Delivery', change: 'Same as FY23', up: true, color: '#f59e0b' },
          { value: '4.9/5', label: 'Client Satisfaction', change: '+0.2', up: true, color: '#8b5cf6' },
          { value: '0', label: 'Production Incidents', change: 'Target met', up: true, color: '#22c55e' },
          { value: '6', label: 'New Technologies Adopted', change: 'Signals, Resend, Neon+', up: true, color: '#f59e0b' },
        ]
      },
      { type: 'text', tag: 'Executive Summary', title: 'A Year of Compounding Growth',
        body: [
          'FY 2024 was a landmark year for KK Development Studio, marked by significant revenue growth, expanded service offerings, and the delivery of several high-impact client projects across FinTech, EdTech, and enterprise verticals.',
          'The adoption of Angular 19\'s standalone component architecture and NestJS CQRS patterns allowed the studio to deliver production-grade applications 40% faster than industry benchmarks, while maintaining exceptional code quality and zero critical security incidents.',
          'Strategic investments in tooling — particularly the migration from Gmail SMTP to Resend for transactional email infrastructure and the adoption of Neon\'s serverless PostgreSQL — resulted in a 28% reduction in operational costs and improved system reliability.',
          'Looking ahead to FY 2025, the studio is positioned to capitalize on growing demand for AI-integrated applications, with upcoming projects spanning intelligent workflow automation, real-time analytics dashboards, and multi-tenant SaaS platforms.',
        ]
      },
      { type: 'bars', tag: 'Revenue Breakdown', title: 'Revenue by Service Category',
        bars: [
          { label: 'Full-Stack Web Applications', pct: 45, value: '₹21.7L', color: '#3b82f6' },
          { label: 'Admin Dashboards & CRMs', pct: 22, value: '₹10.6L', color: '#8b5cf6' },
          { label: 'API Development & Integration', pct: 15, value: '₹7.2L', color: '#f59e0b' },
          { label: 'UI/UX Design & Prototyping', pct: 12, value: '₹5.8L', color: '#22c55e' },
          { label: 'Consulting & Architecture', pct: 6, value: '₹2.9L', color: '#f97316' },
        ]
      },
      { type: 'table', tag: 'Project Highlights', title: 'Selected Deliverables FY 2024',
        headers: ['Project', 'Category', 'Tech Stack', 'Timeline', 'Status'],
        rows: [
          { cells: ['FinTech Analytics Platform', 'Full-Stack', 'Angular + NestJS + PostgreSQL', '8 weeks', 'Live'], highlight: true },
          { cells: ['Healthcare CRM Portal', 'Web App', 'Angular 19 + NestJS + Neon', '10 weeks', 'Live'] },
          { cells: ['E-Commerce Platform', 'Full-Stack', 'Angular + NestJS + Razorpay', '12 weeks', 'Live'], highlight: true },
          { cells: ['Restaurant Booking System', 'Web App', 'Angular + Express + PostgreSQL', '6 weeks', 'Live'] },
          { cells: ['Inventory Management Suite', 'Dashboard', 'Angular + NestJS + TypeORM', '9 weeks', 'Live'], highlight: true },
          { cells: ['HR Management Portal', 'Enterprise', 'Angular + NestJS + PostgreSQL', '14 weeks', 'Live'] },
          { cells: ['Portfolio AI Platform', 'SaaS', 'Angular 19 + NestJS + Resend', '16 weeks', 'Live'], highlight: true },
        ]
      },
      { type: 'metrics', tag: 'Technical Performance', title: 'Engineering Metrics',
        metrics: [
          { value: '<2s', label: 'Avg Page Load Time', color: '#22c55e' },
          { value: '99.97%', label: 'Uptime Across All Systems', color: '#22c55e' },
          { value: 'A+', label: 'Security Headers Score', color: '#3b82f6' },
          { value: '94/100', label: 'Avg Lighthouse Score', color: '#f59e0b' },
          { value: '0 CVEs', label: 'Critical Vulnerabilities', color: '#22c55e' },
          { value: '87%', label: 'Test Coverage (Backend)', color: '#8b5cf6' },
        ]
      },
      { type: 'text', tag: 'Strategic Outlook', title: 'FY 2025 Priorities',
        body: [
          'Three strategic pillars will guide FY 2025: AI integration, enterprise scalability, and global reach. The studio will expand its Angular + NestJS stack expertise into AI-powered applications, leveraging the Anthropic Claude API for intelligent content generation, automated code review, and smart analytics.',
          'Investment in desktop application development — specifically Electron.js and Tauri frameworks — opens an entirely new service vertical, addressing the 35% of enterprise clients who require offline-capable solutions alongside their web applications.',
          'The introduction of a formal client onboarding survey-to-payment workflow (already live on the portfolio platform) is projected to reduce sales cycle length by 40% and improve project scope clarity, directly impacting delivery quality and client satisfaction scores.',
        ]
      },
      { type: 'quote', quote: 'The measure of a great software studio is not just what it builds, but how reliably, how cleanly, and how sustainably it builds — every single time.', quoteBy: 'Karan Kapoor, Founder' },
    ],
  },

  'edtech-market-2025': {
    title: 'EdTech Market Research Report', subtitle: 'Industry Analysis · Growth Projections · Investment Opportunities',
    company: 'KK Development Studio', date: 'Q1 2025',
    sections: [
      { type: 'hero' },
      { type: 'metrics', tag: 'Market Overview', title: 'EdTech Global Snapshot 2025',
        metrics: [
          { value: '$348B', label: 'Global EdTech Market Size', change: 'by 2030', color: '#3b82f6' },
          { value: '13.4%', label: 'CAGR 2023–2030', change: 'Sustained growth', up: true, color: '#22c55e' },
          { value: '1.2B', label: 'Online Learners Globally', change: '+18% YoY', up: true, color: '#f59e0b' },
          { value: '87%', label: 'Institutions with LMS', change: 'Post-pandemic', color: '#8b5cf6' },
          { value: '$15.4B', label: 'VC Investment in 2024', change: '+22% vs 2023', up: true, color: '#22c55e' },
          { value: '68%', label: 'Prefer Hybrid Learning', change: 'Global average', color: '#f59e0b' },
        ]
      },
      { type: 'text', tag: 'Executive Summary', title: 'The EdTech Opportunity in 2025',
        body: [
          'The global EdTech market continues its robust trajectory, driven by convergence of three macro forces: the post-COVID normalization of remote learning, growing employer demand for skill verification, and the rapid democratization of AI-powered personalized education.',
          'India represents the second-largest EdTech market globally, with $8.3B in 2024 revenue and 50M+ active learners on platforms like Byju\'s, Unacademy, and emerging micro-learning platforms. The K-12 and professional upskilling segments show the highest growth rates at 19% and 24% CAGR respectively.',
          'Critical technology gaps present significant opportunities for development studios: adaptive learning algorithms require full-stack integration of AI and real-time data pipelines; credentialing platforms need blockchain-verified certificates; and enterprise L&D platforms demand deep API integration with HR systems.',
        ]
      },
      { type: 'bars', tag: 'Segment Analysis', title: 'Market Share by Learning Segment',
        bars: [
          { label: 'K-12 Education', pct: 32, value: '$111B', color: '#3b82f6' },
          { label: 'Higher Education', pct: 24, value: '$83B', color: '#8b5cf6' },
          { label: 'Corporate Training & L&D', pct: 22, value: '$77B', color: '#f59e0b' },
          { label: 'Professional Certification', pct: 14, value: '$49B', color: '#22c55e' },
          { label: 'Language Learning', pct: 8, value: '$28B', color: '#f97316' },
        ]
      },
      { type: 'table', tag: 'Competitive Landscape', title: 'Key Players & Positioning',
        headers: ['Platform', 'Focus', 'Revenue (2024)', 'Growth', 'Strength'],
        rows: [
          { cells: ['Coursera', 'Higher Ed / Professional', '$635M', '+18%', 'University partnerships'], highlight: true },
          { cells: ['Udemy', 'Skills / Professional', '$745M', '+12%', 'Creator marketplace'] },
          { cells: ['LinkedIn Learning', 'Corporate L&D', '$1.2B est.', '+15%', 'Professional network'], highlight: true },
          { cells: ['Duolingo', 'Language Learning', '$531M', '+44%', 'Gamification + AI'] },
          { cells: ['Byju\'s (India)', 'K-12 India', '$1.0B', '-8%', 'Brand recognition'], highlight: false },
          { cells: ['Unacademy', 'Exam Prep India', '$290M', '+22%', 'Live coaching'], highlight: true },
        ]
      },
      { type: 'text', tag: 'Technology Trends', title: 'What Drives EdTech in 2025',
        body: [
          'AI-Powered Personalization: Adaptive learning engines that adjust content difficulty, pacing, and format based on learner performance data are moving from experimental to mainstream. Platforms implementing AI personalization report 34% higher course completion rates.',
          'Micro-Learning Formats: Content consumed in 3-7 minute segments shows 80% better retention versus traditional 45-minute lectures. Mobile-first platforms optimized for commute consumption are capturing younger demographics rapidly.',
          'Credentialing & Verification: Blockchain-verified digital credentials are solving employer trust issues around online certifications. Integration with LinkedIn and HR platforms creates verifiable skills portfolios.',
          'Live & Cohort-Based: Despite the asynchronous content boom, synchronous cohort models show higher completion (76% vs 12% for MOOCs) and premium pricing tolerance, suggesting a two-tier market emerging.',
        ]
      },
      { type: 'metrics', tag: 'India-Specific Data', title: 'India EdTech Metrics 2025',
        metrics: [
          { value: '$8.3B', label: 'India EdTech Market Size', color: '#f59e0b' },
          { value: '50M+', label: 'Active Online Learners', color: '#3b82f6' },
          { value: '19%', label: 'K-12 CAGR in India', color: '#22c55e' },
          { value: '24%', label: 'Professional Skills CAGR', color: '#22c55e' },
          { value: '2nd', label: 'Largest EdTech Market', color: '#8b5cf6' },
          { value: '62%', label: 'Learners on Mobile', color: '#f97316' },
        ]
      },
      { type: 'quote', quote: 'The future of education is not about technology replacing teachers. It\'s about technology giving every learner access to the quality of education that was previously only available to the privileged few.', quoteBy: 'EdTech Research Institute, 2025' },
    ],
  },
};

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  report: Report | null = null;
  slug = '';

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.report = REPORTS[this.slug] || null;
  }
}
