// Shared pieces for the Mission Control home sections (components/mc/*).
import { Directive, ElementRef, Injectable, OnDestroy, OnInit, inject, signal } from '@angular/core';

/** Contact channels used across the sections. */
export const MC_LINKS = {
  email: 'mailto:kk0888176@gmail.com',
  linkedin: 'https://linkedin.com/in/karan-kapoor-8928451b2',
  github: 'https://github.com/KK-Dev-28',
  whatsapp: '/api/wa?text=' + encodeURIComponent('Hi Karan, I found your portfolio and would like to talk about a project.'),
};

/**
 * Carries an "Open brief" / "Start" click from a services or tier card into the
 * contact form, so the visitor lands on a message that already names what
 * they picked.
 */
@Injectable({ providedIn: 'root' })
export class McBriefService {
  readonly brief = signal('');

  open(topic: string) {
    this.brief.set(`Hi Karan, I'm interested in: ${topic}.\n\nHere's what I'm building: `);
    mcScrollTo('contact');
  }
}

/** Smooth-scrolls to a section id, leaving room for the floating navbar. */
export function mcScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: reduce ? 'auto' : 'smooth' });
}

/** Adds `.mc-reveal`, then `.in` once the element scrolls into view. */
@Directive({ selector: '[mcReveal]', standalone: true })
export class McRevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private io?: IntersectionObserver;

  ngOnInit() {
    const node = this.el.nativeElement as HTMLElement;
    node.classList.add('mc-reveal');
    if (!('IntersectionObserver' in window)) { node.classList.add('in'); return; }
    this.io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { node.classList.add('in'); this.io?.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    this.io.observe(node);
  }

  ngOnDestroy() { this.io?.disconnect(); }
}
