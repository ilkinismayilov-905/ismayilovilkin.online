import { $, $$, scrollBehavior, store } from './dom';
import { readData, translator } from './data';
import { toast } from './toast';
import { initTheme } from './theme';
import { initHero, initStatusLight } from './hero';
import { initCaseDialog, initFilters, initPreview, type Category } from './work';
import { initNavCurrent, initTimeline } from './scroll';
import { initPalette, type Command } from './palette';
import { initPageTransitions } from './transitions';
import { initPhotoBackground } from './photo-bg';

export function init() {
  const d = readData();
  const t = translator(d);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  for (const k of $$('.kbd-hint')) k.textContent = isMac ? '⌘K' : 'Ctrl K';

  const theme = initTheme(t);
  initHero();
  initStatusLight(d.easterEgg, t('egg.toast'), toast);
  const filter = initFilters(d, t);
  const hidePreview = initPreview(t);
  const dialog = initCaseDialog(hidePreview);
  initTimeline();
  initPhotoBackground();
  initPageTransitions();

  // Language switch keeps the visitor on the same section
  initNavCurrent(() => {});
  const section = () => {
    const mid = innerHeight / 2;
    const hit = ['work', 'about', 'experience', 'awards', 'contact']
      .map((id) => document.getElementById(id))
      .find((el) => { const r = el?.getBoundingClientRect(); return !!r && r.top <= mid && r.bottom >= mid; });
    return hit?.id ?? '';
  };
  for (const a of $$<HTMLAnchorElement>('[data-lang-switch]')) {
    a.addEventListener('click', () => { const s = section(); a.href = a.href.split('#')[0] + (s ? `#${s}` : ''); });
  }
  initLangSuggestion(d.locale);

  // Copy email
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(d.email);
      toast(t('contact.copied'));
    } catch {
      const ta = document.createElement('textarea');
      ta.value = d.email;
      ta.className = 'sr-only';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      toast(ok ? t('contact.copied') : t('contact.blocked'));
    }
  };
  $('#copyBtn')?.addEventListener('click', () => void copyEmail());

  // Command palette
  const go = (id: string) => {
    if (!d.home) { location.href = `${d.homeHref}#${id}`; return; }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    $<HTMLElement>('h2', el ?? document)?.focus({ preventScroll: true });
  };
  const openTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
  const sections: [string, string][] = [['work', t('nav.work')], ['about', t('nav.about')], ['experience', t('nav.experience')], ['awards', t('nav.awards')], ['contact', t('nav.contact')]];
  const commands: Command[] = [
    ...sections.map(([id, label]) => ({ group: t('group.goto'), label, run: () => go(id) })),
    ...d.projects.filter((p) => p.url).map((p) => ({
      group: t('group.project'),
      label: p.title,
      ...(p.year ? { hint: String(p.year) } : {}),
      run: () => { if (!d.home || !dialog.open(p.slug)) location.href = p.url ?? d.homeHref; },
    })),
    ...(d.home
      ? (['backend', 'hackathon', 'frontend', 'all'] as Category[]).map((c) => ({ group: t('group.filter'), label: t(`cmd.filter.${c}`), run: () => { filter(c); go('work'); } }))
      : []),
    { group: t('group.actions'), label: t('cmd.copyEmail'), run: () => void copyEmail() },
    { group: t('group.actions'), label: theme.label, run: theme.toggle },
    { group: t('group.actions'), label: t('cmd.lang'), run: () => { const s = section(); location.href = d.links.otherLocale + (s ? `#${s}` : ''); } },
    { group: t('group.actions'), label: t('cmd.github'), run: () => openTab(d.links.github) },
    { group: t('group.actions'), label: t('cmd.linkedin'), run: () => openTab(d.links.linkedin) },
  ];
  initPalette(commands, t('palette.empty'), () => { if (dialog.isOpen()) dialog.close(); }, dialog.isOpen);
}

/** Dismissible hint when the visitor's browser prefers the other language. Never redirects. */
function initLangSuggestion(locale: 'en' | 'az') {
  const box = $('#suggest');
  if (!box || store.get('langSuggest') === 'dismissed') return;
  const other = locale === 'en' ? 'az' : 'en';
  const langs = navigator.languages.map((l) => l.toLowerCase());
  if (langs.some((l) => l.startsWith(locale)) || !langs.some((l) => l.startsWith(other))) return;
  box.hidden = false;
  $('#suggestClose')?.addEventListener('click', () => { box.hidden = true; store.set('langSuggest', 'dismissed'); });
}
