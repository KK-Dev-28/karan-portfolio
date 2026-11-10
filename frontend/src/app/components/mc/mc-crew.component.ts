import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrewService } from '../../services/crew.service';
import { McRevealDirective } from './mc-shared';
import { mcAchieve } from './mc-mission-log.component';

const TOPICS = [
  { id: 'projects', label: 'New projects & case studies' },
  { id: 'blog', label: 'Blog posts' },
  { id: 'kits', label: 'Starter kit launches' },
];

/** Join the "mission crew": sign in with an emailed code and choose which updates to get. */
@Component({
  selector: 'mc-crew',
  standalone: true,
  imports: [CommonModule, FormsModule, McRevealDirective],
  template: `
  <section class="mc-sec" id="crew" aria-labelledby="crew-title">
    <p class="mc-kicker">13 · Mission crew</p>
    <h2 id="crew-title" class="mc-title">Get the next launch <em>in your inbox</em></h2>

    <div class="mc-card panel mc-holo" mcReveal>
      <div class="side">
        <div class="orbit" aria-hidden="true"><span></span><span></span><span></span><b>✉</b></div>
        <ul class="perks">
          <li>New projects and case studies as they ship</li>
          <li>First look at starter kits, before they're public</li>
          <li>No spam. One click to unsubscribe, one to delete your account</li>
        </ul>
      </div>

      <div class="main" [ngSwitch]="step()">
        <!-- Signed in -->
        <ng-container *ngSwitchCase="'in'">
          <ng-container *ngIf="crew.member() as m">
            <p class="mc-mono ok"><span class="dot"></span>Signed in as {{ m.email }}</p>
            <h3>Welcome aboard{{ m.name ? ', ' + m.name : '' }}.</h3>
            <p class="lbl">Email me about</p>
            <label class="tg" *ngFor="let t of topics">
              <input type="checkbox" [checked]="m.topics.includes(t.id)" (change)="toggle(t.id)"><span>{{ t.label }}</span>
            </label>
            <label class="tg"><input type="checkbox" [checked]="m.subscribed" (change)="setSubscribed(!m.subscribed)"><span>Receive emails at all</span></label>
            <div class="row">
              <button class="mc-btn" (click)="crew.logout(); step.set('email')">Sign out</button>
              <button class="danger" (click)="remove()">{{ confirmDelete() ? 'Tap again to delete' : 'Delete my account' }}</button>
            </div>
            <p class="note" *ngIf="saved()">Saved.</p>
          </ng-container>
        </ng-container>

        <!-- Code -->
        <form *ngSwitchCase="'code'" (ngSubmit)="verify()">
          <p class="mc-mono">Step 2 of 2</p>
          <h3>Check your inbox</h3>
          <p class="sub">We sent a 6-digit code to <b>{{ email }}</b>.</p>
          <input class="mc-field code" name="code" [(ngModel)]="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="6-digit code" required>
          <div class="row">
            <button class="mc-btn mc-btn--gold" type="submit" [disabled]="busy() || code.length !== 6">{{ busy() ? 'Checking…' : 'Verify & join ↗' }}</button>
            <button class="mc-link" type="button" (click)="step.set('email')">Use a different email</button>
          </div>
        </form>

        <!-- Email -->
        <form *ngSwitchDefault (ngSubmit)="start()">
          <p class="mc-mono">Join or sign in</p>
          <h3>One code, no password.</h3>
          <div class="two">
            <input class="mc-field" name="name" [(ngModel)]="name" maxlength="80" placeholder="Your name (optional)" aria-label="Your name, optional">
            <input class="mc-field" name="email" type="email" [(ngModel)]="email" required placeholder="you@email.com" aria-label="Email">
          </div>
          <button class="mc-btn mc-btn--gold" type="submit" [disabled]="busy()">{{ busy() ? 'Sending code…' : 'Send my code ↗' }}</button>
        </form>

        <p class="err" *ngIf="error()" role="alert">{{ error() }}</p>
      </div>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .panel{display:grid;grid-template-columns:380px 1fr;gap:48px;margin-top:56px;padding:40px;overflow:hidden;
      background:radial-gradient(ellipse at 0% 0%,rgba(var(--accent-rgb),.12),transparent 55%),var(--card)}
    .orbit{position:relative;width:180px;height:180px;margin:4px 0 28px}
    .orbit span{position:absolute;inset:0;border-radius:50%;border:1px dashed rgba(var(--accent-2-rgb),.45);animation:spin 18s linear infinite}
    .orbit span:nth-child(2){inset:26px;border-style:solid;border-color:rgba(var(--electric-rgb),.35);animation-duration:12s;animation-direction:reverse}
    .orbit span:nth-child(3){inset:52px;border-color:rgba(var(--accent-2-rgb),.6)}
    .orbit span::after{content:'';position:absolute;top:-5px;left:50%;width:9px;height:9px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 12px var(--accent-2)}
    .orbit b{position:absolute;inset:66px;display:grid;place-items:center;border-radius:50%;background:#e3b341;color:#14110a;font-size:22px;box-shadow:0 0 30px rgba(227,179,65,.6)}
    .perks{list-style:none;margin:0;padding:0;display:grid;gap:12px}
    .perks li{position:relative;padding-left:22px;color:var(--text-muted);font:400 15px/1.5 var(--font-body)}
    .perks li::before{content:'▸';position:absolute;left:0;color:var(--accent)}
    .main{display:grid;align-content:center;gap:14px}
    .main form{display:grid;gap:16px}
    h3{margin:0;font:400 clamp(30px,3vw,42px)/1.1 var(--font-display);color:var(--text)}
    .sub{margin:0;color:var(--text-muted)} .sub b{color:var(--text)}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .code{max-width:260px;font:600 30px var(--font-mono);letter-spacing:12px;text-align:center}
    .row{display:flex;flex-wrap:wrap;align-items:center;gap:16px}
    .main .mc-btn{justify-self:start;min-height:52px}
    .ok{display:flex;align-items:center;gap:8px;color:var(--electric)} .ok .dot{width:7px;height:7px;border-radius:50%;background:var(--electric)}
    .lbl{margin:8px 0 0;font:500 12px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim)}
    .tg{display:flex;align-items:center;gap:12px;cursor:pointer;color:var(--text);font:400 15px var(--font-body)}
    .tg input{width:18px;height:18px;accent-color:#e3b341}
    .danger{border:0;background:none;color:var(--crimson);font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
    .note{margin:0;color:var(--electric);font-size:13px}
    .err{margin:0;color:var(--crimson);font-size:14px}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media (max-width:900px){.panel{grid-template-columns:1fr;padding:28px}.orbit{width:140px;height:140px}.orbit b{inset:50px}.orbit span:nth-child(2){inset:20px}.orbit span:nth-child(3){inset:40px}}
    @media (max-width:520px){.two{grid-template-columns:1fr}}
    @media (prefers-reduced-motion:reduce){.orbit span{animation:none}}
  `],
})
export class McCrewComponent implements OnInit {
  readonly crew = inject(CrewService);
  readonly topics = TOPICS;
  readonly step = signal<'email' | 'code' | 'in'>('email');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);
  readonly confirmDelete = signal(false);
  name = ''; email = ''; code = '';

  ngOnInit() {
    this.crew.restore();
    // Show the signed-in view once a stored session resolves.
    const t = setInterval(() => { if (this.crew.member()) { this.step.set('in'); clearInterval(t); } }, 300);
    setTimeout(() => clearInterval(t), 6000);
  }

  start() {
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) { this.error.set('Please enter a valid email.'); return; }
    this.busy.set(true); this.error.set('');
    this.crew.start(this.email.trim(), this.name.trim()).subscribe({
      next: () => { this.busy.set(false); this.code = ''; this.step.set('code'); },
      error: e => { this.busy.set(false); this.error.set(msg(e, 'Could not send the code. Try again in a minute.')); },
    });
  }

  verify() {
    this.busy.set(true); this.error.set('');
    this.crew.verify(this.email.trim(), this.code.trim()).subscribe({
      next: () => { this.busy.set(false); this.step.set('in'); mcAchieve('crew'); },
      error: e => { this.busy.set(false); this.error.set(msg(e, 'That code did not work.')); },
    });
  }

  toggle(id: string) {
    const m = this.crew.member(); if (!m) return;
    const topics = m.topics.includes(id) ? m.topics.filter(t => t !== id) : [...m.topics, id];
    this.save({ topics });
  }
  setSubscribed(v: boolean) { this.save({ subscribed: v }); }

  remove() {
    if (!this.confirmDelete()) { this.confirmDelete.set(true); setTimeout(() => this.confirmDelete.set(false), 4000); return; }
    this.crew.deleteAccount().subscribe({ next: () => { this.step.set('email'); this.confirmDelete.set(false); }, error: e => this.error.set(msg(e, 'Could not delete right now.')) });
  }

  private save(patch: Parameters<CrewService['update']>[0]) {
    this.crew.update(patch).subscribe({
      next: () => { this.saved.set(true); setTimeout(() => this.saved.set(false), 1800); },
      error: e => this.error.set(msg(e, 'Could not save. Please sign in again.')),
    });
  }
}

function msg(e: any, fallback: string): string {
  const m = e?.error?.message;
  return Array.isArray(m) ? m[0] : (typeof m === 'string' ? m : fallback);
}
