import { Component, OnInit, OnDestroy, Output, EventEmitter, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Line { text: string; status?: string }

const LOG: Line[] = [
  { text: 'link: angular 19 client', status: 'ok' },
  { text: 'link: nestjs gateway', status: 'ok' },
  { text: 'link: postgresql', status: 'ok' },
  { text: 'radar: calibrating sweep', status: 'ok' },
  { text: 'all systems nominal · welcome aboard' },
];
const SEEN_KEY = 'kk_booted';

/**
 * The cover's opening: a ~1.4s mission boot log, then an iris opens onto the
 * hero. Shown once per browser session; skippable; skipped entirely under
 * prefers-reduced-motion.
 */
@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss',
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  @Output() done = new EventEmitter<void>();

  visible = true;
  hiding = false;
  shown: Line[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // Prerendered with the page so it covers it from the first paint; the log and iris run in the browser.
    if (!isPlatformBrowser(this.platformId)) return;
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
    if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) { this.finish(); return; }
    LOG.forEach((l, i) => this.timers.push(setTimeout(() => this.shown = [...this.shown, l], 120 + i * 210)));
    this.timers.push(setTimeout(() => this.open(), 120 + LOG.length * 210 + 260));
    addEventListener('keydown', this.skip);
  }

  ngOnDestroy() { this.timers.forEach(clearTimeout); if (isPlatformBrowser(this.platformId)) removeEventListener('keydown', this.skip); }

  skip = () => { if (!this.hiding) { this.timers.forEach(clearTimeout); this.shown = LOG; this.open(); } };

  private open() {
    this.hiding = true;
    this.timers.push(setTimeout(() => this.finish(), 760));
  }

  private finish() {
    removeEventListener('keydown', this.skip);
    this.visible = false;
    this.done.emit();
  }
}
