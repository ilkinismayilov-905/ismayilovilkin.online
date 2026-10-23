import { test as base, expect } from '@playwright/test';

// Every test fails on page errors or console errors (which include Content-Security-Policy violations).
export const test = base.extend<{ consoleClean: void }>({
  consoleClean: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await use();
      expect(errors, 'console errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
