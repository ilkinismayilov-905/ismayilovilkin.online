// Enhancement 4: the project title morphs between the work list, the case-study dialog and the standalone page.
// Each project has its own view-transition-name, set only for the duration of one transition.
// Off under prefers-reduced-motion; browsers without View Transitions keep the baseline behaviour.
import { $, reduceMotion } from './dom';

const name = (slug: string) => `project-${slug}`;
const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
const caseSlug = (url: URL) => /\/work\/([^/]+)\/$/.exec(url.pathname)?.[1] ?? null;
const isHome = (url: URL) => /^\/(az\/)?$/.test(url.pathname);
const listTitle = (slug: string) => $(`.w-title[data-vt="${CSS.escape(slug)}"]`);
const pageTitle = () => $('.case-rich h1[data-vt]');

/**
 * Same-document: morph the list title into the dialog heading.
 * `show` opens the dialog exactly as without a transition and returns the heading to morph into.
 * Returns false (and does nothing) when no transition should run.
 */
export function morphIntoDialog(slug: string, show: () => HTMLElement | null): boolean {
  const from = listTitle(slug);
  if (!('startViewTransition' in document) || reduceMotion.matches || !from || !inView(from)) return false;
  from.style.viewTransitionName = name(slug);
  let to: HTMLElement | null = null;
  const vt = document.startViewTransition(() => {
    from.style.viewTransitionName = '';
    to = show();
    if (to) to.style.viewTransitionName = name(slug);
  });
  void vt.finished.finally(() => { if (to) to.style.viewTransitionName = ''; });
  return true;
}

/** Cross-document, outgoing side (needs @view-transition in CSS): list ↔ standalone page. Other navigations skip it. */
export function initPageTransitions() {
  const clearAfter = (vt: ViewTransition, el: HTMLElement) => void vt.finished.finally(() => { el.style.viewTransitionName = ''; });

  addEventListener('pageswap', (e) => {
    const vt = e.viewTransition;
    if (!vt) return;
    const target = e.activation?.entry.url ? new URL(e.activation.entry.url) : null;
    const here = new URL(location.href);
    const to = target ? caseSlug(target) : null, from = caseSlug(here);
    let el: HTMLElement | null = null, slug = '';
    if (target && to && isHome(here)) { el = listTitle(to); slug = to; if (el && !inView(el)) el = null; }
    else if (target && from && isHome(target)) { el = pageTitle(); slug = from; }
    // skipping rejects vt.ready; handle it so it isn't reported as an error
    if (!el) { vt.ready.catch(() => {}); vt.skipTransition(); return; }
    el.style.viewTransitionName = name(slug);
    clearAfter(vt, el);
  });
  // The receiving side (pagereveal) is the inline src/scripts/page-reveal.js: it must run before first render.
}
