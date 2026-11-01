// ─────────────────────────────────────────────────────────────
//  src/lib/panchang/day-reading.ts
//  General day prediction assembled from the classical limb tables.
//  Not personal: natal readings live in src/lib/engine/todayPredictions.ts
// ─────────────────────────────────────────────────────────────

import { getKaranaMeta } from '@/lib/engine/karanaMeta'
import { getAshwiniYogaNotes, getNakshatraMuhurtaMeta } from '@/lib/engine/nakshatraMuhurta'
import { getTithiDayMeta, type TithiDayMeta } from '@/lib/engine/tithiMeta'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { getYogaMeta } from '@/lib/engine/yogaMeta'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import type { PanchangDayTimeline, TimelineSegment } from './day-timeline'

export type DayTone = 'favourable' | 'mixed' | 'cautious'

export type DayLimb = 'Tithi' | 'Nakshatra' | 'Yoga' | 'Karana' | 'Vara' | 'Special yoga'

export interface DayReadingLine {
  limb: DayLimb
  text: string
}

export interface DaySignal {
  label: string
  positive: boolean
}

export interface DayShift {
  limb: DayLimb
  at: string
  from: string
  to: string
  guidance: string | null
  caution: boolean
}

export interface DayReading {
  tone: DayTone
  signals: DaySignal[]
  guidance: string[]
  favours: DayReadingLine[]
  cautions: DayReadingLine[]
  shifts: DayShift[]
}

export interface DayReadingInput {
  tithiNumber: number
  nakshatraIndex: number
  nakshatraPada: number
  yogaName: string
  karanaName: string
  varaNumber: number
  timeline?: PanchangDayTimeline
}

function tithiMetaByName(name: string): TithiDayMeta | null {
  for (let n = 1; n <= 30; n++) {
    const meta = getTithiDayMeta(n)
    if (meta.name === name) return meta
  }
  return null
}

/** Segments overlapping sunrise-to-sunset, the part of the day most activity is planned around. */
function daylightSegments(segments: TimelineSegment[], timeline: PanchangDayTimeline): TimelineSegment[] {
  const sunrise = new Date(timeline.sunrise).getTime()
  const sunset = new Date(timeline.sunset).getTime()
  return segments.filter((s) => new Date(s.start).getTime() < sunset && new Date(s.end).getTime() > sunrise)
}

function isCautionTithi(meta: TithiDayMeta | null): boolean {
  return meta?.group.nature === 'ashubh'
}

function isCautionYoga(name: string): boolean {
  return getYogaMeta(name)?.quality === 'inauspicious'
}

function isBhadraKarana(name: string): boolean {
  return getKaranaMeta(name)?.isBhadra ?? false
}

