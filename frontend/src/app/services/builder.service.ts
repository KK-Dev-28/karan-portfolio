import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CrewService } from './crew.service';
import { SiteContentService } from './site-content.service';

export interface BuilderModule {
  id: string; name: string; blurb: string; icon: string;
  group: 'Core' | 'Content' | 'Business' | 'Advanced';
  /** Guide price in rupees, shown only in Admin. The quote is always the admin's call. */
  guide: number;
  included?: boolean;
}

/** Default catalog; Admin can override it through the CMS section "builderModules". */
export const DEFAULT_MODULES: BuilderModule[] = [
  { id: 'hero',      group: 'Core',     icon: '✦', name: 'Hero & about',        blurb: 'Your name, headline, photo and a short story.', guide: 0, included: true },
  { id: 'projects',  group: 'Core',     icon: '◆', name: 'Projects',            blurb: 'Case-study cards with images, stack and links.', guide: 0, included: true },
  { id: 'skills',    group: 'Core',     icon: '⚡', name: 'Skills',              blurb: 'Grouped skills with a clean visual layout.', guide: 0, included: true },
  { id: 'contact',   group: 'Core',     icon: '✉', name: 'Contact form',        blurb: 'Messages straight to your inbox.', guide: 0, included: true },
  { id: 'resume',    group: 'Content',  icon: '▤', name: 'Resume + PDF',        blurb: 'A resume page with one-click PDF download.', guide: 1500 },
  { id: 'blog',      group: 'Content',  icon: '✎', name: 'Blog',                blurb: 'Write posts, including live HTML demos.', guide: 2500 },
  { id: 'timeline',  group: 'Content',  icon: '⟶', name: 'Journey timeline',    blurb: 'Education and career as an animated path.', guide: 1000 },
  { id: 'gallery',   group: 'Content',  icon: '▦', name: 'Gallery / demos',     blurb: 'Screenshots, videos and live demos.', guide: 1500 },
  { id: 'services',  group: 'Business', icon: '◎', name: 'Services & pricing',  blurb: 'What you offer, with packages.', guide: 2000 },
  { id: 'booking',   group: 'Business', icon: '◷', name: 'Call booking',        blurb: 'Visitors book a slot with you.', guide: 2500 },
  { id: 'payments',  group: 'Business', icon: '₹', name: 'Online payments',     blurb: 'Take payments for your services.', guide: 4000 },
  { id: 'reviews',   group: 'Business', icon: '★', name: 'Testimonials',        blurb: 'Collect and approve client reviews.', guide: 1500 },
  { id: 'admin',     group: 'Advanced', icon: '⌘', name: 'Admin dashboard',     blurb: 'Edit content and see messages yourself.', guide: 5000 },
  { id: 'analytics', group: 'Advanced', icon: '◔', name: 'Visitor analytics',   blurb: 'Privacy-friendly stats on who visits.', guide: 3000 },
  { id: 'ai',        group: 'Advanced', icon: '◉', name: 'AI assistant',        blurb: 'A chat assistant that answers from your content.', guide: 5000 },
  { id: 'themes',    group: 'Advanced', icon: '◐', name: 'Themes & festive looks', blurb: 'Dark/light themes and seasonal styling.', guide: 2000 },
  { id: 'domain',    group: 'Advanced', icon: '⌂', name: 'Custom domain',       blurb: 'yourname.com set up for you (domain fee extra).', guide: 1000 },
];

export const STATUS_STEPS = ['submitted', 'approved', 'quoted', 'accepted', 'paid', 'building', 'live'] as const;
export const STATUS_LABEL: Record<string, string> = {
  submitted: 'Awaiting approval', approved: 'Approved, quote coming', rejected: 'Not taken on', quoted: 'Quote ready',
  accepted: 'Awaiting payment', paid: 'Paid', building: 'Being built', live: 'Live', cancelled: 'Cancelled',
};

