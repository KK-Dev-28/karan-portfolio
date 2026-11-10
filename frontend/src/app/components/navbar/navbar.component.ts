import { inject, Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ThemeService, THEMES, LayoutMeta, ThemeId, LayoutId } from '../../services/theme.service';
import { LayoutPreviewComponent } from '../layout-preview/layout-preview.component';
import { environment } from '../../../environments/environment';

import { UiSoundService } from '../../services/ui-sound.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LayoutPreviewComponent],
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
  /* Filled in ngOnInit, not here: a field initializer can run before the
     injected service is assigned, and this must also pick up layouts the
     registry gains at runtime rather than the load-time snapshot. */
  layouts: LayoutMeta[] = [];
  currentTheme:  ThemeId = 'midnight-gold';
  currentLayout: LayoutId = 'standard';
  themeMenuOpen  = false;
  activePickerTab: 'themes' | 'layouts' = 'themes';

  readonly sound = inject(UiSoundService);
  links = [
    { label: 'Architecture', id: 'architecture' },
    { label: 'Journey',      id: 'journey' },
    { label: 'Services',     id: 'services' },
    { label: 'Process',      id: 'process' },
    { label: 'Kits',         id: 'kits' },
    { label: 'FAQ',          id: 'faq' },
  ];


  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private themeSvc: ThemeService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({ password: ['', Validators.required] });
    this.layouts = this.themeSvc.layouts();
    this.currentTheme = this.themeSvc.getTheme();
    this.currentLayout = this.themeSvc.getLayout();
  }

  ngOnDestroy() {}

  @HostListener('window:scroll')
  onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    this.scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    this.scrolled = scrollTop > 60;
    // Active link: the last section whose top has passed 40% of the viewport.
    // Checked on scroll rather than observed once, because the home page's
    // sections render after load (@defer) and the page is prerendered.
    const line = window.innerHeight * .4;
    let active = 'hero';
    for (const id of this.links.map(l => l.id)) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) active = id;
    }
    this.activeSection = active;
    if (this.menuOpen && scrollTop > 80) this.menuOpen = false;
  }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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
