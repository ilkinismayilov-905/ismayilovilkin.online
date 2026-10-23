import { $, store } from './dom';
import { toast } from './toast';

const root = document.documentElement;
const lightMq = matchMedia('(prefers-color-scheme: light)');

export const isLight = () => (root.dataset['theme'] ? root.dataset['theme'] === 'light' : lightMq.matches);

export function initTheme(t: (k: string) => string) {
  const btn = $('#themeBtn');
  const sync = () => btn?.setAttribute('aria-label', isLight() ? t('theme.toDark') : t('theme.toLight'));
  const toggle = () => {
    const next = isLight() ? 'dark' : 'light';
    root.dataset['theme'] = next;
    store.set('theme', next);
    sync();
    toast(next === 'light' ? t('theme.lightOn') : t('theme.darkOn'));
  };
  btn?.addEventListener('click', toggle);
  lightMq.addEventListener('change', sync);
  sync();
  return { toggle, label: () => (isLight() ? t('theme.toDark') : t('theme.toLight')) };
}
