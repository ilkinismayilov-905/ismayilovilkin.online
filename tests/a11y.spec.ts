import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { pages } from './pages';

const serious = async (page: import('@playwright/test').Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
};

for (const theme of ['dark', 'light'] as const) {
  test.describe(`axe, ${theme}`, () => {
    test.use({ viewport: { width: 1366, height: 860 }, colorScheme: theme });
    for (const path of pages) {
      test(`no serious/critical issues on ${path}`, async ({ page }) => {
        await page.goto(path);
        expect(await serious(page)).toEqual([]);
      });
    }
    test('dialog and palette open states', async ({ page }) => {
      await page.goto('/');
      await page.locator('#workList a[data-case="milly"]').click();
      await expect(page.locator('#caseDialog')).toHaveAttribute('open', '');
      await page.waitForTimeout(600); // let the open animation finish before measuring colours
      expect(await serious(page)).toEqual([]);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Meta+k');
      await expect(page.locator('#palette')).toHaveAttribute('open', '');
      await page.waitForTimeout(600);
      expect(await serious(page)).toEqual([]);
    });
  });
}

test.describe('keyboard only', () => {
  test.use({ viewport: { width: 1366, height: 860 } });

  test('skip link, header, filters, dialog, palette, language switch', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);

    // header order: brand, 5 section links, search, theme, language
    await page.goto('/');
    const order: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => { const a = document.activeElement as HTMLElement; return a.id || a.dataset['sec'] || a.className || a.tagName; }));
    }
    expect(order).toEqual(['skip', 'brand', 'work', 'about', 'experience', 'awards', 'contact', 'openPalette', 'themeBtn', 'tool-btn']);

    // filters with Tab + Space
    await page.locator('.filters button[data-filter="all"]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.locator('.filters button[data-filter="backend"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#count')).toHaveText('Showing 4 backend projects');

    await page.locator('.filters button[data-filter="all"]').click();
    // dialog: Enter opens, focus inside, Tab stays inside (close button is the only control before content links), Esc closes
    await page.locator('#workList a[data-case="yolcu"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#caseClose')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#caseDialog'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#workList a[data-case="yolcu"]')).toBeFocused();

    // palette: arrows + Enter run a command (go to Experience)
    await page.keyboard.press('Control+k');
    await expect(page.locator('#palInput')).toBeFocused();
    await page.keyboard.type('experience');
    await page.keyboard.press('Enter');
    await expect(page.locator('#exp-h')).toBeFocused();

    // language switcher from the keyboard
    await page.locator('header [data-lang-switch]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
  });

  test('focus is always visible', async ({ page }) => {
    await page.goto('/');
    // Tab through every control on the page (counted, not hard-coded: content changes the number)
    const count = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.tabIndex >= 0 && !el.closest('dialog:not([open]), [hidden]') && el.getClientRects().length > 0).length);
    expect(count).toBeGreaterThan(15);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
      });
      expect(outline.style !== 'none' && outline.width >= 2, `focus ring on ${outline.tag}`).toBe(true);
    }
  });
});

test.describe('keyboard only, Azerbaijani', () => {
  test.use({ viewport: { width: 1366, height: 860 } });
  test('filters, dialog, palette and language switch', async ({ page }) => {
    await page.goto('/az/');
    await page.locator('.filters button[data-filter="all"]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('#count')).toHaveText('4 backend layihəsi göstərilir');
    await page.locator('.filters button[data-filter="all"]').click();
    await page.locator('#workList a[data-case="abadland-qarabag"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#caseClose')).toBeFocused();
    await expect(page.locator('#caseClose')).toHaveText('Bağla');
    await page.keyboard.press('Escape');
    await expect(page.locator('#workList a[data-case="abadland-qarabag"]')).toBeFocused();
    await page.keyboard.press('/');
    await page.keyboard.type('təcrübə');
    await expect(page.locator('.pal-opt[aria-selected="true"]')).toContainText('Təcrübə');
    await page.keyboard.press('Enter');
    await expect(page.locator('#exp-h')).toBeFocused();
    await page.keyboard.press('Control+k');
    await page.keyboard.type('ingilis');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
