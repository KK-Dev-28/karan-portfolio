import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VisitorService } from './services/visitor.service';
import { ThemeService } from './services/theme.service';
import { SeoService, SeoTags } from './services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // The outlet renders inside <main>, so every route gets a main landmark and
  // a working skip-link target without each page having to declare one.
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <main id="main-content" tabindex="-1"><router-outlet></router-outlet></main>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private visitor: VisitorService,
    private themeSvc: ThemeService,
    private seo: SeoService,
  ) {}

  ngOnInit() {
    this.themeSvc.init();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.visitor.log(e.urlAfterRedirects);
        this.applyRouteSeo(e.urlAfterRedirects);
      });
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
