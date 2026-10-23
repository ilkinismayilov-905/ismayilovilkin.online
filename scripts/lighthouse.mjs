// Mobile Lighthouse (default mobile profile: Moto G-class device, simulated slow 4G, 4× CPU) against a running preview.
// Usage: node scripts/lighthouse.mjs [--base http://localhost:4321] [--paths /,/az/,/work/milly/,/az/work/milly/] [--runs 3]
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';

const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : f; };
const base = arg('base', 'http://localhost:4321');
const paths = arg('paths', '/,/az/,/work/milly/,/az/work/milly/').split(',');
const runs = Number(arg('runs', '3'));
const port = 9333;

await mkdir('reports/lighthouse', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: [`--remote-debugging-port=${port}`] });
const rows = [];
for (const path of paths) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const r = await lighthouse(base + path, { port, output: 'html', logLevel: 'error' });
    if (!r) throw new Error('no Lighthouse result');
    const { categories: c, audits: a } = r.lhr;
    results.push({
      perf: c.performance.score * 100, a11y: c.accessibility.score * 100, bp: c['best-practices'].score * 100, seo: c.seo.score * 100,
      lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue,
      lcpEl: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '',
    });
    if (i === runs - 1) await writeFile(`reports/lighthouse/${path.replace(/\//g, '_') || 'home'}.html`, r.report);
  }
  // median run by performance score
  const m = results.sort((x, y) => x.perf - y.perf)[Math.floor(results.length / 2)];
  rows.push(`${path.padEnd(18)} perf ${m.perf}  a11y ${m.a11y}  bp ${m.bp}  seo ${m.seo}  LCP ${(m.lcp / 1000).toFixed(2)}s  CLS ${m.cls.toFixed(3)}  TBT ${Math.round(m.tbt)}ms  (median of ${runs})\n${''.padEnd(18)} LCP element: ${m.lcpEl.slice(0, 110)}`);
}
await browser.close();
console.log(rows.join('\n'));
