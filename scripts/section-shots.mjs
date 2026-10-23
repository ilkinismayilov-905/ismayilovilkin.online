// Viewport screenshots with a given section centred (lets the section-aware backdrop swap first).
// Usage: node scripts/section-shots.mjs --sections about,contact --themes dark,light --label after [--path /] [--width 1366] [--out reports/compare]
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : f; };
const base = arg('base', 'http://localhost:4321');
const path = arg('path', '/');
const width = Number(arg('width', '1366'));
const out = arg('out', 'reports/compare');
const label = arg('label', 'shot');
const sections = arg('sections', 'about,contact').split(',');
const themes = arg('themes', 'dark,light').split(',');

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const theme of themes) {
  const page = await (await browser.newContext({ viewport: { width, height: 860 }, colorScheme: theme })).newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  for (const id of sections) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: s === 'contact' ? 'end' : 'center', behavior: 'instant' }), id);
    await page.waitForTimeout(1300);
    const file = `${out}/${id}-${theme}-${label}.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
}
await browser.close();
