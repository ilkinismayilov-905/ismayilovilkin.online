import { getProjects, href, projectSlug, type Locale } from '../i18n/utils';

const needSite = (site: URL | undefined) => {
  if (!site) throw new Error('`site` must be set in astro.config.mjs');
  return site;
};

const xml = (body: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });

/** Every indexable path inside a locale ('' = home). Same paths exist in both locales. */
async function paths() {
  const cases = (await getProjects('en')).filter((p) => p.data.caseStudy).map((p) => `work/${projectSlug(p)}/`);
  return ['', ...cases];
}

export async function localeSitemap(locale: Locale, maybeSite: URL | undefined) {
  const site = needSite(maybeSite);
  const abs = (l: Locale, p: string) => new URL(href(l, p), site).href;
  const urls = (await paths()).map(
    (p) => `  <url>
    <loc>${abs(locale, p)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${abs('en', p)}"/>
    <xhtml:link rel="alternate" hreflang="az" href="${abs('az', p)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('en', p)}"/>
  </url>`,
  );
  return xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`);
}

export const sitemapIndex = (maybeSite: URL | undefined) => {
  const site = needSite(maybeSite);
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${new URL('sitemap-en.xml', site).href}</loc></sitemap>
  <sitemap><loc>${new URL('sitemap-az.xml', site).href}</loc></sitemap>
</sitemapindex>`);
};
