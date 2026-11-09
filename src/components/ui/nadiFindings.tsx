// ─────────────────────────────────────────────────────────────
//  src/components/ui/nadiFindings.tsx
//  Turns a Nadi reading into the lines that are active on this chart.
// ─────────────────────────────────────────────────────────────

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import type { NadiChartReading } from '@/lib/engine/nadi'
import { useLang } from '@/i18n/useLang'
import styles from './NadiHousesSection.module.css'

export type NadiTone = 'support' | 'caution' | 'plain'

export interface NadiFinding {
  id: string
  title: string
  /** Key under nadi.findings.titles. Display uses the catalogue when set. */
  titleKey?: string
  answer: string
  reading?: string
  /** Classical paraphrase, kept apart from the Nadi line. */
  detail?: string
  tone: NadiTone
}

export function nadiOrdinal(n: number, hi = false): string {
  if (hi) return `${n}वाँ`
  return ordinal(n)
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

/** Hindi keywords sit beside the English ones so Hindi lines keep their tone. */
const CAUTION_HI = /काम छूट|रुकावट|खराब समय|नहीं पहना|बलवान नहीं|पीड़ित|अलगाव|कठिन|देरी|दबाव|मृत्यु भाग|रद्द|काटते|छोड़ा जाता|मिश्रित|दुर्घटना|मध्यम राहु|रोग|संघर्ष|चोट|अप्रत्याशित|बड़े खर्च|नीच|अचानक मोड़|काट लाता/
const SUPPORT_HI = /उन्नति|सहारा|सहायक|सुखी|स्थिर|उपयोगी|आजीवन|बल देता|लाभ|सबसे अच्छी|असाधारण|सबसे बलवान|उच्च का|अपनी राशि|मूलत्रिकोण|प्रमुख|आशीर्वाद|धन .*पढ़ा|उपचार का काम/

function cautionLine(line: string): boolean {
  return /loss of work|break|poor time|not worn|not the time|not strong|afflicted|separat|hard|delay|strain|Mrityu Bhaga|difficult|cancelled|cancelling|left out|mixed|accident|mean nodes|illness|struggle|injury|mark on that fame|unexpected|large expense|debilitated|under pressure|sudden turn|brings a cut/i.test(line)
    || CAUTION_HI.test(line)
}

function supportLine(line: string): boolean {
  return /rise|supported|happy|stable|usable|lifelong|strengthened|gains|one of the best|exceptionally strong|strongest form|exalted|own sign|moolatrikona|prominent|blessing|Wealth is read|Healing work/i.test(line)
    || SUPPORT_HI.test(line)
}

function hiOrd(n: number): string {
  return `${nadiOrdinal(n, true)} भाव`
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

function fromLines(titleKey: string, lines: readonly string[], idPrefix: string): NadiFinding[] {
  return lines.map((line, index) => ({
    id: `${idPrefix}-${index}`,
    title: titleKey,
    titleKey,
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
  const t = useTranslations('nadi.findings.titles')
  if (items.length === 0) return null
  return (
    <div className={styles.findings}>
      {items.map((item) => (
        <article key={item.id} className={`${styles.finding} ${TONE_CLASS[item.tone]}`}>
          <p className={styles.findingTitle}>{item.titleKey ? t(item.titleKey) : item.title}</p>
          <p className={styles.findingAnswer}>{item.answer}</p>
          {item.reading ? <p className={styles.findingBody}>{item.reading}</p> : null}
          {item.detail ? <p className={styles.findingClassical}>{item.detail}</p> : null}
        </article>
      ))}
    </div>
  )
}

export function Verdict({ title, note, kicker }: { title: string; note?: string | null; kicker?: string }) {
  const t = useTranslations('nadi.findings')
  return (
    <article className={styles.verdict}>
      <p className={styles.kicker}>{kicker ?? t('activeOnChart')}</p>
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

export type NadiJump = 'houses' | 'life' | 'yogas' | 'marriage' | 'career' | 'wealth' | 'future' | 'timing' | 'patel' | 'transits' | 'remedies'

export function NadiActiveBrief({
  reading,
  period,
  onOpen,
}: {
  reading: NadiChartReading
  period: string | null
  onOpen: (view: NadiJump) => void
}) {
  const t = useTranslations('nadi.brief')
  const { hi } = useLang()
  const ord = (n: number) => nadiOrdinal(n, hi)
  const headline = reading.career.lines[0]
    ?? reading.navamshaNotes[0]
    ?? reading.bcp?.lines[0]
    ?? t('fallback')
  const yearLine = reading.bcp
    ? t('yearLine', { year: ord(reading.bcp.runningYear), house: reading.bcp.houseName })
    : null
  const periodLine = period ? t('periodLine', { period }) : null
  const lede = [yearLine, periodLine].filter(Boolean).join(' ')
    || t('lede')

  const chips: { key: string; value: string; view: NadiJump }[] = []
  if (period) chips.push({ key: t('period'), value: period, view: 'timing' })
  chips.push({ key: t('career'), value: t(`priority.${reading.career.priority}`), view: 'career' })
  if (reading.marriageYogas.length > 0) {
    chips.push({
      key: t('marriage'),
      value: reading.marriageYogas.length === 1
        ? t('marriageOne', { n: reading.marriageYogas.length })
        : t('marriageMany', { n: reading.marriageYogas.length }),
      view: 'marriage',
    })
  }
  if (reading.yogas.length > 0) chips.push({ key: t('yogas'), value: String(reading.yogas.length), view: 'yogas' })
  if (reading.bcp) chips.push({ key: t('year'), value: `${reading.bcp.runningYear} · ${reading.bcp.houseName}`, view: 'timing' })
  const ahead = reading.future.years.find((year) => !year.now && year.techniques.length > 1)
  if (ahead) chips.push({ key: t('ahead'), value: `${ahead.year} · ${ahead.houseName}`, view: 'future' })
  chips.push({ key: t('bhrigu'), value: ord(reading.bhriguHouse), view: 'houses' })
  const patelOpen = reading.patel.points.filter((row) => row.running)
  if (patelOpen.length > 0) {
    chips.push({
      key: t('points'),
      value: patelOpen.length === 1 ? patelOpen[0]!.title : t('pointsMany', { n: patelOpen.length }),
      view: 'patel',
    })
  }

  return (
    <section className={styles.brief} aria-label={t('aria')}>
      <p className={styles.kicker}>{t('kicker')}</p>
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
  } else if (view === 'patel') {
    for (const row of reading.patel.points) d1.add(row.house)
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
  if (vargaName === 'D9' && view === 'patel') varga.push(4)
  if (vargaName === 'D10' && (view === 'career' || view === 'chart')) varga.push(1, 10)
  return { d1: [...d1], varga }
}

export function bhriguFindings(reading: NadiChartReading): NadiFinding[] {
  return fromLines('bhrigu', reading.bhriguNotes, 'bhrigu')
}

export function marriagePressureFindings(reading: NadiChartReading): NadiFinding[] {
  return fromLines('marriage', reading.marriageRuleNotes, 'pressure')
}

export function houseSignalFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('saturnRetro', reading.saturnRetroNote ? [reading.saturnRetroNote] : [], 'sa-retro'),
    ...fromLines('retrograde', reading.retrogradeNotes, 'retro'),
    ...fromLines('sun', reading.sunNote ? [reading.sunNote] : [], 'sun'),
  ]
}

export function combinationFindings(reading: NadiChartReading, hi = false): NadiFinding[] {
  return [
    ...reading.parivartana.map((pair) => ({
      id: `ex-${pair.a}-${pair.b}`,
      title: 'Exchange',
      titleKey: 'exchange',
      answer: hi ? `${hiOrd(pair.a)} और ${hiOrd(pair.b)}` : `${ordinal(pair.a)} and ${ordinal(pair.b)}`,
      reading: hi ? 'इन भावों को बल मिलता है।' : 'Those houses are strengthened.',
      tone: 'support' as const,
    })),
    ...reading.links.map((link) => ({
      id: link.id,
      title: 'Lord link',
      titleKey: 'lordLink',
      answer: link.reading,
      tone: 'plain' as const,
    })),
    ...fromLines('wealthLink', reading.wealthNotes, 'wealth-link'),
    ...fromLines('afflicted', reading.afflictedNotes, 'afflicted'),
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
    titleKey: yoga.kind === 'inauspicious' ? 'inauspicious' : 'supportive',
    answer: `${yoga.name} · ${yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart'} · ${yoga.signName}`,
    reading: `${yoga.effect} ${yoga.bearerNote}${yoga.career ? ` Working form: ${yoga.career}` : ''}`,
    tone: yoga.kind === 'inauspicious' ? 'caution' as const : 'support' as const,
  }))
}

export function marriageFindings(reading: NadiChartReading): NadiFinding[] {
  return reading.marriageYogas.map((yoga) => ({
    id: yoga.id,
    title: yoga.chart === 'D9' ? 'Navamsha' : 'Birth chart',
    titleKey: yoga.chart === 'D9' ? 'navamsha' : 'birthChart',
    answer: `${yoga.name} · ${yoga.signName} · ${ordinal(yoga.house)}`,
    reading: yoga.reading,
    tone: toneOf(yoga.reading),
  }))
}

export function careerFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('career', reading.career.lines, 'career'),
    ...fromLines('wealth', reading.career.wealth ? [reading.career.wealth] : [], 'career-wealth'),
    ...fromLines('luck', reading.career.lucky ? [reading.career.lucky] : [], 'career-lucky'),
    ...fromLines('exams', reading.career.exams ? [reading.career.exams] : [], 'career-exams'),
    ...fromLines('career', reading.career.notes, 'career-note'),
    ...fromLines('dashamsha', reading.dashamshaNotes, 'd10'),
    ...fromLines('shashtiamsa', reading.shashtiamsaNotes, 'd60'),
    ...fromLines('neighborhood', reading.neighborhoodNotes, 'near'),
    ...fromLines('uniform', reading.uniformNotes, 'uniform'),
  ]
}

export function wealthFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('wealthYear', reading.wealthTiming, 'wealth'),
    ...reading.snapshots.map((row) => ({
      id: row.id,
      title: 'Snapshot',
      titleKey: 'snapshot',
      answer: row.reading,
      tone: toneOf(row.reading),
    })),
    ...fromLines('wealth', reading.dhanNotes, 'dhan'),
    ...reading.wealthWindows.map((row) => ({
      id: row.id,
      title: row.lordName,
      answer: 'Running now',
      reading: `${row.reason} That sub-period is read as money coming in.`,
      tone: 'support' as const,
    })),
    ...fromLines('property', reading.propertyNotes, 'd4'),
    ...fromLines('vehicle', reading.vehicleNotes, 'd16'),
    ...fromLines('nodes', reading.nodeNote ? [reading.nodeNote] : [], 'nodes'),
  ]
}

