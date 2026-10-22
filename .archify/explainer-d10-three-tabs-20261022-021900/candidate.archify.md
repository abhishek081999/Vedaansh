# D10 now has three practical tabs {#d10-tabs}

**Dashamsha Energy** keeps Digpala career reads; **Karma Verticals** adds ṛṇa / recognition; **Sectors & Signs** maps industries from Rashi flavor.

- Energy = Digpala protocol, mapping, direction, ethics, dasha.
- Karma = D10↔D1 bonds, 2nd-house speech/lineage, body–mind–soul verticals, 11/8/6 desire–fear–prārabdha, recognition score.
- Sectors = House + Sign + Planet method, Aries–Pisces industry lore, career combo hits.

@answer scope="D10 three tabs · practical classroom"
@meta locale=en
@source practical title="Practical D10 engine" path=src/lib/engine/dashamsaPractical.ts lines=1:25

## Which tab for which question? {#which}

| Question | Tab {good:Go here} |
| --- | --- |
| Digpala, direction, 10th/11th lords | Dashamsha Energy |
| Who shares my karma? Speech/family debt? | Karma Verticals |
| Thankless work vs recognition? | Karma Verticals |
| Which industry / interview sector? | Sectors & Signs |
| Civil / aviation / influencer combos? | Sectors & Signs |

## Karma verticals in one pass {#verticals}

@workflow id=karma-vert title="Body mind soul D10"
| body | Lagna D10 | external |
| mind | Moon as Lagna | backend |
| soul | Sun as Lagna | backend |
| body > mind | Matṛ-ṛṇa |
| mind > soul | attachment | emphasis |

@steps id=karma-vert-steps
| body | Lagna D10 | Body karma and people you physically share life with. | karma-vert | body |
| mind | Moon as Lagna | Mind tendencies and mother’s debt flavor. | karma-vert | mind |
| soul | Sun as Lagna | What binds the soul to material work. | karma-vert | soul |

## Sector rule {#sector}

- [ ] Read **House** (base) + **Sign** (flavor) + **Planet** (delivery) together
- [ ] Use D10 for **sector**; confirm fruit with D9 / dasha
- [ ] Check recognition four factors before promising fame
- [ ] Prefer “which sector?” clients over “when will job come?” only
