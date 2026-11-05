# Subscription Entitlements Matrix

Source-of-truth summary for **enforced** feature access by plan.

**Default list prices (INR)** from `src/lib/subscription/pricing.ts` (admin `BillingConfig` / `/pricing` may override):

| Plan | Monthly | Yearly |
|------|---------|--------|
| Gold | ₹168 | ₹1,443 |
| Platinum | ₹336 | ₹2,888 |

Canonical plan ids: `free` | `gold` | `platinum`.

| Feature | Free | Gold | Platinum | Enforced In |
| --- | --- | --- | --- | --- |
| Core chart calculation | Yes | Yes | Yes | `src/app/api/chart/calculate/route.ts` |
| Varga charts | 16 Shodashavarga | 16 Shodashavarga | Full 41-suite | `src/lib/engine/vargas.ts` (`PLATINUM_VARGAS`), `VargaSwitcher`, `filterChartVargasForPlan` |
| Save charts (library limit) | 20 | 200 | Unlimited | `src/lib/subscription/entitlements.ts`, `src/app/api/chart/save/route.ts`, `src/app/api/chart/bulk-import/route.ts` |
| Save Kundali Milan | 20 | 200 | Unlimited | `src/app/api/milan/save/route.ts` — separate cap, same numbers as chart saves. List and delete: `/api/milan/list`, `/api/milan/[id]`. Session is in the handler; these paths are not in `src/proxy.ts` `PROTECTED_API` |
| Public chart share links | Yes | Yes | Yes | `src/app/api/chart/public/route.ts`, `src/app/api/chart/toggle-public/route.ts` |
| Chart library search | Yes | Yes | Yes | `src/app/api/chart/search/route.ts` |
| Export chart (PDF/HTML) | No | Yes | Yes | `src/app/api/chart/export/route.ts`, `src/proxy.ts` (`/api/chart/export`) — includes Gochar Phala chapter |
| Export chart (XLSX) | No | Yes | Yes | `src/app/api/chart/export-xlsx/route.ts` (`requirePlanGate`), `src/proxy.ts` |
| Marriage gochar windows | No | Yes | Yes | `GET /api/marriage/gochar-windows` — `requirePlanGate('gold')`. Not listed in `src/proxy.ts` `GOLD_API` |
| Numerology predictions, remedies, advanced tools, PDF | No | Yes | Yes | `POST /api/numerology/premium` — `requirePlanGate('gold')`. Core numbers, grids, arrows, name depth, spelling comparison and Katapayadi stay free |
| Numerology year calendar (.ics with tithi) | No | Yes | Yes | `GET /api/numerology/calendar` — `requirePlanGate('gold')` |
| Business numerology + launch-date finder | No | Yes | Yes | Advanced Tools tab (UI gate; client-side calculator) |
| Save numerology to CRM client | No | No | Yes | `POST /api/numerology/save-to-client` — `requirePlanGate('platinum')` |
| Transit hub advanced (Forecast, Sade Sati, Aspects, Bi-wheel, Calendar) | Roadmap + Live Transit + Moon Passages | Yes | Yes | UI: `TransitHub` PlanGate; API: `/api/transit/calendar`, `POST /api/transit/forecast` (Gold+). Moon Passages (`/transit/moon`, `POST /api/transit/moon`) is free like Live Transit |
| Bulk XLSX import | Yes* | Yes* | Yes* | `src/app/api/chart/bulk-import/route.ts` — subject to save limits, not plan tier in API |
| Email chart reports | No | No | Yes | `src/app/api/chart/send-email/route.ts` |
| Bulk ZIP export | No | No | Yes | `src/app/api/chart/bulk-export/route.ts` |
| Client CRM list/create | No | No | Yes | `src/app/api/clients/route.ts` |
| Client CRM item ops (GET/PATCH/POST/DELETE) | No | No | Yes | `src/app/api/clients/[id]/route.ts` |
| White-label brand fields | No | No | Yes | `src/app/api/user/me/route.ts`, `src/app/api/chart/public/route.ts`, export/email branding |
| Muhurta pages/APIs | No | Yes | Yes | `src/proxy.ts` (`/muhurta`, `/api/muhurta`) |
| Vimshottari MD/AD full interpretation (“More”) | Teaser only | Yes | Yes | UI: `DashaInterpretationPanel` (`userPlan` / Gold+) |
| Interpretation hub (overview, planets, houses, rashis, strength, transit, dasha) | Overview tone map + first 3 themes (also on public `/chart/[slug]`) | Yes | Yes | UI: `InterpretationHub` (`userPlan` / Gold+) |
| Tattva Prediction (trikona map, Agni/Artha/Vayu/Moksha, Active/Reactive spice, Moon gate, house×karaka×rashi composer) | Overview teaser (also on public `/chart/[slug]`) | Yes | Yes | UI: `TattvaPredictionPanel` / Core Analysis → Tattva; dasha strip in `DashaInterpretationPanel`; public tab teaser |
| Naamkaran (classical janma-naam — Moon pada, gender syllable parity, Karakamsha Ishta; Rashi naam and two-name on Gold; Shadbala/Navtara checks) | Moon-pada letter + syllable count | Yes | Yes | UI: `NaamkaranPanel` / Core Analysis → Naamkaran (`planMeetsUiGate`, Gold+) |
| Cosmic Weather full guidance | Labels + short lines | Yes | Yes | UI: `PersonalDayCard` (`userPlan` / Gold+) |
| Astro Vastu full analysis | Chart + compass preview | Yes | Yes | UI: `AstroVastuPanel` (`userPlan` / Gold+) |
| Sarvatobhadra Chakra full | Birth star + grid | Yes | Yes | UI: `sbc/page` (`userPlan` / Gold+) |
| Nakshatra Profession full | Indicators + blueprint teaser | Yes | Yes | UI: `NakshatraProfessionTab` (Gold+) |
| Nakshatra Medical full | Indicators + constitution teaser | Yes | Yes | UI: `NakshatraMedicalTab` (Gold+) |
| Nakshatra Taramandal | Full (all mandals + chart map) | Yes | Yes | UI: `NakshatraTaramandalTab` |
| Planetary Energy Cycles | 2-cycle preview (short summary) | Yes | Yes | UI: `PlanetaryEnergyCyclesPanel` / `PlanetsWorkspace` (Gold+) |
| Moon Kalas & Manas | Active kala + primary manas overview | Full 16 kalas, 7 manas, past-life flags | Full | UI: `MoonKalasManasPanel` / Planets → Moon tab (Gold+) |
| Sun · 12 Adityas | Primary Aditya + karakatva teaser | Full 12 Adityas, spiritual, afflictions | Full | UI: `SunAdityasPanel` / Planets → Sun tab (Gold+) |
| Prashna Kerala / Vedic / KP | Satpanchasika only | Yes | Yes | UI: `prashna/page` (Gold+) |
| Relationship and marriage | D1 lagna chart and five score lines | Full reading | Full reading, plus extended divisionals | UI: `RelationshipMarriagePanel` (`planMeetsUiGate`, Gold+) |
| Career and profession | D1 chart, five scores, and the five professional-method answers | Full reading, including the seven-step method | Full reading, including the seven-step method | UI: `CareerProfessionPanel` (`planMeetsUiGate`, Gold+) |
| Dosha & Upay (Shrap) | Flag severity teaser (present/watch counts) | Full Pitru/Matru/Sarpa/Guru/Brahmin/Stri desk, children focus, addiction signatures, lending risk, Jupiter remedy timing | Same as Gold | UI: `ShrapDoshaPanel` on `/dosha` (`planMeetsUiGate`, Gold+); dashboard flags via `getDoshaSnapshot` |
| Kundali Milan — Ashtakoot, Deep Milan, Porutham, dosha, charts, dasha, panchang | Yes | Yes | Yes | `src/app/compare/page.tsx` |
| Kundali Milan match-making | Headline, lagna, and summary | Steps, four pillars, division overlay | Same as Gold | UI: `MilanMatchMakingPanel` (Gold+) |
| Kundali Milan married life | Summary, Moon, 4th, 10th, and five scores | Cross-chart reading, houses, partner, separation, timing | Same as Gold | UI: `MilanMarriedLifePanel` (Gold+) |
| Kundali Milan All Sections and print | Hidden | Yes | Yes | UI: `compare/page.tsx` (`fullMilan`, Gold+) |
| Research pages/APIs | No | No | Yes | `src/proxy.ts` (`/research`, `/api/research`) — prefixes reserved; no route files and no UI |

\*Bulk import is available to any authenticated user until the plan’s chart save cap is reached.

## Notes

- Paid plans automatically downgrade to Free behavior after `planExpiresAt` (`getEffectivePlan` in `entitlements.ts`).
- Plan names are canonicalized to: `free`, `gold`, `platinum`.
- Live checkout: Razorpay (`/api/payment/checkout`, `/api/payment/verify`, `/api/webhooks/razorpay`). Stripe fields exist on `User` / `Subscription` models for future use.
- Route lists for `src/proxy.ts` live in `src/lib/security/proxyRules.ts`. `/api/subscription/*` is public. Milan and marriage gochar gates live in the route handlers.
- Early renewals extend the current period. An upgrade starts immediately. Platinum users cannot buy Gold. Full refunds and lost disputes remove the plan.
- **UI-only teasers** (Interpretation hub, Tattva, dasha “More”, planetary panels, etc.) pass `userPlan` and use `planMeetsUiGate` / `PlanGate`. They do not have dedicated paid API routes — treat them as conversion surfaces; server gates still apply wherever an API exists for the same domain.
