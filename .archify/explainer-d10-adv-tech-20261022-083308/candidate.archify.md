# What does the D10 Advanced Technical tab add? {#d10-adv}

A new **Adv** tab deepens Dashamsha with dispositor chains, graha drishti, natal Shadbala and SAV, chara karakas in D10, raja links, and a career-tagged Vimshottari timeline.

- Dispositors show who feeds the 10th, lagna, and livelihood lords in D10.[](source:adv)
- Full and special aspects on the D10 10th and lagna name who colours status.[](source:classical)
- Strength and timing stay natal: Shadbala, bhava bala, SAV, and upcoming antars marked when a career lord runs.[](source:timeline)

@answer scope="D10 Advanced Technical · Adv tab"
@meta locale=en
@source adv title="Dashamsha advanced engine" path=src/lib/engine/dashamsaAdvanced.ts
@source classical title="Aspect helpers" path=src/lib/engine/dashamsaClassical.ts
@source timeline title="Vimshottari timeline" path=src/lib/engine/dasha/vimshottariTimeline.ts
@source ui title="Advanced panel" path=src/components/ui/DashamsaAdvancedPanel.tsx
@source workspace title="Dashamsha workspace tabs" path=src/components/ui/DashamsaWorkspace.tsx

## What is on the Adv tab? {#panels}

| Panel | Answers |
| --- | --- |
| Dispositor chains | Who supports the career lords in D10 |
| Graha drishti | Who aspects the D10 10th and lagna |
| Shadbala | Natal muscle of career lords |
| Bhava bala | Natal H10 and H11 house strength |
| SAV bindus | How easily results land in career houses |
| Chara karakas | AK through DK placed in D10 houses |
| Dignity flags | Vargottama, Pushkara, combust, retro |
| Raja links | Lagna–10, 9–10, 5–10, 4–10, 7–10 |
| Career timeline | Next antars tagged when a career lord runs |

## How do the levers stack? {#stack}

@workflow id=adv-stack title="Read Adv after Synth"
| lane promise | D10 promise |
| lane power | Natal power |
| lane time | Timing |
| chain | Dispositor chain | backend | promise |
| aspect | Drishti on 10th | backend | promise |
| raja | Kendra–trikona links | backend | promise |
| shad | Shadbala rows | backend | power |
| sav | SAV on H10 H11 | backend | power |
| dasha | Career-hit antars | backend | time |
| chain > raja | |
| aspect > raja | |
| raja > dasha | |
| shad > dasha | |
| sav > dasha | |

@steps id=stack-steps
| chain | Dispositor chain | Trace 10th, lagna, and livelihood lords through D10 sign lords. | adv-stack | chain |
| aspect | Drishti on 10th | Count Mars, Jupiter, and Saturn special aspects as full. | adv-stack | aspect |
| raja | Kendra–trikona links | Mark conjunction, exchange, or aspect between career house lords. | adv-stack | raja |
| shad | Shadbala rows | Use natal ratios; weak lords still need dasha support. | adv-stack | shad |
| sav | SAV on H10 H11 | High bindus ease transit and dasha fruit in those houses. | adv-stack | sav |
| dasha | Career-hit antars | Flag periods whose lord is a D10 career significator. | adv-stack | dasha |

@callout level=note title="Where to start"
| Use Energy and Śāstra for the story.
| Use Synth for what to do.
| Use Adv when you need the technical why and when.

## What should you verify? {#check}

- [ ] Open Dashamsha → Adv and confirm dispositor and raja sections render.
- [ ] Confirm Shadbala and SAV fill when those payloads exist on the chart.
- [ ] Confirm at least one timeline row marks a career hit when a career lord runs.
- [ ] Confirm Adv stays separate from Synth (no gochara fetch in this tab).
