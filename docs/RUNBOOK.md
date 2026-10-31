# Vedaansh — operations runbook

**Deploy:** Render (Singapore) · health `/api/health` · config `render.yaml`  
**Security checklist:** [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md)  
**Architecture:** [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)

---

## 1. Health & smoke

| Check | Expect |
|-------|--------|
| `GET /api/health` | `{ "status": "ok" }` (or equivalent healthy payload) |
| Sign-in | Google + email/password |
| Chart calculate | Anon + logged-in |
| Chart save | Authenticated (proxy requires a session) |
| Kundali Milan save | Authenticated; appears under My Charts |
| Pricing / checkout | Razorpay modal opens |
| CSP | No console CSP violations on home, chart, pricing |
| `/.well-known/security.txt` | Contact present |

Local Mongo probe: `npm run test:mongo`

---

## 2. Common failures

### App won’t start / build fails

1. Node ≥ 24 (`package.json` engines).
2. `npm ci` (`.npmrc` uses `legacy-peer-deps` for React 19).
3. `EPHE_PATH=./ephe` and ephemeris files present.
4. `npm run typecheck` then `npm run build`.

### Login broken locally

- `AUTH_URL` must be `http://localhost:3000` in `.env.local` — production URL breaks cookies on localhost.
- `AUTH_SECRET` set.
- Google: redirect URI `http://localhost:3000/api/auth/callback/google`.

### MongoDB connection (`querySrv ECONNREFUSED`)

- Prefer `MONGODB_URI` (`mongodb+srv://…`).
- On some networks/Windows: set `MONGODB_URI_DIRECT` to Atlas standard connection string (see `.env.example`).
- Atlas IP allowlist must include your IP / Render egress.

### Charts slow or OOM on Render

| Cause | Mitigation |
|-------|------------|
| Concurrent Swiss Ephemeris | Default `CHART_CALC_CONCURRENCY` serializes calc |
| Large Redis gzip writes | Queued chart-cache writes |
| Heap vs RAM | Standard plan: `NODE_OPTIONS=--max-old-space-size=1536` (2 GB). On 512 MB, keep heap ≤450 |

After calc, `cleanupEphemeris()` must re-set `EPHE_PATH` after `swe_close()` or fallback becomes slow Moshier.

### Rate limits not applying

- Missing/broken `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` → limits **fail open**.
- Production should always have Redis; monitor logs for rate-limit errors when Redis is unhealthy.

### Razorpay webhook failures

- Missing `RAZORPAY_WEBHOOK_SECRET` in production → **503**.
- Invalid signature → logged as `webhook_signature_invalid`.
- Replay dedupe window ~6h — duplicate events ignored.

### Payments verify fail

- Check `payment_verify_failed` in logs.
- Confirm `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` match mode (test vs live) and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

### Email not sending

- `RESEND_API_KEY`, `FROM_EMAIL` set and domain verified in Resend.
- Auth verify / forgot-password / Platinum chart email all use Resend.

### Plan shows wrong tier

1. User hits `/api/auth/refresh-plan` or re-login.
2. Check Mongo `User.plan` + `planExpiresAt` — past expiry → free via `getEffectivePlan()`.
3. Do not trust JWT alone for entitlements.

### Pricing request returns 401 while signed out

`proxy.ts` puts `/api/subscription` on `PROTECTED_API`, so `/api/subscription/pricing` and `/api/subscription/coupon/validate` require a session before the handler runs. The handler for pricing does not call `auth()` itself. `/pricing` still requests that endpoint.

### CSRF / origin blocked (`csrf_blocked`)

- Writes require same-origin Origin/Referer.
- Staging second origin: `CSRF_TRUSTED_ORIGINS=https://dev.vedaansh.com` (comma-separated).

### Admin access denied

- Session + Mongo `role === 'admin'` required (`requireAdmin`).
- Proxy also gates `/admin` and `/api/admin`.

---

## 3. Log signals

Filter production logs for `[security-event]`:

| Event | Meaning |
|-------|---------|
| `rate_limit_exceeded` | Abuse or need policy tune (`rateLimitPolicy.ts`) |
| `csrf_blocked` | Cross-origin mutating request |
| `body_too_large` | 413 oversized body |
| `webhook_signature_invalid` | Bad Razorpay webhook |
| `login_account_locked` | 10 failed passwords / 15 min |
| `payment_verify_failed` | HMAC / payment verify issue |

---

## 4. Maintenance actions

| Action | How |
|--------|-----|
| Redis / cache cleanup | Admin UI or `POST /api/admin/cleanup` |
| Billing prices / coupons | Admin billing (`/api/admin/billing`) |
| User plan override | Admin users PATCH |
| Rotate secrets | New `AUTH_SECRET`, Razorpay secrets; redeploy; re-auth users after AUTH_SECRET rotate |
| Dependency CVE scan | `npm run security:audit` |

---

## 5. Rollback

1. Redeploy previous Render deploy / image.
2. Confirm `/api/health`.
3. Spot-check login + chart calculate + checkout open.
4. If schema-breaking Mongo change shipped: restore Atlas backup before app rollback if needed (prefer forward-compatible migrations).

---

## 6. Escalation checklist

- [ ] Health endpoint
- [ ] Mongo Atlas status + connection string
- [ ] Upstash Redis status
- [ ] Render metrics (CPU, RAM, OOM)
- [ ] Razorpay dashboard (payments / webhooks)
- [ ] Resend dashboard (bounces / API errors)
- [ ] Security-event log volume spike

---

## Related

- [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md)
- [API.md](./API.md)
- [TESTING.md](./TESTING.md)
