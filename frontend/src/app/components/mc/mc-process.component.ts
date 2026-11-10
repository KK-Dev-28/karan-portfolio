import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Figma "Process" frame — four sprint steps on a rail that fills as you scroll. */
@Component({
  selector: 'mc-process',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
  <section class="mc-sec" id="process" aria-labelledby="proc-title">
    <p class="mc-kicker">04 · Sprint-based delivery</p>
    <h2 id="proc-title" class="mc-title">From brief to launch</h2>

    <div class="rail" aria-hidden="true"><i [style.transform]="'scaleX(' + progress() + ')'"></i></div>
    <ol class="steps">
      <li *ngFor="let s of steps; let i = index" class="mc-card mc-holo step" [class.on]="progress() >= (i + .5) / steps.length">
        <span class="node" aria-hidden="true"></span>
        <p class="mc-mono">Step 0{{ i + 1 }}</p>
        <h3>{{ s.t }}</h3>
        <p class="d">{{ s.d }}</p>
      </li>
    </ol>
  </section>
  `,
  styles: [`
    :host{display:block}
    .rail{position:relative;height:2px;margin:70px 0 0;background:var(--border);border-radius:2px;overflow:hidden}
    .rail i{position:absolute;inset:0;transform-origin:left;background:linear-gradient(90deg,#b8860b,#e3b341,var(--electric));transition:transform .2s linear}
    .steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:30px}
    .step{margin-top:28px;padding:28px 28px 26px;min-height:200px;box-sizing:border-box;transition:border-color .4s,box-shadow .4s,opacity .5s;opacity:.55}
    .step.on{opacity:1;border-color:rgba(var(--accent-rgb),.55);box-shadow:var(--shadow-glow)}
    .node{position:absolute;top:-35px;left:28px;width:14px;height:14px;border-radius:50%;background:var(--bg);border:2px solid var(--border);transition:.4s}
    .on .node{background:#e3b341;border-color:#e3b341;box-shadow:0 0 0 6px rgba(227,179,65,.18)}
    .step .mc-mono{color:var(--accent);margin:0}
    h3{margin:16px 0 0;font:400 30px/1.1 var(--font-display);color:var(--text)}
    .d{margin:12px 0 0;font:400 15px/1.5 var(--font-body);color:var(--text-muted)}
    @media (max-width:1000px){.steps{grid-template-columns:1fr 1fr}.rail{display:none}.node{display:none}.step{opacity:1}}
    @media (max-width:600px){.steps{grid-template-columns:1fr}}
  `],
})
export class McProcessComponent implements OnInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  readonly progress = signal(0);
  readonly steps = [
    { t: 'Discover', d: 'Scope, constraints, success metrics.' },
    { t: 'Design', d: 'Flows, UI, architecture sketch.' },
    { t: 'Build', d: 'Weekly sprints with live demos.' },
    { t: 'Launch', d: 'Deploy, monitor, hand over.' },
  ];

  /* The rail fills from the moment the section's top crosses 80% of the
     viewport until its bottom reaches 60%. */
  private onScroll = () => {
    const r = (this.host.nativeElement as HTMLElement).getBoundingClientRect();
    const start = innerHeight * .8, end = innerHeight * .6;
    const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
    if (Math.abs(p - this.progress()) > .01) this.zone.run(() => this.progress.set(p));
  };

  ngOnInit() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this.progress.set(1); return; }
    this.zone.runOutsideAngular(() => addEventListener('scroll', this.onScroll, { passive: true }));
    this.onScroll();
  }
  ngOnDestroy() { removeEventListener('scroll', this.onScroll); }
}
