import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditEntry, BuilderModule, BuilderService, FeatureRequest, FEATURE_STATUS_LABEL,
  PERMISSIONS, PortfolioRequest, STATUS_LABEL, STATUS_STEPS,
} from '../../../services/builder.service';

/**
 * Admin side of "get a portfolio like this": review a request, grant the
 * modules and dashboard permissions it gets, price it, take the payment,
 * issue credentials, then work the client's feature requests.
 */
@Component({
  selector: 'app-admin-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-builder.component.html',
  styleUrls: ['./admin-builder.component.scss'],
})
export class AdminBuilderComponent implements OnInit {
  private api = inject(BuilderService);

  readonly steps = STATUS_STEPS;
  readonly label = STATUS_LABEL;
  readonly featureLabel = FEATURE_STATUS_LABEL;
  readonly permissions = PERMISSIONS;

  view: 'requests' | 'features' | 'audit' = 'requests';
  loading = true;
  err = '';
  note = '';

  requests: PortfolioRequest[] = [];
  features: FeatureRequest[] = [];
  audit: AuditEntry[] = [];
  catalog: BuilderModule[] = [];

  filter = 'all';
  openId: number | null = null;

  /** Per-row edit state, keyed by request id. */
  busy: Record<number, boolean> = {};
  quote: Record<number, number | null> = {};
  quoteNote: Record<number, string> = {};
  adminNotes: Record<number, string> = {};
  liveUrl: Record<number, string> = {};
  payRef: Record<number, string> = {};
  picked: Record<number, Set<string>> = {};
  perms: Record<number, Set<string>> = {};

  /** Per-row state for the feature queue. */
  fBusy: Record<number, boolean> = {};
  fPrice: Record<number, number | null> = {};
  fNote: Record<number, string> = {};

  ngOnInit() {
    this.api.catalog().subscribe(c => (this.catalog = c));
    this.load();
  }

  load() {
    this.loading = true; this.err = '';
    this.api.adminList().subscribe({
      next: rows => { this.requests = rows; rows.forEach(r => this.seed(r)); this.loading = false; },
      error: e => { this.err = this.msg(e); this.loading = false; },
    });
    this.api.adminFeatures().subscribe({ next: f => (this.features = f), error: () => {} });
  }

  loadAudit() {
    this.api.adminAudit().subscribe({ next: a => (this.audit = a), error: e => (this.err = this.msg(e)) });
  }

  show(v: 'requests' | 'features' | 'audit') {
    this.view = v;
    if (v === 'audit' && !this.audit.length) this.loadAudit();
  }

  /** Fills the editable fields for a row from what the server holds. */
  private seed(r: PortfolioRequest) {
    this.quote[r.id] = r.quoteAmount ?? null;
    this.quoteNote[r.id] = r.quoteNote ?? '';
    this.adminNotes[r.id] = r.adminNotes ?? '';
    this.liveUrl[r.id] = r.liveUrl ?? '';
    this.picked[r.id] = new Set(r.approvedModules?.length ? r.approvedModules : r.modules ?? []);
    this.perms[r.id] = new Set(r.permissions ?? []);
  }

  get shown() {
    if (this.filter === 'all') return this.requests;
    if (this.filter === 'open') return this.requests.filter(r => !['live', 'rejected', 'cancelled'].includes(r.status));
    return this.requests.filter(r => r.status === this.filter);
  }

  get counts() {
    const by: Record<string, number> = {};
    for (const r of this.requests) by[r.status] = (by[r.status] ?? 0) + 1;
    return by;
  }

  get pendingFeatures() { return this.features.filter(f => f.status === 'pending'); }

  toggle(id: number) { this.openId = this.openId === id ? null : id; }

  /* ── Modules and permissions ── */

  moduleName(id: string) { return this.catalog.find(m => m.id === id)?.name ?? id; }
  guide(id: string) { return this.catalog.find(m => m.id === id)?.guide ?? 0; }

  isPicked(id: number, mod: string) { return this.picked[id]?.has(mod) ?? false; }
  pick(id: number, mod: string) {
    const set = (this.picked[id] ??= new Set());
    set.has(mod) ? set.delete(mod) : set.add(mod);
  }

  /** What the picked modules add up to, as a starting point for the quote. */
  suggested(id: number) {
    return [...(this.picked[id] ?? [])].reduce((s, m) => s + this.guide(m), 0);
  }
  useSuggested(id: number) { this.quote[id] = this.suggested(id) || null; }

  hasPerm(id: number, p: string) { return this.perms[id]?.has(p) ?? false; }
  togglePerm(id: number, p: string) {
    const set = (this.perms[id] ??= new Set());
    set.has(p) ? set.delete(p) : set.add(p);
  }

  /* ── Request actions ── */

  private patch(r: PortfolioRequest, body: any, ok: string) {
    this.busy[r.id] = true; this.err = ''; this.note = '';
    this.api.adminUpdate(r.id, body).subscribe({
      next: saved => { this.replace(saved); this.busy[r.id] = false; this.note = ok; },
      error: e => { this.err = this.msg(e); this.busy[r.id] = false; },
    });
  }

  approve(r: PortfolioRequest) {
    this.patch(r, { status: 'approved', approvedModules: [...(this.picked[r.id] ?? [])], notify: true }, `Request #${r.id} approved — the client has been emailed.`);
  }

