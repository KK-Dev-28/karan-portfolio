import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../../services/analytics.service';
import { ContactService }   from '../../services/contact.service';
import { AuthService }      from '../../services/auth.service';
import { PortfolioJournalService, CreateJournalPayload } from '../../services/portfolio-journal.service';
import { SiteContentService } from '../../services/site-content.service';
import { ReviewsService }   from '../../services/reviews.service';
import { ServiceOrdersService } from '../../services/service-orders.service';
import { SurveyService }    from '../../services/survey.service';
import { DemosService }    from '../../services/demos.service';
import { BookingService }  from '../../services/booking.service';

type TabType = 'visitors' | 'messages' | 'breakdown' | 'payments' | 'newsletter' | 'journal' | 'cms' | 'reviews' | 'orders' | 'surveys' | 'demos' | 'bookings' | 'blog' | 'revenue';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPageComponent implements OnInit, OnDestroy {
  data: any       = null;
  loading         = true;
  tab: TabType    = 'visitors';

  journalForm!:   FormGroup;
  journalBusy    = false;
  journalErr     = '';

  cmsContent: Record<string, any> = {};
  cmsSection    = 'hero';
  cmsJson       = '';
  cmsBusy       = false;
  cmsSuccess    = false;
  cmsError      = '';
  cmsSections   = ['hero', 'skills', 'experience', 'services', 'faqs', 'gigs', 'contact-info', 'marquee', 'about'];

  surveyForm = { title: '', description: '', slug: '', status: 'draft', questions: '[]' };
  surveyBusy = false;
  surveyErr  = '';
  selectedSurveyResponses: any[] | null = null;
  selectedSurveyTitle = '';

  demos: any[] = [];
  demosBusy = false;
  demosErr  = '';
  demoForm = { title: '', description: '', category: 'web', type: 'image', url: '', thumbnailUrl: '', liveUrl: '', visible: true, sortOrder: 0 };

  bookings: any[] = [];
  bookingsLoading = false;

  private sub!: Subscription;

  constructor(
    private analytics: AnalyticsService,
    private contact:   ContactService,
    public  auth:      AuthService,
    private fb:        FormBuilder,
    private portfolioJournal: PortfolioJournalService,
    private cmsService: SiteContentService,
    private reviewsSvc: ReviewsService,
    private ordersSvc:  ServiceOrdersService,
    private surveySvc:  SurveyService,
    private demosSvc:    DemosService,
    private bookingSvc:  BookingService,
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
    this.loadCms();
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

  loadCms() {
    this.cmsService.getAll().subscribe(c => {
      this.cmsContent = c;
      this.selectCmsSection(this.cmsSection);
    });
  }

  selectCmsSection(section: string) {
    this.cmsSection = section;
    this.cmsJson = JSON.stringify(this.cmsContent[section] ?? {}, null, 2);
    this.cmsSuccess = false;
    this.cmsError = '';
  }

  saveCms() {
    this.cmsBusy = true;
    this.cmsSuccess = false;
    this.cmsError = '';
    let parsed: any;
    try { parsed = JSON.parse(this.cmsJson); } catch { this.cmsError = 'Invalid JSON.'; this.cmsBusy = false; return; }
    this.cmsService.updateSection(this.cmsSection, parsed).subscribe({
      next: () => {
        this.cmsBusy = false;
        this.cmsSuccess = true;
        this.cmsService.clearCache();
        this.cmsContent[this.cmsSection] = parsed;
      },
      error: () => { this.cmsBusy = false; this.cmsError = 'Could not save. Check JWT and try again.'; },
    });
  }

  approveReview(id: number) { this.reviewsSvc.moderate(id, 'approved').subscribe(() => this.load()); }
  rejectReview(id: number)  { this.reviewsSvc.moderate(id, 'rejected').subscribe(() => this.load()); }
  deleteReview(id: number)  { this.reviewsSvc.remove(id).subscribe(() => this.load()); }

  updateOrderStatus(id: number, status: string) { this.ordersSvc.updateStatus(id, status).subscribe(() => this.load()); }

  createSurvey() {
    this.surveyBusy = true; this.surveyErr = '';
    let questions: any[];
    try { questions = JSON.parse(this.surveyForm.questions); } catch { this.surveyErr = 'Invalid questions JSON.'; this.surveyBusy = false; return; }
    this.surveySvc.create({ ...this.surveyForm, questions }).subscribe({
      next: () => { this.surveyBusy = false; this.surveyForm = { title: '', description: '', slug: '', status: 'draft', questions: '[]' }; this.load(); },
      error: () => { this.surveyBusy = false; this.surveyErr = 'Could not create survey.'; },
    });
  }

  viewResponses(survey: any) {
    this.selectedSurveyTitle = survey.title;
    this.surveySvc.getResponses(survey.id).subscribe(r => (this.selectedSurveyResponses = r));
  }

  closeResponses() { this.selectedSurveyResponses = null; }

  toggleSurveyStatus(survey: any) {
    const newStatus = survey.status === 'active' ? 'closed' : 'active';
    this.surveySvc.update(survey.id, { status: newStatus }).subscribe(() => this.load());
  }

  deleteSurvey(id: number) { this.surveySvc.remove(id).subscribe(() => this.load()); }

  loadDemos() {
    const token = this.auth.getToken() ?? '';
    this.demosSvc.getAllAdmin(token).subscribe({ next: d => (this.demos = d), error: () => {} });
  }

  createDemo() {
    this.demosBusy = true; this.demosErr = '';
    const token = this.auth.getToken() ?? '';
    this.demosSvc.create(token, { ...this.demoForm }).subscribe({
      next: () => {
        this.demosBusy = false;
        this.demoForm = { title: '', description: '', category: 'web', type: 'image', url: '', thumbnailUrl: '', liveUrl: '', visible: true, sortOrder: 0 };
        this.loadDemos();
      },
      error: () => { this.demosBusy = false; this.demosErr = 'Could not save demo.'; },
    });
  }

  toggleDemoVisible(demo: any) {
    const token = this.auth.getToken() ?? '';
    this.demosSvc.update(token, demo.id, { visible: !demo.visible }).subscribe(() => this.loadDemos());
  }

  deleteDemo(id: number) {
    const token = this.auth.getToken() ?? '';
    this.demosSvc.remove(token, id).subscribe(() => this.loadDemos());
  }

  loadBookings() {
    this.bookingsLoading = true;
    const token = this.auth.getToken() ?? '';
    this.bookingSvc.getAll(token).subscribe({
      next: b => { this.bookings = b; this.bookingsLoading = false; },
      error: () => { this.bookingsLoading = false; },
    });
  }

  updateBookingStatus(id: number, status: string) {
    const token = this.auth.getToken() ?? '';
    this.bookingSvc.updateStatus(token, id, status).subscribe(() => this.loadBookings());
  }

  markRead(id: number) {
    this.contact.markRead(id).subscribe(() => {
      const m = this.data?.messages?.find((x: any) => x.id === id);
      if (m) m.isRead = true;
    });
  }

  submitJournal() {
    if (this.journalForm.invalid) { this.journalForm.markAllAsTouched(); return; }
    this.journalBusy = true; this.journalErr = '';
    const v = this.journalForm.getRawValue();
    const payload: CreateJournalPayload = { kind: v.kind, title: v.title.trim(), body: v.body.trim(), isPublished: !!v.isPublished };
    const link = (v.linkUrl || '').trim();
    if (link) payload.linkUrl = link;
    this.portfolioJournal.create(payload).subscribe({
      next: () => { this.journalBusy = false; this.journalForm.reset({ kind: 'learning', title: '', body: '', linkUrl: '', isPublished: true }); this.load(); },
      error: () => { this.journalBusy = false; this.journalErr = 'Could not save entry.'; },
    });
  }

  deleteJournal(id: number) { this.portfolioJournal.remove(id).subscribe(() => this.load()); }
  toggleJournalPublish(row: { id: number; isPublished: boolean }) {
    this.portfolioJournal.patch(row.id, { isPublished: !row.isPublished }).subscribe(() => this.load());
  }

  // ── Blog getters ──────────────────────────────────────
  get publishedBlogPosts(): number { return (this.data?.blogPosts || []).filter((p: any) => p.published).length; }
  get activeBlogUsers(): number    { return (this.data?.blogUsers || []).filter((u: any) => u.active).length; }

  // ── Revenue getters ───────────────────────────────────
  get confirmedBookings(): number { return this.bookings.filter(b => b.status === 'confirmed').length; }
  get paidOrders(): number { return (this.data?.serviceOrders || []).filter((o: any) => ['paid','delivered'].includes(o.status)).length; }

  get blogRevenueFormatted(): string {
    const writers = this.data?.blogUsers?.length || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(writers * 249);
  }
  get bookingRevenueFormatted(): string {
    const total = this.bookings.filter(b => b.status === 'confirmed').reduce((s: number, b: any) => s + (b.amount || 0), 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total / 100);
  }
  get orderRevenueFormatted(): string {
    const paid = (this.data?.serviceOrders || []).filter((o: any) => ['paid','delivered'].includes(o.status));
    const total = paid.reduce((s: number, o: any) => s + (o.amount || 0), 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total / 100);
  }

  entries(obj: Record<string, number>): [string, number][] {
    return obj ? Object.entries(obj).sort((a, b) => b[1] - a[1]) : [];
  }
  totalOf(obj: Record<string, number>): number {
    return obj ? Object.values(obj).reduce((a, b) => a + b, 0) : 0;
  }
  pct(val: number, total: number): number { return total === 0 ? 0 : Math.round((val / total) * 100); }
  moneyMinor(amount: number, currency: string): string {
    const c = (currency || 'usd').toUpperCase();
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(amount / 100); }
    catch { return `${(amount / 100).toFixed(2)} ${c}`; }
  }
  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
  logout() { this.auth.logout(); }
  ngOnDestroy() { this.sub?.unsubscribe(); }
}
