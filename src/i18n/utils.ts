import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { getRelativeLocaleUrl } from 'astro:i18n';
import { ui, locales, type Locale, type UiKey } from './ui';

export { locales, type Locale };

export const otherLocale = (l: Locale): Locale => (l === 'en' ? 'az' : 'en');
export const asLocale = (l: string | undefined): Locale => (l === 'az' ? 'az' : 'en');

/** Translator for one locale: t('count.all', { n: 7 }). */
export const useT = (locale: Locale) => (key: UiKey, vars: Record<string, string | number> = {}) =>
  ui[locale][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Locale-prefixed path: href('az', 'work/milly/') → '/az/work/milly/'. */
export const href = (locale: Locale, path = '') => getRelativeLocaleUrl(locale, path);

/** "2025-12" → EN "Dec 2025", AZ "Dekabr 2025" (the CVs' formats). */
export function monthYear(locale: Locale, ym: string): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const s = new Intl.DateTimeFormat(locale, { month: locale === 'az' ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
  // toLocaleUpperCase('az') keeps Azerbaijani casing right (i → İ)
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

export const projectSlug = (p: CollectionEntry<'projects'>) => p.id.split('/')[1] ?? p.id;

export async function getProjects(locale: Locale) {
  const all = await getCollection('projects', ({ id }) => id.startsWith(`${locale}/`));
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getSingle<C extends 'site' | 'about' | 'experience' | 'awards'>(collection: C, locale: Locale) {
  const entry = await getEntry(collection, locale);
  if (!entry) throw new Error(`Missing ${collection}/${locale}`);
  return entry;
}

const NEEDS_INPUT = '[NEEDS INPUT]';

/**
 * Build-time check: content must exist in both locales with the same shape.
 * Throws (failing the build) on any mismatch. With RELEASE=1 it also fails on [NEEDS INPUT] markers.
 */
export async function assertContentReady() {
  const problems: string[] = [];
  const shape = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' && !('src' in v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v;

  for (const c of ['site', 'about', 'experience', 'awards'] as const) {
    const [en, az] = await Promise.all([getEntry(c, 'en'), getEntry(c, 'az')]);
    if (!en || !az) { problems.push(`${c}: missing ${!en ? 'en' : 'az'}`); continue; }
    if (JSON.stringify(shape(en.data)) !== JSON.stringify(shape(az.data))) problems.push(`${c}: en and az have different fields or list lengths`);
  }

  const [pen, paz] = await Promise.all([getProjects('en'), getProjects('az')]);
  const key = (p: CollectionEntry<'projects'>) =>
    JSON.stringify([projectSlug(p), p.data.order, p.data.year, p.data.category, p.data.caseStudy, p.data.motif, p.data.facts.length, p.data.live?.url, p.data.live?.coldStart, !!p.data.sections, p.data.stack?.length, p.data.background]);
  const enKeys = new Set(pen.map(key));
  for (const p of paz) if (!enKeys.has(key(p))) problems.push(`projects: az/${projectSlug(p)} has no matching en entry`);
  if (pen.length !== paz.length) problems.push(`projects: ${pen.length} en vs ${paz.length} az`);

  if (problems.length) throw new Error(`Locale parity check failed:\n- ${problems.join('\n- ')}`);

  const all = [...(await getCollection('site')), ...(await getCollection('about')), ...(await getCollection('experience')), ...(await getCollection('awards')), ...pen, ...paz];
  const pending = all.filter((e) => JSON.stringify(e.data).includes(NEEDS_INPUT) || ('body' in e && e.body?.includes(NEEDS_INPUT)));
  if (pending.length) {
    const msg = `${NEEDS_INPUT} remains in: ${pending.map((e) => `${e.collection}/${e.id}`).join(', ')}`;
    if (process.env['RELEASE'] === '1') throw new Error(msg);
    console.warn(`[content] ${msg}`);
  }
}
