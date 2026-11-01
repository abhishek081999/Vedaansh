import { fromZonedTime } from 'date-fns-tz'
import { resolveTimezone } from '@/lib/geo/timezone'

/** Stored chart fields the audit reads. Values are unknown because they come straight from the database. */
export interface ChartTimezoneFields {
  birthDate?: unknown
  birthTime?: unknown
  latitude?: unknown
  longitude?: unknown
  timezone?: unknown
}

export type InvalidReason = 'coordinates' | 'birth-datetime' | 'stored-zone'

export type TimezoneCheck =
  | { status: 'match' }
  | { status: 'mismatch'; stored: string; expected: string; shiftMinutes: number }
  | { status: 'invalid'; reason: InvalidReason }

export interface MismatchGroup {
  stored: string
  expected: string
  minShiftMinutes: number
  maxShiftMinutes: number
  chartIds: string[]
}

export interface TimezoneAuditReport {
  total: number
  matching: number
  mismatches: Map<string, MismatchGroup>
  invalid: Record<InvalidReason, string[]>
}

/** Same parsing as localToUTC in the chart calculate route, so the audit sees the instant the app computed. */
function birthInstant(birthDate: string, birthTime: string, zone: string): number {
  const time = /^\d{2}:\d{2}:\d{2}$/.test(birthTime) ? birthTime : `${birthTime}:00`
  return fromZonedTime(`${birthDate}T${time}`, zone).getTime()
}

/**
 * Compares the stored zone with the zone for the chart's coordinates at the birth moment.
 * Zones that give the same UTC instant match, so aliases such as Asia/Calcutta and
 * Asia/Kolkata, and zones that only agreed historically, are not flagged.
 * shiftMinutes is stored instant minus expected instant.
 */
export function checkChartTimezone(chart: ChartTimezoneFields): TimezoneCheck {
  const { birthDate, birthTime, latitude, longitude, timezone } = chart

  // resolveTimezone answers 'UTC' for bad coordinates, which would read as a real expected zone
  if (
    typeof latitude !== 'number' || typeof longitude !== 'number' ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180
  ) {
    return { status: 'invalid', reason: 'coordinates' }
  }

  if (
    typeof birthDate !== 'string' || typeof birthTime !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^\d{2}:\d{2}(:\d{2})?$/.test(birthTime)
  ) {
    return { status: 'invalid', reason: 'birth-datetime' }
  }

  const expected = resolveTimezone(latitude, longitude)
  const expectedInstant = birthInstant(birthDate, birthTime, expected)
  if (Number.isNaN(expectedInstant)) return { status: 'invalid', reason: 'birth-datetime' }

  // An empty zone must not reach date-fns-tz: it silently uses the machine's own zone
  if (typeof timezone !== 'string' || !timezone.trim()) return { status: 'invalid', reason: 'stored-zone' }
  const storedInstant = birthInstant(birthDate, birthTime, timezone)
  if (Number.isNaN(storedInstant)) return { status: 'invalid', reason: 'stored-zone' }

  if (storedInstant === expectedInstant) return { status: 'match' }
  return {
    status: 'mismatch',
    stored: timezone,
    expected,
    shiftMinutes: Math.round((storedInstant - expectedInstant) / 6_000) / 10,
  }
}

export function createTimezoneAuditReport(): TimezoneAuditReport {
  return {
    total: 0,
    matching: 0,
    mismatches: new Map(),
    invalid: { coordinates: [], 'birth-datetime': [], 'stored-zone': [] },
  }
}

export function addToTimezoneAudit(report: TimezoneAuditReport, chartId: string, chart: ChartTimezoneFields): void {
  report.total++
  const check = checkChartTimezone(chart)

  if (check.status === 'match') {
    report.matching++
  } else if (check.status === 'invalid') {
    report.invalid[check.reason].push(chartId)
  } else {
    const key = `${check.stored}\u0000${check.expected}`
    const group = report.mismatches.get(key)
    if (group) {
      group.chartIds.push(chartId)
      group.minShiftMinutes = Math.min(group.minShiftMinutes, check.shiftMinutes)
      group.maxShiftMinutes = Math.max(group.maxShiftMinutes, check.shiftMinutes)
    } else {
      report.mismatches.set(key, {
        stored: check.stored,
        expected: check.expected,
        minShiftMinutes: check.shiftMinutes,
        maxShiftMinutes: check.shiftMinutes,
        chartIds: [chartId],
      })
    }
  }
}

/** Counts, zones, shift sizes and chart ids only. Names, places and birth data never reach the report. */
export function formatTimezoneAudit(report: TimezoneAuditReport): string {
  const groups = [...report.mismatches.values()].sort((a, b) => b.chartIds.length - a.chartIds.length)
  const mismatched = groups.reduce((sum, group) => sum + group.chartIds.length, 0)
  const lines = [
    `Charts checked: ${report.total}`,
    `Matching:       ${report.matching}`,
    `Mismatched:     ${mismatched}`,
    `Not comparable: ${Object.values(report.invalid).reduce((sum, ids) => sum + ids.length, 0)}`,
  ]

  if (groups.length) {
    lines.push('', 'Mismatches by stored -> expected zone (shift in minutes, stored minus expected instant):')
    for (const group of groups) {
      lines.push(
        `${group.chartIds.length}\t${group.stored} -> ${group.expected}\tshift ${group.minShiftMinutes} to ${group.maxShiftMinutes}`,
      )
    }
    for (const group of groups) {
      lines.push('', `${group.stored} -> ${group.expected}:`, ...group.chartIds)
    }
  }

  for (const [reason, ids] of Object.entries(report.invalid)) {
    if (ids.length) lines.push('', `Not comparable, invalid ${reason}:`, ...ids)
  }
  return lines.join('\n')
}
