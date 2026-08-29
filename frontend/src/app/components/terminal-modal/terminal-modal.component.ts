import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SoundService } from '../../services/sound.service';
import { ThemeService, THEMES } from '../../services/theme.service';

interface TerminalLine {
  text: string;
  type: 'cmd' | 'output' | 'info' | 'error' | 'success';
}

@Component({
  selector: 'app-terminal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal-modal.component.html',
  styleUrls: ['./terminal-modal.component.scss'],
})
export class TerminalModalComponent implements OnInit, OnDestroy {
  @ViewChild('cmdInput') cmdInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminalBody') terminalBody?: ElementRef<HTMLElement>;

  private readonly sound = inject(SoundService);
  private readonly themeSvc = inject(ThemeService);

  isOpen = false;
  currentInput = '';
  history: string[] = [];
  historyIndex = -1;

  lines: TerminalLine[] = [
    { text: 'KK-OS [Version 5.4.1] (x86_64-pc-linux-gnu)', type: 'info' },
    { text: 'Type "help" to view all available commands.', type: 'info' },
  ];

  ngOnInit() {
    (window as any).__openTerminalModal = () => this.open();
  }

  ngOnDestroy() {
    delete (window as any).__openTerminalModal;
  }

  open() {
    this.isOpen = true;
    this.sound.playPowerUp();
    setTimeout(() => {
      this.cmdInput?.nativeElement?.focus();
      this.scrollToBottom();
    }, 50);
  }

  close() {
    this.isOpen = false;
    this.sound.playBeep();
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeys(e: KeyboardEvent) {
    if (this.isOpen) {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      }
    }
  }

  private navigateHistory(delta: number) {
    if (this.history.length === 0) return;
    this.historyIndex = Math.max(0, Math.min(this.history.length - 1, this.historyIndex + delta));
    this.currentInput = this.history[this.historyIndex] || '';
  }

  submitCommand() {
    const raw = this.currentInput.trim();
    if (!raw) return;

    this.sound.playBeep();
    this.lines.push({ text: `karan@dev:~$ ${raw}`, type: 'cmd' });
    this.history.push(raw);
    this.historyIndex = this.history.length;
    this.currentInput = '';

    const args = raw.toLowerCase().split(' ');
    const cmd = args[0];

    switch (cmd) {
      case 'help':
        this.lines.push({ text: 'Available commands:', type: 'info' });
        this.lines.push({ text: '  skills       - Print categorized technical stack', type: 'output' });
        this.lines.push({ text: '  projects     - List production projects & case studies', type: 'output' });
        this.lines.push({ text: '  stack        - Full architectural technology matrix', type: 'output' });
        this.lines.push({ text: '  whoami       - Developer bio, MCA background & stats', type: 'output' });
        this.lines.push({ text: '  sync-demo    - Trigger SymmetricDS replication test', type: 'output' });
        this.lines.push({ text: '  theme [name] - Switch theme (matrix, gold, obsidian)', type: 'output' });
        this.lines.push({ text: '  contact      - Display direct reachability channels', type: 'output' });
        this.lines.push({ text: '  clear        - Wipe terminal buffer', type: 'output' });
        this.lines.push({ text: '  exit         - Close CLI terminal', type: 'output' });
        break;

      case 'skills':
        this.lines.push({ text: '== CORE TECHNICAL EXPERTISE ==', type: 'success' });
        this.lines.push({ text: '  • Frontend: Angular 19 Standalone, TypeScript, RxJS, Three.js/WebGL', type: 'output' });
        this.lines.push({ text: '  • Backend: .NET C# Web API, Entity Framework Core, NestJS CQRS', type: 'output' });
        this.lines.push({ text: '  • Databases: PostgreSQL, MSSQL, MongoDB, SymmetricDS Replication', type: 'output' });
        this.lines.push({ text: '  • AI & Cloud: Python NLP, Claude AI, Docker, Linux, CI/CD Actions', type: 'output' });
        break;

      case 'projects':
        this.lines.push({ text: '== FEATURED PRODUCTION SYSTEMS ==', type: 'success' });
        this.lines.push({ text: '  [1] OmniSync Commerce - Real-Time Offline SymmetricDS Sync', type: 'output' });
        this.lines.push({ text: '  [2] TaskFlow Kanban - Enterprise NestJS + Angular Drag & Drop', type: 'output' });
        this.lines.push({ text: '  [3] CloudEdu LMS - Multi-Tenant Education & Course Platform', type: 'output' });
        this.lines.push({ text: '  [4] Telemetry HUD - Sub-25ms Real-Time Analytics Pipeline', type: 'output' });
        break;

      case 'stack':
        this.lines.push({ text: 'Angular 19 · .NET Core · NestJS · PostgreSQL · MSSQL · Python · SymmetricDS · Docker', type: 'info' });
        break;

      case 'whoami':
        this.lines.push({ text: 'Karan K. - Full Stack Systems Architect & Software Engineer', type: 'success' });
        this.lines.push({ text: 'Education: Master of Computer Applications (MCA) - 8.4 CGPA Distinction', type: 'output' });
        this.lines.push({ text: 'Experience: Junior Software Developer @ CS Soft Solutions (3+ years)', type: 'output' });
        this.lines.push({ text: 'Specialization: Sub-25ms response APIs and high-availability database sync', type: 'output' });
        break;

      case 'sync-demo':
        this.lines.push({ text: '[SymmetricDS] Connecting to Node: master-db-01 (PostgreSQL)...', type: 'info' });
        this.lines.push({ text: '[SymmetricDS] Captured 14 batched changes on table "inventory_events"', type: 'output' });
        this.lines.push({ text: '[SymmetricDS] Pushing payloads to edge nodes (MSSQL, SQLite)...', type: 'output' });
        this.lines.push({ text: '[SymmetricDS] SUCCESS: 14/14 transactions synchronized in 18ms (Conflict: 0)', type: 'success' });
        this.sound.playSuccess();
        break;

      case 'contact':
        this.lines.push({ text: 'Email: contact@karan.dev', type: 'output' });
        this.lines.push({ text: 'LinkedIn: linkedin.com/in/karan-dev28', type: 'output' });
        this.lines.push({ text: 'GitHub: github.com/KK-Dev-28', type: 'output' });
        this.lines.push({ text: 'WhatsApp: +91 83602 10214', type: 'output' });
        break;

      case 'theme':
        const themeArg = args[1];
        if (themeArg) {
          const match = THEMES.find(t => t.id.includes(themeArg) || t.label.toLowerCase().includes(themeArg));
          if (match) {
            this.themeSvc.setThemeLocal(match.id);
            this.lines.push({ text: `Theme switched to "${match.label}"`, type: 'success' });
          } else {
            this.lines.push({ text: `Theme "${themeArg}" not found. Try: matrix, gold, obsidian, blueprint`, type: 'error' });
          }
        } else {
          this.lines.push({ text: 'Available: midnight-gold, cyber-matrix, obsidian-mono, blueprint, terminal', type: 'info' });
        }
        break;

      case 'clear':
        this.lines = [];
        break;

      case 'exit':
        this.close();
        break;

      default:
        this.lines.push({ text: `Command not found: "${cmd}". Type "help" for a list of commands.`, type: 'error' });
        break;
    }

    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.terminalBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 20);
  }
}
