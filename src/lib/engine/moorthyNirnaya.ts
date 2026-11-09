// ─────────────────────────────────────────────────────────────
//  src/lib/engine/moorthyNirnaya.ts
//  Moorthy Nirnaya for Ju/Sa gochar — weekday of sign ingress
//  Weekday lord → metal: Su/Ju gold, Mo/Ve silver, Ma copper, Me/Sa iron
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { buildPlanetSignTimeline } from '@/lib/engine/transitAspects'
import { dateToJD, jdToDate } from '@/lib/engine/ephemeris'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { MOORTHY_HI, MOORTHY_METAL_HI, MOORTHY_WEEKDAY_HI } from '@/lib/engine/locale/moorthyNirnaya.hi'

export type MoorthyMetal = 'swarna' | 'rajata' | 'tamra' | 'loha'

export type MoorthyTone = 'supportive' | 'mixed' | 'caution'

export interface MoorthyResult {
  planetId: 'Ju' | 'Sa'
  planetName: string
  metal: MoorthyMetal
  metalLabel: string
  tone: MoorthyTone
  weekday: string
  weekdayLord: GrahaId
  ingressIso: string
  rashi: Rashi
  rashiName: string
  summary: string
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const WEEKDAY_LORDS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const METAL_META: Record<MoorthyMetal, { label: string; tone: MoorthyTone; blurb: string }> = {
  swarna: {
    label: 'Swarna (Gold)',
    tone: 'supportive',
    blurb: 'Strongly supportive delivery of the transit’s house themes.',
  },
  rajata: {
    label: 'Rajata (Silver)',
    tone: 'supportive',
    blurb: 'Generally favourable — results come with steadiness.',
  },
  tamra: {
    label: 'Tamra (Copper)',
    tone: 'mixed',
    blurb: 'Mixed / effortful — gains after friction or delay.',
  },
  loha: {
    label: 'Loha (Iron)',
    tone: 'caution',
    blurb: 'Heavier moorthy — discipline required; confirm with dasha.',
  },
}

/** Map weekday lord → Moorthy metal. */
export function moorthyMetalFromWeekdayLord(lord: GrahaId): MoorthyMetal {
  if (lord === 'Su' || lord === 'Ju') return 'swarna'
  if (lord === 'Mo' || lord === 'Ve') return 'rajata'
  if (lord === 'Ma') return 'tamra'
  return 'loha' // Me, Sa
}

export function moorthyFromIngressDate(
  ingress: Date,
  lang: EngineLang = 'en',
): {
  metal: MoorthyMetal
  metalLabel: string
  tone: MoorthyTone
  weekday: string
  weekdayLord: GrahaId
  blurb: string
} {
  const dow = ingress.getUTCDay() // 0 = Sunday
  const weekdayLord = WEEKDAY_LORDS[dow]
  const metal = moorthyMetalFromWeekdayLord(weekdayLord)
  const meta = METAL_META[metal]
  const hi = lang === 'hi' ? MOORTHY_METAL_HI[metal] : null
  return {
    metal,
    metalLabel: hi?.label ?? meta.label,
    tone: meta.tone,
    weekday: lang === 'hi' ? MOORTHY_WEEKDAY_HI[dow] : WEEKDAY_NAMES[dow],
    weekdayLord,
    blurb: hi?.blurb ?? meta.blurb,
  }
}

function utcNoon(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Moorthy for Ju/Sa in their current signs at `asOf`,
 * using weekday of the most recent ingress into that sign.
 */
export function analyzeMoorthyNirnaya(
  asOf: Date = new Date(),
  lang: EngineLang = 'en',
): MoorthyResult[] {
  const now = utcNoon(asOf)
  const lookbackStart = new Date(now)
  lookbackStart.setUTCFullYear(lookbackStart.getUTCFullYear() - 4)
  const lookAheadEnd = new Date(now)
  lookAheadEnd.setUTCMonth(lookAheadEnd.getUTCMonth() + 1)

  const nowJd = dateToJD(now)
  const results: MoorthyResult[] = []

  for (const pid of ['Ju', 'Sa'] as const) {
    const timeline = buildPlanetSignTimeline(pid, lookbackStart, lookAheadEnd)
    const current = timeline.find(s => nowJd >= s.startJd && nowJd < s.endJd)
      ?? timeline[timeline.length - 1]
    if (!current) continue

    const ingress = jdToDate(current.startJd)
    const m = moorthyFromIngressDate(utcNoon(ingress), lang)
    const rashi = current.rashi
    const planetName = lang === 'hi' ? gName(pid, 'hi') : GRAHA_NAMES[pid]
    const rashiName = lang === 'hi' ? rName(rashi, 'hi') : RASHI_NAMES[rashi]
    const summary =
      lang === 'hi'
        ? fill(MOORTHY_HI.summary, {
            planet: planetName,
            rashi: rashiName,
            weekday: m.weekday,
            metal: m.metalLabel,
            blurb: m.blurb,
          })
        : `${planetName} entered ${rashiName} on ${m.weekday} → ${m.metalLabel}. ${m.blurb}`
    results.push({
      planetId: pid,
      planetName,
      metal: m.metal,
      metalLabel: m.metalLabel,
      tone: m.tone,
      weekday: m.weekday,
      weekdayLord: m.weekdayLord,
      ingressIso: toIsoDate(ingress),
      rashi,
      rashiName,
      summary,
    })
  }

  return results
}
