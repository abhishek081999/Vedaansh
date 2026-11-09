# AGENTS.md — Vedaansh

Context for coding agents working in this repo. **Trust live code over docs** when they disagree — verify stack in `package.json`, plans in `pricing.ts` / `entitlements.ts`, routes in `src/app/api/`.

## What this is

**Vedaansh** (`jyotish-platform` v2.6.0) is a Vedic astrology (Jyotish) web app: birth charts, dashas, vargas, panchang, muhurta, Kundali Milan, relationship and marriage, career and profession, prashna, Jaimini, Nadi, SBC, astrocartography, client CRM, and admin tools. Calculations use **Swiss Ephemeris** via the `sweph` npm package. Stack pin: Next.js 16.4.2, React 19.2.7, Zod 4.6.7.

## Stack (verify in `package.json`)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.4.2 App Router (`src/app/`) |
| Language | TypeScript 5.4+, Node ≥ 24 |
| Ephemeris | `sweph` — files in `./ephe` (`EPHE_PATH`) |
| Database | MongoDB Atlas + Mongoose (`src/lib/db/`) |
| Auth | NextAuth.js v5 (`src/app/api/auth/`) |
| Cache / rate limits | Upstash Redis (`@upstash/redis`) |
| Validation | Zod 4.6.7 |
| Payments | Razorpay (live); Stripe fields exist but checkout not wired |
| Email | Resend |
| Video | Social Studio browser MP4 + Remotion CLI (`remotion/`, `npm run reel:mp4`) |
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
  lib/db/models/    # User, Chart (+ ChartCache), KundaliMilan, Client, Subscription, BillingConfig, AdminAuditLog
  types/astrology.ts # Core domain types (GrahaId, Rashi, ChartOutput)
__tests__/engine/   # Pure engine tests
__tests__/security/ # Security unit tests
.cursor/rules/      # Cursor agent rules (read before large changes)
```

## Subscription tiers

Canonical plan names: `free` | `gold` | `platinum`.

| Plan | Chart saves | Default price (INR) | Notable gates |
|------|-------------|---------------------|---------------|
| Free | 20 charts and 20 Kundali Milan matches | — | Core chart, panchang, public share, Milan preview, Interpretation hub teaser |
| Gold | 200 charts and 200 Kundali Milan matches | ₹168/mo · ₹1,443/yr | PDF/HTML export, muhurta (`/muhurta`, `/api/muhurta`), full Interpretation hub, relationship and marriage, career and profession, Kundali Milan match-making and married life, marriage gochar windows |
| Platinum | Unlimited charts and Kundali Milan matches | ₹336/mo · ₹2,888/yr | Email charts, bulk ZIP, client CRM, white-label, full 41 vargas |

Prices: `src/lib/subscription/pricing.ts` (admin `BillingConfig` may override).

**Enforcement:** `getEffectivePlan()` reads MongoDB (not JWT). API routes use `requirePlanGate()` from `src/lib/security/planAccess.ts`. Full matrix: [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md).

Expired paid plans downgrade to free via `planExpiresAt` in `src/lib/subscription/entitlements.ts`.

## Commands

```bash
npm run dev              # Next dev (webpack)
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint, zero warnings
npm run test:engine      # vitest run — full suite (engine, security, admin, ui)
npm run test:security    # Vitest — security tests only
npm run remotion:studio  # Reel video editor
```

## Environment

Copy `.env.example` → `.env.local`. Critical vars:

- `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (enables rate limits; rate limits fail open if Redis is down)
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
3. **UI** — `'use client'` when using hooks; CSS vars (`var(--gold)`, `var(--surface-2)`); `userPlan` prop for visual gating (API must enforce too). Prefer shared viz (`src/components/ui/viz`) and `PlanGate` for Gold teasers.
4. **Tests** — Engine tests must not import redis/mongoose/next-auth (Windows Vitest segfault risk). See `__tests__/engine/phase2.test.ts`.

### Hindi / i18n (in progress — whole site is the goal)

