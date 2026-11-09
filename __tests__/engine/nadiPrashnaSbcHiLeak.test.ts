// Hindi overlays for Nadi read.ts, Vedic praśna headlines, Krishneeyam entry labels,
// and Sarvatobhadra pulse / life-area / tithi text. English default stays unchanged.
// Child-module prose that is still English is not collected here.

import { describe, expect, it } from 'vitest'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { readNadiHouses, rolesOfHouse } from '@/lib/engine/nadi/read'
import { runVedicPrashna, type VedicChartInput } from '@/lib/engine/vedicPrashna'
import { getAroodhaUdayaRelation, getMukhaType, getOdayaType } from '@/lib/engine/krishneeyam'
import { getTithiInfo } from '@/lib/engine/sarvatobhadra'

const DEV = /[\u0900-\u097F]/

const nadiInput = {
  ascRashi: 1 as Rashi,
  grahas: [
    { id: 'Ve' as const, rashi: 4 as Rashi },
    { id: 'Ma' as const, rashi: 1 as Rashi },
    { id: 'Su' as const, rashi: 1 as Rashi, dignity: 'exalted' as const },
    { id: 'Mo' as const, rashi: 4 as Rashi },
    { id: 'Me' as const, rashi: 3 as Rashi },
    { id: 'Ju' as const, rashi: 9 as Rashi },
    { id: 'Sa' as const, rashi: 10 as Rashi, isRetro: true },
    { id: 'Ra' as const, rashi: 5 as Rashi },
    { id: 'Ke' as const, rashi: 11 as Rashi },
  ],
  dashaLords: ['Ra' as const, 'Sa' as const],
}

describe('nadi read Hindi', () => {
  it('keeps English roles and sign names by default', () => {
    expect(rolesOfHouse(10)).toContain('Native’s career')
    expect(rolesOfHouse(4)).toContain('Mother')
    expect(rolesOfHouse(4)).toContain('Spouse’s career')
    const en = readNadiHouses(nadiInput)
    expect(en.houses[0]?.signName).toBe('Aries')
    expect(en.decisionNotes[0]).toMatch(/poor time/)
  })

  it('translates local sentences without changing ids', () => {
    const hi = readNadiHouses(nadiInput, 'hi')
    const en = readNadiHouses(nadiInput)
    expect(hi.houses[0]?.sign).toBe(en.houses[0]?.sign)
    expect(hi.houses[0]?.lord).toBe(en.houses[0]?.lord)
    expect(hi.houses[0]?.signName).toMatch(DEV)
    expect(hi.houses[0]?.lordName).toMatch(DEV)
    expect(rolesOfHouse(10, 'hi').join(' ')).toMatch(DEV)
    expect(rolesOfHouse(4, 'hi')).toContain('माता')
    expect(hi.decisionNotes[0]).toMatch(DEV)
    expect(hi.links.find((row) => row.id === 'rahu-foreign-study')?.reading).toMatch(DEV)
    expect(hi.sunNote).toMatch(DEV)
    expect(en.links.map((row) => row.id)).toEqual(hi.links.map((row) => row.id))
  })
})

function graha(id: GrahaId, rashi: Rashi): GrahaData {
  return { id, name: id, rashi, degree: 10, totalDegree: (rashi - 1) * 30 + 10, speed: 1, isRetro: false, isCombust: false, dignity: 'neutral' } as GrahaData
}

function vedicChart(): VedicChartInput {
  return {
    lagnas: { ascRashi: 1, ascDegree: 40 },
    grahas: (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map((id) => graha(id, 1)),
  }
}

describe('vedic prashna Hindi headlines', () => {
  it('keeps the English study note by default and translates the headline', () => {
    const en = runVedicPrashna(vedicChart(), 'career')
    const hi = runVedicPrashna(vedicChart(), 'career', 'hi')
    expect(en.notices[0]).toMatch(/study framework/)
    expect(en.topic).toBe(hi.topic)
    expect(en.verdict).toBe(hi.verdict)
    expect(hi.topicLabel).toMatch(DEV)
    expect(hi.headline).toMatch(DEV)
    expect(hi.notices[0]).toMatch(DEV)
    expect(en.factors.map((row) => row.id)).toEqual(hi.factors.map((row) => row.id))
  })
})

describe('krishneeyam entry Hindi labels', () => {
  it('keeps English labels by default', () => {
    expect(getOdayaType(1).label).toBe('Prishtodaya (Back-rising)')
    expect(getMukhaType(1, 1).label).toContain('Adhomukha')
    expect(getAroodhaUdayaRelation(1, 1).description).toContain('Very favorable')
  })

  it('translates labels and leaves enums in English', () => {
    const odaya = getOdayaType(1, 'hi')
    expect(odaya.type).toBe('prishtodaya')
    expect(odaya.verdict).toBe('bad')
    expect(odaya.label).toMatch(DEV)
    const mukha = getMukhaType(1, 1, 'hi')
    expect(mukha.type).toBe('adhomukha')
    expect(mukha.label).toMatch(DEV)
    const rel = getAroodhaUdayaRelation(1, 2, 'hi')
    expect(rel.result).toBe('bad')
    expect(rel.relationship).toBe('2-12')
    expect(rel.description).toMatch(DEV)
  })
})

describe('sarvatobhadra tithi Hindi', () => {
  it('keeps the English tithi name by default and translates it in Hindi', () => {
    const en = getTithiInfo(0, 0)
    const hi = getTithiInfo(0, 0, 'hi')
    expect(en.num).toBe(hi.num)
    expect(en.paksha).toBe(hi.paksha)
    expect(en.quality).toBe(hi.quality)
    expect(en.name).toBe('Pratipada')
    expect(hi.name).toMatch(DEV)
    expect(hi.type).toMatch(DEV)
  })
})
