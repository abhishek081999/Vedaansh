import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageCaseBrief, analyzePairCaseBrief } from '@/lib/engine/marriageCaseBrief'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id } as GrahaData
}

function chart(opts: {
  name?: string
  asc: Rashi
  grahas: GrahaData[]
  dasha?: { md: GrahaId; ad?: GrahaId }
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dasha?.md ?? 'Ve',
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: true,
    children: opts.dasha?.ad ? [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      isCurrent: true,
      children: [],
    }] : [],
  }
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

describe('marriage case brief', () => {
  it('emits five numbered bullets without book labels', () => {
    const brief = analyzeMarriageCaseBrief(chart({
      asc: 1,
      dasha: { md: 'Ve', ad: 'Ma' },
      grahas: [
        g('Ve', 7, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own'),
        g('Su', 5), g('Sa', 11), g('Mo', 4), g('Me', 3),
      ],
    }), { skipGocharScan: true })!
    expect(brief.bullets).toHaveLength(5)
    expect(brief.bullets.map(b => b.id)).toEqual([
      'brief-eligibility',
      'brief-chemistry',
      'brief-risk',
      'brief-timing',
      'brief-action',
    ])
    const prose = brief.bullets.map(b => `${b.title} ${b.detail}`).join(' ')
    expect(prose).not.toMatch(/BPHS|Chapter|Parashara/)
  })

  it('builds a pair brief with overlay line', () => {
    const a = chart({
      name: 'Asha',
      asc: 1,
      dasha: { md: 'Ve' },
      grahas: [g('Ve', 7, 'own'), g('Ju', 9), g('Mo', 4), g('Ma', 1), g('Su', 5), g('Sa', 11), g('Me', 3)],
    })
    const b = chart({
      name: 'Dev',
      asc: 7,
      dasha: { md: 'Ju' },
      grahas: [g('Ve', 1), g('Ju', 9, 'own'), g('Mo', 4), g('Ma', 10), g('Su', 5), g('Sa', 11), g('Me', 3)],
    })
    const pair = analyzePairCaseBrief(a, b, { skipGocharScan: true })!
    expect(pair.bullets.some(n => n.id === 'pair-brief-syn')).toBe(true)
    expect(pair.headline).toMatch(/pair/i)
  })
})
