// Shape of the <script type="application/json" id="page-data"> block written by Base.astro.
export interface PageData {
  locale: 'en' | 'az';
  home: boolean;
  homeHref: string;
  email: string;
  links: { github: string; linkedin: string; otherLocale: string };
  projects: { slug: string; title: string; year: number | null; url: string | null }[];
  t: Record<string, string>;
  easterEgg: string;
}

export function readData(): PageData {
  const el = document.getElementById('page-data');
  return JSON.parse(el?.textContent ?? '{}') as PageData;
}

/** Translator over the strings shipped to the client; falls back to the key so a gap is visible, never silent. */
export const translator = (d: PageData) => (key: string) => d.t[key] ?? key;
