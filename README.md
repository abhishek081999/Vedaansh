# 🪐 Vedaansh — Vedic Jyotish Platform

> **Next.js 14 · TypeScript · MongoDB · Mongoose · NextAuth.js v5 · sweph**  
> **Free · Gold (₹99/mo · ₹999/yr) · Platinum (₹199/mo · ₹1,999/yr)**

A full-featured Vedic astrology (Jyotish) web platform built entirely in TypeScript. The platform provides arc-second-accurate ephemeris calculations, multiple Dasha systems, divisional charts, Ashtakavarga, Shadbala, Muhurta finding, interactive SVG chakra renderers — all powered by the Swiss Ephemeris C library via the `swisseph` npm package.

**Build Status: All 10 phases complete. v2.6.0 live. Remaining: Full i18n rollout.**

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2 |
| Language | TypeScript | 5.4 |
| Ephemeris | sweph (Swiss Ephemeris npm) | 2.10.3 |
| Database | MongoDB Atlas + Mongoose ODM | 6.21 / 8.4 |
| Auth | NextAuth.js v5 | 5.0-beta |
| Cache | @upstash/redis | 1.31 |
| Geo / Atlas | Photon API + Upstash Redis + `tz-lookup` | — |
| Styling | Custom CSS + Tailwind | 3.4 |
| Validation | Zod | 3.23 |
| Payments | Razorpay (live checkout) · Stripe fields in schema | 2.9 / 15 |
| Video / Reels | Remotion 4 + canvas reel cards | 4.0 |
| Email | Resend | 3.2 |
| Testing | Vitest | 1.6 |
| Deploy | Render (`render.yaml`) | Node ≥ 20 |

---

## Subscription Tiers

### Free — Free forever ✅ Live

| Feature | Detail |
|---|---|
| **Chart Styles** | North Indian (default), South Indian, Sarvatobhadra — all with Transit Overlay |
| **Grahas** | All 9 Navagraha with DMS degrees, nakshatra, pada, dignity, combustion, avastha |
| **Vargas** | D1–D60; all 41 varga schemes in engine (D1–D150) |
| **Dasha Systems** | Vimshottarī (120yr, 6 levels: Maha→Deha), Yoginī (36yr), Chara/Jaimini, Aṣṭottarī |
| **Āruḍhas** | All 12 Bhava Arudhas (AL–A12) + Upapada Lagna |
| **Ṣaḍbala** | All 6 components with visual bars + Rupa totals + Strong/Weak badge |
| **Viṁśopaka Bala** | Four classical systems: Ṣaḍvarga, Saptavarga, Daśavarga, Shoḍaśvarga |
| **Aṣṭakavarga** | SAV total grid + BAV grids for all 7 planets, color-coded |
| **Graha Yogas** | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| **Panchang** | Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika, Abhijit, Hora table |
| **Monthly Calendar** | Full month grid — all days with Tithi/Nakshatra/Yoga/Bhadra; click for detail |
| **Panchang timings** | Choghadiya, Rāhu Kālam, Gulika, Abhijit, Hora — on daily Panchang |
| **Muhūrta Finder** | Gold+ — 7 purposes; date range up to 60 days; graded auspicious windows |
| **Varṣaphal** | Solar Return — year picker, exact return moment UTC, full chart display |
| **Transit Overlay** | Toggle + date picker; current planets overlaid on natal chart |
| **Chart Comparison** | Side-by-side charts + compatibility analysis + 36-point Ashtakoot Gun Milan |
| **Public Sharing** | Toggle public → unique URL + dynamic Open Graph image + SEO metadata |
| **JHD / SJS Import** | Import birth data from Jagannatha Hora (.jhd) or Sri Jyoti Star (.sjs) files |
| **Chart Notes** | Per-chart text annotations with timestamps |
| **Save Charts** | Up to 20 charts per account (free) |
| **Location search** | Photon geocoding + Redis cache; India/Nepal timezone shortcuts |
| **Sarvatobhadra Chakra** | Classical 9×9 predictive grid; transit Vedha analysis; Dhana (financial) pulse meter; body-part resonance alerts; cell-level interaction with row/column vedha glow |
| **Prashna (Horary)** | Oracle compass with remedial directions, ruling planets, KP significators (A–D levels) |
| **Jaimini** | Dedicated Jaimini workspace with Chara Dasha + special aspects |
| **Nakshatra Lab** | Recursive Pada maps, Navtara analysis, Best Days forecasts, activity-specific Muhurta ratings |
| **Planets Workspace** | Interactive dual-chart (D1/D9) view with diagnostic micro-details table |
| **Interactive Aspects** | Parashari Drishti visualized on all chakras with animated lines |
| **Vastu Analysis** | Correlate birth chart with Vastu orientations |

