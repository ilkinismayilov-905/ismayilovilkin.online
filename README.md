# ismayilovilkin.online

Personal portfolio of Ilkin Ismayilov / İlkin İsmayılov, in English (`/`) and Azerbaijani (`/az/`).
Static site built with Astro 7 and TypeScript, no UI framework. Design source: `design/portfolio-demo.html`.

Other docs: `PLAN.md` (architecture and decisions), `CLAUDE.md` (conventions), `CONTENT_REVIEW.md` (open content
questions), `TRANSLATION_REVIEW.md` (Azerbaijani text to check), `VERIFICATION.md` (test evidence).

## Local setup

Requirements: Node ≥ 22.23.4 and npm. Tests, screenshots and Lighthouse use the installed **Google Chrome**.
Deploying needs **GNU rsync** (`brew install rsync`): macOS's built-in `openrsync` uploads to the server at about
1 KB/s, so `scripts/deploy.sh` refuses to use it.
Regenerating photos needs **macOS** (HEIC conversion uses the built-in `sips`).

```bash
npm ci
```

```bash
npm run dev
```

Opens <http://localhost:4321>. Before publishing, always check the production build:

```bash
npm run build && npm run preview
```

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/`; fails if content differs between the two languages |
| `npm run build:release` | Build that also fails on any `[NEEDS INPUT]` and on private data in `dist/` |
| `npm run preview` | Serves `dist/` locally |
| `npm run check` | ESLint, CSS rules, type check, photo metadata check |
| `npm test` | Playwright suite (needs the build; starts `astro preview` itself) |
| `npm run lighthouse` | Mobile Lighthouse on home + one case study, both languages (needs `npm run preview`) |
| `npm run links` | Link check of `dist/`, external links with a 90 s timeout for Render cold starts |
| `npm run photos` | Rebuilds the published photos from the originals in `photo/` |
| `npm run og` | Re-renders the social sharing cards in `public/og/` (needs `npm run preview`) |
| `node scripts/contrast.mjs` | WCAG text contrast measured on screenshots (needs `npm run preview`) |
| `node scripts/photo-visibility.mjs` | How visible the background photo is per section and theme |

## Editing content

All text lives in `src/content/`, one file per language. **Every change must be made in both languages**: the build
stops with "Locale parity check failed" if an entry, field or list length differs.

| What | English | Azerbaijani |
|---|---|---|
| Name, meta, hero intro, status board, tag, contact, background photos | `site/en.yaml` | `site/az.yaml` |
| About chapters, "How I work", skills | `about/en.md` | `about/az.md` |
| Experience timeline | `experience/en.yaml` | `experience/az.yaml` |
| Hackathons & awards | `awards/en.yaml` | `awards/az.yaml` |
| Projects | `projects/en/<slug>.md` | `projects/az/<slug>.md` |

Dates are written `YYYY-MM` and formatted per language automatically ("Dec 2025" / "Dekabr 2025").
Write `[NEEDS INPUT]` for anything not yet known: the page shows it, and `build:release` refuses to publish it.

### Add or edit a project

1. Create `src/content/projects/en/<slug>.md` and `src/content/projects/az/<slug>.md` with the same file name.
   The slug becomes the URL (`/work/<slug>/`, `/az/work/<slug>/`). Do not add a `slug:` field.
2. Fill the frontmatter (same structure in both files; only the text differs):

```yaml
---
title: Milly
order: 1                      # position in the list
year: 2026                    # optional
category: backend             # backend | hackathon | frontend (the filters)
stack: [Java 21, Spring Boot 4, PostgreSQL]
summary: One line for the work list.
lede: One or two sentences under the title.          # case studies only
motif: blocks                 # hover/header graphic: lines | blocks | rings | grid | wave
caseStudy: true               # false = list entry only, no page
background: story-learn       # case studies: background photo name (see "Change a photo")
facts:
  - { label: Role, value: "Backend developer" }      # quote values that contain commas
live: { url: "https://example.com", coldStart: false } # coldStart: true adds "may take a moment to load"
sections:                     # case studies only
  problem: "…"
  did: "…"
  decision: "…"
  result: "…"
