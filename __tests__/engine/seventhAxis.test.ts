import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMatchMaking } from '@/lib/engine/matchMaking'
import { analyzeSeventhAxis, seventhAxisMatch } from '@/lib/engine/seventhAxis'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  nakshatraIndex?: number,
): GrahaData {
  return { id, rashi, dignity, isCombust: false, name: id, nakshatraIndex } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  name?: string
}): ChartOutput {
  return {
    meta: { name: opts.name ?? 'Test', gender: 'other' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: {},
    vargaLagnas: {},
  } as ChartOutput
}

describe('seventh axis', () => {
  it('puts Libra in the 6th for Taurus and Aries in the 12th', () => {
    const result = analyzeSeventhAxis(chart({
      asc: 2,
      grahas: [g('Ma', 7), g('Ve', 2, 'own')],
    }))
    expect(result).not.toBeNull()
    expect(result!.libra.house).toBe(6)
    expect(result!.libra.detail).toMatch(/disease, debt, and enemies/i)
    expect(result!.aries.house).toBe(12)
    expect(result!.aries.detail).toMatch(/isolation/i)
    expect(result!.notes.some(n => n.id === 'libra-Ma')).toBe(true)
    expect(result!.matchHint).toMatch(/6th/i)
  })

  it('reads an empty 7th as a lighter marriage focus', () => {
    const result = analyzeSeventhAxis(chart({
      asc: 1,
      grahas: [g('Ve', 2, 'own'), g('Ju', 9, 'own')],
    }))
    expect(result!.libra.house).toBe(7)
    expect(result!.perception).toMatch(/empty 7th/i)
    expect(result!.notes.some(n => n.id === 'libra-empty')).toBe(true)
  })

  it('tells Gemini to ask a benefic spouse', () => {
    const result = analyzeSeventhAxis(chart({
      asc: 3,
      grahas: [g('Ju', 9, 'own')],
    }))
    expect(result!.pair.seventhName).toBe('Sagittarius')
    expect(result!.pair.teaches).toMatch(/ask the spouse/i)
    expect(result!.matchHint).toMatch(/Jupiter/i)
  })

  it('flags Virgo and Pisces when both signs are pressed', () => {
    const result = analyzeSeventhAxis(chart({
      asc: 6,
      grahas: [g('Sa', 6), g('Ma', 12), g('Ve', 6, 'debilitated')],
    }))
    expect(result!.pair.friction).toMatch(/Venus/i)
    expect(result!.notes.some(n => n.id === 'virgo-pisces-pressure')).toBe(true)
  })

  it('flags a Saturn debt nakshatra and Mercury in the 8th', () => {
    const result = analyzeSeventhAxis(chart({
      asc: 1,
      grahas: [g('Sa', 4, 'neutral', 7), g('Me', 8)],
    }))
    expect(result!.notes.some(n => n.id === 'rin-nakshatra')).toBe(true)
    expect(result!.notes.some(n => n.id === 'mercury-eighth')).toBe(true)
  })

  it('refuses Sagittarius when the partner’s Mercury is with Rahu under Saturn', () => {
    const sag = chart({
      asc: 9,
      name: 'A',
      grahas: [g('Ju', 9, 'own')],
    })
    const other = chart({
      asc: 2,
      name: 'B',
      grahas: [g('Me', 5), g('Ra', 5), g('Sa', 11)],
    })
    const match = seventhAxisMatch(sag, other)
    expect(match!.tone).toBe('caution')
    expect(match!.detail).toMatch(/Refuse the match/i)
  })

  it('weighs Jupiter for a Gemini lagna match', () => {
    const gemini = chart({
      asc: 3,
      name: 'A',
      grahas: [g('Me', 3, 'own')],
    })
    const partner = chart({
      asc: 1,
      name: 'B',
      grahas: [g('Ju', 10, 'debilitated')],
    })
    const result = analyzeMatchMaking(gemini, partner)
    const axis = result!.steps.find(s => s.id === 'axis')
    expect(axis?.tone).toBe('caution')
    expect(axis?.detail).toMatch(/Jupiter is 1\/5/)
  })
})
