# CLAUDE.md — project conventions

Bilingual (EN/AZ) static portfolio for Ilkin Ismayilov. Astro 7 + TypeScript strictest, no UI framework.
Full plan and rationale: `PLAN.md`. Open content questions: `CONTENT_REVIEW.md`. Self-translated AZ text: `TRANSLATION_REVIEW.md`.

## Hard rules

- **The design is approved.** Source of truth: `design/portfolio-demo.html` + PLAN.md §7 (photo story) + §9 (enhancements).
  Do not change palette, font, glass style, photo backdrop or hero concept without the owner's explicit approval.
- **Font is Archivo** (Mona Sans lacks Ə/ə). Keep the spec's `font-variation-settings` values.
- **No invented facts.** Every fact comes from the CVs or the owner's answers. Unknown → `[NEEDS INPUT]` + an entry in `CONTENT_REVIEW.md`.
- **Never publish**: phone number, the referee's name/phone/email. Never commit anything from `photo/` or `CV/` (gitignored originals; `photo/` originals contain GPS).
- **Images enter the repo only through `npm run photos`** (metadata stripped). `npm run check` must stay green.
- **Both locales always.** A new UI string goes into both `en` and `az` in `src/i18n/ui.ts`; a new content entry needs its twin. The build fails otherwise.
- **Azerbaijani**: reuse the AZ CV wording; anything self-translated is logged in `TRANSLATION_REVIEW.md`. Keep tech names in their original form. Never use `text-transform: uppercase` (breaks i/İ, ı/I casing).
- **Host-agnostic static output.** No host-specific config files until the owner sends deployment instructions.
- **Pinned versions** (`save-exact`). TypeScript stays on 6.x until `@astrojs/check` and `typescript-eslint` support 7.
- Ask before adding any dependency. No React/Vue/etc., no `<ClientRouter />` (breaks CSP).

## Conventions

- Content: `src/content/<collection>/{en,az}…`; schemas in `src/content.config.ts` (`import { z } from 'astro/zod'`).
  Do not set a frontmatter `slug` (it replaces the id and would collide across locales).
- Client code: one typed module per behaviour in `src/scripts/`, exported `init*()`; animate only `transform`, `opacity`, `clip-path`;
  passive scroll listeners, IntersectionObserver + rAF; respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- No inline `style=""` in markup and no `is:inline` scripts (CSP). The single exception is the pre-paint theme snippet, whose hash is computed in `astro.config.mjs`.
  Pass data to scripts via `<script type="application/json">`.
- `localStorage` only inside try/catch; the page must work without it.
- External links: `target="_blank" rel="noopener noreferrer"` + visually hidden "(opens in a new tab)" text in the page's language.
- Astro 7 gotcha: `compressHTML` defaults to `'jsx'`, which collapses whitespace between inline elements. Check spacing in rendered output.
- Glass budget: at most 4 `backdrop-filter` layers visible at once; every glass surface needs the solid fallbacks.
- Commits: small, conventional (`feat(hero): …`). Enhancements live on the `enhancements` branch until approved.

## Commands

`npm run dev` · `npm run check` (lint + typecheck + photo metadata) · `npm run build` · `npm run build:release`
(also fails on `[NEEDS INPUT]` and privacy hits) · `npm run preview` · `npm run test` · `npm run lighthouse` · `npm run photos` · `npm run og`

## Verification

Never report "done" without evidence: command output, screenshots (both locales, both themes), axe results,
Lighthouse numbers. Phase 5 runs against `astro build` + `astro preview`.
