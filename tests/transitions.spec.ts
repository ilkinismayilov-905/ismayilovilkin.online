import { expect, test } from './fixtures';

// View Transitions: record which transitions actually ran.
async function setup(context: import('@playwright/test').BrowserContext) {
  await context.addInitScript(() => {
    const w = window as unknown as { __vt: string[] };
    w.__vt = [];
    const orig = document.startViewTransition?.bind(document);
    if (orig) document.startViewTransition = ((cb: ViewTransitionUpdateCallback) => { w.__vt.push('same-doc'); return orig(cb); }) as typeof document.startViewTransition;
    addEventListener('pagereveal', (e) => w.__vt.push((e as PageRevealEvent).viewTransition ? 'reveal:vt' : 'reveal:none'));
  });
}
const log = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __vt: string[] }).__vt);

for (const reduced of [false, true]) {
  test.describe(reduced ? 'reduced motion' : 'motion allowed', () => {
    test.use({ viewport: { width: 1366, height: 860 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });

    test('list → dialog: title morph, focus unchanged', async ({ page, context }) => {
      await setup(context);
      await page.goto('/');
      await page.evaluate(() => document.querySelector('#workList')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.locator('#workList a[data-case="milly"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#caseBody h3')).toHaveText('Milly');
      await expect(page.locator('#caseClose')).toBeFocused();
      expect((await log(page)).includes('same-doc')).toBe(!reduced);
      await page.waitForTimeout(800);
      // names are set only for the duration of one transition
      expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-vt], #caseBody h3')].every((e) => !e.style.viewTransitionName))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('#workList a[data-case="milly"]')).toBeFocused();
    });

    test('case page → list: cross-document transition', async ({ page, context }) => {
      await setup(context);
      await page.goto('/work/milly/');
      await page.click('a.back');
      await page.waitForURL(/\/#work$/);
      await page.waitForTimeout(600);
      expect((await log(page)).includes('reveal:vt')).toBe(!reduced);
    });
  });
}