- **URLs:** English is unprefixed (`/panchang`), Hindi is `/hi/panchang`. Pages do **not** live under `app/[locale]`: `src/proxy.ts` strips `/hi`, rewrites to the same page and passes the locale in the `x-vedaansh-locale` header. `NEXT_LOCALE` cookie keeps a Hindi visitor in Hindi on unprefixed links.
- **Navigation:** import `Link`, `usePathname`, `useRouter` from `@/i18n/navigation`, never from `next/link` / `next/navigation`. `usePathname()` returns the path without `/hi`.
- **Text:** `messages/{en,hi}/<namespace>.json` (namespaces listed in `src/i18n/messages.ts`). Use `useTranslations('ns.section')` (client or server) and keep ids/hrefs in code, copy in JSON. Missing Hindi keys fall back to English; `__tests__/ui/i18n.test.ts` fails on any key, placeholder or list-length mismatch.
- **Client bundles:** the root layout ships only `ROOT_CLIENT_NAMESPACES`. A feature page wraps its client panels in `<IntlScope namespaces={[...]}>` for its own strings.
- **Jyotish terms:** `src/i18n/jyotish.ts` is the single glossary (graha, rashi, nakshatra, tithi, yoga, karana, masa, samvatsara…). Pure — the engine may import it. Use `termHi()` for engine names, `masaHi()` for months (they clash with nakshatras).
- **SEO copy:** Hindi intros live in `src/lib/seo/intro-content.hi.ts`. Root metadata emits canonical + hreflang per locale; a page that sets its own `alternates.canonical` must point Hindi at `/hi/...` once that page is translated.
- **Engine text:** getters and builders take an optional `lang: EngineLang` (`src/lib/engine/lang.ts`, default `'en'`). Hindi lives in same-shaped tables in `src/lib/engine/locale/*.hi.ts`; `overlay()` swaps string fields only, so ids/enums/numbers stay English and English output is byte-for-byte unchanged (engine tests check it). Display-only fields added for Hindi: `label` / `labelText` / `verdictLabel` — compare on `id` / `label` enums, never on display text.
- **Translated so far:** app shell, home, Panchang (+ calendar), Today's Reading, daily horoscope, full chart workspace (dashboard, dasha panel, planets A/B, house guide, divisionals D9/D10/D4/D12/D3/D27, chart tools: interpretation hub / KP chrome / tattva / naamkaran / varshaphal), relationship, career, compare, muhurta, transit; Nakshatra full UI + engine (`nakshatra` namespace + SEO; locale overlays for advanced/remedies/navtara/taramandal/profession/medical); Dosha & Upay full UI + Shrap engine (`dosha` namespace + `shrapDosha.hi.ts`); auth (login/signup/forgot/reset/verify via `auth` namespace). Matching engine locale overlays for the done features. Milan + muhurta PDFs have Hindi. HiLeak tests cover the new Nakshatra/Shrap engines.
- **Not yet:** Jaimini, Nadi, Prashna, Vastu, ACG, SBC, Numerology page bodies (+ their engines); pricing, about, support, roadmap, search, install, account, clients; legal (privacy/terms/refund); guides; admin + Social Studio; chart master PDF + emails; KP engine narrative; Ashtakavarga/Shadbala internals; SEO intros for remaining tool pages.

### Domain types

- `GrahaId`: `'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke' | …`
- `Rashi`: `1`–`12` (Aries = 1)
- `UserPlan`: `'free' | 'gold' | 'platinum'`
- Main orchestrator: `calculateChart()` in `src/lib/engine/calculator.ts` → `ChartOutput`
- Interpretation hub: pure `buildInterpretationHub()` in `src/lib/engine/interpretationHub.ts`; UI `InterpretationHub` (Free overview teaser; Gold+ full sections)

### Do not

- Add React/DB/Redis imports to `src/lib/engine/**`
- Skip route security on new endpoints
- Trust README/doc version numbers blindly — check `package.json`
- Commit `.env` or secrets

## Further reading

- [`docs/README.md`](./docs/README.md) — documentation index
- [`README.md`](./README.md) — feature list and engine module inventory
- [`SUBSCRIPTION_MATRIX.md`](./SUBSCRIPTION_MATRIX.md) — enforced entitlements by plan
- [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md) — architecture
- [`docs/API.md`](./docs/API.md) — REST inventory
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — Mongo collections
- [`docs/PRODUCT.md`](./docs/PRODUCT.md) — product brief
- [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) — operations
- [`docs/TESTING.md`](./docs/TESTING.md) — test strategy
- [`docs/SECURITY_DEPLOY.md`](./docs/SECURITY_DEPLOY.md) — production security
- [`docs/adr/`](./docs/adr/) — architecture decisions
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — PR / quality bar
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes
