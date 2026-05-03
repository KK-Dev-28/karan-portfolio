import { Injectable } from '@angular/core';

type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'kk_theme_mode';

  initTheme() {
    const saved = this.getTheme();
    this.apply(saved);
  }

  getTheme(): ThemeMode {
    const v = localStorage.getItem(this.key);
    return v === 'light' ? 'light' : 'dark';
  }

  toggleTheme(): ThemeMode {
    const next: ThemeMode = this.getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.key, next);
    this.apply(next);
    return next;
  }

  private apply(mode: ThemeMode) {
    document.body.classList.toggle('light-theme', mode === 'light');
  }
}
