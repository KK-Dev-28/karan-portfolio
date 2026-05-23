import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BlogApiService } from '../../services/blog.service';

@Component({
  selector: 'app-blog-post-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-post.page.html',
  styleUrls: ['./blog-post.page.scss'],
})
export class BlogPostPageComponent implements OnInit {
  post: any = null;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blog: BlogApiService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      if (!slug) { this.router.navigate(['/blog']); return; }
      this.loading = true; this.notFound = false;
      this.blog.getPost(slug).subscribe({
        next: post => { this.post = post; this.loading = false; },
        error: () => { this.loading = false; this.notFound = true; },
      });
    });
  }

  get readingTime(): number {
    if (!this.post?.body) return 1;
    return Math.max(1, Math.ceil(this.post.body.split(/\s+/).length / 200));
  }

  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return days < 30
      ? `${days}d ago`
      : new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get bodyParagraphs(): string[] {
    if (!this.post?.body) return [];
    return this.post.body.split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean);
  }
}