### Gold — ₹99/month or ₹999/year ✅ Live

Everything in Free, plus:

| Feature | Detail |
|---|---|
| **Chart Library** | Save up to 200 charts |
| **PDF & HTML Export** | Print-quality chart export with full planetary table + Dasha tree |
| **Dasha Precision** | Start Vimshottarī from Ascendant or any planet as reference point |
| **Full Aṣṭakūṭa** | 36-point Gun Milan compatibility matching |
| **Chart Notes & Tags** | Annotations + tagging for organization |
| **Bulk Import** | XLSX batch import for chart collections |
| **Advanced Muhūrta** | Extended filtering by Graha hora, Tara, and Panchaka |
| **Muhūrta Finder** | Full `/muhurta` workspace + `/api/muhurta` timeline (middleware-gated) |

### Platinum — ₹199/month or ₹1,999/year ✅ Live

Everything in Gold, plus:

| Feature | Detail |
|---|---|
| **White-label Sharing** | Custom brand name + logo on all public share pages and PDF exports |
| **Admin Dashboard** | Internal metrics, user management, and system health |
| **Client Dashboard** | CRM-style client management — track sessions, active Dasha, notes per client |
| **Custom Ayanamsha** | Set personal default ayanamsha (Lahiri, Raman, Yukteshwar, etc.) |
| **Bulk PDF Export** | Export entire chart collections as a ZIP download |
| **Email chart reports** | Send chart PDF to clients via Resend |
| **Research routes** | `/research` + `/api/research` reserved for Platinum (middleware-gated) |

> Plan enforcement details: see [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md).

---

### 🚀 Latest Improvements (v2.6.x — May 2026) ✅

- **Sarvatobhadra Chakra (SBC)**: Classical 9×9 predictive grid — transit Vedha, Dhana pulse meter, body-part resonance, row/column vedha glow.
- **Vedaansh Reel Studio**: Admin `/admin/reel` — canvas cards (Panchang, Choghadiya, Nakshatra, Muhurta, transits, Rashi forecast, festivals) plus Remotion export (`npm run remotion:studio`, `npm run reel:mp4`).
- **Cosmic Roadmap & Time Scrubber**: `/roadmap` (12-month transit timeline) and `/scrubber` (interactive transit scrubber against natal chart).
- **KP Significators Engine**: Krishnamurti Paddhati significator levels (A–D) for all 12 houses, integrated into Prashna dashboard.
- **Prashna (Horary)**: Oracle compass for remedial directions, ruling planets, KP significators, copy-to-clipboard reports.
- **Vastu Analysis**: Birth chart correlated with classical Vastu directions (`/vastu`).
- **Upagraha Support**: Dhooma, Vyatipata, Parivesha, Indrachapa, Upaketu, and related chain nodes in the engine.
- **Jaimini Workspace**: Dedicated `/jaimini` page — Chara Dasha and Jaimini special aspects.
- **Astrocartography**: Relocation mapping at `/acg` — Cyclo-Carto-Graphy, Local Space, Paran lines, aspect harmonics.
- **Atlas v2**: Photon geocoding API replaces local SQLite — Redis-cached, lighter deploy footprint.
- **Progressive Web App (PWA)**: Service worker + Web App Manifest for installable mobile/desktop experience.
- **Bhava Bala**: BPHS house strength — Adhipati, Dig, Drishti Bala with grid/table/bar UI.
- **Client CRM**: Platinum `/clients` — client records, session notes, remedy tracker, Dasha progress.
- **White-label Sharing**: Platinum `brandName` + `brandLogo` on public share pages and PDF exports.
- **Admin Command Center**: `/admin` — stats, users, charts, revenue, reel tools.
- **i18n (partial)**: Hindi strings for birth forms and planetary tables.

