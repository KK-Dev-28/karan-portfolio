import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling, Routes } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { HomePageComponent } from './pages/home/home.page';

/**
 * The home page stays eagerly imported — it is the landing route for nearly
 * every visitor, so deferring it would only add a round-trip before first
 * paint. Every other route is `loadComponent`, which keeps the admin panel,
 * blog editor, deck/report/site builders and demo pages out of the initial
 * bundle; they are fetched on demand when their route is first visited.
 *
 * `data.seo` is applied by AppComponent on every navigation (see SeoService).
 * Slug routes carry a placeholder here and overwrite it from their own
 * component once the content has loaded.
 */
const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    data: {
      seo: {
        title: 'Full Stack Developer',
        description:
          'Karan Kapoor — Full Stack Developer building production-grade apps with Angular, ASP.NET Web API, NestJS and PostgreSQL. Available for freelance and remote work from Ludhiana, Punjab, India.',
        path: '/',
      },
    },
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPageComponent),
    data: { seo: { title: 'Admin', description: 'Portfolio administration.', noindex: true } },
  },
  {
    path: 'payment/success',
    loadComponent: () => import('./pages/payment-success/payment-success.page').then(m => m.PaymentSuccessPageComponent),
    data: { seo: { title: 'Payment successful', description: 'Your payment went through.', noindex: true } },
  },
  {
    path: 'payment/cancel',
    loadComponent: () => import('./pages/payment-cancel/payment-cancel.page').then(m => m.PaymentCancelPageComponent),
    data: { seo: { title: 'Payment cancelled', description: 'Your payment was cancelled.', noindex: true } },
  },
  {
    path: 'insights',
    loadComponent: () => import('./pages/insights/insights.page').then(m => m.InsightsPageComponent),
    data: {
      seo: {
        title: 'Insights',
        description: 'Practical engineering write-ups on building and shipping production web apps — architecture, performance and delivery lessons from real projects.',
        path: '/insights',
      },
    },
  },
  {
    path: 'resume-review',
    loadComponent: () => import('./pages/resume-review/resume-review.page').then(m => m.ResumeReviewPageComponent),
    data: {
      seo: {
        title: 'Free Resume Review',
        description: 'Send your developer resume and get specific, actionable feedback on structure, wording and impact — free.',
        path: '/resume-review',
      },
    },
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog.page').then(m => m.BlogPageComponent),
    data: {
      seo: {
        title: 'Blog',
        description: 'Posts on Angular, NestJS, .NET and PostgreSQL — patterns, pitfalls and notes from shipping real software.',
        path: '/blog',
      },
    },
  },
  {
    path: 'blog-write',
    loadComponent: () => import('./pages/blog-write/blog-write.page').then(m => m.BlogWritePageComponent),
    data: { seo: { title: 'Write a post', description: 'Draft a new blog post.', noindex: true } },
  },
  {
    path: 'blog/u/:username',
    loadComponent: () => import('./pages/blog-profile/blog-profile.page').then(m => m.BlogProfilePageComponent),
    data: { seo: { title: 'Author', description: 'Posts by this author.' } },
  },
  {
    path: 'blog/posts/:slug',
    loadComponent: () => import('./pages/blog-post/blog-post.page').then(m => m.BlogPostPageComponent),
    data: { seo: { title: 'Blog', description: 'A post by Karan Kapoor.' } },
  },
  {
    path: 'ai-tools',
    loadComponent: () => import('./pages/ai-tools/ai-tools.page').then(m => m.AiToolsPageComponent),
    data: {
      seo: {
        title: 'AI Tools',
        description: 'A small set of free AI-assisted tools for developers, built and hosted by Karan Kapoor.',
        path: '/ai-tools',
      },
    },
  },
  // Deck / report / site routes render per-client deliverables. They are
  // reachable by link but deliberately kept out of search results.
  {
    path: 'deck/:slug',
    loadComponent: () => import('./pages/deck/deck.page').then(m => m.DeckPageComponent),
    data: { seo: { title: 'Deck', description: 'Presentation deck.', noindex: true } },
  },
  {
    path: 'report/:slug',
    loadComponent: () => import('./pages/report/report.page').then(m => m.ReportPageComponent),
    data: { seo: { title: 'Report', description: 'Project report.', noindex: true } },
  },
  {
    path: 'site/:slug',
    loadComponent: () => import('./pages/site/site.page').then(m => m.SitePageComponent),
    data: { seo: { title: 'Site', description: 'Generated site preview.', noindex: true } },
  },
  {
    path: 'demo/analytics',
    loadComponent: () => import('./pages/demo-analytics/demo-analytics.page').then(m => m.DemoAnalyticsPageComponent),
    data: {
      seo: {
        title: 'Analytics Dashboard Demo',
        description: 'A live demo of an analytics dashboard — charts, filters and drill-downs built with Angular.',
        path: '/demo/analytics',
      },
    },
  },
  {
    path: 'case-study/:slug',
    loadComponent: () => import('./pages/case-study/case-study.page').then(m => m.CaseStudyPageComponent),
    data: { seo: { title: 'Case Study', description: 'A project case study by Karan Kapoor.' } },
  },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      // Restore scroll position on back/forward, and honour #fragment links so
      // the navbar's in-page anchors work after a cross-route navigation.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};
