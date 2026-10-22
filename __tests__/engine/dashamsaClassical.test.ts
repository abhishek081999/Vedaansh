// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dashamsaClassical.test.ts
//  BPHS / Phaladeepika Dashamsha reading
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeDashamsa } from '@/lib/engine/dashamsaAnalysis'
import {
  aspectHouses,
  aspectsSign,
  buildDashamsaClassical,
  mahatGrade,
  signModality,
} from '@/lib/engine/dashamsaClassical'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity): GrahaData {
  return { id, rashi, degree: 10, dignity, name: id } as GrahaData
}

const PLACED: { id: GrahaId; rashi: Rashi; dignity: Dignity }[] = [
  { id: 'Su', rashi: 10, dignity: 'enemy' },
  { id: 'Mo', rashi: 4, dignity: 'own' },
  { id: 'Ma', rashi: 1, dignity: 'own' },
  { id: 'Me', rashi: 3, dignity: 'own' },
  { id: 'Ju', rashi: 1, dignity: 'friend' },
  { id: 'Ve', rashi: 7, dignity: 'own' },
  { id: 'Sa', rashi: 1, dignity: 'debilitated' },
  { id: 'Ra', rashi: 5, dignity: 'neutral' },
  { id: 'Ke', rashi: 11, dignity: 'neutral' },
]

function chart(opts: { withD9?: boolean; withAmk?: boolean; withDasha?: boolean } = {}): ChartOutput {
  const planets = PLACED.map((p) => g(p.id, p.rashi, p.dignity))
  const now = Date.now()
  return {
    grahas: planets,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10 },
    vargas: {
      D10: planets,
      ...(opts.withD9 === false
        ? {}
        : { D9: planets.map((p) => (p.id === 'Sa' ? g('Sa', 9, 'own') : p)) }),
    },
    vargaLagnas: { D10: 1 as Rashi },
    karakas: opts.withAmk === false ? undefined : { AmK: 'Ju' },
    dashas: opts.withDasha === false
      ? {}
      : {
          vimshottari: [{
            lord: 'Ju',
            start: new Date(now - 86_400_000),
            end: new Date(now + 86_400_000 * 400),
            level: 1,
            children: [],
          }],
        },
  } as unknown as ChartOutput
}

describe('classical helpers', () => {
  it('classifies modality and Parashari aspects', () => {
    expect(signModality(10)).toBe('movable')
    expect(signModality(8)).toBe('fixed')
    expect(signModality(6)).toBe('dual')
    expect(aspectHouses('Sa')).toEqual([3, 7, 10])
    expect(aspectHouses('Ma')).toEqual([4, 7, 8])
    expect(aspectHouses('Ju')).toEqual([5, 7, 9])
    expect(aspectHouses('Su')).toEqual([7])
    expect(aspectsSign(1, 'Sa', 10)).toBe(true)
    expect(aspectsSign(1, 'Ju', 10)).toBe(false)
    expect(mahatGrade(72)).toBe('mahat')
    expect(mahatGrade(58)).toBe('distinguished')
    expect(mahatGrade(34)).toBe('notable')
    expect(mahatGrade(20)).toBe('ordinary')
  })
})

describe('buildDashamsaClassical', () => {
  it('names Jupiter from the Navamsha lord and the Sun for D10 status', () => {
    const analysis = analyzeDashamsa(chart())
    expect(analysis).not.toBeNull()
    const result = buildDashamsaClassical(analysis!, chart())
    expect(result).not.toBeNull()
    const reading = result!

    expect(reading.livelihood.winner.id).toBe('Ju')
    expect(reading.mahatEmphasis.winner.id).toBe('Su')
    expect(reading.mahatEmphasis.agrees).toBe(false)
    expect(reading.tenthLord.id).toBe('Sa')
    expect(reading.tenthLord.house).toBe(1)
    expect(reading.tenthSign.modality).toBe('movable')
    expect(reading.mahatphala.grade).toBe('distinguished')
    expect(reading.mahatphala.score).toBe(
      reading.mahatphala.factors.reduce((sum, f) => sum + f.points, 0),
    )

    const yoga = (id: string) => reading.yogas.find((y) => y.id === id)
    expect(yoga('dharma-karmadhipati')?.formed).toBe(true)
    expect(yoga('digbala-d10')?.formed).toBe(true)
    expect(yoga('neecha-bhanga')?.formed).toBe(true)
    expect(yoga('neecha-bhanga')?.tone).toBe('supportive')
    expect(yoga('karma-labha-lord')?.formed).toBe(true)
    expect(yoga('budhaditya')?.formed).toBe(false)
    expect(yoga('vargottama-karma')?.formed).toBe(true)
    expect(yoga('amk-strength')?.formed).toBe(true)

    expect(reading.pointers.find((p) => p.id === 'navamsha')?.detail).toMatch(/Jupiter/)
    expect(reading.amatyakaraka?.id).toBe('Ju')
    expect(reading.amatyakaraka?.house).toBe(1)
    expect(reading.timing.find((t) => t.id === 'livelihood')?.live).toBe(true)
    expect(reading.predictions.length).toBeGreaterThanOrEqual(6)
    expect(reading.luminaries).toHaveLength(2)
    expect(reading.sources.length).toBeGreaterThanOrEqual(4)
  })

  it('drops the Navamsha lord when D9 is absent, so Saturn leads livelihood', () => {
    const bare = chart({ withD9: false, withAmk: false, withDasha: false })
    const analysis = analyzeDashamsa(bare)
    const result = buildDashamsaClassical(analysis!, bare)
    expect(result!.livelihood.winner.id).toBe('Sa')
    expect(result!.mahatEmphasis.winner.id).toBe('Su')
    expect(result!.pointers.find((p) => p.id === 'navamsha')?.detail).toMatch(/skipped/i)
    expect(result!.amatyakaraka).toBeNull()
    expect(result!.timing.every((t) => t.live === false)).toBe(true)
  })

  it('returns null without a lagna', () => {
    const analysis = analyzeDashamsa(chart())
    const broken = { grahas: [], vargas: {}, vargaLagnas: {} } as unknown as ChartOutput
    expect(buildDashamsaClassical(analysis!, broken)).toBeNull()
  })
})
