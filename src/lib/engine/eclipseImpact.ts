// ─────────────────────────────────────────────────────────────
//  src/lib/engine/eclipseImpact.ts
//  How an eclipse (grahan) falls on one natal chart: the house it
//  occupies from the Lagna and the Moon, natal points it touches,
//  and whether it falls in the janma nakshatra or janma rashi.
//
//  Pure — the eclipse list comes from eclipses.ts (server, sweph);
//  this runs anywhere, including the browser.
//
//  Eclipse degrees are Lahiri. Charts cast with another ayanamsha
//  differ by at most ~1.5°, well inside the orbs used here.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { GRAHA_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { ECLIPSE_HOUSE_THEMES_HI, ECLIPSE_IMPACT_HI, ORDINAL_HI, ORDINAL_OBLIQUE_HI } from '@/lib/engine/locale/eclipseImpact.hi'

/** The fields of EclipseInfo this module reads (kept structural so the client needs no sweph types). */
export interface EclipseForImpact {
  kind: 'solar' | 'lunar'
  type: string
  max: string
  sign: Rashi
  longitude: number
  local: { visible: boolean; sutakStart?: string }
}

export type EclipseImpactLevel = 'high' | 'moderate' | 'low'

export interface EclipseNatalHit {
  /** Natal graha id, or 'La' for the Lagna. */
  point: GrahaId | 'La'
  name: string
  /** Which eclipse body is on it: the eclipsed Moon, or the Sun (solar: both at one point). */
  by: 'sun' | 'moon'
  orb: number
}

export interface EclipseImpact {
  /** House of the eclipse point counted from the natal Lagna sign (Moon's point for lunar eclipses). */
  houseFromLagna: number
  houseFromMoon: number
  /** For a lunar eclipse, the Sun's house (opposite) from the Lagna. */
  sunHouseFromLagna: number | null
  janmaNakshatra: boolean
  janmaRashi: boolean
  hits: EclipseNatalHit[]
  level: EclipseImpactLevel
  /** Plain-language lines, in order: placement, special notes, visibility, advice. */
  lines: string[]
  theme: string
}

/** Orb (degrees) for an eclipse point to "touch" a natal point. */
export const ECLIPSE_ORB = 5

const HOUSE_THEMES_EN: Record<number, string> = {
  1: 'body, health and self-image',
  2: 'money, speech and family',
  3: 'courage, effort, siblings and short journeys',
  4: 'home, mother, peace of mind and property',
  5: 'children, study, creativity and romance',
  6: 'health routines, debts, disputes and service',
  7: 'spouse, partnerships and contracts',
  8: 'sudden change, shared money and hidden matters',
  9: 'fortune, teachers, dharma and long journeys',
  10: 'career, status and public standing',
  11: 'income, gains, friends and wishes',
  12: 'expenses, foreign lands, sleep and spiritual practice',
}

const POINTS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const norm360 = (x: number) => ((x % 360) + 360) % 360
const sep = (a: number, b: number) => {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}
const signOfLon = (lon: number) => (Math.floor(norm360(lon) / 30) + 1) as Rashi
const houseFrom = (fromSign: number, sign: number) => ((sign - fromSign + 12) % 12) + 1

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

function pointName(id: GrahaId | 'La', lang: EngineLang): string {
  if (id === 'La') return lang === 'hi' ? ECLIPSE_IMPACT_HI.lagnaPoint : 'Lagna'
  return lang === 'hi' ? GRAHA_HI[id] ?? id : GRAHA_NAMES[id] ?? id
}

