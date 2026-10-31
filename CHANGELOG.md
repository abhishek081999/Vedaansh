# Changelog

All notable **user-facing** changes for Vedaansh (`jyotish-platform`).  
Format inspired by [Keep a Changelog](https://keepachangelog.com/). Version from `package.json`.

## [2.6.0] — current

**Stack:** Next.js 16.4 · React 19 · Node ≥ 24 · `sweph` · MongoDB/Mongoose · NextAuth v5 · Upstash Redis · Razorpay  
**Default prices (INR):** Gold ₹168/mo · ₹1,443/yr · Platinum ₹336/mo · ₹2,888/yr (`pricing.ts`; BillingConfig may override)

### Added / live

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

_Document upcoming user-visible changes here before bumping `package.json`._
