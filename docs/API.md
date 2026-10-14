# Vedaansh — API reference

**App:** `jyotish-platform` v2.6.0 · Next.js App Router · Node runtime for ephemeris routes  
**Response shape:** `{ success: boolean, data?: unknown, error?: string }` (some routes vary slightly)  
**Security:** `guardRoute(req, routeSecurityPresets.*())` first — body limit, same-origin on writes, Redis rate limits  
**Plan truth:** MongoDB via `getEffectivePlan()` / `requirePlanGate()` — not JWT alone  
**Full entitlements:** [`SUBSCRIPTION_MATRIX.md`](../SUBSCRIPTION_MATRIX.md)

---

## Conventions

| Concern | Behavior |
|---------|----------|
| Auth | Session cookie via NextAuth (`auth()`). Missing session → `401` when required. |
| Plan gate | Hard: `requirePlanGate(userId, 'gold' \| 'platinum')` → `403`. Soft: save limits / varga filtering without hard 403. |
| Admin | `requireAdmin()` — session + DB `role === 'admin'`. |
| CSRF | Mutating routes: same-origin Origin/Referer (see presets). |
| Redis down | Rate limits **fail open** (requests proceed). |
| Edge gates | `proxy.ts` also blocks Gold/Platinum page+API prefixes and admin. |

**Plan legend:** — none · soft soft limit · **gold** / **platinum** hard gate · admin DB role

---

## Auth

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| GET, POST | `/api/auth/[...nextauth]` | NextAuth | — | Auth.js handlers |
| POST | `/api/auth/signup` | no | — | Register |
| POST | `/api/auth/verify` | no | — | Verify token |
| GET | `/api/auth/verify-email` | no | — | Email link |
| POST | `/api/auth/forgot-password` | no | — | Send reset email |
| POST | `/api/auth/reset-password` | no | — | Set new password |
| GET | `/api/auth/refresh-plan` | yes | — | Sync effective plan into session |

---

## Chart

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| POST | `/api/chart/calculate` | optional | soft (vargas) | Anon OK; Redis cache; plan filters vargas |
| POST | `/api/chart/save` | optional | soft (save cap) | Anon → `userId` null |
| GET | `/api/chart/list` | yes | — | Own charts |
| GET | `/api/chart/search` | yes | — | Own charts |
| GET | `/api/chart/[id]` | yes | — | Owner only |
| PATCH | `/api/chart/[id]` | yes | — | Owner only |
| DELETE | `/api/chart/delete` | yes | — | Owner + ChartCache cleanup |
| GET, POST, DELETE | `/api/chart/notes` | yes | — | Owner notes |
| POST | `/api/chart/toggle-public` | yes | — | Public slug |
| GET | `/api/chart/public` | no | — | Public by slug; Platinum branding |
| POST | `/api/chart/export` | yes | **gold** | PDF/HTML |
| GET | `/api/chart/export-xlsx` | yes | — | XLSX export |
| POST | `/api/chart/bulk-export` | yes | **platinum** | ZIP |
| POST | `/api/chart/bulk-import` | yes | soft (save cap) | Batch import |
| POST | `/api/chart/send-email` | yes | **platinum** | Email report |
| GET | `/api/chart/template` | no | — | Import template |
| POST | `/api/chart/relocate` | no | — | Relocated chart |
| POST | `/api/chart/varshaphal` | no | — | Solar return |
| GET | `/api/chart/astrocartography` | no | — | ACG lines |

**Save caps (soft):** free 20 · gold 200 · platinum unlimited — `src/lib/subscription/entitlements.ts`

---

## User / account

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| GET | `/api/user/me` | yes | — | Profile |
| PATCH | `/api/user/me` | yes | soft (Pt brand) | Prefs; white-label Platinum |
| GET, POST | `/api/user/default-chart` | yes | — | Personal default chart |
| GET | `/api/user/export` | yes | — | Account data export |
| DELETE | `/api/user/account` | yes | — | Delete account (admins blocked) |
| GET | `/api/user/subscription` | yes | — | Plan + subscription |
| POST | `/api/user/subscription/cancel` | yes | — | Cancel at period end |

---

## Payment / subscription

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| POST | `/api/payment/checkout` | yes | — | Create Razorpay order |
| POST | `/api/payment/verify` | yes | — | Verify payment + upgrade |
| POST | `/api/webhooks/razorpay` | HMAC | — | No session; signature required |
| GET | `/api/subscription/pricing` | no | — | Public prices |
| POST | `/api/subscription/coupon/validate` | optional | — | Coupon check |

Default list prices (INR): `src/lib/subscription/pricing.ts` — may be overridden by `BillingConfig` in Mongo.

---

## Muhurta (Gold+)

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| GET | `/api/muhurta/timeline` | yes | **gold** | Timeline windows |
| POST | `/api/muhurta/report` | yes | **gold** | Report |

Also gated in `proxy.ts` for `/muhurta` and `/api/muhurta`.

---

## Clients CRM (Platinum)

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| GET, POST | `/api/clients` | yes | **platinum** | List / create |
| GET, PATCH, POST, DELETE | `/api/clients/[id]` | yes | **platinum** | Item + notes/remedies |

---

## Ephemeris / tools (public)

| Method | Path | Auth | Plan | Notes |
|--------|------|------|------|-------|
| GET | `/api/health` | no | — | Liveness |
| GET | `/api/panchang` | no | — | Daily panchang |
| GET | `/api/transit` | no | — | Transits |
| GET | `/api/transits/planets` | no | — | Planet positions |
| GET | `/api/atlas/search` | no | — | Geocode (Photon / Open-Meteo / Nominatim + Redis) |

---

## Admin

All require `requireAdmin()` (session + `role === 'admin'`). Also gated in `proxy.ts`.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET, PATCH | `/api/admin/users` | List / mutate plan·role |
| GET | `/api/admin/users/[id]` | User detail |
| GET | `/api/admin/charts` | Chart list |
| DELETE | `/api/admin/charts/[id]` | Delete chart |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/admin/revenue` | Revenue |
| GET, PUT | `/api/admin/billing` | Prices / coupons |
| POST | `/api/admin/broadcast` | Email blast |
| GET, POST | `/api/admin/cleanup` | Redis / cache maintenance |

---

## Security presets

Defined in `src/lib/security/presets.ts`. Typical mapping:

| Preset family | Behavior |
|---------------|----------|
| `chartRead` / `chartWrite` / `chartHeavy` / `chartImport` | Chart RL; writes = same-origin + body cap |
| `userRead` / `userWrite` | Profile |
| `clientsRead` / `clientsWrite` | CRM |
| `publicEphemeris` / `muhurtaRead` | Public / muhurta RL |
| `adminRead` / `adminMutate` | Admin |
| `authSignup` / `authForgotPassword` / … | Strict auth write RL |
| `paymentCheckout` / `paymentVerify` | Payment RL |
| `webhook` / `health` | Webhook / health RL |

---

## Related

- Architecture: [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- Deploy / secrets: [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md)
- Models: [DATA_MODEL.md](./DATA_MODEL.md)
