# Translation review (Azerbaijani)

Rule: Azerbaijani text uses the AZ CV wording wherever it exists. Everything below is **my own translation or
wording**, so please check that it sounds natural. Tech names stay in their original form.
UI strings live in `src/i18n/ui.ts`; content in `src/content/*/az*`.

## Decisions to check

| Topic | What I did | Why |
|---|---|---|
| Grammatical person | CV bullets are 3rd person ("qurdu", "endirdi"); the site speaks in 1st person ("qurdum", "endirdim") | The whole site is first person, like the English side. Facts and wording otherwise unchanged. |
| Dates | "Dekabr 2025 – hazırda", month capitalised | Matches your AZ CV. ICU gives lowercase ("dekabr"); I capitalise the first letter with Azerbaijani casing rules. |
| Organisation after a role | Role on one line, organisation on the next (no "at") | Azerbaijani needs a case suffix that depends on the name ("VersePay-də", "UNEC-də"); a separate line avoids wrong suffixes. |
| "Case study" | "Layihə haqqında" / "Ətraflı oxu" | "Keys araşdırması" sounds forced; tell me if you prefer another term. |
| New tab note | "(yeni vərəqdə açılır)" | Screen-reader text for external links. |

## Content passages (not in the AZ CV word for word)

- Photo captions: "Qarabağ Hakatonu 2026", "TransportTech Hakatonu 2026" (from the AZ CV event names); the others are names and years.
- Hero intro (2026-10-26, after leaving VersePay): "Java və Spring Boot ilə backend sistemlər qururam. VersePay-də 6 nəfərlik backend komandasına rəhbərlik etdim: orta cavab müddəti 1000 ms-dən 14 ms-ə endi, 75 endpoint üzrə ~95% test əhatəsinə çatdıq." (first sentence is yours; the rest is the old intro in the past tense).
- Meta description (2026-10-26): "Bakıda Java backend developer. Spring Boot ilə sürətli və testlərlə qorunan API-lər qururam. VersePay-də 6 nəfərlik backend komandasına rəhbərlik etmişəm, bank və FinTech sahəsində Java backend rolları axtarıram."
- JSON-LD description (2026-10-26): "Java Backend Developer, Renter.az-ın həmtəsisçisi və Kompüter Mühəndisliyi tələbəsi."
- Hero portrait alt text.
- Status board (2026-10-26): "Renter.az-da həmtəsisçi və CMO · UNEC-də tələbə" and "Java, Spring Boot, API dizaynı, performans və testlər" (your wording from the new status card), "Bank və FinTech sahəsində Java backend rolları axtarıram" (shortened from your availability text).
- Hero tag: "orta API cavab müddəti".
- Work note: "Yeddi layihə, çoxməkanlı restoran sifariş platformasından brauzer oyununa qədər. Dördünün ətraflı təsviri var."
- About (2026-10-26): intro, status card, "Təcrübə" and "Təhsil və nailiyyətlər" chapters, cards and the Renter.az / VersePay timeline texts are **your own wording** (not translated). One sentence added by your decision: "…və 5 komanda layihəsinin tamamlanmasını təmin etmişəm" (AZ CV wording). Chapter "Hakatonlar və daha çoxu" unchanged.
- UI labels added 2026-10-26: "İş statusu", "Əlaqə saxla", "Hazırda", "Əvvəl", "hazırda", "keçmiş", "Nəticələr"; the timeline section and its nav link are now "Karyera".
- Principles: "Əvvəl ölç, sonra düzəlt", "Testlər kodla birlikdə gəlir", "Təhlükəsizlik ilk versiyanın bir hissəsidir", "Buraxılış adi iş olsun" and their sentences.
- Project summaries for Yolçu, AbadLand, Space Shooter, Paygenix (shortened from CV lines); case-study sentences
  "Mənim payım: …", "Platforma milly-front.vercel.app ünvanında işləyir."
- Awards: row title "Könüllülük"; result labels "Qalib", "Finalçı", "Könüllü".
- Contact note: "Mənimlə ən tez e-poçt vasitəsilə əlaqə saxlamaq olar."
- Section heading "Hakatonlar və mükafatlar" (your EN wording "Hackathons & awards"; the AZ CV heading is "Hakatonlar və fəaliyyətlər").

## UI strings (all of `az` in `src/i18n/ui.ts`)

Navigation: İşlər, Haqqımda, Karyera, Hakatonlar, Əlaqə · Buttons: Axtar, Tema, E-poçtu kopyala, Bağla ·
Filters: Hamısı, Backend, Hakatonlar, Frontend · Count: "Bütün 7 layihə göstərilir", "2 hakaton layihəsi göstərilir" ·
Toasts: "E-poçt kopyalandı", "Açıq tema aktivdir", "Tünd tema aktivdir", "Status işığını tapdın." ·
Palette: "Bölmə, layihə və ya əməliyyat axtarın", groups "Keçid", "Layihəni aç", "İşləri süz", "Əməliyyatlar" ·
Language: "Bu səhifə Azərbaycan dilində də var." / "Azərbaycanca oxu" · 404: "Səhifə tapılmadı", "Bu ünvanda heç nə yoxdur. Saytdakı hər şey ana səhifədən başlayır."

## Added on the enhancements branch

- Case-study page: facts card label "Layihə haqqında qısa məlumat", navigation "Digər layihələr", "Əvvəlki: …" / "Növbəti: …".
- Skills: heading "Bacarıqlar" and all groups and items are taken word for word from the AZ CV.

The easter egg ("Əvvəlcə çay, sonra növbəti endpoint") and the Render note ("açılması bir az vaxt ala bilər") are your wording.

## English translated from your Azerbaijani answers (2026-10-24)

Your Azerbaijani text is used word for word on the AZ pages. The English below is my translation; please check it.

| Project | Field | English on the site |
|---|---|---|
| Milly | Problem | Milly digitises how restaurants take and manage orders and how guests and staff communicate. It speeds up service and brings the operations together on one platform. |
| Milly | The decision that mattered | Using STOMP over WebSocket alongside the REST API, so restaurant staff see every change in an order's status in real time. |
| Yolçu | Problem | Yolçu makes transport services easier to manage and to access, through one digital platform. |
| Yolçu | My part | I built the whole web application on my own and was fully responsible for its architecture, its features and its integration with the other parts of the system. |
| Yolçu | The decision that mattered | Building the web application on one architecture from start to finish, which kept the integration with the rest of the system simple and sped up development. |
| AbadLand Qarabağ | Problem | People who want to invest in farmland in Karabakh find it hard to locate plots, judge their investment potential and manage their applications. AbadLand Qarabağ solves this with one digital platform. |
| AbadLand Qarabağ | My part | I built the whole web side of the project on my own: the investor and admin dashboards, the interactive maps, plot comparison, the 3D view and the screens for tracking applications. |
| AbadLand Qarabağ | The decision that mattered | Choosing server-side rendering with Spring Boot and Thymeleaf instead of a separate frontend app. It made connecting the web interfaces to the backend simpler and got the MVP built faster. |

Small change on the AZ pages: after "Mənim payım:" your sentence starts with a lowercase letter ("layihənin …"), because it continues the sentence. "Team of 4" is "4 nəfərlik komanda", the same form as Milly.
