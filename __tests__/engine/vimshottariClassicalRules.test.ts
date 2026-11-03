// ─────────────────────────────────────────────────────────────
//  Vimshottari classroom rules — rajayoga antar, trishadaya, viparita …
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { DashaNode, GrahaData, Rashi } from '@/types/astrology'
import {
  collectClassicalDashaRules,
  moonBrightness,
  type ClassicalRuleInput,
} from '@/lib/engine/dasha/vimshottariClassicalRules'
import { ageAtMahaStart, analyzeVimshottariPeriod, mahaProgressAt } from '@/lib/engine/dasha/vimshottariAnalysis'

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

function run(partial: Partial<ClassicalRuleInput> & Pick<ClassicalRuleInput, 'ascRashi' | 'grahas' | 'mahaLord'>) {
  return collectClassicalDashaRules({
    antarLord: null,
    mahaSequenceIndex: -1,
    antarIndexInMaha: -1,
    ...partial,
  })
}

const ids = (hits: ReturnType<typeof run>) => hits.map(h => h.flag.id)

describe('collectClassicalDashaRules', () => {
  it('flags a rajayoga antar when kendra and trikona lords are conjoined (Pisces Ma + Ju)', () => {
    const grahas = [
      stubGraha({ id: 'Ma', rashi: 4 }),
      stubGraha({ id: 'Ju', rashi: 4 }),
    ]
    const hits = run({ ascRashi: 12, grahas, mahaLord: 'Ma', antarLord: 'Ju' })
    expect(ids(hits)).toContain('cl-rajayoga-antar')
    expect(ids(hits)).toContain('cl-lagna-pair-Ma-Ju')
    expect(hits.find(h => h.flag.id === 'cl-rajayoga-antar')!.weight).toBeGreaterThan(0)
  })

  it('does not flag rajayoga when the lords are unconnected', () => {
    const grahas = [
      stubGraha({ id: 'Ma', rashi: 4 }),
      stubGraha({ id: 'Ju', rashi: 6 }),
    ]
    expect(ids(run({ ascRashi: 12, grahas, mahaLord: 'Ma', antarLord: 'Ju' }))).not.toContain('cl-rajayoga-antar')
  })

  it('applies kendradhipati dosha to Jupiter for Gemini lagna', () => {
    const grahas = [stubGraha({ id: 'Ju', rashi: 5 })]
    expect(ids(run({ ascRashi: 3, grahas, mahaLord: 'Ju' }))).toContain('cl-kendradhipati')
  })

  it('treats a malefic in 3/6/11 as supportive', () => {
    const grahas = [stubGraha({ id: 'Sa', rashi: 3 })] // Aries lagna, Saturn in 3rd
    const hit = run({ ascRashi: 1, grahas, mahaLord: 'Sa' }).find(h => h.flag.id === 'cl-malefic-upachaya-MD')
    expect(hit?.flag.tone).toBe('supportive')
  })

  it('flags 3/6/11 lordship without trikona as caution', () => {
    const grahas = [stubGraha({ id: 'Ma', rashi: 10 })] // Gemini lagna: Mars owns 6 and 11
    expect(ids(run({ ascRashi: 3, grahas, mahaLord: 'Ma' }))).toContain('cl-trishadaya-MD')
  })

  it('reads a debilitated lord in a dusthana as viparita support', () => {
    const grahas = [stubGraha({ id: 'Mo', rashi: 8, dignity: 'debilitated' })] // Gemini lagna: Scorpio is the 6th
    expect(ids(run({ ascRashi: 3, grahas, mahaLord: 'Mo' }))).toContain('cl-viparita-MD')
  })

  it('distinguishes the 1–7 axis exceptions', () => {
    const fine = [stubGraha({ id: 'Ma', rashi: 1 }), stubGraha({ id: 'Mo', rashi: 7 })]
    const rough = [stubGraha({ id: 'Ma', rashi: 1 }), stubGraha({ id: 'Ve', rashi: 7 })]
    expect(run({ ascRashi: 1, grahas: fine, mahaLord: 'Ma' }).find(h => h.flag.id === 'cl-axis-1-7-MD')?.flag.tone).toBe('supportive')
    expect(run({ ascRashi: 1, grahas: rough, mahaLord: 'Ma' }).find(h => h.flag.id === 'cl-axis-1-7-MD')?.flag.tone).toBe('caution')
  })

  it('cautions Rahu alone in the 5th without fatalistic wording', () => {
    const grahas = [stubGraha({ id: 'Ra', rashi: 5 })]
    const hit = run({ ascRashi: 1, grahas, mahaLord: 'Ra' }).find(h => h.flag.id === 'cl-rahu-5th-alone')
    expect(hit?.flag.tone).toBe('caution')
    expect(hit?.flag.detail.toLowerCase()).not.toMatch(/miscarriage|\bdeath\b/)
  })

  it('reads Moon paksha bala from Sun–Moon elongation', () => {
    const dark = [stubGraha({ id: 'Su', rashi: 4, lonSidereal: 100 }), stubGraha({ id: 'Mo', rashi: 4, lonSidereal: 110 })]
    const bright = [stubGraha({ id: 'Su', rashi: 4, lonSidereal: 100 }), stubGraha({ id: 'Mo', rashi: 10, lonSidereal: 280 })]
    expect(moonBrightness(dark)).toBeCloseTo(10)
    expect(ids(run({ ascRashi: 1, grahas: dark, mahaLord: 'Mo' }))).toContain('cl-moon-dark')
    expect(ids(run({ ascRashi: 1, grahas: bright, mahaLord: 'Mo' }))).toContain('cl-moon-bright')
  })

  it('flags Saturn as the 4th mahadasha from birth', () => {
    const grahas = [stubGraha({ id: 'Sa', rashi: 7 })]
    expect(ids(run({ ascRashi: 1, grahas, mahaLord: 'Sa', mahaSequenceIndex: 3 }))).toContain('cl-birth-sequence')
    expect(ids(run({ ascRashi: 1, grahas, mahaLord: 'Sa', mahaSequenceIndex: 2 }))).not.toContain('cl-birth-sequence')
  })

  it('adds a sandhi note naming the next mahadasha in the last antar', () => {
    const grahas = [stubGraha({ id: 'Ve', rashi: 2 }), stubGraha({ id: 'Ke', rashi: 8 })]
    const hit = run({ ascRashi: 1, grahas, mahaLord: 'Ve', antarLord: 'Ke', antarIndexInMaha: 8 }).find(h => h.flag.id === 'cl-sandhi')
    expect(hit?.flag.detail).toContain('Sun')
    expect(hit?.weight).toBe(0)
  })

  it('never uses death wording in any rule text', () => {
    const grahas: GrahaData[] = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const).map((id, i) =>
      stubGraha({ id, rashi: (((i * 5) % 12) + 1) as Rashi, dignity: i % 2 ? 'debilitated' : 'exalted' }))
    for (let asc = 1; asc <= 12; asc++) {
      for (const md of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']) {
        for (const h of run({ ascRashi: asc as Rashi, grahas, mahaLord: md, antarLord: 'Ju', mahaSequenceIndex: 3, antarIndexInMaha: 8 })) {
          expect(h.flag.detail.toLowerCase()).not.toMatch(/\bdeath\b|\bdie\b|will die/)
        }
      }
    }
  })
})

