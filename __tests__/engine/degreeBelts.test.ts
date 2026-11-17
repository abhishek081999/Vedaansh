// __tests__/engine/degreeBelts.test.ts
// Pure engine checks — no React / Redis / mongoose.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import {
  DEGREE_BELTS,
  DEGREE_BELTS_EN,
  DEGREE_BELTS_UI_EN,
  beltMotion,
  beltsAt,
  buildDegreeBelts,
  readBeltPlacement,
} from '@/lib/engine/degreeBelts'
import { DEGREE_BELTS_HI } from '@/lib/engine/locale/degreeBelts.hi'
import { NATAL_KARAKATVA, karakatvasFor } from '@/lib/engine/natalKarakatva'

function g(id: GrahaData['id'], rashi: Rashi, degree: number, isRetro = false): GrahaData {
  return { id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, isRetro } as GrahaData
}

function keys(x: unknown): string[] {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return []
  return Object.entries(x).flatMap(([k, v]) => [k, ...keys(v).map((s) => `${k}.${s}`)]).sort()
}

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Aarav',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('belt table', () => {
  it('covers every degree of every sign; only Virgo 16–20 overlaps', () => {
    for (let r = 1 as Rashi; r <= 12; r = (r + 1) as Rashi) {
      for (let d = 0; d < 30; d++) {
        const n = beltsAt(r, d + 0.5).length
        if (r === 6 && d >= 16 && d <= 20) expect(n, `${r}:${d}`).toBe(2)
        else expect(n, `${r}:${d}`).toBe(1)
      }
    }
  })

  it('Gemini is Mercury own sign throughout', () => {
    expect(DEGREE_BELTS.filter((b) => b.rashi === 3)).toEqual([{ rashi: 3, from: 0, to: 30, owner: 'Me', kind: 'own' }])
  })

  it('a degree runs to its 59th minute', () => {
    expect(beltsAt(2, 3.98)[0]).toMatchObject({ owner: 'Mo', kind: 'exaltation' })
    expect(beltsAt(2, 4)[0]).toMatchObject({ owner: 'Mo', kind: 'mooltrikona' })
  })

  it('exaltation and debilitation belts sit opposite at the same degrees', () => {
    const pairs = DEGREE_BELTS.filter((b) => b.kind === 'exaltation')
    for (const ex of pairs) {
      const opp = (((ex.rashi - 1 + 6) % 12) + 1) as Rashi
      expect(DEGREE_BELTS.some((b) => b.rashi === opp && b.kind === 'debilitation' && b.owner === ex.owner && b.from === ex.from && b.to === ex.to), ex.owner).toBe(true)
    }
  })
})

describe('lecture examples', () => {
  it('Moon in Scorpio is debilitated only at 0–3°, a friend’s sign after', () => {
    expect(readBeltPlacement(g('Mo', 8, 2), 1).standing).toBe('debilitated')
    expect(readBeltPlacement(g('Mo', 8, 20), 1).standing).toBe('friend')
  })

  it('Mars at 2° Scorpio disturbs Moon karakatvas of that house', () => {
    // Leo lagna → Scorpio is the 4th house.
    const p = readBeltPlacement(g('Ma', 8, 2), 5)
    expect(p.house).toBe(4)
    const moon = p.effects.find((e) => e.planet === 'Mo')
    expect(moon?.effect).toBe('disturbed')
    expect(moon?.karakatvas.map((k) => k.id)).toContain('mother')
  })

  it('Mercury at 18° Virgo is mooltrikona and disturbs Venus there', () => {
    const p = readBeltPlacement(g('Me', 6, 18), 12) // Pisces lagna → Virgo 7th
    expect(p.standing).toBe('mooltrikona')
    expect(p.belts).toHaveLength(2)
    const ve = p.effects.find((e) => e.planet === 'Ve')
    expect(ve?.effect).toBe('disturbed')
    expect(ve?.karakatvas.map((k) => k.id)).toContain('marriagePartner')
  })

  it('Venus at 4° Pisces disturbs Mercury’s education in the 4th (Cancer lagna)', () => {
    // Cancer lagna → Pisces is the 9th; check the Mercury belt effect fires.
    const p = readBeltPlacement(g('Ve', 12, 4), 4)
    expect(p.effects.some((e) => e.planet === 'Me' && e.effect === 'disturbed')).toBe(true)
    // Sagittarius lagna → Pisces is the 4th, where Mercury rules education.
    const q = readBeltPlacement(g('Ve', 12, 4), 9)
    expect(q.effects.find((e) => e.planet === 'Me')?.karakatvas.map((k) => k.id)).toContain('education')
  })

  it('Sun in Aries changes with degree', () => {
    expect(readBeltPlacement(g('Su', 1, 5), 1).standing).toBe('exalted')
    expect(readBeltPlacement(g('Su', 1, 11.5), 1).standing).toBe('friend')
    expect(readBeltPlacement(g('Su', 1, 15), 1).standing).toBe('enemy')
  })

  it('uccha / neecha abhilashi', () => {
    expect(beltMotion('Su', 5, false)).toBe('towardsExaltation')
    expect(beltMotion('Su', 358, false)).toBe('towardsExaltation')
    expect(beltMotion('Sa', 358, false)).toBe('towardsDebilitation')
    expect(beltMotion('Ra', 10, false)).toBeNull()
  })
})

describe('natal karakatva', () => {
  it('ids are unique and every row has both labels', () => {
    const ids = NATAL_KARAKATVA.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const k of NATAL_KARAKATVA) {
      expect(k.en.length).toBeGreaterThan(0)
      expect(k.hi).toMatch(/[ऀ-ॿ]/)
    }
  })

  it('holds natal rows only', () => {
    expect(NATAL_KARAKATVA.some((k) => /\b(ministry|nation|parliament)\b/i.test(k.en))).toBe(false)
    expect(karakatvasFor('Su', 9).map((k) => k.id)).toEqual(['father'])
    expect(karakatvasFor('Ju', 7).map((k) => k.id)).toEqual(['husband', 'prominence'])
  })
})

describe('chart reading', () => {
  it('builds table, placements and Sun / Venus trajectories', () => {
    const r = buildDegreeBelts(chart)!
    expect(r.table).toHaveLength(12)
    expect(r.placements).toHaveLength(9)
    expect(r.trajectories.map((t) => t.topic)).toEqual(['father', 'wife'])
    for (const t of r.trajectories) expect(t.stages.map((s) => s.stage)).toEqual(['past', 'present', 'future'])
  })

  it('Hindi text mirrors English keys', () => {
    expect(keys(DEGREE_BELTS_HI.text)).toEqual(keys(DEGREE_BELTS_EN))
    expect(keys(DEGREE_BELTS_HI.ui)).toEqual(keys(DEGREE_BELTS_UI_EN))
    expect(DEGREE_BELTS_HI.text.method).toHaveLength(DEGREE_BELTS_EN.method.length)
  })

  it('Hindi output does not leak English prose', () => {
    const r = buildDegreeBelts(chart, 'hi')!
    const strings: string[] = []
    // Enum / id fields stay English by design.
    const ENUM = new Set(['id', 'graha', 'planet', 'owner', 'kind', 'standing', 'tone', 'effect', 'motion', 'stage', 'status', 'topic', 'source', 'occupants'])
    const walk = (x: unknown) => {
      if (typeof x === 'string') strings.push(x)
      else if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => { if (!ENUM.has(k)) walk(v) })
    }
    walk(r)
    const leaks = strings.filter((s) => s.length > 3 && /[A-Za-z]{4,}/.test(s))
    expect(leaks).toEqual([])
  })
})