export function eclipseImpact(eclipse: EclipseForImpact, chart: ChartOutput, lang: EngineLang = 'en'): EclipseImpact {
  const hi = lang === 'hi'
  const moonPoint = norm360(eclipse.longitude)
  const sunPoint = eclipse.kind === 'solar' ? moonPoint : norm360(moonPoint + 180)
  const eclSign = signOfLon(moonPoint)
  const ascSign = chart.lagnas.ascRashi
  const natalMoon = chart.grahas.find((g) => g.id === 'Mo')

  const houseFromLagna = houseFrom(ascSign, eclSign)
  const houseFromMoon = natalMoon ? houseFrom(natalMoon.rashi, eclSign) : houseFromLagna
  const sunHouseFromLagna = eclipse.kind === 'lunar' ? houseFrom(ascSign, signOfLon(sunPoint)) : null

  const eclNak = getNakshatra(moonPoint).index
  const janmaNakshatra = !!natalMoon && natalMoon.nakshatraIndex === eclNak
  const janmaRashi = !!natalMoon && natalMoon.rashi === eclSign

  const hits: EclipseNatalHit[] = []
  const check = (id: GrahaId | 'La', lon: number) => {
    const bodies: Array<['sun' | 'moon', number]> =
      eclipse.kind === 'solar' ? [['sun', sunPoint]] : [['moon', moonPoint], ['sun', sunPoint]]
    for (const [by, p] of bodies) {
      const orb = sep(lon, p)
      if (orb <= ECLIPSE_ORB) hits.push({ point: id, name: pointName(id, lang), by, orb: Math.round(orb * 10) / 10 })
    }
  }
  for (const id of POINTS) {
    const g = chart.grahas.find((x) => x.id === id)
    if (g) check(id, g.lonSidereal)
  }
  check('La', chart.lagnas.ascDegree)
  hits.sort((a, b) => a.orb - b.orb)

  const personal = new Set<GrahaId | 'La'>(['Su', 'Mo', 'La'])
  const closePersonal = hits.some((h) => personal.has(h.point) && h.orb <= 3)
  const sensitiveHouse = [1, 8].includes(houseFromLagna) || [1, 8].includes(houseFromMoon)
  const rawLevel: EclipseImpactLevel =
    janmaNakshatra || closePersonal
      ? 'high'
      : janmaRashi || hits.length > 0 || sensitiveHouse
        ? 'moderate'
        : 'low'
  // A penumbral lunar eclipse only dims the Moon; tradition does not count it as a full grahan.
  const penumbral = eclipse.type === 'penumbral'
  const level: EclipseImpactLevel = penumbral ? (rawLevel === 'high' ? 'moderate' : 'low') : rawLevel
  const visibility: 'sutak' | 'noSutak' | 'notVisible' = !eclipse.local.visible
    ? 'notVisible'
    : eclipse.local.sutakStart ? 'sutak' : 'noSutak'

  const theme = hi ? ECLIPSE_HOUSE_THEMES_HI[houseFromLagna] : HOUSE_THEMES_EN[houseFromLagna]
  const lines: string[] = []
  if (hi) {
    lines.push(fill(ECLIPSE_IMPACT_HI.fromLagna, { house: ORDINAL_HI[houseFromLagna], theme }))
    lines.push(fill(ECLIPSE_IMPACT_HI.fromMoon, { house: ORDINAL_HI[houseFromMoon] }))
    if (sunHouseFromLagna) lines.push(fill(ECLIPSE_IMPACT_HI.axis, { a: ORDINAL_OBLIQUE_HI[houseFromLagna], b: ORDINAL_OBLIQUE_HI[sunHouseFromLagna] }))
    if (janmaNakshatra) lines.push(fill(ECLIPSE_IMPACT_HI.janmaNakshatra, { nak: NAKSHATRA_HI[eclNak] ?? '' }))
    else if (janmaRashi) lines.push(ECLIPSE_IMPACT_HI.janmaRashi)
    for (const h of hits) lines.push(fill(ECLIPSE_IMPACT_HI.hit, { point: h.name, orb: h.orb }))
    lines.push(ECLIPSE_IMPACT_HI[visibility])
    lines.push(level === 'high' ? ECLIPSE_IMPACT_HI.adviceHigh : level === 'moderate' ? ECLIPSE_IMPACT_HI.adviceModerate : ECLIPSE_IMPACT_HI.adviceLow)
  } else {
    lines.push(`${ordinal(houseFromLagna)} house from your Lagna: ${theme}.`)
    lines.push(`${ordinal(houseFromMoon)} house from your Moon.`)
    if (sunHouseFromLagna) lines.push(`The eclipse axis runs across your ${ordinal(houseFromLagna)} and ${ordinal(sunHouseFromLagna)} houses.`)
    if (janmaNakshatra) {
      lines.push(`This eclipse falls in your birth nakshatra (${getNakshatra(moonPoint).name}). Tradition treats this as the most sensitive case: avoid watching the eclipse and spend it in japa or meditation.`)
    } else if (janmaRashi) {
      lines.push('This eclipse falls in your birth sign (Moon sign), so it may be felt more strongly in your mood and emotions.')
    }
    for (const h of hits) lines.push(`The eclipse point is within ${h.orb}° of your natal ${h.name}.`)
    lines.push(visibility === 'sutak'
      ? 'It is visible from your place, so the sutak rules apply.'
      : visibility === 'noSutak'
        ? 'It is visible from your place, but a penumbral eclipse only dims the Moon, so tradition applies no sutak.'
        : 'It is not visible from your place. Tradition applies no sutak and treats the effect as lighter.')
    lines.push(level === 'high'
      ? 'Avoid starting major new ventures in the days around the eclipse, do japa during it, and bathe and give in charity afterwards.'
      : level === 'moderate'
        ? 'Put off hasty decisions about this area of life and spend the eclipse period in quiet practice.'
        : 'Its effect on your chart is light. Following the usual eclipse customs is enough.')
  }

  return { houseFromLagna, houseFromMoon, sunHouseFromLagna, janmaNakshatra, janmaRashi, hits, level, lines, theme }
}
