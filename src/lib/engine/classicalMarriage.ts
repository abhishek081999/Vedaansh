// src/lib/engine/classicalMarriage.ts
// Classical marriage predictions assembled for Relationship and Milan:
// spouse portrait, timing window, happiness/strain, more than one bond.
// Chart-matched notes only. No book or chapter names in user copy.
// Pure engine — no React/DB.

import type { ChartOutput } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { analyzePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzeIntimateLife } from '@/lib/engine/intimateLife'
import { analyzeDivorceEnergy } from '@/lib/engine/divorceEnergy'
import { analyzeMarriageClass } from '@/lib/engine/marriageClass'

export interface ClassicalMarriageReading {
  headline: string
  summary: string
  spouse: MarriedLifeNote[]
  timing: MarriedLifeNote[]
  happiness: MarriedLifeNote[]
  remarriage: MarriedLifeNote[]
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

const BAND_COPY = {
  timely: 'The age band reads timely (about 21–28 as a relative band, not a birthday).',
  delayed: 'The age band reads delayed (about 28–32 as a relative band).',
  late: 'The age band reads late (after about 35, or a life that may not marry — both stay open until dasha agrees).',
  open: 'The age band is not decisive yet.',
} as const

export function analyzeClassicalMarriage(chart: ChartOutput | null | undefined): ClassicalMarriageReading | null {
  if (!chart?.lagnas?.ascRashi) return null

  const partner = analyzePartnerNature(chart)
  const seventh = analyzeSeventhLord(chart)
  const jaya = analyzeJayaBhava(chart)
  const houses = analyzeMarriageHouses(chart)
  const gochar = analyzeMarriageGochar(chart, { skipScan: true })
  const intimate = analyzeIntimateLife(chart)
  const split = analyzeDivorceEnergy(chart)
  const klass = analyzeMarriageClass(chart)

  const spouse: MarriedLifeNote[] = []
  if (partner) {
    spouse.push(...partner.classical)
    if (partner.flags.incomplete) {
      spouse.push(note(
        'classical-spouse-incomplete',
        'Love stays incomplete from this chart',
        partner.portrait.find(n => n.id === 'partner-incomplete')?.detail
          ?? 'Moon and Venus are both weak, so the completing partner is not the one this 7th draws.',
        'caution',
      ))
    }
  }
  if (!spouse.length) {
    spouse.push(note(
      'classical-spouse-plain',
      'Spouse portrait needs the 7th',
      'Appearance, family, and direction are read from the 7th and its lord. Recalculate if the ascendant is missing.',
      'mixed',
    ))
  }

  const timing: MarriedLifeNote[] = []
  if (seventh) {
    timing.push(note(
      'classical-timing-band',
      'Age band for marriage',
      BAND_COPY[seventh.flags.band],
      seventh.flags.band === 'late' ? 'caution' : seventh.flags.band === 'timely' ? 'supportive' : 'mixed',
    ))
  }
  if (jaya?.flags.earliestYear != null) {
    const y = jaya.flags.earliestYear
    const relative = y <= 16 ? 'early' : y <= 22 ? 'middling' : 'later'
    timing.push(note(
      'classical-timing-marker',
      'Relative marriage marker',
      `The earliest classical year marker on this chart is ${y}. Treat it as a ${relative} clock relative to other charts, not as a calendar birthday. Confirm with the dasha of the 7th lord, Venus, and Jupiter.`,
      'mixed',
    ))
  }
  if (houses) {
    const ready = houses.flags.triangularActive || houses.flags.bindingActive
    timing.push(note(
      'classical-timing-houses',
      ready ? 'Marriage houses can activate in period' : 'Marriage houses still need activation',
      ready
        ? `Triangular activation is ${houses.flags.triangularActive ? 'on' : 'off'}; binding houses are ${houses.flags.bindingActive ? 'on' : 'off'}. A period can produce a wedding only when readiness and these gates agree.`
        : 'The triangular (1/5/9) and binding (2/8/11) gates are not both live. Until a period lights them, the age band alone does not marry the chart.',
      ready ? 'supportive' : 'mixed',
    ))
  }
  if (gochar) {
    timing.push(note(
      'classical-timing-gochar',
      gochar.flags.dashaSupports ? 'Current period can receive the marriage transit' : 'Current period does not yet support the marriage transit',
      gochar.summary,
      gochar.flags.dashaSupports ? 'supportive' : 'mixed',
    ))
  }
  if (intimate?.timings.length) {
    const ahead = intimate.timings.filter(n => !n.id.startsWith('past-')).slice(0, 2)
    for (const n of ahead) {
      timing.push(note(`classical-timing-${n.id}`, n.title, n.detail, n.tone))
    }
  }
  if (!timing.length) {
    timing.push(note(
      'classical-timing-plain',
      'Timing needs more chart data',
      'Age band, house activation, and period windows could not be assembled yet.',
      'mixed',
    ))
  }

  const happiness: MarriedLifeNote[] = []
  if (split) {
    happiness.push(...split.energies.slice(0, 2))
    happiness.push(...split.cancellations)
    if (split.triggers.length && (split.flags.level === 'separation' || split.flags.level === 'divorce')) {
      happiness.push(...split.triggers.filter(n => n.id === 'split-period' || n.id === 'split-thread-dasha').slice(0, 1))
    }
  }
  if (klass) {
    const strain = klass.strain.slice(0, 2)
    happiness.push(...strain)
  }
  if (!happiness.length) {
    happiness.push(note(
      'classical-happiness-plain',
      'Happiness and strain are not marked',
      'Moon, Venus, and Saturn are not in a clear break pattern on this chart.',
      'supportive',
    ))
  }

  const remarriage: MarriedLifeNote[] = []
  if (klass) {
    const ids = new Set([
      'class-pattern-second',
      'class-pattern-many',
      'class-pattern-divorce',
      'class-remarriage',
      'class-remarriage-sun-rahu',
      'class-remarriage-three',
      'class-multiplicity-twelfth',
    ])
    remarriage.push(...klass.pattern.filter(n => ids.has(n.id)))
    if (klass.flags.remarriageSignal && !remarriage.length) {
      remarriage.push(note(
        'classical-remarriage-flag',
        'A second-bond signature is present',
        'The pattern flags a second chapter in partnership. Read Navamsha and dasha before treating any first ending as finished. The form of that ending stays unnamed.',
        'caution',
      ))
    }
    if (klass.flags.multiplicity && !remarriage.some(n => n.id.includes('many') || n.id.includes('multiplicity'))) {
      remarriage.push(note(
        'classical-multiplicity',
        'More than one important bond',
        'Several partnership openings are indicated. That means several serious bonds across a life — not automatically several weddings.',
        'mixed',
      ))
    }
  }
  if (!remarriage.length) {
    remarriage.push(note(
      'classical-remarriage-linear',
      'No strong second-bond signature',
      'The classical multiplicity and remarriage stacks are not firing. A single growing bond remains the default reading until Navamsha and dasha say otherwise.',
      'supportive',
    ))
  }

  const parts = [
    partner ? 'spouse portrait' : null,
    seventh ? `age band ${seventh.flags.band}` : null,
    split ? `bond energy ${split.flags.level}` : null,
    klass?.flags.remarriageSignal ? 'second-bond mark' : null,
  ].filter(Boolean)

  return {
    headline: 'Classical marriage predictions from this chart',
    summary: parts.length
      ? `This reading covers ${parts.join(', ')}. Only combinations the chart actually forms are shown.`
      : 'Classical marriage lines could not be assembled.',
    spouse,
    timing,
    happiness,
    remarriage,
  }
}

export function compareClassicalMarriage(
  a: ClassicalMarriageReading,
  b: ClassicalMarriageReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []
  const aSecond = a.remarriage.some(n => n.tone === 'caution')
  const bSecond = b.remarriage.some(n => n.tone === 'caution')
  if (aSecond && bSecond) {
    notes.push(note(
      'classical-pair-second',
      'Both charts carry a second-bond mark',
      `${nameA} and ${nameB} each show classical openings for more than one serious chapter. The match needs honesty about whether the bond being lived is the first chapter or a later one.`,
      'caution',
    ))
  } else if (aSecond || bSecond) {
    const who = aSecond ? nameA : nameB
    notes.push(note(
      'classical-pair-one-second',
      `${who} carries the second-bond mark`,
      `The multiplicity or remarriage signature sits in ${who}’s chart. The other chart does not share it at the same strength.`,
      'mixed',
    ))
  }

  const softA = a.happiness.some(n => n.id === 'split-benefic-soft' || n.id === 'split-kuja-cancel')
  const softB = b.happiness.some(n => n.id === 'split-benefic-soft' || n.id === 'split-kuja-cancel')
  if (softA && softB) {
    notes.push(note(
      'classical-pair-soft',
      'Both charts have softeners on strain',
      `${nameA} and ${nameB} each show Kuja cancellation or a benefic on the marriage. Conflict can still be worked without reading an automatic break.`,
      'supportive',
    ))
  }

  return notes
}
