// Screenshot matrix against a running preview (npm run preview).
// Usage: node scripts/screens.mjs [--base http://localhost:4321] [--out reports/screens] [--paths /,/az/] [--widths 1366,390] [--themes dark,light] [--full]
import { mkdir } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg('base', 'http://localhost:4321');
const out = arg('out', 'reports/screens');
const paths = arg('paths', '/,/az/').split(',');
const widths = arg('widths', '1366,390').split(',').map(Number);
const themes = arg('themes', 'dark').split(',');
const full = process.argv.includes('--full');

await mkdir(out, { recursive: true });
// Uses the installed Google Chrome, so no browser download is needed.
const browser = await chromium.launch({ channel: 'chrome' });
for (const width of widths) {
  const mobile = width < 768;
  for (const theme of themes) {
    const ctx = await browser.newContext({
      ...(mobile ? devices['iPhone 13'] : {}),
      viewport: { width, height: mobile ? (width === 375 ? 812 : 844) : 860 },
      colorScheme: theme,
      reducedMotion: 'reduce', // stable captures: no load animation mid-flight
    });
    const page = await ctx.newPage();
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const slug = p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home';
      const name = `${slug}-${width}-${theme}${full ? '-full' : ''}.png`;
      await page.screenshot({ path: `${out}/${name}`, fullPage: full });
      console.log(`${out}/${name}`);
    }
    await ctx.close();
  }
}
await browser.close();
