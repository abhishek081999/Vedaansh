# Subscription Entitlements Matrix

Source-of-truth summary for **enforced** feature access by plan. Prices: see `src/lib/subscription/pricing.ts` and `/pricing`.

| Feature | Free | Gold | Platinum | Enforced In |
| --- | --- | --- | --- | --- |
| Core chart calculation | Yes | Yes | Yes | `src/app/api/chart/calculate/route.ts` |
| Save charts (library limit) | 20 | 200 | Unlimited | `src/lib/subscription/entitlements.ts`, `src/app/api/chart/save/route.ts`, `src/app/api/chart/bulk-import/route.ts` |
| Public chart share links | Yes | Yes | Yes | `src/app/api/chart/public/route.ts`, `src/app/api/chart/toggle-public/route.ts` |
| Chart library search | Yes | Yes | Yes | `src/app/api/chart/search/route.ts` |
| Export chart (PDF/HTML) | No | Yes | Yes | `src/app/api/chart/export/route.ts`, `middleware.ts` (`/api/chart/export`) |
| Bulk XLSX import | Yes* | Yes* | Yes* | `src/app/api/chart/bulk-import/route.ts` — subject to save limits, not plan tier in API |
| Email chart reports | No | No | Yes | `src/app/api/chart/send-email/route.ts` |
| Bulk ZIP export | No | No | Yes | `src/app/api/chart/bulk-export/route.ts` |
| Client CRM list/create | No | No | Yes | `src/app/api/clients/route.ts` |
| Client CRM item ops (GET/PATCH/POST/DELETE) | No | No | Yes | `src/app/api/clients/[id]/route.ts` |
| White-label brand fields | No | No | Yes | `src/app/api/user/me/route.ts`, `src/app/api/chart/public/route.ts`, export/email branding |
| Muhurta pages/APIs | No | Yes | Yes | `middleware.ts` (`/muhurta`, `/api/muhurta`) |
| Research pages/APIs | No | No | Yes | `middleware.ts` (`/research`, `/api/research`) — routes reserved, UI not shipped |

\*Bulk import is available to any authenticated user until the plan’s chart save cap is reached.

## Notes

- Paid plans automatically downgrade to Free behavior after `planExpiresAt` (`getEffectivePlan` in `entitlements.ts`).
- Plan names are canonicalized to: `free`, `gold`, `platinum`.
- Live checkout: Razorpay (`/api/payment/checkout`, `/api/payment/verify`, `/api/webhooks/razorpay`). Stripe fields exist on `User` / `Subscription` models for future use.
