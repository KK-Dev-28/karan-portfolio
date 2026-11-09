import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

interface Faq { q: string; a: string }

/* Shown until FAQs are added in Admin → Content. */
const FALLBACK: Faq[] = [
  { q: 'How does pricing work?', a: 'No upfront prices. We discuss your needs first, then I send a custom quote.' },
  { q: 'How fast can you start?', a: 'Usually within a week. Quick fixes can often start in a day or two.' },
  { q: 'Do you work with existing codebases?', a: 'Yes. I start with a short audit, then work inside your conventions rather than rewriting them.' },
  { q: 'What happens after launch?', a: 'You get the code, docs and deploy setup. Ongoing support is available as a retainer.' },
];

/** Figma "Creative · 06 FAQ" — questions come from the CMS. */
@Component({
  selector: 'mc-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="mc-sec" id="faq" aria-labelledby="faq-title">
    <p class="mc-kicker">09 · FAQ</p>
    <h2 id="faq-title" class="mc-title">Questions, answered</h2>
    <div class="list">
      <div *ngFor="let f of faqs(); let i = index" class="mc-card row" [class.open]="open() === i">
        <h3>
          <button [attr.aria-expanded]="open() === i" [attr.aria-controls]="'faq-a-' + i" (click)="open.set(open() === i ? -1 : i)">
            <span>{{ f.q }}</span><i aria-hidden="true">{{ open() === i ? '−' : '+' }}</i>
          </button>
        </h3>
        <div class="a" [id]="'faq-a-' + i" role="region"><div><p>{{ f.a }}</p></div></div>
      </div>
    </div>
  </section>
  `,
  styles: [`
    :host{display:block}
    .list{display:grid;gap:24px;margin-top:52px}
    .row{border-radius:20px;transition:border-color .3s,box-shadow .3s}
    .row.open{border-color:rgba(var(--accent-rgb),.55);box-shadow:var(--shadow-glow)}
    h3{margin:0}
    button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:24px;padding:28px 32px;border:0;background:none;
      cursor:pointer;text-align:left;color:var(--text);font:400 clamp(22px,2vw,28px)/1.2 var(--font-display)}
    button:focus-visible{outline:2px solid var(--accent);outline-offset:-4px;border-radius:20px}
    i{flex:none;font:300 40px/1 var(--font-body);font-style:normal;color:var(--accent);transition:transform .3s}
    .open i{transform:rotate(180deg)}
    .a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s cubic-bezier(.2,.9,.2,1)}
    .open .a{grid-template-rows:1fr}
    .a>div{overflow:hidden}
    .a p{margin:0;padding:0 32px 28px;max-width:72ch;font:400 16px/1.6 var(--font-body);color:var(--text-muted)}
  `],
})
export class McFaqComponent implements OnInit {
  private cms = inject(SiteContentService);
  readonly faqs = signal<Faq[]>(FALLBACK);
  readonly open = signal(0);

  ngOnInit() {
    this.cms.getAll().subscribe({
      next: c => { const f = (c['faqs'] ?? []).filter((x: any) => x?.q && x?.a); if (f.length) this.faqs.set(f); },
      error: () => {},
    });
  }
}
