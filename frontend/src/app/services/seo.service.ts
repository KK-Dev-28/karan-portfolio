import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Canonical production origin. Used when the app runs somewhere without a
 *  usable `location` (or on a preview URL) so crawlers always resolve one host. */
export const SITE_URL = 'https://karan-portfolio-six-sigma.vercel.app';
export const SITE_NAME = 'Karan Kapoor';
export const DEFAULT_IMAGE = `${SITE_URL}/assets/og-image.png`;

export interface SeoTags {
  /** Page title. ` — Karan Kapoor` is appended unless `rawTitle` is set. */
  title: string;
  description: string;
  /** Route path, e.g. `/blog` or `/blog/posts/my-slug`. Defaults to current URL. */
  path?: string;
  /** Absolute or `/assets/…` relative image URL. Defaults to the site OG card. */
  image?: string;
  /** `website` (default) or `article` for blog posts / case studies. */
  type?: 'website' | 'article';
  /** Keep admin/checkout/utility routes out of search results. */
  noindex?: boolean;
  /** Use `title` verbatim instead of appending the site name. */
  rawTitle?: boolean;
  /** ISO date — emitted as `article:published_time` when type is `article`. */
  published?: string;
  author?: string;
}

/**
 * Single owner of every per-route SEO tag.
 *
 * This is a client-rendered SPA, so `index.html` carries the defaults that
 * non-JS crawlers see; this service rewrites them on navigation for crawlers
 * that do execute JS (Google) and for link-preview correctness after a
 * client-side route change. Tags it does not own are left untouched.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private title: Title, private meta: Meta) {}

  update(tags: SeoTags) {
    const fullTitle = tags.rawTitle ? tags.title : `${tags.title} — ${SITE_NAME}`;
    const url = this.absolute(tags.path ?? this.currentPath());
    const image = this.absolute(tags.image ?? DEFAULT_IMAGE);
    const type = tags.type ?? 'website';

    this.title.setTitle(fullTitle);

    this.setName('description', tags.description);
    this.setName('robots', tags.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    this.setProp('og:title', fullTitle);
    this.setProp('og:description', tags.description);
    this.setProp('og:url', url);
    this.setProp('og:image', image);
    this.setProp('og:type', type);
    this.setProp('og:site_name', SITE_NAME);

    // index.html declares 1200×630 for the default card. A post supplying its
    // own cover is an unknown size, so drop the dimensions rather than lie
    // about them — scrapers handle a missing size fine, a wrong one badly.
    if (image === DEFAULT_IMAGE) {
      this.setProp('og:image:width', '1200');
      this.setProp('og:image:height', '630');
    } else {
      this.meta.removeTag("property='og:image:width'");
      this.meta.removeTag("property='og:image:height'");
    }

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', fullTitle);
    this.setName('twitter:description', tags.description);
    this.setName('twitter:image', image);

    // Article-only tags: remove them on non-article routes so a stale
    // published date can't survive a client-side navigation.
    if (type === 'article') {
      if (tags.published) this.setProp('article:published_time', tags.published);
      if (tags.author) this.setProp('article:author', tags.author);
    } else {
      this.meta.removeTag("property='article:published_time'");
      this.meta.removeTag("property='article:author'");
    }

    this.setCanonical(url);
  }

  /** Inject (or replace) a JSON-LD block. One block per `id`. */
  setJsonLd(id: string, data: unknown) {
    if (typeof document === 'undefined') return;
    const elementId = `ld-${id}`;
    document.getElementById(elementId)?.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = elementId;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /** Drop a JSON-LD block so it can't outlive its route. */
  removeJsonLd(id: string) {
    if (typeof document === 'undefined') return;
    document.getElementById(`ld-${id}`)?.remove();
  }

  private setName(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }

  private setProp(property: string, content: string) {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private setCanonical(url: string) {
    if (typeof document === 'undefined') return;
    let link = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private currentPath(): string {
    return typeof location === 'undefined' ? '/' : location.pathname;
  }

  /** Resolves a path or already-absolute URL against the canonical origin. */
  private absolute(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }
}
