# Vedaansh — production security deploy checklist

Use this before merging to `main` or after rotating secrets. CI already runs `npm run security:check` on deploy workflows.

## 1. Required environment (Render)

| Variable | Why |
|----------|-----|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limits and login lockout **fail closed** in production without Redis |
| `AUTH_SECRET` | NextAuth session signing (rotate after incidents) |
| `AUTH_URL` | Must be `https://vedaansh.com` in production |
| `RAZORPAY_WEBHOOK_SECRET` | Webhooks return **503** if missing in production |
| `MONGODB_URI` | Atlas with IP allowlist + backups enabled |

Also set: `AUTH_GOOGLE_*`, `RAZORPAY_KEY_*`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RESEND_API_KEY`, `FROM_EMAIL`, `NEXT_PUBLIC_BASE_URL`.

Optional: `SECURITY_CONTACT_EMAIL` (defaults to `FROM_EMAIL`) for `/.well-known/security.txt`.

Staging: `CSRF_TRUSTED_ORIGINS=https://dev.vedaansh.com` if using a second origin.

## 2. Pre-deploy commands (local)

```bash
npm ci
npm run typecheck
npm run security:preflight   # 34 security unit tests
npm run security:audit       # production deps only (must pass in CI)
npm run security:audit:dev   # optional full tree including devDependencies
npm run build
```

`.npmrc` enables `legacy-peer-deps` for React 19 installs.

## 3. Post-deploy smoke tests

- [ ] `GET https://vedaansh.com/api/health` → `{ "status": "ok" }`
- [ ] Sign in (Google + email/password)
- [ ] Calculate a chart (anonymous + logged in)
- [ ] Save chart (authenticated)
- [ ] Checkout flow opens Razorpay (test or live key as configured)
- [ ] Browser devtools → Console: **no CSP violations** on home, chart, pricing
- [ ] `/.well-known/security.txt` returns contact info

## 4. Log monitoring

Filter production logs for:

```
[security-event]
```

| Event | Meaning |
|-------|---------|
| `rate_limit_exceeded` | Abuse or aggressive client; tune limits if false positives |
| `csrf_blocked` | Cross-origin POST without valid Origin/Referer |
| `body_too_large` | Oversized payload rejected (413) |
| `webhook_signature_invalid` | Bad Razorpay webhook call |
| `login_account_locked` | 10 failed password attempts / 15 min |
| `payment_verify_failed` | HMAC or payment verification issue |

## 5. Platform hardening (recommended)

- **Cloudflare** (or similar) WAF in front of `vedaansh.com`
- MongoDB Atlas: least-privilege DB user, network allowlist, alerts on auth failures
- Rotate `AUTH_SECRET` and Razorpay secrets on a schedule or after staff changes
- Run `npm run security:audit` after dependency bumps (CI reports high CVEs; does not block deploy)

## 6. Render memory (~512 MB tier)

Security changes add **negligible** runtime RAM (Redis is external).

Heavy paths (unchanged):

- `/api/chart/calculate` (Swiss Ephemeris)
- `/api/chart/bulk-export` (batched, low concurrency)

`NODE_OPTIONS=--max-old-space-size=450` in `render.yaml` is intentional headroom.

## 7. What is enforced in code

- Middleware: auth gates, tier routes, admin routes, NextAuth POST rate limit, **per-request CSP nonces**
- APIs: same-origin on mutating routes, Redis rate limits, body size caps, plan/admin DB checks
- Payments: HMAC verify + webhook replay dedupe (6h)
- Sessions: secure cookies in production, per-email login throttle

See `src/lib/security/` for implementation details.
