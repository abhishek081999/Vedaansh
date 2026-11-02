// __tests__/engine/vedicPrashna.test.ts
// Vedic praśna and lagna stability. Pure logic only.

import { describe, it, expect } from 'vitest'
import { DEEPTAMSA, VEDIC_TOPICS, runVedicPrashna, tajikaLink, type VedicChartInput } from '@/lib/engine/vedicPrashna'
import { analyseLagnaStability, shiftLagna } from '@/lib/engine/prashnaStability'
import { runSatpanchasika } from '@/lib/engine/satpanchasikaEngine'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

const MEAN_SPEED: Record<string, number> = { Su: 1, Mo: 13, Ma: 0.5, Me: 1.2, Ju: 0.1, Ve: 1.1, Sa: 0.05 }

function graha(id: GrahaId, rashi: Rashi, degree = 15, speed = MEAN_SPEED[id] ?? 0): GrahaData {
  const totalDegree = (rashi - 1) * 30 + degree
  return { id, name: id, rashi, degree, totalDegree, speed, isRetro: speed < 0, isCombust: false, dignity: 'neutral' } as GrahaData
}

function chart(lagna: Rashi, degree: number, grahas: Partial<Record<GrahaId, GrahaData>>): VedicChartInput {
  const defaults: Record<string, GrahaData> = {
    Su: graha('Su', 1), Mo: graha('Mo', 4), Ma: graha('Ma', 1), Me: graha('Me', 1), Ju: graha('Ju', 1), Ve: graha('Ve', 1), Sa: graha('Sa', 1),
  }
  return {
    lagnas: { ascRashi: lagna, ascDegree: (lagna - 1) * 30 + degree },
    grahas: (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map(id => grahas[id] ?? defaults[id]),
  }
}

describe('Tajika links', () => {
  it('faster planet behind the slower, in aspect and orb, is an ithasala', () => {
    const l = tajikaLink(graha('Mo', 1, 10), graha('Sa', 3, 14))
    expect(l.type).toBe('ithasala')
    expect(l.fast).toBe('Mo')
    expect(l.aspect).toBe('friendly')
    expect(l.orb).toBe((DEEPTAMSA.Mo! + DEEPTAMSA.Sa!) / 2)
    expect(l.daysAtCurrentSpeed).toBe(1)
  })

  it('faster planet already past is an ishrafa', () => {
    expect(tajikaLink(graha('Mo', 1, 20), graha('Sa', 3, 14)).type).toBe('ishrafa')
  })

  it('within 1° past still perfects', () => {
    expect(tajikaLink(graha('Mo', 1, 14.5), graha('Sa', 3, 14)).type).toBe('ithasala')
  })

  it('needs a Tajika aspect: 2nd, 6th, 8th, 12th give none', () => {
    expect(tajikaLink(graha('Mo', 1, 10), graha('Sa', 2, 14)).type).toBe('none')
  })

  it('needs to be inside the orb', () => {
    expect(tajikaLink(graha('Ma', 1, 2), graha('Sa', 3, 25)).type).toBe('none')
  })

  it('a retrograde fast planet reverses applying and separating', () => {
    // Mercury ahead of Saturn but moving backwards towards it.
    expect(tajikaLink(graha('Me', 1, 18, -1.2), graha('Sa', 3, 14)).type).toBe('ithasala')
    expect(tajikaLink(graha('Me', 1, 10, -1.2), graha('Sa', 3, 14)).type).toBe('ishrafa')
  })
})

describe('Vedic reading', () => {
  it('reads every topic', () => {
    for (const t of VEDIC_TOPICS) {
      const r = runVedicPrashna(chart(1, 10, {}), t.id)
      expect(r.factors.length).toBeGreaterThan(0)
      expect(r.significators.karyaHouse).toBe(t.house)
      expect(r.notices[0]).toMatch(/study framework/)
    }
  })

  it('finds lagna lord and matter lord: Aries lagna, career', () => {
    const r = runVedicPrashna(chart(1, 10, {}), 'career')
    expect(r.significators.lagnaLord).toBe('Ma')
    expect(r.significators.karyaLord).toBe('Sa')
  })

  it('ithasala counts for, ishrafa against', () => {
    const applying = runVedicPrashna(chart(1, 10, { Ma: graha('Ma', 1, 5), Sa: graha('Sa', 3, 10) }), 'career')
    expect(applying.factors.find(f => f.id === 'ithasala')?.polarity).toBe('favourable')
    const past = runVedicPrashna(chart(1, 10, { Ma: graha('Ma', 1, 15), Sa: graha('Sa', 3, 10) }), 'career')
    expect(past.factors.find(f => f.id === 'ishrafa')?.polarity).toBe('unfavourable')
  })

  it('reports no link when the significators are apart', () => {
    const r = runVedicPrashna(chart(1, 10, { Ma: graha('Ma', 2, 5), Sa: graha('Sa', 7, 25), Su: graha('Su', 12), Mo: graha('Mo', 12), Me: graha('Me', 12), Ju: graha('Ju', 12), Ve: graha('Ve', 12) }), 'career')
    expect(r.factors.find(f => f.id === 'connection')?.polarity).toBe('unfavourable')
    expect(r.factors.some(f => f.id === 'no-tajika')).toBe(true)
  })

  it('detects exchange of signs', () => {
    // Aries lagna, career: Mars in Capricorn, Saturn in Aries.
    const r = runVedicPrashna(chart(1, 10, { Ma: graha('Ma', 10), Sa: graha('Sa', 1) }), 'career')
    expect(r.factors.find(f => f.id === 'connection')?.detail).toMatch(/exchange/)
  })

  it('detects pāpakartari on the matter house', () => {
    // Aries lagna, career (10th, Capricorn): malefics in Sagittarius and Aquarius.
    const r = runVedicPrashna(chart(1, 10, { Su: graha('Su', 9), Ma: graha('Ma', 11), Mo: graha('Mo', 1), Me: graha('Me', 1), Ju: graha('Ju', 1), Ve: graha('Ve', 1), Sa: graha('Sa', 2) }), 'career')
    expect(r.factors.some(f => f.id === 'papakartari')).toBe(true)
  })

  it('counts a node on the house as affliction', () => {
    const base = chart(1, 10, {})
    const r = runVedicPrashna({ ...base, grahas: [...base.grahas, graha('Ra', 10)] }, 'career')
    expect(r.factors.find(f => f.id === 'house-bad')?.detail).toMatch(/Ra/)
  })

  it('flags a lagna at a sign junction', () => {
    expect(runVedicPrashna(chart(1, 29.5, {}), 'general').factors.some(f => f.id === 'sandhi')).toBe(true)
    expect(runVedicPrashna(chart(1, 10, {}), 'general').factors.some(f => f.id === 'sandhi')).toBe(false)
  })

  it('uses bhāva bala when the chart has it', () => {
    const base = chart(1, 10, {})
    const r = runVedicPrashna({ ...base, bhavaBala: { houses: { 10: { isStrong: true, totalRupa: 7.5 } } } } as unknown as VedicChartInput, 'career')
    expect(r.factors.find(f => f.id === 'bhava-bala')?.polarity).toBe('favourable')
  })

  it('keeps timing methods apart and labels pace as not a date', () => {
    const r = runVedicPrashna(chart(1, 10, { Ma: graha('Ma', 1, 5), Sa: graha('Sa', 3, 10) }), 'career')
    expect(r.timing.map(t => t.name)).toEqual(['Pace from the matter\'s lord', 'Ithasala degrees', 'Astronomical perfection'])
    expect(r.timing[0].working).toMatch(/not a date/)
  })

  it('health and dispute carry a not-advice note', () => {
    expect(runVedicPrashna(chart(1, 10, {}), 'health').notices.join(' ')).toMatch(/not medical advice/)
    expect(runVedicPrashna(chart(1, 10, {}), 'dispute').notices.join(' ')).toMatch(/not legal advice/)
  })
})

describe('Lagna stability', () => {
  it('shifts across a sign boundary and wraps the zodiac', () => {
    expect(shiftLagna(chart(1, 29.5, {}), 1).lagnas.ascRashi).toBe(2)
    expect(shiftLagna(chart(1, 0.5, {}), -1).lagnas.ascRashi).toBe(12)
  })

  it('reports stable when nothing changes', () => {
    const r = analyseLagnaStability(chart(1, 15, {}), () => 'same')
    expect(r.stable).toBe(true)
    expect(r.points).toHaveLength(4)
  })

  it('reports the nearest time a verdict changes', () => {
    const r = analyseLagnaStability(chart(1, 29.5, {}), c => (c.lagnas.ascRashi === 1 ? 'A' : 'B'))
    expect(r.stable).toBe(false)
    expect(r.summary).toMatch(/within 4 minutes/)
  })

  it('re-reads Satpanchasika across a sign boundary', () => {
    const c = chart(2, 29.5, {})
    const r = analyseLagnaStability(c, x => runSatpanchasika(x, { question: 'traveller_return' }).verdict)
    expect(r.points.find(p => p.offsetDegrees === 1)?.lagna).toMatch(/^Gemini/)
  })
})

describe('Planet table', () => {
  it('shows all seven with nature and one strongest', () => {
    const r = runSatpanchasika(chart(1, 15, { Mo: graha('Mo', 1, 16) }), { question: 'work' })
    expect(r.planets).toHaveLength(7)
    expect(r.planets.filter(p => p.isStrongest)).toHaveLength(1)
    expect(r.planets.find(p => p.id === 'Ju')?.nature).toBe('Benefic')
    expect(r.planets.find(p => p.id === 'Sa')?.nature).toBe('Malefic')
  })
})
