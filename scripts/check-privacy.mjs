// Scans the built site for personal data that must never be published.
// Generic patterns live here; exact private values go in .privacy-denylist (gitignored, one per line).
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const patterns = [
  /\+994[\s\d()-]{7,}/,            // Azerbaijani phone numbers
  /\b0?(50|51|55|70|77|99)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/, // local mobile format
];
const denyFile = join(root, '.privacy-denylist');
const deny = existsSync(denyFile)
  ? (await readFile(denyFile, 'utf8')).split('\n').map((s) => s.trim()).filter(Boolean)
  : [];
if (!deny.length) console.warn('check-privacy: no .privacy-denylist found; only generic patterns are checked.');

const hits = [];
for (const e of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!e.isFile() || !/\.(html|xml|txt|json|js|css|svg)$/.test(e.name)) continue;
  const file = join(e.parentPath, e.name);
  const text = await readFile(file, 'utf8');
  for (const p of patterns) if (p.test(text)) hits.push(`${file}: matches ${p}`);
  for (const d of deny) if (text.toLowerCase().includes(d.toLowerCase())) hits.push(`${file}: contains a deny-listed value`);
}
if (hits.length) { console.error(`Privacy check failed:\n${hits.join('\n')}`); process.exit(1); }
console.log(`check-privacy: dist/ is clean (${patterns.length} patterns, ${deny.length} deny-listed values).`);
