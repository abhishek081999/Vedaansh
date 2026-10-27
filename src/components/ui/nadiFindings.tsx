// ─────────────────────────────────────────────────────────────
//  src/components/ui/nadiFindings.tsx
//  Turns a Nadi reading into the lines that are active on this chart.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { NadiChartReading } from '@/lib/engine/nadi'
import styles from './NadiHousesSection.module.css'

export type NadiTone = 'support' | 'caution' | 'plain'

export interface NadiFinding {
  id: string
  title: string
  answer: string
  reading?: string
  /** Classical paraphrase, kept apart from the Nadi line. */
  detail?: string
  tone: NadiTone
}

const CAREER_PRIORITY: Record<NadiChartReading['career']['priority'], string> = {
  1: 'Exchange',
  2: 'Three or more planets',
  3: 'Saturn conjunction',
  4: 'Saturn trine',
  5: 'Vargottama, exalted, or the 10th',
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

function cautionLine(line: string): boolean {
  return /loss of work|break|poor time|not worn|not the time|not strong|afflicted|separat|hard|delay|strain|Mrityu Bhaga|difficult|cancelled|cancelling|left out|mixed|accident|mean nodes|illness|struggle|injury|mark on that fame|unexpected|large expense|debilitated|under pressure|sudden turn|brings a cut/i.test(line)
}

function supportLine(line: string): boolean {
  return /rise|supported|happy|stable|usable|lifelong|strengthened|gains|one of the best|exceptionally strong|strongest form|exalted|own sign|moolatrikona|prominent|blessing|Wealth is read|Healing work/i.test(line)
}

function toneOf(line: string): NadiTone {
  if (cautionLine(line)) return 'caution'
  if (supportLine(line)) return 'support'
  return 'plain'
}

export function linesTone(lines: readonly string[]): NadiTone {
  if (lines.some(cautionLine)) return 'caution'
  if (lines.some(supportLine)) return 'support'
  return 'plain'
}

function fromLines(title: string, lines: readonly string[], idPrefix: string): NadiFinding[] {
  return lines.map((line, index) => ({
    id: `${idPrefix}-${index}`,
    title,
    answer: line,
    tone: toneOf(line),
  }))
}

const TONE_CLASS: Record<NadiTone, string> = {
  support: styles.toneSupport,
  caution: styles.toneCaution,
  plain: styles.tonePlain,
}

export function withoutVerdict(items: readonly NadiFinding[], verdict: string): NadiFinding[] {
  return items.filter((item) => item.answer !== verdict && item.reading !== verdict)
}

export function FindingGrid({ items }: { items: readonly NadiFinding[] }) {
  if (items.length === 0) return null
  return (
    <div className={styles.findings}>
      {items.map((item) => (
        <article key={item.id} className={`${styles.finding} ${TONE_CLASS[item.tone]}`}>
          <p className={styles.findingTitle}>{item.title}</p>
          <p className={styles.findingAnswer}>{item.answer}</p>
          {item.reading ? <p className={styles.findingBody}>{item.reading}</p> : null}
          {item.detail ? <p className={styles.findingClassical}>{item.detail}</p> : null}
        </article>
      ))}
    </div>
  )
}

export function Verdict({ title, note, kicker = 'Active on this chart' }: { title: string; note?: string | null; kicker?: string }) {
  return (
    <article className={styles.verdict}>
      <p className={styles.kicker}>{kicker}</p>
      <h3 className={styles.verdictTitle}>{title}</h3>
      {note ? <p className={styles.note}>{note}</p> : null}
    </article>
  )
}

export function Reference({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className={styles.reference}>
      <summary>{label}</summary>
      <div className={styles.referenceBody}>{children}</div>
    </details>
  )
}

export type NadiJump = 'houses' | 'life' | 'yogas' | 'marriage' | 'career' | 'wealth' | 'future' | 'timing' | 'transits' | 'remedies'

export function NadiActiveBrief({
  reading,
  period,
  onOpen,
}: {
  reading: NadiChartReading
  period: string | null
  onOpen: (view: NadiJump) => void
}) {
  const headline = reading.career.lines[0]
    ?? reading.navamshaNotes[0]
    ?? reading.bcp?.lines[0]
    ?? 'The reading follows the houses, the period, and the combinations on this chart.'
  const yearLine = reading.bcp
    ? `The ${ordinal(reading.bcp.runningYear)} year is ${reading.bcp.houseName}.`
    : null
  const periodLine = period ? `Vimshottari now: ${period}.` : null
  const lede = [yearLine, periodLine].filter(Boolean).join(' ')
    || 'Each tab opens one part of this chart: houses, combinations, marriage, career, the years ahead, and the sky.'

  const chips: { key: string; value: string; view: NadiJump }[] = []
  if (period) chips.push({ key: 'Period', value: period, view: 'timing' })
  chips.push({ key: 'Career', value: CAREER_PRIORITY[reading.career.priority], view: 'career' })
  if (reading.marriageYogas.length > 0) {
    chips.push({
      key: 'Marriage',
      value: `${reading.marriageYogas.length} combination${reading.marriageYogas.length === 1 ? '' : 's'}`,
      view: 'marriage',
    })
  }
  if (reading.yogas.length > 0) chips.push({ key: 'Yogas', value: String(reading.yogas.length), view: 'yogas' })
  if (reading.bcp) chips.push({ key: 'Year', value: `${reading.bcp.runningYear} · ${reading.bcp.houseName}`, view: 'timing' })
  const ahead = reading.future.years.find((year) => !year.now && year.techniques.length > 1)
  if (ahead) chips.push({ key: 'Ahead', value: `${ahead.year} · ${ahead.houseName}`, view: 'future' })
  chips.push({ key: 'Bhrigu', value: ordinal(reading.bhriguHouse), view: 'houses' })

  return (
    <section className={styles.brief} aria-label="Active on this chart">
      <p className={styles.kicker}>Nadi Astrology</p>
      <h1 className={styles.briefTitle}>{headline}</h1>
      <p className={styles.briefLede}>{lede}</p>
      <ul className={styles.briefChips}>
        {chips.map((chip) => (
          <li key={chip.key}>
            <button type="button" className={styles.briefChip} onClick={() => onOpen(chip.view)}>
              <span className={styles.briefKey}>{chip.key}</span>
              <span>{chip.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function nadiHighlights(
  view: string,
  reading: NadiChartReading,
  vargaName: string,
): { d1: number[]; varga: number[] } {
  const d1 = new Set<number>()
  if (view === 'marriage') d1.add(7)
  else if (view === 'career') {
    if (reading.career.priority === 1) {
      for (const pair of reading.parivartana) {
        d1.add(pair.a)
        d1.add(pair.b)
      }
    }
    if (d1.size === 0) d1.add(10)
  } else if (view === 'wealth') {
    d1.add(2); d1.add(9); d1.add(11)
  } else if (view === 'timing' && reading.bcp) {
    d1.add(reading.bcp.house)
  } else if (view === 'future') {
    if (reading.bcp) d1.add(reading.bcp.house)
    const next = reading.future.years.find((year) => !year.now && year.techniques.some((tag) => tag !== 'year'))
    if (next) d1.add(next.house)
  } else if (view === 'remedies') {
    d1.add(1)
  } else if (view === 'life') {
    d1.add(5)
    d1.add(4)
    d1.add(9)
    d1.add(12)
  } else if (view === 'houses' || view === 'chart') {
    if (reading.career.priority === 1) {
      for (const pair of reading.parivartana) {
        d1.add(pair.a)
        d1.add(pair.b)
      }
    }
    if (reading.marriageYogas.length > 0 || reading.navamshaNotes.length > 0) d1.add(7)
    if (reading.bcp) d1.add(reading.bcp.house)
    if (view === 'houses') d1.add(reading.bhriguHouse)
    if (d1.size === 0) d1.add(10)
  }

  const varga: number[] = []
  if (vargaName === 'D9' && (view === 'marriage' || view === 'chart')) varga.push(1, 7)
  if (vargaName === 'D10' && (view === 'career' || view === 'chart')) varga.push(1, 10)
  return { d1: [...d1], varga }
}

export function bhriguFindings(reading: NadiChartReading): NadiFinding[] {
  return fromLines('Bhrigu Bhava', reading.bhriguNotes, 'bhrigu')
}

export function marriagePressureFindings(reading: NadiChartReading): NadiFinding[] {
  return fromLines('Marriage', reading.marriageRuleNotes, 'pressure')
}

export function houseSignalFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Saturn retrograde', reading.saturnRetroNote ? [reading.saturnRetroNote] : [], 'sa-retro'),
    ...fromLines('Retrograde', reading.retrogradeNotes, 'retro'),
    ...fromLines('Sun', reading.sunNote ? [reading.sunNote] : [], 'sun'),
  ]
}

export function combinationFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...reading.parivartana.map((pair) => ({
      id: `ex-${pair.a}-${pair.b}`,
      title: 'Exchange',
      answer: `${ordinal(pair.a)} and ${ordinal(pair.b)}`,
      reading: 'Those houses are strengthened.',
      tone: 'support' as const,
    })),
    ...reading.links.map((link) => ({
      id: link.id,
      title: 'Lord link',
      answer: link.reading,
      tone: 'plain' as const,
    })),
    ...fromLines('Wealth link', reading.wealthNotes, 'wealth-link'),
    ...fromLines('Afflicted house', reading.afflictedNotes, 'afflicted'),
  ]
}

export function relativeFindings(reading: NadiChartReading): NadiFinding[] {
  return reading.relatives.filter((rel) => rel.careerOccupants.length > 0).map((rel) => ({
    id: rel.id,
    title: rel.label,
    answer: `Career in the ${ordinal(rel.careerHouse)}`,
    reading: rel.careerWork,
    tone: 'plain' as const,
  }))
}

export function yogaFindings(reading: NadiChartReading): NadiFinding[] {
  return reading.yogas.map((yoga) => ({
    id: yoga.id,
    title: yoga.kind === 'inauspicious' ? 'Inauspicious' : 'Supportive',
    answer: `${yoga.name} · ${yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart'} · ${yoga.signName}`,
    reading: `${yoga.effect} ${yoga.bearerNote}${yoga.career ? ` Working form: ${yoga.career}` : ''}`,
    tone: yoga.kind === 'inauspicious' ? 'caution' as const : 'support' as const,
  }))
}

export function marriageFindings(reading: NadiChartReading): NadiFinding[] {
  return reading.marriageYogas.map((yoga) => ({
    id: yoga.id,
    title: yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart',
    answer: `${yoga.name} · ${yoga.signName} · ${ordinal(yoga.house)}`,
    reading: yoga.reading,
    tone: toneOf(yoga.reading),
  }))
}

export function careerFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Career', reading.career.lines, 'career'),
    ...fromLines('Wealth', reading.career.wealth ? [reading.career.wealth] : [], 'career-wealth'),
    ...fromLines('Luck', reading.career.lucky ? [reading.career.lucky] : [], 'career-lucky'),
    ...fromLines('Exams', reading.career.exams ? [reading.career.exams] : [], 'career-exams'),
    ...fromLines('Career', reading.career.notes, 'career-note'),
    ...fromLines('Dashamsha', reading.dashamshaNotes, 'd10'),
    ...fromLines('Shashtiamsa', reading.shashtiamsaNotes, 'd60'),
    ...fromLines('Neighborhood', reading.neighborhoodNotes, 'near'),
    ...fromLines('Uniform', reading.uniformNotes, 'uniform'),
  ]
}

export function wealthFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Wealth year', reading.wealthTiming, 'wealth'),
    ...reading.snapshots.map((row) => ({
      id: row.id,
      title: 'Snapshot',
      answer: row.reading,
      tone: toneOf(row.reading),
    })),
    ...fromLines('Wealth', reading.dhanNotes, 'dhan'),
    ...reading.wealthWindows.map((row) => ({
      id: row.id,
      title: row.lordName,
      answer: 'Running now',
      reading: `${row.reason} That sub-period is read as money coming in.`,
      tone: 'support' as const,
    })),
    ...fromLines('Property', reading.propertyNotes, 'd4'),
    ...fromLines('Vehicle', reading.vehicleNotes, 'd16'),
    ...fromLines('Nodes', reading.nodeNote ? [reading.nodeNote] : [], 'nodes'),
  ]
}

