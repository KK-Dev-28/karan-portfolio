import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitorService } from '../../services/visitor.service';

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="wc" *ngIf="v.consent() === 'unknown' && ready()" role="dialog" aria-label="Welcome and privacy choice">
    <div class="wc-glow"></div>
    <p class="wc-kicker"><span class="wc-wave" aria-hidden="true">👋</span> {{ partOfDay }}</p>
    <h2>Hi, I'm Karan. <em>Who's visiting?</em></h2>
    <p class="wc-copy">Say your name if you like, and I'll greet you properly.
      With your OK I log only your page, browser, language, time zone and approximate city.
      No exact location, no tracking across other sites. Turn it off anytime from the greeting badge.</p>
    <input class="wc-in" [(ngModel)]="name" maxlength="60" placeholder="Your name (optional)" aria-label="Your name, optional"
      (keydown.enter)="v.accept(name)" />
    <div class="wc-row">
      <button class="wc-btn wc-yes" (click)="v.accept(name)">Say hello ↗</button>
      <button class="wc-btn" (click)="v.decline()">No thanks</button>
    </div>
  </div>
  <button class="wc-hello" *ngIf="v.consent() === 'granted'" (click)="v.reset()" title="Click to change your privacy choice">
    {{ v.name() ? partOfDay + ', ' + v.name() + ' 👋' : 'Analytics on' }} <span class="wc-x">· change</span>
  </button>
  `,
  // Theme tokens from styles.scss, so the card matches whichever theme is active.
  styles: [`
    :host{display:contents}
    .wc{position:fixed;z-index:9999;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));
      width:min(360px,calc(100vw - 32px));padding:22px;border-radius:var(--radius-lg);background:var(--card);color:var(--text);
      border:1px solid rgba(var(--accent-rgb),.45);box-shadow:0 30px 60px -12px rgba(0,0,0,.6),var(--shadow-glow);
      overflow:hidden;animation:wcIn .6s cubic-bezier(.2,.9,.2,1) both}
    .wc-glow{position:absolute;inset:-40% -20% auto auto;width:260px;height:260px;border-radius:50%;
      background:radial-gradient(circle,var(--accent-glow),transparent 65%);pointer-events:none}
    .wc-kicker{position:relative;font:500 11px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 8px}
    .wc-wave{display:inline-block;transform-origin:70% 70%;animation:wave 1.8s 0.6s ease-in-out 2}
    h2{position:relative;font:400 32px/1.05 var(--font-display);letter-spacing:-.01em;margin:0 0 10px}
    h2 em{font-style:italic;color:var(--accent-2)}
    .wc-copy{position:relative;font-size:13px;line-height:1.55;color:var(--text-muted);margin:0 0 14px}
    .wc-in{position:relative;width:100%;box-sizing:border-box;padding:12px 14px;border-radius:var(--radius);border:1px solid var(--border);
      background:var(--bg);color:var(--text);font:inherit;margin-bottom:12px}
    .wc-in:focus-visible,.wc-btn:focus-visible,.wc-hello:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .wc-row{position:relative;display:flex;gap:10px;flex-wrap:wrap}
    .wc-btn{cursor:pointer;border-radius:99px;padding:11px 20px;border:1px solid var(--border);background:none;color:var(--text);
      font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;transition:transform .2s}
    .wc-btn:hover{transform:translateY(-1px)}
    .wc-yes{background:var(--gradient-accent);color:var(--bg);border-color:transparent}
    /* Bottom corner: the floating navbar spans the top on narrow screens. */
    .wc-hello{position:fixed;z-index:9998;bottom:max(16px,env(safe-area-inset-bottom));right:max(16px,env(safe-area-inset-right));
      padding:8px 16px;border-radius:99px;background:var(--nav-bg-scrolled);backdrop-filter:blur(12px);color:var(--accent);
      border:1px solid var(--border);font:500 12px var(--font-mono);cursor:pointer;animation:wcIn .6s .2s both}
    .wc-x{color:var(--text-dim)}
    @keyframes wcIn{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%,40%{transform:rotate(-8deg)}}
    @media (prefers-reduced-motion:reduce){.wc,.wc-hello,.wc-wave{animation:none}}
  `],
})
export class WelcomeCardComponent implements OnInit {
  v = inject(VisitorService);
  name = '';
  /** Held back briefly so a first-time visitor sees the hero before the card. */
  readonly ready = signal(false);
  readonly partOfDay = (h => h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')(new Date().getHours());

  ngOnInit() { if (typeof window !== 'undefined') setTimeout(() => this.ready.set(true), 2500); }
}
