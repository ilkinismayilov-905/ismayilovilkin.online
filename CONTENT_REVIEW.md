# Content review

Everything on the site comes from the two CVs in `CV/` (versions of 2026-10-23) or from your answers.
This file lists what still needs you. `npm run build:release` fails while any `[NEEDS INPUT]` remains.

## 1. What changed in the new CVs (compared with the first versions)

| Where | Before | Now | On the site |
|---|---|---|---|
| EN, TransportTech organiser | IRAS | **IDDA** | "Openwave program by IDDA & AYNA" |
| AZ, TransportTech organiser | IRAS | **IRIA** | "IRIA və AYNA-nın Openwave proqramı" |
| EN, Karabakh Hackathon | Prize Winner | **Winner** | "Winner" |

Nothing else changed. Each language now uses its own CV wording as written (your rule of 2026-10-23),
which replaces my earlier plan to translate the English volunteering details and Karabakh/TransportTech
descriptions into Azerbaijani.

## 2. Genuine EN/AZ conflicts — please choose

1. **Milly, sprint planning.** EN: "Planned and tracked team sprints and tasks in Jira." (you did it).
   AZ: "Komanda daxilində tapşırıqlar Jira-da planlaşdırılıb izlənildi." (passive, no owner).
   Now: each page uses its own CV sentence. Should the AZ page also say you planned them?
2. **Yolçu, AI feature.** EN: "AI bus-interval **optimization**". AZ: "AI interval **tövsiyəsi**" (recommendation).
   Now: each page uses its own CV wording. Which describes the feature correctly?
3. **Title.** EN CV: "Java Backend Developer". AZ CV: "Java Backend Developer · Spring Boot · FinTech".
   Now: "Java Backend Developer" in both, with Spring Boot and FinTech in the Focus line (your decision of Phase 0).
   Confirm that this still stands under the new "use the CVs as written" rule.

Not conflicts, only different detail levels (each page uses its own CV): volunteering details
(EN names Baku City Circuit, Transport Dept., HSE team; AZ does not), Karabakh description
(EN "online applications with commission review", AZ "onlayn müraciət").

## 3. `[NEEDS INPUT]` on the site

Filled on 2026-10-24 from your answers: Milly (role, problem, decision), Yolçu and AbadLand Qarabağ (role, team of 4,
stack, problem, your part, decision). The stack now sits in each project's `stack:` list, so it also shows in the work list.

Still open (blocks `npm run build:release`):

| Project | Field |
|---|---|
| Paygenix | Problem |
| Paygenix | The decision that mattered |

Note: your answers give "Web Developer" as your role on all three projects, while the CVs title you "Java Backend
Developer". The site shows "Web Developer" on those three case studies, as you wrote.

## 4. Missing data shown as blank (not invented)

- **Project years**: Space Shooter, ManageableUni, HR Management System, Paygenix (year column empty).
- **Hackathon years**: PashaHackathon 6.0, PashaHackathon 5.0, Holberton Micro SaaS (date column empty).
- **Renter.az start date**: shown as "Present" only. The description now uses the CV wording
  ("live vehicle rental marketplace with ~100 customers"). It was `[NEEDS INPUT]` before because the laptop in
  your booth photo says "Group travel, finally bookable online"; please confirm the CV wording is current.

## 5. Inferred, please confirm

- **Milly year 2026**: inferred from the bootcamp dates (Jan–Jul 2026); the CV gives no project year.
- **Photo captions**: "Renter.az, 2026" (year from the photo's date), "IT SkillSprint, 2026", "Karabakh Hackathon 2026".
- **Experience order**: work first (VersePay, Renter.az, CodersAzerbaijan), then education (Ironhack, UNEC), each newest first.

## 6. Photo background (approved 2026-10-23)

- Mapping: hero + work 7545, About chapters 0426 / 9431 / 0208, experience 0426, hackathons & awards 0257, contact 0257.
- **Case-study pages (my choice, please confirm)**: each uses the photo from its own event: Milly → IT SkillSprint
  (9431), Yolçu → TransportTech (0257), AbadLand Qarabağ → Karabakh Hackathon (0208). Paygenix has no event photo,
  so it uses the hero photo (7545). Change with `background:` in `src/content/projects/{en,az}/<slug>.md`.
- **Hero caption "PashaHackathon, 2026"**: the badge shows PASHA Hackathon, the year comes from the photo's date;
  which edition (5.0 or 6.0) is not known. Captions live in `backgrounds` in `src/content/site/{en,az}.yaml`.
- The photos are decorative backgrounds now, so they have no alt text; the earlier story alt texts were removed
  with the About photo frame.

## 7. Drafts in your voice (from CV facts) — edit freely

All in `src/content/…/{en,az}`:
- Hero intro, status "Next" line (from the AZ CV goal), meta descriptions, JSON-LD description.
- Work note: "Seven projects, … Four have a full case study."
- The three About chapters and the four "How I work" principles.
- Contact note: "Email is the fastest way to reach me." (no reply-time promise, since none is in the CVs).
- Project one-line summaries and case-study ledes; image alt texts.

## 8. Privacy and downloads

- Phone number and referee: not published anywhere. `npm run build:release` greps `dist/` for phone patterns and a
  local deny-list (`.privacy-denylist`, gitignored).
- **CV download is hidden**: both PDFs in `CV/` contain your phone number, so there is no download link and no
  palette entry. Export versions without the phone number (and without the referee block) and I will add them,
  with metadata stripped.
- Photos: only metadata-free copies are in the repository (`npm run photos`, checked by `check-photos`).
