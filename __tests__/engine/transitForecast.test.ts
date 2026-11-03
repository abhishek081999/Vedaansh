// ─────────────────────────────────────────────────────────────
//  __tests__/engine/transitForecast.test.ts
//  Predictive transit forecast — pure scoring + ephemeris build
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  buildTransitForecast,
  FORECAST_AREAS,
  scoreForecastSample,
  signOfHouse,
  type ForecastNatal,
} from '@/lib/engine/transitForecast'
import type { Rashi } from '@/types/astrology'

const natal: ForecastNatal = { ascRashi: 1 as Rashi, moonRashi: 4 as Rashi }

describe('signOfHouse', () => {
  it('counts houses from the Lagna sign', () => {
    expect(signOfHouse(1 as Rashi, 1)).toBe(1)
    expect(signOfHouse(1 as Rashi, 10)).toBe(10)
    expect(signOfHouse(11 as Rashi, 4)).toBe(2)
  })
})

describe('scoreForecastSample', () => {
  it('rates favourable gochar above unfavourable gochar', () => {
    // Moon in Cancer: Ju 11th = Taurus (fav), Sa 11th (fav) vs Ju 8th = Aquarius, Sa 12th = Gemini (Sade Sati)
    const good = scoreForecastSample(natal, { signs: { Ju: 2, Sa: 2, Ra: 9, Ke: 3 } })
    const bad = scoreForecastSample(natal, { signs: { Ju: 11, Sa: 3, Ra: 4, Ke: 10 } })
    expect(good.overall).toBeGreaterThan(50)
    expect(bad.overall).toBeLessThan(50)
    expect(good.drivers[0].impact).toBeGreaterThan(0)
  })

  it('applies Vedha — favourable house obstructed scores neutral', () => {
    // Ju 11th from Moon (Taurus) obstructed by planet in 8th from Moon (Aquarius)
    const clear = scoreForecastSample(natal, { signs: { Ju: 2 } })
    const blocked = scoreForecastSample(natal, { signs: { Ju: 2, Ve: 11 } })
    const ju = blocked.drivers.find(d => d.planet === 'Ju')
    expect(ju?.status).toBe('vedha')
    expect(ju?.vedhaBy).toBe('Ve')
    expect(clear.drivers.find(d => d.planet === 'Ju')?.status).toBe('favourable')
  })

  it('amplifies the running dasha lord and blends BAV bindus', () => {
    const base = scoreForecastSample(natal, { signs: { Ju: 2, Sa: 3 } })
    const withMd = scoreForecastSample(natal, { signs: { Ju: 2, Sa: 3 }, md: 'Ju' })
    expect(withMd.overall).toBeGreaterThan(base.overall)
    expect(withMd.drivers.find(d => d.planet === 'Ju')?.dashaRole).toBe('MD')

    const weakBav = scoreForecastSample({ ...natal, bav: { Ju: Array(12).fill(1) } }, { signs: { Ju: 2 } })
    const strongBav = scoreForecastSample({ ...natal, bav: { Ju: Array(12).fill(8) } }, { signs: { Ju: 2 } })
    expect(strongBav.overall).toBeGreaterThan(weakBav.overall)
  })

  it('flags Ju+Sa double transit on a primary house', () => {
    // Aries Lagna: 10th = Capricorn. Ju in Capricorn (conj), Sa in Cancer aspects... use Sa in Capricorn too.
    const res = scoreForecastSample(natal, { signs: { Ju: 10, Sa: 10 } })
    const career = res.areas.find(a => a.id === 'career')
    expect(career?.doubleTransit).toBe(true)
    expect(career?.notes.some(n => n.includes('Double transit'))).toBe(true)
    expect(res.areas).toHaveLength(FORECAST_AREAS.length)
  })
})

describe('buildTransitForecast', () => {
  it('builds a 12-month forecast with points, tracks, events and outlooks', () => {
    const report = buildTransitForecast({
      natal: {
        ...natal,
        dashas: [
          { md: 'Ju', ad: 'Sa', startIso: '2019-01-01', endIso: '2020-09-01' },
          { md: 'Ju', ad: 'Me', startIso: '2020-09-01', endIso: '2022-12-01' },
        ],
      },
      asOf: new Date('2020-01-15T12:00:00Z'),
      months: 12,
    })

    expect(report.stepDays).toBe(3)
    expect(report.points.length).toBeGreaterThan(100)
    expect(report.points[0].dateIso).toBe('2020-01-15')
    for (const p of report.points) {
      expect(p.overall).toBeGreaterThanOrEqual(0)
      expect(p.overall).toBeLessThanOrEqual(100)
    }
    expect(report.areaOutlooks).toHaveLength(6)
    expect(report.tracks.filter(t => t.planet === 'Ju').length).toBeGreaterThanOrEqual(2)
    // Jupiter entered Capricorn late March 2020 and Saturn entered Capricorn 24 Jan 2020
    const saIngress = report.events.find(e => e.planet === 'Sa' && e.kind === 'ingress')
    expect(saIngress?.dateIso.startsWith('2020-01')).toBe(true)
    expect(report.events.some(e => e.kind === 'dasha' && e.planet === 'Me')).toBe(true)
    expect(report.events.some(e => e.planet === 'Ju' && e.kind === 'retrograde')).toBe(true)
    expect(report.headline).toMatch(/\/100/)
  })
})

describe('forecast predictions', () => {
  const report = buildTransitForecast({
    natal: {
      ...natal,
      dashas: [{ md: 'Ju', ad: 'Sa', startIso: '2019-01-01', endIso: '2021-01-01' }],
    },
    asOf: new Date('2020-01-15T12:00:00Z'),
    months: 12,
  })
  const p = report.predictions

  it('writes an overview with phase, dasha and the year ahead', () => {
    expect(p.overview).not.toContain(report.headline)
    expect(p.overview[0]).toMatch(/^Right now/)
    expect(p.overview.some(t => t.includes('Jupiter Mahadasha / Saturn Antardasha'))).toBe(true)
    expect(p.overview.some(t => t.includes('strongest area'))).toBe(true)
  })

  it('predicts every life area with advice', () => {
    expect(p.areas).toHaveLength(FORECAST_AREAS.length)
    for (const a of p.areas) {
      expect(a.verdict.length).toBeGreaterThan(10)
      expect(a.now).toMatch(/Expect|possible/)
      expect(a.doList.length).toBeGreaterThan(0)
      expect(a.avoidList.length).toBeGreaterThan(0)
      expect(a.now).not.toMatch(/ {2}/)
    }
  })

  it('covers each month with ordered sky events', () => {
    expect(p.months.length).toBeGreaterThanOrEqual(12)
    expect(p.months[0].month).toBe('2020-01')
    const jan = p.months[0]
    expect(jan.events.some(e => e.includes('Saturn enters'))).toBe(true)
    for (const m of p.months) expect(m.text).not.toMatch(/ {2}/)
  })

  it('pairs every window with expect / do / avoid', () => {
    expect(p.windows).toHaveLength(report.windows.length)
    for (const w of p.windows) {
      expect(w.expect).toMatch(/Expect/)
      expect(w.doList.length).toBeGreaterThan(0)
    }
  })
})
