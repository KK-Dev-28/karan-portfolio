import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatTurn } from '../../services/chat.service';

const STARTERS = [
  "What's Karan's stack?",
  'Is he open to freelance work?',
  'Tell me about LocalHaat',
  'How would he scope my project?',
];

/**
 * "Mission Copilot": an AI assistant grounded in the site's CMS content
 * (backend/src/chat). It only appears when the backend reports an
 * ANTHROPIC_API_KEY, so a site without one shows nothing.
 */
@Component({
  selector: 'mc-copilot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
  <ng-container *ngIf="available()">
    <button class="fab" (click)="toggle()" [attr.aria-expanded]="open()" aria-controls="copilot-panel"
      [attr.aria-label]="open() ? 'Close Mission Copilot' : 'Ask Mission Copilot'">
      <span class="orb" aria-hidden="true"></span><span class="lbl">{{ open() ? 'Close' : 'Ask Copilot' }}</span>
    </button>

    <section class="panel" id="copilot-panel" *ngIf="open()" role="dialog" aria-label="Mission Copilot">
      <header>
        <p class="k"><span class="d"></span>Mission Copilot · AI</p>
        <p class="sub">Answers from what's on this site. For anything else, Karan replies directly.</p>
      </header>
      <div class="log" #log aria-live="polite">
        <p class="msg bot" *ngIf="!turns().length">Hi! Ask me about Karan's work, stack or availability.</p>
        <p *ngFor="let t of turns()" class="msg" [class.bot]="t.role === 'assistant'" [class.me]="t.role === 'user'">{{ t.content }}</p>
        <p class="msg bot typing" *ngIf="busy()"><i></i><i></i><i></i></p>
      </div>
      <div class="starters" *ngIf="!turns().length">
        <button *ngFor="let s of starters" type="button" (click)="ask(s)">{{ s }}</button>
      </div>
      <form (ngSubmit)="ask(draft)">
        <input name="q" [(ngModel)]="draft" maxlength="500" placeholder="Ask anything about Karan's work…" aria-label="Your question" autocomplete="off">
        <button type="submit" [disabled]="busy() || !draft.trim()" aria-label="Send">↗</button>
      </form>
    </section>
  </ng-container>
  `,
  styles: [`
    :host{display:contents}
    .fab{position:fixed;z-index:896;right:max(16px,env(safe-area-inset-right));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 56px);
      display:flex;align-items:center;gap:10px;padding:6px 16px 6px 6px;border-radius:99px;cursor:pointer;color:var(--text);
      background:var(--nav-bg-scrolled);border:1px solid rgba(var(--accent-rgb),.5);backdrop-filter:blur(12px);
      box-shadow:0 10px 30px -12px rgba(0,0,0,.6);font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;transition:transform .2s}
    .fab:hover{transform:translateY(-2px)}
    .fab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .orb{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e3b341 45%,#8a6408);
      box-shadow:0 0 18px rgba(227,179,65,.7);animation:breathe 3s ease-in-out infinite}
    .panel{position:fixed;z-index:9500;right:max(16px,env(safe-area-inset-right));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 112px);
      width:min(380px,calc(100vw - 32px));max-height:min(560px,calc(100svh - 180px));display:flex;flex-direction:column;
      border-radius:20px;overflow:hidden;background:var(--card);border:1px solid rgba(var(--accent-rgb),.5);box-shadow:var(--shadow-glow);
      animation:up .35s cubic-bezier(.2,.9,.2,1)}
    header{padding:16px 18px 10px;border-bottom:1px solid var(--border)}
    .k{display:flex;align-items:center;gap:8px;margin:0;font:500 11px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
    .d{width:7px;height:7px;border-radius:50%;background:var(--electric);box-shadow:0 0 8px var(--electric)}
    .sub{margin:6px 0 0;font-size:12px;color:var(--text-dim)}
    .log{flex:1;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
    .msg{margin:0;max-width:85%;padding:10px 13px;border-radius:14px;font:400 14px/1.5 var(--font-body);white-space:pre-wrap}
    .bot{align-self:flex-start;background:var(--bg-2);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:4px}
    .me{align-self:flex-end;background:#e3b341;color:#14110a;border-bottom-right-radius:4px}
    .typing{display:flex;gap:5px}.typing i{width:6px;height:6px;border-radius:50%;background:var(--text-dim);animation:dot 1s infinite}
    .typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
    .starters{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 12px}
    .starters button{padding:7px 12px;border-radius:99px;border:1px solid var(--border);background:none;color:var(--text-muted);font:400 12px var(--font-body);cursor:pointer}
    .starters button:hover{border-color:rgba(var(--accent-rgb),.6);color:var(--text)}
    form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border)}
    input{flex:1;min-width:0;padding:11px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:inherit;font-size:14px}
    input:focus{outline:none;border-color:rgba(var(--accent-rgb),.7)}
    form button{width:44px;border-radius:12px;border:0;background:#e3b341;color:#14110a;font-size:18px;cursor:pointer}
    form button:disabled{opacity:.45;cursor:not-allowed}
    @keyframes breathe{50%{box-shadow:0 0 28px rgba(227,179,65,.95)}}
    @keyframes up{from{opacity:0;transform:translateY(14px)}}
    @keyframes dot{50%{opacity:.25;transform:translateY(-3px)}}
    @media (max-width:600px){.lbl{display:none}.fab{padding:6px}}
    @media (prefers-reduced-motion:reduce){.orb,.panel,.typing i{animation:none}}
  `],
})
export class McCopilotComponent implements OnInit {
  @ViewChild('log') log?: ElementRef<HTMLDivElement>;
  private chat = inject(ChatService);
  readonly starters = STARTERS;
  readonly available = signal(false);
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly turns = signal<ChatTurn[]>([]);
  draft = '';

  ngOnInit() { this.chat.isAvailable().subscribe(a => this.available.set(a)); }

  toggle() { this.open.update(o => !o); }

  ask(q: string) {
    const text = q.trim();
    if (!text || this.busy()) return;
    this.draft = '';
    this.turns.update(t => [...t, { role: 'user', content: text }]);
    this.busy.set(true);
    this.scroll();
    this.chat.ask(this.turns()).subscribe({
      next: reply => this.say(reply || "I couldn't answer that one. Try the contact form below."),
      error: e => this.say(e?.error?.message ?? 'The copilot is offline right now. The contact form reaches Karan directly.'),
    });
  }

  private say(content: string) {
    this.turns.update(t => [...t, { role: 'assistant', content }]);
    this.busy.set(false);
    this.scroll();
  }

  private scroll() { setTimeout(() => this.log?.nativeElement.scrollTo({ top: 1e6, behavior: 'smooth' })); }
}
