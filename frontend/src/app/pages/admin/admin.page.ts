// src/app/pages/admin/admin.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../../services/analytics.service';
import { ContactService }   from '../../services/contact.service';
import { AuthService }      from '../../services/auth.service';
import { PortfolioJournalService, CreateJournalPayload } from '../../services/portfolio-journal.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.page.html',
  styleUrls:  ['./admin.page.scss'],
})
export class AdminPageComponent implements OnInit, OnDestroy {
  data: any       = null;
  loading         = true;
  tab: 'visitors' | 'messages' | 'breakdown' | 'payments' | 'newsletter' | 'journal' = 'visitors';
  journalForm!:   FormGroup;
  journalBusy    = false;
  journalErr     = '';
  private sub!: Subscription;

  constructor(
    private analytics: AnalyticsService,
    private contact:   ContactService,
    public  auth:      AuthService,
    private fb:        FormBuilder,
    private portfolioJournal: PortfolioJournalService,
  ) {}

  ngOnInit() {
    this.journalForm = this.fb.group({
      kind:         ['learning', Validators.required],
      title:        ['', [Validators.required, Validators.maxLength(200)]],
      body:         ['', [Validators.required, Validators.maxLength(8000)]],
      linkUrl:      ['', Validators.maxLength(500)],
      isPublished:  [true],
    });
    this.load();
    this.sub = interval(30_000)
      .pipe(switchMap(() => this.analytics.getDashboard()))
      .subscribe(d => (this.data = d));
  }

  load() {
    this.loading = true;
    this.analytics.getDashboard().subscribe({
      next:  d => { this.data = d; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  markRead(id: number) {
    this.contact.markRead(id).subscribe(() => {
      const m = this.data?.messages?.find((x: any) => x.id === id);
      if (m) m.isRead = true;
    });
  }

  submitJournal() {
    if (this.journalForm.invalid) {
      this.journalForm.markAllAsTouched();
      return;
    }
    this.journalBusy = true;
    this.journalErr = '';
    const v = this.journalForm.getRawValue();
    const payload: CreateJournalPayload = {
      kind: v.kind,
      title: v.title.trim(),
      body: v.body.trim(),
      isPublished: !!v.isPublished,
    };
    const link = (v.linkUrl || '').trim();
    if (link) payload.linkUrl = link;
    this.portfolioJournal.create(payload).subscribe({
      next: () => {
        this.journalBusy = false;
        this.journalForm.reset({
          kind: 'learning',
          title: '',
          body: '',
          linkUrl: '',
          isPublished: true,
        });
        this.load();
      },
      error: () => {
        this.journalBusy = false;
        this.journalErr = 'Could not save entry. Check API and validation.';
      },
    });
  }

  deleteJournal(id: number) {
    this.portfolioJournal.remove(id).subscribe(() => this.load());
  }

  toggleJournalPublish(row: { id: number; isPublished: boolean }) {
    this.portfolioJournal.patch(row.id, { isPublished: !row.isPublished }).subscribe(() => this.load());
  }

  entries(obj: Record<string, number>): [string, number][] {
    return obj ? Object.entries(obj).sort((a, b) => b[1] - a[1]) : [];
  }

  totalOf(obj: Record<string, number>): number {
    return obj ? Object.values(obj).reduce((a, b) => a + b, 0) : 0;
  }

  pct(val: number, total: number): number {
    return total === 0 ? 0 : Math.round((val / total) * 100);
  }

  moneyMinor(amount: number, currency: string): string {
    const c = (currency || 'usd').toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: c,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount / 100);
    } catch {
      return `${(amount / 100).toFixed(2)} ${c}`;
    }
  }

  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  logout() { this.auth.logout(); }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}