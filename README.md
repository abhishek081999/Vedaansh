# Vedaansh — Vedic Jyotish Platform

> **Next.js 16 · TypeScript · MongoDB · Mongoose · NextAuth.js v5 · sweph**  
> **Free · Gold (₹168/mo · ₹1,443/yr) · Platinum (₹336/mo · ₹2,888/yr)**  
> Default list prices from `src/lib/subscription/pricing.ts` (admin `BillingConfig` may override).

A full-featured Vedic astrology (Jyotish) web platform in TypeScript: arc-second ephemeris, dashas, divisional charts, Ashtakavarga, Shadbala, muhurta, SVG chakras — powered by Swiss Ephemeris via the **`sweph`** npm package.

**Status:** v2.6.0 live. Remaining: full i18n rollout; Research UI; Stripe checkout (schema only).

**Docs:** [`docs/README.md`](./docs/README.md) — system design, API, data model, product, runbook, testing, ADRs. When versions disagree, trust `package.json` and live code.

---

## Tech Stack

| Layer | Technology | Version (from `package.json`) |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.8 |
| UI | React | 19.2.7 |
| Language | TypeScript | ^5.4.5 · Node ≥ 24 |
| Ephemeris | sweph (Swiss Ephemeris) | ^2.10.3-5 |
| Database | MongoDB Atlas + Mongoose | ^6.21 / 8.24.1 |
| Auth | NextAuth.js v5 | ^5.0.0-beta.32 |
| Cache / rate limits | @upstash/redis | ^1.38.0 |
| Geo / Atlas | Photon + Open-Meteo / Nominatim + Redis + `tz-lookup` | — |
| Styling | Custom CSS + Tailwind | ^4.1.11 |
| Validation | Zod | 3.25.76 |
| Payments | Razorpay (live) · Stripe fields reserved | ^2.9.6 / ^15 |
| Video / Reels | Remotion 4 | ^4.0.448 |
| Email | Resend | ^3.2.0 |
| Testing | Vitest | ^4.1.8 |
| Deploy | Render (`render.yaml`) | see [docs/SECURITY_DEPLOY.md](docs/SECURITY_DEPLOY.md) |
| Edge / gates | `proxy.ts` | Auth, plan routes, CSP nonces |

---

## Subscription Tiers

Canonical plans: `free` | `gold` | `platinum`. Enforcement matrix: [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md).

### Free

| Feature | Detail |
|---|---|
| **Chart styles** | North Indian, South Indian, Sarvatobhadra — transit overlay |
| **Grahas** | Navagraha with DMS, nakshatra, pada, dignity, combustion, avastha |
| **Vargas** | 16 Shodashavarga in UI (engine has full 41; Platinum unlocks full suite) |
| **Dashas** | Vimshottari, Yogini, Chara/Jaimini, Ashtottari |
| **Strengths** | Arudhas, Shadbala, Vimsopaka, Ashtakavarga, yogas |
| **Panchang** | Daily + monthly calendar; timings (Choghadiya, Rahu Kalam, etc.) |
| **Tools** | Compare / Ashtakoot, Prashna (Satpanchasika free), Jaimini, ACG, Vastu preview, Nakshatra lab teasers, Numerology |
| **Library** | Save up to **20** charts; public share; notes; JHD/SJS import; location search |

### Gold — ₹168/month or ₹1,443/year

Everything in Free, plus:

| Feature | Detail |
|---|---|
| **Chart library** | Save up to **200** charts |
| **PDF / HTML export** | `/api/chart/export` (also gated in `proxy.ts`) |
| **Muhurta** | Full `/muhurta` + `/api/muhurta/*` (Gold+) |
| **UI depth** | Full dasha “More”, Cosmic Weather, Vastu, SBC, Prashna Kerala/Vedic/KP, Nakshatra profession/medical, planetary panels (see matrix) |

### Platinum — ₹336/month or ₹2,888/year

Everything in Gold, plus:

| Feature | Detail |
|---|---|
| **Vargas** | Full **41**-suite |
| **Library** | Unlimited saves |
| **White-label** | `brandName` / `brandLogo` on public share + exports |
| **Client CRM** | `/clients` + `/api/clients` |
| **Email charts** | `/api/chart/send-email` |
| **Bulk ZIP export** | `/api/chart/bulk-export` |
| **Research** | `/research` + `/api/research` reserved in `proxy.ts` — **UI not shipped** |

Bulk XLSX import is available to any authenticated user until the plan save cap is reached.

---

## Highlights (v2.6.x)

- Sarvatobhadra Chakra, Prashna, Jaimini, KP significators, Vastu, ACG
- Reel studio (admin Remotion + canvas cards)
- Cosmic roadmap `/roadmap` and time scrubber `/scrubber`
- PWA (Serwist) + Android TWA packaging
- Atlas via Photon / Open-Meteo / Nominatim + Redis (not local SQLite)
- Admin: users, charts, revenue, billing, audit, broadcast, cleanup

