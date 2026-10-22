import { describe, it, expect } from 'vitest'
import {
  analyzeTattvaPrediction,
  analyzeTattvaDashaOverlay,
  composeHouseRemedy,
  prioritizeRemedyHouses,
} from '@/lib/engine/tattvaPrediction'
import type { DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function g(id: GrahaId, rashi: Rashi): GrahaData {
  const lon = (rashi - 1) * 30 + 10
  return {
    id,
    name: id,
    lonTropical: lon,
    lonSidereal: lon,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: 10,
    totalDegree: lon,
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi,
      nakshatraIndex: 0,
      degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi,
      degreeInSign: 10,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi,
      degreeInSign: 10,
      mrityuDegree: 0,
      distanceFromMrityu: 0,
      interpretation: null,
      remedy: null,
    },
  }
}

function node(lord: GrahaId, start: string, end: string, children: DashaNode[] = [], level = 1): DashaNode {
  return {
    lord,
    start: new Date(start),
    end: new Date(end),
    durationMs: new Date(end).getTime() - new Date(start).getTime(),
    level,
    children,
    isCurrent: false,
  }
}

describe('analyzeTattvaPrediction', () => {
  it('returns null without grahas', () => {
    expect(analyzeTattvaPrediction({ grahas: [], ascRashi: 3 })).toBeNull()
  })

  it('scores Gemini lagna trikonas and Agni modes from house load', () => {
    // Gemini lagna (3): H9 (Aquarius) gets 4 planets → purpose initiation
    const grahas = [
      g('Su', 3),  // H1
      g('Mo', 7),  // H5
      g('Ma', 11), // H9
      g('Me', 11), // H9
      g('Ju', 11), // H9
      g('Ve', 11), // H9
      g('Sa', 4),  // H2
      g('Ra', 9),  // H7 air
      g('Ke', 2),  // H12
    ]
    const a = analyzeTattvaPrediction({ grahas, ascRashi: 3 })
    expect(a).not.toBeNull()
    expect(a!.trikonas).toHaveLength(4)
    expect(a!.agni.mode).toBe('purpose')
    expect(a!.network.rahuInAirTrikona).toBe(true)
    expect(a!.money.some((m) => m.house === 2 && m.planetCount >= 1)).toBe(true)
  })

  it('flags 4–8 tension when both houses occupied', () => {
    const grahas = [
      g('Su', 1),
      g('Mo', 4),
      g('Ma', 8),
      g('Me', 2),
      g('Ju', 3),
      g('Ve', 5),
      g('Sa', 6),
      g('Ra', 7),
      g('Ke', 9),
    ]
    const a = analyzeTattvaPrediction({ grahas, ascRashi: 1 })
    expect(a!.moksha.fourEightTension).toBe(true)
    expect(a!.moksha.tone).toBe('caution')
  })

  it('sets guidance mode when Moon is current MD or AD', () => {
    const now = new Date('2020-06-15T12:00:00Z')
    const antar = node('Mo', '2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z', [], 2)
    const maha = node('Ju', '2018-01-01T00:00:00Z', '2034-01-01T00:00:00Z', [antar], 1)
    const grahas = [
      g('Su', 1), g('Mo', 4), g('Ma', 5), g('Me', 6),
      g('Ju', 9), g('Ve', 2), g('Sa', 10), g('Ra', 11), g('Ke', 5),
    ]
    const a = analyzeTattvaPrediction({
      grahas,
      ascRashi: 1,
      dashaNodes: [maha],
      now,
    })
    expect(a!.predictMode).toBe('guidance')
    expect(a!.dashaFlavor.moonInPath).toBe(true)
    expect(a!.remedies.some((r) => r.id === 'moon-sadhana')).toBe(true)
  })

  it('tags Active spice for odd-sign MD lord under Ketu MD', () => {
    const now = new Date('2020-06-15T12:00:00Z')
    const antar = node('Su', '2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z', [], 2)
    const maha = node('Ke', '2018-01-01T00:00:00Z', '2025-01-01T00:00:00Z', [antar], 1)
    const grahas = [
      g('Su', 5), g('Mo', 4), g('Ma', 1), g('Me', 6),
      g('Ju', 9), g('Ve', 2), g('Sa', 10), g('Ra', 11), g('Ke', 1),
    ]
    const a = analyzeTattvaPrediction({
      grahas,
      ascRashi: 3,
      dashaNodes: [maha],
      now,
    })
    const md = a!.dashaFlavor.levels.find((l) => l.level === 'maha')
    expect(md?.energy).toBe('active')
    expect(a!.dashaFlavor.ketuMahadasha).toBe(true)
    const overlay = analyzeTattvaDashaOverlay(grahas, [maha], now)
    expect(overlay!.dashaFlavor.ketuMahadasha).toBe(true)
  })

  it('composes house × karaka × rashi with H12 secondary Ve/Ke', () => {
    const grahas = [
      g('Su', 1), g('Mo', 4), g('Ma', 8), g('Me', 2),
      g('Ju', 3), g('Ve', 5), g('Sa', 6), g('Ra', 7), g('Ke', 9),
    ]
    const pack = composeHouseRemedy({
      house: 12,
      grahas,
      ascRashi: 1,
      ketuMahadasha: true,
    })
    expect(pack).not.toBeNull()
    expect(pack!.rashi).toBe(12) // Pisces from Aries lagna
    expect(pack!.rashiLord).toBe('Ju')
    expect(pack!.secondaryKarakas).toEqual(['Ve', 'Ke'])
    expect(pack!.strands.house).toContain('H12')
    expect(pack!.strands.karaka).toContain('Ketu')
    expect(pack!.moonBlocked).toBe(false) // Mo not in 12 mix for Aries
  })

  it('blocks Moon strand under Ketu MD when Cancer is on the house', () => {
    // Gemini lagna: H2 = Cancer → Moon lord
    const grahas = [
      g('Su', 3), g('Mo', 4), g('Ma', 5), g('Me', 6),
      g('Ju', 7), g('Ve', 8), g('Sa', 9), g('Ra', 10), g('Ke', 11),
    ]
    const pack = composeHouseRemedy({
      house: 2,
      grahas,
      ascRashi: 3,
      ketuMahadasha: true,
    })
    expect(pack!.rashi).toBe(4)
    expect(pack!.rashiLord).toBe('Mo')
    expect(pack!.moonBlocked).toBe(true)
    expect(pack!.synthesis).toMatch(/Ketu Mahadasha/i)
  })

  it('prioritises 4–8 tension houses in remedy picks', () => {
    const grahas = [
      g('Su', 1), g('Mo', 4), g('Ma', 8), g('Me', 2),
      g('Ju', 3), g('Ve', 5), g('Sa', 6), g('Ra', 7), g('Ke', 9),
    ]
    const a = analyzeTattvaPrediction({ grahas, ascRashi: 1 })
    const picks = prioritizeRemedyHouses(grahas, 1, a!.moksha, a!.money, 4)
    const houses = picks.map((p) => p.house)
    expect(houses).toContain(4)
    expect(houses).toContain(8)
    expect(a!.houseRemedies.length).toBeGreaterThan(0)
    expect(a!.houseRemedies[0]!.strands.karaka.length).toBeGreaterThan(10)
  })

  it('computes D1 and D10 life stability when D10 supplied', () => {
    const d1 = [
      g('Su', 1), g('Mo', 4), g('Ma', 7), g('Me', 10),
      g('Ju', 2), g('Ve', 5), g('Sa', 8), g('Ra', 11), g('Ke', 3),
    ]
    const d10 = [
      g('Su', 2), g('Mo', 5), g('Ma', 8), g('Me', 11),
      g('Ju', 2), g('Ve', 5), g('Sa', 8), g('Ra', 11), g('Ke', 5),
    ]
    const a = analyzeTattvaPrediction({
      grahas: d1,
      ascRashi: 1,
      d10Grahas: d10,
      d10Asc: 2,
    })
    expect(a!.lifeStability.d1.dominant).toBe('movable')
    expect(a!.lifeStability.d10?.dominant).toBe('fixed')
  })
})
