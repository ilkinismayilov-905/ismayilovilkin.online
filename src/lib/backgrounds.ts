import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// Wide (landscape screens) and tall (phones) variants written by `npm run photos`.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/bg/*.jpg', { eager: true });
const file = (name: string, kind: 'wide' | 'tall') => {
  const f = files[`../assets/photos/bg/${name}-${kind}.jpg`];
  if (!f) throw new Error(`Missing background photo ${name}-${kind}.jpg — run npm run photos`);
  return f.default;
};

export interface BgSet {
  wideAvif: string; wideWebp: string; tallAvif: string; tallWebp: string; fallback: string;
  desktop: string; mobile: string;
}

const srcset = async (src: ImageMetadata, widths: number[], format: 'avif' | 'webp') =>
  (await getImage({ src, widths, format, quality: format === 'avif' ? 55 : 70 })).srcSet.attribute;

/** Responsive sources for every background photo named in the site content. */
export async function backgroundSets(map: Record<string, { desktop: string; mobile: string }>) {
  const out: Record<string, BgSet> = {};
  for (const [name, pos] of Object.entries(map)) {
    const wide = file(name, 'wide'), tall = file(name, 'tall');
    out[name] = {
      wideAvif: await srcset(wide, [1280, 1920, 2400], 'avif'),
      wideWebp: await srcset(wide, [1280, 1920, 2400], 'webp'),
      tallAvif: await srcset(tall, [640, 960, 1280], 'avif'),
      tallWebp: await srcset(tall, [640, 960, 1280], 'webp'),
      fallback: (await getImage({ src: tall, width: 960, format: 'jpg' })).src,
      desktop: pos.desktop,
      mobile: pos.mobile,
    };
  }
  return out;
}
