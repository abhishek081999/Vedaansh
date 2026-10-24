// ─────────────────────────────────────────────────────────────
//  __tests__/engine/todayReading.test.ts
//  Personal daily reading: Chandra/Tara bala, gochar Vedha, triggers,
//  dasha overlay and timing windows. Pure inputs, no ephemeris.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { evaluateGochar, houseFrom, type GocharPlanet } from '@/lib/engine/gocharRules'
import {
  buildTodayReading,
  type TodayNatalInput,
  type TodayPanchangInput,
  type TodayTransitGraha,
} from '@/lib/engine/todayReading'

const NOW = new Date('2026-10-24T05:00:00Z')

function natalGraha(id: GrahaId, rashi: Rashi, deg: number, nak: number, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id,
    rashi,
    degree: deg,
    lonSidereal: (rashi - 1) * 30 + deg,
    nakshatraIndex: nak,
    dignity: 'neutral',
    isCombust: false,
    isRetro: false,
    ...extra,
  } as unknown as GrahaData
}

function transitGraha(id: GrahaId, rashi: Rashi, deg: number, nak: number, extra: Partial<TodayTransitGraha> = {}): TodayTransitGraha {
  return {
    id,
    rashi,
    degree: deg,
    lonSidereal: (rashi - 1) * 30 + deg,
    nakshatraIndex: nak,
    nakshatraName: `N${nak}`,
    pada: 1,
    isRetro: false,
    dignity: 'neutral',
    speed: 13,
    ...extra,
  }
}

function dashaNode(lord: string, level: number, children: DashaNode[] = []): DashaNode {
  return {
    lord,
    start: new Date('2020-01-01T00:00:00Z'),
    end: new Date('2030-01-01T00:00:00Z'),
    durationMs: 0,
    level,
    isCurrent: true,
    children,
  }
}

/** Aries lagna, Moon in Taurus (Rohini, nak 3), Saturn in Aries, Jupiter exalted in Cancer. */
function natalChart(): TodayNatalInput {
  return {
    lagnas: { ascRashi: 1, ascDegree: 5 },
    grahas: [
      natalGraha('Su', 5, 10, 9),
      natalGraha('Mo', 2, 10, 3),
      natalGraha('Ma', 1, 20, 1),
      natalGraha('Me', 5, 2, 9),
      natalGraha('Ju', 4, 5, 7, { dignity: 'exalted' }),
      natalGraha('Ve', 2, 15, 3, { dignity: 'own' }),
      natalGraha('Sa', 1, 12, 1, { dignity: 'debilitated' }),
      natalGraha('Ra', 11, 8, 23),
      natalGraha('Ke', 5, 8, 9),
    ],
    dashas: {
      vimshottari: [dashaNode('Ju', 1, [dashaNode('Sa', 2, [dashaNode('Ve', 3)])])],
    },
  }
}

function skyWith(overrides: Partial<Record<GrahaId, TodayTransitGraha>> = {}): TodayTransitGraha[] {
  const base: Record<GrahaId, TodayTransitGraha> = {
    Su: transitGraha('Su', 7, 7, 14),
    Mo: transitGraha('Mo', 4, 12, 7), // Cancer: 3rd from natal Moon (Taurus)
    Ma: transitGraha('Ma', 8, 3, 16),
    Me: transitGraha('Me', 7, 20, 15),
    Ju: transitGraha('Ju', 3, 15, 6),
    Ve: transitGraha('Ve', 6, 5, 12),
    Sa: transitGraha('Sa', 12, 10, 26),
    Ra: transitGraha('Ra', 11, 20, 24),
    Ke: transitGraha('Ke', 5, 20, 10),
    Ur: transitGraha('Ur', 2, 0, 3),
    Ne: transitGraha('Ne', 12, 0, 25),
    Pl: transitGraha('Pl', 10, 0, 21),
  }
  return Object.values({ ...base, ...overrides })
}

function panchang(): TodayPanchangInput {
  return {
    date: '2026-10-24',
    vara: { number: 6, name: 'Saturday', lord: 'Sa' },
    sunrise: '2026-10-24T00:30:00Z',
    sunset: '2026-10-24T12:30:00Z',
    rahuKalam: { start: '2026-10-24T05:30:00Z', end: '2026-10-24T07:00:00Z' },
    yamaganda: { start: '2026-10-24T08:00:00Z', end: '2026-10-24T09:30:00Z' },
    gulikaKalam: { start: '2026-10-24T02:00:00Z', end: '2026-10-24T03:30:00Z' },
    abhijitMuhurta: { start: '2026-10-24T06:00:00Z', end: '2026-10-24T06:48:00Z' },
    horaTable: [
      { lord: 'Ju', start: '2026-10-24T04:30:00Z', end: '2026-10-24T05:30:00Z' },
      { lord: 'Ma', start: '2026-10-24T05:30:00Z', end: '2026-10-24T06:30:00Z' },
    ],
    choghadiya: {
      day: [
        { name: 'Amrit', quality: 'good', start: '2026-10-24T04:00:00Z', end: '2026-10-24T07:00:00Z' },
        { name: 'Kaal', quality: 'avoid', start: '2026-10-24T07:00:00Z', end: '2026-10-24T08:30:00Z' },
      ],
      night: [],
    },
  }
}

function build(overrides: Partial<Record<GrahaId, TodayTransitGraha>> = {}) {
  return buildTodayReading({ natal: natalChart(), transit: skyWith(overrides), panchang: panchang(), now: NOW })
}

