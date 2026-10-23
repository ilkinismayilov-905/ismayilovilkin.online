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
- Hero intro: "Erkən mərhələli FinTech startapında 6 backend developerdən ibarət komandaya rəhbərlik edirəm. Spring Boot ilə təhlükəsiz və testlərlə əhatə olunmuş servislər qururam. Orta cavab müddəti 1000 ms-dən 14 ms-ə endi, 75 endpoint üzrə ~95% test əhatəsi var."
- Meta description, JSON-LD description, hero portrait alt text.
- Status board: "VersePay-də Java Backend Team Lead", "Ödənişlər, Spring Boot, performans və testlər", "Bank və ya FinTech backend sahəsində ilk korporativ rol axtarıram".
- Hero tag: "orta API cavab müddəti".
- Work note: "Yeddi layihə, çoxməkanlı restoran sifariş platformasından brauzer oyununa qədər. Dördünün ətraflı təsviri var."
- About chapter titles: "Nə qururam", "Necə öyrənirəm", "Hakatonlar və daha çoxu", and the chapter texts (built from AZ CV phrases).
- Principles: "Əvvəl ölç, sonra düzəlt", "Testlər kodla birlikdə gəlir", "Təhlükəsizlik ilk versiyanın bir hissəsidir", "Buraxılış adi iş olsun" and their sentences.
- Project summaries for Yolçu, AbadLand, Space Shooter, Paygenix (shortened from CV lines); case-study sentences
  "Mənim payım: …", "Platforma milly-front.vercel.app ünvanında işləyir.", "Layihəni OpenAPI (Swagger) sənədləri ilə təhvil verdim."
- Awards: row title "Könüllülük"; result labels "Qalib", "Finalçı", "Könüllü".
- Contact note: "Mənimlə ən tez e-poçt vasitəsilə əlaqə saxlamaq olar."
- Section heading "Hakatonlar və mükafatlar" (your EN wording "Hackathons & awards"; the AZ CV heading is "Hakatonlar və fəaliyyətlər").

## UI strings (all of `az` in `src/i18n/ui.ts`)

Navigation: İşlər, Haqqımda, Təcrübə, Hakatonlar, Əlaqə · Buttons: Axtar, Tema, E-poçtu kopyala, Bağla ·
Filters: Hamısı, Backend, Hakatonlar, Frontend · Count: "Bütün 7 layihə göstərilir", "2 hakaton layihəsi göstərilir" ·
Toasts: "E-poçt kopyalandı", "Açıq tema aktivdir", "Tünd tema aktivdir", "Status işığını tapdın." ·
Palette: "Bölmə, layihə və ya əməliyyat axtarın", groups "Keçid", "Layihəni aç", "İşləri süz", "Əməliyyatlar" ·
Language: "Bu səhifə Azərbaycan dilində də var." / "Azərbaycanca oxu" · 404: "Səhifə tapılmadı", "Bu ünvanda heç nə yoxdur. Saytdakı hər şey ana səhifədən başlayır."

## Added on the enhancements branch

- Case-study page: facts card label "Layihə haqqında qısa məlumat", navigation "Digər layihələr", "Əvvəlki: …" / "Növbəti: …".
- Skills: heading "Bacarıqlar" and all groups and items are taken word for word from the AZ CV.

The easter egg ("Əvvəlcə çay, sonra növbəti endpoint") and the Render note ("açılması bir az vaxt ala bilər") are your wording.
