import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BlogApiService } from '../../services/blog.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-blog-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-profile.page.html',
  styleUrls: ['./blog-profile.page.scss'],
})
export class BlogProfilePageComponent implements OnInit {
  profile: any = null;
  posts: any[] = [];
  loading = true;
  notFound = false;

  constructor(private route: ActivatedRoute, private blog: BlogApiService, private seo: SeoService) {}

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.blog.getProfile(username).subscribe({
      next: p => {
        this.profile = p;
        const name = p?.displayName || p?.name || username;
        this.seo.update({
          title: `${name} — Posts`,
          description: p?.bio || `Blog posts written by ${name}.`,
          path: `/blog/u/${username}`,
        });
        this.loadPosts(username);
      },
      error: () => {
        this.notFound = true; this.loading = false;
        this.seo.update({
          title: 'Author not found',
          description: 'This author profile could not be found.',
          path: `/blog/u/${username}`,
          noindex: true,
        });
      },
    });
  }

  loadPosts(username: string) {
    this.blog.getUserPosts(username).subscribe({
      next: p => { this.posts = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  timeAgo(d: string): string {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  excerpt(body: string): string { return body?.length > 120 ? body.slice(0, 120).trimEnd() + '…' : body; }
}