---

## Calculation Engine — 45 Modules

41 core files under `src/lib/engine/` plus 4 Dasha subsystems under `src/lib/engine/dasha/`. Ayanamsha modes live in `ephemeris.ts` (no separate module).

All engine modules are pure TypeScript functions (no side effects). Given the same inputs, they always return the same outputs.

| Module | Status | Description |
|---|---|---|
| `ephemeris.ts` | ✅ | sweph wrapper — Navagraha + Ketu + Ascendant + outers; 7 ayanamsha modes (Lahiri, True Chitra, True Revati, Raman, Yukteshwar, Usha-Shashi, Krishnamurti) |
| `houses.ts` | ✅ | Whole Sign, Placidus, Equal, Bhava Chalita — cusps + bhavas |
| `nakshatra.ts` | ✅ | Basic Nakshatra, Pada, Tithi, Yoga, Karana, Vara, Hora, Rahu/Gulika Kalam |
| `nakshatraAdvanced.ts` | ✅ | Navtara, Panchaka, Muhurta suitability, and Best Days forecasts |
| `nakshatraRemedies.ts` | ✅ | Nakshatra-specific rituals, mantras, and balancing practices |
| `vargas.ts` | ✅ | All 41 varga schemes (D1–D150) — logic corrected for D10, D4, D16, D60 |
| `arudhas.ts` | ✅ | All 12 Bhava Arudhas (AL–A12) + Graha Arudhas with edge-case handling |
| `karakas.ts` | ✅ | Chara Karakas — 7-karaka and 8-karaka schemes (Ke=Scorpio, Ra=Aquarius) |
| `dignity.ts` | ✅ | Exaltation, debilitation, moolatrikona, own, friend, neutral, enemy |
| `shadbala.ts` | ✅ | All 6 components: Sthana, Dig, Kala, Chesta, Naisargika, Drik Bala — returns Rupas |
| `vimsopaka.ts` | ✅ | Vimsopaka Bala — four classical systems: Ṣaḍvarga, Saptavarga, Daśavarga, Shoḍaśvarga |
| `ashtakavarga.ts` | ✅ | Full BPHS bindu tables — SAV totals + BAV grids for all 7 planets |
| `yogas.ts` | ✅ | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| `ashtakoot.ts` | ✅ | 36-point Gun Milan: Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi |
| `varshaphal.ts` | ✅ | Solar Return — bisection search on swisseph for arc-second precision |
| `sunrise.ts` | ✅ | Real astronomical rise/set via `swe_rise_trans` with geographic fallback |
| `bhavaBala.ts` | ✅ | House strength — Adhipati (lord Shadbala), Dig Bala, Drishti Bala for all 12 bhavas |
| `gandanta.ts` | ✅ | Karmic junction detection — Revati/Ashwini, Ashlesha/Magha, Jyeshtha/Mula |
| `pushkara.ts` | ✅ | Pushkara Bhaga and Pushkara Navamsha auspicious degree detection |
| `mrityuBhaga.ts` | ✅ | Death-inflicting degree detection per planet and sign |
| `yogiPoint.ts` | ✅ | Yogi, Sahayogi, Avayogi point calculation for prosperity analysis |
| `advancedInterpretation.ts` | ✅ | AI-style narrative interpretation engine — strengths, cautions, special patterns |
| `doshas.ts` | ✅ | Classical dosha detection (Manglik, Kaal Sarp, Grahan, etc.) |
| `tajika.ts` | ✅ | Tajika annual chart aspects — Ithasala, Ishrafa, Nakta, Yamaya |
| `transits.ts` | ✅ | Real-time transit overlay against natal chart |
| `activeHouses.ts` | ✅ | Activated house detection from current transits + dashas |
| `muhurtaAdvanced.ts` | ✅ | Advanced Muhurta — Tara, Panchaka, Graha Hora filtering |
| `muhurtaAnalysis.ts` | ✅ | Muhurta window analysis with graded suitability |
| `muhurtaPersonal.ts` | ✅ | Personal muhurta suitability scoring for birth chart |
| `astroInterpretation.ts` | ✅ | Elite ACG reading engine — Career, Home, and Love meanings |
| `aspects.ts` | ✅ | Visual Parashari Drishti — standard and special planetary house aspects |
| `astrocartography.ts` | ✅ | NASA-grade relocation: Cyclo-Carto-Graphy, Local Space, Paran lines |
| `kpEngine.ts` | ✅ | Krishnamurti Paddhati — house significators at A (star lord) through D levels |
| `krishneeyam.ts` | ✅ | Krishneeyam — refinement of KP sub-lord theory |
| `sarvatobhadra.ts` | ✅ | Sarvatobhadra Chakra — 9×9 predictive grid with transit Vedha |
| `sbcUseCases.ts` | ✅ | SBC use-case categorization (Dhana, health, travel, etc.) |
| `upagrahas.ts` | ✅ | Upagraha calculation (Dhooma, Vyatipata, Parivesha, Indrachapa, Upaketu, etc.) |
| `astroDetailsDerived.ts` | ✅ | Derived planetary details for UI display |
| `interpretations.ts` | ✅ | General chart interpretations and narrative text |
| `grahaDisplayColors.ts` | ✅ | Standard planetary color mappings for UI rendering |
| `calculator.ts` | ✅ | Main orchestrator — all engines wired, returns `ChartOutput` |
| `dasha/vimshottari.ts` | ✅ | 120yr cycle, 6-level tree (Maha→Antar→Pratyantar→Sukshma→Prana→Deha) |
| `dasha/yogini.ts` | ✅ | 36yr, 8 Yoginis, birth balance from Moon nakshatra position |
| `dasha/chara.ts` | ✅ | Jaimini sign dasha, forward/reverse per parity, birth balance from Lagna degree |
| `dasha/ashtottari.ts` | ✅ | 108yr conditional Dasha — active for Krishna paksha births outside Rahu nakshatra |

