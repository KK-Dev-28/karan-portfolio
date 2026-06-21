import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface MenuItem { name: string; desc: string; price: string; }
interface MenuCategory { name: string; items: MenuItem[]; }
interface Testimonial { quote: string; author: string; role: string; }
interface Service { title: string; desc: string; icon: string; }
interface PortfolioItem { title: string; category: string; image: string; }
interface ProcessStep { num: string; title: string; desc: string; }

interface Site {
  template: 'restaurant' | 'agency';
  name: string;
  tagline: string;
  heroImage: string;
  accent: string;

  // restaurant
  about?: string;
  menu?: MenuCategory[];
  gallery?: string[];
  hours?: string[];
  address?: string;
  phone?: string;

  // agency
  services?: Service[];
  portfolio?: PortfolioItem[];
  process?: ProcessStep[];

  testimonials?: Testimonial[];
}

const SITES: Record<string, Site> = {

  'lumiere-bistro': {
    template: 'restaurant',
    name: 'Lumière Bistro',
    tagline: 'Modern French Cuisine, Timeless Atmosphere',
    heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    accent: '#d4a657',
    about: 'Tucked into the heart of the city, Lumière Bistro brings together classic French technique and seasonal, locally-sourced ingredients. Our open kitchen, warm candlelight, and curated wine list create an atmosphere made for long, unhurried evenings.',
    menu: [
      {
        name: 'Starters',
        items: [
          { name: 'French Onion Soup', desc: 'Caramelised onions, gruyère, toasted baguette', price: '$12' },
          { name: 'Escargots de Bourgogne', desc: 'Garlic herb butter, sourdough', price: '$16' },
          { name: 'Beet & Goat Cheese Salad', desc: 'Candied walnuts, citrus vinaigrette', price: '$14' },
        ],
      },
      {
        name: 'Mains',
        items: [
          { name: 'Coq au Vin', desc: 'Slow-braised chicken, red wine, root vegetables', price: '$32' },
          { name: 'Steak Frites', desc: 'Grilled ribeye, herb butter, hand-cut fries', price: '$38' },
          { name: 'Wild Mushroom Risotto', desc: 'Parmesan, truffle oil, microgreens', price: '$26' },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Crème Brûlée', desc: 'Madagascar vanilla, caramelised sugar', price: '$10' },
          { name: 'Tarte Tatin', desc: 'Caramelised apple, vanilla bean ice cream', price: '$11' },
        ],
      },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80',
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80',
    ],
    hours: ['Mon – Thu: 5:00 PM – 10:00 PM', 'Fri – Sat: 5:00 PM – 11:30 PM', 'Sun: 5:00 PM – 9:00 PM'],
    address: '24 Rue de Lumière, Downtown Arts District',
    phone: '+1 (555) 014-7733',
    testimonials: [
      { quote: 'The most romantic dinner we\'ve had in years. The coq au vin was perfection.', author: 'Olivia R.', role: 'Google Review' },
      { quote: 'Impeccable service, the wine pairing elevated the entire meal.', author: 'Marcus T.', role: 'TripAdvisor' },
      { quote: 'A hidden gem — warm, intimate, and the desserts are unforgettable.', author: 'Priya N.', role: 'Google Review' },
    ],
  },

  'nova-digital': {
    template: 'agency',
    name: 'Nova Digital',
    tagline: 'We design and build brands that move people.',
    heroImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80',
    accent: '#7c5cff',
    services: [
      { icon: 'spark',  title: 'Brand Strategy',   desc: 'Positioning, identity systems, and messaging frameworks built for growth.' },
      { icon: 'layers', title: 'Product Design',   desc: 'End-to-end UX/UI for web and mobile — from research to pixel-perfect UI.' },
      { icon: 'code',   title: 'Web Development',  desc: 'High-performance Angular, React and headless CMS builds that scale.' },
      { icon: 'target', title: 'Growth Marketing', desc: 'Campaign strategy, SEO, and conversion-focused landing experiences.' },
    ],
    portfolio: [
      { title: 'Aurora Finance', category: 'FinTech · Web App',    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80' },
      { title: 'Verve Fitness',  category: 'Mobile App · Branding', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80' },
      { title: 'Loop Market',    category: 'E-Commerce',            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80' },
      { title: 'Hearth Studio',  category: 'Brand Identity',        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&q=80' },
    ],
    process: [
      { num: '01', title: 'Discover',  desc: 'Deep-dive workshops to understand your market, users and goals.' },
      { num: '02', title: 'Design',    desc: 'Wireframes through high-fidelity UI, validated with real users.' },
      { num: '03', title: 'Develop',   desc: 'Clean, scalable code shipped in agile sprints with full transparency.' },
      { num: '04', title: 'Deploy',    desc: 'Launch, monitor, and iterate with data-driven improvements.' },
    ],
    testimonials: [
      { quote: 'Nova rebuilt our entire product experience — conversions are up 38% since launch.', author: 'Daniela Cruz', role: 'CEO, Aurora Finance' },
      { quote: 'The most collaborative agency we\'ve worked with. They felt like an in-house team.', author: 'James Okafor', role: 'Founder, Loop Market' },
    ],
  },
};

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './site.page.html',
  styleUrls: ['./site.page.scss'],
})
export class SitePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  site: Site | null = null;
  slug = '';
  navOpen = false;
  year = new Date().getFullYear();

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.site = SITES[this.slug] || null;
  }

  toggleNav() { this.navOpen = !this.navOpen; }

  @HostListener('contextmenu', ['$event'])
  noCtx(e: Event) { e.preventDefault(); }
}
