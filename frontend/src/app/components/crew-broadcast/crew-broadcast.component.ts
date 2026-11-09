import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrewService } from '../../services/crew.service';

/** Admin → Newsletter: email everyone in the mission crew. */
@Component({
  selector: 'app-crew-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="cb">
    <div class="stats" *ngIf="stats() as s">
      <div><b>{{ s.crew }}</b><span>verified crew</span></div>
      <div><b>{{ s.total }}</b><span>all subscribers</span></div>
      <div><b>{{ s.reachable }}</b><span>will receive mail</span></div>
    </div>
    <form (ngSubmit)="send()">
      <label>Subject<input name="subject" [(ngModel)]="subject" maxlength="140" placeholder="New project: LocalHaat 2.0 is live"></label>
      <label>Only people who want
        <select name="topic" [(ngModel)]="topic">
          <option value="">Everyone</option><option value="projects">Projects</option><option value="blog">Blog posts</option><option value="kits">Starter kits</option>
        </select>
      </label>
      <label>Message<textarea name="body" [(ngModel)]="body" rows="8" maxlength="8000" placeholder="Write the update. Blank lines start new paragraphs."></textarea></label>
      <div class="row">
        <button type="submit" [disabled]="busy() || subject.length < 3 || body.length < 10">{{ confirm() ? 'Click again to send to ' + (stats()?.reachable ?? '…') + ' people' : 'Send broadcast' }}</button>
        <span class="note" *ngIf="result()">{{ result() }}</span>
      </div>
      <p class="hint">Each email has an unsubscribe link. Sending is paced (about 1–2 per second) to stay within Resend's limits.</p>
    </form>
  </div>
  `,
  styles: [`
    .cb{display:grid;gap:18px;margin-bottom:28px;padding:20px;border-radius:16px;border:1px solid var(--border);background:var(--card)}
    .stats{display:flex;flex-wrap:wrap;gap:24px}.stats div{display:grid}.stats b{font-size:26px;color:var(--accent)}.stats span{font-size:12px;color:var(--text-muted)}
    form{display:grid;gap:12px} label{display:grid;gap:6px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
    input,select,textarea{padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:inherit;font-size:14px;text-transform:none;letter-spacing:0}
    .row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    button{padding:10px 18px;border-radius:99px;border:0;background:var(--accent);color:var(--bg);font-weight:600;cursor:pointer}
    button:disabled{opacity:.5;cursor:not-allowed}
    .note{color:var(--accent);font-size:13px}.hint{margin:0;font-size:12px;color:var(--text-dim)}
  `],
})
export class CrewBroadcastComponent implements OnInit {
  private crew = inject(CrewService);
  readonly stats = signal<{ total: number; crew: number; reachable: number; sending: boolean } | null>(null);
  readonly busy = signal(false);
  readonly confirm = signal(false);
  readonly result = signal('');
  subject = ''; body = ''; topic = '';

  ngOnInit() { this.load(); }
  private load() { this.crew.stats().subscribe({ next: s => this.stats.set(s), error: () => {} }); }

  send() {
    if (!this.confirm()) { this.confirm.set(true); setTimeout(() => this.confirm.set(false), 5000); return; }
    this.confirm.set(false); this.busy.set(true); this.result.set('');
    this.crew.broadcast(this.subject, this.body, this.topic).subscribe({
      next: r => { this.busy.set(false); this.result.set(`Sending to ${r.queued} people in the background.`); this.subject = ''; this.body = ''; this.load(); },
      error: e => { this.busy.set(false); this.result.set(e?.error?.message ?? 'Could not send.'); },
    });
  }
}
