// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraDeepGuide/localize.ts
//  Merge English deep guide with Hindi overlay. List lengths must
//  match; otherwise English stays. Name / yoni use jyotish glossary.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_HI, termHi } from '@/i18n/jyotish'
import type { NakshatraDeepGuideHi } from '@/lib/engine/locale/nakshatraDeepGuide/types'
import type { NakshatraDeepGuide, NakshatraGuidePlanet } from './types'

const PLANETS: NakshatraGuidePlanet[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function list(en: string[], hi: string[] | undefined): string[] {
  return hi && hi.length === en.length ? hi : en
}

function mapSigns(en: string): string {
  return en
    .split(/(–|-)/)
    .map((part) => {
      const t = part.trim()
      if (t === '–' || t === '-') return '–'
      return termHi(t) || t
    })
    .join('')
}

function mapSpan(en: string): string {
  // "0°00′–13°20′ Aries" → keep degrees, Hindi rashi
  return en.replace(
    /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/g,
    (m) => termHi(m),
  )
}

export function localizeNakshatraDeepGuide(
  en: NakshatraDeepGuide,
  hi: NakshatraDeepGuideHi | undefined,
): NakshatraDeepGuide {
  if (!hi) {
    return {
      ...en,
      name: NAKSHATRA_HI[en.index] ?? en.name,
      signs: mapSigns(en.signs),
      degreeSpan: mapSpan(en.degreeSpan),
      lordName: termHi(en.lordName),
      yoni: termHi(en.yoni),
      padas: en.padas.map((p) => ({
        ...p,
        span: mapSpan(p.span),
        navamsa: termHi(p.navamsa),
      })) as NakshatraDeepGuide['padas'],
    }
  }

  const planetEffects: NakshatraDeepGuide['planetEffects'] = {}
  for (const id of PLANETS) {
    const e = en.planetEffects[id]
    if (!e) continue
    planetEffects[id] = hi.planetEffects[id] ?? e
  }

  const planetPadaResults: NakshatraDeepGuide['planetPadaResults'] = {}
  for (const id of PLANETS) {
    const e = en.planetPadaResults[id]
    if (!e) continue
    const h = hi.planetPadaResults[id]
    planetPadaResults[id] = h && h.length === 4 ? h : e
  }

  return {
    ...en,
    name: NAKSHATRA_HI[en.index] ?? en.name,
    keyword: hi.keyword,
    degreeSpan: hi.degreeSpan,
    signs: hi.signs,
    lordName: hi.lordName,
    deity: hi.deity,
    symbol: hi.symbol,
    yoni: hi.yoni,
    colour: hi.colour,
    bodyPart: hi.bodyPart,
    theory: list(en.theory, hi.theory),
    deityNotes: list(en.deityNotes, hi.deityNotes),
    rulerNotes: list(en.rulerNotes, hi.rulerNotes),
    rashiNotes: list(en.rashiNotes, hi.rashiNotes),
    symbolNotes: list(en.symbolNotes, hi.symbolNotes),
    mythology: list(en.mythology, hi.mythology),
    animalNotes: list(en.animalNotes, hi.animalNotes),
    doshaNotes: list(en.doshaNotes, hi.doshaNotes),
    lagnaNotes: hi.lagnaNotes,
    planetEffects,
    padas: [
      { pada: 1, ...hi.padas[0] },
      { pada: 2, ...hi.padas[1] },
      { pada: 3, ...hi.padas[2] },
      { pada: 4, ...hi.padas[3] },
    ],
    planetPadaResults,
  }
}
