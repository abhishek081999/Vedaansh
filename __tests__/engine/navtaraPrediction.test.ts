import { describe, expect, it } from 'vitest'
import type { ChartOutput, DashaNode, GrahaData, GrahaId } from '@/types/astrology'
import {
  buildGocharaNavtaraReport,
  buildNavtaraSlots,
  checkMuhurtaNavtara,
  classifyNatalPlanets,
  classifyTransitNakshatra,
  getNavtaraPrediction,
  getRelationshipNavtara,
  getTaraFromBirth,
  getTaraIndexFromBirth,
  mapDashaLordsToTara,
  TARA_DECISION_PROFILES,
} from '@/lib/engine/navtaraPrediction'

function graha(id: GrahaId, nak: number, name: string): GrahaData {
  return {
    id,
    name,
    lonSidereal: nak * (360 / 27) + 1,
    nakshatraIndex: nak,
    nakshatraName: name,
    pada: 1,
  } as unknown as GrahaData
}

function dasha(lord: GrahaId, start: Date, end: Date, children: DashaNode[] = []): DashaNode {
  return {
    lord,
    level: 1,
    start,
    end,
    children,
  } as unknown as DashaNode
}

describe('navtaraPrediction', () => {
  it('counts inclusive from birth nakshatra (Jyestha → Mula = Sampat)', () => {
    // Jyestha = 17, Mula = 18
    expect(getTaraIndexFromBirth(17, 17)).toBe(0) // Janma
    expect(getTaraIndexFromBirth(17, 18)).toBe(1) // Sampat
    expect(getTaraIndexFromBirth(17, 19)).toBe(2) // Vipat Purva Ashadha
    expect(getTaraFromBirth(17, 25).name).toBe('Ati-Mitra') // Uttara Bhadra = 9th
  })

  it('builds 27 slots with three nakshatras per tara', () => {
    const slots = buildNavtaraSlots(17) // Jyestha
    expect(slots).toHaveLength(27)
    const byTara = new Map<string, number>()
    for (const s of slots) {
      byTara.set(s.tara, (byTara.get(s.tara) ?? 0) + 1)
    }
    expect([...byTara.values()].every(n => n === 3)).toBe(true)
    expect(slots[17].tara).toBe('Janma')
    expect(slots[18].tara).toBe('Sampat')
    expect(slots[19].tara).toBe('Vipat')
  })

  it('marks Vipat / Pratyari / Vadha as hard decision windows', () => {
    expect(TARA_DECISION_PROFILES.Vipat.isHard).toBe(true)
    expect(TARA_DECISION_PROFILES.Pratyari.isHard).toBe(true)
    expect(TARA_DECISION_PROFILES.Vadha.isHard).toBe(true)
    expect(TARA_DECISION_PROFILES.Sampat.isHard).toBe(false)
    expect(TARA_DECISION_PROFILES['Ati-Mitra'].trap).toBeTruthy()
  })

  it('maps Vimshottari MD sequence from birth MD lord as Janma', () => {
    // Birth MD Mercury → Janma Me, Sampat Ke, Vipat Ve, …
    const seq = mapDashaLordsToTara('Me')
    expect(seq).toHaveLength(9)
    expect(seq[0]).toMatchObject({ lord: 'Me', tara: 'Janma' })
    expect(seq[1]).toMatchObject({ lord: 'Ke', tara: 'Sampat' })
    expect(seq[2]).toMatchObject({ lord: 'Ve', tara: 'Vipat' })
    expect(seq[8]).toMatchObject({ lord: 'Sa', tara: 'Ati-Mitra' })
  })

  it('flags natal planets in hard taras as reduced capacity', () => {
    // Birth Jyestha (17). Purva Ashadha (19) = Vipat.
    const planets = classifyNatalPlanets(17, [
      graha('Mo', 17, 'Jyestha'),
      graha('Ve', 19, 'Purva Ashadha'),
      graha('Ju', 24, 'Purva Bhadra'), // Mitra from Jyestha: 17+7=24
    ])
    const ve = planets.find(p => p.grahaId === 'Ve')
    const ju = planets.find(p => p.grahaId === 'Ju')
    expect(ve?.tara).toBe('Vipat')
    expect(ve?.resultCapacity).toBe('reduced')
    expect(ju?.tara).toBe('Mitra')
    expect(ju?.resultCapacity).toBe('full')
  })

  it('classifies transit nakshatra into native tara', () => {
    const t = classifyTransitNakshatra(17, 19)
    expect(t.name).toBe('Vipat')
    expect(t.nakshatraName).toContain('Ashadha')
  })

  it('builds prediction synthesis for current MD/AD path', () => {
    const now = new Date('2025-11-25T12:00:00Z')
    const antarStart = new Date('2024-04-01T00:00:00Z')
    const antarEnd = new Date('2026-12-01T00:00:00Z')
    const mahaStart = new Date('2017-03-01T00:00:00Z')
    const mahaEnd = new Date('2037-03-01T00:00:00Z')

    const chart = {
      grahas: [
        graha('Mo', 17, 'Jyestha'),
        graha('Ve', 19, 'Purva Ashadha'),
        graha('Ju', 24, 'Purva Bhadra'),
      ],
      panchang: { nakshatra: { index: 17 } },
      dashas: {
        vimshottari: [
          dasha('Ve', mahaStart, mahaEnd, [
            {
              ...dasha('Ju', antarStart, antarEnd),
              level: 2,
            },
          ]),
        ],
      },
    } as unknown as Pick<ChartOutput, 'grahas' | 'dashas' | 'panchang'>

    const pred = getNavtaraPrediction(chart, now)
    expect(pred.birthNakshatraName).toBeTruthy()
    expect(pred.current.maha?.lord).toBe('Ve')
    expect(pred.current.maha?.tara).toBe('Janma') // birth MD lord = Janma
    expect(pred.current.antar?.lord).toBe('Ju')
    // From Ve MD: Ve→Su→Mo→Ma→Ra→Ju → Sadhaka (dasha map ≠ natal nakshatra tara)
    expect(pred.current.antar?.tara).toBe('Sadhaka')
    expect(pred.current.synthesis.length).toBeGreaterThan(40)
    expect(pred.current.decisionAdvice.length).toBeGreaterThan(10)
    expect(pred.reducedResultLords).toContain('Ve') // natal Ve in Vipat nak
    expect(pred.supportiveLords).toContain('Ju') // natal Ju in Mitra nak
  })

  it('marks gochara as active only when dasha lords match', () => {
    const report = buildGocharaNavtaraReport(
      17,
      [
        { id: 'Mo', nakshatraIndex: 19, nakshatraName: 'Purva Ashadha' },
        { id: 'Ju', nakshatraIndex: 24, nakshatraName: 'Purva Bhadra' },
      ],
      ['Ju', 'Ve'],
      '2025-11-25',
    )
    expect(report.moonTara?.tara).toBe('Vipat')
    expect(report.moonTara?.eventLikelihood).toBe('energy-only')
    const ju = report.planets.find(p => p.grahaId === 'Ju')
    expect(ju?.eventLikelihood).toBe('active')
    expect(report.activeEventCandidates.map(p => p.grahaId)).toContain('Ju')
  })

  it('avoids muhurta booking on Vipat / Pratyari / Vadha days', () => {
    // Jyestha birth → Purva Ashadha = Vipat
    const hard = checkMuhurtaNavtara(17, 19, 'vehicle delivery')
    expect(hard.verdict).toBe('avoid')
    expect(hard.isHardTara).toBe(true)
    // Mula = Sampat
    const good = checkMuhurtaNavtara(17, 18, 'vehicle delivery')
    expect(good.verdict).toBe('favourable')
    expect(good.isHardTara).toBe(false)
  })

  it('computes bidirectional relationship tara', () => {
    // Jyestha (17) → Shravana (21): diff 4 → Pratyari (hard)
    // Shravana (21) → Jyestha (17): diff 23 → Sadhaka
    const rel = getRelationshipNavtara(17, 21, 'A', 'B')
    expect(rel.aToB.tara).toBe('Pratyari')
    expect(rel.bToA.tara).toBe('Sadhaka')
    expect(rel.mutualHard).toBe(false)
    expect(rel.hasSupport).toBe(true) // Sadhaka counts as support
    expect(rel.advice.length).toBeGreaterThan(20)
  })
})
