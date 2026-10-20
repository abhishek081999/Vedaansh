import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzePartnerNature, comparePartnerNature, type PartnerNatureReading } from '@/lib/engine/partnerNature'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  gender?: 'male' | 'female'
  name?: string
}): ChartOutput {
  return {
    meta: { gender: opts.gender, name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
  } as unknown as ChartOutput
}

function ids(reading: PartnerNatureReading): string[] {
  return [...reading.portrait, ...reading.planets].map(n => n.id)
}

function prose(reading: PartnerNatureReading): string {
  return [reading.headline, ...[...reading.portrait, ...reading.planets].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('partner nature from one chart', () => {
  it('reads an incomplete love and a Saturnine 7th from the woman’s chart', () => {
    const reading = analyzePartnerNature(chart({
      asc: 1,
      gender: 'female',
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Mo', 8, 'debilitated'),
        g('Sa', 7, 'exalted'),
        g('Ma', 5),
        g('Ju', 9, 'own'),
        g('Ra', 2),
        g('Ke', 8),
        g('Me', 7),
      ],
    }))!
    expect(reading.flags.incomplete).toBe(true)
    expect(reading.flags.cold).toBe(true)
    expect(ids(reading)).toEqual(expect.arrayContaining(['partner-seventh', 'partner-incomplete', 'partner-ve', 'partner-sa']))
    expect(ids(reading)).not.toContain('partner-ma')
    expect(ids(reading)).not.toContain('partner-ke')
    expect(ids(reading)).not.toContain('partner-me')
    expect(prose(reading)).toMatch(/husband/)
    expect(prose(reading)).toMatch(/Mercury/)
    expect(prose(reading)).toMatch(/emotionally unavailable/)
    expect(prose(reading)).not.toMatch(/100%|NOT come/)
  })

  it('leaves love complete when the Moon and Venus are strong, and skips a distant Ketu', () => {
    const reading = analyzePartnerNature(chart({
      asc: 1,
      gender: 'male',
      grahas: [
        g('Ve', 7, 'own'),
        g('Mo', 2, 'own'),
        g('Sa', 11),
        g('Ke', 2),
        g('Ra', 8),
        g('Ju', 9, 'own'),
        g('Ma', 6),
      ],
    }))!
    expect(reading.flags.incomplete).toBe(false)
    expect(reading.flags.cold).toBe(false)
    expect(ids(reading)).toContain('partner-ve')
    expect(ids(reading)).not.toContain('partner-incomplete')
    expect(ids(reading)).not.toContain('partner-ke')
    expect(prose(reading)).toMatch(/wife/)
  })

  it('uses the second chart to confirm whose behavior is being described', () => {
    const her = analyzePartnerNature(chart({
      asc: 1,
      gender: 'female',
      name: 'Asha',
      grahas: [g('Ve', 6, 'debilitated'), g('Mo', 8, 'debilitated'), g('Sa', 11), g('Ju', 9), g('Ma', 5)],
    }))!
    const him = analyzePartnerNature(chart({
      asc: 1,
      gender: 'male',
      name: 'Dev',
      grahas: [g('Ve', 7, 'own'), g('Mo', 2, 'own'), g('Sa', 11), g('Ju', 9, 'own'), g('Ma', 6), g('Ke', 3), g('Ra', 9)],
    }))!
    expect(her.flags.incomplete).toBe(true)
    expect(him.flags.incomplete).toBe(false)
    const pair = comparePartnerNature(her, him, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('partner-pair-one')
    expect(pair.map(n => n.id)).not.toContain('partner-pair-cold')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzePartnerNature({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