---

## Project Structure

```
Vedaansh/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home / Chart form
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── home/                       # Landing page sections
│   │   ├── account/                    # User profile + preferences
│   │   ├── acg/                        # Astrocartography relocation map
│   │   ├── admin/                      # Admin command center
│   │   │   ├── charts/                 # All charts admin view
│   │   │   ├── reel/                   # Social reel studio + Remotion video
│   │   │   ├── revenue/                # Revenue analytics
│   │   │   └── users/                  # User management
│   │   ├── astrology/                  # Astrology workspace
│   │   ├── chart/[slug]/               # Public share page
│   │   ├── clients/                    # Platinum CRM dashboard
│   │   ├── compare/                    # Chart Comparison + Ashtakoot
│   │   ├── forgot/                     # Password reset request
│   │   ├── jaimini/                    # Jaimini workspace
│   │   ├── login/                      # Login page
│   │   ├── muhurta/                    # Muhurta Finder
│   │   ├── my/charts/                  # Saved charts library + bulk import
│   │   ├── nakshatra/                  # Nakshatra Lab workspace
│   │   ├── panchang/                   # Daily Panchang + Calendar
│   │   ├── prashna/                    # Horary (Prashna) dashboard
│   │   ├── pricing/                    # Subscription tiers
│   │   ├── reset-password/             # Password reset form
│   │   ├── roadmap/                    # Cosmic Roadmap (transit timeline)
│   │   ├── sbc/                        # Sarvatobhadra Chakra
│   │   ├── scrubber/                   # Time Scrubber (transit playback)
│   │   ├── signup/                     # Registration
│   │   ├── vastu/                      # Vastu analysis
│   │   ├── verify-email/               # Email verification
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── charts/             # Admin chart CRUD
│   │       │   ├── revenue/            # Revenue data
│   │       │   ├── stats/              # System metrics
│   │       │   └── users/              # User admin
│   │       ├── atlas/search/           # 5.1M location search
│   │       ├── auth/
│   │       │   ├── [...nextauth]/      # NextAuth handler
│   │       │   ├── forgot-password/    # Request reset
│   │       │   ├── refresh-plan/       # Session plan refresh
│   │       │   ├── reset-password/     # Execute reset
│   │       │   ├── signup/             # Email/password register
│   │       │   └── verify-email/       # Verify token
│   │       ├── chart/
│   │       │   ├── astrocartography/   # ACG calculation
│   │       │   ├── bulk-export/        # Bulk PDF ZIP (Plat.)
│   │       │   ├── bulk-import/        # CSV/JSON import (Gold+)
│   │       │   ├── calculate/          # Main chart calculation
│   │       │   ├── delete/             # Owner-only delete
│   │       │   ├── export/             # PDF export (Gold+)
│   │       │   ├── export-xlsx/        # Excel export
│   │       │   ├── list/               # Paginated chart list
│   │       │   ├── notes/              # Per-chart annotations
│   │       │   ├── public/             # GET by slug — no auth
│   │       │   ├── relocate/           # Relocation chart
│   │       │   ├── save/               # Save to MongoDB
│   │       │   ├── send-email/         # Email chart (Gold+)
│   │       │   ├── template/           # Chart templates
│   │       │   ├── toggle-public/      # Share toggle
│   │       │   └── varshaphal/         # Solar Return calc
│   │       ├── clients/                # CRM API (Platinum)
│   │       ├── health/                 # System health check
│   │       ├── muhurta/timeline/       # Muhurta timeline data
│   │       ├── panchang/               # Daily Panchang
│   │       ├── payment/
│   │       │   ├── checkout/           # Razorpay order
│   │       │   └── verify/             # Verify payment
│   │       ├── transit/                # Transit data
│   │       ├── transits/planets/       # Planet-specific transits
│   │       ├── user/
│   │       │   ├── default-chart/      # Default chart pref
│   │       │   └── me/                 # Profile + prefs
│   │       └── webhooks/razorpay/      # Subscription activation
│   ├── lib/engine/                     # 🔑 Core Jyotish engine (43 modules)
│   │   └── dasha/                      # Dasha subsystems
│   ├── lib/db/models/                  # User, Chart, ChartCache, Subscription, etc.
│   ├── lib/atlas/                      # Coordinate helpers (search via Photon API)
│   ├── lib/reel/                       # Canvas reel cards + Remotion metadata
│   ├── lib/pdf/                        # PDF generation
│   ├── components/
│   │   ├── admin/                      # Admin UI components
│   │   ├── chakra/                     # SVG chart renderers
│   │   ├── dasha/                      # DashaTree component
│   │   ├── dashboard/                  # Dashboard widgets
│   │   ├── home/                       # Landing page components
│   │   ├── panchang/                   # Panchang UI
│   │   ├── providers/                  # React context providers
│   │   ├── shell/                      # Layout shell (header, nav, footer)
│   │   └── ui/                         # All shared UI components
│   └── types/astrology.ts              # All TypeScript domain types
├── __tests__/                          # Vitest engine tests
├── ephe/                               # Swiss Ephemeris .se1 files
├── remotion/                           # Remotion compositions (`VedaReel.tsx`)
├── scripts/                            # Admin, reel render, DB utilities
└── SUBSCRIPTION_MATRIX.md              # Plan vs feature enforcement map
```

