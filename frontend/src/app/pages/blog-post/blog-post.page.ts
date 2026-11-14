import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  /** For an HTML post: the rendered design, or the source behind it. */
  htmlView: 'design' | 'code' = 'design';
  copied = false;
  private sanitizer = inject(DomSanitizer);
  private framed: { body: string; doc: SafeHtml } | null = null;

  get isHtmlPost() { return this.post?.format === 'html'; }

  /**
   * The post body wrapped in a minimal document and handed to a sandboxed
   * iframe. The frame has no access to this origin, so a post's own scripts
   * and styles cannot reach the site around them.
   */
  get frameDoc(): SafeHtml | null {
    const body: string = this.post?.body ?? '';
    if (!body) return null;
    if (this.framed?.body !== body) {
      const doc = /<html[\s>]/i.test(body)
        ? body
        : `<!doctype html><html><head><meta charset="utf-8">`
          + `<meta name="viewport" content="width=device-width,initial-scale=1">`
          + `<style>html,body{margin:0;padding:16px;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;`
          + `background:#fff;color:#16181d;-webkit-text-size-adjust:100%}*{box-sizing:border-box}img,video,canvas,svg{max-width:100%}</style>`
          + `</head><body>${body}</body></html>`;
      // The iframe is sandboxed, so this document can only affect itself.
      this.framed = { body, doc: this.sanitizer.bypassSecurityTrustHtml(doc) };
    }
    return this.framed.doc;
  }

  copyCode() {
    const body: string = this.post?.body ?? '';
    navigator.clipboard?.writeText(body).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1800);
    }).catch(() => {});
  }

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
    return body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
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
