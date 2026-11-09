// __tests__/engine/transitHiLeak.test.ts
// Hindi transit scrubber + moon engines must not leak long English prose when lang=hi.

import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeTransitMoment } from '@/lib/engine/transitMomentAnalysis'
import {
  buildMoonTransitFromCharts,
  buildMoonTransitReport,
  collectMoonTargets,
} from '@/lib/engine/moonTransitAnalysis'
import { analyzeSadeSati } from '@/lib/engine/sadeSati'
import { analyzeTransitAspects } from '@/lib/engine/transitAspects'
import { analyzeMoorthyNirnaya } from '@/lib/engine/moorthyNirnaya'
import { buildTransitForecast } from '@/lib/engine/transitForecast'
import { calculatePersonalTransits } from '@/lib/engine/transits'
import { buildTransitMonthCalendar, transitCalendarToHtml } from '@/lib/engine/transitCalendar'
import { analyzeD9Gochar } from '@/lib/engine/d9Gochar'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collectStrings(v, out))
  return out
}

const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/
const NUMERIC = /^[\d./\s:%+×\-—,R℞°]+$/

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (ISO_DATE.test(t)) return true
  if (NUMERIC.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every((w) => GRAHA_CODE.test(w) || /^H\d+$/.test(w) || /^R\d+$/.test(w))) return true
  if (/^(graha|lagna|upagraha|mixed|supportive|pressure|good|bad|avg)$/i.test(t)) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  extra: Partial<GrahaData> = {},
): GrahaData {
  return {
    id,
    name: id,
    lonTropical: lonSidereal,
    lonSidereal,
    latitude: 0,
    speed: id === 'Mo' ? 13.2 : 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: lonSidereal % 30,
    totalDegree: lonSidereal,
    nakshatraIndex,
    nakshatraName: String(nakshatraIndex),
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
      rashi,
      nakshatraIndex,
      degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi,
      degreeInSign: 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi,
      degreeInSign: 5,
      mrityuDegree: 0,
      distanceFromMrityu: 0,
      interpretation: null,
      remedy: null,
    },
    ...extra,
  } as GrahaData
}

function stubNatalChart(): ChartOutput {
  return {
    grahas: [
      stubGraha('Su', 5, 9, 130),
      stubGraha('Mo', 4, 7, 100),
      stubGraha('Ma', 1, 1, 15, { dignity: 'exalted' }),
      stubGraha('Me', 3, 5, 70),
      stubGraha('Ju', 9, 18, 250, { dignity: 'friend' }),
      stubGraha('Ve', 2, 3, 45),
      stubGraha('Sa', 10, 21, 290, { isRetro: true, dignity: 'enemy' }),
      stubGraha('Ra', 6, 12, 160),
      stubGraha('Ke', 12, 25, 340),
    ],
    lagnas: {
      ascDegree: 15,
      ascRashi: 1,
      ascDegreeInRashi: 15,
      horaLagna: 40,
      ghatiLagna: 70,
      bhavaLagna: 20,
      vighatiLagna: 90,
      pranapada: 110,
      sriLagna: 130,
      varnadaLagna: 150,
      induLagna: 170,
      bhriguBindu: 190,
      cusps: [],
    },
    arudhas: { AL: 4 },
    upagrahas: {
      Gulika: {
        id: 'Gulika',
        name: 'Gulika',
        lonSidereal: 55,
        rashi: 2,
        rashiName: 'Taurus',
        degree: 25,
        nakshatraName: 'Rohini',
        pada: 2,
      },
    },
  } as unknown as ChartOutput
}

function stubTransitChart(): ChartOutput {
  return {
    grahas: [
      stubGraha('Su', 4, 7, 105),
      stubGraha('Mo', 7, 15, 190),
      stubGraha('Ma', 3, 5, 75),
      stubGraha('Me', 4, 7, 110),
      stubGraha('Ju', 5, 9, 135, { dignity: 'friend' }),
      stubGraha('Ve', 6, 12, 165),
      stubGraha('Sa', 11, 22, 310, { isRetro: true, dignity: 'enemy' }),
      stubGraha('Ra', 8, 17, 220),
      stubGraha('Ke', 2, 3, 40),
    ],
    lagnas: { ascRashi: 1, ascDegree: 15 },
  } as unknown as ChartOutput
}

function collectTransitHiBlobs(): unknown[] {
  const natal = stubNatalChart()
  const transit = stubTransitChart()
  const lang = 'hi' as const
  const out: unknown[] = []

  out.push(analyzeTransitMoment(natal, transit, lang))
  out.push(collectMoonTargets(natal, lang))
  out.push(
    buildMoonTransitReport({
      natal,
      moonLon: 12,
      moonSpeedDegPerDay: 13,
      now: new Date('2026-11-03T12:00:00Z'),
      lang,
    }),
  )
  out.push(buildMoonTransitFromCharts(natal, transit, new Date('2026-11-03T12:00:00Z'), lang))
  out.push(
    analyzeSadeSati(4, {
      asOf: new Date('2026-11-03T12:00:00Z'),
      ascRashi: 1,
      lookbackYears: 2,
      lookAheadYears: 3,
      lang,
    }),
  )
  out.push(
    analyzeTransitAspects({
      ascRashi: 1,
      natalRashis: { Su: 5, Mo: 4, Ma: 1, Me: 3, Ju: 9, Ve: 2, Sa: 10, Ra: 6, Ke: 12 },
      asOf: new Date('2026-11-03T12:00:00Z'),
      months: 6,
      lang,
    }),
  )
  out.push(analyzeMoorthyNirnaya(new Date('2026-11-03T12:00:00Z'), lang))

  const cal = buildTransitMonthCalendar({
    ascRashi: 1 as Rashi,
    moonRashi: 4 as Rashi,
    year: 2026,
    month: 11,
    lang,
  })
  out.push(cal)
  out.push(transitCalendarToHtml(cal, 'परीक्षण', lang))

  out.push(
    analyzeD9Gochar({
      transitGrahas: transit.grahas.map(g => ({ id: g.id, rashi: g.rashi, lonSidereal: g.lonSidereal })),
      natalD9: natal.grahas.map(g => ({ id: g.id, rashi: g.rashi })),
      d9Lagna: 1 as Rashi,
      lang,
    }),
  )

  out.push(calculatePersonalTransits(1, new Date('2026-11-03T12:00:00Z'), 3, 'hi'))

  out.push(
    buildTransitForecast({
      natal: {
        ascRashi: 1,
        moonRashi: 4,
      },
      asOf: new Date('2026-11-03T12:00:00Z'),
      months: 6,
      lang,
    }),
  )

  return out
}

describe('Transit Hindi leak smoke', () => {
  it('scrubber + moon + sade sati + aspects + moorthy + calendar + d9 + roadmap + forecast (lang=hi) avoid English sentence leaks', () => {
    const strings = collectStrings(collectTransitHiBlobs())
    const leaks = findEnglishLeaks(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })
})
