import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService, THEMES, ThemeId } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.scss'],
})
export class SidebarNavComponent implements OnInit, OnDestroy {
  private readonly themeSvc = inject(ThemeService);
  public readonly sound = inject(SoundService);
  private readonly auth = inject(AuthService);

  activeSection = 'hero';
  collapsed = false;
  themes = THEMES;
  currentTheme: ThemeId = 'midnight-gold';
  themeMenuOpen = false;

  navItems = [
    { id: 'hero', label: 'Core', icon: '🌌' },
    { id: 'skills', label: 'Topology', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'demos', label: 'Live Demos', icon: '💻' },
    { id: 'story', label: 'Story', icon: '📖' },
    { id: 'experience', label: 'Experience', icon: '🏆' },
    { id: 'gigs', label: 'Gigs & Cost', icon: '💼' },
    { id: 'contact', label: 'Contact', icon: '📬' },
  ];

  private observer!: IntersectionObserver;

  ngOnInit() {
    this.currentTheme = this.themeSvc.getTheme();
    this.initObserver();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private initObserver() {
    const ids = this.navItems.map(n => n.id);
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    setTimeout(() => {
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) this.observer.observe(el);
      });
    }, 300);
  }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    this.sound.playBeep();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.sound.playBeep();
  }

  toggleThemeMenu() {
    this.themeMenuOpen = !this.themeMenuOpen;
    this.sound.playBeep();
  }

  pickTheme(id: ThemeId) {
    this.currentTheme = id;
    this.themeSvc.setThemeLocal(id);
    this.themeMenuOpen = false;
    this.sound.playBeep();
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }
}
