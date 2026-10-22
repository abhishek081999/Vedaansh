# D10 advanced upgrade — four tabs, Digpala-first, ranked careers {#d10-advanced}

Dashamsha is now a **prediction-grade product surface**: Digpala map on Overview, ranked livelihood fields with confidence, Amatyakāraka + 10th-from-Moon/Sun axes, and four tabs instead of eight.

- Overview: Digpala buckets, ranked professions, lords, D1→D10 table.
- Timing: lagna sync, dasha×D10, crisis events.
- Practical: matched drain/combos/pending only (no Quiet clutter).
- Depth: circuit, bondage, verticals, triad remedies.

@answer scope="Dashamsha advanced UI + profession ranking + AmK"
@meta locale=en
@source code title="dashamsaAnalysis.ts · DashamsaWorkspace.tsx"

## What changed? {#changes}

| Before | After |
| --- | --- |
| 8 classroom tabs | 4 product tabs {good:Focus} |
| Digpala buckets unused | Full Digpala map on Overview {good:Classical} |
| Flat profession list | Ranked fields with % confidence {good:Counsel} |
| No Jaimini career hook | Amatyakāraka in D10 + Moon/Sun 10th axes {good:Depth} |
| Quiet combo spam | Matched-only on Practical {good:Clean} |

## How does ranking work? {#rank}

@workflow id=profession-rank title="Livelihood field ranking"
| lane dig | Digpala |
| lane lord | Lords |
| lane jaimini | Jaimini |
| lagna | Lagna Digpala professions | backend | dig |
| tenth | 10th lord Digpala | backend | lord |
| amk | Amatyakāraka Digpala | backend | jaimini |
| moon | 10th-from-Moon occupants | backend | jaimini |
| sort | Sort by confidence | frontend | dig |
| lagna > tenth | weight |
| tenth > amk | weight |
| amk > moon | weight |
| moon > sort | top 12 |

@steps id=rank-steps
| lagna | Lagna Digpala professions | Base +28 per field. | profession-rank | lagna |
| tenth | 10th lord Digpala | Strongest weight (+32). | profession-rank | tenth |
| amk | Amatyakāraka Digpala | Jaimini career significator (+22). | profession-rank | amk |
| sort | Sort by confidence | Show top fields with sources. | profession-rank | sort |

## Checklist {#check}

- [ ] Open Overview — Digpala grid shows Lagna badge on primary deity.
- [ ] Confirm top lean % badge in hero matches ranked[0].
- [ ] Timing tab shows sync status (Earth bridge for Virgo/Capricorn).
- [ ] Practical shows only Hit flags, not Quiet cards.
- [ ] Depth still reaches circuit + ethics without the old 8-tab sprawl.
