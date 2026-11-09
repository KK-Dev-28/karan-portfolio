import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitorService } from '../../services/visitor.service';

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <aside class="wc" *ngIf="v.consent() === 'unknown'" role="dialog" aria-label="Welcome and privacy choice">
    <div class="wc-glow"></div>
    <p class="wc-kicker">WELCOME · 01</p>
    <h2>Hi, I'm Karan. <em>Who's visiting?</em></h2>
    <p class="wc-copy">Say your name if you like, and I'll greet you properly.
      With your OK I log only your page, browser, language, time zone and approximate city.
      No exact location, no tracking across other sites. Turn it off anytime from the greeting badge.</p>
    <input class="wc-in" [(ngModel)]="name" maxlength="60" placeholder="Your name (optional)" aria-label="Your name, optional" />
    <div class="wc-row">
      <button class="wc-btn wc-yes" (click)="v.accept(name)">Say hello ↗</button>
      <button class="wc-btn" (click)="v.decline()">No thanks</button>
    </div>
  </aside>
  <button class="wc-hello" *ngIf="v.consent() === 'granted'" (click)="v.reset()" title="Click to change your privacy choice">
    {{ v.name() ? 'Welcome, ' + v.name() + ' 👋' : 'Analytics on' }} <span class="wc-x">· change</span>
  </button>
  `,
  styles: [`
    :host{display:contents}
    .wc{position:fixed;z-index:9999;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));
      width:min(380px,calc(100vw - 32px));padding:22px;border-radius:22px;background:#17181c;color:#f1ede3;
      border:1px solid #e3b341;box-shadow:0 30px 60px -12px rgba(0,0,0,.6),0 0 0 1px rgba(227,179,65,.15),inset 0 1px 0 rgba(255,255,255,.08);
      overflow:hidden;animation:wcIn .6s cubic-bezier(.2,.9,.2,1) both}
    .wc-glow{position:absolute;inset:-40% -20% auto auto;width:260px;height:260px;border-radius:50%;
      background:radial-gradient(circle,rgba(227,179,65,.28),transparent 65%);pointer-events:none}
    .wc-kicker{font:11px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#e3b341;margin:0 0 8px}
    h2{font:400 30px/1.05 'Instrument Serif',Georgia,serif;margin:0 0 10px} h2 em{color:#e3b341}
    .wc-copy{font-size:13px;line-height:1.55;color:#a19d90;margin:0 0 14px}
    .wc-in{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid #2a2c33;background:#0a0b0c;color:#f1ede3;font:inherit;margin-bottom:12px}
    .wc-in:focus-visible,.wc-btn:focus-visible{outline:2px solid #e3b341;outline-offset:2px}
    .wc-row{display:flex;gap:10px;flex-wrap:wrap}
    .wc-btn{cursor:pointer;border-radius:99px;padding:11px 20px;border:1px solid #2a2c33;background:none;color:#f1ede3;font:12px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
    .wc-yes{background:#e3b341;color:#14110a;border-color:#e3b341}
    /* Bottom corner: the floating navbar spans the top on narrow screens. */
    .wc-hello{position:fixed;z-index:9998;bottom:max(16px,env(safe-area-inset-bottom));right:max(16px,env(safe-area-inset-right));
      padding:8px 16px;border-radius:99px;background:#17181c;color:#e3b341;border:1px solid #2a2c33;font:12px 'JetBrains Mono',monospace;cursor:pointer;
      animation:wcIn .6s .2s both}
    .wc-x{color:#77746b}
    @keyframes wcIn{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.wc,.wc-hello{animation:none}}
  `],
})
export class WelcomeCardComponent {
  v = inject(VisitorService);
  name = '';
}
