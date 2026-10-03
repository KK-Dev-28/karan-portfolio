/* ──────────────────────────────────────────────────────────────────────────
   LAYOUT REGISTRY — the single source of truth for every layout.

   A layout is purely structural: how wide the page runs, how much air sits
   between sections, how round the corners are, and how many columns the
   multi-up sections break into. Colour belongs to themes, which is why none
   appears here — every layout stays recognisably on-brand.

   Adding a layout means adding ONE entry below. No union type to widen, no
   stylesheet to edit, no column map to keep in step: the picker, its preview
   and the emitted CSS all read from this list. The previous arrangement kept
   the same facts in three places and had already drifted — the admin picker
   claimed Command rendered four columns while the stylesheet said three.

   Performance: these values are emitted once into a single <style> element at
   startup, so switching a layout stays a one-attribute change on <html> with
   no reflow of anything but the affected properties, no network request, and
   no per-switch work. Adding the hundredth layout costs one more CSS rule.
────────────────────────────────────────────────────────────────────────── */

/* The structural custom properties a layout is allowed to set. Anything not on
   this list is ignored when a layout is registered, which is what keeps a
   generated layout from reaching colour or arbitrary CSS. */
export const LAYOUT_TOKEN_VARS = [
  '--container',
  '--layout-gap',
  '--section-py',
  '--radius',
  '--radius-lg',
  '--grid-cols-2',
  '--grid-cols-3',
  '--grid-cols-4',
  '--grid-tile-min',
] as const;

export type LayoutTokenVar = (typeof LAYOUT_TOKEN_VARS)[number];
export type LayoutTokens   = Record<LayoutTokenVar, string>;

export interface LayoutDef {
  /** Used as the `html[data-layout]` value and persisted, so it must be stable. */
  id: string;
  label: string;
  /** Shown under the name in the picker — say what the layout is *for*. */
  blurb: string;
  tokens: LayoutTokens;
  /** True for layouts produced in the Design Studio rather than shipped in source. */
  generated?: boolean;
}

/* 'standard' states its values explicitly rather than relying on the :root
   defaults it happens to match. Without them the picker could not preview it,
   and switching back to it would have to special-case clearing the others. */
export const BUILT_IN_LAYOUTS: LayoutDef[] = [
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'The default flow — balanced 1200px column with generous breathing room between sections.',
    tokens: {
      '--container': '1200px', '--layout-gap': '2rem', '--section-py': '5.5rem',
      '--radius': '12px', '--radius-lg': '20px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '280px',
    },
  },
  {
    id: 'dossier',
    label: 'Dossier',
    blurb: 'Narrow editorial column (880px) with a tight rhythm — reads like a printed case file.',
    tokens: {
      '--container': '880px', '--layout-gap': '1.25rem', '--section-py': '4rem',
      '--radius': '8px', '--radius-lg': '14px',
      '--grid-cols-2': '1', '--grid-cols-3': '2', '--grid-cols-4': '2',
      '--grid-tile-min': '220px',
    },
  },
  {
    id: 'atelier-grid',
    label: 'Atelier Grid',
    blurb: 'Wide canvas (1360px) with large radii and gaps — project grids read as a bento board.',
    tokens: {
      '--container': '1360px', '--layout-gap': '2.75rem', '--section-py': '6.5rem',
      '--radius': '18px', '--radius-lg': '28px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '320px',
    },
  },
  {
    id: 'zen',
    label: 'Zen',
    blurb: 'Calm and airy (1040px) — a narrow column with the most whitespace of any layout.',
    tokens: {
      '--container': '1040px', '--layout-gap': '2.5rem', '--section-py': '8rem',
      '--radius': '16px', '--radius-lg': '26px',
      '--grid-cols-2': '2', '--grid-cols-3': '2', '--grid-cols-4': '3',
      '--grid-tile-min': '300px',
    },
  },
  {
    id: 'command',
    label: 'Command',
    blurb: 'Dense control-panel feel (1440px) — very wide, tight gaps, crisp small corners.',
    tokens: {
      '--container': '1440px', '--layout-gap': '1rem', '--section-py': '3.25rem',
      '--radius': '8px', '--radius-lg': '12px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '240px',
    },
  },
  {
    id: 'canvas',
    label: 'Canvas',
    blurb: 'Full-bleed gallery (1600px) — the widest container, with spacious tiles.',
    tokens: {
      '--container': '1600px', '--layout-gap': '3rem', '--section-py': '6rem',
      '--radius': '22px', '--radius-lg': '34px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '360px',
    },
  },
  {
    id: 'bento-hud',
    label: 'Bento HUD',
    blurb: 'High-density bento grid (1320px) with telemetry borders and micro-cards.',
    tokens: {
      '--container': '1320px', '--layout-gap': '1.5rem', '--section-py': '4.5rem',
      '--radius': '14px', '--radius-lg': '22px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '290px',
    },
  },
  {
    id: 'cinematic-wide',
    label: 'Cinematic Wide',
    blurb: 'Ultra-wide presentation canvas (1520px) with fluid margins and cinematic scale.',
    tokens: {
      '--container': '1520px', '--layout-gap': '2.5rem', '--section-py': '6.5rem',
      '--radius': '16px', '--radius-lg': '26px',
      '--grid-cols-2': '2', '--grid-cols-3': '3', '--grid-cols-4': '4',
      '--grid-tile-min': '340px',
    },
  },
];

