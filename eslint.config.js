import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig(
  { ignores: ['dist/', '.astro/', 'design/', '.proof/', 'graft/', 'node_modules/', 'test-results/', 'playwright-report/', 'reports/', '.claude/'] },
  tseslint.configs.strict,
  astro.configs.recommended,
);
