// __tests__/engine/tajikaYogas.test.ts
// The sixteen Tajika yogas used in praśna and Varshaphal. Pure logic only.

import { describe, it, expect } from 'vitest'
import { findTajikaYogas, futureIthasala, getTajikaYogas, tajikaYogaText, type TajikaYogaHit, type TajikaYogaId } from '@/lib/engine/tajika'
import { runVedicPrashna, tajikaYogaFactor, type VedicChartInput } from '@/lib/engine/vedicPrashna'
import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

const DEV = /[ऀ-ॿ]/
const SPEED: Record<string, number> = { Su: 1, Mo: 13, Ma: 0.5, Me: 1.2, Ju: 0.1, Ve: 1.1, Sa: 0.05 }

type Extra = { speed?: number; dignity?: Dignity; isCombust?: boolean }
function g(id: GrahaId, rashi: Rashi, degree: number, x: Extra = {}): GrahaData {
  const speed = x.speed ?? SPEED[id] ?? 0
  return { id, name: id, rashi, degree, totalDegree: (rashi - 1) * 30 + degree, speed, isRetro: speed < 0, isCombust: x.isCombust ?? false, dignity: x.dignity ?? 'neutral' } as GrahaData
}

/**
 * Aries lagna. Venus (10° Aries) applies to Jupiter (14° Leo) by a friendly 5th.
 * The rest sit at 2° Pisces, out of aspect with both; the Moon is void at 25° Taurus.
 */
function base(over: Partial<Record<GrahaId, GrahaData>> = {}) {
  const grahas: Record<string, GrahaData> = {
    Ve: g('Ve', 1, 10), Ju: g('Ju', 5, 14), Mo: g('Mo', 2, 25),
    Su: g('Su', 12, 2), Me: g('Me', 12, 2), Ma: g('Ma', 12, 2), Sa: g('Sa', 12, 2),
    ...over,
  }
  return { grahas, house: (id: GrahaId) => ((grahas[id].rashi - 1 + 12) % 12) + 1 }
}
const ids = (hits: TajikaYogaHit[]) => hits.map(h => h.id)
const find = (over: Partial<Record<GrahaId, GrahaData>>, a: GrahaId = 'Ve', b: GrahaId = 'Ju') => findTajikaYogas(base(over), a, b)

