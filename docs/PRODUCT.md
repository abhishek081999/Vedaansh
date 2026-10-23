# Vedaansh — product brief

**Product:** Vedic astrology (Jyotish) SaaS — charts, dashas, vargas, panchang, muhurta, CRM, admin  
**Version:** `jyotish-platform` 2.6.0 · live codebase over marketing copy  
**Monetization:** `free` | `gold` | `platinum` — see [`SUBSCRIPTION_MATRIX.md`](../SUBSCRIPTION_MATRIX.md)

Default list prices (INR, code defaults; admin `BillingConfig` may override): Gold ₹168/mo · ₹1,443/yr · Platinum ₹336/mo · ₹2,888/yr (`src/lib/subscription/pricing.ts`).

---

## 1. Who it’s for

| Persona | Need |
|---------|------|
| **Learner / enthusiast** | Free accurate birth chart, panchang, shareable links |
| **Serious practitioner** | Gold: exports, muhurta, relationship and marriage, career and profession, Kundali Milan match-making and married life, deeper UI panels, larger library |
| **Professional consultant** | Platinum: CRM, email reports, bulk ZIP, white-label branding |
| **Platform admin** | Users, billing, revenue, audit, broadcast, cleanup |

---

## 2. Core journeys

1. **Calculate** — enter birth data → `POST /api/chart/calculate` → interactive chart workspace.
2. **Save & organize** — library with tags/notes; plan save caps (20 / 200 / ∞).
3. **Share** — toggle public → unique slug + OG metadata.
4. **Upgrade** — `/pricing` → Razorpay checkout → verify → plan refresh.
5. **Muhurta (Gold+)** — find auspicious windows; timeline + report APIs.
6. **Consult (Platinum)** — Clients CRM with notes, remedies, sessions.
7. **Admin** — manage users/plans, billing config, ops cleanup.

---

## 3. In scope (shipped)

- Swiss Ephemeris–backed natal / varga / dasha / strength engines
- North / South / SBC-style chart UIs; transit overlay
- Panchang + calendar; Kundali Milan (Ashtakoot, Porutham, and charts on Free; match-making, married life, All Sections, and print on Gold+)
- Relationship and marriage on the chart (preview on Free; full reading on Gold+)
- Career and profession on the chart (preview on Free; full reading on Gold+)
- Prashna, Jaimini, ACG, Vastu, Nakshatra lab, Numerology
- Auth: Google OAuth + credentials; email verify / reset
- PWA (Serwist) + Android TWA packaging
- Admin reel studio (Remotion) for marketing video

---

## 4. Out of scope / reserved

| Item | Status |
|------|--------|
| Full i18n rollout | Remaining (prefs language field exists) |
| Stripe checkout | Schema fields only — not wired |
| Research pages/APIs | Platinum-gated in proxy; **UI not shipped** |
| Apple OAuth | Enum reserved; Google is live |

---

## 5. Product principles

1. **Accuracy first** — engine purity; no DB/React in `src/lib/engine/**`.
2. **Server enforces plans** — UI teasers are not security; API + proxy gate paid features.
3. **Fail closed on money/auth; fail open on Redis RL** — document Redis gap; never skip payment HMAC.
4. **Lean ops** — single Node service on Render; Redis for cache/RL only.

---

## 6. Success signals (product)

- Chart calculate + save work for free users without friction.
- Paid conversion path: pricing → checkout → plan reflects within session refresh.
- Gold muhurta and Platinum CRM stay unreachable for lower plans (403 / redirect).
- Public share links remain usable without login.

---

## Related

- Entitlements: [`SUBSCRIPTION_MATRIX.md`](../SUBSCRIPTION_MATRIX.md)
- Architecture: [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- API: [API.md](./API.md)
