# What does the D10 Career Synthesis tab deliver? {#d10-synth}

One **Career Synthesis** tab now covers the full D10 roadmap: A10, profession card, job vs business, foreign, boss, Vimsopaka, Muntha year, D10 gochara, dasha windows, and a copyable brief.

- Public title comes from A10 (Rajya Pada); the work itself stays on the D10 10th.[](source:arudha)
- Profession fields merge Phaladeepika, Digpala, and nakshatra sources with an agreement score.[](source:synth)
- Timing uses Tajika Muntha on D10 houses, live gochara from `/api/transits/planets`, and Vimshottari windows.[](source:transit)

@answer scope="D10 Career Synthesis · shipped roadmap"
@meta locale=en
@source arudha title="Arudha A10" path=src/lib/engine/arudhas.ts
@source synth title="Dashamsha synthesis engine" path=src/lib/engine/dashamsaSynthesis.ts
@source classical title="Classical D10 reader" path=src/lib/engine/dashamsaClassical.ts
@source transit title="Transit planets API" path=src/app/api/transits/planets/route.ts
@source ui title="Synthesis panel" path=src/components/ui/DashamsaSynthesisPanel.tsx

## What is on the tab? {#panels}

| Panel | Answers |
| --- | --- |
| Profession card | What kind of work, with source agreement |
| A10 Rajya Pada | How the world names the career |
| Job vs business | Service, trade, or hybrid |
| Foreign / transfer | Digpala Varuna and 9th/12th lean |
| Boss / patron | D10 10th lord as the king |
| Vimsopaka | D10 strength of career lords |
| Muntha year | This year’s house against D10 |
| Gochara | Heavy planets in D10 houses today |
| Dasha windows | Live and next career significators |
| Career brief | Copy or download Markdown |

## How does the data flow? {#flow}

@workflow id=synth-flow title="Build one synthesis"
| lane chart | From the chart |
| lane merge | Merge readings |
| lane time | Time it |
| a10 | Read A10 | backend | chart |
| sastra | Classical livelihood | backend | chart |
| nak | Nakshatra fields | backend | chart |
| card | Profession card | backend | merge |
| gochara | Fetch transit rashis | external | time |
| brief | Markdown brief | backend | merge |
| a10 > card | |
| sastra > card | |
| nak > card | |
| card > brief | |
| gochara > brief | |

@steps id=flow-steps
| a10 | Read A10 | Use BPHS-corrected arudhas when present. | synth-flow | a10 |
| sastra | Classical livelihood | Reuse the Śāstra tab’s Phaladeepika winner and mahatphala lord. | synth-flow | sastra |
| nak | Nakshatra fields | Pull career fields and the formula summary. | synth-flow | nak |
| card | Profession card | Prefer fields that two or more sources share. | synth-flow | card |
| gochara | Fetch transit rashis | Client calls the public ephemeris API; engine stays browser-safe. | synth-flow | gochara |
| brief | Markdown brief | Copy or download for CRM notes and client PDFs. | synth-flow | brief |

@callout level=note title="Full solar-return D10"
| Muntha against D10 houses is on the tab now.
| Open Solar Return for the full Varshaphal D10 chart of the year.

## What should you verify? {#check}

- [ ] Open Dashamsha → Synth and confirm A10, profession, and brief render.
- [ ] Confirm gochara fills after the transit API returns.
- [ ] Copy the Markdown brief and paste into notes.
- [ ] If livelihood and status lords differ, both still appear on the profession card.
