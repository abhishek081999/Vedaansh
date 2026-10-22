# What should we add next to Dashamsha (D10)? {#d10-next}

Ship **A10 + profession synthesis** next. The workspace already has Digpalas, Śāstra, and classroom tabs; the missing piece is the public-status and job-title layer that clients ask for first.

- A10 (Rajya Pada) is already calculated in `arudhas.ts` and unused in the D10 UI.
- `nakshatraProfession.ts` already builds career fields and is not wired into Dashamsha.
- Transit and dasha timing on D10 would turn the Śāstra tab into a prediction window.

@answer scope="D10 roadmap · next features · classical + product"
@meta locale=en
@source arudha title="Arudha A10 (Rajya Pada)" path=src/lib/engine/arudhas.ts
@source nakprof title="Nakshatra profession engine" path=src/lib/engine/nakshatraProfession.ts
@source sastra title="Classical D10 reader" path=src/lib/engine/dashamsaClassical.ts
@source analysis title="Dashamsha Digpala analysis" path=src/lib/engine/dashamsaAnalysis.ts
@source practical title="D10 classroom practical tabs" path=src/lib/engine/dashamsaPractical.ts

## What is already there? {#have}

| Tab or module | What it answers |
| --- | --- |
| Energy | Digpalas, key lords, dasha houses |
| Classical Śāstra | BPHS mahatphala, Phaladeepika livelihood, yogas, AmK |
| Sectors and Survival | Industry flavor and workplace rules |
| Circuit and Karma Yoga | Multi-varga why and Gītā sync |
| Bondage and Pending | Inherited and unfinished work karma |

Nine tabs already cover classroom teaching. New work should add **missing classical levers**, not another essay panel.

## What is the best next set? {#next}

@workflow id=d10-build title="Next D10 build order"
| lane now | Ship next |
| lane then | After that |
| lane later | Only if needed |
| a10 | A10 Rajya Pada | backend | now |
| synth | Profession synthesis | backend | now |
| time | Transit and dasha windows | backend | then |
| biz | Job vs business track | backend | then |
| annual | Varshaphal D10 | backend | later |
| a10 > synth | |
| synth > time | |
| time > biz | |
| biz > annual | |

@steps id=build-steps
| a10 | A10 Rajya Pada | Overlay A10 on D1 and D10. Read planet aspects to A10 for public title and how others see the career. | d10-build | a10 |
| synth | Profession synthesis | Merge Śāstra livelihood, Digpala fields, and nakshatra profession into one short career card with confidence. | d10-build | synth |
| time | Transit and dasha windows | Show gochara on the D10 10th and 11th, plus the next three career-sensitive Vimshottari slices. | d10-build | time |
| biz | Job vs business track | Classical 10th vs 7th and 2nd–11th rules for service, trade, or own venture. | d10-build | biz |
| annual | Varshaphal D10 | Year chart Dashamsha for promotion, transfer, and award years. | d10-build | annual |

## How do the candidates compare? {#compare}

| Feature | Classical base | Product value | Effort | Priority |
| --- | --- | --- | --- | --- |
| A10 Rajya Pada {#feat-a10} | Jaimini / Parashara arudha | High — “how the world sees my work” | Low {good:Reuse} | P0 |
| Profession synthesis card {#feat-synth} | Phaladeepika + Digpala + nakshatra | High — one answer clients want | Medium | P0 |
| D10 transit windows {#feat-transit} | Gochara on 10th / 11th | High — “when” | Medium | P1 |
| Job vs business {#feat-biz} | BPHS 7th and 10th | High for counseling | Medium | P1 |
| Foreign and transfer timing {#feat-foreign} | Varuna Digpala + 12th / 9th | Medium | Low | P1 |
| Vimsopaka D10 strength {#feat-vimso} | BPHS dashavarga | Medium | Low {good:Reuse} | P2 |
| Varshaphal D10 {#feat-varsha} | Tajika year chart | Medium | High | P2 |
| PDF career brief {#feat-pdf} | Export of Śāstra + synth | High for CRM | Medium | P2 |
| Employer / boss from 10th {#feat-boss} | Phaladeepika king and minister | Medium | Medium | P2 |
| More classroom lore tabs {#feat-lore} | Lecture notes | Low — already dense | Medium {caution:Noise} | Skip |

## What should each P0 look like? {#p0}

**A10 Rajya Pada.** Show A10 sign and house from lagna. List planets conjunct or aspecting A10. One sentence: title vs skill (A10 is public image; D10 10th is the work itself).

**Profession synthesis.** One card with: livelihood planet, Digpala fields, top nakshatra career fields, mahatphala grade, and a short “do this kind of work” line. Prefer overlap across sources over a long list.

@callout level=note title="Keep the tab count stable"
| Prefer new sections inside Energy, Śāstra, or a single Synthesis tab.
| Do not add a tenth classroom essay tab unless it has a clear prediction job.

## What should we verify before shipping? {#check}

- [ ] A10 matches the chart’s arudha set (raw and BPHS-corrected when both exist).
- [ ] Profession card cites which of Digpala, Phaladeepika, and nakshatra agreed.
- [ ] Transit window uses D10 houses, not only D1 gochara.
- [ ] Job vs business never overrides a formed Dharma-Karmadhipati without saying so.
- [ ] No new tab that only restates Karma Verticals or Survival.
