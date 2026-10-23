// Work list: category filters with a live count, case-study dialog, pointer-following preview.
import { $, $$, fill, finePointer, reduceMotion } from './dom';
import type { PageData } from './data';

export type Category = 'all' | 'backend' | 'hackathon' | 'frontend';

export function initFilters(d: PageData, t: (k: string) => string) {
  const rows = $$('#workList li');
  const count = $('#count');
  const plural = new Intl.PluralRules(d.locale);
  const filter = (cat: Category) => {
    let n = 0;
    for (const r of rows) {
      const show = cat === 'all' || r.dataset['cat'] === cat;
      r.hidden = !show;
      if (show) n++;
    }
    for (const b of $$('.filters button')) b.setAttribute('aria-pressed', String(b.dataset['filter'] === cat));
    if (count) {
      count.textContent = cat === 'all'
        ? fill(t('count.all'), { n: rows.length })
        : fill(t(plural.select(n) === 'one' ? 'count.one' : 'count.other'), { n, cat: t(`cat.${cat}`) });
    }
  };
  for (const b of $$('.filters button')) b.addEventListener('click', () => filter(b.dataset['filter'] as Category));
  return filter;
}

export function initCaseDialog(onOpen: () => void) {
  const dlg = $<HTMLDialogElement>('#caseDialog');
  const body = $('#caseBody');
  const open = (slug: string) => {
    const art = document.getElementById(`case-${slug}`);
    if (!dlg || !body || !art) return false;
    body.innerHTML = art.innerHTML;
    onOpen();
    dlg.showModal();
    dlg.scrollTop = 0;
    return true;
  };
  for (const a of $$<HTMLAnchorElement>('#workList a[data-case]')) {
    a.addEventListener('click', (e) => {
      // Let modified clicks (new tab, etc.) follow the real case-study URL
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (open(a.dataset['case'] ?? '')) e.preventDefault();
    });
  }
  $('#caseClose')?.addEventListener('click', () => dlg?.close());
  dlg?.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return { open, isOpen: () => !!dlg?.open, close: () => dlg?.close() };
}

const motif = (kind: string) => {
  const cs = getComputedStyle(document.documentElement);
  const A = cs.getPropertyValue('--accent').trim(), T = cs.getPropertyValue('--text').trim();
  let s = '';
  if (kind === 'lines') for (let i = 0; i < 8; i++) { const y = 22 + i * 19, w = 90 + ((i * 53) % 140); s += `<line x1="22" y1="${y}" x2="${22 + w}" y2="${y}" stroke="${T}" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="262" cy="${y}" r="4.5" fill="${i === 4 ? A : 'none'}" stroke="${i === 4 ? A : T}" stroke-opacity="${i === 4 ? 1 : 0.5}" stroke-width="2"/>`; }
  if (kind === 'blocks') for (let i = 0; i < 6; i++) s += `<rect x="${34 + i * 14}" y="${22 + i * 24}" width="160" height="16" rx="8" fill="${i === 5 ? A : T}" opacity="${i === 5 ? 1 : 0.12 + i * 0.09}"/>`;
  if (kind === 'rings') { for (let i = 1; i < 6; i++) s += `<path d="M ${150 - i * 24} 152 A ${i * 24} ${i * 24} 0 0 1 ${150 + i * 24} 152" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round" opacity="${0.75 - i * 0.11}"/>`; s += `<circle cx="150" cy="152" r="7" fill="${A}"/>`; }
  if (kind === 'grid') for (let x = 0; x < 12; x++) for (let y = 0; y < 7; y++) { const hit = x > 6 && x < 10 && y > 1 && y < 5; s += `<circle cx="${23 + x * 23}" cy="${22 + y * 23}" r="${hit ? 6 : 3}" fill="${hit ? A : T}" opacity="${hit ? 1 : 0.35}"/>`; }
  if (kind === 'wave') { let p = 'M 12 124'; for (let x = 12; x <= 288; x += 8) p += ` L ${x} ${124 - Math.sin(x / 34) * 26 - x / 12}`; s += `<path d="${p}" fill="none" stroke="${T}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><circle cx="232" cy="42" r="20" fill="${A}"/>`; }
  return `<svg viewBox="0 0 300 180" role="presentation">${s}</svg>`;
};

export function initPreview(t: (k: string) => string) {
  const pv = $('#preview');
  if (!pv) return () => {};
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, on = false;
  const loop = () => {
    const k = reduceMotion.matches ? 1 : 0.18;
    cx += (tx - cx) * k; cy += (ty - cy) * k;
    pv.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = on || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  const target = (e: PointerEvent) => {
    tx = e.clientX + 318 > innerWidth ? e.clientX - 318 : e.clientX + 28;
    ty = Math.min(Math.max(e.clientY - 110, 12), innerHeight - 240);
  };
  const hide = () => { on = false; pv.classList.remove('on'); };
  for (const li of $$('#workList li')) {
    const a = $<HTMLAnchorElement>('a[data-case]', li);
    if (!a) continue;
    a.addEventListener('pointerenter', (e) => {
      if (!finePointer.matches) return;
      const title = $('.w-title', li)?.textContent ?? '';
      const year = $('.w-year', li)?.textContent ?? '';
      const p = document.createElement('p');
      p.textContent = fill(t('preview.case'), { title, year }).replace(/^(.*?), \./, '$1.');
      pv.innerHTML = motif(li.dataset['motif'] ?? '');
      pv.append(p);
      target(e);
      if (!pv.classList.contains('on')) { cx = tx; cy = ty; }
      on = true;
      pv.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    a.addEventListener('pointermove', target);
    a.addEventListener('pointerleave', hide);
  }
  return hide;
}
