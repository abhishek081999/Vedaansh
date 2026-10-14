# ADR 0003 — NextAuth.js v5

**Status:** accepted  
**Date:** standing

## Context

The app needs Google OAuth, email/password, session cookies, email verification, and password reset — integrated with a Next.js App Router monolith and MongoDB.

## Decision

Use **NextAuth.js v5** (`next-auth` beta) with routes under `src/app/api/auth/`. Session via `auth()`. Edge/`proxy.ts` checks sessions for protected pages and APIs.

**Plan entitlement is not trusted from the JWT alone.** Effective plan is read from MongoDB (`getEffectivePlan` / `requirePlanGate`). `/api/auth/refresh-plan` syncs plan into the session after billing changes.

## Consequences

- `AUTH_SECRET` and correct `AUTH_URL` are mandatory (localhost vs production).
- Dual enforcement: proxy page gates + route-level auth/plan checks.
- Custom credential flows (signup, verify, forgot/reset) live alongside `[...nextauth]`.
- Device list and password policy are app-owned, not Auth.js defaults alone.
