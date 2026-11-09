import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { McBriefService, McRevealDirective, MC_LINKS } from './mc-shared';

/** Figma "Creative · 06 CTA" + "Creative · Contact Page", merged into the closing section. */
@Component({
  selector: 'mc-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="contact" aria-labelledby="cta-title">
    <div class="glow" aria-hidden="true"></div>
    <div class="grid">
      <div class="left">
        <p class="mc-kicker">10 · Ready when you are</p>
        <h2 id="cta-title" class="cta">Let’s build something <span class="mc-em">that scales.</span></h2>
        <nav class="rows" aria-label="Contact channels">
          <a *ngFor="let l of channels" class="mc-card ch" [href]="l.href" [attr.target]="l.ext ? '_blank' : null" rel="noopener">
            <span>{{ l.label }}</span><small>{{ l.hint }}</small><i aria-hidden="true">↗</i>
          </a>
        </nav>
      </div>

      <form class="mc-card form" mcReveal (ngSubmit)="send()" *ngIf="!sent(); else done">
        <h3>Start a conversation</h3>
        <label><span class="sr">Your name</span><input class="mc-field" name="name" [(ngModel)]="f.name" required maxlength="100" placeholder="Your name"></label>
        <label><span class="sr">Email</span><input class="mc-field" name="email" type="email" [(ngModel)]="f.email" required placeholder="Email"></label>
        <label><span class="sr">What are you building?</span><textarea class="mc-field" name="message" [(ngModel)]="f.message" required maxlength="3000" placeholder="What are you building?"></textarea></label>
        <button class="mc-btn mc-btn--gold" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send brief ↗' }}</button>
        <p class="err" *ngIf="error()">{{ error() }} <a [href]="links.whatsapp" target="_blank" rel="noopener">WhatsApp me instead</a>.</p>
      </form>
      <ng-template #done>
        <div class="mc-card form sent"><p class="mc-kicker"><span class="dot"></span>Brief received</p><h3>Thanks, {{ f.name || 'friend' }}. I'll get back to you soon.</h3></div>
      </ng-template>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .mc-sec{overflow:hidden}
    .glow{position:absolute;left:15%;top:40%;width:1000px;height:600px;border-radius:50%;pointer-events:none;
      background:radial-gradient(closest-side,rgba(var(--accent-2-rgb),.22),transparent);filter:blur(10px)}
    .grid{position:relative;display:grid;grid-template-columns:1fr 600px;gap:60px;align-items:start}
    .cta{margin:18px 0 0;font:400 clamp(52px,6.6vw,96px)/1 var(--font-display);letter-spacing:-.02em;color:var(--text)}
    .cta .mc-em{display:block}
    .rows{display:grid;gap:14px;margin-top:56px;max-width:500px}
    .ch{display:flex;align-items:center;gap:14px;min-height:60px;padding:0 24px 0 28px;text-decoration:none;color:var(--text);
      font:500 15px var(--font-body);transition:border-color .25s,transform .25s}
    .ch small{color:var(--text-dim);font:400 13px var(--font-mono)}
    .ch i{margin-left:auto;font-style:normal;color:var(--accent);transition:transform .25s}
    .ch:hover{border-color:rgba(var(--accent-rgb),.6);transform:translateX(4px)}
    .ch:hover i{transform:translate(3px,-3px)}
    .form{display:grid;gap:20px;padding:32px 40px 40px;box-sizing:border-box}
    h3{margin:0 0 18px;font:400 44px/1.1 var(--font-display);color:var(--text)}
    textarea.mc-field{min-height:160px}
    .form .mc-btn{width:100%;min-height:60px}
    .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    .err{margin:0;color:var(--crimson);font-size:14px}.err a{color:inherit}
    .sent{min-height:300px;align-content:center}
    @media (max-width:1100px){.grid{grid-template-columns:1fr}.rows{max-width:none}}
    @media (max-width:520px){.form{padding:24px}h3{font-size:34px}}
  `],
})
export class McContactComponent {
  private svc = inject(ContactService);
  private brief = inject(McBriefService);
  readonly links = MC_LINKS;
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  f = { name: '', email: '', message: '' };

  readonly channels = [
    { label: 'Email', hint: 'kk0888176@gmail.com', href: MC_LINKS.email, ext: false },
    { label: 'LinkedIn', hint: '/in/karan-kapoor', href: MC_LINKS.linkedin, ext: true },
    { label: 'GitHub', hint: '@KK-Dev-28', href: MC_LINKS.github, ext: true },
    { label: 'WhatsApp', hint: 'fastest reply', href: MC_LINKS.whatsapp, ext: true },
  ];

  constructor() {
    // "Open brief" / "Start" on a card pre-fills the message.
    effect(() => { const b = this.brief.brief(); if (b) this.f.message = b; });
  }

  send() {
    if (!this.f.name.trim() || !this.f.email.trim() || !this.f.message.trim()) { this.error.set('Please fill in all three fields.'); return; }
    this.busy.set(true); this.error.set('');
    this.svc.send({ name: this.f.name, email: this.f.email, subject: 'Project brief from portfolio', message: this.f.message }).subscribe({
      next: () => { this.busy.set(false); this.sent.set(true); },
      error: () => { this.busy.set(false); this.error.set('That didn’t send.'); },
    });
  }
}
