/**
 * Renders the 1200×630 social share card to frontend/src/assets/og-image.png.
 *
 * Run after changing the card's wording or the site's accent colours:
 *   cd scripts && npm run og
 *
 * The card is drawn from the Midnight+Gold tokens in frontend/src/styles.scss
 * so the link preview matches the site it opens. Committed as a PNG because
 * crawlers (Slack, WhatsApp, LinkedIn, X) do not render SVG share images.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../frontend/src/assets/og-image.png');

const NAME = 'Karan Kapoor';
const ROLE = 'Full Stack Developer';
const STACK = ['Angular', 'ASP.NET Web API', 'NestJS', 'PostgreSQL'];
const SITE = 'karan-portfolio-six-sigma.vercel.app';

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px; height: 630px;
    background: #07070e;
    font-family: 'Inter', sans-serif;
    color: #f5f5f7;
    overflow: hidden;
    position: relative;
  }

  /* Ambient wash — the violet/gold light the live site uses. */
  .glow {
    position: absolute; border-radius: 50%; filter: blur(90px);
  }
  .glow-violet { width: 620px; height: 620px; top: -260px; left: -160px; background: rgba(124,58,237,.34); }
  .glow-gold   { width: 560px; height: 560px; bottom: -280px; right: -120px; background: rgba(245,158,11,.26); }
  .glow-cyan   { width: 340px; height: 340px; top: 300px; left: 480px; background: rgba(6,182,212,.12); }

  /* Faint blueprint grid for depth. */
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at 50% 45%, #000 40%, transparent 82%);
  }

  .frame {
    position: absolute; inset: 26px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 22px;
  }

  .content {
    position: relative;
    height: 100%;
    padding: 86px 96px;
    display: flex; flex-direction: column; justify-content: center;
  }

  .mark {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 40px;
  }
  .monogram {
    width: 60px; height: 60px;
    display: grid; place-items: center;
    border-radius: 15px;
    background: linear-gradient(135deg, #f59e0b 0%, #fde68a 100%);
    color: #07070e;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700; font-size: 27px; letter-spacing: -1px;
  }
  .site {
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px; font-weight: 500;
    color: #646e88; letter-spacing: .2px;
  }

  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 92px; font-weight: 700;
    letter-spacing: -3px; line-height: 1;
    margin-bottom: 22px;
  }

  .role {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 40px; font-weight: 600;
    letter-spacing: -.6px;
    background: linear-gradient(135deg, #f59e0b 0%, #fde68a 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 42px;
  }

  .rule {
    width: 96px; height: 4px; border-radius: 2px;
    background: linear-gradient(90deg, #f59e0b, rgba(245,158,11,0));
    margin-bottom: 40px;
  }

  .stack { display: flex; gap: 13px; flex-wrap: wrap; }
  .chip {
    padding: 11px 22px;
    border: 1px solid rgba(255,255,255,.11);
    border-radius: 999px;
    background: rgba(255,255,255,.035);
    font-size: 20px; font-weight: 500;
    color: #9aa5bc;
  }
</style>
</head>
<body>
  <div class="glow glow-violet"></div>
  <div class="glow glow-gold"></div>
  <div class="glow glow-cyan"></div>
  <div class="grid"></div>
  <div class="frame"></div>

  <div class="content">
    <div class="mark">
      <div class="monogram">KK</div>
      <div class="site">${SITE}</div>
    </div>

    <h1>${NAME}</h1>
    <div class="role">${ROLE}</div>
    <div class="rule"></div>
    <div class="stack">${STACK.map(s => `<div class="chip">${s}</div>`).join('')}</div>
  </div>
</body>
</html>`;

/**
 * Prefer a browser already installed on the machine (Edge ships with Windows,
 * Chrome is common) and fall back to Playwright's bundled Chromium. This
 * avoids a ~150 MB download just to render one image.
 */
async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // Not installed — try the next one.
    }
  }
  return chromium.launch();
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
// Belt-and-braces: don't screenshot before the webfonts have actually swapped in.
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();

console.log(`Wrote ${OUT}`);
