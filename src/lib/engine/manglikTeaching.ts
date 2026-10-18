// ─────────────────────────────────────────────────────────────
//  src/lib/engine/manglikTeaching.ts
//  Educational Manglik (Kuja) status + house notes for chart UI
// ─────────────────────────────────────────────────────────────

import type { ManglikAnalysis } from '@/lib/engine/doshas'
import { MANGLIK_OVERVIEW } from '@/lib/engine/houseInterpretations'

export type ManglikStatus = 'present' | 'cancelled' | 'not_present'

export interface ManglikTeaching {
  status: ManglikStatus
  /** Short badge label for UI */
  headline: string
  /** Optional house-specific teaching when Mars sits in 1/4/7/8/12 */
  houseNote: string | null
  overview: string
  /** Engine cancellation reasons (empty when none) */
  cancellationNotes: string[]
  /** Soft closing line for cancelled / clear charts */
  statusDetail: string
}

const MANGLIK_HOUSES = new Set([1, 4, 7, 8, 12])

/** Soft house lines from class teaching — educational, not fatalistic. */
const HOUSE_NOTES: Record<number, string> = {
  1: 'Mars in the 1st: strong drive and assertiveness in personality; partnership themes need conscious pacing rather than fear.',
  4: 'Mars in the 4th: heat around home, emotional security, or property matters; channel into constructive action at the roots.',
  7: 'Mars in the 7th: high energy in partnerships and contracts—clarity of boundaries softens friction more than fatalism.',
  8: 'Mars in the 8th: intensity around shared resources, crisis handling, or transformative work; judge dignity and aspects carefully.',
  12: 'Mars in the 12th: drive toward solitude, foreign settings, or behind-the-scenes effort; rest and boundaries matter.',
}

const CANCEL_SOFTEN =
  'Own-sign, exaltation, classical house×sign exceptions, or Jupiter’s influence can neutralize or soften Kuja doṣa—read the full chart, not the label alone.'

export function getManglikStatusLabel(analysis: ManglikAnalysis): ManglikStatus {
  if (analysis.isManglik) return 'present'
  if (analysis.cancellations.length > 0 && MANGLIK_HOUSES.has(analysis.house)) {
    return 'cancelled'
  }
  return 'not_present'
}

export function getManglikTeaching(analysis: ManglikAnalysis): ManglikTeaching {
  const status = getManglikStatusLabel(analysis)
  const inDoshaHouse = MANGLIK_HOUSES.has(analysis.house)
  const houseNote = inDoshaHouse ? (HOUSE_NOTES[analysis.house] ?? null) : null

  if (status === 'present') {
    const intensityBit =
      analysis.intensity === 'High'
        ? ' Intensity reads high for this placement—match carefully and weigh the whole chart.'
        : analysis.intensity === 'Low'
          ? ' Intensity reads milder—still weigh dignity, aspects, and dashā.'
          : ''
    return {
      status,
      headline: 'Present',
      houseNote,
      overview: MANGLIK_OVERVIEW,
      cancellationNotes: [],
      statusDetail: `Mars occupies the ${analysis.house}th house from Lagna (a classical Kuja house).${intensityBit}`,
    }
  }

  if (status === 'cancelled') {
    return {
      status,
      headline: 'Cancelled',
      houseNote,
      overview: MANGLIK_OVERVIEW,
      cancellationNotes: [...analysis.cancellations],
      statusDetail: CANCEL_SOFTEN,
    }
  }

  return {
    status,
    headline: 'Not present',
    houseNote: null,
    overview: MANGLIK_OVERVIEW,
    cancellationNotes: [],
    statusDetail:
      analysis.house > 0
        ? `Mars is in the ${analysis.house}th house from Lagna—outside the usual Kuja houses (1, 4, 7, 8, 12).`
        : 'Mars placement could not be resolved for this chart.',
  }
}
