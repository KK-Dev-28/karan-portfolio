import { Injectable } from '@angular/core';
import { SiteContentService } from './site-content.service';

export type ThemeId  = 'midnight-gold' | 'blueprint' | 'terminal' | 'paper-ledger';
export type LayoutId = 'standard' | 'dossier' | 'atelier-grid';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  /** Short line shown under the swatch — what the palette is for / evokes. */
  blurb: string;
  /** [bg, card, accent] — used to paint the picker swatch, no HTTP round-trip needed. */
  swatch: [string, string, string];
  dark: boolean;
}

export interface LayoutMeta {
  id: LayoutId;
  label: string;
  blurb: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'midnight-gold',
    label: 'Midnight Gold',
    blurb: 'Deep space navy, gold + violet light. The site\u2019s original identity.',
    swatch: ['#07070e', '#0f0f1a', '#f59e0b'],
    dark: true,
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    blurb: 'Schematic navy canvas, cyan ink — reads like an engineering drawing.',
    swatch: ['#060b16', '#0b1526', '#38bdf8'],
    dark: true,
  },
  {
    id: 'terminal',
    label: 'Terminal',
    blurb: 'Console-dark charcoal-green with a muted jade signal, not neon.',
    swatch: ['#0a100d', '#0d1a14', '#6ee7b7'],
    dark: true,
  },
  {
    id: 'paper-ledger',
    label: 'Paper Ledger',
    blurb: 'Cool paper, ink navy text, a plum accent — the daylight option.',
    swatch: ['#eef0f4', '#ffffff', '#7a2e45'],
    dark: false,
  },
];

export const LAYOUTS: LayoutMeta[] = [
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'The default flow — balanced width, generous section breathing room.',
  },
  {
    id: 'dossier',
    label: 'Dossier',
    blurb: 'Narrower editorial column, tighter rhythm, hairline dividers between sections.',
  },
  {
    id: 'atelier-grid',
    label: 'Atelier Grid',
    blurb: 'Wider canvas, bigger radius and gaps — project/skill grids read as a bento board.',
  },
];

const LS_THEME    = 'kk_theme_id';
const LS_LAYOUT   = 'kk_layout_id';
const LS_OVERRIDE = 'kk_appearance_override'; // '1' once a visitor has manually picked something
const LEGACY_MODE  = 'kk_theme_mode';          // pre-multi-theme key: 'dark' | 'light'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme: ThemeId   = 'midnight-gold';
  private layout: LayoutId = 'standard';

  constructor(private siteContent: SiteContentService) {}

  themes()  { return THEMES; }
  layouts() { return LAYOUTS; }

  getTheme(): ThemeId   { return this.theme; }
  getLayout(): LayoutId { return this.layout; }

  /**
   * Call once on app bootstrap. Paints instantly from whatever is cached
   * locally (visitor override, or last-known site default), then asks the
   * backend for the current site default. If the visitor never overrode
   * anything, the backend value wins and is re-applied when it differs.
   */
  init(): void {
    this.migrateLegacyKey();
    this.applyTheme(this.readLocal(LS_THEME, THEMES, 'midnight-gold'));
    this.applyLayout(this.readLocal(LS_LAYOUT, LAYOUTS, 'standard'));

    const hasOverride = localStorage.getItem(LS_OVERRIDE) === '1';
    this.siteContent.getSection('appearance').subscribe({
      next: (data) => {
        if (!data) return;
        if (!hasOverride) {
          if (isThemeId(data.theme))   this.applyTheme(data.theme, /*persist*/ true);
          if (isLayoutId(data.layout)) this.applyLayout(data.layout, /*persist*/ true);
        }
      },
      error: () => { /* backend unreachable — keep whatever painted locally */ },
    });
  }

  /** Visitor-facing: cycles themes and remembers the choice only in this browser. */
  cycleTheme(): ThemeId {
    const idx  = THEMES.findIndex(t => t.id === this.theme);
    const next = THEMES[(idx + 1) % THEMES.length].id;
    this.setThemeLocal(next);
    return next;
  }

  /** Visitor picked a specific swatch — local-only, marks this browser as overridden. */
  setThemeLocal(id: ThemeId) {
    localStorage.setItem(LS_OVERRIDE, '1');
    this.applyTheme(id, true);
  }

  setLayoutLocal(id: LayoutId) {
    localStorage.setItem(LS_OVERRIDE, '1');
    this.applyLayout(id, true);
  }

  /** Admin-only: preview immediately in this session (does not persist). */
  preview(theme: ThemeId, layout: LayoutId) {
    this.applyTheme(theme, false);
    this.applyLayout(layout, false);
  }

  /** Admin-only: sets the site-wide default every future visitor will load. */
  saveAsSiteDefault(theme: ThemeId, layout: LayoutId) {
    this.applyTheme(theme, true);
    this.applyLayout(layout, true);
    return this.siteContent.updateSection('appearance', { theme, layout });
  }

  // ── internals ──────────────────────────────────────────────────────────

  private applyTheme(id: ThemeId, persist = false) {
    this.theme = id;
    document.documentElement.setAttribute('data-theme', id);
    if (persist) localStorage.setItem(LS_THEME, id);
  }

  private applyLayout(id: LayoutId, persist = false) {
    this.layout = id;
    document.documentElement.setAttribute('data-layout', id);
    if (persist) localStorage.setItem(LS_LAYOUT, id);
  }

  private readLocal<T extends { id: string }>(key: string, list: T[], fallback: string): T['id'] {
    const v = localStorage.getItem(key);
    return (list.some(x => x.id === v) ? v : fallback) as T['id'];
  }

  /** One-time migration from the old binary dark/light toggle. */
  private migrateLegacyKey() {
    if (localStorage.getItem(LS_THEME)) return; // already migrated
    const legacy = localStorage.getItem(LEGACY_MODE);
    if (!legacy) return;
    localStorage.setItem(LS_THEME, legacy === 'light' ? 'paper-ledger' : 'midnight-gold');
    localStorage.setItem(LS_OVERRIDE, '1');
    localStorage.removeItem(LEGACY_MODE);
  }
}

function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && THEMES.some(t => t.id === v);
}
function isLayoutId(v: unknown): v is LayoutId {
  return typeof v === 'string' && LAYOUTS.some(l => l.id === v);
}
