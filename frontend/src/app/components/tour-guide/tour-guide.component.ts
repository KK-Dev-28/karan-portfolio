import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContentService } from '../../services/site-content.service';
import { ChatService, ChatTurn } from '../../services/chat.service';
import { AnalyticsService } from '../../services/analytics.service';
import { SoundService } from '../../services/sound.service';

export interface TourStep {
  target: string;
  title: string;
  body: string;
  builtDetails: string;
  techDetails: string;
  impactDetails: string;
  icon: string;
}

const FALLBACK_STEPS: TourStep[] = [
  {
    target: 'hero',
    title: 'Kinetic 3D Hero & Spatial Core',
    body: "Hello! I'm Karan's AI Hologram Copilot. This hero features a hardware-adaptive kinetic 3D engine that automatically throttles to zero CPU/GPU usage when scrolled out of view.",
    builtDetails: 'Custom Three.js particle system with pointer vector attraction physics and theme-reactive volumetric aurora gradients.',
    techDetails: 'IntersectionObserver viewport throttling · Rolling FPS quality tiering (Ultra/High/Mid/Low/2D) · prefers-reduced-motion compliance.',
    impactDetails: 'Achieves a 100/100 Lighthouse performance score with zero layout shift (CLS < 0.01) and sub-180kB initial transfer.',
    icon: '🌌',
  },
  {
    target: 'skills',
    title: 'Distributed System Topology',
    body: 'Explore Karan’s distributed multi-tier architecture, connecting the Angular 19 SPA to NestJS, PostgreSQL, Claude AI, and Python NLP microservices.',
    builtDetails: 'Interactive microservice topology visualizer with real-time latency beacons, status pulses, and subsystem inspection drawers.',
    techDetails: 'Angular 19 Standalone · NestJS CQRS · PostgreSQL TypeORM · FastAPI Python · Razorpay HMAC SHA256.',
    impactDetails: 'Sub-25ms p95 API response times with automated connection pooling and rate-limiting safeguards.',
    icon: '⚡',
  },
  {
    target: 'projects',
    title: 'Production Engineering Case Studies',
    body: 'Every featured project is a real, battle-tested system with deep architecture write-ups, database schemas, and live interactive demo links.',
    builtDetails: 'Enterprise inventory platforms, real-time analytics suites, applicant tracking systems, and multi-tenant applications.',
    techDetails: 'Angular CDK · ASP.NET Web API · NestJS · PostgreSQL · Redis Cache · Docker Containerization.',
    impactDetails: 'Processed over 100,000+ real transactions and supported enterprise workflows with 99.9% uptime.',
    icon: '🚀',
  },
  {
    target: 'demos',
    title: 'Live Embedded Application Demos',
    body: 'Four full-stack applications running inside this platform: TaskFlow Kanban, E-Commerce Platform, Multi-Tenant LMS, and Real-Time Analytics.',
    builtDetails: 'Complete working applications with server-side persistence, drag-and-drop state, shopping carts, and curriculum progress tracking.',
    techDetails: 'Real PostgreSQL entities · JWT Session Isolation · Dynamic CRUD endpoints · Instant sample seeders.',
    impactDetails: 'Allows recruiters and clients to test real full-stack code and state transitions right in the browser.',
    icon: '💻',
  },
  {
    target: 'story',
    title: 'The Engineering Journey',
    body: 'The story of how Karan progressed from foundational computer applications to architecting high-scale enterprise platforms and microservices.',
    builtDetails: 'Interactive narrative detailing problem-solving milestones, open-source work, and continuous technical growth.',
    techDetails: 'Master of Computer Applications (MCA) · Real-world systems engineer · Full-stack product delivery.',
    impactDetails: 'Proven ability to take complex requirements from blank canvas to production deployment.',
    icon: '📖',
  },
  {
    target: 'experience',
    title: 'Professional Track Record',
    body: 'Experience delivering production software as a Junior Software Developer at CS Soft Solutions alongside academic excellence.',
    builtDetails: 'Timeline of corporate contributions, agile sprint leadership, API hardening, and UI/UX modernization.',
    techDetails: 'Enterprise Git workflows · CI/CD pipelines · Cross-functional collaboration · Code reviews.',
    impactDetails: 'Delivered mission-critical modules on schedule with rigorous unit test coverage.',
    icon: '🏆',
  },
  {
    target: 'gigs',
    title: 'Freelance Packages & Cost Estimator',
    body: 'Transparent freelance packages, monthly retainers, and an interactive Project Cost Estimator with instant scoping calculations.',
    builtDetails: 'Dynamic slider estimator, consultation booking scheduler, and direct WhatsApp / Razorpay integration.',
    techDetails: 'Interactive formula calculus · Currency formatters · Instant calendar booking · Webhook invoice generator.',
    impactDetails: 'Provides immediate clarity on timelines, pricing, and deliverables with zero ambiguity.',
    icon: '💼',
  },
  {
    target: 'contact',
    title: 'Instant Consultation & Direct Connect',
    body: 'Direct contact portal backed by PostgreSQL message storage, automated notification triggers, and instant reply channels.',
    builtDetails: 'Real-time validated contact form with email client integration and direct WhatsApp instant messaging.',
    techDetails: 'NestJS Contact Module · Resend / Nodemailer transactional delivery · PostgreSQL persistence.',
    impactDetails: 'Average response time within 2 hours for all project inquiries and consultation bookings.',
    icon: '📬',
  },
];

