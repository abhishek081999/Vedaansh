# Advanced marriage build — all six tracks shipped {#advanced-marriage-shipped}

All six advanced marriage tracks are live on Gold: dated Ju–Sa windows, true synastry, Jaimini in Relationship and Milan, consultant case brief, print expansion, and follow-ons — without book or chapter labels, and without wedding-certainty dates.

- Dated gochar windows merge monthly Ju–Sa hits and only emphasize them when dasha already supports marriage.
- Synastry overlays Ve/Ju/Mo/Ma/DK house-to-house plus a D9×D9 alignment score.
- Sticky five-bullet case briefs sit on Relationship and Milan Married Life.
- Print, muhurta handoff, client-safe tone, yoga checklist, intimate dual, and remarriage header close the loop.

@answer scope="Vedaansh · Gold marriage surfaces · engines + UI + print"
@meta locale=en

## Delivery map {#delivery-map}

@workflow id=marriage-delivery title="Advanced marriage tracks to surfaces"
| engines | Engines ready | backend |
| rel | Rel Timing | frontend |
| milan | Milan Married | frontend |
| print | Compare print | frontend |
| follow | Follow-ons | frontend |
| engines > rel | windows |
| engines > milan | overlay |
| engines > print | sections |
| rel > follow | muhurta |
| milan > follow | dual |

## Track checklist {#tracks}

| Track | Engine / UI | Status |
| --- | --- | --- |
| Dated Ju–Sa windows | `marriageGochar.ts` · Timing + Milan columns | Shipped {good:Done} |
| True synastry + D9×D9 | `marriageSynastry.ts` · Milan overlay card | Shipped {good:Done} |
| Jaimini UX | Relationship tab · Milan dual columns | Shipped {good:Done} |
| Case brief | `marriageCaseBrief.ts` · sticky Gold cards | Shipped {good:Done} |
| Print expand | `milanHtml.ts` Match-Making + Married Life | Shipped {good:Done} |
| Follow-ons | Muhurta link · tone · yoga · intimate · remarriage | Shipped {good:Done} |

## Locked product rules {#rules}

@callout id=product-locks level=note title="Product locks"
| No book or chapter names in user copy. |
| No computed divorce or wedding certainty dates — only opportunity windows and softeners. |
| Muhurta handoff is a link to `/muhurta?from=&to=` from the first timing window. |

## Primary files {#files}

@steps id=file-touchpoints
| engines | Engines | `marriageGochar.ts`, `marriageSynastry.ts`, `marriageCaseBrief.ts` | marriage-delivery | engines |
| ui | UI | Relationship, Milan Married Life, shared `marriedLifeUi`, Expand | marriage-delivery | milan |
| print | Print | `milanHtml.ts` Match-Making + Married Life classical sections | marriage-delivery | print |
| tests | Tests | gochar, synastry, and case-brief Vitest suites | marriage-delivery | engines |
