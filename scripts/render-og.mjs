// Renders the Open Graph cards (1200×630) into public/og/ from the built pages. Needs `npm run preview` running.
// Usage: node scripts/render-og.mjs [--base http://localhost:4321]
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:4321';
const root = new URL('..', import.meta.url).pathname;
const b64 = async (p) => (await readFile(root + p)).toString('base64');
const font = await b64('src/assets/fonts/Archivo-wdth-wght.woff2');
const photo = await b64('src/assets/photos/hero.jpg');
const slugs = ['milly', 'yolcu', 'abadland-qarabag', 'paygenix'];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const card = ({ kicker, title, sub, name, lang }) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 900;font-stretch:75% 125%}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px}
body{font-family:A,sans-serif;color:#F3EFE7;background:radial-gradient(900px 520px at 85% -10%,#183631,transparent 60%),radial-gradient(700px 480px at -10% 70%,#2A2320,transparent 55%),#0F1E1B;display:grid;grid-template-columns:1fr 330px;gap:56px;padding:64px 72px;align-items:center;overflow:hidden}
.k{color:#A9BBB4;font-size:28px;margin:0 0 18px;font-variation-settings:"wdth" 110}
h1{margin:0;font-size:${'${size}'}px;line-height:.92;letter-spacing:-.025em;font-weight:780;font-variation-settings:"wdth" 112}
p{margin:26px 0 0;font-size:27px;line-height:1.35;color:#F3EFE7;max-width:640px}
.n{margin-top:34px;color:#FFB86B;font-size:24px;font-weight:600}
.arch{position:relative;width:330px;height:440px;border-radius:999px 999px 26px 26px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)}
.arch img{width:100%;height:100%;object-fit:cover;filter:saturate(.92) contrast(1.04)}
.arch::after{content:"";position:absolute;inset:0;mix-blend-mode:soft-light;background:linear-gradient(160deg,rgba(255,184,107,.45),transparent 45%,rgba(15,30,27,.55))}
</style></head><body><div><p class="k">${esc(kicker)}</p><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}${name ? `<div class="n">${esc(name)}</div>` : ''}</div>
<div class="arch"><img src="data:image/jpeg;base64,${photo}" alt=""></div></body></html>`;

await mkdir(root + 'public/og', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const read = await browser.newPage();

for (const locale of ['en', 'az']) {
  const prefix = locale === 'en' ? '' : '/az';
  await read.goto(`${base}${prefix}/`, { waitUntil: 'networkidle' });
  const home = await read.evaluate(() => ({
    name: document.querySelector('#name .sr-only')?.textContent ?? '',
    role: document.querySelector('.board-val')?.textContent ?? '',
    intro: document.querySelector('.intro')?.textContent ?? '',
  }));
  const jobs = [{ file: `${locale}-home`, kicker: 'Java Backend Developer', title: home.name, sub: home.role, name: '', size: 104 }];
  for (const slug of slugs) {
    await read.goto(`${base}${prefix}/work/${slug}/`, { waitUntil: 'networkidle' });
    const c = await read.evaluate(() => ({ title: document.querySelector('h1')?.textContent ?? '', lede: document.querySelector('.lede')?.textContent ?? '' }));
    jobs.push({ file: `${locale}-${slug}`, kicker: locale === 'en' ? 'Case study' : 'Layihə haqqında', title: c.title, sub: c.lede.length > 150 ? `${c.lede.slice(0, 147).trimEnd()}…` : c.lede, name: home.name, size: c.title.length > 12 ? 76 : 96 });
  }
  for (const j of jobs) {
    await page.setContent(card({ ...j, lang: locale }).replace('${size}', String(j.size)), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // Chrome embeds an ICC profile; re-encoding through sharp leaves the file metadata-free
    const shot = await page.screenshot({ type: 'png' });
    await sharp(shot).jpeg({ quality: 86, mozjpeg: true }).toFile(`${root}public/og/${j.file}.jpg`);
    console.log(`public/og/${j.file}.jpg`);
  }
}
await browser.close();
