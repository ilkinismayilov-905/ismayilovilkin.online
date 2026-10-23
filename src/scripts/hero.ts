// Hero: one load sequence for the name, letters respond to the pointer, a glow follows it,
// the portrait drifts with the pointer and, while scrolling out of the hero, moves up to 40px slower than the page.
import { $, $$, finePointer, reduceMotion } from './dom';

export function initHero() {
  const name = $('#name');
  const hero = $('.hero');
  const portrait = $('#portrait');
  if (!name || !hero || !portrait) return;

  for (const line of $$('.line', name)) {
    const text = line.dataset['text'] ?? '';
    line.textContent = '';
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      line.append(s);
    }
  }
  const chars = $$('.ch', name);
  if (reduceMotion.matches) name.classList.remove('loading');
  else {
    chars.forEach((c, i) => (c.style.transitionDelay = `${i * 50}ms`));
    requestAnimationFrame(() => requestAnimationFrame(() => name.classList.remove('loading')));
    setTimeout(() => chars.forEach((c) => (c.style.transitionDelay = '0ms')), 1500);
  }

  // Pointer effects: desktop fine pointers only
  if (finePointer.matches && !reduceMotion.matches) {
    let centers: [number, number][] = [];
    let px = 0, py = 0, raf = 0;
    const measure = () => {
      centers = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
    };
    const frame = () => {
      raf = 0;
      chars.forEach((c, i) => {
        const [cx, cy] = centers[i] ?? [0, 0];
        const d = Math.hypot(px - cx, (py - cy) * 1.3);
        const t = Math.max(0, 1 - d / 240), e = t * t;
        c.style.setProperty('--w', (112 - 37 * e).toFixed(1));
        c.style.setProperty('--g', (780 + 120 * e).toFixed(0));
      });
      const hr = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${px - hr.left}px`);
      hero.style.setProperty('--my', `${py - hr.top}px`);
      portrait.style.setProperty('--px', `${((px / innerWidth - 0.5) * -14).toFixed(1)}px`);
      portrait.style.setProperty('--py', `${((py / innerHeight - 0.5) * -10).toFixed(1)}px`);
    };
    hero.addEventListener('pointerenter', measure);
    hero.addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(frame);
    });
    hero.addEventListener('pointerleave', () => {
      chars.forEach((c) => { c.style.removeProperty('--w'); c.style.removeProperty('--g'); });
      portrait.style.setProperty('--px', '0px');
      portrait.style.setProperty('--py', '0px');
    });
    addEventListener('scroll', () => { if (centers.length) measure(); }, { passive: true });
    addEventListener('resize', measure);
  }

  // Scroll continuity: at most 40px of parallax, tint deepens slightly
  if (!reduceMotion.matches) {
    let visible = true, raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
      portrait.style.setProperty('--drift', `${(p * 40).toFixed(1)}px`);
      portrait.style.setProperty('--deepen', (p * 0.18).toFixed(3));
    };
    new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; }).observe(hero);
    addEventListener('scroll', () => { if (visible && !raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }
}

export function initStatusLight(easterEgg: string, found: string, toast: (m: string) => void) {
  const light = $('#live');
  const text = $('#nextText');
  if (!light || !text) return;
  const original = text.textContent ?? '';
  let clicks = 0;
  light.addEventListener('click', () => {
    clicks++;
    if (clicks === 5) { text.textContent = easterEgg; toast(found); }
    if (clicks === 6) { text.textContent = original; clicks = 0; }
  });
}