export function timingFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('degree', reading.degreeNotes, 'degree'),
    ...fromLines('specialDegree', reading.specialNotes, 'special'),
    ...fromLines('year', reading.yearNotes, 'year-activate'),
    ...fromLines('runningYear', reading.bcp?.lines ?? [], 'bcp'),
    ...fromLines('decisions', reading.decisionNotes, 'decision'),
    ...fromLines('mars', reading.marsSouthNote ? [reading.marsSouthNote] : [], 'mars'),
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
    ...fromLines('pitru', reading.pitruNote ? [reading.pitruNote] : [], 'pitru'),
    ...fromLines('jupiter', reading.jupiterGroups, 'ju-group'),
    ...fromLines('saturn', reading.saturnGroups, 'sa-group'),
    ...fromLines('slowTransit', reading.slowTransitNotes, 'slow'),
    ...fromLines('hardTransit', reading.hardTransitNotes, 'hard'),
    ...fromLines('nodes', reading.nodeNote ? [reading.nodeNote] : [], 'nodes'),
  ]
}

export function remedyFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('gemstone', reading.gemNotes, 'gem'),
    ...fromLines('color', reading.colorNotes, 'color'),
    ...fromLines('health', reading.healthFlags, 'health'),
    ...fromLines('remedy', reading.remedyNotes, 'remedy'),
  ]
}

