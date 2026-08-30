import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }      from '../../components/navbar/navbar.component';
import { HeroComponent }        from '../../components/hero/hero.component';
import { MarqueeComponent }     from '../../components/marquee/marquee.component';
import { ServicesComponent }    from '../../components/services/services.component';
import { SkillsComponent }      from '../../components/skills/skills.component';
import { ProjectsComponent }    from '../../components/projects/projects.component';
import { JournalFeedComponent } from '../../components/journal-feed/journal-feed.component';
import { ExperienceComponent }  from '../../components/experience/experience.component';
import { GigsComponent }        from '../../components/gigs/gigs.component';
import { HirePricingComponent } from '../../components/hire-pricing/hire-pricing.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { ReviewsComponent }     from '../../components/reviews/reviews.component';
import { FaqComponent }         from '../../components/faq/faq.component';
import { NewsletterStripComponent } from '../../components/newsletter-strip/newsletter-strip.component';
import { ContactComponent }     from '../../components/contact/contact.component';
import { FooterComponent }      from '../../components/footer/footer.component';
import { Cursor3dComponent }    from '../../components/cursor-3d/cursor-3d.component';
import { SourceOfferingComponent } from '../../components/source-offering/source-offering.component';
import { LoadingScreenComponent } from '../../components/loading-screen/loading-screen.component';
import { DemosComponent } from '../../components/demos/demos.component';
import { BookingComponent } from '../../components/booking/booking.component';
import { EstimatorComponent } from '../../components/estimator/estimator.component';
import { DigitalProductsComponent } from '../../components/digital-products/digital-products.component';
import { SurveyBannerComponent } from '../../components/survey-banner/survey-banner.component';
import { StoryComponent } from '../../components/story/story.component';
import { SidebarNavComponent } from '../../components/sidebar-nav/sidebar-nav.component';
import { CommandPaletteComponent } from '../../components/command-palette/command-palette.component';
import { GithubActivityComponent } from '../../components/github-activity/github-activity.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    LoadingScreenComponent,
    SidebarNavComponent,
    CommandPaletteComponent,
    NavbarComponent,
    HeroComponent,
    MarqueeComponent,
    ServicesComponent,
    SkillsComponent,
    ProjectsComponent,
    GithubActivityComponent,
    JournalFeedComponent,
    ExperienceComponent,
    GigsComponent,
    HirePricingComponent,
    TestimonialsComponent,
    ReviewsComponent,
    FaqComponent,
    NewsletterStripComponent,
    ContactComponent,
    FooterComponent,
    Cursor3dComponent,
    SourceOfferingComponent,
    DemosComponent,
    SurveyBannerComponent,
    StoryComponent,
    BookingComponent,
    EstimatorComponent,
    DigitalProductsComponent,
  ],
  template: `
    <app-loading-screen *ngIf="showLoader" (done)="showLoader = false"></app-loading-screen>
    <app-command-palette></app-command-palette>
    <app-cursor-3d></app-cursor-3d>
    <app-sidebar-nav></app-sidebar-nav>
    <div class="global-stars" aria-hidden="true"></div>
    <app-navbar></app-navbar>
    <app-hero></app-hero>
    <app-marquee></app-marquee>
    <app-services></app-services>
    <app-skills></app-skills>
    <app-projects></app-projects>
    <app-github-activity></app-github-activity>
    <app-story></app-story>
    <app-demos></app-demos>
    <app-survey-banner></app-survey-banner>
    <app-journal-feed></app-journal-feed>
    <app-experience></app-experience>
    <app-gigs></app-gigs>
    <app-hire-pricing></app-hire-pricing>
    <app-booking></app-booking>
    <app-estimator></app-estimator>
    <app-digital-products></app-digital-products>
    <app-testimonials></app-testimonials>
    <app-reviews></app-reviews>
    <app-faq></app-faq>
    <app-source-offering></app-source-offering>
    <app-newsletter-strip></app-newsletter-strip>
    <app-contact></app-contact>
    <app-footer></app-footer>
  `,
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  showLoader = true;
  private revealObs!: IntersectionObserver;

  ngAfterViewInit() {
    this.revealObs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); this.revealObs.unobserve(e.target); } });
      },
      { threshold: 0.1 },
    );
    const scan = () => document.querySelectorAll('.reveal:not(.visible)').forEach(el => this.revealObs.observe(el));
    // Scan multiple times — first pass for static elements, later passes catch async API-loaded items
    [400, 1200, 2500, 4000].forEach(ms => setTimeout(scan, ms));
  }

  ngOnDestroy() { this.revealObs?.disconnect(); }
}
