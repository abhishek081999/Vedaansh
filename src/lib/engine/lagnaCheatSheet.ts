// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCheatSheet.ts
//  One-page consultation cheat-sheet for a chart's Lagna, built from the
//  Lagna character profile plus this chart's lord and house occupancy
// ─────────────────────────────────────────────────────────────

import type { GrahaData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getLagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { CHEAT_SHEET_HI } from '@/lib/engine/locale/houseGuide.hi'
import { buildLagnaChartOverlay, HOUSE_NUMBERS } from '@/lib/engine/lagnaChartOverlay'

export interface CheatSheetHouseRow {
  house: number
  signName: string
  theme: string
  occupants: string[]
}

export interface LagnaCheatSheet {
  title: string
  ascName: string
  headline: string
  /** Chart-specific facts, e.g. where the Lagna lord sits. */
  thisChart: string[]
  /** Lead point from each trait group. */
  keyPoints: string[]
  houses: CheatSheetHouseRow[]
  cautionsAndRemedies: string[]
}

function firstSentence(text: string, sep = '. '): string {
  const idx = text.indexOf(sep)
  return idx === -1 ? text : text.slice(0, idx + 1)
}

export function buildLagnaCheatSheet(ascRashi: Rashi, grahas: GrahaData[], lang: EngineLang = 'en'): LagnaCheatSheet | null {
  if (lang === 'hi') return buildLagnaCheatSheetHi(ascRashi, grahas)
  const profile = getLagnaCharacterProfile(ascRashi)
  if (!profile) return null

  const overlay = buildLagnaChartOverlay(ascRashi, grahas)
  const first = overlay[0]
  const thisChart: string[] = []
  if (first) {
    const lordName = GRAHA_NAMES[first.lordId]
    thisChart.push(
      first.lordPlacedHouse
        ? `Lagna lord ${lordName} sits in house ${first.lordPlacedHouse}.`
        : `Lagna lord ${lordName}: placement not available.`,
    )
  }
  const crowded = overlay.filter((h) => h.occupants.length > 1).map((h) => `H${h.house}`)
  if (crowded.length > 0) thisChart.push(`Houses with several planets: ${crowded.join(', ')}.`)
  const empty = overlay.filter((h) => h.occupants.length === 0).length
  thisChart.push(`${12 - empty} houses occupied, ${empty} empty (read empty houses through their lords).`)

  const houses: CheatSheetHouseRow[] = HOUSE_NUMBERS.map((h) => {
    const reading = profile.houses[h]
    const ov = overlay[h - 1]
    return {
      house: h,
      signName: reading.signName,
      theme: reading.theme,
      occupants: ov.occupants.map((o) => GRAHA_NAMES[o.id]),
    }
  })

  return {
    title: `${RASHI_NAMES[ascRashi]} Lagna cheat-sheet`,
    ascName: RASHI_NAMES[ascRashi],
    headline: firstSentence(profile.intro),
    thisChart,
    keyPoints: profile.traits.map((t) => `${t.title}: ${t.points[0]}`),
    houses,
    cautionsAndRemedies: [...profile.exceptions, ...profile.readingNotes],
  }
}

export function cheatSheetToText(sheet: LagnaCheatSheet, lang: EngineLang = 'en'): string {
  const hi = lang === 'hi'
  const lines: string[] = [sheet.title, '', sheet.headline, '']
  lines.push(hi ? CHEAT_SHEET_HI.textThisChart : 'This chart')
  for (const t of sheet.thisChart) lines.push(`- ${t}`)
  lines.push('', hi ? CHEAT_SHEET_HI.textKeyPoints : 'Key points')
  for (const k of sheet.keyPoints) lines.push(`- ${k}`)
  lines.push('', hi ? CHEAT_SHEET_HI.textHouses : 'Houses')
  for (const h of sheet.houses) {
    const occ = h.occupants.length > 0 ? ` [${h.occupants.join(', ')}]` : ''
    lines.push(`${hi ? fill(CHEAT_SHEET_HI.houseShort, { n: h.house }) : `H${h.house}`} ${h.signName}: ${h.theme}${occ}`)
  }
  lines.push('', hi ? CHEAT_SHEET_HI.textCautions : 'Cautions and remedies')
  for (const c of sheet.cautionsAndRemedies) lines.push(`- ${c}`)
  return lines.join('\n')
}

function buildLagnaCheatSheetHi(ascRashi: Rashi, grahas: GrahaData[]): LagnaCheatSheet | null {
  const profile = getLagnaCharacterProfile(ascRashi, 'hi')
  if (!profile) return null
  const t = CHEAT_SHEET_HI
  const overlay = buildLagnaChartOverlay(ascRashi, grahas)
  const first = overlay[0]
  const thisChart: string[] = []
  if (first) {
    const lord = GRAHA_HI[first.lordId]
    thisChart.push(first.lordPlacedHouse ? fill(t.lordSits, { lord, n: first.lordPlacedHouse }) : fill(t.lordNA, { lord }))
  }
  const crowded = overlay.filter((h) => h.occupants.length > 1).map((h) => fill(t.houseShort, { n: h.house }))
  if (crowded.length > 0) thisChart.push(fill(t.crowded, { list: crowded.join(', ') }))
  const empty = overlay.filter((h) => h.occupants.length === 0).length
  thisChart.push(fill(t.occupancy, { occ: 12 - empty, empty }))
  return {
    title: fill(t.title, { sign: RASHI_HI[ascRashi] }),
    ascName: RASHI_HI[ascRashi],
    headline: firstSentence(profile.intro, '। '),
    thisChart,
    keyPoints: profile.traits.map((tr) => `${tr.title}: ${tr.points[0]}`),
    houses: HOUSE_NUMBERS.map((h) => ({
      house: h,
      signName: profile.houses[h].signName,
      theme: profile.houses[h].theme,
      occupants: overlay[h - 1].occupants.map((o) => GRAHA_HI[o.id]),
    })),
    cautionsAndRemedies: [...profile.exceptions, ...profile.readingNotes],
  }
}