export function timingFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Degree', reading.degreeNotes, 'degree'),
    ...fromLines('Special degree', reading.specialNotes, 'special'),
    ...fromLines('Year', reading.yearNotes, 'year-activate'),
    ...fromLines('Running year', reading.bcp?.lines ?? [], 'bcp'),
    ...fromLines('Decisions', reading.decisionNotes, 'decision'),
    ...fromLines('Mars', reading.marsSouthNote ? [reading.marsSouthNote] : [], 'mars'),
    ...reading.timings.filter((row) => row.running).map((row) => ({
      id: row.id,
      title: row.event,
      answer: `${row.lordName} is running`,
      reading: `Lord of the ${ordinal(row.house)}.`,
      tone: 'plain' as const,
    })),
  ]
}

export function transitFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Pitru', reading.pitruNote ? [reading.pitruNote] : [], 'pitru'),
    ...fromLines('Jupiter', reading.jupiterGroups, 'ju-group'),
    ...fromLines('Saturn', reading.saturnGroups, 'sa-group'),
    ...fromLines('Slow transit', reading.slowTransitNotes, 'slow'),
    ...fromLines('Hard transit', reading.hardTransitNotes, 'hard'),
    ...fromLines('Nodes', reading.nodeNote ? [reading.nodeNote] : [], 'nodes'),
  ]
}

