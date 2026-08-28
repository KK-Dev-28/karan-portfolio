/**
 * Smoke-tests the built bundle in a real browser: SEO tags, structured data,
 * the skip link, static files, and per-route meta updates.
 *
 *   node serve-dist.mjs 4300 &   # or run it in another terminal
 *   node verify-seo.mjs
 *
 * Exits non-zero if any check fails, so it can gate a deploy.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4300';

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel }); } catch { /* try next */ }
  }
  return chromium.launch();
}

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(String(e)));

// ── Home ──────────────────────────────────────────────────────────────────
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

const meta = async (sel, attr = 'content') =>
  page.getAttribute(sel, attr).catch(() => null);

check('home title', (await page.title()).includes('Karan Kapoor'), await page.title());
check('meta description', ((await meta('meta[name="description"]')) || '').length > 60);
check('canonical link', !!(await meta('link[rel="canonical"]', 'href')));
check('og:image', ((await meta('meta[property="og:image"]')) || '').endsWith('/assets/og-image.png'));
check('og:url', !!(await meta('meta[property="og:url"]')));
check('twitter:card', (await meta('meta[name="twitter:card"]')) === 'summary_large_image');
check('robots indexable', ((await meta('meta[name="robots"]')) || '').startsWith('index'));

const ldCount = await page.locator('script[type="application/ld+json"]').count();
check('JSON-LD present', ldCount > 0, `${ldCount} block(s)`);

const ldValid = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('script[type="application/ld+json"]')];
  try { nodes.forEach(n => JSON.parse(n.textContent)); return true; } catch { return false; }
});
check('JSON-LD parses', ldValid);

check('main landmark', (await page.locator('main#main-content').count()) === 1);

// Skip link must be the first tab stop and must become visible on focus.
await page.keyboard.press('Tab');
const skip = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || !el.classList.contains('skip-link')) return null;
  const r = el.getBoundingClientRect();
  return { text: el.textContent.trim(), onScreen: r.top >= 0 && r.height > 0 };
});
check('skip link is first tab stop', !!skip, skip?.text ?? 'not focused');
check('skip link visible when focused', !!skip?.onScreen);

// Razorpay must no longer load on a page that never needs it.
const razorpay = await page.locator('script[src*="checkout.razorpay.com"]').count();
check('no Razorpay on landing page', razorpay === 0);

// Fonts should be a <link>, not a CSS @import.
check('fonts preloaded via link', (await page.locator('link[href*="fonts.googleapis.com"]').count()) > 0);

await page.screenshot({ path: 'verify-home.png' });

// ── Route change updates meta ─────────────────────────────────────────────
await page.goto(`${BASE}/blog`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const blogTitle = await page.title();
check('per-route title on /blog', blogTitle.startsWith('Blog'), blogTitle);
check('per-route canonical on /blog',
  ((await meta('link[rel="canonical"]', 'href')) || '').endsWith('/blog'));

// ── noindex on private routes ─────────────────────────────────────────────
await page.goto(`${BASE}/blog-write`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
check('blog-write is noindex', ((await meta('meta[name="robots"]')) || '').includes('noindex'));

// ── Static SEO files ──────────────────────────────────────────────────────
for (const [file, needle] of [['/robots.txt', 'Sitemap:'], ['/sitemap.xml', '<urlset']]) {
  const res = await page.request.get(`${BASE}${file}`);
  const body = await res.text();
  check(`${file} served`, res.ok() && body.includes(needle), `HTTP ${res.status()}`);
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
