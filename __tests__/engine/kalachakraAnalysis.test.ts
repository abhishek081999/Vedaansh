// ─────────────────────────────────────────────────────────────
//  Kalachakra reading — gati, Deha/Jeeva, and period tone
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calcKalachakra } from '@/lib/engine/dasha/kalachakra'
import { analyzeKalachakra, kalachakraGati } from '@/lib/engine/dasha/kalachakraAnalysis'
import type { Rashi } from '@/types/astrology'

const BIRTH = new Date('1990-01-01T00:00:00Z')
const KRITTIKA = 30 + 4 + 50 / 60

describe('Kalachakra analysis', () => {
  it('names the three jumps from the house of the next sign', () => {
    expect(kalachakraGati(1, 8).name).toBe('Markati')
    expect(kalachakraGati(1, 4).name).toBe('Manduki')
    expect(kalachakraGati(1, 7).name).toBe('Manduki')
    expect(kalachakraGati(1, 12).name).toBe('Simhavalokana')
    expect(kalachakraGati(1, 5).name).toBe('Simhavalokana')
    expect(kalachakraGati(1, 2).name).toBe('Direct')
  })

  it('reads Krittika pada 3 as Deha Taurus and opens on Capricorn', () => {
    const nodes = calcKalachakra(KRITTIKA, BIRTH, 2)
    const reading = analyzeKalachakra({
      moonLonSidereal: KRITTIKA,
      nodes,
      grahas: [],
      ascRashi: 1 as Rashi,
      now: BIRTH.getTime() + 86_400_000,
    })
    expect(reading.seed.dehaName).toBe('Taurus')
    expect(reading.seed.jeevaName).toBe('Gemini')
    expect(reading.mahadashas).toHaveLength(9)
    expect(reading.mahadashas[0].signName).toBe('Capricorn')
    expect(reading.mahadashas[0].gati).toBeNull()
    expect(reading.mahadashas[0].houseFromLagna).toBe(10)
    expect(reading.mahadashas[1].gati?.name).toBe('Simhavalokana')
    expect(reading.currentMahaKey).toBe(reading.mahadashas[0].key)
    expect(reading.deha.text).toMatch(/No classical planet/)
  })

  it('marks an exalted benefic in the dasha sign as supportive', () => {
    const nodes = calcKalachakra(0, BIRTH, 1)
    const reading = analyzeKalachakra({
      moonLonSidereal: 0,
      nodes,
      grahas: [{ id: 'Ju', rashi: 1, dignity: 'exalted' }],
      ascRashi: 1 as Rashi,
    })
    expect(reading.mahadashas[0].signName).toBe('Aries')
    expect(reading.mahadashas[0].tone).toBe('supportive')
    expect(reading.mahadashas[0].occupants).toEqual(['Jupiter'])
    expect(reading.deha.occupants).toEqual(['Jupiter'])
  })

  it('reads a lone Moon in Jeeva as that planet, not a split', () => {
    const nodes = calcKalachakra(0, BIRTH, 1)
    const reading = analyzeKalachakra({
      moonLonSidereal: 0,
      nodes,
      grahas: [{ id: 'Mo', rashi: 9 }],
      ascRashi: 1 as Rashi,
    })
    expect(reading.jeeva.signName).toBe('Sagittarius')
    expect(reading.jeeva.text).toMatch(/Moon sits there/)
  })

  it('marks a debilitated malefic in a dusthana dasha as caution', () => {
    const nodes = calcKalachakra(0, BIRTH, 1)
    const reading = analyzeKalachakra({
      moonLonSidereal: 0,
      nodes,
      grahas: [{ id: 'Sa', rashi: 1, dignity: 'debilitated' }],
      ascRashi: 6 as Rashi,
    })
    expect(reading.mahadashas[0].houseFromLagna).toBe(8)
    expect(reading.mahadashas[0].tone).toBe('caution')
    expect(reading.deha.text).toMatch(/bodily warning/)
  })
})