export function lifeFindings(reading: NadiChartReading): NadiFinding[] {
  return [
    ...fromLines('study', reading.life.education, 'study'),
    ...fromLines('family', reading.life.family, 'family'),
    ...fromLines('settlement', reading.life.settlement, 'settle'),
    ...fromLines('health', reading.healthFlags, 'health-life'),
  ]
}

export function lifeVerdict(reading: NadiChartReading, hi = false): string {
  return reading.life.education[0]
    ?? reading.life.settlement[0]
    ?? reading.life.family[0]
    ?? (hi ? 'पढ़ाई, परिवार और बसना इस कुंडली से पढ़े जाते हैं।' : 'Study, the family, and settlement are read from this chart.')
}

export function placementFindings(reading: NadiChartReading, hi = false): NadiFinding[] {
  return reading.placements.map((row) => {
    if (hi) {
      const rules = row.lordOf.length === 0
        ? 'किसी राशि का स्वामी नहीं'
        : `${row.lordOf.map((house) => nadiOrdinal(house, true)).join(' और ')} भाव का स्वामी`
      const sign = row.naturalHouse === row.house
        ? row.signName
        : `${row.signName}, ${hiOrd(row.naturalHouse)} का स्वभाव`
      return {
        id: `place-${row.id}`,
        title: row.name,
        answer: `${hiOrd(row.house)} · ${sign} · ${rules}`,
        reading: row.prediction,
        detail: [row.classicalHouse, row.classicalSign].filter((line): line is string => !!line).join(' '),
        tone: toneOf(row.prediction),
      }
    }
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

export function housesVerdict(reading: NadiChartReading, hi = false): string {
  const house = reading.houses.find((row) => row.house === reading.bhriguHouse)
  const first = house?.prediction.split(/(?<=[.।])\s/)[0]
  return first || reading.bhriguNotes[0] || (hi ? 'भृगु भाव लग्न राशि से पढ़ा जाता है।' : 'The Bhrigu Bhava is read from the lagna sign.')
}

export function yogasVerdict(reading: NadiChartReading, hi = false): string {
  const hard = reading.yogas.filter((yoga) => yoga.kind === 'inauspicious').length
  const soft = reading.yogas.filter((yoga) => yoga.kind === 'supportive').length
  if (hard === 0 && soft === 0 && reading.dusthanaNotes.length === 0) {
    return hi ? 'इस समूह का कोई योग कुंडली में नहीं है।' : 'No combination from this set is on the chart.'
  }
  if (hi) {
    const partsHi = [
      hard > 0 ? `${hard} अशुभ` : '',
      soft > 0 ? `${soft} सहायक` : '',
      reading.dusthanaNotes.length > 0 ? 'दुःस्थान में गरिमा उलटी है' : '',
    ].filter(Boolean)
    return `${partsHi.join(', ')}।`
  }
  const parts = [
    hard > 0 ? `${hard} inauspicious` : '',
    soft > 0 ? `${soft} supportive` : '',
    reading.dusthanaNotes.length > 0 ? 'dusthana dignity is reversed' : '',
  ].filter(Boolean)
  return `${parts.join(', ')}.`
}

export function marriageVerdict(reading: NadiChartReading, hi = false): string {
  const yoga = reading.marriageYogas[0]
  if (yoga) return hi ? `${yoga.name}। ${yoga.reading}` : `${yoga.name}. ${yoga.reading}`
  return reading.navamshaNotes[0] ?? (hi ? 'इस समूह का कोई विवाह योग कुंडली में नहीं है।' : 'No marriage combination from this set is on the chart.')
}

export function careerVerdict(reading: NadiChartReading, hi = false): string {
  return reading.career.lines[0] ?? (hi ? 'करियर दसवें भाव से पढ़ा जाता है।' : 'Career is read from the 10th.')
}

export function wealthVerdict(reading: NadiChartReading, hi = false): string {
  return reading.wealthTiming[0]
    ?? reading.snapshots[0]?.reading
    ?? reading.wealthWindows[0]?.reason
    ?? (hi ? 'इस समूह का कोई धन वर्ष कुंडली में चिह्नित नहीं है।' : 'No wealth year from this set is marked on the chart.')
}

export function futureVerdict(reading: NadiChartReading, hi = false): string {
  const years = reading.future.years
  const open = years.find((year) => year.now && year.techniques.length > 1)
    ?? years.find((year) => year.techniques.length > 1)
    ?? years.find((year) => year.now)
    ?? years[0]
  if (open?.lines[0]) return open.lines[0]
  const period = reading.future.periods.find((row) => row.lines.length > 0) ?? reading.future.periods[0]
  if (period) return period.lines[0] ?? period.title
  return hi ? 'आने वाला कोई वर्ष चिह्नित नहीं है। जन्म तिथि से वर्ष-गणना खुलती है।' : 'No coming year is marked. A birth date opens the year-count.'
}

export function patelFindings(reading: NadiChartReading, hi = false): NadiFinding[] {
  return [
    ...reading.patel.points.map((row) => ({
      id: row.id,
      title: row.title,
      answer: `${row.signName} · ${row.lordName}${row.running ? (hi ? ' · दशा खुली है' : ' · period open') : ''}`,
      reading: row.reading,
      tone: (row.running ? 'caution' : 'plain') as NadiTone,
    })),
    ...fromLines('watched', reading.patel.lines, 'patel'),
  ]
}

export function patelVerdict(reading: NadiChartReading, hi = false): string {
  const open = reading.patel.points.find((row) => row.running)
  return open?.reading
    ?? reading.patel.lines[0]
    ?? reading.patel.points[0]?.reading
    ?? (hi ? 'ये बिंदु लग्न और चंद्र से पढ़े जाते हैं।' : 'These points are read from the lagna and the Moon.')
}

export function timingVerdict(reading: NadiChartReading, hi = false): string {
  return reading.bcp?.lines[0]
    ?? reading.degreeNotes[0]
    ?? reading.decisionNotes[0]
    ?? (hi ? 'इस कुंडली में कोई चल रहा वर्ष चिह्नित नहीं है।' : 'No running year is marked on this chart.')
}

export function transitVerdict(reading: NadiChartReading, hi = false): string {
  return reading.hardTransitNotes[0]
    ?? reading.jupiterGroups[0]
    ?? reading.saturnGroups[0]
    ?? reading.slowTransitNotes[0]
    ?? reading.pitruNote
    ?? (hi ? 'कोई समूहित गोचर सक्रिय नहीं है। संदर्भ सूची नीचे है।' : 'No grouped transit is active. The reference list is below.')
}

export function remedyVerdict(reading: NadiChartReading, hi = false): string {
  return reading.gemNotes[0] ?? (hi ? 'इस कुंडली से कोई रत्न विशेष रूप से नहीं चुना गया।' : 'No stone from this chart is singled out.')
}
