import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriedLife, libraProposal } from '@/lib/engine/marriedLifeAnalysis'
import { analyzeMilanMarriedLife, moonEmotionalPair } from '@/lib/engine/milanMarriedLife'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral', extra: Partial<GrahaData> = {}): GrahaData {
  return { id, rashi, dignity, isCombust: false, name: id, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  gender?: 'male' | 'female' | 'other'
  name?: string
  d9Lagna?: Rashi
  d9?: GrahaData[]
  d10Lagna?: Rashi
  d10?: GrahaData[]
}): ChartOutput {
  return {
    meta: { gender: opts.gender ?? 'other', name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: {
      ...(opts.d9 ? { D9: opts.d9 } : {}),
      ...(opts.d10 ? { D10: opts.d10 } : {}),
    },
    vargaLagnas: {
      ...(opts.d9Lagna ? { D9: opts.d9Lagna } : {}),
      ...(opts.d10Lagna ? { D10: opts.d10Lagna } : {}),
    },
  } as ChartOutput
}

describe('libra proposal source', () => {
  it('reads the house where Libra falls', () => {
    expect(libraProposal(4).house).toBe(4)
    expect(libraProposal(4).relative).toMatch(/mother/i)
    expect(libraProposal(1).house).toBe(7)
    expect(libraProposal(1).relative).toMatch(/own choice/i)
    expect(libraProposal(2).house).toBe(6)
    expect(libraProposal(2).relative).toMatch(/uncle/i)
  })
})

describe('analyzeMarriedLife', () => {
  it('flags Venus–Mercury as friendship with a debt risk', () => {
    const result = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ve', 2), g('Me', 2), g('Ju', 9, 'own'), g('Ma', 1, 'own'), g('Mo', 4)],
    }))
    expect(result).not.toBeNull()
    expect(result!.combinations.some(c => c.id === 've-me')).toBe(true)
    expect(result!.proposal.house).toBe(7)
    expect(result!.dimensions.map(d => d.id)).toEqual(['flavor', 'passion', 'longevity', 'blessing', 'outcome'])
  })

  it('treats Jupiter in the 7th as trust, expense, and not a fidelity promise', () => {
    const result = analyzeMarriedLife(chart({
      asc: 1,
      gender: 'female',
      grahas: [g('Ju', 7, 'neutral'), g('Ve', 2, 'own'), g('Ma', 1, 'own'), g('Mo', 2)],
    }))
    const ids = result!.jupiter.map(n => n.id)
    expect(ids).toContain('ju-seventh-fidelity')
    expect(ids).toContain('ju-seventh-expense')
    expect(ids).toContain('ju-axis-cool')
    expect(result!.summary).toMatch(/mother-in-law/i)
  })

  it('warns on Mars with Rahu', () => {
    const result = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ma', 8), g('Ra', 8), g('Ve', 7), g('Ke', 2)],
    }))
    expect(result!.marsAndNodes.some(n => n.id === 'ma-ra')).toBe(true)
  })

  it('reads Venus in Cancer with the Moon in Libra, and Sun–Saturn–Ketu on the 7th lord', () => {
    const exchanged = analyzeMarriedLife(chart({
      asc: 4,
      gender: 'male',
      grahas: [g('Ve', 4), g('Mo', 7), g('Ju', 7, 'own'), g('Sa', 5), g('Su', 5), g('Ke', 5)],
    }))
    expect(exchanged!.combinations.find(c => c.id === 've-mo-exchange')?.detail).toMatch(/bath|tub/)
    expect(exchanged!.combinations.find(c => c.id === 've-mo-exchange')?.detail).toMatch(/marriage/)
    expect(exchanged!.jupiter.some(n => n.id === 'ju-fourth')).toBe(true)
    const speech = exchanged!.saturn.find(n => n.id === 'su-sa-ke')
    expect(speech?.title).toMatch(/7th lord/)
    expect(speech?.detail).toMatch(/money/)
    expect(speech?.detail).toMatch(/harsh/)

    const quiet = analyzeMarriedLife(chart({
      asc: 5,
      grahas: [g('Mo', 9), g('Ve', 2, 'own'), g('Ma', 1)],
    }))
    expect(quiet!.marsAndNodes.find(n => n.id === 'mo-sag-fifth')?.detail).toMatch(/reputation/)
  })

  it('times a Venus–Mercury worldly tie from D10', () => {
    const result = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ve', 2), g('Me', 2), g('Ju', 9, 'own')],
      d10Lagna: 1,
      d10: [g('Me', 6)],
    }))
    expect(result!.combinations.find(c => c.id === 've-me')?.detail).toMatch(/D10/)
    expect(result!.combinations.find(c => c.id === 've-me')?.detail).toMatch(/short/)
  })

  it('keeps the 9th lord in the 7th, and Venus–Mars–Sun, from becoming a single-combo verdict', () => {
    const hand = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ju', 7), g('Ve', 2, 'own'), g('Ma', 1, 'own')],
    }))
    const ninth = hand!.combinations.find(c => c.id === 'ninth-in-seventh')
    expect(ninth?.detail).toMatch(/hand/)
    expect(ninth?.detail).not.toMatch(/slap/)

    const alone = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ve', 7), g('Ma', 7), g('Su', 7)],
    }))
    expect(alone!.combinations.find(c => c.id === 've-ma-su')?.detail).toMatch(/other combinations agree/)
    expect(alone!.combinations.find(c => c.id === 've-ma-su')?.detail).not.toMatch(/physical domination/)

    const agreed = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Ve', 7), g('Ma', 7), g('Su', 7), g('Ra', 12), g('Mo', 5)],
    }))
    expect(agreed!.combinations.find(c => c.id === 've-ma-su')?.detail).toMatch(/physical domination/)
    expect(agreed!.ethics).toMatch(/single combination/)
  })

  it('raises Venus, Mars, the 7th lord, and Jupiter when the Navamsha is strong', () => {
    const grahas = [
      g('Ve', 5, 'neutral', { isCombust: true }),
      g('Ma', 7, 'neutral'),
      g('Ju', 1, 'neutral'),
      g('Su', 5, 'neutral'),
    ]
    const birth = analyzeMarriedLife(chart({ asc: 6, gender: 'male', grahas }))!
    const both = analyzeMarriedLife(chart({
      asc: 6,
      gender: 'male',
      grahas,
      d9Lagna: 5,
      d9: [
        g('Ve', 12, 'exalted'),
        g('Ma', 1, 'own'),
        g('Ju', 4, 'exalted'),
        g('Su', 1, 'exalted'),
      ],
    }))!
    const score = (reading: NonNullable<ReturnType<typeof analyzeMarriedLife>>, id: string) =>
      reading.dimensions.find(d => d.id === id)!.score
    expect(score(both, 'flavor')).toBe(score(birth, 'flavor') + 2)
    expect(score(both, 'passion')).toBe(score(birth, 'passion') + 2)
    expect(score(both, 'longevity')).toBe(score(birth, 'longevity') + 2)
    expect(score(both, 'blessing')).toBe(score(birth, 'blessing') + 2)
    const flavor = both.dimensions.find(d => d.id === 'flavor')!.summary
    expect(flavor).toMatch(/combust/)
    expect(flavor).toMatch(/Navamsha/)
    expect(flavor).toMatch(/exalted, at its strongest/)
    expect(flavor).toMatch(/deeper chart holds it/)
    expect(both.dimensions.find(d => d.id === 'blessing')!.summary).toMatch(/Navamsha Jupiter is in Cancer, exalted, at its strongest/)
    expect(both.dimensions.find(d => d.id === 'passion')!.summary).toMatch(/Navamsha Mars is in Aries, in its own sign/)
    expect(both.dimensions.find(d => d.id === 'longevity')!.summary).toMatch(/Navamsha/)
    expect(both.dimensions.find(d => d.id === 'outcome')!.summary).toMatch(/That lord is exalted/)
  })

  it('does not keep a strong birth-chart Venus when the Navamsha is weak', () => {
    const grahas = [g('Ve', 12, 'exalted'), g('Ju', 4, 'exalted'), g('Ma', 1, 'own')]
    const birth = analyzeMarriedLife(chart({ asc: 1, grahas }))!
    const fallen = analyzeMarriedLife(chart({
      asc: 1,
      grahas,
      d9Lagna: 1,
      d9: [g('Ve', 6, 'debilitated'), g('Ju', 10, 'debilitated'), g('Ma', 7, 'debilitated')],
    }))!
    expect(fallen.dimensions.find(d => d.id === 'flavor')!.score).toBeLessThan(birth.dimensions.find(d => d.id === 'flavor')!.score)
    expect(fallen.dimensions.find(d => d.id === 'blessing')!.score).toBeLessThan(birth.dimensions.find(d => d.id === 'blessing')!.score)
    expect(fallen.dimensions.find(d => d.id === 'flavor')!.summary).toMatch(/does not hold underneath/)
  })

  it('reads Saturn in the 2nd as a speech warning', () => {
    const result = analyzeMarriedLife(chart({
      asc: 1,
      grahas: [g('Sa', 2), g('Ve', 7, 'own'), g('Mo', 4)],
    }))
    expect(result!.saturn.some(n => n.id === 'sa-second')).toBe(true)
  })
})

