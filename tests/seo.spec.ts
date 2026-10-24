import { expect, test } from './fixtures';
import { pages } from './pages';

const ORIGIN = 'https://ismayilovilkin.online';
const content = pages.filter((p) => !p.includes('404'));

test('hreflang pairs, canonical and html lang on every page', async ({ page }) => {
  for (const path of content) {
    await page.goto(path);
    const az = path.startsWith('/az/');
    const twin = az ? path.slice(3) : `/az${path}`;
    const enPath = az ? twin : path, azPath = az ? path : twin;
    await expect(page.locator('html')).toHaveAttribute('lang', az ? 'az' : 'en');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', ORIGIN + path);
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', ORIGIN + enPath);
    await expect(page.locator('link[hreflang="az"]')).toHaveAttribute('href', ORIGIN + azPath);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', ORIGIN + enPath);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/ismayilovilkin\.online\/og\/(en|az)-[\w-]+\.jpg$/);
    expect((await page.request.get(twin)).status(), `twin of ${path}`).toBe(200);
  }
});

test('JSON-LD Person on both home pages', async ({ page }) => {
  for (const [path, name] of [['/', 'Ilkin Ismayilov'], ['/az/', 'İlkin İsmayılov']] as const) {
    await page.goto(path);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe(name);
    expect(data.sameAs).toEqual(['https://github.com/ilkinismayilov-905', 'https://www.linkedin.com/in/ilkin-ismayilov2']);
  }
});

test('404 pages in both languages, with status 404 and noindex', async ({ page }) => {
  for (const [missing, heading] of [['/nope/', 'Page not found'], ['/az/nope/', 'Səhifə tapılmadı']] as const) {
    // astro preview serves the root 404; the built az/404.html is checked directly
    const r = await page.request.get(missing);
    expect(r.status()).toBe(404);
    await page.goto(missing.startsWith('/az/') ? '/az/404.html' : '/404.html');
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  }
});

test('sitemaps list every page with alternates; robots points to them', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  const index = await (await request.get('/sitemap.xml')).text();
  expect(index).toContain(`${ORIGIN}/sitemap-en.xml`);
  expect(index).toContain(`${ORIGIN}/sitemap-az.xml`);
  const all = (await (await request.get('/sitemap-en.xml')).text()) + (await (await request.get('/sitemap-az.xml')).text());
  for (const path of content) expect(all).toContain(`<loc>${ORIGIN}${path}</loc>`);
  expect(all).not.toContain('404');
});

test('every internal link and asset resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const urls = await page.evaluate(() => [
      ...[...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((a) => a.href),
      ...[...document.querySelectorAll<HTMLImageElement>('img[src]')].map((i) => i.src),
      ...[...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="preload"]')].map((l) => l.href),
    ]);
    for (const u of urls) {
      const url = new URL(u);
      if (url.origin !== 'http://127.0.0.1:4323' || seen.has(url.pathname)) continue;
      seen.add(url.pathname);
      expect((await request.get(url.pathname)).status(), `${url.pathname} (from ${path})`).toBe(200);
      if (url.hash.length > 1 && url.pathname === new URL(page.url()).pathname) {
        expect(await page.locator(url.hash).count(), `anchor ${url.hash} on ${path}`).toBe(1);
      }
    }
  }
  expect(seen.size).toBeGreaterThan(15);
});

test('external links open in a new tab safely, with a localized hint', async ({ page }) => {
  for (const [path, hint] of [['/', '(opens in a new tab)'], ['/az/', '(yeni vərəqdə açılır)']] as const) {
    await page.goto(path);
    const ext = page.locator('a[href^="http"]:not([href*="localhost"])');
    const n = await ext.count();
    expect(n).toBeGreaterThanOrEqual(4); // GitHub, LinkedIn, Yolçu, AbadLand
    for (let i = 0; i < n; i++) {
      await expect(ext.nth(i)).toHaveAttribute('target', '_blank');
      await expect(ext.nth(i)).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(ext.nth(i).locator('.sr-only')).toHaveText(hint);
    }
  }
});
