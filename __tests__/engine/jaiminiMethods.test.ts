import { describe, expect, it } from 'vitest'
import type { DashaNode, GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { calcMandookDasha, calcSthirDasha } from '@/lib/engine/dasha/jaimini'
import { calculateJaiminiBala } from '@/lib/engine/jaimini/bala'
import { argalaResultPhaseStart, readArgalaSources, readArgalaTable } from '@/lib/engine/jaimini/argala'
import { buildDashaBoard, matchLifeEvent, rankSystems } from '@/lib/engine/jaimini/dashaBoard'
import {
  readAkNakshatra, readArudhaInsights, readGateway, readHouseTriads, readSpecialLagnas,
  readTransitTriggers, readTrinityActivation, signWindows, type InsightContext,
} from '@/lib/engine/jaimini/insights'
import { detectJaiminiRajayogas } from '@/lib/engine/jaimini/yogas'

function g(id: GrahaId, rashi: number, degree: number): GrahaData {
  return { id, rashi: rashi as Rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, totalDegree: (rashi - 1) * 30 + degree } as unknown as GrahaData
}

const GRAHAS = [
  g('Su', 1, 29), g('Mo', 2, 25), g('Ma', 3, 21), g('Me', 4, 17),
  g('Ju', 5, 13), g('Ve', 6, 9), g('Sa', 7, 5), g('Ra', 11, 3), g('Ke', 5, 3),
]
const LAGNAS = { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10, ghatiLagna: 100, varnadaLagna: 200, horaLagna: 300 } as unknown as LagnaData
const BIRTH = new Date('2000-01-01T00:00:00Z')
const ROLES = { Su: 'AK', Mo: 'AmK', Ma: 'BK', Me: 'MK', Ju: 'PK', Ve: 'GK', Sa: 'DK' } as Partial<Record<GrahaId, string>>
const signNode = (lord: string, from: string, to: string): DashaNode =>
  ({ lord, start: new Date(from), end: new Date(to), durationMs: 0, level: 1, isCurrent: false, children: [] }) as DashaNode

describe('method-specific dashas', () => {
  it('uses Mars alone for Scorpio in class Mandook', () => {
    const grahas = [g('Ma', 8, 10), g('Ke', 2, 10), g('Ra', 8, 12), g('Su', 1, 1), g('Mo', 4, 1), g('Me', 3, 1), g('Ju', 9, 1), g('Ve', 7, 1), g('Sa', 10, 1)]
    const years = (nodes: DashaNode[]) => nodes.find(n => n.lord === 'Sc')?.label
    expect(years(calcMandookDasha(grahas, LAGNAS, BIRTH, 1, 'practical'))).toContain('(12y)')
    expect(years(calcMandookDasha(grahas, LAGNAS, BIRTH, 1, 'classical'))).not.toContain('(12y)')
  })

  it('starts class Sthira from the stronger of Lagna and 7th', () => {
    const bala = calculateJaiminiBala({ grahas: GRAHAS, lagnas: LAGNAS })
    const seed = bala.rashis[1].total >= bala.rashis[7].total ? 'Ar' : 'Li'
    const nodes = calcSthirDasha(GRAHAS, LAGNAS, BIRTH, 1, 'practical')
    expect(nodes[0].lord).toBe(seed)
    expect(nodes[1].lord).toBe(seed === 'Ar' ? 'Ta' : 'Sc')
  })

  it('runs class Sthira backward from an even sign', () => {
    const lagnas = { ...LAGNAS, ascRashi: 2 as Rashi }
    const bala = calculateJaiminiBala({ grahas: GRAHAS, lagnas })
    const nodes = calcSthirDasha(GRAHAS, lagnas, BIRTH, 1, 'practical')
    if (bala.rashis[2].total >= bala.rashis[8].total) {
      expect(nodes.slice(0, 2).map(n => n.lord)).toEqual(['Ta', 'Ar'])
    } else {
      expect(nodes.slice(0, 2).map(n => n.lord)).toEqual(['Sc', 'Li'])
    }
  })

  it('names the 5th karaka by method', () => {
    const karakas = { AK: 'Su', AmK: 'Mo', PK: 'Su', DK: 'Sa' } as const
    const hits = (method: 'classical' | 'practical') =>
      detectJaiminiRajayogas(GRAHAS.map(x => ({ id: x.id, rashi: x.rashi, degree: x.degree })), 1 as Rashi, { ...karakas, PK: 'Ma' }, undefined, { method })
        .map(h => h.name).join(' ')
    expect(hits('practical')).not.toMatch(/Pitrukaraka/)
  })
})

describe('argala methods', () => {
  const strength = (id: GrahaId) => (id === 'Ju' ? 100 : 10)

  it('blocks by planet count under M1 and ignores degree', () => {
    const grahas = [{ id: 'Mo' as GrahaId, rashi: 2 as Rashi, degree: 5 }, { id: 'Sa' as GrahaId, rashi: 12 as Rashi, degree: 5 }, { id: 'Ma' as GrahaId, rashi: 12 as Rashi, degree: 5 }]
    const second = readArgalaSources(1 as Rashi, grahas, strength, 'classical').find(s => s.id === '2nd')
    expect(second?.status).toBe('blocked')
  })

  it('blocks only from the opposite quarter under M2', () => {
    const same = [{ id: 'Mo' as GrahaId, rashi: 2 as Rashi, degree: 5 }, { id: 'Sa' as GrahaId, rashi: 12 as Rashi, degree: 5 }]
    expect(readArgalaSources(1 as Rashi, same, strength, 'practical').find(s => s.id === '2nd')?.status).toBe('open')
    const opposite = [{ id: 'Mo' as GrahaId, rashi: 2 as Rashi, degree: 5 }, { id: 'Sa' as GrahaId, rashi: 12 as Rashi, degree: 25 }]
    expect(readArgalaSources(1 as Rashi, opposite, strength, 'practical').find(s => s.id === '2nd')?.status).toBe('blocked')
  })

  it('lets stronger argala planets beat the block under M2', () => {
    const grahas = [{ id: 'Ju' as GrahaId, rashi: 2 as Rashi, degree: 5 }, { id: 'Sa' as GrahaId, rashi: 12 as Rashi, degree: 25 }]
    expect(readArgalaSources(1 as Rashi, grahas, strength, 'practical').find(s => s.id === '2nd')?.status).toBe('strong')
  })

  it('orders M2 sources by influence and flags self-driven houses', () => {
    const grahas = [{ id: 'Ju' as GrahaId, rashi: 3 as Rashi, degree: 13 }, { id: 'Ra' as GrahaId, rashi: 3 as Rashi, degree: 2 }]
    const table = readArgalaTable(3 as Rashi, grahas, strength, 'practical')
    expect(table).toHaveLength(12)
    expect(table[0].selfDriven).toBe(true)
    expect(table[0].sources[0].id).toBe('4th')
  })

  it('places the result phase at 70% of the period', () => {
    const start = new Date('2000-01-01T00:00:00Z').getTime()
    const end = new Date('2020-01-01T00:00:00Z').getTime()
    expect(argalaResultPhaseStart(new Date(start), new Date(end)).getTime()).toBeCloseTo(start + (end - start) * 0.7, 0)
  })
})

describe('deep readings', () => {
  const nodes = [signNode('Ar', '2000-01-01', '2010-01-01'), signNode('Ta', '2010-01-01', '2020-01-01'), signNode('Ge', '2020-01-01', '2030-01-01'), signNode('Cn', '2030-01-01', '2040-01-01')]
  const ctx = (method: 'classical' | 'practical'): InsightContext => ({
    grahas: GRAHAS, lagnas: LAGNAS, roleOf: ROLES, bala: calculateJaiminiBala({ grahas: GRAHAS, lagnas: LAGNAS }), nodes, method, asOf: new Date('2025-01-01'),
  })

  it('finds current and next sign windows', () => {
    const now = new Date('2025-01-01').getTime()
    expect(signWindows(nodes, 3 as Rashi, now).current).toContain('2020')
    expect(signWindows(nodes, 4 as Rashi, now).next).toContain('2030')
  })

  it('reads Bahya at the same count from Dwara, with use only under M2', () => {
    const r = readGateway(ctx('practical'), 3 as Rashi)
    expect(r.bahya).toBe(5)
    expect(r.useFor).toMatch(/court case/)
    expect(readGateway(ctx('classical'), 3 as Rashi).useFor).toBeNull()
  })

  it('reads special lagnas, trinity, arudha, and triads', () => {
    const special = readSpecialLagnas(ctx('practical'))
    expect(special.rows.map(r => r.id)).toEqual(['GL', 'VL', 'HL'])
    expect(special.comparison).toBeTruthy()
    expect(readTrinityActivation(ctx('practical')).map(r => r.id)).toEqual(['brahma', 'maheshwara', 'rudra'])
    const arudha = readArudhaInsights(ctx('practical'), { AL: 12 as Rashi, A7: 4 as Rashi })
    expect(arudha.find(a => a.id === 'gains')?.sign).toBe(10)
    expect(arudha.find(a => a.id === 'leak')?.sign).toBe(11)
    expect(arudha.find(a => a.id === 'leak')?.text).toMatch(/Rahu points/)
    expect(readArudhaInsights(ctx('classical'), { AL: 12 as Rashi, A7: 4 as Rashi }).find(a => a.id === 'leak')?.text).not.toMatch(/Rahu points/)
    const triads = readHouseTriads(ctx('practical'))
    expect(triads).toHaveLength(12)
    expect(triads[9].fixedKaraka).toBe('Mercury')
  })

  it('covers every nakshatra and marks class-taught ones', () => {
    const r = readAkNakshatra({ ...ctx('practical'), grahas: [g('Su', 9, 5)] }, 'Su')
    expect(r?.nakshatra).toBe('Mula')
    expect(r?.detailed).toBe(true)
    expect(r?.story).toBeTruthy()
    expect(readAkNakshatra({ ...ctx('classical'), grahas: [g('Su', 9, 5)] }, 'Su')?.story).toBeNull()
    for (let lon = 0; lon < 360; lon += 13.3) {
      const rashi = (Math.floor(lon / 30) + 1) as number
      expect(readAkNakshatra({ ...ctx('classical'), grahas: [g('Su', rashi, lon % 30)] }, 'Su')?.nature).toBeTruthy()
    }
  })

  it('gives the four-factor check only under M2', () => {
    const positions = [{ id: 'Sa' as GrahaId, rashi: 3 as Rashi }]
    const m2 = readTransitTriggers(ctx('practical'), positions, { dashaSign: 3 as Rashi, ak: 'Su', dk: 'Sa' })
    expect(m2.rows[0].hits[0]).toMatch(/Saturn transits/)
    expect(m2.confirmation?.transit).toBe(true)
    expect(readTransitTriggers(ctx('classical'), positions, { dashaSign: 3 as Rashi }).confirmation).toBeNull()
  })
})

describe('dasha board and event matching', () => {
  const systems = [
    { id: 'chara', name: 'Chara', kind: 'sign' as const, nodes: [signNode('Li', '2000-01-01', '2030-01-01')] },
    { id: 'mandook', name: 'Mandook', kind: 'sign' as const, nodes: [signNode('Li', '2000-01-01', '2030-01-01')] },
    { id: 'vim', name: 'Vimshottari', kind: 'graha' as const, nodes: [signNode('Ve', '2000-01-01', '2030-01-01')] },
  ]
  const input = { grahas: GRAHAS, lagna: 1 as Rashi, roleOf: ROLES, method: 'practical' as const }
  const anchors = { karakas: { AK: 'Su', AmK: 'Mo', BK: 'Ma', MK: 'Me', PK: 'Ju', GK: 'Ve', DK: 'Sa' } as const }

  it('shows every system and the areas they share', () => {
    const board = buildDashaBoard(systems, input, new Date('2015-01-01'))
    expect(board.rows).toHaveLength(3)
    const marriage = board.agreements.find(a => a.area === 'marriage')
    expect(marriage?.systems).toHaveLength(3)
    expect(marriage?.strong).toBe(true)
  })

  it('scores an event and reports the chance baseline', () => {
    const match = matchLifeEvent({ id: '1', type: 'marriage', date: '2015-06-01' }, systems, input, anchors)
    expect(match?.systems[0].score).toBeGreaterThan(0)
    expect(match?.baseline).toBeGreaterThan(0)
    expect(rankSystems(match ? [match] : [])[0].events).toBe(1)
  })

  it('skips systems with no period at the event date', () => {
    const match = matchLifeEvent({ id: '1', type: 'career', date: '1990-01-01' }, systems, input, anchors)
    expect(match?.systems).toHaveLength(0)
  })
})