describe('chart-wide yogas', () => {
  it('Ikkabāla when all seven are in kendras and paṇapharas', () => {
    const r = [1, 2, 4, 5, 7, 10, 11] as Rashi[]
    const over = Object.fromEntries((['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map((id, i) => [id, g(id, r[i], 15)]))
    expect(ids(find(over))).toContain('ikkabala')
  })
  it('Induvāra when all seven are in āpoklimas', () => {
    const r = [3, 6, 9, 12, 3, 6, 9] as Rashi[]
    const over = Object.fromEntries((['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map((id, i) => [id, g(id, r[i], 15)]))
    expect(ids(find(over))).toContain('induvara')
  })
})

describe('ithasala and its spoilers', () => {
  it('base chart: ithasala with a void Moon gives Khallāsara, nothing else', () => {
    expect(ids(find({}))).toEqual(['ithasala', 'khallasara'])
  })

  it('Manaū: Mars in hostile aspect to a significator inside the orb', () => {
    const r = find({ Ma: g('Ma', 4, 12) })
    expect(r.find(y => y.id === 'manau')?.planets).toContain('Ma')
  })

  it('Kamboola, graded by the Moon and the planet it joins', () => {
    expect(find({ Mo: g('Mo', 9, 5) }).find(y => y.id === 'kamboola')?.grade).toBe('adhama')
    const best = find({ Mo: g('Mo', 9, 5, { dignity: 'exalted' }), Ve: g('Ve', 1, 10, { dignity: 'own' }) })
    expect(best.find(y => y.id === 'kamboola')?.grade).toBe('uttama')
    expect(ids(best)).not.toContain('khallasara')
  })

  it('Gairi-kamboola: a void Moon will join a strong planet from the next sign', () => {
    const r = find({ Sa: g('Sa', 12, 2, { dignity: 'own' }) })
    expect(r.find(y => y.id === 'gairi-kamboola')?.planets).toContain('Sa')
    expect(ids(r)).not.toContain('khallasara')
  })

  it('Radda: a combust or retrograde planet of the ithasala', () => {
    expect(find({ Ve: g('Ve', 1, 10, { isCombust: true }) }).find(y => y.id === 'radda')?.cause).toBe('combust')
    expect(find({ Ju: g('Ju', 5, 14, { speed: -0.1 }) }).find(y => y.id === 'radda')?.cause).toBe('retrograde')
  })

  it('Durupha when both are weak, Dutthottha-davīra when a strong third lifts them', () => {
    const weak = { Ve: g('Ve', 1, 10, { dignity: 'debilitated' }), Ju: g('Ju', 5, 14, { dignity: 'enemy' }) }
    expect(ids(find(weak))).toContain('durupha')
    expect(ids(find(weak))).not.toContain('dutthottha-davira')
    const lifted = find({ ...weak, Me: g('Me', 3, 8, { dignity: 'exalted' }) })
    expect(lifted.find(y => y.id === 'dutthottha-davira')?.planets).toContain('Me')
  })

  it('Duphāli-kuttha: weak fast planet, strong slow planet', () => {
    expect(ids(find({ Ve: g('Ve', 1, 10, { dignity: 'debilitated' }), Ju: g('Ju', 5, 14, { dignity: 'exalted' }) }))).toContain('duphali-kuttha')
  })

  it('Kuttha: strong and in kendra or paṇaphara', () => {
    expect(ids(find({ Ve: g('Ve', 1, 10, { dignity: 'own' }) }))).toContain('kuttha')
    // Same strength, but Jupiter in the 6th is weak by house.
    expect(ids(find({ Ve: g('Ve', 1, 10, { dignity: 'own' }), Ju: g('Ju', 6, 14) }))).not.toContain('kuttha')
  })
})

describe('when the significators do not perfect', () => {
  it('Ishrafa when the faster planet has passed', () => {
    expect(ids(find({ Ve: g('Ve', 1, 20) }))[0]).toBe('ishrafa')
  })

  it('Bhaviṣyat ithasala across the cusp', () => {
    const r = find({ Ve: g('Ve', 1, 28), Ju: g('Ju', 4, 2) })
    const hit = r.find(y => y.id === 'bhavishyat-ithasala')
    expect(hit?.link?.gap).toBe(4)
    expect(hit?.link?.aspect).toBe('friendly')
    expect(futureIthasala(g('Ve', 1, 28), g('Ju', 4, 2))?.daysAtCurrentSpeed).toBe(4)
    // A retrograde fast planet never crosses forward.
    expect(futureIthasala(g('Ve', 1, 28, { speed: -0.5 }), g('Ju', 4, 2))).toBeNull()
  })

  it('Nakta: a faster planet applies to both unjoined significators', () => {
    const r = find({ Ju: g('Ju', 2, 14), Mo: g('Mo', 10, 5) })
    expect(r.find(y => y.id === 'nakta')?.planets).toEqual(['Ve', 'Ju', 'Mo'])
  })

  it('Yamaya: both unjoined significators apply to a slower planet', () => {
    const r = find({ Ju: g('Ju', 2, 14), Sa: g('Sa', 5, 16) })
    expect(r.find(y => y.id === 'yamaya')?.planets).toEqual(['Ve', 'Ju', 'Sa'])
  })

  it('no Nakta or Yamaya once the significators are in ishrafa', () => {
    // Ishrafa (Venus past Jupiter), with the Moon that would carry light otherwise.
    const r = find({ Ve: g('Ve', 1, 20), Ju: g('Ju', 5, 14), Mo: g('Mo', 9, 5) })
    expect(ids(r).some(id => id === 'nakta' || id === 'yamaya')).toBe(false)
  })

  it('Tambīra: a significator at the end of its sign will reach a strong planet', () => {
    const r = find({ Ve: g('Ve', 1, 28), Ju: g('Ju', 2, 14), Sa: g('Sa', 4, 2, { dignity: 'own' }) })
    expect(r.find(y => y.id === 'tambira')?.planets).toEqual(['Ve', 'Ju', 'Sa'])
  })
})

describe('reading text', () => {
  const ALL: TajikaYogaId[] = ['ikkabala', 'induvara', 'ithasala', 'bhavishyat-ithasala', 'ishrafa', 'nakta', 'yamaya', 'manau', 'kamboola', 'gairi-kamboola', 'khallasara', 'radda', 'duphali-kuttha', 'dutthottha-davira', 'tambira', 'kuttha', 'durupha']
  const link = { type: 'ithasala' as const, fast: 'Ve' as GrahaId, slow: 'Ju' as GrahaId, aspect: 'friendly' as const, gap: 4, orb: 8, daysAtCurrentSpeed: 4 }

  it('every yoga has English and Hindi text, with the same polarity', () => {
    for (const id of ALL) {
      const hit: TajikaYogaHit = { id, planets: ['Ve', 'Ju', 'Sa', 'Mo'], link, grade: 'madhyama', cause: 'combust' }
      const en = tajikaYogaFactor(hit, 'en')
      const hi = tajikaYogaFactor(hit, 'hi')
      expect(en.group).toBe('Tajika')
      expect(en.title).not.toMatch(DEV)
      expect(hi.title).toMatch(DEV)
      expect(hi.detail).toMatch(DEV)
      expect(hi.polarity).toBe(en.polarity)
      expect(hi.id).toBe(en.id)
    }
  })

  it('feeds the praśna reading: Taurus lagna, money (Venus and Jupiter)', () => {
    const c = base({ Ve: g('Ve', 2, 10), Ju: g('Ju', 6, 14), Ma: g('Ma', 5, 12) })
    const chart: VedicChartInput = { lagnas: { ascRashi: 2, ascDegree: 40 }, grahas: Object.values(c.grahas) }
    const r = runVedicPrashna(chart, 'money')
    expect(r.significators).toMatchObject({ lagnaLord: 'Ve', karyaLord: 'Ju' })
    expect(r.factors.map(f => f.id)).toEqual(expect.arrayContaining(['ithasala', 'manau']))
    const hi = runVedicPrashna(chart, 'money', 'hi')
    expect(hi.factors.map(f => f.id)).toEqual(r.factors.map(f => f.id))
  })
})

describe('Varshaphal yogas', () => {
  it('lists ishrafa and the chart-wide yogas, with Hindi text', () => {
    const grahas = [g('Su', 1, 15), g('Mo', 2, 15), g('Ma', 4, 15), g('Me', 5, 15), g('Ju', 7, 15), g('Ve', 10, 15), g('Sa', 11, 15)]
    const y = getTajikaYogas(grahas, 1)
    expect(y[0].name).toBe('Ikkabala')
    expect(tajikaYogaText(y[0]).aspecting).toBe('')
    const passed = getTajikaYogas([g('Mo', 1, 20), g('Sa', 3, 14)])
    expect(passed.map(x => x.name)).toEqual(['Ishrafa'])
    for (const v of Object.values(tajikaYogaText(passed[0], 'hi'))) expect(v).toMatch(DEV)
  })
})
