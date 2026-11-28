// __tests__/engine/tajikaBalaSahams.test.ts
// Pañcavargīya bala and Tajika sahams. Pure logic only.

import { describe, it, expect } from 'vitest'
import { drekkanaLord, haddaLord, navamsaLord, panchavargiyaBala, uccaBala } from '@/lib/engine/tajikaBala'
import { TOPIC_SAHAMS, computeSahams, sahamPoint, sunAboveHorizon } from '@/lib/engine/tajikaSahams'
import { findTajikaYogas } from '@/lib/engine/tajika'
import { runVedicPrashna, type VedicChartInput } from '@/lib/engine/vedicPrashna'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

const DEV = /[ऀ-ॿ]/
const SPEED: Record<string, number> = { Su: 1, Mo: 13, Ma: 0.5, Me: 1.2, Ju: 0.1, Ve: 1.1, Sa: 0.05 }

/** Planet at an absolute sidereal longitude. */
function at(id: GrahaId, lon: number): GrahaData {
  const rashi = (Math.floor(lon / 30) + 1) as Rashi
  return { id, name: id, rashi, degree: lon % 30, totalDegree: lon, speed: SPEED[id] ?? 0, isRetro: false, isCombust: false, dignity: 'neutral' } as GrahaData
}

describe('Pañcavargīya bala parts', () => {
  it('ucca bala runs from 20 at deep exaltation to 0 at deep debilitation', () => {
    expect(uccaBala('Su', 10)).toBe(20)
    expect(uccaBala('Su', 190)).toBe(0)
    expect(uccaBala('Su', 100)).toBe(10)
    expect(uccaBala('Sa', 20)).toBe(0) // 20° Aries is Saturn's deep debilitation
  })

  it('reads hadda, drekkāṇa and navāṃśa lords', () => {
    expect(haddaLord(1, 5)).toBe('Ju')
    expect(haddaLord(1, 6)).toBe('Ve')
    expect(haddaLord(12, 29.9)).toBe('Sa')
    expect(drekkanaLord(1, 15)).toBe('Su') // 2nd decan of Aries is Leo
    expect(navamsaLord(1, 0)).toBe('Ma')
    expect(navamsaLord(2, 0)).toBe('Sa') // Taurus starts from Capricorn
  })

  it('totals the five over four: Sun at 11° Aries', () => {
    const b = panchavargiyaBala(at('Su', 11))
    expect(b.kshetra).toMatchObject({ lord: 'Ma', relation: 'friend', points: 15 })
    expect(b.ucca.points).toBe(19.89)
    expect(b.hadda).toMatchObject({ lord: 'Ve', relation: 'enemy', points: 1.875 })
    expect(b.drekkana).toMatchObject({ lord: 'Su', relation: 'own', points: 10 })
    expect(b.navamsa).toMatchObject({ lord: 'Mo', relation: 'friend', points: 2.5 })
    expect(b.total).toBe(12.32)
    expect(b.band).toBe('strong')
  })

  it('a planet in its fall among enemies is weak', () => {
    expect(panchavargiyaBala(at('Sa', 20)).band).toBe('weak')
  })
})

describe('Sahams', () => {
  it('adds 30° when C is not between B and A', () => {
    expect(sahamPoint(100, 50, 60)).toEqual({ lon: 110, plus30: false })
    expect(sahamPoint(100, 50, 10)).toEqual({ lon: 90, plus30: true })
  })

  it('judges day by the Sun above the horizon', () => {
    expect(sunAboveHorizon(0, 200)).toBe(true)
    expect(sunAboveHorizon(0, 100)).toBe(false)
  })

  const rest = { Ma: at('Ma', 150), Me: at('Me', 250), Ju: at('Ju', 300), Ve: at('Ve', 20), Sa: at('Sa', 330) }

  it('Puṇya is Moon − Sun + lagna by day, reversed by night', () => {
    const day = computeSahams({ ascDegree: 0, grahas: { ...rest, Su: at('Su', 200), Mo: at('Mo', 50) } })
    const punya = day.find(s => s.id === 'punya')!
    expect(punya.formula).toEqual(['Mo', 'Su', 'L'])
    expect(punya.longitude).toBe(210)
    expect(punya.plus30).toBe(false)
    const night = computeSahams({ ascDegree: 0, grahas: { ...rest, Su: at('Su', 100), Mo: at('Mo', 50) } })
    const p2 = night.find(s => s.id === 'punya')!
    expect(p2.formula).toEqual(['Su', 'Mo', 'L'])
    expect(p2.longitude).toBe(80)
    expect(p2.plus30).toBe(true)
  })

  it('gives every saham a sign, house and lord, in Hindi too', () => {
    const grahas = { ...rest, Su: at('Su', 200), Mo: at('Mo', 50) }
    const all = computeSahams({ ascDegree: 45, grahas }, 'hi')
    expect(all).toHaveLength(37)
    for (const s of all) {
      expect(s.longitude).toBeGreaterThanOrEqual(0)
      expect(s.longitude).toBeLessThan(360)
      expect(s.house).toBeGreaterThanOrEqual(1)
      expect(s.house).toBeLessThanOrEqual(12)
      expect(s.name).toMatch(DEV)
    }
    // Every praśna matter has at least one saham.
    for (const ids of Object.values(TOPIC_SAHAMS)) expect(ids.length).toBeGreaterThan(0)
  })
})

describe('Strength in yogas and in the reading', () => {
  const grahas: Record<string, GrahaData> = {
    Ve: at('Ve', 10), Ju: at('Ju', 134), Mo: at('Mo', 55),
    Su: at('Su', 332), Me: at('Me', 332), Ma: at('Ma', 332), Sa: at('Sa', 332),
  }
  const house = (id: GrahaId) => grahas[id].rashi as number

  it('the band, when given, decides strong and weak instead of dignity', () => {
    expect(findTajikaYogas({ grahas, house }, 'Ve', 'Ju').map(y => y.id)).not.toContain('kuttha')
    const strong = findTajikaYogas({ grahas, house, band: id => (id === 'Ve' ? 'strong' : 'middling') }, 'Ve', 'Ju')
    expect(strong.map(y => y.id)).toContain('kuttha')
    const weak = findTajikaYogas({ grahas, house, band: () => 'weak' }, 'Ve', 'Ju')
    expect(weak.map(y => y.id)).toContain('durupha')
  })

  it('the reading carries a saham factor, in both languages', () => {
    const chart: VedicChartInput = { lagnas: { ascRashi: 1, ascDegree: 15 }, grahas: Object.values(grahas) }
    const en = runVedicPrashna(chart, 'marriage')
    const s = en.factors.find(f => f.id === 'saham')!
    expect(s.title).toMatch(/Vivāha saham/)
    expect(s.detail).toMatch(/pañcavargīya bala/)
    const hi = runVedicPrashna(chart, 'marriage', 'hi').factors.find(f => f.id === 'saham')!
    expect(hi.title).toMatch(DEV)
    expect(hi.polarity).toBe(s.polarity)
  })
})
