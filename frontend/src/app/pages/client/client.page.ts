import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  BuilderModule, BuilderService, DEFAULT_MODULES, FeatureRequest, FEATURE_STATUS_LABEL,
  PERMISSIONS, PortfolioRequest, STATUS_LABEL, STATUS_STEPS,
} from '../../services/builder.service';

type View = 'login' | 'code' | 'forgot' | 'dash';

/**
 * Paid-client area. Sign-in is two steps (password, then a code emailed to the
 * client), and the session lives only in this browser tab.
 */
@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client.page.html',
  styleUrls: ['./client.page.scss'],
})
export class ClientPageComponent implements OnInit {
  private api = inject(BuilderService);

  readonly steps = STATUS_STEPS;
  readonly label = STATUS_LABEL;
  readonly view = signal<View>('login');
  readonly me = signal<{ email: string; lastLoginAt: string; sessionExpires: string; request: PortfolioRequest } | null>(null);
  readonly modules = signal<BuilderModule[]>(DEFAULT_MODULES);
  readonly featureLabel = FEATURE_STATUS_LABEL;
  readonly permissionCatalog = PERMISSIONS;

  /** What the admin has switched on for this client, from the server. */
  readonly permissions = signal<string[]>([]);
  readonly features = signal<FeatureRequest[]>([]);

  email = ''; password = ''; code = '';
  busy = false; err = ''; note = '';

  /** "Request a feature" form. */
  askTitle = ''; askDetails = ''; askModule = ''; asking = false;

  /** Inline editing of their own details, when edit_content is granted. */
  editing = false; editHeadline = ''; editAbout = ''; editSkills = '';

  ngOnInit() {
    this.api.catalog().subscribe(m => this.modules.set(m));
    if (this.api.clientToken()) this.load();
  }

  can(p: string) { return this.permissions().includes(p); }

  /** The permissions the client holds, as readable names. */
  get grantedNames() {
    return this.permissionCatalog.filter(p => this.can(p.id)).map(p => p.name);
  }

  /** Modules not yet in the build, which they can ask for. */
  get askableModules() {
    const have = new Set(this.me()?.request ? this.builtModules(this.me()!.request) : []);
    return this.modules().filter(m => !have.has(m.id));
  }

  get openRequests() { return this.features().filter(f => f.status === 'pending'); }

  /* ── Feature requests ── */

  ask() {
    const title = this.askTitle.trim();
    if (title.length < 4) { this.err = 'Give your request a short title.'; return; }
    this.asking = true; this.err = ''; this.note = '';
    this.api.askFeature({ title, details: this.askDetails.trim() || undefined, moduleId: this.askModule || undefined }).subscribe({
      next: f => {
        this.features.set([f, ...this.features()]);
        this.asking = false; this.askTitle = ''; this.askDetails = ''; this.askModule = '';
        this.note = 'Sent. Karan reviews every request and will reply by email with a cost if there is one.';
      },
      error: e => { this.asking = false; this.fail(e, 'Could not send that request.'); },
    });
  }

  withdraw(f: FeatureRequest) {
    this.api.dropFeature(f.id).subscribe({
      next: () => { this.features.set(this.features().filter(x => x.id !== f.id)); this.note = 'Request withdrawn.'; },
      error: e => this.fail(e, 'Could not withdraw that one.'),
    });
  }

  /* ── Their own content ── */

  startEdit() {
    const r = this.me()?.request;
    if (!r) return;
    this.editHeadline = r.headline ?? ''; this.editAbout = r.about ?? '';
    this.editSkills = (r.skills ?? []).join(', ');
    this.editing = true; this.err = ''; this.note = '';
  }

  saveEdit() {
    this.busy = true; this.err = ''; this.note = '';
    this.api.clientEditContent({
      headline: this.editHeadline.trim(),
      about: this.editAbout.trim(),
      skills: this.editSkills.split(',').map(s => s.trim()).filter(Boolean),
    }).subscribe({
      next: r => {
        const m = this.me();
        if (m) this.me.set({ ...m, request: r });
        this.busy = false; this.editing = false; this.note = 'Saved. Karan will fold this into your site.';
      },
      error: e => this.fail(e, 'Could not save those details.'),
    });
  }

  /* ── Data and sessions ── */

  download() {
    this.api.clientExport().subscribe({
      next: data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `my-portfolio-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.note = 'Downloaded.';
      },
      error: e => this.fail(e, 'Could not build that download.'),
    });
  }

  signOutEverywhere() {
    this.api.clientSignOutEverywhere().subscribe({
      next: () => { this.api.clientLogout(); this.me.set(null); this.go('login'); },
      error: e => this.fail(e, 'Could not clear your sessions.'),
    });
  }

  login() {
    if (!this.email.trim() || !this.password) { this.err = 'Enter your email and password.'; return; }
    this.start();
    this.api.login(this.email.trim(), this.password).subscribe({
      next: () => { this.busy = false; this.password = ''; this.view.set('code'); this.note = 'We emailed you a 6-digit code. It expires in 10 minutes.'; },
      error: e => this.fail(e, 'Could not sign in.'),
    });
  }

  verify() {
    this.start();
    this.api.verify(this.email.trim(), this.code.trim()).subscribe({
      next: () => { this.busy = false; this.code = ''; this.load(); },
      error: e => this.fail(e, 'That code did not work.'),
    });
  }

  forgot() {
    if (!/^\S+@\S+\.\S+$/.test(this.email)) { this.err = 'Enter your email.'; return; }
    this.start();
    this.api.forgot(this.email.trim()).subscribe({
      next: () => { this.busy = false; this.note = 'If that email has a client account, a reset link is on its way. It works once and expires in 1 hour.'; },
      error: e => this.fail(e, 'Could not send the link. Try again later.'),
    });
  }

  logout() { this.api.clientLogout(); this.me.set(null); this.go('login'); }

  go(v: View) { this.err = ''; this.note = ''; this.code = ''; this.password = ''; this.view.set(v); }

  stepIndex(s: string) { return (STATUS_STEPS as readonly string[]).indexOf(s); }
  moduleName(id: string) { return this.modules().find(m => m.id === id)?.name ?? id; }
  builtModules(r: PortfolioRequest) { return r.approvedModules?.length ? r.approvedModules : r.modules; }
  inr(n?: number | null) { return n == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }

  private load() {
    this.api.clientMe().subscribe({
      next: m => {
        this.me.set(m); this.view.set('dash');
        this.permissions.set(m.request.permissions ?? []);
        this.api.clientFeatures().subscribe({
          next: f => { this.permissions.set(f.permissions); this.features.set(f.items); },
          error: () => {},
        });
      },
      // An expired or revoked session simply drops back to the sign-in form.
      error: () => { this.api.clientLogout(); this.view.set('login'); },
    });
  }

  private start() { this.busy = true; this.err = ''; this.note = ''; }
  private fail(e: any, fallback: string) {
    this.busy = false;
    const m = e?.error?.message; this.err = Array.isArray(m) ? m.join(' · ') : (m ?? fallback);
  }
}
