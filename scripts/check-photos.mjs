// Fails if any image under the given folders carries metadata (EXIF/GPS, XMP, IPTC, ICC).
// Usage: node scripts/check-photos.mjs [dir ...]   (default: src/assets/photos)
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [join(root, 'src/assets/photos')];
const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const FIELDS = ['exif', 'xmp', 'iptc', 'icc'];

let checked = 0;
const bad = [];
for (const dir of dirs) {
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !IMAGE.has(extname(entry.name).toLowerCase())) continue;
    const file = join(entry.parentPath, entry.name);
    const meta = await sharp(file).metadata();
    const found = FIELDS.filter((f) => meta[f]);
    checked++;
    if (found.length) bad.push(`${file}: ${found.join(', ')}`);
  }
}

if (bad.length) {
  console.error(`Metadata found in ${bad.length} image(s):\n${bad.join('\n')}`);
  process.exit(1);
}
console.log(`check-photos: ${checked} image(s), no EXIF/GPS/XMP/IPTC/ICC metadata.`);
