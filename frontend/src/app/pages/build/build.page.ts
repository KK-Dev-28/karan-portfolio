import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CrewService } from '../../services/crew.service';
import {
  BuilderModule, BuilderService, DEFAULT_MODULES, PortfolioRequest, STATUS_LABEL, STATUS_STEPS,
} from '../../services/builder.service';

const STYLES = [
  { id: 'mission', name: 'Mission dark', hint: 'Deep navy, gold accents, motion' },
  { id: 'minimal', name: 'Clean light', hint: 'White space, sharp type' },
  { id: 'bold', name: 'Bold colour', hint: 'Gradients, big headlines' },
  { id: 'editorial', name: 'Editorial', hint: 'Serif type, magazine layout' },
];

/**
 * "Get a portfolio like this": pick modules, verify an email, describe yourself,
 * then follow the request through approval, quote, payment and launch.
 */
@Component({
  selector: 'app-build-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './build.page.html',
  styleUrls: ['./build.page.scss'],
})
export class BuildPageComponent implements OnInit {
  crew = inject(CrewService);
  private api = inject(BuilderService);

  readonly styles = STYLES;
  readonly steps = STATUS_STEPS;
  readonly label = STATUS_LABEL;
  readonly modules = signal<BuilderModule[]>(DEFAULT_MODULES);
  readonly groups = computed(() => {
    const out: { name: string; items: BuilderModule[] }[] = [];
    for (const m of this.modules()) {
      const g = out.find(x => x.name === m.group) ?? (out[out.length] = { name: m.group, items: [] });
      g.items.push(m);
    }
    return out;
  });
  readonly picked = signal<Set<string>>(new Set(DEFAULT_MODULES.filter(m => m.included).map(m => m.id)));
  readonly mine = signal<PortfolioRequest[]>([]);

  // Email verification
  email = ''; nameForCode = ''; code = '';
  codeSent = false; authBusy = false; authErr = '';

  // Request form
  form = this.blank();
  editingId: number | null = null;
  busy = false; err = ''; done = '';

  ngOnInit() {
    this.api.catalog().subscribe(m => {
      this.modules.set(m);
      this.picked.set(new Set(m.filter(x => x.included).map(x => x.id)));
    });
    this.crew.restore();
    setTimeout(() => this.loadMine(), 400);
  }

  toggle(m: BuilderModule) {
    if (m.included) return;
    const next = new Set(this.picked());
    next.has(m.id) ? next.delete(m.id) : next.add(m.id);
    this.picked.set(next);
  }

  sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(this.email)) { this.authErr = 'Enter a valid email.'; return; }
    this.authBusy = true; this.authErr = '';
    this.crew.start(this.email.trim(), this.nameForCode.trim()).subscribe({
      next: () => { this.authBusy = false; this.codeSent = true; },
      error: e => { this.authBusy = false; this.authErr = e?.error?.message ?? 'Could not send the code.'; },
    });
  }

  verifyCode() {
    this.authBusy = true; this.authErr = '';
    this.crew.verify(this.email.trim(), this.code.trim()).subscribe({
      next: m => {
        this.authBusy = false; this.code = '';
        if (!this.form.name) this.form.name = m.member.name ?? this.nameForCode;
        this.loadMine();
      },
      error: e => { this.authBusy = false; this.authErr = e?.error?.message ?? 'That code did not work.'; },
    });
  }

  loadMine() {
    if (!this.crew.member()) return;
    this.api.mine().subscribe({ next: r => this.mine.set(r), error: () => {} });
  }

  submit() {
    this.err = ''; this.done = '';
    if (this.form.name.trim().length < 2) { this.err = 'Add your name.'; return; }
    const links = [
      ['LinkedIn', this.form.linkedin], ['GitHub', this.form.github], ['Website', this.form.website],
    ].filter(([, u]) => u.trim()).map(([label, u]) => ({ label, url: /^https?:\/\//.test(u.trim()) ? u.trim() : 'https://' + u.trim() }));
    const body: Partial<PortfolioRequest> = {
      name: this.form.name.trim(), phone: this.form.phone || undefined, profession: this.form.profession || undefined,
      headline: this.form.headline || undefined, about: this.form.about || undefined, links,
      skills: this.form.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 40),
      projects: this.form.projects.filter(p => p.name.trim()).map(p => ({ name: p.name.trim(), summary: p.summary.trim(), url: p.url.trim() || undefined })),
      modules: [...this.picked()], style: this.form.style, domain: this.form.domain || undefined, notes: this.form.notes || undefined,
    };
    this.busy = true;
    const call = this.editingId ? this.api.update(this.editingId, body) : this.api.create(body);
    call.subscribe({
      next: () => {
        this.busy = false; this.done = this.editingId ? 'Request updated.' : 'Request sent. Karan will review it and email you.';
        this.editingId = null; this.form = this.blank(); this.loadMine();
      },
      error: e => {
        this.busy = false;
        const m = e?.error?.message; this.err = Array.isArray(m) ? m.join(' · ') : (m ?? 'Could not send. Try again.');
      },
    });
  }

  edit(r: PortfolioRequest) {
    const link = (l: string) => r.links.find(x => x.label === l)?.url ?? '';
    this.editingId = r.id;
    this.form = {
      ...this.blank(), name: r.name, phone: r.phone ?? '', profession: r.profession ?? '', headline: r.headline ?? '',
      about: r.about ?? '', linkedin: link('LinkedIn'), github: link('GitHub'), website: link('Website'),
      skills: r.skills.join(', '), style: r.style ?? 'mission', domain: r.domain ?? '', notes: r.notes ?? '',
      projects: [...r.projects.map(p => ({ name: p.name, summary: p.summary, url: p.url ?? '' })), ...this.blank().projects].slice(0, 3),
    };
    this.picked.set(new Set([...this.modules().filter(m => m.included).map(m => m.id), ...r.modules]));
    document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' });
  }

  stopEditing() { this.editingId = null; this.form = this.blank(); }

  accept(r: PortfolioRequest) { this.api.accept(r.id).subscribe({ next: () => this.loadMine(), error: e => alert(e?.error?.message ?? 'Could not accept.') }); }
  cancel(r: PortfolioRequest) {
    if (!confirm('Cancel this request?')) return;
    this.api.cancel(r.id).subscribe({ next: () => this.loadMine(), error: e => alert(e?.error?.message ?? 'Could not cancel.') });
  }

  stepIndex(s: string) { return (STATUS_STEPS as readonly string[]).indexOf(s); }
  canEdit(r: PortfolioRequest) { return ['submitted', 'approved', 'quoted'].includes(r.status); }
  moduleName(id: string) { return this.modules().find(m => m.id === id)?.name ?? id; }
  inr(n?: number | null) { return n == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }

  private blank() {
    return {
      name: '', phone: '', profession: '', headline: '', about: '', linkedin: '', github: '', website: '',
      skills: '', style: 'mission', domain: '', notes: '',
      projects: [{ name: '', summary: '', url: '' }, { name: '', summary: '', url: '' }, { name: '', summary: '', url: '' }],
    };
  }
}