describe('gocharRules', () => {
  it('counts houses inclusively', () => {
    expect(houseFrom(4, 2)).toBe(3)
    expect(houseFrom(2, 4)).toBe(11)
    expect(houseFrom(5, 5)).toBe(1)
  })

  it('marks a favourable house as vedha when the paired house is occupied', () => {
    const houses: Partial<Record<GocharPlanet, number>> = { Ju: 2, Sa: 12 }
    const ev = evaluateGochar('Ju', houses)
    expect(ev?.status).toBe('vedha')
    expect(ev?.vedhaBy).toBe('Sa')
  })

  it('does not apply vedha between Sun and Saturn', () => {
    const ev = evaluateGochar('Su', { Su: 3, Sa: 9 })
    expect(ev?.status).toBe('favourable')
  })

  it('flags an unfavourable house without checking vedha', () => {
    expect(evaluateGochar('Sa', { Sa: 8 })?.status).toBe('unfavourable')
  })
})

describe('buildTodayReading', () => {
  it('returns null without a Moon or Sun', () => {
    const noMoon = skyWith().filter(g => g.id !== 'Mo')
    expect(buildTodayReading({ natal: natalChart(), transit: noMoon, panchang: panchang(), now: NOW })).toBeNull()
  })

  it('reads Chandra Bala as good when the Moon is 3rd from the natal Moon', () => {
    const r = build()!
    expect(r.moon.chandraPosition).toBe(3)
    expect(r.moon.chandraQuality).toBe('good')
    expect(r.moon.lagnaHouse).toBe(4)
    expect(r.supportive.some(s => s.startsWith('Chandra Bala'))).toBe(true)
  })

  it('reads Chandra Bala as bad when the Moon is 8th from the natal Moon', () => {
    const r = build({ Mo: transitGraha('Mo', 9, 3, 19) })!
    expect(r.moon.chandraPosition).toBe(8)
    expect(r.moon.chandraQuality).toBe('bad')
    expect(r.caution.some(s => s.startsWith('Chandra Bala'))).toBe(true)
  })

  it('scores a good-Moon day higher than a bad-Moon day, within bounds', () => {
    const good = build()!
    const bad = build({ Mo: transitGraha('Mo', 9, 3, 19) })!
    expect(good.score).toBeGreaterThan(bad.score)
    for (const r of [good, bad]) {
      expect(r.score).toBeGreaterThanOrEqual(8)
      expect(r.score).toBeLessThanOrEqual(94)
    }
  })

  it('flags a hard tara (Vipat) when the day Moon is the 3rd nakshatra from birth', () => {
    // birth nak 3 -> day nak 5 = third tara
    const r = build({ Mo: transitGraha('Mo', 4, 12, 5) })!
    expect(r.tara.name).toBe('Vipat')
    expect(r.tara.isHard).toBe(true)
    expect(r.avoidList.length).toBeGreaterThan(0)
  })

  it('estimates the Moon sign change from its speed', () => {
    const r = build()! // Moon at 12° of Cancer, 13°/day -> 18°/13 per day
    expect(r.moon.signChange?.toRashiName).toBe('Leo')
    const hours = (new Date(r.moon.signChange!.atIso).getTime() - NOW.getTime()) / 3_600_000
    expect(hours).toBeCloseTo((18 / 13) * 24, 1)
  })

  it('detects Saturn conjunct natal Moon as a pressure trigger', () => {
    const r = build({ Sa: transitGraha('Sa', 2, 11, 3) })!
    const hit = r.triggers.find(t => t.transit === 'Sa' && t.natal === 'Mo')
    expect(hit?.aspect).toBe('conjunction')
    expect(hit?.nature).toBe('pressure')
    expect(r.saturn.phase).toBe('sade_sati')
  })

  it('ignores planets outside the orb', () => {
    const r = build({ Sa: transitGraha('Sa', 2, 25, 4) })!
    expect(r.triggers.find(t => t.transit === 'Sa' && t.natal === 'Mo')).toBeUndefined()
  })

  it('reports the running dasha path with lord notes', () => {
    const r = build()!
    expect(r.dasha.map(d => d.lord)).toEqual(['Ju', 'Sa', 'Ve'])
    expect(r.dasha[0].note).toContain('Jupiter')
  })

  it('removes Rahu Kalam from good choghadiya windows', () => {
    const r = build()!
    const amrit = r.windows.good.filter(w => w.label === 'Amrit choghadiya')
    expect(amrit.length).toBeGreaterThan(0)
    const rahuStart = Date.parse('2026-10-24T05:30:00Z')
    for (const w of amrit) expect(Date.parse(w.endIso)).toBeLessThanOrEqual(rahuStart)
    expect(r.windows.avoid.map(a => a.label)).toContain('Rahu Kalam')
  })

  it('marks the current hora', () => {
    const r = build()!
    expect(r.windows.currentHora?.label).toBe('Jupiter hora')
    expect(r.windows.currentHora?.current).toBe(true)
  })

  it('returns six area scores inside bounds with at most two drivers', () => {
    const r = build()!
    expect(r.areas).toHaveLength(6)
    for (const a of r.areas) {
      expect(a.score).toBeGreaterThanOrEqual(8)
      expect(a.score).toBeLessThanOrEqual(95)
      expect(a.drivers.length).toBeLessThanOrEqual(2)
    }
  })

  it('always supplies the weekday lord remedy and a narrative', () => {
    const r = build()!
    expect(r.remedy.vara.lord).toBe('Sa')
    expect(r.remedy.vara.remedy.mantra).toContain('Shanaishcharaya')
    expect(r.narrative.length).toBeGreaterThanOrEqual(3)
  })
})