function collectShifts(timeline: PanchangDayTimeline): DayShift[] {
  const limbs: Array<{
    limb: DayLimb
    segments: TimelineSegment[]
    guidance: (label: string) => string | null
    caution: (label: string) => boolean
  }> = [
    {
      limb: 'Tithi',
      segments: timeline.tithi,
      guidance: (label) => tithiMetaByName(label)?.group.dayGuidance ?? null,
      caution: (label) => isCautionTithi(tithiMetaByName(label)),
    },
    {
      limb: 'Nakshatra',
      segments: timeline.nakshatra,
      guidance: (label) => {
        const index = NAKSHATRA_NAMES.indexOf(label)
        return index >= 0 ? `Good for ${getNakshatraMuhurtaMeta(index).group.goodFor}.` : null
      },
      caution: () => false,
    },
    {
      limb: 'Yoga',
      segments: timeline.yoga,
      guidance: (label) => getYogaMeta(label)?.dayGuidance ?? null,
      caution: isCautionYoga,
    },
    {
      limb: 'Karana',
      segments: timeline.karana,
      guidance: (label) => getKaranaMeta(label)?.dayGuidance ?? null,
      caution: isBhadraKarana,
    },
  ]

  const sunset = new Date(timeline.sunset).getTime()
  const shifts: DayShift[] = []
  for (const { limb, segments, guidance, caution } of limbs) {
    const daylight = daylightSegments(segments, timeline)
    daylight.slice(1).forEach((seg, i) => {
      if (new Date(seg.start).getTime() >= sunset) return
      shifts.push({
        limb,
        at: seg.start,
        from: daylight[i].label,
        to: seg.label,
        guidance: guidance(seg.label),
        caution: caution(seg.label),
      })
    })
  }
  return shifts.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

function dayTone(signals: DaySignal[], hasVishYoga: boolean): DayTone {
  const negatives = signals.filter((s) => !s.positive).length
  const positives = signals.length - negatives
  if (hasVishYoga || negatives >= 2 || negatives > positives) return 'cautious'
  if (negatives === 0 && positives > 0) return 'favourable'
  return 'mixed'
}

export function buildDayReading(input: DayReadingInput): DayReading {
  const tithi = getTithiDayMeta(input.tithiNumber)
  const nakshatra = getNakshatraMuhurtaMeta(input.nakshatraIndex, input.nakshatraPada)
  const yoga = getYogaMeta(input.yogaName)
  const karana = getKaranaMeta(input.karanaName)
  const vara = getVaarMeta(input.varaNumber)
  const specials = getAshwiniYogaNotes(input.nakshatraIndex, input.varaNumber, input.tithiNumber)

  const signals: DaySignal[] = []
  if (tithi.group.nature === 'shubh') signals.push({ label: `${tithi.name}, a ${tithi.group.id} tithi`, positive: true })
  if (yoga?.quality === 'auspicious') signals.push({ label: `${yoga.name} yoga`, positive: true })
  for (const note of specials) {
    if (note.quality === 'auspicious') signals.push({ label: note.label, positive: true })
    if (note.quality === 'inauspicious') signals.push({ label: note.label, positive: false })
  }

  // Cautions count if they touch daylight at all, even when noon falls outside them
  const tithiLabels = input.timeline ? daylightSegments(input.timeline.tithi, input.timeline).map((s) => s.label) : [tithi.name]
  const yogaLabels = input.timeline ? daylightSegments(input.timeline.yoga, input.timeline).map((s) => s.label) : [input.yogaName]
  const karanaLabels = input.timeline ? daylightSegments(input.timeline.karana, input.timeline).map((s) => s.label) : [input.karanaName]
  const cautionTithi = tithiLabels.find((label) => isCautionTithi(tithiMetaByName(label)))
    ?? (isCautionTithi(tithi) ? tithi.name : undefined)
  if (cautionTithi) signals.push({ label: `${cautionTithi}, a ${tithiMetaByName(cautionTithi)?.group.id ?? 'Rikta'} tithi`, positive: false })
  const cautionYoga = yogaLabels.find(isCautionYoga)
  if (cautionYoga) signals.push({ label: `${cautionYoga} yoga`, positive: false })
  const bhadra = karanaLabels.find(isBhadraKarana)
  if (bhadra) signals.push({ label: `${bhadra} karana (Bhadra)`, positive: false })

  const favours: DayReadingLine[] = [
    { limb: 'Tithi', text: tithi.bestFor },
    { limb: 'Nakshatra', text: nakshatra.group.goodFor },
    ...(yoga ? [{ limb: 'Yoga' as const, text: yoga.bestFor }] : []),
    { limb: 'Vara', text: vara.bestFor },
    ...specials
      .filter((n) => n.quality !== 'inauspicious')
      .map((n) => ({ limb: 'Special yoga' as const, text: `${n.label}: ${n.detail}` })),
  ]

  const cautions: DayReadingLine[] = [
    ...(yoga ? [{ limb: 'Yoga' as const, text: yoga.challenge }] : []),
    ...(karana ? [{ limb: 'Karana' as const, text: karana.challenge }] : []),
    { limb: 'Vara', text: vara.challenge },
    ...specials
      .filter((n) => n.quality === 'inauspicious')
      .map((n) => ({ limb: 'Special yoga' as const, text: `${n.label}: ${n.detail}` })),
  ]

  return {
    tone: dayTone(signals, specials.some((n) => n.id === 'vish_yoga')),
    signals,
    guidance: [tithi.group.dayGuidance, yoga?.dayGuidance, karana?.dayGuidance, vara.dayGuidance]
      .filter((g): g is string => Boolean(g)),
    favours,
    cautions,
    shifts: input.timeline ? collectShifts(input.timeline) : [],
  }
}