describe('analyzeVimshottariPeriod + classical rules', () => {
  it('merges classical flags and keeps the mix at 100', () => {
    // Mars birth dasha → Ra → Ju → Sa (current): Saturn is the 4th mahadasha
    const lords = ['Ma', 'Ra', 'Ju', 'Sa']
    const nodes: DashaNode[] = lords.map(l => mahaNode(l, {
      isCurrent: l === 'Sa',
      children: l === 'Sa' ? [antar('Sa', true)] : [],
    }))
    const grahas = [
      stubGraha({ id: 'Sa', rashi: 7 }),
      stubGraha({ id: 'Su', rashi: 1 }),
      stubGraha({ id: 'Mo', rashi: 4 }),
    ]
    const a = analyzeVimshottariPeriod({ nodes, ascRashi: 1, grahas })!
    expect(a.flags.map(f => f.id)).toContain('cl-birth-sequence')
    expect(a.favorableShare + a.challengingShare + a.neutralShare).toBe(100)
  })
})

describe('planet-specific placement rules', () => {
  it('Sun: clean kendra Sun gives fame; with Rahu in a dusthana is a hard period', () => {
    expect(ids(run({ ascRashi: 1, grahas: [stubGraha({ id: 'Su', rashi: 10 })], mahaLord: 'Su' }))).toContain('cl-sun-fame')
    const hard = run({ ascRashi: 1, grahas: [stubGraha({ id: 'Su', rashi: 8 }), stubGraha({ id: 'Ra', rashi: 8 })], mahaLord: 'Su' })
    const h = hard.find(x => x.flag.id === 'cl-sun-dusthana')!
    expect(h.flag.label).toMatch(/node/)
    expect(h.weight).toBeLessThan(-5)
    expect(ids(hard)).not.toContain('cl-sun-fame')
  })

  it('Sun: joins the 5th and 2nd lords', () => {
    // Aries lagna: 5th lord Su itself, so use Taurus lagna: 5th = Virgo (Me), 2nd = Gemini (Me)
    const hits = run({ ascRashi: 2, grahas: [stubGraha({ id: 'Su', rashi: 4 }), stubGraha({ id: 'Me', rashi: 4 })], mahaLord: 'Su' })
    expect(ids(hits)).toEqual(expect.arrayContaining(['cl-sun-5th-lord', 'cl-sun-2nd-lord']))
  })

  it('Moon: exalted, enemy-sign bondage, and wealth with the 4th/9th/10th lord', () => {
    expect(ids(run({ ascRashi: 1, grahas: [stubGraha({ id: 'Mo', rashi: 2, dignity: 'exalted' })], mahaLord: 'Mo' }))).toContain('cl-moon-exalted')
    expect(ids(run({ ascRashi: 1, grahas: [stubGraha({ id: 'Mo', rashi: 8, dignity: 'enemy' })], mahaLord: 'Mo' }))).toContain('cl-moon-bondage')
    // Aries lagna: Moon in 4th (Cancer) with Saturn (10th lord)
    const w = run({ ascRashi: 1, grahas: [stubGraha({ id: 'Mo', rashi: 4 }), stubGraha({ id: 'Sa', rashi: 4 })], mahaLord: 'Mo' })
    expect(ids(w)).toContain('cl-moon-wealth-home')
  })

  it('Moon: deep debilitation in the 8th is cautioned without fatal wording', () => {
    // Gemini lagna → Capricorn is 8th; Scorpio debilitation needs Scorpio in 8th → Aries lagna
    const grahas = [
      stubGraha({ id: 'Su', rashi: 8, lonSidereal: 212 }),
      stubGraha({ id: 'Mo', rashi: 8, degree: 3, lonSidereal: 213, dignity: 'debilitated' }),
    ]
    const h = run({ ascRashi: 1, grahas, mahaLord: 'Mo' }).find(x => x.flag.id === 'cl-moon-deep-8')
    expect(h?.flag.tone).toBe('caution')
    expect(h?.flag.detail.toLowerCase()).not.toMatch(/suicid|death|die/)
  })

  it('Moon: 6+ Ashtakavarga bindus promise money', () => {
    const bindus = Array(12).fill(3); bindus[3] = 7
    const hits = run({
      ascRashi: 1,
      grahas: [stubGraha({ id: 'Mo', rashi: 4 })],
      mahaLord: 'Mo',
      ashtakavarga: { bav: { Mo: { bindus } } } as never,
    })
    expect(ids(hits)).toContain('cl-moon-bav-high')
  })

  it('Mars: house-by-house reading', () => {
    expect(run({ ascRashi: 1, grahas: [stubGraha({ id: 'Ma', rashi: 10 })], mahaLord: 'Ma' }).find(h => h.flag.id === 'cl-mars-house-10')?.flag.tone).toBe('supportive')
    expect(ids(run({ ascRashi: 1, grahas: [stubGraha({ id: 'Ma', rashi: 4 })], mahaLord: 'Ma' }))).toContain('cl-mars-house-4')
  })

  it('Mars: exalted D1 / debilitated D9 names siblings', () => {
    const hits = run({
      ascRashi: 1,
      grahas: [stubGraha({ id: 'Ma', rashi: 10, dignity: 'exalted' })],
      navamshaGrahas: [stubGraha({ id: 'Ma', rashi: 4, dignity: 'debilitated' })],
      mahaLord: 'Ma',
    })
    expect(hits.find(h => h.flag.id === 'cl-d1-d9-fall-MD')?.flag.detail).toMatch(/brother/)
  })

  it('Saturn: lists 3rd / 7th / 10th aspect houses', () => {
    // Taurus lagna, Saturn in Aquarius = 10th → aspects 12, 4, 7
    const d = run({ ascRashi: 2, grahas: [stubGraha({ id: 'Sa', rashi: 11 })], mahaLord: 'Sa' }).find(h => h.flag.id === 'cl-saturn-aspects-MD')!.flag.detail
    expect(d).toContain('house 12')
    expect(d).toContain('house 4')
    expect(d).toContain('house 7')
  })

  it('Rahu and Ketu phases follow mahadasha progress', () => {
    const ra = (p: number) => run({ ascRashi: 1, grahas: [stubGraha({ id: 'Ra', rashi: 3 })], mahaLord: 'Ra', mahaProgress: p }).find(h => h.flag.id === 'cl-rahu-phase')!
    expect(ra(0.1).flag.label).toMatch(/start/)
    expect(ra(0.5).flag.tone).toBe('supportive')
    expect(ra(0.9).flag.detail).toMatch(/grandparent/)
    const ke = run({ ascRashi: 1, grahas: [stubGraha({ id: 'Ke', rashi: 9 })], mahaLord: 'Ke', mahaProgress: 0.5 }).find(h => h.flag.id === 'cl-ketu-phase')!
    expect(ke.flag.label).toMatch(/middle/)
  })

  it('Ketu combinations and best age', () => {
    const grahas = [stubGraha({ id: 'Ke', rashi: 5 }), stubGraha({ id: 'Ju', rashi: 5 }), stubGraha({ id: 'Mo', rashi: 5 })]
    const hits = run({ ascRashi: 1, grahas, mahaLord: 'Ke', ageAtMahaStartYears: 25 })
    expect(ids(hits)).toEqual(expect.arrayContaining(['cl-ketu-ju-mo', 'cl-ketu-best-age']))
  })

  it('Venus and Mercury lagna notes', () => {
    expect(ids(run({ ascRashi: 3, grahas: [stubGraha({ id: 'Ve', rashi: 7 })], mahaLord: 'Ve' }))).toContain('cl-lagna-lord-Ve')
    expect(run({ ascRashi: 2, grahas: [stubGraha({ id: 'Me', rashi: 6 })], mahaLord: 'Me' }).find(h => h.flag.id === 'cl-lagna-lord-Me')?.flag.tone).toBe('supportive')
  })

  it('Shadbala above 6 rupas', () => {
    const hits = run({
      ascRashi: 1,
      grahas: [stubGraha({ id: 'Ju', rashi: 9, dignity: 'own' })],
      mahaLord: 'Ju',
      shadbala: { planets: { Ju: { totalShash: 420, total: 7 } } } as never,
    })
    expect(hits.find(h => h.flag.id === 'cl-shadbala-6-MD')?.weight).toBe(5)
  })
})

describe('dasha timing helpers', () => {
  it('computes progress and age at mahadasha start', () => {
    const birth: DashaNode = { ...mahaNode('Ma'), start: new Date('2000-01-01'), end: new Date('2005-01-01') }
    const ra: DashaNode = { ...mahaNode('Ra'), start: new Date('2005-01-01'), end: new Date('2023-01-01') }
    expect(mahaProgressAt(ra, new Date('2014-01-01').getTime())).toBeCloseTo(0.5, 1)
    expect(ageAtMahaStart([birth, ra], ra)).toBeCloseTo(5, 1)
  })
})
