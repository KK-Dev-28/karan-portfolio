import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

/**
 * A small mockup of what a layout actually does, drawn from that layout's own
 * tokens rather than decorative guesswork. Container width, gap, corner radius
 * and column count are each read from the registry, so a layout added later
 * previews correctly with no work here, and a preview can never disagree with
 * the layout it represents — which the old hardcoded column map did.
 *
 * Deliberately pure CSS on a handful of divs: these render once per layout in a
 * picker list, so an iframe or a live render of the real page each would cost
 * far more than the preview is worth.
 */
@Component({
  selector: 'app-layout-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="lp" [attr.aria-hidden]="true">
      <span class="lp-page" [style.width.%]="pageWidth">
        <span class="lp-bar" [style.borderRadius.px]="radius"></span>
        <span class="lp-grid" [style.gap.px]="gap">
          <span class="lp-tile" *ngFor="let _ of tiles" [style.borderRadius.px]="radius"></span>
        </span>
        <span class="lp-line" [style.marginTop.px]="sectionGap"></span>
      </span>
    </span>
  `,
  styles: [`
    .lp {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 34px; flex: 0 0 44px;
      background: rgba(var(--accent-rgb), .06);
      border: 1px solid rgba(var(--accent-rgb), .18);
      border-radius: 5px; overflow: hidden; padding: 3px;
    }
    .lp-page { display: flex; flex-direction: column; gap: 2px; height: 100%; }
    .lp-bar  { height: 4px; background: rgba(var(--accent-rgb), .55); }
    .lp-grid { display: flex; flex: 1; }
    .lp-tile { flex: 1; background: rgba(var(--accent-rgb), .3); min-width: 1px; }
    .lp-line { height: 2px; background: rgba(var(--accent-rgb), .22); }
  `],
})
export class LayoutPreviewComponent implements OnChanges {
  @Input({ required: true }) layoutId!: string;

  pageWidth  = 100;
  gap        = 2;
  radius     = 1;
  sectionGap = 2;
  tiles: null[] = [null, null, null];

  constructor(private themeSvc: ThemeService) {}

  ngOnChanges() {
    const t = this.themeSvc.layoutTokens(this.layoutId);

    /* Widths are shown relative to the widest layout rather than absolutely, so
       the difference between a narrow and a wide one is visible at 44px. */
    const WIDEST = 1600;
    const px = (v: string) => parseFloat(v) || 0;
    const rem = (v: string) => (v.endsWith('rem') ? parseFloat(v) * 16 : px(v));

    this.pageWidth  = Math.round(Math.min(100, Math.max(52, (px(t['--container']) / WIDEST) * 100)));
    this.gap        = Math.max(1, Math.round(rem(t['--layout-gap']) / 12));
    this.sectionGap = Math.max(1, Math.round(rem(t['--section-py']) / 24));
    this.radius     = Math.max(0, Math.round(px(t['--radius']) / 5));

    const cols = Math.max(1, Math.min(6, parseInt(t['--grid-cols-3'], 10) || 3));
    this.tiles = Array(cols).fill(null);
  }
}
