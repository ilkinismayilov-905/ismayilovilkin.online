# Verification — Phase 5 (2026-10-23)

All checks ran against the **production build**: `astro build` + `astro preview` on port 4321 (confirmed: no dev
client in the served HTML). Browser: installed Google Chrome via Playwright 1.64.1.
Reproduce: `npm run check`, `npm run build`, `npm run preview`, then `npm test`, `npm run lighthouse`,
`npm run links`, `node scripts/contrast.mjs`, `node scripts/photo-visibility.mjs`, `node scripts/check-privacy.mjs`.
Raw outputs are in `reports/` (gitignored).

## Summary

| # | Check | Result |
|---|---|---|
| 1 | build, lint, typecheck, i18n completeness | **pass** — 0 errors, 0 warnings; locale parity assertion passes; `build:release` fails as intended while `[NEEDS INPUT]` remains |
| 2 | Visual parity with the prototype | **pass** — only approved differences (list below) |
| 3 | Screenshot matrix 12 pages × 375/768/1280/1920 × 2 themes (96) | **pass** — no horizontal overflow, no clipped text, AZ wraps cleanly; all text in Archivo |
| 4 | axe + keyboard | **pass** — 0 serious/critical on all 12 pages × 2 themes + open dialog + open palette; EN and AZ keyboard walkthroughs |
| 5 | Mobile Lighthouse | **pass** — Perf 99, A11y 100, BP 100, SEO 100 on all four pages |
| 6 | Reduced motion / reduced transparency / no JS / slow network | **pass** |
| 7 | Links, 404s, hreflang | **pass** — 95 internal + 5 external URLs; 404 in both languages |
| 8 | Privacy | **pass** — no phone, no referee data, no metadata in 105 images; originals never in git |
| — | WCAG AA text contrast on photos | **pass** — 136 positions, worst 4.51:1 |
| — | Light-theme photo visibility | **finding** — see below; one decision open |

Automated suite: **160 Playwright tests pass** (`tests/`).

## 1. Build, lint, typecheck, i18n

- `npm run check`: ESLint 0 problems, `text-transform: uppercase` check clean, `astro check` 0 errors / 0 warnings
  (61 files incl. tests), photo metadata clean.
- `npm run build`: 12 pages. The content parity assertion (every entry, field and list length in both locales)
  runs during the build and passes. Missing UI keys are a type error.
- `RELEASE=1 astro build` fails on the 8 project files that still contain `[NEEDS INPUT]` — intended.

## 2. Prototype parity (1366 and 390 px, both themes)

Screens: `reports/parity-fold-1366.png`, `reports/parity-fold-390.png`, `reports/parity-full-*`.
Layout, palette, type hierarchy, glass surfaces, hero composition and section order match.
Differences, all approved:

| Difference | Approved when |
|---|---|
| Font Archivo instead of Mona Sans (Mona lacks Ə/ə) | Phase 2 font choice |
| Demo strip, "Add your photo", placeholder links removed | brief |
| Real portrait; tag below the face on mobile | Phase 0 |
| Mobile portrait capped at 38svh | enhancement 1 |
| Light-theme arch edge | enhancement 2 |
| "Writing" → "Hackathons & awards" | Phase 0 |
| Skills list in About | enhancement 5 |
| Full-page photo background, captions, About without photo frame | photo-background change |
| Language switch "AZ/EN" in the header | brief (bilingual) |

No unintended differences found.

## 3. Screenshot matrix, overflow, glyphs

`tests/layout.spec.ts`: 12 pages (EN + AZ home, 4 case studies × 2, 2 × 404) at 375, 768, 1280, 1920 px in dark and
light. Each test fails on horizontal page scroll, any element outside the viewport, or clipped `nowrap` text.
96 full-page screenshots in `reports/matrix/`; reviewed as contact sheets — no overflow, no broken AZ wrapping.
Glyphs: Chrome's own font report (`CSS.getPlatformFontsForNode`) shows every text node rendered in Archivo;
the only system-font glyph is "⌘" in the ⌘K hint (absent from Archivo and Mona Sans, as planned).
Phones were also checked with Playwright device emulation (iPhone 13 at 375×812 and 390×844, touch, DPR 3),
which replaces the 390 px check that could not be done in Phase 0.

## 4. Accessibility

- **axe-core 4.14** with WCAG 2.0/2.1/2.2 A+AA and best-practice rules: 0 serious/critical on all 12 pages in both
  themes, and with the case dialog and the command palette open.
- **Keyboard walkthrough (EN)**: skip link → `#main`; tab order brand → 5 sections → Search → Theme → language;
  filters with Tab/Space and live count; dialog opens with Enter, focus moves to Close, Tab stays in the dialog,
  Esc closes and focus returns to the project link; palette with Ctrl/⌘K, arrows, Enter focuses the target heading;
  language switch with Enter. Visible 2px focus ring on every one of the 24 focusable controls.
- **Keyboard walkthrough (AZ)**: same flow with Azerbaijani labels; palette search "təcrübə" and "ingilis".
- Fixed during this phase:
  - AZ theme button: accessible name did not contain the visible label "Tema" (WCAG 2.5.3) → "Tema: açıq rejimə keç".
  - AZ palette search: "ingilis" did not find "İngilis dilinə keç" (default lowercasing turns İ into i + dot) →
    lowercase with the page language.

## 5. Mobile Lighthouse 13.5 (default mobile profile, median of 3)

| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT | LCP element |
|---|---|---|---|---|---|---|---|---|
| `/` | 99 | 100 | 100 | 100 | 2.18 s | 0.001 | 0 ms | hero portrait |
| `/az/` | 99 | 100 | 100 | 100 | 2.18 s | 0.001 | 0 ms | hero portrait |
| `/work/milly/` | 99 | 100 | 100 | 100 | 2.03 s | 0.000 | 0 ms | lede paragraph (no portrait on case pages) |
| `/az/work/milly/` | 99 | 100 | 100 | 100 | 2.03 s | 0.000 | 0 ms | lede paragraph |

Targets (Perf ≥ 90, A11y/BP/SEO ≥ 95, LCP < 2.5 s, CLS < 0.1) all met.
**INP** (not measurable in a Lighthouse page-load run): measured with real taps on a Pixel 7 profile at 4× CPU
throttling — filters, dialog open/close, theme ×2, palette, copy email. Worst interaction: 80 ms (EN), 96 ms (AZ).
Target < 200 ms met.
**Scroll** at 4× CPU (Pixel 7) and on desktop: median and p95 frame 16.7 ms, no frame > 50 ms. Caveat: headless
Chrome may under-report GPU cost of `backdrop-filter`; a check on a real phone is still worthwhile.
CLS across a full scroll-through (photo swaps included): ≤ 0.0055 in both locales at 1366 and 390 px.
**Image weight**: home 55 KB at load / 143 KB after a full scroll (1366 px), 104 / 253 KB (375 px);
case pages 24–88 KB.

## 6. Modes

| Mode | What changes (tested) |
|---|---|
| Reduced motion | no name load animation, no photo scale settle, instant photo swaps, no smooth scroll, no View Transitions, no portrait parallax |
| Reduced transparency | solid page background, no photo; header, cards and dialogs are solid `--bg` with no blur |
| JavaScript off | all content readable; case studies inline; one static photo under the strong scrim; captions hidden; palette, theme, filters hidden; language link works |
| Slow network (400 ms, 50 KB/s) | the current photo stays until the next one has decoded — never a blank or half-loaded layer |

Note: the brief asked for a blurred placeholder while a story photo loads. With the full-page background the
placeholder is the previous photo, which stays until the new one is decoded (verified).

## 7. Links, 404, hreflang

- `npm run links`: 95 internal URLs (pages, anchors' pages, images, srcsets, fonts, OG images; production-origin
  URLs mapped to `dist/`) and 5 external URLs, all OK. Render links checked with a 90 s timeout and one retry:
  Yolçu 200 in 285 ms, AbadLand 200 in 216 ms — both were awake, so no cold start was observed this time.
  LinkedIn answers 999 to automated requests; counted as reachable.
- Every external link: `target="_blank"`, `rel="noopener noreferrer"`, localized hidden hint.
- 404: missing paths return status 404; `/404.html` and `/az/404.html` in their language, `noindex`.
  (`astro preview` serves the root 404 for every path; per-language 404 routing is a host requirement, PLAN §12.)
- hreflang: every page has `en`, `az`, `x-default` and a canonical on `https://ismayilovilkin.online`, and its twin
  exists. Sitemaps list all 10 content pages with alternates and no 404s. JSON-LD `Person` on both home pages.

## 8. Privacy

- `check-privacy` on `dist/`: no phone pattern, none of the 6 deny-listed values (phone variants, referee name in
  both spellings, referee email). Positive control: a planted phone number is caught.
- Only e-mail address in `dist/`: `ilkinismayilov.dev@gmail.com` (approved).
- No EXIF/GPS/XMP/IPTC/ICC in 95 built images and 10 OG cards.
- `photo/` and `CV/` originals: not tracked, not in git history.
- CV download stays hidden (both PDFs contain the phone number).

## Photo visibility in the light theme (finding)

Measured with `scripts/photo-visibility.mjs` on `/az/` (mean luminance change the photo makes, 0–255;
same number = same visibility):

| | hero | work | about | experience | awards | contact |
|---|---|---|---|---|---|---|
| 1366 dark | 64.9 | 19.0 | 22.3 | 12.6 | 14.8 | 14.1 |
| 1366 light | 30.4 | 8.8 | 26.2 | 9.3 | 11.4 | 11.5 |
| 375 dark | 57.5 | 18.0 | 24.9 | 19.5 | 18.4 | 13.3 |
| 375 light | 27.4 | 11.2 | 27.4 | 16.6 | 16.1 | 10.3 |

- Fixed: the light theme used a lower photo opacity (0.50) than dark (0.62). Now both use 0.62; About matches.
- Hero: a white wall over a light page changes few pixels by nature; the portrait itself is unaffected.
- **Open**: Work, Experience, Awards and Contact stay about half as visible in light. Cause: the light accent
  `#A84F17` reaches only 4.68:1 on the plain light background, so any photo detail behind accent text
  ("Read the case study", "Winner", case-study labels) drops it below AA; the strong scrim is held at 90 % for that.
  Measured option: show those two home-page labels in the text colour in the light theme only (they are additions,
  not prototype styles) and lower the light strong scrim to 70 % → experience 13.5, awards 15.3, contact 13.6
  (≈ dark), work 10.6, AA still holds (worst 4.62:1). Not applied — needs approval.

## Not covered

- Safari / Firefox and a real phone (all runs: Chrome, emulated devices).
- Cross-document View Transitions only verified in Chrome (Safari 18.2 should support them; Firefox does not).
- A Render cold start was not observed (instances were awake).
