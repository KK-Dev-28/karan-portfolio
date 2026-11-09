import { Component, Input, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mcScrollTo } from './mc-shared';

/** The "↑ Back · Next section ↓" pills and "SCROLL · 01 / 08" counter on every Figma frame. */
@Component({
  selector: 'mc-section-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
  <nav class="sn" aria-label="Section navigation">
    <div class="pills">
      <button *ngIf="i() > 0" (click)="go(i() - 1)">↑ Back</button>
      <button *ngIf="i() < ids.length - 1" (click)="go(i() + 1)">Next section ↓</button>
    </div>
    <p class="count" aria-live="off">Scroll · {{ pad(i() + 1) }} / {{ pad(ids.length) }}</p>
  </nav>
  `,
  styles: [`
    :host{display:contents}
    .sn{position:fixed;z-index:880;top:84px;right:max(24px,env(safe-area-inset-right));display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}
    .pills{display:flex;gap:10px}
    button{pointer-events:auto;height:31px;padding:0 16px;border-radius:99px;border:1px solid rgba(var(--accent-rgb),.5);
      background:var(--nav-bg-scrolled);backdrop-filter:blur(10px);color:var(--accent);cursor:pointer;
      font:500 11px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;transition:background .2s,transform .2s}
    button:hover{background:rgba(var(--accent-rgb),.14);transform:translateY(-1px)}
    button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .count{margin:0;font:500 11px var(--font-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
    @media (max-width:1240px){.sn{display:none}}
  `],
})
export class McSectionNavComponent implements OnInit, OnDestroy {
  @Input({ required: true }) ids: string[] = [];
  readonly i = signal(0);
  private zone = inject(NgZone);
  private onScroll = () => {
    const y = window.innerHeight * .4;
    let cur = 0;
    this.ids.forEach((id, n) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= y) cur = n; });
    if (cur !== this.i()) this.zone.run(() => this.i.set(cur));
  };

  ngOnInit() { this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true })); }
  ngOnDestroy() { window.removeEventListener('scroll', this.onScroll); }

  go(n: number) { mcScrollTo(this.ids[n]); }
  pad(n: number) { return String(n).padStart(2, '0'); }
}