describe('moon and milan relationship layer', () => {
  it('describes Capricorn–Scorpio and Gemini–Mars mismatches', () => {
    expect(moonEmotionalPair(10, 8).title).toMatch(/Capricorn and Scorpio/)
    expect(moonEmotionalPair(3, 2).tone).toBe('supportive')
    expect(moonEmotionalPair(3, 1).tone).toBe('caution')
    expect(moonEmotionalPair(3, 12).detail).toMatch(/writing/)
    const withSaturn = moonEmotionalPair(3, 2, true)
    expect(withSaturn.detail).toMatch(/old arguments/)
  })

  it('reads the bride 10th for the mother-in-law and both 4th houses', () => {
    const bride = chart({
      asc: 1,
      gender: 'female',
      name: 'Ananya',
      grahas: [g('Ma', 10), g('Mo', 10), g('Ve', 2, 'own'), g('Ju', 5, 'own')],
    })
    const groom = chart({
      asc: 2,
      gender: 'male',
      name: 'Arjun',
      d9Lagna: 7,
      grahas: [g('Mo', 8), g('Ve', 7), g('Ma', 1, 'own'), g('Ju', 9, 'exalted')],
    })
    const pair = analyzeMilanMarriedLife(bride, groom)
    expect(pair).not.toBeNull()
    expect(pair!.moon.title).toMatch(/Capricorn and Scorpio|Square|10/)
    expect(pair!.tenth.reading).toMatch(/mother-in-law/i)
    expect(pair!.findings.some(f => f.id === 'home')).toBe(true)
    expect(pair!.dimensions).toHaveLength(5)
    expect(pair!.summary.length).toBeGreaterThan(40)
  })
})
