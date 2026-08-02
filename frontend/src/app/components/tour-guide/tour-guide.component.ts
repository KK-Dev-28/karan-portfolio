import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContentService } from '../../services/site-content.service';
import { ChatService, ChatTurn } from '../../services/chat.service';

export interface TourStep {
  /** id of the section to scroll to. 'hero' for the opening step. */
  target: string;
  title: string;
  body: string;
}

/** Used when the CMS has nothing saved, so the tour always works out of the box. */
const FALLBACK_STEPS: TourStep[] = [
  { target: 'hero',       title: 'Welcome 👋',        body: "Hi, I'm Karan's assistant. I'll walk you through this portfolio in about a minute — or skip ahead any time." },
  { target: 'services',   title: 'What I do',         body: 'Full stack delivery — REST APIs through to polished interfaces. These are the engagements Karan takes on.' },
  { target: 'skills',     title: 'The stack',         body: 'Angular on the front end, .NET and NestJS with PostgreSQL behind it. Production tooling, not tutorials.' },
  { target: 'projects',   title: 'The proof',         body: 'Real shipped systems — inventory platforms, an applicant tracking system, internal tooling. Each has a full case study.' },
  { target: 'story',      title: 'The journey',       body: 'How Karan got from a diploma in computer applications to building enterprise systems.' },
  { target: 'experience', title: 'Experience',        body: 'Currently a Junior Software Developer at CS Soft Solutions, alongside an MCA at Lovely Professional University.' },
  { target: 'gigs',       title: 'Work with me',      body: 'Fixed-scope packages and monthly retainers, with clear deliverables and timelines.' },
  { target: 'contact',    title: "Let's talk",        body: 'That’s the tour. If something here fits what you need, send a message — Karan replies quickly.' },
];

const SUGGESTIONS = [
  'What does Karan do?',
  'What has he built?',
  'Is he available for freelance?',
  'What’s his tech stack?',
];

const LS_SEEN = 'kk_tour_seen';

type Mode = 'chat' | 'tour';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-guide.component.html',
  styleUrls: ['./tour-guide.component.scss'],
})
export class TourGuideComponent implements OnInit, OnDestroy {
  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  open = false;
  /** Nudge shown once per visitor until they open or dismiss the assistant. */
  inviting = false;
  mode: Mode = 'chat';

  // ── Chat ────────────────────────────────────────────────────────────────
  /** False until the backend confirms an API key is configured; when it stays
   *  false the assistant runs as the scripted tour only, with no dead input. */
  chatEnabled = false;
  turns: ChatTurn[] = [];
  draft = '';
  thinking = false;
  chatError = '';
  suggestions = SUGGESTIONS;

  // ── Guided tour ─────────────────────────────────────────────────────────
  steps: TourStep[] = FALLBACK_STEPS;
  index = 0;
  private highlighted?: HTMLElement;

  constructor(private cms: SiteContentService, private chat: ChatService) {}

  ngOnInit() {
    this.chat.isAvailable().subscribe(ok => {
      this.chatEnabled = ok;
      if (!ok) this.mode = 'tour';
    });

    this.cms.getAll().subscribe({
      next: c => {
        const s = c?.['tourGuide']?.steps;
        if (Array.isArray(s) && s.length) this.steps = s;
      },
      error: () => { /* keep fallback steps */ },
    });

    try {
      if (!localStorage.getItem(LS_SEEN)) setTimeout(() => { if (!this.open) this.inviting = true; }, 6000);
    } catch { /* storage blocked — skip the nudge */ }
  }

  ngOnDestroy() { this.clearHighlight(); }

  // ── Open / close ────────────────────────────────────────────────────────

  launch(mode: Mode = this.chatEnabled ? 'chat' : 'tour') {
    this.markSeen();
    this.inviting = false;
    this.open = true;
    this.mode = mode;
    if (mode === 'tour') { this.index = 0; this.goToStep(); }
    else if (!this.turns.length) this.greet();
  }

  close() {
    this.open = false;
    this.clearHighlight();
    this.markSeen();
  }

  dismissInvite() { this.inviting = false; this.markSeen(); }

  switchTo(mode: Mode) {
    this.mode = mode;
    if (mode === 'tour') { this.index = 0; this.goToStep(); }
    else { this.clearHighlight(); if (!this.turns.length) this.greet(); }
  }

  // ── Chat ────────────────────────────────────────────────────────────────

  private greet() {
    this.turns = [{
      role: 'assistant',
      content: "Hi! I'm Karan's assistant — ask me anything about his work, skills, experience or availability. You can also take the guided tour.",
    }];
  }

  useSuggestion(text: string) { this.draft = text; this.send(); }

  send() {
    const text = this.draft.trim();
    if (!text || this.thinking) return;

    this.draft = '';
    this.chatError = '';
    this.turns = [...this.turns, { role: 'user', content: text }];
    this.thinking = true;
    this.scrollDown();

    // Only real exchanges go to the API — the local greeting isn't part of the
    // conversation the model needs, and sending it just wastes context.
    const history = this.turns.slice(this.turns[0]?.role === 'assistant' ? 1 : 0);

    this.chat.ask(history).subscribe({
      next: reply => {
        this.thinking = false;
        if (reply) this.turns = [...this.turns, { role: 'assistant', content: reply }];
        this.scrollDown();
      },
      error: (e: any) => {
        this.thinking = false;
        this.chatError = e?.status === 429
          ? 'That’s a lot of questions at once — give it a moment and try again.'
          : e?.error?.message || 'Could not reach the assistant. Try the contact form and Karan will reply directly.';
        this.scrollDown();
      },
    });
  }

  private scrollDown() {
    setTimeout(() => {
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // ── Guided tour ─────────────────────────────────────────────────────────

  get step(): TourStep { return this.steps[this.index]; }
  get isLast(): boolean { return this.index >= this.steps.length - 1; }

  next() { if (!this.isLast) { this.index++; this.goToStep(); } else this.finishTour(); }
  prev() { if (this.index > 0) { this.index--; this.goToStep(); } }
  jump(i: number) { this.index = i; this.goToStep(); }

  finishTour() {
    this.clearHighlight();
    if (this.chatEnabled) this.switchTo('chat');
    else this.close();
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
