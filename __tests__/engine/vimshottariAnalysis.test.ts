// ─────────────────────────────────────────────────────────────
//  Vimshottari analysis — Chidra / Rikta / Yogakaraka / relation
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { DashaNode, GrahaData, Rashi } from '@/types/astrology'
import {
  antardashaIndexInMaha,
  arohiniKindForGraha,
  collectLaghuParashariFlags,
  housesRuledBy,
  isChidraAntardasha,
  isProblematicSequenceIndex,
  mahadashaSequenceIndex,
  relationFromSignCount,
  signCount,
  analyzeVimshottariPeriod,
} from '@/lib/engine/dasha/vimshottariAnalysis'
import { getLagnaDashaProfile, getYogakaraka, isYogakarakaLord } from '@/lib/engine/dasha/yogakaraka'

function stubGraha(partial: Partial<GrahaData> & { id: string; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + (partial.degree ?? 15),
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: '',
    degree: 15,
    totalDegree: (partial.rashi - 1) * 30 + 15,
    nakshatraIndex: 0,
    nakshatraName: '',
    pada: 1,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi: partial.rashi,
      nakshatraIndex: 0,
      degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi: partial.rashi,
      degreeInSign: 15,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi: partial.rashi,
      degreeInSign: 15,
      mrityuDegree: 0,
      distanceFromMrityu: 15,
      interpretation: null,
      remedy: null,
    },
    ...partial,
  }
}

function mahaNode(lord: string, opts: { isCurrent?: boolean; children?: DashaNode[] } = {}): DashaNode {
  const start = new Date('2000-01-01')
  const end = new Date('2010-01-01')
  return {
    lord,
    start,
    end,
    durationMs: end.getTime() - start.getTime(),
    level: 1,
    isCurrent: opts.isCurrent ?? false,
    children: opts.children ?? [],
  }
}

function antar(lord: string, isCurrent = false): DashaNode {
  const start = new Date('2000-01-01')
  const end = new Date('2001-06-01')
  return {
    lord,
    start,
    end,
    durationMs: end.getTime() - start.getTime(),
    level: 2,
    isCurrent,
    children: [],
  }
}

describe('Yogakaraka by lagna', () => {
  it('maps classical single yogakarakas', () => {
    expect(getYogakaraka(2).lords).toEqual(['Sa'])
    expect(getYogakaraka(7).lords).toEqual(['Sa'])
    expect(getYogakaraka(10).lords).toEqual(['Ve'])
    expect(getYogakaraka(11).lords).toEqual(['Ve'])
    expect(getYogakaraka(4).lords).toEqual(['Ma'])
    expect(getYogakaraka(5).lords).toEqual(['Ma'])
    expect(getYogakaraka(1).lords).toEqual([])
    expect(isYogakarakaLord(2, 'Sa')).toBe(true)
    expect(isYogakarakaLord(2, 'Ve')).toBe(false)
  })

  it('returns lagna dasha profile with maraka and special notes', () => {
    const p = getLagnaDashaProfile(4)
    expect(p.yogakaraka.lords).toEqual(['Ma'])
    expect(p.marakaNote.toLowerCase()).toContain('hardship')
    expect(p.marakaNote.toLowerCase()).not.toMatch(/\bdeath\b/)
    expect(p.specialNote).toMatch(/Cancer/)
  })
})

describe('housesRuledBy', () => {
  it('returns bhavas owned from lagna', () => {
    // Cancer lagna: Sa lords 7 (Cap) and 8 (Aqu)
    expect(housesRuledBy(4, 'Sa')).toEqual([7, 8])
    // Taurus lagna: Sa lords 9 and 10
    expect(housesRuledBy(2, 'Sa')).toEqual([9, 10])
    // Aries: Su lords 5 only
    expect(housesRuledBy(1, 'Su')).toEqual([5])
  })
})

