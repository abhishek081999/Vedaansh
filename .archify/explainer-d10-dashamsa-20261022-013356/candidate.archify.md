# Dashamsha (D10) is the career and livelihood chart {#d10-career}

**D10** divides each sign into ten 3° parts and shows profession, income source, status, and work karma — read with D1, Digpalas, and the 10th/11th lords.

- Odd signs count Dashamsha from the planet’s own sign; even signs start from the 9th.
- Narada’s ten Digpalas (Indra→Ananta) color how each 3° part earns and leads.
- Priority houses in D10: 1 (foundation), 10 (karma), 11 (gains), 6 (competition).
- Vedaansh ships a full-width Dashamsha workspace under Core Analysis.

@answer scope="D10 Dashamsha · career · Digpalas · Vedaansh UI"
@meta locale=en
@source vedaansh-d10 title="D10 Dashamsha engine" path=src/lib/engine/dashamsaAnalysis.ts lines=1:40
@source vedaansh-varga title="D10 calculation" path=src/lib/engine/vargas.ts lines=130:135

## How is D10 calculated? {#calc}

@workflow id=d10-calc title="Dashamsha placement"
| lane split | Split the sign |
| lane count | Count the parts |
| lane place | Place in D10 |
| deg | Degree in sign | external | split |
| part | Part 1 to 10 | backend | split |
| odd | Odd sign? | backend | count |
| same | From own sign | backend | count |
| ninth | From 9th sign | backend | count |
| d10 | D10 rashi | backend | place |
| deg > part | 3° each |
| part > odd | |
| odd > same | yes |
| odd > ninth | no |
| same > d10 | add parts | emphasis |
| ninth > d10 | add parts | emphasis |

@steps id=d10-calc-steps
| deg | Degree in sign | Take the planet’s degree within its 30° Rashi. | d10-calc | deg |
| part | Part 1 to 10 | Floor(degree / 3) + 1 gives the Dashamsha part. | d10-calc | part |
| odd | Odd sign? | Odd Rashis count forward from the same sign. | d10-calc | odd |
| d10 | D10 rashi | Even Rashis count from the 9th; engine `D10()` matches this. | d10-calc | d10 |

## What do the Digpalas mean? {#digpalas}

| Direction | Deity | Ruling | Signification |
| --- | --- | --- | --- |
| East | Indra | Sun | Power, government {good:Authority} |
| South-East | Agni | Venus | Growth, remove obstacles {good:Growth} |
| South | Yama | Mars | Rules, persistence |
| South-West | Rakshasa | Rahu | Unconventional methods {caution:Boundary-break} |
| West | Varuna | Saturn/Moon | Overseas, wellness |
| North-West | Vayu | Saturn/Moon | Teaching, knowledge pay |
| North | Kubera | Mercury | Wealth skill {good:Finance} |
| North-East | Ishana | Jupiter | Mentors, banking |
| Below | Brahma | Lagna lord | Inner peace, foundation |
| Above | Ananta | 10th house | Wide fame {good:Reputation} |

@callout level=note title="Odd vs even Digpala order"
| Odd signs run Indra → Ananta across parts 1–10. Even signs reverse that order. |
| Paired degree bands in some Narada teachings (e.g. Indra at 0–3° and 27–30°) describe the same deities at both ends of the sign. |

## Which D10 houses matter first? {#houses}

| House {#h} | Career meaning |
| --- | --- |
| 1st | Livelihood foundation, work mindset |
| 6th | Competition, obstacles, speed breakers {caution:Friction} |
| 10th | Work karma, reputation building {good:Core} |
| 11th | Profits, awards, achievements {good:Gains} |
| 12th | Endings, donations, hidden enmities |

@facts id=read-order
| First | D10 Lagna + Lagna lord |
| Second | 10th lord Digpala and house |
| Third | 11th lord for gains; 6th for rivalry |
| Timing | Overlay current Vimshottari lords on D10 houses |

## Where is this in Vedaansh? {#product}

@steps id=product-path
| nav | Open Core Analysis | Choose Dashamsha (D10) next to Navamsha (D9). |
| chart | Dual D1 / D10 charts | Full-width workspace with career house highlights. |
| tabs | Use Digpalas and Career Lords | Mapping, houses, deity guide, and dasha overlay. |
| guide | Optional SEO guide | `/guides/what-is-dashamsha-d10-chart` explains the same rules. |

- [ ] Confirm chart has `vargas.D10` and `vargaLagnas.D10` after recalculate
- [ ] Open **Dashamsha (D10)** under Astrology → Core Analysis
- [ ] Check 10th and 11th lords on the Career Lords tab
- [ ] Note Digpala of key career planets on the Digpalas tab
