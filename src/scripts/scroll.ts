// Scroll-linked pieces: experience progress line, current section in the nav,
// the section-aware page backdrop and the About scrollytelling.
// IntersectionObserver + requestAnimationFrame, passive listeners; no scroll hijacking.
import { $, $$, fill, reduceMotion, scrollBehavior } from './dom';

export function initTimeline() {
  const tl = $('#timeline');
  if (!tl) return;
  const items = $$('li', tl);
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = tl.getBoundingClientRect(), mark = innerHeight * 0.6;
    tl.style.setProperty('--p', Math.min(1, Math.max(0, (mark - r.top) / r.height)).toFixed(3));
    for (const li of items) li.classList.toggle('reached', li.getBoundingClientRect().top + 8 < mark);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/** Calls back with the id of the section crossing the middle of the viewport. */
function watchCenter(targets: HTMLElement[], cb: (el: HTMLElement) => void) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) cb(e.target as HTMLElement); }), { rootMargin: '-50% 0px -50% 0px' });
  targets.forEach((t) => io.observe(t));
}

export function initNavCurrent(onSection: (id: string) => void) {
  const links = $$('.nav a[data-sec]');
  const ids = ['work', 'about', 'experience', 'awards', 'contact'];
  const sections = ids.map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
  watchCenter([$('#top'), ...sections].filter((s): s is HTMLElement => !!s), (el) => {
    for (const l of links) l.setAttribute('aria-current', String(l.dataset['sec'] === el.id));
    onSection(el.id === 'top' ? '' : el.id);
  });
}

export function initBackdrop() {
  const layers = [$<HTMLImageElement>('#bgA'), $<HTMLImageElement>('#bgB')];
  let [front, back] = layers;
  if (!front || !back) return;
  let current = front.currentSrc || front.src;
  const show = async (url: string) => {
    if (!front || !back || new URL(url, location.href).href === current) return;
    current = new URL(url, location.href).href;
    back.src = url;
    try { await back.decode(); } catch { return; }
    if (back.src !== current) return; // a newer swap started meanwhile
    back.removeAttribute('data-hidden');
    front.setAttribute('data-hidden', '');
    [front, back] = [back, front];
  };
  watchCenter($$('[data-backdrop]'), (el) => { void show(el.dataset['backdrop'] ?? ''); });
}

export function initStory(t: (k: string) => string) {
  const story = $('#story');
  if (!story) return;
  const chapters = $$('.chapter', story);
  const shots = $$('.shot', story);
  const dots = $$<HTMLButtonElement>('.dots button', story);
  const count = $('#storyCount');
  const cap = $('#frameCap');
  const captions = chapters.map((c) => $('figcaption', c)?.textContent ?? '');
  const total = chapters.length;

  // Load chapter i's photos (frame + inline copy share URLs) ahead of time
  const preload = (i: number) => {
    for (const img of [...$$<HTMLImageElement>('img', shots[i] ?? document.createElement('div')), ...$$<HTMLImageElement>('.chapter-photo img', chapters[i] ?? document.createElement('div'))]) img.loading = 'eager';
  };

  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    chapters.forEach((c, j) => c.classList.toggle('is-active', j === i));
    shots.forEach((s, j) => s.classList.toggle('is-active', j === i));
    dots.forEach((b, j) => (j === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    if (count) count.textContent = fill(t('story.progress'), { n: i + 1, total });
    if (cap) cap.textContent = captions[i] ?? '';
    preload(i + 1);
  };
  story.classList.add('ready');
  setActive(0);

  // Active chapter = the one nearest the viewport centre. A centre-line observer alone misses jumps
  // that land in the gap between chapters, so measure on scroll while the story is near the viewport.
  let near = false, raf = 0;
  const pick = () => {
    raf = 0;
    const mid = innerHeight / 2;
    let best = 0, bestDist = Infinity;
    chapters.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const dist = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActive(best);
  };
  new IntersectionObserver(([e]) => { near = !!e?.isIntersecting; if (near) pick(); }).observe(story);
  addEventListener('scroll', () => { if (near && !raf) raf = requestAnimationFrame(pick); }, { passive: true });

  dots.forEach((b, i) => b.addEventListener('click', () => chapters[i]?.scrollIntoView({ block: 'center', behavior: scrollBehavior() })));

  // Start fetching the first story photo shortly before the section arrives
  new IntersectionObserver(([e], io) => { if (e?.isIntersecting) { preload(0); io.disconnect(); } }, { rootMargin: '600px 0px' }).observe(story);

  // Mobile: one-time reveal of each inline photo (CSS applies it below 820px only)
  if (!reduceMotion.matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { threshold: 0.2 });
    $$('.chapter-photo', story).forEach((f) => io.observe(f));
  } else {
    $$('.chapter-photo', story).forEach((f) => f.classList.add('seen'));
  }
}
