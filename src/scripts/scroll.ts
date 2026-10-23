// Scroll-linked pieces: experience progress line and current section in the nav. (The page background is photo-bg.ts.)
// IntersectionObserver + requestAnimationFrame, passive listeners; no scroll hijacking.
import { $, $$ } from './dom';

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
