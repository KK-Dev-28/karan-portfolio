import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BlogApiService } from '../../services/blog.service';
import { ReactionBarComponent } from '../../components/reaction-bar/reaction-bar.component';
import { SeoService, SITE_URL } from '../../services/seo.service';

@Component({
  selector: 'app-blog-post-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactionBarComponent],
  templateUrl: './blog-post.page.html',
  styleUrls: ['./blog-post.page.scss'],
})
export class BlogPostPageComponent implements OnInit, OnDestroy {
  post: any = null;
  loading = true;
  notFound = false;

  ngOnDestroy() {
    // Don't let this post's structured data follow the visitor to the next route.
    this.seo.removeJsonLd('blogposting');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blog: BlogApiService,
    private seo: SeoService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      if (!slug) { this.router.navigate(['/blog']); return; }
      this.loading = true; this.notFound = false;
      this.blog.getPost(slug).subscribe({
        next: post => {
          this.post = post; this.loading = false;
          this.applySeo(post, slug);
        },
        error: () => {
          this.loading = false; this.notFound = true;
          // A missing post must not be indexed under the requested slug.
          this.seo.update({
            title: 'Post not found',
            description: 'This post could not be found.',
            path: `/blog/posts/${slug}`,
            noindex: true,
          });
        },
      });
    });
  }

  /** Per-post title, description, share image and BlogPosting structured data. */
  private applySeo(post: any, slug: string) {
    const path = `/blog/posts/${slug}`;
    const description: string = (post?.excerpt || this.plainSummary(post?.body) || 'A post by Karan Kapoor.').slice(0, 300);
    const author: string = post?.authorName || post?.author || 'Karan Kapoor';
    const published: string | undefined = post?.publishedAt || post?.createdAt;

    this.seo.update({
      title: post?.title || 'Post',
      description,
      path,
      type: 'article',
      image: post?.coverImage || undefined,
      published,
      author,
    });

    this.seo.setJsonLd('blogposting', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post?.title,
      description,
      url: `${SITE_URL}${path}`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
      ...(post?.coverImage ? { image: post.coverImage } : {}),
      ...(published ? { datePublished: published } : {}),
      author: { '@type': 'Person', name: author },
      ...(Array.isArray(post?.tags) && post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    });
  }

  /** First ~200 chars of body text, used when a post has no excerpt. */
  private plainSummary(body?: string): string {
    if (!body) return '';
    return body.replace(/\s+/g, ' ').trim().slice(0, 200);
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