export function remedyFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Gemstone', reading.gemNotes, 'gem'),
    ...fromLines('Color', reading.colorNotes, 'color'),
    ...fromLines('Health', reading.healthFlags, 'health'),
    ...fromLines('Remedy', reading.remedyNotes, 'remedy'),
  ]
}

export function lifeFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('Study', reading.life.education, 'study'),
    ...fromLines('Family', reading.life.family, 'family'),
    ...fromLines('Settlement', reading.life.settlement, 'settle'),
    ...fromLines('Health', reading.healthFlags, 'health-life'),
  ]
}

export function lifeVerdict(reading: NadiChartReading): string {
  return reading.life.education[0]
    ?? reading.life.settlement[0]
    ?? reading.life.family[0]
    ?? 'Study, the family, and settlement are read from this chart.'
}

export function placementFindings(reading: NadiChartReading): NadiFinding[] {
  return reading.placements.map((row) => {
    const rules = row.lordOf.length === 0
      ? 'rules no sign'
      : `rules ${row.lordOf.map((house) => `the ${ordinal(house)}`).join(' and ')}`
    const sign = row.naturalHouse === row.house
      ? row.signName
      : `${row.signName} carries the ${ordinal(row.naturalHouse)}`
    return {
      id: `place-${row.id}`,
      title: row.name,
      answer: `${ordinal(row.house)} · ${sign} · ${rules}`,
      reading: row.prediction,
      detail: [row.classicalHouse, row.classicalSign].filter((line): line is string => !!line).join(' '),
      tone: toneOf(row.prediction),
    }
  })
}

