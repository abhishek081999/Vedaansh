import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id } as GrahaData
}

function chart(opts: {
  name: string
  asc: Rashi
  grahas: GrahaData[]
  d9Asc?: Rashi
  d9?: GrahaData[]
  dk?: GrahaId
}): ChartOutput {
  return {
    meta: { name: opts.name },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    karakas: opts.dk ? { DK: opts.dk } : {},
  } as unknown as ChartOutput
}

describe('marriage synastry', () => {
  it('flags overlay hits into 1/5/7/8/12 and scores D9×D9', () => {
    const a = chart({
      name: 'Asha',
      asc: 1,
      grahas: [g('Ve', 7), g('Ju', 5), g('Mo', 1), g('Ma', 8)],
      d9Asc: 1,
      d9: [g('Ve', 2, 'own'), g('Su', 5, 'own')],
      dk: 'Ve',
    })
    // B asc = Libra (7): A's Ve in Aries(1) → house ((1-7+12)%12)+1 = 7
    const b = chart({
      name: 'Dev',
      asc: 7,
      grahas: [g('Ve', 1), g('Ju', 9), g('Mo', 4), g('Ma', 10)],
      d9Asc: 1,
      d9: [g('Ve', 2, 'own'), g('Su', 5, 'own')],
    })
    const reading = analyzeMarriageSynastry(a, b)!
    expect(reading.overlayAonB.length).toBeGreaterThan(0)
    expect(reading.overlayBonA.length).toBeGreaterThan(0)
    expect(reading.flags.d9Score).toBe('aligned')
    expect(reading.d9[0].id).toBe('syn-d9')
    const prose = [reading.headline, reading.summary, ...reading.overlayAonB, ...reading.overlayBonA, ...reading.d9]
      .map(n => typeof n === 'string' ? n : `${n.title} ${n.detail}`)
      .join(' ')
    expect(prose).not.toMatch(/BPHS|Chapter|Parashara/)
  })

  it('returns null without both ascendants', () => {
    expect(analyzeMarriageSynastry(
      chart({ name: 'A', asc: 1, grahas: [] }),
      { grahas: [], lagnas: {} } as unknown as ChartOutput,
    )).toBeNull()
  })
})
