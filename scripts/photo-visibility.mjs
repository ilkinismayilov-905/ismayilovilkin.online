// How visible the background photo is, per section and theme, on a running preview.
// For each section: screenshot the background only, then the same frame with the photo hidden (scrim only),
// and report the mean luminance change the photo makes (0–255). Same number in both themes = same visibility.
// Usage: node scripts/photo-visibility.mjs [--path /az/] [--save reports/visibility]
import { mkdir } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';
import sharp from 'sharp';

const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : f; };
const path = arg('path', '/');
const save = arg('save', '');
const sections = ['#top', '#work', '.about-text .chapter', '#experience', '#awards', '#contact'];
if (save) await mkdir(save, { recursive: true });

const luminance = async (png) => sharp(png).greyscale().raw().toBuffer();
const browser = await chromium.launch({ channel: 'chrome' });
const rows = [];
for (const width of [1366, 375]) for (const theme of ['dark', 'light']) {
  const mobile = width < 768;
  // bypassCSP only so the measurement can inject its "hide content" stylesheets
  const page = await (await browser.newContext({ ...(mobile ? devices['iPhone 13'] : {}), viewport: { width, height: mobile ? 812 : 860 }, colorScheme: theme, reducedMotion: 'reduce', bypassCSP: true })).newPage();
  await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });
  const cells = [];
  for (const sel of sections) {
    await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); scrollBy(0, r.top + Math.min(r.height, innerHeight) / 2 - innerHeight / 2); }, sel);
    await page.waitForTimeout(1300);
    const content = await page.addStyleTag({ content: 'body > *:not(#photoBg){visibility:hidden!important}' });
    const withPhoto = await page.screenshot();
    const photo = await page.addStyleTag({ content: '#photoBg picture{visibility:hidden!important}' });
    const scrimOnly = await page.screenshot();
    await photo.evaluate((e) => e.remove());
    await content.evaluate((e) => e.remove());
    const [a, b] = await Promise.all([luminance(withPhoto), luminance(scrimOnly)]);
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    const name = sel.replace(/^[#.]/, '').split(/[ .]/)[0];
    cells.push(`${name.padEnd(10)}${(sum / a.length).toFixed(1).padStart(5)}`);
    if (save && width === 1366) await sharp(withPhoto).resize(480).toFile(`${save}/${theme}-${name}.png`);
  }
  rows.push(`${String(width).padStart(4)} ${theme.padEnd(5)}  ${cells.join(' | ')}`);
}
await browser.close();
console.log(`photo visibility on ${path} (mean luminance change the photo makes, 0–255)\n${rows.join('\n')}`);
