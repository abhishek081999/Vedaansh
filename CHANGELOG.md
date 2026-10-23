# Changelog

All notable **user-facing** changes for Vedaansh (`jyotish-platform`).  
Format inspired by [Keep a Changelog](https://keepachangelog.com/). Version from `package.json`.

## [2.6.0] — current

**Stack:** Next.js 16.4 · React 19 · Node ≥ 24 · `sweph` · MongoDB/Mongoose · NextAuth v5 · Upstash Redis · Razorpay  
**Default prices (INR):** Gold ₹168/mo · ₹1,443/yr · Platinum ₹336/mo · ₹2,888/yr (`pricing.ts`; BillingConfig may override)

### Added / live

- Full chart workspace: Navagraha, vargas (plan-filtered), dashas, strengths, yogas, SBC, ACG, Vastu, Prashna, Jaimini, Nakshatra lab, Numerology
- Career and profession desk on the chart (Free preview; full reading on Gold+)
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
- Research Platinum routes reserved; UI not shipped

---

## Unreleased

_Document upcoming user-visible changes here before bumping `package.json`._

### Added

- Relationship and marriage on the chart: a short preview on Free, the full reading on Gold and Platinum
- Kundali Milan match-making and married life: a short preview on Free; the full reading, All Sections, and print on Gold and Platinum
- Save a Kundali Milan from the match result. My Charts has two sections: My Charts and Kundali Milan. Caps match chart saves (20 / 200 / unlimited)