---
```

3. External links open in a new tab automatically. If the project has an OG card, run `npm run og`.
4. `npm run build`, then check both pages.

## Add a UI string

Buttons, labels, toasts, aria-labels and similar live in `src/i18n/ui.ts`:

1. Add the key to the `en` object, e.g. `'contact.call': 'Call me',`.
2. Add the same key to the `az` object. A missing Azerbaijani key is a type error (`npm run check` fails).
3. Use it in a component: `const t = useT(locale); t('contact.call')`. Placeholders: `'count.all': 'Showing all {n} projects'`
   with `t('count.all', { n: 7 })`.
4. Strings needed in the browser (toasts, palette) must also be listed in the `pageData.t` list in
   `src/layouts/Base.astro`.
5. Log any Azerbaijani text you wrote yourself in `TRANSLATION_REVIEW.md`. Never use `text-transform: uppercase`
   (it breaks i/İ and ı/I); `npm run lint` rejects it.

## Change a photo

Originals live in `photo/`. That folder is **gitignored** because phone photos contain GPS location; only the
metadata-free copies made by `npm run photos` are committed.

1. Put the new original in `photo/` (JPG or HEIC).
2. Edit `scripts/photo-manifest.json`: point an entry's `source` at the new file. Keep its `name`.
   `crop: [x, y, width, height]` (fractions of the photo) is used only for the hero arch portrait.
3. Run `npm run photos`. It writes `src/assets/photos/hero.jpg` and `src/assets/photos/bg/<name>-wide.jpg` /
   `-tall.jpg`, then fails if any metadata remains.
4. Adjust framing and caption in `src/content/site/{en,az}.yaml` under `backgrounds` (`desktop` / `mobile` are CSS
   `object-position` values; keep the face away from the text column, i.e. right on desktop).
5. Which photo appears where: `sectionBackgrounds` in the same files, `background:` in each About chapter and case study.
6. Run `node scripts/contrast.mjs` (with `npm run preview` running). Every position must pass WCAG AA.
7. The hero portrait's alt text is `hero.portraitAlt` in both `site` files.

## Theme tokens

Colours and shapes are CSS custom properties at the top of `src/styles/global.css`, defined three times: dark (default),
`:root[data-theme="light"]` (toggle), and `prefers-color-scheme: light` (system setting). Change all three together.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--bg` / `--bg-2` / `--bg-3` | `#0F1E1B` / `#183631` / `#2A2320` | `#E9EEE8` / `#D6E3DB` / `#F3E4D6` | page and washes |
| `--text` | `#F3EFE7` | `#0F1E1B` | body text |
| `--muted` | `#A9BBB4` | `#475A53` | secondary text |
| `--accent` | `#FFB86B` | `#A84F17` | accents, focus ring |
| `--glass`, `--glass-strong`, `--glass-border`, `--glass-hi` | | | frosted surfaces |
| `--r-s` / `--r-m` / `--r-l` | 10 / 18 / 28 px | | corner radii |

The font is Archivo (variable width 75–125, weight 200–900), self-hosted in `src/assets/fonts/` and loaded through
Astro's Fonts API in `astro.config.mjs`. It was subset to Latin + Latin Extended with fonttools 4.60.1:

```bash
fonttools varLib.instancer "Archivo[wdth,wght].ttf" wdth=75:125 wght=200:900 -o archivo.ttf
```

```bash
pyftsubset archivo.ttf --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" --layout-features='*' --flavor=woff2 --output-file=Archivo-wdth-wght.woff2
```

Source: `google/fonts`, `ofl/archivo/Archivo[wdth,wght].ttf` (SIL OFL 1.1, licence next to the font file).

## Deployment (own server)

The site runs on your own server (`ssh myserver`, Ubuntu 24.04) behind nginx with a Let's Encrypt certificate.
Every deploy is a new folder; the live site is a symlink, so switching and rolling back are instant.

