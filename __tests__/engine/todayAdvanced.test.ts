// ─────────────────────────────────────────────────────────────
//  __tests__/engine/todayAdvanced.test.ts
//  Kakshya timing, Sudarshana agreement and the personalised hora
//  timeline. Pure inputs, no ephemeris.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import type { DashaDay, GocharRow, MoonDay, TodayPanchangInput, TodayTransitGraha } from '@/lib/engine/todayReading'
import { buildTodayAdvanced, type AdvancedNatalInput } from '@/lib/engine/todayAdvanced'
import { KAKSHYA_SPAN_DEG } from '@/lib/engine/ashtakavargaKakshya'

const NOW = new Date('2026-10-24T08:00:00Z')

function natalGraha(id: GrahaId, rashi: Rashi, extra: Partial<GrahaData> = {}): GrahaData {
  return { id, rashi, degree: 10, lonSidereal: (rashi - 1) * 30 + 10, nakshatraIndex: 0, dignity: 'neutral', isCombust: false, isRetro: false, ...extra } as unknown as GrahaData
}

function tGraha(id: GrahaId, rashi: Rashi, degree: number, extra: Partial<TodayTransitGraha> = {}): TodayTransitGraha {
  return { id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, nakshatraIndex: 0, nakshatraName: 'N', pada: 1, isRetro: false, dignity: 'neutral', speed: 13, ...extra }
}

const zeros = () => Array(12).fill(0) as number[]

