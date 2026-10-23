import { expect, test } from './fixtures';
import { pages } from './pages';

const widths = [375, 768, 1280, 1920];

for (const width of widths) for (const theme of ['dark', 'light'] as const) {
  test.describe(`${width}px ${theme}`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : width < 1280 ? 1024 : 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    for (const path of pages) {
      test(`no overflow on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const out = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const bad: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            if (el.closest('.sr-only, .skip, #photoBg, dialog:not([open]), .preview, .toast, #suggest[hidden]')) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            // the hero tag deliberately hangs over the arch edge; the arch ring is decorative
            if (el.closest('.tag, .portrait-ring')) continue;
            if (r.right > vw + 1 || r.left < -1) bad.push(`${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.left)}..${Math.round(r.right)}`);
            if (getComputedStyle(el).whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') bad.push(`clipped: ${el.className}`);
          }
          return { scroll: document.documentElement.scrollWidth - vw, bad: [...new Set(bad)].slice(0, 6) };
        });
        expect(out.scroll, 'horizontal page scroll').toBeLessThanOrEqual(0);
        expect(out.bad).toEqual([]);
        const name = `${path.replace(/^\/|\/$/g, '').replace(/[/.]/g, '_') || 'home'}-${width}-${theme}.png`;
        await page.screenshot({ path: `reports/matrix/${name}`, fullPage: true });
      });
    }
  });
}

test.describe('glyphs', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  for (const path of pages) {
    test(`all text renders in Archivo on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'h1, h2, h3, p, li, a, button, dt, dd, span, strong, label' });
      const other = new Map<string, number>();
      for (const nodeId of nodeIds) {
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        for (const f of fonts) if (!/Archivo/i.test(f.familyName)) other.set(f.familyName, (other.get(f.familyName) ?? 0) + f.glyphCount);
      }
      // ⌘ is not in Archivo (nor in Mona Sans): the "⌘K" hint uses a system font by design, 1 glyph per hint
      const allowed = [...other].filter(([, n]) => n > 4);
      expect(allowed, `non-Archivo glyphs: ${JSON.stringify([...other])}`).toEqual([]);
    });
  }
});
