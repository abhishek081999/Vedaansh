# D10 is now prediction-grade, not a house table {#d10-advanced}

The upgrade matches classroom Digpala practice: **lagna Digpala → 10th-lord Digpala → 11th-lord dasha → 8th ethical track**, plus direction and profession sketch.

- Digpalas carry professions, compass advice, and prediction hooks — not one-line labels.
- Protocol mirrors the Hindi lecture: overseas via Varuna, creation via Brahma, fame via Ananta + 11th lord.
- Workspace tabs cover Advanced, Direction, Profession, Ethics, and Dasha × D10.
- Gandhi-style worked biography is not hard-coded; the same protocol runs on every chart.

@answer scope="D10 upgrade · Digpala prediction · Vedaansh"
@meta locale=en
@source d10-engine title="Advanced Dashamsha analysis" path=src/lib/engine/dashamsaAnalysis.ts lines=1:30

## What changed from basic D10? {#gap}

| Layer | Before {caution:Basic} | Now {good:Advanced} |
| --- | --- | --- |
| Digpala | Short signification | Professions, direction advice, prediction hook |
| Houses | One-line themes | Classroom detail (ājīvikā, ethical track, awards) |
| Prediction | Key lords only | Full protocol + creation vs fame |
| Direction | Missing | Transfer / overseas / setup compass |
| Timing | Generic dasha note | 10L / 11L flagged fame window |

## How should you read a chart? {#protocol}

@workflow id=d10-protocol title="Advanced D10 read order"
| lane digpala | Digpala first |
| lane lords | Lords next |
| lane time | Time last |
| lagna | Lagna Digpala | external | digpala |
| tenth | 10th lord Digpala | backend | digpala |
| eleventh | 11th lord | backend | lords |
| eighth | 8th ethical track | backend | lords |
| dasha | Vimshottari × D10 | backend | time |
| lagna > tenth | direction + style |
| tenth > eleventh | karma → awards | emphasis |
| eleventh > eighth | check track |
| eighth > dasha | time events |

@steps id=d10-protocol-steps
| lagna | Lagna Digpala | From D1 Lagna degree: livelihood compass and foreign themes. | d10-protocol | lagna |
| tenth | 10th lord Digpala | Brahma = create + inner peace; Yama = never retreat; Ananta = sky fame. | d10-protocol | tenth |
| eleventh | 11th lord | Awards jump in this lord’s dasha after a public event. | d10-protocol | eleventh |
| eighth | 8th ethical track | Ethical vs unethical secrets — confirm with D1. | d10-protocol | eighth |
| dasha | Vimshottari × D10 | Flag periods when path lord is 10L or 11L. | d10-protocol | dasha |

## Digpala compass cheat sheet {#compass}

| Digpala | Direction | Use for |
| --- | --- | --- |
| Indra | East | Power + government; East transfer relief {good:Authority} |
| Agni | SE | Growth, motivation, forces |
| Yama | South | Lawyers, judges, no-retreat work |
| Rakshasa | SW | Shortcuts — watch ethics {caution:Grey} |
| Varuna | West | Overseas, shipping, medicines {good:Foreign} |
| Vayu | NW | Teaching, writing, knowledge pay |
| Kubera | North | CA, consultants, buddhi income |
| Ishana | NE | Mentors, banking, spiritual pay |
| Brahma | Below | Creation + inner peace |
| Ananta | Above | Worldwide reputation {good:Fame} |

## Where to click in Vedaansh {#ui}

- [ ] Open **Dashamsha (D10)** under Core Analysis
- [ ] Read **Advanced Protocol** before declaring a profession
- [ ] Check **Direction & Transfer** for Varuna / compass advice
- [ ] Use **Ethics & Secrets** only with D1 confirmation
- [ ] Open **Dasha × D10** and watch 10L / 11L badges