const SUGGESTIONS = [
  'What is Karan’s core tech stack?',
  'Explain the 3D/5D performance architecture',
  'What live demos can I test?',
  'Is Karan available for freelance or full-time?',
];

const LS_SEEN = 'kk_tour_seen';
type Mode = 'tour' | 'chat';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tour-guide.component.html',
  styleUrls: ['./tour-guide.component.scss'],
})
export class TourGuideComponent implements OnInit, OnDestroy {
  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  private readonly cms = inject(SiteContentService);
  private readonly chat = inject(ChatService);
  private readonly analytics = inject(AnalyticsService);
  public readonly sound = inject(SoundService);
  private readonly ngZone = inject(NgZone);

  open = false;
  inviting = false;
  mode: Mode = 'tour';

  voiceEnabled = true;
  isPlayingVoice = false;
  isBlinking = false;
  mouthOpenness = 0; // 0 to 1 for mouth animation

  showDeepDive = false;
  autoPlay = true;
  autoPlayProgress = 0; // 0% to 100%

  chatEnabled = true;
  turns: ChatTurn[] = [];
  draft = '';
  thinking = false;
  chatError = '';
  suggestions = SUGGESTIONS;

  steps: TourStep[] = FALLBACK_STEPS;
  index = 0;

  private highlighted?: HTMLElement;
  private synth?: SpeechSynthesis;
  private autoPlayTimer?: any;
  private blinkTimer?: any;
  private mouthInterval?: any;

  constructor() {}

