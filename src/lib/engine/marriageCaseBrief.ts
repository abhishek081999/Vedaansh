// src/lib/engine/marriageCaseBrief.ts
// Five-bullet marriage summary composed from existing marriage engines.
// Pure engine — no React/DB.

import type { ChartOutput } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { MCB_HI } from '@/lib/engine/locale/marriageCaseBrief.hi'
import { analyzeClassicalMarriage } from '@/lib/engine/classicalMarriage'
import { analyzeMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzeSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'

export interface MarriageCaseBrief {
  headline: string
  bullets: MarriedLifeNote[]
  muhurtaFrom?: string
  muhurtaTo?: string
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

const SCENARIO: Record<string, string> = {
  venus: 'Strong attraction, weak shared meaning (strong Venus, weak Jupiter)',
  jupiter: 'Strong duty, weak warmth (strong Jupiter, weak Venus)',
  'both-weak': 'Both Venus and Jupiter are weak — the bond matures slowly',
  'both-strong': 'Closeness and shared meaning can both hold',
  open: 'Venus and Jupiter have not settled into one clear pattern',
}

const PATTERN_LABEL: Record<string, string> = {
  linear: 'can grow in a straight line',
  second: 'a later bond may fit better',
  divorce: 'birth chart and Navamsha both look unsteady',
  many: 'more than one important bond is marked',
  open: 'still mixed',
}

const LEVEL_LABEL: Record<string, string> = {
  held: 'the three marriage energies are holding',
  strain: 'one marriage energy is under strain',
  separation: 'two energies are down — separation risk',
  divorce: 'emotion, attraction, and duty are all under strain',
}

const BAND_LABEL: Record<string, string> = {
  open: 'age band not decisive',
  timely: 'timely age band',
  delayed: 'delayed age band',
  late: 'late age band',
}

function patternLabel(pattern: string, lang: EngineLang): string {
  if (lang === 'en') return PATTERN_LABEL[pattern] ?? pattern
  return MCB_HI.patternLabel[pattern] ?? pattern
}

function scenarioText(scenario: string | undefined, headline: string | undefined, lang: EngineLang): string {
  if (lang === 'en') return SCENARIO[scenario ?? ''] ?? headline ?? SCENARIO.open
  return MCB_HI.scenario[scenario ?? ''] ?? headline ?? MCB_HI.scenario.open
}

function levelText(level: string, lang: EngineLang): string {
  if (lang === 'en') return LEVEL_LABEL[level] ?? level
  return MCB_HI.levelLabel[level] ?? level
}

function bandText(band: string, lang: EngineLang): string {
  if (lang === 'en') return BAND_LABEL[band] ?? band
  return MCB_HI.bandLabel[band] ?? band
}

export function analyzeMarriageCaseBrief(
  chart: ChartOutput | null | undefined,
  opts?: { skipGocharScan?: boolean; lang?: EngineLang },
): MarriageCaseBrief | null {
  const lang = opts?.lang ?? 'en'
  if (!chart?.lagnas?.ascRashi) return null

  const classical = analyzeClassicalMarriage(chart, lang)
  const klass = analyzeMarriageClass(chart, lang)
  const vj = analyzeVenusJupiterBond(chart, lang)
  const split = analyzeDivorceEnergy(chart, lang)
  // Client-safe: no in-process ephemeris. Dated windows come from UI inject / API.
  const gochar = analyzeMarriageGochar(chart, { skipScan: opts?.skipGocharScan ?? true, scanYears: 8 }, lang)
  const seventh = analyzeSeventhLord(chart, lang)

  const pattern = klass?.flags.pattern ?? 'open'
  const band = seventh?.flags.band ?? 'open'
  const pat = patternLabel(pattern, lang)
  const bullets: MarriedLifeNote[] = lang === 'en' ? [
    note(
      'brief-eligibility',
      '1. Bond promise',
      classical
        ? `Bond ${PATTERN_LABEL[pattern] ?? pattern}. ${classical.summary}`
        : `Bond ${PATTERN_LABEL[pattern] ?? pattern}.`,
      pattern === 'divorce' || pattern === 'second' ? 'caution' : pattern === 'linear' ? 'supportive' : 'mixed',
    ),
    note(
      'brief-chemistry',
      '2. Chemistry',
      vj
        ? SCENARIO[vj.flags.scenario] ?? vj.headline
        : 'Venus–Jupiter chemistry not available.',
      vj?.flags.scenario === 'both-strong' ? 'supportive' : vj?.flags.scenario === 'both-weak' ? 'caution' : 'mixed',
    ),
    note(
      'brief-risk',
      '3. Separation risk',
      split
        ? `${LEVEL_LABEL[split.flags.level] ?? split.flags.level}.${split.flags.manglikCancelled ? ' Mars heat on marriage is softened.' : split.flags.manglik ? ' Mars heat on marriage is active.' : ''}${split.flags.strainSoftened ? ' A helpful planet softens the strain.' : ''}`
        : 'Separation energy not available.',
      split?.flags.level === 'held' ? 'supportive' : split?.flags.level === 'divorce' || split?.flags.level === 'separation' ? 'caution' : 'mixed',
    ),
    note(
      'brief-timing',
      '4. Timing window',
      gochar?.muhurtaFrom
        ? `${BAND_LABEL[band] ?? band}. Next Jupiter–Saturn sky window ${gochar.muhurtaFrom} → ${gochar.muhurtaTo ?? gochar.muhurtaFrom}. Marriage period is ${gochar.flags.dashaSupports ? 'open' : gochar.flags.dashaSupports === false ? 'closed' : 'unclear'}.`
        : `${BAND_LABEL[band] ?? band}. ${gochar?.summary ?? 'No sky window scanned yet.'}`,
      gochar?.flags.dashaSupports ? 'supportive' : 'mixed',
    ),
    note(
      'brief-action',
      '5. Action',
      split?.flags.level === 'separation' || split?.flags.level === 'divorce' || vj?.flags.scenario === 'both-weak'
        ? 'Steady guidance and repeated support help more than a one-shot remedy. Treat the timing windows only as ranges in which to look for a wedding muhurta (auspicious time).'
        : gochar?.flags.dashaSupports
          ? 'The marriage period is open, so a muhurta (auspicious time) can be sought inside the sky window, with ethics and consent kept central.'
          : 'A clearer picture of the marriage period and the spouse portrait helps before a wedding date is fixed.',
      'mixed',
    ),
  ] : [
    note(
      'brief-eligibility',
      MCB_HI.bullets.eligibility.title,
      fill(`${MCB_HI.bullets.eligibility.bondLead}${classical?.summary ?? ''}`, { pattern: pat }),
      pattern === 'divorce' || pattern === 'second' ? 'caution' : pattern === 'linear' ? 'supportive' : 'mixed',
    ),
    note(
      'brief-chemistry',
      MCB_HI.bullets.chemistry.title,
      vj ? scenarioText(vj.flags.scenario, vj.headline, lang) : MCB_HI.bullets.chemistry.missing,
      vj?.flags.scenario === 'both-strong' ? 'supportive' : vj?.flags.scenario === 'both-weak' ? 'caution' : 'mixed',
    ),
    note(
      'brief-risk',
      MCB_HI.bullets.risk.title,
      split
        ? `${levelText(split.flags.level, lang)}.${split.flags.manglikCancelled ? MCB_HI.bullets.risk.manglikSoft : split.flags.manglik ? MCB_HI.bullets.risk.manglikActive : ''}${split.flags.strainSoftened ? MCB_HI.bullets.risk.strainSoft : ''}`
        : MCB_HI.bullets.risk.missing,
      split?.flags.level === 'held' ? 'supportive' : split?.flags.level === 'divorce' || split?.flags.level === 'separation' ? 'caution' : 'mixed',
    ),
    note(
      'brief-timing',
      MCB_HI.bullets.timing.title,
      gochar?.muhurtaFrom
        ? fill(MCB_HI.bullets.timing.window, {
          band: bandText(band, lang),
          from: gochar.muhurtaFrom,
          to: gochar.muhurtaTo ?? gochar.muhurtaFrom,
          dasha: gochar.flags.dashaSupports ? MCB_HI.bullets.timing.dashaOpen : gochar.flags.dashaSupports === false ? MCB_HI.bullets.timing.dashaClosed : MCB_HI.bullets.timing.dashaUnclear,
        })
        : fill(MCB_HI.bullets.timing.noScan, { band: bandText(band, lang), summary: gochar?.summary ?? MCB_HI.bullets.timing.noSummary }),
      gochar?.flags.dashaSupports ? 'supportive' : 'mixed',
    ),
    note(
      'brief-action',
      MCB_HI.bullets.action.title,
      split?.flags.level === 'separation' || split?.flags.level === 'divorce' || vj?.flags.scenario === 'both-weak'
        ? MCB_HI.bullets.action.steady
        : gochar?.flags.dashaSupports
          ? MCB_HI.bullets.action.open
          : MCB_HI.bullets.action.portrait,
      'mixed',
    ),
  ]

  return {
    headline: lang === 'en' ? 'Marriage summary' : MCB_HI.headline,
    bullets,
    muhurtaFrom: gochar?.muhurtaFrom,
    muhurtaTo: gochar?.muhurtaTo,
  }
}

export function analyzePairCaseBrief(
  chartA: ChartOutput,
  chartB: ChartOutput,
  opts?: { skipGocharScan?: boolean; lang?: EngineLang },
): MarriageCaseBrief | null {
  const lang = opts?.lang ?? 'en'
  const a = analyzeMarriageCaseBrief(chartA, { skipGocharScan: opts?.skipGocharScan ?? false, lang })
  const b = analyzeMarriageCaseBrief(chartB, { skipGocharScan: opts?.skipGocharScan ?? false, lang })
  if (!a || !b) return null
  const syn = analyzeMarriageSynastry(chartA, chartB, lang)
  const nameA = chartA.meta?.name?.trim() || 'A'
  const nameB = chartB.meta?.name?.trim() || 'B'
  return {
    headline: lang === 'en' ? 'Marriage summary — pair' : MCB_HI.headlinePair,
    bullets: lang === 'en' ? [
      note('pair-brief-a', `${nameA}`, a.bullets.map(x => x.detail).join(' · '), 'mixed'),
      note('pair-brief-b', `${nameB}`, b.bullets.map(x => x.detail).join(' · '), 'mixed'),
      note(
        'pair-brief-syn',
        'Overlay',
        syn?.summary ?? 'Synastry not available.',
        syn?.flags.d9Score === 'aligned' ? 'supportive' : syn?.flags.d9Score === 'strained' ? 'caution' : 'mixed',
      ),
      note(
        'pair-brief-time',
        'Shared timing',
        a.muhurtaFrom && b.muhurtaFrom
          ? `${nameA} window ${a.muhurtaFrom}; ${nameB} window ${b.muhurtaFrom}. The best muhurta (auspicious time) search starts where the two windows overlap.`
          : 'Compare the individual transit windows before fixing a date.',
        'mixed',
      ),
      note(
        'pair-brief-action',
        'Action',
        'Start with the bond promise and chemistry. The overlay shows whether each chart offers the partner the other chart promises. A muhurta (auspicious time) is best sought only where the dasha and the sky windows are both open.',
        'mixed',
      ),
    ] : [
      note('pair-brief-a', `${nameA}`, a.bullets.map(x => x.detail).join(' · '), 'mixed'),
      note('pair-brief-b', `${nameB}`, b.bullets.map(x => x.detail).join(' · '), 'mixed'),
      note(
        'pair-brief-syn',
        MCB_HI.pair.synTitle,
        syn?.summary ?? MCB_HI.pair.synMissing,
        syn?.flags.d9Score === 'aligned' ? 'supportive' : syn?.flags.d9Score === 'strained' ? 'caution' : 'mixed',
      ),
      note(
        'pair-brief-time',
        MCB_HI.pair.timeTitle,
        a.muhurtaFrom && b.muhurtaFrom
          ? fill(MCB_HI.pair.timeOverlap, { nameA, fromA: a.muhurtaFrom, nameB, fromB: b.muhurtaFrom })
          : MCB_HI.pair.timeCompare,
        'mixed',
      ),
      note(
        'pair-brief-action',
        MCB_HI.pair.actionTitle,
        MCB_HI.pair.actionDetail,
        'mixed',
      ),
    ],
    muhurtaFrom: a.muhurtaFrom,
    muhurtaTo: a.muhurtaTo,
  }
}
