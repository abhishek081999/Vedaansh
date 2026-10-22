# How do we make Milan and Relationship more powerful? {#milan-power}

Yes. Ship **classical accuracy first**, then a **single composite Milan score**, then **Platinum-only depth**. The stack is already large; the next wins are depth and product clarity, not more tabs.

- Ashtakoot 36, Porutham 10, Deep Milan, and Married Life already ship on `/compare`.
- Manglik matching still uses Lagna only while teaching already scans Moon and Venus.
- Unused marriage engines and soft dasha heuristics leave power on the table.
- Platinum barely adds Milan value today; that is the monetization lever.

@answer scope="Upgrade plan · Oct 2026 · code-backed · no code shipped yet"
@meta locale=en style=product
@source doshas title="Manglik lagna-only despite Moon/Venus comment" path=src/lib/engine/doshas.ts lines=22:70
@source teaching title="Teaching already scans Lagna Moon Venus" path=src/lib/engine/manglikTeaching.ts lines=69:127
@source milan-suite title="Pair Manglik uses calculateManglik" path=src/lib/engine/milanSuite.ts lines=56:58
@source compare title="Compare hub tabs" path=src/app/compare/page.tsx lines=1:40
@source jaimini title="Darakaraka and Upapada in Jaimini marriage" path=src/lib/engine/jaiminiMarriageAnalysis.ts lines=607:714
@source matrix title="Gold unlocks Match-Making and Married Life depth" path=SUBSCRIPTION_MATRIX.md lines=42:46

## What do we already have? {#have}

| Layer | Today | Strength |
| --- | --- | --- |
| Guna Milan | 8 kootas, exceptions, eligibility | Strong {good:Keep} |
| Porutham | 10 including Rajju / Vedha | Strong {good:Keep} |
| Deep Milan | Houses, D9, Venus–Mars | Good {good:Keep} |
| Match-Making / Married Life | Gold depth panels | Good {good:Keep} |
| Manglik for Milan | Lagna only | Thin {caution:Upgrade} |
| Dasha pair | Lord-weight colour | Soft {caution:Upgrade} |
| Platinum Milan | Same as Gold + save cap | Weak {bad:Gap} |

Teaching already labels aṁśik vs pūrṇa from Lagna, Moon, and Venus. Matching still ignores that.[](source:teaching)[](source:doshas)

## What should we build? {#phases}

@workflow id=power-phases title="Three upgrade waves"
| lane accuracy | Classical accuracy |
| lane score | Product power |
| lane tier | Platinum depth |
| manglik | Full Kuja from Lagna Moon Venus | backend | accuracy |
| cancel | Richer Manglik cancellations | backend | accuracy |
| wire | Wire karma and Venus marriage | frontend | accuracy |
| composite | One Milan Power Score | frontend | score |
| dasha | 7th / DK / UL dasha synastry | backend | score |
| api | Server Milan recalculate API | backend | score |
| plat | Platinum dual UL DK gochar | frontend | tier |
| report | Astrologer-grade PDF pack | frontend | tier |
| manglik > cancel | |
| cancel > wire | |
| wire > composite | emphasis |
| composite > dasha | |
| dasha > api | |
| api > plat | |
| plat > report | |

@steps id=phase-steps
| manglik | Full Kuja from Lagna Moon Venus | Fold perspectives into `calculateManglik` so Milan pair and Dosha tab use one truth. | power-phases | manglik |
| cancel | Richer Manglik cancellations | Add mutual Mars match weight, more Guru/Saturn softens, age note as soft flag. | power-phases | cancel |
| wire | Wire karma and Venus marriage | Surface unused engines in Married Life and Relationship. | power-phases | wire |
| composite | One Milan Power Score | Blend Guna, Porutham, Manglik pair, Deep, dasha into one headline with sub-scores. | power-phases | composite |
| dasha | 7th / DK / UL dasha synastry | Score overlapping Maha/Antar on marriage significators, not colour alone. | power-phases | dasha |
| plat | Platinum dual UL DK gochar | Keep Gold as depth; make Platinum the dual Jaimini + transit pack. | power-phases | plat |

## What ships in wave 1? {#wave1}

| Item | Change | Why first |
| --- | --- | --- |
| Multi-ref Manglik | Score from Lagna, Moon, Venus; keep aṁśik / pūrṇa | Matches classical texts and existing teaching UI {good:Do first} |
| Pair verdict upgrade | Intensity uses activeCount, not lagna house alone | Fixes false “clear” when Moon/Venus Kuja is hot {good:Do first} |
| Cancellation catalog | Extend `doshas.ts` with documented rules + tests | Raises trust without new tabs {good:Do first} |
| Wire unused engines | `marriageKarma`, `venusMarriage` into panels | Power already coded {good:Quick win} |
| Composite score | Later in wave 1 after Manglik truth is stable | Needs stable inputs {caution:After Manglik} |

@callout level=note title="Do not add more tabs first"
| `/compare` already has many tabs. Deepen engines and one headline score before new surfaces.[](source:compare)

## How should plans change? {#plans}

| Feature | Free | Gold | Platinum |
| --- | --- | --- | --- |
| Ashtakoot + Porutham + core Dosha | Yes {good:Keep} | Yes | Yes |
| Match-Making / Married Life full | Teaser | Yes {good:Keep} | Yes |
| Multi-ref Manglik + composite score | Summary | Full breakdown | Full + export |
| Dasha synastry on 7th / DK / UL | No | Summary | Full timeline {good:New} |
| Dual Upapada / Darakaraka pack | Teaser | Teaser | Full {good:New} |
| Astrologer PDF pack | No | Summary HTML | Full pack {good:New} |

Gold stays the working depth tier. Platinum becomes the professional dual-chart pack.[](source:matrix)[](source:jaimini)

## What should we decide now? {#decide}

- [ ] Wave 1A — Multi-ref Manglik + cancellations + tests (engine)
- [ ] Wave 1B — Wire `marriageKarma` / `venusMarriage` into UI
- [ ] Wave 1C — Composite Milan Power Score on `/compare` header
- [ ] Wave 2 — Dasha synastry + server Milan API
- [ ] Wave 3 — Platinum dual UL/DK + report pack

Recommended start: **1A then 1C**. Accuracy first, then one powerful headline score users feel immediately.