```
/var/www/portfolio/
├── releases/20261024T150000Z/   one folder per deploy (UTC timestamp), the newest 5 are kept
├── current -> releases/…        what https://ismayilovilkin.online serves
└── next    -> releases/…        the release being health-checked (127.0.0.1:8080, server-local only)
```

### Deploy

Turn on **Cloudflare WARP** first: from the owner's home network and phone hotspot, large SSH transfers to the server
stall (route problem to Contabo); over WARP a deploy takes a few minutes.

```bash
scripts/deploy.sh --dry-run
```

builds, runs every check and shows what rsync would upload, without changing the server. Then:

```bash
scripts/deploy.sh
```

It stops at the first error: `npm ci` → `npm run build:release` (fails on `[NEEDS INPUT]` or private data) →
`npm run check` → Playwright tests → link check → upload into a hidden `releases/.incoming-<ts>/` folder, renamed to `releases/<ts>/` only when the transfer is
complete (unchanged files are hard-linked to the previous release) → health check on the server (home, `/az/`, a case study, both 404s, the CSP) → switch `current`
→ delete releases older than the newest 5 (never the live one). Each release gets `/release.txt` with its timestamp,
so `curl https://ismayilovilkin.online/release.txt` shows which release is live.

### Roll back

```bash
scripts/rollback.sh
```

points the site at the release before the live one. `scripts/rollback.sh --list` shows all releases and which is
live; `scripts/rollback.sh 20261024T150000Z` picks one. Nothing is deleted, so you can roll forward the same way.

### Server configuration

| What | In the repo | On the server |
|---|---|---|
| Site (HTTPS, redirects, health-check server) | `deploy/nginx/ismayilovilkin.online.conf` | `/etc/nginx/sites-available/ismayilovilkin.online` (linked from `sites-enabled/`) |
| How files are served, 404s, compression, cache rules | `deploy/nginx/portfolio-site.conf` | `/etc/nginx/snippets/portfolio-site.conf` |
| Security headers (incl. HSTS, 1 year) | `deploy/nginx/portfolio-headers.conf` | `/etc/nginx/snippets/portfolio-headers.conf` |
| TLS settings | `deploy/nginx/portfolio-tls.conf` | `/etc/nginx/snippets/portfolio-tls.conf` |
| Bootstrap (HTTP only, before the certificate) | `deploy/nginx/ismayilovilkin.online.http-only.conf` | not used any more: HSTS is on, never switch back to HTTP |

To change the config: edit the file in `deploy/nginx/`, copy it to the server with a timestamped backup of the old
one next to it, then `nginx -t` and `systemctl reload nginx` (reload, not restart). Never edit only on the server:
the repo is the source of truth.

### Certificates

- Location: `/etc/letsencrypt/live/ismayilovilkin.online/` (one certificate for the apex and www).
- Issued with `certbot certonly --webroot -w /var/www/letsencrypt`; nginx serves `/.well-known/acme-challenge/` from there.
- Renewal is automatic: Ubuntu's `certbot.timer` runs twice a day, and a deploy hook reloads nginx after a renewal.
- Check on the server:

```bash
ssh myserver certbot certificates
```

```bash
ssh myserver systemctl list-timers certbot.timer
```

```bash
ssh myserver certbot renew --dry-run
```

### DNS (Spaceship)

| Type | Host | Value |
|---|---|---|
| A | `@` and `www` | 13.140.152.249 |
| AAAA | `@` and `www` | 2a02:c207:2368:9412::1 |

## Pinned versions

Exact versions (`.npmrc` has `save-exact=true`; `package-lock.json` is committed):

| Package | Version |
|---|---|
| astro | 7.4.2 |
| sharp | 0.35.5 |
| typescript | 6.0.3 (not 7.x: `@astrojs/check` and `typescript-eslint` do not support it yet) |
| @astrojs/check | 0.9.12 |
| eslint / typescript-eslint | 10.13.0 / 8.72.0 |
| eslint-plugin-astro / astro-eslint-parser | 3.2.1 / 3.2.0 |
| @playwright/test / @axe-core/playwright | 1.64.1 / 4.14.0 |
| lighthouse | 13.5.0 |
| Node | ≥ 22.23.4 |
