# Why did Kundali Milan call 36/36 “not good”? {#ashtakoot-36}

A full **36/36** Ashtakoot score is excellent. The UI had framed scores above 32 as “caution / too similar,” which made a perfect match look bad.

- Eligibility used the label `Very high gunas (caution)` for every total above 32, including 36.
- The compare page put “Very high total” in the red Areas for awareness list.
- Strengths still said the score sat in the classical 18–32 window whenever `traditionallyAccepted` was true.

@answer scope="Kundali Milan Ashtakoot · Stage 1 gunas · UI copy fix"
@meta locale=en
@source ashtakoot-engine title="ashtakoot.ts eligibility" path="src/lib/engine/ashtakoot.ts"
@source compare-ui title="compare page verdict" path="src/app/compare/page.tsx"

## How did the old path treat a high total? {#old-path}

@workflow id=old-guna-path title="Old high-score framing"
| lane score | Score |
| lane band | Band |
| lane ui | UI |
| total | Total greater than 32 | backend | score |
| caution | Label caution | backend | band |
| red | Red awareness item | frontend | ui |
| total > caution | |
| caution > red | above_ideal | emphasis |

@callout id=band-note level=warning title="18–32 is a counselling window" text="The classical counselling window is 18–32. That window must not demote a perfect 36 into a warning."

## What does the UI show now? {#new-bands}

| Total | Band | Label | Verdict |
| --- | --- | --- | --- |
| Under 18 | `below_minimum` | Below traditional minimum | Below Traditional Minimum {bad:Refuse classically} |
| 18–32 | `ideal` | Good eligibility band (18–32) | Average / Good / Excellent by range {good:Accepted} |
| 33–35 | `above_ideal` | Excellent gunas (above 32) | Excellent Match {good:Excellent} |
| 36 | `above_ideal` | Perfect Ashtakoot (36/36) | Perfect Match {good:Best Stage 1} |

## What changed in code? {#fixes}

@workflow id=fix-path title="Fix path for 36/36"
| lane engine | Engine |
| lane ui | UI |
| elig | Perfect eligibility | backend | engine |
| verdict | Perfect Match verdict | frontend | ui |
| awareness | Drop red high-total warning | frontend | ui |
| strength | Band-specific strengths | frontend | ui |
| elig > verdict | |
| verdict > awareness | |
| awareness > strength | |

@steps id=fix-steps
| elig | Perfect eligibility | `buildEligibility` labels 36 as Perfect Ashtakoot with no caution. | fix-path | elig |
| verdict | Perfect Match verdict | `getVerdict(36)` returns Perfect Match in teal. | fix-path | verdict |
| awareness | Drop red high-total warning | High totals leave the rose Areas for awareness list. | fix-path | awareness |
| strength | Band-specific strengths | Ideal vs above-ideal bullets match the eligibility band. | fix-path | strength |

- [ ] Open `/compare`, load a 36/36 pair, confirm Perfect Match and Perfect Ashtakoot (36/36).
- [ ] Confirm Areas for awareness has no “Very high total” row.
- [ ] Confirm Relationship strengths mentions Perfect 36/36, not the 18–32 window.
