import { describe, expect, it } from 'vitest'
import { buildDailyHoroscopeSky, findMoonInSign } from '@/lib/engine/dailyHoroscopeSky'
import {
  buildDailyHoroscopeReport,
  buildRashiHoroscope,
  rashiFromSlug,
} from '@/lib/engine/dailyRashiHoroscope'
import type { DailyHoroscopeSky } from '@/lib/engine/dailyHoroscopeSky'
import type { Rashi } from '@/types/astrology'

function sky(rashis: Record<string, Rashi>, ingress: DailyHoroscopeSky['moonIngress'] = null): DailyHoroscopeSky {
  return {
    date: '2026-01-01',
    dayStart: '2026-01-01T00:30:00.000Z',
    dayEnd: '2026-01-02T00:30:00.000Z',
    grahas: Object.entries(rashis).map(([id, rashi]) => ({
      id: id as never,
      rashi,
      longitude: (rashi - 1) * 30 + 15,
      retro: false,
    })),
    moonNakshatra: { index: 0, name: 'Ashwini', pada: 1 },
    moonIngress: ingress,
    panchang: {
      vara: { name: 'Thursday', sanskrit: 'Guruvara', lord: 'Ju' },
      tithi: { name: 'Pratipada', paksha: 'shukla' },
      yoga: { name: 'Vishkumbha', quality: 'inauspicious' },
      karana: { name: 'Bava', isBhadra: false },
    },
    timings: {
      place: 'Ujjain',
      sunrise: '2026-01-01T01:30:00.000Z',
      sunset: '2026-01-01T12:30:00.000Z',
      rahuKalam: { start: '2026-01-01T07:30:00.000Z', end: '2026-01-01T09:00:00.000Z' },
      horas: Array.from({ length: 24 }, (_, i) => ({
        start: new Date(Date.parse('2026-01-01T01:30:00.000Z') + i * 3_600_000).toISOString(),
        end: new Date(Date.parse('2026-01-01T02:30:00.000Z') + i * 3_600_000).toISOString(),
        lord: (['Ju', 'Ma', 'Su', 'Ve', 'Me', 'Mo', 'Sa'] as const)[i % 7],
        day: i < 12,
      })),
    },
  }
}

const BASE = { Su: 1, Mo: 1, Ma: 1, Me: 1, Ju: 1, Ve: 1, Sa: 1, Ra: 1, Ke: 7 } as Record<string, Rashi>

describe('daily rashi horoscope', () => {
  it('scores Moon in the 11th far above Chandrashtama', () => {
    const gains = buildRashiHoroscope(sky({ ...BASE, Mo: 11 }), 1)
    const ashtama = buildRashiHoroscope(sky({ ...BASE, Mo: 8 }), 1)
    expect(gains.moon.house).toBe(11)
    expect(ashtama.moon.house).toBe(8)
    expect(gains.score).toBeGreaterThan(ashtama.score)
    expect(ashtama.headline).toMatch(/Chandrashtama/)
  })

  it('flags Sade Sati phases from Saturn', () => {
    const h = buildRashiHoroscope(sky({ ...BASE, Sa: 12 }), 1)
    expect(h.longTerm.join(' ')).toMatch(/Sade Sati — rising/)
  })

  it('blends the Moon when it changes sign during the day', () => {
    const s = sky({ ...BASE, Mo: 8 }, { at: '2026-01-01T06:30:00.000Z', toRashi: 9 })
    const h = buildRashiHoroscope(s, 1)
    expect(h.moon.later?.house).toBe(9)
  })

  it('picks shubh samay from favourable horas outside Rahu Kalam', () => {
    // Moon sign Aries: Jupiter in the 11th (favourable), Sun in the 1st (not).
    const h = buildRashiHoroscope(sky({ ...BASE, Ju: 11, Su: 1 }), 1)
    expect(h.shubhSamay.length).toBeGreaterThan(0)
    for (const w of h.shubhSamay) {
      expect(w.lord).not.toBe('Su')
      const overlapsRahu = Date.parse(w.start) < Date.parse('2026-01-01T09:00:00.000Z')
        && Date.parse(w.end) > Date.parse('2026-01-01T07:30:00.000Z')
      expect(overlapsRahu).toBe(false)
    }
    expect(h.shubhSamay.some((w) => w.lord === 'Ju')).toBe(true)
  })

  it('finds the Moon’s span in a sign (Chandrashtama window)', () => {
    const from = new Date('2026-11-04T00:30:00Z')
    const w = findMoonInSign(from, 10)!
    expect(w).not.toBeNull()
    const hours = (Date.parse(w.end) - Date.parse(w.start)) / 3_600_000
    expect(hours).toBeGreaterThan(48)
    expect(hours).toBeLessThan(66)
    expect(Date.parse(w.start)).toBeGreaterThan(from.getTime())
  })

  it('resolves slugs in English and Sanskrit', () => {
    expect(rashiFromSlug('Leo')).toBe(5)
    expect(rashiFromSlug('makara')).toBe(10)
    expect(rashiFromSlug('nope')).toBeNull()
  })

  it('builds twelve bounded readings from the real sky', () => {
    const report = buildDailyHoroscopeReport(buildDailyHoroscopeSky('2026-11-04'))
    expect(report.signs).toHaveLength(12)
    for (const s of report.signs) {
      expect(s.score).toBeGreaterThanOrEqual(8)
      expect(s.score).toBeLessThanOrEqual(96)
      expect(s.areas).toHaveLength(5)
      expect(s.karya.length).toBeGreaterThan(0)
      for (const a of s.areas) expect(a.rating).toBeGreaterThanOrEqual(1)
      expect(s.transits).toHaveLength(9)
      expect(s.summary.length).toBeGreaterThan(20)
    }
    // Moon's own sign always reads house 1
    expect(report.signs[report.moonRashi - 1].moon.house).toBe(1)
  })
})