  reject(r: PortfolioRequest) {
    this.patch(r, { status: 'rejected', quoteNote: this.quoteNote[r.id] || undefined, notify: true }, `Request #${r.id} closed.`);
  }

  sendQuote(r: PortfolioRequest) {
    const amount = Number(this.quote[r.id]);
    if (!Number.isFinite(amount) || amount <= 0) { this.err = 'Set a quote amount first.'; return; }
    this.patch(r, {
      status: 'quoted', approvedModules: [...(this.picked[r.id] ?? [])],
      quoteAmount: Math.round(amount), quoteNote: this.quoteNote[r.id] || undefined, notify: true,
    }, `Quote of ₹${Math.round(amount).toLocaleString('en-IN')} emailed to ${r.name}.`);
  }

  saveModules(r: PortfolioRequest) {
    this.patch(r, { approvedModules: [...(this.picked[r.id] ?? [])], notify: false }, 'Modules saved.');
  }

  savePermissions(r: PortfolioRequest) {
    this.patch(r, { permissions: [...(this.perms[r.id] ?? [])], notify: false }, `Permissions updated for ${r.name}.`);
  }

  saveNotes(r: PortfolioRequest) {
    this.patch(r, { adminNotes: this.adminNotes[r.id] ?? '', notify: false }, 'Notes saved.');
  }

  setStatus(r: PortfolioRequest, status: string) {
    const body: any = { status, notify: true };
    if (status === 'live') body.liveUrl = this.liveUrl[r.id] || undefined;
    this.patch(r, body, `Request #${r.id} is now ${this.label[status] ?? status}.`);
  }

  makeLink(r: PortfolioRequest) {
    this.busy[r.id] = true; this.err = ''; this.note = '';
    this.api.paymentLink(r.id).subscribe({
      next: saved => { this.replace(saved); this.busy[r.id] = false; this.note = 'Razorpay link created. Send it to the client or let them open it from their request.'; },
      error: e => { this.err = this.msg(e); this.busy[r.id] = false; },
    });
  }

  checkPayment(r: PortfolioRequest) {
    this.busy[r.id] = true; this.err = ''; this.note = '';
    this.api.verifyPayment(r.id).subscribe({
      next: res => {
        this.replace(res.request); this.busy[r.id] = false;
        this.note = res.confirmed
          ? `Payment confirmed. ${r.name} has been emailed a single-use link to set their password.`
          : `Razorpay still says "${res.razorpayStatus}". Nothing has been changed.`;
      },
      error: e => { this.err = this.msg(e); this.busy[r.id] = false; },
    });
  }

  confirmByHand(r: PortfolioRequest) {
    const ref = (this.payRef[r.id] ?? '').trim();
    if (ref.length < 4) { this.err = 'Enter the UPI or bank reference for the payment you received.'; return; }
    this.busy[r.id] = true; this.err = ''; this.note = '';
    this.api.markPaid(r.id, ref).subscribe({
      next: saved => {
        this.replace(saved); this.busy[r.id] = false; this.payRef[r.id] = '';
        this.note = `Payment recorded against ${ref}. ${r.name} has been emailed a setup link.`;
      },
      error: e => { this.err = this.msg(e); this.busy[r.id] = false; },
    });
  }

  resend(r: PortfolioRequest) {
    this.busy[r.id] = true; this.err = ''; this.note = '';
    this.api.resendCredentials(r.id).subscribe({
      next: saved => { this.replace(saved); this.busy[r.id] = false; this.note = `A fresh setup link is on its way to ${r.email}. The old one no longer works.`; },
      error: e => { this.err = this.msg(e); this.busy[r.id] = false; },
    });
  }

  /* ── Feature queue ── */

  decide(f: FeatureRequest, status: string) {
    this.fBusy[f.id] = true; this.err = ''; this.note = '';
    const price = Number(this.fPrice[f.id]);
    this.api.decideFeature(f.id, {
      status,
      price: Number.isFinite(price) && price >= 0 ? Math.round(price) : undefined,
      adminNote: this.fNote[f.id] || undefined,
      notify: true,
    }).subscribe({
      next: saved => {
        this.features = this.features.map(x => (x.id === saved.id ? saved : x));
        this.fBusy[f.id] = false;
        this.note = `"${f.title}" marked ${this.featureLabel[status].toLowerCase()} and the client has been emailed.`;
        if (status === 'approved' || status === 'done') this.load();
      },
      error: e => { this.err = this.msg(e); this.fBusy[f.id] = false; },
    });
  }

  requestName(id: number) { return this.requests.find(r => r.id === id)?.name ?? `#${id}`; }

  /* ── Small helpers ── */

  private replace(saved: PortfolioRequest) {
    this.requests = this.requests.map(r => (r.id === saved.id ? saved : r));
    this.seed(saved);
  }

  stepIndex(status: string) {
    const i = (this.steps as readonly string[]).indexOf(status);
    return i < 0 ? -1 : i;
  }

  inr(v?: number | null) { return typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : '—'; }

  private msg(e: any) {
    const m = e?.error?.message;
    return Array.isArray(m) ? m.join(' · ') : (m ?? 'Something went wrong. Try again.');
  }
}