/** Aries lagna, Moon in Taurus, Sun in Leo. */
function natal(prastara?: AdvancedNatalInput['ashtakavarga'] extends infer A ? (A extends { prastara?: infer P } ? P : never) : never): AdvancedNatalInput {
  const bav: Record<string, { bindus: number[] }> = {}
  for (const p of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']) bav[p] = { bindus: Array(12).fill(4) as number[] }
  return {
    lagnas: { ascRashi: 1 },
    grahas: [
      natalGraha('Su', 5), natalGraha('Mo', 2), natalGraha('Ma', 1), natalGraha('Me', 5),
      natalGraha('Ju', 4), natalGraha('Ve', 2, { dignity: 'own' }), natalGraha('Sa', 7, { dignity: 'exalted' }),
      natalGraha('Ra', 11), natalGraha('Ke', 5),
    ],
    ashtakavarga: { bav, sav: Array(12).fill(28) as number[], prastara },
  }
}

function moon(): MoonDay {
  return { rashi: 2, rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, chandraPosition: 1, chandraQuality: 'avg', chandraNote: '', lagnaHouse: 2, lagnaTheme: '', overNatal: [], signChange: null }
}

function row(planet: GrahaId, status: GocharRow['status'], fromMoon: number): GocharRow {
  return { planet: planet as GocharRow['planet'], planetName: planet, rashiName: '', fromMoon, fromLagna: fromMoon, status, isRetro: false, note: '', delta: 0 }
}

const noDasha: DashaDay[] = []

function panchang(over: Partial<TodayPanchangInput> = {}): TodayPanchangInput {
  return {
    date: '2026-10-24', vara: { number: 6, name: 'Saturday', lord: 'Sa' },
    sunrise: '2026-10-24T00:30:00Z', sunset: '2026-10-24T12:30:00Z',
    rahuKalam: { start: '2026-10-24T09:00:00Z', end: '2026-10-24T10:30:00Z' },
    yamaganda: { start: '2026-10-24T01:00:00Z', end: '2026-10-24T02:00:00Z' },
    gulikaKalam: { start: '2026-10-24T03:00:00Z', end: '2026-10-24T04:00:00Z' },
    abhijitMuhurta: null,
    horaTable: [
      { lord: 'Ju', start: '2026-10-24T06:00:00Z', end: '2026-10-24T07:00:00Z' }, // past
      { lord: 'Ve', start: '2026-10-24T07:30:00Z', end: '2026-10-24T08:30:00Z' }, // current
      { lord: 'Su', start: '2026-10-24T09:00:00Z', end: '2026-10-24T10:00:00Z' }, // inside Rahu Kalam
      { lord: 'Mo', start: '2026-10-24T11:00:00Z', end: '2026-10-24T12:00:00Z' },
    ],
    choghadiya: { day: [], night: [] },
    ...over,
  }
}

function sky(over: Partial<Record<GrahaId, TodayTransitGraha>> = {}): TodayTransitGraha[] {
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  const base = Object.fromEntries(ids.map(id => [id, tGraha(id, 2, 10)])) as Record<GrahaId, TodayTransitGraha>
  return Object.values({ ...base, ...over })
}

function run(over: Partial<Parameters<typeof buildTodayAdvanced>[0]> = {}) {
  return buildTodayAdvanced({
    natal: natal(), transit: sky(), panchang: panchang(),
    reading: { moon: moon(), gochar: [], dasha: noDasha }, now: NOW, ...over,
  })
}

describe('kakshya', () => {
  it('is null when the chart has no Ashtakavarga', () => {
    const n = natal(); delete n.ashtakavarga
    expect(run({ natal: n }).kakshya).toBeNull()
  })

  it('finds the kakshya lord from the degree and reads the Prastara bindu', () => {
    // 2° of a sign is the first kakshya (Saturn). Saturn has a bindu there in Taurus (index 1).
    const bindu = zeros(); bindu[1] = 1
    const withBindu = run({
      natal: natal({ Sa: { byContributor: { Sa: bindu } } }),
      transit: sky({ Sa: tGraha('Sa', 2, 2) }),
    }).kakshya!.rows.find(r => r.planet === 'Sa')!
    expect(withBindu.kakshyaLord).toBe('Saturn')
    expect(withBindu.hasBindu).toBe(true)

    const without = run({
      natal: natal({ Sa: { byContributor: { Sa: zeros() } } }),
      transit: sky({ Sa: tGraha('Sa', 2, 2) }),
    }).kakshya!.rows.find(r => r.planet === 'Sa')!
    expect(without.hasBindu).toBe(false)
    expect(without.note).toMatch(/held back/)
  })

  it('reports hasBindu as null (not false) when Prastara is missing', () => {
    const r = run().kakshya!.rows.find(x => x.planet === 'Ju')!
    expect(r.hasBindu).toBeNull()
  })

  it('walks the Moon through consecutive kakshya windows over 24 hours', () => {
    // Moon at 10° Taurus, 13°/day. Bindus from Mars (7.5–11.25°) and Venus (15–18.75°) only.
    const bindu = zeros(); bindu[1] = 1
    const k = run({
      natal: natal({ Mo: { byContributor: { Ma: bindu, Ve: bindu } } }),
      transit: sky({ Mo: tGraha('Mo', 2, 10) }),
    }).kakshya!
    expect(k.moonWindows.map(w => w.favourable)).toEqual([true, false, true, false])
    expect(k.moonWindows.map(w => w.kakshyaLord)[0]).toBe('Mars')
    expect(k.moonWindows[0].current).toBe(true)
    // First boundary is the next multiple of 3.75°, i.e. 11.25°: (1.25° / 13°) of a day.
    const firstHours = (Date.parse(k.moonWindows[0].endIso) - NOW.getTime()) / 3_600_000
    expect(firstHours).toBeCloseTo((11.25 - 10) / 13 * 24, 1)
    expect(KAKSHYA_SPAN_DEG).toBe(3.75)
    // Windows are contiguous and cover 24h.
    for (let i = 1; i < k.moonWindows.length; i++) expect(k.moonWindows[i].startIso).toBe(k.moonWindows[i - 1].endIso)
    expect(Date.parse(k.moonWindows[k.moonWindows.length - 1].endIso) - NOW.getTime()).toBe(24 * 3_600_000)
  })
})

describe('sudarshana', () => {
  it('counts how many of Lagna, Moon and Sun lenses support a planet', () => {
    // Lagna Aries, Moon Taurus, Sun Leo. Jupiter in Pisces: 12th from Lagna, 11th from Moon, 8th from Sun.
    // Jupiter favourable houses: 2, 5, 7, 9, 11 -> only the Moon lens.
    const r = run({
      transit: sky({ Ju: tGraha('Ju', 12, 5) }),
      reading: { moon: moon(), gochar: [row('Ju', 'favourable', 11)], dasha: noDasha },
    }).sudarshana.rows.find(x => x.planet === 'Ju')!
    expect(r.houses).toEqual({ lagna: 12, moon: 11, sun: 8 })
    expect(r.good).toBe(1)
    expect(r.verdict).toBe('Mostly testing')
  })

  it('treats a Vedha-blocked Moon lens as not supportive', () => {
    const r = run({
      transit: sky({ Ju: tGraha('Ju', 12, 5) }),
      reading: { moon: moon(), gochar: [row('Ju', 'vedha', 11)], dasha: noDasha },
    }).sudarshana.rows.find(x => x.planet === 'Ju')!
    expect(r.good).toBe(0)
    expect(r.verdict).toBe('Confirmed testing')
  })

  it('flags planets confirmed by all three lenses', () => {
    // Venus in Taurus: 2nd from Lagna, 1st from Moon, 10th from Sun. Venus favourable: 1,2,3,4,5,8,9,11,12 -> 2 of 3 (10th is not).
    // Mercury in Gemini: 3rd from Lagna, 2nd from Moon, 11th from Sun. Mercury favourable: 2,4,6,8,10,11 -> Moon and Sun only.
    // Saturn in Aries: 1st / 12th / 8th - none of 3,6,11.
    const out = run({
      transit: sky({ Ve: tGraha('Ve', 2, 5), Sa: tGraha('Sa', 1, 5) }),
      reading: { moon: moon(), gochar: [row('Ve', 'favourable', 1), row('Sa', 'unfavourable', 12)], dasha: noDasha },
    }).sudarshana
    const ve = out.rows.find(x => x.planet === 'Ve')!
    const sa = out.rows.find(x => x.planet === 'Sa')!
    expect(ve.good).toBe(2)
    expect(sa.verdict).toBe('Confirmed testing')
    expect(out.summary.join(' ')).toMatch(/Saturn.*testing from all three/)
  })
})

describe('day timeline', () => {
  it('is null without a hora table', () => {
    expect(run({ panchang: panchang({ horaTable: undefined }) }).timeline).toBeNull()
  })

  it('marks past and current horas and penalises a hora inside Rahu Kalam', () => {
    const t = run().timeline!
    const [ju, ve, su] = t.segments
    expect(ju.past).toBe(true)
    expect(ve.current).toBe(true)
    expect(su.avoid).toBe(true)
    expect(su.notes).toContain('Rahu Kalam')
    expect(su.score).toBeLessThan(ve.score)
  })

  it('never recommends an avoid-window hora and ranks best upcoming horas', () => {
    const t = run().timeline!
    expect(t.best.every(b => !b.avoid && !b.past)).toBe(true)
    expect(t.best.some(b => b.lord === 'Su')).toBe(false)
  })

  it('matches activities to the hora of your own house lord', () => {
    // Aries lagna: 7th house is Libra, ruled by Venus, and Venus hora is running now.
    const t = run().timeline!
    const love = t.activities.find(a => a.activity === 'Partnership & love')!
    expect(love.slot?.lord).toBe('Ve')
    expect(love.why).toMatch(/lord of your 7th house/)
  })

  it('says so when no suitable hora remains', () => {
    const t = run({ panchang: panchang({ horaTable: [{ lord: 'Su', start: '2026-10-24T09:00:00Z', end: '2026-10-24T10:00:00Z' }] }) }).timeline!
    const study = t.activities.find(a => a.activity === 'Study & communication')!
    expect(study.slot).toBeNull()
    expect(study.why).toMatch(/No clear hora/)
  })
})
