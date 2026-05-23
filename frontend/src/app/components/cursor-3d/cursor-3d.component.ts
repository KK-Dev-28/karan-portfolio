import { Component, HostListener, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

@Component({
  selector: 'app-cursor-3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cursor-dot" [class.visible]="visible" [style.left.px]="x" [style.top.px]="y"></div>
    <div class="cursor-ring" [class.visible]="visible" [class.hovering]="hovering"
         [style.left.px]="rx" [style.top.px]="ry">
      <span class="cursor-label" *ngIf="label">{{ label }}</span>
    </div>
  `,
  styleUrl: './cursor-3d.component.scss',
})
export class Cursor3dComponent implements AfterViewInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  visible = false;
  hovering = false;
  label = '';

  x = 0; y = 0;    // dot position (immediate)
  rx = 0; ry = 0;  // ring position (lagged)

  private targetX = 0; private targetY = 0;
  private rafId = 0;
  private disabled = false;

  ngAfterViewInit() {
    const win = this.doc.defaultView;
    if (!win) { this.disabled = true; return; }
    const reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = win.matchMedia('(max-width: 768px)').matches;
    if (reduce || isMobile) { this.disabled = true; return; }

    const loop = () => {
      this.rx += (this.targetX - this.rx) * 0.18;
      this.ry += (this.targetY - this.ry) * 0.18;
      this.rafId = win.requestAnimationFrame(loop);
    };
    loop();
  }

  ngOnDestroy() {
    const win = this.doc.defaultView;
    if (win && this.rafId) win.cancelAnimationFrame(this.rafId);
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent) {
    if (this.disabled) return;
    this.x = e.clientX;
    this.y = e.clientY;
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.visible) { this.rx = e.clientX; this.ry = e.clientY; this.visible = true; }

    const el = this.doc.elementFromPoint(e.clientX, e.clientY);
    const interactive = el?.closest('button, a, input, textarea, select, [role="button"]');
    const cursorEl = el?.closest('[data-cursor]') as HTMLElement | null;

    this.label = cursorEl?.dataset?.['cursor'] ?? '';
    this.hovering = !!interactive || !!cursorEl;
  }

  @HostListener('document:mouseleave')
  onLeave() { this.visible = false; }
}
