export const $ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => ctx.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => [...ctx.querySelectorAll<T>(sel)];

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

export const scrollBehavior = (): ScrollBehavior => (reduceMotion.matches ? 'auto' : 'smooth');

/** Fill {placeholders} in a translated string. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

/** localStorage can be missing or throw (private mode, blocked storage); the site must work without it. */
export const store = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable: setting just won't persist */ }
  },
};
