import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
  badge?: string;
  icon: string;
  featured?: boolean;
  waText: string;
}

@Component({
  selector: 'app-digital-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './digital-products.component.html',
  styleUrls: ['./digital-products.component.scss'],
})
export class DigitalProductsComponent {
  products: Product[] = [
    {
      id: 'portfolio-starter',
      icon: '🚀',
      title: 'Portfolio Starter Kit',
      desc: 'The full Angular 19 + NestJS portfolio template — clean architecture, CMS, admin panel, Razorpay, CI/CD. Deploy-ready in under an hour.',
      bullets: ['Angular 19 standalone + NestJS', 'Full admin CMS dashboard', 'Payment integration', 'Railway + Vercel CI/CD config', 'TypeORM + PostgreSQL setup'],
      badge: 'Best Seller',
      featured: true,
      waText: 'Hi Karan, I\'m interested in the Portfolio Starter Kit. Can you share pricing details?',
    },
    {
      id: 'api-boilerplate',
      icon: '⚡',
      title: 'NestJS API Boilerplate',
      desc: 'Production-ready NestJS starter: JWT auth, CQRS, throttling, Swagger, TypeORM, CORS, Railway deploy. Skip weeks of setup.',
      bullets: ['JWT auth + role guards', 'CQRS command/handler pattern', 'Swagger + rate limiting', 'TypeORM + Postgres migrations', 'Docker + Railway ready'],
      waText: 'Hi Karan, I\'m interested in the NestJS API Boilerplate. Can you share pricing details?',
    },
    {
      id: 'angular-ui-kit',
      icon: '🎨',
      title: 'Angular UI Component Kit',
      desc: 'Charcoal+gold design system — 20+ production components: cards, modals, forms, charts, tables, animations. Drop into any Angular 17+ project.',
      bullets: ['20+ standalone components', 'CSS custom properties theme', 'Intersection observer reveals', 'Dark mode ready', 'SCSS design token system'],
      waText: 'Hi Karan, I\'m interested in the Angular UI Component Kit. Can you share pricing details?',
    },
  ];

  waUrl(text: string): string {
    return `/api/wa?text=${encodeURIComponent(text)}`;
  }
}
