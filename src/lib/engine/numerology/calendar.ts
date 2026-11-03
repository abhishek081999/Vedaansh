// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/calendar.ts
//  Yearly numerology calendar — personal day ratings for every
//  date, optionally overlaid with the sunrise tithi, and an
//  all-day ICS export.
// ─────────────────────────────────────────────────────────────

import type { ParsedDate } from './core'
import { NUMBER_PROFILES, PERSONAL_YEAR_THEMES, type CoreNumber } from './data'
import { buildMonthCalendar, type MonthDayCell } from './advanced'

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
]

export function tithiLabel(tithi: number): string {
  if (tithi === 15) return 'Shukla Purnima'
  if (tithi === 30) return 'Krishna Amavasya'
  const paksha = tithi <= 15 ? 'Shukla' : 'Krishna'
  return `${paksha} ${TITHI_NAMES[(tithi - 1) % 15]}`
}

/** Rikta tithis (4, 9, 14 of each paksha) are avoided for new starts. */
export function isRiktaTithi(tithi: number): boolean {
  return [4, 9, 14].includes(((tithi - 1) % 15) + 1)
}

export interface NumerologyCalendarDay extends MonthDayCell {
  /** Tithi 1–30 at local sunrise, when supplied. */
  tithi: number | null
  tithiName: string | null
  rikta: boolean
}

/** Tithi is optional so the calendar works without ephemeris (client) and with it (server). */
export function buildNumerologyYear(input: {
  year: number
  birth: ParsedDate
  moolank: CoreNumber
  bhagyank: CoreNumber
  tithiFor?: (isoDate: string) => number | null
}): NumerologyCalendarDay[] {
  const out: NumerologyCalendarDay[] = []
  for (let month = 1; month <= 12; month++) {
    for (const cell of buildMonthCalendar({ year: input.year, month, birth: input.birth, moolank: input.moolank, bhagyank: input.bhagyank })) {
      const tithi = input.tithiFor?.(cell.date) ?? null
      const rikta = tithi !== null && isRiktaTithi(tithi)
      // A Rikta tithi softens an otherwise best day for new starts.
      const label = rikta && cell.label === 'best' ? 'good' : cell.label
      out.push({ ...cell, label, tithi, tithiName: tithi !== null ? tithiLabel(tithi) : null, rikta })
    }
  }
  return out
}

// ── ICS ───────────────────────────────────────────────────────

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** RFC 5545 line folding at 75 octets. */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (size + n > (parts.length === 0 ? 75 : 74)) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const LABEL_TEXT: Record<MonthDayCell['label'], string> = {
  best: '★ Best',
  good: 'Good',
  neutral: 'Neutral',
  caution: '⚠ Caution',
}

export function buildNumerologyIcs(days: NumerologyCalendarDay[], opts: {
  calName: string
  include: 'highlights' | 'all'
  /** Distinguishes one person's events from another's when both are imported. */
  uidKey: string
  stamp?: Date
}): string {
  const now = (opts.stamp ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vedaansh//Numerology//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(opts.calName)}`,
  ]
  for (const d of days) {
    if (opts.include === 'highlights' && d.label !== 'best' && d.label !== 'caution') continue
    const p = NUMBER_PROFILES[d.personalDay]
    const start = d.date.replace(/-/g, '')
    const next = new Date(`${d.date}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    const end = next.toISOString().slice(0, 10).replace(/-/g, '')
    const flags = [d.isPower ? 'Power day' : null, d.isDestiny ? 'Destiny day' : null].filter(Boolean).join(' · ')
    const summary = `${LABEL_TEXT[d.label]} · PD ${d.personalDay}${d.tithiName ? ` · ${d.tithiName}` : ''}`
    const description = [
      `Personal day ${d.personalDay} (${p.planet}) — ${PERSONAL_YEAR_THEMES[d.personalDay].theme}.`,
      PERSONAL_YEAR_THEMES[d.personalDay].guidance,
      `Universal day ${d.universalDay}. Harmony with Moolank: ${d.harmony}.`,
      flags || null,
      d.tithiName ? `Tithi at sunrise: ${d.tithiName}${d.rikta ? ' (Rikta — avoid new starts)' : ''}.` : null,
      `Colours: ${p.luckyColors.join(', ')}.`,
    ].filter(Boolean).join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:numerology-${opts.uidKey}-${start}@vedaansh`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
