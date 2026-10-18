// ─────────────────────────────────────────────────────────────
//  src/lib/engine/classicalChartAnalysis.ts
//  Chart-scoped classical notes: lordship, dignity, drishti
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_ASPECTS, getAspectedHouses } from './aspects'
import {
  getAspectClassicalNote,
  getDignityAwarePlanetInSign,
  getDignityClassicalNotes,
  getHouseClassical,
  getPlanetInHouseClassical,
  getRashiClassical,
  type ClassicalNote,
} from './classicalInterpretations'
import { isClassicalGraha, wholeSignHouseFromLagna, type HouseNumber } from './houseInterpretations'
import {
  getChartLordships,
  type LordshipPlacement,
} from './lordshipInterpretations'
import { getMultiVakriNotes } from './vakriAstInterpretations'

export interface HouseAspectNote {
  fromGraha: GrahaId
  fromHouse: HouseNumber
  toHouse: HouseNumber
  aspectSpan: number
  note: ClassicalNote
}

export interface ChartHouseClassical {
  house: HouseNumber
  houseNotes: ClassicalNote[]
  rashiNotes: ClassicalNote[]
  lordship: LordshipPlacement | null
  aspectHits: HouseAspectNote[]
  aspectNotes: ClassicalNote[]
  occupantNotes: { grahaId: GrahaId; notes: ClassicalNote[] }[]
}

/** Aspects cast onto a given whole-sign house from classical grahas. */
export function getHouseAspectNotes(
  ascRashi: Rashi,
  grahas: { id: GrahaId; rashi: Rashi }[],
  targetHouse: HouseNumber,
): HouseAspectNote[] {
  const out: HouseAspectNote[] = []
  for (const g of grahas) {
    if (!isClassicalGraha(g.id)) continue
    const spans = GRAHA_ASPECTS[g.id]
    if (!spans?.length) continue
    const fromHouse = wholeSignHouseFromLagna(ascRashi, g.rashi) as HouseNumber
    const targets = getAspectedHouses(g.id, fromHouse)
    for (let i = 0; i < spans.length; i++) {
      if (targets[i] !== targetHouse) continue
      const note = getAspectClassicalNote(g.id, fromHouse, targetHouse, spans[i])
      if (note) {
        out.push({
          fromGraha: g.id,
          fromHouse,
          toHouse: targetHouse,
          aspectSpan: spans[i],
          note,
        })
      }
    }
  }
  return out
}

export function getPlanetDignityNotes(
  dignity: string,
  isCombust?: boolean,
  isRetro?: boolean,
  grahaId?: GrahaId,
  vakriDetail: 'summary' | 'full' = 'full',
): ClassicalNote[] {
  return getDignityClassicalNotes(dignity, isCombust, isRetro, grahaId, vakriDetail)
}

export function getPlanetClassicalBundle(
  grahaId: GrahaId,
  rashi: Rashi,
  house: number,
  dignity: string,
  isCombust?: boolean,
  isRetro?: boolean,
): ClassicalNote[] {
  return [
    ...getPlanetInHouseClassical(grahaId, house),
    ...getDignityAwarePlanetInSign(grahaId, rashi, dignity, isCombust, isRetro, 'full'),
  ]
}

/** Full classical package for one house in this chart. */
export function getChartHouseClassical(
  chart: ChartOutput,
  house: HouseNumber,
): ChartHouseClassical {
  const ascRashi = chart.lagnas.ascRashi
  const rashi = ((((ascRashi - 1 + house - 1) % 12) + 1) as Rashi)
  const lordships = getChartLordships(
    ascRashi,
    chart.grahas.map((g) => ({ id: g.id, rashi: g.rashi })),
  )
  const lordship = lordships.find((l) => l.ownedHouse === house) ?? null
  const aspectHits = getHouseAspectNotes(
    ascRashi,
    chart.grahas.map((g) => ({ id: g.id, rashi: g.rashi })),
    house,
  )
  const occupants = chart.grahas.filter(
    (g) => isClassicalGraha(g.id) && wholeSignHouseFromLagna(ascRashi, g.rashi) === house,
  )
  return {
    house,
    houseNotes: getHouseClassical(house),
    rashiNotes: getRashiClassical(rashi),
    lordship,
    aspectHits,
    aspectNotes: aspectHits.map((a) => a.note),
    occupantNotes: occupants.map((g) => ({
      grahaId: g.id,
      notes: getPlanetClassicalBundle(g.id, g.rashi, house, g.dignity, g.isCombust, g.isRetro),
    })),
  }
}

/** Chart-level notes when several true planets are vakri. */
export function getChartMultiVakriNotes(chart: ChartOutput): ClassicalNote[] {
  return getMultiVakriNotes(chart.grahas.map((g) => ({ id: g.id, isRetro: g.isRetro })))
}

/** Lagna-lord placement notes for snapshot / PDF. */
export function getLagnaLordClassical(chart: ChartOutput): ClassicalNote[] {
  const lordships = getChartLordships(
    chart.lagnas.ascRashi,
    chart.grahas.map((g) => ({ id: g.id, rashi: g.rashi })),
  )
  return lordships.find((l) => l.isLagnaLord)?.notes ?? []
}

/** Compact classical lines for PDF (house + lordship + top aspect). */
export function buildClassicalPdfBlocks(chart: ChartOutput): {
  lagnaLord: ClassicalNote[]
  houses: { house: number; lines: string[] }[]
} {
  const grahaLite = chart.grahas.map((g) => ({ id: g.id, rashi: g.rashi }))
  const lordships = getChartLordships(chart.lagnas.ascRashi, grahaLite)
  const lagnaLord = lordships.find((l) => l.isLagnaLord)?.notes ?? []
  const houses: { house: number; lines: string[] }[] = []
  for (let h = 1; h <= 12; h++) {
    const house = h as HouseNumber
    const rashi = ((((chart.lagnas.ascRashi - 1 + house - 1) % 12) + 1) as Rashi)
    const lordship = lordships.find((l) => l.ownedHouse === house) ?? null
    const aspectNotes = getHouseAspectNotes(chart.lagnas.ascRashi, grahaLite, house)
    const occupants = chart.grahas.filter(
      (g) => isClassicalGraha(g.id) && wholeSignHouseFromLagna(chart.lagnas.ascRashi, g.rashi) === house,
    )
    const lines: string[] = []
    const houseNote = getHouseClassical(house)[0]
    if (houseNote) lines.push(houseNote.text)
    const rashiNote = getRashiClassical(rashi)[0]
    if (rashiNote) lines.push(`${rashi}: ${rashiNote.text}`)
    if (lordship?.notes[0]) {
      lines.push(`Lord ${lordship.lordId} in H${lordship.placedIn}: ${lordship.notes[0].text}`)
    }
    if (aspectNotes[0]) lines.push(aspectNotes[0].note.text)
    for (const o of occupants.slice(0, 2)) {
      const n = getPlanetInHouseClassical(o.id, house)[0]
      if (n) lines.push(`${o.id}: ${n.text}`)
    }
    houses.push({ house: h, lines })
  }
  return { lagnaLord, houses }
}
