import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ThemeService, THEMES, LAYOUTS, ThemeId, LayoutId } from '../../services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  scrolled      = false;
  scrollPct     = 0;
  activeSection = 'hero';
  menuOpen      = false;
  showModal     = false;
  loginLoading  = false;
  loginError    = '';
  form!:         FormGroup;

  themes         = THEMES;
  layouts        = LAYOUTS;
  currentTheme:  ThemeId = 'midnight-gold';
  currentLayout: LayoutId = 'standard';
  themeMenuOpen  = false;
  activePickerTab: 'themes' | 'layouts' = 'themes';

  links = [
    { label: 'About',      id: 'story' },
    { label: 'Work',       id: 'projects' },
    { label: 'Skills',     id: 'skills' },
    { label: 'Experience', id: 'experience' },
    { label: 'Gigs',       id: 'gigs' },
    { label: 'Contact',    id: 'contact' },
  ];

  private observer!: IntersectionObserver;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private themeSvc: ThemeService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({ password: ['', Validators.required] });
    this.currentTheme = this.themeSvc.getTheme();
    this.currentLayout = this.themeSvc.getLayout();
    this.initSectionObserver();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private initSectionObserver() {
    const sectionIds = ['hero', ...this.links.map(l => l.id)];
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    setTimeout(() => {
      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) this.observer.observe(el);
      });
    }, 300);
  }

  @HostListener('window:scroll')
  onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    this.scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    this.scrolled = scrollTop > 60;
    if (this.menuOpen && scrollTop > 80) this.menuOpen = false;
  }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openLogin()  { this.showModal = true; this.loginError = ''; this.form.reset(); }
  closeModal() { this.showModal = false; }

  submit() {
    if (this.form.invalid) return;
    this.loginLoading = true; this.loginError = '';
    this.auth.login(this.form.value.password).subscribe({
      next: () => {
        this.loginLoading = false;
        this.showModal = false;
        this.router.navigate(['/admin']);
      },
      error: (err: unknown) => {
        this.loginLoading = false;
        this.loginError = this.loginErrorMessage(err);
      },
    });
  }

  private loginErrorMessage(err: unknown): string {
    const e = err as HttpErrorResponse;
    const status = e?.status;
    const api = environment.apiUrl;
    if (status === 401) return 'Wrong password. Try again.';
    if (status === 0 || !status) return `Cannot reach the API (${api}). Start the backend.`;
    if (status === 404) return `Login URL not found — check apiUrl (currently ${api}).`;
    const msg = e?.error?.message;
    const detail = typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(' ') : e?.message || 'Request failed';
    return `${detail} (HTTP ${status})`;
  }

  isLoggedIn() { return this.auth.isLoggedIn(); }
  goAdmin()    { this.router.navigate(['/admin']); }

  toggleThemeMenu() { this.themeMenuOpen = !this.themeMenuOpen; }
  currentSwatch() { return this.themes.find(t => t.id === this.currentTheme)?.swatch[2] ?? '#f59e0b'; }

  pickTheme(id: ThemeId) {
    this.currentTheme = id;
    this.themeSvc.setThemeLocal(id);
  }

  pickLayout(id: LayoutId) {
    this.currentLayout = id;
    this.themeSvc.setLayoutLocal(id);
  }
}
