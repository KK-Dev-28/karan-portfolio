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
    blurb: 'Deep space navy, gold + violet light. The site’s original identity.',
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

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN STUDIO — fine-grained overrides on top of the chosen theme/layout.
   Every token below is a CSS custom property that already drives the site
   (see /DESIGN_SYSTEM.md). The admin can retune any of them live; the value
   is written straight onto <html> via style.setProperty, so nothing else
   needs wiring. Color tokens that have an `rgbTwin` also update the raw
   `r,g,b` companion var so alpha-blended effects (glows, washes) follow.
───────────────────────────────────────────────────────────────────────── */

export type TokenKind  = 'color' | 'size';
export type TokenGroup = 'Brand' | 'Surfaces' | 'Text' | 'Shape' | 'Spacing';

export interface DesignTokenDef {
  var: string;      // e.g. '--accent'
  label: string;    // human label in the Studio
  group: TokenGroup;
  kind: TokenKind;
  rgbTwin?: string; // companion '--*-rgb' to keep in sync for color tokens
  hint?: string;    // small helper text for size fields
}

export const DESIGN_TOKENS: DesignTokenDef[] = [
  // Brand
  { var: '--accent',     label: 'Accent',          group: 'Brand',    kind: 'color', rgbTwin: '--accent-rgb' },
  { var: '--accent-2',   label: 'Accent (bright)', group: 'Brand',    kind: 'color', rgbTwin: '--accent-2-rgb' },
  { var: '--violet',     label: 'Violet light',    group: 'Brand',    kind: 'color', rgbTwin: '--violet-rgb' },
  { var: '--electric',   label: 'Electric light',  group: 'Brand',    kind: 'color', rgbTwin: '--electric-rgb' },
  // Surfaces
  { var: '--bg',         label: 'Background',       group: 'Surfaces', kind: 'color' },
  { var: '--bg-2',       label: 'Background 2',     group: 'Surfaces', kind: 'color' },
  { var: '--bg-3',       label: 'Background 3',     group: 'Surfaces', kind: 'color' },
  { var: '--card',       label: 'Card surface',     group: 'Surfaces', kind: 'color' },
  { var: '--border',     label: 'Border',           group: 'Surfaces', kind: 'color' },
  // Text
  { var: '--text',       label: 'Text',             group: 'Text',     kind: 'color' },
  { var: '--text-muted', label: 'Text muted',       group: 'Text',     kind: 'color' },
  { var: '--text-dim',   label: 'Text dim',         group: 'Text',     kind: 'color' },
  // Shape
  { var: '--radius',     label: 'Card radius',      group: 'Shape',    kind: 'size', hint: 'e.g. 12px' },
  { var: '--radius-lg',  label: 'Large radius',     group: 'Shape',    kind: 'size', hint: 'e.g. 20px' },
  // Spacing
  { var: '--container',  label: 'Container width',  group: 'Spacing',  kind: 'size', hint: 'e.g. 1200px' },
  { var: '--layout-gap', label: 'Grid gap',         group: 'Spacing',  kind: 'size', hint: 'e.g. 2rem' },
  { var: '--section-py', label: 'Section spacing',  group: 'Spacing',  kind: 'size', hint: 'e.g. 5.5rem' },
];

const VALID_TOKEN_VARS = new Set(DESIGN_TOKENS.map(t => t.var));

export interface MotionSettings {
  /** Transition-speed multiplier for reveals/hovers. 1 = normal, >1 faster, <1 slower. */
  speed: number;
  /** Ambient volumetric light wash on/off. */
  ambient: boolean;
  /** Drifting starfield on/off. */
  stars: boolean;
  /** Master "reduce motion" — collapses all animation like the OS setting. */
  reduced: boolean;
}

export interface DesignConfig {
  /** Sparse map of token var → override value. Absent keys fall back to the theme. */
  tokens: Record<string, string>;
  motion: MotionSettings;
  /** Raw CSS injected site-wide, applied last so it can override anything. */
  customCss: string;
}

export function defaultMotion(): MotionSettings {
  return { speed: 1, ambient: true, stars: true, reduced: false };
}

export function defaultDesign(): DesignConfig {
  return { tokens: {}, motion: defaultMotion(), customCss: '' };
}

// Base transition speeds (mirror styles.scss :root) — scaled by motion.speed.
const T_BASE = { '--t-fast': 0.15, '--t-mid': 0.3, '--t-slow': 0.6 };
const CUSTOM_CSS_MAX = 40_000;
const CUSTOM_CSS_EL_ID = 'kk-custom-css';