  ngOnInit() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }

    this.chat.isAvailable().subscribe(ok => {
      this.chatEnabled = ok;
    });

    this.cms.getAll().subscribe({
      next: c => {
        const s = c?.['tourGuide']?.steps;
        if (Array.isArray(s) && s.length) {
          this.steps = s.map((step: any, i: number) => ({
            ...FALLBACK_STEPS[i % FALLBACK_STEPS.length],
            ...step,
          }));
        }
      },
      error: () => {},
    });

    this.startBlinkLoop();

    try {
      if (!localStorage.getItem(LS_SEEN)) {
        setTimeout(() => {
          if (!this.open) this.inviting = true;
        }, 5000);
      }
    } catch {}
  }

  ngOnDestroy() {
    this.clearHighlight();
    this.stopVoice();
    this.stopAutoPlayTimer();
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.mouthInterval) clearInterval(this.mouthInterval);
  }

  private startBlinkLoop() {
    const nextBlink = () => {
      this.blinkTimer = setTimeout(() => {
        this.isBlinking = true;
        setTimeout(() => {
          this.isBlinking = false;
          nextBlink();
        }, 180);
      }, 2500 + Math.random() * 3000);
    };
    nextBlink();
  }

  launch(mode: Mode = 'tour') {
    this.markSeen();
    this.inviting = false;
    this.open = true;
    this.mode = mode;
    this.sound.playPowerUp();
    this.analytics.trackInteraction('open_ai_companion', 'tour_guide', { mode });

    if (mode === 'tour') {
      this.index = 0;
      this.autoPlay = true;
      this.goToStep();
    } else if (!this.turns.length) {
      this.greet();
    }
  }

  close() {
    this.open = false;
    this.clearHighlight();
    this.stopVoice();
    this.stopAutoPlayTimer();
    this.markSeen();
  }

  dismissInvite() {
    this.inviting = false;
    this.markSeen();
  }

  switchTo(mode: Mode) {
    this.mode = mode;
    this.stopVoice();
    this.stopAutoPlayTimer();
    this.sound.playBeep();

    if (mode === 'tour') {
      this.goToStep();
    } else {
      this.clearHighlight();
      if (!this.turns.length) this.greet();
    }
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    this.sound.playBeep();
    if (!this.voiceEnabled) {
      this.stopVoice();
    } else if (this.mode === 'tour') {
      this.speakText(this.step.body);
    }
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    this.sound.playBeep();
    if (!this.autoPlay) {
      this.stopAutoPlayTimer();
    } else {
      this.startAutoPlayTimer();
    }
  }

  toggleSoundMute() {
    this.sound.toggleMute();
  }

  toggleDeepDive() {
    this.showDeepDive = !this.showDeepDive;
    this.sound.playBeep();
    this.analytics.trackInteraction('toggle_deep_dive', 'tour_guide', {
      step: this.step.title,
      expanded: this.showDeepDive,
    });
  }

  // ── Speech Synthesis & Mouth Lip-Sync ─────────────────
  private speakText(text: string, onComplete?: () => void) {
    if (!this.voiceEnabled || !this.synth) {
      if (onComplete) onComplete();
      return;
    }
    this.stopVoice();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.05;

      const voices = this.synth.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        this.isPlayingVoice = true;
        this.startMouthAnimation();
      };

      utterance.onend = () => {
        this.isPlayingVoice = false;
        this.stopMouthAnimation();
        if (onComplete) onComplete();
      };

      utterance.onerror = () => {
        this.isPlayingVoice = false;
        this.stopMouthAnimation();
        if (onComplete) onComplete();
      };

      this.synth.speak(utterance);
    } catch {
      this.isPlayingVoice = false;
      this.stopMouthAnimation();
      if (onComplete) onComplete();
    }
  }

  private startMouthAnimation() {
    if (this.mouthInterval) clearInterval(this.mouthInterval);
    this.mouthInterval = setInterval(() => {
      this.mouthOpenness = Math.random() * 0.9 + 0.1;
      if (Math.random() < 0.25) this.sound.playBlip();
    }, 110);
  }

  private stopMouthAnimation() {
    if (this.mouthInterval) clearInterval(this.mouthInterval);
    this.mouthInterval = null;
    this.mouthOpenness = 0;
  }

  private stopVoice() {
    if (this.synth) {
      try { this.synth.cancel(); } catch {}
    }
    this.isPlayingVoice = false;
    this.stopMouthAnimation();
  }

  // ── Auto-Play Progress & Transition Timer ─────────────
  private startAutoPlayTimer(durationMs: number = 8000) {
    this.stopAutoPlayTimer();
    if (!this.autoPlay) return;

    const interval = 100;
    let elapsed = 0;
    this.autoPlayProgress = 0;

    this.autoPlayTimer = setInterval(() => {
      elapsed += interval;
      this.autoPlayProgress = Math.min(100, (elapsed / durationMs) * 100);

      if (elapsed >= durationMs) {
        this.stopAutoPlayTimer();
        if (!this.isLast) {
          this.next();
        } else {
          this.finishTour();
        }
      }
    }, interval);
  }

  private stopAutoPlayTimer() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.autoPlayProgress = 0;
  }

  // ── Chat ──────────────────────────────────────────────
  private greet() {
    this.turns = [{
      role: 'assistant',
      content: "Hello! I am Karan's Holographic Systems Copilot. Ask me about his full-stack architecture, projects, live demos, or take the interactive audio/visual tour.",
    }];
    if (this.voiceEnabled) {
      this.speakText("Hello! I am Karan's Holographic Systems Copilot. Ask me anything or take the guided tour.");
    }
  }

  useSuggestion(text: string) {
    this.draft = text;
    this.send();
  }

  send() {
    const text = this.draft.trim();
    if (!text || this.thinking) return;

    this.draft = '';
    this.chatError = '';
    this.turns = [...this.turns, { role: 'user', content: text }];
    this.thinking = true;
    this.sound.playBeep();
    this.scrollDown();

    const history = this.turns.slice(this.turns[0]?.role === 'assistant' ? 1 : 0);

    this.chat.ask(history).subscribe({
      next: reply => {
        this.thinking = false;
        if (reply) {
          this.turns = [...this.turns, { role: 'assistant', content: reply }];
          if (this.voiceEnabled) this.speakText(reply.slice(0, 300));
        }
        this.scrollDown();
      },
      error: (e: any) => {
        this.thinking = false;
        this.chatError = e?.status === 429
          ? 'Rate limit reached — please wait a moment before asking again.'
          : e?.error?.message || 'Could not reach the assistant engine. Please use the contact form to reach Karan directly.';
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

  // ── Guided Tour Navigation ────────────────────────────
  get step(): TourStep {
    return this.steps[this.index] || FALLBACK_STEPS[0];
  }

  get isLast(): boolean {
    return this.index >= this.steps.length - 1;
  }

  next() {
    if (!this.isLast) {
      this.index++;
      this.sound.playSwoosh();
      this.goToStep();
    } else {
      this.finishTour();
    }
  }

  prev() {
    if (this.index > 0) {
      this.index--;
      this.sound.playSwoosh();
      this.goToStep();
    }
  }

  jump(i: number) {
    this.index = i;
    this.sound.playSwoosh();
    this.goToStep();
  }

  replayCurrent() {
    this.sound.playSwoosh();
    this.goToStep();
  }

  finishTour() {
    this.clearHighlight();
    this.stopVoice();
    this.stopAutoPlayTimer();
    this.sound.playSuccess();

    if (this.chatEnabled) {
      this.switchTo('chat');
    } else {
      this.close();
    }
  }

  private goToStep() {
    this.showDeepDive = false;
    this.stopAutoPlayTimer();
    this.clearHighlight();

    const el = document.getElementById(this.step?.target ?? '');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('tour-focus');
      this.highlighted = el;
    }

    // Speak audio, then start auto-advance countdown if autoplay is enabled
    this.speakText(this.step.body, () => {
      if (this.autoPlay && !this.isLast) {
        this.startAutoPlayTimer(5000);
      }
    });

    if (!this.voiceEnabled && this.autoPlay && !this.isLast) {
      this.startAutoPlayTimer(7000);
    }
  }

  private clearHighlight() {
    this.highlighted?.classList.remove('tour-focus');
    this.highlighted = undefined;
  }

  private markSeen() {
    try { localStorage.setItem(LS_SEEN, '1'); } catch {}
  }
}
