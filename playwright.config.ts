import { defineConfig } from '@playwright/test';

// Runs against the production build (`astro build` + `astro preview`), in the installed Google Chrome.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4323', channel: 'chrome' },
  // Own preview for the tests: separate port, IPv4, and --ignore-lock because Astro 7 refuses to start a second
  // preview while another one (e.g. `npm run preview`) holds the lock.
  webServer: { command: 'npx astro preview --port 4323 --host 127.0.0.1 --ignore-lock', url: 'http://127.0.0.1:4323', reuseExistingServer: false },
});
