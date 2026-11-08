// Hindi coverage for the Planets-tab sub-panels (planetsA): every English
// table entry has Hindi, ids/numbers survive, and output is Devanagari.
import { describe, expect, it } from 'vitest'
import { analyzeSunAdityas, SUN_ADITYAS, SUN_KARAKATVA, sunAdityasCatalogue } from '@/lib/engine/sunAdityas'
import { analyzeSunReadingMethod, SOLAR_MONTHS, SUN_PRACTICES, SUN_READING_PRINCIPLES } from '@/lib/engine/sunReadingMethod'
import {
  getDignityClassicalNotes, getPlanetInHouseClassicalSummary, getPlanetInSignClassicalSummary, getSpecialAspectOverview,
} from '@/lib/engine/classicalInterpretations'
import { getVakriAstSummary } from '@/lib/engine/vakriAstInterpretations'
import { getRashiCoreSummary } from '@/lib/engine/rashiInterpretations'
import {
  CLASSICAL_HOUSE_SUMMARY_HI, CLASSICAL_SIGN_SUMMARY_HI, DIGNITY_CLASSICAL_HI, RASHI_CORE_HI,
  SPECIAL_ASPECT_OVERVIEW_HI, energyStatusHi, vakriAstSummaryHi,
} from '@/lib/engine/locale/planetCard.hi'
import { SUN_KARAKATVA_HI } from '@/lib/engine/locale/sunAdityas.hi'
import { SOLAR_MONTHS_HI, SUN_PRACTICES_HI, SUN_READING_PRINCIPLES_HI } from '@/lib/engine/locale/sunReadingMethod.hi'
import { hasDevanagari, mergeHi } from '@/lib/engine/locale/planetsA.util'
import { analyzeSunHousesYuti, SUN_HOUSE_TEACHINGS, SUN_YUTI_TEACHINGS, sunHouseTeachings, sunYutiTeachings } from '@/lib/engine/sunHousesYuti'
import { analyzeMoonKalasManas, CHANDRA_KALAS, MANAS_STAGES, TRIPURA_SUNDARI_KALAS, chandraKalas, manasStages, tripuraKalas } from '@/lib/engine/moonKalasManas'
import { analyzeMars, MARS_KALAS, marsKalas } from '@/lib/engine/marsAnalysis'
import { analyzeMercury } from '@/lib/engine/mercuryAnalysis'
import { analyzeJupiter } from '@/lib/engine/jupiterAnalysis'
import { MARS_HOUSE_FOCUS_HI, MARS_KARAKATVA_HI } from '@/lib/engine/locale/marsAnalysis.hi'
import { MERCURY_HOUSE_FOCUS_HI, MERCURY_KARAKATVA_HI, MERCURY_MEDICAL_HI } from '@/lib/engine/locale/mercuryAnalysis.hi'
import { JUPITER_HOUSE_FOCUS_HI, JUPITER_KARAKATVA_HI, JUPITER_MEDICAL_HI, JUPITER_SAPTARISHI_HI } from '@/lib/engine/locale/jupiterAnalysis.hi'
import { MOON_SIGNIFICATIONS_HI, PSYCHOLOGY_NEGATIVE_HI, PSYCHOLOGY_POSITIVE_HI, TEACHING_QUOTES_HI } from '@/lib/engine/locale/moonKalasManas.hi'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'

const G9 = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const
const DIGNITIES = ['exalted', 'moolatrikona', 'own', 'great_friend', 'friend', 'neutral', 'enemy', 'great_enemy', 'debilitated']

/** All non-string leaves, in order — must match between en and hi. */
function nonText(v: unknown, out: unknown[] = []): unknown[] {
  if (typeof v === 'string') return out
  if (Array.isArray(v)) { v.forEach(x => nonText(x, out)); return out }
  if (v && typeof v === 'object') { for (const k of Object.keys(v).sort()) nonText((v as Record<string, unknown>)[k], out); return out }
  out.push(v)
  return out
}

/** Every string leaf except the listed id-like keys. */
function texts(v: unknown, skip: Set<string>, out: string[] = []): string[] {
  if (typeof v === 'string') { out.push(v); return out }
  if (Array.isArray(v)) { v.forEach(x => texts(x, skip, out)); return out }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!skip.has(k)) texts(x, skip, out)
  }
  return out
}

function g(id: GrahaData['id'], rashi: Rashi, degree: number, nak: number, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, nakshatraIndex: nak, pada: 2,
    dignity: 'neutral', isRetro: false, isCombust: false, ...extra,
  } as GrahaData
}

