# Changelog

All notable **user-facing** changes for Vedaansh (`jyotish-platform`).  
Format inspired by [Keep a Changelog](https://keepachangelog.com/). Version from `package.json`.

## [2.6.0] — current

**Stack:** Next.js 16.4 · React 19 · Node ≥ 24 · `sweph` · MongoDB/Mongoose · NextAuth v5 · Upstash Redis · Razorpay  
**Default prices (INR):** Gold ₹168/mo · ₹1,443/yr · Platinum ₹336/mo · ₹2,888/yr (`pricing.ts`; BillingConfig may override)

### Fixed

- Numerology: full names totalling more than 52 now get a compound meaning (read on Cheiro's cycle, same root). Gold predictions and remedies are now built on the server, so free accounts can no longer read them from the browser
- Auth gates, Gold and Platinum page gates, the sign-in rate limit, and the CSP now run: `proxy.ts` moved to `src/proxy.ts`. Previously Next.js ignored it. Logged-out visitors to `/muhurta` now go to login, and XLSX export now requires Gold
- Birth location timezones come from offline boundary data. Places such as Dhaka, Lahore, Kabul, and coordinates around Lucknow were getting the wrong zone
- Payments: early renewals keep remaining days, refunds and lost disputes remove the plan, failed webhook deliveries are retried, and welcome emails and coupon counts no longer depend on which payment path finished first

### Added / live

- Hindi Panchang and Today's Reading: `/hi/panchang`, `/hi/panchang/calendar` and `/hi/today` are fully in Hindi, including the day predictions, Vishesh panchang, Dinman muhurtas, house-by-house predictions, dasha timeline and remedies. Panchang pages have Hindi titles, descriptions and SEO text and point Google at their `/hi` versions
- Hindi (हिन्दी) site, first part: every page is available under `/hi/...` with a language switch in the header and side menu. The menus, header, footer, home page, today's panchang strip and home SEO text are in Hindi so far; other pages still show English text under `/hi` while they are translated
- Numerology couple match: core-number harmony, a combined Lo Shu grid showing what each partner brings, and the relationship number — in Numerology → Compatibility and on the Kundali Milan match view
- Numerology business tool (Gold): business name, launch date, logo initial and GST / PAN / CIN / phone scored together, plus a launch-date finder
- Numerology year calendar (Gold): download a year of best and caution days as an .ics file, with the sunrise tithi and Rikta days flagged
- Numerology for CRM clients (Platinum): load a client into the numerology tool and save a snapshot note, with key remedies, to their record
- Numerology Name tab: name depth (karmic lessons, hidden passion, balance number), side-by-side spelling comparison, and Devanagari names with Katapayadi numbering and Indian-style transliteration. Grid tab: Pythagorean arrows of strength and weakness
- Ṣaṭpañcāśikā in Prashna is now a rule engine over all 56 ślokas: fourteen question types, each rule cited with the chart facts that fired it, a verdict weighted by planetary strength, the five timing methods kept separate, lost-item details, rules it could not judge listed with the reason, and a searchable śloka reference
- Ṣaṭpañcāśikā now answers 32 questions, grouped by theme: new ones include who took a lost item, where it is, whom the question is about, when a traveller returns, whether it is good to set out, and any of the twelve houses through śloka 1.3
- Prashna timing now covers every question about an event and shows approximate calendar dates. Methods the text gives for that question are marked as from the text, and borrowed ones as adapted
- Vedic Prashna is now a real reading (Gold+): ten matters, lagna lord, matter's lord, kāraka and Moon weighed by ṣaḍbala, Parashari links, Tajika ithasala, ishrafa, nakta, yamaya and kamboola with orbs, kartari, bhāva bala, and separate timing
- Prashna adds a time-sensitivity check showing whether the verdict holds a few minutes either side, casting for a past question, a planet table, and a hit-or-miss log in reading history
- Dashboard cards: doshas and afflictions, today's Panchang (Rahu Kalam, Abhijit), current transits with Sade Sati status, D9/D10/D7/D12 charts, remedies from the Moon nakshatra and running dasha lords, and a Gold relationship and career highlight. On phones these sit in Today, Yogas, and a new Insights tab
- Full chart workspace: Navagraha, vargas (plan-filtered), dashas, strengths, yogas, SBC, ACG, Vastu, Prashna, Jaimini, Nakshatra lab, Numerology
- Career and profession desk on the chart (Free preview; full reading on Gold+)
- Professional career method beside that reading: karma field, the joined pair, nakshatra behavior, then D10, in seven tabs
- Job, family, and venture questions inside that method: contractual or permanent service, property, job changes, father, child, and collapse
- Career reading tabs regrouped from fourteen to seven, each with a hint; the weak period label is now "Poor for career"
- Style and System divisions on that method: execution by sign, roles, the three karmas, the house-lord chain, and career triggers
- Education and Pattern divisions: the 4th, 5th, and 9th for study, two karmic themes at once, lineage, and the phase of the dasha
- Karma field division on that method: lagna and the 10th first, then the income houses, Dashamsha only after the birth chart
- Profile division after the field: the 10th lord’s element and nakshatra, Mercury’s two habits, uniform only when the 6th and 10th agree, and a post left in an 8th or 12th period
- Sector division between the field and the profile: the 5th–9th–Mars–10th circuit, a sector instead of a job title, and the father’s line kept apart from the father’s backing
- Disha division: the Sun’s half and the Moon’s half, and a compass for growth only when the house, the sign, and the planet agree
- Pipeline division: Mars through the Moon, authority against the system, and the initiating half kept apart from Disha’s achievement half
- Counsel division: the Moon and the 10th lord on Disha’s two halves, and whether a charge can be finished
- Demand division: a stay abroad as learning rather than settlement, and a venture only when clients and endurance agree
- Pillars division: the house, the planet, and the sign read together, and a Sun seat only bends when Rahu is on it
- Calling division: a visible 10th against a hidden 5th, and the subject read from the 2nd rather than the 5th
- Streams division: a joined pair names the stream, and Saturn either holds a service or makes service the hard room
- Gana division: the 10th lord’s nakshatra sets the behavior, and the Moon and Rahu are compared with it
- Panchang + calendar; Muhurta (Gold+); Compare / Ashtakoot / Porutham
- Auth: Google OAuth + credentials; verify email; forgot / reset password
- Subscriptions: Free / Gold / Platinum via Razorpay; coupons via BillingConfig
- Platinum: Client CRM, chart email, bulk ZIP export, white-label branding
- Public chart share links; PDF/HTML export (Gold+)
- PWA (Serwist); Android TWA packaging scripts
- Admin: users, charts, revenue, billing, audit, broadcast, Redis cleanup, Remotion reel studio
- Docs set under `docs/` (system design, API, data model, product, runbook, testing, ADRs)

### Known gaps

- Full i18n rollout not complete
- Stripe checkout not wired (schema reserved)
- Research prefixes reserved in `proxy.ts`; no route files and no UI

### Also live on this version

These shipped in the current tree without a version bump:

- Relationship and marriage: a short preview on Free, the full reading on Gold and Platinum, extended divisionals on Platinum
- Kundali Milan match-making and married life: a short preview on Free; the full reading, All Sections, and print on Gold and Platinum
- Save a Kundali Milan from the match result (`/api/milan/save`, list, delete). My Charts has two sections: My Charts and Kundali Milan. Caps match chart saves (20 / 200 / unlimited)
- Gold marriage transit windows (`GET /api/marriage/gochar-windows`)

---

## Unreleased

### Added

- Interpretation hub on the chart workspace and public share: tone map, planet strip, house map, Shadbala radar/bars, and expandable theme cards (`InterpretationHub`)
- Free teaser for that hub: overview tone map + first three themes; Gold unlocks planets, houses, rashis, strength, transit, and dasha sections (`userPlan` / `planMeetsUiGate`)

### Fixed

- Duplicate React keys when a chart has several yogas with the same name (e.g. multiple Raja Yogas) in the Interpretation hub overview
