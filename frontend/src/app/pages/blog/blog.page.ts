import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BlogApiService } from '../../services/blog.service';

declare const Razorpay: any;

type ModalView = 'login' | 'register' | 'pay' | 'register-form' | 'success';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPageComponent implements OnInit {
  posts: any[] = [];
  totalPages = 1;
  page = 1;
  loading = true;

  accessInfo: any = null;
  isLoggedIn = false;

  activeTag: string | null = null;
  allTags: string[] = [];

  showModal = false;
  modalView: ModalView = 'login';
  modalErr = '';
  busy = false;

  loginForm   = { email: '', password: '' };
  payForm     = { name: '', email: '' };
  regForm     = { registrationToken: '', email: '', username: '', name: '', password: '', confirm: '' };

  constructor(
    private blog: BlogApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.blog.isLoggedIn();
    this.blog.getAccessInfo().subscribe({ next: i => (this.accessInfo = i), error: () => {} });
    this.route.queryParamMap.subscribe(qp => {
      this.activeTag = qp.get('tag');
      this.loadPosts(1);
    });
  }

  loadPosts(page = 1) {
    this.loading = true;
    this.blog.getPosts(page).subscribe({
      next: r => {
        this.posts = r.posts;
        this.totalPages = r.pages;
        this.page = page;
        this.loading = false;
        this.buildTagList();
      },
      error: () => { this.loading = false; },
    });
  }

  private buildTagList() {
    const seen = new Set<string>();
    this.posts.forEach(p => (p.tags || []).forEach((t: string) => seen.add(t)));
    this.allTags = Array.from(seen).sort();
  }

  get filtered(): any[] {
    if (!this.activeTag) return this.posts;
    return this.posts.filter(p => (p.tags || []).includes(this.activeTag));
  }

  get featured(): any | null {
    return this.filtered.length > 0 && this.filtered[0].coverImage ? this.filtered[0] : null;
  }

  get gridPosts(): any[] {
    return this.featured ? this.filtered.slice(1) : this.filtered;
  }

  setTag(tag: string | null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tag ? { tag } : {},
      queryParamsHandling: '',
    });
  }

  get fmtAmount(): string {
    if (!this.accessInfo) return '₹249';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(this.accessInfo.amount / 100);
  }

  openLogin()    { this.modalView = 'login';  this.modalErr = ''; this.showModal = true; }
  openPay()      { this.modalView = 'pay';    this.modalErr = ''; this.showModal = true; }
  closeModal()   { if (!this.busy) this.showModal = false; }

  doLogin() {
    if (!this.loginForm.email || !this.loginForm.password) { this.modalErr = 'Email and password required.'; return; }
    this.busy = true; this.modalErr = '';
    this.blog.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: r => { this.blog.saveToken(r.token); this.isLoggedIn = true; this.busy = false; this.showModal = false; },
      error: (e: any) => { this.busy = false; this.modalErr = e?.error?.message || 'Login failed.'; },
    });
  }

  startPay() {
    if (!this.payForm.name.trim() || !this.payForm.email.trim()) { this.modalErr = 'Name and email required.'; return; }
    this.busy = true; this.modalErr = '';
    this.blog.checkout(this.payForm.name, this.payForm.email).subscribe({
      next: order => {
        const rzp = new Razorpay({
          key: order.keyId, amount: order.amount, currency: order.currency,
          name: 'KK Blog — Write Access', description: `Lifetime Access · ${this.fmtAmount}`,
          order_id: order.orderId, theme: { color: '#f59e0b' },
          prefill: { name: this.payForm.name, email: this.payForm.email },
          handler: (res: any) => {
            this.blog.verify({ razorpayOrderId: order.orderId, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature, name: this.payForm.name, email: this.payForm.email }).subscribe({
              next: r => {
                this.regForm = { registrationToken: r.registrationToken, email: this.payForm.email, username: '', name: this.payForm.name, password: '', confirm: '' };
                this.modalView = 'register-form'; this.busy = false;
              },
              error: () => { this.modalErr = 'Payment received but registration failed. Contact support.'; this.busy = false; },
            });
          },
          modal: { ondismiss: () => { this.busy = false; } },
        });
        rzp.open();
      },
      error: () => { this.busy = false; this.modalErr = 'Payment unavailable. Try again later.'; },
    });
  }

  doRegister() {
    if (!this.regForm.username || !this.regForm.password) { this.modalErr = 'Username and password required.'; return; }
    if (this.regForm.password !== this.regForm.confirm)   { this.modalErr = 'Passwords do not match.'; return; }
    this.busy = true; this.modalErr = '';
    const { confirm: _c, ...payload } = this.regForm;
    this.blog.register(payload).subscribe({
      next: r => { this.blog.saveToken(r.token); this.isLoggedIn = true; this.busy = false; this.modalView = 'success'; },
      error: (e: any) => { this.busy = false; this.modalErr = e?.error?.message || 'Registration failed.'; },
    });
  }

  readingTime(body: string): number {
    if (!body) return 1;
    return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
  }

  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return days < 30 ? `${days}d ago` : new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  excerpt(body: string): string { return body?.length > 160 ? body.slice(0, 160).trimEnd() + '…' : body; }
}
