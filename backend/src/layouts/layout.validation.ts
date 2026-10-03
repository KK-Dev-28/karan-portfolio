/* Mirrors the front-end registry's rules. The browser validates so a preview
   cannot break the page; the server validates because a request can arrive
   without going through the browser at all, and because what is stored here is
   later served to every visitor. */

export const LAYOUT_TOKEN_VARS = [
  '--container', '--layout-gap', '--section-py', '--radius', '--radius-lg',
  '--grid-cols-2', '--grid-cols-3', '--grid-cols-4', '--grid-tile-min',
] as const;

const LENGTH_RE  = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|vw|vh|%|ch)$/;
const INTEGER_RE = /^\d{1,2}$/;
const ID_RE      = /^[a-z][a-z0-9-]{1,38}$/;

export const isValidLayoutId = (id: unknown): id is string =>
  typeof id === 'string' && ID_RE.test(id);

/** Drops unknown variables and malformed values rather than rejecting outright,
 *  so one bad field from a generation does not waste the whole response. */
export function sanitizeTokens(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Record<string, unknown>;

  for (const vr of LAYOUT_TOKEN_VARS) {
    const value = src[vr];
    if (typeof value !== 'string') continue;
    const v = value.trim();
    if (!v || v.length > 24) continue;
    const ok = vr.startsWith('--grid-cols-') ? INTEGER_RE.test(v) : LENGTH_RE.test(v);
    if (ok) out[vr] = v;
  }
  return out;
}

/* Values a generation is allowed to land on. A container narrower than the
   grid it holds, or a 30rem gap, is valid CSS and still an unusable page. */
const BOUNDS: Record<string, [number, number]> = {
  '--container':     [720, 1920],
  '--grid-tile-min': [160, 480],
  '--radius':        [0, 40],
  '--radius-lg':     [0, 60],
};

export function withinBounds(tokens: Record<string, string>): boolean {
  for (const [key, [lo, hi]] of Object.entries(BOUNDS)) {
    const v = tokens[key];
    if (v === undefined) continue;
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n < lo || n > hi) return false;
  }
  for (const key of ['--layout-gap', '--section-py']) {
    const v = tokens[key];
    if (v === undefined) continue;
    const n = parseFloat(v);
    const rem = v.endsWith('rem') ? n : n / 16;
    if (!Number.isFinite(rem) || rem < 0.25 || rem > 12) return false;
  }
  for (const key of ['--grid-cols-2', '--grid-cols-3', '--grid-cols-4']) {
    const v = tokens[key];
    if (v === undefined) continue;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < 1 || n > 6) return false;
  }
  return true;
}