const chart = {
  panchang: { tithi: { number: 23, name: 'Ashtami', paksha: 'krishna' } },
  lagnas: { ascRashi: 6 },
  meta: { birthDate: '1990-05-15' },
  dashas: { vimshottari: [] },
  grahas: [
    g('Su', 2, 0.5, 2, { dignity: 'neutral' }),
    g('Mo', 8, 12, 17),
    g('Ma', 11, 5, 22),
    g('Me', 2, 10, 3, { isCombust: true }),
    g('Ju', 3, 20, 6),
    g('Ve', 1, 15, 1),
    g('Sa', 10, 2, 20),
    g('Ra', 11, 14, 23, { isRetro: true }),
    g('Ke', 5, 14, 10, { isRetro: true }),
  ],
} as unknown as ChartOutput

describe('planetsA Hindi tables', () => {
  it('classical house/sign summaries have Hindi wherever English exists', () => {
    for (const id of G9) {
      for (let n = 1; n <= 12; n++) {
        const enH = getPlanetInHouseClassicalSummary(id, n)
        const hiH = CLASSICAL_HOUSE_SUMMARY_HI[id][n - 1]
        expect(Boolean(enH), `${id} H${n}`).toBe(Boolean(hiH))
        if (hiH) expect(hasDevanagari(hiH)).toBe(true)
        const enS = getPlanetInSignClassicalSummary(id, n)
        const hiS = CLASSICAL_SIGN_SUMMARY_HI[id][n - 1]
        expect(Boolean(enS), `${id} R${n}`).toBe(Boolean(hiS))
        if (hiS) expect(hasDevanagari(hiS)).toBe(true)
      }
      expect(Boolean(getSpecialAspectOverview(id)[0]), `${id} aspect`).toBe(Boolean(SPECIAL_ASPECT_OVERVIEW_HI[id]))
      for (const [r, c] of [[true, false], [false, true], [true, true], [false, false]] as const) {
        const en = getVakriAstSummary(id, r, c)
        const hi = vakriAstSummaryHi(id, r, c)
        expect(Boolean(en), `${id} vakri ${r}/${c}`).toBe(Boolean(hi))
        if (hi) expect(hasDevanagari(hi)).toBe(true)
      }
    }
    for (const d of DIGNITIES) {
      expect(getDignityClassicalNotes(d)[0]).toBeTruthy()
      expect(hasDevanagari(DIGNITY_CLASSICAL_HI[d])).toBe(true)
    }
    for (let r = 1; r <= 12; r++) {
      expect(getRashiCoreSummary(r)).toBeTruthy()
      expect(hasDevanagari(RASHI_CORE_HI[r - 1])).toBe(true)
    }
  })

  it('energy status labels translate', () => {
    for (const s of ['Active now', 'Approaching age 24', 'Next at age 36', '2nd Lock active (29–32)', 'Next: 1st Release (24–26)', 'Pada 3: Kala Siddhi', 'Creative Fire (natal)', 'Next surfacing at age 42']) {
      expect(hasDevanagari(energyStatusHi(s)), s).toBe(true)
    }
  })

  it('Sun Adityas catalogue: same ids/numbers, all text Devanagari', () => {
    const hi = sunAdityasCatalogue('hi')
    expect(nonText(hi)).toEqual(nonText(SUN_ADITYAS))
    expect(hi.map(a => a.id)).toEqual(SUN_ADITYAS.map(a => a.id))
    for (const s of texts(hi, new Set(['id']))) expect(hasDevanagari(s), s).toBe(true)
    expect(sunAdityasCatalogue('en')).toBe(SUN_ADITYAS)
    expect(SUN_KARAKATVA_HI.length).toBe(SUN_KARAKATVA.length)
  })

  it('Sun reading tables line up with English', () => {
    expect(SOLAR_MONTHS_HI.length).toBe(SOLAR_MONTHS.length)
    SOLAR_MONTHS.forEach((m, i) => expect(Boolean(m.aditya)).toBe(Boolean(SOLAR_MONTHS_HI[i].aditya)))
    expect(SUN_PRACTICES_HI.length).toBe(SUN_PRACTICES.length)
    expect(SUN_READING_PRINCIPLES_HI.length).toBe(SUN_READING_PRINCIPLES.length)
    expect(mergeHi({ id: 'x', n: 3, t: 'a' }, { t: 'अ' })).toEqual({ id: 'x', n: 3, t: 'अ' })
  })

  it('analyzeSunAdityas: English unchanged by default, Hindi keeps ids/numbers', () => {
    const en = analyzeSunAdityas(chart)!
    expect(analyzeSunAdityas(chart, 'en')).toEqual(en)
    const hi = analyzeSunAdityas(chart, 'hi')!
    expect(nonText(hi)).toEqual(nonText(en))
    expect(hi.afflictions.map(a => a.id)).toEqual(en.afflictions.map(a => a.id))
    const skip = new Set(['id', 'dignity', 'sanskrit'])
    for (const s of texts(hi, skip)) expect(hasDevanagari(s), s).toBe(true)
  })

  it('analyzeSunReadingMethod: Hindi keeps ids/numbers and is Devanagari', () => {
    const en = analyzeSunReadingMethod(chart)!
    expect(analyzeSunReadingMethod(chart, 'en')).toEqual(en)
    const hi = analyzeSunReadingMethod(chart, 'hi')!
    expect(nonText(hi)).toEqual(nonText(en))
    const skip = new Set(['kind', 'side', 'nakshatraLord', 'signLord', 'approxBirthWindow'])
    for (const s of texts(hi, skip)) expect(hasDevanagari(s), s).toBe(true)
  })

  /** Keys that hold ids/enums (or shared English classical corpora) — not display text. */
  const ID_KEYS = new Set([
    'id', 'partner', 'kind', 'band', 'paksha', 'dignity', 'sanskrit', 'tone', 'difficulty', 'placementTone',
    'source', 'ref', 'd9DignityTone', 'possessionMode', 'side', 'nakshatraLord', 'signLord', 'approxBirthWindow',
    'classical', 'with',
  ])

  function expectAllHindi(v: unknown, label: string) {
    for (const s of texts(v, ID_KEYS)) {
      if (!s || /^[\d\s.,°–\-:/+@~()]+$/.test(s)) continue
      expect(hasDevanagari(s), `${label}: ${s}`).toBe(true)
    }
  }

  it('Sun houses & yuti catalogues: every entry has Hindi', () => {
    expect(nonText(sunHouseTeachings('hi'))).toEqual(nonText(SUN_HOUSE_TEACHINGS))
    expect(nonText(sunYutiTeachings('hi'))).toEqual(nonText(SUN_YUTI_TEACHINGS))
    expectAllHindi(sunHouseTeachings('hi'), 'sunHouses')
    expectAllHindi(sunYutiTeachings('hi').map(y => ({ ...y, sanskrit: undefined })), 'sunYuti')
    expect(sunHouseTeachings('en')).toBe(SUN_HOUSE_TEACHINGS)
  })

  it('Moon catalogues: every entry has Hindi', () => {
    expect(nonText(chandraKalas('hi'))).toEqual(nonText(CHANDRA_KALAS))
    expect(nonText(tripuraKalas('hi'))).toEqual(nonText(TRIPURA_SUNDARI_KALAS))
    expect(nonText(manasStages('hi'))).toEqual(nonText(MANAS_STAGES))
    expectAllHindi([chandraKalas('hi'), tripuraKalas('hi'), manasStages('hi')], 'moonCatalogue')
    expect(MOON_SIGNIFICATIONS_HI.length).toBe(7)
    expect(PSYCHOLOGY_POSITIVE_HI.length).toBe(9)
    expect(PSYCHOLOGY_NEGATIVE_HI.length).toBe(9)
    expect(TEACHING_QUOTES_HI.length).toBe(5)
  })

  it('Mars / Mercury / Jupiter tables cover every English entry', () => {
    expect(nonText(marsKalas('hi'))).toEqual(nonText(MARS_KALAS))
    expectAllHindi(marsKalas('hi'), 'marsKalas')
    expect(MARS_KARAKATVA_HI.length).toBe(6)
    expect(MERCURY_KARAKATVA_HI.length).toBe(4)
    expect(MERCURY_MEDICAL_HI.length).toBe(2)
    expect(JUPITER_KARAKATVA_HI.length).toBe(4)
    expect(JUPITER_MEDICAL_HI.length).toBe(2)
    expect(JUPITER_SAPTARISHI_HI.length).toBe(7)
    for (let h = 1; h <= 12; h++) {
      expect(MARS_HOUSE_FOCUS_HI[h], `mars H${h}`).toBeTruthy()
      expect(MERCURY_HOUSE_FOCUS_HI[h], `mercury H${h}`).toBeTruthy()
      expect(JUPITER_HOUSE_FOCUS_HI[h], `jupiter H${h}`).toBeTruthy()
    }
  })

  const analyzers: Array<[string, (c: ChartOutput, l?: 'en' | 'hi') => unknown]> = [
    ['sunHousesYuti', analyzeSunHousesYuti],
    ['moon', analyzeMoonKalasManas],
    ['mars', analyzeMars],
    ['mercury', analyzeMercury],
    ['jupiter', analyzeJupiter],
  ]
  for (const [name, fn] of analyzers) {
    it(`${name}: English unchanged by default, Hindi keeps ids/numbers and is Devanagari`, () => {
      const en = fn(chart) as Record<string, unknown>
      expect(en).toBeTruthy()
      expect(fn(chart, 'en')).toEqual(en)
      const hi = fn(chart, 'hi') as Record<string, unknown>
      expect(nonText(hi)).toEqual(nonText(en))
      // The yuti sanskrit labels and the shared classical corpus stay as-is.
      expectAllHindi({ ...hi, allYutis: undefined, activeYutis: undefined, vedicQuotes: undefined }, name)
    })
  }
})
