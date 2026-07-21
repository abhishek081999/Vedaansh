// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ashtakavargaSodhyaGuide.ts
//  Classical readouts for Sodhya Pinda values (JHora method)
// ─────────────────────────────────────────────────────────────

import type { AshtakavargaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'

export type SodhyaStrengthBand = 'exceptional' | 'strong' | 'moderate' | 'weak'

export interface SodhyaPindaReading {
  planet: string
  name: string
  rasiPinda: number
  grahaPinda: number
  sodhyaPinda: number
  band: SodhyaStrengthBand
  bandLabel: string
  /** Approximate age indicator (classical: sodhya pinda mod 12 → year in cycle) */
  ageCycleYear: number
  reading: string
  eventNote: string
}

export interface SodhyaGuideResult {
  readings: SodhyaPindaReading[]
  strongest: SodhyaPindaReading | null
  weakest: SodhyaPindaReading | null
  summary: string
}

const PLANETS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

function bandForPinda(pinda: number, all: number[]): SodhyaStrengthBand {
  const sorted = [...all].sort((a, b) => b - a)
  const rank = sorted.indexOf(pinda)
  if (rank === 0) return 'exceptional'
  if (rank <= 2) return 'strong'
  if (rank >= sorted.length - 2) return 'weak'
  return 'moderate'
}

const BAND_LABELS: Record<SodhyaStrengthBand, string> = {
  exceptional: 'Exceptional potency',
  strong: 'Strong delivery',
  moderate: 'Moderate expression',
  weak: 'Reduced delivery',
}

const SIGNIFICATIONS: Record<string, string> = {
  Su: 'authority, father, vitality',
  Mo: 'mind, mother, public',
  Ma: 'courage, property, siblings',
  Me: 'intellect, commerce, speech',
  Ju: 'wisdom, children, dharma',
  Ve: 'relationships, comforts, arts',
  Sa: 'discipline, longevity, karma',
}

function eventNoteFor(planet: string, band: SodhyaStrengthBand, ageYear: number): string {
  const sig = SIGNIFICATIONS[planet] ?? 'significations'
  if (band === 'exceptional' || band === 'strong') {
    return `Favorable for ${sig} when dasha/transit aligns. Age-cycle year ${ageYear} may mark notable ${sig} events.`
  }
  if (band === 'weak') {
    return `Results for ${sig} need stronger dasha support. Age-cycle year ${ageYear} warrants careful timing.`
  }
  return `Mixed delivery for ${sig}; combine with BAV gochar and dasha for timing. Cycle year ${ageYear}.`
}

export function analyzeSodhyaPindas(ashtakavarga: AshtakavargaResult): SodhyaGuideResult | null {
  if (!ashtakavarga.sodhyaPindas) return null

  const pindas = PLANETS.map((p) => ashtakavarga.sodhyaPindas![p].sodhyaPinda)
  const readings: SodhyaPindaReading[] = PLANETS.map((planet) => {
    const row = ashtakavarga.sodhyaPindas![planet]
    const band = bandForPinda(row.sodhyaPinda, pindas)
    const ageCycleYear = row.sodhyaPinda % 12 || 12
    const name = GRAHA_NAMES[planet as keyof typeof GRAHA_NAMES] ?? planet
    return {
      planet,
      name,
      rasiPinda: row.rasiPinda,
      grahaPinda: row.grahaPinda,
      sodhyaPinda: row.sodhyaPinda,
      band,
      bandLabel: BAND_LABELS[band],
      ageCycleYear,
      reading: `${name} Sodhya Pinda ${row.sodhyaPinda} (${BAND_LABELS[band].toLowerCase()}). Rasi ${row.rasiPinda} + Graha ${row.grahaPinda}.`,
      eventNote: eventNoteFor(planet, band, ageCycleYear),
    }
  })

  const sorted = [...readings].sort((a, b) => b.sodhyaPinda - a.sodhyaPinda)
  const strongest = sorted[0] ?? null
  const weakest = sorted[sorted.length - 1] ?? null

  const summary = strongest && weakest
    ? `Strongest sodhya delivery: ${strongest.name} (${strongest.sodhyaPinda}). Weakest: ${weakest.name} (${weakest.sodhyaPinda}). Use with reduced BAV for event timing.`
    : 'Sodhya Pinda analysis requires recalculated chart data.'

  return { readings, strongest, weakest, summary }
}
