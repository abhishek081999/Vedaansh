# What prediction product can Vedaansh ship from Tattva notes? {#verdict}

Ship a **Tattva Prediction Layer**: chart → four trikonas → dasha flavor → safety-gated remedies. Most of the teaching text already lives in Rashi and Lagna modules; the gap is chart-conditioned synthesis wired into Dasha and analysis panels.

- Reuse `rashiInterpretations`, `lagnaSpirituality`, modality counts in Dig/Drig, and Vimshottari period analysis — do not rebuild sign encyclopedias.[](source:rashi)[](source:lagna)[](source:modality)[](source:vim)
- New value is predictive: Agni initiation type, Artha money type, Vayu network load, Moksha stress, plus Active/Reactive dasha spice.
- Gate hard claims as educational; Moon MD/AD should suppress firm event predictions (session rule).
- Gold unlocks full synthesis; Free keeps trikona map teaser; Platinum can add client CRM remedy packs.

@answer scope="Vedaansh product plan · Tattva + Dasha prediction · educational only"
@meta locale=en style=product
@source rashi title="Rashi teaching profiles" path=src/lib/engine/rashiInterpretations.ts lines=60:75
@source lagna title="Lagna element tattva" path=src/lib/engine/lagnaSpirituality.ts lines=53:80
@source modality title="Chara/Sthira/Dual chart counts" path=src/lib/engine/digDrigChestaAnalysis.ts lines=214:221
@source vim title="Vimshottari period analysis" path=src/lib/engine/dasha/vimshottariAnalysis.ts lines=1:40
@source panel title="Dasha interpretation UI" path=src/components/dasha/DashaInterpretationPanel.tsx lines=1:30
@source matrix title="Subscription matrix dasha gate" path=SUBSCRIPTION_MATRIX.md lines=31:31

## What already exists vs what is new? {#gap}

| Capability | In app today | From session notes |
| --- | --- | --- |
| Sign tattva encyclopedia | Strong {good:Rashi + Lagna} | Same concepts, prediction-ready copy |
| Fire initiation flavors | Partial {caution:Aries/Leo/Dhanu notes} | Survival / Sustenance / Purpose as chart rule |
| Money types 2-6-10 | Weak {bad:Missing product} | Lineage / daily toil / peak karma |
| Air network 3-7-11 | Weak {bad:Missing} | Influencer / partnership density |
| Moksha 4-8-12 stress | Partial {caution:House notes} | 4↔8 activation warning |
| Active vs Reactive dasha | Missing {bad:New} | Odd/even spice on MD/AD |
| Life change tempo | Partial {good:Dig modality} | Extend to D1 + D10 planet piles |
| Dasha remedies | Snippets {caution:Scattered} | Moon / Ketu / Sun protocol |
| Moon no-predict UX | Missing {bad:New} | Soft-lock firm forecasts in Moon periods |

## Which product modules should we build? {#modules}

@tree id=tattva-modules title="Tattva prediction modules"
| root | Tattva Prediction | - |
| map | Trikona Map | root |
| agni | Agni Initiation | map |
| artha | Artha Money Types | map |
| vayu | Vayu Network | map |
| moksha | Moksha Stress | map |
| dasha | Dasha Flavor Engine | root |
| spice | Active vs Reactive | dasha |
| moon | Moon Forecast Gate | dasha |
| life | Life Stability Score | root |
| rem | Remedy Protocol | root |
| ui | Chart + Dasha Panels | root |

@steps id=module-steps
| map | Trikona Map | Score planet density and lords in 1-5-9, 2-6-10, 3-7-11, 4-8-12; headline which element runs the life. | tattva-modules | map |
| agni | Agni Initiation | Classify how the native starts things: Aries survival bursts, Leo sustain, Dhanu purpose/parampara. | tattva-modules | agni |
| artha | Artha Money Types | Tag wealth as 2nd (lineage stock), 6th (daily grind), 10th (peak karma) from house load + dasha. | tattva-modules | artha |
| vayu | Vayu Network | Flag 3-7-11 concentration for speech, partners, audiences; Rahu amplifies outsider reach. | tattva-modules | vayu |
| moksha | Moksha Stress | Soft-read 4-8-12; warn that over-activating 8 can hit 4 (home/heart). | tattva-modules | moksha |
| spice | Active vs Reactive | Tag current MD/AD sign as initiative vs reaction — masala only, never sole verdict. | tattva-modules | spice |
| moon | Moon Forecast Gate | In Moon MD/AD, hide firm event cards; show sadhana guidance instead. | tattva-modules | moon |
| life | Life Stability Score | Count planets in Chara / Sthira / Dual on D1 and D10; reuse Dig modality notes. | tattva-modules | life |
| rem | Remedy Protocol | Combine house + karaka + rashi; Moon→Dvaita discourse, Ketu→Advaita/jnana, Sun→dharma/sacrifice. | tattva-modules | rem |
| ui | Chart + Dasha Panels | New tab or section under Interpretation / Dasha More; Gold full, Free teaser. | tattva-modules | ui |

## How should the prediction pipeline run? {#pipeline}

