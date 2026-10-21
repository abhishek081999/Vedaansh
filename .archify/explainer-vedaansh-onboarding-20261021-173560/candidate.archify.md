# Vedaansh is a Next.js Jyotish monolith with a pure engine and Mongo-backed plans {#vedaansh-overview}

Vedaansh calculates Vedic charts with Swiss Ephemeris, then gates paid features from MongoDB — not from the JWT alone.

- The browser hits `proxy.ts`, then App Router pages and Node API routes.
- `calculateChart` in `src/lib/engine` stays pure: no React, Mongo, Redis, or NextAuth imports.
- Effective plan is `free|gold|platinum` via `getEffectivePlan()` and `requirePlanGate()`.
- Razorpay checkout writes `User.plan` and `planExpiresAt`; expiry silently returns free.

@answer scope="Vedaansh full-stack onboarding"
@meta locale=en repo_url=https://github.com/abhishek081999/Vedaansh.git repo_revision=8d492d51322d55515a166cbd347e9fc429570c91
@source agents title="AGENTS.md" path=AGENTS.md
@source proxy title="proxy.ts" path=proxy.ts
@source entitlements title="entitlements.ts" path=src/lib/subscription/entitlements.ts

## How a chart request moves {#chart-path}

@sequence id=chart-calc-flow title="Chart calculate happy path"
| actor ui | HomeClient | frontend |
| actor api | chart/calculate | backend |
| actor eng | Jyotish engine | backend |
| actor redis | Redis cache | database |
| ui | api | POST birth details | emphasis |
| api | eng | calculateChart | emphasis |
| eng | api | ChartOutput | return |
| api | redis | cacheChart async | dashed |
| api | ui | success JSON | return |

@steps id=chart-calc-steps
| secure | Secure | Same-origin and rate limits run before Zod parse. | chart-calc-flow | api |
| plan | Plan | Authenticated users get plan from Mongo; guests are free. | chart-calc-flow | api |
| compute | Compute | Engine reads EPHE_PATH via sweph; API filters vargas by plan. | chart-calc-flow | eng |

## What agents must not break {#invariants}

| Invariant | Why it matters |
| --- | --- |
| Engine purity | Keeps Vitest safe and calculations reusable {good:Keep} |
| `guardRoute` on APIs | Rate limits and origin checks {good:Keep} |
| Plan from Mongo | Paid unlocks survive token tricks {good:Keep} |
| Node runtime for sweph | Native addon cannot run on Edge {caution:Node only} |

@callout level=warning title="Trust code over docs"
Markdown under `docs/` may lag. Prefer `package.json`, `proxy.ts`, and live models when they disagree.

## Where to read next {#doc-pack}

@facts id=pack-links
| Architecture | System boundaries and external services |
| ERD | Mongo collections and foreign keys |
| Sequence | Chart calculate call chain |
| Dataflow | Birth to save to PDF email CRM |
| Workflow | Sign-in and Razorpay activation |
| Lifecycle | Free to paid to expired |
| Module tree | app, engine, security, db |
