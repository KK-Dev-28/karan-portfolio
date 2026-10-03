import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }      from '../../components/navbar/navbar.component';
import { HeroComponent }        from '../../components/hero/hero.component';
import { ServicesComponent }    from '../../components/services/services.component';
import { SkillsComponent }      from '../../components/skills/skills.component';
import { ProjectsComponent }    from '../../components/projects/projects.component';
import { ExperienceComponent }  from '../../components/experience/experience.component';
import { HirePricingComponent } from '../../components/hire-pricing/hire-pricing.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { ReviewsComponent }     from '../../components/reviews/reviews.component';
import { FaqComponent }         from '../../components/faq/faq.component';
import { ContactComponent }     from '../../components/contact/contact.component';
import { FooterComponent }      from '../../components/footer/footer.component';
import { LoadingScreenComponent } from '../../components/loading-screen/loading-screen.component';
import { DigitalProductsComponent } from '../../components/digital-products/digital-products.component';
import { StoryComponent } from '../../components/story/story.component';
import { SidebarNavComponent } from '../../components/sidebar-nav/sidebar-nav.component';

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
    ExperienceComponent,
    HirePricingComponent,
    TestimonialsComponent,
    ReviewsComponent,
    FaqComponent,
    ContactComponent,
    FooterComponent,
    StoryComponent,
    DigitalProductsComponent,
  ],
  /* Nine sections were taken off this page: GitHub activity, demos, the survey
     banner, the journal feed, gigs, booking, the estimator, source offering and
     the newsletter strip. Twenty-two sections meant the work itself sat sixth,
     below services and skills, and anything past about the tenth was reached by
     almost nobody — so the weakest material was crowding out the strongest. The
     components are untouched and a removed section is one import and one tag
     from coming back, or from getting a route of its own.

     The 3D cursor, the scrolling marquee and the command palette were removed
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

    <!-- Proof first. Work is the thing a visitor is deciding on, and it used to
         sit behind services and skills where many never reached it. -->
    <app-hero></app-hero>
    <app-projects></app-projects>
    <app-skills></app-skills>

    <!-- Who I am: career and education, then the story behind it. -->
    <app-experience></app-experience>
    <app-story></app-story>

    <!-- What I can be hired for, and on what terms. -->
    <app-services></app-services>
    <app-hire-pricing></app-hire-pricing>
    <app-digital-products></app-digital-products>

    <!-- Other people vouching, and the form that collects it. -->
    <app-testimonials></app-testimonials>
    <app-reviews></app-reviews>

    <app-faq></app-faq>
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
