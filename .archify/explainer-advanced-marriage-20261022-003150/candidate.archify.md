# What would make marriage and Milan feel advanced? {#advanced-marriage}

The interpretive depth is already there. The next leap is packaging: dated timing, true cross-chart synastry, Jaimini inside the marriage UX, a consultant case brief, and reports that ship the Gold reading modules.

- Relationship already has fifteen Gold tabs plus classical predictions.
- Milan already covers Ashtakoot, match-making, married life, Porutham, Deep Milan, and print.
- Pros still need “when in this dasha,” not only “the window is open.”
- Side-by-side compare is not the same as A’s planets in B’s houses (and reverse).

@answer scope="Product roadmap · Relationship + Kundali Matching · extend existing engines"
@meta locale=en style=product

## Where you are strong today {#strong}

@architecture id=current-stack title="Marriage surfaces already built"
| rel | Relationship panel | frontend |
| classical | Classical predictions | backend |
| milan | Kundali Matching | frontend |
| guna | Ashtakoot Porutham | backend |
| engines | Married-life engines | backend |
| rel > classical | Gold tab | 
| classical > engines | chart-matched notes | 
| milan > guna | match suite | 
| milan > engines | Married Life dual | 
| engines > rel | depth tabs | dashed |
| engines > milan | compare helpers | dashed |

You already ship significators, 7th-axis teaching, Jaya, D1/D9 class, Venus–Jupiter scenarios, partner nature, separation, houses, 7th lord, intimate life, timing, remedies, and classical portrait/timing/happiness/remarriage — plus full Milan compare.

## Highest-value next builds {#priority}

| Priority | Add | Why | Extend |
| --- | --- | --- | --- |
| 1 | Dated Ju–Sa gochar windows | Pros sell year ranges, not open/closed flags {good:High} | `marriageGochar.ts` |
| 2 | True synastry overlays | “Does this chart be the partner?” {good:High} | `matchMaking.ts` / Deep Milan |
| 3 | Jaimini DK/UL in Relationship | DK timing is easy to miss in Jaimini-only UI {good:High} | `jaiminiMarriageAnalysis.ts` |
| 4 | Consultant case brief | Five bullets beat fifteen tabs in a session {good:High} | Compose existing flags |
| 5 | Print Match-Making + Married Life | Clients need the Gold reading in PDF {caution:Medium} | `milanHtml.ts` |
| 6 | D9×D9 / D7×D7 scores | Serious matching table-stakes {caution:Medium} | `matchMaking.ts` |
| 7 | Muhurta handoff from Milan windows | Natural next click after timing {caution:Medium} | `milanSuite` → muhurta |
| 8 | Tone toggle (technical vs client-safe) | Same engine, safer client language {caution:Medium} | `marriedLifeUi` copy layer |

## Suggested build order {#order}

@steps id=build-order
| time | Dated timing | Compute Ju–Sa ranges when dasha supports; wire age band to calendar years. | current-stack | engines |
| sync | True synastry | Overlay A into B’s 7th/Venus/DK houses and reverse; add D9×D9 scores. | current-stack | milan |
| jaimini | Jaimini in marriage UX | Surface DK/UL and dual Jaimini inside Relationship and Married Life. | current-stack | rel |
| brief | Case brief + print | One-page session brief; PDF includes Match-Making and classical married life. | current-stack | milan |

@callout id=ethics level=note title="Keep the ethics you already set" text="No book or chapter labels in user copy. Soften lethal classical lines. Never invent a divorce or wedding date from a single yoga."
