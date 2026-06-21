import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Path { icon: string; title: string; desc: string; }
interface Highlight { icon: string; label: string; }

interface CaseStudy {
  tag: string;
  title: string;
  subtitle: string;
  liveUrl: string;
  story: string[];
  paths: Path[];
  highlights: Highlight[];
  builtWith: string[];
  ctaTitle: string;
  ctaSubtitle: string;
}

const CASE_STUDIES: Record<string, CaseStudy> = {

  'local-shopping-survey': {
    tag: 'MCA Capstone Project · Research',
    title: 'Local Shopping Research Survey',
    subtitle: 'A 2-minute, fully anonymous survey exploring shopping behaviour and the challenges local vendors face in Indian communities.',
    liveUrl: 'https://spectacular-bunny-fb84e0.netlify.app/',
    story: [
      'Local markets, street vendors and neighbourhood shops are the backbone of everyday commerce in India — yet very little structured data exists on how customers actually decide where to shop, and what obstacles vendors face in keeping up with changing habits.',
      'This survey was built as part of an MCA capstone research project to close that gap. It collects first-hand, anonymous responses from two groups — customers who shop locally, and vendors who sell in street markets or local shops — to build a clearer picture of local shopping behaviour and vendor-side challenges.',
      'The goal is simple: every response adds real signal to research that could help improve how local commerce works for both sides of the counter.',
    ],
    paths: [
      { icon: '🛍️', title: 'Customer Path', desc: 'For anyone who buys from local vendors, street markets, or nearby shops — a few quick questions about habits and preferences.' },
      { icon: '🏪', title: 'Vendor Path',   desc: 'For street vendors and local shopkeepers — a few quick questions about the day-to-day challenges of running the business.' },
    ],
    highlights: [
      { icon: '⏱️', label: '2 minutes to complete' },
      { icon: '🔒', label: '100% anonymous' },
      { icon: '🚫', label: 'No personal data collected' },
      { icon: '🎓', label: 'MCA capstone research' },
    ],
    builtWith: ['HTML', 'CSS', 'JavaScript', 'Netlify'],
    ctaTitle: 'Your 2 minutes can shape better local commerce',
    ctaSubtitle: 'Whether you shop local or sell local, your response adds real signal to this research.',
  },
};

@Component({
  selector: 'app-case-study-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './case-study.page.html',
  styleUrls: ['./case-study.page.scss'],
})
export class CaseStudyPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  study: CaseStudy | null = null;
  slug = '';
  safeUrl: SafeResourceUrl | null = null;
  embedFailed = false;

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.study = CASE_STUDIES[this.slug] || null;
    if (this.study) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.study.liveUrl);
    }
  }

  openLive() {
    if (this.study) window.open(this.study.liveUrl, '_blank', 'noopener,noreferrer');
  }
}