const LS_THEME    = 'kk_theme_id';
const LS_LAYOUT   = 'kk_layout_id';
const LS_DESIGN   = 'kk_design';                // JSON DesignConfig, for instant paint
const LS_OVERRIDE = 'kk_appearance_override';   // '1' once a visitor has manually picked something
const LEGACY_MODE  = 'kk_theme_mode';           // pre-multi-theme key: 'dark' | 'light'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme: ThemeId   = 'midnight-gold';
  private layout: LayoutId = 'standard';
  private design: DesignConfig = defaultDesign();

  constructor(private siteContent: SiteContentService) {}

  themes()  { return THEMES; }
  layouts() { return LAYOUTS; }
  designTokens() { return DESIGN_TOKENS; }

  getTheme(): ThemeId   { return this.theme; }
  getLayout(): LayoutId { return this.layout; }
  /** Returns a detached copy so an editor can mutate it without touching live state. */
  getDesign(): DesignConfig {
    return {
      tokens: { ...this.design.tokens },
      motion: { ...this.design.motion },
      customCss: this.design.customCss,
    };
  }

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
    this.applyDesign(this.readLocalDesign(), false);

    const hasOverride = localStorage.getItem(LS_OVERRIDE) === '1';
    this.siteContent.getSection('appearance').subscribe({
      next: (data) => {
        if (!data) return;
        if (!hasOverride) {
          if (isThemeId(data.theme))   this.applyTheme(data.theme, /*persist*/ true);
          if (isLayoutId(data.layout)) this.applyLayout(data.layout, /*persist*/ true);
          this.applyDesign(normalizeDesign(data), /*persist*/ true);
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

  /** Admin-only: preview design overrides live in this session (does not persist). */
  previewDesign(design: DesignConfig) {
    this.applyDesign(design, false);
  }

  /** Admin-only: sets the site-wide default every future visitor will load. */
  saveAsSiteDefault(theme: ThemeId, layout: LayoutId) {
    this.applyTheme(theme, true);
    this.applyLayout(layout, true);
    return this.persistSiteDefault();
  }

  /** Admin-only: persist the current design overrides as the site-wide default. */
  saveDesignAsSiteDefault(design: DesignConfig) {
    this.applyDesign(design, true);
    return this.persistSiteDefault();
  }

  /** PUTs the full appearance record so neither tab clobbers the other's fields. */
  private persistSiteDefault() {
    return this.siteContent.updateSection('appearance', {
      theme:     this.theme,
      layout:    this.layout,
      tokens:    this.design.tokens,
      motion:    this.design.motion,
      customCss: this.design.customCss,
    });
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

  private applyDesign(design: DesignConfig, persist = false) {
    this.design = {
      tokens: { ...design.tokens },
      motion: { ...design.motion },
      customCss: design.customCss ?? '',
    };
    const root = document.documentElement;

    // 1) Token overrides. Clear any previously-set inline token first so a
    //    removed override reverts to the theme instead of sticking.
    for (const def of DESIGN_TOKENS) {
      root.style.removeProperty(def.var);
      if (def.rgbTwin) root.style.removeProperty(def.rgbTwin);
    }
    for (const [key, value] of Object.entries(this.design.tokens)) {
      const def = DESIGN_TOKENS.find(t => t.var === key);
      if (!def || !value) continue;
      root.style.setProperty(def.var, value);
      if (def.rgbTwin && def.kind === 'color') {
        const rgb = hexToRgb(value);
        if (rgb) root.style.setProperty(def.rgbTwin, rgb);
      }
    }

    // 2) Motion — speed scales the transition tokens; the rest are attributes
    //    that styles.scss keys off (data-ambient / data-stars / data-motion).
    const speed = clampSpeed(this.design.motion.speed);
    root.style.setProperty('--t-fast', round3(T_BASE['--t-fast'] / speed) + 's');
    root.style.setProperty('--t-mid',  round3(T_BASE['--t-mid']  / speed) + 's');
    root.style.setProperty('--t-slow', round3(T_BASE['--t-slow'] / speed) + 's');
    root.setAttribute('data-ambient', this.design.motion.ambient ? 'on' : 'off');
    root.setAttribute('data-stars',   this.design.motion.stars   ? 'on' : 'off');
    if (this.design.motion.reduced) root.setAttribute('data-motion', 'reduced');
    else root.removeAttribute('data-motion');

    // 3) Custom CSS — a single <style> element, applied last.
    applyCustomCss(this.design.customCss);

    if (persist) {
      try { localStorage.setItem(LS_DESIGN, JSON.stringify(this.design)); } catch { /* quota/full — skip */ }
    }
  }

  private readLocalDesign(): DesignConfig {
    try {
      const raw = localStorage.getItem(LS_DESIGN);
      if (!raw) return defaultDesign();
      return normalizeDesign(JSON.parse(raw));
    } catch { return defaultDesign(); }
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

/** Coerce an untrusted appearance record into a safe DesignConfig. */
export function normalizeDesign(data: any): DesignConfig {
  const out = defaultDesign();
  if (!data || typeof data !== 'object') return out;

  if (data.tokens && typeof data.tokens === 'object') {
    for (const [k, v] of Object.entries(data.tokens)) {
      if (VALID_TOKEN_VARS.has(k) && typeof v === 'string' && v.length <= 64) {
        out.tokens[k] = v;
      }
    }
  }
  if (data.motion && typeof data.motion === 'object') {
    const m = data.motion;
    out.motion = {
      speed:   clampSpeed(typeof m.speed === 'number' ? m.speed : 1),
      ambient: m.ambient !== false,
      stars:   m.stars   !== false,
      reduced: m.reduced === true,
    };
  }
  if (typeof data.customCss === 'string') {
    out.customCss = data.customCss.slice(0, CUSTOM_CSS_MAX);
  }
  return out;
}

function applyCustomCss(css: string) {
  let el = document.getElementById(CUSTOM_CSS_EL_ID) as HTMLStyleElement | null;
  const text = (css || '').slice(0, CUSTOM_CSS_MAX);
  if (!text) { if (el) el.textContent = ''; return; }
  if (!el) {
    el = document.createElement('style');
    el.id = CUSTOM_CSS_EL_ID;
    document.head.appendChild(el);
  }
  el.textContent = text;
}

/** '#f59e0b' → '245,158,11'. Returns null for anything not a 6-digit hex. */
export function hexToRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function clampSpeed(s: number): number {
  if (!Number.isFinite(s)) return 1;
  return Math.min(2, Math.max(0.4, s));
}
function round3(n: number): number { return Math.round(n * 1000) / 1000; }