describe('Chidra antardasha', () => {
  it('flags first antar (MD lord) as beginning Chidra', () => {
    expect(antardashaIndexInMaha('Sa', 'Sa')).toBe(0)
    expect(isChidraAntardasha('Sa', 'Sa')).toEqual({ isChidra: true, phase: 'beginning' })
  })

  it('flags last antar as ending Chidra', () => {
    // Sa sequence: Sa Me Ke Ve Su Mo Ma Ra Ju — last is Ju
    expect(antardashaIndexInMaha('Sa', 'Ju')).toBe(8)
    expect(isChidraAntardasha('Sa', 'Ju')).toEqual({ isChidra: true, phase: 'end' })
  })

  it('does not flag middle antars', () => {
    expect(isChidraAntardasha('Sa', 'Me').isChidra).toBe(false)
  })
})

describe('Sequence 3/5/7', () => {
  it('marks indices 2,4,6', () => {
    expect(isProblematicSequenceIndex(0)).toBe(false)
    expect(isProblematicSequenceIndex(2)).toBe(true)
    expect(isProblematicSequenceIndex(4)).toBe(true)
    expect(isProblematicSequenceIndex(6)).toBe(true)
  })

  it('finds current mahadasha index in node list', () => {
    const nodes = [
      mahaNode('Me', { isCurrent: false }),
      mahaNode('Ke', { isCurrent: false }),
      mahaNode('Ve', { isCurrent: true }),
    ]
    expect(mahadashaSequenceIndex(nodes, 'Ve')).toBe(2)
  })
})

describe('MD–AD relation', () => {
  it('computes sign counts and labels', () => {
    expect(signCount(1, 1)).toBe(1)
    expect(signCount(1, 2)).toBe(2)
    expect(signCount(1, 12)).toBe(12)
    expect(relationFromSignCount(6).kind).toBe('shadashtaka')
    expect(relationFromSignCount(2).kind).toBe('dwirdwadasa')
    expect(relationFromSignCount(5).tone).toBe('supportive')
  })
})

describe('Arohini / Avarohini', () => {
  it('flags exaltation-sign approach as Arohini', () => {
    // Sun exalted in Aries, peak 10°
    const g = stubGraha({ id: 'Su', rashi: 1, degree: 8, dignity: 'exalted' })
    expect(arohiniKindForGraha(g)).toBe('arohini')
  })

  it('flags debilitation-sign approach as Avarohini', () => {
    // Sun debilitated in Libra, peak same degree-in-sign (10°)
    const g = stubGraha({ id: 'Su', rashi: 7, degree: 9, dignity: 'debilitated' })
    expect(arohiniKindForGraha(g)).toBe('avarohini')
  })

  it('returns null outside exalt/debil signs', () => {
    const g = stubGraha({ id: 'Su', rashi: 5, degree: 10, dignity: 'own' })
    expect(arohiniKindForGraha(g)).toBeNull()
  })
})

describe('Laghu Parashari flags', () => {
  it('flags 10th lord in 10th when MD is that lord', () => {
    // Aries lagna: 10th = Capricorn, lord Sa. Sa in Cap = H10.
    const grahas = [stubGraha({ id: 'Sa', rashi: 10, dignity: 'own' })]
    const flags = collectLaghuParashariFlags(1, grahas, 'Sa', 'Me')
    expect(flags.some(f => f.id === 'lp-10in10')).toBe(true)
  })

  it('flags 5th–9th lord conjunction when period involves one', () => {
    // Cancer lagna: 5th = Scorpio (Ma), 9th = Pisces (Ju). Both in same sign.
    const grahas = [
      stubGraha({ id: 'Ma', rashi: 1, dignity: 'own' }),
      stubGraha({ id: 'Ju', rashi: 1, dignity: 'friend' }),
    ]
    const flags = collectLaghuParashariFlags(4, grahas, 'Ma', 'Ju')
    expect(flags.some(f => f.id === 'lp-5-9')).toBe(true)
  })
})

