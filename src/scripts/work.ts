// Work list: category filters with a live count, case-study dialog, pointer-following preview.
import { $, $$, fill, finePointer, reduceMotion } from './dom';
import type { PageData } from './data';
import { motifSvg } from '../lib/motif';

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
      pv.innerHTML = motifSvg(li.dataset['motif'] ?? '');
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
