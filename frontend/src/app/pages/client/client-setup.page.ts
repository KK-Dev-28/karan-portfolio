import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BuilderService } from '../../services/builder.service';

/** Landing page for the single-use link in the credentials / reset email. */
@Component({
  selector: 'app-client-setup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['./client.page.scss'],
  template: `
    <div class="cl">
      <a class="cl-back" routerLink="/">← Portfolio</a>
      <section class="cl-card">
        <p class="cl-kicker">Client account</p>
        <h1>Choose a password</h1>

        <ng-container *ngIf="!done; else finished">
          <p class="muted" *ngIf="token">This link works once. Pick a password only you know.</p>
          <p class="err" *ngIf="!token">This link is incomplete. Open it again from your email, or ask for a new one.</p>
          <form (ngSubmit)="save()" *ngIf="token">
            <label>New password<input name="password" [(ngModel)]="password" type="password" autocomplete="new-password" required></label>
            <ul class="cl-rules">
              <li [class.met]="password.length >= 10">10+ characters</li>
              <li [class.met]="hasUpper">Uppercase</li>
              <li [class.met]="hasLower">Lowercase</li>
              <li [class.met]="hasDigit">Number</li>
            </ul>
            <label>Repeat password<input name="confirm" [(ngModel)]="confirm" type="password" autocomplete="new-password" required></label>
            <button class="btn gold" type="submit" [disabled]="busy || !valid">{{ busy ? 'Saving…' : 'Save password' }}</button>
          </form>
          <p class="err" *ngIf="err">{{ err }}</p>
          <p class="cl-links"><a routerLink="/client">Ask for a new link</a></p>
        </ng-container>

        <ng-template #finished>
          <p class="ok">Password saved. Sign in with your email and this password; we'll email you a code to finish.</p>
          <p class="cl-links"><a class="btn gold" routerLink="/client">Go to sign in</a></p>
        </ng-template>
      </section>
    </div>
  `,
})
export class ClientSetupPageComponent implements OnInit {
  private api = inject(BuilderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  password = ''; confirm = '';
  busy = false; err = ''; done = false;

  get hasUpper() { return /[A-Z]/.test(this.password); }
  get hasLower() { return /[a-z]/.test(this.password); }
  get hasDigit() { return /\d/.test(this.password); }
  get valid() { return this.password.length >= 10 && this.hasUpper && this.hasLower && this.hasDigit && this.password === this.confirm; }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('t') ?? '';
    // Drop the token from the address bar so it does not linger in history or get shared.
    if (this.token) this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  save() {
    if (!this.valid) return;
    this.busy = true; this.err = '';
    this.api.setup(this.token, this.password).subscribe({
      next: () => { this.busy = false; this.done = true; this.password = this.confirm = ''; },
      error: e => {
        this.busy = false;
        const m = e?.error?.message; this.err = Array.isArray(m) ? m.join(' · ') : (m ?? 'Could not save the password.');
      },
    });
  }
}
