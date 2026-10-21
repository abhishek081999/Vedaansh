# Are Kundali Milan and Relationship ready? {#milan-rel-ready}

Matching and the solo marriage reading are real and mostly Gold-gated. Four high gaps still block “good”: Expand print leaks Gold, dual Save confuses users, print is thinner than the UI, and coach copy still reaches clients.

- Product split is clear: Relationship is one chart; Milan is two charts on `/compare`.
- Gold gates for Match-Making, Married Life, All Sections, and header print match `SUBSCRIPTION_MATRIX.md`.
- Free Expand print and muhurta still leak paid paths.
- Engines for karma and Venus marriage sit tested but unused in UI.

@answer scope="Live code audit · Oct 2026 · no product change"
@meta locale=en style=product
@source expand-print title="Expand ungated Print All Sections" path=src/components/ui/MilanExpandPanel.tsx lines=183:186
@source compare-print title="Header print requires fullMilan Gold" path=src/app/compare/page.tsx lines=440:449
@source compare-save title="Header Save Kundali Milan to Mongo" path=src/app/compare/page.tsx lines=620:638
@source milan-history title="Local-only Expand history" path=src/lib/milan/milanHistory.ts lines=1:20
@source print-thin title="Print married-life slice" path=src/lib/pdf/milanHtml.ts lines=418:468
@source matrix title="Subscription matrix Milan and Relationship rows" path=SUBSCRIPTION_MATRIX.md lines=42:46
@source rel-panel title="Relationship Gold gate and tabs" path=src/components/ui/RelationshipMarriagePanel.tsx lines=186:260
@source principles title="Milan Married Life principles footers" path=src/components/ui/MilanMarriedLifePanel.tsx lines=355:483

## How do the two surfaces differ? {#surfaces}

@architecture id=milan-rel-map title="Relationship vs Kundali Milan"
| rel | Relationship tab | frontend |
| milan | Compare / Milan | frontend |
| engines | Marriage engines | backend |
| mongo | KundaliMilan Mongo | database |
| local | Expand localStorage | database |
| print | milanHtml print | frontend |
| api | milan + gochar APIs | backend |
| rel > engines | solo reading | emphasis |
| milan > engines | pair + dual | emphasis |
| milan > mongo | Save Kundali Milan | 
| milan > local | Save match | dashed |
| milan > print | Print All Sections | 
| milan > api | save / list / id | 
| engines > api | gochar windows Gold | security |

Relationship answers “what does this chart say about marriage?” Milan answers “how do these two charts fit?” There is no in-panel CTA between them.[](source:rel-panel)

## What is already solid? {#solid}

| Area | Status | Evidence |
| --- | --- | --- |
| Nav and entry | Wired {good:OK} | Chart tab + `/compare` + My Charts Milan library |
| Ashtakoot / Deep / Porutham / dosha | Free and complete {good:OK} | Matrix Free rows |
| Match-Making / Married Life depth | Gold teasers then full {good:OK} | PlanGate panels |
| Gochar windows API | Auth + Gold {good:OK} | `requirePlanGate('gold')` |
| Mongo Milan save | Caps 20 / 200 / unlimited {good:OK} | Save API + matrix |
| Advanced tracks (synastry, Jaimini, case brief) | Shipped in UI {good:OK} | Married Life + Relationship |

## Where are the real gaps? {#gaps}

| Sev | Gap | Where | Fix |
| --- | --- | --- | --- |
| High {#p1} | Expand Print bypasses Gold | `MilanExpandPanel` L185 vs header `fullMilan` | Pass `userPlan`; gate or remove Expand print |
| High {#p2} | Two Saves, different meaning | Header → Mongo; Expand → local only | Rename local; or sync when signed in |
| High {#p3} | Print ≠ All Sections UI | `milanHtml` Moon + classical + synastry line | Expand PDF or rename “Summary report” |
| High {#p4} | Coach / principles copy in client UI | Married Life + `marriedLifeUi` footers | Client-safe rewrite; keep coach behind toggle |
| Medium {#m1} | Free Expand hits gochar + muhurta | Expand L80–81, L247–265 | Gate like Relationship Timing |
| Medium {#m2} | Milan missing Rel dual for axis / combinations / Ju–Ma–Sa | vs Relationship `VIEWS` | Dual-render like intimate |
| Medium {#m3} | `marriageKarma` / `venusMarriage` unused | engines + tests only | Wire or retire |
| Medium {#m4} | Thin tests for timing, Jaimini, milan APIs | `milanSuite` / security | Add route + suite cases |
| Low {#l1} | No Rel ↔ Compare CTA | both panels | Short cross-link |
| Low {#l2} | Stale “soon Dasha” comment | CompatibilityDoshaPanel | Remove or wire Deep dasha |

@callout level=warning title="Monetization leak"
| Free users on Porutham + Timing can open Print All Sections from Expand while the header button stays Gold-only.[](source:expand-print)[](source:compare-print)

## What should ship first? {#fix-order}

@workflow id=fix-flow title="Quality fix order"
| lane gate | Close paid leaks |
| lane save | Clarify persistence |
| lane depth | Match print and copy |
| lane parity | Finish Rel ↔ Milan |
| print-gate | Gate Expand print + muhurta | frontend | gate |
| dual-save | Rename or unify Saves | frontend | save |
| print-depth | Grow or rename PDF | frontend | depth |
| copy | Client-safe engine voice | backend | depth |
| dual-tabs | Dual remaining Rel tabs | frontend | parity |
| orphans | Wire or drop karma / Venus | backend | parity |
| tests | Suite + API security tests | backend | parity |
| print-gate > dual-save | |
| dual-save > print-depth | |
| print-depth > copy | |
| copy > dual-tabs | |
| dual-tabs > orphans | |
| orphans > tests | |

@steps id=fix-steps
| print-gate | Gate Expand print + muhurta | Hide Expand print unless Gold; stop Free gochar fetch. | fix-flow | print-gate |
| dual-save | Rename or unify Saves | Label Expand “Save on this device” or push to Mongo when signed in. | fix-flow | dual-save |
| print-depth | Grow or rename PDF | Add case brief, pillars detail, dual columns — or call it a summary. | fix-flow | print-depth |
| copy | Client-safe engine voice | Drop principles blobs from default view; keep coach behind Client-safe off. | fix-flow | copy |
| dual-tabs | Dual remaining Rel tabs | Port 7th-axis, combinations, Ju–Ma–Sa notes into Milan Married Life. | fix-flow | dual-tabs |
| orphans | Wire or drop karma / Venus | Use in Bond tabs or delete unused modules. | fix-flow | orphans |
| tests | Suite + API security tests | Cover timing, dual Jaimini, milan save ownership, gochar Gold. | fix-flow | tests |

## What should you verify next? {#checklist}

- [ ] Free account: Expand has no Print All Sections and no muhurta CTA
- [ ] Gold account: header and Expand print both open; content matches All Sections intent or is labelled summary
- [ ] “Save Kundali Milan” lands in My Charts; Expand save label does not imply the same
- [ ] Relationship Client-safe on hides coach principles; Milan Married Life matches that rule
- [ ] Signed-in Free cannot call `/api/marriage/gochar-windows` successfully from Expand
