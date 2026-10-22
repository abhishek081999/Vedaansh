# How does the D10 Śāstra tab read a career? {#d10-sastra}

The Śāstra tab names the kind of work from the birth chart, then reads Dashamsha for the status that work can reach.

- Phaladeepika scores the 10th lord, occupants, aspectors, and the Navamsha lord of the 10th lord.[](source:phala)
- BPHS treats Dashamsha as mahatphala, so the D10 10th lord’s house is the status result.[](source:bphs)
- A yoga appears only when this chart forms it. Vimshottari of those lords times the result.[](source:engine)

@answer scope="D10 Śāstra tab · BPHS · Phaladeepika"
@meta locale=en
@source bphs title="Brihat Parashara Hora Shastra — Dashamsha and the 10th lord" path=src/lib/engine/dashamsaClassical.ts
@source phala title="Phaladeepika livelihood chapter and Uttara Kalamrita" path=src/lib/engine/dashamsaClassical.ts
@source saravali title="Saravali and Brihat Jataka — movable, fixed, or dual 10th" path=src/lib/engine/dashamsaClassical.ts
@source jaimini title="Jaimini Sutras — Amatyakaraka" path=src/lib/engine/dashamsaClassical.ts
@source engine title="Vedaansh Dashamsha classical reader" path=src/lib/engine/dashamsaClassical.ts

## How do you read one chart? {#read}

@workflow id=sastra-read title="Read one D10 chart"
| lane name | Name the work |
| lane status | Read the status |
| lane time | Time it |
| d1 | Score the birth 10th | backend | name |
| d10 | Place the D10 10th lord | backend | status |
| yoga | Keep formed yogas | backend | status |
| dasha | Time those lords | backend | time |
| d1 > d10 | |
| d10 > yoga | |
| yoga > dasha | |

@steps id=read-steps
| d1 | Score the birth 10th | Use the strongest of the four Phaladeepika pointers, plus the 10th from Moon and from Sun. | sastra-read | d1 |
| d10 | Place the D10 10th lord | Read that lord’s Dashamsha house as the shape of status. Note if the 10th sign is movable, fixed, or dual. | sastra-read | d10 |
| yoga | Keep formed yogas | Dharma-Karmadhipati, Digbala, Vargottama, Neecha Bhanga, and Budha-Aditya count only when formed. | sastra-read | yoga |
| dasha | Time those lords | Watch Vimshottari of the 10th lord, the livelihood planet, and the Amatyakaraka. | sastra-read | dasha |

@callout level=warning title="Do not merge a split"
| If the livelihood planet and the D10 status lord differ, keep both.
| One names the kind of work. The other names how rank is earned.

## Which text answers which question? {#texts}

| Question | Text | Where Vedaansh reads it |
| --- | --- | --- |
| What kind of work? {#kind} | Phaladeepika, Uttara Kalamrita | Birth-chart 10th |
| What status can it reach? {#status} | BPHS mahatphala | D10 10th lord’s house |
| One post, two, or many changes? {#mode} | Saravali, Brihat Jataka | D10 10th sign |
| Who is the minister? {#amk} | Jaimini | Amatyakaraka in D10 |
| When does it show? {#when} | Vimshottari | Those three lords |

| Score | Grade |
| --- | --- |
| 72 to 96 | Mahat {good:Highest} |
| 52 to 71 | Distinguished |
| 34 to 51 | Notable |
| 8 to 33 | Ordinary {caution:Endurance} |

The grade adds lagna-lord dignity, 10th-lord dignity, and the 10th lord’s house. It also adds Digbala, Dharma-Karmadhipati, Vargottama, Neecha Bhanga, a strong Amatyakaraka, and benefic drishti on the D10 10th.

## What did the sample chart show? {#sample}

Opened chart: Male, 4 Aug 1988, 20:45, New Delhi. The four counted factors are 18 + 18 + 8 + 6 = 50, so the grade is Notable.

@facts id=sample-facts
| Grade | Notable · 50 |
| Livelihood | Mars — metal, fire, surgery, defense |
| D10 status | Mercury, exalted, 10th lord in house 1 |
| D10 10th sign | Gemini · dual |
| Formed yoga | Budha-Aditya — Sun and Mercury in D10 Virgo |
| Amatyakaraka | Sun in D10 house 1 |
| Live period | Sukshma Mercury until 2026-11-01 |

Mars is the kind of work. Mercury is how status is earned: self-made, in a dual sign, so a second skill sits beside the main post. Mercury’s own period is the one to watch.

## What should you check on the tab? {#check}

- [ ] Read the livelihood planet and the D10 status lord as two lines when they differ.
- [ ] Confirm the grade from the factor list, not from the headline alone.
- [ ] Use a formed yoga in the prediction only if its card says Formed.
- [ ] Time the result with the lord marked Live, or with the next period of the 10th lord.
