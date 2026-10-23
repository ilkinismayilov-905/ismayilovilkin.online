// Full-page photo background: the part (section or About chapter) nearest the viewport centre picks the photo.
// Two stacked <picture> layers; the next photo is decoded before it fades in. A slow scale settle (1.05 → 1)
// follows the scroll through the part. Only the current and the next photo are fetched. No scroll-jacking.
import { $, $$, reduceMotion } from './dom';

interface BgSet { wideAvif: string; wideWebp: string; tallAvif: string; tallWebp: string; fallback: string; desktop: string; mobile: string }

const wide = matchMedia('(min-aspect-ratio: 1/1)');

function apply(pic: HTMLElement, set: BgSet) {
  const [wa, ww, ta, tw] = $$<HTMLSourceElement>('source', pic);
  if (wa) wa.srcset = set.wideAvif;
  if (ww) ww.srcset = set.wideWebp;
  if (ta) ta.srcset = set.tallAvif;
  if (tw) tw.srcset = set.tallWebp;
  const img = $<HTMLImageElement>('img', pic);
  if (img) {
    img.src = set.fallback;
    img.style.objectPosition = wide.matches ? set.desktop : set.mobile;
  }
  return img;
}

export function initPhotoBackground() {
  const layer = $('#photoBg');
  const first = layer ? $('picture', layer) : null;
  const sets = JSON.parse($('#bg-data')?.textContent ?? '{}') as Record<string, BgSet>;
  if (!layer || !first) return;

  let current = layer.dataset['current'] ?? '';
  let front = first;
  let back = first.cloneNode(true) as HTMLElement;
  back.setAttribute('data-hidden', '');
  layer.append(back);
  const firstSet = sets[current];
  if (firstSet) apply(front, firstSet);

  const targets = $$('[data-bg]');
  const keyOf = (el: HTMLElement | undefined) => el?.dataset['bg'] ?? '';

  // Fetch the next different photo ahead of time (a detached <picture> loads like an attached one)
  let preloaded = '';
  const preloadAfter = (i: number) => {
    const key = keyOf(targets.slice(i + 1).find((t) => keyOf(t) !== current));
    const set = sets[key];
    if (!set || key === preloaded) return;
    preloaded = key;
    apply(first.cloneNode(true) as HTMLElement, set);
  };

  let token = 0;
  const show = async (key: string) => {
    const set = sets[key];
    if (!set || key === current) return;
    current = key;
    const mine = ++token;
    const img = apply(back, set);
    try { await img?.decode(); } catch { return; }
    if (mine !== token) return; // a newer swap started meanwhile
    back.removeAttribute('data-hidden');
    front.setAttribute('data-hidden', '');
    [front, back] = [back, front];
  };

  let raf = 0;
  const update = () => {
    raf = 0;
    const mid = innerHeight / 2;
    let best = 0, bestDist = Infinity;
    targets.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      const d = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
      if (d < bestDist) { bestDist = d; best = i; }
    });
    const active = targets[best];
    if (!active) return;
    layer.dataset['scrim'] = active.dataset['scrim'] ?? 'strong';
    void show(keyOf(active)).then(() => preloadAfter(best));
    if (!reduceMotion.matches) {
      const r = active.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(r.height, 1)));
      $('img', front)?.style.setProperty('--settle', (1.05 - 0.05 * p).toFixed(4));
    }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); });
  wide.addEventListener('change', () => {
    const set = sets[current];
    for (const pic of [front, back]) { const img = $<HTMLImageElement>('img', pic); if (img && set) img.style.objectPosition = wide.matches ? set.desktop : set.mobile; }
  });
  update();
  preloadAfter(0);
}