---

## Calculation engine

Pure TypeScript under `src/lib/engine/` (~76 top-level modules + `dasha/` subsystems). No React / Mongo / Redis / NextAuth imports. Orchestrator: `calculateChart()` → `ChartOutput`.

| Area | Examples |
|---|---|
| Time / space | JD, sunrise, timezone |
| Ephemeris | `sweph` wrapper, ayanamsha, sidereal, nodes, upagrahas |
| Houses / structure | Whole sign / Placidus / etc., vargas, arudhas, karakas |
| Strength | Shadbala, bhava bala, vimsopaka, ashtakavarga |
| Time lords | Vimshottari, Yogini, Chara, Ashtottari |
| Extras | Yogas, KP, SBC, muhurta, gandanta, pushkara, ACG |

Detailed module inventory lives in git history / code; prefer reading `src/lib/engine/` and `__tests__/engine/`. Architecture: [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md).

---

## Project structure

```
Vedaansh/
├── src/
│   ├── app/                 # App Router pages + api/
│   ├── components/          # React UI
│   ├── lib/engine/          # Pure Jyotish math
│   ├── lib/security/        # guardRoute, rate limits, plan gates, CSP
│   ├── lib/subscription/    # Entitlements + pricing
│   ├── lib/db/models/       # User, Chart, ChartCache, Client, Subscription, …
│   ├── lib/atlas|pdf|reel/  # Location, PDF, Remotion helpers
│   └── types/astrology.ts   # Domain types
├── __tests__/               # engine, security, admin, ui
├── docs/                    # Full documentation set
├── ephe/                    # Swiss Ephemeris .se1 files
├── remotion/                # Reel compositions
├── proxy.ts                 # Auth / plan / CSP (Next.js 16)
├── render.yaml              # Render deploy
├── AGENTS.md                # Agent conventions
├── SUBSCRIPTION_MATRIX.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

---

## API routes

**55** handlers under `src/app/api/`. Full inventory (auth, plan gates, methods): [`docs/API.md`](./docs/API.md).

Notable:

| Route | Notes |
|---|---|
| `POST /api/chart/calculate` | Optional auth; Redis cache; plan filters vargas |
| `POST /api/chart/save` | Soft save-cap by plan |
| `POST /api/chart/export` | **Gold+** |
| `POST /api/chart/send-email` | **Platinum** |
| `POST /api/chart/bulk-export` | **Platinum** |
| `GET/POST /api/muhurta/*` | **Gold+** |
| `GET/POST /api/clients` | **Platinum** |
| `POST /api/payment/checkout` · `verify` · `webhooks/razorpay` | Razorpay |
| `GET /api/health` | Liveness |

Typical handler order: `guardRoute` → `auth()` → `requirePlanGate` → Zod → DB/engine → `{ success, error }`.

---

## Environment

```bash
cp .env.example .env.local
```

Critical: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL` (use `http://localhost:3000` locally), `EPHE_PATH=./ephe`, Upstash Redis (production rate limits), `RAZORPAY_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_BASE_URL`.

Full table and production checklist: [`.env.example`](./.env.example), [`docs/SECURITY_DEPLOY.md`](./docs/SECURITY_DEPLOY.md), [`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

---

## Install & run

**Requirements:** Node.js ≥ 24.

```bash
npm ci
cp .env.example .env.local   # fill values
# Place Swiss Ephemeris .se1 files in ./ephe/
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm run test:engine` | Vitest suite |
| `npm run test:security` / `security:preflight` | Security unit tests |
| `npm run build` / `npm start` | Production |
| `npm run remotion:studio` | Reel editor |
| `npm run test:mongo` | Atlas connectivity |

Testing strategy: [`docs/TESTING.md`](./docs/TESTING.md). Contributing: [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Development roadmap

| Phase | Status |
|---|---|
| 1–10 Engine → Free → Gold → Platinum → SBC / ecosystem | Complete (v2.6.0) |

### Remaining

- [ ] Full i18n (Hindi / Sanskrit / etc.)
- [ ] Research workspace UI (`/research` gated; not shipped)
- [ ] Stripe checkout (schema reserved; live billing is Razorpay)

---

## The golden rule

Validate → test → build UI → ship. Wrong degrees or dasha dates destroy trust. Do not ship UI for a calculation until engine tests for that path pass.

---

## License

Private project — all rights reserved.

---

*Jyotisha — The Eye of the Vedas*  
*v2.6.0 · Prefer [`docs/`](./docs/) for architecture and ops · [Vedaansh](https://github.com/abhishek081999/Vedaansh)*
