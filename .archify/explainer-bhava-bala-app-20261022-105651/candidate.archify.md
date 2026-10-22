# Where is Bhava Bala in Vedaansh? {#where}

Open a chart → **Bhava Bala** tab. The engine writes `chart.bhavaBala` on every full calculate; the UI shows twelve house totals in **Rupas**.

- Sidenav and chart tabs both expose `bhava-bala`.[](source:nav)
- `calculateChart` runs `calculateBhavaBala` after Shadbala.[](source:calc)
- Formula: Adhipati + Digbala + Drishti; `totalRupa = totalShash / 60`.[](source:engine)
- Strong flag: `totalRupa >= 7.5` (450 Virupas, Raman floor).[](source:engine)

@answer scope="Vedaansh Bhava Bala · UI + engine"
@meta locale=en
@source nav title="Sidenav Bhava Bala entry" path=src/lib/ui/navConfig.ts lines=128:128
@source tabs title="Full-width strength tab" path=src/lib/ui/chartTabRegistry.ts lines=22:52
@source calc title="Chart orchestration" path=src/lib/engine/calculator.ts lines=470:476
@source engine title="Bhava Bala calculation" path=src/lib/engine/bhavaBala.ts lines=1:246
@source ui title="Strength colour bands" path=src/components/ui/BhavaBalaVisuals.tsx lines=22:33
@source types title="BhavaBalaResult type" path=src/types/astrology.ts lines=640:655
@source home title="HomeClient Bhava tab" path=src/components/home/HomeClient.tsx lines=2691:2822

## How do you open it? {#open}

@workflow id=open-bhava title="Open Bhava Bala"
| lane ui | UI |
| lane data | Data |
| chart | Open or calculate chart | frontend | ui |
| tab | Click Bhava Bala | frontend | ui |
| panel | Read BhavaBalaTable | frontend | ui |
| eng | calculateBhavaBala | backend | data |
| chart > tab | |
| tab > panel | |
| eng > panel | chart.bhavaBala | emphasis |

@steps id=open-steps
| chart | Open or calculate chart | Home chart or public `/chart/[slug]`; missing data says recalculate. | open-bhava | chart |
| tab | Click Bhava Bala | Sidenav label Bhava Bala; also under strength tabs on mobile. | open-bhava | tab |
| panel | Read BhavaBalaTable | Modern/classic views, strongest/weakest, component bars. | open-bhava | panel |
| eng | calculateBhavaBala | Needs Shadbala, grahas (waxing Moon), and lagna. | open-bhava | eng |

## What does the engine compute? {#formula}

@workflow id=bhava-math title="Three components"
| lane parts | Parts |
| adip | Adhipati | backend | parts |
| dig | Digbala | backend | parts |
| dri | Drishti | backend | parts |
| tot | totalRupa | backend | parts |
| adip > dig | |
| dig > dri | |
| dri > tot | / 60 | emphasis |

@steps id=math-steps
| adip | Adhipati | Sign lord’s total Shadbala (Virupas) for the house Rashi. | bhava-math | adip |
| dig | Digbala | Sign category vs zero-kendra; arc ÷ 3, max 60. | bhava-math | dig |
| dri | Drishti | Sputa aspects on equal-house cusp; Ju/Me full; others ±¼; Ra/Ke out. | bhava-math | dri |
| tot | totalRupa | `(adhipati + dig + drishti) / 60`; `isStrong` if ≥ 7.5. | bhava-math | tot |

@facts
| Field | `chart.bhavaBala` |
| Per house | `adhipatiBala`, `digBala`, `drishtiBala`, `totalShash`, `totalRupa` |
| Summary | `strongestHouse`, `weakestHouse` |
| House system | Equal 30° from Asc |
| UI component | `BhavaBalaTable` → `BhavaBalaVisuals` |

## How does the UI grade strength? {#bands}

| `totalRupa` | Label | Colour |
| --- | --- | --- |
| ≥ 9 | Excellent {good:540+ Virupas} | Teal |
| ≥ 7.5 | Strong {good:isStrong} | Gold |
| ≥ 6 | Average {caution:Mid} | Amber |
| &lt; 6 | Weak {bad:Priority} | Rose |

Lecture notes that quote 400–550 are **Virupas**. Multiply Vedaansh Rupas by 60 to match.[](source:ui)

## Where else does it appear? {#surfaces}

| Surface | What you see |
| --- | --- |
| Home chart tab `bhava-bala` | Strongest/weakest cards + full table |
| Dashboard strip | Compact H1–H12 bars; expand Full |
| Public chart tab | Same `BhavaBalaTable` |
| Dashamsa Advanced | H10 / H11 rupa notes for career |

If the panel says unavailable, recalculate the chart so `calculateChart` refreshes `bhavaBala`.[](source:home)

## What should you check in-app? {#check}

- [ ] Open chart → Bhava Bala and confirm twelve houses have `totalRupa`.
- [ ] Note strongest and weakest houses from the summary cards.
- [ ] Switch classic view to compare Adhipati, Dig, Drishti bar sets.
- [ ] Convert lecture Virupas: `rupa × 60` (7.5 R = 450 V).
- [ ] For a life topic, read that house first, then the lord’s Shadbala.
