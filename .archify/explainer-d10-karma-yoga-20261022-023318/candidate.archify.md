# D10 Karma Yoga tab — Gītā ch.3 on career timing {#d10-karma-yoga}

Vedaansh’s new **Karma Yoga** tab maps Bhagavad Gītā chapter 3 onto Dashamsha: **8th/12th dashas end work chapters; remedies align acceptance, not destiny.**

- Dasha lords are read in D10 houses (8 = exit, 12 = release/faith, 5+8 = demotion, 5+12 = transfer, 11 = team shift).
- Fire/Earth/Air/Water house triads pick yajña-style remedies (agnihotra, dāna, kīrtan, pilgrimage).
- Strong-in-D1 / soft-in-D9 planets open D10 for the corrupting karma; D1↔D10 lagna sync flags career stability.

@answer scope="Dashamsha workspace · Karma Yoga tab · engine buildKarmaYoga"
@meta locale=en
@source gita3 title="Bhagavad Gītā ch.3 (Karma Yoga)" 
@source code title="dashamsaPractical.ts buildKarmaYoga"

## How does a D10 dasha translate into work events? {#dasha-events}

@workflow id=dasha-to-event title="D10 dasha house → career event"
| lane path | Path |
| lane map | Map |
| lane rule | Rule |
| lane guide | Guide |
| load | Read dasha lords | frontend | path |
| place | Map lords to D10 houses | backend | map |
| rule | Apply 8 / 12 / 5+8 / 5+12 / 11 | backend | rule |
| split | Jnana vs Bhakti path | external | guide |
| counsel | Warn early · accept · do not reverse | frontend | guide |
| load > place | overlay |
| place > rule | houses |
| rule > split | crisis |
| split > counsel | ethics |

@steps id=dasha-steps
| load | Read dasha lords | Overlay lords from `dashaOverlay.lords`. | dasha-to-event | load |
| place | Map lords to D10 houses | Use each planet’s D10 house. | dasha-to-event | place |
| rule | Apply 8 / 12 / 5+8 / 5+12 / 11 | Emit tone and path hint. | dasha-to-event | rule |
| counsel | Warn early · accept · do not reverse | Crisis headline plus ethics list. | dasha-to-event | counsel |

## Which triad remedy when? {#triads}

| Triad | Houses | Element | Remedy |
| --- | --- | --- | --- |
| Fire | 1–5–9 | Agni | Agnihotra / fire yajña {good:Starts work} |
| Earth | 2–6–10 | Pṛthivī | Dāna / charity {good:Pending axis} |
| Air | 3–7–11 | Vāyu | Bhajan, kīrtan, abhiṣeka {good:Air field} |
| Water | 4–8–12 | Jala | Dhām yātrā / mokṣa practice {caution:Crisis link} |

A triad turns **Active** when planet + dasha hits on that group reach three or more (water also activates on 8/12 dasha).

## What else does the tab surface? {#surface}

@facts
| Sync | D1 lagna vs D10 lagna — synced charts stay steadier through dasha weather. |
| Corruption | Exalted/own in D1 + enemy/debilitated in D9 → check D10 for spoiling karma. |
| Oil field | One rāśi’s livelihood energy depletes when its dasha ends; lagna can recharge. |
| Ethics | Serve grahas, speak hard timelines, return fees if tapasyā is refused. |

## Checklist for a reading {#check}

- [ ] Confirm career questions on **D10**, not D1 alone.
- [ ] Note any 8th or 12th dasha lord and warn about chapter end.
- [ ] If 5th + 8th or 5th + 12th both hit, flag demotion or transfer.
- [ ] Pick the Active triad remedy; avoid transactional “save my job” only.
- [ ] Scan corruption pairs and open those planets in D10.
- [ ] Say whether D1/D10 lagna are synced before promising stability.
