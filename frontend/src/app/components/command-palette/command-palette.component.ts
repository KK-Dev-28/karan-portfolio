import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService, THEMES, LAYOUTS, ThemeId, LayoutId } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { AnalyticsService } from '../../services/analytics.service';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Themes' | 'Layouts' | 'Actions' | 'Tools';
  icon: string;
  subtitle?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  private readonly themeSvc = inject(ThemeService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  isOpen = false;
  query = '';
  selectedIndex = 0;
  commands: CommandItem[] = [];

  ngOnInit() {
    this.buildCommandsList();
  }

  ngOnDestroy() {}

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.togglePalette();
    } else if (this.isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveSelection(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      }
    }
  }

  togglePalette() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.query = '';
      this.selectedIndex = 0;
      this.sound.playPowerUp();
      this.analytics.trackInteraction('open_command_palette', 'command_palette');
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
    } else {
      this.sound.playBeep();
    }
  }

  close() {
    this.isOpen = false;
    this.query = '';
  }

  get filteredCommands(): CommandItem[] {
    if (!this.query.trim()) return this.commands;
    const q = this.query.toLowerCase();
    return this.commands.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }

  private moveSelection(delta: number) {
    const total = this.filteredCommands.length;
    if (total === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + total) % total;
    this.sound.playBlip();
  }

  executeSelected() {
    const list = this.filteredCommands;
    if (list.length > 0 && list[this.selectedIndex]) {
      const selected = list[this.selectedIndex];
      this.sound.playSwoosh();
      this.close();
      selected.action();
    }
  }

  executeCommand(cmd: CommandItem) {
    this.sound.playSwoosh();
    this.close();
    cmd.action();
  }

  private buildCommandsList() {
    const list: CommandItem[] = [];

    // 1. Navigation
    const navSections = [
      { id: 'hero', title: 'Hero & 3D Core', icon: '🌌' },
      { id: 'skills', title: 'Architecture Topology & Skills', icon: '⚡' },
      { id: 'projects', title: 'Projects & Case Studies', icon: '🚀' },
      { id: 'demos', title: 'Live Embedded Applications', icon: '💻' },
      { id: 'story', title: 'Engineering Journey', icon: '📖' },
      { id: 'experience', title: 'Work Experience & Timeline', icon: '🏆' },
      { id: 'gigs', title: 'Freelance Offerings & Estimator', icon: '💼' },
      { id: 'contact', title: 'Contact & Booking', icon: '📬' },
    ];

    navSections.forEach(s => {
      list.push({
        id: `nav-${s.id}`,
        title: `Go to ${s.title}`,
        category: 'Navigation',
        icon: s.icon,
        action: () => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      });
    });

    // 2. Themes (8 Themes)
    THEMES.forEach(t => {
      list.push({
        id: `theme-${t.id}`,
        title: `Switch Theme: ${t.label}`,
        category: 'Themes',
        subtitle: t.blurb,
        icon: '🎨',
        action: () => this.themeSvc.setThemeLocal(t.id),
      });
    });

    // 3. Layouts (8 Layouts)
    LAYOUTS.forEach(l => {
      list.push({
        id: `layout-${l.id}`,
        title: `Switch Layout: ${l.label}`,
        category: 'Layouts',
        subtitle: l.blurb,
        icon: '📐',
        action: () => this.themeSvc.setLayoutLocal(l.id),
      });
    });

    // 4. Tools & Actions
    list.push(
      {
        id: 'action-cli',
        title: 'Open Interactive CLI Terminal',
        category: 'Tools',
        subtitle: 'Run Unix commands (> karan.sh)',
        icon: '💻',
        action: () => (window as any).__openTerminalModal?.(),
      },
      {
        id: 'action-tour',
        title: 'Launch AI Hologram Guided Tour',
        category: 'Actions',
        subtitle: 'Automated voice-narrated portfolio walkthrough',
        icon: '🧠',
        action: () => (window as any).__startAITour?.(),
      },
      {
        id: 'action-sfx',
        title: 'Toggle Web Audio Sound Effects',
        category: 'Actions',
        subtitle: 'Enable or mute futuristic synthesized sound effects',
        icon: '🎵',
        action: () => this.sound.toggleMute(),
      },
      {
        id: 'action-blog',
        title: 'Read Developer Blog',
        category: 'Navigation',
        subtitle: 'Technical deep-dives and engineering articles',
        icon: '📝',
        action: () => this.router.navigate(['/blog']),
      },
      {
        id: 'action-admin',
        title: 'Open Admin Studio & Credentials',
        category: 'Tools',
        subtitle: 'VS Code design studio and credentials',
        icon: '⚙️',
        action: () => this.router.navigate(['/admin']),
      }
    );

    this.commands = list;
  }
}
