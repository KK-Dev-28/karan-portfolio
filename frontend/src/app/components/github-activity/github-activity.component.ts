import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { SoundService } from '../../services/sound.service';

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  url: string;
  updatedAt: string;
}

interface LanguageSlice { name: string; pct: number; color: string; }

/* GitHub's own colours for the languages actually present in these accounts.
   Anything unrecognised falls back to a neutral grey rather than being given
   an invented identity. */
const LANGUAGE_COLOURS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  'C#': '#178600',
  Python: '#3572A5',
  Java: '#b07219',
};
const FALLBACK_COLOUR = '#8b949e';

@Component({
  selector: 'app-github-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './github-activity.component.html',
  styleUrls: ['./github-activity.component.scss'],
})
export class GithubActivityComponent implements OnInit {
  private http = inject(HttpClient);
  public readonly sound = inject(SoundService);

  /* Both accounts are mine; the work is split across them, so a count from
     either one alone would understate it. */
  private readonly accounts = ['KK-Dev-28', 'Karan28012002'];

  username = 'KK-Dev-28';
  profileUrl = 'https://github.com/KK-Dev-28';

  /* Only figures the public REST API actually returns. Commit totals and
     yearly contribution counts need an authenticated GraphQL call, so they are
     not shown rather than guessed — the previous hardcoded values (1,420+
     commits, 840 contributions, 18 repos, 6 gists) matched nothing real. */
  stats = { repositories: 0, stars: 0, followers: 0 };

  languages: LanguageSlice[] = [];
  featuredRepos: GitHubRepo[] = [];

  loading = true;
  failed = false;

  /* Unauthenticated GitHub allows 60 requests an hour per IP. Caching the
     result for the tab keeps a visitor who moves around the site from spending
     that budget on every return to the home page. */
  private readonly cacheKey = 'gh_activity_v1';
  private readonly cacheTtlMs = 30 * 60 * 1000;

  ngOnInit(): void {
    const cached = this.readCache();
    if (cached) { this.apply(cached); return; }

    forkJoin({
      users: forkJoin(this.accounts.map(u =>
        this.http.get<any>(`https://api.github.com/users/${u}`).pipe(catchError(() => of(null))))),
      repos: forkJoin(this.accounts.map(u =>
        this.http.get<any[]>(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)
          .pipe(catchError(() => of([] as any[]))))),
    }).pipe(
      map(({ users, repos }) => {
        const allRepos = repos.flat().filter(r => r && !r.fork && !r.private);
        const validUsers = users.filter(Boolean);
        return {
          repositories: validUsers.reduce((n, u) => n + (u.public_repos ?? 0), 0),
          followers:    validUsers.reduce((n, u) => n + (u.followers ?? 0), 0),
          stars:        allRepos.reduce((n, r) => n + (r.stargazers_count ?? 0), 0),
          repos: allRepos,
        };
      }),
      catchError(() => of(null)),
    ).subscribe(result => {
      if (!result || !result.repos.length) { this.loading = false; this.failed = true; return; }
      this.writeCache(result);
      this.apply(result);
    });
  }

  private apply(r: any): void {
    this.stats = { repositories: r.repositories, stars: r.stars, followers: r.followers };
    this.featuredRepos = GithubActivityComponent.toFeatured(r.repos);
    this.languages = GithubActivityComponent.toLanguages(r.repos);
    this.loading = false;
    this.failed = false;
  }

  /* Most-starred first, then most recently pushed, so the strongest work leads
     without any hand-picking that could drift out of date. */
  private static toFeatured(repos: any[]): GitHubRepo[] {
    return [...repos]
      .sort((a, b) =>
        (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0) ||
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4)
      .map(r => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description || 'No description set on the repository.',
        stars: r.stargazers_count ?? 0,
        forks: r.forks_count ?? 0,
        language: r.language || 'Other',
        languageColor: LANGUAGE_COLOURS[r.language] ?? FALLBACK_COLOUR,
        url: r.html_url,
        updatedAt: r.updated_at,
      }));
  }

  /* Share of repositories by primary language. GitHub reports one language per
     repository here; a byte-accurate split would need a call per repo, which is
     not worth the rate-limit budget for a summary bar. */
  private static toLanguages(repos: any[]): LanguageSlice[] {
    const counts = new Map<string, number>();
    for (const r of repos) {
      if (!r.language) continue;
      counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (!total) return [];

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({
        name,
        pct: Math.round((n / total) * 100),
        color: LANGUAGE_COLOURS[name] ?? FALLBACK_COLOUR,
      }));
  }

  private readCache(): any | null {
    try {
      const raw = sessionStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const { at, data } = JSON.parse(raw);
      return Date.now() - at < this.cacheTtlMs ? data : null;
    } catch { return null; }
  }

  private writeCache(data: any): void {
    try {
      sessionStorage.setItem(this.cacheKey, JSON.stringify({ at: Date.now(), data }));
    } catch { /* private mode or full quota — the page works without the cache */ }
  }
}
