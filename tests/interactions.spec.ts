import { expect, test } from './fixtures';

test.use({ viewport: { width: 1366, height: 860 }, colorScheme: 'dark' });

test('filters update the list and the live count', async ({ page }) => {
  await page.goto('/');
  await page.click('.filters button[data-filter="hackathon"]');
  await expect(page.locator('#count')).toHaveText('Showing 2 hackathon projects');
  await expect(page.locator('#workList li:not([hidden])')).toHaveCount(2);
  await page.click('.filters button[data-filter="frontend"]');
  await expect(page.locator('#count')).toHaveText('Showing 1 frontend project');
  await page.click('.filters button[data-filter="all"]');
  await expect(page.locator('#workList li:not([hidden])')).toHaveCount(7);
});

test('case dialog opens from the keyboard and returns focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#workList a[data-case="milly"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#caseDialog')).toHaveAttribute('open', '');
  await expect(page.locator('#caseBody h3')).toHaveText('Milly');
  await expect(page.locator('#caseClose')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#caseDialog')).not.toHaveAttribute('open', '');
  await expect(page.locator('#workList a[data-case="milly"]')).toBeFocused();
});

test('command palette: ⌘K, "/", search, open project, empty state', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#palette')).toHaveAttribute('open', '');
  await page.keyboard.type('yol');
  await expect(page.locator('.pal-opt[aria-selected="true"]')).toContainText('Yolçu');
  await page.keyboard.press('Enter');
  await expect(page.locator('#caseBody h3')).toHaveText('Yolçu');
  await page.keyboard.press('Escape');
  await page.keyboard.press('/');
  await expect(page.locator('#palette')).toHaveAttribute('open', '');
  await page.keyboard.type('zzzz');
  await expect(page.locator('.pal-empty')).toContainText('No matches');
});

test('theme toggles, persists and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.click('#themeBtn');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#themeBtn')).toHaveAttribute('aria-label', 'Switch to dark theme');
});

test('status light easter egg', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 5; i++) await page.click('#live');
  await expect(page.locator('#nextText')).toHaveText('Tea first, then the next endpoint');
  await page.click('#live');
  await expect(page.locator('#nextText')).toContainText('Looking for');
});

test('copy email', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.click('#copyBtn');
  await expect(page.locator('#toast')).toHaveText('Email copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ilkinismayilov.dev@gmail.com');
});

// Clicks by coordinates: Playwright's auto-scroll before page.click() would move the page under a sticky header.
const clickLangSwitch = async (page: import('@playwright/test').Page) => {
  const box = await page.locator('header [data-lang-switch]').boundingBox();
  if (!box) throw new Error('no language switch');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

test('language switch keeps the section, both directions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  await clickLangSwitch(page);
  await expect(page).toHaveURL(/\/az\/#experience$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'az');
  await page.waitForTimeout(800); // the jump to #experience is smooth-scrolled on arrival
  await clickLangSwitch(page);
  await expect(page).toHaveURL(/\/#experience$/);
});

test('Azerbaijani UI strings are Azerbaijani', async ({ page }) => {
  await page.goto('/az/');
  await page.click('.filters button[data-filter="hackathon"]');
  await expect(page.locator('#count')).toHaveText('2 hakaton layihəsi göstərilir');
  await page.click('#themeBtn');
  await expect(page.locator('#toast')).toHaveText(/tema aktivdir/);
});

test('case-study page: prev/next and back link', async ({ page }) => {
  await page.goto('/work/yolcu/');
  await expect(page.locator('h1')).toHaveText('Yolçu');
  await expect(page.locator('a[rel="prev"]')).toHaveText('Previous: Milly');
  await expect(page.locator('a[rel="next"]')).toHaveText('Next: AbadLand Qarabağ');
  await expect(page.locator('.live-note')).toHaveText('may take a moment to load');
  await page.goto('/work/milly/');
  await expect(page.locator('.live-note')).toHaveCount(0);
});
