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
import { PaymentService }  from '../../services/payment.service';
import {
  ThemeService, THEMES, LAYOUTS, ThemeId, LayoutId,
  DESIGN_TOKENS, DesignTokenDef, DesignConfig, MotionSettings, TokenGroup, defaultDesign,
} from '../../services/theme.service';

type TabType = 'visitors' | 'messages' | 'breakdown' | 'payments' | 'approvals' | 'paylink' | 'newsletter' | 'journal' | 'cms' | 'appearance' | 'design' | 'reviews' | 'orders' | 'surveys' | 'demos' | 'bookings' | 'blog' | 'revenue';
type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all';

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

  // ── Date filter state ─────────────────────────────────
  dateFilter: DateFilter = 'all';
  customFrom = '';
  customTo   = '';

  // ── Search state ──────────────────────────────────────
  searchQuery = '';

  get filteredMessagesSearch() {
    const q = this.searchQuery.toLowerCase();
    return (this.filteredMessages as any[]).filter(m =>
      !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q)
    );
  }
  get filteredPaymentsSearch() {
    const q = this.searchQuery.toLowerCase();
    return (this.filteredPayments as any[]).filter(p =>
      !q || p.customerName?.toLowerCase().includes(q) || p.customerEmail?.toLowerCase().includes(q) || p.tier?.toLowerCase().includes(q)
    );
  }
  get filteredVisitorsSearch() {
    const q = this.searchQuery.toLowerCase();
    return (this.filteredVisitors as any[]).filter(v =>
      !q || v.ip?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q) || v.country?.toLowerCase().includes(q) || v.page?.toLowerCase().includes(q)
    );
  }
  get filteredOrdersSearch() {
    const q = this.searchQuery.toLowerCase();
    return (this.data?.serviceOrders ?? []).filter((o: any) =>
      !q || o.customerName?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q) || o.serviceType?.toLowerCase().includes(q)
    );
  }

  // ── Payment link generator ─────────────────────────────
  payLinkForm = { amount: 0, description: '', customerName: '', customerEmail: '', customerPhone: '' };
  payLinkBusy = false;
  payLinkResult: { url: string; id: string } | null = null;
  payLinkErr = '';
  payLinkCopied = false;

  generatePaymentLink() {
    if (!this.payLinkForm.amount || !this.payLinkForm.customerEmail || !this.payLinkForm.customerName) {
      this.payLinkErr = 'Amount, name and email are required.'; return;
    }
    this.payLinkBusy = true; this.payLinkErr = ''; this.payLinkResult = null;
    const token = this.auth.getToken() ?? '';
    const body = {
      amount:        Math.round(this.payLinkForm.amount * 100),
      description:   this.payLinkForm.description || 'Project Payment',
      customerName:  this.payLinkForm.customerName,
      customerEmail: this.payLinkForm.customerEmail,
      customerPhone: this.payLinkForm.customerPhone || undefined,
    };
    this.paymentSvc.createPaymentLink(token, body).subscribe({
      next: r => { this.payLinkBusy = false; this.payLinkResult = { url: r.url, id: r.id }; },
      error: (e: any) => { this.payLinkBusy = false; this.payLinkErr = e?.error?.message || 'Could not create link. Check Razorpay config.'; },
    });
  }

  copyPayLink() {
    if (!this.payLinkResult?.url) return;
    navigator.clipboard.writeText(this.payLinkResult.url);
    this.payLinkCopied = true;
    setTimeout(() => this.payLinkCopied = false, 2000);
  }

  // ── Approvals state ───────────────────────────────────
  pendingApprovals: any[] = [];
  approvalsLoading        = false;
  approvalActionBusy: Record<number, boolean> = {};
  approvalNote: Record<number, string>        = {};
  approvalReason: Record<number, string>      = {};
  approvalMsg: Record<number, string>         = {};
  approvalSnoozeHours: Record<number, number> = {};

  journalForm!:   FormGroup;
  journalBusy    = false;
  journalErr     = '';

  cmsContent: Record<string, any> = {};
  cmsSection    = 'hero';
  cmsJson       = '';
  cmsBusy       = false;
  cmsSuccess    = false;
  cmsError      = '';
  cmsSections   = ['hero', 'skills', 'experience', 'services', 'faqs', 'gigs', 'contact-info', 'marquee', 'about', 'tourGuide'];

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
    private analytics:    AnalyticsService,
    private contact:      ContactService,
    public  auth:         AuthService,
    private fb:           FormBuilder,
    private portfolioJournal: PortfolioJournalService,
    private cmsService:   SiteContentService,
    private reviewsSvc:   ReviewsService,
    private ordersSvc:    ServiceOrdersService,
    private surveySvc:    SurveyService,
    private demosSvc:     DemosService,
    private bookingSvc:   BookingService,
    private paymentSvc:   PaymentService,
    private themeSvc:     ThemeService,
  ) {}

  // ── Appearance (theme + layout) ────────────────────────
  appearanceThemes  = THEMES;
  appearanceLayouts = LAYOUTS;
  appearanceTheme:  ThemeId  = 'midnight-gold';
  appearanceLayout: LayoutId = 'standard';
  appearanceDirty   = false;
  appearanceBusy    = false;
  appearanceSuccess = false;
  appearanceError   = '';

  /** Column count each layout actually renders for its 3-up sections — mirrors
   *  --grid-cols-3 in styles.scss, so the picker thumbnail shows real density
   *  rather than an arbitrary decorative count. */
  private readonly layoutColCount: Record<LayoutId, number> = {
    'standard':       3,
    'dossier':        2,
    'atelier-grid':   3,
    'zen':            2,
    'command':        4,
    'canvas':         3,
    'bento-hud':      3,
    'cinematic-wide': 4,
  };
  layoutCols(id: LayoutId): number[] {
    return Array(this.layoutColCount[id] ?? 3);
  }

  pickAppearanceTheme(id: ThemeId) {
    this.appearanceTheme = id;
    this.appearanceDirty = true;
    this.appearanceSuccess = false;
    this.themeSvc.preview(this.appearanceTheme, this.appearanceLayout);
  }

  pickAppearanceLayout(id: LayoutId) {
    this.appearanceLayout = id;
    this.appearanceDirty = true;
    this.appearanceSuccess = false;
    this.themeSvc.preview(this.appearanceTheme, this.appearanceLayout);
  }

  saveAppearance() {
    this.appearanceBusy = true; this.appearanceError = ''; this.appearanceSuccess = false;
    this.themeSvc.saveAsSiteDefault(this.appearanceTheme, this.appearanceLayout).subscribe({
      next: () => { this.appearanceBusy = false; this.appearanceSuccess = true; this.appearanceDirty = false; },
      error: (e: any) => { this.appearanceBusy = false; this.appearanceError = e?.error?.message || 'Could not save. Try again.'; },
    });
  }

  // ── Design Studio (fine-grained token / motion / custom-CSS overrides) ──
  designTokenDefs = DESIGN_TOKENS;
  designGroups: TokenGroup[] = ['Brand', 'Surfaces', 'Text', 'Shape', 'Spacing', 'Grid'];
  design: DesignConfig = defaultDesign();
  /** Effective value shown in each field (override, else the theme's computed value). */
  tokenValues: Record<string, string> = {};
  designDirty   = false;
  designBusy    = false;
  designSuccess = false;
  designError   = '';

  tokensInGroup(g: TokenGroup): DesignTokenDef[] {
    return this.designTokenDefs.filter(t => t.group === g);
  }

  /** Called when the Design tab opens — snapshot current overrides + prefill fields. */
  initDesignEditor() {
    this.design = this.themeSvc.getDesign();
    this.refreshTokenValues();
    this.designDirty = false; this.designSuccess = false; this.designError = '';
  }

  private refreshTokenValues() {
    const cs = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const def of this.designTokenDefs) {
      const override = this.design.tokens[def.var];
      next[def.var] = (override ?? cs.getPropertyValue(def.var).trim()) || '';
    }
    this.tokenValues = next;
  }

  /** Coerce a field value to a #rrggbb hex the native color input accepts. */
  asHex(value: string): string {
    return /^#[0-9a-f]{6}$/i.test((value || '').trim()) ? value.trim() : '#000000';
  }

  setToken(def: DesignTokenDef, value: string) {
    this.tokenValues[def.var] = value;
    const v = (value || '').trim();
    if (v) this.design.tokens[def.var] = v;
    else delete this.design.tokens[def.var];
    this.markDesignDirty();
    this.themeSvc.previewDesign(this.design);
  }

  resetToken(def: DesignTokenDef) {
    delete this.design.tokens[def.var];
    this.themeSvc.previewDesign(this.design);
    // Overrides are cleared inline first, so the computed value is now the theme's.
    this.tokenValues[def.var] = getComputedStyle(document.documentElement).getPropertyValue(def.var).trim();
    this.markDesignDirty();
  }

  isTokenOverridden(def: DesignTokenDef): boolean {
    return Object.prototype.hasOwnProperty.call(this.design.tokens, def.var);
  }

  setMotion<K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) {
    this.design.motion = { ...this.design.motion, [key]: value };
    this.markDesignDirty();
    this.themeSvc.previewDesign(this.design);
  }

  setCustomCss(css: string) {
    this.design.customCss = css ?? '';
    this.markDesignDirty();
    this.themeSvc.previewDesign(this.design);
  }

  resetDesign() {
    this.design = defaultDesign();
    this.themeSvc.previewDesign(this.design);
    this.refreshTokenValues();
    this.markDesignDirty();
  }

  private markDesignDirty() { this.designDirty = true; this.designSuccess = false; }

  saveDesign() {
    this.designBusy = true; this.designError = ''; this.designSuccess = false;
    this.themeSvc.saveDesignAsSiteDefault(this.design).subscribe({
      next: () => { this.designBusy = false; this.designSuccess = true; this.designDirty = false; },
      error: (e: any) => { this.designBusy = false; this.designError = e?.error?.message || 'Could not save. Try again.'; },
    });
  }

  ngOnInit() {
    this.appearanceTheme  = this.themeSvc.getTheme();
    this.appearanceLayout = this.themeSvc.getLayout();
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
  // ── Date filter helpers ───────────────────────────────

  setDateFilter(f: DateFilter) {
    this.dateFilter = f;
    if (f !== 'custom') { this.customFrom = ''; this.customTo = ''; }
  }

  private filterByDate<T extends { createdAt?: string; visitedAt?: string }>(items: T[]): T[] {
    if (!items?.length) return items ?? [];
    const now   = new Date();
    const start = this.filterStart(now);
    const end   = this.filterEnd(now);
    if (!start) return items;
    return items.filter(i => {
      const d = new Date((i.createdAt ?? i.visitedAt) as string);
      return d >= start && d <= end;
    });
  }

  private filterStart(now: Date): Date | null {
    if (this.dateFilter === 'all') return null;
    if (this.dateFilter === 'today') {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    if (this.dateFilter === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
    }
    if (this.dateFilter === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1); return d;
    }
    if (this.dateFilter === 'custom' && this.customFrom) return new Date(this.customFrom);
    return null;
  }

  private filterEnd(now: Date): Date {
    if (this.dateFilter === 'custom' && this.customTo) {
      const d = new Date(this.customTo); d.setHours(23, 59, 59, 999); return d;
    }
    return now;
  }

  get filteredVisitors()  { return this.filterByDate(this.data?.analytics?.recent ?? []); }
  get filteredMessages()  { return this.filterByDate(this.data?.messages ?? []); }
  get filteredPayments()  { return this.filterByDate(this.data?.payments ?? []); }

  // ── Approvals ─────────────────────────────────────────

  loadApprovals() {
    this.approvalsLoading = true;
    const token = this.auth.getToken() ?? '';
    this.paymentSvc.getPendingApprovals(token).subscribe({
      next: a => { this.pendingApprovals = a; this.approvalsLoading = false; },
      error: () => { this.approvalsLoading = false; },
    });
  }

  doApprove(id: number) {
    this.approvalActionBusy[id] = true;
    const token = this.auth.getToken() ?? '';
    this.paymentSvc.approvePayment(token, id, this.approvalNote[id]).subscribe({
      next: () => { this.approvalActionBusy[id] = false; this.loadApprovals(); },
      error: () => { this.approvalActionBusy[id] = false; },
    });
  }

  doReject(id: number) {
    const reason = this.approvalReason[id]?.trim();
    if (!reason) return;
    this.approvalActionBusy[id] = true;
    const token = this.auth.getToken() ?? '';
    this.paymentSvc.rejectPayment(token, id, reason).subscribe({
      next: () => { this.approvalActionBusy[id] = false; this.loadApprovals(); },
      error: () => { this.approvalActionBusy[id] = false; },
    });
  }

  doRequestInfo(id: number) {
    const message = this.approvalMsg[id]?.trim();
    if (!message) return;
    this.approvalActionBusy[id] = true;
    const token = this.auth.getToken() ?? '';
    this.paymentSvc.requestInfo(token, id, message).subscribe({
      next: () => { this.approvalActionBusy[id] = false; this.loadApprovals(); },
      error: () => { this.approvalActionBusy[id] = false; },
    });
  }

  doSnooze(id: number) {
    const hours = this.approvalSnoozeHours[id] || 4;
    this.approvalActionBusy[id] = true;
    const token = this.auth.getToken() ?? '';
    this.paymentSvc.snoozePayment(token, id, hours).subscribe({
      next: () => { this.approvalActionBusy[id] = false; this.loadApprovals(); },
      error: () => { this.approvalActionBusy[id] = false; },
    });
  }

  logout() { this.auth.logout(); }
  ngOnDestroy() { this.sub?.unsubscribe(); }
}
