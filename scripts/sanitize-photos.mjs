// Turns originals in photo/ (gitignored, may contain GPS) into metadata-free copies in src/assets/photos/.
// Only the outputs of this script may be committed. HEIC decoding uses macOS `sips` (sharp ships without HEVC).
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const root = new URL('..', import.meta.url).pathname;
const { photos } = JSON.parse(await readFile(join(root, 'scripts/photo-manifest.json'), 'utf8'));
const outDir = join(root, 'src/assets/photos');
const MAX_EDGE = 2400;

await mkdir(join(outDir, 'backdrop'), { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), 'photos-'));

try {
  for (const p of photos) {
    let input = join(root, 'photo', p.source);
    if (extname(p.source).toLowerCase() === '.heic') {
      const jpg = join(tmp, `${p.name}.jpg`);
      await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', input, '--out', jpg]);
      input = jpg;
    }

    // rotate() applies EXIF orientation; buffering first gives the upright size for the crop.
    const upright = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = upright.info;
    let img = sharp(upright.data);
    if (p.crop) {
      const [x, y, w, h] = p.crop;
      img = img.extract({ left: Math.round(x * W), top: Math.round(y * H), width: Math.round(w * W), height: Math.round(h * H) });
    }
    const cropped = await img.toBuffer();

    // sharp drops all metadata (EXIF, GPS, XMP, IPTC, ICC) unless asked to keep it, and converts to sRGB.
    const out = join(outDir, `${p.name}.jpg`);
    const info = await sharp(cropped)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(out);
    console.log(`${p.source} -> ${p.name}.jpg ${info.width}x${info.height}`);

    if (p.backdrop) {
      const b = join(outDir, 'backdrop', `${p.name}.webp`);
      const bi = await sharp(upright.data)
        .resize({ width: 64 })
        // One shared, muted treatment so strong colours in a photo (a blue projector screen) don't fight the palette
        .modulate({ saturation: 0.6 })
        .blur(4)
        .webp({ quality: 60 })
        .toFile(b);
      console.log(`  backdrop/${p.name}.webp ${bi.width}x${bi.height} ${bi.size} B`);
    }
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}
