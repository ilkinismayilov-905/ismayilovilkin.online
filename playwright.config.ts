import { defineConfig } from '@playwright/test';

// Runs against the production build (`astro build` + `astro preview`), in the installed Google Chrome.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', channel: 'chrome' },
  webServer: { command: 'npx astro preview --port 4321', url: 'http://localhost:4321', reuseExistingServer: true },
});
