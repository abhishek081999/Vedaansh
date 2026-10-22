# Classical D10 — BPHS, Nārada Digpalas, Phaladīpikā line {#d10-classical}

Dashamsha Overview now opens with a **Classical** panel: Bṛhat Parāśara on varga purpose and calculation, Nārada Digpala citations for lagna/10th lord, and Phaladīpikā-style lagna flavours — teaching paraphrases tied to this chart.

- BPHS: Daśāṁśa for karma / ājīvikā; odd/even 3° parts.
- Nārada: Digpala of lagna degree and of D10 10th lord.
- Chart-conditioned: crowded Digpalas, 10th-lord house, kendra leaders, H1/H10 occupants.

@answer scope="dashamsaClassical.ts · Overview Classical section"
@meta locale=en
@source bphs title="Bṛhat Parāśara Horā Śāstra · Vargas"
@source narada title="Nārada Digpala teaching"

## What sources feed the panel? {#sources}

| Source | What it contributes |
| --- | --- |
| BPHS | Varga purpose + odd/even calculation {good:Foundation} |
| Nārada | Ten Digpala occupational colours {good:Direction} |
| Phaladīpikā line | D10 lagna sign flavour {good:Style} |
| Classical planets | Occupation nature of 10th lord / occupants |
| Jātaka Pārijāta line | Strongest D10 kendra planet weight |

## How citations are chosen {#flow}

@workflow id=classical-pick title="Classical citation selection"
| lane always | Always |
| lane dig | Digpala |
| lane lords | Lords |
| varga | BPHS varga definition | backend | always |
| calc | Odd/even calculation note | backend | always |
| lagna | Phaladīpikā lagna flavour | backend | always |
| dig1 | Lagna Digpala text | backend | dig |
| dig10 | 10th lord Digpala text | backend | dig |
| house | 10th lord house result | backend | lords |
| varga > calc | base |
| calc > lagna | sign |
| lagna > dig1 | compass |
| dig1 > dig10 | work |
| dig10 > house | fruit |

@steps id=classical-steps
| varga | BPHS varga definition | Why D10 exists for livelihood. | classical-pick | varga |
| dig1 | Lagna Digpala text | Directional colour of livelihood. | classical-pick | dig1 |
| dig10 | 10th lord Digpala text | How work karma is done. | classical-pick | dig10 |
| house | 10th lord house result | Where occupation crystallises. | classical-pick | house |

## Checklist {#check}

- [ ] Overview shows Classical section above Digpala map.
- [ ] Each card names source (BPHS / Narada / …) and locus.
- [ ] Texts are paraphrases — not long verbatim translations.
- [ ] Precepts remind: combine lagna, Digpala, and daśā before naming a job.
