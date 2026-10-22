# How do you read Sthana Bala in practice? {#sthana-read}

Treat Sthana Bala as **lifetime space strength**: score the seven grahas in Virupas, then time results with the current or next Mahadasha lord.

- Sthana stays fixed for life; Kala and dasha change what fires when.[](source:lecture)
- On Vedaansh, use `componentShash.sthana` (Virupas); divide by 60 for Rupas.[](source:engine)
- Soft band: about 100 baseline, 135–145+ across all seven = above-average living space; Saturn is fine near 110–120.[](source:lecture)
- Classical worksheet floor on Vedaansh is 165 Virupas for the Sthana component percent.[](source:ui)

@answer scope="Sthana Bala Part 1 · lecture method · Vedaansh units"
@meta locale=en
@source lecture title="Shadbala Part 1 lecture notes (practitioner heuristics)"
@source engine title="Sthana Bala calculation" path=src/lib/engine/shadbala.ts lines=156:238
@source ui title="Shadbala worksheet minima" path=src/components/ui/ShadbalaTable.tsx lines=100:144
@source bphs title="BPHS Ch. 27–28 (engine header reference)" path=src/lib/engine/shadbala.ts lines=1:6

## What is Sthana Bala? {#what}

Sthana Bala is positional strength: dignity, vargas, odd/even signs, kendra house, and drekkana. It does not use Rahu or Ketu as scored grahas; read them via dispositor or house lord.[](source:lecture)

@facts
| Constant? | Yes — natal, lifelong |
| Planets scored | Su Mo Ma Me Ju Ve Sa |
| Vedaansh field | `componentShash.sthana` (Virupas) |
| Soft baseline | ~100 Virupas (lecture) |
| Soft strong band | 135–145+ on all seven |
| Classical min (UI) | 165 Virupas for % of required |
| Peak lecture range | often 200–270 |

@callout level=note title="Two rulers, one chart"
| Lecture bands (~100, 135–145) are practice heuristics for life quality and dasha timing.
| Vedaansh also shows Sthana as % of 165 Virupas (Parashara-style component floor).
| Compare planets inside one chart first; do not mix soft and classical rulers blindly.

## How is the score built? {#formula}

@workflow id=sthana-parts title="Five parts of Sthana"
| lane dig | Dignity |
| lane place | Placement |
| uccha | Uccha Bala | backend | dig |
| sapta | Saptavargaja | backend | dig |
| oja | Ojhayugma | backend | dig |
| ken | Kendradi | backend | place |
| dre | Drekkana | backend | place |
| uccha > sapta | |
| sapta > oja | |
| oja > ken | |
| ken > dre | |

@steps id=parts-steps
| uccha | Uccha Bala | Distance from debilitation point; max 60 Virupas. | sthana-parts | uccha |
| sapta | Saptavargaja | Dignity in D1 D2 D3 D7 D9 D12 D30 (friends, own, MT). | sthana-parts | sapta |
| oja | Ojhayugma | Odd/even Rashi and Navamsa fit for male vs female grahas. | sthana-parts | oja |
| ken | Kendradi | Kendra 60, panaphara 30, apoklima 15. | sthana-parts | ken |
| dre | Drekkana | First/middle/last 10° match by graha class; up to 15. | sthana-parts | dre |

## How do you analyse a chart? {#method}

@workflow id=sthana-method title="Sthana analysis flow"
| lane scan | Scan |
| lane time | Time |
| lane act | Act |
| open | Open Shadbala tab | frontend | scan |
| seven | Read seven Virupa rows | backend | scan |
| band | Grade soft vs classical | backend | scan |
| dasha | Pick current or next MD lord | backend | time |
| topic | Match topic to that lord | backend | time |
| remedy | Apply planet-domain remedies | external | act |
| open > seven | |
| seven > band | |
| band > dasha | |
| dasha > topic | |
| topic > remedy | |

