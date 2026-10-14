# ADR 0004 — Razorpay as live payments

**Status:** accepted  
**Date:** standing

## Context

Primary market and pricing are INR. Checkout must upgrade `User.plan` / `planExpiresAt` and record subscription lifecycle with webhook reliability.

## Decision

**Live checkout:** Razorpay — `POST /api/payment/checkout`, `POST /api/payment/verify`, `POST /api/webhooks/razorpay`.

Stripe customer/subscription fields exist on User/Subscription models for a possible future path; **Stripe checkout is not wired**.

Admin-editable prices and coupons live in `BillingConfig`; code defaults in `src/lib/subscription/pricing.ts`.

## Consequences

- `RAZORPAY_WEBHOOK_SECRET` required in production (missing → 503).
- HMAC verify + replay dedupe on webhooks.
- Plan changes must refresh session (`refresh-plan`) so UI matches Mongo.
- Coupons and INR paise amounts are first-class; multi-currency fields exist but Razorpay INR is the live path.
