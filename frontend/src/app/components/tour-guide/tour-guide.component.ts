import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

export interface TourStep {
  /** id of the section to scroll to. 'hero' for the opening step. */
  target: string;
  title: string;
  body: string;
}

/** Used when the CMS has nothing saved, so the tour always works out of the box. */
const FALLBACK_STEPS: TourStep[] = [
  { target: 'hero',       title: 'Welcome 👋',        body: "Hi, I'm Karan's guide. I'll walk you through this portfolio in about a minute — or skip ahead any time." },
  { target: 'services',   title: 'What I do',         body: 'Full stack delivery — REST APIs through to polished interfaces. These are the engagements I take on.' },
  { target: 'skills',     title: 'The stack',         body: 'Angular on the front end, .NET and NestJS with PostgreSQL behind it. Everything here is production tooling, not tutorials.' },
  { target: 'projects',   title: 'The proof',         body: 'Real shipped systems — inventory platforms, an applicant tracking system, internal tooling. Each has a full case study.' },
  { target: 'story',      title: 'The journey',       body: 'How I got from a diploma in computer applications to building enterprise systems.' },
  { target: 'experience', title: 'Experience',        body: 'Currently a Junior Software Developer at CS Soft Solutions, alongside an MCA at Lovely Professional University.' },
  { target: 'gigs',       title: 'Work with me',      body: 'Fixed-scope packages and monthly retainers, with clear deliverables and timelines.' },
  { target: 'contact',    title: "Let's talk",        body: 'That’s the tour. If something here fits what you need, send a message — I reply quickly.' },
];

const LS_SEEN = 'kk_tour_seen';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour-guide.component.html',
  styleUrls: ['./tour-guide.component.scss'],
})
export class TourGuideComponent implements OnInit, OnDestroy {
  steps: TourStep[] = FALLBACK_STEPS;
  index = 0;
  open = false;
  /** Shown once per visitor as a nudge, until they start or dismiss the tour. */
  inviting = false;
  private highlighted?: HTMLElement;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe({
      next: c => {
        const s = c?.['tourGuide']?.steps;
        if (Array.isArray(s) && s.length) this.steps = s;
      },
      error: () => { /* keep fallback steps */ },
    });

    // Nudge first-time visitors only — returning visitors get the quiet button.
    try {
      if (!localStorage.getItem(LS_SEEN)) setTimeout(() => { if (!this.open) this.inviting = true; }, 6000);
    } catch { /* storage blocked — skip the nudge */ }
  }

  ngOnDestroy() { this.clearHighlight(); }

  get step(): TourStep { return this.steps[this.index]; }
  get isLast(): boolean { return this.index >= this.steps.length - 1; }

  start() {
    this.markSeen();
    this.inviting = false;
    this.open = true;
    this.index = 0;
    this.goToStep();
  }

  next() { if (!this.isLast) { this.index++; this.goToStep(); } else this.finish(); }
  prev() { if (this.index > 0) { this.index--; this.goToStep(); } }

  jump(i: number) { this.index = i; this.goToStep(); }

  finish() {
    this.open = false;
    this.clearHighlight();
    this.markSeen();
  }

  dismissInvite() {
    this.inviting = false;
    this.markSeen();
  }

  private goToStep() {
    const el = document.getElementById(this.step?.target ?? '');
    this.clearHighlight();
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('tour-focus');
    this.highlighted = el;
  }

  private clearHighlight() {
    this.highlighted?.classList.remove('tour-focus');
    this.highlighted = undefined;
  }

  private markSeen() {
    try { localStorage.setItem(LS_SEEN, '1'); } catch { /* storage blocked */ }
  }
}
