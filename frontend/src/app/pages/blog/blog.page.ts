import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BlogApiService } from '../../services/blog.service';

type ModalView = 'login' | 'register' | 'success';

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
  isLoggedIn = false;
  activeTag: string | null = null;
  allTags: string[] = [];

  showModal = false;
  modalView: ModalView = 'login';
  modalErr = '';
  busy = false;

  loginForm   = { email: '', password: '' };
  regForm     = { email: '', username: '', name: '', password: '', confirm: '' };

  constructor(
    private blog: BlogApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.blog.isLoggedIn();
    this.route.queryParamMap.subscribe(qp => {
      this.activeTag = qp.get('tag');
      this.loadPosts(1);
    });
  }

  loadPosts(page = 1) {
    this.loading = true;
    this.blog.getPosts(page).subscribe({
      next: r => { this.posts = r.posts; this.totalPages = r.pages; this.page = page; this.loading = false; this.buildTagList(); },
      error: () => { this.loading = false; },
    });
  }

  private buildTagList() {
    const seen = new Set<string>();
    this.posts.forEach(p => (p.tags || []).forEach((t: string) => seen.add(t)));
    this.allTags = Array.from(seen).sort();
  }

  get filtered() { return this.activeTag ? this.posts.filter(p => (p.tags || []).includes(this.activeTag)) : this.posts; }
  get featured(): any | null { return this.filtered.length > 0 && this.filtered[0].coverImage ? this.filtered[0] : null; }
  get gridPosts()  { return this.featured ? this.filtered.slice(1) : this.filtered; }

  setTag(tag: string | null) {
    this.router.navigate([], { relativeTo: this.route, queryParams: tag ? { tag } : {}, queryParamsHandling: '' });
  }

  openLogin()    { this.modalView = 'login';    this.modalErr = ''; this.showModal = true; }
  openRegister() { this.modalView = 'register'; this.modalErr = ''; this.showModal = true; }
  closeModal()   { if (!this.busy) this.showModal = false; }

  doLogin() {
    if (!this.loginForm.email || !this.loginForm.password) { this.modalErr = 'Email and password required.'; return; }
    this.busy = true; this.modalErr = '';
    this.blog.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: r => { this.blog.saveToken(r.token); this.isLoggedIn = true; this.busy = false; this.showModal = false; },
      error: (e: any) => { this.busy = false; this.modalErr = e?.error?.message || 'Login failed.'; },
    });
  }

  doRegister() {
    const f = this.regForm;
    if (!f.email || !f.username || !f.name || !f.password) { this.modalErr = 'All fields are required.'; return; }
    if (f.password !== f.confirm) { this.modalErr = 'Passwords do not match.'; return; }
    if (f.password.length < 6)   { this.modalErr = 'Password must be at least 6 characters.'; return; }
    this.busy = true; this.modalErr = '';
    this.blog.registerFree({ email: f.email, username: f.username, name: f.name, password: f.password }).subscribe({
      next: r => { this.blog.saveToken(r.token); this.isLoggedIn = true; this.busy = false; this.modalView = 'success'; },
      error: (e: any) => { this.busy = false; this.modalErr = e?.error?.message || 'Registration failed. Try a different username.'; },
    });
  }

  readingTime(body: string): number { return Math.max(1, Math.ceil((body?.split(/\s+/).length || 0) / 200)); }

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
