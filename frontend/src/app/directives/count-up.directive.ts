import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

/**
 * Animates a number counting up from its previous value to a new one whenever
 * the bound value changes. Pure DOM text, no dependencies — used on KPI and
 * stat figures across the admin dashboard so the numbers feel alive instead
 * of just appearing.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges {
  /** The target number to animate to. Non-finite or missing values render as 0. */
  @Input('appCountUp') value: number | null | undefined = 0;
  /** Optional prefix/suffix, e.g. '₹' or '%'. */
  @Input() countUpPrefix = '';
  @Input() countUpSuffix = '';
  /** Animation length in ms. Shorter for small numbers so it never feels sluggish. */
  @Input() countUpMs = 700;

  private el = inject(ElementRef<HTMLElement>);
  private current = 0;
  private raf: number | null = null;
  private seen = false;

  ngOnChanges(changes: SimpleChanges) {
    if (!('value' in changes)) return;
    const target = Number.isFinite(this.value) ? Number(this.value) : 0;
    // First paint: show the real number at once, nothing to animate from.
    if (!this.seen) { this.seen = true; this.current = target; this.render(target); return; }
    this.animate(this.current, target);
  }

  private animate(from: number, to: number) {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (from === to) { this.render(to); return; }
    const start = performance.now();
    const dur = Math.max(150, this.countUpMs);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const v = from + (to - from) * eased;
      this.render(to >= 1000 || from >= 1000 ? Math.round(v) : Math.round(v * 10) / 10);
      if (t < 1) this.raf = requestAnimationFrame(tick);
      else { this.current = to; this.render(to); }
    };
    this.raf = requestAnimationFrame(tick);
  }

  private render(v: number) {
    const formatted = Math.abs(v) >= 1000 ? v.toLocaleString('en-IN') : String(v);
    this.el.nativeElement.textContent = `${this.countUpPrefix}${formatted}${this.countUpSuffix}`;
  }
}
