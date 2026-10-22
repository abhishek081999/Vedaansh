# Why is 36/36 Ashtakoot shown with caution? {#ashtakoot-36-caution}

A **36/36** gun match is mechanically maxed, but the product treats it as **caution**: totals above 32 are often “too similar,” and **same Nadi** remains a progeny concern even when an exception restores points.

- Ideal counselling band is 18–32 gunas.
- Above 32 (including 36) uses a caution verdict and gold eligibility band.
- Same Nadi never counts as a strength; cancelled same-Nadi still appears under Areas for awareness.

@answer scope="Kundali Milan Ashtakoot · 36/36 caution · same Nadi"
@meta locale=en
@source ashtakoot-engine title="ashtakoot.ts" path="src/lib/engine/ashtakoot.ts"
@source compare-ui title="compare page" path="src/app/compare/page.tsx"

## How does Stage 1 decide the band? {#band-flow}

@workflow id=guna-band-flow title="Guna band and Nadi check"
| lane score | Score |
| lane nadi | Nadi |
| lane ui | UI |
| total | Compute eight kootas | backend | score |
| band | Band by total | backend | score |
| same | Same Nadi? | backend | nadi |
| caution | Caution copy | frontend | ui |
| total > band | |
| band > same | |
| same > caution | yes or high total | emphasis |

@callout id=nadi-rule level=warning title="Same Nadi is the gravest koota fault" text="Different Nadi is required for a clean progeny read. Cancellation can restore 8 points, but the UI still flags same Nadi."

## What does each band show? {#bands}

| Total | Band | Label | Verdict |
| --- | --- | --- | --- |
| Under 18 | `below_minimum` | Below traditional minimum | Below Traditional Minimum {bad:Classical refuse} |
| 18–32 | `ideal` | Good eligibility band (18–32) | Average / Good / Excellent {good:Preferred window} |
| 33–35 | `above_ideal` | Very high gunas (caution) | Very High — Caution {caution:Too similar} |
| 36 | `above_ideal` | 36/36 gunas (caution) | 36/36 — Caution {caution:Max score + caution} |

## What should you verify on `/compare`? {#verify}

@steps id=verify-steps
| band | Caution label | Eligibility shows 36/36 gunas (caution) in gold. | guna-band-flow | caution |
| nadi | Nadi awareness | Same Nadi appears under Areas for awareness, not strengths. | guna-band-flow | same |
| strength | No false strength | Strengths never claim Different nadi when p1 equals p2. | guna-band-flow | same |

- [ ] Open a 36/36 milan and confirm verdict `36/36 — Caution`.
- [ ] If Nadi names match, confirm a red awareness row for Nadi.
- [ ] Confirm Relationship strengths does not say Different nadi for that case.
