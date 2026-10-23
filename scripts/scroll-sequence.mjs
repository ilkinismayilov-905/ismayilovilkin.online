// Scroll-through screenshot sequence (photo story, backdrop swaps). Requires a running preview.
// Usage: node scripts/scroll-sequence.mjs [--base http://localhost:4321] [--path /] [--width 1366] [--step 0.5] [--out reports/sequence]
import { mkdir } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : f; };
const base = arg('base', 'http://localhost:4321');
const path = arg('path', '/');
const width = Number(arg('width', '1366'));
const step = Number(arg('step', '0.5'));
const out = `${arg('out', 'reports/sequence')}/${(path.replace(/\//g, '') || 'en')}-${width}`;
const mobile = width < 768;

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : {}), viewport: { width, height: mobile ? 844 : 860 }, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.goto(base + path, { waitUntil: 'networkidle' });

// Measure layout shift during the whole run
await page.evaluate(() => {
  window.__cls = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
});

const lcp = await page.evaluate(() => new Promise((r) => new PerformanceObserver((l) => { const e = l.getEntries().at(-1); r(e ? `${e.element?.tagName ?? '?'} ${e.url || e.element?.className || ''}` : 'none'); }).observe({ type: 'largest-contentful-paint', buffered: true })));
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const vh = await page.evaluate(() => innerHeight);
let i = 0;
for (let y = 0; y <= total + 1; y += Math.round(vh * step)) {
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(1100); // longer than the 800–900 ms transitions
  await page.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}-y${y}.png` });
}
const cls = await page.evaluate(() => window.__cls);
console.log(JSON.stringify({ out, shots: i, cls: Number(cls.toFixed(4)), lcp }));
await browser.close();