@steps id=method-steps
| open | Open Shadbala tab | Classic view shows Virupa breakdown and Sthana % of 165. | sthana-method | open |
| seven | Read seven Virupa rows | Note dips below ~100 and peaks above ~150. | sthana-method | seven |
| band | Grade soft vs classical | Soft: 135–145+ all seven. Classical: ratio vs 165. | sthana-method | band |
| dasha | Pick current or next MD lord | Prefer the upcoming Mahadasha when asking about selection or shift. | sthana-method | dasha |
| topic | Match topic to that lord | Job, house, marriage, child destiny — use that planet’s Sthana. | sthana-method | topic |
| remedy | Apply planet-domain remedies | Space acts that match the weak graha’s karakatwa. | sthana-method | remedy |

## When does which band apply? {#bands}

| Question | Soft rule (lecture) | Vedaansh check |
| --- | --- | --- |
| Overall life / space quality | All seven ≥ 135–145 {good:Above avg} | Also scan dips under ~100 {caution:Struggle} |
| Classical Sthana adequacy | — | `sthana / 165` ≥ 1.0 {good:Meets floor} |
| Saturn specifically | 110–120 already good {good:Sa exception} | Still often lower than others |
| Next MD job / UPSC / shift | Next lord 150–230+ {good:Strong cue} | Confirm lord owns or aspects relevant houses |
| Child bhagyoday | Running MD lord 250–275 {good:High punya cue} | One factor only |
| Vastu / bad house feel | Low Sthana cluster {caution:Space stress} | Cross-check 4th lord and dig |

## What topics does Sthana answer? {#topics}

| Topic | How to use Sthana |
| --- | --- |
| Career / selection | Next MD lord’s Virupas; high → better seat, quarters, association |
| Life quality | Flat high band vs many dips |
| Property buy / sell | Dasha lord of the move; low → poor fit or unrest |
| C-section timing | Prefer birth moment with strong Sthana overall |
| Marriage | Partner’s or native’s running/upcoming MD Sthana; Sa stays sober at 110+ |
| Health (internal) | Weak planet → karaka deficiency (see table below) |
| Profile types | Landlords, builders, bureaucrats often show strong Sthana early |

## Weak Sthana and body cues {#body}

| Planet | Weak Sthana cue (lecture) |
| --- | --- |
| Ju | Knowledge / stability shortfall |
| Me | Metabolism / hormones slow |
| Ma | Heart-related weakness |
| Ve | Eyesight / refinement stress |
| Su | General vitality and leadership hold |
| Mo | Comfort, food, mother-axis strain |
| Sa | Clutter, backlog, workplace drain (often natal-low) |

## Remedies by planet domain {#remedies}

| Planet | Space / conduct focus |
| --- | --- |
| Ju | Open air, high ceilings, greenery, temple, yoga, prana |
| Me | Gardening, parks, learning, walks, herbs, play |
| Ma | Care for animals/plants, clean soil work, gym, Hanuman / Narasimha / Durga |
| Ve | Gau seva, hygiene, fragrance, deity shringar, Lakshmi, sweet speech |
| Su | Gayatri, Surya namaskar, jal arpan, temple seva without return |
| Mo | Stock good food, bhog, sankirtan, mother seva, tirtha with water |
| Sa | Clear clutter; clean desk and house areas of Sa’s houses |
| Ra / Ke | Visibility vs corner: high floor and mirrors (Ra) vs ground and cover (Ke) |

@callout level=warning title="Capacity, not guarantee"
| High Sthana is capacity for good space and status, not automatic yoga fruit.
| Always pair with house ownership, aspects, and dasha lords.
| Conscious remedies support living the graha’s domain; they do not rewrite natal math.

## What should you verify on Vedaansh? {#check}

- [ ] Open chart → Shadbala → Classic and read Sthana Virupas for Su–Sa.
- [ ] Note any planet under ~100 and any under the 165 classical floor.
- [ ] Identify current and next Mahadasha lords and their Sthana values.
- [ ] For a life question, use that lord’s Sthana plus house rulership — not the number alone.
- [ ] For Saturn, treat ~110–120 as usable even if others look higher.
