# Vedaansh — System Design

**Product:** `jyotish-platform` v2.6.0  
**App:** Vedic astrology (Jyotish) SaaS — birth charts, dashas, vargas, panchang, muhurta, CRM, admin  
**Source of truth:** live codebase (`package.json`, `src/`, `proxy.ts`, `render.yaml`)

---

## 1. Summary

Vedaansh is a **Next.js 16 monolith** (App Router, Node ≥ 24) with a hard boundary between:

| Layer | Role |
|-------|------|
| Presentation | React pages + client panels |
| Edge proxy | Auth, plan route gates, CSP (`proxy.ts`) |
| API | Security-first REST handlers |
| Engine | Pure Swiss Ephemeris math (`src/lib/engine/**`) |
| Data | MongoDB Atlas + Upstash Redis |
| Externals | Razorpay, Resend, Google OAuth, geocoders |

**Architectural invariant:** the engine has **no** React / MongoDB / Redis / NextAuth imports. API routes own auth, plan gates, caching, and persistence. Plan entitlement is read from **MongoDB** via `getEffectivePlan()` — not trusted from JWT alone.

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / PWA (Serwist) / Android TWA                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  proxy.ts (Next.js 16)                                      │
│  Auth session · Gold/Platinum page+API gates · Admin · CSP  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  App Router pages (src/app/**/page.tsx)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  API routes (src/app/api/**) — Node runtime                 │
│  guardRoute → auth → plan gate → Zod → business logic       │
└───────┬─────────────┬──────────────┬────────────┬───────────┘
        │             │              │            │
        ▼             ▼              ▼            ▼
   Jyotish       MongoDB         Upstash      Razorpay /
   engine        Atlas           Redis        Resend /
   (sweph)                                    Google /
                                              Geocoders
```

### Runtime notes

- Chart / ephemeris APIs use **`runtime = 'nodejs'`** — `sweph` is a native C addon (not Edge-compatible).
- Deploy: **Render** (Singapore), health check `/api/health`, `EPHE_PATH=./ephe`.

---

## 3. Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.3 App Router |
| Language | TypeScript 5.4+ · Node ≥ 24 |
| UI | React 19, Radix, Framer Motion, Leaflet (ACG maps), Tailwind 4 |
| Ephemeris | `sweph` + files in `./ephe` |
| DB | MongoDB Atlas + Mongoose 8.24 |
| Auth | NextAuth.js v5 (Google + credentials) |
| Cache / rate limits | Upstash Redis |
| Validation | Zod 4.6.7 |
| Payments | Razorpay (live); Stripe fields reserved |
| Email | Resend |
| Video | Remotion 4 + ffmpeg.wasm (browser MP4) |
| PWA | Serwist |
| Tests | Vitest (`__tests__/engine`, `__tests__/security`) |
| Edge gates | `proxy.ts` (auth, plan, CSP) |

---

## 4. Layer map

### Presentation (`src/app/`, `src/components/`)

- ~43 App Router pages (home, chart, panchang, muhurta, compare, prashna, jaimini, sbc, acg, vastu, nakshatra, numerology, clients, account, admin, legal, etc.)
- Chart workspace panels, chakras, dashboards
- Platinum Client CRM UI
- Admin: users, charts, revenue, billing, audit, reel studio
- Client-side: localStorage (milan history, numerology readings), device location for atlas

### Edge proxy (`proxy.ts`)

Runs before matched requests (skips RSC/prefetch flight requests):

1. Rate-limit NextAuth POST (except signup / forgot / reset / verify)
2. Admin pages/APIs → require `role === 'admin'`
3. Protected APIs → require session
4. Gold APIs/pages → `getEffectivePlanForUserId` ≠ free (`/muhurta`, `/api/muhurta`, `/api/chart/export`)
5. Platinum APIs/pages → platinum only (`/research`, `/api/research` — **reserved; UI not shipped**)
6. Protected pages → login redirect
7. `withDocumentCsp` — per-request CSP nonces

Protected page prefixes include: `/chart`, `/my`, `/muhurta`, `/research`, `/account`.

### API + security (`src/app/api/**`, `src/lib/security/**`)

Typical handler order:

1. `guardRoute(req, routeSecurityPresets.*())` — body limit, same-origin (writes), rate limit
2. `auth()` — session when required
3. `requirePlanGate(userId, 'gold' | 'platinum')` — Mongo plan check
4. Zod `safeParse`
5. `connectDB()` + scoped queries
6. JSON `{ success, error }`

Presets live in `src/lib/security/presets.ts` (chart read/write/heavy/import, auth, payment, admin, webhook, etc.).

Redis down → rate limits **fail open** (documented).

### Domain engine (`src/lib/engine/**`)

~76 top-level modules + `dasha/` subsystems (pure). Orchestrator: `calculateChart()` in `calculator.ts`.

Approximate stages:

| Stage | Modules |
|-------|---------|
| Time / space | JD, sunrise, timezone → UTC |
| Ephemeris | positions, ayanamsha, sidereal, nodes |
| Houses | whole sign / placidus / etc., Sripati, special lagnas |
| Core graha | nakshatra, dignity, yuddha, combust, upagrahas |
| Structure | vargas, arudhas, karakas, ashtakavarga |
| Strength | shadbala, bhavaBala, vimsopaka, Jaimini bala |
| Time lords | Vimshottari, Yogini, Chara, Ashtottari, Mandook/Sthir |
| KP / extras | significators, yogas, gandanta, pushkara, yogi |
| Output | `ChartOutput` + interpretations |

Plan filtering: `filterChartVargasForPlan` (16 Shodashavarga vs full 41 suite on Platinum).

---

## 5. Core request flow — chart calculate

`POST /api/chart/calculate`

| Step | Component | What happens |
|------|-----------|--------------|
| 1 | Client UI | Birth data + settings |
| 2 | guardRoute | Rate limit / body / origin |
| 3 | auth() | Optional session → UserPlan from Mongo |
| 4 | Zod | `ChartInputSchema` |
| 5 | Redis | `chartCacheKey` hit → return |
| 6 | `calculateChart()` | Full engine pipeline |
| 7 | Plan filter | Vargas by plan |
| 8 | Redis write | Gzip large JSON; serial write queue (OOM safety) |
| 9 | Response | `{ success: true, data }` |

---

## 6. Feature domains

### Astrology product

| Domain | Surface |
|--------|---------|
| Charts | `/chart/[slug]`, calculate, save, public share, notes, relocate, varshaphal, ACG |
| Panchang | `/panchang`, calendar, transit APIs |
| Muhurta | `/muhurta` + `/api/muhurta/*` (Gold+) |
| Compare / Milan | `/compare` — Ashtakoot, Porutham, dosha, charts, dasha, and panchang on Free; match-making, married life, All Sections, and print on Gold+ |
| Today | `/today` — personal daily reading for the loaded chart (noindex) |
| Relationship and marriage | `/relationship` (noindex, needs a loaded chart) — D1 and score preview on Free; full reading on Gold+; extended divisionals on Platinum |
| Career and profession | `/career` (noindex, needs a loaded chart) — scores on Free; full reading and professional method on Gold+ |
| Jaimini / KP / Prashna | `/jaimini`, `/prashna` |
| SBC / ACG / Vastu | `/sbc`, `/acg`, `/vastu` |
| Nakshatra | `/nakshatra/[tab]` |
| Numerology | `/numerology` |

### Platform / ops

| Domain | Surface |
|--------|---------|
| Auth | Google OAuth + credentials, verify email, forgot/reset password |
| Billing | Razorpay checkout / verify / webhook; coupon validate |
| Account | Plan, export, cancel, white-label |
| Clients CRM | Platinum — notes, remedies, sessions |
| Admin | Users, charts, revenue, billing, audit, broadcast, Redis cleanup |
| Reels | Remotion studio + ffmpeg.wasm browser encode |
| Location atlas | `/api/atlas/search` — Photon / Open-Meteo / Nominatim + Redis cache |
| Health | `/api/health` |

---

## 7. API route inventory (55 handlers)

### Auth
- `/api/auth/[...nextauth]`
- `/api/auth/signup`, `verify`, `verify-email`, `forgot-password`, `reset-password`, `refresh-plan`

### Chart
- `calculate`, `save`, `list`, `search`, `delete`, `[id]`, `public`, `toggle-public`
- `notes`, `template`, `relocate`, `varshaphal`, `astrocartography`
- `export`, `export-xlsx`, `bulk-import`, `bulk-export`, `send-email`

### User / subscription / payment
- `/api/user/me`, `account`, `export`, `default-chart`, `subscription`, `subscription/cancel`
- `/api/subscription/pricing`, `coupon/validate`
- `/api/payment/checkout`, `verify`
- `/api/webhooks/razorpay`

### Ephemeris / tools
- `/api/panchang`, `/api/transit`, `/api/transits/planets`
- `/api/muhurta/timeline`, `/api/muhurta/report`
- `/api/atlas/search`
- `/api/clients`, `/api/clients/[id]`
- `/api/health`

### Admin
- `/api/admin/stats`, `users`, `users/[id]`, `charts`, `charts/[id]`
- `revenue`, `billing`, `audit`, `broadcast`, `cleanup`

---

## 8. Data model

| Collection | Owns | Relations |
|------------|------|-----------|
| **User** | plan, `planExpiresAt`, prefs, devices (≤3), OAuth, brand (Platinum) | `defaultChartId` → Chart |
| **Chart** | Birth data (string date/time), settings, slug, notes, tags | `userId`; `cachedDataId` → ChartCache |
| **ChartCache** | Full `ChartOutput` blob | `chartId` → Chart |
| **Client** | CRM profile, birth, remedies, sessions (Platinum) | `userId` = consultant |
| **Subscription** | Billing lifecycle | User / Razorpay |
| **BillingConfig** | Admin pricing / coupons | Pricing APIs |
| **AdminAuditLog** | Admin mutation trail | admin userId |

Models: `src/lib/db/models/*`.

---

## 9. Subscription (enforced)

| Feature | Free | Gold | Platinum |
|---------|------|------|----------|
| Core chart calc | Yes | Yes | Yes |
| Vargas | 16 | 16 | Full 41 |
| Save limit | 20 | 200 | Unlimited |
| Public share | Yes | Yes | Yes |
| PDF/HTML export | No | Yes | Yes |
| Muhurta | No | Yes | Yes |
| Relationship and marriage | Preview | Full | Full, plus extended divisionals |
| Kundali Milan match-making and married life | Preview | Full, with All Sections and print | Full, with All Sections and print |
| Email chart / bulk ZIP | No | No | Yes |
| Client CRM | No | No | Yes |
| White-label | No | No | Yes |

- Canonical plans: `free` | `gold` | `platinum`
- Expiry: `planExpiresAt` past → behaves as free (`getEffectivePlan`)
- Matrix detail: `SUBSCRIPTION_MATRIX.md`
- Dual enforcement: **proxy** (pages/APIs) + **route** `requirePlanGate` + **UI** `userPlan` teasers

---

## 10. Security pipeline

```
Body size → Same-origin (writes) → Rate limit (Redis)
  → Session auth → Plan gate (Mongo) → Zod → Scoped DB
```

Also: login throttle, password policy, admin role checks, CSP nonces via proxy, security event logging.

---

## 11. Caching

| Key pattern | Purpose |
|-------------|---------|
| Chart cache keys | Full calculated chart JSON (gzip when large) |
| `atlas:*` | Geocode / reverse geocode |
| `tz:*` | Timezone lookups |
| Rate-limit buckets | Abuse control |

Admin cleanup can clear chart / panchang / atlas Redis namespaces.

---

## 12. External dependencies & deploy

| Service | Role | Config |
|---------|------|--------|
| Render | Web service (Singapore) | `render.yaml` |
| MongoDB Atlas | Primary store + Auth adapter | `MONGODB_URI` |
| Upstash Redis | Rate limits + cache | `UPSTASH_REDIS_REST_*` |
| Swiss Ephemeris | Planet positions | `EPHE_PATH=./ephe` |
| Razorpay | Checkout / webhooks | `RAZORPAY_*` |
| Resend | Auth + chart email | `RESEND_API_KEY` |
| Google OAuth | Social sign-in | `AUTH_GOOGLE_*` |
| Photon / Open-Meteo / Nominatim | Location search | via `/api/atlas/search` |
| Remotion | Admin reel video | `remotion/` |

Production checklist: `docs/SECURITY_DEPLOY.md`.

---

## 13. Directory cheat sheet

| Path | Responsibility |
|------|----------------|
| `src/app/` | Pages + API |
| `src/components/` | React UI |
| `src/lib/engine/` | Pure astrology math |
| `src/lib/security/` | Guards, rate limits, plan gates, CSP |
| `src/lib/subscription/` | Entitlements + pricing |
| `src/lib/db/` | Mongoose + connection |
| `src/lib/pdf/` | HTML report builders |
| `src/lib/reel/` | Reel helpers + ffmpeg bridge |
| `src/lib/atlas/` | Coordinate helpers (+ optional local `.db`) |
| `src/lib/panchang/` | Panchang helpers beyond core engine |
| `src/types/astrology.ts` | `GrahaId`, `Rashi`, `ChartOutput`, `UserPlan` |
| `proxy.ts` | Edge auth / plan / CSP |
| `__tests__/engine|security/` | Vitest |
| `.cursor/rules/` | Agent layer conventions |

---

## 14. Design summary

Vedaansh is a **single Node service** with a pure ephemeris core, a security-first API, and edge-level plan gating. Monetization is free / gold / platinum; persistence is MongoDB; Redis accelerates cache and abuse control. Client apps include web PWA and Android TWA; admin tooling includes CRM ops and Remotion reels.

---

*Generated from live codebase for download / sharing. Prefer this file over README version claims when they disagree.*

**Doc set:** [README.md](./README.md) · [API.md](./API.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [PRODUCT.md](./PRODUCT.md) · [RUNBOOK.md](./RUNBOOK.md) · [TESTING.md](./TESTING.md) · [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md) · [adr/](./adr/)
