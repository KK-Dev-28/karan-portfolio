#!/usr/bin/env node
/**
 * Records a smooth scrolling tour of the portfolio to a video file.
 *
 * Produces the visual half of the "walkthrough" video — add a voiceover on
 * top in any editor. Re-runnable: whenever the site changes, re-run this and
 * you get a fresh recording with no manual scrolling.
 *
 * Usage:
 *   npm install                     (once, in this scripts/ folder)
 *   npx playwright install chromium (once — downloads the browser)
 *   node record-tour.mjs --url https://your-site.vercel.app
 *
 * Common flags:
 *   --url <url>       Site to record. Default http://localhost:4200
 *   --theme <id>      midnight-gold | blueprint | terminal | paper-ledger
 *   --layout <id>     standard | dossier | atelier-grid | zen | command | canvas
 *   --hold <ms>       Pause at each section (default 4500) — raise this to
 *                     stretch the video to match a longer voiceover
 *   --scroll <ms>     Travel time between sections (default 2500)
 *   --out <dir>       Output folder (default ./out)
 *
 * Output is .webm (what Chromium records). If ffmpeg is on PATH it is also
 * converted to .mp4, which most editors and social platforms prefer.
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

// ── Args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const URL         = arg('url', 'http://localhost:4200');
const THEME       = arg('theme', null);
const LAYOUT      = arg('layout', null);
const HOLD_MS     = Number(arg('hold', 4500));
const SCROLL_MS   = Number(arg('scroll', 2500));
const OUT_DIR     = resolve(arg('out', './out'));
const WIDTH = 1920, HEIGHT = 1080;

/** Stops on the tour, in order. These IDs are the ones the navbar observes;
 *  a missing one is skipped rather than failing the whole run. */
const STOPS = [
  { id: 'hero',       note: 'Intro — name, role, stack' },
  { id: 'services',   note: 'What I do' },
  { id: 'skills',     note: 'Tech stack' },
  { id: 'projects',   note: 'Work — the proof' },
  { id: 'story',      note: 'The journey / about me' },
  { id: 'experience', note: 'Career timeline' },
  { id: 'gigs',       note: 'What I offer' },
  { id: 'contact',    note: 'Get in touch' },
];

// ── Record ──────────────────────────────────────────────────────────────
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

console.log(`\n  Recording ${URL}`);
console.log(`  ${WIDTH}x${HEIGHT} · hold ${HOLD_MS}ms · scroll ${SCROLL_MS}ms\n`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  recordVideo: { dir: OUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  deviceScaleFactor: 1,
  // Force animations ON — the site collapses all motion under reduced-motion,
  // and a tour with no motion defeats the point.
  reducedMotion: 'no-preference',
});

// Seed the appearance choice before any app code runs, so the recording opens
// directly in the requested theme/layout with no flash of the default.
if (THEME || LAYOUT) {
  await context.addInitScript(([theme, layout]) => {
    try {
      if (theme)  localStorage.setItem('kk_theme_id', theme);
      if (layout) localStorage.setItem('kk_layout_id', layout);
      localStorage.setItem('kk_appearance_override', '1');
    } catch { /* storage blocked — site falls back to its default */ }
  }, [THEME, LAYOUT]);
}

const page = await context.newPage();
// `domcontentloaded`, not `networkidle` — the site calls a Render backend that
// may be cold-starting, plus Google Fonts and the Razorpay script, so the
// network rarely goes fully idle. The explicit waits below are what actually
// matter for a clean first frame.
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

// The site shows a loading screen on first paint; wait it out so the video
// doesn't open on a spinner.
await page.waitForTimeout(1200);
await page.locator('app-loading-screen').waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});

// Hide the custom cursor — it tracks a mouse that never moves in a headless
// run, so it would sit frozen in a corner of the frame.
await page.addStyleTag({ content: `app-cursor-3d { display: none !important; }` });

// Wait for webfonts so headings don't visibly re-flow mid-recording.
await page.evaluate(() => document.fonts?.ready).catch(() => {});
await page.waitForTimeout(2500); // let the hero entrance animation finish

/** Eased scroll to an absolute Y — requestAnimationFrame so the recording
 *  captures real intermediate frames (a jump-scroll would look like a cut). */
async function glideTo(y, duration) {
  await page.evaluate(([targetY, ms]) => new Promise(done => {
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 4) return done();
    const t0 = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      window.scrollTo(0, startY + dist * e);
      t < 1 ? requestAnimationFrame(step) : done();
    })(t0);
  }), [y, duration]);
}

for (const stop of STOPS) {
  const el = page.locator(`#${stop.id}`).first();
  if (await el.count() === 0) {
    console.log(`  · skipped #${stop.id} (not on page)`);
    continue;
  }
  const y = await el.evaluate(node => window.scrollY + node.getBoundingClientRect().top);
  console.log(`  · #${stop.id} — ${stop.note}`);
  await glideTo(Math.max(0, y), SCROLL_MS);
  await page.waitForTimeout(HOLD_MS);
}

// Drift back to the top so the video ends where it began.
await glideTo(0, SCROLL_MS + 800);
await page.waitForTimeout(1500);

// Video is only flushed to disk once the context closes.
await context.close();
await browser.close();

// ── Name the file, and convert to mp4 when ffmpeg is available ──────────
const webm = readdirSync(OUT_DIR).filter(f => f.endsWith('.webm')).map(f => join(OUT_DIR, f)).pop();
if (!webm) { console.error('\n  No video produced.\n'); process.exit(1); }

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const named = join(OUT_DIR, `portfolio-tour-${stamp}.webm`);
renameSync(webm, named);
console.log(`\n  ✓ ${named}`);

try {
  const mp4 = named.replace(/\.webm$/, '.mp4');
  execFileSync('ffmpeg', ['-y', '-i', named, '-c:v', 'libx264', '-preset', 'slow',
                          '-crf', '20', '-pix_fmt', 'yuv420p', mp4], { stdio: 'ignore' });
  console.log(`  ✓ ${mp4}`);
} catch {
  console.log('  · ffmpeg not found — keeping .webm (most editors accept it)');
}
console.log('');