/* ── Validation ───────────────────────────────────────────────────────────── */

/* Values arriving from the Design Studio are not trusted. Each must be a plain
   CSS length or integer, so nothing can smuggle a url(), an expression, or a
   closing brace that would escape the rule and alter unrelated styles. */
const LENGTH_RE  = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|vw|vh|%|ch)$/;
const INTEGER_RE = /^\d{1,2}$/;

function tokenValueIsValid(v: string, isColumnCount: boolean): boolean {
  const value = v.trim();
  if (!value || value.length > 24) return false;
  return isColumnCount ? INTEGER_RE.test(value) : LENGTH_RE.test(value);
}

/** Keeps only recognised vars holding well-formed values. */
export function sanitizeLayoutTokens(raw: Record<string, unknown>): Partial<LayoutTokens> {
  const clean: Partial<LayoutTokens> = {};
  for (const vr of LAYOUT_TOKEN_VARS) {
    const value = raw[vr];
    if (typeof value !== 'string') continue;
    if (tokenValueIsValid(value, vr.startsWith('--grid-cols-'))) {
      clean[vr] = value.trim();
    }
  }
  return clean;
}

/* ids reach CSS selectors and localStorage, so they stay to a strict shape. */
const ID_RE = /^[a-z][a-z0-9-]{1,38}$/;
export const isValidLayoutId = (id: string): boolean => ID_RE.test(id);

/* ── Registry ─────────────────────────────────────────────────────────────── */

const registry = new Map<string, LayoutDef>(BUILT_IN_LAYOUTS.map(l => [l.id, l]));

export function allLayouts(): LayoutDef[] {
  return [...registry.values()];
}

export function getLayout(id: string): LayoutDef | undefined {
  return registry.get(id);
}

export function isKnownLayout(id: unknown): id is string {
  return typeof id === 'string' && registry.has(id);
}

/* The fallback every lookup resolves to, so a layout removed between visits
   cannot leave a returning visitor on an id that no longer exists. */
export const DEFAULT_LAYOUT_ID = 'standard';

/**
 * Adds or replaces a layout. Missing tokens inherit from Standard, so a
 * partially specified layout is still complete and cannot render with gaps.
 * Returns the stored definition, or null when the input is unusable.
 */
export function registerLayout(input: {
  id: string; label?: string; blurb?: string;
  tokens: Record<string, unknown>; generated?: boolean;
}): LayoutDef | null {
  if (!isValidLayoutId(input.id)) return null;

  const tokens = sanitizeLayoutTokens(input.tokens);
  if (Object.keys(tokens).length === 0) return null;

  const base = registry.get(DEFAULT_LAYOUT_ID)!.tokens;
  const def: LayoutDef = {
    id: input.id,
    label: (input.label || input.id).slice(0, 48),
    blurb: (input.blurb || '').slice(0, 220),
    tokens: { ...base, ...tokens },
    generated: input.generated ?? false,
  };
  registry.set(def.id, def);
  return def;
}

/** Built-in layouts ship in source and are not removable. */
export function unregisterLayout(id: string): boolean {
  const def = registry.get(id);
  if (!def?.generated) return false;
  return registry.delete(id);
}

/* ── CSS emission ─────────────────────────────────────────────────────────── */

/* One rule per layout, emitted together into a single stylesheet. Switching
   then costs only the data-layout attribute change — no style recalculation
   beyond the properties themselves, and no work proportional to how many
   layouts exist. */
export function layoutsToCss(defs: LayoutDef[] = allLayouts()): string {
  return defs
    .map(def => {
      const body = LAYOUT_TOKEN_VARS
        .map(vr => `  ${vr}: ${def.tokens[vr]};`)
        .join('\n');
      return `html[data-layout="${def.id}"] {\n${body}\n}`;
    })
    .join('\n\n');
}
