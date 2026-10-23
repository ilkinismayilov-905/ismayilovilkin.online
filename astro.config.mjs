// @ts-check
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { rename, rmdir } from 'node:fs/promises';
import { defineConfig, fontProviders } from 'astro/config';

// The only inline script (applies the stored theme before first paint). Its hash goes into the CSP.
const themeInit = readFileSync(new URL('./src/scripts/theme-init.js', import.meta.url), 'utf8');
const themeInitHash = /** @type {`sha256-${string}`} */ (`sha256-${createHash('sha256').update(themeInit).digest('base64')}`);

// Astro writes src/pages/az/404.astro to az/404/index.html; hosts look for az/404.html.
/** @type {import('astro').AstroIntegration} */
const localeNotFound = {
  name: 'locale-404',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const from = new URL('az/404/index.html', dir);
      if (!existsSync(from)) return;
      await rename(from, new URL('az/404.html', dir));
      await rmdir(new URL('az/404/', dir));
    },
  },
};

export default defineConfig({
  site: 'https://ismayilovilkin.online',
  trailingSlash: 'always',
  integrations: [localeNotFound],
  i18n: { locales: ['en', 'az'], defaultLocale: 'en' },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/Archivo-wdth-wght.woff2'], weight: '200 900', stretch: '75% 125%', style: 'normal', display: 'swap' },
        ],
      },
    },
  ],
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "font-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"],
      scriptDirective: { hashes: [themeInitHash] },
    },
  },
  vite: {
    // Keep JS in external files (no inlined scripts); other assets use Vite's default 4 KB limit.
    build: { assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined) },
  },
});
