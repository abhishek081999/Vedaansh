# AGENTS.md — Vedaansh

Context for coding agents working in this repo. **Trust live code over README/docs** when they disagree (README versions are often stale).

## What this is

**Vedaansh** (`jyotish-platform` v2.6.0) is a Vedic astrology (Jyotish) web app: birth charts, dashas, vargas, panchang, muhurta, prashna, SBC, astrocartography, client CRM, and admin tools. Calculations use **Swiss Ephemeris** via the `sweph` npm package.

## Stack (verify in `package.json`)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router (`src/app/`) |
| Language | TypeScript 5.4+, Node ≥ 24 |
| Ephemeris | `sweph` — files in `./ephe` (`EPHE_PATH`) |
| Database | MongoDB Atlas + Mongoose (`src/lib/db/`) |
| Auth | NextAuth.js v5 (`src/app/api/auth/`) |
| Cache / rate limits | Upstash Redis (`@upstash/redis`) |
| Validation | Zod 3 |
| Payments | Razorpay (live); Stripe fields exist but checkout not wired |
| Email | Resend |
| Video | Remotion 4 (`remotion/`, `src/lib/reel/`) |
| Tests | Vitest (`__tests__/`) |
| Deploy | Render — see `docs/SECURITY_DEPLOY.md`, `render.yaml` |

## Key directories

```
src/
  app/              # Pages + API routes (App Router)
  app/api/          # REST handlers — security-first (see rule: nextjs-api)
  components/       # React UI — client panels, chakras, dashboards
  lib/engine/       # Pure astrology math — no DB/React (see rule: engine)
  lib/security/     # Route guards, rate limits, plan gates, CSRF
  lib/subscription/ # Entitlements, pricing
  lib/db/models/    # Mongoose schemas (User, Chart, etc.)
  types/astrology.ts # Core domain types (GrahaId, Rashi, ChartOutput)
__tests__/engine/   # Pure engine tests
__tests__/security/ # Security unit tests
.cursor/rules/      # Cursor agent rules (read before large changes)
```

## Subscription tiers

Canonical plan names: `free` | `gold` | `platinum`.

| Plan | Chart saves | Notable gates |
|------|-------------|---------------|
| Free | 20 | Core chart, panchang, public share |
| Gold | 200 | PDF/HTML export, muhurta APIs (`/muhurta`, `/api/muhurta`) |
| Platinum | Unlimited | Email charts, bulk ZIP, client CRM, white-label branding |

**Enforcement:** `getEffectivePlan()` reads MongoDB (not JWT). API routes use `requirePlanGate()` from `src/lib/security/planAccess.ts`. Full matrix: [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md).

Expired paid plans downgrade to free via `planExpiresAt` in `src/lib/subscription/entitlements.ts`.

## Commands

```bash
npm run dev              # Next dev (webpack)
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint, zero warnings
npm run test:engine      # Vitest — engine tests
npm run test:security    # Vitest — security tests
npm run remotion:studio  # Reel video editor
```

## Environment

Copy `.env.example` → `.env.local`. Critical vars:

- `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (enables rate limits; auth fails open if Redis is down)
- `EPHE_PATH=./ephe`
- `RAZORPAY_*`, `RESEND_API_KEY`

Production checklist: `docs/SECURITY_DEPLOY.md`.

## Agent conventions

### Cursor rules (`.cursor/rules/`)

| Rule | Scope |
|------|-------|
| `core-doctrine.mdc` | Always — research-first, autonomous execution |
| `nextjs-api.mdc` | `src/app/api/**` |
| `engine.mdc` | `src/lib/engine/**` |
| `react-ui.mdc` | `src/components/**` |
| `tests.mdc` | `__tests__/**` |

### Critical patterns

1. **API routes** — `guardRoute(req, routeSecurityPresets.*())` before business logic; Zod `safeParse`; `{ success, error }` JSON.
2. **Engine** — Pure functions; sidereal longitudes via `getAyanamsha` + `toSidereal`; types from `@/types/astrology`; GrahaId codes (`Su`, `Mo`, …).
3. **UI** — `'use client'` when using hooks; CSS vars (`var(--gold)`, `var(--surface-2)`); `userPlan` prop for visual gating (API must enforce too).
4. **Tests** — Engine tests must not import redis/mongoose/next-auth (Windows Vitest segfault risk). See `__tests__/engine/phase2.test.ts`.

### Domain types

- `GrahaId`: `'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke' | …`
- `Rashi`: `1`–`12` (Aries = 1)
- `UserPlan`: `'free' | 'gold' | 'platinum'`
- Main orchestrator: `calculateChart()` in `src/lib/engine/calculator.ts` → `ChartOutput`

### Do not

- Add React/DB/Redis imports to `src/lib/engine/**`
- Skip route security on new endpoints
- Trust README version numbers — check `package.json`
- Commit `.env` or secrets

## Further reading

- [`README.md`](./README.md) — feature list and engine module inventory
- [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md) — enforced entitlements by plan
- [`docs/SECURITY_DEPLOY.md`](./docs/SECURITY_DEPLOY.md) — production security
