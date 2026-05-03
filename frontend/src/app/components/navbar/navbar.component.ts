// navbar.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from '../../../environments/environment';

@Component({ 
  selector: 'app-navbar', 
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './navbar.component.html', 
  styleUrls: ['./navbar.component.scss'] 
})
export class NavbarComponent implements OnInit {
  scrolled      = false;
  showModal     = false;
  loginLoading  = false;
  loginError    = '';
  form!:         FormGroup;
  theme: 'dark' | 'light' = 'dark';

  links = [
    { label:'Services',   id:'services' },
    { label:'Skills',     id:'skills' },
    { label:'Work',       id:'projects' },
    { label:'Journal',    id:'journal' },
    { label:'Experience', id:'experience' },
    { label:'Gigs',       id:'gigs' },
    { label:'Hire',       id:'hire' },
    { label:'FAQ',        id:'faq' },
    { label:'Source',     id:'source-code' },
    { label:'Contact',    id:'contact' },
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private themeSvc: ThemeService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({ password: ['', Validators.required] });
    this.themeSvc.initTheme();
    this.theme = this.themeSvc.getTheme();
  }

  @HostListener('window:scroll') onScroll() { this.scrolled = window.scrollY > 50; }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });
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
    if (status === 401) {
      return 'Wrong password. Try again.';
    }
    if (status === 0 || !status) {
      return `Cannot reach the API (${api}). Start the backend (e.g. npm run start:dev in backend) and check environment.apiUrl.`;
    }
    if (status === 404) {
      return `Login URL not found — check apiUrl (currently ${api}). It should end with /api.`;
    }
    const msg = e?.error?.message;
    const detail =
      typeof msg === 'string'
        ? msg
        : Array.isArray(msg)
          ? msg.join(' ')
          : e?.message || 'Request failed';
    return `${detail} (HTTP ${status})`;
  }

  isLoggedIn() { return this.auth.isLoggedIn(); }
  goAdmin()    { this.router.navigate(['/admin']); }
  toggleTheme() { this.theme = this.themeSvc.toggleTheme(); }
}