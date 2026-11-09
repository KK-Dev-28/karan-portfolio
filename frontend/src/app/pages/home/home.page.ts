import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }      from '../../components/navbar/navbar.component';
import { LoadingScreenComponent } from '../../components/loading-screen/loading-screen.component';
import { BugHuntComponent } from '../../components/bug-hunt/bug-hunt.component';
import { PopularityComponent } from '../../components/popularity/popularity.component';
import { McHeroComponent } from '../../components/mc/mc-hero.component';
import { McArchitectureComponent } from '../../components/mc/mc-architecture.component';
import { McJourneyComponent } from '../../components/mc/mc-journey.component';
import { McServicesComponent } from '../../components/mc/mc-services.component';
import { McWorkComponent } from '../../components/mc/mc-work.component';
import { McKitsComponent } from '../../components/mc/mc-kits.component';
import { McReviewsComponent } from '../../components/mc/mc-reviews.component';
import { McFaqComponent } from '../../components/mc/mc-faq.component';
import { McContactComponent } from '../../components/mc/mc-contact.component';
import { McFooterComponent } from '../../components/mc/mc-footer.component';
import { McSectionNavComponent } from '../../components/mc/mc-section-nav.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule, LoadingScreenComponent, NavbarComponent, BugHuntComponent, PopularityComponent,
    McHeroComponent, McArchitectureComponent, McJourneyComponent, McServicesComponent, McWorkComponent,
    McKitsComponent, McReviewsComponent, McFaqComponent, McContactComponent, McFooterComponent, McSectionNavComponent,
  ],
  /* The page follows the Figma file "Karan Kapoor — Portfolio Mission Control
     (Full Design)", in its section order: radar hero, system architecture, the
     journey road, the six service modules, selected work, starter kits and
     engagement tiers, reviews, FAQ and the closing contact. The bug-hunt game
     and the public visitor stats are extras kept from the previous page. The
     earlier section components (projects, skills, story, pricing, …) are
     untouched and can be put back by restoring an import and a tag. */
  template: `
    <app-loading-screen *ngIf="showLoader" (done)="showLoader = false"></app-loading-screen>
    <div class="global-stars" aria-hidden="true"></div>
    <app-navbar></app-navbar>
    <mc-section-nav [ids]="sections"></mc-section-nav>

    <mc-hero></mc-hero>
    <mc-architecture></mc-architecture>
    <mc-journey></mc-journey>
    <mc-services></mc-services>
    <mc-work></mc-work>
    <app-bug-hunt></app-bug-hunt>
    <mc-kits></mc-kits>
    <mc-reviews></mc-reviews>
    <mc-faq></mc-faq>
    <app-popularity></app-popularity>
    <mc-contact></mc-contact>
    <mc-footer></mc-footer>
  `,
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  showLoader = true;
  readonly sections = ['hero', 'architecture', 'journey', 'services', 'projects', 'play', 'kits', 'reviews', 'faq', 'contact'];
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