export function housesVerdict(reading: NadiChartReading): string {
  const house = reading.houses.find((row) => row.house === reading.bhriguHouse)
  const first = house?.prediction.split(/(?<=\.)\s/)[0]
  return first || reading.bhriguNotes[0] || 'The Bhrigu Bhava is read from the lagna sign.'
}

export function yogasVerdict(reading: NadiChartReading): string {
  const hard = reading.yogas.filter((yoga) => yoga.kind === 'inauspicious').length
  const soft = reading.yogas.filter((yoga) => yoga.kind === 'supportive').length
  if (hard === 0 && soft === 0 && reading.dusthanaNotes.length === 0) {
    return 'No combination from this set is on the chart.'
  }
  const parts = [
    hard > 0 ? `${hard} inauspicious` : '',
    soft > 0 ? `${soft} supportive` : '',
    reading.dusthanaNotes.length > 0 ? 'dusthana dignity is reversed' : '',
  ].filter(Boolean)
  return `${parts.join(', ')}.`
}

export function marriageVerdict(reading: NadiChartReading): string {
  const yoga = reading.marriageYogas[0]
  if (yoga) return `${yoga.name}. ${yoga.reading}`
  return reading.navamshaNotes[0] ?? 'No marriage combination from this set is on the chart.'
}

export function careerVerdict(reading: NadiChartReading): string {
  return reading.career.lines[0] ?? 'Career is read from the 10th.'
}

export function wealthVerdict(reading: NadiChartReading): string {
  return reading.wealthTiming[0]
    ?? reading.snapshots[0]?.reading
    ?? reading.wealthWindows[0]?.reason
    ?? 'No wealth year from this set is marked on the chart.'
}

export function futureVerdict(reading: NadiChartReading): string {
  const years = reading.future.years
  const open = years.find((year) => year.now && year.techniques.length > 1)
    ?? years.find((year) => year.techniques.length > 1)
    ?? years.find((year) => year.now)
    ?? years[0]
  if (open?.lines[0]) return open.lines[0]
  const period = reading.future.periods.find((row) => row.lines.length > 0) ?? reading.future.periods[0]
  if (period) return period.lines[0] ?? period.title
  return 'No coming year is marked. A birth date opens the year-count.'
}

export function timingVerdict(reading: NadiChartReading): string {
  return reading.bcp?.lines[0]
    ?? reading.degreeNotes[0]
    ?? reading.decisionNotes[0]
    ?? 'No running year is marked on this chart.'
}

export function transitVerdict(reading: NadiChartReading): string {
  return reading.hardTransitNotes[0]
    ?? reading.jupiterGroups[0]
    ?? reading.saturnGroups[0]
    ?? reading.slowTransitNotes[0]
    ?? reading.pitruNote
    ?? 'No grouped transit is active. The reference list is below.'
}

export function remedyVerdict(reading: NadiChartReading): string {
  return reading.gemNotes[0] ?? 'No stone from this chart is singled out.'
}
