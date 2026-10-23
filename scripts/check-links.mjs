// Link check for both locales: every internal link and asset in dist/ must exist; every external link must answer.
// Render free instances sleep after 15 min idle and take about a minute to wake, so external links get a 90 s
// timeout and one retry before they count as broken.
// Usage: node scripts/check-links.mjs   (reads the built HTML in dist/; needs network for external links)
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const ORIGIN = 'https://ismayilovilkin.online/';
const files = (await readdir(dist, { recursive: true })).filter((f) => f.endsWith('.html'));
const internal = new Map(), external = new Map();
for (const f of files) {
  const html = await readFile(join(dist, f), 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    if (url.startsWith('mailto:') || url.startsWith('data:')) continue;
    // canonical/hreflang/og URLs use the production origin (not deployed yet): check them against dist/
    const own = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length - 1) : null;
    const map = own ? internal : /^https?:/.test(url) ? external : internal;
    const key = own ?? url;
    if (!map.has(key)) map.set(key, f);
  }
  for (const [, url] of html.matchAll(/content="(https:\/\/ismayilovilkin\.online\/[^"]+)"/g)) internal.set(url.slice(ORIGIN.length - 1), f); // og:image, og:url
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) for (const part of set.split(',')) internal.set(part.trim().split(' ')[0], f);
}

const broken = [];
for (const [url, from] of internal) {
  const p = join(dist, decodeURI(url));
  const ok = existsSync(p) && (!url.endsWith('/') || existsSync(join(p, 'index.html')));
  if (!ok) broken.push(`internal ${url} (from ${from})`);
}

const check = async (url) => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(90_000), headers: { 'user-agent': 'Mozilla/5.0 (link check)' } });
      return { url, status: r.status, ms: Date.now() - t0, attempt };
    } catch (e) {
      if (attempt === 2) return { url, status: String(e.name ?? e), ms: Date.now() - t0, attempt };
    }
  }
};
// shortcut: LinkedIn answers 999 to automated requests; treat 999 as "reachable" since it proves the host answered
const results = await Promise.all([...external.keys()].map(check));
for (const r of results) {
  const ok = typeof r.status === 'number' && (r.status < 400 || r.status === 999);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(6)} ms  try ${r.attempt}  ${r.url}`);
  if (!ok) broken.push(`external ${r.url} → ${r.status}`);
}
console.log(`\n${internal.size} internal URLs and ${external.size} external URLs checked across ${files.length} pages.`);
if (broken.length) { console.error(`Broken:\n${broken.join('\n')}`); process.exit(1); }