describe('analyzeVimshottariPeriod', () => {
  it('returns Chidra + Yogakaraka flags for Cancer lagna Saturn–Saturn', () => {
    const grahas = [
      stubGraha({ id: 'Sa', rashi: 2, dignity: 'friend' }), // 11th from Cancer
      stubGraha({ id: 'Su', rashi: 3, dignity: 'neutral' }),
    ]
    const nodes = [
      mahaNode('Sa', {
        isCurrent: true,
        children: [antar('Sa', true)],
      }),
    ]
    const result = analyzeVimshottariPeriod({
      nodes,
      ascRashi: 4, // Cancer — Sa is maraka (7+8), not yogakaraka
      grahas,
      ashtakavarga: {
        bav: {
          Sa: { planet: 'Sa', bindus: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], total: 36 },
        },
        sav: Array(12).fill(28),
        savTotal: 336,
      },
    })
    expect(result).not.toBeNull()
    expect(result!.flags.some(f => f.id === 'chidra')).toBe(true)
    expect(result!.flags.some(f => f.id === 'rikta')).toBe(true)
    expect(result!.flags.some(f => f.id === 'maraka')).toBe(true)
    expect(result!.mahadasha.housesRuled).toEqual([7, 8])
    expect(result!.lagnaSpecialNote).toMatch(/Cancer/)
    // Maraka copy must not say death
    const maraka = result!.flags.find(f => f.id === 'maraka')!
    expect(maraka.detail.toLowerCase()).not.toMatch(/\bdeath\b/)
    expect(maraka.detail.toLowerCase()).toContain('hardship')
    expect(result!.favorableShare + result!.challengingShare + result!.neutralShare).toBe(100)
    expect(result!.favorableShare).toBeLessThan(100)
    expect(result!.challengingShare).toBeGreaterThan(0)
    // Crisp insight — plain language, not jargon pile
    expect(result!.insight.headline.length).toBeGreaterThan(10)
    expect(result!.insight.bullets.length).toBeGreaterThan(0)
    expect(result!.insight.headline.toLowerCase()).not.toMatch(/arishta affliction/)
  })

  it('tags Taurus Saturn mahadasha as Yogakaraka', () => {
    const grahas = [stubGraha({ id: 'Sa', rashi: 10, dignity: 'own' })]
    const nodes = [mahaNode('Sa', { isCurrent: true, children: [antar('Me', true)] })]
    const result = analyzeVimshottariPeriod({
      nodes,
      ascRashi: 2,
      grahas,
    })
    expect(result!.mahadasha.isYogakaraka).toBe(true)
    expect(result!.flags.some(f => f.id === 'yogakaraka')).toBe(true)
  })

  it('adds Arohini flag for exalted Sun mahadasha', () => {
    const grahas = [stubGraha({ id: 'Su', rashi: 1, degree: 8, dignity: 'exalted' })]
    const nodes = [mahaNode('Su', { isCurrent: true, children: [antar('Mo', true)] })]
    const result = analyzeVimshottariPeriod({
      nodes,
      ascRashi: 1,
      grahas,
    })
    expect(result!.mahadasha.arohiniKind).toBe('arohini')
    expect(result!.flags.some(f => f.id === 'arohini')).toBe(true)
  })

  it('keeps mix shares summing to 100 even with stacked boosts', () => {
    // Strong chart that used to overflow fav+chal past 100
    const grahas = [
      stubGraha({ id: 'Me', rashi: 1, degree: 10, dignity: 'friend' }), // kendra from Cap? Aries lagna H1
      stubGraha({ id: 'Mo', rashi: 5, degree: 3, dignity: 'debilitated' }), // Scorpio = debil for Moon if rashi 8
    ]
    // Moon in Scorpio for avarohini + arishta
    grahas[1] = stubGraha({ id: 'Mo', rashi: 8, degree: 3, dignity: 'debilitated' })
    const nodes = [mahaNode('Me', { isCurrent: true, children: [antar('Mo', true)] })]
    const result = analyzeVimshottariPeriod({
      nodes,
      ascRashi: 1,
      grahas,
      shadbala: {
        planets: {
          Me: { ratio: 1.4, isStrong: true, qualityBand: 'strong' },
        },
      } as never,
      ashtakavarga: {
        bav: {
          Me: { planet: 'Me', bindus: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], total: 72 },
          Mo: { planet: 'Mo', bindus: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], total: 24 },
        },
        sav: Array(12).fill(30),
        savTotal: 360,
      },
    })
    expect(result!.favorableShare + result!.challengingShare + result!.neutralShare).toBe(100)
    expect(result!.insight.bullets.some(b => /logic vs emotion|overnight/i.test(b))).toBe(true)
  })
})
