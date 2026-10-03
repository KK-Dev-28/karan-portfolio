import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }      from '../../components/navbar/navbar.component';
import { HeroComponent }        from '../../components/hero/hero.component';
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
import { SourceOfferingComponent } from '../../components/source-offering/source-offering.component';
import { LoadingScreenComponent } from '../../components/loading-screen/loading-screen.component';
import { DemosComponent } from '../../components/demos/demos.component';
import { BookingComponent } from '../../components/booking/booking.component';
import { EstimatorComponent } from '../../components/estimator/estimator.component';
import { DigitalProductsComponent } from '../../components/digital-products/digital-products.component';
import { SurveyBannerComponent } from '../../components/survey-banner/survey-banner.component';
import { StoryComponent } from '../../components/story/story.component';
import { SidebarNavComponent } from '../../components/sidebar-nav/sidebar-nav.component';
import { GithubActivityComponent } from '../../components/github-activity/github-activity.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    LoadingScreenComponent,
    SidebarNavComponent,
    NavbarComponent,
    HeroComponent,
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
    SourceOfferingComponent,
    DemosComponent,
    SurveyBannerComponent,
    StoryComponent,
    BookingComponent,
    EstimatorComponent,
    DigitalProductsComponent,
  ],
  /* The 3D cursor, the scrolling marquee and the command palette were removed
     from the page. They competed with the content for a visitor's attention and
     the cursor in particular overrode normal pointer behaviour, which reads as
     a demo rather than as a developer who ships. The components still exist and
     can be put back by restoring their import and tag. Theme and layout
     switching, which the palette also hosted, lives in the navbar and the
     sidebar. */
  template: `
    <app-loading-screen *ngIf="showLoader" (done)="showLoader = false"></app-loading-screen>
    <app-sidebar-nav></app-sidebar-nav>
    <div class="global-stars" aria-hidden="true"></div>
    <app-navbar></app-navbar>
    <app-hero></app-hero>
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
