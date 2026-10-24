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
| — | Light-theme photo visibility | **fixed** — matches dark except Work and hero (see below) |

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

## Photo visibility in the light theme (finding → fixed)

Measured with `scripts/photo-visibility.mjs` (mean luminance change the photo makes, 0–255; same number = same
visibility). Two fixes: the light photo opacity now equals dark (0.62), and option A (approved): in the light theme
"Read the case study" and "Winner" use the text colour, so the home-page strong scrim drops from 90 % to 70 %.
Case pages keep 90 % (their accent labels are prototype styles). Contrast after the change: 136/136 positions AA,
worst 4.51:1.

`/` after option A:

| | hero | work | about | experience | awards | contact |
|---|---|---|---|---|---|---|
| 1366 dark | 64.3 | 18.9 | 21.2 | 14.1 | 14.2 | 14.5 |
| 1366 light | 29.8 | 10.5 | 25.3 | 15.2 | 14.7 | 14.0 |
| 375 dark | 55.8 | 19.3 | 24.4 | 19.7 | 17.2 | 11.4 |
| 375 light | 20.1 | 13.7 | 25.6 | 19.1 | 17.4 | 15.1 |

(Before both fixes, light was work 8.8, experience 9.3, awards 11.4, contact 11.5 at 1366 px on `/az/`.)
About, Experience, Awards and Contact now match dark. Remaining gaps: **Work** (~11 vs ~19) — its muted grey
stack lines and summaries need the scrim; **hero** — a white wall over a light page changes few pixels by nature.
The contact value varies ±3 between runs because the page end clamps the scroll position.

## Not covered

- Safari / Firefox and a real phone (all runs: Chrome, emulated devices).
- Cross-document View Transitions only verified in Chrome (Safari 18.2 should support them; Firefox does not).
- A Render cold start was not observed (instances were awake).

## Phase 6 — live verification on https://ismayilovilkin.online (2026-10-24)

Server: `myserver` (Ubuntu 24.04.5, nginx 1.24 + brotli, certbot 2.9), release `20261024T162941Z`.
DNS: apex and www → 13.140.152.249 on Spaceship's nameservers and on 1.1.1.1 / 8.8.8.8 / 9.9.9.9; no AAAA.
13.140.152.249 is configured statically on the server's `eth0` (no DHCP lease) and is its public egress IP.

| Check | Result |
|---|---|
| http → https | `http://ismayilovilkin.online/` → 301 `https://ismayilovilkin.online/` |
| www → apex | `http://www…/az/?a=1` → 301 `https://ismayilovilkin.online/az/?a=1`; `https://www…/work/yolcu/` → 301 apex (path and query kept) |
| Trailing slash | `/work/milly` → 301 `/work/milly/` |
| Status codes | `/`, `/az/`, three case studies in each language → 200; `/nope/`, `/az/nope/`, `/work/paygenix/` → 404 |
| Localized 404 | `/nope/` "Page not found", `/az/nope/` "Səhifə tapılmadı" |
| Security headers | CSP (frame-ancestors, object-src, base-uri, form-action), nosniff, Referrer-Policy, Permissions-Policy, COOP, X-Frame-Options DENY; `Server: nginx` without version |
| Cache | HTML `public, max-age=0, must-revalidate`; `/_astro/*` `public, max-age=31536000, immutable`; `/og/*` 1 day |
| Compression | brotli on CSS/JS (`content-encoding: br`) |
| TLS | Let's Encrypt (YE2) for apex + www, valid to 2027-01-22, verify OK for both names; HTTP/2; TLS 1.1 refused |
| Renewal | `certbot.timer` active; `certbot renew --dry-run` → "all simulated renewals succeeded"; renewal reloads nginx |
| CSP / console | 10 pages × 2 themes, scrolled and palette opened: no console or CSP errors |
| Mobile Lighthouse (live, median of 3) | `/` 99 / 100 / 100 / 100, LCP 2.18 s, CLS 0.003, TBT 0 ms · `/az/` 99 / 100 / 100 / 100, LCP 2.07 s, CLS 0.001, TBT 0 ms · LCP element: hero portrait |
| Privacy (live crawl) | 18 text responses + 79 images: no phone number, no referee data, no image metadata |
| Rollback test | **pending** — needs a second production deploy (awaiting approval) |
| HSTS | **pending** — enabled after the rollback test |

Incidents during deployment (all resolved, nothing live was affected):
- macOS `openrsync` transferred at ~1 KB/s → `deploy.sh` now requires GNU rsync (`brew install rsync`).
- From the owner's home network and a phone hotspot, bulk SSH transfers to the server stalled (TCP data stalled
  both ways while ping and small requests worked; the server's own internet was fast). Over Cloudflare WARP the
  same 200 KB took 1.7 s and the deploy succeeded. Route/provider issue between the client networks and Contabo.
- `http2 on;` is not supported by nginx 1.24 → `listen … ssl http2`; `nginx -t` caught it and the previous
  config was restored automatically.
- One certbot dry run hung on an outbound connection and was stopped; the rerun succeeded.
