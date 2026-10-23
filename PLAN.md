# PLAN — ismayilovilkin.online

Bilingual (EN/AZ) personal portfolio for Ilkin Ismayilov / İlkin İsmayılov.
Approved baseline: `design/portfolio-demo.html` + the scroll-driven photo story + 5 approved enhancements.
Status: **Phase 3 — awaiting approval.** Nothing below is built yet.

Every version and API below was checked on 2026-10-23 against npm and the official
docs (docs.astro.build, MDN compat data, the published astro@7.4.2 package source).
Where something is inferred from source and not yet proven by a build, it says **verify**.

---

## 1. Decisions already made (from Phases 0–2)

| Topic | Decision |
|---|---|
| Name | EN `Ilkin Ismayilov`, AZ `İlkin İsmayılov` |
| Title | `Java Backend Developer` in both languages |
| Default language | English at `/`, Azerbaijani at `/az/`, `x-default` → `/` |
| Canonical origin | `https://ismayilovilkin.online` |
| Hosting | Undecided. Build is plain static output, host-agnostic. No host config files. |
| Font | **Archivo** (replaces Mona Sans, which lacks Ə/ə). Everything else in the design is unchanged. |
| Analytics | None |
| Phone, referee | Never published, anywhere |
| Published personal data | Email `ilkinismayilov.dev@gmail.com`, Baku, GPA 95/100, IELTS 7.0, GitHub profile, LinkedIn |
| Photos | 7545 hero · 0426 About 1 · 9431 About 2 · 0208 About 3 · 0257 contact. 0182, 5925, 7637 excluded. |
| Enhancements | All 5 approved with conditions → separate `enhancements` branch, not merged without approval |

---

## 2. Stack (exact pins)

