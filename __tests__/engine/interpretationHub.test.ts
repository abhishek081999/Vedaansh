// __tests__/engine/interpretationHub.test.ts
// Interpretation hub aggregates every reading — pure engine only.

import { describe, it, expect, beforeAll } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import { buildInterpretationHub } from '@/lib/engine/interpretationHub'
import type { ChartOutput } from '@/types/astrology'
import type { TransitPosition } from '@/lib/engine/transits'

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Test',
    birthDate: '1999-08-19',
    birthTime: '10:00',
    utcDate: '1999-08-19',
    utcTime: '04:30:00',
    birthPlace: 'Bhoranj, Himachal Pradesh',
    latitude: 31.644,
    longitude: 76.642,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

const positions: TransitPosition[] = [
  { planetId: 'Su', sign: 7, house: 1, nakshatra: 'Swati', pada: 2, isRetro: false },
  { planetId: 'Mo', sign: 3, house: 9, nakshatra: 'Ardra', pada: 1, isRetro: false },
  { planetId: 'Ma', sign: 8, house: 2, nakshatra: 'Anuradha', pada: 3, isRetro: false },
  { planetId: 'Me', sign: 8, house: 2, nakshatra: 'Vishakha', pada: 4, isRetro: true },
  { planetId: 'Ju', sign: 4, house: 10, nakshatra: 'Pushya', pada: 1, isRetro: true },
  { planetId: 'Ve', sign: 7, house: 1, nakshatra: 'Chitra', pada: 3, isRetro: false },
  { planetId: 'Sa', sign: 12, house: 6, nakshatra: 'Purva Bhadrapada', pada: 4, isRetro: true },
  { planetId: 'Ra', sign: 11, house: 5, nakshatra: 'Purva Bhadrapada', pada: 1, isRetro: true },
  { planetId: 'Ke', sign: 5, house: 11, nakshatra: 'Purva Phalguni', pada: 3, isRetro: true },
]

describe('buildInterpretationHub', () => {
  it('returns all seven sections in order', () => {
    const sections = buildInterpretationHub(chart, positions)
    expect(sections.map((s) => s.id)).toEqual(['overview', 'planets', 'houses', 'rashis', 'strength', 'transit', 'dasha'])
  })

  it('covers every classical planet and all 12 houses', () => {
    const sections = buildInterpretationHub(chart, positions)
    const planets = sections.find((s) => s.id === 'planets')!
    const houses = sections.find((s) => s.id === 'houses')!
    expect(planets.items).toHaveLength(9)
    expect(houses.items).toHaveLength(12)
    for (const item of [...planets.items, ...houses.items]) {
      expect(item.summary.length).toBeGreaterThan(0)
      expect(item.points.length).toBeGreaterThan(0)
    }
  })

  it('puts the Lagna sign first in rashis and ranks strength', () => {
    const sections = buildInterpretationHub(chart, positions)
    const rashis = sections.find((s) => s.id === 'rashis')!
    expect(rashis.items[0].id).toBe(`rashi-${chart.lagnas.ascRashi}`)
    expect(rashis.items[0].tags).toContain('Lagna')
    const strength = sections.find((s) => s.id === 'strength')!
    expect(strength.items.filter((i) => i.id.startsWith('shadbala-'))).toHaveLength(7)
  })

  it('reads transits when positions exist, and waits when loading', () => {
    const withTransits = buildInterpretationHub(chart, positions).find((s) => s.id === 'transit')!
    expect(withTransits.items.filter((i) => i.id.startsWith('transit-'))).toHaveLength(9)
    const loading = buildInterpretationHub(chart, null).find((s) => s.id === 'transit')!
    expect(loading.items).toHaveLength(0)
    expect(loading.intro).toMatch(/Loading/)
  })

  it('reads the running dasha', () => {
    const dasha = buildInterpretationHub(chart, positions).find((s) => s.id === 'dasha')!
    expect(dasha.items.find((i) => i.id === 'dasha-now')).toBeTruthy()
    expect(dasha.items.find((i) => i.id === 'dasha-lord-md')).toBeTruthy()
  })

  it('gives every hub item a unique id (duplicate yoga names included)', () => {
    const withDupYogas: ChartOutput = {
      ...chart,
      yogas: [
        {
          name: 'Raja Yoga',
          sanskrit: 'राज योग',
          category: 'raja',
          strength: 'strong',
          planets: ['Ju', 'Sa'],
          houses: [1, 10],
          description: 'Lord H1 conjunct lord H10',
          effect: 'Authority',
        },
        {
          name: 'Raja Yoga',
          sanskrit: 'राज योग',
          category: 'raja',
          strength: 'moderate',
          planets: ['Me', 'Ve'],
          houses: [5, 7],
          description: 'Lord H5 associated with lord H7',
          effect: 'Status',
        },
      ],
    }
    for (const section of buildInterpretationHub(withDupYogas, positions)) {
      const ids = section.items.map((i) => i.id)
      expect(ids).toEqual([...new Set(ids)])
    }
  })
})
