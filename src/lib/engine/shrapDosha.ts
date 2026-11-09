// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrapDosha.ts
//  Shrap / Dosha analysis desk orchestrator (Sections 2–5)
//  Pure engine — no React/DB. Commercial Kal Sarp is not scored.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { SHRAP_HI } from '@/lib/engine/locale/shrapDosha.hi'
import { tx } from '@/lib/engine/shrap/helpers'
import {
  analyzeMatruDosha,
  analyzePitruDosha,
} from '@/lib/engine/shrap/pitruMatru'
import {
  analyzeBrahminDosha,
  analyzeGuruDosha,
  analyzeSarpaDosha,
  analyzeStriKanyaDosha,
  KAL_SARP_TEACHING,
} from '@/lib/engine/shrap/sarpaGuruStri'
import {
  analyzeAddictionSignatures,
  analyzeChildrenFocus,
  type AddictionReading,
  type ChildrenFocusReading,
} from '@/lib/engine/shrap/childrenAddiction'
import {
  analyzeJupiterRemedyTiming,
  analyzeLendingRisk,
  type JupiterRemedyReading,
  type LendingReading,
} from '@/lib/engine/shrap/financeJupiter'
import type { ShrapDoshaVerdict, ShrapSeverity } from '@/lib/engine/shrap/helpers'

export type { ShrapDoshaVerdict, ShrapSeverity, ShrapIndicator } from '@/lib/engine/shrap/helpers'
export type { AddictionReading, ChildrenFocusReading } from '@/lib/engine/shrap/childrenAddiction'
export type { JupiterRemedyReading, LendingReading } from '@/lib/engine/shrap/financeJupiter'
export { KAL_SARP_TEACHING }

export interface ShrapSummaryRow {
  id: string
  label: string
  primaryPlanet: string
  primaryHouse: string
  keyRemedy: string
  severity: ShrapSeverity
  present: boolean
}

export interface ShrapDoshaResult {
  headline: string
  overview: string
  teachingNote: string
  doshas: ShrapDoshaVerdict[]
  summaryRows: ShrapSummaryRow[]
  presentCount: number
  childrenFocus: ChildrenFocusReading | null
  addiction: AddictionReading | null
  lending: LendingReading | null
  jupiterRemedy: JupiterRemedyReading | null
  /** Unified remedy list drawn from active doshas + Jupiter timing */
  prioritizedRemedies: string[]
}

export function analyzeShrapDosha(
  chart: ChartOutput,
  now = Date.now(),
  lang: EngineLang = 'en',
): ShrapDoshaResult | null {
  if (!chart.lagnas?.ascRashi || !chart.grahas?.length) return null

  const doshas: ShrapDoshaVerdict[] = [
    analyzePitruDosha(chart, lang),
    analyzeMatruDosha(chart, lang),
    analyzeSarpaDosha(chart, lang),
    analyzeGuruDosha(chart, lang),
    analyzeBrahminDosha(chart, lang),
    analyzeStriKanyaDosha(chart, lang),
  ]

  const summaryRows: ShrapSummaryRow[] = doshas.map(d => ({
    id: d.id,
    label: d.label,
    primaryPlanet: d.primaryPlanet,
    primaryHouse: d.primaryHouse,
    keyRemedy: d.keyRemedy,
    severity: d.severity,
    present: d.present,
  }))

  const present = doshas.filter(d => d.present)
  const presentCount = present.length
  const strong = present.filter(d => d.severity === 'strong')

  const childrenFocus = analyzeChildrenFocus(chart, now, lang)
  const addiction = analyzeAddictionSignatures(chart, now, lang)
  const lending = analyzeLendingRisk(chart, lang)
  const jupiterRemedy = analyzeJupiterRemedyTiming(chart, lang)

  const prioritizedRemedies: string[] = []
  for (const d of present) {
    for (const r of d.remedies.slice(0, 2)) {
      if (!prioritizedRemedies.includes(r)) prioritizedRemedies.push(r)
    }
  }
  const O = SHRAP_HI.overview
  const hi = lang === 'hi'
  if (jupiterRemedy) {
    prioritizedRemedies.push(hi
      ? fill(SHRAP_HI.priority.jupiter, {
          days: jupiterRemedy.recommendedDays,
          standard: jupiterRemedy.standardDays,
          dignity: jupiterRemedy.dignity,
          sign: jupiterRemedy.jupiterSign,
        })
      : `Run active remedies for about ${jupiterRemedy.recommendedDays} days (standard ${jupiterRemedy.standardDays}; Jupiter ${jupiterRemedy.dignity} in ${jupiterRemedy.jupiterSign}).`)
  }
  if (childrenFocus?.focusElsewhere) {
    prioritizedRemedies.push(tx(
      lang,
      'Neel Saraswati worship for study / focus — timed to a supportive dasha',
      SHRAP_HI.priority.children,
    ))
  }
  if (addiction && addiction.severity !== 'clear') {
    prioritizedRemedies.push(tx(
      lang,
      'Rahu-aware habit discipline; match Bhairav / Shiva / Hanuman to the dasha lord',
      SHRAP_HI.priority.addiction,
    ))
  }

  const headline = presentCount === 0
    ? tx(lang, 'No strong Shrap / Dosha flags from this rule set', O.noneHeadline)
    : strong.length
      ? tx(
          lang,
          `${strong.length} strong dosha flag${strong.length > 1 ? 's' : ''} — review remedies carefully`,
          O.strongHeadline,
          { n: strong.length },
        )
      : tx(
          lang,
          `${presentCount} dosha watch flag${presentCount > 1 ? 's' : ''} — weigh with dasha and full chart`,
          O.watchHeadline,
          { n: presentCount },
        )

  const overview = presentCount === 0
    ? tx(lang, 'Pitru, Matru, True Sarpa, Guru, Brahmin, and Stri/Kanya checks are clear or weak. Commercial Kal Sarp Yoga is not scored on this platform.', O.noneBody)
    : tx(
        lang,
        `Active: ${present.map(d => d.label).join(', ')}. These are karmic affliction indicators from classical and Nadi teaching — not automatic life verdicts.`,
        O.activeBody,
        { labels: present.map(d => d.label).join(', ') },
      )

  return {
    headline,
    overview,
    teachingNote: tx(
      lang,
      'Doshas (Shrap) are karmic afflictions. BPHS emphasises Pitru and Sarpa themes; Matru, Guru, Brahmin, and Stri/Kanya appear more in Nadi and specialized texts. Always confirm with dasha and divisional charts.',
      O.teaching,
    ),
    doshas,
    summaryRows,
    presentCount,
    childrenFocus,
    addiction,
    lending,
    jupiterRemedy,
    prioritizedRemedies,
  }
}