---

## API Routes

| Route | Status | Description |
|---|---|---|
| `POST /api/chart/calculate` | ✅ | Zod validation → swisseph → all engines → Redis cache (24h) |
| `POST /api/chart/save` | ✅ | Save to MongoDB, optional public slug generation |
| `GET /api/chart/list` | ✅ | Paginated with search, authenticated user only |
| `DELETE /api/chart/delete` | ✅ | Owner-only delete with auth check |
| `GET/POST/DELETE /api/chart/notes` | ✅ | Per-chart annotations |
| `GET /api/chart/public` | ✅ | Fetch public chart by slug |
| `POST /api/chart/toggle-public` | ✅ | Toggle `isPublic`, generate/remove slug |
| `POST /api/chart/varshaphal` | ✅ | Solar Return for given year — bisection search |
| `POST /api/chart/export` | ✅ | PDF chart export (Gold+) |
| `POST /api/chart/bulk-import` | ✅ | XLSX batch import (auth + chart save limits) |
| `POST /api/chart/bulk-export` | ✅ | Bulk PDF ZIP export (Platinum) |
| `GET /api/chart/export-xlsx` | ✅ | Excel chart export |
| `POST /api/chart/relocate` | ✅ | Relocation chart calculation |
| `POST /api/chart/send-email` | ✅ | Email chart PDF (Gold+) |
| `GET /api/chart/template` | ✅ | Chart template presets |
| `POST /api/chart/astrocartography` | ✅ | ACG relocation lines computation |
| `GET /api/panchang` | ✅ | Full Panchang for any date + location, Redis cached 24h |
| `GET /api/atlas/search` | ✅ | Location typeahead — Photon geocoding + Redis cache |
| `GET /api/chart/search` | ✅ | Filter saved charts by name, place, date, gender |
| `GET /api/transit` | ✅ | Current transit positions |
| `GET /api/transits/planets` | ✅ | Planet-specific transit details |
| `GET /api/muhurta/timeline` | ✅ | Muhurta timeline windows |
| `GET /api/user/me` | ✅ | User profile + personal chart + preferences |
| `PATCH /api/user/me` | ✅ | Update user preferences |
| `GET/PATCH /api/user/default-chart` | ✅ | Default chart preference |
| `POST /api/auth/signup` | ✅ | Email/password registration with bcrypt |
| `POST /api/auth/verify-email` | ✅ | Email verification token check |
| `POST /api/auth/forgot-password` | ✅ | Password reset email request |
| `POST /api/auth/reset-password` | ✅ | Execute password reset with token |
| `POST /api/auth/refresh-plan` | ✅ | Refresh user plan in session after upgrade |
| `POST /api/payment/checkout` | ✅ | Razorpay order creation for Gold/Platinum |
| `POST /api/payment/verify` | ✅ | Verify Razorpay payment signature |
| `POST /api/webhooks/razorpay` | ✅ | Activate subscription on payment success |
| `GET/POST /api/clients` | ✅ | CRM client CRUD (Platinum) |
| `GET /api/clients/[id]` | ✅ | Single client detail + session notes (Platinum) |
| `GET /api/health` | ✅ | System health endpoint |
| `GET /api/admin/stats` | ✅ | System-wide metrics (Admin) |
| `GET /api/admin/users` | ✅ | User management (Admin) |
| `GET /api/admin/charts` | ✅ | All charts view (Admin) |
| `GET /api/admin/revenue` | ✅ | Revenue analytics (Admin) |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| All major issues resolved | — | ✅ Stable |

