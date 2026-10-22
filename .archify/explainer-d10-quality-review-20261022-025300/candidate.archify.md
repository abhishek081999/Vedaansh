# D10 quality review — strong core, overloaded classroom surface {#d10-review}

**Verdict:** Digpala + D1→D10 math is solid. Eight tabs of lecture lore are **too much** for one product surface — collapse to 3–4 tabs and rank professions before calling D10 “prediction-grade.”

- Engine core (D10 formula, Digpala parts, key lords, dasha overlay) is trustworthy.
- Practical layers are chart-conditioned but heuristic (fame, combos, partnership rules).
- Writing mixes classical, Gītā, and survival slang in one workspace.

@answer scope="Dashamsha audit · engine + UI + writing"
@meta locale=en
@source audit title="D10 feature audit Oct 2026"
@source code title="dashamsaAnalysis.ts · dashamsaPractical.ts · DashamsaWorkspace.tsx"

## What is already good? {#good}

| Layer | Grade | Why |
| --- | --- | --- |
| D10 math / Digpala | Strong {good:Core} | Matches `D10()`; odd/even reverse tested |
| Key lords + dasha×D10 | Strong {good:Timing} | 10L/11L periods flagged on houses |
| Sign sectors + lagna sync | Good {good:Counsel} | Element bridges fill offset gaps |
| 8 classroom tabs | Weak {caution:Overload} | Energy alone already duplicates half |
| Tests | Thin {caution:Smoke} | Shape asserts, few golden charts |

## Tab map (8 inner tabs) {#tabs}

| Tab | Role |
| --- | --- |
| Energy | Digpala protocol, D1→D10, direction {good:Core} |
| Survival | Drain, helpability, partnership lore {caution:Counsel} |
| Bondage | House→Sign→Planet, inherited karma |
| Circuit | D3/D7/D9/D10/D2 dasha stack |
| Karma Yoga | Gītā sync, triads, ethics |
| Verticals | Body/mind/soul, recognition |
| Sectors | Sign industries + combos |
| Pending | 2–6–10 dana axis |

## Top fixes by impact {#fixes}

@steps id=d10-fix-order
| collapse | Collapse tabs | Keep Overview, Digpala/Lords, Timing, Practical (merge the rest). |
| digpala | Surface Digpala buckets | Already computed; unused in UI — make first-class cards. |
| tone | Split classical vs counseling | One voice per tab; gate survival slang if needed. |
| rank | Rank professions | Confidence + sources; hide Quiet brand combos by default. |
| tests | Golden Digpala tests | Odd/even parts, lagna Digpala, 10L, dasha overlay on 2–3 charts. |
| brittle | Fix heuristics | KeyLord fallbacks, 6–8 math, aspect house arithmetic. |

## Writing and feature gaps {#gaps}

@facts
| Tone clash | Classical Digpala, Gītā ethics, and “Zomato / bullet bleed” in one product. |
| Digpala unused | `digpalaBuckets` built in analysis, never rendered. |
| Partnership | Overlay rules shown without dual-chart input. |
| No Jaimini career | Amatyakāraka / Kārakāṁśa chain not wired into D10. |
| Plan gate | `userPlan` unused — Practical not gated. |

## Checklist before calling D10 “done” {#check}

- [ ] Collapse to ≤4 tabs without losing Digpala protocol.
- [ ] Render Digpala bucket grid on Overview.
- [ ] Matched-only combos on Sectors (or collapse Quiet).
- [ ] Golden tests for Digpala + dasha overlay.
- [ ] One writing voice per tab (classical vs survival).
