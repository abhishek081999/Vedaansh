# Vedaansh — data model

**Store:** MongoDB Atlas via Mongoose (`src/lib/db/models/`)  
**Cache:** Upstash Redis (ephemeral calc / atlas / rate limits — not durable domain state)  
**Source of truth:** model files under `src/lib/db/models/`

---

## ER overview

```
User ──< Chart ──> ChartCache
  │
  ├──< Client          (Platinum CRM; userId = consultant)
  ├──< Subscription    (billing lifecycle)
  └──< AdminAuditLog   (adminId)

BillingConfig          (singleton key: "default")
```

---

## Collections

### User

| Field | Type | Notes |
|-------|------|-------|
| email | string | **unique**, lowercase |
| name, image | string / null | |
| role | `user` \| `admin` | Default `user` |
| plan | `free` \| `gold` \| `platinum` | Default `free` |
| planExpiresAt | Date \| null | Past → effective free |
| passwordHash | string \| null | `select: false` |
| oauthProvider / oauthId | google \| apple \| null | Compound index |
| emailVerified, verification*, reset* | tokens / dates | |
| devices[] | fingerprint, UA, lastSeen, ip | Cap ~3 in product logic |
| preferences | ayanamsha, chart style, houses, nodes, karaka, language, show* | |
| razorpayCustomerId / stripeCustomerId | string \| null | Stripe reserved |
| brandName / brandLogo | string \| null | Platinum white-label |
| defaultChartId | ObjectId → Chart \| null | |

**Indexes:** unique `email`; `{ oauthProvider, oauthId }`

---

### Chart

Birth data stored as **strings** for date/time precision (`YYYY-MM-DD`, `HH:MM:SS`).

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User \| null | null = anonymous save |
| name, birthDate, birthTime, birthPlace | strings | |
| latitude, longitude, timezone | number / IANA | |
| gender | male \| female \| other | |
| settings | ChartSettings (Mixed) | |
| isPublic / isPersonal | boolean | Personal = own birth chart |
| slug | string \| null | **unique sparse** (public share) |
| notes[] | content + createdAt | |
| tags[] | string | |
| views, lastViewedAt | number / Date | |
| cachedDataId | ObjectId → ChartCache \| null | |

**Indexes:** `userId`; `isPersonal`; `{ userId, isPersonal }`; `{ userId, createdAt:-1 }`; `{ userId, tags }`; `{ isPublic, createdAt:-1 }`; text on `name` / `birthPlace` / `tags`; unique sparse `slug`

---

### KundaliMilan

A saved match. Birth details for both people are stored; the charts are recalculated when the match is opened.

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | Required |
| name | string | Default `Person A & Person B` |
| roleA / roleB | boy \| girl | Ashtakoot direction |
| ganaSchool | classical \| parampara | |
| gunaTotal | number | Score at save time, 0–36 |
| personA / personB | birth details | name, date, time, place, lat, lng, timezone, gender, settings |

**Indexes:** `{ userId, createdAt:-1 }`

Deleted with the user account. Counted on its own save cap (20 / 200 / unlimited), separate from natal charts.

---

### ChartCache

Separate from Chart so the chart document stays lean. Large `ChartOutput` blobs live here (and separately in Redis for hot calc).

| Field | Type | Notes |
|-------|------|-------|
| chartId | ObjectId → Chart | |
| ayanamsha | string | |
| version | number | Bump to invalidate |
| data | ChartOutput (Mixed) | Full calculated chart |
| expiresAt | Date | TTL index (`expireAfterSeconds: 0`) |

**Indexes:** `chartId`; `{ chartId, ayanamsha }`; TTL on `expiresAt`

---

### Client (Platinum CRM)

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | Consultant (required) |
| name, email?, phone?, gender? | | |
| birthDate/Time/Place, lat/lng, timezone | | Same pattern as Chart |
| tags[], notes[], remedies[] | CRM metadata | Note categories; remedy status |
| status | active \| inactive \| prospective | |
| lastSessionAt, nextSessionAt, totalSessions | | |
| preferredSettings | Partial ChartSettings | Per-client overrides |

**Indexes:** `userId`; text `name`/`email`/`tags`; `{ userId, lastSessionAt:-1 }`; `{ userId, createdAt:-1 }`

---

### Subscription

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | |
| plan | gold \| platinum | |
| provider | razorpay \| stripe | Live checkout: Razorpay |
| providerSubscriptionId | string | **unique** |
| providerCustomerId, providerPlanId | string | |
| status | active \| cancelled \| expired \| past_due \| trialing \| pending | |
| interval | monthly \| yearly | |
| currentPeriodStart / End | Date | |
| cancelAtPeriodEnd, cancelledAt | | |
| amount, currency | paise/cents; INR \| USD \| EUR | |
| events[] | last ~10 webhook events | |

**Indexes:** `userId`; unique `providerSubscriptionId`; `{ userId, status }`; `currentPeriodEnd`

---

### BillingConfig

Singleton admin-editable pricing / coupons.

| Field | Type | Notes |
|-------|------|-------|
| key | `'default'` | **unique** |
| offersEnabled | boolean | |
| prices | gold/platinum monthly/yearly + paise | Overrides defaults in `pricing.ts` |
| coupons[] | code, type percent\|fixed, limits, plans, intervals | |

---

### AdminAuditLog

| Field | Type | Notes |
|-------|------|-------|
| adminId | ObjectId → User | |
| adminEmail | string | |
| action | string | |
| targetType / targetId | string \| null | |
| metadata | Mixed | |
| createdAt | Date | No updatedAt |

**Indexes:** `adminId`; `action`; `{ createdAt:-1 }`

---

## Redis (not Mongo)

| Pattern | Purpose |
|---------|---------|
| Chart cache keys (`chartCacheKey`) | Hot calculated chart JSON (gzip when large) |
| `atlas:*` | Geocode / reverse |
| `tz:*` | Timezone lookups |
| Rate-limit buckets | Abuse control |

Admin cleanup can clear chart / panchang / atlas namespaces. See `src/lib/redis.ts`.

---

## Ownership rules

1. Charts and clients are scoped by `userId` — APIs must never return another user’s rows.
2. Public charts: `isPublic` + `slug` only via `/api/chart/public`.
3. Effective plan: `User.plan` + `planExpiresAt` via `getEffectivePlan()` — expired paid → free behavior.
4. Account delete: cascades charts + ChartCache (see `src/lib/user/accountLifecycle.ts`).

---

## Related

- API surface: [API.md](./API.md)
- Entitlements: [`SUBSCRIPTION_MATRIX.md`](../SUBSCRIPTION_MATRIX.md)
- Architecture: [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