Runtime: Node `>=22.23.4` (Astro's engine floor). Local dev machine has Node 26.8.2 / npm 11.19.1.
`package.json` gets `"engines": { "node": ">=22.23.4" }`; `.npmrc` gets `save-exact=true`; `package-lock.json` is committed.

| Package | Version | Why |
|---|---|---|
| `astro` | 7.4.2 | Framework (static output, i18n routing, content collections, assets, Fonts API, CSP) |
| `typescript` | **6.0.3** | Not 7.x: TS 7 is outside the peer ranges of `@astrojs/check` and `typescript-eslint` |
| `@astrojs/check` | 0.9.12 | `astro check` = typecheck incl. `<script>` blocks |
| `sharp` | 0.35.5 | Image service (Astro expects `^0.35.4`) + photo sanitising script |
| `eslint` | 10.13.0 | Lint |
| `typescript-eslint` | 8.72.0 | TS rules (peer TS `<6.1.0` → 6.0.3 OK) |
| `eslint-plugin-astro` | 3.2.1 | `.astro` rules |
| `astro-eslint-parser` | 3.2.0 | Parser for the above |
| `@playwright/test` | 1.64.1 | Screenshots, e2e, device emulation, OG image rendering |
| `@axe-core/playwright` | 4.14.0 | Accessibility checks |
| `lighthouse` | 13.5.0 | Mobile Lighthouse reports |

Deliberately **not** added: React or any UI runtime, `@astrojs/sitemap` (it can't emit `x-default`;
a 30-line endpoint does the job), Prettier, a YAML library, `<ClientRouter />` (incompatible with Astro's CSP).

TypeScript: `tsconfig.json` extends `astro/tsconfigs/strictest`.

---

## 3. Project structure

```
src/
  assets/
    fonts/Archivo-wdth-wght.woff2          # subset, wdth 75–125, wght 200–900
    photos/*.jpg                           # sanitised copies (no metadata), committed
    photos/backdrop/*.webp                 # tiny pre-blurred backdrop variants (~2–4 KB each)
  content/
    site/en.yaml, site/az.yaml             # meta, hero intro, status board, tag, easter egg, contact
    about/en.md, about/az.md               # 3 chapters (photo, alt, caption, text), principles, toolbox
    experience/en.yaml, experience/az.yaml # timeline (work + education)
    awards/en.yaml, awards/az.yaml         # Hackathons & awards list
    projects/en/<slug>.md, projects/az/<slug>.md
  content.config.ts                        # shared zod schemas (import { z } from 'astro/zod')
  i18n/ui.ts                               # typed UI dictionary
  i18n/utils.ts                            # t(), locale helpers, Intl formatters, parity assertion
  layouts/Base.astro                       # <html lang>, meta, hreflang, OG, JSON-LD, fonts, backdrop
  components/                              # Header, Hero, StatusBoard, WorkList, CaseStudy, About, Story,
                                           # Timeline, Awards, Contact, Palette, Toast, LangSwitch, Backdrop
  pages/
    index.astro, 404.astro, work/[slug].astro
    az/index.astro, az/404.astro, az/work/[slug].astro
    sitemap.xml.ts, sitemap-en.xml.ts, sitemap-az.xml.ts, robots.txt.ts
  scripts/                                 # framework-free, typed modules (see §8)
  styles/tokens.css, base.css, components.css
public/
  cv/ilkin-ismayilov-cv-en.pdf, cv/ilkin-ismayilov-cv-az.pdf   # sanitised copies only
  og/*.png                                 # generated, committed
  favicon.svg
scripts/
  sanitize-photos.mjs                      # originals in photo/ → src/assets/photos (strip, resize, crop)
  photo-manifest.json                      # which original → which output, crop box
  check-photos.mjs                         # fails if any committed image has EXIF/XMP/IPTC/ICC/GPS
  check-privacy.mjs                        # greps dist/ for phone patterns + local deny-list
  render-og.mjs                            # Playwright renders OG cards per locale/page
tests/                                     # Playwright specs (visual, a11y, keyboard, story, no-JS)
```

URL map (`trailingSlash: 'always'`, `build.format: 'directory'`):

| EN | AZ |
|---|---|
| `/` | `/az/` |
| `/work/milly/` | `/az/work/milly/` |
| `/work/yolcu/` | `/az/work/yolcu/` |
| `/work/abadland-qarabag/` | `/az/work/abadland-qarabag/` |
| `/work/paygenix/` | `/az/work/paygenix/` |
| `/404.html` | `/az/404.html` |
| `/cv/ilkin-ismayilov-cv-en.pdf` | `/cv/ilkin-ismayilov-cv-az.pdf` |

Section anchors are identical in both locales (`#work`, `#about`, `#experience`, `#awards`, `#contact`),
so the language switcher can keep the visitor on the same section.

---

## 4. i18n

- Config: `i18n: { locales: ['en', 'az'], defaultLocale: 'en' }` (`prefixDefaultLocale` defaults to `false`).
  No `fallback` (its default type is `redirect`). No redirects of any kind based on IP or browser language.
- `Astro.currentLocale` drives `<html lang>`; links built with `getRelativeLocaleUrl()` from `astro:i18n`.
- **UI strings** in `src/i18n/ui.ts`: `const en = {...} as const` and `const az: Record<keyof typeof en, string>`.
  A missing AZ key is a type error in `astro check`. Covers nav, buttons, filters, counts (with plural rules),
  palette commands and groups, toasts, aria-labels, alt texts not tied to content, meta titles/descriptions,
  404 copy, the Render note.
- **Content parity check** (build-time, no dependency): `assertLocaleParity()` runs in the page frontmatter during
  `astro build`. It loads every collection and throws if an entry, a chapter, a list item count or a required field
  exists in one locale but not the other. The build fails.
- **Language switcher**: header link + palette command. Points to the same page in the other locale; a small
  script appends the current section hash. Labels are the language's own name (`English`, `Azərbaycanca`),
  with `lang` and `hreflang` attributes.
- **Suggestion banner** (dismissible, glass, `role="region"`): shown only if the page locale is not in
  `navigator.languages` but the other locale is. Dismissal stored in `localStorage` inside try/catch.
- **SEO**: per-locale `<title>`/description, `<link rel="alternate" hreflang="en|az|x-default">`,
  canonical URL, `og:locale` (`en_US` / `az_AZ`) + `og:locale:alternate`, per-locale OG image.
- **Dates and numbers** via `Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })` and
  `Intl.NumberFormat`. Note: Azerbaijani month names come out lowercase from ICU (`dekabr 2025`);
  how to case them is logged in `TRANSLATION_REVIEW.md`.
- **Azerbaijani quality**: wording from the AZ CV wherever it exists. Every passage I translate goes to
  `TRANSLATION_REVIEW.md`. No `text-transform: uppercase` anywhere (CSS lint rule + grep in CI script).
  Overflow checks for buttons, headings, status board and hero in both locales are part of Phase 5.

---

## 5. Content model

All facts come from the CVs or from the owner's answers. Anything unsupported is written as
`[NEEDS INPUT]` and listed in `CONTENT_REVIEW.md`. A production guard fails `npm run build:release`
if any `[NEEDS INPUT]` remains; plain `npm run build` only warns, so drafts can be previewed.

**Projects** (`projects/{en,az}/<slug>.md`), in this order:
Milly, Yolçu, AbadLand Qarabağ, Space Shooter, ManageableUni, HR Management System, Paygenix (last).

```yaml
title: Milly
order: 1
year: 2026
category: backend            # backend | hackathon | frontend  (filters: All / Backend / Hackathons / Frontend)
stack: [Java 21, Spring Boot 4, PostgreSQL, Flyway, WebSocket (STOMP), OAuth2]
summary: …                   # one line for the list
motif: lines                 # hover-preview SVG motif
caseStudy: true              # Milly, Yolçu, AbadLand, Paygenix only
facts:                       # only CV facts or owner answers; otherwise [NEEDS INPUT]
  role: …
  team: …
  award: …
live: { url: https://milly-front.vercel.app, coldStart: false }
```
Body (case studies only): `## Problem`, `## What I did`, `## The decision that mattered`, `## Result`.
Live links: Milly, Yolçu (`https://yolcu.onrender.com/map/`), AbadLand (`https://abadlandkarabakh.onrender.com`).
No links for Paygenix, Space Shooter, ManageableUni, HR Management System, Renter.az.
No individual GitHub repositories, only the profile `github.com/ilkinismayilov-905`.
External links: `target="_blank" rel="noopener noreferrer"` plus a visually hidden "(opens in a new tab)".
**Render note** (`coldStart: true`, Yolçu and AbadLand only): EN "may take a moment to load",
AZ "açılması bir az vaxt ala bilər". Basis: Render free web services spin down after 15 minutes
without traffic and take about a minute to start (render.com/docs/free).

**About** (`about/{en,az}.md` frontmatter): three chapters `{ photo, alt, caption, text }`, the "How I work"
principles, and the Toolbox (enhancement 5: only skills named in the CVs, four groups, no levels, no logos).
All drafted from the CVs in your voice and flagged in `CONTENT_REVIEW.md`.

**Experience** (reverse chronological): VersePay (Dec 2025 – now), Renter.az (now, no start date,
description `[NEEDS INPUT]`), CodersAzerbaijan (Sep 2025 – Jun 2026), Ironhack IT SkillSprint
(Jan – Jul 2026), UNEC BSc (Sep 2023 – Jun 2027).

**Hackathons & awards** (replaces Writing, same list style; right column shows the result):
TransportTech 2026 Winner (İRİA & AYNA, Yolçu → case study), Karabakh Hackathon 2026 Winner
(AbadLand → case study), PashaHackathon 6.0 Finalist, PashaHackathon 5.0 Finalist,
Holberton Micro SaaS Finalist, volunteering (EN CV details, translated to AZ).

**Site** (`site/{en,az}.yaml`): hero intro (leads with the 6-person FinTech team + 1000 → 14 ms + ~95% coverage),
status board — Now `Java Backend Team Lead at VersePay`, Focus `Payments, Spring Boot, performance and testing`,
Next drafted from the AZ CV goal (first corporate role in banking/FinTech backend) **flagged for review** —
hero tag `1000 → 14 ms` / `average API response`, easter egg (EN "Tea first, then the next endpoint",
AZ "Əvvəlcə çay, sonra növbəti endpoint"), contact links (email, GitHub, LinkedIn, CV download).

---

## 6. Fonts

- Source: `google/fonts` → `ofl/archivo/Archivo[wdth,wght].ttf` (OFL-1.1, file commit `6c70c82`).
- Build: `fonttools varLib.instancer` limits axes to wdth 75–125, wght 200–900 (the design's range),
  then `pyftsubset` to Latin + Latin Extended (incl. U+018F/U+0259 Ə ə, U+2190–2193 arrows) → **WOFF2, 144 KB**.
  A latin / latin-ext split was measured (90 + 72 KB) and rejected: EN pages also show `Qarabağ`, so both halves
  would load anyway. The subsetting is a one-off dev step; the command lives in `README.md`. The `.woff2` is committed.
- Glyph check on the subset file: all of `Ə ə I ı İ i Ğ ğ Ş ş Ç ç Ö ö Ü ü` and `→` present. `⌘` is not
  (also missing from Mona Sans): the `⌘K` hint renders in the system font, same as the prototype.
- Served with Astro's **stable Fonts API** (`fonts` config, `fontProviders.local()`), one variant
  `weight: '200 900'`, `stretch: '75% 125%'`, `display: 'swap'`, `fallbacks: ['Arial', 'sans-serif']`,
  `optimizedFallbacks: true` (metric-matched fallback generated from font metrics). `<Font preload />` in the head.
  **Verify** in the first build that the `wdth` axis works through `font-variation-settings` as in the prototype.
- Tokens: `--display` and `--body` become `"Archivo", <generated fallback>, sans-serif`. All
  `font-variation-settings` values from the spec stay as they are (hero 112/780, h2 115/750, titles 100/600 → 125/760).

---

## 7. Photos and the scroll-driven story

**Repository rule:** originals in `photo/` never enter git (gitignored). Only sanitised copies are committed.

`npm run photos` (`scripts/sanitize-photos.mjs`, macOS for HEIC):
1. Reads `scripts/photo-manifest.json` (original file → output name → optional crop box in fractions).
2. HEIC → temporary high-quality JPEG with macOS `sips` in the OS temp dir (sharp's prebuilt binaries
   have no HEVC decoder). The temp file is deleted afterwards.
3. sharp: apply EXIF orientation, crop, resize to max 2400 px on the long edge, convert to sRGB,
   write JPEG q90 with **no metadata** (sharp's default strips EXIF/XMP/IPTC/ICC/GPS).
4. Writes `src/assets/photos/<name>.jpg` and a pre-blurred backdrop `photos/backdrop/<name>.webp`
   (64 px wide, sharp `blur`, ~2–4 KB). No runtime blur of large images.
5. `scripts/check-photos.mjs` re-reads every committed image and **fails** if any metadata block exists.
   It runs in `npm run check` and again on `dist/` in Phase 5 (exiftool-style read via sharp).

Crops from Phase 0 go into the manifest (hero zoomed so the face sits in the upper third).
**Swapping a photo** = put the original in `photo/`, edit one manifest line, run `npm run photos`,
change the path/alt/caption in the content file. No component code changes.

Rendering:
- **Hero**: `<Picture formats={['avif','webp']} priority>` → `loading="eager"`, `fetchpriority="high"`;
  `widths [360, 480, 640, 800, 960, 1200]`, `sizes="(max-width: 880px) min(78vw, 22rem), 30rem"`,
  explicit width/height. Must remain the LCP element.
- **Story and contact photos**: same `<Picture>` setup, `loading="lazy"`. When chapter *n* becomes active,
  the script sets `loading="eager"` on chapter *n+1*'s image so it is fetched before it is needed.
- **Placeholder**: each frame stacks the tiny blurred `<img>` under the full image (no inline `style=""`, CSP-safe),
  so a slow network shows the blurred version until the full image arrives.
- **One colour treatment**: the baseline soft-light gradient overlay on every frame; no per-photo grading,
  no saturation change beyond the prototype's `saturate(.92) contrast(1.04)`.

Interactions (baseline mechanism: IntersectionObserver + `requestAnimationFrame`, passive listeners;
only `transform`, `opacity`, `clip-path` animate; no scroll snapping, hijacking or speed changes):
- **A + B (revised 2026-10-23): full-page photo background.** Replaces the tiny blurred backdrop and the
  About scrollytelling frame (rejected). About returns to the prototype layout: text + "How I work" glass card.
  - **Layer**: one `position: fixed` full-viewport layer behind all content (no `background-attachment: fixed`),
    two stacked `<picture>` layers, `object-fit: cover`, `alt=""` + `aria-hidden="true"`.
  - **Sources** (built by `npm run photos`): per photo a *wide* variant (landscape canvas, the photo on the right,
    a soft extension of it on the left, so the face sits away from the text column on landscape screens) and a
    *tall* variant (portrait, phones). Both get the shared muting treatment and a light pre-baked blur
    (no runtime blur on a full-screen layer). Served as AVIF/WebP `srcset` sized to the viewport.
  - **Readability**: pine-tinted gradient scrim, strongest behind the text column; photo opacity per theme;
    glass surfaces frost it. WCAG AA verified on screenshots by sampling the pixels behind every text run.
  - **Scroll behaviour**: when a section or an About chapter is nearest the viewport centre, the background
    crossfades (~900 ms) to its photo after `img.decode()`; a slow scale settle 1.05 → 1 follows the scroll
    through that part. No scroll-jacking. Only the current and the next photo are loaded.
  - **Mapping**: hero + work 7545; About chapters 0426, 9431, 0208; experience 0426; hackathons & awards 0257;
    contact 0257. Case-study pages use the project's own event photo (`background` in the project file):
    Milly 9431, Yolçu 0257, AbadLand 0208, Paygenix 7545.
  - **Two scrim levels**: soft where text sits left (hero, About chapters, case pages), strong where text runs the
    full width (work, experience, awards, contact; also the no-JS default). Header, hero tag and captions use the
    sturdier glass fill over photos. Light theme: photo opacity as dark (0.62); strong scrim 70 % (case pages 90 %);
    "Read the case study" and "Winner" use the text colour, because the light accent has little headroom over photos. Verified with `node scripts/contrast.mjs` (WCAG AA on rendered pixels).
  - **Framing**: `object-position` per photo, separately for desktop and mobile, stored in content.
  - **Caption**: small localized glass caption per part, placed in the page flow at the end of the part on the
    text side, so it never covers text or the face (a fixed corner caption would overlap scrolling text).
  - **Rollout**: approved on the English home page (2026-10-23), now on every page. The About photo frame and the
    tiny backdrops are removed.
- **C. Hero continuity**: portrait moves up to 40 px slower than the page while leaving the hero; tint deepens slightly.
- CSS scroll-driven animations (`animation-timeline: view()`) only as an `@supports` enhancement for C,
  after checking MDN compat data at implementation time. Everything works without them.
- **Fallbacks**: reduced motion → instant swaps, no scale settle, no parallax; reduced transparency → solid
  background, no photo; no JS → the first background photo stays, static. Photo changes are never announced
  via live regions.

---

## 8. Client-side modules (`src/scripts/`, typed, no framework)

Ported from the prototype's single IIFE into small modules with one `init*()` each, loaded from one
processed `<script>` in `Base.astro` (bundled ES module, deduped, type-checked by `astro check`):

`theme` · `hero-name` (load sequence + pointer effect, fine pointer only) · `hero-glow-parallax` ·
`status-light` (5-click easter egg) · `filters` (live count via `aria-live`) · `case-dialog` (native `<dialog>`,
focus returns to the trigger) · `preview` (pointer-following SVG motif) · `timeline` (scroll progress + reached)
· `nav-current` · `copy-email` · `toast` · `palette` (⌘K / Ctrl+K and `/`; navigation, projects, filters,
copy email, theme, language, CV download) · `backdrop` · `story` · `lang-switch` · `lang-suggest`.

Data that scripts need (UI strings for toasts/palette, project list) is passed in a
`<script type="application/json">` block (data, not executable → no CSP hash needed).

**Theme**: follows `prefers-color-scheme`; manual toggle stored in `localStorage` (try/catch). The tiny
"apply stored theme before paint" snippet is the only `is:inline` script; its SHA-256 is computed in
`astro.config.mjs` from the same source file and added to the CSP, so there is no `'unsafe-inline'`.

**Removed from the prototype**: demo strip, "Add your photo" picker and its palette command,
in-memory theme, placeholder links and their toast.

---

## 9. The 5 approved enhancements (`enhancements` branch, after the baseline is done)

| # | Change | Conditions from you |
|---|---|---|
| 1 | Mobile hero: portrait capped (~44svh) so name + role intro sit on the first screen | Measure the fold with the real intro in **both** languages at 375×812 and 390×844 |
| 2 | Light theme: 1 px inner edge + light pine wash so the arch stays visible | As proposed |
| 3 | Rich case-study pages: narrative + sticky glass facts card, motif header, prev/next | Facts only from CVs/answers, `[NEEDS INPUT]` otherwise; Render note only on Yolçu/AbadLand |
| 4 | View Transitions: title morphs from list into dialog (same-document API) and into the standalone page (`@view-transition`) | Unique `view-transition-name` per project; dialog focus handling unchanged; off under reduced motion |
| 5 | Toolbox in About | Only CV skills, both languages, no levels, no logos |

Support (MDN compat data): `document.startViewTransition` Chrome 111, Safari 18, Firefox 144;
`@view-transition` Chrome 126, Safari 18.2, Firefox not yet. Unsupported browsers keep the normal behaviour.
Before/after screenshots for each; the branch is not merged into `main` until you approve.

---

## 10. Accessibility

Landmarks (`header`, `nav`, `main`, `footer`), one `h1`, ordered `h2/h3`; skip link; everything
keyboard-operable with the prototype's visible focus ring; native `<dialog>` for case study and palette
(focus returns to trigger); palette is a combobox + listbox with `aria-activedescendant`; live regions only
for the filter count and toasts; status light is a real button with a label; story dots are labelled buttons;
`prefers-reduced-motion` and `prefers-reduced-transparency` honoured; all core content readable without JS
(case studies render inline, filters/palette/theme controls hidden). Targets: axe — zero serious/critical.

---

## 11. Performance budget

| Item | Budget |
|---|---|
| LCP (mobile, Lighthouse) | < 2.5 s, hero image is the LCP element |
| CLS | < 0.1 (explicit image dimensions, metric-matched font fallback, no layout shift from swaps) |
| INP | < 200 ms |
| JS | ≤ 25 KB gzip total, one module, no framework |
| Font | 1 file, 144 KB, preloaded |
| Images | Reported per page in Phase 5; backdrops ~2–4 KB each |
| Glass | ≤ 4 blurred layers visible at once (header + board + tag + one more). Blur 18 px (dialog 28 px); 12 px on coarse pointers. Throttled 4× CPU mobile scroll test; reduce radius/layers if frames drop. |

---

## 12. SEO, sharing, security (host-agnostic)

- `site: 'https://ismayilovilkin.online'`; canonical per page; custom `sitemap.xml` (index) →
  `sitemap-en.xml` + `sitemap-az.xml` with `xhtml:link` alternates incl. `x-default`; `robots.txt` pointing to it;
  404s excluded.
- JSON-LD `Person`: localized name and description, `jobTitle`, `url`, `email`, `sameAs` (GitHub, LinkedIn),
  `address.addressLocality` Baku, `alumniOf` UNEC, `knowsLanguage`.
- OG images: `scripts/render-og.mjs` renders a 1200×630 card in the site's design per locale (home + each
  case study) with Playwright, output committed to `public/og/`. Chromium PNGs carry no EXIF.
- **CSP**: Astro `security.csp` (stable) emits a `<meta>` CSP with hashes for every bundled/inlined script and style,
  plus the theme snippet hash. To keep scripts external, `vite.build.assetsInlineLimit` is set so JS is never
  inlined (**verify** in build). `default-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none';
  base-uri 'self'; form-action 'none'`.
- No secrets in client code. `.env.example` only if a variable is ever needed (none planned).

**Requirements for whichever host you choose later** (to configure in Phase 6):

| Requirement | Value |
|---|---|
| Redirects | `http://` → `https://` (301); `www.ismayilovilkin.online` → `https://ismayilovilkin.online` (301, keep path + query); paths without trailing slash → with slash (301) |
| 404 | Serve `/az/404.html` for missing `/az/*`, `/404.html` otherwise, with status 404 |
| Headers (all paths) | `Content-Security-Policy` (same as meta + `frame-ancestors 'none'`), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY` |
| Cache | `/_astro/*` (hashed JS, CSS, fonts, images): `public, max-age=31536000, immutable`. HTML, sitemap, robots: `public, max-age=0, must-revalidate`. `/og/*`, `/cv/*`, `favicon.svg`: `public, max-age=86400` |
| Preview/staging hosts | `X-Robots-Tag: noindex` on any non-canonical hostname |

---

## 13. CV download

Clean copies in both languages without the phone number and the referee block.
The originals stay in `CV/` (gitignored). **Open question in the checkpoint**: the PDFs still say
"IRAS" and (EN) "Prize Winner", which the site corrects. Either you export corrected, clean PDFs from your
source document, or I redact the originals (true text removal, then a text-extraction check that the phone
and referee are gone) and the typos stay in the PDFs.

---

## 14. Scripts and checks

| Command | Does |
|---|---|
| `npm run dev` | `astro dev` |
| `npm run lint` | `eslint .` + a check that no CSS uses `text-transform: uppercase` |
| `npm run typecheck` | `astro check` |
| `npm run check` | lint + typecheck + `check-photos` |
| `npm run build` | `astro build` (includes the locale parity assertion; fails on mismatch) |
| `npm run build:release` | build + fails on any `[NEEDS INPUT]` + `check-privacy` on `dist/` |
| `npm run preview` | `astro preview` (Phase 5 runs against this) |
| `npm run test` | Playwright: visual, a11y (axe), keyboard, story sequence, no-JS, reduced motion/transparency |
| `npm run lighthouse` | Mobile Lighthouse for home + one case study per locale |
| `npm run photos` / `npm run og` | Regenerate sanitised photos / OG images |

`check-privacy.mjs`: generic phone-number regexes (committed) + an optional local deny-list file
`.privacy-denylist` (gitignored, so the private values themselves never enter git).

---

## 15. Phase 4 order (small conventional commits on `main`)

1. `chore`: scaffold Astro, pins, tsconfig strictest, eslint, scripts, `.gitignore`
2. `feat(tokens)`: tokens, base styles, Archivo via Fonts API, glass + fallbacks
3. `feat(layout)`: Base layout, header, theme, backdrop, skip link
4. `feat(i18n)`: routing, `ui.ts`, utils, parity assertion, switcher, suggestion banner
5. `feat(content)`: schemas + EN/AZ content + `CONTENT_REVIEW.md` + `TRANSLATION_REVIEW.md`
6. `feat(photos)`: sanitise pipeline, manifest, checks, committed outputs
7. `feat(hero)`: name animation, glow, portrait, tag (mobile position), status board, easter egg
8. `feat(sections)`: work list + filters + preview, about + story, timeline, awards, contact
9. `feat(case-studies)`: dialog + standalone pages in both locales
10. `feat(palette)`, `feat(seo)`: palette; meta, hreflang, JSON-LD, sitemaps, robots, OG, 404s, CSP
11. `polish`: overflow fixes in AZ, reduced-motion/transparency, no-JS pass
Then the `enhancements` branch (§9). Then Phase 5.

---

## 16. Phase 5 verification (evidence, not "done")

As specified in the brief, run against `astro build` + `astro preview`, plus:
- Proper Playwright device emulation at 375×812 and **390×844** (the Phase 0 check that couldn't be done).
- Photo story screenshot sequence at 1366 and 390 px, both locales; CLS < 0.1; hero still LCP.
- Metadata check on `dist/` images; slow-network throttling shows blurred placeholders first.
- Link check in both locales with a generous timeout and one retry for the Render links (cold start up to ~60 s)
  before anything is reported as broken.
- Privacy grep of `dist/`.

## 17. Phase 6

On hold until you send hosting instructions. `README.md` is written at the end of Phase 4/5
(setup, editing content in both languages, adding a UI string, changing a photo, theme tokens,
pinned versions); the deployment section waits.