---

## Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | — | DB name (default: `vedaansh`) |
| `AUTH_SECRET` | ✅ | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | App base URL (e.g. `http://localhost:3000` locally) |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis URL (optional; app runs without cache) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis token |
| `RAZORPAY_KEY_ID` | — | Razorpay secret key id |
| `RAZORPAY_KEY_SECRET` | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | Razorpay webhook secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | — | Razorpay publishable key (checkout UI) |
| `STRIPE_SECRET_KEY` | — | Stripe secret (schema ready; checkout uses Razorpay today) |
| `STRIPE_PUBLISHABLE_KEY` | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Stripe client key |
| `RESEND_API_KEY` | — | Resend email API key |
| `FROM_EMAIL` | — | Sender address |
| `EPHE_PATH` | — | Path to `.se1` files (default: `./ephe`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL |
| `NEXT_PUBLIC_APP_NAME` | — | Display name (default: `Vedaansh`) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Canonical public URL (SEO, OG, share links) |

---

## Install & Run

**Requirements:** Node.js ≥ 20 (see `package.json` `engines`).

```bash
npm install
cp .env.example .env.local   # then fill MongoDB, Auth, etc.
```

Download Swiss Ephemeris data files from [astro.com ephe](https://www.astro.com/ftp/swisseph/ephe/) (`sepl_18.se1`, `semo_18.se1`, `seas_18.se1`) into `./ephe/`.

```bash
npm run dev          # http://localhost:3000  (root `/` redirects to `/home`)
```

### Optional scripts

| Command | Purpose |
|---|---|
| `npm run remotion:studio` | Remotion preview for reel compositions |
| `npm run reel:mp4` | Render reel MP4 via `scripts/render-reel.ts` |
| `npm run test:engine` | Vitest engine unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Production build and server |

---

## Testing

```bash
npm run test:engine   # Vitest engine unit tests
npm run test:watch    # Watch mode
npm run typecheck     # TypeScript check
npm run lint
npm run build
```

Tolerances: ±0.005° for longitudes, ±1 day for Dasha dates, exact match for sign placements. **No calculation module ships until all reference chart tests pass.**

---

## Development Roadmap

| Phase | Status | Deliverable |
|---|---|---|
| 1 — Engine Foundation | ✅ Complete | All 33 calc modules + Vitest suite |
| 2 — Atlas + Auth + DB | ✅ Complete | MongoDB live, NextAuth, 5.1M atlas |
| 3 — Frontend + Chakras | ✅ Complete | All SVG renderers, Dasha tree, full UI |
| 4 — Free Tier Launch | ✅ Complete | Free tier live at vedaansh.com |
| 5 — Gold Features | ✅ Complete | Razorpay, PDF export, bulk import, multi-device sync |
| 6 — Platinum Launch | ✅ Complete | Nakshatra workspace, 41 vargas in UI, both paid tiers live |
| 7 — Horā Core | ✅ Complete | Bhava Bala, Client CRM, White-label, Email Charts |
| 8 — Scale + Polish | ✅ Complete | Astrocartography, Admin Dashboard, PWA, i18n (partial) |
| 9 — Elite Analysis | ✅ Complete | Interactive Aspects, Prashna Professional, CRM v2 |
| 10 — Sarvatobhadra & Ecosystem | ✅ Complete | SBC, Vastu, Jaimini, KP Engine, Reel studio, Upagrahas |

### Remaining Work

- [ ] **Full i18n** — Hindi/Sanskrit rollout for all UI components and tables
- [ ] **Research workspace** — `/research` routes gated in middleware; UI not shipped yet
- [ ] **Stripe checkout** — User model supports Stripe; live billing is Razorpay-only today

---

## The Golden Rule

> **Validate → Test → Build UI → Ship. In that order, every single time.**  
> One wrong Dasha date or planet degree destroys user trust permanently.  
> Never build the UI for a feature until its calculation module passes all reference chart tests.

---

## License

Private project — all rights reserved.

---

*Jyotiṣa — The Eye of the Vedas*  
*v2.6.0 · May 2026 · [Vedaansh Platform](https://github.com/abhishek081999/Vedaansh)*