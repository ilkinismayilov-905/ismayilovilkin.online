import { expect, test } from './fixtures';

test.use({ viewport: { width: 1366, height: 860 } });

test('reduced motion: no load animation, no scale, instant swaps, no smooth scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#name')).not.toHaveClass(/loading/);
  const s = await page.evaluate(() => ({
    scale: getComputedStyle(document.querySelector('#photoBg img') as Element).transform,
    fade: getComputedStyle(document.querySelector('#photoBg picture') as Element).transitionDuration,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(s.scale).toBe('none');
  expect(parseFloat(s.fade)).toBeLessThan(0.001);
  expect(s.scroll).toBe('auto');
});

test('reduced transparency: solid surfaces, no photo', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await page.goto('/');
  const s = await page.evaluate(() => ({
    photo: getComputedStyle(document.querySelector('#photoBg picture') as Element).display,
    header: getComputedStyle(document.querySelector('.bar') as Element).backdropFilter,
    board: getComputedStyle(document.querySelector('.board') as Element).backgroundColor,
  }));
  expect(s.photo).toBe('none');
  expect(s.header).toBe('none');
  expect(s.board).toBe('rgb(15, 30, 27)');
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });
  test('all core content readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass('no-js');
    await expect(page.locator('#name')).toContainText('Ismayilov');
    await expect(page.locator('#case-milly')).toBeVisible(); // case studies inline
    await expect(page.locator('.about-text .chapter').first()).toBeVisible();
    await expect(page.locator('.timeline li')).toHaveCount(5);
    await expect(page.locator('#openPalette')).toBeHidden();
    await expect(page.locator('.filters')).toBeHidden();
    await expect(page.locator('.bg-caption')).toHaveCount(6); // work, 3 chapters, experience, awards
    await expect(page.locator('.bg-caption').first()).toBeHidden();
    await expect(page.locator('#photoBg picture')).toHaveCount(1);
    await page.goto('/az/work/milly/');
    await expect(page.locator('h1')).toHaveText('Milly');
    await expect(page.locator('header a[hreflang="en"]')).toBeVisible(); // language switch works without JS
  });
});

test('slow network: the previous photo stays until the next one is decoded', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await page.goto('/');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024 });
  // jump to the third About chapter: its photo is not preloaded yet
  await page.evaluate(() => document.querySelectorAll('.about-text .chapter')[2]?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  const midway = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('#photoBg picture')].filter((p) => !p.hasAttribute('data-hidden'));
    const img = visible[0]?.querySelector('img');
    return { visible: visible.length, complete: !!img?.complete && img.naturalWidth > 0 };
  });
  expect(midway.visible).toBe(1); // never a blank layer
  expect(midway.complete).toBe(true); // what is shown is a loaded photo
});