@workflow id=predict-flow title="From chart to safe prediction"
| lane input | Input |
| lane synth | Synthesis |
| lane gate | Safety |
| lane out | Output |
| chart | ChartOutput | backend | input |
| tri | Trikona scores | backend | synth |
| flavor | Dasha flavor | backend | synth |
| moonq | Moon period? | backend | gate |
| soft | Soft guidance only | frontend | out |
| full | Full prediction pack | frontend | out |
| remout | Remedy cards | frontend | out |
| chart > tri | grahas + lagna |
| chart > flavor | MD/AD sign |
| tri > moonq | |
| flavor > moonq | |
| moonq > soft | yes | dashed |
| moonq > full | no | emphasis |
| full > remout | |
| soft > remout | sadhana |

@steps id=pipeline-steps
| chart | ChartOutput | Needs grahas, lagna, vimshottari nodes, optional D10. | predict-flow | chart |
| tri | Trikona scores | Element load + dominant sign flavor per trikona. | predict-flow | tri |
| flavor | Dasha flavor | Active/Reactive tag + planet nature alignment check. | predict-flow | flavor |
| moonq | Moon period? | If Moon is MD or AD, suppress firm event forecasts. | predict-flow | moonq |
| soft | Soft guidance only | Discourse / sadhana cards; no date-stamped life events. | predict-flow | soft |
| full | Full prediction pack | Area activations + flavor + multi-house simultaneous read. | predict-flow | full |
| remout | Remedy cards | House × karaka × rashi; never Moon remedies inside Ketu dasha. | predict-flow | remout |

@callout level=warning title="Session rules that must ship as product constraints"
| Odd/even is Active vs Reactive, not profit/loss — label it as spice.
| Do not recommend Moon remedies during Ketu dasha.
| Stay educational: health chains (Ketu→gut→etc.) need soft caution, not diagnosis.
| Astrologer UX: optional “stay neutral” reminder when viewing Rahu/Scorpio drama on client charts.

## What should each release ship? {#roadmap}

| Phase | Ship | Plan gate | Effort |
| --- | --- | --- | --- |
| P0a | Trikona Map + Agni/Artha/Vayu/Moksha headlines | Free teaser / Gold full {good:Ship first} | Small |
| P0b | Active/Reactive badge on current MD/AD | Gold | Small |
| P0c | Moon forecast gate in Dasha panel | Gold | Small |
| P1a | Life Stability Score D1+D10 | Gold | Medium |
| P1b | Karaka×Rashi×House remedy composer | Gold | Medium |
| P1c | Dasha-specific Moon/Ketu/Sun protocols | Gold | Medium |
| P2a | Multi-area simultaneous narrative (bigger picture) | Platinum {caution:Later} | Larger |
| P2b | Gender-aware soft language packs | Platinum / opt-in | Larger |
| Later | Jaimini / Bhrigu / Kalachakra (learning path only) | Docs, not product yet | Out of scope |

## Where does it plug into the UI? {#surfaces}

| Surface | Placement |
| --- | --- |
| New analysis section | `Tattva` under chart Interpretation or Strength analytics |
| Dasha More panel | Flavor badge + Moon gate + remedy strip beside existing Vimshottari narrative[](source:panel) |
| Dig/Drig panel | Link Life Stability to existing Chara/Sthira/Dual note[](source:modality) |
| Rashi Guide | Keep encyclopedia; deep-link from Trikona Map cards[](source:rashi) |
| Public chart | Teaser only if Free; full gated like other Gold interpretations[](source:matrix) |

## Suggested engine API shape {#api}

@facts
| Module | `src/lib/engine/tattvaPrediction.ts` (new, pure) |
| Input | grahas, ascRashi, dasha MD/AD lords + signs, optional D10 grahas, userSex optional |
| Output | `trikonas`, `agniMode`, `moneyModes`, `networkLoad`, `mokshaFlags`, `dashaFlavor`, `predictMode`, `remedies[]` |
| Tests | `__tests__/engine/tattvaPrediction.test.ts` |
| UI | `TattvaPredictionPanel` + hooks into `DashaInterpretationPanel` |
| Gate | UI `userPlan`; API `requirePlanGate` if dedicated route |

## Build checklist {#check}

- [ ] Add pure `analyzeTattvaPrediction(chart, dashaContext)` with four trikona scores.
- [ ] Map Agni houses to Survival / Sustenance / Purpose from sign occupancy and lagna.
- [ ] Map Artha to 2 / 6 / 10 money narratives; Vayu to 3-7-11 density; Moksha to 4-8-12 soft flags.
- [ ] Tag current MD/AD as Active or Reactive; copy says spice, not verdict.
- [ ] If Moon MD or AD: set `predictMode = 'guidance'`; hide firm event cards.
- [ ] Block Moon-style remedies when Ketu is MD; prefer Advaita/jnana copy for Ketu.
- [ ] Reuse Dig modality counts for Life Stability; add D10 planet pile.
- [ ] Gold full panel; Free teaser; educational disclaimers on health copy.
- [ ] Vitest fixtures for Gemini lagna sample patterns from the session Q&A.
