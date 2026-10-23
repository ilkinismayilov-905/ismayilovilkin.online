// Turns originals in photo/ (gitignored, may contain GPS) into metadata-free copies in src/assets/photos/:
// the cropped hero arch portrait and wide/tall full-page background variants.
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

await mkdir(join(outDir, 'bg'), { recursive: true });
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
    // sharp drops all metadata (EXIF, GPS, XMP, IPTC, ICC) unless asked to keep it, and converts to sRGB.
    if (p.crop) {
      const [x, y, w, h] = p.crop;
      const info = await sharp(upright.data)
        .extract({ left: Math.round(x * W), top: Math.round(y * H), width: Math.round(w * W), height: Math.round(h * H) })
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(join(outDir, `${p.name}.jpg`));
      console.log(`${p.source} -> ${p.name}.jpg ${info.width}x${info.height}`);
    }

    if (p.background) {
      // Full-page background, one shared treatment: muted colour and a light pre-baked blur (no runtime blur).
      const treat = (img) => img.modulate({ saturation: 0.6 }).blur(2);
      // Wide (landscape screens): the photo flush right on a 16:10 canvas. The left side continues the photo's
      // own left edge (a stretched, blurred strip), so the face sits away from the text column with no seam.
      const W = 2400, H = 1500;
      const photo = await sharp(upright.data).resize({ height: H }).toBuffer({ resolveWithObject: true });
      const pw = photo.info.width, feather = Math.round(pw * 0.35);
      const strip = await sharp(photo.data).extract({ left: 0, top: 0, width: Math.max(8, Math.round(pw * 0.06)), height: H }).toBuffer();
      const base = await sharp(strip).resize(W, H, { fit: 'fill' }).blur(30).modulate({ brightness: 0.8 }).toBuffer();
      const fade = Buffer.from(`<svg width="${pw}" height="${H}"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${(feather / pw).toFixed(3)}" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
      const faded = await sharp(photo.data).ensureAlpha().composite([{ input: fade, blend: 'dest-in' }]).png().toBuffer();
      const wide = await sharp(base).composite([{ input: faded, left: W - pw, top: 0 }]).toBuffer();
      await treat(sharp(wide)).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, 'bg', `${p.name}-wide.jpg`));
      // Tall (phones): the full upright frame
      await treat(sharp(upright.data).resize({ width: 1600, withoutEnlargement: true })).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, 'bg', `${p.name}-tall.jpg`));
      console.log(`  bg/${p.name}-wide.jpg, bg/${p.name}-tall.jpg`);
    }

  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}
