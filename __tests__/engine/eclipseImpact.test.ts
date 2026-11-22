// Eclipse impact on a natal chart (pure engine) + eclipse degree from sweph.
import { describe, expect, it } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { eclipseImpact, type EclipseForImpact } from '@/lib/engine/eclipseImpact'
import { findEclipses } from '@/lib/engine/eclipses'
import { getNakshatra } from '@/lib/engine/nakshatra'

function g(id: GrahaId, lon: number): GrahaData {
  return {
    id, name: id, lonTropical: lon, lonSidereal: lon, latitude: 0, speed: 1, isRetro: false, isCombust: false,
    rashi: (Math.floor(lon / 30) + 1) as Rashi, rashiName: '', degree: lon % 30, totalDegree: lon,
    nakshatraIndex: getNakshatra(lon).index, nakshatraName: getNakshatra(lon).name, pada: 1,
  } as unknown as GrahaData
}

/** Lagna Aries 10°, Moon Cancer 25° (Ashlesha), Sun Capricorn 25°. */
function chart(): ChartOutput {
  return {
    lagnas: { ascRashi: 1, ascDegree: 10, ascDegreeInRashi: 10 },
    grahas: [g('Su', 295), g('Mo', 115), g('Ma', 40), g('Me', 300), g('Ju', 200), g('Ve', 330), g('Sa', 250), g('Ra', 60), g('Ke', 240)],
  } as unknown as ChartOutput
}

const ecl = (kind: 'solar' | 'lunar', longitude: number, visible = true): EclipseForImpact => ({
  kind, type: 'total', max: '2026-08-12T17:46:00Z', sign: (Math.floor(longitude / 30) + 1) as Rashi, longitude, local: { visible },
})

describe('eclipseImpact', () => {
  it('flags an eclipse on the natal Moon in the janma nakshatra as strong', () => {
    const r = eclipseImpact(ecl('solar', 116), chart())
    expect(r.houseFromLagna).toBe(4)
    expect(r.houseFromMoon).toBe(1)
    expect(r.janmaNakshatra).toBe(true)
    expect(r.hits[0]).toMatchObject({ point: 'Mo', by: 'sun' })
    expect(r.level).toBe('high')
  })

  it('reads a lunar eclipse across the axis: the Sun opposite touches natal points', () => {
    // Moon at 115° (Cancer) → Sun at 295° on the natal Sun.
    const r = eclipseImpact(ecl('lunar', 115.5), chart())
    expect(r.sunHouseFromLagna).toBe(10)
    expect(r.hits.some((h) => h.point === 'Su' && h.by === 'sun')).toBe(true)
    expect(r.hits.some((h) => h.point === 'Mo' && h.by === 'moon')).toBe(true)
  })

  it('is light when nothing natal is touched', () => {
    const r = eclipseImpact(ecl('solar', 165, false), chart())
    expect(r.houseFromLagna).toBe(6)
    expect(r.hits).toEqual([])
    expect(r.level).toBe('low')
    expect(r.lines.some((l) => l.includes('not visible'))).toBe(true)
  })

  it('gives a visible penumbral eclipse no sutak and a lighter level', () => {
    const pen = { ...ecl('lunar', 115.5), type: 'penumbral', local: { visible: true } }
    const r = eclipseImpact(pen, chart())
    expect(r.level).toBe('moderate')
    expect(r.lines.some((l) => l.includes('no sutak'))).toBe(true)
    const umbral = eclipseImpact({ ...ecl('lunar', 115.5), local: { visible: true, sutakStart: '2026-08-12T08:00:00Z' } }, chart())
    expect(umbral.level).toBe('high')
    expect(umbral.lines.some((l) => l.includes('sutak rules apply'))).toBe(true)
  })

  it('has no English left in Hindi', () => {
    const r = eclipseImpact(ecl('lunar', 115.5), chart(), 'hi')
    for (const line of r.lines) expect(line).not.toMatch(/[A-Za-z]/)
  })
})

describe('eclipse degree', () => {
  it('gives the 12 Aug 2026 total solar eclipse a sidereal Cancer degree matching its sign', () => {
    const list = findEclipses(new Date('2026-08-01T00:00:00Z'), new Date('2026-08-31T00:00:00Z'), { lat: 28.61, lng: 77.21 })
    const solar = list.find((e) => e.kind === 'solar')!
    expect(solar.max.slice(0, 10)).toBe('2026-08-12')
    expect(Math.floor(solar.longitude / 30) + 1).toBe(solar.sign)
    expect(solar.sign).toBe(4)
  })
})
