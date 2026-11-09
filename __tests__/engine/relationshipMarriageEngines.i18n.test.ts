import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageMars } from '@/lib/engine/marriageMars'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzeMarriageVivah } from '@/lib/engine/marriageVivah'
import { analyzeSeventhLord } from '@/lib/engine/seventhLord'

const DEVA = /[\u0900-\u097F]/

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral', extra: Partial<GrahaData> = {}): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, ...extra } as GrahaData
}

const marsChart = (): ChartOutput => ({
  meta: { gender: 'male', birthDate: '1995-01-01' },
  grahas: [g('Ma', 7), g('Ve', 2, 'own'), g('Ju', 9, 'own'), g('Mo', 4), g('Sa', 3)],
  lagnas: { ascRashi: 1 },
} as ChartOutput)

describe('relationship marriage engines i18n', () => {
  it('keeps English marriageMars byte-stable', () => {
    const en = analyzeMarriageMars(marsChart(), {}, 'en')!
    expect(en.headline).toBe('Mars is the raw heat in this marriage')
    expect(en.principles).toMatch(/^Mars is the fire/)
    expect(analyzeMarriageMars(marsChart(), {}, 'en')).toEqual(en)
  })

  it('returns Hindi for marriageMars', () => {
    const hi = analyzeMarriageMars(marsChart(), {}, 'hi')!
    expect(hi.headline).toMatch(DEVA)
    expect(hi.principles).toMatch(DEVA)
    expect(hi.level[0]?.title).toMatch(DEVA)
  })

  it('keeps English divorceEnergy byte-stable', () => {
    const chart: ChartOutput = {
      grahas: [
        g('Mo', 6, 'debilitated'),
        g('Ve', 8, 'debilitated'),
        g('Sa', 12, 'debilitated'),
        g('Ma', 1),
      ],
      lagnas: { ascRashi: 1 },
    } as ChartOutput
    const en = analyzeDivorceEnergy(chart, 'en')!
    expect(en.headline).toBe('Emotion, attraction, and duty are all down')
    expect(analyzeDivorceEnergy(chart, 'en')).toEqual(en)
  })

  it('returns Hindi for divorceEnergy', () => {
    const chart: ChartOutput = {
      grahas: [g('Mo', 4, 'own'), g('Ve', 2, 'own'), g('Sa', 10, 'exalted'), g('Ju', 9, 'own')],
      lagnas: { ascRashi: 1 },
    } as ChartOutput
    const hi = analyzeDivorceEnergy(chart, 'hi')!
    expect(hi.headline).toMatch(DEVA)
    expect(hi.energies[0]?.title).toMatch(DEVA)
  })

  it('keeps English marriageGochar byte-stable', () => {
    const chart: ChartOutput = {
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own')],
      lagnas: { ascRashi: 1 },
      dashas: {
        vimshottari: [{
          lord: 'Ve',
          start: new Date('2020-01-01'),
          end: new Date('2036-01-01'),
          durationMs: 1,
          level: 1,
          isCurrent: true,
          children: [],
        }],
      },
    } as unknown as ChartOutput
    const en = analyzeMarriageGochar(chart, { skipScan: true }, 'en')!
    expect(en.headline).toBe('The period is open. A double transit can brighten it')
    expect(analyzeMarriageGochar(chart, { skipScan: true }, 'en')).toEqual(en)
  })

  it('returns Hindi for marriageGochar', () => {
    const chart: ChartOutput = {
      grahas: [g('Ve', 7, 'own'), g('Ju', 9, 'own')],
      lagnas: { ascRashi: 1 },
      dashas: {
        vimshottari: [{
          lord: 'Ve',
          start: new Date('2020-01-01'),
          end: new Date('2036-01-01'),
          durationMs: 1,
          level: 1,
          isCurrent: true,
          children: [],
        }],
      },
    } as unknown as ChartOutput
    const hi = analyzeMarriageGochar(chart, { skipScan: true }, 'hi')!
    expect(hi.principles).toMatch(DEVA)
    expect(hi.window[0]?.title).toMatch(DEVA)
  })

  it('keeps English seventhLord byte-stable', () => {
    const chart: ChartOutput = {
      grahas: [g('Ma', 7), g('Ve', 1, 'own'), g('Ju', 9), g('Mo', 5)],
      lagnas: { ascRashi: 1 },
    } as ChartOutput
    const en = analyzeSeventhLord(chart, 'en')!
    expect(en.headline).toMatch(/traded ruling planets/)
    expect(analyzeSeventhLord(chart, 'en')).toEqual(en)
  })

  it('returns Hindi for seventhLord', () => {
    const chart: ChartOutput = {
      grahas: [g('Ve', 4, 'own'), g('Ma', 1), g('Ju', 9), g('Mo', 5)],
      lagnas: { ascRashi: 1 },
    } as ChartOutput
    const hi = analyzeSeventhLord(chart, 'hi')!
    expect(hi.principles).toMatch(DEVA)
    expect(hi.placement.find(n => n.id === 'seventh-h-4')?.title).toMatch(DEVA)
  })

  it('returns Hindi overview for marriageVivah', () => {
    const hi = analyzeMarriageVivah({
      grahas: [g('Ju', 7, 'own'), g('Ve', 2, 'own'), g('Ma', 11), g('Mo', 4)],
      lagnas: { ascRashi: 1 },
    } as ChartOutput, 'hi')!
    expect(hi.principles).toMatch(DEVA)
    expect(hi.headline).toMatch(DEVA)
  })
})
