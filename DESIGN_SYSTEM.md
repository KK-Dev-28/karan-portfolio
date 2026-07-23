# Design System

This is the reference for the site's visual language: every color, every
animation, every spacing rule, and how the theme/layout switcher wires into
all of it. If you're changing anything visual, start here rather than
guessing at a component's SCSS in isolation — most colors and spacing come
from the token layer in `frontend/src/styles.scss`, not from the component.

## Contents
1. [Philosophy](#1-philosophy)
2. [Typography](#2-typography)
3. [Themes](#3-themes)
4. [Layouts](#4-layouts)
5. [Spacing & breakpoints](#5-spacing--breakpoints)
6. [Motion catalog](#6-motion-catalog)
7. [Component conventions](#7-component-conventions)
8. [How switching actually works](#8-how-switching-actually-works)
9. [Extending the system](#9-extending-the-system)
10. [Known limitations](#10-known-limitations)

---

## 1) Philosophy

The site's thesis: this portfolio is itself evidence of engineering effort —
depth, motion, and precision are the pitch, not just the copy. That's why
the base identity (Midnight Gold) leans maximalist — 3D tilt, holographic
overlays, a drifting starfield, scroll-driven cinematics — rather than a
quiet minimal template. Every additional theme keeps that same *mechanism*
(glow cards, holo sweep, ambient wash, starfield) and only recolors it, so
switching themes never feels like switching sites.

Two axes are user-controllable, independently:
- **Theme** — the palette. Purely visual, no layout impact.
- **Layout** — the structure. Container width, section rhythm, grid density.
  No color impact.

## 2) Typography

| Role | Face | Used for |
|---|---|---|
| Display | Space Grotesk | `h1–h5`, `.sec-title` — carries the page's personality |
| Body | Inter | paragraphs, form fields, nav links |
| Utility / data | JetBrains Mono | `.sec-label` eyebrows ("§ WORK", "§ SKILLS") — reads as an annotation, not a heading |

The mono face on section labels is deliberate: on a developer's portfolio,
having the small structural labels look like code comments or log tags
reinforces the "built, not templated" thesis without being loud about it.

Type scale: `.sec-title` uses `clamp(2.4rem, 5vw, 4.2rem)` — fluid between
mobile and desktop rather than fixed breakpoint jumps.

## 3) Themes

Set via `html[data-theme="…"]`. Every theme defines the **same** variable
set, listed below with the full value table. If you add a fifth theme, copy
this table's left column exactly — anything you leave out silently falls
back to Midnight Gold's value (inherited from `:root`), which usually reads
as a bug (e.g. a jade-themed page with one stray gold border).

### 3.1 Midnight Gold (default — `midnight-gold`)
Deep space navy-black, gold + violet light. The site's original identity;
lives in `:root` directly (no override block needed).

| Token | Value |
|---|---|
| `--bg` / `--bg-2` / `--bg-3` | `#07070e` / `#0c0c16` / `#12121e` |
| `--card` | `#0f0f1a` |
| `--border` | `#23233a` |
| `--accent` / `--accent-2` | `#f59e0b` / `#fbbf24` |
| `--text` / `--text-muted` / `--text-dim` | `#f5f5f7` / `#9aa5bc` / `#646e88` |
| `--violet` / `--electric` | `#7c3aed` / `#06b6d4` |
| `--ambient-1/2/3` | violet-rgb / accent-rgb / electric-rgb |

### 3.2 Blueprint (`blueprint`)
Schematic navy canvas, cyan ink — reads like an engineering drawing.
Chosen deliberately as navy+cyan+indigo rather than the black+acid-green
"hacker" cliché: cooler, more precise, less neon.

| Token | Value |
|---|---|
| `--bg` / `--bg-2` / `--bg-3` | `#060b16` / `#0a1224` / `#0e1830` |
| `--card` | `#0b1526` |
| `--border` | `#1e3252` |
| `--accent` / `--accent-2` | `#38bdf8` / `#7dd3fc` |
| `--text` / `--text-muted` / `--text-dim` | `#eaf2fb` / `#8ca3c4` / `#55688a` |
| `--violet` / `--electric` | `#6366f1` / `#38bdf8` |

### 3.3 Terminal (`terminal`)
Console-dark charcoal-green, muted jade signal. Deliberately desaturated
(`#6ee7b7`, not `#39ff14`) and warm-black rather than pure `#000` — avoids
the exact "near-black + acid-green" AI-template look by being muted and
tinted instead of neon.

| Token | Value |
|---|---|
| `--bg` / `--bg-2` / `--bg-3` | `#0a100d` / `#0e1712` / `#121f18` |
| `--card` | `#0d1a14` |
| `--border` | `#24392e` |
| `--accent` / `--accent-2` | `#6ee7b7` / `#34d399` |
| `--text` / `--text-muted` / `--text-dim` | `#e7f5ec` / `#8fae9c` / `#5a7368` |
| `--violet` / `--electric` | `#34d399` / `#a3e635` |

### 3.4 Paper Ledger (`paper-ledger`)
The one light theme. Cool blue-grey paper (not warm cream) + ink navy text
+ a deep plum accent (not terracotta) — deliberately avoids the
cream-serif-terracotta AI-template look while still reading as "daylight,
readable, print-like." Fitting given the site has a literal Journal feature.

| Token | Value |
|---|---|
| `--bg` / `--bg-2` / `--bg-3` | `#eef0f4` / `#e7e9ee` / `#dde0e7` |
| `--card` | `#ffffff` |
| `--border` | `#cbd0da` |
| `--accent` / `--accent-2` | `#7a2e45` / `#a24361` |
| `--text` / `--text-muted` / `--text-dim` | `#1a2233` / `#55607a` / `#8790a6` |
| `--violet` / `--electric` | `#4c3a91` / `#2b6f77` |
| `--noise-opacity` / `--ambient-opacity` / `--star-opacity` | `.06` / `.35` / `.18` (dialed down vs. the dark themes' `.25`/`.75`/`.35` — the ambient/noise/star effects need to be much subtler on white) |

### 3.5 The `-rgb` companion variables
Every color also has a `--*-rgb: r,g,b` twin (`--accent-rgb`,
`--violet-rgb`, `--electric-rgb`, `--accent-2-rgb`). These exist so
alpha-blended effects can do `rgba(var(--accent-rgb), .2)` — CSS custom
properties can't have alpha extracted from a hex value, so the raw
components have to be stored separately. **Every** hardcoded
`rgba(245,158,11,…)` in the codebase was converted to this pattern (285
substitutions across 34 component files) — if you hardcode a new one, it
will not react to theme switching. Search for literal `rgba(` + a number
before adding any new color; it should always resolve to a var.

## 4) Layouts

Set via `html[data-layout="…"]`. Purely structural — no color tokens here.

| Token | Standard (default) | Dossier | Atelier Grid |
|---|---|---|---|
| `--container` | `1200px` | `880px` | `1360px` |
| `--layout-gap` | `2rem` | `1.25rem` | `2.75rem` |
| `--section-py` | `5.5rem` | `4rem` | `6.5rem` |
| `--radius` / `--radius-lg` | `12px` / `20px` | `8px` / `14px` | `18px` / `28px` |
| `--grid-cols-3` | `3` | `2` | `3` |
| `--grid-cols-4` | `4` | `2` | `4` |
| `--grid-cols-2` | `2` | `1` | `2` |
| `--grid-tile-min` (base tile width for `auto-fill`/`auto-fit` grids) | `280px` | `220px` | `320px` |

**Standard** — the default flow, balanced width.

**Dossier** — narrower editorial column, tighter rhythm. Also gets one
structural device unique to it: a hairline `border-top` between consecutive
`section[class*="-sec"]` elements (skipped on the first section), turning
the page into a stack of dated/ruled entries — fitting an editorial density
thesis. See the `html[data-layout="dossier"]` rule in `styles.scss`.

**Atelier Grid** — wider canvas, bigger radius and gaps; project/skill/
service grids widen back to 3–4 columns with more breathing room, reading
as a bento board rather than a list.

`--grid-cols-2/3/4` and `--grid-tile-min` drive every fixed or fluid grid in
**actual portfolio content**:

- Fixed `repeat(N, 1fr)` grids → `.bento-grid` (projects), `.tech-icon-grid`
  (skills), `.featured-grid` / `.more-grid` / `.channels-grid` (services),
  `.gigs-grid`, the source-offering picker grid, digital-products grid,
  booking grid, testimonials grid, hire-pricing grid, the blog listing grid,
  and the blog profile's post grid.
- Fluid `repeat(auto-fill/auto-fit, minmax(--grid-tile-min, 1fr))` grids →
  the home page Demos gallery and the AI Tools grid. These were already
  responsive by construction (column count self-adjusts to `--container`
  width), so wiring `--grid-tile-min` additionally changes *how big* each
  tile is per layout — Atelier Grid's tiles are visibly chunkier, Dossier's
  are visibly tighter, not just differently counted.

Mobile/tablet breakpoint overrides for all of the above (e.g. `@media
(max-width: 900px) { .gigs-grid { grid-template-columns: repeat(2, 1fr); } }`)
are intentionally left as fixed numbers — small-screen density shouldn't
change with the admin's desktop layout choice.

**Deliberately NOT wired to layout tokens**, and why:
- **`admin.page.scss`** — the admin dashboard is a management tool, not
  portfolio content. Its grids (KPI strips, appearance swatch grid, etc.)
  stay at a constant density regardless of what layout the admin picks *for
  the public site* — otherwise choosing "Dossier" would visually degrade
  the admin's own dashboard, which makes no sense.
- **`demo-analytics.page.scss`** — a sample analytics dashboard shown as a
  work sample (proof of dashboard-building skill), not the portfolio's own
  structure.
- **`report.page.scss` / `deck.page.scss`** — viewers for generated
  client deliverables (a report should look like a report regardless of
  the portfolio's current theme/layout).
- **`site.page.scss`** — renders *other* hypothetical client site
  templates (`.r-*` restaurant demo, `.a-*` agency demo) shown to
  prospects. These are mockups of someone else's site, not this one, and
  must not reskin when Karan changes his own portfolio's appearance.
- **`case-study.page.scss` `.cs-highlights`** — small fixed-size stat
  chips (160px), not content cards; deliberately excluded from tile-size
  scaling. `.cs-paths` on the same page *is* wired, since those are real
  content cards.

## 5) Spacing & breakpoints

- Container padding: `2rem` desktop, `1.25rem` at `≤768px`.
- Section vertical rhythm comes from `--section-py` (layout-driven, see §4),
  applied via `section[class*="-sec"] { padding: var(--section-py) 0 !important; }`.
  The `!important` exists because component-level `.foo-sec { padding: … }`
  rules would otherwise win on specificity and silently opt out of the
  shared rhythm — if you add a new section class ending in `-sec`, it
  inherits this automatically; don't hardcode its own vertical padding.
- Grid breakpoints in individual components: `768px` (mobile), `900px`–`1024px`
  (tablet) depending on the component — these predate the layout system and
  weren't consolidated further to keep this change's blast radius reviewable.

## 6) Motion catalog

| Name | Trigger | Duration / easing | Where | Reduced-motion behavior |
|---|---|---|---|---|
| `ambient-breathe` | always-on, on `body::after` | 14s ease-in-out infinite alternate | global backdrop wash | `display: none` |
| `stars-drift-a` / `-b` | always-on, on `.global-stars::before/::after` | 160s / 220s linear infinite | global starfield | `display: none` |
| `.reveal` fade/rise | `IntersectionObserver` adds `.visible` | `var(--t-slow)` (0.6s) ease | section entrances | skips to final state (`opacity:1; transform:none`) |
| `card-in` | `.reveal.visible` ancestor, staggered per `nth-child` | 0.65s `cubic-bezier(.16,1,.3,1)`, `backwards`, delay `(i-1)*0.06s`/`0.12s` | `.bento-card`, `.tech-tile`, `.chapter` | duration forced to `.01ms` globally |
| `title-rise` | scroll-timeline (`animation-timeline: view()`) | `entry 0% → entry 70%` of viewport | `.sec-title` | `@supports` gated; no-op on unsupported browsers, forced `.01ms` on reduced-motion |
| `ghost-parallax` | scroll-timeline, `cover` range | linear | `.ghost-year` | same as above |
| `.tilt-card` hover | mouse hover | 0.18–0.25s ease | 3D tilt cards sitewide | transform-based, not a `@keyframes` animation, so it's untouched by the reduced-motion block by design (a hover tilt isn't the kind of ambient motion that block targets) — reconsider if this becomes an accessibility complaint |
| `holo-rotate` | always-on inside `.holo-card::after`, opacity only appears on hover | 6s linear infinite | holographic overlay cards | forced `.01ms`, and opacity stays 0 without `:hover` regardless |
| `neon-pulse` | `.neon-border` class present | 2.5s ease-in-out infinite | any element needing a pulsing accent border | forced `.01ms` |
| `theme-menu-in` | navbar theme popover opening | 0.18s `cubic-bezier(.16,1,.3,1)` | navbar theme picker dropdown | not gated — it's a UI-open transition, not ambient motion |

Global rule: `@media (prefers-reduced-motion: reduce)` collapses every
`animation-duration`/`transition-duration` to `.01ms` and hides the
starfield + ambient wash outright. New animations should not assume this
block will catch them for free unless they're plain CSS `animation`/
`transition` — JS-driven motion (if you ever add any) needs its own check.

## 7) Component conventions

- **`.glow-card`** — base card treatment: `var(--shadow-card)` at rest, a
  radial accent bloom + `var(--shadow-glow)` + a 3D lift on hover. Border
  color and glow are theme-derived; nothing to configure per-theme.
- **`.holo-card`** — layer on top of `.glow-card` when a card should feel
  premium/interactive (used sparingly — see §1, "spend boldness in one
  place"). Uses `--holo`, a per-theme gradient.
- **`.tilt-card`** — mouse-tracked 3D tilt; reads `--rx`/`--ry` custom
  properties if a component sets them via JS for direction-aware tilt,
  otherwise defaults to a fixed 3°/-3°.
- **`.bento-card` / `.tech-tile` / `.chapter`** — get the staggered
  `card-in` entrance automatically once inside a `.reveal.visible` ancestor.
  No per-component animation wiring needed.
- **`.sec-label` / `.sec-title`** — every section should use these two for
  its eyebrow + heading rather than ad hoc markup, so typography and the
  scroll-timeline title-rise apply uniformly.

## 8) How switching actually works

- `frontend/src/app/services/theme.service.ts` owns both `theme` and
  `layout` state. It sets `data-theme` / `data-layout` attributes on
  `<html>` — everything downstream is plain CSS attribute selectors.
- **Instant paint**: `frontend/src/index.html` has an inline script that
  reads `localStorage` and sets those same attributes *before* Angular or
  any CSS loads, so a page reload never flashes the wrong theme.
- **Site default vs. visitor override**: the backend's generic
  `site-content` module (`GET/PUT /api/site-content/appearance`, admin-JWT
  gated on `PUT`) stores `{ theme, layout }` as the site-wide default.
  `ThemeService.init()` applies the visitor's local pick if one exists
  (`kk_appearance_override` flag in `localStorage`); otherwise it applies
  whatever the backend returns. Visitors changing the swatch in the navbar
  only ever write to their own `localStorage` — they never touch the
  backend. Only the Admin → Appearance tab calls
  `saveAsSiteDefault()`, which is the one path that `PUT`s to the backend.
- **Admin preview**: picking a swatch/layout card in Admin → Appearance
  calls `ThemeService.preview()`, which repaints immediately without
  persisting — you're looking at the real site, not a mockup, before
  deciding to save.

## 9) Extending the system

**Adding a theme**: copy §3's variable list into a new
`html[data-theme="your-id"] { … }` block in `styles.scss`, add an entry to
the `THEMES` array in `theme.service.ts` (id, label, blurb, 3-color swatch
for the picker, `dark: boolean`). That's it — the picker UI, admin tab, and
`localStorage` persistence all read from that array, nothing else to wire.

**Adding a layout**: same pattern — add an `html[data-layout="your-id"]`
block with the tokens from §4's table, plus an entry in the `LAYOUTS` array.
If the layout needs a structural device beyond the shared tokens (like
Dossier's hairline rule), scope it with
`html[data-layout="your-id"] .some-existing-class { … }` rather than adding
a parallel component variant.

**Converting a component to be theme-safe**: grep the component's `.scss`
for `rgba(` followed by digits, or a literal hex. Any match that represents
the site accent should become `rgba(var(--accent-rgb), X)` /
`var(--accent)`; anything representing a genuinely fixed color (e.g. error
red `#ef4444`) should stay literal — not everything needs to be themeable,
only things that were secretly duplicating a design token.

## 10) Known limitations

- **Inline SVG data-URIs can't read CSS variables.** The noise texture in
  `body::before` is a hardcoded `data:image/svg+xml,...` string — its
  opacity is themed via `--noise-opacity`, but its color (white noise) is
  baked in and doesn't need to vary. If you ever add a *colored* inline SVG
  background, it will not theme automatically; you'd need a per-theme
  data-URI or switch to an `<svg>` element with `fill="var(--accent)"`.
- **Layout-token coverage stops at "portfolio content."** Every grid in
  home-page components, the blog, and AI Tools responds to `--grid-cols-*`
  / `--grid-tile-min` (see §4 for the full list and the reasoning for what's
  excluded). If you add a new content grid, wire it the same way — grep
  the new component's `.scss` for `grid-template-columns:\s*repeat\(` and
  make sure the count/minmax argument is a var, not a literal, unless it's
  a tool page or a generated-deliverable viewer per §4's exclusion list.
- **`border-radius` was audited, not blindly swept.** Unlike accent colors
  (always the same meaning) and grid columns (always "how many across"), a
  hardcoded radius value has no consistent meaning across the app — `12px`
  is a genuine content-card in one place and an icon-badge or button in
  another, and shrinking an icon-badge's corner to match a layout's card
  radius would look wrong, not "on-brand." Converting every instance
  mechanically risked visual regressions with no way to visually verify the
  result in this environment. Instead: every `10–24px` radius in home-page
  components was reviewed by hand. Two were genuine content-card
  containers wrongly hardcoded instead of using the existing token —
  `.hero-stats` and `.sb-inner` (survey banner) — and are now
  `var(--radius-lg)`. Everything else (buttons, icon-wraps, nav pills,
  glow-halo pseudo-elements sized to their own button) stays fixed on
  purpose. If you add a new floating content card, give it
  `var(--radius-lg)` (or `var(--radius)` for a smaller one) from the start
  rather than a literal number.
- **One layout-specific structural override exists today**: Dossier
  collapses the Skills section's side-by-side split (`1fr 1fr`) to a single
  column, since its 880px container is too narrow for that split to read
  well. If a future layout needs something similar, follow the same
  pattern: scope it with `html[data-layout="your-id"] .some-class { … }`
  next to the component's own layout rule, not in `styles.scss`.
- **Mobile breakpoints are per-component, not centralized.** `768px` /
  `900px` / `1024px` are each hardcoded per component rather than driven by
  a shared breakpoint token — consolidating them was out of scope for this
  pass to keep the diff reviewable.
