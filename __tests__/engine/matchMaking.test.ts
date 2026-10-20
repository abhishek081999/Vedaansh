import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { lagnaMatch } from '@/lib/engine/lagnaMatch'
import { analyzeMatchMaking, dashaComplement, overlayCharts } from '@/lib/engine/matchMaking'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, name: id } as GrahaData
}

function chart(asc: Rashi, grahas: GrahaData[], name: string): ChartOutput {
  return {
    meta: { name, gender: 'other' },
    grahas,
    lagnas: { ascRashi: asc },
    vargas: {},
    vargaLagnas: {},
  } as ChartOutput
}

describe('lagna match table', () => {
  it('rates Aries with Capricorn as excellent and Aries with Gemini as incompatible', () => {
    expect(lagnaMatch(1, 10).level).toBe('excellent')
    expect(lagnaMatch(10, 1).level).toBe('excellent')
    expect(lagnaMatch(1, 3).level).toBe('incompatible')
    expect(lagnaMatch(1, 1).level).toBe('neutral')
    expect(lagnaMatch(4, 8).tone).toBe('supportive')
    expect(lagnaMatch(12, 5).level).toBe('incompatible')
  })

  it('has a stored note for every ascendant pair', () => {
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        expect(lagnaMatch(a, b).reason, `${a}-${b}`).not.toMatch(/No blank-chart/)
      }
    }
  })
})

describe('house overlay', () => {
  it('flags Saturn falling on the Moon when both sit in the lagna', () => {
    const hits = overlayCharts(
      [g('Sa', 8)],
      8,
      [g('Mo', 4)],
      4,
      'A',
      'B',
    )
    expect(hits.some(h => h.title.startsWith('Saturn over Moon'))).toBe(true)
    expect(hits[0].tone).toBe('caution')
  })
})

describe('dasha complement', () => {
  it('treats Jupiter with Saturn as a clash and Venus with Moon as a complement', () => {
    expect(dashaComplement('Ju', 'Sa').tone).toBe('caution')
    expect(dashaComplement('Ve', 'Mo').tone).toBe('supportive')
    expect(dashaComplement('Su', 'Su').note).toMatch(/periods match/i)
  })
})

describe('analyzeMatchMaking', () => {
  it('runs the sequence from Mars through D4 and names the lagna pair', () => {
    const a = chart(1, [g('Ma', 10, 'exalted'), g('Ve', 2, 'own'), g('Su', 5, 'own'), g('Mo', 1)], 'Aarav')
    const b = chart(10, [g('Ma', 1, 'own'), g('Ve', 7), g('Su', 10, 'own'), g('Mo', 4)], 'Meera')
    const result = analyzeMatchMaking(a, b)
    expect(result).not.toBeNull()
    expect(result!.steps.map(s => s.id)).toEqual(['mars', 'venus', 'sun', 'moon', 'navamsha', 'dasha', 'd1', 'd4', 'axis'])
    expect(result!.lagna.level).toBe('excellent')
    expect(result!.summary).toMatch(/Aries lagna with Capricorn lagna is excellent/)
    expect(result!.pillars.map(p => p.id)).toEqual(['bed', 'mind', 'money', 'others'])
  })
})