/** Dashboard features the admin grants a client one at a time. */
export const PERMISSIONS: { id: string; name: string; blurb: string }[] = [
  { id: 'request_features', name: 'Request features',  blurb: 'Ask for new modules or changes from the dashboard.' },
  { id: 'edit_content',     name: 'Edit own content',   blurb: 'Change their headline, about text, links and skills.' },
  { id: 'view_analytics',   name: 'See visitor stats',  blurb: 'Read-only analytics for their own site.' },
  { id: 'download_data',    name: 'Download their data', blurb: 'Export everything stored about them as JSON.' },
  { id: 'manage_blog',      name: 'Write blog posts',   blurb: 'Publish to the blog on their own site.' },
  { id: 'manage_domain',    name: 'Manage domain',      blurb: 'Point their own domain at the site.' },
  { id: 'invite_team',      name: 'Invite teammates',   blurb: 'Give someone else access to their dashboard.' },
];

export const FEATURE_STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for review', approved: 'Approved', rejected: 'Not taken on', done: 'Built',
};

export interface FeatureRequest {
  id: number; requestId: number; email: string; title: string; details?: string | null;
  moduleId?: string | null; status: string; price?: number | null; adminNote?: string | null;
  decidedAt?: string | null; createdAt: string;
}

export interface AuditEntry {
  id: number; requestId?: number | null; actor: string; action: string; detail?: string | null; createdAt: string;
}

export interface BuilderStats {
  total: number; byStatus: Record<string, number>; bookedInr: number; pipelineInr: number;
}

export interface PortfolioRequest {
  id: number; email: string; name: string; phone?: string | null; profession?: string | null; headline?: string | null;
  about?: string | null; links: { label: string; url: string }[]; skills: string[];
  projects: { name: string; summary: string; url?: string }[]; modules: string[]; approvedModules: string[];
  permissions?: string[];
  style?: string | null; domain?: string | null; notes?: string | null; status: string;
  quoteAmount?: number | null; quoteNote?: string | null; paymentUrl?: string | null; paymentRef?: string | null;
  approvedAt?: string | null; paidAt?: string | null; credentialsSentAt?: string | null;
  liveUrl?: string | null; adminNotes?: string | null; createdAt: string; updatedAt: string;
}

