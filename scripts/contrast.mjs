// WCAG contrast measured on rendered pixels (text over photos), not on token values.
// For each scroll position: screenshot with text hidden (background only), then compare every visible text run's
// colour against the pixels behind it (5th-percentile worst case). Requires a running preview.
// Usage: node scripts/contrast.mjs [--path /] [--widths 1366,375] [--themes dark,light]
import { chromium, devices } from '@playwright/test';
import sharp from 'sharp';

const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : f; };
const base = arg('base', 'http://localhost:4321');
const path = arg('path', '/');
const widths = arg('widths', '1366,375').split(',').map(Number);
const themes = arg('themes', 'dark,light').split(',');
const stops = ['#top', '#work', '.about-text .chapter:nth-of-type(1)', '.about-text .chapter:nth-of-type(2)', '.about-text .chapter:nth-of-type(3)', '.skills', '#experience', '#awards', '#contact'];

const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
let worstOverall = Infinity;
for (const width of widths) for (const theme of themes) {
  const mobile = width < 768;
  // bypassCSP only so the measurement can inject the "hide text" stylesheet
  const ctx = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : {}), viewport: { width, height: mobile ? 812 : 860 }, colorScheme: theme, bypassCSP: true, reducedMotion: 'reduce', locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const dpr = await page.evaluate(() => devicePixelRatio);
  for (const stop of stops) {
    const found = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); scrollBy({ top: r.top + Math.min(r.height, innerHeight) / 2 - innerHeight / 2, behavior: 'instant' }); return true; }, stop);
    if (!found) continue;
    await page.waitForTimeout(1400);
    const runs = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent.trim();
        const el = n.parentElement;
        if (!text || !el || el.closest('.sr-only')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 4 || r.height < 6 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          const m = cs.color.match(/[\d.]+/g).map(Number);
          const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight);
          out.push({ text: text.slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height, rgb: m.slice(0, 3), large: size >= 24 || (size >= 18.66 && weight >= 700) });
        }
      }
      return out;
    });
    const style = await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important}' });
    await page.waitForTimeout(60);
    const shot = await page.screenshot();
    await style.evaluate((s) => s.remove());
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    let worst = Infinity, fails = [];
    for (const run of runs) {
      const x0 = Math.max(0, Math.floor(run.x * dpr)), y0 = Math.max(0, Math.floor(run.y * dpr));
      const x1 = Math.min(info.width, Math.ceil((run.x + run.w) * dpr)), y1 = Math.min(info.height, Math.ceil((run.y + run.h) * dpr));
      const t = lum(...run.rgb), rs = [];
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { const i = (y * info.width + x) * info.channels; rs.push(ratio(t, lum(data[i], data[i + 1], data[i + 2]))); }
      if (!rs.length) continue;
      rs.sort((a, b) => a - b);
      const c = rs[Math.floor(rs.length * 0.05)];
      const need = run.large ? 3 : 4.5;
      worst = Math.min(worst, c);
      if (c < need) fails.push(`${c.toFixed(2)} < ${need} "${run.text}"`);
    }
    worstOverall = Math.min(worstOverall, worst);
    report.push(`${width} ${theme} ${stop.padEnd(36)} runs=${String(runs.length).padStart(3)} worst=${worst.toFixed(2)}${fails.length ? `  FAIL ${fails.length}: ${[...new Set(fails)].slice(0, 4).join(' | ')}` : '  ok'}`);
  }
  await ctx.close();
}
await browser.close();
console.log(report.join('\n'));
console.log(`\nWorst text contrast measured: ${worstOverall.toFixed(2)}:1`);
process.exitCode = report.some((r) => r.includes('FAIL')) ? 1 : 0;
