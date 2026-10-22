# D10 Survival Practice — EMI-level career reading {#d10-survival}

The **Survival Practice** tab is the non-Gītā D10 class: sectors, energy drain, helpability questions, and business-partner overlays — for “will my EMI clear,” not philosophy.

- Three layers always: House + Sign + Planet; D10 picks the sector door, D9 ripens the fruit.
- Drain rule: exit near 40% toxicity, not 100%; after long fog, step titles down before climbing again.
- Helpable clients ask sector and skill questions; date-only demanders are not ready.

@answer scope="Dashamsha · Survival Practice · buildSurvival"
@meta locale=en
@source survival title="D10 practical survival series"
@source code title="dashamsaPractical.ts buildSurvival"

## How do you keep a reading practical? {#method}

@workflow id=survival-read title="Survival D10 consult order"
| lane sector | Sector |
| lane drain | Drain |
| lane help | Help |
| signs | Read lagna + clustered signs | backend | sector |
| combos | Hit career combinations | backend | sector |
| drain | Score energy-drain flags | backend | drain |
| ask | Hear client questions | frontend | help |
| decide | Sector plan or refuse date-only | frontend | help |
| signs > combos | flavor |
| combos > drain | risk |
| drain > ask | posture |
| ask > decide | consent |

@steps id=survival-steps
| signs | Read lagna + clustered signs | Gemini vs Virgo, Leo vs Aquarius, 6 vs 12. | survival-read | signs |
| combos | Hit career combinations | Mars–Rahu, Venus–Ketu, Mercury 7th, Ketu lagna. | survival-read | combos |
| drain | Score energy-drain flags | Cancer, Viṣāda, 8/12 dasha, overconfidence. | survival-read | drain |
| decide | Sector plan or refuse date-only | Mutual energy required; donkey≠horse. | survival-read | decide |

## Energy drain flags {#drain-flags}

| Flag | Meaning |
| --- | --- |
| Cancer rising | Toxic mood / politics intolerance {caution:Fragile} |
| Ketu on lagna | Directionless — use placement institutes {caution:Fog} |
| Moon–Saturn | Viṣāda regret loop {caution:Bleed} |
| 8th/12th dasha | Chapter cutter — quit early {caution:Exit} |

## Partnership overlays on D10 {#partners}

| Overlay | Effect |
| --- | --- |
| Sun over Saturn | Sun side status declines {caution:Uneven} |
| Venus over Mars | Smooth heavy work {good:Fit} |
| Saturn over Mars | Violence risk {bad:Conflict} |
| Sun over Venus | Burns partner ease {caution:Burn} |
| Sun over Mercury | One leads, one papers {good:Roles} |

## Checklist {#check}

- [ ] State sector from D10 before promising D9 fruit.
- [ ] Name drain risk and the 40% exit rule if toxicity is live.
- [ ] Ask sector/skill questions; refuse pure date hunting.
- [ ] For business partners, overlay both D10s — not only D1.
- [ ] Protect Mercury; flag Venus–Ketu if conjunct.