const CLIENT_KEY = 'kk_client_token';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  private http = inject(HttpClient);
  private crew = inject(CrewService);
  private auth = inject(AuthService);
  private cms = inject(SiteContentService);
  private base = `${environment.apiUrl}/builder`;

  catalog(): Observable<BuilderModule[]> {
    return this.cms.getSection('builderModules').pipe(
      map((d: any) => (Array.isArray(d) && d.length ? d : DEFAULT_MODULES) as BuilderModule[]),
      catchError(() => of(DEFAULT_MODULES)),
    );
  }

  // Requester (crew email-code session)
  mine() { return this.http.get<PortfolioRequest[]>(`${this.base}/mine`, { headers: this.crew.authHeaders() }); }
  create(body: Partial<PortfolioRequest>) { return this.http.post<PortfolioRequest>(`${this.base}/requests`, body, { headers: this.crew.authHeaders() }); }
  update(id: number, body: Partial<PortfolioRequest>) { return this.http.patch<PortfolioRequest>(`${this.base}/requests/${id}`, body, { headers: this.crew.authHeaders() }); }
  accept(id: number) { return this.http.post<PortfolioRequest>(`${this.base}/requests/${id}/accept`, {}, { headers: this.crew.authHeaders() }); }
  cancel(id: number) { return this.http.post<PortfolioRequest>(`${this.base}/requests/${id}/cancel`, {}, { headers: this.crew.authHeaders() }); }

  // Paid client (password + emailed code)
  readonly clientToken = signal<string | null>(readKey());
  private clientHeaders() { return { headers: new HttpHeaders({ 'X-Client-Token': this.clientToken() ?? '' }) }; }
  setup(token: string, password: string) { return this.http.post<{ ok: boolean }>(`${this.base}/client/setup`, { token, password }); }
  login(email: string, password: string) { return this.http.post<{ otpSent: boolean }>(`${this.base}/client/login`, { email, password }); }
  verify(email: string, code: string) {
    return this.http.post<{ token: string; expires: string }>(`${this.base}/client/verify`, { email, code }).pipe(tap(r => {
      try { sessionStorage.setItem(CLIENT_KEY, r.token); } catch {}
      this.clientToken.set(r.token);
    }));
  }
  forgot(email: string) { return this.http.post<{ ok: boolean }>(`${this.base}/client/forgot`, { email }); }
  clientMe() { return this.http.get<{ email: string; lastLoginAt: string; sessionExpires: string; request: PortfolioRequest }>(`${this.base}/client/me`, this.clientHeaders()); }
  clientFeatures() { return this.http.get<{ permissions: string[]; items: FeatureRequest[] }>(`${this.base}/client/features`, this.clientHeaders()); }
  askFeature(body: { title: string; details?: string; moduleId?: string }) { return this.http.post<FeatureRequest>(`${this.base}/client/features`, body, this.clientHeaders()); }
  dropFeature(id: number) { return this.http.delete<{ ok: boolean }>(`${this.base}/client/features/${id}`, this.clientHeaders()); }
  clientExport() { return this.http.get<any>(`${this.base}/client/export`, this.clientHeaders()); }
  clientEditContent(patch: { headline?: string; about?: string; links?: { label: string; url: string }[]; skills?: string[] }) {
    return this.http.patch<PortfolioRequest>(`${this.base}/client/content`, patch, this.clientHeaders());
  }
  clientSignOutEverywhere() { return this.http.post<{ ok: boolean }>(`${this.base}/client/sign-out-everywhere`, {}, this.clientHeaders()); }
  clientLogout() {
    this.http.post(`${this.base}/client/logout`, {}, this.clientHeaders()).subscribe({ error: () => {} });
    try { sessionStorage.removeItem(CLIENT_KEY); } catch {}
    this.clientToken.set(null);
  }

  // Admin
  private admin() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` }) }; }
  adminList() { return this.http.get<PortfolioRequest[]>(`${this.base}/admin/requests`, this.admin()); }
  adminUpdate(id: number, patch: Partial<PortfolioRequest> & { notify?: boolean }) { return this.http.patch<PortfolioRequest>(`${this.base}/admin/requests/${id}`, patch, this.admin()); }
  paymentLink(id: number) { return this.http.post<PortfolioRequest>(`${this.base}/admin/requests/${id}/payment-link`, {}, this.admin()); }
  verifyPayment(id: number) { return this.http.post<{ confirmed: boolean; razorpayStatus: string; request: PortfolioRequest }>(`${this.base}/admin/requests/${id}/verify-payment`, {}, this.admin()); }
  markPaid(id: number, reference: string) { return this.http.post<PortfolioRequest>(`${this.base}/admin/requests/${id}/mark-paid`, { reference }, this.admin()); }
  resendCredentials(id: number) { return this.http.post<PortfolioRequest>(`${this.base}/admin/requests/${id}/resend-credentials`, {}, this.admin()); }
  adminStats() { return this.http.get<BuilderStats>(`${this.base}/admin/stats`, this.admin()); }
  adminFeatures(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<FeatureRequest[]>(`${this.base}/admin/features${q}`, this.admin());
  }
  decideFeature(id: number, patch: { status: string; price?: number; adminNote?: string; notify?: boolean }) {
    return this.http.patch<FeatureRequest>(`${this.base}/admin/features/${id}`, patch, this.admin());
  }
  adminAudit(requestId?: number) {
    const q = requestId ? `?requestId=${requestId}` : '';
    return this.http.get<AuditEntry[]>(`${this.base}/admin/audit${q}`, this.admin());
  }
  saveCatalog(mods: BuilderModule[]) { return this.cms.updateSection('builderModules', mods); }
}

/** Client sessions live in sessionStorage, so closing the browser signs the client out. */
function readKey(): string | null {
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(CLIENT_KEY); } catch { return null; }
}
