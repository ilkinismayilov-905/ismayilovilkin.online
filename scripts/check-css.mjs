// Azerbaijani casing breaks under text-transform: uppercase (i → I instead of İ). Keep it out of every stylesheet.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../src', import.meta.url).pathname;
const hits = [];
for (const e of await readdir(root, { recursive: true, withFileTypes: true })) {
  if (!e.isFile() || !/\.(css|astro)$/.test(e.name)) continue;
  const file = join(e.parentPath, e.name);
  if (/text-transform\s*:\s*uppercase/i.test(await readFile(file, 'utf8'))) hits.push(file);
}
if (hits.length) { console.error(`text-transform: uppercase found in:\n${hits.join('\n')}`); process.exit(1); }
console.log('check-css: no text-transform: uppercase.');
