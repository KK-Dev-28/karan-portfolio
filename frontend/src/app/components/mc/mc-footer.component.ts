import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MC_LINKS } from './mc-shared';

/** Figma "Creative · 06 Footer". */
@Component({
  selector: 'mc-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
  <footer class="foot">
    <div class="in">
      <p class="copy">© {{ year }} Karan Kapoor · Mohali, India</p>
      <nav aria-label="Footer">
        <a routerLink="/resume">Resume</a><a routerLink="/blog">Blog</a>
        <a [href]="links.github" target="_blank" rel="noopener">GitHub</a><a [href]="links.linkedin" target="_blank" rel="noopener">LinkedIn</a>
      </nav>
      <span class="avail"><span class="dot"></span>Available for new projects</span>
    </div>
  </footer>
  `,
  styles: [`
    :host{display:block}
    .foot{max-width:1440px;margin:0 auto;padding:0 clamp(16px,5.6vw,80px) 40px}
    .in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 32px;padding-top:20px;border-top:1px solid var(--border)}
    .copy{margin:0;font:400 13px var(--font-mono);color:var(--text-dim)}
    nav{display:flex;flex-wrap:wrap;gap:22px}
    nav a{font:500 12px var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);text-decoration:none}
    nav a:hover{color:var(--accent)}
    .avail{display:inline-flex;align-items:center;gap:10px;min-width:260px;justify-content:center;padding:10px 20px;border-radius:99px;
      border:1px solid var(--border);background:var(--card);font:500 13px var(--font-mono);color:var(--text-muted)}
    .dot{width:7px;height:7px;border-radius:50%;background:var(--electric);box-shadow:0 0 0 0 rgba(var(--electric-rgb),.6);animation:pulse 2s infinite}
    @keyframes pulse{70%{box-shadow:0 0 0 8px rgba(var(--electric-rgb),0)}}
    @media (prefers-reduced-motion:reduce){.dot{animation:none}}
  `],
})
export class McFooterComponent {
  readonly year = new Date().getFullYear();
  readonly links = MC_LINKS;
}
