# Can natal rashi and planet phala be used in D10? {#d10-phala}

Yes. The Classical Śāstra tab now reads the same planet-in-house and planet-in-rashi tables on Dashamsha placements.

- House and sign phala stay the classical text; D10 house themes keep the career lens.[](source:classical)
- Priority covers lagna lord, 10th/11th lords, livelihood planet, and Amatyakaraka.[](source:phala)
- D10 lagna rashi careers also feed the Synthesis profession card.[](source:synth)

@answer scope="D10 · classical phala reuse"
@meta locale=en
@source classical title="Classical interpretations" path=src/lib/engine/classicalInterpretations.ts
@source phala title="D10 phala builder" path=src/lib/engine/dashamsaClassical.ts
@source synth title="Profession synthesis" path=src/lib/engine/dashamsaSynthesis.ts

## What was reused? {#reuse}

| Source table | Applied to |
| --- | --- |
| Planet in house (BPHS / Phaladeepika) | Planet’s D10 house |
| Planet in rashi + dignity | Planet’s D10 sign |
| House classical | D10 houses 1, 6, 7, 10, 11 |
| Sign in house | Those same D10 houses |
| Rashi deep guide careers | D10 lagna |

## Where do you open it? {#where}

@steps id=open-phala
| open | Open Dashamsha | Core Analysis → Dashamsha (D10). |  |  |
| sastra | Open Śāstra | Classical Śāstra tab. |  |  |
| phala | Read phala | Section “Rashi & planet phala in D10”. |  |  |
| synth | Check Synthesis | Profession card may list D10 lagna rashi careers. |  |  |

- [ ] Career lords expand with house and rashi classical notes.
- [ ] Other planets stay collapsed until you expand them.
- [ ] Notes are tagged with classical sources (BPHS, Phaladeepika, and so on).
