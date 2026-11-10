import { Component, AfterViewInit, ElementRef, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { McProcessComponent } from '../../components/mc/mc-process.component';
import { McFestiveComponent } from '../../components/mc/mc-festive.component';
import { McMissionLogComponent } from '../../components/mc/mc-mission-log.component';
import { McCrewComponent } from '../../components/mc/mc-crew.component';
import { McScopeComponent } from '../../components/mc/mc-scope.component';
import { McCopilotComponent } from '../../components/mc/mc-copilot.component';
import { McStarfieldComponent } from '../../components/mc/mc-starfield.component';
import { installMcFx } from '../../components/mc/mc-fx';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule, LoadingScreenComponent, NavbarComponent, BugHuntComponent, PopularityComponent,
    McHeroComponent, McArchitectureComponent, McJourneyComponent, McServicesComponent, McWorkComponent,
    McKitsComponent, McReviewsComponent, McFaqComponent, McContactComponent, McFooterComponent, McSectionNavComponent, McStarfieldComponent, McProcessComponent, McFestiveComponent, McMissionLogComponent, McCrewComponent, McScopeComponent, McCopilotComponent,
  ],
  /* The page follows the Figma file "Karan Kapoor — Portfolio Mission Control
     (Full Design)", in its section order: radar hero, system architecture, the
     journey road, the six service modules, the sprint process, selected work, starter kits and
     engagement tiers, reviews, FAQ and the closing contact. The bug-hunt game
     and the public visitor stats are extras kept from the previous page. The
     earlier section components (projects, skills, story, pricing, …) are
     untouched and can be put back by restoring an import and a tag. */
  /* Only the navbar and hero render with the page; everything else renders
     in idle time right after (each @defer block is its own lazy chunk and
     its own task). Rendering all fifteen sections up front was a 2.5s
     main-thread block on mid-range phones and held back the first paint. */
  template: `
    <app-loading-screen *ngIf="showLoader" (done)="showLoader = false"></app-loading-screen>
    <app-navbar ngSkipHydration></app-navbar>
    <mc-hero></mc-hero>

    @defer (on idle) {
      <mc-starfield></mc-starfield>
      <mc-festive></mc-festive>
      <mc-mission-log [ids]="sections"></mc-mission-log>
      <mc-section-nav [ids]="sections"></mc-section-nav>
      <mc-copilot></mc-copilot>
    }
    @defer (on idle) { <mc-architecture></mc-architecture> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-journey></mc-journey> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-services></mc-services> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-process></mc-process> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-work></mc-work> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <app-bug-hunt></app-bug-hunt> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-kits></mc-kits> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-scope></mc-scope> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-reviews></mc-reviews> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-faq></mc-faq> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <app-popularity></app-popularity> }
    @defer (on idle) { <mc-contact></mc-contact> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-crew></mc-crew> } @placeholder { <div class="mc-ph"></div> }
    @defer (on idle) { <mc-footer></mc-footer> }
  `,
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  showLoader = true;
  readonly sections = ['hero', 'architecture', 'journey', 'services', 'process', 'projects', 'play', 'kits', 'scope', 'reviews', 'faq', 'contact', 'crew'];
  private revealObs!: IntersectionObserver;
  private host = inject(ElementRef<HTMLElement>);
  private removeFx?: () => void;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return; // prerender: no DOM APIs
    this.removeFx = installMcFx(this.host.nativeElement);
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

  ngOnDestroy() { this.revealObs?.disconnect(); this.removeFx?.(); }
}
