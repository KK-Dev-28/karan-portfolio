import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID, Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VisitorService } from './services/visitor.service';
import { ThemeService } from './services/theme.service';
import { SeoService, SeoTags } from './services/seo.service';
import { WelcomeCardComponent } from './components/welcome-card/welcome-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WelcomeCardComponent],
  // The outlet renders inside <main>, so every route gets a main landmark and
  // a working skip-link target without each page having to declare one.
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <main id="main-content" tabindex="-1"><router-outlet></router-outlet></main>
    <app-welcome-card ngSkipHydration />
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private visitor: VisitorService,
    private themeSvc: ThemeService,
    private seo: SeoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    // Theme storage and the console greeting are browser-only; the home page is
    // also rendered at build time (prerender), where neither exists.
    if (isPlatformBrowser(this.platformId)) {
      this.themeSvc.init();
      this.greetDevtools();
    }
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.visitor.log(e.urlAfterRedirects);
        this.applyRouteSeo(e.urlAfterRedirects);
      });
  }

  /** A note for the developers and recruiters who open devtools. */
  private greetDevtools() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f59e0b';
    console.log(
      '%cKK.%c  Hey, you opened the console. 👋\n\n'
      + 'This site is Angular 19 + NestJS + PostgreSQL, built by hand.\n'
      + 'Like what you see under the hood? Let\'s talk → /#contact\n'
      + 'Bored? Squash some bugs → /#play',
      `font:700 28px "Space Grotesk",sans-serif;color:${accent}`,
      'font:13px/1.6 "JetBrains Mono",monospace;color:inherit',
    );
  }

  /**
   * Applies the `data.seo` declared on the matched route (see app.config.ts).
   * Slug pages fetch their content asynchronously and call SeoService again
   * once it arrives, so their real title replaces this placeholder.
   */
  private applyRouteSeo(url: string) {
    let deepest = this.route;
    while (deepest.firstChild) deepest = deepest.firstChild;

    const tags = deepest.snapshot.data['seo'] as SeoTags | undefined;
    if (!tags) return;

    // Strip query/fragment so the canonical URL stays a single clean address.
    const path = tags.path ?? url.split(/[?#]/)[0];
    this.seo.update({ ...tags, path });
  }
}
